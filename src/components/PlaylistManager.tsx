import React, { useState } from 'react';
import {
  ListMusic,
  Plus,
  Play,
  Shuffle,
  Trash2,
  Film,
  X,
  Music2,
} from 'lucide-react';
import { MediaItem, Playlist } from '../types';

interface PlaylistManagerProps {
  playlists: Playlist[];
  mediaItems: MediaItem[];
  onCreatePlaylist: (title: string, description?: string) => void;
  onDeletePlaylist: (id: string) => void;
  onPlayMedia: (item: MediaItem) => void;
  onRemoveFromPlaylist: (playlistId: string, mediaId: string) => void;
}

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  playlists,
  mediaItems,
  onCreatePlaylist,
  onDeletePlaylist,
  onPlayMedia,
  onRemoveFromPlaylist,
}) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    playlists[0]?.id || null
  );
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');

  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId);
  const activeMediaList = activePlaylist
    ? activePlaylist.mediaIds
        .map((id) => mediaItems.find((m) => m.id === id))
        .filter((m): m is MediaItem => !!m)
    : [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreatePlaylist(newTitle.trim(), newDesc.trim() || undefined);
    setNewTitle('');
    setNewDesc('');
    setShowCreateModal(false);
  };

  const handleShufflePlay = () => {
    if (activeMediaList.length === 0) return;
    const randomIndex = Math.floor(Math.random() * activeMediaList.length);
    onPlayMedia(activeMediaList[randomIndex]);
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-black text-white overflow-hidden">
      {/* Top Strip */}
      <div className="p-4 bg-zinc-950 border-b border-zinc-850 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
            <ListMusic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">Playlists & Queues</h3>
            <span className="text-[10px] font-mono text-zinc-400">
              {playlists.length} playlists created
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-1.5 rounded-xl bg-orange-500 text-black hover:bg-orange-400 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Playlist</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Playlist Sidebar */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-850 bg-zinc-950 p-3 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto shrink-0">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => setSelectedPlaylistId(pl.id)}
              className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-colors shrink-0 md:shrink md:w-full ${
                selectedPlaylistId === pl.id
                  ? 'bg-zinc-900 border-orange-500/50 text-white shadow-sm ring-1 ring-orange-500/30'
                  : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Music2 className={`w-4 h-4 shrink-0 ${selectedPlaylistId === pl.id ? 'text-orange-400' : 'text-zinc-400'}`} />
                <div className="flex flex-col min-w-0">
                  <span className={`text-xs font-bold truncate ${selectedPlaylistId === pl.id ? 'text-orange-400' : 'text-white'}`}>{pl.title}</span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {pl.mediaIds.length} items
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePlaylist(pl.id);
                  if (selectedPlaylistId === pl.id) setSelectedPlaylistId(null);
                }}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:text-red-400"
                title="Delete Playlist"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </button>
          ))}
        </div>

        {/* Right Active Playlist Contents */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {activePlaylist ? (
            <>
              <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-2xl border border-zinc-850">
                <div className="flex flex-col">
                  <h4 className="text-base font-bold text-white">{activePlaylist.title}</h4>
                  <span className="text-xs text-zinc-400">
                    {activePlaylist.description || 'Custom Media Queue'} · {activeMediaList.length} items
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={activeMediaList.length === 0}
                    onClick={handleShufflePlay}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 hover:text-orange-400"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Shuffle</span>
                  </button>
                  <button
                    disabled={activeMediaList.length === 0}
                    onClick={() => onPlayMedia(activeMediaList[0])}
                    className="px-4 py-1.5 rounded-xl bg-orange-500 text-black hover:bg-orange-400 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-md shadow-orange-500/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>Play All</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              {activeMediaList.length === 0 ? (
                <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-850 text-center flex flex-col items-center justify-center gap-2 text-zinc-500">
                  <Film className="w-10 h-10 text-zinc-700" />
                  <span className="text-xs font-semibold text-white">No items in this playlist yet</span>
                  <span className="text-[11px] text-zinc-400">
                    Add media files from the main library or downloaded streams.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {activeMediaList.map((item, index) => (
                    <div
                      key={item.id}
                      onClick={() => onPlayMedia(item)}
                      className="p-3 rounded-2xl bg-zinc-950 border border-zinc-850 hover:border-zinc-700 flex items-center justify-between gap-3 cursor-pointer transition-colors hover:bg-zinc-900"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono font-bold text-zinc-500 w-5">
                          {index + 1}
                        </span>
                        <div className="w-16 h-10 rounded-lg bg-black overflow-hidden shrink-0 border border-zinc-800">
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-white truncate hover:text-orange-400 transition-colors">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {item.artist || item.folder} · {item.resolution}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFromPlaylist(activePlaylist.id, item.id);
                          }}
                          className="p-1 rounded-lg text-zinc-500 hover:text-white"
                          title="Remove from playlist"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayMedia(item);
                          }}
                          className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-400 text-black flex items-center justify-center shadow-md shadow-orange-500/20"
                        >
                          <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-zinc-500">Select a playlist on the left</div>
          )}
        </div>
      </div>

      {/* New Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <h4 className="text-sm font-bold text-white">Create New Playlist</h4>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-300">Playlist Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Favorites"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-300">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Chill vibes or action clips"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-xs font-bold text-black shadow-md"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
