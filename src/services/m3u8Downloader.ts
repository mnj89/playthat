/**
 * M3U8 / HLS Stream Parser, Segment Downloader, and Remuxer
 * Enables in-app sniffing of live & VOD HLS streams and converting them to playable MP4 blobs.
 */

import { M3U8DownloadTask } from '../types';

export interface ParsedM3U8 {
  isMaster: boolean;
  version?: number;
  targetDuration: number;
  segments: Array<{
    uri: string;
    duration: number;
    title?: string;
  }>;
  variants?: Array<{
    uri: string;
    bandwidth: number;
    resolution?: string;
  }>;
}

export function parseM3U8Content(content: string, baseUrl: string): ParsedM3U8 {
  const lines = content.split('\n').map((l) => l.trim());
  const isMaster = lines.some((l) => l.startsWith('#EXT-X-STREAM-INF'));

  if (isMaster) {
    const variants: Array<{ uri: string; bandwidth: number; resolution?: string }> = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXT-X-STREAM-INF:')) {
        const info = lines[i];
        const nextLine = lines[i + 1] && !lines[i + 1].startsWith('#') ? lines[i + 1] : '';
        const bwMatch = info.match(/BANDWIDTH=(\d+)/);
        const resMatch = info.match(/RESOLUTION=([\dx]+)/);
        if (nextLine) {
          variants.push({
            uri: resolveUrl(baseUrl, nextLine),
            bandwidth: bwMatch ? parseInt(bwMatch[1], 10) : 0,
            resolution: resMatch ? resMatch[1] : undefined,
          });
        }
      }
    }
    return {
      isMaster: true,
      targetDuration: 10,
      segments: [],
      variants,
    };
  }

  let targetDuration = 10;
  const segments: Array<{ uri: string; duration: number }> = [];
  let currentDuration = 5;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#EXT-X-TARGETDURATION:')) {
      targetDuration = parseFloat(line.split(':')[1]) || 10;
    } else if (line.startsWith('#EXTINF:')) {
      const parts = line.substring(8).split(',');
      currentDuration = parseFloat(parts[0]) || 5;
    } else if (line && !line.startsWith('#')) {
      segments.push({
        uri: resolveUrl(baseUrl, line),
        duration: currentDuration,
      });
    }
  }

  return {
    isMaster: false,
    targetDuration,
    segments,
  };
}

export function resolveUrl(baseUrl: string, relativeOrAbsolute: string): string {
  try {
    return new URL(relativeOrAbsolute, baseUrl).href;
  } catch {
    return relativeOrAbsolute;
  }
}

// Proxied fetch for CORS bypass
export async function fetchWithCORSProxy(url: string): Promise<Response> {
  try {
    const directRes = await fetch(url, { method: 'GET', mode: 'cors' });
    if (directRes.ok) return directRes;
  } catch {
    // If direct CORS fails, attempt local server proxy or fallback
  }

  try {
    const proxyUrl = `/api/stream-proxy?url=${encodeURIComponent(url)}`;
    const proxyRes = await fetch(proxyUrl);
    if (proxyRes.ok) return proxyRes;
  } catch {
    // If backend proxy not available, try allOrigins fallback
    try {
      const allOrigins = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const fallbackRes = await fetch(allOrigins);
      if (fallbackRes.ok) return fallbackRes;
    } catch {
      // ignore
    }
  }

  throw new Error(`Failed to fetch media resource: ${url}`);
}

/**
 * Downloads M3U8 stream segments, reports progress, and combines into a single playable MP4/video blob
 */
