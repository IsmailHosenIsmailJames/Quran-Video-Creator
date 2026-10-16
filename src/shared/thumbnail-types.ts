import { VideoTemplateConfig, ReciterInfo } from './types';

export type ThumbnailLayoutMode =
  | 'split-screen'        // #1 Top-converting YouTube format: Left calligraphy medallion, right bold stacked text
  | 'centerpiece'         // Symmetrical grand royal layout: Central floating medallion + monumental title
  | 'cinematic-hero'      // Cinematic widescreen with deep vignette & refined luxury editorial typography
  | 'high-impact-focus';  // High-contrast punchy typography engineered for small mobile feed clicks

export type ThumbnailPresetId =
  | 'liquid-gold'
  | 'emerald-sanctuary'
  | 'midnight-sapphire'
  | 'royal-amethyst'
  | 'dusk-ember'
  | 'minimalist-luxury'
  | 'celestial-dawn'
  | 'high-ctr-viral'
  // Backwards compatibility aliases
  | 'grand-gold-calligraphy'
  | 'emerald-medina'
  | 'cinematic-night'
  | 'sunset-serenity'
  | 'royal-velvet'
  | 'minimal-focus'
  | 'dramatic-clouds'
  | 'sacred-arch';

export type ThumbnailBadgeId =
  | 'none'
  | 'must-listen'
  | 'heart-soothing'
  | 'full-surah'
  | 'emotional'
  | 'peaceful-sleep'
  | 'protection'
  | 'use-headphones'
  | '4k-uhd'
  | 'surah-virtue';

export interface ThumbnailPresetOption {
  id: ThumbnailPresetId;
  name: string;
  subtitle: string;
  description: string;
  layoutMode: ThumbnailLayoutMode;
  accentColor: string;
  secondaryColor: string;
  badgeText: string;
  badgeDotColor?: string;
  hookTitle: string;
  hookSubtitle: string;
  bgPresetUrl: string;
  bgOverlayOpacity: number;
  bgOverlayColor: string;
  showArchFrame: boolean;
  showArabesqueCorners: boolean;
  showSunRays: boolean;
  showGoldenSparks: boolean;
  goldGradientText: boolean;
}

export interface ThumbnailConfig {
  preset: ThumbnailPresetId;
  layoutMode: ThumbnailLayoutMode;
  aspectRatio: '16:9' | '9:16' | '1:1';
  width: number;
  height: number;

  // Background
  bgType: 'preset' | 'custom' | 'captured-frame' | 'gradient';
  bgPresetUrl: string;
  bgCustomUrl?: string;
  bgCapturedDataUrl?: string;
  bgGradientFrom: string;
  bgGradientTo: string;
  bgGradientAngle: number;
  bgOverlayOpacity: number; // 0.0 to 0.95
  bgOverlayColor: string;
  bgBlur: number;          // 0 to 20 px
  bgVignette: boolean;

  // Scripture & Calligraphy Centerpiece
  showSurahCalligraphy: boolean;
  surahCalligraphyScale: number; // 0.6 to 1.8 (default 1.0)
  surahCalligraphyColor: string;
  surahCalligraphyGlow: boolean;
  calligraphyMedallion: boolean; // Elegant circular frosted/gold medallion frame

  showArabicSurahName: boolean;
  arabicSurahNameSize: number;
  arabicSurahNameColor: string;

  showEnglishSurahName: boolean;
  englishSurahNameText?: string;
  englishSurahNameSize: number;
  englishSurahNameColor: string;
  goldGradientText: boolean;

  showEnglishMeaning: boolean;
  englishMeaningText?: string;

  // Ayah Range Badge
  showAyahRangeBadge: boolean;
  ayahRangeBadgeText?: string;

