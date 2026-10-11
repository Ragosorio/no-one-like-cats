/**
 * Oleada 2 «El Cielo Despierta» as scenes (docs/part-ii/22-oleada-2.md «Pasada de cine»):
 * - every O2 beat hooked as a cine points at a registered scene on the right stage, which speaks exactly the ref's
 *   lines and persists the ref's key; SALTAR always reaches each persist; a replay persists nothing
 * - VOLVER A VER lists the seen O2 scenes in story order with spoiler-safe titles
 * - the world: O2 states derived only from mission progress (+ the lantern's invitation), Part I untouched, a reload
 *   and the narrative reset land on the same world; the sky prop's derivation (ui/story/o2Sky.ts) likewise
 * - REGISTRO 000's O2 line, the Fonoteca records of the wave, and the owner's rule: no ORIGINAL song is cued here
 * - the H44 «Momento musical» hook is in place (it is built elsewhere)
 */
import { describe, expect, it, vi } from 'vitest';
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

await import('../src/state');
const { CineRunner } = await import('../src/cine/runner');
const REG = await import('../src/cine/registry');
const O2C = await import('../src/ui/story/o2Cines');
const S = await import('../src/ui/story/rupturasScriptO2');
const W = await import('../src/state/sys/worldState');
const O2 = await import('../src/state/sys/rupturasO2');
const SKY = await import('../src/ui/story/o2Sky');
const REGI = await import('../src/ui/story/o2Registro');
const { BEAT_BY_ID } = await import('../src/data/content');
const tracks = JSON.parse(readFileSync(new URL('../src/data/music/tracks.json', import.meta.url), 'utf8')) as { id: string; variations?: { id: string }[] }[];
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

const O2_IDS = O2C.O2_CINES.map((s) => s.id);
const PART_I = Array.from({ length: 30 }, (_, i) => `H${String(i + 1).padStart(2, '0')}`);
const O1 = ['H31', 'H32', 'H33', 'H34', 'H35', 'H36', 'H37', 'H38', 'H39', 'H40', 'H41'];
const O2M = ['H42', 'H43', 'H44', 'H45', 'H46', 'H47', 'H48', 'H49'];
type Save = { missions: { active: string[]; done: string[] }; beatsSeen: string[] };
/** a save with Oleada 1 closed and the O2 missions before `m` done, `m` active */
const at = (m: string | null, beats: string[] = []): Save => {
  const i = m ? O2M.indexOf(m) : O2M.length;
  return { missions: { active: m ? [m] : [], done: [...PART_I, ...O1, ...O2M.slice(0, i)] }, beatsSeen: beats };
};
const fixture = (name: string): Save => JSON.parse(readFileSync(new URL(`../test-saves/${name}.json`, import.meta.url), 'utf8')).state;

describe('Oleada 2 scenes: registered, hooked, replayable', () => {
  it('every O2 scene is registered with a stage and a spoiler-safe replay entry, in story order; short', () => {
    expect(O2_IDS.length).toBeGreaterThanOrEqual(18);
    for (const id of O2_IDS) {
      const s = REG.getCine(id);
      expect(s, id).toBeTruthy();
      expect(['island', 'region']).toContain(s!.stage);
      expect(s!.replay?.title.length, id).toBeGreaterThan(3);
      expect(s!.skippable, id).not.toBe(false);
      if (s!.stage === 'region') expect(['invertidas', 'corona'], id).toContain(s!.replay?.region);
      const waits = walk(s!.steps).reduce((a, st) => a + ('wait' in st && !st.at && !st.async ? st.wait : 0), 0);
      expect(waits, id).toBeLessThanOrEqual(40);
      // the letterbox and SALTAR from the first step
      expect(JSON.stringify(s!.steps[0]), id).toContain('"skip":true');
    }
    const orders = [...O2_IDS].sort((a, b) => REG.getCine(a)!.replay!.order - REG.getCine(b)!.replay!.order).map((id) => REG.getCine(id)!.replay!.order);
    expect(new Set(orders).size).toBe(orders.length);
    // titles never name who the Almirante or the hand belong to
    for (const id of O2_IDS) expect(REG.getCine(id)!.replay!.title, id).not.toMatch(/Corrector|Titiriter|Leviat/i);
  });

  it('every O2 beat played as a cine: right stage, speaks exactly its lines, persists its key; travel = island only', () => {
    const refs = [...Object.values(S.O2_ON_NEW), ...Object.values(S.O2_ON_DONE)].flat();
    expect(refs.every((r) => r.special === 'cine')).toBe(true);
    for (const r of refs) {
      const s = REG.getCine(r.cine!);
      const key = `${r.beat}#${r.part}`;
      expect(s, key).toBeTruthy();
      expect(s!.stage, key).toBe(r.onlyOn === 'region' ? 'region' : 'island');
      expect(r.onlyOn, key).toBeTruthy();
      if (r.travel) expect(r.onlyOn, key).toBe('island');
      const steps = walk(s!.steps);
      expect(steps.some((st) => 'persist' in st && st.persist.beat === key), `${key} persisted by ${r.cine}`).toBe(true);
      const spoken = steps.flatMap((st) => ('say' in st && st.say.beat === r.beat ? (st.say.lines ?? []) : []));
      for (const i of r.lines ?? []) expect(spoken, `${key} line ${i} spoken by ${r.cine}`).toContain(i);
      // and nothing more than the beat has
      const b = BEAT_BY_ID.get(r.beat)!;
      for (const i of spoken) expect(i, key).toBeLessThan(b.lines.length);
    }
  });

  it('a replay never persists anything; played for real, SALTAR still reaches every persist', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    for (const id of O2_IDS) {
      const s = REG.getCine(id)!;
      const rep = await fold(s, true);
      expect(rep.persisted, `${id} (replay)`).toEqual([]);
      expect(rep.res, id).toBe('skipped');
      const real = await fold(s, false);
      const keys = walk(s.steps).flatMap((st) => ('persist' in st ? [st.persist.beat] : []));
      expect(real.persisted, id).toEqual(keys);
      expect(real.persisted, id).toContain([s.replay!.seen].flat()[0]);
    }
  }, 30_000);

  it('VOLVER A VER lists only what this save has seen, in story order (a reset save lists nothing of Oleada 2)', () => {
    expect(REG.replayList([]).filter((e) => O2_IDS.includes(e.id))).toEqual([]);
    const some = REG.replayList(['b42_trombas#a', 'b42_trombas#b', 'b43_kit#a']).map((e) => e.id);
    expect(some).toEqual(['h42_trombas', 'h42_arriba', 'h43_helice']);
    expect(REG.replayList(['b45_corona']).find((e) => e.id === 'h45_ciudad')).toMatchObject({ region: 'corona' });
    const all = REG.replayList(O2_IDS.map((id) => [REG.getCine(id)!.replay!.seen].flat()[0])).filter((e) => O2_IDS.includes(e.id));
    expect(all.map((e) => e.id).sort()).toEqual([...O2_IDS].sort());
  });
});

