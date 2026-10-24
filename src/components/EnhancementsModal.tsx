import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  Headphones,
  RotateCcw,
  X,
  Moon,
  Tv,
} from 'lucide-react';
import { DecoderMode, AspectRatioMode } from '../types';

export interface EnhancementConfig {
  // Video Enhancements
  contrast: number; // 80 to 140 (%)
  saturation: number; // 80 to 150 (%)
  sharpnessPreset: 'natural' | 'crisp' | 'vivid' | 'hdr_tone';
  nightMode: boolean;
  decoder: DecoderMode;
  aspectRatio: AspectRatioMode;

  // Audio Enhancements
  volumeBoost: number; // 100 to 200 (%)
  bassBoost: boolean;
  vocalClarity: boolean;
  spatialStereo: boolean;
  equalizerPreset: 'flat' | 'movie' | 'dialogue' | 'bass' | 'rock' | 'concert';
  audioDelayMs: number; // -1000 to +1000 ms

  // System & Typography
  fontScale: 'standard' | 'large' | 'xlarge';
}

export const DEFAULT_ENHANCEMENTS: EnhancementConfig = {
  contrast: 105,
  saturation: 110,
  sharpnessPreset: 'crisp',
  nightMode: false,
  decoder: 'HW+',
  aspectRatio: 'fit',
  volumeBoost: 120,
  bassBoost: true,
  vocalClarity: true,
  spatialStereo: true,
  equalizerPreset: 'movie',
  audioDelayMs: 0,
  fontScale: 'large',
};

interface EnhancementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EnhancementConfig;
  onChange: (config: EnhancementConfig) => void;
}

