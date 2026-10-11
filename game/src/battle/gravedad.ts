/**
 * Parte II · Oleada 2 — GRAVEDAD in ship battles. Verb: MOVER (pull projectiles, shove broken modules off a ship).
 *
 * Pure rules, no rendering, the SAME for both sides (an enemy Masa Madre pulls their shots exactly like yours pulls
 * yours). sim.ts calls a few small hooks; the per-battle state lives here in a WeakMap (like cristal.ts) so
 * Battle/SideState don't grow fields. Deterministic: no rng is drawn anywhere.
 *
 *   FLOTANDO   every Gravedad shot leaves the cells it hits floating (cell status `grav`, 2 turns: it ages at the
 *              owner's turn start; Nv20 +1 — catShots.shotFromSpec). A floating cell takes ×1.35 from foe hits
 *              (GR_TUNE.floatMul, sim.ts resolveImpact): nothing to brace against.
 *   ¡AL AGUA! / ¡AL VACÍO!  (reaction, once per shot) a FOE impact touches a module (never the core, a cabin or a
 *              boss-tagged module) that is already broken down to the threshold: it falls off the ship whole —
 *              every cell it has left is gone. Threshold: a FLOTANDO module ≤40% at sea, ≤60% in the sky
 *              (battle/cielo.ts); in the sky ANY module ≤25% falls into the void. A side with the Kit de Vuelo
 *              level 3 (Ancla de Nube) uses the sea numbers even in the sky. It respects the ultimate budget, Gea's
 *              HEART OF STONE and immune boss cells.
 *   POZO       a Gravedad CAT shot whose last impact lands on the enemy ship opens a small gravity well there
 *              (one per side, the newest replaces the old). Only that side's projectiles bend toward it: the
 *              automatic volley of that turn and the cat shot of its next turn (Well.turns 2, aged at the owner's
 *              turn start by bossLate.tickBuffs). The AI and the aim preview see it: they integrate the same field.
 *
 * Hooks: sim.ts fire() (grBeginFire) · resolveImpact (grAfterImpact, after the blast, before the impact event) ·
 * ai.ts (grShotValue) · ults.ts (grFirstMass: Masa Madre's FIRST MASS!).
 */
import type { Battle, BattleEvent, ShotPath, Well } from './sim';
import type { ShotDef } from './types';
import type { Cell, ModuleInst } from './ship';
import { CELL } from './ship';
import { lateCellMul } from './bossLate';
import { skyAnchored, skyOn } from './cielo';

/**
 * Tuning (docs/part-ii/22-oleada-2.md). One object so a balance harness can try values; the game never writes it.
 *   wellR / wellK   the POZO's reach (px) and pull at its center (px/s², linear falloff) · wellTurns its life
 *   seaThr          a FLOTANDO module at or under this share of its life falls off at sea (¡AL AGUA!)
 *   skyThr          …in the sky (¡AL VACÍO!) · skyAny: any module (not floating) in the sky
 *   floatMul        a FLOTANDO cell takes this much more from foe hits (nothing to brace against)
 */
export const GR_TUNE = { wellR: 200, wellK: 1800, wellTurns: 2, seaThr: 0.4, skyThr: 0.6, skyAny: 0.25, floatMul: 1.35 };

/** the reaction names this module raises (labels / grimoire read them) */
export const AL_AGUA = '¡AL AGUA!';
export const AL_VACIO = '¡AL VACÍO!';

interface GrState {
  /** the POZO of each side (a Well in b.wells) */
  pozo: [Well | null, Well | null];
  /** per-shot one-time effects */
  shot: { shoved: boolean; pozo: boolean };
  /** player-side feats (BattleScene may add them to the save as counters) */
  feats: Record<string, number>;
}
const STATE = new WeakMap<Battle, GrState>();
function S(b: Battle): GrState {
  let s = STATE.get(b);
  if (!s) {
    s = { pozo: [null, null], shot: { shoved: false, pozo: false }, feats: {} };
    STATE.set(b, s);
  }
  return s;
}
function feat(b: Battle, side: number, k: string, n = 1) {
  if (side !== 0 || n <= 0) return;
  const f = S(b).feats;
  f[k] = (f[k] ?? 0) + n;
}
/** player feats of this battle: gr_pozo, gr_shove */
export function grFeats(b: Battle): Record<string, number> {
  return { ...S(b).feats };
}

