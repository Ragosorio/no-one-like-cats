/**
 * After the Parte III · the post MULTIDIMENSIONAL powers (agent PODERES-2, 2026-10-28) — the shared kit: per-battle state,
 * clocks and the little geometry helpers the 60 powers share. Same rules as battle/multidim.ts (the Parte III's 25):
 * player side only (multidim.ts mdOn), pure and deterministic (no Math.random, no rng draws of their own), structure caps
 * through Battle.budget (45 %, bosses 18 %, set by sim.fire for every power).
 *
 * The helpers mirror multidim.ts's on purpose (that file stays untouched but for its small hooks); everything here is a
 * function declaration or reads its imports only when called, so the import cycle sim ↔ multidim ↔ multidimPost is safe.
 */
import type { Battle, BattleEvent, PathPoint, ShotPath, QueuedShot } from '../sim';
import { CELL } from '../ship';
import type { Cell, ModuleInst } from '../ship';
import type { BattleCatDef, CatState, ShotDef } from '../types';
import type { UltCtx } from '../ults';
import { lateCellMul } from '../bossLate';

// ------------------------------------------------------------------ clocks
/** an effect's clock (multidim.ts Timer): `now` = on during this turn; `next` = more turns, counted at its clock side's starts */
export interface Timer {
  now: boolean;
  next: number;
}
export function T(next: number, now = false): Timer {
  return { now, next };
}
export function tick(t: Timer) {
  t.now = t.next > 0;
  if (t.now) t.next--;
}
export function on(t: Timer | null | undefined) {
  return !!t && (t.now || t.next > 0);
}
/** turns left to show on a chip */
export function left(t: Timer) {
  return t.next + (t.now ? 1 : 0);
}

// ------------------------------------------------------------------ state
/** what the shot being resolved right now is (sim.fire → mdFire): who fires, and how */
export interface ShotCtx {
  side: number;
  cat: CatState | undefined;
  ult: boolean;
  kind: 'cat' | 'ult' | 'cannon' | 'part';
  cannonId?: number;
  /** events index where this shot's events start */
  ev0: number;
  /** Miaunce caught this shot: every impact of it is gone */
  caught: boolean;
  /** Condorgato's punchline rides on this shot */
  remate: boolean;
}

