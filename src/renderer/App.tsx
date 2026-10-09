import React, { useEffect } from 'react';
import { Header } from './components/layout/Header';
import { StudioLayout } from './components/layout/StudioLayout';
import { useStudioStore } from './store/studio-store';

export const App: React.FC = () => {
  const { initializeStudio } = useStudioStore();

  useEffect(() => {
    initializeStudio();
  }, [initializeStudio]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090d16] text-gray-100 overflow-hidden font-sans">
      <Header />
      <StudioLayout />
    </div>
  );
};

export default App;
