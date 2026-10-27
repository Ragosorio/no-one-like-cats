/**
 * PELÍCULAS DEL ACTO II (FILM-ACTO2; docs/part-iii/historia-v2/03-peliculas.md F09–F17): every film validates with zero
 * warnings; the format holds (briefings 20–60 s with derived music and no inputs, the song film with its original, 0–3
 * optional inputs, the two choices fall back to a side); the music is the one MÚSICA assigned; Daria is the c25 → end
 * fragment with its dry cut; the films answer to the ids the stages will name (`F09`…); the page & panel styles are in
 * the catalog with their modules and treatments; the stand-ins never use Drunck's REGISTRO 000; the act's boxes have
 * their briefing-template skins; and the demo shots come from the real simulator.
 */
import { describe, expect, it } from 'vitest';
import '../src/core/pixiFixes';
import { ACTO2_FILMS } from '../src/film/films/acto2';
import { MUSIC } from '../src/film/films/acto2/music';
import { filmInputs, isOriginalRef, knownTrack, sceneTimeline, songFrom, timeBase, trackMapOf, validateFilm } from '../src/film/timeline';
import { getFilm } from '../src/film/registry';
import { STYLES } from '../src/film/catalog';
import { STYLE_MODULES } from '../src/film/styles';
import { CAT_BAKES } from '../src/film/styles/catbake';
import { VINETA_STYLES } from '../src/film/styles/vineta.catalog';
import { SLUG } from '../src/film/films/acto2/kit/cast';
import { realArcs, fitArcTo } from '../src/film/films/acto2/kit/demo';
import { skinFor } from '../src/film/films/plantilla';
import { CUTS, frayAt, c as bar } from '../src/film/films/acto2/f16/sets';
import daria from '../src/data/music/beatmaps/daria.json';
import { cleanBeatMap } from '../src/audio/beatgrid';
import '../src/film/films';

const IDS = ['f09', 'f10', 'f11', 'f12', 'f13', 'f14_1', 'f14_2', 'f14_3', 'f15', 'f16', 'f17'];

describe('Acto II · every film', () => {
  it('has films for F09–F17 (F14 in its three strips)', () => {
    expect(ACTO2_FILMS.map((f) => f.id).sort()).toEqual([...IDS].sort());
  });
  for (const f of ACTO2_FILMS) {
    it(`${f.id}: validateFilm has zero warnings`, () => {
      expect(validateFilm(f, timeBase(f, trackMapOf(f, null)))).toEqual([]);
    });
    it(`${f.id}: format rules (music, inputs, length)`, () => {
      const len = sceneTimeline(f).length;
      expect(f.track && knownTrack(f.track)).toBeTruthy();
      if (f.kind === 'song') expect(isOriginalRef(f.track!)).toBe(true);
      else expect(isOriginalRef(f.track!)).toBe(false);
      if (f.kind === 'briefing') {
        expect(len).toBeGreaterThanOrEqual(20);
        expect(len).toBeLessThanOrEqual(60);
        expect(filmInputs(f).length).toBe(0);
      }
      expect(filmInputs(f).length + (f.gates?.length ?? 0)).toBeLessThanOrEqual(3);
      for (const e of filmInputs(f)) expect(e.input.type).not.toBe('mash');
    });
  }
  it('the stages can ask for them in capitals (getFilm("F09") → f09)', () => {
    for (const id of ['F09', 'F10', 'F11', 'F13', 'F15', 'F16', 'F17', 'F12']) expect(getFilm(id)?.id).toBe(id.toLowerCase());
  });
});

describe('Acto II · the music MÚSICA assigned (musica-v2/10 §6)', () => {
  it('each film plays its piece', () => {
    const want: Record<string, string> = { f09: 'fut.vineta', f10: 'fut.vineta.noticiero', f11: 'fut.vineta.mono', f12: 'xti.pad', f13: 'daria.calle', f14_1: 'daria.piano', f15: 'daria.piano', f16: 'daria', f17: 'amb.vocacion' };
    for (const [id, track] of Object.entries(want)) expect(getFilm(id)?.track).toBe(track);
    expect(MUSIC.f16).toBe('daria');
  });
  it('F16 is Daria c25 → end: it starts in the stop (42.985 s) and ends dry on the song’s last sample', () => {
    const f = getFilm('f16')!;
    const map = cleanBeatMap(daria, 'daria');
    const from = songFrom(f, map);
    expect(from).toBeCloseTo(42.985, 2);
    expect(f.cutDry).toBe(true);
    expect(f.kind).toBe('song');
    const len = sceneTimeline(f).length;
    expect(from + len).toBeCloseTo(146.363, 1);
    // the dry cut of c81 is the start of the last scene
    const tl = sceneTimeline(f);
    expect(tl.scenes[tl.scenes.length - 1].start).toBeCloseTo(bar(81), 2);
  });
  it('F16 has the two optional taps of the guion (CORTA at c25.5, ¡FIN! at c80)', () => {
    const ins = filmInputs(getFilm('f16')!);
    expect(ins.map((e) => e.input.id)).toEqual(['corta', 'fin']);
    expect(ins.every((e) => e.input.type === 'tap')).toBe(true);
  });
});

