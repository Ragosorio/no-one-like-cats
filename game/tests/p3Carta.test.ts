/**
 * Parte III · LA CARTA PARA VARIAS CAJAS (docs/part-iii/mecanicas-v2/03-plan-implementacion.md §2.4) — what is already
 * data-driven: a second box with stages in data builds its battles (label, look, feature, win flag, huellas) without a
 * line of Borracha code; every box the data opens is on the Carta with tappable nodes (a line, a bracket, a shelf, a
 * tour: edges from `requires`); and no NEW literal `p3d_borracha` creeps into the code (an allowlist of the places that
 * still name it on purpose: the DimId list, the scene's focused box, the story script's beat flags).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
const CM = await import('../src/scenes/cartaModel');
type GateraStageDef = import('../src/state/sys/gateras').GateraStageDef;

function load(f = 'h65-normal') {
  mem.clear();
  mem.set(SAVE_KEY, readFileSync(new URL(`../test-saves/${f}.json`, import.meta.url), 'utf8'));
  G.load();
}
const S = 'p3d_superheroes' as const;
const undo: (() => void)[] = [];
afterEach(() => {
  while (undo.length) undo.pop()!();
});
function installSecondBox() {
  const st: GateraStageDef[] = [
    { n: 1, name: 'Barrio bajo', kind: 'normal', playable: true, at: [0.1, 0.8], captain: 'e_rencor', captainName: 'Rencor', crew: ['e_rencor', 'r_plasmin', 'r_kage'], powerMul: 1, hpMulX: 2.4 },
    { n: 2, name: 'La azotea', kind: 'elite', playable: true, at: [0.3, 0.6], captain: 'e_supernova', crew: ['e_supernova', 'r_plasmin'], powerMul: 1.15, band: 'jefe', hpMulX: 3, cata: { id: 'meteors', first: 2, every: 3, power: 0.6 } },
  ];
  const d = GT.dimDef(S);
  const before = { code: d.code, battle: d.battle, screen: d.screen, palette: d.palette };
  d.code = 'S';
  d.battle = { palette: { skyTop: 0x101010 }, style: 'borracha' };
  // its window inside the sheet (where the route is drawn) and its palette
  d.screen = { x: d.box.x + 40, y: d.box.y + 40, w: d.box.w - 80, h: d.box.h - 80 };
  d.palette = { ink: '#202a5a' };
  const was = GT.REG.stages[S];
  GT.REG.stages[S] = st;
  undo.push(() => {
    if (was) GT.REG.stages[S] = was;
    else delete GT.REG.stages[S];
    for (const k of ['code', 'battle', 'screen', 'palette'] as const) {
      (d as unknown as Record<string, unknown>)[k] = before[k];
      if (before[k] === undefined) delete (d as unknown as Record<string, unknown>)[k];
    }
  });
}

describe('a second box is data', () => {
  it('its battles build from data: label, élite tag, its box power, its look, its id', () => {
    load();
    installSecondBox();
    const s1 = GB.buildGateraBattle(S, 1, () => undefined);
    expect(s1.intro?.tag).toBe('CIUDAD MAYÚSCULA · S-1');
    expect(s1.meta?.special).toBe('p3d_superheroes_1');
    expect(s1.palette?.skyTop).toBe(0x101010);
    expect(s1.rules?.mareo).toBeUndefined();
    const s2 = GB.buildGateraBattle(S, 2, () => undefined);
    expect(s2.intro?.tag).toBe('ÉLITE · CIUDAD MAYÚSCULA');
    expect(s2.rules?.cataclysm).toMatchObject({ id: 'meteors', side: 1, by: 'CIUDAD MAYÚSCULA' });
  });

  it('opening it counts its own mission feature; a win flags `won_<battle id>` and pays huellas', () => {
    load();
    installSecondBox();
    GT.openGatera(S);
    expect(G.s.counters.feature_p3_gatera_superheroes).toBe(1);
    expect(G.flag).toBeTruthy();
    expect(GT.recordWin(S, 1)).toEqual({ first: true, huellas: 3 });
    expect(G.has('won_p3d_superheroes_1')).toBe(true);
    expect(GT.stageState(S, 2)).toBe('open');
    // the Borracha's feature is still the one H68 reads
    GT.openGatera('p3d_borracha');
    expect(G.s.counters.feature_p3_gatera_borracha).toBe(1);
  });
});

describe('the Carta’s model draws every open box (scenes/cartaModel.ts)', () => {
  it('only the Borracha open: its TV, its 9 nodes keyed `<dim>:<n>`, its route; the camera on it', () => {
    load();
    GT.openGatera('p3d_borracha');
    const m = CM.cartaModel();
    expect(m.boxes.map((b) => [b.dim, b.look])).toEqual([
      ['p3d_borracha', 'tv'],
      ['p3d_superheroes', 'blank'],
      ['p3d_anime', 'blank'],
      ['p3d_libros', 'blank'],
      ['p3d_pop', 'blank'],
    ]);
    expect(m.nodes.filter((n) => n.n !== null).map((n) => n.key)).toEqual(Array.from({ length: 9 }, (_, i) => `p3d_borracha:${i + 1}`));
    // La Ronda's node shows (locked until B-5); the detour stays hidden until a Ronda is done
    expect(m.nodes.filter((n) => n.n === null).map((n) => [n.key, n.state])).toEqual([['p3d_borracha:a1', 'locked']]);
    expect(m.routes.length).toBe(8);
    expect(m.focus).toBe('p3d_borracha');
    expect(CM.firstBox()).toBe('p3d_borracha');
    // its nodes sit inside its screen
    const scr = GT.dimDef('p3d_borracha').screen!;
    for (const n of m.nodes) {
      expect(n.pos[0]).toBeGreaterThanOrEqual(scr.x);
      expect(n.pos[0]).toBeLessThanOrEqual(scr.x + scr.w);
    }
    expect(m.nodes.find((n) => n.frontier)?.n).toBe(1);
  });

  it('a second box built from data: her open sheet, its own nodes, route and frontier; the camera follows the last fight', () => {
    load();
    installSecondBox();
    GT.openGatera('p3d_borracha');
    for (let n = 1; n <= 9; n++) GT.recordWin('p3d_borracha', n);
    GT.openGatera(S);
    let m = CM.cartaModel();
    expect(m.boxes.find((b) => b.dim === S)).toEqual({ dim: S, look: 'sheet', open: true });
    const sk = m.nodes.filter((n) => n.dim === S);
    expect(sk.map((n) => n.key)).toEqual(['p3d_superheroes:1', 'p3d_superheroes:2']);
    const scr = GT.dimDef(S).screen!;
    for (const n of sk) expect(n.pos[1]).toBeGreaterThanOrEqual(scr.y);
    expect(sk.find((n) => n.frontier)?.n).toBe(1);
    expect(m.routes.filter((r) => r.dim === S)).toHaveLength(1);
    // the furthest open box by default; the box of the last fight when there is one
    expect(m.focus).toBe(S);
    expect(CM.cartaModel('p3d_borracha').focus).toBe('p3d_borracha');
    // Borracha nodes keep their keys and their won state; the route inks where S-1 is won
    expect(m.nodes.filter((n) => n.dim === 'p3d_borracha' && n.n !== null).every((n) => n.state === 'cleared')).toBe(true);
    expect(m.nodes.find((n) => n.key === 'p3d_borracha:a1')?.state).toBe('open');
    GT.recordWin(S, 1);
    m = CM.cartaModel();
    expect(m.routes.find((r) => r.dim === S)!.cleared).toBe(true);
    expect(m.nodes.find((n) => n.key === 'p3d_superheroes:2')!.frontier).toBe(true);
  });

  it('every box with stages or nodes has its window: opened, the Carta draws its nodes there (none stays «aquí no he llegado»)', () => {
    load();
    for (const d of GT.DIMS) {
      if (GT.stagesOf(d.id).length || GT.nodesOf(d.id).length) expect(d.screen, d.id).toBeTruthy();
      GT.openGatera(d.id);
    }
    const m = CM.cartaModel();
    expect(m.boxes.every((b) => b.open && b.look !== 'blank')).toBe(true);
    for (const d of GT.DIMS) {
      const mine = m.nodes.filter((n) => n.dim === d.id);
      expect(mine.length, d.id).toBeGreaterThan(0);
      const s = d.screen!;
      for (const n of mine) {
        expect(n.pos[0]).toBeGreaterThanOrEqual(s.x);
        expect(n.pos[0]).toBeLessThanOrEqual(s.x + s.w);
        expect(n.pos[1]).toBeGreaterThanOrEqual(s.y);
        expect(n.pos[1]).toBeLessThanOrEqual(s.y + s.h);
      }
    }
  });

  it('a look another module registers takes over; a closed box stays blank; unknown looks fall back', () => {
    load();
    installSecondBox();
    const d = GT.dimDef(S);
    const was = d.look;
    undo.push(() => (d.look = was));
    d.look = 'comic';
    GT.openGatera(S);
    expect(CM.boxLook(d)).toBe('sheet');
    CM.declareLook('comic');
    expect(CM.boxLook(d)).toBe('comic');
    expect(CM.lookKnown('comic')).toBe(true);
    expect(CM.boxLook(GT.dimDef('p3d_anime'))).toBe('blank');
  });
});

describe('every box the data opens is on the Carta (a bracket, a shelf, a tour too)', () => {
  type Rect = { x: number; y: number; w: number; h: number };
  const inside = (p: [number, number], r: Rect) => p[0] >= r.x && p[0] <= r.x + r.w && p[1] >= r.y && p[1] <= r.y + r.h;
  const frontier = (m: ReturnType<typeof CM.cartaModel>, dim: string) => m.nodes.filter((n) => n.dim === dim && n.frontier).map((n) => n.node);
  const edges = (m: ReturnType<typeof CM.cartaModel>, dim: string) => m.routes.filter((r) => r.dim === dim);

  it('every box has a screen inside its box, and each of its nodes sits in that screen', () => {
    for (const d of GT.DIMS) {
      const s = d.screen!;
      expect(s, d.id).toBeTruthy();
      expect(inside([s.x, s.y], d.box) && inside([s.x + s.w, s.y + s.h], d.box), d.id).toBe(true);
      for (const x of GT.nodesOf(d.id)) expect(inside(CM.nodePos(d, x), s), `${d.id}:${x.id}`).toBe(true);
    }
  });

  it('h83 (Superhéroes and Anime open): their sheets, all 19 of their nodes, their routes', () => {
    load('h83-acto3');
    const m = CM.cartaModel();
    expect(CM.openBoxes().map((d) => d.id)).toEqual(['p3d_borracha', S, 'p3d_anime']);
    expect(m.boxes.filter((b) => b.open).map((b) => [b.dim, b.look])).toEqual([
      ['p3d_borracha', 'tv'],
      [S, 'sheet'],
      ['p3d_anime', 'sheet'],
    ]);
    const keys = (dim: string) => m.nodes.filter((n) => n.dim === dim).map((n) => n.key);
    expect(keys(S)).toEqual([...Array.from({ length: 9 }, (_, i) => `${S}:${i + 1}`), `${S}:eestambre`]);
    expect(keys('p3d_anime')).toEqual(Array.from({ length: 9 }, (_, i) => `p3d_anime:a${i + 1}`));
    // a bracket's edges come from `requires` (A-9's `mission:H80` draws nothing)
    expect(edges(m, 'p3d_anime').map((r) => `${r.from}>${r.to}`)).toEqual(['a1>a2', 'a1>a3', 'a2>a4', 'a3>a4', 'a4>a5', 'a5>a6', 'a5>a7', 'a6>a8', 'a7>a8', 'a8>a9']);
    expect(edges(m, S)).toHaveLength(8);
    // everything there is won: inked, nothing pulses; a bracket's `stage` node is drawn as a stage
    expect(m.nodes.filter((n) => n.dim !== 'p3d_borracha').every((n) => n.state === 'cleared' && !n.frontier)).toBe(true);
    expect([...edges(m, S), ...edges(m, 'p3d_anime')].every((r) => r.cleared)).toBe(true);
    expect(['a1', 'a5', 'a9'].map((id) => m.nodes.find((n) => n.key === `p3d_anime:${id}`)!.kind)).toEqual(['normal', 'elite', 'boss']);
  });

  it('La Borracha is drawn the same whether other boxes are open or not', () => {
    load('h83-acto3');
    const hers = (m: ReturnType<typeof CM.cartaModel>) => JSON.stringify({ n: m.nodes.filter((n) => n.dim === 'p3d_borracha'), r: edges(m, 'p3d_borracha') });
    const withOthers = hers(CM.cartaModel());
    const open = GT.gateras()!.open;
    delete open[S];
    delete open.p3d_anime;
    expect(CM.openBoxes().map((d) => d.id)).toEqual(['p3d_borracha']);
    expect(hers(CM.cartaModel())).toBe(withOthers);
  });

  it('just opened, each shape starts at its first node; one edge per node it requires', () => {
    load();
    for (const d of ['p3d_anime', 'p3d_libros', 'p3d_pop'] as const) GT.openGatera(d);
    const m = CM.cartaModel();
    expect(['p3d_anime', 'p3d_libros', 'p3d_pop'].map((d) => frontier(m, d))).toEqual([['a1'], ['l1'], ['p1']]);
    expect(['p3d_anime', 'p3d_libros', 'p3d_pop'].map((d) => edges(m, d).length)).toEqual([10, 10, 11]);
    expect(['p3d_anime', 'p3d_libros', 'p3d_pop'].map((d) => edges(m, d).some((r) => r.cleared))).toEqual([false, false, false]);
  });

  it('a bracket: A-2 and A-3 in either order (both pulse), A-4 waits for both; an edge inks where its node is won', () => {
    load();
    GT.openGatera('p3d_anime');
    const A = 'p3d_anime' as const;
    const edge = (m: ReturnType<typeof CM.cartaModel>, f: string, t: string) => edges(m, A).find((r) => r.from === f && r.to === t)!;
    GT.recordNodeWin(A, 'a1');
    let m = CM.cartaModel();
    expect(frontier(m, A)).toEqual(['a2', 'a3']);
    expect([edge(m, 'a1', 'a2').cleared, edge(m, 'a1', 'a3').cleared, edge(m, 'a2', 'a4').cleared]).toEqual([true, true, false]);
    // the bracket opens out: its two first edges bow away from each other
    expect(Math.sign(edge(m, 'a1', 'a2').bend)).toBe(-Math.sign(edge(m, 'a1', 'a3').bend));
    GT.recordNodeWin(A, 'a3');
    m = CM.cartaModel();
    expect(frontier(m, A)).toEqual(['a2']);
    expect(m.nodes.find((n) => n.key === `${A}:a4`)!.state).toBe('locked');
    GT.recordNodeWin(A, 'a2');
    m = CM.cartaModel();
    expect(frontier(m, A)).toEqual(['a4']);
    expect(edge(m, 'a3', 'a4').cleared).toBe(true);
  });

  it('a shelf: L-2, L-3, L-4 in the order you pick, then L-5; a story gate locks a node but draws no edge', () => {
    load();
    const L = 'p3d_libros' as const;
    GT.openGatera(L);
    for (const id of ['l1', 'l4', 'l2']) GT.recordNodeWin(L, id);
    let m = CM.cartaModel();
    expect(frontier(m, L)).toEqual(['l3']);
    expect(edges(m, L).filter((r) => r.to === 'l5').map((r) => [r.from, r.cleared])).toEqual([
      ['l2', true],
      ['l3', false],
      ['l4', true],
    ]);
    GT.recordNodeWin(L, 'l3');
    GT.recordNodeWin(L, 'l5');
    m = CM.cartaModel();
    // L-6 also needs H84 (not done in this save): locked, and only L-5's edge leads to it
    expect(m.nodes.find((n) => n.key === `${L}:l6`)!.state).toBe('locked');
    expect(frontier(m, L)).toEqual([]);
    expect(edges(m, L).filter((r) => r.to === 'l6').map((r) => r.from)).toEqual(['l5']);
  });
});

describe('no new hard-coded Borracha in the code', () => {
  it('`p3d_borracha` appears in code only where it is named on purpose', () => {
    const SRC = fileURLToPath(new URL('../src/', import.meta.url));
    const walk = (d: string, out: string[] = []) => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) {
          if (f !== 'data') walk(p, out);
        } else if (p.endsWith('.ts')) out.push(p);
      }
      return out;
    };
    // the places that name the Borracha ON PURPOSE (each: how many code lines)
    const ALLOW: Record<string, number> = {
      'state/sys/gateras.ts': 2, // the DimId union and DIM_IDS
      'ui/story/gaterasScript.ts': 2, // the story beats of b69 fire on B-2 / B-4 wins (A's script)
    };
    const found: Record<string, number> = {};
    for (const f of walk(SRC)) {
      const rel = f.slice(SRC.length);
      const lines = readFileSync(f, 'utf8')
        .split('\n')
        .filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l) && /p3d_borracha/.test(l.replace(/\/\/.*$/, '')));
      if (lines.length) found[rel] = lines.length;
    }
    expect(found).toEqual(ALLOW);
  });
});
