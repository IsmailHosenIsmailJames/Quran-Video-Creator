import React from 'react';
import { useStudioStore } from '../../store/studio-store';
import {
  Music,
  Upload,
  Activity,
  Sparkles,
  Sliders,
  Palette,
  Layers,
  CircleDot,
  Zap,
} from 'lucide-react';
import { WaveformType } from '../../../shared/types';

interface WaveformStyleOption {
  id: WaveformType;
  label: string;
  tag: string;
  description: string;
}

const WAVEFORM_STYLES: WaveformStyleOption[] = [
  {
    id: 'smooth-wave',
    label: 'Fluid Ribbon',
    tag: 'Flowing',
    description: 'Silky smooth continuous bezier acoustic wave',
  },
  {
    id: 'mirrored-bars',
    label: 'Mirrored Bars',
    tag: 'Classic',
    description: 'Symmetrical rounded bars expanding top and bottom',
  },
  {
    id: 'gradient-bars',
    label: 'Grounded Spectrum',
    tag: 'Punchy',
    description: 'Frequency bars rising up from an acoustic baseline',
  },
  {
    id: 'circular-halo',
    label: 'Circular Halo',
    tag: '360° Aura',
    description: 'Radial audio-reactive sunburst framing central medallion',
  },
  {
    id: 'dual-symmetrical-wave',
    label: 'Dual Waves',
    tag: 'Harmonic',
    description: 'Mirrored twin fluid waves with glowing center valley',
  },
  {
    id: 'dotted-matrix',
    label: 'Dotted Matrix',
    tag: 'Digital',
    description: 'Vertical matrix bead columns with LED neon glow',
  },
  {
    id: 'minimal-line-pulse',
    label: 'Minimal Line',
    tag: 'Luxury',
    description: 'Ultra-clean baseline accent line pulsing into acoustic ripples',
  },
];

const COLOR_PRESETS = [
  {
    name: '24K Gold',
    primary: '#F59E0B',
    secondary: '#FDE047',
    badgeClass: 'from-amber-500 to-yellow-300',
  },
  {
    name: 'Sacred Emerald',
    primary: '#10B981',
    secondary: '#6EE7B7',
    badgeClass: 'from-emerald-500 to-teal-300',
  },
  {
    name: 'Midnight Sapphire',
    primary: '#3B82F6',
    secondary: '#93C5FD',
    badgeClass: 'from-blue-500 to-sky-300',
  },
  {
    name: 'Neon Amethyst',
    primary: '#A855F7',
    secondary: '#EC4899',
    badgeClass: 'from-purple-500 to-pink-400',
  },
  {
    name: 'Sunset Bronze',
    primary: '#F97316',
    secondary: '#FBBF24',
    badgeClass: 'from-orange-500 to-amber-300',
  },
  {
    name: 'Minimal Platinum',
    primary: '#E2E8F0',
    secondary: '#94A3B8',
    badgeClass: 'from-slate-200 to-slate-400',
  },
  {
    name: 'Cyber Cyan',
    primary: '#06B6D4',
    secondary: '#3B82F6',
    badgeClass: 'from-cyan-400 to-blue-500',
  },
];

