import React, { useState, useEffect } from 'react';
import {
  Download,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Plus,
  Zap,
  CheckCircle2,
  FileVideo,
  X,
  ExternalLink,
  Shield,
  FolderDown,
  Layers,
  ArrowDownToLine,
} from 'lucide-react';
import { downloadManager } from '../services/downloadManagerService';
import { DownloadTask, MediaItem } from '../types';

interface UCDownloadManagerProps {
  onPlayMedia: (item: MediaItem) => void;
  onSaveToVault?: (item: MediaItem) => void;
}

export const UCDownloadManager: React.FC<UCDownloadManagerProps> = ({
  onPlayMedia,
  onSaveToVault,
}) => {
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const [activeTab, setActiveTab] = useState<'downloading' | 'completed'>('downloading');
  const [turboMode, setTurboMode] = useState<boolean>(downloadManager.isTurboMode());
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newUrlInput, setNewUrlInput] = useState<string>('');
  const [newTitleInput, setNewTitleInput] = useState<string>('');
  const [savePathInput, setSavePathInput] = useState<string>('/Internal Storage/Download/PlayThat/');

  useEffect(() => {
    const unsubscribe = downloadManager.subscribe((updatedTasks) => {
      setTasks(updatedTasks);
    });
    return unsubscribe;
  }, []);

  const downloadingTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const formatBytes = (bytes: number) => {
    if (bytes === 0 || isNaN(bytes)) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec <= 0 || isNaN(bytesPerSec)) return '0 KB/s';
    return `${formatBytes(bytesPerSec)}/s`;
  };

  const handleToggleTurbo = () => {
    const next = !turboMode;
    setTurboMode(next);
    downloadManager.setTurboMode(next);
  };

  const handleAddNewDownload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrlInput.trim()) return;

    const url = newUrlInput.trim();
    const type = url.includes('.m3u8') ? 'm3u8' : 'mp4';
    const defaultTitle = url.substring(url.lastIndexOf('/') + 1) || `Media_${Date.now()}.${type}`;
    const title = newTitleInput.trim() || defaultTitle;

    downloadManager.addDownload(url, title, savePathInput);

    setNewUrlInput('');
    setNewTitleInput('');
    setShowAddModal(false);
  };

  const handlePlayCompleted = (task: DownloadTask) => {
    const item: MediaItem = {
      id: `downloaded-${task.id}`,
      title: task.title,
      folder: 'Downloads',
      sourceType: 'downloaded',
      url: task.outputBlobUrl || task.url,
      thumbnailUrl:
        task.thumbnailUrl ||
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
      duration: task.duration || 120,
      currentTime: 0,
      resolution: 'Downloaded',
      fileSize: task.totalBytes || 10000000,
      codec: task.type === 'm3u8' ? 'HLS / Remuxed MP4' : 'MP4 Direct',
      decoder: 'HW',
      createdAt: task.completedAt || Date.now(),
      isFavorite: false,
      isEncrypted: false,
    };
    onPlayMedia(item);
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-black text-white overflow-hidden">
      {/* Top Header Banner in Monochrome */}
      <div className="p-4 bg-zinc-950 border-b border-zinc-850 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <ArrowDownToLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                PlayThat! Download Manager
              </h3>
              <span className="text-[10px] font-mono text-zinc-400">
                UC Turbo Acceleration Engine · Multi-Chunk Fetcher
              </span>
            </div>
          </div>

          {/* UC Turbo Boost Toggle Button */}
          <button
            onClick={handleToggleTurbo}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              turboMode
                ? 'bg-orange-500 text-black font-bold ring-2 ring-orange-500/30 shadow-orange-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
            title="Toggle UC Cloud Acceleration Engine"
          >
            <Zap className={`w-3.5 h-3.5 ${turboMode ? 'fill-black' : ''}`} />
            <span>Turbo Boost: {turboMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Tab Buttons & New Action */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('downloading')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'downloading'
                  ? 'bg-orange-500 text-black font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Downloading</span>
              {downloadingTasks.length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] bg-black/40 text-black rounded-full font-mono font-bold">
                  {downloadingTasks.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'completed'
                  ? 'bg-orange-500 text-black font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Completed</span>
              {completedTasks.length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] bg-zinc-800 text-zinc-300 rounded-full font-mono">
                  {completedTasks.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add URL</span>
          </button>
        </div>
      </div>

      {/* Task List Container */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {activeTab === 'downloading' ? (
          downloadingTasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3 text-zinc-500">
              <FolderDown className="w-12 h-12 text-zinc-700" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">No active downloads</span>
                <span className="text-xs text-zinc-400 mt-1 max-w-xs">
                  Download MP4 movies, music videos, or HLS stream captures directly using the browser or Add URL button.
                </span>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-200 border border-zinc-800 transition-colors"
              >
                Start New Download
              </button>
            </div>
          ) : (
            downloadingTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-2xl bg-zinc-950 border border-zinc-850 shadow-md flex flex-col gap-3 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-white">
                      <FileVideo className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate max-w-xs">
                        {task.title}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {task.type.toUpperCase()} · {task.savePath || '/PlayThat/Downloads'}
                      </span>
                    </div>
                  </div>

                  {/* Task Control Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {task.status === 'downloading' ? (
                      <button
                        onClick={() => downloadManager.pauseDownload(task.id)}
                        className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors border border-zinc-800"
                        title="Pause"
                      >
                        <Pause className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => downloadManager.resumeDownload(task.id)}
                        className="p-2 rounded-xl bg-white text-black hover:bg-zinc-200 transition-colors font-bold"
                        title="Resume"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                      </button>
                    )}
                    <button
                      onClick={() => downloadManager.cancelDownload(task.id)}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-zinc-800"
                      title="Cancel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Stats */}
                <div className="flex flex-col gap-1.5">
                  <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${
                        task.status === 'paused' ? 'bg-zinc-500' : 'bg-orange-500 shadow-sm shadow-orange-500/50'
                      }`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span>
                      {formatBytes(task.downloadedBytes)} / {formatBytes(task.totalBytes)} ({task.progress}%)
                    </span>
                    <span className="font-semibold text-white">
                      {task.status === 'paused' ? 'PAUSED' : formatSpeed(task.speedBytesPerSec)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )
        ) : completedTasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3 text-zinc-500">
            <CheckCircle2 className="w-12 h-12 text-zinc-700" />
            <span className="text-sm font-semibold text-white">No completed downloads</span>
            <span className="text-xs text-zinc-400 max-w-xs">
              Finished videos will appear here with instant offline playback and private vault encryption.
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-semibold text-zinc-400 uppercase">
                Finished Files ({completedTasks.length})
              </span>
              <button
                onClick={() => downloadManager.clearCompleted()}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Clear History
              </button>
            </div>

            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-2xl bg-zinc-950 border border-zinc-850 shadow-sm flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-orange-400">
                    <CheckCircle2 className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate max-w-xs">
                      {task.title}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {formatBytes(task.totalBytes)} · {task.type.toUpperCase()} · {task.savePath || '/PlayThat/Downloads'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handlePlayCompleted(task)}
                    className="px-3.5 py-1.5 rounded-xl bg-orange-500 text-black hover:bg-orange-400 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>Play</span>
                  </button>

                  <a
                    href={task.outputBlobUrl || task.url}
                    download={task.title}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors border border-zinc-800"
                    title="Save to Device"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Download Modal in Monochrome */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-white" />
                <h4 className="text-sm font-bold text-white">Direct MP4 / M3U8 Downloader</h4>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewDownload} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-300">Video / Stream URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://.../video.mp4 or .m3u8"
                  value={newUrlInput}
                  onChange={(e) => setNewUrlInput(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-300">File Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Inception_1080p.mp4"
                  value={newTitleInput}
                  onChange={(e) => setNewTitleInput(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-300">Storage Save Path</label>
                <input
                  type="text"
                  value={savePathInput}
                  onChange={(e) => setSavePathInput(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-xs font-bold text-black shadow-md flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
