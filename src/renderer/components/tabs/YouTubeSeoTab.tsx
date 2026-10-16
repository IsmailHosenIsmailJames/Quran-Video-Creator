import React, { useState, useMemo } from 'react';
import { useStudioStore } from '../../store/studio-store';
import {
  calculateYouTubeTimestamps,
  formatTimestampsForYouTube,
  generateYouTubeTitles,
  generateYouTubeDescription,
  generateYouTubeTags,
  formatFullYouTubeKitText,
  YouTubeDescriptionOptions,
  DEFAULT_DESCRIPTION_OPTIONS,
} from '../../../shared/youtube-seo-generator';
import { getSurahByNumber } from '../../../shared/surahs';
import {
  Youtube,
  Copy,
  Check,
  Download,
  Clock,
  Type,
  FileText,
  Tag,
  Play,
  Sparkles,
  BookOpen,
  Share2,
  ExternalLink,
} from 'lucide-react';

export const YouTubeSeoTab: React.FC = () => {
  const {
    config,
    ayahs,
    reciters,
    setCurrentFrame,
  } = useStudioStore();

  const [activeSubTab, setActiveSubTab] = useState<'titles' | 'timestamps' | 'description' | 'tags'>('description');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const reciterInfo = reciters[config.reciterIndex];
  const surahMeta = getSurahByNumber(config.surahNumber);

  // Description Builder Options
  const [descOptions, setDescOptions] = useState<YouTubeDescriptionOptions>(DEFAULT_DESCRIPTION_OPTIONS);

  // Generated Data
  const titleOptions = useMemo(
    () => generateYouTubeTitles(config, reciterInfo),
    [config, reciterInfo]
  );

  const [selectedTitle, setSelectedTitle] = useState<string>(() => titleOptions[0]?.text || '');

  const timestamps = useMemo(
    () => calculateYouTubeTimestamps(config, ayahs),
    [config, ayahs]
  );

  const timestampsFormatted = useMemo(
    () => formatTimestampsForYouTube(timestamps, descOptions.timestampFormat),
    [timestamps, descOptions.timestampFormat]
  );

  const fullDescription = useMemo(
    () => generateYouTubeDescription(config, ayahs, reciterInfo, descOptions),
    [config, ayahs, reciterInfo, descOptions]
  );

  const [editableDescription, setEditableDescription] = useState<string>(fullDescription);

  // Keep editable description in sync when options change
  React.useEffect(() => {
    setEditableDescription(fullDescription);
  }, [fullDescription]);

  const tagsList = useMemo(
    () => generateYouTubeTags(config, reciterInfo),
    [config, reciterInfo]
  );
  const tagsFormatted = useMemo(() => tagsList.join(', '), [tagsList]);

  // Copy helper with visual feedback
  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Download entire kit as .txt file
  const handleDownloadTxt = () => {
    const fullText = formatFullYouTubeKitText(
      config,
      ayahs,
      reciterInfo,
      selectedTitle,
      descOptions
    );
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const fileName = `YouTube_Kit_Surah_${config.surahNumber}_${surahMeta?.nameTransliterated || 'Quran'}.txt`;

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-4 pb-8 select-none">
      {/* Top Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-600/15 via-red-500/5 to-transparent border border-red-500/30">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white font-extrabold shadow-sm shadow-red-500/30">
              <Youtube className="w-4 h-4 fill-white stroke-none" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                YouTube SEO & Description Studio
              </h3>
              <p className="text-[10px] text-gray-400">
                Clickable chapters, high-CTR titles, and complete video metadata
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadTxt}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-750 text-gray-200 text-[11px] font-semibold transition active:scale-95"
            title="Download entire Title, Description, Chapters, and Tags as a formatted .txt file"
          >
            <Download className="w-3 h-3 text-amber-400" />
            <span>Save .txt Kit</span>
          </button>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-2 pt-2 border-t border-red-500/20 font-mono">
          <span className="text-red-300 font-bold">Surah {config.surahNumber} ({surahMeta?.nameTransliterated})</span>
          <span>•</span>
          <span>{timestamps.length} Chapters</span>
          <span>•</span>
          <span>{tagsList.length} Tags ({tagsFormatted.length}/500 chars)</span>
        </div>
      </div>

      {/* Sub-Section Navigation */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-gray-950 border border-gray-800 text-[11px] font-medium">
        {[
          { id: 'description', label: 'Description', icon: FileText },
          { id: 'timestamps', label: 'Chapters', icon: Clock },
          { id: 'titles', label: 'Titles', icon: Type },
          { id: 'tags', label: 'Tags', icon: Tag },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeSubTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSubTab(item.id as any)}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition ${
                isActive
                  ? 'bg-red-600 text-white font-bold shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 1. COMPLETE DESCRIPTION GENERATOR                         */}
      {/* ========================================================= */}
      {activeSubTab === 'description' && (
        <div className="space-y-3.5">
          {/* Modular Section Toggles */}
          <div className="p-3 rounded-xl bg-gray-950/80 border border-gray-800 space-y-2">
            <span className="text-xs font-semibold text-gray-300 block">
              Modular Description Sections:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={descOptions.includeHook}
                  onChange={(e) => setDescOptions({ ...descOptions, includeHook: e.target.checked })}
                  className="w-3.5 h-3.5 accent-red-600 rounded cursor-pointer"
                />
                <span>Intro Hook & Summary</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={descOptions.includeVirtues}
                  onChange={(e) => setDescOptions({ ...descOptions, includeVirtues: e.target.checked })}
                  className="w-3.5 h-3.5 accent-red-600 rounded cursor-pointer"
                />
                <span>Hadith & Surah Virtues</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={descOptions.includeTimestamps}
                  onChange={(e) => setDescOptions({ ...descOptions, includeTimestamps: e.target.checked })}
                  className="w-3.5 h-3.5 accent-red-600 rounded cursor-pointer"
                />
                <span>Video Chapters / Timestamps</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={descOptions.includeSurahMeta}
                  onChange={(e) => setDescOptions({ ...descOptions, includeSurahMeta: e.target.checked })}
                  className="w-3.5 h-3.5 accent-red-600 rounded cursor-pointer"
                />
                <span>Surah Facts & Details</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={descOptions.includeReciterCredits}
                  onChange={(e) => setDescOptions({ ...descOptions, includeReciterCredits: e.target.checked })}
                  className="w-3.5 h-3.5 accent-red-600 rounded cursor-pointer"
                />
                <span>Reciter & Translation Credits</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={descOptions.includeCallToAction}
                  onChange={(e) => setDescOptions({ ...descOptions, includeCallToAction: e.target.checked })}
                  className="w-3.5 h-3.5 accent-red-600 rounded cursor-pointer"
                />
                <span>Sadaqah Jariyah & CTA</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={descOptions.includeHashtags}
                  onChange={(e) => setDescOptions({ ...descOptions, includeHashtags: e.target.checked })}
                  className="w-3.5 h-3.5 accent-red-600 rounded cursor-pointer"
                />
                <span>YouTube Hashtags</span>
              </label>
            </div>
          </div>

          {/* Description Preview & Copy Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-200">
                Ready-to-Paste Description
              </span>
              <button
                type="button"
                onClick={() => handleCopy(editableDescription, 'desc')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
                  copiedKey === 'desc'
                    ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20'
                }`}
              >
                {copiedKey === 'desc' ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Copied Description!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full Description</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              value={editableDescription}
              onChange={(e) => setEditableDescription(e.target.value)}
              rows={14}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-gray-200 font-mono leading-relaxed focus:ring-1 focus:ring-red-500 focus:outline-none resize-y selection:bg-red-600/30"
              placeholder="Your video description will generate here..."
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. CLICKABLE CHAPTERS & TIMESTAMPS                        */}
      {/* ========================================================= */}
      {activeSubTab === 'timestamps' && (
        <div className="space-y-3.5">
          {/* Format Selector & Copy Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-lg border border-gray-800 text-[10px]">
              {[
                { id: 'compact', label: 'Compact' },
                { id: 'with-arabic', label: '+ Arabic' },
                { id: 'with-translation', label: '+ Translation' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setDescOptions({ ...descOptions, timestampFormat: fmt.id as any })}
                  className={`px-2 py-0.5 rounded transition ${
                    descOptions.timestampFormat === fmt.id
                      ? 'bg-red-600 text-white font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleCopy(timestampsFormatted, 'timestamps')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
                copiedKey === 'timestamps'
                  ? 'bg-emerald-500 text-black font-bold shadow-md'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              {copiedKey === 'timestamps' ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Copied Chapters!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Chapters</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-gray-400">
            Tip: Click any row below to jump the video player directly to that verse!
          </p>

          {/* Interactive Timestamps Table */}
          <div className="max-h-[420px] overflow-y-auto space-y-1.5 pr-1">
            {timestamps.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentFrame(item.frame)}
                className="flex items-center justify-between p-2 rounded-xl bg-gray-950 border border-gray-800 hover:border-red-500/50 hover:bg-gray-900/60 cursor-pointer transition group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30 flex-shrink-0">
                    {item.timeFormatted}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-white group-hover:text-red-300 transition block truncate">
                      {item.label}
                    </span>
                    {item.arabicSnippet && (
                      <span className="text-[10px] text-gray-400 font-amiri block truncate">
                        {item.arabicSnippet}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-gray-500 group-hover:text-red-400 transition flex-shrink-0">
                  <Play className="w-3 h-3 fill-current" />
                  <span>Jump</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. HIGH-CTR TITLES GENERATOR                              */}
      {/* ========================================================= */}
      {activeSubTab === 'titles' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-300">Active Video Title</label>
              <button
                type="button"
                onClick={() => handleCopy(selectedTitle, 'active-title')}
                className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded transition ${
                  copiedKey === 'active-title' ? 'text-emerald-400' : 'text-red-400 hover:text-red-300'
                }`}
              >
                {copiedKey === 'active-title' ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              value={selectedTitle}
              onChange={(e) => setSelectedTitle(e.target.value)}
              rows={2}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-white font-bold focus:ring-1 focus:ring-red-500 focus:outline-none"
            />
          </div>

          {/* Curated Formulas */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-300 block">
              High-Converting YouTube Title Formulas:
            </span>
            <div className="space-y-2">
              {titleOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setSelectedTitle(opt.text)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    selectedTitle === opt.text
                      ? 'bg-red-600/15 border-red-500/70 ring-1 ring-red-500/40 shadow-sm'
                      : 'bg-gray-950/70 border-gray-800 hover:border-gray-700 hover:bg-gray-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-red-400 font-mono">
                      {opt.label}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(opt.text, opt.id);
                      }}
                      className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition"
                      title="Copy this title"
                    >
                      {copiedKey === opt.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-white font-semibold leading-relaxed">
                    {opt.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. YOUTUBE TAGS & KEYWORDS                                */}
      {/* ========================================================= */}
      {activeSubTab === 'tags' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white block">
                YouTube Video Tags
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {tagsFormatted.length} / 500 characters used
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(tagsFormatted, 'tags')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
                copiedKey === 'tags'
                  ? 'bg-emerald-500 text-black font-bold shadow-md'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              {copiedKey === 'tags' ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Copied Tags!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Tags</span>
                </>
              )}
            </button>
          </div>

          {/* Visual Tag Pills */}
          <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-gray-950 border border-gray-800 max-h-56 overflow-y-auto">
            {tagsList.map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-750 text-gray-200"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Comma-Separated Raw Textarea */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-gray-400">Comma-separated raw string:</span>
            <textarea
              readOnly
              value={tagsFormatted}
              rows={4}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-gray-300 font-mono leading-relaxed focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
