/**
 * Parte III · EL ESQUEMA DE NODOS DE LA CARTA (docs/part-iii/mecanicas-v2/03-plan-implementacion.md §1.3–1.4).
 *
 *   1. the line (the Borracha) answers EXACTLY as the old linear model, for every cleared count 0–9, open or not
 *   2. a non-line shape (shelf / bracket / tour): winning a later node first never marks the earlier ones, on reload too
 *   3. the normalizer is idempotent; the additive fields are never created on load; a broken section is set aside
 *   4. migration: every fixture (Part I / II / h65) loads unchanged, and a v1 slice with B-1…B-5 won (written by the
 *      real flows) reads byte-for-byte the same after save → reload
 *   5. detours / activities / encounters: their own wins, their own huellas, their own flag
 *   6. Maneki's price follows the PEAK income: emptying habitats never lowers it
 */
import { afterEach, describe, expect, it } from 'vitest';
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
const GT = await import('../src/state/sys/gateras');
const GB = await import('../src/state/sys/gaterasBattles');
const { incomePerSec } = await import('../src/state/sys/shop');
type DimId = import('../src/state/sys/gateras').DimId;
type GateraNodeDef = import('../src/state/sys/gateras').GateraNodeDef;
type BattleResult = import('../src/scenes/BattleScene').BattleResult;

const ALL_FIXTURES = readdirSync(new URL('../test-saves/', import.meta.url)).filter((f) => f.endsWith('.json'));
/** the Part I / II / h65 fixtures (the ones that never had a Parte III slice; h69-acto1 is built at the Acto I: tests/acto1.test.ts) */
const FIXTURES = ALL_FIXTURES.filter((f) => !readFileSync(new URL(`../test-saves/${f}`, import.meta.url), 'utf8').includes('"gateras"'));
const raw = (f: string) => readFileSync(new URL(`../test-saves/${f}`, import.meta.url), 'utf8');
function load(f = 'h65-normal.json') {
  mem.clear();
  mem.set(SAVE_KEY, raw(f));
  G.load();
  expect(G.loaded).toBe(true);
}
function reload() {
  G.save();
  G.load();
  expect(G.loaded).toBe(true);
}
const B = 'p3d_borracha' as const;

/** the linear model exactly as it was before the nodes (gateras.ts, ronda 3) — the reference for the equivalence */
function legacyStageState(dim: DimId, n: number): 'cleared' | 'open' | 'locked' {
  const def = GT.stageOf(dim, n);
  const c = GT.clearedIn(dim);
  if (n <= c) return 'cleared';
  if (!def?.playable || !GT.isOpen(dim)) return 'locked';
  return n === c + 1 ? 'open' : 'locked';
}

/** a test shape installed on a dimension in memory (restored after each test) */
const restore: (() => void)[] = [];
function installShape(dim: DimId, shape: 'shelf' | 'bracket' | 'tour' | 'line', nodes: GateraNodeDef[]) {
  const d = GT.dimDef(dim);
  const before = { shape: d.shape, nodes: d.nodes };
  d.shape = shape;
  d.nodes = nodes;
  restore.push(() => {
    d.shape = before.shape;
    d.nodes = before.nodes;
    if (before.shape === undefined) delete d.shape;
    if (before.nodes === undefined) delete d.nodes;
  });
}
afterEach(() => {
  while (restore.length) restore.pop()!();
});
const node = (id: string, kind: GateraNodeDef['kind'], requires: string[] = [], extra: Partial<GateraNodeDef> = {}): GateraNodeDef => ({ id, kind, requires, name: `Nodo ${id}`, playable: true, at: [0.5, 0.5], ...extra });

// =====================================================================================================
/** the old linear model knew no story gate (El Cadenero waits for H73 now): the equivalence runs without it */
function withoutStoryGates(fn: () => void) {
  const st = GT.stagesOf(B);
  const was = st.map((s) => s.story);
  st.forEach((s) => delete s.story);
  try {
    fn();
  } finally {
    st.forEach((s, i) => {
      if (was[i] !== undefined) s.story = was[i];
    });
  }
}

