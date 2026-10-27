/**
 * PELÍCULAS — the PAGE & PANEL styles (FILM-ACTO2): print, screen and paint treatments of the owner-approved MAI
 * paintings, baked ONCE per film (Studio bake: new textures of the painting's exact size, so the CatPuppet rig animates
 * the treated painting at zero per-frame cost), each with its post look and the paper / screen textures its sets use.
 *
 *   aracnido    the modern «spider-verse» comic: flat colour printed a little OFF its line (misregistration), halftone
 *               dots in two inks (magenta 15°, cyan 75°) in the shade, a thick black line, a hard highlight
 *   periodico   a 1940s newspaper photo: 45° black halftone on yellowed newsprint + one spot ink (the cat's own hue)
 *   edadplata   a Silver Age comic: the printer's flat inks (each channel snapped), big Ben-Day dots in the mid tones,
 *               a heavy line, aged paper showing through
 *   nocturna    night-vision documentary: the painting as it is (the post does the phosphor green duotone)
 *   manga       yonkoma screentone: black, white and a dot tone — the BLUE survives (Luzterna's lantern)
 *   hilo        the continuous-thread world: the fighters in cel (the Momentos' bake); the `hilo` treatment (CAT_BAKES)
 *               draws a cat as a white contour line only — figures of the world drawn in thread
 *   caravaggio  tenebrism: warm oil, a raking light from the upper left, the shadows sink to umber-black, a gleam
 *
 * Shared texture names (ctx.tex): 'ar:dots' · 'pe:paper' · 'ep:paper' 'ep:dots' · 'nv:scan' 'nv:noise' · 'mg:tone'
 * 'mg:paper' · 'hl:indigo' · 'cv:canvas' 'cv:ray'. Extra treatments for `{ slug, bake }` (styles/index.ts registers them
 * in CAT_BAKES): aracnido, periodico, edadplata, manga, hilo, cel, caravaggio. Docs: docs/part-iii/cine-v2/05-estilos-acto2.md.
 */
import { Container, Filter, GlProgram, RenderTexture, Sprite, type Renderer, type Texture } from 'pixi.js';
import { NOISE, VERTEX } from '../gl';
import { BAKE_UV, type Baker } from '../bake';
import { planoBake, type CatBake } from './catbake';
import type { StyleModule, StylePrep } from './index';
import { animeBake } from './grafico';

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
vec3 C(vec2 uv) { vec4 c = S(uv); return c.a > 0.0 ? c.rgb / c.a : vec3(1.0); }
float L(vec2 uv) { vec4 c = S(uv); return c.a > 0.0 ? lum(c.rgb / c.a) * c.a + (1.0 - c.a) : 1.0; }
vec2 grad(vec2 uv, float r) {
  vec2 e = uTexel * r;
  float tl = L(uv + vec2(-e.x, -e.y)), t = L(uv + vec2(0.0, -e.y)), tr = L(uv + vec2(e.x, -e.y));
  float l = L(uv + vec2(-e.x, 0.0)), rr = L(uv + vec2(e.x, 0.0));
  float bl = L(uv + vec2(-e.x, e.y)), b = L(uv + vec2(0.0, e.y)), br = L(uv + vec2(e.x, e.y));
  return vec2((tr + 2.0 * rr + br) - (tl + 2.0 * l + bl), (bl + 2.0 * b + br) - (tl + 2.0 * t + tr));
}
float ringA(vec2 uv, float r) {
  float s = 0.0;
  for (int i = 0; i < 8; i++) { float a = float(i) * 0.7854; s += S(uv + vec2(cos(a), sin(a)) * r * uScale * uTexel).a; }
  return s / 8.0;
}
float Ls(vec2 uv, float r) {
  float s = L(uv) * 2.0;
  for (int i = 0; i < 6; i++) { float a = float(i) * 1.0472; s += L(uv + vec2(cos(a), sin(a)) * r * uScale * uTexel); }
  return s / 8.0;
}
vec3 flatC(vec2 uv, float r) {
  vec3 acc = C(uv) * 2.0;
  for (int i = 0; i < 6; i++) { float a = float(i) * 1.0472; acc += C(uv + vec2(cos(a), sin(a)) * r * uScale * uTexel); }
  return acc / 8.0;
}
float dotAt(vec2 px, float ang, float cell, float r) {
  float c = cos(ang), s = sin(ang);
  vec2 q = mat2(c, -s, s, c) * px / cell;
  return 1.0 - smoothstep(r - 0.07, r + 0.07, length(fract(q) - 0.5));
}
`;

// ------------------------------------------------------------------ the spider-verse comic
const ARACNIDO = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.5) { finalColor = vec4(0.0); return; }
  vec2 px = uv / uTexel / uScale;
  // the colour plate printed off its line (3 px right, 2 up)
  vec2 off = vec2(3.0, -2.0) * uScale * uTexel;
  vec3 col = flatC(uv + off, 5.0);
  float l = lum(col);
  col = mix(vec3(l), col, 1.55);
  col = mix(col, floor(col * 4.0 + 0.5) / 4.0, 0.7);
  // two inks of halftone in the shade
  float sh = clamp((0.72 - l) / 0.6, 0.0, 1.0);
  float dm = dotAt(px, 0.2618, 6.5, sqrt(sh) * 0.5);
  float dc = dotAt(px + vec2(2.0, 1.0), 1.309, 6.5, sqrt(sh) * 0.42);
  col *= mix(vec3(1.0), vec3(1.0, 0.5, 0.82), dm * 0.6);
  col *= mix(vec3(1.0), vec3(0.5, 0.82, 1.0), dc * 0.5);
  // a hard highlight where it's brightest
  col = mix(col, vec3(1.0, 0.98, 0.92), smoothstep(0.82, 0.9, l) * 0.6);
  float edge = max(smoothstep(0.33, 0.8, length(grad(uv, 2.5 * uScale))), smoothstep(0.93, 0.55, ringA(uv, 5.0)));
  col = mix(clamp(col, 0.0, 1.0), vec3(0.05, 0.03, 0.09), edge);
  finalColor = vec4(col, 1.0);
}`;

