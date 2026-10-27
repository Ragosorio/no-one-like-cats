/**
 * PELÍCULAS — the BOOK styles (FILM-ACTO3, Act III «Lo que está escrito»: the Library box, where the screen is an open
 * book). Each one = a one-time treatment of the owner-approved MAI paintings (Studio bake: new textures of the painting's
 * exact size, so the CatPuppet rig animates the treated painting at zero per-frame cost) + its post look + the paper /
 * screen textures its sets use. All generic: any film can use them.
 *
 *   libros         a Victorian storybook plate: wobbly sepia pen line + flat watercolour in 3 values, pigment pooling at
 *                  the value edges, granulation, the paper showing through
 *   popup          a pop-up book: the painting as a printed CARD cut-out (4 flat values, card fibres, a darker fold at
 *                  the feet); the die-cut white border and the cast shadow are the set's (silhouette sprites)
 *   dore           a Gustave Doré wood engraving: burin lines that follow the form, thicker where it is darker, crossed
 *                  in the deep shadows; ink on cream. `engrave()` turns any tonal composition into the same engraving
 *   expresionismo  German expressionism (Caligari): 3 painted tones toned green / sepia, a thick jagged outline,
 *                  diagonal painted streaks in the shadow
 *   tecnico        a white technical drawing: only pearl-grey contour lines and sparse 45° hatching on white
 *   tinta          ink-and-wash noir: 4 cold wash values, black ink edges that bleed a little, paper
 *   senal          (style `pirata`) a pirate TV signal: RGB split, scanlines, posterized and over-saturated
 *   datamosh       the storybook plate (libros bake) under a compression-glitch post (`moshFilter`, the set mounts it)
 *
 * Shared texture names (ctx.tex): 'lb:paper' · 'pp:card' · 'dr:paper' · 'ex:streaks' · 'tc:grid' · 'tn:wash' ·
 * 'pi:bars' 'pi:scan' 'pi:snow' · 'dm:blocks'. Docs: docs/part-iii/cine-v2/05-estilos-libro.md.
 */
import { Container, Filter, GlProgram, Rectangle, RenderTexture, Sprite, Texture, type Renderer } from 'pixi.js';
import { glFilter, NOISE, uni, VERTEX } from '../gl';
import { BAKE_UV, type Baker } from '../bake';
import type { CatBake } from './catbake';
import type { StyleModule, StylePrep } from './index';

