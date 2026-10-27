/**
 * LA BORRACHA — «caricatura de TV» (docs/part-iii/06 §3, 07 §2.3): the dimension's own look, shared by the bar scene
 * (scenes/CajaScene.ts, the cines p3_bar_a / p3_bar_b / p3_salida) and the Momento «Drunck» (this folder).
 *
 *  - PALETTE  flat, saturated TV colors: beer amber, donut pink, bottle green, night blue. Never yellow skin, never a
 *             copy of any existing show: an original 90s-style TV cartoon.
 *  - LINE     one dark, UNIFORM line (a deep night-plum, never pure black) — the same weight everywhere.
 *  - SHADOW   at most one hard shadow per shape.
 *  - CATS     the MAI paintings baked ONCE (bakeTv, zero cost per frame): smoothed into flat patches, two tones per hue
 *             (body + one hard shadow), a saturation push, the uniform dark outline and a few inner lines. Not CIRCUS
 *             MALUS's 1930s toon (three grey-ish tones, black ink): this one is color TV. Canelo stays Canelo: the
 *             same painting, through this lens (06 §3).
 */
import { Filter, GlProgram, RenderTexture, Sprite, type Graphics, type Renderer, type Texture } from 'pixi.js';

// ------------------------------------------------------------------ the palette (TV colors)
export const TV = {
  /** the one line color (uniform weight): a deep night plum */
  line: 0x1d1430,
  night: 0x1f2a5c,
  nightD: 0x151d44,
  nightL: 0x2f3f86,
  amber: 0xf4a62a,
  amberD: 0xc9771a,
  amberL: 0xffd27a,
  foam: 0xfff6e0,
  foamD: 0xe9d6b0,
  pink: 0xff7fb0,
  pinkD: 0xd9578e,
  pinkL: 0xffc2da,
  green: 0x2e9a5a,
  greenD: 0x1d6b3d,
  greenL: 0x7fd39a,
  wood: 0x9a5530,
  woodD: 0x6e3820,
  woodL: 0xc77a45,
  cream: 0xfff3d6,
  brick: 0xb4483a,
  brickD: 0x86302a,
  chrome: 0xc9d3e6,
  chromeD: 0x8892ad,
  rain: 0x9fc4ff,
  neonPink: 0xff4fa0,
  neonBlue: 0x58d0ff,
  lantern: 0x8fd8ff,
  white: 0xffffff,
} as const;

/** line width of the set (design px at 1920×1080): the same everywhere (the style's rule) */
export const LW = 6;

