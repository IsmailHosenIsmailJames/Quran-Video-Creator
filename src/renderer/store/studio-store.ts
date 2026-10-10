import { create } from 'zustand';
import {
  VideoTemplateConfig,
  AyahSequenceData,
  ReciterInfo,
  ScriptType,
  BackgroundClip,
  TransitionType,
  WordSegment,
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

  // Playhead & Playback Sync
  currentFrame: number;
  isPlaying: boolean;

  availableLanguages: string[];
  translatorsPrimary: string[];
  translatorsSecondary: string[];
  reciters: ReciterInfo[];

  activeTab: 'scripture' | 'subtitles' | 'visuals' | 'audio' | 'branding';
  isExportModalOpen: boolean;

  // Actions
  setActiveTab: (tab: 'scripture' | 'subtitles' | 'visuals' | 'audio' | 'branding') => void;
  setExportModalOpen: (open: boolean) => void;
  setCurrentFrame: (currentFrame: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  updateConfig: (partial: Partial<VideoTemplateConfig>) => void;
  setRecitationSpeed: (speed: number) => Promise<void>;
  addBackgroundClip: (clip: Omit<BackgroundClip, 'id'>) => void;
  removeBackgroundClip: (id: string) => void;
  updateBackgroundClip: (id: string, partial: Partial<BackgroundClip>) => void;
  reorderBackgroundClips: (fromIndex: number, toIndex: number) => void;
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

  currentFrame: 0,
  isPlaying: false,

  availableLanguages: ['Bengali', 'English', 'Urdu', 'Hindi'],
  translatorsPrimary: ['Taisirul_Quran.json.txt'],
  translatorsSecondary: ['Saheeh_International.json.txt'],
  reciters: [],

  activeTab: 'scripture',
  isExportModalOpen: false,

  setActiveTab: (activeTab) => set({ activeTab }),
  setExportModalOpen: (isExportModalOpen) => set({ isExportModalOpen }),
  setCurrentFrame: (currentFrame) => set({ currentFrame }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),

  updateConfig: (partial) => {
    set((state) => ({ config: { ...state.config, ...partial } }));
    // If FPS or recitation speed changed:
    if (partial.fps || partial.recitationSpeed !== undefined) {
      get().refreshAyahSequence();
    }
  },

  setRecitationSpeed: async (speed: number) => {
    const clamped = Math.max(0.5, Math.min(2.0, speed));
    set((state) => ({ config: { ...state.config, recitationSpeed: clamped } }));
    await get().refreshAyahSequence();
  },

  addBackgroundClip: (clipData) => {
    const id = `clip_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newClip: BackgroundClip = {
      id,
      ...clipData,
    };
    set((state) => {
      const currentClips = state.config.backgroundClips || [];
      const updatedClips = [...currentClips, newClip];
      return {
        config: {
          ...state.config,
          backgroundClips: updatedClips,
          // Sync primary backgroundPath with the first clip
          backgroundPath: updatedClips[0]?.source || state.config.backgroundPath,
          backgroundType: updatedClips[0]?.type || state.config.backgroundType,
        },
      };
    });
  },

  removeBackgroundClip: (id: string) => {
    set((state) => {
      const currentClips = state.config.backgroundClips || [];
      if (currentClips.length <= 1) {
        return state; // Keep at least one clip
      }
      const updatedClips = currentClips.filter((c) => c.id !== id);
      return {
        config: {
          ...state.config,
          backgroundClips: updatedClips,
          backgroundPath: updatedClips[0]?.source || state.config.backgroundPath,
          backgroundType: updatedClips[0]?.type || state.config.backgroundType,
        },
      };
    });
  },

  updateBackgroundClip: (id: string, partial: Partial<BackgroundClip>) => {
    set((state) => {
      const currentClips = state.config.backgroundClips || [];
      const updatedClips = currentClips.map((c) => (c.id === id ? { ...c, ...partial } : c));
      return {
        config: {
          ...state.config,
          backgroundClips: updatedClips,
          backgroundPath: updatedClips[0]?.source || state.config.backgroundPath,
          backgroundType: updatedClips[0]?.type || state.config.backgroundType,
        },
      };
    });
  },

  reorderBackgroundClips: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const currentClips = [...(state.config.backgroundClips || [])];
      if (
        fromIndex < 0 ||
        fromIndex >= currentClips.length ||
        toIndex < 0 ||
        toIndex >= currentClips.length
      ) {
        return state;
      }
      const [moved] = currentClips.splice(fromIndex, 1);
      currentClips.splice(toIndex, 0, moved);
      return {
        config: {
          ...state.config,
          backgroundClips: currentClips,
          backgroundPath: currentClips[0]?.source || state.config.backgroundPath,
          backgroundType: currentClips[0]?.type || state.config.backgroundType,
        },
      };
    });
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

        const speed = config.recitationSpeed || 1.0;
        const durationInSeconds = (audioData.durationInSeconds || 5) / speed;
        const durationInFrames = Math.max(
          30,
          Math.round(durationInSeconds * config.fps)
        );

        totalFrames += durationInFrames;

        // Scale word timestamps by recitationSpeed so karaoke highlights stay in sync:
        const scaledSegments = (audioData.segments || []).map((seg: WordSegment) => ({
          wordIndex: seg.wordIndex,
          startMs: Math.round(seg.startMs / speed),
          endMs: Math.round(seg.endMs / speed),
        }));

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
          segments: scaledSegments,
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
