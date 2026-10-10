import { ipcMain, dialog, BrowserWindow, shell } from 'electron';
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

    const result = await dialog.showOpenDialog(mainWindow, {
      title: `Select ${type.toUpperCase()} File`,
      properties: ['openFile'],
      filters,
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
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

      const result = await dialog.showOpenDialog(mainWindow, {
        title: `Select ${type.toUpperCase()} Files (Multiple Allowed)`,
        properties: ['openFile', 'multiSelections'],
        filters,
      });

      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return [];
      }
      return result.filePaths;
    }
  );

  ipcMain.handle('dialog:select-save-path', async (_, defaultFileName: string) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Video Export',
      defaultPath: defaultFileName || 'Quran_Video_Export.mp4',
      filters: [{ name: 'MP4 Video', extensions: ['mp4'] }],
    });

    if (result.canceled || !result.filePath) {
      return null;
    }
    return result.filePath;
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
