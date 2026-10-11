/**
 * FASES — the generic multi-phase battle mechanism (Parte II · Oleada 3, docs/part-ii/25-oleada-3.md §4; Oleada 4
 * reuses it). A battle declares `StageRules.fases`: an ordered list of phases, each one a set of ENVIRONMENT
 * parameters (gravity, wind, bodies with orbital wells, portals, a shield, a presentation layer) that the sim
 * switches DETERMINISTICALLY when the watched side's damage crosses a threshold (or a turn number arrives).
 *
 *   phases[0]            the opening environment (its `at` is ignored)
 *   phases[n].at.hp      enter when the watched side is this far to defeat (0..1: max(hull lost to sinking,
 *                        crew hp lost), same measure as the Part I bosses' phases)
 *   phases[n].at.turn    …or when this turn starts (whichever comes first)
 *   env.g                field gravity multiplier (Battle.field.gMul): 1 sea · 0.7 sky · 0.25 astral
 *   env.windMul          multiplier on the battle wind for every projectile (0 = none)
 *   env.calm             the wind is 0 and stays 0 (no drift): space
 *   env.bodies           planetoids / cloud banks between the ships: they stop projectiles (Sonido's wave and
 *                        Vacío's phase go through), optionally crumble (hp), drift by turn and carry an ORBITAL
 *                        WELL (a Battle.wells entry): a shot can swing around a planetoid
 *   env.portals          two rifts: a shot that enters one leaves the other and changes owner (Battle.portals)
 *   env.layer            presentation key the view stages: 'sea' | 'sky' | 'astral' | 'glitch' (battle/fx/fasesFx.ts)
 *   cfg.shield[side]     ESCUDO (Kit Astral level 2): the first N foe impacts on that side's hull, per phase, vanish
 *
 * Everything is plain data (the estimate worker gets the spec through structured clone: no functions). Named
 * one-shot effects on entering a phase live in FASE_EFFECTS (register them from a battle/ module the sim imports,
 * so the worker has them too).
 *
 * Sim hooks (sim.ts, one line each): constructor fasesInit · startTurn fasesStartTurn + fasesCheck · integrate
 * fasesFlight · resolveImpact fasesImpact · fire fasesCheck. A phase change is the sim event
 * `{ k: 'boss', what: 'fase', side, n: <phase index> }` (deterministic: the screen and the estimate agree).
 *
 * PRESENTATION / MUSIC: the battle view stages each change (battle/fx/fasesFx.ts) and then calls emitFase();
 * listen with `onFase(fn)` (module API, no DOM) or `window.addEventListener('nolc:fase', e => e.detail)`.
 * The estimate worker never emits (it has no view).
 */
import type { Battle, BattleEvent, Portals, Well } from './sim';
import type { ShotDef, Trajectory } from './types';
import { CELL } from './ship';

export interface FaseBody {
  /** x offset from the middle of the open air between the ships (px) */
  dx?: number;
  /** height above the waterline / cloud deck (px) */
  up: number;
  r: number;
  /** 0 / absent = indestructible */
  hp?: number;
  /** an orbital well centred on the body (pull at the rim k px/s², linear falloff to r) */
  well?: { r: number; k: number };
  /** it drifts: every turn its x moves by `dx` along a sine of period `every` turns (deterministic, by turn) */
  drift?: { dx: number; every: number };
  /** view hint: 'planet' | 'comet' | 'cloud' | 'debris' */
  look?: string;
}
export interface FaseEnv {
  g?: number;
  windMul?: number;
  calm?: boolean;
  bodies?: FaseBody[];
  /** offsets from the field middle; r = ring radius */
  portals?: { a: { dx: number; up: number }; b: { dx: number; up: number }; r: number };
  layer?: string;
}
export interface FaseDef {
  /** stable id (music cues, tests) */
  id: string;
  /** banner name: «CAPA 2 · EL CIELO» */
  name: string;
  at?: { hp?: number; turn?: number };
  /** one short line shown with the banner (what changed, in the player's words) */
  telegraph?: string;
  env?: FaseEnv;
  /** named one-shot effects on entering (FASE_EFFECTS) */
  effects?: string[];
  /** false = the view switches the layer but shows no banner (the battle's own rules announce it) */
  banner?: boolean;
}
export interface FasesCfg {
  /** whose damage moves the phases (the boss side) */
  side: 0 | 1;
  phases: FaseDef[];
  /** ESCUDO: foe impacts on each side's hull absorbed per phase [player, enemy] */
  shield?: [number, number];
}

