/**
 * Parte III · LA RONDA y EL DESVÍO «TRASTIENDA» (docs/part-iii/mecanicas-v2/03-plan-implementacion.md §2.6,
 * 05-mapa-y-dimensiones.md §4) on the node schema, with the two sim knobs (battle/ronda.ts):
 *
 *   · turnLimit «LA ÚLTIMA Y NOS VAMOS» and intact «SIN DERRAMAR» are sim rules: deterministic, the estimate plays them
 *     (same spec + seed = same fight) and a battle without them is identical to before
 *   · La Ronda: 4 locales, a seeded condition each (two of each), the same on reload, another mix the next round;
 *     finishing the first round reveals the detour (flag), never by clock
 *   · the detour: d1 → d2 → d3 off B-3, hidden until La Ronda, its own wins and huellas, nothing marked on the route
 *   · migration: the new state is additive (acts / nodes): a v1 slice reads the same; a save mid-Ronda reloads the same
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
const GT = await import('../src/state/sys/gateras');
const GB = await import('../src/state/sys/gaterasBattles');
const { makeBattle, autoBattle } = await import('../src/battle/autoplay');
const { DIFFICULTY } = await import('../src/battle/ai');
const { BLUEPRINTS } = await import('../src/battle/blueprints');
const { battleCatFrom } = await import('../src/battle/catShots');
const { ROLE_BY_ID, catDef } = await import('../src/data/content');
const RONDA = await import('../src/battle/ronda');
type BattleSpec = import('../src/scenes/BattleScene').BattleSpec;
type StageRules = import('../src/battle/sim').StageRules;

function load(f = 'h65-normal') {
  mem.clear();
  mem.set(SAVE_KEY, readFileSync(new URL(`../test-saves/${f}.json`, import.meta.url), 'utf8'));
  G.load();
  expect(G.loaded).toBe(true);
}
function reload() {
  G.save();
  G.load();
}
const B = 'p3d_borracha' as const;
const won = { won: true, reason: 'sunk', turns: 3, modulesDestroyed: 2, damageDealt: 100, catsLost: 0, perfect: false } as never;

function cat(uid: string, species: string) {
  return battleCatFrom({ uid, species, name: species, level: 10, stars: 1, dmgMul: 1, hpMul: 1 }, ROLE_BY_ID.get(catDef(species).role)!.hp);
}
function spec(rules: StageRules | undefined, hpMul = 3): BattleSpec {
  return {
    player: { blueprint: BLUEPRINTS.sparrow, hpMul, cats: [cat('p0', 'c_canelo'), cat('p1', 'c_gelatino')], cannonAtk: 30 },
    enemy: { blueprint: BLUEPRINTS.sparrow, hpMul, cats: [cat('e0', 'c_brote'), cat('e1', 'c_musgo')], cannonAtk: 30 },
    playerName: 'Tú',
    enemyName: 'El bar',
    difficulty: 'normal',
    rules,
    onEnd: () => undefined,
  };
}

describe('the two sim knobs (battle/ronda.ts)', () => {
  it('«la última y nos vamos»: no winner by the end of round N → the player loses (reason condicion)', () => {
    const r = autoBattle(spec({ turnLimit: { side: 0, turns: 2 } }, 30), DIFFICULTY.normal, 11, 30);
    expect(r.won).toBe(false);
    expect(r.turns).toBeLessThanOrEqual(3);
    const free = autoBattle(spec(undefined, 30), DIFFICULTY.normal, 11, 30);
    expect(free.turns).toBeGreaterThan(3);
  });

  it('«sin derramar»: losing more than `allow` modules ends it (reason condicion); a fresh battle never starts lost', () => {
    const b = makeBattle(spec({ intact: { side: 0 } }), 5);
    b.startTurn(0);
    expect(b.winner).toBeNull();
    // break one of the player's modules by hand: the next check ends the battle
    const m = b.sides[0].ship.modules.find((x) => x.kind !== 'core')!;
    m.alive = false;
    b.checkVictory();
    expect(b.winner).toBe(1);
    expect(b.reason).toBe('condicion');
    const c = makeBattle(spec({ intact: { side: 0, allow: 1 } }), 5);
    c.sides[0].ship.modules.find((x) => x.kind !== 'core')!.alive = false;
    c.checkVictory();
    expect(c.winner).toBeNull();
  });

  it('deterministic, and a battle without the knobs is the same as before (bit for bit)', () => {
    const a = autoBattle(spec({ intact: { side: 0, allow: 1 } }), DIFFICULTY.normal, 77, 30);
    expect(autoBattle(spec({ intact: { side: 0, allow: 1 } }), DIFFICULTY.normal, 77, 30)).toEqual(a);
    expect(autoBattle(spec(undefined), DIFFICULTY.normal, 78, 30)).toEqual(autoBattle(spec({}), DIFFICULTY.normal, 78, 30));
  });

  it('chips and lines say only what the sim plays', () => {
    expect(RONDA.rondaLines({ intact: { side: 0, allow: 1 } })[0]).toMatch(/más de un módulo/);
    expect(RONDA.rondaLines({ turnLimit: { side: 0, turns: 3 } })[0]).toMatch(/antes del turno 4/);
    expect(RONDA.rondaChips({ turnLimit: { side: 0, turns: 4 } }, 4)[0].hot).toBe(true);
    expect(RONDA.rondaChips(undefined, 1)).toEqual([]);
  });
});

describe('La Ronda on the node schema', () => {
  it('opens after B-5; 4 locales, a seeded condition each (two of each); the same on reload', () => {
    load();
    GT.openGatera(B);
    expect(GT.nodeState(B, 'a1')).toBe('locked');
    for (let n = 1; n <= 5; n++) GT.recordWin(B, n);
    expect(GT.nodeState(B, 'a1')).toBe('open');
    const c = GT.rondaConditions(B);
    expect(Object.keys(c)).toEqual(['r1', 'r2', 'r3', 'r4']);
    expect(Object.values(c).filter((x) => x === 'sinDerramar')).toHaveLength(2);
    expect(Object.values(c).filter((x) => x === 'ultimaYNosVamos')).toHaveLength(2);
    reload();
    expect(GT.rondaConditions(B)).toEqual(c);
    // reading the Ronda creates nothing
    expect(G.s.ext!.gateras.acts).toBeUndefined();
  });

  it('a locale battle: its base stage, lighter, no bottles, this round’s condition in the rules (the estimate plays it)', () => {
    load();
    GT.openGatera(B);
    const c = GT.rondaConditions(B);
    const def = GB.gateraBattleDef(B, 'r1')!;
    expect(def.name).toBe('La Última Ronda');
    expect(def.mareo?.botellas).toBeUndefined();
    expect(def.band).toBeUndefined();
    const s = GB.buildGateraBattle(B, 'r1', () => undefined);
    expect(s.meta?.special).toBe('p3d_borracha_r1');
    if (c.r1 === 'sinDerramar') expect(s.rules?.intact).toEqual({ side: 0, allow: 1 });
    else expect(s.rules?.turnLimit).toEqual({ side: 0, turns: 4 });
    expect(s.intro?.lines.join(' ')).toMatch(c.r1 === 'sinDerramar' ? /SIN DERRAMAR/ : /LA ÚLTIMA Y NOS VAMOS/);
    const a = autoBattle(s, DIFFICULTY.normal, 501, 30);
    expect(autoBattle(GB.buildGateraBattle(B, 'r1', () => undefined), DIFFICULTY.normal, 501, 30)).toEqual(a);
  }, 60_000);

  it('the 4 locales won → the round closes, a new mix, and the detour appears (flag); no huellas from the activity', () => {
    load();
    GT.openGatera(B);
    for (let n = 1; n <= 5; n++) GT.recordWin(B, n);
    const h0 = GT.huellas();
    const mix0 = GT.rondaConditions(B);
    expect(GT.nodeState(B, 'd1')).toBe('hidden');
    for (const id of ['r1', 'r2', 'r3']) {
      expect(GT.nextRondaLocale(B)).toBe(id);
      const loot = GB.applyGateraResult(B, id, won);
      expect(loot.huellas).toBe(0);
      expect(loot.ronda?.roundDone).toBe(false);
    }
    expect(GB.victoryStampOpts(B, 'r3', { won: true, first: true, gold: 1, scrap: 1, huellas: 0, opened: null, ronda: { done: 3, of: 4, roundDone: false, revealed: false } }).news).toEqual(['LA RONDA: 3 DE 4']);
    // a reload mid-Ronda keeps the round
    reload();
    expect(GT.rondaProgress(B).done).toEqual(['r1', 'r2', 'r3']);
    const last = GB.applyGateraResult(B, 'r4', won);
    expect(last.ronda).toEqual({ done: 4, of: 4, roundDone: true, revealed: true });
    // GATOS-DATOS: each locale pays orbs of Doña Espuma, and the first full round brings her (state/sys/p3cats.ts)
    expect(GB.victoryStampOpts(B, 'r4', last).news).toEqual(['¡DOÑA ESPUMA SE UNE!', 'LA RONDA COMPLETA', '¡DESVÍO REVELADO!', '+5 ORBES DE DOÑA ESPUMA']);
    expect(G.s.orbs.e_espuma).toBe(20);
    expect(G.s.cats.some((c) => c.species === 'e_espuma')).toBe(true);
    expect(G.has('ronda_borracha_1')).toBe(true);
    expect(GT.rondaProgress(B).round).toBe(1);
    expect(GT.rondaProgress(B).done).toEqual([]);
    expect(GT.huellas()).toBe(h0);
    expect(GT.nodeState(B, 'd1')).toBe('open');
    // the next round: the same seed, another round → (usually) another mix; always two of each
    const mix1 = GT.rondaConditions(B);
    expect(Object.values(mix1).filter((x) => x === 'sinDerramar')).toHaveLength(2);
    void mix0;
  });

  it('the mix changes from round to round (over a few rounds, more than one combination)', () => {
    load();
    GT.openGatera(B);
    const seen = new Set<string>();
    for (let round = 0; round < 6; round++) {
      seen.add(JSON.stringify(GT.rondaConditions(B)));
      for (const id of ['r1', 'r2', 'r3', 'r4']) GT.recordRondaWin(B, id);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('…for every save: the seed comes from the opening time, and no seed deals the same mix forever (300 seeds)', () => {
    load();
    GT.openGatera(B);
    const g = (G.s as unknown as { ext: { gateras: { open: Record<string, number>; acts?: Record<string, unknown> } } }).ext.gateras;
    let constant = 0;
    for (let k = 0; k < 300; k++) {
      g.open[B] = 1_793_000_000_000 + k * 7_919_003;
      delete g.acts;
      const seen = new Set<string>();
      for (let round = 0; round < 6; round++) {
        seen.add(JSON.stringify(GT.rondaConditions(B)));
        for (const id of ['r1', 'r2', 'r3', 'r4']) GT.recordRondaWin(B, id);
      }
      if (seen.size === 1) constant++;
    }
    // the old hash (no final avalanche) froze the mix for ~12 % of the seeds
    expect(constant).toBeLessThanOrEqual(1);
  });
});

describe('the detour «Trastienda»', () => {
  it('hidden until La Ronda; then d1 (off B-3) → d2 → d3, each with its own condition and 3 huellas; the route untouched', () => {
    load();
    GT.openGatera(B);
    for (let n = 1; n <= 3; n++) GT.recordWin(B, n);
    expect(GT.nodeState(B, 'd1')).toBe('hidden');
    G.flag('ronda_borracha_1');
    expect(GT.nodeState(B, 'd1')).toBe('open');
    expect(GT.nodeState(B, 'd2')).toBe('locked');
    const s1 = GB.buildGateraBattle(B, 'd1', () => undefined);
    expect(s1.rules?.turnLimit).toEqual({ side: 0, turns: 3 });
    expect(s1.intro?.tag).toBe('LA BORRACHA · DESVÍO 1');
    expect(GB.buildGateraBattle(B, 'd2', () => undefined).rules?.intact).toEqual({ side: 0, allow: 1 });
    expect(GB.gateraLootPreview(B, 'd1').huellas).toBe(3);
    const l1 = GB.applyGateraResult(B, 'd1', won);
    expect(l1).toMatchObject({ first: true, huellas: 3, openedNode: 'd2' });
    expect(G.has('won_p3d_borracha_d1')).toBe(true);
    expect(GT.clearedIn(B)).toBe(3);
    expect(GT.nodeState(B, 'd2')).toBe('open');
    expect(GB.gateraLootPreview(B, 'd1').huellas).toBe(0);
    // d3: the rescue is said on the card, granted when its painting exists (no cat is invented)
    expect(GB.gateraBattleDef(B, 'd3')!.reward).toBe('rescate_don_bombin');
    const cats0 = G.s.cats.length;
    GB.applyGateraResult(B, 'd2', won);
    GB.applyGateraResult(B, 'd3', won);
    expect(G.s.cats.length).toBe(cats0);
    reload();
    expect(G.s.ext!.gateras.nodes[B]).toEqual({ d1: 1, d2: 1, d3: 1 });
    expect(GT.nodeState(B, 'd3')).toBe('cleared');
    // huellas: 3 per detour on top of the route's (detours are margin: the max stays 34)
    expect(GT.huellasMax(B)).toBe(34);
  });

  it('a v1 slice (no acts, no nodes) reads the same and plays the Ronda from round 0', () => {
    const v1 = { v: 1, open: { [B]: 1_760_000_000_000 }, huellas: 15, stages: { [B]: { cleared: 5, wins: { '1': 1, '2': 1, '3': 1, '4': 1, '5': 1 } } }, seen: ['carta_intro'] };
    const env = JSON.parse(readFileSync(new URL('../test-saves/h65-normal.json', import.meta.url), 'utf8'));
    env.state.ext = { ...(env.state.ext ?? {}), gateras: JSON.parse(JSON.stringify(v1)) };
    mem.clear();
    mem.set(SAVE_KEY, JSON.stringify(env));
    G.load();
    expect(G.s.ext!.gateras).toEqual(v1);
    expect(GT.rondaProgress(B)).toMatchObject({ round: 0, done: [] });
    expect(GT.nodeState(B, 'a1')).toBe('open');
    expect(GT.nodeState(B, 'd1')).toBe('hidden');
  });
});
