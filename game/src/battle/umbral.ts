/**
 * Parte II · Oleada 4 «EL UMBRAL» — the Correctores' rule (H62) and the per-phase mechanics of the saga's final boss
 * (H63) on top of the generic FASES (battle/fases.ts, Oleada 3): fases.ts decides WHEN a phase starts and sets its
 * environment (gravity, wind multiplier, layer); this module adds what each phase DOES (StageRules.umbral).
 *
 *   correct   CORRECCIÓN      at its turn start the watched side repairs its `cells` most damaged cells by `frac`
 *   tachon    TACHÓN          the element that hurt its ship most during your last turn is crossed out: during your
 *                             next turn that element hits it ×`mul` (vary your shots; cannons are never crossed out)
 *   gale      VIENTO LOCO     the wind changes side every round, at `gale` strength
 *   chaos     CAOS            every shot (both sides) ×`chaos` — they broke the box
 *   hand      LA MANO         a gravity well (a hand) that moves across the field every round and bends every shot
 *   atk       EN SERIO        the watched side's own shots ×`atk`
 *
 * `base` applies all battle long (H62); `byFase[<fase id>]` replaces it while that fase is on (H63). Plain data: the
 * estimate worker gets it through structured clone. No rng: everything is bookkeeping on the sim's own events, so
 * the screen and the estimate play the same fight.
 *
 * Hooks: sim.ts startTurn umStartTurn · fire umAtkMul + umAfterFire · ai.ts umShotValue. Entering a fase runs the
 * FASE_EFFECTS entry 'umbral' (registered below; list it in the FaseDef.effects of every phase after the first),
 * which pushes `{ k:'boss', what:'umbral', n: <phase> }` for the banner. The RuleStrip reads umChips.
 */
import type { Battle, BattleEvent } from './sim';
import type { ElementId, ShotDef } from './types';
import { FASE_EFFECTS, currentFase, faseIndex } from './fases';
import { CELL } from './ship';

export interface UmbralRules {
  correct?: { cells: number; frac: number };
  tachon?: { mul: number };
  /** VIENTO LOCO: wind strength (px/s², the HUD shows ±70 at most) */
  gale?: number;
  chaos?: number;
  /** LA MANO: well radius / pull and how far it swings from the middle of the field (px) */
  hand?: { r: number; k: number; swing: number; up: number };
  atk?: number;
  /** banner + intro line of this rule set (the phase's identity in the player's words) */
  name?: string;
  line?: string;
}
export interface UmbralCfg {
  /** the Correctores' / the boss's side */
  side: 0 | 1;
  base?: UmbralRules;
  byFase?: Record<string, UmbralRules>;
}

const NAME: Partial<Record<ElementId, string>> = {
  fire: 'FUEGO',
  water: 'AGUA',
  nature: 'NATURALEZA',
  earth: 'TIERRA',
  electric: 'RAYO',
  wind: 'RÁFAGA',
  ice: 'HIELO',
  magic: 'MAGIA',
  spirit: 'ESPÍRITU',
  cosmic: 'COSMOS',
  void: 'VACÍO',
  light: 'LUZ',
  shadow: 'SOMBRA',
  sound: 'SONIDO',
  time: 'TIEMPO',
  crystal: 'CRISTAL',
  gravity: 'GRAVEDAD',
};
export const umElementName = (e: ElementId) => NAME[e] ?? String(e).toUpperCase();

interface UmState {
  cfg: UmbralCfg;
  /** damage to the watched ship by element during the foe's turn in progress / the last one */
  dmgNow: Map<ElementId, number>;
  /** crossed out for the foe's turn in progress */
  tachado: ElementId | null;
  /** the hand (a Battle.wells entry we own) */
  hand: { x: number; y: number; r: number; k: number; turns: number; owner: number; kind: 'well' } | null;
  /** phase announced (the opening one is announced on turn 1) */
  announced: number;
  /** counters (balance / tests) */
  corrected: number;
  tachones: number;
  crossedHits: number;
}
const STATE = new WeakMap<Battle, UmState>();
const cfgOf = (b: Battle): UmbralCfg | undefined => (b.cfg.rules as { umbral?: UmbralCfg } | undefined)?.umbral;
function S(b: Battle): UmState | null {
  const cfg = cfgOf(b);
  if (!cfg) return null;
  let s = STATE.get(b);
  if (!s) {
    s = { cfg, dmgNow: new Map(), tachado: null, hand: null, announced: -1, corrected: 0, tachones: 0, crossedHits: 0 };
    STATE.set(b, s);
  }
  return s;
}