  // High-Impact Hook / Title Banner (Crucial for YouTube CTR)
  showHookTitle: boolean;
  hookTitleText: string;
  hookTitleSubtitle?: string;
  hookTitleFontSize: number;
  hookTitleColor: string;
  hookTitleBgStyle: 'none' | 'gradient-pill' | 'solid-banner' | 'glass-card' | 'glow-outline' | 'minimal-line';
  hookTitleBgColor: string;
  hookTitleStroke: boolean;
  hookTitleStrokeColor: string;
  hookTitleStrokeWidth: number;
  hookTitleGlow: boolean;

  // Reciter & Attribution Badges
  showReciterBadge: boolean;
  reciterNameText?: string;
  showReciterStyle: boolean;
  reciterStyleText?: string;
  showTranslationBadge: boolean;
  translationBadgeText?: string;

  // Clickable Eye-Catching Badges / Ribbons
  activeBadge: ThumbnailBadgeId;
  badgeCustomText?: string;
  badgePosition: 'top-left' | 'top-right' | 'bottom-left' | 'inline-header';

  // Islamic Decorative Overlays
  showIslamicArchFrame: boolean;
  showArabesqueCorners: boolean;
  showGoldenSparks: boolean;
  showSunRays: boolean;
  accentThemeColor: string;

  // Safe Zone Guide & Helpers (Rendered as UI overlay, never baked into export)
  showYouTubeSafeZone: boolean;
  showRuleOfThirds: boolean;
}

