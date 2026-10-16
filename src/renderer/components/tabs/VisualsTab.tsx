import React from 'react';
import { useStudioStore } from '../../store/studio-store';
import { BACKGROUND_PRESETS } from '../../../shared/constants';
import { getMediaUrl } from '../../../shared/media-url';
import { TransitionType, BackgroundClip } from '../../../shared/types';
import {
  Image,
  Video,
  Monitor,
  Smartphone,
  Square,
  Check,
  Sliders,
  Sparkles,
  Plus,
} from 'lucide-react';

const TRANSITION_CYCLE: TransitionType[] = [
  'zoom-fade',
  'crossfade',
  'blur-fade',
  'slide-left',
  'dip-black',
];

export const VisualsTab: React.FC = () => {
  const { config, updateConfig, addBackgroundClip, addBackgroundClips, setActiveTab } = useStudioStore();

  const handleSelectMedia = async (type: 'video' | 'image') => {
    const api = window.electronAPI;
    if (!api) return;
    const filePaths = await api.selectMediaFiles(type);
    if (!filePaths || filePaths.length === 0) return;

    const currentClips = config.backgroundClips || [];
    const baseTransitionIdx = currentClips.length;
    const newClipItems: Array<Omit<BackgroundClip, 'id'>> = [];

    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      const isVideoFile = type === 'video' || /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(filePath);
      const actualType: 'video' | 'image' = isVideoFile ? 'video' : 'image';
      const fileName = filePath.split(/[/\\]/).pop() || `${actualType} clip`;

      let sourceDurationSeconds: number | undefined = undefined;
      if (isVideoFile && api.probeMediaDuration) {
        try {
          sourceDurationSeconds = await api.probeMediaDuration(filePath);
        } catch (e) {
          // ignore
        }
      }

      const assignedTransition = TRANSITION_CYCLE[(baseTransitionIdx + i) % TRANSITION_CYCLE.length];

      newClipItems.push({
        type: actualType,
        source: filePath,
        name: fileName,
        durationRatio: 1.0,
        speed: 1.0,
        autoFitSpeed: true,
        sourceDurationSeconds,
        trimStartSeconds: 0,
        kenBurns: config.kenBurnsEffect,
        transition: assignedTransition,
        transitionDurationFrames: 24,
      });
    }

    await addBackgroundClips(newClipItems);
  };

  const handleSelectPreset = async (preset: typeof BACKGROUND_PRESETS[0]) => {
    const currentClips = config.backgroundClips || [];

    // If there is only 1 virgin default preset, replace it cleanly
    if (currentClips.length === 1 && currentClips[0].id === 'clip-preset-1') {
      updateConfig({
        backgroundType: 'preset',
        backgroundPath: preset.url,
        backgroundClips: [
          {
            id: `preset_${preset.id}`,
            type: 'preset',
            source: preset.url,
            name: preset.name,
            percentage: 100,
            durationRatio: 1.0,
            speed: 1.0,
            autoFitSpeed: true,
            trimStartSeconds: 0,
            kenBurns: config.kenBurnsEffect,
            transition: config.defaultTransition || 'zoom-fade',
            transitionDurationFrames: 24,
          },
        ],
      });
      return;
    }

    // Otherwise, append to the end of the background timeline
    const assignedTransition = currentClips.length > 0
      ? TRANSITION_CYCLE[(currentClips.length - 1) % TRANSITION_CYCLE.length]
      : (config.defaultTransition || 'zoom-fade');

    await addBackgroundClip({
      type: 'preset',
      source: preset.url,
      name: preset.name,
      durationRatio: 1.0,
      speed: 1.0,
      autoFitSpeed: true,
      trimStartSeconds: 0,
      kenBurns: config.kenBurnsEffect,
      transition: assignedTransition,
      transitionDurationFrames: 24,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* YouTube Thumbnail Studio Shortcut Banner */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">YouTube Thumbnail Studio</span>
            <span className="text-[10px] text-gray-400">Design matching 1280x720 click-worthy cover</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('thumbnail')}
          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 transition shrink-0"
        >
          Open Studio
        </button>
      </div>

      {/* 1. Video Aspect Ratio */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
          Aspect Ratio & Format
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: '16:9', label: '16:9', desc: 'YouTube / Desktop', icon: Monitor },
            { id: '9:16', label: '9:16', desc: 'Shorts / Reels', icon: Smartphone },
            { id: '1:1', label: '1:1', desc: 'Square / Social', icon: Square },
          ].map((item) => {
            const isSelected = config.aspectRatio === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => updateConfig({ aspectRatio: item.id as any })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                }`}
              >
                <Icon className="w-4 h-4 mb-1" />
                <span className="text-xs font-bold">{item.label}</span>
                <span className="text-[10px] text-gray-400/80">{item.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Cinematic Background Media */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
            Cinematic Background
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleSelectMedia('video')}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
              title="Upload custom MP4/WebM video"
            >
              <Video className="w-3.5 h-3.5 text-amber-400" />
              Upload Video
            </button>
            <button
              onClick={() => handleSelectMedia('image')}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
              title="Upload custom PNG/JPG image"
            >
              <Image className="w-3.5 h-3.5 text-amber-400" />
              Upload Image
            </button>
          </div>
        </div>

        {/* Presets Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {BACKGROUND_PRESETS.map((preset) => {
            const countInTimeline = config.backgroundClips?.filter((c) => c.source === preset.url).length || 0;
            const isInTimeline = countInTimeline > 0;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`relative group rounded-xl overflow-hidden cursor-pointer border h-20 transition-all ${
                  isInTimeline
                    ? 'border-amber-400 ring-1 ring-amber-400/40 shadow-sm'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
                title={`Click to add "${preset.name}" to the end of the timeline`}
              >
                <img
                  src={preset.url}
                  alt={preset.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2 flex flex-col justify-end">
                  <span className="text-xs font-semibold text-white drop-shadow">
                    {preset.name}
                  </span>
                </div>

                {/* In-Timeline Badge */}
                {isInTimeline && (
                  <div className="absolute top-1.5 right-1.5 bg-amber-500 text-black rounded-full px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-0.5 shadow-md">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                    {countInTimeline > 1 && <span>×{countInTimeline}</span>}
                  </div>
                )}

                {/* Hover Overlay: Add to Timeline */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[1px]">
                  <span className="bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg transform group-hover:scale-105 transition-transform">
                    <Plus className="w-3 h-3 stroke-[3]" />
                    <span>Add to Timeline</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {config.backgroundPath && !BACKGROUND_PRESETS.some((p) => p.url === config.backgroundPath) && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs">
            <div className="flex items-center gap-2.5">
              {config.backgroundType === 'image' && (
                <img
                  src={getMediaUrl(config.backgroundPath)}
                  alt="Background preview"
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/20"
                />
              )}
              <span className="text-gray-300 truncate max-w-[200px]">
                Custom Media: {config.backgroundPath.split(/[/\\]/).pop()}
              </span>
            </div>
            <span className="text-amber-400 font-medium capitalize">
              {config.backgroundType}
            </span>
          </div>
        )}
      </div>

      {/* 3. Transition Animation Style */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Default Transition (for new clips)</span>
          </label>
          <span className="text-[10px] text-amber-400 font-mono capitalize">
            {config.defaultTransition || 'zoom-fade'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'zoom-fade' as TransitionType, label: 'Zoom Fade', desc: 'Cinematic scale zoom' },
            { id: 'crossfade' as TransitionType, label: 'Crossfade', desc: 'Smooth dissolve' },
            { id: 'blur-fade' as TransitionType, label: 'Blur Melt', desc: 'Gaussian defocus' },
            { id: 'dip-black' as TransitionType, label: 'Dip Black', desc: 'Fade to darkness' },
            { id: 'slide-left' as TransitionType, label: 'Slide Push', desc: 'Lateral push' },
            { id: 'cut' as TransitionType, label: 'Hard Cut', desc: 'Instant switch' },
          ].map((item) => {
            const isSelected = (config.defaultTransition || 'zoom-fade') === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  updateConfig({ defaultTransition: item.id });
                }}
                className={`p-2 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 ring-1 ring-amber-500/30'
                    : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                }`}
              >
                <div className="text-xs font-bold truncate">{item.label}</div>
                <div className="text-[10px] text-gray-500 truncate">{item.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Per-Clip Transitions Manager (Shown when multiple clips exist) */}
        {config.backgroundClips && config.backgroundClips.length > 1 && (
          <div className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Individual Clip Transitions:
              </span>
              <button
                onClick={() => {
                  const currentDefault = config.defaultTransition || 'zoom-fade';
                  const updated = config.backgroundClips?.map((c) => ({
                    ...c,
                    transition: currentDefault,
                  }));
                  if (updated) updateConfig({ backgroundClips: updated });
                }}
                className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                title="Apply current default animation to all clips"
              >
                Apply "{config.defaultTransition || 'zoom-fade'}" to all
              </button>
            </div>
            <div className="space-y-1.5 pt-1">
              {config.backgroundClips.slice(1).map((clip, idx) => (
                <div
                  key={clip.id}
                  className="flex items-center justify-between bg-gray-950 px-2.5 py-1.5 rounded-lg border border-gray-800/80 text-xs"
                >
                  <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                    <span className="text-gray-500 text-[10px] font-mono">Clip #{idx + 2}:</span>
                    <span className="text-gray-300 truncate font-medium">{clip.name}</span>
                  </div>
                  <select
                    value={clip.transition || 'crossfade'}
                    onChange={(e) => {
                      const newTransition = e.target.value as TransitionType;
                      const updated = config.backgroundClips?.map((c) =>
                        c.id === clip.id ? { ...c, transition: newTransition } : c
                      );
                      if (updated) updateConfig({ backgroundClips: updated });
                    }}
                    className="bg-gray-900 border border-gray-700 text-amber-400 rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="zoom-fade">Zoom Fade</option>
                    <option value="crossfade">Crossfade</option>
                    <option value="blur-fade">Blur Melt</option>
                    <option value="dip-black">Dip to Black</option>
                    <option value="slide-left">Slide Push</option>
                    <option value="cut">Hard Cut</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Cinematic Grading & Overlays */}
      <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-gray-800 text-xs font-semibold text-amber-300 uppercase tracking-wider">
          <Sliders className="w-4 h-4 text-amber-400" />
          Cinematic Grading ("An Nafee" Style)
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Dark Overlay</span>
              <span className="text-amber-400 font-mono">
                {Math.round(config.overlayOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.15}
              max={0.85}
              step={0.05}
              value={config.overlayOpacity}
              onChange={(e) => updateConfig({ overlayOpacity: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Edge Vignette</span>
              <span className="text-amber-400 font-mono">
                {Math.round(config.vignetteIntensity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.0}
              max={1.0}
              step={0.05}
              value={config.vignetteIntensity}
              onChange={(e) => updateConfig({ vignetteIntensity: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-300">Ken Burns Sub-Pixel Motion</span>
          <input
            type="checkbox"
            checked={config.kenBurnsEffect}
            onChange={(e) => updateConfig({ kenBurnsEffect: e.target.checked })}
            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
