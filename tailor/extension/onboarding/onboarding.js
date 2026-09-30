(function () {
  'use strict';

  const { DEFAULT_PROFILE, PRESETS, normalizeProfile } = TailorProfile;

  const form = document.getElementById('wizard');
  const steps = [...document.querySelectorAll('.step')];
  const stepList = document.querySelector('.steps');
  const backBtn = document.getElementById('back');
  const nextBtn = document.getElementById('next');
  const status = document.querySelector('.status');
  const previewStyle = document.createElement('style');
  document.head.appendChild(previewStyle);

  let profile = { ...DEFAULT_PROFILE };
  let current = 0;
  let saveTimer = null;

  // ---- Step navigation ------------------------------------------------------

  steps.forEach((s, i) => {
    const li = document.createElement('li');
    li.textContent = s.dataset.title;
    li.dataset.index = i;
    stepList.appendChild(li);
  });

  function showStep(i) {
    current = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach((s, n) => { s.hidden = n !== current; });
    [...stepList.children].forEach((li, n) => {
      if (n === current) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
      li.classList.toggle('done', n < current);
    });
    backBtn.style.visibility = current === 0 ? 'hidden' : 'visible';
    nextBtn.textContent = current === 0 ? "Let's go" : current === steps.length - 1 ? 'Finish' : 'Next';
    const heading = steps[current].querySelector('h1');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    scrollTo({ top: 0 });
    history.replaceState(null, '', `#${steps[current].dataset.step}`);
  }

  backBtn.addEventListener('click', () => showStep(current - 1));
  nextBtn.addEventListener('click', async () => {
    await saveNow();
    if (current === steps.length - 1) {
      say('Saved. You can close this tab.');
      return;
    }
    showStep(current + 1);
  });

  // ---- Presets ---------------------------------------------------------------

  const presetBox = document.getElementById('presets');
  for (const [id, preset] of Object.entries(PRESETS)) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'preset';
    input.value = id;
    label.append(input, ' ', preset.label);
    presetBox.appendChild(label);
  }
  presetBox.addEventListener('change', (e) => {
    const preset = PRESETS[e.target.value];
    if (!preset) return;
    profile = normalizeProfile({ ...DEFAULT_PROFILE, ...preset.values });
    render();
    scheduleSave();
  });

  // ---- Form <-> profile -------------------------------------------------------

  function render() {
    for (const [key, value] of Object.entries(profile)) {
      const inputs = form.querySelectorAll(`[name="${key}"]`);
      inputs.forEach((input) => {
        if (input.type === 'checkbox') input.checked = Boolean(value);
        else if (input.type === 'radio') input.checked = input.value === String(value);
      });
    }
    previewStyle.textContent = TailorStyles.build(profile, '.tailor-preview');
  }

  form.addEventListener('change', (e) => {
    const input = e.target;
    if (!input.name || input.name === 'preset' || !(input.name in DEFAULT_PROFILE)) return;
    let value;
    if (input.type === 'checkbox') value = input.checked;
    else if (typeof DEFAULT_PROFILE[input.name] === 'number') value = Number(input.value);
    else value = input.value;
    profile = normalizeProfile({ ...profile, [input.name]: value });
    render();
    scheduleSave();
  });

  // ---- Saving -------------------------------------------------------------------

  function say(msg) {
    status.textContent = msg;
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 250);
  }

  async function saveNow() {
    clearTimeout(saveTimer);
    try {
      await TailorVault.update((data) => ({ ...data, profile }));
      say('Saved on this device.');
    } catch (err) {
      console.error(err);
      say('Could not save. Please try again.');
    }
  }

  // ---- Export / import / wipe -----------------------------------------------------

  document.getElementById('export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ format: 'tailor-profile', ...profile }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tailor-profile.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  document.getElementById('import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      profile = normalizeProfile(JSON.parse(await file.text()));
      render();
      await saveNow();
      say('Profile loaded and saved.');
    } catch {
      say("That file doesn't look like a Tailor profile.");
    }
    e.target.value = '';
  });

  document.getElementById('wipe').addEventListener('click', async () => {
    if (!confirm('Delete your profile, your per-site settings and the encryption key from this device?')) return;
    await TailorVault.wipe();
    profile = { ...DEFAULT_PROFILE };
    render();
    say('Everything has been deleted. Websites are back to normal.');
  });

  // ---- Start ------------------------------------------------------------------------

  (async () => {
    const data = await TailorVault.load();
    if (data.profile) profile = data.profile;
    render();
    const fromHash = steps.findIndex((s) => `#${s.dataset.step}` === location.hash);
    showStep(fromHash >= 0 ? fromHash : 0);
  })();
})();
