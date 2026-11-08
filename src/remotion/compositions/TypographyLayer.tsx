import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { VideoTemplateConfig, AyahSequenceData, QuranWord, ScriptBlockType, TextAnimationIn, TextAnimationOut } from '../../shared/types';
import { computeAdaptiveFontSizes, computeAyahChunks } from '../../shared/typography-utils';
import { getLocalizedHeader, getLanguageFontFamily } from '../../shared/surah-localization';

interface TypographyLayerProps {
  config: VideoTemplateConfig;
  ayahData: AyahSequenceData;
  fps: number;
}

export const TypographyLayer: React.FC<TypographyLayerProps> = ({
  config,
  ayahData,
  fps,
}) => {
  const frame = useCurrentFrame();

  // If this item is a Prayer Segment Interstitial / Transition Card
  if (ayahData.isInterstitial) {
    const totalFrames = Math.max(1, ayahData.durationInFrames);
    const fadeFrames = Math.min(15, Math.floor(totalFrames / 3));
    let opacity = 1;
    if (frame < fadeFrames) {
      opacity = interpolate(frame, [0, fadeFrames], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    } else if (frame > totalFrames - fadeFrames) {
      opacity = interpolate(frame, [totalFrames - fadeFrames, totalFrames], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }

    const surahLigatureCode = `surah${String(ayahData.surah).padStart(3, '0')}`;

    return (
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          userSelect: 'none',
          opacity,
          padding: '32px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 44px',
            borderRadius: '24px',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            maxWidth: '85%',
            textAlign: 'center',
            gap: '12px',
          }}
        >
          {ayahData.surah > 0 && (
            <span
              className="surah-calligraphy-title"
              style={{
                fontFamily: "'surah-name-v1', sans-serif",
                fontSize: '48px',
                lineHeight: 1,
                color: '#FCD34D',
                filter: 'drop-shadow(0 2px 10px rgba(245, 158, 11, 0.4))',
              }}
            >
              {surahLigatureCode}
            </span>
          )}

          {ayahData.interstitialTitle && (
            <span
              style={{
                fontSize: '22px',
                fontWeight: 600,
                color: '#FFFFFF',
                letterSpacing: '0.5px',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {ayahData.interstitialTitle}
            </span>
          )}

          {ayahData.interstitialSubtitle && (
            <span
              style={{
                fontSize: '18px',
                fontWeight: 400,
                color: '#D1D5DB',
                fontFamily: "'Amiri', serif",
                direction: 'rtl',
              }}
            >
              {ayahData.interstitialSubtitle}
            </span>
          )}
        </div>
      </AbsoluteFill>
    );
  }

  // Per-Ayah In/Out Animation Overrides (with fallback to global config)
  const ayahKey = `${ayahData.surah}:${ayahData.ayah}`;
  const override = config.ayahFontOverrides?.[ayahKey];

  const animIn: TextAnimationIn =
    override?.animationIn && override.animationIn !== 'inherit'
      ? override.animationIn
      : (config.animationIn || 'float-up');

  const animOut: TextAnimationOut =
    override?.animationOut && override.animationOut !== 'inherit'
      ? override.animationOut
      : (config.animationOut || 'fade');

  // Timeline & Transition Duration Calculations
  const totalFrames = Math.max(1, ayahData.durationInFrames);
  const maxAnimFrames = Math.max(4, Math.floor(totalFrames / 2.5));
  const configuredAnimFrames = config.animationDurationFrames || 18;
  const inDuration = Math.min(configuredAnimFrames, maxAnimFrames);
  const outDuration = Math.min(configuredAnimFrames, maxAnimFrames);
  const exitStartFrame = Math.max(inDuration, totalFrames - outDuration);

  // Stagger calculation: subtitles glide in slightly after Arabic
  const staggerFrames =
    config.staggerSubtitles !== false && animIn !== 'none'
      ? Math.min(5, Math.floor(inDuration / 3))
      : 0;

  // Entrance animation values
  const computeInValues = (startFrame: number, animType: TextAnimationIn) => {
    if (animType === 'none') {
      return { opacity: 1, translateY: 0, scale: 1, blur: 0 };
    }
    const endFrame = startFrame + inDuration;
    const p = interpolate(frame, [startFrame, endFrame], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });

    let translateY = 0;
    let scale = 1;
    let blur = 0;

    if (animType === 'float-up') {
      translateY = (1 - p) * 24;
    } else if (animType === 'blur-fade') {
      blur = (1 - p) * 10;
    } else if (animType === 'scale-up') {
      scale = 0.92 + p * 0.08;
    }

    return { opacity: p, translateY, scale, blur };
  };

  // Exit animation values
  const computeOutValues = (animType: TextAnimationOut) => {
    if (animType === 'none' || frame < exitStartFrame) {
      return { opacity: 1, translateY: 0, scale: 1, blur: 0 };
    }
    const p = interpolate(frame, [exitStartFrame, totalFrames], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.cubic),
    });

    const opacity = 1 - p;
    let translateY = 0;
    let scale = 1;
    let blur = 0;

    if (animType === 'float-up') {
      translateY = -p * 24;
    } else if (animType === 'float-down') {
      translateY = p * 24;
    } else if (animType === 'blur-fade') {
      blur = p * 10;
    } else if (animType === 'scale-down') {
      scale = 1 - p * 0.08;
    }

    return { opacity, translateY, scale, blur };
  };

  const arabicIn = computeInValues(0, animIn);
  const subIn = computeInValues(staggerFrames, animIn);
  const outValues = computeOutValues(animOut);

  const arabicOpacity = Number((arabicIn.opacity * outValues.opacity).toFixed(4));
  const arabicTranslateY = arabicIn.translateY + outValues.translateY;
  const arabicScale = arabicIn.scale * outValues.scale;
  const arabicBlur = arabicIn.blur + outValues.blur;
  const arabicFilter = arabicBlur > 0.1 ? `blur(${arabicBlur.toFixed(1)}px)` : undefined;

  const subOpacity = Number((subIn.opacity * outValues.opacity).toFixed(4));
  const subTranslateY = subIn.translateY + outValues.translateY;
  const subScale = subIn.scale * outValues.scale;
  const subBlur = subIn.blur + outValues.blur;
  const subFilter = subBlur > 0.1 ? `blur(${subBlur.toFixed(1)}px)` : undefined;

  const headerProgress = interpolate(frame, [0, inDuration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const headerOpacity = Number((headerProgress * outValues.opacity).toFixed(4));

  const currentMs = (frame / fps) * 1000;

  // Compute phrasing chunks for this Ayah based on Waqf & reciter pauses
  const chunks = useMemo(() => {
    return computeAyahChunks(ayahData, config);
  }, [ayahData, config]);

  // Determine active chunk based on current playback millisecond
  const activeChunk =
    chunks.find((c) => currentMs >= c.startMs && currentMs < c.endMs) ||
    chunks[chunks.length - 1] ||
    chunks[0];

  const isChunked = chunks.length > 1;

  // Chunk-level smooth transition for phrase-by-phrase display
  const chunkStartFrame = Math.floor((activeChunk.startMs / 1000) * fps);
  const chunkRelFrame = frame - chunkStartFrame;
  const chunkTransitionType = config.chunkTransition || 'fade';
  let chunkP = 1;
  if (activeChunk.chunkIndex > 0 && chunkTransitionType !== 'none') {
    chunkP = interpolate(chunkRelFrame, [0, 7], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
  }
  const chunkTranslateY =
    activeChunk.chunkIndex > 0 && chunkTransitionType === 'float-up' ? (1 - chunkP) * 14 : 0;

  // Combine Ayah entrance/exit and chunk transition
  const finalArabicOpacity =
    activeChunk.chunkIndex === 0
      ? arabicOpacity
      : Number((chunkP * outValues.opacity).toFixed(4));

  const finalSubOpacity =
    activeChunk.chunkIndex === 0
      ? subOpacity
      : Number((chunkP * outValues.opacity).toFixed(4));

  const finalArabicTranslateY =
    activeChunk.chunkIndex === 0
      ? arabicTranslateY
      : chunkTranslateY + outValues.translateY;

  const finalSubTranslateY =
    activeChunk.chunkIndex === 0
      ? subTranslateY
      : chunkTranslateY + outValues.translateY;

  const finalArabicTransform = `translateY(${finalArabicTranslateY.toFixed(2)}px) scale(${arabicScale.toFixed(4)})`;
  const finalSubTransform = `translateY(${finalSubTranslateY.toFixed(2)}px) scale(${subScale.toFixed(4)})`;

  // Determine active word position based on current millisecond
  const activeSegment = ayahData.segments.find(
    (seg) => currentMs >= seg.startMs && currentMs <= seg.endMs
  );
  const activeWordIndex = activeSegment ? activeSegment.wordIndex : -1;

  // Format Surah title string for surah-name-v1 font ligature
  const surahLigatureCode = `surah${String(ayahData.surah).padStart(3, '0')}`;

  // Localized Surah & Ayah badge info (e.g., "আল-ফাতিহা • আয়াত ১" when Bangla is active)
  const localizedHeader = getLocalizedHeader(config, ayahData.surah, ayahData.ayah);

  // Adaptive Font Sizing based on active chunk length (or whole Ayah if unchunked)
  const computedSizes = computeAdaptiveFontSizes(
    config,
    isChunked
      ? {
          words: activeChunk.words,
          primaryTranslation: activeChunk.primaryTranslation,
          secondaryTranslation: activeChunk.secondaryTranslation,
        }
      : ayahData,
    override
  );
  const arabicFontSize = computedSizes.arabicFontSize;
  const primaryFontSize = computedSizes.primaryFontSize;
  const secondaryFontSize = computedSizes.secondaryFontSize;

  // Alignment & Layout Positioning
  const textAlignment = config.textAlignment || 'center';
  const flexAlignItems =
    textAlignment === 'center' ? 'center' : textAlignment === 'right' ? 'flex-end' : 'flex-start';

  const verticalAlignment = override?.verticalAlignment ?? config.verticalAlignment ?? 'middle';
  const verticalOffset = override?.verticalOffset ?? config.verticalCustomOffset ?? 0;
  const isSplit = verticalAlignment === 'split';

  // Subtitle Container Box
  const showContainer = config.showTranslationContainer !== false;

  // Script & Translation Block Order
  const layoutOrder: ScriptBlockType[] = config.scriptLayoutOrder || ['arabic', 'secondary', 'primary'];
  const englishFirst = layoutOrder.indexOf('secondary') < layoutOrder.indexOf('primary');

  // Words to render: active chunk words if chunked, or all Ayah words
  const displayWords = isChunked ? activeChunk.words : ayahData.words;
  const primaryTranslationText = isChunked ? activeChunk.primaryTranslation : ayahData.primaryTranslation;
  const secondaryTranslationText = isChunked ? activeChunk.secondaryTranslation : ayahData.secondaryTranslation;

  const arabicBlock = (
    <div
      key="arabic"
      style={{
        width: '100%',
        maxWidth: '1280px',
        margin: isSplit ? 'auto 0' : '0',
        textAlign: textAlignment,
        padding: '0 32px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: flexAlignItems,
        opacity: finalArabicOpacity,
        transform: finalArabicTransform,
        filter: arabicFilter,
        WebkitFilter: arabicFilter,
      }}
    >
      <div
        className="quran-arabic-text"
        style={{
          direction: 'rtl',
          unicodeBidi: 'isolate',
          textAlign: textAlignment,
          fontFamily: `'${config.selectedQuranFont}', 'KFGQPC Uthmanic Script HAFS', 'Amiri', serif`,
          fontSize: `${arabicFontSize}px`,
          lineHeight: config.arabicLineHeight,
          fontFeatureSettings: '"kern" 1, "liga" 1, "mkmk" 1, "mark" 1, "calt" 1',
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          display: 'inline-block',
          width: '100%',
        }}
      >
        {displayWords.map((w: QuranWord) => {
          // Strip residual Presentation Forms-A ligature characters
          const displayText = (w.text || '').replace(/[\uFD00-\uFDFF]/g, '').trim();
          if (!displayText) return null;

          const isActive = w.word === activeWordIndex;
          return (
            <span
              key={w.id}
              style={{
                display: 'inline-block',
                margin: '0 8px',
                color: isActive ? config.arabicActiveColor : config.arabicTextColor,
                transform: isActive ? 'scale(1.06)' : 'scale(1)',
                transition: 'all 0.15s ease',
                textShadow:
                  isActive && config.arabicActiveGlow
                    ? `0 0 25px ${config.arabicActiveColor}, 0 0 10px ${config.arabicActiveColor}`
                    : '0 2px 10px rgba(0,0,0,0.6)',
              }}
            >
              {displayText}
            </span>
          );
        })}
      </div>
    </div>
  );

  const primarySubtitle =
    config.showPrimaryTranslation && primaryTranslationText ? (
      <p
        key="primary"
        style={{
          fontFamily: getLanguageFontFamily(config.primaryTranslationLang),
          fontSize: `${primaryFontSize}px`,
          color: config.primaryTextColor,
          fontWeight: 500,
          lineHeight: 1.6,
          textShadow: showContainer
            ? '0 2px 8px rgba(0,0,0,0.7)'
            : '0 2px 10px rgba(0,0,0,0.95), 0 0 16px rgba(0,0,0,0.8)',
          textAlign: textAlignment,
          margin: 0,
          width: '100%',
        }}
      >
        {primaryTranslationText}
      </p>
    ) : null;

  const secondarySubtitle =
    config.showSecondaryTranslation && secondaryTranslationText ? (
      <p
        key="secondary"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: `${secondaryFontSize}px`,
          color: config.secondaryTextColor,
          lineHeight: 1.5,
          textShadow: showContainer
            ? '0 2px 8px rgba(0,0,0,0.7)'
            : '0 2px 10px rgba(0,0,0,0.95), 0 0 16px rgba(0,0,0,0.8)',
          textAlign: textAlignment,
          margin: 0,
          width: '100%',
        }}
      >
        {secondaryTranslationText}
      </p>
    ) : null;

  const hasTranslations = Boolean(primarySubtitle || secondarySubtitle);

  const translationsBlock = hasTranslations ? (
    <div
      key="translations"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: flexAlignItems,
        gap: '10px',
        maxWidth: '1100px',
        width: '90%',
        textAlign: textAlignment,
        padding: showContainer ? '18px 40px' : '4px 20px',
        borderRadius: showContainer ? '20px' : '0px',
        backgroundColor: showContainer ? 'rgba(0, 0, 0, 0.45)' : 'transparent',
        backdropFilter: showContainer ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: showContainer ? 'blur(16px)' : 'none',
        border: showContainer ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
        boxShadow: showContainer ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)' : 'none',
        flexShrink: 0,
        boxSizing: 'border-box',
        opacity: finalSubOpacity,
        transform: finalSubTransform,
        filter: subFilter,
        WebkitFilter: subFilter,
      }}
    >
      {englishFirst ? (
        <>
          {secondarySubtitle}
          {primarySubtitle}
        </>
      ) : (
        <>
          {primarySubtitle}
          {secondarySubtitle}
        </>
      )}
    </div>
  ) : null;

  // Determine whether Arabic is before or after translations
  const arabicIndex = layoutOrder.indexOf('arabic');
  const transIndex = Math.min(
    layoutOrder.indexOf('primary') !== -1 ? layoutOrder.indexOf('primary') : 999,
    layoutOrder.indexOf('secondary') !== -1 ? layoutOrder.indexOf('secondary') : 999
  );
  const arabicFirst = arabicIndex <= transIndex;

  // Vertical Alignment Justification & Padding
  let contentJustify: 'center' | 'flex-start' | 'flex-end' | 'space-between' = 'center';
  let contentPaddingTop = '110px';
  let contentPaddingBottom = '44px';

  if (verticalAlignment === 'top') {
    contentJustify = 'flex-start';
    contentPaddingTop = config.showSurahHeader !== false ? '130px' : '48px';
    contentPaddingBottom = '44px';
  } else if (verticalAlignment === 'bottom') {
    contentJustify = 'flex-end';
    contentPaddingTop = '110px';
    contentPaddingBottom = '56px';
  } else if (verticalAlignment === 'split') {
    contentJustify = 'space-between';
    contentPaddingTop = '110px';
    contentPaddingBottom = '44px';
  } else {
    // 'middle'
    contentJustify = 'center';
    contentPaddingTop = config.showSurahHeader !== false ? '110px' : '44px';
    contentPaddingBottom = '44px';
  }

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0',
        userSelect: 'none',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* TOP HEADER: Surah Calligraphy Badge & Metadata Pill */}
      {config.showSurahHeader !== false && (
        <div
          style={{
            position: 'absolute',
            top: '44px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            opacity: headerOpacity,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '9999px',
            padding: '10px 32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            flexShrink: 0,
          }}
        >
          <span
            className="surah-calligraphy-title"
            style={{
              fontFamily: "'surah-name-v1', sans-serif",
              fontSize: '38px',
              lineHeight: 1,
              color: '#FCD34D',
              letterSpacing: '0px',
              display: 'inline-block',
            }}
          >
            {surahLigatureCode}
          </span>
          <div
            style={{
              height: '20px',
              width: '1px',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
            }}
          />
          <span
            style={{
              fontFamily: localizedHeader.fontFamily,
              color: 'rgba(255, 255, 255, 0.95)',
              fontSize: '16px',
              fontWeight: 500,
              letterSpacing: '0.02em',
              lineHeight: 1.2,
            }}
          >
            {localizedHeader.fullTitle}
          </span>
        </div>
      )}

      {/* Main Scripture & Subtitle Layers in chosen layout order & vertical alignment */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: contentJustify,
          width: '100%',
          height: '100%',
          gap: isSplit ? '0px' : '28px',
          paddingTop: contentPaddingTop,
          paddingBottom: contentPaddingBottom,
          paddingLeft: '48px',
          paddingRight: '48px',
          boxSizing: 'border-box',
          transform: `translateY(${verticalOffset}px)`,
          transition: 'transform 0.15s ease-out',
        }}
      >
        {arabicFirst ? (
          <>
            {arabicBlock}
            {translationsBlock}
          </>
        ) : (
          <>
            {translationsBlock}
            {arabicBlock}
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};
