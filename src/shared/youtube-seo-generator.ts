import { VideoTemplateConfig, ReciterInfo, AyahSequenceData, SurahMeta } from './types';
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
};

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
  options?: { language?: 'bn' | 'en'; digitFormat?: 'bengali' | 'english' }
): YouTubeTimestampItem[] {
  const fps = config.fps || 30;
  const items: YouTubeTimestampItem[] = [];
  const isBn = options?.language !== 'en';
  const useBnDigits = isBn && options?.digitFormat !== 'english';

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
      label: isBn ? 'ভূমিকা' : 'Introduction & Title',
      surah: config.surahNumber,
    });
    currentFrame += introDurationInFrames + titleCardDurationInFrames;
  }

  // Ayah Timestamps
  for (let i = 0; i < ayahs.length; i++) {
    const ayah = ayahs[i];
    const seconds = currentFrame / fps;

    // First ayah starting at 00:00 if no intro
    const timeFormatted = items.length === 0 ? '00:00' : formatTimeCode(seconds);

    // Extract first 4-5 words of Arabic text for snippet
    const arabicWords = (ayah.words || []).map((w) => w.text).join(' ');
    const arabicSnippet = arabicWords.length > 35 ? arabicWords.slice(0, 35) + '…' : arabicWords;
    const translationSnippet = ayah.primaryTranslation
      ? ayah.primaryTranslation.length > 50
        ? ayah.primaryTranslation.slice(0, 50) + '…'
        : ayah.primaryTranslation
      : undefined;

    let label: string;
    if (ayah.ayah === 0) {
      label = isBn ? 'বিসমিল্লাহ' : 'Bismillah';
    } else {
      const ayahNumStr = useBnDigits ? toBengaliDigits(ayah.ayah) : String(ayah.ayah);
      label = isBn ? `আয়াত ${ayahNumStr}` : `Ayah ${ayah.ayah}`;
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
  options?: { language?: 'bn' | 'en'; digitFormat?: 'bengali' | 'english' }
): { id: string; label: string; text: string }[] {
  const isBn = options?.language !== 'en';
  const useBnDigits = isBn && options?.digitFormat !== 'english';
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
  options: YouTubeDescriptionOptions = DEFAULT_DESCRIPTION_OPTIONS
): string {
  const isBn = options.language !== 'en';
  const useBnDigits = isBn && options.digitFormat !== 'english';
  const formatNum = useBnDigits ? toBengaliDigits : (n: number | string) => String(n);
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
  options?: { language?: 'bn' | 'en' }
): string[] {
  const isBn = options?.language !== 'en';
  const surah = getSurahByNumber(config.surahNumber);
  const arabicName = surah.nameArabic;
  const surahName = surah.nameTransliterated;

  let baseTags: string[];
  if (isBn) {
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
  options: YouTubeDescriptionOptions = DEFAULT_DESCRIPTION_OPTIONS
): string {
  const titles = generateYouTubeTitles(config, reciterInfo, {
    language: options.language,
    digitFormat: options.digitFormat,
  });
  const activeTitle = selectedTitle || titles[0].text;
  const description = generateYouTubeDescription(config, ayahs, reciterInfo, options);
  const tags = generateYouTubeTags(config, reciterInfo, { language: options.language });
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
