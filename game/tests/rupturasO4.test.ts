/**
 * Parte II · Oleada 4 «El Umbral» (docs/part-ii/27-oleada-4.md): H58–H65 in data/rupturas/historia-o4.json, their hooks
 * in ui/story/rupturasScriptO4.ts, the Ecos (state/sys/ecos.ts), the island nobody remembers (olvidada.ts), the
 * battles (rupturasO4Battles.ts on battle/fases + suenos + umbral), the scenes (ui/story/o4Cines.ts), the finale
 * (app/o4Finale.ts playFinale — the YONOSE TODO Momento's entry point) and the credits as data — plus the narrative
 * reset of a save that played all of it.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

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

const { G } = await import('../src/state');
const { SAVE_KEY } = await import('../src/core/save');
const { patchNotes } = await import('../src/state/patches');
const { checkMissions } = await import('../src/state/sys/missions');
const { BEAT_BY_ID, CAT_BY_ID, MISSIONS, MISSION_BY_ID, ROLE_BY_ID, catDef } = await import('../src/data/content');
const { goalSupported } = await import('../src/state/sys/missionGoals');
const { STORY_BATTLES, applyStoryResult, buildStoryBattle, claimStoryCat } = await import('../src/state/sys/storyBattles');
const O4 = await import('../src/state/sys/rupturasO4');
const B4 = await import('../src/state/sys/rupturasO4Battles');
const E = await import('../src/state/sys/ecos');
const OLV = await import('../src/state/sys/olvidada');
const S = await import('../src/ui/story/rupturasScriptO4');
const W = await import('../src/state/sys/worldState');
const { REGION_INFO } = await import('../src/regions');
const { speaker } = await import('../src/ui/story/text');
const { autoBattle } = await import('../src/battle/autoplay');
const { DIFFICULTY } = await import('../src/battle/ai');
const F = await import('../src/battle/fases');
const { battleCatFrom } = await import('../src/battle/catShots');
const { rewardClaimed, claimReward } = await import('../src/state/sys/rupturasLedger');
const { RESET_PATCH_ID, applyRupturasReset } = await import('../src/state/sys/rupturasReset');
const { CineRunner } = await import('../src/cine/runner');
const REG = await import('../src/cine/registry');
const CINES = await import('../src/ui/story/o4Cines');
const FIN = await import('../src/app/o4Finale');
const CRED = await import('../src/ui/story/creditsParteII');
const PAGE = await import('../src/ui/story/o4Pagina');
import type { BattleResult } from '../src/scenes/BattleScene';
type CineScript = import('../src/cine/types').CineScript;
type CineStage = import('../src/cine/types').CineStage;
type Step = import('../src/cine/types').Step;
type WorldLook = import('../src/state/sys/worldState').WorldLook;

const IDS = ['H58', 'H59', 'H60', 'H61', 'H62', 'H63', 'H64', 'H65'];
const WIN: BattleResult = { won: true, reason: 'sunk', turns: 6, modulesDestroyed: 4, damageDealt: 1000, catsLost: 0, perfect: false, enemyHullLost: 0.8 };
const SPECIES: [id: string, rarity: string, elements: string[]][] = [
  ['c_almohadon', 'common', ['cosmic']],
  ['r_sonambulo', 'rare', ['shadow', 'magic']],
  ['e_duermevela', 'epic', ['magic', 'cosmic']],
  ['c_polvillo', 'common', ['time']],
  ['r_tachon', 'rare', ['void', 'light']],
  ['l_bisagra', 'legendary', ['time', 'void']],
  ['s_quizas', 'epic', ['void', 'cosmic']],
];

function loadEnv(env: unknown) {
  mem.clear();
  mem.set(SAVE_KEY, JSON.stringify(env));
  patchNotes.length = 0;
  G.load();
  expect(G.loaded).toBe(true);
  checkMissions();
}
const fixture = (f: string) => JSON.parse(readFileSync(new URL(`../test-saves/${f}.json`, import.meta.url), 'utf8'));
const done = (id: string) => G.s.missions.done.includes(id);
const active = (id: string) => G.s.missions.active.includes(id);
function step(id: string, fn: () => void) {
  expect(active(id), `${id} active`).toBe(true);
  fn();
  checkMissions();
  expect(done(id), `${id} done`).toBe(true);
}
const world = () => W.currentWorldState(G.s).id;

/** H58 won → H59 woken → H60 repaired → H61 read → H62/H63 won → H64 «Mentira» → H65 credits */
function playWave(o: { claimCats?: boolean } = {}) {
  step('H58', () => {
    const l = applyStoryResult('umbral_suenos', WIN);
    if (o.claimCats !== false && l.newCat) claimStoryCat(l.newCat, l.catKey);
  });
  const uid = E.ecosReady()[0];
  step('H59', () => expect(E.wakeEco(uid)).toBeTruthy());
  step('H60', () => {
    for (const r of OLV.olvidadaRuins()) expect(OLV.repairRuin(r.id, OLV.repairersFor(r.id)[0].uid)).toBe(true);
  });
  if (o.claimCats !== false) for (const sp of O4.o4PendingCats()) O4.claimO4Cat(sp);
  step('H61', () => O4.readDistraxia());
  step('H62', () => {
    const l = applyStoryResult('umbral_correctores', WIN);
    if (o.claimCats !== false && l.newCat) claimStoryCat(l.newCat, l.catKey);
  });
  step('H63', () => {
    const l = applyStoryResult('umbral_final', WIN);
    if (o.claimCats !== false && l.newCat) claimStoryCat(l.newCat, l.catKey);
  });
  const fin = FIN.finaleCtx();
  step('H64', () => {
    fin.choose('nada');
    fin.asleep();
    fin.mentira();
  });
  step('H65', () => fin.wake());
  return uid;
}

