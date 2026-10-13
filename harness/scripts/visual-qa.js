#!/usr/bin/env node
// Visual + structural QA for web pages using Playwright.
//   node scripts/visual-qa.js https://example.com [more urls or local .html paths] [--out qa]
// Produces screenshots at three viewports and a JSON report. Exit 1 on any failed check.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

import { existsSync, readdirSync } from 'node:fs';

async function loadPlaywright() {
  try { return await import('playwright'); }
  catch { return await import('/opt/node-tools/node_modules/playwright/index.js'); } // cloud container fallback
}

/** Launch Chromium; if this Playwright's bundled build is absent, fall back to a preinstalled one. */
async function launchChromium(chromium) {
  try { return await chromium.launch(); }
  catch (e) {
    if (!/Executable doesn't exist/.test(e.message)) throw e;
    const candidates = [process.env.CHROMIUM_PATH, process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH].filter(Boolean);
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
    if (existsSync(base)) for (const d of readdirSync(base)) if (/^chromium-\d+$/.test(d)) candidates.push(`${base}/${d}/chrome-linux/chrome`);
    const exe = candidates.find(existsSync);
    if (!exe) throw new Error(`${e.message}\nNo preinstalled Chromium found either. Set CHROMIUM_PATH or run: npx playwright install chromium`);
    return chromium.launch({ executablePath: exe });
  }
}

const VIEWPORTS = { mobile: { width: 390, height: 844 }, tablet: { width: 820, height: 1180 }, desktop: { width: 1440, height: 900 } };
const argv = process.argv.slice(2);
const outIdx = argv.indexOf('--out');
const outDir = resolve(outIdx >= 0 ? argv[outIdx + 1] : 'qa');
const targets = argv.filter((a, i) => !a.startsWith('--') && !(outIdx >= 0 && i === outIdx + 1));
if (!targets.length) { console.error('usage: visual-qa.js <url|file.html>... [--out dir]'); process.exit(2); }
mkdirSync(`${outDir}/screenshots`, { recursive: true });

const toUrl = (t) => /^https?:\/\//.test(t) ? t : pathToFileURL(resolve(t)).href;
const slug = (t) => {
  const label = /^https?:\/\//.test(t) ? t.replace(/^https?:\/\//, '') : basename(t).replace(/\.html?$/i, '');
  const hash = createHash('sha1').update(t).digest('hex').slice(0, 6);
  return label.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 50) + '-' + hash;
};

const { chromium } = await loadPlaywright();
const browser = await launchChromium(chromium);
const report = [];
let failures = 0;

for (const t of targets) {
  const url = toUrl(t);
  const entry = { target: t, viewports: {}, checks: [] };
  const fail = (name, detail) => { entry.checks.push({ name, ok: false, detail }); failures++; };
  const pass = (name) => entry.checks.push({ name, ok: true });

  for (const [name, vp] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const consoleErrors = [], failedRequests = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('requestfailed', r => failedRequests.push(r.url()));
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (e) { fail(`${name}: load`, e.message); await ctx.close(); continue; }
    const file = `${outDir}/screenshots/${slug(t)}-${name}.png`;
    await page.screenshot({ path: file, fullPage: true });
    entry.viewports[name] = file;

    if (name === 'desktop') {
      const info = await page.evaluate(() => ({
        title: document.title,
        metaDesc: document.querySelector('meta[name="description"]')?.content ?? '',
        h1s: document.querySelectorAll('h1').length,
        imgsNoAlt: [...document.images].filter(i => !i.hasAttribute('alt')).length,
        viewportMeta: !!document.querySelector('meta[name="viewport"]'),
        lang: document.documentElement.lang,
      }));
      info.title ? pass('title') : fail('title', 'missing <title>');
      info.metaDesc.length >= 50 ? pass('meta description') : fail('meta description', `length ${info.metaDesc.length} (<50)`);
      info.h1s === 1 ? pass('single h1') : fail('single h1', `found ${info.h1s}`);
      info.imgsNoAlt === 0 ? pass('img alt') : fail('img alt', `${info.imgsNoAlt} images without alt`);
      info.viewportMeta ? pass('viewport meta') : fail('viewport meta', 'missing');
      info.lang ? pass('html lang') : fail('html lang', 'missing');
    }
    if (name === 'mobile') {
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      overflow ? fail('mobile: no horizontal overflow', 'page scrolls horizontally at 390px') : pass('mobile: no horizontal overflow');
    }
    consoleErrors.length ? fail(`${name}: console errors`, consoleErrors.slice(0, 5).join(' | ')) : pass(`${name}: console clean`);
    failedRequests.length ? fail(`${name}: failed requests`, failedRequests.slice(0, 5).join(' | ')) : pass(`${name}: requests ok`);
    await ctx.close();
  }
  report.push(entry);
}
await browser.close();
writeFileSync(`${outDir}/report.json`, JSON.stringify(report, null, 2));

for (const e of report) {
  console.log(`\n${e.target}`);
  for (const c of e.checks) console.log(`  ${c.ok ? 'ok  ' : 'FAIL'} ${c.name}${c.detail ? ' — ' + c.detail : ''}`);
  for (const [v, f] of Object.entries(e.viewports)) console.log(`  shot ${v}: ${f}`);
}
console.log(`\n${failures} failed check(s). Report: ${outDir}/report.json`);
process.exit(failures ? 1 : 0);
