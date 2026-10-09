import React from 'react';
import { useStudioStore } from '../../store/studio-store';
import { Languages } from 'lucide-react';

export const SubtitlesTab: React.FC = () => {
  const {
    config,
    updateConfig,
    availableLanguages,
    translatorsPrimary,
    translatorsSecondary,
    refreshAyahSequence,
  } = useStudioStore();

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
        <div className="flex items-center gap-2 pb-1 border-b border-gray-800 text-xs font-semibold text-amber-300 uppercase tracking-wider">
          <Languages className="w-4 h-4 text-amber-400" />
          Multi-Lingual Subtitles
        </div>

        {/* Primary Subtitle (Bengali/Main) */}
        <div className="space-y-3 p-3.5 rounded-xl bg-gray-950/70 border border-gray-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white">Primary Subtitle (Bengali/Main)</span>
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

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Font Size: {config.primaryFontSize}px</span>
                <input
                  type="range"
                  min={16}
                  max={36}
                  value={config.primaryFontSize}
                  onChange={(e) => updateConfig({ primaryFontSize: Number(e.target.value) })}
                  className="w-40 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Secondary Subtitle (English/Vernacular) */}
        <div className="space-y-3 p-3.5 rounded-xl bg-gray-950/70 border border-gray-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white">Secondary Subtitle (English/Vernacular)</span>
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

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Font Size: {config.secondaryFontSize}px</span>
                <input
                  type="range"
                  min={14}
                  max={32}
                  value={config.secondaryFontSize}
                  onChange={(e) => updateConfig({ secondaryFontSize: Number(e.target.value) })}
                  className="w-40 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
