import {
  VideoTemplateConfig,
  AyahFontOverride,
  QuranWord,
  AyahSequenceData,
  AyahChunk,
} from './types';

export interface ComputedFontSizes {
  arabicFontSize: number;
  primaryFontSize: number;
  secondaryFontSize: number;
  isAutoScaled: boolean;
}

/**
 * Dynamically computes optimal font sizes for Arabic scripture, primary translation,
 * and secondary translation based on ayah/chunk length, global textScaleMultiplier,
 * and canvas aspect ratio.
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
  // Global text scale multiplier (default 1.0, recommended 1.45x - 1.5x for mobile)
  const scaleMultiplier = Math.max(0.6, Math.min(2.5, config.textScaleMultiplier ?? 1.0));

  const baseArabic = Math.round((config.arabicFontSize || 56) * scaleMultiplier);
  const basePrimary = Math.round((config.primaryFontSize || 26) * scaleMultiplier);
  const baseSecondary = Math.round((config.secondaryFontSize || 21) * scaleMultiplier);

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
  // 1-6 words: 1.0 (e.g. 56px * 1.5 = 84px)
  // 7-12 words: ~0.94 - 0.88
  // 13-22 words: ~0.88 - 0.76
  // 23-35 words: ~0.76 - 0.65
  // 36-55 words: ~0.65 - 0.54
  // 56-85 words: ~0.54 - 0.44
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
  // 0-60 chars: 1.0
  // 61-120 chars: ~0.90
  // 121-200 chars: ~0.80
  // 201-320 chars: ~0.70
  // 321-480 chars: ~0.60
  // > 480 chars: down to ~0.48 min
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
  // 0-70 chars: 1.0
  // 71-140 chars: ~0.90
  // 141-240 chars: ~0.80
  // 241-380 chars: ~0.70
  // 381-560 chars: ~0.60
  // > 560 chars: down to ~0.48 min
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

  // Mobile / high-scale floor protection: ensure minimum bounds scale up with scaleMultiplier
  const isMobile = config.aspectRatio === '9:16' || scaleMultiplier >= 1.35;
  const floorArabic = isMobile ? Math.round(28 * Math.min(1.4, scaleMultiplier)) : 20;
  const floorPrimary = isMobile ? Math.round(16 * Math.min(1.4, scaleMultiplier)) : 12;
  const floorSecondary = isMobile ? Math.round(14 * Math.min(1.4, scaleMultiplier)) : 11;

  const autoArabic = Math.max(floorArabic, Math.round(baseArabic * arabicScale));
  const autoPrimary = Math.max(floorPrimary, Math.round(basePrimary * primaryScale));
  const autoSecondary = Math.max(floorSecondary, Math.round(baseSecondary * secondaryScale));

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

/**
 * Splits a translation text into a target number of clauses corresponding to Ayah chunks.
 * Preserves punctuation and ensures balanced, grammatical subtitle lines.
 */