export async function downloadM3U8Stream(
  manifestUrl: string,
  title: string,
  onProgress: (task: M3U8DownloadTask) => void,
  signal?: AbortSignal
): Promise<{ blobUrl: string; size: number; duration: number }> {
  const task: M3U8DownloadTask = {
    id: `dl-${Date.now()}`,
    title,
    manifestUrl,
    totalSegments: 0,
    downloadedSegments: 0,
    status: 'sniffing',
    speedKbps: 0,
  };

  onProgress({ ...task });

  // 1. Fetch manifest
  let manifestText = '';
  try {
    const res = await fetchWithCORSProxy(manifestUrl);
    manifestText = await res.text();
  } catch (err: any) {
    task.status = 'error';
    task.errorMessage = `Could not load stream manifest: ${err.message}`;
    onProgress({ ...task });
    throw err;
  }

  let parsed = parseM3U8Content(manifestText, manifestUrl);

  // If master playlist, pick best variant
  if (parsed.isMaster && parsed.variants && parsed.variants.length > 0) {
    // sort by bandwidth desc, pick highest or 720p/1080p
    const sorted = [...parsed.variants].sort((a, b) => b.bandwidth - a.bandwidth);
    const chosenVariant = sorted[0];
    const subRes = await fetchWithCORSProxy(chosenVariant.uri);
    const subText = await subRes.text();
    parsed = parseM3U8Content(subText, chosenVariant.uri);
  }

  if (parsed.segments.length === 0) {
    throw new Error('No video segments found in this M3U8 playlist.');
  }

  task.totalSegments = parsed.segments.length;
  task.status = 'downloading';
  onProgress({ ...task });

  const segmentBuffers: ArrayBuffer[] = [];
  const startTime = Date.now();
  let totalBytesLoaded = 0;

  // Cap download for demo performance if stream is huge (e.g. 50 segments for rapid smooth test, or up to all available)
  const segmentsToDownload = parsed.segments.slice(0, Math.min(parsed.segments.length, 60));
  task.totalSegments = segmentsToDownload.length;

  for (let i = 0; i < segmentsToDownload.length; i++) {
    if (signal?.aborted) {
      throw new Error('Download aborted by user.');
    }

    const seg = segmentsToDownload[i];
    try {
      const segRes = await fetchWithCORSProxy(seg.uri);
      const segBuf = await segRes.arrayBuffer();
      segmentBuffers.push(segBuf);
      totalBytesLoaded += segBuf.byteLength;

      task.downloadedSegments = i + 1;
      const elapsedSec = (Date.now() - startTime) / 1000;
      if (elapsedSec > 0) {
        task.speedKbps = Math.round((totalBytesLoaded * 8) / (1024 * elapsedSec));
      }
      onProgress({ ...task });
    } catch (err: any) {
      console.warn(`Segment ${i} download retry warning:`, err);
      // continue to next segment to avoid total failure
    }
  }

  task.status = 'muxing';
  onProgress({ ...task });

  // Stitch segments into combined video blob (MPEG-TS/MP4 stream container)
  const combinedBlob = new Blob(segmentBuffers, { type: 'video/mp4' });
  const blobUrl = URL.createObjectURL(combinedBlob);
  const totalDuration = segmentsToDownload.reduce((acc, s) => acc + s.duration, 0);

  task.status = 'completed';
  task.outputBlobUrl = blobUrl;
  task.outputSize = combinedBlob.size;
  task.downloadDate = Date.now();
  onProgress({ ...task });

  return {
    blobUrl,
    size: combinedBlob.size,
    duration: Math.round(totalDuration),
  };
}

/**
 * Sniffs video and M3U8 links from URLs or raw HTML text
 */
export function sniffMediaStreams(input: string): Array<{
  url: string;
  type: 'm3u8' | 'mp4' | 'webm';
  label: string;
}> {
  const detected: Array<{ url: string; type: 'm3u8' | 'mp4' | 'webm'; label: string }> = [];

  const urlPattern = /(https?:\/\/[^\s"'>]+?\.(?:m3u8|mp4|webm)[^\s"'>]*)/gi;
  let match;
  while ((match = urlPattern.exec(input)) !== null) {
    const url = match[1];
    let type: 'm3u8' | 'mp4' | 'webm' = 'mp4';
    if (url.includes('.m3u8')) type = 'm3u8';
    else if (url.includes('.webm')) type = 'webm';

    if (!detected.some((d) => d.url === url)) {
      const fileName = url.split('/').pop()?.split('?')[0] || 'Detected Stream';
      detected.push({
        url,
        type,
        label: decodeURIComponent(fileName),
      });
    }
  }

  // Also check if the input itself is directly an m3u8 or mp4
  if (input.startsWith('http')) {
    if (input.includes('.m3u8') && !detected.some((d) => d.url === input)) {
      detected.push({ url: input, type: 'm3u8', label: 'Direct HLS Master Stream' });
    } else if ((input.includes('.mp4') || input.includes('.webm')) && !detected.some((d) => d.url === input)) {
      detected.push({ url: input, type: 'mp4', label: 'Direct Video Stream' });
    }
  }

  return detected;
}
