/**
 * After the Parte III · TANDA 2 (agent PODERES-3, 2026-10-29) — the shared kit of the 25 second-batch post
 * MULTIDIMENSIONAL powers: their per-battle state (nested in kit.ts's MdpState as `d`, so "no post power in the fight →
 * no state at all" still holds) and the little geometry the new rules need (a point in a triangle, lonely cabins, the
 * rim of a ship, a removal that never leaves anything hanging). Same rules as kit.ts: player side only, deterministic,
 * structure caps through Battle.budget. Design: docs/post-p3/05-tanda-2.md; what changed and why:
 * docs/post-p3/agentes/PODERES-3.md.
 */
import type { Battle, BattleEvent, PathPoint } from '../sim';
import type { Cell } from '../ship';
import type { CatState, ElementId, StatusApply } from '../types';
import { cut, holdsShip } from '../ults';
import { S, peek } from './kit';
import type { Timer } from './kit';

/** one missed shot of your crew (Doc Miauwn's log): where it went, with what */
export interface Miss {
  x: number;
  y: number;
  element: ElementId;
  statuses: StatusApply[];
}

export interface DState {
  /** El Sombreronrón: the ribbons pinned by your next impacts (owner clock) */
  braid: { side: number; t: Timer; pins: PathPoint[]; atk: number; pw: number; by: CatState } | null;
  /** …and the cats whose whiskers it braided: no meter on their next turn (the meter they had) */
  braided: Map<CatState, { t: Timer; meter: number }>;
  /** Quetzalgatl: the wind is his (owner clock: the rest of this turn and 3 more of yours); `base` comes back after */
  wind: { side: number; t: Timer; base: number } | null;
  /** Bastet: the owner's cells don't go under 30 % during the foe's turns; every clipped blow feeds the sun */
  guard: { side: number; t: Timer; rays: number; atk: number; pw: number; by: CatState; done: boolean } | null;
  /** Cleogatra's wager: the HP of both sides when it was cast; settled when the foe's 2 turns are over */
  wager: { side: number; t: Timer; mine0: number; theirs0: number; atk: number; pw: number; by: CatState } | null;
  /** Napoleón Bonapata: conquered cells in the window (owner clock) and the crew's bonus for the rest of the battle */
  conquest: { side: number; t: Timer; cells: number; per: number; max: number } | null;
  bonus: [number, number];
  /** Leonardo's machines: the next shot of each of your cats (owner clock) */
  codex: Map<CatState, Timer>;
  /** La Michi de la Perla: the soft light, turns of yours left */
  light: { side: number; turns: number } | null;
  /** Isaac Miauton: lighter shots for the owner, heavier for the foe */
  gravity: { side: number; mine: Timer; theirs: Timer; heavy: number } | null;
  /** Miauzart's encore: the next ultimate of another cat of the owner plays twice */
  encore: { side: number; t: Timer; by: CatState } | null;
  /** Mi Pobre Gatito: traps hidden in the owner's cells (foe clock); the next trap in the fixed order */
  traps: { side: number; t: Timer; cells: Cell[]; next: number; atk: number; pw: number; by: CatState } | null;
  /** …a shooter that stepped on the toy cars: its next shot swerves 20° and hits ×0.5 */
  swerve: Set<string>;
  /** Felinamente Rubia's objection (foe clock): the first new status on one of the owner's cats is turned around */
  objection: { side: number; t: Timer; used: boolean } | null;
  /** the owner's cats' statuses when the foe's shot began (to tell a new one) */
  fx0: Map<CatState, { burning: number; shocked: number; wet: number; frozen: number; stunned: number }>;
  /** statuses each foe cat put on the owner's side this battle (Felinamente's book) */
  statusBy: Map<CatState, number>;
  /** damage each foe cat did to the owner's side this battle (Ricardo Garjona's story) */
  hurtBy: Map<CatState, number>;
  /** Capitán Gorrimiau's compass (owner clock) */
  compass: { side: number; t: Timer; by: CatState; prey?: CatState | null; preyKo?: boolean } | null;
  /** Doc Miauwn's log of your crew's missed shots (the 10 most recent) */
  misses: Miss[];
  /** Pinkmiau: every blow of the owner's crew leaves Vapor (owner clock); the Heisenmiau combo lasts 2 turns more */
  lab: { side: number; t: Timer; combo: Timer } | null;
  /** Ricardo Garjona: MARKED cats (foe clock): the owner's shots at them ×1.25 */
  marked: Map<CatState, Timer>;
}

export function newD(): DState {
  return {
    braid: null,
    braided: new Map(),
    wind: null,
    guard: null,
    wager: null,
    conquest: null,
    bonus: [0, 0],
    codex: new Map(),
    light: null,
    gravity: null,
    encore: null,
    traps: null,
    swerve: new Set(),
    objection: null,
    fx0: new Map(),
    statusBy: new Map(),
    hurtBy: new Map(),
    compass: null,
    misses: [],
    lab: null,
    marked: new Map(),
  };
}
/** the tanda-2 state of this battle (created with the post state the first time a tanda-2 rule needs it) */
export function D(b: Battle): DState {
  const st = S(b);
  st.d ??= newD();
  return st.d;
}
export function peekD(b: Battle): DState | null {
  return peek(b)?.d ?? null;
}

