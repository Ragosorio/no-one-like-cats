/**
 * PELÍCULAS DEL ACTO I (FILM-ACTO1; docs/part-iii/historia-v2/03-peliculas.md F01–F08): every film validates with zero
 * warnings, the rules of the format hold (briefings 20–60 s with derived music, song films with their original, 0–3
 * optional inputs), the stage films answer to the ids the Carta's data names (`F01`, `F07`), and the two small engine
 * additions this act needed: the lowercase lookup and FRAGMENT films (`FilmDef.from`: OH SHIT from bar 37).
 */
import { describe, expect, it } from 'vitest';
import { ACTO1_FILMS } from '../src/film/films/acto1';
import { filmEdit, filmInputs, isOriginalRef, sceneTimeline, songFrom, timeBase, toMomentoDef, trackMapOf, validateFilm } from '../src/film/timeline';
import { getFilm } from '../src/film/registry';
import { resolveScore, at, v, choice } from '../src/momentos/score';
import type { FilmDef } from '../src/film/types';
import '../src/film/films';
import ohShit from '../src/data/music/beatmaps/oh_shit.json';
import regiones from '../src/data/gateras/regiones.json';

const stage = async () => () => null;

describe('Acto I · every film', () => {
  it('has films for F01–F08 (F04 in its six parts)', () => {
    const ids = ACTO1_FILMS.map((f) => f.id);
    for (const id of ['f01', 'f02', 'f03', 'f05', 'f06', 'f07', 'f08', 'f04_prologo', 'f04_doneria', 'f04_hipomart', 'f04_parque', 'f04_bar', 'f04_epilogo']) expect(ids).toContain(id);
  });
  for (const f of ACTO1_FILMS) {
    it(`${f.id}: validateFilm has zero warnings`, () => {
      expect(validateFilm(f, timeBase(f, trackMapOf(f, null)))).toEqual([]);
    });
    it(`${f.id}: format rules (music, inputs, length)`, () => {
      const len = sceneTimeline(f).length;
      if (f.kind === 'song') {
        expect(f.track && isOriginalRef(f.track)).toBe(true);
      } else if (f.track) expect(isOriginalRef(f.track)).toBe(false);
      if (f.kind === 'briefing') {
        expect(len).toBeGreaterThanOrEqual(20);
        expect(len).toBeLessThanOrEqual(60);
        expect(filmInputs(f).length).toBe(0);
      }
      expect(filmInputs(f).length).toBeLessThanOrEqual(3);
    });
  }
});

describe('Acto I · the Carta asks for them by the data’s ids', () => {
  it('getFilm("F01") and getFilm("F07") find the stage films (lowercase lookup)', () => {
    const stages = (regiones as unknown as { stages: Record<string, { n: number; film?: string | null }[]> }).stages.p3d_borracha;
    const named = stages.map((s) => s.film).filter((x): x is string => !!x);
    expect(named).toEqual(['F01', 'F07']);
    for (const id of named) expect(getFilm(id)?.id).toBe(id.toLowerCase());
    expect(getFilm('f01')?.kind).toBe('briefing');
    expect(getFilm('nope')).toBeNull();
  });
});

describe('fragment films (FilmDef.from)', () => {
  const base: FilmDef = {
    id: 'frag',
    title: 'frag',
    kind: 'song',
    track: 'oh_shit',
    map: ohShit,
    from: '#36', // c37 (the score's '#i' is 0-based: '#0' = c1)
    scenes: [
      { id: 'a', dur: 10, style: 'tv', set: async () => ({}) },
      { id: 'b', dur: 10, style: 'tv', set: async () => ({}), in: { kind: 'cut', dur: 0 } },
    ],
    score: [at(3, v('flash', { amt: 0.2 })), at('#44', v('flash', { amt: 0.2 }))],
  };
  const map = trackMapOf(base, null)!;
  it('starts the edit at the bar (song time) and keeps film time for scenes and numbers', () => {
    const off = songFrom(base, map);
    // bar 37 of a constant 145 BPM grid with bar 1 at 0
    expect(off).toBeCloseTo((36 * 240) / 145, 2);
    const md = toMomentoDef(base, stage, map);
    expect(md.edit?.[0].from).toBeCloseTo(off, 6);
    expect(Number(md.cut)).toBeCloseTo(off + 20, 6);
    const r = resolveScore(md, timeBase(base, map));
    expect(r.warnings).toEqual([]);
    const flashes = r.cues.filter((c) => c.act.verb === 'flash').map((c) => c.m);
    // 3 = film seconds; '#44' (c45) = 8 bars after the start
    expect(flashes[0]).toBeCloseTo(3, 3);
    expect(flashes[1]).toBeCloseTo((8 * 240) / 145, 2);
    const scenes = r.cues.filter((c) => c.act.verb === 'scene').map((c) => c.m);
    expect(scenes[0]).toBeCloseTo(0, 3);
    expect(scenes[1]).toBeCloseTo(10, 3);
  });
  it('without `from` nothing moves (backward compatible)', () => {
    const plain = { ...base, from: undefined };
    expect(songFrom(plain, map)).toBe(0);
    expect(toMomentoDef(plain, stage, map).edit?.[0].from).toBe(0);
  });
  it('without a track map the synthetic grid starts at 0', () => {
    expect(songFrom(base, null)).toBe(0);
  });
});

