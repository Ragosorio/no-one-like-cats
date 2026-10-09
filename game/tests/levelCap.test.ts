/**
 * Niveles 51–100 (docs/part-ii/16-niveles-100.md): the Reino gate (Reino + 5) up to Nv50, then each cat's own cap
 * grows +10 per star from ★2 (★6 → Nv100). Up to Nv50 every number is the original one (old saves keep their gold/s
 * and power until a cat passes Nv50); past it the curves are softer and live in balance cats.beyond_50.
 */
import { beforeEach, describe, expect, it } from 'vitest';
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

const { G, newGame } = await import('../src/state');
const { SAVE_KEY } = await import('../src/core/save');
const { CATS, catDef } = await import('../src/data/content');
const E = await import('../src/state/econ');
const { BAL } = E;
const cats = await import('../src/state/sys/cats');
const { starInfo } = await import('../src/state/ext/collection');
const { formPowMul } = await import('../src/data/rupturas/formas');
const { activeFormId } = await import('../src/state/sys/forms');
const { boutPower, rival } = await import('../src/podio/ladder');
const { Duel } = await import('../src/podio/engine');
const { powersOf } = await import('../src/podio/powers');
const { aiSkill, roleAtk, roleHp, rivalFighter, levelCap: podioLevelCap } = await import('../src/state/sys/podio');
const PB = (await import('../src/data/podio.json')).default;

type R = Parameters<typeof E.catPower>[0];
const RARITIES = BAL.rarities.order as R[];

// the formulas as they were before levels 51–100 (cap 50): the reference for "≤ 50 is identical"
const old = {
  gold: (r: R, l: number, s: number) => BAL.rarities.gold_base_per_s[r] * Math.pow(BAL.cats.gold_per_level, l - 1) * E.starMult(s),
  power: (r: R, l: number, s: number) => BAL.rarities.power_base[r] * Math.pow(BAL.cats.power_per_level, l - 1) * E.starMult(s),
  feed: (l: number, r: R) => Math.ceil(BAL.cats.feed_cost_base * Math.pow(BAL.cats.feed_cost_growth, l - 1) * BAL.rarities.food_mult[r]),
  rivalLevel: (r: R, s: number, p: number) => Math.max(1, Math.min(60, Math.round(1 + Math.log(p / old.power(r, 1, s)) / Math.log(BAL.cats.power_per_level)))),
};

function loadFixture(f: string) {
  const env = readFileSync(new URL(`../test-saves/${f}.json`, import.meta.url), 'utf8');
  mem.clear();
  mem.set(SAVE_KEY, env);
  G.load();
  expect(G.loaded).toBe(true);
  return JSON.parse(env);
}

describe('level cap: Reino gate up to 50, then +10 per star (★6 → 100)', () => {
  it('econ.catLevelCapFor per Reino and stars', () => {
    for (const s of [1, 2, 3, 4, 5, 6]) {
      expect(E.catLevelCapFor(1, s)).toBe(6);
      expect(E.catLevelCapFor(30, s)).toBe(35);
      expect(E.catLevelCapFor(44, s)).toBe(49);
      // Reino 45 already opens 50: from there on the stars decide
      expect(E.catLevelCapFor(45, s)).toBe(50 + 10 * (s - 1));
      expect(E.catLevelCapFor(50, s)).toBe(50 + 10 * (s - 1));
    }
    expect(E.catLevelCapFor(50, 6)).toBe(100);
    expect(E.catLevelCapFor(50, 9)).toBe(100); // never past the max
    expect(E.catLevelMax()).toBe(100);
    // the Reino part alone is unchanged
    expect(E.catLevelCap(50)).toBe(50);
    expect(E.catLevelCap(10)).toBe(15);
  });

  beforeEach(() => newGame());

  it('feeding, feedTo and starInfo use the cat\'s own cap', () => {
    G.s.kl = 50;
    const c = cats.adopt('c_canelo', { free: true }).cat ?? G.s.cats[0];
    c.level = 50;
    c.stars = 1;
    G.s.food = 1e15;
    expect(cats.levelCap(c)).toBe(50);
    expect(cats.feed(c)).toBe('cap');
    expect(cats.levelCapInfo(c)).toMatchObject({ cap: 50, why: 'stars', nextStarCap: 60 });
    c.stars = 2;
    expect(cats.levelCap(c)).toBe(60);
    expect(starInfo(c).levelCap).toBe(60);
    expect(cats.feedTo(c, 99)).toBe(10);
    expect(c.level).toBe(60);
    expect(cats.feed(c)).toBe('cap');
    c.stars = 6;
    expect(cats.levelCapInfo(c)).toMatchObject({ cap: 100, why: 'max', nextStarCap: null });
    cats.feedTo(c, 200);
    expect(c.level).toBe(100);
    expect(cats.feed(c)).toBe('cap');
    // a low Reino: the Reino is the limit whatever the stars
    G.s.kl = 20;
    const d = cats.adopt('r_pimenton', { free: true }).cat!;
    d.stars = 6;
    expect(cats.levelCap(d)).toBe(25);
    expect(cats.levelCapInfo(d).why).toBe('reino');
    expect(cats.reinoLevelCap()).toBe(25);
  });

  it('food is paid bite by bite past 50 exactly like before (4 bites, ceil(cost / 4))', () => {
    G.s.kl = 50;
    const c = cats.adopt('c_canelo', { free: true }).cat ?? G.s.cats[0];
    c.level = 50;
    c.stars = 3;
    G.s.food = 1e15;
    const f0 = G.s.food;
    cats.feedTo(c, 60);
    expect(f0 - G.s.food).toBe(E.feedCostRange(50, 60, catDef(c.species).rarity));
  });
});