export const EnhancementsModal: React.FC<EnhancementsModalProps> = ({
  isOpen,
  onClose,
  config,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');

  if (!isOpen) return null;

  const handleReset = () => {
    onChange(DEFAULT_ENHANCEMENTS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 text-white">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Audio & Video Enhancement Studio
              </h3>
              <span className="text-[10px] text-zinc-400 font-mono">
                MX Player Engine · Hardware DSP Pipeline
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Reset Enhancements to Default"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center px-6 pt-3 gap-2 border-b border-zinc-850">
          <button
            onClick={() => setActiveTab('video')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'video'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Video Enhancements</span>
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'audio'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Audio & Equalizer</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto max-h-[460px] flex flex-col gap-5">
          {activeTab === 'video' ? (
            /* VIDEO ENHANCEMENTS */
            <>
              {/* Decoder Mode Selector */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-medium text-zinc-300">
                  <span>Hardware Decoder Mode</span>
                  <span className="font-mono text-orange-400 font-bold">{config.decoder}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { mode: 'HW', label: 'HW (Native GPU)', desc: 'Lowest battery usage' },
                    { mode: 'HW+', label: 'HW+ (Enhanced)', desc: 'Dynamic HDR & Sharpness' },
                    { mode: 'SW', label: 'SW (Software)', desc: 'Compatibility filter' },
                  ].map((d) => (
                    <button
                      key={d.mode}
                      onClick={() => onChange({ ...config, decoder: d.mode as DecoderMode })}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                        config.decoder === d.mode
                          ? 'bg-zinc-900 border-orange-500/60 text-white shadow-sm ring-1 ring-orange-500/30'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span className={`text-xs font-bold ${config.decoder === d.mode ? 'text-orange-400' : 'text-white'}`}>{d.label}</span>
                      <span className="text-[10px] text-zinc-400">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Sharpness Profile */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-zinc-300">Visual Quality Preset</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'natural', label: 'Natural' },
                    { id: 'crisp', label: 'Crisp Detail' },
                    { id: 'vivid', label: 'Vivid Pop' },
                    { id: 'hdr_tone', label: 'HDR Sim' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onChange({ ...config, sharpnessPreset: p.id as any })}
                      className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-colors ${
                        config.sharpnessPreset === p.id
                          ? 'bg-orange-500 text-black font-bold border-orange-500 shadow-sm'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contrast Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-zinc-300">
                  <span>Dynamic Contrast Boost</span>
                  <span className="font-mono text-orange-400">{config.contrast}%</span>
                </div>
                <input
                  type="range"
                  min={80}
                  max={140}
                  value={config.contrast}
                  onChange={(e) =>
                    onChange({ ...config, contrast: parseInt(e.target.value, 10) })
                  }
                  className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>

              {/* Saturation Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-zinc-300">
                  <span>Color Saturation & Vibrance</span>
                  <span className="font-mono text-orange-400">{config.saturation}%</span>
                </div>
                <input
                  type="range"
                  min={80}
                  max={150}
                  value={config.saturation}
                  onChange={(e) =>
                    onChange({ ...config, saturation: parseInt(e.target.value, 10) })
                  }
                  className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>

              {/* Night Comfort Mode Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <Moon className="w-4 h-4 text-zinc-400" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white">Night Comfort Eye Care</span>
                    <span className="text-[10px] text-zinc-400">Warm color filter to reduce blue eye strain</span>
                  </div>
                </div>

                <button
                  onClick={() => onChange({ ...config, nightMode: !config.nightMode })}
                  className={`w-11 h-6 rounded-full transition-colors p-1 ${
                    config.nightMode ? 'bg-white' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full transition-transform ${
                      config.nightMode ? 'bg-black translate-x-5' : 'bg-white translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </>
          ) : (
            /* AUDIO & EQUALIZER */
            <>
              {/* MX Volume Boost (Up to 200%) */}
              <div className="flex flex-col gap-2 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                <div className="flex items-center justify-between text-xs font-medium text-zinc-200">
                  <span className="flex items-center gap-1.5 font-bold text-white">
                    <Volume2 className="w-4 h-4 text-white" />
                    MX Player 200% Super Volume Boost
                  </span>
                  <span className="font-mono font-bold text-white text-sm">
                    {config.volumeBoost}%
                  </span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={200}
                  step={5}
                  value={config.volumeBoost}
                  onChange={(e) =>
                    onChange({ ...config, volumeBoost: parseInt(e.target.value, 10) })
                  }
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white mt-1"
                />
                <span className="text-[10px] text-zinc-400">
                  Web Audio compressor protects hardware speakers while amplifying dialogue and low-gain audio.
                </span>
              </div>

              {/* Sound Enhancer Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { key: 'vocalClarity', label: 'Clear Voice', desc: 'Boost dialogue frequencies' },
                  { key: 'bassBoost', label: 'Bass Boost', desc: 'Deep sub-bass punch' },
                  { key: 'spatialStereo', label: '3D Spatial', desc: 'Expanded stereo field' },
                ].map((item) => {
                  const active = (config as any)[item.key];
                  return (
                    <button
                      key={item.key}
                      onClick={() => onChange({ ...config, [item.key]: !active })}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        active
                          ? 'bg-zinc-900 border-zinc-600 text-white shadow-sm ring-1 ring-white/20'
                          : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-bold text-white">{item.label}</span>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            active ? 'bg-white' : 'bg-zinc-700'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-400">{item.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Equalizer Presets */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-zinc-300">DSP Equalizer Profile</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'movie', label: 'Cinema Movie' },
                    { id: 'dialogue', label: 'Vocal Clarity' },
                    { id: 'bass', label: 'Heavy Bass' },
                    { id: 'rock', label: 'Rock & Live' },
                    { id: 'concert', label: 'Concert Hall' },
                    { id: 'flat', label: 'Flat Studio' },
                  ].map((eq) => (
                    <button
                      key={eq.id}
                      onClick={() => onChange({ ...config, equalizerPreset: eq.id as any })}
                      className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-colors ${
                        config.equalizerPreset === eq.id
                          ? 'bg-white text-black font-bold border-white'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {eq.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-850 bg-zinc-950 flex items-center justify-between">
          <span className="text-[11px] font-mono text-zinc-500">
            Real-time DSP applied
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold transition-colors shadow-sm"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
