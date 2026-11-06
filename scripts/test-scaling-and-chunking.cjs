const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Running Mobile Text Scaling & Smart Ayah Chunking Automated Test Suite...\n');

const tempOutDir = path.join(__dirname, '..', '.cache', 'chunking-test');
if (!fs.existsSync(tempOutDir)) {
  fs.mkdirSync(tempOutDir, { recursive: true });
}

// Transpile typescript modules for Node
execSync(
  `npx tsc src/shared/typography-utils.ts src/shared/surah-localization.ts --outDir "${tempOutDir}" --module commonjs --target es2020 --skipLibCheck --moduleResolution node --resolveJsonModule --esModuleInterop`,
  { stdio: 'inherit' }
);

const {
  computeAdaptiveFontSizes,
  computeAyahChunks,
  splitTranslationIntoClauses,
} = require(path.join(tempOutDir, 'typography-utils.js'));

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

// ==========================================
// Test 1: Mobile Scaling Multiplier (1.5x)
// ==========================================
console.log('--- Test Group 1: Mobile Scaling Multiplier ---');

const baseConfig = {
  arabicFontSize: 56,
  primaryFontSize: 26,
  secondaryFontSize: 21,
  aspectRatio: '16:9',
  textScaleMultiplier: 1.0,
};

const shortAyahWords = Array.from({ length: 4 }, (_, i) => ({
  id: i + 1,
  location: `1:1:${i + 1}`,
  surah: 1,
  ayah: 1,
  word: i + 1,
  text: 'كلمة',
}));

const desktopSizes = computeAdaptiveFontSizes(baseConfig, { words: shortAyahWords });
assert(desktopSizes.arabicFontSize === 56, '1.0x Scale on short ayah produces exact base Arabic font (56px)');
assert(desktopSizes.primaryFontSize === 26, '1.0x Scale produces exact base Primary font (26px)');

const mobileConfig = { ...baseConfig, textScaleMultiplier: 1.5 };
const mobileSizes = computeAdaptiveFontSizes(mobileConfig, { words: shortAyahWords });
assert(
  mobileSizes.arabicFontSize === 84,
  `1.5x Mobile Scale multiplies base font size: 56 * 1.5 = 84px (got ${mobileSizes.arabicFontSize}px)`
);
assert(
  mobileSizes.primaryFontSize === 39,
  `1.5x Mobile Scale multiplies primary subtitle: 26 * 1.5 = 39px (got ${mobileSizes.primaryFontSize}px)`
);

// Aspect ratio 9:16 floor check
const longAyahWords = Array.from({ length: 90 }, (_, i) => ({
  id: i + 1,
  location: `2:282:${i + 1}`,
  surah: 2,
  ayah: 282,
  word: i + 1,
  text: 'كلمة',
}));

const shortsConfig = { ...baseConfig, aspectRatio: '9:16', textScaleMultiplier: 1.5 };
const shortsSizes = computeAdaptiveFontSizes(shortsConfig, { words: longAyahWords });
assert(
  shortsSizes.arabicFontSize >= 35,
  `9:16 Mobile floor keeps long Ayahs legible (got ${shortsSizes.arabicFontSize}px >= 35px)`
);

// ==========================================
// Test 2: Translation Sentence & Clause Splitting
// ==========================================
console.log('\n--- Test Group 2: Translation Sentence & Clause Splitting ---');

const bengaliText =
  'আল্লাহ, তিনি ছাড়া সত্যিকারের কোন উপাস্য নেই, তিনি চিরঞ্জীব, সর্বদা রক্ষণাবেক্ষণকারী। তাঁকে তন্দ্রা ও নিদ্রা স্পর্শ করে না। আকাশমন্ডলে ও ভূমন্ডলে যা কিছু আছে, তাঁরই। কে সেই ব্যক্তি যে তাঁর অনুমতি ছাড়া তাঁর নিকট সুপারিশ করে? তিনি লোকদের সমুদয় প্রকাশ্য ও অপ্রকাশ্য অবস্থা জানেন।';

const bnClauses = splitTranslationIntoClauses(bengaliText, 5);
assert(bnClauses.length === 5, `Bengali translation splits into exactly 5 clauses (got ${bnClauses.length})`);
assert(bnClauses[0].includes('উপাস্য নেই'), 'First clause contains opening sentence');
assert(bnClauses[1].includes('তন্দ্রা ও নিদ্রা'), 'Second clause contains second sentence');