describe('derived pieces shorter than their film loop (filmEdit)', () => {
  // a constant grid like the one a registered variation gets from its own tempo
  const grid = (id: string, bpm: number, dur: number) => {
    const spb = 60 / bpm;
    const beats: number[] = [];
    for (let t = 0; t <= dur + 1e-9; t += spb) beats.push(Math.round(t * 1e6) / 1e6);
    return { id, duration: dur, bpm, offset: 0, beats, downbeats: beats.filter((_, i) => i % 4 === 0), beatsPerBar: 4, sections: [], markers: [] };
  };
  const brief = (track: string, dur: number): FilmDef => ({
    id: 'loopy',
    title: 'loopy',
    kind: 'briefing',
    track,
    scenes: [
      { id: 'a', dur: dur / 2, style: 'tv', set: async () => ({}) },
      { id: 'b', dur: dur / 2, style: 'tv', set: async () => ({}), in: { kind: 'cut', dur: 0 } },
    ],
    score: [at(dur - 2, v('flash', { amt: 0.2 }))],
  });
  it('«Antes de caer» (18 s) under a 30 s briefing: played to its loop end, then the loop, on bar lines; film time intact', () => {
    const f = brief('oh_shit.antes', 30);
    const map = grid('oh_shit.antes', 145, 18.207);
    const ed = filmEdit(f, map, 30);
    expect(ed.looped).toBe(true);
    expect(ed.edit[0].from).toBe(0);
    expect(ed.edit.length).toBeGreaterThanOrEqual(3);
    const md = toMomentoDef(f, stage, map);
    const r = resolveScore(md, timeBase(f, map));
    expect(r.warnings).toEqual([]);
    expect(r.mCut).toBeCloseTo(30, 3);
    expect(r.cues.find((c) => c.act.verb === 'flash')!.m).toBeCloseTo(28, 3);
    expect(r.cues.filter((c) => c.act.verb === 'scene').map((c) => +c.m.toFixed(3))).toEqual([0, 15]);
  });
  it('an input\'s numeric `until` is film time too: placed on the looped edit (QA-P3, F12\'s blanket)', () => {
    const f: FilmDef = { ...brief('oh_shit.antes', 30), score: [choice(20, { id: 'c', fallback: 'left', until: 22.5, label: '¿DÓNDE?' }, { left: [], right: [] }), choice(17.2, { id: 'd', fallback: 'left', until: 19, label: 'X' }, { left: [], right: [] })] };
    const map = grid('oh_shit.antes', 145, 18.207);
    const md = toMomentoDef(f, stage, map);
    const r = resolveScore(md, timeBase(f, map));
    expect(r.warnings).toEqual([]);
    const c = r.prompts.find((x) => x.id === 'c')!;
    expect(c.m).toBeCloseTo(20, 3);
    expect(c.mEnd).toBeCloseTo(22.5, 3);
    // a window across a loop boundary closes at the boundary (never before its prompt)
    const d = r.prompts.find((x) => x.id === 'd')!;
    expect(d.mEnd).toBeGreaterThan(d.m);
    expect(d.mEnd).toBeLessThanOrEqual(19 + 1e-6);
  });
  it('a piece as long as its film plays out whole; originals never loop', () => {
    expect(filmEdit(brief('drunck.barra', 25), grid('drunck.barra', 165, 27.636), 25).looped).toBe(false);
    expect(filmEdit({ ...brief('emen', 200), kind: 'song' }, grid('emen', 103, 187.787), 200).looped).toBe(false);
    // no track map yet (the synthetic grid): nothing to run out
    expect(filmEdit(brief('oh_shit.antes', 30), null, 30).looped).toBe(false);
  });
});