// ------------------------------------------------------------------ geometry
/** is p inside the triangle abc, or on its border (a few px of slack)? */
export function inTriangle(p: PathPoint, a: PathPoint, b: PathPoint, c: PathPoint, slack = 4): boolean {
  const area = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
  if (Math.abs(area) < 1) {
    // a flat triangle: the segment's neighbourhood
    return [a, b, c].some((q, i, all) => segDist(p, q, all[(i + 1) % 3]) <= slack);
  }
  const s = Math.sign(area);
  const e = (u: PathPoint, v: PathPoint) => s * ((v.x - u.x) * (p.y - u.y) - (p.x - u.x) * (v.y - u.y)) / Math.hypot(v.x - u.x, v.y - u.y);
  return e(a, b) >= -slack && e(b, c) >= -slack && e(c, a) >= -slack;
}
function segDist(p: PathPoint, a: PathPoint, b: PathPoint) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l = dx * dx + dy * dy;
  const t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}
/** a cat is ALONE when no other cabin of its side shares an edge with its own */
export function alone(b: Battle, c: CatState): boolean {
  const ship = b.sides[c.side].ship;
  const mine = ship.moduleCells(c.room);
  if (!mine.length) return true;
  const others = ship.modules.filter((m) => m.kind === 'catroom' && m.id !== c.room);
  for (const m of others)
    for (const q of ship.moduleCells(m.id)) if (mine.some((k) => Math.abs(k.x - q.x) + Math.abs(k.y - q.y) === 1)) return false;
  return true;
}
/**
 * the rim of a side's ship: every live cell with an empty side, from the bow (the end that faces the shooter) at the top,
 * clockwise around the hull's middle
 */
export function rim(b: Battle, side: number, shooter: number): Cell[] {
  const ship = b.sides[side].ship;
  const cells = ship.cells();
  if (!cells.length) return [];
  const edge = cells.filter((c) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !ship.get(c.x + dx, c.y + dy)));
  const pts = edge.map((c) => ({ c, q: b.cellCenter(side, c.x, c.y) }));
  const cx = pts.reduce((a, p) => a + p.q.x, 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p.q.y, 0) / pts.length;
  const toward = b.shipCenter(shooter).x < cx ? -1 : 1;
  // the bow's top: the column nearest the shooter, its highest cell
  const bow = [...pts].sort((a, z) => toward * (z.q.x - a.q.x) || a.q.y - z.q.y)[0];
  const a0 = Math.atan2(bow.q.y - cy, bow.q.x - cx);
  // clockwise on screen (y down) = growing angle; the bow on the right runs the other way so it still starts over the top
  const sign = toward < 0 ? 1 : -1;
  const ang = (p: { q: PathPoint }) => {
    let a = sign * (Math.atan2(p.q.y - cy, p.q.x - cx) - a0);
    while (a < 0) a += Math.PI * 2;
    while (a >= Math.PI * 2) a -= Math.PI * 2;
    return a;
  };
  return pts.sort((a, z) => ang(a) - ang(z) || a.c.y - z.c.y || a.c.x - z.c.x).map((p) => p.c);
}
/** the life a side still has: its cells and its cats */
export function lifeOf(b: Battle, side: number) {
  const s = b.sides[side];
  return s.ship.cells().reduce((a, c) => a + Math.max(0, c.hp), 0) + s.cats.reduce((a, c) => a + (c.ko ? 0 : Math.max(0, c.hp)), 0);
}
/** a ship's structure as a fraction of its starting max */
export function hullFrac(b: Battle, side: number) {
  const s = b.sides[side];
  const max = s.ship.initialMax?.[0] ?? 0;
  return max ? s.ship.cells().reduce((a, c) => a + Math.max(0, c.hp), 0) / max : 1;
}
/**
 * break cells one by one (in the given order) — but never one that would leave something hanging (ship.collapse), and
 * never more than half of what a core cell has left. Inside the caller's budget (cut). The ones that hold the ship up,
 * or that the budget ran out on, stay. Returns how many broke.
 */
export function breakSafely(b: Battle, side: number, cells: Cell[], ev: BattleEvent[], path: number, at: number): number {
  const s = b.sides[side];
  let n = 0;
  for (const c of cells) {
    if (c.hp <= 0 || s.ship.get(c.x, c.y) !== c) continue;
    const core = c.module !== undefined && s.ship.modules[c.module].kind === 'core';
    if (core) {
      cut(b, side, c, Math.min(c.hp - 1, Math.ceil(c.hp / 2)), ev, path, at);
      continue;
    }
    if (holdsShip(s.ship, c)) continue;
    const d = cut(b, side, c, c.hp, ev, path, at);
    if (d > 0 && c.hp <= 0) n++;
    if (b.budget && b.budget.side === side && b.budget.left <= 0) break;
  }
  return n;
}
/** Pinkmiau's lab with Heisenmiau in the crew: PURE CHEMISTRY counts every status twice */
export function chemCombo(b: Battle, side: number) {
  const lab = peekD(b)?.lab;
  return !!lab && lab.side === side && (lab.t.now || lab.t.next > 0 || lab.combo.now || lab.combo.next > 0);
}
