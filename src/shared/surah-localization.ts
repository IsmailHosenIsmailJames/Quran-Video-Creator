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

export const toBengaliDigits = (num: number | string): string =>
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

/**
 * Authentic Bengali phonetic translations for renowned Quran Reciters
 */
export const BENGALI_RECITERS_MAP: Record<string, string> = {
  'Mishari Rashid Alafasy': 'মিশারি রাশিদ আল-আফাসি',
  'Mishari Rashid Al-Afasy': 'মিশারি রাশিদ আল-আফাসি',
  'Mishary Rashid Alafasy': 'মিশারি রাশিদ আল-আফাসি',
  'Abdul Basit Abdus Samad': 'আব্দুল বাছিত আব্দুস সামাদ',
  'AbdulBaset': 'আব্দুল বাছিত আব্দুস সামাদ',
  'Abdullah Basfar': 'আব্দুল্লাহ বাসফার',
  'Abdur-Rahman as-Sudais': 'আব্দুর রহমান আস-সুদাইস',
  'Abdurrahmaan As-Sudais': 'আব্দুর রহমান আস-সুদাইস',
  'Abu Bakr al-Shatri': 'আবু বকর আশ-শাতরি',
  'Ahmed ibn Ali al-Ajamy': 'আহমেদ ইবনে আলী আল-আজমী',
  'Saad Al-Ghamdi': 'সাদ আল-গামদি',
  'Hani ar-Rifai': 'হানি আর-রিফাই',
  'Mahmoud Khalil Al-Husary': 'মাহমুদ খলিল আল-হুসারি',
  'Ali Al-Hudhaify': 'আলী আল-হুজাইফি',
  'Ibrahim Akhdar': 'ইব্রাহিম আখদার',
  'Maher Al Muaiqly': 'মাহের আল-মুয়াইক্লি',
  'Maher Al-Muaiqly': 'মাহের আল-মুয়াইক্লি',
  'Mohamed Siddiq al-Minshawi': 'মুহাম্মদ সিদ্দিক আল-মিনশাবি',
  'Muhammad Ayyoub': 'মুহাম্মদ আইয়ুব',
  'Muhammad Jibreel': 'মুহাম্মদ জিবরিল',
  'Mustafa Ismail': 'মুস্তফা ইসমাইল',
  "Sa'ud ash-Shuraym": 'সাউদ আশ-শুরাইম',
  'Saud ash-Shuraym': 'সাউদ আশ-শুরাইম',
  'Salah Bukhatir': 'সালাহ বুখাতির',
  'Muhsin Al Qasim': 'মুহসিন আল-কাসিম',
  'Abdullah Awad Al-Juhani': 'আব্দুল্লাহ আওয়াদ আল-জুহানি',
  'Salah Al Budair': 'সালাহ আল-বুদাইর',
  'Abdullah Matroud': 'আব্দুল্লাহ মাতরুদ',
  'Ahmed Nuaina': 'আহমেদ নুয়াইনা',
  'Muhammad AbdulKareem': 'মুহাম্মদ আব্দুল করিম',
  'Khalifa Al-Tunaiji': 'খলিফা আল-তুনাইজি',
  'Mahmoud Ali Al-Banna': 'মাহমুদ আলী আল-বান্না',
  'Ibrahim Al-Dosary': 'ইব্রাহিম আল-দোসারি',
  'Yassin Al-Jazaery': 'ইয়াসিন আল-জাজায়েরি',
  'Khalid Abdullah al-Qahtani': 'খালিদ আব্দুল্লাহ আল-কাহতানি',
  'Yasser Ad-Dussary': 'ইয়াসির আদ-দাওসারি',
  'Yasser Al-Dosari': 'ইয়াসির আদ-দাওসারি',
  'Nasser Al Qatami': 'নাসের আল-কাতামি',
  'Sahl Yassin': 'সাহল ইয়াসিন',
  'Aziz Alili': 'আজিজ আলিলি',
  'Yaser Salamah': 'ইয়াসির সালামাহ',
  'Akram Al Alaqimy': 'আকরাম আল-আলাকিমি',
  'Ali Jaber': 'আলী জাবের',
  'Fares Abbad': 'ফারেস আব্বাদ',
  'Ayman Sowaid': 'আইমান সুওয়াইদ',
  'Mohamed al-Tablawi': 'মুহাম্মদ আল-তাবলাবি',
};

