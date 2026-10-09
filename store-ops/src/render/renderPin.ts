/**
 * Render an HTML template to a 1000x1500 PNG with Playwright chromium, then hash it.
 * Chromium lives at $PLAYWRIGHT_BROWSERS_PATH (/opt/pw-browsers in the dev container); if the
 * default launch cannot find it we fall back to an explicit executablePath there.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser } from "playwright";
import { imageHash } from "./hash.js";
import { decodePng, readPngSize } from "./png.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const PIN_WIDTH = 1000;
export const PIN_HEIGHT = 1500;

export type TemplateName = "product-color-block" | "before-after-split";
export const TEMPLATES: TemplateName[] = ["product-color-block", "before-after-split"];

export interface PinRenderData {
  headline: string;
  subline?: string;
  keyword: string;
  photoPath?: string;
  /** Second photo for the before/after template; falls back to photoPath, then a gradient. */
  photoPathAfter?: string;
  /** Picks the colour pair; defaults to a rotation by index. */
  variantIndex?: number;
  bgColor?: string;
  accentColor?: string;
}

export interface RenderResult { path: string; hash: string; width: number; height: number; bytes: number; template: TemplateName }

/** Warm, brand-neutral pairs so three pins for one page never share a background. */
export const PALETTES: Array<{ bg: string; accent: string }> = [
  { bg: "#e9d9c6", accent: "#c98f5a" },
  { bg: "#d8e2dc", accent: "#7fa39a" },
  { bg: "#f1e3e3", accent: "#c87f86" },
  { bg: "#e4e6ef", accent: "#7c84b8" },
];

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Build the final HTML for a template; pure apart from reading the template and photo files. */
export function buildPinHtml(template: TemplateName, data: PinRenderData): string {
  const file = path.join(here, "templates", `${template}.html`);
  const palette = PALETTES[(data.variantIndex ?? 0) % PALETTES.length]!;
  const photoBlock = photoTag(data.photoPath, `Photo: ${data.headline}`);
  const photoBlockAfter = photoTag(data.photoPathAfter ?? data.photoPath, `Photo after: ${data.headline}`);
  const vars: Record<string, string> = {
    headline: escapeHtml(data.headline),
    subline: escapeHtml(data.subline ?? ""),
    keyword: escapeHtml(data.keyword),
    bgColor: data.bgColor ?? palette.bg,
    accentColor: data.accentColor ?? palette.accent,
    photoBlock,
    photoBlockAfter,
  };
  return readFileSync(file, "utf8").replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? "");
}

function photoTag(photoPath: string | undefined, alt: string): string {
  if (photoPath && existsSync(photoPath)) {
    const ext = path.extname(photoPath).toLowerCase();
    const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : ext === ".webp" ? "image/webp" : "image/png";
    const b64 = readFileSync(photoPath).toString("base64");
    return `<img class="photo" alt="${escapeHtml(alt)}" src="data:${mime};base64,${b64}" />`;
  }
  return `<div class="placeholder"><span>${escapeHtml(alt)}</span></div>`;
}

let browserPromise: Promise<Browser> | undefined;

/** Find a chromium binary under PLAYWRIGHT_BROWSERS_PATH (or /opt/pw-browsers). */
export function findChromiumExecutable(): string | undefined {
  const roots = [process.env["PLAYWRIGHT_BROWSERS_PATH"], "/opt/pw-browsers"].filter((r): r is string => !!r && existsSync(r));
  for (const root of roots) {
    const dirs = readdirSync(root).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse();
    for (const d of dirs) {
      for (const rel of ["chrome-linux/chrome", "chrome-mac/Chromium.app/Contents/MacOS/Chromium", "chrome-win/chrome.exe"]) {
        const p = path.join(root, d, rel);
        if (existsSync(p)) return p;
      }
    }
  }
  return undefined;
}

export async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = (async () => {
      try {
        return await chromium.launch({ headless: true });
      } catch (e) {
        const exe = findChromiumExecutable();
        if (!exe) throw e;
        return chromium.launch({ headless: true, executablePath: exe });
      }
    })();
  }
  return browserPromise;
}

export async function closeBrowser(): Promise<void> {
  if (browserPromise) {
    const b = await browserPromise;
    browserPromise = undefined;
    await b.close();
  }
}

export async function renderPin(args: { template: TemplateName; data: PinRenderData; outPath: string }): Promise<RenderResult> {
  const html = buildPinHtml(args.template, args.data);
  const browser = await getBrowser();
  const page = await browser.newPage({ viewport: { width: PIN_WIDTH, height: PIN_HEIGHT }, deviceScaleFactor: 1 });
  try {
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => (document as unknown as { fonts: { ready: Promise<unknown> } }).fonts.ready);
    const png = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: PIN_WIDTH, height: PIN_HEIGHT }, fullPage: false });
    mkdirSync(path.dirname(args.outPath), { recursive: true });
    writeFileSync(args.outPath, png);
    const size = readPngSize(png);
    if (size.width !== PIN_WIDTH || size.height !== PIN_HEIGHT) throw new Error(`rendered ${size.width}x${size.height}, expected ${PIN_WIDTH}x${PIN_HEIGHT}`);
    const hash = imageHash(decodePng(png));
    return { path: args.outPath, hash, width: size.width, height: size.height, bytes: png.length, template: args.template };
  } finally {
    await page.close();
  }
}
