/**
 * Verification script for Salat Jama'ah / Multi-Surah Recitation Mode
 */
const fs = require('fs');
const path = require('path');

// Read salat_jammat_sample.json
const samplePath = path.resolve(__dirname, '../sample_data/salat_jammat_sample.json');
if (!fs.existsSync(samplePath)) {
  console.error('FAIL: sample_data/salat_jammat_sample.json does not exist');
  process.exit(1);
}

const rawContent = fs.readFileSync(samplePath, 'utf8');
const parsed = JSON.parse(rawContent);

console.log('--- Step 1: Validating Salat Jama\'ah JSON Structure ---');
if (parsed.mode !== 'salat_jammat') {
  console.error('FAIL: expected mode == "salat_jammat", got:', parsed.mode);
  process.exit(1);
}
if (!Array.isArray(parsed.segments) || parsed.segments.length < 2) {
  console.error('FAIL: expected at least 2 segments, got:', parsed.segments?.length);
  process.exit(1);
}
console.log(`✓ Detected ${parsed.segments.length} prayer segments`);
console.log(`✓ Total timeline duration: ${parsed.total_duration_ms} ms (${(parsed.total_duration_ms / 1000).toFixed(1)}s)`);

parsed.segments.forEach((seg, idx) => {
  console.log(`  Segment ${idx + 1} [${seg.segment_id}]: "${seg.label}" -> Surah ${seg.surah_number} (${seg.surah_name_en}) Ayahs ${seg.start_ayah}..${seg.end_ayah} (${seg.ayahs.length} ayahs, ${seg.start_ms}ms..${seg.end_ms}ms)`);
  if (!seg.ayahs || seg.ayahs.length === 0) {
    console.error(`FAIL: Segment ${seg.segment_id} has no ayahs`);
    process.exit(1);
  }
});

console.log('\n--- Step 2: Simulating Studio Store Multi-Surah Sequence Building ---');
const fps = 30;
const totalDurationFrames = Math.round((parsed.total_duration_ms / 1000) * fps);
console.log(`Target total duration in frames at ${fps}fps: ${totalDurationFrames} frames`);

const sequence = [];

// Pre-recitation silence check
const firstSeg = parsed.segments[0];
const firstAyahStartMs = firstSeg.ayahs[0]?.start_ms || firstSeg.start_ms;
if (firstAyahStartMs > 500) {
  const initialSpacerFrames = Math.max(1, Math.round((firstAyahStartMs / 1000) * fps));
  sequence.push({
    isSpacer: true,
    isInterstitial: true,
    interstitialTitle: firstSeg.label || 'Salat Jama\'ah',
    interstitialSubtitle: `Surah ${firstSeg.surah_name_en} (Verses ${firstSeg.start_ayah}–${firstSeg.end_ayah})`,
    durationInFrames: initialSpacerFrames,
  });
  console.log(`✓ Added initial ambient spacer: ${firstAyahStartMs}ms -> ${initialSpacerFrames} frames`);
}

for (let segIdx = 0; segIdx < parsed.segments.length; segIdx++) {
  const seg = parsed.segments[segIdx];

  // Inter-segment gap check
  if (segIdx > 0) {
    const prevSeg = parsed.segments[segIdx - 1];
    const prevSegLastAyah = prevSeg.ayahs[prevSeg.ayahs.length - 1];
    const prevEndMs = prevSegLastAyah ? prevSegLastAyah.end_ms : prevSeg.end_ms;
    const currentFirstAyah = seg.ayahs[0];
    const currentStartMs = currentFirstAyah ? currentFirstAyah.start_ms : seg.start_ms;

    const gapMs = currentStartMs - prevEndMs;
    if (gapMs > 600) {
      const gapFrames = Math.max(1, Math.round((gapMs / 1000) * fps));
      sequence.push({
        isSpacer: true,
        isInterstitial: true,
        interstitialTitle: `Next: Surah ${seg.surah_name_en}`,
        interstitialSubtitle: `Verses ${seg.start_ayah}–${seg.end_ayah} (${seg.label || ''})`,
        durationInFrames: gapFrames,
      });
      console.log(`✓ Added prayer transition gap between seg ${segIdx} and ${segIdx + 1}: ${gapMs}ms -> ${gapFrames} frames ("Next: Surah ${seg.surah_name_en}")`);
    }
  }

  // Segment ayahs
  for (let i = 0; i < seg.ayahs.length; i++) {
    const ayahTiming = seg.ayahs[i];
    let durationMs;
    if (i < seg.ayahs.length - 1) {
      const nextAyah = seg.ayahs[i + 1];
      durationMs = Math.max(nextAyah.start_ms - ayahTiming.start_ms, ayahTiming.duration_ms);
    } else {
      durationMs = ayahTiming.duration_ms;
    }

    const durationInFrames = Math.max(1, Math.round((durationMs / 1000) * fps));
    sequence.push({
      surah: seg.surah_number,
      ayah: ayahTiming.ayah_number,
      segmentId: seg.segment_id,
      segmentLabel: seg.label,
      durationInFrames,
      words: ayahTiming.words,
    });
  }
}

