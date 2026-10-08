/* Real Feed — shared settings and DOM helpers (content scripts + popup). */
(function (root) {
  'use strict';
  const AIFF = (root.AIFF = root.AIFF || {});
  AIFF.platforms = AIFF.platforms || {};

  AIFF.DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    youtube: true,
    tiktok: true,
    mode: 'hide', // hide | blur | label
    sensitivity: 'balanced', // strict | balanced | relaxed
    autoSkip: true, // skip flagged videos in Shorts / For You
    showMarkButton: true, // "Mark AI" button on hover
    blockedChannels: [],
    allowedChannels: [],
    customKeywords: [],
  });

  AIFF.mergeSettings = function (stored) {
    const out = Object.assign({}, AIFF.DEFAULT_SETTINGS, stored || {});
    for (const k of ['blockedChannels', 'allowedChannels', 'customKeywords']) {
      if (!Array.isArray(out[k])) out[k] = [];
    }
    return out;
  };

  /** Text content of `el`, skipping anything this extension injected. */
  AIFF.ownText = function (el, max) {
    max = max || 4000;
    if (!el) return '';
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode(n) {
        if (n.nodeType === 1) {
          return n.classList && n.classList.contains('aiff-injected')
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_SKIP;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let out = '';
    while (out.length < max && walker.nextNode()) out += walker.currentNode.nodeValue + ' ';
    return out.replace(/\s+/g, ' ').trim().slice(0, max);
  };

  AIFF.textOf = function (el, selector) {
    const n = el && el.querySelector(selector);
    return n ? AIFF.ownText(n, 1500) : '';
  };

  AIFF.allText = function (el, selector) {
    return el ? Array.from(el.querySelectorAll(selector), (n) => AIFF.ownText(n, 200)).filter(Boolean) : [];
  };

  /** Pull "@handle" (or a channel id) out of the first matching link. */
  AIFF.handleFromLinks = function (el, selector) {
    const links = el ? el.querySelectorAll(selector) : [];
    for (const a of links) {
      const href = a.getAttribute('href') || '';
      const m = href.match(/\/(@[^/?#]+)|\/(?:channel|c|user)\/([^/?#]+)/);
      if (m) {
        try {
          return decodeURIComponent(m[1] || m[2]).toLowerCase();
        } catch (_) {
          return (m[1] || m[2]).toLowerCase();
        }
      }
    }
    return '';
  };

  AIFF.pauseVideos = function (el) {
    if (!el) return;
    el.querySelectorAll('video').forEach((v) => {
      if (!v.paused) v.pause();
    });
  };
})(globalThis);