describe('curves: ≤ 50 identical, softer and monotonic above', () => {
  it('gold/s, power and food per level are bit-identical to the old formulas up to Nv50', () => {
    for (const r of RARITIES)
      for (let s = 1; s <= 6; s++)
        for (let l = 1; l <= 50; l++) {
          expect(E.catGoldPerSec(r, l, s)).toBe(old.gold(r, l, s));
          expect(E.catPower(r, l, s)).toBe(old.power(r, l, s));
        }
    // feedCost(l) = food from l to l+1: every level that was payable before (1→2 … 49→50)
    for (const r of RARITIES) for (let l = 1; l <= 49; l++) expect(E.feedCost(l, r)).toBe(old.feed(l, r));
  });

  it('every curve keeps growing to 100, slower than before above 50', () => {
    for (const r of RARITIES)
      for (let l = 2; l <= 100; l++) {
        expect(E.catGoldPerSec(r, l, 6)).toBeGreaterThan(E.catGoldPerSec(r, l - 1, 6));
        expect(E.catPower(r, l, 6)).toBeGreaterThan(E.catPower(r, l - 1, 6));
        expect(E.feedCost(l, r)).toBeGreaterThanOrEqual(E.feedCost(l - 1, r));
      }
    const X = BAL.cats.beyond_50;
    expect(X.gold_per_level).toBeLessThan(BAL.cats.gold_per_level);
    expect(X.power_per_level).toBeLessThan(BAL.cats.power_per_level);
    const g = E.catGoldPerSec('divine', 100, 6) / E.catGoldPerSec('divine', 50, 6);
    const p = E.catPower('divine', 100, 6) / E.catPower('divine', 50, 6);
    expect(g).toBeGreaterThan(5);
    expect(g).toBeLessThan(10); // not the 1,661× of the old 1.16 curve
    expect(p).toBeGreaterThan(3);
    expect(p).toBeLessThan(6); // not the 29× of the old 1.07 curve
  });

  it('food past 50: a real effort, a long-term goal — never astronomical', () => {
    const d = (a: number, b: number) => E.feedCostRange(a, b, 'divine');
    // 50→60: about a third of a late-game pantry (~5B) per Divino; 90→100: weeks, not years
    expect(d(50, 60)).toBeGreaterThan(5e8);
    expect(d(50, 60)).toBeLessThan(5e9);
    expect(d(90, 100)).toBeGreaterThan(5e10);
    expect(d(90, 100)).toBeLessThan(1e12);
    expect(d(50, 100)).toBeLessThan(1e12);
    // each 10-level stretch costs more than the one before, but by a bounded factor
    for (const a of [50, 60, 70, 80]) {
      const k = d(a + 10, a + 20) / d(a, a + 10);
      expect(k).toBeGreaterThan(2);
      expect(k).toBeLessThan(5);
    }
    // the whole 1→50 climb stays what it was
    expect(E.feedCostRange(1, 50, 'common')).toBe(Array.from({ length: 49 }, (_, i) => 4 * Math.ceil(old.feed(i + 1, 'common') / 4)).reduce((a, b) => a + b, 0));
  });

  it('catLevelForPower is the inverse of catPower on both sides of 50', () => {
    for (const r of ['common', 'legendary', 'divine'] as R[])
      for (const s of [1, 3, 6])
        for (const l of [1, 10, 37, 49, 50, 51, 64, 80, 99, 100]) expect(E.catLevelForPower(r, s, E.catPower(r, l, s))).toBeCloseTo(l, 6);
  });
});

describe('old saves: same gold/s and power until a cat passes 50', () => {
  for (const f of ['post-finale', 'late-game']) {
    it(`${f}: every cat produces and fights exactly as with the old formulas, and none is over its cap`, () => {
      const raw = loadFixture(f);
      const before = (raw.state ?? raw).cats as { uid: string; level: number; stars: number }[];
      expect(G.s.cats.length).toBeGreaterThan(5);
      for (const c of G.s.cats) {
        const b = before.find((x) => x.uid === c.uid)!;
        expect([c.level, c.stars]).toEqual([b.level, b.stars]); // loading never touches levels
        const r = catDef(c.species).rarity;
        expect(c.level).toBeLessThanOrEqual(50);
        expect(c.level).toBeLessThanOrEqual(cats.levelCap(c));
        expect(E.catGoldPerSec(r, c.level, c.stars)).toBe(old.gold(r, c.level, c.stars));
        expect(cats.catPow(c)).toBe(old.power(r, c.level, c.stars) * formPowMul(c.species, activeFormId(c)));
      }
      expect(G.goldPerSec).toBeGreaterThan(0);
    });
  }
});

