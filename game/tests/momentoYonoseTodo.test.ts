/**
 * YONOSE TODO — the Momento of the Parte II finale (H64 «Mentira» → H65 «Continuará», docs/part-ii/29 §18).
 *
 * The score resolves on the real beat map with zero warnings and takes the whole song (and its credits-only resume
 * from the prechorus); every input and every story beat sits on a measured onset; the outcome is the same whatever the
 * player presses (3 bots); the flashes stay safe; it is registered (Volver a ver, Fonoteca, ext.momentos); the finale
 * applies the mission plumbing EXACTLY ONCE, in story order; a replay changes nothing; and the fallback cines still
 * run when the Momento is not there (or cannot play).
 */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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

// ---- the Pixi side is mocked: the Momento «plays» by walking the song clock through the live bridge
const played: { id: string; replay: boolean; resume: boolean }[] = [];
let failNext = false;
vi.mock('../src/momentos/index', async () => {
  const { finaleBridge } = await import('../src/momentos/songs/yonoseTodo/bridge');
  const { commitMomento } = await import('../src/momentos/save');
  const { G } = await import('../src/state/game');
  return {
    playMomento: async (id: string, o: { replay?: boolean; def?: { edit?: { from: number }[] } } = {}) => {
      if (failNext) {
        failNext = false;
        return null;
      }
      const from = o.def?.edit?.[0]?.from ?? 0;
      played.push({ id, replay: !!o.replay, resume: from > 0 });
      const b = finaleBridge();
      let back = false;
      for (let t = from; t <= 208.6; t += 0.05) {
        b?.advance(t);
        // a scrub-like hop backward never pays twice
        if (!back && t > 150) {
          back = true;
          for (let u = 100; u < 150; u += 1) b?.advance(u);
        }
      }
      const res = { id, grade: 'A' as const, pct: 0.8, counts: { great: 1, hit: 0, miss: 0, bonus: 0 }, results: {}, end: 'done' as const, clock: 'internal' as const };
      commitMomento(G.s as unknown as { ext?: Record<string, unknown> }, res, Date.now());
      return res;
    },
  };
});
const cines: string[] = [];
vi.mock('../src/cine', () => ({
  playCine: async (id: string) => {
    cines.push(id);
    return 'done';
  },
  runningCine: () => null,
}));

const { G } = await import('../src/state');
const { SAVE_KEY } = await import('../src/core/save');
const { patchNotes } = await import('../src/state/patches');
const { checkMissions } = await import('../src/state/sys/missions');
const { applyStoryResult, claimStoryCat } = await import('../src/state/sys/storyBattles');
const O4 = await import('../src/state/sys/rupturasO4');
const E = await import('../src/state/sys/ecos');
const OLV = await import('../src/state/sys/olvidada');
const FIN = await import('../src/app/o4Finale');
const { cleanBeatMap } = await import('../src/audio/beatgrid');
const { resolveScore } = await import('../src/momentos/score');
const { MomentoCore } = await import('../src/momentos/core');
const { FlashGuard, isSaturatedRed } = await import('../src/momentos/flash');
const { COSMETIC_KEYS, commitMomento, momentoSeen } = await import('../src/momentos/save');
const { getMomento, seenMomentos } = await import('../src/momentos/registry');
const { selectOnsets } = await import('../src/momentos/time');
await import('../src/momentos/songs');
const SC = await import('../src/momentos/songs/yonoseTodo/score');
const TM = await import('../src/momentos/songs/yonoseTodo/times');
const { FinaleBridge } = await import('../src/momentos/songs/yonoseTodo/bridge');
const { installFinale } = await import('../src/momentos/songs/yonoseTodo/finale');
import type { BattleResult } from '../src/scenes/BattleScene';
import type { BeatMap } from '../src/audio/beatgrid';
import type { OnsetMap } from '../src/momentos/types';

const MAPS = join(__dirname, '../src/data/music/beatmaps');
const MAP: BeatMap = cleanBeatMap(JSON.parse(readFileSync(join(MAPS, 'yonose_todo.json'), 'utf8')), 'yonose_todo')!;
const ONSETS = JSON.parse(readFileSync(join(MAPS, 'yonose_todo.onsets.json'), 'utf8')) as OnsetMap;
const near = (list: { t: number }[], t: number, tol: number) => list.some((o) => Math.abs(o.t - t) <= tol);
const on = (track: 'kick' | 'snare' | 'bass' | 'melody') => selectOnsets(MAP, ONSETS, { track });
const FULL = () => resolveScore(SC.YONOSE_TODO, MAP, ONSETS);
const RESUMED = () => resolveScore({ ...SC.YONOSE_TODO, ...SC.RESUME_DEF }, MAP, ONSETS);