describe('Oleada 2 world: derived from the story', () => {
  const id = (s: Save | null) => W.currentWorldState(s).id;
  it('Part I and Oleada 1 saves never see an O2 state; every O2 state sits in its band', () => {
    expect(id(fixture('late-game'))).toBe('normal');
    expect(id(fixture('post-story'))).toBe('normal');
    expect(id(fixture('post-finale'))).toBe('normal');
    expect(id({ missions: { active: ['H41'], done: [...PART_I, ...O1.slice(0, 10)] }, beatsSeen: [] })).toBe('cielo_roto');
    const o2 = W.worldStates().filter((d) => d.wave === 'O2');
    expect(o2.map((d) => d.id).sort()).toEqual(Object.values(O2.O2_STATES).sort());
    for (const d of o2) {
      expect(d.priority, d.id).toBeGreaterThanOrEqual(40);
      expect(d.priority, d.id).toBeLessThan(70);
    }
  });

  it('H42 → H49: the sky wakes up, Corona whitens the light, the lantern’s night, the oven, and the seam that stays', () => {
    expect(id(at('H42'))).toBe('o2_trombas');
    expect(id(at('H43'))).toBe('o2_cielo');
    expect(id(at('H44'))).toBe('o2_cielo');
    expect(id(at('H45'))).toBe('o2_corona');
    expect(id(at('H46'))).toBe('o2_corona');
    expect(id(at('H47'))).toBe('o2_almirante');
    expect(id(at('H48'))).toBe('o2_senal');
    // the lantern's night holds until her answer's scene played
    expect(id(at('H49'))).toBe('o2_senal');
    expect(id(at('H49', ['b48_linterna#b']))).toBe('o2_masa');
    expect(id(at(null))).toBe('o2_costura');
    // a story night stays a story night; the days follow the player's clock (like O1's scar)
    expect(W.worldStateById('o2_senal')!.clock).toBeFalsy();
    for (const s of ['o2_trombas', 'o2_cielo', 'o2_corona', 'o2_almirante', 'o2_masa', 'o2_costura']) expect(W.worldStateById(s)!.clock, s).toBe(true);
    // nights are never black (08 §4) and the seam only grows
    const senal = W.lookOf('o2_senal');
    expect(senal.lift).not.toBe(0);
    expect(W.lookOf('o2_costura').seam).toBeGreaterThan(W.lookOf('cielo_roto').seam);
  });

  it('the faro invites (TOCA EL FARO) only after she asked, until you answer; a reload / the reset land on the same world', () => {
    const def = W.worldStateById('o2_senal')!;
    expect(def.prompt?.target).toBe('faro');
    expect(def.prompt!.when!(at('H48'))).toBe(false);
    expect(def.prompt!.when!(at('H48', [O2.LINTERNA_ASKED]))).toBe(true);
    // reload: the same save → the same state (pure)
    const s = at('H47', ['b47_almirante#a']);
    expect(id(JSON.parse(JSON.stringify(s)))).toBe(id(s));
    // the narrative reset clears Parte II's progress: no O2 state survives it
    expect(id({ missions: { active: ['H31'], done: PART_I }, beatsSeen: [] })).toBe('presagio');
  });

  it('the sky prop (o2Sky): trombas → the way up + hanging islands → Corona for good; your balloon with the kit; Part I draws nothing', () => {
    const f = SKY.o2SkyFor;
    expect(SKY.o2SkyAny(f(fixture('late-game')))).toBe(false);
    expect(SKY.o2SkyAny(f(fixture('post-finale')))).toBe(false);
    expect(f(at('H42'))).toMatchObject({ trombas: 1, islas: 0, elevator: 0 });
    expect(f(at('H43'))).toMatchObject({ trombas: 0, islas: 1, elevator: 1, balloon: 0 });
    expect(f(at('H43'), true).balloon).toBe(1);
    expect(f(at('H44'))).toMatchObject({ cascada: 1, balloon: 1, corona: 0 });
    expect(f(at('H45')).corona).toBe(1);
    expect(f(at('H46')).embajada).toBe(1);
    expect(f(at('H47')).galeon).toBe(1);
    expect(f(at('H48')).signal).toBe(1);
    expect(f(at('H49'))).toMatchObject({ tilt: 1, signal: 0.5, corona: 1 });
    expect(f(at(null))).toMatchObject({ tilt: 0, corona: 1, islas: 1, signal: 0.5, galeon: 0, cascada: 0 });
  });
});