// ------------------------------------------------------------------ one bake pass (same contract as catbake.ts)
function pass(renderer: Renderer, src: Texture, frag: string, u: Record<string, { value: number | Float32Array; type: string }> = {}): RenderTexture {
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
const SIL = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
void main() { float a = texture(uTexture, vTextureCoord).a; finalColor = vec4(vec3(a), a); }`;
const withSil = (r: Renderer, tex: RenderTexture) => ({ tex, sil: pass(r, tex, SIL) });

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

// ------------------------------------------------------------------ the cat treatments
/** Victorian storybook plate: sepia pen + flat watercolour */
const LIBROS = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.01) { finalColor = vec4(0.0); return; }
  vec2 px = uv / uTexel / uScale;
  vec3 col = C(uv);
  float l = lum(col);
  // flat wash: three values, the hue kept but muted toward the paper
  float q = l < 0.36 ? 0.34 : (l < 0.66 ? 0.64 : 0.9);
  vec3 hue = col / max(l, 0.06);
  vec3 wash = clamp(hue * q, 0.0, 1.0);
  wash = mix(vec3(lum(wash)), wash, 0.78);
  wash = mix(wash, vec3(0.97, 0.93, 0.83), 0.16);
  // pigment pools where the values meet, granulation everywhere
  float e = length(grad(uv, 2.5 * uScale));
  wash *= 1.0 - smoothstep(0.08, 0.45, e) * 0.16;
  wash *= 0.94 + 0.08 * vnoise(px * 0.32) - 0.03 * vnoise(px * 1.7);
  // the pen: a sepia contour that wobbles like a hand
  vec2 wob = (vec2(vnoise(px * 0.035), vnoise(px * 0.035 + 7.0)) - 0.5) * 2.4 * uTexel * uScale;
  float ink = smoothstep(0.28, 0.75, length(grad(uv + wob, 1.4 * uScale)));
  vec3 o = mix(wash, vec3(0.22, 0.13, 0.07), ink * 0.92);
  float a = c0.a;
  finalColor = vec4(o * a, a);
}`;
export const librosBake: CatBake = (r, src) => withSil(r, pass(r, src, LIBROS));

/** pop-up card: 4 flat printed values, card fibres, a fold shadow at the feet */
const RECORTE = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.01) { finalColor = vec4(0.0); return; }
  vec2 px = uv / uTexel / uScale;
  vec3 col = C(uv);
  float l = lum(col);
  float q = floor(l * 4.0 + 0.5) / 4.0;
  vec3 o = clamp(col / max(l, 0.05) * max(q, 0.14), 0.0, 1.0);
  o = mix(vec3(lum(o)), o, 0.9) * 1.03;
  o *= 0.95 + 0.06 * vnoise(px * vec2(0.08, 0.9));
  // the hinge: the card darkens toward its feet (where it folds off the page)
  float foot = smoothstep(0.82, 1.0, uv.y / max(uInputClamp.w, 1e-4));
  o *= 1.0 - foot * 0.2;
  float edge = smoothstep(0.3, 0.8, length(grad(uv, 1.3 * uScale)));
  o = mix(o, vec3(0.16, 0.11, 0.08), edge * 0.6);
  float a = c0.a > 0.5 ? 1.0 : smoothstep(0.2, 0.5, c0.a);
  finalColor = vec4(o * a, a);
}`;
export const recorteBake: CatBake = (r, src) => withSil(r, pass(r, src, RECORTE));

/** wood engraving: burin lines along the form (thick in the dark), crossed in the deepest shadow */
const GRABADO = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.01) { finalColor = vec4(0.0); return; }
  vec2 px = uv / uTexel / uScale;
  float l = lum(C(uv));
  float dark = clamp(1.0 - l * 1.08, 0.0, 1.0);
  // a smooth direction field: the big-radius gradient (the form), else a diagonal
  vec2 g = grad(uv, 9.0 * uScale);
  float gm = length(g);
  vec2 dir = gm > 0.03 ? normalize(vec2(-g.y, g.x)) : normalize(vec2(0.8, 0.6));
  dir = normalize(mix(normalize(vec2(0.8, 0.6)), dir, smoothstep(0.03, 0.2, gm)));
  float sp = 3.6;
  float d = dot(px, vec2(-dir.y, dir.x)) / sp + vnoise(px * 0.03) * 1.6;
  float line = abs(fract(d) - 0.5) * 2.0;
  float w = dark * 1.05;
  float ink = 1.0 - smoothstep(w - 0.18, w + 0.04, line);
  float d2 = dot(px, dir) / (sp * 1.15);
  float line2 = abs(fract(d2) - 0.5) * 2.0;
  float w2 = (dark - 0.55) * 1.9;
  float ink2 = w2 > 0.0 ? 1.0 - smoothstep(w2 - 0.18, w2 + 0.04, line2) : 0.0;
  float edge = smoothstep(0.32, 0.85, length(grad(uv, 1.4 * uScale)));
  float k = clamp(max(max(ink, ink2), edge), 0.0, 1.0);
  vec3 o = mix(vec3(0.94, 0.9, 0.81), vec3(0.07, 0.06, 0.06), k);
  float a = c0.a;
  finalColor = vec4(o * a, a);
}`;
export const grabadoBake: CatBake = (r, src) => withSil(r, pass(r, src, GRABADO));

