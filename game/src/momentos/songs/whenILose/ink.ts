/**
 * WHEN I LOSE — «TINTA Y PERGAMINO»: the two arts the same set is drawn in (docs/part-ii/29 §14).
 *
 *  INK FILTER (one full-screen pass on the world, another on the plates): the set is built ONCE in color (an
 *  illuminated manuscript: lapis, vermilion, malachite, gold leaf) and this pass redraws it, per pixel, in one of two
 *  arts — or both at once across a FRONT that spreads like ink in water:
 *    style 0 · SUMI-E   paper with fibres, a three-step ink wash with wet edges and granulation, a dry brush line with
 *                       pressure (from the luminance edges), the line «boils» on threes like hand-drawn animation.
 *                       The seals (type layer) keep their vermilion.
 *    style 1 · ILLUMINATED   the color itself, warmer and richer, thin sepia outlines, and GOLD LEAF: every gold-hued
 *                       pixel turns metallic (a slow sheen band + sparkles that catch the light on the beat).
 *  The front (centre, radius, softness) eats one art into the other through a noisy edge, with a burning gold rim.
 *  `blank` drains everything to an empty page (the valley). Same elements, redrawn — the owner's idea.
 *
 *  MINIATURE BAKE (once per cat, at load): the MAI painting with a sepia line, an umber outline and a gold rim light
 *  — a painted miniature. NEVER the cel bake of NEÓN CEL: no flat cel shadows, no screentone.
 */
import { Filter, GlProgram, RenderTexture, Sprite, Texture, type Renderer } from 'pixi.js';
import { rgb3 } from '../../anime/shaders';

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

const NOISE = `
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) { return noise(p) * 0.55 + noise(p * 2.03 + 17.0) * 0.3 + noise(p * 4.1 + 41.0) * 0.15; }
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
vec3 un(vec4 c) { return c.a > 0.001 ? c.rgb / c.a : vec3(0.0); }
vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + 1e-10)), d / (q.x + 1e-10), q.x);
}`;

