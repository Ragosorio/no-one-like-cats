/**
 * PELÍCULAS (docs/part-iii/cine-v2/02-api.md) — the pure core: the timeline of scenes and transitions, the time base,
 * the film as a Momento (zero authoring warnings for the demo), DETERMINISM (the same instant always resolves to the
 * same scene, transition, camera and score), NO INPUT REQUIRED (0–3 optional inputs that never grade anything), the
 * skip rules, the originals rule, and the «Reducir movimiento» paths of the camera and the transitions.
 */
import { describe, expect, it } from 'vitest';
import { DEMO } from '../src/film/demo';
import { activeAt, bakeManifest, filmInputs, isOriginalRef, localT, MAX_INPUTS, sceneTimeline, skipMode, skipRule, syntheticMap, timeBase, toMomentoDef, validateFilm } from '../src/film/timeline';
import { boilStep, camAt, flatten, FOCAL, frameCam, handheld, moves, project, REST, sceneCam, shot } from '../src/film/camera';
import { resolveScore } from '../src/momentos/score';
import { MomentoCore } from '../src/momentos/core';
import { tap, hold, v } from '../src/momentos/score';
import type { FilmDef } from '../src/film/types';
import { TRANSITIONS } from '../src/film/catalog';

const noSet = async () => ({ build: () => ({ update: () => undefined }) });
const stage = async () => () => null;

describe('film timeline', () => {
  const tl = sceneTimeline(DEMO);
  it('scenes overlap by their transition, the first comes from black, the close covers the end', () => {
    expect(tl.scenes.map((s) => s.id)).toEqual(['noche', 'estudio', 'lluvia', 'fin']);
    expect(tl.scenes[0].start).toBe(0);
    for (let i = 1; i < tl.scenes.length; i++) {
      const prev = tl.scenes[i - 1];
      const s = tl.scenes[i];
      expect(s.start).toBeCloseTo(prev.end - s.inT.dur, 6);
      expect(s.inT.dur).toBeLessThanOrEqual(Math.min(prev.end - prev.start, s.end - s.start) / 2 + 1e-9);
    }
    expect(tl.length).toBeCloseTo(tl.scenes[3].end, 6);
    // the demo is 30–60 s
    expect(tl.length).toBeGreaterThanOrEqual(30);
    expect(tl.length).toBeLessThanOrEqual(60);
  });

  it('activeAt: black → reveal → scene → transition → scene … → close → black', () => {
    const a0 = activeAt(tl, 0.5);
    expect([a0.a, a0.b, a0.t?.kind]).toEqual([-1, 0, 'paintSmear']);
    expect(activeAt(tl, 5)).toEqual({ a: 0, b: -1, p: 0, t: null });
    const mid = activeAt(tl, tl.scenes[1].start + tl.scenes[1].inT.dur / 2);
    expect([mid.a, mid.b, mid.t?.kind]).toEqual([0, 1, 'match']);
    expect(mid.p).toBeCloseTo(0.5, 6);
    const turn = activeAt(tl, tl.scenes[2].start + 0.1);
    expect([turn.a, turn.b, turn.t?.kind]).toEqual([1, 2, 'pageTurn']);
    const close = activeAt(tl, tl.length - tl.close.dur / 2);
    expect([close.a, close.b, close.t?.kind]).toEqual([3, -1, 'fade']);
    expect(activeAt(tl, tl.length + 1)).toEqual({ a: -1, b: -1, p: 0, t: null });
    expect(localT(tl, 2, tl.scenes[2].start + 3)).toBeCloseTo(3, 9);
  });

  it('is DETERMINISTIC: the same instant always gives the same scene, transition and camera', () => {
    const sample = (m: number) => {
      const act = activeAt(tl, m);
      const i = act.b >= 0 && act.p >= 0.5 ? act.b : act.a;
      const cam = i >= 0 ? frameCam(DEMO.scenes[i].cam, localT(tl, i, m), { seed: 3 + i }) : null;
      return JSON.stringify({ act, cam });
    };
    const ms = Array.from({ length: 200 }, (_, i) => (i * tl.length) / 199);
    const a = ms.map(sample);
    // scrubbing backwards and in a random order gives the very same frames
    const b = [...ms].reverse().map(sample).reverse();
    const order = ms.map((m, i) => ({ m, i })).sort((x, y) => Math.sin(x.i * 7.1) - Math.sin(y.i * 7.1));
    const c: string[] = [];
    for (const o of order) c[o.i] = sample(o.m);
    expect(b).toEqual(a);
    expect(c).toEqual(a);
    // the score resolves to the same cues every time
    const map = timeBase(DEMO, null);
    const r1 = resolveScore(toMomentoDef(DEMO, stage), map);
    const r2 = resolveScore(toMomentoDef(DEMO, stage), map);
    expect(JSON.stringify(r1.cues)).toBe(JSON.stringify(r2.cues));
  });

  it('the synthetic time base: 60 BPM, scenes as sections, ends as markers (scene names address time)', () => {
    const map = syntheticMap(DEMO);
    expect(map.bpm).toBe(60);
    expect(map.sections.map((s) => s.name)).toEqual(['noche', 'estudio', 'lluvia', 'fin']);
    expect(map.markers.some((x) => x.name === 'lluvia_end')).toBe(true);
    expect(map.beats[1] - map.beats[0]).toBeCloseTo(1, 9);
  });

  it('the demo validates with ZERO warnings (scenes, cards, subtitles, camera, score)', () => {
    expect(validateFilm(DEMO)).toEqual([]);
    const md = toMomentoDef(DEMO, stage);
    expect(md.id).toBe('film:demo');
    const r = resolveScore(md, timeBase(DEMO, null));
    expect(r.warnings).toEqual([]);
    // cards, subtitles and the lightning strike are compiled into cues
    const verbs = r.cues.map((c) => c.act.verb);
    expect(verbs.filter((x) => x === 'card').length).toBe(4);
    expect(verbs.filter((x) => x === 'sub').length).toBe(6);
    expect(verbs.filter((x) => x === 'lightning').length).toBe(1);
    expect(r.mCut).toBeCloseTo(sceneTimeline(DEMO).length, 6);
  });
});

