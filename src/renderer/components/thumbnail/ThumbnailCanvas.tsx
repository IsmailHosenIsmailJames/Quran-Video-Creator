import React, { useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import { ThumbnailConfig } from '../../../shared/thumbnail-types';
import { VideoTemplateConfig, ReciterInfo } from '../../../shared/types';
import { getSurahByNumber } from '../../../shared/surahs';
import { getLocalizedHeader, getTranslationBookName } from '../../../shared/surah-localization';

export interface ThumbnailCanvasRef {
  exportDataUrl: (format?: 'png' | 'jpeg', quality?: number) => Promise<string>;
  getSvgElement: () => SVGSVGElement | null;
}

interface ThumbnailCanvasProps {
  config: ThumbnailConfig;
  videoConfig: VideoTemplateConfig;
  reciterInfo?: ReciterInfo;
  className?: string;
}

export const ThumbnailCanvas = forwardRef<ThumbnailCanvasRef, ThumbnailCanvasProps>(
  ({ config, videoConfig, reciterInfo, className = '' }, ref) => {
    const svgRef = useRef<SVGSVGElement | null>(null);

    const surahMeta = getSurahByNumber(videoConfig.surahNumber);
    const surahLigatureCode = `surah${String(videoConfig.surahNumber).padStart(3, '0')}`;
    const localized = getLocalizedHeader(videoConfig, videoConfig.surahNumber, 0);

    const reciterName = config.reciterNameText || reciterInfo?.name || 'Holy Quran Recitation';
    const reciterStyle = config.reciterStyleText || reciterInfo?.style;
    const translationBook = config.translationBadgeText || getTranslationBookName(videoConfig);

    const fromAyah = videoConfig.fromAyah;
    const toAyah = videoConfig.toAyah;
    const isFullSurah = fromAyah === 1 && toAyah === (surahMeta?.totalAyahs || 7);
    const ayahRangeText =
      config.ayahRangeBadgeText ||
      (isFullSurah
        ? `Surah ${videoConfig.surahNumber} • Full Surah (${surahMeta?.totalAyahs || 7} Verses)`
        : fromAyah === toAyah
        ? `Ayah ${fromAyah}`
        : `Ayah ${fromAyah} – ${toAyah}`);

    const surahEnglishName =
      config.englishSurahNameText ||
      `Surah ${surahMeta?.nameTransliterated || localized.surahName || 'Al-Quran'}`;
    const surahEnglishMeaning =
      config.englishMeaningText || (surahMeta?.nameEnglish ? `"${surahMeta.nameEnglish}"` : '');

    // Aspect ratio dimensions
    const { canvasWidth, canvasHeight } = useMemo(() => {
      if (config.aspectRatio === '9:16') return { canvasWidth: 1080, canvasHeight: 1920 };
      if (config.aspectRatio === '1:1') return { canvasWidth: 1080, canvasHeight: 1080 };
      return { canvasWidth: 1280, canvasHeight: 720 };
    }, [config.aspectRatio]);

    const isPortrait = config.aspectRatio === '9:16';
    const isSquare = config.aspectRatio === '1:1';

    // Scale factors
    const baseScale = isPortrait ? 1.4 : isSquare ? 1.15 : 1.0;
    const themeColor = config.accentThemeColor || '#F59E0B';

    // SVG export method
    useImperativeHandle(ref, () => ({
      getSvgElement: () => svgRef.current,
      exportDataUrl: async (format = 'png', quality = 0.95): Promise<string> => {
        const svgEl = svgRef.current;
        if (!svgEl) throw new Error('SVG Canvas is not mounted');

        const svgXml = new XMLSerializer().serializeToString(svgEl);
        const svgBlob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        return new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = canvasWidth;
              canvas.height = canvasHeight;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                URL.revokeObjectURL(svgUrl);
                return reject(new Error('Failed to get 2d context'));
              }

              // Background fill in case of transparency
              ctx.fillStyle = '#030406';
              ctx.fillRect(0, 0, canvasWidth, canvasHeight);
              ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

              const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
              const dataUrl = canvas.toDataURL(mimeType, quality);
              URL.revokeObjectURL(svgUrl);
              resolve(dataUrl);
            } catch (err) {
              URL.revokeObjectURL(svgUrl);
              reject(err);
            }
          };
          img.onerror = (err) => {
            URL.revokeObjectURL(svgUrl);
            reject(err);
          };
          img.src = svgUrl;
        });
      },
    }));

    // Background source selection
    const bgImageSrc = useMemo(() => {
      if (config.bgType === 'captured-frame' && config.bgCapturedDataUrl) {
        return config.bgCapturedDataUrl;
      }
      if (config.bgType === 'custom' && config.bgCustomUrl) {
        return config.bgCustomUrl;
      }
      return config.bgPresetUrl;
    }, [config.bgType, config.bgCapturedDataUrl, config.bgCustomUrl, config.bgPresetUrl]);

    // Positions & centers
    const centerX = canvasWidth / 2;
    const calligraphyY = isPortrait ? 420 : isSquare ? 320 : 255;
    const hookY = isPortrait ? 1380 : isSquare ? 780 : 540;

    return (
      <div
        className={`relative w-full flex items-center justify-center select-none overflow-hidden ${className}`}
        style={{
          aspectRatio: `${canvasWidth} / ${canvasHeight}`,
          maxHeight: '100%',
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          className="w-full h-full block drop-shadow-2xl"
        >
          <defs>
            {/* Theme & Gold linear gradients */}
            <linearGradient id="thumbThemeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="45%" stopColor={themeColor} />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            <linearGradient id="thumbGoldShimmer" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="35%" stopColor="#F59E0B" />
              <stop offset="70%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            <linearGradient id="thumbDarkVignette" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.85)" />
              <stop offset="40%" stopColor="rgba(0,0,0,0.15)" />
              <stop offset="75%" stopColor="rgba(0,0,0,0.4)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.92)" />
            </linearGradient>

            <radialGradient id="thumbCenterAura" cx="50%" cy="38%" r="48%">
              <stop offset="0%" stopColor={themeColor} stopOpacity="0.45" />
              <stop offset="60%" stopColor={themeColor} stopOpacity="0.08" />
              <stop offset="100%" stopColor={themeColor} stopOpacity="0" />
            </radialGradient>

            {/* Filter: Glow */}
            <filter id="thumbGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Filter: Intense Drop Shadow */}
            <filter id="thumbHeavyShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="#000000" floodOpacity="0.95" />
            </filter>

            {/* Filter: Hook Banner Glow */}
            <filter id="thumbHookGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="12" floodColor={themeColor} floodOpacity="0.5" />
            </filter>
          </defs>

          {/* 1. Base Background */}
          {config.bgType === 'gradient' ? (
            <rect
              width={canvasWidth}
              height={canvasHeight}
              fill={`url(#thumbThemeGrad)`}
            />
          ) : (
            <image
              href={bgImageSrc}
              width={canvasWidth}
              height={canvasHeight}
              preserveAspectRatio="xMidYMid slice"
              style={{
                filter: config.bgBlur > 0 ? `blur(${config.bgBlur}px)` : undefined,
              }}
            />
          )}

          {/* 2. Color Tint & Dimming Overlay */}
          <rect
            width={canvasWidth}
            height={canvasHeight}
            fill={config.bgOverlayColor}
            fillOpacity={config.bgOverlayOpacity}
          />

          {/* 3. Vignette Overlay (Dark edges for intense cinematic focus) */}
          {config.bgVignette && (
            <rect
              width={canvasWidth}
              height={canvasHeight}
              fill="url(#thumbDarkVignette)"
            />
          )}

          {/* 4. Center Radiant Aura */}
          <rect
            width={canvasWidth}
            height={canvasHeight}
            fill="url(#thumbCenterAura)"
            style={{ mixBlendMode: 'screen' }}
          />

          {/* 5. Divine Sunbeams (Optional) */}
          {config.showSunRays && (
            <g opacity="0.32" style={{ mixBlendMode: 'screen' }}>
              <polygon
                points={`${centerX},0 ${centerX - 240},${canvasHeight} ${centerX - 100},${canvasHeight}`}
                fill={themeColor}
              />
              <polygon
                points={`${centerX},0 ${centerX - 60},${canvasHeight} ${centerX + 60},${canvasHeight}`}
                fill={themeColor}
              />
              <polygon
                points={`${centerX},0 ${centerX + 120},${canvasHeight} ${centerX + 260},${canvasHeight}`}
                fill={themeColor}
              />
              <polygon
                points={`${centerX},0 ${centerX - 420},${canvasHeight} ${centerX - 280},${canvasHeight}`}
                fill="#FFFFFF"
                opacity="0.3"
              />
              <polygon
                points={`${centerX},0 ${centerX + 300},${canvasHeight} ${centerX + 440},${canvasHeight}`}
                fill="#FFFFFF"
                opacity="0.3"
              />
            </g>
          )}

          {/* 6. Golden Particle Sparks (Optional) */}
          {config.showGoldenSparks && (
            <g opacity="0.6">
              {[
                { cx: centerX - 320, cy: 160, r: 2.5, op: 0.8 },
                { cx: centerX - 220, cy: 90, r: 1.8, op: 0.6 },
                { cx: centerX + 260, cy: 120, r: 3.0, op: 0.9 },
                { cx: centerX + 380, cy: 220, r: 2.0, op: 0.7 },
                { cx: centerX - 420, cy: 340, r: 2.2, op: 0.85 },
                { cx: centerX + 440, cy: 380, r: 1.5, op: 0.6 },
                { cx: centerX - 140, cy: 410, r: 2.0, op: 0.75 },
                { cx: centerX + 180, cy: 450, r: 2.8, op: 0.9 },
              ].map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.cx}
                  cy={pt.cy}
                  r={pt.r}
                  fill={themeColor}
                  opacity={pt.op}
                  filter="url(#thumbGlow)"
                />
              ))}
            </g>
          )}

          {/* 7. Islamic Arch Frame (Optional Ornate Arch) */}
          {config.showIslamicArchFrame && (
            <g opacity="0.45">
              <path
                d={`M 70,${canvasHeight - 40}
                    L 70,280
                    Q 70,90 ${centerX},65
                    Q ${canvasWidth - 70},90 ${canvasWidth - 70},280
                    L ${canvasWidth - 70},${canvasHeight - 40}`}
                fill="none"
                stroke={themeColor}
                strokeWidth="2.5"
                strokeDasharray="8 4"
              />
              <path
                d={`M 84,${canvasHeight - 50}
                    L 84,285
                    Q 84,105 ${centerX},82
                    Q ${canvasWidth - 84},105 ${canvasWidth - 84},285
                    L ${canvasWidth - 84},${canvasHeight - 50}`}
                fill="none"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="1"
              />
              {/* Top Keystone Arch Finial / Crescent Point */}
              <circle
                cx={centerX}
                cy={65}
                r="7"
                fill={themeColor}
                filter="url(#thumbGlow)"
              />
            </g>
          )}

          {/* 8. Arabesque Corner Borders (Optional) */}
          {config.showArabesqueCorners && (
            <g stroke={themeColor} strokeWidth="2" fill="none" opacity="0.65">
              {/* Top-Left Corner */}
              <path d="M 32,70 L 32,32 L 70,32" />
              <rect x="30" y="30" width="8" height="8" fill={themeColor} />
              <path d="M 44,44 L 56,44 L 44,56 Z" fill={themeColor} opacity="0.4" />

              {/* Top-Right Corner */}
              <path d={`M ${canvasWidth - 70},32 L ${canvasWidth - 32},32 L ${canvasWidth - 32},70`} />
              <rect x={canvasWidth - 38} y="30" width="8" height="8" fill={themeColor} />
              <path d={`M ${canvasWidth - 44},44 L ${canvasWidth - 56},44 L ${canvasWidth - 44},56 Z`} fill={themeColor} opacity="0.4" />

              {/* Bottom-Left Corner */}
              <path d={`M 32,${canvasHeight - 70} L 32,${canvasHeight - 32} L 70,${canvasHeight - 32}`} />
              <rect x="30" y={canvasHeight - 38} width="8" height="8" fill={themeColor} />

              {/* Bottom-Right Corner */}
              <path d={`M ${canvasWidth - 70},${canvasHeight - 32} L ${canvasWidth - 32},${canvasHeight - 32} L ${canvasWidth - 32},${canvasHeight - 70}`} />
              <rect x={canvasWidth - 38} y={canvasHeight - 38} width="8" height="8" fill={themeColor} />
            </g>
          )}

          {/* ========================================================= */}
          {/* 9. Viral Eye-Catching Sticker Badge (Top Ribbon)          */}
          {/* ========================================================= */}
          {config.activeBadge !== 'none' && (
            <g
              transform={
                config.badgePosition === 'top-right'
                  ? `translate(${canvasWidth - 220}, 42)`
                  : config.badgePosition === 'bottom-left'
                  ? `translate(54, ${canvasHeight - 88})`
                  : `translate(54, 42)`
              }
            >
              {/* Badge backdrop with glow */}
              <rect
                x="0"
                y="0"
                width="168"
                height="38"
                rx="19"
                fill="#EF4444"
                filter="url(#thumbHeavyShadow)"
              />
              <rect
                x="1.5"
                y="1.5"
                width="165"
                height="35"
                rx="17.5"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                opacity="0.8"
              />
              <text
                x="84"
                y="24"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="14"
                fontWeight="800"
                fontFamily="Inter, sans-serif"
                letterSpacing="0.06em"
              >
                {config.badgeCustomText || '🔥 MUST LISTEN'}
              </text>
            </g>
          )}

          {/* ========================================================= */}
          {/* 10. Centerpiece: Surah Calligraphy & Vocalized Arabic     */}
          {/* ========================================================= */}
          {config.showSurahCalligraphy && (
            <g transform={`translate(${centerX}, ${calligraphyY})`}>
              {/* Radiant Calligraphy Halo */}
              <circle
                cx="0"
                cy="0"
                r={105 * (config.surahCalligraphyScale || 1.15)}
                fill={`url(#thumbCenterAura)`}
                filter="url(#thumbGlow)"
              />

              {/* Calligraphy Emblem vector glyph from surah-name-v1 */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="'surah-name-v1', sans-serif"
                fontSize={`${115 * (config.surahCalligraphyScale || 1.15) * baseScale}`}
                fill={config.surahCalligraphyColor || themeColor}
                filter="url(#thumbHeavyShadow)"
                style={{
                  textShadow: `0 0 45px ${themeColor}AA`,
                }}
              >
                {surahLigatureCode}
              </text>
            </g>
          )}

          {/* 11. Vocalized Arabic Surah Text (Optional) */}
          {config.showArabicSurahName && (
            <text
              x={centerX}
              y={calligraphyY + 76 * baseScale}
              textAnchor="middle"
              fontFamily="'Amiri', 'KFGQPC Uthmanic Script HAFS', serif"
              fontSize={`${config.arabicSurahNameSize * baseScale}`}
              fontWeight="700"
              fill={config.arabicSurahNameColor || '#FFFFFF'}
              filter="url(#thumbHeavyShadow)"
              style={{
                textShadow: '0 4px 18px rgba(0,0,0,0.95)',
              }}
            >
              سُورَةُ {surahMeta?.nameArabic || ''}
            </text>
          )}

          {/* 12. Transliterated English Surah Title */}
          {config.showEnglishSurahName && (
            <g transform={`translate(${centerX}, ${calligraphyY + 128 * baseScale})`}>
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize={`${config.englishSurahNameSize * baseScale}`}
                fontWeight="900"
                letterSpacing="0.04em"
                fill={config.englishSurahNameColor || '#FFFFFF'}
                filter="url(#thumbHeavyShadow)"
                style={{
                  textShadow: `0 6px 24px rgba(0,0,0,0.95), 0 0 35px ${themeColor}66`,
                }}
              >
                {surahEnglishName.toUpperCase()}
              </text>

              {/* English Meaning Subtitle */}
              {config.showEnglishMeaning && surahEnglishMeaning && (
                <text
                  x="0"
                  y={28 * baseScale}
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontSize={`${18 * baseScale}`}
                  fontWeight="600"
                  fill="rgba(255, 255, 255, 0.88)"
                  letterSpacing="0.06em"
                  filter="url(#thumbHeavyShadow)"
                >
                  {surahEnglishMeaning}
                </text>
              )}
            </g>
          )}

          {/* 13. Ayah Range Pill Badge */}
          {config.showAyahRangeBadge && (
            <g transform={`translate(${centerX}, ${calligraphyY + 185 * baseScale})`}>
              <rect
                x="-140"
                y="-16"
                width="280"
                height="32"
                rx="16"
                fill="rgba(10, 12, 16, 0.85)"
                stroke={themeColor}
                strokeWidth="1.5"
                filter="url(#thumbHeavyShadow)"
              />
              <text
                x="0"
                y="5"
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize={`${13 * baseScale}`}
                fontWeight="700"
                fill="#FFFFFF"
                letterSpacing="0.08em"
              >
                {ayahRangeText.toUpperCase()}
              </text>
            </g>
          )}

          {/* ========================================================= */}
          {/* 14. High-Converting Click Hook Title Banner               */}
          {/* ========================================================= */}
          {config.showHookTitle && (
            <g transform={`translate(${centerX}, ${hookY})`}>
              {/* Optional Background Banner Style */}
              {config.hookTitleBgStyle === 'gradient-pill' && (
                <g filter="url(#thumbHookGlow)">
                  <rect
                    x={isPortrait ? -480 : -520}
                    y="-38"
                    width={isPortrait ? 960 : 1040}
                    height="76"
                    rx="38"
                    fill="rgba(12, 15, 24, 0.85)"
                    stroke={config.hookTitleStrokeColor || themeColor}
                    strokeWidth="2"
                  />
                </g>
              )}

              {config.hookTitleBgStyle === 'solid-banner' && (
                <rect
                  x={-canvasWidth / 2}
                  y="-42"
                  width={canvasWidth}
                  height="84"
                  fill="rgba(0, 0, 0, 0.9)"
                  stroke={themeColor}
                  strokeWidth="2"
                />
              )}

              {config.hookTitleBgStyle === 'glass-card' && (
                <rect
                  x={isPortrait ? -460 : -480}
                  y="-36"
                  width={isPortrait ? 920 : 960}
                  height="72"
                  rx="20"
                  fill="rgba(255, 255, 255, 0.08)"
                  stroke="rgba(255, 255, 255, 0.25)"
                  strokeWidth="1.5"
                  filter="url(#thumbHeavyShadow)"
                />
              )}

              {/* Main Hook Title Text with Outline & Glow */}
              <text
                x="0"
                y="6"
                textAnchor="middle"
                fontFamily="Inter, Impact, sans-serif"
                fontSize={`${config.hookTitleFontSize * baseScale}`}
                fontWeight="900"
                letterSpacing="0.06em"
                fill={config.hookTitleColor || '#FBBF24'}
                stroke={config.hookTitleStroke ? config.hookTitleStrokeColor || '#000000' : 'none'}
                strokeWidth={config.hookTitleStroke ? config.hookTitleStrokeWidth * 3 : 0}
                style={{
                  paintOrder: 'stroke fill',
                  textShadow: config.hookTitleGlow
                    ? `0 0 25px ${themeColor}, 0 6px 18px rgba(0,0,0,0.9)`
                    : '0 6px 18px rgba(0,0,0,0.9)',
                }}
              >
                {config.hookTitleText.toUpperCase()}
              </text>

              {/* Hook Subtitle */}
              {config.hookTitleSubtitle && (
                <text
                  x="0"
                  y="36"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontSize={`${15 * baseScale}`}
                  fontWeight="600"
                  fill="#FFFFFF"
                  letterSpacing="0.05em"
                  filter="url(#thumbHeavyShadow)"
                >
                  {config.hookTitleSubtitle}
                </text>
              )}
            </g>
          )}

          {/* ========================================================= */}
          {/* 15. Bottom Attribution: Reciter & Translation Badges      */}
          {/* ========================================================= */}
          <g transform={`translate(${centerX}, ${canvasHeight - 56})`}>
            {/* Reciter Badge */}
            {config.showReciterBadge && (
              <g transform="translate(-170, 0)">
                <rect
                  x="-120"
                  y="-17"
                  width="240"
                  height="34"
                  rx="17"
                  fill="rgba(10, 12, 16, 0.85)"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="1"
                  filter="url(#thumbHeavyShadow)"
                />
                <text
                  x="0"
                  y="5"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontSize="13"
                  fontWeight="700"
                  fill="#FFFFFF"
                >
                  🎙️ {reciterName} {reciterStyle ? `(${reciterStyle})` : ''}
                </text>
              </g>
            )}

            {/* Translation Badge */}
            {config.showTranslationBadge && translationBook && (
              <g transform="translate(170, 0)">
                <rect
                  x="-120"
                  y="-17"
                  width="240"
                  height="34"
                  rx="17"
                  fill="rgba(10, 12, 16, 0.85)"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="1"
                  filter="url(#thumbHeavyShadow)"
                />
                <text
                  x="0"
                  y="5"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontSize="12"
                  fontWeight="600"
                  fill="rgba(255, 255, 255, 0.9)"
                >
                  📖 {translationBook}
                </text>
              </g>
            )}
          </g>

          {/* ========================================================= */}
          {/* 16. YouTube Safe Zones & Helpers (Toggleable Guide)       */}
          {/* ========================================================= */}
          {config.showYouTubeSafeZone && (
            <g opacity="0.95">
              {/* Red warning border around bottom-right YouTube timestamp area */}
              <rect
                x={canvasWidth - 145}
                y={canvasHeight - 58}
                width="135"
                height="48"
                rx="6"
                fill="rgba(239, 68, 68, 0.35)"
                stroke="#EF4444"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              {/* Simulated YouTube timestamp pill */}
              <rect
                x={canvasWidth - 110}
                y={canvasHeight - 44}
                width="95"
                height="28"
                rx="4"
                fill="rgba(0, 0, 0, 0.92)"
              />
              <text
                x={canvasWidth - 62}
                y={canvasHeight - 25}
                textAnchor="middle"
                fontFamily="sans-serif"
                fontSize="14"
                fontWeight="700"
                fill="#FFFFFF"
              >
                14:28
              </text>
              <text
                x={canvasWidth - 72}
                y={canvasHeight - 64}
                textAnchor="middle"
                fontFamily="sans-serif"
                fontSize="10"
                fontWeight="700"
                fill="#EF4444"
              >
                YT Time Badge (Keep Clear)
              </text>
            </g>
          )}

          {/* 17. Rule of Thirds Grid (Toggleable Guide) */}
          {config.showRuleOfThirds && (
            <g stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" strokeDasharray="6 4">
              <line x1={canvasWidth / 3} y1="0" x2={canvasWidth / 3} y2={canvasHeight} />
              <line x1={(canvasWidth / 3) * 2} y1="0" x2={(canvasWidth / 3) * 2} y2={canvasHeight} />
              <line x1="0" y1={canvasHeight / 3} x2={canvasWidth} y2={canvasHeight / 3} />
              <line x1="0" y1={(canvasHeight / 3) * 2} x2={canvasWidth} y2={(canvasHeight / 3) * 2} />
            </g>
          )}
        </svg>
      </div>
    );
  }
);

ThumbnailCanvas.displayName = 'ThumbnailCanvas';
