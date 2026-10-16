import surahNamesJson from './data/surah_name_localization.json';
import { getSurahByNumber } from './surahs';
import { VideoTemplateConfig } from './types';

export interface LanguageLocalizationMeta {
  code: string;
  name: string;
  nativeName: string;
  aliases: string[];
  bismillah: string;
  ayahPrefix: string;
  fontFamily: string;
  digits?: (num: number) => string;
  formatAyah?: (ayahNum: number) => string;
}

const toBengaliDigits = (num: number): string =>
  String(num).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);

const toArabicIndicDigits = (num: number): string =>
  String(num).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

const toUrduPersianDigits = (num: number): string =>
  String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

const toDevanagariDigits = (num: number): string =>
  String(num).replace(/\d/g, (d) => '०१२३४५६७८९'[Number(d)]);

const toGurmukhiDigits = (num: number): string =>
  String(num).replace(/\d/g, (d) => '੦੧੨੩੪੫੬੭੮੯'[Number(d)]);

export const LOCALIZATION_META_MAP: Record<string, LanguageLocalizationMeta> = {
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    aliases: ['bengali', 'bangla', 'bn', 'ben', 'বাংলা'],
    bismillah: 'বিসমিল্লাহ',
    ayahPrefix: 'আয়াত',
    fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif",
    digits: toBengaliDigits,
    formatAyah: (n) => `আয়াত ${toBengaliDigits(n)}`,
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    aliases: ['english', 'en', 'eng'],
    bismillah: 'Bismillah',
    ayahPrefix: 'Ayah',
    fontFamily: "'Inter', sans-serif",
    formatAyah: (n) => `Ayah ${n}`,
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    aliases: ['arabic', 'ar', 'ara', 'العربية'],
    bismillah: 'بسم الله',
    ayahPrefix: 'آية',
    fontFamily: "'Amiri', 'Traditional Arabic', sans-serif",
    digits: toArabicIndicDigits,
    formatAyah: (n) => `آية ${toArabicIndicDigits(n)}`,
  },
  ur: {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    aliases: ['urdu', 'ur', 'urd', 'اردو'],
    bismillah: 'بسم اللہ',
    ayahPrefix: 'آیت',
    fontFamily: "'Noto Nastaliq Urdu', 'noorehira', 'Amiri', sans-serif",
    digits: toUrduPersianDigits,
    formatAyah: (n) => `آیت ${toUrduPersianDigits(n)}`,
  },
  id: {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    aliases: ['indonesian', 'id', 'ind', 'bahasa indonesia', 'indonesia'],
    bismillah: 'Bismillah',
    ayahPrefix: 'Ayat',
    fontFamily: "'Inter', sans-serif",
    formatAyah: (n) => `Ayat ${n}`,
  },
  tr: {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    aliases: ['turkish', 'tr', 'tur', 'türkçe', 'turkce'],
    bismillah: 'Bismillah',
    ayahPrefix: 'Ayet',
    fontFamily: "'Inter', sans-serif",
    formatAyah: (n) => `Ayet ${n}`,
  },
  fa: {
    code: 'fa',
    name: 'Persian',
    nativeName: 'فارسی',
    aliases: ['persian', 'fa', 'fas', 'per', 'farsi', 'فارسی'],
    bismillah: 'بسم الله',
    ayahPrefix: 'آیه',
    fontFamily: "'Amiri', 'Noto Nastaliq Urdu', sans-serif",
    digits: toUrduPersianDigits,
    formatAyah: (n) => `آیه ${toUrduPersianDigits(n)}`,
  },
  pa: {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    aliases: ['punjabi', 'pa', 'pan', 'panjabi', 'ਪੰਜਾਬੀ'],
    bismillah: 'ਬਿਸਮਿੱਲਾਹ',
    ayahPrefix: 'ਆਇਤ',
    fontFamily: "'Noto Sans Gurmukhi', 'Inter', sans-serif",
    digits: toGurmukhiDigits,
    formatAyah: (n) => `ਆਇਤ ${toGurmukhiDigits(n)}`,
  },
  ps: {
    code: 'ps',
    name: 'Pashto',
    nativeName: 'پښتو',
    aliases: ['pashto', 'ps', 'pus', 'pushto', 'پښتو'],
    bismillah: 'بسم الله',
    ayahPrefix: 'آیت',
    fontFamily: "'Amiri', sans-serif",
    digits: toUrduPersianDigits,
    formatAyah: (n) => `آیت ${toUrduPersianDigits(n)}`,
  },
  ms: {
    code: 'ms',
    name: 'Malay',
    nativeName: 'Bahasa Melayu',
    aliases: ['malay', 'ms', 'msa', 'may', 'bahasa melayu', 'melayu'],
    bismillah: 'Bismillah',
    ayahPrefix: 'Ayat',
    fontFamily: "'Inter', sans-serif",
    formatAyah: (n) => `Ayat ${n}`,
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    aliases: ['french', 'fr', 'fra', 'fre', 'français', 'francais'],
    bismillah: 'Bismillah',
    ayahPrefix: 'Verset',
    fontFamily: "'Inter', sans-serif",
    formatAyah: (n) => `Verset ${n}`,
  },
  ku: {
    code: 'ku',
    name: 'Kurdish',
    nativeName: 'کوردی',
    aliases: ['kurdish', 'ku', 'kur', 'kurdî', 'kurdi', 'کوردی'],
    bismillah: 'بیسمیلا',
    ayahPrefix: 'ئایەت',
    fontFamily: "'Amiri', 'Inter', sans-serif",
    formatAyah: (n) => `ئایەت ${n}`,
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    aliases: ['russian', 'ru', 'rus', 'русский'],
    bismillah: 'Бисмиллях',
    ayahPrefix: 'Аят',
    fontFamily: "'Inter', sans-serif",
    formatAyah: (n) => `Аят ${n}`,
  },
  sw: {
    code: 'sw',
    name: 'Swahili',
    nativeName: 'Kiswahili',
    aliases: ['swahili', 'sw', 'swa', 'kiswahili'],
    bismillah: 'Bismillah',
    ayahPrefix: 'Aya',
    fontFamily: "'Inter', sans-serif",
    formatAyah: (n) => `Aya ${n}`,
  },
  az: {
    code: 'az',
    name: 'Azeri',
    nativeName: 'Azərbaycan',
    aliases: ['azeri', 'az', 'aze', 'azerbaijani', 'azərbaycan', 'azerbaycan'],
    bismillah: 'Bismillah',
    ayahPrefix: 'Ayə',
    fontFamily: "'Inter', sans-serif",
    formatAyah: (n) => `Ayə ${n}`,
  },
  kk: {
    code: 'kk',
    name: 'Kazakh',
    nativeName: 'Қазақша',
    aliases: ['kazakh', 'kk', 'kaz', 'қазақ', 'қазақша', 'qazaq'],
    bismillah: 'Бисмиллә',
    ayahPrefix: 'Аят',
    fontFamily: "'Inter', sans-serif",
    formatAyah: (n) => `Аят ${n}`,
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    aliases: ['hindi', 'hi', 'hin', 'हिन्दी', 'हिंदी'],
    bismillah: 'बिस्मिल्लाह',
    ayahPrefix: 'आयत',
    fontFamily: "'Noto Sans Devanagari', 'Inter', sans-serif",
    digits: toDevanagariDigits,
    formatAyah: (n) => `आयत ${toDevanagariDigits(n)}`,
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    aliases: ['spanish', 'es', 'spa', 'español', 'espanol'],
    bismillah: 'Bismillah',
    ayahPrefix: 'Aleya',
    fontFamily: "'Inter', sans-serif",
    formatAyah: (n) => `Aleya ${n}`,
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    aliases: ['portuguese', 'pt', 'por', 'português', 'portugues'],
    bismillah: 'Bismillah',
    ayahPrefix: 'Versículo',
    fontFamily: "'Inter', sans-serif",
    formatAyah: (n) => `Versículo ${n}`,
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    aliases: ['chinese', 'zh', 'zho', 'chi', '中文', 'mandarin'],
    bismillah: '太斯米',
    ayahPrefix: '节',
    fontFamily: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    formatAyah: (n) => `第${n}节`,
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    aliases: ['japanese', 'ja', 'jpn', '日本語'],
    bismillah: 'ビスミッラー',
    ayahPrefix: '節',
    fontFamily: "'Noto Sans JP', 'Hiragino Sans', 'Meiryo', sans-serif",
    formatAyah: (n) => `第${n}節`,
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    aliases: ['german', 'de', 'deu', 'ger', 'deutsch'],
    bismillah: 'Bismillah',
    ayahPrefix: 'Vers',
    fontFamily: "'Inter', sans-serif",
    formatAyah: (n) => `Vers ${n}`,
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    aliases: ['korean', 'ko', 'kor', '한국어'],
    bismillah: '비스밀라',
    ayahPrefix: '절',
    fontFamily: "'Noto Sans KR', 'Malgun Gothic', sans-serif",
    formatAyah: (n) => `${n}절`,
  },
  vi: {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    aliases: ['vietnamese', 'vi', 'vie', 'tiếng việt', 'tieng viet'],
    bismillah: 'Bismillah',
    ayahPrefix: 'Câu',
    fontFamily: "'Inter', sans-serif",
    formatAyah: (n) => `Câu ${n}`,
  },
  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    aliases: ['tamil', 'ta', 'tam', 'தமிழ்'],
    bismillah: 'பிஸ்மில்லாஹ்',
    ayahPrefix: 'வசனம்',
    fontFamily: "'Noto Sans Tamil', sans-serif",
    formatAyah: (n) => `வசனம் ${n}`,
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    aliases: ['italian', 'it', 'ita', 'italiano'],
    bismillah: 'Bismillah',
    ayahPrefix: 'Versetto',
    fontFamily: "'Inter', sans-serif",
    formatAyah: (n) => `Versetto ${n}`,
  },
};

