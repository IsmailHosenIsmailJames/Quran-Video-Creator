# Master Engineering Prompt: Desktop Quran Video Production Studio ("Quran Video Creator")

You are an expert desktop application architect, motion graphics engineer, and senior TypeScript/React specialist. Your mission is to build a production-grade, highly aesthetic desktop application for macOS and Windows called **"Quran Video Creator"** (or **"Quran Video Studio"**).

The application automates the generation of cinematic, high-engagement Quran recitation videos matching the visual style of elite channels such as **@AnNafee_Official** (calm cinematic ambient backgrounds, deep vignette grading, dynamic subtle audio waveforms, multi-tier typography with complex Arabic vocalization marks, Bengali and English translations, synchronized word-by-word karaoke illumination, and animated channel branding).

The application is completely self-contained and operates offline using the rich local assets bundled in the project workspace:
1. **Local Multi-Script Quran SQLite Engine:** 3 complete word-by-word SQLite databases (`imlaei.db`, `indopak-nastaleeq.db`, `qpc-nastaleeq.db`) containing all 6,236 Ayahs and 83,668 atomic words with exact 1-indexed word positioning for zero-latency lookups.
2. **Local Offline Translation Library:** 91 languages and hundreds of translator editions in `compressed_translation_simple/` (compressed with BZip2 and Base64 encoded), allowing complete offline multi-language subtitle generation.
3. **Bundled Typography Suite:** 12 authentic Quranic and display fonts in `Quran fonts/` covering Uthmani, IndoPak Nastaleeq, Naskh, and a dedicated `surah-name-v1.ttf` calligraphic ligature font for Surah titles.
4. **Recitation & Word-Level Synchronization Pipeline:** 43 curated reciters in `recitations.json` across Murattal, Mujawwad, and Warsh styles, including 15 reciters with pre-computed word-by-word timing manifests (`segments_url`), with multi-CDN audio streaming and local audio upload support.

Build this application using **Electron**, **React 18+**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Remotion**. Follow the comprehensive architectural, typographical, and media processing specifications below.

---

## 1. System Architecture & Technology Stack

The application operates with a strict separation between the desktop user interface, the local offline data engines, and the programmatic media rendering engine:

* **Desktop Shell:** Electron (v30+) with TypeScript and Vite.
* **User Interface:** React 18+, Tailwind CSS 3.4+, Radix UI / Lucide React icons, Zustand for studio state management.
* **Video Compositing & Rendering Engine:** Remotion 4.0+ (`remotion`, `@remotion/player`, `@remotion/renderer`, `@remotion/media-utils`, `@remotion/bundler`).
* **Local Scripture Database Engine:** Embedded SQLite (`better-sqlite3`) querying the bundled databases in `Quran Scripts/` for atomic, word-by-word Arabic text.
* **Offline Translation Engine:** In-memory decompressor using pure JavaScript / Node.js BZip2 decoding (`seek-bzip`) to unpack translation JSON files on demand from `compressed_translation_simple/`.
* **Recitation & Audio Pipeline:** Pre-configured multi-reciter metadata catalog (`recitations.json`) supporting direct CDN audio streaming (Tarteel CDN, Quran Foundation, EveryAyah, QuranicAudio mirror), local audio file uploads, and cached word-by-word timestamp manifests (`segments_url`).

---

## 2. Workspace Assets & Project Directory Structure

The application builds directly upon the existing assets located in the project root:

```
Quran-Video-Creator/
├── Quran Scripts/                          // Local Word-by-Word SQLite Databases
│   ├── imlaei.db                           // Standard Imlaei vocalized script (83,668 words)
│   ├── indopak-nastaleeq.db                // IndoPak Nastaleeq script (83,668 words)
│   └── qpc-nastaleeq.db                    // Madinah King Fahd Complex Hafs script (83,668 words)
├── Quran fonts/                            // Production Typography Suite
│   ├── surah-name-v1.ttf                   // Calligraphic Surah title ligature font
│   ├── KFGQPC Uthmanic Script HAFS Regular.otf // Official King Fahd Complex font
│   ├── QPC Hafs font.ttf                   // QPC Hafs font
│   ├── Indopak Nastaleeq font.ttf          // IndoPak QuranWBW Nastaleeq font
│   ├── Al Qalam Quran Majeed Web Regular.ttf // South Asian Quran font
│   ├── Amiri Regular.ttf                   // Classical Naskh typography
│   ├── Lateef Regular.ttf                  // Lateef script font
│   ├── me_quran_volt_newmet.ttf            // Madinah me_quran font
│   ├── noorehira Regular.ttf               // IndoPak Noorehira font
│   ├── noorehuda Regular.ttf               // IndoPak Noorehuda font
│   └── AlQuranNeov5x1.ttf                  // Digital Quran font
├── compressed_translation_simple/          // Offline Multi-Lingual Library (91 Languages)
│   ├── Bengali/                            // Taisirul_Quran, Sheikh_Mujibur_Rahman, Dr._Abu_Bakr_Muhammad_Zakaria, etc.
│   ├── English/                            // Saheeh_International, Abdul_Haleem, Abdullah_Yusuf_Ali, etc.
│   ├── Urdu/                               // Maududi, Jalandhry, Taqi_Usmani, etc.
│   ├── Hindi/, Indonesian/, Turkish/, ...  // 91 languages total (Base64 + BZip2 encoded .json.txt)
│   └── With_footnotes/                     // Additional scholarly editions
├── recitations.json                        // 43 reciters catalog with styles & segment manifest URLs
├── README.md                               // Decompression algorithms & font usage hints
└── src/                                    // Application Source Code
    ├── shared/                             // Shared TypeScript Types & Surah Metadata
    │   ├── types.ts                        // Universal TypeScript interfaces
    │   ├── constants.ts                    // App constants & default template settings
    │   └── surahs.ts                       // 114 Surahs catalog (Ayah counts, English & Arabic names)
    ├── main/                               // Electron Main Process
    │   ├── index.ts                        // App lifecycle, BrowserWindow creation & ASAR paths
    │   ├── ipc-handlers.ts                 // IPC routing between UI and background services
    │   ├── services/
    │   │   ├── quran-db.ts                 // Multi-script SQLite queries via better-sqlite3
    │   │   ├── translation-service.ts      // Base64 + BZip2 decompressor & memory cache
    │   │   ├── recitation-service.ts       // Audio resolver & segments manifest cache
    │   │   ├── audio-service.ts            // Local audio upload & stream handler
    │   │   └── remotion-runner.ts          // Headless @remotion/renderer execution
    ├── preload/
    │   └── index.ts                        // Strongly typed contextBridge API
    ├── renderer/                           // React Studio UI
    │   ├── index.html
    │   ├── index.css                       // @font-face rules & typography tokens
    │   ├── main.tsx
    │   ├── store/
    │   │   └── studio-store.ts             // Zustand studio state (scripture, styling, audio, layout)
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Header.tsx              // App bar, export button, theme toggle
    │   │   │   └── StudioLayout.tsx        // Split-screen editor layout
    │   │   ├── controls/
    │   │   │   ├── ScriptureTab.tsx        // Surah, Ayah range, Script & Font selection
    │   │   │   ├── SubtitlesTab.tsx        // Dual translation picker (Bengali + English)
    │   │   │   ├── VisualsTab.tsx          // Background footage, Ken Burns, vignette, overlay
    │   │   │   ├── AudioWaveformTab.tsx    // Reciter picker, custom audio upload, waveform styling
    │   │   │   └── BrandingTab.tsx         // Channel watermark, handle, entrance animation
    │   │   ├── preview/
    │   │   │   ├── VideoPlayer.tsx         // Embedded @remotion/player live canvas
    │   │   │   └── PlayerControls.tsx      // Timeline scrubbing, play/pause, timecode
    │   │   └── modals/
    │   │       └── ExportModal.tsx         // Resolution, FPS, CRF bitrate, live render progress
    └── remotion/                           // Video Rendering Compositions
        ├── Root.tsx                        // Composition registry & schema definitions
        ├── index.ts                        // Remotion entry point for standalone bundler
        ├── compositions/
        │   ├── QuranVideoComposition.tsx   // Root composition orchestrating the 4 layers
        │   ├── BackgroundLayer.tsx         // Cinematic video/image + Ken Burns + vignette
        │   ├── WaveformLayer.tsx           // Audio-reactive SVG waveform / frequency bars
        │   ├── TypographyLayer.tsx         // Surah badge + Word-by-word Arabic + Dual Subtitles
        │   └── BrandingLayer.tsx           // Animated watermark & social handle
        └── utils/
            ├── time-sync.ts                // Frame-to-millisecond karaoke mapper
            └── waveform-calc.ts            // Frequency point smoothing and bezier curves
```

