const fs = require('fs');
const path = require('path');

function validateAndParseTimestampJson(rawInput) {
  let parsed;

  if (typeof rawInput === 'string') {
    try {
      parsed = JSON.parse(rawInput);
    } catch (err) {
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
  const validatedAyahs = [];

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
    const validatedWords = [];
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

  const manifest = {
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
          istiadha: parsed.preamble.istiadha || null,
          has_basmala: Boolean(parsed.preamble.has_basmala),
          basmala: parsed.preamble.basmala || null,
        }
      : undefined,
    ayahs: validatedAyahs,
  };

  return {
    success: true,
    data: manifest,
  };
}

function convertAyahToRelativeSegments(ayahTiming, speed = 1.0) {
  const safeSpeed = Math.max(0.5, Math.min(2.0, speed));
  const baseStartMs = ayahTiming.start_ms;

  return (ayahTiming.words || []).map((w) => ({
    wordIndex: w.word_index,
    startMs: Math.max(0, Math.round((w.start_ms - baseStartMs) / safeSpeed)),
    endMs: Math.max(0, Math.round((w.end_ms - baseStartMs) / safeSpeed)),
  }));
}

function formatDurationMs(ms) {
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

// Read sample file
const samplePath = path.join(__dirname, '..', 'sample_data', 'surah_67_mulk_tarteel.json');
const rawContent = fs.readFileSync(samplePath, 'utf-8');
const result = validateAndParseTimestampJson(rawContent);

if (!result.success) {
  console.error('Validation failed:', result.error);
  process.exit(1);
}

console.log('SUCCESS: Validated Surah Mulk JSON!');
console.log('Surah:', result.data.surah_name_en, `(#${result.data.surah_number})`);
console.log('Ayahs:', `${result.data.start_ayah} to ${result.data.end_ayah} (${result.data.ayahs.length} ayahs)`);
console.log('Total duration:', formatDurationMs(result.data.total_duration_ms));
console.log('Model:', result.data.model_used);
console.log('Has Basmala:', result.data.preamble?.has_basmala, 'Duration:', result.data.preamble?.basmala?.duration_ms, 'ms');

// Test relative word segments for Ayah 1
const ayah1 = result.data.ayahs[0];
const relSegs1 = convertAyahToRelativeSegments(ayah1);
console.log('\nAyah 1 timing test:');
console.log('Ayah 1 global window:', ayah1.start_ms, 'ms to', ayah1.end_ms, 'ms (duration:', ayah1.duration_ms, 'ms)');
console.log('First 3 relative word segments:');
console.log(relSegs1.slice(0, 3));
console.log('Last word relative segment:');
console.log(relSegs1[relSegs1.length - 1]);

if (relSegs1[0].startMs !== 0) {
  console.error('Error: First word relative startMs should be 0!');
  process.exit(1);
}

if (relSegs1[relSegs1.length - 1].endMs !== ayah1.duration_ms) {
  console.error('Error: Last word relative endMs should equal ayah duration!');
  process.exit(1);
}

console.log('\nAll assertions PASSED!');
