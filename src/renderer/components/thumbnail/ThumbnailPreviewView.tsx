import React, { useRef, useState } from 'react';
import { useStudioStore } from '../../store/studio-store';
import { ThumbnailCanvas, ThumbnailCanvasRef } from './ThumbnailCanvas';
import { getSurahByNumber } from '../../../shared/surahs';
import {
  Download,
  Copy,
  Camera,
  Check,
  Eye,
  Grid,
  Sparkles,
  Maximize2,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

export const ThumbnailPreviewView: React.FC = () => {
  const {
    thumbnailConfig,
    updateThumbnailConfig,
    config,
    reciters,
  } = useStudioStore();

  const canvasRef = useRef<ThumbnailCanvasRef | null>(null);
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null);

  const surahMeta = getSurahByNumber(config.surahNumber);
  const defaultBaseName = `Thumbnail_Surah_${config.surahNumber}_${surahMeta?.nameTransliterated || 'Quran'}`;

  // Copy to system clipboard
  const handleCopyToClipboard = async () => {
    if (!canvasRef.current) return;
    try {
      setIsCopying(true);
      const dataUrl = await canvasRef.current.exportDataUrl('png');
      const api = window.electronAPI;
      if (api?.copyImageToClipboard) {
        await api.copyImageToClipboard(dataUrl);
      } else {
        // Web fallback: write blob to clipboard
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
      }
      setCopiedMessage('Copied to Clipboard!');
      setTimeout(() => setCopiedMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to copy to clipboard:', err);
      alert('Could not copy image to clipboard: ' + err.message);
    } finally {
      setIsCopying(false);
    }
  };

  // Download high-resolution PNG / JPG
  const handleDownload = async (format: 'png' | 'jpeg') => {
    if (!canvasRef.current) return;
    try {
      setIsDownloading(true);
      const dataUrl = await canvasRef.current.exportDataUrl(format, 0.95);
      const ext = format === 'jpeg' ? 'jpg' : 'png';
      const fileName = `${defaultBaseName}.${ext}`;

      const api = window.electronAPI;
      if (api?.saveThumbnailImage) {
        const saved = await api.saveThumbnailImage(dataUrl, fileName);
        if (saved) {
          setSavedFilePath(saved);
          setTimeout(() => setSavedFilePath(null), 6000);
        }
      } else {
        // Browser download fallback
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      console.error('Failed to download thumbnail:', err);
      alert('Could not save thumbnail image: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  // Capture current video frame
  const handleCaptureVideoFrame = () => {
    const videoEl = document.querySelector('video') || document.querySelector('.remotion-player-video');
    if (videoEl instanceof HTMLVideoElement) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth || 1280;
        canvas.height = videoEl.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png');
          updateThumbnailConfig({
            bgType: 'captured-frame',
            bgCapturedDataUrl: dataUrl,
          });
        }
      } catch (err) {
        console.error('Failed to capture frame:', err);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#06080e] overflow-hidden select-none">
      {/* Top Toolbar */}
      <div className="h-12 border-b border-gray-800/80 bg-gray-950/90 px-4 flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Thumbnail Live Studio
            </span>
          </div>

          <div className="h-3.5 w-[1px] bg-gray-800" />

          {/* Ratio & Dimension Badges */}
          <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-lg bg-gray-900 border border-gray-800 text-[11px] font-mono text-gray-300">
            <span className="text-amber-400 font-semibold">{thumbnailConfig.aspectRatio}</span>
            <span className="text-gray-600">•</span>
            <span>
              {thumbnailConfig.aspectRatio === '9:16'
                ? '1080×1920'
                : thumbnailConfig.aspectRatio === '1:1'
                ? '1080×1080'
                : '1280×720 (YouTube HD)'}
            </span>
          </div>

          {/* Quick Helper Toggles */}
          <div className="flex items-center gap-1.5 ml-2">
            <button
              type="button"
              onClick={() =>
                updateThumbnailConfig({
                  showYouTubeSafeZone: !thumbnailConfig.showYouTubeSafeZone,
                })
              }
              className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border transition ${
                thumbnailConfig.showYouTubeSafeZone
                  ? 'bg-red-500/20 border-red-500/60 text-red-300'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
              }`}
              title="Show / hide YouTube timestamp safe zone in the bottom-right corner"
            >
              <Eye className="w-3 h-3" />
              <span>YT Safe Zone</span>
            </button>

            <button
              type="button"
              onClick={() =>
                updateThumbnailConfig({
                  showRuleOfThirds: !thumbnailConfig.showRuleOfThirds,
                })
              }
              className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border transition ${
                thumbnailConfig.showRuleOfThirds
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
              }`}
              title="Show / hide 3x3 Rule of Thirds grid"
            >
              <Grid className="w-3 h-3" />
              <span>Grid</span>
            </button>
          </div>
        </div>

        {/* Action Buttons: Copy, Download PNG, Download JPG */}
        <div className="flex items-center gap-2">
          {savedFilePath && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs animate-in fade-in duration-200">
              <Check className="w-3.5 h-3.5" />
              <span>Saved!</span>
              <button
                type="button"
                onClick={() => window.electronAPI?.showInFolder(savedFilePath)}
                className="ml-1 text-[11px] underline hover:text-emerald-200"
              >
                Open
              </button>
            </div>
          )}

          {copiedMessage && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs animate-in fade-in duration-200">
              <Check className="w-3.5 h-3.5" />
              <span>{copiedMessage}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopyToClipboard}
            disabled={isCopying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-750 text-gray-200 text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
            title="Copy thumbnail directly to clipboard to paste into YouTube Studio"
          >
            <Copy className="w-3.5 h-3.5 text-amber-400" />
            <span>{isCopying ? 'Copying...' : 'Copy Image'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownload('jpeg')}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-750 text-gray-200 text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
            title="Download compressed JPEG (Optimal for YouTube < 2MB limit)"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Download JPG</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownload('png')}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-xs shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition active:scale-95 disabled:opacity-50"
            title="Download high-resolution lossless PNG"
          >
            <Sparkles className="w-3.5 h-3.5 fill-black stroke-none" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-0 bg-[#07090e]">
        <div className="w-full h-full max-w-[1100px] flex items-center justify-center">
          <ThumbnailCanvas
            ref={canvasRef}
            config={thumbnailConfig}
            videoConfig={config}
            reciterInfo={reciters[config.reciterIndex]}
            className="max-h-full max-w-full rounded-2xl shadow-2xl border border-gray-800/80 ring-1 ring-white/10"
          />
        </div>
      </div>

      {/* Bottom Status / Tip Bar */}
      <div className="h-8 border-t border-gray-800/60 bg-gray-950/80 px-4 flex items-center justify-between text-[11px] text-gray-400 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-semibold">Tip:</span>
          <span>
            Keep the bottom-right corner clear so YouTube's video duration badge doesn't hide key text.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>Preset: <strong className="text-gray-200">{thumbnailConfig.preset}</strong></span>
          <span>Theme: <strong className="text-amber-300 font-mono">{thumbnailConfig.accentThemeColor}</strong></span>
        </div>
      </div>
    </div>
  );
};
