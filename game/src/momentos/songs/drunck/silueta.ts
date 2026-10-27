/**
 * SILUETA — la regla única de sombras y siluetas del arranque (docs/part-iii/13 §2.2). Dueño: LUZ. Lo usan la calle con
 * Luzterna (scenes/CajaScene.ts + scenes/caja/calle.ts) y el Momento «Drunck» (MOMENTO).
 *
 * NUNCA se reemplaza a un personaje por una figura genérica: la silueta SALE DEL ARTE REAL. El tratamiento es un shader
 * de malla que se pone sobre el puppet vivo (CatPuppet) o sobre un gemelo de malla de un Sprite: conserva el contorno
 * exacto, la pose y la actuación (el puppet sigue parpadeando, moviendo la cola y las orejas). Trabaja en el espacio de
 * la PINTURA (las uv de la malla), así que los ojos y los accesorios se ubican con las coordenadas del rig y se deforman
 * con él (un parpadeo cierra también los ojos de la silueta). Costo: una vez el shader; por cuadro solo uniforms.
 *
 * Capas (de abajo hacia arriba):
 *   1. CUERPO   el color de línea de la escena (nunca negro puro: `safeBody` lo levanta), con una gradación vertical muy
 *               suave del tono del personaje (`body` abajo → `bodyTop` arriba) y un poquito de la forma de la pintura
 *               (`detail`): no es un hueco plano. `close` rellena los huecos de la silueta (horneado una vez).
 *   2. ACCESORIO regiones de la pintura que se quedan EN COLOR (la bufanda de Canelo, la linterna de Luzterna): con su
 *               propio sombreado a contraluz (`keepShade`: la tela conserva el tejido) o encendidas (`keepGlow`: la
 *               linterna). Presets por gato, ajustados a la tela: `siluetaKeep(slug)`.
 *   3. OJOS     del rig (`catRigs` `eyes`): 'keep' (pintados), 'glow' (encendidos, color `eyeColor`, con un halo suave;
 *               parpadean con el puppet) u 'off'. Una silueta que mira a cámara SIN ojos es una mancha: usar 'glow'.
 *   4. BORDE    luz de borde del lado de la fuente: `light` (y una segunda luz opcional `light2`). `dir` = hacia dónde está
 *               la luz EN PANTALLA ([1,0] = a la derecha); [0,0] = contraluz (borde alrededor, más fuerte arriba y en los
 *               lados). Núcleo casi blanco pegado al borde + caída del color de la luz. `width` en px de diseño, 2–6 px.
 *   5. HALO     separación del fondo: la silueta difuminada (horneada UNA vez, a 1/4 de resolución) detrás del personaje.
 *
 * Transiciones (preparación → desarrollo → salida; nunca un corte seco de color a mancha):
 *   `k`   (0 → 1) ENTRADA: la luz se mueve a su lado (gira desde `light.from`) y el borde aparece; después el color se
 *         escurre de los PIES hacia la cabeza con una línea de luz en el frente. Con `enter(dur)` dura 0,3–0,6 s.
 *   `out` (0 → 1) SALIDA, según `how`:
 *         'flood'    el color vuelve como una ola desde la CABEZA (la cara regresa primero);
 *         'dissolve' se vuelve luz cálida (`dissolveColor`) y se deshace en motas desde los pies: cruza a otra parte.
 *                    Nunca estática: la estática es el idioma de REGISTRO 000.
 *   Las dos son números: una cine los maneja con `drive` (SALTAR los lleva a su valor final) o con `enter()`/`exit()`.
 *   «Reducir movimiento»: sin frente que viaja ni luz que gira; fundidos (`siluetaCurve(..., rm=true)`).
 *
 * API
 *   const s = new Silueta(puppet, { light: { dir: [0, 0], color: 0xffd27a }, keep: siluetaKeep(slug), eyes: 'off' });
 *   s.k = 1;  s.how = 'flood';  s.out = 1;     // o: s.enter(0.5) · s.exit('dissolve', 0.8)
 *   s.rimRest = 1;                             // «modo borde»: pintura a color + luz de borde (sin silueta)
 *   s.light = {...}; s.light2 = {...};         // se pueden cambiar en vivo
 *   s.update(dt);                              // cada cuadro, con el reloj del dueño (antes de dibujar)
 *   s.destroy();                               // devuelve el shader normal al puppet y quita el halo
 *   Silueta.fromSprite(sprite, { slug, ... })  // para un Sprite: crea un gemelo de malla en su lugar (lo oculta);
 *                                              // `slug` = la pintura (para los ojos y la cabeza del rig)
 *   siluetaCurve(k, out, how, rm)              // puro: lo que se ve en cada punto de la transición (pruebas)
 *   safeBody(color)                            // puro: el color del cuerpo, nunca negro puro
 */
