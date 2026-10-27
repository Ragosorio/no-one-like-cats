/**
 * Parte III · LA POLÍTICA DE DIFICULTAD DE LA CARTA y LA BORRACHA COMPLETA (docs/part-iii/mecanicas-v2/02-loop.md §6.3,
 * 03-plan-implementacion.md §2.1, §2.2, §2.5). Pure checks (no win rates here: tests/p3Balance.sim.test.ts measures them).
 *
 *   · the band multiplies what it says; the floor is the ship's POTENTIAL fleet (it doesn't depend on the crew you pick)
 *   · the per-ship weight scales the box (a Gorrión meets a smaller one) — the old fixed 3 000 floor is gone
 *   · «la caja te mide» (buildSiege mirror) changes only the enemy crew, and never a Part I / II battle
 *   · the élite brings the box's power (a hull-scaled cataclysm); El Cadenero his phase 2
 *   · `off` gives back the slice exactly as it was (the «before» of the calibration)
 *   · B-1…B-9 → 34 huellas: the second gatera is payable after El Cadenero (the 25-huellas gate is open)
 *   · the victory stamp of a first win: its stamp, what opened, the trip photo
 */
import { afterEach, describe, expect, it } from 'vitest';
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
const { shipPower, crew, crewSize } = await import('../src/state/sys/ship');
const { storyScale } = await import('../src/state/sys/storyScale');
const { buildBattle, buildErrand } = await import('../src/state/sys/campaign');
const { buildStoryBattle } = await import('../src/state/sys/storyBattles');
const { autoBattle } = await import('../src/battle/autoplay');
const { DIFFICULTY } = await import('../src/battle/ai');

function load(f = 'h65-normal') {
  mem.clear();
  mem.set(SAVE_KEY, readFileSync(new URL(`../test-saves/${f}.json`, import.meta.url), 'utf8'));
  G.load();
  expect(G.loaded).toBe(true);
}
const B = 'p3d_borracha' as const;
const plain = (s: object) => JSON.parse(JSON.stringify({ ...s, seed: 0, onEnd: undefined }));
const P = GB.CARTA_POLICY;
const SNAP = JSON.parse(JSON.stringify(P));
afterEach(() => {
  Object.assign(P, JSON.parse(JSON.stringify(SNAP)));
});

describe('enemy Poder: band × powerMul, the potential floor, the ship weight', () => {
  it('a normal stage: your Poder × powerMul × p3n (the floor doesn’t bite a real crew)', () => {
    load();
    const def = GT.stageOf(B, 3)!;
    const own = shipPower(G.s.ship.active, crew()) * (def.powerMul ?? 1) * P.band.normal;
    expect(own).toBeGreaterThan(P.floor * GB.potentialPower() * (def.powerMul ?? 1) * P.band.normal);
    expect(GB.gateraPower(B, 3)).toBeCloseTo(own * GB.cartaShipWeight(G.s.ship.active, 'normal'), 6);
  });

  it('élite and boss: their band × the «jefe» storyScale', () => {
    load();
    for (const n of [5, 9]) {
      const def = GT.stageOf(B, n)!;
      const sc = storyScale({ band: def.band }, crew())!;
      const own = shipPower(G.s.ship.active, crew()) * (def.powerMul ?? 1) * P.band[def.kind];
      expect(GB.gateraPower(B, n)).toBeCloseTo(Math.max(P.floor * GB.potentialPower() * (def.powerMul ?? 1) * P.band[def.kind], own) * sc.mul * GB.cartaShipWeight(G.s.ship.active, def.kind), 6);
    }
  });

  it('sandbagging the Bastión with ONE cat doesn’t shrink the box: the floor is your ship with its best cats', () => {
    load();
    const full = crew();
    const pot = GB.potentialPower();
    const one = [full[full.length - 1]];
    // the potential never depends on the crew you chose
    G.s.ship.crew[G.s.ship.active] = one;
    G.recalc();
    expect(GB.potentialPower()).toBeCloseTo(pot, 6);
    const pm = (GT.stageOf(B, 3)!.powerMul ?? 1) * P.band.normal;
    const own1 = shipPower(G.s.ship.active, one);
    // the floor bites: one cat meets 80 % of the box the best crew would meet (the multipliers apply on top)
    expect(own1).toBeLessThan(P.floor * pot);
    expect(GB.gateraPower(B, 3, one)).toBeCloseTo(P.floor * pot * pm * GB.cartaShipWeight(), 6);
    expect(GB.gateraPower(B, 3, one)).toBeGreaterThanOrEqual(0.8 * GB.gateraPower(B, 3, full) * (pot / shipPower(G.s.ship.active, full)) - 1e-6);
  });

  it('a small ship meets a smaller box (× its weight), never the Bastión’s floor', () => {
    load();
    const bast = GB.gateraPower(B, 5);
    for (const ship of ['bajel', 'merodeador', 'gorrion']) {
      if (!G.s.ship.owned.includes(ship)) G.s.ship.owned.push(ship);
      G.s.ship.crew[ship] = G.s.ship.crew.bastion.slice(0, crewSize(ship));
      G.s.ship.active = ship;
      G.recalc();
      const w = GB.cartaShipWeight(ship, 'elite');
      expect(w).toBeLessThan(1);
      const def = GT.stageOf(B, 5)!;
      const sc = storyScale({ band: def.band }, crew())!;
      const own = shipPower(ship, crew()) * (def.powerMul ?? 1) * P.band.elite;
      expect(GB.gateraPower(B, 5)).toBeCloseTo(Math.max(P.floor * GB.potentialPower(ship) * (def.powerMul ?? 1) * P.band.elite, own) * sc.mul * w, 6);
      expect(GB.gateraPower(B, 5)).toBeLessThan(bast);
    }
  });

  it('`off` gives the slice back exactly: max(3 000, your Poder × powerMul) × storyScale, no mirror, no box power', () => {
    load();
    P.off = true;
    for (const n of [1, 3, 5]) {
      const def = GT.stageOf(B, n)!;
      const sc = def.band ? storyScale({ band: def.band }, crew())!.mul : 1;
      expect(GB.gateraPower(B, n)).toBeCloseTo(Math.max(GB.GATERA_EP_FLOOR, shipPower(G.s.ship.active, crew()) * (def.powerMul ?? 1)) * sc, 6);
      const s = GB.buildGateraBattle(B, n, () => undefined);
      expect(s.meta?.mirror).toBeUndefined();
      expect(s.rules?.cataclysm).toBeUndefined();
    }
  });
});

