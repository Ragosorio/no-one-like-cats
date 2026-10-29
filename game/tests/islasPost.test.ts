/**
 * DESPUÉS DE LA PARTE III — las islas nuevas del MISMO archipiélago (data/postp3/islas.json; ⚠️ spoilers in docs/post-p3).
 *
 *   · the data: expansions 13–17 appended after Part I's 12 (EXPANSIONS[n - 1] stays true), each with its dimension,
 *     decor, secret and a late-game price that climbs
 *   · the map: the old rings plan bit-identical with or without the new one (tiles, plots, pens, secrets, decor, home,
 *     lagoon plates); the new islands keep open sea between them and everything else
 *   · before the gate: invisible (look 'hidden'), unbuyable, out of every list and of the «sin casa» advice
 *   · after the gate: visible, buyable like any expansion, its land becomes yours and holds the room for ~120+ cats
 *   · «sin casa»: with no room left on the island, the advice points at the first post island
 *   · old saves: nothing moves — their expansions, habitats (tiles and regions) and owned land are exactly the same
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';

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
const { EXPANSIONS, catDef, CATS } = await import('../src/data/content');
// Part I's content.json as it is on disk (the imported module object is the merged one: mergeContent appends in place)
const RAW = JSON.parse(readFileSync(new URL('../src/data/content.json', import.meta.url), 'utf8')) as { expansions: { id: string }[] };
const ISLAS = (await import('../src/data/postp3/islas.json')).default as { expansions: { n: number; id: string; biome: string; balance: { kl: number; cost: number } }[] };
const I = await import('../src/state/sys/island');
const { regionLook } = await import('../src/state/ext/island');
const { homeFixFor } = await import('../src/state/ext/islandM2');
const { nextExpansion } = await import('../src/state/sys/shop');
const { secretInfo, secretReward } = await import('../src/state/sys/secrets');
const { postP3Unlocked } = await import('../src/state/sys/postp3');
const { markBeat } = await import('../src/state/ext/story');
const { CONTINUARA_BEAT } = await import('../src/state/sys/gaterasWorld');
const { buildIslandPlan, islandPlan } = await import('../src/island/layout');
const { islandRegions, key, GRID_POST } = await import('../src/island/archipelago');
const { buildPlates } = await import('../src/island/dimensions/plates');
const { dimOf, DIMS } = await import('../src/island/dimensions/defs');
const { HAB_SIZE, nearestHabitatSpot, ownedRegions, regionRoom, roomForHabitats, staticBlocked } = await import('../src/island/placement');
const { BAL, habitatTier } = await import('../src/state/econ');

const POST = [13, 14, 15, 16, 17];
const postIds = () => POST.map((n) => EXPANSIONS[n - 1].id);
const FIX = readdirSync(new URL('../test-saves/', import.meta.url)).filter((f) => f.endsWith('.json'));
const raw = (f: string) => readFileSync(new URL(`../test-saves/${f}`, import.meta.url), 'utf8');
function load(name: string) {
  mem.clear();
  mem.set(SAVE_KEY, raw(`${name}.json`));
  G.load();
  if (!G.loaded) throw new Error(`${name} no carga`);
}
/** the Parte III over in this save (the director writes «Continuará» at the end of H96) */
const finish = () => markBeat(CONTINUARA_BEAT);
const finishTimers = () => {
  for (let i = 0; i < 6 && G.s.timers.length; i++) G.tick(1e9);
};
/** a late-game save with the Parte III over and the whole old archipelago cleared */
function lateGame(open = true) {
  load('h93-final');
  if (open) finish();
  for (let n = 1; n <= 12; n++) {
    if (!G.s.expansions.bought.includes(n)) G.s.expansions.bought.push(n);
    if (!G.s.expansions.cleared.includes(n)) G.s.expansions.cleared.push(n);
  }
  G.s.kl = 50;
  G.s.gold = 52.2e12;
}

