// End-to-end test: loads the unpacked extension into Chromium, walks through
// onboarding, then checks the profile is encrypted at rest and applied to a
// real page. Saves screenshots to docs/screenshots.
//
//   npm install && npm test
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert/strict');

const ROOT = path.resolve(__dirname, '..');
const EXT = path.join(ROOT, 'extension');
const SHOTS = path.join(ROOT, 'docs', 'screenshots');

function serveFixtures() {
  const server = http.createServer((req, res) => {
    const file = path.join(__dirname, 'fixtures', path.basename(req.url.split('?')[0]) || 'news.html');
    fs.readFile(file, (err, body) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(body);
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const step = (name) => console.log(`\n▸ ${name}`);
const ok = (msg) => console.log(`  ✓ ${msg}`);

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const server = await serveFixtures();
  const base = `http://127.0.0.1:${server.address().port}`;
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tailor-'));

  const launchOpts = {
    channel: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 860 },
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
  };
  if (fs.existsSync('/opt/pw-browsers/chromium')) launchOpts.executablePath = '/opt/pw-browsers/chromium';
  const ctx = await chromium.launchPersistentContext(userDir, launchOpts);

  let failed = false;
  try {
    step('Extension installs and opens onboarding');
    const worker = ctx.serviceWorkers()[0] || (await ctx.waitForEvent('serviceworker'));
    const extId = new URL(worker.url()).host;
    ok(`service worker running (${extId})`);

    let onboarding;
    for (let i = 0; i < 50 && !onboarding; i++) {
      onboarding = ctx.pages().find((p) => p.url().includes('onboarding.html'));
      if (!onboarding) await new Promise((r) => setTimeout(r, 200));
    }
    assert.ok(onboarding, 'onboarding page opened on install');
    await onboarding.waitForLoadState();
    await onboarding.bringToFront();
    await onboarding.waitForSelector('#presets label');
    ok('onboarding opened on install');
    await onboarding.screenshot({ path: path.join(SHOTS, '1-welcome.png'), fullPage: true });

    step('Walk through onboarding');
    await onboarding.getByLabel('Low vision').check();
    await onboarding.click('#next');
    await onboarding.waitForSelector('[data-step="reading"]:not([hidden])');
    // Tweak a couple of choices to prove individual edits work after a preset.
    await onboarding.getByLabel('Bigger', { exact: true }).check();
    await onboarding.getByLabel('Extra roomy').check();
    await onboarding.screenshot({ path: path.join(SHOTS, '2-reading.png'), fullPage: true });
    await onboarding.click('#next');
    await onboarding.waitForSelector('[data-step="colour"]:not([hidden])');
    await onboarding.screenshot({ path: path.join(SHOTS, '3-colour.png'), fullPage: true });
    await onboarding.click('#next');
    await onboarding.waitForSelector('[data-step="calm"]:not([hidden])');
    for (const name of ['reduceMotion', 'stopAutoplay', 'hidePopups']) await onboarding.check(`[name="${name}"]`);
    await onboarding.screenshot({ path: path.join(SHOTS, '4-calm.png'), fullPage: true });
    await onboarding.click('#next');
    await onboarding.click('#next');
    await onboarding.waitForSelector('[data-step="done"]:not([hidden])');
    await onboarding.click('#next');
    await onboarding.waitForFunction(() => document.querySelector('.status').textContent.includes('Saved'));
    ok('finished all steps');

    const previewCss = await onboarding.evaluate(() => [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n'));
    assert.match(previewCss, /\.tailor-preview \{ zoom: 1\.3/);
    ok('live preview is styled from the profile');

    step('Profile is encrypted at rest');
    const stored = await worker.evaluate(() => chrome.storage.local.get(null));
    const raw = JSON.stringify(stored);
    assert.ok(stored.vault && stored.vault.ct && stored.vault.iv, 'vault written');
    for (const word of ['dark-contrast', 'readable', 'hidePopups', 'size']) {
      assert.ok(!raw.includes(word), `plaintext "${word}" leaked into storage`);
    }
    ok('chrome.storage.local holds only ciphertext');
    const keyInfo = await worker.evaluate(async () => {
      const db = await new Promise((r) => { const q = indexedDB.open('tailor-keys'); q.onsuccess = () => r(q.result); });
      const key = await new Promise((r) => { const q = db.transaction('keys').objectStore('keys').get('vault-key'); q.onsuccess = () => r(q.result); });
      let exported = true;
      try { await crypto.subtle.exportKey('raw', key); } catch { exported = false; }
      return { extractable: key.extractable, algorithm: key.algorithm.name, exported };
    });
    assert.deepEqual(keyInfo, { extractable: false, algorithm: 'AES-GCM', exported: false });
    ok('key is AES-GCM and cannot be exported');
    const decrypted = await worker.evaluate(() => TailorVault.load());
    assert.equal(decrypted.profile.theme, 'dark-contrast');
    assert.equal(decrypted.profile.size, 130);
    assert.equal(decrypted.profile.spacing, 'extra');
    assert.equal(decrypted.profile.hidePopups, true);
    ok('decrypts back to the chosen profile');

    step('Profile is applied to a website');
    const page = await ctx.newPage();
    await page.goto(`${base}/news.html`);
    await page.waitForSelector('#tailor-style', { state: 'attached' });
    await page.waitForFunction(() => document.querySelector('.consent').hasAttribute('data-tailor-hidden'));
    const applied = await page.evaluate(() => {
      const cs = (sel) => getComputedStyle(document.querySelector(sel));
      return {
        zoom: cs('html').zoom,
        bg: cs('body').backgroundColor,
        color: cs('article p').color,
        font: cs('article p').fontFamily,
        lineHeight: parseFloat(cs('article p').lineHeight) / parseFloat(cs('article p').fontSize),
        linkUnderline: cs('article a').textDecorationLine,
        consentHidden: cs('.consent').display === 'none',
        modalHidden: cs('.modal-bg').display === 'none',
        scrollUnlocked: cs('body').overflowY !== 'hidden',
        headerVisible: cs('header').display !== 'none',
        autoplay: document.getElementById('promo').autoplay,
        tickerAnim: parseFloat(cs('.ticker span').animationDuration),
      };
    });
    assert.equal(applied.zoom, '1.3');
    assert.equal(applied.bg, 'rgb(0, 0, 0)');
    assert.equal(applied.color, 'rgb(255, 255, 255)');
    assert.match(applied.font, /Atkinson|Verdana/);
    assert.ok(applied.lineHeight >= 1.75, `line-height ${applied.lineHeight}`);
    assert.equal(applied.linkUnderline, 'underline');
    assert.ok(applied.consentHidden, 'cookie banner hidden');
    assert.ok(applied.modalHidden, 'newsletter modal hidden');
    assert.ok(applied.scrollUnlocked, 'scroll unlocked');
    assert.ok(applied.headerVisible, 'site header left alone');
    assert.equal(applied.autoplay, false);
    assert.ok(applied.tickerAnim < 0.01, 'animation stopped');
    ok('size, font, spacing, contrast, links, pop-ups, motion and autoplay all applied');
    await page.screenshot({ path: path.join(SHOTS, '6-site-tailored.png') });

    step('Per-site switch from the popup');
    // The extension has no "tabs" permission, so find the tab by asking each
    // content script which host it's on.
    const tabId = await worker.evaluate(async () => {
      for (const tab of await chrome.tabs.query({})) {
        const res = await chrome.tabs.sendMessage(tab.id, { type: 'tailor:status' }).catch(() => null);
        if (res && res.host === '127.0.0.1') return tab.id;
      }
      return null;
    });
    assert.ok(tabId, 'found the test tab');
    const popup = await ctx.newPage();
    await popup.setViewportSize({ width: 300, height: 260 });
    await popup.goto(`chrome-extension://${extId}/popup/popup.html?tabId=${tabId}`);
    await popup.waitForSelector('#ready:not([hidden])');
    assert.equal(await popup.textContent('#host'), '127.0.0.1');
    assert.equal(await popup.isChecked('#siteToggle'), true);
    await popup.screenshot({ path: path.join(SHOTS, '8-popup.png') });
    await popup.uncheck('#siteToggle');
    await page.waitForSelector('#tailor-style', { state: 'detached' });
    const off = await page.evaluate(() => ({
      zoom: getComputedStyle(document.documentElement).zoom,
      consentVisible: getComputedStyle(document.querySelector('.consent')).display !== 'none',
    }));
    assert.equal(off.zoom, '1');
    assert.ok(off.consentVisible);
    ok('switching off restores the original site');
    await page.screenshot({ path: path.join(SHOTS, '5-site-original.png') });
    await page.reload();
    await page.waitForTimeout(500);
    assert.equal(await page.$('#tailor-style'), null);
    ok('choice is remembered after reload');
    await popup.reload();
    await popup.waitForSelector('#ready:not([hidden])');
    await popup.check('#siteToggle');
    await page.waitForSelector('#tailor-style', { state: 'attached' });
    ok('switching back on re-applies the profile');

    step('Simplified reader view');
    await page.reload();
    await page.waitForSelector('#tailor-style', { state: 'attached' });
    await popup.reload();
    await popup.waitForSelector('#ready:not([hidden])');
    await popup.click('#reader').catch(() => {}); // popup closes itself
    await page.waitForSelector('#tailor-reader-host', { state: 'attached' });
    const reader = await page.evaluate(() => {
      const host = document.getElementById('tailor-reader-host');
      return { shadowVisibleToPage: host.shadowRoot !== null };
    });
    assert.equal(reader.shadowVisibleToPage, false);
    ok('reader view opens in a closed shadow root the page cannot read');
    await page.screenshot({ path: path.join(SHOTS, '7-reader.png') });
    await page.keyboard.press('Escape');
    await page.waitForSelector('#tailor-reader-host', { state: 'detached' });
    ok('Escape returns to the original page');

    step('Delete everything');
    await onboarding.bringToFront();
    onboarding.once('dialog', (d) => d.accept());
    await onboarding.click('.data summary');
    await onboarding.click('#wipe');
    await onboarding.waitForFunction(() => document.querySelector('.status').textContent.includes('deleted'));
    const after = await worker.evaluate(() => chrome.storage.local.get(null));
    assert.deepEqual(after, {});
    await page.waitForSelector('#tailor-style', { state: 'detached' });
    ok('storage and key wiped; open pages return to normal');

    console.log('\nAll checks passed.');
  } catch (err) {
    failed = true;
    console.error('\n✗ FAILED:', err);
  } finally {
    await ctx.close();
    server.close();
    fs.rmSync(userDir, { recursive: true, force: true });
  }
  process.exit(failed ? 1 : 0);
})();
