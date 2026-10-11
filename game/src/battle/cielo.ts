/**
 * Parte II · Oleada 2 — BATALLAS DEL CIELO (the celestial layer, 05 §9.2): StageRules.sky.
 *
 * Pure rules, no rendering, no rng: the battle screen and the estimate worker play them the same (the AI and the
 * aim preview integrate the same field, so they "see" every rule). State in a WeakMap (like cristal.ts / ruido.ts).
 *
 *   GRAVEDAD ×0.7       Battle.field.gMul (every projectile flies longer)
 *   VIENTO EN CAPAS     the turn's wind blows differently by altitude: high band ×1.6, middle ×1, low band
 *                       (near the clouds) ×−0.5 (a counter-current). A Kit de Vuelo level 2 (Estabilizadores) keeps
 *                       30% of the layers off that side's shots.
 *   ISLOTES             1–2 floating rocks between the ships that stop projectiles (both sides'; Sonido's wave and
 *                       Vacío's phase go through). They drift up and down a little each turn (by turn number) and
 *                       crumble into the void after enough hits.
 *   AL VACÍO            any module ≤25% that takes another foe hit falls into the void (Gravedad's FLOTANDO: ≤60%):
 *                       battle/gravedad.ts grAfterImpact. Kit level 3 (Ancla de Nube): that side keeps the sea rules.
 *   Story twists (Oleada 2): `correct` (the Corrector repairs its 2 most damaged cells every turn: CORRECCIÓN),
 *   `target` (it aims at that species, which hits ×mul: Canelo's impatience), `invert` (from a turn on, gravity
 *   inverts over one ship: ABAJO ES ARRIBA, Battle.field.anti) and `mass` (Masa Madre: a permanent well in the middle
 *   of the field that bends EVERY projectile).
 *
 * Hooks: sim.ts constructor (skyInit) · startTurn (skyStartTurn) · integrate (skyFlight) · resolveImpact
 * (skyIsletImpact) · fire (skyAtkMul) · ai.ts (skyTargetMul). The view reads skyState / skyChips.
 */
import type { Battle, BattleEvent } from './sim';
import type { ShotDef, Trajectory } from './types';
import { CELL } from './ship';
import { FASE_EFFECTS } from './fases';

export interface SkyCfg {
  /** field gravity (default 0.7) */
  g?: number;
  /** wind multiplier by band, top → bottom (default [1.6, 1, -0.5]) */
  layers?: [number, number, number];
  /** floating islets between the ships (0–2, default 2) */
  islets?: number;
  /** Kit de Vuelo level per side [player, enemy] (0 none · 1 flies · 2 stabilizers · 3 cloud anchor) */
  kit?: [number, number];
  /** H46: this side corrects (repairs) its `cells` most damaged cells by `frac` of their life at its turn start */
  correct?: { side: 0 | 1; cells: number; frac: number };
  /** H46: the other side of `side` wants to «correct» this species: it aims at it, and it hits ×mul */
  target?: { side: 0 | 1; species: string; mul: number };
  /** H47: from the start of `turn`, gravity inverts over `side`'s ship (ABAJO ES ARRIBA) */
  invert?: { turn: number; side: 0 | 1; k?: number };
  /** H49: a permanent mass in the middle of the field that bends every projectile toward it */
  mass?: { r: number; k: number };
  /**
   * A DORMANT sky (two-phase battles, e.g. H44 sea → sky): every sky rule sleeps until the FASES phase with this id
   * starts (its `effects` must include 'skyWake'; its env sets the gravity). Before that the battle is a sea battle.
   */
  from?: string;
}

export const SKY_G = 0.7;
export const SKY_LAYERS: [number, number, number] = [1.6, 1, -0.5];
/** band limits, measured up from the cloud deck (Battle.waterY) */
export const SKY_BANDS = { high: 520, low: 260 };
/** the share of the layered wind a Kit de Vuelo level 2 removes from its side's shots */
export const KIT_STABILIZER = 0.3;