export function getReciterNameLocalized(reciterName?: string, langCode: string = 'bn'): string {
  if (!reciterName) return langCode === 'bn' ? 'পবিত্র কুরআন তিলাওয়াত' : 'Noble Quran Recitation';
  if (langCode === 'bn') {
    const clean = reciterName.trim();
    if (BENGALI_RECITERS_MAP[clean]) {
      return BENGALI_RECITERS_MAP[clean];
    }
    for (const [key, bnName] of Object.entries(BENGALI_RECITERS_MAP)) {
      if (clean.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(clean.toLowerCase())) {
        return bnName;
      }
    }
  }
  return reciterName;
}

/**
 * Authentic Bengali meanings of all 114 Surahs
 */
export const BENGALI_SURAH_MEANINGS: Record<number, string> = {
  1: 'সূচনা / প্রস্তাবনা',
  2: 'গাভী',
  3: 'ইমরানের পরিবার',
  4: 'নারী',
  5: 'খাদ্য পরিবেশিত পাত্র',
  6: 'গৃহপালিত পশু',
  7: 'উঁচু স্থানসমূহ',
  8: 'যুদ্ধলব্ধ সম্পদ',
  9: 'অনুতাপ / তওবা',
  10: 'ইউনুস (আ.)',
  11: 'হূদ (আ.)',
  12: 'ইউসুফ (আ.)',
  13: 'বজ্রপাত / মেঘের গর্জন',
  14: 'ইব্রাহীম (আ.)',
  15: 'প্রস্তরময় পাহাড়',
  16: 'মৌমাছি',
  17: 'নৈশ ভ্রমণ / বনী ইসরাঈল',
  18: 'গুহা',
  19: 'মারইয়াম (আ.)',
  20: 'ত্বা-হা',
  21: 'নবীগণ',
  22: 'হজ্জ',
  23: 'মুমিনগণ',
  24: 'জ্যোতি / আলো',
  25: 'মানদণ্ড / সত্য-মিথ্যার পার্থক্যকারী',
  26: 'কবিগণ',
  27: 'পিঁপড়া',
  28: 'ঘটনা / কাহিনী',
  29: 'মাকড়সা',
  30: 'রোমবাসী',
  31: 'লুকমান',
  32: 'সিজদাহ',
  33: 'জোটবদ্ধ দল',
  34: 'সাবা জাতি',
  35: 'আদি স্রষ্টা',
  36: 'ইয়াসীন',
  37: 'সারিবদ্ধ দল',
  38: 'সাদ',
  39: 'দলসমূহ',
  40: 'ক্ষমাকারী',
  41: 'সুস্পষ্ট বিবরণ',
  42: 'পরামর্শ',
  43: 'স্বর্ণালংকার',
  44: 'ধোঁয়া',
  45: 'নতজানু',
  46: 'বালুর পাহাড়',
  47: 'মুহাম্মদ (সা.)',
  48: 'বিজয়',
  49: 'বাসগৃহসমূহ',
  50: 'ক্বাফ',
  51: 'বিক্ষিপ্তকারী বাতাস',
  52: 'তূর পর্বত',
  53: 'নক্ষত্র',
  54: 'চাঁদ',
  55: 'পরম দয়াময়',
  56: 'অনিবার্য ঘটনা',
  57: 'লোহা',
  58: 'বিতর্ককারিণী',
  59: 'নির্বাসন',
  60: 'পরীক্ষিতা নারী',
  61: 'কঠোর সারি',
  62: 'শুক্রবার / জুমুআহ',
  63: 'কপট বিশ্বাসী / মুনাফিকগণ',
  64: 'ক্ষতি-লাভ',
  65: 'তালাক',
  66: 'নিষিদ্ধকরণ',
  67: 'সার্বভৌম কর্তৃত্ব / রাজত্ব',
  68: 'কলম',
  69: 'অনিবার্য সত্য',
  70: 'উন্নয়নের সোপান',
  71: 'নূহ (আ.)',
  72: 'জিন জাতি',
  73: 'বস্ত্রাবৃত',
  74: 'পোশাক পরিহিত',
  75: 'কেয়ামত / পুনরুত্থান',
  76: 'মানবজাতি',
  77: 'প্রেরিত বাতাস',
  78: 'মহাসংবাদ',
  79: 'উৎপাটনকারী',
  80: 'ভ্রূকুটি করল',
  81: 'সূর্য অন্ধকারাচ্ছন্ন হওয়া',
  82: 'বিদীর্ণ হওয়া',
  83: 'প্রতারকগণ',
  84: 'খণ্ড-বিখণ্ড হওয়া',
  85: 'নক্ষত্রমণ্ডলী',
  86: 'রাতের আগমনকারী',
  87: 'সর্বোচ্চ',
  88: 'গ্রাসকারী বিপর্যয়',
  89: 'উষা / ভোর',
  90: 'নগরী',
  91: 'সূর্য',
  92: 'রাত',
  93: 'পূর্বাহ্ণ / সকালের আলো',
  94: 'বক্ষ প্রশস্তকরণ',
  95: 'ডুমুর',
  96: 'রক্তপিণ্ড',
  97: 'মর্যাদাপূর্ণ রাত / মহিমান্বিত কদর',
  98: 'সুস্পষ্ট প্রমাণ',
  99: 'ভূমিকম্প',
  100: 'অভিযানকারী অশ্ব',
  101: 'মহাবিপদ',
  102: 'প্রাচুর্যের প্রতিযোগিতা',
  103: 'সময় / মহাকাল',
  104: 'পরনিন্দাকারী',
  105: 'হাতি',
  106: 'কুরাইশ বংশ',
  107: 'ছোটখাটো সাহায্য',
  108: 'প্রাচুর্য / কাউসার',
  109: 'কাফেরগণ',
  110: 'সাহায্য',
  111: 'জ্বলন্ত অঙ্গার / লাহাব',
  112: 'একত্ববাদ / নিষ্ঠা',
  113: 'ঊষা / প্রভাত',
  114: 'মানবজাতি',
};

