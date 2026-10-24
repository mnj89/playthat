/**
 * PlayThat! - Android Media Player & Stream Downloader
 * Monochromatic Black, White & Grey Edition.
 * Signature MX Player gesture controls, in-app Chromium browser with M3U8/MP4 converter,
 * UC-style turbo download manager, dedicated music player with background lockscreen playback,
 * custom subtitles, and AES-GCM encrypted private vault.
 */

import React, { useState, useEffect } from 'react';
import {
  Folder,
  Globe,
  ArrowDownToLine,
  ListMusic,
  Lock,
  Radio,
  CheckCircle,
  X,
  Play,
  Film,
  Sparkles,
  Settings,
  Music,
} from 'lucide-react';
import {
  MediaItem,
  SubtitleSettings,
  SubtitleTrack,
  Playlist,
  ActiveTab,
} from './types';
import {
  INITIAL_MEDIA_ITEMS,
  DEFAULT_SUBTITLE_SETTINGS,
} from './data/sampleMedia';
import { SAMPLE_SUBTITLES } from './services/subtitleParser';
import { downloadManager } from './services/downloadManagerService';
import { audioPlayerService, AudioPlayerState } from './services/audioPlayerService';
import { PlayThatIcon } from './components/PlayThatIcon';
import { AndroidFrame, FrameMode } from './components/AndroidFrame';
import { MXPlayer } from './components/MXPlayer';
import { FileBrowser } from './components/FileBrowser';
import { InAppBrowser } from './components/InAppBrowser';
import { UCDownloadManager } from './components/UCDownloadManager';
import { PlaylistManager } from './components/PlaylistManager';
import { PrivateVaultModal } from './components/PrivateVaultModal';
import { SubtitleCustomizerModal } from './components/SubtitleCustomizerModal';
import { EnhancementsModal, EnhancementConfig, DEFAULT_ENHANCEMENTS } from './components/EnhancementsModal';
import { SettingsView } from './components/SettingsView';
import { MiniMusicPlayer } from './components/MiniMusicPlayer';
import { MusicPlayerModal } from './components/MusicPlayerModal';

