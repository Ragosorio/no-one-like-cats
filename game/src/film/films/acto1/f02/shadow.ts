/**
 * F02 — the shadow-theatre kit: hand shadows, cut-outs with a rim of warm lamp light (never pure black), the morph of
 * two hands into a cat's head. Pure geometry + Graphics helpers (redrawn small, per frame).
 *
 * The lamp sits low on the LEFT (Borrón's counter lamp): every shadow carries its rim on the lower-left edge.
 */
import type { Graphics } from 'pixi.js';

/** the shadow body: a warm dark brown (13 §2.2: never black) and the lamp's rim */
export const SH = { body: 0x2e1a10, bodyL: 0x4a2c1a, rim: 0xffc46a, rimHot: 0xffe2a0, wall: 0x331f12, paper: 0xb8875a } as const;
/** the lamp side: the rim is drawn offset toward the light */
export const LAMP_DIR: [number, number] = [-0.8, 0.6];

export type Pt = [number, number];

/** a closed outline resampled to exactly n points, evenly by arc length */
export function resample(src: Pt[], n: number): Pt[] {
  const L: number[] = [0];
  for (let i = 1; i <= src.length; i++) {
    const a = src[i - 1];
    const b = src[i % src.length];
    L.push(L[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const total = L[L.length - 1];
  const out: Pt[] = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const d = (i / n) * total;
    while (j < src.length - 1 && L[j + 1] < d) j++;
    const a = src[j];
    const b = src[(j + 1) % src.length];
    const seg = L[j + 1] - L[j] || 1;
    const k = (d - L[j]) / seg;
    out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
  }
  return out;
}
/** rotate the start of a closed outline to the point nearest `p` */
export function startAt(pts: Pt[], p: Pt): Pt[] {
  let best = 0;
  let bd = Infinity;
  pts.forEach((q, i) => {
    const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return [...pts.slice(best), ...pts.slice(0, best)];
}
export const xform = (pts: Pt[], x: number, y: number, s: number, rot = 0, flip = false): Pt[] => {
  const c = Math.cos(rot);
  const n = Math.sin(rot);
  return pts.map(([px, py]) => {
    const fx = (flip ? -px : px) * s;
    const fy = py * s;
    return [x + fx * c - fy * n, y + fx * n + fy * c];
  });
};
export const flat = (pts: Pt[]) => pts.flatMap((p) => p);
export const mix = (a: Pt[], b: Pt[], k: number): Pt[] => a.map((p, i) => [p[0] + (b[i][0] - p[0]) * k, p[1] + (b[i][1] - p[1]) * k]);

/**
 * A LEFT hand seen as a shadow: wrist on the left, fingers pointing right. `spread` 0..1 opens the fingers,
 * `curl` 0..1 bends them down (writing / gripping). Local px, palm centre at 0,0, ~380 long.
 */
export function handOutline(spread = 0.6, curl = 0): Pt[] {
  const k = 1 + spread * 0.55;
  // pinky → index (bottom to top): centre y, half width, length
  const F: [number, number, number][] = [
    [54 * k, 9, 118],
    [27 * k, 11, 156],
    [-2 * k, 12, 172],
    [-34 * k, 11, 150],
  ];
  const out: Pt[] = [
    [-210, 70],
    [-60, 92],
    // thumb (down and forward)
    [10, 104],
    [70, 120 + curl * 22],
    [118, 108 + curl * 22],
    [130, 92 + curl * 18],
    [104, 80],
    [40, 76],
  ];
  F.forEach(([c, w, len], i) => {
    const t = len * (1 - curl * 0.45);
    const dn = len * curl * 0.5;
    if (i > 0) {
      // the web between two fingers (a little notch of light)
      const [pc, pw] = F[i - 1];
      out.push([26, (pc - pw + c + w) / 2]);
    }
    out.push([40, c + w], [40 + t * 0.72, c + w * 0.9 + dn * 0.7], [40 + t * 0.95, c + w * 0.5 + dn], [40 + t, c + dn], [40 + t * 0.95, c - w * 0.5 + dn], [40 + t * 0.72, c - w * 0.9 + dn * 0.7], [40, c - w]);
  });
  out.push([-40, -34 * k - 22], [-210, -52]);
  return out;
}

/** the LEFT half of a cat's head (shadow-play), centre line at x = 0: top centre → ear → cheek → jaw → chin */
export function catHalfOutline(): Pt[] {
  return [
    [0, -96],
    [-34, -104],
    [-62, -126],
    [-112, -214],
    [-126, -110],
    [-146, -40],
    [-138, 34],
    [-96, 96],
    [-40, 118],
    [0, 122],
    [0, 40],
    [0, -40],
  ];
}

/** a shadow shape: the lamp rim first (offset toward the light), then the warm-dark body */
export function shadowPoly(g: Graphics, pts: number[], o: { rim?: number; rimW?: number; body?: number; alpha?: number } = {}) {
  const w = o.rimW ?? 6;
  const a = o.alpha ?? 1;
  const dx = LAMP_DIR[0] * w;
  const dy = LAMP_DIR[1] * w;
  g.poly(pts.map((v, i) => v + (i % 2 ? dy : dx))).fill({ color: o.rim ?? SH.rim, alpha: a });
  g.poly(pts).fill({ color: o.body ?? SH.body, alpha: a });
}
/** a shadow rect with its rim */
export function shadowRect(g: Graphics, x: number, y: number, w: number, h: number, o: { rimW?: number; body?: number; rim?: number; alpha?: number } = {}) {
  shadowPoly(g, [x, y, x + w, y, x + w, y + h, x, y + h], o);
}
/** a quill (feather + nib) held at (x, y), pointing down-right at angle a */
export function quill(g: Graphics, x: number, y: number, a: number, s = 1, alpha = 1) {
  const c = Math.cos(a);
  const n = Math.sin(a);
  const P = (u: number, v: number): Pt => [x + (u * c - v * n) * s, y + (u * n + v * c) * s];
  const pts: Pt[] = [P(0, 0), P(-60, -10), P(-150, -34), P(-220, -40), P(-180, -12), P(-110, 4), P(-60, 6)];
  shadowPoly(g, flat(pts), { rimW: 4, alpha });
}