export const THUMBNAIL_PRESET_OPTIONS: ThumbnailPresetOption[] = [
  {
    id: 'liquid-gold',
    name: 'Liquid Gold & Obsidian',
    subtitle: 'The 2026 Gold Standard',
    description: 'Ultra-luxurious 24K liquid gold calligraphy medallion, obsidian starry cosmos, volumetric god-rays, and sleek frosted glass status chip.',
    layoutMode: 'split-screen',
    accentColor: '#F59E0B',
    secondaryColor: '#FDE68A',
    badgeText: '● FULL SURAH • 4K UHD',
    badgeDotColor: '#F59E0B',
    hookTitle: 'HEART SOOTHING RECITATION',
    hookSubtitle: 'Listen With Pure Focus & Presence',
    bgPresetUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.5,
    bgOverlayColor: '#03050a',
    showArchFrame: false,
    showArabesqueCorners: true,
    showSunRays: true,
    showGoldenSparks: true,
    goldGradientText: true,
  },
  {
    id: 'emerald-sanctuary',
    name: 'Emerald Medina Sanctuary',
    subtitle: 'Peaceful & Spiritual',
    description: 'Deep Islamic emerald night backdrop with mint-leaf luminescence, delicate gold arabesque corners, and heart-calming reflection typography.',
    layoutMode: 'split-screen',
    accentColor: '#10B981',
    secondaryColor: '#6EE7B7',
    badgeText: '● PEACE OF THE SOUL',
    badgeDotColor: '#10B981',
    hookTitle: 'CURE FOR ANXIETY & WORRY',
    hookSubtitle: 'Calm Your Heart & Find Inner Peace',
    bgPresetUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.55,
    bgOverlayColor: '#02160e',
    showArchFrame: false,
    showArabesqueCorners: true,
    showSunRays: false,
    showGoldenSparks: true,
    goldGradientText: true,
  },
  {
    id: 'midnight-sapphire',
    name: 'Midnight Sapphire Cosmos',
    subtitle: 'Nocturnal Serenity',
    description: 'Dramatic nocturnal deep sapphire bokeh, cool moonlight volumetric back-glow, and high-contrast diamond-white typography.',
    layoutMode: 'centerpiece',
    accentColor: '#38BDF8',
    secondaryColor: '#BAE6FD',
    badgeText: '🌙 NIGHT RECITATION',
    badgeDotColor: '#38BDF8',
    hookTitle: 'LISTEN BEFORE SLEEPING',
    hookSubtitle: 'Protection, Peace & Deep Rest',
    bgPresetUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.58,
    bgOverlayColor: '#040b18',
    showArchFrame: true,
    showArabesqueCorners: true,
    showSunRays: true,
    showGoldenSparks: true,
    goldGradientText: false,
  },
  {
    id: 'royal-amethyst',
    name: 'Royal Velvet & Gold',
    subtitle: 'Majestic & Emotional',
    description: 'Regal deep twilight plum & amethyst background with warm champagne gold calligraphy and celestial star-dust accents.',
    layoutMode: 'centerpiece',
    accentColor: '#C084FC',
    secondaryColor: '#FDE047',
    badgeText: '💎 EMOTIONAL RECITATION',
    badgeDotColor: '#C084FC',
    hookTitle: 'A VOICE THAT TOUCHES HEARTS',
    hookSubtitle: 'Tearful & Sincere Quranic Recitation',
    bgPresetUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.52,
    bgOverlayColor: '#0d051a',
    showArchFrame: true,
    showArabesqueCorners: true,
    showSunRays: false,
    showGoldenSparks: true,
    goldGradientText: true,
  },
  {
    id: 'dusk-ember',
    name: 'Dusk Minarets & Sunset',
    subtitle: 'Warm Cinematic Sunset',
    description: 'Golden-hour warm desert sunset glow, soothing amber hues, radiant halo, and heart-touching reflection hook.',
    layoutMode: 'cinematic-hero',
    accentColor: '#FB923C',
    secondaryColor: '#FDE68A',
    badgeText: '🤲 DUAA & REFLECTION',
    badgeDotColor: '#FB923C',
    hookTitle: 'PROTECTION FROM ALL EVIL',
    hookSubtitle: 'Recite In Morning & Evening',
    bgPresetUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.46,
    bgOverlayColor: '#160803',
    showArchFrame: false,
    showArabesqueCorners: true,
    showSunRays: true,
    showGoldenSparks: true,
    goldGradientText: true,
  },
  {
    id: 'minimalist-luxury',
    name: 'Minimalist Obsidian Luxury',
    subtitle: 'Prestigious & Modern',
    description: 'Pure dark carbon background, sleek fine-line gold trim, pristine editorial typography, and generous cinematic whitespace.',
    layoutMode: 'cinematic-hero',
    accentColor: '#E2E8F0',
    secondaryColor: '#F59E0B',
    badgeText: '🎧 IMMERSIVE 3D AUDIO',
    badgeDotColor: '#F59E0B',
    hookTitle: 'FEEL THE NOBLE MAJESTY',
    hookSubtitle: 'High Fidelity Quranic Audio',
    bgPresetUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.72,
    bgOverlayColor: '#030408',
    showArchFrame: false,
    showArabesqueCorners: false,
    showSunRays: false,
    showGoldenSparks: false,
    goldGradientText: false,
  },
  {
    id: 'celestial-dawn',
    name: 'Celestial Dawn God-Rays',
    subtitle: 'Epic Volumetric Light',
    description: 'Dramatic volumetric god-rays piercing heavy cinematic dawn clouds with radiant golden illuminated calligraphy.',
    layoutMode: 'high-impact-focus',
    accentColor: '#FBBF24',
    secondaryColor: '#FFFFFF',
    badgeText: '⭐ SURAH YOU MUST KNOW',
    badgeDotColor: '#F59E0B',
    hookTitle: 'POWERFUL RECITATION',
    hookSubtitle: 'Clear Audio & High Definition',
    bgPresetUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.48,
    bgOverlayColor: '#02040a',
    showArchFrame: false,
    showArabesqueCorners: true,
    showSunRays: true,
    showGoldenSparks: true,
    goldGradientText: true,
  },
  {
    id: 'high-ctr-viral',
    name: 'Mobile High-CTR Power',
    subtitle: 'Engineered For YouTube Clicks',
    description: 'Optimized specifically for mobile feed CTR with giant stacked bold typography, vibrant emerald-amber accents, and high-impact framing.',
    layoutMode: 'split-screen',
    accentColor: '#F59E0B',
    secondaryColor: '#FBBF24',
    badgeText: '🔥 BEFORE SLEEPING',
    badgeDotColor: '#EF4444',
    hookTitle: 'PROTECTION FROM GRAVE',
    hookSubtitle: 'Recite Tonight Before Sleep',
    bgPresetUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.62,
    bgOverlayColor: '#000000',
    showArchFrame: false,
    showArabesqueCorners: true,
    showSunRays: false,
    showGoldenSparks: true,
    goldGradientText: true,
  },
  // Backwards-compatible entries so existing projects load seamlessly
  {
    id: 'grand-gold-calligraphy',
    name: 'Grand Golden Calligraphy',
    subtitle: 'Royal Classic',
    description: 'Opulent royal gold calligraphy with dark backdrop and luminous amber accents.',
    layoutMode: 'split-screen',
    accentColor: '#F59E0B',
    secondaryColor: '#FBBF24',
    badgeText: '● FULL SURAH • 4K',
    badgeDotColor: '#F59E0B',
    hookTitle: 'HEART SOOTHING RECITATION',
    hookSubtitle: 'Listen With Presence of Heart',
    bgPresetUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.5,
    bgOverlayColor: '#000000',
    showArchFrame: false,
    showArabesqueCorners: true,
    showSunRays: true,
    showGoldenSparks: true,
    goldGradientText: true,
  },
  {
    id: 'emerald-medina',
    name: 'Emerald Medina Arch',
    subtitle: 'Classic Green',
    description: 'Deep Islamic emerald green with intricate arabesque accents.',
    layoutMode: 'split-screen',
    accentColor: '#10B981',
    secondaryColor: '#34D399',
    badgeText: '● PEACE OF SOUL',
    badgeDotColor: '#10B981',
    hookTitle: 'BEAUTIFUL & PEACEFUL',
    hookSubtitle: 'Calm Your Heart & Mind',
    bgPresetUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.52,
    bgOverlayColor: '#021a14',
    showArchFrame: false,
    showArabesqueCorners: true,
    showSunRays: false,
    showGoldenSparks: true,
    goldGradientText: true,
  },
  {
    id: 'cinematic-night',
    name: 'Cinematic Dark Bokeh',
    subtitle: 'Midnight Blue',
    description: 'Ultra-dark moody midnight atmosphere and celestial bokeh.',
    layoutMode: 'centerpiece',
    accentColor: '#38BDF8',
    secondaryColor: '#0284C7',
    badgeText: '🌙 NIGHT RECITATION',
    badgeDotColor: '#38BDF8',
    hookTitle: 'LISTEN BEFORE SLEEPING',
    hookSubtitle: 'Sleep In Peace & Protection',
    bgPresetUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.58,
    bgOverlayColor: '#040914',
    showArchFrame: true,
    showArabesqueCorners: true,
    showSunRays: true,
    showGoldenSparks: true,
    goldGradientText: false,
  },
  {
    id: 'sunset-serenity',
    name: 'Warm Sunset & Minarets',
    subtitle: 'Desert Glow',
    description: 'Warm golden-hour desert sunset, soothing amber hues.',
    layoutMode: 'cinematic-hero',
    accentColor: '#FB923C',
    secondaryColor: '#F59E0B',
    badgeText: '🤲 DUAA & REFLECTION',
    badgeDotColor: '#FB923C',
    hookTitle: 'PROTECTION FROM EVIL',
    hookSubtitle: 'Recite Every Morning & Evening',
    bgPresetUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.46,
    bgOverlayColor: '#120702',
    showArchFrame: false,
    showArabesqueCorners: true,
    showSunRays: true,
    showGoldenSparks: true,
    goldGradientText: true,
  },
  {
    id: 'royal-velvet',
    name: 'Royal Velvet & Gold',
    subtitle: 'Purple Luxury',
    description: 'Regal deep indigo-purple and gold trim.',
    layoutMode: 'centerpiece',
    accentColor: '#C084FC',
    secondaryColor: '#F59E0B',
    badgeText: '💎 FULL SURAH',
    badgeDotColor: '#C084FC',
    hookTitle: 'EMOTIONAL RECITATION',
    hookSubtitle: 'A Recitation That Brings Tears',
    bgPresetUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.52,
    bgOverlayColor: '#0c051a',
    showArchFrame: true,
    showArabesqueCorners: true,
    showSunRays: false,
    showGoldenSparks: true,
    goldGradientText: true,
  },
  {
    id: 'minimal-focus',
    name: 'Modern High CTR Focus',
    subtitle: 'Viral Contrast',
    description: 'Split layout optimized for maximum mobile click-through rate.',
    layoutMode: 'split-screen',
    accentColor: '#F59E0B',
    secondaryColor: '#FBBF24',
    badgeText: '🔥 HIGH CTR VIRAL',
    badgeDotColor: '#EF4444',
    hookTitle: 'SURAH YOU MUST KNOW',
    hookSubtitle: 'Powerful Virtues & Meanings',
    bgPresetUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.65,
    bgOverlayColor: '#000000',
    showArchFrame: false,
    showArabesqueCorners: true,
    showSunRays: false,
    showGoldenSparks: false,
    goldGradientText: true,
  },
  {
    id: 'dramatic-clouds',
    name: 'Epic Storm & God-Rays',
    subtitle: 'Atmospheric Rays',
    description: 'Dramatic volumetric god-rays piercing heavy cinematic clouds.',
    layoutMode: 'high-impact-focus',
    accentColor: '#FBBF24',
    secondaryColor: '#FFFFFF',
    badgeText: '⭐ 4K ULTRA HD',
    badgeDotColor: '#FBBF24',
    hookTitle: 'POWERFUL RECITATION',
    hookSubtitle: 'Clear Audio & High Definition',
    bgPresetUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.48,
    bgOverlayColor: '#000000',
    showArchFrame: false,
    showArabesqueCorners: true,
    showSunRays: true,
    showGoldenSparks: true,
    goldGradientText: true,
  },
  {
    id: 'sacred-arch',
    name: 'Andalusian Moorish Arch',
    subtitle: 'Sacred Heritage',
    description: 'Classic Moorish horseshoe arch enclosing the scripture.',
    layoutMode: 'centerpiece',
    accentColor: '#D97706',
    secondaryColor: '#F59E0B',
    badgeText: '🎧 USE HEADPHONES',
    badgeDotColor: '#D97706',
    hookTitle: 'IMMERSIVE 3D AUDIO',
    hookSubtitle: 'Experience the Sacred Words',
    bgPresetUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.55,
    bgOverlayColor: '#080502',
    showArchFrame: true,
    showArabesqueCorners: true,
    showSunRays: false,
    showGoldenSparks: true,
    goldGradientText: true,
  },
];

