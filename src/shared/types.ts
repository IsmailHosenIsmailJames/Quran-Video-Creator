// ==========================================
// 1. Scripture & Word Data Models
// ==========================================
export interface QuranWord {
  id: number;
  location: string;    // "surah:ayah:word" e.g. "1:1:1"
  surah: number;
  ayah: number;
  word: number;        // 1-based index within the Ayah
  text: string;        // Vocalized Arabic word or Ayah marker glyph
}

export type ScriptType = 'qpc-nastaleeq' | 'indopak-nastaleeq' | 'imlaei';

export interface SurahMeta {
  number: number;
  nameArabic: string;
  nameTransliterated: string;
  nameEnglish: string;
  totalAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

// ==========================================
// 2. Recitation & Synchronization
// ==========================================
export interface ReciterInfo {
  id?: string;
  name: string;
  style: string;            // "Murattal" | "Mujawwad" | "Warsh"
  link: string;             // Base CDN URL
  segments_url?: string;    // Compressed timing manifest URL
  img?: string;
  bio?: string;
  source?: string;
}

export interface WordSegment {
  wordIndex: number;        // 1-based index matching QuranWord.word
  startMs: number;          // Start timestamp in milliseconds
  endMs: number;            // End timestamp in milliseconds
}

export interface AyahTimingManifestEntry {
  surah_number: number;
  ayah_number: number;
  audio_url: string;
  duration: number | null;
  segments: [number, number, number][]; // [word_pos, start_ms, end_ms]
}

export type AyahTimingManifest = Record<string, AyahTimingManifestEntry>; // Key: "surah:ayah"

export interface AyahAudioData {
  audioUrl: string;
  durationInSeconds: number;
  segments: WordSegment[];
}

// ==========================================
// 3. Translation Data Models
// ==========================================
export type TranslationFileContent = Record<string, { t: string }>; // Key: "surah:ayah"

export interface TranslationSelection {
  language: string;
  translatorFile: string;
  displayName: string;
}

// ==========================================
// 4. Composition Props & Studio State
// ==========================================
export interface AyahSequenceData {
  surah: number;
  ayah: number;
  surahNameArabic: string;
  surahNameTransliterated: string;
  words: QuranWord[];
  primaryTranslation?: string;
  secondaryTranslation?: string;
  audioUrl: string;
  durationInFrames: number;
  segments: WordSegment[];
}

export type TransitionType =
  | 'crossfade'
  | 'zoom-fade'
  | 'blur-fade'
  | 'slide-left'
  | 'dip-black'
  | 'cut';

export interface BackgroundClip {
  id: string;
  type: 'image' | 'video' | 'preset';
  source: string;
  name: string;
  percentage?: number; // Visualization time percentage (0 to 100), sums to 100% across all clips
  durationRatio: number; // Proportional ratio (kept in sync with percentage)
  speed: number;
  autoFitSpeed?: boolean; // When true (default: true for video), slows down video to reach from start to end without repeating
  sourceDurationSeconds?: number; // Probed natural duration of source video file (in seconds)
  trimStartSeconds: number;
  trimEndSeconds?: number;
  kenBurns?: boolean;
  transition: TransitionType;
  transitionDurationFrames: number;
}

export type ScriptBlockType = 'arabic' | 'primary' | 'secondary';

export type VerticalAlignmentType = 'middle' | 'top' | 'bottom' | 'split';

export type TextAnimationIn = 'float-up' | 'fade' | 'blur-fade' | 'scale-up' | 'none';
export type TextAnimationOut = 'fade' | 'float-up' | 'float-down' | 'blur-fade' | 'scale-down' | 'none';

export interface AyahFontOverride {
  arabicFontSize?: number;
  primaryFontSize?: number;
  secondaryFontSize?: number;
  verticalAlignment?: VerticalAlignmentType;
  verticalOffset?: number; // In pixels (-150 to +150)
  animationIn?: TextAnimationIn | 'inherit';
  animationOut?: TextAnimationOut | 'inherit';
}

export interface VideoTemplateConfig {
  // Scripture Selection
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  includeBismillah?: boolean;

  // Scripture Typography & Styling
  script: ScriptType;
  selectedQuranFont: string;
  arabicFontSize: number;
  arabicLineHeight: number;
  arabicTextColor: string;
  arabicActiveColor: string;
  arabicActiveGlow: boolean;

  // Per-Ayah Custom Font Size Overrides (Key: `${surah}:${ayah}`)
  ayahFontOverrides?: Record<string, AyahFontOverride>;

  // Subtitles
  showPrimaryTranslation: boolean;
  primaryTranslationLang: string;
  primaryTranslationFile: string;
  primaryFontSize: number;
  primaryTextColor: string;

  showSecondaryTranslation: boolean;
  secondaryTranslationLang: string;
  secondaryTranslationFile: string;
  secondaryFontSize: number;
  secondaryTextColor: string;

  // Layout, Reordering, Alignment & Container
  scriptLayoutOrder?: ScriptBlockType[];
  showTranslationContainer?: boolean;
  textAlignment?: 'center' | 'left' | 'right';
  verticalAlignment?: VerticalAlignmentType;
  verticalCustomOffset?: number; // In pixels (-150 to +150, default 0)
  showSurahHeader?: boolean;

  // Scripture & Subtitle In/Out Motion Animations
  animationIn: TextAnimationIn;
  animationOut: TextAnimationOut;
  animationDurationFrames: number; // e.g. 10 to 30 frames (default 18)
  staggerSubtitles?: boolean; // When true, subtitles glide in 4 frames after Arabic text

  // Layout & Background
  aspectRatio: '16:9' | '9:16' | '1:1';
  backgroundType: 'video' | 'image' | 'preset';
  backgroundPath: string;
  backgroundClips: BackgroundClip[];
  defaultTransition: TransitionType;
  overlayOpacity: number;       // 0.2 to 0.85
  vignetteIntensity: number;    // 0.0 to 1.0
  kenBurnsEffect: boolean;

  // Audio & Waveform
  reciterIndex: number;
  recitationSpeed: number;      // 0.75x to 1.25x (default 1.0)
  customAudioPath?: string;
  showWaveform: boolean;
  waveformType: 'smooth-wave' | 'mirrored-bars';
  waveformColor: string;
  waveformHeight: number;
  waveformWidth?: number;       // Percentage of canvas width (e.g. 50% to 100%, default 92%)
  waveformAmplitude?: number;   // Dynamic gain multiplier (e.g. 1.0 to 3.5, default 2.2)
  waveformPositionY: number;   // Percentage from top (e.g. 78%)

  // Branding
  showBranding: boolean;
  logoPath?: string;
  channelHandle: string;
  brandingPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  brandingScale: number;

  // Video Output
  fps: 30 | 60;
  resolution: '1080p' | '4k' | '720p';
}

export type QuranVideoCompositionProps = {
  config: VideoTemplateConfig;
  ayahs: AyahSequenceData[];
  totalDurationInFrames: number;
  [key: string]: unknown;
};

export interface RenderProgressPayload {
  jobId: string;
  progress: number;            // 0.0 to 1.0
  currentFrame?: number;
  totalFrames?: number;
  renderEstimatedTime?: number; // Estimated remaining time in ms
  status: 'rendering' | 'encoding' | 'completed' | 'failed' | 'cancelled';
  error?: string;
}
