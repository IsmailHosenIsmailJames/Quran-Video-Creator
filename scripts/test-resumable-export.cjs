const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Running Resumable Video Rendering & Checkpointing Test Suite...\n');

let passed = 0;
let total = 0;

function assert(condition, testName) {
  total++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

const testCacheDir = path.join(__dirname, '..', '.cache', 'test-resumable');
if (fs.existsSync(testCacheDir)) {
  fs.rmSync(testCacheDir, { recursive: true, force: true });
}
fs.mkdirSync(testCacheDir, { recursive: true });

// Transpile render-session-manager for CommonJS test runner
const transpiledDir = path.join(testCacheDir, 'transpiled');
execSync(
  `npx tsc src/main/services/render-session-manager.ts --outDir "${transpiledDir}" --module commonjs --target es2020 --skipLibCheck --moduleResolution node --resolveJsonModule --esModuleInterop`,
  { stdio: 'inherit' }
);

const { renderSessionManager } = require(path.join(transpiledDir, 'main', 'services', 'render-session-manager.js'));

// ==========================================
// Test Group 1: Deterministic Session ID
// ==========================================
console.log('\n--- Test Group 1: Deterministic Session Fingerprint ---');

const dummyConfig = {
  surahNumber: 67,
  fromAyah: 1,
  toAyah: 30,
  reciterIndex: 0,
  resolution: '1080p',
  fps: 30,
  aspectRatio: '16:9',
  backgroundType: 'video',
  backgroundPath: '/path/to/bg.mp4',
  arabicFontSize: 56,
  primaryFontSize: 26,
};
const dummyOutputPath = path.join(testCacheDir, 'Surah_Al_Mulk.mp4');
const totalFrames = 18000; // 10 minutes at 30fps

const session1 = renderSessionManager.computeSessionId(dummyConfig, totalFrames, dummyOutputPath);
const session2 = renderSessionManager.computeSessionId(dummyConfig, totalFrames, dummyOutputPath);

assert(session1.sessionId === session2.sessionId, 'Identical export config produces identical deterministic sessionId');
assert(session1.sessionId.length === 24, 'Session ID is a clean 24-character hash');

// Change in resolution or ayah range should yield different session
const modifiedConfig = { ...dummyConfig, resolution: '4k' };
const session3 = renderSessionManager.computeSessionId(modifiedConfig, totalFrames, dummyOutputPath);
assert(session1.sessionId !== session3.sessionId, 'Changing resolution produces distinct session ID');

// ==========================================
// Test Group 2: Chunk Slicing & Manifest Creation
// ==========================================
console.log('\n--- Test Group 2: Chunk Slicing & Manifest Creation ---');

const { manifest, sessionDir, isResumed } = renderSessionManager.initOrCreateSession(
  dummyConfig,
  totalFrames,
  dummyOutputPath,
  true // forceFresh
);

assert(!isResumed, 'Fresh session correctly flagged as not resumed');
assert(manifest.totalDurationInFrames === 18000, 'Manifest tracks total frames accurately (18,000)');
// 18,000 frames / 900 frames per chunk = 20 chunks
assert(manifest.totalChunks === 20, `18,000 frames at 30s/chunk (900 frames) yields exactly 20 chunks (got ${manifest.totalChunks})`);
assert(manifest.chunks.length === 20, 'Manifest chunk array matches totalChunks');

// Verify contiguous frame boundaries across chunks
let contiguous = true;
for (let i = 0; i < manifest.chunks.length; i++) {
  const chunk = manifest.chunks[i];
  if (i === 0 && chunk.startFrame !== 0) contiguous = false;
  if (i > 0 && chunk.startFrame !== manifest.chunks[i - 1].endFrame + 1) contiguous = false;
  if (i === manifest.chunks.length - 1 && chunk.endFrame !== totalFrames - 1) contiguous = false;
}
assert(contiguous, 'All 20 chunks form a strictly continuous frame sequence without gaps or overlaps');

// ==========================================
// Test Group 3: Simulating Load Shedding Interruption & Recovery
// ==========================================
console.log('\n--- Test Group 3: Load Shedding Interruption & Auto-Resume ---');

// Simulate rendering 4 chunks and master audio
manifest.audioCompleted = true;
manifest.hasAudio = true;
const audioPath = path.join(sessionDir, manifest.audioFileName);
fs.writeFileSync(audioPath, Buffer.alloc(1024, 'a')); // Mock valid AAC file

for (let i = 0; i < 4; i++) {
  const chunk = manifest.chunks[i];
  const chunkVideoPath = path.join(sessionDir, chunk.videoFileName);
  fs.writeFileSync(chunkVideoPath, Buffer.alloc(2048, 'v')); // Mock valid MP4 chunk
  chunk.completed = true;
  chunk.fileSizeBytes = 2048;
}

// Simulate 5th chunk in progress when load shedding hit (power killed mid-write -> corrupt 50-byte file)
const corruptChunkPath = path.join(sessionDir, manifest.chunks[4].videoFileName);
fs.writeFileSync(corruptChunkPath, Buffer.alloc(50, 'x')); // Truncated incomplete file

// Save manifest to disk
renderSessionManager.saveManifest(sessionDir, manifest);

// Now simulate Mac restarting after power restored:
// Querying the existing session
const checkResult = renderSessionManager.checkExistingSession(dummyConfig, totalFrames, dummyOutputPath);

assert(checkResult !== null, 'Interrupted session detected upon app restart');
assert(checkResult.hasExistingSession === true, 'hasExistingSession is true');
assert(checkResult.completedChunks === 4, `Detected 4 completed chunks (got ${checkResult.completedChunks})`);
assert(checkResult.totalChunks === 20, 'Total chunks recognized as 20');
assert(checkResult.percentComplete === 20, `Progress calculated as 20% (got ${checkResult.percentComplete}%)`);

// Now simulate initiating render (resuming)
const resumed = renderSessionManager.initOrCreateSession(dummyConfig, totalFrames, dummyOutputPath, false);

assert(resumed.isResumed === true, 'Session initialized in resume mode');
assert(resumed.manifest.chunks.filter((c) => c.completed).length === 4, '4 chunks preserved');
assert(resumed.manifest.chunks[4].completed === false, 'Corrupted 5th chunk was rejected and marked incomplete');

// ==========================================
// Test Group 4: Lossless Fast Stream-Copy Stitching
// ==========================================
console.log('\n--- Test Group 4: Lossless Fast Stream-Copy Stitching ---');

// Generate 3 real 1-second video chunks with ffmpeg and a master audio file
const stitchTestDir = path.join(testCacheDir, 'stitch_test');
fs.mkdirSync(stitchTestDir, { recursive: true });

const testVideo0 = path.join(stitchTestDir, 'test_chunk_0.mp4');
const testVideo1 = path.join(stitchTestDir, 'test_chunk_1.mp4');
const testVideo2 = path.join(stitchTestDir, 'test_chunk_2.mp4');
const testAudio = path.join(stitchTestDir, 'test_audio.aac');
const testFinal = path.join(stitchTestDir, 'test_final.mp4');

execSync(
  `ffmpeg -y -f lavfi -i testsrc=duration=1:size=640x360:rate=30 -c:v libx264 -pix_fmt yuv420p "${testVideo0}" >/dev/null 2>&1`
);
execSync(
  `ffmpeg -y -f lavfi -i testsrc=duration=1:size=640x360:rate=30 -c:v libx264 -pix_fmt yuv420p "${testVideo1}" >/dev/null 2>&1`
);
execSync(
  `ffmpeg -y -f lavfi -i testsrc=duration=1:size=640x360:rate=30 -c:v libx264 -pix_fmt yuv420p "${testVideo2}" >/dev/null 2>&1`
);
execSync(
  `ffmpeg -y -f lavfi -i sine=frequency=440:duration=3 -c:a aac "${testAudio}" >/dev/null 2>&1`
);

const filelist = path.join(stitchTestDir, 'chunks.txt');
fs.writeFileSync(
  filelist,
  `file '${testVideo0.replace(/\\/g, '/')}'\nfile '${testVideo1.replace(/\\/g, '/')}'\nfile '${testVideo2.replace(/\\/g, '/')}'\n`
);

const stitchStartTime = Date.now();
execSync(
  `ffmpeg -y -hide_banner -f concat -safe 0 -i "${filelist}" -i "${testAudio}" -c:v copy -c:a copy -shortest -movflags +faststart "${testFinal}" >/dev/null 2>&1`
);
const stitchDurationMs = Date.now() - stitchStartTime;

assert(fs.existsSync(testFinal), 'Final stitched MP4 successfully generated');
assert(stitchDurationMs < 2000, `Stream-copy concatenation completed in under 2s (${stitchDurationMs}ms)`);

const probedDuration = parseFloat(
  execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${testFinal}"`)
    .toString()
    .trim()
);
assert(
  Math.abs(probedDuration - 3.0) < 0.1,
  `Final video duration matches sum of chunks (expected 3.0s, got ${probedDuration.toFixed(2)}s)`
);

const probedStreams = execSync(`ffprobe -v error -show_streams "${testFinal}" | grep codec_name`).toString();
assert(probedStreams.includes('codec_name=h264'), 'Final file retains h264 video stream');
assert(probedStreams.includes('codec_name=aac'), 'Final file retains aac audio stream');

// Clean up test cache
renderSessionManager.cleanupSession(sessionDir);
assert(!fs.existsSync(sessionDir), 'Session directory cleaned up after export');

console.log(`\n🎉 Test Suite Completed: ${passed}/${total} assertions passed!`);
