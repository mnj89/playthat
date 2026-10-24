# PlayThat! - Android Media Player & Stream Converter

A high-performance, MX Player-inspired Android media playback and stream capture experience. Features dual-edge vertical and horizontal gesture controls, extensive subtitle customization, hardware/software decoding toggles, an in-app browser with live M3U8 stream sniffing and MP4 conversion, network and local media streaming, and an AES-GCM encrypted private media vault with PIN/pattern authentication and emergency disguise.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX choices have been confirmed and will guide the build:

- **Confirmed Viewport & Shell**: Adaptive responsive layout with an optional Android device frame toggle (smartphone/tablet chassis with Android status bar, gesture pill, and full-screen landscape player mode).
- **Confirmed In-App Browser & Downloader**: Integrated Chromium-style browser tab with an active network traffic sniffer that detects `.m3u8` and video streams, displays segment download progress, and remuxes/converts them seamlessly into playable MP4 files stored in the local library.
- **Confirmed Security & Vault Lock**: Client-side AES-256-GCM encrypted vault (using WebCrypto API and IndexedDB) protected by a 4-to-6 digit PIN or 3x3 pattern lock, featuring a one-tap emergency disguise (instant switch to a working Android Calculator/Notes mockup).
- **Performance on Low-End Devices**: Virtualized media lists, canvas/WebGL hardware acceleration mode toggles, progressive segment caching, and light/dark theme tokens optimized for high frame-rate mobile rendering.

---

## 1. Overview & Core Concept

**PlayThat!** recreates the beloved Android MX Player experience within a modern web technology stack, bridging high-fidelity mobile ergonomics with real media capabilities:

- **Touch & Gesture Media Player**: Left-edge vertical swipe for screen brightness adjustment, right-edge vertical swipe for audio volume adjustment with boost, horizontal swipe for precision time seeking with time delta and thumbnail preview, double-tap to play/pause or fast-forward (+10s / -10s), pinch-to-zoom and aspect ratio toggling (Original, Fit, Stretch, 16:9, 4:3, Crop).
- **Decoding Engines**: Switchable decoder modes (`HW`, `HW+`, `SW`) supporting standard video codecs, WebGL shader color correction / sharpening (simulating hardware post-processing), and audio enhancement.
- **Advanced Subtitle Engine**: Load external `.srt`, `.vtt`, or embedded subtitle tracks with real-time customization of font family, font size, text color, outline, background opacity, vertical position alignment, and subtitle sync delay (-5.0s to +5.0s).
- **In-App Browser & M3U8-to-MP4 Converter**: Chromium-style navigation bar, bookmarks, and simulated mobile web engine with an automated stream sniffer. When an HLS `.m3u8` stream or direct media URL is detected, users get an immediate download badge to pull segments, merge chunks into an MP4 blob, and save it directly to the media library.
- **Encrypted Private Vault**: Dedicated "Private Folder" where sensitive video and audio files are encrypted with user-derived keys (PBKDF2 + AES-GCM 256-bit). Files are not accessible or inspectable without the correct PIN/Pattern, and an Emergency Disguise button instantly replaces the screen with an innocent utility app.
- **Media File Manager & Playlists**: Folder tree browsing, video thumbnail previews, duration and resolution tags, favorite bookmarks, custom playlists, recent watch history with resume playback timestamps, and local network streaming (HTTP/HLS/DASH/MP4 stream URLs).

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Browsing & Folder Navigation**:
   - The user opens PlayThat! and lands on the **Folders / Videos** view styled with Android Material You + MX Player card aesthetic.
   - Folders (e.g., *Camera, Downloads, Stream Captures, Movies, Series*) display video counts and unread badges.
   - Tapping a folder reveals grid or list views with duration badges, resolution pills (`1080p`, `4K`), playback progress bars, and multi-select actions (Add to Playlist, Move to Encrypted Vault, Delete, Share).

2. **Playback & MX Gesture Controls**:
   - Tapping any media file launches the immersive player (auto-entering landscape or responsive theater mode).
   - Sliding a finger up/down on the **left side** adjusts brightness smoothly with an on-screen sun icon and percentage gauge.
   - Sliding a finger up/down on the **right side** adjusts volume smoothly with a speaker icon and percentage gauge (with 200% volume boost support).
   - Sliding horizontally scrubs the timeline with a time indicator (`+0:15 [12:45 / 45:10]`).
   - Quick toolbar provides immediate toggles: Decoder (`HW` / `SW`), Audio Track, Subtitle Settings modal, Aspect Ratio, Speed (`0.25x` to `3.0x`), Sleep Timer, and Screen Lock.

