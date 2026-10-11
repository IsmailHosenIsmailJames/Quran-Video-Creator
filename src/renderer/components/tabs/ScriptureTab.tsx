import React, { useState } from 'react';
import { useStudioStore } from '../../store/studio-store';
import { VerseSelector } from '../VerseSelector';
import { FONT_OPTIONS, TEXT_ANIMATION_IN_OPTIONS, TEXT_ANIMATION_OUT_OPTIONS } from '../../../shared/constants';
import { ScriptBlockType } from '../../../shared/types';
import {
  Type,
  Sparkles,
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const ScriptureTab: React.FC = () => {
  const {
    config,
    updateConfig,
    ayahs,
    updateAyahFontOverride,
    resetAyahFontOverride,
  } = useStudioStore();

  const [showAyahList, setShowAyahList] = useState(true);

  // Script Layout Order
  const currentOrder: ScriptBlockType[] = config.scriptLayoutOrder || ['arabic', 'secondary', 'primary'];

  const moveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;
    const newOrder = [...currentOrder];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    updateConfig({ scriptLayoutOrder: newOrder });
  };

  const BLOCK_NAMES: Record<ScriptBlockType, { label: string; desc: string }> = {
    arabic: { label: 'Arabic Quran Scripture', desc: 'Word-by-word Quranic text' },
    secondary: { label: 'English Translation', desc: 'Secondary vernacular subtitle' },
    primary: { label: 'Primary Subtitle', desc: `${config.primaryTranslationLang || 'Native'} translation` },
  };

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

        {/* Font Size (Wider Range 10 to 100) & Line Height */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Default Font Size</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={config.arabicFontSize}
                  onChange={(e) =>
                    updateConfig({
                      arabicFontSize: Math.max(10, Math.min(100, Number(e.target.value))),
                    })
                  }
                  className="w-12 bg-gray-950 border border-gray-700 rounded px-1.5 py-0.5 text-amber-400 font-mono text-xs text-right"
                />
                <span className="text-gray-500 text-[11px]">px</span>
              </div>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={config.arabicFontSize}
              onChange={(e) => updateConfig({ arabicFontSize: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>10px</span>
              <span>55px</span>
              <span>100px</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
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
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>1.8</span>
              <span>2.5</span>
              <span>3.2</span>
            </div>
          </div>
        </div>

        {/* Text Alignment for All (Quran, English, Subtitle) */}
        <div className="space-y-1.5 pt-1">
          <label className="text-xs text-gray-400 block">Horizontal Alignment (All Layers)</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'left' as const, label: 'Left', icon: AlignLeft },
              { id: 'center' as const, label: 'Center (All)', icon: AlignCenter },
              { id: 'right' as const, label: 'Right', icon: AlignRight },
            ].map(({ id, label, icon: Icon }) => {
              const isSelected = (config.textAlignment || 'center') === id;
              return (
                <button
                  key={id}
                  onClick={() => updateConfig({ textAlignment: id })}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/80 text-amber-300 shadow-sm'
                      : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Vertical Alignment (Screen Position) */}
        <div className="space-y-2 pt-2 border-t border-gray-800/60">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-300 font-medium block">
              Vertical Alignment (Screen Position)
            </label>
            <span className="text-[10px] text-amber-400/80 font-mono">
              {config.verticalAlignment === 'top'
                ? 'Top (Upper Area)'
                : config.verticalAlignment === 'bottom'
                ? 'Bottom (Subtitles)'
                : config.verticalAlignment === 'split'
                ? 'Split (Distributed)'
                : 'Middle (Center of Screen)'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'middle' as const, label: 'Middle', desc: 'Center of Screen' },
              { id: 'bottom' as const, label: 'Bottom', desc: 'Lower Area' },
              { id: 'top' as const, label: 'Top', desc: 'Upper Area' },
              { id: 'split' as const, label: 'Split', desc: 'Mid / Bottom' },
            ].map(({ id, label, desc }) => {
              const isSelected = (config.verticalAlignment || 'middle') === id;
              return (
                <button
                  key={id}
                  onClick={() => updateConfig({ verticalAlignment: id })}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                      : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-900'
                  }`}
                  title={`${label}: ${desc}`}
                >
                  <span className="font-semibold text-xs">{label}</span>
                  <span className="text-[9px] text-gray-500 mt-0.5 leading-tight text-center">{desc}</span>
                </button>
              );
            })}
          </div>

          {/* Vertical Fine-Tuning Offset Slider */}
          <div className="pt-1.5 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 text-[11px]">Vertical Fine-Tune Offset (Nudge):</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-amber-300 text-xs">
                  {config.verticalCustomOffset ? `${config.verticalCustomOffset > 0 ? '+' : ''}${config.verticalCustomOffset}px` : '0px (Default)'}
                </span>
                {config.verticalCustomOffset !== 0 && config.verticalCustomOffset !== undefined && (
                  <button
                    onClick={() => updateConfig({ verticalCustomOffset: 0 })}
                    className="p-0.5 hover:text-amber-400 text-gray-500 transition"
                    title="Reset vertical offset to 0"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <input
              type="range"
              min="-150"
              max="150"
              step="2"
              value={config.verticalCustomOffset || 0}
              onChange={(e) => updateConfig({ verticalCustomOffset: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>-150px (Higher)</span>
              <span>0 (Center)</span>
              <span>+150px (Lower)</span>
            </div>
          </div>

          {/* Top Surah Header Badge Toggle */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-gray-400">Show Surah Title Badge at Top</span>
            <input
              type="checkbox"
              checked={config.showSurahHeader !== false}
              onChange={(e) => updateConfig({ showSurahHeader: e.target.checked })}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
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

      {/* 3. Layer Display Ordering (Swap Quran, English, Subtitle) */}
      <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-gray-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-amber-400" />
            Script & Subtitles Display Order
          </div>
          <button
            onClick={() => updateConfig({ scriptLayoutOrder: ['arabic', 'secondary', 'primary'] })}
            className="text-[10px] text-gray-500 hover:text-amber-400 transition"
            title="Reset to Quran ➔ English ➔ Subtitle"
          >
            Reset Order
          </button>
        </div>
        <p className="text-[11px] text-gray-400">
          Choose the vertical sequence of text on screen (e.g. Quran script first, then English, then native subtitle):
        </p>

        <div className="space-y-2 pt-1">
          {currentOrder.map((type, idx) => {
            const info = BLOCK_NAMES[type];
            return (
              <div
                key={type}
                className="flex items-center justify-between bg-gray-950 p-2.5 rounded-xl border border-gray-800/80 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-semibold text-gray-200">{info.label}</div>
                    <div className="text-[10px] text-gray-500">{info.desc}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveOrder(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveOrder(idx, 'down')}
                    disabled={idx === currentOrder.length - 1}
                    className="p-1 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Verse Motion & Transitions (In / Out) */}
      <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-gray-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Verse Motion & Transitions (In & Out)
          </div>
        </div>

        {/* Entrance & Exit Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* In Animation (Entrance) */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-300 font-medium">Entrance Animation (In)</label>
            <select
              value={config.animationIn || 'float-up'}
              onChange={(e) => updateConfig({ animationIn: e.target.value as any })}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
            >
              {TEXT_ANIMATION_IN_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-500">
              {TEXT_ANIMATION_IN_OPTIONS.find((o) => o.id === (config.animationIn || 'float-up'))?.description}
            </p>
          </div>

          {/* Out Animation (Exit) */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-300 font-medium">Exit Animation (Out)</label>
            <select
              value={config.animationOut || 'fade'}
              onChange={(e) => updateConfig({ animationOut: e.target.value as any })}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
            >
              {TEXT_ANIMATION_OUT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-500">
              {TEXT_ANIMATION_OUT_OPTIONS.find((o) => o.id === (config.animationOut || 'fade'))?.description}
            </p>
          </div>
        </div>

        {/* Transition Duration Slider */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Transition Duration</span>
            <span className="font-mono text-amber-300 font-semibold">
              {config.animationDurationFrames || 18} frames (~{(((config.animationDurationFrames || 18) / (config.fps || 30))).toFixed(2)}s)
            </span>
          </div>
          <input
            type="range"
            min={6}
            max={36}
            step={2}
            value={config.animationDurationFrames || 18}
            onChange={(e) => updateConfig({ animationDurationFrames: Number(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
          />
        </div>

        {/* Stagger Subtitles Checkbox */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="text-xs text-gray-300 font-medium">Stagger Subtitles</div>
            <div className="text-[10px] text-gray-500">Translations glide in 4 frames after Arabic script</div>
          </div>
          <input
            type="checkbox"
            checked={config.staggerSubtitles !== false}
            onChange={(e) => updateConfig({ staggerSubtitles: e.target.checked })}
            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* 5. Per-Ayah Custom Font Sizing & Motion */}
      {ayahs && ayahs.length > 0 && (
        <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-3">
          <div
            onClick={() => setShowAyahList(!showAyahList)}
            className="flex items-center justify-between pb-1 border-b border-gray-800 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
              <Type className="w-4 h-4 text-amber-400" />
              <span>Per-Ayah Custom Font Sizing ({ayahs.length} verses)</span>
            </div>
            {showAyahList ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <p className="text-[11px] text-gray-400">
            Customize Arabic font size for specific long or short ayahs so the text fits comfortably without breaking the layout:
          </p>

          {showAyahList && (
            <div className="space-y-2.5 pt-1 max-h-96 overflow-y-auto pr-1">
              {ayahs.map((ayah) => {
                const key = `${ayah.surah}:${ayah.ayah}`;
                const override = config.ayahFontOverrides?.[key];
                const activeSize = override?.arabicFontSize ?? config.arabicFontSize;
                const isOverridden = Boolean(
                  override?.arabicFontSize !== undefined ||
                  (override?.animationIn && override.animationIn !== 'inherit') ||
                  (override?.animationOut && override.animationOut !== 'inherit')
                );

                return (
                  <div
                    key={key}
                    className={`p-3 rounded-xl border transition ${
                      isOverridden
                        ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20'
                        : 'bg-gray-950 border-gray-800/80 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="font-mono text-amber-400 font-bold">
                          {ayah.ayah === 0 ? 'Bismillah' : `Ayah ${ayah.ayah}`}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          ({ayah.words?.length || 0} words • {(ayah.durationInFrames / (config.fps || 30)).toFixed(1)}s)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-xs font-semibold ${
                            isOverridden ? 'text-amber-300' : 'text-gray-400'
                          }`}
                        >
                          {activeSize}px {isOverridden && <span className="text-[10px] text-amber-400">(custom)</span>}
                        </span>
                        {isOverridden && (
                          <button
                            onClick={() => resetAyahFontOverride(ayah.surah, ayah.ayah)}
                            className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition"
                            title="Reset to global font size and animation defaults"
                          >
                            <RotateCcw className="w-3 h-3 text-amber-400" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={activeSize}
                        onChange={(e) =>
                          updateAyahFontOverride(ayah.surah, ayah.ayah, {
                            arabicFontSize: Number(e.target.value),
                          })
                        }
                        className="flex-1 accent-amber-500 cursor-pointer"
                      />
                      <input
                        type="number"
                        min={10}
                        max={100}
                        value={activeSize}
                        onChange={(e) =>
                          updateAyahFontOverride(ayah.surah, ayah.ayah, {
                            arabicFontSize: Math.max(10, Math.min(100, Number(e.target.value))),
                          })
                        }
                        className="w-12 bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-amber-300 font-mono text-xs text-right"
                      />
                    </div>

                    {/* Per-Ayah In & Out Motion Override */}
                    <div className="grid grid-cols-2 gap-2 pt-2 mt-2 border-t border-gray-900 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 text-[10px] w-6">In:</span>
                        <select
                          value={override?.animationIn || 'inherit'}
                          onChange={(e) =>
                            updateAyahFontOverride(ayah.surah, ayah.ayah, {
                              animationIn: e.target.value as any,
                            })
                          }
                          className="flex-1 bg-gray-900 border border-gray-800 rounded px-1.5 py-1 text-gray-300 text-[10px] focus:outline-none cursor-pointer"
                        >
                          <option value="inherit">Default ({config.animationIn || 'float-up'})</option>
                          {TEXT_ANIMATION_IN_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 text-[10px] w-6">Out:</span>
                        <select
                          value={override?.animationOut || 'inherit'}
                          onChange={(e) =>
                            updateAyahFontOverride(ayah.surah, ayah.ayah, {
                              animationOut: e.target.value as any,
                            })
                          }
                          className="flex-1 bg-gray-900 border border-gray-800 rounded px-1.5 py-1 text-gray-300 text-[10px] focus:outline-none cursor-pointer"
                        >
                          <option value="inherit">Default ({config.animationOut || 'fade'})</option>
                          {TEXT_ANIMATION_OUT_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