describe('film inputs: none required, at most 3, never graded', () => {
  it('the demo needs ZERO clicks: no prompts at all', () => {
    expect(filmInputs(DEMO)).toEqual([]);
    const r = resolveScore(toMomentoDef(DEMO, stage), timeBase(DEMO, null));
    expect(r.prompts).toEqual([]);
    const core = new MomentoCore(r, 'none');
    core.advance(r.mCut + 1);
    expect(core.finished).toBe(true);
  });

  const withInputs = (n: number, extra: Partial<FilmDef> = {}): FilmDef => ({
    id: 'prueba',
    title: 'Prueba',
    kind: 'interlude',
    scenes: [{ id: 'uno', dur: 20, style: 'noir', set: noSet }],
    score: Array.from({ length: n }, (_, i) => tap(2 + i * 4, { id: `t${i}`, optional: false }, { great: [v('sparkle')], miss: [] })),
    ...extra,
  });

  it('inputs are always OPTIONAL (whatever the author wrote) and the outcome is the same with or without them', () => {
    const def = withInputs(2);
    // the author wrote optional: false → the validator says so, and the film marks it optional anyway
    expect(validateFilm(def).some((w) => w.includes('opcional'))).toBe(true);
    const r = resolveScore(toMomentoDef(def, stage), timeBase(def, null));
    expect(r.prompts.every((p) => p.optional)).toBe(true);
    const untouched = new MomentoCore(r, 'none');
    untouched.advance(r.mCut + 1);
    const perfect = new MomentoCore(r, 'great');
    perfect.advance(r.mCut + 1);
    // nothing is graded down: no misses counted, only bonus flourishes
    expect(untouched.result().counts).toEqual({ great: 0, hit: 0, miss: 0, bonus: 0 });
    expect(perfect.result().counts).toEqual({ great: 0, hit: 0, miss: 0, bonus: 2 });
    expect(untouched.result().grade).toBe(perfect.result().grade);
  });

  it('more than 3 inputs, a mash, or a branch that changes scene are authoring errors', () => {
    expect(validateFilm(withInputs(MAX_INPUTS + 1)).some((w) => w.includes('de 0 a 3'))).toBe(true);
    const mash = withInputs(0, {
      score: [{ kind: 'input', when: 3, input: { type: 'mash', id: 'm', until: 6, need: [3, 6], optional: true }, branches: { great: [] } }],
    });
    expect(validateFilm(mash).some((w) => w.includes('machaqueo'))).toBe(true);
    const sceneBranch = withInputs(0, { score: [hold(3, 6, { id: 'h', optional: true }, { great: [v('scene', { id: 'uno' })] })] });
    expect(validateFilm(sceneBranch).some((w) => w.includes('no puede cambiar de escena'))).toBe(true);
  });
});

