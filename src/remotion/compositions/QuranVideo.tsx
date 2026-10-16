import React, { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Series,
  Sequence,
  Audio,
  OffthreadVideo,
  interpolate,
  useCurrentFrame,
  staticFile,
  delayRender,
  continueRender,
} from 'remotion';
import { QuranVideoCompositionProps, AyahSequenceData, TransitionType } from '../../shared/types';
import { BackgroundLayer } from './BackgroundLayer';
import { WaveformLayer } from './WaveformLayer';
import { TypographyLayer } from './TypographyLayer';
import { BrandingLayer } from './BrandingLayer';
import { ProgrammaticIntro } from './ProgrammaticIntro';
import { ProgrammaticOutro } from './ProgrammaticOutro';
import { SurahTitleCard } from './SurahTitleCard';
import { getMediaUrl } from '../../shared/media-url';

interface IntroSequenceProps {
  videoPath: string;
  durationInFrames: number;
  muted: boolean;
  transition: TransitionType;
}

const IntroSequence: React.FC<IntroSequenceProps> = ({
  videoPath,
  durationInFrames,
  muted,
  transition = 'dip-black',
}) => {
  const frame = useCurrentFrame();
  const transitionFrames = Math.min(18, Math.max(6, Math.floor(durationInFrames / 3)));
  const exitStart = durationInFrames - transitionFrames;

  let opacity = 1;
  let transform = '';

  if (transition === 'dip-black' || transition === 'crossfade' || transition === 'blur-fade') {
    if (frame >= exitStart) {
      opacity = interpolate(frame, [exitStart, durationInFrames], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }
  } else if (transition === 'zoom-fade') {
    if (frame >= exitStart) {
      const p = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      opacity = 1 - p;
      transform = `scale(${1 + p * 0.08})`;
    }
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000000',
        overflow: 'hidden',
        opacity,
        transform,
      }}
    >
      <OffthreadVideo
        src={getMediaUrl(videoPath)}
        muted={muted}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
        }}
      />
    </AbsoluteFill>
  );
};

