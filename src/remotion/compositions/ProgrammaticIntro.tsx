import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img } from 'remotion';
import { VideoTemplateConfig, TransitionType } from '../../shared/types';
import { getMediaUrl } from '../../shared/media-url';

interface ProgrammaticIntroProps {
  config: VideoTemplateConfig;
  durationInFrames: number;
  transition: TransitionType;
}

export const ProgrammaticIntro: React.FC<ProgrammaticIntroProps> = ({
  config,
  durationInFrames,
  transition,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const preset = config.introPreset || 'golden-elegance';
  const themeColor = config.introThemeColor || '#F59E0B';

  const title = (config.introTitle?.trim() || config.channelHandle?.trim() || "THE NOBLE QUR'AN").replace(/^@/, '');
  const subtitle = config.introSubtitle?.trim() || 'Holy Quran Recitation';

  // Resolved logo: either explicit introCustomLogo or fallback to branding logoPath
  const rawLogoPath = config.introCustomLogo || config.logoPath;
  const resolvedLogo = rawLogoPath ? getMediaUrl(rawLogoPath) : undefined;
  const isPuppeteer = typeof window !== 'undefined' && !(window as any).electronAPI;
  const hasValidLogo = Boolean(resolvedLogo && (!isPuppeteer || !resolvedLogo.startsWith('app-media://')));

  // Exit transition fade
  const exitFrames = Math.min(18, Math.round(durationInFrames * 0.25));
  const exitStart = Math.max(0, durationInFrames - exitFrames);

  let exitOpacity = 1;
  let exitScale = 1;
  if (frame >= exitStart) {
    const p = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    if (transition === 'dip-black' || transition === 'crossfade') {
      exitOpacity = 1 - p;
    } else if (transition === 'zoom-fade') {
      exitOpacity = 1 - p;
      exitScale = 1 + p * 0.08;
    }
  }

  // Camera slow push-in throughout the entire intro
  const cameraZoom = interpolate(frame, [0, durationInFrames], [0.96, 1.04], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Entrance spring for central emblem / logo
  const emblemSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 85, mass: 0.9 },
  });

  // Typography stagger entrance
  const textProgress = interpolate(frame, [Math.round(fps * 0.25), Math.round(fps * 0.9)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const textTranslateY = interpolate(textProgress, [0, 1], [24, 0]);
  const textBlur = interpolate(textProgress, [0, 1], [12, 0]);

  // Subtitle & divider line expansion
  const subProgress = interpolate(frame, [Math.round(fps * 0.55), Math.round(fps * 1.2)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Continuous subtle rotating aura for sacred geometry
  const rotationDeg = (frame / fps) * 8; // 8 deg per sec

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#05070a',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: exitOpacity,
        transform: `scale(${exitScale})`,
      }}
    >
      {/* ─── PRESET 1: GOLDEN ISLAMIC ELEGANCE ─── */}
      {preset === 'golden-elegance' && (
        <AbsoluteFill
          style={{
            transform: `scale(${cameraZoom})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: `radial-gradient(circle at 50% 45%, ${themeColor}22 0%, rgba(5,7,10,0.85) 65%, #030406 100%)`,
          }}
        >
          {/* Subtle Ambient Particle Shimmer */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              opacity: 0.35,
              backgroundImage: `radial-gradient(circle at 20% 30%, ${themeColor}66 1px, transparent 1px),
                                radial-gradient(circle at 80% 25%, ${themeColor}66 1.5px, transparent 1.5px),
                                radial-gradient(circle at 45% 75%, ${themeColor}66 1px, transparent 1px),
                                radial-gradient(circle at 70% 80%, ${themeColor}66 1.2px, transparent 1.2px)`,
              backgroundSize: '240px 240px',
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              maxWidth: '92%',
              zIndex: 10,
            }}
          >
            {/* Emblem / Logo */}
            <div
              style={{
                transform: `scale(${emblemSpring})`,
                opacity: emblemSpring,
                marginBottom: '28px',
                position: 'relative',
              }}
            >
              {/* Outer Radiant Glow Ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: '-18px',
                  borderRadius: '9999px',
                  background: `radial-gradient(circle, ${themeColor}55 0%, transparent 70%)`,
                  filter: 'blur(14px)',
                }}
              />

              {hasValidLogo ? (
                <div
                  style={{
                    width: '108px',
                    height: '108px',
                    borderRadius: '9999px',
                    padding: '4px',
                    background: `linear-gradient(135deg, ${themeColor}, #FFF, ${themeColor}88)`,
                    boxShadow: `0 0 35px ${themeColor}66`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Img
                    src={resolvedLogo!}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '9999px',
                      objectFit: 'cover',
                      backgroundColor: '#000',
                    }}
                  />
                </div>
              ) : (
                /* Ornate Sacred 8-Point Geometric Star (Rub el Hizb) */
                <svg
                  width="96"
                  height="96"
                  viewBox="0 0 100 100"
                  style={{
                    filter: `drop-shadow(0 0 24px ${themeColor})`,
                  }}
                >
                  <g transform="translate(50,50)">
                    {/* Square 1 */}
                    <rect
                      x="-32"
                      y="-32"
                      width="64"
                      height="64"
                      fill="none"
                      stroke={themeColor}
                      strokeWidth="2.5"
                      style={{ opacity: 0.9 }}
                    />
                    {/* Square 2 (Rotated 45 deg) */}
                    <rect
                      x="-32"
                      y="-32"
                      width="64"
                      height="64"
                      transform="rotate(45)"
                      fill="none"
                      stroke={themeColor}
                      strokeWidth="2.5"
                      style={{ opacity: 0.9 }}
                    />
                    {/* Inner Calligraphy Motif */}
                    <circle cx="0" cy="0" r="16" fill={themeColor} fillOpacity="0.25" stroke={themeColor} strokeWidth="2" />
                    <circle cx="0" cy="0" r="5" fill="#FFF" />
                  </g>
                </svg>
              )}
            </div>

            {/* Main Channel Title */}
            <h1
              style={{
                fontFamily: "'Amiri', 'Cinzel', 'Noto Serif', serif",
                fontSize: width < 1200 ? '42px' : '58px',
                fontWeight: 700,
                letterSpacing: `${interpolate(textProgress, [0, 1], [0.02, 0.1])}em`,
                background: `linear-gradient(135deg, #FFFFFF 0%, ${themeColor} 50%, #F59E0B 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: `0 4px 25px ${themeColor}44`,
                margin: '0 0 16px 0',
                opacity: textProgress,
                transform: `translateY(${textTranslateY}px)`,
                filter: textBlur > 0.5 ? `blur(${textBlur}px)` : undefined,
              }}
            >
              {title}
            </h1>

            {/* Divider Line with Diamond Center */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                width: '100%',
                maxWidth: '460px',
                margin: '0 auto 16px auto',
                opacity: subProgress,
              }}
            >
              <div
                style={{
                  height: '1px',
                  flex: 1,
                  background: `linear-gradient(to right, transparent, ${themeColor}AA)`,
                  transform: `scaleX(${subProgress})`,
                  transformOrigin: 'right center',
                }}
              />
              <span style={{ color: themeColor, fontSize: '11px', lineHeight: 1 }}>◆</span>
              <div
                style={{
                  height: '1px',
                  flex: 1,
                  background: `linear-gradient(to left, transparent, ${themeColor}AA)`,
                  transform: `scaleX(${subProgress})`,
                  transformOrigin: 'left center',
                }}
              />
            </div>

            {/* Subtitle / Tagline */}
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: width < 1200 ? '16px' : '20px',
                color: 'rgba(255, 255, 255, 0.85)',
                fontWeight: 400,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                margin: 0,
                opacity: subProgress,
                textShadow: '0 2px 10px rgba(0,0,0,0.8)',
              }}
            >
              {subtitle}
            </p>
          </div>
        </AbsoluteFill>
      )}

      {/* ─── PRESET 2: SACRED GEOMETRIC AURA ─── */}
      {preset === 'sacred-geometry' && (
        <AbsoluteFill
          style={{
            transform: `scale(${cameraZoom})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#040d12',
          }}
        >
          {/* Rotating Geometric Arabesque Rings */}
          <div
            style={{
              position: 'absolute',
              width: '650px',
              height: '650px',
              pointerEvents: 'none',
              transform: `rotate(${rotationDeg}deg)`,
              opacity: 0.18,
            }}
          >
            <svg viewBox="0 0 400 400" width="100%" height="100%">
              <circle cx="200" cy="200" r="180" fill="none" stroke={themeColor} strokeWidth="1" strokeDasharray="4 8" />
              <circle cx="200" cy="200" r="140" fill="none" stroke={themeColor} strokeWidth="1.5" />
              <circle cx="200" cy="200" r="95" fill="none" stroke={themeColor} strokeWidth="1" strokeDasharray="3 6" />
              {/* Star of David / Octagram Petals */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => (
                <rect
                  key={idx}
                  x="140"
                  y="140"
                  width="120"
                  height="120"
                  transform={`rotate(${angle} 200 200)`}
                  fill="none"
                  stroke={themeColor}
                  strokeWidth="1.2"
                />
              ))}
            </svg>
          </div>

          <div
            style={{
              position: 'absolute',
              width: '500px',
              height: '500px',
              pointerEvents: 'none',
              transform: `rotate(${-rotationDeg * 1.5}deg)`,
              opacity: 0.12,
            }}
          >
            <svg viewBox="0 0 400 400" width="100%" height="100%">
              {[0, 30, 60, 90, 120, 150].map((angle, idx) => (
                <ellipse
                  key={idx}
                  cx="200"
                  cy="200"
                  rx="150"
                  ry="50"
                  transform={`rotate(${angle} 200 200)`}
                  fill="none"
                  stroke={themeColor}
                  strokeWidth="0.8"
                />
              ))}
            </svg>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              zIndex: 10,
              maxWidth: '92%',
            }}
          >
            {/* Logo / Badge */}
            <div
              style={{
                transform: `scale(${emblemSpring})`,
                opacity: emblemSpring,
                marginBottom: '26px',
              }}
            >
              {hasValidLogo ? (
                <Img
                  src={resolvedLogo!}
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '9999px',
                    objectFit: 'cover',
                    border: `2px solid ${themeColor}`,
                    boxShadow: `0 0 30px ${themeColor}66`,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '88px',
                    height: '88px',
                    borderRadius: '9999px',
                    border: `2px solid ${themeColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `radial-gradient(circle, ${themeColor}33, transparent)`,
                    boxShadow: `0 0 25px ${themeColor}55`,
                  }}
                >
                  <span style={{ fontSize: '38px', color: themeColor }}>۞</span>
                </div>
              )}
            </div>

            <h1
              style={{
                fontFamily: "'Amiri', 'Cinzel', serif",
                fontSize: width < 1200 ? '40px' : '54px',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.08em',
                margin: '0 0 12px 0',
                opacity: textProgress,
                transform: `translateY(${textTranslateY}px)`,
                textShadow: `0 0 30px ${themeColor}66, 0 4px 10px rgba(0,0,0,0.9)`,
              }}
            >
              {title}
            </h1>

            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: width < 1200 ? '15px' : '18px',
                color: themeColor,
                fontWeight: 500,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                margin: 0,
                opacity: subProgress,
              }}
            >
              {subtitle}
            </p>
          </div>
        </AbsoluteFill>
      )}

      {/* ─── PRESET 3: MODERN MINIMALIST GLOW ─── */}
      {preset === 'modern-minimal' && (
        <AbsoluteFill
          style={{
            transform: `scale(${cameraZoom})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#090d16',
          }}
        >
          {/* Subtle Ambient Radial Backlight */}
          <div
            style={{
              position: 'absolute',
              width: '600px',
              height: '350px',
              borderRadius: '9999px',
              background: `radial-gradient(ellipse, ${themeColor}33 0%, transparent 70%)`,
              filter: 'blur(60px)',
            }}
          />

          {/* Glassmorphic Presentation Card */}
          <div
            style={{
              padding: '42px 64px',
              borderRadius: '28px',
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              maxWidth: '85%',
              transform: `scale(${emblemSpring})`,
              opacity: emblemSpring,
            }}
          >
            {hasValidLogo && (
              <Img
                src={resolvedLogo!}
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '20px',
                  objectFit: 'cover',
                  marginBottom: '20px',
                  boxShadow: `0 10px 25px rgba(0,0,0,0.5), 0 0 20px ${themeColor}44`,
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              />
            )}

            <h1
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: width < 1200 ? '38px' : '48px',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                margin: '0 0 10px 0',
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              {title}
            </h1>

            {/* Glowing Accent Bar */}
            <div
              style={{
                width: '64px',
                height: '4px',
                borderRadius: '9999px',
                backgroundColor: themeColor,
                boxShadow: `0 0 12px ${themeColor}`,
                marginBottom: '14px',
                transform: `scaleX(${subProgress})`,
              }}
            />

            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: width < 1200 ? '14px' : '16px',
                color: 'rgba(255, 255, 255, 0.75)',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                margin: 0,
                opacity: subProgress,
              }}
            >
              {subtitle}
            </p>
          </div>
        </AbsoluteFill>
      )}

      {/* ─── PRESET 4: CINEMATIC TITLE REVEAL ─── */}
      {preset === 'cinematic-reveal' && (
        <AbsoluteFill
          style={{
            transform: `scale(${cameraZoom})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000000',
          }}
        >
          {/* Anamorphic Lens Flare Line Traversing Horizontally */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '2px',
              background: `linear-gradient(90deg, transparent 0%, ${themeColor}88 40%, #FFF 50%, ${themeColor}88 60%, transparent 100%)`,
              opacity: interpolate(frame, [0, Math.round(fps * 0.7), Math.round(fps * 1.5)], [0, 0.85, 0.2]),
              transform: `scaleX(${interpolate(frame, [0, Math.round(fps * 1.2)], [0.1, 1.2])})`,
              filter: `drop-shadow(0 0 15px ${themeColor})`,
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              zIndex: 10,
              maxWidth: '92%',
            }}
          >
            {hasValidLogo && (
              <div
                style={{
                  transform: `scale(${emblemSpring})`,
                  opacity: emblemSpring,
                  marginBottom: '24px',
                }}
              >
                <Img
                  src={resolvedLogo!}
                  style={{
                    width: '92px',
                    height: '92px',
                    borderRadius: '9999px',
                    objectFit: 'cover',
                    filter: `drop-shadow(0 0 20px ${themeColor}55)`,
                  }}
                />
              </div>
            )}

            <h1
              style={{
                fontFamily: "'Cinzel', 'Amiri', serif",
                fontSize: width < 1200 ? '44px' : '62px',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: `${interpolate(textProgress, [0, 1], [0.05, 0.2])}em`,
                textTransform: 'uppercase',
                margin: '0 0 14px 0',
                opacity: textProgress,
                filter: textBlur > 0.5 ? `blur(${textBlur}px)` : undefined,
                textShadow: `0 0 35px ${themeColor}55, 0 4px 15px rgba(0,0,0,0.9)`,
              }}
            >
              {title}
            </h1>

            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: width < 1200 ? '15px' : '18px',
                color: themeColor,
                fontWeight: 500,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                margin: 0,
                opacity: subProgress,
              }}
            >
              {subtitle}
            </p>
          </div>
        </AbsoluteFill>
      )}

      {/* ─── PRESET 5: DIVINE CALLIGRAPHY & CRESCENT ─── */}
      {preset === 'islamic-calligraphy' && (
        <AbsoluteFill
          style={{
            transform: `scale(${cameraZoom})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: `radial-gradient(circle at 50% 50%, #064e3b44 0%, #032118 60%, #02120d 100%)`,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              zIndex: 10,
              maxWidth: '92%',
            }}
          >
            {/* Islamic Crescent & Star Icon */}
            <div
              style={{
                transform: `scale(${emblemSpring})`,
                opacity: emblemSpring,
                marginBottom: '22px',
                position: 'relative',
              }}
            >
              {hasValidLogo ? (
                <div
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '9999px',
                    padding: '3px',
                    background: `linear-gradient(135deg, ${themeColor}, #34D399)`,
                    boxShadow: `0 0 30px #10B98166`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Img
                    src={resolvedLogo!}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '9999px',
                      objectFit: 'cover',
                      backgroundColor: '#000',
                    }}
                  />
                </div>
              ) : (
                <svg
                  width="88"
                  height="88"
                  viewBox="0 0 100 100"
                  style={{ filter: `drop-shadow(0 0 20px ${themeColor})` }}
                >
                  <g fill={themeColor}>
                    {/* Crescent */}
                    <path d="M50 15 A35 35 0 1 0 85 50 A28 28 0 1 1 50 15 Z" />
                    {/* 5-pointed star */}
                    <polygon points="68,34 72,44 82,44 74,50 77,60 68,54 59,60 62,50 54,44 64,44" />
                  </g>
                </svg>
              )}
            </div>

            {/* Sacred Arabesque Wing Brackets surrounding title */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                opacity: textProgress,
                transform: `translateY(${textTranslateY}px)`,
                marginBottom: '14px',
              }}
            >
              <span
                style={{
                  fontFamily: "'Amiri', serif",
                  fontSize: '48px',
                  color: themeColor,
                  lineHeight: 1,
                  opacity: 0.85,
                }}
              >
                ﴾
              </span>
              <h1
                style={{
                  fontFamily: "'Amiri', 'Cinzel', serif",
                  fontSize: width < 1200 ? '42px' : '56px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  margin: 0,
                  textShadow: `0 0 25px ${themeColor}66`,
                }}
              >
                {title}
              </h1>
              <span
                style={{
                  fontFamily: "'Amiri', serif",
                  fontSize: '48px',
                  color: themeColor,
                  lineHeight: 1,
                  opacity: 0.85,
                }}
              >
                ﴿
              </span>
            </div>

            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: width < 1200 ? '16px' : '19px',
                color: '#A7F3D0',
                fontWeight: 400,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                margin: 0,
                opacity: subProgress,
              }}
            >
              {subtitle}
            </p>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
