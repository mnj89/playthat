import React, { useState, useEffect } from 'react';
import {
  Wifi,
  BatteryMedium,
  Signal,
  Smartphone,
  Monitor,
  Tablet,
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Lock,
  Unlock,
  ChevronDown,
  Bell,
  Volume2,
  ChevronUp,
} from 'lucide-react';
import { audioPlayerService, AudioPlayerState } from '../services/audioPlayerService';

export type FrameMode = 'phone' | 'tablet' | 'responsive';

interface AndroidFrameProps {
  children: React.ReactNode;
  frameMode: FrameMode;
  onFrameModeChange: (mode: FrameMode) => void;
  isPlayerActive?: boolean;
  onOpenFullMusicPlayer?: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  frameMode,
  onFrameModeChange,
  isPlayerActive = false,
  onOpenFullMusicPlayer,
}) => {
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('12:45');
  const [currentDateStr, setCurrentDateStr] = useState<string>('Friday, Oct 24');
  const [isPhoneLocked, setIsPhoneLocked] = useState<boolean>(false);
  const [isNotificationShadeOpen, setIsNotificationShadeOpen] = useState<boolean>(false);
  const [audioState, setAudioState] = useState<AudioPlayerState>(audioPlayerService.getState());

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTimeStr(
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
      setCurrentDateStr(
        d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to audio player service
  useEffect(() => {
    const unsubscribe = audioPlayerService.subscribe((state) => {
      setAudioState(state);
    });
    return unsubscribe;
  }, []);

  const formatSecs = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent =
    audioState.duration > 0 ? (audioState.currentTime / audioState.duration) * 100 : 0;

  // Render Android Media Notification Card in Monochrome
  const renderMediaNotificationCard = (isLockscreen = false) => {
    if (!audioState.currentTrack) return null;

    return (
      <div
        className={`w-full rounded-2xl p-3 border transition-all ${
          isLockscreen
            ? 'bg-zinc-900/90 border-zinc-700 backdrop-blur-xl shadow-2xl text-white'
            : 'bg-zinc-900 border-zinc-750 shadow-lg text-white'
        }`}
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[10px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="font-semibold text-white">PlayThat! Music</span>
            <span>·</span>
            <span className="text-orange-400 font-mono">Hi-Res Audio</span>
          </div>
          <span className="text-zinc-400">Speaker</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Thumbnail */}
          <div
            onClick={() => onOpenFullMusicPlayer && onOpenFullMusicPlayer()}
            className="w-12 h-12 rounded-xl overflow-hidden bg-black shrink-0 border border-zinc-700 cursor-pointer shadow-md"
          >
            <img
              src={audioState.currentTrack.thumbnailUrl}
              alt={audioState.currentTrack.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Title & Artist */}
          <div
            onClick={() => onOpenFullMusicPlayer && onOpenFullMusicPlayer()}
            className="flex-1 min-w-0 cursor-pointer"
          >
            <h5 className="text-xs font-bold text-white truncate">
              {audioState.currentTrack.title}
            </h5>
            <p className="text-[11px] text-zinc-400 truncate">
              {audioState.currentTrack.artist || audioState.currentTrack.album || 'PlayThat! Audio'}
            </p>
          </div>

          {/* Quick Notification Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => audioPlayerService.previous()}
              className="p-1.5 text-zinc-300 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
              title="Previous"
            >
              <SkipBack className="w-4 h-4 fill-zinc-300" />
            </button>

            <button
              onClick={() => audioPlayerService.togglePlay()}
              className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-400 text-black flex items-center justify-center shadow-md shadow-orange-500/25 active:scale-95 transition-all"
              title={audioState.isPlaying ? 'Pause' : 'Play'}
            >
              {audioState.isPlaying ? (
                <Pause className="w-4 h-4 fill-black" />
              ) : (
                <Play className="w-4 h-4 fill-black ml-0.5" />
              )}
            </button>

            <button
              onClick={() => audioPlayerService.next()}
              className="p-1.5 text-zinc-300 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
              title="Next"
            >
              <SkipForward className="w-4 h-4 fill-zinc-300" />
            </button>
          </div>
        </div>

        {/* Scrubber in Notification */}
        <div className="mt-2.5 flex flex-col gap-1">
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>{formatSecs(audioState.currentTime)}</span>
            <span>{formatSecs(audioState.duration)}</span>
          </div>
        </div>
      </div>
    );
  };

  if (frameMode === 'responsive') {
    return (
      <div className="w-full min-h-screen bg-black text-white flex flex-col">
        {/* Subtle Top Device Switcher Floating Bar */}
        <div className="sticky top-0 z-50 px-4 py-2 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400">View Mode:</span>
            <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
              <button
                onClick={() => onFrameModeChange('phone')}
                className="px-2.5 py-1 text-xs font-medium rounded-md text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
                title="Android Phone Mockup"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone</span>
              </button>
              <button
                onClick={() => onFrameModeChange('tablet')}
                className="px-2.5 py-1 text-xs font-medium rounded-md text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
                title="Android Tablet Mockup"
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>Tablet</span>
              </button>
              <button
                onClick={() => onFrameModeChange('responsive')}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-white text-black font-semibold shadow-sm flex items-center gap-1.5"
                title="Adaptive Responsive Mode"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Full Responsive</span>
              </button>
            </div>
          </div>

          {/* Quick Notification Dropdown in Responsive Mode */}
          <div className="flex items-center gap-3">
            {audioState.currentTrack && (
              <button
                onClick={() => setIsNotificationShadeOpen(!isNotificationShadeOpen)}
                className="relative px-3 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-white flex items-center gap-1.5 shadow-sm transition-colors"
                title="Notifications & Background Audio Controls"
              >
                <Music className="w-3.5 h-3.5 text-white animate-pulse" />
                <span className="truncate max-w-[130px] font-medium">
                  {audioState.currentTrack.title}
                </span>
                <span className="text-[10px] text-zinc-500">·</span>
                <span className="text-[10px] text-zinc-400">
                  {audioState.isPlaying ? 'Playing' : 'Paused'}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
              <span>PlayThat! v2.4</span>
              <span>·</span>
              <span className="text-white font-mono">HW Acceleration</span>
            </div>
          </div>
        </div>

        {/* Dropdown Notification Card in Responsive Mode */}
        {isNotificationShadeOpen && audioState.currentTrack && (
          <div className="fixed top-12 right-4 z-50 w-80 animate-in fade-in slide-in-from-top-2 duration-150">
            {renderMediaNotificationCard(false)}
          </div>
        )}

        {/* Content body */}
        <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col bg-black">
          {children}
        </div>
      </div>
    );
  }

  const isTablet = frameMode === 'tablet';

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 overflow-x-hidden">
      {/* Device Mode Switcher Toolbar in Monochrome */}
      <div className="mb-3 flex items-center gap-3 bg-zinc-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-zinc-800 shadow-md">
        <span className="text-xs text-zinc-400 font-medium">Device:</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onFrameModeChange('phone')}
            className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 transition-colors ${
              frameMode === 'phone'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Phone</span>
          </button>
          <button
            onClick={() => onFrameModeChange('tablet')}
            className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 transition-colors ${
              frameMode === 'tablet'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>
          <button
            onClick={() => onFrameModeChange('responsive')}
            className="px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 transition-colors text-zinc-400 hover:text-white"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Full View</span>
          </button>
        </div>

        {/* Phone Power / Lock Button */}
        <div className="h-4 w-px bg-zinc-800 mx-1" />
        <button
          onClick={() => {
            setIsPhoneLocked(!isPhoneLocked);
            setIsNotificationShadeOpen(false);
          }}
          className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 transition-colors ${
            isPhoneLocked
              ? 'bg-zinc-200 text-black font-semibold'
              : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'
          }`}
          title={isPhoneLocked ? 'Unlock phone' : 'Lock phone (music plays in background)'}
        >
          {isPhoneLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          <span>{isPhoneLocked ? 'Unlock Phone' : 'Lock Phone'}</span>
        </button>
      </div>

      {/* Realistic Titanium Android Chassis */}
      <div
        className={`relative bg-zinc-950 border-[7px] border-zinc-800 rounded-[44px] shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isTablet
            ? 'w-full max-w-[960px] h-[780px]'
            : isPlayerActive
            ? 'w-full max-w-[840px] h-[520px] rounded-[36px]'
            : 'w-full max-w-[430px] h-[870px]'
        }`}
        style={{
          boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.08), 0 25px 60px -15px rgba(0, 0, 0, 0.9)',
        }}
      >
        {/* Android Hardware Power Button on Right Chassis Side */}
        <div
          onClick={() => {
            setIsPhoneLocked(!isPhoneLocked);
            setIsNotificationShadeOpen(false);
          }}
          className="absolute -right-2 top-28 w-2 h-12 bg-zinc-700 hover:bg-zinc-500 rounded-r-md cursor-pointer z-50 transition-colors"
          title="Hardware Power / Lock Key"
        />

        {/* Android Punch Hole Camera */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-black border border-zinc-800 shadow-inner flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
          </div>
        </div>

        {/* Android Status Bar (Click to toggle Notification Shade) */}
        <div
          onClick={() => {
            if (!isPhoneLocked) {
              setIsNotificationShadeOpen(!isNotificationShadeOpen);
            }
          }}
          className="h-7 w-full px-6 flex items-center justify-between text-xs text-zinc-300 bg-black/90 backdrop-blur-sm shrink-0 z-40 select-none cursor-pointer hover:bg-zinc-900 transition-colors"
          title="Tap status bar to pull down notifications"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wide text-[11px] font-mono text-white">
              {currentTimeStr}
            </span>
            {audioState.currentTrack && (
              <span className="flex items-center gap-1 text-[10px] text-zinc-300">
                <Music className="w-3 h-3 text-white animate-pulse" />
                <span className="truncate max-w-[70px]">{audioState.currentTrack.title}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-zinc-300">
            <Signal className="w-3 h-3" />
            <span className="text-[10px] font-mono font-medium">5G</span>
            <Wifi className="w-3 h-3" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] font-mono font-medium">94%</span>
              <BatteryMedium className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </div>

        {/* Notification Shade Drawer Overlay (When user pulls down) */}
        {isNotificationShadeOpen && !isPhoneLocked && (
          <div className="absolute inset-x-0 top-7 z-40 bg-zinc-950/98 backdrop-blur-2xl border-b border-zinc-800 p-4 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-top duration-200">
            {/* Quick Settings Tiles */}
            <div className="grid grid-cols-4 gap-2 pb-2 border-b border-zinc-800">
              <div className="p-2.5 rounded-2xl bg-white text-black font-semibold flex flex-col items-center justify-center gap-1">
                <Wifi className="w-4 h-4" />
                <span className="text-[10px] font-medium">Wi-Fi</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white flex flex-col items-center justify-center gap-1">
                <Volume2 className="w-4 h-4 text-zinc-300" />
                <span className="text-[10px] font-medium">Sound</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white flex flex-col items-center justify-center gap-1">
                <Bell className="w-4 h-4 text-zinc-300" />
                <span className="text-[10px] font-medium">Alerts</span>
              </div>
              <div
                onClick={() => {
                  setIsPhoneLocked(true);
                  setIsNotificationShadeOpen(false);
                }}
                className="p-2.5 rounded-2xl bg-zinc-800 text-white flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-zinc-700"
              >
                <Lock className="w-4 h-4" />
                <span className="text-[10px] font-medium">Lock</span>
              </div>
            </div>

            {/* Notification Media Player Card */}
            {audioState.currentTrack ? (
              renderMediaNotificationCard(false)
            ) : (
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center text-xs text-zinc-400">
                No active media playback
              </div>
            )}

            {/* Close Shade Pill */}
            <div
              onClick={() => setIsNotificationShadeOpen(false)}
              className="pt-1 flex items-center justify-center cursor-pointer text-zinc-500 hover:text-white"
            >
              <ChevronUp className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Inner Phone Screen Canvas or Phone Lock Screen */}
        <div className="flex-1 w-full overflow-hidden flex flex-col relative bg-black">
          {isPhoneLocked ? (
            /* Monochrome Android Lock Screen UI */
            <div className="flex-1 w-full h-full relative flex flex-col justify-between p-6 select-none bg-black overflow-hidden animate-in fade-in duration-200">
              {/* Subtle ambient backdrop */}
              {audioState.currentTrack && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-15 filter blur-3xl grayscale pointer-events-none"
                  style={{ backgroundImage: `url(${audioState.currentTrack.thumbnailUrl})` }}
                />
              )}

              {/* Lock Screen Header Clock */}
              <div className="flex flex-col items-center pt-8 z-10 text-center">
                <Lock className="w-5 h-5 text-zinc-500 mb-2" />
                <h1 className="text-6xl font-extralight tracking-tight text-white font-sans">
                  {currentTimeStr}
                </h1>
                <p className="text-sm font-medium text-zinc-400 mt-1">{currentDateStr}</p>
              </div>

              {/* Lock Screen Media Widget (Music plays when locked!) */}
              <div className="my-auto z-10 w-full max-w-sm mx-auto">
                {audioState.currentTrack ? (
                  renderMediaNotificationCard(true)
                ) : (
                  <div className="text-center text-xs text-zinc-600">
                    PlayThat! Background Audio Engine Standby
                  </div>
                )}
              </div>

              {/* Lock Screen Bottom Swipe to Unlock */}
              <div className="flex flex-col items-center gap-3 pb-2 z-10">
                <button
                  onClick={() => setIsPhoneLocked(false)}
                  className="w-full py-3 px-6 rounded-full bg-white text-black hover:bg-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Tap to Unlock</span>
                </button>
                <span className="text-[11px] text-zinc-500">
                  {audioState.isPlaying
                    ? 'Music is playing in background'
                    : 'Device locked'}
                </span>
              </div>
            </div>
          ) : (
            /* Running App Canvas */
            children
          )}
        </div>

        {/* Android Navigation Gesture Pill */}
        <div className="h-5 w-full flex items-center justify-center bg-black shrink-0 z-40 select-none">
          <div
            onClick={() => {
              if (isPhoneLocked) setIsPhoneLocked(false);
            }}
            className="w-32 h-1 bg-zinc-700 rounded-full hover:bg-zinc-400 transition-colors cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
