/**
 * Parte II · Oleada 4 — H58 «El Archipiélago de los Sueños»: REGLAS DE SUEÑO (StageRules.dream).
 *
 * Every `every` rounds the battle dreams a new rule. WHICH rules this island can dream (and how often each one) comes
 * from who sleeps on the player's island — but the sim never reads the save: the battle spec builds a plain,
 * structured-cloneable DreamCfg when it is assembled (state/sys/rupturasO4Battles.ts → dreamCfgFor(G.s), using
 * state/sys/suenosDream.ts) and the sim only draws from it. The draw is DETERMINISTIC: a hash of the battle seed + the
 * dream's own seed + the phase number (never Math.random, never b.rng: the rest of the battle rolls exactly as without
 * the rule), so the battle screen and the estimate worker play the same dream, and the same island + the same battle
 * seed always dream the same order. Another island (other sleepers) → another pool / seed → another order.
 *
 *   suelo      ¡EL AGUA ES SUELO!            a projectile that falls on the sea bounces once off the surface
 *   peces      ¡LOS CAÑONES DISPARAN PECES!  every cannon shot is a fish: AGUA, it soaks what it hits (rayo conducts)
 *   flota      ¡TODO FLOTA!                  field gravity ×DZ_FLOAT: everything flies farther
 *   ventolera  ¡VENTOLERA!                   strong wind that changes side every round
 *   arrullo    ¡CANCIÓN DE CUNA!             at the start of its turn every cat of that side heals DZ_LULL of its life
 *   elemento   ¡SUEÑO DE <ELEMENTO>!         shots of the dreamed element (the island's strongest) hit ×DZ_ELEMENT
 *
 * Every rule hits BOTH sides (it's a dream, not a buff): reading it is the skill (biblia §9.4 «Sueño Colectivo»).
 *
 * Hooks (sim.ts, one line each): startTurn dreamStartTurn · fire dreamCannon (cannon shots) + dreamAtkMul ·
 * integrate dreamFlight (the sea floor). A new dream is the sim event `{ k:'boss', what:'sueno', n: <phase>, … }`
 * (BattleScene shows the banner); the RuleStrip reads dreamChips. Music never decides anything here: the rule changes
 * by TURN; at most the view could wait for the bar to SHOW it (doc 18 §5.2).
 */
import type { Battle, BattleEvent } from './sim';
import type { ElementId, ShotDef, Trajectory } from './types';

export type DreamId = 'suelo' | 'peces' | 'flota' | 'ventolera' | 'arrullo' | 'elemento';
export const DREAM_IDS: DreamId[] = ['suelo', 'peces', 'flota', 'ventolera', 'arrullo', 'elemento'];

export interface DreamCfg {
  /** rounds each dream lasts (a new rule every `every` rounds) */
  every: number;
  /** the rules this island can dream and their weights (from who sleeps on it) */
  pool: { id: DreamId; w: number }[];
  /** the dreamed element (content id: 'fire', 'storm'…) for ¡SUEÑO DE …! */
  el: string;
  /** stable number from the sleepers (suenosDream.dreamSeed) */
  seed: number;
  /** who dreams tonight (names; intro / tests only) */
  who?: string[];
}

/** gravity while everything floats */
export const DZ_FLOAT = 0.55;
/** the dreamed element's shots */
export const DZ_ELEMENT = 1.3;
/** CANCIÓN DE CUNA: life healed per cat at its side's turn start */
export const DZ_LULL = 0.08;
/** VENTOLERA: wind strength (the HUD's wind is ±70 at most) */
export const DZ_GALE = 62;
/** EL AGUA ES SUELO: speed kept by the bounce (vertical, horizontal) */
export const DZ_BOUNCE: [number, number] = [0.62, 0.85];

