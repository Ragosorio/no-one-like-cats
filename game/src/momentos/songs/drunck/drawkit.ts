/**
 * «DRUNCK» — the small drawing kit the scenes share (scenes.ts, scenes2.ts, scenes3.ts): types, easing, flat TV
 * backdrops and bands, cached text, world → screen, the ACTING helper (puppets that perform: pose layers + squash and
 * stretch on the beat, a pure function of momento time) and Canelo's TV paw (the arm the rig doesn't have).
 */
import { Graphics, Sprite, type Container, type TextStyleOptions } from 'pixi.js';
import type { Kit } from '../../anime/kit';
import type { Actor } from '../../anime/actor';
import type { DrunckStage } from './stage';
import { LW, TV } from './tv';
import { G } from '../../../state/game';

export interface Scn {
  root: Container;
  update(k: Kit, m: number, lt: number): void;
  late?(k: Kit, m: number): void;
  anchor?(name: string, k: Kit): [number, number] | null;
  /**
   * A bar object as a quad on screen [x0,y0, x1,y1, x2,y2, x3,y3] (clockwise from top-left): the doorway a memory comes
   * out of and goes back into (THE BAR IS THE STAGE OF MEMORY, docs/part-iii/13 §3.3).
   */
  portal?(obj: string, k: Kit): number[] | null;
  /** the color of that object's rim while it opens (the mug's glass, the paper's edge, the neon tube…) */
  rim?(obj: string): number;
  prewarm?(k: Kit): void;
  destroy?(): void;
  /**
   * ON TWOS: the stage calls update() only when k.beatStep(m) changes (12 drawings a second, the first of each beat
   * exactly on it) — the house style of the cartoon, and a fraction of the geometry rebuilt per second (no GC hitches).
   */
  twos?: boolean;
}
export type Make = (st: DrunckStage, k: Kit) => Scn;

// ------------------------------------------------------------------ helpers shared by the three files
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const easeOut = (x: number) => 1 - (1 - clamp01(x)) ** 3;
export const easeIn = (x: number) => clamp01(x) ** 3;
export const easeInOut = (x: number) => {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
};
/** overshoot then settle (cartoon arrival) */
export const easeOutBack = (x: number, s = 1.70158) => {
  const t = clamp01(x) - 1;
  return 1 + (s + 1) * t * t * t + s * t * t;
};
/** 0 → 1 → 0 */
export const bell = (x: number) => Math.sin(clamp01(x) * Math.PI);
/** progress of m through the window [a, b] (0 before, 1 after) */
export const win = (m: number, a: number, b: number) => clamp01((m - a) / (b - a));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export function mix(a: number, b: number, k: number) {
  const r = Math.round(lerp((a >> 16) & 255, (b >> 16) & 255, k));
  const g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, k));
  const bb = Math.round(lerp(a & 255, b & 255, k));
  return (r << 16) | (g << 8) | bb;
}
/** a backdrop wider than any screen and any camera move */
export function backdrop(g: Graphics, color: number) {
  g.rect(-1600, -1000, 1920 + 3200, 1080 + 2000).fill(color);
}
/** horizontal flat bands (a TV / cel sky: hard edges, never a gradient) */
export function bands(g: Graphics, colors: number[], y0: number, y1: number) {
  const h = (y1 - y0) / colors.length;
  colors.forEach((c, i) => g.rect(-1600, y0 + i * h, 5120, h + 1).fill(c));
}
/** a text sprite from the Momento's cache (built before the clock) */
export function txt(k: Kit, text: string, style: TextStyleOptions, ax = 0.5, ay = 0.5): Sprite {
  const s = new Sprite(k.text.get(text, style));
  s.anchor.set(ax, ay);
  return s;
}
/** a world point → the screen (for prompts and balloons) */
export function scr(k: Kit, x: number, y: number): [number, number] {
  return k.cam.toScreen(x, y);
}
/** the head of an actor in world space (through its parents up to the scene root: `root` = the scene's root) */
export function headOf(a: Actor | null, fallback: [number, number]): [number, number] {
  if (!a) return fallback;
  const [hx, hy] = a.head();
  // (through the actor's own rotation: a cat lying down has his head to one side)
  const dx = hx * a.scale.x;
  const dy = hy * a.scale.y;
  const c = Math.cos(a.rotation);
  const s = Math.sin(a.rotation);
  return [a.x + dx * c - dy * s, a.y + dx * s + dy * c];
}
/** the cartoon pose: on twos, restarting on the beat; squash on the kick (rubber hose) */
export function bob(st: DrunckStage, k: Kit, a: Actor | null, m: number, x: number, y: number, o: { flip?: boolean; rot?: number; sx?: number; sy?: number; alpha?: number; amp?: number } = {}) {
  if (!a) return;
  const e = st.bounce(k, m) * (o.amp ?? 1);
  a.pose(m, x, y - e * 14, { flip: o.flip, rot: o.rot ?? 0, sx: (o.sx ?? 1) * (1 + e * 0.04), sy: (o.sy ?? 1) * (1 - e * 0.05), alpha: o.alpha, step: k.beatStep(m) });
}

