/**
 * WHEN I LOSE «Momento musical» (H35, docs/part-ii/29 §14): the score resolves on the real beat map with zero warnings
 * and takes the whole song; its inputs sit on measured onsets; only known verbs; the same outcome whatever the player
 * presses; the flash limiter holds; and the H35 phase split that hosts it is PRESENTATION ONLY — the same seeds give
 * the same fight, shot by shot, with and without it (screen = estimate).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanBeatMap, type BeatMap } from '../src/audio/beatgrid';
import { resolveScore } from '../src/momentos/score';
import { selectOnsets } from '../src/momentos/time';
import { MomentoCore } from '../src/momentos/core';
import { FlashGuard } from '../src/momentos/flash';
import { COSMETIC_KEYS, commitMomento } from '../src/momentos/save';
import { getMomento, momentoForFase, momentoIds } from '../src/momentos/registry';
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
const { WHEN_I_LOSE, BREAK_PAGES, ILUMINA, FUEGO, FINAL } = await import('../src/momentos/songs/whenILose/score');
const { H35_MOMENTO } = await import('../src/momentos/songs/whenILose/index');
const { faseInterlude, faseIndex } = await import('../src/battle/fases');

const MAPS = join(__dirname, '../src/data/music/beatmaps');
const MAP: BeatMap = cleanBeatMap(JSON.parse(readFileSync(join(MAPS, 'when_i_lose.json'), 'utf8')), 'when_i_lose')!;
const ONSETS = JSON.parse(readFileSync(join(MAPS, 'when_i_lose.onsets.json'), 'utf8')) as OnsetMap;

describe('the WHEN I LOSE score', () => {
  const s = resolveScore(WHEN_I_LOSE, MAP, ONSETS);
  it('resolves on the beat map with zero warnings', () => {
    expect(s.warnings).toEqual([]);
  });
  it('takes the WHOLE song, no edit, cut on its last breath', () => {
    expect(s.segments).toHaveLength(1);
    expect(s.segments[0].from).toBe(0);
    expect(s.segments[0].to).toBeCloseTo(MAP.duration, 2);
    expect(s.mCut).toBeGreaterThan(219);
    expect(s.mCut).toBeLessThanOrEqual(MAP.duration);
    // every section of the song has something happening in it
    for (const sec of MAP.sections) {
      const n = s.cues.filter((c) => c.t >= sec.start && c.t < sec.end && c.act.verb !== 'pulse').length;
      expect(n, sec.name).toBeGreaterThan(0);
    }
  });
  it('has fewer, weightier inputs than LIKY FIGHT: every kind, a bar of warning, never stacked', () => {
    const graded = s.prompts.filter((p) => !p.optional);
    expect(graded.length).toBeGreaterThanOrEqual(14);
    expect(graded.length).toBeLessThanOrEqual(22);
    expect(new Set(s.prompts.map((p) => p.type))).toEqual(new Set(['tap', 'hold', 'choice']));
    for (const p of s.prompts) expect(p.m - p.mShow).toBeGreaterThanOrEqual(MAP.beats[4] - MAP.beats[0] - 0.01);
    for (const p of s.prompts) if (p.spec.label) expect(p.spec.label.split(/\s+/).length).toBeLessThanOrEqual(3);
  });
  it('puts every fight tap on a measured KICK onset', () => {
    const kicks = selectOnsets(MAP, ONSETS, { track: 'kick', min: 0.7 });
    for (const t of [...BREAK_PAGES, ...ILUMINA, ...FUEGO, ...FINAL]) expect(Math.min(...kicks.map((k) => Math.abs(k.t - t))), String(t)).toBeLessThan(0.012);
  });
  it('the giant hits (0, 68.571, 178.286) carry the heaviest verbs', () => {
    for (const t of [0, 68.571]) expect(s.cues.some((c) => c.act.verb === 'heavy' && Math.abs(c.t - t) < 0.02), String(t)).toBe(true);
    const gota = s.prompts.find((p) => p.id === 'gota')!;
    expect(gota.spec.release).toBe(true);
    expect(gota.mEnd).toBeCloseTo(178.286, 2);
    for (const r of ['great', 'hit', 'miss'] as const) expect(gota.branches[r]!.some((a) => a.verb === 'heavy')).toBe(true);
  });
  it('uses only verbs that exist (toolkit + stage)', async () => {
    const { TOOLKIT_VERBS } = await import('../src/momentos/anime/fx');
    const { PANEL_VERBS } = await import('../src/momentos/anime/cutin');
    const { WIL_VERBS } = await import('../src/momentos/songs/whenILose/verbs');
    const { PLATE_VERBS } = await import('../src/momentos/songs/whenILose/plates');
    const known = new Set([...Object.keys(TOOLKIT_VERBS), ...Object.keys(PANEL_VERBS), ...Object.keys(WIL_VERBS), ...Object.keys(PLATE_VERBS), 'freeze']);
    const used = new Set([...s.cues.map((c) => c.act.verb), ...s.prompts.flatMap((p) => Object.values(p.branches).flatMap((b) => (b ?? []).map((a) => a.verb)))]);
    for (const u of used) expect(known.has(u), u).toBe(true);
  });
  it('never draws in NEÓN CEL: no cut-ins, no manga panels, no katakana, no screentone in its palettes', async () => {
    const used = [...s.cues.map((c) => c.act), ...s.prompts.flatMap((p) => Object.values(p.branches).flat())].filter(Boolean);
    expect(used.some((a) => a!.verb === 'cutin' || a!.verb === 'panels' || a!.verb === 'sfx')).toBe(false);
    expect(used.some((a) => typeof a!.args.kata === 'string')).toBe(false);
    const { WIL_PALETTES } = await import('../src/momentos/songs/whenILose/stage');
    for (const p of Object.values(WIL_PALETTES)) expect(p.grade.tone).toBe(0);
  });
  it('is registered and plugs into the H35 phase change through the FASES interlude hook', () => {
    expect(momentoIds()).toContain('when_i_lose');
    expect(getMomento('when_i_lose')?.track).toBe('when_i_lose');
    expect(getMomento('when_i_lose')?.mission).toBe('H35');
    expect(H35_MOMENTO).toEqual({ battle: 'ruptura_bibliotecario', fase: 'memoria', song: 'when_i_lose' });
    expect(typeof faseInterlude('ruptura_bibliotecario', 'memoria')).toBe('function');
    // not through BattleScene's own momentoForFase path (that would play it twice)
    expect(momentoForFase('ruptura_bibliotecario', 'memoria')).toBeNull();
  });
});

function runAll(auto: 'great' | 'hit' | 'miss' | 'none') {
  const s = resolveScore(WHEN_I_LOSE, MAP, ONSETS);
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
    const base = () => ({ ext: {} as Record<string, unknown>, gold: 100, missions: { done: ['H34'] } });
    const strip = (s: ReturnType<typeof base>) => {
      const c = structuredClone(s);
      const seen = (c.ext.momentos as { seen: Record<string, Record<string, unknown>> }).seen.when_i_lose;
      for (const k of COSMETIC_KEYS) delete seen[k];
      return c;
    };
    const saves = res.map((r) => {
      const s = base();
      commitMomento(s, r, 777);
      return strip(s);
    });
    expect(saves[0]).toEqual(saves[1]);
    expect(saves[1]).toEqual(saves[2]);
  });
  it('played perfectly it never asks for more than 3 full flashes in a second', () => {
    const s = resolveScore(WHEN_I_LOSE, MAP, ONSETS);
    const r = runAll('great');
    const flashy = [...s.cues, ...r.branchCues].filter((c) => c.act.verb === 'impact' || c.act.verb === 'heavy' || (c.act.verb === 'flash' && Number(c.act.args.amount ?? 0.7) > 0.25)).map((c) => c.m).sort((a, b) => a - b);
    const g = new FlashGuard(false);
    for (const m of flashy) g.request(m, 'impact');
    const full = g.log.filter((x) => x.grant === 'full').map((x) => x.m);
    for (const t of full) expect(full.filter((u) => u <= t && t - u < 1).length).toBeLessThanOrEqual(3);
  });
});

// ------------------------------------------------------------------ H35: the phase split changes nothing in the fight
describe('H35: the phase split is presentation only', () => {
  const load = async () => {
    const { G } = await import('../src/state');
    const { SAVE_KEY } = await import('../src/core/save');
    const { checkMissions } = await import('../src/state/sys/missions');
    const { RESET_PATCH_ID } = await import('../src/state/sys/rupturasReset');
    const env = JSON.parse(readFileSync(new URL('../test-saves/post-finale.json', import.meta.url), 'utf8'));
    env.state.missions.done.push('H31', 'H32', 'H33', 'H34');
    env.state.patches = [...(env.state.patches ?? []), RESET_PATCH_ID];
    mem.clear();
    mem.set(SAVE_KEY, JSON.stringify(env));
    G.load();
    checkMissions();
  };
  it('declares two plain phases (no env, no effects, no banner) and stays structured-cloneable', async () => {
    await load();
    const { buildStoryBattle } = await import('../src/state/sys/storyBattles');
    const sp = buildStoryBattle('ruptura_bibliotecario', () => undefined);
    const ph = sp.rules?.fases?.phases ?? [];
    expect(ph.map((p) => p.id)).toEqual(['sala', 'memoria']);
    for (const p of ph) {
      expect(p.env).toBeUndefined();
      expect(p.effects).toBeUndefined();
      expect(p.banner).toBe(false);
    }
    expect(sp.rules?.noise).toBeTruthy();
    const { onEnd: _drop, ...plain } = sp;
    expect(() => structuredClone(plain)).not.toThrow();
  });
  it('the same seeds give the same fight, shot by shot, with and without the split (and the Momento comes in most fights)', async () => {
    await load();
    const { buildStoryBattle } = await import('../src/state/sys/storyBattles');
    const { autoBattle } = await import('../src/battle/autoplay');
    const { DIFFICULTY } = await import('../src/battle/ai');
    const sp = buildStoryBattle('ruptura_bibliotecario', () => undefined);
    const { onEnd: _drop, ...plain } = sp;
    const without = structuredClone(plain) as typeof sp;
    delete without.rules!.fases;
    const play = (spec: typeof sp, seed: number) => {
      const log: string[] = [];
      let reached = -1;
      const res = autoBattle(spec, DIFFICULTY.normal, seed, 30, (b, side, shot) => {
        if (reached < 0 && faseIndex(b) === 1) reached = b.turn;
        log.push(`${b.turn}|${side}|${shot}|${b.wind}|${b.field.gMul}|${b.sides[0].ship.cells().reduce((a, c) => a + c.hp, 0)}|${b.sides[1].ship.cells().reduce((a, c) => a + c.hp, 0)}`);
      });
      return { res, log, reached };
    };
    let reached = 0;
    const seeds = [3, 17, 4242, 90001, 7, 12345];
    for (const seed of seeds) {
      const a = play(sp, seed);
      const b = play(without, seed);
      expect(a.res).toEqual(b.res);
      expect(a.log).toEqual(b.log);
      if (a.reached > 0) reached++;
    }
    expect(reached).toBeGreaterThanOrEqual(seeds.length - 1);
  }, 600_000); // 12 full fights: slow only when the machine is loaded (several agents); alone it takes ~40 s
});