import { BlurFilter, Container, Filter, GlProgram, Matrix, Mesh, MeshGeometry, RenderTexture, Shader, Sprite, UniformGroup, type Renderer, type Texture } from 'pixi.js';
import { catRig, type CatRig } from '../../../art/puppetCore';
import { settings } from '../../../core/settings';
import { game } from '../../../core/App';

/** a painting region (painting px, the rig's space): centre, radii, (optional) a turn in radians and a strength 0..1 */
export type Region = [cx: number, cy: number, rx: number, ry: number, angle?: number, strength?: number];
export interface SiluetaLight {
  /** where the light is ON SCREEN, from the character ([1,0] right, [0,-1] above); [0,0] = backlight all around */
  dir: [number, number];
  color: number;
  /** design px (1920×1080 box), default 3.5 */
  width?: number;
  /** 0..1, default 1 */
  alpha?: number;
  /** where the light comes FROM during the preparation (default: `dir` turned 75°) */
  from?: [number, number];
}
export interface SiluetaOpts {
  /** the dark body: the scene's line color (default a night plum) — never pure black */
  body?: number;
  /** 0..0.4: how much of the painting's light and shade shows through the body (default 0.12) */
  detail?: number;
  light?: SiluetaLight;
  light2?: SiluetaLight | null;
  eyes?: 'keep' | 'glow' | 'off';
  eyeColor?: number;
  /** regions kept in color (painting px) — `siluetaKeep(slug)` has the presets; 'pins' = the rig's pins */
  keep?: Region[] | 'pins' | null;
  /** 0..1: the kept regions glow (a lit lantern) */
  keepGlow?: number;
  /** 0..1: the kept regions sit in the shade of the backlight (fabric keeps its knit, darker) */
  keepShade?: number;
  /** the body's top color: a very subtle vertical gradient of the character's own hue (default: `body`) */
  bodyTop?: number;
  /** the color he dissolves into (default warm cream light) */
  dissolveColor?: number;
  /** fill the holes of the silhouette (painting px of the widest gap to close; 0 = off). One-time bake */
  close?: number;
  /** the separation halo behind (false = none) */
  halo?: { color: number; alpha?: number; spread?: number } | false;
  /** rim over the painted body while `k` = 0 («modo borde») */
  rimRest?: number;
  /** the rig (default: catRig of `slug`, or of the puppet's own slug) */
  rig?: CatRig | null;
  /** the painting's slug (a Sprite twin has none of its own: pass it to get the rig's eyes) */
  slug?: string;
  /** painting size in the mesh's local units (default: the puppet's W×H, or the texture size) */
  size?: [number, number];
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const bell = (x: number) => (x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x));

/** the body color: never pure black (a color this dark is lifted towards a night plum) */
export function safeBody(c: number): number {
  const r = (c >> 16) & 255;
  const g = (c >> 8) & 255;
  const b = c & 255;
  const l = 0.299 * r + 0.587 * g + 0.114 * b;
  if (l >= 14) return c;
  return 0x1d1430;
}

export type SiluetaHow = 'flood' | 'dissolve';
/** what the treatment shows at a point of its transitions (pure) */
export interface SiluetaLook {
  /** the drain front, 0 = feet … 1 = top of the head (fragments below it are dark) */
  front: number;
  /** 0..1 global mix of the dark body (the reduced-motion crossfade; 1 otherwise) */
  mix: number;
  /** the line of light riding the front (0..1) */
  glow: number;
  /** how far the light has turned to its side (0 = `from`, 1 = `dir`) */
  swing: number;
  /** rim light amount (0..1) */
  rim: number;
  /** dissolve threshold (0 none … >1 gone) */
  dissolve: number;
  /** overall alpha */
  fade: number;
}
export function siluetaCurve(k: number, out: number, how: SiluetaHow, rm: boolean, rimRest = 0): SiluetaLook {
  k = clamp(k, 0, 1);
  out = clamp(out, 0, 1);
  if (rm) {
    // «Reducir movimiento»: crossfades — no travelling front, no turning light, no dissolve
    const on = k * (how === 'flood' ? 1 - out : 1);
    return { front: 1.25, mix: on, glow: 0, swing: 1, rim: Math.max(rimRest, on), dissolve: 0, fade: how === 'dissolve' ? 1 - out : 1 };
  }
  const swing = smooth(0, 0.4, k);
  const rimIn = smooth(0, 0.3, k);
  const d = smooth(0.15, 1, k);
  let front = lerp(-0.25, 1.25, d);
  let glow = bell(d) * 0.9;
  let rim = rimIn;
  let dissolve = 0;
  let fade = 1;
  if (out > 0) {
    if (how === 'flood') {
      // the color comes back as a wave from the head down (the face first)
      const q = smooth(0, 1, out);
      front = lerp(front, -0.25, q);
      glow = Math.max(glow * (1 - q), bell(q) * 0.9);
      rim = rimIn * (1 - smooth(0.45, 1, out));
    } else {
      // it comes apart into the light (bright edges) and is gone
      dissolve = out * 1.15;
      fade = 1 - smooth(0.9, 1, out);
    }
  }
  return { front, mix: 1, glow, swing, rim: Math.max(rimRest, rim), dissolve, fade };
}