// ------------------------------------------------------------------ the score
describe('the YONOSE TODO score', () => {
  it('resolves with zero warnings, takes the WHOLE song and cuts after the last tic', () => {
    const s = FULL();
    expect(s.warnings).toEqual([]);
    expect(s.segments).toHaveLength(1);
    expect(s.segments[0].from).toBe(0);
    expect(s.segments[0].to).toBeCloseTo(MAP.duration, 2);
    expect(s.mCut).toBeCloseTo(TM.CUT, 3);
    expect(s.mCut).toBeGreaterThan(TM.WAKE_T + 0.5);
    expect(s.mCut).toBeLessThanOrEqual(MAP.duration);
    // every section has its own story: inputs or set pieces
    for (const sec of ['intro', 'verse', 'bridge', 'break', 'chorus', 'prechorus', 'climax']) {
      const r = MAP.sections.find((x) => x.name === sec)!;
      expect(s.prompts.some((p) => p.t >= r.start - 0.01 && p.t < r.end + 0.01), sec).toBe(true);
    }
    for (const sec of ['break2', 'outro']) {
      const r = MAP.sections.find((x) => x.name === sec)!;
      expect(s.cues.some((c) => c.t >= r.start && c.t < r.end && c.act.verb === 'caption'), sec).toBe(true);
    }
  });
  it('the credits resume: the song from the prechorus (a bar line) with the end of the score only, zero warnings', () => {
    const s = RESUMED();
    expect(s.warnings).toEqual([]);
    expect(s.segments[0].from).toBeCloseTo(TM.RESUME, 3);
    expect(Math.abs(TM.RESUME / TM.BAR - Math.round(TM.RESUME / TM.BAR))).toBeLessThan(1e-3);
    expect(s.prompts.map((p) => p.id)).toEqual(['mentira', 'pinta0', 'pinta1', 'pinta2', 'pinta3']);
    expect(s.mCut).toBeCloseTo(TM.CUT - TM.RESUME, 3);
  });
  it('gentle inputs: taps and holds, a bar of warning (half a bar when they come in a row), labels of 1–3 words', () => {
    const s = FULL();
    expect([...new Set(s.prompts.map((p) => p.type))].sort()).toEqual(['hold', 'tap']);
    const graded = s.prompts.filter((p) => !p.optional);
    expect(graded.length).toBeGreaterThanOrEqual(15);
    expect(s.prompts.filter((p) => p.optional).length).toBeGreaterThanOrEqual(4);
    for (const p of s.prompts) expect(p.m - p.mShow, p.id).toBeGreaterThanOrEqual(TM.BAR * 0.5 - 1e-6);
    for (const p of s.prompts) if (p.spec.label) expect(p.spec.label.split(/\s+/).length).toBeLessThanOrEqual(3);
    const taps = graded.filter((p) => p.type === 'tap');
    for (let i = 1; i < taps.length; i++) expect(taps[i].m - taps[i - 1].m).toBeGreaterThanOrEqual(0.3);
    // both holds let go ON the two big hits of the song
    const holds = s.prompts.filter((p) => p.type === 'hold');
    expect(holds.map((p) => p.id)).toEqual(['calor', 'mentira']);
    expect(holds[0].mEnd).toBeCloseTo(TM.SEC.chorus, 3);
    expect(holds[1].mEnd).toBeCloseTo(TM.SEC.climax, 3);
    expect(holds.every((p) => p.spec.release)).toBe(true);
  });
  it('every input and every story beat sits on a measured onset (keys for the story, kicks and accents for the groove)', () => {
    const keys = on('melody');
    for (const t of [TM.FAROL, ...TM.VUELTAS, TM.CALOR, TM.MENTIRA_HOLD, TM.ASLEEP_T]) expect(near(keys, t, 0.012), `keys ${t}`).toBe(true);
    const kicks = on('kick');
    for (const t of [...TM.ARRIVE, ...TM.GATOS]) expect(near(kicks, t, 0.012), `kick ${t}`).toBe(true);
    const acc = on('snare');
    for (const t of [...TM.SUENOS, ...TM.PINTA, ...TM.PICA, TM.BIG1, ...TM.STRIKE_TICS, ...TM.LETTER_TICS, TM.WAKE_T]) expect(near(acc, t, 0.012), `accent ${t}`).toBe(true);
    expect(near(on('bass'), TM.MENTIRA_T, 0.012)).toBe(true);
    // the prompts are exactly those targets
    const s = FULL();
    const at = (id: string) => s.prompts.find((p) => p.id === id)!.t;
    expect(at('farol')).toBeCloseTo(TM.FAROL, 3);
    TM.SUENOS.forEach((t, i) => expect(at(`sueno${i}`)).toBeCloseTo(t, 3));
    TM.PINTA.forEach((t, i) => expect(at(`pinta${i}`)).toBeCloseTo(t, 3));
    TM.VUELTAS.forEach((t, i) => expect(at(`vuelta${i}`)).toBeCloseTo(t, 3));
    // the onset tracks are the grid-informed ones (an 808 dembow: ~4–5 kicks a bar in the grooves; no voice)
    const groove = kicks.filter((o) => o.t >= TM.SEC.verse && o.t < TM.SEC.bridge).length / ((TM.SEC.bridge - TM.SEC.verse) / TM.BAR);
    expect(groove).toBeGreaterThan(3.5);
    expect(kicks.filter((o) => o.t >= TM.SEC.brk && o.t < TM.SEC.chorus).length).toBe(0);
    expect((ONSETS.tracks.vox ?? []).length).toBe(0);
  });
  it('uses only verbs that exist (toolkit + its own), never NEÓN CEL\'s impact frames, katakana, cut-ins or speed lines', async () => {
    const { TOOLKIT_VERBS } = await import('../src/momentos/anime/fx');
    const { YONOSE_VERBS } = await import('../src/momentos/songs/yonoseTodo/verbs');
    const known = new Set([...Object.keys(TOOLKIT_VERBS), ...Object.keys(YONOSE_VERBS), 'freeze']);
    const s = FULL();
    const verbs = new Set([...s.cues.map((c) => c.act.verb), ...s.prompts.flatMap((p) => Object.values(p.branches).flatMap((l) => (l ?? []).map((a) => a.verb)))]);
    for (const v of verbs) expect(known.has(v), v).toBe(true);
    for (const v of ['impact', 'sfx', 'cutin', 'panels', 'speed', 'focus', 'burst', 'confetti', 'aberr']) expect(verbs.has(v), v).toBe(false);
  });
});

