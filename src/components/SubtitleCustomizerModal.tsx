import React, { useState } from 'react';
import { X, Upload, RotateCcw, Type, Palette, AlignVerticalSpaceAround } from 'lucide-react';
import { SubtitleSettings, SubtitleTrack } from '../types';
import { parseSRT, parseVTT } from '../services/subtitleParser';

interface SubtitleCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SubtitleSettings;
  onUpdateSettings: (newSettings: SubtitleSettings) => void;
  onAddCustomTrack?: (track: SubtitleTrack) => void;
}

const COLOR_OPTIONS = [
  { label: 'Pure White', value: '#ffffff' },
  { label: 'Light Silver', value: '#e4e4e7' },
  { label: 'Classic MX Yellow', value: '#facc15' },
  { label: 'Neutral Slate', value: '#a1a1aa' },
  { label: 'Charcoal Grey', value: '#52525b' },
];

const BG_OPTIONS = [
  { label: 'Semi-Dark (75%)', value: 'rgba(0, 0, 0, 0.75)' },
  { label: 'Subtle Dark (40%)', value: 'rgba(0, 0, 0, 0.40)' },
  { label: 'Solid Black (100%)', value: 'rgba(0, 0, 0, 1.0)' },
  { label: 'Transparent', value: 'rgba(0, 0, 0, 0.0)' },
];

export const SubtitleCustomizerModal: React.FC<SubtitleCustomizerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onAddCustomTrack,
}) => {
  const [activeTab, setActiveTab] = useState<'style' | 'sync' | 'import'>('style');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const isSrt = file.name.endsWith('.srt');
      const format = isSrt ? 'srt' : 'vtt';
      const cues = isSrt ? parseSRT(text) : parseVTT(text);

      if (cues.length === 0) {
        setImportStatus('No valid subtitle cues detected in file.');
        return;
      }

      const newTrack: SubtitleTrack = {
        id: `custom-sub-${Date.now()}`,
        label: file.name.replace(/\.[^/.]+$/, ''),
        language: 'Custom',
        format,
        cues,
      };

      if (onAddCustomTrack) {
        onAddCustomTrack(newTrack);
        setImportStatus(`Successfully loaded ${cues.length} cues from ${file.name}`);
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    onUpdateSettings({
      fontSize: 20,
      textColor: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      outlineColor: '#000000',
      outlineWidth: 2,
      verticalOffset: 8,
      delayMs: 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 text-white">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-850">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Subtitle Configuration</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
              Live Preview
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleResetDefaults}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Reset to defaults"
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

        {/* Live Subtitle Preview Box in Black, White, and Grey */}
        <div className="relative h-28 bg-black border-b border-zinc-850 flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/30 to-transparent pointer-events-none" />
          <div
            className="px-4 py-1.5 rounded-lg transition-all text-center select-none shadow-md font-sans font-bold"
            style={{
              fontSize: `${Math.min(24, Math.max(14, settings.fontSize))}px`,
              color: settings.textColor,
              backgroundColor: settings.backgroundColor,
              WebkitTextStroke:
                settings.outlineWidth > 0
                  ? `${settings.outlineWidth}px ${settings.outlineColor}`
                  : 'none',
            }}
          >
            PlayThat! Custom Subtitle Engine
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center px-6 pt-4 gap-2 border-b border-zinc-850">
          <button
            onClick={() => setActiveTab('style')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'style'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Appearance
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'sync'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Time Delay & Sync
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Import File (.srt / .vtt)
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto max-h-[380px] flex flex-col gap-5">
          {activeTab === 'style' && (
            <>
              {/* Font Size Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-medium text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <Type className="w-4 h-4 text-zinc-400" />
                    Font Size
                  </span>
                  <span className="font-mono font-bold text-white">{settings.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={14}
                  max={34}
                  value={settings.fontSize}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, fontSize: parseInt(e.target.value, 10) })
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              {/* Text Color Selection */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-zinc-400" />
                  Text Color
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => onUpdateSettings({ ...settings, textColor: c.value })}
                      className={`h-9 rounded-xl border flex items-center justify-center transition-transform active:scale-95 ${
                        settings.textColor === c.value
                          ? 'border-white ring-2 ring-white/50 scale-105'
                          : 'border-zinc-700 hover:border-zinc-500'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Background Box Opacity */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-zinc-300">Background Shading</span>
                <div className="grid grid-cols-2 gap-2">
                  {BG_OPTIONS.map((bg) => (
                    <button
                      key={bg.value}
                      onClick={() => onUpdateSettings({ ...settings, backgroundColor: bg.value })}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border text-left transition-colors ${
                        settings.backgroundColor === bg.value
                          ? 'bg-zinc-800 border-zinc-600 text-white font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-white'
                      }`}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vertical Position */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-medium text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <AlignVerticalSpaceAround className="w-4 h-4 text-zinc-400" />
                    Distance from Bottom
                  </span>
                  <span className="font-mono text-white">{settings.verticalOffset}%</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={35}
                  value={settings.verticalOffset}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, verticalOffset: parseInt(e.target.value, 10) })
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
            </>
          )}

          {activeTab === 'sync' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-300">Audio/Subtitle Sync Delay</span>
                  <span className="font-mono text-sm font-bold text-white">
                    {settings.delayMs > 0 ? `+${settings.delayMs}` : settings.delayMs} ms
                  </span>
                </div>

                <input
                  type="range"
                  min={-5000}
                  max={5000}
                  step={100}
                  value={settings.delayMs}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, delayMs: parseInt(e.target.value, 10) })
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white my-2"
                />

                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Subtitles Appear Earlier</span>
                  <span>Subtitles Appear Later</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[-500, -100, 100, 500].map((step) => (
                  <button
                    key={step}
                    onClick={() => onUpdateSettings({ ...settings, delayMs: settings.delayMs + step })}
                    className="py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-mono font-semibold text-zinc-200 transition-colors"
                  >
                    {step > 0 ? `+${step}ms` : `${step}ms`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="flex flex-col gap-4">
              <label className="p-8 border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-zinc-900/50">
                <Upload className="w-8 h-8 text-zinc-400 mb-1" />
                <span className="text-xs font-semibold text-white">Click or drag subtitle file</span>
                <span className="text-[11px] text-zinc-400">Supports .srt and .vtt subtitle formats</span>
                <input
                  type="file"
                  accept=".srt,.vtt,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {importStatus && (
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-white">
                  {importStatus}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-850 bg-zinc-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
