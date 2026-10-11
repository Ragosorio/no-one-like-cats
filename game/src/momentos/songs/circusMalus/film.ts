/**
 * CIRCUS MALUS — «FUNCIÓN DE FERIA 1930»: the Momento's own post filter and its cat bake (docs/part-ii/29 §15).
 *
 * FILM (StageApi.post, one pass after the toolkit's): the whole picture is projected on old film.
 *   mode       0 = black-and-white nitrate (silver with a warm sepia toe) · 1 = TWO-STRIP Technicolor (orange-red vs
 *              cyan-green, no true blue or yellow: the early-30s color) · 2 = true color. Two modes at once: `mode1`
 *              fills a band around the SYMMETRY AXIS of width `wipe` (a symmetric wipe from the centre out).
 *   film       grain (24 fps), projector flicker, gate scratches and dust, a rounded projector vignette, an IRIS
 *   symmetry   `sym` mirrors the left half onto the right, from the axis out (the world «corrected» into perfect symmetry)
 *   the break  `burn` a hole burning through the film (true color inside, a charred glowing rim) · `tear` the frame torn
 *              along the axis (the halves slip apart) · `slip` the frame slipping off the sprockets (the frame line shows)
 *
 * TOON (Studio bake, once per cat, zero per frame): the MAI painting as a 1930s cartoon cel — smoothed, three flat
 * tones per hue, thick black ink outline and black inner lines, no screentone, no rim (never NEÓN CEL's look).
 */
import { Filter, GlProgram, RenderTexture, Sprite, type Renderer, type Texture } from 'pixi.js';

const VERTEX = `in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
vec4 filterVertexPosition(void) {
  vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
  return vec4(position, 0.0, 1.0);
}
vec2 filterTextureCoord(void) { return aPosition * (uOutputFrame.zw * uInputSize.zw); }
void main(void) { gl_Position = filterVertexPosition(); vTextureCoord = filterTextureCoord(); }`;

