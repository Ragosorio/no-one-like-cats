/**
 * PELÍCULAS — one-time treatments of the owner-approved MAI cat paintings, per style (the Studio's `bake` hook,
 * momentos/anime/actor.ts). Each returns NEW textures of the painting's exact size, so the CatPuppet rig animates the
 * treated painting unchanged at zero per-frame cost: «el gato visitante con su pintura de siempre, pasada por la lente».
 *
 *   impasto   Van Gogh: colour smeared ALONG the form (line-integral convolution over the edge flow), ridges of paint
 *             catching a light, cobalt outline, shadows to ultramarine, lights to chrome yellow, brushy border
 *   sketch    Da Vinci: sepia ink from the edges (wobbly), left-handed hatching ↘ that crosses as it darkens, a touch of
 *             sanguine on the mid-tones, the paper shows through (alpha = ink)
 *   noir      high-contrast B&W-ish stock with a hard rim light from the lamp side (the post finishes the mono)
 *   acuarela  pigment that pools at the edges, granulation, soft wet border
 *   ukiyoe    flat woodblock colours (4 levels on an indigo / vermilion / ochre / cream key), a bold outline, wood grain
 *   mudo      orthochromatic grey with crushed blacks (the post adds sepia, flicker and scratches)
 */
import { Container, Filter, GlProgram, RenderTexture, Sprite, type Renderer, type Texture } from 'pixi.js';
import { NOISE, VERTEX } from '../gl';
import { siluetaKeep } from '../../momentos/songs/drunck/silueta';
import { catRig } from '../../art/puppetCore';
import { bakeTv } from '../../momentos/songs/drunck/tv';

export type CatBake = (renderer: Renderer, src: Texture, slug?: string) => { tex: Texture; sil: Texture };

function pass(renderer: Renderer, src: Texture, frag: string, u: Record<string, { value: number | Float32Array; type: string }>): RenderTexture {
  const res = src.source.resolution ?? 1;
  const f = new Filter({
    glProgram: GlProgram.from({ vertex: VERTEX, fragment: frag }),
    resources: { u: { uTexel: { value: new Float32Array([1 / (src.width * res), 1 / (src.height * res)]), type: 'vec2<f32>' }, uScale: { value: (src.width * res) / 1050, type: 'f32' }, ...u } },
    resolution: res,
  });
  const sp = new Sprite(src);
  sp.filters = [f];
  const rt = RenderTexture.create({ width: src.width, height: src.height, resolution: res, antialias: false });
  const wrap = new Container();
  wrap.addChild(sp);
  renderer.render({ container: wrap, target: rt, clear: true });
  sp.filters = [];
  wrap.destroy({ children: true });
  f.destroy();
  return rt;
}

const HEAD = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputClamp;
uniform vec2 uTexel;
uniform float uScale;
${NOISE}
vec4 S(vec2 uv) { return texture(uTexture, clamp(uv, uInputClamp.xy, uInputClamp.zw)); }
vec3 C(vec2 uv) { vec4 c = S(uv); return c.a > 0.0 ? c.rgb / c.a : vec3(0.0); }
float L(vec2 uv) { vec4 c = S(uv); return c.a > 0.0 ? lum(c.rgb / c.a) * c.a + (1.0 - c.a) : 1.0; }
vec2 grad(vec2 uv, float r) {
  vec2 e = uTexel * r;
  float tl = L(uv + vec2(-e.x, -e.y)), t = L(uv + vec2(0.0, -e.y)), tr = L(uv + vec2(e.x, -e.y));
  float l = L(uv + vec2(-e.x, 0.0)), rr = L(uv + vec2(e.x, 0.0));
  float bl = L(uv + vec2(-e.x, e.y)), b = L(uv + vec2(0.0, e.y)), br = L(uv + vec2(e.x, e.y));
  return vec2((tr + 2.0 * rr + br) - (tl + 2.0 * l + bl), (bl + 2.0 * b + br) - (tl + 2.0 * t + tr));
}
`;

const SIL = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
void main() { float a = texture(uTexture, vTextureCoord).a; finalColor = vec4(vec3(a), a); }`;

function withSil(renderer: Renderer, tex: RenderTexture): { tex: Texture; sil: Texture } {
  return { tex, sil: pass(renderer, tex, SIL, {}) };
}
const f1 = (value: number) => ({ value, type: 'f32' });

