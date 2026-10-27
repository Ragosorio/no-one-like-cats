/**
 * PELÍCULAS DEL ACTO IV (FILM-ACTO4; docs/part-iii/historia-v2/03-peliculas.md F26–F30, guiones/acto-4/): every film
 * validates with zero warnings; the format holds (briefings 20–60 s with derived music and 0 clicks, song films with
 * their original and COMPLETE, 0–3 optional inputs); the two song films are cut on the song's own bars (the distortion
 * layers of NO G@ME, the sections of xti); the act's rules (no Luzterna mortality text, no lives counter, no
 * «GAME OVER / CONTINUE»); the POP skin of the briefing template; the `pop` style; and the engine addition `quiet`.
 */
import { describe, expect, it } from 'vitest';
import { ACTO4_FILMS } from '../src/film/films/acto4';
import { F29, F29_END } from '../src/film/films/acto4/f29';
import { F30, F30_END } from '../src/film/films/acto4/f30';
import { F27 } from '../src/film/films/acto4/f27';
import { NG, XT } from '../src/film/films/acto4/music';
import { filmInputs, isOriginalRef, sceneTimeline, timeBase, trackMapOf, validateFilm, bakeManifest } from '../src/film/timeline';
import { getFilm } from '../src/film/registry';
import { STYLES } from '../src/film/catalog';
import { skinFor } from '../src/film/films/plantilla';
import { islandSlots } from '../src/film/films/acto4/f30/world';
import type { FilmDef } from '../src/film/types';
import '../src/film/films';
import noGame from '../src/data/music/beatmaps/no_game.json';
import xti from '../src/data/music/beatmaps/xti.json';

const textOf = (f: FilmDef) => JSON.stringify(f.scenes.map((s) => [s.cards, s.subs]));

describe('Acto IV · every film', () => {
  it('has F26–F30, registered and found by the data’s ids (F26 / F28 on P-5 / P-9)', () => {
    expect(ACTO4_FILMS.map((f) => f.id)).toEqual(['f26', 'f27', 'f28', 'f29', 'f30']);
    for (const id of ['F26', 'F27', 'F28', 'F29', 'F30']) expect(getFilm(id)?.id).toBe(id.toLowerCase());
  });
  for (const f of ACTO4_FILMS) {
    it(`${f.id}: validateFilm has zero warnings`, () => {
      expect(validateFilm(f, timeBase(f, trackMapOf(f, null)))).toEqual([]);
    });
    it(`${f.id}: format rules (music, inputs, length)`, () => {
      const len = sceneTimeline(f).length;
      if (f.kind === 'song') expect(f.track && isOriginalRef(f.track)).toBe(true);
      else if (f.track) expect(isOriginalRef(f.track)).toBe(false);
      if (f.kind === 'briefing') {
        expect(len).toBeGreaterThanOrEqual(20);
        expect(len).toBeLessThanOrEqual(60);
        expect(filmInputs(f).length).toBe(0);
      }
      expect(filmInputs(f).length).toBeLessThanOrEqual(3);
      for (const e of filmInputs(f)) expect(e.input.type).not.toBe('mash');
    });
    it(`${f.id}: the act's rules — no lives counter, no GAME OVER / CONTINUE, nothing about her dying`, () => {
      const t = textOf(f).toLowerCase();
      for (const bad of ['game over', 'continue', 'vidas', 'última noche', 'despedida', 'adiós']) expect(t).not.toContain(bad);
    });
  }
  it('the briefings and the karaoke use the derived pieces MÚSICA made for them', () => {
    expect(getFilm('f26')?.track).toBe('xti.gira');
    expect(getFilm('f27')?.track).toBe('xti.gira');
    expect(getFilm('f28')?.track).toBe('no_game.start');
  });
});

describe('F29 · NO G@ME NO LIF€ — complete, bar by bar, the distortion in layers', () => {
  const tl = sceneTimeline(F29);
  const at = (id: string) => tl.scenes.find((s) => s.id === id)!;
  it('plays the whole song (c1 → its end) with its original', () => {
    expect(F29.track).toBe('no_game');
    expect(tl.scenes[0].start).toBe(0);
    expect(tl.length).toBeCloseTo(F29_END, 2);
    expect(F29_END).toBeGreaterThan((noGame as { duration: number }).duration - 0.05);
  });
  it('the HUD enters with each «Future Flu» layer: c14.021 · c27 · c38 · c57 (the beat map’s distortion markers)', () => {
    const marks = Object.fromEntries((noGame as { markers: { name: string; time: number }[] }).markers.map((m) => [m.name, m.time]));
    expect(at('falla').start).toBeCloseTo(marks.distortion_1, 1);
    expect(at('trampa').start).toBeCloseTo(marks.distortion_2, 1);
    expect(at('pirata').start).toBeCloseTo(marks.distortion_3, 1);
    expect(at('ruptura').start).toBeCloseTo(marks.climax, 1);
    expect(at('valle').start).toBeCloseTo(marks.drums_out_3, 1);
    expect(at('pingpong').start).toBeCloseTo(marks.call_response_2, 1);
    expect(at('cierre').start).toBeCloseTo(marks.end, 1);
  });
  it('three optional clicks: PRESS START (c3–7) · ¡LUCES! (c19) · ¡ATRAPA! (c57+)', () => {
    const ins = filmInputs(F29).map((e) => [e.input.id, e.when]);
    expect(ins).toEqual([
      ['start', NG(4)],
      ['luces', NG(19)],
      ['atrapa', NG(58)],
    ]);
  });
});

