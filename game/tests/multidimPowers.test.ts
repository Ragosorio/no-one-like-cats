/**
 * Parte III · the MULTIDIMENSIONAL powers (battle/multidim.ts, data/multidimPowers.ts — agent PODERES, 2026-10-28;
 * design: docs/part-iii/mecanicas-v2/07-poderes-multidimensionales.md).
 *
 *   · every Multidimensional species has its Catdex text AND its battle power, and they say the same thing;
 *   · each power fires in a seeded battle and does what it says (a check per cat), within its cap, no NaN;
 *   · a power is YOUR crew's only: the same cat on the enemy side plays exactly as before (the whole battle replays
 *     identically with the powers switched off), so no story battle (élites, captains, rosters) changes;
 *   · determinism (same seed → same battle) and the AI uses them (the estimate fires them).
 * After the Parte III (data/postp3/especies.json, SISTEMA 2026-10-28): a post Multidimensional goes through every check
 * here once its power lands; until then its id sits in PENDING (it fights with its generic ultimate, on both sides).
 */
import { describe, expect, it } from 'vitest';
import ESP from '../src/data/gateras/especies.json';
import POSTESP from '../src/data/postp3/especies.json';

const { ROLE_BY_ID, catDef, CAT_BY_ID } = await import('../src/data/content');
const { MULTIDIM_POWERS, multidimPower } = await import('../src/data/multidimPowers');
const { MDP_IDS } = await import('../src/data/multidimPowersPost');
const MD = await import('../src/battle/multidim');
const { makeBattle, autoBattle } = await import('../src/battle/autoplay');
const { battleCatFrom } = await import('../src/battle/catShots');
const { BLUEPRINTS } = await import('../src/battle/blueprints');
const { aimFrom, DIFFICULTY } = await import('../src/battle/ai');
const { ULTS, ultWorth } = await import('../src/battle/ults');
type Spec = import('../src/scenes/BattleScene').BattleSpec;
type Battle = import('../src/battle/sim').Battle;
type Ev = import('../src/battle/sim').BattleEvent;

const P3_SPECIES = (ESP as { cats: { id: string; rarity: string }[] }).cats.filter((c) => c.rarity === 'multidimensional').map((c) => c.id);
/** the post-Parte III Multidimensionals (data/postp3/especies.json) */
const POST_MD = (POSTESP as { cats: { id: string; rarity: string }[] }).cats.filter((c) => c.rarity === 'multidimensional').map((c) => c.id);
/**
 * PENDING: post Multidimensionals whose power hasn't landed yet. A new id lands here with its species and leaves the
 * moment its power is written (data/multidimPowers.ts + battle/multidim.ts MD_ULTS). It ends empty.
 */
const PENDING: string[] = [];
/** every Multidimensional with its power: the Parte III's 25 + the post ones already out of PENDING */
const SPECIES = [...P3_SPECIES, ...POST_MD.filter((id) => !PENDING.includes(id))];
/** the ones that also sail as enemies (regiones.json): their numbers must not move */
const ENEMY_MD = ['l_emiau', 'e_estambre', 'l_bigoton', 'e_sirsimon', 'e_ovillo'];