3. **In-App Browser & M3U8 Stream Capture**:
   - Switching to the **Browser** tab opens a browser bar with address input and quick-link tiles.
   - When visiting or pasting stream links, a floating **"Media Stream Detected"** pill lights up.
   - Tapping **"Download as MP4"** reveals an interactive progress sheet tracking segment downloading (`42/180 segments (23%)`), stream bitrate, and remuxing.
   - Once completed, the file is added to the user's "Stream Captures" library with auto-generated thumbnail and metadata.

4. **Private Encrypted Vault**:
   - The user taps the Lock icon or "Private Folder".
   - If not set up, they create a 4-digit PIN or 3x3 pattern.
   - Once authenticated, the encrypted library displays protected files. Adding a file encrypts the binary payload in IndexedDB and removes the plaintext original.
   - Pressing the **Emergency Disguise** button instantly morphs the interface into a functional Android Calculator. Entering the secret PIN on the calculator returns to the vault.

### Visual Identity & Theme Tokens

- **Aesthetic Direction**: Android Material 3 / MX Player signature dark & light modes. Sleek midnight obsidian (`#0c0f17`) for the media-first dark mode with electric cobalt/cyan accents (`#2563eb`, `#06b6d4`), paired with clean crisp white/slate (`#f8fafc`) for light mode.
- **Typography**: `Plus Jakarta Sans` for clean, high-legibility UI labels and Android-style headers; `JetBrains Mono` for tabular numerals, video timestamps, bitrates, and resolution specs.
- **Top Bar & Shell Contract**: Single-row 3-zone header with PlayThat! wordmark, device frame toggle (`Mobile / Responsive`), search bar trigger, and theme toggle.
- **Android Bottom Navigation Bar**: Fixed bottom tab bar (Folders, Playlists, Network Stream, In-App Browser, Encrypted Vault) with 48px touch targets, active icon tint, and smooth tab switching.

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale & Trade-Offs |
| :--- | :--- | :--- |
| **HLS & Stream Playback Engine** | `hls.js` + Native HTML5 Media API + WebGL Shader FX | Provides broad support for M3U8 streaming, adaptive bitrate, audio track switching, and subtitle tracks, while WebGL canvas filters simulate hardware acceleration post-processing without heavy binary plugins. |
| **M3U8 Downloader & MP4 Remuxing** | Client-side HLS parser + segment fetcher + muxing pipeline with Express proxy support for CORS-restricted streams | Allows in-browser segment retrieval and packaging into playable MP4 blobs. Server proxy endpoints (`/api/stream-proxy`) bypass CORS restrictions common to external M3U8 streams. |
| **Local Storage & Security Vault** | WebCrypto API (`PBKDF2` key derivation + `AES-GCM-256`) + `idb` (IndexedDB) | Ensures real, non-trivial cryptographic security for private files on the device. Data is encrypted in memory before disk write; without the PIN/passphrase, raw chunks remain unreadable. |
| **Device Frame Mockup** | Toggleable Android Device Frame with interactive notch, status bar, and gesture pill | Gives users the authentic feel of an Android smartphone/tablet app while preserving full desktop accessibility and responsive resizing when toggled off. |
| **Gesture Controls Engine** | Pointer and Touch event listeners with dual-zone spatial coordinate tracking | Allows intuitive brightness/volume gestures on both touchscreens and desktop trackpads/mice without requiring mobile-only browser APIs. |

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PlayThat! Mobile Shell                          │
│  ┌───────────────────────┬──────────────────────┬────────────────────┐  │
│  │ Android Status Bar    │ Device Frame Toggle  │ Light/Dark Theme   │  │
│  └───────────────────────┴──────────────────────┴────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Active View Router                                               │  │
│  │ ├─ Folders & Local Media Browser (Thumbnail Grid, Metadata)      │  │
│  │ ├─ Immersive MX Gesture Player (Dual-Edge Swipes, WebGL Filters) │  │
│  │ ├─ In-App Chromium Browser (Stream Sniffer & M3U8-to-MP4 Muxer)  │  │
│  │ ├─ Local & Network Streaming (HTTP, HLS, RTSP/M3U8 URLs)         │  │
│  │ ├─ Playlist & Queue Manager (Drag-and-Drop, Reorder, Loop)       │  │
│  │ └─ Encrypted Private Vault (AES-GCM, PIN/Pattern Lock, Disguise) │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Android Bottom Navigation (Folders | Stream | Browser | Vault)    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Client State & Engine Layers                      │
│ ├─ Playback Controller: Volume Boost, Brightness Filter, Aspect Ratio  │
│ ├─ Subtitle Engine: SRT/VTT parser, Sync Delay, Font & Outline Styles  │
│ ├─ M3U8 Capture Engine: Playlist parser, TS segment fetcher & Blob mux │
│ ├─ WebCrypto Vault: PBKDF2 salt derivation, AES-GCM 256 encrypt/decrypt│
│ └─ Storage DB: IndexedDB for Blobs + LocalStorage for Preferences      │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Backend Services (Express)                     │
│ ├─ /api/stream-proxy: CORS bypass & header rewrites for M3U8 & segments│
│ └─ /api/media-probe: Inspect remote media codecs, durations & streams  │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Models & Schemas

