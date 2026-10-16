import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState, useMemo } from 'react';
import { ThumbnailConfig } from '../../../shared/thumbnail-types';
import { VideoTemplateConfig, ReciterInfo } from '../../../shared/types';
import { renderThumbnailToCanvas } from './thumbnail-canvas-engine';

export interface ThumbnailCanvasRef {
  exportDataUrl: (format?: 'png' | 'jpeg', quality?: number) => Promise<string>;
  getCanvasElement: () => HTMLCanvasElement | null;
}

interface ThumbnailCanvasProps {
  config: ThumbnailConfig;
  videoConfig: VideoTemplateConfig;
  reciterInfo?: ReciterInfo;
  className?: string;
}

export const ThumbnailCanvas = forwardRef<ThumbnailCanvasRef, ThumbnailCanvasProps>(
  ({ config, videoConfig, reciterInfo, className = '' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isRendering, setIsRendering] = useState<boolean>(false);
    const [renderError, setRenderError] = useState<string | null>(null);

    // Canvas target dimensions based on aspect ratio
    const { canvasWidth, canvasHeight } = useMemo(() => {
      if (config.aspectRatio === '9:16') return { canvasWidth: 1080, canvasHeight: 1920 };
      if (config.aspectRatio === '1:1') return { canvasWidth: 1080, canvasHeight: 1080 };
      return { canvasWidth: 1280, canvasHeight: 720 };
    }, [config.aspectRatio]);

    // Imperative API for export & clipboard
    useImperativeHandle(ref, () => ({
      getCanvasElement: () => canvasRef.current,
      exportDataUrl: async (format = 'png', quality = 0.95): Promise<string> => {
        const canvas = canvasRef.current;
        if (!canvas) throw new Error('Thumbnail Canvas is not mounted');

        // Re-render once to guarantee latest state is fully drawn
        await renderThumbnailToCanvas(canvas, { config, videoConfig, reciterInfo });

        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        return canvas.toDataURL(mimeType, quality);
      },
    }));

    // Re-draw onto HTML5 Canvas whenever configuration changes
    useEffect(() => {
      let isCancelled = false;

      const draw = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
          setIsRendering(true);
          setRenderError(null);
          await renderThumbnailToCanvas(canvas, { config, videoConfig, reciterInfo });
        } catch (err: any) {
          if (!isCancelled) {
            console.error('Failed to render thumbnail to canvas:', err);
            setRenderError(err.message || 'Render error');
          }
        } finally {
          if (!isCancelled) {
            setIsRendering(false);
          }
        }
      };

      draw();

      return () => {
        isCancelled = true;
      };
    }, [config, videoConfig, reciterInfo, canvasWidth, canvasHeight]);

    return (
      <div
        className={`relative w-full flex items-center justify-center select-none overflow-hidden ${className}`}
        style={{
          aspectRatio: `${canvasWidth} / ${canvasHeight}`,
          maxHeight: '100%',
        }}
      >
        {/* The Direct HTML5 Canvas: WYSIWYG 100% Match Between Preview & Export */}
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="w-full h-full object-contain block drop-shadow-2xl rounded-xl"
        />

        {/* Loading Spinner Indicator */}
        {isRendering && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-mono border border-amber-500/30 flex items-center gap-1.5 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>Rendering</span>
          </div>
        )}

        {/* Error Notification */}
        {renderError && (
          <div className="absolute inset-x-4 bottom-4 p-2.5 rounded-xl bg-red-950/90 border border-red-500/50 text-red-200 text-xs text-center backdrop-blur-md">
            Render error: {renderError}
          </div>
        )}

        {/* ================================================================= */}
        {/* UI OVERLAYS ONLY (Assists the user, NEVER drawn into exported file)*/}
        {/* ================================================================= */}

        {/* 1. YouTube Safe Zone (Bottom-Right Timestamp overlay) */}
        {config.showYouTubeSafeZone && (
          <div
            className="absolute bottom-4 right-4 pointer-events-none z-10 flex flex-col items-end"
            style={{ width: '13%', minWidth: '90px' }}
          >
            <div className="w-full py-1 px-2 rounded-md bg-red-600/30 border border-dashed border-red-400 backdrop-blur-xs flex flex-col items-center justify-center shadow-lg">
              <span className="text-[9px] font-bold text-red-200 uppercase tracking-wider text-center leading-tight">
                YouTube Time
              </span>
              <span className="text-[11px] font-black font-mono text-white mt-0.5">
                14:28
              </span>
            </div>
          </div>
        )}

        {/* 2. Rule of Thirds 3x3 Composition Grid */}
        {config.showRuleOfThirds && (
          <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-3 border border-white/20">
            <div className="border-r border-b border-dashed border-white/25" />
            <div className="border-r border-b border-dashed border-white/25" />
            <div className="border-b border-dashed border-white/25" />
            <div className="border-r border-b border-dashed border-white/25" />
            <div className="border-r border-b border-dashed border-white/25" />
            <div className="border-b border-dashed border-white/25" />
            <div className="border-r border-dashed border-white/25" />
            <div className="border-r border-dashed border-white/25" />
            <div />
          </div>
        )}
      </div>
    );
  }
);

ThumbnailCanvas.displayName = 'ThumbnailCanvas';
