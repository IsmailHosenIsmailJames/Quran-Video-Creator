import React from 'react';
import { useStudioStore } from '../../store/studio-store';
import { VerseSelector } from '../VerseSelector';
import { FONT_OPTIONS } from '../../../shared/constants';
import { Type, Sparkles } from 'lucide-react';

export const ScriptureTab: React.FC = () => {
  const { config, updateConfig } = useStudioStore();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Surah & Ayah Selector */}
      <VerseSelector />

      {/* 2. Arabic Scripture Typography */}
      <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-gray-800 text-xs font-semibold text-amber-300 uppercase tracking-wider">
          <Type className="w-4 h-4 text-amber-400" />
          Arabic Scripture Typography
        </div>

        {/* Font Family */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400">Quran Font Family</label>
          <select
            value={config.selectedQuranFont}
            onChange={(e) => updateConfig({ selectedQuranFont: e.target.value })}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font.id} value={font.id} className="bg-gray-900 text-white">
                {font.name}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size & Line Height */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Font Size</span>
              <span className="text-amber-400 font-mono">{config.arabicFontSize}px</span>
            </div>
            <input
              type="range"
              min={36}
              max={84}
              value={config.arabicFontSize}
              onChange={(e) => updateConfig({ arabicFontSize: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Line Height</span>
              <span className="text-amber-400 font-mono">{config.arabicLineHeight}</span>
            </div>
            <input
              type="range"
              min={1.8}
              max={3.2}
              step={0.1}
              value={config.arabicLineHeight}
              onChange={(e) => updateConfig({ arabicLineHeight: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Colors & Karaoke Glow */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 block">Resting Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.arabicTextColor}
                onChange={(e) => updateConfig({ arabicTextColor: e.target.value })}
                className="w-8 h-8 rounded border border-gray-700 bg-transparent cursor-pointer"
              />
              <span className="text-xs font-mono text-gray-300">{config.arabicTextColor}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 block">Karaoke Active Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.arabicActiveColor}
                onChange={(e) => updateConfig({ arabicActiveColor: e.target.value })}
                className="w-8 h-8 rounded border border-gray-700 bg-transparent cursor-pointer"
              />
              <span className="text-xs font-mono text-amber-400">{config.arabicActiveColor}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Active Word Neon Glow
          </span>
          <input
            type="checkbox"
            checked={config.arabicActiveGlow}
            onChange={(e) => updateConfig({ arabicActiveGlow: e.target.checked })}
            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
