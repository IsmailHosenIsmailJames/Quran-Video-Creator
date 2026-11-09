import {
  VideoTemplateConfig,
  ReciterInfo,
  AyahSequenceData,
  SurahMeta,
  SalatJammatManifest,
  isSalatJammatManifest,
} from './types';
import { getSurahByNumber } from './surahs';
import {
  getLocalizedHeader,
  getTranslationBookName,
  getSurahNameLocalized,
  getReciterNameLocalized,
  getSurahMeaningLocalized,
  getTranslationBookNameLocalized,
  getRevelationTypeLocalized,
  toBengaliDigits,
} from './surah-localization';

export type SalatPrayerType = 'taraweeh' | 'tahajjud' | 'salat-jamaah' | 'jumuah' | 'general-salat';
export type SalatChapterMode = 'segments' | 'verses';
export type SalatImamTitle = 'imam' | 'qari' | 'imam-qari';

export interface YouTubeTimestampItem {
  frame: number;
  seconds: number;
  timeFormatted: string; // "MM:SS" or "HH:MM:SS"
  label: string;
  surah: number;
  ayah?: number;
  arabicSnippet?: string;
  translationSnippet?: string;
}

export interface YouTubeSeoKit {
  titles: {
    id: string;
    label: string;
    text: string;
  }[];
  selectedTitle: string;
  timestamps: YouTubeTimestampItem[];
  timestampsFormatted: string;
  description: string;
  tags: string[];
  tagsFormatted: string;
  hashtags: string[];
  hashtagsFormatted: string;
}

export interface YouTubeDescriptionOptions {
  language: 'bn' | 'en';
  mode: 'clean' | 'detailed';
  digitFormat: 'bengali' | 'english';
  includeHook: boolean;
  includeVirtues: boolean;
  includeTimestamps: boolean;
  includeSurahMeta: boolean;
  includeReciterCredits: boolean;
  includeTranslationCredits: boolean;
  includeCallToAction: boolean;
  includeHashtags: boolean;
  timestampFormat: 'compact' | 'with-arabic' | 'with-translation';
  customChannelName?: string;
  // Salat Jama'ah prayer specific options
  salatPrayerType?: SalatPrayerType;
  salatChapterMode?: SalatChapterMode;
  salatImamTitle?: SalatImamTitle;
}

export const DEFAULT_DESCRIPTION_OPTIONS: YouTubeDescriptionOptions = {
  language: 'bn',
  mode: 'clean',
  digitFormat: 'bengali',
  includeHook: false,
  includeVirtues: false,
  includeTimestamps: true,
  includeSurahMeta: true,
  includeReciterCredits: true,
  includeTranslationCredits: true,
  includeCallToAction: false,
  includeHashtags: true,
  timestampFormat: 'compact',
  customChannelName: undefined,
  salatPrayerType: 'taraweeh',
  salatChapterMode: 'segments',
  salatImamTitle: 'imam-qari',
};

/**
 * Authentic Hadith virtues for congregational and night prayers
 */
export const SALAT_PRAYER_HADITH_MAP: Record<
  SalatPrayerType,
  {
    virtueBn: string;
    virtueEn: string;
    hadithRef: string;
    benefitBn: string;
    benefitEn: string;
  }
> = {
  taraweeh: {
    virtueBn:
      'যে ব্যক্তি ঈমানের সাথে ও সওয়াবের আশায় রমজানের রাতে কিয়াম (তারাবীহ সালাত) আদায় করবে, তার অতীতের সমস্ত গুনাহ ক্ষমা করে দেওয়া হবে।',
    virtueEn:
      'Whoever stands in prayer during Ramadan with faith and seeking reward, all his previous sins will be forgiven.',
    hadithRef: 'সহীহ বুখারী ২০০৯ / Sahih al-Bukhari 2009',
    benefitBn: 'রমজানের পবিত্র বরকত, আত্মশুদ্ধি এবং আল্লাহর রহমত লাভ।',
    benefitEn: 'Blessings of Ramadan, spiritual purification, and divine mercy.',
  },
  tahajjud: {
    virtueBn:
      'ফরজ সালাতের পর সবচেয়ে উত্তম সালাত হলো রাতের সালাত (তাহাজ্জুদ)। রাতের শেষ তৃতীয়াংশে মহান আল্লাহ প্রথম আসমানে অবতরণ করে বান্দাদের দুআ কবুল করেন।',
    virtueEn:
      'The best prayer after the obligatory prayers is the night prayer (Tahajjud). In the final third of the night, Allah descends to the lowest heaven and answers supplications.',
    hadithRef: 'সহীহ মুসলিম ১১৬৩ / Sahih Muslim 1163',
    benefitBn: 'আত্মিক প্রশান্তি, আল্লাহর পরম নৈকট্য লাভ এবং দুআ কবুলের শ্রেষ্ঠ সুযোগ।',
    benefitEn: 'Inner tranquility, intimate closeness to Allah, and answered prayers.',
  },
  'salat-jamaah': {
    virtueBn: 'জামাতের সাথে সালাত একাকী সালাত আদায় করার চেয়ে সাতাশ গুণ বেশি মর্যাদাপূর্ণ ও সওয়াবপূর্ণ।',
    virtueEn: 'Prayer in congregation is twenty-seven times more rewarding than prayer offered alone.',
    hadithRef: 'সহীহ বুখারী ৬৪৫ / Sahih al-Bukhari 645',
    benefitBn: 'ভ্রাতৃত্ববোধ, ঐক্য এবং জামাতে সালাতের অপরিসীম মর্যাদা লাভ।',
    benefitEn: 'Unity, discipline, brotherhood, and a 27-fold spiritual multiplication.',
  },
  jumuah: {
    virtueBn:
      'সূর্য উদিত হওয়া দিনগুলোর মধ্যে শ্রেষ্ঠ দিন হলো জুমার দিন। এই দিনে আদম (আ.)-কে সৃষ্টি করা হয়েছে এবং এই দিনেই কিয়ামত সংঘটিত হবে।',
    virtueEn:
      'The best day on which the sun rises is Friday (Jumu\'ah). On it Adam was created, and on it the Day of Resurrection will occur.',
    hadithRef: 'সহীহ মুসলিম ৮৫৪ / Sahih Muslim 854',
    benefitBn: 'সাপ্তাহিক শ্রেষ্ঠ ইবাদত, পাপ মার্জনা এবং অন্তরের নূর লাভ।',
    benefitEn: 'Weekly pinnacle of worship, forgiveness, and illumination of heart.',
  },
  'general-salat': {
    virtueBn:
      'যে ব্যক্তি ইমামের সাথে সালাত সমাপ্ত হওয়া পর্যন্ত দাঁড়িয়ে সালাত আদায় করে, তার জন্য সারা রাত নফল সালাত আদায়ের সওয়াব লিপিবদ্ধ করা হয়।',
    virtueEn:
      'Whoever stands in prayer with the Imam until he finishes, it will be recorded for him as having prayed the entire night.',
    hadithRef: 'জামে তিরমিযী ৮০৬ / Jami` at-Tirmidhi 806',
    benefitBn: 'আল্লাহর প্রতি পরম আত্মসমর্পণ, একাগ্রতা এবং অনন্ত শান্তি।',
    benefitEn: 'Sublime surrender to Allah, devotion, and lasting spiritual peace.',
  },
};

export interface SalatParsedMetadata {
  isSalat: boolean;
  prayerType: SalatPrayerType;
  prayerNameBn: string;
  prayerNameEn: string;
  prayerNameAr: string;
  imamTitleBn: string;
  imamTitleEn: string;
  surahs: Array<{
    surahNumber: number;
    nameEn: string;
    nameBn: string;
    nameAr: string;
    fromAyah: number;
    toAyah: number;
    rakah: number;
    segmentLabel: string;
  }>;
  combinedSurahsBn: string;
  combinedSurahsEn: string;
  combinedSurahsAr: string;
  rakahsTextBn: string;
  rakahsTextEn: string;
}

/**
 * Extracts normalized metadata from a Salat Jama'ah prayer manifest
 */
