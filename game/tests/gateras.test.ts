/**
 * Parte III · LA CARTA DE LAS CAJAS (state/sys/gateras.ts + gaterasBattles.ts): the save slice and its normalizer,
 * Maneki's price (minutes of income, the Marea Final divided out), the HUELLAS DE 000 (3 per first win, 10 per boss)
 * and the Borracha's battles (buildSiege, never content.enemies; the spec the estimate sims = the spec the screen plays).
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const mem = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, String(v)),
  removeItem: (k: string) => void mem.delete(k),
  key: (i: number) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size;
  },
  clear: () => mem.clear(),
};

const { G } = await import('../src/state');
const { SAVE_KEY } = await import('../src/core/save');
const GT = await import('../src/state/sys/gateras');
const GB = await import('../src/state/sys/gaterasBattles');
const { incomePerSec } = await import('../src/state/sys/shop');
const { autoBattle } = await import('../src/battle/autoplay');
const { DIFFICULTY } = await import('../src/battle/ai');
const { ZONES } = await import('../src/data/content');
const { frontier } = await import('../src/state/sys/campaign');

const fixturePath = (f: string) => new URL(`../test-saves/${f}.json`, import.meta.url);
const H65 = existsSync(fixturePath('h65-normal')) ? 'h65-normal' : null;
function load(f = 'post-finale') {
  mem.clear();
  mem.set(SAVE_KEY, readFileSync(fixturePath(f), 'utf8'));
  G.load();
  expect(G.loaded).toBe(true);
}
const plain = (s: object) => JSON.parse(JSON.stringify({ ...s, seed: 0, onEnd: undefined }));
const B = 'p3d_borracha' as const;

describe('the slice: optional, normalized, never subtracts', () => {
  it('a save without the Parte III loads byte-identical (no ext.gateras is created)', () => {
    load();
    expect(G.s.ext?.gateras).toBeUndefined();
    const before = JSON.stringify(G.s);
    // reading the Carta's state creates nothing
    expect(GT.isOpen(B)).toBe(false);
    expect(GT.huellas()).toBe(0);
    expect(GT.stageState(B, 1)).toBe('locked');
    expect(GT.cartaAvailable()).toBe(false);
    expect(JSON.stringify(G.s)).toBe(before);
  });

  it('the normalizer repairs without subtracting (and keeps what it does not know)', () => {
    expect(GT.normalizeGateras(null)).toBeNull();
    expect(GT.normalizeGateras(7)).toBeNull();
    expect(GT.normalizeGateras([])).toBeNull();
    const n = GT.normalizeGateras({ open: { p3d_borracha: 'ayer', p3d_otra: 5 }, huellas: -4.7, stages: { p3d_borracha: { cleared: 1, wins: { '3': 2, x: 9 } } }, seen: ['a', 'a', 3], futuro: { algo: 1 } })!;
    expect(n.v).toBe(1);
    // an open gatera stays open even with a broken date; unknown dims are not invented
    expect(n.open.p3d_borracha).toBe(1);
    expect(Object.keys(n.open)).toEqual(['p3d_borracha']);
    expect(n.huellas).toBe(0);
    // wins prove the route: a win of stage 3 means 1..3 were cleared
    expect(n.stages.p3d_borracha).toEqual({ cleared: 3, wins: { '3': 2 } });
    expect(n.seen).toEqual(['a']);
    expect((n as unknown as Record<string, unknown>).futuro).toEqual({ algo: 1 });
    // idempotent
    expect(GT.normalizeGateras(n)).toEqual(n);
  });

  it('afterLoad repairs a slice in a save, and sets a broken one aside instead of dropping it', () => {
    load();
    G.s.ext!.gateras = { open: { p3d_borracha: 123 }, huellas: 6, stages: { p3d_borracha: { cleared: 2, wins: { '1': 1, '2': 1 } } }, seen: [] };
    G.save();
    G.load();
    expect(GT.isOpen(B)).toBe(true);
    expect(GT.huellas()).toBe(6);
    expect(GT.clearedIn(B)).toBe(2);
    G.s.ext!.gateras = 'roto';
    G.save();
    G.load();
    expect(G.s.ext!.gateras).toBeUndefined();
    expect(G.s.ext!.gaterasBroken).toBe('roto');
  });
});

describe('Maneki’s price: max(floor, income / marea × 900 s) for the Borracha', () => {
  it('three income profiles (docs/part-iii/05 §2.2): 5 M/s → floor, 17 M/s ≈ 15 B, 88 M/s ≈ 80 B, 0.9 B/s ≈ 0.8 T', () => {
    expect(GT.priceFor(B, 5e6)).toBe(4.5e9);
    expect(GT.priceFor(B, 1e6)).toBe(4.5e9);
    expect(GT.priceFor(B, 17e6)).toBeCloseTo(15e9, -9);
    expect(GT.priceFor(B, 88e6)).toBeCloseTo(79e9, -9);
    expect(GT.priceFor(B, 0.9e9)).toBeCloseTo(810e9, -10);
    // the Marea Final (×1000 income for 3 min) never prices a gatera: it is divided out
    expect(GT.priceFor(B, 17e9, 1000)).toBe(GT.priceFor(B, 17e6));
    // later boxes cost more minutes (and 25 huellas)
    expect(GT.priceFor('p3d_superheroes', 17e6)).toBeGreaterThan(GT.priceFor(B, 17e6));
    expect(GT.dimDef('p3d_superheroes').price.huellas).toBe(25);
    expect(GT.dimDef(B).price.huellas).toBe(0);
  });

  it(`a real save pays its own income (${H65 ? 'fixture h65-normal' : 'h65-normal no existe todavía: perfil sintético sobre post-finale'})`, () => {
    load(H65 ?? 'post-finale');
    if (!H65) {
      // synthetic (a): ~17 M/s, the profile of a player who just finished H65 playing normally
      (G as unknown as { goldPerSec: number }).goldPerSec = 17e6;
      G.s.momentum = 1;
    }
    const inc = incomePerSec();
    const p = GT.gateraPrice(B).gold;
    expect(p).toBe(GT.priceFor(B, inc));
    if (H65) expect(inc).toBeGreaterThan(5e6);
    expect(p).toBeGreaterThanOrEqual(4.5e9);
    // ~15 minutes of income (or the floor)
    expect(p).toBeLessThanOrEqual(Math.max(4.5e9, inc * 900) * 1.06);
    // and the Marea Final changes nothing
    // the island's income ×1000 for 3 min (what startMareaFinal sets): the price divides it out
    (G.s.ext ??= {}).mareaUntil = Date.now() + 180_000;
    const g0 = (G as unknown as { goldPerSec: number }).goldPerSec;
    (G as unknown as { goldPerSec: number }).goldPerSec = g0 * 1000;
    expect(GT.gateraPrice(B).gold).toBe(p);
    (G as unknown as { goldPerSec: number }).goldPerSec = g0;
    (G.s.ext as Record<string, unknown>).mareaUntil = 0;
  });
});

describe('opening the Borracha and its huellas', () => {
  it('Maneki needs the story (H68) and the gold; then the flag and H68’s feature', () => {
    load();
    expect(GT.buyGatera(B)).toEqual({ ok: false, why: 'story' });
    G.s.missions.active.push('H68');
    G.s.gold = 0;
    expect(GT.buyGatera(B)).toEqual({ ok: false, why: 'gold' });
    const price = GT.gateraPrice(B).gold;
    G.s.gold = price + 123;
    const r = GT.buyGatera(B);
    expect(r).toEqual({ ok: true, gold: price });
    expect(G.s.gold).toBe(123);
    expect(G.has('gatera:p3d_borracha')).toBe(true);
    expect(G.s.counters.feature_p3_gatera_borracha).toBe(1);
    expect(GT.isOpen(B)).toBe(true);
    // never twice
    expect(GT.buyGatera(B)).toEqual({ ok: false, why: 'open' });
    expect(G.s.counters.feature_p3_gatera_borracha).toBe(1);
    expect(GT.stageState(B, 1)).toBe('open');
    expect(GT.stageState(B, 2)).toBe('locked');
    expect(GT.frontierOf(B)).toBe(1);
  });

  it('3 huellas per stage won the first time, none on a repeat; 10 for the boss; 34 in all', () => {
    expect(GT.huellasMax(B)).toBe(34);
    expect(GT.huellasFor(B, 1)).toBe(3);
    expect(GT.huellasFor(B, 5)).toBe(3);
    expect(GT.huellasFor(B, 9)).toBe(10);
    load();
    GT.openGatera(B);
    expect(GT.recordWin(B, 1)).toEqual({ first: true, huellas: 3 });
    expect(GT.recordWin(B, 1)).toEqual({ first: false, huellas: 0 });
    expect(GT.huellas()).toBe(3);
    expect(G.has('won_p3d_borracha_1')).toBe(true);
    expect(GT.stageState(B, 1)).toBe('cleared');
    expect(GT.stageState(B, 2)).toBe('open');
    for (let n = 2; n <= 5; n++) GT.recordWin(B, n);
    expect(GT.huellas()).toBe(15);
    expect(G.has('won_p3d_borracha_5')).toBe(true);
    // B-6…B-9 and El Cadenero are playable now (MECÁNICAS-IMPL): the route goes on one by one, to the boss
    expect(GT.stageState(B, 6)).toBe('open');
    for (let n = 7; n <= 9; n++) expect(GT.stageState(B, n)).toBe('locked');
    expect(GT.frontierOf(B)).toBe(6);
    for (let n = 6; n <= 8; n++) GT.recordWin(B, n);
    expect(GT.huellas()).toBe(24);
    expect(GT.recordWin(B, 9)).toEqual({ first: true, huellas: 10 });
    expect(GT.huellas()).toBe(34);
    expect(GT.frontierOf(B)).toBeNull();
  });
});

describe('the Borracha’s battles: buildSiege with its own namespace', () => {
  it('never touches the Parte I (6 zones, the same frontier)', () => {
    load();
    const f0 = frontier();
    GT.openGatera(B);
    GT.recordWin(B, 1);
    expect(ZONES.length).toBe(6);
    expect(frontier()).toEqual(f0);
  });

  it('B-1…B-9: Mareo on, its palette and style, its id, the Poder floor and the élite band', () => {
    load();
    const sp = (n: number) => GB.buildGateraBattle(B, n, () => undefined);
    for (let n = 1; n <= 9; n++) {
      const s = sp(n);
      expect(s.rules?.mareo).toBeTruthy();
      // the box's power (a hull-scaled cataclysm) only on the élite (02 §6.3); the boss brings its bottles + phases
      if (n === 5) expect(s.rules?.cataclysm).toMatchObject({ id: 'moon', side: 1, by: 'LA BORRACHA', every: 3, power: 0.6 });
      else expect(s.rules?.cataclysm).toBeUndefined();
      expect(s.palette).toEqual(GB.BORRACHA_PALETTE);
      expect(s.enemyStyle).toBe('borracha');
      expect(s.meta?.special).toBe(`p3d_borracha_${n}`);
      // the policy's floor: never below 0.8 × your ship with its best cats (× the ship's weight on the Carta)
      expect(s.meta!.ep).toBeGreaterThanOrEqual(GB.CARTA_POLICY.floor * GB.potentialPower() * (GT.stageOf(B, n)!.powerMul ?? 1) * GB.cartaShipWeight(G.s.ship.active, GT.stageOf(B, n)!.kind) - 1e-6);
      expect(s.enemy.cats.length).toBe(GT.stageOf(B, n)!.crew!.length);
      // the same spec every build (what the estimate sims is what the screen plays)
      expect(plain(sp(n))).toEqual(plain(s));
    }
    expect(sp(2).rules!.mareo!.donas?.n).toBe(1);
    expect(sp(3).rules!.mareo!.botellas).toBeTruthy();
    expect(sp(4).rules!.mareo!.ultSlow?.mul).toBe(0.8);
    expect(sp(5).rules!.mareo!.donas?.n).toBe(3);
    // Oficial Dona wears her own painting; since GATOS-DATOS her species is her own too (r_dona, approved art)
    expect(sp(5).enemy.cats[0].slug).toBe('dona_police_cat');
    expect(sp(5).enemy.cats[0].catId).toBe('r_dona');
    expect(sp(5).intro?.slug).toBe('dona_police_cat');
    // the élite wears the «jefe» band (×1.1 over the same powerMul)
    const ep = (n: number) => GB.gateraPower(B, n);
    expect(ep(5)).toBeGreaterThanOrEqual(ep(3) * 1.1 - 1e-6);
    // El Cadenero: the boss band and its phase 2 («cierra la puerta») at 50 %
    expect(sp(9).rules!.fases!.phases[1]).toMatchObject({ at: { hp: 0.5 }, env: { calm: true }, effects: ['mareoPuerta'] });
    expect(() => GB.buildGateraBattle(B, 10, () => undefined)).toThrow();
  });

  it('the same spec + seed is the same battle (the estimate and the screen agree)', () => {
    load();
    const s = GB.buildGateraBattle(B, 5, () => undefined);
    const a = autoBattle(s, DIFFICULTY.normal, 1077, 30);
    const b = autoBattle(GB.buildGateraBattle(B, 5, () => undefined), DIFFICULTY.normal, 1077, 30);
    expect(b).toEqual(a);
  }, 60_000);

  it('a win pays gold, scrap and the first-win huellas; a loss pays ×0.3 and no huellas', () => {
    load();
    GT.openGatera(B);
    const res = (won: boolean) => ({ won, reason: won ? ('sunk' as const) : ('crew' as const), turns: 5, modulesDestroyed: 3, damageDealt: 100, catsLost: 0, perfect: false });
    const lost = GB.applyGateraResult(B, 1, res(false) as never);
    expect(lost.won).toBe(false);
    expect(lost.huellas).toBe(0);
    expect(GT.stageState(B, 1)).toBe('open');
    const won = GB.applyGateraResult(B, 1, res(true) as never);
    expect(won.first).toBe(true);
    expect(won.huellas).toBe(3);
    expect(won.opened).toBe(2);
    expect(won.gold).toBeGreaterThan(lost.gold);
    const again = GB.applyGateraResult(B, 1, res(true) as never);
    expect(again.first).toBe(false);
    expect(again.huellas).toBe(0);
    // a repeat pays ×0.7 (the Diario del Mar's rule)
    expect(again.gold).toBeLessThan(won.gold);
    expect(GT.huellas()).toBe(3);
  });
});
