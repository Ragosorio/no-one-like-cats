/**
 * ACTO III «Lo que está escrito» (F18–F25 + la oscuridad de H85; guiones/acto-3; ⚠️ spoilers): every film validates
 * with zero warnings (the song films on their real beat maps); the briefings are 20–60 s, 0 clicks, derived music that
 * plays whole; No wey is COMPLETE and hands its music to the bridge with a SEGUE on c65 (one film, two decks); DISTOR
 * is the c25 → end fragment with its two variants; the inputs (0–3, optional) sit where the scripts put them; the
 * twist rules hold in the words (LO QUE ARRIESGAMOS never names her and says Canelo's danger; five charges are hers,
 * of this adventure, the sixth is Canelo's; the sentence is «LOS OJOS»); the book styles are in the catalog; the
 * Library's briefing skin is registered.
 */
import { describe, expect, it } from 'vitest';
import { cleanBeatMap } from '../src/audio/beatgrid';
import noWeyMap from '../src/data/music/beatmaps/no_wey.json';
import distorMap from '../src/data/music/beatmaps/distor.json';
import tracksJson from '../src/data/music/tracks.json';
import { ACTO3_FILMS } from '../src/film/films/acto3';
import { F18 } from '../src/film/films/acto3/f18';
import { F19 } from '../src/film/films/acto3/f19';
import { F20 } from '../src/film/films/acto3/f20';
import { F21 } from '../src/film/films/acto3/f21';
import { F22 } from '../src/film/films/acto3/f22';
import { F23 } from '../src/film/films/acto3/f23';
import { F24 } from '../src/film/films/acto3/f24';
import { F25, F25_BISAGRA } from '../src/film/films/acto3/f25';
import { H85_OSCURIDAD } from '../src/film/films/acto3/h85';
import { CARGOS, EXPEDIENTE, RENUNCIA, RIESGO, SENTENCIA } from '../src/film/films/acto3/textos';
import { isOriginalRef, filmInputs, sceneTimeline, segueOf, skipMode, songFrom, timeBase, toMomentoDef, validateFilm } from '../src/film/timeline';
import { STYLES } from '../src/film/catalog';
import { LIBROS_STYLES } from '../src/film/styles/libros.catalog';
import { skinFor } from '../src/film/films/plantilla';
import { resolveScore } from '../src/momentos/score';
import type { FilmDef } from '../src/film/types';
import type { BeatMap } from '../src/audio/beatgrid';

const NW = cleanBeatMap(noWeyMap, 'no_wey') as BeatMap;
const DS = cleanBeatMap(distorMap, 'distor') as BeatMap;
const nw = (bar: number) => (bar - 1) * (240 / 74);
const ds = (bar: number) => (bar - 1) * (240 / 112);
const stage = async () => () => null;
type Row = { id: string; variations?: { id: string; durationSec?: number; loop?: unknown }[] };
const TRACKS = tracksJson as unknown as Row[];
const durOf = (ref: string) => TRACKS.flatMap((t) => t.variations ?? []).find((v) => v.id === ref)?.durationSec ?? 0;
const mapOf = (f: FilmDef) => (f.track === 'no_wey' ? NW : f.track === 'distor' ? DS : null);

