import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { PlayerRef } from '@remotion/player';
import { useStudioStore } from '../../store/studio-store';
import { BackgroundClip, TransitionType, TextAnimationIn, TextAnimationOut } from '../../../shared/types';
import { TEXT_ANIMATION_IN_OPTIONS, TEXT_ANIMATION_OUT_OPTIONS } from '../../../shared/constants';
import { getMediaUrl } from '../../../shared/media-url';
import { computeAdaptiveFontSizes } from '../../../shared/typography-utils';
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
  RefreshCw,
  Type,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Magnet,
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

const TRANSITION_COLORS: Record<TransitionType, { bg: string; text: string; border: string }> = {
  'zoom-fade': { bg: 'bg-amber-500/20 hover:bg-amber-500/30', text: 'text-amber-400', border: 'border-amber-500/60' },
  'crossfade': { bg: 'bg-sky-500/20 hover:bg-sky-500/30', text: 'text-sky-400', border: 'border-sky-500/60' },
  'blur-fade': { bg: 'bg-purple-500/20 hover:bg-purple-500/30', text: 'text-purple-400', border: 'border-purple-500/60' },
  'dip-black': { bg: 'bg-zinc-700/50 hover:bg-zinc-700/70', text: 'text-zinc-200', border: 'border-zinc-500' },
  'slide-left': { bg: 'bg-emerald-500/20 hover:bg-emerald-500/30', text: 'text-emerald-400', border: 'border-emerald-500/60' },
  'cut': { bg: 'bg-gray-800 hover:bg-gray-700', text: 'text-gray-400', border: 'border-gray-600' },
};

const TRANSITION_CYCLE: TransitionType[] = [
  'zoom-fade',
  'crossfade',
  'blur-fade',
  'slide-left',
  'dip-black',
];

