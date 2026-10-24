import React, { useState, useEffect } from 'react';
import { Download, Folder, FolderEdit, X, FileVideo } from 'lucide-react';

export interface DownloadPromptData {
  url: string;
  title: string;
  defaultFileName?: string;
  defaultSavePath?: string;
  type: string;
  estimatedSize?: string;
  resolution?: string;
}

interface DownloadPromptModalProps {
  isOpen: boolean;
  data: DownloadPromptData | null;
  onClose: () => void;
  onConfirm: (confirmed: { title: string; savePath: string; url: string }) => void;
}

const PRESET_PATHS = [
  '/Internal Storage/Download/PlayThat/',
  '/Internal Storage/Movies/PlayThat/',
  '/Internal Storage/Stream Captures/',
  '/Internal Storage/DCIM/Camera/',
  '/SD Card/PlayThat/Downloads/',
];

export const DownloadPromptModal: React.FC<DownloadPromptModalProps> = ({
  isOpen,
  data,
  onClose,
  onConfirm,
}) => {
  const [title, setTitle] = useState<string>('');
  const [selectedPath, setSelectedPath] = useState<string>(PRESET_PATHS[0]);
  const [isCustomPath, setIsCustomPath] = useState<boolean>(false);
  const [customPath, setCustomPath] = useState<string>('/Internal Storage/Custom/');

  useEffect(() => {
    if (data) {
      setTitle(data.defaultFileName || data.title);
      setSelectedPath(data.defaultSavePath || PRESET_PATHS[0]);
      setIsCustomPath(false);
    }
  }, [data]);

  if (!isOpen || !data) return null;

  const currentPath = isCustomPath ? customPath : selectedPath;
  const sanitizedTitle = title.trim() || data.defaultFileName || data.title;
  const fullDestination = `${currentPath.replace(/\/?$/, '/')}${sanitizedTitle}`;

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      title: sanitizedTitle,
      savePath: currentPath,
      url: data.url,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Download Confirmation
              </h3>
              <span className="text-[10px] text-zinc-400 font-mono">
                Verify file name & destination before downloading
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prompt Body */}
        <form onSubmit={handleStart} className="p-6 flex flex-col gap-4">
          {/* File Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <FileVideo className="w-3.5 h-3.5 text-white" />
              File Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-zinc-400 transition-colors"
            />
          </div>

          {/* Download Path & Folder Selection */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-zinc-400" />
                Storage Destination Path
              </label>
              <button
                type="button"
                onClick={() => setIsCustomPath(!isCustomPath)}
                className="text-[11px] text-zinc-300 hover:text-white hover:underline flex items-center gap-1 font-medium"
              >
                <FolderEdit className="w-3 h-3" />
                <span>{isCustomPath ? 'Use Presets' : 'Custom Path...'}</span>
              </button>
            </div>

            {isCustomPath ? (
              <input
                type="text"
                required
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder="/Internal Storage/MyFolder/"
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-zinc-400"
              />
            ) : (
              <select
                value={selectedPath}
                onChange={(e) => setSelectedPath(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-400 cursor-pointer"
              >
                {PRESET_PATHS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Destination Path Preview Box */}
          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col gap-1">
            <span className="text-[10px] uppercase font-mono text-zinc-500">
              Target Save Location:
            </span>
            <span className="text-xs font-mono text-white break-all">
              {fullDestination}
            </span>
            <div className="mt-1 pt-1.5 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400">
              <span>Format: {data.type.toUpperCase()}</span>
              <span>Turbo Acceleration Ready</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Start Download</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