export interface MdpState {
  feats: Record<string, number>;
  ctx: ShotCtx | null;
  /** first impact on the foe of each side's cat shots this turn (volleyAim's rule: Daft Miau, Rick) */
  firstHit: [PathPoint | null, PathPoint | null];
  /** sides that can't shoot this turn (cats and volley): Gatojo's stopped time, El Miauki's truce */
  benchNow: [boolean, boolean];
  benchNext: [number, number];
  // ---- the effects (owner = the side that cast it; most are counted on the foe's clock)
  rubber: [Timer, Timer];
  clones: { side: number; room: number; t: Timer; atk: number; pw: number; by: CatState }[];
  cloneBack: { side: number; x: number; y: number; to: PathPoint; atk: number; pw: number }[];
  /** Gatojo: `side` is the stopped one; the caster's shots are stored until `waits` of the stopped side's turn starts pass */
  timeStop: { side: number; waits: number; mul: number; stored: { shot: ShotDef; atk: number; paths: ShotPath[] }[] } | null;
  atom: { side: number; cat: CatState; atk: number; pw: number; module: number; turns: number; radius: number; shot: ShotDef }[];
  alloy: [Timer, Timer];
  note: { side: number; target: CatState; turns: number; by: CatState } | null;
  tele: [Timer, Timer];
  pieces: Map<CatState, number>;
  marks: { side: number; cells: Cell[]; volley: boolean; next: number } | null;
  harpoon: { side: number; module: number; step: number; budget: number } | null;
  nose: Map<CatState, number>;
  shrink: Map<CatState, { t: Timer; atk: number; take: number }>;
  barrel: { side: number; t: Timer; last: CatState | null; by: CatState; atk: number; pw: number } | null;
  punch: { side: number; volleys: number; turnUsed: boolean } | null;
  portals: [Timer, Timer];
  copy: { side: number; def: BattleCatDef; atk: number; t: Timer; of: CatState; turn: number } | null;
  swamp: { side: number; t: Timer } | null;
  bananas: { side: number; t: Timer; by: CatState; atk: number; pw: number } | null;
  regen: Map<CatState, number>;
  upgrade: Map<CatState, { t: Timer; bonus: number; shields: number }>;
  shield: { side: number; t: Timer; by: CatState } | null;
  decree: { side: number; t: Timer; hp: Map<CatState, number> } | null;
  exile: Map<CatState, { t: Timer; meter: number }>;
  dmgBy: Map<CatState, number> | null;
  rings: Map<CatState, { rings: number; loose: number; stale: boolean }>;
  undercover: { side: number; t: Timer } | null;
  snapshot: { cells: Map<Cell, number>; alive: boolean[]; cats: Map<CatState, { hp: number; ko: boolean; lives: number; overboard: boolean }>; meters: Map<CatState, number>; flood: number; breaches: number } | null;
  catch: { side: number; t: Timer; by: CatState } | null;
  catchBack: { side: number; shot: ShotDef; atk: number; ult: boolean; from: PathPoint; to: CatState | null } | null;
  piranhas: { side: number; t: Timer; atk: number; pw: number; budget: number } | null;
  high: { side: number; mine: Timer; theirs: Timer } | null;
  offer: Map<CatState, number>;
  cake: { side: number; t: Timer; armed: boolean } | null;
  love: Map<CatState, { t: Timer; by: CatState }>;
  chill: [Timer, Timer];
  heart: { side: number; t: Timer; pool: number; absorbed: number; atk: number; pw: number; by: CatState; burst: boolean } | null;
  pyramid: { side: number; turns: number; k: number; atk: number; pw: number; by: CatState } | null;
  /** where each side's last cat shot ended this turn (Daft Miau's laser when the cat missed) */
  lastEnd: [PathPoint | null, PathPoint | null];
  pile: { side: number; rooms: Map<CatState, number> } | null;
  night: { side: number; t: Timer } | null;
  assist: [number, number];
  counter: { side: number; t: Timer; by: CatState; atk: number; pw: number } | null;
  clues: { side: number; modules: number[]; found: number; hits: number[]; atk: number; pw: number; by: CatState } | null;
  exposed: Map<CatState, Timer>;
  flips: { side: number; wells: { w: import('../sim').Well; affects: number | undefined }[]; t: Timer } | null;
  unmask: { side: number; t: Timer; ward: import('../sim').Ward | null; bubbleMax: number; shieldHp: number } | null;
  /** stuns a crew put on itself with its own shots (Post Maulone's chill leaves those alone) */
  selfStun: Map<CatState, number>;
  /** each cat's stun when its side's shot began (to tell a self-imposed stun from theirs) */
  stun0: Map<CatState, number>;
  /** Grrrú's frozen cats (chips; the freeze itself is a stun + frozen cabin) */
  frozen: Map<CatState, Timer>;
  /** tanda 2 (agent PODERES-3): the second batch's rules (kitD.ts), created the first time one of them needs it */
  d: import('./kitD').DState | null;
}