export const THUMBNAIL_HOOK_SUGGESTIONS = [
  'HEART SOOTHING RECITATION',
  'PROTECTION FROM ALL EVIL',
  'LISTEN BEFORE SLEEPING',
  'TEARFUL EMOTIONAL RECITATION',
  'CURE FOR ANXIETY & WORRY',
  'SURAH AL-KAHF — FRIDAY BLESSING',
  'PEACE OF THE SOUL & MIND',
  'RECITATION THAT TOUCHES HEARTS',
  'FEEL THE MAJESTY OF QURAN',
  'PROTECTION FROM THE GRAVE',
  'SURAH YASIN — HEART OF QURAN',
  'RECITATION FOR ANGER & GRIEF',
  'SURAH AL-WAQI\'AH — WEALTH & SUSTENANCE',
];

export const THUMBNAIL_BADGE_PRESETS: { id: ThumbnailBadgeId; label: string; dot: string }[] = [
  { id: 'none', label: 'None (Hidden)', dot: 'transparent' },
  { id: '4k-uhd', label: '● FULL SURAH • 4K UHD', dot: '#F59E0B' },
  { id: 'heart-soothing', label: '● HEART SOOTHING', dot: '#10B981' },
  { id: 'peaceful-sleep', label: '● PEACEFUL SLEEP', dot: '#38BDF8' },
  { id: 'must-listen', label: '● MUST LISTEN', dot: '#EF4444' },
  { id: 'full-surah', label: '● NOBLE QURAN', dot: '#A855F7' },
  { id: 'protection', label: '● DIVINE PROTECTION', dot: '#10B981' },
  { id: 'use-headphones', label: '● 3D IMMERSIVE AUDIO', dot: '#6366F1' },
  { id: 'emotional', label: '● EMOTIONAL TEARFUL', dot: '#EC4899' },
  { id: 'surah-virtue', label: '● GREAT VIRTUES', dot: '#F59E0B' },
];

