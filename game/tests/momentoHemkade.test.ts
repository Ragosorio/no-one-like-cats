/**
 * HEMKADE (H57) — the Momento's score and its battle hook (docs/part-ii/29 §16).
 * Zero authoring warnings, the WHOLE song, taps on measured accents, only verbs that exist, the hook on the
 * sea → sky layer change (and NOT BattleScene's own Momento path: it plays once), and the same outcome whatever the
 * player presses (perfect / all missed / no input: the save differs only in the cosmetic grade).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanBeatMap, type BeatMap } from '../src/audio/beatgrid';
import { resolveScore } from '../src/momentos/score';
import { MomentoCore } from '../src/momentos/core';
import { FlashGuard } from '../src/momentos/flash';
import { COSMETIC_KEYS, commitMomento, momentoSeen } from '../src/momentos/save';
import { getMomento, momentoForFase, momentoIds } from '../src/momentos/registry';
import { selectOnsets } from '../src/momentos/time';
import { faseInterlude } from '../src/battle/fases';
import type { OnsetMap } from '../src/momentos/types';
import '../src/momentos/songs';
import { HEMKADE, DROP1, DROP2, DROP3, CLIMAX, SEAL_OF } from '../src/momentos/songs/hemkade/score';
import { HEMKADE_HOOK } from '../src/momentos/songs/hemkade';

const MAPS = join(__dirname, '../src/data/music/beatmaps');
const MAP: BeatMap = cleanBeatMap(JSON.parse(readFileSync(join(MAPS, 'hemkade.json'), 'utf8')), 'hemkade')!;
const ONSETS = JSON.parse(readFileSync(join(MAPS, 'hemkade.onsets.json'), 'utf8')) as OnsetMap;

describe('the HEMKADE score', () => {
  const s = resolveScore(HEMKADE, MAP, ONSETS);
  it('resolves on the beat map with zero warnings', () => {
    expect(s.warnings).toEqual([]);
    expect(s.cues.length).toBeGreaterThan(200);
  });
  it('takes the WHOLE song, cut on its last breath (the map end, after the silence starts)', () => {
    expect(s.segments).toHaveLength(1);
    expect(s.segments[0].from).toBe(0);
    expect(s.segments[0].to).toBeCloseTo(MAP.duration, 2);
    expect(s.mCut).toBeCloseTo(218.65, 2);
    // every section of the song has its own staging (inputs in all the loud ones)
    for (const sec of ['intro', 'build', 'drop', 'build2', 'drop2', 'build3', 'build4', 'drop3', 'build5', 'break3', 'climax', 'outro']) {
      const r = MAP.sections.find((x) => x.name === sec)!;
      expect(s.prompts.some((p) => p.t >= r.start - 0.01 && p.t < r.end + 0.01), sec).toBe(true);
    }
  });
  it('is frenetic on the drops: every input kind, ≥ 50 graded prompts, graded ones never stacked', () => {
    expect([...new Set(s.prompts.map((p) => p.type))].sort()).toEqual(['choice', 'hold', 'mash', 'tap']);
    const graded = s.prompts.filter((p) => !p.optional);
    expect(graded.length).toBeGreaterThanOrEqual(50);
    const byShow = [...graded].sort((a, b) => a.mShow - b.mShow);
    for (let i = 1; i < byShow.length; i++) {
      const prev = byShow[i - 1];
      const end = prev.type === 'tap' ? prev.m + 0.15 : prev.mEnd + 0.15;
      expect(byShow[i].mShow, `${prev.id} → ${byShow[i].id}`).toBeGreaterThanOrEqual(end - 1e-6);
    }
  });
  it('puts every seal shot of the four drops on a measured ACCENT onset', () => {
    const acc = selectOnsets(MAP, ONSETS, { track: 'snare', min: 0.6 });
    for (const t of [...DROP1, ...DROP2, ...DROP3, ...CLIMAX]) expect(acc.some((o) => Math.abs(o.t - t) < 0.005), String(t)).toBe(true);
    // each seal prompt aims at a real seal, anchored to it
    for (const p of s.prompts.filter((x) => SEAL_OF[x.id] !== undefined)) expect(p.spec.anchor).toBe(`seal${SEAL_OF[p.id]}`);
  });
  it('lightning strikes on the storm accents', () => {
    const bolts = s.cues.filter((c) => c.act.verb === 'bolt');
    expect(bolts.length).toBeGreaterThan(12);
    expect(bolts.every((c) => c.onset?.track === 'snare' && c.t >= 72 && c.t < 96)).toBe(true);
  });
  it('uses only verbs that exist (toolkit + panels + its own)', async () => {
    const { TOOLKIT_VERBS } = await import('../src/momentos/anime/fx');
    const { PANEL_VERBS } = await import('../src/momentos/anime/cutin');
    const { HEM_VERBS } = await import('../src/momentos/songs/hemkade/verbs');
    const known = new Set([...Object.keys(TOOLKIT_VERBS), ...Object.keys(PANEL_VERBS), ...Object.keys(HEM_VERBS), 'freeze']);
    const used = new Set<string>([...s.cues.map((c) => c.act.verb), ...s.prompts.flatMap((p) => Object.values(p.branches).flat().map((a) => a!.verb))]);
    expect([...used].filter((u) => !known.has(u))).toEqual([]);
  }, 60000);
  it('never asks for more than 3 full flashes in a second when played perfectly', () => {
    const r = runAll('great');
    const flashy = [...s.cues, ...r.branchCues].filter((c) => c.act.verb === 'impact' || c.act.verb === 'bolt' || (c.act.verb === 'flash' && Number(c.act.args.amount ?? 0.7) > 0.25)).map((c) => c.m).sort((a, b) => a - b);
    const g = new FlashGuard(false);
    for (const m of flashy) g.request(m, 'impact');
    const full = g.log.filter((x) => x.grant === 'full').map((x) => x.m);
    for (const t of full) expect(full.filter((u) => u <= t && t - u < 1).length).toBeLessThanOrEqual(3);
  });
});

describe('the H57 hook', () => {
  it('plays on the sea → sky layer change through the FASES interlude (once: not BattleScene’s own path)', () => {
    expect(momentoIds()).toContain('hemkade');
    expect(getMomento('hemkade')?.track).toBe('hemkade');
    expect(HEMKADE.battle).toBeUndefined();
    expect(momentoForFase('ruptura_leviatan', 'cielo')).toBeNull();
    expect(faseInterlude('ruptura_leviatan', 'cielo')).toBeTypeOf('function');
    expect(faseInterlude('ruptura_leviatan', 'grieta')).toBeNull();
    expect(faseInterlude('ruptura_leviatan', 'mar')).toBeNull();
  });
  it('matches H57_MOMENTO in app/oleada3Flow.ts', () => {
    const src = readFileSync(join(__dirname, '../src/app/oleada3Flow.ts'), 'utf8');
    const m = /H57_MOMENTO = \{ battle: '([^']+)', fase: '([^']+)', song: '([^']+)' \}/.exec(src);
    expect(m).not.toBeNull();
    expect([m![1], m![2], m![3]]).toEqual([HEMKADE_HOOK.battle, HEMKADE_HOOK.fase, HEMKADE.track]);
  });
  it('the battle keeps its three layers (the Momento is presentation only)', () => {
    const src = readFileSync(join(__dirname, '../src/state/sys/rupturasO3.ts'), 'utf8');
    const block = src.slice(src.indexOf('ruptura_leviatan'));
    for (const id of ["'mar'", "'cielo'", "'grieta'"]) expect(block.includes(id), id).toBe(true);
  });
});

// ------------------------------------------------------------------ same outcome, whatever the player does
function runAll(auto: 'great' | 'hit' | 'miss' | 'none') {
  const s = resolveScore(HEMKADE, MAP, ONSETS);
  const c = new MomentoCore(s, auto);
  for (let m = 0; m <= s.mCut + 0.05; m += 1 / 60) c.advance(m);
  c.advance(s.mCut + 1);
  return c;
}
describe('HEMKADE: same outcome', () => {
  it('all-perfect, all-miss and no-input runs finish every prompt and only the grade differs', () => {
    const runs = (['great', 'miss', 'none'] as const).map(runAll);
    for (const r of runs) expect(r.finished).toBe(true);
    const res = runs.map((r) => r.result('done', 'internal'));
    expect(res[0].grade).toBe('S');
    expect(res[1].grade).toBe('C');
    expect(res[2].grade).toBe('C');
    const base = () => ({ ext: { music: { unlocked: {} } } as Record<string, unknown>, gold: 100, missions: { done: ['H56'] } });
    const saves = res.map((r) => {
      const sv = base();
      commitMomento(sv, r, 123456);
      return sv;
    });
    const strip = (sv: ReturnType<typeof base>) => {
      const c = structuredClone(sv);
      const seen = (c.ext.momentos as { seen: Record<string, Record<string, unknown>> }).seen.hemkade;
      for (const k of COSMETIC_KEYS) delete seen[k];
      return c;
    };
    expect(strip(saves[0])).toEqual(strip(saves[1]));
    expect(strip(saves[1])).toEqual(strip(saves[2]));
    expect(momentoSeen(saves[0], 'hemkade')).toBe(true);
  });
});

// ------------------------------------------------------------------ H57: the battle never knows about the Momento
describe('H57: the same battle with or without the Momento', () => {
  it('same seed → the same fight through sea → sky → rift, with the interlude registered or removed, spec cloned like the worker', async () => {
    const g = globalThis as { localStorage?: unknown };
    if (!g.localStorage) {
      const mem = new Map<string, string>();
      g.localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, String(v)), removeItem: (k: string) => void mem.delete(k), key: (i: number) => [...mem.keys()][i] ?? null, get length() { return mem.size; }, clear: () => mem.clear() };
    }
    const { autoBattle } = await import('../src/battle/autoplay');
    const { DIFFICULTY } = await import('../src/battle/ai');
    const { BLUEPRINTS } = await import('../src/battle/blueprints');
    const { battleCatFrom } = await import('../src/battle/catShots');
    const { faseIndex, registerFaseInterlude } = await import('../src/battle/fases');
    const { STORY_BATTLES } = await import('../src/state/sys/storyBattles');
    await import('../src/state/sys/rupturasO3');
    const { ROLE_BY_ID, catDef } = await import('../src/data/content');
    type Spec = Parameters<typeof autoBattle>[0];
    const cat = (uid: string, species: string) => battleCatFrom({ uid, species, name: species, level: 10, stars: 1, dmgMul: 1, hpMul: 1 }, ROLE_BY_ID.get(catDef(species).role)!.hp);
    const crew = ['c_canelo', 'c_satelito'];
    const spec = (): Spec => ({
      player: { blueprint: BLUEPRINTS.sparrow, hpMul: 6, cats: crew.map((s, i) => cat(`p${i}`, s)), cannonAtk: 30 },
      enemy: { blueprint: BLUEPRINTS.sparrow, hpMul: 6, cats: crew.map((s, i) => cat(`e${i}`, s)), cannonAtk: 30 },
      playerName: 'Tú',
      enemyName: 'El Leviatán',
      difficulty: 'normal',
      rules: { fases: { side: 1, phases: STORY_BATTLES.ruptura_leviatan.rules!.fases!.phases } },
      meta: { special: 'ruptura_leviatan' },
    }) as unknown as Spec;
    const play = (sp: Spec) => {
      const log: string[] = [];
      const res = autoBattle(sp, DIFFICULTY.normal, 5757, 40, (b, side, shot) => {
        log.push(`${b.turn}|${side}|${shot}|${faseIndex(b)}|${b.field.gMul}|${b.sides[0].ship.cells().reduce((a, c) => a + c.hp, 0)}|${b.sides[1].ship.cells().reduce((a, c) => a + c.hp, 0)}`);
      });
      return { res, log };
    };
    const a = play(spec());
    const b = play(structuredClone(spec()));
    registerFaseInterlude(HEMKADE_HOOK.battle, HEMKADE_HOOK.fase, null);
    let c: ReturnType<typeof play>;
    try {
      c = play(spec());
    } finally {
      const { playHemkadeInterlude } = await import('../src/momentos/songs/hemkade');
      registerFaseInterlude(HEMKADE_HOOK.battle, HEMKADE_HOOK.fase, playHemkadeInterlude);
    }
    expect(b.res).toEqual(a.res);
    expect(b.log).toEqual(a.log);
    expect(c.res).toEqual(a.res);
    expect(c.log).toEqual(a.log);
    // the fight really crossed the sea → sky change (where the Momento plays)
    const phases = a.log.map((l) => Number(l.split('|')[3]));
    const { makeBattle } = await import('../src/battle/autoplay');
    expect(faseIndex(makeBattle(spec(), 5757))).toBe(0);
    expect(phases).toContain(1);
    expect([...phases].sort((x, y) => x - y)).toEqual(phases);
    expect(faseInterlude(HEMKADE_HOOK.battle, HEMKADE_HOOK.fase)).toBeTypeOf('function');
  }, 240_000);
});