export function splitTranslationIntoClauses(text: string, targetCount: number): string[] {
  if (targetCount <= 1 || !text || !text.trim()) {
    return Array(targetCount).fill(text || '');
  }

  const cleaned = text.trim();

  // 1. Primary sentence split: Bengali/Hindi (।), English (.), Question mark (?), Exclamation (!)
  const sentenceRegex = /([^।\.\?!]+[।\.\?!]+[\s]*)/g;
  const matches = cleaned.match(sentenceRegex);
  let sentences = matches ? matches.map((s) => s.trim()).filter(Boolean) : [];

  // Check if trailing content was not captured by regex
  const matchedLength = sentences.reduce((acc, s) => acc + s.length, 0);
  if (matchedLength < cleaned.length - 2) {
    const remainder = cleaned.slice(matchedLength).trim();
    if (remainder) {
      if (sentences.length > 0) {
        sentences[sentences.length - 1] += ' ' + remainder;
      } else {
        sentences.push(remainder);
      }
    }
  }

  // 2. Secondary split: If sentences < targetCount, split at commas / semicolons / em-dashes
  if (sentences.length < targetCount) {
    const clauseRegex = /([^,;:\u060C\u061B\u2014\-]+[,;:\u060C\u061B\u2014\-]+[\s]*)/g;
    const clauseMatches = cleaned.match(clauseRegex);
    if (clauseMatches && clauseMatches.length >= targetCount) {
      sentences = clauseMatches.map((c) => c.trim()).filter(Boolean);
      const cLength = sentences.reduce((acc, s) => acc + s.length, 0);
      if (cLength < cleaned.length - 2) {
        const rem = cleaned.slice(cLength).trim();
        if (rem) sentences[sentences.length - 1] += ' ' + rem;
      }
    }
  }

  // 3. If we have sentences, group or partition to exactly targetCount
  if (sentences.length >= targetCount) {
    const result: string[] = [];
    const n = sentences.length;
    for (let i = 0; i < targetCount; i++) {
      const start = Math.floor((i * n) / targetCount);
      const end = Math.floor(((i + 1) * n) / targetCount);
      result.push(sentences.slice(start, end).join(' '));
    }
    return result;
  }

  // 4. Fallback: Partition words proportionally across chunks
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length <= targetCount) {
    return Array(targetCount).fill(cleaned);
  }

  const result: string[] = [];
  const totalWords = words.length;
  for (let i = 0; i < targetCount; i++) {
    const start = Math.floor((i * totalWords) / targetCount);
    const end = Math.floor(((i + 1) * totalWords) / targetCount);
    result.push(words.slice(start, end).join(' '));
  }
  return result;
}

/**
 * Computes logical phrasing chunks for an Ayah based on Waqf pause marks,
 * reciter acoustic breath pauses, and maximum words per chunk.
 * Guarantees zero blank screen gaps across the entire recitation timeline.
 */
