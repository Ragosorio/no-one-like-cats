/**
 * Oleada 1 «La Marea Imposible» as scenes (docs/part-ii/26-oleada-1-cine.md):
 * - HUSH (src/ui/hush.ts): while a scene holds the screen, gameplay popups queue and play back after it, deduped.
 * - VOLVER A VER (cine/registry replayList): the scenes the save has seen, in story order, spoiler-safe titles;
 *   a replay never persists anything (folded with SALTAR or played through).
 * - every O1 beat hooked as a cine points at a registered scene on the right stage, which speaks exactly the
 *   ref's lines and persists the ref's key; SALTAR always reaches the persist (the story can't loop a scene).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

const H = await import('../src/ui/hush');
const { CineRunner } = await import('../src/cine/runner');
const REG = await import('../src/cine/registry');
await import('../src/cine/scenes');
const S = await import('../src/ui/story/rupturasScript');
const W = await import('../src/state/sys/worldState');
type CineScript = import('../src/cine/types').CineScript;
type CineStage = import('../src/cine/types').CineStage;
type Step = import('../src/cine/types').Step;
type WorldLook = import('../src/state/sys/worldState').WorldLook;

// ------------------------------------------------------------------ hush
describe('hush: a scene holds the screen, popups wait their turn', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    H.hushReset();
    vi.runAllTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('calm → nothing is held; hushed → queued (deduped by key) and played back after the scene, one at a time', () => {
    const seen: string[] = [];
    expect(H.hushed()).toBe(false);
    expect(H.whenCalm(() => seen.push('now'))).toBe(false);
    H.hush('cine', true);
    expect(H.hushed()).toBe(true);
    expect(H.whenCalm(() => seen.push('NUEVA MISIÓN'), 'tip:a')).toBe(true);
    expect(H.whenCalm(() => seen.push('toast 1'), 'toast:x')).toBe(true);
    expect(H.whenCalm(() => seen.push('toast 1 again'), 'toast:x')).toBe(true); // same key: one popup
    expect(H.whenCalm(() => seen.push('micro'))).toBe(true);
    expect(H.hushQueue()).toEqual(['tip:a', 'toast:x', '']);
    vi.advanceTimersByTime(60_000);
    expect(seen).toEqual([]); // nothing leaks while the scene runs
    H.hush('cine', false);
    expect(H.hushed()).toBe(false);
    vi.advanceTimersByTime(H.HUSH_GRACE * 1000 - 10);
    expect(seen).toEqual([]); // a breath after the scene
    vi.advanceTimersByTime(20);
    expect(seen).toEqual(['NUEVA MISIÓN']);
    vi.advanceTimersByTime(H.HUSH_STEP * 1000);
    expect(seen).toEqual(['NUEVA MISIÓN', 'toast 1 again']);
    vi.advanceTimersByTime(H.HUSH_STEP * 1000);
    expect(seen).toEqual(['NUEVA MISIÓN', 'toast 1 again', 'micro']);
    expect(H.hushQueue()).toEqual([]);
  });

  it('holds are counted per key; a new scene mid-playback pauses the queue again; reset never loses anything', () => {
    const seen: string[] = [];
    H.hush('cine', true);
    H.hush('reveal', true);
    H.whenCalm(() => seen.push('a'), 'a');
    H.whenCalm(() => seen.push('b'), 'b');
    H.hush('cine', false);
    expect(H.hushed()).toBe(true); // the reveal still holds it
    H.hush('reveal', false);
    vi.advanceTimersByTime(H.HUSH_GRACE * 1000 + 5);
    expect(seen).toEqual(['a']);
    H.hush('cine', true); // the next scene starts before 'b'
    vi.advanceTimersByTime(10_000);
    expect(seen).toEqual(['a']);
    H.hushReset();
    expect(H.hushed()).toBe(false);
    vi.advanceTimersByTime(H.HUSH_GRACE * 1000 + 5);
    expect(seen).toEqual(['a', 'b']);
    // a broken popup never blocks the rest
    H.hush('x', true);
    H.whenCalm(() => {
      throw new Error('boom');
    }, 'bad');
    H.whenCalm(() => seen.push('c'), 'c');
    H.hush('x', false);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.advanceTimersByTime(5000);
    expect(seen).toEqual(['a', 'b', 'c']);
  });

  it('a very long scene keeps at most HUSH_MAX popups (the newest)', () => {
    const seen: number[] = [];
    H.hush('cine', true);
    for (let i = 0; i < H.HUSH_MAX + 10; i++) H.whenCalm(() => seen.push(i), `k${i}`);
    expect(H.hushQueue()).toHaveLength(H.HUSH_MAX);
    H.hush('cine', false);
    vi.advanceTimersByTime(60_000);
    expect(seen[0]).toBe(10);
    expect(seen).toHaveLength(H.HUSH_MAX);
  });
});

// ------------------------------------------------------------------ the scenes
class Stage implements CineStage {
  constructor(readonly id: string) {}
  look: WorldLook = W.lookOf('normal');
  fxs: string[] = [];
  blocked() {
    return false;
  }
  alive() {
    return true;
  }
  resolve(t: unknown) {
    return typeof t === 'string' ? { x: 0, y: 0 } : (t as { x: number; y: number });
  }
  cameraGet() {
    return { x: 0, y: 0, zoom: 1 };
  }
  cameraSet() {}
  worldGet() {
    return { ...this.look };
  }
  worldSet(l: WorldLook) {
    this.look = l;
  }
  worldRelease() {}
  actor() {}
  fx(c: { id: string }) {
    this.fxs.push(c.id);
    return () => undefined;
  }
  interact() {
    return { done: new Promise<void>(() => undefined), cancel: () => undefined };
  }
  hud() {}
  drive() {}
  driveGet() {
    return 0;
  }
}
const flush = () => new Promise<void>((r) => setImmediate(r));

/** play a script, pressing SALTAR right away: returns what it persisted */
async function fold(s: CineScript, replay: boolean) {
  const persisted: string[] = [];
  const r = new CineRunner(s, new Stage(s.stage), { persist: (b) => persisted.push(b), lines: () => [['LUZTERNA', '…']], say: () => Promise.resolve() }, { replay });
  const p = r.play();
  r.skip();
  for (let i = 0; i < 20; i++) {
    r.tick(1 / 60);
    await flush();
  }
  return { res: await p, persisted };
}

