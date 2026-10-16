import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
  Img,
} from 'remotion';
import { VideoTemplateConfig, TransitionType } from '../../shared/types';
import { getMediaUrl } from '../../shared/media-url';

interface ProgrammaticOutroProps {
  config: VideoTemplateConfig;
  durationInFrames: number;
  transition?: TransitionType;
}

export const ProgrammaticOutro: React.FC<ProgrammaticOutroProps> = ({
  config,
  durationInFrames,
  transition = 'dip-black',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const isPortrait = width < height; // 9:16 Shorts / Reels
  const isSquare = width === height; // 1:1 Square

  const preset = config.outroPreset || 'golden-sadaqallah';
  const themeColor = config.outroThemeColor || '#F59E0B';

  const title = (config.outroTitle?.trim() || 'صَدَقَ اللهُ العَظِيمُ');
  const subtitle =
    config.outroSubtitle?.trim() || 'Like, Share & Subscribe for more Quran recitations';
  const channelHandle = (config.channelHandle?.trim() || '').replace(/^@/, '');

  // Resolved logo: either explicit outroCustomLogo or fallback to branding logoPath
  const rawLogoPath = config.outroCustomLogo || config.logoPath;
  const resolvedLogo = rawLogoPath ? getMediaUrl(rawLogoPath) : undefined;
  const isPuppeteer = typeof window !== 'undefined' && !(window as any).electronAPI;
  const hasValidLogo = Boolean(resolvedLogo && (!isPuppeteer || !resolvedLogo.startsWith('app-media://')));

  // Exit transition fade / zoom calculation
  const exitFrames = Math.min(20, Math.round(durationInFrames * 0.25));
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

  // Camera slow push-in throughout the outro
  const cameraZoom = interpolate(frame, [0, durationInFrames], [0.97, 1.03], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Entrance spring for central emblem / logo
  const emblemSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 85, mass: 0.9 },
  });

  // Title typography entrance
  const titleProgress = interpolate(
    frame,
    [Math.round(fps * 0.25), Math.round(fps * 0.85)],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );
  const titleTranslateY = interpolate(titleProgress, [0, 1], [24, 0]);
  const titleBlur = interpolate(titleProgress, [0, 1], [10, 0]);

  // Subtitle & divider line expansion
  const subProgress = interpolate(
    frame,
    [Math.round(fps * 0.5), Math.round(fps * 1.1)],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );
  const subTranslateY = interpolate(subProgress, [0, 1], [18, 0]);

  // CTA / Subscribe button pulse
  const ctaProgress = interpolate(
    frame,
    [Math.round(fps * 0.75), Math.round(fps * 1.3)],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );
  const pulseScale = 1 + Math.sin((frame / fps) * 4) * 0.02;

  // Continuous subtle rotating aura for sacred geometry
  const rotationDeg = (frame / fps) * 8; // 8 deg per sec

  // Adaptive font and spacing scales
  const titleFontSize = isPortrait ? '34px' : isSquare ? '40px' : '52px';
  const arabicCalligraphySize = isPortrait ? '56px' : isSquare ? '68px' : '82px';
  const subtitleFontSize = isPortrait ? '13px' : '16px';
  const logoSize = isPortrait ? '84px' : '100px';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#040609',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: exitOpacity,
        transform: `scale(${exitScale})`,
      }}
    >
      {/* ─── PRESET 1: GOLDEN SADAQALLAH (Default) ─── */}
      {preset === 'golden-sadaqallah' && (
        <AbsoluteFill
          style={{
            transform: `scale(${cameraZoom})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: `radial-gradient(circle at 50% 45%, ${themeColor}26 0%, rgba(4,6,9,0.88) 65%, #020305 100%)`,
          }}
        >
          {/* Subtle Ambient Particle Shimmer */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              opacity: 0.38,
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
              maxWidth: isPortrait ? '94%' : '880px',
              padding: '0 24px',
              zIndex: 10,
            }}
          >
            {/* Central Emblem / Channel Logo */}
            <div
              style={{
                transform: `scale(${emblemSpring})`,
                opacity: emblemSpring,
                marginBottom: isPortrait ? '20px' : '28px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: '-18px',
                  borderRadius: '9999px',
                  background: `radial-gradient(circle, ${themeColor}55 0%, transparent 70%)`,
                  filter: 'blur(16px)',
                }}
              />

              {hasValidLogo ? (
                <div
                  style={{
                    width: logoSize,
                    height: logoSize,
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
                /* Ornate Sacred 8-Point Geometric Star */
                <svg
                  width={logoSize}
                  height={logoSize}
                  viewBox="0 0 100 100"
                  style={{ filter: `drop-shadow(0 0 24px ${themeColor})` }}
                >
                  <g transform="translate(50,50)">
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
                    <circle cx="0" cy="0" r="16" fill={themeColor} fillOpacity="0.25" stroke={themeColor} strokeWidth="2" />
                    <circle cx="0" cy="0" r="5" fill="#FFF" />
                  </g>
                </svg>
              )}
            </div>

            {/* Main Ending Title (e.g. Sadaqallahul Azim in Arabic calligraphy) */}
            <h1
              className="quran-arabic-text"
              style={{
                fontFamily: "'Amiri', 'KFGQPC Uthmanic Script HAFS', serif",
                fontSize: arabicCalligraphySize,
                fontWeight: 700,
                lineHeight: 1.25,
                background: `linear-gradient(135deg, #FFFFFF 0%, ${themeColor} 50%, #F59E0B 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: `0 4px 28px ${themeColor}44`,
                margin: '0 0 12px 0',
                opacity: titleProgress,
                transform: `translateY(${titleTranslateY}px)`,
                filter: titleBlur > 0.5 ? `blur(${titleBlur}px)` : undefined,
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
                maxWidth: isPortrait ? '260px' : '440px',
                margin: '0 auto 18px auto',
                opacity: subProgress,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: '1px',
                  background: `linear-gradient(90deg, transparent, ${themeColor})`,
                  transform: `scaleX(${subProgress})`,
                  transformOrigin: 'right center',
                }}
              />
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  transform: 'rotate(45deg)',
                  backgroundColor: themeColor,
                  boxShadow: `0 0 12px ${themeColor}`,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  flex: 1,
                  height: '1px',
                  background: `linear-gradient(90deg, ${themeColor}, transparent)`,
                  transform: `scaleX(${subProgress})`,
                  transformOrigin: 'left center',
                }}
              />
            </div>

            {/* Subtitle / Closing Message */}
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: subtitleFontSize,
                color: 'rgba(243, 244, 246, 0.9)',
                fontWeight: 400,
                letterSpacing: '0.04em',
                lineHeight: 1.5,
                margin: '0 0 24px 0',
                opacity: subProgress,
                transform: `translateY(${subTranslateY}px)`,
              }}
            >
              {subtitle}
            </p>

            {/* Subscribe & Social Handle Badge */}
            <div
              style={{
                opacity: ctaProgress,
                transform: `scale(${pulseScale})`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 24px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: `1px solid ${themeColor}66`,
                boxShadow: `0 8px 30px rgba(0, 0, 0, 0.6), 0 0 20px ${themeColor}22`,
              }}
            >
              {/* Animated Bell Icon */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={themeColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: isPortrait ? '13px' : '15px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  letterSpacing: '0.02em',
                }}
              >
                {channelHandle ? `@${channelHandle}` : 'Subscribe for Daily Quran'}
              </span>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* ─── PRESET 2: PEACEFUL DUA & CLOSURE ─── */}
      {preset === 'peaceful-closure' && (
        <AbsoluteFill
          style={{
            transform: `scale(${cameraZoom})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: `radial-gradient(circle at 50% 45%, rgba(16, 185, 129, 0.22) 0%, rgba(4, 25, 20, 0.9) 65%, #02120e 100%)`,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              maxWidth: isPortrait ? '94%' : '900px',
              padding: '0 24px',
              zIndex: 10,
            }}
          >
            {/* Serene Crescent & Star Emblem */}
            <div
              style={{
                transform: `scale(${emblemSpring})`,
                opacity: emblemSpring,
                marginBottom: '24px',
              }}
            >
              <svg
                width={logoSize}
                height={logoSize}
                viewBox="0 0 100 100"
                style={{ filter: 'drop-shadow(0 0 26px #10B981)' }}
              >
                <path
                  d="M60,18 A34,34 0 1,0 60,82 A27,27 0 1,1 60,18 Z"
                  fill="url(#emeraldGrad)"
                />
                <polygon
                  points="64,38 67,46 76,46 69,51 72,59 64,54 56,59 59,51 52,46 61,46"
                  fill="#FFF"
                />
                <defs>
                  <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34D399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Dua Title */}
            <h1
              className="quran-arabic-text"
              style={{
                fontFamily: "'Amiri', serif",
                fontSize: isPortrait ? '38px' : '54px',
                fontWeight: 700,
                color: '#ECFDF5',
                textShadow: '0 4px 25px rgba(16, 185, 129, 0.4)',
                margin: '0 0 12px 0',
                opacity: titleProgress,
                transform: `translateY(${titleTranslateY}px)`,
              }}
            >
              رَبَّنَا تَقَبَّلْ مِنَّا
            </h1>

            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: subtitleFontSize,
                color: 'rgba(209, 250, 229, 0.85)',
                margin: '0 0 20px 0',
                opacity: subProgress,
              }}
            >
              "Our Lord, accept this from us; indeed You are the Hearing, the Knowing."
            </p>

            <div
              style={{
                opacity: ctaProgress,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 22px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(16, 185, 129, 0.14)',
                border: '1px solid rgba(16, 185, 129, 0.45)',
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#34D399',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {channelHandle ? `@${channelHandle}` : 'Peace & Reflections'}
              </span>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* ─── PRESET 3: SACRED GEOMETRY MANDALA ─── */}
      {preset === 'sacred-geometry' && (
        <AbsoluteFill
          style={{
            transform: `scale(${cameraZoom})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.18) 0%, rgba(15, 23, 42, 0.92) 65%, #050811 100%)`,
          }}
        >
          {/* Rotating Geometric Arabesque in Background */}
          <div
            style={{
              position: 'absolute',
              width: '480px',
              height: '480px',
              transform: `rotate(${rotationDeg}deg)`,
              opacity: 0.25,
              pointerEvents: 'none',
            }}
          >
            <svg viewBox="0 0 200 200" width="100%" height="100%">
              <circle cx="100" cy="100" r="90" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 4" />
              <rect x="35" y="35" width="130" height="130" fill="none" stroke="#38BDF8" strokeWidth="1" />
              <rect x="35" y="35" width="130" height="130" fill="none" stroke="#38BDF8" strokeWidth="1" transform="rotate(45 100 100)" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="#38BDF8" strokeWidth="1.5" />
            </svg>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              maxWidth: isPortrait ? '94%' : '840px',
              padding: '0 24px',
              zIndex: 10,
            }}
          >
            <div
              style={{
                transform: `scale(${emblemSpring})`,
                opacity: emblemSpring,
                marginBottom: '20px',
              }}
            >
              <svg width="72" height="72" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 0 20px #38BDF8)' }}>
                <polygon
                  points="50,5 61,35 95,35 67,55 78,88 50,68 22,88 33,55 5,35 39,35"
                  fill="url(#skyStar)"
                />
                <defs>
                  <linearGradient id="skyStar" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#BAE6FD" />
                    <stop offset="100%" stopColor="#0284C7" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <h1
              className="quran-arabic-text"
              style={{
                fontFamily: "'Amiri', serif",
                fontSize: isPortrait ? '40px' : '56px',
                fontWeight: 700,
                color: '#F0F9FF',
                textShadow: '0 4px 25px rgba(56, 189, 248, 0.45)',
                margin: '0 0 12px 0',
                opacity: titleProgress,
                transform: `translateY(${titleTranslateY}px)`,
              }}
            >
              جَزَاكُمُ اللهُ خَيْرًا
            </h1>

            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: subtitleFontSize,
                color: 'rgba(224, 242, 254, 0.9)',
                margin: '0 0 20px 0',
                opacity: subProgress,
              }}
            >
              Thank you for listening & reflecting upon the Holy Quran
            </p>

            <div
              style={{
                opacity: ctaProgress,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 24px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.5)',
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#38BDF8',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {channelHandle ? `@${channelHandle}` : 'Subscribe for More'}
              </span>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* ─── PRESET 4: MODERN SUBSCRIBE ENDSCREEN ─── */}
      {preset === 'modern-subscribe' && (
        <AbsoluteFill
          style={{
            transform: `scale(${cameraZoom})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: `radial-gradient(circle at 50% 45%, rgba(244, 63, 94, 0.16) 0%, rgba(18, 18, 22, 0.94) 65%, #050508 100%)`,
          }}
        >
          <div
            style={{
              maxWidth: isPortrait ? '92%' : '760px',
              width: '100%',
              backgroundColor: 'rgba(20, 20, 28, 0.75)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: isPortrait ? '28px' : '36px',
              padding: isPortrait ? '36px 24px' : '48px 40px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(244, 63, 94, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {/* Channel Avatar with Pulse Ring */}
            <div
              style={{
                transform: `scale(${emblemSpring * pulseScale})`,
                opacity: emblemSpring,
                marginBottom: '20px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: '-12px',
                  borderRadius: '9999px',
                  background: 'radial-gradient(circle, rgba(244, 63, 94, 0.4) 0%, transparent 70%)',
                  filter: 'blur(12px)',
                }}
              />
              {hasValidLogo ? (
                <Img
                  src={resolvedLogo!}
                  style={{
                    width: logoSize,
                    height: logoSize,
                    borderRadius: '9999px',
                    objectFit: 'cover',
                    border: '3px solid #F43F5E',
                    boxShadow: '0 0 25px rgba(244, 63, 94, 0.5)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: logoSize,
                    height: logoSize,
                    borderRadius: '9999px',
                    backgroundColor: '#1E1B2E',
                    border: '3px solid #F43F5E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFF',
                    fontWeight: 700,
                    fontSize: '24px',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {channelHandle ? channelHandle.charAt(0).toUpperCase() : 'Q'}
                </div>
              )}
            </div>

            <h1
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: titleFontSize,
                fontWeight: 700,
                color: '#FFFFFF',
                margin: '0 0 8px 0',
                opacity: titleProgress,
                transform: `translateY(${titleTranslateY}px)`,
              }}
            >
              {channelHandle ? `@${channelHandle}` : 'Quran Video Creator'}
            </h1>

            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: subtitleFontSize,
                color: 'rgba(226, 232, 240, 0.8)',
                margin: '0 0 24px 0',
                opacity: subProgress,
              }}
            >
              {subtitle}
            </p>

            <div
              style={{
                opacity: ctaProgress,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 28px',
                borderRadius: '9999px',
                backgroundColor: '#F43F5E',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: isPortrait ? '14px' : '16px',
                boxShadow: '0 4px 20px rgba(244, 63, 94, 0.45)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
              <span>Like & Subscribe</span>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* ─── PRESET 5: CINEMATIC ANAMORPHIC FADE ─── */}
      {preset === 'cinematic-fade' && (
        <AbsoluteFill
          style={{
            transform: `scale(${cameraZoom})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000000',
          }}
        >
          {/* Anamorphic Flare Beam */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '2px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
              filter: 'blur(1px)',
              opacity: subProgress * 0.7,
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              maxWidth: isPortrait ? '94%' : '840px',
              padding: '0 24px',
              zIndex: 10,
            }}
          >
            <h1
              style={{
                fontFamily: "'Amiri', 'Cinzel', serif",
                fontSize: isPortrait ? '34px' : '48px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#F8FAFC',
                textShadow: '0 2px 20px rgba(255, 255, 255, 0.4)',
                margin: '0 0 14px 0',
                opacity: titleProgress,
                transform: `translateY(${titleTranslateY}px)`,
                filter: titleBlur > 0.5 ? `blur(${titleBlur}px)` : undefined,
              }}
            >
              {title}
            </h1>

            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: subtitleFontSize,
                letterSpacing: '0.08em',
                color: 'rgba(203, 213, 225, 0.75)',
                margin: '0 0 22px 0',
                opacity: subProgress,
              }}
            >
              {subtitle}
            </p>

            {channelHandle && (
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.6)',
                  letterSpacing: '0.1em',
                  opacity: ctaProgress,
                }}
              >
                @{channelHandle}
              </span>
            )}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