/** a closed polygon with the TV line and (optionally) one hard shadow offset below-right */
export function shape(g: Graphics, pts: number[], fill: number, o: { shadow?: number; sx?: number; sy?: number; line?: boolean; alpha?: number } = {}) {
  if (o.shadow !== undefined) g.poly(pts.map((v, i) => v + (i % 2 ? (o.sy ?? 10) : (o.sx ?? 10)))).fill({ color: o.shadow, alpha: o.alpha ?? 1 });
  g.poly(pts).fill({ color: fill, alpha: o.alpha ?? 1 });
  if (o.line !== false) g.poly(pts).stroke({ width: LW, color: TV.line, join: 'round' });
}
export function box(g: Graphics, x: number, y: number, w: number, h: number, fill: number, o: { shadow?: number; r?: number; line?: boolean } = {}) {
  if (o.shadow !== undefined) g.roundRect(x + 10, y + 10, w, h, o.r ?? 6).fill(o.shadow);
  g.roundRect(x, y, w, h, o.r ?? 6).fill(fill);
  if (o.line !== false) g.roundRect(x, y, w, h, o.r ?? 6).stroke({ width: LW, color: TV.line });
}
export function disc(g: Graphics, x: number, y: number, r: number, fill: number, o: { line?: boolean; alpha?: number } = {}) {
  g.circle(x, y, r).fill({ color: fill, alpha: o.alpha ?? 1 });
  if (o.line !== false) g.circle(x, y, r).stroke({ width: LW, color: TV.line });
}
/** a donut (rosa dona): ring + glaze + sprinkles. `r` outer radius */
export function donut(g: Graphics, x: number, y: number, r: number, seed = 1) {
  g.ellipse(x, y, r, r * 0.62).fill(TV.amberL).stroke({ width: LW * 0.8, color: TV.line });
  g.ellipse(x, y - r * 0.08, r * 0.86, r * 0.5).fill(TV.pink);
  g.ellipse(x, y - r * 0.02, r * 0.3, r * 0.17).fill(TV.amberD).stroke({ width: LW * 0.6, color: TV.line });
  const cols = [TV.cream, TV.neonBlue, TV.green, TV.amber];
  for (let i = 0; i < 7; i++) {
    const a = seed * 1.7 + i * 0.9;
    const rr = r * (0.48 + 0.26 * ((i * 37 + seed * 13) % 10) / 10);
    const sx = x + Math.cos(a) * rr;
    const sy = y - r * 0.08 + Math.sin(a) * rr * 0.55;
    g.roundRect(sx - 5, sy - 2, 10, 4, 2).fill(cols[i % cols.length]);
  }
}
/** a beer mug: glass, amber beer up to `fill` (0..1), foam cap, handle on the `side` (1 = right) */
export function mug(g: Graphics, x: number, y: number, w: number, h: number, o: { fill?: number; foam?: number; side?: 1 | -1; tilt?: number } = {}) {
  const f = o.fill ?? 0.85;
  const side = o.side ?? 1;
  const hx = side > 0 ? x + w : x;
  // handle
  g.roundRect(side > 0 ? hx - 6 : hx - w * 0.32 + 6, y + h * 0.22, w * 0.32, h * 0.5, w * 0.12).stroke({ width: LW * 2.4, color: TV.line });
  g.roundRect(side > 0 ? hx - 6 : hx - w * 0.32 + 6, y + h * 0.22, w * 0.32, h * 0.5, w * 0.12).stroke({ width: LW * 1.1, color: TV.chrome });
  // beer
  const by = y + h * (1 - f);
  if (f > 0) g.roundRect(x + 5, by, w - 10, y + h - by - 5, 6).fill(TV.amber);
  if (f > 0.15) g.rect(x + w * 0.62, by + 10, w * 0.12, (y + h - by) * 0.7).fill({ color: TV.amberL, alpha: 0.8 });
  // glass (an empty one still reads: a pale blue glass with a ring of old foam)
  g.roundRect(x, y, w, h, 10).fill({ color: f > 0 ? TV.white : 0xcfe8ff, alpha: f > 0 ? 0.14 : 0.45 }).stroke({ width: LW, color: TV.line });
  if (f <= 0) g.roundRect(x + 6, y + 10, w - 12, 14, 7).fill({ color: TV.foam, alpha: 0.8 });
  // foam cap (over the rim)
  const fo = o.foam ?? (f > 0.6 ? 1 : 0);
  if (fo > 0) {
    const fy = Math.min(by, y + 8) - 14 * fo;
    g.roundRect(x - 8, fy, w + 16, 30 * fo + 10, 16).fill(TV.foam).stroke({ width: LW, color: TV.line });
    g.circle(x + w * 0.25, fy + 4, 16 * fo).fill(TV.foam);
    g.circle(x + w * 0.6, fy - 2, 20 * fo).fill(TV.foam);
  }
}

// ------------------------------------------------------------------ the cat bake: color TV cartoon
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