// ------------------------------------------------------------------ data
describe('the data (data/postp3/islas.json)', () => {
  it('five islands appended after the twelve: n = index + 1, new ids, the post-Parte III gate, Part I untouched', () => {
    expect(RAW.expansions.length).toBe(12);
    expect(EXPANSIONS.length).toBe(17);
    EXPANSIONS.forEach((e, i) => expect(e.n, e.id).toBe(i + 1));
    expect(new Set(EXPANSIONS.map((e) => e.id)).size).toBe(17);
    expect(ISLAS.expansions.map((e) => e.n)).toEqual(POST);
    for (const n of POST) expect(EXPANSIONS[n - 1].gate, String(n)).toBe('postp3');
    for (let n = 1; n <= 12; n++) expect(EXPANSIONS[n - 1].gate, String(n)).toBeUndefined();
    // region ids never collide with anything a habitat could already carry
    for (const id of postIds()) expect(RAW.expansions.some((e) => e.id === id)).toBe(false);
  });
  it('each one has its own dimension, decor, a secret with a reward, and a price that climbs past the old ones', () => {
    const last = EXPANSIONS[11].balance;
    let prev = last.cost;
    for (const n of POST) {
      const e = EXPANSIONS[n - 1];
      expect(dimOf(e.biome).id, e.id).toBe(e.biome);
      expect(Object.keys(DIMS)).toContain(e.biome);
      const s = secretInfo(n);
      expect(s.hint.length, e.id).toBeGreaterThan(5);
      expect(secretReward(n)?.gems, e.id).toBeGreaterThan(0);
      expect(e.balance.cost, e.id).toBeGreaterThan(prev);
      expect(e.balance.kl, e.id).toBeGreaterThanOrEqual(last.kl);
      expect(e.balance.kl, e.id).toBeLessThanOrEqual(BAL.kingdom.level_cap);
      expect(e.balance.farm_plots, e.id).toBeGreaterThanOrEqual(1);
      prev = e.balance.cost;
    }
    // a normal late-game balance (52 T) buys the first ones; the last one is a goal
    expect(EXPANSIONS[12].balance.cost).toBeLessThan(52.2e12 / 10);
    expect(EXPANSIONS[16].balance.cost).toBeGreaterThan(20e12);
  });
});

// ------------------------------------------------------------------ the map
describe('the map: the same archipelago, one ring further out', () => {
  const all = islandRegions();
  const old = all.filter((r) => (r.n ?? 0) <= 12);
  const A = buildIslandPlan(all);
  const B = buildIslandPlan(old);
  it('the old rings plan bit-identical with or without the new islands (tiles, plots, pens, secrets, decor, home)', () => {
    expect(islandPlan().tiles.size).toBe(A.tiles.size);
    for (const [k, t] of B.tiles) expect(A.tiles.get(k)?.region, k).toBe(t.region);
    const oldIds = new Set(old.map((r) => r.id));
    for (const [k, t] of A.tiles) if (oldIds.has(t.region)) expect(B.tiles.has(k), k).toBe(true);
    const strip = (p: unknown) => JSON.stringify(p, (k, v) => (k === 'def' ? undefined : v));
    for (const [id, p] of B.plans) expect(strip(A.plans.get(id)), id).toBe(strip(p));
    expect(JSON.stringify(A.home)).toBe(JSON.stringify(B.home));
  });
  it('their floating plates (rock, lagoon ring) are the same too: the new islands sit in open sea', () => {
    const PA = buildPlates(A.tiles);
    const PB = buildPlates(B.tiles);
    for (const [id, p] of PB) expect([...PA.get(id)!.has].sort(), id).toEqual([...p.has].sort());
  });
  it('each new island is one blob of 110+ tiles inside the board, ≥4 tiles of sea from any other island', () => {
    const tiles = [...A.tiles.values()];
    for (const id of postIds()) {
      const mine = tiles.filter((t) => t.region === id);
      expect(mine.length, id).toBeGreaterThanOrEqual(110);
      let gap = Infinity;
      let near = '';
      for (const t of mine) {
        expect(t.gx >= 1 && t.gy >= 1 && t.gx < GRID_POST - 1 && t.gy < GRID_POST - 1, id).toBe(true);
        for (const o of tiles) {
          if (o.region === id) continue;
          const d = Math.max(Math.abs(o.gx - t.gx), Math.abs(o.gy - t.gy));
          if (d < gap) [gap, near] = [d, o.region];
        }
      }
      expect(gap, `${id} vs ${near}`).toBeGreaterThanOrEqual(4);
    }
  });
  it('nothing fixed of the old map lands on the new land (and the new landmarks stay on their own island)', () => {
    const stat = staticBlocked();
    const plan = islandPlan();
    for (const id of postIds()) {
      const p = plan.plans.get(id)!;
      expect(p.secret, id).toBeTruthy();
      expect(p.farms.length, id).toBe(EXPANSIONS.find((e) => e.id === id)!.balance.farm_plots);
      for (let y = p.secret!.gy; y < p.secret!.gy + 2; y++) for (let x = p.secret!.gx; x < p.secret!.gx + 2; x++) expect(plan.tiles.get(key(x, y))?.region).toBe(id);
    }
    for (const k of stat) {
      const t = plan.tiles.get(k);
      if (t && postIds().includes(t.region)) {
        const [x, y] = k.split(',').map(Number);
        const p = plan.plans.get(t.region)!;
        const inSecret = p.secret && x >= p.secret.gx && x < p.secret.gx + 2 && y >= p.secret.gy && y < p.secret.gy + 2;
        expect(inSecret, k).toBe(true);
      }
    }
  });
});