/** the key accessory of each painting, kept in color (painting px) */
const KEEP: Record<string, Region[]> = {
  // Canelo's scarf, per form: the end that hangs (fabric: its knit, its fringe) kept in its own shaded colors; the band
  // round the neck only as a faint hint (fully kept, right under glowing eyes, it read as a grin)
  canelo_cozy_cat: [
    [394, 418, 34, 66, -0.58, 1],
    [292, 330, 122, 34, 0.06, 0.2],
  ],
  canelo_admiral_cat: [
    [369, 410, 34, 74, -0.08, 1],
    [305, 324, 108, 30, 0.04, 0.2],
  ],
  canelo_astral_cat: [
    [434, 420, 40, 66, -0.3, 1],
    [320, 336, 148, 40, 0.05, 0.2],
  ],
  // Luzterna's lantern (her blue light)
  luzterna: [[104, 318, 74, 104]],
  lantern_spirit_cat: [[472, 150, 40, 40]],
};
export function siluetaKeep(slug: string): Region[] | null {
  return KEEP[slug] ?? null;
}

// ------------------------------------------------------------------ the shader
const VERT = `in vec2 aPosition;
in vec2 aUV;
out vec2 vUV;
out vec4 vColor;
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform vec4 uWorldColorAlpha;
uniform mat3 uTransformMatrix;
uniform vec4 uColor;
void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vUV = aUV;
  vColor = uColor * uWorldColorAlpha;
}`;

