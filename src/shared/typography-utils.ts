import { VideoTemplateConfig, AyahFontOverride, QuranWord } from './types';

export interface ComputedFontSizes {
  arabicFontSize: number;
  primaryFontSize: number;
  secondaryFontSize: number;
  isAutoScaled: boolean;
}

/**
 * Dynamically computes optimal font sizes for Arabic scripture, primary translation,
 * and secondary translation based on ayah length and canvas aspect ratio.
 * Ensures long verses fit comfortably without screen clipping, while keeping short verses prominent.
 */
export function computeAdaptiveFontSizes(
  config: Partial<VideoTemplateConfig>,
  ayahData?: {
    words?: QuranWord[];
    primaryTranslation?: string;
    secondaryTranslation?: string;
  } | null,
  override?: AyahFontOverride
): ComputedFontSizes {
  const baseArabic = config.arabicFontSize || 56;
  const basePrimary = config.primaryFontSize || 26;
  const baseSecondary = config.secondaryFontSize || 21;

  // If auto-adjust is disabled by user config, use explicit base or override values
  if (config.autoAdjustFontSizeByLength === false) {
    return {
      arabicFontSize: override?.arabicFontSize ?? baseArabic,
      primaryFontSize: override?.primaryFontSize ?? basePrimary,
      secondaryFontSize: override?.secondaryFontSize ?? baseSecondary,
      isAutoScaled: false,
    };
  }

  // Count words and characters
  const words = ayahData?.words || [];
  const wordCount = words.length;

  const primaryText = (ayahData?.primaryTranslation || '').trim();
  const secondaryText = (ayahData?.secondaryTranslation || '').trim();
  const primaryCharCount = primaryText.length;
  const secondaryCharCount = secondaryText.length;

  // Active translations
  const showPrimary = config.showPrimaryTranslation !== false && Boolean(primaryText);
  const showSecondary = config.showSecondaryTranslation !== false && Boolean(secondaryText);
  const activeTranslations = (showPrimary ? 1 : 0) + (showSecondary ? 1 : 0);

  // 1. Arabic scale factor based on word count
  // 1-6 words: 1.0 (e.g. 56px)
  // 7-12 words: ~0.94 - 0.88 (e.g. 52px - 49px)
  // 13-22 words: ~0.88 - 0.76 (e.g. 48px - 42px)
  // 23-35 words: ~0.76 - 0.65 (e.g. 42px - 36px)
  // 36-55 words: ~0.65 - 0.54 (e.g. 36px - 30px)
  // 56-85 words: ~0.54 - 0.44 (e.g. 30px - 25px)
  // > 85 words: down to 0.38 min
  let arabicScale = 1.0;
  if (wordCount <= 6) {
    arabicScale = 1.0;
  } else if (wordCount <= 12) {
    arabicScale = 1.0 - ((wordCount - 6) / 6) * 0.10;
  } else if (wordCount <= 22) {
    arabicScale = 0.90 - ((wordCount - 12) / 10) * 0.14;
  } else if (wordCount <= 35) {
    arabicScale = 0.76 - ((wordCount - 22) / 13) * 0.12;
  } else if (wordCount <= 55) {
    arabicScale = 0.64 - ((wordCount - 35) / 20) * 0.12;
  } else if (wordCount <= 85) {
    arabicScale = 0.52 - ((wordCount - 55) / 30) * 0.10;
  } else {
    arabicScale = Math.max(0.38, 0.42 - ((wordCount - 85) / 50) * 0.06);
  }

  // 2. Primary translation (Subtitle) scale factor based on character length
  // 0-60 chars: 1.0 (e.g. 26px)
  // 61-120 chars: ~0.90 (e.g. 23px)
  // 121-200 chars: ~0.80 (e.g. 21px)
  // 201-320 chars: ~0.70 (e.g. 18px)
  // 321-480 chars: ~0.60 (e.g. 15px)
  // > 480 chars: down to ~0.48 (e.g. 12px)
  let primaryScale = 1.0;
  if (primaryCharCount <= 60) {
    primaryScale = 1.0;
  } else if (primaryCharCount <= 120) {
    primaryScale = 1.0 - ((primaryCharCount - 60) / 60) * 0.10;
  } else if (primaryCharCount <= 200) {
    primaryScale = 0.90 - ((primaryCharCount - 120) / 80) * 0.12;
  } else if (primaryCharCount <= 320) {
    primaryScale = 0.78 - ((primaryCharCount - 200) / 120) * 0.12;
  } else if (primaryCharCount <= 480) {
    primaryScale = 0.66 - ((primaryCharCount - 320) / 160) * 0.12;
  } else {
    primaryScale = Math.max(0.48, 0.54 - ((primaryCharCount - 480) / 300) * 0.08);
  }

  // 3. Secondary translation (English) scale factor based on character length
  // 0-70 chars: 1.0 (e.g. 21px)
  // 71-140 chars: ~0.90 (e.g. 19px)
  // 141-240 chars: ~0.80 (e.g. 17px)
  // 241-380 chars: ~0.70 (e.g. 15px)
  // 381-560 chars: ~0.60 (e.g. 13px)
  // > 560 chars: down to ~0.48 (e.g. 10px)
  let secondaryScale = 1.0;
  if (secondaryCharCount <= 70) {
    secondaryScale = 1.0;
  } else if (secondaryCharCount <= 140) {
    secondaryScale = 1.0 - ((secondaryCharCount - 70) / 70) * 0.10;
  } else if (secondaryCharCount <= 240) {
    secondaryScale = 0.90 - ((secondaryCharCount - 140) / 100) * 0.12;
  } else if (secondaryCharCount <= 380) {
    secondaryScale = 0.78 - ((secondaryCharCount - 240) / 140) * 0.12;
  } else if (secondaryCharCount <= 560) {
    secondaryScale = 0.66 - ((secondaryCharCount - 380) / 180) * 0.12;
  } else {
    secondaryScale = Math.max(0.48, 0.54 - ((secondaryCharCount - 560) / 300) * 0.08);
  }

  // 4. Combined vertical layout adjustment:
  // In 16:9 widescreen, height is constrained (1080px). If both translations are active and
  // text is substantial, add a gentle 8% proportional squeeze to prevent edge clipping.
  if (activeTranslations === 2 && (wordCount > 16 || primaryCharCount > 130)) {
    if (config.aspectRatio === '16:9') {
      arabicScale *= 0.92;
      primaryScale *= 0.92;
      secondaryScale *= 0.92;
    }
  }

  // Minimum bounds to ensure crisp readability across all screen resolutions
  const autoArabic = Math.max(20, Math.round(baseArabic * arabicScale));
  const autoPrimary = Math.max(12, Math.round(basePrimary * primaryScale));
  const autoSecondary = Math.max(11, Math.round(baseSecondary * secondaryScale));

  return {
    arabicFontSize: override?.arabicFontSize ?? autoArabic,
    primaryFontSize: override?.primaryFontSize ?? autoPrimary,
    secondaryFontSize: override?.secondaryFontSize ?? autoSecondary,
    isAutoScaled:
      override?.arabicFontSize === undefined ||
      override?.primaryFontSize === undefined ||
      override?.secondaryFontSize === undefined,
  };
}
