import React from 'react';
import { useStudioStore } from '../../store/studio-store';
import { ScriptureTab } from '../tabs/ScriptureTab';
import { SubtitlesTab } from '../tabs/SubtitlesTab';
import { VisualsTab } from '../tabs/VisualsTab';
import { AudioTab } from '../tabs/AudioTab';
import { BrandingTab } from '../tabs/BrandingTab';
import { ThumbnailTab } from '../thumbnail/ThumbnailTab';
import { ThumbnailPreviewView } from '../thumbnail/ThumbnailPreviewView';
import { LivePreview } from '../LivePreview';
import { ExportDialog } from '../modals/ExportDialog';
import { BookOpen, Layers, Image, Music, Shield, Sparkles } from 'lucide-react';

export const StudioLayout: React.FC = () => {
  const { activeTab, setActiveTab } = useStudioStore();

  const tabs = [
    { id: 'scripture' as const, label: 'Scripture', icon: BookOpen },
    { id: 'subtitles' as const, label: 'Subtitles', icon: Layers },
    { id: 'visuals' as const, label: 'Visuals', icon: Image },
    { id: 'audio' as const, label: 'Audio & Wave', icon: Music },
    { id: 'branding' as const, label: 'Branding', icon: Shield },
    { id: 'thumbnail' as const, label: 'Thumbnail', icon: Sparkles },
  ];

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Sidebar: Controls & Inspector */}
      <div className="w-[460px] flex-shrink-0 flex flex-col bg-gray-950 border-r border-gray-800/80">
        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-gray-800 bg-gray-950/80 px-2 pt-2 gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-semibold transition-all border-b-2 ${
                  isActive
                    ? 'border-amber-400 bg-gray-900 text-amber-300 shadow-sm'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-900/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Tab Panel Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'scripture' && <ScriptureTab />}
          {activeTab === 'subtitles' && <SubtitlesTab />}
          {activeTab === 'visuals' && <VisualsTab />}
          {activeTab === 'audio' && <AudioTab />}
          {activeTab === 'branding' && <BrandingTab />}
          {activeTab === 'thumbnail' && <ThumbnailTab />}
        </div>
      </div>

      {/* Right Canvas: Live Remotion Preview OR Thumbnail Studio Preview */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#070a12]">
        {activeTab === 'thumbnail' ? <ThumbnailPreviewView /> : <LivePreview />}
      </div>

      {/* Export Progress Modal */}
      <ExportDialog />
    </div>
  );
};
