import { contextBridge, ipcRenderer } from 'electron';
import {
  QuranWord,
  ReciterInfo,
  AyahAudioData,
  VideoTemplateConfig,
  AyahSequenceData,
  RenderProgressPayload,
  ScriptType,
} from '../shared/types';

const api = {
  // Scripture
  getAyahWords: (script: ScriptType, surah: number, ayah: number): Promise<QuranWord[]> =>
    ipcRenderer.invoke('quran:get-ayah-words', script, surah, ayah),
  getAyahRangeWords: (
    script: ScriptType,
    surah: number,
    fromAyah: number,
    toAyah: number
  ): Promise<Record<number, QuranWord[]>> =>
    ipcRenderer.invoke('quran:get-ayah-range-words', script, surah, fromAyah, toAyah),

  // Translations
  getAvailableLanguages: (): Promise<string[]> =>
    ipcRenderer.invoke('translation:get-languages'),
  getTranslatorsForLanguage: (language: string): Promise<string[]> =>
    ipcRenderer.invoke('translation:get-translators', language),
  getVerseTranslation: (
    language: string,
    translatorFile: string,
    surah: number,
    ayah: number
  ): Promise<string> =>
    ipcRenderer.invoke('translation:get-verse', language, translatorFile, surah, ayah),
  getVerseRangeTranslations: (
    language: string,
    translatorFile: string,
    surah: number,
    fromAyah: number,
    toAyah: number
  ): Promise<Record<number, string>> =>
    ipcRenderer.invoke('translation:get-range', language, translatorFile, surah, fromAyah, toAyah),

  // Recitations
  getReciters: (): Promise<ReciterInfo[]> =>
    ipcRenderer.invoke('recitation:get-reciters'),
  getAyahAudioData: (
    reciterIndex: number,
    surah: number,
    ayah: number
  ): Promise<AyahAudioData> =>
    ipcRenderer.invoke('recitation:get-ayah-audio', reciterIndex, surah, ayah),
  getAyahRangeAudioData: (
    reciterIndex: number,
    surah: number,
    fromAyah: number,
    toAyah: number
  ): Promise<Record<number, AyahAudioData>> =>
    ipcRenderer.invoke('recitation:get-ayah-range-audio', reciterIndex, surah, fromAyah, toAyah),

  // File Dialogs
  selectMediaFile: (type: 'video' | 'audio' | 'image'): Promise<string | null> =>
    ipcRenderer.invoke('dialog:select-media-file', type),
  selectSavePath: (defaultFileName: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:select-save-path', defaultFileName),
  showInFolder: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('file:show-in-folder', filePath),

  // Video Rendering
  startRender: (
    config: VideoTemplateConfig,
    ayahs: AyahSequenceData[],
    totalDurationInFrames: number,
    outputPath: string
  ): Promise<{ jobId: string }> =>
    ipcRenderer.invoke('render:start', config, ayahs, totalDurationInFrames, outputPath),
  cancelRender: (jobId: string): Promise<void> =>
    ipcRenderer.invoke('render:cancel', jobId),
  onRenderProgress: (callback: (payload: RenderProgressPayload) => void): (() => void) => {
    const handler = (_: any, payload: RenderProgressPayload) => callback(payload);
    ipcRenderer.on('render:progress', handler);
    return () => {
      ipcRenderer.removeListener('render:progress', handler);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
export type ElectronAPI = typeof api;
