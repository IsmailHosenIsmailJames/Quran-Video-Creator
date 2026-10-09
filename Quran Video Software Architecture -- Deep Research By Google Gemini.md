# **Automated Quranic Video Production Systems: Desktop Architecture and Programmatic Rendering Engine Design**

## **Visual Composition and Aesthetic Deconstruction of Modern Quranic Media**

High-engagement Quranic recitation channels, exemplified by An Nafee (@AnNafee\_Official), have established an identifiable visual grammar that balances sacred typographic reverence with modern digital aesthetics1. The visual pacing avoids aggressive cuts, relying instead on continuous ambient motion that directs viewer focus toward contemplation of the recited verses2. Automating the generation of this media requires deconstructing this visual presentation into discrete graphical layers, deterministically controlled through programmatic styling and timing parameters4.  
The composition architecture consists of four distinct visual strata arranged along the z-axis:

* **Ambient Backdrop (Base Layer):** The primary visual ground utilizes slow-motion, high-definition cinematic footage featuring natural landscapes, atmospheric cloud drifts, rainfall, or minimalist architectural perspectives2. To preserve typographical legibility without sacrificing ambient texture, a multi-stage grading treatment is applied across this footage. This treatment consists of an adjustable dark overlay varying between 35% and 60% opacity, paired with an elliptical edge vignette and moderate color desaturation2. When rendering static background imagery rather than video assets, continuous programmatic camera motion—specifically a sub-pixel Ken Burns scaling effect operating between 1.0 and 1.08 over the verse duration—prevents visual stagnation.  
* **Audio-Reactive Visualization (Intermediate Layer):** Positioned symmetrically below or adjacent to the primary text block, a subtle waveform visualizer responds dynamically to the acoustic energy of the recitation7. In high-production channels, this element is tuned to remain understated, maintaining low alpha transparency and constrained vertical amplitude to avoid competing visually with the sacred scripture2.  
* **Typographic Hierarchy (Foreground Layer):** The focal plane organizes textual information into three vertical tiers2. At the zenith sits the Surah and Ayah metadata banner, displaying chapter titles in both Arabic and English alongside standardized verse numbering2. Centered prominently in the upper midriff is the primary Quranic text, rendered at a substantial scale (typically 48 to 64 pixels at 1080p resolution) with generous line heights to provide clearance for multi-tiered vocalization marks2. Beneath the Arabic text reside the secondary vernacular translations, often organized dual-lingually with a national language—such as Bengali in clean Unicode typography like Kalpurush or Hind Siliguri—flanked by a standard international English translation2.  
* **Channel Identity and Watermarking (Overlay Layer):** Positioned in an upper or lower quadrant, a persistent branding badge or animated channel insignia establishes channel attribution2. This element frequently integrates introductory motion curves, such as soft opacity ramps and subtle scale springs, accompanied by cyclic specular glints or continuous, low-amplitude rotational breathing13.

Video pacing is strictly dictated by the vocal dynamics of the recitation track2. Fixed-duration slide transitions are incompatible with authentic recitations; scene shifts must instead synchronize with acoustic verse boundaries and vocal pauses14. For advanced kinetic subtitles, individual words transition through active color illumination in exact synchronization with the reciter's vocalization15. Inter-verse transitions rely on cross-dissolves spanning 400 to 700 milliseconds, frequently paired with modest vertical translation offsets to maintain continuous visual continuity2.

## **Programmatic Video Generation Frameworks: Comparative Analysis**

Building a desktop video synthesis tool requires an engine capable of handling non-Latin typographic shaping, multi-layered asset compositing, responsive user interface previewing, and performant headless export pipelines4. Traditional programmatic media rendering presents structural trade-offs between low-level performance and typographic accuracy18.

