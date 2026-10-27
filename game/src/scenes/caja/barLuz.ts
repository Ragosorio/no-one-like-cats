/**
 * THE CROSS's light (docs/part-iii/13 §3.2): what we see INSIDE the cat flap between your island and the Borracha — a
 * tunnel of warm rings flying past, rays turning, Canelo's orange hair drifting ahead of us, the flap's wooden arch at
 * the edges. Drawn by the island's hold at the end of p3_pelo (ui/story/gaterasCines.ts) and by the bar scene's cover
 * until it wipes away in TV bands (barInsertos.ts CrossingInsert): the same light on both sides of the scene change.
 * A tiny module on purpose (the island imports it at boot).
 */
import type { Graphics } from 'pixi.js';
import { W, H } from '../../core/App';

/** the flap's warm light */
export const FLAP_LIGHT = 0xffd27a;
const LINE = 0x1d1430;
const BIG = { x: -2200, y: -1600, w: W + 4400, h: H + 3200 };

/** the living light at `t` seconds (`gentle`: «Reducir movimiento» — slower, calmer) */
export function drawFlapLight(g: Graphics, t: number, gentle: boolean) {
  const cx = W / 2;
  const cy = H / 2;
  g.rect(BIG.x, BIG.y, BIG.w, BIG.h).fill(FLAP_LIGHT);
  // the tunnel: rings that come at us
  const sp = gentle ? 0.12 : 0.45;
  for (let i = 0; i < 7; i++) {
    const q = (t * sp + i / 7) % 1;
    const r = 60 + q * q * 1700;
    g.ellipse(cx, cy, r, r * 0.62).stroke({ width: 18 + 60 * q, color: i % 2 ? 0xffe9b0 : 0xf6bf5a, alpha: 0.55 * (1 - q * 0.6) });
  }
  // the rays, turning
  const rot = t * (gentle ? 0.08 : 0.35);
  for (let i = 0; i < 14; i++) {
    const a0 = rot + (i / 14) * Math.PI * 2;
    const a1 = a0 + 0.09;
    g.poly([cx, cy, cx + Math.cos(a0) * 2400, cy + Math.sin(a0) * 2400, cx + Math.cos(a1) * 2400, cy + Math.sin(a1) * 2400]).fill({ color: 0xfff6d6, alpha: 0.35 });
  }
  g.circle(cx, cy, 140).fill({ color: 0xfff6d6, alpha: 0.6 });
  // the flap's arch at the edges (we are passing through it)
  const k = 1 + ((t * sp * 0.6) % 1) * 0.15;
  const aw = 1350 * k;
  const ah = 1250 * k;
  const top = cy - ah / 2 + aw / 2;
  const arch: number[] = [cx - aw / 2, cy + ah / 2, cx - aw / 2, top];
  for (let i = 1; i < 16; i++) {
    const a = Math.PI + (Math.PI * i) / 16;
    arch.push(cx + Math.cos(a) * (aw / 2), top + Math.sin(a) * (aw / 2));
  }
  arch.push(cx + aw / 2, top, cx + aw / 2, cy + ah / 2);
  g.poly(arch, false).stroke({ width: 84, color: LINE });
  g.poly(arch, false).stroke({ width: 70, color: 0xc99a62 });
  // his hair, drifting ahead of us (it shows the way)
  const hx = cx + Math.sin(t * 1.3) * 160;
  const hy = cy + Math.sin(t * 0.9) * 70;
  const ha = Math.sin(t * 1.7) * 0.6;
  const c = Math.cos(ha);
  const sn = Math.sin(ha);
  const P = (lx: number, ly: number): [number, number] => [hx + lx * c - ly * sn, hy + lx * sn + ly * c];
  const [ax, ay] = P(-110, 0);
  const [b1x, b1y] = P(-50, -70);
  const [b2x, b2y] = P(40, 70);
  const [ex, ey] = P(110, -20);
  g.moveTo(ax, ay).bezierCurveTo(b1x, b1y, b2x, b2y, ex, ey).stroke({ width: 22, color: LINE, cap: 'round' });
  g.moveTo(ax, ay).bezierCurveTo(b1x, b1y, b2x, b2y, ex, ey).stroke({ width: 12, color: 0xff8a2a, cap: 'round' });
}
