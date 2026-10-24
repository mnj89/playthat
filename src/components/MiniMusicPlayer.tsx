import React from 'react';
import { Play, Pause, SkipForward, Music2, Maximize2 } from 'lucide-react';
import { AudioPlayerState, audioPlayerService } from '../services/audioPlayerService';

interface MiniMusicPlayerProps {
  state: AudioPlayerState;
  onOpenFullPlayer: () => void;
}

export const MiniMusicPlayer: React.FC<MiniMusicPlayerProps> = ({ state, onOpenFullPlayer }) => {
  const { currentTrack, isPlaying, currentTime, duration } = state;

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      onClick={onOpenFullPlayer}
      className="w-full bg-zinc-950/98 backdrop-blur-xl border-t border-zinc-800 hover:bg-zinc-900 transition-colors cursor-pointer select-none relative group z-30 shrink-0 text-white"
    >
      {/* Top Progress Line (Vibrant Orange Accent) */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-800 overflow-hidden">
        <div
          className="h-full bg-orange-500 transition-all duration-200"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      <div className="h-14 px-3 flex items-center justify-between gap-3">
        {/* Album Art + Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md shrink-0 border border-zinc-700 bg-zinc-900">
            {currentTrack.thumbnailUrl ? (
              <img
                src={currentTrack.thumbnailUrl}
                alt={currentTrack.title}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-105' : 'scale-100'
                }`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                <Music2 className="w-5 h-5 text-orange-400" />
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-white truncate group-hover:text-orange-400 transition-colors">
              {currentTrack.title}
            </span>
            <span className="text-[11px] text-zinc-400 truncate">
              {currentTrack.artist || currentTrack.album || 'PlayThat! Music'}
            </span>
          </div>
        </div>

        {/* Quick Action Controls */}
        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => audioPlayerService.togglePlay()}
            className="w-9 h-9 rounded-full bg-orange-500 hover:bg-orange-400 text-black flex items-center justify-center shadow-md shadow-orange-500/25 active:scale-90 transition-transform"
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-black" />
            ) : (
              <Play className="w-4 h-4 fill-black ml-0.5" />
            )}
          </button>

          <button
            onClick={() => audioPlayerService.next()}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 active:scale-95 transition-all"
            title="Next Track"
            aria-label="Next Track"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenFullPlayer}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors hidden sm:flex"
            title="Expand Full Music Player"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
