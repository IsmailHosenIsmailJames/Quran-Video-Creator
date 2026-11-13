import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition, ensureBrowser, RenderInternals } from '@remotion/renderer';
import { BrowserWindow, app } from 'electron';
import { VideoTemplateConfig, AyahSequenceData, QuranVideoCompositionProps } from '../../shared/types';
import { localMediaServer } from './local-media-server';
import { recitationService } from './recitation-service';
import { renderSessionManager } from './render-session-manager';

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

  private async generateMasterAudioFastPath({
    config,
    ayahs,
    totalDurationInFrames,
    audioOutputPath,
    binariesDirectory,
    cleanMediaFilePath,
    cancelSignal,
  }: {
    config: VideoTemplateConfig;
    ayahs: AyahSequenceData[];
    totalDurationInFrames: number;
    audioOutputPath: string;
    binariesDirectory?: string | null;
    cleanMediaFilePath: (p?: string | null) => string;
    cancelSignal?: any;
  }): Promise<boolean> {
    const effectiveAudioPath =
      config.useRecitationVideoAudio && config.recitationVideoPath
        ? config.recitationVideoPath
        : config.customAudioPath;

    const isFullAudioMode = Boolean(
      effectiveAudioPath &&
      (config.recitationAudioMode === 'full-surah-file' ||
        config.hasCustomTimestamp ||
        (config.useRecitationVideoAudio && Boolean(config.recitationVideoPath)))
    );

    if (!isFullAudioMode || !effectiveAudioPath) {
      console.log('[RemotionRunner] Master audio fast-path: Non-full-audio mode, falling back to standard audio renderer.');
      return false;
    }

    const cleanAudioPath = cleanMediaFilePath(effectiveAudioPath);
    if (!cleanAudioPath || !fs.existsSync(cleanAudioPath)) {
      console.warn('[RemotionRunner] Master audio fast-path: Source audio file not found on disk:', cleanAudioPath);
      return false;
    }

    const fps = config.fps || 30;
    const isIntroActive = Boolean(
      config.enableIntroVideo &&
      (config.introMode === 'custom-video' ? config.introVideoPath : true) &&
      !(Boolean(config.skipIntroForShorts) && config.aspectRatio === '9:16')
    );
    const introDurationInFrames = isIntroActive
      ? Math.max(1, Math.round((config.introVideoDurationSeconds || 4) * fps))
      : 0;

    const isTitleCardActive = Boolean(
      config.enableSurahTitleCard &&
      !(Boolean(config.skipTitleCardForShorts) && config.aspectRatio === '9:16')
    );
    const titleCardDurationInFrames = isTitleCardActive
      ? Math.max(1, Math.round((config.titleCardDurationSeconds || 3.5) * fps))
      : 0;
    const scriptureStartFrame = introDurationInFrames + titleCardDurationInFrames;

    const speed = config.recitationSpeed || 1.0;

    let fullAudioStartFromFrame = 0;
    if (ayahs && ayahs.length > 0) {
      const firstAyah = ayahs[0];
      const offsetMs = firstAyah.audioStartMs || 0;
      const isBeginning = firstAyah.ayah === 0 || firstAyah.ayah === 1;
      if (isBeginning && (config.fromAyah === 1 || !firstAyah.audioStartMs)) {
        fullAudioStartFromFrame = 0;
      } else {
        fullAudioStartFromFrame = Math.max(0, Math.round((offsetMs / 1000) * fps * speed));
      }
    }

    const delayMs = Math.round((scriptureStartFrame / fps) * 1000);
    const startOffsetSeconds = fullAudioStartFromFrame > 0 ? fullAudioStartFromFrame / (fps * speed) : 0;
    const totalDurationSeconds = totalDurationInFrames / fps;

    const outDir = path.dirname(audioOutputPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const ffmpegArgs: string[] = ['-hide_banner', '-y'];

    if (startOffsetSeconds > 0) {
      ffmpegArgs.push('-ss', startOffsetSeconds.toFixed(4));
    }

    ffmpegArgs.push('-i', cleanAudioPath);

    const audioFilters: string[] = [];
    if (Math.abs(speed - 1.0) > 0.005) {
      let remaining = speed;
      while (remaining > 2.0) {
        audioFilters.push('atempo=2.0');
        remaining /= 2.0;
      }
      while (remaining < 0.5) {
        audioFilters.push('atempo=0.5');
        remaining /= 0.5;
      }
      audioFilters.push(`atempo=${remaining.toFixed(4)}`);
    }

    if (delayMs > 0) {
      audioFilters.push(`adelay=${delayMs}:all=1`);
    }

    audioFilters.push('apad');

    ffmpegArgs.push('-af', audioFilters.join(','));
    ffmpegArgs.push(
      '-t',
      totalDurationSeconds.toFixed(4),
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      audioOutputPath
    );

    console.log(
      `[RemotionRunner] Executing native FFmpeg master audio fast-path: scriptureStartFrame=${scriptureStartFrame}, delayMs=${delayMs}, startOffset=${startOffsetSeconds}s, speed=${speed}, totalDuration=${totalDurationSeconds}s`
    );

    await RenderInternals.callFf({
      args: ffmpegArgs,
      bin: 'ffmpeg',
      indent: false,
      logLevel: 'info',
      binariesDirectory: binariesDirectory ?? null,
      cancelSignal,
    });

    if (fs.existsSync(audioOutputPath) && fs.statSync(audioOutputPath).size > 512) {
      console.log(`[RemotionRunner] Master audio fast-path completed successfully: ${audioOutputPath}`);
      return true;
    }

    return false;
  }

  public async renderVideo(
    jobId: string,
    config: VideoTemplateConfig,
    ayahs: AyahSequenceData[],
    totalDurationInFrames: number,
    outputPath: string,
    mainWindow: BrowserWindow,
    options?: { forceFresh?: boolean }
  ): Promise<void> {
    mainWindow.webContents.send('render:progress', {
      jobId,
      progress: 0.02,
      status: 'rendering',
      message: 'Initializing render session and checkpoint engine...',
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

    let currentSessionDir: string | null = null;
    let currentManifest: any = null;

    try {
      // 0. Initialize or restore session checkpoint
      const { manifest, sessionDir, isResumed } = renderSessionManager.initOrCreateSession(
        config,
        totalDurationInFrames,
        outputPath,
        options?.forceFresh
      );
      currentSessionDir = sessionDir;
      currentManifest = manifest;

      const prebundled = this.getPrebundledPath();
      let bundleLocation: string;

      if (app?.isPackaged && prebundled) {
        bundleLocation = prebundled;
        mainWindow.webContents.send('render:progress', {
          jobId,
          progress: 0.06,
          status: 'rendering',
          message: 'Loading pre-bundled composition...',
        });
      } else if (prebundled && !fs.existsSync(path.join(process.cwd(), 'src/remotion/index.ts'))) {
        bundleLocation = prebundled;
        mainWindow.webContents.send('render:progress', {
          jobId,
          progress: 0.06,
          status: 'rendering',
          message: 'Loading pre-bundled composition...',
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
              progress: progress * 0.06,
              status: 'rendering',
              message: `Preparing bundles (${Math.round(progress * 100)}%)...`,
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
          message: 'Render cancelled',
        });
        return;
      }

      // Ensure local media streaming server is active so headless Chromium can fetch custom videos and audio
      await localMediaServer.start();

      const cleanMediaFilePath = (rawPath?: string | null): string => {
        if (!rawPath) return '';
        let clean = rawPath;
        if (clean.startsWith('app-media://local/')) {
          clean = clean.slice('app-media://local'.length);
        } else if (clean.startsWith('app-media://local')) {
          clean = clean.slice('app-media://local'.length);
        } else if (clean.startsWith('app-media://')) {
          clean = clean.replace(/^app-media:\/\/(\/)?/, '/');
        }
        clean = decodeURIComponent(clean);
        if (/^\/[a-zA-Z]:/.test(clean)) {
          clean = clean.slice(1);
        } else if (
          !/^[a-zA-Z]:/.test(clean) &&
          !clean.startsWith('/') &&
          !clean.startsWith('http://') &&
          !clean.startsWith('https://') &&
          !clean.startsWith('data:') &&
          !clean.startsWith('blob:')
        ) {
          clean = '/' + clean;
        }
        return clean;
      };

      const probeDuration = async (filePath?: string | null): Promise<number | undefined> => {
        try {
          if (!filePath) return undefined;
          const cleanPath = cleanMediaFilePath(filePath);
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
        const cleanLogo = cleanMediaFilePath(config.logoPath);
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
        const cleanIntro = cleanMediaFilePath(config.introVideoPath);
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
        const cleanIntroLogo = cleanMediaFilePath(config.introCustomLogo);
        if (cleanIntroLogo.startsWith('http://') || cleanIntroLogo.startsWith('https://') || cleanIntroLogo.startsWith('data:')) {
          sanitizedIntroCustomLogo = cleanIntroLogo;
        } else if (fs.existsSync(cleanIntroLogo)) {
          sanitizedIntroCustomLogo = localMediaServer.getMediaUrl(cleanIntroLogo);
        } else {
          sanitizedIntroCustomLogo = undefined;
        }
      }

      let sanitizedOutroVideoPath: string | undefined = undefined;
      if (config.outroVideoPath) {
        const cleanOutro = cleanMediaFilePath(config.outroVideoPath);
        if (cleanOutro.startsWith('http://') || cleanOutro.startsWith('https://')) {
          sanitizedOutroVideoPath = cleanOutro;
        } else if (fs.existsSync(cleanOutro)) {
          sanitizedOutroVideoPath = localMediaServer.getMediaUrl(cleanOutro);
        } else {
          console.warn(`[RemotionRunner] Outro video not found on disk, ignoring: ${cleanOutro}`);
          sanitizedOutroVideoPath = undefined;
        }
      }

      let sanitizedOutroCustomLogo: string | undefined = undefined;
      if (config.outroCustomLogo) {
        const cleanOutroLogo = cleanMediaFilePath(config.outroCustomLogo);
        if (cleanOutroLogo.startsWith('http://') || cleanOutroLogo.startsWith('https://') || cleanOutroLogo.startsWith('data:')) {
          sanitizedOutroCustomLogo = cleanOutroLogo;
        } else if (fs.existsSync(cleanOutroLogo)) {
          sanitizedOutroCustomLogo = localMediaServer.getMediaUrl(cleanOutroLogo);
        } else {
          sanitizedOutroCustomLogo = undefined;
        }
      }

      // Sanitize recitation video path if present
      let sanitizedRecitationVideoPath: string | undefined = undefined;
      if (config.recitationVideoPath) {
        const cleanRecitationVideo = cleanMediaFilePath(config.recitationVideoPath);
        if (cleanRecitationVideo.startsWith('http://') || cleanRecitationVideo.startsWith('https://')) {
          sanitizedRecitationVideoPath = cleanRecitationVideo;
        } else if (fs.existsSync(cleanRecitationVideo)) {
          sanitizedRecitationVideoPath = localMediaServer.getMediaUrl(cleanRecitationVideo);
        } else {
          sanitizedRecitationVideoPath = localMediaServer.getMediaUrl(cleanRecitationVideo);
        }
      }

      // Convert any local filesystem or app-media paths into HTTP streaming URLs for Headless Chrome
      const sanitizedConfig: VideoTemplateConfig = {
        ...config,
        logoPath: sanitizedLogoPath,
        introCustomLogo: sanitizedIntroCustomLogo,
        introVideoPath: sanitizedIntroVideoPath,
        outroCustomLogo: sanitizedOutroCustomLogo,
        outroVideoPath: sanitizedOutroVideoPath,
        backgroundPath: localMediaServer.getMediaUrl(config.backgroundPath),
        backgroundClips: preparedClips,
        customAudioPath: config.customAudioPath
          ? localMediaServer.getMediaUrl(config.customAudioPath)
          : undefined,
        recitationVideoPath: sanitizedRecitationVideoPath,
      };

      // Ensure all recitation audio tracks are cached locally on disk before rendering begins
      const sanitizedAyahs: AyahSequenceData[] = [];
      const totalAyahs = (ayahs || []).length;
      for (let i = 0; i < totalAyahs; i++) {
        if (isCancelled) break;
        const ayah = ayahs[i];
        let localAudio = ayah.audioUrl;

        if (localAudio) {
          const isRemote = localAudio.startsWith('http://') || localAudio.startsWith('https://');
          const remoteUrl = isRemote ? localAudio : recitationService.getRemoteUrlForPath(localAudio);

          let destPath = localAudio;
          if (isRemote) {
            const reciters = recitationService.getReciters();
            const reciter = reciters[config.reciterIndex] || reciters[0];
            const cacheDir = recitationService.getAudioCacheDir(reciter);
            const surahPadded = String(ayah.surah).padStart(3, '0');
            const ayahPadded = String(ayah.ayah).padStart(3, '0');
            destPath = path.join(cacheDir, `${surahPadded}${ayahPadded}.mp3`);
          }

          let isCached = false;
          try {
            isCached = fs.existsSync(destPath) && fs.statSync(destPath).size > 512;
          } catch {}

          if (!isCached && remoteUrl) {
            mainWindow.webContents.send('render:progress', {
              jobId,
              progress: 0.06 + (i / totalAyahs) * 0.04,
              status: 'rendering',
              message: `Caching recitation audio for offline render (${i + 1}/${totalAyahs})...`,
            });
            localAudio = await recitationService.ensureAudioCached(remoteUrl, destPath);
          } else if (isCached) {
            localAudio = destPath;
          }
        }

        sanitizedAyahs.push({
          ...ayah,
          audioUrl: localMediaServer.getMediaUrl(localAudio),
        });
      }

      const reciters = recitationService.getReciters();
      const reciter = reciters[config.reciterIndex];

      const inputProps: QuranVideoCompositionProps = {
        config: sanitizedConfig,
        ayahs: sanitizedAyahs,
        totalDurationInFrames,
        reciterInfo: reciter,
        mediaServerPort: localMediaServer.getPort(),
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
          message: 'Render cancelled',
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
      const is4K = config.resolution === '4k';

      // Maximize CPU utilization on multi-core processors (e.g. Apple Silicon M4 with 10 cores)
      // Reserve 1-2 cores for system responsiveness, Electron UI, and FFmpeg multiplexer, utilizing the rest for parallel browser rendering
      const concurrency = is4K
        ? Math.max(2, Math.min(cpuCount, Math.max(2, cpuCount - 3)))
        : Math.max(2, Math.min(cpuCount, Math.max(2, cpuCount - 2)));

      // Dedicated parallel threads for Remotion compositor to decode OffthreadVideo frames.
      // Default in Remotion is only 2, which starves multi-threaded browser rendering
      const offthreadVideoThreads = Math.max(4, Math.min(8, Math.floor(cpuCount * 0.6)));

      // Fast encoding preset: 'veryfast' cuts H.264 CPU compression overhead by 50%+ with visually identical quality
      const x264Preset = 'veryfast';

      console.log(
        `[RemotionRunner] Configured render performance: cpuCount=${cpuCount}, concurrency=${concurrency}, offthreadVideoThreads=${offthreadVideoThreads}, x264Preset=${x264Preset}, gl=${process.platform === 'darwin' ? 'angle' : 'default'}`
      );

      // 3. Audio Synchronization Track (Rendered once up front for continuous sync)
      const audioPath = path.join(sessionDir, manifest.audioFileName);
      if (!manifest.audioCompleted) {
        if (isCancelled) return;
        mainWindow.webContents.send('render:progress', {
          jobId,
          progress: 0.11,
          status: 'rendering',
          message: 'Synchronizing master audio track for frame-accurate playback...',
        });

        try {
          // Attempt high-speed native FFmpeg audio synthesis first (bypasses Chromium DOM evaluation)
          let fastPathOk = false;
          try {
            fastPathOk = await this.generateMasterAudioFastPath({
              config,
              ayahs,
              totalDurationInFrames,
              audioOutputPath: audioPath,
              binariesDirectory,
              cleanMediaFilePath,
              cancelSignal,
            });
          } catch (fpErr: any) {
            console.warn('[RemotionRunner] Fast-path master audio attempt failed, will fall back:', fpErr?.message);
            fastPathOk = false;
          }

          if (fastPathOk && fs.existsSync(audioPath) && fs.statSync(audioPath).size > 512) {
            manifest.audioCompleted = true;
            manifest.hasAudio = true;
            renderSessionManager.saveManifest(sessionDir, manifest);
          } else {
            console.log('[RemotionRunner] Rendering master audio track via Remotion Chromium fallback...');
            await renderMedia({
              composition,
              serveUrl: bundleLocation,
              codec: 'aac',
              outputLocation: audioPath,
              inputProps: inputProps as unknown as Record<string, unknown>,
              browserExecutable,
              binariesDirectory,
              cancelSignal,
            });

            if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 512) {
              manifest.audioCompleted = true;
              manifest.hasAudio = true;
              renderSessionManager.saveManifest(sessionDir, manifest);
            } else {
              manifest.audioCompleted = true;
              manifest.hasAudio = false;
              renderSessionManager.saveManifest(sessionDir, manifest);
            }
          }
        } catch (audioErr: any) {
          console.warn('[RemotionRunner] Audio track notice:', audioErr?.message);
          manifest.audioCompleted = true;
          manifest.hasAudio = false;
          renderSessionManager.saveManifest(sessionDir, manifest);
        }
      }

      if (isCancelled) {
        this.activeJobs.delete(jobId);
        mainWindow.webContents.send('render:progress', {
          jobId,
          progress: 0,
          status: 'cancelled',
          message: 'Render cancelled',
        });
        return;
      }

      // 4. Segment-Based Video Rendering (Safe against load shedding)
      const totalChunks = manifest.chunks.length;
      const initialCompleted = manifest.chunks.filter((c) => c.completed).length;

      if (isResumed && initialCompleted > 0) {
        const initialFramesDone = manifest.chunks
          .filter((c) => c.completed)
          .reduce((sum, c) => sum + c.durationInFrames, 0);

        mainWindow.webContents.send('render:progress', {
          jobId,
          progress: 0.12 + (initialFramesDone / totalDurationInFrames) * 0.82,
          currentFrame: initialFramesDone,
          totalFrames: totalDurationInFrames,
          currentChunk: initialCompleted,
          totalChunks,
          isResumed: true,
          status: 'rendering',
          message: `Resuming: ${initialCompleted} of ${totalChunks} segments (${Math.round((initialFramesDone / totalDurationInFrames) * 100)}%) already completed!`,
        });
      }

      for (let i = 0; i < totalChunks; i++) {
        if (isCancelled) break;
        const chunk = manifest.chunks[i];
        const chunkVideoPath = path.join(sessionDir, chunk.videoFileName);

        if (chunk.completed && fs.existsSync(chunkVideoPath) && fs.statSync(chunkVideoPath).size > 1024) {
          console.log(`[RemotionRunner] Segment ${i + 1}/${totalChunks} already rendered. Skipping.`);
          continue;
        }

        const priorCompletedFrames = manifest.chunks
          .slice(0, i)
          .filter((c) => c.completed)
          .reduce((sum, c) => sum + c.durationInFrames, 0);

        mainWindow.webContents.send('render:progress', {
          jobId,
          progress: 0.12 + (priorCompletedFrames / totalDurationInFrames) * 0.82,
          currentFrame: priorCompletedFrames,
          totalFrames: totalDurationInFrames,
          currentChunk: i + 1,
          totalChunks,
          isResumed,
          status: 'rendering',
          message: `Rendering segment ${i + 1} of ${totalChunks} (frames ${chunk.startFrame}–${chunk.endFrame})...`,
        });

        // Render video frames for this chunk.
        // Muted is true because master_audio.aac holds the master continuous audio track.
        await renderMedia({
          composition,
          serveUrl: bundleLocation,
          codec: 'h264',
          outputLocation: chunkVideoPath,
          frameRange: [chunk.startFrame, chunk.endFrame],
          inputProps: inputProps as unknown as Record<string, unknown>,
          crf: is4K ? 18 : 22,
          concurrency,
          offthreadVideoThreads,
          x264Preset,
          cancelSignal,
          browserExecutable,
          binariesDirectory,
          muted: true,
          chromiumOptions: {
            enableMultiProcessOnLinux: true,
            disableWebSecurity: true,
            gl: process.platform === 'darwin' ? 'angle' : null,
          },
          onProgress: ({ renderedFrames, renderEstimatedTime }) => {
            if (isCancelled) return;
            const globalRenderedFrames = priorCompletedFrames + renderedFrames;
            const progress = 0.12 + (globalRenderedFrames / totalDurationInFrames) * 0.82;

            let scaledRemainingTime = renderEstimatedTime;
            if (renderEstimatedTime && renderEstimatedTime > 0 && chunk.durationInFrames > 0) {
              const remainingTotalFrames = Math.max(0, totalDurationInFrames - globalRenderedFrames);
              const msPerFrame = renderEstimatedTime / Math.max(1, chunk.durationInFrames - renderedFrames);
              scaledRemainingTime = Math.round(msPerFrame * remainingTotalFrames);
            }

            mainWindow.webContents.send('render:progress', {
              jobId,
              progress: Math.min(0.95, progress),
              currentFrame: globalRenderedFrames,
              totalFrames: totalDurationInFrames,
              currentChunk: i + 1,
              totalChunks,
              isResumed,
              renderEstimatedTime: scaledRemainingTime,
              status: 'rendering',
              message: `Rendering segment ${i + 1} of ${totalChunks} (frame ${globalRenderedFrames} of ${totalDurationInFrames})`,
            });
          },
        });

        if (isCancelled) break;

        // Verify newly rendered chunk on disk and update checkpoint manifest atomically
        if (fs.existsSync(chunkVideoPath) && fs.statSync(chunkVideoPath).size > 1024) {
          chunk.completed = true;
          chunk.fileSizeBytes = fs.statSync(chunkVideoPath).size;
          renderSessionManager.saveManifest(sessionDir, manifest);
        } else {
          throw new Error(`Segment ${i + 1} failed to write valid video output to disk.`);
        }
      }

      if (isCancelled) {
        this.activeJobs.delete(jobId);
        mainWindow.webContents.send('render:progress', {
          jobId,
          progress: 0,
          status: 'cancelled',
          message: 'Render cancelled. Progress saved locally for instant resume.',
        });
        return;
      }

      // 5. Final Fast Lossless Stream-Copy Muxing (2-3 seconds total, zero re-encoding)
      mainWindow.webContents.send('render:progress', {
        jobId,
        progress: 0.96,
        status: 'encoding',
        message: 'Stitching video segments together losslessly (0% quality loss)...',
      });

      const concatListPath = path.join(sessionDir, 'chunks.txt');
      const fileEntries = manifest.chunks
        .map((c) => {
          const p = path.join(sessionDir, c.videoFileName).replace(/\\/g, '/');
          return `file '${p}'`;
        })
        .join('\n');
      fs.writeFileSync(concatListPath, fileEntries, 'utf8');

      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const hasAudioFile = manifest.hasAudio && fs.existsSync(audioPath) && fs.statSync(audioPath).size > 512;
      const ffmpegArgs = hasAudioFile
        ? [
            '-hide_banner',
            '-f', 'concat',
            '-safe', '0',
            '-i', concatListPath,
            '-i', audioPath,
            '-c:v', 'copy',
            '-c:a', 'copy',
            '-shortest',
            '-movflags', '+faststart',
            '-y',
            outputPath,
          ]
        : [
            '-hide_banner',
            '-f', 'concat',
            '-safe', '0',
            '-i', concatListPath,
            '-c:v', 'copy',
            '-movflags', '+faststart',
            '-y',
            outputPath,
          ];

      await RenderInternals.callFf({
        args: ffmpegArgs,
        bin: 'ffmpeg',
        indent: false,
        logLevel: 'info',
        binariesDirectory: binariesDirectory ?? null,
        cancelSignal,
      });

      if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 1024) {
        throw new Error('Final stitched video output file was not created or is empty.');
      }

      // 6. Clean up session files now that final video is confirmed
      renderSessionManager.cleanupSession(sessionDir);

      this.activeJobs.delete(jobId);
      mainWindow.webContents.send('render:progress', {
        jobId,
        progress: 1.0,
        currentFrame: totalDurationInFrames,
        totalFrames: totalDurationInFrames,
        status: 'completed',
        message: 'Export completed successfully!',
      });
    } catch (err: any) {
      this.activeJobs.delete(jobId);
      const isUserCancel = isCancelled || err?.message?.includes('cancelled');

      // Preserve session state in manifest so user can resume later
      if (currentSessionDir && currentManifest) {
        currentManifest.status = isUserCancel ? 'interrupted' : 'failed';
        renderSessionManager.saveManifest(currentSessionDir, currentManifest);
      }

      mainWindow.webContents.send('render:progress', {
        jobId,
        progress: 0,
        status: isUserCancel ? 'cancelled' : 'failed',
        error: err?.message || 'Rendering failed',
        message: isUserCancel ? 'Render cancelled' : 'Render encountered an error',
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
