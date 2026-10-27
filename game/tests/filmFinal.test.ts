/**
 * EL FINAL (F31–F40, guiones/final; ⚠️ spoilers): every finale film validates with zero warnings; SADIE is the complete
 * song on its bar grid (c37 = 172.8 s) with its three optional RECUERDA at c9 / c17 / c21 and none in her death (c25–37);
 * the iris grows on the string steps, holds, and dies into an ember; SADIE material never plays before the death and no
 * other original is used; the grief rules (no jingle verbs); the gates (the lighthouse from 90 s, DÍSELO); TEMPERATURA's
 * pass 5–6 (R1: the night's cone shot ends on Canelo, not on her back; S1: no «La Mano re-aims» cut at dawn).
 */
import { describe, expect, it } from 'vitest';
import { FINAL_FILMS, F33_NOCHE, F34_AMANECER, F35_SADIE, F39_RECADO, F40_RONDA } from '../src/film/films/final';
import { gateTimes, isOriginalRef, sceneTimeline, skipMode, timeBase, toMomentoDef, validateFilm } from '../src/film/timeline';
import { resolveScore } from '../src/momentos/score';
import { irisAt } from '../src/film/films/final/sadie';
import { F39_CONTINUARA, F34_GOLPE, F34_TRAZO, F37_MANO, F38_VIGILIA, F31_LUZ, F32_CAIDA } from '../src/film/films/final';
import { DEUDA_FALSA } from '../src/film/films/final/deuda';
import { CONTINUAR, REGRESO } from '../src/film/films/final/timing';
import { lantern, spentPane } from '../src/film/films/final/props';

const c = (bar: number) => (bar - 1) * 4.8;
const stage = async () => () => null;

describe('the finale films', () => {
  it('all of them validate with zero warnings', () => {
    for (const f of FINAL_FILMS) expect(validateFilm(f), f.id).toEqual([]);
    expect(FINAL_FILMS.length).toBeGreaterThanOrEqual(9);
  });

  it('SADIE plays complete on its own grid, with three optional RECUERDA and none in her death', () => {
    const tl = sceneTimeline(F35_SADIE);
    expect(tl.length).toBeCloseTo(c(37), 6);
    expect(F35_SADIE.kind).toBe('song');
    expect(skipMode(F35_SADIE, false)).toBe('never');
    const map = timeBase(F35_SADIE, null);
    expect(map.bpm).toBe(50);
    expect(map.sections.map((s) => s.name)).toEqual(['intro', 'verse', 'verse_b', 'climax', 'break', 'bridge', 'outro']);
    const r = resolveScore(toMomentoDef(F35_SADIE, stage, map), map);
    expect(r.warnings).toEqual([]);
    expect(r.prompts.map((p) => Math.round(p.m * 10) / 10)).toEqual([c(9), c(17), c(21)].map((x) => Math.round(x * 10) / 10));
    expect(r.prompts.every((p) => p.optional && p.spec.label === 'RECUERDA')).toBe(true);
    expect(r.prompts.every((p) => p.m < c(25))).toBe(true);
  });

  it('the iris grows on the string steps (c5, c9, c17), holds in the calm, and dies into an ember at the cut', () => {
    expect(irisAt(c(5) + 1)).toBeGreaterThan(irisAt(c(5) - 0.1) + 0.1);
    expect(irisAt(c(9) + 1)).toBeGreaterThan(irisAt(c(9) - 0.1) + 0.1);
    expect(irisAt(c(17) + 1)).toBeGreaterThan(irisAt(c(17) - 0.1));
    expect(irisAt(c(26))).toBeCloseTo(irisAt(c(28)), 6);
    expect(irisAt(c(34))).toBeLessThan(0.12);
    expect(irisAt(c(36))).toBeLessThan(irisAt(c(34)));
    expect(irisAt(c(37))).toBe(0);
  });

  it('SADIE material never before the death (only «sadie.luz», only after it), and no other owner original', () => {
    const before = ['f31', 'f32', 'f33', 'f34'];
    for (const f of FINAL_FILMS) {
      if (f.id === F35_SADIE.id) continue;
      expect(f.track ?? null, f.id).not.toBe('sadie');
      if (before.some((p) => f.id.startsWith(p))) expect(String(f.track ?? '').startsWith('sadie'), f.id).toBe(false);
      if (f.track) expect(isOriginalRef(f.track), f.id).toBe(false);
    }
  });

  it('the music per film follows MÚSICA\'s table (oleada 3)', () => {
    const want: Record<string, string | null> = { f33_noche: null, f34_amanecer: 'liky_fight.amanecer', f34_golpe: 'liky_fight.amanecer', f35_sadie: 'sadie', f38_vigilia: 'sadie.luz', f39_creditos: 'sadie.luz', f39_continuara: null };
    for (const [id, t] of Object.entries(want)) expect(FINAL_FILMS.find((f) => f.id === id)?.track ?? null, id).toBe(t);
  });

  it('grief: from SADIE on, no jingle / reward verbs in any score', () => {
    const banned = new Set(['confetti', 'sfx', 'notes', 'burst', 'impact']);
    const after = FINAL_FILMS.filter((f) => /f3[5-9]|f40/.test(f.id));
    for (const f of after) {
      const r = resolveScore(toMomentoDef(f, stage), timeBase(f, null));
      const bad = r.cues.filter((x) => banned.has(x.act.verb));
      expect(bad, f.id).toEqual([]);
    }
  });

  it('gates: the lighthouse answers from 90 s (F33); DÍSELO waits for the player (F39)', () => {
    const g33 = gateTimes(F33_NOCHE);
    expect(g33.length).toBe(1);
    expect(g33[0].m).toBeGreaterThanOrEqual(90);
    expect(g33[0].at).toBe('faro');
    expect(gateTimes(F39_RECADO)[0].label).toBe('Díselo');
  });

  it('pass 5–6: the night cone shot ends on Canelo (not her back); no re-aim cut at dawn; formats per script', () => {
    const cono = F33_NOCHE.scenes.find((s) => s.id === 'cono')!;
    const last = cono.cam![cono.cam!.length - 1];
    expect(last.x!).toBeLessThan(900);
    expect(F34_AMANECER.scenes.some((s) => s.id === 'apunta')).toBe(false);
    expect(F35_SADIE.scenes[0].aspect).toBeCloseTo(2.39, 6);
    expect(F40_RONDA.scenes.every((s) => Math.abs((s.aspect ?? 0) - 4 / 3) < 1e-6)).toBe(true);
    expect(F33_NOCHE.scenes.every((s) => s.aspect === undefined)).toBe(true);
  });
});