function cat(uid: string, species: string, stars = 1, hpMul = 1) {
  return battleCatFrom({ uid, species, name: species, level: 30, stars, dmgMul: 1, hpMul }, ROLE_BY_ID.get(catDef(species).role)?.hp ?? 100);
}
/** a fixed little battle: the Multidimensional (p0) + two plain cats against three plain cats */
function spec(species: string, o: { enemySide?: boolean; stars?: number; boss?: boolean } = {}): Spec {
  const md = cat(o.enemySide ? 'e0' : 'p0', species, o.stars);
  const mine = o.enemySide ? [cat('p0', 'c_canelo'), cat('p1', 'c_gelatino'), cat('p2', 'r_magmito')] : [md, cat('p1', 'c_canelo'), cat('p2', 'c_gelatino')];
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
/** your Multidimensional fires its power, aimed at the middle of their ship (no noise) */
function fireMd(species: string, seed = 77, o: { stars?: number; boss?: boolean } = {}) {
  const b = makeBattle(spec(species, o), seed);
  b.startTurn(0);
  const me = b.sides[0].cats[0];
  me.ultCharge = 1;
  const before = snapshot(b);
  const a = aimFrom(b, 0, b.muzzle(0, me.def.uid), me.def.ultimate!, 1, 0, b.shipCenter(1));
  const r = b.fire(0, me.def.uid, a.angle, a.power, true);
  return { b, r, me, before };
}
function snapshot(b: Battle) {
  return { hull: b.sides[1].ship.cells().reduce((a, c) => a + c.hp, 0), max: b.sides[1].ship.initialMax?.[0] ?? 0, cats: b.sides[1].cats.map((c) => c.hp) };
}
const structDmg = (ev: Ev[], side = 1) => ev.reduce((a, e) => a + (e.k === 'cell' && e.side === side ? e.dmg : 0), 0);
const catDmg = (ev: Ev[], side = 1) => ev.reduce((a, e) => a + (e.k === 'cat' && e.side === side ? e.dmg : 0), 0);
const finite = (ev: Ev[]) => ev.every((e) => Object.values(e).every((v) => typeof v !== 'number' || Number.isFinite(v)));
/** play the rest of your turn and the enemy's (start of turn, their cat shot, both volleys, end of turn) */
function playRound(b: Battle, seed = 5) {
  const { decide } = AI;
  for (const side of [1, 0] as const) {
    if (b.winner !== null) return;
    if (side === 1) b.endTurn();
    b.startTurn(side);
    b.queued.length = 0;
    const d = decide(b, side, DIFFICULTY.normal, new Map(), seed + side);
    if (d) b.fire(side, d.shooter, d.angle, d.power, false);
    if (side === 1) for (const m of b.cannons(1)) b.fire(1, 'cannon', -2.4, 900, false, m.id);
  }
}
const AI = await import('../src/battle/ai');

describe('the 25 Multidimensional powers: data', () => {
  it('there are 25 Multidimensional species in the Parte III; a post one has its power or is PENDING', () => {
    expect(P3_SPECIES.length).toBe(25);
    expect(PENDING.filter((id) => !POST_MD.includes(id)), 'PENDING is only for post Multidimensionals').toEqual([]);
    expect(PENDING.filter((id) => multidimPower(id) || MD.MD_ULTS[id]), 'remove these from PENDING').toEqual([]);
  });
  it('every one has its Catdex text and its battle power (and nothing else does)', () => {
    for (const id of SPECIES) {
      const p = multidimPower(id);
      expect(p, id).toBeTruthy();
      expect(p!.name.length, id).toBeGreaterThan(3);
      expect(p!.short.length, `${id} short`).toBeLessThanOrEqual(60);
      expect(p!.text.length, id).toBeGreaterThan(40);
      expect(typeof MD.MD_ULTS[id], id).toBe('function');
      // a power is NOT a generic signature: no entry in ULTS (the enemy side keeps the generic ultimate)
      expect(ULTS[id], id).toBeUndefined();
    }
    // a post power lands ahead of its species (data/multidimPowersPost.ts, PODERES-2): the ones whose species is in are
    // checked here, the rest by tests/multidimPost.test.ts — and no other key may sneak in
    const listed = (ids: string[]) => ids.filter((id) => P3_SPECIES.includes(id) || POST_MD.includes(id)).sort();
    expect(listed(Object.keys(MULTIDIM_POWERS))).toEqual([...SPECIES].sort());
    expect(listed(Object.keys(MD.MD_ULTS))).toEqual([...SPECIES].sort());
    expect(Object.keys(MD.MD_ULTS).filter((id) => !P3_SPECIES.includes(id) && !MDP_IDS.includes(id))).toEqual([]);
    expect(Object.keys(MULTIDIM_POWERS).filter((id) => !P3_SPECIES.includes(id) && !MDP_IDS.includes(id))).toEqual([]);
    // the names are unique
    expect(new Set(SPECIES.map((id) => multidimPower(id)!.name)).size).toBe(SPECIES.length);
  });
  it('the ultimate the game shows (CatPanel, Elegir tripulación, the cut-in) is the power: same name, and it says what it does', () => {
    for (const id of SPECIES) {
      const u = catDef(id).combat.ultimate;
      const shout = u.name.split('(')[0].trim();
      expect(shout, id).toBe(multidimPower(id)!.name);
      expect(u.effect.length, id).toBeGreaterThan(40);
      expect(u.usesPerBattle, id).toBe(1);
      expect(catDef(id).combat.star5, id).toMatch(/2 veces por batalla/);
      // the meteor regex of ultFromDef must not catch a power's name
      expect(/STARFALL|METEOR|DECREE/i.test(u.name), id).toBe(false);
    }
  });
});

describe('each power fires and does what it says (your crew, seeded)', () => {
  for (const id of SPECIES) {
    it(`${id}: ${MULTIDIM_POWERS[id]?.name}`, () => {
      const { b, r, me, before } = fireMd(id);
      const ev = r.events;
      // the stamp (the view's set piece) and the power ran, not the generic ultimate
      expect(ev.some((e) => e.k === 'ultfx' && e.fx === 'md' && e.uid === id), 'stamp').toBe(true);
      expect(MD.mdFeats(b)[`md_${id}`]).toBe(1);
      expect(finite(ev)).toBe(true);
      for (const p of r.paths) for (const q of p.points) expect(Number.isFinite(q.x) && Number.isFinite(q.y)).toBe(true);
      // the cap: never more than 45 % of their starting structure in one go
      expect(structDmg(ev)).toBeLessThanOrEqual(Math.round(before.max * MD.MD_TUNE.frac) + 1);
      // (Bigotón's flash comes back when his rival falls)
      const refunded = id === 'l_bigoton' && ev.some((e) => e.k === 'ultfx' && e.fx === 'mdRival' && e.n === 1);
      expect(me.ultUsed).toBe(refunded ? 0 : 1);
      check(id, b, ev, me, before);
    });
  }
});

/** the per-cat «does what it says» */
function check(id: string, b: Battle, ev: Ev[], me: Battle['sides'][0]['cats'][0], before: ReturnType<typeof snapshot>) {
  const es = b.sides[1];
  const foes = es.cats.filter((c) => !c.ko);
  const info = (re: RegExp) => ev.some((e) => e.k === 'info' && re.test(e.text));
  const dealt = structDmg(ev) + catDmg(ev);
  const [chE, chP] = MD.mdChips(b);
  const chips = [...chE, ...chP].map((c) => c.text).join(' | ');
  switch (id) {
    case 'x_homiau': {
      // four bounces, then SUERTE DE SOFÁ: the next miss of your crew bounces back and hits
      expect(ev.filter((e) => e.k === 'ultfx' && e.fx === 'mdHop').length).toBe(4);
      expect(dealt).toBeGreaterThan(0);
      expect(chips).toMatch(/SUERTE DE SOFÁ/);
      const mate = b.sides[0].cats[1];
      mate.cooldown = 0;
      const miss = b.fire(0, mate.def.uid, -0.3, 300, false);
      expect(miss.events.some((e) => e.k === 'ultfx' && e.fx === 'mdLuck')).toBe(true);
      expect(miss.paths[0].impacts.length).toBeGreaterThan(0);
      // …the 2nd miss doesn't (one of every two)
      mate.cooldown = 0;
      const miss2 = b.fire(0, mate.def.uid, -0.3, 300, false);
      expect(miss2.events.some((e) => e.k === 'ultfx' && e.fx === 'mdLuck')).toBe(false);
      break;
    }
    case 'x_gatarana': {
      expect(es.ship.cells().every((c) => c.status.rooted || c.status.burning)).toBe(true);
      expect(es.ship.modules.filter((m) => m.kind === 'cannon').every((m) => m.disabled >= 2)).toBe(true);
      for (const c of foes) expect(c.stunned, c.def.uid).toBeGreaterThanOrEqual(2);
      break;
    }
    case 'x_murciegato': {
      expect(es.buffs.blind).toBeGreaterThanOrEqual(2);
      expect(dealt).toBeGreaterThan(0);
      break;
    }
    case 'x_supersiames': {
      expect(dealt).toBeGreaterThan(0);
      // the transformation: under half at the start of your turn → SUPER (heal, full meter, the wave back), once
      me.hp = Math.round(me.maxHp * 0.4);
      const hp = me.hp;
      b.endTurn();
      b.startTurn(1);
      b.endTurn();
      const st = b.startTurn(0);
      expect(st.some((e) => e.k === 'ultfx' && e.fx === 'mdSuper')).toBe(true);
      expect(me.hp).toBeGreaterThan(hp);
      expect(me.ultCharge).toBe(1);
      expect(b.canUlt(me)).toBe(true);
      expect(MD.mdAtkMul(b, 0, me)).toBe(1.5);
      const again = b.startTurn(0);
      expect(again.some((e) => e.k === 'ultfx' && e.fx === 'mdSuper')).toBe(false);
      break;
    }
    case 'x_harrygatter': {
      expect(es.ship.modules.filter((m) => m.kind === 'cannon' && m.alive).every((m) => m.disabled >= 3)).toBe(true);
      expect(ev.filter((e) => e.k === 'ultfx' && e.fx === 'mdSpell').length).toBe(2);
      const strongest = [...es.cats].sort((a, z) => z.def.atk - a.def.atk || z.hp - a.hp)[0];
      expect(strongest.ko || strongest.stunned >= 2).toBe(true);
      expect(es.ship.cells().some((c) => c.status.cursed)).toBe(true);
      break;
    }
    case 'x_gatomalo': {
      expect(dealt).toBeGreaterThan(0);
      // EL FLOW: next turn, a cat shot brings its echo
      b.endTurn();
      b.startTurn(1);
      b.endTurn();
      b.startTurn(0);
      const mate = b.sides[0].cats[1];
      mate.cooldown = 0;
      const a = aimFrom(b, 0, b.muzzle(0, mate.def.uid), mate.def.shot, 1, 0, b.shipCenter(1));
      const r = b.fire(0, mate.def.uid, a.angle, a.power, false);
      expect(r.events.some((e) => e.k === 'info' && e.text === '¡ECO!')).toBe(true);
      expect(r.paths.length).toBe(2);
      break;
    }
    case 'x_tailorswift': {
      // the tour: five eras, one per turn, then it ends
      const seen: number[] = [];
      for (let t = 0; t < 6; t++) {
        b.endTurn();
        b.startTurn(1);
        b.endTurn();
        for (const e of b.startTurn(0)) if (e.k === 'ultfx' && e.fx === 'mdEra') seen.push(e.n!);
        if (t === 0) expect(MD.mdAtkMul(b, 0, b.sides[0].cats[1])).toBeCloseTo(1.3);
        if (t === 1) expect(MD.mdShot(b, 0, b.sides[0].cats[1].def.shot).statuses?.some((s) => s.id === 'burning')).toBe(true);
      }
      expect(seen).toEqual([0, 1, 2, 3, 4]);
      break;
    }
    case 'x_billiebigotish': {
      for (const c of foes) expect(c.stunned, c.def.uid).toBeGreaterThanOrEqual(3);
      // a hit wakes one up
      const c = foes[0];
      b.hitCat(c, 5, [], 0, 0, 'neutral', true);
      expect(c.stunned).toBe(0);
      expect(foes[1].stunned).toBeGreaterThanOrEqual(3);
      break;
    }
    case 'x_vangato': {
      expect(b.wells.some((w) => w.kind === 'swirl' && w.affects === 1)).toBe(true);
      // their shots get spun: a straight lob from their ship lands somewhere else with the swirl on
      const shot = es.cats[0].def.shot;
      const o = b.muzzle(1, es.cats[0].def.uid);
      const spun = b.integrate(shot, o, Math.PI + 0.7, 900, 0, 1);
      const saved = b.wells;
      b.wells = [];
      const plain = b.integrate(shot, o, Math.PI + 0.7, 900, 0, 1);
      b.wells = saved;
      const end = (p: typeof spun) => p.points[p.points.length - 1];
      expect(Math.hypot(end(spun).x - end(plain).x, end(spun).y - end(plain).y)).toBeGreaterThan(60);
      break;
    }
    case 'e_comecroquetas': {
      expect(ev.filter((e) => e.k === 'cell' && e.side === 1).length).toBeGreaterThan(10);
      const c = foes.find((k) => !k.ko)!;
      expect(MD.mdCatMul(b, c)).toBe(2);
      expect(MD.mdAtkMul(b, 1, c)).toBe(0.5);
      expect(chips).toMatch(/FANTASMAS/);
      break;
    }
    case 'l_bigoton': {
      const rival = ev.find((e) => e.k === 'ultfx' && e.fx === 'mdRival');
      expect(rival).toBeTruthy();
      const hit = ev.filter((e) => e.k === 'cat' && e.side === 1 && e.uid === rival!.uid).reduce((a, e) => a + (e.k === 'cat' ? e.dmg : 0), 0);
      expect(hit).toBeGreaterThan(0);
      // the rival is their strongest cat
      const strongest = [...es.cats].sort((a, z) => z.def.atk - a.def.atk || z.hp - a.hp)[0];
      expect(rival!.uid).toBe(strongest.def.uid);
      // if it fell, the flash comes back (another use, half a meter)
      if (rival!.n === 1) {
        expect(b.canUlt(me) || me.stunned > 0 || me.cooldown > 0 || me.ultCharge >= 0.5).toBe(true);
        expect(me.ultCharge).toBeGreaterThanOrEqual(0.5);
      }
      break;
    }
    case 'e_ovillo': {
      expect(ev.filter((e) => e.k === 'ultfx' && e.fx === 'mdGrab').length).toBeGreaterThanOrEqual(3);
      const cannon = es.ship.modules.find((m) => m.kind === 'cannon')!;
      expect(cannon.disabled).toBeGreaterThanOrEqual(3);
      expect(foes.filter((c) => c.stunned >= 2).length).toBeGreaterThanOrEqual(1);
      break;
    }
    case 'e_estambre': {
      expect(me.shields).toBe(2);
      expect(ev.some((e) => e.k === 'ultfx' && e.fx === 'mdReform')).toBe(true);
      expect(es.ship.cells().some((c) => c.status.cursed)).toBe(true);
      break;
    }
    case 'r_gatarana_noir': {
      const c = foes.find((k) => !k.ko)!;
      expect(MD.mdAff(b, c, 0.75)).toBe(1.5);
      expect(es.ship.cells().filter((k) => k.status.wet).length).toBeGreaterThan(10);
      break;
    }
    case 'r_gatarana_blanca': {
      expect(info(/PLIÉ/)).toBe(true);
      expect(foes.filter((c) => c.stunned >= 2).length).toBeGreaterThanOrEqual(1);
      break;
    }
    case 'r_gatarana_2099': {
      expect(es.ship.cells().some((c) => c.status.charged)).toBe(true);
      expect(b.extraShots(0)).toBe(0);
      b.endTurn();
      b.startTurn(1);
      b.endTurn();
      b.startTurn(0);
      expect(b.extraShots(0)).toBe(2);
      b.endTurn();
      b.startTurn(1);
      b.endTurn();
      b.startTurn(0);
      expect(b.extraShots(0)).toBe(0);
      break;
    }
    case 'r_gatemson': {
      const h = ev.find((e) => e.k === 'ultfx' && e.fx === 'mdHeadline')!;
      expect(h).toBeTruthy();
      const target = es.cats.find((c) => c.def.uid === h.uid)!;
      expect(target.ultCharge).toBe(0);
      expect(MD.mdCatMul(b, target)).toBe(1.5);
      expect(b.sides[0].cats[1].ultCharge).toBeGreaterThanOrEqual(0.3);
      break;
    }
    case 'l_gatzilla': {
      expect(es.breaches).toBeGreaterThanOrEqual(2);
      expect(es.flood).toBeGreaterThan(0.1);
      expect(me.stunned).toBeGreaterThanOrEqual(2);
      expect(structDmg(ev)).toBeGreaterThan(0);
      break;
    }
    case 'l_emiau': {
      b.endTurn();
      b.startTurn(1);
      for (const c of es.cats) {
        c.ultCharge = 1;
        expect(b.canUlt(c)).toBe(false);
      }
      break;
    }
    case 'c_gritito': {
      // PANIC: the first hit each of their cats takes stuns it (even a sound cat / a deaf one)
      const c = foes.find((k) => !k.ko && k.stunned <= 0) ?? foes[0];
      c.stunned = 0;
      b.hitCat(c, 3, [], 0, 0, 'neutral', true);
      expect(c.stunned).toBeGreaterThanOrEqual(2);
      c.stunned = 0;
      b.hitCat(c, 3, [], 0, 0, 'neutral', true);
      expect(c.stunned).toBe(0);
      break;
    }
    case 'e_gatoconda': {
      expect(b.wells.some((w) => w.kind === 'gaze' && w.affects === 1)).toBe(true);
      b.endTurn();
      b.startTurn(1);
      expect(MD.mdCatMul(b, me)).toBe(0.5);
      break;
    }
    case 'e_sonrisa': {
      expect(ev.filter((e) => e.k === 'ultfx' && e.fx === 'mdBite').length).toBe(3);
      // what's bitten is gone (or BORRADO, held at 1 where it holds the ship up)
      expect(ev.some((e) => e.k === 'module' && e.side === 1) || es.ship.cells().some((c) => c.status.voided)).toBe(true);
      expect(b.wells.some((w) => w.kind === 'grin' && w.eat)).toBe(true);
      // the core is never bitten (a bite there + the volley would end the fight on the spot)
      const core = es.ship.modules.find((m) => m.kind === 'core')!;
      expect(core.alive).toBe(true);
      expect(es.ship.moduleCells(core.id).some((c) => c.status.voided)).toBe(false);
      break;
    }
    case 'e_sirsimon': {
      const core = es.ship.modules.find((m) => m.kind === 'core')!;
      expect(es.ship.moduleCells(core.id).every((c) => (c.status.cursed ?? 0) >= 90)).toBe(true);
      // the chains: one cat hit, the others take half
      const live = es.cats.filter((c) => !c.ko);
      const hp = live.map((c) => c.hp);
      const e2: Ev[] = [];
      b.hitCat(live[0], 20, e2, 0, 0, 'neutral', true);
      expect(live.slice(1).every((c, i) => c.hp < hp[i + 1])).toBe(true);
      break;
    }
    case 'r_garbancito': {
      expect(ev.some((e) => e.k === 'ultfx' && e.fx === 'mdSpray')).toBe(true);
      const core = es.ship.modules.find((m) => m.kind === 'core')!;
      expect(es.ship.moduleCells(core.id).every((c) => c.status.voided)).toBe(true);
      expect(core.alive).toBe(true);
      b.endTurn();
      b.startTurn(1);
      const hp = me.hp;
      b.hitCat(me, 50, [], 0, 0, 'neutral', true);
      expect(me.hp).toBe(hp);
      break;
    }
    case 'e_maneki': {
      // their next 2 turns are billed, then they pay 80 % back
      const hull = () => es.ship.cells().reduce((a, c) => a + c.hp, 0);
      b.endTurn();
      b.startTurn(1);
      const ship0 = b.sides[0].ship;
      const cell = ship0.cells()[0];
      // a blow of theirs, written down
      const r = b.fire(1, 'e0', Math.PI + 0.6, 900, false);
      void r;
      b.endTurn();
      b.startTurn(0);
      b.endTurn();
      b.startTurn(1);
      b.endTurn();
      const h0 = hull();
      const st = b.startTurn(0);
      const bill = st.find((e) => e.k === 'ultfx' && e.fx === 'mdBill');
      expect(bill).toBeTruthy();
      if ((bill as { n?: number }).n! > 0) expect(hull()).toBeLessThan(h0);
      void cell;
      break;
    }
  }
}

describe('player side only: the same cat on the enemy side plays exactly as before', () => {
  for (const id of SPECIES) {
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
      // and its ultimate, fired by hand on their side: the generic one (no stamp, no power), the same with the powers off
      const fire = () => {
        const b = makeBattle(spec(id, { enemySide: true }), 31);
        b.startTurn(0);
        b.endTurn();
        b.startTurn(1);
        const c = b.sides[1].cats[0];
        c.ultCharge = 1;
        const a = aimFrom(b, 1, b.muzzle(1, c.def.uid), c.def.ultimate!, 1, 0, b.shipCenter(0));
        const r = b.fire(1, c.def.uid, a.angle, a.power, true);
        return { b, r: JSON.parse(JSON.stringify({ ev: r.events, paths: r.paths.map((p) => p.points.length) })) };
      };
      const f1 = fire();
      expect(f1.r.ev.some((e: Ev) => e.k === 'ultfx' && e.fx === 'md')).toBe(false);
      expect(MD.mdFeats(f1.b)).toEqual({});
      MD.MD_TUNE.on = false;
      try {
        expect(fire().r).toEqual(f1.r);
      } finally {
        MD.MD_TUNE.on = true;
      }
    });
  }
  it('the five that sail as enemies keep their numbers (shot, ultimate damage, reload)', () => {
    const SNAP: Record<string, [number, number, number, number]> = {
      l_emiau: [85, 100, 2, 1],
      e_estambre: [70, 75, 1, 1],
      l_bigoton: [84, 100, 2, 1],
      e_sirsimon: [66, 70, 1, 1],
      e_ovillo: [66, 70, 1, 1],
    };
    for (const id of ENEMY_MD) {
      const c = catDef(id).combat;
      expect([c.shot.dmg, c.ultimate.dmg, c.recarga, c.ultimate.usesPerBattle], id).toEqual(SNAP[id]);
    }
  });
  it('ultWorth never asks a power for an enemy cat', () => {
    const b = makeBattle(spec('x_billiebigotish', { enemySide: true }), 3);
    expect(MD.mdOn(b, b.sides[1].cats[0])).toBe(false);
    expect(ultWorth(b, b.sides[1].cats[0])).toBe(true);
  });
});

