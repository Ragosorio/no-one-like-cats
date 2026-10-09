/**
 * Shared drawing kit for the element habitats (island/habitats/*): iso helpers in TILE units relative
 * to the yard's anchor tile, the per-element material palette, and small reusable shapes
 * (rocks, crystals, spires, trees, ferns…). Everything is flat colour + ink, code-drawn.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import { TW, TH } from '../iso';
import { C } from '../../ui/theme';
import { glowTexture } from '../../art/textures';
import { shade, mixColor } from '../terrain';

export const INK = { width: 3, color: C.ink, join: 'round' as const, cap: 'round' as const };
export const THIN = { width: 2, color: C.ink, join: 'round' as const, cap: 'round' as const };
export const HAIR = { width: 1.5, color: C.ink, join: 'round' as const, cap: 'round' as const };
const hw = TW / 2;
const hh = TH / 2;

export type Pt = { x: number; y: number };
export type Tick = (t: number) => void;

/** tile coords (relative to the anchor tile center) → local px */
export const P = (gx: number, gy: number): Pt => ({ x: (gx - gy) * hw, y: (gx + gy) * hh });
export const stepped = (t: number) => Math.floor(t * 12) / 12;
export const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

/** tiny deterministic rng (same art every rebuild) */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}
export function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function glowSprite(parent: Container, x: number, y: number, tint: number, alpha = 0.4, scale = 0.6, add = false) {
  const gl = new Sprite(glowTexture());
  gl.anchor.set(0.5);
  gl.tint = tint;
  gl.alpha = alpha;
  gl.scale.set(scale);
  gl.position.set(x, y);
  if (add) gl.blendMode = 'add';
  parent.addChild(gl);
  return gl;
}

/** iso diamond covering tiles [gx0, gx0+w] × [gy0, gy0+h] (tile corners at -0.5) */
export function diamond(g: Graphics, gx0: number, gy0: number, w: number, h: number) {
  const a = P(gx0 - 0.5, gy0 - 0.5);
  const b = P(gx0 + w - 0.5, gy0 - 0.5);
  const c = P(gx0 + w - 0.5, gy0 + h - 0.5);
  const d = P(gx0 - 0.5, gy0 + h - 0.5);
  return g.poly([a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y]);
}
/** a ground "circle" of radius r tiles at (gx, gy) (an iso ellipse) */
export function groundEllipse(g: Graphics, gx: number, gy: number, r: number) {
  const p = P(gx, gy);
  return g.ellipse(p.x, p.y, r * hw * 1.41, r * hh * 1.41);
}
/** a flat polygon on the ground from tile-space points */
export function groundPoly(g: Graphics, pts: [number, number][]) {
  return g.poly(pts.flatMap(([x, y]) => {
    const p = P(x, y);
    return [p.x, p.y];
  }));
}
/** a ribbon on the ground following tile-space points (river, path…) */
export function ribbon(g: Graphics, pts: [number, number][], width: number, color: number, alpha = 1) {
  const q = pts.map(([x, y]) => P(x, y));
  g.moveTo(q[0].x, q[0].y);
  for (let i = 1; i < q.length - 1; i++) g.quadraticCurveTo(q[i].x, q[i].y, (q[i].x + q[i + 1].x) / 2, (q[i].y + q[i + 1].y) / 2);
  g.lineTo(q[q.length - 1].x, q[q.length - 1].y);
  return g.stroke({ width, color, alpha, cap: 'round', join: 'round' });
}

// ------------------------------------------------------------------ element materials
export interface Pal {
  /** yard floor */
  soil: number;
  soil2: number;
  /** rock / built stone */
  rock: number;
  rockLit: number;
  rockDark: number;
  /** the element's light (lava, water, runes, neon…) */
  glow: number;
  glowHot: number;
  /** foliage / secondary */
  leaf: number;
  leaf2: number;
  /** flowers / sparks */
  bloom: number;
  bloom2: number;
  /** houses T7–T10: walls, roof, trims, windows */
  wall: number;
  roof: number;
  trim: number;
  glass: number;
}

