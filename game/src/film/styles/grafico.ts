/**
 * PELÍCULAS — the GRAPHIC styles (FILM-ACTO1): print, screen and toy treatments of the owner-approved MAI paintings,
 * baked ONCE per film (Studio bake: new textures of the painting's exact size, so the CatPuppet rig animates the treated
 * painting at zero per-frame cost), each with its post look and the paper / screen textures its sets use.
 *
 *   tv          La Borracha's colour TV cartoon (momentos/songs/drunck/tv.ts): the natives (Hipólito, Espuma, Dona) as
 *               painted, the visitors through the TV lens. Bakes the TV screen: scanlines, static, a soft glow.
 *   sombras     shadow theatre: the cut-out is a warm dark brown (never black) with a rim of lamp light on one side
 *   estencil    stencil & propaganda poster: black + red ink over kraft, bridges, overspray
 *   fotocopia   a photocopied flyer: hard black & white, coarse toner halftone, speckle
 *   vhs         a home-video tape: the TV cartoon washed and smeared by the post (low sat, chroma bleed, halation)
 *   cartel      a lucha-libre poster: two inks (red halftone + black) on yellow paper, a touch of misregistration
 *   comic       a printed comic: flat colour, halftone dots in the shade, thick outline, misregistration
 *   anime       the Momentos' cel bake (Kuwahara + cel shadow + coloured line)
 *   pixel       an 8-bit sprite: blocks, a short palette, a dark one-block outline
 *   plastilina  clay: soft colour, a big specular highlight from the top-left, fingerprints
 *
 * Shared texture names (ctx.tex): 'tv:scan' 'tv:static' 'tv:glow' · 'sb:spot' · 'es:kraft' · 'fc:paper' · 'vh:snow'
 * 'vh:track' · 'ca:paper' · 'cm:dots'. Docs: docs/part-iii/cine-v2/03-estilos-graficos.md.
 */
import { Container, Filter, GlProgram, RenderTexture, Sprite, type Renderer, type Texture } from 'pixi.js';
import { NOISE, VERTEX } from '../gl';
import { BAKE_UV, type Baker } from '../bake';
import type { CatBake } from './catbake';
import type { StyleModule, StylePrep } from './index';
import { bakePlain, bakeTv } from '../../momentos/songs/drunck/tv';
import { bakeCel } from '../../momentos/anime/shaders';

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
// the alpha averaged on a ring of radius r (texels × uScale): edges, overspray, rims
float ringA(vec2 uv, float r) {
  float s = 0.0;
  for (int i = 0; i < 8; i++) { float a = float(i) * 0.7854; s += S(uv + vec2(cos(a), sin(a)) * r * uScale * uTexel).a; }
  return s / 8.0;
}
// luminance smoothed over a small disc (prints read form, not fur)
float Ls(vec2 uv, float r) {
  float s = L(uv) * 2.0;
  for (int i = 0; i < 6; i++) { float a = float(i) * 1.0472; s += L(uv + vec2(cos(a), sin(a)) * r * uScale * uTexel); }
  return s / 8.0;
}
`;

// ------------------------------------------------------------------ shadow theatre
const SOMBRA = `${HEAD}
uniform vec2 uLight;
void main() {
  vec2 uv = vTextureCoord;
  float a = S(uv).a;
  if (a < 0.02) { finalColor = vec4(0.0); return; }
  a = smoothstep(0.25, 0.6, a);
  // rim: the edge that faces the lamp (the alpha drops toward the light)
  vec2 l = normalize(uLight);
  float toward = S(uv + l * 7.0 * uScale * uTexel).a;
  float rim = smoothstep(0.15, 0.85, a - toward);
  vec2 px = uv / uTexel / uScale;
  float fiber = vnoise(px * vec2(0.08, 0.6)) * 0.06;
  vec3 body = vec3(0.19, 0.115, 0.075) + fiber;
  vec3 col = mix(body, vec3(1.0, 0.78, 0.45), rim * 0.95);
  finalColor = vec4(col * a, a);
}`;

// ------------------------------------------------------------------ stencil
const STENCIL = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  vec2 px = uv / uTexel / uScale;
  float ring = ringA(uv, 10.0);
  if (c0.a < 0.5) {
    // overspray: red droplets around the cut, thinning outward
    float d = hash12(floor(px * 0.55));
    float o = step(1.0 - ring * 0.35, d) * step(0.04, ring);
    finalColor = vec4(vec3(0.72, 0.1, 0.09) * o * 0.85, o * 0.85);
    return;
  }
  float l = Ls(uv, 3.0);
  vec3 ink = vec3(0.07, 0.055, 0.06), red = vec3(0.78, 0.11, 0.09), kraft = vec3(0.78, 0.62, 0.43);
  // three plates; the dark plate gets bridges (the paper ties a stencil leaves)
  float dark = step(l, 0.36);
  float mid = step(l, 0.66) * (1.0 - dark);
  float bridge = step(abs(fract(px.x / 70.0 + px.y / 260.0) - 0.5), 0.03) * dark;
  vec3 col = dark > 0.5 ? ink : mid > 0.5 ? red : kraft;
  col = mix(col, kraft, bridge);
  // the outline is ink; the spray is a little uneven inside
  float edge = smoothstep(0.92, 0.6, ring);
  col = mix(col, ink, edge);
  col *= 0.94 + 0.08 * vnoise(px * 0.25);
  finalColor = vec4(col, 1.0);
}`;

