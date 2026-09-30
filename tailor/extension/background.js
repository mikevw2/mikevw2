// Service worker: the only place content scripts can get the decrypted
// profile from. Keeps a copy in memory while it's awake.
importScripts('lib/profile.js', 'lib/vault.js');

let cache = null;

async function getData() {
  if (!cache) cache = await TailorVault.load();
  return cache;
}

// Shows a "!" on the toolbar button while a passkey-protected profile is locked.
async function updateBadge() {
  const { locked } = await TailorVault.status();
  await chrome.action.setBadgeText({ text: locked ? '!' : '' });
  await chrome.action.setBadgeBackgroundColor({ color: '#a3261b' });
  await chrome.action.setTitle({ title: locked ? 'Tailor is locked. Click to unlock.' : 'Tailor' });
}

// Lock and unlock only touch session storage, which content scripts can't
// see, so tell open tabs to fetch the profile again.
async function refreshTabs() {
  for (const tab of await chrome.tabs.query({})) {
    chrome.tabs.sendMessage(tab.id, { type: 'tailor:refresh' }).catch(() => {});
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  const local = area === 'local' && (TailorVault.STORAGE_KEY in changes || TailorVault.PASSKEY_KEY in changes);
  const session = area === 'session' && TailorVault.SESSION_KEY in changes;
  if (!local && !session) return;
  cache = null;
  updateBadge();
  if (session) refreshTabs();
});

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') chrome.runtime.openOptionsPage();
});

chrome.runtime.onStartup.addListener(updateBadge);
updateBadge();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'tailor:get-profile') {
    getData()
      .then(({ profile, sites, locked }) => {
        const site = msg.host ? sites[msg.host] : null;
        sendResponse({ profile, locked, off: Boolean(site && site.off) });
      })
      .catch(() => sendResponse({ profile: null, off: false }));
    return true; // keep the channel open for the async reply
  }
  return false;
});
