/**
 * DA VINCI — the kit: a page of a notebook. Parchment baked by a shader, lines that DRAW THEMSELVES (a hand with a
 * little wobble, on 12 fps steps), left-handed hatching, notes written right to left (mirror writing), sanguine, a
 * candle that breathes on the page.
 *
 *  - parchment(): mottled vellum, fibers, foxing, a fold, burnt edges ('davinci:parchment').
 *  - hatchTile(): a tileable hatch for shadows under drawn things ('davinci:hatch').
 *  - Sketch: a Graphics that draws the first p of a list of strokes (by length). It only re-tessellates on a new
 *    12 fps step while it is drawing; finished, it never redraws.
 *  - mirrorNote(): a note in sepia italic, flipped (Leonardo wrote right to left).
 *  - glow(): the candle's warm pool of light (additive sprite; flicker it with noise).
 *
 * References (public domain): «El Hombre de Vitruvio» (c. 1490, Gallerie dell'Accademia), «Estudios de gatos, leones
 * y un dragón» (c. 1517–1518, Royal Collection), the Codex Atlanticus flying machines (1478–1519), «Estudios
 * anatómicos» (Windsor, c. 1510).
 */
import { Graphics, Sprite, type RenderTexture, type Texture, type TextStyleOptions } from 'pixi.js';
import type { Baker } from '../bake';
import { BAKE_UV } from '../bake';
import type { TextCache } from '../../momentos/anime/kit';
import type { StylePrep } from './index';

export const DV = {
  vellum: 0xe8d5a9,
  vellumD: 0xcdb27a,
  ink: 0x3b2412,
  inkL: 0x6a4424,
  sanguine: 0xa0442a,
  burnt: 0x5a3416,
};

export function prepDaVinci(p: StylePrep) {
  p.baker.add('davinci:parchment', 'pergamino', () => {
    p.tex.set('dv:glow', glow(p.baker, 512));
  });
  p.baker.add('davinci:hatch', 'trama de plumilla', () => {
    p.tex.set('dv:hatch', hatchTile(p.baker));
  });
}

/** a sheet of vellum w×h (design px) */
export function parchment(b: Baker, w: number, h: number, seed = 1, res?: number): RenderTexture {
  return b.shade(
    `parch-${seed}`,
    w,
    h,
    `${BAKE_UV}
void main() {
  vec2 uv = bakeUV();
  vec2 p = uv * uSize / 900.0;
  vec3 base = vec3(0.91, 0.835, 0.66);
  vec3 dark = vec3(0.78, 0.66, 0.45);
  float m = fbm(p * 2.2 + uSeed) * 0.65 + fbm(p * 9.0 + uSeed * 3.0) * 0.35;
  vec3 col = mix(base, dark, smoothstep(0.35, 0.85, m) * 0.55);
  // fibers
  float fib = smoothstep(0.86, 1.0, vnoise(vec2(p.x * 160.0 + p.y * 30.0, p.y * 9.0) + uSeed)) * 0.08;
  col -= fib;
  // foxing: small rusty spots
  for (int i = 0; i < 26; i++) {
    vec2 c = vec2(hash12(vec2(float(i), uSeed)), hash12(vec2(uSeed, float(i) + 3.0)));
    float r = 0.002 + 0.01 * hash12(vec2(float(i), 7.0 + uSeed));
    float d = length((uv - c) * vec2(uSize.x / uSize.y, 1.0));
    col = mix(col, vec3(0.62, 0.42, 0.22), (1.0 - smoothstep(r * 0.3, r, d)) * 0.35);
  }
  // a water stain ring
  float ring = abs(length((uv - vec2(0.78, 0.7)) * vec2(uSize.x / uSize.y, 1.0)) - 0.13 - fbm(uv * 8.0) * 0.03);
  col = mix(col, vec3(0.7, 0.55, 0.33), (1.0 - smoothstep(0.0, 0.006, ring)) * 0.25);
  // the fold down the middle
  float fold = abs(uv.x - 0.5);
  col *= 1.0 - (1.0 - smoothstep(0.0, 0.012, fold)) * 0.08;
  col += (1.0 - smoothstep(0.004, 0.02, abs(uv.x - 0.508))) * 0.03;
  // burnt, darkened edges (irregular)
  vec2 e = min(uv, 1.0 - uv) * vec2(uSize.x / uSize.y, 1.0);
  float edge = min(e.x, e.y) + (fbm(uv * 12.0 + uSeed) - 0.5) * 0.03;
  col = mix(vec3(0.36, 0.2, 0.08), col, smoothstep(0.0, 0.07, edge));
  float a = smoothstep(0.0, 0.006, edge + 0.004);
  finalColor = vec4(col * a, a);
}`,
    { uSeed: { value: seed * 1.37, type: 'f32' } },
    {},
    { res },
  );
}