export const AudioTab: React.FC = () => {
  const { config, updateConfig, reciters, changeReciter } = useStudioStore();

  const handleSelectCustomAudio = async () => {
    const api = window.electronAPI;
    if (!api) return;
    const filePath = await api.selectMediaFile('audio');
    if (!filePath) return;
    updateConfig({
      customAudioPath: filePath,
    });
  };

  const isBarOrMatrix =
    config.waveformType === 'mirrored-bars' ||
    config.waveformType === 'gradient-bars' ||
    config.waveformType === 'dotted-matrix';

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* 1. Reciter & Recitation Audio */}
      <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-gray-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <Music className="w-4 h-4 text-amber-400" />
            Recitation Audio Pipeline
          </div>
          <button
            onClick={handleSelectCustomAudio}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
            title="Upload custom MP3 or WAV audio track"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            Custom Audio
          </button>
        </div>

        <div className="relative">
          <select
            value={config.reciterIndex}
            onChange={(e) => changeReciter(Number(e.target.value))}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-xs"
          >
            {reciters.map((reciter, idx) => {
              const hasSegments = Boolean(reciter.segments_url);
              return (
                <option key={idx} value={idx} className="bg-gray-900 text-white">
                  {reciter.name} ({reciter.style}) {hasSegments ? '⚡ [Sync Active]' : ''}
                </option>
              );
            })}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
            <Music className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        {reciters[config.reciterIndex] && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-950/70 border border-gray-800 text-xs text-gray-400">
            <span>Style: {reciters[config.reciterIndex].style}</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              {reciters[config.reciterIndex].segments_url ? '✓ Word-Level Karaoke Sync Ready' : '• Verse Audio Only'}
            </span>
          </div>
        )}

        {config.customAudioPath && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
            <span className="truncate max-w-[220px]">
              Local track: {config.customAudioPath.split(/[/\\]/).pop()}
            </span>
            <button
              onClick={() => updateConfig({ customAudioPath: undefined })}
              className="text-[11px] underline text-gray-400 hover:text-white"
            >
              Reset to CDN
            </button>
          </div>
        )}
      </div>

      {/* 2. Audio-Reactive Waveform Motion Graphics */}
      <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-gray-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-amber-400" />
            Audio-Reactive Waveform Motion Graphics
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-gray-400">
              {config.showWaveform ? 'Enabled' : 'Disabled'}
            </span>
            <input
              type="checkbox"
              checked={config.showWaveform}
              onChange={(e) => updateConfig({ showWaveform: e.target.checked })}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </label>
        </div>

        {config.showWaveform && (
          <div className="space-y-5">
            {/* 2.1 Waveform Visual Styles Gallery */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-300">Visualizer Aesthetic Style</span>
                <span className="text-[10px] text-gray-400">7 modern 2026 styles</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WAVEFORM_STYLES.map((style) => {
                  const isSelected = config.waveformType === style.id;
                  return (
                    <button
                      key={style.id}
                      onClick={() => updateConfig({ waveformType: style.id })}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10'
                          : 'bg-gray-950/70 border-gray-800/80 hover:border-gray-700 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-semibold ${isSelected ? 'text-amber-300' : 'text-gray-200'}`}>
                          {style.label}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ${
                            isSelected
                              ? 'bg-amber-500/30 text-amber-300 font-semibold'
                              : 'bg-gray-800/80 text-gray-400'
                          }`}
                        >
                          {style.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-snug">
                        {style.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2.2 Color Theme Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-300">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>Color Gradient Themes</span>
                </div>
                <span className="text-[10px] text-gray-400">1-click presets</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map((p) => {
                  const isActive =
                    config.waveformColor?.toLowerCase() === p.primary.toLowerCase() &&
                    (config.waveformColorSecondary?.toLowerCase() || '') === p.secondary.toLowerCase();
                  return (
                    <button
                      key={p.name}
                      onClick={() =>
                        updateConfig({
                          waveformColor: p.primary,
                          waveformColorSecondary: p.secondary,
                        })
                      }
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                        isActive
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-gray-950/80 border-gray-800 text-gray-300 hover:border-gray-700'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${p.badgeClass}`} />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2.3 Dual Gradient Color Stops */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-950/70 border border-gray-800/80">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Primary Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.waveformColor || '#F59E0B'}
                    onChange={(e) => updateConfig({ waveformColor: e.target.value })}
                    className="w-6 h-6 rounded border border-gray-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-gray-300 uppercase">
                    {config.waveformColor || '#F59E0B'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Gradient Stop 2</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.waveformColorSecondary || config.waveformColor || '#FBBF24'}
                    onChange={(e) => updateConfig({ waveformColorSecondary: e.target.value })}
                    className="w-6 h-6 rounded border border-gray-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-gray-300 uppercase">
                    {config.waveformColorSecondary || config.waveformColor || '#FBBF24'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2.4 Lighting, Glow & Fill Effects */}
            <div className="p-3 rounded-xl bg-gray-950/70 border border-gray-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs text-gray-300 font-medium">Volumetric Neon Glow</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.waveformGlow ?? true}
                  onChange={(e) => updateConfig({ waveformGlow: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {(config.waveformGlow ?? true) && (
                <div className="space-y-1 pt-2 border-t border-gray-800/60">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Glow Radiance Intensity</span>
                    <span className="text-amber-400 font-mono">
                      {(config.waveformGlowIntensity ?? 1.5).toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    value={config.waveformGlowIntensity ?? 1.5}
                    onChange={(e) => updateConfig({ waveformGlowIntensity: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-800/60">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs text-gray-300 font-medium">Translucent Area Gradient Fill</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.waveformFillArea ?? false}
                  onChange={(e) => updateConfig({ waveformFillArea: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1 pt-2 border-t border-gray-800/60">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Waveform Layer Opacity</span>
                  <span className="text-amber-400 font-mono">
                    {Math.round((config.waveformOpacity ?? 0.9) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={1.0}
                  step={0.05}
                  value={config.waveformOpacity ?? 0.9}
                  onChange={(e) => updateConfig({ waveformOpacity: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* 2.5 Dimensions & Sensitivity */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-300">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Dimensions & Acoustics</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Wave Height</span>
                    <span className="text-amber-400 font-mono">{config.waveformHeight}px</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={280}
                    step={5}
                    value={config.waveformHeight}
                    onChange={(e) => updateConfig({ waveformHeight: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Canvas Width</span>
                    <span className="text-amber-400 font-mono">{config.waveformWidth ?? 92}%</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={100}
                    step={2}
                    value={config.waveformWidth ?? 92}
                    onChange={(e) => updateConfig({ waveformWidth: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Acoustic Amplitude</span>
                    <span className="text-amber-400 font-mono">
                      {(config.waveformAmplitude ?? 2.2).toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.8}
                    max={3.5}
                    step={0.1}
                    value={config.waveformAmplitude ?? 2.2}
                    onChange={(e) => updateConfig({ waveformAmplitude: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Y-Position</span>
                    <span className="text-amber-400 font-mono">{config.waveformPositionY}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={92}
                    value={config.waveformPositionY}
                    onChange={(e) => updateConfig({ waveformPositionY: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 2.6 Style-Specific Parameters */}
            <div className="p-3 rounded-xl bg-gray-950/70 border border-gray-800/80 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-300">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Style Fine-Tuning</span>
              </div>

              {/* Halo Radius (Circular Halo only) */}
              {config.waveformType === 'circular-halo' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <CircleDot className="w-3 h-3 text-amber-400" />
                      Circular Halo Radius
                    </span>
                    <span className="text-amber-400 font-mono">
                      {config.waveformCircularRadius ?? 130}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={250}
                    step={5}
                    value={config.waveformCircularRadius ?? 130}
                    onChange={(e) =>
                      updateConfig({ waveformCircularRadius: Number(e.target.value) })
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Bar Width (Bars & Matrix) */}
              {isBarOrMatrix && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Bar / Matrix Bead Width</span>
                    <span className="text-amber-400 font-mono">
                      {config.waveformBarWidth ?? 6}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={14}
                    step={1}
                    value={config.waveformBarWidth ?? 6}
                    onChange={(e) => updateConfig({ waveformBarWidth: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Sample Frequency Density */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Frequency Band Density</span>
                  <span className="text-amber-400 font-mono">
                    {config.waveformSampleCount ?? 64} bands
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { count: 32, label: '32 (Airy)' },
                    { count: 48, label: '48 (Clean)' },
                    { count: 64, label: '64 (Crisp)' },
                    { count: 96, label: '96 (Dense)' },
                    { count: 128, label: '128 (HD)' },
                  ].map((item) => {
                    const isDensityActive = (config.waveformSampleCount ?? 64) === item.count;
                    return (
                      <button
                        key={item.count}
                        onClick={() => updateConfig({ waveformSampleCount: item.count })}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-mono font-medium border text-center transition ${
                          isDensityActive
                            ? 'bg-amber-500/25 border-amber-500 text-amber-200 font-bold'
                            : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