// ------------------------------------------------------------------ data
describe('Oleada 4 — data', () => {
  it('H58–H65: one historia chain right after H57, with the right goals; H65 closes the Parte II', () => {
    let prev = 'H57';
    for (const id of IDS) {
      const m = MISSION_BY_ID.get(id)!;
      expect(m, id).toBeTruthy();
      expect(m.chain).toBe('historia');
      expect(m.trigger).toBe(`mission:${prev}`);
      expect(m.goal.text.length).toBeGreaterThan(20);
      expect(m.line && m.why, id).toBeTruthy();
      prev = id;
    }
    expect(MISSION_BY_ID.get('H58')!.goal).toMatchObject({ type: 'win_battle', battle: 'umbral_suenos' });
    expect(MISSION_BY_ID.get('H59')!.goal).toMatchObject({ type: 'use_feature', feature: 'eco' });
    expect(MISSION_BY_ID.get('H60')!.goal).toMatchObject({ type: 'use_feature', feature: 'olvidada' });
    expect(MISSION_BY_ID.get('H61')!.goal).toMatchObject({ type: 'use_feature', feature: 'distraxia' });
    expect(MISSION_BY_ID.get('H62')!.goal).toMatchObject({ type: 'win_battle', battle: 'umbral_correctores' });
    expect(MISSION_BY_ID.get('H63')!.goal).toMatchObject({ type: 'win_battle', battle: 'umbral_final' });
    expect(MISSION_BY_ID.get('H64')!.goal).toMatchObject({ type: 'use_feature', feature: 'mentira' });
    expect(MISSION_BY_ID.get('H65')!.goal).toMatchObject({ type: 'use_feature', feature: 'continuara' });
    expect(MISSION_BY_ID.get('H65')!.unlocks).toContain('oleada4_fin');
    expect(MISSIONS.filter((m) => !goalSupported(m.goal.type)).map((m) => m.id)).toEqual([]);
    expect(O4.O4_FEATURES.eco).toBe(E.ECO_FEATURE);
  });

  it('the three battles: registered on their islands, plain data, crews and rewards exist; H62 has the Momento phase', () => {
    expect(B4.O4_BATTLES).toEqual(['umbral_suenos', 'umbral_correctores', 'umbral_final']);
    for (const [b, m] of Object.entries(B4.O4_BATTLE_MISSION)) {
      const def = STORY_BATTLES[b];
      expect(def.mission).toBe(m);
      expect(def.powerMul).toBeGreaterThan(1);
      expect(def.powerMul).toBeLessThan(1.5);
      for (const sp of def.enemyCats) expect(CAT_BY_ID.has(sp), `${b}: ${sp}`).toBe(true);
      expect(CAT_BY_ID.has(def.reward.cat!)).toBe(true);
      expect(structuredClone(def.rules)).toEqual(def.rules);
    }
    expect(REGION_INFO.suenos.battles).toContain('umbral_suenos');
    expect(REGION_INFO.umbral.battles).toEqual(expect.arrayContaining(['umbral_correctores', 'umbral_final']));
    // H62: two phases; the CIRCUS MALUS Momento plays inside the change to EL PLAN
    const cor = STORY_BATTLES.umbral_correctores.rules!.fases!.phases;
    expect(cor.map((p) => p.id)).toEqual(['correccion', B4.H62_MOMENTO.fase]);
    expect(cor[1].effects).toContain('umbral');
    expect(B4.H62_MOMENTO.battle).toBe('umbral_correctores');
    // H63: four phases, Correctores → Disruptores → Titiriteros → El Umbral
    expect(STORY_BATTLES.umbral_final.rules!.fases!.phases.map((p) => p.id)).toEqual(['correctores', 'disruptores', 'titiriteros', 'umbral']);
  });

  it('the 7 species of the wave exist with their contract; the secret one is secret', () => {
    for (const [id, rarity, elements] of SPECIES) {
      const c = CAT_BY_ID.get(id)!;
      expect(c, id).toBeTruthy();
      expect([c.rarity, c.elements], id).toEqual([rarity, elements]);
      expect(c.lore.length).toBeGreaterThan(30);
    }
    expect(catDef('s_quizas').secret).toBe(true);
  });

  it('beats: every part ≤4 lines, every line said exactly once (tables + the overlays + the finale), speakers known, $scene each', () => {
    const used = new Map<string, number[]>();
    const add = (beat: string, lines: number[]) => used.set(beat, [...(used.get(beat) ?? []), ...lines]);
    for (const t of [S.O4_ON_NEW, S.O4_ON_DONE])
      for (const [id, refs] of Object.entries(t)) {
        expect(IDS).toContain(id);
        for (const r of refs) {
          const b = BEAT_BY_ID.get(r.beat)!;
          expect(b, r.beat).toBeTruthy();
          expect((r.lines ?? []).length, `${r.beat}#${r.part}`).toBeLessThanOrEqual(4);
          for (const i of r.lines ?? []) expect(i).toBeLessThan(b.lines.length);
          add(r.beat, r.lines ?? []);
        }
      }
    // the strikethroughs (b61 b), the finale (b64 b–end), the credits (b65)
    add(S.DISTRAXIA_TACHONES.beat, [...S.DISTRAXIA_TACHONES.lines, ...S.DISTRAXIA_TACHONES.reply]);
    const ml = S.MENTIRA_LINES;
    for (const part of [ml.ask, ml.climb, ml.law, ml.border, ml.mentira, ml.end]) {
      expect(part.length).toBeLessThanOrEqual(4);
      add('b64_mentira', part);
    }
    add('b65_continuara', [...S.CREDITS_LINES.dawn, ...S.CREDITS_LINES.registro, ...S.CREDITS_LINES.fin]);
    expect(used.size).toBe(8);
    for (const [beat, lines] of used) {
      const b = BEAT_BY_ID.get(beat)!;
      expect([...lines].sort((a, z) => a - z), beat).toEqual(b.lines.map((_, i) => i));
      expect(String((b as unknown as Record<string, unknown>)['$scene'] ?? '').length, `${beat} $scene`).toBeGreaterThan(40);
      for (const [sp] of b.lines) {
        const k = speaker(sp);
        // the fallback speaker (an unregistered name wearing Canelo's face)
        expect(k.kind === 'cat' && k.slug === 'canelo_cozy_cat' && k.name === sp.toUpperCase() && k.id === sp.toLowerCase(), `${beat}: ${sp}`).toBe(false);
      }
    }
    expect([...S.O4_COVERED].sort()).toEqual([...IDS].sort());
  });

  it('a mission ON_NEW always waits longer than the ON_DONE parts of the mission before it', () => {
    let prevMax = 2.5; // H57's ending (rupturasScriptO3)
    for (const id of IDS) {
      for (const r of S.O4_ON_NEW[id] ?? []) expect(r.delay ?? 0, id).toBeGreaterThan(prevMax);
      prevMax = Math.max(0, ...(S.O4_ON_DONE[id] ?? []).map((r) => r.delay ?? 0));
    }
  });
});

