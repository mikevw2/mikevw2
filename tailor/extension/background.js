// Service worker: the only place content scripts can get the decrypted
// profile from. Keeps a copy in memory while it's awake.
importScripts('lib/profile.js', 'lib/vault.js');

let cache = null;

async function getData() {
  if (!cache) cache = await TailorVault.load();
  return cache;
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && TailorVault.STORAGE_KEY in changes) cache = null;
});

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'tailor:get-profile') {
    getData()
      .then(({ profile, sites }) => {
        const site = msg.host ? sites[msg.host] : null;
        sendResponse({ profile, off: Boolean(site && site.off) });
      })
      .catch(() => sendResponse({ profile: null, off: false }));
    return true; // keep the channel open for the async reply
  }
  return false;
});