/** the content elements that make a rule likelier (each dreamer's weight goes to the rules of its elements) */
export const DREAM_AFFINITY: Record<Exclude<DreamId, 'elemento'>, string[]> = {
  suelo: ['water', 'ice', 'earth', 'crystal'],
  peces: ['water', 'nature', 'light'],
  flota: ['gravity', 'cosmic', 'void', 'magic'],
  ventolera: ['storm', 'sound', 'time', 'fire'],
  arrullo: ['nature', 'shadow', 'light', 'magic'],
};

const EL_NAME: Record<string, string> = {
  fire: 'FUEGO',
  water: 'AGUA',
  nature: 'NATURALEZA',
  earth: 'TIERRA',
  storm: 'TORMENTA',
  ice: 'HIELO',
  magic: 'MAGIA',
  cosmic: 'COSMOS',
  void: 'VACÍO',
  light: 'LUZ',
  shadow: 'SOMBRA',
  sound: 'SONIDO',
  time: 'TIEMPO',
  crystal: 'CRISTAL',
  gravity: 'GRAVEDAD',
};
/** the sim elements of a content element (Tormenta shoots rayo and ráfaga) */
export function simElements(el: string): ElementId[] {
  return el === 'storm' ? ['electric', 'wind'] : [el as ElementId];
}

export interface DreamInfo {
  /** banner (gritable) */
  name: string;
  /** one line for the intro / the banner (may carry {element} tokens) */
  line: string;
  /** RuleStrip chip */
  chip: string;
  color: number;
}
/** name + line of a rule (¡SUEÑO DE …! needs the dreamed element) */
export function dreamInfo(id: DreamId, el = 'fire'): DreamInfo {
  switch (id) {
    case 'suelo':
      return { name: '¡EL AGUA ES SUELO!', line: 'Lo que cae al mar rebota una vez en la superficie.', chip: 'SUEÑO: EL AGUA ES SUELO (REBOTA)', color: 0x7fd8ff };
    case 'peces':
      return { name: '¡LOS CAÑONES DISPARAN PECES!', line: 'Los cañonazos son peces de {water} Agua: mojan lo que tocan (y el {storm} rayo conduce).', chip: 'SUEÑO: CAÑONES DE PECES (AGUA)', color: 0x5ec8ff };
    case 'flota':
      return { name: '¡TODO FLOTA!', line: `La gravedad baja a ×${DZ_FLOAT}: los tiros vuelan mucho más lejos.`, chip: `SUEÑO: TODO FLOTA (GRAVEDAD ×${DZ_FLOAT})`, color: 0xc9a8ff };
    case 'ventolera':
      return { name: '¡VENTOLERA!', line: 'Viento muy fuerte que cambia de lado cada ronda.', chip: 'SUEÑO: VENTOLERA (CAMBIA CADA RONDA)', color: 0xe9f0ff };
    case 'arrullo':
      return { name: '¡CANCIÓN DE CUNA!', line: `Al empezar su turno, cada gato se cura ${Math.round(DZ_LULL * 100)}% (los tuyos y los suyos).`, chip: `SUEÑO: CANCIÓN DE CUNA (+${Math.round(DZ_LULL * 100)}% POR TURNO)`, color: 0x9be89b };
    case 'elemento': {
      const n = EL_NAME[el] ?? el.toUpperCase();
      return { name: `¡SUEÑO DE ${n}!`, line: `Tus tiros de {${el}} ${n.charAt(0)}${n.slice(1).toLowerCase()} y los suyos pegan ×${DZ_ELEMENT}.`, chip: `SUEÑO DE ${n}: ×${DZ_ELEMENT}`, color: 0xffd166 };
    }
  }
}

