import React, { useMemo, useRef, useState, useLayoutEffect, useEffect } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { QuranVideo } from '../../remotion/compositions/QuranVideo';
import { useStudioStore } from '../store/studio-store';
import { QuranVideoCompositionProps } from '../../shared/types';
import { Loader2 } from 'lucide-react';
import { StudioTimeline } from './timeline/StudioTimeline';

export const LivePreview: React.FC = () => {
  const { config, ayahs, totalDurationInFrames, isLoading, statusMessage } = useStudioStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerRef>(null);
  const currentFrameRef = useRef<number>(0);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      setContainerSize({
        width: rect.width,
        height: rect.height,
      });
    };

    updateSize();

    const ro = new ResizeObserver(updateSize);
    ro.observe(el);

    return () => {
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onFrameUpdate = (e: { detail: { frame: number } }) => {
      currentFrameRef.current = e.detail.frame;
      setCurrentFrame(e.detail.frame);
    };

    player.addEventListener('frameupdate', onFrameUpdate);
    return () => {
      player.removeEventListener('frameupdate', onFrameUpdate);
    };
  }, [config.aspectRatio]);

  const inputProps: QuranVideoCompositionProps = useMemo(() => {
    return {
      config,
      ayahs,
      totalDurationInFrames,
    };
  }, [config, ayahs, totalDurationInFrames]);

  const { compWidth, compHeight } = useMemo(() => {
    if (config.aspectRatio === '9:16') {
      return { compWidth: 1080, compHeight: 1920 };
    }
    if (config.aspectRatio === '1:1') {
      return { compWidth: 1080, compHeight: 1080 };
    }
    return { compWidth: 1920, compHeight: 1080 };
  }, [config.aspectRatio]);

  const { playerWidth, playerHeight } = useMemo(() => {
    if (containerSize.width <= 0 || containerSize.height <= 0) {
      return { playerWidth: undefined, playerHeight: undefined };
    }

    // Leave comfortable padding around the canvas
    const paddingX = 24;
    const paddingY = 24;
    const maxW = Math.max(100, containerSize.width - paddingX);
    const maxH = Math.max(100, containerSize.height - paddingY);

    const targetRatio = compWidth / compHeight;
    const containerRatio = maxW / maxH;

    let width: number;
    let height: number;

    if (containerRatio > targetRatio) {
      // Container is wider than composition -> fit by height
      height = maxH;
      width = Math.round(maxH * targetRatio);
    } else {
      // Container is narrower than composition -> fit by width
      width = maxW;
      height = Math.round(maxW / targetRatio);
    }

    return { playerWidth: width, playerHeight: height };
  }, [containerSize, compWidth, compHeight]);

  return (
    <div className="flex flex-col h-full bg-[#070a12] p-3 relative select-none">
      {/* Main Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center min-h-0 min-w-0 relative w-full h-full overflow-hidden"
      >
        <div
          style={
            playerWidth && playerHeight
              ? {
                  width: `${playerWidth}px`,
                  height: `${playerHeight}px`,
                  aspectRatio: `${compWidth} / ${compHeight}`,
                }
              : {
                  aspectRatio: `${compWidth} / ${compHeight}`,
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: config.aspectRatio === '16:9' ? '100%' : 'auto',
                  height: config.aspectRatio === '16:9' ? 'auto' : '100%',
                }
          }
          className="relative shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black flex items-center justify-center transition-all duration-150"
        >
          {ayahs.length > 0 ? (
            <Player<any, QuranVideoCompositionProps>
              key={`${config.aspectRatio}-${compWidth}x${compHeight}`}
              ref={playerRef}
              initialFrame={Math.min(currentFrameRef.current, Math.max(0, totalDurationInFrames - 1))}
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

      {/* Interactive Video Studio Timeline */}
      <StudioTimeline
        playerRef={playerRef}
        currentFrame={currentFrame}
        totalDurationInFrames={totalDurationInFrames}
        fps={config.fps}
      />
    </div>
  );
};