export const StudioTimeline: React.FC<StudioTimelineProps> = ({
  playerRef,
  currentFrame: propCurrentFrame,
  totalDurationInFrames,
  fps,
}) => {
  const {
    config,
    ayahs,
    currentFrame: storeCurrentFrame,
    setCurrentFrame,
    isPlaying,
    setIsPlaying,
    updateConfig,
    updateAyahFontOverride,
    resetAyahFontOverride,
    addBackgroundClip,
    addBackgroundClips,
    removeBackgroundClip,
    updateBackgroundClip,
    updateClipPercentage,
    reorderBackgroundClips,
    setRecitationSpeed,
  } = useStudioStore();

  const currentFrame = storeCurrentFrame ?? propCurrentFrame ?? 0;

  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedAyahNumber, setSelectedAyahNumber] = useState<number | null>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSwapMenu, setShowSwapMenu] = useState(false);
  const [showTransitionMenu, setShowTransitionMenu] = useState<string | null>(null); // clipId for transition

  const timelineTrackRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Playhead scrubber dragging state
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Horizontal Timeline Zoom state (1 = Fit window, up to 10x magnification)
  const defaultZoom = useMemo(() => {
    if (ayahs.length >= 60) return 4.0;
    if (ayahs.length >= 30) return 2.5;
    if (ayahs.length >= 15) return 1.5;
    return 1.0;
  }, [ayahs.length]);

  const [zoomLevel, setZoomLevel] = useState<number>(defaultZoom);

  useEffect(() => {
    if (ayahs.length >= 60) setZoomLevel((z) => Math.max(z, 4.0));
    else if (ayahs.length >= 30) setZoomLevel((z) => Math.max(z, 2.5));
  }, [ayahs.length]);

  // Dragging divider state between clips
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

  const isIntroActive = Boolean(
    config.enableIntroVideo &&
    (config.introMode === 'custom-video' ? config.introVideoPath : true) &&
    !(config.skipIntroForShorts !== false && config.aspectRatio === '9:16')
  );
  const introDurationInFrames = isIntroActive
    ? Math.max(1, Math.round((config.introVideoDurationSeconds || 4) * fps))
    : 0;

  const isTitleCardActive = Boolean(
    config.enableSurahTitleCard &&
    !(config.skipTitleCardForShorts !== false && config.aspectRatio === '9:16')
  );
  const titleCardDurationInFrames = isTitleCardActive
    ? Math.max(1, Math.round((config.titleCardDurationSeconds || 3.5) * fps))
    : 0;

  const isOutroActive = Boolean(
    config.enableOutroVideo &&
    (config.outroMode === 'custom-video' ? config.outroVideoPath : true) &&
    !(config.skipOutroForShorts !== false && config.aspectRatio === '9:16')
  );
  const outroDurationInFrames = isOutroActive
    ? Math.max(1, Math.round((config.outroVideoDurationSeconds || 4.5) * fps))
    : 0;

  const preScriptureFrames = introDurationInFrames + titleCardDurationInFrames;
  const nonScriptureFrames = introDurationInFrames + titleCardDurationInFrames + outroDurationInFrames;
  const recitationFrames = Math.max(1, totalDurationInFrames - nonScriptureFrames);
  const outroStartFrame = preScriptureFrames + recitationFrames;

  // Precalculate start frame and duration for each ayah in sequence
  const ayahTimeMap = useMemo(() => {
    let currentStart = preScriptureFrames;
    return ayahs.map((ayah) => {
      const startFrame = currentStart;
      const endFrame = startFrame + ayah.durationInFrames;
      currentStart = endFrame;
      return {
        ayah,
        startFrame,
        endFrame,
      };
    });
  }, [ayahs, preScriptureFrames]);

  // Calculate normalized percentages, duration, and Ayah verse coverage for each clip
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

      const durationSec = Number(((percent / 100) * (recitationFrames / fps)).toFixed(1));

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

      // Calculate which ayahs this clip spans in the audio timeline
      const clipStartRecitation = (startPercent / 100) * recitationFrames;
      const clipEndRecitation = ((startPercent + percent) / 100) * recitationFrames;
      const clipStartTotal = preScriptureFrames + clipStartRecitation;
      const clipEndTotal = preScriptureFrames + clipEndRecitation;

      const overlapping = ayahTimeMap.filter((item) => {
        return item.endFrame > clipStartTotal && item.startFrame < clipEndTotal;
      });

      const firstAyah = overlapping[0]?.ayah;
      const lastAyah = overlapping[overlapping.length - 1]?.ayah;
      const ayahRangeLabel = firstAyah && lastAyah
        ? (firstAyah.ayah === lastAyah.ayah
            ? (firstAyah.ayah === 0 ? 'Bism.' : `v.${firstAyah.ayah}`)
            : (firstAyah.ayah === 0 ? `Bism.–v.${lastAyah.ayah}` : `v.${firstAyah.ayah}–v.${lastAyah.ayah}`))
        : '';

      return {
        clip,
        percent,
        startPercent,
        durationSec,
        displaySpeed,
        isAutoSlowed,
        isVideo,
        ayahRangeLabel,
        overlappingAyahs: overlapping,
        clipStartTotal,
        clipEndTotal,
      };
    });
  }, [clips, recitationFrames, preScriptureFrames, fps, ayahTimeMap]);

  // Selected clip object for inspector
  const selectedClip = clips.find((c) => c.id === selectedClipId) || null;
  const selectedLayout = clipLayouts.find((l) => l.clip.id === selectedClipId) || null;

  // Selected ayah object for inspector
  const selectedAyah = useMemo(() => {
    return ayahs.find((a) => a.ayah === selectedAyahNumber) || null;
  }, [ayahs, selectedAyahNumber]);

  const ayahOverride = useMemo(() => {
    if (!selectedAyah) return undefined;
    return config.ayahFontOverrides?.[`${selectedAyah.surah}:${selectedAyah.ayah}`];
  }, [selectedAyah, config.ayahFontOverrides]);

  const computedSizes = useMemo(() => {
    return computeAdaptiveFontSizes(config, selectedAyah, ayahOverride);
  }, [config, selectedAyah, ayahOverride]);

  const currentArabicSize = computedSizes.arabicFontSize;
  const currentEnglishSize = computedSizes.secondaryFontSize;
  const currentSubtitleSize = computedSizes.primaryFontSize;
  const currentVerticalOffset = ayahOverride?.verticalOffset ?? config.verticalCustomOffset ?? 0;
  const currentAnimationIn = ayahOverride?.animationIn ?? 'inherit';
  const currentAnimationOut = ayahOverride?.animationOut ?? 'inherit';
  const hasAyahOverride =
    ayahOverride !== undefined &&
    (ayahOverride.arabicFontSize !== undefined ||
      ayahOverride.secondaryFontSize !== undefined ||
      ayahOverride.primaryFontSize !== undefined ||
      ayahOverride.verticalOffset !== undefined ||
      ayahOverride.verticalAlignment !== undefined ||
      ayahOverride.animationIn !== undefined ||
      ayahOverride.animationOut !== undefined);

  // Global mouse handlers for playhead scrubber dragging
  const handleSeekToClientX = useCallback(
    (clientX: number) => {
      if (!timelineTrackRef.current) return;
      const rect = timelineTrackRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const clickX = clientX - rect.left;
      const progress = Math.max(0, Math.min(1, clickX / rect.width));
      const targetFrame = Math.round(progress * totalDurationInFrames);

      setCurrentFrame(targetFrame);
      playerRef.current?.seekTo(targetFrame);
    },
    [totalDurationInFrames, setCurrentFrame, playerRef]
  );

  useEffect(() => {
    if (!isScrubbing) return;

    const onMouseMove = (e: MouseEvent) => {
      handleSeekToClientX(e.clientX);
    };

    const onMouseUp = () => {
      setIsScrubbing(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isScrubbing, handleSeekToClientX]);

  // Global mouse listeners for clip divider resizing
  useEffect(() => {
    if (draggingDividerIndex === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !timelineTrackRef.current) return;
      const trackWidth = timelineTrackRef.current.clientWidth;
      if (trackWidth <= 0) return;

      const dx = e.clientX - dragStartRef.current.startX;
      const recitationWidth =
        totalDurationInFrames > 0
          ? trackWidth * (recitationFrames / totalDurationInFrames)
          : trackWidth;
      const deltaPct = (dx / Math.max(1, recitationWidth)) * 100;

      const { leftId, rightId, leftStartPct, rightStartPct } = dragStartRef.current;
      const minPct = 2.0;
      const combined = leftStartPct + rightStartPct;

      let newLeft = Math.max(minPct, Math.min(combined - minPct, leftStartPct + deltaPct));

      // Magnetic Snapping to Ayah boundaries:
      if (ayahs && ayahs.length > 0) {
        const leftIndex = clips.findIndex((c) => c.id === leftId);
        let leftClipStartPct = 0;
        for (let i = 0; i < leftIndex; i++) {
          leftClipStartPct += clipLayouts[i]?.percent || 0;
        }
        const dividerRecitationFrame = ((leftClipStartPct + newLeft) / 100) * recitationFrames;

        for (const item of ayahTimeMap) {
          const ayahEndRecitationFrame = item.endFrame - preScriptureFrames;
          const diffFrames = Math.abs(dividerRecitationFrame - ayahEndRecitationFrame);
          // Snap threshold: ~20 frames (~0.7s)
          if (diffFrames < 20) {
            const snappedLeftPct = (ayahEndRecitationFrame / recitationFrames) * 100 - leftClipStartPct;
            if (snappedLeftPct >= minPct && snappedLeftPct <= combined - minPct) {
              newLeft = snappedLeftPct;
              break;
            }
          }
        }
      }

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
  }, [
    draggingDividerIndex,
    updateBackgroundClip,
    totalDurationInFrames,
    recitationFrames,
    preScriptureFrames,
    ayahs,
    clips,
    clipLayouts,
    ayahTimeMap,
  ]);

  // Format timecode (e.g. 01:23.4)
  const formatTime = (frame: number): string => {
    const totalSec = frame / fps;
    const mins = Math.floor(totalSec / 60);
    const secs = (totalSec % 60).toFixed(1);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(4, '0')}`;
  };

  // Toggle playback
  const handleTogglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (player.isPlaying()) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  }, [playerRef, setIsPlaying]);

  // Keyboard shortcut listeners (Space: play/pause, Left/Right: step frame)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const prev = Math.max(0, currentFrame - (e.shiftKey ? fps : 1));
        setCurrentFrame(prev);
        playerRef.current?.seekTo(prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        const next = Math.min(totalDurationInFrames, currentFrame + (e.shiftKey ? fps : 1));
        setCurrentFrame(next);
        playerRef.current?.seekTo(next);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleTogglePlay, currentFrame, totalDurationInFrames, fps, setCurrentFrame, playerRef]);

  // Add new media (supports single or multiple file selections at once)
  const handleAddMedia = async (type: 'video' | 'image') => {
    const api = window.electronAPI;
    if (!api) return;
    const filePaths = await api.selectMediaFiles(type);
    if (!filePaths || filePaths.length === 0) return;

    const baseTransitionIdx = clips.length;
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

      // Cycle transitions so subsequent clips have distinct cinematic animations
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
        kenBurns: true,
        transition: assignedTransition,
        transitionDurationFrames: 24,
      });
    }

    await addBackgroundClips(newClipItems);
  };

  // Replace / Swap media on an existing clip
  const handleReplaceMedia = async (clipId: string, type: 'video' | 'image') => {
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
    updateBackgroundClip(clipId, {
      type,
      source: filePath,
      name: fileName,
      sourceDurationSeconds,
      trimStartSeconds: 0,
    });
    setShowSwapMenu(false);
  };

  // Calculate current playhead percentage
  const playheadPercent = Math.min(100, Math.max(0, (currentFrame / Math.max(1, totalDurationInFrames)) * 100));

  // Horizontal mouse wheel scrolling for the timeline track
  const handleWheelScroll = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.currentTarget) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && !e.ctrlKey) {
        e.currentTarget.scrollLeft += e.deltaY;
      }
    }
  }, []);

  // Playback Auto-Scroll: keep playhead visible in timeline viewport during playback
  useEffect(() => {
    if (!isPlaying || !timelineScrollRef.current || !timelineTrackRef.current) return;
    const scrollContainer = timelineScrollRef.current;
    const track = timelineTrackRef.current;
    const playheadPx = (playheadPercent / 100) * track.clientWidth;
    const visibleLeft = scrollContainer.scrollLeft;
    const visibleRight = visibleLeft + scrollContainer.clientWidth;

    if (playheadPx > visibleRight - 80 || playheadPx < visibleLeft) {
      scrollContainer.scrollLeft = Math.max(0, playheadPx - 100);
    }
  }, [isPlaying, currentFrame, playheadPercent]);

  // Evenly distribute all background clips across whole Ayah verse boundaries
  const handleMatchClipsToAyahsEvenly = useCallback(() => {
    if (!clips || clips.length === 0 || !ayahs || ayahs.length === 0) return;
    const totalClips = clips.length;
    const totalAyahs = ayahs.length;

    const ayahsPerClip = totalAyahs / totalClips;
    const updatedClips = clips.map((clip, idx) => {
      const fromIdx = Math.floor(idx * ayahsPerClip);
      const toIdx = idx === totalClips - 1 ? totalAyahs - 1 : Math.floor((idx + 1) * ayahsPerClip) - 1;

      const bucketAyahs = ayahs.slice(fromIdx, toIdx + 1);
      const bucketFrames = bucketAyahs.reduce((sum, a) => sum + a.durationInFrames, 0);
      const pct = Number(((bucketFrames / recitationFrames) * 100).toFixed(2));

      return {
        ...clip,
        percentage: Math.max(2, pct),
        durationRatio: Number((pct / 100).toFixed(4)),
      };
    });

    const sum = updatedClips.reduce((s, c) => s + (c.percentage || 0), 0);
    const diff = 100 - sum;
    if (Math.abs(diff) > 0.001 && updatedClips.length > 0) {
      const last = updatedClips[updatedClips.length - 1];
      last.percentage = Number((last.percentage! + diff).toFixed(2));
      last.durationRatio = Number((last.percentage! / 100).toFixed(4));
    }

    updateConfig({ backgroundClips: updatedClips });
  }, [clips, ayahs, recitationFrames, updateConfig]);

  // Snap a single selected clip to nearest Ayah verse boundaries
  const handleSnapClipToNearestAyahs = useCallback(
    (clipId: string) => {
      const layout = clipLayouts.find((l) => l.clip.id === clipId);
      if (!layout || !ayahTimeMap.length) return;

      let bestStartFrame = ayahTimeMap[0].startFrame;
      let minStartDiff = Math.abs(layout.clipStartTotal - bestStartFrame);
      for (const item of ayahTimeMap) {
        const diff = Math.abs(layout.clipStartTotal - item.startFrame);
        if (diff < minStartDiff) {
          minStartDiff = diff;
          bestStartFrame = item.startFrame;
        }
      }

      let bestEndFrame = ayahTimeMap[ayahTimeMap.length - 1].endFrame;
      let minEndDiff = Math.abs(layout.clipEndTotal - bestEndFrame);
      for (const item of ayahTimeMap) {
        const diff = Math.abs(layout.clipEndTotal - item.endFrame);
        if (diff < minEndDiff) {
          minEndDiff = diff;
          bestEndFrame = item.endFrame;
        }
      }

      if (bestEndFrame <= bestStartFrame) {
        bestEndFrame = bestStartFrame + 30;
      }

      const snappedDuration = bestEndFrame - bestStartFrame;
      const newPct = Math.max(2, Number(((snappedDuration / recitationFrames) * 100).toFixed(2)));
      updateClipPercentage(clipId, newPct);
    },
    [clipLayouts, ayahTimeMap, recitationFrames, updateClipPercentage]
  );

  // Time ruler tick intervals scaled dynamically by zoom level
  const totalSeconds = totalDurationInFrames / fps;
  const timeTicks = useMemo(() => {
    const baseCount = 6;
    const count = Math.max(baseCount, Math.min(80, Math.round(baseCount * zoomLevel)));
    return Array.from({ length: count + 1 }, (_, i) => {
      const sec = (i / count) * totalSeconds;
      const mins = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return {
        percent: (i / count) * 100,
        label: `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
      };
    });
  }, [totalSeconds, zoomLevel]);

  return (
    <div className="w-full flex-shrink-0 bg-gray-950/95 border-t border-gray-800/90 rounded-2xl p-3 shadow-2xl flex flex-col gap-2.5 backdrop-blur-md select-none mt-2 relative z-20">
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

        {/* Center / Right Actions: Zoom & Media Alignment & Add Media */}
        <div className="flex items-center gap-2.5">
          {/* Timeline Zoom Controls */}
          <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 px-2 py-1 rounded-lg text-xs shadow-inner">
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, Number((z - 0.5).toFixed(1))))}
              disabled={zoomLevel <= 1}
              className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="w-20 accent-amber-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
              title={`Timeline Zoom: ${zoomLevel}×`}
            />
            <button
              onClick={() => setZoomLevel((z) => Math.min(10, Number((z + 0.5).toFixed(1))))}
              disabled={zoomLevel >= 10}
              className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                zoomLevel === 1
                  ? 'bg-amber-500/25 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title="Fit entire timeline into window (100%)"
            >
              Fit
            </button>
            <span className="font-mono text-amber-300 text-[10px] min-w-[28px] text-right font-medium">
              {zoomLevel.toFixed(1)}×
            </span>
          </div>

          {/* Match All Media to Verses Button */}
          <button
            onClick={handleMatchClipsToAyahsEvenly}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 transition text-[11px] font-medium shadow-sm"
            title="Automatically align all background clips evenly to verse boundaries"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Match Media to Verses</span>
          </button>

          {/* Add Video / Image Buttons */}
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
      <div className="relative w-full rounded-xl bg-gray-900/90 border border-gray-800/80 p-2 flex gap-2.5">
        {/* Left Track Headers / Labels Column */}
        <div className="w-11 flex-shrink-0 flex flex-col gap-1.5 select-none text-[10px] font-mono text-gray-400">
          {/* Ruler Label */}
          <div className="h-4 flex items-center font-semibold text-gray-500 text-[9px]">
            Ruler:
          </div>
          {/* Ayahs Track Label */}
          <div className="h-7 flex items-center font-semibold text-gray-400">
            Ayahs:
          </div>
          {/* Media Track Label */}
          <div className="h-12 flex items-center font-semibold text-gray-400">
            Media:
          </div>
        </div>

        {/* Right Scrollable Timeline Viewport */}
        <div
          ref={timelineScrollRef}
          onWheel={handleWheelScroll}
          className="flex-1 relative overflow-x-auto overflow-y-hidden rounded-lg min-w-0 pb-1 scrollbar-thin scrollbar-thumb-gray-700/80 scrollbar-track-gray-950/80"
        >
          {/* Inner Scalable / Zoomed Timeline Canvas */}
          <div
            ref={timelineTrackRef}
            style={{ width: `${zoomLevel * 100}%`, minWidth: '100%' }}
            className="relative flex flex-col gap-1.5 min-w-full"
          >
            {/* TOP TIME RULER & SCRUBBER BAR: Dedicated scrubbing region */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsScrubbing(true);
                handleSeekToClientX(e.clientX);
              }}
              className="h-4 w-full relative bg-gray-950/80 rounded border border-gray-800/60 cursor-ew-resize flex items-center justify-between px-1 text-[9px] font-mono text-gray-500 overflow-hidden"
              title="Click or drag anywhere on ruler to scrub timeline"
            >
              {timeTicks.map((tick, i) => (
                <span
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${tick.percent}%`,
                    transform: i === 0 ? 'none' : i === timeTicks.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
                  }}
                  className="select-none pointer-events-none whitespace-nowrap"
                >
                  {tick.label}
                </span>
              ))}
            </div>

            {/* Playhead Needle Bar & Draggable Scrubber */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-amber-400 shadow-[0_0_12px_#f59e0b] z-40 cursor-ew-resize select-none pointer-events-auto"
              style={{ left: `${playheadPercent}%` }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsScrubbing(true);
              }}
            >
              {/* Draggable Scrubber Top Handle in Ruler */}
              <div
                className="w-4 h-4 bg-amber-400 hover:bg-amber-300 transform -translate-x-[7px] -translate-y-0.5 rounded-sm shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center hover:scale-125 transition-transform"
                title="Drag to scrub timeline"
              >
                <div className="w-1 h-2 bg-black/60 rounded-full" />
              </div>
            </div>

            {/* Track A: Ayahs / Scripture Audio Track */}
            <div className="h-7 w-full flex relative rounded-md overflow-hidden bg-gray-950/80 border border-gray-800/80">
              {isIntroActive && (
                <div
                  style={{ width: `${(introDurationInFrames / Math.max(1, totalDurationInFrames)) * 100}%` }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setCurrentFrame(0);
                    playerRef.current?.seekTo(0);
                    setSelectedAyahNumber(null);
                    setSelectedClipId(null);
                  }}
                  className="h-full border-r border-black/50 px-1.5 flex items-center justify-between text-[10px] font-mono truncate cursor-pointer transition select-none bg-purple-500/25 hover:bg-purple-500/35 border-purple-500/40 text-purple-200 flex-shrink-0"
                  title={`Intro Bumper (${(introDurationInFrames / fps).toFixed(1)}s) - Click to seek to start`}
                >
                  <span className="truncate font-semibold flex items-center gap-1">
                    <Film className="w-2.5 h-2.5 text-purple-400" />
                    <span>Intro</span>
                  </span>
                  <span className="text-[9px] text-purple-300/80 hidden sm:inline">
                    {(introDurationInFrames / fps).toFixed(1)}s
                  </span>
                </div>
              )}
              {isTitleCardActive && (
                <div
                  style={{ width: `${(titleCardDurationInFrames / Math.max(1, totalDurationInFrames)) * 100}%` }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setCurrentFrame(introDurationInFrames);
                    playerRef.current?.seekTo(introDurationInFrames);
                    setSelectedAyahNumber(null);
                    setSelectedClipId(null);
                  }}
                  className="h-full border-r border-black/50 px-1.5 flex items-center justify-between text-[10px] font-mono truncate cursor-pointer transition select-none bg-amber-500/25 hover:bg-amber-500/35 border-amber-500/40 text-amber-200 flex-shrink-0"
                  title={`Surah Title Screen (${(titleCardDurationInFrames / fps).toFixed(1)}s) - Click to seek`}
                >
                  <span className="truncate font-semibold flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    <span>Title Screen</span>
                  </span>
                  <span className="text-[9px] text-amber-300/80 hidden sm:inline">
                    {(titleCardDurationInFrames / fps).toFixed(1)}s
                  </span>
                </div>
              )}
              {ayahs.map((ayah, index) => {
                const ayahPercent = (ayah.durationInFrames / Math.max(1, totalDurationInFrames)) * 100;
                const isAyahSelected = selectedAyahNumber === ayah.ayah;
                const ayahKey = `${ayah.surah}:${ayah.ayah}`;
                const hasOverride = config.ayahFontOverrides?.[ayahKey] !== undefined;

                return (
                  <div
                    key={ayahKey}
                    style={{ width: `${ayahPercent}%` }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      let startFrame = preScriptureFrames;
                      for (let k = 0; k < index; k++) {
                        startFrame += ayahs[k].durationInFrames;
                      }
                      setCurrentFrame(startFrame);
                      playerRef.current?.seekTo(startFrame);
                      setSelectedAyahNumber(ayah.ayah);
                      setSelectedClipId(null);
                    }}
                    className={`h-full border-r border-black/40 last:border-r-0 px-1 flex items-center justify-between text-[10px] font-mono truncate cursor-pointer transition select-none ${
                      isAyahSelected
                        ? 'bg-amber-500/40 text-amber-200 ring-2 ring-inset ring-amber-400 z-10 shadow-[0_0_8px_rgba(245,158,11,0.5)] font-bold'
                        : hasOverride
                        ? 'bg-amber-500/25 hover:bg-amber-500/35 text-amber-300'
                        : 'bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200'
                    }`}
                    title={
                      ayah.ayah === 0
                        ? `Bismillah (${(ayah.durationInFrames / fps).toFixed(1)}s) - Click to inspect styling`
                        : `Verse ${ayah.ayah} (${(ayah.durationInFrames / fps).toFixed(1)}s) - Click to inspect styling`
                    }
                  >
                    <span className="truncate font-semibold flex items-center gap-1 min-w-0">
                      <span>{ayah.ayah === 0 ? 'Bism.' : `v.${ayah.ayah}`}</span>
                      {hasOverride && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" title="Custom styling set" />
                      )}
                    </span>
                    <span className="text-[9px] text-amber-400/70 hidden sm:inline ml-1 font-mono flex-shrink-0">
                      {(ayah.durationInFrames / fps).toFixed(1)}s
                    </span>
                  </div>
                );
              })}
              {isOutroActive && (
                <div
                  style={{ width: `${(outroDurationInFrames / Math.max(1, totalDurationInFrames)) * 100}%` }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setCurrentFrame(outroStartFrame);
                    playerRef.current?.seekTo(outroStartFrame);
                    setSelectedAyahNumber(null);
                    setSelectedClipId(null);
                  }}
                  className="h-full border-l border-black/50 px-1.5 flex items-center justify-between text-[10px] font-mono truncate cursor-pointer transition select-none bg-emerald-500/25 hover:bg-emerald-500/35 border-emerald-500/40 text-emerald-200 flex-shrink-0"
                  title={`Outro Video Bumper (${(outroDurationInFrames / fps).toFixed(1)}s) - Click to seek to outro`}
                >
                  <span className="truncate font-semibold flex items-center gap-1">
                    <Film className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Outro</span>
                  </span>
                  <span className="text-[9px] text-emerald-300/80 hidden sm:inline">
                    {(outroDurationInFrames / fps).toFixed(1)}s
                  </span>
                </div>
              )}
            </div>

            {/* Track B: Multi-Media Background Sequence Track */}
            <div className="h-12 w-full flex relative rounded-lg overflow-hidden bg-gray-950/80 border border-gray-800/80">
              {isIntroActive && (
                <div
                  style={{ width: `${(introDurationInFrames / Math.max(1, totalDurationInFrames)) * 100}%` }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setCurrentFrame(0);
                    playerRef.current?.seekTo(0);
                    setSelectedClipId(null);
                    setSelectedAyahNumber(null);
                  }}
                  className="h-full relative border-r border-purple-500/40 bg-purple-950/50 hover:bg-purple-900/60 cursor-pointer transition-all flex items-center justify-between px-2 text-[10px] select-none flex-shrink-0"
                  title={`Channel Intro Video Bumper (${(introDurationInFrames / fps).toFixed(1)}s) - Click to seek to start`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Film className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <span className="truncate font-medium text-purple-200">Intro Video</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="font-mono text-purple-400/80 text-[10px]">
                      {(introDurationInFrames / fps).toFixed(1)}s
                    </span>
                  </div>
                </div>
              )}
              {isTitleCardActive && (
                <div
                  style={{ width: `${(titleCardDurationInFrames / Math.max(1, totalDurationInFrames)) * 100}%` }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setCurrentFrame(introDurationInFrames);
                    playerRef.current?.seekTo(introDurationInFrames);
                    setSelectedClipId(null);
                    setSelectedAyahNumber(null);
                  }}
                  className="h-full relative border-r border-amber-500/40 bg-amber-950/50 hover:bg-amber-900/60 cursor-pointer transition-all flex items-center justify-between px-2 text-[10px] select-none flex-shrink-0"
                  title={`Surah Title Screen (${(titleCardDurationInFrames / fps).toFixed(1)}s) - Click to seek`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="truncate font-medium text-amber-200">Title Screen</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="font-mono text-amber-400/80 text-[10px]">
                      {(titleCardDurationInFrames / fps).toFixed(1)}s
                    </span>
                  </div>
                </div>
              )}
              {clipLayouts.map(
                ({ clip, percent, durationSec, displaySpeed, isAutoSlowed, isVideo, ayahRangeLabel }, index) => {
                  const isSelected = clip.id === selectedClipId;
                  const nextLayout = clipLayouts[index + 1];
                  const displayWidthPercent =
                    (percent * recitationFrames) / Math.max(1, totalDurationInFrames);

                  return (
                    <div
                      key={clip.id}
                      style={{ width: `${displayWidthPercent}%` }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedClipId(clip.id);
                        setSelectedAyahNumber(null);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClipId(clip.id);
                        setSelectedAyahNumber(null);
                      }}
                      className={`h-full relative border-r border-black/50 last:border-r-0 cursor-pointer transition-all flex items-center justify-between px-2 text-[10px] ${
                        isSelected
                          ? 'bg-amber-500/25 ring-2 ring-inset ring-amber-400 z-10 shadow-lg'
                          : 'bg-gray-900/90 hover:bg-gray-800/90 text-gray-300 hover:text-white'
                      }`}
                      title={`Click to select ${clip.name} (Covers ${ayahRangeLabel || 'verses'})`}
                    >
                      {/* Clip Thumbnail / Icon & Ayah Coverage Badge */}
                      <div className="flex items-center gap-1.5 truncate min-w-0">
                        {isVideo ? (
                          <Film className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        )}
                        <span className="truncate font-medium text-gray-200">{clip.name}</span>
                        {ayahRangeLabel && (
                          <span
                            className="bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded font-mono text-[9px] border border-amber-500/30 flex-shrink-0 font-semibold"
                            title={`Covers ${ayahRangeLabel}`}
                          >
                            {ayahRangeLabel}
                          </span>
                        )}
                      </div>

                      {/* Clip Meta Info */}
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                        {isVideo && (
                          <span
                            className={`font-mono text-[9px] px-1 py-0.5 rounded border ${
                              isAutoSlowed
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-gray-800 text-gray-400 border-gray-700'
                            }`}
                            title={isAutoSlowed ? 'Auto-slowed to fit slot without repeating' : 'Manual speed'}
                          >
                            {displaySpeed}
                          </span>
                        )}
                        <span className="font-mono text-gray-400 text-[9px]">{durationSec}s</span>
                      </div>

                      {/* Transition Badge between adjacent clips */}
                      {index > 0 && (
                        <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 z-30">
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowTransitionMenu(showTransitionMenu === clip.id ? null : clip.id);
                            }}
                            className={`px-2 py-0.5 rounded-full border shadow-lg flex items-center gap-1 text-[9px] font-medium transition cursor-pointer backdrop-blur-md hover:scale-105 active:scale-95 whitespace-nowrap ${
                              TRANSITION_COLORS[clip.transition || 'crossfade']?.bg || 'bg-amber-500/20'
                            } ${TRANSITION_COLORS[clip.transition || 'crossfade']?.text || 'text-amber-400'} ${
                              TRANSITION_COLORS[clip.transition || 'crossfade']?.border || 'border-amber-500/60'
                            }`}
                            title={`Click to change transition: ${TRANSITION_LABELS[clip.transition || 'crossfade']}`}
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span className="font-mono font-semibold">{TRANSITION_LABELS[clip.transition || 'crossfade']}</span>
                          </button>

                          {/* Transition Picker Menu */}
                          {showTransitionMenu === clip.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setShowTransitionMenu(null);
                                }}
                              />

                              <div
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                                className={`absolute bottom-full mb-2 w-52 bg-gray-900/98 backdrop-blur-xl border border-gray-700/80 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-2 z-50 text-xs ${
                                  index === 1 ? 'left-0' : index === clips.length - 1 && clips.length > 2 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                                }`}
                              >
                                <div className="flex justify-between items-center pb-1.5 mb-1.5 border-b border-gray-800 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                                    <Sparkles className="w-3 h-3" />
                                    Transition Effect
                                  </span>
                                  <button
                                    onClick={() => setShowTransitionMenu(null)}
                                    className="p-0.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="space-y-1 max-h-60 overflow-y-auto">
                                  {(Object.keys(TRANSITION_LABELS) as TransitionType[]).map((t) => {
                                    const isCurrent = (clip.transition || 'crossfade') === t;
                                    const col = TRANSITION_COLORS[t];
                                    return (
                                      <button
                                        key={t}
                                        onClick={() => {
                                          updateBackgroundClip(clip.id, { transition: t });
                                          setShowTransitionMenu(null);
                                        }}
                                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] flex items-center justify-between transition cursor-pointer ${
                                          isCurrent
                                            ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold shadow-sm'
                                            : 'hover:bg-gray-800 text-gray-300'
                                        }`}
                                      >
                                        <span>{TRANSITION_LABELS[t]}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${col.bg} ${col.text} ${col.border}`}>
                                          {t}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          )}
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
                          title="Drag boundary to adjust time split between clips (Magnetic snap to verses)"
                        >
                          <div className="w-1 h-4 rounded-full bg-gray-600 group-hover:bg-amber-400 group-hover:h-6 transition-all" />
                        </div>
                      )}
                    </div>
                  );
                }
              )}
              {isOutroActive && (
                <div
                  style={{ width: `${(outroDurationInFrames / Math.max(1, totalDurationInFrames)) * 100}%` }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setCurrentFrame(outroStartFrame);
                    playerRef.current?.seekTo(outroStartFrame);
                    setSelectedClipId(null);
                    setSelectedAyahNumber(null);
                  }}
                  className="h-full relative border-l border-emerald-500/40 bg-emerald-950/50 hover:bg-emerald-900/60 cursor-pointer transition-all flex items-center justify-between px-2 text-[10px] select-none flex-shrink-0"
                  title={`Channel Outro Video Bumper (${(outroDurationInFrames / fps).toFixed(1)}s) - Click to seek to outro`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Film className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="truncate font-medium text-emerald-200">Outro Video</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="font-mono text-emerald-400/80 text-[10px]">
                      {(outroDurationInFrames / fps).toFixed(1)}s
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Selected Clip Inspector Bar: Appears when a clip is selected */}
      {selectedClip && selectedLayout && (
        <div className="p-3 rounded-xl bg-gray-900 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in shadow-xl">
          <div className="flex flex-wrap items-center gap-3">
            {/* Clip Identifier */}
            <div className="flex items-center gap-1.5 font-semibold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
              {selectedLayout.isVideo ? <Film className="w-4 h-4" /> : <ImageIcon className="w-4 h-4 text-emerald-400" />}
              <span className="truncate max-w-[140px]" title={selectedClip.name}>
                {selectedClip.name}
              </span>
            </div>

            {/* Ayah Verse Coverage Badge */}
            {selectedLayout.ayahRangeLabel && (
              <div className="flex items-center gap-1.5 font-mono text-[11px] bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg text-amber-300">
                <span className="text-gray-400">Verses:</span>
                <span className="font-bold text-amber-300">{selectedLayout.ayahRangeLabel}</span>
              </div>
            )}

            {/* Snap to Verses Button */}
            <button
              onClick={() => handleSnapClipToNearestAyahs(selectedClip.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 transition text-[11px] border border-amber-500/30 font-medium"
              title="Snap this clip's start and end to the nearest verse boundaries"
            >
              <Magnet className="w-3.5 h-3.5 text-amber-400" />
              <span>Snap to Verses</span>
            </button>

            {/* Swap / Replace Media Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setShowSwapMenu(!showSwapMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white transition text-[11px] border border-gray-700 shadow-sm"
                title="Replace or swap this file with a different video or image"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Swap File</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {showSwapMenu && (
                <div className="absolute left-0 bottom-full mb-1.5 w-44 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl py-1 z-50 text-xs">
                  <button
                    onClick={() => handleReplaceMedia(selectedClip.id, 'video')}
                    className="w-full text-left px-3 py-1.5 text-gray-200 hover:bg-gray-800 hover:text-white flex items-center gap-2 transition"
                  >
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    <span>Replace with Video</span>
                  </button>
                  <button
                    onClick={() => handleReplaceMedia(selectedClip.id, 'image')}
                    className="w-full text-left px-3 py-1.5 text-gray-200 hover:bg-gray-800 hover:text-white flex items-center gap-2 transition"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Replace with Image</span>
                  </button>
                </div>
              )}
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
              <div className="flex items-center gap-1.5 text-[11px] bg-gray-950 px-2.5 py-1.5 rounded-lg border border-gray-800">
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

            {/* Per-Clip Transition In Selector */}
            {clips.indexOf(selectedClip) > 0 && (
              <div className="flex items-center gap-2 bg-gray-950 px-2.5 py-1.5 rounded-lg border border-gray-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-gray-400 text-[11px]">Transition In:</span>
                <select
                  value={selectedClip.transition || 'crossfade'}
                  onChange={(e) =>
                    updateBackgroundClip(selectedClip.id, {
                      transition: e.target.value as TransitionType,
                    })
                  }
                  className="bg-gray-900 border border-gray-700 rounded px-2 py-0.5 text-amber-400 text-[11px] font-medium focus:ring-1 focus:ring-amber-400 focus:outline-none cursor-pointer"
                >
                  {(Object.keys(TRANSITION_LABELS) as TransitionType[]).map((t) => (
                    <option key={t} value={t}>
                      {TRANSITION_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Reorder, Delete, Close Controls */}
          <div className="flex items-center gap-2">
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

            {/* Delete Clip Action */}
            <button
              onClick={() => {
                removeBackgroundClip(selectedClip.id);
                setSelectedClipId(null);
              }}
              disabled={clips.length <= 1}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition text-[11px] border ${
                clips.length > 1
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30 cursor-pointer'
                  : 'bg-gray-800/40 text-gray-600 border-gray-800 cursor-not-allowed'
              }`}
              title={clips.length > 1 ? 'Delete this clip from timeline' : 'At least one background clip is required'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            {/* Close Inspector */}
            <button
              onClick={() => setSelectedClipId(null)}
              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition"
              title="Close Inspector"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3b. Selected Ayah Typography Inspector Bar: Appears when an Ayah is selected in Track A */}
      {selectedAyah && !selectedClip && (
        <div className="p-3 rounded-xl bg-gray-900 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in shadow-xl">
          <div className="flex flex-wrap items-center gap-3">
            {/* Verse Identifier */}
            <div className="flex items-center gap-1.5 font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
              <Type className="w-4 h-4 text-amber-400" />
              <span>{selectedAyah.ayah === 0 ? 'Bismillah' : `Verse ${selectedAyah.ayah}`} Styling</span>
              {hasAyahOverride && (
                <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded font-normal">
                  Custom
                </span>
              )}
            </div>

            {/* Arabic Font Size (10-100) */}
            <div className="flex items-center gap-2 bg-gray-950 px-2.5 py-1.5 rounded-lg border border-gray-800">
              <span className="text-gray-400 text-[11px] font-medium">Arabic:</span>
              <input
                type="range"
                min="10"
                max="100"
                value={currentArabicSize}
                onChange={(e) =>
                  updateAyahFontOverride(selectedAyah.surah, selectedAyah.ayah, {
                    arabicFontSize: Number(e.target.value),
                  })
                }
                className="w-20 accent-amber-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
              />
              <input
                type="number"
                min="10"
                max="100"
                value={currentArabicSize}
                onChange={(e) =>
                  updateAyahFontOverride(selectedAyah.surah, selectedAyah.ayah, {
                    arabicFontSize: Math.max(10, Math.min(100, Number(e.target.value) || 10)),
                  })
                }
                className="w-12 bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-[11px] text-amber-400 font-mono text-center"
              />
              <span className="text-gray-500 text-[10px]">px</span>
            </div>

            {/* English Font Size (10-100) */}
            <div className="flex items-center gap-2 bg-gray-950 px-2.5 py-1.5 rounded-lg border border-gray-800">
              <span className="text-gray-400 text-[11px] font-medium">English:</span>
              <input
                type="range"
                min="10"
                max="100"
                value={currentEnglishSize}
                onChange={(e) =>
                  updateAyahFontOverride(selectedAyah.surah, selectedAyah.ayah, {
                    secondaryFontSize: Number(e.target.value),
                  })
                }
                className="w-20 accent-sky-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
              />
              <input
                type="number"
                min="10"
                max="100"
                value={currentEnglishSize}
                onChange={(e) =>
                  updateAyahFontOverride(selectedAyah.surah, selectedAyah.ayah, {
                    secondaryFontSize: Math.max(10, Math.min(100, Number(e.target.value) || 10)),
                  })
                }
                className="w-12 bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-[11px] text-sky-400 font-mono text-center"
              />
              <span className="text-gray-500 text-[10px]">px</span>
            </div>

            {/* Subtitle Font Size (10-100) */}
            <div className="flex items-center gap-2 bg-gray-950 px-2.5 py-1.5 rounded-lg border border-gray-800">
              <span className="text-gray-400 text-[11px] font-medium">Subtitle:</span>
              <input
                type="range"
                min="10"
                max="100"
                value={currentSubtitleSize}
                onChange={(e) =>
                  updateAyahFontOverride(selectedAyah.surah, selectedAyah.ayah, {
                    primaryFontSize: Number(e.target.value),
                  })
                }
                className="w-20 accent-purple-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
              />
              <input
                type="number"
                min="10"
                max="100"
                value={currentSubtitleSize}
                onChange={(e) =>
                  updateAyahFontOverride(selectedAyah.surah, selectedAyah.ayah, {
                    primaryFontSize: Math.max(10, Math.min(100, Number(e.target.value) || 10)),
                  })
                }
                className="w-12 bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-[11px] text-purple-400 font-mono text-center"
              />
              <span className="text-gray-500 text-[10px]">px</span>
            </div>

            {/* Vertical Nudge Offset */}
            <div className="flex items-center gap-2 bg-gray-950 px-2.5 py-1.5 rounded-lg border border-gray-800">
              <span className="text-gray-400 text-[11px] font-medium">Vertical:</span>
              <input
                type="range"
                min="-150"
                max="150"
                step="2"
                value={currentVerticalOffset}
                onChange={(e) =>
                  updateAyahFontOverride(selectedAyah.surah, selectedAyah.ayah, {
                    verticalOffset: Number(e.target.value),
                  })
                }
                className="w-16 accent-amber-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
              />
              <span className="font-mono text-[11px] text-amber-300 min-w-[38px] text-right">
                {currentVerticalOffset > 0 ? `+${currentVerticalOffset}` : currentVerticalOffset}px
              </span>
            </div>

            {/* Motion In Animation */}
            <div className="flex items-center gap-1.5 bg-gray-950 px-2.5 py-1.5 rounded-lg border border-gray-800">
              <span className="text-gray-400 text-[11px] font-medium">In:</span>
              <select
                value={currentAnimationIn}
                onChange={(e) =>
                  updateAyahFontOverride(selectedAyah.surah, selectedAyah.ayah, {
                    animationIn: e.target.value as TextAnimationIn | 'inherit',
                  })
                }
                className="bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-[11px] text-amber-300 cursor-pointer focus:outline-none"
              >
                <option value="inherit">Default ({config.animationIn || 'float-up'})</option>
                {TEXT_ANIMATION_IN_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Motion Out Animation */}
            <div className="flex items-center gap-1.5 bg-gray-950 px-2.5 py-1.5 rounded-lg border border-gray-800">
              <span className="text-gray-400 text-[11px] font-medium">Out:</span>
              <select
                value={currentAnimationOut}
                onChange={(e) =>
                  updateAyahFontOverride(selectedAyah.surah, selectedAyah.ayah, {
                    animationOut: e.target.value as TextAnimationOut | 'inherit',
                  })
                }
                className="bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-[11px] text-amber-300 cursor-pointer focus:outline-none"
              >
                <option value="inherit">Default ({config.animationOut || 'fade'})</option>
                {TEXT_ANIMATION_OUT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reset and Close */}
          <div className="flex items-center gap-2">
            {hasAyahOverride && (
              <button
                onClick={() => resetAyahFontOverride(selectedAyah.surah, selectedAyah.ayah)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition text-[11px] border border-gray-700"
                title={`Reset ${selectedAyah.ayah === 0 ? 'Bismillah' : 'this verse'} to global font size and animation defaults`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
                <span>Reset to Default</span>
              </button>
            )}

            <button
              onClick={() => setSelectedAyahNumber(null)}
              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition"
              title="Close Inspector"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
