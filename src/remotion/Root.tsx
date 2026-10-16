import React from 'react';
import { Composition } from 'remotion';
import { QuranVideo } from './compositions/QuranVideo';
import { QuranVideoCompositionProps } from '../shared/types';
import { DEFAULT_TEMPLATE_CONFIG } from '../shared/constants';

const defaultProps: QuranVideoCompositionProps = {
  config: DEFAULT_TEMPLATE_CONFIG,
  ayahs: [
    {
      surah: 1,
      ayah: 1,
      surahNameArabic: 'الفاتحة',
      surahNameTransliterated: 'Al-Fatihah',
      words: [
        { id: 1, location: '1:1:1', surah: 1, ayah: 1, word: 1, text: 'بِسْمِ' },
        { id: 2, location: '1:1:2', surah: 1, ayah: 1, word: 2, text: 'اللَّهِ' },
        { id: 3, location: '1:1:3', surah: 1, ayah: 1, word: 3, text: 'الرَّحْمَٰنِ' },
        { id: 4, location: '1:1:4', surah: 1, ayah: 1, word: 4, text: 'الرَّحِيمِ' },
      ],
      primaryTranslation: '(আরম্ভ করছি) পরম করুণাময় অসীম দয়াময় আল্লাহর নামে।',
      secondaryTranslation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
      audioUrl: 'https://audio-cdn.tarteel.ai/quran/alafasy/001001.mp3',
      durationInFrames: 180, // 6 seconds at 30fps
      segments: [
        { wordIndex: 1, startMs: 0, endMs: 560 },
        { wordIndex: 2, startMs: 760, endMs: 1200 },
        { wordIndex: 3, startMs: 2000, endMs: 2360 },
        { wordIndex: 4, startMs: 2680, endMs: 6120 },
      ],
    },
  ],
  totalDurationInFrames: 180,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition<any, QuranVideoCompositionProps>
        id="QuranVideo"
        component={QuranVideo}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
        calculateMetadata={({ props }) => {
          const config = props.config || DEFAULT_TEMPLATE_CONFIG;
          const fps = config.fps || 30;
          let width = 1920;
          let height = 1080;

          if (config.aspectRatio === '9:16') {
            width = 1080;
            height = 1920;
          } else if (config.aspectRatio === '1:1') {
            width = 1080;
            height = 1080;
          }

          if (config.resolution === '4k') {
            width = Math.round(width * 2);
            height = Math.round(height * 2);
          } else if (config.resolution === '720p') {
            width = Math.round(width * (720 / 1080));
            height = Math.round(height * (720 / 1080));
          }

          const isIntroActive = Boolean(
            config.enableIntroVideo &&
            (config.introMode === 'custom-video' ? config.introVideoPath : true) &&
            !(config.skipIntroForShorts !== false && config.aspectRatio === '9:16')
          );
          const introFrames = isIntroActive
            ? Math.max(1, Math.round((config.introVideoDurationSeconds || 4) * fps))
            : 0;

          const isTitleCardActive = Boolean(
            config.enableSurahTitleCard &&
            !(config.skipTitleCardForShorts !== false && config.aspectRatio === '9:16')
          );
          const titleCardFrames = isTitleCardActive
            ? Math.max(1, Math.round((config.titleCardDurationSeconds || 3.5) * fps))
            : 0;

          const isOutroActive = Boolean(
            config.enableOutroVideo &&
            (config.outroMode === 'custom-video' ? config.outroVideoPath : true) &&
            !(config.skipOutroForShorts !== false && config.aspectRatio === '9:16')
          );
          const outroFrames = isOutroActive
            ? Math.max(1, Math.round((config.outroVideoDurationSeconds || 4.5) * fps))
            : 0;

          const fallbackScripture = props.ayahs?.reduce((acc, a) => acc + (a.durationInFrames || 150), 0) || 180;
          const durationInFrames = Math.max(
            30,
            props.totalDurationInFrames ||
              (fallbackScripture + introFrames + titleCardFrames + outroFrames)
          );

          return {
            fps,
            width,
            height,
            durationInFrames,
          };
        }}
      />
    </>
  );
};
