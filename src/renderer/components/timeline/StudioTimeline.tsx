import React, { useState, useRef, useMemo } from 'react';
import { PlayerRef } from '@remotion/player';
import { useStudioStore } from '../../store/studio-store';
import { BackgroundClip, TransitionType } from '../../../shared/types';
import { getMediaUrl } from '../../../shared/media-url';
import {
  Play,
  Pause,
  Plus,
  Trash2,
  Clock,
  Sliders,
  Scissors,
  Film,
  Image as ImageIcon,
  MoveLeft,
  MoveRight,
  Sparkles,
  ChevronDown,
  Gauge,
  X,
} from 'lucide-react';

interface StudioTimelineProps {
  playerRef: React.RefObject<PlayerRef>;
  currentFrame: number;
  totalDurationInFrames: number;
  fps: number;
}

const TRANSITION_LABELS: Record<TransitionType, string> = {
  'zoom-fade': 'Zoom Fade',
  'crossfade': 'Crossfade',
  'blur-fade': 'Blur Melt',
  'dip-black': 'Dip to Black',
  'slide-left': 'Slide Push',
  'cut': 'Hard Cut',
};

export const StudioTimeline: React.FC<StudioTimelineProps> = ({
  playerRef,
  currentFrame,
  totalDurationInFrames,
  fps,
}) => {
  const {
    config,
    ayahs,
    updateConfig,
    addBackgroundClip,
    removeBackgroundClip,
    updateBackgroundClip,
    reorderBackgroundClips,
    setRecitationSpeed,
  } = useStudioStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showTransitionMenu, setShowTransitionMenu] = useState<string | null>(null); // clipId for transition

  const timelineTrackRef = useRef<HTMLDivElement>(null);

  const clips = config.backgroundClips && config.backgroundClips.length > 0
    ? config.backgroundClips
    : [
        {
          id: 'default-clip',
          type: config.backgroundType,
          source: config.backgroundPath,
          name: 'Primary Background',
          durationRatio: 1.0,
          speed: 1.0,
          trimStartSeconds: 0,
          kenBurns: config.kenBurnsEffect,
          transition: 'zoom-fade' as TransitionType,
          transitionDurationFrames: 24,
        },
      ];

  // Calculate proportional frames and percentages for each clip
  const totalRatio = useMemo(() => {
    return clips.reduce((sum, c) => sum + (c.durationRatio || 1.0), 0);
  }, [clips]);

  const clipLayouts = useMemo(() => {
    const validTotal = totalRatio > 0 ? totalRatio : clips.length;
    let accumulatedPercent = 0;
    return clips.map((clip) => {
      const ratio = clip.durationRatio || 1.0;
      const percent = (ratio / validTotal) * 100;
      const startPercent = accumulatedPercent;
      accumulatedPercent += percent;
      const durationSec = ((ratio / validTotal) * (totalDurationInFrames / fps)).toFixed(1);
      return {
        clip,
        percent,
        startPercent,
        durationSec,
      };
    });
  }, [clips, totalRatio, totalDurationInFrames, fps]);

  // Selected clip object for inspector
  const selectedClip = clips.find((c) => c.id === selectedClipId) || null;

  // Format timecode (e.g. 01:23.4)
  const formatTime = (frame: number): string => {
    const totalSec = frame / fps;
    const mins = Math.floor(totalSec / 60);
    const secs = (totalSec % 60).toFixed(1);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(4, '0')}`;
  };

  // Toggle playback
  const handleTogglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    if (player.isPlaying()) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  // Seek handler when clicking or scrubbing the ruler
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineTrackRef.current) return;
    const rect = timelineTrackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, clickX / rect.width));
    const targetFrame = Math.round(progress * totalDurationInFrames);
    playerRef.current?.seekTo(targetFrame);
  };

  // Add new media
  const handleAddMedia = async (type: 'video' | 'image') => {
    const api = window.electronAPI;
    if (!api) return;
    const filePath = await api.selectMediaFile(type);
    if (!filePath) return;

    const fileName = filePath.split(/[/\\]/).pop() || `${type} clip`;
    addBackgroundClip({
      type,
      source: filePath,
      name: fileName,
      durationRatio: 1.0,
      speed: 1.0,
      trimStartSeconds: 0,
      kenBurns: true,
      transition: config.defaultTransition || 'zoom-fade',
      transitionDurationFrames: 24,
    });
  };

  // Calculate current playhead percentage
  const playheadPercent = Math.min(100, Math.max(0, (currentFrame / Math.max(1, totalDurationInFrames)) * 100));

  return (
    <div className="w-full flex-shrink-0 bg-gray-950/95 border-t border-gray-800/90 rounded-2xl p-3 shadow-2xl flex flex-col gap-2.5 backdrop-blur-md select-none mt-2">
      {/* 1. Timeline Controls Header */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-3">
          {/* Play / Pause Button */}
          <button
            onClick={handleTogglePlay}
            className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center font-bold shadow-md shadow-amber-500/20 active:scale-95 transition"
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>

          {/* Timecode & Frame Indicator */}
          <div className="flex items-center gap-2 font-mono text-[11px] bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-lg">
            <Clock className="w-3 h-3 text-amber-400" />
            <span className="text-white font-medium">{formatTime(currentFrame)}</span>
            <span className="text-gray-600">/</span>
            <span className="text-gray-400">{formatTime(totalDurationInFrames)}</span>
            <span className="text-gray-600">•</span>
            <span className="text-amber-300/80">{currentFrame}f</span>
          </div>

          {/* Recitation Audio Speed Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-[11px] text-gray-300 transition"
              title="Change Recitation Audio Speed"
            >
              <Gauge className="w-3 h-3 text-amber-400" />
              <span>Recitation: <strong className="text-amber-400">{config.recitationSpeed || 1.0}×</strong></span>
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>

            {showSpeedMenu && (
              <div className="absolute top-full left-0 mt-1 w-32 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl py-1 z-50">
                {[0.75, 0.85, 1.0, 1.15, 1.25].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setRecitationSpeed(s);
                      setShowSpeedMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-gray-800 transition ${
                      (config.recitationSpeed || 1.0) === s ? 'text-amber-400 font-bold bg-amber-500/10' : 'text-gray-300'
                    }`}
                  >
                    <span>{s}× Speed</span>
                    {(config.recitationSpeed || 1.0) === s && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Action: Add Media to Background */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAddMedia('video')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white transition text-[11px]"
            title="Upload custom video clip to background track"
          >
            <Film className="w-3 h-3 text-amber-400" />
            <span>+ Video</span>
          </button>
          <button
            onClick={() => handleAddMedia('image')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white transition text-[11px]"
            title="Upload custom image to background track"
          >
            <ImageIcon className="w-3 h-3 text-amber-400" />
            <span>+ Image</span>
          </button>
        </div>
      </div>

      {/* 2. Timeline Tracks Container */}
      <div
        ref={timelineTrackRef}
        onClick={handleRulerClick}
        className="relative w-full rounded-xl bg-gray-900/90 border border-gray-800/80 p-2 cursor-pointer flex flex-col gap-1.5 overflow-hidden"
      >
        {/* Playhead Needle Bar (Red / Amber Scrubber) */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-amber-400 shadow-[0_0_10px_#f59e0b] z-30 pointer-events-none transition-all duration-75"
          style={{ left: `${playheadPercent}%` }}
        >
          <div className="w-3 h-3 bg-amber-400 transform -translate-x-[5px] -translate-y-0.5 rounded-b-md shadow-md" />
        </div>

        {/* Track A: Ayahs / Scripture Audio Track */}
        <div className="flex items-center gap-1 h-6 w-full relative">
          <span className="text-[10px] font-mono text-gray-500 w-12 flex-shrink-0">Ayahs:</span>
          <div className="flex-1 h-full flex gap-1 relative overflow-hidden">
            {ayahs.map((ayah) => {
              const ayahPercent = (ayah.durationInFrames / Math.max(1, totalDurationInFrames)) * 100;
              return (
                <div
                  key={`${ayah.surah}:${ayah.ayah}`}
                  style={{ width: `${ayahPercent}%` }}
                  className="h-full rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 flex items-center justify-between text-[10px] text-amber-300 font-mono truncate"
                  title={`Verse ${ayah.ayah} (${(ayah.durationInFrames / fps).toFixed(1)}s)`}
                >
                  <span className="truncate font-semibold">v.{ayah.ayah}</span>
                  <span className="text-[9px] text-amber-400/70 hidden sm:inline">
                    {(ayah.durationInFrames / fps).toFixed(1)}s
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Track B: Multi-Media Background Sequence Track */}
        <div className="flex items-center gap-1 h-12 w-full relative">
          <span className="text-[10px] font-mono text-gray-500 w-12 flex-shrink-0">Media:</span>
          <div className="flex-1 h-full flex gap-1 relative">
            {clipLayouts.map(({ clip, percent, durationSec }, index) => {
              const isSelected = clip.id === selectedClipId;
              const isVideo = clip.type === 'video' || clip.source.endsWith('.mp4');

              return (
                <div
                  key={clip.id}
                  style={{ width: `${percent}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedClipId(clip.id === selectedClipId ? null : clip.id);
                  }}
                  className={`h-full relative rounded-lg overflow-hidden border cursor-pointer transition-all flex items-center justify-between px-2 text-[10px] ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/40 bg-amber-500/20'
                      : 'border-gray-800 bg-gray-950/80 hover:border-gray-700 hover:bg-gray-900/60'
                  }`}
                >
                  {/* Clip Thumbnail / Icon */}
                  <div className="flex items-center gap-1.5 truncate">
                    {isVideo ? (
                      <Film className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    )}
                    <span className="truncate font-medium text-gray-200">{clip.name}</span>
                  </div>

                  {/* Duration & Speed Pills */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {clip.speed && clip.speed !== 1 && (
                      <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px]">
                        {clip.speed}×
                      </span>
                    )}
                    <span className="font-mono text-gray-400 text-[10px]">{durationSec}s</span>
                  </div>

                  {/* Transition Badge between adjacent clips */}
                  {index > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTransitionMenu(showTransitionMenu === clip.id ? null : clip.id);
                      }}
                      className="absolute -left-2.5 top-1/2 -translate-y-1/2 z-20 w-5 h-5 rounded-full bg-gray-900 border border-amber-500/50 text-amber-400 hover:bg-amber-500 hover:text-black flex items-center justify-center text-[9px] shadow transition"
                      title={`Transition: ${TRANSITION_LABELS[clip.transition || 'crossfade']}`}
                    >
                      ⧓
                    </button>
                  )}

                  {/* Transition Picker Menu */}
                  {showTransitionMenu === clip.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-0 bottom-full mb-2 w-40 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-2 z-50 text-xs"
                    >
                      <div className="flex justify-between items-center pb-1 mb-1 border-b border-gray-800 text-[10px] text-gray-400 font-semibold uppercase">
                        <span>Transition Animation</span>
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setShowTransitionMenu(null)} />
                      </div>
                      {(Object.keys(TRANSITION_LABELS) as TransitionType[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            updateBackgroundClip(clip.id, { transition: t });
                            setShowTransitionMenu(null);
                          }}
                          className={`w-full text-left px-2 py-1 rounded text-[11px] hover:bg-gray-800 transition ${
                            clip.transition === t ? 'text-amber-400 font-bold bg-amber-500/10' : 'text-gray-300'
                          }`}
                        >
                          {TRANSITION_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Selected Clip Inspector Popover Bar */}
      {selectedClip && (
        <div className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-amber-400 truncate max-w-[150px]">
              {selectedClip.name}
            </span>

            {/* Duration Ratio Adjuster */}
            <div className="flex items-center gap-1.5 text-[11px] bg-gray-950 px-2 py-1 rounded-lg border border-gray-800">
              <span className="text-gray-400">Duration Ratio:</span>
              <button
                onClick={() =>
                  updateBackgroundClip(selectedClip.id, {
                    durationRatio: Math.max(0.2, (selectedClip.durationRatio || 1.0) - 0.2),
                  })
                }
                className="w-4 h-4 rounded bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center font-bold"
              >
                -
              </button>
              <span className="font-mono text-amber-300 font-medium">
                {(selectedClip.durationRatio || 1.0).toFixed(1)}×
              </span>
              <button
                onClick={() =>
                  updateBackgroundClip(selectedClip.id, {
                    durationRatio: Math.min(5.0, (selectedClip.durationRatio || 1.0) + 0.2),
                  })
                }
                className="w-4 h-4 rounded bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>

            {/* Video Speed Selector (for video clips) */}
            {(selectedClip.type === 'video' || selectedClip.source.endsWith('.mp4')) && (
              <div className="flex items-center gap-1.5 text-[11px] bg-gray-950 px-2 py-1 rounded-lg border border-gray-800">
                <span className="text-gray-400">Video Speed:</span>
                {[0.5, 1.0, 1.5, 2.0].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => updateBackgroundClip(selectedClip.id, { speed: spd })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                      (selectedClip.speed || 1.0) === spd
                        ? 'bg-amber-500 text-black font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {spd}×
                  </button>
                ))}
              </div>
            )}

            {/* In-Point Trim (Seconds) */}
            {(selectedClip.type === 'video' || selectedClip.source.endsWith('.mp4')) && (
              <div className="flex items-center gap-1.5 text-[11px] bg-gray-950 px-2 py-1 rounded-lg border border-gray-800">
                <Scissors className="w-3 h-3 text-amber-400" />
                <span className="text-gray-400">Trim Start:</span>
                <input
                  type="number"
                  min={0}
                  max={60}
                  step={0.5}
                  value={selectedClip.trimStartSeconds || 0}
                  onChange={(e) =>
                    updateBackgroundClip(selectedClip.id, {
                      trimStartSeconds: Number(e.target.value),
                    })
                  }
                  className="w-12 bg-gray-900 border border-gray-700 rounded px-1 text-[11px] text-white font-mono"
                />
                <span className="text-gray-500">s</span>
              </div>
            )}
          </div>

          {/* Reorder and Delete Controls */}
          <div className="flex items-center gap-1.5">
            {clips.indexOf(selectedClip) > 0 && (
              <button
                onClick={() => reorderBackgroundClips(clips.indexOf(selectedClip), clips.indexOf(selectedClip) - 1)}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                title="Move Earlier"
              >
                <MoveLeft className="w-3.5 h-3.5" />
              </button>
            )}
            {clips.indexOf(selectedClip) < clips.length - 1 && (
              <button
                onClick={() => reorderBackgroundClips(clips.indexOf(selectedClip), clips.indexOf(selectedClip) + 1)}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                title="Move Later"
              >
                <MoveRight className="w-3.5 h-3.5" />
              </button>
            )}
            {clips.length > 1 && (
              <button
                onClick={() => {
                  removeBackgroundClip(selectedClip.id);
                  setSelectedClipId(null);
                }}
                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                title="Delete this clip"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setSelectedClipId(null)}
              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
