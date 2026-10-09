/**
 * Orbes con oro (2026-10, docs/part-ii/06-economia-orbes.md): precio suave y con tope.
 * Antes: 33.7 min de ingreso × 2.01 por paquete, por especie y para siempre.
 * Ahora: minutos que bajan despacio con el ingreso (oro ∝ ingreso^0.85, entre 3 y 30 min) × calor (+15%/paquete, tope ×3,
 * se enfría 1 paquete por hora real). Las partidas viejas cargan sin que cambie ni un recurso guardado.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

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
const shop = await import('../src/state/sys/shop');
const { ORB_PACK, ORB_HEAT_MAX, ORB_HEAT_MAX_MULT, ORB_PACK_MIN_CEIL, ORB_PACK_MIN_FLOOR, buyOrbsGold, incomePerSec, orbGoldPrice, orbHeat, orbHeatMult, orbOffer, orbPackMinutes, orbPackPrice, orbSpecies, shopState } = shop;

type Fixture = 'post-boss1' | 'late-game' | 'post-story';
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const raw = (f: Fixture) => JSON.parse(readFileSync(new URL(`../test-saves/${f}.json`, import.meta.url), 'utf8'));
/** put a fixture in the save slot and load it the way the game does (migrations, normalize, patches) */
function loadFixture(f: Fixture, tweak?: (state: Record<string, any>) => void) {
  const env = raw(f);
  tweak?.(env.state);
  mem.clear();
  mem.set(SAVE_KEY, JSON.stringify(env));
  G.load();
  expect(G.loaded).toBe(true);
  return env.state as Record<string, any>;
}
/** the old curve (before 2026-10): Σ_{i<5} income·60·5·1.15^(k+i), k = orbs already bought with gold */
const oldPrice = (income: number, k: number) => {
  let sum = 0;
  for (let i = 0; i < ORB_PACK; i++) sum += income * 60 * 5 * Math.pow(1.15, k + i);
  return shop.nicePrice(Math.max(60, sum));
};
const minutes = (price: number, income: number) => price / (income * 60);
const RESOURCES = ['gold', 'gems', 'food', 'purr', 'prisma', 'scrap', 'blueprint', 'crystals', 'orbs', 'kl', 'klXp'] as const;

afterEach(() => vi.useRealTimers());

describe('orb price on real saves (early / mid / late)', () => {
  const cases: [Fixture, number, number][] = [
    // fixture, minutes of income for a cold pack (expected), max ratio new/old for the first pack
    ['post-boss1', 30, 1.2],
    ['late-game', 15, 0.5],
    ['post-story', 13.2, 0.5],
  ];
  for (const [f, mins, ratio] of cases) {
    it(`${f}: first pack ≈ ${mins} min of income, 5th pack in a row ×1.6`, () => {
      loadFixture(f);
      const inc = incomePerSec();
      const sp = orbSpecies()[0];
      const first = orbGoldPrice(sp);
      expect(minutes(first, inc)).toBeGreaterThan(mins * 0.9);
      expect(minutes(first, inc)).toBeLessThan(mins * 1.1);
      expect(first / oldPrice(inc, 0)).toBeLessThanOrEqual(ratio);
      // the 5th pack bought back-to-back (heat 4)
      expect(orbPackPrice(inc, 4) / first).toBeGreaterThan(1.5);
      expect(orbPackPrice(inc, 4) / first).toBeLessThan(1.7);
      // always far below the old 5th pack (×16.4)
      expect(orbPackPrice(inc, 4)).toBeLessThan(oldPrice(inc, 20) / 5);
    });
  }

  it('early game stays within ±20% of the old first-pack price', () => {
    loadFixture('post-boss1');
    const inc = incomePerSec();
    const r = orbGoldPrice(orbSpecies()[0]) / oldPrice(inc, 0);
    expect(r).toBeGreaterThan(0.8);
    expect(r).toBeLessThan(1.2);
  });

  it('a 1.9 B-gold island making ~1 M/s: the first pack is ~6 min of income (it was ~34)', () => {
    const p = orbPackPrice(1e6, 0);
    expect(minutes(p, 1e6)).toBeGreaterThan(5);
    expect(minutes(p, 1e6)).toBeLessThan(7);
    expect(p).toBeLessThan(1.9e9 / 4); // the wallet buys several packs, not one
    expect(oldPrice(1e6, 0)).toBeGreaterThan(1.9e9); // before: more than the whole wallet
  });
});

