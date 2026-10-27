/**
 * Parte III · La Borracha — MAREO (battle/mareo.ts, StageRules.mareo): the swaying aim, the seeded drift, the donuts
 * that heal, the alley's bottles and the karaoke's slow ultimates. Pure and deterministic: the battle screen (which adds
 * the released sway phase as an input) and the estimate worker (autoBattle) play the same battle.
 */
import { describe, expect, it } from 'vitest';
import { Battle, BattleEvent } from '../src/battle/sim';
import { makeBattle, autoBattle, autoBattleSteps } from '../src/battle/autoplay';
import { DIFFICULTY, decide } from '../src/battle/ai';
import { BLUEPRINTS } from '../src/battle/blueprints';
import { battleCatFrom } from '../src/battle/catShots';
import { BOTELLA, DONA_HIT, MareoCfg, bottlesIn, mareoChips, mareoDonas, mareoDraw, mareoGuideAngle, mareoLines, mareoPhaseAt, mareoShotValue, mareoState, swayAt } from '../src/battle/mareo';
import type { BattleSpec } from '../src/scenes/BattleScene';
import { ROLE_BY_ID, catDef } from '../src/data/content';

const DEG = Math.PI / 180;
function crewCat(uid: string, species: string, level = 10) {
  return battleCatFrom({ uid, species, name: species, level, stars: 1, dmgMul: 1, hpMul: 1 }, ROLE_BY_ID.get(catDef(species).role)!.hp);
}
function spec(mareo: MareoCfg | null, hpMul = 3, player = ['c_canelo', 'c_gelatino'], enemy = ['c_brote', 'c_musgo']): BattleSpec {
  return {
    player: { blueprint: BLUEPRINTS.sparrow, hpMul, cats: player.map((s, i) => crewCat(`p${i}`, s)), cannonAtk: 30 },
    enemy: { blueprint: BLUEPRINTS.sparrow, hpMul, cats: enemy.map((s, i) => crewCat(`e${i}`, s)), cannonAtk: 30 },
    playerName: 'Tú',
    enemyName: 'La Donería',
    difficulty: 'normal',
    rules: mareo ? { mareo } : undefined,
    onEnd: () => undefined,
  };
}
const BASE: MareoCfg = { sway: 4, period: 2.6, drift: 1 };
const sum = (b: Battle, side: number) => b.sides[side].ship.cells().reduce((a, c) => a + c.hp, 0);

