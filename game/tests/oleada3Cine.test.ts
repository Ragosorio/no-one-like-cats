/**
 * Oleada 3 «La Era Astral» as scenes (docs/part-ii/25 «Pasada de cine»):
 * - every O3 beat hooked as a cine points at a registered scene on the right stage, which speaks exactly its lines and
 *   persists its key; the interactions' scenes (seal, logbook) persist their parts BEFORE completing the mission
 * - VOLVER A VER lists them in story order with spoiler-safe titles; a replay never persists; SALTAR reaches every persist
 * - world states: derived from progress only (Part I untouched, reload = same world, the narrative reset rewinds)
 * - the sky/island picture (o3SkyState) is a pure function of the save
 * - music: only variations / amb.* (the originals belong to the Momentos), Fonoteca refs that exist; the Momento hooks
 */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync, statSync } from 'node:fs';

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

await import('../src/state');
const { CineRunner } = await import('../src/cine/runner');
const REG = await import('../src/cine/registry');
const W = await import('../src/state/sys/worldState');
await import('../src/state/sys/rupturasO3');
const S = await import('../src/ui/story/rupturasScriptO3');
const C3 = await import('../src/ui/story/o3Cines');
const SKY = await import('../src/ui/story/o3Sky');
const { hasTrack } = await import('../src/audio/catalog');
const { BEAT_BY_ID } = await import('../src/data/content');
type CineScript = import('../src/cine/types').CineScript;
type CineStage = import('../src/cine/types').CineStage;
type Step = import('../src/cine/types').Step;
type WorldLook = import('../src/state/sys/worldState').WorldLook;