const STATE = new WeakMap<Battle, MdpState>();
export function peek(b: Battle): MdpState | undefined {
  return STATE.get(b);
}
export function S(b: Battle): MdpState {
  let s = STATE.get(b);
  if (!s) {
    s = {
      feats: {},
      ctx: null,
      firstHit: [null, null],
      benchNow: [false, false],
      benchNext: [0, 0],
      rubber: [T(0), T(0)],
      clones: [],
      cloneBack: [],
      timeStop: null,
      atom: [],
      alloy: [T(0), T(0)],
      note: null,
      tele: [T(0), T(0)],
      pieces: new Map(),
      marks: null,
      harpoon: null,
      nose: new Map(),
      shrink: new Map(),
      barrel: null,
      punch: null,
      portals: [T(0), T(0)],
      copy: null,
      swamp: null,
      bananas: null,
      regen: new Map(),
      upgrade: new Map(),
      shield: null,
      decree: null,
      exile: new Map(),
      dmgBy: null,
      rings: new Map(),
      undercover: null,
      snapshot: null,
      catch: null,
      catchBack: null,
      piranhas: null,
      high: null,
      offer: new Map(),
      cake: null,
      love: new Map(),
      chill: [T(0), T(0)],
      heart: null,
      pyramid: null,
      lastEnd: [null, null],
      pile: null,
      night: null,
      assist: [0, 0],
      counter: null,
      clues: null,
      exposed: new Map(),
      flips: null,
      unmask: null,
      frozen: new Map(),
      selfStun: new Map(),
      stun0: new Map(),
      d: null,
    };
    STATE.set(b, s);
  }
  return s;
}
export function feat(b: Battle, side: number, k: string, n = 1) {
  if (side !== 0 || n <= 0) return;
  const f = S(b).feats;
  f[k] = (f[k] ?? 0) + n;
}

