/**
 * Parte III · La Borracha («La Última Ronda») — MAREO (StageRules.mareo, docs/part-iii/05-mapa-y-dimensiones.md §3, §10).
 *
 * Pure rules, no rendering, never the battle's rng: the battle screen and the estimate worker (autoplay.ts) play the same
 * battle. State lives in a WeakMap (like ruido.ts / cristal.ts) so Battle/SideState don't grow fields.
 *
 *   VAIVÉN   every CAT shot (both crews: everyone in the box is drunk) leaves at its aim + a sine sway of ±`sway`°.
 *            The screen passes the sway phase the player released at (an explicit input, like the angle: the aim guide
 *            shows the swayed arc, so «wait for the centre of the sway» is the skill). Without that input (the enemy, the
 *            headless estimate) the phase is a seeded hash of (battle seed, side, shot n): a player who releases at any
 *            point of the sway — the estimate plays exactly that and says so.
 *   DESVÍO   on top, a small deterministic drift per shot (±`drift`°, seeded hash): the guide does NOT show it, the
 *            estimate plays it.
 *   DONAS    `donas.n` donuts on `donas.side`'s deck. An impact that lands on one (≤ DONA_HIT px) eats it and HEALS that
 *            side: `heal` × its starting structure into its most damaged cells + `catHeal` × max hp to every live cat
 *            (×1.5 for its captain). A donut whose deck cell is gone falls into the sea (no heal).
 *   BOTELLAS every `every` turns from `first`, at the start of the alley's turn, `n` bottles fall on the OTHER ship
 *            (escombro): seeded x positions, `power` × the alley's cannon attack each. A queued volley the screen animates.
 *   KARAOKE  `ultSlow`: that side's ultimate meter fills ×`mul` (0.8 = one more turn: 5 shots instead of 4).
 *
 * Hooks (sim.ts): constructor → mareoInit · fire → mareoAngle · resolveImpact → mareoImpact · startTurn → mareoStartTurn ·
 * meterMul → mareoMeterMul. ai.ts → mareoShotValue (the AI avoids the donuts). The view: battle/mareoFx.ts.
 */
import type { Battle, BattleEvent, ShotPath } from './sim';
import type { ShotDef } from './types';
import { Rng } from '../core/rng';
import { CELL } from './ship';
import { FASE_EFFECTS } from './fases';

export interface MareoCfg {
  /** amplitude of the sine sway of every cat shot, in degrees */
  sway: number;
  /** seconds per full sway on screen (the guide's clock; the sim only reads the released phase) */
  period: number;
  /** max deterministic drift per cat shot, in degrees (the guide doesn't show it; the estimate plays it) */
  drift: number;
  /** donuts on that side's deck: eat one (hit it) and that side heals */
  donas?: { side: 0 | 1; n: number; heal: number; catHeal: number };
  /** bottles that fall on `side`'s ship (the alley throws them) from turn `first`, every `every` turns */
  botellas?: { side: 0 | 1; first: number; every: number; n: number; power: number };
  /** karaoke: that side's ultimate meter fills × mul */
  ultSlow?: { side: 0 | 1; mul: number };
}

/** what the screen adds to a cat shot under Mareo (recorded like the angle) */
export interface MareoInput {
  /** sway phase (0..1) at the moment the shot was released */
  sway?: number;
}

/** a donut on a deck */
export interface Dona {
  id: number;
  side: 0 | 1;
  /** the deck cell it sits on (grid) */
  cx: number;
  cy: number;
  /** world position (its centre) */
  x: number;
  y: number;
  state: 'on' | 'eaten' | 'fell';
}

/** an impact this close to a donut (px) eats it */
export const DONA_HIT = 46;
/** drawn radius of a donut (px) */
export const DONA_R = 18;
/** the bottles' projectile (a neutral, light shell; the screen draws a green bottle) */
export const BOTELLA: ShotDef = { id: 'mz_botella', name: 'BOTELLAS', element: 'neutral', trajectory: 'ballistic', power: 1, radius: 46, preview: 0, catMul: 0.35, gravityScale: 1.3 };

interface MzState {
  /** cat shots fired per side (the hash index of the sway / drift) */
  shots: [number, number];
  donas: Dona[];
  /** bottle volleys so far */
  volleys: number;
  /** last drift / sway applied (tests, the ¿POR QUÉ? sheet) */
  last: { side: number; sway: number; drift: number } | null;
  /** the bottles after a phase changed them (FASE_EFFECTS.mareoPuerta: El Cadenero closes the door) — null: the data's */
  bt: MareoCfg['botellas'] | null;
}
const STATE = new WeakMap<Battle, MzState>();
const cfgOf = (b: Battle) => b.cfg.rules?.mareo;
function S(b: Battle): MzState {
  let s = STATE.get(b);
  if (!s) {
    s = { shots: [0, 0], donas: [], volleys: 0, last: null, bt: null };
    STATE.set(b, s);
  }
  return s;
}