---

## 3. Universal Data Contracts & TypeScript Types (`src/shared/types.ts`)

Define all core data models in `src/shared/types.ts` to ensure end-to-end type safety:

```typescript
// ==========================================
// 1. Scripture & Word Data Models
// ==========================================
export interface QuranWord {
  id: number;
  location: string;    // "surah:ayah:word" e.g. "1:1:1"
  surah: number;
  ayah: number;
  word: number;        // 1-based index within the Ayah
  text: string;        // Vocalized Arabic word or Ayah marker glyph
}

export type ScriptType = 'qpc-nastaleeq' | 'indopak-nastaleeq' | 'imlaei';

export interface SurahMeta {
  number: number;
  nameArabic: string;
  nameTransliterated: string;
  nameEnglish: string;
  totalAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

// ==========================================
// 2. Recitation & Synchronization
// ==========================================
export interface ReciterInfo {
  id: string;
  name: string;
  style: string;            // "Murattal" | "Mujawwad" | "Warsh"
  link: string;             // Base CDN URL e.g. https://everyayah.com/data/...
  segments_url?: string;    // Compressed timing manifest URL
  img?: string;
  bio?: string;
  source?: string;
}

export interface WordSegment {
  wordIndex: number;        // 1-based index matching QuranWord.word
  startMs: number;          // Start timestamp in milliseconds
  endMs: number;            // End timestamp in milliseconds
}

export interface AyahTimingManifestEntry {
  surah_number: number;
  ayah_number: number;
  audio_url: string;
  duration: number | null;
  segments: [number, number, number][]; // [word_pos, start_ms, end_ms]
}

export type AyahTimingManifest = Record<string, AyahTimingManifestEntry>; // Key: "surah:ayah"

export interface AyahAudioData {
  audioUrl: string;
  durationInSeconds: number;
  segments: WordSegment[];
}

// ==========================================
// 3. Translation Data Models
// ==========================================
export type TranslationFileContent = Record<string, { t: string }>; // Key: "surah:ayah"

export interface TranslationSelection {
  language: string;
  translatorFile: string;
  displayName: string;
}

// ==========================================
// 4. Composition Props & Studio State
// ==========================================
export interface AyahSequenceData {
  surah: number;
  ayah: number;
  surahNameArabic: string;
  surahNameTransliterated: string;
  words: QuranWord[];
  primaryTranslation?: string;
  secondaryTranslation?: string;
  audioUrl: string;
  durationInFrames: number;
  segments: WordSegment[];
}

export interface VideoTemplateConfig {
  // Scripture & Typography
  script: ScriptType;
  selectedQuranFont: string;
  arabicFontSize: number;
  arabicLineHeight: number;
  arabicTextColor: string;
  arabicActiveColor: string;
  arabicActiveGlow: boolean;

  // Subtitles
  showPrimaryTranslation: boolean;
  primaryTranslationLang: string;
  primaryTranslationFile: string;
  primaryFontSize: number;
  primaryTextColor: string;

  showSecondaryTranslation: boolean;
  secondaryTranslationLang: string;
  secondaryTranslationFile: string;
  secondaryFontSize: number;
  secondaryTextColor: string;

  // Layout & Background
  aspectRatio: '16:9' | '9:16' | '1:1';
  backgroundType: 'video' | 'image' | 'preset';
  backgroundPath: string;
  overlayOpacity: number;       // 0.2 to 0.85
  vignetteIntensity: number;    // 0.0 to 1.0
  kenBurnsEffect: boolean;

  // Audio & Waveform
  reciterIndex: number;
  customAudioPath?: string;
  showWaveform: boolean;
  waveformType: 'smooth-wave' | 'mirrored-bars';
  waveformColor: string;
  waveformHeight: number;
  waveformPositionY: number;   // Percentage from top (e.g. 78%)

  // Branding
  showBranding: boolean;
  logoPath?: string;
  channelHandle: string;
  brandingPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  brandingScale: number;

  // Video Output
  fps: 30 | 60;
  resolution: '1080p' | '4k' | '720p';
}

export interface QuranVideoCompositionProps {
  config: VideoTemplateConfig;
  ayahs: AyahSequenceData[];
  totalDurationInFrames: number;
}

export interface RenderProgressPayload {
  jobId: string;
  progress: number;            // 0.0 to 1.0
  currentFrame: number;
  totalFrames: number;
  status: 'rendering' | 'encoding' | 'completed' | 'failed' | 'cancelled';
  error?: string;
}
```

---

## 4. Typographic Engine & Arabic Orthography Rules

Arabic Quranic text requires specialized handling to avoid disconnected letters, misaligned accents (*tashkeel*), and incorrect pausal markers.

### A. Supported Bundled Font Families

Register the bundled font files locally via `@font-face` rules to guarantee offline rendering:

1. **Surah Calligraphy Title Font (`surah-name-v1.ttf`):**
   * Font Family: `surah-name-v1`
   * Purpose: Dedicated ligature font for displaying ornate calligraphic Surah names.
   * Usage: Pass `"surah" + String(surahNumber).padStart(3, '0')` (e.g. `surah001` for Al-Fatihah, `surah114` for An-Nas). When rendered with `surah-name-v1`, OpenType standard ligatures transform the text into the intricate calligraphic emblem of that Surah.
2. **Madinah Uthmani Hafs Script Fonts:**
   * `KFGQPC Uthmanic Script HAFS Regular.otf` (Family: `KFGQPC Uthmanic Script HAFS`)
   * `QPC Hafs font.ttf` (Family: `KFGQPC HAFS Uthmanic Script`)
   * `me_quran_volt_newmet.ttf` (Family: `me_quran`)
   * `AlQuranNeov5x1.ttf` (Family: `AlQuran Neo v5x1`)
3. **Indo-Pak / Nastaleeq Script Fonts:**
   * `Indopak Nastaleeq font.ttf` (Family: `AlQuran IndoPak by QuranWBW`)
   * `Al Qalam Quran Majeed Web Regular.ttf` (Family: `Al Qalam Quran Majeed Web`)
   * `noorehira Regular.ttf` (Family: `noorehira`)
   * `noorehuda Regular.ttf` (Family: `noorehuda`)
4. **Classical Naskh & Universal Arabic Fonts:**
   * `Amiri Regular.ttf` (Family: `Amiri`)
   * `Lateef Regular.ttf` (Family: `Lateef`)
5. **Vernacular Subtitle Fonts:**
   * Bengali: System / Google Fonts (`Kalpurush`, `Hind Siliguri`, `Noto Sans Bengali`).
   * English / Latin: (`Inter`, `Outfit`, `Poppins`).

### B. Font Pairing Matrix by Quran Script

The application must automatically recommend or select matching typography based on the active Quran script database:

| Script Database | Primary Recommended Fonts | Secondary Fonts | Optimal Line Height |
| :--- | :--- | :--- | :--- |
| `qpc-nastaleeq.db` (QPC Uthmani Hafs) | `KFGQPC Uthmanic Script HAFS`, `KFGQPC HAFS Uthmanic Script` | `me_quran`, `AlQuran Neo v5x1` | `2.2` – `2.4` |
| `indopak-nastaleeq.db` (IndoPak Nastaleeq) | `AlQuran IndoPak by QuranWBW`, `Al Qalam Quran Majeed Web` | `noorehira`, `noorehuda` | `2.6` – `2.9` (prevents vertical diacritic clash) |
| `imlaei.db` (Imlaei Standard Vocalized) | `Amiri`, `Lateef` | `me_quran` | `2.2` – `2.4` |

### C. CSS Typography & OpenType Rules (`src/renderer/index.css`)

Apply the following CSS rules to all Quranic text containers. The `mkmk` (Mark-to-Mark) and `mark` (Mark-to-Base) OpenType tags prevent vowel marks (*tashkeel*) from overlapping on consonants:

