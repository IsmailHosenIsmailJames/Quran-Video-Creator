import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { BrowserWindow } from 'electron';
import { VideoTemplateConfig, AyahSequenceData, QuranVideoCompositionProps } from '../../shared/types';

class RemotionRunnerService {
  private activeJobs = new Map<string, { cancel: () => void }>();

  private resolveEntryPoint(): string {
    const devPath = path.join(process.cwd(), 'src/remotion/index.ts');
    if (fs.existsSync(devPath)) {
      return devPath;
    }
    const distPath = path.resolve(__dirname, '../remotion/index.js');
    if (fs.existsSync(distPath)) {
      return distPath;
    }
    return devPath;
  }

  public async renderVideo(
    jobId: string,
    config: VideoTemplateConfig,
    ayahs: AyahSequenceData[],
    totalDurationInFrames: number,
    outputPath: string,
    mainWindow: BrowserWindow
  ): Promise<void> {
    const entryPoint = this.resolveEntryPoint();

    // 1. Bundle Remotion Composition
    mainWindow.webContents.send('render:progress', {
      jobId,
      progress: 0.02,
      status: 'rendering',
    });

    const { cancelSignal, cancel } = require('@remotion/renderer').makeCancelSignal();
    let isCancelled = false;

    this.activeJobs.set(jobId, {
      cancel: () => {
        isCancelled = true;
        try {
          cancel();
        } catch (e) {
          // ignore
        }
      },
    });

    try {
      const bundleLocation = await bundle({
        entryPoint,
        publicDir: path.resolve('public'),
        onProgress: (progress) => {
          if (isCancelled) return;
          mainWindow.webContents.send('render:progress', {
            jobId,
            progress: progress * 0.1, // First 10% is bundling
            status: 'rendering',
          });
        },
      });

      if (isCancelled) {
        this.activeJobs.delete(jobId);
        mainWindow.webContents.send('render:progress', {
          jobId,
          progress: 0,
          status: 'cancelled',
        });
        return;
      }

      const inputProps: QuranVideoCompositionProps = {
        config,
        ayahs,
        totalDurationInFrames,
      };

      // 2. Select Composition
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: 'QuranVideo',
        inputProps: inputProps as unknown as Record<string, unknown>,
      });

      // 3. Render MP4 Media
      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps: inputProps as unknown as Record<string, unknown>,
        crf: config.resolution === '4k' ? 18 : 22,
        cancelSignal,
        chromiumOptions: {
          enableMultiProcessOnLinux: true,
        },
        onProgress: ({ renderedFrames, renderEstimatedTime }) => {
          if (isCancelled) return;
          const progress = 0.1 + (renderedFrames / totalDurationInFrames) * 0.9;
          mainWindow.webContents.send('render:progress', {
            jobId,
            progress: Math.min(0.99, progress),
            currentFrame: renderedFrames,
            totalFrames: totalDurationInFrames,
            renderEstimatedTime,
            status: 'rendering',
          });
        },
      });

      this.activeJobs.delete(jobId);
      mainWindow.webContents.send('render:progress', {
        jobId,
        progress: 1.0,
        currentFrame: totalDurationInFrames,
        totalFrames: totalDurationInFrames,
        status: 'completed',
      });
    } catch (err: any) {
      this.activeJobs.delete(jobId);
      const isUserCancel = isCancelled || err?.message?.includes('cancelled');
      mainWindow.webContents.send('render:progress', {
        jobId,
        progress: 0,
        status: isUserCancel ? 'cancelled' : 'failed',
        error: err?.message || 'Rendering failed',
      });
      if (!isUserCancel) {
        console.error('Render error:', err);
      }
    }
  }

  public cancelRender(jobId: string): void {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.cancel();
      this.activeJobs.delete(jobId);
    }
  }
}

export const remotionRunner = new RemotionRunnerService();