export interface Islet {
  id: number;
  x: number;
  /** resting height; the live y drifts with the turn (isletY) */
  y0: number;
  r: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  phase: number;
}
interface SkyState {
  cfg: SkyCfg;
  /** false while a dormant sky (cfg.from) waits for its phase */
  awake: boolean;
  layers: [number, number, number];
  islets: Islet[];
  inverted: boolean;
  /** hits the islets took (balance scripts / tests) */
  isletHits: number;
  /** modules that fell into the void per side (feats/tests) */
  corrected: number;
}
const STATE = new WeakMap<Battle, SkyState>();
const S = (b: Battle) => STATE.get(b) ?? null;

/** this battle is in the sky (a dormant sky counts once its phase has started) */
export function skyOn(b: Battle) {
  if (!b.cfg.rules?.sky) return false;
  const st = S(b);
  return !st || st.awake;
}
/** Kit de Vuelo level of a side in this battle (0 outside the sky) */
export function skyKit(b: Battle, side: number) {
  return b.cfg.rules?.sky?.kit?.[side] ?? 0;
}
/** Ancla de Nube (kit 3): that side's modules keep the sea rules for falling off */
export function skyAnchored(b: Battle, side: number) {
  return skyKit(b, side) >= 3;
}

/** x of the middle of the open air between the two ships */
export function fieldMid(b: Battle) {
  const [p, e] = b.sides;
  return Math.round((p.setup.origin.x + p.ship.cols * CELL + e.setup.origin.x) / 2);
}

/** islet geometry: the gap between the two ships, a high rock and a low one (none when the gap is too narrow) */
function placeIslets(b: Battle, n: number): Islet[] {
  const [p, e] = b.sides;
  const left = p.setup.origin.x + p.ship.cols * CELL;
  const right = e.setup.origin.x;
  const gap = right - left;
  if (n <= 0 || gap < 150) return [];
  const cx = (left + right) / 2;
  const avg = (p.ship.initialMax?.[0] ?? 0) * 0.5 + (e.ship.initialMax?.[0] ?? 0) * 0.5;
  const hp = Math.max(260, Math.round(avg * 0.05));
  const spots = [
    { dx: -Math.min(70, gap * 0.15), up: 470, r: 44 },
    { dx: Math.min(70, gap * 0.15), up: 250, r: 48 },
  ];
  return spots.slice(0, Math.min(2, n)).map((s, i) => ({ id: i, x: Math.round(cx + s.dx), y0: b.waterY - s.up, r: s.r, hp, maxHp: hp, alive: true, phase: i * 2.1 }));
}

/** live height of an islet: a slow bob by turn number (deterministic: the preview and the shot agree) */
export function isletY(b: Battle, i: Islet) {
  return Math.round(i.y0 + Math.sin(b.turn * 1.3 + i.phase) * 36);
}

export function skyInit(b: Battle, cfg: SkyCfg) {
  const dormant = !!cfg.from;
  if (!dormant) b.field.gMul = cfg.g ?? SKY_G;
  const st: SkyState = { cfg, awake: !dormant, layers: cfg.layers ?? SKY_LAYERS, islets: dormant ? [] : placeIslets(b, cfg.islets ?? 2), inverted: false, isletHits: 0, corrected: 0 };
  STATE.set(b, st);
  if (cfg.mass && !dormant) b.wells.push({ x: fieldMid(b), y: b.waterY - 380, r: cfg.mass.r, k: cfg.mass.k, turns: Infinity, owner: 1, kind: 'well' });
}

/** a dormant sky wakes up (FASES effect 'skyWake'): islets, layered wind, the void, the mass — gravity comes from the phase env */
export function skyWake(b: Battle) {
  const st = S(b);
  if (!st || st.awake) return;
  st.awake = true;
  st.islets = placeIslets(b, st.cfg.islets ?? 2);
  if (st.cfg.mass) b.wells.push({ x: fieldMid(b), y: b.waterY - 380, r: st.cfg.mass.r, k: st.cfg.mass.k, turns: Infinity, owner: 1, kind: 'well' });
}
/** the sky rules are live right now (false: no sky, or a dormant one) */
export function skyAwake(b: Battle) {
  return !!S(b)?.awake;
}
FASE_EFFECTS.skyWake = (b) => skyWake(b);