```css
@font-face {
  font-family: 'surah-name-v1';
  src: url('/Quran fonts/surah-name-v1.ttf') format('truetype');
  font-display: block;
}

@font-face {
  font-family: 'KFGQPC Uthmanic Script HAFS';
  src: url('/Quran fonts/KFGQPC Uthmanic Script HAFS Regular.otf') format('opentype');
  font-display: block;
}

@font-face {
  font-family: 'KFGQPC HAFS Uthmanic Script';
  src: url('/Quran fonts/QPC Hafs font.ttf') format('truetype');
  font-display: block;
}

@font-face {
  font-family: 'AlQuran IndoPak by QuranWBW';
  src: url('/Quran fonts/Indopak Nastaleeq font.ttf') format('truetype');
  font-display: block;
}

@font-face {
  font-family: 'Al Qalam Quran Majeed Web';
  src: url('/Quran fonts/Al Qalam Quran Majeed Web Regular.ttf') format('truetype');
  font-display: block;
}

@font-face {
  font-family: 'me_quran';
  src: url('/Quran fonts/me_quran_volt_newmet.ttf') format('truetype');
  font-display: block;
}

@font-face {
  font-family: 'Amiri';
  src: url('/Quran fonts/Amiri Regular.ttf') format('truetype');
  font-display: block;
}

@font-face {
  font-family: 'Lateef';
  src: url('/Quran fonts/Lateef Regular.ttf') format('truetype');
  font-display: block;
}

.surah-calligraphy-title {
  font-family: 'surah-name-v1', sans-serif;
  font-feature-settings: "liga" 1, "dlig" 1;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

.quran-arabic-text {
  direction: rtl;
  unicode-bidi: isolate;
  text-align: center;
  font-family: var(--selected-quran-font, 'KFGQPC Uthmanic Script HAFS'), serif;
  font-size: var(--arabic-font-size, 54px);
  line-height: var(--arabic-line-height, 2.4);
  font-feature-settings: "kern" 1, "liga" 1, "mkmk" 1, "mark" 1, "calt" 1;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}
```

---

## 5. Local Quran Script Database Engine (`src/main/services/quran-db.ts`)

The application queries the 3 bundled SQLite databases in `Quran Scripts/`:
* `imlaei.db`
* `indopak-nastaleeq.db`
* `qpc-nastaleeq.db`

Each database contains exactly 83,668 rows across 114 Surahs and 6,236 Ayahs with the following schema:
```sql
CREATE TABLE words (
  id INTEGER,
  location TEXT,   -- Format: "surah:ayah:word" e.g. "1:1:1"
  surah INTEGER,
  ayah INTEGER,
  word INTEGER,    -- 1-based index of the word within the Ayah
  text TEXT        -- Exact vocalized word text
);
```

### Full Production Implementation (`src/main/services/quran-db.ts`):

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { QuranWord, ScriptType } from '../../shared/types';

class QuranDatabaseService {
  private dbConnections = new Map<ScriptType, Database.Database>();

  private getDatabasePath(script: ScriptType): string {
    const isPackaged = app.isPackaged;
    const basePath = isPackaged
      ? process.resourcesPath
      : process.cwd();
    return path.join(basePath, 'Quran Scripts', `${script}.db`);
  }

  private getConnection(script: ScriptType): Database.Database {
    if (!this.dbConnections.has(script)) {
      const dbPath = this.getDatabasePath(script);
      const db = new Database(dbPath, { readonly: true, fileMustExist: true });
      // Create index if not exists in memory for high speed range lookups
      db.pragma('cache_size = 4000');
      this.dbConnections.set(script, db);
    }
    return this.dbConnections.get(script)!;
  }

  public getAyahWords(script: ScriptType, surah: number, ayah: number): QuranWord[] {
    const db = this.getConnection(script);
    const stmt = db.prepare<[number, number], QuranWord>(
      'SELECT id, location, surah, ayah, word, text FROM words WHERE surah = ? AND ayah = ? ORDER BY word ASC'
    );
    return stmt.all(surah, ayah);
  }

  public getAyahRangeWords(
    script: ScriptType,
    surah: number,
    fromAyah: number,
    toAyah: number
  ): Record<number, QuranWord[]> {
    const db = this.getConnection(script);
    const stmt = db.prepare<[number, number, number], QuranWord>(
      'SELECT id, location, surah, ayah, word, text FROM words WHERE surah = ? AND ayah BETWEEN ? AND ? ORDER BY ayah ASC, word ASC'
    );
    const rows = stmt.all(surah, fromAyah, toAyah);

    const grouped: Record<number, QuranWord[]> = {};
    for (const row of rows) {
      if (!grouped[row.ayah]) {
        grouped[row.ayah] = [];
      }
      grouped[row.ayah].push(row);
    }
    return grouped;
  }

  public closeAll(): void {
    for (const [script, conn] of this.dbConnections.entries()) {
      try {
        conn.close();
      } catch (err) {
        console.error(`Error closing database ${script}:`, err);
      }
    }
    this.dbConnections.clear();
  }
}

export const quranDbService = new QuranDatabaseService();
```

---

## 6. Offline Multi-Lingual Translation Engine (`src/main/services/translation-service.ts`)

The `compressed_translation_simple/` folder contains offline translations across **91 languages** (Bengali, English, Urdu, Hindi, Indonesian, Turkish, French, Spanish, German, etc.).

Each file is stored as `<Language>/<Translator_Name>.json.txt` and is encoded with **Base64** and compressed with **BZip2**.

### Full Production Implementation (`src/main/services/translation-service.ts`):

```typescript
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import seekBzip from 'seek-bzip';
import { TranslationFileContent } from '../../shared/types';

class TranslationService {
  private cache = new Map<string, TranslationFileContent>();

  private getBasePath(): string {
    return app.isPackaged
      ? path.join(process.resourcesPath, 'compressed_translation_simple')
      : path.join(process.cwd(), 'compressed_translation_simple');
  }

  public getAvailableLanguages(): string[] {
    const dir = this.getBasePath();
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b));
  }

  public getTranslatorsForLanguage(language: string): string[] {
    const langDir = path.join(this.getBasePath(), language);
    if (!fs.existsSync(langDir)) return [];
    return fs.readdirSync(langDir)
      .filter((file) => file.endsWith('.json.txt'))
      .sort((a, b) => a.localeCompare(b));
  }

  public loadTranslationFile(language: string, translatorFile: string): TranslationFileContent {
    const cacheKey = `${language}:${translatorFile}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const filePath = path.join(this.getBasePath(), language, translatorFile);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Translation file not found at: ${filePath}`);
    }

    // 1. Read Base64-encoded compressed text
    const rawContent = fs.readFileSync(filePath, 'utf-8').trim();

    // 2. Base64 decode to BZip2 binary buffer
    const compressedBuffer = Buffer.from(rawContent, 'base64');

    // 3. Decompress BZip2 buffer
    const decompressedBuffer = seekBzip.decode(compressedBuffer);

    // 4. Parse UTF-8 JSON string
    const jsonStr = decompressedBuffer.toString('utf-8');
    const parsedData: TranslationFileContent = JSON.parse(jsonStr);

    // 5. Store in memory cache
    this.cache.set(cacheKey, parsedData);
    return parsedData;
  }

  public getVerseTranslation(
    language: string,
    translatorFile: string,
    surah: number,
    ayah: number
  ): string {
    try {
      const data = this.loadTranslationFile(language, translatorFile);
      const verseKey = `${surah}:${ayah}`;
      return data[verseKey]?.t || '';
    } catch (err) {
      console.error(`Failed to get translation for ${surah}:${ayah}:`, err);
      return '';
    }
  }
}

export const translationService = new TranslationService();
```

---

## 7. Recitation & Word-by-Word Timing Pipeline (`src/main/services/recitation-service.ts`)

The `recitations.json` file catalogs **43 reciters** with names, recitation styles (Murattal, Mujawwad, Warsh), profile images, bio links, CDN audio links, and `segments_url` endpoints.

### Full Production Implementation (`src/main/services/recitation-service.ts`):

```typescript
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import axios from 'axios';
import seekBzip from 'seek-bzip';
import { ReciterInfo, AyahTimingManifest, AyahAudioData, WordSegment } from '../../shared/types';

class RecitationService {
  private recitersList: ReciterInfo[] = [];
  private manifestCache = new Map<string, AyahTimingManifest>();

  private getRecitationsJsonPath(): string {
    return app.isPackaged
      ? path.join(process.resourcesPath, 'recitations.json')
      : path.join(process.cwd(), 'recitations.json');
  }

