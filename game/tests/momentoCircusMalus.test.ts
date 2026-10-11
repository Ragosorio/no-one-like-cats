/**
 * CIRCUS MALUS «Momento musical» (H62, docs/part-ii/29 §15): the score resolves on the real beat map with zero warnings
 * and takes the whole song; its inputs sit on measured onsets (the grid-locked onset tracks); only known verbs, none of
 * NEÓN CEL's; the same outcome whatever the player presses (perfect / all missed / no input); the flash limiter holds;
 * it is registered (Volver a ver, Fonoteca, ext.momentos) and plugs into the H62 phase change through the FASES
 * interlude — and the H62 fight is the same, shot by shot, with and without it (screen = estimate).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanBeatMap, type BeatMap } from '../src/audio/beatgrid';
import { resolveScore } from '../src/momentos/score';
import { selectOnsets } from '../src/momentos/time';
import { MomentoCore } from '../src/momentos/core';
import { FlashGuard } from '../src/momentos/flash';
import { COSMETIC_KEYS, commitMomento, momentoSeen } from '../src/momentos/save';
import type { OnsetMap } from '../src/momentos/types';

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

await import('../src/momentos/songs');
const { getMomento, momentoForFase, momentoIds, seenMomentos } = await import('../src/momentos/registry');
const SC = await import('../src/momentos/songs/circusMalus/score');
const { CIRCUS_HOOK } = await import('../src/momentos/songs/circusMalus/index');
const { faseInterlude, faseIndex, registerFaseInterlude } = await import('../src/battle/fases');
const { CIRCUS_MALUS } = SC;

const MAPS = join(__dirname, '../src/data/music/beatmaps');
const MAP: BeatMap = cleanBeatMap(JSON.parse(readFileSync(join(MAPS, 'circus_malus.json'), 'utf8')), 'circus_malus')!;
const ONSETS = JSON.parse(readFileSync(join(MAPS, 'circus_malus.onsets.json'), 'utf8')) as OnsetMap;
const near = (list: { t: number }[], t: number) => Math.min(...list.map((o) => Math.abs(o.t - t)));

describe('the CIRCUS MALUS score', () => {
  const s = resolveScore(CIRCUS_MALUS, MAP, ONSETS);
  it('resolves on the beat map with zero warnings', () => {
    expect(s.warnings).toEqual([]);
    expect(s.cues.length).toBeGreaterThan(150);
  });
  it('takes the WHOLE song, no edit, cut on its end (the chord has died, the file is silent)', () => {
    expect(s.segments).toHaveLength(1);
    expect(s.segments[0].from).toBe(0);
    expect(s.segments[0].to).toBeCloseTo(MAP.duration, 2);
    expect(s.mCut).toBeCloseTo(125.05, 2);
    // every section of the song has its own staging, and inputs in every one of them
    for (const sec of MAP.sections) {
      expect(s.cues.filter((c) => c.t >= sec.start && c.t < sec.end && c.act.verb !== 'beat').length, sec.name).toBeGreaterThan(0);
      expect(s.prompts.some((p) => p.t >= sec.start - 0.01 && p.t < sec.end), sec.name).toBe(true);
    }
  });
  it('every input kind, ≥ 25 graded prompts, labels of 1–3 words, never two on screen at once', () => {
    expect(new Set(s.prompts.map((p) => p.type))).toEqual(new Set(['tap', 'hold', 'mash', 'choice']));
    const graded = s.prompts.filter((p) => !p.optional && p.type !== 'choice');
    expect(graded.length).toBeGreaterThanOrEqual(25);
    for (const p of s.prompts) if (p.spec.label) expect(p.spec.label.split(/\s+/).length).toBeLessThanOrEqual(3);
    const byShow = [...s.prompts].sort((a, b) => a.mShow - b.mShow);
    for (let i = 1; i < byShow.length; i++) {
      const prev = byShow[i - 1];
      const end = prev.type === 'tap' ? prev.m + 0.15 : prev.mEnd + 0.15;
      expect(byShow[i].mShow, `${prev.id} → ${byShow[i].id}`).toBeGreaterThanOrEqual(end - 1e-6);
    }
  });
  it('puts every input on a measured onset: stamps on snares, steps and the mirror on kicks, the last one on the crooked chord', () => {
    const snare = selectOnsets(MAP, ONSETS, { track: 'snare', min: 0.5 });
    const kick = selectOnsets(MAP, ONSETS, { track: 'kick', min: 0.45 });
    const mel = selectOnsets(MAP, ONSETS, { track: 'melody', min: 0.9 });
    for (const t of [...SC.SELLOS, ...SC.GOLPES, ...SC.KNOCK_T]) expect(near(snare, t), String(t)).toBeLessThan(0.005);
    for (const t of [...SC.PASOS, ...SC.ESPEJO, 12.9, 56.1, 96.9]) expect(near(kick, t), String(t)).toBeLessThan(0.005);
    expect(near(mel, SC.CHORDS[3])).toBeLessThan(0.005);
    // and every prompt of the score (taps, the hold's release, the mash's end, the choices) on SOME onset
    const all = (['kick', 'snare', 'perc', 'melody', 'bass'] as const).flatMap((track) => selectOnsets(MAP, ONSETS, { track }));
    for (const p of s.prompts) {
      expect(near(all, p.t), p.id).toBeLessThan(0.005);
      if (p.type === 'hold' || p.type === 'mash') expect(near(all, p.t + (p.mEnd - p.m)), `${p.id} end`).toBeLessThan(0.005);
    }
  });
  it('the weird final: four chords on the beat map, the breath, the last tap on the crooked one, perfection before it', () => {
    const mk = (n: string) => MAP.markers.find((x) => x.name === n)!.time;
    expect([mk('weird_final'), mk('final_chord_2'), mk('final_chord_3'), mk('final_chord_4')]).toEqual(SC.CHORDS);
    expect(mk('breath')).toBeCloseTo(SC.BREATH, 3);
    const sym = s.keys.get('sym')!;
    expect(sym.filter((k) => k.m < SC.CHORDS[3]).map((k) => k.value)).toEqual([1 / 3, 2 / 3, 1]);
    expect(sym.find((k) => Math.abs(k.m - SC.CHORDS[3]) < 1e-6)?.value).toBe(0);
    expect(s.cues.some((c) => c.act.verb === 'freeze' && Math.abs(c.t - SC.BREATH) < 0.002)).toBe(true);
    const last = s.prompts.find((p) => p.id === 'ultimo')!;
    expect(last.t).toBeCloseTo(SC.CHORDS[3], 3);
    for (const r of ['great', 'hit', 'miss'] as const) expect(last.branches[r]!.some((a) => a.verb === 'tearOpen')).toBe(true);
  });
  it('uses only verbs that exist, and never NEÓN CEL: no cut-ins, manga panels, katakana or screentone', async () => {
    const { TOOLKIT_VERBS } = await import('../src/momentos/anime/fx');
    const { CIRCUS_VERBS } = await import('../src/momentos/songs/circusMalus/verbs');
    const { SHOT_VERBS } = await import('../src/momentos/songs/circusMalus/shots');
    const { CIRCUS_PALETTES } = await import('../src/momentos/songs/circusMalus/stage');
    const known = new Set([...Object.keys(TOOLKIT_VERBS), ...Object.keys(CIRCUS_VERBS), ...Object.keys(SHOT_VERBS), 'freeze']);
    const acts = [...s.cues.map((c) => c.act), ...s.prompts.flatMap((p) => Object.values(p.branches).flatMap((b) => b ?? []))];
    for (const a of acts) expect(known.has(a.verb), a.verb).toBe(true);
    expect(acts.some((a) => ['cutin', 'panels', 'sfx'].includes(a.verb))).toBe(false);
    expect(acts.some((a) => typeof a.args.kata === 'string')).toBe(false);
    for (const p of Object.values(CIRCUS_PALETTES)) expect(p.grade.tone).toBe(0);
  }, 60_000);
});

describe('the grid-locked onset tracks (scripts/onsets_grid.py)', () => {
  it('every kick, accent, hat, note and stab on the 16th grid of the 100 BPM map; the riff in the bass', () => {
    const step = 60 / MAP.bpm / 4;
    for (const tr of ['kick', 'snare', 'perc', 'melody', 'bass'] as const) {
      const l = selectOnsets(MAP, ONSETS, { track: tr });
      expect(l.length, tr).toBeGreaterThan(50);
      for (const o of l) expect(Math.abs(o.t / step - Math.round(o.t / step)) * step, `${tr} ${o.t}`).toBeLessThan(0.001);
    }
    // the snare is the backbeat (beats 2 and 4) and enters with the chorus
    const sn = selectOnsets(MAP, ONSETS, { track: 'snare', min: 0.3 });
    expect(sn[0].t).toBeGreaterThan(24);
    expect(sn.filter((o) => Math.round(o.t / step) % 8 === 4).length / sn.length).toBeGreaterThan(0.9);
    // the riff: E1 home, up to D2 / E2, F1, D1 (MIDI 28 38 40 29 26)
    const notes = new Set(selectOnsets(MAP, ONSETS, { track: 'bass', in: 'verse' }).map((o) => o.midi));
    for (const n of [28, 38, 40, 29, 26]) expect(notes.has(n), String(n)).toBe(true);
    // the outro: only the four chords and their echoes (no drums, no bass)
    expect(selectOnsets(MAP, ONSETS, { track: 'kick', in: 'outro', min: 0.3 })).toHaveLength(0);
    expect(selectOnsets(MAP, ONSETS, { track: 'snare', in: 'outro' })).toHaveLength(0);
  });
});

describe('registered: Volver a ver, Fonoteca, ext.momentos, and the H62 hook', () => {
  it('is a Momento of H62 with its original and a spoiler-free source', () => {
    expect(momentoIds()).toContain('circus_malus');
    const d = getMomento('circus_malus')!;
    expect(d.track).toBe('circus_malus');
    expect(d.mission).toBe('H62');
    expect(d.unlocks).toEqual(['circus_malus']);
    expect(d.source).toBe('El Umbral');
    const tracks = JSON.parse(readFileSync(join(__dirname, '../src/data/music/tracks.json'), 'utf8')) as { id: string }[];
    expect(tracks.some((t) => t.id === 'circus_malus')).toBe(true);
  });
  it('shows in «Volver a ver» once completed (the save only gains ext.momentos.circus_malus)', () => {
    const save = { ext: {} as Record<string, unknown> };
    expect(seenMomentos(save).some((x) => x.id === 'circus_malus')).toBe(false);
    const r = runAll('great').result('done', 'audio');
    expect(commitMomento(save, r, 1000)).toBe(true);
    expect(momentoSeen(save, 'circus_malus')).toBe(true);
    expect(seenMomentos(save).find((x) => x.id === 'circus_malus')?.title).toBe('CIRCUS MALUS');
    expect(Object.keys(save.ext)).toEqual(['momentos']);
  });
  it('plugs into the H62 phase change through the FASES interlude (once: not BattleScene’s own path)', () => {
    const src = readFileSync(join(__dirname, '../src/state/sys/rupturasO4Battles.ts'), 'utf8');
    const m = /H62_MOMENTO = \{ battle: '([^']+)', fase: '([^']+)', song: '([^']+)' \}/.exec(src);
    expect(m).not.toBeNull();
    expect([m![1], m![2], m![3]]).toEqual([CIRCUS_HOOK.battle, CIRCUS_HOOK.fase, CIRCUS_HOOK.song]);
    expect(CIRCUS_MALUS.battle).toBeUndefined();
    expect(momentoForFase('umbral_correctores', 'el_plan')).toBeNull();
    expect(faseInterlude('umbral_correctores', 'el_plan')).toBeTypeOf('function');
    expect(faseInterlude('umbral_correctores', 'correccion')).toBeNull();
  });
});

// ------------------------------------------------------------------ same outcome, whatever the player does
function runAll(auto: 'great' | 'hit' | 'miss' | 'none') {
  const s = resolveScore(CIRCUS_MALUS, MAP, ONSETS);
  const c = new MomentoCore(s, auto);
  for (let m = 0; m <= s.mCut + 0.05; m += 1 / 60) c.advance(m);
  c.advance(s.mCut + 1);
  return c;
}
describe('same outcome, whatever the player does', () => {
  it('perfect, all-miss and no-input runs finish every prompt; the saves differ only in the cosmetic grade', () => {
    const runs = (['great', 'miss', 'none'] as const).map(runAll);
    for (const r of runs) expect(r.finished).toBe(true);
    const res = runs.map((r) => r.result('done', 'internal'));
    expect(res[0].grade).toBe('S');
    expect(res[1].grade).toBe('C');
    expect(res[2].grade).toBe('C');
    const base = () => ({ ext: { music: { unlocked: {} } } as Record<string, unknown>, gold: 100, missions: { done: ['H61'] } });
    const strip = (sv: ReturnType<typeof base>) => {
      const c = structuredClone(sv);
      const seen = (c.ext.momentos as { seen: Record<string, Record<string, unknown>> }).seen.circus_malus;
      for (const k of COSMETIC_KEYS) delete seen[k];
      return c;
    };
    const saves = res.map((r) => {
      const sv = base();
      commitMomento(sv, r, 777);
      return strip(sv);
    });
    expect(saves[0]).toEqual(saves[1]);
    expect(saves[1]).toEqual(saves[2]);
  });
  it('played perfectly it never asks for more than 3 full flashes in a second (and no saturated red ones)', () => {
    const s = resolveScore(CIRCUS_MALUS, MAP, ONSETS);
    const r = runAll('great');
    const flashy = [...s.cues, ...r.branchCues].filter((c) => c.act.verb === 'impact' || (c.act.verb === 'flash' && Number(c.act.args.amount ?? 0.7) > 0.25)).map((c) => c.m).sort((a, b) => a - b);
    const g = new FlashGuard(false);
    for (const m of flashy) g.request(m, 'impact');
    const full = g.log.filter((x) => x.grant === 'full').map((x) => x.m);
    expect(full.length).toBeGreaterThan(3);
    for (const t of full) expect(full.filter((u) => u <= t && t - u < 1).length).toBeLessThanOrEqual(3);
    expect([...s.cues, ...r.branchCues].some((c) => c.act.verb === 'flash')).toBe(false);
  });
});

// ------------------------------------------------------------------ H62: the interlude changes nothing in the fight
describe('H62: the Momento is presentation only', () => {
  const load = async () => {
    const { G } = await import('../src/state');
    const { SAVE_KEY } = await import('../src/core/save');
    const { checkMissions } = await import('../src/state/sys/missions');
    const env = JSON.parse(readFileSync(new URL('../test-saves/rupturas-o4.json', import.meta.url), 'utf8'));
    mem.clear();
    mem.set(SAVE_KEY, JSON.stringify(env));
    G.load();
    checkMissions();
  };
  it('the same seeds give the same fight, shot by shot, with and without the interlude (and EL PLAN — the end — comes in most fights)', async () => {
    await load();
    const { buildStoryBattle } = await import('../src/state/sys/storyBattles');
    const { autoBattle } = await import('../src/battle/autoplay');
    const { DIFFICULTY } = await import('../src/battle/ai');
    const sp = buildStoryBattle('umbral_correctores', () => undefined);
    expect(sp.rules?.fases?.phases.map((p) => p.id)).toEqual(['correccion', 'el_plan']);
    const { onEnd: _drop, ...plain } = sp;
    // what the estimate worker gets (structured clone: no functions)
    const worker = structuredClone(plain) as typeof sp;
    const play = (spec: typeof sp, seed: number) => {
      const log: string[] = [];
      let reached = -1;
      const res = autoBattle(spec, DIFFICULTY.normal, seed, 30, (b, side, shot) => {
        if (reached < 0 && faseIndex(b) === 1) reached = b.turn;
        log.push(`${b.turn}|${side}|${shot}|${b.wind}|${b.field.gMul}|${b.sides[0].ship.cells().reduce((a, c) => a + c.hp, 0)}|${b.sides[1].ship.cells().reduce((a, c) => a + c.hp, 0)}`);
      });
      return { res, log, reached };
    };
    const hook = faseInterlude('umbral_correctores', 'el_plan');
    expect(hook).toBeTypeOf('function');
    const seeds = [3, 17, 4242, 90001];
    const withIt = seeds.map((seed) => play(sp, seed));
    registerFaseInterlude('umbral_correctores', 'el_plan', null);
    try {
      const without = seeds.map((seed) => play(worker, seed));
      for (let i = 0; i < seeds.length; i++) {
        expect(withIt[i].res).toEqual(without[i].res);
        expect(withIt[i].log).toEqual(without[i].log);
      }
    } finally {
      registerFaseInterlude('umbral_correctores', 'el_plan', hook);
    }
    // owner's rule (2026-10-10): entering EL PLAN (the Momento) ENDS the fight in a victory
    // (a won fight always ends inside EL PLAN: at its threshold or on the winning shot)
    expect(withIt.filter((r) => r.res.won).length).toBeGreaterThanOrEqual(seeds.length - 1);
  }, 180_000);
});
