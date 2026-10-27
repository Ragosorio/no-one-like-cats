/**
 * PELÍCULAS — the film post: ONE full-screen pass that gives every scene its lens and its stock.
 *
 *   heat haze band · motion blur (whip pans) · chromatic aberration · halation (bright-pass ring) · contrast / lift /
 *   saturation · mono or sepia with ONE kept accent hue (noir neon, Canelo's scarf) · tint · canvas weave / paper
 *   fibers / lens dirt from one pre-baked 4-channel tile · film grain (stepped at 24 fps: a film, not TV noise) ·
 *   exposure flicker and scratches (old film) · vignette.
 *
 * Looks are plain number records (PostLook) per style / scene; during a transition the stage blends the two looks.
 * Grain and flicker are seeded by momento time (stepped), so a scrubbed frame and a live one match.
 */
import type { Filter, Texture } from 'pixi.js';
import { glFilter, NOISE, rgb, setRgb, uni } from './gl';
import type { Baker } from './bake';
import { BAKE_UV } from './bake';

export interface PostLook {
  grain: number;
  vig: number;
  aberr: number;
  hal: number;
  halT: number;
  halR: number;
  contrast: number;
  lift: number;
  sat: number;
  mono: number;
  sepia: number;
  /** kept hue (0..1) while mono / sepia; accW = its width (0 = keep nothing) */
  accHue: number;
  accW: number;
  /** a second kept hue */
  accHue2: number;
  accW2: number;
  tintAmt: number;
  tint: number;
  canvas: number;
  paper: number;
  dirt: number;
  flicker: number;
  scratch: number;
  /** warmth (−1 cold … +1 warm) */
  warm: number;
  /** exposure */
  expo: number;
  /** duotone (cat vision): 0..1, dark → duoA, light → duoB, with the darks lifted */
  duo: number;
  duoA: number;
  duoB: number;
}
export const NEUTRAL: PostLook = {
  grain: 0.04,
  vig: 0.25,
  aberr: 0,
  hal: 0,
  halT: 0.75,
  halR: 6,
  contrast: 1,
  lift: 0,
  sat: 1,
  mono: 0,
  sepia: 0,
  accHue: 0,
  accW: 0,
  accHue2: 0,
  accW2: 0,
  tintAmt: 0,
  tint: 0xffffff,
  canvas: 0,
  paper: 0,
  dirt: 0,
  flicker: 0,
  scratch: 0,
  warm: 0,
  expo: 1,
  duo: 0,
  duoA: 0x1a2a6a,
  duoB: 0xf2d76a,
};
export function mixLook(a: PostLook, b: PostLook, k: number): PostLook {
  const out = { ...a };
  for (const key of Object.keys(a) as (keyof PostLook)[]) {
    if (key === 'tint' || key === 'duoA' || key === 'duoB') out[key] = mixHex(a[key], b[key], k);
    else if (key === 'accHue' || key === 'accHue2') out[key] = k < 0.5 ? a[key] : b[key];
    else out[key] = a[key] + (b[key] - a[key]) * k;
  }
  return out;
}
export const look = (...parts: (Partial<PostLook> | Record<string, number> | undefined)[]): PostLook => Object.assign({ ...NEUTRAL }, ...parts.filter(Boolean)) as PostLook;
function mixHex(a: number, b: number, k: number) {
  const ch = (s: number) => Math.round((((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k)) << s;
  return ch(16) | ch(8) | ch(0);
}

const FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform sampler2D uTile;
uniform vec4 uInputSize;
uniform vec4 uInputClamp;
uniform float uSeed;
uniform float uGrain;
uniform float uVig;
uniform float uAberr;
uniform float uHal;
uniform float uHalT;
uniform float uHalR;
uniform float uContrast;
uniform float uLift;
uniform float uSat;
uniform float uMono;
uniform float uSepia;
uniform float uAccHue;
uniform float uAccW;
uniform float uAccHue2;
uniform float uAccW2;
uniform vec3 uTint;
uniform float uTintAmt;
uniform float uCanvas;
uniform float uPaper;
uniform float uDirt;
uniform vec2 uDirtAt;
uniform float uFlicker;
uniform float uScratch;
uniform float uWarm;
uniform float uExpo;
uniform vec2 uMotion;
uniform vec3 uHeat;
uniform float uDuo;
uniform vec3 uDuoA;
uniform vec3 uDuoB;
uniform float uPx;
${NOISE}
vec3 hue2rgb(float h) { return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
float hueOf(vec3 c) {
  float mx = max(max(c.r, c.g), c.b); float mn = min(min(c.r, c.g), c.b); float d = mx - mn;
  if (d < 1e-4) return 0.0;
  float h = mx == c.r ? mod((c.g - c.b) / d, 6.0) : mx == c.g ? (c.b - c.r) / d + 2.0 : (c.r - c.g) / d + 4.0;
  return h / 6.0;
}
vec4 tex(vec2 uv) { return texture(uTexture, clamp(uv, uInputClamp.xy, uInputClamp.zw)); }
void main() {
  vec2 uv = vTextureCoord;
  vec2 q = uv / max(uInputClamp.zw, vec2(1e-4));
  vec2 px = uv * uInputSize.xy;
  // heat haze: a band of rising shimmer
  if (uHeat.z > 0.0) {
    float band = smoothstep(uHeat.x - 0.05, uHeat.x, q.y) * (1.0 - smoothstep(uHeat.y, uHeat.y + 0.05, q.y));
    uv.x += sin(q.y * 90.0 + uSeed * 7.0 + vnoise(q * 8.0 + uSeed) * 6.0) * uHeat.z * band * uInputSize.z * uPx;
  }
  vec4 c;
  if (abs(uMotion.x) + abs(uMotion.y) > 0.5) {
    c = vec4(0.0);
    vec2 st = uMotion * uInputSize.zw * uPx / 8.0;
    for (int i = -4; i <= 4; i++) c += tex(uv + st * float(i));
    c /= 9.0;
  } else c = tex(uv);
  if (uAberr > 0.001) {
    vec2 d = (q - 0.5) * uAberr * uInputSize.zw * 10.0 * uPx;
    c.r = tex(uv + d).r;
    c.b = tex(uv - d).b;
  }
  vec3 col = c.a > 0.0 ? c.rgb / c.a : vec3(0.0);
  // halation: the glow film stock leaves around highlights (warm red fringe)
  if (uHal > 0.001) {
    vec3 h = vec3(0.0);
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.785398 + 0.39;
      vec2 o = vec2(cos(a), sin(a)) * uHalR * uPx * uInputSize.zw;
      vec4 s = tex(uv + o);
      vec4 s2 = tex(uv + o * 2.2);
      h += max(s.rgb - uHalT, 0.0) + 0.6 * max(s2.rgb - uHalT, 0.0);
    }
    h /= 8.0;
    col += h * vec3(1.0, 0.55, 0.38) * uHal * 2.4;
  }
  col *= uExpo;
  // grade
  col = (col - 0.5) * uContrast + 0.5 + uLift;
  float l = lum(col);
  col = mix(vec3(l), col, uSat);
  col += vec3(0.06, 0.015, -0.06) * uWarm;
  // mono / sepia with one kept accent hue
  if (uMono + uSepia > 0.001) {
    float h = hueOf(col);
    float sat = max(max(col.r, col.g), col.b) - min(min(col.r, col.g), col.b);
    float dh = abs(h - uAccHue); dh = min(dh, 1.0 - dh);
    float keep = uAccW > 0.0 ? (1.0 - smoothstep(uAccW * 0.5, uAccW, dh)) * smoothstep(0.12, 0.3, sat) : 0.0;
    float dh2 = abs(h - uAccHue2); dh2 = min(dh2, 1.0 - dh2);
    keep = max(keep, uAccW2 > 0.0 ? (1.0 - smoothstep(uAccW2 * 0.5, uAccW2, dh2)) * smoothstep(0.12, 0.3, sat) : 0.0);
    vec3 g = vec3(lum(col));
    vec3 sep = vec3(lum(col)) * vec3(1.07, 0.92, 0.72) + vec3(0.04, 0.02, 0.0);
    vec3 base = mix(g, sep, uSepia / max(uMono + uSepia, 1e-4));
    col = mix(col, base, clamp(uMono + uSepia, 0.0, 1.0) * (1.0 - keep));
  }
  col = mix(col, col * uTint, uTintAmt);
  if (uDuo > 0.001) {
    float dl = pow(clamp(lum(col), 0.0, 1.0), 0.55);
    col = mix(col, mix(uDuoA, uDuoB, smoothstep(0.08, 0.85, dl)), uDuo);
  }
  // the stock: canvas weave, paper fibers, lens dirt (one tileable texture)
  vec4 tile = texture(uTile, fract(px / (512.0 * uPx)));
  col *= 1.0 - uCanvas * (tile.r - 0.5) * 0.5;
  col *= 1.0 - uPaper * (1.0 - tile.g) * 0.35;
  if (uDirt > 0.001) {
    float near = 1.0 - smoothstep(0.0, 0.75, length((q - uDirtAt) * vec2(1.6, 1.0)));
    col += tile.b * uDirt * near * vec3(1.0, 0.92, 0.8);
  }
  // grain (luma-weighted, stepped)
  float n = hash12(floor(px / max(1.0, uPx * 1.3)) + uSeed * 37.0) - 0.5;
  col += n * uGrain * (1.15 - lum(col) * 0.7);
  // old film: flicker + scratches
  col *= 1.0 + uFlicker * (hash12(vec2(uSeed, 3.1)) - 0.5) * 0.3;
  if (uScratch > 0.001) {
    float sx = hash12(vec2(uSeed * 1.7, 9.0));
    float line = 1.0 - smoothstep(0.0, 0.0012, abs(q.x - sx));
    float sx2 = hash12(vec2(uSeed * 2.3, 5.0));
    line += 0.6 * (1.0 - smoothstep(0.0, 0.0008, abs(q.x - sx2))) * step(0.6, hash12(vec2(uSeed, 1.0)));
    col = mix(col, vec3(0.95, 0.92, 0.85), line * uScratch * 0.6);
  }
  float v = smoothstep(0.3, 0.95, length((q - 0.5) * vec2(1.0, 0.85)) * 1.3);
  col *= 1.0 - v * uVig;
  finalColor = vec4(clamp(col, 0.0, 1.0) * c.a, c.a);
}`;

const f1 = (value: number) => ({ value, type: 'f32' });
export function makePost(tile: Texture): Filter {
  return glFilter(
    'film-post',
    FRAG,
    {
      uSeed: f1(0),
      uGrain: f1(0),
      uVig: f1(0),
      uAberr: f1(0),
      uHal: f1(0),
      uHalT: f1(0.8),
      uHalR: f1(6),
      uContrast: f1(1),
      uLift: f1(0),
      uSat: f1(1),
      uMono: f1(0),
      uSepia: f1(0),
      uAccHue: f1(0),
      uAccW: f1(0),
      uAccHue2: f1(0),
      uAccW2: f1(0),
      uTint: { value: rgb(0xffffff), type: 'vec3<f32>' },
      uTintAmt: f1(0),
      uCanvas: f1(0),
      uPaper: f1(0),
      uDirt: f1(0),
      uDirtAt: { value: new Float32Array([0.5, 0.3]), type: 'vec2<f32>' },
      uFlicker: f1(0),
      uScratch: f1(0),
      uWarm: f1(0),
      uExpo: f1(1),
      uMotion: { value: new Float32Array([0, 0]), type: 'vec2<f32>' },
      uDuo: f1(0),
      uDuoA: { value: rgb(0x1a2a6a), type: 'vec3<f32>' },
      uDuoB: { value: rgb(0xf2d76a), type: 'vec3<f32>' },
      uHeat: { value: new Float32Array([0, 0, 0]), type: 'vec3<f32>' },
      uPx: f1(1),
    },
    { uTile: tile.source },
  );
}

export interface PostFrame {
  look: PostLook;
  /** momento time (grain / flicker seed, stepped at 24 fps) */
  m: number;
  motion: [number, number];
  heat: [number, number, number];
  dirtAt: [number, number];
  /** device px per design px */
  px: number;
  reduceFlashes: boolean;
}
export function applyPost(f: Filter, p: PostFrame) {
  const u = uni(f);
  const L = p.look;
  u.uSeed = (Math.floor(p.m * 24) % 977) + 1;
  u.uGrain = L.grain;
  u.uVig = L.vig;
  u.uAberr = L.aberr;
  u.uHal = L.hal;
  u.uHalT = L.halT;
  u.uHalR = L.halR;
  u.uContrast = L.contrast;
  u.uLift = L.lift;
  u.uSat = L.sat;
  u.uMono = L.mono;
  u.uSepia = L.sepia;
  u.uAccHue = L.accHue;
  u.uAccW = L.accW;
  u.uAccHue2 = L.accHue2;
  u.uAccW2 = L.accW2;
  setRgb(u.uTint as Float32Array, L.tint);
  u.uTintAmt = L.tintAmt;
  u.uCanvas = L.canvas;
  u.uPaper = L.paper;
  u.uDirt = L.dirt;
  // flicker is a brightness pulse: «Reducir destellos» keeps it tiny
  u.uFlicker = p.reduceFlashes ? Math.min(0.15, L.flicker) : L.flicker;
  u.uScratch = L.scratch;
  u.uWarm = L.warm;
  u.uExpo = L.expo;
  u.uDuo = L.duo;
  setRgb(u.uDuoA as Float32Array, L.duoA);
  setRgb(u.uDuoB as Float32Array, L.duoB);
  const mo = u.uMotion as Float32Array;
  mo[0] = p.motion[0];
  mo[1] = p.motion[1];
  const he = u.uHeat as Float32Array;
  he[0] = p.heat[0];
  he[1] = p.heat[1];
  he[2] = p.heat[2];
  const da = u.uDirtAt as Float32Array;
  da[0] = p.dirtAt[0];
  da[1] = p.dirtAt[1];
  u.uPx = p.px;
}

/**
 * The stock tile (512², tileable): r = canvas weave, g = paper fibers, b = lens dirt (smudges + bokeh dust), a = 1.
 * Baked once per film by a shader (≈ 2 ms).
 */
export function bakeTile(b: Baker): Texture {
  return b.shade(
    'tile',
    512,
    512,
    `${BAKE_UV}
void main() {
  vec2 uv = bakeUV();
  vec2 p = uv * 512.0;
  // canvas: a twill weave (threads over / under) with irregular thread thickness
  float tx = sin(p.x * 1.15 + pnoise(uv * vec2(8.0, 64.0), 8.0) * 2.0);
  float ty = sin(p.y * 1.15 + pnoise(uv * vec2(64.0, 8.0), 8.0) * 2.0);
  float over = step(0.5, fract((floor(p.x / 2.7) + floor(p.y / 2.7)) * 0.5));
  float weave = mix(tx, ty, over) * 0.5 + 0.5;
  weave = mix(weave, pfbm(uv * 16.0, 16.0), 0.35);
  // paper: long fibers + pulp mottling
  float fib = 0.0;
  for (int i = 0; i < 3; i++) {
    float a = float(i) * 2.1;
    vec2 d = vec2(cos(a), sin(a));
    fib += smoothstep(0.82, 1.0, pnoise(vec2(dot(uv, d) * 90.0, dot(uv, vec2(-d.y, d.x)) * 6.0) + float(i) * 13.0, 90.0));
  }
  float pulp = pfbm(uv * 8.0, 8.0);
  float paper = clamp(0.72 + pulp * 0.42 - fib * 0.06, 0.0, 1.0);
  // lens dirt: soft smudges + a few round dust bokeh
  float dirt = smoothstep(0.55, 0.85, pfbm(uv * 3.0 + 7.0, 3.0)) * 0.35;
  for (int i = 0; i < 14; i++) {
    vec2 c = vec2(hash12(vec2(float(i), 1.0)), hash12(vec2(float(i), 2.0)));
    float r = 0.012 + 0.03 * hash12(vec2(float(i), 3.0));
    vec2 d = abs(uv - c); d = min(d, 1.0 - d);
    float k = 1.0 - smoothstep(r * 0.7, r, length(d));
    dirt += k * (0.25 + 0.35 * hash12(vec2(float(i), 4.0)));
  }
  finalColor = vec4(weave, paper, clamp(dirt, 0.0, 1.0), 1.0);
}`,
    {},
    {},
    { res: 1 },
  );
}
