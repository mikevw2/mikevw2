(function () {
  'use strict';

  const btn = document.getElementById('unlock');
  const status = document.querySelector('.status');

  function say(msg, isError) {
    status.textContent = msg;
    status.classList.toggle('error', Boolean(isError));
  }

  async function done() {
    say('Unlocked. Your websites will adapt now.');
    btn.hidden = true;
    const tab = await chrome.tabs.getCurrent();
    if (tab) setTimeout(() => chrome.tabs.remove(tab.id), 1200);
  }

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    say('Waiting for your passkey…');
    try {
      await TailorPasskey.unlock();
      await done();
    } catch (err) {
      say(err.message, true);
      btn.disabled = false;
    }
  });

  (async () => {
    const { locked } = await TailorVault.status();
    if (!locked) {
      say('Your profile is already unlocked.');
      btn.hidden = true;
      return;
    }
    btn.focus();
  })();
})();
