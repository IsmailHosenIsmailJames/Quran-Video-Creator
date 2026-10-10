import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
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
  Percent,
  Check,
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
    updateClipPercentage,
    reorderBackgroundClips,
    setRecitationSpeed,
  } = useStudioStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showTransitionMenu, setShowTransitionMenu] = useState<string | null>(null); // clipId for transition

  const timelineTrackRef = useRef<HTMLDivElement>(null);

  // Dragging divider state
  const [draggingDividerIndex, setDraggingDividerIndex] = useState<number | null>(null);
  const dragStartRef = useRef<{
    startX: number;
    leftId: string;
    rightId: string;
    leftStartPct: number;
    rightStartPct: number;
  } | null>(null);

  const clips = config.backgroundClips && config.backgroundClips.length > 0
    ? config.backgroundClips
    : [
        {
          id: 'default-clip',
          type: config.backgroundType,
          source: config.backgroundPath,
          name: 'Primary Background',
          percentage: 100,
          durationRatio: 1.0,
          speed: 1.0,
          autoFitSpeed: true,
          trimStartSeconds: 0,
          kenBurns: config.kenBurnsEffect,
          transition: 'zoom-fade' as TransitionType,
          transitionDurationFrames: 24,
        },
      ];

  // Calculate normalized percentages and duration in seconds for each clip
  const clipLayouts = useMemo(() => {
    const totalClips = clips.length;
    const totalWeight = clips.reduce(
      (sum, c) => sum + (c.percentage !== undefined ? c.percentage : (c.durationRatio || 1.0) * 100),
      0
    );
    const norm = totalWeight > 0 ? 100 / totalWeight : 1;

    let accumulatedPercent = 0;
    return clips.map((clip, index) => {
      const isLast = index === totalClips - 1;
      const rawPct = (clip.percentage !== undefined ? clip.percentage : (clip.durationRatio || 1.0) * 100) * norm;
      const percent = isLast ? Math.max(2, 100 - accumulatedPercent) : Math.max(2, Number(rawPct.toFixed(2)));
      const startPercent = accumulatedPercent;
      accumulatedPercent += percent;

      const durationSec = Number(((percent / 100) * (totalDurationInFrames / fps)).toFixed(1));

      // Calculate effective speed for display
      const isVideo = clip.type === 'video' || /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(clip.source);
      let displaySpeed = `${clip.speed || 1.0}×`;
      let isAutoSlowed = false;

      if (isVideo && clip.autoFitSpeed !== false) {
        const slotSec = Math.max(0.1, durationSec);
        const trimStart = clip.trimStartSeconds || 0;
        let available = clip.sourceDurationSeconds ? clip.sourceDurationSeconds - trimStart : undefined;
        if (clip.trimEndSeconds && clip.trimEndSeconds > trimStart && available !== undefined) {
          available = Math.min(available, clip.trimEndSeconds - trimStart);
        }
        if (available !== undefined && slotSec > available) {
          const fitSpeed = Math.max(0.05, Math.min(1.0, available / slotSec));
          displaySpeed = `${fitSpeed.toFixed(2)}×`;
          isAutoSlowed = true;
        } else if (available !== undefined) {
          displaySpeed = `1.0×`;
        }
      }

      return {
        clip,
        percent,
        startPercent,
        durationSec,
        displaySpeed,
        isAutoSlowed,
        isVideo,
      };
    });
  }, [clips, totalDurationInFrames, fps]);

  // Selected clip object for inspector
  const selectedClip = clips.find((c) => c.id === selectedClipId) || null;
  const selectedLayout = clipLayouts.find((l) => l.clip.id === selectedClipId) || null;

  // Global mouse listeners for divider dragging
  useEffect(() => {
    if (draggingDividerIndex === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !timelineTrackRef.current) return;
      const trackWidth = timelineTrackRef.current.clientWidth;
      if (trackWidth <= 0) return;

      const dx = e.clientX - dragStartRef.current.startX;
      const deltaPct = (dx / trackWidth) * 100;

      const { leftId, rightId, leftStartPct, rightStartPct } = dragStartRef.current;
      const minPct = 2.0;
      const combined = leftStartPct + rightStartPct;

      const newLeft = Math.max(minPct, Math.min(combined - minPct, leftStartPct + deltaPct));
      const newRight = combined - newLeft;

      updateBackgroundClip(leftId, {
        percentage: Number(newLeft.toFixed(2)),
        durationRatio: Number((newLeft / 100).toFixed(4)),
      });
      updateBackgroundClip(rightId, {
        percentage: Number(newRight.toFixed(2)),
        durationRatio: Number((newRight / 100).toFixed(4)),
      });
    };

    const handleMouseUp = () => {
      setDraggingDividerIndex(null);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingDividerIndex, updateBackgroundClip]);

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
    if (draggingDividerIndex !== null || !timelineTrackRef.current) return;
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
    await addBackgroundClip({
      type,
      source: filePath,
      name: fileName,
      durationRatio: 1.0,
      speed: 1.0,
      autoFitSpeed: true,
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
          <div className="flex-1 h-full flex relative">
            {clipLayouts.map(({ clip, percent, durationSec, displaySpeed, isAutoSlowed, isVideo }, index) => {
              const isSelected = clip.id === selectedClipId;
              const nextLayout = clipLayouts[index + 1];

              return (
                <div
                  key={clip.id}
                  style={{ width: `${percent}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedClipId(clip.id === selectedClipId ? null : clip.id);
                  }}
                  className={`h-full relative rounded-lg border cursor-pointer transition-all flex items-center justify-between px-2 text-[10px] mr-1 last:mr-0 ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/40 bg-amber-500/20 z-10'
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

                  {/* Percentage, Duration & Speed Badges */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="px-1 py-0.5 rounded bg-gray-800/90 text-amber-300 font-mono text-[9px] border border-gray-700">
                      {percent.toFixed(0)}%
                    </span>
                    <span className="font-mono text-gray-400 text-[10px]">{durationSec}s</span>
                    {isVideo && (
                      <span
                        className={`px-1 py-0.5 rounded font-mono text-[9px] ${
                          isAutoSlowed
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                        title={isAutoSlowed ? 'Auto-slowed to fit slot without repeating' : 'Manual speed'}
                      >
                        {displaySpeed}
                      </span>
                    )}
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

                  {/* Interactive Draggable Divider between this clip and next clip */}
                  {nextLayout && (
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingDividerIndex(index);
                        dragStartRef.current = {
                          startX: e.clientX,
                          leftId: clip.id,
                          rightId: nextLayout.clip.id,
                          leftStartPct: percent,
                          rightStartPct: nextLayout.percent,
                        };
                      }}
                      className="absolute -right-1.5 top-0 bottom-0 w-3 cursor-col-resize z-20 flex items-center justify-center group"
                      title="Drag to adjust time between clips"
                    >
                      <div className="w-1 h-4 rounded-full bg-gray-600 group-hover:bg-amber-400 group-hover:h-6 transition-all" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Selected Clip Inspector Popover Bar */}
      {selectedClip && selectedLayout && (
        <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in">
          <div className="flex flex-wrap items-center gap-3">
            {/* Clip Identifier */}
            <div className="flex items-center gap-1.5 font-semibold text-amber-400">
              {selectedLayout.isVideo ? <Film className="w-4 h-4" /> : <ImageIcon className="w-4 h-4 text-emerald-400" />}
              <span className="truncate max-w-[140px]" title={selectedClip.name}>
                {selectedClip.name}
              </span>
            </div>

            {/* Manual Percentage / Visualization Time Adjustment */}
            <div className="flex items-center gap-2 bg-gray-950 px-2.5 py-1.5 rounded-lg border border-gray-800">
              <span className="text-gray-400 text-[11px]">Visualization Time:</span>
              <button
                onClick={() =>
                  updateClipPercentage(
                    selectedClip.id,
                    Math.max(2, (selectedClip.percentage ?? selectedLayout.percent) - 5)
                  )
                }
                className="w-5 h-5 rounded bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center font-bold text-xs"
                title="Decrease visualization time (-5%)"
              >
                -
              </button>
              <input
                type="range"
                min="2"
                max={Math.max(2, 100 - (clips.length - 1) * 2)}
                step="0.5"
                value={selectedClip.percentage ?? selectedLayout.percent}
                onChange={(e) => updateClipPercentage(selectedClip.id, Number(e.target.value))}
                className="w-20 accent-amber-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
              />
              <button
                onClick={() =>
                  updateClipPercentage(
                    selectedClip.id,
                    Math.min(100 - (clips.length - 1) * 2, (selectedClip.percentage ?? selectedLayout.percent) + 5)
                  )
                }
                className="w-5 h-5 rounded bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center font-bold text-xs"
                title="Increase visualization time (+5%)"
              >
                +
              </button>
              <span className="font-mono text-amber-300 font-semibold text-[11px]">
                {(selectedClip.percentage ?? selectedLayout.percent).toFixed(1)}% ({selectedLayout.durationSec}s)
              </span>
            </div>

            {/* Video Auto Slow-Down (Fill Slot, No Repeating) Toggle */}
            {selectedLayout.isVideo && (
              <div className="flex items-center gap-2 bg-gray-950 px-2.5 py-1.5 rounded-lg border border-gray-800">
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={selectedClip.autoFitSpeed !== false}
                    onChange={(e) =>
                      updateBackgroundClip(selectedClip.id, {
                        autoFitSpeed: e.target.checked,
                      })
                    }
                    className="accent-amber-500 rounded cursor-pointer"
                  />
                  <span className={selectedClip.autoFitSpeed !== false ? 'text-amber-400 font-semibold' : 'text-gray-400'}>
                    Auto Slow-Down (No Repeat)
                  </span>
                </label>

                {selectedClip.autoFitSpeed !== false ? (
                  <span
                    className="text-[10px] text-gray-400 font-mono bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800"
                    title={
                      selectedClip.sourceDurationSeconds
                        ? `Video source: ${selectedClip.sourceDurationSeconds.toFixed(1)}s -> Stretched to ${selectedLayout.durationSec}s at ${selectedLayout.displaySpeed}`
                        : 'Video will play slower to reach the end of this slot without repeating'
                    }
                  >
                    {selectedLayout.isAutoSlowed
                      ? `🐢 ${selectedLayout.displaySpeed} (${selectedClip.sourceDurationSeconds ? selectedClip.sourceDurationSeconds.toFixed(1) + 's' : 'short'} ➔ ${selectedLayout.durationSec}s)`
                      : `⏱ 1.0× (fits slot)`}
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    {[0.5, 0.75, 1.0, 1.5, 2.0].map((spd) => (
                      <button
                        key={spd}
                        onClick={() =>
                          updateBackgroundClip(selectedClip.id, {
                            speed: spd,
                            autoFitSpeed: false,
                          })
                        }
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                          (selectedClip.speed || 1.0) === spd
                            ? 'bg-amber-500 text-black font-bold'
                            : 'text-gray-400 hover:text-white bg-gray-900'
                        }`}
                      >
                        {spd}×
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* In-Point Trim (Seconds for video) */}
            {selectedLayout.isVideo && (
              <div className="flex items-center gap-1.5 text-[11px] bg-gray-950 px-2 py-1 rounded-lg border border-gray-800">
                <Scissors className="w-3 h-3 text-amber-400" />
                <span className="text-gray-400">Trim:</span>
                <input
                  type="number"
                  min={0}
                  max={60}
                  step={0.5}
                  value={selectedClip.trimStartSeconds || 0}
                  onChange={(e) =>
                    updateBackgroundClip(selectedClip.id, {
                      trimStartSeconds: Math.max(0, Number(e.target.value)),
                    })
                  }
                  className="w-12 bg-gray-900 border border-gray-700 rounded px-1 text-[11px] text-white font-mono"
                />
                <span className="text-gray-500">s</span>
              </div>
            )}

            {/* Ken Burns subtle zoom for images */}
            {!selectedLayout.isVideo && (
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] bg-gray-950 px-2.5 py-1.5 rounded-lg border border-gray-800">
                <input
                  type="checkbox"
                  checked={selectedClip.kenBurns !== false}
                  onChange={(e) =>
                    updateBackgroundClip(selectedClip.id, {
                      kenBurns: e.target.checked,
                    })
                  }
                  className="accent-amber-500 rounded cursor-pointer"
                />
                <span className={selectedClip.kenBurns !== false ? 'text-emerald-400 font-semibold' : 'text-gray-400'}>
                  Ken Burns Zoom
                </span>
              </label>
            )}
          </div>

          {/* Reorder, Delete, Close Controls */}
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
