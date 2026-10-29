/**
 * After the Parte III · TANDA 2: the 25 second-batch post MULTIDIMENSIONAL powers (battle/multidimPost powersD/E, rulesD,
 * turnD, hudD, kitD; data/multidimPowersPost.ts — agent PODERES-3, 2026-10-29; design: docs/post-p3/05-tanda-2.md and
 * 04-roster.json → post.power). Same contract as multidimPost.test.ts (whose helpers this file repeats):
 *
 *   · each one fires in a seeded battle and does what its text says (one check per cat), within its cap, no NaN;
 *   · the rules it leaves (windows, floors, traps, the wager, the encore, the compass…) work and end;
 *   · player side only (powers on / off: identical enemy battle), determinism, the AI fires every one, the boss cap,
 *     ★5 twice, readable chips, and no instant win: no whole-ship collapses, no free core kills;
 *   · the three tallies (Doc Miauwn, Felinamente, Garjona) only open the state when one of them sails with you.
 * Cats not synced into data/postp3/especies.json yet are injected from the roster (tests/helpers/postStubs.ts).
 */
import { afterAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { injectPostCats } from './helpers/postStubs';

const { ROLE_BY_ID, catDef, CAT_BY_ID } = await import('../src/data/content');
type CatDef = import('../src/data/content').CatDef;
const { MULTIDIM_POWERS, multidimPower } = await import('../src/data/multidimPowers');
const { MULTIDIM_POWERS_POST, MDP_IDS, MDP_UNIVERSE } = await import('../src/data/multidimPowersPost');
const MD = await import('../src/battle/multidim');
const K = await import('../src/battle/multidimPost/kit');
const { makeBattle, autoBattle } = await import('../src/battle/autoplay');
const { battleCatFrom } = await import('../src/battle/catShots');
const { BLUEPRINTS } = await import('../src/battle/blueprints');
const { aimFrom, DIFFICULTY } = await import('../src/battle/ai');
const { ULTS } = await import('../src/battle/ults');
const { NEUTRAL_SHOT } = await import('../src/battle/sim');
type Spec = import('../src/scenes/BattleScene').BattleSpec;
type Battle = import('../src/battle/sim').Battle;
type Ev = import('../src/battle/sim').BattleEvent;
type Cat = Battle['sides'][0]['cats'][0];
type Shot = import('../src/battle/types').ShotDef;

// ---- the roster's Multidimensionals (the ones not synced yet are injected for this file only)
const ROSTER = JSON.parse(readFileSync(fileURLToPath(new URL('../../docs/post-p3/04-roster.json', import.meta.url)), 'utf8')) as { cats: (CatDef & { post: { power: { name: string } } })[] };
const POST = ROSTER.cats.filter((c) => c.rarity === 'multidimensional');
/** this file's: the 25 of tanda 2 (the first 60 live in multidimPost.test.ts) */
const T2 = POST.filter((c) => (c.post as { tanda?: number }).tanda === 2);
const IDS = T2.map((c) => c.id);
const undo = injectPostCats(POST.filter((c) => !CAT_BY_ID.has(c.id)).map((c) => JSON.parse(JSON.stringify(c)) as CatDef));
afterAll(() => undo());

function cat(uid: string, species: string, stars = 1, hpMul = 1) {
  return battleCatFrom({ uid, species, name: species, level: 30, stars, dmgMul: 1, hpMul }, ROLE_BY_ID.get(catDef(species).role)?.hp ?? 100);
}
/** the fixed little battle of multidimPowers.test.ts: the Multidimensional (p0) + two plain cats vs three plain cats */
function spec(species: string, o: { enemySide?: boolean; stars?: number; boss?: boolean; mates?: string[] } = {}): Spec {
  const md = cat(o.enemySide ? 'e0' : 'p0', species, o.stars);
  const m = o.mates ?? ['c_canelo', 'c_gelatino'];
  const mine = o.enemySide ? [cat('p0', 'c_canelo'), cat('p1', 'c_gelatino'), cat('p2', 'r_magmito')] : [md, cat('p1', m[0]), cat('p2', m[1])];
  const theirs = o.enemySide ? [md, cat('e1', 'c_brote'), cat('e2', 'c_musgo')] : [cat('e0', 'c_brote'), cat('e1', 'c_musgo'), cat('e2', 'r_magmito')];
  return {
    player: { blueprint: BLUEPRINTS.sparrow, hpMul: 3, cats: mine, cannonAtk: 30 },
    enemy: { blueprint: BLUEPRINTS.sparrow, hpMul: 3, cats: theirs, cannonAtk: 30 },
    playerName: 'Tú',
    enemyName: 'Prueba',
    difficulty: 'normal',
    boss: o.boss ? { id: 'sardina', side: 1, captain: 'e0', enrageTurn: 99 } : undefined,
    onEnd: () => undefined,
  } as Spec;
}
function snapshot(b: Battle) {
  return { hull: b.sides[1].ship.cells().reduce((a, c) => a + c.hp, 0), max: b.sides[1].ship.initialMax?.[0] ?? 0, cats: b.sides[1].cats.map((c) => c.hp) };
}
/** your Multidimensional fires its power, aimed at the middle of their ship */
function fireMd(species: string, seed = 77, o: Parameters<typeof spec>[1] = {}, prep?: (b: Battle) => void) {
  const b = makeBattle(spec(species, o), seed);
  b.startTurn(0);
  prep?.(b);
  const me = b.sides[0].cats[0];
  me.ultCharge = 1;
  me.stunned = 0;
  me.cooldown = 0;
  const before = snapshot(b);
  const a = aimFrom(b, 0, b.muzzle(0, me.def.uid), me.def.ultimate!, 1, 0, b.shipCenter(1));
  const r = b.fire(0, me.def.uid, a.angle, a.power, true);
  return { b, r, me, before };
}
const structDmg = (ev: Ev[], side = 1) => ev.reduce((a, e) => a + (e.k === 'cell' && e.side === side ? e.dmg : 0), 0);
const catDmg = (ev: Ev[], side = 1) => ev.reduce((a, e) => a + (e.k === 'cat' && e.side === side ? e.dmg : 0), 0);
const finite = (ev: Ev[]) => ev.every((e) => Object.values(e).every((v) => typeof v !== 'number' || Number.isFinite(v)));
const has = (ev: Ev[], fx: string) => ev.some((e) => e.k === 'ultfx' && e.fx === fx);
const fxOf = (ev: Ev[], fx: string) => ev.filter((e): e is Extract<Ev, { k: 'ultfx' }> => e.k === 'ultfx' && e.fx === fx);
function toEnemy(b: Battle) {
  b.endTurn();
  return b.startTurn(1);
}
function toMine(b: Battle) {
  b.endTurn();
  return b.startTurn(0);
}
/** the queued blows of the turn start (resolved already: the view only animates them) */
function drain(b: Battle): Ev[] {
  const ev = b.queued.flatMap((q) => q.events);
  b.queued.length = 0;
  return ev;
}
/** a cat of `side` fires its shot (or its ultimate) at the middle of the other ship */
function shoot(b: Battle, side: 0 | 1, uid: string, ult = false) {
  const c = b.sides[side].cats.find((k) => k.def.uid === uid)!;
  c.cooldown = 0;
  c.stunned = 0;
  if (ult) c.ultCharge = 1;
  const a = aimFrom(b, side, b.muzzle(side, uid), ult ? c.def.ultimate! : c.def.shot, 1, 0, b.shipCenter(1 - side));
  return b.fire(side, uid, a.angle, a.power, ult);
}
/** a bare impact of `att` on a point (no fire around it) */
function blow(b: Battle, att: number, x: number, y: number, shot: Shot = NEUTRAL_SHOT, atk = 60) {
  const ev: Ev[] = [];
  b.resolveImpact(att, shot, atk, x, y, ev, 0, 0, true);
  return ev;
}
const center = (b: Battle, side: number, id: number) => b.roomCenter(side, id);
const cellPt = (b: Battle, side: number, c: { x: number; y: number }) => b.cellCenter(side, c.x, c.y);
const st = (b: Battle) => K.peek(b)!;

const KD = await import('../src/battle/multidimPost/kitD');
const dd = (b: Battle) => KD.peekD(b)!;
const enemyCells = (b: Battle) => b.sides[1].ship.cells();
const coreOf = (b: Battle, side = 1) => b.sides[side].ship.modules.find((m) => m.kind === 'core')!;
const chunks = (ev: Ev[], side = 1) => ev.filter((e) => e.k === 'chunk' && e.side === side);
/** a fake shot of `side` being resolved right now (what sim.fire sets before its impacts) */
function ctxOf(b: Battle, side: 0 | 1, cat: Cat | undefined, cannonId?: number) {
  K.S(b).ctx = { side, cat, ult: false, kind: cannonId !== undefined ? 'cannon' : 'cat', cannonId, ev0: 0, caught: false, remate: false };
}

describe('tanda 2: the data', () => {
  it('the 25 of the roster have their power, with the roster name, a short ≤ 60, and nothing STARFALL/METEOR/DECREE', () => {
    expect(IDS.length).toBe(25);
    for (const c of T2) {
      const p = MULTIDIM_POWERS_POST[c.id];
      expect(p, c.id).toBeTruthy();
      expect(MDP_IDS).toContain(c.id);
      expect(MDP_UNIVERSE[c.id], c.id).toBeTruthy();
      expect(p.name, c.id).toBe(c.post.power.name);
      expect(c.combat.ultimate.name.split('(')[0].trim(), c.id).toBe(p.name);
      expect(p.name, c.id).not.toMatch(/STARFALL|METEOR|DECREE/i);
      expect(p.short.length, c.id).toBeLessThanOrEqual(60);
      expect(p.text, c.id).not.toMatch(/Una vez por batalla|undefined|NaN/);
      expect(typeof MD.MD_ULTS[c.id], c.id).toBe('function');
      expect(ULTS[c.id], c.id).toBeUndefined();
      expect(multidimPower(c.id), c.id).toBe(p);
    }
  });
});

describe('tanda 2: each power fires and does what it says (your crew, seeded)', () => {
  for (const id of IDS) {
    it(`${id}: ${MULTIDIM_POWERS_POST[id]?.name}`, () => {
      const { b, r, me, before } = fireMd(id);
      const ev = r.events;
      expect(ev.some((e) => e.k === 'ultfx' && e.fx === 'md' && e.uid === id), 'stamp').toBe(true);
      expect(MD.mdFeats(b)[`md_${id}`]).toBe(1);
      expect(finite(ev)).toBe(true);
      for (const p of r.paths) for (const q of p.points) expect(Number.isFinite(q.x) && Number.isFinite(q.y)).toBe(true);
      expect(structDmg(ev)).toBeLessThanOrEqual(Math.round(before.max * MD.MD_TUNE.frac) + 1);
      expect(me.ultUsed).toBe(1);
      // no instant win: the fight goes on after any of them
      expect(b.winner, 'no instant win').toBe(null);
      CHECK2[id]?.({ b, ev, me, before, es: b.sides[1], foes: b.sides[1].cats.filter((c) => !c.ko) });
      expect(CHECK2[id], `${id} has its own check`).toBeTypeOf('function');
    });
  }
});

interface Ctx {
  b: Battle;
  ev: Ev[];
  me: Cat;
  before: ReturnType<typeof snapshot>;
  es: Battle['sides'][1];
  foes: Cat[];
}

const CHECK2: Record<string, (c: Ctx) => void> = {
  xp_sombreronron: ({ b }) => {
    expect(dd(b).braid?.pins.length).toBe(0);
    // your crew's next impacts pin the ribbons (this turn and your 2 next); the third closes the braid
    const seen: Ev[] = [];
    for (let t = 0; t < 3 && dd(b).braid; t++) {
      for (const uid of ['p1', 'p2']) if (dd(b).braid) seen.push(...shoot(b, 0, uid).events);
      seen.push(...toEnemy(b), ...drain(b));
      seen.push(...toMine(b), ...drain(b));
    }
    expect(has(seen, 'mdpPin')).toBe(true);
    expect(has(seen, 'mdpBraidClose') || has(seen, 'mdpPinBlow')).toBe(true);
    expect(dd(b).braid).toBeNull();
    // an ultimate that hits by hand (El Gatejo's bites) pins ribbons where it hurt
    const z = fireMd('xp_sombreronron', 77, { mates: ['xp_gatejo', 'c_gelatino'] });
    toEnemy(z.b);
    toMine(z.b);
    shoot(z.b, 0, 'p1', true);
    const zb = KD.peekD(z.b)!.braid;
    expect(zb ? zb.pins.length : MD.mdFeats(z.b).md_braid).toBeGreaterThan(0);
  },
  xp_gatejo: ({ b, ev, before }) => {
    expect(b.sides[0].cats.reduce((a, c) => a + c.shields, 0)).toBeGreaterThanOrEqual(2);
    expect(catDmg(ev)).toBeGreaterThan(0);
    expect(enemyCells(b).some((c) => c.status.cursed)).toBe(true);
    expect(has(ev, 'mdpBite')).toBe(true);
    void before;
  },
  xp_maullorona: ({ b, ev }) => {
    expect(fxOf(ev, 'mdpTear').length).toBe(7);
    expect(catDmg(ev)).toBeGreaterThan(0);
    // the tears look for the weakest: the most hurt cat took the most
    expect(b.sides[1].cats.some((c) => c.fx.wet > 0 || c.ko)).toBe(true);
    // a cat under 25 % has no shield that holds
    const z = fireMd('xp_maullorona', 77, {}, (bb) => {
      const c = bb.sides[1].cats[0];
      c.hp = Math.round(c.maxHp * 0.2);
      c.shields = 3;
    });
    const c = z.b.sides[1].cats[0];
    expect(c.ko || c.hp < Math.round(c.maxHp * 0.2)).toBe(true);
  },
  xp_quetzalgatl: ({ b, ev }) => {
    expect(b.wind).toBe(70);
    const base = dd(b).wind!.base;
    if (b.sides[1].ship.modules.some((m) => m.kind === 'cannon')) expect(b.sides[1].ship.modules.some((m) => m.kind === 'cannon' && m.disabled >= 2)).toBe(true);
    expect(ev.some((e) => e.k === 'info' && /EL VIENTO ES TUYO/.test(e.text))).toBe(true);
    for (let t = 0; t < 3; t++) {
      toEnemy(b);
      expect(b.wind).toBe(70);
      toMine(b);
      expect(b.wind).toBe(70);
    }
    toEnemy(b);
    toMine(b);
    expect(b.wind).toBe(base);
    expect(dd(b).wind).toBeNull();
  },
  xp_bastet: ({ b }) => {
    expect(dd(b).guard).toBeTruthy();
    toEnemy(b);
    const c = b.sides[0].ship.cells().find((k) => k.hp === k.maxHp && k.module !== undefined)!;
    const p = cellPt(b, 0, c);
    blow(b, 1, p.x, p.y, { ...NEUTRAL_SHOT, radius: 4 }, 5000);
    expect(c.hp).toBeGreaterThanOrEqual(Math.ceil(c.maxHp * 0.3));
    expect(dd(b).guard!.rays).toBeGreaterThan(0);
    let q: Ev[] = [];
    for (let t = 0; t < 3; t++) {
      q = [...toMine(b), ...drain(b)];
      if (t < 2) toEnemy(b);
    }
    expect(has(q, 'mdpSun')).toBe(true);
    expect(dd(b).guard).toBeNull();
    // the floor is gone: the same blow breaks it now
    toEnemy(b);
    const c2 = b.sides[0].ship.cells().find((k) => k.hp === k.maxHp && k.module !== undefined)!;
    const p2 = cellPt(b, 0, c2);
    blow(b, 1, p2.x, p2.y, { ...NEUTRAL_SHOT, radius: 4 }, 5000);
    expect(b.sides[0].ship.get(c2.x, c2.y) !== c2 || c2.hp < Math.ceil(c2.maxHp * 0.3)).toBe(true);
  },
  xp_cleogatra: ({ b }) => {
    expect(dd(b).wager).toBeTruthy();
    // your side hurts their ship a lot more than they hurt you: the wager is won
    const ctr = b.shipCenter(1);
    blow(b, 0, ctr.x, ctr.y, { ...NEUTRAL_SHOT, radius: 60 }, 900);
    const m0 = b.sides[0].cats.map((c) => c.ultCharge);
    let q: Ev[] = [];
    for (let t = 0; t < 2; t++) {
      toEnemy(b);
      q = [...toMine(b), ...drain(b)];
    }
    expect(has(q, 'mdpPearlWin')).toBe(true);
    expect(b.sides[0].cats.some((c, i) => !c.ko && c.ultCharge > m0[i])).toBe(true);
    expect(dd(b).wager).toBeNull();
    // nobody hurt anybody: a tie — the consolation pearl on their core
    const z = fireMd('xp_cleogatra', 78);
    let q2: Ev[] = [];
    for (let t = 0; t < 2; t++) {
      z.b.sides[1].cats.forEach((c) => (c.stunned = 9));
      toEnemy(z.b);
      q2 = [...toMine(z.b), ...drain(z.b)];
    }
    expect(has(q2, 'mdpPearlWin') || has(q2, 'mdpPearlLose')).toBe(true);
  },
  xp_bonapata: ({ b, ev }) => {
    expect(structDmg(ev)).toBeGreaterThan(0);
    expect(dd(b).conquest).toBeTruthy();
    // every cell your side breaks in the window raises the crew's damage for good
    for (const c of enemyCells(b)) c.hp = 1;
    shoot(b, 0, 'p1');
    expect(dd(b).bonus[0]).toBeGreaterThan(0);
    expect(dd(b).bonus[0]).toBeLessThanOrEqual(0.4);
    expect(MD.mdChips(b)[1].map((c) => c.text).join()).toMatch(/CONQUISTA/);
  },
  xp_leonardo: ({ b, ev }) => {
    expect(structDmg(ev)).toBeGreaterThan(0);
    expect(dd(b).codex.size).toBe(b.sides[0].cats.filter((c) => !c.ko).length);
    toEnemy(b);
    toMine(b);
    const c = b.sides[0].cats.find((k) => k.def.uid === 'p1')!;
    shoot(b, 0, 'p1');
    expect(dd(b).codex.has(c)).toBe(false);
    expect(MD.mdFeats(b).md_codex).toBe(1);
  },
  xp_perla: ({ b }) => {
    expect(dd(b).light?.turns).toBe(4);
    expect(b.sides[0].cats.some((c) => c.shields >= 2)).toBe(true);
    b.sides[0].cats.forEach((c) => (c.hp = Math.round(c.maxHp * 0.5)));
    const cell = b.sides[0].ship.cells()[3];
    cell.hp = Math.round(cell.maxHp * 0.5);
    const h0 = b.sides[0].cats.map((c) => c.hp);
    const c0 = cell.hp;
    toEnemy(b);
    toMine(b);
    expect(b.sides[0].cats.every((c, i) => c.ko || c.hp > h0[i])).toBe(true);
    expect(cell.hp).toBeGreaterThan(c0);
    expect(dd(b).light?.turns).toBe(3);
  },
  xp_miauton: ({ b, ev }) => {
    expect(structDmg(ev)).toBeGreaterThan(0);
    expect(dd(b).gravity).toBeTruthy();
    // your shots weigh half (and your guide shows it); their AI aims with the plain shot
    expect(MD.mdShot(b, 0, NEUTRAL_SHOT).gravityScale).toBeCloseTo(0.5);
    expect(MD.mdAimShot(b, 0, NEUTRAL_SHOT).gravityScale).toBeCloseTo(0.5);
    toEnemy(b);
    expect(MD.mdShot(b, 1, NEUTRAL_SHOT).gravityScale).toBeCloseTo(2);
    expect(MD.mdAimShot(b, 1, NEUTRAL_SHOT).gravityScale).toBeUndefined();
    for (let t = 0; t < 3; t++) {
      toMine(b);
      toEnemy(b);
    }
    expect(MD.mdShot(b, 1, NEUTRAL_SHOT).gravityScale).toBeUndefined();
  },
  xp_miauzart: ({ b, ev }) => {
    expect(structDmg(ev)).toBeGreaterThan(0);
    expect(dd(b).encore).toBeTruthy();
    toEnemy(b);
    toMine(b);
    const r = shoot(b, 0, 'p1', true);
    expect(has(r.events, 'mdpEncoreHit')).toBe(true);
    expect(dd(b).encore).toBeNull();
  },
  xp_miausagi: ({ b, ev }) => {
    const E = new Set(b.sides[0].cats.filter((c) => !c.ko).map((c) => c.def.elements[0])).size;
    expect(fxOf(ev, 'mdpMoon')[0].n).toBe(Math.min(5, E));
    expect(structDmg(ev)).toBeGreaterThan(0);
    expect(b.sides[0].cats.filter((c) => c.def.uid !== 'p0').every((c) => c.ultCharge >= 0.15 - 1e-9)).toBe(true);
  },
  xp_tanjimiau: ({ b, ev }) => {
    expect(fxOf(ev, 'mdpDragon').length).toBeGreaterThan(2);
    expect(has(ev, 'mdpKick')).toBe(true);
    expect(structDmg(ev)).toBeGreaterThan(0);
    expect(enemyCells(b).some((c) => c.status.wet)).toBe(true);
  },
  xp_tetrimiau: ({ b, ev }) => {
    expect(fxOf(ev, 'mdpLine')[0].n).toBeGreaterThan(0);
    // never a free collapse: nothing hangs, the core lives, the ship floats
    expect(chunks(ev)).toEqual([]);
    expect(coreOf(b).alive).toBe(true);
    expect(b.sides[1].ship.integrity()).toBeGreaterThan(0.28);
  },
  xp_laracroqueta: ({ b, ev }) => {
    expect(catDmg(ev)).toBeGreaterThan(0);
    const z = fireMd('xp_laracroqueta', 77, {}, (bb) => {
      bb.sides[1].cats.forEach((c, i) => (c.ultCharge = i === 0 ? 1 : 0.5));
      bb.sides[0].cats.forEach((c) => (c.ultCharge = 0));
    });
    // −40 from the full one (then the pointers' blows give it a little back), −25 from the others
    expect(z.b.sides[1].cats.slice(1).map((c) => +c.ultCharge.toFixed(2))).toEqual([0.25, 0.25]);
    expect(z.b.sides[1].cats[0].ultCharge).toBeLessThan(0.95);
    expect(z.b.sides[0].cats.reduce((a, c) => a + c.ultCharge, 0)).toBeCloseTo(0.9, 5);
    expect(z.b.sides[1].buffs.blind).toBeGreaterThanOrEqual(1);
  },
  xp_pobregatito: ({ b }) => {
    const tr = dd(b).traps!;
    expect(tr.cells.length).toBe(4);
    toEnemy(b);
    const e0 = b.sides[1].cats[0];
    const c = tr.cells[0];
    const p = cellPt(b, 0, c);
    ctxOf(b, 1, e0);
    const hit = blow(b, 1, p.x, p.y);
    expect(structDmg(hit, 0)).toBe(0);
    expect(fxOf(hit, 'mdpTrap')[0].n).toBe(0);
    expect(e0.stunned).toBeGreaterThanOrEqual(2);
    expect(dd(b).traps!.cells.length).toBe(3);
    // the third trap (the toy cars): that cat's next shot swerves and hits ×0.5
    for (const k of [1, 2]) {
      ctxOf(b, 1, e0);
      const q = cellPt(b, 0, dd(b).traps!.cells[0]);
      expect(fxOf(blow(b, 1, q.x, q.y), 'mdpTrap')[0].n).toBe(k);
    }
    expect(dd(b).swerve.has(`c:${e0.def.uid}`)).toBe(true);
    K.S(b).ctx = null;
    // their AI can't see them: a blow with no shot of theirs in the air springs nothing
    const last = cellPt(b, 0, dd(b).traps!.cells[0]);
    expect(has(blow(b, 1, last.x, last.y), 'mdpTrap')).toBe(false);
  },
  xp_felinamente: ({ b, ev }) => {
    expect(catDmg(ev)).toBeGreaterThan(0);
    expect(dd(b).objection).toBeTruthy();
    toEnemy(b);
    const e0 = b.sides[1].cats[0];
    const mine = b.sides[0].cats.find((c) => !c.ko)!;
    MD.mdFire(b, 1, e0, false, undefined, []);
    mine.fx.burning = 2;
    const out: Ev[] = [];
    MD.mdAfterShot(b, 1, e0, false, undefined, NEUTRAL_SHOT, 30, [], out);
    expect(mine.fx.burning).toBe(0);
    expect(b.sides[1].cats.filter((c) => !c.ko).every((c) => c.fx.burning >= 2)).toBe(true);
    expect(has(out, 'mdpObjection')).toBe(true);
    expect(dd(b).objection!.used).toBe(true);
  },
  xp_gorrimiau: ({ b }) => {
    expect(dd(b).compass).toBeTruthy();
    const target = b.sides[1].cats[2];
    b.sides[1].cats.forEach((c) => (c.ultCharge = c === target ? 0.9 : 0.1));
    const t = center(b, 1, target.room);
    const c = b.sides[0].cats.find((k) => k.def.uid === 'p1')!;
    c.cooldown = 0;
    const a = aimFrom(b, 0, b.muzzle(0, 'p1'), c.def.shot, 1, 0, b.shipCenter(1));
    const plain = b.buildPaths(MD.mdShot(b, 0, c.def.shot), b.muzzle(0, 'p1'), a.angle, a.power, b.wind, 0);
    const pe = plain[0].points[plain[0].points.length - 1];
    const r = b.fire(0, 'p1', a.angle, a.power, false);
    const q = r.paths[0].points[r.paths[0].impacts.length ? r.paths[0].impacts[r.paths[0].impacts.length - 1] : r.paths[0].points.length - 1];
    expect(Math.hypot(q.x - t.x, q.y - t.y)).toBeLessThanOrEqual(Math.hypot(pe.x - t.x, pe.y - t.y) + 2);
  },
  xp_docmiauwn: ({ ev }) => {
    // no misses this battle: just the bolt on their core
    expect(has(ev, 'mdpBolt')).toBe(true);
    // two shots in the water before the cast: they come back, plus the bolt (fewer than 3)
    const z = fireMd('xp_docmiauwn', 77, {}, (bb) => {
      for (const uid of ['p1', 'p2']) {
        const c = bb.sides[0].cats.find((k) => k.def.uid === uid)!;
        c.cooldown = 0;
        bb.fire(0, uid, -0.25, 180, false);
      }
    });
    const n = KD.peekD(z.b)?.misses.length ?? 0;
    expect(n).toBeGreaterThanOrEqual(1);
    expect(fxOf(z.r.events, 'mdpPast').length).toBe(n);
    expect(has(z.r.events, 'mdpBolt')).toBe(n < 3);
  },
  xp_pinkmiau: ({ b, ev }) => {
    expect(structDmg(ev)).toBeGreaterThan(0);
    expect(enemyCells(b).some((c) => c.status.steam)).toBe(true);
    const r = shoot(b, 0, 'p1');
    if (r.events.some((e) => e.k === 'cell' && e.side === 1 && e.dmg > 0)) expect(r.events.some((e) => e.k === 'status' && e.side === 1 && e.status === 'steam')).toBe(true);
    // with Heisenmiau in the crew: his chemistry counts every status twice
    const z = fireMd('xp_pinkmiau', 77, { mates: ['xp_heisenmiau', 'c_gelatino'] });
    expect(KD.chemCombo(z.b, 0)).toBe(true);
    for (const c of z.b.sides[1].ship.cells().slice(0, 8)) c.status.wet = 2;
    const h = shoot(z.b, 0, 'p1', true);
    expect(h.events.some((e) => e.k === 'info' && /x2 CON PINKMIAU/.test(e.text))).toBe(true);
  },
  xp_miauty: ({ ev }) => {
    // even books: interest on their core
    expect(fxOf(ev, 'mdpBalance')[0].n).toBe(0);
    expect(structDmg(ev)).toBeGreaterThan(0);
    // you're losing: they lose half the gap, you mend it — and no cell of theirs breaks
    const z = fireMd('xp_miauty', 77, {}, (bb) => bb.sides[0].ship.cells().forEach((c) => (c.hp = Math.max(1, Math.round(c.maxHp * 0.4)))));
    const zev = z.r.events;
    expect(fxOf(zev, 'mdpBalance')[0].n).toBeGreaterThan(0);
    expect(zev.some((e) => e.k === 'cell' && e.side === 1 && e.destroyed)).toBe(false);
    expect(structDmg(zev)).toBeGreaterThan(0);
    expect(z.b.sides[0].ship.cells().some((c) => c.hp > Math.round(c.maxHp * 0.4))).toBe(true);
  },
  xp_michincipe: ({ ev }) => {
    // full crew, no shields over there: the sheep rams the core
    expect(fxOf(ev, 'mdpBox')[0].n).toBe(3);
    expect(structDmg(ev)).toBeGreaterThan(0);
    const hurt = fireMd('xp_michincipe', 77, {}, (bb) => bb.sides[0].cats.forEach((c) => (c.hp = Math.round(c.maxHp * 0.3))));
    expect(fxOf(hurt.r.events, 'mdpBox')[0].n).toBe(1);
    expect(hurt.b.sides[0].cats.every((c) => c.ko || c.hp > Math.round(c.maxHp * 0.3))).toBe(true);
    const shielded = fireMd('xp_michincipe', 77, {}, (bb) => (bb.sides[1].cats[0].shields = 2));
    expect(fxOf(shielded.r.events, 'mdpBox')[0].n).toBe(2);
    expect(shielded.b.sides[1].cats.every((c) => c.shields === 0)).toBe(true);
  },
  xp_garjona: ({ ev }) => {
    expect(structDmg(ev) + catDmg(ev)).toBeGreaterThan(0);
    // your windows and the statuses you left last 2 turns more
    const z = fireMd('xp_garjona', 77, {}, (bb) => {
      K.S(bb).rubber[0] = { now: true, next: 1 };
      bb.sides[1].ship.cells()[0].status.burning = 2;
    });
    expect(K.S(z.b).rubber[0].next).toBe(3);
    expect(z.b.sides[1].ship.cells()[0].status.burning ?? 0).toBeGreaterThanOrEqual(4);
    expect(KD.peekD(z.b)!.marked.size).toBe(1);
    expect(has(z.r.events, 'mdpMarked')).toBe(true);
  },
  xp_shakimiau: ({ ev }) => {
    expect(structDmg(ev)).toBeGreaterThan(0);
    const z = fireMd('xp_shakimiau', 77, {}, (bb) => bb.sides[1].ship.cells().forEach((c, i) => i % 2 === 0 && (c.hp = Math.round(c.maxHp * 0.28))));
    expect(fxOf(z.r.events, 'mdpQuake')[0].n).toBeGreaterThan(0);
    expect(chunks(z.r.events)).toEqual([]);
    expect(coreOf(z.b).alive).toBe(true);
    expect(z.b.winner).toBe(null);
  },
  xp_miaucol: ({ b, ev }) => {
    expect(fxOf(ev, 'mdpDunk')[0].n).toBe(0);
    expect(structDmg(ev)).toBeGreaterThan(0);
    expect(b.sides[1].cats.some((c) => c.stunned >= 2)).toBe(true);
    const z = fireMd('xp_miaucol', 77, {}, (bb) => {
      const c = bb.sides[1].cats[2];
      c.hp = 0;
      c.ko = true;
    });
    expect(fxOf(z.r.events, 'mdpDunk')[0].n).toBe(1);
    expect(structDmg(z.r.events)).toBeGreaterThan(structDmg(ev) * 0.9);
  },
};

describe('tanda 2: player side only — the same cat on the enemy side plays exactly as before', () => {
  for (const id of IDS) {
    it(`${id} as an enemy: identical battle with the powers on or off`, () => {
      const run = () => {
        const log: string[] = [];
        const s = spec(id, { enemySide: true });
        s.enemy.cats[0].ultStart = 1;
        const res = autoBattle(s, DIFFICULTY.normal, 4242, 12, (bb, side, shot) => log.push(`${bb.turn}|${side}|${shot}|${bb.sides[0].ship.cells().reduce((a, c) => a + c.hp, 0)}`));
        return { log, res };
      };
      const on = run();
      MD.MD_TUNE.on = false;
      let off: ReturnType<typeof run>;
      try {
        off = run();
      } finally {
        MD.MD_TUNE.on = true;
      }
      expect(on.log).toEqual(off.log);
      expect(on.res).toEqual(off.res);
      const b = makeBattle(spec(id, { enemySide: true }), 31);
      b.startTurn(0);
      b.endTurn();
      b.startTurn(1);
      const c = b.sides[1].cats[0];
      c.ultCharge = 1;
      const a = aimFrom(b, 1, b.muzzle(1, c.def.uid), c.def.ultimate!, 1, 0, b.shipCenter(0));
      const r = b.fire(1, c.def.uid, a.angle, a.power, true);
      expect(r.events.some((e) => e.k === 'ultfx' && (e.fx === 'md' || e.fx.startsWith('mdp')))).toBe(false);
      expect(K.peek(b)).toBeUndefined();
    });
  }
});

describe('tanda 2: determinism, the AI, caps, ★5, chips, tallies', () => {
  const breathe = () => new Promise((r) => setImmediate(r));
  it('same seed → same battle (crews of three tanda-2 Multidimensionals)', async () => {
    for (let i = 0; i < IDS.length; i += 3) {
      const trio = IDS.slice(i, i + 3);
      const s = spec(trio[0]);
      s.player.cats = trio.map((id, k) => ({ ...cat(`p${k}`, id, 1, 4), ultStart: 1 }));
      const a: string[] = [];
      const z: string[] = [];
      const r1 = autoBattle(s, DIFFICULTY.boss, 99, 16, (bb, side, shot) => a.push(`${bb.turn}|${side}|${shot}|${bb.sides[1].ship.cells().reduce((q, c) => q + c.hp, 0)}`));
      const r2 = autoBattle(structuredClone({ ...s, onEnd: undefined }) as Spec, DIFFICULTY.boss, 99, 16, (bb, side, shot) => z.push(`${bb.turn}|${side}|${shot}|${bb.sides[1].ship.cells().reduce((q, c) => q + c.hp, 0)}`));
      expect(a, trio.join()).toEqual(z);
      expect(r1).toEqual(r2);
      await breathe();
    }
  });
  it('the AI fires every tanda-2 power in a full auto battle (no softlocks, no NaN, no runaway turns)', async () => {
    for (const id of IDS) {
      const s = spec(id);
      s.player.cats = [{ ...s.player.cats[0], ultStart: 1 }, s.player.cats[1]];
      const log: string[] = [];
      const r = autoBattle(s, DIFFICULTY.boss, 1234, 30, (bb, side, shot) => log.push(`${side}|${shot}`));
      expect(log.some((l) => l.startsWith('0|p0(ULT)')), id).toBe(true);
      expect(Number.isFinite(r.hullLost), id).toBe(true);
      expect(r.turns, id).toBeLessThanOrEqual(31);
      await breathe();
    }
  });
  it('against a boss the cap is 18 % (every tanda-2 power, your crew hurt)', () => {
    for (const id of IDS) {
      const { r, before, b } = fireMd(id, 5, { boss: true }, (bb) => bb.sides[0].cats.forEach((c) => (c.hp = Math.round(c.maxHp * 0.2))));
      expect(structDmg(r.events), id).toBeLessThanOrEqual(Math.round(before.max * MD.MD_TUNE.bossFrac) + 1);
      expect(b.winner, id).toBe(null);
    }
  });
  it('the delayed blows keep their own cap (the sun, the pearl, the lone ribbons)', () => {
    for (const id of ['xp_bastet', 'xp_cleogatra', 'xp_sombreronron']) {
      const { b, before } = fireMd(id, 9, { boss: true });
      if (id === 'xp_bastet') KD.peekD(b)!.guard!.rays = 40;
      if (id === 'xp_sombreronron') KD.peekD(b)!.braid!.pins.push(b.shipCenter(1), { x: b.shipCenter(1).x + 30, y: b.shipCenter(1).y });
      if (id === 'xp_cleogatra') KD.peekD(b)!.wager!.theirs0 += 1e6;
      let total = 0;
      for (let t = 0; t < 4; t++) {
        total += structDmg(toEnemy(b), 1) + structDmg(drain(b), 1);
        total += structDmg(toMine(b), 1) + structDmg(drain(b), 1);
      }
      expect(total, id).toBeGreaterThan(0);
      expect(total, id).toBeLessThanOrEqual(Math.round(before.max * MD.MD_TUNE.bossFrac) + 2);
    }
  });
  it('★5: every tanda-2 power twice per battle', () => {
    for (const id of IDS) {
      const b = makeBattle(spec(id, { stars: 5 }), 8);
      expect(b.sides[0].cats[0].def.ultimate!.limits?.usesPerBattle, id).toBe(2);
    }
    const b = makeBattle(spec('xp_tetrimiau', { stars: 5 }), 8);
    b.startTurn(0);
    const me = b.sides[0].cats[0];
    for (let k = 0; k < 2; k++) {
      me.ultCharge = 1;
      me.cooldown = 0;
      me.stunned = 0;
      expect(b.canUlt(me)).toBe(true);
      expect(has(b.fire(0, 'p0', -0.6, 900, true).events, 'mdpLine')).toBe(true);
    }
    me.ultCharge = 1;
    expect(b.canUlt(me)).toBe(false);
  });
  it('chips are readable for every tanda-2 power (no undefined, no NaN), and the box says what it would bring', async () => {
    for (const id of IDS) {
      const { b } = fireMd(id);
      for (let t = 0; t < 2; t++) {
        const [e, p] = MD.mdChips(b);
        for (const c of [...e, ...p]) expect(c.text, id).not.toMatch(/undefined|NaN/);
        toEnemy(b);
        toMine(b);
      }
      await breathe();
    }
    const b = makeBattle(spec('xp_michincipe'), 3);
    expect(MD.mdChips(b)[1].map((c) => c.text).join()).toMatch(/LA CAJA TRAE/);
    expect(K.peek(b)).toBeUndefined();
  });
  it('the tallies (Doc Miauwn, Felinamente, Garjona) open the state at the first shot only when one of them sails with you', () => {
    for (const id of ['xp_docmiauwn', 'xp_felinamente', 'xp_garjona']) {
      const b = makeBattle(spec(id), 4);
      b.startTurn(0);
      shoot(b, 0, 'p1');
      expect(KD.peekD(b), id).toBeTruthy();
    }
    const b = makeBattle(spec('xp_gatejo'), 4);
    b.startTurn(0);
    shoot(b, 0, 'p1');
    b.endTurn();
    b.startTurn(1);
    shoot(b, 1, 'e0');
    expect(K.peek(b)).toBeUndefined();
  });
});
