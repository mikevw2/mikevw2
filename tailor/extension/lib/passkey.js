// Passkey (WebAuthn PRF) protection for the vault. Extension pages only:
// WebAuthn needs a visible, focused page, so this can't run in the worker.
//
// The passkey's PRF extension asks the authenticator (Touch ID / Windows
// Hello / Android / a security key) to compute HMAC(secret, salt) with a
// secret that never leaves its secure hardware, after checking the user's
// fingerprint, face or PIN. We stretch that output with HKDF into the key
// that wraps the vault's data key. There is no server: the challenge is
// random and never checked, because we use the passkey only for its secret.
(function (global) {
  'use strict';

  const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const fromB64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
  const random = (n) => crypto.getRandomValues(new Uint8Array(n));

  class PasskeyError extends Error {
    constructor(message, code) {
      super(message);
      this.name = 'PasskeyError';
      this.code = code;
    }
  }

  function isSupported() {
    return typeof PublicKeyCredential !== 'undefined' && !!navigator.credentials;
  }

  async function wrappingKeyFrom(prfOutput) {
    const base = await crypto.subtle.importKey('raw', prfOutput, 'HKDF', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: new TextEncoder().encode('tailor/vault-wrap/v1') },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  // Turns WebAuthn's DOMExceptions into messages a person can act on.
  function explain(err) {
    if (err instanceof PasskeyError) return err;
    if (err && err.name === 'NotAllowedError') {
      return new PasskeyError('The passkey request was cancelled or timed out.', 'cancelled');
    }
    if (err && err.name === 'InvalidStateError') {
      return new PasskeyError('That passkey is already registered.', 'exists');
    }
    return new PasskeyError(`Passkey error: ${(err && err.message) || err}`, 'failed');
  }

  async function evaluatePrf(credentialId, salt) {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: random(32),
        allowCredentials: [{ type: 'public-key', id: credentialId }],
        userVerification: 'required',
        timeout: 120000,
        extensions: { prf: { eval: { first: salt } } },
      },
    });
    const out = assertion.getClientExtensionResults().prf;
    if (!out || !out.results || !out.results.first) {
      throw new PasskeyError("This passkey can't produce the secret Tailor needs. Try a different passkey or security key.", 'no-prf');
    }
    return out.results.first;
  }

  // Creates a passkey and switches the vault to passkey mode.
  async function enable() {
    if (!isSupported()) throw new PasskeyError("This browser doesn't support passkeys.", 'unsupported');
    try {
      const salt = random(32);
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge: random(32),
          rp: { name: 'Tailor' },
          user: { id: random(16), name: 'Tailor profile', displayName: 'Tailor profile' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: { userVerification: 'required', residentKey: 'preferred' },
          timeout: 120000,
          extensions: { prf: { eval: { first: salt } } },
        },
      });
      const ext = cred.getClientExtensionResults().prf;
      if (!ext || !ext.enabled) {
        throw new PasskeyError("This passkey can't produce the secret Tailor needs. Try a different passkey or security key.", 'no-prf');
      }
      // Some authenticators return the secret at creation; others need a sign-in.
      const prf = (ext.results && ext.results.first) || (await evaluatePrf(cred.rawId, salt));
      const wrappingKey = await wrappingKeyFrom(prf);
      await global.TailorVault.enablePasskey(wrappingKey, { id: toB64(cred.rawId), salt: toB64(salt) });
    } catch (err) {
      throw explain(err);
    }
  }

  // Asks for the passkey and unlocks the vault for this browser session.
  async function unlock() {
    const cred = await global.TailorVault.getPasskeyCredential();
    if (!cred) return;
    try {
      const prf = await evaluatePrf(fromB64(cred.id), fromB64(cred.salt));
      await global.TailorVault.unlock(await wrappingKeyFrom(prf));
    } catch (err) {
      if (err && err.name === 'OperationError') {
        throw new PasskeyError("That passkey doesn't match the one that protects your profile.", 'mismatch');
      }
      throw explain(err);
    }
  }

  global.TailorPasskey = { isSupported, enable, unlock, PasskeyError };
})(typeof self !== 'undefined' ? self : globalThis);
