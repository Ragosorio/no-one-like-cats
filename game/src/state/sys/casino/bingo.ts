/**
 * BINGO EXPRÉS — quick rounds. Each card is 3×3 (column 1: 1–10, column 2: 11–20, column 3: 21–30).
 * 13 balls are drawn from the 30 (crypto shuffle). Lines = rows, columns and both diagonals that are fully marked.
 * Pays by lines on each card (every card is paid on its own; play 1 to 3 cards per round, each costs the stake):
 *   1 línea x1.2 · 2 x3.2 · 3 x7 · 4 x15 · 5 x30 · 6 x50 · CARTÓN LLENO x300
 * Odds are exact: every set of marked cells of a given size is equally likely, so
 *   P(marked set = S) = C(21, 13 − |S|) / C(30, 13)   (summed over the 512 subsets of the card)
 * RTP 96.3% per card. Your numbers don't matter (any card has the same odds) — keep the ones you like.
 */
import { Cur, canPay } from '../casino';
import { Rng, Settled, choose, defaultRng, miniStakes, pay, payout, settle, shuffle } from './common';

export const BINGO = { pool: 30, draw: 13, maxCards: 3 } as const;
/** the 8 lines of a 3×3 card (cells row-major) */
export const BINGO_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
/** payout multiplier by completed lines (8 = full card) */
export const BINGO_PAY: Record<number, number> = { 1: 1.2, 2: 3.2, 3: 7, 4: 15, 5: 30, 6: 50, 8: 300 };
export const BINGO_PAY_ROWS: { lines: number; name: string }[] = [
  { lines: 1, name: '1 LÍNEA' },
  { lines: 2, name: '2 LÍNEAS' },
  { lines: 3, name: '3 LÍNEAS' },
  { lines: 4, name: '4 LÍNEAS' },
  { lines: 5, name: '5 LÍNEAS' },
  { lines: 6, name: '6 LÍNEAS' },
  { lines: 8, name: 'CARTÓN LLENO' },
];

export function linesOf(mask: number) {
  let n = 0;
  for (const l of BINGO_LINES) if (l.every((i) => (mask >> i) & 1)) n++;
  return n;
}
/** exact distribution of completed lines on one card */
export function bingoDist(): Record<number, number> {
  const tot = choose(BINGO.pool, BINGO.draw);
  const d: Record<number, number> = {};
  for (let m = 0; m < 512; m++) {
    let sz = 0;
    for (let i = 0; i < 9; i++) if ((m >> i) & 1) sz++;
    const p = choose(BINGO.pool - 9, BINGO.draw - sz) / tot;
    const L = linesOf(m);
    d[L] = (d[L] ?? 0) + p;
  }
  return d;
}
export const BINGO_DIST = bingoDist();
export const BINGO_MATH = {
  rtp: Object.entries(BINGO_PAY).reduce((s, [l, m]) => s + m * (BINGO_DIST[+l] ?? 0), 0),
  hit: Object.keys(BINGO_PAY).reduce((s, l) => s + (BINGO_DIST[+l] ?? 0), 0),
  max: Math.max(...Object.values(BINGO_PAY)),
};
export function bingoStakes(cur: Cur) {
  return miniStakes(cur, BINGO_MATH.max);
}

/** a fresh card: 3 numbers from each column's decade, sorted top → bottom */
export function bingoCard(rng: Rng = defaultRng): number[] {
  const cols = [0, 1, 2].map((c) => shuffle(Array.from({ length: 10 }, (_, i) => c * 10 + i + 1), rng).slice(0, 3).sort((a, b) => a - b));
  const out: number[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out.push(cols[c][r]);
  return out;
}
export function validCard(card: unknown): card is number[] {
  if (!Array.isArray(card) || card.length !== 9) return false;
  const seen = new Set<number>();
  for (let i = 0; i < 9; i++) {
    const n = card[i];
    const c = i % 3;
    if (!Number.isInteger(n) || n < c * 10 + 1 || n > c * 10 + 10 || seen.has(n)) return false;
    seen.add(n);
  }
  return true;
}
export function bingoDraw(rng: Rng = defaultRng): number[] {
  return shuffle(Array.from({ length: BINGO.pool }, (_, i) => i + 1), rng).slice(0, BINGO.draw);
}
export function markCard(card: number[], balls: number[]) {
  const set = new Set(balls);
  let mask = 0;
  card.forEach((n, i) => {
    if (set.has(n)) mask |= 1 << i;
  });
  const lines = BINGO_LINES.map((l, i) => (l.every((k) => (mask >> k) & 1) ? i : -1)).filter((i) => i >= 0);
  const L = lines.length;
  return { mask, lines, mult: BINGO_PAY[L] ?? 0 };
}

export interface BingoRound extends Settled {
  balls: number[];
  cards: { card: number[]; mask: number; lines: number[]; mult: number; win: number }[];
}
export function bingoPlay(cur: Cur, stake: number, cards: number[][], rng: Rng = defaultRng): BingoRound | null {
  if (!cards.length || cards.length > BINGO.maxCards || !cards.every(validCard)) return null;
  if (!miniStakes(cur, BINGO_MATH.max).includes(stake) || !canPay(cur, stake * cards.length)) return null;
  const total = stake * cards.length;
  pay(cur, total);
  const balls = bingoDraw(rng);
  const res = cards.map((card) => {
    const m = markCard(card, balls);
    return { card, ...m, win: payout(stake, m.mult) };
  });
  const won = res.reduce((s, c) => s + c.win, 0);
  const best = Math.max(...res.map((c) => c.lines.length));
  const s = settle('bingo', cur, total, won, best ? `BINGO ${best === 8 ? 'LLENO' : `${best} LÍN.`}` : 'BINGO NADA');
  return { ...s, balls, cards: res };
}