// ------------------------------------------------------------------ 1940s newsprint
const PERIODICO = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.5) { finalColor = vec4(0.0); return; }
  vec2 px = uv / uTexel / uScale;
  vec3 cc = flatC(uv, 3.0);
  float l = smoothstep(0.12, 0.88, Ls(uv, 2.0));
  float k = dotAt(px, 0.7854, 7.0, sqrt(1.0 - l) * 0.64);
  float sat = max(max(cc.r, cc.g), cc.b) - min(min(cc.r, cc.g), cc.b);
  float s = dotAt(px + vec2(2.0, 1.0), 0.2618, 7.0, sqrt(clamp(sat * 1.3, 0.0, 1.0)) * 0.58);
  vec3 paper = vec3(0.93, 0.88, 0.76);
  vec3 ink = clamp(mix(vec3(lum(cc)), cc, 1.6), 0.0, 1.0);
  vec3 col = mix(paper, paper * ink * 1.15, s * 0.85);
  col = mix(col, vec3(0.11, 0.09, 0.08), k * 0.93);
  float edge = smoothstep(0.4, 0.85, length(grad(uv, 2.0 * uScale)));
  col = mix(col, vec3(0.1, 0.08, 0.07), edge * 0.8);
  col *= 0.95 + 0.06 * vnoise(px * 0.4);
  finalColor = vec4(col, 1.0);
}`;

// ------------------------------------------------------------------ Silver Age
const EDADPLATA = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.5) { finalColor = vec4(0.0); return; }
  vec2 px = uv / uTexel / uScale;
  vec3 col = flatC(uv, 6.0);
  col = mix(vec3(lum(col)), col, 1.4);
  // the printer's flat inks: each channel snapped to 0 / ½ / 1
  vec3 q = floor(clamp(col, 0.0, 1.0) * 2.0 + 0.5) / 2.0;
  col = mix(col, q, 0.8);
  float l = lum(col);
  vec3 paper = vec3(0.97, 0.92, 0.78);
  // big Ben-Day dots (aligned, no screen angle) for the mid tones: ink dots on the paper
  float d = length(fract(px / 11.0) - 0.5);
  float dotOn = 1.0 - smoothstep(0.3, 0.36, d);
  float mid = smoothstep(0.32, 0.5, l) * smoothstep(0.92, 0.66, l);
  col = mix(col, mix(paper, col, dotOn), mid * 0.75);
  col *= vec3(1.0, 0.97, 0.88);
  float edge = max(smoothstep(0.3, 0.75, length(grad(uv, 3.0 * uScale))), smoothstep(0.94, 0.5, ringA(uv, 6.5)));
  col = mix(clamp(col, 0.0, 1.0), vec3(0.08, 0.06, 0.06), edge);
  finalColor = vec4(col, 1.0);
}`;