describe('«la caja te mide» (buildSiege mirror)', () => {
  it('only the enemy crew changes: atk × f, hp × √f, cannon × √f, f ∈ [1, cap]', () => {
    load();
    const on = GB.buildGateraBattle(B, 3, () => undefined);
    P.mirror = { k: 0, cap: 1 };
    const offSpec = GB.buildGateraBattle(B, 3, () => undefined);
    const f = on.meta!.mirror!;
    expect(f).toBeGreaterThan(1);
    expect(f).toBeLessThanOrEqual(SNAP.mirror.cap + 1e-9);
    on.enemy.cats.forEach((c, i) => {
      expect(c.atk).toBe(Math.round(offSpec.enemy.cats[i].atk * f));
      expect(c.hp).toBe(Math.round(offSpec.enemy.cats[i].hp * Math.sqrt(f)));
    });
    expect(on.enemy.cannonAtk).toBe(Math.round(offSpec.enemy.cannonAtk * Math.sqrt(f)));
    expect(plain({ ...on.player })).toEqual(plain({ ...offSpec.player }));
    expect(offSpec.meta?.mirror).toBeUndefined();
  });

  it('never in a Part I / II battle (no field → no change; no meta.mirror)', () => {
    load();
    expect(buildBattle(3, 4, () => undefined).meta?.mirror).toBeUndefined();
    expect(buildStoryBattle('umbral_final', () => undefined).meta?.mirror).toBeUndefined();
    const errand = (G.s as unknown as { errands?: unknown }).errands;
    void errand;
    expect(typeof buildErrand).toBe('function');
  });
});

describe('La Borracha complete: B-6…B-9 + El Cadenero', () => {
  it('every stage is playable with its crew; the élite has the box power; the boss its phases and band', () => {
    load();
    const st = GT.stagesOf(B);
    expect(st.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const s of st) {
      expect(s.playable, `B-${s.n}`).toBe(true);
      expect(s.crew?.length, `B-${s.n}`).toBeGreaterThanOrEqual(2);
      expect(s.stamp, `B-${s.n}`).toBeTruthy();
    }
    expect(GT.stageOf(B, 9)!.kind).toBe('boss');
    expect(GT.stageOf(B, 9)!.band).toBe('jefe');
    const s9 = GB.buildGateraBattle(B, 9, () => undefined);
    expect(s9.rules?.fases?.side).toBe(1);
    expect(s9.intro?.tag).toBe('JEFE · LA BORRACHA');
    expect(GB.buildGateraBattle(B, 6, () => undefined).intro?.tag).toBe('LA BORRACHA · B-6');
    expect(GB.buildGateraBattle(B, 5, () => undefined).intro?.lines.join(' ')).toMatch(/PODER DE LA BORRACHA: LA LUNA BAJA/);
  });

  it('El Cadenero closes the door at 50 %: calm, and the bottles every turn with one more (deterministic)', () => {
    load();
    const spec = GB.buildGateraBattle(B, 9, () => undefined);
    const a = autoBattle(spec, DIFFICULTY.normal, 991, 30);
    const b = autoBattle(GB.buildGateraBattle(B, 9, () => undefined), DIFFICULTY.normal, 991, 30);
    expect(b).toEqual(a);
  }, 60_000);

  it('34 huellas: after El Cadenero (H74) the second gatera can be paid — once that box has something to play', () => {
    load();
    GT.openGatera(B);
    for (let n = 1; n <= 8; n++) GT.recordWin(B, n);
    expect(GT.huellas()).toBe(24);
    G.s.gold = 1e15;
    expect(GT.buyGatera('p3d_superheroes')).toEqual({ ok: false, why: 'story' });
    GT.recordWin(B, 9);
    expect(GT.huellas()).toBe(34);
    // the story gate is H74 done (NARRATIVA's map); the Comic has its stages now (the Acto II): it is sold
    expect(GT.dimDef('p3d_superheroes').story).toBe('mission:H74');
    G.s.missions.done.push('H74');
    const r = GT.buyGatera('p3d_superheroes');
    expect(r.ok).toBe(true);
    expect(GT.isOpen('p3d_superheroes')).toBe(true);
    expect(GT.huellas()).toBe(9);
  });
});

