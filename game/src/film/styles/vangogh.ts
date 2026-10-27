/**
 * VAN GOGH — the kit: paintings made of BRUSH STROKES that follow a flow field, baked once at load.
 *
 *  - brushes: 4 bristle stamps (tapered, streaked, a lit ridge on top and a shadow under it = impasto relief),
 *    baked by a shader into one atlas ('vangogh:strokes').
 *  - paintField(): thousands of stamps laid along a flow field (swirls, wind, contours) in jittered order, each
 *    tinted by a colour function — rendered in chunks into ONE texture (zero per-frame cost). Call it n times with
 *    different seeds for the BOIL: the stage cycles the variants at ~8 fps like hand-painted frames (off with
 *    «Reducir movimiento»).
 *  - halo(): concentric rings of strokes (the stars and the moon of «La noche estrellada», 1889) — a sprite you
 *    rotate slowly: the sky turns without any shader.
 *  - flows: swirl / wind / contour helpers to compose a field.
 *
 * References (public domain): «La noche estrellada» (1889, MoMA), «Noche estrellada sobre el Ródano» (1888, Orsay),
 * «Campo de trigo con cipreses» (1889), «Terraza de café por la noche» (1888).
 */
import { Container, Graphics, Rectangle, Sprite, Texture, type RenderTexture } from 'pixi.js';
import type { Baker } from '../bake';
import { BAKE_UV } from '../bake';
import type { StylePrep } from './index';

export const VG = {
  ultramarine: 0x1b2a7a,
  prussian: 0x0f1d4a,
  cobalt: 0x2f55b8,
  cerulean: 0x5d8fd8,
  pale: 0xa9c6ee,
  white: 0xeef2e2,
  chrome: 0xf4c430,
  lemon: 0xf8e27a,
  orange: 0xe8902a,
  viridian: 0x1f4a3a,
  olive: 0x4c5a2a,
  black: 0x0b1020,
  ochre: 0xc8923a,
};

let brushCache: { atlas: Texture; frames: Texture[] } | null = null;

/** the bristle atlas: 4 stamps of 128×32 (tapered, streaked, impasto ridge) */
export function bakeBrushes(b: Baker): Texture[] {
  const atlas = b.shade(
    'vg-brush',
    128,
    128,
    `${BAKE_UV}
void main() {
  vec2 uv = bakeUV();
  float row = floor(uv.y * 4.0);
  vec2 q = vec2(uv.x, fract(uv.y * 4.0));
  // tapered both ends: the brush lands round and lifts thin (a little thicker in the first third)
  float x = q.x;
  float wdt = 0.46 * pow(sin(3.14159 * clamp(x * 0.94 + 0.03, 0.0, 1.0)), 0.5) * (1.0 - 0.38 * x * (0.6 + row * 0.15));
  float y = abs(q.y - 0.5);
  float shape = 1.0 - smoothstep(wdt - 0.05, wdt, y);
  // bristles: streaks along the stroke, some run dry at the tail
  float br = vnoise(vec2(x * 3.0 + row * 7.0, q.y * 34.0 + row * 3.0));
  float dry = smoothstep(0.35 + 0.5 * x, 0.9, br + (1.0 - x) * 0.6);
  float a = shape * mix(1.0, dry, 0.55 + 0.25 * x);
  // impasto relief: lit ridge on the upper edge, shadow under it, streak shading
  float v = (q.y - 0.5) / max(wdt, 0.01);
  float light = 1.0 + 0.32 * smoothstep(0.1, -0.85, v) - 0.28 * smoothstep(0.2, 0.95, v);
  light *= 0.86 + 0.28 * br;
  finalColor = vec4(vec3(clamp(light, 0.0, 1.4) / 1.4) * a, a);
}`,
    {},
    {},
    { res: 2 },
  );
  const frames = [0, 1, 2, 3].map((i) => new Texture({ source: atlas.source, frame: new Rectangle(0, i * 32, 128, 32) }));
  brushCache = { atlas, frames };
  return frames;
}
export const brushes = () => brushCache?.frames ?? [];

