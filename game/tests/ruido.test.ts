/**
 * H35 «Shhh» — EL BIBLIOTECARIO AHOGADO ODIA EL RUIDO (battle/ruido.ts, StageRules.noise): Sonido hits his ship ×2,
 * each Sonido shot adds RUIDO, at 3 he wakes up furious (¡SHHHH!: his next turn ×1.5, RUIDO back to 0).
 * Pure rules, no rng: the battle screen and the estimate worker (autoBattle) replay the same fight.
 */
import { describe, expect, it } from 'vitest';
import { Battle, BattleEvent } from '../src/battle/sim';
import { makeBattle, autoBattle, autoBattleSteps } from '../src/battle/autoplay';
import { DIFFICULTY } from '../src/battle/ai';
import { BLUEPRINTS } from '../src/battle/blueprints';
import { battleCatFrom } from '../src/battle/catShots';
import { NZ_MUL, NZ_RAGE, NZ_WAKE, nzAtkMul, nzBeginFire, nzChips, nzState } from '../src/battle/ruido';
import type { BattleSpec } from '../src/scenes/BattleScene';
import { ROLE_BY_ID, catDef } from '../src/data/content';
import { STORY_BATTLES } from '../src/state/sys/storyBattles';
import '../src/state/sys/rupturas';

function crewCat(uid: string, species: string, level = 10) {
  return battleCatFrom({ uid, species, name: species, level, stars: 1, dmgMul: 1, hpMul: 1 }, ROLE_BY_ID.get(catDef(species).role)!.hp);
}
function spec(player: string[], enemy: string[], noise = true, hpMul = 6): BattleSpec {
  return {
    player: { blueprint: BLUEPRINTS.sparrow, hpMul, cats: player.map((s, i) => crewCat(`p${i}`, s)), cannonAtk: 30 },
    enemy: { blueprint: BLUEPRINTS.sparrow, hpMul, cats: enemy.map((s, i) => crewCat(`e${i}`, s)), cannonAtk: 30 },
    playerName: 'Tú',
    enemyName: 'La Sala de Lectura',
    difficulty: 'normal',
    rules: noise ? { noise: { side: 1 } } : undefined,
    onEnd: () => undefined,
  };
}
/** a cat lands its normal shot exactly on world point p, as one fresh shot */
function land(b: Battle, side: 0 | 1, uid: string, p: { x: number; y: number }) {
  const ev: BattleEvent[] = [];
  const cat = b.sides[side].cats.find((c) => c.def.uid === uid)!;
  nzBeginFire(b);
  b.curShooter = cat;
  b.resolveImpact(side, cat.def.shot, cat.def.atk, p.x, p.y, ev, 0, 0, true);
  b.curShooter = null;
  return ev;
}
const mid = (b: Battle, side: number) => {
  const c = b.sides[side].ship.get(4, 8)!;
  return b.cellCenter(side, c.x, c.y);
};
const structDmg = (ev: BattleEvent[], side: number) => ev.reduce((a, e) => a + (e.k === 'cell' && e.side === side ? e.dmg : 0), 0);

describe('ODIA EL RUIDO: the rule', () => {
  it('Sonido on his ship hits ×2; other elements and the other ship are untouched', () => {
    const hit = (noise: boolean, uid: string, side: 0 | 1 = 0) => {
      const b = makeBattle(spec(['c_tamborin', 'c_canelo'], ['c_tamborin']), 77);
      if (!noise) b.cfg.rules = undefined;
      return structDmg(land(b, side, uid, mid(b, 1 - side)), 1 - side);
    };
    const plain = hit(false, 'p0');
    expect(plain).toBeGreaterThan(0);
    expect(hit(true, 'p0') / plain).toBeCloseTo(NZ_MUL, 1);
    // a fire shot doesn't care about the noise
    expect(hit(true, 'p1')).toBe(hit(false, 'p1'));
    // his own Sonido on YOUR ship is plain Sonido
    expect(hit(true, 'e0', 1)).toBe(hit(false, 'e0', 1));
  });

  it('RUIDO counts once per Sonido shot; at 3 he wakes up (¡SHHHH!), RUIDO resets and his NEXT turn hits ×1.5', () => {
    const b = makeBattle(spec(['c_tamborin', 'c_canelo'], ['c_canelo'], true, 30), 5);
    const p = mid(b, 1);
    b.startTurn(0);
    expect(nzState(b)).toEqual({ ruido: 0, furious: null, wakes: 0 });
    land(b, 0, 'p1', p); // fire: no RUIDO
    expect(nzState(b)!.ruido).toBe(0);
    for (let i = 1; i < NZ_WAKE; i++) {
      const ev = land(b, 0, 'p0', p);
      expect(nzState(b)!.ruido).toBe(i);
      expect(ev.some((e) => e.k === 'info' && e.text.startsWith(`RUIDO ${i}/${NZ_WAKE}`))).toBe(true);
    }
    expect(nzChips(b)[0].text).toMatch(/RUIDO 2\/3/);
    const ev = land(b, 0, 'p0', p);
    expect(ev.some((e) => e.k === 'boss' && e.what === 'shhh')).toBe(true);
    expect(nzState(b)).toEqual({ ruido: 0, furious: 'armed', wakes: 1 });
    // still your turn: nothing is ×1.5 yet
    expect(nzAtkMul(b, 1)).toBe(1);
    const evs = b.startTurn(1);
    expect(evs.some((e) => e.k === 'info' && /FURIOSO/.test(e.text))).toBe(true);
    expect(nzAtkMul(b, 1)).toBe(NZ_RAGE);
    expect(nzAtkMul(b, 0)).toBe(1);
    expect(nzChips(b)[0].text).toMatch(/SHHHH/);
    // his furious turn ends when you play again
    b.startTurn(0);
    expect(nzAtkMul(b, 1)).toBe(1);
    expect(nzState(b)!.furious).toBeNull();
  });

  it('his furious turn really fires ×1.5 (cats and the cannon volley go through fire())', () => {
    const shoot = (furious: boolean) => {
      const b = makeBattle(spec(['c_tamborin'], ['c_canelo'], true, 30), 11);
      const p = mid(b, 1);
      if (furious) for (let i = 0; i < NZ_WAKE; i++) land(b, 0, 'p0', p);
      b.startTurn(1);
      const r = b.fire(1, 'e0', Math.PI + 0.7, 850);
      return r.atk;
    };
    expect(shoot(true) / shoot(false)).toBeCloseTo(NZ_RAGE, 5);
  });
});

