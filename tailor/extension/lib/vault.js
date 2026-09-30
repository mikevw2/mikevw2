// Encrypted, on-device storage for the profile and per-site settings.
//
// Data is encrypted with AES-GCM (256-bit) before it is written to
// chrome.storage.local, so nothing readable sits in extension storage.
// Nothing here talks to a network. There is no server.
//
// Two ways to hold the data key:
//
// - Standard: a non-extractable CryptoKey generated on this device and kept
//   in the extension's IndexedDB. Scripts can use it but never read its bytes.
//   Unlocks automatically.
//
// - Passkey: the data key is stored only in wrapped (encrypted) form. The
//   wrapping key is derived from a secret that the user's passkey computes
//   inside its secure hardware (WebAuthn PRF), after a fingerprint, face or
//   PIN check. Copying the browser's files is not enough to decrypt. Once
//   unlocked, the data key is held in chrome.storage.session, which lives in
//   memory only and is cleared when the browser closes. The WebAuthn part is
//   in passkey.js; this file only handles keys and data.
//
// Used by the service worker and extension pages only (they share the
// extension origin). Content scripts never see keys; they ask the service
// worker for the decrypted profile.
(function (global) {
  'use strict';

  const DB_NAME = 'tailor-keys';
  const STORE = 'keys';
  const KEY_ID = 'vault-key';
  const VAULT_KEY = 'vault';
  const PASSKEY_KEY = 'passkey';
  const SESSION_KEY = 'dek';

  class LockedError extends Error {
    constructor() {
      super('Tailor is locked');
      this.name = 'LockedError';
    }
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function idb(mode, fn) {
    const db = await openDb();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(req && req.result);
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  }

  const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const fromB64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
  const AES = { name: 'AES-GCM', length: 256 };

  async function getPasskeyRecord() {
    return (await chrome.storage.local.get(PASSKEY_KEY))[PASSKEY_KEY] || null;
  }

  // ---- Standard key ---------------------------------------------------------

  // Read fresh every time rather than cached: the worker and each extension
  // page have their own memory, and a page may replace or delete the key
  // (passkey on/off, wipe). A cached copy would go stale.
  async function getStandardKey() {
    const existing = await idb('readonly', (s) => s.get(KEY_ID));
    if (existing) return existing;
    const key = await crypto.subtle.generateKey(AES, false, ['encrypt', 'decrypt']);
    try {
      // add() fails if another context created a key first; use theirs.
      await idb('readwrite', (s) => s.add(key, KEY_ID));
      return key;
    } catch {
      return idb('readonly', (s) => s.get(KEY_ID));
    }
  }

  async function deleteStandardKey() {
    await idb('readwrite', (s) => s.delete(KEY_ID));
  }

  // ---- Current data key -----------------------------------------------------

  async function getKey() {
    if (await getPasskeyRecord()) {
      const raw = (await chrome.storage.session.get(SESSION_KEY))[SESSION_KEY];
      if (!raw) throw new LockedError();
      return crypto.subtle.importKey('raw', fromB64(raw), AES, false, ['encrypt', 'decrypt']);
    }
    return getStandardKey();
  }

  async function encryptWith(key, data) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plain = new TextEncoder().encode(JSON.stringify({ profile: data.profile, sites: data.sites || {} }));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);
    return { v: 1, iv: toB64(iv), ct: toB64(ct) };
  }

  // ---- Data -------------------------------------------------------------------

  const EMPTY = () => ({ profile: null, sites: {}, locked: false });

  // Returns { profile, sites, locked } where sites maps hostname -> { off: true }.
  // When locked, profile is null and locked is true.
  async function load() {
    const stored = (await chrome.storage.local.get(VAULT_KEY))[VAULT_KEY];
    if (!stored) return EMPTY();
    let key;
    try {
      key = await getKey();
    } catch (err) {
      if (err instanceof LockedError) return { profile: null, sites: {}, locked: true };
      throw err;
    }
    try {
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(stored.iv) }, key, fromB64(stored.ct));
      const data = JSON.parse(new TextDecoder().decode(plain));
      return {
        profile: data.profile ? global.TailorProfile.normalizeProfile(data.profile) : null,
        sites: data.sites && typeof data.sites === 'object' ? data.sites : {},
        locked: false,
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
    await chrome.storage.local.set({ [VAULT_KEY]: await encryptWith(key, data) });
  }

  async function update(fn) {
    const data = await load();
    if (data.locked) throw new LockedError();
    const next = fn(data) || data;
    await save(next);
    return next;
  }

  async function status() {
    const passkey = await getPasskeyRecord();
    if (!passkey) return { mode: 'standard', locked: false };
    const raw = (await chrome.storage.session.get(SESSION_KEY))[SESSION_KEY];
    return { mode: 'passkey', locked: !raw };
  }

  // ---- Passkey mode -------------------------------------------------------------

  // Switches to passkey mode. `wrappingKey` is an AES-GCM key derived from the
  // passkey's PRF output; `credential` is { id, salt } (base64) for unlocking.
  async function enablePasskey(wrappingKey, credential) {
    const data = await load();
    if (data.locked) throw new LockedError();
    if (await getPasskeyRecord()) throw new Error('Passkey protection is already on');

    // A fresh data key. Its raw bytes exist only in memory and, wrapped, on disk.
    const raw = crypto.getRandomValues(new Uint8Array(32));
    const key = await crypto.subtle.importKey('raw', raw, AES, false, ['encrypt', 'decrypt']);
    const wrapIv = crypto.getRandomValues(new Uint8Array(12));
    const wrapped = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: wrapIv }, wrappingKey, raw);
    const vault = await encryptWith(key, data);

    await chrome.storage.session.set({ [SESSION_KEY]: toB64(raw) });
    // Record and re-encrypted data land together, so there's never a moment
    // where the data is encrypted with a key nobody can recover.
    await chrome.storage.local.set({
      [VAULT_KEY]: vault,
      [PASSKEY_KEY]: { v: 1, credentialId: credential.id, prfSalt: credential.salt, wrapIv: toB64(wrapIv), wrapped: toB64(wrapped) },
    });
    await deleteStandardKey();
    raw.fill(0);
  }

  // Unwraps the data key with a key derived from the passkey. Throws if the
  // passkey's secret doesn't match.
  async function unlock(wrappingKey) {
    const rec = await getPasskeyRecord();
    if (!rec) return;
    const raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(rec.wrapIv) }, wrappingKey, fromB64(rec.wrapped));
    await chrome.storage.session.set({ [SESSION_KEY]: toB64(raw) });
  }

  async function lock() {
    await chrome.storage.session.remove(SESSION_KEY);
  }

  // Back to standard mode. Must be unlocked.
  async function disablePasskey() {
    const data = await load();
    if (data.locked) throw new LockedError();
    await deleteStandardKey();
    // getStandardKey() directly: getKey() would still pick the passkey while
    // its record exists.
    const vault = await encryptWith(await getStandardKey(), data);
    // One write, so the data never points at the wrong key; then tidy up.
    await chrome.storage.local.set({ [VAULT_KEY]: vault, [PASSKEY_KEY]: null });
    await chrome.storage.local.remove(PASSKEY_KEY);
    await chrome.storage.session.remove(SESSION_KEY);
  }

  async function getPasskeyCredential() {
    const rec = await getPasskeyRecord();
    return rec ? { id: rec.credentialId, salt: rec.prfSalt } : null;
  }

  // Removes the encrypted data and destroys every key.
  async function wipe() {
    await chrome.storage.local.remove([VAULT_KEY, PASSKEY_KEY]);
    await chrome.storage.session.remove(SESSION_KEY);
    await deleteStandardKey();
  }

  global.TailorVault = {
    load, save, update, wipe, status,
    enablePasskey, disablePasskey, unlock, lock, getPasskeyCredential,
    LockedError,
    STORAGE_KEY: VAULT_KEY, PASSKEY_KEY, SESSION_KEY,
  };
})(typeof self !== 'undefined' ? self : globalThis);