// ------------------------------------------------------------------ the scenes (src/cine)
class Stage implements CineStage {
  constructor(readonly id: string) {}
  look: WorldLook = W.lookOf('normal');
  blocked() {
    return false;
  }
  alive() {
    return true;
  }
  resolve(t: unknown) {
    return typeof t === 'string' ? { x: 0, y: 0 } : (t as { x: number; y: number });
  }
  cameraGet() {
    return { x: 0, y: 0, zoom: 1 };
  }
  cameraSet() {}
  worldGet() {
    return { ...this.look };
  }
  worldSet(l: WorldLook) {
    this.look = l;
  }
  worldRelease() {}
  actor() {}
  fx() {
    return () => undefined;
  }
  interact() {
    return { done: new Promise<void>(() => undefined), cancel: () => undefined };
  }
  hud() {}
}
const flush = () => new Promise<void>((r) => setImmediate(r));
async function fold(s: CineScript, replay: boolean) {
  const persisted: string[] = [];
  const said: number[] = [];
  const r = new CineRunner(s, new Stage(s.stage), { persist: (b) => persisted.push(b), lines: (_b, idx) => (idx ?? []).map((i) => (said.push(i), ['LUZTERNA', '…'] as [string, string])), say: () => Promise.resolve() }, { replay });
  const p = r.play();
  r.skip();
  for (let i = 0; i < 40; i++) {
    r.tick(1 / 30);
    await flush();
  }
  return { res: await p, persisted };
}
function walk(steps: Step[], out: Step[] = []): Step[] {
  for (const s of steps) {
    out.push(s);
    if ('seq' in s) walk(s.seq, out);
    if ('parallel' in s) walk(s.parallel, out);
    if ('say' in s && s.say.onLine) for (const v of Object.values(s.say.onLine)) walk(Array.isArray(v) ? v : [v], out);
    if (s.reduced && s.reduced !== 'skip') walk([s.reduced], out);
  }
  return out;
}