describe('1 · the line answers exactly as before', () => {
  it('stageState = the old linear model for every cleared 0–9, open or closed, stages 0–11', () => withoutStoryGates(() => {
    load();
    let cases = 0;
    for (const open of [false, true])
      for (let c = 0; c <= 9; c++) {
        G.s.ext ??= {};
        G.s.ext.gateras = { v: 1, open: open ? { [B]: 1 } : {}, huellas: 0, stages: { [B]: { cleared: c, wins: {} } }, seen: [] };
        for (let n = 0; n <= 11; n++) {
          expect(GT.stageState(B, n), `open=${open} cleared=${c} n=${n}`).toBe(legacyStageState(B, n));
          expect(GT.nodeState(B, String(n)) === 'hidden').toBe(false);
          cases++;
        }
      }
    expect(cases).toBe(240);
  }));

  it('…and with every stage playable (the future build), still the same', () => withoutStoryGates(() => {
    load();
    const st = GT.stagesOf(B);
    const was = st.map((s) => s.playable);
    st.forEach((s) => (s.playable = true));
    try {
      for (let c = 0; c <= 9; c++) {
        G.s.ext ??= {};
        G.s.ext.gateras = { v: 1, open: { [B]: 1 }, huellas: 0, stages: { [B]: { cleared: c, wins: {} } }, seen: [] };
        for (let n = 0; n <= 11; n++) expect(GT.stageState(B, n), `cleared=${c} n=${n}`).toBe(legacyStageState(B, n));
        // the frontier is the first not won (null past the last stage)
        expect(GT.frontierOf(B)).toBe(c < 9 ? c + 1 : null);
      }
    } finally {
      st.forEach((s, i) => (s.playable = was[i]));
    }
  }));

  it('a stage can wait for the story: El Cadenero (B-9) opens with H73 done, not before (the frontier follows)', () => {
    load();
    GT.openGatera(B);
    for (let n = 1; n <= 8; n++) GT.recordWin(B, n);
    expect(GT.stageState(B, 9)).toBe('locked');
    expect(GT.frontierOf(B)).toBeNull();
    G.s.missions.done.push('H73');
    expect(GT.stageState(B, 9)).toBe('open');
    expect(GT.frontierOf(B)).toBe(9);
  });

  it('the line still proves 1…n from a win of n (like always)', () => {
    const n = GT.normalizeGateras({ open: { [B]: 1 }, huellas: 0, stages: { [B]: { cleared: 0, wins: { '4': 1 } } }, seen: [] })!;
    expect(n.stages[B]!.cleared).toBe(4);
  });
});

// =====================================================================================================
describe('2 · other shapes: a later node won first marks nothing else', () => {
  const LIB = 'p3d_libros' as const;
  const shelf = () =>
    installShape(LIB, 'shelf', [
      node('1', 'stage'),
      node('2', 'stage'),
      node('3', 'stage'),
      node('4', 'stage'),
      node('5', 'elite', ['1', '2', '3']),
      node('6', 'stage'),
      node('7', 'stage'),
      node('9', 'boss', ['5', 'mission:H87']),
    ]);

  it('shelf: win 7 first → reload → 1–6 are NOT won; 7 is; the route count is untouched', () => {
    load();
    shelf();
    GT.openGatera(LIB);
    const w = GT.recordNodeWin(LIB, '7');
    expect(w).toEqual({ first: true, huellas: 3 });
    reload();
    expect(GT.nodeState(LIB, '7')).toBe('cleared');
    for (const id of ['1', '2', '3', '4', '6']) expect(GT.nodeState(LIB, id), id).toBe('open');
    expect(GT.nodeState(LIB, '5')).toBe('locked');
    expect(GT.clearedIn(LIB)).toBe(0);
    expect(G.s.ext!.gateras.nodes[LIB]).toEqual({ '7': 1 });
    expect(G.has('won_p3d_libros_7')).toBe(true);
    // recordWin (numeric) on a non-line shape goes to its nodes too — never to the linear count
    GT.recordWin(LIB, 6);
    reload();
    expect(GT.clearedIn(LIB)).toBe(0);
    expect(GT.nodeState(LIB, '4')).toBe('open');
    expect(GT.winsOf(LIB, 6)).toBe(1);
  });

  it('shelf: requirements (all of 1–3 for the élite; the élite + a mission for the boss)', () => {
    load();
    shelf();
    GT.openGatera(LIB);
    for (const id of ['1', '2']) GT.recordNodeWin(LIB, id);
    expect(GT.nodeState(LIB, '5')).toBe('locked');
    GT.recordNodeWin(LIB, '3');
    expect(GT.nodeState(LIB, '5')).toBe('open');
    GT.recordNodeWin(LIB, '5');
    expect(GT.nodeState(LIB, '9')).toBe('locked');
    G.s.missions.done.push('H87');
    expect(GT.nodeState(LIB, '9')).toBe('open');
  });

  it('the normalizer never applies the line rule to a non-line shape', () => {
    shelf();
    const n = GT.normalizeGateras({ open: { [LIB]: 1 }, huellas: 0, stages: { [LIB]: { cleared: 0, wins: { '7': 1 } } }, seen: [] })!;
    expect(n.stages[LIB]!.cleared).toBe(0);
  });

  it('bracket and tour: the same (won nodes only)', () => {
    load();
    installShape('p3d_anime', 'bracket', [node('1', 'stage'), node('2', 'stage'), node('3', 'stage', ['1', '2']), node('9', 'boss', ['3'])]);
    installShape('p3d_pop', 'tour', [node('1', 'stage'), node('2', 'stage'), node('3', 'stage'), node('9', 'boss', ['1', '2', '3'])]);
    GT.openGatera('p3d_anime');
    GT.openGatera('p3d_pop');
    GT.recordNodeWin('p3d_anime', '2');
    GT.recordNodeWin('p3d_pop', '3');
    reload();
    expect(GT.nodeState('p3d_anime', '1')).toBe('open');
    expect(GT.nodeState('p3d_anime', '3')).toBe('locked');
    expect(GT.nodeState('p3d_pop', '1')).toBe('open');
    expect(GT.nodeState('p3d_pop', '9')).toBe('locked');
    // huellasMax counts the route (stage / élite / boss), never detours
    expect(GT.huellasMax('p3d_pop')).toBe(3 * 3 + 10);
  });
});

