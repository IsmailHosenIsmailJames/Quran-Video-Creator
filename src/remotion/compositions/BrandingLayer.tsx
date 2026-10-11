import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, Img } from 'remotion';
import { getMediaUrl } from '../../shared/media-url';

interface BrandingLayerProps {
  logoPath?: string;
  channelHandle: string;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  scale: number;
}

export const BrandingLayer: React.FC<BrandingLayerProps> = ({
  logoPath,
  channelHandle,
  position,
  scale,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const popProgress = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Continuous subtle 4-second breathing cycle
  const breath = Math.sin((frame / fps) * (Math.PI * 2 / 4)) * 0.02 + 1.0;

  const positionStyles: Record<string, React.CSSProperties> = {
    'top-right': { top: '32px', right: '32px' },
    'top-left': { top: '32px', left: '32px' },
    'bottom-right': { bottom: '32px', right: '32px' },
    'bottom-left': { bottom: '32px', left: '32px' },
  };

  const resolvedLogoSrc = getMediaUrl(logoPath);
  const isPuppeteer = typeof window !== 'undefined' && !(window as any).electronAPI;
  const isLoadable = Boolean(
    resolvedLogoSrc && (!isPuppeteer || !resolvedLogoSrc.startsWith('app-media://'))
  );

  if (!isLoadable && (!channelHandle || !channelHandle.trim())) {
    return null;
  }

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', userSelect: 'none' }}>
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '9999px',
          padding: '8px 18px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
          transform: `scale(${popProgress * scale * breath})`,
          opacity: popProgress,
          ...positionStyles[position],
        }}
      >
        {isLoadable ? (
          <Img
            src={resolvedLogoSrc}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '9999px',
              objectFit: 'cover',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          />
        ) : (
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '9999px',
              background: 'linear-gradient(to top right, #F59E0B, #FDE68A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#000', fontSize: '13px', lineHeight: 1 }}>📖</span>
          </div>
        )}
        {channelHandle && (
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'rgba(255, 255, 255, 0.95)',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            {channelHandle}
          </span>
        )}
      </div>
    </AbsoluteFill>
  );
};
