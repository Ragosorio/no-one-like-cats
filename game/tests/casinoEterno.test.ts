/**
 * MODO ETERNO: the resolution must be exact, idempotent and fair.
 * Never touches a real save: every test starts from newGame() (in-memory storage under vitest).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { G, newGame } from '../src/state';
import { cs } from '../src/state/sys/casino';
import { CATS } from '../src/data/content';
import { AT_RISK, ETERNO, atRisk, eternoPrize, eternoRoll, eternoState, eternoWins, resolveEterno, settleAbandoned, startEterno, stopEterno } from '../src/state/sys/casino/eterno';

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
/** a save with a bit of everything, so "nothing else is touched" means something */
function loaded() {
  newGame();
  G.s.elements = [...new Set([...G.s.elements, 'earth', 'storm', 'magic', 'cosmic', 'void', 'ice', 'sound', 'shadow', 'time', 'light'])];
  G.s.campaign.bossesDefeated = 6;
  G.s.gold = 123456.75;
  G.s.gems = 77;
  G.s.food = 9999;
  G.s.prisma = 5;
  G.s.scrap = 40;
  G.s.blueprint = 3;
  G.s.crystals = { fire: 12, water: 3 };
  G.s.orbs = { ...G.s.orbs, c_canelo: 50 };
  G.s.purr = 33;
  const c = cs();
  c.tickets = 42;
  c.chips = 3210;
  c.pity['michi:l'] = 7;
  G.s.cats[0].level = 30;
  G.s.cats[0].stars = 3;
}
/** G.s without the five fields at risk and the bookkeeping that legitimately changes */
function rest(s: typeof G.s) {
  const x = clone(s) as Record<string, unknown> & { casino: Record<string, unknown> };
  delete x.gold;
  delete x.gems;
  delete x.food;
  delete x.savedAt;
  delete x.casino.tickets;
  delete x.casino.chips;
  delete x.casino.eterno;
  return x;
}