| Engine / Framework | Typographical Fidelity (Arabic/Complex) | Real-Time Interactive Preview | Rendering Performance | Composition & Asset Layering | Desktop Runtime Integration |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **Remotion (React / Node.js / Chromium)** | **HarfBuzz via Blink**; native handling of OpenType ligatures, CSS text effects, bidirectional text, and complex diacritic marks18. | **Sub-millisecond reactive canvas** via @remotion/player; instant state updates without compiling frames4. | High; multi-threaded frame extraction and parallel Chromium tab rendering21. | Native HTML5/CSS3 flexbox, SVG, WebGL, blend modes, and CSS filters7. | Native support via Electron; packaged prebuilt bundle with IPC orchestration19. |
| **FFmpeg CLI / Native Filters (drawtext, libass)** | Poor to Moderate; requires manual FriBidi shaping and Advanced SubStation Alpha (ASS) subtitle compiling18. | None; requires pre-rendering frames or piping streams into external media players. | Extremely fast; direct hardware-accelerated C-level encoding pipeline. | Complex; requires deep, monolithic filter graphs (overlay, split, concat). | Requires managing spawned child processes, standard input/output parsing, and packaging external binaries. |
| **Python Ecosystem (MoviePy / Pillow / OpenCV)** | Poor; Pillow and ImageMagick break complex diacritic stacking without custom HarfBuzz bindings18. | Very poor; relies on external GUI libraries (Tkinter, PyQt) with high playback latency. | Slow; heavy Python Global Interpreter Lock (GIL) overhead during per-frame image array looping. | Programmatic Python scripts; lacks declarative visual layout engines. | Heavy desktop packaging footprint (PyInstaller, bundled Python runtimes)5. |
| **Motion Canvas (TypeScript / Canvas API)** | Moderate; uses standard HTML5 2D Canvas fillText, which lacks fine-grained CSS ligature controls. | Excellent; browser-based preview with timeline inspection. | High; lightweight procedural canvas execution. | Programmatic procedural layouts; less extensible than comprehensive CSS systems. | Feasible via Webview/Tauri, but lacks turnkey desktop production templates. |

Remotion emerges as the most capable engine for this application domain4. Quranic Arabic typography presents complex challenges to digital graphics engines: vowel marks (*tashkeel*) stack up to three levels vertically on a single skeletal character, pause annotations (*waqf*) sit elevated above the baseline, and dynamic verse numbering must be bounded symmetrically within circular glyph markers10. Command-line tools like FFmpeg's drawtext and Python's Pillow consistently fail to render these correctly, regularly producing disconnected letterforms, reversed right-to-left sequencing, and mislocated accent marks18.  
Because Remotion executes within a headless Chromium environment powered by the Blink layout engine, HarfBuzz text shaping, and Skia rasterization, it processes OpenType Layout (GSUB, GPOS) tables natively through modern CSS typography specifications18. Furthermore, Remotion provides @remotion/player, a standalone React component that enables 60-frames-per-second, real-time scrubbing directly inside a desktop application window4. This eliminates the need to compile test videos, allowing users to modify font sizes, logo scales, and background colors with immediate visual feedback4.

## **Quranic Orthography, Font Engines, and Complex Arabic Typography**

Rendering Quranic scripture requires distinguishing between modern standard Arabic and classical Quranic orthography (*Rasm*)10. Standard Arabic typefaces lack the extensive OpenType feature sets and specialized glyph dictionaries necessary to reflect historical Mushaf conventions10.  
The design of a Quranic rendering engine must navigate two distinct regional orthographies demanded by global audiences28. The Medina Uthmani script reflects the international standard promulgated by the King Fahd Glorious Quran Printing Complex10. Its visual hallmark is *Hadhf*—the historical omission of internal *alifs* from the skeletal text, represented instead by miniature superscript dagger *alifs*—alongside standardized pausal indicators such as mandatory stops (*meem*), permissible pauses (*jeem*), and continuation preferences (*sala*)10. In contrast, the Indo-Pak script—predominant across South Asia—employs a heavier, cursive Naskh-Nastaleeq ductus28. In this script, medial vowel glides are spelled explicitly, and alternate diacritical symbols, such as inverted curved chevrons for *jazm* rather than the open-head *khah*, are employed to guide non-native Arabic readers11.

| Font Family | Target Orthography | Diacritic & Ligature Capabilities | Supported Data Scheme | Licensing & Commercial Use |
| :---- | :---- | :---- | :---- | :---- |
| **KFGQPC Uthmanic Script HAFS** \[cite: 31, 32\] | Medina Mushaf (Uthmani Hafs)31 | Official King Fahd Complex font. Full support for Medina pausal ligatures and *mkmk* mark stacking32. | Standard Unicode Uthmani; Tanzil Uthmani text33. | Free distribution; usage governed by King Fahd Complex end-user terms32. |
| **KFGQPC Uthman Taha Naskh** \[cite: 36, 37\] | Standard Quranic Naskh36 | Optimized stroke balance designed for high legibility across digital screens and mobile interfaces36. | Standard Arabic Unicode and Uthmani text formats38. | Freely distributable for digital applications with attribution35. |
| **me\_quran** (by Meor Ridzuan)40 | Medina Mushaf with custom metric corrections40 | Contains custom OpenType lookup tables engineered specifically for sequential *tanween* positioning34. | Specialized Tanzil Uthmani (requires "Sequential Tanweens" export flag)34. | Freeware; permissible for bundling in open-source and personal suites35. |
| **PDMS Saleem Quran** \[cite: 28, 41\] | Indo-Pak Quranic Script28 | Native South Asian Quranic rendering; correctly positions sub-linear and super-linear Indo-Pak accents28. | Indo-Pak text databases; Tanzil Simple/IndoPak encodings28. | Free distribution, developed by Pakistan Data Management Services28. |
| **Amiri Quran** | Classical Cairo Typeface / Uthmani44 | Open-source revival of the Bulaq press; extensive glyph set covering complex Quranic vocalizations. | Broad Unicode Arabic standard. | SIL Open Font License (OFL); fully approved for commercial desktop embedding35. |

