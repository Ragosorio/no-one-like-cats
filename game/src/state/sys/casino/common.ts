/**
 * Shared rules for the casino's newer tables (plinko, dados, rasca, cajas, bingo, mayor/menor).
 *   - every game pays a multiple of the stake in the SAME currency (fichas or oro); gems are not accepted here.
 *   - stakes: fichas 10 / 25 / 50 / 100 · oro = 1/8, 1/4, 1/2 and all of goldStakeCap(max multiplier), so the
 *     biggest possible payout is capped by income exactly like the Tragamichis and the Ruleta.
 *   - payouts are floor(stake × multiplier): the printed multiplier is the most you get, never less than shown
 *     rounded down to a whole coin.
 *   - every bet is settled (paid, recorded, saved) the moment it is resolved; animations only present it.
 */
import { Cur, GameId, Granted, MIN_GOLD_STAKE, MiniPrefs, canPay, creditWin, goldStakeCap, nice, payBet, prefs, rand, recordBet, stakeFor } from '../casino';

export type Rng = () => number;
export const defaultRng: Rng = rand;

export const MINI_CHIP_STAKES = [10, 25, 50, 100] as const;

/** stake options for a table whose biggest multiplier is `maxMult` */
export function miniStakes(cur: Cur, maxMult: number): number[] {
  if (cur === 'chips') return [...MINI_CHIP_STAKES];
  if (cur !== 'gold') return [];
  const cap = goldStakeCap(maxMult);
  return [...new Set([cap / 8, cap / 4, cap / 2, cap].map((v) => nice(Math.max(MIN_GOLD_STAKE, v))))];
}
export function validStake(cur: Cur, stake: number, maxMult: number) {
  return (cur === 'chips' || cur === 'gold') && miniStakes(cur, maxMult).includes(stake) && canPay(cur, stake);
}

export function miniPrefs(id: string): MiniPrefs {
  const p = prefs();
  p.games ??= {};
  return (p.games[id] ??= {});
}
/** remembered stake → the closest valid option */
export function rememberedStake(id: string, cur: Cur, maxMult: number) {
  return stakeFor(miniStakes(cur, maxMult), miniPrefs(id).stake);
}

export interface Settled {
  cur: Cur;
  stake: number;
  payout: number;
  /** LA CASA TE DEBE paid on this bet */
  candy: Granted[];
}
export function pay(cur: Cur, stake: number) {
  payBet(cur, stake);
}
/** credit the payout, write the history line and fill / pay the LA CASA TE DEBE meter (saves) */
export function settle(g: GameId, cur: Cur, stake: number, payout: number, label: string): Settled {
  const p = Math.max(0, Math.floor(payout));
  creditWin(cur, p);
  const candy = recordBet(g, cur, stake, p, label);
  return { cur, stake, payout: p, candy };
}
export function payout(stake: number, mult: number) {
  return Math.floor(stake * mult + 1e-9);
}

/** uniform integer in [0, n) */
export function rint(n: number, rng: Rng = defaultRng) {
  return Math.min(n - 1, Math.floor(rng() * n));
}
export function shuffle<T>(a: T[], rng: Rng = defaultRng): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rint(i + 1, rng);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function choose(n: number, k: number) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return r;
}