const englishText =
  'Allāh - there is no deity except Him, the Ever-Living, the Self-Sustaining. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is [presently] before them and what will be after them.';

const enClauses = splitTranslationIntoClauses(englishText, 5);
assert(enClauses.length === 5, `English translation splits into exactly 5 clauses (got ${enClauses.length})`);
assert(enClauses[0].includes('Ever-Living'), 'First English clause matches opening sentence');

// ==========================================
// Test 3: Smart Ayah Chunking on Ayat al-Kursi (50 Words)
// ==========================================
console.log('\n--- Test Group 3: Smart Ayah Chunking on Long Ayah (Ayat al-Kursi) ---');

// Mock 50 words with waqf markers at words 7, 12, 19, 26, 32, 40, 44, 47, 50
const mockWords = Array.from({ length: 50 }, (_, i) => {
  const wordIdx = i + 1;
  const isWaqf = [7, 12, 19, 26, 32, 40, 44, 47, 50].includes(wordIdx);
  return {
    id: wordIdx,
    location: `2:255:${wordIdx}`,
    surah: 2,
    ayah: 255,
    word: wordIdx,
    text: `word_${wordIdx}` + (isWaqf ? ' ۚ' : ''),
    hasWaqf: isWaqf,
  };
});

// Mock segments spanning 50 seconds (50000ms), 1 sec per word
const mockSegments = mockWords.map((w, i) => ({
  wordIndex: w.word,
  startMs: i * 1000 + 100,
  endMs: i * 1000 + 900,
}));

const mockAyahData = {
  surah: 2,
  ayah: 255,
  surahNameArabic: 'البقرة',
  surahNameTransliterated: 'Al-Baqarah',
  words: mockWords,
  primaryTranslation: bengaliText,
  secondaryTranslation: englishText,
  audioUrl: '/audio/002255.mp3',
  durationInFrames: 1500, // 50 seconds at 30fps
  segments: mockSegments,
};

const chunkingConfig = {
  enableAyahChunking: true,
  maxWordsPerChunk: 10,
  fps: 30,
  splitTranslationsWithChunks: true,
};

const chunks = computeAyahChunks(mockAyahData, chunkingConfig);
assert(chunks.length > 1, `Ayat al-Kursi is split into multiple manageable chunks (got ${chunks.length} chunks)`);
assert(
  chunks.every((c) => c.words.length <= 12),
  `All chunks have reasonable word counts <= 12 words (max chunk size: ${Math.max(...chunks.map((c) => c.words.length))})`
);

// Verify timeline continuity
let timelineValid = true;
for (let i = 0; i < chunks.length - 1; i++) {
  if (chunks[i].endMs !== chunks[i + 1].startMs) {
    timelineValid = false;
    break;
  }
}
assert(timelineValid, 'Chunk timelines are contiguous with ZERO blank gaps between consecutive chunks');
assert(chunks[0].startMs === 0, 'First chunk starts at 0ms');
assert(chunks[chunks.length - 1].endMs >= 50000, 'Last chunk covers full duration of the verse');

// ==========================================
// Test 4: Short Ayah Unchunked Bypass
// ==========================================
console.log('\n--- Test Group 4: Short Ayah Bypass (< 10 words) ---');

const shortAyahData = {
  surah: 1,
  ayah: 1,
  surahNameArabic: 'الفاتحة',
  surahNameTransliterated: 'Al-Fatihah',
  words: shortAyahWords,
  primaryTranslation: 'পরম করুণাময় অসীম দয়ালু আল্লাহর নামে শুরু করছি।',
  secondaryTranslation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
  audioUrl: '/audio/001001.mp3',
  durationInFrames: 150,
  segments: shortAyahWords.map((w, i) => ({
    wordIndex: w.word,
    startMs: i * 1000,
    endMs: i * 1000 + 800,
  })),
};

const shortChunks = computeAyahChunks(shortAyahData, chunkingConfig);
assert(shortChunks.length === 1, `Short Ayah (4 words) remains 1 single chunk without splitting (got ${shortChunks.length})`);
assert(shortChunks[0].words.length === 4, 'Chunk holds all 4 words');

console.log(`\n==========================================`);
console.log(`Results: ${passed} / ${total} tests passed.`);
console.log(`==========================================\n`);

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
