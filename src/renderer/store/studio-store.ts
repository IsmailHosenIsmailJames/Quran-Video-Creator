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
  WhisperTimestampManifest,
  SalatJammatManifest,
  WhisperSalatSegment,
  WhisperSalatAyahTiming,
  UnifiedTimestampManifest,
  isSalatJammatManifest,
} from '../../shared/types';
import {
  DEFAULT_TEMPLATE_CONFIG,
  BACKGROUND_PRESETS,
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
import {
  validateAndParseTimestampJson,
  convertAyahToRelativeSegments,
  convertBasmalaToRelativeSegments,
} from '../../shared/custom-timestamp-utils';

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

  activeTab: 'scripture' | 'subtitles' | 'visuals' | 'audio' | 'branding' | 'thumbnail' | 'youtube';
  isExportModalOpen: boolean;
  isThumbnailModalOpen: boolean;
  thumbnailConfig: ThumbnailConfig;

  // Custom AI / Whisper Alignment Data (Single Surah or Salat Jama'ah)
  customTimestamp: UnifiedTimestampManifest | null;
  customTimestampPath: string | null;
  customTimestampError: string | null;

  // Actions
  setActiveTab: (tab: 'scripture' | 'subtitles' | 'visuals' | 'audio' | 'branding' | 'thumbnail' | 'youtube') => void;
  setExportModalOpen: (open: boolean) => void;
  setThumbnailModalOpen: (open: boolean) => void;
  updateThumbnailConfig: (partial: Partial<ThumbnailConfig>) => void;
  applyThumbnailPreset: (presetId: ThumbnailPresetId) => void;
  setCurrentFrame: (currentFrame: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  updateConfig: (partial: Partial<VideoTemplateConfig>) => void;
  loadCustomTimestamp: (content: string | unknown, filePath?: string) => Promise<{ success: boolean; message?: string }>;
  clearCustomTimestamp: () => Promise<void>;
  selectFullRecitationAudio: (filePath: string) => Promise<void>;
  clearFullRecitationAudio: () => Promise<void>;
  selectRecitationVideo: (filePath: string) => Promise<void>;
  clearRecitationVideo: () => Promise<void>;
  toggleRecitationVideoBackground: (enabled: boolean) => void;
  toggleRecitationVideoAudio: (enabled: boolean) => Promise<void>;
  updateAyahFontOverride: (surah: number, ayah: number, overrides: Partial<AyahFontOverride>) => void;
  resetAyahFontOverride: (surah: number, ayah: number) => void;
  setRecitationSpeed: (speed: number) => Promise<void>;
  addBackgroundClip: (clip: Omit<BackgroundClip, 'id'>) => Promise<void> | void;
  addBackgroundClips: (clips: Array<Omit<BackgroundClip, 'id'>>) => Promise<void> | void;
  removeBackgroundClip: (id: string) => void;
  updateBackgroundClip: (id: string, partial: Partial<BackgroundClip>) => void;
  updateClipPercentage: (id: string, percentage: number) => void;
  reorderBackgroundClips: (fromIndex: number, toIndex: number) => void;
  resetBackgroundClips: () => void;
  restoreBackgroundClips: (clips: BackgroundClip[]) => void;
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

  customTimestamp: null,
  customTimestampPath: null,
  customTimestampError: null,

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
        bgBlur: preset.bgBlur !== undefined ? preset.bgBlur : (preset.layoutMode === 'reciter-focus' ? 14 : 0),
        showIslamicArchFrame: preset.showArchFrame,
        showArabesqueCorners: preset.showArabesqueCorners,
        showSunRays: preset.showSunRays,
        showGoldenSparks: preset.showGoldenSparks,
        badgeCustomText: preset.badgeText,
        goldGradientText: preset.goldGradientText,
        calligraphyMedallion: true,
        reciterPortraitPosition: preset.reciterPortraitPosition ?? (preset.id === 'nufais-gold' ? 'right' : 'left'),
        reciterPortraitFrameStyle: preset.reciterPortraitFrameStyle ?? 'feathered-bleed',
        reciterPortraitFeatherWidth: preset.reciterPortraitFeatherWidth ?? 0.38,
        titleLanguageMode: preset.titleLanguageMode ?? (preset.layoutMode === 'reciter-focus' ? 'bengali' : 'calligraphy-english'),
        showHookTitle: preset.showHookTitle !== undefined ? preset.showHookTitle : (preset.layoutMode === 'reciter-focus' ? false : true),
        activeBadge: preset.activeBadge ?? 'none',
        directionalShadowRamp: preset.directionalShadowRamp !== undefined ? preset.directionalShadowRamp : true,
        directionalShadowOpacity: preset.directionalShadowOpacity ?? 0.90,
        directionalShadowWidth: preset.directionalShadowWidth ?? 0.65,
        showReciterPortrait: preset.layoutMode === 'reciter-focus' ? true : state.thumbnailConfig.showReciterPortrait,
        showAyahRangeBadge: preset.layoutMode === 'reciter-focus' ? false : state.thumbnailConfig.showAyahRangeBadge,
        showTranslationBadge: preset.layoutMode === 'reciter-focus' ? false : state.thumbnailConfig.showTranslationBadge,
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
      partial.titleCardScale !== undefined ||
      partial.titleCardWidthPercent !== undefined ||
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
      partial.outroTransition !== undefined ||
      partial.customAudioPath !== undefined ||
      partial.customTimestampPath !== undefined ||
      partial.recitationVideoPath !== undefined ||
      partial.useRecitationVideoAudio !== undefined ||
      partial.useRecitationVideoAsBackground !== undefined
    ) {
      get().refreshAyahSequence();
    }
  },

  loadCustomTimestamp: async (content: string | unknown, filePath?: string) => {
    const result = validateAndParseTimestampJson(content);
    if (!result.success || !result.data) {
      const err = result.error || 'Failed to parse timestamp JSON';
      set({ customTimestampError: err, statusMessage: `Timestamp Error: ${err}` });
      return { success: false, message: err };
    }

    const manifest = result.data;
    const fileName = filePath ? filePath.split(/[/\\]/).pop() || 'custom_timestamps.json' : 'custom_timestamps.json';
    const contentString = typeof content === 'string' ? content : JSON.stringify(content);

    // Save to persistent SQLite storage so restart never loses it
    if (window.electronAPI?.saveCustomTimestamp) {
      window.electronAPI.saveCustomTimestamp(contentString).catch((err: any) =>
        console.warn('Failed to cache custom timestamp in SQLite:', err)
      );
    }

    if (isSalatJammatManifest(manifest)) {
      const firstSeg = manifest.segments[0];
      const lastSeg = manifest.segments[manifest.segments.length - 1];
      const totalAyahs = manifest.all_ayahs?.length || manifest.segments.reduce((acc, s) => acc + s.ayahs.length, 0);

      set((state) => ({
        customTimestamp: manifest,
        customTimestampPath: filePath || fileName,
        customTimestampError: null,
        config: {
          ...state.config,
          recitationMode: 'salat-jammat',
          salatSegments: manifest.segments,
          surahNumber: firstSeg ? firstSeg.surah_number : state.config.surahNumber,
          fromAyah: firstSeg ? firstSeg.start_ayah : state.config.fromAyah,
          toAyah: lastSeg ? lastSeg.end_ayah : state.config.toAyah,
          customTimestampPath: filePath || fileName,
          hasCustomTimestamp: true,
          includeBismillah: false, // Salat recitations have Bismillah integrated or silent
          customAudioFileName: manifest.filename || state.config.customAudioFileName,
          recitationVideoFileName: manifest.filename || state.config.recitationVideoFileName,
        },
        statusMessage: `Loaded Salat Jama'ah Alignment (${manifest.segments.length} segments, ${totalAyahs} ayahs)`,
      }));

      await get().refreshAyahSequence();
      return {
        success: true,
        message: `Successfully loaded Salat Jama'ah (${manifest.segments.length} segments, ${totalAyahs} ayahs) from ${fileName}`,
      };
    } else {
      set((state) => ({
        customTimestamp: manifest,
        customTimestampPath: filePath || fileName,
        customTimestampError: null,
        config: {
          ...state.config,
          recitationMode: 'single-surah',
          salatSegments: undefined,
          surahNumber: manifest.surah_number,
          fromAyah: manifest.start_ayah,
          toAyah: manifest.end_ayah,
          customTimestampPath: filePath || fileName,
          hasCustomTimestamp: true,
          includeBismillah: manifest.preamble?.has_basmala ? true : state.config.includeBismillah,
        },
        statusMessage: `Loaded Whisper alignment for Surah ${manifest.surah_name_en} (${manifest.start_ayah}–${manifest.end_ayah})`,
      }));

      await get().refreshAyahSequence();
      return {
        success: true,
        message: `Successfully loaded ${manifest.ayahs.length} verses (${manifest.surah_name_en}) from ${fileName}`,
      };
    }
  },

  clearCustomTimestamp: async () => {
    if (window.electronAPI?.saveCustomTimestamp) {
      window.electronAPI.saveCustomTimestamp(null).catch((err: any) =>
        console.warn('Failed to clear cached custom timestamp in SQLite:', err)
      );
    }
    set((state) => ({
      customTimestamp: null,
      customTimestampPath: null,
      customTimestampError: null,
      config: {
        ...state.config,
        recitationMode: 'single-surah',
        salatSegments: undefined,
        customTimestampPath: undefined,
        hasCustomTimestamp: false,
      },
      statusMessage: 'Reset to standard recitation timing',
    }));
    await get().refreshAyahSequence();
  },

  selectFullRecitationAudio: async (filePath: string) => {
    let probedDuration = 0;
    try {
      if (window.electronAPI?.probeMediaDuration) {
        probedDuration = await window.electronAPI.probeMediaDuration(filePath);
      }
    } catch (e) {
      console.warn('Failed to probe audio duration:', e);
    }

    const fileName = filePath.split(/[/\\]/).pop() || 'recitation.mp3';

    set((state) => ({
      config: {
        ...state.config,
        customAudioPath: filePath,
        recitationAudioMode: 'full-surah-file',
        customAudioDurationSeconds: probedDuration > 0 ? probedDuration : undefined,
        customAudioFileName: fileName,
      },
      statusMessage: `Selected full recitation audio: ${fileName}`,
    }));

    await get().refreshAyahSequence();
  },

  clearFullRecitationAudio: async () => {
    set((state) => ({
      config: {
        ...state.config,
        customAudioPath: undefined,
        recitationAudioMode: 'cdn-per-ayah',
        customAudioDurationSeconds: undefined,
        customAudioFileName: undefined,
      },
      statusMessage: 'Reverted to standard CDN recitation audio',
    }));

    await get().refreshAyahSequence();
  },

  selectRecitationVideo: async (filePath: string) => {
    let probedDuration = 0;
    try {
      if (window.electronAPI?.probeMediaDuration) {
        probedDuration = await window.electronAPI.probeMediaDuration(filePath);
      }
    } catch (e) {
      console.warn('Failed to probe recitation video duration:', e);
    }

    const fileName = filePath.split(/[/\\]/).pop() || 'recitation_video.mp4';

    set((state) => ({
      config: {
        ...state.config,
        recitationVideoPath: filePath,
        useRecitationVideoAsBackground: true,
        useRecitationVideoAudio: state.config.useRecitationVideoAudio !== false,
        recitationVideoDurationSeconds: probedDuration > 0 ? probedDuration : undefined,
        recitationVideoFileName: fileName,
      },
      statusMessage: `Loaded recitation video background: ${fileName}`,
    }));

    await get().refreshAyahSequence();
  },

  clearRecitationVideo: async () => {
    set((state) => ({
      config: {
        ...state.config,
        recitationVideoPath: undefined,
        useRecitationVideoAsBackground: false,
        useRecitationVideoAudio: false,
        recitationVideoDurationSeconds: undefined,
        recitationVideoFileName: undefined,
      },
      statusMessage: 'Removed recitation video background',
    }));

    await get().refreshAyahSequence();
  },

  toggleRecitationVideoBackground: (enabled: boolean) => {
    set((state) => ({
      config: {
        ...state.config,
        useRecitationVideoAsBackground: enabled,
      },
    }));
  },

  toggleRecitationVideoAudio: async (enabled: boolean) => {
    set((state) => ({
      config: {
        ...state.config,
        useRecitationVideoAudio: enabled,
      },
    }));
    await get().refreshAyahSequence();
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

  resetBackgroundClips: () => {
    const defaultClips: BackgroundClip[] = DEFAULT_TEMPLATE_CONFIG.backgroundClips
      ? JSON.parse(JSON.stringify(DEFAULT_TEMPLATE_CONFIG.backgroundClips))
      : [
          {
            id: 'clip-preset-1',
            type: 'preset',
            source: BACKGROUND_PRESETS[0].url,
            name: BACKGROUND_PRESETS[0].name,
            percentage: 100,
            durationRatio: 1.0,
            speed: 1.0,
            autoFitSpeed: true,
            trimStartSeconds: 0,
            kenBurns: true,
            transition: 'zoom-fade',
            transitionDurationFrames: 24,
          },
        ];

    set((state) => ({
      config: {
        ...state.config,
        backgroundClips: defaultClips,
        backgroundPath: defaultClips[0]?.source || BACKGROUND_PRESETS[0].url,
        backgroundType: defaultClips[0]?.type || 'preset',
      },
      statusMessage: 'Reset timeline media to default',
    }));
  },

  restoreBackgroundClips: (clips: BackgroundClip[]) => {
    if (!clips || clips.length === 0) return;
    set((state) => ({
      config: {
        ...state.config,
        backgroundClips: clips,
        backgroundPath: clips[0]?.source || state.config.backgroundPath,
        backgroundType: clips[0]?.type || state.config.backgroundType,
      },
      statusMessage: 'Restored timeline media clips',
    }));
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
    const { config, customTimestamp } = get();
    const api = window.electronAPI;
    if (!api) return;

    set({ isLoading: true, statusMessage: 'Loading scripture and synchronization...' });

    try {
      if (isSalatJammatManifest(customTimestamp)) {
        const salatAyahs = customTimestamp.all_ayahs && customTimestamp.all_ayahs.length > 0
          ? customTimestamp.all_ayahs
          : customTimestamp.segments.flatMap((s) => s.ayahs);

        if (salatAyahs.length === 0) {
          set({ isLoading: false });
          return;
        }

        // 1. Identify all unique Surahs present in the Salat recording
        const uniqueSurahs = Array.from(new Set(salatAyahs.map((a) => a.surah_number)));

        // 2. Fetch words and translations for all unique Surahs in parallel
        const surahDataPromises = uniqueSurahs.map(async (sNum) => {
          const ayahsOfSurah = salatAyahs.filter((a) => a.surah_number === sNum);
          const minA = Math.min(...ayahsOfSurah.map((a) => a.ayah_number));
          const maxA = Math.max(...ayahsOfSurah.map((a) => a.ayah_number));

          const [words, primaryTrans, secondaryTrans] = await Promise.all([
            api.getAyahRangeWords(config.script, sNum, minA, maxA),
            config.showPrimaryTranslation
              ? api.getVerseRangeTranslations(
                  config.primaryTranslationLang,
                  config.primaryTranslationFile,
                  sNum,
                  minA,
                  maxA
                )
              : Promise.resolve({} as Record<number, string>),
            config.showSecondaryTranslation
              ? api.getVerseRangeTranslations(
                  config.secondaryTranslationLang,
                  config.secondaryTranslationFile,
                  sNum,
                  minA,
                  maxA
                )
              : Promise.resolve({} as Record<number, string>),
          ]);

          return { sNum, words, primaryTrans, secondaryTrans };
        });

        const surahResults = await Promise.all(surahDataPromises);
        const wordsBySurah: Record<number, Record<number, QuranWord[]>> = {};
        const primaryBySurah: Record<number, Record<number, string>> = {};
        const secondaryBySurah: Record<number, Record<number, string>> = {};

        surahResults.forEach((res) => {
          wordsBySurah[res.sNum] = res.words;
          primaryBySurah[res.sNum] = res.primaryTrans;
          secondaryBySurah[res.sNum] = res.secondaryTrans;
        });

        const sequence: AyahSequenceData[] = [];
        let totalFrames = 0;
        const speed = config.recitationSpeed || 1.0;
        const effectiveAudioUrl =
          (config.useRecitationVideoAudio && config.recitationVideoPath) ||
          config.customAudioPath ||
          '';

        // 3. Pre-recitation silence / initial spacer (e.g. 0 to 1230ms)
        const firstAyah = salatAyahs[0];
        if (firstAyah && firstAyah.start_ms > 350) {
          const initialSpacerFrames = Math.max(
            15,
            Math.round(((firstAyah.start_ms / 1000) / speed) * config.fps)
          );
          totalFrames += initialSpacerFrames;
          sequence.push({
            surah: firstAyah.surah_number,
            ayah: 0,
            surahNameArabic: firstAyah.surah_name_ar,
            surahNameTransliterated: firstAyah.surah_name_en,
            words: [],
            audioUrl: effectiveAudioUrl,
            durationInFrames: initialSpacerFrames,
            segments: [],
            audioStartMs: 0,
            audioEndMs: firstAyah.start_ms,
            isInterstitial: true,
            interstitialTitle: firstAyah.segment_label || `Surah ${firstAyah.surah_name_en}`,
            interstitialSubtitle: firstAyah.surah_name_ar,
            segmentId: firstAyah.segment_id,
            segmentLabel: firstAyah.segment_label,
          });
        }

        // 4. Build sequence for all Salat Ayahs with Wall-Clock Lockstep
        for (let idx = 0; idx < salatAyahs.length; idx++) {
          const ayah = salatAyahs[idx];
          const nextAyah = salatAyahs[idx + 1];
          const sWords = wordsBySurah[ayah.surah_number]?.[ayah.ayah_number] || [];
          const sPrimary = primaryBySurah[ayah.surah_number]?.[ayah.ayah_number] || '';
          const sSecondary = secondaryBySurah[ayah.surah_number]?.[ayah.ayah_number] || '';
          const scaledSegments = convertAyahToRelativeSegments(ayah, speed);

          // Check if there is an inter-segment transition gap
          const isCrossSegment = nextAyah && nextAyah.segment_id !== ayah.segment_id;
          const gapToNextMs = nextAyah ? nextAyah.start_ms - ayah.end_ms : 0;

          if (isCrossSegment && gapToNextMs > 2500) {
            // A. Recited Ayah
            const ayahDurationFrames = Math.max(
              30,
              Math.round(((ayah.duration_ms / 1000) / speed) * config.fps)
            );
            totalFrames += ayahDurationFrames;
            sequence.push({
              surah: ayah.surah_number,
              ayah: ayah.ayah_number,
              surahNameArabic: ayah.surah_name_ar,
              surahNameTransliterated: ayah.surah_name_en,
              words: sWords,
              primaryTranslation: sPrimary,
              secondaryTranslation: sSecondary,
              audioUrl: effectiveAudioUrl,
              durationInFrames: ayahDurationFrames,
              segments: scaledSegments,
              audioStartMs: ayah.start_ms,
              audioEndMs: ayah.end_ms,
              segmentId: ayah.segment_id,
              segmentLabel: ayah.segment_label,
            });

            // B. Segment transition card during the pause
            const interstitialFrames = Math.max(
              30,
              Math.round(((gapToNextMs / 1000) / speed) * config.fps)
            );
            totalFrames += interstitialFrames;
            sequence.push({
              surah: nextAyah.surah_number,
              ayah: 0,
              surahNameArabic: nextAyah.surah_name_ar,
              surahNameTransliterated: nextAyah.surah_name_en,
              words: [],
              audioUrl: effectiveAudioUrl,
              durationInFrames: interstitialFrames,
              segments: [],
              audioStartMs: ayah.end_ms,
              audioEndMs: nextAyah.start_ms,
              isInterstitial: true,
              interstitialTitle: nextAyah.segment_label || `Surah ${nextAyah.surah_name_en}`,
              interstitialSubtitle: nextAyah.surah_name_ar,
              segmentId: nextAyah.segment_id,
              segmentLabel: nextAyah.segment_label,
            });
          } else {
            // Smooth wall-clock extension until next verse starts
            const displayMs = nextAyah
              ? nextAyah.start_ms - ayah.start_ms
              : ayah.duration_ms;

            const ayahDurationFrames = Math.max(
              30,
              Math.round(((displayMs / 1000) / speed) * config.fps)
            );
            totalFrames += ayahDurationFrames;
            sequence.push({
              surah: ayah.surah_number,
              ayah: ayah.ayah_number,
              surahNameArabic: ayah.surah_name_ar,
              surahNameTransliterated: ayah.surah_name_en,
              words: sWords,
              primaryTranslation: sPrimary,
              secondaryTranslation: sSecondary,
              audioUrl: effectiveAudioUrl,
              durationInFrames: ayahDurationFrames,
              segments: scaledSegments,
              audioStartMs: ayah.start_ms,
              audioEndMs: ayah.end_ms,
              segmentId: ayah.segment_id,
              segmentLabel: ayah.segment_label,
            });
          }
        }

        // 5. Post-recitation trailing silence or prayer completion spacer (e.g. Ruku / outro)
        const lastSalatAyah = salatAyahs[salatAyahs.length - 1];
        if (lastSalatAyah && customTimestamp.total_duration_ms > lastSalatAyah.end_ms) {
          const tailMs = customTimestamp.total_duration_ms - lastSalatAyah.end_ms;
          if (tailMs > 1500) {
            const tailFrames = Math.max(
              15,
              Math.round(((tailMs / 1000) / speed) * config.fps)
            );
            totalFrames += tailFrames;
            sequence.push({
              surah: lastSalatAyah.surah_number,
              ayah: 0,
              surahNameArabic: lastSalatAyah.surah_name_ar,
              surahNameTransliterated: lastSalatAyah.surah_name_en,
              words: [],
              audioUrl: effectiveAudioUrl,
              durationInFrames: tailFrames,
              segments: [],
              audioStartMs: lastSalatAyah.end_ms,
              audioEndMs: customTimestamp.total_duration_ms,
              isInterstitial: true,
              interstitialTitle: "Salat Jama'ah",
              interstitialSubtitle: 'رُكُوعٌ وَسُجُودٌ',
              segmentId: 'tail_ruku_sujood',
              segmentLabel: "Salat Jama'ah (Ruku & Sujood)",
            });
          }
        }

        // 6. Zero-drift alignment with total_duration_ms
        const targetFrames = Math.round(((customTimestamp.total_duration_ms / 1000) / speed) * config.fps);
        const drift = targetFrames - totalFrames;
        if (Math.abs(drift) > 0 && Math.abs(drift) <= 45 && sequence.length > 0) {
          sequence[sequence.length - 1].durationInFrames += drift;
          totalFrames = targetFrames;
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

        set({
          ayahs: sequence,
          totalDurationInFrames: totalFrames + introFrames + titleCardFrames + outroFrames,
          isLoading: false,
          statusMessage: `Loaded Salat Jama'ah: ${salatAyahs.length} ayahs across ${uniqueSurahs.length} surahs`,
        });
        return;
      }

      const surahMeta = getSurahByNumber(config.surahNumber);
      const singleManifest = customTimestamp && !isSalatJammatManifest(customTimestamp)
        ? (customTimestamp as WhisperTimestampManifest)
        : null;
      const isCustomTimingActive = Boolean(
        singleManifest && singleManifest.surah_number === config.surahNumber
      );

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

          let bDurationInSeconds = (bismillahAudio.durationInSeconds || 5) / speed;
          let scaledBismillahSegments: WordSegment[] = (bismillahAudio.segments || [])
            .filter((seg: WordSegment) => seg.wordIndex <= 4)
            .map((seg: WordSegment) => ({
              wordIndex: seg.wordIndex,
              startMs: Math.round(seg.startMs / speed),
              endMs: Math.round(seg.endMs / speed),
            }));
          let bStartMs: number | undefined;
          let bEndMs: number | undefined;

          if (isCustomTimingActive && singleManifest?.preamble?.has_basmala && singleManifest.preamble.basmala) {
            const basmala = singleManifest.preamble.basmala;
            bDurationInSeconds = (basmala.duration_ms / 1000) / speed;
            scaledBismillahSegments = convertBasmalaToRelativeSegments(basmala, speed);
            bStartMs = basmala.start_ms;
            bEndMs = basmala.end_ms;
          }

          const bDurationInFrames = Math.max(
            30,
            Math.round(bDurationInSeconds * config.fps)
          );

          totalFrames += bDurationInFrames;

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
            audioUrl: (config.useRecitationVideoAudio && config.recitationVideoPath) || config.customAudioPath || bismillahAudio.audioUrl,
            durationInFrames: bDurationInFrames,
            segments: scaledBismillahSegments,
            audioStartMs: bStartMs,
            audioEndMs: bEndMs,
          });
        } catch (bErr) {
          console.warn('Failed to prepend Bismillah:', bErr);
        }
      }

      for (let a = config.fromAyah; a <= config.toAyah; a++) {
        const words = wordsMap[a] || [];
        const customAyahTiming = isCustomTimingActive
          ? singleManifest?.ayahs.find((item) => item.ayah_number === a)
          : undefined;

        let durationInSeconds: number;
        let scaledSegments: WordSegment[];
        let audioStartMs: number | undefined;
        let audioEndMs: number | undefined;

        if (customAyahTiming) {
          const rawDurationMs = customAyahTiming.duration_ms || (customAyahTiming.end_ms - customAyahTiming.start_ms);
          durationInSeconds = (rawDurationMs / 1000) / speed;
          scaledSegments = convertAyahToRelativeSegments(customAyahTiming, speed);
          audioStartMs = customAyahTiming.start_ms;
          audioEndMs = customAyahTiming.end_ms;
        } else {
          const audioData = audioMap[a] || {
            audioUrl: '',
            durationInSeconds: 5,
            segments: [],
          };
          durationInSeconds = (audioData.durationInSeconds || 5) / speed;
          scaledSegments = (audioData.segments || []).map((seg: WordSegment) => ({
            wordIndex: seg.wordIndex,
            startMs: Math.round(seg.startMs / speed),
            endMs: Math.round(seg.endMs / speed),
          }));
        }

        const durationInFrames = Math.max(
          30,
          Math.round(durationInSeconds * config.fps)
        );

        totalFrames += durationInFrames;

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
          audioUrl: (config.useRecitationVideoAudio && config.recitationVideoPath) || config.customAudioPath || audioMap[a]?.audioUrl || '',
          durationInFrames,
          segments: scaledSegments,
          audioStartMs,
          audioEndMs,
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

      let savedThumbnailSettings: Partial<ThumbnailConfig> = {};
      if (api.loadThumbnailSettings) {
        try {
          savedThumbnailSettings = await api.loadThumbnailSettings();
        } catch (err) {
          console.error('Failed to load saved thumbnail settings:', err);
        }
      }

      if (savedSettings.channelHandle === '@AnNafee_Official') {
        savedSettings.channelHandle = '';
      }
      if (!savedSettings.logoPath && (!savedSettings.channelHandle || savedSettings.channelHandle === '')) {
        savedSettings.showBranding = false;
      }

      // Verify files still exist on disk if specified
      if (savedSettings.customAudioPath && api.fileExists) {
        const exists = await api.fileExists(savedSettings.customAudioPath);
        if (!exists) {
          console.warn(`Saved custom audio file not found: ${savedSettings.customAudioPath}`);
          savedSettings.customAudioPath = undefined;
          savedSettings.recitationAudioMode = 'cdn-per-ayah';
          savedSettings.customAudioDurationSeconds = undefined;
          savedSettings.customAudioFileName = undefined;
        }
      }

      if (savedSettings.recitationVideoPath && api.fileExists) {
        const exists = await api.fileExists(savedSettings.recitationVideoPath);
        if (!exists) {
          console.warn(`Saved recitation video file not found: ${savedSettings.recitationVideoPath}`);
          savedSettings.recitationVideoPath = undefined;
          savedSettings.useRecitationVideoAsBackground = false;
          savedSettings.useRecitationVideoAudio = false;
          savedSettings.recitationVideoDurationSeconds = undefined;
          savedSettings.recitationVideoFileName = undefined;
        }
      }

      if (savedSettings.logoPath && api.fileExists) {
        const exists = await api.fileExists(savedSettings.logoPath);
        if (!exists) {
          savedSettings.logoPath = undefined;
        }
      }

      if (savedSettings.introVideoPath && api.fileExists) {
        const exists = await api.fileExists(savedSettings.introVideoPath);
        if (!exists) {
          savedSettings.introVideoPath = undefined;
        }
      }

      if (savedSettings.outroVideoPath && api.fileExists) {
        const exists = await api.fileExists(savedSettings.outroVideoPath);
        if (!exists) {
          savedSettings.outroVideoPath = undefined;
        }
      }

      const initialConfig: VideoTemplateConfig = {
        ...DEFAULT_TEMPLATE_CONFIG,
        ...savedSettings,
      };

      // Validate surah and ayah bounds
      if (!initialConfig.surahNumber || initialConfig.surahNumber < 1 || initialConfig.surahNumber > 114) {
        initialConfig.surahNumber = 1;
      }
      const surahMeta = getSurahByNumber(initialConfig.surahNumber);
      if (surahMeta) {
        initialConfig.fromAyah = Math.max(1, Math.min(initialConfig.fromAyah || 1, surahMeta.totalAyahs));
        initialConfig.toAyah = Math.max(
          initialConfig.fromAyah,
          Math.min(initialConfig.toAyah || surahMeta.totalAyahs, surahMeta.totalAyahs)
        );
      }

      // 2. Restore custom timestamp manifest if present
      let restoredManifest: UnifiedTimestampManifest | null = null;
      let restoredTimestampPath: string | null = null;

      // Check if file exists on disk and read fresh content
      if (initialConfig.customTimestampPath && api.fileExists && api.readFileText) {
        try {
          const exists = await api.fileExists(initialConfig.customTimestampPath);
          if (exists) {
            const fileContent = await api.readFileText(initialConfig.customTimestampPath);
            if (fileContent) {
              const parsed = validateAndParseTimestampJson(fileContent);
              if (parsed.success && parsed.data) {
                restoredManifest = parsed.data;
                restoredTimestampPath = initialConfig.customTimestampPath;
              }
            }
          }
        } catch (e) {
          console.warn('Failed to read saved custom timestamp file:', e);
        }
      }

      // Fallback to SQLite cached timestamp content if file was moved or path was not on disk
      if (!restoredManifest && api.getSavedCustomTimestamp) {
        try {
          const cachedJson = await api.getSavedCustomTimestamp();
          if (cachedJson) {
            const parsed = validateAndParseTimestampJson(cachedJson);
            if (parsed.success && parsed.data) {
              restoredManifest = parsed.data;
              restoredTimestampPath = initialConfig.customTimestampPath || 'custom_timestamps.json';
            }
          }
        } catch (e) {
          console.warn('Failed to restore cached custom timestamp JSON:', e);
        }
      }

      if (restoredManifest) {
        if (isSalatJammatManifest(restoredManifest)) {
          initialConfig.recitationMode = 'salat-jammat';
          initialConfig.salatSegments = restoredManifest.segments;
          initialConfig.hasCustomTimestamp = true;
          initialConfig.customTimestampPath = restoredTimestampPath || initialConfig.customTimestampPath;
          if (restoredManifest.filename) {
            initialConfig.customAudioFileName = initialConfig.customAudioFileName || restoredManifest.filename;
            initialConfig.recitationVideoFileName = initialConfig.recitationVideoFileName || restoredManifest.filename;
          }
        } else {
          initialConfig.recitationMode = 'single-surah';
          initialConfig.salatSegments = undefined;
          initialConfig.hasCustomTimestamp = true;
          initialConfig.customTimestampPath = restoredTimestampPath || initialConfig.customTimestampPath;
        }
      }

      // 3. Load available languages and reciters
      const languages = await api.getAvailableLanguages();
      const reciters = await api.getReciters();

      // Ensure valid reciterIndex
      if (
        typeof initialConfig.reciterIndex !== 'number' ||
        initialConfig.reciterIndex < 0 ||
        initialConfig.reciterIndex >= reciters.length
      ) {
        initialConfig.reciterIndex = 0;
      }

      // 4. Load translators for configured primary & secondary languages
      const primaryTranslators = await api.getTranslatorsForLanguage(initialConfig.primaryTranslationLang);
      const secondaryTranslators = await api.getTranslatorsForLanguage(initialConfig.secondaryTranslationLang);

      // Verify that selected translation files are available
      if (primaryTranslators.length > 0 && !primaryTranslators.includes(initialConfig.primaryTranslationFile)) {
        initialConfig.primaryTranslationFile = primaryTranslators[0];
      }
      if (secondaryTranslators.length > 0 && !secondaryTranslators.includes(initialConfig.secondaryTranslationFile)) {
        initialConfig.secondaryTranslationFile = secondaryTranslators[0];
      }

      const initialThumbnailConfig: ThumbnailConfig = {
        ...DEFAULT_THUMBNAIL_CONFIG,
        ...savedThumbnailSettings,
      };

      set({
        config: initialConfig,
        thumbnailConfig: initialThumbnailConfig,
        customTimestamp: restoredManifest,
        customTimestampPath: restoredTimestampPath,
        customTimestampError: null,
        availableLanguages: languages,
        reciters,
        translatorsPrimary: primaryTranslators,
        translatorsSecondary: secondaryTranslators,
      });

      // 5. Load initial sequence
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
    if (autoSaveThumbnailTimer) {
      clearTimeout(autoSaveThumbnailTimer);
      autoSaveThumbnailTimer = null;
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
        thumbnailConfig: { ...DEFAULT_THUMBNAIL_CONFIG },
        customTimestamp: null,
        customTimestampPath: null,
        customTimestampError: null,
        translatorsPrimary: primaryTranslators,
        translatorsSecondary: secondaryTranslators,
        isLoading: false,
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
let autoSaveThumbnailTimer: ReturnType<typeof setTimeout> | null = null;
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

export const triggerAutoSaveThumbnail = (thumbnailConfig: ThumbnailConfig) => {
  if (isHydratingOrResetting) return;
  if (autoSaveThumbnailTimer) clearTimeout(autoSaveThumbnailTimer);
  autoSaveThumbnailTimer = setTimeout(async () => {
    try {
      if (window.electronAPI?.saveThumbnailSettings) {
        await window.electronAPI.saveThumbnailSettings(thumbnailConfig);
      }
    } catch (err) {
      console.error('Failed to auto-save thumbnail settings:', err);
    }
  }, 500);
};

useStudioStore.subscribe((state, prevState) => {
  if (state.config !== prevState.config) {
    triggerAutoSave(state.config);
  }
  if (state.thumbnailConfig !== prevState.thumbnailConfig) {
    triggerAutoSaveThumbnail(state.thumbnailConfig);
  }
});