// =====================================================================================================
describe('3 · the normalizer: additive, idempotent, sets broken sections aside', () => {
  it('a v1 slice gains no key (nodes / peak / acts / enc / photos are never created on load)', () => {
    const v1 = { v: 1, open: { [B]: 123 }, huellas: 15, stages: { [B]: { cleared: 5, wins: { '1': 1, '2': 1, '3': 1, '4': 1, '5': 2 } } }, seen: ['carta_intro'] };
    const n = GT.normalizeGateras(JSON.parse(JSON.stringify(v1)));
    expect(n).toEqual(v1);
    expect(Object.keys(n!).sort()).toEqual(Object.keys(v1).sort());
  });

  it('every additive field is repaired, kept and idempotent', () => {
    const r = {
      v: 1,
      open: { [B]: 1 },
      huellas: 3,
      stages: {},
      seen: [],
      nodes: { [B]: { d1: 2, d2: -3, D9: 1.7, futuro_x: 'x' }, p3d_futura: { '1': 1 } },
      peak: 1.5e7,
      acts: { [B]: { seed: -5, round: 2.9, done: ['l1', 'l1', 3], extra: true } },
      enc: { e_cadenero: 'ganado', e_x: 'visto', e_raro: 7 },
      photos: ['p3d_borracha_5', 'p3d_borracha_5', 9],
    };
    const n = GT.normalizeGateras(r)! as unknown as Record<string, unknown>;
    // every node key is kept (a later build may know it); counts are clamped, never subtracted below 0
    expect(n.nodes).toEqual({ [B]: { d1: 2, d2: 0, D9: 1, futuro_x: 0 }, p3d_futura: { '1': 1 } });
    expect(n.peak).toBe(1.5e7);
    expect(n.acts).toEqual({ [B]: { seed: (-5 >>> 0) as number, round: 2, done: ['l1'], extra: true } });
    expect(n.enc).toEqual({ e_cadenero: 'ganado', e_x: 'visto' });
    expect(n.photos).toEqual(['p3d_borracha_5']);
    expect(GT.normalizeGateras(n)).toEqual(n);
  });

  it('a broken nodes section (or a broken dimension inside it) is set aside without touching the rest', () => {
    const n = GT.normalizeGateras({ v: 1, open: { [B]: 1 }, huellas: 9, stages: { [B]: { cleared: 3, wins: { '3': 1 } } }, seen: ['a'], nodes: 'roto', acts: [1], photos: { x: 1 } })! as unknown as Record<string, unknown>;
    expect(n.nodes).toBeUndefined();
    expect(n.nodesBroken).toBe('roto');
    expect(n.actsBroken).toEqual([1]);
    expect(n.photosBroken).toEqual({ x: 1 });
    expect(n.huellas).toBe(9);
    expect((n.stages as Record<string, unknown>)[B]).toEqual({ cleared: 3, wins: { '3': 1 } });
    expect(n.seen).toEqual(['a']);
    expect(GT.normalizeGateras(n)).toEqual(n);
    const m = GT.normalizeGateras({ v: 1, open: {}, huellas: 0, stages: {}, seen: [], nodes: { [B]: { d1: 1 }, p3d_anime: 'roto' } })! as unknown as Record<string, unknown>;
    expect(m.nodes).toEqual({ [B]: { d1: 1 } });
    expect(m.nodesBroken).toEqual({ p3d_anime: 'roto' });
    expect(GT.normalizeGateras(m)).toEqual(m);
  });
});