/** a seeded hash in [0, 1) of a few integers (never the battle's rng) */
export function mzHash(...n: number[]) {
  let h = 0x9e3779b9;
  for (const v of n) h = Math.imul(h ^ ((v | 0) + 0x7f4a7c15 + (h << 6) + (h >>> 2)), 0x85ebca6b) >>> 0;
  return new Rng(h).next();
}

const DEG = Math.PI / 180;

/** the sway offset (radians) at phase p (0..1) */
export function swayAt(cfg: MareoCfg, p: number) {
  return cfg.sway * DEG * Math.sin(2 * Math.PI * p);
}

/** the battle's own sway start (seeded): the screen's guide begins there */
export function swayStart(b: Battle, side: number) {
  return mzHash(b.cfg.seed, side, 7);
}

/** the phase the screen shows at `tSec` (its own clock) — pure */
export function mareoPhaseAt(b: Battle, side: number, tSec: number) {
  const c = cfgOf(b);
  if (!c) return 0;
  const p = swayStart(b, side) + tSec / Math.max(0.2, c.period);
  return p - Math.floor(p);
}

/** the angle a cat shot would leave at with this sway phase, WITHOUT the drift (the aim guide) */
export function mareoGuideAngle(b: Battle, angle: number, phase: number) {
  const c = cfgOf(b);
  return c ? angle + swayAt(c, phase) : angle;
}

/** the n-th cat shot of `side`: the phase a non-screen shooter releases at, and its drift (radians) — pure */
export function mareoDraw(b: Battle, side: number, n: number) {
  const c = cfgOf(b);
  if (!c) return { phase: 0, drift: 0 };
  return { phase: mzHash(b.cfg.seed, side, n, 1), drift: (mzHash(b.cfg.seed, side, n, 2) * 2 - 1) * c.drift * DEG };
}

/**
 * sim.ts fire(): the angle a CAT shot really leaves at (sway + drift). `input.sway` = the phase the screen released at;
 * without it, the seeded phase. Counts the shot. Unchanged without the rule.
 */
export function mareoAngle(b: Battle, side: number, angle: number, input?: MareoInput): number {
  const c = cfgOf(b);
  if (!c) return angle;
  const s = S(b);
  const n = s.shots[side as 0 | 1]++;
  const d = mareoDraw(b, side, n);
  const phase = typeof input?.sway === 'number' && Number.isFinite(input.sway) ? input.sway - Math.floor(input.sway) : d.phase;
  const sway = swayAt(c, phase);
  s.last = { side, sway, drift: d.drift };
  return angle + sway + d.drift;
}

/** sim.ts meterMul(): the karaoke side's ultimates fill slower */
export function mareoMeterMul(b: Battle, side: number) {
  const u = cfgOf(b)?.ultSlow;
  return u && u.side === side ? u.mul : 1;
}

// ------------------------------------------------------------------ donuts
/** the deck's top cell of column x (null: an empty column) */
function topCell(b: Battle, side: number, x: number) {
  const ship = b.sides[side].ship;
  for (let y = 0; y < ship.rows; y++) {
    const c = ship.get(x, y);
    if (c) return c;
  }
  return null;
}

/** constructor: put the donuts on the deck (evenly over the middle of the ship, preferring plain deck cells) */
export function mareoInit(b: Battle) {
  const c = cfgOf(b);
  if (!c) return;
  const s = S(b);
  s.donas = [];
  const d = c.donas;
  if (!d || d.n <= 0) return;
  const ship = b.sides[d.side].ship;
  const used = new Set<number>();
  for (let i = 0; i < d.n; i++) {
    const want = Math.round(ship.cols * (0.22 + (0.56 * (i + 1)) / (d.n + 1)));
    // nearest free column with a plain (non-module) top cell; any top cell if none
    let pick: number | null = null;
    for (let k = 0; k < ship.cols && pick === null; k++) {
      for (const x of [want + k, want - k]) {
        if (x < 0 || x >= ship.cols || used.has(x) || used.has(x - 1) || used.has(x + 1)) continue;
        const t = topCell(b, d.side, x);
        if (t && t.module === undefined) {
          pick = x;
          break;
        }
      }
    }
    if (pick === null) for (let x = 0; x < ship.cols && pick === null; x++) if (!used.has(x) && topCell(b, d.side, x)) pick = x;
    if (pick === null) break;
    used.add(pick);
    const t = topCell(b, d.side, pick)!;
    const p = b.cellCenter(d.side, t.x, t.y);
    s.donas.push({ id: i, side: d.side, cx: t.x, cy: t.y, x: p.x, y: p.y - CELL * 0.5 - DONA_R + 4, state: 'on' });
  }
}

