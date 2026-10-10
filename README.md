# Quran Video Studio 🎥📖

A production-grade desktop application built with **Electron**, **React**, **Vite**, and **Remotion** to create cinematic Quran recitation videos with synchronized word-by-word karaoke typography, dynamic audio waveforms, non-repeating multi-media background timeline sequences, and high-definition MP4 rendering.

---

## 🌟 What is Quran Video Studio?

Quran Video Studio is an all-in-one studio desktop application designed for content creators, da'wah organizations, and educational channels to produce high-engagement, cinematic Quranic recitation videos for **YouTube**, **Instagram Reels**, **TikTok**, and **YouTube Shorts**.

It eliminates the tedious manual editing of combining audio, aligning word timestamps, trimming background videos, and formatting complex Arabic ligatures by providing an interactive timeline, live Remotion player preview, and deterministic MP4 video rendering.

---

## ✨ Core Features & Capabilities

### 1. Typography, Layout & Alignments
* **Word-by-Word Synchronized Typography**: Real-time karaoke illumination synchronized with audio recitation timestamps.
* **Per-Ayah Custom Font Sizing**:
  * Customize Arabic, English translation, and Native subtitle font sizes for individual verses (`surah:ayah`).
  * Prevents layout breakage on long verses (e.g., Ayat al-Kursi) while allowing shorter verses to remain prominent.
  * Overrides apply live in the Remotion preview and in the final exported video.
* **Expanded Font Size Range (10 to 100 px)**: Full 10–100 px freedom with smooth sliders and direct numeric pixel inputs across all script and subtitle layers.
* **Horizontal Alignment**: Strict alignment options (`Center (All)`, `Left`, `Right`) that apply across all active text layers.
* **Vertical Alignment (Screen Position)**:
  * **Middle (Default)**: Centers Quran script and translations together in the vertical middle of the screen with balanced vertical spacing.
  * **Bottom**: Anchors Quran script and translations near the lower third / bottom of the screen (traditional cinematic subtitle position, keeping the visual center open).
  * **Top**: Positions the scripture and translations in the upper third (below the header).
  * **Split**: Displays the Quran script in the center while anchoring translation cards to the bottom edge.
* **Vertical Fine-Tune Offset (Nudge)**:
  * Micro-adjustment slider from `-150px` (Higher) to `+150px` (Lower) with a 1-click Reset button.
* **Layer Display Ordering / Sequence**:
  * Custom vertical sequence (`scriptLayoutOrder: ['arabic', 'secondary', 'primary']`), e.g., Quran script first ➔ English translation ➔ Native language subtitle, or any custom order.
  * Reorderable via **▲** / **▼** buttons in Scripture settings or quick swap in Subtitle settings.
* **Subtitle Container Box Toggle**:
  * Option to enable or disable the frosted glass container card around translations (`showTranslationContainer`).
  * When disabled, text floats cleanly over the video with high-contrast text shadows (`0 2px 10px rgba(0,0,0,0.95), 0 0 16px rgba(0,0,0,0.8)`).
* **Surah Title Header Badge Toggle**:
  * Checkbox to show or hide the top Surah metadata pill (`showSurahHeader`), enabling a clean full-screen look.
* **Multiple Quranic Scripts & Typefaces**:
  * Medina Uthmani Hafs, Indo-Pak Nastaleeq, QPC Hafs, Amiri, Lateef, and more with OpenType layout rules (`mkmk`, `mark`, `liga`, `kern`).

---

### 2. Interactive Studio Timeline & Track Inspector
* **Dual-Track Timeline Architecture**:
  * **Track A (Scripture / Ayahs)**: Visual block per verse reflecting exact recitation duration.
    * Click any Ayah to jump the playhead to its start frame.
    * Opens the **Ayah Typography Inspector Bar** for live adjustments of Arabic, English, Subtitle font sizes, and vertical offset.
  * **Track B (Multi-Media Backgrounds)**: Visual blocks for video, image, and preset background clips.
* **Ruler & Playhead Scrubber**:
  * Dedicated top time ruler for scrubbing without accidental clip selection.
  * Draggable playhead needle bar with grab handle.
  * Separated clip selection from scrubbing to allow editing clips without shifting the playhead.
* **Interactive Boundary Dividers**:
  * Click and drag dividers between clips to adjust the time split smoothly between neighboring clips.

---

