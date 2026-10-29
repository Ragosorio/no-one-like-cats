/**
 * Helpers shared by the post-Parte III universes of UNIVERSOS-H («libros, cine y pop»: Hannah Michitana, Persa Falsa,
 * Hermiaune, Luna Lovegata, Miaunce, Michiércoles, Sabrina Gatpenter, Post Maulone). The base kit is kit.ts; kitA–kitD
 * hold the earlier waves' helpers (re-used, never edited). This file adds:
 * - coarse polygon shapes: hearts, wigs of blonde waves, a light cone, velvet curtains with folds, string lights hung on a
 *   catenary, rain as thin quads — every one a fixed handful of vertices (Pixi pools one batcher per Graphics over ~400
 *   vertices and those buffers never shrink: keep each Graphics well under ~25k, above all in the full-page card);
 * - `held()`: a big title built at open() (alpha≈0) and slammed in later — building stroked text mid-shot costs a
 *   100–170 ms frame.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { type SigCtx, alive, later } from './kit';
import { fadeKill } from './kitB';
import { ngon, rnd, streak, twinkle } from './kitD';
import { paid } from './kitC';

export const TAU = Math.PI * 2;

// --- shapes -----------------------------------------------------------------------------------
/** a heart as a polygon (center x,y; r ≈ half-width; `n` points per lobe) */
export function heartPts(x: number, y: number, r: number, n = 10, rot = 0): number[] {
  const p: number[] = [];
  const m = n * 2 + 4;
  const cs = Math.cos(rot);
  const sn = Math.sin(rot);
  for (let i = 0; i < m; i++) {
    const t = (i / m) * TAU;
    // the classic heart curve, scaled to ±1
    const hx = (16 * Math.pow(Math.sin(t), 3)) / 17;
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17;
    p.push(x + (hx * cs - hy * sn) * r, y + (hx * sn + hy * cs) * r);
  }
  return p;
}

/** a 5-point star (r outer, k inner ratio) */
export function star5(x: number, y: number, r: number, k = 0.45, rot = -Math.PI / 2): number[] {
  const p: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = rot + (i / 10) * TAU;
    const rr = i % 2 ? r * k : r;
    p.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  return p;
}

/** points of a hanging wire from (x0,y0) to (x1,y1) sagging `sag` at the middle (a parabola, n segments) */
export function catenary(x0: number, y0: number, x1: number, y1: number, sag: number, n = 16): number[] {
  const p: number[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    p.push(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + sag * 4 * u * (1 - u));
  }
  return p;
}

/** a polyline as one thick polygon strip (half-width `w`): a wire, a string, a bow — no stroke tessellation */
export function strip(pts: number[], w: number): number[] {
  const n = pts.length / 2;
  const L: number[] = [];
  const R: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1);
    const b = Math.min(n - 1, i + 1);
    const dx = pts[b * 2] - pts[a * 2];
    const dy = pts[b * 2 + 1] - pts[a * 2 + 1];
    const d = Math.hypot(dx, dy) || 1;
    const nx = (-dy / d) * w;
    const ny = (dx / d) * w;
    L.push(pts[i * 2] + nx, pts[i * 2 + 1] + ny);
    R.unshift(pts[i * 2] - nx, pts[i * 2 + 1] - ny);
  }
  // unshift(x, y) keeps each pair in order: R runs back from the end to the start
  return [...L, ...R];
}

/**
 * string lights on a wire: the wire (a strip) and `count` bulbs along it; `lit(i)` → 0..1 how bright bulb i is.
 * Each bulb: a cap + a 7-gon + (lit) a glow 9-gon. Returns the bulb positions.
 */
export function stringLights(
  g: Graphics,
  pts: number[],
  count: number,
  colors: number[],
  lit: (i: number) => number,
  o: { r?: number; wire?: number; wireW?: number; hang?: number; glow?: number } = {},
) {
  const r = o.r ?? 12;
  g.poly(strip(pts, o.wireW ?? 1.6)).fill(o.wire ?? 0x1a1a1a);
  const n = pts.length / 2;
  const at: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const u = (i + 0.5) / count;
    const f = u * (n - 1);
    const j = Math.min(n - 2, Math.floor(f));
    const q = f - j;
    const x = pts[j * 2] + (pts[j * 2 + 2] - pts[j * 2]) * q;
    const y = pts[j * 2 + 1] + (pts[j * 2 + 3] - pts[j * 2 + 1]) * q + (o.hang ?? r * 0.9);
    at.push([x, y]);
    const v = Math.max(0, Math.min(1, lit(i)));
    const col = colors[i % colors.length];
    if (v > 0.02 && (o.glow ?? 1) > 0) g.poly(ngon(x, y + r * 0.3, r * 2.6, r * 2.6, 9)).fill({ color: col, alpha: 0.22 * v * (o.glow ?? 1) });
    g.rect(x - r * 0.35, y - r * 1.15, r * 0.7, r * 0.6).fill(0x2a2a2a);
    g.poly(ngon(x, y + r * 0.2, r * 0.62, r, 7, Math.PI / 2)).fill({ color: v > 0.02 ? col : 0x3a3a3a, alpha: 0.35 + 0.65 * Math.max(v, 0.15) });
  }
  return at;
}

