import React, { useMemo } from 'react';
import { Player } from '@remotion/player';
import { QuranVideo } from '../../remotion/compositions/QuranVideo';
import { useStudioStore } from '../store/studio-store';
import { QuranVideoCompositionProps } from '../../shared/types';
import { Loader2, Maximize2, Sparkles } from 'lucide-react';

export const LivePreview: React.FC = () => {
  const { config, ayahs, totalDurationInFrames, isLoading, statusMessage } = useStudioStore();

  const inputProps: QuranVideoCompositionProps = useMemo(() => {
    return {
      config,
      ayahs,
      totalDurationInFrames,
    };
  }, [config, ayahs, totalDurationInFrames]);

  const { compWidth, compHeight, aspectClass } = useMemo(() => {
    if (config.aspectRatio === '9:16') {
      return { compWidth: 1080, compHeight: 1920, aspectClass: 'aspect-[9/16] max-h-[80vh]' };
    }
    if (config.aspectRatio === '1:1') {
      return { compWidth: 1080, compHeight: 1080, aspectClass: 'aspect-square max-h-[80vh]' };
    }
    return { compWidth: 1920, compHeight: 1080, aspectClass: 'aspect-video w-full' };
  }, [config.aspectRatio]);

  const durationSec = (totalDurationInFrames / config.fps).toFixed(1);

  return (
    <div className="flex flex-col h-full bg-[#070a12] p-6 relative select-none">
      {/* Top Toolbar Above Canvas */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-gray-300 font-medium">Real-Time Studio Canvas</span>
          </div>

          <div className="text-xs text-gray-400 font-mono">
            {compWidth} × {compHeight} • {config.fps} FPS • {durationSec}s ({totalDurationInFrames}f)
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-amber-300/80 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Karaoke Word Sync Enabled</span>
        </div>
      </div>

      {/* Main Canvas Container */}
      <div className="flex-1 flex items-center justify-center min-h-0 relative">
        <div
          className={`relative shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black flex items-center justify-center transition-all ${aspectClass}`}
        >
          {ayahs.length > 0 ? (
            <Player<any, QuranVideoCompositionProps>
              component={QuranVideo}
              inputProps={inputProps}
              durationInFrames={Math.max(30, totalDurationInFrames)}
              fps={config.fps}
              compositionWidth={compWidth}
              compositionHeight={compHeight}
              style={{
                width: '100%',
                height: '100%',
              }}
              controls
              autoPlay={false}
              loop
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-400" />
              <p className="text-sm font-medium">Loading scripture sequence...</p>
            </div>
          )}

          {/* Loading Indicator Overlay */}
          {isLoading && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/80 backdrop-blur-md border border-amber-500/30 text-amber-300 text-xs px-3 py-1.5 rounded-full shadow-lg z-20">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