### 3. Non-Repeating Multi-Media Background Sequence System
* **Sequential Multi-Clip Media**:
  * Add multiple videos and images sequentially across the timeline to fill the recitation duration.
  * When adding new clips, duration is automatically distributed proportionally (50/50, 1/3, etc.).
* **Non-Repeating Video Playback (`autoFitSpeed`)**:
  * Videos automatically slow down to fit their allotted timeline slot without looping or repeating.
  * Prevents jarring repetitions of short video clips in long recitations.
* **Manual Visualization Time Adjustment**:
  * Adjust time percentages via slider, numeric display, or `+5%` / `-5%` buttons.
* **Per-Clip Transitions**:
  * Choose distinct transitions between every consecutive clip:
    * `zoom-fade` (Zoom Fade)
    * `crossfade` (Crossfade)
    * `blur-fade` (Blur Melt)
    * `slide-left` (Slide Push)
    * `dip-black` (Dip to Black)
    * `cut` (Hard Cut)
* **Clip Swapping & Replacement**:
  * Swap any clip with another video or image file from local storage while preserving its timeline slot and settings.
* **Preset Library Integration**:
  * Clicking presets in the Visuals tab appends them to the end of the timeline sequence rather than replacing existing clips.
* **Image Ken Burns Effect**:
  * Subtle procedural zooming for static background images to prevent visual stagnation.

---

### 4. Audio, Recitations & Waveforms
* **Reciter Catalog**: Includes multiple renowned reciters with remote and local audio fetching and timestamp data.
* **Recitation Playback Speed**: Adjustable speed from 0.75× to 1.25× with lockstep word highlight synchronization.
* **Dynamic Waveform Visualizer**:
  * Audio-reactive visualizer (`smooth-wave`, `mirrored-bars`).
  * Custom position, amplitude, height, width, and color.

---

### 5. Media Engine & Local Streaming Architecture
* **Embedded Local HTTP Media Server**:
  * Electron main process runs a local streaming server (`http://127.0.0.1:<port>`) with HTTP 206 Partial Content (`Range` header) support.
  * Resolves Chromium `net::ERR_UNKNOWN_URL_SCHEME` and HTML5 video playback errors (`MEDIA_ELEMENT_ERROR: Format error`) for local files.
* **Deterministic Remotion Video Rendering**:
  * Pre-bundled Remotion composition bundle (`dist/remotion-bundle`).
  * Headless Chromium rendering with multi-threading, custom frame rates (30 fps, 60 fps), and resolutions (720p, 1080p, 4K).

---

## 📋 Prerequisites

Ensure you have the following installed:
* **Node.js**: `v18.0.0` or higher (`v20+` or `v22+` recommended)
* **npm**: `v9.0.0` or higher (bundled with Node.js)
* **C/C++ Build Tools & Python** (for native module `better-sqlite3`):
  * **Linux (Debian/Ubuntu/Fedora)**: `build-essential`, `python3` (e.g. `sudo apt install build-essential python3` or `sudo dnf groupinstall "Development Tools"`)
  * **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  * **Windows**: Visual Studio Build Tools (C++ workload) and Python

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/IsmailHosenIsmailJames/Quran-Video-Creator.git
cd Quran-Video-Creator
```

### 2. Install Dependencies
```bash
npm install
```

> **Note for `better-sqlite3`**: If native SQLite bindings require rebuilding for your Electron version:
> ```bash
> npx electron-rebuild -f -w better-sqlite3
> ```

---

## 🛠️ Development & Building

### Run Development Mode (Live Hot Reload)
```bash
npm run dev
```
* Starts Vite renderer server at `http://localhost:5173`.
* Launches Electron with instant HMR.

### Pre-Bundle Remotion Composition
```bash
npm run bundle:remotion
```

### Typecheck & Compile Code
```bash
npm run build:vite
# or lint only
npm run lint
```

### Pack Desktop App (Unpacked Executable Directory)
```bash
npm run pack
# or
npm run build
```
Creates binary directory in:
* `release/linux-unpacked/` (Linux)
* `release/mac/` (macOS)
* `release/win-unpacked/` (Windows)

### Run the Packaged Binary (Linux)
```bash
./release/linux-unpacked/quran-video-studio
```

### Build Production Installers (`.tar.gz`, `.deb`, `.dmg`, `.exe`)
```bash
npm run dist
```

---

## 📂 Project Structure