export const SURAH_NAME_LOCALIZATION: Record<string, string[]> = surahNamesJson;

export const SUPPORTED_LOCALIZATION_LANGUAGES = Object.values(LOCALIZATION_META_MAP);

/**
 * Normalizes any language string or code (e.g. "Bengali", "Bangla", "bn", "bn-BD", "Arabic")
 * to one of the 26 supported localization codes.
 * Returns null if the language cannot be resolved to a supported localized language.
 */
export function resolveLocalizationCode(langOrCode?: string | null): string | null {
  if (!langOrCode) return null;
  const raw = langOrCode.trim().toLowerCase().replace(/[_-]/g, ' ');
  const codeCandidate = raw.split(' ')[0];

  // Direct match in meta map
  if (LOCALIZATION_META_MAP[codeCandidate]) {
    return codeCandidate;
  }

  // Alias lookup
  for (const [code, meta] of Object.entries(LOCALIZATION_META_MAP)) {
    if (
      code === raw ||
      meta.name.toLowerCase() === raw ||
      meta.nativeName.toLowerCase() === raw ||
      meta.aliases.some((alias) => alias.toLowerCase() === raw || alias.toLowerCase() === codeCandidate)
    ) {
      return code;
    }
  }

  return null;
}

/**
 * Returns true if the language is supported in surah_name_localization.json
 */
