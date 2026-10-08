/* Real Feed — popup settings. */
(function () {
  'use strict';
  const AIFF = globalThis.AIFF;
  const $ = (id) => document.getElementById(id);
  const LISTS = ['blockedChannels', 'allowedChannels', 'customKeywords'];
  const CHECKS = ['enabled', 'youtube', 'tiktok', 'autoSkip', 'showMarkButton'];
  const HINTS = {
    relaxed: 'Only platform AI labels and clearly tagged AI videos.',
    balanced: 'Platform labels, AI hashtags, and creators saying it’s AI-made.',
    strict: 'Also catches lighter hints like #ai or AI-named channels. More false positives.',
  };

  const parseList = (text, isHandle) =>
    Array.from(
      new Set(
        text
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => (isHandle ? '@' + s.replace(/^@/, '').toLowerCase() : s))
      )
    );

  function render(s) {
    CHECKS.forEach((k) => ($(k).checked = !!s[k]));
    document.querySelector(`input[name=mode][value=${s.mode}]`).checked = true;
    document.querySelector(`input[name=sensitivity][value=${s.sensitivity}]`).checked = true;
    $('sensitivity-hint').textContent = HINTS[s.sensitivity];
    LISTS.forEach((k) => {
      if (document.activeElement !== $(k)) $(k).value = s[k].join('\n');
      $(k + '-count').textContent = s[k].length ? `(${s[k].length})` : '';
    });
    $('controls').disabled = !s.enabled;
    document.body.classList.toggle('off', !s.enabled);
  }

  function renderStats(stats) {
    stats = stats || {};
    $('stat-total').textContent = (stats.total || 0).toLocaleString();
    $('stat-youtube').textContent = (stats.youtube || 0).toLocaleString();
    $('stat-tiktok').textContent = (stats.tiktok || 0).toLocaleString();
  }

  let savedTimer;
  async function save(patch) {
    await chrome.storage.sync.set(patch);
    $('saved').textContent = 'Saved';
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => ($('saved').textContent = ''), 1200);
    render(AIFF.mergeSettings(await chrome.storage.sync.get(null)));
  }

  async function init() {
    render(AIFF.mergeSettings(await chrome.storage.sync.get(null)));
    renderStats((await chrome.storage.local.get('stats')).stats);

    CHECKS.forEach((k) => $(k).addEventListener('change', () => save({ [k]: $(k).checked })));
    document.querySelectorAll('input[name=mode], input[name=sensitivity]').forEach((r) =>
      r.addEventListener('change', () => save({ [r.name]: r.value }))
    );
    LISTS.forEach((k) =>
      $(k).addEventListener('change', () => save({ [k]: parseList($(k).value, k !== 'customKeywords') }))
    );
    $('reset-stats').addEventListener('click', async () => {
      await chrome.storage.local.set({ stats: {} });
      renderStats({});
    });

    chrome.storage.onChanged.addListener(async (changes, area) => {
      if (area === 'local' && changes.stats) renderStats(changes.stats.newValue);
      if (area === 'sync') render(AIFF.mergeSettings(await chrome.storage.sync.get(null)));
    });
  }

  init();
})();