export type FaseEffect = (b: Battle, phase: FaseDef, ev: BattleEvent[]) => void;
/** named one-shot effects a phase can run when it starts (keep them deterministic: no Math.random) */
export const FASE_EFFECTS: Record<string, FaseEffect> = {
  /** the watched side repairs 10% of its structure (a «second wind»: use sparingly) */
  heal10(b, _p, ev) {
    const side = S(b)?.cfg.side ?? 1;
    b.bossHeal(side, 0.1, ev);
  },
  /** every temporary well (black holes, lures, pozos) closes: a clean slate for the new layer */
  clearWells(b) {
    const st = S(b);
    b.wells = b.wells.filter((w) => w.turns === Infinity || st?.wells.includes(w));
  },
};

/** effects that stage their OWN banner (battle/fx/suenosFx o4Banner for 'umbral'): the FASES banner steps aside */
export const FASE_SELF_BANNER = new Set<string>(['umbral']);

interface BodyState {
  def: FaseBody;
  x0: number;
  y: number;
  r: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  well: Well | null;
}
interface FasesState {
  cfg: FasesCfg;
  idx: number;
  bodies: BodyState[];
  wells: Well[];
  /** foe impacts each side's shield can still absorb this phase */
  shieldLeft: [number, number];
  /** turn each phase started */
  enteredAt: number[];
  bodyHits: number;
  shieldHits: number;
}
const STATE = new WeakMap<Battle, FasesState>();
const S = (b: Battle) => STATE.get(b) ?? null;

export const fasesOn = (b: Battle) => !!S(b);
/** the phase the battle is in (null outside a phased battle) */
export function currentFase(b: Battle): FaseDef | null {
  const st = S(b);
  return st ? st.cfg.phases[st.idx] : null;
}
export function faseIndex(b: Battle): number {
  return S(b)?.idx ?? -1;
}

/** x of the middle of the open air between the two ships */
function fieldMid(b: Battle) {
  const [p, e] = b.sides;
  return Math.round((p.setup.origin.x + p.ship.cols * CELL + e.setup.origin.x) / 2);
}
function bodyX(b: Battle, s: BodyState) {
  const d = s.def.drift;
  return d ? Math.round(s.x0 + Math.sin((b.turn / Math.max(1, d.every)) * Math.PI) * d.dx) : s.x0;
}

function apply(b: Battle, st: FasesState, ph: FaseDef, ev: BattleEvent[] | null) {
  const env = ph.env ?? {};
  b.field.gMul = env.g ?? 1;
  if (env.calm) b.wind = 0;
  // the previous layer's bodies and their wells leave
  b.wells = b.wells.filter((w) => !st.wells.includes(w));
  st.wells = [];
  const mid = fieldMid(b);
  const avg = ((b.sides[0].ship.initialMax?.[0] ?? 0) + (b.sides[1].ship.initialMax?.[0] ?? 0)) / 2;
  st.bodies = (env.bodies ?? []).map((d) => {
    const hp = d.hp ? Math.max(200, Math.round(avg * d.hp)) : 0;
    const s: BodyState = { def: d, x0: mid + (d.dx ?? 0), y: b.waterY - d.up, r: d.r, hp, maxHp: hp, alive: true, well: null };
    if (d.well) {
      const w: Well = { x: bodyX(b, s), y: s.y, r: d.well.r, k: d.well.k, turns: Infinity, owner: st.cfg.side, kind: 'well' };
      s.well = w;
      st.wells.push(w);
      b.wells.push(w);
    }
    return s;
  });
  const p = env.portals;
  b.portals = p ? { a: { x: mid + p.a.dx, y: b.waterY - p.a.up }, b: { x: mid + p.b.dx, y: b.waterY - p.b.up }, r: p.r } : null;
  b.portalNext = null;
  st.shieldLeft = [st.cfg.shield?.[0] ?? 0, st.cfg.shield?.[1] ?? 0];
  st.enteredAt[st.idx] = b.turn;
  if (ev) for (const k of ph.effects ?? []) FASE_EFFECTS[k]?.(b, ph, ev);
}

