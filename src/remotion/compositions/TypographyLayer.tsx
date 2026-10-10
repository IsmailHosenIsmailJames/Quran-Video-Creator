import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring } from 'remotion';
import { VideoTemplateConfig, AyahSequenceData, QuranWord, ScriptBlockType } from '../../shared/types';

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

  // Entrance Transition: 15-frame cross-dissolve & slight vertical slide
  const entranceProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  const currentMs = (frame / fps) * 1000;

  // Determine active word position based on current millisecond
  const activeSegment = ayahData.segments.find(
    (seg) => currentMs >= seg.startMs && currentMs <= seg.endMs
  );
  const activeWordIndex = activeSegment ? activeSegment.wordIndex : -1;

  // Format Surah title string for surah-name-v1 font ligature
  const surahLigatureCode = `surah${String(ayahData.surah).padStart(3, '0')}`;

  // Per-Ayah Custom Font Size Overrides (with fallback to global config)
  const ayahKey = `${ayahData.surah}:${ayahData.ayah}`;
  const override = config.ayahFontOverrides?.[ayahKey];
  const arabicFontSize = override?.arabicFontSize ?? config.arabicFontSize;
  const primaryFontSize = override?.primaryFontSize ?? config.primaryFontSize;
  const secondaryFontSize = override?.secondaryFontSize ?? config.secondaryFontSize;

  // Alignment
  const textAlignment = config.textAlignment || 'center';
  const flexAlignItems =
    textAlignment === 'center' ? 'center' : textAlignment === 'right' ? 'flex-end' : 'flex-start';

  // Subtitle Container Box
  const showContainer = config.showTranslationContainer !== false;

  // Script & Translation Block Order
  const layoutOrder: ScriptBlockType[] = config.scriptLayoutOrder || ['arabic', 'secondary', 'primary'];
  const englishFirst = layoutOrder.indexOf('secondary') < layoutOrder.indexOf('primary');

  const arabicBlock = (
    <div
      key="arabic"
      style={{
        width: '100%',
        maxWidth: '1280px',
        margin: 'auto 0',
        textAlign: textAlignment,
        padding: '0 32px',
        boxSizing: 'border-box',
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
        {ayahData.words.map((w: QuranWord) => {
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
    config.showPrimaryTranslation && ayahData.primaryTranslation ? (
      <p
        key="primary"
        style={{
          fontFamily: "'Hind Siliguri', 'Kalpurush', 'Noto Sans Bengali', sans-serif",
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
        {ayahData.primaryTranslation}
      </p>
    ) : null;

  const secondarySubtitle =
    config.showSecondaryTranslation && ayahData.secondaryTranslation ? (
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
        {ayahData.secondaryTranslation}
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

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '52px 64px 44px',
        userSelect: 'none',
        opacity: entranceProgress,
        transform: `translateY(${(1 - entranceProgress) * 20}px)`,
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* TOP HEADER: Surah Calligraphy Badge & Metadata Pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
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
            fontFamily: "'Inter', sans-serif",
            color: 'rgba(255, 255, 255, 0.95)',
            fontSize: '16px',
            fontWeight: 500,
            letterSpacing: '0.04em',
          }}
        >
          {ayahData.surahNameTransliterated} • Ayah {ayahData.ayah}
        </span>
      </div>

      {/* Main Scripture & Subtitle Layers in chosen layout order */}
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
    </AbsoluteFill>
  );
};