/** a light cone from (x0,y0) to (x1,y1), half-widths w0 → w1, in `layers` soft passes */
export function cone(g: Graphics, x0: number, y0: number, x1: number, y1: number, w0: number, w1: number, color: number, alpha = 0.18, layers = 3) {
  for (let i = 0; i < layers; i++) {
    const k = 1 - i / layers;
    g.poly(streak(x0, y0, x1, y1, w0 * k, w1 * k)).fill({ color, alpha: alpha / layers + (i ? alpha / layers : 0) * 0.5 });
  }
  // the pool of light on the floor
  g.poly(ngon(x1, y1, w1, w1 * 0.22, 18)).fill({ color, alpha: alpha * 0.9 });
  return g;
}

/**
 * a velvet curtain panel (x..x+w, top..top+h) with `folds` vertical folds: dark troughs and lit crests as polygons;
 * `gather` 0..1 pulls the bottom toward the outer edge (side = -1 left panel, +1 right panel: the outer edge's side).
 */
export function curtain(g: Graphics, x: number, top: number, w: number, h: number, base: number, dark: number, lite: number, folds = 7, gather = 0, side: -1 | 1 = -1) {
  const outer = side < 0 ? x : x + w;
  const bx = (px: number) => px + (outer - px) * gather * 0.75;
  const fw = w / folds;
  g.poly([x, top, x + w, top, bx(x + w), top + h, bx(x), top + h]).fill(base);
  for (let i = 0; i < folds; i++) {
    const x0 = x + i * fw;
    // the trough (dark) and the crest (lit), each a long tapered quad
    g.poly([x0 + fw * 0.05, top, x0 + fw * 0.32, top, bx(x0 + fw * 0.34), top + h, bx(x0 + fw * 0.02), top + h]).fill({ color: dark, alpha: 0.85 });
    g.poly([x0 + fw * 0.56, top, x0 + fw * 0.7, top, bx(x0 + fw * 0.74), top + h, bx(x0 + fw * 0.54), top + h]).fill({ color: lite, alpha: 0.5 });
  }
  return g;
}

/** a scalloped valance across the top (pelmet): `n` swags of `color` with a gold fringe */
export function valance(g: Graphics, x: number, y: number, w: number, h: number, color: number, fringe: number, n = 8) {
  const sw = w / n;
  g.rect(x, y, w, h * 0.45).fill(color);
  for (let i = 0; i < n; i++) {
    const cx = x + sw * (i + 0.5);
    const pts = [x + sw * i, y + h * 0.4];
    for (let j = 0; j <= 8; j++) {
      const a = Math.PI - (j / 8) * Math.PI;
      pts.push(cx + Math.cos(a) * sw * 0.5, y + h * 0.4 + Math.sin(a) * h * 0.6);
    }
    g.poly(pts).fill(color);
    for (let j = 0; j <= 8; j++) {
      const a = Math.PI - (j / 8) * Math.PI;
      const fx = cx + Math.cos(a) * sw * 0.5;
      const fy = y + h * 0.4 + Math.sin(a) * h * 0.6;
      g.rect(fx - 2, fy - 2, 4, h * 0.14).fill(fringe);
    }
  }
  return g;
}

/** rain as thin slanted quads (one fill): `n` drops over w×h, falling with time t (seeded) */
export function rain(g: Graphics, x: number, y: number, w: number, h: number, t: number, n: number, seed: number, color = 0xbfd0e0, alpha = 0.35, slant = 0.22, len = 46) {
  const r = rnd(seed);
  for (let i = 0; i < n; i++) {
    const sx = r() * (w + h * slant);
    const sp = 900 + r() * 700;
    const yy = (r() * h + t * sp) % (h + len);
    const xx = x + sx - (yy * slant);
    const l = len * (0.6 + r() * 0.8);
    const wd = 1 + r() * 1.4;
    g.poly([xx, y + yy - l, xx + wd, y + yy - l, xx + wd - l * slant, y + yy, xx - l * slant, y + yy]);
  }
  return g.fill({ color, alpha });
}