// ------------------------------------------------------------------ photocopy
const COPIA = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.5) { finalColor = vec4(0.0); return; }
  vec2 px = uv / uTexel / uScale;
  float l = smoothstep(0.22, 0.78, Ls(uv, 2.0));
  // coarse 45° toner dots for the greys
  vec2 r = mat2(0.7071, -0.7071, 0.7071, 0.7071) * px / 9.0;
  vec2 cell = fract(r) - 0.5;
  float dotR = sqrt(max(0.0, 1.0 - l)) * 0.62;
  float dots = 1.0 - smoothstep(dotR - 0.08, dotR + 0.08, length(cell));
  float ink = l < 0.28 ? 1.0 : l > 0.86 ? 0.0 : dots;
  float edge = smoothstep(0.35, 0.8, length(grad(uv, 2.0 * uScale)));
  ink = max(ink, edge);
  // toner speckle and a missing streak
  ink = max(ink, step(0.992, hash12(floor(px * 0.8))));
  ink *= 1.0 - step(0.985, vnoise(vec2(px.x * 0.02, 3.0))) * 0.6;
  vec3 col = mix(vec3(0.95, 0.94, 0.92), vec3(0.05), ink);
  finalColor = vec4(col, 1.0);
}`;

// ------------------------------------------------------------------ two-ink poster
const DOSTINTAS = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.5) { finalColor = vec4(0.0); return; }
  vec2 px = uv / uTexel / uScale;
  float l = Ls(uv, 2.5);
  // the red plate is printed 3 px off (misregistration), as halftone
  float lr = Ls(uv + vec2(3.0, -2.0) * uScale * uTexel, 2.5);
  vec2 r = mat2(0.866, -0.5, 0.5, 0.866) * px / 8.0;
  float dotR = sqrt(clamp((0.92 - lr) / 0.6, 0.0, 1.0)) * 0.66;
  float red = 1.0 - smoothstep(dotR - 0.07, dotR + 0.07, length(fract(r) - 0.5));
  red = lr < 0.42 ? 1.0 : red;
  float black = step(l, 0.3);
  black = max(black, smoothstep(0.3, 0.75, length(grad(uv, 2.0 * uScale))));
  black = max(black, smoothstep(0.9, 0.55, ringA(uv, 4.0)));
  vec3 paper = vec3(0.97, 0.8, 0.24);
  vec3 col = mix(paper, vec3(0.86, 0.13, 0.11), red * 0.95);
  col = mix(col, vec3(0.09, 0.06, 0.06), black);
  finalColor = vec4(col, 1.0);
}`;