describe('MAREO: the sway and the drift', () => {
  it('a cat shot leaves at aim + sway(phase) + a seeded drift; the guide shows aim + sway', () => {
    const b = makeBattle(spec(BASE), 123);
    b.startTurn(0);
    const aim = -0.7;
    const r = b.fire(0, 'p0', aim, 850, false, undefined, { sway: 0.25 });
    const st = mareoState(b)!;
    expect(st.last!.sway).toBeCloseTo(BASE.sway * DEG, 9);
    const d0 = mareoDraw(b, 0, 0).drift;
    expect(st.last!.drift).toBeCloseTo(d0, 12);
    expect(Math.abs(d0)).toBeLessThanOrEqual(BASE.drift * DEG + 1e-12);
    // the path really flew at that angle: the same as building it from the guide angle + the drift
    const guide = mareoGuideAngle(b, aim, 0.25);
    expect(guide).toBeCloseTo(aim + swayAt(BASE, 0.25), 12);
    const again = makeBattle(spec(null), 123);
    again.startTurn(0);
    const ref = again.fire(0, 'p0', guide + d0, 850);
    expect(r.paths[0].points.at(-1)).toEqual(ref.paths[0].points.at(-1));
  });

  it('the centre of the sway is only the drift; drift and phase are seeded per shot and bounded', () => {
    const b = makeBattle(spec(BASE), 7);
    expect(swayAt(BASE, 0)).toBe(0);
    expect(swayAt(BASE, 0.5)).toBeCloseTo(0, 12);
    const draws = Array.from({ length: 40 }, (_, n) => mareoDraw(b, 0, n));
    for (const d of draws) {
      expect(d.phase).toBeGreaterThanOrEqual(0);
      expect(d.phase).toBeLessThan(1);
      expect(Math.abs(d.drift)).toBeLessThanOrEqual(BASE.drift * DEG + 1e-12);
    }
    // not one constant: the drift moves shot to shot, both ways
    expect(new Set(draws.map((d) => d.drift.toFixed(6))).size).toBeGreaterThan(30);
    expect(draws.some((d) => d.drift > 0) && draws.some((d) => d.drift < 0)).toBe(true);
    // a fresh battle with the same seed draws the same; another seed doesn't
    expect(mareoDraw(makeBattle(spec(BASE), 7), 0, 5)).toEqual(draws[5]);
    expect(mareoDraw(makeBattle(spec(BASE), 8), 0, 5)).not.toEqual(draws[5]);
  });

  it('the screen phase is a pure clock seeded by the battle', () => {
    const b = makeBattle(spec(BASE), 99);
    const p0 = mareoPhaseAt(b, 0, 0);
    expect(mareoPhaseAt(b, 0, BASE.period)).toBeCloseTo(p0, 9);
    expect(mareoPhaseAt(b, 0, BASE.period / 4)).toBeCloseTo((p0 + 0.25) % 1, 9);
    expect(mareoPhaseAt(makeBattle(spec(BASE), 99), 0, 1.3)).toBe(mareoPhaseAt(b, 0, 1.3));
  });

  it('cannons never sway; without the rule nothing moves', () => {
    const shoot = (m: MareoCfg | null) => {
      const b = makeBattle(spec(m), 5);
      b.startTurn(0);
      const can = b.cannons(0)[0];
      return b.fire(0, 'cannon', -0.6, 800, false, can.id).paths[0].points.at(-1);
    };
    expect(shoot(BASE)).toEqual(shoot(null));
    const plain = makeBattle(spec(null), 5);
    expect(mareoState(plain)).toBeNull();
    expect(mareoGuideAngle(plain, -0.6, 0.25)).toBe(-0.6);
  });
});