describe('Oleada 4 — scenes', () => {
  it('every O4 beat played as a cine points at a registered scene (island, or the region for b60 b / b61 a / b61 c) that speaks its lines and persists its key', async () => {
    expect(CINES.O4_CINES.sort()).toEqual(['h58_suenos', 'h59_ecos', 'h62_correctores', 'h64_mentira', 'h64_pagina', 'h65_creditos']);
    expect([...CINES.O4_REGION_CINES].sort()).toEqual(['h60_color', 'h61_linea', 'h61_pagina']);
    const region = new Map([
      ['b60_olvidada#b', 'h60_color'],
      ['b61_distraxia#a', 'h61_pagina'],
      ['b61_distraxia#c', 'h61_linea'],
    ]);
    const asCine = new Set<string>();
    for (const refs of [...Object.values(S.O4_ON_NEW), ...Object.values(S.O4_ON_DONE)])
      for (const r of refs) {
        if (r.special !== 'cine') continue;
        const s = REG.getCine(r.cine!)!;
        expect(s, r.cine).toBeTruthy();
        const want = region.get(`${r.beat}#${r.part}`);
        asCine.add(`${r.beat}#${r.part}`);
        if (want) {
          expect(r.cine).toBe(want);
          expect(s.stage).toBe('region');
          expect(r.onlyOn).toBe('region');
          expect(r.inRegion).toBe(true);
        } else {
          expect(s.stage).toBe('island');
          expect(r.onlyOn).toBe('island');
        }
        const said = walk(s.steps).flatMap((st) => ('say' in st && st.say.beat === r.beat && !st.when ? (st.say.lines ?? []) : []));
        expect([...said].sort(), r.cine).toEqual([...(r.lines ?? [])].sort());
        const key = r.part ? `${r.beat}#${r.part}` : r.beat;
        const { persisted } = await fold(s, false);
        expect(persisted, r.cine).toContain(key);
      }
    // the three region parts that used to be dialog are scenes now (beat ids and lines unchanged)
    for (const k of region.keys()) expect(asCine.has(k), k).toBe(true);
  });

  it('the region scenes of La Isla que Nadie Recuerda: listed in VOLVER A VER (they sail there), a replay persists nothing and hands the island back', async () => {
    const seen = REG.replayList(['b60_olvidada#b', 'b61_distraxia#a', 'b61_distraxia#c']).filter((e) => CINES.O4_REGION_CINES.includes(e.id));
    expect(seen.map((e) => e.id)).toEqual(['h60_color', 'h61_pagina', 'h61_linea']);
    expect(REG.replayList([]).filter((e) => CINES.O4_REGION_CINES.includes(e.id))).toEqual([]);
    for (const id of CINES.O4_REGION_CINES) {
      const s = REG.getCine(id)!;
      expect(s.replay?.region, id).toBe('olvidada');
      // in La Isla que Nadie Recuerda: the replay paints the moment back, then gives every forced value back
      const st = new Stage('region') as Stage & { regionId: string; drives: [string, number][]; drive: (id: string, k: number) => void; driveGet: (id: string) => number };
      st.regionId = 'olvidada';
      st.drives = [];
      st.drive = (d: string, k: number) => void st.drives.push([d, k]);
      st.driveGet = () => 0;
      const persisted: string[] = [];
      const r = new CineRunner(s, st, { persist: (b) => persisted.push(b), lines: () => [['LUZTERNA', '…']], say: () => Promise.resolve() }, { replay: true });
      const p = r.play();
      r.skip();
      for (let i = 0; i < 40; i++) {
        r.tick(1 / 30);
        await flush();
      }
      await p;
      expect(persisted, id).toEqual([]);
      const last = new Map(st.drives);
      if (id === 'h60_color') expect([last.get('color'), last.get('reparada'), last.get('pagina'), last.get('linea')]).toEqual([1, 1, -1, -1]);
      else for (const d of ['pagina', 'escritura', 'linea']) expect(last.get(d), `${id} ${d}`).toBe(-1);
      // anywhere else (a reload that lands in another region): only the lines, and the part is still kept
      const { persisted: kept } = await fold(s, false);
      expect(kept.length, id).toBeGreaterThan(0);
    }
  });

  it('VOLVER A VER: the wave\'s scenes appear once seen, in story order; a replay persists nothing', async () => {
    expect(REG.replayList([]).filter((e) => CINES.O4_CINES.includes(e.id))).toEqual([]);
    const seen = REG.replayList(['b58_suenos#a', 'b59_ecos#a', 'b62_correctores#a', 'b64_mentira#b', 'b65_continuara#a']).filter((e) => CINES.O4_CINES.includes(e.id));
    expect(seen.map((e) => e.id)).toEqual(['h58_suenos', 'h59_ecos', 'h62_correctores', 'h64_mentira', 'h65_creditos']);
    for (const id of ['h58_suenos', 'h59_ecos', 'h62_correctores', 'h64_pagina']) expect((await fold(REG.getCine(id)!, true)).persisted, id).toEqual([]);
    // the credits are watched to the end: no SALTAR (their own button runs to the last card)
    expect(REG.getCine('h65_creditos')!.skippable).toBe(false);
  });

  it('the ORIGINAL songs are reserved for the Momentos: no O4 scene, credits or flow cues one (variations, amb.*, stingers only)', () => {
    const originals = ['liky_fight', 'hemkade', 'when_i_lose', 'circus_malus', 'te_odio', 'yonose_todo'];
    const isOriginal = (ref: string) => originals.includes(ref) || /\.original$/.test(ref);
    for (const s of CINES.O4_CINES.map((id) => REG.getCine(id)!)) for (const st of walk(s.steps)) if ('audio' in st && st.audio.cue) expect(isOriginal(st.audio.cue), s.id).toBe(false);
    for (const f of ['src/ui/story/o4Cines.ts', 'src/ui/story/creditsParteII.ts', 'src/app/oleada4Flow.ts', 'src/app/o4Finale.ts', 'src/panels/catEcos.ts']) {
      const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
      for (const m of src.matchAll(/(?:cueBest\(\s*\[([^\]]*)\]|audioApi\.cue\(\s*([^,)]+))/g)) {
        const refs = [...(m[1] ?? m[2] ?? '').matchAll(/'([^']+)'/g)].map((x) => x[1]);
        for (const r of refs) expect(isOriginal(r), `${f}: ${r}`).toBe(false);
      }
    }
    for (const r of [...CRED.CREDITS_BEDS, ...FIN.FINALE_FALLBACK_BEDS]) expect(isOriginal(r)).toBe(false);
  });

  it('MOMENTO hooks: the finale has one entry point and the H62 phase change takes an interlude (presentation only)', async () => {
    expect(typeof FIN.playFinale).toBe('function');
    expect(typeof FIN.registerFinaleMomento).toBe('function');
    expect(FIN.FINALE_SONG).toMatchObject({ id: 'yonose_todo', climax: 149.333, fadeTail: 202.667 });
    const src = readFileSync(new URL('../src/app/o4Finale.ts', import.meta.url), 'utf8');
    expect(src).toContain('// MOMENTO: yonose_todo (H64→H65)');
    expect(readFileSync(new URL('../src/state/sys/rupturasO4Battles.ts', import.meta.url), 'utf8')).toContain('MOMENTO: circus_malus (H62, phase change)');
    let seen = '';
    F.registerFaseInterlude(B4.H62_MOMENTO.battle, B4.H62_MOMENTO.fase, (e) => void (seen = e.id));
    expect(F.faseInterlude('umbral_correctores', 'el_plan')).toBeTruthy();
    expect(F.faseInterlude('umbral_correctores', 'correccion')).toBeNull();
    expect(F.faseInterlude(null, 'el_plan')).toBeNull();
    await F.faseInterlude('umbral_correctores', 'el_plan')!({ battle: 'umbral_correctores', index: 1, from: 0, id: 'el_plan', name: 'El Plan', layer: 'sky', count: 2 });
    expect(seen).toBe('el_plan');
    F.registerFaseInterlude(B4.H62_MOMENTO.battle, B4.H62_MOMENTO.fase, null);
    expect(F.faseInterlude('umbral_correctores', 'el_plan')).toBeNull();
  });
});

