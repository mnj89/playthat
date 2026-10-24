import React, { useState } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  ListMusic,
  Heart,
  Sparkles,
  X,
} from 'lucide-react';
import { AudioPlayerState, audioPlayerService } from '../services/audioPlayerService';

interface MusicPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AudioPlayerState;
  onOpenEnhancements: () => void;
  onToggleFavorite?: (mediaId: string) => void;
}

export const MusicPlayerModal: React.FC<MusicPlayerModalProps> = ({
  isOpen,
  onClose,
  state,
  onOpenEnhancements,
  onToggleFavorite,
}) => {
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isDraggingSeek, setIsDraggingSeek] = useState<boolean>(false);
  const [seekValue, setSeekValue] = useState<number>(0);

  if (!isOpen || !state.currentTrack) return null;

  const { currentTrack, isPlaying, currentTime, duration, volume, isShuffle, loopMode, queue } = state;

  const activeTime = isDraggingSeek ? seekValue : currentTime;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const remainingTime = Math.max(0, duration - activeTime);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 select-none overflow-hidden">
      <div className="w-full h-full max-w-lg flex flex-col justify-between p-5 sm:p-6 bg-black text-white relative border-x border-zinc-900">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between z-10 pt-1">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 active:scale-95 transition-all"
            title="Minimize Player"
            aria-label="Minimize"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
              Playing from {currentTrack.folder || 'Library'}
            </span>
            <span className="text-xs font-semibold text-zinc-200">PlayThat! Hi-Res Audio</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenEnhancements}
              className="p-2 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-900 active:scale-95 transition-all"
              title="Audio Enhancements & 200% Boost"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsQueueOpen(!isQueueOpen)}
              className={`p-2 rounded-full transition-all ${
                isQueueOpen ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
              title="Playback Queue"
            >
              <ListMusic className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content: Center Artwork or Queue View */}
        {isQueueOpen ? (
          /* Queue Drawer */
          <div className="flex-1 my-4 flex flex-col bg-zinc-950 border border-zinc-850 rounded-3xl p-4 overflow-hidden backdrop-blur-md animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-white" />
                <h4 className="text-sm font-bold text-white">Up Next ({queue.length})</h4>
              </div>
              <button
                onClick={() => setIsQueueOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-zinc-900 my-2 pr-1">
              {queue.map((item, idx) => {
                const isCurrent = item.id === currentTrack.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      audioPlayerService.playTrack(item, queue);
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                      isCurrent
                        ? 'bg-zinc-900 text-white font-semibold'
                        : 'hover:bg-zinc-900/50 text-zinc-300'
                    }`}
                  >
                    <div className="w-6 text-center text-xs text-zinc-500 font-mono">
                      {isCurrent ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-white mx-auto animate-ping" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover bg-zinc-900 shrink-0"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs truncate text-white">{item.title}</span>
                      <span className="text-[11px] text-zinc-400 truncate">
                        {item.artist || item.folder}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                      {formatTime(item.duration)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Full Color Album Artwork */
          <div className="flex-1 flex flex-col items-center justify-center my-4">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-[36px] overflow-hidden shadow-2xl border border-zinc-700 group bg-zinc-950">
              <img
                src={currentTrack.thumbnailUrl}
                alt={currentTrack.title}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover transition-transform duration-1000 ${
                  isPlaying ? 'scale-105' : 'scale-100'
                }`}
              />

              {/* Dynamic Soundwave Equalizer Overlay with Orange Bars */}
              {isPlaying && (
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-center gap-1.5 h-8 bg-black/75 backdrop-blur-md rounded-2xl px-3 py-1.5 border border-zinc-800">
                  {[40, 75, 55, 90, 65, 80, 45, 95, 60, 85, 50, 70].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50 transition-all duration-300"
                      style={{
                        height: `${Math.max(15, (h * (0.6 + Math.sin(Date.now() / 200 + i) * 0.4)))}%`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Audio Format Pill (Black, Grey & Orange) */}
            <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-900 border border-orange-500/30 text-[11px] font-mono text-orange-400">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span>{currentTrack.codec || 'MP3 · 320 KBPS · 44.1 KHZ'}</span>
              <span>·</span>
              <span className="text-zinc-300 font-sans">HI-RES</span>
            </div>
          </div>
        )}

        {/* Track Metadata & Favorite */}
        <div className="flex items-center justify-between gap-4 px-1 mb-2">
          <div className="flex flex-col min-w-0">
            <h3 className="text-lg font-bold text-white tracking-wide truncate">
              {currentTrack.title}
            </h3>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              {currentTrack.artist || 'Unknown Artist'} {currentTrack.album ? `— ${currentTrack.album}` : ''}
            </p>
          </div>

          <button
            onClick={() => onToggleFavorite && onToggleFavorite(currentTrack.id)}
            className={`p-2.5 rounded-full border transition-colors shrink-0 ${
              currentTrack.isFavorite
                ? 'bg-zinc-800 border-orange-500/50 text-orange-500'
                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white'
            }`}
            title="Favorite Track"
          >
            <Heart className={`w-5 h-5 ${currentTrack.isFavorite ? 'fill-orange-500 text-orange-500' : ''}`} />
          </button>
        </div>

        {/* Interactive Scrubbing Slider */}
        <div className="flex flex-col gap-1 px-1 my-2">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.5"
            value={activeTime}
            onMouseDown={() => setIsDraggingSeek(true)}
            onTouchStart={() => setIsDraggingSeek(true)}
            onChange={(e) => setSeekValue(Number(e.target.value))}
            onMouseUp={() => {
              setIsDraggingSeek(false);
              audioPlayerService.seek(seekValue);
            }}
            onTouchEnd={() => {
              setIsDraggingSeek(false);
              audioPlayerService.seek(seekValue);
            }}
            className="w-full accent-orange-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
          />

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-0.5">
            <span>{formatTime(activeTime)}</span>
            <span>-{formatTime(remainingTime)}</span>
          </div>
        </div>

        {/* Primary Playback Controls in Black, White, Grey & Orange */}
        <div className="flex items-center justify-between px-2 py-2">
          {/* Shuffle */}
          <button
            onClick={() => audioPlayerService.toggleShuffle()}
            className={`p-3 rounded-full transition-colors ${
              isShuffle ? 'text-black bg-orange-500 font-bold shadow-md shadow-orange-500/20' : 'text-zinc-400 hover:text-white'
            }`}
            title={isShuffle ? 'Shuffle On' : 'Shuffle Off'}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Previous Track */}
          <button
            onClick={() => audioPlayerService.previous()}
            className="p-3 text-zinc-200 hover:text-white rounded-full hover:bg-zinc-900 active:scale-95 transition-all"
            title="Previous Track"
          >
            <SkipBack className="w-7 h-7 fill-zinc-200" />
          </button>

          {/* Large Vibrant Orange Play/Pause Button */}
          <button
            onClick={() => audioPlayerService.togglePlay()}
            className="w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-400 text-black flex items-center justify-center shadow-2xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-black" />
            ) : (
              <Play className="w-7 h-7 fill-black ml-1" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={() => audioPlayerService.next()}
            className="p-3 text-zinc-200 hover:text-white rounded-full hover:bg-zinc-900 active:scale-95 transition-all"
            title="Next Track"
          >
            <SkipForward className="w-7 h-7 fill-zinc-200" />
          </button>

          {/* Repeat Mode */}
          <button
            onClick={() => audioPlayerService.toggleLoopMode()}
            className={`p-3 rounded-full transition-colors ${
              loopMode !== 'off' ? 'text-black bg-orange-500 font-bold shadow-md shadow-orange-500/20' : 'text-zinc-400 hover:text-white'
            }`}
            title={`Repeat: ${loopMode.toUpperCase()}`}
          >
            {loopMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Bottom MX Volume Boost (up to 200%) */}
        <div className="flex items-center gap-3 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl mt-1">
          <button
            onClick={() => audioPlayerService.toggleMute()}
            className="text-zinc-400 hover:text-orange-400"
          >
            <Volume2 className="w-4 h-4 text-orange-400" />
          </button>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={volume}
            onChange={(e) => audioPlayerService.setVolume(Number(e.target.value))}
            className="flex-1 accent-orange-500 cursor-pointer h-1.5"
          />
          <span className="text-[11px] font-mono font-bold text-orange-400 min-w-[45px] text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
