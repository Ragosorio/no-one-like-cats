/**
 * Parte II · Oleada 1 — the Cristal element and the 12 species of the lote D (docs/part-ii/12-puente-oleada-1.md §3):
 * merged content, the affinity matrix, resonance (combos, story-locked primordials, Refracta's secret clue) and the
 * battle rules of battle/cristal.ts (PRISMA → REFRACCIÓN / ESPECTRO, FACETA → REFLEJO), deterministic in the sim
 * the screen and the estimate worker share.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { Battle, BattleEvent, CAT_K } from '../src/battle/sim';
import { makeBattle, autoBattle } from '../src/battle/autoplay';
import { aimFrom, DIFFICULTY } from '../src/battle/ai';
import { BLUEPRINTS } from '../src/battle/blueprints';
import { CELL } from '../src/battle/ship';
import type { Cell } from '../src/battle/ship';
import { battleCatFrom, shotFromSpec } from '../src/battle/catShots';
import { CR_TUNE, crBeginFire, crFacetUp, crFeats, ESPECTRO, REFLEJO, REFRACCION } from '../src/battle/cristal';
import { ULTS } from '../src/battle/ults';
import type { BattleSpec } from '../src/scenes/BattleScene';
import { CAT_BY_ID, CONTENT, ELEMENT_BY_ID, ROLE_BY_ID, affinityMult, catDef, materialMult } from '../src/data/content';
import { G, newGame } from '../src/state';
import { adopt } from '../src/state/sys/cats';
import { noteSecretClues, oddsFor, secretClues } from '../src/state/sys/resonance';
import { eligibleCats } from '../src/state/sys/casino';
import { expeditionCrystalElement } from '../src/state/sys/workforce';

// ------------------------------------------------------------------ the contract (§3)
const TABLE: [id: string, rarity: string, elements: string[], role: string, slug: string][] = [
  ['c_brillito', 'common', ['crystal'], 'soporte', 'brillito_crystal_cat'],
  ['r_facetas', 'rare', ['crystal', 'earth'], 'tanque', 'facetas_geode_cat'],
  ['r_espejito', 'rare', ['crystal', 'light'], 'controlador', 'espejito_mirror_cat'],
  ['e_prismarina', 'epic', ['crystal', 'water'], 'francotirador', 'prismarina_seaglass_cat'],
  ['l_madrenacar', 'legendary', ['crystal'], 'invocador', 'madrenacar_pearl_cat'],
  ['s_refracta', 'epic', ['crystal', 'cosmic'], 'asediador', 'refracta_prism_cat'],
  ['c_marcapaginas', 'common', ['magic'], 'artillero', 'marcapaginas_bookmark_cat'],
  ['r_tintero', 'rare', ['shadow', 'water'], 'controlador', 'tintero_ink_cat'],
  ['e_archivista', 'epic', ['magic', 'water'], 'soporte', 'archivista_scholar_cat'],
  ['l_bibliotecario', 'legendary', ['water', 'magic'], 'demoledor', 'bibliotecario_drowned_cat'],
  ['c_espumita', 'common', ['water'], 'asediador', 'espumita_foam_cat'],
  ['r_farolillo', 'rare', ['light', 'water'], 'francotirador', 'farolillo_angler_cat'],
];

describe('merged content: Cristal + the 12 species', () => {
  it('the element is there, hidden until discovered, with a 4-colour nacre palette', () => {
    const el = ELEMENT_BY_ID.get('crystal')!;
    expect(el.name).toBe('Cristal');
    expect(el.verb).toBe('Redirigir');
    expect(el.palette).toEqual(['#B79CFF', '#F7F2FF', '#8FD3FF', '#6FE0C8']);
    expect(el.unlock).toMatch(/^chapter/); // dexElements() hides it until it's in G.s.elements
    expect(CONTENT.elements.filter((e) => e.id === 'crystal')).toHaveLength(1);
  });

  it('every species of the table, exactly as the contract says', () => {
    for (const [id, rarity, elements, role, slug] of TABLE) {
      const c = CAT_BY_ID.get(id)!;
      expect(c, id).toBeTruthy();
      expect(c.rarity, id).toBe(rarity);
      expect(c.elements, id).toEqual(elements);
      expect(c.role, id).toBe(role);
      expect(c.art.slug, id).toBe(slug);
      expect(c.art.slug).toMatch(/^[a-z]+(_[a-z]+)*_cat$/);
      expect(ROLE_BY_ID.has(c.role)).toBe(true);
      for (const e of c.elements) expect(ELEMENT_BY_ID.has(e), `${id}: ${e}`).toBe(true);
      expect(c.art.aura).toHaveLength(3);
      expect(c.lore.length).toBeGreaterThan(20);
      // ids follow the rarity prefix (s_ = secret)
      expect(id[0]).toBe(c.secret ? 's' : rarity[0]);
    }
    expect(CAT_BY_ID.get('l_madrenacar')!.primordial).toBe(true);
    expect(CAT_BY_ID.get('l_bibliotecario')!.primordial).toBe(true);
    expect(CAT_BY_ID.get('s_refracta')!.secret).toBe(true);
    // the two Canelo forms are forms, not species
    expect(CAT_BY_ID.has('c_canelo_almirante')).toBe(false);
    expect(new Set(CONTENT.cats.map((c) => c.id)).size).toBe(CONTENT.cats.length);
  });

  it('their shots and ultimates turn into sim definitions (Cristal shots cut PRISMA; Nv20 lasts longer)', () => {
    for (const [id] of TABLE) {
      const b = battleCatFrom({ uid: id, species: id, name: id, level: 1, stars: 1, dmgMul: 1, hpMul: 1 }, ROLE_BY_ID.get(catDef(id).role)!.hp);
      expect(b.atk, id).toBeGreaterThan(0);
      expect(b.ultimate, id).toBeTruthy();
      if (catDef(id).combat.shot.element === 'crystal') {
        expect(b.shot.element).toBe('crystal');
        expect(b.shot.statuses?.some((s) => s.id === 'prism')).toBe(true);
      }
    }
    const brillito = catDef('c_brillito').combat.shot;
    expect(shotFromSpec(brillito, 1).statuses).toEqual([{ id: 'prism', turns: 2 }]);
    expect(shotFromSpec(brillito, 20).statuses).toEqual([{ id: 'prism', turns: 3 }]);
    expect(shotFromSpec(brillito, 1).trajectory).toBe('bounce');
  });

  it('signature ultimates reuse existing mechanics; sets and the secret recipe are documented', () => {
    for (const id of ['l_madrenacar', 'l_bibliotecario', 's_refracta']) expect(typeof ULTS[id], id).toBe('function');
    const sets = CONTENT.catdexSets.filter((s) => s.id === 'set_crystal' || s.id === 'set_biblioteca');
    expect(sets).toHaveLength(2);
    for (const s of sets) for (const c of s.cats) expect(CAT_BY_ID.has(c), c).toBe(true);
    const secret = (CONTENT.secretRecipes as { cat: string }[]).find((r) => r.cat === 's_refracta');
    expect(secret).toBeTruthy();
  });
});

// ------------------------------------------------------------------ affinity
describe('affinity: Cristal enters the matrix balanced', () => {
  it('Cristal ×1.5 vs Luz and Sonido; Tierra and Naturaleza ×1.5 vs Cristal (and the ×0.75 way back)', () => {
    expect(affinityMult('crystal', 'light')).toBe(1.5);
    expect(affinityMult('crystal', 'sound')).toBe(1.5);
    expect(affinityMult('earth', 'crystal')).toBe(1.5);
    expect(affinityMult('nature', 'crystal')).toBe(1.5);
    expect(affinityMult('light', 'crystal')).toBe(0.75);
    expect(affinityMult('sound', 'crystal')).toBe(0.75);
    expect(affinityMult('crystal', 'earth')).toBe(0.75);
    expect(affinityMult('crystal', 'nature')).toBe(0.75);
    expect(affinityMult('crystal', 'crystal')).toBe(1);
  });

  it('two strong, two weak — and every ×1.5 in the whole matrix answers ×0.75 (or is a ×1.5 duel)', () => {
    const els = CONTENT.elements.map((e) => e.id);
    const strong = els.filter((d) => affinityMult('crystal', d) > 1);
    const weak = els.filter((a) => affinityMult(a, 'crystal') > 1);
    expect(strong.sort()).toEqual(['light', 'sound']);
    expect(weak.sort()).toEqual(['earth', 'nature']);
    for (const a of els)
      for (const d of els) {
        if (affinityMult(a, d) !== 1.5) continue;
        expect([0.75, 1.5], `${a} → ${d} ×1.5, ${d} → ${a}`).toContain(affinityMult(d, a));
      }
    // no element of the matrix ends up with more than 3 strengths or 3 weaknesses
    for (const e of els) {
      expect(els.filter((d) => affinityMult(e, d) > 1).length, `${e} strong`).toBeLessThanOrEqual(3);
      expect(els.filter((a) => affinityMult(a, e) > 1).length, `${e} weak`).toBeLessThanOrEqual(3);
    }
  });

  it('every hull material knows Cristal (folded from especies.json → materialMult), Part I values untouched', () => {
    for (const m of CONTENT.materials) expect(m.mult.crystal, m.id).toBeGreaterThan(0);
    expect(materialMult('canvas', 'crystal')).toBe(1.25);
    expect(materialMult('iron', 'crystal')).toBe(0.75);
    expect(materialMult('crystal', 'light')).toBe(0.5); // Part I / Parte 2 value, not overwritten
  });
});

// ------------------------------------------------------------------ resonance
function own(species: string, level = 1, stars = 1) {
  const r = adopt(species, { free: true });
  const c = r.cat ?? G.s.cats.filter((x) => x.species === species).pop()!;
  c.level = level;
  c.stars = stars;
  return c;
}
const ALL = ['fire', 'water', 'nature', 'earth', 'storm', 'magic', 'cosmic', 'ice', 'sound', 'shadow', 'time', 'light', 'void', 'crystal'];
const discover = (els = ALL) => {
  for (const e of els) if (!G.s.elements.includes(e)) G.s.elements.push(e);
};
const commonOf = (el: string) => CONTENT.cats.find((c) => !c.secret && c.rarity === 'common' && c.elements.length === 1 && c.elements[0] === el)!.id;
const pool = (a: string, b: string) => oddsFor(a, b).rows.map((r) => r.species);

describe('resonance: the recipes really produce the species', () => {
  beforeEach(() => newGame());

  it('Cristal + Tierra → Facetas · Cristal + Luz → Espejito · Cristal + Agua (Nv15+) → Prismarina', () => {
    discover();
    expect(pool(own('c_brillito').uid, own(commonOf('earth')).uid)).toContain('r_facetas');
    expect(pool(own('c_brillito').uid, own('c_destello').uid)).toContain('r_espejito');
    const lowA = own('c_brillito', 10);
    const lowB = own(commonOf('water'), 10);
    expect(pool(lowA.uid, lowB.uid)).not.toContain('e_prismarina');
    expect(oddsFor(lowA.uid, lowB.uid).missing.some((m) => m.startsWith('Prismarina'))).toBe(true);
    expect(pool(own('c_brillito', 15).uid, own(commonOf('water'), 15).uid)).toContain('e_prismarina');
    // the commons come from any parent of their element
    expect(pool(own('c_brillito').uid, own('c_brillito').uid)).toEqual(['c_brillito']);
    expect(pool(own(commonOf('magic')).uid, own(commonOf('water')).uid)).toEqual(expect.arrayContaining(['c_marcapaginas', 'c_espumita']));
  });

  it('the Biblioteca combos: Sombra + Agua → Tintero, Luz + Agua → Farolillo, Magia + Agua (Nv15+) → Archivista', () => {
    discover();
    expect(pool(own(commonOf('shadow')).uid, own(commonOf('water')).uid)).toContain('r_tintero');
    expect(pool(own('c_destello').uid, own(commonOf('water')).uid)).toContain('r_farolillo');
    expect(pool(own(commonOf('magic'), 15).uid, own(commonOf('water'), 15).uid)).toContain('e_archivista');
  });

  it('nothing of Cristal resonates before Isla Nácar (the element must be discovered)', () => {
    discover(ALL.filter((e) => e !== 'crystal'));
    const t = oddsFor(own('c_brillito', 20).uid, own(commonOf('earth'), 20).uid);
    expect(t.rows.map((r) => r.species)).not.toContain('r_facetas');
    expect(t.rows.map((r) => r.species)).not.toContain('c_brillito');
  });

  it("story primordials only resonate as duplicates (not before you got the original), and the casino waits too", () => {
    discover();
    const a = own('c_brillito', 20);
    const b = own('c_brillito', 20);
    expect(pool(a.uid, b.uid)).not.toContain('l_madrenacar');
    expect(oddsFor(a.uid, b.uid).secret).not.toContain('l_madrenacar');
    const w1 = own(commonOf('water'), 20);
    const w2 = own('e_archivista', 20);
    expect(pool(w1.uid, w2.uid)).not.toContain('l_bibliotecario');
    expect(oddsFor(w1.uid, w2.uid).secret).not.toContain('l_bibliotecario');
    expect(eligibleCats().map((c) => c.id)).not.toContain('l_bibliotecario');
    // once you have them: the classic primordial rule (both parents share the element, Nv20+)
    G.s.catdex.l_madrenacar = 'registered';
    G.s.catdex.l_bibliotecario = 'registered';
    expect(pool(a.uid, b.uid)).toContain('l_madrenacar');
    expect(pool(w1.uid, w2.uid)).toContain('l_bibliotecario');
    expect(eligibleCats().map((c) => c.id)).toContain('l_bibliotecario');
  });

  it('expeditions with a Cristal cat bring Cristal crystals (habitat tiers need them)', () => {
    discover();
    expect(expeditionCrystalElement([own('r_facetas').uid])).toBe('crystal');
  });
});

describe('Refracta: the secret recipe leaves clues', () => {
  beforeEach(() => newGame());

  it('Cristal + Luz + Cósmico at low level: a RUMOR and what is missing, no ??? yet', () => {
    discover();
    const a = own('r_espejito', 10);
    const b = own(commonOf('cosmic'), 10);
    const k = secretClues(a.uid, b.uid).find((x) => x.species === 's_refracta');
    expect(k).toBeTruthy();
    expect(k!.ready).toBe(false);
    expect(k!.need).toMatch(/Nv20/);
    expect(oddsFor(a.uid, b.uid).secret).not.toContain('s_refracta');
    expect(noteSecretClues(a.uid, b.uid)).toContain('s_refracta');
    expect(G.s.catdex.s_refracta).toBe('rumor');
  });

  it('both Nv20+: the ??? bucket holds Refracta; a pair without Luz never does', () => {
    discover();
    const a = own('r_espejito', 20);
    const b = own(commonOf('cosmic'), 20);
    expect(secretClues(a.uid, b.uid).find((x) => x.species === 's_refracta')!.ready).toBe(true);
    expect(oddsFor(a.uid, b.uid).secret).toContain('s_refracta');
    const c = own('c_brillito', 20);
    expect(secretClues(c.uid, b.uid).some((x) => x.species === 's_refracta')).toBe(false);
    expect(oddsFor(c.uid, b.uid).secret).not.toContain('s_refracta');
  });
});

// ------------------------------------------------------------------ battle rules (battle/cristal.ts)
function crewCat(uid: string, species: string, level = 10) {
  return battleCatFrom({ uid, species, name: species, level, stars: 1, dmgMul: 1, hpMul: 1 }, ROLE_BY_ID.get(catDef(species).role)!.hp);
}
function spec(player: string[], enemy: string[], hpMul = 6): BattleSpec {
  return {
    player: { blueprint: BLUEPRINTS.sparrow, hpMul, cats: player.map((s, i) => crewCat(`p${i}`, s)), cannonAtk: 30 },
    enemy: { blueprint: BLUEPRINTS.sparrow, hpMul, cats: enemy.map((s, i) => crewCat(`e${i}`, s)), cannonAtk: 30 },
    playerName: 'Tú',
    enemyName: 'Ellos',
    difficulty: 'normal',
    onEnd: () => undefined,
  };
}
/** a cat (or a cannon: no shooter) lands its normal shot exactly on world point p, as one fresh shot */
function land(b: Battle, side: 0 | 1, uid: string | null, p: { x: number; y: number }) {
  const ev: BattleEvent[] = [];
  const cat = uid ? b.sides[side].cats.find((c) => c.def.uid === uid)! : null;
  const shooter = cat ?? b.sides[side].cats[0];
  crBeginFire(b);
  b.curShooter = cat;
  b.resolveImpact(side, shooter.def.shot, shooter.def.atk, p.x, p.y, ev, 0, 0, true);
  b.curShooter = null;
  return ev;
}
const mid = (b: Battle, side: number) => {
  // a plain hull cell in the middle of the sparrow (row 7, col 6/7 sits next to the core: use the hull row under it)
  const c = b.sides[side].ship.get(4, 8)!;
  return { cell: c, p: b.cellCenter(side, c.x, c.y) };
};
const reactions = (ev: BattleEvent[]) => ev.filter((e): e is Extract<BattleEvent, { k: 'reaction' }> => e.k === 'reaction').map((e) => e.name);
/** cells of `side` hit in `ev` that are farther than the blast reach from p */
function shardCells(b: Battle, ev: BattleEvent[], side: number, p: { x: number; y: number }, radius: number) {
  const out = new Set<Cell>();
  for (const e of ev) {
    if (e.k !== 'cell' || e.side !== side) continue;
    const c = b.cellCenter(side, e.cell.x, e.cell.y);
    if (Math.hypot(c.x - p.x, c.y - p.y) > radius + CELL * 0.35) out.add(e.cell);
  }
  return out;
}