export function computeAyahChunks(
  ayahData: AyahSequenceData,
  config?: Partial<VideoTemplateConfig>
): AyahChunk[] {
  const words = ayahData.words || [];
  const segments = ayahData.segments || [];
  const totalDurationMs = ((ayahData.durationInFrames || 180) / (config?.fps || 30)) * 1000;

  const enableChunking = config?.enableAyahChunking !== false;
  const maxWords = Math.max(6, Math.min(24, config?.maxWordsPerChunk || 10));

  // If chunking is disabled or the Ayah is already short enough, return single chunk
  if (!enableChunking || words.length <= maxWords) {
    return [
      {
        id: `${ayahData.surah}:${ayahData.ayah}_chunk_0`,
        chunkIndex: 0,
        totalChunks: 1,
        startWordIndex: words.length > 0 ? words[0].word : 1,
        endWordIndex: words.length > 0 ? words[words.length - 1].word : 1,
        startMs: 0,
        endMs: totalDurationMs,
        words,
        primaryTranslation: ayahData.primaryTranslation,
        secondaryTranslation: ayahData.secondaryTranslation,
      },
    ];
  }

  // Detect split points (word indexes after which a chunk boundary occurs)
  const splitAfterIndices: number[] = [];
  let chunkWordCount = 0;

  for (let i = 0; i < words.length - 1; i++) {
    const w = words[i];
    chunkWordCount++;

    // Don't split if only 2 or fewer words remain in the entire verse (prevent dangling words)
    if (words.length - 1 - i <= 2) {
      continue;
    }

    // Check 1: Quranic Waqf Sign in word
    const hasWaqf = Boolean(
      w.hasWaqf ||
      /[\u06D6-\u06DC\u06EC\u0615\u06D5]/.test(w.text) ||
      /[\uFD00-\uFDFF]/.test(w.text)
    );

    // Check 2: Audio breath pause from reciter segments (>= 350ms gap)
    const curSeg = segments.find((s) => s.wordIndex === w.word);
    const nextSeg = segments.find((s) => s.wordIndex === w.word + 1);
    const pauseGap = curSeg && nextSeg ? nextSeg.startMs - curSeg.endMs : 0;
    const isAudioPause = pauseGap >= 350;

    // Conditions to split:
    // A) At least 4 words in current chunk AND (has Waqf or audio pause)
    // B) Or if reached maxWords
    const shouldSplit =
      (chunkWordCount >= 4 && (hasWaqf || isAudioPause)) ||
      chunkWordCount >= maxWords;

    if (shouldSplit) {
      splitAfterIndices.push(i);
      chunkWordCount = 0;
    }
  }

  // Build the word groups
  const chunkWordGroups: QuranWord[][] = [];
  let lastIndex = 0;
  for (const splitIdx of splitAfterIndices) {
    chunkWordGroups.push(words.slice(lastIndex, splitIdx + 1));
    lastIndex = splitIdx + 1;
  }
  if (lastIndex < words.length) {
    chunkWordGroups.push(words.slice(lastIndex));
  }

  // If for any reason chunkWordGroups is 1, return single chunk
  if (chunkWordGroups.length <= 1) {
    return [
      {
        id: `${ayahData.surah}:${ayahData.ayah}_chunk_0`,
        chunkIndex: 0,
        totalChunks: 1,
        startWordIndex: words.length > 0 ? words[0].word : 1,
        endWordIndex: words.length > 0 ? words[words.length - 1].word : 1,
        startMs: 0,
        endMs: totalDurationMs,
        words,
        primaryTranslation: ayahData.primaryTranslation,
        secondaryTranslation: ayahData.secondaryTranslation,
      },
    ];
  }

  // Split translations if enabled
  const splitTrans = config?.splitTranslationsWithChunks !== false;
  const primaryClauses = splitTrans && ayahData.primaryTranslation
    ? splitTranslationIntoClauses(ayahData.primaryTranslation, chunkWordGroups.length)
    : Array(chunkWordGroups.length).fill(ayahData.primaryTranslation || '');

  const secondaryClauses = splitTrans && ayahData.secondaryTranslation
    ? splitTranslationIntoClauses(ayahData.secondaryTranslation, chunkWordGroups.length)
    : Array(chunkWordGroups.length).fill(ayahData.secondaryTranslation || '');

  // Calculate timestamps for each chunk
  const chunks: AyahChunk[] = [];
  for (let c = 0; c < chunkWordGroups.length; c++) {
    const group = chunkWordGroups[c];
    const firstWord = group[0];
    const lastWord = group[group.length - 1];

    // Determine start timestamp
    let chunkStartMs = 0;
    if (c === 0) {
      chunkStartMs = 0;
    } else {
      const firstSeg = segments.find((s) => s.wordIndex === firstWord.word);
      chunkStartMs = firstSeg ? firstSeg.startMs : chunks[c - 1].endMs;
    }

    // Determine end timestamp (extends to next chunk start, or end of Ayah)
    let chunkEndMs = totalDurationMs;
    if (c < chunkWordGroups.length - 1) {
      const nextGroup = chunkWordGroups[c + 1];
      const nextFirstWord = nextGroup[0];
      const nextFirstSeg = segments.find((s) => s.wordIndex === nextFirstWord.word);
      if (nextFirstSeg) {
        chunkEndMs = nextFirstSeg.startMs;
      } else {
        const lastSeg = segments.find((s) => s.wordIndex === lastWord.word);
        chunkEndMs = lastSeg ? lastSeg.endMs + 300 : chunkStartMs + 3000;
      }
    } else {
      // Last chunk extends to total duration
      chunkEndMs = Math.max(chunkStartMs + 1000, totalDurationMs);
    }

    chunks.push({
      id: `${ayahData.surah}:${ayahData.ayah}_chunk_${c}`,
      chunkIndex: c,
      totalChunks: chunkWordGroups.length,
      startWordIndex: firstWord.word,
      endWordIndex: lastWord.word,
      startMs: chunkStartMs,
      endMs: chunkEndMs,
      words: group,
      primaryTranslation: primaryClauses[c],
      secondaryTranslation: secondaryClauses[c],
    });
  }

  return chunks;
}