describe('Acto II · the two choices are cosmetic and always land somewhere', () => {
  it('F12: the blanket (lighthouse = left by default) — MECÁNICAS saves b78_cobija from inputs.cobija', () => {
    const [e] = filmInputs(getFilm('f12')!);
    expect(e.input.id).toBe('cobija');
    expect(e.input.type).toBe('choice');
    expect(e.input.fallback).toBe('left');
  });
  it('F17: the Capi’s answer (both lead to her «No.»)', () => {
    const [e] = filmInputs(getFilm('f17')!);
    expect(e.input.id).toBe('capi');
    expect(e.input.type).toBe('choice');
    expect(e.input.fallback).toBe('left');
  });
});

describe('Acto II · the page & panel styles', () => {
  it('are in the catalog with a module each, and their treatments are in CAT_BAKES', () => {
    for (const id of Object.keys(VINETA_STYLES)) {
      expect(STYLES[id]).toBeTruthy();
      expect(STYLE_MODULES[id]?.id).toBe(id);
    }
    for (const t of ['aracnido', 'periodico', 'edadplata', 'manga', 'hilo', 'cel', 'caravaggio']) expect(typeof CAT_BAKES[t]).toBe('function');
  });
  it('each film uses the style its ficha asks for', () => {
    const style = (id: string) => new Set(getFilm(id)!.scenes.map((s) => (typeof s.style === 'string' ? s.style : s.style.id)));
    expect(style('f09')).toEqual(new Set(['aracnido']));
    expect(style('f10')).toEqual(new Set(['periodico']));
    expect(style('f11')).toEqual(new Set(['edadplata']));
    expect(style('f12')).toEqual(new Set(['nocturna']));
    expect(style('f13')).toEqual(new Set(['anime']));
    expect(style('f14_2')).toEqual(new Set(['manga']));
    expect(style('f15')).toEqual(new Set(['ukiyoe']));
    expect(style('f16')).toEqual(new Set(['hilo']));
    expect(style('f17')).toEqual(new Set(['caravaggio']));
  });
});

describe('Acto II · rules of the twist and of the art', () => {
  it('no stand-in is Drunck’s REGISTRO 000 (nadie_static_cat)', () => {
    expect(JSON.stringify(SLUG)).not.toContain('nadie_static_cat');
  });
  it('Itō’s thread goes grey at the dry cut, the drawing frays more and more, the cuts pile up blow by blow [TEMP-S4]', () => {
    expect(frayAt(0)).toBe(0);
    expect(frayAt(bar(65))).toBeCloseTo(0.3, 5);
    expect(frayAt(bar(81))).toBeCloseTo(1, 5);
    const times = CUTS.map((x) => x.t);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(times[0]).toBeGreaterThan(bar(29));
    expect(times[times.length - 1]).toBeLessThan(bar(81));
    expect(getFilm('f16')!.scenes.at(-1)!.id).toBe('cola');
  });
});

describe('Acto II · the briefing template in the act’s boxes', () => {
  it('Superhéroes and Anime have their skins (derived music only)', () => {
    const s = skinFor('p3d_superheroes');
    const a = skinFor('p3d_anime');
    expect(s.style).toBe('aracnido');
    expect(a.style).toBe('anime');
    for (const k of [s, a]) for (const t of Object.values(k.track)) expect(t && !isOriginalRef(t)).toBe(true);
    expect(typeof s.backdrop).toBe('function');
    expect(typeof a.backdrop).toBe('function');
  });
});

describe('Acto II · the demo shots come from the real simulator', () => {
  it('realArcs() returns real flights and fitArcTo lands exactly on the target', () => {
    const arcs = realArcs();
    expect(arcs.length).toBeGreaterThan(0);
    expect(arcs[0].pts.length).toBeGreaterThan(8);
    const pts = fitArcTo(arcs[0], [0, 100], [500, 200], -100);
    expect(pts[0][0]).toBeCloseTo(0, 5);
    expect(pts[pts.length - 1][0]).toBeCloseTo(500, 5);
    expect(pts[pts.length - 1][1]).toBeCloseTo(200, 3);
    expect(Math.min(...pts.map((p) => p[1]))).toBeLessThan(100);
  });
});
