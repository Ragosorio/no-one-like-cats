/**
 * Parte II · Oleada 1 — CRISTAL in ship battles. Verb: REDIRIGIR (bounces and refracting barriers).
 *
 * Pure rules, no rendering, the SAME for both sides (an enemy Madre Nácar refracts you exactly like yours
 * refracts them). sim.ts calls a few small hooks; the per-battle state lives here in a WeakMap (like
 * multiverso.ts) so Battle/SideState don't grow fields. Everything is deterministic: no rng is drawn.
 *
 *   PRISMA      a Cristal impact leaves the cells it hits PRISMÁTICAS (cell status `prism`, 2 turns: it ages at
 *               the owner's turn start, so it lasts through the attacker's next turn; Nv20 +1).
 *   REFRACCIÓN  the first foe hit of ANOTHER element on a prism cell (once per shot) is refracted: the cell takes
 *               the hit and the blow splits into 2 shards (×0.75 of what the cell took) that jump to the nearest
 *               intact cells outside the blast. The blast shatters the prism it touched (every prism cell in it is
 *               spent). Light on prism = ESPECTRO (×1.25, 3 shards).
 *               Cristal shots never refract their own prism (they re-cut it): it's a combo for the crew.
 *   FACETA      every Cristal CAT shot that lands raises a nacre facet on its own ship (one at a time). The next
 *               enemy projectile that lands on that ship (final impact) is REDIRECTED (REFLEJO): the facet keeps
 *               40% of it (60% lands), and the cat that fired it gets a shard back (×0.15). A cannon just loses 40%. The
 *               facet fades at its owner's next turn start: it guards the enemy turn in between.
 */
import type { Battle, BattleEvent, ShotPath } from './sim';
import type { ShotDef } from './types';
import { CELL } from './ship';
import type { Cell } from './ship';
import { lateCellMul } from './bossLate';

interface CrState {
  /** a nacre facet is up on that side's ship */
  facet: [boolean, boolean];
  /** per-shot one-time effects */
  shot: { refracted: boolean; faceted: boolean };
  /** player-side feats (BattleScene can add them to the save as counters) */
  feats: Record<string, number>;
}
const STATE = new WeakMap<Battle, CrState>();
function S(b: Battle): CrState {
  let s = STATE.get(b);
  if (!s) {
    s = { facet: [false, false], shot: { refracted: false, faceted: false }, feats: {} };
    STATE.set(b, s);
  }
  return s;
}

/** the reactions this module raises (sim / labels / grimoire read them by name) */
export const REFRACCION = 'REFRACCIÓN';
export const ESPECTRO = 'ESPECTRO';
export const REFLEJO = 'REFLEJO';
/**
 * Tuning (docs/part-ii/15-balance-cristal.md). One object so the balance harness (scripts/balance-crystal.ts)
 * can try values without touching the rules; the game never writes it.
 *   shard         share of the refracted hit that each shard carries
 *   facetKeep     share of a redirected projectile that still lands (the facet takes the rest)
 *   facetReflect  share of that projectile that goes back to the cat who fired it
 */
export const CR_TUNE = { shard: 0.75, facetKeep: 0.6, facetReflect: 0.15 };

function feat(b: Battle, side: number, k: string, n = 1) {
  if (side !== 0 || n <= 0) return;
  const f = S(b).feats;
  f[k] = (f[k] ?? 0) + n;
}
/** player feats of this battle: cr_refract, cr_facet, cr_reflect */
export function crFeats(b: Battle): Record<string, number> {
  return { ...S(b).feats };
}
function shipCenter(b: Battle, side: number) {
  const s = b.sides[side];
  return { x: s.setup.origin.x + (s.ship.cols * CELL) / 2, y: s.setup.origin.y + (s.ship.rows * CELL) / 2 };
}

// ------------------------------------------------------------------ turn flow
/** a new shot begins: one refraction and one facet per shot */
export function crBeginFire(b: Battle) {
  S(b).shot = { refracted: false, faceted: false };
}
/** start of `side`'s turn: its facet (raised last turn) fades — it already guarded the enemy turn */
export function crStartTurn(b: Battle, side: 0 | 1) {
  S(b).facet[side] = false;
}
/** a facet is up on that side's ship */
export function crFacetUp(b: Battle, side: number) {
  return S(b).facet[side];
}
/** raise a nacre facet on `side`'s ship (Cristal cat shots, Madre Nácar's ultimate) */
export function crRaiseFacet(b: Battle, side: number, ev: BattleEvent[], path = 0, at = 0) {
  const st = S(b);
  if (st.facet[side]) return;
  st.facet[side] = true;
  const p = shipCenter(b, side);
  ev.push({ k: 'info', text: '¡FACETA DE NÁCAR!', x: p.x, y: p.y - 170, color: 0x8fd3ff, path, at });
  feat(b, side, 'cr_facet');
}

// ------------------------------------------------------------------ PRISMA → REFRACCIÓN / ESPECTRO
/**
 * Reaction on a prism cell hit by the other side. Returns null when it doesn't refract (then the classic and
 * Parte 2 reactions run as usual). Pushes the reaction plate itself.
 */
