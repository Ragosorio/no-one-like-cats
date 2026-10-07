/**
 * Parte 2 — the six multiverse elements in ship battles (Hielo, Luz, Sombra, Sonido, Tiempo, Vacío).
 *
 * Pure rules, no rendering, and the SAME for both sides (a cat is a card: the enemy's Bóreas freezes you
 * exactly like yours freezes them). sim.ts calls these hooks at a few points; the per-battle state lives
 * here in a WeakMap so Battle/SideState don't grow fields:
 *
 *   HIELO   Congelado (cells: the module doesn't act next turn; cats hit freeze). Fire on frozen =
 *           CHOQUE TÉRMICO (×1.75, thaws); a high note on frozen = NOTA ALTA (×2).
 *   LUZ     'ray': dead straight, ignores wind, pierces a line. CEGADO: the hit side aims next turn with
 *           30% of its preview (the AI with ×2.2 aim error). Light on wet = ARCOÍRIS (+1 turn blind).
 *   SOMBRA  invisible in flight (view). PUÑALADA: on impact the nearest enemy cat is stabbed from behind
 *           (ignores cat shields). Ultimate: every enemy cat.
 *   SONIDO  'wave': passes through walls; every cat whose cabin it crosses is ATURDIDO (loses a turn),
 *           then SORDO for 2 turns (can't be stunned by sound again).
 *   TIEMPO  REBOBINAR: repairs your most damaged cells with 35% of the damage dealt; the enemy cat hit in
 *           its cabin loses its next turn (-1 TURNO). Ultimate = TIME STOP: the rival's cats skip their
 *           next turn (cannons still fire; can't be chained). Time on burning/rooted = ACELERAR.
 *   VACÍO   'phase': erases a line; every cell it touches is BORRADO (status `voided`): nothing can heal
 *           it this battle (Rebobinar, raíces, jefes). DEVORAR (sim.ts) eats bubbles/shields/statuses;
 *           here it also eats cat shields and a second life.
 */
import type { Battle, BattleEvent, ShotPath } from './sim';
import type { CatState, ShotDef } from './types';
import { CELL } from './ship';
import type { Cell } from './ship';

interface ShotMemo {
  blind: boolean;
  rainbow: boolean;
  backstab: boolean;
  rewind: boolean;
  stop: boolean;
  /** cats already hit by this sound wave */
  heard: Set<CatState>;
}
interface P2State {
  /** turns of CEGADO left per side (set to 2 on hit: active during that side's next turn) */
  blind: [number, number];
  /** TIME STOP pending: that side's cats skip their next turn */
  stop: [boolean, boolean];
  /** TIME STOP active during this side's current turn */
  stopNow: [boolean, boolean];
  /** turns during which a new TIME STOP can't land (no chaining) */
  stopImmune: [number, number];
  /** SORDO: turns left (sound can't stun it again) */
  deaf: Map<CatState, number>;
  shot: ShotMemo;
  /** player-side feats (BattleScene adds them to the save as counters) */
  feats: Record<string, number>;
}

const memo = (): ShotMemo => ({ blind: false, rainbow: false, backstab: false, rewind: false, stop: false, heard: new Set() });
const STATE = new WeakMap<Battle, P2State>();
function S(b: Battle): P2State {
  let s = STATE.get(b);
  if (!s) {
    s = { blind: [0, 0], stop: [false, false], stopNow: [false, false], stopImmune: [0, 0], deaf: new Map(), shot: memo(), feats: {} };
    STATE.set(b, s);
  }
  return s;
}

/** the six elements this module owns */
export const P2_ELEMENTS = ['ice', 'light', 'shadow', 'sound', 'time', 'void'] as const;

function feat(b: Battle, side: number, k: string, n = 1) {
  if (side !== 0 || n <= 0) return;
  const f = S(b).feats;
  f[k] = (f[k] ?? 0) + n;
}
/** player feats of this battle: p2_freeze, p2_blind, p2_backstab, p2_stun, p2_rewind, p2_timestop, p2_erase */
export function p2Feats(b: Battle): Record<string, number> {
  return { ...S(b).feats };
}

function info(ev: BattleEvent[], text: string, x: number, y: number, color: number, path: number, at: number) {
  ev.push({ k: 'info', text, x, y, color, path, at });
}
function shipCenter(b: Battle, side: number) {
  const s = b.sides[side];
  return { x: s.setup.origin.x + (s.ship.cols * CELL) / 2, y: s.setup.origin.y + (s.ship.rows * CELL) / 2 };
}
/** the living cat whose cabin contains grid cell (gx, gy) */
function catInCabin(b: Battle, side: number, gx: number, gy: number): CatState | undefined {
  const s = b.sides[side];
  for (const c of s.cats) {
    if (c.ko || b.isFlying(c)) continue;
    const m = s.ship.modules[c.room];
    if (gx >= m.x && gx < m.x + m.w && gy >= m.y && gy < m.y + m.h) return c;
  }
  return undefined;
}