describe('MAREO: donuts, bottles, karaoke', () => {
  const DONAS: MareoCfg = { ...BASE, donas: { side: 1, n: 3, heal: 0.06, catHeal: 0.2 } };

  it('donuts sit on the enemy deck; a hit on one eats it and HEALS that side (cells + cats); elsewhere nothing', () => {
    const b = makeBattle(spec(DONAS), 31);
    const ds = mareoDonas(b);
    expect(ds.length).toBe(3);
    expect(new Set(ds.map((d) => d.cx)).size).toBe(3);
    for (const d of ds) expect(b.sides[1].ship.get(d.cx, d.cy)).not.toBeNull();
    // hurt the enemy first (cells and a cat)
    const cells = b.sides[1].ship.cells().slice(0, 6);
    for (const c of cells) c.hp = Math.max(1, Math.round(c.maxHp * 0.3));
    const cat = b.sides[1].cats[0];
    cat.hp = Math.round(cat.maxHp * 0.4);
    const before = sum(b, 1);
    const catBefore = cat.hp;
    const ev: BattleEvent[] = [];
    // a near miss outside the donut: no heal
    b.resolveImpact(0, crewCat('x', 'c_canelo').shot, 1, ds[0].x + DONA_HIT + 40, ds[0].y + 400, ev, 0, 0, true);
    expect(mareoDonas(b).every((d) => d.state === 'on')).toBe(true);
    const ev2: BattleEvent[] = [];
    b.resolveImpact(0, crewCat('x', 'c_canelo').shot, 0.0001, ds[0].x, ds[0].y, ev2, 0, 0, true);
    expect(mareoDonas(b)[0].state).toBe('eaten');
    expect(ev2.some((e) => e.k === 'boss' && e.what === 'dona')).toBe(true);
    expect(ev2.some((e) => e.k === 'heal' && e.side === 1)).toBe(true);
    expect(sum(b, 1)).toBeGreaterThan(before - 5);
    expect(cat.hp).toBeGreaterThan(catBefore);
    // an eaten donut doesn't heal twice; their own shots never eat their donuts
    const ev3: BattleEvent[] = [];
    b.resolveImpact(0, crewCat('x', 'c_canelo').shot, 0.0001, ds[0].x, ds[0].y, ev3, 0, 0, true);
    expect(ev3.some((e) => e.k === 'boss' && e.what === 'dona')).toBe(false);
    b.resolveImpact(1, crewCat('x', 'c_canelo').shot, 0.0001, ds[1].x, ds[1].y, [], 0, 0, true);
    expect(mareoDonas(b)[1].state).toBe('on');
    expect(mareoChips(b)[0][0].text).toMatch(/DONAS x2/);
  });

  it('the AI values a shot onto a donut much less (it avoids feeding them)', () => {
    const b = makeBattle(spec(DONAS), 31);
    const d = mareoDonas(b)[0];
    const onDonut = [{ points: [{ x: 0, y: 0 }, { x: d.x, y: d.y }], element: 'fire' as const, kind: 'ballistic' as const, impacts: [1] }];
    const away = [{ points: [{ x: 0, y: 0 }, { x: d.x, y: d.y + 300 }], element: 'fire' as const, kind: 'ballistic' as const, impacts: [1] }];
    expect(mareoShotValue(b, 0, onDonut)).toBeLessThan(0.5);
    expect(mareoShotValue(b, 0, away)).toBe(1);
    // the donut owner's own shots don't care
    expect(mareoShotValue(b, 1, onDonut)).toBe(1);
  });

  it('bottles fall on your ship at the start of the alley turn: from turn 2, every 3 turns', () => {
    const BOT: MareoCfg = { ...BASE, botellas: { side: 0, first: 2, every: 3, n: 3, power: 0.5 } };
    const b = makeBattle(spec(BOT, 6), 4);
    const seen: number[] = [];
    for (let t = 1; t <= 8; t++) {
      expect(bottlesIn(b)).toBe(t < 2 ? 2 - t : (t - 2) % 3 === 0 ? 0 : 3 - ((t - 2) % 3));
      b.startTurn(0);
      expect(b.queued.length).toBe(0);
      b.endTurn();
      const hull = sum(b, 0);
      b.startTurn(1);
      const q = b.queued.splice(0);
      if (q.length) {
        seen.push(b.turn);
        expect(q[0].shot.id).toBe(BOTELLA.id);
        expect(q[0].paths.length).toBe(3);
        expect(q[0].events.some((e) => e.k === 'cell' && e.side === 0)).toBe(true);
        expect(sum(b, 0)).toBeLessThan(hull);
      }
      b.endTurn();
    }
    expect(seen).toEqual([2, 5, 8]);
  });

  it('karaoke: their ultimate meter fills ×0.8 (one more turn); yours as always', () => {
    const b = makeBattle(spec({ ...BASE, ultSlow: { side: 1, mul: 0.8 } }), 1);
    const p = makeBattle(spec(null), 1);
    expect(b.meterMul(1)).toBeCloseTo(p.meterMul(1) * 0.8, 12);
    expect(b.meterMul(0)).toBe(p.meterMul(0));
  });

  it('the intro / ¿POR QUÉ? lines say only what the sim plays', () => {
    const l = mareoLines({ ...DONAS, botellas: { side: 0, first: 2, every: 3, n: 3, power: 0.5 }, ultSlow: { side: 1, mul: 0.8 } });
    expect(l.join(' ')).toMatch(/±4°/);
    expect(l.join(' ')).toMatch(/DONAS: 3/);
    expect(l.join(' ')).toMatch(/BOTELLAS: desde el turno 2, cada 3/);
    expect(l.join(' ')).toMatch(/KARAOKE/);
  });
});