const FILM_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec4 uInputClamp;
uniform float uMode0;
uniform float uMode1;
uniform float uWipe;
uniform float uGrain;
uniform float uFlick;
uniform float uVig;
uniform float uScratch;
uniform float uSeed;
uniform float uPx;
uniform float uIris;
uniform vec2 uIrisC;
uniform float uSym;
uniform float uBurn;
uniform vec2 uBurnC;
uniform float uTear;
uniform float uSlip;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
vec3 un(vec4 c) { return c.a > 0.0001 ? c.rgb / c.a : vec3(0.0); }
float vn(float x) { float i = floor(x); float f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(hash(vec2(i, 1.7)), hash(vec2(i + 1.0, 1.7)), f); }
vec3 bw(vec3 c) {
  float l = lum(c);
  l = smoothstep(0.03, 0.97, l);
  // silver nitrate: neutral mids, a warm sepia toe in the shadows, creamy highlights
  vec3 s = vec3(l) * vec3(1.03, 1.0, 0.93) + vec3(0.025, 0.012, 0.0) * (1.0 - l);
  return s;
}
vec3 twoStrip(vec3 c) {
  // two records (red / green), so blue and yellow don't exist: red-orange vs cyan-green, warm creams
  float gb = c.g * 0.6 + c.b * 0.4;
  vec3 t = vec3(c.r * 0.92 + 0.04, gb * 0.86 + c.r * 0.1, gb * 0.8 + 0.035);
  float l = lum(t);
  return clamp(mix(vec3(l), t, 1.22), 0.0, 1.0);
}
vec3 styled(vec3 c, float mode) {
  if (mode <= 1.0) return mix(bw(c), twoStrip(c), clamp(mode, 0.0, 1.0));
  return mix(twoStrip(c), c, clamp(mode - 1.0, 0.0, 1.0));
}
void main() {
  vec2 lim = max(uInputClamp.zw, vec2(0.0001));
  vec2 n = vTextureCoord / lim;
  float aspect = (uInputSize.x * lim.x) / max(1.0, uInputSize.y * lim.y);
  // ---- the frame slips off the sprockets: the picture jumps by a fraction of a frame, the frame line shows
  float frameLine = 0.0;
  if (abs(uSlip) > 0.0001) {
    float fy = fract(n.y + uSlip);
    frameLine = 1.0 - smoothstep(0.012, 0.03, min(fy, 1.0 - fy));
    n.y = fy;
  }
  // ---- torn along the axis: the right half slips down, the left up, a jagged white tear between them
  float dxa = n.x - 0.5;
  float tearLine = 0.0;
  if (uTear > 0.0001) {
    float jag = (vn(n.y * 38.0) - 0.5) * 0.018 + (vn(n.y * 9.0 + 3.0) - 0.5) * 0.03;
    float d = dxa - jag;
    tearLine = 1.0 - smoothstep(0.002, 0.004 + 0.012 * uTear, abs(d));
    n.y += sign(d) * uTear * 0.035;
    n.x += sign(d) * uTear * 0.012;
  }
  // ---- perfect symmetry: the right side reads the left side mirrored, from the axis outward
  if (uSym > 0.0001 && dxa > 0.0 && dxa < uSym * 0.5 + 0.00001) n.x = 0.5 - dxa;
  vec2 uv = clamp(n * lim, uInputClamp.xy, uInputClamp.zw);
  vec4 c = texture(uTexture, uv);
  vec3 col = un(c);
  // ---- the style: a symmetric wipe of mode1 around the axis
  float mode = abs(dxa) < uWipe * 0.5 ? uMode1 : uMode0;
  vec3 s = styled(col, mode);
  // ---- the burn: true color through the hole, a charred rim, an ember glow just outside
  float inside = 0.0;
  if (uBurn > 0.0001) {
    vec2 bp = (n - uBurnC) * vec2(aspect, 1.0);
    float an = atan(bp.y, bp.x);
    float wob = (vn(an * 3.0 + 11.0) - 0.5) * 0.06 + (vn(an * 9.0) - 0.5) * 0.025;
    float bd = length(bp) * (1.0 + wob);
    inside = 1.0 - smoothstep(uBurn - 0.003, uBurn, bd);
    float rim = (1.0 - smoothstep(uBurn, uBurn + 0.028, bd)) * (1.0 - inside);
    float ember = (1.0 - smoothstep(uBurn + 0.01, uBurn + 0.07, bd)) * (1.0 - inside);
    s = mix(s, col, inside);
    s = mix(s, vec3(1.0, 0.62, 0.22), ember * 0.55);
    s = mix(s, vec3(0.09, 0.05, 0.03), rim * 0.92);
  }
  // ---- the film itself (not inside the hole: there is no film there any more)
  float filmOn = 1.0 - inside;
  float fr = uSeed;
  s *= 1.0 + uFlick * (hash(vec2(fr, 3.1)) - 0.5) * filmOn;
  vec2 gp = floor(n * uInputSize.xy * lim / max(1.0, 1.6 * uPx));
  s += (hash(gp + fr * 7.13) - 0.5) * uGrain * filmOn;
  if (uScratch > 0.001) {
    for (int i = 0; i < 2; i++) {
      float hx = hash(vec2(fr + float(i) * 17.0, 9.0));
      float on = step(0.45, hash(vec2(fr, float(i) + 4.0)));
      float w = (0.0008 + 0.0012 * hash(vec2(fr, float(i) + 8.0)));
      float sc = (1.0 - smoothstep(w * 0.5, w, abs(n.x - hx))) * on;
      s = mix(s, vec3(0.92, 0.9, 0.84), sc * 0.55 * uScratch * filmOn);
    }
    // dust: a few specks per frame (dark), and the odd hair
    vec2 dc = floor(n * vec2(aspect, 1.0) * 90.0);
    float dust = step(0.9993, hash(dc + fr * 3.7));
    s = mix(s, vec3(0.05), dust * uScratch * filmOn);
  }
  // ---- projector vignette (rounded rectangle) + iris
  vec2 q = abs(n - 0.5) * 2.0;
  float rr = pow(pow(q.x, 6.0) + pow(q.y, 6.0), 1.0 / 6.0);
  s *= 1.0 - uVig * smoothstep(0.62, 1.08, rr);
  if (uIris < 1.5) {
    float ir = length((n - uIrisC) * vec2(aspect, 1.0));
    s *= 1.0 - smoothstep(uIris, uIris + 0.006, ir);
  }
  s = mix(s, vec3(0.97, 0.95, 0.9), tearLine);
  s = mix(s, vec3(0.04), frameLine * 0.95);
  finalColor = vec4(clamp(s, 0.0, 1.0), 1.0);
}`;

export interface FilmState {
  mode0: number;
  mode1: number;
  wipe: number;
  grain: number;
  flick: number;
  vig: number;
  scratch: number;
  iris: number;
  irisX: number;
  irisY: number;
  sym: number;
  burn: number;
  burnX: number;
  burnY: number;
  tear: number;
  slip: number;
}

export class FilmFilter extends Filter {
  constructor(pxScale = 1) {
    super({
      glProgram: GlProgram.from({ vertex: VERTEX, fragment: FILM_FRAG, name: 'circus-film' }),
      resources: {
        film: {
          uMode0: { value: 0, type: 'f32' },
          uMode1: { value: 0, type: 'f32' },
          uWipe: { value: 0, type: 'f32' },
          uGrain: { value: 0.07, type: 'f32' },
          uFlick: { value: 0.06, type: 'f32' },
          uVig: { value: 0.5, type: 'f32' },
          uScratch: { value: 1, type: 'f32' },
          uSeed: { value: 0, type: 'f32' },
          uPx: { value: pxScale, type: 'f32' },
          uIris: { value: 2, type: 'f32' },
          uIrisC: { value: new Float32Array([0.5, 0.5]), type: 'vec2<f32>' },
          uSym: { value: 0, type: 'f32' },
          uBurn: { value: 0, type: 'f32' },
          uBurnC: { value: new Float32Array([0.5, 0.5]), type: 'vec2<f32>' },
          uTear: { value: 0, type: 'f32' },
          uSlip: { value: 0, type: 'f32' },
        },
      },
    });
  }
  get u() {
    return this.resources.film.uniforms as Record<string, number | Float32Array>;
  }
  /** push a frame (seed = the 24 fps film frame: grain / flicker / scratches change 24 times a second) */
  set(s: FilmState, seed: number) {
    const u = this.u;
    u.uMode0 = s.mode0;
    u.uMode1 = s.mode1;
    u.uWipe = s.wipe;
    u.uGrain = s.grain;
    u.uFlick = s.flick;
    u.uVig = s.vig;
    u.uScratch = s.scratch;
    u.uSeed = seed;
    u.uIris = s.iris;
    const ic = u.uIrisC as Float32Array;
    ic[0] = s.irisX;
    ic[1] = s.irisY;
    u.uSym = s.sym;
    u.uBurn = s.burn;
    const bc = u.uBurnC as Float32Array;
    bc[0] = s.burnX;
    bc[1] = s.burnY;
    u.uTear = s.tear;
    u.uSlip = s.slip;
  }
}

// ------------------------------------------------------------------ the cat bake: a 1930s cartoon cel
const TOON_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform float uLine;
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
vec3 un(vec4 c) { return c.a > 0.001 ? c.rgb / c.a : vec3(0.0); }
void main() {
  vec2 px = uInputSize.zw;
  vec2 uv = vTextureCoord;
  vec4 c = texture(uTexture, uv);
  // ---- fat outer outline (alpha dilation) and the inner silhouette line
  float maxA = 0.0;
  float minA = 1.0;
  for (int k = 0; k < 16; k++) {
    float a = float(k) * 0.39269908;
    vec2 d = vec2(cos(a), sin(a));
    maxA = max(maxA, texture(uTexture, uv + d * uLine * px).a);
    minA = min(minA, texture(uTexture, uv + d * uLine * 0.35 * px).a);
  }
  vec3 ink = vec3(0.07, 0.06, 0.06);
  if (c.a < 0.5) {
    float o = smoothstep(0.2, 0.55, maxA);
    float a = max(o, c.a);
    finalColor = vec4(ink * a, a);
    return;
  }
  // ---- smoothed color (a small box blur flattens the fur strokes into cartoon patches)
  vec3 sm = vec3(0.0);
  float n = 0.0;
  for (int i = -2; i <= 2; i++) {
    for (int j = -2; j <= 2; j++) {
      vec4 s = texture(uTexture, uv + vec2(float(i), float(j)) * px * uLine * 0.28);
      if (s.a > 0.5) { sm += un(s); n += 1.0; }
    }
  }
  sm = n > 0.0 ? sm / n : un(c);
  float l = lum(sm);
  // ---- three flat tones per hue: shadow · body · light (a cartoon cel: no gradients)
  float t = l < 0.3 ? 0.22 : (l < 0.66 ? 0.56 : 0.9);
  vec3 chroma = sm / max(l, 0.05);
  vec3 cel = clamp(chroma * t, 0.0, 1.0);
  cel = mix(vec3(lum(cel)), cel, 0.85);
  // the eyes and the brightest catches survive (a cartoon keeps its shine)
  vec3 o = un(c);
  cel = mix(cel, o, smoothstep(0.86, 0.95, lum(o)) * 0.8);
  // ---- black ink lines from the luminance edges (Sobel on the smoothed picture)
  float e = 0.0;
  {
    float s1 = 1.6;
    float tl = lum(un(texture(uTexture, uv + vec2(-s1, -s1) * px)));
    float tc = lum(un(texture(uTexture, uv + vec2(0.0, -s1) * px)));
    float tr = lum(un(texture(uTexture, uv + vec2(s1, -s1) * px)));
    float ml = lum(un(texture(uTexture, uv + vec2(-s1, 0.0) * px)));
    float mr = lum(un(texture(uTexture, uv + vec2(s1, 0.0) * px)));
    float bl = lum(un(texture(uTexture, uv + vec2(-s1, s1) * px)));
    float bc = lum(un(texture(uTexture, uv + vec2(0.0, s1) * px)));
    float br = lum(un(texture(uTexture, uv + vec2(s1, s1) * px)));
    float gx = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br;
    float gy = -tl - 2.0 * tc - tr + bl + 2.0 * bc + br;
    e = sqrt(gx * gx + gy * gy);
  }
  cel = mix(cel, ink, smoothstep(0.9, 1.5, e) * 0.9);
  float inner = 1.0 - smoothstep(0.3, 0.7, minA);
  cel = mix(cel, ink, inner);
  finalColor = vec4(cel * c.a, c.a);
}`;