export function fasesInit(b: Battle, cfg: FasesCfg) {
  if (!cfg?.phases?.length) return;
  const st: FasesState = { cfg, idx: 0, bodies: [], wells: [], shieldLeft: [0, 0], enteredAt: [], bodyHits: 0, shieldHits: 0 };
  STATE.set(b, st);
  apply(b, st, cfg.phases[0], null);
}

/** how far the watched side is from defeat (0..1): hull lost on the way to sinking, or crew hp lost */
export function fasesProgress(b: Battle, side: number) {
  const hull = 1 - b.hullBar(side);
  const crew = b.sides[side].cats;
  const crewFrac = crew.length ? crew.reduce((a, c) => a + (1 - Math.max(0, c.hp) / c.maxHp), 0) / crew.length : 0;
  return Math.max(hull, crewFrac);
}

function enter(b: Battle, st: FasesState, n: number, ev: BattleEvent[]) {
  const from = st.idx;
  st.idx = n;
  const ph = st.cfg.phases[n];
  apply(b, st, ph, ev);
  const c = b.shipCenter(st.cfg.side);
  // the view stages it (flash, banner, new backdrop) and then tells the music layer (emitFase)
  ev.push({ k: 'boss', what: 'fase', side: st.cfg.side, n, amount: from, x: c.x, y: c.y, path: -1, at: 0 });
}

/** HP / turn thresholds: advance as many phases as were crossed (each one is announced). Called after every
 *  shot (fire) and at every turn start. */
export function fasesCheck(b: Battle): BattleEvent[] {
  const st = S(b);
  if (!st || b.winner !== null) return [];
  const ev: BattleEvent[] = [];
  const f = fasesProgress(b, st.cfg.side);
  for (let n = st.idx + 1; n < st.cfg.phases.length; n++) {
    const at = st.cfg.phases[n].at ?? {};
    const byHp = at.hp !== undefined && f >= at.hp;
    const byTurn = at.turn !== undefined && b.turn >= at.turn;
    if (!byHp && !byTurn) break;
    enter(b, st, n, ev);
  }
  return ev;
}

/** start of a side's turn: space stays calm; drifting bodies move (their wells with them) */
export function fasesStartTurn(b: Battle, _side: 0 | 1, ev: BattleEvent[]) {
  const st = S(b);
  if (!st) return;
  if (st.cfg.phases[st.idx].env?.calm) b.wind = 0;
  for (const s of st.bodies) if (s.well) s.well.x = bodyX(b, s);
  ev.push(...fasesCheck(b));
}

const PASS: Partial<Record<Trajectory, true>> = { wave: true, phase: true };

/** per-path flight helpers for integrate(): the wind multiplier and the body a projectile runs into */
export function fasesFlight(b: Battle, _side: number, traj: Trajectory) {
  const st = S(b);
  if (!st) return null;
  const env = st.cfg.phases[st.idx].env ?? {};
  const bodies = PASS[traj] ? [] : st.bodies.filter((s) => s.alive).map((s) => ({ x: bodyX(b, s), y: s.y, r2: s.r * s.r }));
  return {
    windMul: env.calm ? 0 : env.windMul ?? 1,
    body(x: number, y: number) {
      for (const s of bodies) if ((x - s.x) ** 2 + (y - s.y) ** 2 <= s.r2) return true;
      return false;
    },
  };
}