export const PAL: Record<string, Pal> = {
  fire: { soil: 0x5a3a33, soil2: 0x6e463a, rock: 0x3b2b2e, rockLit: 0x5e4446, rockDark: 0x24191b, glow: 0xff6a1a, glowHot: 0xffd166, leaf: 0x7a8a3a, leaf2: 0x9aa84a, bloom: 0xff5a2a, bloom2: 0xffb02e, wall: 0x4a3434, roof: 0xc8102e, trim: 0xffc94a, glass: 0xff9a3a },
  water: { soil: 0x3f7f78, soil2: 0x4f948a, rock: 0x35505a, rockLit: 0x4f7380, rockDark: 0x1f3540, glow: 0x3fe0f0, glowHot: 0xb8fbff, leaf: 0x2f8a5a, leaf2: 0x55b56e, bloom: 0x7fe8f0, bloom2: 0xb59cff, wall: 0xcfe3ea, roof: 0x3569a3, trim: 0x7fd8ff, glass: 0x7fe8f0 },
  nature: { soil: 0x79a84a, soil2: 0x8cbb57, rock: 0x8a7a64, rockLit: 0xa8977d, rockDark: 0x5e5244, glow: 0xd4f27a, glowHot: 0xffffff, leaf: 0x3f8a3f, leaf2: 0x5fbf4a, bloom: 0xff7ab8, bloom2: 0xffd84a, wall: 0xe8d9b8, roof: 0x3f8a3f, trim: 0xd4f27a, glass: 0xffe08a },
  earth: { soil: 0xc19a66, soil2: 0xd0ab75, rock: 0xa07a52, rockLit: 0xc49a6a, rockDark: 0x6e5238, glow: 0xe0b77a, glowHot: 0xfff1c9, leaf: 0x7a8a4a, leaf2: 0x9aa860, bloom: 0x9a6ad0, bloom2: 0x4fd0c0, wall: 0xb7a99a, roof: 0x8a5a2e, trim: 0xe0b77a, glass: 0x9a6ad0 },
  storm: { soil: 0x46506a, soil2: 0x535e7c, rock: 0x5a6476, rockLit: 0x7c879c, rockDark: 0x2b3245, glow: 0x00e5ff, glowHot: 0xe8ffff, leaf: 0x5a7a6a, leaf2: 0x7a9a8a, bloom: 0xffe14a, bloom2: 0x00e5ff, wall: 0x8a93a6, roof: 0x1f2b4a, trim: 0xffe14a, glass: 0x00e5ff },
  magic: { soil: 0x4b7a52, soil2: 0x5a8c5f, rock: 0x7d7f8f, rockLit: 0x9fa1b1, rockDark: 0x50525f, glow: 0x4ff0d0, glowHot: 0xd8fff6, leaf: 0x3a6a4a, leaf2: 0x4f8a5a, bloom: 0xa45cff, bloom2: 0xff7ad8, wall: 0x6d5a80, roof: 0x8a5cff, trim: 0x4ff0d0, glass: 0xff7ab8 },
  cosmic: { soil: 0x2a2148, soil2: 0x352a5c, rock: 0x4a3d70, rockLit: 0x66578f, rockDark: 0x1a1430, glow: 0x00e5ff, glowHot: 0xffffff, leaf: 0x8a5cff, leaf2: 0xff7ab8, bloom: 0xffffff, bloom2: 0xffe14a, wall: 0x4a3362, roof: 0x231626, trim: 0x00e5ff, glass: 0xff7ab8 },
  void: { soil: 0xe4e2dc, soil2: 0xd2d0c9, rock: 0x2a2a30, rockLit: 0x4a4a52, rockDark: 0x0d110f, glow: 0xff2e88, glowHot: 0xffffff, leaf: 0x9a9a9a, leaf2: 0xc8c8c8, bloom: 0xff2e88, bloom2: 0x00e5ff, wall: 0xd9d9d6, roof: 0x0d110f, trim: 0xff2e88, glass: 0xffffff },
  ice: { soil: 0xe2f1fb, soil2: 0xcde6f6, rock: 0xa8dcf5, rockLit: 0xe6f8ff, rockDark: 0x5aa9d6, glow: 0x7cffc4, glowHot: 0xeafff6, leaf: 0x7fbfdf, leaf2: 0xb6e2f5, bloom: 0x7cffc4, bloom2: 0xb59cff, wall: 0xcfe9ff, roof: 0x4fa3d9, trim: 0xffffff, glass: 0x7cffc4 },
  sound: { soil: 0x2e2238, soil2: 0x3a2c47, rock: 0x231626, rockLit: 0x3d2c45, rockDark: 0x120c15, glow: 0xff2e88, glowHot: 0xffd400, leaf: 0x2ec4e6, leaf2: 0xffd400, bloom: 0xff2e88, bloom2: 0x2ec4e6, wall: 0x4a3a5a, roof: 0xff2e88, trim: 0xffd400, glass: 0x2ec4e6 },
  shadow: { soil: 0x2c2442, soil2: 0x352b50, rock: 0x1e1830, rockLit: 0x3a3058, rockDark: 0x120e1d, glow: 0xff3fa4, glowHot: 0xffc2e4, leaf: 0x1d1730, leaf2: 0x2a2244, bloom: 0xff3fa4, bloom2: 0xb84dff, wall: 0x4a3f66, roof: 0x2a2433, trim: 0xff3fa4, glass: 0xffd9a0 },
  time: { soil: 0xd8c8a6, soil2: 0xc9b690, rock: 0xb7a48a, rockLit: 0xd9c9ad, rockDark: 0x7a6a55, glow: 0xffe9b0, glowHot: 0xffffff, leaf: 0x8a8a7a, leaf2: 0xa8a898, bloom: 0xc9a04a, bloom2: 0x6b6b6b, wall: 0xd9c29a, roof: 0x6b4f2a, trim: 0xc9a04a, glass: 0xf7ebd0 },
  light: { soil: 0xfdf2d2, soil2: 0xf6e3ad, rock: 0xfff8e8, rockLit: 0xffffff, rockDark: 0xe2c98a, glow: 0xffd77a, glowHot: 0xffffff, leaf: 0x8fd06a, leaf2: 0xb5e27a, bloom: 0xffffff, bloom2: 0xff9fb4, wall: 0xfff8e1, roof: 0xffd77a, trim: 0xb89558, glass: 0x7fd8ff },
};
export function pal(el: string): Pal {
  return PAL[el] ?? PAL.fire;
}

