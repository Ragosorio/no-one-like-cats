/**
 * KLIMT — the kit: gold leaf. A shader lays the mosaic (squares, spirals, eyes, the Tree of Life's coils) in gold with
 * a few coloured tesserae; shapes are cut from it with masks and the plane is baked static. A spark texture glints on
 * the leaf (sprites, a few at a time).
 *
 * References (public domain): «El beso» (1907–1908, Belvedere), «Retrato de Adele Bloch-Bauer I» (1907), the
 * «Friso Stoclet» / «El árbol de la vida» (1905–1911).
 */
import type { RenderTexture } from 'pixi.js';
import type { Baker } from '../bake';
import { BAKE_UV } from '../bake';
import type { StylePrep } from './index';

export const KL = { gold: 0xd9a63a, goldL: 0xf6d77a, goldD: 0x8a5e18, black: 0x15100a, red: 0xb0402a, blue: 0x2f4f8a, green: 0x3f7a4a, flesh: 0xf0d8c0 };

export function prepKlimt(p: StylePrep) {
  p.baker.add('klimt:leaf', 'pan de oro', () => {
    p.tex.set('kl:spark', spark(p.baker));
  });
}
/** a four-pointed glint (white; tint it gold) */
function spark(b: Baker): RenderTexture {
  return b.shade(
    'kl-spark',
    128,
    128,
    `${BAKE_UV}
void main() {
  vec2 q = bakeUV() - 0.5;
  float a = exp(-length(q) * 18.0) + exp(-abs(q.x) * 80.0 - abs(q.y) * 8.0) + exp(-abs(q.y) * 80.0 - abs(q.x) * 8.0);
  a = clamp(a, 0.0, 1.0);
  finalColor = vec4(vec3(a), a);
}`,
    {},
    {},
    { res: 1 },
  );
}
/**
 * Gold leaf w×h. mode 0 = rectangles (the man's robe in «El beso») · 1 = circles and flowers (the woman's) · 2 = coils
 * (the Tree of Life) · 3 = the flat speckled ground. `dark` = how much black is let through.
 */
export function goldLeaf(b: Baker, w: number, h: number, mode: number, seed = 1, dark = 0.25, res?: number): RenderTexture {
  return b.shade(
    `kl-leaf-${mode}-${seed}`,
    w,
    h,
    `${BAKE_UV}
vec3 tess(vec2 cell) {
  float k = hash12(cell + uSeed);
  if (k < 0.05) return vec3(0.69, 0.25, 0.16);
  if (k < 0.09) return vec3(0.18, 0.31, 0.54);
  if (k < 0.12) return vec3(0.25, 0.48, 0.29);
  return vec3(0.0);
}
void main() {
  vec2 px = bakeUV() * uSize;
  vec3 gD = vec3(0.54, 0.37, 0.09), g = vec3(0.85, 0.65, 0.23), gL = vec3(0.97, 0.85, 0.48), k = vec3(0.08, 0.06, 0.04);
  vec3 col = mix(gD, g, vnoise(px * 0.05 + uSeed));
  float m = 0.0;
  if (uMode < 0.5) {
    vec2 cs = vec2(26.0, 38.0);
    vec2 cell = floor(px / cs + vec2(0.0, floor(px.x / cs.x) * 0.37));
    vec2 f = fract(px / cs + vec2(0.0, floor(px.x / cs.x) * 0.37));
    float edge = step(0.08, f.x) * step(f.x, 0.92) * step(0.06, f.y) * step(f.y, 0.94);
    float h = hash12(cell + uSeed);
    vec3 t = h < 0.45 ? k : h < 0.75 ? vec3(0.94, 0.92, 0.86) : gL;
    col = mix(col, t, edge * (h < 0.88 ? 1.0 : 0.0));
  } else if (uMode < 1.5) {
    vec2 cell = floor(px / 44.0);
    vec2 f = fract(px / 44.0) - 0.5 + (hash22(cell + uSeed) - 0.5) * 0.3;
    float r = length(f);
    float ring = step(abs(r - 0.3), 0.06);
    float core = 1.0 - smoothstep(0.1, 0.14, r);
    vec3 tc = tess(cell);
    col = mix(col, gL, ring);
    col = mix(col, length(tc) > 0.0 ? tc : vec3(0.95, 0.5, 0.45), core);
  } else if (uMode < 2.5) {
    vec2 cell = floor(px / 120.0);
    vec2 f = fract(px / 120.0) - 0.5;
    float a = atan(f.y, f.x);
    float r = length(f);
    float coil = step(0.5, fract(r * 10.0 - a / 6.2831 * (hash12(cell) < 0.5 ? 1.0 : -1.0)));
    col = mix(col, mix(k, gL, step(0.42, r)), coil * (1.0 - smoothstep(0.42, 0.5, r)));
  } else {
    float s = step(0.9, vnoise(px * 0.6 + uSeed));
    col = mix(col, gL, s * 0.7);
  }
  col = mix(col, k, uDark * step(0.92, vnoise(px * 0.15 + uSeed * 2.0)));
  col *= 0.9 + 0.2 * vnoise(px * 0.02);
  finalColor = vec4(col, 1.0);
}`,
    { uMode: { value: mode, type: 'f32' }, uSeed: { value: seed * 1.7, type: 'f32' }, uDark: { value: dark, type: 'f32' } },
    {},
    { res },
  );
}