/** Caligari: 3 painted tones toned green / sepia, a jagged painted outline, streaks in the shadow */
const CALIGARI = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.01) { finalColor = vec4(0.0); return; }
  vec2 px = uv / uTexel / uScale;
  float l = lum(C(uv));
  float q = l < 0.33 ? 0.12 : (l < 0.62 ? 0.45 : 0.86);
  vec3 o = mix(vec3(0.08, 0.1, 0.06), vec3(0.86, 0.82, 0.62), q);
  o = mix(o, o * vec3(0.92, 1.04, 0.86), 0.5);
  // diagonal painted streaks in the shadow
  float st = vnoise(vec2(px.x * 0.06 - px.y * 0.06, (px.x + px.y) * 0.004));
  o *= 1.0 - (1.0 - q) * 0.25 * step(0.5, st);
  // a thick, jagged outline (painted)
  vec2 jag = (vec2(vnoise(px * 0.08), vnoise(px * 0.08 + 3.0)) - 0.5) * 5.0 * uTexel * uScale;
  float edge = smoothstep(0.22, 0.55, length(grad(uv + jag, 3.0 * uScale)));
  o = mix(o, vec3(0.04, 0.05, 0.03), edge * 0.95);
  float a = c0.a;
  finalColor = vec4(o * a, a);
}`;
export const caligariBake: CatBake = (r, src) => withSil(r, pass(r, src, CALIGARI));

/** technical drawing: pearl-grey contours, sparse 45° hatching, white */
const TECNICO = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.01) { finalColor = vec4(0.0); return; }
  vec2 px = uv / uTexel / uScale;
  float l = lum(C(uv));
  float edge = smoothstep(0.22, 0.6, length(grad(uv, 1.6 * uScale)));
  float hatch = step(0.82, fract((px.x + px.y) / 9.0)) * step(l, 0.42);
  float hatch2 = step(0.82, fract((px.x - px.y) / 9.0)) * step(l, 0.2);
  float k = max(edge, max(hatch, hatch2) * 0.55);
  vec3 o = mix(vec3(0.965, 0.97, 0.975), vec3(0.48, 0.52, 0.58), k);
  float a = c0.a;
  finalColor = vec4(o * a, a);
}`;
export const tecnicoBake: CatBake = (r, src) => withSil(r, pass(r, src, TECNICO));

/** ink and wash: 4 cold wash values, black ink edges that bleed, paper */
const TINTA = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.01) { finalColor = vec4(0.0); return; }
  vec2 px = uv / uTexel / uScale;
  vec3 col = C(uv);
  float l = lum(col);
  float q = l < 0.22 ? 0.1 : (l < 0.45 ? 0.32 : (l < 0.7 ? 0.6 : 0.9));
  q += (vnoise(px * 0.05) - 0.5) * 0.08;
  vec3 o = vec3(q) * vec3(0.95, 0.98, 1.04);
  // keep the faintest trace of the original colour (the post decides what survives: one warm hue)
  o = mix(o, col * q / max(l, 0.05), 0.18);
  float edge = smoothstep(0.25, 0.7, length(grad(uv, 1.6 * uScale)));
  float bleed = smoothstep(0.18, 0.5, length(grad(uv, 4.0 * uScale))) * 0.35;
  o = mix(o, vec3(0.02), clamp(edge * 0.95 + bleed * (1.0 - edge), 0.0, 1.0));
  float a = c0.a;
  finalColor = vec4(o * a, a);
}`;
export const tintaBake: CatBake = (r, src) => withSil(r, pass(r, src, TINTA));

/** pirate signal: RGB split, scanlines, posterized and hot */
const SENAL = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  vec2 sh = vec2(uTexel.x * 6.0 * uScale, 0.0);
  vec4 cr = S(uv - sh);
  vec4 cb = S(uv + sh);
  float a = max(c0.a, max(cr.a, cb.a) * 0.8);
  if (a < 0.01) { finalColor = vec4(0.0); return; }
  vec3 o = vec3(cr.a > 0.0 ? cr.r / cr.a : 0.0, c0.a > 0.0 ? c0.g / c0.a : 0.0, cb.a > 0.0 ? cb.b / cb.a : 0.0);
  o = floor(o * 5.0 + 0.5) / 5.0;
  o = mix(vec3(lum(o)), o, 1.35);
  vec2 px = uv / uTexel;
  o *= 0.78 + 0.22 * step(1.0, mod(px.y, 3.0 * max(1.0, uScale)));
  o = mix(o, o * vec3(0.8, 1.05, 1.15), 0.3);
  finalColor = vec4(clamp(o, 0.0, 1.0) * a, a);
}`;
export const senalBake: CatBake = (r, src) => withSil(r, pass(r, src, SENAL));