// ------------------------------------------------------------------ Van Gogh
const IMPASTO = `${HEAD}
uniform float uLen;
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.01) { finalColor = vec4(0.0); return; }
  // the flow: along the edges (perpendicular to the gradient), a swirl in flat areas
  vec2 g = grad(uv, 3.0 * uScale);
  float gm = length(g);
  float sw = vnoise(uv * 9.0) * 6.2831;
  vec2 flow = gm > 0.04 ? normalize(vec2(-g.y, g.x)) : vec2(cos(sw), sin(sw));
  // line integral convolution: the colour smeared along the flow (a brush stroke)
  vec3 acc = vec3(0.0); float w = 0.0;
  vec2 p = uv; vec2 d = flow;
  for (int i = 0; i < 9; i++) {
    vec4 s = S(p);
    acc += (s.a > 0.0 ? s.rgb / s.a : vec3(0.0)) * s.a; w += s.a;
    vec2 gg = grad(p, 3.0 * uScale);
    if (length(gg) > 0.04) { vec2 nd = normalize(vec2(-gg.y, gg.x)); d = dot(nd, d) < 0.0 ? -nd : nd; }
    p += d * uTexel * uLen * uScale;
  }
  p = uv; d = -flow;
  for (int i = 0; i < 9; i++) {
    p += d * uTexel * uLen * uScale;
    vec4 s = S(p);
    acc += (s.a > 0.0 ? s.rgb / s.a : vec3(0.0)) * s.a; w += s.a;
    vec2 gg = grad(p, 3.0 * uScale);
    if (length(gg) > 0.04) { vec2 nd = normalize(vec2(-gg.y, gg.x)); d = dot(nd, d) < 0.0 ? -nd : nd; }
  }
  vec3 col = acc / max(w, 1e-3);
  // paint ridges: striations along the flow, lit from the upper left
  vec2 nrm = vec2(-flow.y, flow.x);
  float across = dot(uv / uTexel, nrm) / (5.0 * uScale);
  float along = dot(uv / uTexel, flow) / (26.0 * uScale);
  float cell = floor(across) + floor(along + hash12(vec2(floor(across), 3.0)) * 4.0) * 17.0;
  float ridge = sin(fract(across) * 3.14159);
  float hl = (hash12(vec2(cell, 1.0)) - 0.5) * 0.3 + (ridge - 0.6) * 0.3 * dot(nrm, normalize(vec2(-0.6, -0.8)));
  // colour script: saturate, shadows to ultramarine, lights to chrome yellow, a few stroke-wise hue jumps
  float l = lum(col);
  col = mix(vec3(l), col, 1.35);
  col = mix(col, vec3(0.14, 0.2, 0.55), (1.0 - smoothstep(0.1, 0.45, l)) * 0.55);
  col = mix(col, vec3(1.0, 0.86, 0.35), smoothstep(0.62, 0.95, l) * 0.35);
  col += hl;
  col = floor(col * 6.0 + 0.5) / 6.0 * 0.5 + col * 0.5;
  // the cobalt outline on strong edges (his portraits are drawn in blue)
  float edge = smoothstep(0.35, 0.9, length(grad(uv, 2.0 * uScale)));
  col = mix(col, vec3(0.1, 0.16, 0.42), edge * 0.85);
  // a brushy border: the alpha is broken by stroke ends
  float a = c0.a;
  float brush = vnoise(vec2(across * 0.6, along * 2.0));
  a = smoothstep(0.25 + brush * 0.5, 0.75 + brush * 0.25, a);
  finalColor = vec4(clamp(col, 0.0, 1.0) * a, a);
}`;
export const impastoBake: CatBake = (r, src) => withSil(r, pass(r, src, IMPASTO, { uLen: f1(2.3) }));

