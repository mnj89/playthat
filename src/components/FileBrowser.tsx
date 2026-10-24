import React, { useState } from 'react';
import {
  Folder,
  Film,
  Play,
  Search,
  Upload,
  Radio,
  Lock,
  Heart,
  MoreVertical,
  LayoutGrid,
  List,
  Trash2,
  X,
  Music,
} from 'lucide-react';
import { MediaItem } from '../types';

interface FileBrowserProps {
  mediaItems: MediaItem[];
  onPlayMedia: (item: MediaItem) => void;
  onOpenVault: () => void;
  onImportLocalFile: (file: File) => void;
  onOpenStreamDialog: () => void;
  onToggleFavorite: (id: string) => void;
  onDeleteMedia: (id: string) => void;
  onAddToVault: (item: MediaItem) => void;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({
  mediaItems,
  onPlayMedia,
  onOpenVault,
  onImportLocalFile,
  onOpenStreamDialog,
  onToggleFavorite,
  onDeleteMedia,
  onAddToVault,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'video' | 'audio'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'duration'>('date');
  const [selectedActionMedia, setSelectedActionMedia] = useState<MediaItem | null>(null);

  // Calculate unique folders and counts
  const folders = Array.from(new Set(mediaItems.map((m) => m.folder))).filter(Boolean);

  // Filter media
  const filteredMedia = mediaItems
    .filter((item) => {
      if (item.isEncrypted) return false;
      const matchesFolder = selectedFolder === 'All' || item.folder === selectedFolder;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const isAudio = item.mediaType === 'audio' || item.folder === 'Music';
      const matchesType =
        mediaTypeFilter === 'all' ||
        (mediaTypeFilter === 'audio' && isAudio) ||
        (mediaTypeFilter === 'video' && !isAudio);
      return matchesFolder && matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      if (sortBy === 'size') return b.fileSize - a.fileSize;
      if (sortBy === 'duration') return b.duration - a.duration;
      return b.createdAt - a.createdAt;
    });

  const formatDuration = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const s = Math.floor(seconds);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportLocalFile(file);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-black text-white overflow-hidden">
      {/* Top Action Toolbar (Black, Grey & Orange) */}
      <div className="p-3 bg-zinc-950 border-b border-zinc-850 flex flex-col gap-2.5 shrink-0">
        {/* Row 1: Complete Line Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search media by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-9 bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-2xl text-xs text-white placeholder:text-zinc-500 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Row 2: Actions & View Controls Strip */}
        <div className="flex items-center justify-between gap-2">
          {/* Quick Import & Stream Actions */}
          <div className="flex items-center gap-1.5">
            <label
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 hover:border-orange-500/50 text-zinc-200 cursor-pointer transition-colors border border-zinc-800 flex items-center gap-1.5 text-xs font-semibold hover:text-orange-400"
              title="Open file from device"
            >
              <Upload className="w-3.5 h-3.5 text-orange-400" />
              <span>Open File</span>
              <input
                type="file"
                accept="video/*,audio/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </label>

            <button
              onClick={onOpenStreamDialog}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 hover:border-orange-500/50 text-zinc-200 transition-colors border border-zinc-800 flex items-center gap-1.5 text-xs font-semibold hover:text-orange-400"
              title="Stream Network URL"
            >
              <Radio className="w-3.5 h-3.5 text-orange-400" />
              <span>Stream URL</span>
            </button>
          </div>

          {/* Sort Selector & View Mode Toggle */}
          <div className="flex items-center gap-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-900 text-zinc-300 text-[11px] font-medium border border-zinc-800 rounded-xl px-2 py-1.5 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="date">Latest</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="duration">Duration</option>
            </select>

            <div className="flex items-center bg-zinc-900 rounded-xl p-0.5 border border-zinc-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-orange-500 text-black font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-orange-500 text-black font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 3: Media Type Filter Strip: All / Videos / Music */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setMediaTypeFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              mediaTypeFilter === 'all'
                ? 'bg-orange-500 text-black font-bold shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setMediaTypeFilter('video')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mediaTypeFilter === 'video'
                ? 'bg-orange-500 text-black font-bold shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Videos</span>
          </button>
          <button
            onClick={() => setMediaTypeFilter('audio')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mediaTypeFilter === 'audio'
                ? 'bg-orange-500 text-black font-bold shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Music & Audio</span>
          </button>
        </div>

        {/* Row 4: Horizontal Folder Scroller */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
          <button
            onClick={() => setSelectedFolder('All')}
            className={`px-3 py-1 rounded-xl whitespace-nowrap shrink-0 transition-colors font-medium ${
              selectedFolder === 'All'
                ? 'bg-zinc-800 text-orange-400 border border-orange-500/40 font-semibold'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            All Folders ({mediaItems.filter((m) => !m.isEncrypted).length})
          </button>

          {folders.map((fName) => {
            const count = mediaItems.filter((m) => m.folder === fName && !m.isEncrypted).length;
            const isSel = selectedFolder === fName;
            return (
              <button
                key={fName}
                onClick={() => setSelectedFolder(fName)}
                className={`px-3 py-1 rounded-xl whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 font-medium ${
                  isSel
                    ? 'bg-zinc-800 text-orange-400 border border-orange-500/40 font-semibold'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <Folder className={`w-3.5 h-3.5 ${isSel ? 'text-orange-400' : 'text-zinc-400'}`} />
                <span>{fName}</span>
                <span className="text-[10px] text-zinc-500 font-mono">({count})</span>
              </button>
            );
          })}

          {/* Encrypted Vault Entry Pill */}
          <button
            onClick={onOpenVault}
            className="px-3 py-1 rounded-xl whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 font-semibold bg-zinc-900 text-zinc-200 border border-zinc-700 hover:border-orange-500/50 hover:text-orange-400"
          >
            <Lock className="w-3.5 h-3.5 text-orange-400" />
            <span>Private Vault</span>
          </button>
        </div>
      </div>

      {/* Main Video & Audio Grid / List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredMedia.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-3 text-zinc-500">
            <Film className="w-12 h-12 text-zinc-700" />
            <span className="text-sm font-semibold text-white">No media files found</span>
            <span className="text-xs text-zinc-400 max-w-xs">
              Open a local video or audio file from your device, or stream a link.
            </span>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View in Monochrome */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                onClick={() => onPlayMedia(item)}
                className="group relative bg-zinc-950 border border-zinc-850 hover:border-zinc-700 rounded-2xl shadow-md cursor-pointer transition-all hover:scale-[1.01] flex flex-col"
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-video w-full bg-black rounded-t-2xl overflow-hidden">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  {/* Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-orange-500 text-black flex items-center justify-center shadow-lg shadow-orange-500/30 transform group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-black translate-x-0.5" />
                    </div>
                  </div>

                  {/* Duration Pill */}
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 border border-zinc-800 text-[10px] font-mono font-bold text-white tracking-wide">
                    {formatDuration(item.duration)}
                  </div>

                  {/* Resolution & Decoder Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    {item.mediaType === 'audio' || item.folder === 'Music' ? (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-900/90 border border-orange-500/40 text-[9px] font-mono font-bold text-orange-400 flex items-center gap-1">
                        <Music className="w-2.5 h-2.5 text-orange-400" />
                        <span>AUDIO</span>
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-900/90 border border-zinc-700 text-[9px] font-mono font-bold text-zinc-200">
                        {item.resolution}
                      </span>
                    )}
                    <span className="px-1 py-0.5 rounded bg-black/80 border border-zinc-800 text-[9px] font-mono text-zinc-400">
                      {item.decoder}
                    </span>
                  </div>

                  {/* Favorite indicator */}
                  {item.isFavorite && (
                    <div className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-orange-500">
                      <Heart className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                    </div>
                  )}

                  {/* Watch progress bar */}
                  {item.currentTime > 0 && item.duration > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                      <div
                        className="h-full bg-orange-500"
                        style={{ width: `${(item.currentTime / item.duration) * 100}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Details Footer */}
                <div className="p-3 flex items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate group-hover:text-orange-400 transition-colors">
                      {item.title}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-0.5">
                      <span>{item.artist || item.codec}</span>
                      <span>·</span>
                      <span>{formatFileSize(item.fileSize)}</span>
                    </div>
                  </div>

                  {/* Card Actions Menu */}
                  <div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedActionMedia(item);
                      }}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                      title="File Options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="flex flex-col gap-2">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                onClick={() => onPlayMedia(item)}
                className="group p-2.5 rounded-2xl bg-zinc-950 border border-zinc-850 hover:border-zinc-700 flex items-center justify-between gap-3 cursor-pointer transition-all hover:bg-zinc-900"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-20 h-12 rounded-xl bg-black overflow-hidden shrink-0 border border-zinc-800">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 rounded text-[9px] font-mono text-white">
                      {formatDuration(item.duration)}
                    </div>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-white truncate group-hover:text-orange-400 transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {item.artist || item.folder} · {item.resolution} · {formatFileSize(item.fileSize)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayMedia(item);
                    }}
                    className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-400 text-black flex items-center justify-center shadow-md shadow-orange-500/20 transition-transform active:scale-95"
                    title="Play Media"
                  >
                    <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedActionMedia(item);
                    }}
                    className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    title="More Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Media Action Sheet / Full Unclipped Options Menu */}
      {selectedActionMedia && (
        <div
          onClick={() => setSelectedActionMedia(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-zinc-950 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-zinc-200"
          >
            {/* Header / Media Summary */}
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-850">
              <div className="relative w-16 h-12 rounded-xl bg-black overflow-hidden shrink-0 border border-zinc-800">
                <img
                  src={selectedActionMedia.thumbnailUrl}
                  alt={selectedActionMedia.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">
                  {selectedActionMedia.title}
                </h4>
                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 mt-0.5">
                  <span className="text-orange-400 font-semibold">{selectedActionMedia.resolution}</span>
                  <span>·</span>
                  <span>{formatFileSize(selectedActionMedia.fileSize)}</span>
                  <span>·</span>
                  <span>{formatDuration(selectedActionMedia.duration)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedActionMedia(null)}
                className="p-1.5 rounded-full hover:bg-zinc-850 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions List */}
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => {
                  const item = selectedActionMedia;
                  setSelectedActionMedia(null);
                  onPlayMedia(item);
                }}
                className="w-full px-3.5 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-semibold text-xs flex items-center gap-3 transition-colors shadow-md shadow-orange-500/20"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Play Now</span>
              </button>

              <button
                onClick={() => {
                  onToggleFavorite(selectedActionMedia.id);
                  setSelectedActionMedia(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-white text-xs flex items-center gap-3 transition-colors border border-zinc-800 hover:border-zinc-700"
              >
                <Heart
                  className={`w-4 h-4 ${
                    selectedActionMedia.isFavorite
                      ? 'fill-orange-500 text-orange-500'
                      : 'text-zinc-400'
                  }`}
                />
                <span>
                  {selectedActionMedia.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </span>
              </button>

              <button
                onClick={() => {
                  const item = selectedActionMedia;
                  setSelectedActionMedia(null);
                  onAddToVault(item);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-white text-xs flex items-center gap-3 transition-colors border border-zinc-800 hover:border-orange-500/30"
              >
                <Lock className="w-4 h-4 text-orange-400" />
                <span>Move to Private Vault</span>
              </button>

              <button
                onClick={() => {
                  const id = selectedActionMedia.id;
                  setSelectedActionMedia(null);
                  onDeleteMedia(id);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 hover:bg-red-950/40 text-zinc-300 hover:text-red-400 text-xs flex items-center gap-3 transition-colors border border-zinc-800/80 hover:border-red-900/50"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Delete File</span>
              </button>
            </div>

            <button
              onClick={() => setSelectedActionMedia(null)}
              className="mt-1 w-full py-2.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white text-xs font-semibold hover:bg-zinc-850 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