// ------------------------------------------------------------------ the draw (pure: tests and the intro use it too)
/** 32-bit avalanche of two numbers (murmur3 finalizer) */
function mix(a: number, b: number) {
  let h = Math.imul((a ^ Math.imul(b + 0x9e3779b9, 0x85ebca6b)) >>> 0, 0xcc9e2d51);
  h ^= h >>> 15;
  h = Math.imul(h, 0x1b873593);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * The first `count` dreams of a battle: a weighted draw from the pool (never the same rule twice in a row), seeded by
 * the battle seed + the dream's seed + the phase number.
 */
export function dreamOrder(cfg: DreamCfg, battleSeed: number, count: number): DreamId[] {
  const pool = (cfg.pool ?? []).filter((p) => p.w > 0 && DREAM_IDS.includes(p.id));
  const out: DreamId[] = [];
  if (!pool.length) return out;
  const base = mix(battleSeed >>> 0, cfg.seed >>> 0);
  for (let n = 0; n < count; n++) {
    const prev = out[n - 1];
    const can = pool.length > 1 ? pool.filter((p) => p.id !== prev) : pool;
    const total = can.reduce((a, p) => a + p.w, 0);
    let r = (mix(base, n + 1) / 4294967296) * total;
    let pick = can[can.length - 1].id;
    for (const p of can) {
      r -= p.w;
      if (r < 0) {
        pick = p.id;
        break;
      }
    }
    out.push(pick);
  }
  return out;
}

// ------------------------------------------------------------------ battle state
interface DzState {
  cfg: DreamCfg;
  /** dream phase now (-1 before the first turn) */
  n: number;
  rule: DreamId | null;
  /** the order drawn so far */
  order: DreamId[];
  /** gravity before TODO FLOTA (restored when the dream ends) */
  gBefore: number | null;
  /** counters (balance scripts / tests) */
  fish: number;
  healed: number;
  boosted: number;
}
const STATE = new WeakMap<Battle, DzState>();
const cfgOf = (b: Battle): DreamCfg | undefined => (b.cfg.rules as { dream?: DreamCfg } | undefined)?.dream;
function S(b: Battle): DzState | null {
  const cfg = cfgOf(b);
  if (!cfg?.pool?.length) return null;
  let s = STATE.get(b);
  if (!s) {
    s = { cfg, n: -1, rule: null, order: [], gBefore: null, fish: 0, healed: 0, boosted: 0 };
    STATE.set(b, s);
  }
  return s;
}

export const dreamOn = (b: Battle) => !!S(b);
/** the dream now (null outside H58 / before the first turn) */
export function dreamRule(b: Battle): DreamId | null {
  return STATE.get(b)?.rule ?? null;
}
/** dream phase of a turn (rounds 1–2 → 0, 3–4 → 1…) */
export const dreamPhaseOf = (cfg: DreamCfg, turn: number) => Math.floor((Math.max(1, turn) - 1) / Math.max(1, cfg.every));

function leave(b: Battle, st: DzState) {
  if (st.rule === 'flota' && st.gBefore !== null) {
    b.field.gMul = st.gBefore;
    st.gBefore = null;
  }
}
function enter(b: Battle, st: DzState, rule: DreamId) {
  st.rule = rule;
  if (rule === 'flota') {
    st.gBefore = b.field.gMul;
    b.field.gMul = DZ_FLOAT;
  }
}

/** a gale from the left or the right: alternates every round, the first side from the draw */
function galeSign(b: Battle, st: DzState) {
  const first = mix(b.cfg.seed >>> 0, st.cfg.seed + st.n * 7) & 1 ? 1 : -1;
  return b.turn % 2 ? first : -first;
}

/**
 * Start of `side`'s turn: a new dream when its phase starts (announced), the gale changes side every round, the
 * lullaby heals the side that's about to play.
 */
export function dreamStartTurn(b: Battle, side: 0 | 1, ev: BattleEvent[]) {
  const st = S(b);
  if (!st) return;
  const n = dreamPhaseOf(st.cfg, b.turn);
  if (n !== st.n) {
    leave(b, st);
    st.n = n;
    if (st.order.length <= n) st.order = dreamOrder(st.cfg, b.cfg.seed, n + 4);
    const rule = st.order[n];
    enter(b, st, rule);
    const info = dreamInfo(rule, st.cfg.el);
    ev.push({ k: 'boss', what: 'sueno', side: 1, n, x: 960, y: 330, path: -1, at: 0 });
    ev.push({ k: 'info', text: info.chip, x: 960, y: 250, color: info.color, path: -1, at: 0 });
  }
  if (st.rule === 'ventolera' && side === 0) b.wind = galeSign(b, st) * DZ_GALE;
  if (st.rule === 'arrullo') {
    let any = false;
    for (const c of b.sides[side].cats) {
      if (c.ko || c.hp >= c.maxHp) continue;
      const h = Math.min(c.maxHp - c.hp, Math.round(c.maxHp * DZ_LULL));
      if (h <= 0) continue;
      c.hp += h;
      st.healed += h;
      any = true;
    }
    if (any) {
      const p = b.shipCenter(side);
      ev.push({ k: 'info', text: `CANCIÓN DE CUNA +${Math.round(DZ_LULL * 100)}%`, x: p.x, y: p.y - 170, color: 0x9be89b, path: -1, at: 0 });
    }
  }
}

/** fire(): while the cannons dream of fish, a cannon shot is a fish of water that soaks what it hits */
export function dreamCannon(b: Battle, shot: ShotDef): ShotDef {
  const st = STATE.get(b);
  if (!st || st.rule !== 'peces') return shot;
  st.fish++;
  const statuses = [...(shot.statuses ?? []).filter((s) => s.id !== 'wet'), { id: 'wet' as const, turns: 2 }];
  return { ...shot, name: 'PEZ', element: 'water', statuses };
}

/** fire(): ¡SUEÑO DE …! — the dreamed element hits ×DZ_ELEMENT (both sides) */
export function dreamAtkMul(b: Battle, _side: number, shot: ShotDef): number {
  const st = STATE.get(b);
  if (!st || st.rule !== 'elemento') return 1;
  if (!simElements(st.cfg.el).includes(shot.element)) return 1;
  st.boosted++;
  return DZ_ELEMENT;
}

/**
 * integrate(): EL AGUA ES SUELO — the sea is a floor for this path: `floor()` says whether a projectile at the surface
 * bounces (once per path; torpedoes dive as always). null when the sea is water.
 */
export function dreamFlight(b: Battle, _side: number, traj: Trajectory) {
  const st = STATE.get(b);
  if (!st || st.rule !== 'suelo' || traj === 'torpedo') return null;
  let left = 1;
  return {
    bounce: DZ_BOUNCE,
    floor() {
      if (left <= 0) return false;
      left--;
      return true;
    },
  };
}

// ------------------------------------------------------------------ view / tests
export interface DreamView {
  n: number;
  rule: DreamId | null;
  info: DreamInfo | null;
  /** rounds left in this dream (this one included) */
  left: number;
  next: DreamId | null;
  order: DreamId[];
  fish: number;
  healed: number;
  boosted: number;
}
export function dreamState(b: Battle): DreamView | null {
  const st = STATE.get(b);
  if (!st) return null;
  const every = Math.max(1, st.cfg.every);
  return {
    n: st.n,
    rule: st.rule,
    info: st.rule ? dreamInfo(st.rule, st.cfg.el) : null,
    left: every - ((Math.max(1, b.turn) - 1) % every),
    next: st.order[st.n + 1] ?? null,
    order: [...st.order],
    fish: st.fish,
    healed: st.healed,
    boosted: st.boosted,
  };
}

type Chip = { text: string; color: number; ink?: number; hot?: boolean };
/** RuleStrip chips (the dream belongs to the field: it goes on the enemy strip, where the stage rules live) */
export function dreamChips(b: Battle): Chip[] {
  const v = dreamState(b);
  if (!v?.info) return [];
  const out: Chip[] = [{ text: v.info.chip, color: v.info.color, ink: 0x1b1530, hot: true }];
  out.push({ text: v.left <= 1 ? 'EL SUEÑO CAMBIA LA PRÓXIMA RONDA' : `EL SUEÑO CAMBIA EN ${v.left} RONDAS`, color: 0x6d6a80, ink: 0xffffff });
  return out;
}
