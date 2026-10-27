/**
 * Parte III · Acto I — the story battles' own rules (docs/part-iii/historia-v2/02-mapa.md §3; guiones/acto-1).
 * Pure sim rules with state in a WeakMap (like mareo.ts): the screen and the estimate play the same battle.
 *
 *   RIMA (H73, EMIAU)          `rima`: a side that fires the SAME element as its previous cat shot gets booed (that shot
 *                              × `boo`, 0.8); a different one gets the crowd (× `combo`, 1.1). Cannons don't count.
 *   LISTA VIP (H74, El Cadenero) `vip`: at the start of the checked side's turn, El Cadenero checks the wristband of its
 *                              STRONGEST cat (highest attack, alive): that one doesn't fire this turn. Once El Cadenero
 *                              (the captain, `captain`) is K.O., nobody checks lists anymore.
 *
 * Sim hooks (sim.ts, one line each): fire → rimaAtkMul · startTurn → vipStartTurn. Chips + intro lines: barChips / barLines.
 */
import type { Battle, BattleEvent } from './sim';
import type { ElementId, ShotDef } from './types';

export interface RimaCfg {
  /** the shot that repeats its side's last element: × this (the crowd boos) */
  boo: number;
  /** a shot that changes element: × this (the crowd cheers) */
  combo: number;
}
export interface VipCfg {
  /** the side whose list is checked (the player: 0) */
  side: 0 | 1;
  /** El Cadenero's uid (enemy captain: 'e0'); K.O. → no more checks */
  captain?: string;
}

interface BarState {
  /** last cat element fired per side (RIMA) */
  last: [ElementId | null, ElementId | null];
  /** the cat checked this turn (LISTA VIP) */
  vip: string | null;
  boos: number;
  cheers: number;
}
const STATE = new WeakMap<Battle, BarState>();
function S(b: Battle): BarState {
  let s = STATE.get(b);
  if (!s) {
    s = { last: [null, null], vip: null, boos: 0, cheers: 0 };
    STATE.set(b, s);
  }
  return s;
}

/** fire(): the multiplier RIMA gives this CAT shot (1 without the rule, for cannons and for the first shot) */
export function rimaAtkMul(b: Battle, side: number, shot: ShotDef, isCat: boolean, ev?: BattleEvent[]): number {
  const r = b.cfg.rules?.rima;
  if (!r || !isCat) return 1;
  const st = S(b);
  const prev = st.last[side];
  st.last[side] = shot.element;
  if (prev === null) return 1;
  const c = b.shipCenter(side);
  if (prev === shot.element) {
    st.boos++;
    ev?.push({ k: 'info', text: '¡BUUU! (REPITIÓ)', x: c.x, y: c.y - 220, color: 0xc8102e, path: 0, at: 0 });
    return r.boo;
  }
  st.cheers++;
  ev?.push({ k: 'info', text: '¡OOOH! (RIMA)', x: c.x, y: c.y - 220, color: 0xffd400, path: 0, at: 0 });
  return r.combo;
}

/** startTurn (after the turn's stun / cooldown ticks): El Cadenero checks the list of `side` */
export function vipStartTurn(b: Battle, side: 0 | 1, ev: BattleEvent[]) {
  const v = b.cfg.rules?.vip;
  const st = STATE.get(b) ?? S(b);
  st.vip = null;
  if (!v || side !== v.side || b.winner !== null) return;
  const capSide = (1 - v.side) as 0 | 1;
  const cap = v.captain ? b.sides[capSide].cats.find((c) => c.def.uid === v.captain) : null;
  if (cap?.ko) return;
  const live = b.sides[side].cats.filter((c) => !c.ko);
  if (live.length < 2) return; // never leaves a side without a shooter
  const top = live.reduce((a, c) => (c.def.atk > a.def.atk ? c : a), live[0]);
  top.stunned = Math.max(top.stunned, 1);
  st.vip = top.def.uid;
  const p = b.shipCenter(side);
  ev.push({ k: 'info', text: `¡NO ESTÁS EN LA LISTA! (${top.def.name.toUpperCase()})`, x: p.x, y: p.y - 240, color: 0xffd400, path: -1, at: 0 });
}

/** the cat El Cadenero checked this turn (null: none) */
export const vipChecked = (b: Battle) => STATE.get(b)?.vip ?? null;
/** tests / the sheet */
export const barState = (b: Battle) => {
  const s = STATE.get(b);
  return s ? { ...s, last: [...s.last] as [ElementId | null, ElementId | null] } : null;
};

/** the intro / ¿POR QUÉ? lines (only what the sim plays) */
export function barRuleLines(r: { rima?: RimaCfg; vip?: VipCfg } | undefined): string[] {
  const out: string[] = [];
  if (r?.rima) out.push(`RIMA: repite el elemento del tiro anterior y te abuchean (x${r.rima.boo}); varía y te aplauden (x${r.rima.combo})`);
  if (r?.vip) out.push('LISTA VIP: cada turno El Cadenero revisa a tu gato más fuerte y ese no dispara. Derríbalo y se acaba la lista');
  return out;
}
/** chips on YOUR side of the rule strip */
export function barChips(b: Battle): { text: string; color: number; ink?: number; hot?: boolean }[] {
  const r = b.cfg.rules;
  const out: { text: string; color: number; ink?: number; hot?: boolean }[] = [];
  if (r?.rima) {
    const last = STATE.get(b)?.last[0];
    out.push({ text: last ? `RIMA: NO REPITAS ${String(last).toUpperCase()}` : 'RIMA: VARÍA EL ELEMENTO', color: 0xffd400, ink: 0x171317 });
  }
  if (r?.vip) {
    const v = vipChecked(b);
    out.push(v ? { text: 'LISTA VIP: TU GATO MÁS FUERTE NO ENTRA', color: 0xc8102e, ink: 0xffffff, hot: true } : { text: 'LISTA VIP', color: 0xffd400, ink: 0x171317 });
  }
  return out;
}
