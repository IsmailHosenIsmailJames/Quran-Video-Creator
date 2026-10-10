import React, { useState } from 'react';
import { useStudioStore } from '../../store/studio-store';
import { ScriptBlockType } from '../../../shared/types';
import {
  Languages,
  Square,
  CheckSquare,
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Type,
} from 'lucide-react';

export const SubtitlesTab: React.FC = () => {
  const {
    config,
    updateConfig,
    availableLanguages,
    translatorsPrimary,
    translatorsSecondary,
    refreshAyahSequence,
    ayahs,
    updateAyahFontOverride,
    resetAyahFontOverride,
  } = useStudioStore();

  const [showAyahList, setShowAyahList] = useState(false);

  const handlePrimaryLangChange = async (lang: string) => {
    const api = window.electronAPI;
    if (!api) return;
    const translators = await api.getTranslatorsForLanguage(lang);
    useStudioStore.setState({ translatorsPrimary: translators });
    updateConfig({
      primaryTranslationLang: lang,
      primaryTranslationFile: translators[0] || '',
    });
    refreshAyahSequence();
  };

  const handleSecondaryLangChange = async (lang: string) => {
    const api = window.electronAPI;
    if (!api) return;
    const translators = await api.getTranslatorsForLanguage(lang);
    useStudioStore.setState({ translatorsSecondary: translators });
    updateConfig({
      secondaryTranslationLang: lang,
      secondaryTranslationFile: translators[0] || '',
    });
    refreshAyahSequence();
  };

  // Reorder English and Native Subtitle
  const currentOrder: ScriptBlockType[] = config.scriptLayoutOrder || ['arabic', 'secondary', 'primary'];
  const englishFirst = currentOrder.indexOf('secondary') < currentOrder.indexOf('primary');

  const toggleTranslationOrder = () => {
    const arabicIdx = currentOrder.indexOf('arabic');
    let newOrder: ScriptBlockType[];
    if (englishFirst) {
      // Switch to Primary first, then English
      newOrder = arabicIdx === 0
        ? ['arabic', 'primary', 'secondary']
        : ['primary', 'secondary', 'arabic'];
    } else {
      // Switch to English first, then Primary
      newOrder = arabicIdx === 0
        ? ['arabic', 'secondary', 'primary']
        : ['secondary', 'primary', 'arabic'];
    }
    updateConfig({ scriptLayoutOrder: newOrder });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-gray-800 text-xs font-semibold text-amber-300 uppercase tracking-wider">
          <Languages className="w-4 h-4 text-amber-400" />
          Multi-Lingual Subtitles
        </div>

        {/* 1. Subtitle Container Box (Enable/Disable) */}
        <div className="p-3.5 rounded-xl bg-gray-950/70 border border-gray-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">Subtitle Background Container Box</div>
              <div className="text-[10px] text-gray-400">
                Unselect to remove the background card and float translation text directly over the video
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showTranslationContainer !== false}
                onChange={(e) => updateConfig({ showTranslationContainer: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <span className="text-xs font-medium text-amber-400">
                {config.showTranslationContainer !== false ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>
        </div>

        {/* 2. Alignment & Order Quick Controls */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-gray-950/70 border border-gray-800/80">
          <div className="space-y-1.5">
            <span className="text-xs text-gray-400 block">Text Alignment</span>
            <div className="flex gap-1">
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
                    className={`flex-1 py-1 px-1.5 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1 transition ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/80 text-amber-300'
                        : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                    }`}
                    title={label}
                  >
                    <Icon className="w-3 h-3" />
                    <span className="truncate">{id === 'center' ? 'Center' : label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-gray-400 block">Subtitle Order</span>
            <button
              onClick={toggleTranslationOrder}
              className="w-full py-1 px-2 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs text-amber-300 font-medium flex items-center justify-between transition cursor-pointer"
              title="Click to swap vertical order of English and native subtitle"
            >
              <span className="truncate text-[11px]">
                {englishFirst ? '1. English ➔ 2. Subtitle' : '1. Subtitle ➔ 2. English'}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">Swap</span>
            </button>
          </div>
        </div>

        {/* 3. Secondary Subtitle (English/Vernacular) */}
        <div className="space-y-3 p-3.5 rounded-xl bg-gray-950/70 border border-gray-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white">English Translation</span>
            <input
              type="checkbox"
              checked={config.showSecondaryTranslation}
              onChange={(e) => {
                updateConfig({ showSecondaryTranslation: e.target.checked });
                refreshAyahSequence();
              }}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          {config.showSecondaryTranslation && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={config.secondaryTranslationLang}
                  onChange={(e) => handleSecondaryLangChange(e.target.value)}
                  className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white cursor-pointer"
                >
                  {availableLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>

                <select
                  value={config.secondaryTranslationFile}
                  onChange={(e) => {
                    updateConfig({ secondaryTranslationFile: e.target.value });
                    refreshAyahSequence();
                  }}
                  className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white truncate cursor-pointer"
                >
                  {translatorsSecondary.map((tf) => (
                    <option key={tf} value={tf}>
                      {tf.replace('.json.txt', '').replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Wider range 10 to 100 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Default Font Size:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={config.secondaryFontSize}
                      onChange={(e) =>
                        updateConfig({
                          secondaryFontSize: Math.max(10, Math.min(100, Number(e.target.value))),
                        })
                      }
                      className="w-12 bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-amber-300 font-mono text-xs text-right"
                    />
                    <span className="text-gray-500 text-[11px]">px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={config.secondaryFontSize}
                  onChange={(e) => updateConfig({ secondaryFontSize: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                  <span>10px</span>
                  <span>55px</span>
                  <span>100px</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Primary Subtitle (Bengali/Main) */}
        <div className="space-y-3 p-3.5 rounded-xl bg-gray-950/70 border border-gray-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white">
              Primary Subtitle ({config.primaryTranslationLang || 'Bengali'})
            </span>
            <input
              type="checkbox"
              checked={config.showPrimaryTranslation}
              onChange={(e) => {
                updateConfig({ showPrimaryTranslation: e.target.checked });
                refreshAyahSequence();
              }}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          {config.showPrimaryTranslation && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={config.primaryTranslationLang}
                  onChange={(e) => handlePrimaryLangChange(e.target.value)}
                  className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white cursor-pointer"
                >
                  {availableLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>

                <select
                  value={config.primaryTranslationFile}
                  onChange={(e) => {
                    updateConfig({ primaryTranslationFile: e.target.value });
                    refreshAyahSequence();
                  }}
                  className="bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white truncate cursor-pointer"
                >
                  {translatorsPrimary.map((tf) => (
                    <option key={tf} value={tf}>
                      {tf.replace('.json.txt', '').replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Wider range 10 to 100 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Default Font Size:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={config.primaryFontSize}
                      onChange={(e) =>
                        updateConfig({
                          primaryFontSize: Math.max(10, Math.min(100, Number(e.target.value))),
                        })
                      }
                      className="w-12 bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-amber-300 font-mono text-xs text-right"
                    />
                    <span className="text-gray-500 text-[11px]">px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={config.primaryFontSize}
                  onChange={(e) => updateConfig({ primaryFontSize: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                  <span>10px</span>
                  <span>55px</span>
                  <span>100px</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Per-Ayah Custom Subtitle Font Sizing */}
        {ayahs && ayahs.length > 0 && (
          <div className="p-3.5 rounded-xl bg-gray-950/70 border border-gray-800/80 space-y-3">
            <div
              onClick={() => setShowAyahList(!showAyahList)}
              className="flex items-center justify-between pb-1 border-b border-gray-800 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
                <Type className="w-4 h-4 text-amber-400" />
                <span>Per-Ayah Subtitle Font Sizing ({ayahs.length} verses)</span>
              </div>
              {showAyahList ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>

            {showAyahList && (
              <div className="space-y-3 pt-1 max-h-96 overflow-y-auto pr-1">
                {ayahs.map((ayah) => {
                  const key = `${ayah.surah}:${ayah.ayah}`;
                  const override = config.ayahFontOverrides?.[key];
                  const activePri = override?.primaryFontSize ?? config.primaryFontSize;
                  const activeSec = override?.secondaryFontSize ?? config.secondaryFontSize;
                  const hasOverride =
                    override?.primaryFontSize !== undefined || override?.secondaryFontSize !== undefined;

                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-xl border transition ${
                        hasOverride
                          ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20'
                          : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-mono text-amber-400 font-bold">Ayah {ayah.ayah}</span>
                        {hasOverride && (
                          <button
                            onClick={() =>
                              resetAyahFontOverride(ayah.surah, ayah.ayah)
                            }
                            className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 transition"
                            title="Reset this verse to global font sizes"
                          >
                            <RotateCcw className="w-3 h-3 text-amber-400" />
                            <span>Reset</span>
                          </button>
                        )}
                      </div>

                      {/* English Font Size */}
                      {config.showSecondaryTranslation && (
                        <div className="space-y-1 mb-2">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-gray-400">English Font Size:</span>
                            <span className="text-amber-300 font-mono font-medium">{activeSec}px</span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={100}
                            value={activeSec}
                            onChange={(e) =>
                              updateAyahFontOverride(ayah.surah, ayah.ayah, {
                                secondaryFontSize: Number(e.target.value),
                              })
                            }
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>
                      )}

                      {/* Primary Subtitle Font Size */}
                      {config.showPrimaryTranslation && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-gray-400">
                              {config.primaryTranslationLang || 'Primary'} Subtitle Font Size:
                            </span>
                            <span className="text-amber-300 font-mono font-medium">{activePri}px</span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={100}
                            value={activePri}
                            onChange={(e) =>
                              updateAyahFontOverride(ayah.surah, ayah.ayah, {
                                primaryFontSize: Number(e.target.value),
                              })
                            }
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