export const LIBROS_BAKES: Record<string, CatBake> = {
  libros: librosBake,
  recorte: recorteBake,
  grabado: grabadoBake,
  caligari: caligariBake,
  tecnico: tecnicoBake,
  tinta: tintaBake,
  senal: senalBake,
};

// ------------------------------------------------------------------ shared textures (prepare jobs)
const shade = (b: Baker, name: string, w: number, h: number, body: string) => b.shade(name, w, h, `${BAKE_UV}\n${body}`, {}, {}, { res: 1 });
const PAPER = `void main() {
  vec2 uv = bakeUV();
  float f = pfbm(uv * 8.0, 8.0);
  float fib = pnoise(uv * vec2(64.0, 6.0), 64.0);
  float fox = smoothstep(0.72, 0.9, pfbm(uv * 3.0 + 9.0, 3.0));
  vec3 c = vec3(0.95, 0.91, 0.82) * (0.94 + f * 0.1) - fib * 0.025;
  c = mix(c, vec3(0.78, 0.62, 0.42), fox * 0.18);
  finalColor = vec4(c, 1.0);
}`;
function prepLibros(p: StylePrep) {
  p.baker.add('libros:papel', 'el papel del libro', () => void p.tex.set('lb:paper', shade(p.baker, 'lb-paper', 512, 512, PAPER)));
}
function prepPopup(p: StylePrep) {
  p.baker.add('popup:carton', 'la cartulina', () =>
    void p.tex.set(
      'pp:card',
      shade(p.baker, 'pp-card', 512, 512, `void main() { vec2 uv = bakeUV(); float f = pfbm(uv * 16.0, 16.0); float fib = pnoise(uv * vec2(4.0, 96.0), 4.0); vec3 c = vec3(0.97, 0.95, 0.9) * (0.95 + f * 0.07) - fib * 0.02; finalColor = vec4(c, 1.0); }`),
    ),
  );
}
function prepDore(p: StylePrep) {
  p.baker.add('dore:papel', 'el papel del grabado', () => void p.tex.set('dr:paper', shade(p.baker, 'dr-paper', 512, 512, PAPER)));
}
function prepExpresionismo(p: StylePrep) {
  p.baker.add('expresionismo:pinceladas', 'las sombras pintadas', () =>
    void p.tex.set(
      'ex:streaks',
      shade(
        p.baker,
        'ex-streaks',
        512,
        512,
        `void main() { vec2 uv = bakeUV(); vec2 r = vec2(uv.x + uv.y * 0.35, uv.y); float s = pnoise(vec2(r.x * 22.0, r.y * 2.0), 22.0); float k = smoothstep(0.35, 0.65, s) * 0.8 + pfbm(uv * 6.0, 6.0) * 0.2; finalColor = vec4(vec3(k), 1.0); }`,
      ),
    ),
  );
}
function prepTecnico(p: StylePrep) {
  p.baker.add('tecnico:rejilla', 'la cuadrícula del plano', () =>
    void p.tex.set(
      'tc:grid',
      shade(
        p.baker,
        'tc-grid',
        512,
        512,
        `void main() { vec2 px = bakeUV() * 512.0; vec2 m = abs(fract(px / 32.0 + 0.5) - 0.5) * 32.0; vec2 M = abs(fract(px / 128.0 + 0.5) - 0.5) * 128.0; float minor = 1.0 - smoothstep(0.4, 1.0, min(m.x, m.y)); float major = 1.0 - smoothstep(0.6, 1.4, min(M.x, M.y)); vec3 c = vec3(0.972, 0.975, 0.98) - minor * 0.025 - major * 0.05; finalColor = vec4(c, 1.0); }`,
      ),
    ),
  );
}
function prepTinta(p: StylePrep) {
  p.baker.add('tinta:aguada', 'la aguada', () =>
    void p.tex.set(
      'tn:wash',
      shade(
        p.baker,
        'tn-wash',
        512,
        512,
        `void main() { vec2 uv = bakeUV(); float f = pfbm(uv * 4.0, 4.0); float bloom = smoothstep(0.45, 0.62, pfbm(uv * 7.0 + 3.0, 7.0)); float k = clamp(f * 0.7 + bloom * 0.4, 0.0, 1.0); finalColor = vec4(vec3(k), 1.0); }`,
      ),
    ),
  );
}
function prepPirata(p: StylePrep) {
  p.baker.add('pirata:barras', 'la señal pirata', () => {
    p.tex.set(
      'pi:bars',
      shade(
        p.baker,
        'pi-bars',
        1024,
        576,
        `vec3 bar(float i) { if (i < 0.5) return vec3(0.75); if (i < 1.5) return vec3(0.75, 0.75, 0.0); if (i < 2.5) return vec3(0.0, 0.75, 0.75); if (i < 3.5) return vec3(0.0, 0.75, 0.0); if (i < 4.5) return vec3(0.75, 0.0, 0.75); if (i < 5.5) return vec3(0.75, 0.0, 0.0); return vec3(0.0, 0.0, 0.75); }
          void main() { vec2 uv = bakeUV(); float i = clamp(floor(uv.x * 7.0), 0.0, 6.0); vec3 c = bar(i);
          if (uv.y > 0.67) { c = uv.y > 0.75 ? (uv.x < 0.18 ? vec3(0.0, 0.13, 0.3) : uv.x < 0.36 ? vec3(1.0) : uv.x < 0.54 ? vec3(0.2, 0.0, 0.42) : vec3(0.04)) : bar(6.0 - i) * step(0.5, mod(i, 2.0)); }
          finalColor = vec4(c, 1.0); }`,
      ),
    );
    p.tex.set('pi:scan', shade(p.baker, 'pi-scan', 8, 6, `void main() { float row = floor(bakeUV().y * 6.0); finalColor = row > 3.5 ? vec4(0.0, 0.0, 0.0, 0.55) : vec4(0.0); }`));
    p.tex.set('pi:snow', shade(p.baker, 'pi-snow', 512, 512, `void main() { vec2 c = floor(bakeUV() * 256.0); float l = step(0.5, hash12(c)) * (0.5 + 0.5 * hash12(c + 9.0)); finalColor = vec4(vec3(l), 1.0); }`));
  });
}
function prepDatamosh(p: StylePrep) {
  p.baker.add('datamosh:bloques', 'los bloques de compresión', () => void p.tex.set('dm:blocks', shade(p.baker, 'dm-blocks', 512, 512, PAPER)));
}

