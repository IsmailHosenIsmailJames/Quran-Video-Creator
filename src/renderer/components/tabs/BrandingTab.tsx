import React, { useState, useEffect } from 'react';
import { useStudioStore } from '../../store/studio-store';
import { getMediaUrl } from '../../../shared/media-url';
import { Shield, Upload, Sparkles } from 'lucide-react';

export const BrandingTab: React.FC = () => {
  const { config, updateConfig } = useStudioStore();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [config.logoPath]);

  const handleSelectLogo = async () => {
    const api = window.electronAPI;
    if (!api) return;
    const filePath = await api.selectMediaFile('image');
    if (!filePath) return;
    setImageError(false);
    updateConfig({
      logoPath: filePath,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-gray-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <Shield className="w-4 h-4 text-amber-400" />
            Channel Attribution & Watermark
          </div>
          <input
            type="checkbox"
            checked={config.showBranding}
            onChange={(e) => updateConfig({ showBranding: e.target.checked })}
            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
        </div>

        {config.showBranding && (
          <div className="space-y-4">
            {/* Channel Handle */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Channel Handle / Attribution Text</label>
              <input
                type="text"
                value={config.channelHandle}
                onChange={(e) => updateConfig({ channelHandle: e.target.value })}
                placeholder="@AnNafee_Official"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Channel Logo Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">
                  Channel Logo / Icon
                </label>
                <button
                  onClick={handleSelectLogo}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  Upload PNG/SVG
                </button>
              </div>

              {config.logoPath ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950/80 border border-gray-800">
                  <div className="flex items-center gap-3">
                    {!imageError ? (
                      <img
                        src={getMediaUrl(config.logoPath)}
                        alt="Logo"
                        onError={() => setImageError(true)}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-white/20"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Shield className="w-4 h-4" />
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-white truncate max-w-[200px]">
                        {config.logoPath.split(/[/\\]/).pop()}
                      </p>
                      <p className="text-[10px] text-emerald-400">Custom logo active</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateConfig({ logoPath: undefined })}
                    className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-500/10 transition"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="p-4 text-center border border-dashed border-gray-800/80 rounded-xl bg-gray-950/40 text-xs text-gray-500">
                  <Sparkles className="w-4 h-4 text-amber-400/60 mx-auto mb-1" />
                  <span>No custom logo selected. Default channel pill badge will be used.</span>
                </div>
              )}
            </div>

            {/* Position & Scale */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Badge Position</label>
                <select
                  value={config.brandingPosition}
                  onChange={(e) => updateConfig({ brandingPosition: e.target.value as any })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs cursor-pointer"
                >
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Badge Scale</span>
                  <span className="text-amber-400 font-mono">{config.brandingScale}x</span>
                </div>
                <input
                  type="range"
                  min={0.6}
                  max={1.5}
                  step={0.1}
                  value={config.brandingScale}
                  onChange={(e) => updateConfig({ brandingScale: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