/** a new shot begins: one shove and one POZO per shot */
export function grBeginFire(b: Battle) {
  S(b).shot = { shoved: false, pozo: false };
}

/** the POZO a side has open right now (null = none / it wore off) */
export function grPozo(b: Battle, side: number): Well | null {
  const w = S(b).pozo[side];
  return w && b.wells.includes(w) ? w : null;
}

/** open (or move) `side`'s POZO at x,y. `big`: Masa Madre's FIRST MASS! */
export function grOpenPozo(b: Battle, side: number, x: number, y: number, ev: BattleEvent[], path = 0, at = 0, big?: { r: number; k: number; turns: number }) {
  const st = S(b);
  const old = st.pozo[side];
  if (old) b.wells = b.wells.filter((w) => w !== old);
  const w: Well = { x, y, r: big?.r ?? GR_TUNE.wellR, k: big?.k ?? GR_TUNE.wellK, turns: big?.turns ?? GR_TUNE.wellTurns, owner: side, affects: side, kind: 'well' };
  b.wells.push(w);
  st.pozo[side] = w;
  ev.push({ k: 'info', text: big ? '¡FIRST MASS! TODO CAE HACIA AQUÍ' : '¡POZO!', x, y: y - 90, color: 0xb9a7ff, path, at });
  feat(b, side, 'gr_pozo');
  return w;
}

/** life left of a module, 0..1 (its lost cells count as empty) */
export function moduleLife(cells: Cell[], m: ModuleInst) {
  if (!cells.length) return 0;
  const hp = cells.reduce((a, c) => a + Math.max(0, c.hp), 0);
  const max = cells.reduce((a, c) => a + c.maxHp, 0) / cells.length;
  return hp / Math.max(1, max * m.w * m.h);
}

/** the share of its life under which a module of `side` falls off now (0 = it can't) */
export function shoveThreshold(b: Battle, side: number, floating: boolean) {
  const sky = skyOn(b) && !skyAnchored(b, side);
  if (sky) return floating ? GR_TUNE.skyThr : GR_TUNE.skyAny;
  return floating ? GR_TUNE.seaThr : 0;
}

const SHOVEABLE = (m: ModuleInst) => m.alive && !m.tag && m.kind !== 'core' && m.kind !== 'catroom';

/**
 * After a FOE impact resolved its blast (cells already hurt, before the impact event): the shove (¡AL AGUA! /
 * ¡AL VACÍO!) and the POZO of a Gravedad cat shot. `touched` = the target ship's cells the blast reached.
 * Returns the extra structure damage dealt.
 */