export function extractSalatMetadata(
  manifest: any,
  options?: {
    salatPrayerType?: SalatPrayerType;
    salatImamTitle?: SalatImamTitle;
  }
): SalatParsedMetadata | null {
  if (!isSalatJammatManifest(manifest)) return null;

  const prayerType = options?.salatPrayerType || 'taraweeh';
  const imamTitle = options?.salatImamTitle || 'imam-qari';

  const prayerNames: Record<SalatPrayerType, { bn: string; en: string; ar: string }> = {
    taraweeh: { bn: 'তারাবীহ সালাত', en: 'Taraweeh Prayer', ar: 'صلاة التراويح' },
    tahajjud: { bn: 'তাহাজ্জুদ সালাত', en: 'Tahajjud Prayer', ar: 'صلاة التهجد' },
    'salat-jamaah': { bn: 'জামাত সালাত', en: 'Salat Jama\'ah', ar: 'صلاة الجماعة' },
    jumuah: { bn: 'জুমুআ সালাত', en: 'Jumu\'ah Prayer', ar: 'صلاة الجمعة' },
    'general-salat': { bn: 'সালাত তিলাওয়াত', en: 'Salat Recitation', ar: 'تلاوة الصلاة' },
  };

  const imamTitles: Record<SalatImamTitle, { bn: string; en: string }> = {
    imam: { bn: 'ইমাম', en: 'Imam' },
    qari: { bn: 'ক্বারী', en: 'Qari' },
    'imam-qari': { bn: 'ইমাম ও ক্বারী', en: 'Imam & Reciter' },
  };

  const segments = manifest.segments || [];
  const surahs = segments.map((seg, idx) => {
    const sMeta = getSurahByNumber(seg.surah_number);
    const nameBn = getSurahNameLocalized(seg.surah_number, 'bn');
    const nameEn = sMeta?.nameTransliterated || seg.surah_name_en || `Surah ${seg.surah_number}`;
    const nameAr = sMeta?.nameArabic || seg.surah_name_ar || '';

    // Determine rakah from segment label or sequential
    const rakahMatch = (seg.label || '').match(/rak['a]*h\s*(\d+)/i);
    const rakah = rakahMatch ? parseInt(rakahMatch[1], 10) : 1;

    return {
      surahNumber: seg.surah_number,
      nameEn,
      nameBn,
      nameAr,
      fromAyah: seg.start_ayah,
      toAyah: seg.end_ayah,
      rakah,
      segmentLabel: seg.label || `Segment ${idx + 1}`,
    };
  });

  // Extract distinct Surah names
  const uniqueSurahNumbers = Array.from(new Set(surahs.map((s) => s.surahNumber)));
  const uniqueSurahsBn = uniqueSurahNumbers.map((num) => `সূরা ${getSurahNameLocalized(num, 'bn')}`);
  const uniqueSurahsEn = uniqueSurahNumbers.map((num) => {
    const m = getSurahByNumber(num);
    return `Surah ${m?.nameTransliterated || num}`;
  });
  const uniqueSurahsAr = uniqueSurahNumbers.map((num) => {
    const m = getSurahByNumber(num);
    return m?.nameArabic || '';
  });

  const combinedSurahsBn =
    uniqueSurahsBn.length === 1
      ? uniqueSurahsBn[0]
      : uniqueSurahsBn.slice(0, -1).join(', ') + ' ও ' + uniqueSurahsBn[uniqueSurahsBn.length - 1];

  const combinedSurahsEn =
    uniqueSurahsEn.length === 1
      ? uniqueSurahsEn[0]
      : uniqueSurahsEn.slice(0, -1).join(', ') + ' & ' + uniqueSurahsEn[uniqueSurahsEn.length - 1];

  const combinedSurahsAr = uniqueSurahsAr.join(' و ');

  // Rakah info
  const uniqueRakahs = Array.from(new Set(surahs.map((s) => s.rakah)));
  let rakahsTextBn = 'রাকআত ১';
  let rakahsTextEn = "Rak'ah 1";
  if (uniqueRakahs.length > 1) {
    rakahsTextBn = `রাকআত ${uniqueRakahs.join(' ও ')}`;
    rakahsTextEn = `Rak'ah ${uniqueRakahs.join(' & ')}`;
  } else if (uniqueRakahs[0]) {
    rakahsTextBn = `রাকআত ${uniqueRakahs[0]}`;
    rakahsTextEn = `Rak'ah ${uniqueRakahs[0]}`;
  }

  return {
    isSalat: true,
    prayerType,
    prayerNameBn: prayerNames[prayerType]?.bn || 'তারাবীহ সালাত',
    prayerNameEn: prayerNames[prayerType]?.en || 'Taraweeh Prayer',
    prayerNameAr: prayerNames[prayerType]?.ar || 'صلاة التراويح',
    imamTitleBn: imamTitles[imamTitle]?.bn || 'ইমাম ও ক্বারী',
    imamTitleEn: imamTitles[imamTitle]?.en || 'Imam & Reciter',
    surahs,
    combinedSurahsBn,
    combinedSurahsEn,
    combinedSurahsAr,
    rakahsTextBn,
    rakahsTextEn,
  };
}

/**
 * Authentic virtues and themes for prominent Surahs
 */
export const SURAH_VIRTUES_MAP: Record<number, { virtue: string; hadithRef?: string; benefit: string }> = {
  1: {
    virtue: 'Surah Al-Fatihah (The Opening) is the greatest chapter in the Holy Quran, known as Umm al-Kitab (Mother of the Book) and Ash-Shifa (The Spiritual Cure).',
    hadithRef: 'Sahih al-Bukhari 5006',
    benefit: 'Spiritual healing, guidance in daily prayers, and divine connection.',
  },
  2: {
    virtue: 'Satan flees from the home in which Surah Al-Baqarah is recited. It contains Ayat al-Kursi, the greatest verse in the Quran.',
    hadithRef: 'Sahih Muslim 780',
    benefit: 'Divine protection from evil, peace in the household, and barakah.',
  },
  18: {
    virtue: 'Whoever recites Surah Al-Kahf on Friday will have a light that will shine for him from one Friday to the next, and will be protected from the trial of the Dajjal.',
    hadithRef: 'Sahih Muslim 809, Sunan al-Kubra',
    benefit: 'Protection from trials, spiritual illumination, and guidance in times of confusion.',
  },
  36: {
    virtue: 'Surah Ya-Sin is known as the Heart of the Quran, a source of peace, forgiveness of sins, and firm belief in resurrection.',
    hadithRef: 'Sunan al-Darimi',
    benefit: 'Comfort of the soul, forgiveness, and remembrance of the eternal life.',
  },
  55: {
    virtue: 'Surah Ar-Rahman (The Most Merciful) is the beauty of the Quran, repeatedly reminding humanity: "Which of the favors of your Lord will you deny?"',
    hadithRef: 'Sunan al-Bayhaqi',
    benefit: 'Gratitude, spiritual softness of heart, and contemplation of Allah’s infinite blessings.',
  },
  56: {
    virtue: 'Surah Al-Waqi\'ah (The Inevitable) is recited for protection against hardship and poverty, bringing reliance on Allah as the Ultimate Provider.',
    hadithRef: 'Ibn Kathir, Shu\'ab al-Iman',
    benefit: 'Sustenance, remembrance of the Day of Judgment, and spiritual abundance.',
  },
  67: {
    virtue: 'There is a Surah of thirty verses which will intercede for its reciter until he is forgiven: "Tabarak alladhi bi yadihi al-mulk" (Surah Al-Mulk). It is the protector from the torment of the grave.',
    hadithRef: 'Jami` at-Tirmidhi 2891, Sunan Abi Dawud 1400',
    benefit: 'Protection in the grave, intercession on the Day of Judgment, and peaceful sleep.',
  },
  76: {
    virtue: 'Surah Al-Insan describes the noble deeds of the righteous and paints an exquisite picture of Paradise, tranquility, and divine reward.',
    hadithRef: 'Sahih al-Bukhari',
    benefit: 'Patience, sincerity in charity, and deep longing for Paradise.',
  },
  112: {
    virtue: 'Surah Al-Ikhlas is equal to one-third of the Holy Quran in reward and reinforces pure Islamic monotheism (Tawhid).',
    hadithRef: 'Sahih al-Bukhari 5013',
    benefit: 'Love for Allah, protection, and tremendous reward in brief recitation.',
  },
  113: {
    virtue: 'Surah Al-Falaq is among the best words with which to seek refuge with Allah from the evil of darkness and envy.',
    hadithRef: 'Sahih Muslim 814',
    benefit: 'Protection from black magic, envy (hasad), and darkness.',
  },
  114: {
    virtue: 'Surah An-Nas seeks refuge with the Lord of mankind from the whispering of Satan and evil impulses.',
    hadithRef: 'Sahih Muslim 814',
    benefit: 'Relief from anxiety, obsessive thoughts (waswas), and evil whispers.',
  },
};

/**
 * Format total seconds into MM:SS or HH:MM:SS
 */
export function formatTimeCode(seconds: number): string {
  const totalSec = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Computes exact YouTube chapters/timestamps from the Remotion timeline
 */
export function calculateYouTubeTimestamps(
  config: VideoTemplateConfig,
  ayahs: AyahSequenceData[],
  options?: {
    language?: 'bn' | 'en';
    digitFormat?: 'bengali' | 'english';
    salatPrayerType?: SalatPrayerType;
    salatChapterMode?: SalatChapterMode;
  },
  customTimestamp?: any
): YouTubeTimestampItem[] {
  const fps = config.fps || 30;
  const items: YouTubeTimestampItem[] = [];
  const isBn = options?.language !== 'en';
  const useBnDigits = isBn && options?.digitFormat !== 'english';
  const isSalat = isSalatJammatManifest(customTimestamp);
  const salatMeta = isSalat ? extractSalatMetadata(customTimestamp, options) : null;
  const chapterMode = options?.salatChapterMode || 'segments';

  // 1. Intro Duration
  const isIntroActive = Boolean(
    config.enableIntroVideo &&
    (config.introMode === 'custom-video' ? config.introVideoPath : true) &&
    !(config.skipIntroForShorts !== false && config.aspectRatio === '9:16')
  );
  const introDurationInFrames = isIntroActive
    ? Math.max(1, Math.round((config.introVideoDurationSeconds || 4) * fps))
    : 0;

  // 2. Surah Title Card Duration
  const isTitleCardActive = Boolean(
    config.enableSurahTitleCard &&
    !(config.skipTitleCardForShorts !== false && config.aspectRatio === '9:16')
  );
  const titleCardDurationInFrames = isTitleCardActive
    ? Math.max(1, Math.round((config.titleCardDurationSeconds || 3.5) * fps))
    : 0;

  let currentFrame = 0;

  // Header / Intro Chapter (YouTube ALWAYS requires 00:00 as first chapter)
  if (introDurationInFrames > 0 || titleCardDurationInFrames > 0) {
    items.push({
      frame: 0,
      seconds: 0,
      timeFormatted: '00:00',
      label: isSalat
        ? isBn
          ? `${salatMeta?.prayerNameBn || 'সালাত'} ভূমিকা ও শিরোনাম`
          : `${salatMeta?.prayerNameEn || 'Salat'} Intro & Title`
        : isBn
        ? 'ভূমিকা'
        : 'Introduction & Title',
      surah: config.surahNumber,
    });
    currentFrame += introDurationInFrames + titleCardDurationInFrames;
  }

  if (isSalat && chapterMode === 'segments') {
    // -------------------------------------------------------------
    // SALAT SEGMENT CHAPTERS (High CTR Clean Chaptering)
    // -------------------------------------------------------------
    const seenSegments = new Set<number | string>();

    for (let i = 0; i < ayahs.length; i++) {
      const ayah = ayahs[i];
      const seconds = currentFrame / fps;
      const isStart = items.length === 0;
      const timeFormatted = isStart ? '00:00' : formatTimeCode(seconds);

      if (ayah.isInterstitial) {
        const isTail =
          ayah.segmentId === 'tail_ruku_sujood' ||
          (ayah.interstitialSubtitle && ayah.interstitialSubtitle.includes('رُكُوع'));
        if (isTail) {
          items.push({
            frame: currentFrame,
            seconds: isStart ? 0 : seconds,
            timeFormatted,
            label: isBn ? 'রুকু ও সিজদা (Ruku & Sujood)' : 'Ruku & Sujood Pause',
            surah: ayah.surah,
            arabicSnippet: ayah.interstitialSubtitle,
          });
        } else if (isStart) {
          items.push({
            frame: 0,
            seconds: 0,
            timeFormatted: '00:00',
            label: isBn
              ? `${salatMeta?.prayerNameBn || 'সালাত'} শুরু`
              : `${salatMeta?.prayerNameEn || 'Salat'} Begins`,
            surah: ayah.surah,
          });
        }
      } else {
        const segKey = ayah.segmentId !== undefined ? ayah.segmentId : `surah_${ayah.surah}`;
        if (!seenSegments.has(segKey)) {
          seenSegments.add(segKey);

          const segInfo = salatMeta?.surahs.find((s) => s.surahNumber === ayah.surah);
          const surahBn = getSurahNameLocalized(ayah.surah, 'bn');
          const surahMeta = getSurahByNumber(ayah.surah);
          const surahEn = surahMeta?.nameTransliterated || `Surah ${ayah.surah}`;

          let chapterLabel: string;
          if (isBn) {
            const formatNum = useBnDigits ? toBengaliDigits : (n: number | string) => String(n);
            const rangeStr = segInfo
              ? ` (আয়াত ${formatNum(segInfo.fromAyah)}-${formatNum(segInfo.toAyah)})`
              : '';
            chapterLabel = ayah.segmentLabel
              ? `${ayah.segmentLabel}${rangeStr}`
              : `সূরা ${surahBn}${rangeStr}`;
          } else {
            const rangeStr = segInfo ? ` (Verses ${segInfo.fromAyah}-${segInfo.toAyah})` : '';
            chapterLabel = ayah.segmentLabel
              ? `${ayah.segmentLabel}${rangeStr}`
              : `Surah ${surahEn}${rangeStr}`;
          }

          const arabicWords = (ayah.words || []).map((w) => w.text).join(' ');
          const arabicSnippet = arabicWords.length > 35 ? arabicWords.slice(0, 35) + '…' : arabicWords;
          const translationSnippet = ayah.primaryTranslation
            ? ayah.primaryTranslation.length > 50
              ? ayah.primaryTranslation.slice(0, 50) + '…'
              : ayah.primaryTranslation
            : undefined;

          items.push({
            frame: currentFrame,
            seconds: isStart ? 0 : seconds,
            timeFormatted,
            label: chapterLabel,
            surah: ayah.surah,
            ayah: ayah.ayah,
            arabicSnippet,
            translationSnippet,
          });
        }
      }

      currentFrame += ayah.durationInFrames || Math.round(5 * fps);
    }
  } else {
    // -------------------------------------------------------------
    // STANDARD / VERSE CHAPTERS
    // -------------------------------------------------------------
    for (let i = 0; i < ayahs.length; i++) {
      const ayah = ayahs[i];
      const seconds = currentFrame / fps;

      if (ayah.isInterstitial) {
        if (items.length === 0) {
          items.push({
            frame: 0,
            seconds: 0,
            timeFormatted: '00:00',
            label: isBn ? 'সালাত শুরু' : 'Prayer Begins',
            surah: ayah.surah,
          });
        } else if (ayah.segmentId === 'tail_ruku_sujood') {
          items.push({
            frame: currentFrame,
            seconds,
            timeFormatted: formatTimeCode(seconds),
            label: isBn ? 'রুকু ও সিজদা' : 'Ruku & Sujood',
            surah: ayah.surah,
          });
        }
        currentFrame += ayah.durationInFrames || Math.round(5 * fps);
        continue;
      }

      // First ayah starting at 00:00 if no intro
      const timeFormatted = items.length === 0 ? '00:00' : formatTimeCode(seconds);

      const arabicWords = (ayah.words || []).map((w) => w.text).join(' ');
      const arabicSnippet = arabicWords.length > 35 ? arabicWords.slice(0, 35) + '…' : arabicWords;
      const translationSnippet = ayah.primaryTranslation
        ? ayah.primaryTranslation.length > 50
          ? ayah.primaryTranslation.slice(0, 50) + '…'
          : ayah.primaryTranslation
        : undefined;

      let label: string;
      const surahBn = getSurahNameLocalized(ayah.surah, 'bn');
      const surahMeta = getSurahByNumber(ayah.surah);
      const surahEn = surahMeta?.nameTransliterated || `Surah ${ayah.surah}`;

      if (ayah.ayah === 0) {
        label = isSalat
          ? isBn
            ? `সূরা ${surahBn} - বিসমিল্লাহ`
            : `Surah ${surahEn} - Bismillah`
          : isBn
          ? 'বিসমিল্লাহ'
          : 'Bismillah';
      } else {
        const ayahNumStr = useBnDigits ? toBengaliDigits(ayah.ayah) : String(ayah.ayah);
        if (isSalat) {
          label = isBn
            ? `সূরা ${surahBn} - আয়াত ${ayahNumStr}`
            : `Surah ${surahEn} - Ayah ${ayah.ayah}`;
        } else {
          label = isBn ? `আয়াত ${ayahNumStr}` : `Ayah ${ayah.ayah}`;
        }
      }

      items.push({
        frame: currentFrame,
        seconds: items.length === 0 ? 0 : seconds,
        timeFormatted,
        label,
        surah: ayah.surah,
        ayah: ayah.ayah,
        arabicSnippet,
        translationSnippet,
      });

      currentFrame += ayah.durationInFrames || Math.round(5 * fps);
    }
  }

  // Outro Duration
  const isOutroActive = Boolean(
    config.enableOutroVideo &&
    (config.outroMode === 'custom-video' ? config.outroVideoPath : true) &&
    !(config.skipOutroForShorts !== false && config.aspectRatio === '9:16')
  );

  if (isOutroActive) {
    const outroSeconds = currentFrame / fps;
    items.push({
      frame: currentFrame,
      seconds: outroSeconds,
      timeFormatted: formatTimeCode(outroSeconds),
      label: isBn ? 'সাদাকাল্লাহুল আজিম ও সমাপ্তি' : 'Sadaqallahul Azeem & Outro',
      surah: config.surahNumber,
    });
  }

  // YouTube rule: First chapter MUST be 00:00
  if (items.length > 0 && items[0].timeFormatted !== '00:00') {
    items[0].timeFormatted = '00:00';
    items[0].seconds = 0;
    items[0].frame = 0;
  }

  return items;
}

/**
 * Formats timestamps into YouTube-ready chapter block
 */
export function formatTimestampsForYouTube(
  timestamps: YouTubeTimestampItem[],
  format: 'compact' | 'with-arabic' | 'with-translation' = 'compact'
): string {
  return timestamps
    .map((item) => {
      let line = `${item.timeFormatted} - ${item.label}`;
      if (format === 'with-arabic' && item.arabicSnippet) {
        line += ` (${item.arabicSnippet})`;
      } else if (format === 'with-translation' && item.translationSnippet) {
        line += ` • "${item.translationSnippet}"`;
      }
      return line;
    })
    .join('\n');
}

/**
 * Generates 5 high-converting, SEO-optimized title options
 */
export function generateYouTubeTitles(
  config: VideoTemplateConfig,
  reciterInfo?: ReciterInfo,
  options?: {
    language?: 'bn' | 'en';
    digitFormat?: 'bengali' | 'english';
    salatPrayerType?: SalatPrayerType;
    salatImamTitle?: SalatImamTitle;
  },
  customTimestamp?: any
): { id: string; label: string; text: string }[] {
  const isBn = options?.language !== 'en';
  const useBnDigits = isBn && options?.digitFormat !== 'english';
  const isSalat = isSalatJammatManifest(customTimestamp);
  const salatMeta = isSalat ? extractSalatMetadata(customTimestamp, options) : null;

  if (isSalat && salatMeta) {
    const reciterBn = getReciterNameLocalized(reciterInfo?.name, 'bn');
    const reciterName = reciterInfo?.name || 'Congregational Prayer';
    const reciterStyle = reciterInfo?.style ? ` (${reciterInfo.style})` : '';

    if (isBn) {
      return [
        {
          id: 'bn-salat-standard',
          label: '🕌 সালাত ও ইমাম তিলাওয়াত (Standard Prayer)',
          text: `[${salatMeta.prayerNameBn}] ${salatMeta.combinedSurahsBn} (${salatMeta.rakahsTextBn}) | ${salatMeta.imamTitleBn} ${reciterBn}`,
        },
        {
          id: 'bn-salat-soothing',
          label: '🎧 মন জুড়ানো সালাত তিলাওয়াত (Heart Soothing)',
          text: `মন জুড়ানো ${salatMeta.prayerNameBn} তিলাওয়াত | ${salatMeta.combinedSurahsBn} | ${reciterBn}`,
        },
        {
          id: 'bn-salat-pure-prayer',
          label: '🌙 পবিত্র নামাজ তিলাওয়াত (Pure Prayer)',
          text: `পবিত্র ${salatMeta.prayerNameBn} তিলাওয়াত - ${salatMeta.combinedSurahsBn} | ক্বারী ${reciterBn}`,
        },
        {
          id: 'bn-salat-bilingual',
          label: '📖 আরবি ও বাংলা দ্বৈত টাইটেল (Bilingual)',
          text: `سورة ${salatMeta.combinedSurahsAr} | ${salatMeta.prayerNameBn} (${salatMeta.rakahsTextBn}) | ${reciterBn}`,
        },
        {
          id: 'bn-salat-emotional',
          label: '✨ ক্রন্দনময় ও হৃদয় ছোঁয়া (Emotional / Tearful)',
          text: `হৃদয় ছোঁয়া ক্রন্দনময় সালাত তিলাওয়াত | ${salatMeta.combinedSurahsBn} | 4K UHD`,
        },
      ];
    }

    return [
      {
        id: 'en-salat-emotional',
        label: '🔥 Emotional & High CTR Prayer',
        text: `Emotional ${salatMeta.prayerNameEn} Recitation | ${salatMeta.combinedSurahsEn} (${salatMeta.rakahsTextEn}) | ${salatMeta.imamTitleEn} ${reciterName}`,
      },
      {
        id: 'en-salat-soothing',
        label: '✨ Heart Soothing & Peaceful',
        text: `Heart Soothing ${salatMeta.prayerNameEn} - ${salatMeta.combinedSurahsEn} | ${reciterName}${reciterStyle} ᴴᴰ`,
      },
      {
        id: 'en-salat-complete-4k',
        label: '⭐ High Ranking (Complete & 4K)',
        text: `${salatMeta.prayerNameEn} Recitation | ${salatMeta.combinedSurahsEn} (${salatMeta.rakahsTextEn}) | 4K UHD Quran`,
      },
      {
        id: 'en-salat-bilingual',
        label: '🌙 Bilingual (Arabic + English)',
        text: `سورة ${salatMeta.combinedSurahsAr} - Beautiful ${salatMeta.prayerNameEn} Recited by ${reciterName}`,
      },
      {
        id: 'en-salat-subtitles',
        label: '📖 Prayer with Subtitles',
        text: `Peaceful Congregational Salat Recitation with Subtitles [${salatMeta.combinedSurahsEn}] - ${reciterName}`,
      },
    ];
  }

  const surah = getSurahByNumber(config.surahNumber);
  const isFull = config.fromAyah === 1 && config.toAyah === surah.totalAyahs;

  if (isBn) {
    const surahBn = getSurahNameLocalized(config.surahNumber, 'bn');
    const reciterBn = getReciterNameLocalized(reciterInfo?.name, 'bn');
    const arabicName = surah.nameArabic;
    const formatNum = useBnDigits ? toBengaliDigits : (n: number | string) => String(n);
    const rangeText = isFull ? 'সম্পূর্ণ' : `আয়াত ${formatNum(config.fromAyah)}-${formatNum(config.toAyah)}`;
    const fullSurahText = isFull ? 'সম্পূর্ণ তিলাওয়াত' : `আয়াত ${formatNum(config.fromAyah)}-${formatNum(config.toAyah)}`;

    return [
      {
        id: 'bn-clean-standard',
        label: '✨ সাধারণ ও মার্জিত (Clean Standard)',
        text: `সূরা ${surahBn} - ${fullSurahText} | ${reciterBn}`,
      },
      {
        id: 'bn-with-translation',
        label: '📖 বাংলা অনুবাদসহ (With Translation)',
        text: `সূরা ${surahBn} (${rangeText}) বাংলা অনুবাদসহ | ${reciterBn}`,
      },
      {
        id: 'bn-pure-recitation',
        label: '🌙 পবিত্র কুরআন তিলাওয়াত (Tilawat)',
        text: `পবিত্র কুরআন তিলাওয়াত - সূরা ${surahBn} | ক্বারী ${reciterBn}`,
      },
      {
        id: 'bn-bilingual',
        label: '🕌 আরবি ও বাংলা দ্বৈত টাইটেল (Bilingual)',
        text: `سورة ${arabicName} | সূরা ${surahBn} (${rangeText}) | ${reciterBn}`,
      },
      {
        id: 'bn-soothing',
        label: '🎧 সুন্দর ও স্পষ্ট তিলাওয়াত (Soothing)',
        text: `সূরা ${surahBn} - মন জুড়ানো সুন্দর তিলাওয়াত | ${reciterBn}`,
      },
    ];
  }

  // English fallback titles
  const surahName = surah.nameTransliterated;
  const arabicName = surah.nameArabic;
  const reciterName = reciterInfo?.name || 'Holy Quran Recitation';
  const reciterStyle = reciterInfo?.style ? ` (${reciterInfo.style})` : '';
  const rangeText = isFull ? 'Full Surah' : `Ayah ${config.fromAyah}-${config.toAyah}`;
  const meaningText = surah.nameEnglish ? ` (${surah.nameEnglish})` : '';

  return [
    {
      id: 'high-ctr-sleep',
      label: '🔥 High-CTR (Night & Sleep)',
      text: `Surah ${surahName} Before Sleeping - Protection & Cure For Anxiety ᴴᴰ | ${reciterName}`,
    },
    {
      id: 'seo-complete-4k',
      label: '⭐ High Ranking (Complete & 4K)',
      text: `Surah ${surahName} (${rangeText}) | ${reciterName}${reciterStyle} | 4K UHD Quran Recitation`,
    },
    {
      id: 'heart-soothing',
      label: '✨ Heart Soothing & Emotional',
      text: `Heart Soothing Recitation of Surah ${surahName}${meaningText} | Feel The Majesty Of Quran`,
    },
    {
      id: 'bilingual-arabic',
      label: '🌙 Bilingual (Arabic + English)',
      text: `سورة ${arabicName} كاملة - Surah ${surahName} Full | Recited by ${reciterName}`,
    },
    {
      id: 'study-reflection',
      label: '📖 Study & Subtitles Focused',
      text: `Surah ${surahName} with English & Translation Subtitles [${rangeText}] - ${reciterName}`,
    },
  ];
}

/**
 * Generates complete YouTube Video Description
 */
export function generateYouTubeDescription(
  config: VideoTemplateConfig,
  ayahs: AyahSequenceData[],
  reciterInfo?: ReciterInfo,
  options: YouTubeDescriptionOptions = DEFAULT_DESCRIPTION_OPTIONS,
  customTimestamp?: any
): string {
  const isBn = options.language !== 'en';
  const useBnDigits = isBn && options.digitFormat !== 'english';
  const formatNum = useBnDigits ? toBengaliDigits : (n: number | string) => String(n);
  const isSalat = isSalatJammatManifest(customTimestamp);
  const salatMeta = isSalat ? extractSalatMetadata(customTimestamp, options) : null;

  if (isSalat && salatMeta) {
    const reciterBn = getReciterNameLocalized(reciterInfo?.name, 'bn');
    const reciterName = reciterInfo?.name || 'Congregational Prayer';
    const reciterStyle = reciterInfo?.style ? ` (${reciterInfo.style})` : '';
    const translationBookBn = getTranslationBookNameLocalized(config, 'bn') || 'বাংলা অনুবাদ';
    const translationBook = getTranslationBookName(config);
    const sections: string[] = [];

    if (isBn) {
      // -------------------------------------------------------------
      // BENGALI SALAT MODE
      // -------------------------------------------------------------
      if (options.mode === 'clean') {
        if (options.includeSurahMeta || options.includeReciterCredits || options.includeTranslationCredits) {
          let metaCard = `[${salatMeta.prayerNameBn} তিলাওয়াত]\n`;
          metaCard += `${salatMeta.imamTitleBn}: ${reciterBn}\n`;
          metaCard += `সালাতের ধরন: ${salatMeta.prayerNameBn} (${salatMeta.rakahsTextBn})\n`;
          metaCard += `পঠিত সূরাসমূহ:\n`;
          for (const s of salatMeta.surahs) {
            metaCard += `• ${s.segmentLabel}: সূরা ${s.nameBn} (আয়াত ${formatNum(s.fromAyah)}-${formatNum(s.toAyah)})\n`;
          }
          if (config.showPrimaryTranslation && translationBookBn) {
            metaCard += `অনুবাদ: ${translationBookBn}\n`;
          }
          sections.push(metaCard.trim());
        }

        if (options.includeTimestamps) {
          const timestamps = calculateYouTubeTimestamps(
            config,
            ayahs,
            {
              language: 'bn',
              digitFormat: options.digitFormat,
              salatPrayerType: options.salatPrayerType,
              salatChapterMode: options.salatChapterMode,
            },
            customTimestamp
          );
          const formatted = formatTimestampsForYouTube(timestamps, options.timestampFormat);
          sections.push(`সালাতের সময়সূচী / টাইমলাইন:\n${formatted}`);
        }

        if (options.includeHashtags) {
          const cleanPrayer = salatMeta.prayerNameBn.replace(/[\s-]/g, '_');
          const cleanReciter = reciterBn.replace(/[\s-]/g, '_');
          const surahTags = Array.from(
            new Set(salatMeta.surahs.map((s) => `#সূরা_${s.nameBn.replace(/[\s-]/g, '_')}`))
          );
          const tags = [
            `#${cleanPrayer}`,
            '#জামাত_সালাত',
            '#সালাত_তিলাওয়াত',
            ...surahTags,
            `#${cleanReciter}`,
            '#কুরআন_তিলাওয়াত',
            '#বাংলা_অনুবাদ',
            '#Taraweeh',
            '#SalatRecitation',
            '#Quran',
          ];
          sections.push(tags.join(' '));
        }

        return sections.join('\n\n');
      }

      // Detailed Bengali Mode for Salat:
      if (options.includeHook) {
        sections.push(
          `পবিত্র ${salatMeta.prayerNameBn}-এর মন জুড়ানো ও ভাবগম্ভীর তিলাওয়াত (${salatMeta.combinedSurahsBn})।\n` +
          `ঈমানের সাথে সালাত উপভোগ করুন, তিলাওয়াত নিয়ে চিন্তা করুন এবং আত্মার পরম শান্তি লাভ করুন।`
        );
      }

      if (options.includeVirtues) {
        const hadith = SALAT_PRAYER_HADITH_MAP[salatMeta.prayerType] || SALAT_PRAYER_HADITH_MAP['taraweeh'];
        let virtueText = `━━━━━━━━━━━━━━━━━━━━━━━━━\n✨ সালাত ও কিয়ামের ফজিলত ও মর্যাদা\n━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        virtueText += `${hadith.virtueBn}\n`;
        virtueText += `সূত্র: ${hadith.hadithRef}\n`;
        virtueText += `উপলব্ধি: ${hadith.benefitBn}`;
        sections.push(virtueText);
      }

      if (options.includeTimestamps) {
        const timestamps = calculateYouTubeTimestamps(
          config,
          ayahs,
          {
            language: 'bn',
            digitFormat: options.digitFormat,
            salatPrayerType: options.salatPrayerType,
            salatChapterMode: options.salatChapterMode,
          },
          customTimestamp
        );
        const formatted = formatTimestampsForYouTube(timestamps, options.timestampFormat);
        sections.push(
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n⏱️ সালাতের ভিডিও টাইমলাইন ও সূচী\n━━━━━━━━━━━━━━━━━━━━━━━━━\n${formatted}`
        );
      }

      if (options.includeSurahMeta) {
        let prayerInfo = `━━━━━━━━━━━━━━━━━━━━━━━━━\n🕌 সালাত ও পঠিত সূরার বিবরণ\n━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        prayerInfo += `• সালাতের ধরন: ${salatMeta.prayerNameBn}\n`;
        prayerInfo += `• রাকআত সংখ্যা: ${salatMeta.rakahsTextBn}\n`;
        prayerInfo += `• পঠিত সূরাসমূহ: ${salatMeta.combinedSurahsBn}\n`;
        for (const s of salatMeta.surahs) {
          prayerInfo += `  - ${s.segmentLabel}: সূরা ${s.nameBn} (আয়াত ${formatNum(s.fromAyah)} থেকে ${formatNum(s.toAyah)})\n`;
        }
        sections.push(prayerInfo.trim());
      }

      if (options.includeReciterCredits || options.includeTranslationCredits) {
        let credits = `━━━━━━━━━━━━━━━━━━━━━━━━━\n🎙️ ইমাম ও অনুবাদ ক্রেডিট\n━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        if (options.includeReciterCredits) {
          credits += `• ${salatMeta.imamTitleBn}: ${reciterBn}\n`;
        }
        if (options.includeTranslationCredits && translationBookBn) {
          credits += `• বাংলা অনুবাদ: ${translationBookBn}\n`;
        }
        credits += `• ভিডিও প্রযোজনা: 4K UHD কুরআন ভিডিও স্টুডিও`;
        sections.push(credits.trim());
      }

      if (options.includeCallToAction) {
        sections.push(
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n🤲 সদকায়ে জারিয়াহ ও সাপোর্ট\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `"তোমাদের মধ্যে সর্বোত্তম ব্যক্তি সে, যে কুরআন শিখে এবং অন্যকে শেখায়।" [সহীহ বুখারী ৫০২৭]\n\n` +
          `সালাতের এই নূর ও বরকতময় তিলাওয়াতটি অন্যদের সাথে শেয়ার করে সদকায়ে জারিয়াহর অংশীদার হোন।`
        );
      }

      if (options.includeHashtags) {
        const cleanPrayer = salatMeta.prayerNameBn.replace(/[\s-]/g, '_');
        const cleanReciter = reciterBn.replace(/[\s-]/g, '_');
        const surahTags = Array.from(
          new Set(salatMeta.surahs.map((s) => `#সূরা_${s.nameBn.replace(/[\s-]/g, '_')}`))
        );
        const tags = [
          `#${cleanPrayer}`,
          '#জামাত_সালাত',
          '#সালাত_তিলাওয়াত',
          ...surahTags,
          `#${cleanReciter}`,
          '#কুরআন_তিলাওয়াত',
          '#বাংলা_অনুবাদ',
          '#পবিত্র_কুরআন',
          '#TaraweehPrayer',
          '#SalatRecitation',
          '#Quran',
        ];
        sections.push(tags.join(' '));
      }

      return sections.join('\n\n');
    }

    // -------------------------------------------------------------
    // ENGLISH SALAT MODE
    // -------------------------------------------------------------
    if (options.mode === 'clean') {
      let cleanHeader = `[${salatMeta.prayerNameEn} Recitation]\n`;
      cleanHeader += `${salatMeta.imamTitleEn}: ${reciterName}${reciterStyle}\n`;
      cleanHeader += `Prayer: ${salatMeta.prayerNameEn} (${salatMeta.rakahsTextEn})\n`;
      cleanHeader += `Recited Surahs:\n`;
      for (const s of salatMeta.surahs) {
        cleanHeader += `• ${s.segmentLabel}: Surah ${s.nameEn} (Verses ${s.fromAyah}-${s.toAyah})\n`;
      }
      if (translationBook) {
        cleanHeader += `Translation: ${translationBook}\n`;
      }
      sections.push(cleanHeader.trim());

      if (options.includeTimestamps) {
        const timestamps = calculateYouTubeTimestamps(
          config,
          ayahs,
          {
            language: 'en',
            salatPrayerType: options.salatPrayerType,
            salatChapterMode: options.salatChapterMode,
          },
          customTimestamp
        );
        const formatted = formatTimestampsForYouTube(timestamps, options.timestampFormat);
        sections.push(`Prayer Chapters / Timestamps:\n${formatted}`);
      }

      if (options.includeHashtags) {
        const cleanPrayer = salatMeta.prayerNameEn.replace(/[^a-zA-Z0-9]/g, '');
        const cleanReciter = reciterName.replace(/[^a-zA-Z0-9]/g, '');
        const surahTags = Array.from(
          new Set(salatMeta.surahs.map((s) => `#Surah${s.nameEn.replace(/[^a-zA-Z0-9]/g, '')}`))
        );
        sections.push(
          `#${cleanPrayer} #SalatRecitation #SalatJamaah ${surahTags.join(' ')} #${cleanReciter} #Quran #Islam`
        );
      }

      return sections.join('\n\n');
    }

    // Detailed English Mode for Salat
    if (options.includeHook) {
      sections.push(
        `Heart soothing and peaceful congregational recitation from ${salatMeta.prayerNameEn} (${salatMeta.combinedSurahsEn}).\n` +
        `Listen with presence of heart, reflect on the divine meanings, and find serenity in the words of Allah.`
      );
    }

    if (options.includeVirtues) {
      const hadith = SALAT_PRAYER_HADITH_MAP[salatMeta.prayerType] || SALAT_PRAYER_HADITH_MAP['taraweeh'];
      let virtueText = `━━━━━━━━━━━━━━━━━━━━━━━━━\n✨ VIRTUES OF PRAYER & NIGHT WORSHIP\n━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      virtueText += `${hadith.virtueEn}\n`;
      virtueText += `📚 Source: ${hadith.hadithRef}\n`;
      virtueText += `💡 Reflection: ${hadith.benefitEn}`;
      sections.push(virtueText);
    }

    if (options.includeTimestamps) {
      const timestamps = calculateYouTubeTimestamps(
        config,
        ayahs,
        {
          language: 'en',
          salatPrayerType: options.salatPrayerType,
          salatChapterMode: options.salatChapterMode,
        },
        customTimestamp
      );
      const formatted = formatTimestampsForYouTube(timestamps, options.timestampFormat);
      sections.push(
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n⏱️ PRAYER CHAPTERS / TIMESTAMPS\n━━━━━━━━━━━━━━━━━━━━━━━━━\n${formatted}`
      );
    }

    if (options.includeSurahMeta) {
      let prayerInfo = `━━━━━━━━━━━━━━━━━━━━━━━━━\n📖 PRAYER & SURAH INFORMATION\n━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      prayerInfo += `• Prayer: ${salatMeta.prayerNameEn}\n`;
      prayerInfo += `• Rak'ah: ${salatMeta.rakahsTextEn}\n`;
      prayerInfo += `• Recited Surahs: ${salatMeta.combinedSurahsEn}\n`;
      for (const s of salatMeta.surahs) {
        prayerInfo += `  - ${s.segmentLabel}: Surah ${s.nameEn} (Verses ${s.fromAyah} to ${s.toAyah})\n`;
      }
      sections.push(prayerInfo.trim());
    }

    if (options.includeReciterCredits || options.includeTranslationCredits) {
      let credits = `━━━━━━━━━━━━━━━━━━━━━━━━━\n🎙️ IMAM & TRANSLATION CREDITS\n━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      if (options.includeReciterCredits) {
        credits += `• ${salatMeta.imamTitleEn}: ${reciterName}${reciterStyle}\n`;
      }
      if (options.includeTranslationCredits && translationBook) {
        credits += `• Primary Translation: ${translationBook} (${config.primaryTranslationLang})\n`;
        if (config.showSecondaryTranslation) {
          credits += `• Secondary Translation: ${config.secondaryTranslationFile} (${config.secondaryTranslationLang})\n`;
        }
      }
      credits += `• Video Production: Produced in 4K UHD via Quran Video Studio`;
      sections.push(credits);
    }

    if (options.includeCallToAction) {
      sections.push(
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n🤲 SADAQAH JARIYAH & SUPPORT\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `"The best of you are those who learn the Quran and teach it." [Sahih al-Bukhari 5027]\n\n` +
        `🔔 Subscribe to our channel and turn on notifications for more uplifting prayer recitations.\n` +
        `👍 Please like and share this video with family and friends — sharing sacred recitation is a perpetual charity.`
      );
    }

    if (options.includeHashtags) {
      const cleanPrayer = salatMeta.prayerNameEn.replace(/[^a-zA-Z0-9]/g, '');
      const cleanReciter = reciterName.replace(/[^a-zA-Z0-9]/g, '');
      const surahTags = Array.from(
        new Set(salatMeta.surahs.map((s) => `#Surah${s.nameEn.replace(/[^a-zA-Z0-9]/g, '')}`))
      );
      const tags = [
        `#${cleanPrayer}`,
        '#SalatRecitation',
        '#TaraweehPrayer',
        '#TahajjudPrayer',
        ...surahTags,
        `#${cleanReciter}`,
        '#HolyQuran',
        '#Islam',
        '#4KUHD',
      ];
      sections.push(tags.join(' '));
    }

    return sections.join('\n\n');
  }

  const surah = getSurahByNumber(config.surahNumber);
  const isFull = config.fromAyah === 1 && config.toAyah === surah.totalAyahs;

  if (isBn) {
    const surahBn = getSurahNameLocalized(config.surahNumber, 'bn');
    const arabicName = surah.nameArabic;
    const meaningBn = getSurahMeaningLocalized(config.surahNumber, 'bn');
    const meaningText = meaningBn ? ` (${meaningBn})` : '';
    const reciterBn = getReciterNameLocalized(reciterInfo?.name, 'bn');
    const revelationBn = getRevelationTypeLocalized(surah.revelationType, 'bn');
    const translationBookBn = getTranslationBookNameLocalized(config, 'bn') || 'বাংলা অনুবাদ';
    const rangeText = isFull
      ? `সম্পূর্ণ সূরা (${formatNum(surah.totalAyahs)} আয়াত)`
      : `আয়াত ${formatNum(config.fromAyah)} থেকে ${formatNum(config.toAyah)}`;

    const sections: string[] = [];

    // Mode: CLEAN (No fluff, no extra talk, simple & dignified)
    if (options.mode === 'clean') {
      // 1. Core Header
      if (options.includeSurahMeta || options.includeReciterCredits || options.includeTranslationCredits) {
        let metaCard = `সূরা ${surahBn}${meaningText}\n`;
        metaCard += `ক্বারী: ${reciterBn}\n`;
        metaCard += `আয়াত সংখ্যা: ${formatNum(surah.totalAyahs)} | অবস্থান: ${revelationBn}\n`;
        if (config.showPrimaryTranslation && translationBookBn) {
          metaCard += `অনুবাদ: ${translationBookBn}\n`;
        }
        if (!isFull) {
          metaCard += `পঠিত অংশ: ${rangeText}\n`;
        }
        sections.push(metaCard.trim());
      }

      // 2. Timestamps / Chapters
      if (options.includeTimestamps) {
        const timestamps = calculateYouTubeTimestamps(config, ayahs, {
          language: 'bn',
          digitFormat: options.digitFormat,
        });
        const formatted = formatTimestampsForYouTube(timestamps, options.timestampFormat);
        sections.push(`সময়সূচী / টাইমলাইন:\n${formatted}`);
      }

      // 3. Relevant Clean Hashtags
      if (options.includeHashtags) {
        const cleanSurah = surahBn.replace(/[\s-]/g, '_');
        const cleanReciter = reciterBn.replace(/[\s-]/g, '_');
        const tags = [
          `#সূরা_${cleanSurah}`,
          `#${cleanReciter}`,
          '#কুরআন_তিলাওয়াত',
          '#বাংলা_অনুবাদ',
          '#Quran',
          '#Tilawat',
        ];
        sections.push(tags.join(' '));
      }

      return sections.join('\n\n');
    }

    // Mode: DETAILED (Optional extended mode with Hadith & Call to Action if user enables them)
    // 1. Hook / Intro
    if (options.includeHook) {
      sections.push(
        `পবিত্র কুরআনের সূরা ${surahBn} (سورة ${arabicName})${meaningText}-এর সুন্দর ও নির্ভুল তিলাওয়াত (${rangeText})।`
      );
    }

    // 2. Surah Virtues & Hadith (if requested)
    if (options.includeVirtues) {
      const virtueInfo = SURAH_VIRTUES_MAP[config.surahNumber];
      if (virtueInfo) {
        let virtueText = `সূরা ${surahBn}-এর ফজিলত ও গুরুত্ব:\n`;
        virtueText += `${virtueInfo.virtue}\n`;
        if (virtueInfo.hadithRef) {
          virtueText += `সূত্র: ${virtueInfo.hadithRef}\n`;
        }
        sections.push(virtueText.trim());
      }
    }

    // 3. Timestamps
    if (options.includeTimestamps) {
      const timestamps = calculateYouTubeTimestamps(config, ayahs, {
        language: 'bn',
        digitFormat: options.digitFormat,
      });
      const formatted = formatTimestampsForYouTube(timestamps, options.timestampFormat);
      sections.push(`ভিডিও টাইমলাইন:\n${formatted}`);
    }

    // 4. Detailed Meta Card
    if (options.includeSurahMeta) {
      sections.push(
        `সূরার পরিচিতি:\n` +
        `• সূরা নম্বর: ${formatNum(surah.number)}\n` +
        `• নাম: সূরা ${surahBn} (سورة ${arabicName})\n` +
        `• অর্থ: "${meaningBn || surah.nameEnglish}"\n` +
        `• আয়াত সংখ্যা: ${formatNum(surah.totalAyahs)}\n` +
        `• অবতীর্ণ: ${revelationBn} সূরা\n` +
        `• তিলাওয়াতকৃত অংশ: ${rangeText}`
      );
    }

    // 5. Credits
    if (options.includeReciterCredits || options.includeTranslationCredits) {
      let credits = `কৃতজ্ঞতা ও তথ্য:\n`;
      if (options.includeReciterCredits) {
        credits += `• ক্বারী: ${reciterBn}\n`;
      }
      if (options.includeTranslationCredits && translationBookBn) {
        credits += `• বাংলা অনুবাদ: ${translationBookBn}\n`;
      }
      sections.push(credits.trim());
    }

    // 6. Call to Action (if explicitly requested)
    if (options.includeCallToAction) {
      sections.push(
        `"তোমাদের মধ্যে সর্বোত্তম ব্যক্তি সে, যে কুরআন শিখে এবং অন্যকে শেখায়।" [সহীহ বুখারী ৫০২৭]\n` +
        `ভিডিওটি ভালো লাগলে লাইক ও শেয়ার করে সদকায়ে জারিয়াহর অংশীদার হোন।`
      );
    }

    // 7. Hashtags
    if (options.includeHashtags) {
      const cleanSurah = surahBn.replace(/[\s-]/g, '_');
      const cleanReciter = reciterBn.replace(/[\s-]/g, '_');
      const tags = [
        `#সূরা_${cleanSurah}`,
        `#${cleanReciter}`,
        '#কুরআন_তিলাওয়াত',
        '#বাংলা_অনুবাদ',
        '#পবিত্র_কুরআন',
        '#Quran',
        '#QuranRecitation',
      ];
      sections.push(tags.join(' '));
    }

    return sections.join('\n\n');
  }

  // ENGLISH MODE (Existing logic preserved with English options)
  const surahName = surah.nameTransliterated;
  const arabicName = surah.nameArabic;
  const reciterName = reciterInfo?.name || 'Noble Quran Recitation';
  const reciterStyle = reciterInfo?.style ? ` (${reciterInfo.style})` : '';
  const translationBook = getTranslationBookName(config);
  const rangeText = isFull ? `Full Surah (${surah.totalAyahs} Verses)` : `Verses ${config.fromAyah} to ${config.toAyah}`;

  const sections: string[] = [];

  if (options.mode === 'clean') {
    let cleanHeader = `Surah ${surahName} (سورة ${arabicName})\n`;
    cleanHeader += `Reciter: ${reciterName}${reciterStyle}\n`;
    cleanHeader += `Verses: ${surah.totalAyahs} | Revelation: ${surah.revelationType}\n`;
    if (translationBook) {
      cleanHeader += `Translation: ${translationBook}\n`;
    }
    if (!isFull) {
      cleanHeader += `Recited: ${rangeText}\n`;
    }
    sections.push(cleanHeader.trim());

    if (options.includeTimestamps) {
      const timestamps = calculateYouTubeTimestamps(config, ayahs, { language: 'en' });
      const formatted = formatTimestampsForYouTube(timestamps, options.timestampFormat);
      sections.push(`Video Chapters / Timestamps:\n${formatted}`);
    }

    if (options.includeHashtags) {
      const cleanSurah = surahName.replace(/[^a-zA-Z0-9]/g, '');
      const cleanReciter = reciterName.replace(/[^a-zA-Z0-9]/g, '');
      sections.push(`#Surah${cleanSurah} #${cleanReciter} #Quran #QuranRecitation #Islam`);
    }

    return sections.join('\n\n');
  }

  // Detailed English mode:
  if (options.includeHook) {
    sections.push(
      `Heart soothing and peaceful recitation of Surah ${surahName} (سورة ${arabicName}) - ${rangeText}.\n` +
      `Listen with presence of heart, reflect on the divine meanings, and find peace of soul and mind.`
    );
  }

  if (options.includeVirtues) {
    const virtueInfo = SURAH_VIRTUES_MAP[config.surahNumber];
    if (virtueInfo) {
      let virtueText = `━━━━━━━━━━━━━━━━━━━━━━━━━\n✨ VIRTUES & BENEFITS OF SURAH ${surahName.toUpperCase()}\n━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      virtueText += `${virtueInfo.virtue}\n`;
      if (virtueInfo.hadithRef) {
        virtueText += `📚 Source: ${virtueInfo.hadithRef}\n`;
      }
      virtueText += `💡 Reflection: ${virtueInfo.benefit}`;
      sections.push(virtueText);
    }
  }

  if (options.includeTimestamps) {
    const timestamps = calculateYouTubeTimestamps(config, ayahs, { language: 'en' });
    const formatted = formatTimestampsForYouTube(timestamps, options.timestampFormat);
    sections.push(
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n⏱️ VIDEO CHAPTERS / TIMESTAMPS\n━━━━━━━━━━━━━━━━━━━━━━━━━\n${formatted}`
    );
  }

  if (options.includeSurahMeta) {
    sections.push(
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n📖 SURAH INFORMATION\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• Surah Number: ${surah.number}\n` +
      `• Arabic Name: سُورَةُ ${arabicName}\n` +
      `• Transliteration: Surah ${surahName}\n` +
      `• English Meaning: "${surah.nameEnglish}"\n` +
      `• Total Verses: ${surah.totalAyahs}\n` +
      `• Revelation: ${surah.revelationType} Surah\n` +
      `• Recited Verses: ${rangeText}`
    );
  }

  if (options.includeReciterCredits || options.includeTranslationCredits) {
    let credits = `━━━━━━━━━━━━━━━━━━━━━━━━━\n🎙️ AUDIO & TRANSLATION CREDITS\n━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    if (options.includeReciterCredits) {
      credits += `• Reciter: ${reciterName}${reciterStyle}\n`;
    }
    if (options.includeTranslationCredits && translationBook) {
      credits += `• Primary Translation: ${translationBook} (${config.primaryTranslationLang})\n`;
      if (config.showSecondaryTranslation) {
        credits += `• Secondary Translation: ${config.secondaryTranslationFile} (${config.secondaryTranslationLang})\n`;
      }
    }
    credits += `• Video Production: Produced in 4K UHD via Quran Video Studio`;
    sections.push(credits);
  }

  if (options.includeCallToAction) {
    sections.push(
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n🤲 SADAQAH JARIYAH & SUPPORT\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `"The best of you are those who learn the Quran and teach it." [Sahih al-Bukhari 5027]\n\n` +
      `🔔 Subscribe to our channel and turn on all notifications so you never miss a recitation.\n` +
      `👍 Please like and share this video with family and friends — sharing sacred knowledge is a perpetual charity (Sadaqah Jariyah).\n` +
      `🎧 Use headphones for optimal immersion and high-definition audio.`
    );
  }

  if (options.includeHashtags) {
    const cleanSurah = surahName.replace(/[^a-zA-Z0-9]/g, '');
    const cleanReciter = reciterName.replace(/[^a-zA-Z0-9]/g, '');
    const tags = [
      `#Surah${cleanSurah}`,
      '#Quran',
      '#QuranRecitation',
      `#${cleanReciter}`,
      '#HeartSoothing',
      '#PeacefulQuran',
      '#HolyQuran',
      '#Islam',
      '#4KUHD',
    ];
    sections.push(tags.join(' '));
  }

  return sections.join('\n\n');
}

/**
 * Generates comma-separated YouTube tags under 500 characters
 */
export function generateYouTubeTags(
  config: VideoTemplateConfig,
  reciterInfo?: ReciterInfo,
  options?: {
    language?: 'bn' | 'en';
    salatPrayerType?: SalatPrayerType;
    salatImamTitle?: SalatImamTitle;
  },
  customTimestamp?: any
): string[] {
  const isBn = options?.language !== 'en';
  const isSalat = isSalatJammatManifest(customTimestamp);
  const salatMeta = isSalat ? extractSalatMetadata(customTimestamp, options) : null;
  const surah = getSurahByNumber(config.surahNumber);
  const arabicName = surah.nameArabic;
  const surahName = surah.nameTransliterated;

  let baseTags: string[];
  if (isSalat && salatMeta) {
    if (isBn) {
      const reciterBn = getReciterNameLocalized(reciterInfo?.name, 'bn');
      const reciterEn = reciterInfo?.name || 'Quran';
      const prayerBn = salatMeta.prayerNameBn;
      const prayerEn = salatMeta.prayerNameEn;

      const surahTags: string[] = [];
      for (const s of salatMeta.surahs) {
        surahTags.push(`সূরা ${s.nameBn}`, `সূরা ${s.nameBn} তিলাওয়াত`, `Surah ${s.nameEn}`);
      }

      baseTags = [
        prayerBn,
        `${prayerBn} তিলাওয়াত`,
        'জামাত সালাত',
        'তারাবীহ সালাত',
        'তাহাজ্জুদ সালাত',
        'সালাত তিলাওয়াত',
        'নামাজ তিলাওয়াত',
        ...surahTags,
        reciterBn,
        `ইমাম ${reciterBn}`,
        `${reciterBn} ${prayerBn}`,
        `${reciterEn} ${prayerEn}`,
        'পবিত্র কুরআন তিলাওয়াত',
        'কুরআন মাজীদ',
        'বাংলা অনুবাদসহ কুরআন',
        'Taraweeh Prayer',
        'Salat Recitation',
        'Salat Jamaah',
        'Imam Recitation',
        'Heart Soothing Quran',
        'Quran',
        'Islam',
      ];
    } else {
      const reciterName = reciterInfo?.name || 'Quran';
      const prayerEn = salatMeta.prayerNameEn;

      const surahTags: string[] = [];
      for (const s of salatMeta.surahs) {
        surahTags.push(`Surah ${s.nameEn}`, `Surah ${s.nameEn} Recitation`);
      }

      baseTags = [
        prayerEn,
        `${prayerEn} Recitation`,
        'Salat Recitation',
        'Salat Jamaah',
        'Taraweeh Prayer',
        'Tahajjud Prayer',
        'Imam Recitation',
        ...surahTags,
        reciterName,
        `Imam ${reciterName}`,
        `${reciterName} ${prayerEn}`,
        'Holy Quran Recitation',
        'Peaceful Prayer',
        'Heart Soothing Recitation',
        'Quran with Subtitles',
        'Islam',
        '4K UHD Quran',
      ];
    }
  } else if (isBn) {
    const surahBn = getSurahNameLocalized(config.surahNumber, 'bn');
    const reciterBn = getReciterNameLocalized(reciterInfo?.name, 'bn');
    const reciterEn = reciterInfo?.name || 'Quran';

    baseTags = [
      `সূরা ${surahBn}`,
      `সূরা ${surahBn} সম্পূর্ণ`,
      `সূরা ${surahBn} বাংলা অনুবাদ`,
      `সূরা ${surahBn} তিলাওয়াত`,
      `سورة ${arabicName}`,
      `Surah ${surahName}`,
      `Surah ${surahName} Full`,
      reciterBn,
      `${reciterBn} কুরআন তিলাওয়াত`,
      `${reciterBn} সূরা ${surahBn}`,
      `${reciterEn} Quran`,
      'পবিত্র কুরআন তিলাওয়াত',
      'কুরআন মাজীদ',
      'বাংলা অনুবাদসহ কুরআন',
      'কুরআন তিলাওয়াত',
      'সূরা',
      'Quran Tilawat',
      'Quran Recitation',
      'Heart Soothing Quran',
      'Beautiful Quran Recitation',
      'Quran',
      'Islam',
      'Full Surah',
    ];
  } else {
    const reciterName = reciterInfo?.name || 'Quran';
    baseTags = [
      `Surah ${surahName}`,
      `Surah ${surahName} Full`,
      `Surah ${surahName} 4k`,
      `Surah ${surahName} with subtitles`,
      `Surah ${surahName} English`,
      `سورة ${arabicName}`,
      reciterName,
      `${reciterName} Surah ${surahName}`,
      `${reciterName} Quran`,
      'Quran Recitation',
      'Heart Soothing Quran',
      'Beautiful Quran Recitation',
      'Quran before sleeping',
      'Holy Quran 4k',
      'Quran with English translation',
      'Peaceful Quran recitation',
      'Islam',
      'Full Surah',
      'Quran tilawat',
      'Cure for anxiety',
    ];
  }

  // Filter to fit comfortably within YouTube's 500 character limit
  const finalTags: string[] = [];
  let currentLength = 0;

  for (const tag of baseTags) {
    const addedLen = tag.length + 2; // tag + comma and space
    if (currentLength + addedLen <= 485) {
      finalTags.push(tag);
      currentLength += addedLen;
    }
  }

  return finalTags;
}

/**
 * Exports complete metadata kit as formatted text for saving as .txt
 */
export function formatFullYouTubeKitText(
  config: VideoTemplateConfig,
  ayahs: AyahSequenceData[],
  reciterInfo?: ReciterInfo,
  selectedTitle?: string,
  options: YouTubeDescriptionOptions = DEFAULT_DESCRIPTION_OPTIONS,
  customTimestamp?: any
): string {
  const titles = generateYouTubeTitles(
    config,
    reciterInfo,
    {
      language: options.language,
      digitFormat: options.digitFormat,
      salatPrayerType: options.salatPrayerType,
      salatImamTitle: options.salatImamTitle,
    },
    customTimestamp
  );
  const activeTitle = selectedTitle || titles[0].text;
  const description = generateYouTubeDescription(config, ayahs, reciterInfo, options, customTimestamp);
  const tags = generateYouTubeTags(
    config,
    reciterInfo,
    {
      language: options.language,
      salatPrayerType: options.salatPrayerType,
      salatImamTitle: options.salatImamTitle,
    },
    customTimestamp
  );
  const isBn = options.language !== 'en';

  if (isBn) {
    return (
      `================================================================================\n` +
      `কুরআন ভিডিও স্টুডিও - ইউটিউব টাইটেল ও ডেসক্রিপশন কিট (বাংলা)\n` +
      `তারিখ: ${new Date().toLocaleString()}\n` +
      `================================================================================\n\n` +
      `[১] নির্বাচিত ভিডিও টাইটেল (Video Title):\n` +
      `--------------------------------------------------------------------------------\n` +
      `${activeTitle}\n\n` +
      `বিকল্প টাইটেলসমূহ (Alternative Titles):\n` +
      titles.map((t) => `• [${t.label}]: ${t.text}`).join('\n') +
      `\n\n` +
      `================================================================================\n` +
      `[২] সম্পূর্ণ ইউটিউব ডেসক্রিপশন (Video Description):\n` +
      `--------------------------------------------------------------------------------\n` +
      `${description}\n\n` +
      `================================================================================\n` +
      `[৩] ইউটিউব ট্যাগসমূহ (YouTube Tags):\n` +
      `--------------------------------------------------------------------------------\n` +
      `${tags.join(', ')}\n\n` +
      `মোট ট্যাগ অক্ষর: ${tags.join(', ').length} / ৫০০\n` +
      `================================================================================\n`
    );
  }

  return (
    `================================================================================\n` +
    `QURAN VIDEO STUDIO - YOUTUBE METADATA & SEO KIT\n` +
    `Generated on: ${new Date().toLocaleString()}\n` +
    `================================================================================\n\n` +
    `[1] RECOMMENDED VIDEO TITLE:\n` +
    `--------------------------------------------------------------------------------\n` +
    `${activeTitle}\n\n` +
    `ALTERNATIVE TITLE OPTIONS:\n` +
    titles.map((t) => `• [${t.label}]: ${t.text}`).join('\n') +
    `\n\n` +
    `================================================================================\n` +
    `[2] COMPLETE YOUTUBE VIDEO DESCRIPTION:\n` +
    `--------------------------------------------------------------------------------\n` +
    `${description}\n\n` +
    `================================================================================\n` +
    `[3] YOUTUBE VIDEO TAGS (Paste into YouTube Studio Tags box):\n` +
    `--------------------------------------------------------------------------------\n` +
    `${tags.join(', ')}\n\n` +
    `Total Tag Characters: ${tags.join(', ').length} / 500\n` +
    `================================================================================\n`
  );
}