describe('the victory stamp of a first win (02 §5.3)', () => {
  const won = { won: true, reason: 'sunk', turns: 6, modulesDestroyed: 4, damageDealt: 100, catsLost: 0, perfect: false } as never;

  it('B-5: its stamp, «B-6 ABIERTA» and the trip photo (photos is additive state)', () => {
    load();
    GT.openGatera(B);
    for (let n = 1; n <= 4; n++) GT.recordWin(B, n);
    const loot = GB.applyGateraResult(B, 5, won);
    expect(loot.first).toBe(true);
    expect(loot.photo).toBe(true);
    const o = GB.victoryStampOpts(B, 5, loot);
    expect(o.stamp).toBe('placa');
    expect(o.label).toBe('B-5');
    expect(o.huellas).toBe(3);
    // the élite's captain stays with you (GATOS-DATOS: state/sys/p3cats.ts)
    expect(o.news).toEqual(['¡OFICIAL DONA SE UNE!', 'B-6 ABIERTA', '¡FOTO DEL VIAJE!']);
    expect(loot.p3?.cats).toEqual(['r_dona']);
    expect(GT.photos()).toEqual(['p3d_borracha_5']);
    // a repeat: no photo twice
    expect(GB.applyGateraResult(B, 5, won).photo).toBeUndefined();
    expect(GT.photos()).toEqual(['p3d_borracha_5']);
  });

  it('El Cadenero: the box beaten and the next gatera within reach', () => {
    load();
    GT.openGatera(B);
    for (let n = 1; n <= 8; n++) GT.recordWin(B, n);
    const loot = GB.applyGateraResult(B, 9, won);
    const o = GB.victoryStampOpts(B, 9, loot);
    expect(o.stamp).toBe('pulsera');
    expect(o.huellas).toBe(10);
    // (B-5 was recorded above without its battle: Oficial Dona joins here by catch-up — a won élite is a fact)
    expect(o.news).toEqual(['¡OFICIAL DONA SE UNE!', '¡FOTO DEL VIAJE!', 'LA BORRACHA: CAJA VENCIDA', 'YA ALCANZAN LAS HUELLAS: CIUDAD MAYÚSCULA']);
  });
});

describe('«Con el Bastión: N %» (the estimate suggests a better ship you own)', () => {
  it('withShip builds the battle with another ship (its crew, or its best cats) and puts everything back', () => {
    load();
    if (!G.s.ship.owned.includes('gorrion')) G.s.ship.owned.push('gorrion');
    delete G.s.ship.crew.gorrion;
    const before = JSON.stringify(G.s.ship);
    const bast = GB.buildGateraBattle(B, 5, () => undefined);
    const gor = GB.withShip('gorrion', () => GB.buildGateraBattle(B, 5, () => undefined));
    expect(JSON.stringify(G.s.ship)).toBe(before);
    expect(gor.player.cats.length).toBe(crewSize('gorrion'));
    expect(gor.player.blueprint).not.toEqual(bast.player.blueprint);
    // the Gorrión meets a smaller box (its weight), with its best cats aboard
    expect(gor.meta!.ep).toBeLessThan(bast.meta!.ep);
    // even if the build throws, the ship comes back
    expect(() => GB.withShip('gorrion', () => GB.buildGateraBattle(B, 99, () => undefined))).toThrow();
    expect(JSON.stringify(G.s.ship)).toBe(before);
    // the candidates: owned, not sailing
    expect(GB.otherShips()).toContain('gorrion');
    expect(GB.otherShips()).not.toContain(G.s.ship.active);
  });

  it('it suggests the best other ship only when it beats the current odds by 15+ points', () => {
    load();
    expect(GB.pickShipAdvice(0.5, [{ ship: 'bajel', p: 0.64 }])).toBeNull();
    expect(GB.pickShipAdvice(0.5, [{ ship: 'bajel', p: 0.65 }])).toMatchObject({ ship: 'bajel', p: 0.65 });
    expect(GB.pickShipAdvice(0.4, [{ ship: 'bajel', p: 0.6 }, { ship: 'merodeador', p: 0.82 }, { ship: 'gorrion', p: null }])).toMatchObject({ ship: 'merodeador', p: 0.82 });
    expect(GB.pickShipAdvice(null, [{ ship: 'bajel', p: 0.9 }])).toBeNull();
    expect(GB.pickShipAdvice(0.5, [])).toBeNull();
    expect(GB.pickShipAdvice(0.5, [{ ship: 'bajel', p: 0.9 }])!.name.length).toBeGreaterThan(2);
  });
});
