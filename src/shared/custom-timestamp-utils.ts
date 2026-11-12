import {
  WhisperTimestampManifest,
  WhisperAyahTiming,
  WhisperPreambleItem,
  WordSegment,
  SalatJammatManifest,
  WhisperSalatSegment,
  WhisperSalatAyahTiming,
  UnifiedTimestampManifest,
} from './types';

export interface ParseResult {
  success: boolean;
  data?: UnifiedTimestampManifest;
  error?: string;
}

/**
 * Validates and parses a raw JSON string or object into a strongly typed UnifiedTimestampManifest
 * (supporting both single-surah manifests and multi-segment Salat Jama'ah manifests).
 */
export function validateAndParseTimestampJson(rawInput: string | unknown): ParseResult {
  let parsed: any;

  if (typeof rawInput === 'string') {
    try {
      parsed = JSON.parse(rawInput);
    } catch (err: any) {
      return {
        success: false,
        error: `JSON syntax error: ${err?.message || 'Invalid JSON format'}`,
      };
    }
  } else if (typeof rawInput === 'object' && rawInput !== null) {
    parsed = rawInput;
  } else {
    return {
      success: false,
      error: 'Input data must be a JSON string or object',
    };
  }

  // Detect Salat Jama'ah / Multi-Segment Mode
  const isSalat =
    parsed.mode === 'salat_jammat' ||
    (Array.isArray(parsed.segments) && parsed.segments.length > 0 && !parsed.surah_number);

  if (isSalat) {
    return validateSalatJammatManifest(parsed);
  }

  // Otherwise, validate as single-surah manifest
  // 1. Validate Surah Number
  const surahNumber = Number(parsed.surah_number);
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return {
      success: false,
      error: `Invalid surah_number: "${parsed.surah_number}". Must be an integer between 1 and 114.`,
    };
  }

  // 2. Validate Ayahs Array
  if (!Array.isArray(parsed.ayahs) || parsed.ayahs.length === 0) {
    return {
      success: false,
      error: 'JSON must contain a non-empty "ayahs" array.',
    };
  }

  // 3. Validate Ayah Range
  const startAyah = Number(parsed.start_ayah ?? parsed.ayahs[0]?.ayah_number ?? 1);
  const endAyah = Number(parsed.end_ayah ?? parsed.ayahs[parsed.ayahs.length - 1]?.ayah_number ?? startAyah);

  if (!Number.isInteger(startAyah) || !Number.isInteger(endAyah) || startAyah > endAyah || startAyah < 1) {
    return {
      success: false,
      error: `Invalid ayah range: from Ayah ${startAyah} to Ayah ${endAyah}.`,
    };
  }

  // 4. Validate Total Duration
  const totalDurationMs = Number(parsed.total_duration_ms);
  if (isNaN(totalDurationMs) || totalDurationMs <= 0) {
    return {
      success: false,
      error: `Invalid total_duration_ms: "${parsed.total_duration_ms}". Must be a positive millisecond duration.`,
    };
  }

  // 5. Validate Ayah Timings & Word Segments
  const validatedAyahs: WhisperAyahTiming[] = [];

  for (let i = 0; i < parsed.ayahs.length; i++) {
    const rawAyah = parsed.ayahs[i];
    const ayahNumber = Number(rawAyah.ayah_number);

    if (!Number.isInteger(ayahNumber)) {
      return {
        success: false,
        error: `Ayah item at index ${i} is missing a valid "ayah_number".`,
      };
    }

    const startMs = Number(rawAyah.start_ms);
    const endMs = Number(rawAyah.end_ms);

    if (isNaN(startMs) || isNaN(endMs) || startMs < 0 || endMs < startMs) {
      return {
        success: false,
        error: `Ayah ${ayahNumber} has invalid start/end timestamps (start: ${rawAyah.start_ms}, end: ${rawAyah.end_ms}).`,
      };
    }

    const durationMs = Number(rawAyah.duration_ms) || (endMs - startMs);

    // Validate words
    const validatedWords: WhisperAyahTiming['words'] = [];
    if (Array.isArray(rawAyah.words)) {
      for (let w = 0; w < rawAyah.words.length; w++) {
        const rawWord = rawAyah.words[w];
        const wordIndex = Number(rawWord.word_index ?? w + 1);
        const wStartMs = Number(rawWord.start_ms);
        const wEndMs = Number(rawWord.end_ms);

        if (isNaN(wStartMs) || isNaN(wEndMs)) {
          return {
            success: false,
            error: `Word at index ${w} in Ayah ${ayahNumber} has invalid timestamps.`,
          };
        }

        validatedWords.push({
          word_index: wordIndex,
          text_uthmani: String(rawWord.text_uthmani || '').trim(),
          start_ms: wStartMs,
          end_ms: wEndMs,
        });
      }
    }

    validatedAyahs.push({
      ayah_number: ayahNumber,
      text_uthmani: String(rawAyah.text_uthmani || ''),
      start_ms: startMs,
      end_ms: endMs,
      duration_ms: durationMs,
      word_count: validatedWords.length || Number(rawAyah.word_count || 0),
      words: validatedWords,
    });
  }

  // 6. Build Manifest
  const manifest: WhisperTimestampManifest = {
    surah_number: surahNumber,
    surah_name_ar: String(parsed.surah_name_ar || ''),
    surah_name_en: String(parsed.surah_name_en || ''),
    start_ayah: startAyah,
    end_ayah: endAyah,
    is_partial: Boolean(parsed.is_partial),
    total_duration_ms: totalDurationMs,
    parts_processed: parsed.parts_processed ? Number(parsed.parts_processed) : undefined,
    model_used: parsed.model_used ? String(parsed.model_used) : undefined,
    model_choice: parsed.model_choice ? String(parsed.model_choice) : undefined,
    device: parsed.device ? String(parsed.device) : undefined,
    compute_type: parsed.compute_type ? String(parsed.compute_type) : undefined,
    preamble: parsed.preamble
      ? {
          has_istiadha: Boolean(parsed.preamble.has_istiadha),
          istiadha: parsed.preamble.istiadha
            ? {
                text: String(parsed.preamble.istiadha.text || ''),
                start_ms: Number(parsed.preamble.istiadha.start_ms || 0),
                end_ms: Number(parsed.preamble.istiadha.end_ms || 0),
                duration_ms: Number(parsed.preamble.istiadha.duration_ms || 0),
              }
            : null,
          has_basmala: Boolean(parsed.preamble.has_basmala),
          basmala: parsed.preamble.basmala
            ? {
                text: String(parsed.preamble.basmala.text || ''),
                start_ms: Number(parsed.preamble.basmala.start_ms || 0),
                end_ms: Number(parsed.preamble.basmala.end_ms || 0),
                duration_ms: Number(parsed.preamble.basmala.duration_ms || 0),
              }
            : null,
        }
      : undefined,
    ayahs: validatedAyahs,
  };

  return {
    success: true,
    data: manifest,
  };
}