// =====================================================================================================
describe('4 · migration: real saves load unchanged', () => {
  it('every fixture (Part I, Part II, h65) loads with no ext.gateras created, and save → reload is stable', () => {
    expect(FIXTURES.length).toBeGreaterThanOrEqual(10);
    for (const f of FIXTURES) {
      load(f);
      expect(G.s.ext?.gateras, f).toBeUndefined();
      // reading the Carta creates nothing (nodes / peak / price are read-only views)
      GT.nodeState(B, '1');
      GT.nodeState(B, 'd1');
      GT.gateraPrice(B);
      GT.notePeakIncome();
      expect(G.s.ext?.gateras, f).toBeUndefined();
      const once = JSON.stringify({ ...G.s, savedAt: 0 });
      reload();
      expect(JSON.stringify({ ...G.s, savedAt: 0 }), f).toBe(once);
    }
  });

  it('h65 + B-1…B-5 won by the real flows (v1 slice) → reload reads byte-for-byte the same, same states as before', () => {
    load('h65-normal.json');
    GT.markSeenG('carta_intro');
    GT.openGatera(B);
    const won: BattleResult = { won: true, perfect: false, modulesDestroyed: 3 } as unknown as BattleResult;
    for (let n = 1; n <= 5; n++) GB.applyGateraResult(B, n, won);
    GB.applyGateraResult(B, 2, won); // a repeat
    const slice = JSON.parse(JSON.stringify(G.s.ext!.gateras));
    // the only additive field the flows write is the peak (noted after each battle); no node of the line is duplicated
    expect(slice.nodes).toBeUndefined();
    expect(slice.stages[B]).toEqual({ cleared: 5, wins: { '1': 1, '2': 2, '3': 1, '4': 1, '5': 1 } });
    expect(slice.huellas).toBe(15);
    reload();
    expect(G.s.ext!.gateras).toEqual(slice);
    for (let n = 1; n <= 9; n++) expect(GT.stageState(B, n), `B-${n}`).toBe(legacyStageState(B, n));
    for (const n of [1, 2, 3, 4, 5]) expect(GT.stageState(B, n)).toBe('cleared');
  });

  it('a v1 slice as written by the live build (no peak, no nodes) on every Part I / II fixture: unchanged', () => {
    const v1 = { v: 1, open: { [B]: 1_760_000_000_000 }, huellas: 15, stages: { [B]: { cleared: 5, wins: { '1': 1, '2': 3, '3': 1, '4': 1, '5': 2 } } }, seen: ['carta_intro', 'b69_manana#a'] };
    for (const f of FIXTURES) {
      const env = JSON.parse(raw(f));
      env.state.ext = { ...(env.state.ext ?? {}), gateras: JSON.parse(JSON.stringify(v1)) };
      mem.clear();
      mem.set(SAVE_KEY, JSON.stringify(env));
      G.load();
      expect(G.loaded, f).toBe(true);
      expect(G.s.ext!.gateras, f).toEqual(v1);
      expect(GT.clearedIn(B), f).toBe(5);
      expect(GT.huellas(), f).toBe(15);
      reload();
      expect(G.s.ext!.gateras, f).toEqual(v1);
    }
  });
});

