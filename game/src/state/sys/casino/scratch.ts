/**
 * RASCA Y GANA "MICHI DE LA SUERTE" — a 3×3 card. Three equal symbols anywhere = that prize (never more than one).
 * The card is printed when you buy it: the prize is drawn from the public table below, then the 9 cells are laid out
 * at random so that ONLY that symbol appears three times (a losing card is a uniformly random card with no triple —
 * pairs happen naturally, they're never staged). Scratching just uncovers what was printed.
 *   GATO NEGRO x100  0.1% · OJO DE GATO x20  0.8% · DOBLÓN x5  4% · PESCADITO x2  12% · ESTAMBRE x1  26%
 *   RTP 96.0% · premio (x1 o más) en 42.9% de los boletos
 */
import { Cur, Sym } from '../casino';
import { Rng, Settled, defaultRng, miniStakes, pay, payout, rint, settle, shuffle, validStake } from './common';

/** symbols printed on the card (PATITA never pays: filler) */
export const SCRATCH_SYMS: Sym[] = ['neko', 'gema', 'doblon', 'pez', 'ovillo', 'pata'];
export const SCRATCH_PRIZES: { sym: Sym; mult: number; p: number }[] = [
  { sym: 'neko', mult: 100, p: 0.001 },
  { sym: 'gema', mult: 20, p: 0.008 },
  { sym: 'doblon', mult: 5, p: 0.04 },
  { sym: 'pez', mult: 2, p: 0.12 },
  { sym: 'ovillo', mult: 1, p: 0.26 },
];
export const SCRATCH_MATH = {
  rtp: SCRATCH_PRIZES.reduce((s, x) => s + x.mult * x.p, 0),
  hit: SCRATCH_PRIZES.reduce((s, x) => s + x.p, 0),
  max: Math.max(...SCRATCH_PRIZES.map((x) => x.mult)),
};
export function scratchStakes(cur: Cur) {
  return miniStakes(cur, SCRATCH_MATH.max);
}

/** the printed prize: one of the table's symbols (null = no prize) */
export function scratchOutcome(rng: Rng = defaultRng): { sym: Sym; mult: number } | null {
  let r = rng();
  for (const x of SCRATCH_PRIZES) {
    if (r < x.p) return { sym: x.sym, mult: x.mult };
    r -= x.p;
  }
  return null;
}

/** a 9-cell layout where `win` (if any) appears exactly 3 times and every other symbol at most twice */
export function scratchLayout(win: Sym | null, rng: Rng = defaultRng): Sym[] {
  const others = SCRATCH_SYMS.filter((s) => s !== win);
  for (let tries = 0; tries < 500; tries++) {
    const cells: Sym[] = win ? [win, win, win] : [];
    const count = new Map<Sym, number>();
    let ok = true;
    while (cells.length < 9) {
      const s = others[rint(others.length, rng)];
      const n = (count.get(s) ?? 0) + 1;
      if (n > 2) {
        ok = false;
        break;
      }
      count.set(s, n);
      cells.push(s);
    }
    if (ok) return shuffle(cells, rng);
  }
  // deterministic fallback (practically unreachable): pairs of the other symbols
  const cells: Sym[] = win ? [win, win, win] : [];
  let i = 0;
  while (cells.length < 9) cells.push(others[Math.floor(i++ / 2) % others.length]);
  return shuffle(cells, rng);
}
/** the prize a laid-out card shows (for tests / the view: the triple, if any) */
export function scratchWinner(cells: Sym[]): Sym | null {
  const n = new Map<Sym, number>();
  for (const s of cells) n.set(s, (n.get(s) ?? 0) + 1);
  for (const [s, c] of n) if (c >= 3) return s;
  return null;
}

export interface ScratchCard extends Settled {
  cells: Sym[];
  win: Sym | null;
  mult: number;
}
export function scratchBuy(cur: Cur, stake: number, rng: Rng = defaultRng): ScratchCard | null {
  if (!validStake(cur, stake, SCRATCH_MATH.max)) return null;
  pay(cur, stake);
  const o = scratchOutcome(rng);
  const cells = scratchLayout(o?.sym ?? null, rng);
  const mult = o?.mult ?? 0;
  const s = settle('scratch', cur, stake, payout(stake, mult), o ? `RASCA x${mult}` : 'RASCA NADA');
  return { ...s, cells, win: o?.sym ?? null, mult };
}
