import { describe, it, expect } from "vitest";
import { canPostPin, nextPinSlots, shouldAutoPause, dailyCapReached, remainingToday, canSpendTasks, hammingHex } from "./caps.js";
import { CAPS } from "../config.js";

const now = new Date(2026, 10, 15, 12, 0, 0); // Nov 15 2026 noon local
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

describe("canPostPin", () => {
  it("allows a fresh pin under all caps", () => {
    expect(canPostPin({ postedToday: 0, lastPostForUrl: null, usedImageHashes: new Set(), imageHash: "ab", now })).toEqual({ ok: true });
  });
  it("blocks at the daily cap", () => {
    const v = canPostPin({ postedToday: CAPS.MAX_PINS_PER_DAY, lastPostForUrl: null, usedImageHashes: new Set(), imageHash: "ab", now });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toMatch(/daily cap/);
  });
  it("allows the pin just under the daily cap", () => {
    expect(canPostPin({ postedToday: CAPS.MAX_PINS_PER_DAY - 1, lastPostForUrl: null, usedImageHashes: new Set(), imageHash: "ab", now }).ok).toBe(true);
  });
  it("blocks a URL pinned less than 7 days ago", () => {
    const v = canPostPin({ postedToday: 0, lastPostForUrl: daysAgo(6.9), usedImageHashes: new Set(), imageHash: "ab", now });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toMatch(/url pinned/);
  });
  it("allows a URL pinned exactly 7 days ago", () => {
    expect(canPostPin({ postedToday: 0, lastPostForUrl: daysAgo(7), usedImageHashes: new Set(), imageHash: "ab", now }).ok).toBe(true);
  });
  it("blocks an exact duplicate image hash", () => {
    const v = canPostPin({ postedToday: 0, lastPostForUrl: null, usedImageHashes: new Set(["ffff"]), imageHash: "ffff", now });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toMatch(/duplicate image/);
  });
  it("blocks a near-duplicate when a distance is given", () => {
    const v = canPostPin({ postedToday: 0, lastPostForUrl: null, usedImageHashes: new Set(["ffff"]), imageHash: "fffe", now, nearDuplicateDistance: 2 });
    expect(v.ok).toBe(false);
  });
  it("allows a near-duplicate when distance is 0 (exact only)", () => {
    expect(canPostPin({ postedToday: 0, lastPostForUrl: null, usedImageHashes: new Set(["ffff"]), imageHash: "fffe", now }).ok).toBe(true);
  });
  it("reports the daily cap before the url spacing", () => {
    const v = canPostPin({ postedToday: 99, lastPostForUrl: daysAgo(1), usedImageHashes: new Set(), imageHash: "ab", now });
    if (!v.ok) expect(v.reason).toMatch(/daily cap/);
  });
});