const SIL_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
void main() {
  float a = texture(uTexture, vTextureCoord).a;
  finalColor = vec4(vec3(a), a);
}`;

function pass(renderer: Renderer, src: Texture, filter: Filter): RenderTexture {
  const sp = new Sprite(src);
  sp.filters = [filter];
  const rt = RenderTexture.create({ width: src.width, height: src.height, resolution: src.source.resolution ?? 1, antialias: false });
  renderer.render({ container: sp, target: rt, clear: true });
  sp.filters = [];
  sp.destroy();
  filter.destroy();
  return rt;
}

/** the Studio bake (anime/actor.ts Studio `bake`): new textures, the painting's exact size */
export function bakeToon(renderer: Renderer, src: Texture): { tex: Texture; sil: Texture } {
  const res = src.source.resolution ?? 1;
  const scale = (src.width * res) / 1050;
  const toon = new Filter({
    glProgram: GlProgram.from({ vertex: VERTEX, fragment: TOON_FRAG, name: 'circus-toon' }),
    resources: { t: { uLine: { value: Math.max(2.5, 9 * scale), type: 'f32' } } },
    resolution: res,
  });
  const tex = pass(renderer, src, toon);
  const sil = pass(renderer, src, new Filter({ glProgram: GlProgram.from({ vertex: VERTEX, fragment: SIL_FRAG, name: 'circus-sil' }), resources: {}, resolution: res }));
  return { tex, sil };
}
