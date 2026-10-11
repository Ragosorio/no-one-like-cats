/**
 * Parte II · Oleada 3 «Sincronía» — SINCRO (Resonancia de combate, docs/part-ii/05-biblia-parte-ii.md §9.3 ·
 * docs/part-ii/24-batallas-musicales.md §4).
 *
 * The rhythm never reaches the sim. What reaches it is an EXPLICIT player input, like the angle or the power:
 * `fire(…, { sincro: true })` — the battle screen decides it (the shot was released inside a SINCRO window of the
 * battle's music plan, src/battle/music) and passes it in. The sim only reads that flag, so a replay with the same
 * inputs is the same battle, and the headless estimate (which never passes it) simply assumes no SINCRO.
 *
 * A SINCRO shot does something only when the crew holds a COMBO the shooter belongs to (both elements alive on
 * the crew). Combos are data (SINCRO_COMBOS); the one that exists today:
 *
 *   FUEGO + TORMENTA = SOBRECARGA   the shot's first impact on the foe chains a discharge to the nearest live
 *                                   modules — up to 3 jumps (each ≤ 4 cells away), each hitting that module's
 *                                   sturdiest cell for SC_JUMP × the shot's attack (and its cat a little).
 *
 * Pure rules, no rng: state in a WeakMap like ruido.ts / cristal.ts. Hooks: sim.ts fire() → scBeginFire / scAfterFire.
 */
import type { Battle, BattleEvent } from './sim';
import type { CatState, ElementId, ShotDef } from './types';
import { CELL } from './ship';
import type { Cell } from './ship';

/** what the player decided besides aim/power (recorded like any other input) */
export interface FireInput {
  /** released inside a SINCRO window */
  sincro?: boolean;
}

export interface SincroCombo {
  id: string;
  /** shown on the reaction plate */
  name: string;
  /** every group needs one live cat on the crew; the shooter must belong to one of them */
  groups: ElementId[][];
}

/** Fuego + Tormenta (rayo or ráfaga) = SOBRECARGA */
export const SINCRO_COMBOS: SincroCombo[] = [{ id: 'sobrecarga', name: 'SOBRECARGA', groups: [['fire'], ['electric', 'wind']] }];

/** damage of each chained jump, × the shot's attack (before armor / late-boss multipliers / the ult budget) */
export const SC_JUMP = 0.5;
/** jumps of the chain */
export const SC_JUMPS = 3;
/** farthest neighbour a jump reaches (cells, module centre to module centre) */
export const SC_REACH = 4;

interface ScState {
  /** the combo the current shot carries (null: none) */
  armed: SincroCombo | null;
  /** every input received: (turn, side, shooter, sincro) — replays / tests */
  inputs: { turn: number; side: number; shooter: string; sincro: boolean }[];
  /** SINCRO shots, and how many of them fired a combo */
  shots: number;
  combos: number;
}
const STATE = new WeakMap<Battle, ScState>();
function S(b: Battle): ScState {
  let s = STATE.get(b);
  if (!s) {
    s = { armed: null, inputs: [], shots: 0, combos: 0 };
    STATE.set(b, s);
  }
  return s;
}

/** the combo a cat would fire with SINCRO right now (null: none — the window does nothing for it) */
export function scComboFor(b: Battle, cat: CatState | undefined): SincroCombo | null {
  if (!cat || cat.ko) return null;
  const crew = b.sides[cat.side].cats.filter((c) => !c.ko);
  for (const k of SINCRO_COMBOS) {
    if (!k.groups.some((g) => cat.def.elements.some((e) => g.includes(e)))) continue;
    if (k.groups.every((g) => crew.some((c) => c.def.elements.some((e) => g.includes(e))))) return k;
  }
  return null;
}

/** a cat shot begins (cannons and boss summons never carry SINCRO) */
export function scBeginFire(b: Battle, side: number, cat: CatState | undefined, input: FireInput | undefined) {
  const has = STATE.has(b);
  if (!input?.sincro && !has) return; // battles that never see an input keep no state at all
  const s = S(b);
  s.armed = null;
  if (!cat) return;
  s.inputs.push({ turn: b.turn, side, shooter: cat.def.uid, sincro: !!input?.sincro });
  if (!input?.sincro) return;
  s.shots++;
  s.armed = scComboFor(b, cat);
}