/** what a performer does this frame: where, how squashed, and the rig's pose layer (lean, crouch, head, look) */
export interface Perf {
  x: number;
  y: number;
  flip?: boolean;
  rot?: number;
  sx?: number;
  sy?: number;
  alpha?: number;
  /** the rig's pose layer (art/puppetCore: lean −1..1, crouch 0..1, head tilt rad, head drop px, look −1..1) */
  lean?: number;
  crouch?: number;
  headA?: number;
  headDy?: number;
  look?: number;
  /** the kick bounce multiplier (0 = still) */
  amp?: number;
}
/**
 * ACTING: the puppet performs — its rig's pose layer is written every frame (a pure function of momento time, so it
 * scrubs), and the body squashes on the kick. Key poses snap on the beat (Actor.pose steps on k.beatStep).
 */
export function perform(st: DrunckStage, k: Kit, a: Actor | null, m: number, o: Perf) {
  if (!a) return;
  const e = st.bounce(k, m) * (o.amp ?? 1);
  const p = a.puppet?.pose;
  if (p) {
    p.lean = o.lean ?? 0;
    p.crouch = (o.crouch ?? 0) + e * 0.3;
    p.headA = o.headA ?? 0;
    p.headDy = o.headDy ?? 0;
    p.look = o.look ?? 0;
  }
  a.pose(m, o.x, o.y - e * 12, { flip: o.flip, rot: o.rot ?? 0, sx: (o.sx ?? 1) * (1 + e * 0.04), sy: (o.sy ?? 1) * (1 - e * 0.05), alpha: o.alpha, step: k.beatStep(m) });
}
/**
 * A key-pose track: [time, pose][] → the pose at m (each key SNAPS in over `snap` s with an overshoot: anticipation
 * and follow-through come from the keys themselves). Poses are partial Perf (numbers only).
 */
export type Keyed = Partial<Record<'x' | 'y' | 'rot' | 'sx' | 'sy' | 'lean' | 'crouch' | 'headA' | 'headDy' | 'look', number>>;
export function keyed(track: [number, Keyed][], m: number, snap = 0.12): Keyed {
  let i = -1;
  for (let j = 0; j < track.length; j++) if (track[j][0] <= m + 1e-6) i = j;
  if (i < 0) return { ...(track[0]?.[1] ?? {}) };
  const cur = track[i][1];
  if (i === 0) return { ...cur };
  const prev = track[i - 1][1];
  const q = easeOutBack((m - track[i][0]) / snap, 1.4);
  const out: Keyed = {};
  for (const key of new Set([...Object.keys(prev), ...Object.keys(cur)]) as Set<keyof Keyed>) {
    const a = prev[key] ?? (key === 'sx' || key === 'sy' ? 1 : 0);
    const b = cur[key] ?? (key === 'sx' || key === 'sy' ? 1 : 0);
    out[key] = a + (b - a) * q;
  }
  return out;
}

