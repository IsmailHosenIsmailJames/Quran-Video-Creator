import React, { useEffect } from 'react';
import { Header } from './components/layout/Header';
import { StudioLayout } from './components/layout/StudioLayout';
import { useStudioStore } from './store/studio-store';

export const App: React.FC = () => {
  const { initializeStudio } = useStudioStore();

  useEffect(() => {
    initializeStudio();
  }, [initializeStudio]);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onMenuAction) return;

    const cleanup = api.onMenuAction(async (action: string, payload?: any) => {
      const store = useStudioStore.getState();
      switch (action) {
        case 'export-video':
          store.setExportModalOpen(true);
          break;
        case 'set-aspect-ratio':
          store.updateConfig({ aspectRatio: payload });
          break;
        case 'set-resolution':
          store.updateConfig({ resolution: payload });
          break;
        case 'set-fps':
          store.updateConfig({ fps: payload });
          break;
        case 'next-surah': {
          const next = Math.min(114, store.config.surahNumber + 1);
          if (next !== store.config.surahNumber) {
            store.changeSurah(next);
          }
          break;
        }
        case 'prev-surah': {
          const prev = Math.max(1, store.config.surahNumber - 1);
          if (prev !== store.config.surahNumber) {
            store.changeSurah(prev);
          }
          break;
        }
        case 'upload-bg-video': {
          const path = await api.selectMediaFile('video');
          if (path) {
            store.updateConfig({ backgroundType: 'video', backgroundPath: path });
          }
          break;
        }
        case 'upload-bg-image': {
          const path = await api.selectMediaFile('image');
          if (path) {
            store.updateConfig({ backgroundType: 'image', backgroundPath: path });
          }
          break;
        }
        case 'upload-custom-audio': {
          const path = await api.selectMediaFile('audio');
          if (path) {
            store.updateConfig({ customAudioPath: path });
            store.refreshAyahSequence();
          }
          break;
        }
        case 'about':
          alert('Quran Video Studio v1.0\nDesktop Motion Graphics & Recitation Studio powered by Remotion');
          break;
      }
    });

    return () => cleanup();
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090d16] text-gray-100 overflow-hidden font-sans">
      <Header />
      <StudioLayout />
    </div>
  );
};

export default App;