/** the donuts now (empty without the rule) */
export function mareoDonas(b: Battle): readonly Dona[] {
  return cfgOf(b) ? S(b).donas : [];
}

/** a donut whose deck cell is gone falls into the sea */
function dropLoose(b: Battle) {
  for (const d of S(b).donas) if (d.state === 'on' && !b.sides[d.side].ship.get(d.cx, d.cy)) d.state = 'fell';
}

/**
 * resolveImpact (a FOE impact on `targetSide`): an impact on a donut eats it and that side heals. Returns the donuts eaten.
 */
export function mareoImpact(b: Battle, attSide: number, targetSide: number, x: number, y: number, ev: BattleEvent[], path: number, at: number): number {
  const c = cfgOf(b);
  if (!c?.donas || targetSide !== c.donas.side || attSide === targetSide) return 0;
  dropLoose(b);
  let n = 0;
  for (const d of S(b).donas) {
    if (d.state !== 'on' || Math.hypot(d.x - x, d.y - y) > DONA_HIT) continue;
    d.state = 'eaten';
    n++;
    ev.push({ k: 'info', text: '¡ÑAM! SE COMIÓ LA DONA: SE CURA', x: d.x, y: d.y - 90, color: 0xf59ac0, path, at });
    const healed = healSide(b, targetSide, c.donas.heal, c.donas.catHeal, ev);
    ev.push({ k: 'boss', what: 'dona', side: targetSide, n: d.id, x: d.x, y: d.y, amount: healed, path, at });
  }
  return n;
}

/** heal `frac` of the starting structure into the most damaged cells + `catFrac` of every live cat (captain ×1.5) */
function healSide(b: Battle, side: number, frac: number, catFrac: number, ev: BattleEvent[]) {
  const s = b.sides[side];
  let budget = Math.round((s.ship.initialMax?.[0] ?? 0) * frac);
  const total = budget;
  const cells = s.ship
    .cells()
    .filter((c) => c.hp < c.maxHp && !c.status.voided)
    .sort((a, b2) => a.hp / a.maxHp - b2.hp / b2.maxHp || a.y - b2.y || a.x - b2.x);
  for (const c of cells) {
    if (budget <= 0) break;
    const amount = Math.min(budget, c.maxHp - c.hp);
    c.hp += amount;
    budget -= amount;
    ev.push({ k: 'heal', side, cell: c, amount });
  }
  s.cats.forEach((cat, i) => {
    if (cat.ko) return;
    cat.hp = Math.min(cat.maxHp, cat.hp + Math.round(cat.maxHp * catFrac * (i === 0 ? 1.5 : 1)));
  });
  return total - budget;
}

/** AI (ai.ts decide): a shot that would land on one of the foe's donuts is worth much less */
export function mareoShotValue(b: Battle, side: number, paths: ShotPath[]): number {
  const c = cfgOf(b);
  if (!c?.donas || c.donas.side === side) return 1;
  const live = S(b).donas.filter((d) => d.state === 'on');
  if (!live.length) return 1;
  for (const p of paths) {
    for (const i of p.impacts) {
      const pt = p.points[i];
      if (live.some((d) => Math.hypot(d.x - pt.x, d.y - pt.y) <= DONA_HIT)) return 0.15;
    }
  }
  return 1;
}

// ------------------------------------------------------------------ bottles
/** turns until the next bottle volley on `side`'s ship (null: none in this battle) */
export function bottlesIn(b: Battle): number | null {
  const c = cfgOf(b);
  const bt = c ? (S(b).bt ?? c.botellas) : undefined;
  if (!bt) return null;
  if (b.turn < bt.first) return bt.first - b.turn;
  const k = (b.turn - bt.first) % bt.every;
  return k === 0 ? 0 : bt.every - k;
}

