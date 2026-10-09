/**
 * Casino tables: the printed odds / RTP must match the implementation.
 * Each game: exact math (from the public tables) + ≥100k simulated plays through the REAL settle path
 * (pay → resolve → credit → history), with a seeded RNG so the run is reproducible. Tolerance = 4.5 standard
 * errors of the payout per play (computed from the exact distribution where we have it).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { G, newGame } from '../src/state';
import { cs, chips, addChips, CHIPS, syncChips, migrateAutoPrefs, autoPrefs, prefs } from '../src/state/sys/casino';
import { PLINKO_MATH, PLINKO_TABLES, plinkoDrop, plinkoPath, plinkoProb, PlinkoTier, plinkoStakes, slotOf } from '../src/state/sys/casino/plinko';
import { P_DUEL, P_ROUND, DICE, DICE_RTP, bestChoice, duelDecide, duelStart, options } from '../src/state/sys/casino/dice';
import { SCRATCH_MATH, SCRATCH_PRIZES, scratchBuy, scratchOutcome, scratchWinner } from '../src/state/sys/casino/scratch';
import { BOX_MATH, BOX_TIERS, BoxTier, boxesPick, boxesStart, shelf } from '../src/state/sys/casino/boxes';
import { BINGO, BINGO_DIST, BINGO_MATH, BINGO_PAY, bingoCard, bingoDraw, bingoPlay, markCard, validCard } from '../src/state/sys/casino/bingo';
import { HILO, autoHiloRtp, bestSide, factor, hand, hiloCash, hiloGuess, hiloSkip, hiloStart, pRight } from '../src/state/sys/casino/hilo';
import { miniStakes } from '../src/state/sys/casino/common';

/** mulberry32: deterministic test RNG */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const N = 100_000;
const STAKE = 100;
const report: string[] = [];
function rich() {
  cs().chips = 1e13;
}
function check(name: string, staked: number, won: number, rtp: number, sd: number, n = N) {
  const got = won / staked;
  const tol = (4.5 * sd) / Math.sqrt(n) + 0.002;
  report.push(`${name.padEnd(28)} impreso ${(rtp * 100).toFixed(2)}%  simulado ${(got * 100).toFixed(2)}%  (n=${n}, ±${(tol * 100).toFixed(2)}%)`);
  expect(Math.abs(got - rtp)).toBeLessThan(tol);
}

