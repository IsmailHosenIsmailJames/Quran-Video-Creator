import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { useAudioData, visualizeAudioWaveform, createSmoothSvgPath } from '@remotion/media-utils';
import { getMediaUrl } from '../../shared/media-url';

interface WaveformLayerProps {
  audioUrl: string;
  type: 'smooth-wave' | 'mirrored-bars';
  color: string;
  height: number;
  width?: number; // Percentage of canvas width (e.g. 92)
  amplitude?: number; // Sensitivity / dynamic gain multiplier (e.g. 2.2)
  positionY: number; // Percentage from top
}

export const WaveformLayer: React.FC<WaveformLayerProps> = ({
  audioUrl,
  type,
  color,
  height,
  width = 92,
  amplitude = 2.2,
  positionY,
}) => {
  const frame = useCurrentFrame();

  const resolvedAudioSrc = getMediaUrl(audioUrl);

  // Gracefully attempt audio extraction; fall back to vocal harmonics if WebAudio is restricted
  let audioData = null;
  try {
    if (resolvedAudioSrc) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      audioData = useAudioData(resolvedAudioSrc);
    }
  } catch {
    audioData = null;
  }

  const sampleCount = 64;
  let samples: number[] = [];
  if (audioData) {
    try {
      samples = visualizeAudioWaveform({
        audioData,
        frame,
        fps: 30,
        numberOfSamples: sampleCount,
        windowInSeconds: 0.1,
      });
    } catch {
      samples = [];
    }
  }

  // Check if samples actually contain acoustic energy (avoiding flat-line during headless renders)
  const hasAcousticEnergy = samples.length > 0 && samples.some((val) => Math.abs(val) > 0.005);

  if (!hasAcousticEnergy) {
    samples = Array.from({ length: sampleCount }, (_, i) => {
      const norm = i / (sampleCount - 1);
      const bell = Math.sin(norm * Math.PI); // Taper ends gracefully to 0
      const wave1 = Math.sin(norm * 14 + frame * 0.14) * 0.45;
      const wave2 = Math.cos(norm * 22 - frame * 0.1) * 0.32;
      const wave3 = Math.sin(norm * 8 + frame * 0.06) * 0.38;
      // Vocal cadence modulation
      const pulse = Math.abs(Math.sin(frame * 0.08)) * 0.45 + 0.55;
      return (wave1 + wave2 + wave3) * bell * pulse;
    });
  }

  // Process samples with amplitude multiplier, clamped cleanly
  const amp = amplitude ?? 2.2;
  const processedSamples = samples.map((val) => {
    return Math.max(-0.95, Math.min(0.95, val * amp));
  });

  return (
    <AbsoluteFill
      style={{
        top: `${positionY}%`,
        transform: 'translateY(-50%)',
        height: `${height}px`,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: `${width}%`,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {type === 'smooth-wave' ? (
          <svg
            viewBox="0 0 1000 100"
            style={{
              width: '100%',
              height: '100%',
              overflow: 'visible',
            }}
            preserveAspectRatio="none"
          >
            <path
              d={createSmoothSvgPath({
                points: processedSamples.map((val, i) => {
                  const x = (i / (processedSamples.length - 1)) * 1000;
                  const y = 50 + val * 45;
                  return { x, y };
                }),
              })}
              fill="none"
              stroke={color}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              style={{
                filter: `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 18px ${color}88)`,
              }}
            />
          </svg>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
            }}
          >
            {processedSamples.map((val, i) => {
              const barH = Math.max(6, Math.abs(val) * height * 0.95);
              return (
                <div
                  key={i}
                  style={{
                    height: `${barH}px`,
                    backgroundColor: color,
                    width: '6px',
                    borderRadius: '9999px',
                    boxShadow: `0 0 10px ${color}`,
                    opacity: 0.88,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