To render these fonts properly within Chromium's CSS environment, developers must configure specific CSS typography properties18. Standard browser layout engines frequently disable advanced glyph positioning to reduce render latency18. A production rendering pipeline must explicitly enable the bidirectional algorithm and activate Mark-to-Base (mark) and Mark-to-Mark (mkmk) OpenType lookups:

CSS  
.quranic-arabic-text {  
  direction: rtl;  
  unicode-bidi: bidi-override;  
  text-align: center;  
  font-family: "KFGQPC Uthmanic Script HAFS", "me\_quran", "Amiri Quran", serif;  
  font-size: 58px;  
  line-height: 2.2;  
  font-feature-settings: "kern" 1, "liga" 1, "mkmk" 1, "mark" 1, "calt" 1;  
  text-rendering: optimizeLegibility;  
  \-webkit-font\-smoothing: antialiased;  
}

The activation of mkmk is essential; without it, overlapping marks such as a *shadda* and a *fatha* on the same consonant will visually collide rather than stacking gracefully10. Furthermore, a generous line-height multiplier (ranging from 2.0 to 2.4) provides vertical clearance, ensuring that high *waqf* pause marks do not clip into preceding graphical boundaries10.

## **Canonical Data Ingestion, Timestamp Alignment, and Audio Pipelines**

A video generation pipeline cannot rely on manually entered scripture, as orthographic mistakes in Quranic transcription are unacceptable10. Production tools require an automated pipeline that pulls verified text, correlates it with canonical audio recordings, and uses sub-second word timestamps34.  
Text acquisition relies on a dual-source strategy combining local offline storage with authenticated cloud endpoints16. The Tanzil Project serves as the definitive offline corpus10. By embedding Tanzil's cryptographically verified UTF-8 SQL or JSON exports within a local SQLite database, the desktop application operates independently of internet connectivity10. Tanzil provides discrete data distributions: the Medina Uthmani export contains canonical diacritics and pausal glyphs, while the Simple export provides standardized modern orthography suited for linguistic search and vernacular matching10.  
For live enrichment, the application interfaces with the Quran Foundation Content API (v4.0.0) hosted at api.quran.com46. This service delivers verified verse translations across dozens of global languages (including authorized Bengali translations by the Bayan Foundation and Zohurul Hoque), English transliterations, and reciter metadata2. The relevant programmatic endpoints include:

* *Uthmani Text Endpoint:* GET /api/v4/quran/verses/uthmani?verse\_key={surah}:{ayah}  
  \[cite: 48, 49\]  
* *Indo-Pak Text Endpoint:* GET /api/v4/quran/verses/indopak?verse\_key={surah}:{ayah}  
  \[cite: 49\]  
* *Translation Endpoint:* GET /api/v4/quran/translations/{translation\_id}?verse\_key={surah}:{ayah}  
  \[cite: 48, 50\]

Recitation audio ingestion is handled through structured remote storage repositories45. The EveryAyah repository provides an extensive catalog of pre-segmented verse-by-verse MP3 files covering notable reciters, including Ismail An Nouri, Mishary Rashid Alafasy, and Mahmoud Khalil Al-Husary2. These files follow a predictable addressing structure: https\://everyayah.com/data/{Reciter\_Identifier}/{Surah:03d}{Ayah:03d}.mp345.  
For advanced text animation where words light up in sync with the recitation, the software queries the Quran Foundation Audio Reciter lookup service using the segments=true parameter15. This returns structured temporal arrays detailing millisecond start and end boundaries for each spoken word15:

JSON  
{  
  "verse\_key": "1:1",  
  "timestamp\_from": 0,  
  "timestamp\_to": 4500,  
  "segments": \[  
    \[1, 0, 750\],  
    \[2, 751, 1500\],  
    \[3, 1501, 2800\],  
    \[4, 2801, 4500\]  
  \]  
}

Within the React render loop, these temporal offsets are converted into visual states15. The composition calculates the active playback time in milliseconds based on the current frame index:  
![][image1]  
A word at index ![][image2] is assigned an active highlight state whenever ![][image3] falls within its designated segment range:  
![][image4]  
This synchronization approach operates with sub-frame accuracy, enabling responsive typographic highlighting during video rendering15.