// =====================================================================================================
describe('5 · detours, activities, encounters on the Borracha line', () => {
  it('a detour off B-3, revealed by a flag: its own wins, 3 huellas, its own flag; the route is untouched', () => {
    load();
    installShape(B, 'line', [node('d1', 'desvio', ['3'], { revealedBy: 'flag:ronda_1' }), node('d2', 'desvio', ['d1'], { revealedBy: 'flag:ronda_1' }), node('a1', 'actividad', ['mission:H69'])]);
    GT.openGatera(B);
    expect(GT.nodeState(B, 'd1')).toBe('hidden');
    G.flag('ronda_1');
    expect(GT.nodeState(B, 'd1')).toBe('locked');
    for (let n = 1; n <= 3; n++) GT.recordWin(B, n);
    expect(GT.nodeState(B, 'd1')).toBe('open');
    expect(GT.nodeState(B, 'd2')).toBe('locked');
    const before = GT.huellas();
    expect(GT.recordNodeWin(B, 'd1')).toEqual({ first: true, huellas: 3 });
    expect(GT.recordNodeWin(B, 'd1')).toEqual({ first: false, huellas: 0 });
    expect(GT.huellas()).toBe(before + 3);
    expect(G.has('won_p3d_borracha_d1')).toBe(true);
    reload();
    expect(GT.nodeState(B, 'd1')).toBe('cleared');
    expect(GT.nodeState(B, 'd2')).toBe('open');
    expect(GT.clearedIn(B)).toBe(3);
    expect(G.s.ext!.gateras.nodes[B]).toEqual({ d1: 2 });
    // an activity pays no huellas; the route's max stays 34 (detours are margin)
    expect(GT.huellasForNode(B, 'a1')).toBe(0);
    expect(GT.huellasMax(B)).toBe(34);
    // a line stage recorded as a node goes to the route as always
    GT.recordNodeWin(B, '4');
    expect(GT.clearedIn(B)).toBe(4);
    expect(G.s.ext!.gateras.nodes[B]['4']).toBeUndefined();
  });
});

// =====================================================================================================
describe('6 · Maneki charges the PEAK income (Parte III only)', () => {
  it('emptying habitats never lowers the price; the peak never goes down', () => {
    load();
    GT.openGatera(B); // the slice exists (Parte III save)
    const income = incomePerSec();
    GT.notePeakIncome();
    const price = GT.gateraPrice('p3d_superheroes').gold;
    expect(price).toBe(GT.priceFor('p3d_superheroes', income));
    // move every cat out of its habitat: the income drops, the price doesn't
    const homes = G.s.habitats.map((h) => [...h.cats]);
    G.s.habitats.forEach((h) => (h.cats = []));
    G.recalc();
    expect(incomePerSec()).toBeLessThan(income);
    GT.notePeakIncome();
    expect(GT.gateraPrice('p3d_superheroes').gold).toBe(price);
    expect(GT.peakIncome()).toBeCloseTo(income, 6);
    // back home and richer: the price follows up
    G.s.habitats.forEach((h, i) => (h.cats = homes[i]));
    G.recalc();
    expect(GT.notePeakIncome(false, income * 2)).toBeCloseTo(income * 2, 6);
    expect(GT.gateraPrice('p3d_superheroes').gold).toBe(GT.priceFor('p3d_superheroes', income * 2));
    // the peak survives a reload
    reload();
    expect(GT.peakIncome()).toBeCloseTo(income * 2, 6);
  });

  it('the Marea Final never feeds the peak (during it and 5 s after)', () => {
    load();
    GT.openGatera(B);
    const p0 = GT.notePeakIncome();
    const ext = G.s.ext as Record<string, unknown>;
    ext.mareaUntil = Date.now() + 60_000;
    expect(GT.notePeakIncome(false, p0 * 1000 * 50, 1)).toBe(p0);
    ext.mareaUntil = Date.now() - 1000;
    expect(GT.notePeakIncome(false, p0 * 1000 * 50, 1)).toBe(p0);
    delete ext.mareaUntil;
  });

  it('a save without the Parte III never gets a slice from the peak', () => {
    load('post-finale.json');
    expect(GT.notePeakIncome()).toBe(0);
    expect(GT.notePeakIncome(true)).toBe(0); // the Carta doesn't exist for this save
    expect(G.s.ext?.gateras).toBeUndefined();
  });
});
