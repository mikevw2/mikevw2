// The preference profile: its shape, defaults and starter presets.
// Loaded as a classic script so the service worker, extension pages and
// content scripts can all share it.
(function (global) {
  'use strict';

  const DEFAULT_PROFILE = Object.freeze({
    version: 1,
    size: 100,             // percent: 100 | 115 | 130 | 150 | 175 | 200
    font: 'default',       // default | readable | dyslexic | serif
    spacing: 'default',    // default | comfortable | extra
    lineWidth: 'default',  // default | narrow
    theme: 'default',      // default | dark | light-contrast | dark-contrast | sepia
    underlineLinks: false,
    reduceMotion: false,
    stopAutoplay: false,
    hidePopups: false,
    bigTargets: false,
    strongFocus: false,
  });

  const PRESETS = {
    none: { label: 'Start from scratch', values: {} },
    lowVision: {
      label: 'Low vision',
      values: { size: 150, font: 'readable', spacing: 'comfortable', theme: 'dark-contrast', underlineLinks: true, strongFocus: true, bigTargets: true },
    },
    dyslexia: {
      label: 'Dyslexia-friendly',
      values: { size: 115, font: 'dyslexic', spacing: 'extra', lineWidth: 'narrow', theme: 'sepia' },
    },
    calm: {
      label: 'Calm & focused',
      values: { reduceMotion: true, stopAutoplay: true, hidePopups: true, lineWidth: 'narrow', spacing: 'comfortable' },
    },
    motor: {
      label: 'Easier to tap & click',
      values: { size: 115, bigTargets: true, strongFocus: true, hidePopups: true, reduceMotion: true },
    },
  };

  // Accepts anything (e.g. an imported file) and returns a valid profile,
  // dropping unknown keys and bad values.
  function normalizeProfile(input) {
    const out = { ...DEFAULT_PROFILE };
    if (!input || typeof input !== 'object') return out;
    const oneOf = (key, allowed) => {
      if (allowed.includes(input[key])) out[key] = input[key];
    };
    oneOf('size', [100, 115, 130, 150, 175, 200]);
    oneOf('font', ['default', 'readable', 'dyslexic', 'serif']);
    oneOf('spacing', ['default', 'comfortable', 'extra']);
    oneOf('lineWidth', ['default', 'narrow']);
    oneOf('theme', ['default', 'dark', 'light-contrast', 'dark-contrast', 'sepia']);
    for (const key of ['underlineLinks', 'reduceMotion', 'stopAutoplay', 'hidePopups', 'bigTargets', 'strongFocus']) {
      if (typeof input[key] === 'boolean') out[key] = input[key];
    }
    return out;
  }

  global.TailorProfile = { DEFAULT_PROFILE, PRESETS, normalizeProfile };
})(typeof self !== 'undefined' ? self : globalThis);