export default function App() {
  // Theme & Layout state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [frameMode, setFrameMode] = useState<FrameMode>('phone');
  const [activeTab, setActiveTab] = useState<ActiveTab>('folders');

  // Media Library state
  const [mediaList, setMediaList] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem('playthat_media_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_MEDIA_ITEMS;
      }
    }
    return INITIAL_MEDIA_ITEMS;
  });

  // Playlists state
  const [playlists, setPlaylists] = useState<Playlist[]>([
    {
      id: 'pl-1',
      title: 'Action & Sci-Fi Highlights',
      description: 'High-bitrate cinema demos with 4K HDR',
      mediaIds: ['media-2', 'media-3'],
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
    },
    {
      id: 'pl-2',
      title: 'Night Odyssey Grooves',
      description: 'Hi-Res synthwave and acoustic audio playlist',
      mediaIds: ['audio-1', 'audio-2', 'audio-3'],
      createdAt: Date.now() - 86400000 * 2,
      updatedAt: Date.now() - 86400000 * 2,
    },
  ]);

  // Active Video Player state
  const [activePlayingMedia, setActivePlayingMedia] = useState<MediaItem | null>(null);

  // Background Audio Player state
  const [audioPlayerState, setAudioPlayerState] = useState<AudioPlayerState>(audioPlayerService.getState());
  const [isFullMusicPlayerOpen, setIsFullMusicPlayerOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = audioPlayerService.subscribe((state) => {
      setAudioPlayerState(state);
    });
    return unsubscribe;
  }, []);

  // Subtitle state
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>(DEFAULT_SUBTITLE_SETTINGS);
  const [isSubtitleModalOpen, setIsSubtitleModalOpen] = useState<boolean>(false);
  const [availableSubtitleTracks, setAvailableSubtitleTracks] = useState<SubtitleTrack[]>(
    SAMPLE_SUBTITLES.default
  );
  const [activeSubtitleTrack, setActiveSubtitleTrack] = useState<SubtitleTrack | null>(
    SAMPLE_SUBTITLES.default[0]
  );

  // Vault state
  const [isVaultModalOpen, setIsVaultModalOpen] = useState<boolean>(false);

  // Audio & Video Enhancements & Font Scaling state
  const [enhancementConfig, setEnhancementConfig] = useState<EnhancementConfig>(DEFAULT_ENHANCEMENTS);
  const [isEnhancementsModalOpen, setIsEnhancementsModalOpen] = useState<boolean>(false);

  // Network Stream Dialog state
  const [isStreamDialogOpen, setIsStreamDialogOpen] = useState<boolean>(false);
  const [streamDialogUrl, setStreamDialogUrl] = useState<string>('');
  const [streamDialogTitle, setStreamDialogTitle] = useState<string>('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Download tasks listener for header badge
  const [activeDownloadCount, setActiveDownloadCount] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = downloadManager.subscribe((tasks) => {
      const active = tasks.filter((t) => t.status === 'downloading').length;
      setActiveDownloadCount(active);
    });
    return unsubscribe;
  }, []);

  // Persist library
  useEffect(() => {
    localStorage.setItem('playthat_media_items', JSON.stringify(mediaList));
  }, [mediaList]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Play media item (Handles audio vs video with background playback support)
  const handlePlayMedia = (item: MediaItem) => {
    const isAudio =
      item.mediaType === 'audio' ||
      item.folder === 'Music' ||
      item.url.endsWith('.mp3') ||
      item.url.endsWith('.wav') ||
      item.url.endsWith('.flac') ||
      item.url.endsWith('.m4a');

    if (isAudio) {
      const audioQueue = mediaList.filter(
        (m) =>
          (m.mediaType === 'audio' || m.folder === 'Music' || m.url.endsWith('.mp3')) &&
          !m.isEncrypted
      );
      audioPlayerService.playTrack(item, audioQueue);
      setIsFullMusicPlayerOpen(true);
    } else {
      // Pause background audio when video begins
      if (audioPlayerState.isPlaying) {
        audioPlayerService.pause();
      }
      setActivePlayingMedia(item);
    }
  };

  // Add downloaded or converted stream to library
  const handleSaveToLibrary = (item: MediaItem) => {
    setMediaList((prev) => [item, ...prev]);
    showToast(`Saved "${item.title}" to library!`);
  };

  // Local file import handler
  const handleImportLocalFile = (file: File) => {
    const fileUrl = URL.createObjectURL(file);
    const isAudio = file.type.startsWith('audio') || file.name.match(/\.(mp3|wav|ogg|flac|m4a|aac)$/i);
    const newItem: MediaItem = {
      id: `local-file-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      folder: isAudio ? 'Music' : 'Camera',
      mediaType: isAudio ? 'audio' : 'video',
      sourceType: 'local',
      url: fileUrl,
      thumbnailUrl: isAudio
        ? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'
        : 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80',
      duration: 180,
      currentTime: 0,
      resolution: isAudio ? '320 kbps MP3' : '1080p FHD',
      fileSize: file.size,
      codec: file.type || (isAudio ? 'Audio Stream' : 'MP4 Video'),
      decoder: 'HW',
      createdAt: Date.now(),
      isFavorite: false,
      isEncrypted: false,
    };

    setMediaList((prev) => [newItem, ...prev]);
    showToast(`Imported ${file.name}`);
    handlePlayMedia(newItem);
  };

  // Direct Network Stream Submit
  const handleStreamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamDialogUrl.trim()) return;

    const isAudio = streamDialogUrl.match(/\.(mp3|aac|flac|wav|ogg)$/i);
    const streamItem: MediaItem = {
      id: `stream-${Date.now()}`,
      title: streamDialogTitle.trim() || 'Network Live Stream',
      folder: isAudio ? 'Music' : 'Streams',
      mediaType: isAudio ? 'audio' : 'video',
      sourceType: 'stream',
      url: streamDialogUrl.trim(),
      thumbnailUrl:
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
      duration: 0,
      currentTime: 0,
      resolution: 'Stream Feed',
      fileSize: 0,
      codec: streamDialogUrl.includes('.m3u8') ? 'HLS H.264/AAC' : 'Direct Feed',
      decoder: 'HW+',
      createdAt: Date.now(),
      isFavorite: false,
      isEncrypted: false,
    };

    setMediaList((prev) => [streamItem, ...prev]);
    setIsStreamDialogOpen(false);
    setStreamDialogUrl('');
    setStreamDialogTitle('');
    handlePlayMedia(streamItem);
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string) => {
    setMediaList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
    );
  };

  // Delete media item
  const handleDeleteMedia = (id: string) => {
    setMediaList((prev) => prev.filter((item) => item.id !== id));
    showToast('Deleted item from library');
  };

  // Add item to private vault
  const handleAddToVault = (item: MediaItem) => {
    setMediaList((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, isEncrypted: true } : m))
    );
    showToast(`Encrypted & moved "${item.title}" to Private Vault`);
  };

  // Playlist handlers
  const handleCreatePlaylist = (title: string, description?: string) => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      title,
      description,
      mediaIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setPlaylists((prev) => [newPl, ...prev]);
    showToast(`Created playlist "${title}"`);
  };

  const handleDeletePlaylist = (id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    showToast('Playlist deleted');
  };

  const handleRemoveFromPlaylist = (playlistId: string, mediaId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          return {
            ...p,
            mediaIds: p.mediaIds.filter((id) => id !== mediaId),
            updatedAt: Date.now(),
          };
        }
        return p;
      })
    );
    showToast('Removed track from playlist');
  };

  // Add custom subtitle
  const handleAddCustomTrack = (track: SubtitleTrack) => {
    setAvailableSubtitleTracks((prev) => [...prev, track]);
    setActiveSubtitleTrack(track);
    showToast(`Loaded custom subtitle: ${track.label}`);
  };

  return (
    <div className={`dark font-scale-${enhancementConfig.fontScale} bg-black text-white min-h-screen`}>
      <AndroidFrame
        frameMode={frameMode}
        onFrameModeChange={setFrameMode}
        isPlayerActive={!!activePlayingMedia}
        onOpenFullMusicPlayer={() => setIsFullMusicPlayerOpen(true)}
      >
        {activePlayingMedia ? (
          /* Full MX Player Mode */
          <MXPlayer
            media={activePlayingMedia}
            onBack={() => setActivePlayingMedia(null)}
            subtitleSettings={subtitleSettings}
            onOpenSubtitleSettings={() => setIsSubtitleModalOpen(true)}
            activeSubtitleTrack={activeSubtitleTrack}
            onSelectSubtitleTrack={setActiveSubtitleTrack}
            availableSubtitleTracks={availableSubtitleTracks}
            enhancementConfig={enhancementConfig}
            onUpdateEnhancements={setEnhancementConfig}
          />
        ) : (
          /* Main Application Shell (Monochrome: Black, White, Grey) */
          <div className="flex-1 w-full flex flex-col bg-black text-white overflow-hidden">
            {/* Top Bar (Shown on Media, Browser, Downloads, Playlists) */}
            {activeTab !== 'settings' && (
              <header className="h-14 px-4 bg-zinc-950 border-b border-zinc-850 flex items-center justify-between gap-4 shrink-0 select-none">
                {/* Brand Wordmark & Icon */}
                <div className="flex items-center gap-2.5">
                  <PlayThatIcon size={30} />
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-black tracking-tight text-white">
                      PlayThat!
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-orange-400 border border-orange-500/30 font-bold">
                      PRO
                    </span>
                  </div>
                </div>

                {/* Right Zone Actions in Black, Grey & Orange */}
                <div className="flex items-center gap-1.5">
                  {/* Active Download Badge Trigger */}
                  <button
                    onClick={() => setActiveTab('downloads')}
                    className="relative p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-orange-400 transition-colors border border-zinc-800 hover:border-orange-500/40"
                    title="PlayThat! Download Manager"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    {activeDownloadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-black text-[9px] font-bold flex items-center justify-center shadow-sm">
                        {activeDownloadCount}
                      </span>
                    )}
                  </button>

                  {/* Audio & Video Enhancements & Font Scaling Studio */}
                  <button
                    onClick={() => setIsEnhancementsModalOpen(true)}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-orange-400 transition-colors border border-zinc-800 hover:border-orange-500/40"
                    title="Audio & Video Enhancements & System Font Size"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>

                  {/* Encrypted Vault Trigger */}
                  <button
                    onClick={() => setIsVaultModalOpen(true)}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-orange-400 transition-colors border border-zinc-800 hover:border-orange-500/40"
                    title="Open Private Vault"
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                </div>
              </header>
            )}

            {/* Active View Router */}
            <main className="flex-1 w-full overflow-hidden flex flex-col bg-black">
              {activeTab === 'folders' && (
                <FileBrowser
                  mediaItems={mediaList}
                  onPlayMedia={handlePlayMedia}
                  onOpenVault={() => setIsVaultModalOpen(true)}
                  onImportLocalFile={handleImportLocalFile}
                  onOpenStreamDialog={() => setIsStreamDialogOpen(true)}
                  onToggleFavorite={handleToggleFavorite}
                  onDeleteMedia={handleDeleteMedia}
                  onAddToVault={handleAddToVault}
                />
              )}

              {activeTab === 'browser' && (
                <InAppBrowser
                  onPlayMedia={handlePlayMedia}
                  onSaveToLibrary={handleSaveToLibrary}
                />
              )}

              {activeTab === 'downloads' && (
                <UCDownloadManager
                  onPlayMedia={handlePlayMedia}
                  onSaveToVault={handleAddToVault}
                />
              )}

              {activeTab === 'playlists' && (
                <PlaylistManager
                  playlists={playlists}
                  mediaItems={mediaList}
                  onCreatePlaylist={handleCreatePlaylist}
                  onDeletePlaylist={handleDeletePlaylist}
                  onPlayMedia={handlePlayMedia}
                  onRemoveFromPlaylist={handleRemoveFromPlaylist}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  onBack={() => setActiveTab('folders')}
                  isDarkMode={isDarkMode}
                  onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                  frameMode={frameMode}
                  onChangeFrameMode={setFrameMode}
                  enhancementConfig={enhancementConfig}
                  onUpdateEnhancements={setEnhancementConfig}
                  onOpenSubtitlesModal={() => setIsSubtitleModalOpen(true)}
                  onOpenVaultModal={() => setIsVaultModalOpen(true)}
                  onShowToast={showToast}
                />
              )}
            </main>

            {/* Docked Mini Music Player (Visible when music is playing in background) */}
            <MiniMusicPlayer
              state={audioPlayerState}
              onOpenFullPlayer={() => setIsFullMusicPlayerOpen(true)}
            />

            {/* Android Bottom Navigation Bar (5 Columns: Media, Browser, Downloads, Playlists, Settings) */}
            <nav className="h-16 px-1 bg-zinc-950 border-t border-zinc-850 grid grid-cols-5 items-center shrink-0 select-none z-30">
              <button
                onClick={() => setActiveTab('folders')}
                className={`relative flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px] ${
                  activeTab === 'folders' ? 'text-orange-500 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Folder className="w-5 h-5" />
                <span className="text-[10px] tracking-tight">Media</span>
                {activeTab === 'folders' && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-orange-500" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('browser')}
                className={`relative flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px] ${
                  activeTab === 'browser' ? 'text-orange-500 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Globe className="w-5 h-5" />
                <span className="text-[10px] tracking-tight">Browser</span>
                {activeTab === 'browser' && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-orange-500" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('downloads')}
                className={`relative flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px] ${
                  activeTab === 'downloads' ? 'text-orange-500 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <ArrowDownToLine className="w-5 h-5" />
                <span className="text-[10px] tracking-tight">Downloads</span>
                {activeDownloadCount > 0 && (
                  <span className="absolute top-1.5 right-3.5 w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                )}
                {activeTab === 'downloads' && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-orange-500" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('playlists')}
                className={`relative flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px] ${
                  activeTab === 'playlists' ? 'text-orange-500 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <ListMusic className="w-5 h-5" />
                <span className="text-[10px] tracking-tight">Playlists</span>
                {activeTab === 'playlists' && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-orange-500" />
                )}
              </button>

              {/* Settings Tab (Placed strictly after Playlists as requested) */}
              <button
                onClick={() => setActiveTab('settings')}
                className={`relative flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px] ${
                  activeTab === 'settings' ? 'text-orange-500 font-bold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="text-[10px] tracking-tight">Settings</span>
                {activeTab === 'settings' && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-orange-500" />
                )}
              </button>
            </nav>
          </div>
        )}

        {/* Dedicated Full Music Player Modal */}
        <MusicPlayerModal
          isOpen={isFullMusicPlayerOpen}
          onClose={() => setIsFullMusicPlayerOpen(false)}
          state={audioPlayerState}
          onOpenEnhancements={() => setIsEnhancementsModalOpen(true)}
          onToggleFavorite={handleToggleFavorite}
        />

        {/* Subtitle Customizer Modal */}
        <SubtitleCustomizerModal
          isOpen={isSubtitleModalOpen}
          onClose={() => setIsSubtitleModalOpen(false)}
          settings={subtitleSettings}
          onUpdateSettings={setSubtitleSettings}
          onAddCustomTrack={handleAddCustomTrack}
        />

        {/* Private Encrypted Vault Modal */}
        <PrivateVaultModal
          isOpen={isVaultModalOpen}
          onClose={() => setIsVaultModalOpen(false)}
          onPlayDecryptedMedia={handlePlayMedia}
          availableLibraryVideos={mediaList.filter((m) => !m.isEncrypted)}
        />

        {/* Network Stream URL Dialog in Monochrome */}
        {isStreamDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-white">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-white" />
                  <h4 className="text-sm font-bold text-white">Direct Network Stream</h4>
                </div>
                <button
                  onClick={() => setIsStreamDialogOpen(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleStreamSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-300">Stream URL (HLS / MP4 / Audio)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://.../stream.m3u8 or .mp4 or .mp3"
                    value={streamDialogUrl}
                    onChange={(e) => setStreamDialogUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-300">Title / Channel Name</label>
                  <input
                    type="text"
                    placeholder="e.g. 24/7 Wildlife Stream or Cyberpunk Teaser"
                    value={streamDialogTitle}
                    onChange={(e) => setStreamDialogTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 flex flex-col gap-1">
                  <span className="font-semibold text-zinc-300">Quick Test Streams:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStreamDialogUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
                      setStreamDialogTitle('Mux HLS Adaptive Test Feed');
                    }}
                    className="text-left text-zinc-300 hover:text-white hover:underline truncate"
                  >
                    • Mux HLS Big Buck Bunny (.m3u8)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStreamDialogUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
                      setStreamDialogTitle('SoundHelix Synthwave MP3 Audio');
                    }}
                    className="text-left text-zinc-300 hover:text-white hover:underline truncate"
                  >
                    • SoundHelix Synthwave Audio Feed (.mp3)
                  </button>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsStreamDialogOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-xs font-bold text-black shadow-md flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>Play Stream</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Audio & Video Enhancement & Font Scaling Studio Modal */}
        <EnhancementsModal
          isOpen={isEnhancementsModalOpen}
          onClose={() => setIsEnhancementsModalOpen(false)}
          config={enhancementConfig}
          onChange={setEnhancementConfig}
        />

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-zinc-900 text-white border border-zinc-700 rounded-full shadow-2xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <CheckCircle className="w-4 h-4 text-white" />
            <span>{toastMessage}</span>
          </div>
        )}
      </AndroidFrame>
    </div>
  );
}
