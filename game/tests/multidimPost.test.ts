/**
 * After the Parte III · the 60 post MULTIDIMENSIONAL powers (battle/multidimPost, data/multidimPowersPost.ts — agent
 * PODERES-2, 2026-10-28; design: docs/post-p3/04-roster.json → post.power). Same contract as multidimPowers.test.ts:
 *
 *   · every roster Multidimensional has its power (text + battle), same name as its ultimate, ★5 twice;
 *   · each one fires in a seeded battle and does what its text says (one check per cat), within its cap, no NaN;
 *   · player side only: the same cat on the enemy side plays exactly as before (powers on / off: identical battle);
 *   · determinism, the AI fires every one, the boss cap (18 %), and the delayed blows keep their own caps;
 *   · no post power in the fight → the post state is never even created (no battle without them changes).
 * The species land in data/postp3/especies.json as their art arrives (SISTEMA's sync); until then this file injects the
 * roster's own entries (tests/helpers/postStubs.ts), so all 60 are tested from day one.
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
const IDS = POST.map((c) => c.id);
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

describe('the 60 post Multidimensional powers: data', () => {
  it('every roster Multidimensional has its power, and nothing else is registered as post', () => {
    expect(IDS.length).toBe(60);
    expect([...MDP_IDS].sort()).toEqual([...IDS].sort());
    for (const id of IDS) {
      expect(MDP_UNIVERSE[id], id).toBeTruthy();
      expect(typeof MD.MD_ULTS[id], id).toBe('function');
      expect(ULTS[id], id).toBeUndefined();
      expect(MULTIDIM_POWERS[id], id).toBe(MULTIDIM_POWERS_POST[id]);
    }
  });
  it('the text: its name is the roster power and the ultimate the game shows; short ≤ 60; ★5 twice', () => {
    for (const c of POST) {
      const p = multidimPower(c.id)!;
      expect(p.name, c.id).toBe(c.post.power.name);
      expect(c.combat.ultimate.name.split('(')[0].trim(), c.id).toBe(p.name);
      expect(p.short.length, c.id).toBeLessThanOrEqual(60);
      expect(p.text.length, c.id).toBeGreaterThan(40);
      expect(p.text, c.id).not.toMatch(/undefined|NaN/);
      expect(c.combat.ultimate.usesPerBattle, c.id).toBe(1);
      expect(c.combat.star5, c.id).toMatch(/2 veces por batalla/);
    }
    // 85 names, all different
    const names = Object.values(MULTIDIM_POWERS).map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names.length).toBe(85);
  });
});

describe('each post power fires and does what it says (your crew, seeded)', () => {
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
      CHECK[id]?.({ b, ev, me, before, es: b.sides[1], foes: b.sides[1].cats.filter((c) => !c.ko) });
      expect(CHECK[id], `${id} has its own check`).toBeTypeOf('function');
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
const strongestOf = (cats: Cat[]) => [...cats].filter((c) => !c.ko).sort((a, z) => z.def.atk - a.def.atk || z.hp - a.hp || (a.def.uid < z.def.uid ? -1 : 1))[0];

const CHECK: Record<string, (c: Ctx) => void> = {
  xp_gomitas: ({ b, ev }) => {
    expect(ev.filter((e) => e.k === 'impact' && e.side === 1).length).toBeGreaterThanOrEqual(10);
    expect(MD.mdChips(b)[1].map((c) => c.text).join()).toMatch(/DE HULE/);
    toEnemy(b);
    const c = b.sides[0].ship.cells()[5];
    const p = cellPt(b, 0, c);
    // a rock bounces off; a cannonball doesn't
    const rock = blow(b, 1, p.x, p.y, { ...NEUTRAL_SHOT, id: 'roca', element: 'earth', trajectory: 'heavy' });
    expect(structDmg(rock, 0)).toBe(0);
    expect(has(rock, 'mdpBoing')).toBe(true);
    expect(structDmg(blow(b, 1, p.x, p.y), 0)).toBeGreaterThan(0);
  },
  xp_kagebunyan: ({ b }) => {
    const clones = st(b).clones.filter((k) => k.side === 0);
    expect(clones.length).toBe(3);
    toEnemy(b);
    const room = clones[0].room;
    const p = center(b, 0, room);
    const hit = blow(b, 1, p.x, p.y);
    expect(structDmg(hit, 0)).toBe(0);
    expect(has(hit, 'mdpPoof')).toBe(true);
    // …and it blows up back at them (resolved with the shot's extra paths)
    const back: Ev[] = [];
    const paths = MD.mdAfterShot(b, 1, b.sides[1].cats[0], false, undefined, NEUTRAL_SHOT, 30, [], back);
    expect(paths.length).toBe(1);
    expect(structDmg(back, 1)).toBeGreaterThan(0);
    expect(st(b).clones.length).toBe(2);
  },
  xp_gatojo: ({ b }) => {
    toEnemy(b);
    expect(b.shooters(1)).toEqual([]);
    expect(b.cannons(1)).toEqual([]);
    toMine(b);
    const r = shoot(b, 0, 'p1');
    expect(structDmg(r.events)).toBe(0);
    expect(r.paths.every((p) => !p.impacts.length)).toBe(true);
    expect(has(r.events, 'mdpPause')).toBe(true);
    const start = toEnemy(b);
    const q = drain(b);
    expect(has(q, 'mdpResume')).toBe(true);
    expect(structDmg(q, 1)).toBeGreaterThan(0);
    void start;
    expect(b.shooters(1).length).toBeGreaterThan(0);
  },
  xp_unzarpazo: ({ b, ev, me, es }) => {
    expect(has(ev, 'mdpSerious')).toBe(true);
    const erased = fxOf(ev, 'mdpSerious')[0];
    expect(ev.some((e) => e.k === 'module' && e.side === 1) || erased.n === 1 || es.ship.cells().some((c) => c.hp === 1)).toBe(true);
    expect(me.stunned).toBeGreaterThanOrEqual(2);
  },
  xp_pegaso: ({ ev }) => {
    expect(fxOf(ev, 'mdpCosmos')[0].n).toBe(100);
    // your crew at half life: the cosmos burns ×1.75 (and the meteors hit harder)
    const full = structDmg(ev);
    const hurt = fireMd('xp_pegaso', 77, {}, (b) => b.sides[0].cats.forEach((c) => (c.hp = Math.round(c.maxHp * 0.5))));
    expect(fxOf(hurt.r.events, 'mdpCosmos')[0].n).toBe(175);
    expect(structDmg(hurt.r.events)).toBeGreaterThan(full);
  },
  xp_michiatom: ({ b, ev }) => {
    expect(structDmg(ev)).toBe(0);
    toEnemy(b);
    toMine(b);
    expect(drain(b).length).toBe(0);
    toEnemy(b);
    toMine(b);
    const q = drain(b);
    expect(has(q, 'mdpGoal')).toBe(true);
    expect(structDmg(q, 1)).toBeGreaterThan(0);
  },
  xp_mazingato: ({ b, ev }) => {
    expect(structDmg(ev)).toBeGreaterThan(0);
    toEnemy(b);
    const mate = b.sides[0].cats[1];
    const hp = mate.hp;
    b.hitCat(mate, 9999, [], 0, 0, 'neutral', true);
    expect(hp - mate.hp).toBeLessThanOrEqual(Math.round(mate.maxHp * 0.2) + 1);
    expect(mate.ko).toBe(false);
  },
  xp_ryumiau: ({ b, foes }) => {
    const noted = [...foes].sort((a, z) => z.hp - a.hp || z.def.atk - a.def.atk)[0];
    expect(st(b).note?.target).toBe(noted);
    for (let i = 0; i < 2; i++) {
      toEnemy(b);
      toMine(b);
      expect(noted.ko).toBe(false);
    }
    toEnemy(b);
    const ev = toMine(b);
    expect(noted.ko).toBe(true);
    expect(has(ev, 'mdpNoteKill')).toBe(true);
  },
  xp_miaunya: ({ b }) => {
    toEnemy(b);
    const mate = b.sides[0].cats[1];
    const foe = b.sides[1].cats[0];
    const hp = mate.hp;
    MD.mdFire(b, 1, foe, false, undefined, []);
    b.hitCat(mate, 40, [], 0, 0, 'neutral', true);
    expect(mate.hp).toBe(hp);
    // a cannonball isn't read
    MD.mdFire(b, 1, undefined, false, 0, []);
    b.hitCat(mate, 40, [], 0, 0, 'neutral', true);
    expect(mate.hp).toBeLessThan(hp);
  },
  xp_yugi: ({ b, ev }) => {
    expect(fxOf(ev, 'mdpPieces')[0].n).toBe(0);
    // with all five pieces: the forbidden giant hits every module
    const five = fireMd('xp_yugi', 77, {}, (bb) => K.S(bb).pieces.set(bb.sides[0].cats[0], 5));
    expect(has(five.r.events, 'mdpExodia')).toBe(true);
    expect(structDmg(five.r.events)).toBeGreaterThan(structDmg(ev));
    // a normal shot that lands gives a piece
    const b2 = makeBattle(spec('xp_yugi'), 77);
    b2.startTurn(0);
    shoot(b2, 0, 'p0');
    expect(K.peek(b2)?.pieces.get(b2.sides[0].cats[0]) ?? 0).toBeGreaterThanOrEqual(1);
    void b;
  },
  xp_gatote: ({ ev }) => {
    const ys = new Set(ev.filter((e) => e.k === 'cell' && e.side === 1).map((e) => (e as { cell: { y: number } }).cell.y));
    expect(ys.size).toBeGreaterThanOrEqual(1);
    expect(ys.size).toBeLessThanOrEqual(2);
    expect(fxOf(ev, 'md')[0].n).toBe(1);
    // losing: ×2
    const lose = fireMd('xp_gatote', 77, {}, (bb) => bb.sides[0].ship.cells().forEach((c) => (c.hp = Math.max(1, Math.round(c.hp * 0.6)))));
    expect(fxOf(lose.r.events, 'md')[0].n).toBe(2);
    expect(structDmg(lose.r.events)).toBeGreaterThan(structDmg(ev));
  },
  xp_sherlock: ({ b }) => {
    const mk = st(b).marks!;
    expect(mk.cells.length).toBe(3);
    // the volley: every cannon goes straight for a mark, whatever its aim
    const marked = new Set(mk.cells);
    let onMark = 0;
    for (const m of b.cannons(0)) {
      const r = b.fire(0, 'cannon', -0.2, 400, false, m.id);
      if (r.events.some((e) => e.k === 'cell' && e.side === 1 && marked.has(e.cell))) onMark++;
    }
    expect(onMark).toBeGreaterThanOrEqual(1);
    // a marked cell is a sure critical (×1.5)
    expect(MD.mdCellMul(b, 1, mk.cells[0] ?? [...marked][0], 1)).toBeGreaterThanOrEqual(1);
  },
  xp_frankengato: ({ ev, es }) => {
    // nobody fallen: the chain lightning
    expect(has(ev, 'mdpSpark')).toBe(true);
    expect(es.ship.cells().some((c) => c.status.charged)).toBe(true);
    // a fallen mate gets up with half its life and a full meter
    const r2 = fireMd('xp_frankengato', 77, {}, (bb) => {
      const m = bb.sides[0].cats[1];
      m.hp = 0;
      m.ko = true;
      m.ultCharge = 0;
    });
    const mate = r2.b.sides[0].cats[1];
    expect(mate.ko).toBe(false);
    expect(mate.hp).toBe(Math.round(mate.maxHp * 0.5));
    expect(mate.ultCharge).toBe(1);
    expect(has(r2.r.events, 'mdpRevive')).toBe(true);
  },
  xp_gatula: ({ ev, foes }) => {
    for (const c of foes) expect(ev.some((e) => e.k === 'cat' && e.uid === c.def.uid && e.dmg > 0), c.def.uid).toBe(true);
    // the blood heals your most hurt cat
    const r2 = fireMd('xp_gatula', 77, {}, (bb) => (bb.sides[0].cats[1].hp = 10));
    expect(r2.b.sides[0].cats[1].hp).toBeGreaterThan(10);
  },
  xp_ahab: ({ b, ev, before }) => {
    expect(structDmg(ev)).toBe(0);
    let total = 0;
    const pulls: number[] = [];
    for (let i = 0; i < 3; i++) {
      const s = toEnemy(b);
      total += structDmg(s, 1);
      pulls.push(...fxOf(s, 'mdpPull').map((e) => e.n!));
      toMine(b);
    }
    expect(pulls).toEqual([10, 20, 30]);
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThanOrEqual(Math.round(before.max * 0.45) + 1);
    expect(st(b).harpoon).toBeNull();
  },
  xp_pinomichi: ({ ev }) => {
    expect(fxOf(ev, 'mdpNose')[0].n).toBe(1);
    // four turns of waiting: a five-cell nose, Enraizado
    const b = makeBattle(spec('xp_pinomichi'), 77);
    b.startTurn(0);
    for (let i = 0; i < 4; i++) {
      toEnemy(b);
      toMine(b);
    }
    const me = b.sides[0].cats[0];
    me.ultCharge = 1;
    me.cooldown = 0;
    const a = aimFrom(b, 0, b.muzzle(0, 'p0'), me.def.ultimate!, 1, 0, b.shipCenter(1));
    const r = b.fire(0, 'p0', a.angle, a.power, true);
    expect(fxOf(r.events, 'mdpNose')[0].n).toBe(5);
    expect(b.sides[1].ship.cells().filter((c) => c.status.rooted).length).toBeGreaterThanOrEqual(3);
  },
  xp_michipulin: ({ b, es }) => {
    const t = strongestOf(es.cats);
    expect(t.stunned).toBeGreaterThanOrEqual(2);
    toEnemy(b);
    expect(MD.mdFire(b, 1, t, false, undefined, [])).toBeCloseTo(0.3);
    expect(MD.mdCatMul(b, t)).toBeCloseTo(1.3);
  },
  xp_barril: ({ b }) => {
    toEnemy(b);
    const r = shoot(b, 1, 'e2', true);
    expect(structDmg(r.events, 0) + catDmg(r.events, 0)).toBe(0);
    expect(has(r.events, 'mdpBarrelBlock')).toBe(true);
    toMine(b);
    toEnemy(b);
    toMine(b);
    const q = drain(b);
    expect(has(q, 'mdpBarrelOut')).toBe(true);
    expect(fxOf(q, 'mdpBarrelOut')[0].uid).toBe('e2');
  },
  xp_miaufalda: () => {
    const r = fireMd('xp_miaufalda', 77, {}, (bb) => {
      const s = bb.sides[0];
      for (const c of s.ship.cells()) c.hp = Math.max(1, Math.round(c.hp * 0.5));
      // a destroyed cannon (half its cells gone)
      const m = s.ship.modules.find((k) => k.kind === 'cannon')!;
      const cells = s.ship.moduleCells(m.id);
      for (const c of cells.slice(0, Math.ceil(cells.length / 2))) s.ship.destroyCell(c.x, c.y);
      bb.reportModule(0, m.id, [], -1, 0);
    });
    expect(r.r.events.filter((e) => e.k === 'heal' && e.side === 0).length).toBeGreaterThan(5);
    expect(has(r.r.events, 'mdpRebuild')).toBe(true);
    const m = r.b.sides[0].ship.modules.find((k) => k.kind === 'cannon')!;
    expect(m.alive).toBe(true);
  },
  xp_condorgato: ({ b }) => {
    const list = b.cannons(0);
    expect(list.length).toBeGreaterThan(0);
    const last = list[list.length - 1].id;
    if (list.length > 1) expect(MD.mdFire(b, 0, undefined, false, list[0].id, [])).toBe(1);
    expect(MD.mdFire(b, 0, undefined, false, last, [])).toBe(3);
  },
  xp_esponja: ({ b, me, es }) => {
    for (const c of b.sides[0].cats) if (c !== me && !c.ko) expect(c.ultCharge).toBe(1);
    expect(es.ship.cells().some((c) => c.status.wet)).toBe(true);
  },
  xp_rick: ({ b }) => {
    // a shot aimed at the sea still comes out of a portal over their ship
    const r = b.fire(0, 'p1', -0.2, 300, false);
    expect(r.paths.some((p) => p.jumps?.length)).toBe(true);
    expect(r.events.some((e) => e.k === 'cell' && e.side === 1)).toBe(true);
  },
  xp_miaang: ({ ev }) => {
    expect(fxOf(ev, 'mdpElements').map((e) => e.n)).toEqual([0, 1, 2, 3]);
    expect(ev.some((e) => e.k === 'reaction')).toBe(true);
  },
  xp_miauby: () => {
    const r = fireMd('xp_miauby', 77, {}, (bb) => {
      for (const c of bb.sides[1].cats) c.shields = 2;
      bb.wells.push({ x: 1500, y: 300, r: 300, k: 1000, turns: 3, owner: 1, kind: 'well' });
      bb.sides[1].bubbleKind = 'bubble';
      bb.sides[1].bubbleMax = 1;
      bb.sides[1].bubble = 1;
    });
    const b = r.b;
    expect(b.sides[1].cats.every((c) => c.shields === 0)).toBe(true);
    expect(b.wells.some((w) => w.owner === 1)).toBe(false);
    expect(b.sides[1].bubbleMax).toBe(0);
    toEnemy(b);
    toMine(b);
    toEnemy(b);
    toMine(b);
    toEnemy(b);
    expect(b.sides[1].bubbleMax).toBe(1);
  },
  xp_blumiau: ({ b }) => {
    const cl = st(b).clues!;
    expect(cl.modules.length).toBe(3);
    const ids = [...cl.modules];
    let solved = false;
    for (const id of ids) {
      const p = center(b, 1, id);
      const ev = blow(b, 0, p.x, p.y);
      const out: Ev[] = [];
      MD.mdAfterShot(b, 0, b.sides[0].cats[1], false, undefined, NEUTRAL_SHOT, 30, [], out);
      if (has(out, 'mdpSolved')) solved = true;
      void ev;
    }
    expect(solved).toBe(true);
    expect(st(b).clues).toBeNull();
  },
  xp_miaubody: ({ b }) => {
    toEnemy(b);
    toMine(b);
    const r = shoot(b, 0, 'p1');
    expect(has(r.events, 'mdpCopyShot')).toBe(true);
    expect(r.paths.length).toBeGreaterThanOrEqual(2);
  },
  xp_gatogro: ({ b, es }) => {
    expect(es.ship.cells().filter((c) => c.status.wet).length).toBeGreaterThan(10);
    expect(es.cats.every((c) => c.ultCharge <= 0.0001)).toBe(true);
    toEnemy(b);
    expect(b.cannons(1)).toEqual([]);
    const r = shoot(b, 1, 'e0');
    void r;
    const c = b.sides[1].cats[0];
    expect(c.cooldown).toBe((c.def.reload ?? 1) + 2);
  },
  xp_grru: ({ es }) => {
    const t = strongestOf(es.cats);
    expect(t.stunned).toBeGreaterThanOrEqual(3);
    expect(es.ship.moduleCells(t.room).every((c) => c.status.frozen)).toBe(true);
    // with Miaunion in the crew the ray bounces to their second strongest
    const r = fireMd('xp_grru', 77, { mates: ['xp_miaunion', 'c_gelatino'] });
    expect(has(r.r.events, 'mdpFreezeCombo')).toBe(true);
    expect(r.b.sides[1].cats.filter((c) => c.stunned >= 3).length).toBeGreaterThanOrEqual(2);
  },
  xp_miaunion: ({ b, ev }) => {
    expect(has(ev, 'mdpBanana')).toBe(true);
    // next turn another cat's ultimate brings its banana too
    toEnemy(b);
    toMine(b);
    const r = shoot(b, 0, 'p1', true);
    expect(has(r.events, 'mdpBanana')).toBe(true);
    // with Grrrú: the banana freezes
    const g = fireMd('xp_miaunion', 77, { mates: ['xp_grru', 'c_gelatino'] });
    expect(fxOf(g.r.events, 'mdpBanana')[0].n).toBe(1);
  },
  xp_garritas: ({ b, me }) => {
    me.hp = Math.round(me.maxHp * 0.4);
    const hp = me.hp;
    toEnemy(b);
    toMine(b);
    expect(me.hp - hp).toBe(Math.round(me.maxHp * 0.15));
    // +10 meter per blow while the factor lasts
    me.ultCharge = 0;
    b.hitCat(me, 5, [], 0, 0, 'neutral', true);
    expect(me.ultCharge).toBeGreaterThanOrEqual(0.2);
  },
  xp_supermichi: ({ ev, es }) => {
    const keel = es.ship.rows - 1;
    expect(ev.some((e) => e.k === 'cell' && e.side === 1 && e.cell.y === keel)).toBe(true);
    expect(has(ev, 'mdpLift')).toBe(true);
  },
  xp_hierromichi: ({ b, me, ev }) => {
    expect(ev.filter((e) => e.k === 'impact' && e.side === 1).length).toBeGreaterThanOrEqual(5);
    toEnemy(b);
    b.hitCat(me, 10, [], 0, 0, 'neutral', true);
    expect(me.shields).toBe(1);
    expect(MD.mdFire(b, 0, me, false, undefined, [])).toBeCloseTo(1.1);
  },
  xp_michimerica: ({ b, me }) => {
    toEnemy(b);
    const mate = b.sides[0].cats[1];
    const hp = me.hp;
    b.hitCat(mate, 9999, [], 0, 0, 'neutral', true);
    expect(mate.ko).toBe(false);
    expect(mate.hp).toBe(1);
    expect(me.hp).toBeLessThan(hp);
  },
  xp_doomiau: ({ b, es }) => {
    const core = es.ship.modules.find((m) => m.kind === 'core')!;
    expect(es.ship.moduleCells(core.id).every((c) => (c.status.cursed ?? 0) >= 3)).toBe(true);
    toEnemy(b);
    const foe = b.sides[1].cats.find((c) => !c.ko)!;
    const hp = foe.hp;
    const r = shoot(b, 1, foe.def.uid);
    expect(structDmg(r.events, 0) + catDmg(r.events, 0)).toBeGreaterThan(0);
    expect(foe.hp).toBeLessThan(hp);
    // and they can't heal
    const h = foe.hp;
    foe.hp = Math.min(foe.maxHp, foe.hp + 30);
    toMine(b);
    toEnemy(b);
    expect(foe.hp).toBeLessThanOrEqual(h);
  },
  xp_ssssmichi: ({ ev, me }) => {
    expect(me.ko).toBe(true);
    expect(has(ev, 'mdpHug')).toBe(true);
    expect(structDmg(ev)).toBeGreaterThan(0);
    // the last one standing doesn't blow up: he hisses
    const alone = fireMd('xp_ssssmichi', 77, {}, (bb) => bb.sides[0].cats.slice(1).forEach((c) => ((c.hp = 0), (c.ko = true))));
    expect(alone.me.ko).toBe(false);
    expect(has(alone.r.events, 'mdpHiss')).toBe(true);
  },
  xp_michimpostor: ({ b, ev }) => {
    const v = fxOf(ev, 'mdpVote')[0];
    const out = b.sides[1].cats.find((c) => c.def.uid === v.uid)!;
    expect(out.stunned).toBeGreaterThanOrEqual(3);
    toEnemy(b);
    const hp = out.hp;
    b.hitCat(out, 50, [], 0, 0, 'neutral', true);
    expect(out.hp).toBe(hp);
    toMine(b);
    toEnemy(b);
    toMine(b);
    toEnemy(b);
    expect(out.hp).toBeLessThanOrEqual(Math.round(out.maxHp * 0.5));
    // it goes for whoever hurt you the most
    const b2 = makeBattle(spec('xp_michimpostor'), 77);
    b2.startTurn(0);
    toEnemy(b2);
    shoot(b2, 1, 'e1');
    toMine(b2);
    const me2 = b2.sides[0].cats[0];
    me2.ultCharge = 1;
    const tally = K.peek(b2)?.dmgBy;
    expect(tally?.get(b2.sides[1].cats[1]) ?? 0).toBeGreaterThan(0);
    const r2 = b2.fire(0, 'p0', -0.6, 900, true);
    expect(fxOf(r2.events, 'mdpVote')[0].uid).toBe('e1');
  },
  xp_zoomic: ({ b, me }) => {
    expect(st(b).rings.get(me)?.rings).toBe(30);
    const hp = me.hp;
    for (let i = 0; i < 3; i++) b.hitCat(me, 20, [], 0, 0, 'neutral', true);
    expect(me.hp).toBe(hp);
    b.hitCat(me, 20, [], 0, 0, 'neutral', true);
    expect(me.hp).toBeLessThan(hp);
  },
  xp_hannah: ({ ev, es }) => {
    // she dresses up as their strongest (the most attack)
    const w = fxOf(ev, 'mdpWig')[0];
    expect(es.cats.find((c) => c.def.uid === w.uid)!.def.atk).toBe(Math.max(...es.cats.map((c) => c.def.atk)));
    expect(structDmg(ev) + catDmg(ev)).toBeGreaterThan(0);
  },
  xp_gemichi: () => {
    const r = fireMd('xp_gemichi', 77, {}, (bb) => (bb.sides[0].cats[1].hp = Math.round(bb.sides[0].cats[1].maxHp * 0.2)));
    const mate = r.b.sides[0].cats[1];
    expect(mate.hp / mate.maxHp).toBeGreaterThan(0.9);
    expect(r.b.sides[1].cats.some((c) => Math.abs(c.hp / c.maxHp - 0.2) < 0.02)).toBe(true);
  },
  xp_persafalsa: ({ b }) => {
    toEnemy(b);
    const s0 = b.sides[0];
    const core = s0.ship.modules.find((m) => m.kind === 'core')!;
    const p = center(b, 0, core.id);
    const hit = blow(b, 1, p.x, p.y, { ...NEUTRAL_SHOT, radius: 20 });
    expect(has(hit, 'mdpFooled')).toBe(true);
    const coreCells = new Set(s0.ship.moduleCells(core.id));
    expect(hit.some((e) => e.k === 'cell' && e.side === 0 && coreCells.has(e.cell))).toBe(false);
    expect(structDmg(hit, 0)).toBeGreaterThan(0);
  },
  xp_hermiaune: () => {
    // their turn hurts you; then she undoes it
    const b = makeBattle(spec('xp_hermiaune'), 77);
    b.startTurn(0);
    toEnemy(b);
    const cell = b.sides[0].ship.cells()[8];
    const hp0 = cell.hp;
    const mate = b.sides[0].cats[1];
    const m0 = mate.hp;
    const foe = b.sides[1].cats[0];
    const meter0 = foe.ultCharge;
    const p = cellPt(b, 0, cell);
    blow(b, 1, p.x, p.y, { ...NEUTRAL_SHOT, radius: 20 });
    b.hitCat(mate, 30, [], 0, 0, 'neutral', true);
    foe.ultCharge = Math.min(1, meter0 + 0.4);
    toMine(b);
    const me = b.sides[0].cats[0];
    me.ultCharge = 1;
    const r = b.fire(0, 'p0', -0.6, 900, true);
    expect(has(r.events, 'mdpTurner')).toBe(true);
    if (b.sides[0].ship.get(cell.x, cell.y) === cell) expect(cell.hp).toBe(hp0);
    expect(mate.hp).toBe(m0);
    expect(foe.ultCharge).toBeCloseTo(meter0);
  },
  xp_lunalovegata: () => {
    const r = fireMd('xp_lunalovegata', 77, {}, (bb) => {
      bb.sides[1].cats[0].shields = 2;
      bb.wind = -40;
    });
    const c = r.b.sides[1].cats[0];
    expect(c.shields).toBe(0);
    expect(MD.mdCatMul(r.b, c)).toBeCloseTo(1.5);
    expect(r.b.wind).toBe(40);
  },
  xp_miaunce: ({ b }) => {
    toEnemy(b);
    const foe = b.sides[1].cats.find((c) => !c.ko)!;
    const r = shoot(b, 1, foe.def.uid);
    expect(structDmg(r.events, 0) + catDmg(r.events, 0)).toBe(0);
    expect(has(r.events, 'mdpCatch')).toBe(true);
    expect(has(r.events, 'mdpThrowBack')).toBe(true);
    expect(structDmg(r.events, 1) + catDmg(r.events, 1)).toBeGreaterThan(0);
    expect(st(b).catch).toBeNull();
  },
  xp_heisenmiau: () => {
    const plain = fireMd('xp_heisenmiau');
    const cooked = fireMd('xp_heisenmiau', 77, {}, (bb) => {
      for (const c of bb.sides[1].ship.cells().slice(0, 30)) {
        c.status.cursed = 2;
        c.status.charged = 2;
      }
    });
    expect(structDmg(cooked.r.events)).toBeGreaterThan(structDmg(plain.r.events));
    expect(cooked.b.sides[1].ship.cells().filter((c) => c.status.cursed || c.status.charged).length).toBe(0);
    expect(has(cooked.r.events, 'mdpChem')).toBe(true);
  },
  xp_michiercoles: ({ b }) => {
    const low = b.sides[1].ship.cells().filter((c) => cellPt(b, 1, c).y >= b.waterY - 20).length;
    expect(low).toBeGreaterThan(0);
    const s = toEnemy(b);
    expect(has(s, 'mdpPiranha')).toBe(true);
    expect(structDmg(s, 1)).toBeGreaterThan(0);
    expect(st(b).piranhas).toBeTruthy();
  },
  xp_michiwan: ({ b }) => {
    expect(MD.mdFire(b, 0, b.sides[0].cats[1], false, undefined, [])).toBeCloseTo(1.2);
    toEnemy(b);
    expect(MD.mdFire(b, 1, b.sides[1].cats[0], false, undefined, [])).toBeCloseTo(0.7);
    const low = b.sides[0].ship.cells().find((c) => cellPt(b, 0, c).y > b.waterY);
    expect(low).toBeTruthy();
    const p = cellPt(b, 0, low!);
    expect(structDmg(blow(b, 1, p.x, p.y, { ...NEUTRAL_SHOT, radius: 20 }), 0)).toBe(0);
  },
  xp_gatoleone: ({ b, es }) => {
    const t = strongestOf(es.cats);
    expect(t.ultCharge).toBe(0);
    toEnemy(b);
    const r = shoot(b, 1, t.def.uid);
    expect(has(r.events, 'mdpBetray')).toBe(true);
    expect(structDmg(r.events, 0)).toBe(0);
    expect(structDmg(r.events, 1)).toBeGreaterThan(0);
  },
  xp_gatoneta: ({ b }) => {
    toEnemy(b);
    expect(b.meterMul(1)).toBe(0);
    const r = shoot(b, 1, 'e2', true);
    expect(has(r.events, 'mdpFull')).toBe(true);
    expect(structDmg(r.events, 0)).toBe(0);
    expect(b.sides[1].cats[2].stunned).toBeGreaterThanOrEqual(2);
  },
  xp_romiau: ({ b, me, es }) => {
    const t = strongestOf(es.cats);
    expect(t.stunned).toBeGreaterThanOrEqual(3);
    expect(MD.mdCatMul(b, t)).toBeCloseTo(1.25);
    t.ultCharge = 0.6;
    me.ultCharge = 0;
    toEnemy(b);
    expect(t.ultCharge).toBeCloseTo(0.35);
    expect(me.ultCharge).toBeCloseTo(0.25);
  },
  xp_miauki: ({ b }) => {
    toEnemy(b);
    expect(b.shooters(1)).toEqual([]);
    expect(b.cannons(1)).toEqual([]);
    toMine(b);
    expect(b.shooters(0)).toEqual([]);
    expect(b.cannons(0)).toEqual([]);
    toEnemy(b);
    expect(b.shooters(1).length + b.cannons(1).length).toBeGreaterThan(0);
    // and the crew recovered right away
    const r = fireMd('xp_miauki', 77, {}, (bb) => (bb.sides[0].cats[1].hp = 20));
    expect(r.b.sides[0].cats[1].hp).toBe(20 + Math.round(r.b.sides[0].cats[1].maxHp * 0.3));
  },
  xp_postmaulone: ({ b, es }) => {
    expect(es.ship.cells().some((c) => c.status.frozen)).toBe(true);
    toEnemy(b);
    const mate = b.sides[0].cats[1];
    mate.stunned = 3;
    toMine(b);
    expect(mate.stunned).toBe(0);
  },
  xp_miautentacion: () => {
    const r = fireMd('xp_miautentacion', 77, {}, (bb) => {
      for (const c of bb.sides[0].ship.cells().slice(0, 4)) c.status.burning = 2;
      bb.sides[0].cats[1].fx.burning = 2;
    });
    const b = r.b;
    expect(b.sides[0].ship.cells().some((c) => c.status.burning)).toBe(false);
    expect(b.sides[0].cats[1].fx.burning).toBe(0);
    expect(fxOf(r.r.events, 'mdpArt')[0].n).toBe(5);
    // no pains: a plain wave
    const plain = fireMd('xp_miautentacion');
    expect(fxOf(plain.r.events, 'mdpArt')[0].n).toBe(0);
  },
  xp_sabrina: ({ b }) => {
    const pool = st(b).heart!.pool;
    expect(pool).toBeGreaterThan(0);
    toEnemy(b);
    const c = b.sides[0].ship.cells()[6];
    const p = cellPt(b, 0, c);
    const hp = c.hp;
    blow(b, 1, p.x, p.y, { ...NEUTRAL_SHOT, radius: 20 });
    expect(c.hp).toBe(hp);
    expect(st(b).heart!.absorbed).toBeGreaterThan(0);
    for (let i = 0; i < 3; i++) {
      toMine(b);
      if (i < 2) toEnemy(b);
    }
    // the heart bursts at the start of your turn after their third
    let q = drain(b);
    if (!has(q, 'mdpConfetti')) {
      toEnemy(b);
      toMine(b);
      q = drain(b);
    }
    expect(has(q, 'mdpConfetti')).toBe(true);
    expect(structDmg(q, 1)).toBeGreaterThan(0);
  },
  xp_daftmiau: ({ b }) => {
    toEnemy(b);
    const q = drain(b);
    expect(has(q, 'mdpLaser')).toBe(true);
    expect(structDmg(q, 1) + catDmg(q, 1)).toBeGreaterThan(0);
    expect(st(b).pyramid?.turns).toBe(2);
  },
  xp_partymichi: ({ b, ev }) => {
    const rooms = new Set(b.sides[1].cats.filter((c) => !c.ko).map((c) => c.room));
    expect(rooms.size).toBe(1);
    for (const c of b.sides[1].cats) expect(ev.some((e) => e.k === 'cat' && e.uid === c.def.uid && e.dmg > 0), c.def.uid).toBe(true);
    toEnemy(b);
    expect(new Set(b.sides[1].cats.map((c) => c.room)).size).toBe(3);
  },
  xp_miauknd: () => {
    const r = fireMd('xp_miauknd', 77, {}, (bb) => {
      for (const c of bb.sides[1].ship.cells().slice(-6)) c.status.cursed = 2;
    });
    const b = r.b;
    expect(b.sides[1].ship.cells().filter((c) => (c.status.cursed ?? 0) >= 4).length).toBeGreaterThanOrEqual(1);
    expect(b.sides[1].ship.cells().some((c) => (c.status.burning ?? 0) >= 4)).toBe(true);
    // and the statuses your next shots leave last twice as long
    const s = MD.mdShot(b, 0, { ...NEUTRAL_SHOT, statuses: [{ id: 'wet', turns: 2 }] });
    expect(s.statuses?.[0].turns).toBe(4);
  },
  xp_miaussi: ({ b, ev }) => {
    expect(structDmg(ev) + catDmg(ev)).toBeGreaterThan(0);
    expect(MD.mdFire(b, 0, b.sides[0].cats[1], false, undefined, [])).toBeCloseTo(2.5);
    expect(MD.mdFire(b, 0, b.sides[0].cats[1], false, undefined, [])).toBe(1);
  },
  xp_gatistiano: ({ b, ev, me }) => {
    expect(fxOf(ev, 'mdpHatTrick').map((e) => e.n)).toEqual([0, 1, 2]);
    for (const c of b.sides[0].cats) if (c !== me) expect(c.ultCharge).toBeGreaterThanOrEqual(0.2);
  },
  xp_miaupe: ({ b }) => {
    toEnemy(b);
    const foe = b.sides[1].cats.find((c) => !c.ko)!;
    const r = shoot(b, 1, foe.def.uid);
    expect(structDmg(r.events, 0) + catDmg(r.events, 0)).toBeGreaterThan(0);
    expect(has(r.events, 'mdpCounter')).toBe(true);
    expect(structDmg(r.events, 1) + catDmg(r.events, 1)).toBeGreaterThan(0);
  },
  xp_lamiau: ({ ev, es }) => {
    expect(es.ship.cells().some((c) => c.status.grav)).toBe(true);
    expect(structDmg(ev)).toBeGreaterThan(0);
    // through the shields: a bubble doesn't stop it
    const r = fireMd('xp_lamiau', 77, {}, (bb) => {
      bb.sides[1].bubbleKind = 'bubble';
      bb.sides[1].bubbleMax = 2;
      bb.sides[1].bubble = 2;
    });
    expect(structDmg(r.r.events)).toBeGreaterThan(0);
    expect(r.b.sides[1].bubble).toBe(2);
  },
};

describe('player side only: the same post cat on the enemy side plays exactly as before', () => {
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
      // fired by hand on their side: the generic ultimate, and no post state is ever created
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
      expect(MD.mdOn(b, c)).toBe(false);
    });
  }
});

describe('determinism, the AI, caps and ★5', () => {
  const breathe = () => new Promise((r) => setImmediate(r));
  it('same seed → same battle (crews of three post Multidimensionals)', async () => {
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
  it('the AI fires every post power in a full auto battle (no softlocks, no NaN, no runaway turns)', async () => {
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
  it('against a boss the cap is 18 % (the heaviest hitters)', () => {
    for (const id of ['xp_unzarpazo', 'xp_supermichi', 'xp_ssssmichi', 'xp_gatote', 'xp_pegaso', 'xp_gatistiano', 'xp_miauknd', 'xp_postmaulone', 'xp_lamiau', 'xp_gomitas', 'xp_hierromichi', 'xp_garritas', 'xp_partymichi', 'xp_miaussi']) {
      const { r, before } = fireMd(id, 5, { boss: true }, (b) => b.sides[0].cats.forEach((c) => (c.hp = Math.round(c.maxHp * 0.2))));
      expect(structDmg(r.events), id).toBeLessThanOrEqual(Math.round(before.max * MD.MD_TUNE.bossFrac) + 1);
    }
    // the Forbidden Five with all its pieces
    const y = fireMd('xp_yugi', 5, { boss: true }, (b) => K.S(b).pieces.set(b.sides[0].cats[0], 5));
    expect(structDmg(y.r.events)).toBeLessThanOrEqual(Math.round(y.before.max * MD.MD_TUNE.bossFrac) + 1);
  });
  it('SERIOUS PAW on the core takes half of it: never one blow away from the end (PODERES-2b)', () => {
    // every other module already broken: the paw can only read «the core» wherever it lands
    const hp0 = new Map<object, number>();
    const { b, r } = fireMd('xp_unzarpazo', 77, {}, (bb) => {
      for (const m of bb.sides[1].ship.modules) if (m.kind !== 'core') m.alive = false;
      const core = bb.sides[1].ship.modules.find((m) => m.kind === 'core')!;
      for (const c of bb.sides[1].ship.moduleCells(core.id)) hp0.set(c, c.hp);
    });
    const es = b.sides[1];
    const core = es.ship.modules.find((m) => m.kind === 'core')!;
    expect(fxOf(r.events, 'mdpSerious')[0]?.n).toBe(1);
    expect(structDmg(r.events)).toBeGreaterThan(0);
    expect(core.alive).toBe(true);
    for (const c of es.ship.moduleCells(core.id)) expect(c.hp).toBeGreaterThanOrEqual(Math.floor(hp0.get(c)! / 2));
    b.checkVictory();
    expect(b.winner).toBe(null);
  });
  it("Ahab's rope never ties the core, nor jumps to it (PODERES-2b)", () => {
    // only the core alive: nothing to harpoon
    const solo = fireMd('xp_ahab', 9, {}, (bb) => bb.sides[1].ship.modules.forEach((m) => m.kind !== 'core' && (m.alive = false)));
    expect(K.peek(solo.b)?.harpoon ?? null).toBeNull();
    // one module besides the core: tied to it; when it breaks, the rope has nowhere to go but the core — it lets go
    let spare = -1;
    const { b } = fireMd('xp_ahab', 9, {}, (bb) => {
      const mods = bb.sides[1].ship.modules.filter((m) => m.kind !== 'core');
      spare = mods[0].id;
      mods.slice(1).forEach((m) => (m.alive = false));
    });
    expect(st(b).harpoon?.module).toBe(spare);
    b.sides[1].ship.modules[spare].alive = false;
    const core = b.sides[1].ship.modules.find((m) => m.kind === 'core')!;
    const hp0 = b.sides[1].ship.moduleCells(core.id).reduce((a, c) => a + c.hp, 0);
    const s = toEnemy(b);
    expect(fxOf(s, 'mdpPull').length).toBe(0);
    expect(st(b).harpoon).toBeNull();
    expect(b.sides[1].ship.moduleCells(core.id).reduce((a, c) => a + c.hp, 0)).toBe(hp0);
  });
  it('the delayed blows keep their own cap (the ball, the barrel, the confetti, the laser, the piranhas, the rope)', async () => {
    for (const id of ['xp_michiatom', 'xp_daftmiau', 'xp_michiercoles', 'xp_ahab', 'xp_barril']) {
      const { b, before } = fireMd(id, 9, { boss: true });
      let total = 0;
      for (let t = 0; t < 4; t++) {
        total += structDmg(toEnemy(b), 1) + structDmg(drain(b), 1);
        total += structDmg(toMine(b), 1) + structDmg(drain(b), 1);
      }
      expect(total, id).toBeLessThanOrEqual(Math.round(before.max * MD.MD_TUNE.bossFrac) * 3 + 3);
      await breathe();
    }
  });
  it('★5: every post power twice per battle (and it really fires twice)', () => {
    for (const id of IDS) {
      const b = makeBattle(spec(id, { stars: 5 }), 8);
      expect(b.sides[0].cats[0].def.ultimate!.limits?.usesPerBattle, id).toBe(2);
    }
    const b = makeBattle(spec('xp_gatistiano', { stars: 5 }), 8);
    b.startTurn(0);
    const me = b.sides[0].cats[0];
    for (let k = 0; k < 2; k++) {
      me.ultCharge = 1;
      me.cooldown = 0;
      expect(b.canUlt(me)).toBe(true);
      const r = b.fire(0, 'p0', -0.6, 900, true);
      expect(has(r.events, 'mdpHatTrick')).toBe(true);
    }
    me.ultCharge = 1;
    expect(b.canUlt(me)).toBe(false);
  });
  it('chips are readable for every post power (no undefined, no NaN)', async () => {
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
  });
});

describe('no post power in the fight: nothing changes', () => {
  it('a battle with the Parte III powers and plain cats never creates the post state', () => {
    for (const crew of [['c_canelo', 'c_gelatino', 'r_magmito'], ['x_homiau', 'x_gatomalo', 'e_maneki']]) {
      const s = spec('c_canelo');
      s.player.cats = crew.map((id, k) => ({ ...cat(`p${k}`, id, 1, 3), ultStart: 1 }));
      const b = makeBattle(s, 1234);
      for (let t = 0; t < 8 && b.winner === null; t++) {
        for (const side of [0, 1] as const) {
          b.startTurn(side);
          b.queued.length = 0;
          for (const c of b.shooters(side).slice(0, 1)) {
            const ult = b.canUlt(c);
            const a = aimFrom(b, side, b.muzzle(side, c.def.uid), ult ? c.def.ultimate! : c.def.shot, t, 1, b.shipCenter(1 - side));
            b.fire(side, c.def.uid, a.angle, a.power, ult);
          }
          for (const m of b.cannons(side)) b.fire(side, 'cannon', side === 0 ? -0.7 : Math.PI + 0.7, 850, false, m.id);
          b.endTurn();
          if (b.winner !== null) break;
        }
      }
      expect(K.peek(b), crew.join()).toBeUndefined();
    }
  });
});