  private getDiskCacheDir(): string {
    const cacheDir = path.join(app.getPath('userData'), 'segments_cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    return cacheDir;
  }

  public getReciters(): ReciterInfo[] {
    if (this.recitersList.length === 0) {
      const jsonPath = this.getRecitationsJsonPath();
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      this.recitersList = JSON.parse(raw);
    }
    return this.recitersList;
  }

  public async getTimingManifest(reciter: ReciterInfo): Promise<AyahTimingManifest | null> {
    if (!reciter.segments_url) return null;

    const cacheKey = reciter.name + '_' + reciter.style;
    if (this.manifestCache.has(cacheKey)) {
      return this.manifestCache.get(cacheKey)!;
    }

    // Check disk cache
    const fileName = path.basename(reciter.segments_url);
    const diskPath = path.join(this.getDiskCacheDir(), fileName);

    let rawCompressedBase64 = '';
    if (fs.existsSync(diskPath)) {
      rawCompressedBase64 = fs.readFileSync(diskPath, 'utf-8');
    } else {
      const response = await axios.get<string>(reciter.segments_url, {
        responseType: 'text',
        timeout: 15000,
      });
      rawCompressedBase64 = response.data;
      fs.writeFileSync(diskPath, rawCompressedBase64, 'utf-8');
    }

    // Decode Base64 + BZip2
    const compressedBuffer = Buffer.from(rawCompressedBase64.trim(), 'base64');
    const decompressed = seekBzip.decode(compressedBuffer);
    const manifest: AyahTimingManifest = JSON.parse(decompressed.toString('utf-8'));

    this.manifestCache.set(cacheKey, manifest);
    return manifest;
  }

  public async getAyahAudioData(
    reciterIndex: number,
    surah: number,
    ayah: number
  ): Promise<AyahAudioData> {
    const reciters = this.getReciters();
    const reciter = reciters[reciterIndex] || reciters[0];
    const verseKey = `${surah}:${ayah}`;

    let audioUrl = '';
    let segments: WordSegment[] = [];
    let durationInSeconds = 0;

    const manifest = await this.getTimingManifest(reciter);
    if (manifest && manifest[verseKey]) {
      const item = manifest[verseKey];
      audioUrl = item.audio_url;
      segments = (item.segments || []).map(([wordIndex, startMs, endMs]) => ({
        wordIndex,
        startMs,
        endMs,
      }));

      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        durationInSeconds = (lastSegment.endMs + 500) / 1000;
      }
    }

    // Fallback: Direct standard CDN URL
    if (!audioUrl) {
      const surahPadded = String(surah).padStart(3, '0');
      const ayahPadded = String(ayah).padStart(3, '0');
      audioUrl = `${reciter.link.replace(/\/$/, '')}/${surahPadded}${ayahPadded}.mp3`;
      durationInSeconds = 6.0; // Estimated default if unknown
    }

    return {
      audioUrl,
      durationInSeconds,
      segments,
    };
  }
}

export const recitationService = new RecitationService();
```

---

## 8. Electron IPC Architecture & Preload Bridge

### A. Strongly Typed Preload Bridge (`src/preload/index.ts`)

```typescript
import { contextBridge, ipcRenderer } from 'electron';
import {
  QuranWord,
  ReciterInfo,
  AyahAudioData,
  VideoTemplateConfig,
  RenderProgressPayload,
  ScriptType,
} from '../shared/types';