// ------------------------------------------------------------------ the capacity math
describe('room for the cats that keep coming', () => {
  it('the five islands hold 45+ new habitats, 12+ of them full-size (5×5, tier 7+): 120+ cats at tier 8–9', () => {
    let small = 0;
    let big = 0;
    for (const id of postIds()) {
      const s = regionRoom(id);
      const b = regionRoom(id, 5);
      expect(s, id).toBeGreaterThanOrEqual(8);
      expect(b, id).toBeGreaterThanOrEqual(2);
      small += s;
      big += b;
    }
    expect(HAB_SIZE).toBe(3);
    expect(small).toBeGreaterThanOrEqual(45);
    expect(big).toBeGreaterThanOrEqual(12);
    // the late game houses ~10–12 per big yard (tier 8 / tier 9)
    expect(big * habitatTier(8).capacity).toBeGreaterThanOrEqual(120);
    // every island gives more room than any of the old ones
    const oldMax = Math.max(...EXPANSIONS.slice(0, 12).map((e) => regionRoom(e.id)));
    for (const id of postIds()) expect(regionRoom(id), id).toBeGreaterThanOrEqual(oldMax);
  });
});

// ------------------------------------------------------------------ before the gate
describe('before the Parte III is over: they do not exist', () => {
  it('hidden, unbuyable, not owned, out of the lists — with the gold and the Reino to buy them', () => {
    lateGame(false);
    expect(postP3Unlocked()).toBe(false);
    const room = roomForHabitats();
    for (const n of POST) {
      const e = EXPANSIONS[n - 1];
      expect(I.expansionHidden(n), e.id).toBe(true);
      expect(I.expansionState(n), e.id).toBe('locked');
      expect(regionLook(e.id), e.id).toBe('hidden');
      expect(I.buyExpansion(n), e.id).toBe(false);
      expect(ownedRegions().has(e.id)).toBe(false);
    }
    expect(I.visibleExpansions().map((e) => e.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(nextExpansion()).toBeNull();
    expect(G.s.expansions.bought.some((n) => n > 12)).toBe(false);
    expect(G.s.gold).toBe(52.2e12);
    expect(roomForHabitats()).toBe(room);
  });
  it('the «sin casa» advice never names them, never says «abre en Reino …» about them', () => {
    lateGame(false);
    const cat = homelessCatWithNoRoom();
    const fix = homeFixFor(cat);
    expect(fix.kind).toBe('wait');
    const text = JSON.stringify(fix);
    for (const n of POST) expect(text).not.toContain(EXPANSIONS[n - 1].name);
  });
  it('a fresh game and every old fixture: all five hidden', () => {
    for (const f of FIX) {
      load(f.replace(/\.json$/, ''));
      if (postP3Unlocked()) continue;
      for (const n of POST) expect(I.expansionHidden(n), `${f} ${n}`).toBe(true);
      expect(nextExpansion()?.e.n ?? 0, f).toBeLessThanOrEqual(12);
    }
  });
});

// ------------------------------------------------------------------ after the gate
describe('after the Parte III: new land on the same map', () => {
  it('they appear; with the Reino they can be bought like any expansion; the cleared land is yours and gives room', () => {
    lateGame(true);
    expect(postP3Unlocked()).toBe(true);
    for (const n of POST) {
      expect(I.expansionHidden(n)).toBe(false);
      expect(I.expansionState(n)).toBe('available');
      expect(regionLook(EXPANSIONS[n - 1].id)).toBe('available');
    }
    expect(I.visibleExpansions().length).toBe(17);
    expect(nextExpansion()?.e.n).toBe(13);
    const before = roomForHabitats();
    const builders = I.builders();
    const e = EXPANSIONS[12];
    const gold = G.s.gold;
    expect(I.buyExpansion(13)).toBe(true);
    expect(G.s.gold).toBe(gold - e.balance.cost);
    expect(I.expansionState(13)).toBe('clearing');
    expect(regionLook(e.id)).toBe('clearing');
    finishTimers();
    expect(I.expansionState(13)).toBe('cleared');
    expect(regionLook(e.id)).toBe('open');
    expect(ownedRegions().has(e.id)).toBe(true);
    expect(I.regionsUnlocked()).toContain(e.id);
    expect(roomForHabitats()).toBeGreaterThanOrEqual(before + regionRoom(e.id) - 1);
    expect(I.builders()).toBe(builders + 1);
    // its fishing pen exists, and a habitat can be built on the new island
    expect(G.s.farms.some((f) => f.region === e.id)).toBe(true);
    const p = islandPlan().plans.get(e.id)!;
    const h = I.buildHabitat('fire', { gx: Math.round(p.center.gx) - 1, gy: Math.round(p.center.gy) - 1 }) ?? I.buildHabitat('fire', nearestHabitatSpot(p.center.gx, p.center.gy) ?? undefined);
    expect(h?.region).toBe(e.id);
  });
  it('the gate closing again (a story replay) never hides land you paid for', () => {
    lateGame(true);
    expect(I.buyExpansion(13)).toBe(true);
    finishTimers();
    G.s.beatsSeen = G.s.beatsSeen.filter((b) => b !== CONTINUARA_BEAT);
    G.s.missions.done = G.s.missions.done.filter((m) => !/^H9[6-9]$/.test(m));
    expect(postP3Unlocked()).toBe(false);
    expect(I.expansionHidden(13)).toBe(false);
    expect(regionLook(EXPANSIONS[12].id)).toBe('open');
    expect(ownedRegions().has(EXPANSIONS[12].id)).toBe(true);
    for (const n of [14, 15, 16, 17]) expect(I.expansionHidden(n)).toBe(true);
  });
  it('a cleared post island and a habitat on it survive a save and a reload', () => {
    lateGame(true);
    expect(I.buyExpansion(13)).toBe(true);
    finishTimers();
    const id = EXPANSIONS[12].id;
    const p = islandPlan().plans.get(id)!;
    const spot = nearestHabitatSpot(p.center.gx, p.center.gy)!;
    expect(spot.region).toBe(id);
    const h = I.buildHabitat('fire', spot)!;
    finishTimers();
    G.save();
    G.load();
    const h2 = G.s.habitats.find((x) => x.id === h.id)!;
    expect(h2).toBeTruthy();
    expect([h2.gx, h2.gy, h2.region]).toEqual([h.gx, h.gy, id]);
    expect(G.s.expansions.cleared).toContain(13);
  });
});

// ------------------------------------------------------------------ «sin casa»
/** a homeless cat of an element with no habitat yet, on an island with no room left at all */
function homelessCatWithNoRoom() {
  // fill every free spot of the land you own with a 3×3 habitat (the shape doesn't matter, only that nothing fits)
  for (let guard = 0; guard < 400 && roomForHabitats() > 0; guard++) {
    const s = nearestHabitatSpot();
    if (!s) break;
    G.s.habitats.push({ id: G.uid('h'), element: 'fire', tier: 1, region: s.region, plot: -1, gx: s.gx, gy: s.gy, buffer: 0, cats: [], busy: false });
  }
  expect(roomForHabitats()).toBe(0);
  const used = new Set(G.s.habitats.map((h) => h.element));
  const def = CATS.find((c) => c.elements.length === 1 && !used.has(c.elements[0]) && G.s.elements.includes(c.elements[0]) && !c.secret);
  const el = def?.elements[0] ?? 'gravity';
  const species = def?.id ?? CATS.find((c) => catDef(c.id).elements.includes(el))!.id;
  const cat = { uid: G.uid('c'), species, level: 1, xp: 0, stars: 0, habitat: null } as unknown as (typeof G.s.cats)[number];
  G.s.cats.push(cat);
  return cat;
}
describe('«sin casa» points at the new land', () => {
  it('no room anywhere and nothing to upgrade: the advice is the first post island, with its price', () => {
    lateGame(true);
    const cat = homelessCatWithNoRoom();
    const fix = homeFixFor(cat);
    expect(fix.kind).toBe('expand');
    if (fix.kind !== 'expand') return;
    expect(fix.n).toBe(13);
    expect(fix.cost).toBe(EXPANSIONS[12].balance.cost);
    expect(fix.affordable).toBe(true);
  });
  it('while it is being cleared it says so; once cleared (with room again) it says build', () => {
    lateGame(true);
    expect(I.buyExpansion(13)).toBe(true);
    const cat = homelessCatWithNoRoom();
    const f1 = homeFixFor(cat);
    expect(f1.kind).toBe('wait');
    if (f1.kind === 'wait') expect(f1.text).toContain(EXPANSIONS[12].name);
    finishTimers();
    const f2 = homeFixFor(cat);
    expect(f2.kind).toBe('build');
  });
  it('with 13 bought and cleared and the land full again, it moves on to 14', () => {
    lateGame(true);
    G.s.expansions.bought.push(13);
    G.s.expansions.cleared.push(13);
    const cat = homelessCatWithNoRoom();
    const fix = homeFixFor(cat);
    expect(fix.kind === 'expand' && fix.n).toBe(14);
  });
});

// ------------------------------------------------------------------ old saves
describe('old saves: nothing moves', () => {
  it('every fixture loads with the same expansions, the same habitats on the same tiles, on old land only', () => {
    const oldIds = new Set(EXPANSIONS.slice(0, 12).map((e) => e.id).concat('home'));
    for (const f of FIX) {
      const before = JSON.parse(raw(f));
      const st = (before.state ?? before) as { v?: number; expansions?: { bought: number[]; cleared: number[] }; habitats?: { id: string; gx?: number; gy?: number; region: string }[] };
      load(f.replace(/\.json$/, ''));
      expect(G.s.expansions.bought, f).toEqual(st.expansions?.bought ?? []);
      expect(G.s.expansions.cleared, f).toEqual(st.expansions?.cleared ?? []);
      for (const h of G.s.habitats) {
        expect(oldIds.has(h.region), `${f} ${h.id} ${h.region}`).toBe(true);
        const t = islandPlan().tiles.get(key(h.gx, h.gy));
        expect(t && oldIds.has(t.region), `${f} ${h.id}`).toBe(true);
      }
      // a v3 save already had its habitats on tiles: they stay exactly there
      if ((st.v ?? 0) >= 3)
        for (const h0 of st.habitats ?? []) {
          const h = G.s.habitats.find((x) => x.id === h0.id);
          expect(h, `${f} ${h0.id}`).toBeTruthy();
          if (Number.isFinite(h0.gx)) expect([h!.gx, h!.gy, h!.region], `${f} ${h0.id}`).toEqual([h0.gx, h0.gy, h0.region]);
        }
      for (const n of POST) expect(ownedRegions().has(EXPANSIONS[n - 1].id), f).toBe(false);
    }
  });
});
