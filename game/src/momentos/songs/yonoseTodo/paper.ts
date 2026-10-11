/**
 * YONOSE TODO — «ANIMATIC»: the shaders (Pixi v8 / WebGL2). Everything procedural: no image ever enters the repo.
 *
 *   SKY        (screen) the paper and the sky: a cold pencil night (light graphite hatching that thickens upward) that
 *              warms into a watercolor wash (blooms, backruns, granulation, a wet edge) and ends as the game's smooth
 *              painted sky. Night ↔ dawn colors.
 *   ANIMATIC   (the set, drawn in clean flat color underneath) redraws it per pixel in one of three arts:
 *                0  PENCIL      double sketchy lines from the color/alpha edges (they «boil»: the jitter field changes on
 *                               twos and on every kick), graphite catching the paper's tooth, hatching in the shadows,
 *                               paper inside every shape (a drawing occludes what is behind it), blue roughs
 *                1  WATERCOLOR  the shape's pigment over paper: granulation, backruns, darker wet edges, ragged
 *                               borders, the pencil still under it, lighter
 *                2  PAINT       the game's own look: the color as painted, a thin dark ink line
 *              The art is chosen PER PIXEL: a base `warm` plus two spreading blooms (a lantern; a sleeping cat's warmth,
 *              the cold open) with ragged watercolor fronts — color literally spreads across the drawing.
 *   WASH       a watercolor treatment for screen pieces (the credits' cards, the big words): granulation, edge pooling,
 *              ragged borders, a little bleed.
 *   PAPER      (StageApi.post, the whole scene) the sketchbook's grain and fibers + a soft vignette, so pencil, wash,
 *              type and paint all sit on the same paper.
 *
 * Coordinates: the sky and the set share one frame (the view rect, `filterArea`), so their paper and patterns line up.
 */
import { Filter, GlProgram, RenderTexture, Sprite, type Renderer, type Texture } from 'pixi.js';
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
float vnoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) { return vnoise(p) * 0.55 + vnoise(p * 2.13 + 7.1) * 0.3 + vnoise(p * 4.37 + 3.3) * 0.15; }
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
// a spreading watercolor bloom: amount inside a ragged front (r), 0 outside
float bloom(vec4 b, vec2 d) {
  if (b.w <= 0.0) return 0.0;
  float n = fbm(d * 0.011 + b.xy * 0.001) - 0.5;
  float dist = length(d - b.xy) + n * (60.0 + b.z * 0.12);
  return b.w * (1.0 - smoothstep(b.z - 26.0, b.z + 26.0, dist));
}
// the darker tide line at a bloom's front (watercolor pools where it stops)
float tide(vec4 b, vec2 d) {
  if (b.w <= 0.0 || b.z < 4.0) return 0.0;
  float n = fbm(d * 0.011 + b.xy * 0.001) - 0.5;
  float dist = length(d - b.xy) + n * (60.0 + b.z * 0.12);
  return smoothstep(30.0, 0.0, abs(dist - b.z)) * step(dist, b.z + 30.0);
}
`;

// ------------------------------------------------------------------ SKY
const SKY_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform vec4 uInputClamp;
uniform vec2 uView;
uniform float uWarm;
uniform vec4 uBloomA;
uniform vec4 uBloomB;
uniform float uNight;
uniform float uDawn;
uniform float uHorizon;
uniform float uBoil;
uniform vec3 uPaper;
uniform vec3 uGraphite;
${NOISE}
void main() {
  vec2 n = vTextureCoord / max(uInputClamp.zw, vec2(0.0001));
  vec2 d = n * uView;
  float w = clamp(uWarm + bloom(uBloomA, d) + bloom(uBloomB, d), 0.0, 2.0);
  // how high in the sky (1 at the top of the frame, 0 at the horizon)
  float hy = clamp(1.0 - d.y / max(1.0, uHorizon), 0.0, 1.0);
  // ---- pencil: the night as light graphite hatching, denser upward, a few blue roughs
  float jit = (vnoise(d * 0.02 + uBoil * 5.3) - 0.5) * 3.0;
  float s = (d.x * 0.6 + d.y + jit) / 11.0;
  float stroke = smoothstep(0.78, 0.97, 1.0 - abs(fract(s) - 0.5) * 2.0);
  float gap = step(0.42, vnoise(vec2(floor(s) * 3.1, d.x * 0.004 + floor(s))));
  float dens = smoothstep(0.15, 1.0, hy) * (0.35 + 0.65 * uNight);
  float hatch = stroke * gap * dens * (0.55 + 0.45 * vnoise(d * 0.7));
  vec3 pencil = mix(uPaper, uGraphite, hatch * 0.32);
  // ---- watercolor: night ↔ dawn washes, blooms and backruns, granulation, wet edge at the horizon
  vec3 nTop = vec3(0.13, 0.15, 0.32), nMid = vec3(0.24, 0.27, 0.49), nLow = vec3(0.47, 0.42, 0.6);
  vec3 dTop = vec3(0.5, 0.6, 0.86), dMid = vec3(0.97, 0.74, 0.7), dLow = vec3(1.0, 0.86, 0.6);
  vec3 top = mix(nTop, dTop, uDawn), mid = mix(nMid, dMid, uDawn), low = mix(nLow, dLow, uDawn);
  vec3 sky = hy > 0.5 ? mix(mid, top, (hy - 0.5) * 2.0) : mix(low, mid, hy * 2.0);
  float back = fbm(d * 0.004 + 3.7);
  float gran = fbm(d * 0.42);
  float pig = clamp(0.8 + (back - 0.5) * 0.55 - (gran - 0.5) * 0.32, 0.0, 1.0);
  vec3 wash = mix(uPaper, sky, pig * (0.55 + 0.45 * uNight + 0.3 * uDawn));
  float edge = smoothstep(0.06, 0.0, abs(hy - 0.02 - (back - 0.5) * 0.05));
  wash *= 1.0 - edge * 0.12;
  // ---- paint: the game's smooth sky
  vec3 paint = mix(uPaper * 0.2 + sky * 0.8, sky, 0.6);
  vec3 c = w < 1.0 ? mix(pencil, wash, w) : mix(wash, paint, w - 1.0);
  // the fronts of the blooms pool darker
  float t = max(tide(uBloomA, d), tide(uBloomB, d)) * clamp(w, 0.0, 1.0) * step(w, 1.6);
  c *= 1.0 - t * 0.16;
  finalColor = vec4(c, 1.0);
}`;