## **Desktop Software Architecture: Electron Integration and Process Orchestration**

To deliver a responsive user experience, the desktop software must separate user interface interactions from heavy video compilation19. Electron serves as the host shell, housing a React interface alongside a Node.js main process that orchestrates the Remotion compilation pipeline19.  
The application architecture enforces strict process isolation19. The UI layer (Renderer Process) handles user interactions, parameter inputs, asset uploads, and timeline scrubbing4. The Renderer embeds @remotion/player, passing the current configuration state directly to the composition component for instant visual feedback4. Under Electron security policies, the Renderer is prohibited from invoking native filesystem access, spawning background processes, or executing renderMedia()19.  
Privileged operations run through a typed Inter-Process Communication (IPC) bridge managed by preload.ts19. When the user requests a video render, the Renderer serializes the template state into a JSON payload and dispatches an asynchronous IPC signal19. The Main Process receives this payload, resolves local file paths, configures the headless browser runtime, and manages the encoding workflow19.

\+--------------------------------------------------------------------------+  
|                       Desktop Application Runtime                        |  
|                                                                          |  
|  \[Renderer Process (Chromium UI / React)\]                                |  
|  \- Configuration Form (Inputs, Colors, Sliders)                          |  
|  \- Asset Selection (Dropzones for Video/Logo/Fonts)                      |  
|  \- Live Interactive Canvas Mount (\<Player /\> from @remotion/player)      |  
|         │                                                                |  
|         │ IPC: 'trigger-render' (Serialized Props Payload)               |  
|         ▼                                                                |  
|  \[Electron Main Process (Node.js Execution Environment)\]                 |  
|  \- Reads Pre-bundled Composition Directory from app.asar.unpacked        |  
|  \- Manages Headless Chrome Shell & Compositor Binaries                   |  
|  \- Calls selectComposition() and renderMedia()                           |  
|  \- Emits Frame Progress Back Over IPC                                    |  
|         │                                                                |  
|         ▼                                                                |  
|  \[Local File System\]                                                     |  
|  Exports Final Optimized MP4 File                                        |  
\+--------------------------------------------------------------------------+

A common issue when distributing Electron applications with embedded video engines is handling the Electron Archive (ASAR) format19. By default, packaging utilities bundle application dependencies into a single, compressed app.asar archive19. However, the low-level compositor binaries required by Remotion, along with native FFmpeg binaries, cannot execute from within an ASAR container19.  
To maintain application stability in production, build configurations must unpack these native binaries into the filesystem19. In the packaging configuration (electron-builder.json), developers should configure asarUnpack patterns for Remotion's binary modules:

JSON  
{  
  "appId": "com.quranvideo.studio",  
  "productName": "Quran Video Studio",  
  "asar": true,  
  "asarUnpack": \[  
    "\*\*/node\_modules/@remotion/compositor-\*/\*\*",  
    "\*\*/node\_modules/@remotion/renderer/\*\*",  
    "\*\*/remotion-bundle/\*\*"  
  \]  
}

Furthermore, invoking dynamic compilation functions like bundle() at runtime inside a packaged desktop application should be avoided, as it requires shipping heavy developer compilers and introduces runtime latency19. Instead, the Remotion composition should be pre-bundled into a static directory during the packaging step19.  
During execution, the Electron Main Process points renderMedia() to this unpacked static directory and passes the explicit binariesDirectory path pointing to process.resourcesPath inside app.asar.unpacked19. To guarantee offline functionality, Chromium Headless Shell should also be pre-fetched during application packaging via ensureBrowser(), avoiding dynamic browser downloads on the user's machine19.

## **Motion Graphics Engineering: Audio Reactivity and Dynamic Transitions**

Creating polished Quranic videos requires dynamic motion design that complements the rhythm of the recitation2. This is achieved by combining audio visualization with physics-based component animations7.  
Dynamic waveforms are generated by processing the recitation audio through Remotion's @remotion/media-utils package7. Rather than loading large audio files entirely into memory—which can cause performance issues during extended Surahs—the engine processes temporal slices using useAudioData() or useWindowedAudioData()7. The visualization pipeline extracts amplitude distributions for the current frame, maps them to Cartesian coordinates, and renders an SVG spline curve:

TypeScript  
import React from 'react';  
import { useCurrentFrame, useVideoConfig } from 'remotion';  
import { useAudioData, visualizeAudioWaveform, createSmoothSvgPath } from '@remotion/media-utils';

interface WaveformProps {  
  audioSrc: string;  
  color: string;  
}