// ------------------------------------------------------------------ same outcome, safe flashes, registry
function runAll(auto: 'great' | 'hit' | 'miss' | 'none') {
  const s = FULL();
  const c = new MomentoCore(s, auto);
  for (let m = 0; m <= s.mCut + 0.05; m += 1 / 60) c.advance(m);
  c.advance(s.mCut + 1);
  return { s, c };
}
describe('YONOSE TODO: same outcome, safe flashes, registered', () => {
  it('all-perfect, all-miss and no-input finish every prompt and only the cosmetic grade differs', () => {
    const runs = (['great', 'miss', 'none'] as const).map((a) => runAll(a).c);
    for (const r of runs) expect(r.finished).toBe(true);
    const res = runs.map((r) => r.result('done', 'internal'));
    expect(res[0].grade).toBe('S');
    expect(res[1].grade).toBe('C');
    const base = () => ({ ext: { music: { unlocked: { 'yonose_todo.ambient': { at: 5, source: 'x' } } } } as Record<string, unknown>, gold: 100, missions: { done: ['H63'] } });
    const saves = res.map((r) => {
      const sv = base();
      commitMomento(sv, r, 123456);
      return sv;
    });
    const strip = (sv: ReturnType<typeof base>) => {
      const c = structuredClone(sv);
      const seen = (c.ext.momentos as { seen: Record<string, Record<string, unknown>> }).seen.yonose_todo;
      for (const k of COSMETIC_KEYS) delete seen[k];
      return c;
    };
    expect(strip(saves[0])).toEqual(strip(saves[1]));
    expect(strip(saves[1])).toEqual(strip(saves[2]));
  });
  it('the only full-screen glow (the perfect «…Mentira») goes through the guard, warm white, never red', () => {
    const { s, c } = runAll('great');
    const glows = [...s.cues, ...c.branchCues].filter((x) => x.act.verb === 'mentira' && x.act.args.big);
    expect(glows).toHaveLength(1);
    expect(glows[0].m).toBeCloseTo(TM.SEC.climax, 2);
    const g = new FlashGuard(false);
    expect(g.request(glows[0].m, 'flash')).toBe('full');
    expect(g.countAt(glows[0].m)).toBeLessThanOrEqual(3);
    expect(isSaturatedRed(0xfff4dc)).toBe(false);
    for (const x of [...s.cues, ...c.branchCues]) expect(['flash', 'impact'].includes(x.act.verb), x.act.verb).toBe(false);
  });
  it('is registered: Volver a ver (once seen), the Fonoteca (the original, from «Mentira»), ext.momentos', () => {
    const d = getMomento('yonose_todo')!;
    expect(d).toBe(SC.YONOSE_TODO);
    expect(d.mission).toBe('H64');
    expect(d.unlocks).toEqual(['yonose_todo']);
    expect(d.source).toBe('Mentira');
    expect(d.tail).toBe('release');
    const sv: { ext?: Record<string, unknown> } = {};
    expect(seenMomentos(sv).some((x) => x.id === 'yonose_todo')).toBe(false);
    commitMomento(sv, runAll('none').c.result('done', 'internal'), 1);
    expect(momentoSeen(sv, 'yonose_todo')).toBe(true);
    expect(seenMomentos(sv).find((x) => x.id === 'yonose_todo')).toMatchObject({ title: 'YONOSE TODO', order: 64 });
    const src = readFileSync(join(__dirname, '../src/panels/Replays.ts'), 'utf8');
    expect(src).toContain("e.id === 'momento:yonose_todo'");
  });
});