class Stage implements CineStage {
  constructor(readonly id: string) {}
  look: WorldLook = W.lookOf('normal');
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
  fx() {
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
const PART_I = Array.from({ length: 30 }, (_, i) => `H${String(i + 1).padStart(2, '0')}`);
const O12 = Array.from({ length: 19 }, (_, i) => `H${31 + i}`);
const sv = (active: string[], done: string[], beats: string[] = []) => ({ missions: { active, done: [...PART_I, ...O12, ...done] }, beatsSeen: beats });

describe('Oleada 3 scenes', () => {
  it('registered, on a stage, spoiler-safe replay titles in story order', () => {
    const withReplay = C3.O3_CINES.filter((s) => s.replay);
    expect(withReplay.length).toBe(14);
    for (const s of C3.O3_CINES) {
      expect(REG.getCine(s.id), s.id).toBe(s);
      expect(['island', 'region']).toContain(s.stage);
      if (s.stage === 'region' && s.replay) expect(s.replay.region, s.id).toBe('cometa');
    }
    const orders = withReplay.map((s) => s.replay!.order);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
    // titles never name what the scene reveals
    for (const s of withReplay) expect(s.replay!.title, s.id).not.toMatch(/Astral|Titirit|REGISTRO|Leviat|Jon[aá]s|hospital/i);
    expect(REG.replayList([]).filter((e) => e.id.startsWith('h5'))).toEqual([]);
    expect(REG.replayList(['b53_canelo']).map((e) => e.id)).toEqual(['h53_sello', 'h53_romper', 'h53_penasco']);
  });

  it('every O3 beat played as a cine: right stage, speaks exactly its lines, persists its key; travel = island only', () => {
    const refs = [...Object.values(S.O3_ON_NEW), ...Object.values(S.O3_ON_DONE)].flat().filter((r) => r.special === 'cine');
    expect(refs.length).toBe(12);
    for (const r of refs) {
      const s = REG.getCine(r.cine!);
      const key = `${r.beat}#${r.part}`;
      expect(s, key).toBeTruthy();
      expect(s!.stage, key).toBe(r.onlyOn === 'region' ? 'region' : 'island');
      if (r.travel) expect(r.onlyOn, key).toBe('island');
      const steps = walk(s!.steps);
      expect(steps.some((st) => 'persist' in st && st.persist.beat === key), `${key} persisted by ${r.cine}`).toBe(true);
      const spoken = steps.flatMap((st) => ('say' in st && st.say.beat === r.beat ? (st.say.lines ?? []) : []));
      expect([...spoken].sort(), key).toEqual([...(r.lines ?? [])].sort());
    }
  });

  it('the interactions are scenes too: the seal and the logbook say their parts and persist them before the mission', () => {
    const seal = walk(C3.H53_ROMPER.steps);
    const p = seal.findIndex((st) => 'persist' in st && st.persist.beat === 'b53_canelo#b');
    const said = seal.flatMap((st) => ('say' in st && st.say.beat === 'b53_canelo' ? (st.say.lines ?? []) : []));
    expect(p).toBeGreaterThan(-1);
    expect(said).toEqual(S.O3_ON_DONE.H53[0].lines);
    for (const id of ['h56_firma', 'h56_firma_cometa']) {
      const st = walk(REG.getCine(id)!.steps);
      const keys = st.flatMap((x) => ('persist' in x ? [x.persist.beat] : []));
      expect(keys, id).toEqual(['b56_nota#b', 'b56_nota#c', 'b56_nota']);
      const lines = st.flatMap((x) => ('say' in x && x.say.beat === 'b56_nota' ? (x.say.lines ?? []) : []));
      expect(lines, id).toEqual(S.O3_ON_DONE.H56[0].lines);
    }
    // the story's own refs for those parts only exist as fallbacks: dialog, no scene of their own
    expect(S.O3_ON_DONE.H53[0].special).toBeUndefined();
    expect(S.O3_ON_DONE.H56[0].special).toBeUndefined();
  });

  it('a replay never persists anything; played for real, SALTAR still reaches every persist', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    for (const s of C3.O3_CINES) {
      const rep = await fold(s, true);
      expect(rep.persisted, `${s.id} (replay)`).toEqual([]);
      const real = await fold(s, false);
      const keys = walk(s.steps).flatMap((st) => ('persist' in st ? [st.persist.beat] : []));
      expect(real.persisted, s.id).toEqual(keys);
    }
  }, 30_000);

  it('the lines the world now shows are gone; every beat id is still there', () => {
    const ids = ['b50_cometa', 'b51_sincronia', 'b52_estrella', 'b53_canelo', 'b54_maneki', 'b55_disruptores', 'b56_nota', 'b57_leviatan'];
    for (const id of ids) expect(BEAT_BY_ID.get(id), id).toBeTruthy();
    const caps = (id: string) => BEAT_BY_ID.get(id)!.lines.filter(([sp]) => sp === 'CAPTION').map(([, t]) => t);
    expect(caps('b50_cometa')).toEqual([]);
    expect(caps('b53_canelo')).toEqual([]);
    expect(caps('b57_leviatan')).toEqual([]);
  });
});

describe('Oleada 3 world states', () => {
  it('Part I and Oleadas 1–2 saves never see them', () => {
    expect(W.currentWorldState({ missions: { active: ['H10'], done: PART_I.slice(0, 9) }, beatsSeen: [] }).wave ?? 'base').not.toBe('O3');
    expect(W.currentWorldState(sv(['H50'], [])).wave).not.toBe('O3');
    for (const f of ['late-game', 'post-story', 'post-finale']) {
      const env = JSON.parse(readFileSync(new URL(`../test-saves/${f}.json`, import.meta.url), 'utf8'));
      const st = env.state ?? env;
      expect(W.currentWorldState(st).id, f).toBe('normal');
      expect(SKY.o3SkyState(st, true), f).toEqual(SKY.O3_SKY_NONE);
      expect(SKY.o3Reached(st), f).toBe(false);
    }
  });

  it('derived from progress: each scene leaves the world it says; the same save = the same world', () => {
    expect(W.currentWorldState(sv(['H50'], [], ['b50_cometa#a'])).id).toBe('o3_costura');
    expect(W.currentWorldState(sv(['H52'], ['H50', 'H51'])).id).toBe('o3_costura');
    expect(W.currentWorldState(sv(['H52'], ['H50', 'H51'], ['b52_estrella#a'])).id).toBe('o3_remolcadora');
    expect(W.currentWorldState(sv(['H53'], ['H50', 'H51', 'H52'], ['b53_canelo#a'])).id).toBe('o3_sello');
    expect(W.currentWorldState(sv(['H54'], ['H50', 'H51', 'H52', 'H53'])).id).toBe('o3_costura');
    expect(W.currentWorldState(sv(['H55'], ['H50', 'H51', 'H52', 'H53', 'H54'], ['b55_disruptores#a'])).id).toBe('o3_grafiti');
    expect(W.currentWorldState(sv(['H57'], ['H50', 'H51', 'H52', 'H53', 'H54', 'H55', 'H56'], ['b57_leviatan#a'])).id).toBe('o3_leviatan');
    const after = sv([], ['H50', 'H51', 'H52', 'H53', 'H54', 'H55', 'H56', 'H57']);
    expect(W.currentWorldState(after).id).toBe('o3_grieta');
    expect(W.currentWorldState(JSON.parse(JSON.stringify(after))).id).toBe('o3_grieta');
    // the narrative reset rewinds the missions and the beats: the world rewinds with them
    expect(W.currentWorldState(sv(['H31'], [])).wave).not.toBe('O3');
    for (const d of W.worldStates().filter((x) => x.wave === 'O3')) {
      expect(d.priority, d.id).toBeGreaterThanOrEqual(70);
      expect(d.priority, d.id).toBeLessThanOrEqual(99);
      expect(W.lookOf(d).lift, d.id).toBeGreaterThanOrEqual(0);
    }
  });

  it('the sky and the island keep what the story put there', () => {
    const st = (active: string[], done: string[], beats: string[] = [], night = false) => SKY.o3SkyState(sv(active, done, beats), night);
    expect(st(['H50'], [])).toEqual(SKY.O3_SKY_NONE);
    expect(st(['H50'], [], ['b50_cometa#a']).rift).toBe(1);
    expect(st(['H52'], ['H50', 'H51'], ['b52_estrella#a']).tug).toBe(1);
    const seal = st(['H53'], ['H50', 'H51', 'H52'], ['b53_canelo#a']);
    expect([seal.seal, seal.vigil]).toEqual([1, 'seal']);
    // after the seal: the rock stays; at night Canelo sits watching it (only at night)
    expect(st(['H54'], ['H50', 'H51', 'H52', 'H53'], [], false).vigil).toBe(null);
    expect(st(['H54'], ['H50', 'H51', 'H52', 'H53'], [], true)).toMatchObject({ vigil: 'rock', rock: 1, seal: 0 });
    expect(st(['H56'], ['H50', 'H51', 'H52', 'H53', 'H54', 'H55']).tag).toBe(1);
    const end = st([], ['H50', 'H51', 'H52', 'H53', 'H54', 'H55', 'H56', 'H57']);
    expect([end.grieta, end.lev, end.graffiti]).toEqual([1, 0, 0]);
  });
});

describe('Oleada 3 music', () => {
  it('scenes cue only variations / amb.* (the six originals belong to the Momentos musicales)', () => {
    const src = readFileSync(new URL('../src/ui/story/o3Cines.ts', import.meta.url), 'utf8');
    const refs = [...src.matchAll(/cue(?:Owned|Best)\(c?,?\s*\[([^\]]+)\]/g)].flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
    expect(refs.length).toBeGreaterThan(6);
    const ORIG = ['liky_fight', 'hemkade', 'when_i_lose', 'circus_malus', 'te_odio', 'yonose_todo'];
    for (const r of refs) expect(ORIG.includes(r) || r.endsWith('.original'), r).toBe(false);
    const cometa = readFileSync(new URL('../src/regions/cometa.ts', import.meta.url), 'utf8');
    expect(cometa).toContain("setState('explore', { fade: 2, context: 'cometa' })");
  });

  it('Fonoteca: only variations, unlocked once (idempotent) — and only those whose recording exists', () => {
    for (const s of C3.O3_SONGS) expect(s.ref.includes('.'), s.ref).toBe(true);
    // recorded since COMPOSER (docs/part-ii/30): the record exists and so does its file (unlockSoon skips refs without one)
    expect(hasTrack('amb.archivo')).toBe(true);
    expect(statSync(new URL('../public/music/amb.archivo.m4a', import.meta.url)).size).toBeGreaterThan(100_000);
  });

  it('the two Momentos have their hooks marked in the wave flow (built by the Momento engine, not here)', () => {
    const flow = readFileSync(new URL('../src/app/oleada3Flow.ts', import.meta.url), 'utf8');
    expect(flow).toContain('// MOMENTO: te_odio (H55, before the glitch phase)');
    expect(flow).toContain('// MOMENTO: hemkade (H57, layer change)');
  });
});