export const AudioReactiveWaveform: React.FC\<WaveformProps\> \= ({ audioSrc, color }) \=\> {  
  const frame \= useCurrentFrame();  
  const { fps, width } \= useVideoConfig();  
  const audioData \= useAudioData(audioSrc);

  if (\!audioData) {  
    return null;  
  }

  const waveform \= visualizeAudioWaveform({  
    fps,  
    frame,  
    audioData,  
    numberOfSamples: 64,  
    windowInSeconds: 1 / fps,  
  });

  const height \= 120;  
  const svgPath \= createSmoothSvgPath({  
    points: waveform.map((val, idx) \=\> ({  
      x: (idx / (waveform.length \- 1)) \* (width \* 0.6) \+ (width \* 0.2),  
      y: (val \* height \* 0.5) \+ (height / 2),  
    })),  
  });

  return (  
    \<div style={{ position: 'absolute', bottom: '18%', width: '100%', display: 'flex', justifyContent: 'center' }}\>  
      \<svg width={width} height={height} style={{ overflow: 'visible' }}\>  
        \<path d={svgPath} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.8} /\>  
      \</svg\>  
    \</div\>  
  );  
};

To achieve fluid visual pacing, animations use spring physics rather than linear keyframes2. Using Remotion's spring() utility, channel logos and verse transitions animate with natural momentum13:  
![][image5]  
Applying a damping ratio of 12 and a stiffness coefficient of 100 produces an entrance that settles smoothly without disruptive oscillation13. For verse transitions, an interpolation curve handles visual pacing: as an Ayah completes, the existing verse translates upward by 20 pixels while fading out over 15 frames, while the incoming verse moves into position from an initial downward offset with a matching opacity ramp2.

## **System Architecture, Component Specifications, and Implementation Roadmap**

Structuring the desktop software around modular components ensures clear separation of concerns, simplifies maintenance, and isolates core media rendering tasks53.

| Module / Component | Technology Stack | Primary Functionality | Input Interfaces | Output Artifacts |
| :---- | :---- | :---- | :---- | :---- |
| **GUI Shell & Settings Panel** | React, TailwindCSS, Lucide Icons53 | Collects user preferences, background uploads, text selections, and font choices. | User filesystem inputs, mouse/keyboard events. | Reactive Props State Object (VideoTemplateConfig). |
| **Live Interactive Preview** | @remotion/player \[cite: 4, 9\] | Mounts in the main UI canvas to provide 60fps instant timeline scrubbing and playback4. | VideoTemplateConfig, loaded audio, local fonts. | Real-time DOM canvas render4. |
| **Quran Data Manager** | SQLite3, Axios, Tanzil Corpora34 | Queries local Ayah text, pulls translations, and fetches word-by-word timestamps15. | Surah and Ayah range selectors (e.g., Surah 36: 1–12)2. | Normalized JSON payload of verses and timestamps15. |
| **Remotion Composition Root** | Remotion, HTML5, SVG, CSS Modules20 | Pure functional component defining all four visual layers, timing sequences, and transitions20. | Serialized configuration props passed from preview or render pipelines4. | Composed video frames across virtual timeline. |
| **IPC Orchestrator** | Electron Main, IPC Handlers, contextBridge \[cite: 19, 53\] | Bridges secure system commands between UI window and native OS environment19. | JSON commands: START\_RENDER, CANCEL\_RENDER. | Status events, percentage progress, error logs19. |
| **Headless Video Compiler** | @remotion/renderer, Chromium, FFmpeg19 | Launches headless browser, composites frames in parallel, and stitches final MP419. | Pre-bundled Remotion build, target file destination19. | Optimized H.264 / AAC MP4 Video File4. |

Building this desktop suite follows a step-by-step engineering roadmap:  
The first phase establishes the project skeleton using Electron Forge paired with Vite and React, enforcing process isolation and context boundaries through preload.ts19. The typography system is set up next by bundling licensed Quranic fonts (KFGQPC Uthmanic Script HAFS, me\_quran, and PDMS Saleem) directly into the local application package, using offline @font-face rules to prevent layout shifts or network errors during headless rendering31.  
The third phase implements the data layer by embedding a local SQLite database containing Tanzil's verified Uthmani and Simple Quranic corpora10. This offline database handles verse lookups immediately, while an asynchronous networking module connects to the Quran Foundation v4 API to fetch word timestamps and recitation audio on demand15.  
The fourth phase develops the core video composition in Remotion, creating the layered layout that combines background video treatments, audio-reactive waveform graphics, and synchronized typography7. This component is integrated into the user interface via @remotion/player, providing real-time timeline scrubbing and visual customization4.  
The final phase implements the background video export pipeline, configuring Electron's main process to drive headless video compilation via @remotion/renderer19. Packaging scripts are updated to extract native compositor binaries into app.asar.unpacked and bundle Chromium Headless Shell19. This yields a self-contained, stable desktop application capable of generating polished Quranic recitation videos that match professional broadcast standards2.