/** startTurn: the alley's turn on a volley turn → bottles fall on the other ship (resolved now, animated as queued) */
export function mareoStartTurn(b: Battle, side: 0 | 1, ev: BattleEvent[]) {
  const c = cfgOf(b);
  if (!c) return;
  dropLoose(b);
  const bt = S(b).bt ?? c.botellas;
  if (!bt || side === bt.side || b.winner !== null) return;
  if (b.turn < bt.first || (b.turn - bt.first) % bt.every !== 0) return;
  const st = S(b);
  const victim = b.sides[bt.side];
  const owner = (1 - bt.side) as 0 | 1;
  const atk = b.sides[owner].setup.cannonAtk * bt.power;
  const paths: ShotPath[] = [];
  const x0 = victim.setup.origin.x;
  const w = victim.ship.cols * CELL;
  for (let i = 0; i < bt.n; i++) {
    const u = (i + 0.2 + mzHash(b.cfg.seed, st.volleys, i, 3) * 0.6) / bt.n;
    const x = x0 + w * (0.08 + 0.84 * u);
    const tilt = (mzHash(b.cfg.seed, st.volleys, i, 4) - 0.5) * 0.3;
    paths.push(b.integrate(BOTELLA, { x, y: -140 - i * 70 }, Math.PI / 2 + tilt, 160, 0, owner));
  }
  st.volleys++;
  const events: BattleEvent[] = [];
  const c0 = b.shipCenter(bt.side);
  events.push({ k: 'info', text: '¡BOTELLAS!', x: c0.x, y: c0.y - 260, color: 0x2e7d4f, path: 0, at: 0 });
  b.resolvePaths(owner, BOTELLA, atk, paths, events);
  b.queued.push({ side: owner, label: '¡LLUEVEN BOTELLAS DEL CALLEJÓN!', paths, events, shot: BOTELLA });
  void ev;
}

/**
 * A boss phase «CIERRA LA PUERTA» (El Cadenero, mecanicas-v2/02 §3.1): from the next turn the bottles fall every turn
 * (1 fewer turn between volleys, never below 1) and one more each time. Deterministic (by turn); battle-local state.
 */
FASE_EFFECTS.mareoPuerta = (b: Battle) => {
  const c = cfgOf(b);
  const cur = c ? (S(b).bt ?? c.botellas) : undefined;
  if (!cur) return;
  S(b).bt = { ...cur, first: b.turn + 1, every: Math.max(1, cur.every - 1), n: cur.n + 1 };
};

// ------------------------------------------------------------------ the screen's chips and the honest sheet
export interface MzChip {
  text: string;
  color: number;
  ink?: number;
  hot?: boolean;
}

/** RuleStrip chips: [enemy side, your side] */
export function mareoChips(b: Battle): [MzChip[], MzChip[]] {
  const c = cfgOf(b);
  if (!c) return [[], []];
  const e: MzChip[] = [];
  const p: MzChip[] = [{ text: `MAREO ±${c.sway}°: SUELTA EN EL CENTRO DEL VAIVÉN`, color: 0xe8a33d, ink: 0x171317 }];
  const live = S(b).donas.filter((d) => d.state === 'on').length;
  if (c.donas) e.push(live ? { text: `DONAS x${live}: NO LES DES (SE CURA)`, color: 0xf59ac0, ink: 0x171317, hot: live > 0 } : { text: 'SIN DONAS', color: 0xb9b2a0 });
  const bi = bottlesIn(b);
  if (bi !== null) e.push(bi === 0 ? { text: '¡BOTELLAS ESTE TURNO!', color: 0x2e7d4f, ink: 0xffffff, hot: true } : { text: `BOTELLAS EN ${bi}`, color: 0x2e7d4f, ink: 0xffffff });
  if (c.ultSlow) e.push({ text: 'CANTAN: SU ULTI TARDA +1 TURNO', color: 0x8fa8ff, ink: 0x171317 });
  return [e, p];
}

/** the intro card / ¿POR QUÉ? lines (honest: only what the sim plays; short, the intro card shows them) */
export function mareoLines(c: MareoCfg): string[] {
  const out = [`MAREO: tu guía se balancea ±${c.sway}°; el tiro sale por donde va al soltar. Suelta en el centro`, `Cada tiro se desvía además hasta ±${c.drift}°: la guía no lo dibuja, la estimación sí lo juega`];
  if (c.donas) out.push(c.donas.n > 1 ? `DONAS: ${c.donas.n} en su cubierta. Cada una que le das, se la come y se cura` : 'DONA: una en su cubierta. Si le das, se la come y se cura ÉL');
  if (c.botellas) out.push(`BOTELLAS: desde el turno ${c.botellas.first}, cada ${c.botellas.every} turnos le llueven ${c.botellas.n} a tu barco`);
  if (c.ultSlow) out.push('KARAOKE: sus gatos cantan; su ULTIMATE tarda un turno más');
  return out;
}

/** tests / balance: the last sway + drift applied, the donuts, the volleys */
export function mareoState(b: Battle) {
  if (!cfgOf(b)) return null;
  const s = S(b);
  return { shots: [...s.shots] as [number, number], last: s.last, donas: s.donas.map((d) => ({ ...d })), volleys: s.volleys };
}
