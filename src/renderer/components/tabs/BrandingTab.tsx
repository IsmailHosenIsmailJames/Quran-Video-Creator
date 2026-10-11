import React, { useState, useEffect } from 'react';
import { useStudioStore } from '../../store/studio-store';
import { getMediaUrl } from '../../../shared/media-url';
import { Shield, Upload, Sparkles, Film } from 'lucide-react';
import { TransitionType } from '../../../shared/types';

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

  const handleSelectIntroVideo = async () => {
    const api = window.electronAPI;
    if (!api) return;
    const filePath = await api.selectMediaFile('video');
    if (!filePath) return;

    let durationSec: number | undefined = undefined;
    if (api.probeMediaDuration) {
      try {
        durationSec = await api.probeMediaDuration(filePath);
      } catch (e) {
        console.warn('Failed to probe intro video duration:', e);
      }
    }

    updateConfig({
      enableIntroVideo: true,
      introVideoPath: filePath,
      introVideoDurationSeconds: durationSec ? Number(durationSec.toFixed(2)) : 4.0,
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

        {!config.showBranding && (
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Branding watermark is currently turned off. Turn it on above to upload your channel logo and set your YouTube handle.
          </p>
        )}

        {config.showBranding && (
          <div className="space-y-4">
            {/* Setup Guidance Banner */}
            {(!config.logoPath || !config.channelHandle?.trim()) && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <p className="font-semibold text-amber-300">Set Up Your Channel Branding</p>
                  <p className="text-gray-300 text-[11px] leading-relaxed">
                    Please upload your channel logo and enter your YouTube handle below so your watermark badge appears on the video.
                  </p>
                </div>
              </div>
            )}

            {/* Channel Handle */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Channel Handle / YouTube Creator Name</label>
              <input
                type="text"
                value={config.channelHandle}
                onChange={(e) => updateConfig({ channelHandle: e.target.value })}
                placeholder="@YourChannelHandle (e.g. @QuranRecitations)"
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
                  {config.logoPath ? 'Change Logo' : 'Upload Logo'}
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
                <div
                  onClick={handleSelectLogo}
                  className="p-5 text-center border border-dashed border-gray-800/80 hover:border-amber-500/50 rounded-xl bg-gray-950/40 text-xs text-gray-400 cursor-pointer transition flex flex-col items-center gap-1.5"
                >
                  <Upload className="w-5 h-5 text-amber-400/80 mx-auto" />
                  <span className="font-medium text-gray-300">Click to upload channel logo (PNG / SVG)</span>
                  <span className="text-[10px] text-gray-500">Transparent square or circular images look best</span>
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

      {/* Channel Intro Video & Bumper Card */}
      <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-gray-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <Film className="w-4 h-4 text-amber-400" />
            Channel Intro Video & Bumper
          </div>
          <input
            type="checkbox"
            checked={Boolean(config.enableIntroVideo)}
            onChange={(e) => updateConfig({ enableIntroVideo: e.target.checked })}
            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
        </div>

        <p className="text-[11px] text-gray-400 leading-relaxed">
          Prepend a short channel intro bumper (e.g. An-Nafee animated logo intro) before the Holy Quran recitation begins.
        </p>

        {config.enableIntroVideo && (
          <div className="space-y-4 pt-1">
            {/* Intro Video File Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">Intro Video File (MP4 / WebM / MOV)</label>
                <button
                  onClick={handleSelectIntroVideo}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  {config.introVideoPath ? 'Change Video' : 'Choose Video'}
                </button>
              </div>

              {config.introVideoPath ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-950/80 border border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                      <Film className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-white truncate max-w-[220px]">
                        {config.introVideoPath.split(/[/\\]/).pop()}
                      </p>
                      <p className="text-[10px] text-emerald-400">
                        Duration: {config.introVideoDurationSeconds || 4.0}s • Ready
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      updateConfig({
                        enableIntroVideo: false,
                        introVideoPath: undefined,
                        introVideoDurationSeconds: undefined,
                      })
                    }
                    className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-500/10 transition"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div
                  onClick={handleSelectIntroVideo}
                  className="p-5 text-center border border-dashed border-gray-800/80 hover:border-amber-500/50 rounded-xl bg-gray-950/40 text-xs text-gray-400 cursor-pointer transition flex flex-col items-center gap-1.5"
                >
                  <Film className="w-5 h-5 text-amber-400/70" />
                  <span className="font-medium text-gray-300">Click to upload channel intro clip</span>
                  <span className="text-[10px] text-gray-500">Supports MP4, WebM, MOV clips</span>
                </div>
              )}
            </div>

            {/* Skip for 9:16 Shorts Setting */}
            <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300 font-medium">Skip Intro for 9:16 Shorts</span>
                <input
                  type="checkbox"
                  checked={config.skipIntroForShorts !== false}
                  onChange={(e) => updateConfig({ skipIntroForShorts: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Automatically omits the intro bumper when making vertical 9:16 Shorts, Reels, and TikTok clips.
              </p>
              {config.aspectRatio === '9:16' && config.skipIntroForShorts !== false && (
                <div className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2 py-1 rounded-lg">
                  ⚡ Intro is currently bypassed because active canvas is 9:16 (Shorts)
                </div>
              )}
            </div>

            {/* Intro Audio and Transition Controls */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Intro Audio</label>
                <div className="flex items-center justify-between p-2 rounded-xl bg-gray-950 border border-gray-800">
                  <span className="text-xs text-gray-300">
                    {config.introMuted ? 'Muted' : 'Sound On'}
                  </span>
                  <input
                    type="checkbox"
                    checked={!config.introMuted}
                    onChange={(e) => updateConfig({ introMuted: !e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400">Transition into Recitation</label>
                <select
                  value={config.introTransition || 'dip-black'}
                  onChange={(e) => updateConfig({ introTransition: e.target.value as TransitionType })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-2.5 py-2 text-white text-xs cursor-pointer focus:outline-none"
                >
                  <option value="dip-black">Dip to Black</option>
                  <option value="crossfade">Crossfade</option>
                  <option value="zoom-fade">Zoom Fade</option>
                  <option value="cut">Hard Cut</option>
                </select>
              </div>
            </div>

            {/* Configurable Duration Override */}
            {config.introVideoPath && (
              <div className="space-y-1.5 bg-gray-950/60 p-3 rounded-xl border border-gray-800/80">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Intro Duration</span>
                  <span className="text-amber-400 font-mono font-semibold">
                    {(config.introVideoDurationSeconds || 4.0).toFixed(1)}s
                  </span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={20.0}
                  step={0.5}
                  value={config.introVideoDurationSeconds || 4.0}
                  onChange={(e) => updateConfig({ introVideoDurationSeconds: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