export function getSurahMeaningLocalized(surahNumber: number, langCode: string = 'bn'): string {
  if (langCode === 'bn') {
    return BENGALI_SURAH_MEANINGS[surahNumber] || '';
  }
  const meta = getSurahByNumber(surahNumber);
  return meta?.nameEnglish || '';
}

/**
 * Bengali translations for available translation book files
 */
export const BENGALI_TRANSLATION_BOOKS: Record<string, string> = {
  'Taisirul_Quran.json.txt': 'তাইসিরুল কুরআন',
  'Sheikh_Mujibur_Rahman.json.txt': 'শেখ মুজিবুর রহমান',
  'Dr._Abu_Bakr_Muhammad_Zakaria.json.txt': 'ড. আবু বকর মুহাম্মদ জাকারিয়া',
  'Fathul_Majid.json.txt': 'ফাতহুল মাজিদ',
  'Rawai_Al-bayan.json.txt': 'রওয়াই আল-বায়ান',
};

export function getTranslationBookNameLocalized(config: Partial<VideoTemplateConfig>, langCode: string = 'bn'): string {
  if (!config) return '';
  const file = config.showPrimaryTranslation !== false && config.primaryTranslationFile
    ? config.primaryTranslationFile
    : (config.primaryTranslationFile || '');

  if (langCode === 'bn' && BENGALI_TRANSLATION_BOOKS[file]) {
    return BENGALI_TRANSLATION_BOOKS[file];
  }
  return getTranslationBookName(config);
}

export function getRevelationTypeLocalized(type: 'Meccan' | 'Medinan', langCode: string = 'bn'): string {
  if (langCode === 'bn') {
    return type === 'Meccan' ? 'মাক্কী' : 'মাদানী';
  }
  return type;
}

/**
 * Phonetic Bengali names for all 39 reciters for high-converting YouTube thumbnails
 */