// ------------------------------------------------------------------ kit: an engraving from any tonal composition
/**
 * ENGRAVE (Doré): draw a composition in grey values (shapes, a moon, painted cats…) and this turns it into a wood
 * engraving ONCE, at build: burin lines along `angle` bent by a slow flow, thicker in the dark, crossed below `cross`,
 * ink on cream (transparent where the composition is). Returns the texture and where it sits (like Baker.raster).
 */
export function engrave(b: Baker, node: Container, o: { name?: string; angle?: number; spacing?: number; flow?: number; cross?: number; res?: number; ink?: number; paper?: number; seed?: number } = {}): { tex: RenderTexture; x: number; y: number } {
  const r = b.raster(node, { res: o.res ?? 1 });
  const w = r.tex.width;
  const h = r.tex.height;
  const ink = o.ink ?? 0x121010;
  const paper = o.paper ?? 0xf0e8d6;
  const c3 = (x: number) => new Float32Array([((x >> 16) & 255) / 255, ((x >> 8) & 255) / 255, (x & 255) / 255]);
  const tex = b.shade(
    `engrave-${o.name ?? 'x'}`,
    w,
    h,
    `${BAKE_UV}
void main() {
  vec2 uv = bakeUV();
  vec4 c = texture(uTexture, vTextureCoord);
  if (c.a < 0.01) { finalColor = vec4(0.0); return; }
  vec2 px = uv * uSize;
  float l = lum(c.rgb / c.a);
  float dark = clamp(1.0 - l, 0.0, 1.0);
  // parallel burin lines, gently bent (never a swirl): the phase wanders a few px, not the angle
  vec2 n = vec2(cos(uAngle + 1.5708), sin(uAngle + 1.5708));
  vec2 tng = vec2(cos(uAngle), sin(uAngle));
  float bend = sin(dot(px, tng) * 0.0035 + uSeed) * 14.0 * uFlow + (vnoise(px * 0.008 + uSeed) - 0.5) * 8.0 * uFlow;
  float d = (dot(px, n) + bend) / uSpacing;
  float ang = uAngle;
  float line = abs(fract(d) - 0.5) * 2.0;
  float w = dark * 1.04;
  float k = 1.0 - smoothstep(w - 0.2, w + 0.03, line);
  float d2 = dot(px, vec2(cos(ang + 0.62), sin(ang + 0.62))) / (uSpacing * 1.1);
  float line2 = abs(fract(d2) - 0.5) * 2.0;
  float w2 = (dark - uCross) * 2.1;
  k = max(k, w2 > 0.0 ? 1.0 - smoothstep(w2 - 0.2, w2 + 0.03, line2) : 0.0);
  float dots = step(0.86, hash12(floor(px / 2.0))) * smoothstep(0.25, 0.5, dark) * 0.5;
  k = clamp(max(k, dots), 0.0, 1.0);
  vec3 o = mix(uPaper, uInk, k);
  finalColor = vec4(o * c.a, c.a);
}`,
    {
      uAngle: { value: o.angle ?? 0.35, type: 'f32' },
      uSpacing: { value: o.spacing ?? 5.6, type: 'f32' },
      uFlow: { value: o.flow ?? 1, type: 'f32' },
      uCross: { value: o.cross ?? 0.58, type: 'f32' },
      uSeed: { value: o.seed ?? 1, type: 'f32' },
      uInk: { value: c3(ink), type: 'vec3<f32>' },
      uPaper: { value: c3(paper), type: 'vec3<f32>' },
    },
    {},
    { res: o.res ?? 1, src: r.tex },
  );
  return { tex, x: r.x, y: r.y };
}