```typescript
export interface MediaItem {
  id: string;
  title: string;
  folder: string;
  sourceType: 'local' | 'stream' | 'downloaded';
  url: string;
  blobKey?: string;
  thumbnailUrl: string;
  duration: number;
  currentTime: number;
  resolution: string;
  fileSize: number;
  codec: string;
  decoder: 'HW' | 'HW+' | 'SW';
  createdAt: number;
  lastPlayedAt?: number;
  isFavorite: boolean;
  isEncrypted: boolean;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  url?: string;
  content?: string;
  format: 'srt' | 'vtt';
  cues: Array<{ start: number; end: number; text: string }>;
}

export interface SubtitleStyle {
  fontSize: number; // 14 to 36 px
  textColor: string;
  backgroundColor: string;
  outlineColor: string;
  outlineWidth: number;
  verticalOffset: number; // percent from bottom
  delayMs: number; // -5000 to +5000 ms
}

export interface M3U8DownloadTask {
  id: string;
  title: string;
  manifestUrl: string;
  totalSegments: number;
  downloadedSegments: number;
  status: 'idle' | 'parsing' | 'downloading' | 'muxing' | 'completed' | 'error';
  errorMessage?: string;
  speedKbps: number;
  outputBlobUrl?: string;
}
```

---

## 5. Implementation Sequence & Milestones

1. **Brand Identity & Iconography**: Design the custom **PlayThat!** icon, SVG branding, and update `metadata.json` and `index.html`.
2. **Core App Shell & Android Frame**: Implement responsive container with Android status bar, dynamic island/notch, navigation bar, and dark/light mode toggle.
3. **MX Gesture Video Player**:
   - Dual-edge vertical gesture handlers for Brightness (left) and Volume (right) with HUD overlays.
   - Horizontal scrub gesture for time delta seeking.
   - Decoder switch (`HW`, `HW+`, `SW`), WebGL post-processing filter pipeline, playback speed, aspect ratio options, and screen lock.
4. **Custom Subtitle Engine**:
   - Full `.srt` and `.vtt` file loader and parser.
   - Live subtitle rendering with customizable font size, text/background/outline colors, and time sync offset.
5. **In-App Browser & M3U8 Stream Downloader**:
   - Chromium-like navigation bar with URL entry, search, and sample stream catalog.
   - Automated stream sniffer detecting `.m3u8` playlists and media streams.
   - Download manager with segment-by-segment progress bar and MP4 packaging.
   - Express backend proxy (`/api/stream-proxy`) for handling CORS-protected streams.
6. **Encrypted Private Vault**:
   - WebCrypto AES-GCM 256-bit encryption/decryption module.
   - PIN entry and 3x3 pattern lock dialogs.
   - One-tap Emergency Disguise (Calculator mockup).
   - Secure import/export and vault file viewer.
7. **File Browser, Playlists & Network Streaming**:
   - Folder structure, search, sorting (date, name, size), and batch actions.
   - Custom playlist creation and reordering.
   - Direct network stream URL input (HLS/MP4/DASH).
8. **Verification & Polish**:
   - Test touch and mouse gestures, theme switching, download pipeline, and vault encryption.
   - Run compilation verification and final UI polish.