#### **Works cited**

> 1. An Nafee \- YouTube, [https\://www\.youtube.com/@AnNafee\_Official/search](https://www.youtube.com/@AnNafee_Official/search)  
> 2. Heart Soothing Recitation of Sura Yaseen Recited by Ismail An, [https\://www\.youtube.com/watch?v=VLyktW15HXI](https://www.youtube.com/watch?v=VLyktW15HXI)  
> 3. আবেগময় সূরা কাহফ এর তিলাওয়াত Beautiful Surah Kahf Recited by, [https\://www\.youtube.com/watch?v=5R06LRdUCSE](https://www.youtube.com/watch?v=5R06LRdUCSE)  
> 4. @remotion/player, [https\://www\.remotion.dev/player](https://www.remotion.dev/player)  
> 5. Quran Video Maker — Quran Video · Built with Blink, [https\://blink.new/p/quran-video-maker-ybjxvnmi](https://blink.new/p/quran-video-maker-ybjxvnmi)  
> 6. How to Create an Audio Visualiser in Davinci Resolve \- YouTube, [https\://www\.youtube.com/watch?v=E9oWXZjBTCg](https://www.youtube.com/watch?v=E9oWXZjBTCg)  
> 7. Audio Visualization | Remotion | Make videos programmatically, [https\://www\.remotion.dev/docs/audio/visualization](https://www.remotion.dev/docs/audio/visualization)  
> 8. visualizeAudioWaveform() | Remotion | Make videos programmatically, [https\://www\.remotion.dev/docs/media-utils/visualize-audio-waveform](https://www.remotion.dev/docs/media-utils/visualize-audio-waveform)  
> 9. Circular Waveform \- Clippkit, [https\://www\.clippkit.com/docs/ui/audio-waveforms/circular-waveform](https://www.clippkit.com/docs/ui/audio-waveforms/circular-waveform)  
> 10. The Digital Canon: A Comparative Philological and Technical, [https\://thequran.love/2025/11/30/the-digital-canon-a-comparative-philological-and-technical-analysis-of-quranic-orthography-on-quran-com-and-tanzil-net/](https://thequran.love/2025/11/30/the-digital-canon-a-comparative-philological-and-technical-analysis-of-quranic-orthography-on-quran-com-and-tanzil-net/)  
> 11. Quran Explorer \- Quranic Research, [http\://quranic-research.net/quran/index2.html](http://quranic-research.net/quran/index2.html)  
> 12. An API for the Holy Quran with no rate limit. Use it for ... \- GitHub, [https\://github.com/The-Quran-Project/Quran-API](https://github.com/The-Quran-Project/Quran-API)  
> 13. may215/openmontage\_ui: Full UI video editor for the ... \- GitHub, [https\://github.com/may215/openmontage\_ui](https://github.com/may215/openmontage_ui)  
> 14. The Tarteel Dataset: Crowd-Sourced and Labeled Quranic Recitation, [https\://openreview.net/pdf?id=TAdzPkgnnV8](https://openreview.net/pdf?id=TAdzPkgnnV8)  
> 15. Lookup verse by timestamp \- Quran Foundation API Docs, [https\://api-docs.quran.foundation/docs/content\_apis\_versioned/4.0.0/audio-reciter-lookup/](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/audio-reciter-lookup/)  
> 16. Privacy Policy — TaubatApp, [https\://www\.taubat.app/privacy](https://www.taubat.app/privacy)  
> 17. Quran Video Maker — Free Online Quran Video Generator, [https\://quranvideomaker.com/](https://quranvideomaker.com/)  
> 18. common-thread \- uncanny.fyi, [https\://uncanny.fyi/common-thread/](https://uncanny.fyi/common-thread/)  
> 19. Using Remotion in Electron | Make videos programmatically, [https\://www\.remotion.dev/docs/electron](https://www.remotion.dev/docs/electron)  
> 20. Remotion: A framework for making videos in React \- LogRocket Blog, [https\://blog.logrocket.com/remotion-a-framework-for-making-videos-in-react/](https://blog.logrocket.com/remotion-a-framework-for-making-videos-in-react/)  
> 21. Render your video | Remotion | Make videos programmatically, [https\://www\.remotion.dev/docs/render](https://www.remotion.dev/docs/render)  
> 22. @remotion/renderer | Remotion | Make videos programmatically, [https\://www\.remotion.dev/docs/renderer](https://www.remotion.dev/docs/renderer)  
> 23. Compare Packages Between Distributions \- DistroWatch.com, [https\://distrowatch.com/dwres.php?resource=compare-packages\&firstlist=netbsd\&secondlist=debian&=0\&secondversions=0\&showall=yes](https://distrowatch.com/dwres.php?resource=compare-packages&firstlist=netbsd&secondlist=debian&=0&secondversions=0&showall=yes)  
> 24. quran-api · GitHub Topics, [https\://github.com/topics/quran-api?l=python\&o=desc\&s=forks](https://github.com/topics/quran-api?l=python&o=desc&s=forks)  
> 25. itsPremkumar/Automated-Video-Generator: Agentic AI ... \- GitHub, [https\://github.com/itsPremkumar/Automated-Video-Generator](https://github.com/itsPremkumar/Automated-Video-Generator)  
> 26. Remotion | Make videos programmatically, [https\://www\.remotion.dev/](https://www.remotion.dev/)  
> 27. HQDR and HQPS: A Holy Quran digital repository with advanced, [https\://www\.researchgate.net/publication/413257775\_HQDR\_and\_HQPS\_A\_Holy\_Quran\_digital\_repository\_with\_advanced\_pattern\_search\_and\_AI-enhanced\_natural\_language\_interface](https://www.researchgate.net/publication/413257775_HQDR_and_HQPS_A_Holy_Quran_digital_repository_with_advanced_pattern_search_and_AI-enhanced_natural_language_interface)  
> 28. Quran Arabic Fonts \- Islamicstudies.info, [https\://islamicstudies.info/quran/arabic/fonts.htm](https://islamicstudies.info/quran/arabic/fonts.htm)  
> 29. Uthmani vs IndoPak Script: Which Mushaf to Read \- RecitID, [https\://recitid.ai/blog/uthmani-vs-indopak-script](https://recitid.ai/blog/uthmani-vs-indopak-script)  
> 30. Download Quranic Font | Quran Standard Font | Islamic Fonts, [https\://urdunigaar.com/download-quranic-font-quran-standard-font-islamic-fonts/](https://urdunigaar.com/download-quranic-font-quran-standard-font-islamic-fonts/)  
> 31. KFGQPC Uthmanic Script HAFS Regular: Download Free Arabic Fonts, [https\://arabicfonts.net/fonts/kfgqpc-uthmanic-script-hafs-regular](https://arabicfonts.net/fonts/kfgqpc-uthmanic-script-hafs-regular)  
> 32. KFGQPC HAFS Uthmanic Script Font Family, [https\://font.download/font/kfgqpc-hafs-uthmanic-script](https://font.download/font/kfgqpc-hafs-uthmanic-script)  
> 33. GitHub \- thetruetruth/quran-data-kfgqpc: Quran Unicode Uthmanic, [https\://github.com/thetruetruth/quran-data-kfgqpc](https://github.com/thetruetruth/quran-data-kfgqpc)  
> 34. Download Quran Text \- Tanzil, [https\://tanzil.net/download/](https://tanzil.net/download/)  
> 35. GitHub \- vdemir/zekr: Zekr is an Open Source Qur'an study project., [https\://github.com/vdemir/zekr](https://github.com/vdemir/zekr)  
> 36. KFGQPC Uthman Taha Naskh Regular: Download Free Arabic Fonts, [https\://arabicfonts.net/fonts/kfgqpc-uthman-taha-naskh-regular](https://arabicfonts.net/fonts/kfgqpc-uthman-taha-naskh-regular)  
> 37. KFGQPC Uthman Taha Naskh in use \- Fonts In Use, [https\://fontsinuse.com/typefaces/138132/kfgqpc-uthman-taha-naskh](https://fontsinuse.com/typefaces/138132/kfgqpc-uthman-taha-naskh)  
> 38. KFGQPC Uthman Taha Naskh – Arabic Font Download 2026, [https\://jameelnoori.com/kfgqpc-uthman-taha-naskh-regular-arabic-font/](https://jameelnoori.com/kfgqpc-uthman-taha-naskh-regular-arabic-font/)  
> 39. nuqayah/qpc-fonts: KF Glorious Qur'an Printing Complex fonts · GitHub, [https\://github.com/nuqayah/qpc-fonts](https://github.com/nuqayah/qpc-fonts)  
> 40. Me\_quran font \- Tanzil Documents, [https\://tanzil.net/docs/me\_quran\_font](https://tanzil.net/docs/me_quran_font)  
> 41. Quranic Fonts \- Tanzil Documents, [https\://tanzil.net/docs/quranic\_fonts](https://tanzil.net/docs/quranic_fonts)  
> 42. Library for downloading Quran text from tanzil.net. \- GitHub, [https\://github.com/risan/tanzil-downloader](https://github.com/risan/tanzil-downloader)  
> 43. quran-api/editions.json at 1 · fawazahmed0/quran-api · GitHub, [https\://github.com/fawazahmed0/quran-api/blob/1/editions.json](https://github.com/fawazahmed0/quran-api/blob/1/editions.json)  
> 44. Quran font🏆 Print prayer times Amiri أميري is a classical Arabic, [https\://shoppingaparis.fr/pubisaxamugite/](https://shoppingaparis.fr/pubisaxamugite/)  
> 45. Islamic App Resources: Data Sources & Packages, [https\://www\.abdalrhmanreda.tech/blog/islamic-app-resources-data-sources-packages/](https://www.abdalrhmanreda.tech/blog/islamic-app-resources-data-sources-packages/)  
> 46. Quran Foundation Content API (v4.0.0), [https\://api-docs.quran.foundation/docs/category/content-apis-4.0.0/](https://api-docs.quran.foundation/docs/category/content-apis-4.0.0/)  
> 47. netease-youdao/LobsterAI at xiangyugongzuoliu.com \- GitHub, [https\://github.com/netease-youdao/LobsterAI?ref=xiangyugongzuoliu.com](https://github.com/netease-youdao/LobsterAI?ref=xiangyugongzuoliu.com)  
> 48. Surah At-Tawbah, 9:40 \#shorts \#tawbah \#surah \#islam ... \- YouTube, [https\://www\.youtube.com/shorts/gzKXMm9f3WU](https://www.youtube.com/shorts/gzKXMm9f3WU)  
> 49. cs50p final project repo · GitHub \- Quran Python, [https\://github.com/AdelShousha/cs50p-final-project](https://github.com/AdelShousha/cs50p-final-project)  
> 50. Quran 39:53 \#shorts \#quran \#islam \#hadith \#sunnah \#islamic, [https\://www\.youtube.com/shorts/Z8kq\_yys4rM](https://www.youtube.com/shorts/Z8kq_yys4rM)  
> 51. Every Ayah, [https\://everyayah.com/](https://everyayah.com/)  
> 52. quranlab/quran-audio · Datasets at Hugging Face, [https\://huggingface.co/datasets/quranlab/quran-audio](https://huggingface.co/datasets/quranlab/quran-audio)  
> 53. minghinmatthewlam/pi-gui: Electron GUI app for the pi coding agent, [https\://github.com/minghinmatthewlam/pi-gui](https://github.com/minghinmatthewlam/pi-gui)  
> 54. LobsterAI \- Open-Source 24/7 AI Agent Desktop App by NetEase, [https\://allclaw.org/entry/lobsterai](https://allclaw.org/entry/lobsterai)  
> 55. Remotion 2.3 | Remotion | Make videos programmatically, [https\://www\.remotion.dev/blog/2-3](https://www.remotion.dev/blog/2-3)  
> 56. useWindowedAudioData() | Remotion | Make videos programmatically, [https\://www\.remotion.dev/docs/use-windowed-audio-data](https://www.remotion.dev/docs/use-windowed-audio-data)  
> 57. WeSight desktop AI agent workspace \- GitHub, [https\://github.com/freestylefly/wesight](https://github.com/freestylefly/wesight)

[image1]: <data:image/png;base64,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>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAcCAYAAACtQ6WLAAAAfUlEQVR4XmNgGBzgPxDroQvCwBIgZkEXJB8wA7E2uiAIaALxESDeBsS8yBIgHbeA2ASIfYE4GFnSDoi1oOwbDDhcasQA8SNW0MKAQ5IRiG8D8VUgNgRiK2RJJwaIrkog3gjE9siSUVBJByDehywBAkJA/IIBoksBVWoU4AYAMlcSRavOFb0AAAAASUVORK5CYII=>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAABOklEQVR4Xu2Uq0sEURSHz/oIBpMGxSaCJrFYxGAxCnZtBncx7kPzssVHFvwjtBgMmkWWbYKvJIoGk80k6+/HObLXs4gT7l0Q5oOPuXPOzJw5d+4dkZz/xgxc98EUPMM2HPCJmEyKFmn5RGyORAst+0QsSqIFvHvhRTHhw899MAUsVPfBFHzCYR+MzRi89MEUrMHd4HwezsF70SndggfwCi7ATViGxe8bwDSswH14FsR/cCidZT0Em3AW9sNXeAdHYQO+wQ279gNO2JgLiXuxAE8t1sUiPBZ9kx04GORuYc3GPN4EOXbLe8kUvLZY2GkX7IDdeP4qtGTjVTuy23fpdJqZB7htY3b7W6EXOCL6n+T0jls8ExeiD3sS/T6PotuA8RXLcbr4x+fC4bc5gVVJCBdLn/RgL+bkZOMLYqlApB/cKnUAAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,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>

[image5]: <data:image/png;base64,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>