const MainContentFadeWrapper: React.FC<{
  hasPrecedingSection: boolean;
  transition: TransitionType;
  children: React.ReactNode;
}> = ({ hasPrecedingSection, transition, children }) => {
  const frame = useCurrentFrame();
  let opacity = 1;

  if (hasPrecedingSection && (transition === 'dip-black' || transition === 'crossfade')) {
    const fadeFrames = 12;
    opacity = interpolate(frame, [0, fadeFrames], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
};

export const QuranVideo: React.FC<QuranVideoCompositionProps> = ({
  config,
  ayahs,
  totalDurationInFrames,
  reciterInfo,
}) => {
  // Guarantee fonts are fully loaded before capturing frames
  const [handle] = useState(() => delayRender('fonts-loader'));

  useEffect(() => {
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready
        .then(() => {
          continueRender(handle);
        })
        .catch(() => {
          continueRender(handle);
        });
    } else {
      continueRender(handle);
    }
  }, [handle]);

  // 1. Intro Video Bumper (Plays before anything else)
  const isIntroActive = Boolean(
    config.enableIntroVideo &&
    (config.introMode === 'custom-video' ? config.introVideoPath : true) &&
    !(config.skipIntroForShorts !== false && config.aspectRatio === '9:16')
  );
  const introDurationInFrames = isIntroActive
    ? Math.max(1, Math.round((config.introVideoDurationSeconds || 4) * config.fps))
    : 0;

  // 2. Surah Title & Reciter Info Transition Screen (Plays right after Intro)
  const isTitleCardActive = Boolean(
    config.enableSurahTitleCard &&
    !(config.skipTitleCardForShorts !== false && config.aspectRatio === '9:16')
  );
  const titleCardDurationInFrames = isTitleCardActive
    ? Math.max(1, Math.round((config.titleCardDurationSeconds || 3.5) * config.fps))
    : 0;

  // 3. Outro Video Bumper (Plays at the very end of video)
  const isOutroActive = Boolean(
    config.enableOutroVideo &&
    (config.outroMode === 'custom-video' ? config.outroVideoPath : true) &&
    !(config.skipOutroForShorts !== false && config.aspectRatio === '9:16')
  );
  const outroDurationInFrames = isOutroActive
    ? Math.max(1, Math.round((config.outroVideoDurationSeconds || 4.5) * config.fps))
    : 0;

  const nonScriptureFrames = introDurationInFrames + titleCardDurationInFrames + outroDurationInFrames;
  const scriptureDurationInFrames = Math.max(1, totalDurationInFrames - nonScriptureFrames);
  const scriptureStartFrame = introDurationInFrames + titleCardDurationInFrames;
  const outroStartFrame = scriptureStartFrame + scriptureDurationInFrames;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000000',
        userSelect: 'none',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
      }}
    >
      {/* Self-contained Font Registration and OpenType Typography Rules */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Noto+Nastaliq+Urdu:wght@400;700&family=Noto+Sans+Bengali:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans+Gurmukhi:wght@400;600;700&family=Noto+Sans+JP:wght@400;500;700&family=Noto+Sans+KR:wght@400;500;700&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Sans+Tamil:wght@400;600;700&display=swap');

        @font-face {
          font-family: 'surah-name-v1';
          src: url('${staticFile('Quran fonts/surah-name-v1.ttf')}') format('truetype');
          font-display: block;
        }

        @font-face {
          font-family: 'KFGQPC Uthmanic Script HAFS';
          src: url('${staticFile('Quran fonts/KFGQPC Uthmanic Script HAFS Regular.otf')}') format('opentype');
          font-display: block;
        }

        @font-face {
          font-family: 'KFGQPC HAFS Uthmanic Script';
          src: url('${staticFile('Quran fonts/QPC Hafs font.ttf')}') format('truetype');
          font-display: block;
        }

        @font-face {
          font-family: 'me_quran';
          src: url('${staticFile('Quran fonts/me_quran_volt_newmet.ttf')}') format('truetype');
          font-display: block;
        }

        @font-face {
          font-family: 'AlQuran Neo v5x1';
          src: url('${staticFile('Quran fonts/AlQuranNeov5x1.ttf')}') format('truetype');
          font-display: block;
        }

        @font-face {
          font-family: 'AlQuran IndoPak by QuranWBW';
          src: url('${staticFile('Quran fonts/Indopak Nastaleeq font.ttf')}') format('truetype');
          font-display: block;
        }

        @font-face {
          font-family: 'Al Qalam Quran Majeed Web';
          src: url('${staticFile('Quran fonts/Al Qalam Quran Majeed Web Regular.ttf')}') format('truetype');
          font-display: block;
        }

        @font-face {
          font-family: 'noorehira';
          src: url('${staticFile('Quran fonts/noorehira Regular.ttf')}') format('truetype');
          font-display: block;
        }

        @font-face {
          font-family: 'noorehuda';
          src: url('${staticFile('Quran fonts/noorehuda Regular.ttf')}') format('truetype');
          font-display: block;
        }

        @font-face {
          font-family: 'Amiri';
          src: url('${staticFile('Quran fonts/Amiri Regular.ttf')}') format('truetype');
          font-display: block;
        }

        @font-face {
          font-family: 'Lateef';
          src: url('${staticFile('Quran fonts/Lateef Regular.ttf')}') format('truetype');
          font-display: block;
        }

        .surah-calligraphy-title {
          font-family: 'surah-name-v1', sans-serif !important;
          font-feature-settings: "liga" 1, "dlig" 1;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
        }

        .quran-arabic-text {
          direction: rtl;
          unicode-bidi: isolate;
          text-align: center;
          font-feature-settings: "kern" 1, "liga" 1, "mkmk" 1, "mark" 1, "calt" 1;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      {/* Section 0: Channel Intro Video Bumper (Plays before main recitation) */}
      {isIntroActive && (
        <Sequence
          from={0}
          durationInFrames={introDurationInFrames}
          name="Channel Intro Video"
        >
          {config.introMode === 'custom-video' && config.introVideoPath ? (
            <IntroSequence
              videoPath={config.introVideoPath}
              durationInFrames={introDurationInFrames}
              muted={config.introMuted === true}
              transition={config.introTransition || 'dip-black'}
            />
          ) : (
            <ProgrammaticIntro
              config={config}
              durationInFrames={introDurationInFrames}
              transition={config.introTransition || 'dip-black'}
            />
          )}
        </Sequence>
      )}

      {/* Section 1: Surah Title & Reciter Info Transition Screen (Plays right after Intro) */}
      {isTitleCardActive && (
        <Sequence
          from={introDurationInFrames}
          durationInFrames={titleCardDurationInFrames}
          name="Surah Title Card"
        >
          <SurahTitleCard
            config={config}
            reciterInfo={reciterInfo}
            durationInFrames={titleCardDurationInFrames}
            transition={config.titleCardTransition || 'dip-black'}
          />
        </Sequence>
      )}

      {/* Section 2: Main Scripture Recitation & Visual Content */}
      <Sequence
        from={scriptureStartFrame}
        durationInFrames={scriptureDurationInFrames}
        name="Main Scripture Content"
      >
        <MainContentFadeWrapper
          hasPrecedingSection={isIntroActive || isTitleCardActive}
          transition={
            isTitleCardActive
              ? (config.titleCardTransition || 'dip-black')
              : (config.introTransition || 'dip-black')
          }
        >
          {/* Layer 1: Ambient Background (Spans Scripture Content) */}
          <BackgroundLayer
            type={config.backgroundType}
            source={config.backgroundPath}
            clips={config.backgroundClips}
            overlayOpacity={config.overlayOpacity}
            vignetteIntensity={config.vignetteIntensity}
            kenBurnsEffect={config.kenBurnsEffect}
            totalDurationInFrames={scriptureDurationInFrames}
            fps={config.fps}
          />

          {/* Sequential Ayah Audio & Typography Display */}
          {ayahs && ayahs.length > 0 ? (
            <Series>
              {ayahs.map((ayahData: AyahSequenceData, index: number) => {
                const audioSrc = getMediaUrl(ayahData.audioUrl);

                return (
                  <Series.Sequence
                    key={`${ayahData.surah}:${ayahData.ayah}_${index}`}
                    durationInFrames={Math.max(1, ayahData.durationInFrames)}
                  >
                    {/* Recitation Audio Track */}
                    {audioSrc && (
                      <Audio
                        src={audioSrc}
                        playbackRate={config.recitationSpeed || 1.0}
                      />
                    )}

                    {/* Layer 2: Audio-Reactive Waveform */}
                    {config.showWaveform && (
                      <WaveformLayer
                        audioUrl={audioSrc}
                        type={config.waveformType}
                        color={config.waveformColor}
                        colorSecondary={config.waveformColorSecondary}
                        height={config.waveformHeight}
                        width={config.waveformWidth ?? 92}
                        amplitude={config.waveformAmplitude ?? 2.2}
                        positionY={config.waveformPositionY}
                        glow={config.waveformGlow ?? true}
                        glowIntensity={config.waveformGlowIntensity ?? 1.5}
                        fillArea={config.waveformFillArea ?? false}
                        barWidth={config.waveformBarWidth ?? 6}
                        sampleCount={config.waveformSampleCount ?? 64}
                        circularRadius={config.waveformCircularRadius ?? 130}
                        opacity={config.waveformOpacity ?? 0.9}
                      />
                    )}

                    {/* Layer 3: Typographic Hierarchy & Synchronized Karaoke */}
                    <TypographyLayer
                      config={config}
                      ayahData={ayahData}
                      fps={config.fps}
                    />
                  </Series.Sequence>
                );
              })}
            </Series>
          ) : null}

          {/* Layer 4: Channel Identity & Watermark (Spans Main Video) */}
          {config.showBranding && (
            <BrandingLayer
              logoPath={config.logoPath}
              channelHandle={config.channelHandle}
              position={config.brandingPosition}
              scale={config.brandingScale}
            />
          )}
        </MainContentFadeWrapper>
      </Sequence>

      {/* Section 3: Channel Outro / Ending Video Clip */}
      {isOutroActive && (
        <Sequence
          from={outroStartFrame}
          durationInFrames={outroDurationInFrames}
          name="Channel Outro Video"
        >
          {config.outroMode === 'custom-video' && config.outroVideoPath ? (
            <IntroSequence
              videoPath={config.outroVideoPath}
              durationInFrames={outroDurationInFrames}
              muted={config.outroMuted === true}
              transition={config.outroTransition || 'dip-black'}
            />
          ) : (
            <ProgrammaticOutro
              config={config}
              durationInFrames={outroDurationInFrames}
              transition={config.outroTransition || 'dip-black'}
            />
          )}
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
