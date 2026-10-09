import React from 'react';
import { useStudioStore } from '../../store/studio-store';
import { getSurahByNumber } from '../../../shared/surahs';
import { Film, Sparkles, SlidersHorizontal } from 'lucide-react';

export const Header: React.FC = () => {
  const { config, setExportModalOpen } = useStudioStore();
  const currentSurah = getSurahByNumber(config.surahNumber);
  const surahCode = `surah${String(config.surahNumber).padStart(3, '0')}`;

  return (
    <header className="h-16 border-b border-gray-800/80 bg-gray-950/70 backdrop-blur-md px-6 flex items-center justify-between z-30 select-none">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <span className="text-black font-extrabold text-lg">قرآن</span>
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            Quran Video Studio
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              v1.0
            </span>
          </h1>
          <p className="text-[11px] text-gray-400">Desktop Motion Graphics & Recitation Studio</p>
        </div>
      </div>

      {/* Surah Capsule Center Indicator */}
      <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-gray-900/90 border border-gray-800 shadow-inner">
        <span className="surah-calligraphy-title text-2xl text-amber-300">
          {surahCode}
        </span>
        <div className="h-4 w-[1px] bg-gray-700" />
        <span className="text-xs text-gray-200 font-medium">
          Surah {currentSurah.nameTransliterated} • Verses {config.fromAyah}–{config.toAyah}
        </span>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 font-mono bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-xl">
          <span>{config.aspectRatio}</span>
          <span>•</span>
          <span>{config.resolution}</span>
        </div>

        <button
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-xs shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all transform active:scale-95"
        >
          <Film className="w-4 h-4 stroke-[2.5]" />
          <span>Export Video</span>
        </button>
      </div>
    </header>
  );
};
