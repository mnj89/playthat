import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  ArrowLeft,
  Volume2,
  VolumeX,
  Volume1,
  Sun,
  Lock,
  Unlock,
  RotateCcw,
  Maximize2,
  Minimize2,
  Subtitles,
  Settings,
  FastForward,
  Rewind,
  Sliders,
  Check,
  Moon,
  Clock,
  Sparkles,
} from 'lucide-react';
import { MediaItem, SubtitleSettings, SubtitleTrack, DecoderMode, AspectRatioMode } from '../types';
import { getActiveCueText } from '../services/subtitleParser';
import { EnhancementsModal, EnhancementConfig, DEFAULT_ENHANCEMENTS } from './EnhancementsModal';

interface MXPlayerProps {
  media: MediaItem;
  onBack: () => void;
  subtitleSettings: SubtitleSettings;
  onOpenSubtitleSettings: () => void;
  activeSubtitleTrack?: SubtitleTrack | null;
  onSelectSubtitleTrack?: (track: SubtitleTrack | null) => void;
  availableSubtitleTracks?: SubtitleTrack[];
  enhancementConfig?: EnhancementConfig;
  onUpdateEnhancements?: (config: EnhancementConfig) => void;
}

export const MXPlayer: React.FC<MXPlayerProps> = ({
  media,
  onBack,
  subtitleSettings,
  onOpenSubtitleSettings,
  activeSubtitleTrack,
  onSelectSubtitleTrack,
  availableSubtitleTracks = [],
  enhancementConfig,
  onUpdateEnhancements,
}) => {
  const [enhancements, setEnhancements] = useState<EnhancementConfig>(
    enhancementConfig || DEFAULT_ENHANCEMENTS
  );
  const [isEnhancementsModalOpen, setIsEnhancementsModalOpen] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(media.currentTime || 0);
  const [duration, setDuration] = useState<number>(media.duration || 100);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>('fit');
  const [decoder, setDecoder] = useState<DecoderMode>(media.decoder || 'HW');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Gesture adjustments
  const [brightness, setBrightness] = useState<number>(100); // 0 to 150%
  const [volume, setVolume] = useState<number>(100); // 0 to 200% (boost!)
  const [activeGesture, setActiveGesture] = useState<'brightness' | 'volume' | 'seek' | null>(null);
  const [gestureDelta, setGestureDelta] = useState<number>(0);
  const [targetSeekTime, setTargetSeekTime] = useState<number>(0);

  // Subtitle cue text
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string | null>(null);

  // Sleep timer
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);

  // Touch & Pointer Tracking
  const touchStartRef = useRef<{ x: number; y: number; time: number; volume: number; brightness: number; currentTime: number } | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);

  // Format time in mm:ss or hh:mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const s = Math.max(0, Math.floor(seconds));
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Reset controls timer
  const triggerShowControls = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
      setShowSettingsMenu(false);
    }, 4000);
  }, []);

  // Initialize Video & HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const isHls = media.url.includes('.m3u8') || media.sourceType === 'stream';

    if (isHls && Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(media.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => setIsPlaying(false));
      });
      hlsRef.current = hls;
    } else {
      video.src = media.url;
      video.load();
      video.play().catch(() => setIsPlaying(false));
    }

    if (media.currentTime > 0) {
      video.currentTime = media.currentTime;
    }

    triggerShowControls();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [media.url, media.sourceType, triggerShowControls]);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const ct = videoRef.current.currentTime;
    setCurrentTime(ct);

    // Active subtitle calculation
    if (activeSubtitleTrack && activeSubtitleTrack.cues) {
      const text = getActiveCueText(
        activeSubtitleTrack.cues,
        ct,
        subtitleSettings.delayMs
      );
      setCurrentSubtitleText(text);
    } else {
      setCurrentSubtitleText(null);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || media.duration || 100);
    }
  };

  // Volume & Audio Boost handling
  useEffect(() => {
    if (!videoRef.current) return;
    if (volume <= 100) {
      videoRef.current.volume = Math.max(0, volume / 100);
    } else {
      // Audio boost simulation: max native volume + boosted gain
      videoRef.current.volume = 1.0;
    }
  }, [volume]);

  // Combined Video Enhancements & Brightness filter
  const getFilterStyle = () => {
    const brightnessVal = brightness / 100;
    const baseContrast = (enhancements.contrast || 100) / 100;
    const baseSaturation = (enhancements.saturation || 100) / 100;
    const hwBoostContrast = decoder === 'HW+' ? 1.12 : 1.0;
    const hwBoostSat = decoder === 'HW+' ? 1.10 : 1.0;

    let extraFilters = '';
    if (enhancements.nightMode) {
      extraFilters += ' sepia(0.2) hue-rotate(-12deg)';
    }

    if (enhancements.sharpnessPreset === 'crisp') {
      extraFilters += ' contrast(1.05)';
    } else if (enhancements.sharpnessPreset === 'vivid') {
      extraFilters += ' saturate(1.22) contrast(1.08)';
    } else if (enhancements.sharpnessPreset === 'hdr_tone') {
      extraFilters += ' contrast(1.16) saturate(1.14) brightness(1.03)';
    }

    return `brightness(${brightnessVal}) contrast(${baseContrast * hwBoostContrast}) saturate(${baseSaturation * hwBoostSat})${extraFilters}`;
  };

  // Aspect ratio video styling
  const getVideoObjectFit = (): React.CSSProperties => {
    switch (aspectRatio) {
      case 'stretch':
        return { objectFit: 'fill', width: '100%', height: '100%' };
      case '16:9':
        return { objectFit: 'contain', aspectRatio: '16/9' };
      case '4:3':
        return { objectFit: 'contain', aspectRatio: '4/3' };
      case 'zoom':
        return { objectFit: 'cover', width: '100%', height: '100%' };
      case 'original':
        return { objectFit: 'none' };
      case 'fit':
      default:
        return { objectFit: 'contain', width: '100%', height: '100%' };
    }
  };

  // Touch and pointer gestures: Left = Brightness, Right = Volume, Horizontal = Seek
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked) {
      triggerShowControls();
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    touchStartRef.current = {
      x,
      y,
      time: Date.now(),
      volume,
      brightness,
      currentTime,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || isLocked) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const deltaX = currentX - touchStartRef.current.x;
    const deltaY = touchStartRef.current.y - currentY; // positive = dragging UP

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX < 10 && absY < 10) return; // ignore micro jitters

    // Check gesture direction
    if (absY > absX * 1.2) {
      // Vertical Gesture
      const isLeftSide = touchStartRef.current.x < rect.width * 0.5;
      const sensitivity = 0.5;

      if (isLeftSide) {
        // Brightness: 10% to 150%
        setActiveGesture('brightness');
        const nextBrightness = Math.min(
          150,
          Math.max(10, Math.round(touchStartRef.current.brightness + deltaY * sensitivity))
        );
        setBrightness(nextBrightness);
      } else {
        // Volume: 0% to 200% (boost!)
        setActiveGesture('volume');
        const nextVolume = Math.min(
          200,
          Math.max(0, Math.round(touchStartRef.current.volume + deltaY * sensitivity))
        );
        setVolume(nextVolume);
      }
    } else if (absX > absY * 1.2) {
      // Horizontal Scrub Gesture
      setActiveGesture('seek');
      const scrubSeconds = Math.round((deltaX / rect.width) * Math.min(180, duration));
      const targetTime = Math.min(
        duration,
        Math.max(0, touchStartRef.current.currentTime + scrubSeconds)
      );
      setGestureDelta(scrubSeconds);
      setTargetSeekTime(targetTime);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeGesture === 'seek' && videoRef.current) {
      videoRef.current.currentTime = targetSeekTime;
      setCurrentTime(targetSeekTime);
    }

    // Double tap check
    if (!activeGesture && touchStartRef.current) {
      const now = Date.now();
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;

      if (lastTapRef.current && now - lastTapRef.current.time < 300) {
        // Double tap confirmed
        const isLeftZone = clickX < rect.width * 0.35;
        const isRightZone = clickX > rect.width * 0.65;

        if (isLeftZone && videoRef.current) {
          // -10s rewind
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
        } else if (isRightZone && videoRef.current) {
          // +10s forward
          videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
        } else {
          // Toggle play/pause in center
          togglePlayPause();
        }
        lastTapRef.current = null;
      } else {
        lastTapRef.current = { time: now, x: clickX };
        triggerShowControls();
      }
    }

    setActiveGesture(null);
    touchStartRef.current = null;
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    triggerShowControls();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
    triggerShowControls();
  };

  const cycleDecoder = () => {
    const nextMode: Record<DecoderMode, DecoderMode> = {
      HW: 'HW+',
      'HW+': 'SW',
      SW: 'HW',
    };
    setDecoder(nextMode[decoder]);
    triggerShowControls();
  };

  const cycleAspectRatio = () => {
    const modes: AspectRatioMode[] = ['fit', 'stretch', '16:9', '4:3', 'zoom'];
    const idx = modes.indexOf(aspectRatio);
    setAspectRatio(modes[(idx + 1) % modes.length]);
    triggerShowControls();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        setActiveGesture(null);
        touchStartRef.current = null;
      }}
      className="relative w-full h-full bg-black select-none overflow-hidden flex items-center justify-center cursor-pointer"
      style={{ touchAction: 'none' }}
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        style={{
          ...getVideoObjectFit(),
          filter: getFilterStyle(),
          transition: 'filter 0.15s ease',
        }}
        className="w-full h-full"
      />

      {/* Subtitles Overlay */}
      {currentSubtitleText && (
        <div
          className="absolute left-0 right-0 z-30 pointer-events-none flex justify-center px-4 text-center transition-all"
          style={{ bottom: `${subtitleSettings.verticalOffset}%` }}
        >
          <div
            className="subtitle-text rounded-md px-3 py-1 font-semibold tracking-wide inline-block"
            style={{
              fontSize: `${subtitleSettings.fontSize}px`,
              color: subtitleSettings.textColor,
              backgroundColor: subtitleSettings.backgroundColor,
              WebkitTextStroke:
                subtitleSettings.outlineWidth > 0
                  ? `${subtitleSettings.outlineWidth}px ${subtitleSettings.outlineColor}`
                  : 'none',
            }}
          >
            {currentSubtitleText}
          </div>
        </div>
      )}

      {/* Gesture HUD Feedback Indicators */}
      {activeGesture === 'brightness' && (
        <div className="absolute left-8 top-1/2 -translate-y-1/2 z-40 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col items-center gap-2 pointer-events-none animate-in fade-in zoom-in-95 duration-100">
          <Sun className="w-6 h-6 text-amber-400 animate-pulse" />
          <div className="w-2.5 h-32 bg-slate-800 rounded-full overflow-hidden p-0.5 flex flex-col justify-end">
            <div
              className="w-full bg-gradient-to-t from-amber-500 to-yellow-300 rounded-full transition-all"
              style={{ height: `${Math.min(100, (brightness / 150) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-amber-300">{brightness}%</span>
        </div>
      )}

      {activeGesture === 'volume' && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2 z-40 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col items-center gap-2 pointer-events-none animate-in fade-in zoom-in-95 duration-100">
          {volume === 0 ? (
            <VolumeX className="w-6 h-6 text-red-400" />
          ) : volume > 100 ? (
            <div className="relative">
              <Volume2 className="w-6 h-6 text-cyan-400" />
              <span className="absolute -top-1 -right-2 text-[9px] bg-cyan-500 text-slate-950 font-black px-1 rounded-full">
                BOOST
              </span>
            </div>
          ) : (
            <Volume1 className="w-6 h-6 text-blue-400" />
          )}
          <div className="w-2.5 h-32 bg-slate-800 rounded-full overflow-hidden p-0.5 flex flex-col justify-end">
            <div
              className={`w-full rounded-full transition-all ${
                volume > 100
                  ? 'bg-gradient-to-t from-blue-500 via-cyan-400 to-emerald-300'
                  : 'bg-gradient-to-t from-blue-600 to-blue-400'
              }`}
              style={{ height: `${Math.min(100, (volume / 200) * 100)}%` }}
            />
          </div>
          <span className={`text-xs font-mono font-bold ${volume > 100 ? 'text-cyan-300' : 'text-blue-300'}`}>
            {volume}%
          </span>
        </div>
      )}

      {activeGesture === 'seek' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-slate-900/95 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center gap-1 pointer-events-none animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center gap-2 text-xl font-mono font-bold text-white">
            {gestureDelta >= 0 ? (
              <FastForward className="w-5 h-5 text-blue-400" />
            ) : (
              <Rewind className="w-5 h-5 text-blue-400" />
            )}
            <span>
              {gestureDelta >= 0 ? `+${gestureDelta}s` : `${gestureDelta}s`}
            </span>
          </div>
          <div className="text-xs text-slate-300 font-mono">
            {formatTime(targetSeekTime)} / {formatTime(duration)}
          </div>
        </div>
      )}

      {/* Screen Lock Badge */}
      {isLocked && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsLocked(false);
            triggerShowControls();
          }}
          className="absolute top-6 left-6 z-50 p-3 bg-red-600/90 text-white rounded-full shadow-lg hover:bg-red-500 transition-transform active:scale-90 flex items-center gap-2"
        >
          <Lock className="w-5 h-5" />
          <span className="text-xs font-semibold pr-1">Tap to Unlock</span>
        </div>
      )}

      {/* Controls Overlay */}
      {!isLocked && showControls && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-30 flex flex-col justify-between p-4 bg-gradient-to-t from-black/80 via-transparent to-black/80 transition-opacity duration-200"
        >
          {/* Top Bar Controls */}
          <div className="flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                title="Back to library"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex flex-col">
                <span className="text-sm font-semibold truncate max-w-[220px] sm:max-w-md">
                  {media.title}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {media.resolution} · {media.codec}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Decoder Switcher (HW / HW+ / SW) */}
              <button
                onClick={cycleDecoder}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md border transition-all ${
                  decoder === 'HW+'
                    ? 'bg-orange-500 text-black border-orange-400 shadow-sm shadow-orange-500/50'
                    : decoder === 'HW'
                    ? 'bg-zinc-850 text-orange-400 border-orange-500/40'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                }`}
                title="Switch Decoder (HW = Hardware, HW+ = Enhanced Hardware, SW = Software)"
              >
                {decoder}
              </button>

              {/* Aspect Ratio */}
              <button
                onClick={cycleAspectRatio}
                className="px-2 py-1 text-xs font-medium rounded-md bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                title="Aspect Ratio"
              >
                {aspectRatio.toUpperCase()}
              </button>

              {/* Subtitles Button */}
              <button
                onClick={onOpenSubtitleSettings}
                className="p-2 rounded-full hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
                title="Subtitle Customization"
              >
                <Subtitles className="w-5 h-5" />
              </button>

              {/* Audio & Video Enhancements Button */}
              <button
                onClick={() => setIsEnhancementsModalOpen(true)}
                className="p-2 rounded-full hover:bg-white/20 text-orange-400 hover:text-white transition-colors"
                title="Audio & Video Enhancement Studio"
              >
                <Sparkles className="w-5 h-5" />
              </button>

              {/* Settings Dropdown Toggle */}
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-2 rounded-full hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
                title="Playback Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Settings Menu Modal */}
          {showSettingsMenu && (
            <div className="absolute top-16 right-4 z-50 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-2xl p-4 shadow-2xl w-68 text-zinc-200 flex flex-col gap-3">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Playback Settings
              </div>

              {/* A/V Enhancements Studio Button */}
              <button
                onClick={() => {
                  setIsEnhancementsModalOpen(true);
                  setShowSettingsMenu(false);
                }}
                className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-xs font-bold flex items-center justify-between text-orange-400 border border-orange-500/30 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <span>A/V Enhancements</span>
                </div>
                <span className="text-[10px] font-mono text-orange-400 font-bold">HW+ & Boost</span>
              </button>

              {/* Speed Controller */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium">Speed: {playbackRate}x</span>
                <div className="grid grid-cols-4 gap-1">
                  {[0.5, 1.0, 1.5, 2.0].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        setPlaybackRate(rate);
                        if (videoRef.current) videoRef.current.playbackRate = rate;
                      }}
                      className={`py-1 text-xs rounded font-mono ${
                        playbackRate === rate
                          ? 'bg-orange-500 text-black font-bold'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtitle Track Selector */}
              {availableSubtitleTracks.length > 0 && (
                <div className="flex flex-col gap-1.5 border-t border-zinc-800 pt-2">
                  <span className="text-xs font-medium">Subtitle Track:</span>
                  <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                    <button
                      onClick={() => onSelectSubtitleTrack?.(null)}
                      className={`text-left px-2 py-1 text-xs rounded flex items-center justify-between ${
                        !activeSubtitleTrack ? 'bg-orange-500/20 text-orange-400 font-semibold' : 'hover:bg-zinc-800'
                      }`}
                    >
                      <span>Off</span>
                      {!activeSubtitleTrack && <Check className="w-3.5 h-3.5" />}
                    </button>
                    {availableSubtitleTracks.map((trk) => (
                      <button
                        key={trk.id}
                        onClick={() => onSelectSubtitleTrack?.(trk)}
                        className={`text-left px-2 py-1 text-xs rounded flex items-center justify-between ${
                          activeSubtitleTrack?.id === trk.id
                            ? 'bg-orange-500/20 text-orange-400 font-semibold'
                            : 'hover:bg-zinc-800'
                        }`}
                      >
                        <span>{trk.label}</span>
                        {activeSubtitleTrack?.id === trk.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Lock Screen Action */}
              <button
                onClick={() => {
                  setIsLocked(true);
                  setShowSettingsMenu(false);
                }}
                className="w-full mt-1 py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium flex items-center justify-center gap-2 text-zinc-200"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Screen Touches</span>
              </button>
            </div>
          )}

          {/* Center Play/Pause Large Action */}
          <div className="flex items-center justify-center pointer-events-none">
            <button
              onClick={togglePlayPause}
              className="pointer-events-auto p-4 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-orange-400 hover:border-orange-500/50 transition-all active:scale-90 border border-white/20 shadow-2xl"
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 translate-x-0.5" />}
            </button>
          </div>

          {/* Bottom Bar Controls */}
          <div className="flex flex-col gap-2">
            {/* Timeline Scrubbing Bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-zinc-300 w-12 text-right">
                {formatTime(currentTime)}
              </span>
              <div className="relative flex-1 flex items-center">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:h-2 transition-all"
                />
              </div>
              <span className="text-xs font-mono text-zinc-400 w-12">
                {formatTime(duration)}
              </span>
            </div>

            {/* Bottom Button Strip */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsLocked(true)}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                  title="Lock touch gestures"
                >
                  <Unlock className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                  title="Rewind 10s"
                >
                  <Rewind className="w-4 h-4" />
                </button>

                <button
                  onClick={togglePlayPause}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                  title="Forward 10s"
                >
                  <FastForward className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audio and Video Enhancements Studio Modal */}
      <EnhancementsModal
        isOpen={isEnhancementsModalOpen}
        onClose={() => setIsEnhancementsModalOpen(false)}
        config={enhancements}
        onChange={(cfg) => {
          setEnhancements(cfg);
          onUpdateEnhancements?.(cfg);
          if (cfg.decoder !== decoder) setDecoder(cfg.decoder);
          if (cfg.aspectRatio !== aspectRatio) setAspectRatio(cfg.aspectRatio);
        }}
      />
    </div>
  );
};