describe('film audio wiring (oleada 4)', () => {
  it('a cue keeps its file position (CueOpts.at): `from` excerpts and late joins start where asked', async () => {
    const { cleanTable, resolveTarget } = await import('../src/audio/directorTable');
    const T = cleanTable((await import('../src/data/music/director.json')).default);
    const t = resolveTarget(T, { state: 'island', partII: true, has: () => true, cue: { ref: 'liky_fight.amanecer', opts: { at: 20, sync: true } } });
    expect(t).toMatchObject({ kind: 'track', ref: 'liky_fight.amanecer', at: 20 });
  });
  it('a variation filed under another song is reported by its canonical ref (the film hands that one to the clock)', async () => {
    const { resolveTrack } = await import('../src/audio/catalog');
    expect(resolveTrack('fut.jefe.grave')?.ref).toBe('amb.fut.jefe.grave');
    expect(resolveTrack('amb.fut.jefe.grave')?.url).toBe(resolveTrack('fut.jefe.grave')?.url);
  });
});

describe('pasada 7 · la deuda falsa pagada (temperatura/06-ronda-f.md)', () => {
  const subsOf = (f: { scenes: { subs?: { text: string }[] }[] }) => f.scenes.flatMap((sc) => (sc.subs ?? []).map((x) => x.text));
  const cuesOf = (f: Parameters<typeof toMomentoDef>[0]) => resolveScore(toMomentoDef(f, stage), timeBase(f, null)).cues;

  it('the switch is on (the owner decides; off = the measured control)', () => {
    expect(DEUDA_FALSA).toBe(true);
  });

  it('the return: together, the pane goes black on a dry «tic», she jokes in her voice — and never the pun on La Mano', () => {
    const reg = F34_AMANECER.scenes.find((x) => x.id === 'regreso')!;
    expect(reg.dur).toBe(REGRESO.dur);
    expect(REGRESO.catchAt).toBeCloseTo(4.5, 6); // the theme's entry in liky_fight.amanecer
    expect(REGRESO.paneAt).toBeGreaterThan(REGRESO.catchAt);
    expect(subsOf(F34_AMANECER)).toContain('Me debes un vidrio, gordo.');
    const joke = reg.subs!.find((x) => x.text === 'Me debes un vidrio, gordo.')!;
    expect(joke.who).toBe('Luzterna');
    expect(joke.t).toBeGreaterThan(REGRESO.jokeAt);
    expect(joke.t + joke.dur).toBeLessThan(REGRESO.scarfAt);
    const ticks = cuesOf(F34_AMANECER).filter((c) => c.act.verb === 'sound');
    expect(ticks.length).toBe(1);
    expect(ticks[0].m).toBeCloseTo(REGRESO.paneAt, 3);
    expect((ticks[0].act as { args?: { name?: string } }).args?.name).toBe('tick');
    // A1 almost silent: the chord ducked under Cerito's walk
    expect(F34_AMANECER.quiet).toEqual([[0, 2.2]]);
    // the rule of H67 is never said again; no dead joke; no «a mano»
    for (const f of FINAL_FILMS)
      for (const t of subsOf(f)) {
        expect(t, f.id).not.toMatch(/\ba mano\b/i);
        expect(t, f.id).not.toMatch(/ya no me puede pasar/i);
      }
  });

  it('the black pane: drawn only when asked (after the dawn), and it is all that is left of the broken lantern', () => {
    const whole = lantern(false, 1);
    const paid = lantern(false, 1, true);
    const broken = lantern(true, 1, true);
    expect(whole.children.length).toBe(1);
    expect(paid.children.length).toBe(2);
    expect(broken.children.length).toBe(2);
    expect(spentPane(1).bounds.width).toBeGreaterThan(10);
  });

  it('the films before the dawn never show it; the ones after do (source check)', async () => {
    const fs = await import('node:fs');
    const src = (f: string) => fs.readFileSync(`src/film/films/final/${f}.ts`, 'utf8');
    // before: the storm, the fall, the night — whole lanterns only
    for (const f of ['caida', 'noche', 'extras']) expect(src(f), f).not.toMatch(/lantern\([^)]*true\)/);
    // after: every lantern of the blow, SADIE, La Mano, the vigil and the shelf is the spent one
    for (const f of ['sadie', 'mano', 'recado']) {
      const calls = src(f).match(/lantern\([^)]*\)/g) ?? [];
      const own = calls.filter((c) => !/lantern\(false, 1\.6\)/.test(c)); // SADIE's slide of Part I: a memory, whole
      expect(own.length, f).toBeGreaterThan(0);
      for (const c of own) expect(c, f).toMatch(/, true\)$/);
    }
    expect(src('amanecer')).toMatch(/spentPane\(1\)/);
    void [F34_GOLPE, F34_TRAZO, F37_MANO, F38_VIGILIA, F31_LUZ, F32_CAIDA];
  });
});

describe('«Continuará» (h96 R12–R13): no music, the Capi\'s pencil under her Carta', () => {
  it('silent but for a soft pencil, every stroke while the word writes itself, nothing after', () => {
    expect(F39_CONTINUARA.track ?? null).toBeNull();
    expect(F39_CONTINUARA.scenes.reduce((a, x) => a + x.dur, 0)).toBeCloseTo(CONTINUAR.dur, 6);
    const r = resolveScore(toMomentoDef(F39_CONTINUARA, stage), timeBase(F39_CONTINUARA, null));
    expect(r.warnings).toEqual([]);
    const sounds = r.cues.filter((c) => c.act.verb !== 'scene');
    expect(sounds.length).toBe(CONTINUAR.strokes.length);
    for (const c of sounds) {
      expect(c.act.verb).toBe('sound');
      expect((c.act as { args?: { name?: string } }).args?.name).toBe('pencil');
      expect(c.m).toBeGreaterThanOrEqual(CONTINUAR.write);
      expect(c.m).toBeLessThanOrEqual(CONTINUAR.write + CONTINUAR.writeDur + 0.2);
    }
    expect(r.prompts.length).toBe(0);
    expect(CONTINUAR.out).toBeLessThan(CONTINUAR.dur);
  });
});