// ------------------------------------------------------------------ the bridge (pure)
describe('the finale bridge', () => {
  const hooks = () => {
    const log: string[] = [];
    return { log, h: { choose: (p: string) => log.push(`choose:${p}`), asleep: () => log.push('asleep'), mentira: () => log.push('mentira'), wake: () => log.push('wake') } };
  };
  it('pays each step once, in story order, at its song time; seeking back never pays twice', () => {
    const { log, h } = hooks();
    const b = new FinaleBridge(h as never);
    for (let t = 0; t < 40; t += 0.1) b.advance(t);
    expect(b.choose('romper', 40)).toBe(true);
    expect(b.choose('perfecto', 41)).toBe(false);
    for (let t = 40; t < 150; t += 0.1) b.advance(t);
    expect(log).toEqual(['choose:romper', 'asleep', 'mentira']);
    for (let t = 30; t < 209; t += 0.1) b.advance(t);
    b.finish('done');
    expect(log).toEqual(['choose:romper', 'asleep', 'mentira', 'wake']);
  });
  it('no pick by big_hit_2 = «nada»; a pick outside the window is ignored', () => {
    const { log, h } = hooks();
    const b = new FinaleBridge(h as never);
    expect(b.choose('perfecto', 10)).toBe(false);
    b.advance(TM.PICK.decide + 0.01);
    expect(log).toEqual(['choose:nada']);
    expect(b.picked).toBe(false);
  });
  it('a finale resumed at the credits only wakes; a run left halfway pays only what it reached', () => {
    const a = hooks();
    const b = new FinaleBridge(a.h as never, 'credits');
    for (let t = TM.RESUME; t < 209; t += 0.1) b.advance(t);
    expect(a.log).toEqual(['wake']);
    const c = hooks();
    const d = new FinaleBridge(c.h as never);
    for (let t = 0; t < 100; t += 0.1) d.advance(t);
    d.finish('exited');
    expect(c.log).toEqual(['choose:nada', 'asleep']);
    d.finish('done');
    expect(c.log).toEqual(['choose:nada', 'asleep', 'mentira', 'wake']);
  });
});

// ------------------------------------------------------------------ the real finale (o4Finale plumbing) through the Momento
const WIN: BattleResult = { won: true, reason: 'sunk', turns: 6, modulesDestroyed: 4, damageDealt: 1000, catsLost: 0, perfect: false, enemyHullLost: 0.8 };
const fixture = (f: string) => JSON.parse(readFileSync(new URL(`../test-saves/${f}.json`, import.meta.url), 'utf8'));
function loadEnv(env: unknown) {
  mem.clear();
  mem.set(SAVE_KEY, JSON.stringify(env));
  patchNotes.length = 0;
  G.load();
  expect(G.loaded).toBe(true);
  checkMissions();
}
const done = (id: string) => G.s.missions.done.includes(id);
const active = (id: string) => G.s.missions.active.includes(id);
function step(id: string, fn: () => void) {
  expect(active(id), `${id} active`).toBe(true);
  fn();
  checkMissions();
  expect(done(id), `${id} done`).toBe(true);
}
/** the Oleada 4 save, played up to the night of H64 (the page by the faro) */
function toH64() {
  loadEnv(fixture('rupturas-o4'));
  step('H58', () => {
    const l = applyStoryResult('umbral_suenos', WIN);
    if (l.newCat) claimStoryCat(l.newCat, l.catKey);
  });
  step('H59', () => expect(E.wakeEco(E.ecosReady()[0])).toBeTruthy());
  step('H60', () => {
    for (const r of OLV.olvidadaRuins()) expect(OLV.repairRuin(r.id, OLV.repairersFor(r.id)[0].uid)).toBe(true);
  });
  for (const sp of O4.o4PendingCats()) O4.claimO4Cat(sp);
  step('H61', () => O4.readDistraxia());
  step('H62', () => void applyStoryResult('umbral_correctores', WIN));
  step('H63', () => void applyStoryResult('umbral_final', WIN));
  expect(active('H64')).toBe(true);
}
/** everything but the cosmetic Momento slice */
const core = () => {
  const s = structuredClone(G.s) as unknown as Record<string, unknown> & { ext?: Record<string, unknown> };
  delete s.savedAt;
  delete s.playMs;
  if (s.ext) delete s.ext.momentos;
  return JSON.stringify(s);
};