describe('casino tables: printed odds == implementation', { timeout: 180_000 }, () => {
  beforeEach(() => {
    newGame();
    rich();
  });

  it('PLINKO: exact binomial odds, RTP per tier, 100k drops each', () => {
    let pt = 0;
    for (let k = 0; k <= 12; k++) pt += plinkoProb(k);
    expect(pt).toBeCloseTo(1, 12);
    for (const tier of [0, 1, 2] as PlinkoTier[]) {
      const m = PLINKO_MATH[tier];
      expect(m.rtp).toBeGreaterThan(0.94);
      expect(m.rtp).toBeLessThan(0.97);
      const ev2 = PLINKO_TABLES[tier].reduce((s, x, k) => s + x * x * plinkoProb(k), 0);
      const sd = Math.sqrt(ev2 - m.rtp * m.rtp);
      const rng = seeded(11 + tier);
      let won = 0;
      const hits = new Array(13).fill(0);
      for (let i = 0; i < N; i++) {
        const r = plinkoDrop('chips', tier, STAKE, rng)!;
        won += r.payout;
        hits[r.slot]++;
        expect(r.slot).toBe(r.path.reduce((a, b) => a + b, 0));
      }
      // slot frequencies match C(12,k)/4096 (centre slots, where the counts are large)
      for (const k of [4, 5, 6, 7, 8]) expect(Math.abs(hits[k] / N - plinkoProb(k))).toBeLessThan(0.006);
      check(`plinko ${['BAJO', 'MEDIO', 'ALTO'][tier]}`, N * STAKE, won, m.rtp, sd);
    }
  });

  it('DUELO DE DADOS: exact round/duel odds, optimal play simulated 100k duels', () => {
    expect(P_ROUND).toBeCloseTo(0.41133, 4);
    expect(DICE_RTP).toBeGreaterThan(0.94);
    expect(DICE_RTP).toBeLessThan(0.97);
    // the printed option chances are what really happens: re-rolling a 1 next to a 6 beats keeping 7
    const o = options([1, 6]);
    expect(o.r0).toBeGreaterThan(o.keep);
    const rng = seeded(7);
    let won = 0;
    let duels = 0;
    while (duels < N) {
      expect(duelStart('chips', STAKE, rng)).not.toBeNull();
      for (;;) {
        const d = cs().duel as { dice: [number, number] };
        const r = duelDecide(bestChoice(d.dice), rng)!;
        if (r.done) {
          won += r.done.payout;
          break;
        }
      }
      duels++;
    }
    const sd = DICE.mult * Math.sqrt(P_DUEL * (1 - P_DUEL));
    check('dados (mejor jugada)', N * STAKE, won, DICE_RTP, sd);
  });

  it('RASCA Y GANA: printed prize table, layouts honest, 100k cards', () => {
    expect(SCRATCH_MATH.rtp).toBeCloseTo(0.96, 10);
    const ev2 = SCRATCH_PRIZES.reduce((s, x) => s + x.mult * x.mult * x.p, 0);
    const sd = Math.sqrt(ev2 - SCRATCH_MATH.rtp ** 2);
    const rng = seeded(3);
    let won = 0;
    let hits = 0;
    for (let i = 0; i < N; i++) {
      const c = scratchBuy('chips', STAKE, rng)!;
      won += c.payout;
      if (c.win) hits++;
      // the card shows exactly the prize it paid: one triple of the winning symbol, no other triple
      expect(scratchWinner(c.cells)).toBe(c.win);
      expect(c.cells.length).toBe(9);
    }
    expect(Math.abs(hits / N - SCRATCH_MATH.hit)).toBeLessThan(0.007);
    check('rasca y gana', N * STAKE, won, SCRATCH_MATH.rtp, sd);
  });

  it('CAJAS MISTERIOSAS: RTP = picks × sum / 9 in every mode, 100k shelves each', () => {
    for (const tier of [0, 1, 2] as BoxTier[]) {
      const t = BOX_TIERS[tier];
      expect(BOX_MATH[tier].rtp).toBeCloseTo(0.96, 10);
      // exact variance of the sum of `picks` draws without replacement
      const mu = t.contents.reduce((a, b) => a + b, 0) / 9;
      const v1 = t.contents.reduce((a, b) => a + (b - mu) ** 2, 0) / 9;
      const sd = Math.sqrt(t.picks * v1 * ((9 - t.picks) / 8));
      const rng = seeded(100 + tier);
      let won = 0;
      for (let i = 0; i < N; i++) {
        boxesStart('chips', tier, STAKE, rng);
        let r = null;
        // the player picks boxes in a fixed order: it can't matter (contents are shuffled)
        for (let k = 0; k < t.picks; k++) r = boxesPick((i + k * 4) % 9);
        expect(r!.done).not.toBeNull();
        won += r!.done!.payout;
      }
      expect(shelf()).toBeNull();
      check(`cajas ${t.name}`, N * STAKE, won, BOX_MATH[tier].rtp, sd);
    }
  });

  it('BINGO EXPRÉS: exact line distribution, 100k cards', () => {
    const tot = Object.values(BINGO_DIST).reduce((a, b) => a + b, 0);
    expect(tot).toBeCloseTo(1, 12);
    expect(BINGO_DIST[7] ?? 0).toBe(0); // 7 lines is impossible on a 3×3
    expect(BINGO_MATH.rtp).toBeGreaterThan(0.95);
    expect(BINGO_MATH.rtp).toBeLessThan(0.97);
    const ev2 = Object.entries(BINGO_PAY).reduce((s, [l, m]) => s + m * m * (BINGO_DIST[+l] ?? 0), 0);
    const sd = Math.sqrt(ev2 - BINGO_MATH.rtp ** 2);
    const rng = seeded(5);
    let won = 0;
    let staked = 0;
    let cards = 0;
    const deck = [bingoCard(rng), bingoCard(rng), bingoCard(rng)];
    expect(deck.every(validCard)).toBe(true);
    for (let i = 0; cards < N; i++) {
      const n = 1 + (i % 3);
      const r = bingoPlay('chips', STAKE, deck.slice(0, n), rng)!;
      expect(r.balls.length).toBe(BINGO.draw);
      won += r.payout;
      staked += STAKE * n;
      cards += n;
    }
    // cards in the same round share the draw (correlated), so widen by √3
    check('bingo exprés', staked, won, BINGO_MATH.rtp, sd * Math.sqrt(3), cards);
  });

  it('MAYOR O MENOR: factors, cap, and the auto strategy RTP (exact vs 100k hands)', () => {
    expect(factor(1, 'lo', 0)).toBe(0);
    expect(factor(13, 'hi', 0)).toBe(0);
    expect(factor(7, 'hi', 0)).toBe(Math.floor((0.97 / (6 / 13)) * 100) / 100);
    // exact EV of the published auto strategy: likelier side, PASAR on a 7 (while skips last), cash after 2 rights
    const ranks = Array.from({ length: 13 }, (_, i) => i + 1);
    const evFrom = (card: number, steps: number, mult: number, skips: number): number => {
      if (steps >= 2) return mult;
      if (card === 7 && skips > 0) return ranks.reduce((s, c) => s + evFrom(c, steps, mult, skips - 1), 0) / 13;
      const side = bestSide(card);
      const f = factor(card, side, steps);
      const p = pRight(card, side);
      const m2 = Math.min(HILO.cap, Math.floor(mult * f * 100 + 1e-9) / 100);
      // the next card is uniform among the "right" ranks
      const rightRanks = ranks.filter((c) => (side === 'hi' ? c > card : c < card));
      return rightRanks.reduce((s, c) => s + evFrom(c, steps + 1, m2, skips), 0) / 13 + 0 * (1 - p);
    };
    const exact = ranks.reduce((s, c) => s + evFrom(c, 0, 1, HILO.skips), 0) / 13;
    expect(autoHiloRtp()).toBeCloseTo(exact, 12); // the number printed in the table
    expect(exact).toBeLessThan(0.97);
    expect(exact).toBeGreaterThan(0.93);
    const rng = seeded(9);
    let won = 0;
    let sq = 0;
    for (let i = 0; i < N; i++) {
      hiloStart('chips', STAKE, rng);
      let pay = -1;
      for (;;) {
        const h = hand()!;
        if (h.steps >= 2) {
          pay = hiloCash()!.payout;
          break;
        }
        if (h.card === 7 && h.skips > 0) {
          hiloSkip(rng);
          continue;
        }
        const r = hiloGuess(bestSide(h.card), rng)!;
        if (r.done) {
          pay = r.done.payout;
          break;
        }
      }
      won += pay;
      sq += (pay / STAKE) ** 2;
    }
    const sd = Math.sqrt(sq / N - (won / (N * STAKE)) ** 2);
    check('mayor/menor (auto)', N * STAKE, won, exact, sd);
    // any "cash after 1" strategy is ≤ 97%, longer streaks pay the house more
    expect(HILO.first).toBeLessThanOrEqual(0.97);
  });

  it('gold stakes are capped by income (max payout ≤ the house limit)', () => {
    G.s.gold = 1e9;
    const st = plinkoStakes('gold', 2);
    expect(st.length).toBeGreaterThan(0);
    expect(Math.max(...st)).toBeLessThanOrEqual(Math.max(...miniStakes('gold', 1)));
    const r = plinkoDrop('gold', 2, st[0]);
    expect(r).not.toBeNull();
    expect(plinkoDrop('gold', 2, st[0] + 1)).toBeNull(); // arbitrary stakes are refused
  });

  it('high-variance tables, 2M outcomes through the same draw functions (tight check)', () => {
    const M = 2_000_000;
    const rng = seeded(77);
    let w = 0;
    let w2 = 0;
    for (let i = 0; i < M; i++) w += PLINKO_TABLES[2][slotOf(plinkoPath(rng))];
    const ev2 = PLINKO_TABLES[2].reduce((s, x, k) => s + x * x * plinkoProb(k), 0);
    check('plinko ALTO (2M caídas)', M, w, PLINKO_MATH[2].rtp, Math.sqrt(ev2 - PLINKO_MATH[2].rtp ** 2), M);
    for (let i = 0; i < M; i++) w2 += scratchOutcome(rng)?.mult ?? 0;
    const sev2 = SCRATCH_PRIZES.reduce((s, x) => s + x.mult * x.mult * x.p, 0);
    check('rasca y gana (2M boletos)', M, w2, SCRATCH_MATH.rtp, Math.sqrt(sev2 - SCRATCH_MATH.rtp ** 2), M);
    const card = bingoCard(rng);
    let w3 = 0;
    const B = 1_000_000;
    for (let i = 0; i < B; i++) w3 += markCard(card, bingoDraw(rng)).mult;
    const bev2 = Object.entries(BINGO_PAY).reduce((s, [l, m]) => s + m * m * (BINGO_DIST[+l] ?? 0), 0);
    check('bingo (1M cartones)', B, w3, BINGO_MATH.rtp, Math.sqrt(bev2 - BINGO_MATH.rtp ** 2), B);
  });

  it('prints the simulation report', () => {
    console.log('\n' + report.join('\n'));
  });
});

