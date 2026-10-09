import { create } from 'zustand';
import {
  VideoTemplateConfig,
  AyahSequenceData,
  ReciterInfo,
  ScriptType,
} from '../../shared/types';
import {
  DEFAULT_TEMPLATE_CONFIG,
  SCRIPT_FONT_MAP,
  SCRIPT_LINE_HEIGHT_MAP,
} from '../../shared/constants';
import { SURAHS_LIST, getSurahByNumber } from '../../shared/surahs';

interface StudioState {
  config: VideoTemplateConfig;
  ayahs: AyahSequenceData[];
  totalDurationInFrames: number;
  isLoading: boolean;
  statusMessage: string;

  availableLanguages: string[];
  translatorsPrimary: string[];
  translatorsSecondary: string[];
  reciters: ReciterInfo[];

  activeTab: 'scripture' | 'subtitles' | 'visuals' | 'audio' | 'branding';
  isExportModalOpen: boolean;

  // Actions
  setActiveTab: (tab: 'scripture' | 'subtitles' | 'visuals' | 'audio' | 'branding') => void;
  setExportModalOpen: (open: boolean) => void;
  updateConfig: (partial: Partial<VideoTemplateConfig>) => void;
  changeSurah: (surahNumber: number) => Promise<void>;
  changeAyahRange: (fromAyah: number, toAyah: number) => Promise<void>;
  changeScript: (script: ScriptType) => Promise<void>;
  changeReciter: (reciterIndex: number) => Promise<void>;
  refreshAyahSequence: () => Promise<void>;
  initializeStudio: () => Promise<void>;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  config: DEFAULT_TEMPLATE_CONFIG,
  ayahs: [],
  totalDurationInFrames: 180,
  isLoading: false,
  statusMessage: 'Ready',

  availableLanguages: ['Bengali', 'English', 'Urdu', 'Hindi'],
  translatorsPrimary: ['Taisirul_Quran.json.txt'],
  translatorsSecondary: ['Saheeh_International.json.txt'],
  reciters: [],

  activeTab: 'scripture',
  isExportModalOpen: false,

  setActiveTab: (activeTab) => set({ activeTab }),
  setExportModalOpen: (isExportModalOpen) => set({ isExportModalOpen }),

  updateConfig: (partial) => {
    set((state) => ({ config: { ...state.config, ...partial } }));
    // If FPS changed or duration needs recalculating:
    if (partial.fps) {
      get().refreshAyahSequence();
    }
  },

  changeSurah: async (surahNumber: number) => {
    const surah = getSurahByNumber(surahNumber);
    set((state) => ({
      config: {
        ...state.config,
        surahNumber,
        fromAyah: 1,
        toAyah: Math.min(state.config.toAyah - state.config.fromAyah + 1, surah.totalAyahs),
      },
    }));
    await get().refreshAyahSequence();
  },

  changeAyahRange: async (fromAyah: number, toAyah: number) => {
    const surah = getSurahByNumber(get().config.surahNumber);
    const validFrom = Math.max(1, Math.min(fromAyah, surah.totalAyahs));
    const validTo = Math.max(validFrom, Math.min(toAyah, surah.totalAyahs));

    set((state) => ({
      config: {
        ...state.config,
        fromAyah: validFrom,
        toAyah: validTo,
      },
    }));
    await get().refreshAyahSequence();
  },

  changeScript: async (script: ScriptType) => {
    const defaultFont = SCRIPT_FONT_MAP[script] || 'KFGQPC Uthmanic Script HAFS';
    const defaultLineHeight = SCRIPT_LINE_HEIGHT_MAP[script] || 2.3;
    set((state) => ({
      config: {
        ...state.config,
        script,
        selectedQuranFont: defaultFont,
        arabicLineHeight: defaultLineHeight,
      },
    }));
    await get().refreshAyahSequence();
  },

  changeReciter: async (reciterIndex: number) => {
    set((state) => ({
      config: {
        ...state.config,
        reciterIndex,
      },
    }));
    await get().refreshAyahSequence();
  },

  refreshAyahSequence: async () => {
    const { config } = get();
    const api = window.electronAPI;
    if (!api) return;

    set({ isLoading: true, statusMessage: 'Loading scripture and synchronization...' });

    try {
      const surahMeta = getSurahByNumber(config.surahNumber);

      // 1. Fetch Words
      const wordsMap = await api.getAyahRangeWords(
        config.script,
        config.surahNumber,
        config.fromAyah,
        config.toAyah
      );

      // 2. Fetch Primary Translations
      const primaryTransMap = config.showPrimaryTranslation
        ? await api.getVerseRangeTranslations(
            config.primaryTranslationLang,
            config.primaryTranslationFile,
            config.surahNumber,
            config.fromAyah,
            config.toAyah
          )
        : {};

      // 3. Fetch Secondary Translations
      const secondaryTransMap = config.showSecondaryTranslation
        ? await api.getVerseRangeTranslations(
            config.secondaryTranslationLang,
            config.secondaryTranslationFile,
            config.surahNumber,
            config.fromAyah,
            config.toAyah
          )
        : {};

      // 4. Fetch Audio & Timing Segments
      const audioMap = await api.getAyahRangeAudioData(
        config.reciterIndex,
        config.surahNumber,
        config.fromAyah,
        config.toAyah
      );

      // Build sequence
      const sequence: AyahSequenceData[] = [];
      let totalFrames = 0;

      for (let a = config.fromAyah; a <= config.toAyah; a++) {
        const words = wordsMap[a] || [];
        const audioData = audioMap[a] || {
          audioUrl: '',
          durationInSeconds: 5,
          segments: [],
        };

        const durationInFrames = Math.max(
          30,
          Math.round((audioData.durationInSeconds || 5) * config.fps)
        );

        totalFrames += durationInFrames;

        sequence.push({
          surah: config.surahNumber,
          ayah: a,
          surahNameArabic: surahMeta.nameArabic,
          surahNameTransliterated: surahMeta.nameTransliterated,
          words,
          primaryTranslation: primaryTransMap[a] || '',
          secondaryTranslation: secondaryTransMap[a] || '',
          audioUrl: config.customAudioPath || audioData.audioUrl,
          durationInFrames,
          segments: audioData.segments || [],
        });
      }

      set({
        ayahs: sequence,
        totalDurationInFrames: Math.max(30, totalFrames),
        isLoading: false,
        statusMessage: `Loaded ${sequence.length} Ayah(s)`,
      });
    } catch (err) {
      console.error('Failed to load Ayah sequence:', err);
      set({ isLoading: false, statusMessage: 'Failed to load scripture data' });
    }
  },

  initializeStudio: async () => {
    const api = window.electronAPI;
    if (!api) return;

    try {
      // Load available languages
      const languages = await api.getAvailableLanguages();
      // Load reciters
      const reciters = await api.getReciters();

      // Load translators for initial primary & secondary languages
      const { config } = get();
      const primaryTranslators = await api.getTranslatorsForLanguage(config.primaryTranslationLang);
      const secondaryTranslators = await api.getTranslatorsForLanguage(config.secondaryTranslationLang);

      set({
        availableLanguages: languages,
        reciters,
        translatorsPrimary: primaryTranslators,
        translatorsSecondary: secondaryTranslators,
      });

      // Load initial sequence
      await get().refreshAyahSequence();
    } catch (err) {
      console.error('Failed to initialize studio:', err);
    }
  },
}));
