/** Render one sample pin per template with placeholder data into samples/. */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { closeBrowser, renderPin, TEMPLATES } from "../src/render/renderPin.js";
import { readPngSize } from "../src/render/png.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "..", "samples");

try {
  const main = await renderPin({
    template: "product-color-block",
    outPath: path.join(outDir, "sample-pin.png"),
    data: { headline: "Makeup drawer, sorted in one evening", subline: "Drawer organizer for makeup: the simple layout that keeps brushes upright", keyword: "drawer organizer", variantIndex: 0 },
  });
  console.log(`rendered ${main.path} ${main.width}x${main.height} ${main.bytes} bytes hash=${main.hash}`);
  for (const t of TEMPLATES) {
    const r = await renderPin({
      template: t,
      outPath: path.join(outDir, `sample-${t}.png`),
      data: { headline: t === "before-after-split" ? "One pantry, one weekend" : "Small desk, zero clutter", subline: "Desk organizer for small desks", keyword: t === "before-after-split" ? "pantry organization" : "desk organizer", variantIndex: 1 },
    });
    console.log(`rendered ${r.path} ${r.width}x${r.height} hash=${r.hash}`);
  }
  const check = readPngSize(readFileSync(path.join(outDir, "sample-pin.png")));
  if (check.width !== 1000 || check.height !== 1500) throw new Error(`unexpected size ${check.width}x${check.height}`);
  console.log("OK: samples/sample-pin.png is 1000x1500");
} finally {
  await closeBrowser();
}