const api = {
  // Scripture
  getAyahWords: (script: ScriptType, surah: number, ayah: number): Promise<QuranWord[]> =>
    ipcRenderer.invoke('quran:get-ayah-words', script, surah, ayah),
  getAyahRangeWords: (
    script: ScriptType,
    surah: number,
    fromAyah: number,
    toAyah: number
  ): Promise<Record<number, QuranWord[]>> =>
    ipcRenderer.invoke('quran:get-ayah-range-words', script, surah, fromAyah, toAyah),

  // Translations
  getAvailableLanguages: (): Promise<string[]> =>
    ipcRenderer.invoke('translation:get-languages'),
  getTranslatorsForLanguage: (language: string): Promise<string[]> =>
    ipcRenderer.invoke('translation:get-translators', language),
  getVerseTranslation: (
    language: string,
    translatorFile: string,
    surah: number,
    ayah: number
  ): Promise<string> =>
    ipcRenderer.invoke('translation:get-verse', language, translatorFile, surah, ayah),

  // Recitations
  getReciters: (): Promise<ReciterInfo[]> =>
    ipcRenderer.invoke('recitation:get-reciters'),
  getAyahAudioData: (
    reciterIndex: number,
    surah: number,
    ayah: number
  ): Promise<AyahAudioData> =>
    ipcRenderer.invoke('recitation:get-ayah-audio', reciterIndex, surah, ayah),

  // File Dialogs
  selectMediaFile: (type: 'video' | 'audio' | 'image'): Promise<string | null> =>
    ipcRenderer.invoke('dialog:select-media-file', type),
  selectSavePath: (defaultFileName: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:select-save-path', defaultFileName),

  // Video Rendering
  startRender: (config: VideoTemplateConfig, outputPath: string): Promise<{ jobId: string }> =>
    ipcRenderer.invoke('render:start', config, outputPath),
  cancelRender: (jobId: string): Promise<void> =>
    ipcRenderer.invoke('render:cancel', jobId),
  onRenderProgress: (callback: (payload: RenderProgressPayload) => void): (() => void) => {
    const handler = (_: any, payload: RenderProgressPayload) => callback(payload);
    ipcRenderer.on('render:progress', handler);
    return () => ipcRenderer.removeListener('render:progress', handler);
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
export type ElectronAPI = typeof api;
```

---

## 9. Visual Composition Specifications (The "An Nafee" Aesthetic)

Construct `QuranVideoComposition.tsx` using four coordinated visual layers:

### A. Root Composition Layout (`src/remotion/compositions/QuranVideoComposition.tsx`)

```tsx
import React from 'react';
import { AbsoluteFill, Series, Audio } from 'remotion';
import { QuranVideoCompositionProps, AyahSequenceData } from '../../shared/types';
import { BackgroundLayer } from './BackgroundLayer';
import { WaveformLayer } from './WaveformLayer';
import { TypographyLayer } from './TypographyLayer';
import { BrandingLayer } from './BrandingLayer';

export const QuranVideoComposition: React.FC<QuranVideoCompositionProps> = ({
  config,
  ayahs,
  totalDurationInFrames,
}) => {
  return (
    <AbsoluteFill className="bg-black select-none overflow-hidden">
      {/* Layer 1: Ambient Background (Spans Entire Video) */}
      <BackgroundLayer
        type={config.backgroundType}
        source={config.backgroundPath}
        overlayOpacity={config.overlayOpacity}
        vignetteIntensity={config.vignetteIntensity}
        kenBurnsEffect={config.kenBurnsEffect}
        totalDurationInFrames={totalDurationInFrames}
      />

      {/* Sequential Ayah Audio & Typography Display */}
      <Series>
        {ayahs.map((ayahData: AyahSequenceData) => (
          <Series.Sequence
            key={`${ayahData.surah}:${ayahData.ayah}`}
            durationInFrames={ayahData.durationInFrames}
          >
            {/* Ayah Audio Recitation Track */}
            {ayahData.audioUrl && <Audio src={ayahData.audioUrl} />}

            {/* Layer 2: Audio-Reactive Visualization */}
            {config.showWaveform && (
              <WaveformLayer
                audioUrl={ayahData.audioUrl}
                type={config.waveformType}
                color={config.waveformColor}
                height={config.waveformHeight}
                positionY={config.waveformPositionY}
              />
            )}

            {/* Layer 3: Typographic Hierarchy */}
            <TypographyLayer
              config={config}
              ayahData={ayahData}
              fps={config.fps}
            />
          </Series.Sequence>
        ))}
      </Series>

      {/* Layer 4: Channel Identity & Watermark (Spans Entire Video) */}
      {config.showBranding && (
        <BrandingLayer
          logoPath={config.logoPath}
          channelHandle={config.channelHandle}
          position={config.brandingPosition}
          scale={config.brandingScale}
        />
      )}
    </AbsoluteFill>
  );
};
```

---

### B. Ambient Background Layer (`src/remotion/compositions/BackgroundLayer.tsx`)

```tsx
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Video, Img } from 'remotion';

interface BackgroundLayerProps {
  type: 'video' | 'image' | 'preset';
  source: string;
  overlayOpacity: number;
  vignetteIntensity: number;
  kenBurnsEffect: boolean;
  totalDurationInFrames: number;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  type,
  source,
  overlayOpacity,
  vignetteIntensity,
  kenBurnsEffect,
  totalDurationInFrames,
}) => {
  const frame = useCurrentFrame();

  const scale = kenBurnsEffect
    ? interpolate(frame, [0, totalDurationInFrames], [1.0, 1.08], {
        extrapolateRight: 'clamp',
      })
    : 1.0;

  const isVideo = type === 'video' || source.endsWith('.mp4') || source.endsWith('.webm');

  return (
    <AbsoluteFill className="overflow-hidden">
      {/* Background Media */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${scale})`,
          filter: 'brightness(0.9) contrast(1.05) saturate(0.92)',
        }}
      >
        {isVideo ? (
          <Video
            src={source}
            loop
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <Img
            src={source}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Dark Dimming Overlay */}
      <AbsoluteFill
        style={{
          backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
        }}
      />

      {/* Multi-Stop Cinematic Vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,${
            0.5 * vignetteIntensity
          }) 75%, rgba(0,0,0,${0.95 * vignetteIntensity}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
```

---

### C. Audio-Reactive Waveform Layer (`src/remotion/compositions/WaveformLayer.tsx`)

```tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { useAudioData, visualizeAudioWaveform } from '@remotion/media-utils';

interface WaveformLayerProps {
  audioUrl: string;
  type: 'smooth-wave' | 'mirrored-bars';
  color: string;
  height: number;
  positionY: number;
}

export const WaveformLayer: React.FC<WaveformLayerProps> = ({
  audioUrl,
  type,
  color,
  height,
  positionY,
}) => {
  const frame = useCurrentFrame();
  const audioData = useAudioData(audioUrl);

  if (!audioData) return null;

  const samples = visualizeAudioWaveform({
    audioData,
    frame,
    fps: 30,
    numberOfSamples: 64,
  });

  return (
    <AbsoluteFill
      style={{
        top: `${positionY}%`,
        height: `${height}px`,
        pointerEvents: 'none',
      }}
      className="flex items-center justify-center px-12"
    >
      {type === 'smooth-wave' ? (
        <svg
          viewBox="0 0 1000 100"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <path
            d={samples.reduce((acc, val, i) => {
              const x = (i / (samples.length - 1)) * 1000;
              const y = 50 + val * 45;
              return `${acc} ${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
            }, '')}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
      ) : (
        <div className="flex items-center justify-center gap-1.5 w-full h-full">
          {samples.map((val, i) => (
            <div
              key={i}
              style={{
                height: `${Math.max(4, Math.abs(val) * height)}px`,
                backgroundColor: color,
                width: '3px',
                borderRadius: '9999px',
                boxShadow: `0 0 6px ${color}`,
              }}
            />
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};
```

---

### D. Typographic Hierarchy & Karaoke Sync (`src/remotion/compositions/TypographyLayer.tsx`)

```tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring } from 'remotion';
import { VideoTemplateConfig, AyahSequenceData, QuranWord } from '../../shared/types';

interface TypographyLayerProps {
  config: VideoTemplateConfig;
  ayahData: AyahSequenceData;
  fps: number;
}

export const TypographyLayer: React.FC<TypographyLayerProps> = ({
  config,
  ayahData,
  fps,
}) => {
  const frame = useCurrentFrame();

  // Entrance Transition: 15-frame cross-dissolve & slight vertical slide
  const entranceProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  const currentMs = (frame / fps) * 1000;

  // Determine active word position based on current millisecond
  const activeSegment = ayahData.segments.find(
    (seg) => currentMs >= seg.startMs && currentMs <= seg.endMs
  );
  const activeWordIndex = activeSegment ? activeSegment.wordIndex : -1;

  // Format Surah title string for surah-name-v1 font ligature
  const surahLigatureCode = `surah${String(ayahData.surah).padStart(3, '0')}`;

  return (
    <AbsoluteFill
      className="flex flex-col justify-between items-center px-16 py-14"
      style={{
        opacity: entranceProgress,
        transform: `translateY(${(1 - entranceProgress) * 20}px)`,
      }}
    >
      {/* TOP HEADER: Surah Calligraphy Badge & Metadata Pill */}
      <div className="flex items-center gap-4 backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-7 py-2.5 shadow-2xl">
        <span
          className="surah-calligraphy-title text-4xl leading-none text-amber-300"
          style={{ letterSpacing: '0px' }}
        >
          {surahLigatureCode}
        </span>
        <div className="h-5 w-[1px] bg-white/30" />
        <span className="text-white/90 text-sm font-medium tracking-wide">
          {ayahData.surahNameTransliterated} • Ayah {ayahData.ayah}
        </span>
      </div>

      {/* CENTER: Word-by-Word Quranic Scripture */}
      <div className="w-full max-w-5xl my-auto text-center px-6">
        <div
          className="quran-arabic-text inline-block"
          style={
            {
              '--selected-quran-font': config.selectedQuranFont,
              '--arabic-font-size': `${config.arabicFontSize}px`,
              '--arabic-line-height': config.arabicLineHeight,
            } as React.CSSProperties
          }
        >
          {ayahData.words.map((w: QuranWord) => {
            const isActive = w.word === activeWordIndex;
            return (
              <span
                key={w.id}
                className="inline-block transition-all duration-150 mx-1.5"
                style={{
                  color: isActive ? config.arabicActiveColor : config.arabicTextColor,
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  textShadow:
                    isActive && config.arabicActiveGlow
                      ? `0 0 25px ${config.arabicActiveColor}`
                      : '0 2px 10px rgba(0,0,0,0.5)',
                }}
              >
                {w.text}
              </span>
            );
          })}
        </div>
      </div>

      {/* BOTTOM: Dual Subtitles (Primary: Bengali, Secondary: English) */}
      <div className="flex flex-col items-center gap-2 max-w-4xl text-center px-8 py-3 rounded-2xl backdrop-blur-sm bg-black/20">
        {config.showPrimaryTranslation && ayahData.primaryTranslation && (
          <p
            className="font-medium text-slate-100 drop-shadow-md leading-relaxed"
            style={{ fontSize: `${config.primaryFontSize}px` }}
          >
            {ayahData.primaryTranslation}
          </p>
        )}

        {config.showSecondaryTranslation && ayahData.secondaryTranslation && (
          <p
            className="text-slate-300 drop-shadow-md leading-normal"
            style={{ fontSize: `${config.secondaryFontSize}px` }}
          >
            {ayahData.secondaryTranslation}
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
};
```

---

### E. Channel Identity & Watermark Layer (`src/remotion/compositions/BrandingLayer.tsx`)

```tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, Img } from 'remotion';

interface BrandingLayerProps {
  logoPath?: string;
  channelHandle: string;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  scale: number;
}

export const BrandingLayer: React.FC<BrandingLayerProps> = ({
  logoPath,
  channelHandle,
  position,
  scale,
}) => {
  const frame = useCurrentFrame();

  const popProgress = spring({
    frame,
    fps: 30,
    config: { damping: 12, stiffness: 100 },
  });

  const positionClasses = {
    'top-right': 'top-8 right-8',
    'top-left': 'top-8 left-8',
    'bottom-right': 'bottom-8 right-8',
    'bottom-left': 'bottom-8 left-8',
  }[position];

  return (
    <AbsoluteFill className="pointer-events-none">
      <div
        className={`absolute flex items-center gap-3 backdrop-blur-md bg-black/30 border border-white/10 rounded-full px-4 py-2 shadow-lg ${positionClasses}`}
        style={{
          transform: `scale(${popProgress * scale})`,
          opacity: popProgress,
        }}
      >
        {logoPath && (
          <Img src={logoPath} className="w-8 h-8 rounded-full object-cover" />
        )}
        {channelHandle && (
          <span className="text-white/80 text-xs font-semibold tracking-wider">
            {channelHandle}
          </span>
        )}
      </div>
    </AbsoluteFill>
  );
};
```

---

## 10. Headless Media Exporter (`src/main/services/remotion-runner.ts`)

When the user clicks "Export Video" in the studio UI, the main process executes `@remotion/renderer`:

```typescript
import path from 'path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { BrowserWindow } from 'electron';
import { VideoTemplateConfig, AyahSequenceData, QuranVideoCompositionProps } from '../../shared/types';

class RemotionRunnerService {
  private activeJobs = new Map<string, { cancel: () => void }>();

  public async renderVideo(
    jobId: string,
    config: VideoTemplateConfig,
    ayahs: AyahSequenceData[],
    totalDurationInFrames: number,
    outputPath: string,
    mainWindow: BrowserWindow
  ): Promise<void> {
    const entryPoint = path.resolve(__dirname, '../../remotion/index.ts');

    // 1. Bundle Remotion Composition
    const bundleLocation = await bundle({
      entryPoint,
      onProgress: (progress) => {
        mainWindow.webContents.send('render:progress', {
          jobId,
          progress: progress * 0.1, // First 10% is bundling
          status: 'rendering',
        });
      },
    });

    const inputProps: QuranVideoCompositionProps = {
      config,
      ayahs,
      totalDurationInFrames,
    };

    // 2. Select Composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'QuranVideo',
      inputProps,
    });

    // 3. Render MP4 Media
    let isCancelled = false;
    this.activeJobs.set(jobId, {
      cancel: () => {
        isCancelled = true;
      },
    });

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      crf: config.resolution === '4k' ? 18 : 22,
      onProgress: ({ renderedFrames, encodedFrames }) => {
        if (isCancelled) throw new Error('Render cancelled by user');
        const progress = 0.1 + (renderedFrames / totalDurationInFrames) * 0.9;
        mainWindow.webContents.send('render:progress', {
          jobId,
          progress: Math.min(1.0, progress),
          currentFrame: renderedFrames,
          totalFrames: totalDurationInFrames,
          status: 'rendering',
        });
      },
    });

    this.activeJobs.delete(jobId);
    mainWindow.webContents.send('render:progress', {
      jobId,
      progress: 1.0,
      status: 'completed',
    });
  }

  public cancelRender(jobId: string): void {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.cancel();
      this.activeJobs.delete(jobId);
    }
  }
}