/** SINCRO shots / combos fired (null: no input ever reached this battle) */
export function scStats(b: Battle): { shots: number; combos: number; inputs: ScState['inputs'] } | null {
  const s = STATE.get(b);
  return s ? { shots: s.shots, combos: s.combos, inputs: s.inputs.slice() } : null;
}

/** after the shot resolved: the armed combo acts on what it hit */
export function scAfterFire(b: Battle, side: number, shot: ShotDef, atk: number, events: BattleEvent[]) {
  const s = STATE.get(b);
  const k = s?.armed;
  if (!s || !k) return;
  s.armed = null;
  if (k.id === 'sobrecarga' && sobrecarga(b, side, shot, atk, events)) s.combos++;
}

function sobrecarga(b: Battle, side: number, _shot: ShotDef, atk: number, ev: BattleEvent[]): boolean {
  const foe = 1 - side;
  const hit = ev.find((e): e is Extract<BattleEvent, { k: 'impact' }> => e.k === 'impact' && e.side === foe);
  if (!hit) return false;
  const fs = b.sides[foe];
  const ship = fs.ship;
  const g = b.toGrid(foe, hit.x, hit.y);
  const live = ship.modules.filter((m) => m.alive);
  if (!live.length) return false;
  const ctr = (m: (typeof live)[number]) => ({ x: m.x + (m.w - 1) / 2, y: m.y + (m.h - 1) / 2 });
  const dist = (a: { x: number; y: number }, c: { x: number; y: number }) => Math.hypot(a.x - c.x, a.y - c.y);
  // where the discharge starts: the module nearest to the impact (it may be the one it just broke)
  let from = { x: g.x, y: g.y };
  const seen = new Set<number>();
  const chain: Cell[] = [];
  for (let j = 0; j < SC_JUMPS; j++) {
    const next = live
      .filter((m) => !seen.has(m.id) && ship.moduleCells(m.id).length > 0)
      .map((m) => ({ m, d: dist(from, ctr(m)) }))
      .sort((a, c) => a.d - c.d || a.m.id - c.m.id)[0];
    if (!next || next.d > SC_REACH + (j === 0 ? 1.5 : 0)) break;
    seen.add(next.m.id);
    // the sturdiest cell of the module takes the jump (deterministic tie-break: grid order)
    const cell = ship
      .moduleCells(next.m.id)
      .slice()
      .sort((a, c) => c.hp - a.hp || a.y - c.y || a.x - c.x)[0];
    chain.push(cell);
    from = ctr(next.m);
  }
  if (!chain.length) return false;
  const p0 = b.cellCenter(foe, chain[0].x, chain[0].y);
  ev.push({ k: 'reaction', name: 'SOBRECARGA', x: p0.x, y: p0.y, mult: 1, path: hit.path, at: hit.at });
  const armor = fs.setup.armor ?? 1;
  for (const c of chain) {
    const dmg = b.cap(foe, Math.round(atk * SC_JUMP * armor));
    if (dmg <= 0) continue;
    b.hurtCell(foe, c, dmg);
    const destroyed = c.hp <= 0;
    const mid = c.module;
    if (destroyed) {
      ship.destroyCell(c.x, c.y);
      if (mid !== undefined) b.reportModule(foe, mid, ev, hit.path, hit.at);
    }
    ev.push({ k: 'cell', side: foe, cell: c, dmg, destroyed, path: hit.path, at: hit.at });
    if (mid !== undefined) {
      const cat = fs.cats.find((x) => x.room === mid && !x.ko);
      if (cat) b.hitCat(cat, Math.round(atk * SC_JUMP * 0.3), ev, hit.path, hit.at, 'electric', false, true);
    }
  }
  const last = b.cellCenter(foe, chain[chain.length - 1].x, chain[chain.length - 1].y);
  ev.push({ k: 'info', text: `SINCRO · ${chain.length} SALTO${chain.length > 1 ? 'S' : ''}`, x: last.x, y: last.y - CELL * 2, color: 0xffe14a, path: hit.path, at: hit.at });
  return true;
}