// ------------------------------------------------------------------ ANIMATIC
const ANIM_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec4 uInputClamp;
uniform vec2 uView;
uniform float uPx;
uniform float uWarm;
uniform vec4 uBloomA;
uniform vec4 uBloomB;
uniform float uBoil;
uniform float uBlue;
uniform float uLine;
uniform vec2 uEdge;
uniform float uHatch;
uniform float uTone;
uniform vec3 uPaper;
uniform vec3 uGraphite;
${NOISE}
vec4 tex(vec2 uv) { return texture(uTexture, clamp(uv, uInputClamp.xy, uInputClamp.zw)); }
vec3 un(vec4 c) { return c.a > 0.0001 ? c.rgb / c.a : vec3(1.0); }
// luminance over paper + alpha, for the edges
vec2 la(vec2 uv) { vec4 c = tex(uv); return vec2(mix(1.0, lum(un(c)), c.a), c.a); }
float edges(vec2 uv, vec2 st) {
  vec2 a = la(uv + vec2(-st.x, -st.y)), b = la(uv + vec2(0.0, -st.y)), c = la(uv + vec2(st.x, -st.y));
  vec2 d = la(uv + vec2(-st.x, 0.0)), f = la(uv + vec2(st.x, 0.0));
  vec2 g = la(uv + vec2(-st.x, st.y)), h = la(uv + vec2(0.0, st.y)), i = la(uv + vec2(st.x, st.y));
  vec2 gx = (c + 2.0 * f + i) - (a + 2.0 * d + g);
  vec2 gy = (g + 2.0 * h + i) - (a + 2.0 * b + c);
  float eL = length(vec2(gx.x, gy.x));
  float eA = length(vec2(gx.y, gy.y));
  return max(smoothstep(uEdge.x, uEdge.y, eL), smoothstep(0.3, 1.1, eA));
}
void main() {
  vec2 uv = vTextureCoord;
  vec2 n = uv / max(uInputClamp.zw, vec2(0.0001));
  vec2 d = n * uView;
  vec2 texel = uInputSize.zw;
  float w = clamp(uWarm + bloom(uBloomA, d) + bloom(uBloomB, d), 0.0, 2.0);
  float pen = clamp(1.0 - w, 0.0, 1.0);
  // the boil: a soft displacement field that is redrawn on twos (and on the kicks)
  float amp = 2.6 * (0.35 + 0.65 * pen) * step(w, 1.98);
  vec2 j1 = (vec2(vnoise(d * 0.017 + uBoil * 7.13), vnoise(d * 0.017 + 31.7 + uBoil * 3.31)) - 0.5) * amp;
  vec2 j2 = (vec2(vnoise(d * 0.013 + 11.0 + uBoil * 5.71), vnoise(d * 0.013 + 57.3 + uBoil * 2.17)) - 0.5) * amp * 1.9;
  vec2 st = texel * max(1.0, 1.15 * uPx);
  vec4 c = tex(uv + j1 * uPx * texel);
  vec3 col = un(c);
  float a = c.a;
  float e1 = edges(uv + j1 * uPx * texel, st);
  float e2 = pen > 0.02 ? edges(uv + j2 * uPx * texel, st * 1.35) : 0.0;
  float lines = max(e1, e2 * 0.5 * pen) * uLine;
  // graphite catches the paper's tooth (pressure varies along the stroke)
  float tooth = vnoise(d * 0.85) * 0.55 + vnoise(d * 2.3 + 4.0) * 0.45;
  float press = 0.62 + 0.38 * vnoise(d * 0.03 + uBoil);
  float ln = clamp(lines * mix(0.5, 1.0, tooth) * press, 0.0, 1.0);
  // hatching in the shadows (single, then crossed)
  float L = mix(1.0, lum(col), a);
  float dark = 1.0 - L;
  float hj = (vnoise(d * 0.05 + uBoil) - 0.5) * 1.6;
  float s1 = (d.x + d.y) / 7.5 + hj;
  float s2 = (d.x - d.y) / 8.5 + hj;
  float h1 = smoothstep(0.72, 0.95, 1.0 - abs(fract(s1) - 0.5) * 2.0);
  float h2 = smoothstep(0.75, 0.96, 1.0 - abs(fract(s2) - 0.5) * 2.0);
  float hatch = (h1 * smoothstep(0.42, 0.68, dark) + h2 * smoothstep(0.66, 0.9, dark)) * a * mix(0.55, 1.0, tooth) * uHatch;
  float graph = clamp(max(ln, hatch * 0.5), 0.0, 1.0);
  vec3 lineCol = mix(uGraphite, vec3(0.33, 0.5, 0.78), uBlue);
  // 0 · PENCIL: paper inside the shapes, graphite lines
  // (uTone: a light colored-pencil tone inside the shapes: the characters read as themselves, not as scribbles)
  vec3 toneC = mix(uPaper, mix(vec3(lum(col)), col, 0.6), 0.34);
  vec4 P = vec4(mix(mix(uPaper, toneC, uTone), lineCol, graph), 1.0) * max(a, graph);
  // 1 · WATERCOLOR
  float gran = fbm(d * 0.38);
  float back = fbm(d * 0.009 + 1.3);
  float r = 6.5 * uPx;
  float ab = (tex(uv + vec2(r, 0.0) * texel).a + tex(uv - vec2(r, 0.0) * texel).a + tex(uv + vec2(0.0, r) * texel).a + tex(uv - vec2(0.0, r) * texel).a) * 0.25;
  float wet = clamp((a - ab) * 2.2, 0.0, 1.0);
  float dens = clamp(0.82 + (back - 0.5) * 0.5 - (gran - 0.5) * 0.36, 0.0, 1.0);
  vec3 wc = mix(uPaper, col, dens);
  wc *= 1.0 - wet * 0.3 - e1 * 0.14;
  wc = mix(wc, col * 0.42 + uGraphite * 0.2, ln * 0.5);
  float aw = smoothstep(0.08 + gran * 0.42, 0.82, a);
  vec4 Wc = vec4(wc, 1.0) * max(aw, ln * 0.6 * a);
  // 2 · PAINT (the game: black ink, flat paint)
  vec4 c0 = tex(uv);
  vec3 col0 = un(c0);
  vec3 pc = mix(col0, vec3(0.09, 0.07, 0.08), e1 * 0.55 * uLine);
  vec4 Pc = vec4(pc, 1.0) * c0.a;
  vec4 o = w < 1.0 ? mix(P, Wc, w) : mix(Wc, Pc, w - 1.0);
  // the fronts of the blooms pool darker
  float t = max(tide(uBloomA, d), tide(uBloomB, d)) * clamp(w, 0.0, 1.0) * step(w, 1.6);
  o.rgb *= 1.0 - t * 0.2;
  finalColor = o;
}`;

// ------------------------------------------------------------------ WASH (screen pieces)
const WASH_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec4 uInputClamp;
uniform float uPx;
uniform float uSeed;
uniform float uWet;
uniform vec3 uPaper;
${NOISE}
vec4 tex(vec2 uv) { return texture(uTexture, clamp(uv, uInputClamp.xy, uInputClamp.zw)); }
void main() {
  vec2 uv = vTextureCoord;
  vec2 d = uv * uInputSize.xy / max(1.0, uPx);
  vec2 texel = uInputSize.zw;
  vec2 bl = (vec2(fbm(d * 0.02 + uSeed), fbm(d * 0.02 + 9.0 + uSeed)) - 0.5) * 7.0 * uWet * uPx;
  vec4 c = tex(uv + bl * texel);
  vec3 col = c.a > 0.0001 ? c.rgb / c.a : vec3(1.0);
  float gran = fbm(d * 0.4 + uSeed);
  float back = fbm(d * 0.012 + uSeed * 1.7);
  float r = 6.0 * uPx;
  float ab = (tex(uv + vec2(r, 0.0) * texel).a + tex(uv - vec2(r, 0.0) * texel).a + tex(uv + vec2(0.0, r) * texel).a + tex(uv - vec2(0.0, r) * texel).a) * 0.25;
  float wet = clamp((c.a - ab) * 2.4, 0.0, 1.0);
  float dens = clamp(0.84 + (back - 0.5) * 0.45 - (gran - 0.5) * 0.4, 0.0, 1.0);
  vec3 wc = mix(uPaper, col, dens) * (1.0 - wet * 0.3);
  float a = smoothstep(0.06 + gran * 0.4 * uWet, 0.8, c.a);
  finalColor = vec4(wc, 1.0) * a;
}`;