// ------------------------------------------------------------------ helpers
export const INFO = 0xf59ac0;
export function info(ev: BattleEvent[], text: string, x: number, y: number, color = INFO, path = -1, at = 0) {
  ev.push({ k: 'info', text, x, y, color, path, at });
}
export function fx(ev: BattleEvent[], name: string, side: number, x: number, y: number, o: { n?: number; w?: number; uid?: string; path?: number; at?: number } = {}) {
  ev.push({ k: 'ultfx', fx: name, side, x, y, n: o.n, w: o.w, uid: o.uid, path: o.path ?? -1, at: o.at ?? 0 });
}
/** the power's unit of strength: the ultimate's multiplier (attack × PW ≈ the same for every Multidimensional) */
export const PW = (o: UltCtx) => o.shot.power;
export function alive(b: Battle, side: number) {
  return b.sides[side].cats.filter((c) => !c.ko && !b.isFlying(c));
}
export function isBossCaptain(b: Battle, c: CatState) {
  return b.cfg.boss?.side === c.side && b.cfg.boss.captain === c.def.uid;
}
export const vsBoss = (b: Battle, side: number) => b.cfg.boss?.side === side;
/** a stun of `n` (2 = loses its next turn); a boss captain shakes it off after one turn */
export function stun(b: Battle, c: CatState, n: number) {
  c.stunned = Math.max(c.stunned, isBossCaptain(b, c) ? Math.min(n, 2) : n);
}
export function hurtable(b: Battle, side: number, c: Cell) {
  return lateCellMul(b, side, c) > 0;
}
/** the power's set piece: the view stamps the name in the universe's color and plays the cat's own effect */
export function stamp(b: Battle, o: UltCtx, x: number, y: number, n = 0) {
  o.events.push({ k: 'ultfx', fx: 'md', side: 1 - o.side, x, y, n, uid: o.cat.def.catId, path: 0, at: 0 });
  feat(b, o.side, `md_${o.cat.def.catId}`);
}
/** the strongest cat of a side: the most attack (then life) */
export function strongest(b: Battle, side: number, skip?: Set<CatState>) {
  return alive(b, side)
    .filter((c) => !skip?.has(c))
    .sort((a, z) => z.def.atk - a.def.atk || z.hp - a.hp || (a.def.uid < z.def.uid ? -1 : 1))[0];
}
/** module value for the powers that pick (cabins only count with a cat inside) */
export function modValue(b: Battle, side: number, id: number, table: Record<string, number>) {
  const m = b.sides[side].ship.modules[id];
  if (m.kind === 'catroom') return b.sides[side].cats.some((c) => c.room === id && !c.ko) ? table.catroom ?? 1 : 1;
  return table[m.kind] ?? 1;
}
export const VALUE = { core: 9, catroom: 8, cannon: 7, shield: 6, arcane: 6, powder: 5, mast: 3, engine: 3 };
export function bestModules(b: Battle, side: number, n: number, table: Record<string, number> = VALUE) {
  const s = b.sides[side];
  return s.ship.modules
    .filter((m) => m.alive && s.ship.moduleCells(m.id).length)
    .sort((a, z) => modValue(b, side, z.id, table) - modValue(b, side, a.id, table) || a.id - z.id)
    .slice(0, n);
}
/** the live module nearest a world point */
export function moduleNear(b: Battle, side: number, p: PathPoint, skip?: Set<number>): ModuleInst | undefined {
  const s = b.sides[side];
  return s.ship.modules
    .filter((m) => m.alive && !skip?.has(m.id) && s.ship.moduleCells(m.id).length)
    .map((m) => ({ m, d: Math.hypot(b.roomCenter(side, m.id).x - p.x, b.roomCenter(side, m.id).y - p.y) }))
    .sort((a, z) => a.d - z.d || a.m.id - z.m.id)[0]?.m;
}
/** the cell nearest a world point (optionally filtered) */
export function cellNear(b: Battle, side: number, p: PathPoint, ok: (c: Cell) => boolean = () => true): Cell | undefined {
  return b.sides[side].ship
    .cells()
    .filter(ok)
    .map((c) => ({ c, q: b.cellCenter(side, c.x, c.y) }))
    .sort((a, z) => Math.hypot(a.q.x - p.x, a.q.y - p.y) - Math.hypot(z.q.x - p.x, z.q.y - p.y) || a.c.y - z.c.y || a.c.x - z.c.x)[0]?.c;
}
/** world y of the top of the column under world x on `side`'s ship (the waterline when the column is empty) */
export function surfaceY(b: Battle, side: number, x: number) {
  const s = b.sides[side];
  const gx = b.toGrid(side, x, s.setup.origin.y).x;
  for (let y = 0; y < s.ship.rows; y++) if (s.ship.get(gx, y)) return s.setup.origin.y + y * CELL;
  return b.waterY;
}
/** the top cell of every column of a side's ship (its deck), left to right in grid order */
export function deck(b: Battle, side: number): Cell[] {
  const ship = b.sides[side].ship;
  const out: Cell[] = [];
  for (let x = 0; x < ship.cols; x++)
    for (let y = 0; y < ship.rows; y++) {
      const c = ship.get(x, y);
      if (c) {
        out.push(c);
        break;
      }
    }
  return out;
}
/** a straight run of points ~`step` px apart from a to z (a excluded) */
export function line(a: PathPoint, z: PathPoint, step = 11): PathPoint[] {
  const n = Math.max(1, Math.round(Math.hypot(z.x - a.x, z.y - a.y) / step));
  return Array.from({ length: n }, (_, i) => ({ x: a.x + ((z.x - a.x) * (i + 1)) / n, y: a.y + ((z.y - a.y) * (i + 1)) / n }));
}
/** a parabolic hop from a to z with apex `h` px above the higher end (a excluded) */
export function hop(a: PathPoint, z: PathPoint, h: number, step = 11): PathPoint[] {
  const len = Math.hypot(z.x - a.x, z.y - a.y) + h;
  const n = Math.max(4, Math.round(len / step));
  return Array.from({ length: n }, (_, i) => {
    const t = (i + 1) / n;
    return { x: a.x + (z.x - a.x) * t, y: a.y + (z.y - a.y) * t - 4 * h * t * (1 - t) };
  });
}
/**
 * a hand-drawn path over `side`'s enemy ship: an impact where it enters each enemy cell (once per cell), or only at the
 * listed points (`at`, indices into pts). Owner = the shooter.
 */
