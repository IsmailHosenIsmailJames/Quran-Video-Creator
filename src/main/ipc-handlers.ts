import { ipcMain, dialog, BrowserWindow, shell, clipboard, nativeImage } from 'electron';
import path from 'path';
import fs from 'fs';
import { quranDbService } from './services/quran-db';
import { translationService } from './services/translation-service';
import { recitationService } from './services/recitation-service';
import { remotionRunner } from './services/remotion-runner';
import { settingsService } from './services/settings-service';
import { ScriptType, VideoTemplateConfig, AyahSequenceData } from '../shared/types';

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // 1. Scripture lookups
  ipcMain.handle('quran:get-ayah-words', async (_, script: ScriptType, surah: number, ayah: number) => {
    return quranDbService.getAyahWords(script, surah, ayah);
  });

  ipcMain.handle('quran:get-ayah-range-words', async (_, script: ScriptType, surah: number, fromAyah: number, toAyah: number) => {
    return quranDbService.getAyahRangeWords(script, surah, fromAyah, toAyah);
  });

  // 2. Translations
  ipcMain.handle('translation:get-languages', async () => {
    return translationService.getAvailableLanguages();
  });

  ipcMain.handle('translation:get-translators', async (_, language: string) => {
    return translationService.getTranslatorsForLanguage(language);
  });

  ipcMain.handle('translation:get-verse', async (_, language: string, translatorFile: string, surah: number, ayah: number) => {
    return translationService.getVerseTranslation(language, translatorFile, surah, ayah);
  });

  ipcMain.handle('translation:get-range', async (_, language: string, translatorFile: string, surah: number, fromAyah: number, toAyah: number) => {
    return translationService.getVerseRangeTranslations(language, translatorFile, surah, fromAyah, toAyah);
  });

  // 3. Recitations
  ipcMain.handle('recitation:get-reciters', async () => {
    return recitationService.getReciters();
  });

  ipcMain.handle('recitation:get-ayah-audio', async (_, reciterIndex: number, surah: number, ayah: number) => {
    return recitationService.getAyahAudioData(reciterIndex, surah, ayah);
  });

  ipcMain.handle('recitation:get-ayah-range-audio', async (_, reciterIndex: number, surah: number, fromAyah: number, toAyah: number) => {
    return recitationService.getAyahRangeAudioData(reciterIndex, surah, fromAyah, toAyah);
  });

  // 4. File dialogs
  const resolveDefaultMediaDir = (type: string): string | undefined => {
    let defaultDir = settingsService.getLastDirectory(type);
    if (!defaultDir && (type === 'video' || type === 'image' || type === 'media')) {
      defaultDir =
        settingsService.getLastDirectory('media') ||
        settingsService.getLastDirectory('video') ||
        settingsService.getLastDirectory('image');
    }
    return defaultDir || undefined;
  };

  const rememberMediaDir = (type: string, filePath: string) => {
    if (!filePath) return;
    const dir = path.dirname(filePath);
    if (dir && fs.existsSync(dir)) {
      settingsService.setLastDirectory(type, dir);
      if (type === 'video' || type === 'image' || type === 'media') {
        settingsService.setLastDirectory('media', dir);
      }
    }
  };

  ipcMain.handle('dialog:select-media-file', async (_, type: 'video' | 'audio' | 'image') => {
    const filters = {
      video: [
        { name: 'Video Files', extensions: ['mp4', 'webm', 'mov', 'mkv', 'm4v'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      audio: [
        { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      image: [
        { name: 'Image Files', extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    }[type];

    const defaultPath = resolveDefaultMediaDir(type);

    const result = await dialog.showOpenDialog(mainWindow, {
      title: `Select ${type.toUpperCase()} File`,
      properties: ['openFile'],
      filters,
      defaultPath,
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    const chosen = result.filePaths[0];
    rememberMediaDir(type, chosen);
    return chosen;
  });

  ipcMain.handle(
    'dialog:select-media-files',
    async (_, type: 'video' | 'audio' | 'image' | 'media') => {
      const filters = {
        video: [
          { name: 'Video Files', extensions: ['mp4', 'webm', 'mov', 'mkv', 'm4v'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        audio: [
          { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        image: [
          { name: 'Image Files', extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        media: [
          {
            name: 'Media Files (Videos & Images)',
            extensions: ['mp4', 'webm', 'mov', 'mkv', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'],
          },
          { name: 'All Files', extensions: ['*'] },
        ],
      }[type];

      const defaultPath = resolveDefaultMediaDir(type);

      const result = await dialog.showOpenDialog(mainWindow, {
        title: `Select ${type.toUpperCase()} Files (Multiple Allowed)`,
        properties: ['openFile', 'multiSelections'],
        filters,
        defaultPath,
      });

      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return [];
      }
      rememberMediaDir(type, result.filePaths[0]);
      return result.filePaths;
    }
  );

  ipcMain.handle('dialog:select-save-path', async (_, defaultFileName: string) => {
    const lastExportDir = settingsService.getLastDirectory('export');
    let defaultPath = defaultFileName || 'Quran_Video_Export.mp4';
    if (lastExportDir && fs.existsSync(lastExportDir)) {
      defaultPath = path.join(lastExportDir, path.basename(defaultPath));
    }

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Video Export',
      defaultPath,
      filters: [{ name: 'MP4 Video', extensions: ['mp4'] }],
    });

    if (result.canceled || !result.filePath) {
      return null;
    }
    const chosenDir = path.dirname(result.filePath);
    if (chosenDir && fs.existsSync(chosenDir)) {
      settingsService.setLastDirectory('export', chosenDir);
    }
    return result.filePath;
  });

  ipcMain.handle('thumbnail:save-image', async (_, dataUrl: string, defaultFileName: string) => {
    try {
      const lastExportDir = settingsService.getLastDirectory('export');
      let defaultPath = defaultFileName || 'Quran_Thumbnail.png';
      if (lastExportDir && fs.existsSync(lastExportDir)) {
        defaultPath = path.join(lastExportDir, path.basename(defaultPath));
      }

      const isJpg = defaultFileName.toLowerCase().endsWith('.jpg') || defaultFileName.toLowerCase().endsWith('.jpeg');
      const filters = isJpg
        ? [{ name: 'JPEG Image', extensions: ['jpg', 'jpeg'] }]
        : [{ name: 'PNG Image', extensions: ['png'] }];

      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Save YouTube Thumbnail',
        defaultPath,
        filters,
      });

      if (result.canceled || !result.filePath) {
        return null;
      }

      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      await fs.promises.writeFile(result.filePath, buffer);

      const chosenDir = path.dirname(result.filePath);
      if (chosenDir && fs.existsSync(chosenDir)) {
        settingsService.setLastDirectory('export', chosenDir);
      }

      return result.filePath;
    } catch (err: any) {
      console.error('Failed to save thumbnail image:', err);
      return null;
    }
  });

  ipcMain.handle('clipboard:write-image', async (_, dataUrl: string) => {
    try {
      const img = nativeImage.createFromDataURL(dataUrl);
      clipboard.writeImage(img);
      return { success: true };
    } catch (err: any) {
      console.error('Failed to copy thumbnail image to clipboard:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('file:show-in-folder', async (_, filePath: string) => {
    if (filePath) {
      shell.showItemInFolder(filePath);
    }
  });

  ipcMain.handle('media:probe-duration', async (_, filePath: string) => {
    try {
      const { Input, FilePathSource, ALL_FORMATS } = require('mediabunny');
      const input = new Input({
        formats: ALL_FORMATS,
        source: new FilePathSource(filePath),
      });
      const duration = await input.computeDuration();
      return typeof duration === 'number' && !isNaN(duration) ? duration : 0;
    } catch (err) {
      console.error('Failed to probe media duration:', err);
      return 0;
    }
  });

  // 5. Video Rendering
  ipcMain.handle(
    'render:start',
    async (
      _,
      config: VideoTemplateConfig,
      ayahs: AyahSequenceData[],
      totalDurationInFrames: number,
      outputPath: string
    ) => {
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      // Run rendering asynchronously so IPC returns immediately with jobId
      remotionRunner
        .renderVideo(jobId, config, ayahs, totalDurationInFrames, outputPath, mainWindow)
        .catch((err) => {
          console.error('Render error:', err);
        });

      return { jobId };
    }
  );

  ipcMain.handle('render:cancel', async (_, jobId: string) => {
    remotionRunner.cancelRender(jobId);
  });

  // 5. Settings Persistence
  ipcMain.handle('settings:load', async () => {
    return settingsService.loadSettings();
  });

  ipcMain.handle('settings:save', async (_, settings: Partial<VideoTemplateConfig>) => {
    settingsService.saveSettings(settings);
    return { success: true };
  });

  ipcMain.handle('settings:reset', async () => {
    settingsService.resetSettings();
    return { success: true };
  });
}