// ------------------------------------------------------------------ Da Vinci
const SKETCH = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.01) { finalColor = vec4(0.0); return; }
  vec2 px = uv / uTexel / uScale;
  // a hand never draws a perfect line: the samples wobble
  vec2 wob = (vec2(vnoise(px * 0.05), vnoise(px * 0.05 + 9.0)) - 0.5) * 3.0 * uTexel * uScale;
  float l = L(uv + wob);
  float e1 = length(grad(uv + wob, 1.5 * uScale));
  float e2 = length(grad(uv + wob, 4.0 * uScale));
  float ink = smoothstep(0.18, 0.55, e1 * 0.7 + e2 * 0.5);
  // the silhouette contour (alpha edge), drawn twice slightly offset (a searching line)
  float ae = 0.0;
  for (int i = 0; i < 4; i++) {
    float a = float(i) * 1.5708;
    vec2 o = vec2(cos(a), sin(a)) * 2.5 * uScale * uTexel;
    ae += abs(S(uv + o).a - c0.a);
  }
  ink = max(ink, smoothstep(0.2, 0.9, ae));
  // left-handed hatching: strokes run down to the right (↘), cross (↙) as it darkens, a third pass in the deepest
  float sp = 6.5;
  float h1 = 1.0 - smoothstep(0.18, 0.42, abs(fract((px.x + px.y) / sp + vnoise(px * 0.02) * 0.6) - 0.5) * 2.0);
  float h2 = 1.0 - smoothstep(0.18, 0.42, abs(fract((px.x - px.y) / (sp * 1.1) + vnoise(px * 0.02 + 5.0) * 0.6) - 0.5) * 2.0);
  float h3 = 1.0 - smoothstep(0.2, 0.45, abs(fract(px.y / (sp * 0.8)) - 0.5) * 2.0);
  float shade = 1.0 - l;
  float hatch = h1 * smoothstep(0.28, 0.5, shade) + h2 * smoothstep(0.5, 0.7, shade) + h3 * smoothstep(0.72, 0.9, shade) * 0.8;
  // hatch strokes break up (they are short strokes, not a screen)
  hatch *= smoothstep(0.25, 0.6, vnoise(vec2((px.x - px.y) * 0.08, (px.x + px.y) * 0.5)));
  // sanguine (red chalk) on the mid-tones, a little
  float sang = smoothstep(0.25, 0.5, shade) * (1.0 - smoothstep(0.55, 0.8, shade)) * 0.35 * smoothstep(0.4, 0.7, vnoise(px * 0.03 + 3.0));
  vec3 inkC = vec3(0.24, 0.14, 0.07);
  vec3 sangC = vec3(0.63, 0.27, 0.16);
  float aInk = clamp(ink * 0.95 + hatch * 0.62, 0.0, 1.0);
  vec3 col = mix(sangC, inkC, aInk / max(aInk + sang, 1e-3));
  float a = clamp(aInk + sang, 0.0, 1.0) * smoothstep(0.0, 0.3, c0.a);
  finalColor = vec4(col * a, a);
}`;
export const sketchBake: CatBake = (r, src) => {
  const tex = pass(r, src, SKETCH, {});
  // the silhouette of the PAINTING (not of the sparse ink) — for shadows and ghosts
  return { tex, sil: pass(r, src, SIL, {}) };
};

// ------------------------------------------------------------------ noir
const NOIR = `${HEAD}
uniform vec2 uLight;
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.01) { finalColor = vec4(0.0); return; }
  vec3 col = c0.rgb / c0.a;
  float l = lum(col);
  // hard stock: an S-curve, desaturated (the post's mono finishes it and keeps the warm accent)
  float s = smoothstep(0.08, 0.85, l);
  s = s * s * (3.0 - 2.0 * s);
  col = mix(vec3(s), col * (s / max(l, 0.05)), 0.75);
  // rim light: the alpha edge on the light side burns white
  vec2 o = normalize(uLight) * 5.0 * uScale * uTexel;
  float behind = S(uv + o).a;
  float rim = clamp(c0.a - behind, 0.0, 1.0);
  float rim2 = clamp(c0.a - S(uv + o * 2.5).a, 0.0, 1.0) * 0.5;
  col = mix(col, vec3(1.0, 0.97, 0.9), clamp(rim * 1.4 + rim2, 0.0, 1.0));
  // deep shadow on the far side
  float far = clamp(c0.a - S(uv - o * 3.0).a, 0.0, 1.0);
  col *= 1.0 - far * 0.4;
  finalColor = vec4(col * c0.a, c0.a);
}`;
export const noirBake = (light: [number, number] = [1, -0.4]): CatBake => (r, src) => withSil(r, pass(r, src, NOIR, { uLight: { value: new Float32Array(light), type: 'vec2<f32>' } }));

// ------------------------------------------------------------------ presets
const ACUARELA = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.01) { finalColor = vec4(0.0); return; }
  vec3 acc = vec3(0.0); float w = 0.0;
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 0.5236;
    vec2 o = vec2(cos(a), sin(a)) * (4.0 + 3.0 * mod(float(i), 2.0)) * uScale * uTexel;
    vec4 s = S(uv + o); acc += (s.a > 0.0 ? s.rgb / s.a : vec3(1.0)) * s.a; w += s.a;
  }
  vec3 col = mix(c0.rgb / c0.a, acc / max(w, 1e-3), 0.7);
  col = mix(col, vec3(1.0), 0.18);
  vec2 px = uv / uTexel / uScale;
  float gran = vnoise(px * 0.35) * 0.6 + vnoise(px * 1.3) * 0.4;
  float edge = smoothstep(0.1, 0.6, length(grad(uv, 3.0 * uScale)));
  col *= 1.0 - edge * 0.35 - (gran - 0.5) * 0.12;
  float a = c0.a * smoothstep(0.15, 0.65, c0.a + (vnoise(px * 0.08) - 0.5) * 0.6);
  finalColor = vec4(clamp(col, 0.0, 1.0) * a, a);
}`;
const UKIYOE = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.01) { finalColor = vec4(0.0); return; }
  vec3 col = c0.rgb / c0.a;
  float l = lum(col);
  float q = floor(l * 4.0) / 3.0;
  vec3 indigo = vec3(0.12, 0.17, 0.3), verm = vec3(0.78, 0.25, 0.18), ochre = vec3(0.86, 0.66, 0.36), cream = vec3(0.95, 0.91, 0.82);
  float warm = smoothstep(-0.05, 0.15, col.r - col.b);
  vec3 key = q < 0.34 ? indigo : q < 0.67 ? mix(indigo * 1.6, verm, warm) : q < 0.99 ? mix(cream * 0.9, ochre, warm) : cream;
  col = mix(key, col, 0.25);
  vec2 px = uv / uTexel / uScale;
  col *= 0.94 + 0.06 * sin(px.y * 0.35 + vnoise(px * vec2(0.02, 0.2)) * 8.0);
  float edge = smoothstep(0.25, 0.6, length(grad(uv, 2.0 * uScale)));
  float ae = 0.0;
  for (int i = 0; i < 4; i++) { float a = float(i) * 1.5708; ae += abs(S(uv + vec2(cos(a), sin(a)) * 3.0 * uScale * uTexel).a - c0.a); }
  col = mix(col, vec3(0.08, 0.07, 0.1), clamp(edge + smoothstep(0.2, 0.8, ae), 0.0, 1.0));
  finalColor = vec4(col * c0.a, c0.a);
}`;
const MUDO = `${HEAD}
void main() {
  vec4 c0 = S(vTextureCoord);
  if (c0.a < 0.01) { finalColor = vec4(0.0); return; }
  vec3 col = c0.rgb / c0.a;
  // orthochromatic film: reds go dark, blues go light
  float g = dot(col, vec3(0.12, 0.55, 0.45));
  g = smoothstep(0.06, 0.92, g);
  finalColor = vec4(vec3(g) * c0.a, c0.a);
}`;
export const acuarelaBake: CatBake = (r, src) => withSil(r, pass(r, src, ACUARELA, {}));
export const ukiyoeBake: CatBake = (r, src) => withSil(r, pass(r, src, UKIYOE, {}));
export const mudoBake: CatBake = (r, src) => withSil(r, pass(r, src, MUDO, {}));

// ------------------------------------------------------------------ the finale (wave 3)
/** the painting as it is (the game's own paint: «a sangre, sin filtros») */
const PLANO = `${HEAD}
void main() { finalColor = S(vTextureCoord); }`;
export const planoBake: CatBake = (r, src) => withSil(r, pass(r, src, PLANO, {}));

/**
 * GRIS — Canelo without his flame: cold grey, a touch darker, and his scarf painted over with his own grey fur (the
 * scarf lies on the ground as a code-drawn object). Regions = the painting's kept accessory (silueta.ts presets).
 */
const GRIS = `${HEAD}
uniform vec4 uR1;
uniform vec4 uR2;
uniform float uA1;
float inEll(vec2 uv, vec4 r, float a) {
  vec2 d = uv - r.xy;
  vec2 q = vec2(cos(a) * d.x + sin(a) * d.y, -sin(a) * d.x + cos(a) * d.y) / max(r.zw, vec2(1e-4));
  return 1.0 - smoothstep(0.75, 1.15, length(q));
}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.01) { finalColor = vec4(0.0); return; }
  vec3 col = c0.rgb / c0.a;
  float l = lum(col);
  // the scarf: replaced by the fur around it (sampled outside the region, then greyed)
  float m = max(inEll(uv, uR1, uA1), inEll(uv, uR2, 0.0) * 0.9);
  if (m > 0.0) {
    vec3 fur = vec3(0.0); float w = 0.0;
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.785;
      vec2 o = vec2(cos(a), sin(a)) * (uR1.zw + uR2.zw) * 0.9;
      vec4 s = S(uv + o); fur += (s.a > 0.0 ? s.rgb / s.a : vec3(0.0)) * s.a; w += s.a;
    }
    fur /= max(w, 1e-3);
    col = mix(col, fur, m * 0.85);
    l = lum(col);
  }
  vec3 g = mix(vec3(l), col, 0.12) * vec3(0.92, 0.96, 1.04) * 0.86;
  finalColor = vec4(g * c0.a, c0.a);
}`;
export const grisBake: CatBake = (r, src, slug) => {
  const keep = (slug && siluetaKeep(slug)) || [];
  const size = (slug && catRig(slug)?.size) || [700, 700];
  const reg = (i: number) => {
    const k = keep[i];
    return k ? new Float32Array([k[0] / size[0], k[1] / size[1], (k[2] / size[0]) * 1.15, (k[3] / size[1]) * 1.15]) : new Float32Array([-9, -9, 0.001, 0.001]);
  };
  return withSil(r, pass(r, src, GRIS, { uR1: { value: reg(0), type: 'vec4<f32>' }, uR2: { value: reg(1), type: 'vec4<f32>' }, uA1: f1(keep[0]?.[4] ?? 0) }));
};

/** VIDRIO — hand-painted glass for the magic lantern: flat aniline colours, dark leading, a glow through the glass */
const VIDRIO = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.01) { finalColor = vec4(0.0); return; }
  vec3 col = c0.rgb / c0.a;
  float l = lum(col);
  // anilines: few saturated, luminous tones (amber, blue, rose), hue kept
  vec3 sat = mix(vec3(l), col, 1.6);
  vec3 q = floor(sat * 4.0 + 0.5) / 4.0;
  col = mix(q, sat, 0.35) * (0.85 + 0.35 * l);
  // the painter's dark outline (the lead of the slide)
  float e = smoothstep(0.3, 0.8, length(grad(uv, 2.0 * uScale)));
  col = mix(col, vec3(0.12, 0.07, 0.04), e * 0.85);
  // brush texture in the paint
  vec2 px = uv / uTexel / uScale;
  col *= 0.9 + 0.12 * vnoise(px * vec2(0.05, 0.4));
  finalColor = vec4(col * c0.a * 0.92, c0.a * 0.92);
}`;
export const vidrioBake: CatBake = (r, src) => withSil(r, pass(r, src, VIDRIO, {}));

