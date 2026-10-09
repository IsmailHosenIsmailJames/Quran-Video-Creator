import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Video, Img } from 'remotion';
import { getMediaUrl } from '../../shared/media-url';

interface BackgroundLayerProps {
  type: 'video' | 'image' | 'preset';
  source: string;
  overlayOpacity: number;
  vignetteIntensity: number;
  kenBurnsEffect: boolean;
  totalDurationInFrames: number;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  type,
  source,
  overlayOpacity,
  vignetteIntensity,
  kenBurnsEffect,
  totalDurationInFrames,
}) => {
  const frame = useCurrentFrame();

  const scale = kenBurnsEffect
    ? interpolate(frame, [0, Math.max(1, totalDurationInFrames)], [1.0, 1.08], {
        extrapolateRight: 'clamp',
      })
    : 1.0;

  const mediaSrc = getMediaUrl(source);

  const isVideo =
    type === 'video' ||
    mediaSrc.endsWith('.mp4') ||
    mediaSrc.endsWith('.webm') ||
    mediaSrc.endsWith('.mov');

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
      {/* Background Media */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${scale})`,
          filter: 'brightness(0.9) contrast(1.05) saturate(0.92)',
        }}
      >
        {mediaSrc ? (
          isVideo ? (
            <Video
              src={mediaSrc}
              loop
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
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