const FRAG = `precision highp float;
in vec2 vUV;
in vec4 vColor;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform sampler2D uClosed;
uniform mat3 uTexM;
uniform vec4 uShape;
uniform vec4 uDrain;
uniform vec4 uFx;
uniform vec4 uKeepFx;
uniform vec4 uMisc;
uniform vec3 uBody;
uniform vec3 uBodyTop;
uniform vec3 uRimC;
uniform vec4 uRimO;
uniform vec3 uRim2C;
uniform vec4 uRim2O;
uniform vec3 uEyeC;
uniform vec3 uDisC;
uniform vec4 uEye0;
uniform vec4 uEye1;
uniform vec4 uKeep0;
uniform vec4 uKeep1;
uniform vec4 uKeep2;
uniform vec4 uKeep3;
uniform vec4 uKeepA;
uniform vec4 uKeepS;
float DR = 0.0;
vec2 tuv(vec2 uv) { return (uTexM * vec3(uv, 1.0)).xy; }
// the alpha the rim sees: in silhouette, the CLOSED alpha (holes filled: a clean outline)
float al(vec2 uv) {
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 0.0;
  vec2 t = tuv(uv);
  float a = texture(uTexture, t).a;
  if (uMisc.x > 0.0) a = mix(a, max(a, texture(uClosed, t).a), DR * uMisc.x);
  return a;
}
// outside the shape (the soft outer outline counts as outside: a crisp rim, not a grey half-lit band)
float outs(vec2 uv) { return 1.0 - smoothstep(0.3, 0.65, al(uv)); }
// rim: x = the lit band (warm falloff), y = its hot core right at the edge.
// o.xy = offset towards the light (uv); o.zw = backlight radius (uv) when xy is zero
vec2 rim(vec4 o, vec2 uv) {
  if (dot(o.xy, o.xy) > 1e-12) {
    float core = outs(uv + o.xy * 0.5);
    float band = max(max(core, outs(uv + o.xy * 0.75)), 0.7 * outs(uv + o.xy));
    return vec2(band, core);
  }
  if (o.z <= 0.0) return vec2(0.0);
  float band = 0.0;
  float core = 0.0;
  for (int i = 0; i < 8; i++) {
    float an = float(i) * 0.7853982;
    vec2 d = vec2(cos(an), sin(an));
    // strongest on the top and the outer sides, softer underneath
    float w = clamp(0.5 + 0.55 * max(0.0, -d.y) + 0.35 * abs(d.x), 0.0, 1.0);
    core = max(core, outs(uv + d * o.zw * 0.5) * w);
    band = max(band, max(outs(uv + d * o.zw * 0.75), 0.7 * outs(uv + d * o.zw)) * w);
  }
  return vec2(max(band, core), core);
}
vec3 rimLight(vec3 c, vec2 r) { return mix(c, vec3(1.0, 0.98, 0.94), 0.85 * r.y) * max(r.x * 0.9, r.y * 1.15); }
float ell(vec2 uv, vec4 e, float k, float soft) {
  if (e.z <= 0.0) return 0.0;
  return 1.0 - smoothstep(soft, 1.0, length((uv - e.xy) / (e.zw * k)));
}
// a kept region: turned ellipse, very soft edge (the fabric fades into the shade, no cut-out plate)
float kell(vec2 uv, vec4 e, float an) {
  if (e.z <= 0.0) return 0.0;
  vec2 p = uv - e.xy;
  float cs = cos(an);
  float sn = sin(an);
  p = vec2(p.x * cs + p.y * sn, -p.x * sn + p.y * cs);
  return 1.0 - smoothstep(0.45, 1.0, length(p / e.zw));
}
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
}
vec3 scr(vec3 a, vec3 b) { return 1.0 - (1.0 - a) * (1.0 - clamp(b, 0.0, 1.0)); }
void main() {
  vec2 t = tuv(vUV);
  vec4 c = texture(uTexture, t);
  // 0 at the feet … 1 at the top of the head (painting space: it drains from HIS feet, even lying down)
  float s = (uShape.x - vUV.y) / max(1e-4, uShape.x - uShape.y);
  float dr = smoothstep(-uShape.z, uShape.z, uDrain.x - s) * uDrain.z;
  DR = dr;
  float a = c.a;
  float ac = uMisc.x > 0.0 ? max(a, texture(uClosed, t).a) : a;
  float A0 = mix(a, ac, dr * uMisc.x);
  if (A0 < 0.003) { finalColor = vec4(0.0); return; }
  vec3 col = a > 0.003 ? c.rgb / a : uBody;
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  // the body: never flat — a very subtle vertical gradient of the character's own hue (lighter towards the head)
  vec3 body = mix(uBody, uBodyTop, smoothstep(0.0, 1.05, s)) * (1.0 + uShape.w * (l - 0.45) * 2.2 * step(0.003, a));
  float eyeK = uFx.z;
  float eyeIn = max(ell(vUV, uEye0, 1.0, 0.72), ell(vUV, uEye1, 1.0, 0.72)) * eyeK;
  float eyeBloom = max(ell(vUV, uEye0, 2.1, 0.0), ell(vUV, uEye1, 2.1, 0.0)) * eyeK * uFx.w;
  float keep = max(max(kell(vUV, uKeep0, uKeepA.x) * uKeepS.x, kell(vUV, uKeep1, uKeepA.y) * uKeepS.y), max(kell(vUV, uKeep2, uKeepA.z) * uKeepS.z, kell(vUV, uKeep3, uKeepA.w) * uKeepS.w)) * uKeepFx.x * step(0.003, a);
  // glowing eyes: shaped by the painting's own eye (pupil darker, catch-lights hottest)
  vec3 eyeC = mix(col, uEyeC * (0.55 + 0.95 * l), uFx.w);
  // the kept accessory: its own colors, in the shade of the backlight (fabric keeps its knit), or lit (a lantern)
  vec3 keepC = scr(col * (1.0 - uMisc.y) * (1.0 + 0.35 * uKeepFx.y), vec3(0.18 * uKeepFx.y));
  vec3 sil = mix(body, keepC, keep);
  sil = scr(sil, uEyeC * eyeBloom * 0.28);
  sil = mix(sil, eyeC, eyeIn);
  vec3 o = mix(col, sil, dr);
  o = scr(o, rimLight(uRimC, rim(uRimO, vUV)) * uKeepFx.z);
  o = scr(o, rimLight(uRim2C, rim(uRim2O, vUV)) * uKeepFx.w);
  // the line of light riding the front
  o = scr(o, uRimC * (1.0 - smoothstep(0.0, uShape.z * 1.7, abs(uDrain.x - s))) * uDrain.w);
  float A = A0 * uFx.y;
  if (uFx.x > 0.0) {
    // dissolve INTO WARM LIGHT (never static: static is REGISTRO 000's language): he turns to light, then the
    // light comes apart in soft motes from the feet up
    float n = mix(vnoise(vUV * 64.0) * 0.55 + vnoise(vUV * 19.0) * 0.45, 1.0 - clamp(s, 0.0, 1.0), 0.4);
    o = mix(o, uDisC, smoothstep(0.0, 0.55, uFx.x) * 0.8);
    o = scr(o, uDisC * (1.0 - smoothstep(0.0, 0.08, abs(n - uFx.x))));
    A *= smoothstep(uFx.x - 0.08, uFx.x, n);
  }
  finalColor = vec4(clamp(o, 0.0, 1.0) * A, A) * vColor;
}`;