// ------------------------------------------------------------------ Ecos
describe('Ecos de Vida (H59)', () => {
  it('normalize: junk never crashes, unknown Ecos and keys survive, idempotent', () => {
    expect(E.normalizeEcos('nope')).toEqual({ awake: {}, hidden: [] });
    const raw = { awake: { c1: { eco: 'farero', at: 5 }, c2: 'pirata_charco', c3: { eco: 7 }, c4: { eco: 'del_futuro', at: -3 } }, hidden: ['c1', 'c1', 3], extra: true };
    const n = E.normalizeEcos(raw);
    expect(n.awake).toEqual({ c1: { eco: 'farero', at: 5 }, c2: { eco: 'pirata_charco', at: 0 }, c4: { eco: 'del_futuro', at: 0 } });
    expect(n.hidden).toEqual(['c1']);
    expect(n.extra).toBe(true);
    expect(E.normalizeEcos(n)).toEqual(n);
  });

  it('nights on your island: local midnights since the cat joined; cats from before the clock slept there forever', () => {
    const d = (day: number, h: number) => new Date(2026, 9, day, h, 0).getTime();
    expect(E.nightsHome({ bornAtMs: 0 }, d(10, 12))).toBe(Infinity);
    expect(E.nightsHome({ bornAtMs: d(9, 23) }, d(10, 1))).toBe(1);
    expect(E.nightsHome({ bornAtMs: d(7, 8) }, d(10, 9))).toBe(3);
    expect(E.nightsHome({ bornAtMs: d(10, 8) }, d(10, 9))).toBe(0);
  });

  it('Part I and pre-H58 saves see no ECOS; then old cats can wake one, new ones dream, Canelo already lived his', () => {
    loadEnv(fixture('late-game'));
    expect(E.ecosOpen()).toBe(false);
    expect(G.s.cats.every((c) => E.ecoStatus(c.uid) === 'none')).toBe(true);
    loadEnv(fixture('rupturas-o4'));
    expect(active('H58')).toBe(true);
    expect(E.ecosOpen()).toBe(false);
    applyStoryResult('umbral_suenos', WIN);
    checkMissions();
    expect(active('H59')).toBe(true);
    expect(E.ecosOpen()).toBe(true);
    const canelo = G.s.cats.find((c) => c.species === 'c_canelo')!;
    expect(E.ecoStatus(canelo.uid)).toBe(G.has('forma:canelo_almirante') ? 'awake' : 'dreaming');
    expect(E.ecoOf(canelo.uid)!.id).toBe('canelo_almirante');
    const old = G.s.cats.find((c) => c.species !== 'c_canelo')!;
    expect(E.ecoStatus(old.uid)).toBe('ready');
    const now = Date.now();
    const kit = { ...old, uid: 'cnew', bornAtMs: now - 3600_000, moments: [] };
    G.s.cats.push(kit);
    expect(E.ecoStatus('cnew', now)).toBe('dreaming');
    expect(E.ecosReady(now)).not.toContain('cnew');
    // same cat → same Eco, every time
    expect(E.ecoOf(old.uid)!.id).toBe(E.ecoOf(old.uid)!.id);
  });

  it('DESPIERTA answers H59, pays its keepsake once per cat (ledger), adds a Momento and never touches power', () => {
    loadEnv(fixture('rupturas-o4'));
    applyStoryResult('umbral_suenos', WIN);
    checkMissions();
    const uid = E.ecosReady()[0];
    const c = G.s.cats.find((x) => x.uid === uid)!;
    const before = battleCatFrom({ uid, species: c.species, name: c.name, level: c.level, stars: c.stars, dmgMul: 1, hpMul: 1 }, ROLE_BY_ID.get(catDef(c.species).role)!.hp);
    const snap = JSON.stringify({ level: c.level, stars: c.stars, form: c.form, mutation: c.mutation, holo: c.holo });
    const gems = G.s.gems;
    const moments = c.moments.length;
    const r = E.wakeEco(uid)!;
    expect(r.mission).toBe(true);
    expect(r.gift).toBe(E.ECO_GIFT_GEMS);
    expect(G.s.gems).toBe(gems + E.ECO_GIFT_GEMS);
    checkMissions();
    expect(done('H59')).toBe(true);
    expect(rewardClaimed(`eco:${uid}`)).toBe(true);
    expect(c.moments.length).toBe(moments + 1);
    expect(E.ecoStatus(uid)).toBe('awake');
    expect(E.ecoShown(uid)).toBe(true);
    expect(E.wakeEco(uid)).toBeNull();
    expect(JSON.stringify({ level: c.level, stars: c.stars, form: c.form, mutation: c.mutation, holo: c.holo })).toBe(snap);
    const after = battleCatFrom({ uid, species: c.species, name: c.name, level: c.level, stars: c.stars, dmgMul: 1, hpMul: 1 }, ROLE_BY_ID.get(catDef(c.species).role)!.hp);
    expect(after).toEqual(before);
    // VER ECO: the look can be switched off and on; it survives a reload
    E.setEcoShown(uid, false);
    expect(E.ecoShown(uid)).toBe(false);
    G.save();
    G.load();
    expect(E.ecoStatus(uid)).toBe('awake');
    expect(E.ecoShown(uid)).toBe(false);
    expect(E.ecosAwakeCount()).toBeGreaterThanOrEqual(1);
    // the ledger: even if the Eco record were lost, the keepsake is never paid twice
    delete (G.s.ext as Record<string, unknown>).ecos;
    const g2 = G.s.gems;
    expect(E.wakeEco(uid)!.gift).toBe(0);
    expect(G.s.gems).toBe(g2);
  });

  it('never a deadlock: no cat slept enough → the oldest remembers; every Eco already awake → RECORDAR answers H59', () => {
    loadEnv(fixture('rupturas-o4'));
    applyStoryResult('umbral_suenos', WIN);
    checkMissions();
    const now = Date.now();
    for (const [i, c] of G.s.cats.entries()) c.bornAtMs = now - 3600_000 + i;
    const ready = E.ecosReady(now);
    expect(ready.length).toBe(1);
    expect(G.s.cats.find((c) => c.uid === ready[0])!.species).not.toBe('c_canelo');
    // everyone remembers already (a replay after the narrative reset)
    const ex = ((G.s.ext ??= {}).ecos = { awake: {}, hidden: [] }) as { awake: Record<string, { eco: string; at: number }> };
    for (const c of G.s.cats) if (c.species !== 'c_canelo') ex.awake[c.uid] = { eco: 'arena', at: 1 };
    expect(E.ecosReady(now)).toEqual([]);
    const uid = G.s.cats.find((c) => c.species !== 'c_canelo')!.uid;
    expect(E.rememberEco(uid)).toBe(true);
    checkMissions();
    expect(done('H59')).toBe(true);
    expect(E.ecoCandidate()).toBeTruthy();
  });
});

