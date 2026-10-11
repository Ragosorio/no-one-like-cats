/**
 * Parte II · Oleada 2 «El Cielo Despierta» (docs/part-ii/22-oleada-2.md): H42–H49 in data/rupturas/historia-o2.json,
 * their hooks in ui/story/rupturasScriptO2.ts, the sky battles + Kit de Vuelo + the H48 choice in
 * state/sys/rupturasO2.ts, the GRAVEDAD element (battle/gravedad.ts) and the sky layer (battle/cielo.ts) — all of it
 * deterministic in the sim the battle screen and the estimate worker share.
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
const { checkMissions, evalGoal } = await import('../src/state/sys/missions');
const { BEAT_BY_ID, CAT_BY_ID, CONTENT, ELEMENT_BY_ID, MISSIONS, MISSION_BY_ID, ROLE_BY_ID, affinityMult, catDef } = await import('../src/data/content');
const { goalSupported } = await import('../src/state/sys/missionGoals');
const { STORY_BATTLES, applyStoryResult, buildStoryBattle } = await import('../src/state/sys/storyBattles');
const O2 = await import('../src/state/sys/rupturasO2');
const S = await import('../src/ui/story/rupturasScriptO2');
const { REGION_INFO } = await import('../src/regions');
const { speaker } = await import('../src/ui/story/text');
const { autoBattle, makeBattle } = await import('../src/battle/autoplay');
const { DIFFICULTY } = await import('../src/battle/ai');
const { BLUEPRINTS } = await import('../src/battle/blueprints');
const { battleCatFrom, shotFromSpec } = await import('../src/battle/catShots');
const { AL_AGUA, AL_VACIO, GR_TUNE, grBeginFire, grFeats, grPozo } = await import('../src/battle/gravedad');
const { SKY_G, skyFlight, skyState } = await import('../src/battle/cielo');
const { RESET_PATCH_ID } = await import('../src/state/sys/rupturasReset');
import type { Battle, BattleEvent } from '../src/battle/sim';
import type { BattleResult, BattleSpec } from '../src/scenes/BattleScene';

const IDS = ['H42', 'H43', 'H44', 'H45', 'H46', 'H47', 'H48', 'H49'];
const O1 = ['H31', 'H32', 'H33', 'H34', 'H35', 'H36', 'H37', 'H38', 'H39', 'H40', 'H41'];
const WIN: BattleResult = { won: true, reason: 'sunk', turns: 6, modulesDestroyed: 4, damageDealt: 1000, catsLost: 0, perfect: false, enemyHullLost: 0.8 };
const SPECIES: [id: string, rarity: string, elements: string[], role: string, slug: string][] = [
  ['c_plomito', 'common', ['gravity'], 'artillero', 'plomito_plumb_cat'],
  ['c_globito', 'common', ['gravity'], 'soporte', 'globito_balloon_cat'],
  ['r_contrapeso', 'rare', ['gravity', 'earth'], 'tanque', 'contrapeso_counterweight_cat'],
  ['r_helice', 'rare', ['gravity', 'storm'], 'soporte', 'helice_propeller_cat'],
  ['r_ronron', 'rare', ['gravity', 'light'], 'controlador', 'ronron_purr_cat'],
  ['e_cascada', 'epic', ['gravity', 'water'], 'francotirador', 'cascada_upfall_cat'],
  ['l_masamadre', 'legendary', ['gravity'], 'invocador', 'masamadre_mass_cat'],
  ['s_manzanita', 'epic', ['gravity', 'nature'], 'asediador', 'manzanita_apple_cat'],
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
/** post-finale with Oleada 1 already closed (H31–H41 done; the narrative reset counts as applied) */
function oleada1Closed() {
  const env = fixture('post-finale');
  env.state.missions.done.push(...O1);
  env.state.flags.oleada1_fin = true;
  env.state.patches = [...(env.state.patches ?? []), RESET_PATCH_ID];
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

// ------------------------------------------------------------------ data
describe('Oleada 2 — data', () => {
  it('H42–H49: one historia chain right after H41', () => {
    let prev = 'H41';
    for (const id of IDS) {
      const m = MISSION_BY_ID.get(id)!;
      expect(m, id).toBeTruthy();
      expect(m.chain).toBe('historia');
      expect(m.trigger).toBe(`mission:${prev}`);
      expect(m.goal.text.length).toBeGreaterThan(20);
      expect(m.line && m.why, id).toBeTruthy();
      prev = id;
    }
    expect(MISSION_BY_ID.get('H42')!.goal).toMatchObject({ type: 'use_feature', feature: 'region_invertidas' });
    expect(MISSION_BY_ID.get('H43')!.goal).toMatchObject({ type: 'use_feature', feature: 'kit_vuelo' });
    expect(MISSION_BY_ID.get('H45')!.goal).toMatchObject({ type: 'use_feature', feature: 'region_corona' });
    expect(MISSION_BY_ID.get('H48')!.goal).toMatchObject({ type: 'use_feature', feature: 'linterna' });
    expect(MISSION_BY_ID.get('H49')!.unlocks).toContain('oleada2_fin');
    expect(MISSIONS.filter((m) => !goalSupported(m.goal.type)).map((m) => m.id)).toEqual([]);
  });

  it('the four sky battles: registered, on their islands, crews and rewards exist', () => {
    const BATTLE_OF: Record<string, string> = { cielo_invertidas: 'H44', cielo_embajada: 'H46', cielo_almirante: 'H47', cielo_masamadre: 'H49' };
    expect(O2.O2_BATTLES).toEqual(Object.keys(BATTLE_OF));
    for (const [b, m] of Object.entries(BATTLE_OF)) {
      const def = STORY_BATTLES[b];
      expect(def.mission).toBe(m);
      expect(MISSION_BY_ID.get(m)!.goal).toMatchObject({ type: 'win_battle', battle: b });
      expect(def.rules?.sky, b).toBeTruthy();
      expect(def.powerMul).toBeGreaterThan(1);
      expect(def.powerMul).toBeLessThan(1.5);
      for (const sp of def.enemyCats) expect(CAT_BY_ID.has(sp), `${b}: ${sp}`).toBe(true);
      if (def.reward.cat) expect(CAT_BY_ID.has(def.reward.cat)).toBe(true);
      expect([...REGION_INFO.invertidas.battles, ...REGION_INFO.corona.battles]).toContain(b);
    }
    expect(STORY_BATTLES.cielo_invertidas.reward).toEqual({ element: 'gravity', cat: 'c_plomito', crystals: 20 });
    expect(STORY_BATTLES.cielo_masamadre.reward.cat).toBe('l_masamadre');
    expect(STORY_BATTLES.cielo_embajada).toMatchObject({ grade: 'damage', passPct: 30, damageFragments: false });
  });

  it('GRAVEDAD and its 8 species, exactly as the contract says', () => {
    const el = ELEMENT_BY_ID.get('gravity')!;
    expect(el.name).toBe('Gravedad');
    expect(el.verb).toBe('Mover');
    expect(el.unlock).toMatch(/^chapter/);
    expect(el.palette).toHaveLength(4);
    for (const [id, rarity, elements, role, slug] of SPECIES) {
      const c = CAT_BY_ID.get(id)!;
      expect(c, id).toBeTruthy();
      expect([c.rarity, c.elements, c.role, c.art.slug], id).toEqual([rarity, elements, role, slug]);
      expect(ROLE_BY_ID.has(c.role)).toBe(true);
      expect(c.combat.shot.element).toBe('gravity');
      expect(c.combat.shot.status).toBe('flotando');
      expect(c.lore.length).toBeGreaterThan(40);
    }
    expect(catDef('l_masamadre').primordial).toBe(true);
    expect(catDef('l_masamadre').obtain.source).toBe('ruptura:H49');
    expect(catDef('s_manzanita').secret).toBe(true);
    // every shot builds: Flotando on impact, +1 turn at Nv20
    const s1 = shotFromSpec(catDef('c_plomito').combat.shot, 1);
    const s20 = shotFromSpec(catDef('c_plomito').combat.shot, 20);
    expect(s1.statuses?.find((x) => x.id === 'grav')?.turns).toBe(2);
    expect(s20.statuses?.find((x) => x.id === 'grav')?.turns).toBe(3);
    // Cascada's jet falls UP
    expect(shotFromSpec(catDef('e_cascada').combat.shot, 1).gravityScale).toBeLessThan(0);
  });

  it('affinity: strong vs Cristal and Tormenta, weak vs Vacío and Tiempo (and the ×0.75 way back)', () => {
    expect(affinityMult('gravity', 'crystal')).toBe(1.5);
    expect(affinityMult('gravity', 'storm')).toBe(1.5);
    expect(affinityMult('void', 'gravity')).toBe(1.5);
    expect(affinityMult('time', 'gravity')).toBe(1.5);
    expect(affinityMult('crystal', 'gravity')).toBe(0.75);
    expect(affinityMult('storm', 'gravity')).toBe(0.75);
    expect(affinityMult('gravity', 'void')).toBe(0.75);
    expect(affinityMult('gravity', 'time')).toBe(0.75);
    for (const m of CONTENT.materials) expect(m.mult.gravity, m.id).toBeGreaterThan(0);
  });

  it('beats: every part ≤4 lines, every line played once, speakers known, a $scene note each', () => {
    const tables = [S.O2_ON_NEW, S.O2_ON_DONE];
    const used = new Map<string, number[]>();
    for (const t of tables)
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
    for (const [beat, lines] of used) {
      const b = BEAT_BY_ID.get(beat)!;
      expect([...lines].sort((a, z) => a - z), beat).toEqual(b.lines.map((_, i) => i));
      expect(String((b as unknown as Record<string, unknown>)['$scene'] ?? '').length, `${beat} $scene`).toBeGreaterThan(40);
      for (const [sp] of b.lines) {
        const k = speaker(sp);
        // an unknown speaker falls back to Canelo's portrait as a generic ally: every O2 voice must be registered
        expect(k.kind === 'cat' && k.slug === 'canelo_cozy_cat' && k.name === sp.toUpperCase(), `${beat}: ${sp}`).toBe(false);
      }
    }
    expect(Object.keys(S.O2_ON_NEW).sort()).toEqual([...IDS].sort());
    expect(S.O2_COVERED.sort()).toEqual([...IDS].sort());
  });

  it('a mission ON_NEW always waits longer than the ON_DONE parts of the mission before it', () => {
    let prevMax = 2.5; // H41's ending parts (rupturasScript)
    for (const id of IDS) {
      for (const r of S.O2_ON_NEW[id] ?? []) expect(r.delay ?? 0, id).toBeGreaterThan(prevMax);
      prevMax = Math.max(0, ...(S.O2_ON_DONE[id] ?? []).map((r) => r.delay ?? 0));
    }
  });
});

// ------------------------------------------------------------------ the rules in the sim
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
/** side's shot lands exactly on p (a fresh shot; `uid` = the cat that fired it, null = a cannon) */
function land(b: Battle, side: 0 | 1, uid: string | null, p: { x: number; y: number }, atk?: number) {
  const ev: BattleEvent[] = [];
  const cat = uid ? b.sides[side].cats.find((c) => c.def.uid === uid)! : null;
  const shooter = cat ?? b.sides[side].cats[0];
  grBeginFire(b);
  b.curShooter = cat;
  b.resolveImpact(side, shooter.def.shot, atk ?? shooter.def.atk, p.x, p.y, ev, 0, 0, true);
  b.curShooter = null;
  return ev;
}
/** break the enemy mast down to `life` of its cells' hp, optionally floating */
function breakMast(b: Battle, life: number, floating: boolean) {
  const ship = b.sides[1].ship;
  const mast = ship.modules.find((m) => m.kind === 'mast')!;
  for (const c of ship.moduleCells(mast.id)) {
    c.hp = Math.max(1, Math.round(c.maxHp * life));
    if (floating) c.status.grav = 2;
  }
  const cells = ship.moduleCells(mast.id);
  return { mast, p: b.cellCenter(1, cells[1].x, cells[1].y) };
}
const reactions = (ev: BattleEvent[]) => ev.filter((e) => e.k === 'reaction').map((e) => (e as { name: string }).name);

describe('GRAVEDAD in battle (battle/gravedad.ts)', () => {
  it('a Gravedad hit leaves FLOTANDO on the cells it touches', () => {
    const b = makeBattle(spec(['c_plomito'], ['c_canelo']), 7);
    const c = b.sides[1].ship.get(4, 8)!;
    land(b, 0, 'p0', b.cellCenter(1, c.x, c.y), 1);
    expect(c.status.grav).toBe(2);
  });

  it('¡AL AGUA!: a floating module ≤40% falls off the ship at the next foe hit; a sturdier or non-floating one stays', () => {
    let b = makeBattle(spec(['c_canelo'], ['c_canelo']), 7);
    let { mast, p } = breakMast(b, 0.3, true);
    let ev = land(b, 0, null, p, 1);
    expect(reactions(ev)).toContain(AL_AGUA);
    expect(mast.alive).toBe(false);
    expect(b.sides[1].ship.moduleCells(mast.id)).toHaveLength(0);
    // 50% floating at sea: stays
    b = makeBattle(spec(['c_canelo'], ['c_canelo']), 7);
    ({ mast, p } = breakMast(b, 0.5, true));
    ev = land(b, 0, null, p, 1);
    expect(reactions(ev)).not.toContain(AL_AGUA);
    expect(mast.alive).toBe(true);
    // 20% NOT floating at sea: stays (only Gravedad shoves things off at sea)
    b = makeBattle(spec(['c_canelo'], ['c_canelo']), 7);
    ({ mast, p } = breakMast(b, 0.2, false));
    land(b, 0, null, p, 1);
    expect(mast.alive).toBe(true);
  });

  it('in the sky: floating ≤60% and ANY module ≤25% fall into the void — unless that side has the Ancla de Nube', () => {
    const sky = (kit: [number, number]) => spec(['c_canelo'], ['c_canelo'], { sky: { kit, islets: 0 } });
    let b = makeBattle(sky([1, 1]), 7);
    let { mast, p } = breakMast(b, 0.5, true);
    expect(reactions(land(b, 0, null, p, 1))).toContain(AL_VACIO);
    expect(mast.alive).toBe(false);
    b = makeBattle(sky([1, 1]), 7);
    ({ mast, p } = breakMast(b, 0.2, false));
    expect(reactions(land(b, 0, null, p, 1))).toContain(AL_VACIO);
    // Ancla de Nube (kit 3) on the enemy: sea rules — 50% floating stays, 20% not floating stays
    b = makeBattle(sky([1, 3]), 7);
    ({ mast, p } = breakMast(b, 0.5, true));
    land(b, 0, null, p, 1);
    expect(mast.alive).toBe(true);
    b = makeBattle(sky([1, 3]), 7);
    ({ mast, p } = breakMast(b, 0.2, false));
    land(b, 0, null, p, 1);
    expect(mast.alive).toBe(true);
  });

  it('POZO: a Gravedad cat shot that lands opens a well that bends only ITS side\'s projectiles', () => {
    const b = makeBattle(spec(['c_plomito'], ['c_canelo']), 7);
    const c = b.sides[1].ship.get(5, 6)!;
    const at = b.cellCenter(1, c.x, c.y);
    expect(grPozo(b, 0)).toBeNull();
    land(b, 0, 'p0', at, 1);
    const w = grPozo(b, 0)!;
    expect(w).toBeTruthy();
    expect([w.x, w.y, w.r, w.k, w.affects, w.turns]).toEqual([at.x, at.y, GR_TUNE.wellR, GR_TUNE.wellK, 0, GR_TUNE.wellTurns]);
    // a cannon (no cat) never opens one; a second cat shot moves it (one per side)
    land(b, 0, 'p0', { x: at.x - 40, y: at.y }, 1);
    expect(b.wells.filter((k) => k.affects === 0)).toHaveLength(1);
    expect(grPozo(b, 0)!.x).toBe(at.x - 40);
    expect(grFeats(b).gr_pozo).toBe(2);
  });

  it('deterministic: the same seed replays the same Gravedad battle in the sky (screen = estimate), and the rules happen', () => {
    const s = spec(['l_masamadre', 'c_plomito', 'e_cascada'], ['r_contrapeso', 'r_helice', 'c_globito'], { sky: { kit: [1, 2] } });
    const play = () => {
      const log: string[] = [];
      let last: Battle | null = null;
      const res = autoBattle(s, DIFFICULTY.normal, 4242, 30, (b, side, shot) => {
        last = b;
        log.push(`${b.turn}|${side}|${shot}|${b.sides[0].ship.cells().reduce((a, c) => a + c.hp, 0)}|${b.sides[1].ship.cells().reduce((a, c) => a + c.hp, 0)}`);
      });
      return { res, log, feats: last ? grFeats(last) : {}, sky: last ? skyState(last) : null };
    };
    const a = play();
    const b = play();
    expect(b.res).toEqual(a.res);
    expect(b.log).toEqual(a.log);
    expect(a.log.length).toBeGreaterThan(4);
    expect(a.feats.gr_pozo ?? 0).toBeGreaterThan(0);
    expect(a.sky).toBeTruthy();
  });
});

describe('the sky (battle/cielo.ts)', () => {
  it('gravity ×0.7, layered wind (the kit\'s stabilizers soften it), islets between the ships', () => {
    const b = makeBattle(spec(['c_canelo'], ['c_canelo'], { sky: { kit: [2, 1] } }), 7);
    expect(b.field.gMul).toBe(SKY_G);
    const hi = b.waterY - 600;
    const mid = b.waterY - 400;
    const lo = b.waterY - 100;
    const mine = skyFlight(b, 0, 'ballistic')!;
    const theirs = skyFlight(b, 1, 'ballistic')!;
    expect([theirs.windAt(hi), theirs.windAt(mid), theirs.windAt(lo)]).toEqual([1.6, 1, -0.5]);
    expect(mine.windAt(hi)).toBeCloseTo(1.42);
    expect(mine.windAt(lo)).toBeCloseTo(-0.05);
    const st = skyState(b)!;
    expect(st.islets).toHaveLength(2);
    const left = b.sides[0].setup.origin.x + b.sides[0].ship.cols * 40;
    for (const i of st.islets) expect(i.x > left && i.x < b.sides[1].setup.origin.x).toBe(true);
    // the wave and the phase go through islets
    expect(skyFlight(b, 0, 'wave')!.islet(st.islets[0].x, st.islets[0].y)).toBe(false);
    expect(skyFlight(b, 0, 'ballistic')!.islet(st.islets[0].x, st.islets[0].y)).toBe(true);
  });

  it('an islet stops a shot and takes the hit (nothing else does); enough hits and it falls', () => {
    const b = makeBattle(spec(['c_canelo'], ['c_canelo'], { sky: { kit: [1, 1] } }), 7);
    const isl = skyState(b)!.islets[0];
    const beam = { ...b.sides[0].cats[0].def.shot, trajectory: 'beam' as const, gravityScale: 0 };
    const hull1 = b.sides[1].ship.cells().reduce((a, c) => a + c.hp, 0);
    let fell = false;
    for (let k = 0; k < 40 && !fell; k++) {
      const paths = b.buildPaths(beam, { x: isl.x - 220, y: isl.y }, 0, 1400, 0, 0);
      const end = paths[0].points[paths[0].points.length - 1];
      expect(Math.abs(end.x - isl.x)).toBeLessThan(isl.r + 12);
      const ev: BattleEvent[] = [];
      b.resolvePaths(0, beam, 200, paths, ev);
      fell = !skyState(b)!.islets[0].alive;
    }
    expect(fell).toBe(true);
    expect(b.sides[1].ship.cells().reduce((a, c) => a + c.hp, 0)).toBe(hull1);
    expect(skyState(b)!.isletHits).toBeGreaterThan(1);
  });

  it('story twists: CORRECCIÓN heals, ABAJO ES ARRIBA from its turn, the mass bends every shot', () => {
    let b = makeBattle(spec(['c_canelo'], ['c_canelo'], { sky: { correct: { side: 1, cells: 2, frac: 0.4 } } }), 7);
    const c = b.sides[1].ship.get(4, 8)!;
    c.hp = Math.round(c.maxHp * 0.2);
    b.startTurn(1);
    expect(c.hp).toBeGreaterThan(Math.round(c.maxHp * 0.2));
    b = makeBattle(spec(['c_canelo'], ['c_canelo'], { sky: { invert: { turn: 2, side: 0 } } }), 7);
    b.startTurn(0);
    expect(b.field.anti).toBeNull();
    b.turn = 2;
    b.startTurn(0);
    expect(b.field.anti).toBeTruthy();
    expect(b.field.anti!.x0).toBeLessThan(b.sides[0].setup.origin.x);
    b = makeBattle(spec(['c_canelo'], ['c_canelo'], { sky: { mass: { r: 520, k: 650 } } }), 7);
    const mass = b.wells.find((w) => w.turns === Infinity && w.affects === undefined);
    expect(mass).toBeTruthy();
  });

  it('every sky battle builds and plays headless with a post-finale crew (the story never walls)', () => {
    loadEnv(oleada1Closed());
    for (const id of O2.O2_BATTLES) {
      const sp = buildStoryBattle(id, () => undefined);
      expect(sp.rules?.sky?.kit?.[1]).toBe(O2.ENEMY_KIT);
      const r = autoBattle(sp, DIFFICULTY.normal, 4242, 30);
      expect(r.turns, id).toBeGreaterThan(0);
    }
  });
});

// ------------------------------------------------------------------ saves
describe('Oleada 2 — saves', () => {
  it('Part I saves see nothing of it (no H42, no kit, no sky islands)', () => {
    loadEnv(fixture('late-game'));
    expect(MISSIONS.filter((m) => IDS.includes(m.id) && (active(m.id) || done(m.id)))).toEqual([]);
    expect(O2.flightKitAvailable()).toBe(false);
    expect(G.has('region:invertidas')).toBe(false);
    expect(G.s.ext?.flightKit).toBeUndefined();
  });

  it('a save that closed Oleada 1 gets H42 and the patch note', () => {
    loadEnv(oleada1Closed());
    expect(active('H42')).toBe(true);
    expect(patchNotes.some((n) => /EL CIELO DESPIERTA/.test(n))).toBe(true);
    expect(G.has('region:invertidas')).toBe(true);
  });

  it('the whole wave plays: trombas → kit → sky battles → Corona → embassy → admiral → the choice → Masa Madre', () => {
    loadEnv(oleada1Closed());
    const ship = G.s.ship.active;
    step('H42', () => G.count('feature_region_invertidas'));
    // the kit: offered, free the first time, on YOUR ship
    expect(O2.flightKitAvailable()).toBe(true);
    expect(O2.installCost()).toBeNull();
    expect(O2.hasFlightKit()).toBe(false);
    step('H43', () => {
      const gold = G.s.gold;
      expect(O2.installFlightKit(ship)).toBe(true);
      expect(G.s.gold).toBe(gold);
    });
    expect(O2.hasFlightKit(ship)).toBe(true);
    expect(O2.flightKitLevel()).toBe(1);
    step('H44', () => applyStoryResult('cielo_invertidas', WIN));
    expect(G.s.elements).toContain('gravity');
    expect(G.s.crystals.gravity).toBe(20);
    // H45 appeared: Corona Celeste is on the chart
    expect(G.has('region:corona')).toBe(true);
    step('H45', () => G.count('feature_region_corona'));
    // Hélice joins once (the ledger): a second claim pays nothing
    expect(O2.o2PendingCats()).toEqual(['r_helice']);
    expect(O2.claimO2Cat('r_helice')?.isNew).toBe(true);
    expect(O2.o2PendingCats()).toEqual([]);
    expect(O2.claimO2Cat('r_helice')).toBeNull();
    // the embassy: 20% and it leaves = not yet; 35% before it leaves = passed (no void fragments)
    const frags = G.s.counters.void_fragments ?? 0;
    applyStoryResult('cielo_embajada', { ...WIN, won: true, reason: 'retreat', enemyHullLost: 0.2 });
    checkMissions();
    expect(done('H46')).toBe(false);
    step('H46', () => applyStoryResult('cielo_embajada', { ...WIN, won: true, reason: 'retreat', enemyHullLost: 0.35 }));
    expect(G.s.counters.void_fragments ?? 0).toBe(frags);
    step('H47', () => applyStoryResult('cielo_almirante', WIN));
    expect(G.s.crystals.gravity).toBe(35);
    // the choice
    expect(O2.linternaPending()).toBe(true);
    expect(O2.linternaChoice()).toBeNull();
    step('H48', () => expect(O2.chooseLinterna('apagar')).toBe(true));
    expect(O2.linternaChoice()).toBe('apagar');
    expect(O2.chooseLinterna('encendida')).toBe(false);
    step('H49', () => applyStoryResult('cielo_masamadre', WIN));
    expect(G.has('oleada2_fin')).toBe(true);
    expect(evalGoal(MISSION_BY_ID.get('H49')!)).toMatchObject({ cur: 1, need: 1 });
    // it all survives a reload: the kit on the same ship, the remembered answer
    G.save();
    G.load();
    expect(O2.hasFlightKit(ship)).toBe(true);
    expect(G.s.ship.active).toBe(ship);
    expect(O2.linternaChoice()).toBe('apagar');
  });

  it('Kit de Vuelo: levels, another ship, junk in the save', () => {
    loadEnv(oleada1Closed());
    step('H42', () => G.count('feature_region_invertidas'));
    const [a, b] = G.s.ship.owned;
    expect(O2.installFlightKit(a)).toBe(true);
    // level 2 needs Gravedad crystals
    G.s.crystals.gravity = 0;
    expect(O2.canUpgradeKit()).toMatchObject({ ok: false, why: 'Faltan cristales de Gravedad' });
    G.s.crystals.gravity = 100;
    G.s.scrap = 5000;
    G.s.blueprint = 100;
    expect(O2.upgradeFlightKit()).toBe(true);
    expect(O2.flightKitLevel()).toBe(2);
    expect(G.s.crystals.gravity).toBe(90);
    // another ship costs gold + scrap and keeps the global level
    const cost = O2.installCost()!;
    expect(cost.gold).toBeGreaterThan(0);
    const scrap = G.s.scrap;
    expect(O2.installFlightKit(b)).toBe(true);
    expect(G.s.scrap).toBe(scrap - cost.scrap);
    expect(O2.kitShips()).toEqual([a, b]);
    expect(O2.flightKitLevel()).toBe(2);
    // junk: normalized on load, never crashes, never invents a kit
    expect(O2.normalizeFlightKit('nope')).toBeNull();
    expect(O2.normalizeFlightKit({ level: 9, ships: [a, a, 3, ''] })).toEqual({ level: 3, ships: [a] });
    expect(O2.normalizeFlightKit({ level: 2, ships: [] })).toEqual({ level: 0, ships: [] });
    G.s.ext!.flightKit = { level: 'x', ships: [b, null] };
    G.save();
    G.load();
    expect(G.s.ext!.flightKit).toEqual({ level: 1, ships: [b] });
  });

  it('a replay never deadlocks: a ship that already flies answers H43; the choice can be asked again', () => {
    loadEnv(oleada1Closed());
    (G.s.ext ??= {}).flightKit = { level: 2, ships: [G.s.ship.active] };
    step('H42', () => G.count('feature_region_invertidas'));
    // H43 appeared with a kit already installed: it completes by itself
    checkMissions();
    expect(done('H43')).toBe(true);
    // the choice: a previous answer doesn't block H48 (the newest answer is remembered)
    G.flag('linterna:apagala');
    G.s.missions.active.push('H48');
    G.s.missions.progress['H48:feature_linterna'] = G.s.counters.feature_linterna ?? 0;
    expect(O2.linternaPending()).toBe(true);
    expect(O2.chooseLinterna('encendida')).toBe(true);
    expect(O2.linternaChoice()).toBe('encendida');
    expect(G.has('linterna:apagala')).toBe(false);
  });

  it('a sky battle reads YOUR kit level live (Estabilizadores reach the sim)', () => {
    loadEnv(oleada1Closed());
    (G.s.ext ??= {}).flightKit = { level: 3, ships: [G.s.ship.active] };
    const sp = buildStoryBattle('cielo_invertidas', () => undefined);
    expect(sp.rules?.sky?.kit).toEqual([3, O2.ENEMY_KIT]);
    expect(sp.rules?.sky?.g ?? SKY_G).toBe(SKY_G);
  });
});