export function prepVanGogh(p: StylePrep) {
  p.baker.add('vangogh:strokes', 'pinceles de cerda', () => {
    p.tex.set('vg:brushes', bakeBrushes(p.baker)[0]);
  });
  p.baker.add('vangogh:canvas', 'lienzo', () => undefined);
}

// ------------------------------------------------------------------ flow fields
export type Flow = (x: number, y: number) => number;
/** a vortex: tangential flow around (cx, cy) inside radius r (counter-clockwise for s > 0) blended with `base` */
export function swirl(base: Flow, vortices: { x: number; y: number; r: number; s?: number }[]): Flow {
  return (x, y) => {
    let a = base(x, y);
    let bx = Math.cos(a);
    let by = Math.sin(a);
    for (const v of vortices) {
      const dx = x - v.x;
      const dy = y - v.y;
      const d = Math.hypot(dx, dy);
      if (d > v.r * 1.6) continue;
      const w = Math.exp(-((d / v.r) ** 2) * 1.2) * Math.abs(v.s ?? 1);
      const sgn = (v.s ?? 1) >= 0 ? 1 : -1;
      // tangent + a slight inward spiral
      const tx = (-dy / (d || 1)) * sgn - (dx / (d || 1)) * 0.18;
      const ty = (dx / (d || 1)) * sgn - (dy / (d || 1)) * 0.18;
      bx = bx * (1 - w) + tx * w;
      by = by * (1 - w) + ty * w;
    }
    return Math.atan2(by, bx);
  };
}
/** a gently waving horizontal wind */
export const wind = (amp = 0.35, freq = 0.004, seed = 0): Flow => (x, y) => Math.sin(x * freq + seed) * amp * Math.cos(y * freq * 0.7 + seed * 2) + Math.sin(y * 0.011 + seed) * 0.12;
/** along a curve y = f(x) (hills, waves): the slope of f */
export const contour = (f: (x: number) => number): Flow => (x) => Math.atan2(f(x + 2) - f(x - 2), 4);

