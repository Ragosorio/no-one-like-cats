/**
 * Parte III · pulido de la calle con Luzterna (LUZ, docs/part-iii/13 §2.2 y §3.5):
 *  - silueta.ts (the shared silhouette rule): the transitions have a preparation, a development and an exit; the color
 *    drains from the feet up and floods back from the head; «Reducir movimiento» = crossfades; never pure black.
 *  - p3_salida: every line of affection kept, in order; each leg is different (bend · DERECHO huge + the floor waves ·
 *    the stamp, the quiet, her light dips a little · she stops); L4 turns 180° and rights itself; V1–V5 use the REAL
 *    puppets (no generic shapes), V4's thread insert, V5's crossing; only `b67_salida#a` persists.
 *  - everything the script drives / flourishes / frames exists on the caja stage.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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

const { siluetaCurve, safeBody, siluetaKeep } = await import('../src/momentos/songs/drunck/silueta');
const { P3_SALIDA, SALIDA_LINES } = await import('../src/cine/scenes/p3Salida');
const { CALLE_DRIVES, CALLE_FX } = await import('../src/scenes/caja/calle');
const { walkStep, WALK_LEGS } = await import('../src/scenes/CajaScene');
const { catRig } = await import('../src/art/puppetCore');
type Step = import('../src/cine/types').Step;
type Line = [string, string];

const HIST = JSON.parse(readFileSync(join(__dirname, '../src/data/gateras/historia.json'), 'utf8')) as { story: { beats: { id: string; lines: Line[] }[] } };
const beat = (id: string) => HIST.story.beats.find((b) => b.id === id)!.lines;
const SRC = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');

/** every step of the script in order, with where it lives (top level, a say's onLine) */
function walk(steps: Step[], out: { s: Step; on?: { line: number } }[] = [], on?: { line: number }) {
  for (const s of steps) {
    out.push({ s, on });
    if ('parallel' in s) walk(s.parallel, out, on);
    if ('seq' in s) walk(s.seq, out, on);
    if ('say' in s && s.say.onLine) for (const [k, v] of Object.entries(s.say.onLine)) walk(Array.isArray(v) ? v : [v], out, { line: (s.say.lines ?? [])[Number(k)] });
  }
  return out;
}
const ALL = walk(P3_SALIDA.steps);
const drives = (id: string) => ALL.filter((x) => 'drive' in x.s && x.s.drive.id === id);
const fxs = (id: string) => ALL.filter((x) => 'fx' in x.s && x.s.fx.id === id);
const topIndex = (pred: (s: Step) => boolean) => P3_SALIDA.steps.findIndex(pred);
const sayIndex = (line: number) => topIndex((s) => 'say' in s && (s.say.lines ?? []).includes(line));

