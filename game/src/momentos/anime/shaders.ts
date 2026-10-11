/**
 * Momentos shaders (Pixi v8 / WebGL2).
 *
 *  POST (one full-screen pass on the Momento's scene, every frame on the high tier; only during impacts on low):
 *    section grade (saturation + split tone toward the palette's shade / glow), screentone dots in the shadows,
 *    vignette, chromatic misregistration pulses, soft flashes, and the IMPACT FRAME (2-tone + accent, optionally
 *    inverted) blended by `impact`.
 *
 *  CEL BAKE (runs ONCE per cat per Momento, at load): the MAI painting → Kuwahara (flattens the painterly fur into cel
 *  patches while keeping edges) → luminance posterized into 4 soft steps (hue kept) → colored ink lines from luminance
 *  edges → a fat outer outline → a rim light on the key-light side → fine screentone in the deepest band. The result is
 *  a RenderTexture with the painting's exact size, so the CatPuppet rig (normalized UVs) animates it unchanged and the
 *  treatment costs NOTHING per frame.
 */
import { Filter, GlProgram, RenderTexture, Sprite, Texture, type Renderer } from 'pixi.js';

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

export const rgb3 = (hex: number) => new Float32Array([((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255]);

// ------------------------------------------------------------------ POST
const POST_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec4 uInputClamp;
uniform vec3 uShade;
uniform vec3 uGlow;
uniform float uSat;
uniform float uTone;
uniform float uVig;
uniform float uAberr;
uniform float uDot;
uniform float uImpact;
uniform float uImpInvert;
uniform vec3 uImpInk;
uniform vec3 uImpPaper;
uniform vec3 uImpAcc;
uniform float uFlash;
uniform vec3 uFlashCol;
uniform float uGrade;
uniform vec2 uCenter;
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
void main() {
  vec2 uv = vTextureCoord;
  vec4 c = texture(uTexture, uv);
  if (uAberr > 0.01) {
    vec2 d = (uv - uCenter) * uAberr * uInputSize.zw * 8.0;
    c.r = texture(uTexture, clamp(uv + d, uInputClamp.xy, uInputClamp.zw)).r;
    c.b = texture(uTexture, clamp(uv - d, uInputClamp.xy, uInputClamp.zw)).b;
  }
  vec3 col = c.a > 0.0 ? c.rgb / c.a : vec3(0.0);
  float l = lum(col);
  vec3 g = col;
  if (uGrade > 0.0) {
    g = mix(vec3(l), col, uSat);
    float s = (1.0 - l);
    g = mix(g, uShade, s * s * 0.38);
    g = mix(g, uGlow, l * l * l * 0.22);
    // screentone: 45° dot grid in the shadows (manga print), radius grows as it darkens
    vec2 px = uv * uInputSize.xy;
    vec2 r = vec2(px.x + px.y, px.x - px.y) * 0.70710678 / uDot;
    vec2 cell = fract(r) - 0.5;
    float rad = clamp((0.46 - l) * 1.55, 0.0, 0.62) * uTone;
    float dotm = 1.0 - smoothstep(rad - 0.07, rad + 0.07, length(cell));
    g = mix(g, uShade, dotm * 0.6);
    // vignette toward the palette's shade
    vec2 q = uv / max(uInputClamp.zw, vec2(0.001)) - 0.5;
    float v = smoothstep(0.35, 0.95, length(q * vec2(1.0, 0.8)) * 1.25);
    g = mix(g, uShade, v * uVig);
    g = mix(col, g, uGrade);
  }
  // impact frame: hard 2-tone + accent on what was saturated
  if (uImpact > 0.0) {
    float t = smoothstep(0.40, 0.46, l);
    vec3 ink = mix(uImpInk, uImpPaper, uImpInvert);
    vec3 paper = mix(uImpPaper, uImpInk, uImpInvert);
    vec3 two = mix(ink, paper, t);
    float sat = max(max(col.r, col.g), col.b) - min(min(col.r, col.g), col.b);
    float acc = step(0.5, sat) * step(0.22, l) * step(l, 0.85);
    two = mix(two, uImpAcc, acc);
    g = mix(g, two, uImpact);
  }
  g = mix(g, uFlashCol, uFlash);
  finalColor = vec4(g * c.a, c.a);
}`;

export class PostFilter extends Filter {
  constructor() {
    super({
      glProgram: GlProgram.from({ vertex: VERTEX, fragment: POST_FRAG, name: 'momento-post' }),
      resources: {
        post: {
          uShade: { value: rgb3(0x120b2e), type: 'vec3<f32>' },
          uGlow: { value: rgb3(0xffffff), type: 'vec3<f32>' },
          uSat: { value: 1, type: 'f32' },
          uTone: { value: 0.2, type: 'f32' },
          uVig: { value: 0.35, type: 'f32' },
          uAberr: { value: 0, type: 'f32' },
          uDot: { value: 6, type: 'f32' },
          uImpact: { value: 0, type: 'f32' },
          uImpInvert: { value: 0, type: 'f32' },
          uImpInk: { value: rgb3(0x0b0716), type: 'vec3<f32>' },
          uImpPaper: { value: rgb3(0xfff8ec), type: 'vec3<f32>' },
          uImpAcc: { value: rgb3(0xff2e88), type: 'vec3<f32>' },
          uFlash: { value: 0, type: 'f32' },
          uFlashCol: { value: rgb3(0xffffff), type: 'vec3<f32>' },
          uGrade: { value: 1, type: 'f32' },
          uCenter: { value: new Float32Array([0.5, 0.5]), type: 'vec2<f32>' },
        },
      },
    });
  }
  get u() {
    return this.resources.post.uniforms as Record<string, number | Float32Array>;
  }
  set3(name: string, hex: number) {
    const a = this.u[name] as Float32Array;
    a[0] = ((hex >> 16) & 255) / 255;
    a[1] = ((hex >> 8) & 255) / 255;
    a[2] = (hex & 255) / 255;
  }
}

// ------------------------------------------------------------------ CEL BAKE
const KUWA_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform float uR;
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
void main() {
  vec2 px = uInputSize.zw;
  int R = int(uR);
  vec4 best = texture(uTexture, vTextureCoord);
  float bestV = 1e9;
  for (int q = 0; q < 4; q++) {
    vec2 sgn = vec2(q == 0 || q == 2 ? -1.0 : 1.0, q < 2 ? -1.0 : 1.0);
    vec4 sum = vec4(0.0);
    float s1 = 0.0;
    float s2 = 0.0;
    float n = 0.0;
    for (int i = 0; i <= 6; i++) {
      if (i > R) break;
      for (int j = 0; j <= 6; j++) {
        if (j > R) break;
        vec4 c = texture(uTexture, vTextureCoord + vec2(float(i), float(j)) * sgn * px);
        float l = lum(c.rgb);
        sum += c;
        s1 += l;
        s2 += l * l;
        n += 1.0;
      }
    }
    vec4 mean = sum / n;
    float m1 = s1 / n;
    float v = s2 / n - m1 * m1;
    if (v < bestV) { bestV = v; best = mean; }
  }
  finalColor = best;
}`;

const CEL_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec3 uInk;
uniform vec3 uRim;
uniform vec2 uLight;
uniform float uLine;
uniform float uEdge;
uniform float uLevels;
uniform float uDot;
uniform float uSat;
uniform sampler2D uOrig;
uniform vec4 uOutputFrame;
uniform float uFlat;
uniform vec3 uShadeTint;
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
vec3 un(vec4 c) { return c.a > 0.001 ? c.rgb / c.a : vec3(0.0); }
void main() {
  vec2 px = uInputSize.zw;
  vec2 uv = vTextureCoord;
  vec4 c = texture(uTexture, uv);
  // the sprite fills the whole output frame: its 0..1 position = the original's uv
  vec4 oc = texture(uOrig, (uv * uInputSize.xy) / uOutputFrame.zw);
  // ---- outer outline (alpha dilation) + edge normal (alpha gradient)
  float maxA = 0.0;
  float minA = 1.0;
  vec2 grad = vec2(0.0);
  for (int k = 0; k < 16; k++) {
    float a = float(k) * 0.39269908;
    vec2 d = vec2(cos(a), sin(a));
    float sa = texture(uTexture, uv + d * uLine * px).a;
    float sb = texture(uTexture, uv + d * uLine * 0.45 * px).a;
    maxA = max(maxA, sa);
    minA = min(minA, sb);
    grad += d * sb;
  }
  if (c.a < 0.5) {
    float o = smoothstep(0.25, 0.6, maxA);
    float a = max(o, c.a);
    vec3 col = mix(un(c), uInk, o);
    finalColor = vec4(col * a, a);
    return;
  }
  vec3 col = un(c);
  float l = lum(col);
  // ---- posterize luminance into soft steps, keep hue / saturation
  float x = l * uLevels;
  float lq = (floor(x) + smoothstep(0.42, 0.58, fract(x))) / uLevels;
  lq = clamp(lq * 0.92 + 0.06, 0.0, 1.0);
  vec3 chroma = col / max(l, 0.04);
  vec3 cel = clamp(chroma * lq, 0.0, 1.0);
  if (uFlat < 0.999) {
    // CEL OVER PAINT: shadow / light SHAPES come from the smoothed image (stable, cel-like), the color from a mix of
    // the flattened and the original painting — the eyes, the face and the identity stay
    vec3 o = un(oc);
    vec3 base = mix(o, col, uFlat);
    float shadowM = 1.0 - smoothstep(0.30, 0.34, l);
    float deepM = 1.0 - smoothstep(0.15, 0.19, l);
    float lightM = smoothstep(0.70, 0.74, l);
    vec3 shaded = base * mix(vec3(1.0), uShadeTint, shadowM * 0.55 + deepM * 0.2);
    cel = clamp(shaded * (1.0 + lightM * 0.10), 0.0, 1.0);
    // specular catches of the original (eyes) survive the smoothing
    float lo = lum(o);
    cel = mix(cel, o, smoothstep(0.82, 0.92, lo) * (1.0 - smoothstep(0.5, 0.6, l)));
    lq = mix(0.55, 0.12, shadowM);
  }
  float cl = lum(cel);
  cel = clamp(mix(vec3(cl), cel, uSat), 0.0, 1.0);
  // ---- ink lines from luminance edges (Sobel)
  float tl = lum(un(texture(uTexture, uv + vec2(-1.5, -1.5) * px)));
  float tc = lum(un(texture(uTexture, uv + vec2(0.0, -1.5) * px)));
  float tr = lum(un(texture(uTexture, uv + vec2(1.5, -1.5) * px)));
  float ml = lum(un(texture(uTexture, uv + vec2(-1.5, 0.0) * px)));
  float mr = lum(un(texture(uTexture, uv + vec2(1.5, 0.0) * px)));
  float bl = lum(un(texture(uTexture, uv + vec2(-1.5, 1.5) * px)));
  float bc = lum(un(texture(uTexture, uv + vec2(0.0, 1.5) * px)));
  float br = lum(un(texture(uTexture, uv + vec2(1.5, 1.5) * px)));
  float gx = -tl - 2.0 * ml - bl + tr + 2.0 * mr + br;
  float gy = -tl - 2.0 * tc - tr + bl + 2.0 * bc + br;
  float e = sqrt(gx * gx + gy * gy);
  float line = smoothstep(uEdge, uEdge * 1.7, e);
  vec3 lineCol = mix(uInk, cel * 0.35, 0.25);
  cel = mix(cel, lineCol, line * 0.85);
  // ---- inner silhouette line (just inside the outline)
  float inner = 1.0 - smoothstep(0.35, 0.75, minA);
  cel = mix(cel, uInk, inner * 0.9);
  // ---- rim light on the key-light side, near the silhouette
  vec2 nOut = -grad;
  float ln = length(nOut);
  float rim = 0.0;
  if (ln > 0.01) rim = clamp(dot(nOut / ln, normalize(uLight)), 0.0, 1.0) * (1.0 - smoothstep(0.55, 0.95, minA)) * (1.0 - inner);
  cel = mix(cel, uRim, smoothstep(0.35, 0.6, rim) * 0.75);
  // ---- screentone in the deepest band
  vec2 p = uv * uInputSize.xy;
  vec2 r = vec2(p.x + p.y, p.x - p.y) * 0.70710678 / uDot;
  float dm = 1.0 - smoothstep(0.22, 0.3, length(fract(r) - 0.5));
  float deep = 1.0 - smoothstep(0.18, 0.3, lq);
  cel = mix(cel, cel * 0.55, dm * deep);
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

export interface CelOpts {
  ink?: number;
  rim?: number;
  /** key light direction (texture space, +x right, +y down) */
  light?: [number, number];
  /** outline width in texels of the painting */
  line?: number;
  /** Kuwahara radius (texels) */
  radius?: number;
  levels?: number;
  edge?: number;
  sat?: number;
  dot?: number;
  /** 1 = fully flattened posterize · <1 = cel over paint (that much of the flattened color over the original) */
  flat?: number;
  /** multiply color of the cel shadow (cool, slightly violet by default) */
  shadeTint?: number;
}

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

/**
 * The one-time cel treatment of a painting → { tex, sil } (sil = white silhouette, tint it for smears / ghosts).
 * Textures are owned by the caller (destroy(true) on dispose).
 */
export function bakeCel(renderer: Renderer, src: Texture, o: CelOpts = {}): { tex: RenderTexture; sil: RenderTexture } {
  const res = src.source.resolution ?? 1;
  const scale = (src.width * res) / 1050; // tuned on the 1050 px full-detail raster
  const kuwa = new Filter({
    glProgram: GlProgram.from({ vertex: VERTEX, fragment: KUWA_FRAG, name: 'momento-kuwahara' }),
    resources: { k: { uR: { value: Math.max(1, Math.min(6, Math.round((o.radius ?? 5) * scale))), type: 'f32' } } },
    resolution: res,
  });
  const rt1 = pass(renderer, src, kuwa);
  const cel = new Filter({
    glProgram: GlProgram.from({ vertex: VERTEX, fragment: CEL_FRAG, name: 'momento-cel' }),
    resources: {
      c: {
        uInk: { value: rgb3(o.ink ?? 0x1a0b35), type: 'vec3<f32>' },
        uRim: { value: rgb3(o.rim ?? 0xfff3c4), type: 'vec3<f32>' },
        uLight: { value: new Float32Array(o.light ?? [0.75, -0.65]), type: 'vec2<f32>' },
        uLine: { value: Math.max(2, (o.line ?? 7) * scale), type: 'f32' },
        uEdge: { value: o.edge ?? 0.8, type: 'f32' },
        uLevels: { value: o.levels ?? 4, type: 'f32' },
        uDot: { value: Math.max(3, (o.dot ?? 6) * scale), type: 'f32' },
        uSat: { value: o.sat ?? 1.05, type: 'f32' },
        uFlat: { value: o.flat ?? 0.5, type: 'f32' },
        uShadeTint: { value: rgb3(o.shadeTint ?? 0x8f86c8), type: 'vec3<f32>' },
      },
      uOrig: src.source,
    },
    resolution: res,
  });
  const tex = pass(renderer, rt1, cel);
  rt1.destroy(true);
  const silF = new Filter({ glProgram: GlProgram.from({ vertex: VERTEX, fragment: SIL_FRAG, name: 'momento-sil' }), resources: {}, resolution: res });
  const sil = pass(renderer, tex, silF);
  return { tex, sil };
}