// ------------------------------------------------------------------ shapes (origin = base, ground level)
/** rounded rock blob (w × h px) with a lit top face and ink */
export function rock(g: Graphics, x: number, y: number, w: number, h: number, col: number, lit = shade(col, 1.25)) {
  g.poly([x - w / 2, y, x - w * 0.46, y - h * 0.55, x - w * 0.22, y - h, x + w * 0.2, y - h * 0.95, x + w * 0.48, y - h * 0.5, x + w / 2, y]).fill(col).stroke(THIN);
  g.poly([x - w * 0.4, y - h * 0.6, x - w * 0.2, y - h * 0.94, x + w * 0.16, y - h * 0.9, x + w * 0.02, y - h * 0.6]).fill(lit);
}
/** an eroded "mushroom" rock pillar: a stem with a wide cap (concept: fire basalt arches) */
export function capRock(g: Graphics, x: number, y: number, w: number, h: number, col: number, dark: number, lit: number) {
  const sw = w * 0.42;
  g.poly([x - sw / 2 - 4, y, x - sw / 2 + 2, y - h * 0.7, x + sw / 2 - 2, y - h * 0.7, x + sw / 2 + 6, y]).fill(dark).stroke(THIN);
  const cy = y - h * 0.78;
  g.ellipse(x, cy + 6, w / 2, h * 0.16).fill(dark).stroke(THIN);
  g.ellipse(x, cy, w / 2, h * 0.15).fill(col).stroke(THIN);
  g.ellipse(x - w * 0.08, cy - h * 0.06, w * 0.34, h * 0.08).fill(lit);
}
/** hexagonal crystal shard */
export function crystal(g: Graphics, x: number, y: number, h: number, w: number, col: number, lean = 0) {
  const t = { x: x + lean, y: y - h };
  g.poly([x - w, y, x - w + lean * 0.7, y - h * 0.72, t.x, t.y, x + w + lean * 0.7, y - h * 0.72, x + w, y]).fill(col).stroke(THIN);
  g.poly([x - w * 0.15, y - 2, x - w * 0.15 + lean * 0.7, y - h * 0.72, t.x, t.y, x + w + lean * 0.7, y - h * 0.72, x + w, y]).fill(shade(col, 0.78));
  g.moveTo(x - w * 0.55, y - h * 0.15).lineTo(x - w * 0.55 + lean * 0.6, y - h * 0.68).stroke({ width: 2, color: 0xffffff, alpha: 0.7, cap: 'round' });
  g.poly([x - w, y, x - w + lean * 0.7, y - h * 0.72, t.x, t.y, x + w + lean * 0.7, y - h * 0.72, x + w, y]).stroke(THIN);
}
/** a cluster of crystals */
export function crystals(g: Graphics, x: number, y: number, s: number, col: number, r: () => number) {
  crystal(g, x - 10 * s, y + 2, 26 * s, 6 * s, shade(col, 0.9), -6 * s);
  crystal(g, x + 11 * s, y + 3, 22 * s, 5.5 * s, shade(col, 1.05), 6 * s);
  crystal(g, x, y + 5, 40 * s * (0.85 + r() * 0.3), 8 * s, col, (r() - 0.5) * 6 * s);
}
/** gothic spire (cathedral) */
export function spire(g: Graphics, x: number, y: number, h: number, w: number, col: number, trim: number, roof: number) {
  g.rect(x - w / 2, y - h * 0.62, w, h * 0.62).fill(col).stroke(THIN);
  g.rect(x - w / 2, y - h * 0.62, w * 0.3, h * 0.62).fill(shade(col, 0.88));
  // pointed window
  const wx = x;
  const wy = y - h * 0.3;
  g.moveTo(wx - w * 0.2, wy + h * 0.12).lineTo(wx - w * 0.2, wy - h * 0.04).quadraticCurveTo(wx, wy - h * 0.16, wx + w * 0.2, wy - h * 0.04).lineTo(wx + w * 0.2, wy + h * 0.12).closePath().fill(trim).stroke(HAIR);
  g.poly([x - w / 2 - 3, y - h * 0.62, x, y - h, x + w / 2 + 3, y - h * 0.62]).fill(roof).stroke(THIN);
  g.poly([x, y - h, x + w / 2 + 3, y - h * 0.62, x + w * 0.1, y - h * 0.62]).fill(shade(roof, 0.82));
  g.circle(x, y - h - 3, 3).fill(trim).stroke(HAIR);
}
/** bushy tree: trunk + branches + an irregular dome of leaf puffs (shaded underside, lit top) */
export function tree(g: Graphics, x: number, y: number, h: number, trunk: number, leaf: number, leaf2: number, r: () => number) {
  const tw = Math.max(6, h * 0.08);
  g.poly([x - tw * 1.3, y, x - tw * 0.55, y - h * 0.5, x + tw * 0.55, y - h * 0.5, x + tw * 1.3, y]).fill(trunk).stroke(THIN);
  g.poly([x + tw * 0.1, y, x + tw * 0.2, y - h * 0.5, x + tw * 0.55, y - h * 0.5, x + tw * 1.3, y]).fill(shade(trunk, 0.78));
  g.moveTo(x, y - h * 0.38).lineTo(x - h * 0.2, y - h * 0.6).moveTo(x, y - h * 0.46).lineTo(x + h * 0.18, y - h * 0.64).stroke({ width: Math.max(3, tw * 0.7), color: trunk, cap: 'round' });
  const cx = x;
  const cy = y - h * 0.7;
  const R = h * 0.34;
  // underside (darker), then the dome of puffs, then lit puffs
  g.ellipse(cx, cy + R * 0.25, R * 1.05, R * 0.5).fill(shade(leaf, 0.72)).stroke(THIN);
  const puffs: [number, number, number][] = [];
  for (let k = 0; k < 9; k++) {
    const a = Math.PI + (k / 8) * Math.PI;
    puffs.push([Math.cos(a) * R * 0.78, Math.sin(a) * R * 0.62 + R * 0.12, R * (0.42 + r() * 0.12)]);
  }
  puffs.push([0, -R * 0.15, R * 0.6], [-R * 0.35, R * 0.05, R * 0.45], [R * 0.38, R * 0.08, R * 0.45]);
  for (const [px, py, pr] of puffs) g.circle(cx + px, cy + py, pr).fill(leaf).stroke(THIN);
  for (const [px, py, pr] of puffs) g.circle(cx + px, cy + py, pr * 0.92).fill(leaf);
  for (let k = 0; k < 5; k++) g.circle(cx - R * 0.45 + k * R * 0.2, cy - R * 0.5 + Math.abs(k - 2) * R * 0.12, R * 0.16).fill(leaf2);
  g.circle(cx - R * 0.2, cy - R * 0.2, R * 0.2).fill({ color: leaf2, alpha: 0.7 });
}
/** eroded rock pillar (irregular, lit left face, strata) */
export function pillar(g: Graphics, x: number, y: number, w: number, h: number, col: number, dark: number, lit: number) {
  const pts = [x - w * 0.6, y, x - w * 0.42, y - h * 0.25, x - w * 0.55, y - h * 0.5, x - w * 0.4, y - h * 0.78, x - w * 0.5, y - h, x + w * 0.45, y - h, x + w * 0.38, y - h * 0.7, x + w * 0.52, y - h * 0.45, x + w * 0.42, y - h * 0.2, x + w * 0.62, y];
  g.poly(pts).fill(col).stroke(INK);
  g.poly([x + w * 0.05, y, x + w * 0.1, y - h, x + w * 0.45, y - h, x + w * 0.38, y - h * 0.7, x + w * 0.52, y - h * 0.45, x + w * 0.42, y - h * 0.2, x + w * 0.62, y]).fill(dark);
  g.poly([x - w * 0.42, y - h * 0.3, x - w * 0.5, y - h * 0.5, x - w * 0.36, y - h * 0.76, x - w * 0.2, y - h * 0.7, x - w * 0.25, y - h * 0.35]).fill(lit);
  for (let k = 1; k < 5; k++) g.moveTo(x - w * 0.45, y - (h * k) / 5).lineTo(x + w * 0.4, y - (h * k) / 5 + 3).stroke({ width: 1.5, color: C.ink, alpha: 0.35 });
}
/** a frond fan (ferns: shadow neon, water jungle, nature) */
export function fern(g: Graphics, x: number, y: number, s: number, col: number, edge?: number) {
  for (let k = -3; k <= 3; k++) {
    const a = -Math.PI / 2 + k * 0.32;
    const len = (22 + (3 - Math.abs(k)) * 6) * s;
    const ex = x + Math.cos(a) * len;
    const ey = y + Math.sin(a) * len * 0.9;
    const mx = x + Math.cos(a) * len * 0.5 + k * 3 * s;
    g.moveTo(x, y).quadraticCurveTo(mx, (y + ey) / 2 - 6 * s, ex, ey).stroke({ width: 5 * s + 2, color: C.ink, cap: 'round' });
    g.moveTo(x, y).quadraticCurveTo(mx, (y + ey) / 2 - 6 * s, ex, ey).stroke({ width: 5 * s, color: col, cap: 'round' });
    if (edge !== undefined) g.moveTo(x, y).quadraticCurveTo(mx, (y + ey) / 2 - 6 * s, ex, ey).stroke({ width: 1.6 * s, color: edge, cap: 'round' });
  }
}
/** grass tuft */
export function tuft(g: Graphics, x: number, y: number, s: number, col: number) {
  for (let k = -1; k <= 1; k++) g.moveTo(x + k * 3 * s, y).lineTo(x + k * 6 * s, y - (9 - Math.abs(k) * 2) * s);
  g.stroke({ width: 2.4 * s, color: col, cap: 'round' });
}
/** small 5-petal flower */
export function flower(g: Graphics, x: number, y: number, s: number, col: number, core = 0xffd84a) {
  g.moveTo(x, y + 6 * s).lineTo(x, y).stroke({ width: 1.5, color: 0x3f7a3a });
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    g.circle(x + Math.cos(a) * 3.2 * s, y + Math.sin(a) * 2.6 * s, 2.4 * s).fill(col);
  }
  g.circle(x, y, 1.6 * s).fill(core);
}
/** a standing stone with a glowing rune (magic circle) */
export function standingStone(g: Graphics, x: number, y: number, w: number, h: number, col: number, rune: number) {
  g.ellipse(x, y, w * 0.7, w * 0.25).fill({ color: C.ink, alpha: 0.2 });
  g.moveTo(x - w / 2, y).quadraticCurveTo(x - w * 0.6, y - h * 0.7, x - w * 0.15, y - h).quadraticCurveTo(x + w * 0.35, y - h * 1.02, x + w / 2, y - h * 0.6).lineTo(x + w / 2, y).closePath().fill(col).stroke(THIN);
  g.moveTo(x + w * 0.18, y).quadraticCurveTo(x + w * 0.3, y - h * 0.5, x + w * 0.2, y - h * 0.9).lineTo(x + w / 2, y - h * 0.6).lineTo(x + w / 2, y).closePath().fill(shade(col, 0.8));
  // rune: triangle-in-circle (concept)
  const ry = y - h * 0.52;
  const rr = w * 0.22;
  g.circle(x - w * 0.06, ry, rr).stroke({ width: 2, color: rune });
  g.poly([x - w * 0.06, ry - rr * 0.7, x - w * 0.06 + rr * 0.62, ry + rr * 0.42, x - w * 0.06 - rr * 0.62, ry + rr * 0.42]).stroke({ width: 1.8, color: rune });
}
/** a candle (flame drawn by the caller's animated layer) */
export function candle(g: Graphics, x: number, y: number, s: number) {
  g.rect(x - 3 * s, y - 12 * s, 6 * s, 12 * s).fill(0xfff1d6).stroke(HAIR);
  g.ellipse(x, y - 12 * s, 3 * s, 1.2 * s).fill(0xffe2b0);
}
/** tall slab monolith with facets (ice) */
export function monolith(g: Graphics, x: number, y: number, w: number, h: number, col: number, lit: number, dark: number, lean = 0) {
  const tl = { x: x - w * 0.5 + lean, y: y - h * 0.86 };
  const tp = { x: x - w * 0.1 + lean * 1.2, y: y - h };
  const tr = { x: x + w * 0.5 + lean, y: y - h * 0.8 };
  g.poly([x - w * 0.55, y, tl.x, tl.y, tp.x, tp.y, tr.x, tr.y, x + w * 0.55, y]).fill({ color: col, alpha: 0.92 }).stroke(INK);
  g.poly([x + w * 0.05, y, tp.x + 2, tp.y + 6, tr.x, tr.y, x + w * 0.55, y]).fill({ color: dark, alpha: 0.55 });
  g.poly([tl.x + 4, tl.y + 8, tp.x, tp.y + 6, x - w * 0.08, y - h * 0.4, x - w * 0.36, y - h * 0.3]).fill({ color: lit, alpha: 0.75 });
  g.moveTo(x - w * 0.3, y - h * 0.12).lineTo(x - w * 0.2 + lean * 0.5, y - h * 0.62).stroke({ width: 2, color: 0xffffff, alpha: 0.85, cap: 'round' });
}
/** icicles hanging under an edge from a to b */
export function icicles(g: Graphics, a: Pt, b: Pt, n: number, len: number, col: number) {
  for (let k = 0; k < n; k++) {
    const f = (k + 0.5) / n;
    const x = lerp(a.x, b.x, f);
    const y = lerp(a.y, b.y, f);
    const l = len * (0.5 + ((k * 37) % 10) / 20);
    g.poly([x - 3, y, x + 3, y, x, y + l]).fill(col).stroke(HAIR);
  }
}
export { shade, mixColor };