// ------------------------------------------------------------------ turn flow
/** start of `side`'s turn: blind/deaf/time-stop bookkeeping (+ a visible note) */
export function p2StartTurn(b: Battle, side: 0 | 1, ev: BattleEvent[]) {
  const st = S(b);
  if (st.blind[side] > 0) st.blind[side]--;
  for (const c of b.sides[side].cats) {
    const d = st.deaf.get(c);
    if (d === undefined) continue;
    if (d > 1) st.deaf.set(c, d - 1);
    else st.deaf.delete(c);
  }
  if (st.stopImmune[side] > 0) st.stopImmune[side]--;
  st.stopNow[side] = st.stop[side];
  st.stop[side] = false;
  const ctr = shipCenter(b, side);
  if (st.stopNow[side]) {
    st.stopImmune[side] = 2;
    info(ev, '¡TIEMPO DETENIDO! SUS GATOS NO SE MUEVEN', ctr.x, ctr.y - 200, 0xe0b77a, -1, 0);
  }
  if (st.blind[side] > 0) info(ev, '¡CEGADO! VISTA PREVIA 30%', ctr.x, ctr.y - 150, 0xffd77a, -1, 0);
}

/** cats that may shoot this turn (TIME STOP empties the list; cannons still fire) */
export function p2Shooters<T>(b: Battle, side: number, list: T[]): T[] {
  return S(b).stopNow[side] ? [] : list;
}
export function p2Stopped(b: Battle, side: number) {
  return S(b).stopNow[side];
}
/** aim preview multiplier (CEGADO) */
export function p2PreviewMul(b: Battle, side: number) {
  return S(b).blind[side] > 0 ? 0.3 : 1;
}
export function p2Blind(b: Battle, side: number) {
  return S(b).blind[side] > 0;
}
/** AI aim error multiplier (the same CEGADO, for the side the computer plays) */
export function p2AimNoise(b: Battle, side: number) {
  return S(b).blind[side] > 0 ? 2.2 : 1;
}
/** a new shot begins (per-shot one-time effects) */
export function p2BeginFire(b: Battle) {
  S(b).shot = memo();
}

// ------------------------------------------------------------------ trajectories
/** gravity / wind / speed / pierce defaults of the new trajectories (null = not ours) */
export function p2Flight(traj: ShotDef['trajectory']): { g: number; wind: number; speed: number; pierce: number; pierceMul: number } | null {
  if (traj === 'ray') return { g: 0.04, wind: 0, speed: 2, pierce: 3, pierceMul: 0.6 };
  if (traj === 'wave') return { g: 0.35, wind: 0.3, speed: 1.1, pierce: 8, pierceMul: 0.3 };
  return null;
}

// ------------------------------------------------------------------ reactions
/** reactions of the new elements (checked before the classic ones); null = none */
export function p2React(b: Battle, shot: ShotDef, c: Cell): { name: string; mult: number } | null {
  const st = c.status;
  const el = shot.element;
  if (el === 'fire' && st.frozen) {
    delete st.frozen;
    return { name: 'CHOQUE TÉRMICO', mult: 1.75 };
  }
  if (el === 'sound' && st.frozen) {
    delete st.frozen;
    return { name: 'NOTA ALTA', mult: 2 };
  }
  if (el === 'light' && st.wet) {
    delete st.wet;
    S(b).shot.rainbow = true;
    return { name: 'ARCOÍRIS', mult: 1.2 };
  }
  if (el === 'time' && (st.burning || st.rooted)) {
    // everything that was going to burn (or rot) in the next turns happens NOW
    delete st.burning;
    delete st.rooted;
    return { name: 'ACELERAR', mult: 1.5 };
  }
  return null;
}