export const BENGALI_RECITER_NAME_MAP: Record<string, string> = {
  'Mishari Rashid Alafasy': 'মিশারি রাশিদ আল-আফাসি',
  'Abdul Basit Abdus Samad': 'আব্দুল বাসিত আব্দুস সামাদ',
  'Abdullah Basfar': 'আব্দুল্লাহ বাসফার',
  'Abdur-Rahman as-Sudais': 'আব্দুর রহমান আস-সুদাইস',
  'Abu Bakr al-Shatri': 'আবু বকর আল-শাত্রী',
  'Ahmed ibn Ali al-Ajamy': 'আহমদ ইবন আলী আল-আজমী',
  'Saad Al-Ghamdi': 'সাদ আল-গামদী',
  'Hani ar-Rifai': 'হানি আর-রিফাই',
  'Mahmoud Khalil Al-Husary': 'মাহমুদ খলিল আল-হুসারি',
  'Ali Al-Hudhaify': 'আলী আল-হুজাইফী',
  'Ibrahim Akhdar': 'ইব্রাহিম আখদার',
  'Maher Al Muaiqly': 'মাহের আল-মুয়াইক্বলী',
  'Mohamed Siddiq al-Minshawi': 'মুহাম্মদ সিদ্দিক আল-মিনশাবী',
  'Muhammad Ayyoub': 'মুহাম্মদ আইয়ুব',
  'Muhammad Jibreel': 'মুহাম্মদ জিবরীল',
  'Mustafa Ismail': 'মুস্তফা ইসমাইল',
  "Sa'ud ash-Shuraym": 'সউদ আশ-শুরাইম',
  'Salah Bukhatir': 'সালাহ বুখাতির',
  'Muhsin Al Qasim': 'মুহসিন আল-কাসিম',
  'Abdullah Awad Al-Juhani': 'আব্দুল্লাহ আওয়াদ আল-জুহানী',
  'Salah Al Budair': 'সালাহ আল-বুদাইর',
  'Abdullah Matroud': 'আব্দুল্লাহ মাত্রুদ',
  'Ahmed Nuaina': 'আহমদ নুয়াইনা',
  'Muhammad AbdulKareem': 'মুহাম্মদ আব্দুল কারীম',
  'Khalifa Al-Tunaiji': 'খলিফা আল-তুনাইজি',
  'Mahmoud Ali Al-Banna': 'মাহমুদ আলী আল-বান্না',
  'Ibrahim Al-Dosary': 'ইব্রাহিম আল-দোসারি',
  'Yassin Al-Jazaery': 'ইয়াসিন আল-জাযায়েরী',
  'Khalid Abdullah al-Qahtani': 'খালিদ আল-কাহতানী',
  'Yasser Ad-Dussary': 'ইয়াসির আদ-দাওসারী',
  'Nasser Al Qatami': 'নাসের আল-কাতামী',
  'Sahl Yassin': 'সাহল ইয়াসিন',
  'Aziz Alili': 'আজিজ আলিলী',
  'Yaser Salamah': 'ইয়াসির সালামাহ',
  'Akram Al Alaqimy': 'আকরাম আল-আলাকিমী',
  'Ali Jaber': 'আলী জাবের',
  'Fares Abbad': 'ফারেস আব্বাদ',
  'Ayman Sowaid': 'আয়মান সুওয়াইদ',
  'Mohamed al-Tablawi': 'মুহাম্মদ আত-তাবলাবী',
  // Popular references
  'Ahmad Al-Nufais': 'আহমদ আল নুফাইস',
  'Haitham Al-Dukhin': 'হাইছাম আল দুখাইন',
  'Omar Hisham Al Arabi': 'ওমর হিশাম আল আরাবি',
  'Muhammad Dibirov': 'মুহাম্মদ দিবিরভ',
};

export function getBengaliReciterName(name?: string): string {
  if (!name) return 'ক্বারী';
  if (BENGALI_RECITER_NAME_MAP[name]) return BENGALI_RECITER_NAME_MAP[name];
  const lower = name.toLowerCase();
  for (const [key, bn] of Object.entries(BENGALI_RECITER_NAME_MAP)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return bn;
    }
  }
  return name;
}

export function getBengaliSurahTitle(surahNumber: number, prefix: string = 'সূরা: '): string {
  const name = getSurahNameLocalized(surahNumber, 'bn');
  return `${prefix}${name}`;
}



