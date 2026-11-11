import React, { useRef, useState } from 'react';
import { useStudioStore } from '../../store/studio-store';
import {
  Music,
  Upload,
  Activity,
  Sparkles,
  Sliders,
  Palette,
  Layers,
  CircleDot,
  Zap,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Clock,
  Cpu,
  Trash2,
  FileText,
  Loader2,
  FileAudio,
  Volume2,
  Radio,
  Film,
  Eye,
  EyeOff,
} from 'lucide-react';
import { WaveformType, isSalatJammatManifest } from '../../../shared/types';
import { formatDurationMs } from '../../../shared/custom-timestamp-utils';
import { getMediaUrl } from '../../../shared/media-url';

interface WaveformStyleOption {
  id: WaveformType;
  label: string;
  tag: string;
  description: string;
}

const WAVEFORM_STYLES: WaveformStyleOption[] = [
  {
    id: 'smooth-wave',
    label: 'Fluid Ribbon',
    tag: 'Flowing',
    description: 'Silky smooth continuous bezier acoustic wave',
  },
  {
    id: 'mirrored-bars',
    label: 'Mirrored Bars',
    tag: 'Classic',
    description: 'Symmetrical rounded bars expanding top and bottom',
  },
  {
    id: 'gradient-bars',
    label: 'Grounded Spectrum',
    tag: 'Punchy',
    description: 'Frequency bars rising up from an acoustic baseline',
  },
  {
    id: 'circular-halo',
    label: 'Circular Halo',
    tag: '360° Aura',
    description: 'Radial audio-reactive sunburst framing central medallion',
  },
  {
    id: 'dual-symmetrical-wave',
    label: 'Dual Waves',
    tag: 'Harmonic',
    description: 'Mirrored twin fluid waves with glowing center valley',
  },
  {
    id: 'dotted-matrix',
    label: 'Dotted Matrix',
    tag: 'Digital',
    description: 'Vertical matrix bead columns with LED neon glow',
  },
  {
    id: 'minimal-line-pulse',
    label: 'Minimal Line',
    tag: 'Luxury',
    description: 'Ultra-clean baseline accent line pulsing into acoustic ripples',
  },
];

const COLOR_PRESETS = [
  {
    name: '24K Gold',
    primary: '#F59E0B',
    secondary: '#FDE047',
    badgeClass: 'from-amber-500 to-yellow-300',
  },
  {
    name: 'Sacred Emerald',
    primary: '#10B981',
    secondary: '#6EE7B7',
    badgeClass: 'from-emerald-500 to-teal-300',
  },
  {
    name: 'Midnight Sapphire',
    primary: '#3B82F6',
    secondary: '#93C5FD',
    badgeClass: 'from-blue-500 to-sky-300',
  },
  {
    name: 'Neon Amethyst',
    primary: '#A855F7',
    secondary: '#EC4899',
    badgeClass: 'from-purple-500 to-pink-400',
  },
  {
    name: 'Sunset Bronze',
    primary: '#F97316',
    secondary: '#FBBF24',
    badgeClass: 'from-orange-500 to-amber-300',
  },
  {
    name: 'Minimal Platinum',
    primary: '#E2E8F0',
    secondary: '#94A3B8',
    badgeClass: 'from-slate-200 to-slate-400',
  },
  {
    name: 'Cyber Cyan',
    primary: '#06B6D4',
    secondary: '#3B82F6',
    badgeClass: 'from-cyan-400 to-blue-500',
  },
];

