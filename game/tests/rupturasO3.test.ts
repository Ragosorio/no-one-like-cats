/**
 * Parte II · Oleada 3 «La Era Astral» (docs/part-ii/25-oleada-3.md): H50–H57 in data/rupturas/historia-o3.json, their
 * hooks in ui/story/rupturasScriptO3.ts, the battles + Combustible Astral + Kit Astral + interactions in
 * state/sys/rupturasO3.ts, the generic multi-phase mechanism (battle/fases.ts) behind the multi-layer boss — all of it
 * deterministic in the sim the battle screen and the estimate worker share.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

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
const { STORY_BATTLES, applyStoryResult, buildStoryBattle } = await import('../src/state/sys/storyBattles');
const O3 = await import('../src/state/sys/rupturasO3');
const S = await import('../src/ui/story/rupturasScriptO3');
const { REGION_INFO } = await import('../src/regions');
const { speaker } = await import('../src/ui/story/text');
const { autoBattle, makeBattle, aiSeed, volleyAim, volleySigma, enemyProfile } = await import('../src/battle/autoplay');
const { decide, aimCannon, aimFrom, DIFFICULTY } = await import('../src/battle/ai');
const { summonShooters } = await import('../src/battle/bossLate');
const { INK_RUNE } = await import('../src/battle/sim');
const { BLUEPRINTS } = await import('../src/battle/blueprints');
const { battleCatFrom } = await import('../src/battle/catShots');
const F = await import('../src/battle/fases');
const { ULTS } = await import('../src/battle/ults');
const { FORM_BY_ID } = await import('../src/data/rupturas/formas');
const forms = await import('../src/state/sys/forms');
const { rewardClaimed } = await import('../src/state/sys/rupturasLedger');
const { RESET_PATCH_ID } = await import('../src/state/sys/rupturasReset');
const { startEterno, lockEterno, resolveEterno } = await import('../src/state/sys/casino/eterno');
import type { Battle, BattleEvent } from '../src/battle/sim';
import type { BattleResult, BattleSpec } from '../src/scenes/BattleScene';

const IDS = ['H50', 'H51', 'H52', 'H53', 'H54', 'H55', 'H56', 'H57'];
const BEFORE = Array.from({ length: 19 }, (_, i) => `H${31 + i}`); // H31–H49
const WIN: BattleResult = { won: true, reason: 'sunk', turns: 6, modulesDestroyed: 4, damageDealt: 1000, catsLost: 0, perfect: false, enemyHullLost: 0.8 };
const SPECIES: [id: string, rarity: string, elements: string[], role: string, slug: string][] = [
  ['c_satelito', 'common', ['cosmic'], 'francotirador', 'satelito_dish_cat'],
  ['c_tanquecito', 'common', ['fire'], 'soporte', 'tanquecito_fuel_cat'],
  ['r_escafandra', 'rare', ['cosmic', 'earth'], 'tanque', 'escafandra_fishbowl_cat'],
  ['r_grafitera', 'rare', ['void', 'sound'], 'controlador', 'grafitera_spray_cat'],
  ['e_brecha', 'epic', ['void', 'storm'], 'asediador', 'brecha_crowbar_cat'],
  ['l_jonas', 'legendary', ['water', 'cosmic'], 'invocador', 'jonas_whale_cat'],
  ['s_platillo', 'epic', ['cosmic', 'gravity'], 'invocador', 'platillo_saucer_cat'],
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
/** post-finale with Oleadas 1–2 closed (H31–H49 done, an aerobarco, Gravedad; the narrative reset counts as applied) */
function oleada2Closed() {
  const env = fixture('post-finale');
  const s = env.state;
  s.missions.done.push(...BEFORE);
  s.flags.oleada1_fin = true;
  s.flags.oleada2_fin = true;
  if (!s.elements.includes('gravity')) s.elements.push('gravity');
  s.ext = { ...(s.ext ?? {}), flightKit: { level: 1, ships: [s.ship.active] } };
  s.patches = [...(s.patches ?? []), RESET_PATCH_ID];
  return env;
}
const done = (id: string) => G.s.missions.done.includes(id);
const active = (id: string) => G.s.missions.active.includes(id);
function step(id: string, fn: () => void) {
  expect(active(id), `${id} active`).toBe(true);
  fn();
  checkMissions();
  expect(done(id), `${id} done`).toBe(true);
}
function crewCat(uid: string, species: string, level = 10) {
  return battleCatFrom({ uid, species, name: species, level, stars: 1, dmgMul: 1, hpMul: 1 }, ROLE_BY_ID.get(catDef(species).role)!.hp);
}
function spec(player: string[], enemy: string[], rules?: BattleSpec['rules'], hpMul = 6): BattleSpec {
  return {
    player: { blueprint: BLUEPRINTS.sparrow, hpMul, cats: player.map((s, i) => crewCat(`p${i}`, s)), cannonAtk: 30 },
    enemy: { blueprint: BLUEPRINTS.sparrow, hpMul, cats: enemy.map((s, i) => crewCat(`e${i}`, s)), cannonAtk: 30 },
    playerName: 'Tú',
    enemyName: 'Ellos',
    difficulty: 'normal',
    rules,
    onEnd: () => undefined,
  };
}
/** every cell of `side` down to `life` of its max hp */
function hurt(b: Battle, side: number, life: number) {
  for (const c of b.sides[side].ship.cells()) c.hp = Math.max(1, Math.round(c.maxHp * life));
}
const fases = (ev: BattleEvent[]) => ev.filter((e) => e.k === 'boss' && e.what === 'fase').map((e) => (e as { n?: number }).n);