/**
 * resolveImpact, before anything else: a body took the hit, or a hull shield absorbed it. true = handled
 * (nothing else happens to this impact).
 */
export function fasesImpact(b: Battle, attSide: number, shot: ShotDef, atk: number, x: number, y: number, ev: BattleEvent[], path: number, at: number): boolean {
  const st = S(b);
  if (!st) return false;
  const hit = b.cellAt(x, y);
  if (!hit) {
    const s = st.bodies.find((k) => k.alive && (x - bodyX(b, k)) ** 2 + (y - k.y) ** 2 <= (k.r + 3) ** 2);
    if (!s) return false;
    st.bodyHits++;
    if (s.maxHp > 0) {
      s.hp -= Math.max(1, Math.round(atk * shot.power * 0.9));
      if (s.hp <= 0) {
        s.alive = false;
        if (s.well) {
          b.wells = b.wells.filter((w) => w !== s.well);
          st.wells = st.wells.filter((w) => w !== s.well);
          s.well = null;
        }
        ev.push({ k: 'info', text: s.def.look === 'cloud' ? '¡SE DESHACE LA NUBE!' : '¡SE PARTE EL PLANETOIDE!', x, y: y - 70, color: 0xe9f0ff, path, at });
      }
    }
    ev.push({ k: 'impact', x, y, side: 1 - attSide, radius: 30, element: shot.element, crit: false, path, at, total: 0 });
    return true;
  }
  // ESCUDO (Kit Astral): the first foe impacts on this hull vanish (once per impact, never the shooter's own)
  if (hit.side !== attSide && st.shieldLeft[hit.side] > 0) {
    st.shieldLeft[hit.side]--;
    st.shieldHits++;
    ev.push({ k: 'info', text: 'ESCUDO DE COMETA', x, y: y - 60, color: 0x9fe8ff, path, at });
    ev.push({ k: 'impact', x, y, side: hit.side, radius: 24, element: shot.element, crit: false, path, at, total: 0 });
    return true;
  }
  return false;
}

// ------------------------------------------------------------------ view / tests
export interface FasesView {
  idx: number;
  phase: FaseDef;
  layer: string;
  bodies: { x: number; y: number; r: number; hp: number; maxHp: number; alive: boolean; look: string; well: number }[];
  portals: Portals | null;
  shieldLeft: [number, number];
  enteredAt: number[];
  bodyHits: number;
  shieldHits: number;
  count: number;
}
export function fasesState(b: Battle): FasesView | null {
  const st = S(b);
  if (!st) return null;
  const ph = st.cfg.phases[st.idx];
  return {
    idx: st.idx,
    phase: ph,
    layer: ph.env?.layer ?? 'sea',
    bodies: st.bodies.map((s) => ({ x: bodyX(b, s), y: s.y, r: s.r, hp: s.hp, maxHp: s.maxHp, alive: s.alive, look: s.def.look ?? 'planet', well: s.well?.r ?? 0 })),
    portals: b.portals,
    shieldLeft: [...st.shieldLeft] as [number, number],
    enteredAt: [...st.enteredAt],
    bodyHits: st.bodyHits,
    shieldHits: st.shieldHits,
    count: st.cfg.phases.length,
  };
}

