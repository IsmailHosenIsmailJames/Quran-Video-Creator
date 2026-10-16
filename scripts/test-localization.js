const fs = require('fs');
const assert = require('assert');

// Test localized data
const pubJson = JSON.parse(fs.readFileSync('public/surah_name_localization.json'));
const srcJson = JSON.parse(fs.readFileSync('src/shared/data/surah_name_localization.json'));

console.log('Testing localization dataset integrity...');
const expectedKeys = [
  'en', 'ar', 'ur', 'bn', 'id',
  'tr', 'fa', 'pa', 'ps', 'ms',
  'fr', 'ku', 'ru', 'sw', 'az',
  'kk', 'hi', 'es', 'pt', 'zh',
  'ja', 'de', 'ko', 'vi', 'ta',
  'it'
];

assert.strictEqual(Object.keys(pubJson).length, 26, 'Should have exactly 26 languages');
assert.strictEqual(Object.keys(srcJson).length, 26, 'Should have exactly 26 languages');

for (const key of expectedKeys) {
  assert(pubJson[key], `Missing key in public: ${key}`);
  assert(srcJson[key], `Missing key in src: ${key}`);
  assert.strictEqual(pubJson[key].length, 114, `${key} in public should have 114 surahs`);
  assert.strictEqual(srcJson[key].length, 114, `${key} in src should have 114 surahs`);
  assert.deepStrictEqual(pubJson[key], srcJson[key], `${key} differs between public and src`);
}
console.log('✔ All 26 languages exist with exactly 114 Surahs each.');

// Verify Bengali values
assert.strictEqual(pubJson.bn[0], 'আল-ফাতিহা');
assert.strictEqual(pubJson.bn[1], 'আল-বাকারা');
assert.strictEqual(pubJson.bn[113], 'আন-নাস');
console.log('✔ Bengali Surah names verified (1: আল-ফাতিহা, 114: আন-নাস).');

// Verify Urdu values
assert.strictEqual(pubJson.ur[0], 'الفاتحہ');
assert.strictEqual(pubJson.ur[113], 'الناس');
console.log('✔ Urdu Surah names verified (1: الفاتحہ, 114: الناس).');

// Verify Turkish values
assert.strictEqual(pubJson.tr[0], 'Fâtiha');
assert.strictEqual(pubJson.tr[113], 'Nâs');
console.log('✔ Turkish Surah names verified.');

// Verify Japanese and Italian 114 entries
assert.strictEqual(pubJson.ja[0], '開章');
assert.strictEqual(pubJson.ja[113], '人類');
assert.strictEqual(pubJson.it[0], "L'Aprente");
assert.strictEqual(pubJson.it[113], 'Gli Uomini');
console.log('✔ Japanese and Italian verified with 114 entries.');

console.log('All tests passed successfully!');
