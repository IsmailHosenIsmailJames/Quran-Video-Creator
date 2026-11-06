import { ThumbnailConfig, ThumbnailLayoutMode } from '../../../shared/thumbnail-types';
import { VideoTemplateConfig, ReciterInfo } from '../../../shared/types';
import { getSurahByNumber } from '../../../shared/surahs';
import {
  getLocalizedHeader,
  getTranslationBookName,
  getBengaliSurahTitle,
  getBengaliReciterName,
  getSurahNameLocalized,
} from '../../../shared/surah-localization';

export interface RenderThumbnailOptions {
  config: ThumbnailConfig;
  videoConfig: VideoTemplateConfig;
  reciterInfo?: ReciterInfo;
}

// In-memory cache for decoded HTMLImageElements to allow instant reactive rendering
const imageCache = new Map<string, HTMLImageElement>();

/**
 * Loads an image from URL or data URL and caches it.
 */
export function loadCachedImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (imageCache.has(url)) {
      const cached = imageCache.get(url)!;
      if (cached.complete && cached.naturalWidth > 0) {
        return resolve(cached);
      }
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = (err) => {
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Ensures all custom fonts are ready before canvas drawing
 */
export async function ensureFontsLoaded(): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
      await document.fonts.load("120px 'surah-name-v1'");
      await document.fonts.load("34px 'Amiri'");
    } catch (e) {
      // Font load error fallback
    }
  }
}

/**
 * Utility: Draws a rounded rectangle path
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Creates a rich 24K liquid gold linear gradient
 */
function createLiquidGoldGradient(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): CanvasGradient {
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0.0, '#FFFFFF');
  grad.addColorStop(0.2, '#FEF08A');
  grad.addColorStop(0.5, '#F59E0B');
  grad.addColorStop(0.8, '#D97706');
  grad.addColorStop(1.0, '#92400E');
  return grad;
}

/**
 * Creates a sleek metallic platinum linear gradient
 */
function createPlatinumGradient(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): CanvasGradient {
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0.0, '#FFFFFF');
  grad.addColorStop(0.4, '#F1F5F9');
  grad.addColorStop(0.7, '#CBD5E1');
  grad.addColorStop(1.0, '#94A3B8');
  return grad;
}

/**
 * Draws delicate modern Islamic geometric corner brackets (1.5px hairline)
 */
function drawArabesqueCorner(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
  quadrant: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
) {
  ctx.save();
  ctx.translate(cx, cy);
  const sx = quadrant === 'top-right' || quadrant === 'bottom-right' ? -1 : 1;
  const sy = quadrant === 'bottom-left' || quadrant === 'bottom-right' ? -1 : 1;
  ctx.scale(sx, sy);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;

  // L-Frame
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.stroke();

  // Outer corner node
  ctx.fillRect(-2, -2, 4, 4);

  // Inner 45-degree diamond facet
  ctx.beginPath();
  ctx.moveTo(12, 12);
  ctx.lineTo(24, 12);
  ctx.lineTo(12, 24);
  ctx.closePath();
  ctx.globalAlpha = 0.35;
  ctx.fill();

  ctx.restore();
}

/**
 * Draws an elegant Moorish horseshoe arch with gold glow finial
 */