// ------------------------------------------------------------------ data
describe('Oleada 3 — data', () => {
  it('H50–H57: one historia chain right after H49, with the right goals', () => {
    let prev = 'H49';
    for (const id of IDS) {
      const m = MISSION_BY_ID.get(id)!;
      expect(m, id).toBeTruthy();
      expect(m.chain).toBe('historia');
      expect(m.trigger).toBe(`mission:${prev}`);
      expect(m.goal.text.length).toBeGreaterThan(20);
      expect(m.line && m.why, id).toBeTruthy();
      prev = id;
    }
    expect(MISSION_BY_ID.get('H50')!.goal).toMatchObject({ type: 'use_feature', feature: 'region_cometa' });
    expect(MISSION_BY_ID.get('H51')!.goal).toMatchObject({ type: 'win_battle', battle: 'ruptura_sincronia' });
    expect(MISSION_BY_ID.get('H52')!.goal).toMatchObject({ type: 'win_battle', battle: 'ruptura_estrella' });
    expect(MISSION_BY_ID.get('H53')!.goal).toMatchObject({ type: 'use_feature', feature: 'sello_canelo' });
    expect(MISSION_BY_ID.get('H53')!.unlocks).toContain('forma:canelo_astral');
    expect(MISSION_BY_ID.get('H54')!.goal).toMatchObject({ type: 'use_feature', feature: 'ficha_maneki' });
    expect(MISSION_BY_ID.get('H55')!.goal).toMatchObject({ type: 'win_battle', battle: 'ruptura_disruptores' });
    expect(MISSION_BY_ID.get('H56')!.goal).toMatchObject({ type: 'use_feature', feature: 'firma_bitacora' });
    expect(MISSION_BY_ID.get('H57')!.goal).toMatchObject({ type: 'win_battle', battle: 'ruptura_leviatan' });
    expect(MISSION_BY_ID.get('H57')!.unlocks).toContain('oleada3_fin');
    expect(MISSIONS.filter((m) => !goalSupported(m.goal.type)).map((m) => m.id)).toEqual([]);
    // every use_feature goal of the wave has a handler (region arrival or an O3 interaction)
    for (const f of Object.keys(O3.O3_FEATURES)) expect(MISSION_BY_ID.get(O3.O3_FEATURES[f])!.goal).toMatchObject({ feature: f });
  });

  it('the four battles: registered, on Puerto Cometa, phased (FASES), crews and rewards exist', () => {
    const BATTLE_OF: Record<string, string> = { ruptura_sincronia: 'H51', ruptura_estrella: 'H52', ruptura_disruptores: 'H55', ruptura_leviatan: 'H57' };
    expect(O3.O3_BATTLES).toEqual(Object.keys(BATTLE_OF));
    expect(REGION_INFO.cometa.battles).toEqual(Object.keys(BATTLE_OF));
    for (const [b, m] of Object.entries(BATTLE_OF)) {
      const def = STORY_BATTLES[b];
      expect(def.mission).toBe(m);
      expect(def.rules?.fases?.phases.length, b).toBeGreaterThan(0);
      expect(def.powerMul).toBeGreaterThan(1);
      expect(def.powerMul).toBeLessThan(1.5);
      for (const sp of def.enemyCats) expect(CAT_BY_ID.has(sp), `${b}: ${sp}`).toBe(true);
      if (def.reward.cat) expect(CAT_BY_ID.has(def.reward.cat)).toBe(true);
      // plain data: the estimate worker gets it through structured clone
      expect(structuredClone(def.rules)).toEqual(def.rules);
    }
    // the void: gravity 0.25, no wind, a planetoid with an orbital well
    const est = STORY_BATTLES.ruptura_estrella.rules!.fases!.phases[0].env!;
    expect([est.g, est.calm, est.layer]).toEqual([0.25, true, 'astral']);
    expect(est.bodies?.[0].well).toBeTruthy();
    // the multi-layer boss: sea → sky → astral rift
    const lev = STORY_BATTLES.ruptura_leviatan.rules!.fases!.phases;
    expect(lev.map((p) => p.env?.layer)).toEqual(['sea', 'sky', 'astral']);
    expect(lev.map((p) => p.env?.g ?? 1)).toEqual([1, 0.7, 0.25]);
    expect(lev[1].at?.hp).toBeLessThan(lev[2].at!.hp!);
    expect(lev.slice(1).every((p) => (p.telegraph ?? '').length > 20)).toBe(true);
    expect(STORY_BATTLES.ruptura_leviatan.reward.cat).toBe('l_jonas');
    expect([...O3.ASTRAL_BATTLES].sort()).toEqual(['ruptura_disruptores', 'ruptura_estrella']);
  });

  it('the 7 species (6 astral + 1 secret), exactly as the contract says; lote F landed: real painting + rig, no stand-in', () => {
    const catArt = readFileSync(new URL('../src/art/catArt.ts', import.meta.url), 'utf8');
    const rigs = JSON.parse(readFileSync(new URL('../src/data/catRigs.json', import.meta.url), 'utf8')) as Record<string, unknown>;
    for (const [id, rarity, elements, role, slug] of SPECIES) {
      const c = CAT_BY_ID.get(id)!;
      expect(c, id).toBeTruthy();
      expect([c.rarity, c.elements, c.role, c.art.slug], id).toEqual([rarity, elements, role, slug]);
      expect(c.lore.length).toBeGreaterThan(40);
      expect(catArt.includes(`${slug}: [`), `STAND_IN ${slug}`).toBe(false);
      expect(rigs[slug], `rig ${slug}`).toBeTruthy();
      for (const f of [`../public/cats-svg/${slug}.svg`, `../public/cats-svg/lite/${slug}.svg`])
        expect(existsSync(new URL(f, import.meta.url)), f).toBe(true);
    }
    expect(catDef('s_platillo').secret).toBe(true);
    expect(catDef('l_jonas').obtain.source).toBe('ruptura:H57');
    expect(typeof ULTS.l_jonas).toBe('function');
  });

  it('beats: every part ≤4 lines, every line played once, speakers known, a $scene note each', () => {
    const used = new Map<string, number[]>();
    for (const t of [S.O3_ON_NEW, S.O3_ON_DONE])
      for (const [id, refs] of Object.entries(t)) {
        expect(IDS).toContain(id);
        for (const r of refs) {
          const b = BEAT_BY_ID.get(r.beat)!;
          expect(b, r.beat).toBeTruthy();
          expect(r.lines!.length, `${r.beat}#${r.part}`).toBeLessThanOrEqual(4);
          for (const i of r.lines!) expect(i).toBeLessThan(b.lines.length);
          used.set(r.beat, [...(used.get(r.beat) ?? []), ...r.lines!]);
        }
      }
    expect(used.size).toBe(8);
    for (const [beat, lines] of used) {
      const b = BEAT_BY_ID.get(beat)!;
      expect([...lines].sort((a, z) => a - z), beat).toEqual(b.lines.map((_, i) => i));
      expect(String((b as unknown as Record<string, unknown>)['$scene'] ?? '').length, `${beat} $scene`).toBeGreaterThan(40);
      for (const [sp] of b.lines) {
        const k = speaker(sp);
        expect(k.kind === 'cat' && k.slug === 'canelo_cozy_cat' && k.name === sp.toUpperCase(), `${beat}: ${sp}`).toBe(false);
      }
    }
    expect(Object.keys(S.O3_ON_NEW).sort()).toEqual([...IDS].sort());
    expect([...S.O3_COVERED].sort()).toEqual([...IDS].sort());
  });

  it('a mission ON_NEW always waits longer than the ON_DONE parts of the mission before it', () => {
    let prevMax = 2.5; // H49's ending parts (rupturasScriptO2)
    for (const id of IDS) {
      for (const r of S.O3_ON_NEW[id] ?? []) expect(r.delay ?? 0, id).toBeGreaterThan(prevMax);
      prevMax = Math.max(0, ...(S.O3_ON_DONE[id] ?? []).map((r) => r.delay ?? 0));
    }
  });
});