/** tileable hatch (256², alpha = ink): ↘ strokes, broken like real pen work */
export function hatchTile(b: Baker): RenderTexture {
  return b.shade(
    'dv-hatch',
    256,
    256,
    `${BAKE_UV}
void main() {
  vec2 uv = bakeUV();
  vec2 px = uv * 256.0;
  float l = abs(fract((px.x + px.y) / 8.0 + pnoise(uv * 4.0, 4.0) * 0.5) - 0.5) * 2.0;
  float a = (1.0 - smoothstep(0.1, 0.35, l)) * smoothstep(0.3, 0.6, pnoise(vec2((px.x - px.y) / 22.0, (px.x + px.y) / 90.0), 8.0));
  finalColor = vec4(vec3(0.23, 0.14, 0.07) * a, a);
}`,
    {},
    {},
    { res: 1 },
  );
}

/** a warm radial pool (white core → amber → 0), for an additive candle light */
export function glow(b: Baker, size = 512): RenderTexture {
  return b.shade(
    'dv-glow',
    size,
    size,
    `${BAKE_UV}
void main() {
  vec2 uv = bakeUV();
  float d = length(uv - 0.5) * 2.0;
  float a = exp(-d * d * 3.2) * (1.0 - smoothstep(0.85, 1.0, d));
  vec3 c = mix(vec3(1.0, 0.62, 0.25), vec3(1.0, 0.92, 0.75), exp(-d * d * 14.0));
  finalColor = vec4(c * a, a);
}`,
    {},
    {},
    { res: 1 },
  );
}

// ------------------------------------------------------------------ strokes that draw themselves
export interface Stroke {
  pts: [number, number][];
  width?: number;
  color?: number;
  alpha?: number;
}
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
/** wobble a polyline the way a hand does (fixed per seed: the line does not swim) */
export function hand(pts: [number, number][], amp = 1.6, seed = 1, sub = 3): [number, number][] {
  const r = rng(seed);
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    for (let k = 0; k < sub; k++) {
      const t = k / sub;
      out.push([x0 + (x1 - x0) * t + (r() - 0.5) * amp, y0 + (y1 - y0) * t + (r() - 0.5) * amp]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
export const circlePts = (cx: number, cy: number, r: number, n = 48, a0 = -Math.PI / 2, sweep = Math.PI * 2): [number, number][] =>
  Array.from({ length: n + 1 }, (_, i) => [cx + Math.cos(a0 + (sweep * i) / n) * r, cy + Math.sin(a0 + (sweep * i) / n) * r]);
export const rectPts = (x: number, y: number, w: number, h: number): [number, number][] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
  [x, y],
];

const plen = (pts: [number, number][]) => {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
};

/** a drawing that draws itself: draw(p) shows the first p (0..1) of the total ink length, in order */
export class Sketch extends Graphics {
  private lens: number[];
  private total: number;
  private lastKey = -1;
  constructor(
    readonly strokes: Stroke[],
    readonly ink = DV.ink,
  ) {
    super();
    this.lens = strokes.map((s) => plen(s.pts));
    this.total = this.lens.reduce((a, b) => a + b, 0) || 1;
  }
  /** p 0..1; `step` = a stepping key (12 fps): only a new key re-tessellates */
  draw(p: number, step: number) {
    const pp = Math.max(0, Math.min(1, p));
    const key = pp >= 1 ? 1e9 : pp <= 0 ? -2 : step;
    if (key === this.lastKey) return;
    this.lastKey = key;
    this.clear();
    if (pp <= 0) return;
    let budget = pp * this.total;
    for (let i = 0; i < this.strokes.length && budget > 0; i++) {
      const s = this.strokes[i];
      const L = this.lens[i];
      const pts = s.pts;
      this.moveTo(pts[0][0], pts[0][1]);
      let used = 0;
      for (let j = 1; j < pts.length; j++) {
        const seg = Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]);
        if (used + seg > budget) {
          const k = (budget - used) / (seg || 1);
          this.lineTo(pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * k, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * k);
          used = budget;
          break;
        }
        this.lineTo(pts[j][0], pts[j][1]);
        used += seg;
      }
      this.stroke({ width: s.width ?? 2.2, color: s.color ?? this.ink, alpha: s.alpha ?? 0.92, cap: 'round', join: 'round' });
      budget -= Math.min(L, used);
    }
  }
}

/** a note written right to left (sepia italic, mirrored) */
export function mirrorNote(text: TextCache, s: string, size = 30, color = DV.inkL): Sprite {
  const style: TextStyleOptions = { fontFamily: 'Playfair Display', fontStyle: 'italic', fontSize: size, fill: color, align: 'right', lineHeight: size * 1.25 };
  const sp = text.sprite(s, style, 0.5);
  sp.scale.x = -1;
  return sp;
}
export const glowSprite = (t: Texture | undefined) => {
  const s = new Sprite(t);
  s.anchor.set(0.5);
  s.blendMode = 'add';
  return s;
};
