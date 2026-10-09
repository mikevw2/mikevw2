import { describe, it, expect } from "vitest";
import { decodePng, encodePng, readPngSize, type RawImage } from "./png.js";
import { averageHash, downscaleGray, imageHash } from "./hash.js";
import { hammingHex } from "../guards/caps.js";
import { buildPinHtml, escapeHtml, findChromiumExecutable } from "./renderPin.js";

function solid(w: number, h: number, rgb: [number, number, number]): RawImage {
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) { data[i * 4] = rgb[0]; data[i * 4 + 1] = rgb[1]; data[i * 4 + 2] = rgb[2]; data[i * 4 + 3] = 255; }
  return { width: w, height: h, data };
}
function halfAndHalf(w: number, h: number): RawImage {
  const img = solid(w, h, [0, 0, 0]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w / 2; x++) { const i = (y * w + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; }
  return img;
}

describe("png codec", () => {
  it("round-trips an RGBA image", () => {
    const img = halfAndHalf(16, 8);
    const buf = encodePng(img);
    expect(readPngSize(buf)).toEqual({ width: 16, height: 8 });
    const back = decodePng(buf);
    expect(back.width).toBe(16);
    expect(Array.from(back.data)).toEqual(Array.from(img.data));
  });
  it("rejects non-PNG data", () => {
    expect(() => readPngSize(Buffer.from("hello"))).toThrow(/not a PNG/);
  });
});

describe("average hash", () => {
  it("is 16 hex chars", () => {
    expect(imageHash(halfAndHalf(64, 64))).toMatch(/^[0-9a-f]{16}$/);
  });
  it("left-white / right-black has a stable pattern", () => {
    // every row: 1111 0000 -> 'f0' x 8
    expect(imageHash(halfAndHalf(64, 64))).toBe("f0f0f0f0f0f0f0f0");
  });
  it("identical images hash identically, mirrored images differ", () => {
    const a = halfAndHalf(32, 32);
    const b = halfAndHalf(32, 32);
    expect(imageHash(a)).toBe(imageHash(b));
    const mirrored = solid(32, 32, [0, 0, 0]);
    for (let y = 0; y < 32; y++) for (let x = 16; x < 32; x++) { const i = (y * 32 + x) * 4; mirrored.data[i] = mirrored.data[i + 1] = mirrored.data[i + 2] = 255; }
    expect(hammingHex(imageHash(a), imageHash(mirrored))).toBe(64);
  });
  it("small noise keeps the hash within a few bits", () => {
    const a = halfAndHalf(64, 64);
    const b = halfAndHalf(64, 64);
    for (let i = 0; i < 20; i++) { const p = (i * 37) % (64 * 64); b.data[p * 4] = 128; }
    expect(hammingHex(imageHash(a), imageHash(b))).toBeLessThanOrEqual(2);
  });
  it("downscaleGray returns n*n cells", () => {
    expect(downscaleGray(solid(10, 10, [255, 255, 255]), 4)).toHaveLength(16);
    expect(averageHash(new Array(64).fill(10))).toBe("0000000000000000");
  });
});

describe("buildPinHtml", () => {
  it("escapes user text and fills the template", () => {
    const html = buildPinHtml("product-color-block", { headline: "Tidy <drawers> & more", keyword: "drawer organizer", variantIndex: 1 });
    expect(html).toContain("Tidy &lt;drawers&gt; &amp; more");
    expect(html).toContain("drawer organizer");
    expect(html).not.toContain("{{");
    expect(html).toContain('class="placeholder"'); // no photo given
    expect(html).toContain("#d8e2dc"); // palette 1
  });
  it("before/after template has both halves", () => {
    const html = buildPinHtml("before-after-split", { headline: "One weekend", keyword: "pantry" });
    expect(html).toContain("Before");
    expect(html).toContain("After");
    expect(html).toContain("One weekend");
  });
  it("escapeHtml covers quotes", () => {
    expect(escapeHtml(`a"b'c`)).toBe("a&quot;b&#39;c");
  });
});

describe("findChromiumExecutable", () => {
  it("returns a path or undefined without throwing", () => {
    const p = findChromiumExecutable();
    expect(p === undefined || typeof p === "string").toBe(true);
  });
});
