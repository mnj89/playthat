import React, { useState } from 'react';
import {
  ArrowLeft,
  Smartphone,
  PlayCircle,
  Headphones,
  ArrowDownToLine,
  Subtitles,
  ShieldCheck,
  Info,
  ChevronRight,
  Check,
  Moon,
  Tv,
  Zap,
  Volume2,
  Lock,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { ActiveTab } from '../types';
import { EnhancementConfig } from './EnhancementsModal';
import { FrameMode } from './AndroidFrame';

export interface SettingsViewProps {
  onBack: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  frameMode: FrameMode;
  onChangeFrameMode: (mode: FrameMode) => void;
  enhancementConfig: EnhancementConfig;
  onUpdateEnhancements: (config: EnhancementConfig) => void;
  onOpenSubtitlesModal: () => void;
  onOpenVaultModal: () => void;
  onShowToast: (msg: string) => void;
}

type SubSection = 'main' | 'general' | 'video' | 'audio' | 'downloads' | 'about';

export function SettingsView({
  onBack,
  isDarkMode,
  onToggleDarkMode,
  frameMode,
  onChangeFrameMode,
  enhancementConfig,
  onUpdateEnhancements,
  onOpenSubtitlesModal,
  onOpenVaultModal,
  onShowToast,
}: SettingsViewProps) {
  const [activeSection, setActiveSection] = useState<SubSection>('main');

  // Downloads Settings persistent state
  const [downloadPath, setDownloadPath] = useState<string>(() => {
    return localStorage.getItem('playthat_download_path') || '/storage/emulated/0/Download/PlayThat/';
  });
  const [maxConcurrentDownloads, setMaxConcurrentDownloads] = useState<number>(() => {
    return parseInt(localStorage.getItem('playthat_max_downloads') || '3', 10);
  });
  const [askPathBeforeDownload, setAskPathBeforeDownload] = useState<boolean>(() => {
    return localStorage.getItem('playthat_ask_path') !== 'false';
  });
  const [turboBoostEnabled, setTurboBoostEnabled] = useState<boolean>(() => {
    return localStorage.getItem('playthat_turbo_boost') !== 'false';
  });
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English (United States)');
  const [autoResumePlayback, setAutoResumePlayback] = useState<boolean>(true);
  const [backgroundAudioPlay, setBackgroundAudioPlay] = useState<boolean>(true);

  const handleUpdateDownloadPath = (newPath: string) => {
    setDownloadPath(newPath);
    localStorage.setItem('playthat_download_path', newPath);
    onShowToast(`Download path updated to ${newPath}`);
  };

  const handleToggleAskPath = () => {
    const val = !askPathBeforeDownload;
    setAskPathBeforeDownload(val);
    localStorage.setItem('playthat_ask_path', String(val));
    onShowToast(val ? 'Will ask path before downloading' : 'Auto-save to default path');
  };

  const handleToggleTurbo = () => {
    const val = !turboBoostEnabled;
    setTurboBoostEnabled(val);
    localStorage.setItem('playthat_turbo_boost', String(val));
    onShowToast(val ? 'Turbo 8x acceleration enabled' : 'Standard single-stream download');
  };

  const handleClearHistory = () => {
    localStorage.removeItem('playthat_history');
    onShowToast('Playback history and cache cleared');
  };

  // Section Header Renderer (Monochrome: Black, White, Grey)
  const renderHeader = (title: string, onBackAction: () => void) => (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-850 bg-black/95 sticky top-0 z-20 backdrop-blur-md">
      <button
        onClick={onBackAction}
        className="p-2 -ml-1 text-zinc-300 hover:text-white rounded-full hover:bg-zinc-800 active:scale-95 transition-all"
        title="Go back"
        aria-label="Back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h2 className="text-base font-bold text-white tracking-wide">{title}</h2>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-black text-white overflow-y-auto select-none">
      {/* 1. Main Settings List (Matches Reference Screenshot in Black, White, and Grey) */}
      {activeSection === 'main' && (
        <div className="flex flex-col pb-8">
          {renderHeader('Settings', onBack)}

          <div className="flex flex-col divide-y divide-zinc-900">
            {/* General */}
            <button
              onClick={() => setActiveSection('general')}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-zinc-900/70 active:bg-zinc-900 text-left transition-colors group"
            >
              <div className="flex items-center gap-4">
                <Smartphone className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">General</span>
                  <span className="text-xs text-zinc-400">Language, History, System Font Scale</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
            </button>

            {/* Video */}
            <button
              onClick={() => setActiveSection('video')}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-zinc-900/70 active:bg-zinc-900 text-left transition-colors group"
            >
              <div className="flex items-center gap-4">
                <PlayCircle className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">Video</span>
                  <span className="text-xs text-zinc-400">
                    Pop-up play, HW/HW+ decoder, picture enhancements
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
            </button>

            {/* Audio */}
            <button
              onClick={() => setActiveSection('audio')}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-zinc-900/70 active:bg-zinc-900 text-left transition-colors group"
            >
              <div className="flex items-center gap-4">
                <Headphones className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">Audio</span>
                  <span className="text-xs text-zinc-400">
                    Volume boost 200%, clear voice, bass boost, equalizer
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
            </button>

            {/* Downloads */}
            <button
              onClick={() => setActiveSection('downloads')}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-zinc-900/70 active:bg-zinc-900 text-left transition-colors group"
            >
              <div className="flex items-center gap-4">
                <ArrowDownToLine className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">Downloads</span>
                  <span className="text-xs text-zinc-400">Path, max download tasks, UC turbo boost</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
            </button>

            {/* Subtitles */}
            <button
              onClick={onOpenSubtitlesModal}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-zinc-900/70 active:bg-zinc-900 text-left transition-colors group"
            >
              <div className="flex items-center gap-4">
                <Subtitles className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">Subtitles</span>
                  <span className="text-xs text-zinc-400">Appearance, font size, background box, sync delay</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
            </button>

            {/* Security & Private Vault */}
            <button
              onClick={onOpenVaultModal}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-zinc-900/70 active:bg-zinc-900 text-left transition-colors group"
            >
              <div className="flex items-center gap-4">
                <ShieldCheck className="w-5 h-5 text-orange-400 group-hover:text-orange-300 transition-colors shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">
                    Security & Private Vault
                  </span>
                  <span className="text-xs text-zinc-400">
                    AES-256-GCM encryption, Fingerprint, Pattern, PIN & calculator disguise
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
            </button>

            {/* About us */}
            <button
              onClick={() => setActiveSection('about')}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-zinc-900/70 active:bg-zinc-900 text-left transition-colors group"
            >
              <div className="flex items-center gap-4">
                <Info className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">About us</span>
                  <span className="text-xs text-zinc-400">PlayThat! PRO v2.4, acceleration engine & build info</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* 2. General Settings Subpage */}
      {activeSection === 'general' && (
        <div className="flex flex-col pb-8">
          {renderHeader('General', () => setActiveSection('main'))}

          <div className="p-4 flex flex-col gap-6">
            {/* System Adaptive Font Size */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                System Adaptive Font Size
              </label>
              <p className="text-xs text-zinc-400">
                Scales interface labels and player typography dynamically to match your device preference.
              </p>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {(['standard', 'large', 'xlarge'] as const).map((scale) => (
                  <button
                    key={scale}
                    onClick={() => {
                      onUpdateEnhancements({ ...enhancementConfig, fontScale: scale });
                      onShowToast(`Font scale set to ${scale.toUpperCase()}`);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      enhancementConfig.fontScale === scale
                        ? 'bg-orange-500 text-black border-orange-500 font-bold shadow-md shadow-orange-500/20'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {scale === 'standard' && <span>Standard (100%)</span>}
                    {scale === 'large' && <span>Large (115%)</span>}
                    {scale === 'xlarge' && <span>Extra Large (130%)</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Mockup Frame */}
            <div className="flex flex-col gap-2 border-t border-zinc-850 pt-4">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Device Layout & Viewport Frame
              </label>
              <p className="text-xs text-zinc-400">
                Switch between full responsive browser view or authentic Android device frames.
              </p>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <button
                  onClick={() => {
                    onChangeFrameMode('phone');
                    onShowToast('Phone frame mode active');
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    frameMode === 'phone'
                      ? 'bg-orange-500 text-black border-orange-500 font-bold shadow-md shadow-orange-500/20'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Phone</span>
                </button>
                <button
                  onClick={() => {
                    onChangeFrameMode('tablet');
                    onShowToast('Tablet frame mode active');
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    frameMode === 'tablet'
                      ? 'bg-orange-500 text-black border-orange-500 font-bold shadow-md shadow-orange-500/20'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Tv className="w-4 h-4" />
                  <span>Tablet</span>
                </button>
                <button
                  onClick={() => {
                    onChangeFrameMode('responsive');
                    onShowToast('Responsive full view active');
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    frameMode === 'responsive'
                      ? 'bg-orange-500 text-black border-orange-500 font-bold shadow-md shadow-orange-500/20'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>Full</span>
                </button>
              </div>
            </div>

            {/* App Language */}
            <div className="flex flex-col gap-2 border-t border-zinc-850 pt-4">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Language
              </label>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800/80">
                {['English (United States)', 'Español (Latinoamérica)', 'Deutsch (Deutschland)', 'Français (France)', '日本語 (Japan)'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setSelectedLanguage(lang);
                      onShowToast(`Language set to ${lang}`);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-left text-zinc-300 hover:bg-zinc-800"
                  >
                    <span>{lang}</span>
                    {selectedLanguage === lang && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Cache & History */}
            <div className="flex flex-col gap-2 border-t border-zinc-850 pt-4">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                History & Storage
              </label>
              <button
                onClick={handleClearHistory}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Playback History & Cache</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Video Settings Subpage */}
      {activeSection === 'video' && (
        <div className="flex flex-col pb-8">
          {renderHeader('Video', () => setActiveSection('main'))}

          <div className="p-4 flex flex-col gap-6">
            {/* Decoder Engine */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Hardware Decoder Mode
                </label>
                <span className="text-[11px] font-mono text-white font-bold">{enhancementConfig.decoder}</span>
              </div>
              <p className="text-xs text-zinc-400">
                HW+ employs direct WebCodecs GPU acceleration with custom rendering filters.
              </p>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {(['HW+', 'HW', 'SW'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      onUpdateEnhancements({ ...enhancementConfig, decoder: mode });
                      onShowToast(`Decoder switched to ${mode}`);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      enhancementConfig.decoder === mode
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span>{mode}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Contrast & Saturation */}
            <div className="flex flex-col gap-3 border-t border-zinc-850 pt-4">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Display Picture Adjustments
              </label>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Dynamic Contrast</span>
                  <span className="font-mono text-white">{enhancementConfig.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="140"
                  value={enhancementConfig.contrast}
                  onChange={(e) =>
                    onUpdateEnhancements({ ...enhancementConfig, contrast: Number(e.target.value) })
                  }
                  className="w-full accent-white cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Color Saturation</span>
                  <span className="font-mono text-white">{enhancementConfig.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="150"
                  value={enhancementConfig.saturation}
                  onChange={(e) =>
                    onUpdateEnhancements({ ...enhancementConfig, saturation: Number(e.target.value) })
                  }
                  className="w-full accent-white cursor-pointer"
                />
              </div>
            </div>

            {/* Sharpness & Night Mode */}
            <div className="flex flex-col gap-3 border-t border-zinc-850 pt-4">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Video Picture Profile
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['natural', 'crisp', 'vivid', 'hdr_tone'] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      onUpdateEnhancements({ ...enhancementConfig, sharpnessPreset: preset });
                      onShowToast(`Picture preset: ${preset.toUpperCase()}`);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                      enhancementConfig.sharpnessPreset === preset
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {preset.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Night Comfort Mode */}
              <button
                onClick={() => {
                  const val = !enhancementConfig.nightMode;
                  onUpdateEnhancements({ ...enhancementConfig, nightMode: val });
                  onShowToast(val ? 'Night comfort filter ON' : 'Night comfort filter OFF');
                }}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                  enhancementConfig.nightMode
                    ? 'bg-zinc-800 border-zinc-600 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-zinc-300" />
                  <span>Night Comfort Filter</span>
                </div>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    enhancementConfig.nightMode ? 'bg-white' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      enhancementConfig.nightMode ? 'bg-black translate-x-4' : 'bg-white translate-x-0'
                    }`}
                  />
                </div>
              </button>
            </div>

            {/* Playback Behaviors */}
            <div className="flex flex-col gap-2 border-t border-zinc-850 pt-4">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Playback Behavior
              </label>

              <button
                onClick={() => {
                  setAutoResumePlayback(!autoResumePlayback);
                  onShowToast(autoResumePlayback ? 'Auto-resume turned OFF' : 'Auto-resume turned ON');
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300"
              >
                <span>Resume playback from last position</span>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    autoResumePlayback ? 'bg-white' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      autoResumePlayback ? 'bg-black translate-x-4' : 'bg-white translate-x-0'
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Audio Settings Subpage */}
      {activeSection === 'audio' && (
        <div className="flex flex-col pb-8">
          {renderHeader('Audio', () => setActiveSection('main'))}

          <div className="p-4 flex flex-col gap-6">
            {/* 200% Volume Boost */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  MX Volume Boost (Up to 200%)
                </label>
                <span className="text-[11px] font-mono text-white font-bold">
                  {enhancementConfig.volumeBoost}%
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Web Audio gain node boosts playback beyond hardware 100% limit with dynamic limiter.
              </p>
              <input
                type="range"
                min="100"
                max="200"
                step="5"
                value={enhancementConfig.volumeBoost}
                onChange={(e) =>
                  onUpdateEnhancements({ ...enhancementConfig, volumeBoost: Number(e.target.value) })
                }
                className="w-full accent-white cursor-pointer mt-1"
              />
            </div>

            {/* Vocal Clarity, Bass Boost, Spatial Stereo */}
            <div className="flex flex-col gap-2 border-t border-zinc-850 pt-4">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Sound Enhancers
              </label>

              <button
                onClick={() => {
                  const val = !enhancementConfig.vocalClarity;
                  onUpdateEnhancements({ ...enhancementConfig, vocalClarity: val });
                  onShowToast(val ? 'Clear voice vocal clarity ON' : 'Clear voice vocal clarity OFF');
                }}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                  enhancementConfig.vocalClarity
                    ? 'bg-zinc-800 border-zinc-600 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                }`}
              >
                <span>Clear Voice (Speech Enhancer)</span>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    enhancementConfig.vocalClarity ? 'bg-white' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      enhancementConfig.vocalClarity ? 'bg-black translate-x-4' : 'bg-white translate-x-0'
                    }`}
                  />
                </div>
              </button>

              <button
                onClick={() => {
                  const val = !enhancementConfig.bassBoost;
                  onUpdateEnhancements({ ...enhancementConfig, bassBoost: val });
                  onShowToast(val ? 'Deep bass boost ON' : 'Deep bass boost OFF');
                }}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                  enhancementConfig.bassBoost
                    ? 'bg-zinc-800 border-zinc-600 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                }`}
              >
                <span>Deep Bass Boost</span>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    enhancementConfig.bassBoost ? 'bg-white' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      enhancementConfig.bassBoost ? 'bg-black translate-x-4' : 'bg-white translate-x-0'
                    }`}
                  />
                </div>
              </button>

              <button
                onClick={() => {
                  const val = !enhancementConfig.spatialStereo;
                  onUpdateEnhancements({ ...enhancementConfig, spatialStereo: val });
                  onShowToast(val ? '3D Spatial stereo ON' : '3D Spatial stereo OFF');
                }}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                  enhancementConfig.spatialStereo
                    ? 'bg-zinc-800 border-zinc-600 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                }`}
              >
                <span>3D Spatial Stereo</span>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    enhancementConfig.spatialStereo ? 'bg-white' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      enhancementConfig.spatialStereo ? 'bg-black translate-x-4' : 'bg-white translate-x-0'
                    }`}
                  />
                </div>
              </button>
            </div>

            {/* Equalizer Presets */}
            <div className="flex flex-col gap-2 border-t border-zinc-850 pt-4">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Equalizer Preset
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['movie', 'dialogue', 'bass', 'rock', 'concert', 'flat'] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      onUpdateEnhancements({ ...enhancementConfig, equalizerPreset: preset });
                      onShowToast(`Equalizer: ${preset.toUpperCase()}`);
                    }}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold capitalize transition-all ${
                      enhancementConfig.equalizerPreset === preset
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Play */}
            <div className="flex flex-col gap-2 border-t border-zinc-850 pt-4">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Background Playback
              </label>
              <button
                onClick={() => {
                  setBackgroundAudioPlay(!backgroundAudioPlay);
                  onShowToast(backgroundAudioPlay ? 'Background play OFF' : 'Background play ON');
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300"
              >
                <span>Continue audio when app is in background</span>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    backgroundAudioPlay ? 'bg-white' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      backgroundAudioPlay ? 'bg-black translate-x-4' : 'bg-white translate-x-0'
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Downloads Settings Subpage */}
      {activeSection === 'downloads' && (
        <div className="flex flex-col pb-8">
          {renderHeader('Downloads', () => setActiveSection('main'))}

          <div className="p-4 flex flex-col gap-6">
            {/* Storage Path */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Storage Path
              </label>
              <p className="text-xs text-zinc-400">
                Default Android storage directory where videos and M3U8 converted streams are saved.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={downloadPath}
                  onChange={(e) => setDownloadPath(e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-zinc-400"
                />
                <button
                  onClick={() => handleUpdateDownloadPath(downloadPath)}
                  className="px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs font-bold transition-colors"
                >
                  Save
                </button>
              </div>

              {/* Quick Preset Folders */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <button
                  onClick={() => handleUpdateDownloadPath('/storage/emulated/0/Download/PlayThat/')}
                  className="text-[11px] text-zinc-400 hover:text-white bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800 font-mono"
                >
                  Download/PlayThat/
                </button>
                <button
                  onClick={() => handleUpdateDownloadPath('/storage/emulated/0/Movies/PlayThat/')}
                  className="text-[11px] text-zinc-400 hover:text-white bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800 font-mono"
                >
                  Movies/PlayThat/
                </button>
                <button
                  onClick={() => handleUpdateDownloadPath('/storage/emulated/0/DCIM/PlayThat/')}
                  className="text-[11px] text-zinc-400 hover:text-white bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800 font-mono"
                >
                  DCIM/PlayThat/
                </button>
              </div>
            </div>

            {/* Prompt Path Before Starting */}
            <div className="flex flex-col gap-2 border-t border-zinc-850 pt-4">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Download Confirmation Rule
              </label>
              <button
                onClick={handleToggleAskPath}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:border-zinc-700 transition-colors"
              >
                <div className="flex flex-col text-left pr-2">
                  <span className="font-semibold text-white">Ask path before downloading starts</span>
                  <span className="text-[11px] text-zinc-400">
                    Never auto-start; present dialog to customize filename and path.
                  </span>
                </div>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                    askPathBeforeDownload ? 'bg-white' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      askPathBeforeDownload ? 'bg-black translate-x-4' : 'bg-white translate-x-0'
                    }`}
                  />
                </div>
              </button>
            </div>

            {/* UC Turbo Multi-threaded Boost */}
            <div className="flex flex-col gap-2 border-t border-zinc-850 pt-4">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Acceleration Engine
              </label>
              <button
                onClick={handleToggleTurbo}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:border-zinc-700 transition-colors"
              >
                <div className="flex flex-col text-left pr-2">
                  <span className="font-semibold text-white">UC Turbo 8-Chunk Boost</span>
                  <span className="text-[11px] text-zinc-400">
                    Splits MP4 and M3U8 downloads into parallel range threads.
                  </span>
                </div>
                <div
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                    turboBoostEnabled ? 'bg-white' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      turboBoostEnabled ? 'bg-black translate-x-4' : 'bg-white translate-x-0'
                    }`}
                  />
                </div>
              </button>
            </div>

            {/* Max Concurrent Tasks */}
            <div className="flex flex-col gap-2 border-t border-zinc-850 pt-4">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Max Concurrent Tasks
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      setMaxConcurrentDownloads(count);
                      localStorage.setItem('playthat_max_downloads', String(count));
                      onShowToast(`Max download tasks set to ${count}`);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                      maxConcurrentDownloads === count
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span>{count} Tasks</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. About Us Subpage */}
      {activeSection === 'about' && (
        <div className="flex flex-col pb-8">
          {renderHeader('About us', () => setActiveSection('main'))}

          <div className="p-4 flex flex-col gap-6">
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-xl mb-3">
                <PlayCircle className="w-10 h-10 text-white fill-white/10" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-wide">PlayThat! PRO</h3>
              <p className="text-xs text-zinc-400 mt-1">Version 2.4 (Build 2026.10 PRO Edition)</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px] font-semibold">
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Hardware Acceleration Active</span>
              </div>
            </div>

            <div className="flex flex-col divide-y divide-zinc-800 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-3.5 text-xs">
                <span className="text-zinc-400">Video Engine</span>
                <span className="font-mono text-zinc-200">HLS.js v1.5 + WebCodecs HW+</span>
              </div>
              <div className="flex items-center justify-between p-3.5 text-xs">
                <span className="text-zinc-400">Audio DSP</span>
                <span className="font-mono text-zinc-200">Web Audio API 200% Gain + DynamicsLimiter</span>
              </div>
              <div className="flex items-center justify-between p-3.5 text-xs">
                <span className="text-zinc-400">Downloader</span>
                <span className="font-mono text-zinc-200">UC Turbo 8-Chunk Range Fetcher</span>
              </div>
              <div className="flex items-center justify-between p-3.5 text-xs">
                <span className="text-zinc-400">Cryptographic Vault</span>
                <span className="font-mono text-zinc-200">WebCrypto AES-256-GCM / PBKDF2</span>
              </div>
              <div className="flex items-center justify-between p-3.5 text-xs">
                <span className="text-zinc-400">Tab Capacity</span>
                <span className="font-mono text-zinc-200">Up to 40 Multi-Tabs</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Community & Links
              </span>
              <a
                href="#github"
                onClick={(e) => {
                  e.preventDefault();
                  onShowToast('PlayThat! Open Source Community Project');
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-colors"
              >
                <span>Fans group, official website, pages & channel</span>
                <ExternalLink className="w-4 h-4 text-zinc-500" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
