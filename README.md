# Quran Video Studio 🎥📖

A production-grade desktop application built with **Electron**, **React**, **Vite**, and **Remotion** to create cinematic Quran recitation videos with synchronized word-by-word karaoke typography, dynamic audio waveforms, multi-media background timeline sequences, and high-definition MP4 rendering.

---

## ✨ Features

- **Word-by-Word Synchronized Typography**: Real-time karaoke highlight syncing with recitation audio.
- **Multi-Media Background Timeline**:
  - Upload multiple background videos and images sequentially to fill the recitation duration.
  - Interactive timeline editor with clip trimming, proportional duration ratios, and video speed control (0.5×–2×).
  - Smooth cinematic transitions between clips (*Zoom Fade*, *Crossfade*, *Blur Melt*, *Dip to Black*, *Slide Push*).
- **Recitation Speed Control**: Adjust recitation playback speed (0.75×–1.25×) with lockstep word highlight synchronization.
- **Multi-Format Aspect Ratios**:
  - `16:9` Widescreen (YouTube, Desktop)
  - `9:16` Vertical (YouTube Shorts, Instagram Reels, TikTok)
  - `1:1` Square (Social Feeds)
- **Multi-Lingual Translations**: Supports Bengali, English, Urdu, Hindi, and more with primary and secondary subtitle layers.
- **Multiple Quranic Scripts & Typefaces**: Uthmanic Hafs, IndoPak Nastaleeq, QPC Hafs, Amiri, Lateef, and more.
- **Audio-Reactive Visualizer Waveforms**: Multiple styles (*Bars*, *Mirror*, *Wave*, *Dots*, *Line*) with custom coloring and smoothing.
- **High-Definition Video Export**: Multi-threaded MP4 video rendering powered by Remotion with 720p, 1080p, and 4K output.

---

## 📋 Prerequisites

Ensure you have the following installed on your system:

- **Node.js**: `v18.0.0` or higher (`v20+` or `v22+` recommended)
- **npm**: `v9.0.0` or higher (bundled with Node.js)
- **C/C++ Build Tools & Python** (required to compile native modules such as `better-sqlite3` if rebuilding):
  - **Linux (Debian/Ubuntu/Fedora)**: `build-essential`, `python3` (e.g., `sudo apt install build-essential python3` or `sudo dnf groupinstall "Development Tools"`)
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Windows**: Visual Studio Build Tools (C++ workload) and Python

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

> **Note for native modules (`better-sqlite3`)**: If you encounter SQLite native module binding errors during startup, rebuild them for your current Electron runtime:
> ```bash
> npx electron-rebuild -f -w better-sqlite3
> ```

---

## 🛠️ Development & Running

### Run Development Mode (Live Hot Reload)

Launch the Vite development server and the Electron application with instant HMR:

```bash
npm run dev
```

This starts:
- The Vite renderer server at `http://localhost:5173`
- The Electron main process connected to Vite with hot-reload enabled.

---

## 🏗️ Building & Compiling

### 1. Typecheck & Compile TypeScript / Vite

To verify TypeScript types and generate production bundles for the renderer, preload, and main processes:

```bash
npm run build:vite
```

Or run TypeScript check only without bundling:

```bash
npm run lint
```

### 2. Pack Desktop Application (Unpackaged Directory)

Compile all code and create an executable binary directory in `release/`:

```bash
npm run pack
# or
npm run build
```

The output will be placed inside:
- `release/linux-unpacked/` (on Linux)
- `release/mac/` (on macOS)
- `release/win-unpacked/` (on Windows)

### 3. Build Distribution Packages / Installers

Generate production distribution installers (`.tar.gz` for Linux, `.dmg`/`.zip` for macOS, `.exe` NSIS installer for Windows):

```bash
npm run dist
```

Installers and distribution archives are generated inside the `release/` directory.

---

## 📂 Project Structure

```text
Quran-Video-Creator/
├── Quran fonts/                   # Embedded Quranic typefaces (.ttf, .otf)
├── Quran Scripts/                 # SQLite database files for Quranic scripts (.db)
├── compressed_translation_simple/ # BZip2 compressed translation files
├── public/                        # Static assets (presets, background images)
├── recitations.json               # Reciter catalog, audio URLs, and segment timings
├── src/
│   ├── main/                      # Electron Main process
│   │   ├── services/              # SQLite queries, recitation audio loader, Remotion renderer runner
│   │   ├── ipc-handlers.ts        # IPC bridge handlers
│   │   └── index.ts               # Application window & native menu setup
│   ├── preload/                   # Electron Preload script (safe window.electronAPI bridge)
│   ├── remotion/                  # Remotion compositions & video rendering engine
│   │   ├── compositions/          # BackgroundLayer, TypographyLayer, WaveformLayer, BrandingLayer
│   │   ├── Root.tsx               # Remotion root configuration & dynamic metadata calculation
│   │   └── index.ts               # Bundler entrypoint
│   ├── renderer/                  # React UI (Tailwind CSS, Zustand, Lucide icons)
│   │   ├── components/            # LivePreview, Timeline, Scripture/Visuals/Waveform tabs, Export modal
│   │   ├── store/                 # studio-store.ts (Zustand state management)
│   │   └── App.tsx                # Studio layout shell
│   └── shared/                    # TypeScript interfaces, constants, and utilities
├── electron-builder.json          # Desktop packaging configuration
├── vite.config.ts                 # Vite + Electron build configuration
└── package.json                   # Project scripts and dependencies
```

---

## 📖 Data Architecture & Assets Reference

### 1. Compressed Translations (`compressed_translation_simple/`)
Translation texts are stored compressed with **BZip2** to reduce repository and binary footprint. In Node.js / Electron, they are decoded using `seek-bzip`. 

If reading compressed translation data from Dart / Flutter:
```dart
String decodeBZip2String(String compressedText) {
  final compressedBytes = base64.decode(compressedText);
  final decompressedBytes = BZip2Decoder().decodeBytes(compressedBytes);
  return utf8.decode(decompressedBytes);
}
```

### 2. Recitations & Word Timings (`recitations.json`)
Contains available reciters with endpoints for audio files (`audio_url`) and encoded word-by-word timestamp segments (`segments_url`).

### 3. Surah Title Calligraphy Font (`surah-name-v1.ttf`)
Special ligatures are used to display decorative Surah name headers. For example, in Flutter:
```dart
Text(
  "surah${surahNumber.toString().padLeft(3, '0')}",
  style: TextStyle(
    fontFamily: "surah-name-v1",
    fontSize: 22,
    color: isDark ? Colors.white : Colors.grey.shade900,
  ),
);
```
In the web/Remotion composition, this is rendered via `@font-face` with `.surah-calligraphy-title`.

---

## 📜 License

This project is licensed under the MIT License.
