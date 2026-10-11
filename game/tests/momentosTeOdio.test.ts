/**
 * te ODIO — the Momento of H55 (docs/part-ii/29 §17): the score resolves on the real beat map with zero warnings and
 * takes the whole song; every input target sits on a measured onset; the outcome is the same whatever the player
 * presses; the stencil slams stay under the flash limit; it plays at the switch into the Disruptores' glitch phase.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanBeatMap, type BeatMap } from '../src/audio/beatgrid';
import { resolveScore } from '../src/momentos/score';
import { MomentoCore } from '../src/momentos/core';
import { FlashGuard, isSaturatedRed } from '../src/momentos/flash';
import { COSMETIC_KEYS, commitMomento, momentoSeen } from '../src/momentos/save';
import { getMomento, momentoForFase, momentoIds, registerMomento } from '../src/momentos/registry';
import { selectOnsets } from '../src/momentos/time';
import type { OnsetMap } from '../src/momentos/types';
import '../src/momentos/songs';
import { TE_ODIO, BOMBS, STOPS, CLASHES, TAGS, DUELS, TUNES, SIGNALS, RIFTS } from '../src/momentos/songs/teOdio/score';

const MAPS = join(__dirname, '../src/data/music/beatmaps');
const MAP: BeatMap = cleanBeatMap(JSON.parse(readFileSync(join(MAPS, 'te_odio.json'), 'utf8')), 'te_odio')!;
const ONSETS = JSON.parse(readFileSync(join(MAPS, 'te_odio.onsets.json'), 'utf8')) as OnsetMap;
const near = (list: { t: number }[], t: number, tol: number) => list.some((o) => Math.abs(o.t - t) <= tol);

describe('the te ODIO score', () => {
  const s = resolveScore(TE_ODIO, MAP, ONSETS);
  it('resolves on the beat map with zero warnings', () => {
    expect(s.warnings).toEqual([]);
    expect(s.cues.length).toBeGreaterThan(150);
  });
  it('takes the WHOLE song (no edit), cut on its last hit', () => {
    expect(s.segments).toHaveLength(1);
    expect(s.segments[0].from).toBe(0);
    expect(s.segments[0].to).toBeCloseTo(MAP.duration, 2);
    expect(s.mCut).toBeGreaterThan(213.5);
    expect(s.mCut).toBeLessThanOrEqual(MAP.duration);
    // every section of the song has its own inputs or set pieces (the second half escalates, never repeats)
    for (const sec of ['chorus', 'verse', 'chorus2', 'verse2', 'chorus3', 'climax', 'break', 'build', 'drop']) {
      const r = MAP.sections.find((x) => x.name === sec)!;
      expect(s.prompts.some((p) => p.t >= r.start - 0.01 && p.t < r.end + 0.01), sec).toBe(true);
    }
  });
  it('has every input kind, prompts a bar ahead (the thrown cans half a bar: the can itself warns), graded taps never stacked', () => {
    expect([...new Set(s.prompts.map((p) => p.type))].sort()).toEqual(['choice', 'hold', 'mash', 'tap']);
    for (const p of s.prompts) expect(p.m - p.mShow, p.id).toBeCloseTo(p.id.startsWith('lata') ? 1 : 2, 2);
    const graded = s.prompts.filter((p) => !p.optional && p.type === 'tap');
    for (let i = 1; i < graded.length; i++) expect(graded[i].m - graded[i - 1].m).toBeGreaterThanOrEqual(0.3);
    expect(s.prompts.filter((p) => !p.optional).length).toBeGreaterThanOrEqual(40);
    // labels: 1–3 words
    for (const p of s.prompts) if (p.spec.label) expect(p.spec.label.split(/\s+/).length).toBeLessThanOrEqual(3);
  });
  it('puts every input on a measured onset: claps for the cans / clashes / duels, the voice for the tags, kicks elsewhere', () => {
    const acc = selectOnsets(MAP, ONSETS, { track: 'snare' });
    for (const t of [...BOMBS, ...CLASHES, ...DUELS]) expect(near(acc, t, 0.005), `clap ${t}`).toBe(true);
    const vox = selectOnsets(MAP, ONSETS, { track: 'vox' });
    for (const t of TAGS) expect(near(vox, t, 0.025), `voice ${t}`).toBe(true);
    for (const t of TUNES) expect(near(vox, t, 0.06), `chop ${t}`).toBe(true);
    const kicks = selectOnsets(MAP, ONSETS, { track: 'kick' });
    for (const t of [...SIGNALS, ...RIFTS, ...STOPS]) expect(near(kicks, t, 0.01), `kick ${t}`).toBe(true);
    // the paint cans fly to their measured claps
    const bombs = s.cues.filter((c) => c.act.verb === 'bomb' && c.act.args.prompt);
    expect(bombs.map((c) => +c.t.toFixed(3))).toEqual(BOMBS);
  });
  it('leaves wall tags on the verse claps and spells TE ODIO on the hooks / the chops', () => {
    const walls = s.cues.filter((c) => c.act.verb === 'wallTag');
    expect(walls.length).toBeGreaterThan(5);
    expect(walls.every((c) => c.onset?.track === 'snare')).toBe(true);
    const chops = s.cues.filter((c) => c.act.verb === 'tag' && c.onset?.track === 'vox');
    expect(chops.length).toBeGreaterThanOrEqual(10);
    expect(chops.every((c) => c.t >= 164 && c.t < 202)).toBe(true);
  });
  it('the stops freeze the world from the 808 drop-out to the kick that comes back', () => {
    const fr = s.cues.filter((c) => c.act.verb === 'freeze');
    expect(fr.map((c) => c.t)).toEqual(STOPS.map((t) => t - 0.75));
  });
  it('uses only verbs that exist (toolkit + its own) and never NEÓN CEL\'s type, cut-ins or impact frames', async () => {
    const { TOOLKIT_VERBS } = await import('../src/momentos/anime/fx');
    const { TE_VERBS } = await import('../src/momentos/songs/teOdio/verbs');
    const { SHOT_VERBS } = await import('../src/momentos/songs/teOdio/shots');
    const known = new Set([...Object.keys(TOOLKIT_VERBS), ...Object.keys(TE_VERBS), ...Object.keys(SHOT_VERBS), 'freeze']);
    const used = new Set<string>([...s.cues.map((c) => c.act.verb), ...s.prompts.flatMap((p) => Object.values(p.branches).flat().map((a) => a!.verb))]);
    expect([...used].filter((u) => !known.has(u))).toEqual([]);
    for (const nope of ['sfx', 'cutin', 'panels', 'impact']) expect(used.has(nope), nope).toBe(false);
  }, 60000);
  it('is registered for the switch into the Disruptores\' glitch phase (H55), and only there', () => {
    expect(momentoIds()).toContain('te_odio');
    expect(momentoForFase('ruptura_disruptores', 'glitch')?.id).toBe('te_odio');
    expect(momentoForFase('ruptura_disruptores', 'vacio')).toBeNull();
    expect(getMomento('te_odio')?.track).toBe('te_odio');
    expect(TE_ODIO.unlocks).toEqual(['te_odio']);
    expect(TE_ODIO.source).toBe('Los Disruptores');
    expect(TE_ODIO.tail).toBe('keep');
  });
});

function runAll(auto: 'great' | 'hit' | 'miss' | 'none') {
  const s = resolveScore(TE_ODIO, MAP, ONSETS);
  const c = new MomentoCore(s, auto);
  for (let m = 0; m <= s.mCut + 0.05; m += 1 / 60) c.advance(m);
  c.advance(s.mCut + 1);
  return { s, c };
}
describe('te ODIO: same outcome, safe flashes', () => {
  it('all-perfect, all-miss and no-input runs finish every prompt and only the cosmetic grade differs', () => {
    const runs = (['great', 'miss', 'none'] as const).map((a) => runAll(a).c);
    for (const r of runs) expect(r.finished).toBe(true);
    const res = runs.map((r) => r.result('done', 'internal'));
    expect(res[0].grade).toBe('S');
    expect(res[1].grade).toBe('C');
    expect(res[2].grade).toBe('C');
    const base = () => ({ ext: { music: { unlocked: { te_odio_explore: { at: 5, source: 'x' } } } } as Record<string, unknown>, gold: 100, missions: { done: ['H54'] } });
    const saves = res.map((r) => {
      const sv = base();
      commitMomento(sv, r, 123456);
      return sv;
    });
    const strip = (sv: ReturnType<typeof base>) => {
      const c = structuredClone(sv);
      const seen = (c.ext.momentos as { seen: Record<string, Record<string, unknown>> }).seen.te_odio;
      for (const k of COSMETIC_KEYS) delete seen[k];
      return c;
    };
    expect(strip(saves[0])).toEqual(strip(saves[1]));
    expect(strip(saves[1])).toEqual(strip(saves[2]));
    expect(momentoSeen(saves[0], 'te_odio')).toBe(true);
  });
  it('played perfect, the stencil slams never pass 3 full-screen flashes a second (the guard softens the rest)', () => {
    const { s, c } = runAll('great');
    const all = [...s.cues, ...c.branchCues].filter((x) => x.act.verb === 'slam').sort((a, b) => a.m - b.m);
    expect(all.length).toBeGreaterThanOrEqual(15);
    const g = new FlashGuard(false);
    for (const x of all) {
      g.request(x.m, 'impact');
      expect(g.countAt(x.m)).toBeLessThanOrEqual(3);
    }
    // never a saturated red stencil
    for (const x of all) if (typeof x.act.args.mid === 'number') expect(isSaturatedRed(x.act.args.mid as number)).toBe(false);
  });
});

// ------------------------------------------------------------------ H55: the battle never knows about the Momento
describe('H55: the same battle with or without the Momento', () => {
  it('same seed → the same fight through vacío → GLITCH (rifts), with the Momento registered or not, spec cloned like the worker', async () => {
    const g = globalThis as { localStorage?: unknown };
    if (!g.localStorage) {
      const mem = new Map<string, string>();
      g.localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, String(v)), removeItem: (k: string) => void mem.delete(k), key: (i: number) => [...mem.keys()][i] ?? null, get length() { return mem.size; }, clear: () => mem.clear() };
    }
    const { autoBattle, makeBattle } = await import('../src/battle/autoplay');
    const { DIFFICULTY } = await import('../src/battle/ai');
    const { BLUEPRINTS } = await import('../src/battle/blueprints');
    const { battleCatFrom } = await import('../src/battle/catShots');
    const { faseIndex } = await import('../src/battle/fases');
    const { STORY_BATTLES } = await import('../src/state/sys/storyBattles');
    await import('../src/state/sys/rupturasO3');
    const { ROLE_BY_ID, catDef } = await import('../src/data/content');
    type Spec = Parameters<typeof autoBattle>[0];
    const cat = (uid: string, species: string) => battleCatFrom({ uid, species, name: species, level: 10, stars: 1, dmgMul: 1, hpMul: 1 }, ROLE_BY_ID.get(catDef(species).role)!.hp);
    const crew = ['c_canelo', 'c_satelito'];
    const rules = STORY_BATTLES.ruptura_disruptores.rules!;
    const spec = (): Spec => ({
      player: { blueprint: BLUEPRINTS.sparrow, hpMul: 6, cats: crew.map((s, i) => cat(`p${i}`, s)), cannonAtk: 30 },
      enemy: { blueprint: BLUEPRINTS.sparrow, hpMul: 6, cats: crew.map((s, i) => cat(`e${i}`, s)), cannonAtk: 30 },
      playerName: 'Tú',
      enemyName: 'La Lata de Pintura',
      difficulty: 'normal',
      rules: { ...rules, cataclysm: undefined, fases: { side: 1, phases: rules.fases!.phases } },
      meta: { special: 'ruptura_disruptores' },
    }) as unknown as Spec;
    const play = (sp: Spec) => {
      const log: string[] = [];
      const res = autoBattle(sp, DIFFICULTY.normal, 5555, 40, (b, side, shot) => {
        log.push(`${b.turn}|${side}|${shot}|${faseIndex(b)}|${b.sides[0].ship.cells().reduce((a, c) => a + c.hp, 0)}|${b.sides[1].ship.cells().reduce((a, c) => a + c.hp, 0)}`);
      });
      return { res, log };
    };
    const a = play(spec());
    const b = play(structuredClone(spec()));
    registerMomento({ ...TE_ODIO, battle: undefined });
    let c: ReturnType<typeof play>;
    try {
      expect(momentoForFase('ruptura_disruptores', 'glitch')).toBeNull();
      c = play(spec());
    } finally {
      registerMomento(TE_ODIO);
    }
    expect(b.res).toEqual(a.res);
    expect(b.log).toEqual(a.log);
    expect(c.res).toEqual(a.res);
    expect(c.log).toEqual(a.log);
    // the fight really crossed into the glitch phase (where the Momento plays), once, forward
    const phases = a.log.map((l) => Number(l.split('|')[3]));
    expect(faseIndex(makeBattle(spec(), 5555))).toBe(0);
    expect(phases).toContain(1);
    expect([...phases].sort((x, y) => x - y)).toEqual(phases);
    expect(momentoForFase('ruptura_disruptores', 'glitch')?.id).toBe('te_odio');
  }, 240_000);
});
