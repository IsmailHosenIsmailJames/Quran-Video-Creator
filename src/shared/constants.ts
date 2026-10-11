import { VideoTemplateConfig } from './types';

export const FONT_OPTIONS = [
  { id: 'KFGQPC Uthmanic Script HAFS', name: 'KFGQPC Uthmanic Script HAFS (Medina)', script: 'qpc-nastaleeq' },
  { id: 'KFGQPC HAFS Uthmanic Script', name: 'KFGQPC HAFS Uthmanic (Modern Hafs)', script: 'qpc-nastaleeq' },
  { id: 'me_quran', name: 'me_quran (Medina Mushaf Volt)', script: 'qpc-nastaleeq' },
  { id: 'AlQuran Neo v5x1', name: 'AlQuran Neo v5x1 (Digital Medina)', script: 'qpc-nastaleeq' },
  { id: 'AlQuran IndoPak by QuranWBW', name: 'IndoPak Nastaleeq (South Asian QuranWBW)', script: 'indopak-nastaleeq' },
  { id: 'Al Qalam Quran Majeed Web', name: 'Al Qalam Quran Majeed Web', script: 'indopak-nastaleeq' },
  { id: 'noorehira', name: 'Noorehira Regular (Nastaleeq)', script: 'indopak-nastaleeq' },
  { id: 'noorehuda', name: 'Noorehuda Regular (Nastaleeq)', script: 'indopak-nastaleeq' },
  { id: 'Amiri', name: 'Amiri (Classical Naskh)', script: 'imlaei' },
  { id: 'Lateef', name: 'Lateef Regular', script: 'imlaei' },
];

export const SCRIPT_FONT_MAP = {
  'qpc-nastaleeq': 'KFGQPC Uthmanic Script HAFS',
  'indopak-nastaleeq': 'AlQuran IndoPak by QuranWBW',
  'imlaei': 'Amiri',
};

export const SCRIPT_LINE_HEIGHT_MAP = {
  'qpc-nastaleeq': 2.3,
  'indopak-nastaleeq': 2.7,
  'imlaei': 2.3,
};

// Built-in cinematic presets for backgrounds
export const BACKGROUND_PRESETS = [
  {
    id: 'clouds-night',
    name: 'Moody Clouds & Stars',
    type: 'preset' as const,
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920&auto=format&fit=crop',
  },
  {
    id: 'calm-mountains',
    name: 'Misty Mountains',
    type: 'preset' as const,
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop',
  },
  {
    id: 'golden-desert',
    name: 'Dusk Desert Dunes',
    type: 'preset' as const,
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1920&auto=format&fit=crop',
  },
  {
    id: 'deep-ocean',
    name: 'Nocturnal Ocean Waves',
    type: 'preset' as const,
    url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=1920&auto=format&fit=crop',
  },
  {
    id: 'forest-fog',
    name: 'Sacred Forest Fog',
    type: 'preset' as const,
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1920&auto=format&fit=crop',
  },
];

export const DEFAULT_TEMPLATE_CONFIG: VideoTemplateConfig = {
  surahNumber: 1,
  fromAyah: 1,
  toAyah: 7,
  includeBismillah: true,

  // Scripture Typography
  script: 'qpc-nastaleeq',
  selectedQuranFont: 'KFGQPC Uthmanic Script HAFS',
  arabicFontSize: 56,
  arabicLineHeight: 2.3,
  arabicTextColor: '#FFFFFF',
  arabicActiveColor: '#FBBF24', // Amber/gold
  arabicActiveGlow: true,

  // Per-Ayah Custom Font Size Overrides
  ayahFontOverrides: {},

  // Subtitles
  showPrimaryTranslation: true,
  primaryTranslationLang: 'Bengali',
  primaryTranslationFile: 'Taisirul_Quran.json.txt',
  primaryFontSize: 26,
  primaryTextColor: '#E5E7EB',

  showSecondaryTranslation: true,
  secondaryTranslationLang: 'English',
  secondaryTranslationFile: 'Saheeh_International.json.txt',
  secondaryFontSize: 21,
  secondaryTextColor: '#9CA3AF',

  // Layout, Reordering, Alignment & Container
  scriptLayoutOrder: ['arabic', 'secondary', 'primary'],
  showTranslationContainer: true,
  textAlignment: 'center',
  verticalAlignment: 'middle',
  verticalCustomOffset: 0,
  showSurahHeader: true,

  // Scripture & Subtitle In/Out Motion Animations
  animationIn: 'float-up',
  animationOut: 'fade',
  animationDurationFrames: 18,
  staggerSubtitles: true,

  // Layout & Background
  aspectRatio: '16:9',
  backgroundType: 'preset',
  backgroundPath: BACKGROUND_PRESETS[0].url,
  backgroundClips: [
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
  ],
  defaultTransition: 'zoom-fade',
  overlayOpacity: 0.45,
  vignetteIntensity: 0.85,
  kenBurnsEffect: true,

  // Audio & Waveform
  reciterIndex: 0, // Mishary Rashid Alafasy
  recitationSpeed: 1.0,
  showWaveform: true,
  waveformType: 'smooth-wave',
  waveformColor: '#F59E0B',
  waveformHeight: 120,
  waveformWidth: 92,
  waveformAmplitude: 2.2,
  waveformPositionY: 74, // Lower-third

  // Branding
  showBranding: true,
  channelHandle: '@AnNafee_Official',
  brandingPosition: 'top-right',
  brandingScale: 1.0,

  // Video Output
  fps: 30,
  resolution: '1080p',
};

export const TEXT_ANIMATION_IN_OPTIONS = [
  { id: 'float-up' as const, name: 'Soft Float Up', description: 'Fade in with a gentle upward rise' },
  { id: 'fade' as const, name: 'Pure Fade', description: 'Peaceful zero-motion cross-dissolve' },
  { id: 'blur-fade' as const, name: 'Defocus Blur', description: 'Cinematic blur transition into focus' },
  { id: 'scale-up' as const, name: 'Subtle Zoom In', description: 'Gentle depth scale from 92% to 100%' },
  { id: 'none' as const, name: 'Instant Cut', description: 'Instant appearance with zero delay' },
];

export const TEXT_ANIMATION_OUT_OPTIONS = [
  { id: 'fade' as const, name: 'Pure Fade', description: 'Gentle peaceful dissolve into transparency' },
  { id: 'float-up' as const, name: 'Float Up & Fade', description: 'Continues floating upward while fading out' },
  { id: 'float-down' as const, name: 'Float Down & Fade', description: 'Softly sinks downward while fading out' },
  { id: 'blur-fade' as const, name: 'Defocus Blur', description: 'Cinematic blur into transparency' },
  { id: 'scale-down' as const, name: 'Subtle Zoom Out', description: 'Gentle scale down while fading out' },
  { id: 'none' as const, name: 'Instant Cut', description: 'Instant disappearance with zero delay' },
];