describe("hammingHex", () => {
  it("counts differing bits", () => {
    expect(hammingHex("0", "f")).toBe(4);
    expect(hammingHex("00", "01")).toBe(1);
    expect(hammingHex("abcd", "abcd")).toBe(0);
  });
  it("treats different lengths as infinitely far", () => {
    expect(hammingHex("0", "00")).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("nextPinSlots", () => {
  const day = new Date(2026, 10, 15);
  it("returns no slots for n<=0", () => {
    expect(nextPinSlots(day, 0)).toEqual([]);
    expect(nextPinSlots(day, -3)).toEqual([]);
  });
  it("places a single pin mid-window", () => {
    const [s] = nextPinSlots(day, 1);
    expect(s!.getHours()).toBe(14);
    expect(s!.getMinutes()).toBe(30);
  });
  it("spreads n pins from 08:00 to 21:00 inclusive", () => {
    const slots = nextPinSlots(day, 5);
    expect(slots).toHaveLength(5);
    expect(slots[0]!.getHours()).toBe(8);
    expect(slots[0]!.getMinutes()).toBe(0);
    expect(slots[4]!.getHours()).toBe(21);
    expect(slots[4]!.getMinutes()).toBe(0);
    for (let i = 1; i < slots.length; i++) expect(slots[i]!.getTime()).toBeGreaterThan(slots[i - 1]!.getTime());
  });
  it("keeps every slot on the requested day and inside the window", () => {
    for (const s of nextPinSlots(day, 10)) {
      expect(s.getDate()).toBe(15);
      expect(s.getHours()).toBeGreaterThanOrEqual(8);
      expect(s.getHours() * 60 + s.getMinutes()).toBeLessThanOrEqual(21 * 60);
    }
  });
  it("clamps n to the daily cap", () => {
    expect(nextPinSlots(day, 50)).toHaveLength(CAPS.MAX_PINS_PER_DAY);
  });
  it("applies bounded deterministic jitter", () => {
    const slots = nextPinSlots(day, 3, { jitter: () => 1, jitterMinutes: 20 });
    // first slot pushed +20 min, last slot clamped to window end
    expect(slots[0]!.getMinutes()).toBe(20);
    expect(slots[2]!.getHours()).toBe(21);
    expect(slots[2]!.getMinutes()).toBe(0);
  });
  it("honours a custom window", () => {
    const slots = nextPinSlots(day, 2, { startHour: 10, endHour: 12 });
    expect(slots[0]!.getHours()).toBe(10);
    expect(slots[1]!.getHours()).toBe(12);
  });
});

describe("shouldAutoPause", () => {
  it("pauses on a >50% drop", () => {
    expect(shouldAutoPause(400, 1000)).toBe(true);
  });
  it("does not pause at exactly 50%", () => {
    expect(shouldAutoPause(500, 1000)).toBe(false);
  });
  it("does not pause on growth", () => {
    expect(shouldAutoPause(1500, 1000)).toBe(false);
  });
  it("does not pause without a baseline", () => {
    expect(shouldAutoPause(0, 0)).toBe(false);
    expect(shouldAutoPause(10, 0)).toBe(false);
  });
  it("pauses when impressions go to zero from a baseline", () => {
    expect(shouldAutoPause(0, 10)).toBe(true);
  });
  it("respects a custom threshold", () => {
    expect(shouldAutoPause(800, 1000, 0.1)).toBe(true);
    expect(shouldAutoPause(950, 1000, 0.1)).toBe(false);
  });
});

describe("dailyCapReached / remainingToday", () => {
  it("guide cap is 1", () => {
    expect(dailyCapReached("guide", 0)).toBe(false);
    expect(dailyCapReached("guide", 1)).toBe(true);
    expect(remainingToday("guide", 0)).toBe(1);
  });
  it("page rewrite cap is 10", () => {
    expect(dailyCapReached("page_rewrite", 9)).toBe(false);
    expect(dailyCapReached("page_rewrite", 10)).toBe(true);
    expect(remainingToday("page_rewrite", 4)).toBe(6);
  });
  it("link edit cap is 20, outreach 5, pin 10", () => {
    expect(dailyCapReached("link_edit", 20)).toBe(true);
    expect(dailyCapReached("outreach", 5)).toBe(true);
    expect(dailyCapReached("pin", 10)).toBe(true);
    expect(dailyCapReached("link_edit", 19)).toBe(false);
  });
  it("remainingToday never goes negative", () => {
    expect(remainingToday("outreach", 50)).toBe(0);
  });
});

describe("canSpendTasks", () => {
  it("allows under the monthly cap", () => {
    expect(canSpendTasks(0, 1).ok).toBe(true);
    expect(canSpendTasks(399, 1).ok).toBe(true);
  });
  it("blocks over the monthly cap", () => {
    expect(canSpendTasks(400, 1).ok).toBe(false);
    expect(canSpendTasks(395, 10).ok).toBe(false);
  });
  it("zero tasks is always fine", () => {
    expect(canSpendTasks(400, 0).ok).toBe(true);
  });
});