// ------------------------------------------------------------------ manga screentone (the blue survives)
const MANGA = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.5) { finalColor = vec4(0.0); return; }
  vec2 px = uv / uTexel / uScale;
  vec3 cc = C(uv);
  float l = Ls(uv, 1.5);
  float tone = dotAt(px, 0.7854, 5.0, sqrt(clamp((0.8 - l) / 0.6, 0.0, 1.0)) * 0.58);
  float ink = l < 0.2 ? 1.0 : (l > 0.84 ? 0.0 : tone);
  float edge = max(smoothstep(0.3, 0.72, length(grad(uv, 2.0 * uScale))), smoothstep(0.94, 0.55, ringA(uv, 4.0)));
  ink = max(ink, edge);
  vec3 col = mix(vec3(0.97, 0.96, 0.94), vec3(0.06), ink);
  // the blue (her lantern) stays in colour
  float blue = cc.b - max(cc.r, cc.g * 0.92);
  float keep = smoothstep(0.1, 0.28, blue) * (1.0 - edge);
  col = mix(col, clamp(cc * 1.15, 0.0, 1.0), keep);
  finalColor = vec4(col, 1.0);
}`;

// ------------------------------------------------------------------ thread: a white contour line only
const HILO = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  float a = S(uv).a;
  float rim = smoothstep(0.96, 0.6, ringA(uv, 3.0)) * step(0.4, a);
  float inner = smoothstep(0.45, 0.95, length(grad(uv, 2.5 * uScale))) * step(0.5, a);
  float line = clamp(max(rim, inner * 0.85), 0.0, 1.0);
  finalColor = vec4(vec3(line), line);
}`;

// ------------------------------------------------------------------ Caravaggio: tenebrism
const TENEBRISMO = `${HEAD}
uniform vec2 uLight;
void main() {
  vec2 uv = vTextureCoord;
  float a = S(uv).a;
  if (a < 0.02) { finalColor = vec4(0.0); return; }
  vec2 px = uv / uTexel / uScale;
  vec3 col = flatC(uv, 2.5);
  // relief from the blurred alpha: a normal, lit from the upper left
  vec2 e = uTexel * 12.0 * uScale;
  vec2 g = vec2(ringA(uv + vec2(e.x, 0.0), 8.0) - ringA(uv - vec2(e.x, 0.0), 8.0), ringA(uv + vec2(0.0, e.y), 8.0) - ringA(uv - vec2(0.0, e.y), 8.0));
  vec3 n = normalize(vec3(-g * 2.6, 1.0));
  vec2 ld = normalize(uLight);
  vec3 L3 = normalize(vec3(ld, 0.6));
  float dif = clamp(dot(n, L3), 0.0, 1.0);
  // the raking fall-off across the figure: lit on the light's side, sinking on the other
  float rake = smoothstep(-0.55, 0.45, dot(uv - 0.5, ld) * 1.8);
  float lum0 = lum(col);
  float lit = clamp(dif * 0.75 + rake * 0.7 + lum0 * 0.25 - 0.32, 0.0, 1.25);
  col = mix(vec3(lum0), col, 0.82) * vec3(1.06, 0.95, 0.78);
  col *= 0.1 + lit * 1.08;
  col = mix(col, vec3(0.03, 0.022, 0.016), smoothstep(0.38, 0.02, lit) * 0.85);
  col += vec3(1.0, 0.9, 0.7) * pow(dif, 14.0) * rake * 0.22;
  // the brush and the canvas
  col *= 0.93 + 0.09 * vnoise(px * 0.14 + vec2(vnoise(px * 0.03) * 6.0));
  finalColor = vec4(clamp(col, 0.0, 1.0) * a, a);
}`;

const v2 = (x: number, y: number) => ({ value: new Float32Array([x, y]), type: 'vec2<f32>' });
export const aracnidoBake: CatBake = (r, src) => withSil(r, pass(r, src, ARACNIDO));
export const periodicoBake: CatBake = (r, src) => withSil(r, pass(r, src, PERIODICO));
export const edadplataBake: CatBake = (r, src) => withSil(r, pass(r, src, EDADPLATA));
export const mangaBake: CatBake = (r, src) => withSil(r, pass(r, src, MANGA));
export const hiloBake: CatBake = (r, src) => withSil(r, pass(r, src, HILO));
export const tenebrismoBake: CatBake = (r, src) => withSil(r, pass(r, src, TENEBRISMO, { uLight: v2(-0.62, -0.78) }));