describe('silueta.ts: the transitions (13 §2.2)', () => {
  it('preparation: the light turns and the rim comes in BEFORE any color drains', () => {
    const early = siluetaCurve(0.12, 0, 'flood', false);
    expect(early.rim).toBeGreaterThan(0.2);
    expect(early.swing).toBeGreaterThan(0.1);
    expect(early.front).toBeLessThan(-0.2);
  });
  it('development: the color drains from the FEET up, with a line of light on the front', () => {
    let prev = -Infinity;
    for (let k = 0; k <= 1.0001; k += 0.05) {
      const L = siluetaCurve(k, 0, 'flood', false);
      expect(L.front).toBeGreaterThanOrEqual(prev);
      prev = L.front;
    }
    expect(siluetaCurve(0, 0, 'flood', false).front).toBeLessThan(0);
    expect(siluetaCurve(1, 0, 'flood', false).front).toBeGreaterThan(1.1);
    expect(siluetaCurve(0.55, 0, 'flood', false).glow).toBeGreaterThan(0.5);
    expect(siluetaCurve(1, 0, 'flood', false).glow).toBe(0);
  });
  it('exit «flood»: the color comes back from the HEAD down; exit «dissolve»: it comes apart and is gone', () => {
    let prev = Infinity;
    for (let q = 0; q <= 1.0001; q += 0.05) {
      const L = siluetaCurve(1, q, 'flood', false);
      expect(L.front).toBeLessThanOrEqual(prev);
      prev = L.front;
    }
    expect(siluetaCurve(1, 1, 'flood', false).front).toBeLessThan(0);
    const d = siluetaCurve(1, 1, 'dissolve', false);
    expect(d.dissolve).toBeGreaterThan(1);
    expect(d.fade).toBe(0);
    expect(siluetaCurve(1, 0.5, 'dissolve', false).fade).toBe(1);
  });
  it('«Reducir movimiento»: crossfades — no travelling front, no turning light, no dissolve', () => {
    for (const k of [0, 0.3, 0.7, 1]) {
      const L = siluetaCurve(k, 0, 'flood', true);
      expect(L.front).toBeGreaterThan(1.1);
      expect(L.mix).toBeCloseTo(k);
      expect(L.glow).toBe(0);
      expect(L.swing).toBe(1);
    }
    expect(siluetaCurve(1, 0.5, 'flood', true).mix).toBeCloseTo(0.5);
    const d = siluetaCurve(1, 0.6, 'dissolve', true);
    expect(d.dissolve).toBe(0);
    expect(d.fade).toBeCloseTo(0.4);
  });
  it('«modo borde»: the rim stays over the painted body', () => {
    expect(siluetaCurve(0, 0, 'flood', false, 1).rim).toBe(1);
    expect(siluetaCurve(0, 0, 'flood', false, 1).front).toBeLessThan(0);
  });
  it('the body is never pure black', () => {
    for (const c of [0x000000, 0x050505, 0x0a0a0a]) {
      const b = safeBody(c);
      const l = 0.299 * ((b >> 16) & 255) + 0.587 * ((b >> 8) & 255) + 0.114 * (b & 255);
      expect(l).toBeGreaterThanOrEqual(14);
    }
    expect(safeBody(0x1d1430)).toBe(0x1d1430);
  });
  it('the key accessories (scarf per form, lantern) sit inside their paintings, and the rigs have eyes', () => {
    for (const slug of ['canelo_cozy_cat', 'canelo_admiral_cat', 'canelo_astral_cat', 'luzterna']) {
      const rig = catRig(slug)!;
      expect(rig, slug).toBeTruthy();
      expect(rig.eyes.length).toBeGreaterThanOrEqual(2);
      const [w, h] = rig.size ?? [700, 700];
      for (const [cx, cy, rx, ry] of siluetaKeep(slug)!) {
        expect(cx - rx).toBeGreaterThanOrEqual(0);
        expect(cx + rx).toBeLessThanOrEqual(w);
        expect(cy - ry).toBeGreaterThanOrEqual(0);
        expect(cy + ry).toBeLessThanOrEqual(h);
      }
    }
  });
});

describe('p3_salida: the affection is kept, every line, in order', () => {
  it('every b67_salida line is said exactly once and in the script order; only b67_salida#a persists', () => {
    const said = P3_SALIDA.steps.flatMap((s) => ('say' in s ? (s.say.lines ?? []) : []));
    expect(said).toEqual(beat('b67_salida').map((_, i) => i));
    const persists = ALL.filter((x) => 'persist' in x.s).map((x) => ('persist' in x.s ? x.s.persist.beat : ''));
    expect(persists).toEqual(['b67_salida#a']);
  });
  it('the bond lines are still there (the owner approved them)', () => {
    const L = beat('b67_salida').map((l) => l[1]).join(' | ');
    for (const t of ['Te voy a buscar', 'Es horrible', 'Por eso es mía', 'Una noche. Ojalá', 'Perdón por irme', 'No te acostumbres']) expect(L).toContain(t);
  });
  it('the walk is still four interactive legs that can never be lost; walkStep stays pure', () => {
    const legs = ALL.filter((x) => 'interact' in x.s).map((x) => ('interact' in x.s ? x.s.interact.target : ''));
    expect(legs).toEqual(['walk:1', 'walk:2', 'walk:3', 'walk:4']);
    const s0 = { x: WALK_LEGS[0][0], idle: 0, leaning: 0, pushing: false, done: false };
    const copy = { ...s0 };
    const a = walkStep(s0, WALK_LEGS[0][1], 1 / 60, 1);
    const b = walkStep(s0, WALK_LEGS[0][1], 1 / 60, 1);
    expect(a).toEqual(b);
    expect(s0).toEqual(copy);
  });
});