export function drawn(b: Battle, side: number, pts: PathPoint[], el: ShotDef['element'], kind: ShotDef['trajectory'], at?: number[]): ShotPath {
  const impacts: number[] = [];
  if (at) impacts.push(...at.filter((i) => i > 0 && i < pts.length));
  else {
    const seen = new Set<Cell>();
    pts.forEach((p, i) => {
      const hit = b.cellAt(p.x, p.y);
      if (!hit || hit.side === side || seen.has(hit.cell)) return;
      seen.add(hit.cell);
      impacts.push(i);
    });
  }
  return { points: pts, element: el, kind, impacts, owners: impacts.map(() => side) };
}
/** a hop from a point straight onto a target: one impact at the end */
export function lob(b: Battle, side: number, from: PathPoint, to: PathPoint, h: number, el: ShotDef['element'], kind: ShotDef['trajectory'] = 'ballistic'): ShotPath {
  const pts = [from, ...hop(from, to, h, 13)];
  return drawn(b, side, pts, el, kind, [pts.length - 1]);
}
/** a straight dash onto a target: one impact at the end */
export function dash(b: Battle, side: number, from: PathPoint, to: PathPoint, el: ShotDef['element'], kind: ShotDef['trajectory'] = 'beam'): ShotPath {
  const pts = [from, ...line(from, to, 14)];
  return drawn(b, side, pts, el, kind, [pts.length - 1]);
}
/** prepend a lead-in (from the cat to where the real flight starts) to an integrated path */
export function lead(p: ShotPath, pre: PathPoint[]): ShotPath {
  const k = pre.length;
  return { ...p, points: [...pre, ...p.points], impacts: p.impacts.map((i) => i + k), jumps: p.jumps?.map((i) => i + k), seal: p.seal !== undefined ? p.seal + k : undefined };
}
export const lastAt = (p: ShotPath | undefined) => (!p ? 0 : p.impacts.length ? p.impacts[p.impacts.length - 1] : p.points.length - 1);
export const endPt = (p: ShotPath) => p.points[lastAt(p)];
/** a power's own shot: the ultimate's look with new numbers */
export function mk(o: UltCtx, id: string, power: number, x: Partial<ShotDef> = {}): ShotDef {
  return { ...o.shot, id, projectiles: 1, pierce: 0, statuses: [], ...x, power };
}
/** a temporary structure cap around something resolved outside a power's own fire (ticks, counters, delayed blows) */
export function withBudget<T>(b: Battle, side: number, frac: number, fn: () => T): T {
  const prev = b.budget;
  b.budget = { side, left: Math.round((b.sides[side].ship.initialMax?.[0] ?? 0) * frac) };
  try {
    return fn();
  } finally {
    b.budget = prev;
  }
}
/** a side's hand-written blow outside fire() that the view animates at the start of a turn */
export function queue(b: Battle, q: QueuedShot) {
  b.queued.push(q);
}
/** life lost straight from the cat's own life (no shields, no affinity): a recoil, a bite of the law */
export function bleed(b: Battle, c: CatState, dmg: number, ev: BattleEvent[], el: ShotDef['element'] = 'magic', path = -1, at = 0) {
  if (c.ko || dmg <= 0) return 0;
  const d = Math.min(c.hp, Math.round(dmg));
  c.hp -= d;
  if (c.hp <= 0) b.koOrRevive(c);
  ev.push({ k: 'cat', side: c.side, uid: c.def.uid, dmg: d, ko: c.ko, shield: false, element: el, fx: { ...c.fx }, path, at });
  return d;
}
/** heal a cat (no event of its own: the view refreshes the bars; an info line says how much) */
export function heal(c: CatState, amount: number) {
  if (c.ko) return 0;
  const h = Math.max(0, Math.min(c.maxHp - c.hp, Math.round(amount)));
  c.hp += h;
  return h;
}
export const dirOf = (side: number) => (side === 0 ? 1 : -1);
export { CELL };
export { CAT_K, DMG_K } from '../sim';
