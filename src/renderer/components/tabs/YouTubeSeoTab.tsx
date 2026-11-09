import React, { useState, useMemo, useEffect } from 'react';
import { useStudioStore } from '../../store/studio-store';
import {
  calculateYouTubeTimestamps,
  formatTimestampsForYouTube,
  generateYouTubeTitles,
  generateYouTubeDescription,
  generateYouTubeTags,
  formatFullYouTubeKitText,
  extractSalatMetadata,
  YouTubeDescriptionOptions,
  DEFAULT_DESCRIPTION_OPTIONS,
  SalatPrayerType,
  SalatChapterMode,
  SalatImamTitle,
} from '../../../shared/youtube-seo-generator';
import { getSurahByNumber } from '../../../shared/surahs';
import { getSurahNameLocalized, getReciterNameLocalized } from '../../../shared/surah-localization';
import { isSalatJammatManifest } from '../../../shared/types';
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
  Languages,
  CheckCircle2,
} from 'lucide-react';

export const YouTubeSeoTab: React.FC = () => {
  const {
    config,
    ayahs,
    reciters,
    setCurrentFrame,
    customTimestamp,
  } = useStudioStore();

  const isSalat = isSalatJammatManifest(customTimestamp);

  const [activeSubTab, setActiveSubTab] = useState<'titles' | 'timestamps' | 'description' | 'tags'>('description');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const reciterInfo = reciters[config.reciterIndex];
  const surahMeta = getSurahByNumber(config.surahNumber);

  // Description Builder Options (Defaulting to Bengali Clean Mode)
  const [descOptions, setDescOptions] = useState<YouTubeDescriptionOptions>(DEFAULT_DESCRIPTION_OPTIONS);

  const salatMeta = useMemo(
    () => (isSalat ? extractSalatMetadata(customTimestamp, descOptions) : null),
    [isSalat, customTimestamp, descOptions.salatPrayerType, descOptions.salatImamTitle]
  );

  // Generated Data
  const titleOptions = useMemo(
    () =>
      generateYouTubeTitles(
        config,
        reciterInfo,
        {
          language: descOptions.language,
          digitFormat: descOptions.digitFormat,
          salatPrayerType: descOptions.salatPrayerType,
          salatImamTitle: descOptions.salatImamTitle,
        },
        customTimestamp
      ),
    [config, reciterInfo, descOptions.language, descOptions.digitFormat, descOptions.salatPrayerType, descOptions.salatImamTitle, customTimestamp]
  );

  const [selectedTitle, setSelectedTitle] = useState<string>(() => titleOptions[0]?.text || '');

  // Keep selectedTitle updated when titleOptions change
  useEffect(() => {
    if (titleOptions && titleOptions.length > 0) {
      setSelectedTitle(titleOptions[0].text);
    }
  }, [titleOptions]);

  const timestamps = useMemo(
    () =>
      calculateYouTubeTimestamps(
        config,
        ayahs,
        {
          language: descOptions.language,
          digitFormat: descOptions.digitFormat,
          salatPrayerType: descOptions.salatPrayerType,
          salatChapterMode: descOptions.salatChapterMode,
        },
        customTimestamp
      ),
    [config, ayahs, descOptions.language, descOptions.digitFormat, descOptions.salatPrayerType, descOptions.salatChapterMode, customTimestamp]
  );

  const timestampsFormatted = useMemo(
    () => formatTimestampsForYouTube(timestamps, descOptions.timestampFormat),
    [timestamps, descOptions.timestampFormat]
  );

  const fullDescription = useMemo(
    () => generateYouTubeDescription(config, ayahs, reciterInfo, descOptions, customTimestamp),
    [config, ayahs, reciterInfo, descOptions, customTimestamp]
  );

  const [editableDescription, setEditableDescription] = useState<string>(fullDescription);

  // Keep editable description in sync when options change
  useEffect(() => {
    setEditableDescription(fullDescription);
  }, [fullDescription]);

  const tagsList = useMemo(
    () =>
      generateYouTubeTags(
        config,
        reciterInfo,
        {
          language: descOptions.language,
          salatPrayerType: descOptions.salatPrayerType,
          salatImamTitle: descOptions.salatImamTitle,
        },
        customTimestamp
      ),
    [config, reciterInfo, descOptions.language, descOptions.salatPrayerType, descOptions.salatImamTitle, customTimestamp]
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
      descOptions,
      customTimestamp
    );
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const isBn = descOptions.language === 'bn';
    const surahSuffix = isSalat && salatMeta
      ? isBn
        ? `${salatMeta.prayerNameBn.replace(/\s+/g, '_')}_${salatMeta.combinedSurahsBn.replace(/\s+/g, '_')}`
        : `${salatMeta.prayerNameEn.replace(/\s+/g, '_')}_${salatMeta.combinedSurahsEn.replace(/\s+/g, '_')}`
      : isBn
      ? `Surah_${config.surahNumber}_${getSurahNameLocalized(config.surahNumber, 'bn').replace(/\s+/g, '_')}`
      : `Surah_${config.surahNumber}_${surahMeta?.nameTransliterated || 'Quran'}`;
    const fileName = `YouTube_Kit_${surahSuffix}.txt`;

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isBn = descOptions.language === 'bn';
  const surahDisplayName = isSalat && salatMeta
    ? isBn
      ? `${salatMeta.prayerNameBn} (${salatMeta.combinedSurahsBn})`
      : `${salatMeta.prayerNameEn} (${salatMeta.combinedSurahsEn})`
    : isBn
    ? `সূরা ${getSurahNameLocalized(config.surahNumber, 'bn')}`
    : `Surah ${surahMeta?.nameTransliterated || config.surahNumber}`;

  const reciterDisplayName = isSalat && salatMeta
    ? isBn
      ? `${salatMeta.imamTitleBn}: ${getReciterNameLocalized(reciterInfo?.name, 'bn')}`
      : `${salatMeta.imamTitleEn}: ${reciterInfo?.name || 'Imam'}`
    : isBn
    ? getReciterNameLocalized(reciterInfo?.name, 'bn')
    : (reciterInfo?.name || 'Noble Quran');

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
                {isBn ? 'ইউটিউব টাইটেল ও মেটাডাটা স্টুডিও' : 'YouTube SEO & Description Studio'}
              </h3>
              <p className="text-[10px] text-gray-400">
                {isBn
                  ? 'ক্লিন বাংলা টাইটেল, আয়াতভিত্তিক টাইমলাইন ও নির্ভুল তথ্য'
                  : 'Clickable chapters, high-CTR titles, and complete video metadata'}
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
            <span>{isBn ? '.txt কিট ডাউনলোড' : 'Save .txt Kit'}</span>
          </button>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-2 pt-2 border-t border-red-500/20 font-mono flex-wrap">
          <span className="text-red-300 font-bold">{surahDisplayName}</span>
          <span>•</span>
          <span className="text-gray-300">{reciterDisplayName}</span>
          <span>•</span>
          <span>{timestamps.length} {isBn ? 'টি টাইমস্ট্যাম্প' : 'Chapters'}</span>
          <span>•</span>
          <span>{tagsList.length} {isBn ? 'টি ট্যাগ' : 'Tags'} ({tagsFormatted.length}/500)</span>
        </div>
      </div>

      {/* Salat Jama'ah Prayer Configuration Card */}
      {isSalat && salatMeta && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-indigo-900/40 to-transparent border border-indigo-500/40 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🕌</span>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {isBn ? 'জামাত সালাত এসইও মোড সক্রিয়' : 'Salat Jama\'ah Prayer SEO Active'}
                </span>
                <p className="text-[11px] text-indigo-300/80">
                  {isBn
                    ? 'বহু-সূরা সালাতের জন্য উচ্চ-সিলেক্টেড টাইটেল, অধ্যায়ভিত্তিক চ্যাপ্টার ও হাদিস সংযুক্ত।'
                    : 'Titles, multi-surah chapters, and prayer Hadiths are calibrated for congregational recitation.'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold">
              {customTimestamp.segments_count || customTimestamp.segments?.length || 2} Segments • {salatMeta.rakahsTextBn}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-indigo-900/50">
            <div>
              <label className="text-[10px] font-semibold text-gray-300 block mb-1">
                {isBn ? 'সালাতের ধরন (Prayer Type)' : 'Prayer Category'}
              </label>
              <select
                value={descOptions.salatPrayerType || 'taraweeh'}
                onChange={(e) =>
                  setDescOptions({
                    ...descOptions,
                    salatPrayerType: e.target.value as SalatPrayerType,
                  })
                }
                className="w-full bg-gray-900 border border-indigo-700/60 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400 cursor-pointer"
              >
                <option value="taraweeh">🌙 তারাবীহ সালাত (Taraweeh)</option>
                <option value="tahajjud">⭐ তাহাজ্জুদ (Tahajjud & Qiyam)</option>
                <option value="salat-jamaah">🕌 জামাত সালাত (Salat Jama'ah)</option>
                <option value="jumuah">🤲 জুমুআ সালাত (Jumu'ah)</option>
                <option value="general-salat">🕋 সাধারণ সালাত (General Prayer)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-gray-300 block mb-1">
                {isBn ? 'চ্যাপ্টার স্টাইল (Chapter Mode)' : 'Chapter Granularity'}
              </label>
              <select
                value={descOptions.salatChapterMode || 'segments'}
                onChange={(e) =>
                  setDescOptions({
                    ...descOptions,
                    salatChapterMode: e.target.value as SalatChapterMode,
                  })
                }
                className="w-full bg-gray-900 border border-indigo-700/60 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400 cursor-pointer"
              >
                <option value="segments">✨ সূরা ও রুকুভিত্তিক (Clean Chapters)</option>
                <option value="verses">📖 প্রতিটি আয়াতসহ (Detailed Verses)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-gray-300 block mb-1">
                {isBn ? 'ক্বারীর উপাধি (Imam / Qari Title)' : 'Reciter Designation'}
              </label>
              <select
                value={descOptions.salatImamTitle || 'imam-qari'}
                onChange={(e) =>
                  setDescOptions({
                    ...descOptions,
                    salatImamTitle: e.target.value as SalatImamTitle,
                  })
                }
                className="w-full bg-gray-900 border border-indigo-700/60 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400 cursor-pointer"
              >
                <option value="imam-qari">ইমাম ও ক্বারী (Imam & Reciter)</option>
                <option value="imam">ইমাম (Imam)</option>
                <option value="qari">ক্বারী (Qari)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Language & Style Mode Control Toolbar */}
      <div className="p-3 rounded-2xl bg-gray-950 border border-gray-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-gray-200">ভাষা ও মোড (Language & Style)</span>
          </div>
          <div className="flex items-center bg-gray-900 p-0.5 rounded-lg border border-gray-800 text-[11px]">
            <button
              type="button"
              onClick={() => setDescOptions({ ...descOptions, language: 'bn' })}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                descOptions.language === 'bn'
                  ? 'bg-amber-500 text-gray-950 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              বাংলা (Bangla)
            </button>
            <button
              type="button"
              onClick={() => setDescOptions({ ...descOptions, language: 'en' })}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                descOptions.language === 'en'
                  ? 'bg-amber-500 text-gray-950 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              English
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-800/80 text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-[11px]">মোড:</span>
            <div className="flex items-center bg-gray-900 rounded-lg p-0.5 border border-gray-800 text-[11px]">
              <button
                type="button"
                onClick={() =>
                  setDescOptions({
                    ...descOptions,
                    mode: 'clean',
                    includeHook: false,
                    includeVirtues: false,
                    includeCallToAction: false,
                  })
                }
                className={`px-2.5 py-1 rounded font-medium transition flex items-center gap-1 ${
                  descOptions.mode === 'clean'
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                title="কোনো অপ্রয়োজনীয় কথা নেই, শুধু সূরা, টাইমলাইন ও ক্বারী"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>সাধারণ (কোনো বাড়তি কথা নেই)</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setDescOptions({
                    ...descOptions,
                    mode: 'detailed',
                    includeHook: true,
                    includeVirtues: true,
                    includeCallToAction: true,
                  })
                }
                className={`px-2.5 py-1 rounded font-medium transition ${
                  descOptions.mode === 'detailed'
                    ? 'bg-gray-800 text-white font-semibold'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                বিস্তারিত (Detailed)
              </button>
            </div>
          </div>

          {descOptions.language === 'bn' && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-gray-400">সংখ্যা:</span>
              <button
                type="button"
                onClick={() =>
                  setDescOptions({
                    ...descOptions,
                    digitFormat: descOptions.digitFormat === 'bengali' ? 'english' : 'bengali',
                  })
                }
                className="px-2 py-0.5 rounded bg-gray-900 hover:bg-gray-850 border border-gray-800 text-amber-300 font-mono text-[11px] transition"
              >
                {descOptions.digitFormat === 'bengali' ? '১, ২, ৩ (বাংলা)' : '1, 2, 3 (Eng)'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Section Navigation */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-gray-950 border border-gray-800 text-[11px] font-medium">
        {[
          { id: 'description', label: isBn ? 'ডেসক্রিপশন' : 'Description', icon: FileText },
          { id: 'timestamps', label: isBn ? 'টাইমলাইন' : 'Chapters', icon: Clock },
          { id: 'titles', label: isBn ? 'টাইটেল' : 'Titles', icon: Type },
          { id: 'tags', label: isBn ? 'ট্যাগস' : 'Tags', icon: Tag },
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
          {descOptions.mode === 'clean' ? (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="text-emerald-200 font-bold block">
                    {isBn ? 'সাধারণ ও পরিচ্ছন্ন মোড সক্রিয়' : 'Clean & Minimal Mode Active'}
                  </span>
                  <span className="text-emerald-400/80 text-[11px]">
                    {isBn
                      ? 'কোনো অপ্রয়োজনীয় কথা নেই। শুধু সূরা তথ্য, ক্বারী, অনুবাদক ও আয়াত টাইমলাইন।'
                      : 'Zero fluff. Only essential Surah metadata, Reciter, and Chapters.'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDescOptions({
                    ...descOptions,
                    mode: 'detailed',
                    includeHook: true,
                    includeVirtues: true,
                    includeCallToAction: true,
                  })
                }
                className="px-2.5 py-1 rounded-lg bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold transition"
              >
                {isBn ? 'কাস্টমাইজ' : 'Customize'}
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-gray-950/80 border border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300 block">
                  {isBn ? 'ডেসক্রিপশন সেকশন কাস্টমাইজ:' : 'Modular Description Sections:'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setDescOptions({
                      ...descOptions,
                      mode: 'clean',
                      includeHook: false,
                      includeVirtues: false,
                      includeCallToAction: false,
                    })
                  }
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  {isBn ? '↺ সাধারণ মোডে ফিরুন' : '↺ Back to Clean'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={descOptions.includeHook}
                    onChange={(e) => setDescOptions({ ...descOptions, includeHook: e.target.checked })}
                    className="w-3.5 h-3.5 accent-red-600 rounded cursor-pointer"
                  />
                  <span>{isBn ? 'সূচনা / ইন্ট্রো' : 'Intro Hook & Summary'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={descOptions.includeVirtues}
                    onChange={(e) => setDescOptions({ ...descOptions, includeVirtues: e.target.checked })}
                    className="w-3.5 h-3.5 accent-red-600 rounded cursor-pointer"
                  />
                  <span>{isBn ? 'হাদিস ও ফজিলত' : 'Hadith & Surah Virtues'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={descOptions.includeTimestamps}
                    onChange={(e) => setDescOptions({ ...descOptions, includeTimestamps: e.target.checked })}
                    className="w-3.5 h-3.5 accent-red-600 rounded cursor-pointer"
                  />
                  <span>{isBn ? 'ভিডিও টাইমলাইন' : 'Video Chapters / Timestamps'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={descOptions.includeSurahMeta}
                    onChange={(e) => setDescOptions({ ...descOptions, includeSurahMeta: e.target.checked })}
                    className="w-3.5 h-3.5 accent-red-600 rounded cursor-pointer"
                  />
                  <span>{isBn ? 'সূরার মৌলিক তথ্য' : 'Surah Facts & Details'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={descOptions.includeReciterCredits}
                    onChange={(e) => setDescOptions({ ...descOptions, includeReciterCredits: e.target.checked })}
                    className="w-3.5 h-3.5 accent-red-600 rounded cursor-pointer"
                  />
                  <span>{isBn ? 'ক্বারী ও অনুবাদক' : 'Reciter & Translation Credits'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={descOptions.includeCallToAction}
                    onChange={(e) => setDescOptions({ ...descOptions, includeCallToAction: e.target.checked })}
                    className="w-3.5 h-3.5 accent-red-600 rounded cursor-pointer"
                  />
                  <span>{isBn ? 'শেয়ার / সদকা বার্তা' : 'Sadaqah Jariyah & CTA'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={descOptions.includeHashtags}
                    onChange={(e) => setDescOptions({ ...descOptions, includeHashtags: e.target.checked })}
                    className="w-3.5 h-3.5 accent-red-600 rounded cursor-pointer"
                  />
                  <span>{isBn ? 'হ্যাশট্যাগসমূহ' : 'YouTube Hashtags'}</span>
                </label>
              </div>
            </div>
          )}

          {/* Description Preview & Copy Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-200">
                {isBn ? 'ইউটিউবে পেস্ট করার জন্য প্রস্তুত ডেসক্রিপশন:' : 'Ready-to-Paste Description:'}
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
                    <span>{isBn ? 'ডেসক্রিপশন কপি হয়েছে!' : 'Copied Description!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isBn ? 'সম্পূর্ণ ডেসক্রিপশন কপি' : 'Copy Full Description'}</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              value={editableDescription}
              onChange={(e) => setEditableDescription(e.target.value)}
              rows={14}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-gray-200 font-mono leading-relaxed focus:ring-1 focus:ring-red-500 focus:outline-none resize-y selection:bg-red-600/30"
              placeholder={isBn ? 'আপনার ভিডিও ডেসক্রিপশন এখানে তৈরি হবে...' : 'Your video description will generate here...'}
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
            {isBn
              ? 'পরামর্শ: যেকোনো আয়াতে সরাসরি যেতে নিচের সারিতে ক্লিক করুন!'
              : 'Tip: Click any row below to jump the video player directly to that verse!'}
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
              <label className="text-xs font-semibold text-gray-300">
                {isBn ? 'সক্রিয় ভিডিও টাইটেল (সম্পাদনাযোগ্য):' : 'Active Video Title'}
              </label>
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
                    <span>{isBn ? 'কপি হয়েছে!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>{isBn ? 'টাইটেল কপি' : 'Copy'}</span>
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
              {isBn ? 'প্রস্তাবিত ৫টি মানসম্মত বাংলা টাইটেল:' : 'High-Converting YouTube Title Formulas:'}
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
                {isBn ? 'ইউটিউব ভিডিও ট্যাগসমূহ' : 'YouTube Video Tags'}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {tagsFormatted.length} / 500 {isBn ? 'অক্ষর ব্যবহৃত' : 'characters used'}
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
                  <span>{isBn ? 'ট্যাগ কপি হয়েছে!' : 'Copied Tags!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isBn ? 'সব ট্যাগ কপি' : 'Copy Tags'}</span>
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
            <span className="text-[11px] text-gray-400">
              {isBn ? 'কমা দ্বারা পৃথকীকৃত ট্যাগসমূহ (সরাসরি পেস্ট করার জন্য):' : 'Comma-separated raw string:'}
            </span>
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