describe('MAREO: determinism and parity (the screen = the estimate)', () => {
  const FULL: MareoCfg = { sway: 4.5, period: 2.4, drift: 1.2, donas: { side: 1, n: 3, heal: 0.06, catHeal: 0.2 }, botellas: { side: 0, first: 2, every: 3, n: 3, power: 0.5 }, ultSlow: { side: 1, mul: 0.8 } };
  const play = (s: BattleSpec, seed: number) => {
    const log: string[] = [];
    let last: Battle | null = null;
    const res = autoBattle(s, DIFFICULTY.normal, seed, 30, (b, side, shot) => {
      last = b;
      log.push(`${b.turn}|${side}|${shot}|${sum(b, 0)}|${sum(b, 1)}`);
    });
    return { res, log, st: last ? mareoState(last) : null };
  };

  it('the same seed replays the same drunk battle (and the rule does happen)', () => {
    const s = spec(FULL, 2, ['c_canelo', 'c_gelatino', 'c_voltio'], ['c_terron', 'c_guijarro', 'r_iman']);
    const a = play(s, 4242);
    const b = play(s, 4242);
    expect(b.res).toEqual(a.res);
    expect(b.log).toEqual(a.log);
    expect(a.log.length).toBeGreaterThan(4);
    expect(a.st!.shots[0] + a.st!.shots[1]).toBeGreaterThan(4);
    expect(b.st).toEqual(a.st);
  }, 60_000);

  it('the estimate (step by step) is the very same battle as the one-shot run', () => {
    const s = spec(FULL, 2, ['c_canelo', 'c_gelatino', 'c_voltio'], ['c_terron', 'c_guijarro', 'r_iman']);
    for (const seed of [99, 1000 + 77]) {
      const it = autoBattleSteps(s, DIFFICULTY.hard, seed, 30);
      let r = it.next();
      while (!r.done) r = it.next();
      expect(r.value).toEqual(autoBattle(s, DIFFICULTY.hard, seed, 30));
    }
  }, 60_000);

  it('a screen battle (with released sway phases) replays exactly from its inputs', () => {
    const s = spec(FULL, 1.2);
    type Call = ['start', 0 | 1] | ['fire', Parameters<Battle['fire']>] | ['end'];
    const record = (seed: number) => {
      const b = makeBattle(s, seed);
      const calls: Call[] = [];
      let k = 0;
      for (let t = 0; t < 6 && b.winner === null; t++) {
        for (const side of [0, 1] as const) {
          calls.push(['start', side]);
          b.startTurn(side);
          b.queued.length = 0;
          const d = b.winner === null ? decide(b, side, DIFFICULTY.normal, new Map(), seed * 31 + b.turn * 7 + side) : null;
          if (d) {
            // the «player» releases at some point of the sway (an explicit input); the enemy has none
            const args: Parameters<Battle['fire']> = side === 0 ? [0, d.shooter, d.angle, d.power, d.ult, undefined, { sway: (k * 0.37) % 1 }] : [1, d.shooter, d.angle, d.power, d.ult];
            k++;
            calls.push(['fire', args]);
            b.fire(...args);
          }
          calls.push(['end']);
          b.endTurn();
          if (b.winner !== null) break;
        }
      }
      return { b, calls };
    };
    const snap = (b: Battle) => ({ w: b.winner, t: b.turn, h: [sum(b, 0), sum(b, 1)], cats: b.sides.map((x) => x.cats.map((c) => c.hp)), st: mareoState(b) });
    const a = record(321);
    const re = makeBattle(s, 321);
    for (const c of a.calls) {
      if (c[0] === 'start') {
        re.startTurn(c[1]);
        re.queued.length = 0;
      } else if (c[0] === 'fire') re.fire(...c[1]);
      else re.endTurn();
    }
    expect(snap(re)).toEqual(snap(a.b));
    // and a different released phase is a different battle (the input matters)
    const other = makeBattle(s, 321);
    for (const c of a.calls) {
      if (c[0] === 'start') {
        other.startTurn(c[1]);
        other.queued.length = 0;
      } else if (c[0] === 'fire') {
        const args = [...c[1]] as Parameters<Battle['fire']>;
        if (args[0] === 0) args[6] = { sway: 0.25 };
        other.fire(...args);
      } else other.endTurn();
    }
    const so = snap(other);
    const sa = snap(a.b);
    // the recorded battle really fought (both hulls took hits)
    const fresh = makeBattle(s, 321);
    expect(sa.h[0]).toBeLessThan(sum(fresh, 0));
    expect(sa.h[1]).toBeLessThan(sum(fresh, 1));
    expect({ h: so.h, cats: so.cats }).not.toEqual({ h: sa.h, cats: sa.cats });
  }, 60_000);

  it('without the rule the battle is exactly the old one (Mareo draws no rng)', () => {
    const s0 = spec(null, 2);
    const s1 = spec({ sway: 0, period: 2, drift: 0 }, 2);
    for (const seed of [1, 2]) expect(play(s1, seed).log).toEqual(play(s0, seed).log);
  }, 60_000);
});
