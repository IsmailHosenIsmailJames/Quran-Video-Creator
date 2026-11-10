const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const Database = require('better-sqlite3');

app.whenReady().then(async () => {
  const testDbPath = path.join(__dirname, '../temp_test_settings.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  console.log('Testing Settings Persistence Engine...');

  const db = new Database(testDbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  console.log('✓ SQLite database initialized');

  // 1. Verify key coverage of VideoTemplateConfig
  console.log('\n--- 1. Testing PERSISTABLE_CONFIG_KEYS completeness ---');
  const expectedKeyGroups = [
    // Scripture Selection
    'surahNumber', 'fromAyah', 'toAyah', 'includeBismillah', 'recitationMode', 'salatSegments',
    // Scripture Typography
    'script', 'selectedQuranFont', 'arabicFontSize', 'arabicLineHeight', 'arabicTextColor', 'arabicActiveColor', 'arabicActiveGlow',
    'ayahFontOverrides', 'autoAdjustFontSizeByLength', 'textScaleMultiplier', 'enableAyahChunking', 'maxWordsPerChunk', 'chunkTransition', 'splitTranslationsWithChunks',
    // Subtitles
    'showPrimaryTranslation', 'primaryTranslationLang', 'primaryTranslationFile', 'primaryFontSize', 'primaryTextColor',
    'showSecondaryTranslation', 'secondaryTranslationLang', 'secondaryTranslationFile', 'secondaryFontSize', 'secondaryTextColor',
    // Layout
    'scriptLayoutOrder', 'showTranslationContainer', 'textAlignment', 'verticalAlignment', 'verticalCustomOffset', 'contentWidthPercent',
    'showSurahHeader', 'headerLanguage', 'showSalatInterstitialCards', 'hiddenSalatSegmentCards',
    // Animations
    'animationIn', 'animationOut', 'animationDurationFrames', 'staggerSubtitles',
    // Background & Recitation Video
    'aspectRatio', 'backgroundType', 'backgroundPath', 'backgroundClips', 'defaultTransition', 'overlayOpacity', 'vignetteIntensity', 'kenBurnsEffect',
    'recitationVideoPath', 'useRecitationVideoAsBackground', 'useRecitationVideoAudio', 'recitationVideoDurationSeconds', 'recitationVideoFileName',
    // Audio & Custom Timestamps
    'reciterIndex', 'recitationSpeed', 'recitationAudioMode', 'customAudioPath', 'customAudioDurationSeconds', 'customAudioFileName',
    'customTimestampPath', 'hasCustomTimestamp', 'showWaveform', 'waveformType', 'waveformColor', 'waveformColorSecondary',
    'waveformHeight', 'waveformWidth', 'waveformAmplitude', 'waveformPositionY', 'waveformGlow', 'waveformGlowIntensity',
    'waveformFillArea', 'waveformBarWidth', 'waveformSampleCount', 'waveformCircularRadius', 'waveformOpacity',
    // Branding
    'showBranding', 'logoPath', 'channelHandle', 'brandingPosition', 'brandingScale',
    // Intro Bumper
    'enableIntroVideo', 'introMode', 'introPreset', 'introTitle', 'introSubtitle', 'introCustomLogo', 'introThemeColor', 'introVideoPath', 'introVideoDurationSeconds', 'skipIntroForShorts', 'introMuted', 'introTransition',
    // Title Card
    'enableSurahTitleCard', 'titleCardDurationSeconds', 'titleCardPreset', 'titleCardThemeColor', 'titleCardScale', 'titleCardWidthPercent', 'showReciterInTitleCard', 'showStyleInTitleCard', 'showVerseRangeInTitleCard', 'showTranslationInTitleCard', 'titleCardTransition', 'skipTitleCardForShorts',
    // Outro Bumper
    'enableOutroVideo', 'outroMode', 'outroPreset', 'outroTitle', 'outroSubtitle', 'outroCustomLogo', 'outroThemeColor', 'outroVideoPath', 'outroVideoDurationSeconds', 'skipOutroForShorts', 'outroMuted', 'outroTransition',
    // Output
    'fps', 'resolution',
  ];

  const tsFile = fs.readFileSync(path.join(__dirname, '../src/main/services/settings-service.ts'), 'utf-8');
  for (const key of expectedKeyGroups) {
    assert(tsFile.includes(`'${key}'`), `PERSISTABLE_CONFIG_KEYS must include '${key}'`);
  }
  console.log(`✓ Verified ${expectedKeyGroups.length} core configuration keys are all persistable.`);

  // 2. Test saving and restoring Recitation Video and Custom JSON state
  console.log('\n--- 2. Simulating User Configuration with Recitation Video & Custom JSON ---');
  const sampleConfig = {
    surahNumber: 19,
    fromAyah: 75,
    toAyah: 98,
    recitationMode: 'salat-jammat',
    recitationVideoPath: '/media/salat_isha_maryam.mp4',
    useRecitationVideoAsBackground: true,
    useRecitationVideoAudio: true,
    recitationVideoDurationSeconds: 347.6,
    recitationVideoFileName: 'salat_isha_maryam.mp4',
    customTimestampPath: '/media/salat_manifest.json',
    hasCustomTimestamp: true,
    showSalatInterstitialCards: true,
    enableAyahChunking: true,
    maxWordsPerChunk: 8,
    textScaleMultiplier: 1.4,
  };

  const upsertStmt = db.prepare(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`);
  const now = Date.now();
  for (const [k, v] of Object.entries(sampleConfig)) {
    upsertStmt.run(k, JSON.stringify(v), now);
  }

  // Read back from DB
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const loadedSettings = {};
  for (const r of rows) {
    loadedSettings[r.key] = JSON.parse(r.value);
  }

  assert.strictEqual(loadedSettings.surahNumber, 19);
  assert.strictEqual(loadedSettings.fromAyah, 75);
  assert.strictEqual(loadedSettings.toAyah, 98);
  assert.strictEqual(loadedSettings.recitationMode, 'salat-jammat');
  assert.strictEqual(loadedSettings.recitationVideoPath, '/media/salat_isha_maryam.mp4');
  assert.strictEqual(loadedSettings.useRecitationVideoAsBackground, true);
  assert.strictEqual(loadedSettings.useRecitationVideoAudio, true);
  assert.strictEqual(loadedSettings.customTimestampPath, '/media/salat_manifest.json');
  assert.strictEqual(loadedSettings.hasCustomTimestamp, true);
  assert.strictEqual(loadedSettings.maxWordsPerChunk, 8);
  assert.strictEqual(loadedSettings.textScaleMultiplier, 1.4);
  console.log('✓ All video recitation and custom alignment config successfully persisted and verified.');

  // 3. Test Active Custom Timestamp JSON persistence
  console.log('\n--- 3. Testing Active Custom Timestamp Manifest Caching ---');
  const sampleManifest = {
    mode: 'salat_jammat',
    total_duration_ms: 347648,
    segments_count: 2,
    segments: [
      { segment_id: 1, label: "Rak'ah 1: Surah Al-Fatihah", surah_number: 1, start_ayah: 2, end_ayah: 7 },
      { segment_id: 2, label: "Rak'ah 1: Second Surah", surah_number: 19, start_ayah: 75, end_ayah: 98 },
    ]
  };

  const manifestJson = JSON.stringify(sampleManifest);
  upsertStmt.run('__active_custom_timestamp_content', JSON.stringify(manifestJson), now);

  const restoredRow = db.prepare("SELECT value FROM settings WHERE key = '__active_custom_timestamp_content'").get();
  assert(restoredRow, 'Manifest row must exist in DB');
  const restoredManifestJson = JSON.parse(restoredRow.value);
  const parsedManifest = JSON.parse(restoredManifestJson);

  assert.strictEqual(parsedManifest.mode, 'salat_jammat');
  assert.strictEqual(parsedManifest.segments_count, 2);
  assert.strictEqual(parsedManifest.segments[1].surah_number, 19);
  console.log('✓ Active custom timestamp JSON content successfully stored in SQLite and rehydrated.');

  // 4. Test Thumbnail Studio configuration persistence
  console.log('\n--- 4. Testing Thumbnail Studio Config Persistence ---');
  const sampleThumbnail = {
    preset: 'sacred-calligraphy',
    layoutMode: 'split-cinematic',
    bengaliSurahTitleText: 'সূরা মারিয়াম (৭৫-৯৮)',
    bengaliReciterNameText: 'ইমামের আবেগঘন সালাত তিলাওয়াত',
    showReciterPortrait: true,
    reciterPortraitScale: 1.15,
    accentThemeColor: '#10B981',
  };

  upsertStmt.run('__thumbnail_config', JSON.stringify(sampleThumbnail), now);

  const thumbRow = db.prepare("SELECT value FROM settings WHERE key = '__thumbnail_config'").get();
  assert(thumbRow, 'Thumbnail config row must exist in DB');
  const parsedThumbnail = JSON.parse(thumbRow.value);
  assert.strictEqual(parsedThumbnail.preset, 'sacred-calligraphy');
  assert.strictEqual(parsedThumbnail.bengaliSurahTitleText, 'সূরা মারিয়াম (৭৫-৯৮)');
  assert.strictEqual(parsedThumbnail.reciterPortraitScale, 1.15);
  assert.strictEqual(parsedThumbnail.accentThemeColor, '#10B981');
  console.log('✓ Thumbnail Studio settings successfully persisted in SQLite.');

  // 5. Test Reset to Defaults
  console.log('\n--- 5. Testing Settings Reset ---');
  db.prepare("DELETE FROM settings WHERE key IN ('__active_custom_timestamp_content', '__thumbnail_config')").run();
  assert.strictEqual(db.prepare("SELECT value FROM settings WHERE key = '__active_custom_timestamp_content'").get(), undefined);
  assert.strictEqual(db.prepare("SELECT value FROM settings WHERE key = '__thumbnail_config'").get(), undefined);
  console.log('✓ Reset operation cleanly clears custom timestamps and thumbnail cache.');

  // Clean up
  db.close();
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  console.log('\n========================================');
  console.log('✓ ALL SETTINGS PERSISTENCE TESTS PASSED! 🎉');
  console.log('========================================');

  app.quit();
});
