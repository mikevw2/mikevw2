(async function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const show = (id) => { $(id).hidden = false; };

  document.querySelectorAll('.open-settings').forEach((b) =>
    b.addEventListener('click', () => { chrome.runtime.openOptionsPage(); window.close(); }));

  // ?tabId= lets the popup be opened as a normal page (used by the tests).
  const param = new URLSearchParams(location.search).get('tabId');
  const tabId = param ? Number(param) : (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;

  const send = (msg) => new Promise((resolve) => {
    if (tabId == null) return resolve(null);
    chrome.tabs.sendMessage(tabId, msg, (res) => resolve(chrome.runtime.lastError ? null : res));
  });

  const status = await send({ type: 'tailor:status' });
  if (!status) {
    $('host').textContent = 'This page';
    show('unsupported');
    return;
  }
  $('host').textContent = status.host || 'This page';
  if (!status.hasProfile) {
    show('setup');
    return;
  }

  show('ready');
  const toggle = $('siteToggle');
  const reader = $('reader');
  toggle.checked = !status.off;
  reader.textContent = status.readerOpen ? 'Back to original page' : 'Simplify this page';

  toggle.addEventListener('change', async () => {
    const on = toggle.checked;
    await TailorVault.update((data) => {
      const sites = { ...data.sites };
      if (on) delete sites[status.host];
      else sites[status.host] = { off: true };
      return { ...data, sites };
    });
  });

  reader.addEventListener('click', async () => {
    await send({ type: 'tailor:reader' });
    window.close();
  });
})();
