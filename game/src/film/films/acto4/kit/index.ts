/**
 * ACTO IV — the shared kit of the Act IV films («La gira», the POP box). The screen grammar of POP is the STADIUM'S
 * LED WALLS (several screens at once) and the fans' VERTICAL PHONE VIDEO (9:16), from styles/pop.ts; the stadium in
 * ./stadium; the cast and the stand-ins in ./cast. What the acts share (the Bitácora in her hand, Luzterna's beam,
 * Cerito made of static, Canelo's flame) comes from FILM-ACTO1's kit (films/acto1/kit) — reused, never copied.
 */
import { Graphics } from 'pixi.js';
import type { Actor } from '../../../../momentos/anime/actor';
import { flame, tailTip } from '../../acto1/kit';

export * from './stadium';
export * from './cast';
export * from './rule';
export { Beam, Bitacora, StaticKitten, bob, flame, lanternAt, luzOf, popIn, balloon, tailTip, word, wrapLines, kitTex, contact, CERITO } from '../../acto1/kit';
export { clamp01, sm, seg, env, lerp, rnd, outBack, outExpo, outCubic, inCubic, inOut, springIn, beatPulse } from '../../acto1/kit';
export type { LuzRig } from '../../acto1/kit';

/**
 * Canelo's tail flame in Act IV: it lives at 60 % since H85 (k 0.7); «chica» = the flagged moments (k 0.42): asleep, tired,
 * leaning on the ship. Drawn into `g` at the rig's tail tip of `a` (in a's parent space).
 */
export const FLAME = { act4: 0.7, chica: 0.42, baja: 0.26 } as const;
export function caneloFlame(g: Graphics, a: Actor | null, k: number, lt: number, rm = false, scale = 1) {
  const tip = tailTip(a);
  if (!tip) return;
  flame(g, tip[0], tip[1] - 6 * scale, k, lt, { rm, scale: scale * ((a?.size ?? 300) / 300) });
}
/** the flame that drops BY ITSELF while he sleeps, slowly like a candle in a draught, and comes back halfway (v2-i) */
export function sleepFlame(t: number, t0: number, dur = 3.2, from: number = FLAME.act4, low: number = FLAME.baja) {
  const x = (t - t0) / dur;
  if (x <= 0) return from;
  if (x >= 1) return (from + low) / 2 + (from - low) * 0.05;
  // down over the first 55 %, a flutter at the bottom, back up halfway
  if (x < 0.55) return from + (low - from) * Math.sin((x / 0.55) * Math.PI * 0.5);
  const y = (x - 0.55) / 0.45;
  return low + ((from + low) / 2 - low) * (1 - Math.cos(y * Math.PI)) * 0.5 + Math.sin(y * 18) * 0.015 * (1 - y);
}