// ------------------------------------------------------------------ kit: the datamosh filter
/**
 * DATAMOSH (a set filter: mount it on a full-frame container with a huge filterArea and list it in FilmSet.filters).
 * Per macroblock: some blocks HOLD a stale offset that grows along a motion vector (pixels dragged by the previous
 * frame's motion), some take their colour from the OTHER plate `uB` sliding in (a tale melting into the next), some
 * collapse to their average colour (compression). `setMosh(f, …)` per frame — all a function of time.
 * Reduce flashes: `slide` = 1 → no stepping (blocks glide instead of jumping).
 */
export function moshFilter(other: Texture | null): Filter {
  return glFilter(
    'film-datamosh',
    `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform sampler2D uB;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uInputClamp;
uniform float uT;
uniform float uAmt;
uniform float uBlock;
uniform vec2 uFlow;
uniform float uMelt;
uniform float uSlide;
uniform float uPx;
uniform float uHasB;
uniform vec4 uClean;
uniform vec2 uWall;
${NOISE}
vec4 tx(vec2 uv) { return texture(uTexture, clamp(uv, uInputClamp.xy, uInputClamp.zw)); }
void main() {
  vec2 uv = vTextureCoord;
  vec2 px = uv * uInputSize.xy + uOutputFrame.xy;
  float bs = uBlock * uPx;
  vec2 blk = floor(px / bs);
  float tq = uSlide > 0.5 ? uT * 0.7 : floor(uT * 8.0) / 8.0;
  float epoch = floor(tq * 0.5 + hash12(blk) * 2.0);
  float h = hash12(blk + epoch * 13.1);
  float h2 = hash12(blk * 1.7 + epoch * 7.3);
  vec4 c = tx(uv);
  // where her light falls (uClean: centre, radius, strength) and behind a wall (uWall: x, strength) the page holds
  float amt = uAmt;
  amt *= 1.0 - uClean.w * (1.0 - smoothstep(uClean.z * 0.55, uClean.z, length(px - uClean.xy)));
  amt *= 1.0 - uWall.y * (1.0 - smoothstep(uWall.x - 50.0 * uPx, uWall.x + 50.0 * uPx, px.x));
  if (amt < 0.002) { finalColor = c; return; }
  // the motion vector of this block: the global flow bent per block
  vec2 mv = normalize(uFlow + (hash22(blk + epoch) - 0.5) * 1.4) * (0.4 + h2);
  float age = fract(tq * 0.5 + hash12(blk) * 2.0);
  if (h < amt * 0.75) {
    // a P-frame that keeps dragging: sample upstream along the motion
    vec2 o = mv * age * bs * 6.0 * amt;
    c = tx((px - o - uOutputFrame.xy) / uInputSize.xy);
  }
  if (uHasB > 0.5 && h2 < uMelt) {
    // the other tale's colours, pushed by this block's motion
    vec2 o = mv * age * bs * 4.0;
    vec2 buv = (px - o) / vec2(1920.0, 1080.0) / uPx;
    vec4 b = texture(uB, clamp(buv, 0.0, 1.0));
    c = mix(c, b, 0.85);
  }
  if (h2 > 1.0 - amt * 0.35) {
    // compression: the block collapses to its average colour (4 taps)
    vec2 bc = (blk + 0.5) * bs;
    vec4 s = vec4(0.0);
    for (int i = 0; i < 4; i++) { vec2 q = bc + (vec2(float(i / 2), float(i - (i / 2) * 2)) - 0.5) * bs * 0.5; s += tx((q - uOutputFrame.xy) / uInputSize.xy); }
    c = mix(c, s / 4.0, 0.8);
  }
  // block seams + chroma bleed
  vec2 f = fract(px / bs);
  float seam = step(f.x, 0.04) + step(f.y, 0.04);
  c.rgb *= 1.0 - seam * 0.12 * amt;
  c.rgb += (vec3(hash12(blk + 1.0), hash12(blk + 2.0), hash12(blk + 3.0)) - 0.5) * 0.18 * amt * step(0.85, h);
  finalColor = c;
}`,
    {
      uT: { value: 0, type: 'f32' },
      uAmt: { value: 0, type: 'f32' },
      uBlock: { value: 16, type: 'f32' },
      uFlow: { value: new Float32Array([1, 0.2]), type: 'vec2<f32>' },
      uMelt: { value: 0, type: 'f32' },
      uSlide: { value: 0, type: 'f32' },
      uPx: { value: 1, type: 'f32' },
      uHasB: { value: other ? 1 : 0, type: 'f32' },
      uClean: { value: new Float32Array([0, 0, 1, 0]), type: 'vec4<f32>' },
      uWall: { value: new Float32Array([0, 0]), type: 'vec2<f32>' },
    },
    { uB: (other ?? Texture.WHITE).source },
  );
}
export function setMosh(f: Filter, o: { t: number; amt: number; block?: number; flow?: [number, number]; melt?: number; slide?: boolean; px: number; clean?: [number, number, number, number]; wall?: [number, number] }) {
  const u = uni(f);
  u.uT = o.t;
  u.uAmt = Math.max(0, Math.min(1, o.amt));
  u.uBlock = o.block ?? 16;
  const fl = u.uFlow as Float32Array;
  fl[0] = o.flow?.[0] ?? 1;
  fl[1] = o.flow?.[1] ?? 0.2;
  u.uMelt = o.melt ?? 0;
  u.uSlide = o.slide ? 1 : 0;
  u.uPx = o.px;
  const cl = u.uClean as Float32Array;
  const c0 = o.clean ?? [0, 0, 1, 0];
  cl[0] = c0[0] * o.px;
  cl[1] = c0[1] * o.px;
  cl[2] = c0[2] * o.px;
  cl[3] = c0[3];
  const wl = u.uWall as Float32Array;
  wl[0] = (o.wall?.[0] ?? 0) * o.px;
  wl[1] = o.wall?.[1] ?? 0;
}
/** a huge filter area (a set filter never re-allocates when its container's bounds change) */
export const BIG_AREA = () => new Rectangle(-4000, -4000, 9920, 9080);