describe('ODIA EL RUIDO: determinism and parity (screen = estimate)', () => {
  const play = (s: BattleSpec, seed: number) => {
    const log: string[] = [];
    let last: Battle | null = null;
    const res = autoBattle(s, DIFFICULTY.normal, seed, 30, (b, side, shot) => {
      last = b;
      log.push(`${b.turn}|${side}|${shot}|${b.sides[0].ship.cells().reduce((a, c) => a + c.hp, 0)}|${b.sides[1].ship.cells().reduce((a, c) => a + c.hp, 0)}`);
    });
    return { res, log, st: last ? nzState(last) : null };
  };

  it('the same seed replays the same noisy battle, and the rule does happen', () => {
    const s = spec(['c_tamborin', 'r_djbigotes', 'c_canelo'], ['l_bibliotecario', 'e_archivista', 'r_tintero'], true, 2);
    const a = play(s, 4242);
    const b = play(s, 4242);
    expect(b.res).toEqual(a.res);
    expect(b.log).toEqual(a.log);
    expect(a.log.length).toBeGreaterThan(4);
    // the noise happened: RUIDO piled up (or woke him up already)
    expect(a.st!.wakes * NZ_WAKE + a.st!.ruido).toBeGreaterThan(0);
  }, 60_000);

  it('the estimate steps through the very same battle as the one-shot run', () => {
    const s = spec(['c_tamborin', 'r_djbigotes', 'c_canelo'], ['l_bibliotecario', 'e_archivista', 'r_tintero'], true, 2);
    const it = autoBattleSteps(s, DIFFICULTY.hard, 99, 30);
    let r = it.next();
    while (!r.done) r = it.next();
    expect(r.value).toEqual(autoBattle(s, DIFFICULTY.hard, 99, 30));
  }, 60_000);

  it('without Sonido aboard the rule changes nothing (it draws no rng)', () => {
    const quiet = ['c_canelo', 'c_gelatino', 'c_voltio'];
    const foes = ['l_bibliotecario', 'e_archivista', 'r_tintero'];
    for (const seed of [1, 2]) expect(play(spec(quiet, foes, true, 2), seed).log).toEqual(play(spec(quiet, foes, false, 2), seed).log);
  }, 60_000);
});

describe('H35 «Shhh»: the story battle says it and plays it', () => {
  it('ruptura_bibliotecario hates noise on his own ship, keeps its cataclysm, and its intro explains the rule', () => {
    const d = STORY_BATTLES.ruptura_bibliotecario;
    expect(d.rules?.noise).toEqual({ side: 1 });
    expect(d.rules?.cataclysm).toBeTruthy();
    const intro = d.intro.join(' ');
    expect(intro).toMatch(/\{sound\}/);
    expect(intro).toMatch(/×2/);
    expect(intro).toMatch(/RUIDO/);
    expect(intro).toMatch(/SHHHH/);
    expect(intro).toMatch(/×1\.5/);
    expect(d.intro.length).toBeLessThanOrEqual(4);
    // only this ruptura hates noise
    for (const [id, b] of Object.entries(STORY_BATTLES)) if (id !== 'ruptura_bibliotecario') expect(b.rules?.noise, id).toBeUndefined();
  });
});
