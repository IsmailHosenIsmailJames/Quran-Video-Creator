import React, { useState } from 'react';
import { useStudioStore } from '../../store/studio-store';
import {
  THUMBNAIL_PRESET_OPTIONS,
  THUMBNAIL_HOOK_SUGGESTIONS,
  THUMBNAIL_BADGE_PRESETS,
  ThumbnailLayoutMode,
} from '../../../shared/thumbnail-types';
import { BACKGROUND_PRESETS } from '../../../shared/constants';
import {
  Sparkles,
  Camera,
  Upload,
  Image as ImageIcon,
  Type,
  Layers,
  Palette,
  Eye,
  Sliders,
  Check,
  Star,
  Columns,
  Maximize,
  Compass,
  Zap,
} from 'lucide-react';

export const ThumbnailTab: React.FC = () => {
  const {
    thumbnailConfig,
    updateThumbnailConfig,
    applyThumbnailPreset,
    config,
    reciters,
  } = useStudioStore();

  const [activeSection, setActiveSection] = useState<
    'presets' | 'layout' | 'background' | 'scripture' | 'hook' | 'badges' | 'guides'
  >('presets');

  // File picker for custom background image
  const handleSelectCustomImage = async () => {
    const api = window.electronAPI;
    if (!api) return;
    const selected = await api.selectMediaFile('image');
    if (selected) {
      updateThumbnailConfig({
        bgType: 'custom',
        bgCustomUrl: selected,
      });
    }
  };

  // Capture current video player frame
  const handleCaptureVideoFrame = () => {
    const playerEl = document.querySelector('video') || document.querySelector('.remotion-player-video');
    if (playerEl instanceof HTMLVideoElement) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = playerEl.videoWidth || 1280;
        canvas.height = playerEl.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(playerEl, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png');
          updateThumbnailConfig({
            bgType: 'captured-frame',
            bgCapturedDataUrl: dataUrl,
          });
        }
      } catch (err) {
        console.error('Failed to capture frame from video element:', err);
      }
    } else {
      const currentBg = config.backgroundClips[0]?.source || config.backgroundPath;
      if (currentBg) {
        updateThumbnailConfig({
          bgType: 'custom',
          bgCustomUrl: currentBg,
        });
      }
    }
  };

  const currentLayout = thumbnailConfig.layoutMode || 'split-screen';

  return (
    <div className="space-y-4 pb-8 select-none">
      {/* Header Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-black font-extrabold shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                YouTube Thumbnail Studio
              </h3>
              <p className="text-[10px] text-gray-400">
                2026 High-Converting Islamic Design Engine
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {thumbnailConfig.aspectRatio}
          </span>
        </div>

        {/* Quick Capture Button */}
        <button
          type="button"
          onClick={handleCaptureVideoFrame}
          className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gray-900/90 hover:bg-gray-850 border border-gray-750 text-amber-300 font-semibold text-xs shadow-sm transition active:scale-98"
          title="Grab the current visual frame from the video player as your thumbnail background"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Capture Video Frame as Background</span>
        </button>
      </div>

      {/* Sub-Section Navigation Pills */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-gray-950 border border-gray-800 text-[11px] font-medium">
        {[
          { id: 'presets', label: 'Presets', icon: Star },
          { id: 'layout', label: 'Layouts', icon: Columns },
          { id: 'background', label: 'Backdrop', icon: ImageIcon },
          { id: 'scripture', label: 'Scripture', icon: Type },
          { id: 'hook', label: 'Hook Title', icon: Sliders },
          { id: 'badges', label: 'Ornaments', icon: Layers },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id as any)}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition ${
                isActive
                  ? 'bg-amber-500 text-black font-bold shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 1. PRESETS GALLERY                                        */}
      {/* ========================================================= */}
      {activeSection === 'presets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-200">
              Modern 2026 Thumbnail Presets
            </label>
            <span className="text-[10px] text-amber-400 font-medium">1-Click Pro Design</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {THUMBNAIL_PRESET_OPTIONS.slice(0, 8).map((preset) => {
              const isSelected = thumbnailConfig.preset === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => applyThumbnailPreset(preset.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/70 ring-1 ring-amber-500/40 shadow-lg'
                      : 'bg-gray-950/70 border-gray-800 hover:border-gray-700 hover:bg-gray-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shadow-sm"
                          style={{ backgroundColor: preset.accentColor }}
                        />
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-amber-400/90 font-medium">
                        {preset.subtitle}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-gray-900 border border-gray-750 text-gray-300">
                        {preset.layoutMode === 'split-screen'
                          ? 'SPLIT #1 CTR'
                          : preset.layoutMode === 'centerpiece'
                          ? 'ROYAL'
                          : preset.layoutMode === 'cinematic-hero'
                          ? 'CINEMATIC'
                          : 'VIRAL'}
                      </span>
                      {isSelected && (
                        <span className="p-0.5 rounded-full bg-amber-500/30 text-amber-300">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed mb-2">
                    {preset.description}
                  </p>
                  <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-gray-800/60">
                    <span className="text-gray-300 font-semibold font-mono">
                      {preset.badgeText}
                    </span>
                    <span className="text-amber-400/90 font-mono truncate max-w-[180px]">
                      {preset.hookTitle}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Aspect Ratio Selector */}
          <div className="p-3 rounded-xl bg-gray-950/80 border border-gray-800 space-y-2">
            <label className="text-xs font-semibold text-gray-300 block">
              Canvas Dimension & Aspect Ratio
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '16:9', label: '16:9 Landscape', desc: 'YouTube (1280×720)' },
                { id: '9:16', label: '9:16 Vertical', desc: 'Shorts (1080×1920)' },
                { id: '1:1', label: '1:1 Square', desc: 'Community (1080×1080)' },
              ].map((ratio) => {
                const isSelected = thumbnailConfig.aspectRatio === ratio.id;
                return (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() =>
                      updateThumbnailConfig({
                        aspectRatio: ratio.id as any,
                      })
                    }
                    className={`p-2 rounded-lg border text-left transition ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                        : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{ratio.id}</div>
                    <div className="text-[9px] text-gray-400 leading-tight">{ratio.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. LAYOUT ARCHETYPES                                      */}
      {/* ========================================================= */}
      {activeSection === 'layout' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-200">
              Modern Thumbnail Layout Archetype
            </label>
            <span className="text-[10px] text-gray-400">Structure</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {[
              {
                id: 'split-screen' as ThumbnailLayoutMode,
                name: 'Split-Screen Masterclass',
                badge: '#1 TOP CTR ON YOUTUBE',
                desc: 'Left side features a grand glowing calligraphy medallion; right side features stacked high-impact typography with frosted glass badges.',
                icon: Columns,
              },
              {
                id: 'centerpiece' as ThumbnailLayoutMode,
                name: 'Centerpiece Majesty',
                badge: 'ROYAL SACRED',
                desc: 'Symmetrical, iconic centered layout with radiant sunbeams, monumental Surah lettering, and sleek glassmorphic intention banner.',
                icon: Maximize,
              },
              {
                id: 'cinematic-hero' as ThumbnailLayoutMode,
                name: 'Cinematic Widescreen',
                badge: 'EDITORIAL & LUXURY',
                desc: 'Deep atmospheric vignette with wide letter-spacing, delicate 1px gold hairline divider, and modern minimalist typography.',
                icon: Compass,
              },
              {
                id: 'high-impact-focus' as ThumbnailLayoutMode,
                name: 'Mobile Viral Contrast',
                badge: 'SMALL SCREEN FOCUS',
                desc: 'Extra-large title fonts and high-contrast punchy hook banners specifically tuned to grab attention on 5-inch smartphone screens.',
                icon: Zap,
              },
            ].map((layout) => {
              const isSelected = currentLayout === layout.id;
              const Icon = layout.icon;
              return (
                <div
                  key={layout.id}
                  onClick={() => updateThumbnailConfig({ layoutMode: layout.id })}
                  className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/70 ring-1 ring-amber-500/40 shadow-sm'
                      : 'bg-gray-950/70 border-gray-800 hover:border-gray-700 hover:bg-gray-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-amber-500 text-black' : 'bg-gray-900 text-amber-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white">{layout.name}</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-gray-900 border border-gray-750 text-amber-300">
                      {layout.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    {layout.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. BACKGROUND & ATMOSPHERE                                */}
      {/* ========================================================= */}
      {activeSection === 'background' && (
        <div className="space-y-4">
          {/* Background Source Type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 block">
              Background Source
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCaptureVideoFrame}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 text-xs text-white transition active:scale-98"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Video Frame</span>
              </button>
              <button
                type="button"
                onClick={handleSelectCustomImage}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-700 text-xs text-white transition active:scale-98"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Upload Custom</span>
              </button>
            </div>
          </div>

          {/* Built-in Presets Carousel */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 block">
              Curated High-Res Islamic Backdrops
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BACKGROUND_PRESETS.map((bg) => {
                const isSelected =
                  thumbnailConfig.bgType === 'preset' && thumbnailConfig.bgPresetUrl === bg.url;
                return (
                  <div
                    key={bg.id}
                    onClick={() =>
                      updateThumbnailConfig({
                        bgType: 'preset',
                        bgPresetUrl: bg.url,
                      })
                    }
                    className={`relative rounded-xl overflow-hidden border cursor-pointer h-20 group transition ${
                      isSelected ? 'border-amber-500 ring-2 ring-amber-500/40' : 'border-gray-800'
                    }`}
                  >
                    <img
                      src={bg.url}
                      alt={bg.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition" />
                    <span className="absolute bottom-1.5 left-2 right-2 text-[10px] font-semibold text-white drop-shadow truncate">
                      {bg.name}
                    </span>
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 p-0.5 rounded-full bg-amber-500 text-black">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Background Darkness & Blur Adjustments */}
          <div className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-800 space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-300">
                <span>Dimming / Darkness Overlay</span>
                <span className="font-mono text-amber-400 font-semibold">
                  {Math.round((thumbnailConfig.bgOverlayOpacity || 0.5) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={0.9}
                step={0.05}
                value={thumbnailConfig.bgOverlayOpacity ?? 0.5}
                onChange={(e) => updateThumbnailConfig({ bgOverlayOpacity: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-300">
                <span>Background Bokeh Blur</span>
                <span className="font-mono text-amber-400 font-semibold">
                  {thumbnailConfig.bgBlur || 0}px
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={16}
                step={1}
                value={thumbnailConfig.bgBlur ?? 0}
                onChange={(e) => updateThumbnailConfig({ bgBlur: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-gray-850 flex items-center justify-between">
              <span className="text-xs text-gray-300">Edge Vignette Darkness</span>
              <input
                type="checkbox"
                checked={thumbnailConfig.bgVignette !== false}
                onChange={(e) => updateThumbnailConfig({ bgVignette: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. SCRIPTURE & CALLIGRAPHY                                */}
      {/* ========================================================= */}
      {activeSection === 'scripture' && (
        <div className="space-y-4">
          {/* Calligraphy Emblem */}
          <div className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="surah-calligraphy-title text-2xl text-amber-400">
                  {`surah${String(config.surahNumber).padStart(3, '0')}`}
                </span>
                <div>
                  <span className="text-xs font-semibold text-white block">Calligraphy Emblem</span>
                  <span className="text-[10px] text-gray-400">Sacred vector calligraphy glyph</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={thumbnailConfig.showSurahCalligraphy !== false}
                onChange={(e) => updateThumbnailConfig({ showSurahCalligraphy: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {thumbnailConfig.showSurahCalligraphy !== false && (
              <div className="space-y-2.5 pt-2 border-t border-gray-850">
                <div className="flex justify-between text-xs text-gray-300">
                  <span>Calligraphy Size Scale</span>
                  <span className="font-mono text-amber-400 font-semibold">
                    {(thumbnailConfig.surahCalligraphyScale || 1.15).toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.7}
                  max={1.6}
                  step={0.05}
                  value={thumbnailConfig.surahCalligraphyScale ?? 1.15}
                  onChange={(e) => updateThumbnailConfig({ surahCalligraphyScale: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-gray-300">Glowing Frosted Medallion Frame</span>
                  <input
                    type="checkbox"
                    checked={thumbnailConfig.calligraphyMedallion !== false}
                    onChange={(e) => updateThumbnailConfig({ calligraphyMedallion: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-gray-300">24K Liquid Gold Metallic Gradient</span>
                  <input
                    type="checkbox"
                    checked={thumbnailConfig.goldGradientText !== false}
                    onChange={(e) => updateThumbnailConfig({ goldGradientText: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Vocalized Arabic Surah Title */}
          <div className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">Vocalized Arabic Name</span>
                <span className="text-[10px] text-gray-400 font-amiri">سُورَةُ ...</span>
              </div>
              <input
                type="checkbox"
                checked={thumbnailConfig.showArabicSurahName !== false}
                onChange={(e) => updateThumbnailConfig({ showArabicSurahName: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {thumbnailConfig.showArabicSurahName !== false && (
              <div className="space-y-2 pt-1 border-t border-gray-850">
                <div className="flex justify-between text-xs text-gray-300">
                  <span>Arabic Font Size</span>
                  <span className="font-mono text-amber-400 font-semibold">
                    {thumbnailConfig.arabicSurahNameSize || 34}px
                  </span>
                </div>
                <input
                  type="range"
                  min={24}
                  max={52}
                  step={2}
                  value={thumbnailConfig.arabicSurahNameSize ?? 34}
                  onChange={(e) => updateThumbnailConfig({ arabicSurahNameSize: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* English Surah Title */}
          <div className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">English Surah Title</span>
              <input
                type="checkbox"
                checked={thumbnailConfig.showEnglishSurahName !== false}
                onChange={(e) => updateThumbnailConfig({ showEnglishSurahName: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {thumbnailConfig.showEnglishSurahName !== false && (
              <div className="space-y-2 pt-1 border-t border-gray-850">
                <input
                  type="text"
                  value={thumbnailConfig.englishSurahNameText ?? ''}
                  onChange={(e) => updateThumbnailConfig({ englishSurahNameText: e.target.value })}
                  placeholder={`e.g. SURAH AL-MULK`}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Show English Meaning</span>
                  <input
                    type="checkbox"
                    checked={thumbnailConfig.showEnglishMeaning !== false}
                    onChange={(e) => updateThumbnailConfig({ showEnglishMeaning: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Ayah Range Badge */}
          <div className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Verse / Ayah Range Badge</span>
              <input
                type="checkbox"
                checked={thumbnailConfig.showAyahRangeBadge !== false}
                onChange={(e) => updateThumbnailConfig({ showAyahRangeBadge: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>
            {thumbnailConfig.showAyahRangeBadge !== false && (
              <input
                type="text"
                value={thumbnailConfig.ayahRangeBadgeText ?? ''}
                onChange={(e) => updateThumbnailConfig({ ayahRangeBadgeText: e.target.value })}
                placeholder={`e.g. SURAH 67 • FULL SURAH (30 VERSES)`}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. HIGH-IMPACT HOOK TITLE                                */}
      {/* ========================================================= */}
      {activeSection === 'hook' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">High-CTR Hook Banner</span>
            <input
              type="checkbox"
              checked={thumbnailConfig.showHookTitle !== false}
              onChange={(e) => updateThumbnailConfig({ showHookTitle: e.target.checked })}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          {thumbnailConfig.showHookTitle !== false && (
            <div className="space-y-3">
              {/* Hook Text Input */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-300 font-medium">Primary Hook Title</label>
                <input
                  type="text"
                  value={thumbnailConfig.hookTitleText ?? 'HEART SOOTHING RECITATION'}
                  onChange={(e) => updateThumbnailConfig({ hookTitleText: e.target.value })}
                  placeholder="e.g. HEART SOOTHING RECITATION"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs font-bold text-amber-300 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-400 font-medium block">
                  Quick High-Converting Suggestions:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {THUMBNAIL_HOOK_SUGGESTIONS.map((hook) => (
                    <button
                      key={hook}
                      type="button"
                      onClick={() => updateThumbnailConfig({ hookTitleText: hook })}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-gray-950 border border-gray-800 text-gray-300 hover:text-amber-300 hover:border-amber-500/40 transition"
                    >
                      {hook}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hook Subtitle */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-300 font-medium">Secondary Subtitle / Hook</label>
                <input
                  type="text"
                  value={thumbnailConfig.hookTitleSubtitle ?? 'Listen With Presence of Heart'}
                  onChange={(e) => updateThumbnailConfig({ hookTitleSubtitle: e.target.value })}
                  placeholder="e.g. Listen With Presence of Heart"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-1.5 text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Banner Style & Colors */}
              <div className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-800 space-y-3">
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <span className="text-[11px] text-gray-400">Accent Text Color</span>
                    <input
                      type="color"
                      value={thumbnailConfig.hookTitleColor || '#FDE68A'}
                      onChange={(e) => updateThumbnailConfig({ hookTitleColor: e.target.value })}
                      className="w-full h-8 rounded border border-gray-700 bg-transparent cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-gray-400">Glow Aura</span>
                    <div className="flex items-center gap-1.5 pt-1.5">
                      <input
                        type="checkbox"
                        checked={thumbnailConfig.hookTitleGlow !== false}
                        onChange={(e) => updateThumbnailConfig({ hookTitleGlow: e.target.checked })}
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                      />
                      <span className="text-[11px] text-gray-300">Enable Glow</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. BADGES & ISLAMIC ART OVERLAYS                          */}
      {/* ========================================================= */}
      {activeSection === 'badges' && (
        <div className="space-y-4">
          {/* Eye-Catching Status Badge */}
          <div className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-800 space-y-2.5">
            <label className="text-xs font-semibold text-white block">
              Frosted Glass Status Chip
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {THUMBNAIL_BADGE_PRESETS.map((badge) => {
                const isSelected = thumbnailConfig.activeBadge === badge.id;
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() =>
                      updateThumbnailConfig({
                        activeBadge: badge.id,
                        badgeCustomText: badge.id === 'none' ? '' : badge.label,
                      })
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left border transition truncate flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: badge.dot }}
                    />
                    <span className="truncate">{badge.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Islamic Frame & Art Toggles */}
          <div className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-800 space-y-2.5">
            <label className="text-xs font-semibold text-white block">
              Islamic Decorative Ornaments
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={thumbnailConfig.showArabesqueCorners !== false}
                  onChange={(e) => updateThumbnailConfig({ showArabesqueCorners: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <span>Arabesque Corners</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={thumbnailConfig.showIslamicArchFrame || false}
                  onChange={(e) => updateThumbnailConfig({ showIslamicArchFrame: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <span>Moorish Arch Frame</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={thumbnailConfig.showSunRays !== false}
                  onChange={(e) => updateThumbnailConfig({ showSunRays: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <span>Divine Sunbeams</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={thumbnailConfig.showGoldenSparks !== false}
                  onChange={(e) => updateThumbnailConfig({ showGoldenSparks: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <span>Golden Sparks</span>
              </label>
            </div>
          </div>

          {/* Reciter & Translation Attributions */}
          <div className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-800 space-y-2">
            <label className="text-xs font-semibold text-white block">
              Reciter & Translation Badges
            </label>
            <div className="space-y-2 text-xs text-gray-300">
              <label className="flex items-center justify-between cursor-pointer">
                <span>Display Reciter Badge</span>
                <input
                  type="checkbox"
                  checked={thumbnailConfig.showReciterBadge !== false}
                  onChange={(e) => updateThumbnailConfig({ showReciterBadge: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span>Display Translation Badge</span>
                <input
                  type="checkbox"
                  checked={thumbnailConfig.showTranslationBadge !== false}
                  onChange={(e) => updateThumbnailConfig({ showTranslationBadge: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
