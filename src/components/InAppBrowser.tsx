import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Search,
  Globe,
  Download,
  Play,
  CheckCircle2,
  AlertCircle,
  Radio,
  FileVideo,
  X,
  Compass,
  Plus,
  Layers,
  Copy,
  Trash2,
} from 'lucide-react';
import { SAMPLE_STREAM_BOOKMARKS } from '../data/sampleMedia';
import { sniffMediaStreams, downloadM3U8Stream } from '../services/m3u8Downloader';
import { downloadManager } from '../services/downloadManagerService';
import { DownloadPromptModal, DownloadPromptData } from './DownloadPromptModal';
import { M3U8DownloadTask, MediaItem } from '../types';

const MAX_TABS = 40;

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  detectedStreams: Array<{ url: string; type: string; label: string }>;
  createdAt: number;
}

interface InAppBrowserProps {
  onPlayMedia: (item: MediaItem) => void;
  onSaveToLibrary: (item: MediaItem) => void;
}

export const InAppBrowser: React.FC<InAppBrowserProps> = ({
  onPlayMedia,
  onSaveToLibrary,
}) => {
  // Tabs management state (up to 40 tabs)
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: 'tab-1',
      title: 'Mux HLS Test Feed',
      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      detectedStreams: [
        {
          url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          type: 'm3u8',
          label: 'Mux HLS Adaptive Stream (Big Buck Bunny)',
        },
      ],
      createdAt: Date.now(),
    },
    {
      id: 'tab-2',
      title: 'Tears of Steel 1080p',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      detectedStreams: [
        {
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
          type: 'mp4',
          label: 'Tears of Steel Direct MP4 1080p',
        },
      ],
      createdAt: Date.now() - 1000,
    },
  ]);

  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [showTabGrid, setShowTabGrid] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>(tabs[0]?.url || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tabLimitAlert, setTabLimitAlert] = useState<string | null>(null);

  // Active Download State
  const [activeDownloadTask, setActiveDownloadTask] = useState<M3U8DownloadTask | null>(null);
  const [completedItem, setCompletedItem] = useState<MediaItem | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Download Confirmation Modal state
  const [isPromptOpen, setIsPromptOpen] = useState<boolean>(false);
  const [pendingPromptData, setPendingPromptData] = useState<DownloadPromptData | null>(null);

  const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleSwitchTab = (tabId: string) => {
    const target = tabs.find((t) => t.id === tabId);
    if (target) {
      setActiveTabId(tabId);
      setUrlInput(target.url);
      setShowTabGrid(false);
    }
  };

  const handleNewTab = (newUrl: string = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8') => {
    if (tabs.length >= MAX_TABS) {
      setTabLimitAlert(`Maximum tab limit reached (${MAX_TABS} tabs). Close an existing tab to open another.`);
      setTimeout(() => setTabLimitAlert(null), 4000);
      return;
    }

    const detected = sniffMediaStreams(newUrl);
    const titleCandidate = newUrl.replace(/^https?:\/\//, '').split('/')[0] || 'New Tab';
    const newTab: BrowserTab = {
      id: `tab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: titleCandidate,
      url: newUrl,
      detectedStreams: detected,
      createdAt: Date.now(),
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setUrlInput(newUrl);
    setShowTabGrid(false);
  };

  const handleCloseTab = (tabId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (tabs.length <= 1) {
      const resetTab: BrowserTab = {
        id: `tab-${Date.now()}`,
        title: 'New Tab',
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        detectedStreams: sniffMediaStreams('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'),
        createdAt: Date.now(),
      };
      setTabs([resetTab]);
      setActiveTabId(resetTab.id);
      setUrlInput(resetTab.url);
      return;
    }

    const nextTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(nextTabs);

    if (activeTabId === tabId) {
      const fallback = nextTabs[nextTabs.length - 1];
      setActiveTabId(fallback.id);
      setUrlInput(fallback.url);
    }
  };

  const handleNavigate = (targetUrl: string) => {
    setIsLoading(true);
    let finalUrl = targetUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = 'https://' + finalUrl;
      } else {
        finalUrl = `https://duckduckgo.com/?q=${encodeURIComponent(finalUrl)}`;
      }
    }

    setUrlInput(finalUrl);

    setTimeout(() => {
      const detected = sniffMediaStreams(finalUrl);
      const urlHost = finalUrl.replace(/^https?:\/\//, '').split('/')[0] || 'Page';

      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                url: finalUrl,
                title: urlHost,
                detectedStreams: detected,
              }
            : t
        )
      );

      setIsLoading(false);
    }, 450);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    handleNavigate(urlInput);
  };

  const handleTriggerDownloadPrompt = (streamUrl: string, streamLabel: string, streamType: string) => {
    const rawFileName = streamLabel.replace(/[^\w\s.-]/g, '_').replace(/\s+/g, '_');
    const extension = streamType === 'm3u8' ? '.mp4' : streamType === 'mp4' ? '.mp4' : '.mp4';
    const fullFileName = rawFileName.endsWith('.mp4') ? rawFileName : `${rawFileName}${extension}`;

    setPendingPromptData({
      url: streamUrl,
      title: streamLabel,
      defaultFileName: fullFileName,
      defaultSavePath: '/Internal Storage/Download/PlayThat/',
      type: streamType,
      estimatedSize: '48.2 MB',
      resolution: '1080p FHD (Remuxed)',
    });
    setIsPromptOpen(true);
  };

  const handleConfirmDownloadPrompt = ({
    title,
    savePath,
    url,
  }: {
    title: string;
    savePath: string;
    url: string;
  }) => {
    startDownloadAndConvert(url, title, savePath);
  };

  const startDownloadAndConvert = async (
    streamUrl: string,
    streamLabel: string,
    savePath: string = '/Internal Storage/Stream Captures/'
  ) => {
    const controller = new AbortController();
    setAbortController(controller);
    setCompletedItem(null);

    downloadManager.addDownload(streamUrl, streamLabel, savePath);

    try {
      const res = await downloadM3U8Stream(
        streamUrl,
        streamLabel,
        (task) => {
          task.savePath = savePath;
          setActiveDownloadTask(task);
        },
        controller.signal
      );

      const folderName = savePath.split('/').filter(Boolean).pop() || 'Stream Captures';

      const newItem: MediaItem = {
        id: `m3u8-dl-${Date.now()}`,
        title: streamLabel || 'Converted HLS Stream',
        folder: folderName,
        sourceType: 'downloaded',
        url: res.blobUrl,
        thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
        duration: res.duration || 60,
        currentTime: 0,
        resolution: '1080p Remuxed',
        fileSize: res.size,
        codec: 'MP4 / H.264 AAC',
        decoder: 'HW',
        createdAt: Date.now(),
        isFavorite: false,
        isEncrypted: false,
      };

      setCompletedItem(newItem);
      onSaveToLibrary(newItem);
    } catch (err: any) {
      console.error('Download error:', err);
    }
  };

  const cancelDownload = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setActiveDownloadTask(null);
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-black text-white overflow-hidden relative">
      {/* Tab Limit Alert Toast */}
      {tabLimitAlert && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-zinc-900 text-white rounded-full text-xs font-semibold shadow-2xl border border-zinc-700 animate-in fade-in duration-200">
          {tabLimitAlert}
        </div>
      )}

      {/* Chromium Desktop/Tablet Horizontal Tab Strip (Monochrome) */}
      <div className="bg-zinc-950 px-2 pt-2 border-b border-zinc-850 flex items-center justify-between gap-2 shrink-0 select-none">
        <div className="flex items-center gap-1 overflow-x-auto flex-1 pb-1 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => handleSwitchTab(tab.id)}
                className={`group max-w-[170px] min-w-[100px] h-9 px-3 rounded-t-xl text-xs flex items-center justify-between gap-1.5 cursor-pointer transition-all border-t border-x shrink-0 ${
                  isActive
                    ? 'bg-zinc-900 text-orange-400 border-orange-500/40 font-bold shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border-transparent hover:bg-zinc-900/40'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Globe className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-orange-400' : 'text-zinc-500'}`} />
                  <span className="truncate">{tab.title}</span>
                </div>
                <button
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  className="p-0.5 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white shrink-0"
                  title="Close tab"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* New Tab Button */}
          <button
            onClick={() => handleNewTab()}
            disabled={tabs.length >= MAX_TABS}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors border border-zinc-800 shrink-0 disabled:opacity-40"
            title={tabs.length >= MAX_TABS ? 'Maximum 40 tabs reached' : 'Open new tab'}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Android Tab Grid Switcher Button */}
        <div className="flex items-center gap-1.5 shrink-0 pb-1">
          <button
            onClick={() => setShowTabGrid(!showTabGrid)}
            className="h-8 px-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-white flex items-center gap-1 transition-colors shadow-sm"
            title="Tab Switcher Overview (up to 40 tabs)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{tabs.length}</span>
            <span className="text-[10px] text-zinc-500 font-normal">/{MAX_TABS}</span>
          </button>
        </div>
      </div>

      {/* Chromium App Bar & Omnibox */}
      <div className="p-3 bg-zinc-950 border-b border-zinc-850 flex flex-col gap-2 shrink-0">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="flex items-center text-zinc-400 shrink-0">
            <button
              type="button"
              className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
              title="Forward"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleNavigate(currentTab?.url || urlInput)}
              className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
              title="Refresh"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Omnibox URL Field */}
          <div className="flex-1 relative flex items-center">
            <Globe className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter stream link, M3U8 URL, or search..."
              className="w-full pl-9 pr-8 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors shadow-inner"
            />
            {urlInput && (
              <button
                type="button"
                onClick={() => setUrlInput('')}
                className="absolute right-2.5 p-0.5 rounded-full hover:bg-zinc-800 text-zinc-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs font-bold transition-colors shadow-sm shrink-0"
          >
            Sniff & Go
          </button>
        </form>

        {/* Quick Stream Bookmarks */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
          <span className="text-[10px] font-mono uppercase text-zinc-500 shrink-0 mr-1 flex items-center gap-1">
            <Compass className="w-3 h-3 text-zinc-400" />
            Stream Hub:
          </span>
          {SAMPLE_STREAM_BOOKMARKS.map((bm, idx) => (
            <button
              key={idx}
              onClick={() => handleNavigate(bm.url)}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5"
            >
              <span>{bm.title}</span>
              <span className="text-[9px] px-1 py-0.2 bg-zinc-800 text-zinc-300 rounded font-mono">
                {bm.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Active Stream Sniffer Banner for Current Tab */}
        {currentTab?.detectedStreams && currentTab.detectedStreams.length > 0 && (
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  Media Stream Sniffer Active (Tab {tabs.findIndex((t) => t.id === activeTabId) + 1})
                </span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                {currentTab.detectedStreams.length} stream(s) ready
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {currentTab.detectedStreams.map((st, i) => (
                <div
                  key={i}
                  className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-white">
                      <FileVideo className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-white truncate">
                        {st.label}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 truncate max-w-xs">
                        {st.url}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        onPlayMedia({
                          id: `stream-${Date.now()}`,
                          title: st.label,
                          folder: 'Stream Captures',
                          sourceType: 'stream',
                          url: st.url,
                          thumbnailUrl:
                            'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
                          duration: 300,
                          currentTime: 0,
                          resolution: 'HLS Live Stream',
                          fileSize: 150000000,
                          codec: 'HLS / AAC',
                          decoder: 'HW',
                          createdAt: Date.now(),
                          isFavorite: true,
                          isEncrypted: false,
                        })
                      }
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center gap-1.5 border border-zinc-700 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Play Stream</span>
                    </button>

                    <button
                      onClick={() => handleTriggerDownloadPrompt(st.url, st.label, st.type)}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-orange-500 text-black hover:bg-orange-400 flex items-center gap-1.5 transition-colors shadow-md shadow-orange-500/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download as MP4</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Download & Remuxing Progress */}
        {activeDownloadTask && (
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-white animate-bounce" />
                <h4 className="text-sm font-bold text-white">
                  M3U8 to MP4 Segment Remuxer
                </h4>
              </div>
              {activeDownloadTask.status === 'completed' ? (
                <span className="text-xs font-medium text-white flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Completed
                </span>
              ) : activeDownloadTask.status === 'error' ? (
                <span className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Download Failed
                </span>
              ) : (
                <button
                  onClick={cancelDownload}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="text-xs text-zinc-300 font-medium truncate">
              {activeDownloadTask.title}
            </div>

            {/* Progress Bar */}
            <div className="flex flex-col gap-1.5">
              <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                <div
                  className="h-full bg-white rounded-full transition-all duration-200"
                  style={{
                    width: `${
                      activeDownloadTask.totalSegments > 0
                        ? Math.min(
                            100,
                            (activeDownloadTask.downloadedSegments /
                              activeDownloadTask.totalSegments) *
                              100
                          )
                        : 5
                    }%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>
                  {activeDownloadTask.status === 'muxing'
                    ? 'Packaging TS chunks into MP4 container...'
                    : activeDownloadTask.status === 'completed'
                    ? 'MP4 conversion ready & verified'
                    : `Segment ${activeDownloadTask.downloadedSegments} / ${activeDownloadTask.totalSegments}`}
                </span>
                <span>
                  {activeDownloadTask.speedKbps > 0 && `${activeDownloadTask.speedKbps} KB/s`}
                </span>
              </div>
            </div>

            {/* Completion Actions */}
            {completedItem && (
              <div className="flex items-center gap-3 pt-2 border-t border-zinc-850">
                <button
                  onClick={() => onPlayMedia(completedItem)}
                  className="flex-1 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Play Converted MP4</span>
                </button>
                <a
                  href={completedItem.url}
                  download={`${completedItem.title.replace(/\s+/g, '_')}.mp4`}
                  className="py-2 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-zinc-800"
                >
                  <Download className="w-4 h-4" />
                  <span>Save to File</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Embedded Web View Placeholder */}
        <div className="flex-1 min-h-[350px] bg-zinc-950 rounded-2xl border border-zinc-850 p-6 flex flex-col items-center justify-center text-center gap-3">
          <Globe className="w-12 h-12 text-zinc-700" />
          <h4 className="text-sm font-bold text-white">Chromium Engine Web Canvas</h4>
          <p className="text-xs text-zinc-400 max-w-md">
            Currently loaded: <span className="font-mono text-white">{currentTab?.url}</span>
          </p>
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 max-w-sm">
            HLS (.m3u8) video and audio streams are automatically sniffed from web traffic and presented in the sniffer banner above.
          </div>
        </div>
      </div>

      {/* Android Tab Grid Switcher Modal (Up to 40 Tabs) */}
      {showTabGrid && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl p-4 flex flex-col justify-between animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-850">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-white" />
              <h3 className="text-base font-bold text-white">
                Tabs ({tabs.length}/{MAX_TABS})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNewTab()}
                disabled={tabs.length >= MAX_TABS}
                className="px-3 py-1.5 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
                <span>New Tab</span>
              </button>
              <button
                onClick={() => setShowTabGrid(false)}
                className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-4">
            {tabs.map((tab, idx) => {
              const isSelected = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  onClick={() => handleSwitchTab(tab.id)}
                  className={`relative p-3 rounded-2xl border flex flex-col justify-between h-36 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-zinc-900 border-zinc-500 shadow-xl ring-2 ring-white/20'
                      : 'bg-zinc-950 border-zinc-850 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[10px] font-mono text-zinc-500">#{idx + 1}</span>
                    <button
                      onClick={(e) => handleCloseTab(tab.id, e)}
                      className="p-1 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-white truncate">{tab.title}</span>
                    <span className="text-[10px] font-mono text-zinc-400 truncate">{tab.url}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>{tab.detectedStreams.length} stream(s)</span>
                    {isSelected && <span className="text-white font-bold">Active</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={() => setShowTabGrid(false)}
              className="px-6 py-2 rounded-xl bg-zinc-900 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Manual Download & Path Confirmation Dialog */}
      {isPromptOpen && pendingPromptData && (
        <DownloadPromptModal
          isOpen={isPromptOpen}
          data={pendingPromptData}
          onClose={() => setIsPromptOpen(false)}
          onConfirm={handleConfirmDownloadPrompt}
        />
      )}
    </div>
  );
};