export const remotionRunner = new RemotionRunnerService();
```

---

## 11. Packaging & Distribution Configurations (`electron-builder.json`)

To ensure seamless distribution on Windows and macOS without crashing:

* **Asset Preservation in `electron-builder.json`:**
  Keep SQLite databases, font files, translation directories, and `recitations.json` outside ASAR in `extraResources` so `better-sqlite3` and filesystem decoders can access them without ASAR extraction overhead:

```json
{
  "appId": "com.quranvideo.creator",
  "productName": "Quran Video Creator",
  "directories": {
    "output": "dist-electron"
  },
  "asar": true,
  "asarUnpack": [
    "**/node_modules/@remotion/compositor-*/**",
    "**/node_modules/@remotion/renderer/**",
    "**/node_modules/better-sqlite3/**"
  ],
  "extraResources": [
    {
      "from": "Quran Scripts",
      "to": "Quran Scripts",
      "filter": ["*.db"]
    },
    {
      "from": "Quran fonts",
      "to": "Quran fonts",
      "filter": ["*.ttf", "*.otf"]
    },
    {
      "from": "compressed_translation_simple",
      "to": "compressed_translation_simple"
    },
    {
      "from": "recitations.json",
      "to": "recitations.json"
    }
  ],
  "mac": {
    "category": "public.app-category.video",
    "target": ["dmg", "zip"]
  },
  "win": {
    "target": ["nsis", "portable"]
  }
}
```

---

## 12. Complete 114 Surahs Reference Metadata Table

The application bundles the complete Surah catalog in `src/shared/surahs.ts` so all dropdowns and verse range sliders function offline without requiring external network lookups:

```typescript
import { SurahMeta } from './types';

