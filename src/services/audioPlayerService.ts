/**
 * Audio Player Service
 * Handles background music playback, playlist queues, Web Audio gain boost (up to 200%),
 * and native OS MediaSession controls (lockscreen & notification center integration).
 */

import { MediaItem } from '../types';

export type LoopMode = 'off' | 'all' | 'one';

export interface AudioPlayerState {
  currentTrack: MediaItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0 to 2 (1 = 100%, 2 = 200% boost)
  isMuted: boolean;
  loopMode: LoopMode;
  isShuffle: boolean;
  queue: MediaItem[];
  queueIndex: number;
}

type AudioListener = (state: AudioPlayerState) => void;

class AudioPlayerService {
  private audio: HTMLAudioElement;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private listeners: Set<AudioListener> = new Set();

  private state: AudioPlayerState = {
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1.0,
    isMuted: false,
    loopMode: 'all',
    isShuffle: false,
    queue: [],
    queueIndex: -1,
  };

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'metadata';

    // Hook native audio element events
    this.audio.addEventListener('timeupdate', () => {
      this.state.currentTime = this.audio.currentTime;
      this.notify();
      this.updateMediaSessionPosition();
    });

    this.audio.addEventListener('loadedmetadata', () => {
      this.state.duration = this.audio.duration || 0;
      this.notify();
      this.updateMediaSessionPosition();
    });

    this.audio.addEventListener('ended', () => {
      this.handleTrackEnded();
    });

    this.audio.addEventListener('play', () => {
      this.state.isPlaying = true;
      this.notify();
      this.updateMediaSessionPlaybackState('playing');
    });

    this.audio.addEventListener('pause', () => {
      this.state.isPlaying = false;
      this.notify();
      this.updateMediaSessionPlaybackState('paused');
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('Audio playback error', e);
      this.state.isPlaying = false;
      this.notify();
    });