/** the rules on right now (the fase's own when the battle is phased) */
export function umRules(b: Battle): UmbralRules | null {
  const st = S(b);
  if (!st) return null;
  const f = currentFase(b);
  return (f && st.cfg.byFase?.[f.id]) ?? st.cfg.base ?? null;
}

function fieldMid(b: Battle) {
  const [p, e] = b.sides;
  return Math.round((p.setup.origin.x + p.ship.cols * CELL + e.setup.origin.x) / 2);
}

/** LA MANO: place / move / remove the well (a NEW object each move, so the view redraws it where it went) */
function syncHand(b: Battle, st: UmState, r: UmbralRules | null) {
  if (st.hand) {
    const old = st.hand;
    b.wells = b.wells.filter((w) => w !== old);
    st.hand = null;
  }
  const h = r?.hand;
  if (!h) return;
  // round 1 left of the middle, round 2 right, … (the hand moves things: you aim at where it'll be)
  const dir = b.turn % 2 ? -1 : 1;
  const w = { x: fieldMid(b) + dir * h.swing, y: b.waterY - h.up, r: h.r, k: h.k, turns: Infinity, owner: st.cfg.side, kind: 'well' as const };
  st.hand = w;
  b.wells.push(w);
}

function announce(b: Battle, st: UmState, n: number, ev: BattleEvent[]) {
  st.announced = n;
  const r = umRules(b);
  const c = b.shipCenter(st.cfg.side);
  ev.push({ k: 'boss', what: 'umbral', side: st.cfg.side, n, x: c.x, y: c.y, path: -1, at: 0 });
  if (r?.name) ev.push({ k: 'info', text: r.name, x: 960, y: 250, color: 0xf4f4f0, path: -1, at: 0 });
}

/** entering a phase (FASE_EFFECTS 'umbral'): the hand moves to its new rules, the new rules are announced */
FASE_EFFECTS.umbral = (b, _phase, ev) => {
  const st = S(b);
  if (!st) return;
  st.tachado = null;
  syncHand(b, st, umRules(b));
  announce(b, st, faseIndex(b), ev);
};

/**
 * Start of `side`'s turn. The watched side corrects itself; the foe's turn starts with its best element of last turn
 * crossed out; every round the gale flips and the hand moves.
 */
export function umStartTurn(b: Battle, side: 0 | 1, ev: BattleEvent[]) {
  const st = S(b);
  if (!st) return;
  const r = umRules(b);
  const ws = st.cfg.side;
  if (st.announced < 0) announce(b, st, Math.max(0, faseIndex(b)), ev);
  if (side === 0) {
    if (r?.gale) b.wind = (b.turn % 2 ? 1 : -1) * r.gale;
    if (r?.hand) syncHand(b, st, r);
  }
  if (side === ws) {
    if (r?.correct) {
      const ship = b.sides[side].ship;
      const hurt = ship
        .cells()
        .filter((c) => c.hp < c.maxHp && !c.status.voided)
        .sort((a, z) => a.hp / a.maxHp - z.hp / z.maxHp || a.y - z.y || a.x - z.x)
        .slice(0, r.correct.cells);
      let healed = 0;
      for (const c of hurt) {
        const amount = Math.round(Math.min(c.maxHp - c.hp, c.maxHp * r.correct.frac));
        if (amount <= 0) continue;
        c.hp += amount;
        healed += amount;
        ev.push({ k: 'heal', side, cell: c, amount });
      }
      if (healed > 0) {
        st.corrected++;
        const p = b.cellCenter(side, hurt[0].x, hurt[0].y);
        ev.push({ k: 'info', text: 'CORRECCIÓN', x: p.x, y: p.y - 60, color: 0xf4f4f0, path: -1, at: 0 });
      }
    }
  } else {
    // the foe's turn begins: what hurt us most last time gets crossed out
    st.tachado = null;
    if (r?.tachon && st.dmgNow.size) {
      let best: ElementId | null = null;
      let most = 0;
      for (const [e, d] of st.dmgNow) if (d > most || (d === most && best !== null && e < best)) [best, most] = [e, d];
      if (best && most > 0) {
        st.tachado = best;
        st.tachones++;
        const p = b.shipCenter(ws);
        ev.push({ k: 'info', text: `TACHADO: ${umElementName(best)} ×${r.tachon.mul} ESTE TURNO`, x: p.x, y: p.y - 210, color: 0xff4a4a, path: -1, at: 0 });
      }
    }
    st.dmgNow.clear();
  }
}