// ------------------------------------------------------------------ cats
/** before a cat takes a hit: returns a damage multiplier (and strips what the element eats) */
export function p2PreHitCat(c: CatState, el: string): number {
  if (el === 'fire' && c.fx.frozen > 0) {
    // CHOQUE TÉRMICO on the cat: the ice block cracks
    c.fx.frozen = 0;
    return 1.5;
  }
  if (el === 'void') {
    // DEVORAR: no shields, no spare life
    c.shields = 0;
    if (c.lives > 1) c.lives = 1;
  }
  return 1;
}
/** after the hit: SONIDO stuns (once per wave, then SORDO 2 turns). Returns true if it stunned. */
export function p2PostHitCat(b: Battle, c: CatState, el: string, attSide: number): boolean {
  // sound cats live inside the noise: they don't get stunned by it
  if (el !== 'sound' || c.ko || c.def.elements.includes('sound')) return false;
  const st = S(b);
  if (st.deaf.has(c) || st.shot.heard.has(c)) return false;
  st.shot.heard.add(c);
  c.stunned = Math.max(c.stunned, 2);
  st.deaf.set(c, 3);
  feat(b, attSide, 'p2_stun');
  return true;
}

// ------------------------------------------------------------------ impacts
export interface ImpactCtx {
  attSide: number;
  targetSide: number;
  shot: ShotDef;
  /** base damage of this impact (atk × power × modifiers) */
  base: number;
  x: number;
  y: number;
  radius: number;
  final: boolean;
  /** damage dealt by this impact (cells + parts) */
  total: number;
  path: number;
  at: number;
  catK: number;
  /** sim.hitCat (public for these hooks) */
  hitCat: (c: CatState, dmg: number, ev: BattleEvent[], path: number, at: number, el: ShotDef['element'], direct?: boolean, chained?: boolean) => void;
}

/** element effects after an impact resolved its damage (runs for every impact of the shot) */
export function p2Impact(b: Battle, k: ImpactCtx, ev: BattleEvent[]) {
  const { attSide, targetSide, shot, x, y } = k;
  if (attSide === targetSide) return;
  const st = S(b);
  const ult = !!shot.shout;
  const T = b.sides[targetSide];
  switch (shot.element) {
    case 'ice': {
      if (!k.final) break;
      const frozen = T.ship.cells().filter((c) => c.status.frozen && Math.hypot(b.cellCenter(targetSide, c.x, c.y).x - x, b.cellCenter(targetSide, c.x, c.y).y - y) <= k.radius + CELL * 0.35).length;
      feat(b, attSide, 'p2_freeze', frozen);
      break;
    }
    case 'light': {
      if (st.shot.blind) break;
      st.shot.blind = true;
      const turns = (ult ? 3 : 2) + (st.shot.rainbow ? 1 : 0);
      st.blind[targetSide] = Math.max(st.blind[targetSide], turns);
      info(ev, st.shot.rainbow ? '¡ARCOÍRIS! CEGADO +1' : '¡CEGADO!', x, y - 70, 0xffd77a, k.path, k.at);
      feat(b, attSide, 'p2_blind');
      break;
    }
    case 'shadow': {
      if (!k.final || st.shot.backstab) break;
      st.shot.backstab = true;
      const alive = T.cats.filter((c) => !c.ko && !b.isFlying(c));
      if (!alive.length) break;
      const dist = (c: CatState) => {
        const p = b.roomCenter(targetSide, c.room);
        return Math.hypot(p.x - x, p.y - y);
      };
      const victims = ult ? alive : [alive.sort((a, c) => dist(a) - dist(c))[0]].filter((c) => dist(c) <= CELL * 7);
      for (const c of victims) {
        const p = b.roomCenter(targetSide, c.room);
        const shields = c.shields;
        c.shields = 0; // from behind: the cat's own shields don't see it coming
        k.hitCat(c, Math.round(k.base * (ult ? 0.35 : 0.45) * k.catK), ev, k.path, k.at, 'shadow', true);
        c.shields = shields;
        info(ev, '¡PUÑALADA!', p.x, p.y - 90, 0xc8102e, k.path, k.at);
        feat(b, attSide, 'p2_backstab');
      }
      break;
    }
    case 'sound': {
      // the wave crosses cabins: whoever is inside hears it (the final blast hits normally in sim.ts)
      if (!k.final) {
        const g = b.toGrid(targetSide, x, y);
        const c = catInCabin(b, targetSide, g.x, g.y);
        if (c && !st.shot.heard.has(c)) k.hitCat(c, Math.round(k.base * 1.2 * k.catK), ev, k.path, k.at, 'sound', true);
      } else if (ult) {
        for (const c of T.cats) {
          if (c.ko || b.isFlying(c) || st.shot.heard.has(c)) continue;
          const p = b.roomCenter(targetSide, c.room);
          if (Math.hypot(p.x - x, p.y - y) <= CELL * 4) k.hitCat(c, Math.round(k.base * 0.3 * k.catK), ev, k.path, k.at, 'sound', true);
        }
      }
      break;
    }
    case 'time': {
      if (!k.final || st.shot.rewind) break;
      st.shot.rewind = true;
      // REBOBINAR: your ship goes back to how it was a moment ago (never what the Void erased)
      const own = b.sides[attSide].ship;
      let budget = Math.round(Math.max(0, k.total) * (ult ? 0.6 : 0.35));
      const healed0 = budget;
      const cells = own.cells().filter((c) => c.hp < c.maxHp && !c.status.voided).sort((a, c) => a.hp / a.maxHp - c.hp / c.maxHp);
      for (const c of cells) {
        if (budget <= 0) break;
        const amount = Math.min(budget, c.maxHp - c.hp);
        c.hp += amount;
        budget -= amount;
        ev.push({ k: 'heal', side: attSide, cell: c, amount });
      }
      const healed = healed0 - budget;
      if (healed > 0) {
        const p = shipCenter(b, attSide);
        info(ev, `¡REBOBINAR! +${healed}`, p.x, p.y - 120, 0xe0b77a, k.path, k.at);
        feat(b, attSide, 'p2_rewind');
      }
      // the cat in the cabin you hit: its reload goes back a turn
      const g = b.toGrid(targetSide, x, y);
      const hit = catInCabin(b, targetSide, g.x, g.y);
      if (hit) {
        hit.cooldown = Math.max(hit.cooldown + 1, 2);
        const p = b.roomCenter(targetSide, hit.room);
        info(ev, '-1 TURNO', p.x, p.y - 60, 0xe0b77a, k.path, k.at);
      }
      if (ult && !st.shot.stop && !st.stop[targetSide] && st.stopImmune[targetSide] <= 0 && T.cats.some((c) => !c.ko)) {
        st.shot.stop = true;
        st.stop[targetSide] = true;
        const p = shipCenter(b, targetSide);
        info(ev, '¡TIME STOP!', p.x, p.y - 180, 0xe0b77a, k.path, k.at);
        feat(b, attSide, 'p2_timestop');
      }
      break;
    }
    case 'void': {
      // BORRADO: what the Void touched can't come back this battle
      const out: Cell[] = [];
      for (const c of T.ship.cells()) {
        const p = b.cellCenter(targetSide, c.x, c.y);
        if (Math.hypot(p.x - x, p.y - y) > k.radius + CELL * 0.35) continue;
        if (!c.status.voided) out.push(c);
        c.status.voided = 99;
      }
      if (out.length) ev.push({ k: 'status', side: targetSide, cells: out, status: 'voided' });
      feat(b, attSide, 'p2_erase', out.length);
      break;
    }
  }
}