// ------------------------------------------------------------------ printed comic
const COMIC = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.5) { finalColor = vec4(0.0); return; }
  vec2 px = uv / uTexel / uScale;
  // flat colour (averaged), pushed, three tone steps
  vec3 acc = C(uv) * 2.0;
  for (int i = 0; i < 6; i++) { float a = float(i) * 1.0472; acc += C(uv + vec2(cos(a), sin(a)) * 4.0 * uScale * uTexel); }
  vec3 col = acc / 8.0;
  float l = lum(col);
  col = mix(vec3(l), col, 1.35);
  float step3 = floor(l * 3.0 + 0.5) / 3.0;
  col *= mix(0.78, 1.12, step3);
  // halftone dots in the shade (red-violet ink), misregistered
  vec2 r = mat2(0.9659, -0.2588, 0.2588, 0.9659) * (px + vec2(2.0, 1.0)) / 7.0;
  float dotR = sqrt(clamp((0.62 - l) / 0.5, 0.0, 1.0)) * 0.6;
  float dots = 1.0 - smoothstep(dotR - 0.08, dotR + 0.08, length(fract(r) - 0.5));
  col = mix(col, col * vec3(0.55, 0.45, 0.7), dots * 0.75);
  // the thick black line
  float edge = max(smoothstep(0.35, 0.8, length(grad(uv, 2.5 * uScale))), smoothstep(0.92, 0.55, ringA(uv, 5.0)));
  col = mix(clamp(col, 0.0, 1.0), vec3(0.06, 0.05, 0.08), edge);
  finalColor = vec4(col, 1.0);
}`;

// ------------------------------------------------------------------ 8-bit
const PIXEL = `${HEAD}
uniform float uBlock;
void main() {
  vec2 b = uTexel * uBlock * uScale;
  vec2 q = (floor(vTextureCoord / b) + 0.5) * b;
  vec4 c = S(q);
  float a = step(0.5, c.a);
  // a dark outline one block wide (the neighbour block is empty)
  float n = min(min(S(q + vec2(b.x, 0.0)).a, S(q - vec2(b.x, 0.0)).a), min(S(q + vec2(0.0, b.y)).a, S(q - vec2(0.0, b.y)).a));
  float outA = step(0.5, max(max(S(q + vec2(b.x, 0.0)).a, S(q - vec2(b.x, 0.0)).a), max(S(q + vec2(0.0, b.y)).a, S(q - vec2(0.0, b.y)).a)));
  if (a < 0.5) {
    finalColor = outA > 0.5 ? vec4(vec3(0.06, 0.04, 0.12), 1.0) : vec4(0.0);
    return;
  }
  vec3 col = c.rgb / max(c.a, 1e-3);
  col = mix(vec3(lum(col)), col, 1.3);
  col = floor(clamp(col, 0.0, 1.0) * 3.0 + 0.5) / 3.0;
  if (n < 0.5) col *= 0.55;
  finalColor = vec4(col, 1.0);
}`;

// ------------------------------------------------------------------ clay
const CLAY = `${HEAD}
void main() {
  vec2 uv = vTextureCoord;
  // a soft silhouette: the blurred alpha
  float ra = (S(uv).a * 2.0 + ringA(uv, 6.0) * 3.0 + ringA(uv, 12.0) * 3.0) / 8.0;
  float a = smoothstep(0.42, 0.6, ra);
  if (a < 0.01) { finalColor = vec4(0.0); return; }
  vec3 acc = C(uv);
  for (int i = 0; i < 8; i++) { float an = float(i) * 0.7854; acc += C(uv + vec2(cos(an), sin(an)) * 9.0 * uScale * uTexel); }
  vec3 col = acc / 9.0;
  col = mix(vec3(lum(col)), col, 1.25);
  col = floor(col * 6.0 + 0.5) / 6.0;
  // the mass: a normal from the blurred alpha + light, a fat highlight top-left
  vec2 e = uTexel * 10.0 * uScale;
  vec2 g = vec2(ringA(uv + vec2(e.x, 0.0), 6.0) - ringA(uv - vec2(e.x, 0.0), 6.0), ringA(uv + vec2(0.0, e.y), 6.0) - ringA(uv - vec2(0.0, e.y), 6.0));
  vec3 n = normalize(vec3(-g * 2.2, 1.0));
  vec3 L3 = normalize(vec3(-0.55, -0.6, 0.6));
  float dif = clamp(dot(n, L3), 0.0, 1.0);
  float spec = pow(clamp(dot(reflect(-L3, n), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 18.0);
  col = col * (0.62 + 0.5 * dif) + spec * 0.35;
  // thumb prints
  vec2 px = uv / uTexel / uScale;
  float prints = sin(length(px - vec2(300.0, 260.0)) * 0.55) * sin(length(px - vec2(720.0, 680.0)) * 0.5);
  col *= 0.97 + 0.04 * prints * vnoise(px * 0.01);
  finalColor = vec4(clamp(col, 0.0, 1.0) * a, a);
}`;

const f1 = (value: number) => ({ value, type: 'f32' });
const v2 = (x: number, y: number) => ({ value: new Float32Array([x, y]), type: 'vec2<f32>' });

/** natives of La Borracha (their paintings already wear the TV line: no bake) */
const TV_NATIVES = /hipolito_tavern|espuma_bartender|dona_police/;
export const tvBake: CatBake = (r, src, slug) => (TV_NATIVES.test(slug ?? '') ? bakePlain(r, src) : bakeTv(r, src, slug));
export const sombraBake: CatBake = (r, src) => withSil(r, pass(r, src, SOMBRA, { uLight: v2(-0.8, -0.6) }));
export const estencilBake: CatBake = (r, src) => withSil(r, pass(r, src, STENCIL));
export const copiaBake: CatBake = (r, src) => withSil(r, pass(r, src, COPIA));
export const carteleBake: CatBake = (r, src) => withSil(r, pass(r, src, DOSTINTAS));
export const comicBake: CatBake = (r, src) => withSil(r, pass(r, src, COMIC));
export const animeBake: CatBake = (r, src) => bakeCel(r, src, { flat: 0.85, sat: 1.15 });
export const pixelBake: CatBake = (r, src) => withSil(r, pass(r, src, PIXEL, { uBlock: f1(26) }));
export const clayBake: CatBake = (r, src) => withSil(r, pass(r, src, CLAY));

// ------------------------------------------------------------------ paper / screen textures (bake jobs)
const shade = (b: Baker, name: string, w: number, h: number, body: string) => b.shade(name, w, h, `${BAKE_UV}\n${body}`, {}, {}, { res: 1 });

function prepTv(p: StylePrep) {
  p.baker.add('tv:screen', 'la pantalla de la tele', () => {
    // scanlines: one dark row every 4 px (tile 8 × 4)
    p.tex.set('tv:scan', shade(p.baker, 'tv-scan', 8, 4, `void main() { vec2 uv = bakeUV(); float row = floor(uv.y * 4.0); finalColor = row > 2.5 ? vec4(0.0, 0.0, 0.0, 1.0) : vec4(0.0); }`));
    p.tex.set('tv:static', shade(p.baker, 'tv-static', 512, 512, `void main() { vec2 uv = bakeUV(); float n = hash12(floor(uv * 256.0)); float l = step(0.5, n) * (0.55 + 0.45 * hash12(floor(uv * 256.0) + 7.0)); finalColor = vec4(vec3(l), 1.0); }`));
    p.tex.set('tv:glow', shade(p.baker, 'tv-glow', 256, 256, `void main() { vec2 uv = bakeUV() - 0.5; float d = length(uv) * 2.0; float a = pow(max(0.0, 1.0 - d), 2.2); finalColor = vec4(vec3(a), a); }`));
  });
}
function prepSombras(p: StylePrep) {
  p.baker.add('sombras:luz', 'la luz de la lámpara', () => {
    p.tex.set(
      'sb:spot',
      shade(
        p.baker,
        'sb-spot',
        1024,
        1024,
        `void main() {
  vec2 uv = bakeUV();
  float d = length(uv - 0.5) * 2.0;
  float pl = fbm(uv * 9.0) * 0.08 + vnoise(uv * 140.0) * 0.03;
  float lit = smoothstep(1.0, 0.82, d) * (0.92 + 0.08 * (1.0 - d));
  vec3 wall = vec3(0.98, 0.84, 0.58) - pl;
  vec3 col = wall * lit + vec3(0.2, 0.12, 0.07) * (1.0 - lit);
  finalColor = vec4(col, 1.0);
}`,
      ),
    );
  });
}
function paper(p: StylePrep, job: string, key: string, label: string, body: string) {
  p.baker.add(job, label, () => {
    p.tex.set(key, shade(p.baker, key.replace(':', '-'), 1024, 1024, body));
  });
}
function prepEstencil(p: StylePrep) {
  paper(
    p,
    'estencil:kraft',
    'es:kraft',
    'papel kraft',
    `void main() {
  vec2 uv = bakeUV();
  float n = pfbm(uv * 5.0, 5.0);
  float fib = pnoise(uv * vec2(40.0, 400.0), 40.0) * 0.5 + pnoise(uv * vec2(400.0, 40.0), 40.0) * 0.5;
  vec3 col = mix(vec3(0.66, 0.5, 0.33), vec3(0.8, 0.64, 0.45), n) * (0.94 + fib * 0.1);
  float stain = smoothstep(0.62, 0.7, pfbm(uv * 3.0 + 4.0, 3.0));
  col *= 1.0 - stain * 0.12;
  finalColor = vec4(col, 1.0);
}`,
  );
}
function prepFotocopia(p: StylePrep) {
  paper(
    p,
    'fotocopia:papel',
    'fc:paper',
    'papel de copiadora',
    `void main() {
  vec2 uv = bakeUV();
  float speck = step(0.994, pnoise(uv * 520.0, 520.0)) + step(0.9985, hash12(floor(uv * 1024.0)));
  float streak = smoothstep(0.86, 1.0, pnoise(vec2(uv.x * 60.0, 2.0), 60.0)) * 0.25;
  float edge = smoothstep(0.0, 0.06, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
  vec3 col = vec3(0.95, 0.945, 0.93) - streak - speck * 0.8;
  col = mix(vec3(0.3), col, 0.25 + 0.75 * edge);
  finalColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`,
  );
}
function prepVhs(p: StylePrep) {
  p.baker.add('vhs:cinta', 'la cinta de video', () => {
    p.tex.set('vh:snow', shade(p.baker, 'vh-snow', 512, 512, `void main() { vec2 uv = bakeUV(); vec2 c = floor(uv * vec2(256.0, 512.0)); float n = hash12(c) * 0.8 + hash12(c * 1.7 + 3.0) * 0.2; finalColor = vec4(vec3(n), 1.0); }`));
    p.tex.set(
      'vh:track',
      shade(
        p.baker,
        'vh-track',
        1024,
        128,
        `void main() {
  vec2 uv = bakeUV();
  float band = smoothstep(0.0, 0.35, uv.y) * smoothstep(1.0, 0.65, uv.y);
  float n = step(0.55, pnoise(vec2(uv.x * 220.0, floor(uv.y * 40.0) * 3.0), 220.0)) * band;
  float line = step(0.93, pnoise(vec2(uv.x * 6.0, floor(uv.y * 16.0)), 6.0)) * band;
  float a = clamp(n * 0.7 + line, 0.0, 1.0);
  finalColor = vec4(vec3(a), a);
}`,
      ),
    );
  });
}
function prepCartel(p: StylePrep) {
  paper(
    p,
    'cartel:papel',
    'ca:paper',
    'papel de cartel',
    `void main() {
  vec2 uv = bakeUV();
  float n = pfbm(uv * 6.0, 6.0);
  float fib = pnoise(uv * vec2(300.0, 60.0), 60.0);
  vec3 col = mix(vec3(0.93, 0.74, 0.2), vec3(0.99, 0.84, 0.32), n) * (0.95 + fib * 0.07);
  finalColor = vec4(col, 1.0);
}`,
  );
}
function prepComic(p: StylePrep) {
  p.baker.add('comic:puntos', 'la trama del cómic', () => {
    p.tex.set('cm:dots', shade(p.baker, 'cm-dots', 64, 64, `void main() { vec2 uv = bakeUV(); vec2 c = fract(uv * 4.0) - 0.5; float a = 1.0 - smoothstep(0.26, 0.32, length(c)); finalColor = vec4(vec3(a), a); }`));
  });
}

export const GRAFICO_MODULES: Record<string, StyleModule> = {
  tv: { id: 'tv', look: { grain: 0.035, vig: 0.28, sat: 1.06, contrast: 1.03, hal: 0.12, halT: 0.8, halR: 6 }, catBake: tvBake, prepare: prepTv, ground: 0x1d1430 },
  sombras: { id: 'sombras', look: { grain: 0.04, vig: 0.62, warm: 0.26, sat: 0.95, contrast: 1.06, lift: 0.02, paper: 0.3 }, catBake: sombraBake, prepare: prepSombras, ground: 0x140b07 },
  estencil: { id: 'estencil', look: { grain: 0.05, vig: 0.3, sat: 1.05, contrast: 1.08, paper: 0.4, warm: 0.04 }, catBake: estencilBake, prepare: prepEstencil, ground: 0x2a1a10 },
  fotocopia: { id: 'fotocopia', look: { grain: 0.13, vig: 0.26, mono: 1, contrast: 1.3, lift: 0.03, dirt: 0.35, paper: 0.25 }, catBake: copiaBake, prepare: prepFotocopia, ground: 0x0e0e0e },
  vhs: { id: 'vhs', look: { grain: 0.09, vig: 0.42, sat: 0.7, contrast: 0.95, lift: 0.06, aberr: 1.6, hal: 0.3, halT: 0.65, halR: 8, warm: 0.06 }, catBake: tvBake, prepare: prepVhs, ground: 0x07060a },
  cartel: { id: 'cartel', look: { grain: 0.04, vig: 0.22, sat: 1.06, contrast: 1.05, paper: 0.45 }, catBake: carteleBake, prepare: prepCartel, ground: 0x2a1406 },
  comic: { id: 'comic', look: { grain: 0.02, vig: 0.18, sat: 1.1, contrast: 1.05 }, catBake: comicBake, prepare: prepComic, ground: 0x10081c },
  anime: { id: 'anime', look: { grain: 0.015, vig: 0.22, sat: 1.1, contrast: 1.05, hal: 0.25, halT: 0.75, halR: 9 }, catBake: animeBake, ground: 0x0a1030 },
  pixel: { id: 'pixel', look: { grain: 0, vig: 0.2, sat: 1.1, contrast: 1.04 }, catBake: pixelBake, ground: 0x06040e },
  plastilina: { id: 'plastilina', look: { grain: 0.02, vig: 0.3, sat: 1.05, warm: 0.08, contrast: 1.02, hal: 0.1 }, catBake: clayBake, ground: 0x2a1a12 },
};
