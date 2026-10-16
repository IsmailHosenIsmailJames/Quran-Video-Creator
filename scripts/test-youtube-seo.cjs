const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Compiling and running YouTube SEO & Timestamp Kit Automated Test Suite...\n');

const tempOutDir = path.join(__dirname, '..', '.cache', 'seo-test');
if (!fs.existsSync(tempOutDir)) {
  fs.mkdirSync(tempOutDir, { recursive: true });
}

// Transpile typescript modules for Node
execSync(
  `npx tsc src/shared/youtube-seo-generator.ts src/shared/surahs.ts src/shared/surah-localization.ts --outDir "${tempOutDir}" --module commonjs --target es2020 --skipLibCheck --moduleResolution node --resolveJsonModule --esModuleInterop`,
  { stdio: 'inherit' }
);

const {
  calculateYouTubeTimestamps,
  formatTimestampsForYouTube,
  generateYouTubeTitles,
  generateYouTubeDescription,
  generateYouTubeTags,
  formatFullYouTubeKitText,
  DEFAULT_DESCRIPTION_OPTIONS,
} = require(path.join(tempOutDir, 'youtube-seo-generator.js'));

// Mock data representing Surah Al-Mulk (67: 1-5)
const mockConfig = {
  surahNumber: 67,
  fromAyah: 1,
  toAyah: 5,
  fps: 30,
  enableIntroVideo: true,
  introVideoDurationSeconds: 4,
  enableSurahTitleCard: true,
  titleCardDurationSeconds: 3.5,
  enableOutroVideo: true,
  outroVideoDurationSeconds: 4,
  primaryTranslationLang: 'English',
  primaryTranslationFile: 'Saheeh_International.json.txt',
  showPrimaryTranslation: true,
  showSecondaryTranslation: false,
};

const mockReciter = {
  name: 'Mishari Rashid Al-Afasy',
  style: 'Murattal',
  link: 'https://everyayah.com/data/Alafasy_128kbps',
};

const mockAyahs = [
  {
    surah: 67,
    ayah: 1,
    durationInFrames: 360, // 12 seconds
    words: [{ id: 1, text: 'تَبَارَكَ' }, { id: 2, text: 'الَّذِي' }, { id: 3, text: 'بِيَدِهِ' }, { id: 4, text: 'الْمُلْكُ' }],
    primaryTranslation: 'Blessed is He in whose hand is dominion, and He is over all things competent.',
  },
  {
    surah: 67,
    ayah: 2,
    durationInFrames: 420, // 14 seconds
    words: [{ id: 1, text: 'الَّذِي' }, { id: 2, text: 'خَلَقَ' }, { id: 3, text: 'الْمَوْتَ' }, { id: 4, text: 'وَالْحَيَاةَ' }],
    primaryTranslation: '[He] who created death and life to test you [as to] which of you is best in deed.',
  },
  {
    surah: 67,
    ayah: 3,
    durationInFrames: 390, // 13 seconds
    words: [{ id: 1, text: 'الَّذِي' }, { id: 2, text: 'خَلَقَ' }, { id: 3, text: 'سَبْعَ' }, { id: 4, text: 'سَمَاوَاتٍ' }],
    primaryTranslation: '[And] who created seven heavens in layers.',
  },
  {
    surah: 67,
    ayah: 4,
    durationInFrames: 330, // 11 seconds
    words: [{ id: 1, text: 'ثُمَّ' }, { id: 2, text: 'ارْجِعِ' }, { id: 3, text: 'الْبَصَرَ' }],
    primaryTranslation: 'Then return [your] vision twice again. [Your] vision will return to you humbled.',
  },
  {
    surah: 67,
    ayah: 5,
    durationInFrames: 300, // 10 seconds
    words: [{ id: 1, text: 'وَلَقَدْ' }, { id: 2, text: 'زَيَّنَّا' }, { id: 3, text: 'السَّمَاءَ' }],
    primaryTranslation: 'And We have certainly beautified the nearest heaven with stars.',
  },
];

let allPassed = true;

// 1. Test Timestamp Calculation
console.log('\nTesting 1: Chapter Timestamps Calculation...');
const timestamps = calculateYouTubeTimestamps(mockConfig, mockAyahs);

console.log('  - Chapters Generated: ' + timestamps.length);
console.log('  - First Chapter Time: ' + timestamps[0].timeFormatted + ' (' + timestamps[0].label + ')');
console.log('  - Ayah 1 Start Time: ' + timestamps[1].timeFormatted + ' (' + timestamps[1].label + ')');
console.log('  - Outro Time: ' + timestamps[timestamps.length - 1].timeFormatted);