describe('the Act III films', () => {
  it('all of them are registered and validate with zero warnings (the song films on their real maps)', () => {
    const ids = ACTO3_FILMS.map((f) => f.id);
    expect(ids).toEqual(expect.arrayContaining(['f18', 'f19', 'f20', 'h85_oscuridad', 'f21', 'f22', 'f23', 'f24', 'f25', 'f25_bisagra']));
    for (const f of ACTO3_FILMS) {
      const m = mapOf(f);
      expect(validateFilm(f, m ? timeBase(f, m) : null), f.id).toEqual([]);
    }
  });

  it('the briefings: 20–60 s, no clicks, derived music that plays whole (no loop), skippable only once seen', () => {
    const want: [FilmDef, string][] = [
      [F18, 'no_wey.melodia'],
      [F20, 'fut.fosa.latido'],
      [F22, 'no_wey.nodije'],
      [F24, 'distor.senal'],
    ];
    for (const [f, track] of want) {
      const len = sceneTimeline(f).length;
      expect(f.kind, f.id).toBe('briefing');
      expect(f.track, f.id).toBe(track);
      expect(isOriginalRef(track), f.id).toBe(false);
      expect(len, f.id).toBeGreaterThanOrEqual(20);
      expect(len, f.id).toBeLessThanOrEqual(60);
      expect(len, f.id).toBeLessThanOrEqual(durOf(track) - 0.05);
      expect(filmInputs(f).length + (f.gates?.length ?? 0), f.id).toBe(0);
      expect(skipMode(f, false), f.id).toBe('never');
      expect(skipMode(f, true), f.id).toBe('button');
    }
  });

  it('the story films use derived pieces or silence (never an owner original) and have no clicks', () => {
    expect(F19.track).toBe('fut.fosa.niebla');
    expect(F21.track).toBe('amb.plan');
    expect(H85_OSCURIDAD.track ?? null).toBe(null);
    for (const f of [F19, F21, H85_OSCURIDAD]) {
      expect(f.kind, f.id).toBe('interlude');
      expect(filmInputs(f).length, f.id).toBe(0);
      if (f.track) expect(isOriginalRef(f.track), f.id).toBe(false);
    }
    // the plan plays on its 90 s piece (it cuts dry on «No, wey» at 84.0) and the return follows in silence
    const tl = sceneTimeline(F21);
    expect(tl.scenes.find((s) => s.id === 'nowey')!.start).toBeCloseTo(84, 1);
    expect(tl.length).toBeGreaterThan(110);
    // the darkness scene: the lantern goes out and comes back, with its two clicks in the score
    const clicks = (H85_OSCURIDAD.score ?? []).filter((e) => e.kind === 'do' && JSON.stringify(e).includes('"tick"'));
    expect(clicks.length).toBe(2);
  });

  it('F23: No wey COMPLETE, then a SEGUE on c65 to the bridge — one film, no seam — 229.2 s in all', () => {
    expect(F23.kind).toBe('song');
    expect(F23.track).toBe('no_wey');
    expect(isOriginalRef('no_wey.puente')).toBe(false);
    const len = sceneTimeline(F23).length;
    expect(len).toBeCloseTo(nw(65) + durOf('no_wey.puente'), 2);
    expect(len).toBeGreaterThan(NW.duration - 3);
    const sg = segueOf(F23, NW)!;
    expect(sg.ref).toBe('no_wey.puente');
    expect(sg.at).toBeCloseTo(nw(65), 2);
    expect(sg.from).toBe(0);
    // the edit splits on that bar: two back-to-back segments the clock cues in turn
    const md = toMomentoDef(F23, stage, NW);
    expect(md.edit).toHaveLength(2);
    expect(md.edit![0].from).toBe(0);
    expect(md.edit![0].to).toBeCloseTo(nw(65), 2);
    expect(md.edit![1].from).toBeCloseTo(nw(65), 2);
    // without a segue (or a map) nothing changes for anybody else
    expect(toMomentoDef({ ...F23, segue: undefined }, stage, NW).edit).toHaveLength(1);
    expect(segueOf(F23, null)).toBe(null);
    expect(skipMode(F23, false)).toBe('never');
  });

  it('F23: its three optional clicks — ¡REBOTA! on a clap of c9–17, FÓRMENSE on c25, SUBRAYA on c70', () => {
    const map = timeBase(F23, NW);
    const r = resolveScore(toMomentoDef(F23, stage, NW), map);
    expect(r.warnings).toEqual([]);
    const at = r.prompts.map((p) => [p.spec.id, Math.round(p.m * 100) / 100] as const);
    expect(at.map((x) => x[0])).toEqual(['rebota', 'formense', 'subraya']);
    expect(at[0][1]).toBeGreaterThan(nw(9));
    expect(at[0][1]).toBeLessThan(nw(17));
    expect(at[1][1]).toBeCloseTo(nw(25), 1);
    expect(at[2][1]).toBeCloseTo(nw(70), 1);
    expect(r.prompts.every((p) => p.optional)).toBe(true);
  });

  it('F25: DISTOR c25 → end (2:02), two variants by the H87 choice, two optional clicks', () => {
    for (const f of [F25, F25_BISAGRA]) {
      expect(f.kind).toBe('song');
      expect(f.track).toBe('distor');
      expect(songFrom(f, DS)).toBeCloseTo(ds(25), 2);
      expect(sceneTimeline(f).length).toBeCloseTo(ds(82) - ds(25), 1);
      const r = resolveScore(toMomentoDef(f, stage, DS), timeBase(f, DS));
      expect(r.warnings).toEqual([]);
      expect(r.prompts.map((p) => p.spec.id)).toEqual(['sueltalo', 'basta']);
      expect(r.prompts.every((p) => p.optional)).toBe(true);
    }
    expect(F25.id).not.toBe(F25_BISAGRA.id);
  });

  it('the twist rules, in the words: her hand never names her; Canelo\'s danger said in full; the crew\'s trial', () => {
    for (const [k, t] of Object.entries(RIESGO)) {
      expect(t, k).not.toMatch(/luzterna|farera|morir|muert/i);
      if (k !== 'f22big') expect(t, k).toMatch(/gordo/);
    }
    // five charges are hers, of THIS adventure; the sixth falls on Canelo, who writes his own «Culpable.»
    expect(CARGOS.map((c) => c.de)).toEqual(['H67', 'H73', 'H78', 'H85', 'H82', 'H66']);
    expect(CARGOS.filter((c) => c.quien === 'canelo').map((c) => c.n)).toEqual([6]);
    expect(EXPEDIENTE).toBe('EXPEDIENTE: LA FARERA Y SU TRIPULACIÓN. ERRORES: 6.');
    expect(SENTENCIA).toBe('SENTENCIA: LOS OJOS');
    expect(RENUNCIA).toBe('La luz no se deja apagar. Entonces, los ojos.');
  });

  it('nothing in Act III plays SADIE material, and only the two song films play originals', () => {
    for (const f of ACTO3_FILMS) {
      expect(String(f.track ?? '').startsWith('sadie'), f.id).toBe(false);
      if (f.track && isOriginalRef(f.track)) expect(['f23', 'f25', 'f25_bisagra'], f.id).toContain(f.id);
    }
  });

  it('the book styles are in the catalog (each with its cat bake), and the Library has its briefing skin', () => {
    for (const id of ['libros', 'popup', 'dore', 'expresionismo', 'tecnico', 'tinta', 'pirata', 'datamosh']) {
      expect(STYLES[id], id).toBeTruthy();
      expect(LIBROS_STYLES[id].bakes, id).toContain(`${id}:cats`);
    }
    const skin = skinFor('p3d_libros');
    expect(skin.style).toBe('libros');
    for (const t of Object.values(skin.track)) if (t) expect(isOriginalRef(t)).toBe(false);
  });
});
