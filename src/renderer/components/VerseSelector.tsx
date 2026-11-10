import React from 'react';
import { useStudioStore } from '../store/studio-store';
import { SURAHS_LIST, getSurahByNumber } from '../../shared/surahs';
import { getSurahNameLocalized } from '../../shared/surah-localization';
import { ScriptType, isSalatJammatManifest } from '../../shared/types';
import { BookOpen, Hash, Layers, FileJson, Sparkles } from 'lucide-react';

export const VerseSelector: React.FC = () => {
  const { config, changeSurah, changeAyahRange, changeScript, updateConfig, customTimestamp, setActiveTab } = useStudioStore();
  const currentSurah = getSurahByNumber(config.surahNumber);
  const localizedSurahName = getSurahNameLocalized(
    config.surahNumber,
    config.headerLanguage && config.headerLanguage !== 'auto' ? config.headerLanguage : config.primaryTranslationLang
  );

  const isSalat = isSalatJammatManifest(customTimestamp);
  const isCustomTimingActive = Boolean(
    customTimestamp &&
    !isSalat &&
    (customTimestamp as any).surah_number === config.surahNumber
  );

  return (
    <div className="space-y-6">
      {/* Surah Selection */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">
          <BookOpen className="w-4 h-4 text-amber-400" />
          Surah (Chapter)
        </label>
        <div className="relative">
          <select
            value={config.surahNumber}
            onChange={(e) => changeSurah(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700/80 hover:border-gray-600 rounded-xl px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-medium text-sm"
          >
            {SURAHS_LIST.map((surah) => (
              <option key={surah.number} value={surah.number} className="bg-gray-900 text-white py-1">
                {surah.number}. {surah.nameTransliterated} ({surah.nameArabic}) — {surah.totalAyahs} Ayahs
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>

        {/* Selected Surah Badge preview */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900/50 border border-gray-800">
          <div className="flex items-center gap-3">
            <span className="surah-calligraphy-title text-2xl text-amber-300">
              {`surah${String(config.surahNumber).padStart(3, '0')}`}
            </span>
            <div className="text-xs">
              <span className="font-semibold text-white">
                {localizedSurahName !== currentSurah.nameTransliterated ? `${localizedSurahName} (${currentSurah.nameTransliterated})` : currentSurah.nameEnglish}
              </span>
              <span className="text-gray-400 ml-2">({currentSurah.nameEnglish} • {currentSurah.revelationType})</span>
            </div>
          </div>
          <span className="text-xs text-amber-400/90 font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            {currentSurah.totalAyahs} Verses
          </span>
        </div>

        {isSalat && customTimestamp && (
          <div id="scripture-salat-jamaah" className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/40 via-gray-900 to-gray-950 border border-emerald-500/40 space-y-2.5 text-xs shadow-lg shadow-emerald-950/20 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Salat Jama'ah Recitation Mode</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                {(customTimestamp as any).segments?.length || 0} Segments
              </span>
            </div>
            <div className="space-y-1.5 pt-0.5">
              {(customTimestamp as any).segments?.map((seg: any) => (
                <div
                  key={seg.segment_id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-950/80 border border-gray-800 text-[11px]"
                >
                  <div className="min-w-0">
                    <span className="text-white font-medium block truncate">
                      {seg.label}
                    </span>
                    <span className="text-gray-400 text-[10px]">
                      Surah {seg.surah_name_en} ({seg.surah_name_ar})
                    </span>
                  </div>
                  <span className="text-emerald-400 font-mono text-right shrink-0">
                    v{seg.start_ayah}–{seg.end_ayah} <span className="text-gray-500">({Math.round(seg.duration_ms / 1000)}s)</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-gray-800/80 text-[11px]">
              <span className="text-gray-400">
                Multi-Surah prayer with automatic gap alignment
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('audio')}
                className="text-emerald-400 hover:text-emerald-200 underline font-medium transition"
              >
                Audio Settings
              </button>
            </div>
          </div>
        )}

        {isCustomTimingActive && customTimestamp && !isSalat && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs">
            <div className="flex items-center gap-2 text-emerald-300">
              <FileJson className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>
                Timings driven by <strong>Whisper JSON</strong> ({customTimestamp.start_ayah}–{customTimestamp.end_ayah})
              </span>
            </div>
            <button
              onClick={() => setActiveTab('audio')}
              className="text-[11px] underline text-emerald-400 hover:text-emerald-200 transition"
            >
              Manage in Audio Tab
            </button>
          </div>
        )}
      </div>

      {/* Ayah Range */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">
          <Hash className="w-4 h-4 text-amber-400" />
          Ayah Range
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[11px] text-gray-400 mb-1 block">From Ayah</span>
            <input
              type="number"
              min={1}
              max={config.toAyah}
              value={config.fromAyah}
              onChange={(e) => changeAyahRange(Number(e.target.value), config.toAyah)}
              className="w-full bg-gray-900 border border-gray-700/80 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div>
            <span className="text-[11px] text-gray-400 mb-1 block">To Ayah</span>
            <input
              type="number"
              min={config.fromAyah}
              max={currentSurah.totalAyahs}
              value={config.toAyah}
              onChange={(e) => changeAyahRange(config.fromAyah, Number(e.target.value))}
              className="w-full bg-gray-900 border border-gray-700/80 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>

        {/* Quick Range Presets */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => changeAyahRange(1, 1)}
            className="text-xs px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
          >
            First Ayah (1:1)
          </button>
          <button
            onClick={() => changeAyahRange(1, Math.min(3, currentSurah.totalAyahs))}
            className="text-xs px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
          >
            Verses 1–3
          </button>
          <button
            onClick={() => changeAyahRange(1, Math.min(7, currentSurah.totalAyahs))}
            className="text-xs px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
          >
            Full Surah
          </button>
        </div>
      </div>

      {/* Bismillah Opening Preface */}
      <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-semibold text-xs tracking-wide">
              Bismillah Opening
            </span>
          </div>

          {config.surahNumber === 9 ? (
            <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-medium">
              Omitted for Surah 9
            </span>
          ) : config.surahNumber === 1 && config.fromAyah === 1 ? (
            <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-medium">
              Ayah 1 is Bismillah
            </span>
          ) : (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeBismillah !== false}
                onChange={(e) => updateConfig({ includeBismillah: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          )}
        </div>

        <p className="text-[11px] text-gray-400 leading-relaxed">
          {config.surahNumber === 9
            ? 'Surah At-Tawbah does not begin with Bismillah in the Holy Quran, so Bismillah is strictly omitted.'
            : config.surahNumber === 1 && config.fromAyah === 1
            ? 'Surah Al-Fatihah already begins with Bismillah as its first verse.'
            : 'Prepend the recitation, synchronized karaoke, and typography of Bismillahi-r-Rahmani-r-Raheem at the beginning of the video.'}
        </p>
      </div>

      {/* Scripture Orthography Selection */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">
          <Layers className="w-4 h-4 text-amber-400" />
          Quran Script (SQLite Corpus)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'qpc-nastaleeq', label: 'Medina Hafs', sub: 'QPC Complex' },
            { id: 'indopak-nastaleeq', label: 'Indo-Pak', sub: 'South Asian' },
            { id: 'imlaei', label: 'Imlaei', sub: 'Standard Naskh' },
          ].map((item) => {
            const isSelected = config.script === item.id;
            return (
              <button
                key={item.id}
                onClick={() => changeScript(item.id as ScriptType)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                }`}
              >
                <span className="text-xs font-bold">{item.label}</span>
                <span className="text-[10px] text-gray-400/80 mt-0.5">{item.sub}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
