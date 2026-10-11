/**
 * FLASH GUARD — photosensitivity rules for Momentos (pure; tests/momentos.test.ts).
 *
 *  - never more than 3 FULL-SCREEN flashes in any 1 s window (impact frames count: they invert the whole screen)
 *  - no saturated red full-screen flash, ever (the color is swapped for a warm white)
 *  - «Reducir destellos»: every full-screen flash is soft (≤ 25 % luminance change), impact frames turn into a
 *    non-inverting variant (ink lines on the frame, no inversion)
 *
 * Verbs ask `guard.request(m, 'impact' | 'flash')` and get back how they may show: 'full' | 'soft' | 'none'.
 * The window is in MOMENTO time (seeking backward resets it), so a scrubbed render and a live run agree.
 */
export type FlashGrant = 'full' | 'soft' | 'none';

export const MAX_FLASHES_PER_SEC = 3;
/** alpha cap for a soft flash (reduce flashes / over budget) */
export const SOFT_FLASH_ALPHA = 0.25;

export class FlashGuard {
  private times: number[] = [];
  /** grants given (tests / traces) */
  log: { m: number; kind: string; grant: FlashGrant }[] = [];
  constructor(public reduce = false) {}

  /** a full-screen flash wants to happen at momento time m */
  request(m: number, kind: 'impact' | 'flash' = 'flash'): FlashGrant {
    // time went backwards (seek / replay from the start): forget the future
    if (this.times.length && m < this.times[this.times.length - 1] - 0.05) this.times = this.times.filter((t) => t <= m);
    this.times = this.times.filter((t) => m - t < 1);
    let g: FlashGrant;
    if (this.reduce) g = 'soft';
    else if (this.times.length >= MAX_FLASHES_PER_SEC) g = 'soft';
    else {
      g = 'full';
      this.times.push(m);
    }
    this.log.push({ m, kind, grant: g });
    if (this.log.length > 400) this.log.shift();
    return g;
  }
  /** flashes granted 'full' in (m − 1, m] */
  countAt(m: number) {
    return this.times.filter((t) => t <= m && m - t < 1).length;
  }
  reset() {
    this.times = [];
  }
}

/** hue (deg), saturation, value of a 0xRRGGBB color */
export function hsv(hex: number): [number, number, number] {
  const r = ((hex >> 16) & 255) / 255;
  const g = ((hex >> 8) & 255) / 255;
  const b = (hex & 255) / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  let h = 0;
  if (d > 0) {
    if (mx === r) h = 60 * (((g - b) / d) % 6);
    else if (mx === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  return [h, mx === 0 ? 0 : d / mx, mx];
}
/** a saturated red (the one color a full-screen flash may never be) */
export function isSaturatedRed(hex: number) {
  const [h, s, v] = hsv(hex);
  return (h <= 22 || h >= 338) && s > 0.5 && v > 0.3;
}
/** the color a full-screen flash may use: saturated reds become a warm white */
export function safeFlashColor(hex: number): number {
  return isSaturatedRed(hex) ? 0xfff1e0 : hex;
}