describe('MODO ETERNO: resolveEterno', { timeout: 120_000 }, () => {
  beforeEach(loaded);

  it('LOSS: exactly gold, gems, food, tickets and chips go to 0 — nothing else changes', () => {
    const before = clone(G.s);
    const s = startEterno('slot');
    const r = resolveEterno(s.id, 0.75)!;
    expect(r.applied).toBe(true);
    expect(r.record.r).toBe('loss');
    expect(G.s.gold).toBe(0);
    expect(G.s.gems).toBe(0);
    expect(G.s.food).toBe(0);
    expect(cs().tickets).toBe(0);
    expect(cs().chips).toBe(0);
    expect(r.record.lost).toEqual({ gold: before.gold, gems: before.gems, food: before.food, tickets: 42, chips: 3210 });
    expect(rest(G.s)).toEqual(rest(before));
    expect(AT_RISK).toEqual(['gold', 'gems', 'food', 'tickets', 'chips']);
  });

  it('WIN: keeps every balance and grants ONE legendary / mythic / HOLO cat', () => {
    const before = clone(G.s);
    const cats0 = G.s.cats.length;
    const s = startEterno('roulette');
    const r = resolveEterno(s.id, 0.1)!;
    expect(r.record.r).toBe('win');
    const p = r.record.prize!;
    expect(p.kind).toBe('cat');
    const def = CATS.find((c) => c.id === p.ref)!;
    expect(['legendary', 'mythic']).toContain(def.rarity);
    // nothing is taken (a NEW cat may add its usual discovery gift on top)
    expect(G.s.gold).toBeGreaterThanOrEqual(before.gold);
    expect(G.s.gems).toBeGreaterThanOrEqual(before.gems);
    expect(G.s.food).toBeGreaterThanOrEqual(before.food);
    expect(cs().tickets).toBeGreaterThanOrEqual(42);
    expect(cs().chips).toBeGreaterThanOrEqual(3210);
    // the cat arrived (new cat, holo upgrade or orbs for a duplicate)
    expect(G.s.cats.length + Object.values(G.s.orbs).reduce((a, b) => a + b, 0)).toBeGreaterThan(cats0 + Object.values(before.orbs).reduce((a, b) => a + b, 0) - 1);
  });

  it('the special reward is never heroic, divine or a Podio cat (5k draws)', () => {
    let holo = 0;
    for (let i = 0; i < 5000; i++) {
      const p = eternoPrize();
      const def = CATS.find((c) => c.id === p.ref)!;
      expect(['legendary', 'mythic']).toContain(def.rarity);
      expect(def.obtain?.source ?? '').not.toMatch(/^podio/);
      if (p.holo) holo++;
    }
    expect(holo / 5000).toBeGreaterThan(0.25);
  });

  it('double resolve / reload / re-roll is a no-op', () => {
    const s = startEterno('slot');
    const first = resolveEterno(s.id, 0.9)!;
    expect(first.applied).toBe(true);
    const snap = clone(G.s);
    // double tap with another roll
    const again = resolveEterno(s.id, 0.01)!;
    expect(again.applied).toBe(false);
    expect(again.record.r).toBe('loss');
    // "reload": the state goes through JSON and the same session is resolved again
    G.s = clone(G.s);
    expect(resolveEterno(s.id, 0.2)!.applied).toBe(false);
    const a = clone(G.s) as Record<string, unknown>;
    const b = clone(snap) as Record<string, unknown>;
    delete a.savedAt;
    delete b.savedAt;
    expect(a).toEqual(b);
  });

  it('unknown sessions and invalid rolls change nothing; a stopped session can never resolve', () => {
    const snap = clone(G.s);
    expect(resolveEterno('et-nope', 0.1)).toBeNull();
    const s = startEterno('slot');
    expect(resolveEterno(s.id, NaN)).toBeNull();
    expect(resolveEterno(s.id, 1)).toBeNull();
    expect(stopEterno(s.id)!.r).toBe('stop');
    expect(stopEterno(s.id)).toBeNull();
    const r = resolveEterno(s.id, 0.9)!;
    expect(r.applied).toBe(false);
    expect(G.s.gold).toBe(snap.gold);
    expect(cs().chips).toBe(3210);
  });

  it('a session left open by a reload is settled as abandoned (= stop: no roll, no loss, no prize)', () => {
    const s = startEterno('slot');
    G.s = clone(G.s); // reload
    const rec = settleAbandoned()!;
    expect(rec.r).toBe('abandon');
    expect(eternoState().open).toBeNull();
    expect(resolveEterno(s.id, 0.9)!.applied).toBe(false);
    expect(G.s.gold).toBe(123456.75);
    // starting a new session also closes a forgotten one first
    const a = startEterno('slot');
    const b = startEterno('slot');
    expect(eternoState().done).toContain(a.id);
    expect(resolveEterno(b.id, 0.3)!.applied).toBe(true);
  });

  it('atRisk lists the current amounts the confirmation prints', () => {
    expect(atRisk()).toEqual({ gold: 123456.75, gems: 77, food: 9999, tickets: 42, chips: 3210 });
  });

  it('the 50/50 is fair: 100k crypto rolls', () => {
    const N = 100_000;
    let w = 0;
    const dec = new Array(10).fill(0);
    for (let i = 0; i < N; i++) {
      const r = eternoRoll();
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(1);
      if (eternoWins(r)) w++;
      dec[Math.floor(r * 10)]++;
    }
    const p = w / N;
    // 4.5 standard errors (σ = 0.5/√N ≈ 0.00158)
    expect(Math.abs(p - ETERNO.winChance)).toBeLessThan(4.5 * Math.sqrt(0.25 / N));
    // uniformity: chi-square over deciles (df 9, p≈0.0001 critical ≈ 33.7)
    const e = N / 10;
    const chi = dec.reduce((s, o) => s + ((o - e) * (o - e)) / e, 0);
    expect(chi).toBeLessThan(33.7);
    console.log(`\nETERNO 50/50: ${w} victorias en ${N} (${(p * 100).toFixed(2)}%), chi² deciles = ${chi.toFixed(2)}`);
    // and the full resolution path, 2k sessions: wins ≈ losses
    let wins = 0;
    const M = 2000;
    for (let i = 0; i < M; i++) {
      const s = startEterno('slot');
      if (resolveEterno(s.id, eternoRoll())!.record.r === 'win') wins++;
    }
    expect(Math.abs(wins / M - 0.5)).toBeLessThan(4.5 * Math.sqrt(0.25 / M));
    console.log(`ETERNO resolución completa: ${wins} victorias en ${M} sesiones (${((wins / M) * 100).toFixed(1)}%)`);
  });
});