```text
Quran-Video-Creator/
├── Quran fonts/                   # Embedded Quranic typefaces (.ttf, .otf)
├── Quran Scripts/                 # SQLite database files for Quranic scripts (.db)
├── compressed_translation_simple/ # BZip2 compressed translation files (.json.txt)
├── public/                        # Static assets (presets, background images)
├── recitations.json               # Reciter catalog, audio URLs, and segment timings
├── scripts/
│   └── bundle-remotion.js         # Script to pre-bundle Remotion composition
├── src/
│   ├── main/                      # Electron Main process
│   │   ├── services/              # SQLite queries, recitation audio loader, Remotion renderer runner
│   │   ├── ipc-handlers.ts        # IPC bridge handlers (file dialogs, render jobs, media probe)
│   │   └── index.ts               # Electron app lifecycle, streaming server, window management
│   ├── preload/                   # Electron Preload script (safe window.electronAPI bridge)
│   ├── remotion/                  # Remotion compositions & video rendering engine
│   │   ├── compositions/          # BackgroundLayer, TypographyLayer, WaveformLayer, BrandingLayer
│   │   ├── Root.tsx               # Remotion root configuration & dynamic metadata calculation
│   │   └── index.ts               # Bundler entrypoint
│   ├── renderer/                  # React UI (Tailwind CSS, Zustand, Lucide icons)
│   │   ├── components/            # StudioTimeline, LivePreview, ExportModal, Tabs (Scripture, Subtitles, Visuals, Audio, Branding)
│   │   ├── store/                 # studio-store.ts (Zustand state management)
│   │   └── App.tsx                # Studio layout shell
│   └── shared/                    # TypeScript interfaces, constants, media utilities
│       ├── types.ts               # VideoTemplateConfig, AyahFontOverride, BackgroundClip, etc.
│       ├── constants.ts           # DEFAULT_TEMPLATE_CONFIG, FONT_OPTIONS, BACKGROUND_PRESETS
│       └── media-url.ts           # Protocol abstraction for local and remote media URLs
├── electron-builder.json          # Desktop packaging configuration
├── vite.config.ts                 # Vite + Electron build configuration
└── package.json                   # Project scripts and dependencies
```

---

## 📊 Configuration Model Reference (`VideoTemplateConfig`)

The core configuration schema in `src/shared/types.ts`:

```typescript
export interface VideoTemplateConfig {
  // Scripture Selection
  surahNumber: number;
  fromAyah: number;
  toAyah: number;

  // Scripture Typography & Styling
  script: ScriptType;
  selectedQuranFont: string;
  arabicFontSize: number;          // Range: 10 to 100 px
  arabicLineHeight: number;        // e.g. 2.3
  arabicTextColor: string;
  arabicActiveColor: string;       // Karaoke active word color
  arabicActiveGlow: boolean;

  // Per-Ayah Font Size & Position Overrides (Key: `${surah}:${ayah}`)
  ayahFontOverrides?: Record<string, AyahFontOverride>;

  // Subtitles
  showPrimaryTranslation: boolean;
  primaryTranslationLang: string;
  primaryTranslationFile: string;
  primaryFontSize: number;         // Range: 10 to 100 px
  primaryTextColor: string;

  showSecondaryTranslation: boolean;
  secondaryTranslationLang: string;
  secondaryTranslationFile: string;
  secondaryFontSize: number;       // Range: 10 to 100 px
  secondaryTextColor: string;

  // Layout, Alignments & Containers
  scriptLayoutOrder?: ScriptBlockType[];   // e.g. ['arabic', 'secondary', 'primary']
  showTranslationContainer?: boolean;      // Frosted card container toggle
  textAlignment?: 'center' | 'left' | 'right';
  verticalAlignment?: 'middle' | 'top' | 'bottom' | 'split';
  verticalCustomOffset?: number;           // Pixels (-150 to +150, default 0)
  showSurahHeader?: boolean;               // Top Surah title pill toggle

  // Multi-Media Background Sequence
  aspectRatio: '16:9' | '9:16' | '1:1';
  backgroundType: 'video' | 'image' | 'preset';
  backgroundPath: string;
  backgroundClips: BackgroundClip[];
  defaultTransition: TransitionType;
  overlayOpacity: number;
  vignetteIntensity: number;
  kenBurnsEffect: boolean;

  // Audio & Waveform
  reciterIndex: number;
  recitationSpeed: number;                 // 0.75x to 1.25x
  showWaveform: boolean;
  waveformType: 'smooth-wave' | 'mirrored-bars';
  waveformColor: string;
  waveformHeight: number;
  waveformPositionY: number;

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
```

---

## 📜 License

This project is licensed under the MIT License.