describe('F30 · xti es amor «La noche estrellada» — complete, Van Gogh, on its sections', () => {
  const tl = sceneTimeline(F30);
  const at = (id: string) => tl.scenes.find((s) => s.id === id)!;
  it('plays the whole song with its original, in Van Gogh (the opening R4 in the game’s painting)', () => {
    expect(F30.track).toBe('xti');
    expect(tl.length).toBeCloseTo(F30_END, 2);
    expect(F30_END).toBeGreaterThan((xti as { duration: number }).duration - 0.05);
    const styles = new Set(F30.scenes.map((s) => (typeof s.style === 'string' ? s.style : s.style.id)));
    expect([...styles].sort()).toEqual(['pintura', 'vangogh']);
    expect(bakeManifest(F30)).toContain('vangogh:strokes');
  });
  it('one painted night (scene `noche`, from c2) whose shots CUT on the song’s sections: balcony (c9), the drums (c17), the break (c33), the tutti (c41), the long break (c57), tutti 2 (c81), the close (c105)', () => {
    const marks = Object.fromEntries((xti as { markers: { name: string; time: number }[] }).markers.map((m) => [m.name, m.time]));
    const noche = F30.scenes.find((s) => s.id === 'noche')!;
    expect(at('noche').start).toBeCloseTo(XT(2), 3);
    const cuts = (noche.cam ?? []).filter((k) => k.ease === 'hold').map((k) => +(k.t + XT(2)).toFixed(2));
    for (const t of [XT(9), marks.drums_in, XT(33), marks.tutti, marks.break2, XT(81), XT(105)]) expect(cuts.some((c) => Math.abs(c - t) < 0.02)).toBe(true);
  });
  it('Cronos says his line in the long break; it is the only line of the film (Canelo never speaks at home)', () => {
    const subs = F30.scenes.flatMap((s) => s.subs ?? []);
    expect(subs.map((s) => s.who)).toEqual(['Cronos']);
    // in the long break (c57–61)
    expect(subs[0].t + XT(2)).toBeGreaterThan(XT(57));
    expect(subs[0].t + XT(2)).toBeLessThan(XT(61));
  });
  it('three optional touches: Cerito (c37–41), Canelo (c77–81), the stars (c89–97)', () => {
    const ins = filmInputs(F30).map((e) => [e.input.id, e.when]);
    expect(ins).toEqual([
      ['cerito', XT(38)],
      ['canelo', XT(78)],
      ['estrellas', XT(90)],
    ]);
  });
  it('the conditional slots (Homiau / Borrón) always resolve to two cats', () => {
    const s = islandSlots();
    expect(s).toHaveLength(2);
    expect(s[0]).not.toBe(s[1]);
  });
});

describe('F27 · Karaoke — the photo booth', () => {
  it('one optional click (¡APLAUDE!) during photo 3, and no music from photo 4 on (`quiet`)', () => {
    expect(filmInputs(F27).map((e) => e.input.id)).toEqual(['aplaude']);
    expect(F27.quiet).toEqual([[42, 80]]);
    const t = filmInputs(F27)[0].when as number;
    expect(t).toBeGreaterThan(27);
    expect(t).toBeLessThan(41);
  });
  it('her wish is about the future (never about rest)', () => {
    const line = F27.scenes.flatMap((s) => s.subs ?? []).find((s) => s.who === 'Luzterna')!;
    expect(line.text).toContain('hablar en casa');
  });
});

describe('the POP style and the POP skin of the briefing template', () => {
  it('`pop` is in the catalog with its bakes', () => {
    expect(STYLES.pop?.bakes).toEqual(['pop:led', 'pop:cats']);
  });
  it('La Gira dresses every generic briefing of its box (derived music only)', () => {
    const s = skinFor('p3d_pop');
    expect(s.style).toBe('pop');
    for (const k of ['normal', 'elite', 'boss'] as const) expect(isOriginalRef(s.track[k] ?? 'x')).toBe(false);
    expect(s.caption).toContain('LA GIRA');
  });
});

describe('the Momento clock follows a LOOPED edit (a derived piece shorter than its film)', () => {
  it('when the loop jumps back inside the same file range, the clock moves on instead of freezing', async () => {
    const { MomentoClock } = await import('../src/momentos/clock');
    const st = { now: 0, raw: null as number | null, cur: 'xti.gira' as string | null, cues: [] as { at: number; q: string }[] };
    const d = { usable: () => true, trackTime: () => st.raw, current: () => st.cur, cue: (at: number, q: string) => st.cues.push({ at, q }), pause: () => undefined, offset: () => 0, now: () => st.now };
    // [intro + loop] then the loop again: 0 → 15.43, then 1.714 → 15.43 (m0 15.43)
    const segs = [
      { from: 0, to: 15.43, m0: 0 },
      { from: 1.714, to: 15.43, m0: 15.43 },
    ];
    const c = new MomentoClock(segs, d as never, 'xti.gira', 12 / 7);
    c.start(true);
    st.raw = 0.02;
    c.update();
    expect(c.mode).toBe('audio');
    st.raw = 15.0;
    c.update();
    expect(st.cues.at(-1)).toMatchObject({ at: 1.714, q: 'bar' });
    st.raw = 15.42;
    c.update();
    // the next deck is heard at the loop start: the clock goes ON (not back, not frozen)
    st.raw = 1.75;
    const m = c.update();
    expect(m).toBeGreaterThan(15.43);
    expect(m).toBeLessThan(15.6);
    st.raw = 5.0;
    expect(c.update()).toBeCloseTo(15.43 + (5.0 - 1.714), 1);
  });
});