describe('Podio ladder past Nv50', () => {
  const ALL_EL = [...new Set(CATS.flatMap((c) => c.elements))];
  const OWNED = new Set(CATS.map((c) => c.id));

  it('rivals keep their old level up to Nv50, then follow the new curve (no 60 clamp, max 100)', () => {
    let lastPow = 0;
    for (let lg = 1; lg <= 30; lg++)
      for (let b = 0; b < PB.ladder.bouts_per_league; b++) {
        const r = rival(lg, b, 4242, ALL_EL, OWNED);
        expect(r.power).toBe(boutPower(lg, b)); // the ladder's power itself didn't change
        expect(r.level).toBeGreaterThanOrEqual(1);
        expect(r.level).toBeLessThanOrEqual(100);
        const was = old.rivalLevel(r.def.rarity, r.stars, r.power);
        if (r.power <= E.catPower(r.def.rarity, 50, r.stars)) expect(r.level).toBe(was);
        else expect(r.level).toBeGreaterThanOrEqual(Math.min(was, 50));
        if (b === 0) expect(r.power).toBeGreaterThan(lastPow * 0.8);
        lastPow = r.power;
      }
    // VACÍO X (league 17): its champion now shows the level a cat needs, past the old 60 wall at VACÍO XII+
    const champ = (lg: number) => E.catLevelForPower('legendary', 6, boutPower(lg, PB.ladder.bouts_per_league - 1));
    expect(champ(17)).toBeGreaterThan(60);
    expect(champ(17)).toBeLessThan(70);
    expect(champ(21)).toBeGreaterThan(95);
  });

  it('the displayed level is continuous in power (no jump at Nv50)', () => {
    for (const r of ['legendary', 'mythic', 'divine'] as R[]) {
      const p50 = E.catPower(r, 50, 6);
      expect(E.catLevelForPower(r, 6, p50 * 0.999)).toBeCloseTo(50, 1);
      expect(E.catLevelForPower(r, 6, p50 * 1.001)).toBeCloseTo(50, 1);
      // ten levels above 50 ≈ one league (×1.32)
      expect(E.catPower(r, 60, 6) / p50).toBeGreaterThan(PB.ladder.league_growth * 0.95);
      expect(E.catPower(r, 60, 6) / p50).toBeLessThan(PB.ladder.league_growth * 1.1);
    }
  });

  it('a ★6 crew that keeps leveling keeps winning: VACÍO X champion at Nv50 vs Nv70 vs Nv100', () => {
    const mine = ['d_bigbang', 'd_milvidas', 'h_zarpa', 'h_valquiria', 'm_raijin'];
    const win = (lv: number, lg: number, bout: number) => {
      let w = 0;
      let n = 0;
      for (const isl of [11, 22, 33]) {
        const r = rival(lg, bout, isl, ALL_EL, OWNED);
        const foe = rivalFighter(r);
        for (const sp of mine) {
          const def = catDef(sp);
          const P = E.catPower(def.rarity, lv, 6);
          for (const seed of [1, 2]) {
            const me = { side: 0 as const, species: sp, name: def.name, owner: 'TÚ', slug: def.art.slug, elements: [...def.elements], rarity: def.rarity, role: def.role, level: lv, stars: 6, podioLvl: PB.levels.max, power: P * roleAtk(def.role), hp: P * PB.stats.hp_per_power * roleHp(def.role), powers: powersOf(sp), trait: def.trait, mutation: null };
            const d = new Duel(me, foe, seed * 977 + isl, aiSkill(lg, r.champion));
            for (let i = 0; i < 600 && !d.over; i++) d.step();
            n++;
            if (d.winner === 0) w++;
          }
        }
      }
      return w / n;
    };
    const CH = PB.ladder.bouts_per_league - 1;
    const at50 = win(50, 17, CH);
    const at70 = win(70, 17, CH);
    const at100 = win(100, 17, CH);
    expect(at50).toBeLessThan(0.35);
    expect(at70).toBeGreaterThan(at50);
    expect(at100).toBeGreaterThan(0.85);
    // and the next walls move with the levels: VACÍO XII's champion needs ~Nv80, VACÍO XIV's ~Nv100
    expect(win(60, 19, CH)).toBeLessThan(0.3);
    expect(win(100, 19, CH)).toBeGreaterThan(0.85);
  }, 60_000);

  it('the podio level cap (separate XP levels) still tops out at its own max', () => {
    newGame();
    G.s.kl = 50;
    const c = cats.adopt('c_canelo', { free: true }).cat ?? G.s.cats[0];
    for (const [lv, st] of [[50, 1], [60, 2], [100, 6]] as const) {
      c.level = lv;
      c.stars = st;
      expect(podioLevelCap(c)).toBeLessThanOrEqual(PB.levels.max);
    }
    expect(podioLevelCap(c)).toBe(PB.levels.max);
  });
});
