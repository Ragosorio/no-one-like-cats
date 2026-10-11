/**
 * Drawing helpers for the Momentos style (vector, Pixi Graphics). Everything is a flat fill + a colored ink line:
 * no gradients except HARD bands, no paper texture, no soft shadows. Seeded so a redraw is identical.
 */
import { Graphics } from 'pixi.js';

/** a tiny seeded rng (mulberry32) */
export function rng(seed: number) {
  let a = seed >>> 0 || 0x9e3779b9;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** stable hash noise in [-1, 1] for (i, j) */
export function hashN(i: number, j = 0) {
  let h = (Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 2147483648 - 1;
}
/** smooth value noise in [-1, 1] (shakes, wobbles) */
export function vnoise(x: number, seed = 0) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hashN(i, seed) * (1 - u) + hashN(i + 1, seed) * u;
}

/** hard-banded vertical gradient (anime sky): colors top → bottom, optional band weights */
export function bands(g: Graphics, x: number, y: number, w: number, h: number, colors: number[], weights?: number[]) {
  const ws = weights ?? colors.map(() => 1);
  const tot = ws.reduce((a, b) => a + b, 0);
  let yy = y;
  colors.forEach((c, i) => {
    const bh = (h * ws[i]) / tot;
    g.rect(x, yy, w, bh + 1).fill(c);
    yy += bh;
  });
  return g;
}

/** n-point star (sparkles, muzzle flashes, impact stars) */
export function starPts(cx: number, cy: number, r1: number, r2: number, n: number, rot = 0): number[] {
  const pts: number[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i / (n * 2)) * Math.PI * 2;
    const r = i % 2 ? r2 : r1;
    pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  return pts;
}
/** a jagged spiky burst (impact / explosion silhouette), seeded */
export function burstPts(cx: number, cy: number, r: number, spikes: number, jag: number, seed: number): number[] {
  const R = rng(seed);
  const pts: number[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2 + (R() - 0.5) * 0.15;
    const rr = i % 2 ? r * (1 - jag * (0.6 + R() * 0.4)) : r * (0.85 + R() * 0.3);
    pts.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  return pts;
}
/** a brush-stroke backing for type: a slanted slab with ragged ends and a dry-brush streak */
export function brushSlab(g: Graphics, w: number, h: number, color: number, seed: number, skew = -0.12) {
  const R = rng(seed);
  const pts: number[] = [];
  const steps = 7;
  for (let i = 0; i <= steps; i++) pts.push(-w / 2 + (w * i) / steps, -h / 2 + (R() - 0.5) * h * 0.22);
  pts.push(w / 2 + h * 0.25, -h * 0.1, w / 2 + h * 0.05, h * 0.15);
  for (let i = steps; i >= 0; i--) pts.push(-w / 2 + (w * i) / steps + h * skew * -1, h / 2 + (R() - 0.5) * h * 0.22);
  pts.push(-w / 2 - h * 0.35, h * 0.05);
  g.poly(pts).fill(color);
  // dry-brush streaks off the tail
  for (let k = 0; k < 3; k++) {
    const yy = -h / 2 + h * (0.2 + 0.3 * k) + (R() - 0.5) * 6;
    g.rect(w / 2 + h * 0.1 + R() * 20, yy, 18 + R() * 40, 3 + R() * 4).fill(color);
  }
  return g;
}
/**
 * A cel cloud: lumpy cumulus top (circles), flat bottom, a shadow band along the bottom and a colored ink outline.
 * Drawn in its own local space (0,0 = bottom centre).
 */
export function cloud(g: Graphics, w: number, h: number, base: number, shadow: number, ink: number, seed: number, lw = 5) {
  const R = rng(seed);
  const n = 4 + Math.floor(R() * 3);
  const puffs: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const r = h * (0.38 + R() * 0.32) * (1 - Math.abs(t - 0.5) * 0.7);
    puffs.push([-w / 2 + w * (0.12 + t * 0.76), -r * 0.85, r]);
  }
  // outline pass (fat), then fill pass, then shadow band
  for (const [x, y, r] of puffs) g.circle(x, y, r + lw).fill(ink);
  g.roundRect(-w / 2 - lw, -h * 0.32 - lw, w + lw * 2, h * 0.32 + lw * 2, h * 0.16).fill(ink);
  for (const [x, y, r] of puffs) g.circle(x, y, r).fill(base);
  g.roundRect(-w / 2, -h * 0.32, w, h * 0.32, h * 0.14).fill(base);
  g.roundRect(-w / 2 + h * 0.08, -h * 0.13, w - h * 0.16, h * 0.13, h * 0.06).fill(shadow);
  // a couple of light catches on the top puffs
  for (const [x, y, r] of puffs.slice(1, 3)) g.ellipse(x - r * 0.25, y - r * 0.45, r * 0.32, r * 0.14).fill({ color: 0xffffff, alpha: 0.55 });
  return g;
}

/** radial focus lines (concentration lines) around (cx, cy): wedges from the edge of a w×h box toward an inner radius */
export function focusLines(g: Graphics, cx: number, cy: number, w: number, h: number, inner: number, n: number, color: number, seed: number, thick = 1) {
  const R = rng(seed);
  const outer = Math.hypot(w, h);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (R() - 0.5) * (Math.PI / n);
    const wid = (0.004 + R() * 0.012) * thick;
    const r0 = inner * (0.85 + R() * 0.6);
    const x0 = cx + Math.cos(a) * r0;
    const y0 = cy + Math.sin(a) * r0;
    g.poly([x0, y0, cx + Math.cos(a - wid) * outer, cy + Math.sin(a - wid) * outer, cx + Math.cos(a + wid) * outer, cy + Math.sin(a + wid) * outer]).fill(color);
  }
  return g;
}
/** parallel speed lines across a w×h box (centered), at angle `ang`, tapered, seeded */
export function speedLines(g: Graphics, w: number, h: number, ang: number, n: number, color: number, seed: number, thick = 1) {
  const R = rng(seed);
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const span = Math.hypot(w, h);
  for (let i = 0; i < n; i++) {
    const off = (R() - 0.5) * span;
    const len = span * (0.25 + R() * 0.6);
    const along = (R() - 0.5) * span * 0.8;
    const t = (1.5 + R() * 5) * thick;
    const cx = -sa * off + ca * along;
    const cy = ca * off + sa * along;
    const x0 = cx - (ca * len) / 2;
    const y0 = cy - (sa * len) / 2;
    const x1 = cx + (ca * len) / 2;
    const y1 = cy + (sa * len) / 2;
    g.poly([x0, y0, x1 - sa * t, y1 + ca * t, x1 + sa * t, y1 - ca * t]).fill(color);
  }
  return g;
}
