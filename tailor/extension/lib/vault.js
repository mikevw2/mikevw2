// Encrypted, on-device storage for the profile and per-site settings.
//
// - Data is encrypted with AES-GCM (256-bit) before it is written to
//   chrome.storage.local, so nothing readable sits in extension storage.
// - The key is generated on this device as a non-extractable CryptoKey and
//   kept in the extension's own IndexedDB. Scripts can use it but can never
//   read or export its raw bytes.
// - Nothing here talks to a network. There is no server.
//
// Used by the service worker and extension pages only (they share the
// extension origin, so they see the same IndexedDB). Content scripts never
// touch the key; they ask the service worker for the decrypted profile.
(function (global) {
  'use strict';

  const DB_NAME = 'tailor-keys';
  const STORE = 'keys';
  const KEY_ID = 'vault-key';
  const VAULT_KEY = 'vault';

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function idb(db, mode, fn) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req && req.result);
      tx.onerror = () => reject(tx.error);
    });
  }

  let keyPromise = null;

  async function getKey() {
    if (!keyPromise) {
      keyPromise = (async () => {
        const db = await openDb();
        let key = await idb(db, 'readonly', (s) => s.get(KEY_ID));
        if (!key) {
          key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
          await idb(db, 'readwrite', (s) => s.put(key, KEY_ID));
        }
        db.close();
        return key;
      })().catch((err) => {
        keyPromise = null;
        throw err;
      });
    }
    return keyPromise;
  }

  const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const fromB64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

  const EMPTY = () => ({ profile: null, sites: {} });

  // Returns { profile, sites } where sites maps hostname -> { off: true }.
  async function load() {
    const stored = (await chrome.storage.local.get(VAULT_KEY))[VAULT_KEY];
    if (!stored) return EMPTY();
    try {
      const key = await getKey();
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(stored.iv) }, key, fromB64(stored.ct));
      const data = JSON.parse(new TextDecoder().decode(plain));
      return {
        profile: data.profile ? global.TailorProfile.normalizeProfile(data.profile) : null,
        sites: data.sites && typeof data.sites === 'object' ? data.sites : {},
      };
    } catch (err) {
      // Key missing or data tampered with: treat as no profile rather than
      // applying something we can't verify.
      console.warn('Tailor: could not decrypt saved data', err);
      return EMPTY();
    }
  }

  async function save(data) {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plain = new TextEncoder().encode(JSON.stringify({ profile: data.profile, sites: data.sites || {} }));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);
    await chrome.storage.local.set({ [VAULT_KEY]: { v: 1, iv: toB64(iv), ct: toB64(ct) } });
  }

  async function update(fn) {
    const data = await load();
    const next = fn(data) || data;
    await save(next);
    return next;
  }

  // Removes the encrypted data and destroys the key.
  async function wipe() {
    await chrome.storage.local.remove(VAULT_KEY);
    const db = await openDb();
    await idb(db, 'readwrite', (s) => s.delete(KEY_ID));
    db.close();
    keyPromise = null;
  }

  global.TailorVault = { load, save, update, wipe, STORAGE_KEY: VAULT_KEY };
})(typeof self !== 'undefined' ? self : globalThis);