describe('curve shape', () => {
  const incomes = [1, 3, 6, 9, 20, 60, 150, 584, 1405, 4588, 9200, 5e4, 1e6, 25e6, 1e9];
  it('gold price never goes down when income goes up; minutes of income never go up', () => {
    for (const h of [0, 2, 4, 8, ORB_HEAT_MAX]) {
      for (let i = 1; i < incomes.length; i++) {
        expect(orbPackPrice(incomes[i], h)).toBeGreaterThanOrEqual(orbPackPrice(incomes[i - 1], h));
        expect(orbPackMinutes(incomes[i])).toBeLessThanOrEqual(orbPackMinutes(incomes[i - 1]));
      }
    }
  });
  it('price never goes down with heat, and heat is capped at ×3', () => {
    for (const inc of incomes) {
      let prev = 0;
      for (let h = 0; h <= 40; h++) {
        const p = orbPackPrice(inc, h);
        expect(p).toBeGreaterThanOrEqual(prev);
        prev = p;
      }
      expect(orbPackPrice(inc, 1000)).toBe(orbPackPrice(inc, ORB_HEAT_MAX));
      expect(orbPackPrice(inc, 1000)).toBeLessThanOrEqual(orbPackPrice(inc, 0) * ORB_HEAT_MAX_MULT * 1.06); // nicePrice rounding
    }
    expect(orbHeatMult(0)).toBe(1);
    expect(orbHeatMult(4)).toBeCloseTo(1.6);
    expect(orbHeatMult(1e9)).toBe(ORB_HEAT_MAX_MULT);
    expect(orbHeatMult(-5)).toBe(1);
  });
  it('a cold pack stays between the floor and the ceiling in minutes of income', () => {
    for (const inc of incomes) {
      const m = orbPackMinutes(inc);
      expect(m).toBeLessThanOrEqual(ORB_PACK_MIN_CEIL);
      expect(m).toBeGreaterThanOrEqual(ORB_PACK_MIN_FLOOR);
    }
    expect(orbPackMinutes(0)).toBe(ORB_PACK_MIN_CEIL);
    expect(orbPackMinutes(1e12)).toBe(ORB_PACK_MIN_FLOOR);
    expect(orbPackPrice(0, 0)).toBe(60); // never free
  });
});

describe('buying: heat rises, caps and cools with real time', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
    loadFixture('late-game');
    G.s.gold = 1e15;
  });
  it('each pack costs exactly what the shop shows and adds 5 orbs', () => {
    const sp = orbSpecies()[0];
    const cold = orbOffer(sp).gold;
    for (let n = 0; n < 5; n++) {
      const shown = orbOffer(sp).gold;
      const gold = G.s.gold;
      const orbs = G.s.orbs[sp] ?? 0;
      expect(buyOrbsGold(sp)).toBe(ORB_PACK);
      expect(gold - G.s.gold).toBe(shown);
      expect(G.s.orbs[sp]).toBe(orbs + ORB_PACK);
      expect(shown).toBe(orbPackPrice(incomePerSec(), n));
    }
    expect(orbHeat(sp)).toBe(5);
    expect(orbOffer(sp).gold / cold).toBeCloseTo(1.75, 1);
    // other species are not affected
    const other = orbSpecies().find((s) => s !== sp)!;
    expect(orbHeat(other)).toBe(0);
  });
  it('a long spree tops out at ×3 and a night away cools it completely', () => {
    const sp = orbSpecies()[0];
    const cold = orbGoldPrice(sp);
    for (let n = 0; n < 40; n++) buyOrbsGold(sp);
    expect(orbHeat(sp)).toBeCloseTo(ORB_HEAT_MAX);
    const hot = orbGoldPrice(sp);
    expect(hot / cold).toBeLessThanOrEqual(ORB_HEAT_MAX_MULT * 1.06);
    vi.setSystemTime(Date.now() + 3 * 3_600_000);
    expect(orbHeat(sp)).toBeCloseTo(ORB_HEAT_MAX - 3);
    expect(orbGoldPrice(sp)).toBeLessThan(hot);
    vi.setSystemTime(Date.now() + 12 * 3_600_000);
    expect(orbHeat(sp)).toBe(0);
    expect(orbGoldPrice(sp)).toBe(cold);
  });
  it('a clock that jumps backwards never makes heat grow or go negative', () => {
    const sp = orbSpecies()[0];
    buyOrbsGold(sp);
    vi.setSystemTime(Date.now() - 48 * 3_600_000);
    expect(orbHeat(sp)).toBe(1);
  });
  it('not enough gold: nothing changes', () => {
    const sp = orbSpecies()[0];
    G.s.gold = 10;
    orbOffer(sp);
    const before = clone(G.s);
    expect(buyOrbsGold(sp)).toBe(0);
    expect(G.s).toEqual(before);
  });
});

describe('old saves load unchanged', () => {
  for (const f of ['post-boss1', 'late-game', 'post-story'] as Fixture[]) {
    it(`${f}: no stored resource goes down, orbs and cats identical, looking at prices writes nothing`, () => {
      // an old save that already bought lots of orbs with gold under the old curve
      const st = loadFixture(f, (s) => {
        s.ext ??= {};
        s.ext.shop = { seen: ['x'], goldOrbs: { c_canelo: 40, c_brote: 15 }, xpGiven: [], receipts: 7 };
      });
      for (const k of RESOURCES) {
        const a = st[k];
        const b = (G.s as Record<string, any>)[k];
        if (typeof a === 'number') expect(b).toBeGreaterThanOrEqual(a); // patches may give (refunds), never take
        else expect(b).toEqual(a);
      }
      expect(G.s.orbs).toEqual(st.orbs);
      expect(G.s.cats.map((c) => [c.uid, c.species, c.level, c.stars])).toEqual(st.cats.map((c: any) => [c.uid, c.species, c.level, c.stars]));
      expect(shopState().goldOrbs).toEqual({ c_canelo: 40, c_brote: 15 });
      expect(shopState().receipts).toBe(7);
      // the old counter no longer makes the price explode: every species starts cold
      for (const sp of orbSpecies()) orbOffer(sp); // lazy defaults of other systems (ext.collection…) settle first
      const snap = clone(G.s);
      const inc = incomePerSec();
      for (const sp of orbSpecies()) {
        expect(orbOffer(sp).gold).toBe(orbPackPrice(inc, 0));
        expect(orbOffer(sp).gold).toBeLessThanOrEqual(oldPrice(inc, shopState().goldOrbs[sp] ?? 0) * 1.2);
      }
      expect(G.s).toEqual(snap);
    });
  }
});