// ------------------------------------------------------------------ FASES (battle/fases.ts)
const LEV = (): BattleSpec['rules'] => ({ fases: { side: 1, phases: STORY_BATTLES.ruptura_leviatan.rules!.fases!.phases } });

describe('FASES — the generic multi-phase mechanism', () => {
  it('the multi-layer boss switches gravity / wind / bodies at its HP thresholds, announced by a sim event', () => {
    const b = makeBattle(spec(['c_canelo', 'c_satelito'], ['c_canelo', 'c_satelito'], LEV()), 7);
    expect(F.faseIndex(b)).toBe(0);
    expect(b.field.gMul).toBe(1);
    expect(F.fasesCheck(b)).toEqual([]);
    // 35% of the way to sinking → the sky
    hurt(b, 1, 0.74);
    const ev1 = F.fasesCheck(b);
    expect(fases(ev1)).toEqual([1]);
    expect((ev1[0] as { amount?: number }).amount).toBe(0);
    expect(b.field.gMul).toBe(0.7);
    expect(F.fasesFlight(b, 0, 'ballistic')!.windMul).toBe(1.6);
    expect(F.fasesState(b)!.bodies[0].look).toBe('cloud');
    // 70% → the astral rift: no wind, a planetoid with an orbital well
    hurt(b, 1, 0.48);
    expect(fases(F.fasesCheck(b))).toEqual([2]);
    expect(b.field.gMul).toBe(0.25);
    expect(b.wind).toBe(0);
    expect(F.fasesFlight(b, 0, 'ballistic')!.windMul).toBe(0);
    const st = F.fasesState(b)!;
    expect(st.layer).toBe('astral');
    expect(st.bodies[0].well).toBeGreaterThan(0);
    expect(b.wells.some((w) => w.turns === Infinity && w.x === st.bodies[0].x)).toBe(true);
    // the wind stays dead in space, turn after turn
    b.endTurn();
    b.startTurn(0);
    expect(b.wind).toBe(0);
    // crossing two thresholds at once announces both
    const c = makeBattle(spec(['c_canelo'], ['c_canelo'], LEV()), 7);
    hurt(c, 1, 0.4);
    expect(fases(F.fasesCheck(c))).toEqual([1, 2]);
  });

  it('a turn threshold works too; a planetoid stops shots; the ESCUDO absorbs the first foe impact per phase', () => {
    const rules: BattleSpec['rules'] = {
      fases: {
        side: 1,
        shield: [1, 0],
        phases: [
          { id: 'a', name: 'A', env: { g: 0.25, calm: true, layer: 'astral', bodies: [{ up: 360, r: 46, well: { r: 330, k: 950 } }] } },
          { id: 'b', name: 'B', at: { turn: 3 }, env: { layer: 'glitch', portals: { a: { dx: -150, up: 470 }, b: { dx: 150, up: 300 }, r: 46 } } },
        ],
      },
    };
    const b = makeBattle(spec(['c_canelo'], ['c_canelo'], rules), 7);
    // a body: its impact is handled (nothing else is hit)
    const body = F.fasesState(b)!.bodies[0];
    const ev: BattleEvent[] = [];
    const shot = b.sides[0].cats[0].def.shot;
    b.resolveImpact(0, shot, 50, body.x, body.y, ev, 0, 0, true);
    expect(F.fasesState(b)!.bodyHits).toBe(1);
    expect(ev.some((e) => e.k === 'cell')).toBe(false);
    // a flat shot straight at the planetoid ends on it
    const path = b.buildPaths(shot, { x: body.x - 220, y: body.y }, 0, 900, 0, 0)[0];
    const end = path.points[path.points.length - 1];
    expect(Math.hypot(end.x - body.x, end.y - body.y)).toBeLessThan(body.r + 30);
    // ESCUDO: your hull's first foe impact vanishes, the second lands
    const cell = b.sides[0].ship.cells().find((c) => c.hp > 0)!;
    const p = b.cellCenter(0, cell.x, cell.y);
    const hp0 = cell.hp;
    const e1: BattleEvent[] = [];
    b.resolveImpact(1, shot, 200, p.x, p.y, e1, 0, 0, true);
    expect(cell.hp).toBe(hp0);
    expect(F.fasesState(b)!.shieldLeft[0]).toBe(0);
    b.resolveImpact(1, shot, 200, p.x, p.y, [], 0, 0, true);
    expect(cell.hp).toBeLessThan(hp0);
    // turn 3 starts → phase B (rifts open), the well leaves with the planetoid, the shield recharges
    while (b.turn < 3) {
      b.startTurn(0);
      b.endTurn();
      b.startTurn(1);
      b.endTurn();
    }
    const ev3 = b.startTurn(0);
    expect(fases(ev3)).toEqual([1]);
    expect(b.portals).toBeTruthy();
    expect(b.wells.some((w) => w.turns === Infinity)).toBe(false);
    expect(F.fasesState(b)!.shieldLeft[0]).toBe(1);
  });

  it('deterministic: the same seed replays the same multi-layer battle; the screen flow == the estimate (worker clone)', () => {
    const sp = spec(['c_canelo', 'r_plasmin', 'c_satelito', 'e_meteoro'], ['e_cascada', 'e_brecha', 'c_satelito', 'r_grafitera'], { ...LEV(), cataclysm: { id: 'tide', side: 1, by: 'EL LEVIATÁN', first: 1, every: 3, power: 4 } }, 4);
    const prof = DIFFICULTY.normal;
    const play = (s: BattleSpec, seed: number) => {
      const log: string[] = [];
      const r = autoBattle(s, prof, seed, 30, (b, side, shot) => log.push(`${b.turn}|${side}|${F.faseIndex(b)}|${shot}`));
      return { r, log };
    };
    const { onEnd: _drop, ...plain } = sp;
    const workerSpec = structuredClone(plain) as BattleSpec;
    let sawLayers = 0;
    for (const seed of [11, 4242, 90210]) {
      const a = play(sp, seed);
      const c = play(workerSpec, seed);
      expect(c.r).toEqual(a.r);
      expect(c.log).toEqual(a.log);
      sawLayers = Math.max(sawLayers, ...a.log.map((l) => Number(l.split('|')[2])));
      // the screen: BattleScene's turn flow (start → cat shot(s) with aiSeed → ink → volley → end)
      const scr: string[] = [];
      const b = makeBattle(sp, seed);
      const mem2 = [new Map<string, number>(), new Map<string, number>()];
      const profs = [prof, enemyProfile(sp)];
      const dmgBy = new Map<string, number>();
      let g = 0;
      while (b.winner === null && g++ < 30) {
        for (const side of [0, 1] as const) {
          b.startTurn(side);
          b.queued.length = 0;
          if (b.winner !== null) break;
          let target: { x: number; y: number } | null = null;
          const shots = 1 + b.extraShots(side);
          for (let k = 0; k < shots && b.winner === null; k++) {
            const d = decide(b, side, profs[side], mem2[side], aiSeed.cat(b, side, k), { demolisher: sp.rules?.demolisher?.includes(side), dmgBy });
            if (!d) break;
            const r = b.fire(side, d.shooter, d.angle, d.power, d.ult);
            scr.push(`${b.turn}|${side}|${F.faseIndex(b)}|${d.shooter}${d.ult ? '(ULT)' : ''} ->(${Math.round(d.target.x)},${Math.round(d.target.y)}) ${r.shot.name}`);
            target = volleyAim(target, r.events, side);
            for (const e of r.events) if (side === 1 && e.k === 'cat' && e.side === 0 && e.dmg > 0) dmgBy.set(d.shooter, (dmgBy.get(d.shooter) ?? 0) + e.dmg);
          }
          for (const p of summonShooters(b, side)) {
            if (b.winner !== null) break;
            const a2 = aimFrom(b, side, b.partMuzzle(side, p), INK_RUNE, aiSeed.ink(b, p.id), 3);
            b.fire(side, `part:${p.id}`, a2.angle, a2.power);
          }
          for (const m of b.cannons(side)) {
            if (b.winner !== null) break;
            if (!m.alive) continue;
            const a2 = aimCannon(b, side, m.id, aiSeed.cannon(b, m.id), volleySigma(sp, side), target ?? undefined);
            b.fire(side, 'cannon', a2.angle, a2.power, false, m.id);
          }
          b.endTurn();
          if (b.winner !== null) break;
        }
      }
      expect(scr).toEqual(a.log);
    }
    expect(sawLayers).toBeGreaterThanOrEqual(1);
  }, 240_000);

  it('every O3 battle builds and plays headless with a post-finale crew (the story never walls)', () => {
    loadEnv(oleada2Closed());
    for (const id of O3.O3_BATTLES) {
      const sp = buildStoryBattle(id, () => undefined);
      expect(sp.rules?.fases).toBeTruthy();
      const r = autoBattle(sp, DIFFICULTY.normal, 4242, 30);
      expect(r.turns, id).toBeGreaterThan(0);
    }
  }, 240_000);
});

