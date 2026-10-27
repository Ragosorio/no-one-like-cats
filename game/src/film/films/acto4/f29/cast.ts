/**
 * F29 — the cast (kit/cast.ts) and the beat helpers. Gato Malo, Tailor Swift and EMIAU are their paintings (the traits
 * are painted: nothing drawn over them); Firma and Esquirla are stand-ins with their code-drawn traits.
 */
import type { SceneCtx } from '../../../stage';
import { NG_BEAT } from '../music';
import { Dressed, SLUG, esquirlaHood, signature } from '../kit';

export const firmaOf = (ctx: SceneCtx, size: number) => new Dressed(ctx.actor(SLUG.firma, size), (_h, b, g) => signature(b, g));
/** a painting that already wears its traits: a Dressed with nothing drawn on it (the callers keep `follow()`) */
const bare = () => undefined;
export const maloOf = (ctx: SceneCtx, size: number) => new Dressed(ctx.actor(SLUG.malo, size), bare);
export const tailorOf = (ctx: SceneCtx, size: number) => new Dressed(ctx.actor(SLUG.tailor, size), bare);
export const emiauOf = (ctx: SceneCtx, size: number) => new Dressed(ctx.actor(SLUG.emiau, size), bare);
export const esquirlaOf = (ctx: SceneCtx, size: number) => new Dressed(ctx.actor(SLUG.esquirla, size), (h, _b, g) => esquirlaHood(h, g));

/** the beat index and its envelope at song time m (NO G@ME: 0.667 s a beat) */
export const beatOf = (m: number) => Math.floor(m / NG_BEAT + 1e-6);
export const beatEnv = (m: number, k = 7) => Math.exp(-((m / NG_BEAT) % 1) * k);
/** a COVER POSE that snaps on every beat (Firma's signature move): a lean, a squash, a turn */
export function coverPose(m: number, rm = false): { rot: number; sx: number; sy: number; flip: boolean } {
  const b = beatOf(m);
  const e = beatEnv(m, 12);
  const v = [
    [-0.07, 1.04, 0.98, false],
    [0.06, 0.98, 1.03, true],
    [-0.03, 1.06, 0.96, false],
    [0.08, 1.0, 1.0, true],
  ][b % 4] as [number, number, number, boolean];
  const k = rm ? 0.3 : 1;
  return { rot: v[0] * k, sx: 1 + (v[1] - 1) * k + e * 0.03 * k, sy: 1 + (v[2] - 1) * k - e * 0.02 * k, flip: v[3] };
}
export const CAST_SLUGS = [SLUG.firma, SLUG.malo, SLUG.tailor, SLUG.emiau, SLUG.esquirla];