describe('Cristal in ship battles (same rules both sides, no randomness of its own)', () => {
  it('a Cristal hit leaves PRISMA on the cells it hits and raises a FACETA on its own ship', () => {
    const b = makeBattle(spec(['c_brillito'], ['c_canelo']), 7);
    const { cell, p } = mid(b, 1);
    const ev = land(b, 0, 'p0', p);
    expect(cell.hp).toBeGreaterThan(0);
    expect(cell.status.prism).toBe(2);
    expect(crFacetUp(b, 0)).toBe(true);
    expect(crFacetUp(b, 1)).toBe(false);
    expect(ev.some((e) => e.k === 'info' && /FACETA/.test(e.text))).toBe(true);
    // the prism ages at its owner's turn start (lasts through the attacker's next turn) and fades
    b.startTurn(1);
    expect(cell.status.prism).toBe(1);
    b.startTurn(1);
    expect(cell.status.prism).toBeUndefined();
  });

  it('REFRACCIÓN: the next hit of another element there splits into 2 shards outside the blast; the prism is spent', () => {
    const b = makeBattle(spec(['c_brillito', 'c_canelo'], ['c_gelatino']), 7);
    const { cell, p } = mid(b, 1);
    land(b, 0, 'p0', p);
    const before = b.sides[1].ship.cells().reduce((a, c) => a + c.hp, 0);
    const ev = land(b, 0, 'p1', p);
    expect(reactions(ev)).toContain(REFRACCION);
    expect(cell.status.prism).toBeUndefined();
    const fire = b.sides[0].cats[1].def.shot;
    expect(shardCells(b, ev, 1, p, fire.radius).size).toBe(2);
    expect(b.sides[1].ship.cells().reduce((a, c) => a + c.hp, 0)).toBeLessThan(before);
    expect(crFeats(b).cr_refract).toBe(1);
    // the blast shattered the prism it touched: the same fire on the same spot doesn't refract again
    expect(reactions(land(b, 0, 'p1', p))).not.toContain(REFRACCION);
  });

  it('ESPECTRO: Luz on the prism hits ×1.25 and splits into 3 shards', () => {
    const b = makeBattle(spec(['c_brillito', 'c_destello'], ['c_gelatino']), 7);
    const { p } = mid(b, 1);
    land(b, 0, 'p0', p);
    const ev = land(b, 0, 'p1', p);
    const r = ev.find((e): e is Extract<BattleEvent, { k: 'reaction' }> => e.k === 'reaction' && e.name === ESPECTRO);
    expect(r?.mult).toBe(1.25);
    expect(shardCells(b, ev, 1, p, b.sides[0].cats[1].def.shot.radius).size).toBe(3);
  });

  it('a Cristal shot never refracts the prism it cut (it re-cuts it)', () => {
    const b = makeBattle(spec(['c_brillito', 'r_facetas'], ['c_gelatino']), 7);
    const { cell, p } = mid(b, 1);
    land(b, 0, 'p0', p);
    const ev = land(b, 0, 'p1', p);
    expect(reactions(ev)).not.toContain(REFRACCION);
    expect(cell.status.prism).toBeGreaterThan(0);
  });

  it('REFLEJO: the facet keeps half of the next enemy projectile and a shard goes back to its shooter', () => {
    const run = (facet: boolean) => {
      const b = makeBattle(spec(['c_brillito'], ['c_canelo']), 99);
      // the same Cristal impact in both runs (same rng draws); without a shooter it's "a cannon": no facet
      land(b, 0, facet ? 'p0' : null, mid(b, 1).p);
      expect(crFacetUp(b, 0)).toBe(facet);
      const foe = b.sides[1].cats[0];
      const hp0 = foe.hp;
      const ev = land(b, 1, 'e0', mid(b, 0).p);
      const dmg = ev.reduce((a, e) => a + (e.k === 'cell' && e.side === 0 ? e.dmg : 0), 0);
      return { b, ev, dmg, foeLost: hp0 - foe.hp };
    };
    const plain = run(false);
    const faceted = run(true);
    expect(reactions(plain.ev)).not.toContain(REFLEJO);
    expect(reactions(faceted.ev)).toContain(REFLEJO);
    expect(plain.dmg).toBeGreaterThan(0);
    // the facet stops (1 − facetKeep) of it (docs/part-ii/15-balance-cristal.md)
    expect(faceted.dmg / plain.dmg).toBeGreaterThan(CR_TUNE.facetKeep - 0.1);
    expect(faceted.dmg / plain.dmg).toBeLessThan(CR_TUNE.facetKeep + 0.1);
    expect(plain.foeLost).toBe(0);
    expect(faceted.foeLost).toBeGreaterThan(0);
    expect(faceted.ev.some((e) => e.k === 'cat' && e.side === 1 && e.element === 'crystal' && e.dmg > 0)).toBe(true);
    // spent, and gone at its owner's next turn anyway
    expect(crFacetUp(faceted.b, 0)).toBe(false);
    expect(CAT_K).toBeGreaterThan(0);
  });

  it('the facet only guards the enemy turn in between (it fades at its owner turn start)', () => {
    const b = makeBattle(spec(['c_brillito'], ['c_canelo']), 5);
    land(b, 0, 'p0', mid(b, 1).p);
    expect(crFacetUp(b, 0)).toBe(true);
    b.startTurn(1);
    expect(crFacetUp(b, 0)).toBe(true);
    b.startTurn(0);
    expect(crFacetUp(b, 0)).toBe(false);
  });

  it("Madre Nácar's MIRROR OF MEMORIES replays the last shot and leaves a facet up", () => {
    const b = makeBattle(spec(['l_madrenacar', 'c_canelo'], ['c_gelatino']), 21);
    b.startTurn(0);
    const ma = b.sides[0].cats[0];
    ma.ultCharge = 1;
    const a = aimFrom(b, 0, b.muzzle(0, ma.def.uid), ma.def.ultimate!, 1, 0, b.shipCenter(1));
    const r = b.fire(0, ma.def.uid, a.angle, a.power, true);
    expect(r.paths.length).toBeGreaterThan(0);
    expect(crFacetUp(b, 0)).toBe(true);
  });

  it('deterministic: the same seed replays the same Cristal battle (screen = estimate), and the rules do happen', () => {
    const s = spec(['l_madrenacar', 'r_espejito', 'c_canelo'], ['e_prismarina', 'r_facetas', 'c_destello'], 1);
    const play = () => {
      const log: string[] = [];
      let last: Battle | null = null;
      const res = autoBattle(s, DIFFICULTY.normal, 4242, 30, (b, side, shot) => {
        last = b;
        log.push(`${b.turn}|${side}|${shot}|${b.sides[0].ship.cells().reduce((a, c) => a + c.hp, 0)}|${b.sides[1].ship.cells().reduce((a, c) => a + c.hp, 0)}`);
      });
      return { res, log, feats: last ? crFeats(last) : {} };
    };
    const a = play();
    const b = play();
    expect(b.res).toEqual(a.res);
    expect(b.log).toEqual(a.log);
    expect(a.log.length).toBeGreaterThan(4);
    expect(a.feats.cr_facet ?? 0).toBeGreaterThan(0);
  });
});