// ------------------------------------------------------------------ saves, Combustible Astral, Canelo Astral, ledger
describe('Oleada 3 — saves and systems', () => {
  it('Part I saves see nothing of it (no H50, no fuel, no Puerto Cometa)', () => {
    loadEnv(fixture('late-game'));
    expect(MISSIONS.filter((m) => IDS.includes(m.id) && (active(m.id) || done(m.id)))).toEqual([]);
    expect(O3.cometaOpen()).toBe(false);
    expect(G.has('region:cometa')).toBe(false);
    expect(G.s.ext?.astral).toBeUndefined();
  });

  it('the whole wave plays: Puerto Cometa → SINCRO → the star → the seal → Maneki → Disruptores → the note → the Leviatán', () => {
    loadEnv(oleada2Closed());
    expect(active('H50')).toBe(true);
    expect(patchNotes.some((n) => /LA ERA ASTRAL/.test(n))).toBe(true);
    expect(G.has('region:cometa')).toBe(true);
    const ship = G.s.ship.active;
    // arrival: Escafandra's gift — a tank and the Kit Astral on your aerobarco (same ship)
    step('H50', () => G.count('feature_region_cometa'));
    expect(O3.hasAstralKit(ship)).toBe(true);
    expect(O3.fuel()).toBe(O3.ARRIVAL_FUEL);
    expect(rewardClaimed('fuel:mission_H50')).toBe(true);
    step('H51', () => applyStoryResult('ruptura_sincronia', WIN));
    const cosmic = G.s.crystals.cosmic ?? 0;
    step('H52', () => applyStoryResult('ruptura_estrella', WIN));
    expect(G.s.crystals.cosmic).toBe(cosmic + 20);
    expect(O3.fuel()).toBe(O3.ARRIVAL_FUEL + O3.WIN_FUEL);
    // the seal: the interaction completes H53 and unlocks Canelo Astral
    expect(O3.featurePending('sello_canelo')).toBe(true);
    expect(forms.formUnlocked(FORM_BY_ID.get('canelo_astral')!)).toBe(false);
    step('H53', () => expect(O3.completeFeature('sello_canelo')).toBe(true));
    expect(G.has('forma:canelo_astral')).toBe(true);
    const canelo = G.s.cats.find((c) => c.species === 'c_canelo')!;
    expect(forms.setForm(canelo, 'canelo_astral')).toBe('ok');
    expect(forms.formRevealsPending().map((f) => f.id)).toContain('canelo_astral');
    // Maneki: the card, then she joins once (ledger)
    step('H54', () => O3.completeFeature('ficha_maneki'));
    const hadManeki = G.s.cats.some((c) => c.species === 's_maneki');
    expect(O3.o3PendingCats()).toEqual(['s_maneki']);
    const r = O3.claimO3Cat('s_maneki');
    expect(r).toBeTruthy();
    expect(G.s.cats.filter((c) => c.species === 's_maneki').length).toBe(1);
    expect(hadManeki || r?.isNew).toBe(true);
    expect(O3.o3PendingCats()).toEqual([]);
    expect(O3.claimO3Cat('s_maneki')).toBeNull();
    step('H55', () => applyStoryResult('ruptura_disruptores', WIN));
    expect(O3.completeFeature('firma_bitacora')).toBe(true);
    checkMissions();
    expect(done('H56')).toBe(true);
    step('H57', () => applyStoryResult('ruptura_leviatan', WIN));
    expect(G.has('oleada3_fin')).toBe(true);
    // it all survives a reload: the kit on the same ship, the fuel, the form
    const f = O3.fuel();
    G.save();
    G.load();
    expect(O3.hasAstralKit(ship)).toBe(true);
    expect(O3.fuel()).toBe(f);
    expect(forms.activeForm(G.s.cats.find((c) => c.species === 'c_canelo')!)?.id).toBe('canelo_astral');
  });

  it('a replay (narrative reset) never pays the unique rewards twice: gift, battle payout, win fuel, Maneki', () => {
    loadEnv(oleada2Closed());
    step('H50', () => G.count('feature_region_cometa'));
    step('H51', () => applyStoryResult('ruptura_sincronia', WIN));
    step('H52', () => applyStoryResult('ruptura_estrella', WIN));
    const fuel = O3.fuel();
    const gems = G.s.gems;
    const cosmic = G.s.crystals.cosmic ?? 0;
    expect(rewardClaimed('battle:ruptura_estrella')).toBe(true);
    expect(rewardClaimed('fuel:ruptura_estrella')).toBe(true);
    // replay H50–H52 as the reset would: positions cleared, ledger kept
    G.s.missions.done = G.s.missions.done.filter((m) => !['H50', 'H51', 'H52'].includes(m));
    G.s.missions.active = G.s.missions.active.filter((m) => m !== 'H53');
    for (const k of ['won_ruptura_sincronia', 'event_done_ruptura_sincronia', 'won_ruptura_estrella', 'event_done_ruptura_estrella']) delete G.s.flags[k];
    checkMissions();
    step('H50', () => G.count('feature_region_cometa'));
    step('H51', () => applyStoryResult('ruptura_sincronia', WIN));
    const loot = applyStoryResult('ruptura_estrella', WIN);
    checkMissions();
    expect(done('H52')).toBe(true);
    expect(loot.alreadyPaid).toBe(true);
    expect(O3.fuel()).toBe(fuel);
    expect(G.s.crystals.cosmic ?? 0).toBe(cosmic);
    expect(G.s.gems - gems).toBeLessThanOrEqual(1); // only the income part of the mission reward (or a Reino milestone)
  });

  it('Combustible Astral: normalize, refinery (offline, up to the tank), Taller, trips, and ETERNO', () => {
    loadEnv(oleada2Closed());
    // junk never crashes nor invents a kit
    expect(O3.normalizeAstral('nope')).toBeNull();
    expect(O3.normalizeAstral({ fuel: -5, kit: { level: 9, ships: ['a', 'a', 3] } })).toMatchObject({ fuel: 0, kit: { level: 3, ships: ['a'] } });
    expect(O3.normalizeAstral({ fuel: 12.7, kit: 'x' })).toMatchObject({ fuel: 12, kit: { level: 0, ships: [] } });
    step('H50', () => G.count('feature_region_cometa'));
    // the refinery: +1 every 4 min, offline too, never past the tank
    const now = Date.now();
    G.s.ext!.astral = { fuel: 0, at: now - 10 * O3.FUEL_PROD.everyMs - 1000, kit: { level: 1, ships: [G.s.ship.active] } };
    O3.refine(now);
    expect(O3.fuel()).toBe(10);
    G.s.ext!.astral = { fuel: 0, at: now - 1000 * O3.FUEL_PROD.everyMs, kit: { level: 1, ships: [G.s.ship.active] } };
    O3.refine(now);
    expect(O3.fuel()).toBe(O3.TANK.base);
    expect(O3.nextFuelIn(now)).toBeNull();
    // the Taller sells a pack for gold (it may fill past the tank: you bought it)
    G.s.gold = 1e9;
    expect(O3.buyFuel()).toBe(true);
    expect(O3.fuel()).toBe(O3.TANK.base + 10);
    // a trip spends it; Velas Solares halve it
    expect(O3.tripCost()).toBe(10);
    expect(O3.spendFuel(O3.tripCost())).toBe(true);
    G.s.scrap = 1e6;
    G.s.blueprint = 1e4;
    expect(O3.upgradeAstralKit()).toBe(true);
    expect(O3.upgradeAstralKit()).toBe(true);
    expect(O3.astralKitLevel()).toBe(3);
    expect(O3.tripCost()).toBe(5);
    expect(O3.tankCap()).toBe(O3.TANK.velas);
    // the Escudo de Cometa reaches the sim (kit level 2+)
    expect(buildStoryBattle('ruptura_estrella', () => undefined).rules?.fases?.shield).toEqual([1, 0]);
    // the two upgrades cost 20 + 40 of it
    expect(O3.fuel()).toBe(O3.TANK.base + 10 - 10 - 20 - 40);
    O3.addFuel(25);
    // reload: it persists (normalized)
    const f = O3.fuel();
    expect(f).toBe(25);
    G.save();
    G.load();
    expect(O3.fuel()).toBe(f);
    expect(O3.astralKitLevel()).toBe(3);
    // ETERNO: a soft resource — ×2 on a win, 0 on a loss; cats and forms never
    const cats = G.s.cats.length;
    const e1 = startEterno('slot');
    lockEterno(e1.id, 'chips');
    resolveEterno(e1.id, 0.1);
    expect(O3.fuel()).toBe(f * 2);
    const e2 = startEterno('slot');
    lockEterno(e2.id, 'chips');
    const lost = resolveEterno(e2.id, 0.9)!;
    expect(lost.record.extra?.fuel).toBe(f * 2);
    expect(O3.fuel()).toBe(0);
    expect(G.s.cats.length).toBeGreaterThanOrEqual(cats);
    expect(O3.astralKitLevel()).toBe(3);
  });

  it('the Kit Astral needs an aerobarco, costs for another ship, and a save without any aerobarco never deadlocks', () => {
    const env = oleada2Closed();
    delete env.state.ext.flightKit;
    loadEnv(env);
    step('H50', () => G.count('feature_region_cometa'));
    // no aerobarco at all: the gift installs Hélice's kit too, then the astral one
    expect(O3.hasAstralKit()).toBe(true);
    const other = G.s.ship.owned.find((s) => s !== G.s.ship.active);
    if (other) {
      expect(O3.canInstallAstral(other)).toMatchObject({ ok: false });
      expect(O3.canInstallAstral(other).why).toMatch(/Kit de Vuelo/);
    }
  });

  it('Canelo Astral fights with BOLA DE PELO DE HORIZONTE: the hairballs come out of a rift above the aim', () => {
    const b = makeBattle(spec(['c_canelo'], ['c_canelo']), 7);
    const me = b.sides[0].cats[0];
    me.def.ultKey = 'canelo_astral';
    me.ultCharge = 1;
    const angle = -0.6;
    const aimed = b.buildPaths(me.def.ultimate!, b.muzzle(0, me.def.uid), angle, 900, b.wind, 0)[0];
    const r = b.fire(0, me.def.uid, angle, 900, true);
    expect(r.paths.length).toBeGreaterThan(0);
    for (const p of r.paths) {
      expect(p.jumps?.[0]).toBe(2);
      // after the jump it starts high above the aimed landing x and falls
      expect(p.points[2].y).toBeLessThan(p.points[p.points.length - 1].y);
    }
    const land = aimed.points[aimed.points.length - 1];
    expect(Math.abs(r.paths[Math.floor(r.paths.length / 2)].points[2].x - Math.max(-200, Math.min(2120, land.x)))).toBeLessThan(160);
    expect(me.ultUsed).toBe(1);
  });
});
