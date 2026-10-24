/**
 * WebCrypto AES-GCM 256-bit encryption & IndexedDB storage service
 * for PlayThat!'s Encrypted Private Media Vault
 */

const DB_NAME = 'PlayThatMediaDB';
const DB_VERSION = 1;
const STORE_VAULT = 'encrypted_vault';
const STORE_MEDIA = 'local_media';
const STORE_METADATA = 'vault_meta';

interface EncryptedPayload {
  id: string;
  iv: number[];
  salt: number[];
  ciphertext: ArrayBuffer;
  metadata: {
    title: string;
    fileSize: number;
    duration: number;
    resolution: string;
    codec: string;
    thumbnailUrl?: string;
    mimeType: string;
  };
  addedAt: number;
}

let dbInstance: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_VAULT)) {
        db.createObjectStore(STORE_VAULT, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_METADATA)) {
        db.createObjectStore(STORE_METADATA, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    request.onerror = () => reject(request.error);
  });
}

// Key Derivation using PBKDF2
async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Generate salted hash for PIN verification
export async function setVaultPIN(pin: string): Promise<boolean> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hashBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_METADATA, 'readwrite');
    const store = tx.objectStore(STORE_METADATA);
    store.put({
      key: 'pin_hash',
      salt: Array.from(salt),
      hash: Array.from(new Uint8Array(hashBits)),
      configuredAt: Date.now(),
    });
    // Also store master pin for biometric auto-decryption
    store.put({
      key: 'master_pass',
      value: pin,
    });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// Generate salted hash for Pattern lock verification
export async function setVaultPattern(patternStr: string): Promise<boolean> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(`pattern_${patternStr}`),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hashBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_METADATA, 'readwrite');
    const store = tx.objectStore(STORE_METADATA);
    store.put({
      key: 'pattern_hash',
      salt: Array.from(salt),
      hash: Array.from(new Uint8Array(hashBits)),
      configuredAt: Date.now(),
    });
    // Also store pattern pass for biometric/decryption
    store.put({
      key: 'pattern_raw',
      value: patternStr,
    });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function verifyVaultPattern(patternStr: string): Promise<boolean> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_METADATA, 'readonly');
    const store = tx.objectStore(STORE_METADATA);
    const req = store.get('pattern_hash');
    req.onsuccess = async () => {
      if (!req.result) {
        // Default pattern fallback for demo: 0-1-2-5-8 (Z shape or L shape)
        resolve(patternStr === '0,1,2,5,8' || patternStr === '0,1,2,4,6,7,8');
        return;
      }
      try {
        const { salt, hash } = req.result;
        const saltArr = new Uint8Array(salt);
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
          'raw',
          enc.encode(`pattern_${patternStr}`),
          'PBKDF2',
          false,
          ['deriveBits']
        );
        const derivedBits = await window.crypto.subtle.deriveBits(
          {
            name: 'PBKDF2',
            salt: saltArr,
            iterations: 100000,
            hash: 'SHA-256',
          },
          keyMaterial,
          256
        );

        const derivedArr = new Uint8Array(derivedBits);
        const targetArr = new Uint8Array(hash);
        let match = derivedArr.length === targetArr.length;
        for (let i = 0; i < derivedArr.length; i++) {
          if (derivedArr[i] !== targetArr[i]) match = false;
        }
        resolve(match);
      } catch (err) {
        reject(err);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getMasterPass(): Promise<string> {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_METADATA, 'readonly');
    const store = tx.objectStore(STORE_METADATA);
    const req = store.get('master_pass');
    req.onsuccess = () => {
      resolve(req.result?.value || '1234');
    };
    req.onerror = () => resolve('1234');
  });
}

export async function isVaultConfigured(): Promise<boolean> {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_METADATA, 'readonly');
    const store = tx.objectStore(STORE_METADATA);
    const req = store.get('pin_hash');
    req.onsuccess = () => {
      resolve(!!req.result);
    };
    req.onerror = () => resolve(false);
  });
}

export async function hasPatternConfigured(): Promise<boolean> {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_METADATA, 'readonly');
    const store = tx.objectStore(STORE_METADATA);
    const req = store.get('pattern_hash');
    req.onsuccess = () => {
      resolve(!!req.result);
    };
    req.onerror = () => resolve(false);
  });
}

export async function setVaultAuthSettings(settings: {
  primaryMethod: 'pin' | 'fingerprint' | 'pattern';
  biometricsEnabled: boolean;
}): Promise<void> {
  localStorage.setItem('playthat_vault_auth_settings', JSON.stringify(settings));
}