/**
 * KLIMT — gold leaf: the painting's mid-tones become gold mosaic (squares, spirals, eyes), the lights stay painted
 * flesh-soft, a dark gold outline. «El beso» (1908), «Retrato de Adele Bloch-Bauer I» (1907).
 */
const KLIMT = `${HEAD}
vec3 gold(vec2 px, float l) {
  vec2 cell = floor(px / 14.0);
  vec2 f = fract(px / 14.0) - 0.5;
  float kind = hash12(cell);
  float m = 0.0;
  if (kind < 0.35) m = step(max(abs(f.x), abs(f.y)), 0.38);                       // squares
  else if (kind < 0.6) { float a = atan(f.y, f.x); float r = length(f); m = step(0.5, fract(r * 9.0 - a / 6.2831 * 2.0)); } // spirals
  else if (kind < 0.75) m = 1.0 - smoothstep(0.12, 0.2, length(f)) + step(abs(length(f) - 0.32), 0.05); // eyes
  else m = 0.6;
  vec3 g1 = vec3(0.86, 0.66, 0.22), g2 = vec3(0.55, 0.38, 0.1), g3 = vec3(0.98, 0.86, 0.45);
  vec3 c = mix(g2, g1, m);
  c = mix(c, g3, smoothstep(0.75, 1.0, vnoise(px * 0.08)) * 0.6);
  return c * (0.75 + 0.4 * l);
}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.01) { finalColor = vec4(0.0); return; }
  vec3 col = c0.rgb / c0.a;
  float l = lum(col);
  vec2 px = uv / uTexel / uScale;
  vec3 g = gold(px, l);
  // the face and the lights stay painted; the body becomes the golden robe
  float keepPaint = smoothstep(0.22, 0.5, l);
  vec3 painted = mix(vec3(l), col, 0.8) * vec3(1.04, 0.98, 0.9);
  col = mix(g, painted, keepPaint);
  float e = smoothstep(0.35, 0.85, length(grad(uv, 2.0 * uScale)));
  col = mix(col, vec3(0.16, 0.1, 0.03), e * 0.85);
  // the dark contour Klimt draws round his figures
  float ae = 0.0;
  for (int i = 0; i < 4; i++) { float a = float(i) * 1.5708; ae += abs(S(uv + vec2(cos(a), sin(a)) * 3.0 * uScale * uTexel).a - c0.a); }
  col = mix(col, vec3(0.1, 0.06, 0.02), clamp(ae * 1.5, 0.0, 1.0));
  finalColor = vec4(col * c0.a, c0.a);
}`;
export const klimtBake: CatBake = (r, src) => withSil(r, pass(r, src, KLIMT, {}));