/** a blonde wig: a big mass of waves with bangs (origin at the crown; s = scale; ~120 vertices) */
export function wig(g: Graphics, s: number, base = 0xf2d36b, shade = 0xd9b04a, lite = 0xfff0a8, long = 1) {
  const L = 1 + (long - 1) * 0.8;
  // the back mass: a lumpy shield down to the shoulders
  const back: number[] = [];
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (i / n) * Math.PI; // top half, left → right
    back.push(Math.cos(a) * 150 * s, Math.sin(a) * 120 * s + 40 * s);
  }
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    const x = 150 * s - u * 300 * s;
    back.push(x + Math.sin(u * TAU * 2.5) * 10 * s, 40 * s + (230 + Math.sin(u * TAU * 3) * 26) * s * L);
  }
  g.poly(back).fill(base).stroke({ width: 5 * s, color: 0x6a4a12, join: 'round' });
  // wave locks (curls) down each side
  for (const sd of [-1, 1]) {
    for (let j = 0; j < 4; j++) {
      const cx = sd * (118 - j * 4) * s;
      const cy = (70 + j * 52) * s * L;
      g.poly(ngon(cx, cy, 40 * s, 30 * s, 10, sd * 0.4)).fill(j % 2 ? base : lite);
      g.poly(ngon(cx + sd * 6 * s, cy + 6 * s, 20 * s, 12 * s, 8, sd * 0.4)).fill({ color: shade, alpha: 0.7 });
    }
  }
  // the crown and the bangs (a scalloped fringe)
  g.poly(ngon(0, -36 * s, 118 * s, 74 * s, 20)).fill(lite);
  const bang: number[] = [-118 * s, -10 * s];
  for (let i = 0; i <= 6; i++) {
    const x = -110 * s + (i / 6) * 220 * s;
    bang.push(x, (i % 2 ? 46 : 20) * s);
  }
  bang.push(118 * s, -10 * s, 80 * s, -90 * s, -80 * s, -90 * s);
  g.poly(bang).fill(base).stroke({ width: 4 * s, color: 0x6a4a12, join: 'round' });
  // strands: a few darker sweeps down the mass
  for (const sd of [-1, 1]) for (let j = 0; j < 3; j++) g.poly(strip([sd * (40 + j * 30) * s, 50 * s, sd * (60 + j * 30) * s, (140 + j * 20) * s * L, sd * (46 + j * 30) * s, (230 + j * 10) * s * L], 3 * s)).fill({ color: shade, alpha: 0.8 });
  g.poly(ngon(-40 * s, -60 * s, 46 * s, 14 * s, 10, -0.3)).fill({ color: 0xffffff, alpha: 0.45 });
  return g;
}

/** a sparkle burst of 4-point stars around (x,y) in one Graphics (seeded) */
export function sparkles(g: Graphics, x: number, y: number, R: number, n: number, seed: number, color = 0xffffff, size = 22) {
  const r = rnd(seed);
  for (let i = 0; i < n; i++) {
    const a = r() * TAU;
    const d = R * Math.sqrt(r());
    g.poly(twinkle(x + Math.cos(a) * d, y + Math.sin(a) * d, size * (0.4 + r() * 0.9))).fill({ color, alpha: 0.6 + r() * 0.4 });
  }
  return g;
}

// --- beats and titles -------------------------------------------------------------------------
/**
 * a title built NOW (at open(), alpha ≈ 0, so its stroked text is rasterized off the shot) and shown at `at` s: it
 * slams in (scale `from` → 1), holds `hold` s and fades. Dropped if the payoff already landed (a skipped reveal).
 */
export function held(c: SigCtx, layer: Container, node: Container, x: number, y: number, at: number, o: { hold?: number; from?: number; rot?: number; onShow?: () => void; keepOnPay?: boolean } = {}) {
  node.position.set(x, y);
  node.rotation = o.rot ?? 0;
  node.alpha = 0.001;
  layer.addChild(node);
  later(c, at, () => {
    if (node.destroyed) return;
    if (paid(c) && !o.keepOnPay) return void fadeKill(node, 0, 0.05);
    node.alpha = 1;
    o.onShow?.();
    if (!c.reduce) gsap.fromTo(node.scale, { x: o.from ?? 2.2, y: o.from ?? 2.2 }, { x: 1, y: 1, duration: 0.18, ease: 'back.out(3)' });
    fadeKill(node, o.hold ?? 0.8, 0.25);
  });
  return node;
}

/** run fn(t) at `fps` until `node` dies or the reveal closes; with Reducir movimiento it draws once */
export function animate(c: SigCtx, node: Container, fps: number, fn: (t: number) => void) {
  fn(0);
  if (c.reduce) return;
  const t0 = performance.now();
  const iv = window.setInterval(() => {
    if (!alive(c) || node.destroyed) return window.clearInterval(iv);
    fn((performance.now() - t0) / 1000);
  }, 1000 / fps);
}
