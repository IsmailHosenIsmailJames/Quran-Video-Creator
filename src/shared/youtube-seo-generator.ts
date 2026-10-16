import { VideoTemplateConfig, ReciterInfo, AyahSequenceData, SurahMeta } from './types';
import { getSurahByNumber } from './surahs';
import { getLocalizedHeader, getTranslationBookName } from './surah-localization';

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
  includeHook: true,
  includeVirtues: true,
  includeTimestamps: true,
  includeSurahMeta: true,
  includeReciterCredits: true,
  includeTranslationCredits: true,
  includeCallToAction: true,
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
  ayahs: AyahSequenceData[]
): YouTubeTimestampItem[] {
  const fps = config.fps || 30;
  const items: YouTubeTimestampItem[] = [];

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
      label: 'Introduction & Title',
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

    items.push({
      frame: currentFrame,
      seconds: items.length === 0 ? 0 : seconds,
      timeFormatted,
      label: `Ayah ${ayah.ayah}`,
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
      label: 'Sadaqallahul Azeem & Outro',
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
  reciterInfo?: ReciterInfo
): { id: string; label: string; text: string }[] {
  const surah = getSurahByNumber(config.surahNumber);
  const surahName = surah.nameTransliterated;
  const arabicName = surah.nameArabic;
  const reciterName = reciterInfo?.name || 'Holy Quran Recitation';
  const reciterStyle = reciterInfo?.style ? ` (${reciterInfo.style})` : '';

  const isFull = config.fromAyah === 1 && config.toAyah === surah.totalAyahs;
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
  const surah = getSurahByNumber(config.surahNumber);
  const surahName = surah.nameTransliterated;
  const arabicName = surah.nameArabic;
  const reciterName = reciterInfo?.name || 'Noble Quran Recitation';
  const reciterStyle = reciterInfo?.style ? ` (${reciterInfo.style})` : '';
  const translationBook = getTranslationBookName(config);
  const localized = getLocalizedHeader(config, config.surahNumber, 0);

  const isFull = config.fromAyah === 1 && config.toAyah === surah.totalAyahs;
  const rangeText = isFull ? `Full Surah (${surah.totalAyahs} Verses)` : `Verses ${config.fromAyah} to ${config.toAyah}`;

  const sections: string[] = [];

  // 1. Hook & Overview
  if (options.includeHook) {
    sections.push(
      `Heart soothing and peaceful recitation of Surah ${surahName} (سورة ${arabicName}) - ${rangeText}.\n` +
      `Listen with presence of heart, reflect on the divine meanings, and find peace of soul and mind.`
    );
  }

  // 2. Surah Virtues & Hadith (if available)
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

  // 3. YouTube Chapters / Timestamps Table
  if (options.includeTimestamps) {
    const timestamps = calculateYouTubeTimestamps(config, ayahs);
    const formatted = formatTimestampsForYouTube(timestamps, options.timestampFormat);
    sections.push(
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n⏱️ VIDEO CHAPTERS / TIMESTAMPS\n━━━━━━━━━━━━━━━━━━━━━━━━━\n${formatted}`
    );
  }

  // 4. Surah Metadata & Details Card
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

  // 5. Reciter & Translation Attributions
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

  // 6. Sadaqah Jariyah & Channel Call To Action
  if (options.includeCallToAction) {
    sections.push(
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n🤲 SADAQAH JARIYAH & SUPPORT\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `"The best of you are those who learn the Quran and teach it." [Sahih al-Bukhari 5027]\n\n` +
      `🔔 Subscribe to our channel and turn on all notifications so you never miss a recitation.\n` +
      `👍 Please like and share this video with family and friends — sharing sacred knowledge is a perpetual charity (Sadaqah Jariyah).\n` +
      `🎧 Use headphones for optimal immersion and high-definition audio.`
    );
  }

  // 7. Hashtags
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
  reciterInfo?: ReciterInfo
): string[] {
  const surah = getSurahByNumber(config.surahNumber);
  const surahName = surah.nameTransliterated;
  const arabicName = surah.nameArabic;
  const reciterName = reciterInfo?.name || 'Quran';

  const baseTags = [
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
  const titles = generateYouTubeTitles(config, reciterInfo);
  const activeTitle = selectedTitle || titles[0].text;
  const description = generateYouTubeDescription(config, ayahs, reciterInfo, options);
  const tags = generateYouTubeTags(config, reciterInfo);

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
