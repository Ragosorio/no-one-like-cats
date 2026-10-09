/**
 * Parte II · Oleada 1 — H34 «Shhh»: EL BIBLIOTECARIO AHOGADO ODIA EL RUIDO (StageRules.noise).
 *
 * Pure rules, no rendering, no rng: the battle screen and the estimate worker play them the same. The state
 * lives here in a WeakMap (like cristal.ts) so Battle/SideState don't grow fields.
 *
 *   ×2       a SONIDO shot (a cat's or a cannon's) that hits the ship of the side that hates noise deals ×2 there
 *            (cells, boss parts and the cats it reaches inside)
 *   RUIDO    each of those shots adds 1 RUIDO (once per shot, however many cells the wave crosses)
 *   ¡SHHHH!  at 3 RUIDO he wakes up furious: RUIDO goes back to 0 and every shot of his NEXT turn (cats and the
 *            cannon volley) hits ×1.5. Then he calms down until the noise piles up again.
 *
 * The hooks: sim.ts fire() (nzBeginFire, nzAtkMul) · resolveImpact (nzImpact) · startTurn (nzStartTurn) ·
 * ai.ts (nzShotValue). The view reads nzChips (RuleStrip) and the 'shhh' boss event (shout + speech bubble).
 */
import type { Battle, BattleEvent } from './sim';
import type { ShotDef } from './types';
import { CELL } from './ship';

export interface NoiseCfg {
  /** the side that hates noise (its ship takes Sonido ×mul; it wakes up furious) */
  side: 0 | 1;
}

/** Sonido against the noise-hater's ship */
export const NZ_MUL = 2;
/** RUIDO that wakes him up */
export const NZ_WAKE = 3;
/** his next turn's shots once he wakes up */
export const NZ_RAGE = 1.5;
/** what he shouts when he wakes up (the view puts it in a speech bubble) */
export const NZ_SHOUT = '¡SHHHH! ¡ESTO ES UNA BIBLIOTECA!';

interface NzState {
  ruido: number;
  /** 'armed': woke up, his next turn is furious · 'now': it's that turn */
  furious: 'armed' | 'now' | null;
  /** the current shot already added its RUIDO */
  counted: boolean;
  /** times he woke up (balance scripts / tests) */
  wakes: number;
}
const STATE = new WeakMap<Battle, NzState>();
function S(b: Battle): NzState {
  let s = STATE.get(b);
  if (!s) {
    s = { ruido: 0, furious: null, counted: false, wakes: 0 };
    STATE.set(b, s);
  }
  return s;
}
const cfgOf = (b: Battle) => b.cfg.rules?.noise;

/** RUIDO now, whether he's furious, how many times he woke (null: this battle has no noise rule) */
export function nzState(b: Battle): { ruido: number; furious: NzState['furious']; wakes: number } | null {
  if (!cfgOf(b)) return null;
  const s = S(b);
  return { ruido: s.ruido, furious: s.furious, wakes: s.wakes };
}

/** a new shot begins: it may add one RUIDO */
export function nzBeginFire(b: Battle) {
  if (cfgOf(b)) S(b).counted = false;
}

/** attack multiplier of a shot fired by `side` (×1.5 during his furious turn) */
export function nzAtkMul(b: Battle, side: number) {
  const c = cfgOf(b);
  return c && side === c.side && S(b).furious === 'now' ? NZ_RAGE : 1;
}

/** start of `side`'s turn: his furious turn begins (armed → now), and ends when the other side plays again */
export function nzStartTurn(b: Battle, side: 0 | 1, ev: BattleEvent[]) {
  const c = cfgOf(b);
  if (!c) return;
  const s = S(b);
  if (side === c.side && s.furious === 'armed') {
    s.furious = 'now';
    const p = b.shipCenter(side);
    ev.push({ k: 'info', text: `¡FURIOSO! ESTE TURNO ×${NZ_RAGE}`, x: p.x, y: p.y - 200, color: 0xff4a4a, path: -1, at: 0 });
  } else if (side !== c.side && s.furious === 'now') s.furious = null;
}

/**
 * A FOE impact on `targetSide` is about to resolve: Sonido there hits ×2 and adds RUIDO (once per shot).
 * Returns the multiplier for the impact's base damage.
 */
export function nzImpact(b: Battle, attSide: number, targetSide: number, shot: ShotDef, ev: BattleEvent[], path: number, at: number): number {
  const c = cfgOf(b);
  if (!c || targetSide !== c.side || attSide === targetSide || shot.element !== 'sound') return 1;
  const s = S(b);
  if (!s.counted) {
    s.counted = true;
    s.ruido++;
    const p = b.shipCenter(targetSide);
    if (s.ruido >= NZ_WAKE) {
      s.ruido = 0;
      s.furious = 'armed';
      s.wakes++;
      ev.push({ k: 'info', text: '¡SHHHH!', x: p.x, y: p.y - 230, color: 0xff4a4a, path, at });
      ev.push({ k: 'boss', what: 'shhh', side: targetSide, n: s.wakes, x: p.x, y: p.y - CELL * 2, path, at });
    } else ev.push({ k: 'info', text: `RUIDO ${s.ruido}/${NZ_WAKE} · SONIDO ×${NZ_MUL}`, x: p.x, y: p.y - 200, color: 0x5ee0d0, path, at });
  }
  return NZ_MUL;
}

/** AI: a Sonido shot at the noise-hater is worth more (a bit less when it's the one that wakes him up) */
export function nzShotValue(b: Battle, side: number, shot: ShotDef): number {
  const c = cfgOf(b);
  if (!c || side === c.side || shot.element !== 'sound') return 1;
  return S(b).ruido + 1 >= NZ_WAKE ? 1.3 : 1.6;
}

/** RuleStrip chips for the noise-hater's side */
export function nzChips(b: Battle): { text: string; color: number; ink?: number; hot?: boolean }[] {
  const st = nzState(b);
  if (!st) return [];
  if (st.furious) return [{ text: st.furious === 'now' ? '¡SHHHH! FURIOSO ×1.5' : '¡SHHHH! SU TURNO PEGA ×1.5', color: 0xff4a4a, ink: 0xffffff, hot: true }];
  return [{ text: `RUIDO ${st.ruido}/${NZ_WAKE} · SONIDO ×${NZ_MUL}`, color: st.ruido >= NZ_WAKE - 1 ? 0xffd166 : 0x5ee0d0, hot: st.ruido >= NZ_WAKE - 1 }];
}
