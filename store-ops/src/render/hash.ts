/**
 * Average hash (aHash): downscale to 8x8 grayscale by box averaging, threshold at the mean,
 * pack 64 bits as 16 hex chars. Near-duplicate images land within a few bits of each other.
 */
import type { RawImage } from "./png.js";

export const HASH_SIZE = 8;

/** Box-average the RGBA image to an N x N grayscale grid (0-255 floats). */
export function downscaleGray(img: RawImage, n = HASH_SIZE): number[] {
  const out = new Array<number>(n * n).fill(0);
  const cellW = img.width / n;
  const cellH = img.height / n;
  for (let gy = 0; gy < n; gy++) {
    for (let gx = 0; gx < n; gx++) {
      const x0 = Math.floor(gx * cellW), x1 = Math.max(x0 + 1, Math.floor((gx + 1) * cellW));
      const y0 = Math.floor(gy * cellH), y1 = Math.max(y0 + 1, Math.floor((gy + 1) * cellH));
      let sum = 0, count = 0;
      for (let y = y0; y < y1 && y < img.height; y++) {
        for (let x = x0; x < x1 && x < img.width; x++) {
          const i = (y * img.width + x) * 4;
          // Rec. 601 luma, alpha ignored (pins are opaque)
          sum += 0.299 * img.data[i]! + 0.587 * img.data[i + 1]! + 0.114 * img.data[i + 2]!;
          count++;
        }
      }
      out[gy * n + gx] = count ? sum / count : 0;
    }
  }
  return out;
}

/** 64-bit average hash as 16 hex characters. */
export function averageHash(gray: number[]): string {
  const mean = gray.reduce((a, b) => a + b, 0) / gray.length;
  let hex = "";
  for (let i = 0; i < gray.length; i += 4) {
    let nibble = 0;
    for (let b = 0; b < 4; b++) nibble = (nibble << 1) | (gray[i + b]! > mean ? 1 : 0);
    hex += nibble.toString(16);
  }
  return hex;
}

export function imageHash(img: RawImage): string {
  return averageHash(downscaleGray(img));
}