describe('the briefing TEMPLATE (films/plantilla)', async () => {
  const { briefingFilm, registerBriefingSkin, skinFor, BORRACHA_SKIN } = await import('../src/film/films/plantilla');
  const { sampleBriefing } = await import('../src/film/films/plantilla/samples');
  it('every Borracha stage gets a valid 20–60 s briefing from its own data (derived music, 0 clicks)', () => {
    for (let n = 1; n <= 9; n++) {
      const d = sampleBriefing(n)!;
      const f = briefingFilm(d);
      expect(f.id).toBe(`brief_p3d_borracha_${n}`);
      expect(validateFilm(f, timeBase(f, trackMapOf(f, null)))).toEqual([]);
      const len = sceneTimeline(f).length;
      expect(len).toBeGreaterThanOrEqual(20);
      expect(len).toBeLessThanOrEqual(60);
      expect(f.track && isOriginalRef(f.track)).toBeFalsy();
      expect(filmInputs(f).length).toBe(0);
      expect(f.scenes.map((s) => s.id)).toEqual(['donde', 'pasa', 'rival', 'regla', 'riesgo']);
      expect(f.scenes.every((s) => s.style === 'tv' && Math.abs((s.aspect ?? 0) - 4 / 3) < 1e-6)).toBe(true);
    }
  });
  it('another act dresses its own dimension (skins), a dimension without one gets the neutral look', () => {
    expect(skinFor('p3d_borracha')).toBe(BORRACHA_SKIN);
    expect(skinFor('p3d_nowhere').style).toBe('pintura');
    registerBriefingSkin('p3d_test_dim', { style: 'comic', aspect: 16 / 9, tv: false, type: 'tv' });
    const d = { ...sampleBriefing(3)!, dim: 'p3d_test_dim' as never, battleId: 'p3d_test_dim_3' };
    const f = briefingFilm(d);
    expect(f.scenes.every((s) => s.style === 'comic')).toBe(true);
    expect(validateFilm(f, timeBase(f, trackMapOf(f, null)))).toEqual([]);
  });
});

describe('the texture GC rests while a film plays (texturegc.ts, used by playFilm)', async () => {
  const { pauseTextureGC } = await import('../src/film/texturegc');
  // the same shape as playFilm: pause before the build, restore in `finally`
  async function film(r: { gc?: { enabled: boolean }; textureGC?: { active: boolean } }, end: 'done' | 'aborted' | 'throw') {
    let restore: (() => void) | null = null;
    try {
      restore = pauseTextureGC(r);
      expect(r.gc ? r.gc.enabled : r.textureGC?.active).toBe(false);
      if (end === 'throw') throw new Error('boom');
      return end;
    } catch {
      return null;
    } finally {
      restore?.();
    }
  }
  for (const end of ['done', 'aborted', 'throw'] as const)
    it(`restored after a film that ends «${end}»`, async () => {
      const r = { textureGC: { active: true } };
      await film(r, end);
      expect(r.textureGC.active).toBe(true);
      const off = { textureGC: { active: false } };
      await film(off, end);
      expect(off.textureGC.active).toBe(false);
      // Pixi ≥ 8.15: the unified GC (renderer.gc.enabled)
      const neu = { gc: { enabled: true }, textureGC: { active: true } };
      await film(neu, end);
      expect(neu.gc.enabled).toBe(true);
    });
  it('the restore is idempotent; a renderer without a GC is fine', () => {
    const r = { textureGC: { active: true } };
    const undo = pauseTextureGC(r);
    undo();
    r.textureGC.active = false;
    undo();
    expect(r.textureGC.active).toBe(false);
    expect(() => pauseTextureGC({})()).not.toThrow();
    expect(() => pauseTextureGC(null)()).not.toThrow();
  });
  it('playFilm pauses it and restores it in its finally', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../src/film/index.ts', import.meta.url), 'utf8');
    expect(src).toMatch(/restoreGC = pauseTextureGC\(/);
    const fin = src.slice(src.lastIndexOf('} finally {'));
    expect(fin).toMatch(/restoreGC\?\.\(\)/);
  });
});
