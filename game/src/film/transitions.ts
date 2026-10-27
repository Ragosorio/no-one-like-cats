/**
 * PELÍCULAS — the transitions library: ONE uber shader, applied to a scene's full-screen slot while a transition runs.
 *
 *   side 0 (REVEAL)   the incoming scene B is drawn over A through a mask that grows with p:
 *                     dissolve · iris · inkBleed · paintSmear · glitch · objectToSet · match · lightLeak · fade
 *   side 1 (CONCEAL)  the outgoing scene A is drawn over B and goes away:
 *                     pageTurn (A curls and turns, B is the next page) · door (A opens as two doors) · and every
 *                     reveal kind run backwards when B is black (the close / an iris out)
 *   whip              no mask: both slots slide with the post's motion blur (stage.ts)
 *
 * «Reducir movimiento»: the catalog's `reduced` kind plays instead (a dissolve) — same length, same timeline.
 */
import type { Filter } from 'pixi.js';
import type { TransitionKind, TransitionSpec } from './types';
import { TRANSITIONS } from './catalog';
import { glFilter, NOISE, rgb, setRgb, uni } from './gl';

export const KIND_ID: Record<TransitionKind, number> = {
  cut: 0,
  dissolve: 1,
  iris: 2,
  door: 3,
  pageTurn: 4,
  inkBleed: 5,
  paintSmear: 6,
  glitch: 7,
  objectToSet: 8,
  match: 9,
  lightLeak: 10,
  fade: 11,
  whip: 12,
};
/** kinds drawn on the OUTGOING scene (A on top) */
export const CONCEAL_KINDS = new Set<TransitionKind>(['pageTurn', 'door']);

const FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec4 uInputClamp;
uniform float uKind;
uniform float uP;
uniform float uSide;
uniform vec2 uAt;
uniform vec4 uRect;
uniform float uDir;
uniform vec3 uTint;
uniform float uSeed;
uniform float uAspect;
${NOISE}
const float PI = 3.14159265;
vec4 tex(vec2 uv01) { return texture(uTexture, clamp(uv01 * uInputClamp.zw, uInputClamp.xy, uInputClamp.zw)); }
float ease(float x) { return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0; }
// how much of the incoming picture shows at q for progress p (0 = none, 1 = all), plus an edge band (0..1)
vec2 reveal(int k, vec2 q, float p) {
  if (k == 1) return vec2(smoothstep(0.0, 1.0, p), 0.0);
  if (k == 2) { // iris
    float d = length((q - uAt) * vec2(uAspect, 1.0));
    float far = length(max(abs(uAt - vec2(0.0)), abs(uAt - vec2(1.0))) * vec2(uAspect, 1.0));
    float r = ease(p) * (far + 0.05);
    return vec2(1.0 - smoothstep(r - 0.004, r + 0.004, d), 0.0);
  }
  if (k == 5) { // ink bleed: blots that grow and merge, a dark wet edge
    float f = fbm(q * vec2(3.2 * uAspect, 3.2) + uSeed) * 0.75 + 0.25 * (1.0 - length((q - uAt) * vec2(uAspect, 1.0)) / 1.6);
    float th = 1.0 - p * 1.25;
    float m = smoothstep(th - 0.015, th + 0.015, f);
    float edge = smoothstep(th - 0.07, th, f) * (1.0 - smoothstep(th + 0.0, th + 0.05, f));
    return vec2(m, edge);
  }
  if (k == 6) { // paint smear: brush rows sweeping across, bristle streaks at the front
    float rows = 7.0;
    float r = floor(q.y * rows);
    float x = uDir > 0.0 ? q.x : 1.0 - q.x;
    float off = hash12(vec2(r, uSeed)) * 0.35;
    float bristle = (vnoise(vec2(x * 3.0, q.y * rows * 9.0) + uSeed) - 0.5) * 0.12;
    float front = p * 1.55 - off + bristle;
    float m = 1.0 - smoothstep(front - 0.02, front, x);
    float edge = (1.0 - smoothstep(front - 0.09, front, x)) * smoothstep(front - 0.25, front - 0.05, x) * step(0.001, p) * (1.0 - step(0.999, p));
    return vec2(m, edge);
  }
  if (k == 7) { // glitch: blocks flip in, the seam tears
    vec2 cell = floor(q * vec2(18.0, 10.0) * (1.0 + floor(hash12(vec2(floor(p * 9.0), uSeed)) * 3.0)));
    float r = hash12(cell + uSeed);
    float m = step(r, p * 1.1 - 0.05);
    float edge = step(abs(r - p), 0.08);
    return vec2(m, edge);
  }
  if (k == 8) { // object becomes the set: the object's rect grows to the frame
    float e = ease(p);
    vec4 rc = mix(uRect, vec4(0.0, 0.0, 1.0, 1.0), e);
    vec2 c = rc.xy + rc.zw * 0.5;
    vec2 hs = rc.zw * 0.5;
    float rad = 0.03 * (1.0 - e);
    vec2 d = abs(q - c) - hs + rad;
    float sd = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - rad;
    float m = 1.0 - smoothstep(-0.002, 0.002, sd);
    float edge = (1.0 - smoothstep(0.0, 0.006, abs(sd))) * (1.0 - e);
    return vec2(m, edge);
  }
  if (k == 9) { // match: a soft dissolve through brush-shaped noise, centred on the matched shape
    float f = fbm(q * vec2(5.0 * uAspect, 5.0) + uSeed) * 0.6 + 0.4 * (1.0 - length((q - uAt) * vec2(uAspect, 1.0)));
    float th = 1.0 - p * 1.3;
    return vec2(smoothstep(th - 0.08, th + 0.08, f), 0.0);
  }
  if (k == 10) return vec2(smoothstep(0.25, 0.85, p), 0.0);
  return vec2(smoothstep(0.0, 1.0, p), 0.0);
}
void main() {
  vec2 q = vTextureCoord / max(uInputClamp.zw, vec2(1e-4));
  int k = int(uKind + 0.5);
  float p = clamp(uP, 0.0, 1.0);
  if (uSide < 0.5) {
    // ---- REVEAL: the incoming picture over the outgoing one
    vec4 c = tex(q);
    if (k == 11) { // fade through a color
      float a = smoothstep(0.0, 0.5, p);
      float b = smoothstep(0.5, 1.0, p);
      vec3 col = mix(uTint, c.a > 0.0 ? c.rgb / c.a : uTint, b);
      finalColor = vec4(col * a, a);
      return;
    }
    vec2 r = reveal(k, q, p);
    vec4 o = c * r.x;
    if (k == 5) o = vec4(mix(o.rgb, uTint * r.x, r.y * 0.85), o.a);
    if (k == 6) o = vec4(mix(o.rgb, uTint * max(r.x, r.y), r.y * 0.7), max(o.a, r.y * 0.9));
    if (k == 7 && r.y > 0.0) {
      vec4 cr = tex(q + vec2(0.012, 0.0));
      vec4 cb = tex(q - vec2(0.012, 0.0));
      o = vec4(cr.r, c.g, cb.b, 1.0) * max(r.x, 0.6);
    }
    if (k == 8) o = vec4(mix(o.rgb, uTint, r.y), max(o.a, r.y));
    if (k == 10) { // a warm light leak washes across
      float x = mix(-0.4, 1.4, p);
      float leak = exp(-pow((q.x - x) * 2.4, 2.0)) * sin(p * PI) * (0.6 + 0.4 * vnoise(q * 3.0 + uSeed));
      o.rgb += uTint * leak * 0.9;
    }
    finalColor = o;
    return;
  }
  // ---- CONCEAL: the outgoing picture goes away over the incoming one
  if (k == 4) { // page turn: a cylinder curl travelling across, the back of the page in the paper color
    float x = uDir > 0.0 ? 1.0 - q.x : q.x;
    float R = 0.085;
    float a = mix(1.0 + R, -R * 2.0 - 0.25, ease(p));
    vec2 sq = vec2(uDir > 0.0 ? 1.0 - x : x, q.y);
    if (x > a + R) {
      // lifted away: the next page shows; the curl casts a soft shadow on it
      float sh = (1.0 - smoothstep(a + R, a + R + 0.07, x)) * 0.45;
      finalColor = vec4(0.0, 0.0, 0.0, sh);
      return;
    }
    if (x > a) {
      float d = clamp((x - a) / R, 0.0, 1.0);
      float th = asin(d);
      float u = a + R * th;
      vec2 su = vec2(uDir > 0.0 ? 1.0 - u : u, q.y + (q.y - 0.5) * 0.04 * d);
      vec4 c = tex(su);
      float shade = mix(1.0, 0.62, d * d);
      finalColor = vec4(c.rgb * shade, c.a);
      return;
    }
    float u2 = 2.0 * a - x + R * (PI - 2.0);
    if (u2 <= 1.0) {
      // the back of the turned page lies over the flat part
      vec2 su = vec2(uDir > 0.0 ? 1.0 - u2 : u2, q.y);
      vec4 back = tex(su);
      float g = smoothstep(0.0, 0.25, a - x);
      vec3 paper = uTint * (0.78 + 0.22 * g) + (back.rgb - 0.5) * 0.08;
      finalColor = vec4(paper, 1.0);
      return;
    }
    vec4 c = tex(sq);
    float sh = 1.0 - 0.3 * (1.0 - smoothstep(0.0, 0.06, a - x));
    finalColor = vec4(c.rgb * sh, c.a);
    return;
  }
  if (k == 3) { // door: two halves swing open (hinged at the edges)
    float e = ease(p);
    float w = 0.5 * cos(e * PI * 0.5);
    float side = q.x < 0.5 ? 0.0 : 1.0;
    float x = side < 0.5 ? q.x : 1.0 - q.x;
    if (x > w) { finalColor = vec4(0.0); return; }
    float u = x / max(w, 1e-4) * 0.5;
    float persp = 1.0 + 0.18 * e * (x / max(w, 1e-4));
    float v = 0.5 + (q.y - 0.5) * persp;
    if (v < 0.0 || v > 1.0) { finalColor = vec4(0.0); return; }
    vec2 su = vec2(side < 0.5 ? u : 1.0 - u, v);
    vec4 c = tex(su);
    float shade = 1.0 - 0.55 * e * (x / max(w, 1e-4));
    finalColor = vec4(c.rgb * shade, c.a);
    return;
  }
  // any reveal kind backwards: A stays where the mask has NOT grown yet
  vec4 c = tex(q);
  if (k == 11) {
    float a = 1.0 - smoothstep(0.0, 1.0, p);
    finalColor = vec4(mix(uTint, c.a > 0.0 ? c.rgb / c.a : uTint, a), 1.0);
    return;
  }
  // the reveal mask run backwards: what stays is what the mask covers at 1 − p (an iris closes on its point)
  vec2 r = reveal(k, q, 1.0 - p);
  finalColor = c * r.x;
}`;

const f1 = (value: number) => ({ value, type: 'f32' });
export function makeTransition(): Filter {
  return glFilter('film-transition', FRAG, {
    uKind: f1(1),
    uP: f1(0),
    uSide: f1(0),
    uAt: { value: new Float32Array([0.5, 0.5]), type: 'vec2<f32>' },
    uRect: { value: new Float32Array([0.4, 0.4, 0.2, 0.2]), type: 'vec4<f32>' },
    uDir: f1(-1),
    uTint: { value: rgb(0x000000), type: 'vec3<f32>' },
    uSeed: f1(1),
    uAspect: f1(16 / 9),
  });
}

/** the kind that actually plays (reduce motion swaps it) */
export function playedKind(t: TransitionSpec, reduceMotion: boolean): TransitionKind {
  return reduceMotion ? TRANSITIONS[t.kind].reduced : t.kind;
}

/**
 * Set the filter for a transition at progress p. `side`: 0 = on the incoming slot, 1 = on the outgoing slot.
 * `view` = the visible design rect (to turn design-box points into 0..1 screen coords).
 */
export function applyTransition(f: Filter, t: TransitionSpec, kind: TransitionKind, p: number, side: 0 | 1, view: { x: number; y: number; w: number; h: number }) {
  const u = uni(f);
  u.uKind = KIND_ID[kind];
  u.uP = p;
  u.uSide = side;
  const at = u.uAt as Float32Array;
  const pt = t.at ?? [960, 540];
  at[0] = (pt[0] - view.x) / view.w;
  at[1] = (pt[1] - view.y) / view.h;
  const rc = u.uRect as Float32Array;
  const r = t.rect ?? [860, 440, 200, 200];
  rc[0] = (r[0] - view.x) / view.w;
  rc[1] = (r[1] - view.y) / view.h;
  rc[2] = r[2] / view.w;
  rc[3] = r[3] / view.h;
  u.uDir = t.dir ?? -1;
  setRgb(u.uTint as Float32Array, t.tint ?? t.color ?? (kind === 'pageTurn' ? 0xe8d5a9 : kind === 'lightLeak' ? 0xffa860 : 0x000000));
  u.uSeed = t.seed ?? 1;
  u.uAspect = view.w / view.h;
}