export function isLocalizationSupported(langOrCode?: string | null): boolean {
  return resolveLocalizationCode(langOrCode) !== null;
}

/**
 * Normalizes language with English fallback.
 */
export function normalizeLanguageCode(langOrCode?: string | null): string {
  return resolveLocalizationCode(langOrCode) || 'en';
}

/**
 * Retrieves the localized name of a Surah (1 to 114).
 * Falls back to English transliteration if not found.
 */
export function getSurahNameLocalized(surahNumber: number, langOrCode?: string | null): string {
  const code = normalizeLanguageCode(langOrCode);
  const surahsInLang = SURAH_NAME_LOCALIZATION[code];
  const index = surahNumber - 1;

  if (surahsInLang && surahsInLang[index]) {
    return surahsInLang[index];
  }

  // Fallback to SURAHS_LIST transliteration
  const meta = getSurahByNumber(surahNumber);
  return meta?.nameTransliterated || `Surah ${surahNumber}`;
}

/**
 * Retrieves the localized Ayah label (e.g. "আয়াত ১" or "বিসমিল্লাহ" for Ayah 0).
 */
export function getAyahLabelLocalized(ayahNumber: number, langOrCode?: string | null): string {
  const code = normalizeLanguageCode(langOrCode);
  const meta = LOCALIZATION_META_MAP[code] || LOCALIZATION_META_MAP['en'];

  if (ayahNumber === 0) {
    return meta.bismillah;
  }

  if (meta.formatAyah) {
    return meta.formatAyah(ayahNumber);
  }

  const digits = meta.digits ? meta.digits(ayahNumber) : String(ayahNumber);
  return `${meta.ayahPrefix} ${digits}`;
}

