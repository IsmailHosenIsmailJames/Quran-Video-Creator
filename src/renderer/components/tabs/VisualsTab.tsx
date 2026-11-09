import React, { useRef, useState } from 'react';
import { useStudioStore } from '../../store/studio-store';
import { BACKGROUND_PRESETS } from '../../../shared/constants';
import { getMediaUrl } from '../../../shared/media-url';
import { TransitionType, BackgroundClip, isSalatJammatManifest } from '../../../shared/types';
import { formatDurationMs } from '../../../shared/custom-timestamp-utils';
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
  Film,
  Upload,
  Trash2,
  CheckCircle2,
  Volume2,
  Layers,
  RotateCcw,
} from 'lucide-react';

const TRANSITION_CYCLE: TransitionType[] = [
  'zoom-fade',
  'crossfade',
  'blur-fade',
  'slide-left',
  'dip-black',
];

export const VisualsTab: React.FC = () => {
  const {
    config,
    updateConfig,
    addBackgroundClip,
    addBackgroundClips,
    resetBackgroundClips,
    setActiveTab,
    customTimestamp,
    selectRecitationVideo,
    clearRecitationVideo,
    toggleRecitationVideoBackground,
    toggleRecitationVideoAudio,
  } = useStudioStore();

  const recitationFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);

  const handleSelectRecitationVideo = async () => {
    const api = window.electronAPI;
    if (api?.selectMediaFile) {
      const filePath = await api.selectMediaFile('video');
      if (filePath) {
        await selectRecitationVideo(filePath);
      }
    } else {
      recitationFileInputRef.current?.click();
    }
  };

  const handleRecitationFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const filePath = (file as any).path || file.name;
    await selectRecitationVideo(filePath);
    e.target.value = '';
  };

  const handleVideoDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingVideo(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const filePath = (file as any).path || file.name;
    await selectRecitationVideo(filePath);
  };

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
                onClick={() => {
                  const updates: any = { aspectRatio: item.id };
                  if (item.id === '9:16' && (!config.textScaleMultiplier || config.textScaleMultiplier === 1.0)) {
                    updates.textScaleMultiplier = 1.45;
                  } else if (item.id === '16:9' && config.textScaleMultiplier === 1.45) {
                    updates.textScaleMultiplier = 1.0;
                  }
                  updateConfig(updates);
                }}
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

      {/* 2. Recitation Video Background (Replaces B-Roll Background) */}
      <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-gray-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <Film className="w-4 h-4 text-amber-400" />
            Recitation Video Background
          </div>
          {config.recitationVideoPath && (
            <span
              className={`flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-medium border ${
                config.useRecitationVideoAsBackground
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-gray-800 text-gray-400 border-gray-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  config.useRecitationVideoAsBackground ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                }`}
              />
              {config.useRecitationVideoAsBackground ? 'Active Background' : 'Standby'}
            </span>
          )}
        </div>

        {/* Hidden video file input */}
        <input
          type="file"
          ref={recitationFileInputRef}
          accept="video/*,.mp4,.mov,.webm,.mkv,.m4v"
          onChange={handleRecitationFileInputChange}
          className="hidden"
        />

        {config.recitationVideoPath ? (
          /* Active Recitation Video Card */
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/25 to-gray-950 border border-emerald-500/40 space-y-3.5 shadow-lg shadow-emerald-950/20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
                  <Film className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-white text-xs flex items-center gap-2">
                    <span
                      className="truncate max-w-[200px]"
                      title={config.recitationVideoFileName || config.recitationVideoPath}
                    >
                      {config.recitationVideoFileName || config.recitationVideoPath.split(/[/\\]/).pop()}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono shrink-0">
                      Recitation Video
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2">
                    <span>
                      Duration:{' '}
                      <strong className="text-gray-200 font-mono">
                        {config.recitationVideoDurationSeconds
                          ? formatDurationMs(config.recitationVideoDurationSeconds * 1000)
                          : 'Probing...'}
                      </strong>
                    </span>
                    {config.recitationVideoDurationSeconds && (
                      <span className="text-gray-500">
                        ({Math.round(config.recitationVideoDurationSeconds)}s)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={clearRecitationVideo}
                className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 transition hover:border-red-600 shrink-0"
                title="Remove recitation video background"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
                Remove
              </button>
            </div>

            {/* Sync Badge with Whisper JSON */}
            {customTimestamp && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-950/80 border border-emerald-500/30 text-[11px]">
                <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {isSalatJammatManifest(customTimestamp)
                    ? `Synced with Salat Jama'ah (${customTimestamp.segments.reduce((acc, s) => acc + s.ayahs.length, 0)} verses across ${customTimestamp.segments.length} segments)`
                    : `Synced with Surah ${customTimestamp.surah_name_en} (${customTimestamp.ayahs.length} verses)`}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  Word karaoke locked
                </span>
              </div>
            )}

            {/* Controls: Background switch and Audio track switch */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <label
                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition select-none ${
                  config.useRecitationVideoAsBackground
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                    : 'bg-gray-950/60 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span className="font-medium">Use as Background</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.useRecitationVideoAsBackground ?? false}
                  onChange={(e) => toggleRecitationVideoBackground(e.target.checked)}
                  className="rounded border-gray-700 text-emerald-500 focus:ring-0 cursor-pointer"
                />
              </label>

              <label
                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition select-none ${
                  config.useRecitationVideoAudio
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                    : 'bg-gray-950/60 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="font-medium">Use Video Audio</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.useRecitationVideoAudio ?? false}
                  onChange={(e) => toggleRecitationVideoAudio(e.target.checked)}
                  className="rounded border-gray-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">
              {config.useRecitationVideoAsBackground
                ? '✓ Replaces background images & video presets. Arabic typography, waqf highlights, subtitles, waveform, and branding stay active on top.'
                : 'Standby: Stock footage and presets below are currently active.'}
            </p>
          </div>
        ) : (
          /* Empty / Upload Dropzone State */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingVideo(true);
            }}
            onDragLeave={() => setIsDraggingVideo(false)}
            onDrop={handleVideoDrop}
            className={`p-5 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-2.5 ${
              isDraggingVideo
                ? 'border-emerald-500 bg-emerald-500/10 scale-[0.99]'
                : 'border-gray-800 hover:border-gray-700 bg-gray-950/50'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <Film className="w-6 h-6 text-emerald-400" />
            </div>

            <div>
              <div className="text-xs font-semibold text-white">
                Upload Recitation Video
              </div>
              <p className="text-[11px] text-gray-400 max-w-sm mt-0.5 leading-relaxed">
                Upload full recitation footage (.mp4, .mov, .webm). It will replace background stock images/videos while preserving all typography, karaoke, waqf chunking, translations, and waveforms.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSelectRecitationVideo}
              className="flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-gray-950 font-semibold shadow-md shadow-emerald-500/20 transition active:scale-95 mt-1"
            >
              <Upload className="w-4 h-4 text-gray-950" />
              Browse Recitation Video
            </button>
          </div>
        )}
      </div>

      {/* 3. Cinematic Background Media */}
      <div className="space-y-2">
        {config.useRecitationVideoAsBackground && config.recitationVideoPath && (
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
            <Film className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Recitation video is active as background. Stock clips and presets below are bypassed during playback and export.
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
            Cinematic Background
          </label>
          <div className="flex gap-2">
            {config.backgroundClips && config.backgroundClips.length > 1 && (
              <button
                onClick={() => resetBackgroundClips()}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition shadow-sm"
                title="Reset all clips on the timeline back to default"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                Reset Timeline
              </button>
            )}
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
              <div className="flex items-center gap-3">
                <button
                  onClick={() => resetBackgroundClips()}
                  className="flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                  title="Remove all clips and reset timeline to default"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Timeline
                </button>
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