/** a paper card with the TV line and one hard shadow */
export function card(g: Graphics, x: number, y: number, w: number, h: number, fill: number, r = 14, line: number = TV.line) {
  g.roundRect(x + 12, y + 12, w, h, r).fill({ color: line, alpha: 0.85 });
  g.roundRect(x, y, w, h, r).fill(fill).stroke({ width: LW, color: line });
}
/** stars (TV: little four-point twinkles) */
export function twinkle(g: Graphics, x: number, y: number, r: number, color: number, alpha = 1) {
  g.poly([x, y - r, x + r * 0.28, y - r * 0.28, x + r, y, x + r * 0.28, y + r * 0.28, x, y + r, x - r * 0.28, y + r * 0.28, x - r, y, x - r * 0.28, y - r * 0.28]).fill({ color, alpha });
}
/** a soft round glow (stacked discs: no blur filter, no per-frame texture) */
export function glow(g: Graphics, x: number, y: number, r: number, color: number, alpha = 0.3, rings = 5) {
  for (let i = 0; i < rings; i++) g.circle(x, y, r * (1 - i / rings)).fill({ color, alpha: alpha / rings });
}

// ------------------------------------------------------------------ Canelo's TV paw
/** Canelo's fur in the Borracha's TV colors (ginger tabby: flat base, one hard shadow, cream mitt) */
export const FUR = { base: 0xe8873a, dark: 0xb05a24, light: 0xffe3b8, pad: 0xff9fb6, stripe: 0x9c4a1c };
/** a white glove of a Corrector (the white city) and a calico paw (Doña Espuma's) */
export const FUR_WHITE = { base: 0xf6f7fb, dark: 0xc9d3e6, light: 0xffffff, pad: 0xd6dbe6, stripe: 0xe6eaf2 };
export type PawKind = 'mitt' | 'point' | 'claws' | 'stamp' | 'hush';
/**
 * An arm from the shoulder (ax, ay) to the paw (bx, by), w = its width: a TV cartoon tube (uniform line, two tones,
 * tabby stripes) ending in a paw: a mitt with beans, a pointing claw, `n` raised claws (counting), a rubber stamp
 * (¡VISTO! / MENTIRA), or the «shh» paw.
 */