export function getVaultAuthSettings(): {
  primaryMethod: 'pin' | 'fingerprint' | 'pattern';
  biometricsEnabled: boolean;
} {
  const saved = localStorage.getItem('playthat_vault_auth_settings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return {
    primaryMethod: 'fingerprint',
    biometricsEnabled: true,
  };
}

export async function verifyVaultPIN(pin: string): Promise<boolean> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_METADATA, 'readonly');
    const store = tx.objectStore(STORE_METADATA);
    const req = store.get('pin_hash');
    req.onsuccess = async () => {
      if (!req.result) {
        // If not configured, default fallback allows testing with '1234'
        resolve(pin === '1234');
        return;
      }
      try {
        const { salt, hash } = req.result;
        const saltArr = new Uint8Array(salt);
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
          'raw',
          enc.encode(pin),
          'PBKDF2',
          false,
          ['deriveBits']
        );
        const derivedBits = await window.crypto.subtle.deriveBits(
          {
            name: 'PBKDF2',
            salt: saltArr,
            iterations: 100000,
            hash: 'SHA-256',
          },
          keyMaterial,
          256
        );

        const derivedArr = new Uint8Array(derivedBits);
        const targetArr = new Uint8Array(hash);
        let match = derivedArr.length === targetArr.length;
        for (let i = 0; i < derivedArr.length; i++) {
          if (derivedArr[i] !== targetArr[i]) match = false;
        }
        resolve(match);
      } catch (err) {
        reject(err);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// Encrypt and store media file in vault
export async function encryptAndSaveMedia(
  id: string,
  pin: string,
  fileData: ArrayBuffer,
  metadata: {
    title: string;
    fileSize: number;
    duration: number;
    resolution: string;
    codec: string;
    thumbnailUrl?: string;
    mimeType: string;
  }
): Promise<boolean> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    fileData
  );

  const record: EncryptedPayload = {
    id,
    iv: Array.from(iv),
    salt: Array.from(salt),
    ciphertext,
    metadata,
    addedAt: Date.now(),
  };

  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VAULT, 'readwrite');
    const store = tx.objectStore(STORE_VAULT);
    store.put(record);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// Get all encrypted vault records (headers only without decrypting heavy blobs)
export async function getVaultItemList(): Promise<Array<{
  id: string;
  title: string;
  fileSize: number;
  duration: number;
  resolution: string;
  codec: string;
  thumbnailUrl?: string;
  addedAt: number;
}>> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VAULT, 'readonly');
    const store = tx.objectStore(STORE_VAULT);
    const req = store.getAll();
    req.onsuccess = () => {
      const records: EncryptedPayload[] = req.result || [];
      const items = records.map((r) => ({
        id: r.id,
        title: r.metadata.title,
        fileSize: r.metadata.fileSize,
        duration: r.metadata.duration,
        resolution: r.metadata.resolution,
        codec: r.metadata.codec,
        thumbnailUrl: r.metadata.thumbnailUrl,
        addedAt: r.addedAt,
      }));
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

// Decrypt and return a playable Blob URL for a specific vault item
export async function decryptVaultMedia(
  id: string,
  pin: string
): Promise<{ blobUrl: string; mimeType: string; metadata: any } | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VAULT, 'readonly');
    const store = tx.objectStore(STORE_VAULT);
    const req = store.get(id);
    req.onsuccess = async () => {
      const record: EncryptedPayload = req.result;
      if (!record) {
        resolve(null);
        return;
      }
      try {
        const salt = new Uint8Array(record.salt);
        const iv = new Uint8Array(record.iv);
        const key = await deriveKey(pin, salt);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          key,
          record.ciphertext
        );

        const blob = new Blob([decryptedBuffer], {
          type: record.metadata.mimeType || 'video/mp4',
        });
        const blobUrl = URL.createObjectURL(blob);
        resolve({
          blobUrl,
          mimeType: record.metadata.mimeType || 'video/mp4',
          metadata: record.metadata,
        });
      } catch (err) {
        console.error('Vault decryption failed (likely wrong PIN):', err);
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// Delete item from vault
export async function deleteVaultItem(id: string): Promise<boolean> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VAULT, 'readwrite');
    const store = tx.objectStore(STORE_VAULT);
    store.delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// Plaintext local media blob storage (for downloaded streams or uploaded files)
export async function saveLocalMediaBlob(
  id: string,
  blob: Blob
): Promise<boolean> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIA, 'readwrite');
    const store = tx.objectStore(STORE_MEDIA);
    store.put({ id, blob, savedAt: Date.now() });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLocalMediaBlobUrl(id: string): Promise<string | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEDIA, 'readonly');
    const store = tx.objectStore(STORE_MEDIA);
    const req = store.get(id);
    req.onsuccess = () => {
      if (req.result && req.result.blob) {
        resolve(URL.createObjectURL(req.result.blob));
      } else {
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}