export function grAfterImpact(b: Battle, attSide: number, targetSide: number, shot: ShotDef, final: boolean, touched: Cell[], x: number, y: number, ev: BattleEvent[], path: number, at: number): number {
  if (attSide === targetSide) return 0;
  const st = S(b);
  let total = 0;
  // ---- the shove: once per shot, the first broken module the blast touched
  if (!st.shot.shoved && b.sides[targetSide].buffs.stone <= 0) {
    const ship = b.sides[targetSide].ship;
    const seen = new Set<number>();
    for (const c of touched) {
      const mid = c.module;
      if (mid === undefined || seen.has(mid)) continue;
      seen.add(mid);
      const m = ship.modules[mid];
      if (!m || !SHOVEABLE(m)) continue;
      const cells = ship.moduleCells(mid);
      if (!cells.length || cells.some((k) => lateCellMul(b, targetSide, k) <= 0)) continue;
      const floating = cells.some((k) => (k.status.grav ?? 0) > 0);
      const thr = shoveThreshold(b, targetSide, floating);
      if (thr <= 0 || moduleLife(cells, m) > thr) continue;
      const rest = cells.reduce((a, k) => a + Math.max(0, k.hp), 0);
      // an ultimate's structure budget: a shove never tears off more than it has left
      if (b.budget && b.budget.side === targetSide && b.budget.left < rest) continue;
      st.shot.shoved = true;
      const name = skyOn(b) ? AL_VACIO : AL_AGUA;
      const p = b.roomCenter(targetSide, mid);
      ev.push({ k: 'reaction', name, x: p.x, y: p.y, mult: 1, path, at });
      for (const k of cells) {
        const d = b.cap(targetSide, Math.max(0, k.hp));
        total += d;
        ship.destroyCell(k.x, k.y);
        ev.push({ k: 'cell', side: targetSide, cell: k, dmg: d, destroyed: true, path, at });
      }
      b.reportModule(targetSide, mid, ev, path, at);
      feat(b, attSide, 'gr_shove');
      break;
    }
  }
  // ---- the POZO: a Gravedad CAT shot that landed on the enemy ship
  if (final && !st.shot.pozo && shot.element === 'gravity' && b.curShooter && b.curShooter.side === attSide && b.cellAt(x, y)?.side === targetSide) {
    st.shot.pozo = true;
    grOpenPozo(b, attSide, x, y, ev, path, at);
  }
  return total;
}

/**
 * Masa Madre's FIRST MASS! (ults.ts): after her own shot, a big POZO over the enemy ship (r 320, 2 turns, ★5 3)
 * and every enemy cell within 2.5 cells of it floats (FLOTANDO 2).
 */
export function grFirstMass(b: Battle, side: number, stars: number, ev: BattleEvent[]) {
  const enemy = 1 - side;
  const c = b.shipCenter(enemy);
  const es = b.sides[enemy];
  const top = es.setup.origin.y;
  const x = c.x;
  const y = Math.min(c.y, top + CELL * 2);
  grOpenPozo(b, side, x, y, ev, 0, 0, { r: 320, k: 2200, turns: stars >= 5 ? 3 : 2 });
  const floated: Cell[] = [];
  for (const cell of es.ship.cells()) {
    const p = b.cellCenter(enemy, cell.x, cell.y);
    if (Math.hypot(p.x - x, p.y - y) > CELL * 2.5) continue;
    cell.status.grav = Math.max(cell.status.grav ?? 0, 2);
    floated.push(cell);
  }
  if (floated.length) ev.push({ k: 'status', side: enemy, cells: floated, status: 'grav' });
}

// ------------------------------------------------------------------ AI
/**
 * Extra value the AI sees (so the computer plays the element on purpose): a Gravedad shot while its side has no
 * POZO open, any shot that lands on a FLOTANDO cell, and one that lands on a broken module that would fall off.
 */
export function grShotValue(b: Battle, side: number, shot: ShotDef, paths: ShotPath[]): number {
  let v = 1;
  if (shot.element === 'gravity' && !grPozo(b, side)) v *= 1.1;
  const p = paths[0];
  if (!p?.impacts.length) return v;
  const enemy = 1 - side;
  const ship = b.sides[enemy].ship;
  const ip = p.points[p.impacts[p.impacts.length - 1]];
  const hit = b.cellAt(ip.x, ip.y);
  // landing on what already floats (×floatMul there): play the combo
  if (hit && hit.side === enemy && (hit.cell.status.grav ?? 0) > 0) v *= 1.2;
  if (!hit || hit.side !== enemy || hit.cell.module === undefined) return v;
  const m = ship.modules[hit.cell.module];
  if (!m || !SHOVEABLE(m)) return v;
  const cells = ship.moduleCells(m.id);
  const thr = shoveThreshold(b, enemy, cells.some((k) => (k.status.grav ?? 0) > 0));
  if (thr > 0 && moduleLife(cells, m) <= thr) v *= 1.25;
  return v;
}
