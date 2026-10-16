import { VideoTemplateConfig, ReciterInfo } from './types';

export type ThumbnailPresetId =
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
  | '4k-uhd';

export interface ThumbnailPresetOption {
  id: ThumbnailPresetId;
  name: string;
  description: string;
  accentColor: string;
  secondaryColor: string;
  badgeText: string;
  hookTitle: string;
  hookSubtitle: string;
  bgPresetUrl: string;
  bgOverlayOpacity: number;
  bgOverlayColor: string;
  showArchFrame: boolean;
  showArabesqueCorners: boolean;
  showSunRays: boolean;
  showGoldenSparks: boolean;
}

export interface ThumbnailConfig {
  preset: ThumbnailPresetId;
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

  showArabicSurahName: boolean;
  arabicSurahNameSize: number;
  arabicSurahNameColor: string;

  showEnglishSurahName: boolean;
  englishSurahNameText?: string;
  englishSurahNameSize: number;
  englishSurahNameColor: string;

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
  hookTitleBgStyle: 'none' | 'gradient-pill' | 'solid-banner' | 'glass-card' | 'glow-outline';
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
  badgePosition: 'top-left' | 'top-right' | 'bottom-left';

  // Islamic Decorative Overlays
  showIslamicArchFrame: boolean;
  showArabesqueCorners: boolean;
  showGoldenSparks: boolean;
  showSunRays: boolean;
  accentThemeColor: string;

  // Safe Zone Guide & Helpers
  showYouTubeSafeZone: boolean;
  showRuleOfThirds: boolean;
}

export const THUMBNAIL_PRESET_OPTIONS: ThumbnailPresetOption[] = [
  {
    id: 'grand-gold-calligraphy',
    name: 'Grand Golden Calligraphy',
    description: 'Opulent royal gold calligraphy with dark starry backdrop, golden aura, and luminous amber badges.',
    accentColor: '#F59E0B',
    secondaryColor: '#FBBF24',
    badgeText: '🔥 MUST LISTEN',
    hookTitle: 'HEART SOOTHING RECITATION',
    hookSubtitle: 'Listen With Presence of Heart',
    bgPresetUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.45,
    bgOverlayColor: '#000000',
    showArchFrame: true,
    showArabesqueCorners: true,
    showSunRays: true,
    showGoldenSparks: true,
  },
  {
    id: 'emerald-medina',
    name: 'Emerald Medina Arch',
    description: 'Deep Islamic emerald green with intricate arabesque trim, jade radiance, and sacred Quranic typography.',
    accentColor: '#10B981',
    secondaryColor: '#34D399',
    badgeText: '✨ PEACE OF SOUL',
    hookTitle: 'BEAUTIFUL & PEACEFUL',
    hookSubtitle: 'Calm Your Heart & Mind',
    bgPresetUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.5,
    bgOverlayColor: '#021a14',
    showArchFrame: true,
    showArabesqueCorners: true,
    showSunRays: false,
    showGoldenSparks: true,
  },
  {
    id: 'cinematic-night',
    name: 'Cinematic Dark Bokeh',
    description: 'Ultra-dark moody midnight atmosphere, celestial moonlight bokeh, and high-contrast glowing typography.',
    accentColor: '#38BDF8',
    secondaryColor: '#0284C7',
    badgeText: '🌙 NIGHT RECITATION',
    hookTitle: 'LISTEN BEFORE SLEEPING',
    hookSubtitle: 'Sleep In Peace & Protection',
    bgPresetUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.55,
    bgOverlayColor: '#040914',
    showArchFrame: false,
    showArabesqueCorners: true,
    showSunRays: true,
    showGoldenSparks: true,
  },
  {
    id: 'sunset-serenity',
    name: 'Warm Sunset & Minarets',
    description: 'Warm golden-hour desert sunset, soothing amber hues, radiant halo, and heart-touching reflection hook.',
    accentColor: '#FB923C',
    secondaryColor: '#F59E0B',
    badgeText: '🤲 DUAA & REFLECTION',
    hookTitle: 'PROTECTION FROM EVIL',
    hookSubtitle: 'Recite Every Morning & Evening',
    bgPresetUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.42,
    bgOverlayColor: '#120702',
    showArchFrame: true,
    showArabesqueCorners: false,
    showSunRays: true,
    showGoldenSparks: true,
  },
  {
    id: 'royal-velvet',
    name: 'Royal Velvet & Gold',
    description: 'Regal deep indigo-purple and gold trim, sacred geometric star medallion, and luxury scholar aesthetic.',
    accentColor: '#C084FC',
    secondaryColor: '#F59E0B',
    badgeText: '💎 FULL SURAH',
    hookTitle: 'EMOTIONAL RECITATION',
    hookSubtitle: 'A Recitation That Brings Tears',
    bgPresetUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.52,
    bgOverlayColor: '#0c051a',
    showArchFrame: true,
    showArabesqueCorners: true,
    showSunRays: false,
    showGoldenSparks: true,
  },
  {
    id: 'minimal-focus',
    name: 'Modern High CTR Focus',
    description: 'Split layout optimized for maximum mobile click-through rate, massive hook badge, and ultra-crisp typography.',
    accentColor: '#EF4444',
    secondaryColor: '#FBBF24',
    badgeText: '🔥 HIGH CTR VIRAL',
    hookTitle: 'SURAH YOU MUST KNOW',
    hookSubtitle: 'Powerful Virtues & Meanings',
    bgPresetUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.65,
    bgOverlayColor: '#000000',
    showArchFrame: false,
    showArabesqueCorners: false,
    showSunRays: false,
    showGoldenSparks: false,
  },
  {
    id: 'dramatic-clouds',
    name: 'Epic Storm & God-Rays',
    description: 'Dramatic volumetric god-rays piercing heavy cinematic clouds with radiant golden calligraphy.',
    accentColor: '#FBBF24',
    secondaryColor: '#FFFFFF',
    badgeText: '⭐ 4K ULTRA HD',
    hookTitle: 'POWERFUL RECITATION',
    hookSubtitle: 'Clear Audio & High Definition',
    bgPresetUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.48,
    bgOverlayColor: '#000000',
    showArchFrame: false,
    showArabesqueCorners: true,
    showSunRays: true,
    showGoldenSparks: true,
  },
  {
    id: 'sacred-arch',
    name: 'Andalusian Moorish Arch',
    description: 'Classic Moorish horseshoe arch enclosing the scripture, intricate geometric border, and heritage feel.',
    accentColor: '#D97706',
    secondaryColor: '#F59E0B',
    badgeText: '🎧 USE HEADPHONES',
    hookTitle: 'IMMERSIVE 3D AUDIO',
    hookSubtitle: 'Experience the Sacred Words',
    bgPresetUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1920&auto=format&fit=crop',
    bgOverlayOpacity: 0.5,
    bgOverlayColor: '#080502',
    showArchFrame: true,
    showArabesqueCorners: true,
    showSunRays: false,
    showGoldenSparks: true,
  },
];

