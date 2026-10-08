// End-to-end smoke test: loads the unpacked extension into Chromium and serves
// mock YouTube / TikTok pages on the real domains so the content scripts run.
// Run with: node tests/e2e.mjs   (requires Playwright + Chromium)
import { chromium } from 'playwright';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const here = path.dirname(fileURLToPath(import.meta.url));
const ext = path.resolve(here, '..');
const fixture = (name) => readFileSync(path.join(here, 'fixtures', name), 'utf8');

const ctx = await chromium.launchPersistentContext(mkdtempSync(path.join(tmpdir(), 'aiff-')), {
  headless: true,
  channel: 'chromium',
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
});
await ctx.route('https://www.youtube.com/**', (r) => r.fulfill({ contentType: 'text/html', body: fixture('youtube.html') }));
await ctx.route('https://www.tiktok.com/**', (r) => r.fulfill({ contentType: 'text/html', body: fixture('tiktok.html') }));

const visible = (page, sel) => page.locator(sel).isVisible();
let failures = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log('ok   ', name);
  } catch (e) {
    failures++;
    console.log('FAIL ', name, '\n     ', e.message.split('\n')[0]);
  }
}

// ---- YouTube grid -------------------------------------------------------
const yt = await ctx.newPage();
await yt.goto('https://www.youtube.com/');
await yt.waitForTimeout(1500);

await check('YouTube: platform-labeled video hidden', async () => assert.equal(await visible(yt, '#labeled'), false));
await check('YouTube: #sora/#aivideo video hidden', async () => assert.equal(await visible(yt, '#hashtag'), false));
await check('YouTube: normal video kept', async () => assert.equal(await visible(yt, '#normal'), true));
await check('YouTube: video *about* AI kept', async () => assert.equal(await visible(yt, '#about'), true));
await check('YouTube: lazily loaded AI video hidden', async () => assert.equal(await visible(yt, '#late'), false));

await check('YouTube: "Mark AI" blocks the whole channel', async () => {
  assert.equal(await visible(yt, '#sameChannel'), true);
  await yt.hover('#sameChannel');
  await yt.click('#sameChannel .aiff-mark');
  await yt.waitForTimeout(800);
  assert.equal(await visible(yt, '#sameChannel'), false);
  assert.equal(yt.url(), 'https://www.youtube.com/', 'click must not navigate');
});

// ---- Popup: switch to blur mode ------------------------------------------
const mgr = await ctx.newPage();
await mgr.goto('chrome://extensions');
const extId = await mgr.evaluate(
  () => document.querySelector('extensions-manager').shadowRoot.querySelector('extensions-item-list').shadowRoot.querySelector('extensions-item').id
);
const popup = await ctx.newPage();
await popup.goto(`chrome-extension://${extId}/popup/popup.html`);
await check('Popup: shows blocked channel and stats', async () => {
  assert.match(await popup.inputValue('#blockedChannels'), /@viralnow/);
  await popup.waitForTimeout(1200);
  assert.ok(Number(await popup.textContent('#stat-total')) >= 3);
});
await popup.click('label:has(input[value=blur])');
await yt.waitForSelector('#late .aiff-overlay', { timeout: 3000 }).catch(() => {});
await check('Blur mode: AI video shown blurred with overlay', async () => {
  assert.equal(await visible(yt, '#late'), true);
  assert.equal(await visible(yt, '#late .aiff-overlay'), true);
  assert.match(await yt.locator('#late .aiff-panel-reasons').textContent(), /Described as AI-made/);
  assert.match(await yt.locator('#hashtag .aiff-panel-reasons').textContent(), /blocklist/);
});
await check('Blur mode: "Show anyway" reveals it', async () => {
  await yt.locator('#late .aiff-btn', { hasText: 'Show anyway' }).click();
  await yt.waitForTimeout(400);
  assert.equal(await yt.locator('#late .aiff-overlay').count(), 0);
  assert.equal(await visible(yt, '#late .aiff-badge'), true);
});
await check('Trust: "Not AI" un-blocks the channel', async () => {
  await yt.locator('#labeled .aiff-btn', { hasText: 'Not AI' }).click();
  await yt.waitForTimeout(800);
  assert.equal(await yt.locator('#labeled .aiff-overlay').count(), 0);
  assert.match(await popup.inputValue('#allowedChannels'), /@wildclips/);
});
await popup.click('label:has(input[value=hide])');

// ---- TikTok For You feed -------------------------------------------------
const tt = await ctx.newPage();
await tt.goto('https://www.tiktok.com/foryou');
await tt.waitForTimeout(1200);
await check('TikTok: labeled video covered, others untouched', async () => {
  assert.equal(await tt.getAttribute('#tt2', 'data-aiff-state'), 'covered');
  assert.equal(await tt.getAttribute('#tt1', 'data-aiff-state'), null);
  assert.equal(await tt.getAttribute('#tt3', 'data-aiff-state'), null);
});
await check('TikTok: auto-skips past the AI video', async () => {
  await tt.evaluate(() => document.getElementById('tt2').scrollIntoView());
  await tt.waitForTimeout(1500);
  const top = await tt.evaluate(() => document.getElementById('tt3').getBoundingClientRect().top);
  assert.ok(Math.abs(top) < 50, `expected next video in view, tt3 top=${top}`);
});

await yt.screenshot({ path: path.join(tmpdir(), 'aiff-youtube.png') });
await ctx.close();
console.log(failures ? `\n${failures} failed` : '\nall passed');
process.exit(failures ? 1 : 0);