describe('p3_salida: each leg is different (13 §3.5)', () => {
  const w = (n: number) => topIndex((s) => 'interact' in s && s.interact.target === `walk:${n}`);
  it('leg 1: the alley bends — and straightens before leg 2', () => {
    const on = drives('bend').filter((x) => 'drive' in x.s && x.s.drive.to > 0.5);
    expect(on.length).toBeGreaterThan(0);
    const iOn = P3_SALIDA.steps.indexOf(on[0].s);
    expect(iOn).toBeGreaterThanOrEqual(0);
    expect(iOn).toBeLessThan(w(1));
    const off = P3_SALIDA.steps.findIndex((s) => 'drive' in s && s.drive.id === 'bend' && s.drive.to === 0);
    expect(off).toBeGreaterThan(w(1));
    expect(off).toBeLessThan(w(2));
  });
  it('«Derecho. DERECHO.»: she grows huge on that line and comes back to her size', () => {
    const line = SALIDA_LINES.tramo2[1];
    expect(beat('b67_salida')[line][1]).toContain('DERECHO');
    const big = drives('luzBig').filter((x) => x.on?.line === line).map((x) => ('drive' in x.s ? x.s.drive.to : -1));
    expect(big[0]).toBe(1);
    expect(big[big.length - 1]).toBe(0);
  });
  it('«El piso se mueve»: the floor waves; «El piso no se mueve…»: she stamps and it goes flat', () => {
    const moves = SALIDA_LINES.tramo2[2];
    const stays = SALIDA_LINES.tramo3[0];
    expect(beat('b67_salida')[moves][1]).toBe('El piso se mueve.');
    expect(beat('b67_salida')[stays][1]).toMatch(/^El piso no se mueve/);
    expect(drives('wave').some((x) => x.on?.line === moves && 'drive' in x.s && x.s.drive.to === 1)).toBe(true);
    expect(fxs('stamp').some((x) => x.on?.line === stays)).toBe(true);
    expect(drives('wave').some((x) => x.on?.line === stays && 'drive' in x.s && x.s.drive.to === 0)).toBe(true);
  });
  it('the quiet: the rain calms; her light dips only a little on «ya me pasó todo» and comes back (no underline)', () => {
    const line = SALIDA_LINES.tramo3[2];
    expect(beat('b67_salida')[line][1]).toContain('ya me pasó todo');
    const dim = drives('luzDim').filter((x) => x.on?.line === line).map((x) => ('drive' in x.s ? x.s.drive.to : -1));
    expect(Math.min(...dim)).toBeGreaterThanOrEqual(0.7);
    expect(Math.min(...dim)).toBeLessThan(1);
    expect(dim[dim.length - 1]).toBe(1);
    expect(drives('rainK').some((x) => 'drive' in x.s && x.s.drive.to < 0.5)).toBe(true);
  });
  it('leg 4: she stops (a pause, the leash yanks him back) before her «Es la primera vez que te oigo»', () => {
    const stop = topIndex((s) => 'fx' in s && s.fx.id === 'stop');
    expect(stop).toBeGreaterThan(w(4));
    expect(stop).toBeLessThan(sayIndex(SALIDA_LINES.tramo4[0]));
  });
});