/** every step of a script, recursively (sequences, parallels, the steps fired on a line) */
function walk(steps: Step[], out: Step[] = []): Step[] {
  for (const s of steps) {
    out.push(s);
    if ('seq' in s) walk(s.seq, out);
    if ('parallel' in s) walk(s.parallel, out);
    if ('say' in s && s.say.onLine) for (const v of Object.values(s.say.onLine)) walk(Array.isArray(v) ? v : [v], out);
    if (s.reduced && s.reduced !== 'skip') walk([s.reduced], out);
  }
  return out;
}

const O1_CINES = ['h31_opening', 'h31_faro', 'reflejo', 'h32_registro', 'h33_amanecer', 'h33_llegada', 'h35_margen', 'h36_eco', 'h38_almirante', 'h40_cristal', 'h41_correccion', 'h41_continuara'];

describe('Oleada 1 scenes: registered, hooked, replayable', () => {
  it('every O1 scene is registered with a stage and a spoiler-safe replay entry, in story order', () => {
    for (const id of O1_CINES) {
      const s = REG.getCine(id);
      expect(s, id).toBeTruthy();
      expect(['island', 'region']).toContain(s!.stage);
      expect(s!.replay?.title.length, id).toBeGreaterThan(3);
      if (s!.stage === 'region') expect(s!.replay?.region, id).toBeTruthy();
      // ≤ 40 s of fixed waits (dialog reading time aside): short scenes
      const waits = walk(s!.steps).reduce((a, st) => a + ('wait' in st && !st.at && !st.async ? st.wait : 0), 0);
      expect(waits, id).toBeLessThanOrEqual(40);
    }
    const orders = O1_CINES.map((id) => REG.getCine(id)!.replay!.order);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
  });

  it('VOLVER A VER lists only what this save has seen, in story order (a reset save lists nothing of Part II)', () => {
    expect(REG.replayList([]).filter((e) => O1_CINES.includes(e.id))).toEqual([]);
    const some = REG.replayList(['b31_estrellas#a', 'b31_estrellas#b', 'b31_reflejo', 'b32_registro#a']).map((e) => e.id);
    expect(some).toEqual(['h31_opening', 'h31_faro', 'reflejo', 'h32_registro']);
    // a whole beat seen (all its parts) counts for its parts
    expect(REG.replayList(['b33_paginas']).map((e) => e.id)).toEqual(['h33_amanecer', 'h33_llegada']);
    const all = REG.replayList(O1_CINES.map((id) => [REG.getCine(id)!.replay!.seen].flat()[0]));
    expect(all.map((e) => e.id).filter((id) => O1_CINES.includes(id))).toEqual(O1_CINES);
    expect(all.find((e) => e.id === 'reflejo')).toMatchObject({ region: 'reflejo' });
  });

  it('a replay never persists anything; played for real, SALTAR still reaches every persist', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    for (const id of O1_CINES) {
      const s = REG.getCine(id)!;
      const rep = await fold(s, true);
      expect(rep.persisted, `${id} (replay)`).toEqual([]);
      expect(rep.res, id).toBe('skipped');
      const real = await fold(s, false);
      const keys = walk(s.steps).flatMap((st) => ('persist' in st ? [st.persist.beat] : []));
      expect(real.persisted, id).toEqual(keys);
      if (id !== 'reflejo') expect(real.persisted, id).toContain([s.replay!.seen].flat()[0]);
    }
  }, 30_000);

  it('every O1 beat played as a cine: right stage, speaks exactly its lines, persists its key; travel = island only', () => {
    const refs = [...Object.values(S.RUPTURAS_ON_NEW), ...Object.values(S.RUPTURAS_ON_DONE)].flat().filter((r) => r.special === 'cine');
    expect(refs.length).toBeGreaterThanOrEqual(10);
    for (const r of refs) {
      const s = REG.getCine(r.cine!);
      const key = `${r.beat}#${r.part}`;
      expect(s, key).toBeTruthy();
      expect(s!.stage, key).toBe(r.onlyOn === 'region' ? 'region' : 'island');
      if (r.travel) expect(r.onlyOn, key).toBe('island');
      const steps = walk(s!.steps);
      expect(steps.some((st) => 'persist' in st && st.persist.beat === key), `${key} persisted by ${r.cine}`).toBe(true);
      const spoken = steps.flatMap((st) => ('say' in st && st.say.beat === r.beat ? (st.say.lines ?? []) : []));
      for (const i of r.lines ?? []) expect(spoken, `${key} line ${i} spoken by ${r.cine}`).toContain(i);
    }
    // the two parts of the Corrector's aftermath play as one scene; part c alone exists if part b was cut short
    expect(REG.getCine('h41_correccion')!.steps.some((st) => 'persist' in st && st.persist.beat === 'b41_corrector#c')).toBe(true);
  });

  it('«Amanece» happens on screen: the night holds until the dawn scene persists, then the scar (and the clock)', () => {
    const PART_I = Array.from({ length: 30 }, (_, i) => `H${String(i + 1).padStart(2, '0')}`);
    const sv = (active: string[], done: string[], beats: string[]) => ({ missions: { active, done: [...PART_I, ...done] }, beatsSeen: beats });
    const beats = ['b31_estrellas#a', 'b31_estrellas#b', 'b31_reflejo', 'b32_registro#a', 'b32_registro#b'];
    expect(W.currentWorldState(sv(['H33'], ['H31', 'H32'], beats)).id).toBe('noche_astral');
    expect(W.currentWorldState(sv(['H33'], ['H31', 'H32'], [...beats, 'b33_paginas#a'])).id).toBe('cielo_roto');
    const dawn = REG.getCine('h33_amanecer')!;
    const steps = walk(dawn.steps);
    const persistAt = steps.findIndex((st) => 'persist' in st);
    const dayAt = steps.findIndex((st) => 'world' in st && st.world.to === 'cielo_roto');
    expect(dayAt).toBeGreaterThan(-1);
    expect(persistAt).toBeGreaterThan(dayAt); // the beat is saved once it IS day
  });
});