/**
 * Validates a multi-segment Salat Jama'ah prayer manifest.
 */
function validateSalatJammatManifest(parsed: any): ParseResult {
  const totalDurationMs = Number(parsed.total_duration_ms);
  if (isNaN(totalDurationMs) || totalDurationMs <= 0) {
    return {
      success: false,
      error: `Invalid total_duration_ms: "${parsed.total_duration_ms}". Must be a positive millisecond duration.`,
    };
  }

  if (!Array.isArray(parsed.segments) || parsed.segments.length === 0) {
    return {
      success: false,
      error: 'Salat Jama\'ah JSON must contain a non-empty "segments" array.',
    };
  }

  const validatedSegments: WhisperSalatSegment[] = [];
  const allAyahsCollected: WhisperSalatAyahTiming[] = [];

  for (let s = 0; s < parsed.segments.length; s++) {
    const rawSeg = parsed.segments[s];
    const segmentId = Number(rawSeg.segment_id ?? s + 1);
    const surahNumber = Number(rawSeg.surah_number);

    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      return {
        success: false,
        error: `Segment ${segmentId} ("${rawSeg.label}") has invalid surah_number: "${rawSeg.surah_number}". Must be 1 to 114.`,
      };
    }

    if (!Array.isArray(rawSeg.ayahs) || rawSeg.ayahs.length === 0) {
      return {
        success: false,
        error: `Segment ${segmentId} ("${rawSeg.label}") must contain a non-empty "ayahs" array.`,
      };
    }

    const startAyah = Number(rawSeg.start_ayah ?? rawSeg.ayahs[0]?.ayah_number ?? 1);
    const endAyah = Number(rawSeg.end_ayah ?? rawSeg.ayahs[rawSeg.ayahs.length - 1]?.ayah_number ?? startAyah);
    const label = String(rawSeg.label || `Segment ${segmentId}`);
    const surahNameAr = String(rawSeg.surah_name_ar || '');
    const surahNameEn = String(rawSeg.surah_name_en || '');

    const validatedAyahs: WhisperSalatAyahTiming[] = [];
    for (let i = 0; i < rawSeg.ayahs.length; i++) {
      const rawAyah = rawSeg.ayahs[i];
      const ayahNumber = Number(rawAyah.ayah_number);
      if (!Number.isInteger(ayahNumber)) {
        return {
          success: false,
          error: `Ayah item at index ${i} in segment ${segmentId} is missing a valid "ayah_number".`,
        };
      }

      const startMs = Number(rawAyah.start_ms);
      const endMs = Number(rawAyah.end_ms);
      if (isNaN(startMs) || isNaN(endMs) || startMs < 0 || endMs < startMs) {
        return {
          success: false,
          error: `Ayah ${ayahNumber} in segment ${segmentId} has invalid start/end timestamps.`,
        };
      }

      const durationMs = Number(rawAyah.duration_ms) || (endMs - startMs);

      const validatedWords: WhisperAyahTiming['words'] = [];
      if (Array.isArray(rawAyah.words)) {
        for (let w = 0; w < rawAyah.words.length; w++) {
          const rawWord = rawAyah.words[w];
          const wordIndex = Number(rawWord.word_index ?? w + 1);
          const wStartMs = Number(rawWord.start_ms);
          const wEndMs = Number(rawWord.end_ms);
          if (isNaN(wStartMs) || isNaN(wEndMs)) {
            return {
              success: false,
              error: `Word at index ${w} in Ayah ${ayahNumber} has invalid timestamps.`,
            };
          }
          validatedWords.push({
            word_index: wordIndex,
            text_uthmani: String(rawWord.text_uthmani || '').trim(),
            start_ms: wStartMs,
            end_ms: wEndMs,
          });
        }
      }

      const salatAyah: WhisperSalatAyahTiming = {
        ayah_number: ayahNumber,
        text_uthmani: String(rawAyah.text_uthmani || ''),
        start_ms: startMs,
        end_ms: endMs,
        duration_ms: durationMs,
        word_count: validatedWords.length || Number(rawAyah.word_count || 0),
        words: validatedWords,
        segment_id: segmentId,
        segment_label: label,
        surah_number: surahNumber,
        surah_name_en: surahNameEn,
        surah_name_ar: surahNameAr,
      };

      validatedAyahs.push(salatAyah);
      allAyahsCollected.push(salatAyah);
    }

    const startMs = Number(rawSeg.start_ms ?? rawSeg.ayahs[0]?.start_ms ?? 0);
    const endMs = Number(rawSeg.end_ms ?? rawSeg.ayahs[rawSeg.ayahs.length - 1]?.end_ms ?? 0);
    const durationMs = Number(rawSeg.duration_ms ?? (endMs - startMs));

    validatedSegments.push({
      segment_id: segmentId,
      label,
      surah_number: surahNumber,
      surah_name_ar: surahNameAr,
      surah_name_en: surahNameEn,
      start_ayah: startAyah,
      end_ayah: endAyah,
      is_partial: Boolean(rawSeg.is_partial),
      start_sec: Number(rawSeg.start_sec ?? startMs / 1000),
      end_sec: Number(rawSeg.end_sec ?? endMs / 1000),
      start_ms: startMs,
      end_ms: endMs,
      duration_ms: durationMs,
      preamble: rawSeg.preamble
        ? {
            has_istiadha: Boolean(rawSeg.preamble.has_istiadha),
            istiadha: rawSeg.preamble.istiadha
              ? {
                  text: String(rawSeg.preamble.istiadha.text || ''),
                  start_ms: Number(rawSeg.preamble.istiadha.start_ms || 0),
                  end_ms: Number(rawSeg.preamble.istiadha.end_ms || 0),
                  duration_ms: Number(rawSeg.preamble.istiadha.duration_ms || 0),
                }
              : null,
            has_basmala: Boolean(rawSeg.preamble.has_basmala),
            basmala: rawSeg.preamble.basmala
              ? {
                  text: String(rawSeg.preamble.basmala.text || ''),
                  start_ms: Number(rawSeg.preamble.basmala.start_ms || 0),
                  end_ms: Number(rawSeg.preamble.basmala.end_ms || 0),
                  duration_ms: Number(rawSeg.preamble.basmala.duration_ms || 0),
                }
              : null,
          }
        : undefined,
      ayahs: validatedAyahs,
    });
  }

  const manifest: SalatJammatManifest = {
    mode: 'salat_jammat',
    total_duration_ms: totalDurationMs,
    segments_count: validatedSegments.length,
    model_used: parsed.model_used ? String(parsed.model_used) : undefined,
    model_choice: parsed.model_choice ? String(parsed.model_choice) : undefined,
    device: parsed.device ? String(parsed.device) : undefined,
    compute_type: parsed.compute_type ? String(parsed.compute_type) : undefined,
    segments: validatedSegments,
    all_ayahs: allAyahsCollected,
    is_video: Boolean(parsed.is_video),
    video_url: parsed.video_url ? String(parsed.video_url) : undefined,
    audio_url: parsed.audio_url ? String(parsed.audio_url) : undefined,
    filename: parsed.filename ? String(parsed.filename) : undefined,
  };

  return {
    success: true,
    data: manifest,
  };
}