// ------------------------------------------------------------------ the wave
describe('Oleada 4 — the whole wave', () => {
  it('Part I saves see nothing of it (no H58, no Ecos, no world states, no page by the faro)', () => {
    loadEnv(fixture('late-game'));
    expect(MISSIONS.filter((m) => IDS.includes(m.id) && (active(m.id) || done(m.id)))).toEqual([]);
    expect(O4.oleada4Open()).toBe(false);
    expect(G.s.ext?.ecos).toBeUndefined();
    expect(G.s.ext?.olvidada).toBeUndefined();
    expect(world()).not.toMatch(/^o4_/);
    expect(PAGE.pageModeFor(G.s)).toBe('hidden');
  });

  it('plays start to finish: dream → Ecos → ruins → the page → Correctores → El Umbral → «Mentira» → credits', () => {
    loadEnv(fixture('rupturas-o4'));
    expect(active('H58')).toBe(true);
    expect(G.has('region:suenos')).toBe(true);
    expect(world()).toBe('o4_suenos');
    const gems0 = G.s.gems;
    const uid = playWave();
    expect(IDS.every(done)).toBe(true);
    expect(G.has('oleada4_fin')).toBe(true);
    expect(G.has('region:olvidada') && G.has('region:umbral')).toBe(true);
    expect(O4.parteIIFin()).toBe(true);
    expect(O4.registro000Despertando()).toBe(true);
    expect(O4.mentiraChoice()).toBe('nada');
    expect(E.ecoStatus(uid)).toBe('awake');
    for (const sp of ['c_almohadon', 'c_polvillo', 'r_tachon', 'l_bisagra']) expect(G.s.cats.some((c) => c.species === sp), sp).toBe(true);
    expect(rewardClaimed('cat:mission_H60')).toBe(true);
    expect(G.s.gems).toBeGreaterThan(gems0);
    // the world after the Parte II, and the page that stays by your faro
    expect(world()).toBe('o4_epilogo');
    expect(PAGE.pageModeFor(G.s)).toBe('rest');
    // it all survives a reload
    G.save();
    G.load();
    checkMissions();
    expect(IDS.every(done)).toBe(true);
    expect(world()).toBe('o4_epilogo');
  });

  it('the world follows the story (derived): a state per mission, the faro invites only after the page came down', () => {
    loadEnv(fixture('rupturas-o4'));
    const want: Record<string, string> = { H58: 'o4_suenos', H59: 'o4_eco', H60: 'o4_olvido', H61: 'o4_tachon', H62: 'o4_umbral', H63: 'o4_umbral', H64: 'o4_mentira', H65: 'o4_alba' };
    const s = (act: string, beats: string[] = []) => ({ missions: { active: [act], done: ['H57'] }, beatsSeen: beats, flags: {} });
    for (const [m, id] of Object.entries(want)) expect(W.currentWorldState(s(m)).id, m).toBe(id);
    const def = W.worldStateById('o4_mentira')!;
    expect(def.prompt?.target).toBe('faro');
    expect(def.prompt!.when!(s('H64'))).toBe(false);
    expect(def.prompt!.when!(s('H64', ['b64_mentira#a']))).toBe(true);
    expect(def.prompt!.when!(s('H64', ['b64_mentira#a', 'b64_mentira#b']))).toBe(false);
    expect(PAGE.pageModeFor(s('H64'))).toBe('hidden');
    expect(PAGE.pageModeFor(s('H64', ['b64_mentira#a']))).toBe('waiting');
    expect(PAGE.pageModeFor(s('H64', ['b64_mentira#a', 'b64_mentira#b']))).toBe('canelo');
    expect(PAGE.pageModeFor(s('H65'))).toBe('canelo');
    for (const st of W.worldStates().filter((d) => d.wave === 'O4')) {
      expect(st.priority).toBeGreaterThanOrEqual(100);
      expect(st.priority).toBeLessThanOrEqual(129);
      expect(W.isNeutralGrade(W.lookOf(st)) || W.lookOf(st).lift !== 0 || W.lookOf(st).exposure > 0.6, st.id).toBe(true);
    }
  });

  it('the finale plumbing: idempotent, a replay changes nothing, credits are data (Ragosorio, his 6 songs, the cats)', () => {
    loadEnv(fixture('rupturas-o4'));
    const snap = () => JSON.stringify({ m: G.s.missions.done, b: G.s.beatsSeen, f: G.s.flags });
    const before = snap();
    const rep = FIN.finaleCtx({ replay: true });
    rep.choose('perfecto');
    rep.asleep();
    rep.mentira();
    rep.wake();
    expect(snap()).toBe(before);
    const d = CRED.creditsData();
    expect(d.creator).toBe('Ragosorio');
    expect(d.songs.map((x) => x.title)).toEqual(['CIRCUS MALUS', 'Hemkade', 'LIKY FIGHT', 'WHEN I LOSE', 'YONOSE TODO', 'te ODIO']);
    expect(d.songs.every((x) => x.composer === 'Ragosorio')).toBe(true);
    expect(d.cast.map((c) => c.id)).toEqual(CRED.PART2_CAST);
    expect(CRED.PART2_CAST).toEqual(expect.arrayContaining(SPECIES.map(([id]) => id)));
    expect(d.cast.filter((c) => !c.known).every((c) => c.name === '???')).toBe(true);
    const blocks = CRED.creditBlocks(d).map((b) => b.text ?? '').join('\n');
    expect(blocks).toContain('RAGOSORIO');
    expect(blocks).toContain('compuestas por Ragosorio');
    for (const t of ['CIRCUS MALUS', 'YONOSE TODO', 'te ODIO']) expect(blocks).toContain(`«${t}»`);
  });

  it('a replay (narrative reset) never pays the unique rewards twice: battles, cats, Polvillo, the Ecos keepsake', () => {
    loadEnv(fixture('rupturas-o4'));
    playWave();
    const gems = G.s.gems;
    const cats = G.s.cats.length;
    const counts = (sp: string) => G.s.cats.filter((c) => c.species === sp).length;
    const polvillo = counts('c_polvillo');
    for (const k of ['battle:umbral_suenos', 'battle:umbral_correctores', 'battle:umbral_final', 'cat:umbral_suenos', 'cat:mission_H60']) expect(rewardClaimed(k), k).toBe(true);
    // the narrative reset of a save that played ALL of Parte II (the patch is forever; here it runs again by hand)
    delete (G.s.ext!.rupturas as Record<string, unknown>).reset;
    G.s.patches = G.s.patches.filter((p) => p !== RESET_PATCH_ID);
    expect(applyRupturasReset({ backup: false })).toBe('reiniciado');
    expect(G.s.missions.done.filter((m) => /^H(3[1-9]|[4-6]\d)$/.test(m))).toEqual([]);
    expect(G.has('oleada4_fin') || G.has('region:umbral') || G.has('won_umbral_final')).toBe(false);
    expect(G.s.beatsSeen.some((b) => /^b(5[89]|6\d)_/.test(b))).toBe(false);
    // what you own stays: cats, Ecos, the choice you made
    expect(G.s.cats.length).toBe(cats);
    expect(E.ecosAwakeCount()).toBeGreaterThanOrEqual(1);
    expect(O4.mentiraChoice()).toBe('nada');
    for (const id of IDS) expect(rewardClaimed(`mission:${id}`), id).toBe(true);
    expect(PAGE.pageModeFor(G.s)).toBe('hidden');
    // replay O4 from H58 (H31–H57 done again, as the replay would have it)
    for (let n = 31; n <= 57; n++) if (!done(`H${n}`)) G.s.missions.done.push(`H${n}`);
    G.s.missions.active = G.s.missions.active.filter((m) => !/^H(3[1-9]|[4-6]\d)$/.test(m));
    checkMissions();
    expect(active('H58')).toBe(true);
    // the old feature counters don't answer the replayed missions by themselves
    expect(done('H59')).toBe(false);
    const loot = applyStoryResult('umbral_suenos', WIN);
    expect(loot.alreadyPaid).toBe(true);
    expect(claimStoryCat(loot.newCat!, loot.catKey).already).toBe(true);
    checkMissions();
    // H59 by RECORDAR or a new cat's Eco (never a keepsake twice)
    const g59 = G.s.gems;
    const ready = E.ecosReady();
    if (ready.length) E.wakeEco(ready[0]);
    else E.rememberEco(G.s.cats.find((c) => E.ecoAwake(c.uid) && c.species !== 'c_canelo')!.uid);
    checkMissions();
    expect(done('H59')).toBe(true);
    expect(G.s.gems - g59).toBeLessThanOrEqual(E.ECO_GIFT_GEMS + 1);
    // the island nobody remembers is in ruins again, and Polvillo doesn't join twice
    expect(OLV.olvidadaProgress()).toBe(0);
    for (const r of OLV.olvidadaRuins()) OLV.repairRuin(r.id, OLV.repairersFor(r.id)[0].uid);
    checkMissions();
    expect(done('H60')).toBe(true);
    expect(O4.o4PendingCats()).toEqual([]);
    expect(counts('c_polvillo')).toBe(polvillo);
    step('H61', () => O4.readDistraxia());
    expect(applyStoryResult('umbral_correctores', WIN).alreadyPaid).toBe(true);
    checkMissions();
    expect(applyStoryResult('umbral_final', WIN).alreadyPaid).toBe(true);
    checkMissions();
    const fin = FIN.finaleCtx();
    step('H64', () => {
      fin.asleep();
      fin.mentira();
    });
    step('H65', () => fin.wake());
    expect(G.has('oleada4_fin')).toBe(true);
    // only the small income part of the missions' rewards (or a Reino milestone) and nothing unique
    expect(G.s.gems - gems).toBeLessThanOrEqual(12);
    claimReward('noop'); // the ledger keeps working after the replay
  });
});

