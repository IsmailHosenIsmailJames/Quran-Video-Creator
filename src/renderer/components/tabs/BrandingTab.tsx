import React, { useState, useEffect } from 'react';
import { useStudioStore } from '../../store/studio-store';
import { getMediaUrl } from '../../../shared/media-url';
import {
  Shield,
  Upload,
  Sparkles,
  Film,
  Wand2,
  Clock,
  Check,
  Star,
  BookOpen,
  HeartHandshake,
  Layers,
} from 'lucide-react';
import {
  TransitionType,
  IntroPresetId,
  IntroMode,
  TitleCardPresetId,
  OutroPresetId,
  OutroMode,
} from '../../../shared/types';
import {
  INTRO_PRESET_OPTIONS,
  TITLE_CARD_PRESET_OPTIONS,
  OUTRO_PRESET_OPTIONS,
} from '../../../shared/constants';

export const BrandingTab: React.FC = () => {
  const { config, updateConfig } = useStudioStore();
  const [imageError, setImageError] = useState(false);
  const [introLogoError, setIntroLogoError] = useState(false);
  const [outroLogoError, setOutroLogoError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [config.logoPath]);

  useEffect(() => {
    setIntroLogoError(false);
  }, [config.introCustomLogo]);

  useEffect(() => {
    setOutroLogoError(false);
  }, [config.outroCustomLogo]);

  const handleSelectLogo = async () => {
    const api = window.electronAPI;
    if (!api) return;
    const filePath = await api.selectMediaFile('image');
    if (!filePath) return;
    setImageError(false);
    updateConfig({
      logoPath: filePath,
    });
  };

  const handleSelectIntroLogo = async () => {
    const api = window.electronAPI;
    if (!api) return;
    const filePath = await api.selectMediaFile('image');
    if (!filePath) return;
    setIntroLogoError(false);
    updateConfig({
      introCustomLogo: filePath,
    });
  };

  const handleSelectOutroLogo = async () => {
    const api = window.electronAPI;
    if (!api) return;
    const filePath = await api.selectMediaFile('image');
    if (!filePath) return;
    setOutroLogoError(false);
    updateConfig({
      outroCustomLogo: filePath,
    });
  };

  const handleSelectIntroVideo = async () => {
    const api = window.electronAPI;
    if (!api) return;
    const filePath = await api.selectMediaFile('video');
    if (!filePath) return;

    let durationSec: number | undefined = undefined;
    if (api.probeMediaDuration) {
      try {
        durationSec = await api.probeMediaDuration(filePath);
      } catch (e) {
        console.warn('Failed to probe intro video duration:', e);
      }
    }

    updateConfig({
      enableIntroVideo: true,
      introMode: 'custom-video',
      introVideoPath: filePath,
      introVideoDurationSeconds: durationSec ? Number(durationSec.toFixed(2)) : 4.0,
    });
  };

  const handleSelectOutroVideo = async () => {
    const api = window.electronAPI;
    if (!api) return;
    const filePath = await api.selectMediaFile('video');
    if (!filePath) return;

    let durationSec: number | undefined = undefined;
    if (api.probeMediaDuration) {
      try {
        durationSec = await api.probeMediaDuration(filePath);
      } catch (e) {
        console.warn('Failed to probe outro video duration:', e);
      }
    }

    updateConfig({
      enableOutroVideo: true,
      outroMode: 'custom-video',
      outroVideoPath: filePath,
      outroVideoDurationSeconds: durationSec ? Number(durationSec.toFixed(2)) : 4.5,
    });
  };

  const activeIntroMode: IntroMode = config.introMode || 'preset';
  const activeOutroMode: OutroMode = config.outroMode || 'preset';

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* ─── 1. Video Starting / Intro Clip ─── */}
      <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-gray-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <Film className="w-4 h-4 text-amber-400" />
            1. Video Starting / Intro Clip
          </div>
          <input
            type="checkbox"
            checked={Boolean(config.enableIntroVideo)}
            onChange={(e) => updateConfig({ enableIntroVideo: e.target.checked })}
            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
        </div>

        <p className="text-[11px] text-gray-400 leading-relaxed">
          Prepend a cinematic channel opening title or bumper card before the video begins.
        </p>

        {config.enableIntroVideo && (
          <div className="space-y-4 pt-1">
            {/* Mode Selector Tabs (Preset vs Upload) */}
            <div className="grid grid-cols-2 p-1 bg-gray-950 border border-gray-800 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => updateConfig({ introMode: 'preset' })}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition ${
                  activeIntroMode === 'preset'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Motion Presets (Built-in)</span>
              </button>
              <button
                type="button"
                onClick={() => updateConfig({ introMode: 'custom-video' })}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition ${
                  activeIntroMode === 'custom-video'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-amber-400" />
                <span>Upload Custom MP4</span>
              </button>
            </div>

            {/* ─── PROGRAMMATIC PRESET MODE ─── */}
            {activeIntroMode === 'preset' && (
              <div className="space-y-4">
                {/* 1. Preset Selection Grid */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-300 font-semibold block">
                    Choose Intro Preset Style
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {INTRO_PRESET_OPTIONS.map((item) => {
                      const isSelected = (config.introPreset || 'golden-elegance') === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() =>
                            updateConfig({
                              introPreset: item.id,
                              introThemeColor: item.accentColor,
                            })
                          }
                          className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500/70 ring-1 ring-amber-500/30'
                              : 'bg-gray-950/70 border-gray-800 hover:border-gray-700 hover:bg-gray-900/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Star
                                className="w-3.5 h-3.5"
                                style={{ color: item.accentColor }}
                              />
                              {item.name}
                            </span>
                            {isSelected && (
                              <span className="p-0.5 rounded-full bg-amber-500/30 text-amber-300">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 leading-relaxed mb-2">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-1.5 pt-1 border-t border-gray-800/60">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: item.accentColor }}
                            />
                            <span className="text-[10px] font-mono text-gray-500 uppercase">
                              Theme Accent
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Channel Title Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-300 font-medium">Channel Title / Main Name</label>
                    <span className="text-[10px] text-gray-500">Centerpiece heading</span>
                  </div>
                  <input
                    type="text"
                    value={config.introTitle ?? ''}
                    onChange={(e) => updateConfig({ introTitle: e.target.value })}
                    placeholder={config.channelHandle ? config.channelHandle.replace(/^@/, '') : 'e.g. An-Nafee Official'}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* 3. Subtitle / Tagline Input with Quick Presets */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-300 font-medium">Subtitle / Tagline</label>
                    <span className="text-[10px] text-gray-500">Secondary caption</span>
                  </div>
                  <input
                    type="text"
                    value={config.introSubtitle ?? 'Holy Quran Recitation'}
                    onChange={(e) => updateConfig({ introSubtitle: e.target.value })}
                    placeholder="e.g. Holy Quran Recitation"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                  {/* Quick Suggestions */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      'Holy Quran Recitation',
                      'Sacred Recitation & Reflections',
                      'Heart-Soothing Recitation',
                      'Peace of the Soul',
                    ].map((text) => (
                      <button
                        key={text}
                        type="button"
                        onClick={() => updateConfig({ introSubtitle: text })}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-gray-950 border border-gray-800 text-gray-400 hover:text-amber-300 hover:border-amber-500/40 transition"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Intro Logo / Icon Selection */}
                <div className="p-3 rounded-xl bg-gray-950/70 border border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300 font-medium">Intro Center Logo / Icon</span>
                    <button
                      type="button"
                      onClick={handleSelectIntroLogo}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                    >
                      <Upload className="w-3 h-3 text-amber-400" />
                      {config.introCustomLogo ? 'Change Intro Logo' : 'Upload Intro Logo'}
                    </button>
                  </div>

                  {config.introCustomLogo ? (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-900 border border-gray-800">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={getMediaUrl(config.introCustomLogo)}
                          alt="Intro Logo"
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20"
                        />
                        <span className="text-[11px] text-white truncate max-w-[180px]">
                          {config.introCustomLogo.split(/[/\\]/).pop()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateConfig({ introCustomLogo: undefined })}
                        className="text-[10px] text-rose-400 hover:underline"
                      >
                        Reset to Branding Logo
                      </button>
                    </div>
                  ) : config.logoPath ? (
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3 h-3" />
                      Using your uploaded Channel Logo ({config.logoPath.split(/[/\\]/).pop()})
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-400/90 leading-relaxed">
                      ✨ No logo uploaded. The intro will feature the preset's glowing sacred Islamic emblem (Octagram / Calligraphy).
                    </p>
                  )}
                </div>

                {/* 5. Theme Accent Color */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-300 font-medium">Theme Accent Color</label>
                    <span className="font-mono text-xs text-amber-400">{config.introThemeColor || '#F59E0B'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.introThemeColor || '#F59E0B'}
                      onChange={(e) => updateConfig({ introThemeColor: e.target.value })}
                      className="w-8 h-8 rounded-lg border border-gray-700 bg-transparent cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5">
                      {[
                        { color: '#F59E0B', label: 'Gold' },
                        { color: '#10B981', label: 'Emerald' },
                        { color: '#38BDF8', label: 'Celestial' },
                        { color: '#A855F7', label: 'Velvet' },
                        { color: '#E2E8F0', label: 'Pearl' },
                      ].map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => updateConfig({ introThemeColor: c.color })}
                          style={{ backgroundColor: c.color }}
                          className={`w-6 h-6 rounded-full border transition transform hover:scale-110 ${
                            config.introThemeColor === c.color ? 'ring-2 ring-white scale-110' : 'border-gray-800'
                          }`}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* 6. Duration Slider */}
                <div className="space-y-1.5 bg-gray-950/60 p-3 rounded-xl border border-gray-800">
                  <div className="flex justify-between text-xs text-gray-300">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Intro Duration
                    </span>
                    <span className="text-amber-400 font-mono font-semibold">
                      {(config.introVideoDurationSeconds || 4.0).toFixed(1)}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2.0}
                    max={7.0}
                    step={0.5}
                    value={config.introVideoDurationSeconds || 4.0}
                    onChange={(e) => updateConfig({ introVideoDurationSeconds: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>2.0s (Fast)</span>
                    <span>4.0s (Standard)</span>
                    <span>7.0s (Majestic)</span>
                  </div>
                </div>
              </div>
            )}

            {/* ─── CUSTOM VIDEO FILE MODE ─── */}
            {activeIntroMode === 'custom-video' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-300 font-medium">Intro Video File (MP4 / WebM / MOV)</label>
                  <button
                    onClick={handleSelectIntroVideo}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    {config.introVideoPath ? 'Change Video' : 'Choose Video'}
                  </button>
                </div>

                {config.introVideoPath ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950/80 border border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                        <Film className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-white truncate max-w-[220px]">
                          {config.introVideoPath.split(/[/\\]/).pop()}
                        </p>
                        <p className="text-[10px] text-emerald-400">
                          Duration: {config.introVideoDurationSeconds || 4.0}s • Ready
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        updateConfig({
                          introVideoPath: undefined,
                        })
                      }
                      className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-500/10 transition"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={handleSelectIntroVideo}
                    className="p-5 text-center border border-dashed border-gray-800/80 hover:border-amber-500/50 rounded-xl bg-gray-950/40 text-xs text-gray-400 cursor-pointer transition flex flex-col items-center gap-1.5"
                  >
                    <Film className="w-5 h-5 text-amber-400/70" />
                    <span className="font-medium text-gray-300">Click to upload custom intro video</span>
                    <span className="text-[10px] text-gray-500">Supports MP4, WebM, MOV clips</span>
                  </div>
                )}
              </div>
            )}

            {/* Common Transition and Skip Settings */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Transition into Next Section</label>
                <select
                  value={config.introTransition || 'dip-black'}
                  onChange={(e) => updateConfig({ introTransition: e.target.value as TransitionType })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-2.5 py-2 text-white text-xs cursor-pointer focus:outline-none"
                >
                  <option value="dip-black">Dip to Black</option>
                  <option value="crossfade">Crossfade</option>
                  <option value="zoom-fade">Zoom Fade</option>
                  <option value="cut">Hard Cut</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400">Skip for 9:16 Shorts</label>
                <div className="flex items-center justify-between p-2 rounded-xl bg-gray-950 border border-gray-800">
                  <span className="text-[11px] text-gray-300">
                    {config.skipIntroForShorts !== false ? 'Enabled' : 'Disabled'}
                  </span>
                  <input
                    type="checkbox"
                    checked={config.skipIntroForShorts !== false}
                    onChange={(e) => updateConfig({ skipIntroForShorts: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 2. Surah Title & Reciter Info Screen (Plays Just After Intro) ─── */}
      <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-gray-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            2. Surah Title & Reciter Info Screen (Plays After Intro)
          </div>
          <input
            type="checkbox"
            checked={config.enableSurahTitleCard !== false}
            onChange={(e) => updateConfig({ enableSurahTitleCard: e.target.checked })}
            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
        </div>

        <p className="text-[11px] text-gray-400 leading-relaxed">
          Plays right after the starting intro clip finishes, revealing the Surah name in Arabic calligraphy, transliteration, English meaning, verse range, reciter name, recitation style, and translation book name in a fluent motion.
        </p>

        {config.enableSurahTitleCard !== false && (
          <div className="space-y-4 pt-1">
            {/* Title Card Presets */}
            <div className="space-y-2">
              <label className="text-xs text-gray-300 font-semibold block">
                Choose Title Screen Preset Style
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TITLE_CARD_PRESET_OPTIONS.map((item) => {
                  const isSelected = (config.titleCardPreset || 'royal-gold') === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() =>
                        updateConfig({
                          titleCardPreset: item.id,
                          titleCardThemeColor: item.accentColor,
                        })
                      }
                      className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/70 ring-1 ring-amber-500/30'
                          : 'bg-gray-950/70 border-gray-800 hover:border-gray-700 hover:bg-gray-900/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5" style={{ color: item.accentColor }} />
                          {item.name}
                        </span>
                        {isSelected && (
                          <span className="p-0.5 rounded-full bg-amber-500/30 text-amber-300">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed mb-2">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-1.5 pt-1 border-t border-gray-800/60">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.accentColor }}
                        />
                        <span className="text-[10px] font-mono text-gray-500 uppercase">
                          Theme Accent
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Display Options Checkboxes */}
            <div className="space-y-2 bg-gray-950/60 p-3 rounded-xl border border-gray-800">
              <label className="text-xs text-gray-300 font-medium block">
                Information & Badges to Display
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showReciterInTitleCard !== false}
                    onChange={(e) => updateConfig({ showReciterInTitleCard: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span>Reciter Name</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showStyleInTitleCard !== false}
                    onChange={(e) => updateConfig({ showStyleInTitleCard: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span>Recitation Style</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showVerseRangeInTitleCard !== false}
                    onChange={(e) => updateConfig({ showVerseRangeInTitleCard: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span>Verse Range</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showTranslationInTitleCard !== false}
                    onChange={(e) => updateConfig({ showTranslationInTitleCard: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span>Translation Book</span>
                </label>
              </div>
            </div>

            {/* Theme Accent Color */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-300 font-medium">Screen Theme Accent</label>
                <span className="font-mono text-xs text-amber-400">
                  {config.titleCardThemeColor || '#F59E0B'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.titleCardThemeColor || '#F59E0B'}
                  onChange={(e) => updateConfig({ titleCardThemeColor: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-gray-700 bg-transparent cursor-pointer"
                />
                <div className="flex items-center gap-1.5">
                  {[
                    { color: '#F59E0B', label: 'Gold' },
                    { color: '#10B981', label: 'Emerald' },
                    { color: '#38BDF8', label: 'Celestial' },
                    { color: '#818CF8', label: 'Medina' },
                    { color: '#E2E8F0', label: 'Pearl' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => updateConfig({ titleCardThemeColor: c.color })}
                      style={{ backgroundColor: c.color }}
                      className={`w-6 h-6 rounded-full border transition transform hover:scale-110 ${
                        config.titleCardThemeColor === c.color ? 'ring-2 ring-white scale-110' : 'border-gray-800'
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Title Card Duration Slider */}
            <div className="space-y-1.5 bg-gray-950/60 p-3 rounded-xl border border-gray-800">
              <div className="flex justify-between text-xs text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Screen Display Duration
                </span>
                <span className="text-amber-400 font-mono font-semibold">
                  {(config.titleCardDurationSeconds || 3.5).toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min={2.0}
                max={6.0}
                step={0.5}
                value={config.titleCardDurationSeconds || 3.5}
                onChange={(e) => updateConfig({ titleCardDurationSeconds: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>2.0s (Brisk)</span>
                <span>3.5s (Balanced)</span>
                <span>6.0s (Contemplative)</span>
              </div>
            </div>

            {/* Common Transition and Skip Settings */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Transition into Recitation</label>
                <select
                  value={config.titleCardTransition || 'dip-black'}
                  onChange={(e) => updateConfig({ titleCardTransition: e.target.value as TransitionType })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-2.5 py-2 text-white text-xs cursor-pointer focus:outline-none"
                >
                  <option value="dip-black">Dip to Black</option>
                  <option value="crossfade">Crossfade</option>
                  <option value="zoom-fade">Zoom Fade</option>
                  <option value="cut">Hard Cut</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400">Skip for 9:16 Shorts</label>
                <div className="flex items-center justify-between p-2 rounded-xl bg-gray-950 border border-gray-800">
                  <span className="text-[11px] text-gray-300">
                    {config.skipTitleCardForShorts ? 'Enabled' : 'Disabled'}
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(config.skipTitleCardForShorts)}
                    onChange={(e) => updateConfig({ skipTitleCardForShorts: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 3. Channel Attribution & Watermark ─── */}
      <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-gray-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <Shield className="w-4 h-4 text-amber-400" />
            3. Channel Attribution & Watermark
          </div>
          <input
            type="checkbox"
            checked={config.showBranding}
            onChange={(e) => updateConfig({ showBranding: e.target.checked })}
            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
        </div>

        {!config.showBranding && (
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Branding watermark badge is currently turned off. Turn it on above to upload your channel logo and set your YouTube handle.
          </p>
        )}

        {config.showBranding && (
          <div className="space-y-4">
            {/* Setup Guidance Banner */}
            {(!config.logoPath || !config.channelHandle?.trim()) && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <p className="font-semibold text-amber-300">Set Up Your Channel Branding</p>
                  <p className="text-gray-300 text-[11px] leading-relaxed">
                    Please upload your channel logo and enter your YouTube handle below so your watermark badge appears on the video.
                  </p>
                </div>
              </div>
            )}

            {/* Channel Handle */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Channel Handle / YouTube Creator Name</label>
              <input
                type="text"
                value={config.channelHandle}
                onChange={(e) => updateConfig({ channelHandle: e.target.value })}
                placeholder="@YourChannelHandle (e.g. @QuranRecitations)"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Channel Logo Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">Channel Logo / Icon</label>
                <button
                  onClick={handleSelectLogo}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  {config.logoPath ? 'Change Logo' : 'Upload Logo'}
                </button>
              </div>

              {config.logoPath ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950/80 border border-gray-800">
                  <div className="flex items-center gap-3">
                    {!imageError ? (
                      <img
                        src={getMediaUrl(config.logoPath)}
                        alt="Logo"
                        onError={() => setImageError(true)}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-white/20"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Shield className="w-4 h-4" />
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-white truncate max-w-[200px]">
                        {config.logoPath.split(/[/\\]/).pop()}
                      </p>
                      <p className="text-[10px] text-emerald-400">Custom logo active</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateConfig({ logoPath: undefined })}
                    className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-500/10 transition"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div
                  onClick={handleSelectLogo}
                  className="p-5 text-center border border-dashed border-gray-800/80 hover:border-amber-500/50 rounded-xl bg-gray-950/40 text-xs text-gray-400 cursor-pointer transition flex flex-col items-center gap-1.5"
                >
                  <Upload className="w-5 h-5 text-amber-400/80 mx-auto" />
                  <span className="font-medium text-gray-300">Click to upload channel logo (PNG / SVG)</span>
                  <span className="text-[10px] text-gray-500">Transparent square or circular images look best</span>
                </div>
              )}
            </div>

            {/* Position & Scale */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Badge Position</label>
                <select
                  value={config.brandingPosition}
                  onChange={(e) => updateConfig({ brandingPosition: e.target.value as any })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs cursor-pointer"
                >
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Badge Scale</span>
                  <span className="text-amber-400 font-mono">{config.brandingScale}x</span>
                </div>
                <input
                  type="range"
                  min={0.6}
                  max={1.5}
                  step={0.1}
                  value={config.brandingScale}
                  onChange={(e) => updateConfig({ brandingScale: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 4. Video Ending & Outro Clip ─── */}
      <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-gray-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Film className="w-4 h-4 text-emerald-400" />
            4. Video Ending & Outro Clip
          </div>
          <input
            type="checkbox"
            checked={Boolean(config.enableOutroVideo)}
            onChange={(e) => updateConfig({ enableOutroVideo: e.target.checked })}
            className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
          />
        </div>

        <p className="text-[11px] text-gray-400 leading-relaxed">
          Append a cinematic ending video bumper, closing Dua, or subscriber callout card at the end of the video.
        </p>

        {config.enableOutroVideo && (
          <div className="space-y-4 pt-1">
            {/* Mode Selector Tabs (Preset vs Upload) */}
            <div className="grid grid-cols-2 p-1 bg-gray-950 border border-gray-800 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => updateConfig({ outroMode: 'preset' })}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition ${
                  activeOutroMode === 'preset'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Motion Presets (Handy Presets)</span>
              </button>
              <button
                type="button"
                onClick={() => updateConfig({ outroMode: 'custom-video' })}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition ${
                  activeOutroMode === 'custom-video'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-emerald-400" />
                <span>Upload Custom MP4</span>
              </button>
            </div>

            {/* ─── PROGRAMMATIC OUTRO PRESET MODE ─── */}
            {activeOutroMode === 'preset' && (
              <div className="space-y-4">
                {/* 1. Outro Preset Selection Grid */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-300 font-semibold block">
                    Choose Outro Preset Style
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {OUTRO_PRESET_OPTIONS.map((item) => {
                      const isSelected = (config.outroPreset || 'golden-sadaqallah') === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() =>
                            updateConfig({
                              outroPreset: item.id,
                              outroThemeColor: item.accentColor,
                            })
                          }
                          className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-500/70 ring-1 ring-emerald-500/30'
                              : 'bg-gray-950/70 border-gray-800 hover:border-gray-700 hover:bg-gray-900/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5" style={{ color: item.accentColor }} />
                              {item.name}
                            </span>
                            {isSelected && (
                              <span className="p-0.5 rounded-full bg-emerald-500/30 text-emerald-300">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 leading-relaxed mb-2">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-1.5 pt-1 border-t border-gray-800/60">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: item.accentColor }}
                            />
                            <span className="text-[10px] font-mono text-gray-500 uppercase">
                              Theme Accent
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Outro Title Input with Quick Presets */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-300 font-medium">Outro Title / Farewell</label>
                    <span className="text-[10px] text-gray-500">Center closing heading</span>
                  </div>
                  <input
                    type="text"
                    value={config.outroTitle ?? 'صَدَقَ اللهُ العَظِيمُ'}
                    onChange={(e) => updateConfig({ outroTitle: e.target.value })}
                    placeholder="e.g. صَدَقَ اللهُ العَظِيمُ"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                  {/* Quick Suggestions */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      'صَدَقَ اللهُ العَظِيمُ',
                      'رَبَّنَا تَقَبَّلْ مِنَّا',
                      'جَزَاكُمُ اللهُ خَيْرًا',
                      'سُبْحَانَ اللهِ وَبِحَمْدِهِ',
                    ].map((text) => (
                      <button
                        key={text}
                        type="button"
                        onClick={() => updateConfig({ outroTitle: text })}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-gray-950 border border-gray-800 text-gray-400 hover:text-emerald-300 hover:border-emerald-500/40 transition"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Outro Subtitle / Callout Tagline Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-300 font-medium">Subtitle / Call to Action</label>
                    <span className="text-[10px] text-gray-500">Call-to-action message</span>
                  </div>
                  <input
                    type="text"
                    value={config.outroSubtitle ?? 'Like, Share & Subscribe for more Quran recitations'}
                    onChange={(e) => updateConfig({ outroSubtitle: e.target.value })}
                    placeholder="e.g. Like, Share & Subscribe for daily recitations"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                  {/* Quick Suggestions */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      'Like, Share & Subscribe for more Quran recitations',
                      'May Allah accept this recitation from us and you',
                      'Peace and blessings upon the Prophet (ﷺ)',
                      'Reflect upon the words of the Creator',
                    ].map((text) => (
                      <button
                        key={text}
                        type="button"
                        onClick={() => updateConfig({ outroSubtitle: text })}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-gray-950 border border-gray-800 text-gray-400 hover:text-emerald-300 hover:border-emerald-500/40 transition"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Outro Center Logo / Icon */}
                <div className="p-3 rounded-xl bg-gray-950/70 border border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300 font-medium">Outro Center Logo / Avatar</span>
                    <button
                      type="button"
                      onClick={handleSelectOutroLogo}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                    >
                      <Upload className="w-3 h-3 text-emerald-400" />
                      {config.outroCustomLogo ? 'Change Outro Logo' : 'Upload Outro Logo'}
                    </button>
                  </div>

                  {config.outroCustomLogo ? (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-900 border border-gray-800">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={getMediaUrl(config.outroCustomLogo)}
                          alt="Outro Logo"
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20"
                        />
                        <span className="text-[11px] text-white truncate max-w-[180px]">
                          {config.outroCustomLogo.split(/[/\\]/).pop()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateConfig({ outroCustomLogo: undefined })}
                        className="text-[10px] text-rose-400 hover:underline"
                      >
                        Reset to Branding Logo
                      </button>
                    </div>
                  ) : config.logoPath ? (
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3 h-3" />
                      Using your uploaded Channel Logo ({config.logoPath.split(/[/\\]/).pop()})
                    </p>
                  ) : (
                    <p className="text-[11px] text-emerald-400/90 leading-relaxed">
                      ✨ No logo uploaded. The outro will feature the preset's glowing emblem (Sacred Star / Crescent / Avatar).
                    </p>
                  )}
                </div>

                {/* 5. Theme Accent Color */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-300 font-medium">Theme Accent Color</label>
                    <span className="font-mono text-xs text-emerald-400">
                      {config.outroThemeColor || '#F59E0B'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.outroThemeColor || '#F59E0B'}
                      onChange={(e) => updateConfig({ outroThemeColor: e.target.value })}
                      className="w-8 h-8 rounded-lg border border-gray-700 bg-transparent cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5">
                      {[
                        { color: '#F59E0B', label: 'Gold' },
                        { color: '#10B981', label: 'Emerald' },
                        { color: '#38BDF8', label: 'Celestial' },
                        { color: '#F43F5E', label: 'Rose' },
                        { color: '#E2E8F0', label: 'Pearl' },
                      ].map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => updateConfig({ outroThemeColor: c.color })}
                          style={{ backgroundColor: c.color }}
                          className={`w-6 h-6 rounded-full border transition transform hover:scale-110 ${
                            config.outroThemeColor === c.color ? 'ring-2 ring-white scale-110' : 'border-gray-800'
                          }`}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* 6. Duration Slider */}
                <div className="space-y-1.5 bg-gray-950/60 p-3 rounded-xl border border-gray-800">
                  <div className="flex justify-between text-xs text-gray-300">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      Outro Duration
                    </span>
                    <span className="text-emerald-400 font-mono font-semibold">
                      {(config.outroVideoDurationSeconds || 4.5).toFixed(1)}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2.0}
                    max={10.0}
                    step={0.5}
                    value={config.outroVideoDurationSeconds || 4.5}
                    onChange={(e) => updateConfig({ outroVideoDurationSeconds: Number(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>2.0s (Fast)</span>
                    <span>4.5s (Standard)</span>
                    <span>10.0s (Extended)</span>
                  </div>
                </div>
              </div>
            )}

            {/* ─── CUSTOM VIDEO FILE MODE ─── */}
            {activeOutroMode === 'custom-video' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-300 font-medium">Outro Video File (MP4 / WebM / MOV)</label>
                  <button
                    onClick={handleSelectOutroVideo}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    {config.outroVideoPath ? 'Change Video' : 'Choose Video'}
                  </button>
                </div>

                {config.outroVideoPath ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950/80 border border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <Film className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-white truncate max-w-[220px]">
                          {config.outroVideoPath.split(/[/\\]/).pop()}
                        </p>
                        <p className="text-[10px] text-emerald-400">
                          Duration: {config.outroVideoDurationSeconds || 4.5}s • Ready
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        updateConfig({
                          outroVideoPath: undefined,
                        })
                      }
                      className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-500/10 transition"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={handleSelectOutroVideo}
                    className="p-5 text-center border border-dashed border-gray-800/80 hover:border-emerald-500/50 rounded-xl bg-gray-950/40 text-xs text-gray-400 cursor-pointer transition flex flex-col items-center gap-1.5"
                  >
                    <Film className="w-5 h-5 text-emerald-400/70" />
                    <span className="font-medium text-gray-300">Click to upload custom outro video</span>
                    <span className="text-[10px] text-gray-500">Supports MP4, WebM, MOV clips</span>
                  </div>
                )}
              </div>
            )}

            {/* Common Transition and Skip Settings */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Transition into Outro</label>
                <select
                  value={config.outroTransition || 'dip-black'}
                  onChange={(e) => updateConfig({ outroTransition: e.target.value as TransitionType })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-2.5 py-2 text-white text-xs cursor-pointer focus:outline-none"
                >
                  <option value="dip-black">Dip to Black</option>
                  <option value="crossfade">Crossfade</option>
                  <option value="zoom-fade">Zoom Fade</option>
                  <option value="cut">Hard Cut</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400">Skip for 9:16 Shorts</label>
                <div className="flex items-center justify-between p-2 rounded-xl bg-gray-950 border border-gray-800">
                  <span className="text-[11px] text-gray-300">
                    {config.skipOutroForShorts !== false ? 'Enabled' : 'Disabled'}
                  </span>
                  <input
                    type="checkbox"
                    checked={config.skipOutroForShorts !== false}
                    onChange={(e) => updateConfig({ skipOutroForShorts: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