export const SURAHS_LIST: SurahMeta[] = [
  { number: 1, nameArabic: "الفاتحة", nameTransliterated: "Al-Fatihah", nameEnglish: "The Opening", totalAyahs: 7, revelationType: "Meccan" },
  { number: 2, nameArabic: "البقرة", nameTransliterated: "Al-Baqarah", nameEnglish: "The Cow", totalAyahs: 286, revelationType: "Medinan" },
  { number: 3, nameArabic: "آل عمران", nameTransliterated: "Ali 'Imran", nameEnglish: "Family of Imran", totalAyahs: 200, revelationType: "Medinan" },
  { number: 4, nameArabic: "النساء", nameTransliterated: "An-Nisa", nameEnglish: "The Women", totalAyahs: 176, revelationType: "Medinan" },
  { number: 5, nameArabic: "المائدة", nameTransliterated: "Al-Ma'idah", nameEnglish: "The Table Spread", totalAyahs: 120, revelationType: "Medinan" },
  { number: 6, nameArabic: "الأنعام", nameTransliterated: "Al-An'am", nameEnglish: "The Cattle", totalAyahs: 165, revelationType: "Meccan" },
  { number: 7, nameArabic: "الأعراف", nameTransliterated: "Al-A'raf", nameEnglish: "The Heights", totalAyahs: 206, revelationType: "Meccan" },
  { number: 8, nameArabic: "الأنفال", nameTransliterated: "Al-Anfal", nameEnglish: "The Spoils of War", totalAyahs: 75, revelationType: "Medinan" },
  { number: 9, nameArabic: "التوبة", nameTransliterated: "At-Tawbah", nameEnglish: "The Repentance", totalAyahs: 129, revelationType: "Medinan" },
  { number: 10, nameArabic: "يونس", nameTransliterated: "Yunus", nameEnglish: "Jonah", totalAyahs: 109, revelationType: "Meccan" },
  { number: 11, nameArabic: "هود", nameTransliterated: "Hud", nameEnglish: "Hud", totalAyahs: 123, revelationType: "Meccan" },
  { number: 12, nameArabic: "يوسف", nameTransliterated: "Yusuf", nameEnglish: "Joseph", totalAyahs: 111, revelationType: "Meccan" },
  { number: 13, nameArabic: "الرعد", nameTransliterated: "Ar-Ra'd", nameEnglish: "The Thunder", totalAyahs: 43, revelationType: "Medinan" },
  { number: 14, nameArabic: "إبراهيم", nameTransliterated: "Ibrahim", nameEnglish: "Abraham", totalAyahs: 52, revelationType: "Meccan" },
  { number: 15, nameArabic: "الحجر", nameTransliterated: "Al-Hijr", nameEnglish: "The Rocky Tract", totalAyahs: 99, revelationType: "Meccan" },
  { number: 16, nameArabic: "النحل", nameTransliterated: "An-Nahl", nameEnglish: "The Bee", totalAyahs: 128, revelationType: "Meccan" },
  { number: 17, nameArabic: "الإسراء", nameTransliterated: "Al-Isra", nameEnglish: "The Night Journey", totalAyahs: 111, revelationType: "Meccan" },
  { number: 18, nameArabic: "الكهف", nameTransliterated: "Al-Kahf", nameEnglish: "The Cave", totalAyahs: 110, revelationType: "Meccan" },
  { number: 19, nameArabic: "مريم", nameTransliterated: "Maryam", nameEnglish: "Mary", totalAyahs: 98, revelationType: "Meccan" },
  { number: 20, nameArabic: "طه", nameTransliterated: "Taha", nameEnglish: "Ta-Ha", totalAyahs: 135, revelationType: "Meccan" },
  { number: 21, nameArabic: "الأنبياء", nameTransliterated: "Al-Anbiya", nameEnglish: "The Prophets", totalAyahs: 112, revelationType: "Meccan" },
  { number: 22, nameArabic: "الحج", nameTransliterated: "Al-Hajj", nameEnglish: "The Pilgrimage", totalAyahs: 78, revelationType: "Medinan" },
  { number: 23, nameArabic: "المؤمنون", nameTransliterated: "Al-Mu'minun", nameEnglish: "The Believers", totalAyahs: 118, revelationType: "Meccan" },
  { number: 24, nameArabic: "النور", nameTransliterated: "An-Nur", nameEnglish: "The Light", totalAyahs: 64, revelationType: "Medinan" },
  { number: 25, nameArabic: "الفرقان", nameTransliterated: "Al-Furqan", nameEnglish: "The Criterion", totalAyahs: 77, revelationType: "Meccan" },
  { number: 26, nameArabic: "الشعراء", nameTransliterated: "Ash-Shu'ara", nameEnglish: "The Poets", totalAyahs: 227, revelationType: "Meccan" },
  { number: 27, nameArabic: "النمل", nameTransliterated: "An-Naml", nameEnglish: "The Ants", totalAyahs: 93, revelationType: "Meccan" },
  { number: 28, nameArabic: "القصص", nameTransliterated: "Al-Qasas", nameEnglish: "The Stories", totalAyahs: 88, revelationType: "Meccan" },
  { number: 29, nameArabic: "العنكبوت", nameTransliterated: "Al-'Ankabut", nameEnglish: "The Spider", totalAyahs: 69, revelationType: "Meccan" },
  { number: 30, nameArabic: "الروم", nameTransliterated: "Ar-Rum", nameEnglish: "The Romans", totalAyahs: 60, revelationType: "Meccan" },
  { number: 31, nameArabic: "لقمان", nameTransliterated: "Luqman", nameEnglish: "Luqman", totalAyahs: 34, revelationType: "Meccan" },
  { number: 32, nameArabic: "السجدة", nameTransliterated: "As-Sajdah", nameEnglish: "The Prostration", totalAyahs: 30, revelationType: "Meccan" },
  { number: 33, nameArabic: "الأحزاب", nameTransliterated: "Al-Ahzab", nameEnglish: "The Combined Forces", totalAyahs: 73, revelationType: "Medinan" },
  { number: 34, nameArabic: "سبأ", nameTransliterated: "Saba", nameEnglish: "Sheba", totalAyahs: 54, revelationType: "Meccan" },
  { number: 35, nameArabic: "فاطر", nameTransliterated: "Fatir", nameEnglish: "Originator", totalAyahs: 45, revelationType: "Meccan" },
  { number: 36, nameArabic: "يس", nameTransliterated: "Ya-Sin", nameEnglish: "Ya Sin", totalAyahs: 83, revelationType: "Meccan" },
  { number: 37, nameArabic: "الصافات", nameTransliterated: "As-Saffat", nameEnglish: "Those who set the Ranks", totalAyahs: 182, revelationType: "Meccan" },
  { number: 38, nameArabic: "ص", nameTransliterated: "Sad", nameEnglish: "The Letter 'Saad'", totalAyahs: 88, revelationType: "Meccan" },
  { number: 39, nameArabic: "الزمر", nameTransliterated: "Az-Zumar", nameEnglish: "The Troops", totalAyahs: 75, revelationType: "Meccan" },
  { number: 40, nameArabic: "غافر", nameTransliterated: "Ghafir", nameEnglish: "The Forgiver", totalAyahs: 85, revelationType: "Meccan" },
  { number: 41, nameArabic: "فصلت", nameTransliterated: "Fussilat", nameEnglish: "Explained in Detail", totalAyahs: 54, revelationType: "Meccan" },
  { number: 42, nameArabic: "الشورى", nameTransliterated: "Ash-Shura", nameEnglish: "The Consultation", totalAyahs: 53, revelationType: "Meccan" },
  { number: 43, nameArabic: "الزخرف", nameTransliterated: "Az-Zukhruf", nameEnglish: "The Ornaments of Gold", totalAyahs: 89, revelationType: "Meccan" },
  { number: 44, nameArabic: "الدخان", nameTransliterated: "Ad-Dukhan", nameEnglish: "The Smoke", totalAyahs: 59, revelationType: "Meccan" },
  { number: 45, nameArabic: "الجاثية", nameTransliterated: "Al-Jathiyah", nameEnglish: "The Crouching", totalAyahs: 37, revelationType: "Meccan" },
  { number: 46, nameArabic: "الأحقاف", nameTransliterated: "Al-Ahqaf", nameEnglish: "The Wind-Curved Sandhills", totalAyahs: 35, revelationType: "Meccan" },
  { number: 47, nameArabic: "محمد", nameTransliterated: "Muhammad", nameEnglish: "Muhammad", totalAyahs: 38, revelationType: "Medinan" },
  { number: 48, nameArabic: "الفتح", nameTransliterated: "Al-Fath", nameEnglish: "The Victory", totalAyahs: 29, revelationType: "Medinan" },
  { number: 49, nameArabic: "الحجرات", nameTransliterated: "Al-Hujurat", nameEnglish: "The Rooms", totalAyahs: 18, revelationType: "Medinan" },
  { number: 50, nameArabic: "ق", nameTransliterated: "Qaf", nameEnglish: "The Letter 'Qaf'", totalAyahs: 45, revelationType: "Meccan" },
  { number: 51, nameArabic: "الذاريات", nameTransliterated: "Adh-Dhariyat", nameEnglish: "The Winnowing Winds", totalAyahs: 60, revelationType: "Meccan" },
  { number: 52, nameArabic: "الطور", nameTransliterated: "At-Tur", nameEnglish: "The Mount", totalAyahs: 49, revelationType: "Meccan" },
  { number: 53, nameArabic: "النجم", nameTransliterated: "An-Najm", nameEnglish: "The Star", totalAyahs: 62, revelationType: "Meccan" },
  { number: 54, nameArabic: "القمر", nameTransliterated: "Al-Qamar", nameEnglish: "The Moon", totalAyahs: 55, revelationType: "Meccan" },
  { number: 55, nameArabic: "الرحمن", nameTransliterated: "Ar-Rahman", nameEnglish: "The Beneficent", totalAyahs: 78, revelationType: "Medinan" },
  { number: 56, nameArabic: "الواقعة", nameTransliterated: "Al-Waqi'ah", nameEnglish: "The Inevitable", totalAyahs: 96, revelationType: "Meccan" },
  { number: 57, nameArabic: "الحديد", nameTransliterated: "Al-Hadid", nameEnglish: "The Iron", totalAyahs: 29, revelationType: "Medinan" },
  { number: 58, nameArabic: "المجادلة", nameTransliterated: "Al-Mujadila", nameEnglish: "The Pleading Woman", totalAyahs: 22, revelationType: "Medinan" },
  { number: 59, nameArabic: "الحشر", nameTransliterated: "Al-Hashr", nameEnglish: "The Exile", totalAyahs: 24, revelationType: "Medinan" },
  { number: 60, nameArabic: "الممتحنة", nameTransliterated: "Al-Mumtahanah", nameEnglish: "She that is to be examined", totalAyahs: 13, revelationType: "Medinan" },
  { number: 61, nameArabic: "الصف", nameTransliterated: "As-Saff", nameEnglish: "The Ranks", totalAyahs: 14, revelationType: "Medinan" },
  { number: 62, nameArabic: "الجمعة", nameTransliterated: "Al-Jumu'ah", nameEnglish: "The Congregation, Friday", totalAyahs: 11, revelationType: "Medinan" },
  { number: 63, nameArabic: "المنافقون", nameTransliterated: "Al-Munafiqun", nameEnglish: "The Hypocrites", totalAyahs: 11, revelationType: "Medinan" },
  { number: 64, nameArabic: "التغابن", nameTransliterated: "At-Taghabun", nameEnglish: "The Mutual Disillusion", totalAyahs: 18, revelationType: "Medinan" },
  { number: 65, nameArabic: "الطلاق", nameTransliterated: "At-Talaq", nameEnglish: "The Divorce", totalAyahs: 12, revelationType: "Medinan" },
  { number: 66, nameArabic: "التحريم", nameTransliterated: "At-Tahrim", nameEnglish: "The Prohibition", totalAyahs: 12, revelationType: "Medinan" },
  { number: 67, nameArabic: "الملك", nameTransliterated: "Al-Mulk", nameEnglish: "The Sovereignty", totalAyahs: 30, revelationType: "Meccan" },
  { number: 68, nameArabic: "القلم", nameTransliterated: "Al-Qalam", nameEnglish: "The Pen", totalAyahs: 52, revelationType: "Meccan" },
  { number: 69, nameArabic: "الحاقة", nameTransliterated: "Al-Haqqah", nameEnglish: "The Reality", totalAyahs: 52, revelationType: "Meccan" },
  { number: 70, nameArabic: "المعارج", nameTransliterated: "Al-Ma'arij", nameEnglish: "The Ascending Stairways", totalAyahs: 44, revelationType: "Meccan" },
  { number: 71, nameArabic: "نوح", nameTransliterated: "Nuh", nameEnglish: "Noah", totalAyahs: 28, revelationType: "Meccan" },
  { number: 72, nameArabic: "الجن", nameTransliterated: "Al-Jinn", nameEnglish: "The Jinn", totalAyahs: 28, revelationType: "Meccan" },
  { number: 73, nameArabic: "المزمل", nameTransliterated: "Al-Muzzammil", nameEnglish: "The Enshrouded One", totalAyahs: 20, revelationType: "Meccan" },
  { number: 74, nameArabic: "المدثر", nameTransliterated: "Al-Muddaththir", nameEnglish: "The Cloaked One", totalAyahs: 56, revelationType: "Meccan" },
  { number: 75, nameArabic: "القيامة", nameTransliterated: "Al-Qiyamah", nameEnglish: "The Resurrection", totalAyahs: 40, revelationType: "Meccan" },
  { number: 76, nameArabic: "الإنسان", nameTransliterated: "Al-Insan", nameEnglish: "The Man", totalAyahs: 31, revelationType: "Medinan" },
  { number: 77, nameArabic: "المرسلات", nameTransliterated: "Al-Mursalat", nameEnglish: "The Emissaries", totalAyahs: 50, revelationType: "Meccan" },
  { number: 78, nameArabic: "النبأ", nameTransliterated: "An-Naba", nameEnglish: "The Tidings", totalAyahs: 40, revelationType: "Meccan" },
  { number: 79, nameArabic: "النازعات", nameTransliterated: "An-Nazi'at", nameEnglish: "Those who drag forth", totalAyahs: 46, revelationType: "Meccan" },
  { number: 80, nameArabic: "عبس", nameTransliterated: "'Abasa", nameEnglish: "He Frowned", totalAyahs: 42, revelationType: "Meccan" },
  { number: 81, nameArabic: "التكوير", nameTransliterated: "At-Takwir", nameEnglish: "The Overthrowing", totalAyahs: 29, revelationType: "Meccan" },
  { number: 82, nameArabic: "الانفطار", nameTransliterated: "Al-Infitar", nameEnglish: "The Cleaving", totalAyahs: 19, revelationType: "Meccan" },
  { number: 83, nameArabic: "المطففين", nameTransliterated: "Al-Mutaffifin", nameEnglish: "The Defrauding", totalAyahs: 36, revelationType: "Meccan" },
  { number: 84, nameArabic: "الانشقاق", nameTransliterated: "Al-Inshiqaq", nameEnglish: "The Splitting Open", totalAyahs: 25, revelationType: "Meccan" },
  { number: 85, nameArabic: "البروج", nameTransliterated: "Al-Buruj", nameEnglish: "The Mansions of the Stars", totalAyahs: 22, revelationType: "Meccan" },
  { number: 86, nameArabic: "الطارق", nameTransliterated: "At-Tariq", nameEnglish: "The Nightcomer", totalAyahs: 17, revelationType: "Meccan" },
  { number: 87, nameArabic: "الأعلى", nameTransliterated: "Al-A'la", nameEnglish: "The Most High", totalAyahs: 19, revelationType: "Meccan" },
  { number: 88, nameArabic: "الغاشية", nameTransliterated: "Al-Ghashiyah", nameEnglish: "The Overwhelming", totalAyahs: 26, revelationType: "Meccan" },
  { number: 89, nameArabic: "الفجر", nameTransliterated: "Al-Fajr", nameEnglish: "The Dawn", totalAyahs: 30, revelationType: "Meccan" },
  { number: 90, nameArabic: "البلد", nameTransliterated: "Al-Balad", nameEnglish: "The City", totalAyahs: 20, revelationType: "Meccan" },
  { number: 91, nameArabic: "الشمس", nameTransliterated: "Ash-Shams", nameEnglish: "The Sun", totalAyahs: 15, revelationType: "Meccan" },
  { number: 92, nameArabic: "الليل", nameTransliterated: "Al-Layl", nameEnglish: "The Night", totalAyahs: 21, revelationType: "Meccan" },
  { number: 93, nameArabic: "الضحى", nameTransliterated: "Ad-Duhaa", nameEnglish: "The Morning Hours", totalAyahs: 11, revelationType: "Meccan" },
  { number: 94, nameArabic: "الشرح", nameTransliterated: "Ash-Sharh", nameEnglish: "The Relief", totalAyahs: 8, revelationType: "Meccan" },
  { number: 95, nameArabic: "التين", nameTransliterated: "At-Tin", nameEnglish: "The Fig", totalAyahs: 8, revelationType: "Meccan" },
  { number: 96, nameArabic: "العلق", nameTransliterated: "Al-'Alaq", nameEnglish: "The Clot", totalAyahs: 19, revelationType: "Meccan" },
  { number: 97, nameArabic: "القدر", nameTransliterated: "Al-Qadr", nameEnglish: "The Power", totalAyahs: 5, revelationType: "Meccan" },
  { number: 98, nameArabic: "البينة", nameTransliterated: "Al-Bayyinah", nameEnglish: "The Clear Proof", totalAyahs: 8, revelationType: "Medinan" },
  { number: 99, nameArabic: "الزلزلة", nameTransliterated: "Az-Zalzalah", nameEnglish: "The Earthquake", totalAyahs: 8, revelationType: "Medinan" },
  { number: 100, nameArabic: "العاديات", nameTransliterated: "Al-'Adiyat", nameEnglish: "The Courser", totalAyahs: 11, revelationType: "Meccan" },
  { number: 101, nameArabic: "القارعة", nameTransliterated: "Al-Qari'ah", nameEnglish: "The Calamity", totalAyahs: 11, revelationType: "Meccan" },
  { number: 102, nameArabic: "التكاثر", nameTransliterated: "At-Takathur", nameEnglish: "The Rivalry in world increase", totalAyahs: 8, revelationType: "Meccan" },
  { number: 103, nameArabic: "العصر", nameTransliterated: "Al-'Asr", nameEnglish: "The Declining Day", totalAyahs: 3, revelationType: "Meccan" },
  { number: 104, nameArabic: "الهمزة", nameTransliterated: "Al-Humazah", nameEnglish: "The Traducer", totalAyahs: 9, revelationType: "Meccan" },
  { number: 105, nameArabic: "الفيل", nameTransliterated: "Al-Fil", nameEnglish: "The Elephant", totalAyahs: 5, revelationType: "Meccan" },
  { number: 106, nameArabic: "قريش", nameTransliterated: "Quraysh", nameEnglish: "Quraysh", totalAyahs: 4, revelationType: "Meccan" },
  { number: 107, nameArabic: "الماعون", nameTransliterated: "Al-Ma'un", nameEnglish: "The Small Kindnesses", totalAyahs: 7, revelationType: "Meccan" },
  { number: 108, nameArabic: "الكوثر", nameTransliterated: "Al-Kawthar", nameEnglish: "The Abundance", totalAyahs: 3, revelationType: "Meccan" },
  { number: 109, nameArabic: "الكافرون", nameTransliterated: "Al-Kafirun", nameEnglish: "The Disbelievers", totalAyahs: 6, revelationType: "Meccan" },
  { number: 110, nameArabic: "النصر", nameTransliterated: "An-Nasr", nameEnglish: "The Divine Support", totalAyahs: 3, revelationType: "Medinan" },
  { number: 111, nameArabic: "المسد", nameTransliterated: "Al-Masad", nameEnglish: "The Palm Fiber", totalAyahs: 5, revelationType: "Meccan" },
  { number: 112, nameArabic: "الإخلاص", nameTransliterated: "Al-Ikhlas", nameEnglish: "The Sincerity", totalAyahs: 4, revelationType: "Meccan" },
  { number: 113, nameArabic: "الفلق", nameTransliterated: "Al-Falaq", nameEnglish: "The Daybreak", totalAyahs: 5, revelationType: "Meccan" },
  { number: 114, nameArabic: "الناس", nameTransliterated: "An-Nas", nameEnglish: "Mankind", totalAyahs: 6, revelationType: "Meccan" },
];
```

---

## 13. Step-by-Step AI Agent Execution Protocol

When an AI agent or engineer implements this software, execute the development in this deterministic order:

### Step 1: Dependencies & Build Scaffolding
* Initialize an Electron + Vite + React + TypeScript workspace.
* Install dependencies:
  ```bash
  npm install better-sqlite3 seek-bzip axios remotion @remotion/player @remotion/renderer @remotion/media-utils @remotion/bundler lucide-react zustand
  npm install -D electron electron-builder vite vite-plugin-electron vite-plugin-electron-renderer tailwindcss postcss autoprefixer @types/better-sqlite3 @types/node
  ```
* Configure `tailwind.config.js` and `vite.config.ts`.

### Step 2: Font Registration & CSS Verification
* Put `@font-face` declarations into `src/renderer/index.css` referencing all 12 fonts in `Quran fonts/`.
* Verify that `surah-name-v1` renders ligatures for `surah001` through `surah114`.

### Step 3: Implement Backend Main Process Services
* Implement `src/main/services/quran-db.ts` to query `imlaei.db`, `indopak-nastaleeq.db`, and `qpc-nastaleeq.db`.
* Implement `src/main/services/translation-service.ts` to decompress `.json.txt` files via `seek-bzip`.
* Implement `src/main/services/recitation-service.ts` to parse `recitations.json` and download/cache `segments_url` manifests.
* Wire all services into `src/main/ipc-handlers.ts` and expose via `src/preload/index.ts`.

### Step 4: Implement Remotion Compositions
* Implement `BackgroundLayer.tsx`, `WaveformLayer.tsx`, `TypographyLayer.tsx`, and `BrandingLayer.tsx`.
* Implement `QuranVideoComposition.tsx` using `<Series>` and frame-to-millisecond karaoke synchronization math.
* Verify `durationInFrames` calculation for single and multi-Ayah sequences.

### Step 5: Implement Studio UI & Reactive Player
* Implement Zustand studio store (`src/renderer/store/studio-store.ts`).
* Build tabs for Scripture, Subtitles, Visuals, Audio & Waveform, and Branding.
* Embed `<Player />` from `@remotion/player` for live zero-latency canvas previewing.

### Step 6: Headless Rendering & Video Export
* Implement `src/main/services/remotion-runner.ts` using `@remotion/bundler` and `@remotion/renderer`.
* Connect export modal with live percentage progress bar and cancellation trigger.
* Verify MP4 output quality (H.264/AAC, 1080p and 4K presets).

### Step 7: Packaging & Production Verification
* Configure `electron-builder.json` with `extraResources` ensuring `Quran Scripts/`, `Quran fonts/`, `compressed_translation_simple/`, and `recitations.json` are retained outside ASAR.
* Test build: `npm run build && npx electron-builder --dir`.