/** start of `side`'s turn: the Corrector's correction, the inversion */
export function skyStartTurn(b: Battle, side: 0 | 1, ev: BattleEvent[]) {
  const st = S(b);
  if (!st || !st.awake) return;
  const cfg = st.cfg;
  if (cfg.invert && !st.inverted && b.turn >= cfg.invert.turn) {
    st.inverted = true;
    const t = b.sides[cfg.invert.side];
    const x0 = t.setup.origin.x - CELL;
    const x1 = t.setup.origin.x + (t.ship.cols + 1) * CELL;
    b.field.anti = { x0, x1, y0: -900, k: cfg.invert.k ?? -0.35 };
    const c = b.shipCenter(cfg.invert.side);
    // the view shouts «¡ABAJO ES ARRIBA!» and draws the inverted column (BattleScene 'gravity' + GravityFx)
    ev.push({ k: 'boss', what: 'gravity', side: cfg.invert.side, n: 3, x: c.x, y: c.y, path: -1, at: 0 });
  }
  if (cfg.correct && cfg.correct.side === side) {
    const ship = b.sides[side].ship;
    const hurt = ship
      .cells()
      .filter((c) => c.hp < c.maxHp && !c.status.voided)
      .sort((a, z) => a.hp / a.maxHp - z.hp / z.maxHp || a.y - z.y || a.x - z.x)
      .slice(0, cfg.correct.cells);
    for (const c of hurt) {
      const amount = Math.round(Math.min(c.maxHp - c.hp, c.maxHp * cfg.correct.frac));
      if (amount <= 0) continue;
      c.hp += amount;
      ev.push({ k: 'heal', side, cell: c, amount });
    }
    if (hurt.length) {
      st.corrected++;
      const p = b.cellCenter(side, hurt[0].x, hurt[0].y);
      ev.push({ k: 'info', text: 'CORRECCIÓN', x: p.x, y: p.y - 60, color: 0xf4f4f0, path: -1, at: 0 });
    }
  }
}

const PASS: Partial<Record<Trajectory, true>> = { wave: true, phase: true };

/**
 * Per-path flight helpers for integrate(): the wind multiplier at a height (layers × the side's stabilizers) and
 * the islet a projectile runs into. null outside the sky (zero cost for every other battle).
 */
export function skyFlight(b: Battle, side: number, traj: Trajectory) {
  const st = S(b);
  if (!st || !st.awake) return null;
  const keep = skyKit(b, side) >= 2 ? 1 - KIT_STABILIZER : 1;
  const [hi, mid, lo] = st.layers;
  const yHi = b.waterY - SKY_BANDS.high;
  const yLo = b.waterY - SKY_BANDS.low;
  const islets = PASS[traj] ? [] : st.islets.filter((i) => i.alive).map((i) => ({ x: i.x, y: isletY(b, i), r2: i.r * i.r }));
  return {
    windAt(y: number) {
      const m = y < yHi ? hi : y < yLo ? mid : lo;
      // stabilizers pull every band toward plain wind (×1)
      return 1 + (m - 1) * keep;
    },
    islet(x: number, y: number) {
      for (const i of islets) if ((x - i.x) ** 2 + (y - i.y) ** 2 <= i.r2) return true;
      return false;
    },
  };
}

/**
 * A projectile stopped on an islet (resolveImpact, before anything else): the rock takes the hit, nothing else
 * does. Returns true when it handled the impact.
 */
export function skyIsletImpact(b: Battle, attSide: number, shot: ShotDef, atk: number, x: number, y: number, ev: BattleEvent[], path: number, at: number): boolean {
  const st = S(b);
  if (!st || !st.awake || !st.islets.length) return false;
  const isl = st.islets.find((i) => i.alive && (x - i.x) ** 2 + (y - isletY(b, i)) ** 2 <= (i.r + 3) ** 2);
  if (!isl || b.cellAt(x, y)) return false;
  const dmg = Math.max(1, Math.round(atk * shot.power * 0.9));
  isl.hp -= dmg;
  st.isletHits++;
  if (isl.hp <= 0) {
    isl.alive = false;
    ev.push({ k: 'info', text: '¡EL ISLOTE CAE AL VACÍO!', x, y: y - 70, color: 0xe9f0ff, path, at });
  } else ev.push({ k: 'info', text: 'ISLOTE', x, y: y - 60, color: 0xe9f0ff, path, at });
  ev.push({ k: 'impact', x, y, side: 1 - attSide, radius: 30, element: shot.element, crit: false, path, at, total: 0 });
  return true;
}

