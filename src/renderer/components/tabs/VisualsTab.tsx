import React from 'react';
import { useStudioStore } from '../../store/studio-store';
import { BACKGROUND_PRESETS } from '../../../shared/constants';
import { getMediaUrl } from '../../../shared/media-url';
import { TransitionType } from '../../../shared/types';
import {
  Image,
  Video,
  Monitor,
  Smartphone,
  Square,
  Check,
  Sliders,
  Sparkles,
} from 'lucide-react';

export const VisualsTab: React.FC = () => {
  const { config, updateConfig } = useStudioStore();

  const handleSelectMedia = async (type: 'video' | 'image') => {
    const api = window.electronAPI;
    if (!api) return;
    const filePath = await api.selectMediaFile(type);
    if (!filePath) return;

    let sourceDurationSeconds: number | undefined = undefined;
    if (type === 'video' && api.probeMediaDuration) {
      try {
        sourceDurationSeconds = await api.probeMediaDuration(filePath);
      } catch (e) {
        // ignore
      }
    }

    const fileName = filePath.split(/[/\\]/).pop() || `${type} clip`;
    updateConfig({
      backgroundType: type,
      backgroundPath: filePath,
      backgroundClips: [
        {
          id: `clip_${Date.now()}`,
          type,
          source: filePath,
          name: fileName,
          percentage: 100,
          durationRatio: 1.0,
          speed: 1.0,
          autoFitSpeed: true,
          sourceDurationSeconds,
          trimStartSeconds: 0,
          kenBurns: config.kenBurnsEffect,
          transition: config.defaultTransition || 'zoom-fade',
          transitionDurationFrames: 24,
        },
      ],
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
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
            const isSelected = config.backgroundPath === preset.url;
            return (
              <div
                key={preset.id}
                onClick={() =>
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
                  })
                }
                className={`relative group rounded-xl overflow-hidden cursor-pointer border h-20 transition-all ${
                  isSelected
                    ? 'border-amber-400 ring-2 ring-amber-400/30'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
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
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 bg-amber-500 text-black rounded-full p-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
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
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Clip Transition Animation</span>
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
                  if (config.backgroundClips && config.backgroundClips.length > 0) {
                    const updated = config.backgroundClips.map((c) => ({
                      ...c,
                      transition: item.id,
                    }));
                    updateConfig({ backgroundClips: updated, defaultTransition: item.id });
                  }
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