describe('the finale with the Momento (app/o4Finale.ts playFinale)', () => {
  it('applies the mission exactly once: H64 then H65, the beats, the choice, the Fonoteca, ext.momentos', async () => {
    toH64();
    installFinale();
    expect(FIN.hasFinaleMomento()).toBe(true);
    const c0 = G.s.counters?.[`feature_${O4.O4_FEATURES.mentira}`] ?? 0;
    played.length = 0;
    cines.length = 0;
    expect(await FIN.playFinale()).toBe('done');
    expect(played).toEqual([{ id: 'yonose_todo', replay: false, resume: false }]);
    expect(cines).toEqual([]);
    expect(done('H64') && done('H65')).toBe(true);
    expect(G.has('oleada4_fin') || G.s.flags.oleada4_fin).toBeTruthy();
    expect(G.s.beatsSeen).toEqual(expect.arrayContaining(['b64_mentira#b', 'b65_continuara#a']));
    expect(O4.mentiraChoice()).toBe('nada');
    expect((G.s.counters?.[`feature_${O4.O4_FEATURES.mentira}`] ?? 0) - c0).toBe(1);
    expect(G.s.beatsSeen.filter((b) => b === 'b64_mentira#b')).toHaveLength(1);
    expect(momentoSeen(G.s as unknown as { ext?: Record<string, unknown> }, 'yonose_todo')).toBe(true);
    // nothing to replay into the save: the finale is over
    expect(await FIN.playFinale()).toBe('interrupted');
  });
  it('a replay (Volver a ver) of the whole finale or of the credits changes nothing in the save', async () => {
    toH64();
    installFinale();
    await FIN.playFinale();
    const before = core();
    played.length = 0;
    expect(await FIN.playFinale({ replay: true, from: 'mentira' })).toBe('done');
    expect(await FIN.playFinale({ replay: true, from: 'credits' })).toBe('done');
    expect(played).toEqual([
      { id: 'yonose_todo', replay: true, resume: false },
      { id: 'yonose_todo', replay: true, resume: true },
    ]);
    expect(core()).toBe(before);
  });
  it('a reload between «Mentira» and REGISTRO 000 resumes at the credits and only wakes', async () => {
    toH64();
    installFinale();
    const fin = FIN.finaleCtx();
    fin.choose('romper');
    fin.asleep();
    fin.mentira();
    checkMissions();
    expect(active('H65')).toBe(true);
    played.length = 0;
    expect(await FIN.playFinale()).toBe('done');
    expect(played[0].resume).toBe(true);
    expect(done('H65')).toBe(true);
    expect(O4.mentiraChoice()).toBe('romper');
  });
  it('the fallback cines still run when the Momento is not registered, or cannot play at all', async () => {
    toH64();
    FIN.registerFinaleMomento(null);
    expect(FIN.hasFinaleMomento()).toBe(false);
    cines.length = 0;
    expect(await FIN.playFinale({ replay: true, from: 'mentira' })).toBe('done');
    expect(cines).toEqual(['h64_mentira', 'h65_creditos']);
    installFinale();
    failNext = true;
    cines.length = 0;
    expect(await FIN.playFinale({ replay: true, from: 'mentira' })).toBe('done');
    expect(cines).toEqual(['h64_mentira', 'h65_creditos']);
    // Volver a ver: the finale's scenes go through playFinale when the Momento is there
    const src = readFileSync(join(__dirname, '../src/cine/replay.ts'), 'utf8');
    expect(src).toMatch(/hasFinaleMomento\(\)\) return fin\.playFinale\(\{ replay: true/);
  });
});