const FILTER_VERT = `in vec2 aPosition;
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
const WHITE_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
void main() { float a = texture(uTexture, vTextureCoord).a; finalColor = vec4(a, a, a, a); }`;

/**
 * CLOSED alpha (one-time bake per texture): transparent pixels ENCLOSED by the shape (seen opaque in at least 7 of 8
 * directions within uR) are filled — the holes between a robe and its floating sparkles close; the outer outline
 * does not grow (an outside pixel only sees the shape on one side).
 */
const CLOSE_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec4 uInputClamp;
uniform float uR;
void main() {
  vec2 uv = vTextureCoord;
  float a = texture(uTexture, uv).a;
  if (a > 0.5) { finalColor = vec4(a); return; }
  float hits = 0.0;
  for (int i = 0; i < 8; i++) {
    float an = float(i) * 0.7853982;
    vec2 d = vec2(cos(an), sin(an)) * uInputSize.zw * uR;
    float h = 0.0;
    for (int j = 1; j <= 6; j++) {
      vec2 p = uv + d * (float(j) / 6.0);
      if (p.x < uInputClamp.x || p.y < uInputClamp.y || p.x > uInputClamp.z || p.y > uInputClamp.w) continue;
      h = max(h, step(0.5, texture(uTexture, p).a));
    }
    hits += h;
  }
  float f = max(a, step(6.5, hits));
  finalColor = vec4(f);
}`;
const closed = new Map<string, { tex: RenderTexture; n: number }>();
function closedFor(renderer: Renderer, src: Texture, radius: number) {
  const key = `${src.uid}:${radius}`;
  const have = closed.get(key);
  if (have) {
    have.n++;
    return { key, tex: have.tex };
  }
  const res = src.source.resolution ?? 1;
  const sp = new Sprite(src);
  const f = new Filter({
    glProgram: GlProgram.from({ vertex: FILTER_VERT, fragment: CLOSE_FRAG, name: 'silueta-close' }),
    resources: { u: { uR: { value: radius, type: 'f32' } } },
    resolution: res,
  });
  sp.filters = [f];
  const tex = RenderTexture.create({ width: src.width, height: src.height, resolution: res, antialias: false });
  renderer.render({ container: sp, target: tex, clear: true });
  sp.filters = [];
  sp.destroy();
  f.destroy();
  closed.set(key, { tex, n: 1 });
  return { key, tex };
}
function closedRelease(key: string) {
  const e = closed.get(key);
  if (!e) return;
  if (--e.n <= 0) {
    e.tex.destroy(true);
    closed.delete(key);
  }
}

const rgb = (c: number, out: Float32Array) => {
  out[0] = ((c >> 16) & 255) / 255;
  out[1] = ((c >> 8) & 255) / 255;
  out[2] = (c & 255) / 255;
  return out;
};

// ------------------------------------------------------------------ the halo (one-time bake, shared per texture)
const HALO_SC = 0.25;
const halos = new Map<string, { tex: RenderTexture; pad: number; n: number }>();
function haloFor(renderer: Renderer, src: Texture, spread: number) {
  const key = `${src.uid}:${spread}`;
  const have = halos.get(key);
  if (have) {
    have.n++;
    return { key, ...have };
  }
  const pad = Math.ceil(spread * HALO_SC * 2.2) + 4;
  const sp = new Sprite(src);
  sp.scale.set(HALO_SC);
  sp.position.set(pad, pad);
  const white = new Filter({ glProgram: GlProgram.from({ vertex: FILTER_VERT, fragment: WHITE_FRAG, name: 'silueta-white' }), resources: {} });
  const blur = new BlurFilter({ strength: Math.max(2, spread * HALO_SC), quality: 3 });
  sp.filters = [white, blur];
  const c = new Container();
  c.addChild(sp);
  const tex = RenderTexture.create({ width: Math.ceil(src.width * HALO_SC + pad * 2), height: Math.ceil(src.height * HALO_SC + pad * 2), resolution: 1, antialias: false });
  renderer.render({ container: c, target: tex, clear: true });
  sp.filters = [];
  white.destroy();
  blur.destroy();
  c.destroy({ children: true });
  const e = { tex, pad, n: 1 };
  halos.set(key, e);
  return { key, ...e };
}
function haloRelease(key: string) {
  const e = halos.get(key);
  if (!e) return;
  if (--e.n <= 0) {
    e.tex.destroy(true);
    halos.delete(key);
  }
}

// ------------------------------------------------------------------ the treatment
export class Silueta {
  /** ENTRADA 0 (painted) → 1 (silhouette with its rim) */
  k = 0;
  /** SALIDA 0 → 1, as `how` says */
  out = 0;
  how: SiluetaHow = 'flood';
  /** rim over the painted body while k = 0 («modo borde») */
  rimRest: number;
  light: SiluetaLight;
  light2: SiluetaLight | null;
  eyes: 'keep' | 'glow' | 'off';
  eyeColor: number;
  keepGlow: number;
  keepShade: number;
  body: number;
  bodyTop: number;
  dissolveColor: number;
  detail: number;
  readonly target: Mesh;
  /** the sprite this treatment stands in for (Silueta.fromSprite) */
  twinOf: Sprite | null = null;
  private shader: Shader;
  private u: UniformGroup;
  private W: number;
  private H: number;
  private halo: Sprite | null = null;
  private haloKey = '';
  private haloA = 0;
  private haloPad = 0;
  private closedKey = '';
  private closeK = 0;
  private tw: { key: 'k' | 'out'; from: number; to: number; t: number; dur: number } | null = null;
  private tm = new Matrix();
  private texUid = -1;
  private dead = false;

  constructor(target: Mesh, o: SiluetaOpts = {}) {
    this.target = target;
    const pup = target as Mesh & { W?: number; H?: number; slug?: string; brain?: { anchor: { x: number; y: number } } };
    const tex = target.texture;
    const [W, H] = o.size ?? (pup.W && pup.H ? [pup.W, pup.H] : [tex.width, tex.height]);
    this.W = W;
    this.H = H;
    const slug = o.slug ?? pup.slug;
    const rig = o.rig === undefined ? (slug ? catRig(slug) : undefined) : o.rig;
    // rig coordinates are painting units (the whole texture = the whole painting): uv = painting / painting size
    const [PW, PH] = rig ? (rig.size ?? [700, 700]) : [W, H];
    this.light = o.light ?? { dir: [0, 0], color: 0xffd27a };
    this.light2 = o.light2 ?? null;
    this.eyes = o.eyes ?? 'keep';
    this.eyeColor = o.eyeColor ?? 0xfff3d6;
    this.keepGlow = o.keepGlow ?? 0;
    this.rimRest = o.rimRest ?? 0;
    this.body = safeBody(o.body ?? 0x1d1430);
    this.bodyTop = safeBody(o.bodyTop ?? this.body);
    this.keepShade = clamp(o.keepShade ?? 0, 0, 0.9);
    this.dissolveColor = o.dissolveColor ?? 0xffe2b0;
    this.detail = clamp(o.detail ?? 0.12, 0, 0.4);
    const f4 = () => ({ value: new Float32Array(4), type: 'vec4<f32>' as const });
    const f3 = () => ({ value: new Float32Array(3), type: 'vec3<f32>' as const });
    this.u = new UniformGroup({
      uTexM: { value: new Matrix(), type: 'mat3x3<f32>' },
      uShape: f4(),
      uDrain: f4(),
      uFx: f4(),
      uKeepFx: f4(),
      uBody: f3(),
      uRimC: f3(),
      uRimO: f4(),
      uRim2C: f3(),
      uRim2O: f4(),
      uEyeC: f3(),
      uDisC: f3(),
      uBodyTop: f3(),
      uMisc: f4(),
      uEye0: f4(),
      uEye1: f4(),
      uKeep0: f4(),
      uKeep1: f4(),
      uKeep2: f4(),
      uKeep3: f4(),
      uKeepA: f4(),
      uKeepS: f4(),
    });
    const U = this.u.uniforms as Record<string, Float32Array>;
    // the shape: feet and top of the head (uv), front softness, form detail
    const head = rig?.head;
    const topV = head ? Math.max(0, head[1] - head[3]) / PH : 0.03;
    U.uShape.set([0.95, topV, 0.07, this.detail]);
    // the eyes (rig boxes → ellipses in uv)
    const eyes = rig?.eyes ?? [];
    for (let i = 0; i < 2; i++) {
      const e = eyes[i];
      const t = i === 0 ? U.uEye0 : U.uEye1;
      if (e) t.set([(e[0] + e[2]) / 2 / PW, (e[1] + e[3]) / 2 / PH, ((e[2] - e[0]) / 2 / PW) * 1.08, ((e[3] - e[1]) / 2 / PH) * 1.08]);
    }
    // the accessory kept in color
    const keep = o.keep === 'pins' ? (rig?.pins ?? []) : (o.keep ?? []);
    keep.slice(0, 4).forEach((r, i) => {
      (U[`uKeep${i}`] as Float32Array).set([r[0] / PW, r[1] / PH, r[2] / PW, r[3] / PH]);
      U.uKeepA[i] = (r as Region)[4] ?? 0;
      U.uKeepS[i] = (r as Region)[5] ?? 1;
    });
    this.shader = new Shader({
      glProgram: GlProgram.from({ vertex: VERT, fragment: FRAG, name: 'silueta' }),
      resources: { uTexture: tex.source, uSampler: tex.source.style, uClosed: tex.source, silU: this.u },
    });
    target.shader = Object.assign(this.shader, { texture: tex });
    // the closed alpha (holes filled) for the silhouette pass — baked once, shared per texture
    if ((o.close ?? 0) > 0) {
      const radius = ((o.close ?? 0) * tex.width) / PW;
      const cb = closedFor(game.pixi.renderer, tex, radius);
      this.closedKey = cb.key;
      this.shader.resources.uClosed = cb.tex.source;
      this.closeK = 1;
    }
    // the separation halo, behind the character, in its parent
    if (o.halo !== false && target.parent) {
      const h = o.halo ?? { color: this.light.color };
      const spread = h.spread ?? 36;
      const b = haloFor(game.pixi.renderer, tex, spread);
      this.haloKey = b.key;
      this.haloPad = b.pad;
      this.halo = new Sprite(b.tex);
      this.halo.tint = h.color;
      this.halo.blendMode = 'add';
      this.halo.alpha = 0;
      this.haloA = h.alpha ?? 0.55;
      target.parent.addChildAt(this.halo, target.parent.getChildIndex(target));
    }
    this.update(0);
  }

  /** a Sprite gets a mesh twin in its place (hidden while the treatment lives) */
  static fromSprite(sp: Sprite, o: SiluetaOpts = {}): Silueta {
    const tex = sp.texture;
    const w = tex.width;
    const h = tex.height;
    const ax = sp.anchor.x * w;
    const ay = sp.anchor.y * h;
    const geometry = new MeshGeometry({
      positions: new Float32Array([-ax, -ay, w - ax, -ay, w - ax, h - ay, -ax, h - ay]),
      uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
    });
    const mesh = new Mesh({ geometry, texture: tex });
    mesh.position.copyFrom(sp.position);
    mesh.scale.copyFrom(sp.scale);
    mesh.rotation = sp.rotation;
    mesh.alpha = sp.alpha;
    mesh.tint = sp.tint;
    const parent = sp.parent;
    if (parent) parent.addChildAt(mesh, parent.getChildIndex(sp) + 1);
    sp.visible = false;
    const s = new Silueta(mesh, { size: [w, h], ...o });
    s.twinOf = sp;
    return s;
  }

  /** preparation → development (0.3–0.6 s by default) */
  enter(dur = 0.55) {
    this.out = 0;
    this.tw = { key: 'k', from: this.k, to: 1, t: 0, dur: Math.max(0.01, dur) };
  }
  /** the exit: the color floods back from the head, or it dissolves into the light */
  exit(how: SiluetaHow = 'flood', dur = 0.7) {
    this.how = how;
    this.tw = { key: 'out', from: this.out, to: 1, t: 0, dur: Math.max(0.01, dur) };
  }
  /** jump (no transition) */
  set(k: number, out = 0) {
    this.tw = null;
    this.k = k;
    this.out = out;
  }
  get busy() {
    return this.tw !== null;
  }

  update(dt: number) {
    if (this.dead || this.target.destroyed) return;
    const tw = this.tw;
    if (tw) {
      tw.t += dt;
      const q = clamp(tw.t / tw.dur, 0, 1);
      this[tw.key] = lerp(tw.from, tw.to, q);
      if (q >= 1) this.tw = null;
    }
    const L = siluetaCurve(this.k, this.out, this.how, settings.reduceMotion, this.rimRest);
    const U = this.u.uniforms as Record<string, Float32Array> & { uTexM: Matrix };
    const tex = this.target.texture;
    if (tex.uid !== this.texUid) {
      this.texUid = tex.uid;
      this.shader.resources.uTexture = tex.source;
      this.shader.resources.uSampler = tex.source.style;
      if (!this.closedKey) this.shader.resources.uClosed = tex.source;
      U.uTexM.copyFrom(tex.textureMatrix.mapCoord);
    }
    U.uDrain.set([L.front, 0, L.mix, L.glow]);
    const eyeK = this.eyes === 'off' ? 0 : 1;
    U.uFx.set([L.dissolve, L.fade, eyeK, this.eyes === 'glow' ? 1 : 0]);
    rgb(this.body, U.uBody);
    rgb(this.bodyTop, U.uBodyTop);
    rgb(this.dissolveColor, U.uDisC);
    U.uMisc.set([this.closeK, this.keepShade, 0, 0]);
    rgb(this.eyeColor, U.uEyeC);
    // the lights: screen direction → painting uv (through the mesh's own transform, flips included)
    const m = this.target.getGlobalTransform(this.tm, true);
    const det = m.a * m.d - m.b * m.c || 1e-6;
    const designPerLocal = Math.sqrt(Math.abs(det)) / Math.max(1e-6, game.scale);
    const lightUv = (li: SiluetaLight | null, out: Float32Array, swing: number) => {
      if (!li) {
        out.fill(0);
        return 0;
      }
      const w = (li.width ?? 3.5) / Math.max(1e-6, designPerLocal);
      let [dx, dy] = li.dir;
      if (dx === 0 && dy === 0) {
        // backlight: the ring grows in as the light arrives
        out.set([0, 0, (w * swing) / this.W, (w * swing) / this.H]);
        return li.alpha ?? 1;
      }
      const a1 = Math.atan2(dy, dx);
      const fr = li.from ?? [Math.cos(a1 + 1.3), Math.sin(a1 + 1.3)];
      const a0 = Math.atan2(fr[1], fr[0]);
      let da = a1 - a0;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      const a = a0 + da * swing;
      dx = Math.cos(a);
      dy = Math.sin(a);
      // inverse of the linear part: screen → local
      let lx = (m.d * dx - m.c * dy) / det;
      let ly = (-m.b * dx + m.a * dy) / det;
      const n = Math.hypot(lx, ly) || 1;
      lx = (lx / n) * w;
      ly = (ly / n) * w;
      out.set([lx / this.W, ly / this.H, 0, 0]);
      return li.alpha ?? 1;
    };
    const a1 = lightUv(this.light, U.uRimO, L.swing);
    const a2 = lightUv(this.light2, U.uRim2O, L.swing);
    rgb(this.light.color, U.uRimC);
    if (this.light2) rgb(this.light2.color, U.uRim2C);
    U.uKeepFx.set([1, this.keepGlow, a1 * L.rim, a2 * L.rim]);
    this.u.update();
    // the halo follows the character (its transform, not its deformation: it is soft)
    const h = this.halo;
    if (h) {
      const t = this.target;
      const on = (L.mix * smooth(-0.1, 1.1, L.front) + 0.35 * this.rimRest) * L.fade;
      h.alpha = this.haloA * clamp(on + bell(L.dissolve / 1.15) * 0.6, 0, 1) * t.alpha;
      h.visible = h.alpha > 0.004 && t.visible;
      const anc = (t as Mesh & { anchor?: { x: number; y: number } }).anchor;
      const ax = anc?.x ?? 0.5;
      const ay = anc?.y ?? 0.5;
      const f = this.W / tex.width / HALO_SC;
      const ox = -ax * this.W - this.haloPad * f;
      const oy = -ay * this.H - this.haloPad * f;
      h.position.copyFrom(t.position);
      h.rotation = t.rotation;
      h.scale.set(t.scale.x * f, t.scale.y * f);
      h.pivot.set(-ox / f, -oy / f);
    }
  }

  destroy() {
    if (this.dead) return;
    this.dead = true;
    const t = this.target;
    if (!t.destroyed && t.shader === this.shader) t.shader = null;
    this.shader.destroy();
    if (this.closedKey) closedRelease(this.closedKey);
    if (this.halo) {
      this.halo.destroy();
      haloRelease(this.haloKey);
      this.halo = null;
    }
    if (this.twinOf) {
      if (!this.twinOf.destroyed) this.twinOf.visible = true;
      if (!t.destroyed) {
        const g = t.geometry;
        t.destroy();
        g.destroy(true);
      }
    }
  }
}