describe('p3_salida: the camera and the shadows', () => {
  it('L4: the shot turns 180° as his point of view and rights itself', () => {
    const pov = drives('pov').map((x) => ('drive' in x.s ? x.s.drive.to : -1));
    expect(pov).toEqual([1, 0]);
  });
  it('V1–V5 use the real puppets: no generic shapes left in the alley', () => {
    const scene = SRC('src/scenes/CajaScene.ts');
    expect(scene).not.toMatch(/function ghostBack/);
    expect(scene).not.toMatch(/ghostBack\(/);
    // catBack survives only for the patron thrown out of the bar in A1 (agent BAR's scene)
    for (const m of scene.matchAll(/catBack\(g, /g)) expect(scene.slice(Math.max(0, (m.index ?? 0) - 400), m.index)).toMatch(/patron/);
    const calle = SRC('src/scenes/caja/calle.ts');
    expect(calle).toMatch(/silhouette\(/);
    expect(drives('backs').some((x) => 'drive' in x.s && x.s.drive.to === 1)).toBe(true);
  });
  it('the silhouettes have an exit: the color floods back when they turn to each other, and at the end', () => {
    for (const id of ['luzOut', 'canOut']) expect(drives(id).some((x) => 'drive' in x.s && x.s.drive.to === 1), id).toBe(true);
    const v5 = topIndex((s) => s.id === 'V5');
    const back = P3_SALIDA.steps.slice(v5).some((s) => 'parallel' in s && s.parallel.some((p) => 'drive' in p && p.drive.id === 'luzOut' && p.drive.to === 1));
    expect(back).toBe(true);
  });
  it('V4: the insert of her sleeve keeping the thread; V5: he crosses', () => {
    const v4 = topIndex((s) => s.id === 'V4');
    expect(v4).toBeGreaterThan(0);
    const st = P3_SALIDA.steps[v4];
    expect('camera' in st && st.camera.to).toBe('manga');
    expect(fxs('thread').length).toBe(1);
    expect(drives('cross').some((x) => 'drive' in x.s && x.s.drive.to === 1)).toBe(true);
  });
  it('the shots vary: many framings (no repeated fixed medium shot); zooms stay sane', () => {
    const cams = ALL.filter((x) => 'camera' in x.s).map((x) => ('camera' in x.s ? x.s.camera : null)!);
    const kinds = new Set(cams.map((c) => `${typeof c.to === 'string' ? c.to : 'pt'}@${(c.zoom ?? 0).toFixed(1)}`));
    expect(kinds.size).toBeGreaterThanOrEqual(14);
    for (const c of cams) {
      expect(c.zoom).toBeGreaterThanOrEqual(0.8);
      expect(c.zoom).toBeLessThanOrEqual(2.6);
    }
  });
  it('«Reducir movimiento»: the shake and the punch are left out', () => {
    for (const x of ALL) if ('fx' in x.s && ['shake', 'punch'].includes(x.s.fx.id)) expect(x.s.reduced).toBe('skip');
  });
});

describe('p3_salida: everything it asks for exists on the caja stage', () => {
  const STAGE_DRIVES = ['walkX', 'luzX', 'luz', 'leash', 'lying', 'backs', 'cross', 'luzLook', 'door', 'signA', 'flame'];
  const STAGE_FX = ['roll', 'tug', 'shake', 'punch'];
  const STAGE_TARGETS = ['canelo', 'luzterna', 'puerta', 'calle', 'gatera', 'fondo', 'letrero', 'bufanda', 'manga', 'linterna', 'pareja'];
  it('drives, flourishes and camera targets', () => {
    for (const x of ALL) {
      if ('drive' in x.s) expect([...STAGE_DRIVES, ...CALLE_DRIVES], x.s.drive.id).toContain(x.s.drive.id);
      if ('fx' in x.s) expect([...STAGE_FX, ...CALLE_FX], x.s.fx.id).toContain(x.s.fx.id);
      if ('camera' in x.s && typeof x.s.camera.to === 'string') expect(STAGE_TARGETS, x.s.camera.to).toContain(x.s.camera.to);
    }
  });
});