describe('fichas: no silent clamp', () => {
  beforeEach(() => newGame());
  it('prizes above the old 1500 cap are paid in full; campaign income still stops at the cap', () => {
    cs().chips = 1490;
    expect(addChips(100, 'prize')).toBe(100);
    expect(chips()).toBe(1590);
    expect(addChips(50, 'sync')).toBe(0); // already above the income cap: income adds nothing, never removes
    expect(chips()).toBe(1590);
    cs().chips = 1450;
    expect(addChips(200, 'sync')).toBe(CHIPS.cap - 1450);
    const s = syncChips();
    expect(s.gained).toBeGreaterThanOrEqual(0);
  });
});

describe('auto-play prefs migration', () => {
  beforeEach(() => newGame());
  it('x2 / x4 → x10, TURBO → x20; old defaults (25 rounds, stop on prizes) → until you stop', () => {
    expect(migrateAutoPrefs({ speed: 4 as never, rounds: 25, stopBig: true, stopLegend: true, stopNew: false, floorPct: 50 }).speed).toBe(10);
    expect(migrateAutoPrefs({ speed: 2 as never, rounds: 0, v: 2 }).speed).toBe(10);
    expect(migrateAutoPrefs({ speed: 1, rounds: 0, v: 2 }).speed).toBe(1);
    const t = migrateAutoPrefs({ speed: 99 as never, rounds: 25, stopBig: true, stopLegend: true, stopNew: true, floorPct: 25 });
    expect(t).toMatchObject({ speed: 20, rounds: 0, stopBig: false, stopLegend: false, stopNew: true, floorPct: 25, v: 3 });
    // a player's own choice survives (only the old defaults are migrated)
    expect(migrateAutoPrefs({ speed: 1, rounds: 50 }).rounds).toBe(50);
    // already migrated: untouched
    expect(migrateAutoPrefs({ speed: 10, rounds: 25, stopBig: true, v: 2 })).toMatchObject({ rounds: 25, stopBig: true });
    prefs().auto = { speed: 99 as never, rounds: 25, stopBig: true, stopLegend: true, stopNew: false, floorPct: 50 };
    expect(autoPrefs().speed).toBe(20);
    expect(autoPrefs().rounds).toBe(0);
  });
});