/** the treatments `{ slug, bake }` can ask for (styles/index.ts merges them into CAT_BAKES) */
export const VINETA_BAKES: Record<string, CatBake> = {
  aracnido: aracnidoBake,
  periodico: periodicoBake,
  edadplata: edadplataBake,
  manga: mangaBake,
  hilo: hiloBake,
  cel: animeBake,
  caravaggio: tenebrismoBake,
};

// ------------------------------------------------------------------ paper / screen textures (bake jobs)
const shade = (b: Baker, name: string, w: number, h: number, body: string) => b.shade(name, w, h, `${BAKE_UV}\n${body}`, {}, {}, { res: 1 });
function tex(p: StylePrep, job: string, label: string, list: [key: string, w: number, h: number, body: string][]) {
  p.baker.add(job, label, () => {
    for (const [key, w, h, body] of list) p.tex.set(key, shade(p.baker, key.replace(':', '-'), w, h, body));
  });
}
const DOTS = (r: number) => `void main() { vec2 uv = bakeUV(); vec2 c = fract(uv * 4.0) - 0.5; float a = 1.0 - smoothstep(${(r - 0.04).toFixed(3)}, ${(r + 0.02).toFixed(3)}, length(c)); finalColor = vec4(vec3(a), a); }`;

function prepAracnido(p: StylePrep) {
  tex(p, 'aracnido:puntos', 'la trama de dos tintas', [['ar:dots', 64, 64, DOTS(0.3)]]);
}
function prepPeriodico(p: StylePrep) {
  tex(p, 'periodico:papel', 'el papel de diario', [
    [
      'pe:paper',
      1024,
      1024,
      `void main() {
  vec2 uv = bakeUV();
  float n = pfbm(uv * 4.0, 4.0);
  float fib = pnoise(uv * vec2(260.0, 26.0), 26.0) * 0.5 + pnoise(uv * vec2(26.0, 260.0), 26.0) * 0.5;
  vec3 col = mix(vec3(0.86, 0.8, 0.66), vec3(0.95, 0.91, 0.8), n) * (0.95 + fib * 0.08);
  float fox = smoothstep(0.66, 0.74, pfbm(uv * 6.0 + 3.0, 6.0));
  col *= 1.0 - fox * 0.08;
  finalColor = vec4(col, 1.0);
}`,
    ],
  ]);
}
function prepEdadplata(p: StylePrep) {
  tex(p, 'edadplata:papel', 'el papel de la Edad de Plata', [
    [
      'ep:paper',
      1024,
      1024,
      `void main() {
  vec2 uv = bakeUV();
  float n = pfbm(uv * 5.0, 5.0);
  vec3 col = mix(vec3(0.9, 0.82, 0.62), vec3(0.98, 0.93, 0.78), n);
  float fib = pnoise(uv * vec2(320.0, 40.0), 40.0);
  col *= 0.96 + fib * 0.05;
  finalColor = vec4(col, 1.0);
}`,
    ],
    ['ep:dots', 64, 64, DOTS(0.33)],
  ]);
}
function prepNocturna(p: StylePrep) {
  tex(p, 'nocturna:visor', 'el visor de la cámara', [
    ['nv:scan', 8, 4, `void main() { vec2 uv = bakeUV(); float row = floor(uv.y * 4.0); finalColor = row > 2.5 ? vec4(0.0, 0.0, 0.0, 1.0) : vec4(0.0); }`],
    ['nv:noise', 512, 512, `void main() { vec2 uv = bakeUV(); vec2 c = floor(uv * 512.0); float n = hash12(c) * 0.7 + hash12(c * 1.9 + 4.0) * 0.3; finalColor = vec4(vec3(n), 1.0); }`],
  ]);
}
function prepManga(p: StylePrep) {
  tex(p, 'manga:trama', 'la trama de manga', [
    ['mg:tone', 64, 64, DOTS(0.22)],
    ['mg:paper', 512, 512, `void main() { vec2 uv = bakeUV(); float n = pfbm(uv * 6.0, 6.0); vec3 col = mix(vec3(0.94, 0.93, 0.9), vec3(0.99, 0.985, 0.97), n); finalColor = vec4(col, 1.0); }`],
  ]);
}
function prepHilo(p: StylePrep) {
  tex(p, 'hilo:indigo', 'la tela índigo', [
    [
      'hl:indigo',
      1024,
      1024,
      `void main() {
  vec2 uv = bakeUV();
  float n = pfbm(uv * 3.0, 3.0);
  float weave = (pnoise(uv * vec2(380.0, 6.0), 6.0) + pnoise(uv * vec2(6.0, 380.0), 6.0)) * 0.5;
  vec3 col = mix(vec3(0.03, 0.05, 0.17), vec3(0.08, 0.12, 0.33), n) * (0.9 + weave * 0.18);
  finalColor = vec4(col, 1.0);
}`,
    ],
  ]);
}
function prepCaravaggio(p: StylePrep) {
  tex(p, 'caravaggio:lienzo', 'el lienzo y la luz', [
    [
      'cv:canvas',
      1024,
      1024,
      `void main() {
  vec2 uv = bakeUV();
  float n = pfbm(uv * 3.0, 3.0);
  float weave = (pnoise(uv * vec2(420.0, 8.0), 8.0) + pnoise(uv * vec2(8.0, 420.0), 8.0)) * 0.5;
  float crack = smoothstep(0.02, 0.0, abs(pnoise(uv * 18.0, 18.0) - 0.5)) * 0.35;
  vec3 col = mix(vec3(0.035, 0.026, 0.02), vec3(0.11, 0.075, 0.05), n) * (0.88 + weave * 0.22) * (1.0 - crack);
  finalColor = vec4(col, 1.0);
}`,
    ],
    // a soft vertical shaft (alpha), wide at the bottom: the ray from above
    ['cv:ray', 256, 512, `void main() { vec2 uv = bakeUV(); float w = mix(0.16, 0.5, uv.y); float x = abs(uv.x - 0.5); float a = smoothstep(w, w * 0.25, x) * smoothstep(0.0, 0.12, uv.y) * (0.75 + 0.25 * uv.y); finalColor = vec4(vec3(a), a); }`],
  ]);
}