// ------------------------------------------------------------------ painting
export interface FieldOpts {
  w: number;
  h: number;
  flow: Flow;
  /** stroke colour at (x, y); r = a per-stroke random 0..1 */
  color: (x: number, y: number, r: number) => number;
  /** strokes per 10 000 px² (default 7) */
  density?: number;
  len?: [number, number];
  width?: [number, number];
  /** only paint where this is true (a shape) */
  inside?: (x: number, y: number) => boolean;
  /** an underpainting colour (fills the canvas first) */
  under?: number | ((y: number) => number);
  seed?: number;
  /** follow the flow for this many stamps per stroke (curved strokes) */
  segs?: number;
  res?: number;
  /** a first COAT inside the shape (wide strokes, same colours) so the ground never shows between strokes */
  coat?: { density: number; width: [number, number]; len: [number, number] };
}
/** mix two colours */
export function mixHex(a: number, b: number, k: number) {
  const ch = (s: number) => Math.round((((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k)) << s;
  return ch(16) | ch(8) | ch(0);
}
/** a smooth gradient through colour stops (t 0..1) */
export const gradient = (stops: number[]) => (t: number) => {
  const x = Math.max(0, Math.min(0.9999, t)) * (stops.length - 1);
  const i = Math.floor(x);
  return mixHex(stops[i], stops[Math.min(stops.length - 1, i + 1)], x - i);
};
function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}
/** lay strokes along the field into one texture (chunked: never more than ~2500 sprites alive) */
export function paintField(b: Baker, o: FieldOpts): RenderTexture {
  const br = brushes();
  const res = o.res ?? b.res;
  const rt = b.rt(o.w, o.h, res);
  const r = rng(o.seed ?? 1);
  // underpainting
  const under = new Graphics();
  if (typeof o.under === 'function') {
    const bands = 96;
    for (let i = 0; i < bands; i++) under.rect(0, (o.h * i) / bands, o.w, o.h / bands + 1).fill(o.under((o.h * (i + 0.5)) / bands));
  } else if (o.under !== undefined) under.rect(0, 0, o.w, o.h).fill(o.under);
  const wrapU = new Container();
  wrapU.addChild(under);
  b.renderer.render({ container: wrapU, target: rt, clear: true });
  wrapU.destroy({ children: true });
  if (!br.length) return rt;
  if (o.coat) lay(b, rt, o, r, br, o.coat.density, o.coat.len, o.coat.width, Math.max(1, (o.segs ?? 2) - 1));
  lay(b, rt, o, r, br, o.density ?? 7, o.len ?? [26, 54], o.width ?? [7, 13], o.segs ?? 2);
  return rt;
}

/** lay one pass of strokes: jittered grid → shuffled (a painterly order), chunked (≤ ~2500 sprites alive) */
function lay(b: Baker, rt: RenderTexture, o: FieldOpts, r: () => number, br: Texture[], dens: number, lens: [number, number], wids: [number, number], segs: number) {
  const cell = Math.sqrt(10000 / dens);
  const pts: [number, number][] = [];
  for (let y = -cell; y < o.h + cell; y += cell) for (let x = -cell; x < o.w + cell; x += cell) pts.push([x + r() * cell, y + r() * cell]);
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [pts[i], pts[j]] = [pts[j], pts[i]];
  }
  const [l0, l1] = lens;
  const [w0, w1] = wids;
  let batch = new Container();
  let n = 0;
  const flush = () => {
    if (!batch.children.length) return;
    b.renderer.render({ container: batch, target: rt, clear: false });
    batch.destroy({ children: true });
    batch = new Container();
    n = 0;
  };
  for (const [x0, y0] of pts) {
    if (o.inside && !o.inside(x0, y0)) continue;
    const rr = r();
    const col = o.color(x0, y0, rr);
    const len = l0 + (l1 - l0) * r();
    const wid = w0 + (w1 - w0) * r();
    const tex = br[Math.floor(r() * br.length)];
    let x = x0;
    let y = y0;
    const step = len / segs;
    for (let s = 0; s < segs; s++) {
      const a = o.flow(x, y) + (r() - 0.5) * 0.18;
      const sp = new Sprite(tex);
      sp.anchor.set(0.08, 0.5);
      sp.position.set(x, y);
      sp.rotation = a;
      sp.scale.set((step * 1.35) / 128, wid / 32);
      sp.tint = col;
      batch.addChild(sp);
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      n++;
    }
    if (n > 2400) flush();
  }
  flush();
}

/** concentric tangential strokes: a star / moon halo (rotate the sprite slowly) */
export function halo(b: Baker, o: { r: number; rings: number[]; core?: number; seed?: number; width?: number; res?: number }): RenderTexture {
  const size = o.r * 2 + 40;
  const c = size / 2;
  const ringW = o.r / o.rings.length;
  return paintField(b, {
    w: size,
    h: size,
    seed: o.seed ?? 7,
    density: 16,
    len: [o.r * 0.18, o.r * 0.34],
    width: [o.width ?? 6, (o.width ?? 6) * 1.7],
    segs: 3,
    res: o.res,
    flow: (x, y) => Math.atan2(y - c, x - c) + Math.PI / 2,
    inside: (x, y) => Math.hypot(x - c, y - c) < o.r,
    color: (x, y, r) => {
      const d = Math.hypot(x - c, y - c);
      if (o.core !== undefined && d < ringW * 0.9) return o.core;
      const i = Math.min(o.rings.length - 1, Math.floor(d / ringW));
      return r < 0.12 && i + 1 < o.rings.length ? o.rings[i + 1] : o.rings[i];
    },
  });
}

/** a colour ramp lookup (stops 0..1) with per-stroke jitter between neighbours */
export function ramp(stops: number[], t: number, r: number, jitter = 0.18): number {
  const x = Math.max(0, Math.min(0.9999, t + (r - 0.5) * jitter)) * (stops.length - 1);
  return stops[Math.floor(x)] ?? stops[0];
}
