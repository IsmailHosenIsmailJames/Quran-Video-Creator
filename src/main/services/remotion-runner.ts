import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition, ensureBrowser } from '@remotion/renderer';
import { BrowserWindow, app } from 'electron';
import { VideoTemplateConfig, AyahSequenceData, QuranVideoCompositionProps } from '../../shared/types';
import { localMediaServer } from './local-media-server';
import { recitationService } from './recitation-service';

class RemotionRunnerService {
  private activeJobs = new Map<string, { cancel: () => void }>();

  private ensureSafeWorkingDirectory(): void {
    try {
      if (process.cwd() === '/' || (app && app.isPackaged)) {
        const targetDir = app
          ? app.getPath('userData')
          : path.join(process.env.HOME || '', '.quran-video-creator');
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        process.chdir(targetDir);
      }
    } catch (err) {
      console.warn('[RemotionRunner] Could not chdir:', err);
    }
  }

  private findHeadlessShellInDir(baseDir: string): string | null {
    if (!fs.existsSync(baseDir)) return null;

    const platform = process.platform === 'darwin'
      ? (process.arch === 'arm64' ? 'mac-arm64' : 'mac-x64')
      : process.platform === 'win32'
      ? 'win64'
      : (process.arch === 'arm64' ? 'linux-arm64' : 'linux64');

    const exeName = process.platform === 'win32' ? 'chrome-headless-shell.exe' : 'chrome-headless-shell';

    const candidates = [
      path.join(baseDir, 'chrome-headless-shell', platform, `chrome-headless-shell-${platform}`, exeName),
      path.join(baseDir, 'chrome-headless-shell', platform, `chrome-headless-shell-${platform}`, 'headless_shell'),
      path.join(baseDir, platform, `chrome-headless-shell-${platform}`, exeName),
      path.join(baseDir, `chrome-headless-shell-${platform}`, exeName),
      path.join(baseDir, exeName),
    ];

    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        if (process.platform !== 'win32') {
          try {
            fs.chmodSync(cand, 0o755);
          } catch {}
        }
        return cand;
      }
    }

    return null;
  }

  private findSystemBrowser(): string | null {
    const candidates: string[] = [];

    if (process.platform === 'darwin') {
      candidates.push(
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        path.join(process.env.HOME || '', 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
      );
    } else if (process.platform === 'win32') {
      const localApp = process.env.LOCALAPPDATA || '';
      const progFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
      const progFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';

      candidates.push(
        path.join(progFiles, 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(progFilesX86, 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(localApp, 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(progFiles, 'Microsoft\\Edge\\Application\\msedge.exe'),
        path.join(progFilesX86, 'Microsoft\\Edge\\Application\\msedge.exe')
      );
    } else if (process.platform === 'linux') {
      candidates.push(
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/snap/bin/chromium'
      );
    }

    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        return cand;
      }
    }

    return null;
  }

  private getBinariesDirectory(): string | undefined {
    if (!app?.isPackaged) return undefined;

    const platformArch = process.platform === 'darwin'
      ? (process.arch === 'arm64' ? 'compositor-darwin-arm64' : 'compositor-darwin-x64')
      : process.platform === 'win32'
      ? 'compositor-win32-x64-msvc'
      : (process.arch === 'arm64' ? 'compositor-linux-arm64-gnu' : 'compositor-linux-x64-gnu');

    const candidates = [
      path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '@remotion', platformArch),
      path.join(app.getAppPath(), '..', 'app.asar.unpacked', 'node_modules', '@remotion', platformArch),
      path.join(process.resourcesPath, 'node_modules', '@remotion', platformArch),
    ];

    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        if (process.platform !== 'win32') {
          for (const bin of ['ffmpeg', 'ffprobe', 'remotion']) {
            const p = path.join(cand, bin);
            if (fs.existsSync(p)) {
              try { fs.chmodSync(p, 0o755); } catch {}
            }
          }
        }
        return cand;
      }
    }

    return undefined;
  }

  private async resolveBrowserExecutable(
    jobId: string,
    mainWindow: BrowserWindow
  ): Promise<string> {
    this.ensureSafeWorkingDirectory();

    // 1. Check packaged extraResources or asar.unpacked
    if (app?.isPackaged) {
      const packagedSearchDirs = [
        path.join(process.resourcesPath, '.remotion'),
        path.join(process.resourcesPath, 'chrome-headless-shell'),
        path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '.remotion'),
      ];
      for (const dir of packagedSearchDirs) {
        const found = this.findHeadlessShellInDir(dir);
        if (found) {
          console.log(`[RemotionRunner] Using packaged headless browser: ${found}`);
          return found;
        }
      }
    }

    // 2. Previously downloaded headless shell in userData/.remotion
    if (app) {
      const userDataDir = path.join(app.getPath('userData'), '.remotion');
      const foundInUserData = this.findHeadlessShellInDir(userDataDir);
      if (foundInUserData) {
        console.log(`[RemotionRunner] Using cached headless browser in userData: ${foundInUserData}`);
        return foundInUserData;
      }
    }

    // 3. Dev node_modules/.remotion
    const devRemotion = path.join(process.cwd(), 'node_modules/.remotion');
    const foundInDev = this.findHeadlessShellInDir(devRemotion);
    if (foundInDev) {
      console.log(`[RemotionRunner] Using development headless browser: ${foundInDev}`);
      return foundInDev;
    }

    // 4. System browser (Google Chrome / Chromium)
    const systemBrowser = this.findSystemBrowser();
    if (systemBrowser) {
      console.log(`[RemotionRunner] Using detected system browser: ${systemBrowser}`);
      return systemBrowser;
    }

    // 5. Download headless shell to userData/.remotion safely
    console.log('[RemotionRunner] No local browser found. Downloading Chrome Headless Shell...');
    mainWindow.webContents.send('render:progress', {
      jobId,
      progress: 0.03,
      status: 'rendering',
      message: 'Downloading Chrome render engine...',
    });

    const result = await ensureBrowser({
      chromeMode: 'headless-shell',
      onBrowserDownload: () => ({
        version: null,
        onProgress: ({ percent }) => {
          mainWindow.webContents.send('render:progress', {
            jobId,
            progress: 0.03 + (percent * 0.07),
            status: 'rendering',
            message: `Downloading Chrome render engine (${Math.round(percent * 100)}%)...`,
          });
        },
      }),
    });

    if (result && 'path' in result && result.path && fs.existsSync(result.path)) {
      if (process.platform !== 'win32') {
        try { fs.chmodSync(result.path, 0o755); } catch {}
      }
      return result.path;
    }

    throw new Error('Unable to find or download Chromium headless browser for video export.');
  }

  private getPrebundledPath(): string | null {
    const candidates = [
      // Packaged extraResources location
      path.join(process.resourcesPath, 'remotion-bundle'),
      // Packaged app.asar.unpacked / dist location
      path.join(app ? app.getAppPath() : process.cwd(), 'dist/remotion-bundle'),
      path.join(process.cwd(), 'dist/remotion-bundle'),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'index.html'))) {
        return candidate;
      }
    }
    return null;
  }

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
      const prebundled = this.getPrebundledPath();
      let bundleLocation: string;

      if (app?.isPackaged && prebundled) {
        bundleLocation = prebundled;
        mainWindow.webContents.send('render:progress', {
          jobId,
          progress: 0.1,
          status: 'rendering',
        });
      } else if (prebundled && !fs.existsSync(path.join(process.cwd(), 'src/remotion/index.ts'))) {
        bundleLocation = prebundled;
        mainWindow.webContents.send('render:progress', {
          jobId,
          progress: 0.1,
          status: 'rendering',
        });
      } else {
        const entryPoint = this.resolveEntryPoint();
        bundleLocation = await bundle({
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
      }

      if (isCancelled) {
        this.activeJobs.delete(jobId);
        mainWindow.webContents.send('render:progress', {
          jobId,
          progress: 0,
          status: 'cancelled',
        });
        return;
      }

      // Ensure local media streaming server is active so headless Chromium can fetch custom videos and audio
      await localMediaServer.start();

      const probeDuration = async (filePath?: string | null): Promise<number | undefined> => {
        try {
          if (!filePath) return undefined;
          let cleanPath = filePath;
          if (cleanPath.startsWith('app-media://local/')) {
            cleanPath = cleanPath.slice('app-media://local/'.length);
          } else if (cleanPath.startsWith('app-media://')) {
            cleanPath = cleanPath.replace(/^app-media:\/\/(\/)?/, '');
          }
          cleanPath = decodeURIComponent(cleanPath);
          if (!fs.existsSync(cleanPath)) return undefined;
          const { Input, FilePathSource, ALL_FORMATS } = require('mediabunny');
          const input = new Input({
            formats: ALL_FORMATS,
            source: new FilePathSource(cleanPath),
          });
          const duration = await input.computeDuration();
          return typeof duration === 'number' && !isNaN(duration) && duration > 0 ? duration : undefined;
        } catch {
          return undefined;
        }
      };

      // Guarantee every video clip has a deterministic pre-probed duration before rendering
      const preparedClips = await Promise.all(
        (config.backgroundClips || []).map(async (clip) => {
          let duration = clip.sourceDurationSeconds;
          const isVideo = clip.type === 'video' || /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(clip.source);
          if (isVideo && (!duration || duration <= 0)) {
            duration = await probeDuration(clip.source);
          }
          return {
            ...clip,
            sourceDurationSeconds: duration,
            source: localMediaServer.getMediaUrl(clip.source),
          };
        })
      );

      if (preparedClips.length === 0 && config.backgroundPath) {
        const isVideo = config.backgroundType === 'video' || /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(config.backgroundPath);
        const duration = isVideo ? await probeDuration(config.backgroundPath) : undefined;
        preparedClips.push({
          id: 'single',
          type: config.backgroundType,
          source: localMediaServer.getMediaUrl(config.backgroundPath),
          name: 'Single Background',
          percentage: 100,
          durationRatio: 1,
          speed: 1,
          autoFitSpeed: true,
          sourceDurationSeconds: duration,
          trimStartSeconds: 0,
          kenBurns: config.kenBurnsEffect,
          transition: 'cut',
          transitionDurationFrames: 0,
        });
      }

      // Sanitize logo path if present
      let sanitizedLogoPath: string | undefined = undefined;
      if (config.logoPath) {
        let cleanLogo = config.logoPath;
        if (cleanLogo.startsWith('app-media://local/')) {
          cleanLogo = cleanLogo.slice('app-media://local/'.length);
        } else if (cleanLogo.startsWith('app-media://')) {
          cleanLogo = cleanLogo.replace(/^app-media:\/\/(\/)?/, '');
        }
        cleanLogo = decodeURIComponent(cleanLogo);
        if (cleanLogo.startsWith('http://') || cleanLogo.startsWith('https://') || cleanLogo.startsWith('data:')) {
          sanitizedLogoPath = cleanLogo;
        } else if (fs.existsSync(cleanLogo)) {
          sanitizedLogoPath = localMediaServer.getMediaUrl(cleanLogo);
        } else {
          console.warn(`[RemotionRunner] Logo file not found on disk, ignoring: ${cleanLogo}`);
          sanitizedLogoPath = undefined;
        }
      }

      let sanitizedIntroVideoPath: string | undefined = undefined;
      if (config.introVideoPath) {
        let cleanIntro = config.introVideoPath;
        if (cleanIntro.startsWith('app-media://local/')) {
          cleanIntro = cleanIntro.slice('app-media://local/'.length);
        } else if (cleanIntro.startsWith('app-media://')) {
          cleanIntro = cleanIntro.replace(/^app-media:\/\/(\/)?/, '');
        }
        cleanIntro = decodeURIComponent(cleanIntro);
        if (cleanIntro.startsWith('http://') || cleanIntro.startsWith('https://')) {
          sanitizedIntroVideoPath = cleanIntro;
        } else if (fs.existsSync(cleanIntro)) {
          sanitizedIntroVideoPath = localMediaServer.getMediaUrl(cleanIntro);
        } else {
          console.warn(`[RemotionRunner] Intro video not found on disk, ignoring: ${cleanIntro}`);
          sanitizedIntroVideoPath = undefined;
        }
      }

      let sanitizedIntroCustomLogo: string | undefined = undefined;
      if (config.introCustomLogo) {
        let cleanIntroLogo = config.introCustomLogo;
        if (cleanIntroLogo.startsWith('app-media://local/')) {
          cleanIntroLogo = cleanIntroLogo.slice('app-media://local/'.length);
        } else if (cleanIntroLogo.startsWith('app-media://')) {
          cleanIntroLogo = cleanIntroLogo.replace(/^app-media:\/\/(\/)?/, '');
        }
        cleanIntroLogo = decodeURIComponent(cleanIntroLogo);
        if (cleanIntroLogo.startsWith('http://') || cleanIntroLogo.startsWith('https://') || cleanIntroLogo.startsWith('data:')) {
          sanitizedIntroCustomLogo = cleanIntroLogo;
        } else if (fs.existsSync(cleanIntroLogo)) {
          sanitizedIntroCustomLogo = localMediaServer.getMediaUrl(cleanIntroLogo);
        } else {
          sanitizedIntroCustomLogo = undefined;
        }
      }

      // Convert any local filesystem or app-media paths into HTTP streaming URLs for Headless Chrome
      const sanitizedConfig: VideoTemplateConfig = {
        ...config,
        logoPath: sanitizedLogoPath,
        introCustomLogo: sanitizedIntroCustomLogo,
        introVideoPath: sanitizedIntroVideoPath,
        backgroundPath: localMediaServer.getMediaUrl(config.backgroundPath),
        backgroundClips: preparedClips,
        customAudioPath: config.customAudioPath
          ? localMediaServer.getMediaUrl(config.customAudioPath)
          : undefined,
      };

      // Ensure all recitation audio tracks are cached locally on disk before rendering begins
      // This guarantees offline export and avoids repeated server requests during render
      const sanitizedAyahs: AyahSequenceData[] = [];
      const totalAyahs = (ayahs || []).length;
      for (let i = 0; i < totalAyahs; i++) {
        if (isCancelled) break;
        const ayah = ayahs[i];
        let localAudio = ayah.audioUrl;

        // If audioUrl is remote, download and cache it locally
        if (localAudio && (localAudio.startsWith('http://') || localAudio.startsWith('https://'))) {
          mainWindow.webContents.send('render:progress', {
            jobId,
            progress: 0.01 + (i / totalAyahs) * 0.04,
            status: 'rendering',
            message: `Caching recitation audio for offline render (${i + 1}/${totalAyahs})...`,
          });
          const reciters = recitationService.getReciters();
          const reciter = reciters[config.reciterIndex] || reciters[0];
          const cacheDir = recitationService.getAudioCacheDir(reciter);
          const surahPadded = String(ayah.surah).padStart(3, '0');
          const ayahPadded = String(ayah.ayah).padStart(3, '0');
          const dest = path.join(cacheDir, `${surahPadded}${ayahPadded}.mp3`);
          localAudio = await recitationService.ensureAudioCached(localAudio, dest);
        }

        sanitizedAyahs.push({
          ...ayah,
          audioUrl: localMediaServer.getMediaUrl(localAudio),
        });
      }

      const inputProps: QuranVideoCompositionProps = {
        config: sanitizedConfig,
        ayahs: sanitizedAyahs,
        totalDurationInFrames,
      };

      // 1. Resolve browser and compositor binaries
      const browserExecutable = await this.resolveBrowserExecutable(jobId, mainWindow);
      const binariesDirectory = this.getBinariesDirectory();

      if (isCancelled) {
        this.activeJobs.delete(jobId);
        mainWindow.webContents.send('render:progress', {
          jobId,
          progress: 0,
          status: 'cancelled',
        });
        return;
      }

      mainWindow.webContents.send('render:progress', {
        jobId,
        progress: 0.1,
        status: 'rendering',
        message: 'Preparing video composition...',
      });

      // 2. Select Composition
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: 'QuranVideo',
        inputProps: inputProps as unknown as Record<string, unknown>,
        browserExecutable,
        binariesDirectory,
      });

      const cpuCount = require('os').cpus().length || 4;
      // Balance concurrency to avoid thread contention and hardware video decoder saturation on high-res renders
      const concurrency = config.resolution === '4k'
        ? Math.min(3, Math.max(1, Math.floor(cpuCount / 2)))
        : Math.min(4, Math.max(1, Math.floor(cpuCount / 2)));

      // 3. Render MP4 Media
      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps: inputProps as unknown as Record<string, unknown>,
        crf: config.resolution === '4k' ? 18 : 22,
        concurrency,
        cancelSignal,
        browserExecutable,
        binariesDirectory,
        chromiumOptions: {
          enableMultiProcessOnLinux: true,
          disableWebSecurity: true,
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
            message: `Rendering frame ${renderedFrames} of ${totalDurationInFrames}`,
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