const startsAtZero = timestamps[0].timeFormatted === '00:00';
const hasCorrectIntroOffset = timestamps[1].seconds >= 7.0 && timestamps[1].seconds <= 8.0; // 4s intro + 3.5s title card = 7.5s (00:07)
console.log('  - YouTube 00:00 Compliance: ' + (startsAtZero ? '✅ PASS' : '❌ FAIL'));
console.log('  - Intro & Title Card Timing Offset: ' + (hasCorrectIntroOffset ? '✅ PASS' : '❌ FAIL'));

if (!startsAtZero || !hasCorrectIntroOffset) allPassed = false;

// 2. Test Titles Generation
console.log('\nTesting 2: High-CTR Title Generation...');
const titles = generateYouTubeTitles(mockConfig, mockReciter);
console.log('  - Titles Formulated: ' + titles.length);
titles.forEach((t) => console.log('    • [' + t.label + ']: ' + t.text));

const titlesValid =
  titles.length >= 4 &&
  titles.every((t) => t.text.includes('Al-Mulk')) &&
  titles.filter((t) => t.text.includes('Al-Afasy')).length >= 3;
console.log('  - Title Templates Valid: ' + (titlesValid ? '✅ PASS' : '❌ FAIL'));
if (!titlesValid) allPassed = false;

// 3. Test Description Generation
console.log('\nTesting 3: YouTube Description Generation...');
const description = generateYouTubeDescription(mockConfig, mockAyahs, mockReciter, DEFAULT_DESCRIPTION_OPTIONS);

const hasHook = description.includes('Surah Al-Mulk');
const hasVirtue = description.includes('VIRTUES & BENEFITS OF SURAH AL-MULK') && description.includes('intercede');
const hasChapters = description.includes('VIDEO CHAPTERS / TIMESTAMPS') && description.includes('00:00');
const hasInfo = description.includes('SURAH INFORMATION') && description.includes('67');
const hasCredits = description.includes('AUDIO & TRANSLATION CREDITS') && description.includes('Mishari');
const hasHashtags = description.includes('#SurahAlMulk') && description.includes('#Quran');

console.log('  - Hook Section Present: ' + (hasHook ? '✅ PASS' : '❌ FAIL'));
console.log('  - Hadith & Virtues Section Present: ' + (hasVirtue ? '✅ PASS' : '❌ FAIL'));
console.log('  - YouTube Chapters Section Present: ' + (hasChapters ? '✅ PASS' : '❌ FAIL'));
console.log('  - Surah Metadata Section Present: ' + (hasInfo ? '✅ PASS' : '❌ FAIL'));
console.log('  - Reciter & Translation Section Present: ' + (hasCredits ? '✅ PASS' : '❌ FAIL'));
console.log('  - Hashtags Present: ' + (hasHashtags ? '✅ PASS' : '❌ FAIL'));

if (!hasHook || !hasVirtue || !hasChapters || !hasInfo || !hasCredits || !hasHashtags) {
  allPassed = false;
}

// 4. Test YouTube Tags
console.log('\nTesting 4: YouTube Tags Character Compliance...');
const tags = generateYouTubeTags(mockConfig, mockReciter);
const tagsString = tags.join(', ');
console.log('  - Total Tags: ' + tags.length);
console.log('  - Tags Character Count: ' + tagsString.length + ' / 500 characters');
const tagsUnderLimit = tagsString.length <= 500;
console.log('  - Under 500 Character Limit: ' + (tagsUnderLimit ? '✅ PASS' : '❌ FAIL'));
if (!tagsUnderLimit) allPassed = false;

// 5. Test Full Kit Text Export
console.log('\nTesting 5: Full Text Export File Generation...');
const fullKit = formatFullYouTubeKitText(mockConfig, mockAyahs, mockReciter, titles[0].text);
const kitValid = fullKit.includes('QURAN VIDEO STUDIO - YOUTUBE METADATA & SEO KIT') && fullKit.length > 500;
console.log('  - Full Kit Export String Valid: ' + (kitValid ? '✅ PASS' : '❌ FAIL'));
if (!kitValid) allPassed = false;

console.log('\n==================================================');
if (allPassed) {
  console.log('🎉 ALL YOUTUBE SEO & TIMESTAMP TESTS PASSED!');
} else {
  console.error('❌ Some tests failed.');
  process.exit(1);
}
console.log('==================================================\n');
