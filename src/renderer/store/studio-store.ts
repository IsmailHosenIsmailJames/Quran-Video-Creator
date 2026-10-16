import { create } from 'zustand';
import {
  VideoTemplateConfig,
  AyahSequenceData,
  ReciterInfo,
  ScriptType,
  BackgroundClip,
  TransitionType,
  WordSegment,
  AyahFontOverride,
  QuranWord,
} from '../../shared/types';
import {
  DEFAULT_TEMPLATE_CONFIG,
  SCRIPT_FONT_MAP,
  SCRIPT_LINE_HEIGHT_MAP,
} from '../../shared/constants';
import {
  ThumbnailConfig,
  ThumbnailPresetId,
  DEFAULT_THUMBNAIL_CONFIG,
  THUMBNAIL_PRESET_OPTIONS,
} from '../../shared/thumbnail-types';
import { SURAHS_LIST, getSurahByNumber } from '../../shared/surahs';
import { getLocalizedHeader } from '../../shared/surah-localization';

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

  activeTab: 'scripture' | 'subtitles' | 'visuals' | 'audio' | 'branding' | 'thumbnail';
  isExportModalOpen: boolean;
  isThumbnailModalOpen: boolean;
  thumbnailConfig: ThumbnailConfig;

  // Actions
  setActiveTab: (tab: 'scripture' | 'subtitles' | 'visuals' | 'audio' | 'branding' | 'thumbnail') => void;
  setExportModalOpen: (open: boolean) => void;
  setThumbnailModalOpen: (open: boolean) => void;
  updateThumbnailConfig: (partial: Partial<ThumbnailConfig>) => void;
  applyThumbnailPreset: (presetId: ThumbnailPresetId) => void;
  setCurrentFrame: (currentFrame: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  updateConfig: (partial: Partial<VideoTemplateConfig>) => void;
  updateAyahFontOverride: (surah: number, ayah: number, overrides: Partial<AyahFontOverride>) => void;
  resetAyahFontOverride: (surah: number, ayah: number) => void;
  setRecitationSpeed: (speed: number) => Promise<void>;
  addBackgroundClip: (clip: Omit<BackgroundClip, 'id'>) => Promise<void> | void;
  addBackgroundClips: (clips: Array<Omit<BackgroundClip, 'id'>>) => Promise<void> | void;
  removeBackgroundClip: (id: string) => void;
  updateBackgroundClip: (id: string, partial: Partial<BackgroundClip>) => void;
  updateClipPercentage: (id: string, percentage: number) => void;
  reorderBackgroundClips: (fromIndex: number, toIndex: number) => void;
  changeSurah: (surahNumber: number) => Promise<void>;
  changeAyahRange: (fromAyah: number, toAyah: number) => Promise<void>;
  changeScript: (script: ScriptType) => Promise<void>;
  changeReciter: (reciterIndex: number) => Promise<void>;
  refreshAyahSequence: () => Promise<void>;
  initializeStudio: () => Promise<void>;
  resetToDefault: () => Promise<void>;
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
  isThumbnailModalOpen: false,
  thumbnailConfig: DEFAULT_THUMBNAIL_CONFIG,

  setActiveTab: (activeTab) => set({ activeTab }),
  setExportModalOpen: (isExportModalOpen) => set({ isExportModalOpen }),
  setThumbnailModalOpen: (isThumbnailModalOpen) => set({ isThumbnailModalOpen }),
  updateThumbnailConfig: (partial) => {
    set((state) => ({
      thumbnailConfig: { ...state.thumbnailConfig, ...partial },
    }));
  },
  applyThumbnailPreset: (presetId) => {
    const preset = THUMBNAIL_PRESET_OPTIONS.find((p) => p.id === presetId);
    if (!preset) return;
    set((state) => ({
      thumbnailConfig: {
        ...state.thumbnailConfig,
        preset: preset.id,
        layoutMode: preset.layoutMode,
        accentThemeColor: preset.accentColor,
        surahCalligraphyColor: preset.accentColor,
        hookTitleText: preset.hookTitle,
        hookTitleSubtitle: preset.hookSubtitle,
        hookTitleColor: preset.secondaryColor,
        bgPresetUrl: preset.bgPresetUrl,
        bgOverlayOpacity: preset.bgOverlayOpacity,
        bgOverlayColor: preset.bgOverlayColor,
        showIslamicArchFrame: preset.showArchFrame,
        showArabesqueCorners: preset.showArabesqueCorners,
        showSunRays: preset.showSunRays,
        showGoldenSparks: preset.showGoldenSparks,
        badgeCustomText: preset.badgeText,
        goldGradientText: preset.goldGradientText,
        calligraphyMedallion: true,
      },
    }));
  },
  setCurrentFrame: (currentFrame) => set({ currentFrame }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),

  updateConfig: (partial) => {
    set((state) => ({ config: { ...state.config, ...partial } }));
    // If FPS, recitation speed, includeBismillah, aspectRatio, or intro settings changed:
    if (
      partial.fps ||
      partial.recitationSpeed !== undefined ||
      partial.includeBismillah !== undefined ||
      partial.aspectRatio !== undefined ||
      partial.enableIntroVideo !== undefined ||
      partial.introMode !== undefined ||
      partial.introPreset !== undefined ||
      partial.introTitle !== undefined ||
      partial.introSubtitle !== undefined ||
      partial.introCustomLogo !== undefined ||
      partial.introThemeColor !== undefined ||
      partial.introVideoPath !== undefined ||
      partial.introVideoDurationSeconds !== undefined ||
      partial.skipIntroForShorts !== undefined ||
      partial.enableSurahTitleCard !== undefined ||
      partial.titleCardDurationSeconds !== undefined ||
      partial.titleCardPreset !== undefined ||
      partial.titleCardThemeColor !== undefined ||
      partial.showReciterInTitleCard !== undefined ||
      partial.showStyleInTitleCard !== undefined ||
      partial.showVerseRangeInTitleCard !== undefined ||
      partial.showTranslationInTitleCard !== undefined ||
      partial.titleCardTransition !== undefined ||
      partial.skipTitleCardForShorts !== undefined ||
      partial.enableOutroVideo !== undefined ||
      partial.outroMode !== undefined ||
      partial.outroPreset !== undefined ||
      partial.outroTitle !== undefined ||
      partial.outroSubtitle !== undefined ||
      partial.outroCustomLogo !== undefined ||
      partial.outroThemeColor !== undefined ||
      partial.outroVideoPath !== undefined ||
      partial.outroVideoDurationSeconds !== undefined ||
      partial.skipOutroForShorts !== undefined ||
      partial.outroMuted !== undefined ||
      partial.outroTransition !== undefined
    ) {
      get().refreshAyahSequence();
    }
  },

  updateAyahFontOverride: (surah: number, ayah: number, overrides: Partial<AyahFontOverride>) => {
    const key = `${surah}:${ayah}`;
    set((state) => {
      const currentMap = state.config.ayahFontOverrides || {};
      const existing = currentMap[key] || {};
      const updated = { ...existing, ...overrides };
      return {
        config: {
          ...state.config,
          ayahFontOverrides: {
            ...currentMap,
            [key]: updated,
          },
        },
      };
    });
  },

  resetAyahFontOverride: (surah: number, ayah: number) => {
    const key = `${surah}:${ayah}`;
    set((state) => {
      const currentMap = { ...(state.config.ayahFontOverrides || {}) };
      delete currentMap[key];
      return {
        config: {
          ...state.config,
          ayahFontOverrides: currentMap,
        },
      };
    });
  },

  setRecitationSpeed: async (speed: number) => {
    const clamped = Math.max(0.5, Math.min(2.0, speed));
    set((state) => ({ config: { ...state.config, recitationSpeed: clamped } }));
    await get().refreshAyahSequence();
  },

  addBackgroundClips: async (clipsData: Array<Omit<BackgroundClip, 'id'>>) => {
    if (!clipsData || clipsData.length === 0) return;

    // Auto-probe natural duration for any video clips missing sourceDurationSeconds
    const preparedClips = await Promise.all(
      clipsData.map(async (clipData) => {
        let sourceDurationSeconds = clipData.sourceDurationSeconds;
        if (clipData.type === 'video' && !sourceDurationSeconds && window.electronAPI?.probeMediaDuration) {
          try {
            sourceDurationSeconds = await window.electronAPI.probeMediaDuration(clipData.source);
          } catch (e) {
            // ignore
          }
        }
        return {
          ...clipData,
          sourceDurationSeconds,
        };
      })
    );

    set((state) => {
      const currentClips = state.config.backgroundClips || [];
      const N = currentClips.length;
      const M = preparedClips.length;
      const totalCount = N + M;

      let updatedClips: BackgroundClip[];

      if (N === 0) {
        // All M clips share the timeline equally: 100 / M each
        const sharePerClip = 100 / M;
        updatedClips = preparedClips.map((clipData, idx) => ({
          id: `clip_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
          ...clipData,
          percentage: Number(sharePerClip.toFixed(2)),
          durationRatio: Number((sharePerClip / 100).toFixed(4)),
          autoFitSpeed: clipData.autoFitSpeed ?? true,
        }));
      } else {
        // Scale existing N clips proportionally down by scaleFactor (preserves all existing clips!)
        const scaleFactor = N / totalCount;
        const currentTotal = currentClips.reduce((sum, c) => sum + (c.percentage || 100 / N), 0);
        const normFactor = currentTotal > 0 ? 100 / currentTotal : 1;

        const scaledExisting = currentClips.map((c) => {
          const origPercent = (c.percentage || 100 / N) * normFactor;
          const scaledPercent = Number((origPercent * scaleFactor).toFixed(2));
          return {
            ...c,
            percentage: scaledPercent,
            durationRatio: Number((scaledPercent / 100).toFixed(4)),
          };
        });

        // Each of the M new clips gets 100 / totalCount
        const newClipShare = 100 / totalCount;
        const newClips: BackgroundClip[] = preparedClips.map((clipData, idx) => ({
          id: `clip_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
          ...clipData,
          percentage: Number(newClipShare.toFixed(2)),
          durationRatio: Number((newClipShare / 100).toFixed(4)),
          autoFitSpeed: clipData.autoFitSpeed ?? true,
        }));

        // Placed one after another at the right!
        updatedClips = [...scaledExisting, ...newClips];
      }

      // Reconcile rounding diff
      const sum = updatedClips.reduce((s, c) => s + (c.percentage || 0), 0);
      const diff = 100 - sum;
      if (Math.abs(diff) > 0.001 && updatedClips.length > 0) {
        const last = updatedClips[updatedClips.length - 1];
        last.percentage = Number((last.percentage! + diff).toFixed(2));
        last.durationRatio = Number((last.percentage! / 100).toFixed(4));
      }

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

  addBackgroundClip: async (clipData) => {
    return get().addBackgroundClips([clipData]);
  },

  removeBackgroundClip: (id: string) => {
    set((state) => {
      const currentClips = state.config.backgroundClips || [];
      if (currentClips.length <= 1) {
        return state; // Keep at least one clip
      }
      const remaining = currentClips.filter((c) => c.id !== id);
      const remainingSum = remaining.reduce((sum, c) => sum + (c.percentage || 100 / remaining.length), 0);
      const factor = remainingSum > 0 ? 100 / remainingSum : 1;

      const updatedClips = remaining.map((c) => {
        const scaled = Number(((c.percentage || 100 / remaining.length) * factor).toFixed(2));
        return {
          ...c,
          percentage: scaled,
          durationRatio: Number((scaled / 100).toFixed(4)),
        };
      });

      const sum = updatedClips.reduce((s, c) => s + (c.percentage || 0), 0);
      const diff = 100 - sum;
      if (Math.abs(diff) > 0.001 && updatedClips.length > 0) {
        const last = updatedClips[updatedClips.length - 1];
        last.percentage = Number((last.percentage! + diff).toFixed(2));
        last.durationRatio = Number((last.percentage! / 100).toFixed(4));
      }

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

  updateClipPercentage: (id: string, newPercentage: number) => {
    set((state) => {
      const currentClips = state.config.backgroundClips || [];
      const clipIndex = currentClips.findIndex((c) => c.id === id);
      if (clipIndex === -1 || currentClips.length <= 1) return state;

      const totalClips = currentClips.length;
      const minPercentage = 2.0;
      const maxPercentage = 100 - (totalClips - 1) * minPercentage;
      const clampedTarget = Math.max(minPercentage, Math.min(maxPercentage, newPercentage));

      const oldClip = currentClips[clipIndex];
      const oldPercentage = oldClip.percentage || 100 / totalClips;
      const delta = clampedTarget - oldPercentage;

      // Other clips share the absorption of -delta proportionally
      const otherClips = currentClips.filter((c) => c.id !== id);
      const otherTotal = otherClips.reduce((sum, c) => sum + (c.percentage || 100 / totalClips), 0);

      const updatedClips = currentClips.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            percentage: Number(clampedTarget.toFixed(2)),
            durationRatio: Number((clampedTarget / 100).toFixed(4)),
          };
        }
        const proportion = otherTotal > 0 ? (c.percentage || 100 / totalClips) / otherTotal : 1 / otherClips.length;
        const adjusted = Math.max(minPercentage, (c.percentage || 100 / totalClips) - delta * proportion);
        return {
          ...c,
          percentage: Number(adjusted.toFixed(2)),
          durationRatio: Number((adjusted / 100).toFixed(4)),
        };
      });

      const currentSum = updatedClips.reduce((s, c) => s + (c.percentage || 0), 0);
      const diff = 100 - currentSum;
      if (Math.abs(diff) > 0.001) {
        const adjustIdx = clipIndex === 0 ? 1 : 0;
        updatedClips[adjustIdx].percentage = Number((updatedClips[adjustIdx].percentage! + diff).toFixed(2));
        updatedClips[adjustIdx].durationRatio = Number((updatedClips[adjustIdx].percentage! / 100).toFixed(4));
      }

      return {
        config: {
          ...state.config,
          backgroundClips: updatedClips,
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

      // Fetch Words, Translations, and Timing/Audio Data concurrently in parallel
      const [wordsMap, primaryTransMap, secondaryTransMap, audioMap] = await Promise.all([
        api.getAyahRangeWords(
          config.script,
          config.surahNumber,
          config.fromAyah,
          config.toAyah
        ),
        config.showPrimaryTranslation
          ? api.getVerseRangeTranslations(
              config.primaryTranslationLang,
              config.primaryTranslationFile,
              config.surahNumber,
              config.fromAyah,
              config.toAyah
            )
          : Promise.resolve({} as Record<number, string>),
        config.showSecondaryTranslation
          ? api.getVerseRangeTranslations(
              config.secondaryTranslationLang,
              config.secondaryTranslationFile,
              config.surahNumber,
              config.fromAyah,
              config.toAyah
            )
          : Promise.resolve({} as Record<number, string>),
        api.getAyahRangeAudioData(
          config.reciterIndex,
          config.surahNumber,
          config.fromAyah,
          config.toAyah
        ),
      ]);

      // Build sequence
      const sequence: AyahSequenceData[] = [];
      let totalFrames = 0;
      const speed = config.recitationSpeed || 1.0;

      // Check if Bismillah preface should precede the sequence
      // Rules:
      // 1. Never add Bismillah to Surah 9 (At-Tawbah)
      // 2. Never duplicate Bismillah if Surah 1 (Al-Fatihah) begins with Ayah 1
      // 3. User must have enabled it (config.includeBismillah !== false)
      const shouldAddBismillah =
        config.includeBismillah !== false &&
        config.surahNumber !== 9 &&
        !(config.surahNumber === 1 && config.fromAyah === 1);

      if (shouldAddBismillah) {
        try {
          const [bismillahRawWords, bismillahPrimaryTranslation, bismillahSecondaryTranslation, bismillahAudio] =
            await Promise.all([
              api.getAyahWords(config.script, 1, 1),
              config.showPrimaryTranslation
                ? api.getVerseTranslation(
                    config.primaryTranslationLang,
                    config.primaryTranslationFile,
                    1,
                    1
                  )
                : Promise.resolve(''),
              config.showSecondaryTranslation
                ? api.getVerseTranslation(
                    config.secondaryTranslationLang,
                    config.secondaryTranslationFile,
                    1,
                    1
                  )
                : Promise.resolve(''),
              api.getAyahAudioData(
                config.reciterIndex,
                1,
                1
              ),
            ]);

          const bismillahWords: QuranWord[] = (bismillahRawWords || []).slice(0, 4).map((w: QuranWord, idx: number) => ({
            id: -(idx + 1),
            location: `${config.surahNumber}:0:${w.word}`,
            surah: config.surahNumber,
            ayah: 0,
            word: w.word,
            text: w.text,
          }));

          const bDurationInSeconds = (bismillahAudio.durationInSeconds || 5) / speed;
          const bDurationInFrames = Math.max(
            30,
            Math.round(bDurationInSeconds * config.fps)
          );

          totalFrames += bDurationInFrames;

          const scaledBismillahSegments = (bismillahAudio.segments || [])
            .filter((seg: WordSegment) => seg.wordIndex <= 4)
            .map((seg: WordSegment) => ({
              wordIndex: seg.wordIndex,
              startMs: Math.round(seg.startMs / speed),
              endMs: Math.round(seg.endMs / speed),
            }));

          const localizedBismillah = getLocalizedHeader(config, config.surahNumber, 0);
          sequence.push({
            surah: config.surahNumber,
            ayah: 0,
            surahNameArabic: surahMeta.nameArabic,
            surahNameTransliterated: surahMeta.nameTransliterated,
            surahNameLocalized: localizedBismillah.surahName,
            ayahLabelLocalized: localizedBismillah.ayahLabel,
            words: bismillahWords,
            primaryTranslation: bismillahPrimaryTranslation,
            secondaryTranslation: bismillahSecondaryTranslation,
            audioUrl: config.customAudioPath || bismillahAudio.audioUrl,
            durationInFrames: bDurationInFrames,
            segments: scaledBismillahSegments,
          });
        } catch (bErr) {
          console.warn('Failed to prepend Bismillah:', bErr);
        }
      }

      for (let a = config.fromAyah; a <= config.toAyah; a++) {
        const words = wordsMap[a] || [];
        const audioData = audioMap[a] || {
          audioUrl: '',
          durationInSeconds: 5,
          segments: [],
        };

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

        const localizedAyah = getLocalizedHeader(config, config.surahNumber, a);
        sequence.push({
          surah: config.surahNumber,
          ayah: a,
          surahNameArabic: surahMeta.nameArabic,
          surahNameTransliterated: surahMeta.nameTransliterated,
          surahNameLocalized: localizedAyah.surahName,
          ayahLabelLocalized: localizedAyah.ayahLabel,
          words,
          primaryTranslation: primaryTransMap[a] || '',
          secondaryTranslation: secondaryTransMap[a] || '',
          audioUrl: config.customAudioPath || audioData.audioUrl,
          durationInFrames,
          segments: scaledSegments,
        });
      }

      const isIntroActive = Boolean(
        config.enableIntroVideo &&
        (config.introMode === 'custom-video' ? config.introVideoPath : true) &&
        !(config.skipIntroForShorts !== false && config.aspectRatio === '9:16')
      );
      const introFrames = isIntroActive
        ? Math.max(1, Math.round((config.introVideoDurationSeconds || 4) * config.fps))
        : 0;

      const isTitleCardActive = Boolean(
        config.enableSurahTitleCard &&
        !(config.skipTitleCardForShorts !== false && config.aspectRatio === '9:16')
      );
      const titleCardFrames = isTitleCardActive
        ? Math.max(1, Math.round((config.titleCardDurationSeconds || 3.5) * config.fps))
        : 0;

      const isOutroActive = Boolean(
        config.enableOutroVideo &&
        (config.outroMode === 'custom-video' ? config.outroVideoPath : true) &&
        !(config.skipOutroForShorts !== false && config.aspectRatio === '9:16')
      );
      const outroFrames = isOutroActive
        ? Math.max(1, Math.round((config.outroVideoDurationSeconds || 4.5) * config.fps))
        : 0;

      const grandTotalFrames = Math.max(30, totalFrames + introFrames + titleCardFrames + outroFrames);

      set({
        ayahs: sequence,
        totalDurationInFrames: grandTotalFrames,
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

    isHydratingOrResetting = true;
    try {
      // 1. Load saved preferences from local database
      let savedSettings: Partial<VideoTemplateConfig> = {};
      if (api.loadSettings) {
        try {
          savedSettings = await api.loadSettings();
        } catch (err) {
          console.error('Failed to load saved settings:', err);
        }
      }

      if (savedSettings.channelHandle === '@AnNafee_Official') {
        savedSettings.channelHandle = '';
      }
      if (!savedSettings.logoPath && (!savedSettings.channelHandle || savedSettings.channelHandle === '')) {
        savedSettings.showBranding = false;
      }

      const initialConfig: VideoTemplateConfig = {
        ...DEFAULT_TEMPLATE_CONFIG,
        ...savedSettings,
        // Start fresh with Surah 1 Al-Fatiha for new video creation sessions
        surahNumber: DEFAULT_TEMPLATE_CONFIG.surahNumber,
        fromAyah: DEFAULT_TEMPLATE_CONFIG.fromAyah,
        toAyah: DEFAULT_TEMPLATE_CONFIG.toAyah,
        customAudioPath: undefined,
      };

      // 2. Load available languages and reciters
      const languages = await api.getAvailableLanguages();
      const reciters = await api.getReciters();

      // 3. Load translators for configured primary & secondary languages
      const primaryTranslators = await api.getTranslatorsForLanguage(initialConfig.primaryTranslationLang);
      const secondaryTranslators = await api.getTranslatorsForLanguage(initialConfig.secondaryTranslationLang);

      // Verify that selected translation files are available
      if (primaryTranslators.length > 0 && !primaryTranslators.includes(initialConfig.primaryTranslationFile)) {
        initialConfig.primaryTranslationFile = primaryTranslators[0];
      }
      if (secondaryTranslators.length > 0 && !secondaryTranslators.includes(initialConfig.secondaryTranslationFile)) {
        initialConfig.secondaryTranslationFile = secondaryTranslators[0];
      }

      set({
        config: initialConfig,
        availableLanguages: languages,
        reciters,
        translatorsPrimary: primaryTranslators,
        translatorsSecondary: secondaryTranslators,
      });

      // 4. Load initial sequence
      await get().refreshAyahSequence();
    } catch (err) {
      console.error('Failed to initialize studio:', err);
    } finally {
      setTimeout(() => {
        isHydratingOrResetting = false;
      }, 300);
    }
  },

  resetToDefault: async () => {
    const api = window.electronAPI;
    set({ isLoading: true, statusMessage: 'Resetting settings to default...' });
    isHydratingOrResetting = true;
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }

    try {
      if (api?.resetSettings) {
        await api.resetSettings();
      }

      let primaryTranslators = get().translatorsPrimary;
      let secondaryTranslators = get().translatorsSecondary;

      if (api) {
        primaryTranslators = await api.getTranslatorsForLanguage(DEFAULT_TEMPLATE_CONFIG.primaryTranslationLang);
        secondaryTranslators = await api.getTranslatorsForLanguage(DEFAULT_TEMPLATE_CONFIG.secondaryTranslationLang);
      }

      set({
        config: { ...DEFAULT_TEMPLATE_CONFIG },
        translatorsPrimary: primaryTranslators,
        translatorsSecondary: secondaryTranslators,
        statusMessage: 'Reset all settings to default',
      });

      await get().refreshAyahSequence();
    } catch (err) {
      console.error('Failed to reset settings to default:', err);
    } finally {
      setTimeout(() => {
        isHydratingOrResetting = false;
      }, 300);
    }
  },
}));

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
let isHydratingOrResetting = false;

export const triggerAutoSave = (config: VideoTemplateConfig) => {
  if (isHydratingOrResetting) return;
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(async () => {
    try {
      if (window.electronAPI?.saveSettings) {
        await window.electronAPI.saveSettings(config);
      }
    } catch (err) {
      console.error('Failed to auto-save settings:', err);
    }
  }, 400);
};

useStudioStore.subscribe((state, prevState) => {
  if (state.config !== prevState.config) {
    triggerAutoSave(state.config);
  }
});
