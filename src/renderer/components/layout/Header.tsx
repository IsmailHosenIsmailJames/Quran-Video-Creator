import React, { useMemo } from 'react';
import { useStudioStore } from '../../store/studio-store';
import { getSurahByNumber } from '../../../shared/surahs';
import { Film } from 'lucide-react';

export const Header: React.FC = () => {
  const { config, totalDurationInFrames, setExportModalOpen } = useStudioStore();
  const currentSurah = getSurahByNumber(config.surahNumber);
  const surahCode = `surah${String(config.surahNumber).padStart(3, '0')}`;

  const { compWidth, compHeight } = useMemo(() => {
    if (config.aspectRatio === '9:16') return { compWidth: 1080, compHeight: 1920 };
    if (config.aspectRatio === '1:1') return { compWidth: 1080, compHeight: 1080 };
    return { compWidth: 1920, compHeight: 1080 };
  }, [config.aspectRatio]);

  const durationSec = (totalDurationInFrames / config.fps).toFixed(1);

  return (
    <header className="h-11 border-b border-gray-800/80 bg-gray-950/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none flex-shrink-0">
      {/* Brand & Video Specs (Merged Toolbar) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-md shadow-amber-500/20">
            <span className="text-black font-extrabold text-[11px] leading-none">قرآن</span>
          </div>
          <span className="text-xs font-bold text-white tracking-wide">
            Quran Video Studio
          </span>
        </div>

        <div className="h-3.5 w-[1px] bg-gray-800" />

        {/* Real-time Video Canvas Specs */}
        <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-lg bg-gray-900 border border-gray-800 text-[11px] text-gray-400 font-mono">
          <span className="text-amber-400 font-semibold">{config.aspectRatio}</span>
          <span className="text-gray-600">•</span>
          <span>{compWidth}×{compHeight}</span>
          <span className="text-gray-600">•</span>
          <span>{config.fps} FPS</span>
          <span className="text-gray-600">•</span>
          <span className="text-gray-300">{durationSec}s</span>
          <span className="text-gray-500">({totalDurationInFrames}f)</span>
        </div>
      </div>

      {/* Surah Capsule Center Indicator */}
      <div className="hidden md:flex items-center gap-2.5 px-3 py-1 rounded-full bg-gray-900/90 border border-gray-800 shadow-inner">
        <span className="surah-calligraphy-title text-xl text-amber-300 leading-none">
          {surahCode}
        </span>
        <div className="h-3.5 w-[1px] bg-gray-700" />
        <span className="text-xs text-gray-200 font-medium">
          Surah {currentSurah.nameTransliterated} • Verses {config.fromAyah}–{config.toAyah}
        </span>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-xs shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all transform active:scale-95"
          title="Export Video (Ctrl+E)"
        >
          <Film className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Export Video</span>
        </button>
      </div>
    </header>
  );
};
