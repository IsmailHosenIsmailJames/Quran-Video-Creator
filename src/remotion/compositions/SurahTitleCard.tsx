import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from 'remotion';
import { VideoTemplateConfig, TransitionType, ReciterInfo } from '../../shared/types';
import { getSurahByNumber } from '../../shared/surahs';
import { getLocalizedHeader, getTranslationBookName } from '../../shared/surah-localization';

interface SurahTitleCardProps {
  config: VideoTemplateConfig;
  reciterInfo?: ReciterInfo;
  durationInFrames: number;
  transition?: TransitionType;
}

export const SurahTitleCard: React.FC<SurahTitleCardProps> = ({
  config,
  reciterInfo,
  durationInFrames,
  transition = 'dip-black',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const isPortrait = width < height; // 9:16 Shorts / Reels
  const isSquare = width === height; // 1:1 Square

  const surahMeta = getSurahByNumber(config.surahNumber);
  const surahLigatureCode = `surah${String(config.surahNumber).padStart(3, '0')}`;
  const localized = getLocalizedHeader(config, config.surahNumber, 0);

  const preset = config.titleCardPreset || 'royal-gold';
  const themeColor = config.titleCardThemeColor || '#F59E0B';

  // Reciter & recitation style info
  const reciterName = reciterInfo?.name?.trim() || 'Holy Quran Recitation';
  const reciterStyle = reciterInfo?.style?.trim();

  // Translation book name
  const translationBookName = getTranslationBookName(config);

  // Ayah range text
  const fromAyah = config.fromAyah;
  const toAyah = config.toAyah;
  const ayahRangeText =
    fromAyah === toAyah
      ? `Ayah ${fromAyah}`
      : `Ayah ${fromAyah} – ${toAyah}`;

  // Exit transition fade / zoom calculation
  const exitFrames = Math.min(18, Math.round(durationInFrames * 0.22));
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

  // Camera slow push-in throughout the entire title card
  const cameraZoom = interpolate(frame, [0, durationInFrames], [0.97, 1.03], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.2, 0, 0.3, 1),
  });

  // Entrance spring for top sacred badge / emblem
  const emblemSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.9 },
  });

  // Stagger 1: Arabic Calligraphy Entrance
  const arabicProgress = interpolate(
    frame,
    [Math.round(fps * 0.2), Math.round(fps * 0.75)],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );
  const arabicTranslateY = interpolate(arabicProgress, [0, 1], [30, 0]);
  const arabicBlur = interpolate(arabicProgress, [0, 1], [10, 0]);

  // Stagger 2: Transliteration & Meaning Entrance
  const titleProgress = interpolate(
    frame,
    [Math.round(fps * 0.4), Math.round(fps * 0.95)],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );
  const titleTranslateY = interpolate(titleProgress, [0, 1], [22, 0]);

  // Stagger 3: Ornate Divider expansion
  const dividerProgress = interpolate(
    frame,
    [Math.round(fps * 0.55), Math.round(fps * 1.1)],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.quad),
    }
  );

  // Stagger 4: Metadata Pills (Reciter, Style, Ayah range)
  const metaProgress = interpolate(
    frame,
    [Math.round(fps * 0.7), Math.round(fps * 1.25)],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );
  const metaTranslateY = interpolate(metaProgress, [0, 1], [18, 0]);

  // Theme preset color & background definitions
  let bgGradient = `radial-gradient(circle at 50% 45%, ${themeColor}24 0%, rgba(5,7,10,0.88) 60%, #030406 100%)`;
  let cardBorderColor = `${themeColor}40`;
  let cardBgColor = 'rgba(10, 12, 16, 0.75)';
  let accentGradient = `linear-gradient(135deg, #FFFFFF 0%, ${themeColor} 50%, #F59E0B 100%)`;

  if (preset === 'celestial-emerald') {
    bgGradient = `radial-gradient(circle at 50% 40%, rgba(16, 185, 129, 0.22) 0%, rgba(4, 30, 24, 0.9) 65%, #02120e 100%)`;
    cardBorderColor = 'rgba(16, 185, 129, 0.35)';
    cardBgColor = 'rgba(4, 25, 20, 0.75)';
    accentGradient = `linear-gradient(135deg, #FFFFFF 0%, #34D399 50%, #059669 100%)`;
  } else if (preset === 'cinematic-glass') {
    bgGradient = `radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.16) 0%, rgba(15, 23, 42, 0.92) 65%, #050811 100%)`;
    cardBorderColor = 'rgba(255, 255, 255, 0.2)';
    cardBgColor = 'rgba(15, 23, 42, 0.6)';
    accentGradient = `linear-gradient(135deg, #FFFFFF 0%, #38BDF8 60%, #0284C7 100%)`;
  } else if (preset === 'minimal-noir') {
    bgGradient = `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.08) 0%, rgba(12, 12, 14, 0.96) 65%, #000000 100%)`;
    cardBorderColor = 'rgba(255, 255, 255, 0.14)';
    cardBgColor = 'rgba(14, 14, 18, 0.8)';
    accentGradient = `linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 60%, #94A3B8 100%)`;
  } else if (preset === 'sacred-medina') {
    bgGradient = `radial-gradient(circle at 50% 42%, rgba(129, 140, 248, 0.22) 0%, rgba(15, 23, 60, 0.9) 65%, #050819 100%)`;
    cardBorderColor = 'rgba(129, 140, 248, 0.35)';
    cardBgColor = 'rgba(15, 20, 48, 0.75)';
    accentGradient = `linear-gradient(135deg, #FFFFFF 0%, #F59E0B 45%, #818CF8 100%)`;
  }

  // Adaptive font and spacing scales
  const calligraphySize = isPortrait ? 68 : isSquare ? 76 : 94;
  const transliterationSize = isPortrait ? 30 : isSquare ? 34 : 44;
  const englishSize = isPortrait ? 15 : 18;
  const pillFontSize = isPortrait ? 13 : 15;
  const paddingX = isPortrait ? '24px' : '48px';
  const paddingY = isPortrait ? '36px' : '52px';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#030406',
        backgroundImage: bgGradient,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: exitOpacity,
        transform: `scale(${exitScale})`,
      }}
    >
      {/* Background Ambient Shimmer Dust */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.35,
          backgroundImage: `radial-gradient(circle at 25% 25%, ${themeColor}77 1px, transparent 1px),
                            radial-gradient(circle at 75% 20%, ${themeColor}77 1.5px, transparent 1.5px),
                            radial-gradient(circle at 35% 75%, ${themeColor}77 1.2px, transparent 1.2px),
                            radial-gradient(circle at 80% 80%, ${themeColor}77 1.5px, transparent 1.5px)`,
          backgroundSize: '260px 260px',
        }}
      />

      {/* Main Scaled Content Container */}
      <div
        style={{
          transform: `scale(${cameraZoom})`,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 20px',
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: isPortrait ? '94%' : isSquare ? '90%' : '1100px',
            width: '100%',
            backgroundColor: cardBgColor,
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: `1px solid ${cardBorderColor}`,
            borderRadius: isPortrait ? '28px' : '36px',
            padding: `${paddingY} ${paddingX}`,
            boxShadow: `0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 50px ${themeColor}18`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Top Surah Number & Revelation Type Badge */}
          <div
            style={{
              transform: `scale(${emblemSpring})`,
              opacity: emblemSpring,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 18px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${cardBorderColor}`,
              marginBottom: isPortrait ? '20px' : '26px',
            }}
          >
            <span
              style={{
                fontSize: isPortrait ? '12px' : '13px',
                fontWeight: 700,
                color: themeColor,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Surah {config.surahNumber}
            </span>
            <span
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
              }}
            />
            <span
              style={{
                fontSize: isPortrait ? '11px' : '12px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.75)',
                letterSpacing: '0.04em',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {surahMeta?.revelationType || 'Holy Quran'} • {surahMeta?.totalAyahs || 7} Verses
            </span>
          </div>

          {/* 1. Surah Name in Arabic Calligraphy */}
          <div
            style={{
              opacity: arabicProgress,
              transform: `translateY(${arabicTranslateY}px)`,
              filter: arabicBlur > 0.5 ? `blur(${arabicBlur}px)` : undefined,
              marginBottom: isPortrait ? '12px' : '18px',
              position: 'relative',
            }}
          >
            {/* Ambient Calligraphy Glow Behind Text */}
            <div
              style={{
                position: 'absolute',
                inset: '-12px',
                background: `radial-gradient(circle, ${themeColor}40 0%, transparent 70%)`,
                filter: 'blur(20px)',
                zIndex: -1,
              }}
            />
            <span
              className="surah-calligraphy-title"
              style={{
                fontFamily: "'surah-name-v1', sans-serif",
                fontSize: `${calligraphySize}px`,
                lineHeight: 1.1,
                color: themeColor,
                textShadow: `0 0 35px ${themeColor}88, 0 4px 18px rgba(0,0,0,0.9)`,
                display: 'inline-block',
              }}
            >
              {surahLigatureCode}
            </span>

            {/* Vocalized Arabic Name fallback / accent */}
            <p
              className="quran-arabic-text"
              style={{
                fontFamily: "'Amiri', 'KFGQPC Uthmanic Script HAFS', serif",
                fontSize: isPortrait ? '22px' : '28px',
                color: 'rgba(255, 255, 255, 0.92)',
                margin: '4px 0 0 0',
                lineHeight: 1.3,
                letterSpacing: '0.02em',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)',
              }}
            >
              سُورَةُ {surahMeta?.nameArabic || ''}
            </p>
          </div>

          {/* 2. Surah Name in Transliteration & English/Localized Meaning */}
          <div
            style={{
              opacity: titleProgress,
              transform: `translateY(${titleTranslateY}px)`,
              marginBottom: isPortrait ? '20px' : '26px',
            }}
          >
            <h1
              style={{
                fontFamily: "'Inter', 'Amiri', sans-serif",
                fontSize: `${transliterationSize}px`,
                fontWeight: 700,
                letterSpacing: isPortrait ? '0.02em' : '0.04em',
                background: accentGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: '0 0 6px 0',
                lineHeight: 1.2,
                textShadow: `0 4px 20px ${themeColor}33`,
              }}
            >
              Surah {surahMeta?.nameTransliterated || localized.surahName}
            </h1>

            <p
              style={{
                fontFamily: localized.fontFamily || 'Inter, sans-serif',
                fontSize: `${englishSize}px`,
                color: 'rgba(226, 232, 240, 0.85)',
                margin: 0,
                fontWeight: 400,
                letterSpacing: '0.02em',
              }}
            >
              {surahMeta?.nameEnglish ? `"${surahMeta.nameEnglish}"` : ''}
              {localized.surahName && localized.surahName !== surahMeta?.nameTransliterated
                ? ` • ${localized.surahName}`
                : ''}
            </p>
          </div>

          {/* 3. Ornate Geometric Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              maxWidth: isPortrait ? '260px' : '460px',
              marginBottom: isPortrait ? '20px' : '28px',
              opacity: dividerProgress,
            }}
          >
            <div
              style={{
                flex: 1,
                height: '1px',
                background: `linear-gradient(90deg, transparent, ${themeColor})`,
                transform: `scaleX(${dividerProgress})`,
                transformOrigin: 'right center',
              }}
            />
            {/* Center Golden Diamond Motif */}
            <div
              style={{
                width: '9px',
                height: '9px',
                transform: 'rotate(45deg)',
                backgroundColor: themeColor,
                boxShadow: `0 0 10px ${themeColor}`,
                flexShrink: 0,
              }}
            />
            <div
              style={{
                flex: 1,
                height: '1px',
                background: `linear-gradient(90deg, ${themeColor}, transparent)`,
                transform: `scaleX(${dividerProgress})`,
                transformOrigin: 'left center',
              }}
            />
          </div>

          {/* 4. Metadata Badges: Verse Range, Reciter Name, Style */}
          <div
            style={{
              opacity: metaProgress,
              transform: `translateY(${metaTranslateY}px)`,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isPortrait ? '10px' : '14px',
              maxWidth: '95%',
            }}
          >
            {/* Verse Range Badge */}
            {config.showVerseRangeInTitleCard !== false && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: isPortrait ? '8px 16px' : '10px 22px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: `1px solid ${cardBorderColor}`,
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={themeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                <span
                  style={{
                    fontSize: `${pillFontSize}px`,
                    fontWeight: 600,
                    color: '#FFFFFF',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {ayahRangeText}
                </span>
              </div>
            )}

            {/* Reciter Name Badge */}
            {config.showReciterInTitleCard !== false && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: isPortrait ? '8px 16px' : '10px 22px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: `1px solid ${cardBorderColor}`,
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={themeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
                <span
                  style={{
                    fontSize: `${pillFontSize}px`,
                    fontWeight: 600,
                    color: '#FFFFFF',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {reciterName}
                </span>
              </div>
            )}

            {/* Recitation Style Badge (Optional) */}
            {config.showStyleInTitleCard !== false && reciterStyle && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: isPortrait ? '8px 14px' : '10px 18px',
                  borderRadius: '9999px',
                  backgroundColor: `${themeColor}18`,
                  border: `1px solid ${themeColor}55`,
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '9999px',
                    backgroundColor: themeColor,
                  }}
                />
                <span
                  style={{
                    fontSize: `${pillFontSize - 1}px`,
                    fontWeight: 600,
                    color: themeColor,
                    letterSpacing: '0.04em',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {reciterStyle}
                </span>
              </div>
            )}

            {/* Translation Book Badge */}
            {config.showTranslationInTitleCard !== false && translationBookName && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: isPortrait ? '8px 16px' : '10px 22px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: `1px solid ${cardBorderColor}`,
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={themeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 8 6 6" />
                  <path d="m4 14 6-6 2-3" />
                  <path d="M2 5h12" />
                  <path d="M7 2h1" />
                  <path d="m22 22-5-10-5 10" />
                  <path d="M14 18h6" />
                </svg>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      fontSize: `${pillFontSize - 1}px`,
                      color: 'rgba(255, 255, 255, 0.65)',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                    }}
                  >
                    Translation:
                  </span>
                  <span
                    style={{
                      fontSize: `${pillFontSize}px`,
                      fontWeight: 600,
                      color: '#FFFFFF',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {translationBookName}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
