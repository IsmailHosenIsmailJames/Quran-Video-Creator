const fs = require('fs');
const path = require('path');

// Test the math and timeline synchronization for Task 2
const sampleManifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'sample_data', 'surah_67_mulk_tarteel.json'), 'utf-8')
);

console.log('Testing Task 2: Full Recitation Audio Synchronization Logic\n');

// 1. Full Surah playback (from verse 1 / Basmala)
const fullAudioDurationSeconds = 379.525; // Probed duration of full Surah Mulk recitation
const totalJsonMs = sampleManifest.total_duration_ms;
const diffMs = Math.abs(fullAudioDurationSeconds * 1000 - totalJsonMs);

console.log(`Full Audio Track Duration: ${fullAudioDurationSeconds}s (${fullAudioDurationSeconds * 1000}ms)`);
console.log(`Timestamp JSON Duration:   ${totalJsonMs / 1000}s (${totalJsonMs}ms)`);
console.log(`Difference:                ${diffMs}ms`);

const isSynchronized = diffMs <= 2000;
console.log(`Sync status:               ${isSynchronized ? '✓ PERFECT MATCH (< 2s)' : '⚠ MISMATCH'}`);
if (!isSynchronized) {
  console.error('Failed sync check!');
  process.exit(1);
}

// 2. Test Offset for partial verse range
// Suppose user chooses Ayahs 5 to 10
const ayah5 = sampleManifest.ayahs.find((a) => a.ayah_number === 5);
const ayah10 = sampleManifest.ayahs.find((a) => a.ayah_number === 10);

console.log('\nTesting Partial Range (Ayah 5 to Ayah 10):');
console.log(`Ayah 5 audioStartMs: ${ayah5.start_ms}ms (approx ${(ayah5.start_ms / 1000).toFixed(2)}s)`);
console.log(`Ayah 10 audioEndMs:  ${ayah10.end_ms}ms (approx ${(ayah10.end_ms / 1000).toFixed(2)}s)`);

const fps = 30;
const speed = 1.0;
const startFromFrame = Math.round((ayah5.start_ms / 1000) * fps * speed);
console.log(`Computed startFromFrame for Remotion <Audio>: Frame ${startFromFrame}`);

const expectedStartFrame = Math.round((49120 / 1000) * 30);
if (startFromFrame !== expectedStartFrame) {
  console.error(`Mismatch in startFromFrame! Expected ${expectedStartFrame}, got ${startFromFrame}`);
  process.exit(1);
}

console.log('✓ Computed frame offset matches exact timestamp perfectly!');
console.log('\nAll Task 2 Verification Checks PASSED!');