// ------------------------------------------------------------------ the modules
export const LIBROS_MODULES: Record<string, StyleModule> = {
  libros: { id: 'libros', look: { grain: 0.02, vig: 0.24, sat: 0.92, paper: 0.75, warm: 0.1, contrast: 1.0, lift: 0.02 }, catBake: librosBake, prepare: prepLibros, ground: 0x2a2016 },
  popup: { id: 'popup', look: { grain: 0.015, vig: 0.36, sat: 1.0, paper: 0.45, warm: 0.14, contrast: 1.04 }, catBake: recorteBake, prepare: prepPopup, ground: 0x1a120a },
  dore: { id: 'dore', look: { grain: 0.03, vig: 0.42, mono: 0.97, accHue: 0.09, accW: 0.08, contrast: 1.12, paper: 0.65, warm: 0.05 }, catBake: grabadoBake, prepare: prepDore, ground: 0x0e0c0a },
  expresionismo: { id: 'expresionismo', look: { grain: 0.07, vig: 0.6, sat: 0.5, sepia: 0.35, tint: 0xd6e2b0, tintAmt: 0.55, contrast: 1.18, flicker: 0.12, scratch: 0.15 }, catBake: caligariBake, prepare: prepExpresionismo, ground: 0x10140c },
  tecnico: { id: 'tecnico', look: { grain: 0.008, vig: 0.08, sat: 0.7, contrast: 0.95, lift: 0.02, paper: 0.2 }, catBake: tecnicoBake, prepare: prepTecnico, ground: 0xeef0f2 },
  tinta: { id: 'tinta', look: { grain: 0.06, vig: 0.5, mono: 0.97, accHue: 0.085, accW: 0.07, contrast: 1.16, paper: 0.45, hal: 0.4, halT: 0.62, halR: 8 }, catBake: tintaBake, prepare: prepTinta, ground: 0x060606 },
  pirata: { id: 'pirata', look: { grain: 0.1, vig: 0.42, sat: 1.15, contrast: 1.08, aberr: 1.8, hal: 0.25, halT: 0.7, halR: 6, lift: 0.03 }, catBake: senalBake, prepare: prepPirata, ground: 0x050508 },
  datamosh: { id: 'datamosh', look: { grain: 0.03, vig: 0.26, sat: 1.0, paper: 0.55, warm: 0.06, aberr: 0.5 }, catBake: librosBake, prepare: prepDatamosh, ground: 0x1a140e },
};
