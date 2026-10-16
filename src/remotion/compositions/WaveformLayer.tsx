import React, { useId } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { useAudioData, visualizeAudioWaveform, createSmoothSvgPath } from '@remotion/media-utils';
import { getMediaUrl } from '../../shared/media-url';
import { WaveformType } from '../../shared/types';

interface WaveformLayerProps {
  audioUrl: string;
  type: WaveformType;
  color: string;
  colorSecondary?: string;
  height: number;
  width?: number; // Percentage of canvas width (e.g. 92)
  amplitude?: number; // Sensitivity / dynamic gain multiplier (e.g. 2.2)
  positionY: number; // Percentage from top
  glow?: boolean;
  glowIntensity?: number;
  fillArea?: boolean;
  barWidth?: number;
  sampleCount?: number;
  circularRadius?: number;
  opacity?: number;
}

export const WaveformLayer: React.FC<WaveformLayerProps> = ({
  audioUrl,
  type = 'smooth-wave',
  color = '#F59E0B',
  colorSecondary,
  height = 120,
  width = 92,
  amplitude = 2.2,
  positionY = 74,
  glow = true,
  glowIntensity = 1.5,
  fillArea = false,
  barWidth = 6,
  sampleCount = 64,
  circularRadius = 130,
  opacity = 0.9,
}) => {
  const frame = useCurrentFrame();
  const gradId = useId().replace(/:/g, '');

  const resolvedAudioSrc = getMediaUrl(audioUrl);
  const secondaryColor = colorSecondary || color;

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

  const effectiveSampleCount = Math.min(128, Math.max(24, sampleCount || 64));
  let samples: number[] = [];

  if (audioData) {
    try {
      samples = visualizeAudioWaveform({
        audioData,
        frame,
        fps: 30,
        numberOfSamples: effectiveSampleCount,
        windowInSeconds: 0.1,
      });
    } catch {
      samples = [];
    }
  }

  // Check if samples actually contain acoustic energy (avoiding flat-line during headless renders or initial load)
  const hasAcousticEnergy = samples.length > 0 && samples.some((val) => Math.abs(val) > 0.005);

  if (!hasAcousticEnergy) {
    samples = Array.from({ length: effectiveSampleCount }, (_, i) => {
      const norm = i / (effectiveSampleCount - 1);
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

  const glowFilter = glow
    ? `drop-shadow(0 0 ${6 * glowIntensity}px ${color}) drop-shadow(0 0 ${14 * glowIntensity}px ${secondaryColor}88)`
    : 'none';

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
        opacity: opacity ?? 0.9,
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
        {/* ========================================================= */}
        {/* 1. SMOOTH FLOWING BEZIER WAVE                             */}
        {/* ========================================================= */}
        {type === 'smooth-wave' && (
          <svg
            viewBox="0 0 1000 100"
            style={{
              width: '100%',
              height: '100%',
              overflow: 'visible',
            }}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`strokeGrad_${gradId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={color} />
                <stop offset="50%" stopColor={secondaryColor} />
                <stop offset="100%" stopColor={color} />
              </linearGradient>

              {fillArea && (
                <linearGradient id={`areaGrad_${gradId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.4" />
                  <stop offset="80%" stopColor={color} stopOpacity="0.08" />
                  <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
              )}
            </defs>

            {/* Optional Translucent Fill Underneath */}
            {fillArea && (
              <path
                d={`${createSmoothSvgPath({
                  points: processedSamples.map((val, i) => {
                    const x = (i / (processedSamples.length - 1)) * 1000;
                    const y = 50 + val * 45;
                    return { x, y };
                  }),
                })} L 1000 100 L 0 100 Z`}
                fill={`url(#areaGrad_${gradId})`}
              />
            )}

            {/* Flowing Wave Stroke */}
            <path
              d={createSmoothSvgPath({
                points: processedSamples.map((val, i) => {
                  const x = (i / (processedSamples.length - 1)) * 1000;
                  const y = 50 + val * 45;
                  return { x, y };
                }),
              })}
              fill="none"
              stroke={`url(#strokeGrad_${gradId})`}
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              style={{ filter: glowFilter }}
            />
          </svg>
        )}

        {/* ========================================================= */}
        {/* 2. MIRRORED ROUNDED FREQUENCY BARS                        */}
        {/* ========================================================= */}
        {type === 'mirrored-bars' && (
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
              const barH = Math.max(barWidth, Math.abs(val) * height * 0.95);
              return (
                <div
                  key={i}
                  style={{
                    height: `${barH}px`,
                    width: `${barWidth}px`,
                    borderRadius: '9999px',
                    background: `linear-gradient(180deg, ${secondaryColor} 0%, ${color} 100%)`,
                    boxShadow: glow
                      ? `0 0 ${8 * glowIntensity}px ${color}AA, 0 0 ${16 * glowIntensity}px ${secondaryColor}55`
                      : 'none',
                    opacity: 0.92,
                    transition: 'height 0.08s ease-out',
                  }}
                />
              );
            })}
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. GROUNDED GRADIENT SPECTRUM (UPWARD BARS)               */}
        {/* ========================================================= */}
        {type === 'gradient-bars' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
            }}
          >
            {processedSamples.map((val, i) => {
              const barH = Math.max(4, Math.abs(val) * height * 0.98);
              return (
                <div
                  key={i}
                  style={{
                    height: `${barH}px`,
                    width: `${barWidth}px`,
                    borderTopLeftRadius: '9999px',
                    borderTopRightRadius: '9999px',
                    background: `linear-gradient(0deg, ${color} 0%, ${secondaryColor} 100%)`,
                    boxShadow: glow
                      ? `0 0 ${10 * glowIntensity}px ${secondaryColor}AA`
                      : 'none',
                    opacity: 0.95,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. CIRCULAR RADIAL VISUALIZER HALO                        */}
        {/* ========================================================= */}
        {type === 'circular-halo' && (
          <div
            style={{
              width: `${circularRadius * 2 + height}px`,
              height: `${circularRadius * 2 + height}px`,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              viewBox={`0 0 ${(circularRadius + height) * 2} ${(circularRadius + height) * 2}`}
              style={{
                width: '100%',
                height: '100%',
                overflow: 'visible',
              }}
            >
              <defs>
                <linearGradient id={`radialGrad_${gradId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={color} />
                  <stop offset="100%" stopColor={secondaryColor} />
                </linearGradient>
              </defs>

              {/* Inner Delicate Concentric Ring */}
              <circle
                cx={circularRadius + height}
                cy={circularRadius + height}
                r={circularRadius - 6}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeDasharray="4 6"
                opacity="0.5"
              />

              {/* Outer Audio-Reactive Spikes */}
              {processedSamples.map((val, i) => {
                const center = circularRadius + height;
                const angle = (i / processedSamples.length) * 2 * Math.PI - Math.PI / 2;
                const spikeLen = Math.max(5, Math.abs(val) * height * 0.65);

                const x1 = center + Math.cos(angle) * circularRadius;
                const y1 = center + Math.sin(angle) * circularRadius;
                const x2 = center + Math.cos(angle) * (circularRadius + spikeLen);
                const y2 = center + Math.sin(angle) * (circularRadius + spikeLen);

                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={`url(#radialGrad_${gradId})`}
                    strokeWidth={Math.max(2, barWidth * 0.75)}
                    strokeLinecap="round"
                    style={{
                      filter: glow
                        ? `drop-shadow(0 0 ${4 * glowIntensity}px ${secondaryColor})`
                        : 'none',
                    }}
                  />
                );
              })}
            </svg>
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. DUAL SYMMETRICAL FLUID WAVE RIBBON                     */}
        {/* ========================================================= */}
        {type === 'dual-symmetrical-wave' && (
          <svg
            viewBox="0 0 1000 100"
            style={{
              width: '100%',
              height: '100%',
              overflow: 'visible',
            }}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`dualGrad_${gradId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={color} />
                <stop offset="50%" stopColor={secondaryColor} />
                <stop offset="100%" stopColor={color} />
              </linearGradient>

              <linearGradient id={`dualArea_${gradId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.3" />
                <stop offset="50%" stopColor={color} stopOpacity="0.45" />
                <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Filled Area between Top and Bottom Wave */}
            <path
              d={`${createSmoothSvgPath({
                points: processedSamples.map((val, i) => {
                  const x = (i / (processedSamples.length - 1)) * 1000;
                  const y = 50 - Math.abs(val) * 44;
                  return { x, y };
                }),
              })} L 1000 50 ${createSmoothSvgPath({
                points: processedSamples
                  .slice()
                  .reverse()
                  .map((val, i) => {
                    const x = 1000 - (i / (processedSamples.length - 1)) * 1000;
                    const y = 50 + Math.abs(val) * 44;
                    return { x, y };
                  }),
              }).replace(/^M/, 'L')} Z`}
              fill={`url(#dualArea_${gradId})`}
            />

            {/* Top Boundary Line */}
            <path
              d={createSmoothSvgPath({
                points: processedSamples.map((val, i) => {
                  const x = (i / (processedSamples.length - 1)) * 1000;
                  const y = 50 - Math.abs(val) * 44;
                  return { x, y };
                }),
              })}
              fill="none"
              stroke={`url(#dualGrad_${gradId})`}
              strokeWidth="2.8"
              strokeLinecap="round"
              style={{ filter: glowFilter }}
            />

            {/* Bottom Mirrored Line */}
            <path
              d={createSmoothSvgPath({
                points: processedSamples.map((val, i) => {
                  const x = (i / (processedSamples.length - 1)) * 1000;
                  const y = 50 + Math.abs(val) * 44;
                  return { x, y };
                }),
              })}
              fill="none"
              stroke={`url(#dualGrad_${gradId})`}
              strokeWidth="2.8"
              strokeLinecap="round"
              style={{ filter: glowFilter }}
            />
          </svg>
        )}

        {/* ========================================================= */}
        {/* 6. DOTTED MATRIX / DIGITAL PARTICLES                      */}
        {/* ========================================================= */}
        {type === 'dotted-matrix' && (
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
            {processedSamples.map((val, colIdx) => {
              const maxDots = 7;
              const litDots = Math.max(1, Math.ceil(Math.abs(val) * maxDots));
              return (
                <div
                  key={colIdx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    height: '100%',
                  }}
                >
                  {Array.from({ length: maxDots }, (_, dotIdx) => {
                    const isLit = dotIdx < litDots;
                    return (
                      <div
                        key={dotIdx}
                        style={{
                          width: `${barWidth}px`,
                          height: `${barWidth}px`,
                          borderRadius: '50%',
                          backgroundColor: isLit ? (dotIdx > 4 ? secondaryColor : color) : 'rgba(255,255,255,0.08)',
                          boxShadow: isLit && glow
                            ? `0 0 ${6 * glowIntensity}px ${color}`
                            : 'none',
                          opacity: isLit ? 0.95 : 0.15,
                          transition: 'opacity 0.06s ease',
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================= */}
        {/* 7. MINIMAL LINE PULSE (LUXURY SUBTITLE ACCENT)            */}
        {/* ========================================================= */}
        {type === 'minimal-line-pulse' && (
          <svg
            viewBox="0 0 1000 60"
            style={{
              width: '100%',
              height: '100%',
              overflow: 'visible',
            }}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`pulseGrad_${gradId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={color} stopOpacity="0" />
                <stop offset="25%" stopColor={color} stopOpacity="0.8" />
                <stop offset="50%" stopColor={secondaryColor} stopOpacity="1" />
                <stop offset="75%" stopColor={color} stopOpacity="0.8" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Ripple Pulse Stroke */}
            <path
              d={createSmoothSvgPath({
                points: processedSamples.map((val, i) => {
                  const x = (i / (processedSamples.length - 1)) * 1000;
                  // Center windowing: dampens edges, creates pulse in center
                  const norm = i / (processedSamples.length - 1);
                  const centerFocus = Math.sin(norm * Math.PI);
                  const y = 30 + val * 26 * centerFocus;
                  return { x, y };
                }),
              })}
              fill="none"
              stroke={`url(#pulseGrad_${gradId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={{ filter: glowFilter }}
            />
          </svg>
        )}
      </div>
    </AbsoluteFill>
  );
};