export const AudioTab: React.FC = () => {
  const {
    config,
    updateConfig,
    reciters,
    changeReciter,
    customTimestamp,
    customTimestampPath,
    customTimestampError,
    loadCustomTimestamp,
    clearCustomTimestamp,
    selectFullRecitationAudio,
    clearFullRecitationAudio,
    toggleRecitationVideoAudio,
  } = useStudioStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAudioDragging, setIsAudioDragging] = useState(false);
  const [isProcessingJson, setIsProcessingJson] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);

  const handleSelectCustomAudio = async () => {
    setIsProcessingAudio(true);
    try {
      const api = window.electronAPI;
      if (api?.selectMediaFile) {
        const filePath = await api.selectMediaFile('audio');
        if (filePath) {
          await selectFullRecitationAudio(filePath);
        }
      } else if (audioFileInputRef.current) {
        audioFileInputRef.current.click();
      }
    } catch (e) {
      console.error('Failed to select custom audio:', e);
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handleAudioFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingAudio(true);
    try {
      const filePath = (file as any).path || URL.createObjectURL(file);
      await selectFullRecitationAudio(filePath);
    } catch (err) {
      console.error('Failed to handle audio file:', err);
    } finally {
      setIsProcessingAudio(false);
      if (audioFileInputRef.current) audioFileInputRef.current.value = '';
    }
  };

  const handleAudioDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsAudioDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setIsProcessingAudio(true);
    try {
      const filePath = (file as any).path || URL.createObjectURL(file);
      await selectFullRecitationAudio(filePath);
    } catch (err) {
      console.error('Failed to process dropped audio file:', err);
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handleSelectJsonDialog = async () => {
    setIsProcessingJson(true);
    try {
      const api = window.electronAPI;
      if (api?.selectTimestampJsonFile) {
        const file = await api.selectTimestampJsonFile();
        if (file) {
          await loadCustomTimestamp(file.content, file.filePath);
        }
      } else if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } catch (e: any) {
      console.error('Failed to select JSON file:', e);
    } finally {
      setIsProcessingJson(false);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingJson(true);
    try {
      const text = await file.text();
      const filePath = (file as any).path || file.name;
      await loadCustomTimestamp(text, filePath);
    } catch (err: any) {
      console.error('Failed to read uploaded JSON file:', err);
    } finally {
      setIsProcessingJson(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setIsProcessingJson(true);
    try {
      const text = await file.text();
      const filePath = (file as any).path || file.name;
      await loadCustomTimestamp(text, filePath);
    } catch (err: any) {
      console.error('Failed to process dropped JSON file:', err);
    } finally {
      setIsProcessingJson(false);
    }
  };

  const isBarOrMatrix =
    config.waveformType === 'mirrored-bars' ||
    config.waveformType === 'gradient-bars' ||
    config.waveformType === 'dotted-matrix';

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* 0. Custom AI Timestamp Alignment (Whisper / Tarteel) */}
      <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-gray-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <FileJson className="w-4 h-4 text-amber-400" />
            AI Recitation Alignment (Whisper JSON)
          </div>
          {customTimestamp && (
            <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Alignment
            </span>
          )}
        </div>

        {/* Hidden file input for drag & drop or fallback file selection */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json,application/json"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {customTimestamp ? (
          isSalatJammatManifest(customTimestamp) ? (
            /* Salat Jama'ah Active Manifest State */
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-gray-950 border border-indigo-500/40 space-y-3.5 shadow-lg shadow-indigo-950/20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-xs flex items-center gap-2">
                      <span>Salat Jama'ah Prayer Recitation</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-300 font-mono font-medium">
                        {customTimestamp.segments.length} Segments
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      Multi-Surah prayer recording with synchronized pauses & transitions
                    </div>
                  </div>
                </div>
                <button
                  onClick={clearCustomTimestamp}
                  className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 transition hover:border-red-600"
                  title="Remove JSON alignment and revert to standard CDN timings"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                  Remove JSON
                </button>
              </div>

              {/* Transition Cards (Interstitial Pause Cards) Toggle */}
              <div className="p-3 rounded-xl bg-gray-950/90 border border-indigo-900/50 flex items-center justify-between gap-3 shadow-sm">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">Prayer Segment Title Cards</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                        config.showSalatInterstitialCards !== false
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {config.showSalatInterstitialCards !== false ? 'Enabled' : 'Hidden'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-snug">
                    Shows the animated "Rak'ah 1: Second Surah" calligraphy card during pauses. Turn off to keep the recitation video clean.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateConfig({
                      showSalatInterstitialCards: config.showSalatInterstitialCards === false ? true : false,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-shrink-0 border flex items-center gap-1.5 cursor-pointer ${
                    config.showSalatInterstitialCards !== false
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/40 shadow-md shadow-indigo-600/20'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                  }`}
                  title={
                    config.showSalatInterstitialCards !== false
                      ? 'Click to remove/hide transition cards'
                      : 'Click to add/enable transition cards'
                  }
                >
                  {config.showSalatInterstitialCards !== false ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Cards ON</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                      <span>Cards OFF</span>
                    </>
                  )}
                </button>
              </div>

              {/* Segments Breakdown */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-0.5">
                  Prayer Segments ({customTimestamp.segments.reduce((acc, s) => acc + s.ayahs.length, 0)} total verses)
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {customTimestamp.segments.map((seg, idx) => (
                    <div
                      key={seg.segment_id || idx}
                      className="p-2 rounded-lg bg-gray-950/80 border border-indigo-900/30 flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/40 text-indigo-300 flex-shrink-0">
                          {seg.label || `Seg ${idx + 1}`}
                        </span>
                        <div className="truncate">
                          <span className="text-white font-medium">
                            Surah {seg.surah_name_en}
                          </span>
                          <span className="text-gray-400 ml-1.5">
                            (Verses {seg.start_ayah}–{seg.end_ayah})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-[10px] font-mono text-gray-400">
                          {formatDurationMs(seg.end_ms - seg.start_ms)}
                        </span>
                        {config.showSalatInterstitialCards !== false && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const segId = seg.segment_id ?? idx;
                              const currentHidden: Array<number | string> = config.hiddenSalatSegmentCards || [];
                              const isHidden = currentHidden.includes(segId);
                              const updated = isHidden
                                ? currentHidden.filter((id) => id !== segId)
                                : [...currentHidden, segId];
                              updateConfig({ hiddenSalatSegmentCards: updated });
                            }}
                            className={`p-1 rounded transition hover:bg-gray-800 cursor-pointer ${
                              (config.hiddenSalatSegmentCards || []).includes(seg.segment_id ?? idx)
                                ? 'text-gray-600 hover:text-gray-400'
                                : 'text-indigo-400 hover:text-indigo-300'
                            }`}
                            title={
                              (config.hiddenSalatSegmentCards || []).includes(seg.segment_id ?? idx)
                                ? 'Card hidden for this segment. Click to show.'
                                : 'Card visible for this segment. Click to hide.'
                            }
                          >
                            {(config.hiddenSalatSegmentCards || []).includes(seg.segment_id ?? idx) ? (
                              <EyeOff className="w-3.5 h-3.5 text-rose-400/80" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metadata Stats Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-2.5 rounded-lg bg-gray-950/80 border border-gray-800 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-gray-400 text-[10px]">Total Audio Timeline</div>
                    <div className="text-white font-mono font-medium truncate">
                      {formatDurationMs(customTimestamp.total_duration_ms)} ({Math.round(customTimestamp.total_duration_ms / 1000)}s)
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-gray-950/80 border border-gray-800 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-gray-400 text-[10px]">Alignment Model</div>
                    <div className="text-white font-medium truncate" title={customTimestamp.model_choice || customTimestamp.model_used || 'Salat Jama\'ah Alignment'}>
                      {customTimestamp.model_choice || customTimestamp.model_used || "Salat Jama'ah Alignment"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Path and Info footer */}
              {customTimestampPath && (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-950/60 border border-gray-800 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mode: <strong className="text-indigo-300">Salat Jama'ah</strong></span>
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono truncate max-w-[160px]" title={customTimestampPath}>
                    {customTimestampPath.split(/[/\\]/).pop()}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Active Custom Timestamp State (Single Surah) */
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/30 to-gray-950 border border-emerald-500/40 space-y-3.5 shadow-lg shadow-emerald-950/20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-xs flex items-center gap-2">
                      <span>Surah {customTimestamp.surah_name_en}</span>
                      <span className="text-gray-400 font-normal">({customTimestamp.surah_name_ar})</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono">
                        #{customTimestamp.surah_number}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      Verses: <span className="text-gray-200 font-medium">{customTimestamp.start_ayah} to {customTimestamp.end_ayah}</span> ({customTimestamp.ayahs.length} total ayahs synced)
                    </div>
                  </div>
                </div>
                <button
                  onClick={clearCustomTimestamp}
                  className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 transition hover:border-red-600"
                  title="Remove JSON alignment and revert to standard CDN timings"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                  Remove JSON
                </button>
              </div>

              {/* Metadata Stats Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-2.5 rounded-lg bg-gray-950/80 border border-gray-800 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-gray-400 text-[10px]">Total Audio Timeline</div>
                    <div className="text-white font-mono font-medium truncate">
                      {formatDurationMs(customTimestamp.total_duration_ms)} ({Math.round(customTimestamp.total_duration_ms / 1000)}s)
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-gray-950/80 border border-gray-800 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-gray-400 text-[10px]">Forced Alignment Model</div>
                    <div className="text-white font-medium truncate" title={customTimestamp.model_choice || customTimestamp.model_used || 'Whisper'}>
                      {customTimestamp.model_choice || customTimestamp.model_used || 'Whisper SOTA'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Preamble / Basmala Note */}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-950/60 border border-gray-800 text-[11px] text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Basmala Preface:
                  <span className={customTimestamp.preamble?.has_basmala ? 'text-emerald-400 font-medium' : 'text-gray-500'}>
                    {customTimestamp.preamble?.has_basmala
                      ? `Included (${((customTimestamp.preamble.basmala?.duration_ms || 0) / 1000).toFixed(2)}s)`
                      : 'None in recording'}
                  </span>
                </span>
                {customTimestampPath && (
                  <span className="text-[10px] text-gray-500 font-mono truncate max-w-[140px]" title={customTimestampPath}>
                    {customTimestampPath.split(/[/\\]/).pop()}
                  </span>
                )}
              </div>
            </div>
          )
        ) : (
          /* Empty / Upload Dropzone State */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`p-5 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-2.5 ${
              isDragging
                ? 'border-amber-500 bg-amber-500/10 scale-[0.99]'
                : 'border-gray-800 hover:border-gray-700 bg-gray-950/50'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
              {isProcessingJson ? (
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              ) : (
                <Upload className="w-6 h-6 text-amber-400" />
              )}
            </div>

            <div>
              <div className="text-xs font-semibold text-white">
                Upload Recitation Timestamps JSON
              </div>
              <p className="text-[11px] text-gray-400 max-w-sm mt-0.5 leading-relaxed">
                Import speech-to-text forced alignment JSON (Whisper / Tarteel) with word-by-word timestamps to drive video timing
              </p>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleSelectJsonDialog}
                disabled={isProcessingJson}
                className="flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-semibold shadow-md shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
              >
                <FileJson className="w-4 h-4 text-gray-950" />
                {isProcessingJson ? 'Processing JSON...' : 'Browse JSON File'}
              </button>
            </div>
          </div>
        )}

        {customTimestampError && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/50 border border-red-800/60 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="flex-1">{customTimestampError}</span>
          </div>
        )}
      </div>

      {/* 1. Reciter & Recitation Audio Pipeline */}
      <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-gray-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <Music className="w-4 h-4 text-amber-400" />
            Recitation Audio Pipeline
          </div>
          <div className="flex items-center gap-2">
            {config.customAudioPath ? (
              <button
                onClick={clearFullRecitationAudio}
                className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition"
                title="Switch back to built-in CDN reciters"
              >
                <Radio className="w-3 h-3 text-amber-400" />
                Switch to CDN Reciters
              </button>
            ) : (
              <button
                onClick={handleSelectCustomAudio}
                disabled={isProcessingAudio}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold transition shadow-sm"
                title="Select a full recitation MP3/WAV audio track"
              >
                <Upload className="w-3.5 h-3.5 text-gray-950" />
                {isProcessingAudio ? 'Processing Audio...' : 'Select Full Audio File'}
              </button>
            )}
          </div>
        </div>

        {/* Hidden audio input for file selection */}
        <input
          type="file"
          ref={audioFileInputRef}
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac"
          onChange={handleAudioFileInputChange}
          className="hidden"
        />

        {/* Recitation Video Audio Track Option (when recitation video is loaded) */}
        {config.recitationVideoPath && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-gray-950 to-gray-950 border border-emerald-500/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Film className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">Recitation Video Audio Track</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    {config.recitationVideoFileName || config.recitationVideoPath.split(/[/\\]/).pop()}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 truncate">
                  {config.useRecitationVideoAudio
                    ? '✓ Using native audio track directly from uploaded recitation video'
                    : 'Video audio is muted; using separate recitation audio below'}
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-emerald-300 font-medium cursor-pointer shrink-0">
              <span>{config.useRecitationVideoAudio ? 'Active' : 'Muted'}</span>
              <input
                type="checkbox"
                checked={config.useRecitationVideoAudio ?? false}
                onChange={(e) => toggleRecitationVideoAudio(e.target.checked)}
                className="rounded border-gray-700 text-emerald-500 focus:ring-0 cursor-pointer"
              />
            </label>
          </div>
        )}

        {config.customAudioPath ? (
          /* Full Recitation Audio File Active Card */
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/30 to-gray-950 border border-amber-500/40 space-y-3.5 shadow-lg shadow-amber-950/20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
                  <FileAudio className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-white text-xs flex items-center gap-2">
                    <span className="truncate max-w-[240px]" title={config.customAudioFileName || config.customAudioPath}>
                      {config.customAudioFileName || config.customAudioPath.split(/[/\\]/).pop()}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono flex-shrink-0">
                      Full Audio
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2">
                    <span>
                      Duration: <strong className="text-gray-200 font-mono">
                        {config.customAudioDurationSeconds
                          ? formatDurationMs(config.customAudioDurationSeconds * 1000)
                          : 'Probing...'}
                      </strong>
                    </span>
                    {config.customAudioDurationSeconds && (
                      <span className="text-gray-500">
                        ({Math.round(config.customAudioDurationSeconds)}s)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={clearFullRecitationAudio}
                className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 transition hover:text-white"
                title="Remove audio and revert to CDN reciter"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
                Remove
              </button>
            </div>

            {/* Sync Validation with Timestamp JSON */}
            {customTimestamp && (
              <div className="p-2.5 rounded-lg bg-gray-950/80 border border-gray-800 text-[11px] space-y-1">
                {(() => {
                  const audioMs = (config.customAudioDurationSeconds || 0) * 1000;
                  const jsonMs = customTimestamp.total_duration_ms;
                  if (audioMs <= 0) {
                    return (
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Checking audio alignment against JSON timeline ({formatDurationMs(jsonMs)})...</span>
                      </div>
                    );
                  }
                  const diffSec = Math.abs(audioMs - jsonMs) / 1000;
                  const isMatch = diffSec <= 2.5;

                  return (
                    <div className="flex items-center gap-2">
                      {isMatch ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className={isMatch ? 'text-emerald-300 font-medium' : 'text-amber-300 font-medium'}>
                          {isMatch
                            ? 'Perfect Sync with Timestamp JSON'
                            : `Duration Difference: ${diffSec.toFixed(1)}s`}
                        </span>
                        <div className="text-[10px] text-gray-400">
                          Audio: {formatDurationMs(audioMs)} • JSON: {formatDurationMs(jsonMs)}
                          {isMatch ? ' (Continuous audio playback active across all verses)' : ' (Verify this MP3 matches the recitation in your JSON)'}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Audio Preview Scrubber Player */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-amber-400" />
                  Audition Audio Track
                </span>
                <span className="font-mono text-gray-500">Continuous Pipeline</span>
              </div>
              <audio
                controls
                src={getMediaUrl(config.customAudioPath)}
                className="w-full h-8 rounded-lg bg-gray-950 focus:outline-none"
              />
            </div>
          </div>
        ) : (
          /* CDN Reciter Selection & Dropzone */
          <div className="space-y-3">
            {/* Quick Dropzone for Full Audio File */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsAudioDragging(true);
              }}
              onDragLeave={() => setIsAudioDragging(false)}
              onDrop={handleAudioDrop}
              className={`p-3.5 rounded-xl border border-dashed transition-all flex items-center justify-between gap-3 ${
                isAudioDragging
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-gray-800 hover:border-gray-700 bg-gray-950/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <FileAudio className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-medium text-white">Full Recitation Audio (Single File)</div>
                  <div className="text-[11px] text-gray-400">Drag & drop or select full surah MP3/WAV file</div>
                </div>
              </div>
              <button
                onClick={handleSelectCustomAudio}
                disabled={isProcessingAudio}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition font-medium flex-shrink-0"
              >
                {isProcessingAudio ? 'Loading...' : 'Browse Audio'}
              </button>
            </div>

            <div className="flex items-center gap-2 my-1 text-[11px] text-gray-500">
              <div className="flex-1 h-px bg-gray-800" />
              <span>OR USE BUILT-IN CDN RECITER</span>
              <div className="flex-1 h-px bg-gray-800" />
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
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-950/70 border border-gray-800 text-xs text-gray-400">
                {reciters[config.reciterIndex].local_img || reciters[config.reciterIndex].img ? (
                  <img
                    src={
                      reciters[config.reciterIndex].local_img
                        ? `./${reciters[config.reciterIndex].local_img!.replace(/^\/+/, '')}`
                        : reciters[config.reciterIndex].img
                    }
                    alt={reciters[config.reciterIndex].name}
                    className="w-11 h-11 rounded-full object-cover border border-amber-500/40 shadow-sm shadow-amber-500/10 flex-shrink-0 bg-gray-900"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (reciters[config.reciterIndex].img && target.src !== reciters[config.reciterIndex].img) {
                        target.src = reciters[config.reciterIndex].img!;
                      } else {
                        target.style.display = 'none';
                      }
                    }}
                  />
                ) : null}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate text-xs">
                    {reciters[config.reciterIndex].name}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                    <span>Style: {reciters[config.reciterIndex].style}</span>
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      {reciters[config.reciterIndex].segments_url ? '✓ Word-Level Karaoke Sync Ready' : '• Verse Audio Only'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Audio-Reactive Waveform Motion Graphics */}
      <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-gray-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-amber-400" />
            Audio-Reactive Waveform Motion Graphics
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-gray-400">
              {config.showWaveform ? 'Enabled' : 'Disabled'}
            </span>
            <input
              type="checkbox"
              checked={config.showWaveform}
              onChange={(e) => updateConfig({ showWaveform: e.target.checked })}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </label>
        </div>

        {config.showWaveform && (
          <div className="space-y-5">
            {/* 2.1 Waveform Visual Styles Gallery */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-300">Visualizer Aesthetic Style</span>
                <span className="text-[10px] text-gray-400">7 modern 2026 styles</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WAVEFORM_STYLES.map((style) => {
                  const isSelected = config.waveformType === style.id;
                  return (
                    <button
                      key={style.id}
                      onClick={() => updateConfig({ waveformType: style.id })}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10'
                          : 'bg-gray-950/70 border-gray-800/80 hover:border-gray-700 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-semibold ${isSelected ? 'text-amber-300' : 'text-gray-200'}`}>
                          {style.label}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ${
                            isSelected
                              ? 'bg-amber-500/30 text-amber-300 font-semibold'
                              : 'bg-gray-800/80 text-gray-400'
                          }`}
                        >
                          {style.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-snug">
                        {style.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2.2 Color Theme Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-300">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>Color Gradient Themes</span>
                </div>
                <span className="text-[10px] text-gray-400">1-click presets</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map((p) => {
                  const isActive =
                    config.waveformColor?.toLowerCase() === p.primary.toLowerCase() &&
                    (config.waveformColorSecondary?.toLowerCase() || '') === p.secondary.toLowerCase();
                  return (
                    <button
                      key={p.name}
                      onClick={() =>
                        updateConfig({
                          waveformColor: p.primary,
                          waveformColorSecondary: p.secondary,
                        })
                      }
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                        isActive
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-gray-950/80 border-gray-800 text-gray-300 hover:border-gray-700'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${p.badgeClass}`} />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2.3 Dual Gradient Color Stops */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-950/70 border border-gray-800/80">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Primary Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.waveformColor || '#F59E0B'}
                    onChange={(e) => updateConfig({ waveformColor: e.target.value })}
                    className="w-6 h-6 rounded border border-gray-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-gray-300 uppercase">
                    {config.waveformColor || '#F59E0B'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Gradient Stop 2</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.waveformColorSecondary || config.waveformColor || '#FBBF24'}
                    onChange={(e) => updateConfig({ waveformColorSecondary: e.target.value })}
                    className="w-6 h-6 rounded border border-gray-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-gray-300 uppercase">
                    {config.waveformColorSecondary || config.waveformColor || '#FBBF24'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2.4 Lighting, Glow & Fill Effects */}
            <div className="p-3 rounded-xl bg-gray-950/70 border border-gray-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs text-gray-300 font-medium">Volumetric Neon Glow</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.waveformGlow ?? true}
                  onChange={(e) => updateConfig({ waveformGlow: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              {(config.waveformGlow ?? true) && (
                <div className="space-y-1 pt-2 border-t border-gray-800/60">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Glow Radiance Intensity</span>
                    <span className="text-amber-400 font-mono">
                      {(config.waveformGlowIntensity ?? 1.5).toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    value={config.waveformGlowIntensity ?? 1.5}
                    onChange={(e) => updateConfig({ waveformGlowIntensity: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-800/60">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs text-gray-300 font-medium">Translucent Area Gradient Fill</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.waveformFillArea ?? false}
                  onChange={(e) => updateConfig({ waveformFillArea: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1 pt-2 border-t border-gray-800/60">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Waveform Layer Opacity</span>
                  <span className="text-amber-400 font-mono">
                    {Math.round((config.waveformOpacity ?? 0.9) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={1.0}
                  step={0.05}
                  value={config.waveformOpacity ?? 0.9}
                  onChange={(e) => updateConfig({ waveformOpacity: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* 2.5 Dimensions & Sensitivity */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-300">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Dimensions & Acoustics</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Wave Height</span>
                    <span className="text-amber-400 font-mono">{config.waveformHeight}px</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={280}
                    step={5}
                    value={config.waveformHeight}
                    onChange={(e) => updateConfig({ waveformHeight: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Canvas Width</span>
                    <span className="text-amber-400 font-mono">{config.waveformWidth ?? 92}%</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={100}
                    step={2}
                    value={config.waveformWidth ?? 92}
                    onChange={(e) => updateConfig({ waveformWidth: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Acoustic Amplitude</span>
                    <span className="text-amber-400 font-mono">
                      {(config.waveformAmplitude ?? 2.2).toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.8}
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
                    min={10}
                    max={92}
                    value={config.waveformPositionY}
                    onChange={(e) => updateConfig({ waveformPositionY: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 2.6 Style-Specific Parameters */}
            <div className="p-3 rounded-xl bg-gray-950/70 border border-gray-800/80 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-300">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Style Fine-Tuning</span>
              </div>

              {/* Halo Radius (Circular Halo only) */}
              {config.waveformType === 'circular-halo' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <CircleDot className="w-3 h-3 text-amber-400" />
                      Circular Halo Radius
                    </span>
                    <span className="text-amber-400 font-mono">
                      {config.waveformCircularRadius ?? 130}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={250}
                    step={5}
                    value={config.waveformCircularRadius ?? 130}
                    onChange={(e) =>
                      updateConfig({ waveformCircularRadius: Number(e.target.value) })
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Bar Width (Bars & Matrix) */}
              {isBarOrMatrix && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Bar / Matrix Bead Width</span>
                    <span className="text-amber-400 font-mono">
                      {config.waveformBarWidth ?? 6}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={14}
                    step={1}
                    value={config.waveformBarWidth ?? 6}
                    onChange={(e) => updateConfig({ waveformBarWidth: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Sample Frequency Density */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Frequency Band Density</span>
                  <span className="text-amber-400 font-mono">
                    {config.waveformSampleCount ?? 64} bands
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { count: 32, label: '32 (Airy)' },
                    { count: 48, label: '48 (Clean)' },
                    { count: 64, label: '64 (Crisp)' },
                    { count: 96, label: '96 (Dense)' },
                    { count: 128, label: '128 (HD)' },
                  ].map((item) => {
                    const isDensityActive = (config.waveformSampleCount ?? 64) === item.count;
                    return (
                      <button
                        key={item.count}
                        onClick={() => updateConfig({ waveformSampleCount: item.count })}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-mono font-medium border text-center transition ${
                          isDensityActive
                            ? 'bg-amber-500/25 border-amber-500 text-amber-200 font-bold'
                            : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