export function crReact(b: Battle, shot: ShotDef, c: Cell, ev: BattleEvent[], path: number, at: number, x: number, y: number): { name: string; mult: number } | null {
  if (!c.status.prism || shot.element === 'crystal') return null;
  const st = S(b);
  if (st.shot.refracted) return null;
  st.shot.refracted = true;
  delete c.status.prism;
  const light = shot.element === 'light';
  const r = { name: light ? ESPECTRO : REFRACCION, mult: light ? 1.25 : 1 };
  ev.push({ k: 'reaction', name: r.name, x, y, mult: r.mult, path, at });
  return r;
}
/** shards of a refraction: how many, by reaction name (0 = not a refraction) */
export function crShards(name: string) {
  return name === ESPECTRO ? 3 : name === REFRACCION ? 2 : 0;
}

/**
 * The refracted blow splits: `n` shards (×CR_TUNE.shard of `dmg`) hit the intact cells nearest to `from` that the blast
 * didn't touch (ties: top row first, then left), and the prism the blast touched is spent. Respects the ultimate
 * budget and immune boss cells. Returns the structure damage dealt.
 */
export function crRefract(b: Battle, side: number, from: Cell, dmg: number, n: number, blast: Set<Cell>, attSide: number, ev: BattleEvent[], path: number, at: number): number {
  const ship = b.sides[side].ship;
  for (const c of blast) if (c.status.prism && ship.get(c.x, c.y) === c) delete c.status.prism;
  const d2 = (c: Cell) => (c.x - from.x) ** 2 + (c.y - from.y) ** 2;
  const targets = ship
    .cells()
    .filter((c) => c !== from && c.hp > 0 && !blast.has(c) && (side === attSide || lateCellMul(b, side, c) > 0))
    .sort((p, q) => d2(p) - d2(q) || p.y - q.y || p.x - q.x)
    .slice(0, n);
  let total = 0;
  const shard = Math.max(1, Math.round(dmg * CR_TUNE.shard));
  for (const c of targets) {
    const d = b.cap(side, shard);
    if (d <= 0) break;
    b.hurtCell(side, c, d);
    total += d;
    const destroyed = c.hp <= 0;
    if (destroyed) {
      const mid = c.module;
      ship.destroyCell(c.x, c.y);
      if (mid !== undefined) b.reportModule(side, mid, ev, path, at);
    }
    ev.push({ k: 'cell', side, cell: c, dmg: d, destroyed, path, at });
  }
  if (targets.length) feat(b, attSide, 'cr_refract');
  return total;
}

// ------------------------------------------------------------------ FACETA → REFLEJO
/**
 * Before a FINAL foe impact on `targetSide` resolves: a facet there redirects it. Returns the multiplier for
 * the impact's base damage (CR_TUNE.facetKeep when the facet took it, else 1). The shooter cat gets a shard back.
 */
export function crFacet(b: Battle, attSide: number, targetSide: number, base: number, catK: number, x: number, y: number, ev: BattleEvent[], path: number, at: number): number {
  const st = S(b);
  if (!st.facet[targetSide]) return 1;
  st.facet[targetSide] = false;
  ev.push({ k: 'reaction', name: REFLEJO, x, y, mult: CR_TUNE.facetKeep, path, at });
  const shooter = b.curShooter;
  if (shooter && !shooter.ko && shooter.side === attSide) {
    b.hitCat(shooter, Math.max(1, Math.round(base * CR_TUNE.facetReflect * catK)), ev, path, at, 'crystal', true);
    feat(b, targetSide, 'cr_reflect');
  }
  return CR_TUNE.facetKeep;
}

/** after an impact resolved: a Cristal CAT shot that landed on the enemy raises its side's facet (once per shot) */
export function crImpact(b: Battle, attSide: number, targetSide: number, shot: ShotDef, final: boolean, ev: BattleEvent[], path: number, at: number) {
  if (attSide === targetSide || !final || shot.element !== 'crystal' || !b.curShooter) return;
  const st = S(b);
  if (st.shot.faceted) return;
  st.shot.faceted = true;
  crRaiseFacet(b, attSide, ev, path, at);
}

// ------------------------------------------------------------------ AI
/**
 * Extra value the AI sees (so the computer plays the combo): another element's shot that lands on prism cells
 * (light more: ESPECTRO), and a Cristal shot while its own ship has no facet up.
 */
export function crShotValue(b: Battle, side: number, shot: ShotDef, paths: ShotPath[]): number {
  if (shot.element === 'crystal') return S(b).facet[side] ? 1 : 1.1;
  const p = paths[0];
  if (!p?.impacts.length) return 1;
  const enemy = 1 - side;
  const ip = p.points[p.impacts[p.impacts.length - 1]];
  const cells = b.sides[enemy].ship.cells().filter((c) => {
    const cc = b.cellCenter(enemy, c.x, c.y);
    return Math.hypot(cc.x - ip.x, cc.y - ip.y) <= shot.radius + CELL;
  });
  if (!cells.some((c) => c.status.prism)) return 1;
  return shot.element === 'light' ? 1.35 : 1.2;
}
