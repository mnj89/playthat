/**
 * Subtitle Parser and Sync Engine for PlayThat!
 * Supports .srt and .vtt subtitle formats with time-sync offsets.
 */

import { SubtitleCue, SubtitleTrack } from '../types';

export function parseSRT(text: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    // Line 0 may be index number, or timestamps
    let timeIndex = 0;
    if (/^\d+$/.test(lines[0].trim()) && lines.length >= 3) {
      timeIndex = 1;
    }

    const timeLine = lines[timeIndex];
    if (!timeLine || !timeLine.includes('-->')) continue;

    const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
    const start = parseTimestamp(startStr);
    const end = parseTimestamp(endStr);

    const textLines = lines.slice(timeIndex + 1).join('\n').trim();
    if (textLines && !isNaN(start) && !isNaN(end)) {
      cues.push({ start, end, text: cleanSubtitleTags(textLines) });
    }
  }

  return cues;
}

export function parseVTT(text: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');

  let i = 0;
  // skip WEBVTT header
  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }

  while (i < lines.length) {
    const timeLine = lines[i]?.trim();
    if (timeLine && timeLine.includes('-->')) {
      const [startStr, endStrWithSettings] = timeLine.split('-->').map((s) => s.trim());
      const endStr = endStrWithSettings.split(/\s+/)[0]; // strip line:90% etc
      const start = parseTimestamp(startStr);
      const end = parseTimestamp(endStr);

      i++;
      const textArr: string[] = [];
      while (i < lines.length && lines[i].trim() !== '') {
        textArr.push(lines[i]);
        i++;
      }

      const text = textArr.join('\n').trim();
      if (text && !isNaN(start) && !isNaN(end)) {
        cues.push({ start, end, text: cleanSubtitleTags(text) });
      }
    }
    i++;
  }

  return cues;
}

function parseTimestamp(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.replace(',', '.').trim().split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }
  return 0;
}

function cleanSubtitleTags(str: string): string {
  // Strip <i>, <b>, <font>, etc.
  return str.replace(/<[^>]+>/g, '').trim();
}

/**
 * Returns current subtitle text matching video timestamp with delay offset applied
 */
export function getActiveCueText(
  cues: SubtitleCue[],
  currentTime: number,
  delayMs: number = 0
): string | null {
  const adjustedTime = currentTime - delayMs / 1000;
  const match = cues.find((c) => adjustedTime >= c.start && adjustedTime <= c.end);
  return match ? match.text : null;
}

/**
 * Sample multi-language subtitles for demo videos
 */
export const SAMPLE_SUBTITLES: Record<string, SubtitleTrack[]> = {
  default: [
    {
      id: 'sub-en',
      label: 'English (SDH)',
      language: 'en',
      format: 'vtt',
      cues: [
        { start: 1, end: 4, text: '[Gentle orchestral music playing]' },
        { start: 4.5, end: 8, text: 'Welcome to PlayThat! - Advanced Media Player' },
        { start: 8.5, end: 12, text: 'Slide finger on the left side to adjust brightness.' },
        { start: 12.5, end: 16, text: 'Slide finger on the right side to adjust volume with 200% boost!' },
        { start: 16.5, end: 21, text: 'Swipe horizontally anywhere to scrub forward and backward.' },
        { start: 22, end: 26, text: 'Full hardware acceleration (HW/HW+) enabled for low-end devices.' },
        { start: 27, end: 32, text: 'Enjoy ultra-smooth playback and custom subtitles!' },
      ],
    },
    {
      id: 'sub-es',
      label: 'Español',
      language: 'es',
      format: 'vtt',
      cues: [
        { start: 1, end: 4, text: '[Música suave sonando]' },
        { start: 4.5, end: 8, text: 'Bienvenido a PlayThat! - Reproductor Avanzado' },
        { start: 8.5, end: 12, text: 'Desliza el dedo en el lado izquierdo para ajustar el brillo.' },
        { start: 12.5, end: 16, text: 'Desliza en el lado derecho para ajustar el volumen con boost.' },
        { start: 16.5, end: 21, text: 'Desliza horizontalmente para avanzar o retroceder.' },
        { start: 22, end: 26, text: 'Aceleración por hardware (HW/HW+) optimizada.' },
      ],
    },
    {
      id: 'sub-fr',
      label: 'Français',
      language: 'fr',
      format: 'vtt',
      cues: [
        { start: 1, end: 4, text: '[Musique symphonique douce]' },
        { start: 4.5, end: 8, text: 'Bienvenue sur PlayThat! - Lecteur Multimédia' },
        { start: 8.5, end: 12, text: 'Glissez à gauche pour régler la luminosité.' },
        { start: 12.5, end: 16, text: 'Glissez à droite pour régler le volume.' },
        { start: 16.5, end: 21, text: 'Balayez horizontalement pour naviguer dans le temps.' },
      ],
    },
  ],
};
