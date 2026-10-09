/**
 * PLINKO "LA CASCADA" — 12 rows of pegs, 13 slots.
 * The ball's path is 12 fair coin flips (crypto RNG) drawn when you drop it; the animation bounces it peg to peg
 * along exactly that path. Landing slot k = number of "right" bounces, so P(k) = C(12,k) / 4096 — the printed odds
 * are exact, and the RTP below is computed from them (no simulation, no rounding games).
 *   BAJO  96.5% · máx. x10 · paga ≥ x1 en el 77% de las caídas
 *   MEDIO 96.0% · máx. x30
 *   ALTO  96.0% · máx. x140
 */
import { Cur } from '../casino';
import { Rng, Settled, choose, defaultRng, miniStakes, pay, payout, settle, validStake } from './common';

export const PLINKO_ROWS = 12;
export type PlinkoTier = 0 | 1 | 2;
export const PLINKO_TIER_NAME = ['BAJO', 'MEDIO', 'ALTO'] as const;
export const PLINKO_TIER_BLURB = ['Casi siempre te regresa algo.', 'Orillas jugosas, centro flaco.', 'Todo o casi nada: las orillas pagan x140.'] as const;
const half = (t: number[]) => [...t, ...t.slice(0, t.length - 1).reverse()];
/** multiplier per slot (left → right), symmetric */
export const PLINKO_TABLES: number[][] = [half([10, 3, 1.5, 1.2, 1.1, 1, 0.5]), half([30, 10, 4, 1.8, 1, 0.6, 0.4]), half([140, 30, 8, 2, 0.5, 0.2, 0.2])];

/** exact probability of landing in slot k */
export function plinkoProb(k: number) {
  return choose(PLINKO_ROWS, k) / 2 ** PLINKO_ROWS;
}
export function plinkoMath(tier: PlinkoTier) {
  const t = PLINKO_TABLES[tier];
  let rtp = 0;
  let back = 0;
  let win = 0;
  t.forEach((m, k) => {
    const p = plinkoProb(k);
    rtp += m * p;
    if (m >= 1) back += p;
    if (m > 1) win += p;
  });
  return { rtp, max: Math.max(...t), back, win };
}
export const PLINKO_MATH = [plinkoMath(0), plinkoMath(1), plinkoMath(2)];

export function plinkoStakes(cur: Cur, tier: PlinkoTier) {
  return miniStakes(cur, PLINKO_MATH[tier].max);
}

/** 0 = left, 1 = right at each row */
export function plinkoPath(rng: Rng = defaultRng): number[] {
  const p: number[] = [];
  for (let i = 0; i < PLINKO_ROWS; i++) p.push(rng() < 0.5 ? 0 : 1);
  return p;
}
export const slotOf = (path: number[]) => path.reduce((s, b) => s + b, 0);

export interface PlinkoResult extends Settled {
  tier: PlinkoTier;
  path: number[];
  slot: number;
  mult: number;
}
export function plinkoDrop(cur: Cur, tier: PlinkoTier, stake: number, rng: Rng = defaultRng): PlinkoResult | null {
  if (!validStake(cur, stake, PLINKO_MATH[tier].max)) return null;
  pay(cur, stake);
  const path = plinkoPath(rng);
  const slot = slotOf(path);
  const mult = PLINKO_TABLES[tier][slot];
  const s = settle('plinko', cur, stake, payout(stake, mult), `PLINKO x${mult}`);
  return { ...s, tier, path, slot, mult };
}