export const VINETA_MODULES: Record<string, StyleModule> = {
  aracnido: { id: 'aracnido', look: { grain: 0.02, vig: 0.2, sat: 1.18, contrast: 1.06, aberr: 0.9, hal: 0.1, halT: 0.82, halR: 6 }, catBake: aracnidoBake, prepare: prepAracnido, ground: 0x1a0b2e },
  periodico: { id: 'periodico', look: { grain: 0.05, vig: 0.38, sat: 0.92, contrast: 1.08, warm: 0.1, paper: 0.35, dirt: 0.15 }, catBake: periodicoBake, prepare: prepPeriodico, ground: 0x15110c },
  edadplata: { id: 'edadplata', look: { grain: 0.03, vig: 0.24, sat: 1.08, contrast: 1.04, warm: 0.06, paper: 0.5 }, catBake: edadplataBake, prepare: prepEdadplata, ground: 0x2a1c0c },
  nocturna: { id: 'nocturna', look: { grain: 0.13, vig: 0.66, duo: 1, duoA: 0x010a03, duoB: 0xd2ffbe, lift: 0.0, contrast: 1.22, hal: 0.5, halT: 0.6, halR: 9 }, catBake: planoBake, prepare: prepNocturna, ground: 0x020a03 },
  manga: { id: 'manga', look: { grain: 0.02, vig: 0.12, mono: 0.97, accHue: 0.58, accW: 0.09, contrast: 1.06, paper: 0.25 }, catBake: mangaBake, prepare: prepManga, ground: 0x0c0c0c },
  hilo: { id: 'hilo', look: { grain: 0.03, vig: 0.45, sat: 1.05, contrast: 1.05, hal: 0.45, halT: 0.7, halR: 8, warm: -0.06 }, catBake: animeBake, prepare: prepHilo, ground: 0x0a0d2e },
  caravaggio: { id: 'caravaggio', look: { grain: 0.03, vig: 0.66, sat: 0.95, contrast: 1.18, warm: 0.16, canvas: 0.4, hal: 0.25, halT: 0.75, halR: 9 }, catBake: tenebrismoBake, prepare: prepCaravaggio, ground: 0x070504 },
};
