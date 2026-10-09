import React from 'react';
import { useStudioStore } from '../../store/studio-store';
import { Music, Upload, Activity } from 'lucide-react';

export const AudioTab: React.FC = () => {
  const { config, updateConfig, reciters, changeReciter } = useStudioStore();

  const handleSelectCustomAudio = async () => {
    const api = window.electronAPI;
    if (!api) return;
    const filePath = await api.selectMediaFile('audio');
    if (!filePath) return;
    updateConfig({
      customAudioPath: filePath,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Reciter & Recitation Audio */}
      <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-gray-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <Music className="w-4 h-4 text-amber-400" />
            Recitation Audio Pipeline
          </div>
          <button
            onClick={handleSelectCustomAudio}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
            title="Upload custom MP3 or WAV audio track"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            Custom Audio
          </button>
        </div>

        <div className="relative">
          <select
            value={config.reciterIndex}
            onChange={(e) => changeReciter(Number(e.target.value))}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-xs"
          >
            {reciters.map((reciter, idx) => {
              const hasSegments = Boolean(reciter.segments_url);
              return (
                <option key={idx} value={idx} className="bg-gray-900 text-white">
                  {reciter.name} ({reciter.style}) {hasSegments ? '⚡ [Sync Active]' : ''}
                </option>
              );
            })}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
            <Music className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        {reciters[config.reciterIndex] && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-950/70 border border-gray-800 text-xs text-gray-400">
            <span>Style: {reciters[config.reciterIndex].style}</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              {reciters[config.reciterIndex].segments_url ? '✓ Word-Level Karaoke Sync Ready' : '• Verse Audio Only'}
            </span>
          </div>
        )}

        {config.customAudioPath && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
            <span className="truncate max-w-[220px]">
              Local track: {config.customAudioPath.split(/[/\\]/).pop()}
            </span>
            <button
              onClick={() => updateConfig({ customAudioPath: undefined })}
              className="text-[11px] underline text-gray-400 hover:text-white"
            >
              Reset to CDN
            </button>
          </div>
        )}
      </div>

      {/* 2. Audio-Reactive Waveform */}
      <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-gray-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-amber-400" />
            Audio-Reactive Waveform
          </div>
          <input
            type="checkbox"
            checked={config.showWaveform}
            onChange={(e) => updateConfig({ showWaveform: e.target.checked })}
            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
        </div>

        {config.showWaveform && (
          <div className="space-y-4">
            {/* Waveform Type */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'smooth-wave', label: 'Smooth Curve' },
                { id: 'mirrored-bars', label: 'Frequency Bars' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => updateConfig({ waveformType: item.id as any })}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                    config.waveformType === item.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Height & Width Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Wave Height</span>
                  <span className="text-amber-400 font-mono">{config.waveformHeight}px</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={280}
                  step={5}
                  value={config.waveformHeight}
                  onChange={(e) => updateConfig({ waveformHeight: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Wave Width</span>
                  <span className="text-amber-400 font-mono">{config.waveformWidth ?? 92}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={2}
                  value={config.waveformWidth ?? 92}
                  onChange={(e) => updateConfig({ waveformWidth: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Amplitude Sensitivity & Vertical Position */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Wave Amplitude</span>
                  <span className="text-amber-400 font-mono">
                    {(config.waveformAmplitude ?? 2.2).toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={3.5}
                  step={0.1}
                  value={config.waveformAmplitude ?? 2.2}
                  onChange={(e) => updateConfig({ waveformAmplitude: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Y-Position</span>
                  <span className="text-amber-400 font-mono">{config.waveformPositionY}%</span>
                </div>
                <input
                  type="range"
                  min={45}
                  max={90}
                  value={config.waveformPositionY}
                  onChange={(e) => updateConfig({ waveformPositionY: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Color */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-950/70 border border-gray-800/80">
              <span className="text-xs text-gray-400">Wave Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.waveformColor}
                  onChange={(e) => updateConfig({ waveformColor: e.target.value })}
                  className="w-7 h-7 rounded border border-gray-700 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-gray-300">{config.waveformColor}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
