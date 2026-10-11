/**
 * YONOSE TODO — hand-drawn marks for the overlays that are ALREADY pencil (not redrawn by the Animatic filter): the
 * animator's notation (motion arcs, numbers, circles), the storyboard frame and its timing strip, the far hand's
 * line. Each mark is two or three light passes with a seeded wobble and an overshoot at the ends, like a quick sketch;
 * redraw it with a new seed on twos and it boils like the rest of the drawing.
 */
import type { Graphics } from 'pixi.js';
import { rng, vnoise } from '../../anime/draw';

export interface PencilOpts {
  width?: number;
  color?: number;
  alpha?: number;
  seed?: number;
  /** passes (2–3 look sketched) */
  passes?: number;
  /** wobble amplitude (px) */
  wob?: number;
  /** overshoot at each end (px) */
  over?: number;
}

/** a sketched polyline through pts [x0, y0, x1, y1, …] */
export function sketch(g: Graphics, pts: number[], o: PencilOpts = {}) {
  const passes = o.passes ?? 2;
  const wob = o.wob ?? 1.6;
  const over = o.over ?? 5;
  const seed = o.seed ?? 1;
  const n = pts.length / 2;
  if (n < 2) return;
  for (let p = 0; p < passes; p++) {
    const R = rng(seed * 31 + p * 7 + 3);
    const s0 = seed * 0.37 + p * 5.1;
    const dx0 = pts[2] - pts[0];
    const dy0 = pts[3] - pts[1];
    const l0 = Math.hypot(dx0, dy0) || 1;
    const dx1 = pts[2 * n - 2] - pts[2 * n - 4];
    const dy1 = pts[2 * n - 1] - pts[2 * n - 3];
    const l1 = Math.hypot(dx1, dy1) || 1;
    const o0 = over * (0.4 + R() * 0.9);
    const o1 = over * (0.4 + R() * 0.9);
    let acc = 0;
    for (let i = 0; i < n; i++) {
      let x = pts[2 * i];
      let y = pts[2 * i + 1];
      if (i === 0) {
        x -= (dx0 / l0) * o0;
        y -= (dy0 / l0) * o0;
      } else if (i === n - 1) {
        x += (dx1 / l1) * o1;
        y += (dy1 / l1) * o1;
      }
      if (i > 0) acc += Math.hypot(pts[2 * i] - pts[2 * i - 2], pts[2 * i + 1] - pts[2 * i - 1]);
      const jx = vnoise(acc * 0.03 + s0, seed + p) * wob;
      const jy = vnoise(acc * 0.03 + s0 + 40, seed + p + 9) * wob;
      if (i === 0) g.moveTo(x + jx, y + jy);
      else g.lineTo(x + jx, y + jy);
    }
    g.stroke({ width: (o.width ?? 2.2) * (p ? 0.8 : 1), color: o.color ?? 0x34343c, alpha: (o.alpha ?? 0.8) * (p ? 0.55 : 1), cap: 'round', join: 'round' });
  }
}

/** a quick pencil circle (one loop and a bit: the overshoot of a fast hand) */
export function circle(g: Graphics, cx: number, cy: number, rx: number, ry: number, o: PencilOpts & { turns?: number; start?: number } = {}) {
  const turns = o.turns ?? 1.12;
  const st = o.start ?? -2.2;
  const pts: number[] = [];
  const N = Math.max(18, Math.round(Math.max(rx, ry) * 0.5));
  for (let i = 0; i <= N; i++) {
    const a = st + (i / N) * Math.PI * 2 * turns;
    const k = 1 + 0.06 * Math.sin(i * 0.7 + (o.seed ?? 0));
    pts.push(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k);
  }
  sketch(g, pts, { ...o, over: 0 });
}

/** a motion arc with an arrow head (the animator's notation) from a to b, bulging by `bend` */
export function arc(g: Graphics, ax: number, ay: number, bx: number, by: number, bend: number, o: PencilOpts = {}) {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const nx = -(by - ay);
  const ny = bx - ax;
  const l = Math.hypot(nx, ny) || 1;
  const cx = mx + (nx / l) * bend;
  const cy = my + (ny / l) * bend;
  const pts: number[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    pts.push((1 - t) * (1 - t) * ax + 2 * (1 - t) * t * cx + t * t * bx, (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * cy + t * t * by);
  }
  sketch(g, pts, { ...o, over: 2 });
  const tx = bx - pts[pts.length - 4];
  const ty = by - pts[pts.length - 3];
  const tl = Math.hypot(tx, ty) || 1;
  const ux = tx / tl;
  const uy = ty / tl;
  const hs = 16;
  sketch(g, [bx - ux * hs - uy * hs * 0.6, by - uy * hs + ux * hs * 0.6, bx, by, bx - ux * hs + uy * hs * 0.6, by - uy * hs - ux * hs * 0.6], { ...o, over: 1, passes: 1 });
}

/** a sketched rectangle (frames, cards) */
export function box(g: Graphics, x: number, y: number, w: number, h: number, o: PencilOpts = {}) {
  const s = o.seed ?? 1;
  sketch(g, [x, y, x + w, y], { ...o, seed: s });
  sketch(g, [x + w, y, x + w, y + h], { ...o, seed: s + 1 });
  sketch(g, [x + w, y + h, x, y + h], { ...o, seed: s + 2 });
  sketch(g, [x, y + h, x, y], { ...o, seed: s + 3 });
}

/** a little pencil star (an asterisk with a jitter) */
export function star(g: Graphics, x: number, y: number, r: number, o: PencilOpts = {}) {
  const s = o.seed ?? 1;
  const a0 = (s * 0.71) % Math.PI;
  for (let i = 0; i < 3; i++) {
    const a = a0 + (i * Math.PI) / 3;
    sketch(g, [x - Math.cos(a) * r, y - Math.sin(a) * r, x + Math.cos(a) * r, y + Math.sin(a) * r], { ...o, seed: s + i * 13, passes: 1, over: 1, wob: 0.6 });
  }
}

/** scribbled Z's (sleep) */
export function zzz(g: Graphics, x: number, y: number, size: number, o: PencilOpts = {}) {
  const s = size;
  sketch(g, [x, y, x + s, y, x, y + s, x + s, y + s], { ...o, over: 1, passes: 1 });
}
