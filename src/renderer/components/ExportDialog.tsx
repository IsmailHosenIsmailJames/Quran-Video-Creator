import React, { useState, useEffect, useRef } from 'react';
import { useStudioStore } from '../store/studio-store';
import { RenderProgressPayload } from '../../shared/types';
import {
  X,
  Film,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderOpen,
  RotateCcw,
} from 'lucide-react';

const formatDuration = (ms: number): string => {
  if (ms <= 0) return '0s';
  const totalSeconds = Math.ceil(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

export const ExportDialog: React.FC = () => {
  const {
    config,
    updateConfig,
    ayahs,
    totalDurationInFrames,
    isExportModalOpen,
    setExportModalOpen,
  } = useStudioStore();

  const [outputPath, setOutputPath] = useState<string>('');
  const [exportedFilePath, setExportedFilePath] = useState<string>('');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState<RenderProgressPayload | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [elapsedRenderTime, setElapsedRenderTime] = useState<number | null>(null);
  const renderStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    const cleanup = api.onRenderProgress((payload: RenderProgressPayload) => {
      setRenderProgress(payload);
      if (payload.status === 'completed' || payload.status === 'failed' || payload.status === 'cancelled') {
        setIsExporting(false);
        if (payload.status === 'completed' && renderStartTimeRef.current) {
          setElapsedRenderTime(Date.now() - renderStartTimeRef.current);
        }
      }
    });

    return () => cleanup();
  }, []);

  if (!isExportModalOpen) return null;

  const handleSelectSaveLocation = async () => {
    const api = window.electronAPI;
    if (!api) return;
    const defaultName = `Surah_${config.surahNumber}_Ayah_${config.fromAyah}-${config.toAyah}_${config.resolution}.mp4`;
    const selected = await api.selectSavePath(defaultName);
    if (selected) {
      setOutputPath(selected);
      setExportedFilePath(selected);
    }
  };

  const handleStartExport = async () => {
    const api = window.electronAPI;
    if (!api) return;

    let targetPath = outputPath;
    if (!targetPath) {
      const defaultName = `Surah_${config.surahNumber}_Ayah_${config.fromAyah}-${config.toAyah}_${config.resolution}.mp4`;
      const selected = await api.selectSavePath(defaultName);
      if (!selected) return;
      targetPath = selected;
      setOutputPath(selected);
    }

    setExportedFilePath(targetPath);
    renderStartTimeRef.current = Date.now();
    setElapsedRenderTime(null);
    setIsExporting(true);
    setRenderProgress({
      jobId: 'init',
      progress: 0.01,
      status: 'rendering',
    });

    try {
      const result = await api.startRender(config, ayahs, totalDurationInFrames, targetPath);
      setActiveJobId(result.jobId);
    } catch (err: any) {
      console.error('Failed to start render:', err);
      setIsExporting(false);
      setRenderProgress({
        jobId: 'error',
        progress: 0,
        status: 'failed',
        error: err?.message || 'Failed to start rendering',
      });
    }
  };

  const handleCancelExport = async () => {
    if (!activeJobId) return;
    const api = window.electronAPI;
    if (api) {
      await api.cancelRender(activeJobId);
    }
    setIsExporting(false);
  };

  const handleLocateFile = async () => {
    const filePath = exportedFilePath || outputPath;
    if (!filePath) return;
    const api = window.electronAPI;
    if (api?.showInFolder) {
      await api.showInFolder(filePath);
    }
  };

  const getEstimatedRemaining = (): string | null => {
    if (!renderProgress || renderProgress.status !== 'rendering') return null;

    if (renderProgress.renderEstimatedTime && renderProgress.renderEstimatedTime > 0) {
      return formatDuration(renderProgress.renderEstimatedTime);
    }

    if (
      renderProgress.currentFrame &&
      renderProgress.totalFrames &&
      renderProgress.currentFrame > 2 &&
      renderStartTimeRef.current
    ) {
      const elapsed = Date.now() - renderStartTimeRef.current;
      const remainingFrames = Math.max(0, renderProgress.totalFrames - renderProgress.currentFrame);
      const estRemainingMs = (elapsed / renderProgress.currentFrame) * remainingFrames;
      return formatDuration(estRemainingMs);
    }

    return null;
  };

  const percentage = Math.round((renderProgress?.progress || 0) * 100);
  const estimatedTimeText = getEstimatedRemaining();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-gray-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Export Quran Video</h2>
              <p className="text-xs text-gray-400">
                Surah {config.surahNumber} • Verses {config.fromAyah}–{config.toAyah}
              </p>
            </div>
          </div>
          {!isExporting && (
            <button
              onClick={() => setExportModalOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Resolution & FPS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400">Video Resolution</label>
              <select
                disabled={isExporting}
                value={config.resolution}
                onChange={(e) => updateConfig({ resolution: e.target.value as any })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-white text-xs disabled:opacity-50"
              >
                <option value="1080p">1080p Full HD (Recommended)</option>
                <option value="4k">4K Ultra HD (Master Quality)</option>
                <option value="720p">720p HD (Fast Export)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400">Frame Rate (FPS)</label>
              <select
                disabled={isExporting}
                value={config.fps}
                onChange={(e) => updateConfig({ fps: Number(e.target.value) as any })}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-white text-xs disabled:opacity-50"
              >
                <option value={30}>30 FPS (Cinematic Pacing)</option>
                <option value={60}>60 FPS (Ultra Smooth Motion)</option>
              </select>
            </div>
          </div>

          {/* Export Destination */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">Save Destination</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                disabled={isExporting}
                value={outputPath || 'Click browse to select output location...'}
                placeholder="Click browse to select output location..."
                className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300 font-mono truncate disabled:opacity-50"
              />
              <button
                disabled={isExporting}
                onClick={handleSelectSaveLocation}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium transition disabled:opacity-50"
              >
                <FolderOpen className="w-4 h-4 text-amber-400" />
                Browse
              </button>
            </div>
          </div>

          {/* Render Progress Bar Area */}
          {renderProgress && (
            <div className="space-y-2.5 p-4 rounded-2xl bg-gray-950 border border-gray-800">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-white">
                  {renderProgress.status === 'rendering' && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  )}
                  {renderProgress.status === 'completed' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  {renderProgress.status === 'failed' && (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  {renderProgress.status === 'rendering'
                    ? 'Rendering & Encoding H.264...'
                    : renderProgress.status === 'completed'
                    ? 'Rendering Completed Successfully!'
                    : renderProgress.status === 'cancelled'
                    ? 'Rendering Cancelled'
                    : 'Rendering Failed'}
                </span>
                <span className="font-mono text-amber-400 font-bold">{percentage}%</span>
              </div>

              <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    renderProgress.status === 'completed'
                      ? 'bg-emerald-500'
                      : renderProgress.status === 'failed'
                      ? 'bg-rose-500'
                      : 'bg-gradient-to-r from-amber-500 to-amber-300'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {renderProgress.status === 'rendering' ? (
                renderProgress.currentFrame && renderProgress.totalFrames ? (
                  <div className="flex justify-between items-center text-[11px] text-gray-400 font-mono">
                    <span>
                      Frame {renderProgress.currentFrame} of {renderProgress.totalFrames}
                    </span>
                    {estimatedTimeText ? (
                      <span className="text-amber-400/90 font-medium">
                        Estimated remaining: <span className="text-white font-semibold">{estimatedTimeText}</span>
                      </span>
                    ) : (
                      <span className="text-gray-500">Calculating ETA...</span>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-[11px] text-gray-400 font-mono">
                    <span>Preparing composition & bundler...</span>
                    <span className="text-gray-500">Starting render</span>
                  </div>
                )
              ) : renderProgress.status === 'completed' ? (
                <div className="flex justify-between items-center text-[11px] text-emerald-400/90 font-mono">
                  <span>Export finished: {renderProgress.totalFrames || totalDurationInFrames} frames</span>
                  {elapsedRenderTime ? (
                    <span>Total time: {formatDuration(elapsedRenderTime)}</span>
                  ) : null}
                </div>
              ) : null}

              {renderProgress.error && (
                <p className="text-xs text-rose-400 pt-1">{renderProgress.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-800 bg-gray-950/40">
          {isExporting ? (
            <div className="flex items-center justify-end w-full">
              <button
                onClick={handleCancelExport}
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-rose-400 text-xs font-medium transition"
              >
                Cancel Render
              </button>
            </div>
          ) : renderProgress?.status === 'completed' ? (
            <>
              <button
                onClick={() => setExportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition"
              >
                Close
              </button>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleLocateFile}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-xs font-semibold transition shadow-md active:scale-[0.98]"
                >
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  Locate File
                </button>
                <button
                  onClick={handleStartExport}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shadow-lg shadow-amber-500/20 active:scale-[0.98]"
                >
                  <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                  Re-render Again
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-end w-full gap-3">
              <button
                onClick={() => setExportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition"
              >
                Close
              </button>
              <button
                onClick={handleStartExport}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shadow-lg shadow-amber-500/20 active:scale-[0.98]"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                {renderProgress?.status === 'failed' ? 'Retry Rendering' : 'Start Rendering'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
