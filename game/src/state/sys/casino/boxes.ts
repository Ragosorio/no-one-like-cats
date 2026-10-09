/**
 * CAJAS MISTERIOSAS — nine boxes on the shelf. Their contents are a PUBLIC list (printed on the table), shuffled
 * when you pay. You open N of them and take the sum; then the rest are opened too, so you see where everything was.
 * Fewer boxes = more risk, same honesty. Every box is equally likely to hold any prize, so the return is exactly
 * N × (sum of the list) / 9 = 96% in all three modes.
 *   3 CAJAS · máx. x2.28   2 CAJAS · máx. x3.32   1 CAJA · máx. x6
 * The shuffle is drawn and saved when you pay: a reload resumes the same shelf.
 */
import { Cur, cs, persist } from '../casino';
import { Rng, Settled, defaultRng, miniStakes, pay, payout, settle, shuffle, validStake } from './common';

export type BoxTier = 0 | 1 | 2;
export const BOX_TIERS: { picks: number; name: string; contents: number[] }[] = [
  { picks: 3, name: '3 CAJAS', contents: [0, 0, 0, 0.1, 0.2, 0.3, 0.5, 0.78, 1] },
  { picks: 2, name: '2 CAJAS', contents: [0, 0, 0, 0, 0.2, 0.3, 0.5, 0.82, 2.5] },
  { picks: 1, name: '1 CAJA', contents: [0, 0, 0, 0, 0, 0, 0.64, 2, 6] },
];
export const BOX_TIER_BLURB = ['Abres tres y sumas. Rara vez sales en ceros.', 'Dos cajas: o sale el moño dorado o no.', 'Una sola caja: x6 si atinas al gato dorado.'] as const;
export function boxMath(tier: BoxTier) {
  const t = BOX_TIERS[tier];
  const sum = t.contents.reduce((a, b) => a + b, 0);
  const sorted = [...t.contents].sort((a, b) => b - a);
  return { rtp: (t.picks * sum) / t.contents.length, max: sorted.slice(0, t.picks).reduce((a, b) => a + b, 0) };
}
export const BOX_MATH = [boxMath(0), boxMath(1), boxMath(2)];
export function boxStakes(cur: Cur, tier: BoxTier) {
  return miniStakes(cur, BOX_MATH[tier].max);
}

export interface Shelf {
  cur: Cur;
  stake: number;
  tier: BoxTier;
  contents: number[];
  picked: number[];
}
export function shelf(): Shelf | null {
  const s = cs().boxes as Shelf | null | undefined;
  return s && Array.isArray(s.contents) && s.contents.length === 9 ? s : null;
}
export function boxesStart(cur: Cur, tier: BoxTier, stake: number, rng: Rng = defaultRng): Shelf | null {
  if (shelf()) return null;
  if (!validStake(cur, stake, BOX_MATH[tier].max)) return null;
  pay(cur, stake);
  const s: Shelf = { cur, stake, tier, contents: shuffle([...BOX_TIERS[tier].contents], rng), picked: [] };
  cs().boxes = s;
  persist();
  return s;
}
export interface PickResult {
  box: number;
  value: number;
  /** all picks done: settled (and the shelf is cleared) */
  done: (Settled & { total: number; contents: number[]; picked: number[] }) | null;
}
export function boxesPick(i: number): PickResult | null {
  const s = shelf();
  if (!s || i < 0 || i > 8 || s.picked.includes(i)) return null;
  s.picked.push(i);
  const value = s.contents[i];
  if (s.picked.length < BOX_TIERS[s.tier].picks) {
    persist();
    return { box: i, value, done: null };
  }
  const total = s.picked.reduce((a, k) => a + s.contents[k], 0);
  cs().boxes = null;
  const st = settle('boxes', s.cur, s.stake, payout(s.stake, total), `CAJAS x${+total.toFixed(2)}`);
  return { box: i, value, done: { ...st, total, contents: s.contents, picked: s.picked } };
}