// ------------------------------------------------------------------ PAPER (post)
const PAPER_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputClamp;
uniform vec2 uView;
uniform float uGrain;
uniform float uVig;
uniform vec3 uVigCol;
${NOISE}
void main() {
  vec4 c = texture(uTexture, vTextureCoord);
  vec2 n = vTextureCoord / max(uInputClamp.zw, vec2(0.0001));
  vec2 d = n * uView;
  float g = 1.0 - uGrain * (0.55 * vnoise(d * 0.75) + 0.3 * vnoise(d * 2.2 + 3.0) + 0.6 * smoothstep(0.62, 1.0, vnoise(vec2(d.x * 0.035, d.y * 0.9) + 7.0)));
  float v = smoothstep(0.42, 1.05, length((n - 0.5) * vec2(1.0, 0.78)) * 1.32) * uVig;
  vec3 rgb = c.rgb * g;
  rgb = mix(rgb, uVigCol * c.a, v);
  finalColor = vec4(rgb, c.a);
}`;

const f32 = (v: number) => ({ value: v, type: 'f32' as const });
const v2 = (a: number, b: number) => ({ value: new Float32Array([a, b]), type: 'vec2<f32>' as const });
const v3 = (hex: number) => ({ value: rgb3(hex), type: 'vec3<f32>' as const });
const v4 = () => ({ value: new Float32Array(4), type: 'vec4<f32>' as const });

export const PAPER = 0xf4ecdc;
export const GRAPHITE = 0x34343c;

type U = Record<string, unknown>;
abstract class Base extends Filter {
  get u(): U {
    return (this.resources as { u: { uniforms: U } }).u.uniforms;
  }
  set3(name: string, hex: number) {
    const a = this.u[name] as Float32Array;
    a[0] = ((hex >> 16) & 255) / 255;
    a[1] = ((hex >> 8) & 255) / 255;
    a[2] = (hex & 255) / 255;
  }
  set4(name: string, x: number, y: number, z: number, w: number) {
    const a = this.u[name] as Float32Array;
    a[0] = x;
    a[1] = y;
    a[2] = z;
    a[3] = w;
  }
  view(w: number, h: number) {
    const a = this.u.uView as Float32Array;
    a[0] = w;
    a[1] = h;
  }
}

export class SkyFilter extends Base {
  constructor() {
    super({
      glProgram: GlProgram.from({ vertex: VERTEX, fragment: SKY_FRAG, name: 'yonose-sky' }),
      resources: {
        u: { uView: v2(1920, 1080), uWarm: f32(0), uBloomA: v4(), uBloomB: v4(), uNight: f32(1), uDawn: f32(0), uHorizon: f32(590), uBoil: f32(0), uPaper: v3(PAPER), uGraphite: v3(GRAPHITE) },
      },
    });
  }
}

export class AnimaticFilter extends Base {
  constructor(resolution?: number) {
    super({
      glProgram: GlProgram.from({ vertex: VERTEX, fragment: ANIM_FRAG, name: 'yonose-animatic' }),
      resources: {
        u: { uView: v2(1920, 1080), uPx: f32(1), uWarm: f32(0), uBloomA: v4(), uBloomB: v4(), uBoil: f32(0), uBlue: f32(0), uLine: f32(1), uEdge: v2(0.1, 0.42), uHatch: f32(1), uTone: f32(0), uPaper: v3(PAPER), uGraphite: v3(GRAPHITE) },
      },
      ...(resolution ? { resolution } : {}),
    });
  }
}

export class WashFilter extends Base {
  constructor(seed = 0, wet = 1) {
    super({
      glProgram: GlProgram.from({ vertex: VERTEX, fragment: WASH_FRAG, name: 'yonose-wash' }),
      resources: { u: { uPx: f32(1), uSeed: f32(seed), uWet: f32(wet), uPaper: v3(PAPER) } },
      padding: 8,
    });
  }
}

export class PaperFilter extends Base {
  constructor() {
    super({
      glProgram: GlProgram.from({ vertex: VERTEX, fragment: PAPER_FRAG, name: 'yonose-paper' }),
      resources: { u: { uView: v2(1920, 1080), uGrain: f32(0.09), uVig: f32(0.22), uVigCol: v3(0x8a7a66) } },
    });
  }
}

// ------------------------------------------------------------------ the actors' bake (the Studio's own treatment)
const SIL_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
void main() { float a = texture(uTexture, vTextureCoord).a; finalColor = vec4(vec3(a), a); }`;
/** Kuwahara (r = 5 texels): the painterly fur flattens into clean patches, so the pencil finds shapes, not hairs */
const COPY_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
void main() {
  vec2 px = uInputSize.zw * 1.6;
  vec4 best = texture(uTexture, vTextureCoord);
  float bestV = 1e9;
  for (int q = 0; q < 4; q++) {
    vec2 sgn = vec2(q == 0 || q == 2 ? -1.0 : 1.0, q < 2 ? -1.0 : 1.0);
    vec4 sum = vec4(0.0);
    float s1 = 0.0, s2 = 0.0, n = 0.0;
    for (int i = 0; i <= 4; i++) {
      for (int j = 0; j <= 4; j++) {
        vec4 c = texture(uTexture, vTextureCoord + vec2(float(i), float(j)) * sgn * px);
        float l = lum(c.rgb) + c.a;
        sum += c; s1 += l; s2 += l * l; n += 1.0;
      }
    }
    float m1 = s1 / n;
    float v = s2 / n - m1 * m1;
    if (v < bestV) { bestV = v; best = sum / n; }
  }
  finalColor = best;
}`;

function pass(renderer: Renderer, src: Texture, frag: string, name: string): RenderTexture {
  const res = src.source.resolution ?? 1;
  const f = new Filter({ glProgram: GlProgram.from({ vertex: VERTEX, fragment: frag, name }), resources: {}, resolution: res });
  const sp = new Sprite(src);
  sp.filters = [f];
  const rt = RenderTexture.create({ width: src.width, height: src.height, resolution: res, antialias: false });
  renderer.render({ container: sp, target: rt, clear: true });
  sp.filters = [];
  sp.destroy();
  f.destroy();
  return rt;
}
/**
 * The cats keep their own painting (the Animatic filter redraws them live, with the set, in pencil / watercolor / paint):
 * the bake is a plain copy (the Studio owns and frees it) and a white silhouette.
 */
export function bakePlain(renderer: Renderer, src: Texture): { tex: Texture; sil: Texture } {
  const tex = pass(renderer, src, COPY_FRAG, 'yonose-copy');
  const sil = pass(renderer, tex, SIL_FRAG, 'yonose-sil');
  return { tex, sil };
}