export const DEFAULT_THUMBNAIL_CONFIG: ThumbnailConfig = {
  preset: 'liquid-gold',
  layoutMode: 'split-screen',
  aspectRatio: '16:9',
  width: 1280,
  height: 720,

  // Background
  bgType: 'preset',
  bgPresetUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920&auto=format&fit=crop',
  bgCustomUrl: undefined,
  bgCapturedDataUrl: undefined,
  bgGradientFrom: '#03050a',
  bgGradientTo: '#0b1329',
  bgGradientAngle: 135,
  bgOverlayOpacity: 0.5,
  bgOverlayColor: '#03050a',
  bgBlur: 0,
  bgVignette: true,

  // Scripture & Calligraphy Centerpiece
  showSurahCalligraphy: true,
  surahCalligraphyScale: 1.15,
  surahCalligraphyColor: '#F59E0B',
  surahCalligraphyGlow: true,
  calligraphyMedallion: true,

  showArabicSurahName: true,
  arabicSurahNameSize: 34,
  arabicSurahNameColor: '#FFFFFF',

  showEnglishSurahName: true,
  englishSurahNameText: undefined,
  englishSurahNameSize: 48,
  englishSurahNameColor: '#FFFFFF',
  goldGradientText: true,

  showEnglishMeaning: true,
  englishMeaningText: undefined,

  // Ayah Range Badge
  showAyahRangeBadge: true,
  ayahRangeBadgeText: undefined,

  // High-Impact Hook / Title Banner
  showHookTitle: true,
  hookTitleText: 'HEART SOOTHING RECITATION',
  hookTitleSubtitle: 'Listen With Presence of Heart',
  hookTitleFontSize: 24,
  hookTitleColor: '#FDE68A',
  hookTitleBgStyle: 'glass-card',
  hookTitleBgColor: 'rgba(12, 17, 29, 0.75)',
  hookTitleStroke: true,
  hookTitleStrokeColor: 'rgba(245, 158, 11, 0.35)',
  hookTitleStrokeWidth: 1.5,
  hookTitleGlow: true,

  // Reciter & Attribution Badges
  showReciterBadge: true,
  reciterNameText: undefined,
  showReciterStyle: true,
  reciterStyleText: undefined,
  showTranslationBadge: true,
  translationBadgeText: undefined,

  // Clickable Eye-Catching Badges / Ribbons
  activeBadge: '4k-uhd',
  badgeCustomText: undefined,
  badgePosition: 'top-left',

  // Islamic Decorative Overlays
  showIslamicArchFrame: false,
  showArabesqueCorners: true,
  showGoldenSparks: true,
  showSunRays: true,
  accentThemeColor: '#F59E0B',

  // Safe Zone Guide & Helpers (Live preview only, not in export)
  showYouTubeSafeZone: false,
  showRuleOfThirds: false,
};