export function tvArm(g: Graphics, ax: number, ay: number, bx: number, by: number, w: number, kind: PawKind = 'mitt', n = 3, stampColor: number = 0xb0302a, bend = 0, fur: typeof FUR = FUR) {
  const FURc = fur;
  // the centerline: a quadratic curve (bend = how far its middle sags along the normal: a rubber-hose arm)
  const dx = bx - ax;
  const dy = by - ay;
  const L0 = Math.hypot(dx, dy) || 1;
  const cx0 = (ax + bx) / 2 + (-dy / L0) * bend;
  const cy0 = (ay + by) / 2 + (dx / L0) * bend;
  const N = 10;
  const P: [number, number, number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * cx0 + t * t * bx;
    const y = (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * cy0 + t * t * by;
    const tx = 2 * (1 - t) * (cx0 - ax) + 2 * t * (bx - cx0);
    const ty = 2 * (1 - t) * (cy0 - ay) + 2 * t * (by - cy0);
    const tl = Math.hypot(tx, ty) || 1;
    P.push([x, y, -ty / tl, tx / tl]);
  }
  const side = (s: number, sc: number) => {
    const pts: number[] = [];
    P.forEach(([x, y, nx2, ny2], i) => {
      const ww = w * (1 - 0.25 * (i / N)) * sc;
      pts.push(x + nx2 * ww * s, y + ny2 * ww * s);
    });
    return pts;
  };
  const tube = (sc: number) => {
    const l = side(1, sc);
    const r = side(-1, sc);
    const out = [...l];
    for (let i = r.length - 2; i >= 0; i -= 2) out.push(r[i], r[i + 1]);
    return out;
  };
  g.poly(tube(0.5)).fill(FURc.base).stroke({ width: LW, color: TV.line, join: 'round' });
  // the one hard shadow (underside) and the tabby stripes
  const under = side(-1, 0.5);
  const mid = side(-1, 0.12);
  const sh = [...mid];
  for (let i = under.length - 2; i >= 0; i -= 2) sh.push(under[i], under[i + 1]);
  g.poly(sh).fill(FURc.dark);
  for (let i = 1; i < N; i += 2) {
    const [x, y, nx2, ny2] = P[i];
    const [x2, y2] = P[i + 1];
    const ww = w * 0.5 * (1 - 0.25 * (i / N));
    g.moveTo(x + nx2 * ww, y + ny2 * ww)
      .lineTo(x + (x2 - x) * 0.4 + nx2 * ww * 0.1, y + (y2 - y) * 0.4 + ny2 * ww * 0.1)
      .stroke({ width: Math.max(4, w * 0.13), color: FURc.stripe, cap: 'round' });
  }
  // the paw points along the curve's end tangent
  const ux = P[N][3];
  const uy = -P[N][2];
  const nx = -uy;
  const ny = ux;
  const r = w * 0.62;
  const px = bx + ux * r * 0.35;
  const py = by + uy * r * 0.35;
  if (kind === 'stamp') {
    // a rubber stamp held in the paw: wooden handle, red pad toward the page
    g.roundRect(px - r * 0.35, py - r * 1.6, r * 0.7, r * 1.4, r * 0.2).fill(0x8a5a30).stroke({ width: LW, color: TV.line });
    g.roundRect(px - r * 1.1, py - r * 0.25, r * 2.2, r * 0.6, 6).fill(0x4a3020).stroke({ width: LW, color: TV.line });
    g.rect(px - r * 1.0, py + r * 0.32, r * 2.0, r * 0.18).fill(stampColor);
  }
  g.circle(px, py, r).fill(FURc.light).stroke({ width: LW, color: TV.line });
  if (kind === 'mitt' || kind === 'hush') {
    for (let i = -1; i <= 1; i++) g.circle(px + ux * r * 0.5 + nx * i * r * 0.42, py + uy * r * 0.5 + ny * i * r * 0.42, r * 0.17).fill(FURc.pad);
    g.circle(px - ux * r * 0.05, py - uy * r * 0.05, r * 0.3).fill(FURc.pad);
  } else if (kind === 'point') {
    // one claw out: a long finger and a white claw
    const fx = px + ux * r * 1.6;
    const fy = py + uy * r * 1.6;
    g.moveTo(px + ux * r * 0.6, py + uy * r * 0.6).lineTo(fx, fy).stroke({ width: r * 0.55, color: TV.line, cap: 'round' });
    g.moveTo(px + ux * r * 0.6, py + uy * r * 0.6).lineTo(fx, fy).stroke({ width: r * 0.55 - LW * 2, color: FURc.light, cap: 'round' });
    g.poly([fx + nx * r * 0.14, fy + ny * r * 0.14, fx + ux * r * 0.55, fy + uy * r * 0.55, fx - nx * r * 0.14, fy - ny * r * 0.14]).fill(TV.white).stroke({ width: 3, color: TV.line });
  } else if (kind === 'claws') {
    // n claws raised (counting): fanned
    for (let i = 0; i < n; i++) {
      const a = (i - (n - 1) / 2) * 0.38;
      const cx = Math.cos(a) * ux - Math.sin(a) * uy;
      const cy = Math.sin(a) * ux + Math.cos(a) * uy;
      const fx = px + cx * r * 1.45;
      const fy = py + cy * r * 1.45;
      g.moveTo(px + cx * r * 0.5, py + cy * r * 0.5).lineTo(fx, fy).stroke({ width: r * 0.42, color: TV.line, cap: 'round' });
      g.moveTo(px + cx * r * 0.5, py + cy * r * 0.5).lineTo(fx, fy).stroke({ width: r * 0.42 - LW * 2, color: FURc.light, cap: 'round' });
      g.poly([fx - cy * r * 0.1, fy + cx * r * 0.1, fx + cx * r * 0.42, fy + cy * r * 0.42, fx + cy * r * 0.1, fy - cx * r * 0.1]).fill(TV.white).stroke({ width: 3, color: TV.line });
    }
  }
}

/** a jagged paper tear (for torn photos / torn shadows) from (x0, y0) to (x1, y1) */
export function tearLine(x0: number, y0: number, x1: number, y1: number, n: number, jag: number, seed: number): number[] {
  const pts: number[] = [];
  const dx = x1 - x0;
  const dy = y1 - y0;
  const L = Math.hypot(dx, dy) || 1;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const off = i === 0 || i === n ? 0 : (rnd(seed + i) - 0.5) * jag * 2;
    pts.push(x0 + dx * t + (-dy / L) * off, y0 + dy * t + (dx / L) * off);
  }
  return pts;
}

// ------------------------------------------------------------------ sumi-e
const INK = { dark: 0x15131c, mid: 0x3a3640, wash: 0x8a8690 };
/**
 * A SUMI-E brush stroke along a cubic curve (a→b with handles c1, c2), drawn up to `grow` (0..1) of its length: a wide
 * pale wash under it, the stroke with pressure (thick in the belly, tapered ends) and a ragged edge, a dry-brush tail
 * of separate hairs, and a wet sheen along its top. `seed` keeps the raggedness fixed (it boils only if the caller
 * changes it).
 */
