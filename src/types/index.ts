export type DecoderMode = 'HW' | 'HW+' | 'SW';

export type AspectRatioMode = 'fit' | 'stretch' | '16:9' | '4:3' | 'original' | 'zoom';

export interface MediaItem {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  mediaType?: 'video' | 'audio';
  folder: string;
  sourceType: 'local' | 'stream' | 'downloaded';
  url: string;
  blobKey?: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  currentTime: number; // in seconds
  resolution: string; // e.g., '4K UHD', '1080p', '720p'
  fileSize: number; // in bytes
  codec: string; // e.g., 'H.264 / AAC', 'HEVC', 'AV1'
  decoder: DecoderMode;
  createdAt: number;
  lastPlayedAt?: number;
  isFavorite: boolean;
  isEncrypted: boolean;
  subtitleUrl?: string;
  subtitleFormat?: 'srt' | 'vtt';
}

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  cues: SubtitleCue[];
  format: 'srt' | 'vtt';
}

export interface SubtitleSettings {
  fontSize: number; // in px: 14 to 36
  textColor: string; // hex or color name
  backgroundColor: string; // rgba
  outlineColor: string;
  outlineWidth: number; // 0 to 4
  verticalOffset: number; // percent from bottom: 4 to 35
  delayMs: number; // -5000 to +5000 ms
}

export type DownloadStatus = 'downloading' | 'paused' | 'completed' | 'error' | 'queued';

export interface DownloadTask {
  id: string;
  title: string;
  url: string;
  type: 'mp4' | 'm3u8' | 'webm';
  status: DownloadStatus;
  progress: number; // 0 to 100
  downloadedBytes: number;
  totalBytes: number;
  speedBytesPerSec: number;
  segmentsLoaded?: number;
  totalSegments?: number;
  createdAt: number;
  completedAt?: number;
  outputBlobUrl?: string;
  errorMessage?: string;
  thumbnailUrl?: string;
  duration?: number;
  savePath?: string;
}

export interface M3U8DownloadTask {
  id: string;
  title: string;
  manifestUrl: string;
  totalSegments: number;
  downloadedSegments: number;
  status: 'idle' | 'sniffing' | 'downloading' | 'muxing' | 'completed' | 'error';
  errorMessage?: string;
  speedKbps: number;
  outputBlobUrl?: string;
  outputSize?: number;
  downloadDate?: number;
  savePath?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  mediaIds: string[];
  createdAt: number;
  updatedAt: number;
}

export type ActiveTab = 'folders' | 'browser' | 'downloads' | 'playlists' | 'settings' | 'vault';
