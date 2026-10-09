/**
 * MAYOR O MENOR "LA RACHA DEL GATO" — a card game with cat cards (A=1 … K=13, four suits that don't matter).
 * Every card is drawn uniformly from 13 ranks (an endless shoe: no counting, each card is 1 in 13).
 * Guess if the next card is HIGHER or LOWER. A tie loses. A right guess multiplies your pot by
 *     first guess:      floor₂(0.97 / P(right))
 *     every next guess: floor₂(0.99 / P(right))
 * (P(right) is printed on each button). Cash out whenever you want after the first right guess; a wrong guess
 * loses the pot. PASAR changes the card for free, up to 2 times per hand. The pot stops at x50 (house limit).
 * So cashing out after 1 right guess returns ≤97%, after 2 ≤96%, after 3 ≤95%: the longer the streak,
 * the bigger the pot and the bigger the house's cut. Rounding is always down.
 */
import { Cur, cs, persist } from '../casino';
import { Rng, Settled, defaultRng, miniStakes, pay, payout, rint, settle, validStake } from './common';

export const HILO = { first: 0.97, next: 0.99, cap: 50, skips: 2, ranks: 13 } as const;
export type Side = 'hi' | 'lo';

export function pRight(card: number, side: Side) {
  return side === 'hi' ? (HILO.ranks - card) / HILO.ranks : (card - 1) / HILO.ranks;
}
/** factor applied to the pot on a right guess (0 = impossible guess) */
export function factor(card: number, side: Side, steps: number) {
  const p = pRight(card, side);
  if (p <= 0) return 0;
  return Math.floor(((steps === 0 ? HILO.first : HILO.next) / p) * 100 + 1e-9) / 100;
}
export function hiloStakes(cur: Cur) {
  return miniStakes(cur, HILO.cap);
}

export interface Hand {
  cur: Cur;
  stake: number;
  card: number;
  /** current pot multiplier (1 until the first right guess) */
  mult: number;
  steps: number;
  skips: number;
  /** cards seen this hand (for the table) */
  seen: number[];
}
export function hand(): Hand | null {
  const h = cs().hilo as Hand | null | undefined;
  return h && Number.isFinite(h.card) && Number.isFinite(h.mult) ? h : null;
}
const draw = (rng: Rng) => 1 + rint(HILO.ranks, rng);

export function hiloStart(cur: Cur, stake: number, rng: Rng = defaultRng): Hand | null {
  if (hand()) return null;
  if (!validStake(cur, stake, HILO.cap)) return null;
  pay(cur, stake);
  const c = draw(rng);
  const h: Hand = { cur, stake, card: c, mult: 1, steps: 0, skips: HILO.skips, seen: [c] };
  cs().hilo = h;
  persist();
  return h;
}
export function hiloSkip(rng: Rng = defaultRng): Hand | null {
  const h = hand();
  if (!h || h.skips <= 0) return null;
  h.skips--;
  h.card = draw(rng);
  h.seen.push(h.card);
  persist();
  return h;
}
export interface GuessResult {
  from: number;
  card: number;
  right: boolean;
  /** the pot after the guess (0 = lost) */
  mult: number;
  /** settled: lost, or auto cash-out at the house limit */
  done: (Settled & { mult: number; capped: boolean }) | null;
}
export function hiloGuess(side: Side, rng: Rng = defaultRng): GuessResult | null {
  const h = hand();
  if (!h) return null;
  const f = factor(h.card, side, h.steps);
  if (f <= 0) return null;
  const from = h.card;
  const next = draw(rng);
  const right = side === 'hi' ? next > from : next < from;
  h.card = next;
  h.seen.push(next);
  if (h.seen.length > 30) h.seen.splice(0, h.seen.length - 30);
  if (!right) {
    cs().hilo = null;
    const s = settle('hilo', h.cur, h.stake, 0, `RACHA ${h.steps}`);
    return { from, card: next, right, mult: 0, done: { ...s, mult: 0, capped: false } };
  }
  h.steps++;
  h.mult = Math.min(HILO.cap, Math.floor(h.mult * f * 100 + 1e-9) / 100);
  if (h.mult >= HILO.cap) {
    const d = cashOut(h, true);
    return { from, card: next, right, mult: h.mult, done: d };
  }
  persist();
  return { from, card: next, right, mult: h.mult, done: null };
}
function cashOut(h: Hand, capped: boolean) {
  cs().hilo = null;
  const s = settle('hilo', h.cur, h.stake, payout(h.stake, h.mult), `RACHA ${h.steps} x${h.mult}`);
  return { ...s, mult: h.mult, capped };
}
/** cash out the pot (needs at least one right guess) */
export function hiloCash(): (Settled & { mult: number; capped: boolean }) | null {
  const h = hand();
  if (!h || h.steps < 1) return null;
  return cashOut(h, false);
}
/** the auto-play's published strategy: always the likelier side, PASAR on a 7, cash out after 2 right guesses */
export const AUTO_HILO = { cashAfter: 2 } as const;
export function bestSide(card: number): Side {
  return pRight(card, 'hi') >= pRight(card, 'lo') ? 'hi' : 'lo';
}

/** exact return of the auto strategy above (enumeration over every card; printed in the table, checked by tests) */
export function autoHiloRtp(): number {
  const ranks = Array.from({ length: HILO.ranks }, (_, i) => i + 1);
  const ev = (card: number, steps: number, mult: number, skips: number): number => {
    if (steps >= AUTO_HILO.cashAfter) return mult;
    if (card === 7 && skips > 0) return ranks.reduce((s, c) => s + ev(c, steps, mult, skips - 1), 0) / HILO.ranks;
    const side = bestSide(card);
    const m2 = Math.min(HILO.cap, Math.floor(mult * factor(card, side, steps) * 100 + 1e-9) / 100);
    return ranks.filter((c) => (side === 'hi' ? c > card : c < card)).reduce((s, c) => s + ev(c, steps + 1, m2, skips), 0) / HILO.ranks;
  };
  return ranks.reduce((s, c) => s + ev(c, 0, 1, HILO.skips), 0) / HILO.ranks;
}