// 5. Post-recitation trailing silence or prayer completion spacer (e.g. Ruku / outro)
const lastSeg = parsed.segments[parsed.segments.length - 1];
const lastSalatAyah = lastSeg.ayahs[lastSeg.ayahs.length - 1];
if (lastSalatAyah && parsed.total_duration_ms > lastSalatAyah.end_ms) {
  const tailMs = parsed.total_duration_ms - lastSalatAyah.end_ms;
  if (tailMs > 1500) {
    const tailFrames = Math.max(15, Math.round((tailMs / 1000) * fps));
    sequence.push({
      surah: lastSalatAyah.surah_number,
      ayah: 0,
      isSpacer: true,
      isInterstitial: true,
      interstitialTitle: "Salat Jama'ah",
      interstitialSubtitle: 'رُكُوعٌ وَسُجُودٌ',
      durationInFrames: tailFrames,
    });
    console.log(`✓ Added prayer completion tail spacer: ${tailMs}ms -> ${tailFrames} frames ("Salat Jama'ah: رُكُوعٌ وَسُجُودٌ")`);
  }
}

// 6. Zero-drift alignment with total_duration_ms
let accumulatedFrames = sequence.reduce((sum, item) => sum + item.durationInFrames, 0);
let frameDiscrepancy = totalDurationFrames - accumulatedFrames;
console.log(`Accumulated frames: ${accumulatedFrames}, Target frames: ${totalDurationFrames}, Discrepancy: ${frameDiscrepancy} frames`);

if (Math.abs(frameDiscrepancy) > 0 && Math.abs(frameDiscrepancy) <= 30 && sequence.length > 0) {
  sequence[sequence.length - 1].durationInFrames += frameDiscrepancy;
  console.log(`✓ Reconciled drift (${frameDiscrepancy} frames). Total frames now exactly equals ${totalDurationFrames}.`);
}

const finalTotalFrames = sequence.reduce((sum, item) => sum + item.durationInFrames, 0);
if (finalTotalFrames !== totalDurationFrames) {
  console.error(`FAIL: Final total frames ${finalTotalFrames} does not match target ${totalDurationFrames}`);
  process.exit(1);
}

console.log(`✓ Perfect frame synchronization achieved: ${finalTotalFrames} frames (${(finalTotalFrames / fps).toFixed(2)}s) exactly matches ${parsed.total_duration_ms}ms.`);

// Check sequence breakdown
const interstitials = sequence.filter(s => s.isInterstitial);
const surah1Ayahs = sequence.filter(s => !s.isInterstitial && s.surah === 1);
const surah19Ayahs = sequence.filter(s => !s.isInterstitial && s.surah === 19);

console.log(`\n--- Step 3: Verifying Sequence Elements ---`);
console.log(`✓ Interstitial/Spacer cards: ${interstitials.length}`);
console.log(`✓ Surah 1 Ayahs count: ${surah1Ayahs.length} (Verses ${surah1Ayahs[0].ayah} to ${surah1Ayahs[surah1Ayahs.length - 1].ayah})`);
console.log(`✓ Surah 19 Ayahs count: ${surah19Ayahs.length} (Verses ${surah19Ayahs[0].ayah} to ${surah19Ayahs[surah19Ayahs.length - 1].ayah})`);

if (interstitials.length < 2) {
  console.error('FAIL: Expected at least 2 interstitials (initial spacer + inter-segment gap)');
  process.exit(1);
}
if (surah1Ayahs.length !== 6) {
  console.error(`FAIL: Expected 6 ayahs for Surah 1 (v2-7), got ${surah1Ayahs.length}`);
  process.exit(1);
}
if (surah19Ayahs.length !== 24) {
  console.error(`FAIL: Expected 24 ayahs for Surah 19 (v75-98), got ${surah19Ayahs.length}`);
  process.exit(1);
}

// Verify Word timestamps integrity for random ayahs
const randomAyah = surah19Ayahs[10]; // e.g. Maryam verse 85
console.log(`\n--- Step 4: Word Timestamps Inspection (Surah ${randomAyah.surah}:${randomAyah.ayah}) ---`);
console.log(`  Ayah frames: ${randomAyah.durationInFrames} (${(randomAyah.durationInFrames / fps * 1000).toFixed(0)}ms)`);
console.log(`  Words: ${randomAyah.words.length} tokens`);
randomAyah.words.slice(0, 3).forEach(w => {
  console.log(`    "${w.text_uthmani || w.word}" (${w.start_ms}ms -> ${w.end_ms}ms, dur: ${w.end_ms - w.start_ms}ms)`);
});

console.log('\n========================================');
console.log('✓ ALL SALAT JAMA\'AH VERIFICATIONS PASSED');
console.log('========================================');