const TV_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform float uLine;
uniform vec3 uInk;
uniform float uSat;
uniform float uFlat;
uniform float uBlur;
uniform float uEdge;
uniform float uHue;
uniform vec3 uGrade;
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
// turn only the magenta-ish hues by uHue (radians, YIQ): a violet painting stays violet instead of going pink
vec3 hueTurn(vec3 c, float a) {
  float w = smoothstep(0.04, 0.22, min(c.r, c.b) - c.g);
  if (w <= 0.0 || a == 0.0) return c;
  mat3 toY = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
  mat3 toR = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);
  vec3 y = toY * c;
  float cs = cos(a * w);
  float sn = sin(a * w);
  y = vec3(y.x, y.y * cs - y.z * sn, y.y * sn + y.z * cs);
  return clamp(toR * y, 0.0, 1.0);
}
vec3 un(vec4 c) { return c.a > 0.001 ? c.rgb / c.a : vec3(0.0); }
void main() {
  vec2 px = uInputSize.zw;
  vec2 uv = vTextureCoord;
  vec4 c = texture(uTexture, uv);
  // ---- the uniform outer outline (alpha dilation: the same weight all around)
  float maxA = 0.0;
  for (int k = 0; k < 16; k++) {
    float a = float(k) * 0.39269908;
    maxA = max(maxA, texture(uTexture, uv + vec2(cos(a), sin(a)) * uLine * px).a);
  }
  if (c.a < 0.5) {
    float o = smoothstep(0.2, 0.55, maxA);
    float a = max(o, c.a);
    finalColor = vec4(uInk * a, a);
    return;
  }
  // ---- flatten the fur strokes into cartoon patches (a box blur at line scale)
  vec3 sm = vec3(0.0);
  float n = 0.0;
  for (int i = -2; i <= 2; i++) {
    for (int j = -2; j <= 2; j++) {
      vec4 s = texture(uTexture, uv + vec2(float(i), float(j)) * px * uLine * 0.2);
      if (s.a > 0.5) { sm += un(s); n += 1.0; }
    }
  }
  sm = n > 0.0 ? sm / n : un(c);
  // how much of that flattening (1 = the house lens; a gentle lens keeps the painting's own strokes: face, lantern)
  sm = mix(un(c), sm, uBlur);
  float l = lum(sm);
  // ---- TWO tones per hue: body and ONE hard shadow (TV cartoon), saturated
  float t = l < 0.34 ? 0.56 : 0.94;
  vec3 chroma = sm / max(l, 0.06);
  vec3 cel = clamp(chroma * t, 0.0, 1.0);
  // cel OVER the paint (docs/part-ii/29 §5.6: a full posterize muddies fur; half keeps eyes and face)
  cel = mix(sm, cel, uFlat);
  float lc = lum(cel);
  // the TV push only on the fur and the clothes (dark eyes stay brown, never red)
  cel = clamp(mix(vec3(lc), cel, mix(1.0, uSat, smoothstep(0.22, 0.45, l))), 0.0, 1.0);
  // the eyes' shine and the brightest catches survive (big cartoon eyes keep their sparkle)
  vec3 o = un(c);
  cel = mix(cel, o, smoothstep(0.84, 0.95, lum(o)) * 0.85);
  // ---- a few inner lines: only the strong edges (face, ears, paws), same ink
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
  float e = sqrt(gx * gx + gy * gy);
  cel = mix(cel, uInk, smoothstep(1.3, 2.1, e) * uEdge);
  // the inner rim of the silhouette: the same line, inside
  float minA = 1.0;
  for (int k = 0; k < 8; k++) {
    float a = float(k) * 0.78539816;
    minA = min(minA, texture(uTexture, uv + vec2(cos(a), sin(a)) * uLine * 0.35 * px).a);
  }
  // a soft grade (per painting) and the magenta guard
  cel = hueTurn(cel, uHue) * uGrade;
  cel = mix(cel, uInk, 1.0 - smoothstep(0.3, 0.7, minA));
  finalColor = vec4(clamp(cel, 0.0, 1.0) * c.a, c.a);
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

const rgb3 = (c: number) => new Float32Array([((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255]);

/**
 * The TV lens, per painting (LUZ, 13 §3.5). `house` is the Borracha's usual lens: flattened patches, two tones, a
 * saturation push, inner lines. Luzterna's painting is already a saturated violet with a soft face: the house lens
 * flattened her face and turned her magenta (C-BAR report, owner: «Luzterna pierde calidad»), so she gets a GENTLE lens —
 * her own painting, the Borracha's uniform outer line, a light flattening, very few inner lines, the magenta turned back
 * to violet and a soft night grade (compared side by side: <scratch>/despues/luz/luz-look.png).
 */
export interface TvLens {
  /** saturation on fur and clothes (1 = as painted) */
  sat: number;
  /** cel over the paint (0 = paint, 1 = two flat tones) */
  flat: number;
  /** box-blur flattening of the strokes (0 = the painting's own strokes) */
  blur: number;
  /** inner ink lines on strong edges */
  edge: number;
  /** turn of the magenta-ish hues (radians; negative = towards violet/blue) */
  hue: number;
  /** a soft grade (multiplied) */
  grade: [number, number, number];
}
export const TV_LENS_HOUSE: TvLens = { sat: 1.18, flat: 0.62, blur: 1, edge: 0.7, hue: 0, grade: [1, 1, 1] };
export const TV_LENS_LUZ: TvLens = { sat: 0.94, flat: 0.16, blur: 0.25, edge: 0.18, hue: -0.32, grade: [0.98, 0.98, 1.04] };
/** per painting: [slug pattern, lens] (the first match wins; the rest use the house lens) */
export const TV_SAT: [RegExp, TvLens][] = [[/luzterna|lantern_spirit/i, TV_LENS_LUZ]];
/** the Studio bake (momentos/anime/actor.ts Studio `bake`): NEW textures at the painting's exact size */
export function bakeTv(renderer: Renderer, src: Texture, slug?: string): { tex: Texture; sil: Texture } {
  return bakeTvLens(renderer, src, TV_SAT.find(([re]) => re.test(slug ?? ''))?.[1] ?? TV_LENS_HOUSE);
}
/** the TV bake through an explicit lens (comparisons, a Momento that wants another look) */
export function bakeTvLens(renderer: Renderer, src: Texture, lens: TvLens): { tex: Texture; sil: Texture } {
  const res = src.source.resolution ?? 1;
  const scale = (src.width * res) / 1050;
  const f = new Filter({
    glProgram: GlProgram.from({ vertex: VERTEX, fragment: TV_FRAG, name: 'borracha-tv' }),
    resources: {
      t: {
        uLine: { value: Math.max(2.5, 10 * scale), type: 'f32' },
        uInk: { value: rgb3(TV.line), type: 'vec3<f32>' },
        uSat: { value: lens.sat, type: 'f32' },
        uFlat: { value: lens.flat, type: 'f32' },
        uBlur: { value: lens.blur, type: 'f32' },
        uEdge: { value: lens.edge, type: 'f32' },
        uHue: { value: lens.hue, type: 'f32' },
        uGrade: { value: new Float32Array(lens.grade), type: 'vec3<f32>' },
      },
    },
    resolution: res,
  });
  const tex = pass(renderer, src, f);
  const sil = pass(renderer, src, new Filter({ glProgram: GlProgram.from({ vertex: VERTEX, fragment: SIL_FRAG, name: 'borracha-sil' }), resources: {}, resolution: res }));
  return { tex, sil };
}

// ------------------------------------------------------------------ the cast
/**
 * Hipólito and Doña Espuma (Lote S, docs/part-iii/06 §4.1–4.2): CANDIDATE paintings (Codex + MAI, drawn in the
 * Borracha's own cartoon line) — PENDING the owner's approval. They already wear the dimension's style, so they are
 * NOT baked (only the house cats who visit — Canelo, Luzterna — go through bakeTv).
 */
export const CAST = {
  hipolito: 'hipolito_tavern_cat',
  espuma: 'espuma_bartender_cat',
} as const;
/** natives of the Borracha: their paintings are already TV cartoon (no bake) */
export const NATIVE = new Set<string>([CAST.hipolito, CAST.espuma]);
/**
 * STAND_IN — used only if a candidate painting is missing from the build (no rig): existing species that resemble them.
 * PENDING by definition (the visual result is not final while a stand-in shows).
 */
export const STAND_IN: Record<keyof typeof CAST, string> = {
  hipolito: 'granbigote_sumo_cat',
  espuma: 'menta_botanical_cat',
};

/** a NEW copy of a painting (the Studio destroys what a bake returns) + its silhouette: the natives' «bake» */
export function bakePlain(renderer: Renderer, src: Texture): { tex: Texture; sil: Texture } {
  const res = src.source.resolution ?? 1;
  const copy = new Filter({ glProgram: GlProgram.from({ vertex: VERTEX, fragment: COPY_FRAG, name: 'borracha-copy' }), resources: {}, resolution: res });
  const tex = pass(renderer, src, copy);
  const sil = pass(renderer, src, new Filter({ glProgram: GlProgram.from({ vertex: VERTEX, fragment: SIL_FRAG, name: 'borracha-sil' }), resources: {}, resolution: res }));
  return { tex, sil };
}
const COPY_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
void main() { finalColor = texture(uTexture, vTextureCoord); }`;

/** the right bake for a slug: natives as painted, house cats through the TV lens */
export function bakeFor(slug: string) {
  return NATIVE.has(slug) ? bakePlain : bakeTv;
}