describe('film rules', () => {
  it('skip: song films never on the first view (then SALIR in the pause menu); briefings get SALTAR after one view', () => {
    expect(skipRule({ kind: 'song' })).toEqual({ first: 'never', after: 'pause' });
    expect(skipMode({ kind: 'song' }, false)).toBe('never');
    expect(skipMode({ kind: 'song' }, true)).toBe('pause');
    expect(skipMode({ kind: 'briefing' }, false)).toBe('never');
    expect(skipMode({ kind: 'briefing' }, true)).toBe('button');
    expect(skipMode({ kind: 'demo' }, false)).toBe('button');
    expect(skipMode({ kind: 'briefing', skip: { first: 'pause' } }, false)).toBe('pause');
  });

  it('owner originals only in a song film; briefings and the demo use silence or a derived variation', () => {
    expect(isOriginalRef('drunck')).toBe(true);
    expect(isOriginalRef('drunck.original')).toBe(true);
    expect(isOriginalRef('liky_fight')).toBe(true);
    expect(isOriginalRef('drunck.resaca')).toBe(false);
    expect(isOriginalRef('drunck.barra')).toBe(false);
    expect(DEMO.track ?? null).toBeNull();
    const brief: FilmDef = { id: 'antes', title: 'Antes', kind: 'briefing', track: 'drunck', scenes: [{ id: 'uno', dur: 30, style: 'noir', set: noSet }] };
    expect(validateFilm(brief).some((w) => w.includes('ORIGINAL'))).toBe(true);
    expect(validateFilm({ ...brief, track: 'drunck.resaca' }).filter((w) => w.includes('ORIGINAL'))).toEqual([]);
    expect(validateFilm({ ...brief, kind: 'song', track: 'drunck' }).filter((w) => w.includes('ORIGINAL'))).toEqual([]);
  });

  it('a briefing lasts 20–60 s; unknown styles, transitions and weather are caught', () => {
    const short: FilmDef = { id: 'corta', title: 'Corta', kind: 'briefing', scenes: [{ id: 'uno', dur: 8, style: 'noir', set: noSet }] };
    expect(validateFilm(short).some((w) => w.includes('20 a 60'))).toBe(true);
    const bad: FilmDef = {
      id: 'mala',
      title: 'Mala',
      kind: 'interlude',
      scenes: [{ id: 'uno', dur: 10, style: 'picasso', set: noSet, in: { kind: 'zoomblur' as never, dur: 1 }, weather: [{ kind: 'tornado' as never }] }],
    };
    const w = validateFilm(bad);
    expect(w.some((x) => x.includes('estilo desconocido'))).toBe(true);
    expect(w.some((x) => x.includes('transición desconocida'))).toBe(true);
    expect(w.some((x) => x.includes('clima desconocido'))).toBe(true);
  });

  it('the bake manifest lists the core, every style and every weather the film uses', () => {
    const list = bakeManifest(DEMO);
    for (const j of ['core:tile', 'core:post', 'core:transition', 'core:type', 'vangogh:strokes', 'vangogh:impasto-cats', 'davinci:parchment', 'davinci:sketch-cats', 'noir:cats', 'noir:light', 'weather:streaks', 'weather:fog', 'weather:rays', 'weather:bolts', 'weather:particles'])
      expect(list, j).toContain(j);
  });
});