function drawMoorishArch(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string
) {
  ctx.save();
  const centerX = w / 2;
  const margin = 60;
  const topY = 65;
  const springY = 280;

  // Outer Arch
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.0;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(margin, h - 40);
  ctx.lineTo(margin, springY);
  ctx.quadraticCurveTo(margin, topY + 25, centerX, topY);
  ctx.quadraticCurveTo(w - margin, topY + 25, w - margin, springY);
  ctx.lineTo(w - margin, h - 40);
  ctx.stroke();

  // Inner fine hairline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.0;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(margin + 12, h - 50);
  ctx.lineTo(margin + 12, springY + 5);
  ctx.quadraticCurveTo(margin + 12, topY + 38, centerX, topY + 14);
  ctx.quadraticCurveTo(w - (margin + 12), topY + 38, w - (margin + 12), springY + 5);
  ctx.lineTo(w - (margin + 12), h - 50);
  ctx.stroke();

  // Top Keystone Star Finial
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(centerX, topY, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws volumetric sunbeams
 */
function drawSunRays(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string
) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = color;

  const cx = w / 2;
  const rays = [
    [-340, -180],
    [-140, -40],
    [30, 140],
    [210, 360],
    [-520, -380],
    [400, 540],
  ];

  for (const [x1, x2] of rays) {
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx + x1, h);
    ctx.lineTo(cx + x2, h);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws shimmering golden bokeh sparks
 */
function drawGoldenSparks(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string
) {
  ctx.save();
  const cx = w / 2;
  const sparks = [
    { x: cx - 380, y: 140, r: 2.2, a: 0.8 },
    { x: cx - 240, y: 80, r: 1.8, a: 0.6 },
    { x: cx + 290, y: 110, r: 3.0, a: 0.9 },
    { x: cx + 420, y: 220, r: 2.0, a: 0.7 },
    { x: cx - 440, y: 340, r: 2.2, a: 0.85 },
    { x: cx + 460, y: 390, r: 1.6, a: 0.6 },
    { x: cx - 180, y: 430, r: 2.0, a: 0.75 },
    { x: cx + 210, y: 470, r: 2.8, a: 0.9 },
    { x: cx - 80, y: 260, r: 1.4, a: 0.5 },
    { x: cx + 110, y: 290, r: 1.9, a: 0.65 },
  ];

  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;

  for (const s of sparks) {
    ctx.globalAlpha = s.a;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Main Direct Canvas 2D Rendering Engine
 */
export async function renderThumbnailToCanvas(
  canvas: HTMLCanvasElement,
  options: RenderThumbnailOptions
): Promise<void> {
  const { config, videoConfig, reciterInfo } = options;

  // Determine pixel dimensions based on aspect ratio
  let w = 1280;
  let h = 720;
  if (config.aspectRatio === '9:16') {
    w = 1080;
    h = 1920;
  } else if (config.aspectRatio === '1:1') {
    w = 1080;
    h = 1080;
  }

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context for thumbnail canvas');

  // Ensure all fonts are ready before drawing
  await ensureFontsLoaded();

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

  const themeColor = config.accentThemeColor || '#F59E0B';
  const isPortrait = config.aspectRatio === '9:16';
  const isSquare = config.aspectRatio === '1:1';
  const scaleMod = isPortrait ? 1.45 : isSquare ? 1.15 : 1.0;

  // Determine Background Source
  let bgSrc = config.bgPresetUrl;
  if (config.bgType === 'captured-frame' && config.bgCapturedDataUrl) {
    bgSrc = config.bgCapturedDataUrl;
  } else if (config.bgType === 'custom' && config.bgCustomUrl) {
    bgSrc = config.bgCustomUrl;
  }

  // 1. Draw Background
  if (config.bgType === 'gradient') {
    const angleRad = ((config.bgGradientAngle || 135) * Math.PI) / 180;
    const x2 = Math.cos(angleRad) * w;
    const y2 = Math.sin(angleRad) * h;
    const grad = ctx.createLinearGradient(0, 0, x2, y2);
    grad.addColorStop(0, config.bgGradientFrom || '#03050a');
    grad.addColorStop(1, config.bgGradientTo || '#0b1329');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (bgSrc) {
    try {
      const img = await loadCachedImage(bgSrc);
      ctx.save();
      if (config.bgBlur > 0) {
        ctx.filter = `blur(${config.bgBlur}px)`;
      }
      // Aspect fill (cover)
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = w / h;
      let drawW = w;
      let drawH = h;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > canvasRatio) {
        drawH = h;
        drawW = h * imgRatio;
        offsetX = (w - drawW) / 2;
      } else {
        drawW = w;
        drawH = w / imgRatio;
        offsetY = (h - drawH) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      ctx.restore();
    } catch (e) {
      // Fallback dark obsidian gradient if image fails to load
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#03050a');
      grad.addColorStop(1, '#0e1628');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
  } else {
    ctx.fillStyle = '#03050a';
    ctx.fillRect(0, 0, w, h);
  }

  // 2. Dimming & Overlay Tint
  ctx.save();
  ctx.fillStyle = config.bgOverlayColor || '#03050a';
  ctx.globalAlpha = config.bgOverlayOpacity ?? 0.5;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // 3. Cinematic Vignette (Deep dark corners for focus)
  if (config.bgVignette) {
    ctx.save();
    const maxRadius = Math.sqrt(w * w + h * h) / 2;
    const vigGrad = ctx.createRadialGradient(w / 2, h / 2, maxRadius * 0.35, w / 2, h / 2, maxRadius);
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(0.65, 'rgba(0,0,0,0.45)');
    vigGrad.addColorStop(1.0, 'rgba(0,0,0,0.92)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // 4. Volumetric Sunbeams & God-Rays
  if (config.showSunRays) {
    drawSunRays(ctx, w, h, themeColor);
  }

  // 5. Golden Bokeh Particle Sparks
  if (config.showGoldenSparks) {
    drawGoldenSparks(ctx, w, h, themeColor);
  }

  // 6. Islamic Moorish Arch Frame (Optional)
  if (config.showIslamicArchFrame) {
    drawMoorishArch(ctx, w, h, themeColor);
  }

  // 7. Arabesque Corner Brackets (Luxury 1.5px Hairline Accents)
  if (config.showArabesqueCorners) {
    const margin = isPortrait ? 52 : 36;
    const size = isPortrait ? 54 : 40;
    drawArabesqueCorner(ctx, margin, margin, size, themeColor, 'top-left');
    drawArabesqueCorner(ctx, w - margin, margin, size, themeColor, 'top-right');
    drawArabesqueCorner(ctx, margin, h - margin, size, themeColor, 'bottom-left');
    drawArabesqueCorner(ctx, w - margin, h - margin, size, themeColor, 'bottom-right');
  }

  // =========================================================================
  // 8. LAYOUT ARCHETYPES RENDERING
  // =========================================================================
  const layoutMode: ThumbnailLayoutMode = config.layoutMode || 'reciter-focus';

  if (layoutMode === 'reciter-focus') {
    // -----------------------------------------------------------------------
    // LAYOUT 0: RECITER-FOCUSED VIRAL FORMAT (References 1, 2, 3, 4, 5)
    // One side: High-Res Reciter Portrait with soft bottom-fade & ambient drop shadow
    // Mid layer: Directional shadow ramp behind text side
    // Other side: High-contrast 3D Gold / Bengali / Calligraphy Typography
    // -----------------------------------------------------------------------
    const isRight = (config.reciterPortraitPosition || 'right') === 'right';
    const textOnLeft = isRight;

    // 1. Draw Reciter Portrait
    if (config.showReciterPortrait !== false) {
      let reciterSrc: string | null = null;
      if (config.reciterPortraitSource === 'custom' && config.reciterPortraitCustomUrl) {
        reciterSrc = config.reciterPortraitCustomUrl;
      } else if (config.reciterPortraitSource === 'captured-frame' && config.bgCapturedDataUrl) {
        reciterSrc = config.bgCapturedDataUrl;
      } else if (reciterInfo?.local_img) {
        reciterSrc = '/' + reciterInfo.local_img;
      } else if (reciterInfo?.img) {
        reciterSrc = reciterInfo.img;
      }

      if (reciterSrc) {
        try {
          const pImg = await loadCachedImage(reciterSrc);
          if (pImg && pImg.naturalWidth > 0) {
            const scale = (config.reciterPortraitScale || 1.15) * (isPortrait ? 1.25 : 1.0);
            const offsetX = config.reciterPortraitOffsetX || 0;
            const offsetY = config.reciterPortraitOffsetY || 0;

            const boxW = (isPortrait ? w * 0.85 : w * 0.58) * scale;
            const boxH = (isPortrait ? h * 0.55 : h * 1.08) * scale;
            const centerX = isPortrait
              ? w * 0.5 + offsetX
              : (isRight ? w * 0.72 : w * 0.28) + offsetX;
            const centerY = isPortrait
              ? h * 0.35 + offsetY
              : h * 0.52 + offsetY;

            const imgRatio = pImg.naturalWidth / pImg.naturalHeight;
            const boxRatio = boxW / boxH;
            let drawW = boxW;
            let drawH = boxH;

            if (imgRatio > boxRatio) {
              drawW = boxW;
              drawH = boxW / imgRatio;
            } else {
              drawH = boxH;
              drawW = boxH * imgRatio;
            }

            const drawX = centerX - drawW / 2;
            const drawY = centerY - drawH / 2;

            ctx.save();

            // Ambient Edge Glow (if enabled)
            if (config.reciterPortraitGlow) {
              const glowGrad = ctx.createRadialGradient(
                centerX,
                centerY,
                50,
                centerX,
                centerY,
                Math.max(drawW, drawH) * 0.65
              );
              glowGrad.addColorStop(0, `${themeColor}44`);
              glowGrad.addColorStop(0.5, `${themeColor}12`);
              glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
              ctx.fillStyle = glowGrad;
              ctx.beginPath();
              ctx.arc(centerX, centerY, Math.max(drawW, drawH) * 0.65, 0, Math.PI * 2);
              ctx.fill();
            }

            // Flip horizontally (if enabled)
            if (config.reciterPortraitFlip) {
              ctx.translate(centerX, centerY);
              ctx.scale(-1, 1);
              ctx.translate(-centerX, -centerY);
            }

            // Ambient Drop Shadow behind subject
            if (config.reciterPortraitShadow !== false) {
              ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
              ctx.shadowBlur = 38;
              ctx.shadowOffsetX = isRight ? -14 : 14;
              ctx.shadowOffsetY = 8;
            }

            // Draw Portrait
            ctx.drawImage(pImg, drawX, drawY, drawW, drawH);
            ctx.restore();

            // Soft Bottom Edge Fade (Smooth gradient mask so waist/chest fades seamlessly)
            if (config.reciterPortraitBottomFade !== false) {
              ctx.save();
              const fadeH = isPortrait ? h * 0.25 : h * 0.35;
              const fadeY = isPortrait ? h * 0.55 : h - fadeH;
              const fadeGrad = ctx.createLinearGradient(0, fadeY, 0, fadeY + fadeH);
              fadeGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
              fadeGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.7)');
              fadeGrad.addColorStop(1, 'rgba(0, 0, 0, 0.98)');
              ctx.fillStyle = fadeGrad;
              ctx.fillRect(isPortrait ? 0 : (isRight ? w * 0.45 : 0), fadeY, isPortrait ? w : w * 0.55, fadeH);
              ctx.restore();
            }
          }
        } catch (e) {
          console.warn('Could not load reciter portrait image:', e);
        }
      }
    }

    // 2. Directional Shadow Ramp (Dark background gradient behind text)
    if (config.directionalShadowRamp !== false) {
      const rampW = w * (config.directionalShadowWidth || 0.62);
      const opacity = config.directionalShadowOpacity ?? 0.88;
      ctx.save();
      let rampGrad: CanvasGradient;
      if (isPortrait) {
        rampGrad = ctx.createLinearGradient(0, h, 0, h * 0.45);
        rampGrad.addColorStop(0, `rgba(0, 0, 0, ${opacity})`);
        rampGrad.addColorStop(0.5, `rgba(0, 0, 0, ${opacity * 0.85})`);
        rampGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = rampGrad;
        ctx.fillRect(0, h * 0.45, w, h * 0.55);
      } else if (textOnLeft) {
        rampGrad = ctx.createLinearGradient(0, 0, rampW, 0);
        rampGrad.addColorStop(0, `rgba(0, 0, 0, ${opacity})`);
        rampGrad.addColorStop(0.45, `rgba(0, 0, 0, ${opacity * 0.82})`);
        rampGrad.addColorStop(0.8, `rgba(0, 0, 0, ${opacity * 0.4})`);
        rampGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = rampGrad;
        ctx.fillRect(0, 0, rampW, h);
      } else {
        rampGrad = ctx.createLinearGradient(w, 0, w - rampW, 0);
        rampGrad.addColorStop(0, `rgba(0, 0, 0, ${opacity})`);
        rampGrad.addColorStop(0.45, `rgba(0, 0, 0, ${opacity * 0.82})`);
        rampGrad.addColorStop(0.8, `rgba(0, 0, 0, ${opacity * 0.4})`);
        rampGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = rampGrad;
        ctx.fillRect(w - rampW, 0, rampW, h);
      }
      ctx.restore();
    }

    // 3. Typography Layer
    const textStartX = isPortrait ? w * 0.08 : (textOnLeft ? w * 0.08 : w * 0.52);
    const fontMultiplier = (config.titleFontSizeMultiplier || 1.0) * (isPortrait ? 1.25 : 1.0);
    const langMode = config.titleLanguageMode || 'bengali';

    if (langMode === 'bengali') {
      // ---------------------------------------------------------------------
      // BENGALI VIRAL YOUTUBE STYLE (References 1, 2, 3)
      // "সূরা: আল-আন'আম" in 3D liquid gold + "🎤 আহমদ আল নুফাইস"
      // ---------------------------------------------------------------------
      ctx.save();
      const titleText =
        config.bengaliSurahTitleText ||
        getBengaliSurahTitle(videoConfig.surahNumber, config.bengaliSurahPrefix ?? 'সূরা: ');

      const titleFontSize = Math.round(62 * fontMultiplier);
      const reciterFontSize = Math.round(28 * fontMultiplier);

      const contentCenterY = isPortrait ? h * 0.76 : h * 0.50;

      // Top Hook Badge (if enabled)
      let titleY = contentCenterY;
      if (config.showHookTitle && config.hookTitleText) {
        titleY = contentCenterY + 12;
        const hookFontSize = Math.round(15 * fontMultiplier);
        ctx.font = `700 ${hookFontSize}px 'Hind Siliguri', 'Inter', sans-serif`;
        const hookMetrics = ctx.measureText(config.hookTitleText);
        const hookPillW = hookMetrics.width + 30;
        const hookPillH = 28 * (isPortrait ? 1.2 : 1.0);
        const hookY = titleY - titleFontSize - (isPortrait ? 34 : 26);

        roundRect(ctx, textStartX, hookY - hookPillH / 2, hookPillW, hookPillH, 6);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#FDE68A';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.hookTitleText, textStartX + 15, hookY);
      }

      // Main Surah Title: "সূরা: [নাম]"
      ctx.font = `800 ${titleFontSize}px 'Hind Siliguri', 'Noto Sans Bengali', 'Tiro Bangla', sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      // Deep 3D Shadow pass
      ctx.shadowColor = 'rgba(0, 0, 0, 0.98)';
      ctx.shadowBlur = 28;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 6;

      if (config.titleMetallicGold !== false) {
        const goldGrad = ctx.createLinearGradient(
          textStartX,
          titleY - titleFontSize * 0.7,
          textStartX,
          titleY + titleFontSize * 0.4
        );
        goldGrad.addColorStop(0.0, '#FFFFFF'); // Specular highlight
        goldGrad.addColorStop(0.2, '#FEF3C7'); // Light amber cream
        goldGrad.addColorStop(0.5, '#F59E0B'); // Deep liquid gold
        goldGrad.addColorStop(0.8, '#D97706'); // Warm gold bronze
        goldGrad.addColorStop(1.0, '#78350F'); // Rich dark bronze base
        ctx.fillStyle = goldGrad;
      } else {
        ctx.fillStyle = '#FFFFFF';
      }

      ctx.fillText(titleText, textStartX, titleY);

      // Reciter Subtitle: "🎤 [কারি নাম]"
      const reciterBn =
        config.bengaliReciterNameText || getBengaliReciterName(reciterName);
      const mic = config.showMicIcon !== false ? '🎤 ' : '';
      const reciterFullText = `${mic}${reciterBn}`;

      const reciterY = titleY + titleFontSize * 0.65;
      ctx.font = `600 ${reciterFontSize}px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif`;
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 3;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.fillStyle = config.titleMetallicGold !== false ? '#FDE68A' : '#E5E7EB';
      ctx.fillText(reciterFullText, textStartX, reciterY);

      ctx.restore();
    } else if (langMode === 'calligraphy-english' || langMode === 'bilingual') {
      // ---------------------------------------------------------------------
      // INTERNATIONAL CALLIGRAPHY STYLE (References 4, 5)
      // Arabic Calligraphy crest + bold English title + relaxing hook + reciter
      // ---------------------------------------------------------------------
      ctx.save();
      const contentCenterY = isPortrait ? h * 0.74 : h * 0.48;

      // 1. Arabic Calligraphy Emblem
      if (config.showSurahCalligraphy !== false) {
        const calligSize = Math.round(92 * fontMultiplier);
        ctx.font = `${calligSize}px 'surah-name-v1', sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 5;

        if (config.titleMetallicGold !== false) {
          ctx.fillStyle = createLiquidGoldGradient(
            ctx,
            textStartX,
            contentCenterY - 90,
            textStartX + 200,
            contentCenterY - 40
          );
        } else {
          ctx.fillStyle = '#FFFFFF';
        }
        ctx.fillText(surahLigatureCode, textStartX, contentCenterY - 60);
      }

      // 2. English Surah Title
      const englishTitle =
        config.englishSurahNameText ||
        surahMeta?.nameTransliterated?.toUpperCase() ||
        `SURAH ${videoConfig.surahNumber}`;
      const enFontSize = Math.round(48 * fontMultiplier);
      ctx.font = `800 ${enFontSize}px 'Cinzel', 'Inter', serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(englishTitle, textStartX, contentCenterY + 10);

      // 3. Relaxing Hook
      if (config.showHookTitle && config.hookTitleText) {
        const hookFontSize = Math.round(18 * fontMultiplier);
        ctx.font = `700 ${hookFontSize}px 'Inter', sans-serif`;
        ctx.fillStyle = config.hookTitleColor || '#93C5FD';
        ctx.shadowBlur = 12;
        ctx.fillText(config.hookTitleText.toUpperCase(), textStartX, contentCenterY + 58);
      }

      // 4. Reciter Attribution
      const reciterEn = (config.reciterNameText || reciterName).toUpperCase();
      const reciterFontSize = Math.round(18 * fontMultiplier);
      ctx.font = `600 ${reciterFontSize}px 'Inter', sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.shadowBlur = 10;
      ctx.fillText(reciterEn, textStartX, contentCenterY + 95);

      ctx.restore();
    } else {
      // Standard English mode
      ctx.save();
      const englishTitle =
        config.englishSurahNameText ||
        surahMeta?.nameTransliterated?.toUpperCase() ||
        `SURAH ${videoConfig.surahNumber}`;
      const enFontSize = Math.round(54 * fontMultiplier);
      ctx.font = `800 ${enFontSize}px 'Inter', sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = config.titleMetallicGold !== false
        ? createLiquidGoldGradient(ctx, textStartX, h * 0.45, textStartX + 200, h * 0.55)
        : '#FFFFFF';
      ctx.fillText(englishTitle, textStartX, h * 0.48);

      const reciterText = config.reciterNameText || reciterName;
      ctx.font = `600 24px 'Inter', sans-serif`;
      ctx.fillStyle = '#E5E7EB';
      ctx.fillText(`🎙️ ${reciterText}`, textStartX, h * 0.58);
      ctx.restore();
    }
  } else if (layoutMode === 'split-screen' && !isPortrait) {
    // -----------------------------------------------------------------------
    // LAYOUT 1: SPLIT-SCREEN (Proven #1 CTR Standard for YouTube 16:9)
    // Left: Medallion Calligraphy + Arabic Surah Title
    // Right: Frosted Badge Chip + Giant Stacked Typography + Hook + Reciter Card
    // -----------------------------------------------------------------------
    const leftCenterX = w * 0.27;
    const leftCenterY = h * 0.48;
    const rightLeftX = w * 0.52;
    const rightMaxW = w * 0.44;

    // --- Left: Calligraphy Medallion ---
    if (config.showSurahCalligraphy) {
      ctx.save();
      const medRadius = 135 * (config.surahCalligraphyScale || 1.15);

      if (config.calligraphyMedallion !== false) {
        // Volumetric Glow behind medallion
        const auraGrad = ctx.createRadialGradient(leftCenterX, leftCenterY, 20, leftCenterX, leftCenterY, medRadius * 1.5);
        auraGrad.addColorStop(0, `${themeColor}66`);
        auraGrad.addColorStop(0.6, `${themeColor}15`);
        auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(leftCenterX, leftCenterY, medRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Frosted Glass Circle Body
        ctx.fillStyle = 'rgba(10, 15, 26, 0.78)';
        ctx.beginPath();
        ctx.arc(leftCenterX, leftCenterY, medRadius, 0, Math.PI * 2);
        ctx.fill();

        // Outer Metallic Gold Ring
        const goldRing = createLiquidGoldGradient(ctx, leftCenterX - medRadius, leftCenterY - medRadius, leftCenterX + medRadius, leftCenterY + medRadius);
        ctx.strokeStyle = goldRing;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = `${themeColor}AA`;
        ctx.shadowBlur = 18;
        ctx.stroke();

        // Inner Delicate Hairline Ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.0;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(leftCenterX, leftCenterY, medRadius - 7, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Render Calligraphy Ligature Emblem
      const fontSize = 130 * (config.surahCalligraphyScale || 1.15);
      ctx.font = `${fontSize}px 'surah-name-v1', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Deep 3D drop shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 6;

      // Gold or chosen fill
      if (config.goldGradientText !== false) {
        ctx.fillStyle = createLiquidGoldGradient(ctx, leftCenterX - 100, leftCenterY - 80, leftCenterX + 100, leftCenterY + 80);
      } else {
        ctx.fillStyle = config.surahCalligraphyColor || themeColor;
      }
      ctx.fillText(surahLigatureCode, leftCenterX, leftCenterY);
      ctx.restore();
    }

    // --- Left Underneath: Vocalized Arabic Surah Text ---
    if (config.showArabicSurahName) {
      ctx.save();
      const arabicY = leftCenterY + 160 * (config.surahCalligraphyScale || 1.15);
      ctx.font = `700 ${config.arabicSurahNameSize * 1.1}px 'Amiri', 'KFGQPC Uthmanic Script HAFS', serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = config.arabicSurahNameColor || '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.95)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 4;
      ctx.fillText(`سُورَةُ ${surahMeta?.nameArabic || ''}`, leftCenterX, arabicY);
      ctx.restore();
    }

    // --- Right Column: Stacked High-Impact Typography ---
    let currentY = 135;

    // 1. Frosted Glass Status Badge (Top Chip)
    if (config.activeBadge !== 'none') {
      ctx.save();
      const badgeText = config.badgeCustomText || '● FULL SURAH • 4K UHD';
      ctx.font = '800 13px Inter, sans-serif';
      const textMetrics = ctx.measureText(badgeText);
      const pillW = textMetrics.width + 36;
      const pillH = 34;

      // Frosted capsule background
      roundRect(ctx, rightLeftX, currentY - 17, pillW, pillH, 17);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 3;
      ctx.fill();

      // Border with accent glow
      ctx.strokeStyle = `${themeColor}88`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Text inside capsule
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText(badgeText, rightLeftX + 18, currentY);

      currentY += 58;
      ctx.restore();
    }

    // 2. Primary Monumental Surah Name Title
    if (config.showEnglishSurahName) {
      ctx.save();
      const titleText = surahEnglishName.toUpperCase();
      ctx.font = `900 ${config.englishSurahNameSize * 1.15}px Inter, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      // Deep cinematic shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 28;
      ctx.shadowOffsetY = 8;

      if (config.goldGradientText !== false) {
        ctx.fillStyle = createLiquidGoldGradient(ctx, rightLeftX, currentY - 50, rightLeftX + 400, currentY);
      } else {
        ctx.fillStyle = config.englishSurahNameColor || '#FFFFFF';
      }

      ctx.fillText(titleText, rightLeftX, currentY);
      currentY += 26;

      // Meaning Subtitle
      if (config.showEnglishMeaning && surahEnglishMeaning) {
        ctx.font = '600 19px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 3;
        ctx.fillText(surahEnglishMeaning, rightLeftX, currentY);
        currentY += 36;
      } else {
        currentY += 16;
      }
      ctx.restore();
    }

    // 3. High-Converting Hook / Intention Banner Card
    if (config.showHookTitle) {
      ctx.save();
      const hookText = config.hookTitleText.toUpperCase();
      ctx.font = `900 ${config.hookTitleFontSize * 1.05}px Inter, sans-serif`;
      const hookMetrics = ctx.measureText(hookText);
      const cardW = Math.min(rightMaxW, hookMetrics.width + 42);
      const cardH = config.hookTitleSubtitle ? 68 : 50;

      // Frosted Glass Card
      roundRect(ctx, rightLeftX, currentY - 12, cardW, cardH, 16);
      ctx.fillStyle = config.hookTitleBgColor || 'rgba(12, 17, 29, 0.85)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 6;
      ctx.fill();

      // Golden Edge Rim
      ctx.strokeStyle = config.hookTitleStrokeColor || `${themeColor}66`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Main Hook Text
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = config.hookTitleColor || '#FDE68A';
      ctx.shadowColor = `${themeColor}88`;
      ctx.shadowBlur = config.hookTitleGlow ? 14 : 0;
      ctx.fillText(hookText, rightLeftX + 20, currentY);

      // Hook Subtitle
      if (config.hookTitleSubtitle) {
        ctx.font = '600 13px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 0;
        ctx.fillText(config.hookTitleSubtitle, rightLeftX + 20, currentY + 30);
      }

      currentY += cardH + 28;
      ctx.restore();
    }

    // 4. Reciter & Ayah Info Footer Capsule
    if (config.showReciterBadge || config.showAyahRangeBadge) {
      ctx.save();
      let footerText = '';
      if (config.showReciterBadge) {
        footerText += `🎙️ ${reciterName}${reciterStyle ? ` (${reciterStyle})` : ''}`;
      }
      if (config.showAyahRangeBadge) {
        if (footerText) footerText += '   •   ';
        footerText += ayahRangeText;
      }

      ctx.font = '700 13px Inter, sans-serif';
      const fMetrics = ctx.measureText(footerText);
      const pillW = fMetrics.width + 36;
      const pillH = 34;

      roundRect(ctx, rightLeftX, currentY - 14, pillW, pillH, 17);
      ctx.fillStyle = 'rgba(10, 15, 26, 0.85)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 3;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText(footerText, rightLeftX + 18, currentY + 3);
      ctx.restore();
    }

  } else {
    // -----------------------------------------------------------------------
    // LAYOUT 2: CENTERPIECE / CINEMATIC / HIGH-IMPACT / PORTRAIT (9:16)
    // Symmetrical, grand, centralized layout
    // -----------------------------------------------------------------------
    const centerX = w / 2;
    const calligraphyY = isPortrait ? 520 : isSquare ? 360 : 255;
    const hookY = isPortrait ? 1380 : isSquare ? 820 : 540;

    // 1. Top Badge Capsule (Center)
    if (config.activeBadge !== 'none') {
      ctx.save();
      const badgeText = config.badgeCustomText || '● FULL SURAH • 4K UHD';
      ctx.font = `800 ${13 * scaleMod}px Inter, sans-serif`;
      const textMetrics = ctx.measureText(badgeText);
      const pillW = textMetrics.width + 40 * scaleMod;
      const pillH = 36 * scaleMod;
      const pillY = isPortrait ? 180 : 42;

      roundRect(ctx, centerX - pillW / 2, pillY, pillW, pillH, pillH / 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 4;
      ctx.fill();

      ctx.strokeStyle = `${themeColor}88`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText(badgeText, centerX, pillY + pillH / 2);
      ctx.restore();
    }

    // 2. Calligraphy Emblem
    if (config.showSurahCalligraphy) {
      ctx.save();
      const medRadius = 120 * (config.surahCalligraphyScale || 1.15) * scaleMod;

      if (config.calligraphyMedallion !== false) {
        // Volumetric Glow
        const auraGrad = ctx.createRadialGradient(centerX, calligraphyY, 15, centerX, calligraphyY, medRadius * 1.5);
        auraGrad.addColorStop(0, `${themeColor}66`);
        auraGrad.addColorStop(0.6, `${themeColor}15`);
        auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(centerX, calligraphyY, medRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Dark Frosted Medallion
        ctx.fillStyle = 'rgba(10, 15, 26, 0.78)';
        ctx.beginPath();
        ctx.arc(centerX, calligraphyY, medRadius, 0, Math.PI * 2);
        ctx.fill();

        // Gold Rim
        ctx.strokeStyle = createLiquidGoldGradient(ctx, centerX - medRadius, calligraphyY - medRadius, centerX + medRadius, calligraphyY + medRadius);
        ctx.lineWidth = 2.5 * scaleMod;
        ctx.shadowColor = `${themeColor}AA`;
        ctx.shadowBlur = 20;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.0;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(centerX, calligraphyY, medRadius - 7 * scaleMod, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Glyph
      const fontSize = 125 * (config.surahCalligraphyScale || 1.15) * scaleMod;
      ctx.font = `${fontSize}px 'surah-name-v1', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 6;

      if (config.goldGradientText !== false) {
        ctx.fillStyle = createLiquidGoldGradient(ctx, centerX - 120, calligraphyY - 80, centerX + 120, calligraphyY + 80);
      } else {
        ctx.fillStyle = config.surahCalligraphyColor || themeColor;
      }
      ctx.fillText(surahLigatureCode, centerX, calligraphyY);
      ctx.restore();
    }

    // 3. Vocalized Arabic Surah Text
    if (config.showArabicSurahName) {
      ctx.save();
      const arabicY = calligraphyY + (isPortrait ? 180 : 90) * scaleMod;
      ctx.font = `700 ${config.arabicSurahNameSize * scaleMod}px 'Amiri', 'KFGQPC Uthmanic Script HAFS', serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = config.arabicSurahNameColor || '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.95)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 4;
      ctx.fillText(`سُورَةُ ${surahMeta?.nameArabic || ''}`, centerX, arabicY);
      ctx.restore();
    }

    // 4. Transliterated English Surah Title
    if (config.showEnglishSurahName) {
      ctx.save();
      const titleY = calligraphyY + (isPortrait ? 260 : 145) * scaleMod;
      ctx.font = `900 ${config.englishSurahNameSize * scaleMod}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 26;
      ctx.shadowOffsetY = 8;

      if (config.goldGradientText !== false) {
        ctx.fillStyle = createLiquidGoldGradient(ctx, centerX - 250, titleY - 30, centerX + 250, titleY + 30);
      } else {
        ctx.fillStyle = config.englishSurahNameColor || '#FFFFFF';
      }

      ctx.fillText(surahEnglishName.toUpperCase(), centerX, titleY);

      // Meaning Subtitle
      if (config.showEnglishMeaning && surahEnglishMeaning) {
        ctx.font = `600 ${18 * scaleMod}px Inter, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 3;
        ctx.fillText(surahEnglishMeaning, centerX, titleY + 32 * scaleMod);
      }
      ctx.restore();
    }

    // 5. Ayah Range Pill Badge
    if (config.showAyahRangeBadge) {
      ctx.save();
      const badgeY = calligraphyY + (isPortrait ? 370 : 205) * scaleMod;
      ctx.font = `700 ${13 * scaleMod}px Inter, sans-serif`;
      const metrics = ctx.measureText(ayahRangeText.toUpperCase());
      const pillW = metrics.width + 40 * scaleMod;
      const pillH = 34 * scaleMod;

      roundRect(ctx, centerX - pillW / 2, badgeY - pillH / 2, pillW, pillH, pillH / 2);
      ctx.fillStyle = 'rgba(10, 15, 26, 0.85)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 4;
      ctx.fill();

      ctx.strokeStyle = `${themeColor}88`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText(ayahRangeText.toUpperCase(), centerX, badgeY);
      ctx.restore();
    }

    // 6. High-Impact Hook Banner Card
    if (config.showHookTitle) {
      ctx.save();
      const hookText = config.hookTitleText.toUpperCase();
      ctx.font = `900 ${config.hookTitleFontSize * scaleMod}px Inter, sans-serif`;
      const hookMetrics = ctx.measureText(hookText);
      const cardW = Math.min(w * 0.88, hookMetrics.width + 60 * scaleMod);
      const cardH = (config.hookTitleSubtitle ? 76 : 56) * scaleMod;

      roundRect(ctx, centerX - cardW / 2, hookY - cardH / 2, cardW, cardH, 20 * scaleMod);
      ctx.fillStyle = config.hookTitleBgColor || 'rgba(12, 17, 29, 0.85)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 6;
      ctx.fill();

      ctx.strokeStyle = config.hookTitleStrokeColor || `${themeColor}88`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = config.hookTitleColor || '#FDE68A';
      ctx.shadowColor = `${themeColor}88`;
      ctx.shadowBlur = config.hookTitleGlow ? 16 : 0;

      const titleY = config.hookTitleSubtitle ? hookY - 12 * scaleMod : hookY;
      ctx.fillText(hookText, centerX, titleY);

      if (config.hookTitleSubtitle) {
        ctx.font = `600 ${14 * scaleMod}px Inter, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 0;
        ctx.fillText(config.hookTitleSubtitle, centerX, hookY + 18 * scaleMod);
      }
      ctx.restore();
    }

    // 7. Bottom Attribution Bar (Reciter & Translation)
    const footerY = h - (isPortrait ? 100 : 54);
    if (config.showReciterBadge || (config.showTranslationBadge && translationBook)) {
      ctx.save();
      let footerText = '';
      if (config.showReciterBadge) {
        footerText += `🎙️ ${reciterName}${reciterStyle ? ` (${reciterStyle})` : ''}`;
      }
      if (config.showTranslationBadge && translationBook) {
        if (footerText) footerText += '   •   ';
        footerText += `📖 ${translationBook}`;
      }

      ctx.font = `700 ${13 * scaleMod}px Inter, sans-serif`;
      const fMetrics = ctx.measureText(footerText);
      const pillW = fMetrics.width + 44 * scaleMod;
      const pillH = 34 * scaleMod;

      roundRect(ctx, centerX - pillW / 2, footerY - pillH / 2, pillW, pillH, pillH / 2);
      ctx.fillStyle = 'rgba(10, 15, 26, 0.85)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 3;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText(footerText, centerX, footerY);
      ctx.restore();
    }
  }
}