describe('determinism, caps and the AI', () => {
  // (long synchronous sims starve the vitest worker's RPC: yield between fights, like storyScale.test.ts)
  const breathe = () => new Promise((r) => setImmediate(r));
  it('same seed → same battle (a crew of Multidimensionals, the estimate twice)', async () => {
    for (const trio of [
      ['x_homiau', 'x_gatomalo', 'x_tailorswift'],
      ['x_vangato', 'e_sonrisa', 'e_gatoconda'],
      ['r_gatarana_2099', 'e_maneki', 'x_supersiames'],
    ]) {
      const s = spec(trio[0]);
      // sturdy cats: each one lives long enough to get its turn
      s.player.cats = trio.map((id, i) => ({ ...cat(`p${i}`, id, 1, 4), ultStart: 1 }));
      const a: string[] = [];
      const z: string[] = [];
      const r1 = autoBattle(s, DIFFICULTY.boss, 99, 20, (bb, side, shot) => a.push(`${bb.turn}|${side}|${shot}`));
      const r2 = autoBattle(structuredClone({ ...s, onEnd: undefined }) as Spec, DIFFICULTY.boss, 99, 20, (bb, side, shot) => z.push(`${bb.turn}|${side}|${shot}`));
      expect(a).toEqual(z);
      expect(r1).toEqual(r2);
      // the AI fired every power of the crew
      for (let i = 0; i < 3; i++) expect(a.some((l) => l.includes(`p${i}(ULT)`)), trio[i]).toBe(true);
      await breathe();
    }
  });
  it('every power fires in a full auto battle without softlocks, NaN or runaway turns', async () => {
    for (const id of SPECIES) {
      // the Multidimensional sails alone (so the AI's pick is its power), the AI always takes a ready ultimate
      const s = spec(id);
      s.player.cats = [{ ...s.player.cats[0], ultStart: 1 }];
      const log: string[] = [];
      const r = autoBattle(s, DIFFICULTY.boss, 1234, 30, (bb, side, shot) => log.push(`${side}|${shot}`));
      expect(log.some((l) => l.startsWith('0|p0(ULT)')), id).toBe(true);
      expect(Number.isFinite(r.hullLost), id).toBe(true);
      expect(r.turns, id).toBeLessThanOrEqual(31);
      await breathe();
    }
  });
  it('against a boss the cap is 18 %', () => {
    for (const id of ['x_homiau', 'l_gatzilla', 'x_murciegato', 'e_comecroquetas']) {
      const { r, before } = fireMd(id, 5, { boss: true });
      expect(structDmg(r.events), id).toBeLessThanOrEqual(Math.round(before.max * MD.MD_TUNE.bossFrac) + 1);
    }
  });
  it('★5: the power twice per battle', () => {
    const b = makeBattle(spec('x_billiebigotish', { stars: 5 }), 8);
    const me = b.sides[0].cats[0];
    expect(me.def.ultimate!.limits?.usesPerBattle).toBe(2);
  });
  it('a crew of the 25 on screen: chips are readable (no undefined, no NaN)', () => {
    for (const id of SPECIES) {
      const { b } = fireMd(id);
      const [e, p] = MD.mdChips(b);
      for (const c of [...e, ...p]) expect(c.text, id).not.toMatch(/undefined|NaN/);
    }
  });
  it('content: they are real species with a battle form', () => {
    for (const id of SPECIES) expect(CAT_BY_ID.get(id)?.battleForm.name, id).toBeTruthy();
  });
  void playRound;
});