// ------------------------------------------------------------------ battles
describe('Oleada 4 — battles', () => {
  it('every O4 battle builds and plays headless with the post-finale crew (the story never walls)', () => {
    loadEnv(fixture('rupturas-o4'));
    for (const id of B4.O4_BATTLES) {
      const sp = buildStoryBattle(id, () => undefined);
      const r = autoBattle(sp, DIFFICULTY.normal, 4242, 30);
      expect(r.turns, id).toBeGreaterThan(0);
    }
  }, 240_000);

  it('H62 reaches EL PLAN (the Momento\'s phase change), which ENDS the fight in a victory; the same seed replays the same fight', () => {
    loadEnv(fixture('rupturas-o4'));
    const sp = buildStoryBattle('umbral_correctores', () => undefined);
    const run = () => {
      const log: string[] = [];
      let maxFase = 0;
      let last: Parameters<typeof F.faseIndex>[0] | null = null;
      const r = autoBattle(sp, DIFFICULTY.normal, 777, 30, (b, side, shot) => {
        last = b;
        maxFase = Math.max(maxFase, F.faseIndex(b));
        log.push(`${b.turn}|${side}|${F.faseIndex(b)}|${shot}`);
      });
      return { r, log, maxFase, fin: last ? F.faseIndex(last) : -1 };
    };
    const a = run();
    const b = run();
    expect(b.log).toEqual(a.log);
    expect(b.r).toEqual(a.r);
    // owner's rule (2026-10-10): the Momento ends the battle — EL PLAN is the last thing that happens
    expect(sp.rules?.fases?.phases[1].endsBattle).toBe(true);
    // a won fight always ends inside EL PLAN (the Momento is the finishing blow: at its threshold, or on the winning shot)
    expect(a.fin).toBe(a.r.won ? 1 : 0);
  }, 240_000);
});