type Chip = { text: string; color: number; ink?: number; hot?: boolean };
/** RuleStrip chips: [enemy side, your side] */
export function fasesChips(b: Battle): [Chip[], Chip[]] {
  const st = S(b);
  if (!st) return [[], []];
  const e: Chip[] = [];
  const p: Chip[] = [];
  const ph = st.cfg.phases[st.idx];
  const env = ph.env ?? {};
  if (st.cfg.phases.length > 1) e.push({ text: `CAPA ${st.idx + 1}/${st.cfg.phases.length}: ${ph.name.toUpperCase()}`, color: 0xc9a8ff, hot: true });
  if ((env.g ?? 1) !== 1) e.push({ text: `GRAVEDAD x${env.g}`, color: 0x8fa8ff });
  if (env.calm) e.push({ text: 'SIN VIENTO', color: 0xe9f0ff });
  else if ((env.windMul ?? 1) !== 1) e.push({ text: `VIENTO x${env.windMul}`, color: 0xe9f0ff });
  const bodies = st.bodies.filter((s) => s.alive);
  if (bodies.some((s) => s.well)) e.push({ text: 'POZO ORBITAL: LOS TIROS DAN LA VUELTA', color: 0xf0b44c });
  else if (bodies.length) e.push({ text: `COBERTURA x${bodies.length}`, color: 0xc9b38a });
  if (b.portals) e.push({ text: 'GRIETAS: EL TIRO CAMBIA DE DUEÑO', color: 0xff7ab8, hot: true });
  const next = st.cfg.phases[st.idx + 1];
  if (next?.at?.hp !== undefined) e.push({ text: `SIGUIENTE CAPA AL ${Math.round(next.at.hp * 100)}%`, color: 0x6d6a80, ink: 0xffffff });
  if ((st.cfg.shield?.[0] ?? 0) > 0) p.push({ text: st.shieldLeft[0] > 0 ? `ESCUDO DE COMETA x${st.shieldLeft[0]}` : 'ESCUDO: SE RECARGA EN LA SIGUIENTE CAPA', color: st.shieldLeft[0] > 0 ? 0x9fe8ff : 0x8a95a3 });
  return [e, p];
}

// ------------------------------------------------------------------ the phase-change event for presentation / music
export interface FaseChange {
  /** the story battle id (spec.meta.special) when known */
  battle: string | null;
  /** phase index entered and the one it came from */
  index: number;
  from: number;
  id: string;
  name: string;
  layer: string;
  count: number;
}
const listeners = new Set<(e: FaseChange) => void>();
/** listen to staged phase changes (the battle view emits them right when the new layer shows). Returns an unsubscribe. */
export function onFase(fn: (e: FaseChange) => void): () => void {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}
/**
 * INTERLUDES: a scene that plays INSIDE a phase change while the battle waits (BattleScene awaits FasesFx.stage, which
 * awaits the interlude after the new layer shows). Presentation only: the sim already applied the phase, so the
 * fight (and the estimate worker) is the same with or without it. Keyed by story battle id + phase id.
 * Oleada 4: the CIRCUS MALUS Momento of H62 plugs in here (state/sys/rupturasO4Battles.ts H62_MOMENTO).
 */
export type FaseInterlude = (e: FaseChange) => Promise<void> | void;
const interludes = new Map<string, FaseInterlude>();
export function registerFaseInterlude(battle: string, fase: string, fn: FaseInterlude | null) {
  if (fn) interludes.set(`${battle}:${fase}`, fn);
  else interludes.delete(`${battle}:${fase}`);
}
export function faseInterlude(battle: string | null, fase: string): FaseInterlude | null {
  return battle ? (interludes.get(`${battle}:${fase}`) ?? null) : null;
}

/** the view calls this when it stages a phase (also the opening one, with from = -1) */
export function emitFase(e: FaseChange) {
  for (const fn of [...listeners]) {
    try {
      fn(e);
    } catch (err) {
      console.error('[fases] listener', err);
    }
  }
  const w = (globalThis as { window?: { dispatchEvent?: (e: Event) => boolean } }).window;
  if (w?.dispatchEvent && typeof CustomEvent === 'function') {
    try {
      w.dispatchEvent(new CustomEvent('nolc:fase', { detail: e }));
    } catch {
      /* no DOM */
    }
  }
}
