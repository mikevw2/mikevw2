/* Real Feed — content script: scans the feed and filters AI videos. */
(function () {
  'use strict';
  const AIFF = globalThis.AIFF;
  const host = location.hostname;
  const platform = /tiktok\.com$/.test(host) ? AIFF.platforms.tiktok : AIFF.platforms.youtube;
  if (!platform) return;

  let settings = AIFF.mergeSettings();
  const revealed = new Set(); // videos the user chose to show anyway
  const counted = new Set(); // videos already counted in stats
  let pendingStats = 0;
  let lastSkip = 0;

  const ACTIVE = 'aiff-host aiff-hidden aiff-blurred aiff-covered'.split(' ');

  // ---- settings -----------------------------------------------------------

  async function loadSettings() {
    try {
      settings = AIFF.mergeSettings(await chrome.storage.sync.get(null));
    } catch (_) {
      settings = AIFF.mergeSettings();
    }
  }

  async function addToList(key, handle) {
    if (!handle) return;
    const cur = AIFF.mergeSettings(await chrome.storage.sync.get(null));
    const other = key === 'blockedChannels' ? 'allowedChannels' : 'blockedChannels';
    const next = {};
    next[key] = Array.from(new Set(cur[key].concat(handle)));
    next[other] = cur[other].filter((h) => AIFF.detector.normalizeHandle(h) !== handle);
    await chrome.storage.sync.set(next); // onChanged triggers a rescan
  }

  function bumpStats() {
    pendingStats++;
    clearTimeout(bumpStats.t);
    bumpStats.t = setTimeout(async () => {
      const n = pendingStats;
      pendingStats = 0;
      const { stats = {} } = await chrome.storage.local.get('stats');
      stats.total = (stats.total || 0) + n;
      stats[platform.id] = (stats[platform.id] || 0) + n;
      await chrome.storage.local.set({ stats });
    }, 1000);
  }

  // ---- rendering ----------------------------------------------------------

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    n.className = 'aiff-injected ' + (cls || '');
    if (text) n.textContent = text;
    return n;
  }

  function button(label, onClick, cls) {
    const b = el('button', 'aiff-btn ' + (cls || ''), label);
    b.type = 'button';
    const swallow = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };
    // Cards are links; keep clicks on our buttons from navigating.
    for (const ev of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) b.addEventListener(ev, swallow, true);
    b.addEventListener('click', (e) => {
      swallow(e);
      onClick();
    }, true);
    return b;
  }

  function describe(result) {
    return result.reasons.filter((r) => !/not made by it|says it is not/.test(r)).slice(0, 3).join(' · ');
  }

  function panel(card, video, result, opts) {
    const box = el('div', 'aiff-panel');
    box.append(el('div', 'aiff-panel-title', '🤖 Likely AI-generated'));
    box.append(el('div', 'aiff-panel-reasons', describe(result)));
    const actions = el('div', 'aiff-panel-actions');
    if (opts.back) actions.append(button('Go back', () => history.back()));
    actions.append(
      button('Show anyway', () => {
        revealed.add(card.dataset.aiffKey);
        reset(card);
        apply(card, video, result); // re-renders as a labeled video
      })
    );
    if (video.channelId) {
      actions.append(button('Not AI · trust ' + video.channelId, () => addToList('allowedChannels', video.channelId), 'aiff-btn-ghost'));
    }
    box.append(actions);
    return box;
  }

  function addMarkButton(card, video) {
    if (!video.channelId || video.kind === 'watch') return;
    card.classList.add('aiff-host');
    const b = button('🤖 Mark AI', () => addToList('blockedChannels', video.channelId), 'aiff-mark');
    b.title = 'Hide all videos from ' + video.channelId + ' as AI';
    card.append(b);
  }

  function reset(card) {
    card.classList.remove(...ACTIVE);
    card.querySelectorAll(':scope > .aiff-injected').forEach((n) => n.remove());
    if (card.dataset.aiffWatch) {
      const banner = document.getElementById('aiff-watch-banner');
      if (banner) banner.remove();
    }
    delete card.dataset.aiffState;
    delete card.dataset.aiffWatch;
    feedObserver.unobserve(card);
  }

  function apply(card, video, result) {
    const mode = settings.mode;
    if (mode === 'label' || revealed.has(card.dataset.aiffKey)) {
      card.classList.add('aiff-host');
      const badge = el('div', 'aiff-badge', '🤖 AI');
      badge.title = describe(result);
      card.append(badge);
      card.dataset.aiffState = 'labeled';
      return;
    }

    if (video.kind === 'watch') {
      // Don't yank a page the user deliberately opened; warn and pause instead.
      const banner = el('div', 'aiff-watch-banner');
      banner.id = 'aiff-watch-banner';
      banner.append(panel(card, video, result, { back: true }));
      card.prepend(banner);
      card.dataset.aiffWatch = '1';
      card.dataset.aiffState = mode === 'hide' ? 'covered' : 'warned';
      if (mode === 'hide') {
        platform.pause(card, 'watch');
        setTimeout(() => card.dataset.aiffState === 'covered' && platform.pause(card, 'watch'), 1200);
      }
      return;
    }

    if (mode === 'hide' && video.kind === 'grid') {
      card.classList.add('aiff-hidden');
      card.dataset.aiffState = 'hidden';
      return;
    }

    // Blur mode, or hide mode in a snap-scrolling feed where removing the
    // element would break the platform's scroller: cover it and move on.
    card.classList.add('aiff-host', mode === 'hide' ? 'aiff-covered' : 'aiff-blurred');
    const overlay = el('div', 'aiff-overlay');
    overlay.append(panel(card, video, result, {}));
    card.append(overlay);
    card.dataset.aiffState = 'covered';
    if (video.kind === 'feed') {
      platform.pause(card, 'feed');
      feedObserver.observe(card);
    }
  }

  // ---- scanning -----------------------------------------------------------

  function process(card) {
    const video = platform.extract(card);
    if (!video) return;
    const key = [video.channelId, video.channel, video.title, video.description.slice(0, 120)].join('|');
    const sig = [key, video.labels.join('|'), video.text.length].join('|');
    if (card.dataset.aiffSig === sig) return;

    reset(card);
    card.dataset.aiffSig = sig;
    card.dataset.aiffKey = key;
    const result = AIFF.detector.evaluate(video, settings);
    card.dataset.aiffScore = String(result.score);
    if (result.isAI) {
      apply(card, video, result);
      if (!counted.has(key)) {
        counted.add(key);
        bumpStats();
      }
    } else if (settings.showMarkButton) {
      addMarkButton(card, video);
    }
  }

  function resetAll() {
    document.querySelectorAll('[data-aiff-sig]').forEach((card) => {
      reset(card);
      delete card.dataset.aiffSig;
      delete card.dataset.aiffScore;
    });
  }

  function active() {
    return settings.enabled && settings[platform.id] !== false;
  }

  function scan() {
    if (!active()) return;
    for (const card of platform.findCards(document)) {
      try {
        process(card);
      } catch (err) {
        console.debug('[Real Feed] skipped a card:', err);
      }
    }
  }

  let scheduled = null;
  function scheduleScan() {
    if (scheduled) return;
    scheduled = setTimeout(() => {
      scheduled = null;
      scan();
    }, 250);
  }

  // Auto-skip covered videos when they scroll into view in Shorts / For You.
  const feedObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting || e.intersectionRatio < 0.6) continue;
        const card = e.target;
        if (card.dataset.aiffState !== 'covered') continue;
        platform.pause(card, 'feed');
        const now = Date.now();
        if (settings.autoSkip && settings.mode === 'hide' && now - lastSkip > 900) {
          lastSkip = now;
          setTimeout(() => card.dataset.aiffState === 'covered' && platform.skip(card), 400);
        }
      }
    },
    { threshold: [0.6] }
  );

  // Keep covered videos from starting playback on their own.
  document.addEventListener(
    'play',
    (e) => {
      const v = e.target;
      if (!(v instanceof HTMLVideoElement)) return;
      const covered = v.closest('[data-aiff-state="covered"]');
      const watch = document.querySelector('[data-aiff-watch][data-aiff-state="covered"]');
      if (covered || (watch && v.closest('#movie_player'))) v.pause();
    },
    true
  );

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== 'sync') return;
    await loadSettings();
    resetAll();
    scan();
  });

  (async function init() {
    await loadSettings();
    scan();
    new MutationObserver(scheduleScan).observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    // YouTube's SPA navigation
    document.addEventListener('yt-navigate-finish', scheduleScan);
    // Safety net for content that changes without DOM mutations we can see.
    setInterval(scheduleScan, 3000);
  })();
})();