export const THUMBNAIL_HOOK_SUGGESTIONS = [
  'HEART SOOTHING RECITATION',
  'PROTECTION FROM ALL EVIL',
  'LISTEN BEFORE SLEEPING',
  'TEARFUL EMOTIONAL RECITATION',
  'CURE FOR ANXIETY & DEPRESSION',
  'SURAH AL-KAHF — FRIDAY BLESSING',
  'PEACE OF THE SOUL & MIND',
  'INCREDIBLE BEAUTIFUL VOICE',
  'RECITATION THAT TOUCHES THE HEART',
  'FEEL THE MAJESTY OF QURAN',
  'PROTECTION FROM THE GRAVE',
  'SURAH YASIN — HEART OF QURAN',
];

export const THUMBNAIL_BADGE_PRESETS: { id: ThumbnailBadgeId; label: string; bg: string; text: string }[] = [
  { id: 'none', label: 'None (Hidden)', bg: 'transparent', text: 'transparent' },
  { id: 'must-listen', label: '🔥 MUST LISTEN', bg: 'bg-red-500', text: '#FFFFFF' },
  { id: 'heart-soothing', label: '✨ HEART SOOTHING', bg: 'bg-amber-500', text: '#000000' },
  { id: 'full-surah', label: '💎 FULL SURAH', bg: 'bg-indigo-600', text: '#FFFFFF' },
  { id: 'emotional', label: '😭 EMOTIONAL', bg: 'bg-rose-600', text: '#FFFFFF' },
  { id: 'peaceful-sleep', label: '🌙 PEACEFUL SLEEP', bg: 'bg-cyan-600', text: '#FFFFFF' },
  { id: 'protection', label: '🛡️ PROTECTION', bg: 'bg-emerald-600', text: '#FFFFFF' },
  { id: 'use-headphones', label: '🎧 USE HEADPHONES', bg: 'bg-violet-600', text: '#FFFFFF' },
  { id: '4k-uhd', label: '⭐ 4K ULTRA HD', bg: 'bg-amber-400', text: '#000000' },
];

export const DEFAULT_THUMBNAIL_CONFIG: ThumbnailConfig = {
  preset: 'grand-gold-calligraphy',
  aspectRatio: '16:9',
  width: 1280,
  height: 720,

  // Background
  bgType: 'preset',
  bgPresetUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920&auto=format&fit=crop',
  bgCustomUrl: undefined,
  bgCapturedDataUrl: undefined,
  bgGradientFrom: '#030406',
  bgGradientTo: '#101524',
  bgGradientAngle: 135,
  bgOverlayOpacity: 0.45,
  bgOverlayColor: '#000000',
  bgBlur: 0,
  bgVignette: true,

  // Scripture & Calligraphy Centerpiece
  showSurahCalligraphy: true,
  surahCalligraphyScale: 1.15,
  surahCalligraphyColor: '#F59E0B',
  surahCalligraphyGlow: true,

  showArabicSurahName: true,
  arabicSurahNameSize: 34,
  arabicSurahNameColor: '#FFFFFF',

  showEnglishSurahName: true,
  englishSurahNameText: undefined,
  englishSurahNameSize: 42,
  englishSurahNameColor: '#FFFFFF',

  showEnglishMeaning: true,
  englishMeaningText: undefined,

  // Ayah Range Badge
  showAyahRangeBadge: true,
  ayahRangeBadgeText: undefined,

  // High-Impact Hook / Title Banner
  showHookTitle: true,
  hookTitleText: 'HEART SOOTHING RECITATION',
  hookTitleSubtitle: 'Listen With Presence of Heart',
  hookTitleFontSize: 30,
  hookTitleColor: '#FBBF24',
  hookTitleBgStyle: 'gradient-pill',
  hookTitleBgColor: 'rgba(0, 0, 0, 0.75)',
  hookTitleStroke: true,
  hookTitleStrokeColor: 'rgba(245, 158, 11, 0.4)',
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
  activeBadge: 'must-listen',
  badgeCustomText: undefined,
  badgePosition: 'top-left',

  // Islamic Decorative Overlays
  showIslamicArchFrame: true,
  showArabesqueCorners: true,
  showGoldenSparks: true,
  showSunRays: true,
  accentThemeColor: '#F59E0B',

  // Safe Zone Guide & Helpers
  showYouTubeSafeZone: false,
  showRuleOfThirds: false,
};