// ------------------------------------------------------------------ AI
/**
 * Extra value the AI sees in a shot of a new element (so the computer USES the mechanics):
 * sound through occupied cabins, ice on working cannons, time when its own ship is hurt,
 * light when the rival can still see, the void against shields.
 */
export function p2ShotValue(b: Battle, side: number, shot: ShotDef, paths: ShotPath[]): number {
  const enemy = 1 - side;
  const E = b.sides[enemy];
  const p = paths[0];
  if (!p?.impacts.length) return 1;
  const ip = p.points[p.impacts[p.impacts.length - 1]];
  switch (shot.element) {
    case 'sound': {
      let n = 0;
      const seen = new Set<CatState>();
      for (const i of p.impacts) {
        const pt = p.points[i];
        const g = b.toGrid(enemy, pt.x, pt.y);
        const c = catInCabin(b, enemy, g.x, g.y);
        if (c && !seen.has(c) && !S(b).deaf.has(c)) {
          seen.add(c);
          n++;
        }
      }
      return 1 + 0.45 * n;
    }
    case 'ice': {
      const near = E.ship.modules.filter((m) => {
        if (!m.alive || (m.kind !== 'cannon' && m.kind !== 'catroom')) return false;
        const c = b.roomCenter(enemy, m.id);
        return Math.hypot(c.x - ip.x, c.y - ip.y) <= shot.radius + CELL && !E.ship.moduleCells(m.id).some((k) => k.status.frozen);
      }).length;
      return 1 + 0.25 * near;
    }
    case 'time': {
      const own = b.sides[side].ship;
      const lost = 1 - own.integrity();
      return 1 + Math.min(0.5, lost * 0.8);
    }
    case 'light':
      return S(b).blind[enemy] > 0 ? 1 : 1.15;
    case 'void':
      return E.bubble > 0 || E.shieldHp > 0 ? 1.4 : 1;
    case 'shadow':
      return E.cats.some((c) => !c.ko) ? 1.1 : 1;
  }
  return 1;
}