    this.setupMediaSession();
  }

  private initWebAudio() {
    if (this.audioContext) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.state.volume;
      this.sourceNode.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
    } catch (e) {
      console.warn('Web Audio gain initialization skipped:', e);
    }
  }

  private setupMediaSession() {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => this.play());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.previous());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          this.seek(details.seekTime);
        }
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const offset = details.seekOffset || 10;
        this.seek(Math.max(0, this.audio.currentTime - offset));
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const offset = details.seekOffset || 10;
        this.seek(Math.min(this.state.duration, this.audio.currentTime + offset));
      });
    } catch (err) {
      console.warn('MediaSession handler registration notice:', err);
    }
  }

  private updateMediaSessionMetadata(track: MediaItem) {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist || 'PlayThat! Audio Player',
        album: track.album || track.folder || 'PlayThat! Library',
        artwork: [
          {
            src: track.thumbnailUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
            sizes: '512x512',
            type: 'image/jpeg',
          },
          {
            src: track.thumbnailUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
            sizes: '256x256',
            type: 'image/jpeg',
          },
        ],
      });
    } catch (e) {
      console.warn('MediaMetadata notice:', e);
    }
  }

  private updateMediaSessionPlaybackState(state: 'playing' | 'paused' | 'none') {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch (e) {
      console.warn('MediaSession playbackState notice:', e);
    }
  }

  private updateMediaSessionPosition() {
    if (!('mediaSession' in navigator) || typeof navigator.mediaSession.setPositionState !== 'function') return;
    try {
      if (this.audio.duration && !isNaN(this.audio.duration)) {
        navigator.mediaSession.setPositionState({
          duration: this.audio.duration,
          playbackRate: this.audio.playbackRate || 1,
          position: this.audio.currentTime,
        });
      }
    } catch {
      // Ignore transient position state errors
    }
  }

  private handleTrackEnded() {
    if (this.state.loopMode === 'one') {
      this.audio.currentTime = 0;
      this.audio.play();
      return;
    }

    if (this.state.queue.length > 0) {
      this.next();
    } else {
      this.state.isPlaying = false;
      this.notify();
    }
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public getState(): AudioPlayerState {
    return { ...this.state };
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((l) => l(s));
  }

  public playTrack(track: MediaItem, queueList?: MediaItem[]) {
    this.initWebAudio();

    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    let queue = queueList || this.state.queue;
    if (!queue || queue.length === 0 || !queue.some((t) => t.id === track.id)) {
      queue = [track, ...queue.filter((t) => t.id !== track.id)];
    }

    const index = queue.findIndex((t) => t.id === track.id);

    this.state.currentTrack = track;
    this.state.queue = queue;
    this.state.queueIndex = index >= 0 ? index : 0;
    this.state.currentTime = 0;
    this.state.duration = track.duration || 0;

    this.audio.src = track.url;
    this.audio.currentTime = 0;

    this.updateMediaSessionMetadata(track);

    this.audio
      .play()
      .then(() => {
        this.state.isPlaying = true;
        this.notify();
      })
      .catch((err) => {
        console.warn('Audio play request notice:', err);
      });
  }

  public play() {
    if (!this.state.currentTrack && this.state.queue.length > 0) {
      this.playTrack(this.state.queue[0]);
      return;
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    this.audio.play().catch((e) => console.warn('Play error:', e));
  }

  public pause() {
    this.audio.pause();
  }

  public togglePlay() {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public seek(seconds: number) {
    const clamped = Math.max(0, Math.min(seconds, this.state.duration || this.audio.duration || 0));
    this.audio.currentTime = clamped;
    this.state.currentTime = clamped;
    this.notify();
  }

  public next() {
    if (this.state.queue.length === 0) return;

    let nextIdx = this.state.queueIndex + 1;
    if (this.state.isShuffle) {
      nextIdx = Math.floor(Math.random() * this.state.queue.length);
    } else if (nextIdx >= this.state.queue.length) {
      if (this.state.loopMode === 'off') {
        this.pause();
        return;
      }
      nextIdx = 0;
    }

    const nextTrack = this.state.queue[nextIdx];
    if (nextTrack) {
      this.playTrack(nextTrack, this.state.queue);
    }
  }

  public previous() {
    if (this.state.queue.length === 0) return;

    // If more than 3s in, restart track
    if (this.audio.currentTime > 3) {
      this.seek(0);
      return;
    }

    let prevIdx = this.state.queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = this.state.queue.length - 1;
    }

    const prevTrack = this.state.queue[prevIdx];
    if (prevTrack) {
      this.playTrack(prevTrack, this.state.queue);
    }
  }

  public setVolume(val: number) {
    // val can be 0 to 2 (0% to 200%)
    const clamped = Math.max(0, Math.min(2.0, val));
    this.state.volume = clamped;

    if (this.gainNode) {
      this.gainNode.gain.value = clamped;
      // Keep audio element at 1.0 or proportionate
      this.audio.volume = Math.min(1.0, clamped);
    } else {
      this.audio.volume = Math.min(1.0, clamped);
    }

    this.notify();
  }

  public toggleMute() {
    const newMuted = !this.state.isMuted;
    this.state.isMuted = newMuted;
    if (this.gainNode) {
      this.gainNode.gain.value = newMuted ? 0 : this.state.volume;
    }
    this.audio.muted = newMuted;
    this.notify();
  }

  public toggleLoopMode() {
    const modes: LoopMode[] = ['all', 'one', 'off'];
    const next = modes[(modes.indexOf(this.state.loopMode) + 1) % modes.length];
    this.state.loopMode = next;
    this.notify();
  }

  public toggleShuffle() {
    this.state.isShuffle = !this.state.isShuffle;
    this.notify();
  }

  public setQueue(queue: MediaItem[]) {
    this.state.queue = queue;
    this.notify();
  }
}

export const audioPlayerService = new AudioPlayerService();