describe('Oleada 2 surfaces and sound', () => {
  it('REGISTRO 000 gains «Visto: Corona Celeste.» once Corona was seen (and not before)', () => {
    expect(REGI.registroO2LineFor(at('H45'))).toBeNull();
    expect(REGI.registroO2LineFor(at('H45', ['b45_corona#c']))).toBe(S.REGISTRO_O2_LINE);
    expect(REGI.registroO2LineFor(at('H46'))).toBe(S.REGISTRO_O2_LINE);
    expect(REGI.registroO2LineFor(fixture('late-game'))).toBeNull();
    const panel = readFileSync(new URL('../src/panels/collection/registro000.ts', import.meta.url), 'utf8');
    expect(panel).toContain('addRegistroO2Line(');
  });

  it('the Fonoteca records of the wave exist and are VARIATIONS; no O2 scene cues an original song (Momentos musicales)', () => {
    const refs = new Set(tracks.flatMap((t) => [t.id, ...(t.variations ?? []).map((v) => v.id)]));
    const ORIGINALS = ['liky_fight', 'hemkade', 'when_i_lose', 'circus_malus', 'te_odio', 'yonose_todo'];
    for (const s of O2C.O2_SONGS) {
      expect(refs.has(s.ref) || refs.has(s.ref.split('.').pop()!), s.ref).toBe(true);
      expect(ORIGINALS, s.ref).not.toContain(s.ref);
    }
    const src = readFileSync(new URL('../src/ui/story/o2Cines.ts', import.meta.url), 'utf8') + readFileSync(new URL('../src/app/oleada2Flow.ts', import.meta.url), 'utf8');
    const cued = [...src.matchAll(/cue(?:Best|Owned)\((?:c,\s*)?\[([^\]]*)\]/g)].flatMap((m) => m[1].split(',').map((x) => x.trim().replace(/['"]/g, '')).filter(Boolean));
    expect(cued.length).toBeGreaterThan(8);
    for (const r of cued) expect(ORIGINALS, `cued: ${r}`).not.toContain(r);
    expect(src).not.toMatch(/audioApi\.cue\(\s*['"](liky_fight|hemkade|when_i_lose|circus_malus|te_odio|yonose_todo)['"]/);
    // and no scene asks the director for 'emotional' (its default is the original YONOSE TODO)
    expect(src).not.toMatch(/state:\s*'emotional'|setState\('emotional'/);
  });

  it('the H44 «Momento musical» hook is marked where it goes (between phase 1 and 2)', () => {
    const src = readFileSync(new URL('../src/state/sys/rupturasO2.ts', import.meta.url), 'utf8');
    expect(src).toContain('// MOMENTO: liky_fight (H44, between phase 1 and 2)');
  });

  it('the CARTA’s IR for H43 goes to the sky sheet (chartFeature), not to Misiones', () => {
    const map = readFileSync(new URL('../src/scenes/MapScene.ts', import.meta.url), 'utf8');
    expect(map).toMatch(/\['kit_vuelo', 'linterna'\]\.includes[\s\S]{0,200}chartFeature/);
    const flow = readFileSync(new URL('../src/app/oleada2Flow.ts', import.meta.url), 'utf8');
    expect(flow).toMatch(/focusIsle\?\.\('invertidas'/);
  });
});
