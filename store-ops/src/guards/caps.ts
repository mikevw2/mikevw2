/**
 * Pure guard functions. No IO, no Date.now() unless injected. Every cap in the
 * operating model is enforced here and nowhere else; jobs call these and obey.
 */
import { CAPS, DAILY_CAPS, type CapKind } from "../config.js";

export type GuardVerdict = { ok: true } | { ok: false; reason: string };

export interface CanPostPinInput {
  /** Pins already posted today (local calendar day). */
  postedToday: number;
  /** When this page URL was last pinned, or null if never. */
  lastPostForUrl: Date | null;
  /** Image hashes already used (posted or queued). */
  usedImageHashes: ReadonlySet<string>;
  /** The candidate pin's image hash. */
  imageHash: string;
  /** "Now" for the spacing check. Injected for tests. */
  now: Date;
  /** Max hamming distance at which two hashes count as the same image (0 = exact only). */
  nearDuplicateDistance?: number;
}

const MS_PER_DAY = 86_400_000;

/** Daily cap, URL spacing, and duplicate-image check for one candidate pin. */
export function canPostPin(input: CanPostPinInput): GuardVerdict {
  if (input.postedToday >= CAPS.MAX_PINS_PER_DAY) {
    return { ok: false, reason: `daily cap reached (${input.postedToday}/${CAPS.MAX_PINS_PER_DAY})` };
  }
  if (input.lastPostForUrl) {
    const days = (input.now.getTime() - input.lastPostForUrl.getTime()) / MS_PER_DAY;
    if (days < CAPS.MIN_DAYS_BETWEEN_PINS_SAME_URL) {
      return { ok: false, reason: `url pinned ${days.toFixed(1)} days ago; minimum is ${CAPS.MIN_DAYS_BETWEEN_PINS_SAME_URL}` };
    }
  }
  const dist = input.nearDuplicateDistance ?? 0;
  for (const h of input.usedImageHashes) {
    if (h === input.imageHash || (dist > 0 && hammingHex(h, input.imageHash) <= dist)) {
      return { ok: false, reason: `duplicate image hash ${input.imageHash}` };
    }
  }
  return { ok: true };
}

/** Hamming distance between two equal-length hex strings (as bit strings). */
export function hammingHex(a: string, b: string): number {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    const x = parseInt(a[i]!, 16) ^ parseInt(b[i]!, 16);
    d += (x & 1) + ((x >> 1) & 1) + ((x >> 2) & 1) + ((x >> 3) & 1);
  }
  return d;
}

export interface PinSlotOptions {
  startHour?: number;
  endHour?: number;
  /** Deterministic jitter in [0,1) per slot; default none. */
  jitter?: (i: number) => number;
  /** Max jitter in minutes either side; default 0. */
  jitterMinutes?: number;
}

/**
 * Spread n pins evenly across the posting window on the given local day.
 * Returns Date objects built from the components of `day` in the *process* timezone,
 * so run jobs with TZ=America/Boise (see scripts/cron.example). n is clamped to the daily cap.
 */
export function nextPinSlots(day: Date, n: number, opts: PinSlotOptions = {}): Date[] {
  const start = opts.startHour ?? CAPS.PIN_WINDOW_START_HOUR;
  const end = opts.endHour ?? CAPS.PIN_WINDOW_END_HOUR;
  const count = Math.max(0, Math.min(n, CAPS.MAX_PINS_PER_DAY));
  if (count === 0) return [];
  const windowMin = (end - start) * 60;
  const base = new Date(day.getFullYear(), day.getMonth(), day.getDate(), start, 0, 0, 0);
  const slots: Date[] = [];
  if (count === 1) {
    slots.push(new Date(base.getTime() + (windowMin / 2) * 60_000));
  } else {
    const step = windowMin / (count - 1);
    for (let i = 0; i < count; i++) {
      let minutes = i * step;
      if (opts.jitter && opts.jitterMinutes) {
        minutes += (opts.jitter(i) * 2 - 1) * opts.jitterMinutes;
        minutes = Math.max(0, Math.min(windowMin, minutes));
      }
      slots.push(new Date(base.getTime() + Math.round(minutes) * 60_000));
    }
  }
  return slots;
}

/** True when impressions fell more than the auto-pause threshold week over week. */
export function shouldAutoPause(impressionsThisWeek: number, impressionsLastWeek: number, threshold: number = CAPS.IMPRESSION_DROP_AUTOPAUSE): boolean {
  if (impressionsLastWeek <= 0) return false; // no baseline: a new account is not a collapse
  if (impressionsThisWeek < 0) return false;
  const drop = (impressionsLastWeek - impressionsThisWeek) / impressionsLastWeek;
  return drop > threshold;
}

/** Has the per-kind daily cap already been consumed? */
export function dailyCapReached(kind: CapKind, countToday: number): boolean {
  return countToday >= DAILY_CAPS[kind];
}

/** How many more of this kind may be produced today. */
export function remainingToday(kind: CapKind, countToday: number): number {
  return Math.max(0, DAILY_CAPS[kind] - countToday);
}

/** Monthly DataForSEO budget check. */
export function canSpendTasks(usedThisMonth: number, wanted: number): GuardVerdict {
  if (wanted <= 0) return { ok: true };
  if (usedThisMonth + wanted > CAPS.MAX_DATAFORSEO_TASKS_PER_MONTH) {
    return { ok: false, reason: `DataForSEO monthly cap: ${usedThisMonth} used + ${wanted} wanted > ${CAPS.MAX_DATAFORSEO_TASKS_PER_MONTH}` };
  }
  return { ok: true };
}