const INK_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec4 uInputClamp;
uniform vec4 uOutputFrame;
uniform vec3 uXf;
uniform float uStyleIn;
uniform float uStyleOut;
uniform vec3 uFront;
uniform float uSoft;
uniform float uTime;
uniform float uBeat;
uniform vec3 uPaper;
uniform vec3 uInk;
uniform vec3 uGold;
uniform vec3 uSepia;
uniform float uLine;
uniform float uBoil;
uniform float uBlank;
uniform float uWash;
uniform float uHq;
uniform float uLift;
${NOISE}
void main() {
  // logical screen px → design px (the 1920×1080 box)
  vec2 spx = uOutputFrame.xy + vTextureCoord * uInputSize.xy;
  vec2 d = (spx - uXf.xy) / uXf.z;
  vec2 px = uInputSize.zw;
  // the line boils on threes: the sample wobbles a little, re-seeded every step
  vec2 wob = vec2(noise(d * 0.03 + uTime * 13.1), noise(d * 0.03 + 31.0 + uTime * 9.7)) - 0.5;
  vec2 uv = clamp(vTextureCoord + wob * uBoil * uXf.z * px, uInputClamp.xy, uInputClamp.zw);
  vec4 c = texture(uTexture, uv);
  vec3 col = un(c);
  float l = lum(col);
  // luminance edges (Sobel at the brush width) → the line
  float s = uLine * uXf.z;
  vec2 o = px * s;
  float tl = lum(un(texture(uTexture, clamp(uv + vec2(-o.x, -o.y), uInputClamp.xy, uInputClamp.zw))));
  float tc = lum(un(texture(uTexture, clamp(uv + vec2(0.0, -o.y), uInputClamp.xy, uInputClamp.zw))));
  float tr = lum(un(texture(uTexture, clamp(uv + vec2(o.x, -o.y), uInputClamp.xy, uInputClamp.zw))));
  float ml = lum(un(texture(uTexture, clamp(uv + vec2(-o.x, 0.0), uInputClamp.xy, uInputClamp.zw))));
  float mr = lum(un(texture(uTexture, clamp(uv + vec2(o.x, 0.0), uInputClamp.xy, uInputClamp.zw))));
  float bl = lum(un(texture(uTexture, clamp(uv + vec2(-o.x, o.y), uInputClamp.xy, uInputClamp.zw))));
  float bc = lum(un(texture(uTexture, clamp(uv + vec2(0.0, o.y), uInputClamp.xy, uInputClamp.zw))));
  float br = lum(un(texture(uTexture, clamp(uv + vec2(o.x, o.y), uInputClamp.xy, uInputClamp.zw))));
  float gx = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br;
  float gy = -tl - 2.0 * tc - tr + bl + 2.0 * bc + br;
  float e = sqrt(gx * gx + gy * gy);
  // ---- which art: the front eats one into the other through a noisy, inky edge
  float inside = 0.0;
  float rim = 0.0;
  if (uFront.z > 0.0) {
    float n = fbm(d * 0.0045) - 0.5;
    float rr = uFront.z * (1.0 + n * 0.55) + (noise(d * 0.04) - 0.5) * 40.0;
    float dist = length(d - uFront.xy);
    inside = 1.0 - smoothstep(rr - uSoft, rr + uSoft * 0.25, dist);
    rim = exp(-abs(dist - rr) / max(4.0, uSoft * 0.45));
  }
  float st = clamp(mix(uStyleOut, uStyleIn, inside), 0.0, 1.0);
  // paper (both arts are on the same page)
  float fib = noise(vec2(d.x * 0.9, d.y * 0.12)) * 0.5 + noise(d * 0.35) * 0.5;
  float blot = fbm(mat2(0.8, -0.6, 0.6, 0.8) * d * 0.006);
  vec3 paper = uPaper * (0.92 + 0.06 * fib + 0.05 * blot);
  // ---- SUMI-E
  vec3 ink = paper;
  if (st < 0.999) {
    // the brush paints FORM, not darkness: a local mean (a ring at ~14 design px) drives a local-contrast tone, and
    // dark regions are lifted into the middle washes — a dark-furred cat reads as washes + paper highlights, never as
    // a black blot; the silhouette's inner edge darkens like a loaded brush and the paper halos around it
    float mean = (l + tl + tc + tr + ml + mr + bl + bc + br) / 9.0;
    // structure: the same ring gives the gradient at brush scale — fur and paper grain have fine edges everywhere, a
    // silhouette has a coherent one; the fine line is kept light inside textures (no scribbled blots)
    float structure = 1.0;
    if (uHq > 0.5) {
      vec2 o2 = px * 14.0 * uXf.z;
      float acc = 0.0;
      vec2 gB = vec2(0.0);
      for (int k = 0; k < 8; k++) {
        float a = float(k) * 0.7853982 + 0.3927;
        vec2 dir = vec2(cos(a), sin(a));
        float lk = lum(un(texture(uTexture, clamp(uv + dir * o2, uInputClamp.xy, uInputClamp.zw))));
        acc += lk;
        gB += dir * lk;
      }
      mean = (mean * 9.0 + acc) / 17.0;
      structure = smoothstep(0.05, 0.16, length(gB) * 0.25);
    }
    float la = clamp(l + 1.1 * (l - mean) + uLift * smoothstep(0.45, 0.1, mean), 0.0, 1.0);
    // sumi-e is mostly paper: only the dark half of the picture takes ink, in three washes
    float dk = 1.0 - la;
    float wash = clamp(pow(smoothstep(0.26, 0.92, dk), 1.2) * uWash, 0.0, 1.0);
    float gn = fbm(mat2(0.8, -0.6, 0.6, 0.8) * d * 0.011) - 0.5;
    float x = wash * 3.0 + gn * 0.45 * wash;
    float fr = fract(x);
    float q = (floor(x) + smoothstep(0.3, 0.7, fr)) / 3.0;
    // wet edges: the pigment piles up where one wash meets the next
    float wet = (1.0 - smoothstep(0.0, 0.14, abs(fr - 0.5))) * step(0.3, wash) * 0.18;
    float tone = clamp(q * 0.96 + wet, 0.0, 1.0);
    // granulation in the mid washes, the darkest stays velvety
    tone *= 0.9 + 0.16 * noise(mat2(0.8, 0.6, -0.6, 0.8) * d * 0.21 + 7.0) * (1.0 - tone * 0.6);
    float press = 0.55 + 0.7 * noise(d * 0.018 + 3.0);
    float dry = smoothstep(0.25, 0.75, noise(vec2(d.x * 0.08, d.y * 0.9)));
    float line = smoothstep(0.24, 0.55, e) * press * (0.75 + 0.25 * dry) * mix(0.3, 1.0, structure);
    ink = mix(paper, uInk, clamp(tone * 0.92, 0.0, 1.0));
    ink = mix(ink, uInk * 0.8, clamp(line, 0.0, 1.0));
  }
  // ---- ILLUMINATED
  vec3 il = col;
  if (st > 0.001) {
    il = clamp(mix(vec3(l), col, 1.12), 0.0, 1.0);
    vec3 hsv = rgb2hsv(col);
    float goldM = smoothstep(0.07, 0.095, hsv.x) * (1.0 - smoothstep(0.15, 0.175, hsv.x)) * smoothstep(0.32, 0.5, hsv.y) * smoothstep(0.32, 0.5, hsv.z);
    float band = pow(0.5 + 0.5 * sin((d.x * 0.7 + d.y) * 0.006 - uTime * 1.6), 10.0);
    float spark = step(0.992 - 0.01 * uBeat, hash(floor(d / 4.0) + floor(uTime * 6.0)));
    vec3 leaf = mix(uGold * 0.72, uGold * 1.25, smoothstep(0.35, 0.85, hsv.z)) * (0.82 + 0.5 * band + 0.25 * uBeat) + spark * 0.6;
    il = mix(il, leaf, goldM * 0.85);
    il *= 0.94 + 0.06 * fib;
    il = mix(il, uSepia, smoothstep(0.22, 0.6, e) * 0.62);
  }
  vec3 outc = mix(ink, il, st);
  // the burning gold rim of the front
  outc = mix(outc, uGold * (1.05 + 0.3 * noise(d * 0.05 + uTime * 3.0)), clamp(rim * 0.85, 0.0, 1.0) * step(0.0, uFront.z));
  // the valley: everything drains to an empty page (a few lines stay)
  if (uBlank > 0.001) {
    float keep = smoothstep(0.3, 0.6, e) * (1.0 - smoothstep(0.55, 1.0, uBlank));
    outc = mix(outc, mix(paper * 1.04, uInk, keep * 0.6), uBlank);
  }
  finalColor = vec4(clamp(outc, 0.0, 1.0) * c.a, c.a);
}`;

export interface InkLook {
  paper: number;
  ink: number;
  gold: number;
  sepia: number;
}
export const LOOK: InkLook = { paper: 0xf1e6cf, ink: 0x15131c, gold: 0xe6b84a, sepia: 0x3a2414 };

export class InkFilter extends Filter {
  constructor(hq: boolean) {
    super({
      glProgram: GlProgram.from({ vertex: VERTEX, fragment: INK_FRAG, name: 'wil-ink' }),
      resources: {
        ink: {
          uXf: { value: new Float32Array([0, 0, 1]), type: 'vec3<f32>' },
          uStyleIn: { value: 0, type: 'f32' },
          uStyleOut: { value: 0, type: 'f32' },
          uFront: { value: new Float32Array([960, 540, -1]), type: 'vec3<f32>' },
          uSoft: { value: 90, type: 'f32' },
          uTime: { value: 0, type: 'f32' },
          uBeat: { value: 0, type: 'f32' },
          uPaper: { value: rgb3(LOOK.paper), type: 'vec3<f32>' },
          uInk: { value: rgb3(LOOK.ink), type: 'vec3<f32>' },
          uGold: { value: rgb3(LOOK.gold), type: 'vec3<f32>' },
          uSepia: { value: rgb3(LOOK.sepia), type: 'vec3<f32>' },
          uLine: { value: 2.2, type: 'f32' },
          uBoil: { value: 1.6, type: 'f32' },
          uBlank: { value: 0, type: 'f32' },
          uWash: { value: 1.08, type: 'f32' },
          uHq: { value: hq ? 1 : 0, type: 'f32' },
          uLift: { value: 0.17, type: 'f32' },
        },
      },
    });
  }
  get u() {
    return this.resources.ink.uniforms as Record<string, number | Float32Array>;
  }
  set3(name: string, hex: number) {
    const a = this.u[name] as Float32Array;
    a[0] = ((hex >> 16) & 255) / 255;
    a[1] = ((hex >> 8) & 255) / 255;
    a[2] = (hex & 255) / 255;
  }
  /** design box → screen: the container's world transform (scale a, offset tx, ty) */
  setXf(tx: number, ty: number, s: number) {
    const a = this.u.uXf as Float32Array;
    a[0] = tx;
    a[1] = ty;
    a[2] = s;
  }
  setFront(x: number, y: number, r: number) {
    const a = this.u.uFront as Float32Array;
    a[0] = x;
    a[1] = y;
    a[2] = r;
  }
}

// ------------------------------------------------------------------ the miniature bake (cats)
const MINI_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec3 uLineCol;
uniform vec3 uRim;
uniform vec2 uLight;
uniform float uLine;
${NOISE}
void main() {
  vec2 px = uInputSize.zw;
  vec2 uv = vTextureCoord;
  vec4 c = texture(uTexture, uv);
  float maxA = 0.0;
  float minA = 1.0;
  vec2 grad = vec2(0.0);
  for (int k = 0; k < 16; k++) {
    float a = float(k) * 0.39269908;
    vec2 dd = vec2(cos(a), sin(a));
    maxA = max(maxA, texture(uTexture, uv + dd * uLine * px).a);
    float sb = texture(uTexture, uv + dd * uLine * 0.5 * px).a;
    minA = min(minA, sb);
    grad += dd * sb;
  }
  if (c.a < 0.5) {
    float o = smoothstep(0.25, 0.6, maxA);
    float a = max(o, c.a);
    finalColor = vec4(mix(un(c), uLineCol, o) * a, a);
    return;
  }
  vec3 col = un(c);
  // a painted miniature: a touch more chroma, a soft sepia line from the luminance edges
  float l = lum(col);
  col = clamp(mix(vec3(l), col, 1.1), 0.0, 1.0);
  float e = 0.0;
  for (int k = 0; k < 4; k++) {
    vec2 dd = vec2(k == 0 ? 1.5 : k == 1 ? -1.5 : 0.0, k == 2 ? 1.5 : k == 3 ? -1.5 : 0.0) * px;
    e += abs(lum(un(texture(uTexture, uv + dd))) - l);
  }
  col = mix(col, uLineCol, smoothstep(0.12, 0.3, e) * 0.5);
  float inner = 1.0 - smoothstep(0.35, 0.75, minA);
  col = mix(col, uLineCol, inner * 0.85);
  vec2 nOut = -grad;
  float ln = length(nOut);
  float rim = ln > 0.01 ? clamp(dot(nOut / ln, normalize(uLight)), 0.0, 1.0) * (1.0 - smoothstep(0.55, 0.95, minA)) * (1.0 - inner) : 0.0;
  col = mix(col, uRim, smoothstep(0.35, 0.6, rim) * 0.7);
  finalColor = vec4(col * c.a, c.a);
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

/** the illuminated-miniature treatment (Studio `bake` hook): returns NEW textures */
export function bakeMiniature(renderer: Renderer, src: Texture): { tex: Texture; sil: Texture } {
  const res = src.source.resolution ?? 1;
  const scale = (src.width * res) / 1050;
  const mini = new Filter({
    glProgram: GlProgram.from({ vertex: VERTEX, fragment: MINI_FRAG, name: 'wil-mini' }),
    resources: {
      m: {
        uLineCol: { value: rgb3(0x2a170c), type: 'vec3<f32>' },
        uRim: { value: rgb3(0xf6d27a), type: 'vec3<f32>' },
        uLight: { value: new Float32Array([0.7, -0.7]), type: 'vec2<f32>' },
        uLine: { value: Math.max(2, 6 * scale), type: 'f32' },
      },
    },
    resolution: res,
  });
  const tex = pass(renderer, src, mini);
  const silF = new Filter({ glProgram: GlProgram.from({ vertex: VERTEX, fragment: SIL_FRAG, name: 'wil-sil' }), resources: {}, resolution: res });
  const sil = pass(renderer, tex, silF);
  return { tex, sil };
}
