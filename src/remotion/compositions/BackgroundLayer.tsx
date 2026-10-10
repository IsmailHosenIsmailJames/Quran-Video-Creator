import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, OffthreadVideo, Img, Sequence } from 'remotion';
import { BackgroundClip, TransitionType } from '../../shared/types';
import { getMediaUrl } from '../../shared/media-url';

interface BackgroundLayerProps {
  type: 'video' | 'image' | 'preset';
  source: string;
  clips?: BackgroundClip[];
  overlayOpacity: number;
  vignetteIntensity: number;
  kenBurnsEffect: boolean;
  totalDurationInFrames: number;
  fps?: number;
}

interface ClipItemProps {
  clip: BackgroundClip;
  durationInFrames: number;
  isFirst: boolean;
  fps: number;
  globalKenBurns: boolean;
}

const ClipItem: React.FC<ClipItemProps> = ({
  clip,
  durationInFrames,
  isFirst,
  fps,
  globalKenBurns,
}) => {
  const frame = useCurrentFrame();
  const mediaSrc = getMediaUrl(clip.source);

  const isVideo =
    clip.type === 'video' ||
    /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(clip.source) ||
    /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(mediaSrc);

  const transitionFrames = Math.max(
    1,
    Math.min(Math.floor(durationInFrames / 2), clip.transitionDurationFrames || 24)
  );

  const transition: TransitionType = isFirst ? 'cut' : clip.transition || 'crossfade';

  // Transition In Progress (0 to 1)
  const inProgress = transition === 'cut'
    ? 1
    : interpolate(frame, [0, transitionFrames], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  // Calculate transition styling
  let opacity = 1;
  let transform = '';
  let filter = 'brightness(0.9) contrast(1.05) saturate(0.92)';

  // Ken Burns subtle zoom for images
  const shouldKenBurns = clip.kenBurns !== undefined ? clip.kenBurns : globalKenBurns;
  const kbScale = (!isVideo && shouldKenBurns)
    ? interpolate(frame, [0, Math.max(1, durationInFrames)], [1.0, 1.08], {
        extrapolateRight: 'clamp',
      })
    : 1.0;

  switch (transition) {
    case 'zoom-fade': {
      opacity = inProgress;
      const zoomScale = interpolate(inProgress, [0, 1], [1.12, 1.0]);
      transform = `scale(${zoomScale * kbScale})`;
      break;
    }
    case 'blur-fade': {
      opacity = inProgress;
      const blurAmount = interpolate(inProgress, [0, 1], [14, 0]);
      filter += ` blur(${blurAmount}px)`;
      transform = `scale(${kbScale})`;
      break;
    }
    case 'slide-left': {
      opacity = inProgress;
      const translateX = interpolate(inProgress, [0, 1], [60, 0]);
      transform = `translateX(${translateX}px) scale(${kbScale})`;
      break;
    }
    case 'dip-black': {
      opacity = inProgress < 0.4 ? 0 : interpolate(inProgress, [0.4, 1], [0, 1]);
      transform = `scale(${kbScale})`;
      break;
    }
    case 'crossfade': {
      opacity = inProgress;
      transform = `scale(${kbScale})`;
      break;
    }
    case 'cut':
    default: {
      opacity = 1;
      transform = `scale(${kbScale})`;
      break;
    }
  }

  const startFromFrame = Math.max(0, Math.round((clip.trimStartSeconds || 0) * fps));
  const slotDurationSeconds = Math.max(0.1, durationInFrames / fps);

  // Deterministic playback rate calculated purely from clip props
  const naturalDuration = clip.sourceDurationSeconds;

  // Calculate playback rate:
  // If autoFitSpeed is enabled (default true) and slotDurationSeconds > available source duration,
  // slow down the video so it stretches across the entire slot without repeating.
  let effectivePlaybackRate = clip.speed && clip.speed > 0 ? clip.speed : 1.0;

  if (isVideo) {
    const trimStart = clip.trimStartSeconds || 0;
    let availableSource: number | undefined = undefined;

    if (naturalDuration && naturalDuration > trimStart) {
      availableSource = naturalDuration - trimStart;
      if (clip.trimEndSeconds && clip.trimEndSeconds > trimStart) {
        availableSource = Math.min(availableSource, clip.trimEndSeconds - trimStart);
      }
      availableSource = Math.max(0.1, availableSource);
    }

    const shouldAutoFit = clip.autoFitSpeed !== false;

    if (shouldAutoFit && availableSource !== undefined && slotDurationSeconds > availableSource) {
      // Calculate slow down rate: source duration / slot duration
      effectivePlaybackRate = Math.max(0.05, Math.min(1.0, availableSource / slotDurationSeconds));
    } else if (clip.speed && clip.speed > 0) {
      effectivePlaybackRate = clip.speed;
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity,
        transform,
        filter,
        overflow: 'hidden',
      }}
    >
      {mediaSrc ? (
        isVideo ? (
          <OffthreadVideo
            src={mediaSrc}
            startFrom={startFromFrame}
            playbackRate={effectivePlaybackRate}
            pauseWhenBuffering
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center center',
            }}
          />
        ) : (
          <Img
            src={mediaSrc}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, #0f172a, #030712, #000000)',
          }}
        />
      )}
    </div>
  );
};

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  type,
  source,
  clips,
  overlayOpacity,
  vignetteIntensity,
  kenBurnsEffect,
  totalDurationInFrames,
  fps = 30,
}) => {
  const activeClips = clips && clips.length > 0 ? clips : null;

  // Calculate proportional frame distribution for multi-media clips using percentage
  const clipSequences = React.useMemo(() => {
    if (!activeClips || activeClips.length === 0) return [];

    const totalWeight = activeClips.reduce(
      (sum, c) => sum + (c.percentage !== undefined ? c.percentage : (c.durationRatio || 1.0) * 100),
      0
    );
    const validTotalWeight = totalWeight > 0 ? totalWeight : activeClips.length;

    let currentStart = 0;
    const items: Array<{ clip: BackgroundClip; startFrame: number; durationFrames: number }> = [];

    activeClips.forEach((clip, index) => {
      const isLast = index === activeClips.length - 1;
      const weight = clip.percentage !== undefined ? clip.percentage : (clip.durationRatio || 1.0) * 100;
      const proportionalFrames = Math.max(
        15,
        Math.round((weight / validTotalWeight) * totalDurationInFrames)
      );

      const durationFrames = isLast
        ? Math.max(15, totalDurationInFrames - currentStart)
        : proportionalFrames;

      // Allow clips to overlap slightly during transition window so the underlying clip remains visible during fades
      const transFrames = clip.transitionDurationFrames || 24;
      const extendedDuration = isLast
        ? durationFrames
        : durationFrames + transFrames;

      items.push({
        clip,
        startFrame: currentStart,
        durationFrames: Math.min(totalDurationInFrames - currentStart, extendedDuration),
      });

      currentStart += durationFrames;
    });

    return items;
  }, [activeClips, totalDurationInFrames]);

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        backgroundColor: '#000000',
        userSelect: 'none',
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
      }}
    >
      {/* Background Media: Multi-Clip Sequence or Single Fallback */}
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        {clipSequences.length > 0 ? (
          clipSequences.map(({ clip, startFrame, durationFrames }, index) => (
            <Sequence
              key={`${clip.id}_${index}`}
              from={startFrame}
              durationInFrames={durationFrames}
            >
              <ClipItem
                clip={clip}
                durationInFrames={durationFrames}
                isFirst={index === 0}
                fps={fps}
                globalKenBurns={kenBurnsEffect}
              />
            </Sequence>
          ))
        ) : (
          <ClipItem
            clip={{
              id: 'single',
              type,
              source,
              name: 'Single Background',
              percentage: 100,
              durationRatio: 1,
              speed: 1,
              autoFitSpeed: true,
              sourceDurationSeconds: clips?.[0]?.sourceDurationSeconds,
              trimStartSeconds: 0,
              kenBurns: kenBurnsEffect,
              transition: 'cut',
              transitionDurationFrames: 0,
            }}
            durationInFrames={totalDurationInFrames}
            isFirst={true}
            fps={fps}
            globalKenBurns={kenBurnsEffect}
          />
        )}
      </div>

      {/* Dark Dimming Overlay */}
      <AbsoluteFill
        style={{
          backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
          width: '100%',
          height: '100%',
        }}
      />

      {/* Multi-Stop Cinematic Vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,${
            0.5 * vignetteIntensity
          }) 75%, rgba(0,0,0,${0.95 * vignetteIntensity}) 100%)`,
          width: '100%',
          height: '100%',
        }}
      />
    </AbsoluteFill>
  );
};