/** fire(): crossed-out element ×mul against them · CAOS for everyone · the boss fighting for real */
export function umAtkMul(b: Battle, side: number, shot: ShotDef): number {
  const st = S(b);
  if (!st) return 1;
  const r = umRules(b);
  let m = r?.chaos ?? 1;
  if (side === st.cfg.side) m *= r?.atk ?? 1;
  else if (r?.tachon && st.tachado && shot.element === st.tachado) {
    m *= r.tachon.mul;
    st.crossedHits++;
  }
  return m;
}

/** fire(), after the shot resolved: book what hurt the watched ship (by element; cannons' neutral never counts) */
export function umAfterFire(b: Battle, side: number, shot: ShotDef, events: BattleEvent[]) {
  const st = S(b);
  if (!st || side === st.cfg.side || shot.element === 'neutral') return;
  let d = 0;
  for (const e of events) if ((e.k === 'cell' || e.k === 'part' || e.k === 'cat') && e.side === st.cfg.side && e.dmg > 0) d += e.dmg;
  if (d > 0) st.dmgNow.set(shot.element, (st.dmgNow.get(shot.element) ?? 0) + d);
}

/** AI: a crossed-out element is worth less against them (the player's AI reads the rule too) */
export function umShotValue(b: Battle, side: number, shot: ShotDef): number {
  const st = STATE.get(b);
  if (!st || side === st.cfg.side || !st.tachado || shot.element !== st.tachado) return 1;
  return umRules(b)?.tachon?.mul ?? 1;
}

// ------------------------------------------------------------------ view / tests
export interface UmbralView {
  rules: UmbralRules | null;
  tachado: ElementId | null;
  hand: { x: number; y: number; r: number } | null;
  corrected: number;
  tachones: number;
  crossedHits: number;
}
export function umState(b: Battle): UmbralView | null {
  const st = STATE.get(b);
  if (!st) return null;
  return {
    rules: umRules(b),
    tachado: st.tachado,
    hand: st.hand ? { x: st.hand.x, y: st.hand.y, r: st.hand.r } : null,
    corrected: st.corrected,
    tachones: st.tachones,
    crossedHits: st.crossedHits,
  };
}

type Chip = { text: string; color: number; ink?: number; hot?: boolean };
/** RuleStrip chips: [enemy side, your side] */
export function umChips(b: Battle): [Chip[], Chip[]] {
  const st = STATE.get(b);
  const r = umRules(b);
  if (!st || !r) return [[], []];
  const e: Chip[] = [];
  const p: Chip[] = [];
  if (r.correct) e.push({ text: `CORRECCIÓN: REPARA ${r.correct.cells} CELDAS`, color: 0xf4f4f0, ink: 0x2a2a2a });
  if (r.chaos && r.chaos !== 1) e.push({ text: `CAOS: TODO PEGA ×${r.chaos}`, color: 0xff7ab8, hot: true });
  if (r.gale) e.push({ text: 'VIENTO LOCO: CAMBIA CADA RONDA', color: 0xe9f0ff });
  if (r.hand) e.push({ text: 'LA MANO: JALA LOS TIROS (SE MUEVE)', color: 0xf0b44c });
  if (r.atk && r.atk !== 1) e.push({ text: `PELEA EN SERIO ×${r.atk}`, color: 0xff4a4a, ink: 0xffffff });
  if (r.tachon) {
    if (st.tachado) p.push({ text: `TACHADO: TU ${umElementName(st.tachado)} ×${r.tachon.mul}`, color: 0xff4a4a, ink: 0xffffff, hot: true });
    else p.push({ text: 'TACHÓN: TU MEJOR ELEMENTO SE TACHA', color: 0x8a95a3 });
  }
  return [e, p];
}