export function inkStroke(g: Graphics, a: [number, number], c1: [number, number], c2: [number, number], b: [number, number], W: number, grow: number, seed: number) {
  if (grow <= 0.01) return;
  const N = 16;
  const P: [number, number, number, number][] = [];
  const at = (t: number): [number, number] => {
    const u = 1 - t;
    return [u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0], u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1]];
  };
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * grow;
    const [x, y] = at(t);
    const [x2, y2] = at(Math.min(1, t + 0.01));
    const dx = x2 - x;
    const dy = y2 - y;
    const L = Math.hypot(dx, dy) || 1;
    P.push([x, y, -dy / L, dx / L]);
  }
  const width = (i: number) => {
    const t = i / N;
    return W * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.92 + 0.04)), 0.55) * (1 - 0.35 * t);
  };
  const outline = (sc: number, rag: number) => {
    const l: number[] = [];
    const r: number[] = [];
    P.forEach(([x, y, nx, ny], i) => {
      const w = width(i) * sc;
      const j1 = 1 + (rnd(seed + i * 3) - 0.5) * rag;
      const j2 = 1 + (rnd(seed + i * 5 + 1) - 0.5) * rag;
      l.push(x + nx * w * j1, y + ny * w * j1);
      r.push(x - nx * w * j2, y - ny * w * j2);
    });
    const out = [...l];
    for (let i = r.length - 2; i >= 0; i -= 2) out.push(r[i], r[i + 1]);
    return out;
  };
  // the wash (value variation: pale and wide), the body, the dark core
  g.poly(outline(1.9, 0.5)).fill({ color: INK.wash, alpha: 0.22 });
  g.poly(outline(1.15, 0.45)).fill({ color: INK.mid, alpha: 0.6 });
  g.poly(outline(0.85, 0.3)).fill({ color: INK.dark, alpha: 0.92 });
  // the dry-brush tail: separate hairs where the brush ran out
  for (let h = 0; h < 5; h++) {
    const off = (h / 4 - 0.5) * 1.4;
    const pts: number[] = [];
    for (let i = Math.floor(N * 0.65); i <= N; i++) {
      const [x, y, nx, ny] = P[i];
      if (rnd(seed + h * 17 + i) < 0.25) continue;
      pts.push(x + nx * width(i) * off, y + ny * width(i) * off);
    }
    if (pts.length >= 4) g.poly(pts, false).stroke({ width: Math.max(1.5, W * 0.08), color: INK.dark, alpha: 0.7, cap: 'round' });
  }
  // the wet sheen along the top of the belly
  const sheen: number[] = [];
  for (let i = Math.floor(N * 0.15); i <= Math.floor(N * 0.6); i++) {
    const [x, y, nx, ny] = P[i];
    sheen.push(x + nx * width(i) * 0.45, y + ny * width(i) * 0.45);
  }
  if (sheen.length >= 4) g.poly(sheen, false).stroke({ width: Math.max(2, W * 0.1), color: 0xffffff, alpha: 0.28, cap: 'round' });
}
/** an ink drop with a tail (splatter), pointing along (dx, dy) */
export function inkDrop(g: Graphics, x: number, y: number, r: number, dx: number, dy: number) {
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L;
  const uy = dy / L;
  g.poly([x - uy * r * 0.7, y + ux * r * 0.7, x - ux * r * 3, y - uy * r * 3, x + uy * r * 0.7, y - ux * r * 0.7]).fill({ color: INK.dark, alpha: 0.85 });
  g.circle(x, y, r).fill({ color: INK.dark, alpha: 0.95 });
  g.circle(x - r * 0.3, y - r * 0.35, r * 0.28).fill({ color: 0xffffff, alpha: 0.3 });
}

/** H64's choice (mentira:*), cosmetic: the Capi's thought bubble in c42–43 */
export function capiPick(): 'perfecto' | 'romper' | 'nada' | null {
  const f = (G.s?.flags ?? {}) as Record<string, unknown>;
  for (const k of ['perfecto', 'romper', 'nada'] as const) if (f[`mentira:${k}`]) return k;
  return null;
}