/**
 * Retrieves the font family appropriate for the localized language.
 */
export function getLanguageFontFamily(langOrCode?: string | null): string {
  const code = normalizeLanguageCode(langOrCode);
  const meta = LOCALIZATION_META_MAP[code] || LOCALIZATION_META_MAP['en'];
  return meta.fontFamily;
}

export interface LocalizedHeaderInfo {
  langCode: string;
  isLocalized: boolean;
  surahName: string;
  ayahLabel: string;
  fullTitle: string;
  fontFamily: string;
}

/**
 * Primary resolver for Video Top Header badge.
 * Respects:
 * 1. config.headerLanguage (if explicitly set and !== 'auto')
 * 2. config.primaryTranslationLang
 * 3. config.secondaryTranslationLang
 * 4. Fallback to English
 */
export function getLocalizedHeader(
  config: Partial<VideoTemplateConfig>,
  surahNumber: number,
  ayahNumber: number
): LocalizedHeaderInfo {
  let targetLang: string | null = null;

  // 1. Explicit headerLanguage override if specified and not 'auto'
  if (config.headerLanguage && config.headerLanguage !== 'auto') {
    targetLang = resolveLocalizationCode(config.headerLanguage);
  }

  // 2. Auto mode: check primary translation language
  if (!targetLang && config.primaryTranslationLang) {
    targetLang = resolveLocalizationCode(config.primaryTranslationLang);
  }

  // 3. Fallback to secondary translation language if available
  if (!targetLang && config.secondaryTranslationLang) {
    targetLang = resolveLocalizationCode(config.secondaryTranslationLang);
  }

  const isLocalized = targetLang !== null;
  const langCode = targetLang || 'en';
  const meta = LOCALIZATION_META_MAP[langCode] || LOCALIZATION_META_MAP['en'];

  const surahName = getSurahNameLocalized(surahNumber, langCode);
  const ayahLabel = getAyahLabelLocalized(ayahNumber, langCode);
  const fullTitle = `${surahName} • ${ayahLabel}`;
  const fontFamily = meta.fontFamily;

  return {
    langCode,
    isLocalized,
    surahName,
    ayahLabel,
    fullTitle,
    fontFamily,
  };
}

/**
 * Formats a raw translation file name (e.g. "Saheeh_International.json.txt")
 * into a human-readable translation book / scholar name (e.g. "Saheeh International").
 */
export function formatTranslationFileName(filename?: string): string {
  if (!filename) return '';
  return filename
    .replace(/\.json\.txt$/i, '')
    .replace(/\.json$/i, '')
    .replace(/_/g, ' ')
    .trim();
}

/**
 * Resolves the active translation book name from template config.
 * Prioritizes active primary translation, followed by active secondary translation,
 * or configured translation file.
 */
export function getTranslationBookName(config: Partial<VideoTemplateConfig>): string {
  if (!config) return '';

  let file = '';
  if (config.showPrimaryTranslation !== false && config.primaryTranslationFile) {
    file = config.primaryTranslationFile;
  } else if (config.showSecondaryTranslation && config.secondaryTranslationFile) {
    file = config.secondaryTranslationFile;
  } else if (config.primaryTranslationFile) {
    file = config.primaryTranslationFile;
  } else if (config.secondaryTranslationFile) {
    file = config.secondaryTranslationFile;
  }

  return formatTranslationFileName(file);
}