/** H46: the species the enemy wants to «correct» hits ×mul (its impatience is the point) */
export function skyAtkMul(b: Battle, side: number, catId: string | undefined) {
  const t = b.cfg.rules?.sky?.target;
  return t && catId === t.species && side !== t.side ? t.mul : 1;
}
/** H46: the enemy AI's interest in a cabin (they came for that cat) */
export function skyTargetMul(b: Battle, side: number, catId: string | undefined) {
  const t = b.cfg.rules?.sky?.target;
  return t && side === t.side && catId === t.species ? 2.5 : 1;
}

// ------------------------------------------------------------------ view / tests
export interface SkyView {
  layers: [number, number, number];
  bands: { yHi: number; yLo: number };
  islets: { id: number; x: number; y: number; r: number; hp: number; maxHp: number; alive: boolean }[];
  inverted: boolean;
  kit: [number, number];
  isletHits: number;
  corrected: number;
}
export function skyState(b: Battle): SkyView | null {
  const st = S(b);
  if (!st) return null;
  return {
    layers: st.layers,
    bands: { yHi: b.waterY - SKY_BANDS.high, yLo: b.waterY - SKY_BANDS.low },
    islets: st.islets.map((i) => ({ id: i.id, x: i.x, y: isletY(b, i), r: i.r, hp: i.hp, maxHp: i.maxHp, alive: i.alive })),
    inverted: st.inverted,
    kit: [skyKit(b, 0), skyKit(b, 1)],
    isletHits: st.isletHits,
    corrected: st.corrected,
  };
}

type Chip = { text: string; color: number; ink?: number; hot?: boolean };
/** RuleStrip chips: [enemy side, your side] */
export function skyChips(b: Battle): [Chip[], Chip[]] {
  const st = S(b);
  if (!st || !st.awake) return [[], []];
  const e: Chip[] = [];
  const p: Chip[] = [];
  e.push({ text: `CIELO: GRAVEDAD x${b.field.gMul}`, color: 0x8fa8ff });
  const w = b.wind;
  const arrow = (m: number) => (Math.abs(w * m) < 6 ? '·' : w * m > 0 ? '→' : '←');
  e.push({ text: `VIENTO EN CAPAS ${arrow(st.layers[0])}${arrow(st.layers[1])}${arrow(st.layers[2])}`, color: 0xe9f0ff });
  const isl = st.islets.filter((i) => i.alive).length;
  if (isl) e.push({ text: `ISLOTES x${isl}: CUBREN`, color: 0xc9b38a });
  if (st.cfg.correct) e.push({ text: 'CORRECCIÓN: SE REPARA', color: 0xf4f4f0, ink: 0x2a2a2a });
  if (st.cfg.mass) e.push({ text: 'MASA: TODO CAE AL CENTRO', color: 0xf0b44c, hot: true });
  if (st.inverted) e.push({ text: 'ABAJO ES ARRIBA', color: 0xc77dff, hot: true });
  else if (st.cfg.invert) e.push({ text: `VOLTEA LA GRAVEDAD EN EL TURNO ${st.cfg.invert.turn}`, color: 0xc77dff });
  const kit = skyKit(b, 0);
  p.push({ text: kit >= 3 ? 'ANCLA DE NUBE: NO SE CAE NADA' : 'AL VACÍO: MÓDULO ≤25% SE CAE', color: kit >= 3 ? 0x7ed957 : 0xffb4a4 });
  if (kit >= 2) p.push({ text: 'ESTABILIZADORES −30% VIENTO', color: 0x8fd3ff });
  const t = st.cfg.target;
  if (t) p.push({ text: `SU OBJETIVO PEGA x${t.mul}: LO QUIEREN CORREGIR`, color: 0xffc94a, hot: true });
  return [e, p];
}