describe('the 2.5D camera', () => {
  it('keys tween from the previous value; named moves write keys; at rest every plane is 1:1', () => {
    const keys = shot(moves.dolly(1, 3, 0, 200), moves.crane(0, 2, 540, 300), moves.rack(0, 1, 500, 1000));
    expect(camAt(keys, 0).y).toBe(540);
    expect(camAt(keys, 2).y).toBe(300);
    expect(camAt(keys, 2).z).toBeCloseTo(100, 6);
    expect(camAt(keys, 3).z).toBe(200);
    expect(camAt(keys, 9).focus).toBe(1000);
    const rest = project(frameCam(undefined, 0), 1000);
    expect(rest).toEqual({ px: 960, py: 540, s: 1, blur: 0, hidden: false });
    // a far plane barely moves when the camera trucks; a near one slides more
    const fc = frameCam([{ t: 0, x: 1160 }], 0);
    expect(project(fc, 4000).px - 960).toBeCloseTo(50, 6);
    expect(project(fc, 500).px - 960).toBeCloseTo(400, 6);
    // a dolly grows near planes more than far ones (true parallax); dolly zoom keeps the subject plane
    const dz = frameCam([{ t: 0, z: 300 }], 0);
    expect(project(dz, 1000).s).toBeGreaterThan(project(dz, 3000).s);
    const vert = frameCam(moves.dollyZoom(0, 1, 400), 1);
    expect(project(vert, FOCAL).s).toBeCloseTo(1, 6);
    // behind the camera = hidden
    expect(project(frameCam([{ t: 0, z: 990 }], 0), 1000).hidden).toBe(true);
  });

  it('handheld is deterministic noise; «Reducir movimiento» removes handheld and whip, flattens parallax, keeps the travel', () => {
    expect(handheld(1.234, 6)).toEqual(handheld(1.234, 6));
    expect(handheld(1.234, 0)).toEqual([0, 0, 0]);
    const keys = shot([{ t: 0, x: 960, hand: 8 }, { t: 4, x: 1400 }], moves.whip(1, 0.3, 600));
    const live = frameCam(keys, 1.2);
    const calm = frameCam(keys, 1.2, { reduceMotion: true });
    expect(live.cx).not.toBeCloseTo(calm.cx, 1);
    expect(calm.cx).toBeCloseTo(camAt(keys, 1.2).x, 9);
    expect(calm.motion).toEqual([0, 0]);
    expect(Math.abs(live.motion[0])).toBeGreaterThan(0);
    expect(frameCam(keys, 4, { reduceMotion: true }).cx).toBe(1400);
    expect(flatten(3000, true)).toBeCloseTo(FOCAL + 2000 * 0.3, 6);
    expect(flatten(3000, false)).toBe(3000);
    // a scene can give a calm camera for «Reducir movimiento» (the demo's flight into the moon becomes a slow push)
    const noche = DEMO.scenes[0];
    expect(sceneCam(noche, false)).toBe(noche.cam);
    expect(sceneCam(noche, true)).toBe(noche.camRm);
    expect(Math.max(...(noche.camRm ?? []).map((k) => k.z ?? 0))).toBeLessThan(200);
    expect(sceneCam(DEMO.scenes[2], true)).toBe(DEMO.scenes[2].cam);
    // the Dutch angle is only a hint
    expect(frameCam([{ t: 0, roll: 0.1 }], 0, { reduceMotion: true }).roll).toBeCloseTo(0.03, 9);
    // painted frames stop boiling
    expect(boilStep(2.6, true)).toBe(0);
    expect(boilStep(2.6, false)).toBe(20);
    expect(REST.fov).toBe(1);
  });

  it('every transition that travels has a calm version for «Reducir movimiento»', () => {
    for (const k of ['iris', 'door', 'pageTurn', 'inkBleed', 'paintSmear', 'glitch', 'objectToSet', 'match', 'whip', 'lightLeak'] as const) expect(TRANSITIONS[k].reduced).toBe('dissolve');
    expect(TRANSITIONS.cut.reduced).toBe('cut');
  });
});