/**
 * Converts global absolute word timestamps of an Ayah into relative WordSegment timestamps
 * where segment.startMs is measured from 0 to ayahDurationMs.
 */
export function convertAyahToRelativeSegments(
  ayahTiming: WhisperAyahTiming,
  speed: number = 1.0,
  baseOffsetMs?: number
): WordSegment[] {
  const safeSpeed = Math.max(0.5, Math.min(2.0, speed));
  const baseStartMs = baseOffsetMs !== undefined ? baseOffsetMs : ayahTiming.start_ms;

  return (ayahTiming.words || []).map((w) => ({
    wordIndex: w.word_index,
    startMs: Math.max(0, Math.round((w.start_ms - baseStartMs) / safeSpeed)),
    endMs: Math.max(0, Math.round((w.end_ms - baseStartMs) / safeSpeed)),
  }));
}

/**
 * Creates relative word segments for the Bismillah preface (Ayah 0) from preamble data.
 */
export function convertBasmalaToRelativeSegments(
  basmala: WhisperPreambleItem,
  speed: number = 1.0
): WordSegment[] {
  const safeSpeed = Math.max(0.5, Math.min(2.0, speed));
  const totalMs = Math.round(basmala.duration_ms / safeSpeed);

  // Default 4 words of Bismillah (Bism, Allahi, Al-Rahmani, Al-Rahim)
  const quarter = Math.round(totalMs / 4);
  return [
    { wordIndex: 1, startMs: 0, endMs: quarter },
    { wordIndex: 2, startMs: quarter, endMs: quarter * 2 },
    { wordIndex: 3, startMs: quarter * 2, endMs: quarter * 3 },
    { wordIndex: 4, startMs: quarter * 3, endMs: totalMs },
  ];
}

/**
 * Formats milliseconds into human-readable minutes:seconds.milliseconds or minutes:seconds.
 */
export function formatDurationMs(ms: number): string {
  if (isNaN(ms) || ms < 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.floor(ms % 1000);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const mmm = String(millis).padStart(3, '0');

  return `${mm}:${ss}.${mmm}`;
}