/**
 * LINOCUT (Posada) — two inks: black and the paper. Threshold with carved gouge lines that follow the form; the lights
 * are cut away. José Guadalupe Posada, «La Calavera Catrina» (c. 1910–1913), broadsides of Vanegas Arroyo.
 */
const LINO = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.01) { finalColor = vec4(0.0); return; }
  float l = L(uv);
  vec2 g = grad(uv, 3.0 * uScale);
  vec2 dir = length(g) > 0.02 ? normalize(vec2(-g.y, g.x)) : vec2(0.7, 0.7);
  vec2 px = uv / uTexel / uScale;
  // gouge lines across the form, thinner where it is lit
  float across = dot(px, vec2(-dir.y, dir.x)) / 7.0;
  float line = abs(fract(across + vnoise(px * 0.03) * 0.8) - 0.5) * 2.0;
  float cut = smoothstep(l * 1.1 - 0.15, l * 1.1, line);
  float ink = 1.0 - max(cut * smoothstep(0.25, 0.6, l), smoothstep(0.78, 0.9, l));
  // the outline is always ink
  ink = max(ink, smoothstep(0.25, 0.7, length(grad(uv, 2.0 * uScale))));
  vec3 paper = vec3(0.93, 0.88, 0.76);
  vec3 col = mix(paper, vec3(0.06, 0.05, 0.05), ink);
  finalColor = vec4(col * c0.a, c0.a);
}`;
export const linoBake: CatBake = (r, src) => withSil(r, pass(r, src, LINO, {}));

/** REALISMO — the painting under natural light: a little desaturated, a soft key from above, a cool rim from the sky */
const REAL = `${HEAD}
uniform vec2 uLight;
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.01) { finalColor = vec4(0.0); return; }
  vec3 col = c0.rgb / c0.a;
  float l = lum(col);
  col = mix(vec3(l), col, 0.82);
  col = mix(col, col * vec3(0.8, 0.86, 1.0), 0.35);
  vec2 o = normalize(uLight) * 4.0 * uScale * uTexel;
  float rim = clamp(c0.a - S(uv + o).a, 0.0, 1.0);
  col = mix(col, vec3(0.86, 0.92, 1.0), rim * 0.7);
  float shade = clamp(c0.a - S(uv - o * 2.5).a, 0.0, 1.0);
  col *= 1.0 - shade * 0.3;
  finalColor = vec4(col * c0.a, c0.a);
}`;
export const realismoBake: CatBake = (r, src) => withSil(r, pass(r, src, REAL, { uLight: { value: new Float32Array([0.6, -0.8]), type: 'vec2<f32>' } }));

/** every cat treatment by name (SetModule.cats can ask for any: `{ slug, bake: 'gris' }`) */
export const CAT_BAKES: Record<string, CatBake> = {
  impasto: impastoBake,
  sketch: sketchBake,
  noir: noirBake([1, -0.35]),
  acuarela: acuarelaBake,
  ukiyoe: ukiyoeBake,
  mudo: mudoBake,
  plano: planoBake,
  gris: grisBake,
  vidrio: vidrioBake,
  klimt: klimtBake,
  lino: linoBake,
  realismo: realismoBake,
  tv: bakeTv,
};
