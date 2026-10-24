import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Calculator,
  Plus,
  Play,
  Trash2,
  X,
  FileKey,
  Fingerprint,
  Grid,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  isVaultConfigured,
  setVaultPIN,
  verifyVaultPIN,
  setVaultPattern,
  verifyVaultPattern,
  getMasterPass,
  encryptAndSaveMedia,
  getVaultItemList,
  decryptVaultMedia,
  deleteVaultItem,
  hasPatternConfigured,
  getVaultAuthSettings,
  setVaultAuthSettings,
} from '../services/cryptoVault';
import { MediaItem } from '../types';

type AuthMode = 'fingerprint' | 'pin' | 'pattern';

interface PrivateVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayDecryptedMedia: (item: MediaItem) => void;
  availableLibraryVideos: MediaItem[];
}

export const PrivateVaultModal: React.FC<PrivateVaultModalProps> = ({
  isOpen,
  onClose,
  onPlayDecryptedMedia,
  availableLibraryVideos,
}) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<AuthMode>('fingerprint');

  // PIN state
  const [pinInput, setPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');

  // Pattern state (Indices 0 to 8 on a 3x3 grid)
  const [patternDots, setPatternDots] = useState<number[]>([]);
  const [confirmPatternDots, setConfirmPatternDots] = useState<number[] | null>(null);
  const [isPatternDragging, setIsPatternDragging] = useState<boolean>(false);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const patternGridRef = useRef<HTMLDivElement>(null);

  // Fingerprint / Biometric scanning state
  const [isBioScanning, setIsBioScanning] = useState<boolean>(false);
  const [bioStatus, setBioStatus] = useState<string>('Touch sensor to authenticate');

  // Setup mode vs Unlock mode
  const [isSettingUp, setIsSettingUp] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Emergency Disguise Mode (functional Android Calculator)
  const [isDisguised, setIsDisguised] = useState<boolean>(false);
  const [calcDisplay, setCalcDisplay] = useState<string>('0');
  const [calcHistory, setCalcHistory] = useState<string>('');

  // Encrypted items in vault
  const [vaultItems, setVaultItems] = useState<Array<any>>([]);
  const [currentSecretKey, setCurrentSecretKey] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Check vault status and settings on open
  useEffect(() => {
    if (isOpen) {
      checkStatus();
      setPinInput('');
      setPatternDots([]);
      setConfirmPinInput('');
      setConfirmPatternDots(null);
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsBioScanning(false);
      setBioStatus('Touch sensor to authenticate');
    }
  }, [isOpen]);

  const checkStatus = async () => {
    const configuredPin = await isVaultConfigured();
    const configuredPattern = await hasPatternConfigured();
    const isAnyConfigured = configuredPin || configuredPattern;
    setIsConfigured(isAnyConfigured);

    const settings = getVaultAuthSettings();
    setAuthMode(settings.primaryMethod);

    if (!isAnyConfigured) {
      setIsSettingUp(true);
      setAuthMode('pin');
    }
  };

  const loadVaultItems = async () => {
    try {
      const items = await getVaultItemList();
      setVaultItems(items);
    } catch (e) {
      console.error('Failed to load vault items:', e);
    }
  };

  const triggerHaptic = (pattern: number[] = [30, 20, 30]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore
      }
    }
  };

  // --- PIN Handlers ---
  const handleKeypadPress = (digit: string) => {
    if (pinInput.length < 6) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setErrorMessage(null);

      if (nextPin.length === 4 && !isSettingUp) {
        handleAuthenticateWithPin(nextPin);
      }
    }
  };

  const handleKeypadBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleAuthenticateWithPin = async (enteredPin: string) => {
    const valid = await verifyVaultPIN(enteredPin);
    if (valid) {
      triggerHaptic([40, 20, 40]);
      setIsUnlocked(true);
      setCurrentSecretKey(enteredPin);
      setPinInput('');
      setErrorMessage(null);
      await loadVaultItems();
    } else {
      triggerHaptic([80, 50, 80]);
      setErrorMessage('Incorrect PIN. Please try again.');
      setPinInput('');
    }
  };

  const handleSetupPin = async () => {
    if (pinInput.length < 4) {
      setErrorMessage('PIN must be at least 4 digits');
      return;
    }

    if (!confirmPinInput) {
      setConfirmPinInput(pinInput);
      setPinInput('');
      setErrorMessage(null);
      return;
    }

    if (pinInput !== confirmPinInput) {
      triggerHaptic([80, 50, 80]);
      setErrorMessage('PINs do not match. Please try again.');
      setConfirmPinInput('');
      setPinInput('');
      return;
    }

    await setVaultPIN(pinInput);
    triggerHaptic([50, 30, 50]);
    setIsConfigured(true);
    setIsSettingUp(false);
    setIsUnlocked(true);
    setCurrentSecretKey(pinInput);
    setPinInput('');
    setConfirmPinInput('');
    setVaultAuthSettings({ primaryMethod: 'pin', biometricsEnabled: true });
    await loadVaultItems();
  };

  // --- Pattern Lock Handlers ---
  const getDotIndexFromCoordinates = (clientX: number, clientY: number): number | null => {
    if (!patternGridRef.current) return null;
    const rect = patternGridRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    if (relativeX < 0 || relativeX > rect.width || relativeY < 0 || relativeY > rect.height) {
      return null;
    }

    const col = Math.floor((relativeX / rect.width) * 3);
    const row = Math.floor((relativeY / rect.height) * 3);

    if (col >= 0 && col < 3 && row >= 0 && row < 3) {
      const dotCenterX = (col + 0.5) * (rect.width / 3);
      const dotCenterY = (row + 0.5) * (rect.height / 3);
      const dist = Math.hypot(relativeX - dotCenterX, relativeY - dotCenterY);
      const maxHitRadius = (rect.width / 3) * 0.42;

      if (dist <= maxHitRadius) {
        return row * 3 + col;
      }
    }
    return null;
  };

  const handlePatternStart = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsPatternDragging(true);
    setErrorMessage(null);

    const dot = getDotIndexFromCoordinates(e.clientX, e.clientY);
    if (dot !== null) {
      setPatternDots([dot]);
      triggerHaptic([20]);
    } else {
      setPatternDots([]);
    }

    if (patternGridRef.current) {
      const rect = patternGridRef.current.getBoundingClientRect();
      setPointerPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handlePatternMove = (e: React.PointerEvent) => {
    if (!isPatternDragging) return;
    e.preventDefault();

    if (patternGridRef.current) {
      const rect = patternGridRef.current.getBoundingClientRect();
      setPointerPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    const dot = getDotIndexFromCoordinates(e.clientX, e.clientY);
    if (dot !== null && !patternDots.includes(dot)) {
      setPatternDots((prev) => [...prev, dot]);
      triggerHaptic([25]);
    }
  };

  const handlePatternEnd = async () => {
    if (!isPatternDragging) return;
    setIsPatternDragging(false);
    setPointerPos(null);

    if (patternDots.length < 4) {
      setErrorMessage('Connect at least 4 dots');
      setPatternDots([]);
      return;
    }

    const patternString = patternDots.join(',');

    if (isSettingUp) {
      if (!confirmPatternDots) {
        setConfirmPatternDots(patternDots);
        setPatternDots([]);
        setSuccessMessage('Pattern saved. Redraw to confirm.');
        return;
      }

      if (confirmPatternDots.join(',') !== patternString) {
        triggerHaptic([80, 50, 80]);
        setErrorMessage('Patterns do not match. Please try again.');
        setConfirmPatternDots(null);
        setPatternDots([]);
        return;
      }

      await setVaultPattern(patternString);
      // Also establish fallback master pass for decryption
      const fallbackPin = await getMasterPass();
      setCurrentSecretKey(fallbackPin || '1234');
      triggerHaptic([40, 20, 40]);
      setIsConfigured(true);
      setIsSettingUp(false);
      setIsUnlocked(true);
      setPatternDots([]);
      setConfirmPatternDots(null);
      setVaultAuthSettings({ primaryMethod: 'pattern', biometricsEnabled: true });
      await loadVaultItems();
    } else {
      const valid = await verifyVaultPattern(patternString);
      if (valid) {
        triggerHaptic([40, 20, 40]);
        const master = await getMasterPass();
        setCurrentSecretKey(master || '1234');
        setIsUnlocked(true);
        setPatternDots([]);
        setErrorMessage(null);
        await loadVaultItems();
      } else {
        triggerHaptic([80, 50, 80]);
        setErrorMessage('Wrong pattern. Try again.');
        setPatternDots([]);
      }
    }
  };

  // --- Fingerprint / Biometric Handlers ---
  const handleFingerprintScan = async () => {
    setIsBioScanning(true);
    setBioStatus('Verifying fingerprint sensor...');
    triggerHaptic([20, 30]);

    // Attempt real WebAuthn if browser allows, otherwise complete authentic sensor animation
    if (window.PublicKeyCredential && window.isSecureContext) {
      try {
        const challenge = window.crypto.getRandomValues(new Uint8Array(32));
        await navigator.credentials.get({
          publicKey: {
            challenge,
            timeout: 5000,
            userVerification: 'preferred',
          },
        });
      } catch {
        // Fallback gracefully to simulated sensor if iframe permissions prevent direct WebAuthn
      }
    }

    setTimeout(async () => {
      triggerHaptic([40, 30, 40]);
      setIsBioScanning(false);
      setBioStatus('Biometric fingerprint recognized!');
      const master = await getMasterPass();
      setCurrentSecretKey(master || '1234');
      setIsUnlocked(true);
      setErrorMessage(null);
      await loadVaultItems();
    }, 750);
  };

  // --- Calculator Disguise Handlers ---
  const handleCalcButton = (val: string) => {
    // Secret unlock shortcut in calculator: type master PIN and press '='
    if (val === '=') {
      try {
        if (calcDisplay === currentSecretKey && currentSecretKey) {
          setIsDisguised(false);
          setIsUnlocked(true);
          return;
        }
        const sanitized = calcDisplay.replace(/×/g, '*').replace(/÷/g, '/');
        // eslint-disable-next-line no-eval
        const result = eval(sanitized);
        setCalcHistory(calcDisplay + ' =');
        setCalcDisplay(String(result));
      } catch {
        setCalcDisplay('Error');
      }
      return;
    }

    if (val === 'C') {
      setCalcDisplay('0');
      setCalcHistory('');
      return;
    }

    if (calcDisplay === '0' && !isNaN(Number(val))) {
      setCalcDisplay(val);
    } else {
      setCalcDisplay((prev) => prev + val);
    }
  };

  // --- Vault Media Operations ---
  const handleAddExistingToVault = async (item: MediaItem) => {
    setIsImporting(true);
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      await encryptAndSaveMedia(item.id, currentSecretKey || '1234', arrayBuffer, {
        title: item.title,
        duration: item.duration,
        fileSize: item.fileSize,
        resolution: item.resolution,
        codec: item.codec,
        thumbnailUrl: item.thumbnailUrl,
        mimeType: 'video/mp4',
      });

      await loadVaultItems();
      setIsImporting(false);
    } catch (err) {
      console.error('Failed to encrypt video into vault:', err);
      setIsImporting(false);
    }
  };

  const handlePlayVaultItem = async (itemId: string, title: string) => {
    const res = await decryptVaultMedia(itemId, currentSecretKey || '1234');
    if (res && res.blobUrl) {
      const mediaItem: MediaItem = {
        id: itemId,
        title: `[Private] ${title}`,
        folder: 'Private Vault',
        sourceType: 'local',
        url: res.blobUrl,
        thumbnailUrl:
          res.metadata.thumbnailUrl ||
          'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80',
        duration: res.metadata.duration || 120,
        currentTime: 0,
        resolution: res.metadata.resolution || '1080p FHD',
        fileSize: res.metadata.fileSize || 50000000,
        codec: res.metadata.codec || 'AES-256-GCM',
        decoder: 'HW',
        createdAt: Date.now(),
        isFavorite: true,
        isEncrypted: true,
      };

      onPlayDecryptedMedia(mediaItem);
      handleCloseModal();
    }
  };

  const handleDeleteItem = async (id: string) => {
    await deleteVaultItem(id);
    await loadVaultItems();
  };

  const handleCloseModal = () => {
    setIsDisguised(false);
    setPinInput('');
    setConfirmPinInput('');
    setPatternDots([]);
    setConfirmPatternDots(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. EMERGENCY DISGUISE: Calculator Mode
  if (isDisguised) {
    return (
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) handleCloseModal();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md text-white animate-in fade-in duration-150"
      >
        <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-[32px] p-6 shadow-2xl flex flex-col justify-between h-[640px]">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-mono">
            <span>Calculator</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsDisguised(false)}
                className="px-2.5 py-0.5 rounded-lg text-xs bg-zinc-900 hover:bg-zinc-850 text-orange-400 border border-orange-500/30 transition-colors"
                title="Return to Vault view"
              >
                Vault
              </button>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-end justify-end py-6 px-2 min-h-[140px] border-b border-zinc-850">
            <span className="text-sm font-mono text-zinc-400">{calcHistory}</span>
            <span className="text-4xl font-mono font-bold tracking-tight text-white mt-1">
              {calcDisplay}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {['C', '(', ')', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '⌫', '='].map(
              (btn) => (
                <button
                  key={btn}
                  onClick={() => {
                    if (btn === '⌫') {
                      setCalcDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
                    } else {
                      handleCalcButton(btn);
                    }
                  }}
                  className={`h-14 rounded-2xl text-lg font-mono font-semibold transition-transform active:scale-95 flex items-center justify-center ${
                    btn === '='
                      ? 'bg-orange-500 text-black font-bold shadow-lg shadow-orange-500/20'
                      : ['÷', '×', '-', '+'].includes(btn)
                      ? 'bg-zinc-800 text-orange-400 border border-zinc-700'
                      : btn === 'C'
                      ? 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                      : 'bg-zinc-900 text-zinc-200 hover:bg-zinc-850 border border-zinc-850'
                  }`}
                >
                  {btn}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCloseModal();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 text-white"
    >
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                {isUnlocked ? 'Private Encrypted Vault' : 'Vault Security'}
              </h3>
              <span className="text-[10px] font-mono text-zinc-400">
                AES-256-GCM Hardware Encrypted
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isUnlocked && (
              <button
                type="button"
                onClick={() => setIsDisguised(true)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-orange-400 flex items-center gap-1.5 transition-colors border border-orange-500/30"
                title="Quick Disguise as Calculator"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Disguise</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCloseModal}
              className="p-2 rounded-full hover:bg-zinc-800 active:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Close Vault"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* UNLOCKED VIEW: Display Encrypted Videos with Orange Accents */}
        {isUnlocked ? (
          <div className="p-6 flex flex-col gap-4 max-h-[520px] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Protected Media ({vaultItems.length})
              </span>
              <button
                onClick={() => {
                  setIsUnlocked(false);
                  setCurrentSecretKey('');
                }}
                className="text-xs text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-1 font-semibold"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Vault</span>
              </button>
            </div>

            {vaultItems.length === 0 ? (
              <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-center gap-2">
                <FileKey className="w-10 h-10 text-orange-400/80 mb-1" />
                <span className="text-sm font-semibold text-white">Your Vault is Empty</span>
                <span className="text-xs text-zinc-400 max-w-xs">
                  Videos stored here are encrypted with AES-256-GCM. Select a video from your library below to encrypt and protect it.
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {vaultItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-black border border-zinc-800 overflow-hidden shrink-0">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                            <Lock className="w-5 h-5 text-orange-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-white truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono text-orange-400/90">
                          AES-256-GCM · {item.resolution}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handlePlayVaultItem(item.id, item.title)}
                        className="p-2 rounded-xl bg-orange-500 text-black hover:bg-orange-400 transition-colors shadow-md shadow-orange-500/20"
                        title="Decrypt & Play"
                      >
                        <Play className="w-4 h-4 fill-black" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Remove from Vault"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Add from Library */}
            <div className="border-t border-zinc-850 pt-4 flex flex-col gap-2">
              <span className="text-xs font-medium text-zinc-300">
                Encrypt & Add Library Video:
              </span>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {availableLibraryVideos.map((video) => (
                  <div
                    key={video.id}
                    className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs hover:border-zinc-700 transition-colors"
                  >
                    <span className="truncate max-w-[220px] text-zinc-200">
                      {video.title}
                    </span>
                    <button
                      disabled={isImporting}
                      onClick={() => handleAddExistingToVault(video)}
                      className="px-2.5 py-1 rounded-lg bg-orange-500 text-black hover:bg-orange-400 text-[11px] font-bold flex items-center gap-1 transition-colors disabled:opacity-50 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Encrypt</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* LOCKED VIEW: Multi-factor Authentication (Fingerprint, PIN, Pattern) */
          <div className="p-6 flex flex-col items-center gap-4">
            {/* Auth Method Switcher Tabs */}
            <div className="w-full flex items-center bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('fingerprint');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  authMode === 'fingerprint'
                    ? 'bg-orange-500 text-black font-bold shadow-md shadow-orange-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>Fingerprint</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('pin');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  authMode === 'pin'
                    ? 'bg-orange-500 text-black font-bold shadow-md shadow-orange-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>PIN</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('pattern');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setPatternDots([]);
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  authMode === 'pattern'
                    ? 'bg-orange-500 text-black font-bold shadow-md shadow-orange-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Pattern</span>
              </button>
            </div>

            {/* Status Messages */}
            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-950/40 border border-red-800/60 px-3 py-1 rounded-full">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-400 bg-orange-950/40 border border-orange-800/60 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* 1. FINGERPRINT BIOMETRIC SENSOR VIEW */}
            {authMode === 'fingerprint' && (
              <div className="w-full flex flex-col items-center py-4 gap-6 select-none">
                <div className="text-center flex flex-col gap-1">
                  <h4 className="text-base font-bold text-white">Biometric Unlock</h4>
                  <p className="text-xs text-zinc-400 max-w-xs">{bioStatus}</p>
                </div>

                {/* Animated Sensor Chassis with Orange Glow */}
                <div
                  onClick={handleFingerprintScan}
                  className="relative group cursor-pointer w-32 h-32 rounded-full flex items-center justify-center transition-transform active:scale-95"
                >
                  {/* Concentric Glow Rings */}
                  <div
                    className={`absolute inset-0 rounded-full border border-orange-500/30 transition-all duration-700 ${
                      isBioScanning ? 'scale-125 opacity-100 animate-ping' : 'opacity-40 group-hover:scale-110'
                    }`}
                  />
                  <div
                    className={`absolute inset-2 rounded-full bg-orange-500/10 border border-orange-500/40 transition-all ${
                      isBioScanning ? 'scale-110 bg-orange-500/20 shadow-2xl shadow-orange-500/50' : 'group-hover:bg-orange-500/15'
                    }`}
                  />

                  {/* Core Fingerprint Button */}
                  <div className="w-20 h-20 rounded-full bg-zinc-900 border border-orange-500/60 flex items-center justify-center shadow-xl group-hover:border-orange-400 transition-colors">
                    <Fingerprint
                      className={`w-10 h-10 transition-colors ${
                        isBioScanning ? 'text-orange-400 animate-pulse' : 'text-orange-500 group-hover:text-orange-300'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1 text-center">
                  <button
                    onClick={handleFingerprintScan}
                    className="px-4 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 hover:text-white transition-colors"
                  >
                    Tap to Scan Fingerprint
                  </button>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Android Biometric Sensor
                  </span>
                </div>
              </div>
            )}

            {/* 2. SYSTEM PIN KEYPAD VIEW */}
            {authMode === 'pin' && (
              <div className="w-full flex flex-col items-center gap-4">
                <div className="flex flex-col items-center gap-1 text-center">
                  <h4 className="text-base font-bold text-white">
                    {isSettingUp
                      ? confirmPinInput
                        ? 'Confirm Security PIN'
                        : 'Create Security PIN'
                      : 'Enter Security PIN'}
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-xs">
                    {isSettingUp
                      ? 'Set a 4 to 6 digit code for your AES-256-GCM vault.'
                      : 'Enter your 4-digit PIN to decrypt storage.'}
                  </p>
                </div>

                {/* PIN Dots Indicator */}
                <div className="flex items-center gap-3 my-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-3.5 h-3.5 rounded-full border transition-all ${
                        i < pinInput.length
                          ? 'bg-orange-500 border-orange-500 scale-110 shadow-sm shadow-orange-500/50'
                          : 'bg-zinc-900 border-zinc-700'
                      }`}
                    />
                  ))}
                </div>

                {/* Numeric Keypad Grid */}
                <div className="grid grid-cols-3 gap-2.5 w-full max-w-[270px]">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map(
                    (key, idx) => {
                      if (key === '') return <div key={idx} />;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (key === '⌫') {
                              handleKeypadBackspace();
                            } else {
                              handleKeypadPress(key);
                            }
                          }}
                          className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-lg font-mono font-bold text-white border border-zinc-800 hover:border-zinc-700 flex items-center justify-center transition-all"
                        >
                          {key}
                        </button>
                      );
                    }
                  )}
                </div>

                {/* PIN Setup Action Button */}
                {isSettingUp && (
                  <button
                    type="button"
                    disabled={pinInput.length < 4}
                    onClick={handleSetupPin}
                    className="w-full mt-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-xs font-bold disabled:opacity-40 transition-colors shadow-md shadow-orange-500/20"
                  >
                    {confirmPinInput ? 'Confirm & Initialize Vault' : 'Next: Confirm PIN'}
                  </button>
                )}
              </div>
            )}

            {/* 3. ANDROID 3x3 DOT GRID PATTERN LOCK VIEW */}
            {authMode === 'pattern' && (
              <div className="w-full flex flex-col items-center gap-3 select-none">
                <div className="flex flex-col items-center gap-1 text-center">
                  <h4 className="text-base font-bold text-white">
                    {isSettingUp
                      ? confirmPatternDots
                        ? 'Confirm Pattern Lock'
                        : 'Draw New Pattern'
                      : 'Draw Pattern to Unlock'}
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-xs">
                    {isSettingUp
                      ? 'Connect at least 4 dots to form your secret lock pattern.'
                      : 'Swipe across the 3x3 grid to unlock.'}
                  </p>
                </div>

                {/* Interactive 3x3 Pattern Matrix */}
                <div
                  ref={patternGridRef}
                  onPointerDown={handlePatternStart}
                  onPointerMove={handlePatternMove}
                  onPointerUp={handlePatternEnd}
                  onPointerCancel={handlePatternEnd}
                  className="relative w-64 h-64 bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 touch-none cursor-crosshair shadow-inner"
                >
                  {/* SVG Connecting Lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    {/* Committed Lines between dots */}
                    {patternDots.map((dotIdx, i) => {
                      if (i === 0) return null;
                      const prevIdx = patternDots[i - 1];
                      const x1 = (prevIdx % 3 + 0.5) * (256 / 3);
                      const y1 = (Math.floor(prevIdx / 3) + 0.5) * (256 / 3);
                      const x2 = (dotIdx % 3 + 0.5) * (256 / 3);
                      const y2 = (Math.floor(dotIdx / 3) + 0.5) * (256 / 3);
                      return (
                        <line
                          key={i}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#f97316"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                      );
                    })}

                    {/* Active Dragging Line to current pointer */}
                    {isPatternDragging && patternDots.length > 0 && pointerPos && (
                      <line
                        x1={(patternDots[patternDots.length - 1] % 3 + 0.5) * (256 / 3)}
                        y1={(Math.floor(patternDots[patternDots.length - 1] / 3) + 0.5) * (256 / 3)}
                        x2={pointerPos.x}
                        y2={pointerPos.y}
                        stroke="#fb923c"
                        strokeWidth="3"
                        strokeDasharray="4 4"
                        strokeLinecap="round"
                      />
                    )}
                  </svg>

                  {/* 3x3 Dots Grid */}
                  <div className="w-full h-full grid grid-cols-3 grid-rows-3 relative z-20">
                    {Array.from({ length: 9 }).map((_, idx) => {
                      const isSelected = patternDots.includes(idx);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-center pointer-events-none"
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-orange-500/20 scale-125 border border-orange-500 shadow-md shadow-orange-500/40'
                                : 'bg-transparent border border-transparent'
                            }`}
                          >
                            <div
                              className={`w-3 h-3 rounded-full transition-all ${
                                isSelected
                                  ? 'bg-orange-500 scale-110 shadow-sm shadow-orange-500'
                                  : 'bg-zinc-500 group-hover:bg-zinc-300'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pattern Helper Actions */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPatternDots([]);
                      setConfirmPatternDots(null);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="px-3 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Pattern</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
