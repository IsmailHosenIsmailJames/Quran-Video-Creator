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

// 1. Test Timestamp Calculation (Bengali & English)
console.log('\nTesting 1: Chapter Timestamps Calculation (Bengali Mode)...');
const timestampsBn = calculateYouTubeTimestamps(mockConfig, mockAyahs, { language: 'bn', digitFormat: 'bengali' });

console.log('  - Chapters Generated: ' + timestampsBn.length);
console.log('  - First Chapter Time: ' + timestampsBn[0].timeFormatted + ' (' + timestampsBn[0].label + ')');
console.log('  - Ayah 1 Start Time: ' + timestampsBn[1].timeFormatted + ' (' + timestampsBn[1].label + ')');
console.log('  - Outro Time: ' + timestampsBn[timestampsBn.length - 1].timeFormatted);

const startsAtZero = timestampsBn[0].timeFormatted === '00:00';
const hasCorrectIntroOffset = timestampsBn[1].seconds >= 7.0 && timestampsBn[1].seconds <= 8.0;
const hasBengaliAyahLabel = timestampsBn[1].label === 'আয়াত ১';
console.log('  - YouTube 00:00 Compliance: ' + (startsAtZero ? '✅ PASS' : '❌ FAIL'));
console.log('  - Intro & Title Card Timing Offset: ' + (hasCorrectIntroOffset ? '✅ PASS' : '❌ FAIL'));
console.log('  - Bengali Ayah Label (আয়াত ১): ' + (hasBengaliAyahLabel ? '✅ PASS' : '❌ FAIL'));

if (!startsAtZero || !hasCorrectIntroOffset || !hasBengaliAyahLabel) allPassed = false;

// 2. Test Titles Generation (Bengali Clean Standard)
console.log('\nTesting 2: Clean Bengali Title Generation...');
const titlesBn = generateYouTubeTitles(mockConfig, mockReciter, { language: 'bn', digitFormat: 'bengali' });
console.log('  - Titles Formulated: ' + titlesBn.length);
titlesBn.forEach((t) => console.log('    • [' + t.label + ']: ' + t.text));

const titlesValidBn =
  titlesBn.length >= 4 &&
  titlesBn.some((t) => t.text.includes('সূরা আল-মুলক')) &&
  titlesBn.some((t) => t.text.includes('মিশারি রাশিদ আল-আফাসি'));
console.log('  - Bengali Title Templates Valid: ' + (titlesValidBn ? '✅ PASS' : '❌ FAIL'));
if (!titlesValidBn) allPassed = false;

// 3. Test Description Generation (Bengali Clean Mode - Zero Fluff)
console.log('\nTesting 3: Bengali Clean Description (Zero Fluff)...');
const descriptionBn = generateYouTubeDescription(mockConfig, mockAyahs, mockReciter, {
  ...DEFAULT_DESCRIPTION_OPTIONS,
  language: 'bn',
  mode: 'clean',
  digitFormat: 'bengali',
});

const hasSurahBn = descriptionBn.includes('সূরা আল-মুলক');
const hasReciterBn = descriptionBn.includes('মিশারি রাশিদ আল-আফাসি');
const hasAyahCountBn = descriptionBn.includes('আয়াত সংখ্যা:');
const hasTimelineBn = descriptionBn.includes('সময়সূচী / টাইমলাইন:') && descriptionBn.includes('00:07 - আয়াত ১');
const hasHashtagsBn = descriptionBn.includes('#সূরা_আল_মুলক');
const hasNoFluff = !descriptionBn.includes('━━━━━━━━━━━━━━━━━━━━━━━━━') && !descriptionBn.includes('Subscribe');

console.log('  - Surah Header Present: ' + (hasSurahBn ? '✅ PASS' : '❌ FAIL'));
console.log('  - Bengali Reciter Present: ' + (hasReciterBn ? '✅ PASS' : '❌ FAIL'));
console.log('  - Ayah Metadata Present: ' + (hasAyahCountBn ? '✅ PASS' : '❌ FAIL'));
console.log('  - Ayah Timeline Present: ' + (hasTimelineBn ? '✅ PASS' : '❌ FAIL'));
console.log('  - Clean Hashtags Present: ' + (hasHashtagsBn ? '✅ PASS' : '❌ FAIL'));
console.log('  - Zero Fluff & No Extraneous Text: ' + (hasNoFluff ? '✅ PASS' : '❌ FAIL'));

if (!hasSurahBn || !hasReciterBn || !hasAyahCountBn || !hasTimelineBn || !hasHashtagsBn || !hasNoFluff) {
  allPassed = false;
}

// 4. Test English Compatibility
console.log('\nTesting 4: English Mode Compatibility...');
const titlesEn = generateYouTubeTitles(mockConfig, mockReciter, { language: 'en' });
const descEn = generateYouTubeDescription(mockConfig, mockAyahs, mockReciter, {
  ...DEFAULT_DESCRIPTION_OPTIONS,
  language: 'en',
  mode: 'detailed',
});
const enTitlesValid = titlesEn.length >= 4 && titlesEn.some((t) => t.text.includes('Al-Mulk'));
const enDescValid = descEn.includes('Surah Al-Mulk') && descEn.includes('00:00');
console.log('  - English Titles Valid: ' + (enTitlesValid ? '✅ PASS' : '❌ FAIL'));
console.log('  - English Detailed Description Valid: ' + (enDescValid ? '✅ PASS' : '❌ FAIL'));
if (!enTitlesValid || !enDescValid) allPassed = false;

// 5. Test YouTube Tags
console.log('\nTesting 5: YouTube Tags Character Compliance...');
const tagsBn = generateYouTubeTags(mockConfig, mockReciter, { language: 'bn' });
const tagsString = tagsBn.join(', ');
console.log('  - Total Tags: ' + tagsBn.length);
console.log('  - Tags Character Count: ' + tagsString.length + ' / 500 characters');
const tagsUnderLimit = tagsString.length <= 500;
console.log('  - Under 500 Character Limit: ' + (tagsUnderLimit ? '✅ PASS' : '❌ FAIL'));
if (!tagsUnderLimit) allPassed = false;

// 6. Test Full Kit Text Export
console.log('\nTesting 6: Full Text Export File Generation...');
const fullKitBn = formatFullYouTubeKitText(mockConfig, mockAyahs, mockReciter, titlesBn[0].text, {
  ...DEFAULT_DESCRIPTION_OPTIONS,
  language: 'bn',
  mode: 'clean',
});
const kitValid = fullKitBn.includes('কুরআন ভিডিও স্টুডিও') && fullKitBn.length > 200;
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
