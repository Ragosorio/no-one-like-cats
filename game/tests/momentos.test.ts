/**
 * MOMENTOS MUSICALES (docs/part-ii/29): the authoring format resolves on the real beat maps, input judging (with the
 * «Ajuste de ritmo» and the input lag), the same outcome whatever the player presses, pause / resume, the internal
 * clock fallback, the flash limiter, the save slice. (H44's two-phase battle: tests/momentosH44.test.ts.)
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanBeatMap, type BeatMap } from '../src/audio/beatgrid';
import { barAt, barTime, expandEach, mToSong, onBar, resolveEdit, resolveWhen, selectHits, songHits, songToM } from '../src/momentos/time';
import { EARLY_S, GREAT_S, HIT_S, at, choice, hold, key, mash, on, propAt, resolveScore, tap } from '../src/momentos/score';
import { MomentoCore, gradeOf } from '../src/momentos/core';
import { MomentoClock, PENDING_MS, VISUAL_LEAD, type AudioDriver } from '../src/momentos/clock';
import { FlashGuard, isSaturatedRed, safeFlashColor } from '../src/momentos/flash';
import { COSMETIC_KEYS, commitMomento, momentoSeen, momentosOf, normalizeMomentos } from '../src/momentos/save';
import { getMomento, momentoForFase, momentoIds, seenMomentos } from '../src/momentos/registry';
import type { MomentoDef, OnsetMap, Segment } from '../src/momentos/types';
import '../src/momentos/songs';
import { LIKY_FIGHT, BARRAGE, FIGHT, COUNTER, ROCKS, CLIMAX } from '../src/momentos/songs/likyFight/score';
import { selectOnsets } from '../src/momentos/time';

const MAPS = join(__dirname, '../src/data/music/beatmaps');
const map = (id: string): BeatMap => cleanBeatMap(JSON.parse(readFileSync(join(MAPS, `${id}.json`), 'utf8')), id)!;
const LIKY = map('liky_fight');
const ONSETS = JSON.parse(readFileSync(join(MAPS, 'liky_fight.onsets.json'), 'utf8')) as OnsetMap;
const def = (score: MomentoDef['score'], extra: Partial<MomentoDef> = {}): MomentoDef => ({ id: 't', track: 'liky_fight', title: 'T', score, stage: async () => () => null, ...extra });

describe('musical time', () => {
  it('resolves names, bar math and offsets on LIKY FIGHT', () => {
    expect(resolveWhen(LIKY, 'chorus')).toBeCloseTo(43.969, 3);
    expect(resolveWhen(LIKY, 'silence_1')).toBeCloseTo(15.65, 3);
    expect(resolveWhen(LIKY, '#24')).toBeCloseTo(43.969, 2);
    expect(resolveWhen(LIKY, '#24:2')).toBeCloseTo(43.969 + 2 * (60 / 131), 2);
    expect(resolveWhen(LIKY, 'chorus+2')).toBeCloseTo(43.969 + 2 * (240 / 131), 2);
    expect(resolveWhen(LIKY, 'shout_1-0:1')).toBeCloseTo(115.85 - 60 / 131, 3);
    expect(resolveWhen(LIKY, { section: 'drop', bar: 1, beat: 2 })).toBeCloseTo(71.45 + 240 / 131 + 120 / 131, 2);
    expect(resolveWhen(LIKY, { bar: 39 })).toBeCloseTo(71.45, 2);
    expect(resolveWhen(LIKY, 'nope')).toBeNull();
    expect(onBar(LIKY, 117.252)).toBe(true);
    expect(onBar(LIKY, 115.85)).toBe(false);
    expect(barAt(LIKY, barTime(LIKY, 12) + 0.001)).toBeCloseTo(12, 2);
  });
  it('selects hits by section, kind, strength, gap, limit and exceptions', () => {
    const k = selectHits(LIKY, { in: 'chorus', kind: 'kick', min: 0.8 });
    expect(k.length).toBeGreaterThan(2);
    expect(k.every((h) => h.kind === 'kick' && h.strength >= 0.8 && h.time >= 43.969 && h.time < 58.626)).toBe(true);
    const g = selectHits(LIKY, { in: 'intro', minGap: 1 });
    for (let i = 1; i < g.length; i++) expect(g[i].time - g[i - 1].time).toBeGreaterThanOrEqual(1 - 1e-6);
    expect(selectHits(LIKY, { in: 'intro', limit: 3 })).toHaveLength(3);
    const ex = selectHits(LIKY, { in: 'drop2', except: FIGHT });
    expect(ex.some((h) => FIGHT.some((f) => Math.abs(f - h.time) < 0.04))).toBe(false);
    expect(expandEach(LIKY, { beats: { in: 'intro' } })).toHaveLength(32);
    expect(expandEach(LIKY, { bars: { in: 'verse', every: 2 } })).toHaveLength(4);
  });
  it('synthesizes hits for songs without MUSIC hits', () => {
    const wil = map('when_i_lose');
    const h = songHits(wil);
    expect(h.length).toBeGreaterThan(50);
    expect(h.some((x) => x.kind === 'phrase')).toBe(true);
  });
  it('maps song ↔ momento time through an edit, and flags edits off the bar', () => {
    const warns: string[] = [];
    const segs = resolveEdit(LIKY, [{ from: 0, to: 'chorus' }, { from: 'drop', to: 'second_half' }], (w) => warns.push(w));
    expect(warns).toEqual([]);
    expect(segs[1].m0).toBeCloseTo(43.969, 2);
    expect(songToM(segs, 72)).toBeCloseTo(43.969 + (72 - 71.45), 2);
    expect(mToSong(segs, 50)).toMatchObject({ seg: 1 });
    resolveEdit(LIKY, [{ from: 0, to: 30 }, { from: 'drop', to: 'second_half' }], (w) => warns.push(w));
    expect(warns.some((w) => w.includes('compás'))).toBe(true);
  });
  it('property tracks tween, chain and switch', () => {
    const s = resolveScore(def([key(10, { x: 100 }, { dur: 2, ease: 'linear' }), key(11, { x: 0 }, { dur: 2, ease: 'linear' }), key(5, { pal: 'drop' })]), LIKY);
    const k = s.keys.get('x');
    expect(propAt(k, 9, 0)).toBe(0);
    expect(propAt(k, 10.5, 0)).toBeCloseTo(25);
    // the second key starts from where the first had got to (50 at t = 11)
    expect(propAt(k, 12, 0)).toBeCloseTo(25);
    expect(propAt(k, 20, 0)).toBe(0);
    expect(propAt(s.keys.get('pal'), 4, 'noir')).toBe('noir');
    expect(propAt(s.keys.get('pal'), 6, 'noir')).toBe('drop');
  });
});

describe('the LIKY FIGHT score', () => {
  const s = resolveScore(LIKY_FIGHT, LIKY, ONSETS);
  it('resolves on the beat map with zero warnings', () => {
    expect(s.warnings).toEqual([]);
    expect(s.cues.length).toBeGreaterThan(150);
  });
  it('takes the WHOLE song (the owner asked for it), cut on its last breath', () => {
    expect(s.segments).toHaveLength(1);
    expect(s.segments[0].from).toBe(0);
    expect(s.segments[0].to).toBeCloseTo(LIKY.duration, 2);
    expect(s.mCut).toBeGreaterThan(234.5);
    expect(s.mCut).toBeLessThanOrEqual(LIKY.duration);
    // the second half has its own choreography (not a copy): inputs in every big section of it
    for (const sec of ['intro2', 'verse2', 'prechorus2', 'chorus2', 'drop3', 'break4', 'climax']) {
      const r = LIKY.sections.find((x) => x.name === sec)!;
      expect(s.prompts.some((p) => p.t >= r.start - 0.01 && (p.type === 'tap' ? p.t : p.t) < r.end + 2), sec).toBe(true);
    }
  });
  it('has every input kind, prompts a bar ahead (the barrage half a bar), graded ones never stacked', () => {
    const types = new Set(s.prompts.map((p) => p.type));
    expect([...types].sort()).toEqual(['choice', 'hold', 'mash', 'tap']);
    const bar = 240 / 131;
    for (const p of s.prompts) {
      const lead = p.m - p.mShow;
      if (p.id.startsWith('ball')) expect(lead).toBeCloseTo(bar / 2, 2);
      else expect(lead).toBeCloseTo(bar, 2);
    }
    const graded = s.prompts.filter((p) => !p.optional && p.type === 'tap');
    for (let i = 1; i < graded.length; i++) expect(graded[i].m - graded[i - 1].m).toBeGreaterThanOrEqual(0.3);
  });
  it('puts every tap target of the fights on a measured ACCENT onset (the dembow positions)', () => {
    const acc = selectOnsets(LIKY, ONSETS, { track: 'snare' });
    for (const t of [...BARRAGE, ...FIGHT, ...COUNTER, ...ROCKS, ...CLIMAX]) expect(acc.some((o) => Math.abs(o.t - t) < 0.005), String(t)).toBe(true);
    const balls = s.cues.filter((c) => c.act.verb === 'ball' && c.act.args.prompt);
    expect(balls.map((c) => +c.t.toFixed(3))).toEqual(BARRAGE);
    // the other cannonballs of the chorus land on accents too
    const splash = s.cues.filter((c) => c.act.verb === 'ball' && c.act.args.to === 'sea');
    expect(splash.length).toBeGreaterThan(4);
    expect(splash.every((c) => c.onset?.track === 'snare')).toBe(true);
  });
  it('lights the nine party pieces on intro KICK onsets before ¡FIESTA!', () => {
    const lights = s.cues.filter((c) => c.act.verb === 'lightUp');
    expect(lights).toHaveLength(9);
    expect(lights.every((c) => c.t < 8.244 && c.onset?.track === 'kick')).toBe(true);
  });
  it('onset tracks: ~4 kicks per bar where the drums play, accents on the dembow 16ths, pitched bass notes', () => {
    const kicks = selectOnsets(LIKY, ONSETS, { track: 'kick', in: 'chorus' });
    expect(kicks.length / 8).toBeGreaterThanOrEqual(3.5);
    const step = 60 / 131 / 4;
    const pos = (t: number) => Math.round((t - 43.969) / step) % 16;
    expect(kicks.filter((k) => pos(k.t) % 4 === 0).length / kicks.length).toBeGreaterThan(0.7);
    const acc = selectOnsets(LIKY, ONSETS, { track: 'snare', in: 'chorus', min: 0.3 });
    const dembow = acc.filter((a) => [3, 6, 11, 14].includes(pos(a.t)));
    expect(dembow.length / acc.length).toBeGreaterThan(0.6);
    const bass = selectOnsets(LIKY, ONSETS, { track: 'bass', in: 'verse' });
    expect(bass.length).toBeGreaterThan(20);
    expect(bass.filter((b) => typeof b.midi === 'number' && b.dur! > 0).length / bass.length).toBeGreaterThan(0.7);
  });
  it('uses only verbs that exist (toolkit + stage)', async () => {
    const { TOOLKIT_VERBS } = await import('../src/momentos/anime/fx');
    const { PANEL_VERBS } = await import('../src/momentos/anime/cutin');
    const { LIKY_VERBS } = await import('../src/momentos/songs/likyFight/verbs');
    const { SHOT_VERBS } = await import('../src/momentos/songs/likyFight/shots');
    const known = new Set([...Object.keys(TOOLKIT_VERBS), ...Object.keys(PANEL_VERBS), ...Object.keys(LIKY_VERBS), ...Object.keys(SHOT_VERBS), 'freeze']);
    const used = new Set<string>([...s.cues.map((c) => c.act.verb), ...s.prompts.flatMap((p) => Object.values(p.branches).flat().map((a) => a!.verb))]);
    expect([...used].filter((u) => !known.has(u))).toEqual([]);
  }, 60000); // the first import of the Pixi verbs is slow when the whole suite runs in parallel
  it('is registered for the H44 phase change and is the only Momento there', () => {
    expect(momentoIds()).toContain('liky_fight');
    expect(momentoForFase('cielo_invertidas', 'cielo')?.id).toBe('liky_fight');
    expect(momentoForFase('cielo_invertidas', 'mar')).toBeNull();
    expect(getMomento('liky_fight')?.track).toBe('liky_fight');
  });
});

describe('authoring checks', () => {
  it('flags unknown names, stacked prompts, inputs past the cut, long labels', () => {
    const s = resolveScore(
      def(
        [
          at('nope', 'impact'),
          tap(10, { id: 'a' }, { great: ['x'] }),
          tap(10.1, { id: 'b' }, { great: ['x'] }),
          hold(20, 21, { id: 'h' }, { great: ['x'] }),
          tap(20.5, { id: 'c', label: 'una dos tres cuatro' }, { great: ['x'] }),
          tap(114, { id: 'late' }, { great: ['x'] }),
        ],
        { cut: 114, edit: [{ from: 0, to: 'second_half' }] },
      ),
      LIKY,
    );
    const w = s.warnings.join('\n');
    expect(w).toMatch(/nope/);
    expect(w).toMatch(/taps a y b/);
    expect(w).toMatch(/tap c dentro de hold h/);
    expect(w).toMatch(/más de 3 palabras/);
    expect(w).toMatch(/late cierra después del corte/);
  });
});

// ------------------------------------------------------------------ judging
function core(score: MomentoDef['score'], auto: 'none' | 'great' | 'hit' | 'miss' = 'none') {
  return new MomentoCore(resolveScore(def(score), LIKY), auto);
}
describe('input judging', () => {
  it('tap: great within 60 ms, hit within 150 ms, miss after the window, early presses eat the prompt', () => {
    const t = 20;
    const c = core([tap(t, { id: 'a' }, { great: ['g'], hit: ['h'], miss: ['m'] }), tap(t + 2, { id: 'b' }, { great: ['g'], miss: ['m'] }), tap(t + 4, { id: 'c' }, { great: ['g'], miss: ['m'] }), tap(t + 6, { id: 'd' }, { great: ['g'], miss: ['m'] })]);
    c.advance(t - 3);
    let ev = c.input('down', t + GREAT_S - 0.005);
    expect(ev.find((e) => e.k === 'judge')).toMatchObject({ result: 'great' });
    // the branch starts ON the beat when the press was early, at the press when late
    ev = c.input('down', t + 2 - 0.1);
    const j = ev.find((e) => e.k === 'judge') as { result: string; at: number; cues: { m: number }[] };
    expect(j.result).toBe('hit');
    expect(j.at).toBeCloseTo(t + 2);
    ev = c.input('down', t + 4 - HIT_S - 0.1);
    expect(ev.find((e) => e.k === 'judge')).toMatchObject({ result: 'miss' });
    expect(c.input('down', t + 4).find((e) => e.k === 'judge')).toBeUndefined();
    ev = c.advance(t + 6 + HIT_S + 0.01);
    expect(ev.find((e) => e.k === 'judge')).toMatchObject({ result: 'miss' });
    expect((ev.find((e) => e.k === 'judge') as { at: number }).at).toBeCloseTo(t + 6 + HIT_S);
  });
  it('a stray press far from any window does nothing', () => {
    const c = core([tap(30, { id: 'a' }, { great: ['g'] })]);
    const ev = c.input('down', 25);
    expect(ev.filter((e) => e.k === 'judge')).toHaveLength(0);
    expect(c.states[0].done).toBe(false);
    expect(EARLY_S).toBeGreaterThan(0.1);
  });
  it('hold: press in the window and keep it; release prompts judge the release', () => {
    const c = core([hold(20, 24, { id: 'h' }, { great: ['g'], hit: ['h'], miss: ['m'] }), hold(30, 34, { id: 'r', release: true }, { great: ['g'], hit: ['h'], miss: ['m'] }), hold(40, 44, { id: 'x' }, { great: ['g'], hit: ['h'], miss: ['m'] })]);
    c.input('down', 20.03);
    expect(c.advance(23).filter((e) => e.k === 'judge')).toHaveLength(0);
    expect(c.advance(24.01).find((e) => e.k === 'judge')).toMatchObject({ result: 'great', at: 24 });
    c.input('down', 30.0);
    expect(c.input('up', 34.02).find((e) => e.k === 'judge')).toMatchObject({ result: 'great' });
    c.input('down', 40);
    expect(c.input('up', 41).find((e) => e.k === 'judge')).toMatchObject({ result: 'miss', at: 44 });
  });
  it('mash: taps between the prompt and `until` against need', () => {
    const c = core([mash(20, 24, { id: 'm', need: [5, 10] }, { great: ['g'], hit: ['h'], miss: ['m'] })]);
    for (let i = 0; i < 7; i++) c.input('down', 20.2 + i * 0.3);
    expect(c.advance(24).find((e) => e.k === 'judge')).toMatchObject({ result: 'hit' });
  });
  it('choice: first side wins, else the fallback', () => {
    const c = core([choice(30, { id: 'c', fallback: 'right' }, { left: ['l'], right: ['r'] }), choice(40, { id: 'd', fallback: 'right' }, { left: ['l'], right: ['r'] })]);
    c.advance(29);
    expect(c.wantsSide(29)).toBe(true);
    c.input('left', 29.2);
    c.input('right', 29.5);
    expect(c.advance(30).find((e) => e.k === 'judge')).toMatchObject({ result: 'left' });
    expect(c.advance(40.01).find((e) => e.k === 'judge')).toMatchObject({ result: 'right' });
  });
  it('the «Ajuste de ritmo» and the input lag shift what counts as on the beat (clock.at)', () => {
    let now = 1000;
    let raw = 10;
    const d: AudioDriver = { usable: () => true, trackTime: () => raw, current: () => 'liky_fight', cue: () => undefined, pause: () => undefined, offset: () => 0.12, now: () => now };
    const clk = new MomentoClock([{ from: 0, to: 100, m0: 0 }], d, 'liky_fight', 240 / 131);
    clk.start(true);
    raw = 0.5;
    clk.update();
    now += 1000;
    raw = 1.5;
    clk.update();
    // heard position = raw − offset; an event 20 ms old happened 20 ms earlier
    expect(clk.at(now - 20)).toBeCloseTo(1.5 - 0.12 - 0.02, 3);
    expect(clk.update()).toBeCloseTo(1.38 + VISUAL_LEAD, 3);
  });
  it('grades are cosmetic letters', () => {
    expect(gradeOf(1)).toBe('S');
    expect(gradeOf(0.8)).toBe('A');
    expect(gradeOf(0.6)).toBe('B');
    expect(gradeOf(0)).toBe('C');
  });
});

// ------------------------------------------------------------------ same outcome, whatever the player does
function runAll(auto: 'great' | 'hit' | 'miss' | 'none') {
  const s = resolveScore(LIKY_FIGHT, LIKY, ONSETS);
  const c = new MomentoCore(s, auto);
  for (let m = 0; m <= s.mCut + 0.05; m += 1 / 60) c.advance(m);
  c.advance(s.mCut + 1);
  return c;
}
describe('same outcome', () => {
  it('all-perfect, all-miss and no-input runs finish every prompt and only the grade differs', () => {
    const runs = (['great', 'miss', 'none'] as const).map(runAll);
    for (const r of runs) expect(r.finished).toBe(true);
    const res = runs.map((r) => r.result('done', 'internal'));
    expect(res[0].grade).toBe('S');
    expect(res[1].grade).toBe('C');
    expect(res[2].grade).toBe('C');
    // the save after each run: identical except the cosmetic grade
    const base = () => ({ ext: { music: { unlocked: { liky_fight: { at: 5, source: 'x' } } } } as Record<string, unknown>, gold: 100, missions: { done: ['H43'] } });
    const saves = res.map((r) => {
      const s = base();
      commitMomento(s, r, 123456);
      return s;
    });
    const strip = (s: ReturnType<typeof base>) => {
      const c = structuredClone(s);
      const seen = (c.ext.momentos as { seen: Record<string, Record<string, unknown>> }).seen.liky_fight;
      for (const k of COSMETIC_KEYS) delete seen[k];
      return c;
    };
    expect(strip(saves[0])).toEqual(strip(saves[1]));
    expect(strip(saves[1])).toEqual(strip(saves[2]));
    expect(momentoSeen(saves[0], 'liky_fight')).toBe(true);
  });
  it('every branch of every prompt is scheduled exactly once per run', () => {
    const r = runAll('great');
    const ids = new Set(r.branchCues.map((c) => c.prompt));
    expect(ids.size).toBe(r.states.filter((s) => Object.values(s.p.branches).some((b) => b && b.length)).length);
  });
});

// ------------------------------------------------------------------ the clock
function fakeDriver() {
  const st = { now: 0, raw: null as number | null, cur: null as string | null, usable: true, paused: false, cues: [] as { at: number; q: string }[] };
  const d: AudioDriver = {
    usable: () => st.usable,
    trackTime: () => (st.paused ? st.raw : st.raw),
    current: () => st.cur,
    cue: (at, q) => st.cues.push({ at, q }),
    pause: (on) => (st.paused = on),
    offset: () => 0,
    now: () => st.now,
  };
  return { st, d };
}
const SEGS: Segment[] = [{ from: 0, to: 117.252, m0: 0 }];
describe('the momento clock', () => {
  it('follows the heard song once it sounds', () => {
    const { st, d } = fakeDriver();
    const c = new MomentoClock(SEGS, d, 'liky_fight', 240 / 131);
    c.start(true);
    expect(st.cues[0]).toMatchObject({ at: 0, q: 'now' });
    st.now = 100;
    expect(c.update()).toBe(0);
    expect(c.mode).toBe('pending');
    st.cur = 'liky_fight';
    st.raw = 0.05;
    c.update();
    expect(c.mode).toBe('audio');
    st.raw = 12.5;
    expect(c.update()).toBeCloseTo(12.5 + VISUAL_LEAD);
  });
  it('falls back to the internal clock when the song never comes, and never waits', () => {
    const { st, d } = fakeDriver();
    const c = new MomentoClock(SEGS, d, 'liky_fight', 240 / 131);
    c.start(true);
    st.now = PENDING_MS + 10;
    c.update();
    expect(c.mode).toBe('internal');
    st.now += 5000;
    expect(c.update()).toBeCloseTo(5 + VISUAL_LEAD, 2);
    // no sound at all: internal from the start
    const f2 = fakeDriver();
    f2.st.usable = false;
    const c2 = new MomentoClock(SEGS, f2.d, 'liky_fight', 240 / 131);
    c2.start(true);
    expect(c2.mode).toBe('internal');
    expect(f2.st.cues).toHaveLength(0);
  });
  it('pause / resume: time stops (audio paused too) and continues where it was', () => {
    const { st, d } = fakeDriver();
    const c = new MomentoClock(SEGS, d, 'liky_fight', 240 / 131);
    st.usable = false;
    c.start(false);
    st.now = 3000;
    c.update();
    c.pause(true);
    st.now = 60000;
    expect(c.update()).toBeCloseTo(3 + VISUAL_LEAD, 3);
    c.pause(false);
    st.now = 61000;
    expect(c.update()).toBeCloseTo(4 + VISUAL_LEAD, 3);
    // audio mode: the deck is paused / resumed through the driver
    const f = fakeDriver();
    const a = new MomentoClock(SEGS, f.d, 'liky_fight', 240 / 131);
    a.start(true);
    f.st.cur = 'liky_fight';
    f.st.raw = 0.02;
    a.update();
    a.pause(true);
    expect(f.st.paused).toBe(true);
    a.pause(false);
    expect(f.st.paused).toBe(false);
  });
  it('late join: the sound unlocks mid-way, the song is cued where we are and the clock hops on', () => {
    const { st, d } = fakeDriver();
    st.usable = false;
    const c = new MomentoClock(SEGS, d, 'liky_fight', 240 / 131);
    c.start(true);
    expect(c.mode).toBe('internal');
    st.now = 10000;
    st.usable = true;
    c.update();
    expect(st.cues.at(-1)!.at).toBeCloseTo(10.35, 1);
    st.cur = 'liky_fight';
    st.now = 10400;
    st.raw = 10.4;
    c.update();
    expect(c.mode).toBe('audio');
    expect(c.kind).toBe('mixed');
  });
  it('edits: the next segment is cued half a bar early on the bar line, and followed', () => {
    const { st, d } = fakeDriver();
    const segs: Segment[] = [
      { from: 0, to: 43.969, m0: 0 },
      { from: 71.45, to: 117.252, m0: 43.969 },
    ];
    const c = new MomentoClock(segs, d, 'liky_fight', 240 / 131);
    c.start(true);
    st.cur = 'liky_fight';
    st.raw = 0.01;
    c.update();
    st.raw = 42.9;
    c.update();
    expect(st.cues).toHaveLength(1);
    st.raw = 43.2;
    c.update();
    expect(st.cues.at(-1)).toMatchObject({ at: 71.45, q: 'bar' });
    st.raw = 43.9;
    expect(c.update()).toBeCloseTo(43.9 + VISUAL_LEAD, 3);
    st.raw = 71.5;
    expect(c.update()).toBeCloseTo(43.969 + 0.05 + VISUAL_LEAD, 2);
  });
});

// ------------------------------------------------------------------ accessibility
describe('flash limiter', () => {
  it('never grants more than 3 full-screen flashes in any second', () => {
    const g = new FlashGuard(false);
    const grants = [];
    for (let i = 0; i < 40; i++) grants.push({ m: i * 0.1, g: g.request(i * 0.1, 'impact') });
    const full = grants.filter((x) => x.g === 'full').map((x) => x.m);
    for (const t of full) expect(full.filter((u) => u <= t && t - u < 1).length).toBeLessThanOrEqual(3);
    expect(full.length).toBeGreaterThan(5);
  });
  it('«Reducir destellos» makes every flash soft; saturated red is never a flash color', () => {
    const g = new FlashGuard(true);
    expect(g.request(1)).toBe('soft');
    expect(isSaturatedRed(0xff0000)).toBe(true);
    expect(isSaturatedRed(0xc8102e)).toBe(true);
    expect(isSaturatedRed(0xff2e88)).toBe(false);
    expect(safeFlashColor(0xff1010)).not.toBe(0xff1010);
    expect(safeFlashColor(0xffe14a)).toBe(0xffe14a);
  });
  it('the LIKY FIGHT score never asks for more than 3 full flashes in a second when played perfectly', () => {
    const s = resolveScore(LIKY_FIGHT, LIKY, ONSETS);
    const r = runAll('great');
    const flashy = [...s.cues, ...r.branchCues].filter((c) => c.act.verb === 'impact' || (c.act.verb === 'flash' && Number(c.act.args.amount ?? 0.7) > 0.25)).map((c) => c.m).sort((a, b) => a - b);
    const g = new FlashGuard(false);
    for (const m of flashy) g.request(m, 'impact');
    const full = g.log.filter((x) => x.grant === 'full').map((x) => x.m);
    for (const t of full) expect(full.filter((u) => u <= t && t - u < 1).length).toBeLessThanOrEqual(3);
  });
});

// ------------------------------------------------------------------ the save slice
describe('ext.momentos', () => {
  it('normalizes junk, keeps unknown ids and keys, drops nothing valid', () => {
    expect(normalizeMomentos(null)).toBeNull();
    expect(normalizeMomentos({ seen: {} })).toBeNull();
    const n = normalizeMomentos({ seen: { liky_fight: { at: 'x', best: 'Z', plays: -3, extra: 1 }, futuro: { at: 9 } }, otra: true })!;
    expect(n.seen.liky_fight).toMatchObject({ at: 1, plays: 1, extra: 1 });
    expect(n.seen.liky_fight.best).toBeUndefined();
    expect(n.seen.futuro.at).toBe(9);
    expect(n.otra).toBe(true);
    expect(normalizeMomentos(n)).toEqual(n);
  });
  it('commit: only completions count, the first time is reported, the best grade is kept', () => {
    const s: { ext?: Record<string, unknown> } = {};
    const r = (grade: 'S' | 'C', end: 'done' | 'exited' = 'done') => ({ id: 'liky_fight', grade, pct: 0, counts: { great: 0, hit: 0, miss: 0, bonus: 0 }, results: {}, end, clock: 'audio' as const });
    expect(commitMomento(s, r('S', 'exited'), 1)).toBe(false);
    expect(momentoSeen(s, 'liky_fight')).toBe(false);
    expect(commitMomento(s, r('S'), 10)).toBe(true);
    expect(commitMomento(s, r('C'), 20)).toBe(false);
    expect(momentosOf(s).seen.liky_fight).toMatchObject({ at: 10, best: 'S', plays: 2 });
    expect(seenMomentos(s).map((x) => x.id)).toEqual(['liky_fight']);
  });
});
