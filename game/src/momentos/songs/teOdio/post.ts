/**
 * te ODIO — «GRAFITI Y SEÑAL ROTA»: the Momento's own post filter (StageApi.post, after the toolkit's grade).
 *
 * One pass, every effect gated by its uniform (all 0 = a pass-through the runner doesn't even mount):
 *   SIGNAL   the broken transmission: datamosh blocks (macro-blocks displaced / smeared like a corrupted stream),
 *            VHS tracking band + horizontal tear, chroma split, low-pass (the filtered section of the song), pixelation,
 *            scanlines, snow, phosphor tint
 *   STENCIL  the stops: the whole frame slammed into a 3-tone spray stencil (ink · spray color · wall), grainy edges
 *   XEROX    the zine: 1-bit photocopy halftone with toner noise and streaks
 *
 * The same class is used on a single container too (the picture inside the crack: its own instance, its own uniforms).
 */
import { Filter, GlProgram } from 'pixi.js';

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

const FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec4 uInputClamp;
uniform float uTime;
uniform float uSeed;
uniform float uPx;
uniform float uScan;
uniform float uTrack;
uniform float uTrackY;
uniform float uTear;
uniform float uRGB;
uniform float uBlock;
uniform float uBlockPx;
uniform float uNoise;
uniform float uPixel;
uniform float uLow;
uniform float uPhos;
uniform vec3 uPhosCol;
uniform float uStencil;
uniform vec3 uStInk;
uniform vec3 uStMid;
uniform vec3 uStPaper;
uniform float uXerox;
uniform vec3 uXInk;
uniform vec3 uXPaper;
uniform float uDim;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
vec3 un(vec4 c) { return c.a > 0.0001 ? c.rgb / c.a : vec3(0.0); }
vec4 tex(vec2 uv) { return texture(uTexture, clamp(uv, uInputClamp.xy, uInputClamp.zw)); }
void main() {
  vec2 uv = vTextureCoord;
  vec2 px = uv * uInputSize.xy;
  vec2 n01 = uv / max(uInputClamp.zw, vec2(0.0001));
  vec2 ip = uInputSize.zw;
  // ---- SIGNAL: where to read from
  if (uPixel > 0.5) {
    vec2 cell = vec2(uPixel * uPx, uPixel * uPx * 0.8);
    px = (floor(px / cell) + 0.5) * cell;
    uv = px * ip;
  }
  if (uBlock > 0.001) {
    float bp = max(8.0, uBlockPx * uPx);
    vec2 b = floor(px / bp);
    float h = hash(b + uSeed);
    float h2 = hash(b.yx * 1.7 + uSeed * 0.37);
    if (h < uBlock * 0.55) {
      // a corrupted macro-block: it reads its neighbour (a motion vector gone wrong) and smears along it
      vec2 mv = (vec2(hash(b + 3.1 + uSeed), hash(b + 7.7 + uSeed)) - 0.5) * bp * (1.5 + 3.0 * uBlock);
      vec2 inb = fract(px / bp);
      uv = (px + mv - inb * bp * h2 * 0.8) * ip;
    }
    // whole rows slipping (I-frame lost)
    float row = floor(px.y / bp);
    if (hash(vec2(row, uSeed)) < uBlock * 0.18) uv.x += (hash(vec2(row + 2.0, uSeed)) - 0.5) * 120.0 * uPx * uBlock * ip.x;
  }
  if (uTrack > 0.001) {
    float d = abs(n01.y - uTrackY);
    float band = 1.0 - smoothstep(0.0, 0.06, d);
    float wob = (hash(vec2(floor(px.y / (2.0 * uPx)), uSeed)) - 0.5);
    uv.x += (band * 38.0 + wob * 6.0) * uTrack * uPx * ip.x;
  }
  if (uTear > 0.001) {
    float t = step(0.0, sin(n01.y * 23.0 + uSeed * 3.1)) * step(0.75, hash(vec2(floor(n01.y * 18.0), uSeed)));
    uv.x += t * uTear * 60.0 * uPx * ip.x;
  }
  // ---- read (chroma split + low-pass)
  vec4 c;
  float sp = uRGB * uPx;
  if (uLow > 0.001) {
    float r = uLow * 7.0 * uPx;
    vec4 a = tex(uv) * 0.28;
    a += tex(uv + vec2(r, 0.0) * ip) * 0.16 + tex(uv - vec2(r, 0.0) * ip) * 0.16;
    a += tex(uv + vec2(r * 2.2, 0.0) * ip) * 0.1 + tex(uv - vec2(r * 2.2, 0.0) * ip) * 0.1;
    a += tex(uv + vec2(0.0, r * 0.8) * ip) * 0.1 + tex(uv - vec2(0.0, r * 0.8) * ip) * 0.1;
    c = a;
  } else c = tex(uv);
  if (sp > 0.01) {
    c.r = tex(uv + vec2(sp, 0.0) * ip).r;
    c.b = tex(uv - vec2(sp, sp * 0.3) * ip).b;
  }
  vec3 col = un(c);
  float a = c.a;
  float l = lum(col);
  // ---- STENCIL: three sprayed tones with a grainy edge
  if (uStencil > 0.001) {
    float g = (hash(floor(px / (2.0 * uPx)) + 0.5) - 0.5) * 0.08;
    vec3 st = l + g < 0.32 ? uStInk : (l + g < 0.64 ? uStMid : uStPaper);
    col = mix(col, st, uStencil);
    a = mix(a, 1.0, uStencil);
  }
  // ---- XEROX: 1-bit halftone, toner noise, streaks
  if (uXerox > 0.001) {
    float cs = 7.0 * uPx;
    vec2 r2 = vec2(px.x + px.y, px.x - px.y) * 0.70710678 / cs;
    float dotd = length(fract(r2) - 0.5);
    float tone = clamp((0.78 - l) * 0.9, 0.0, 0.72);
    float ink = 1.0 - smoothstep(tone - 0.05, tone + 0.05, dotd);
    ink = max(ink, step(l, 0.2));
    float toner = step(0.985, hash(floor(px / (1.5 * uPx)) + uSeed)) * 0.9;
    float streak = step(0.993, hash(vec2(floor(px.x / (3.0 * uPx)), 1.0))) * 0.35;
    float k1 = clamp(ink + toner + streak, 0.0, 1.0);
    col = mix(col, mix(uXPaper, uXInk, k1), uXerox);
    a = mix(a, 1.0, uXerox);
  }
  // ---- phosphor (the signal's monochrome tint)
  if (uPhos > 0.001) col = mix(col, vec3(lum(col)) * uPhosCol * 1.35, uPhos);
  // ---- scanlines + snow + dim
  if (uScan > 0.001) {
    float s = 0.5 + 0.5 * sin(px.y * 3.14159 / max(1.5, 1.6 * uPx));
    col *= 1.0 - uScan * 0.45 * s;
  }
  if (uNoise > 0.001) {
    float sn = hash(floor(px / (2.0 * uPx)) + vec2(uSeed * 13.0, uTime));
    col = mix(col, vec3(sn), uNoise * step(0.55, sn) * 0.85);
    col += (sn - 0.5) * uNoise * 0.2;
  }
  col *= 1.0 - uDim;
  finalColor = vec4(clamp(col, 0.0, 1.0) * a, a);
}`;

const rgb3 = (hex: number) => new Float32Array([((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255]);

export interface SignalState {
  scan: number;
  track: number;
  trackY: number;
  tear: number;
  rgb: number;
  block: number;
  blockPx: number;
  noise: number;
  pixel: number;
  low: number;
  phos: number;
  stencil: number;
  xerox: number;
  dim: number;
}
export const SIGNAL_ZERO: SignalState = { scan: 0, track: 0, trackY: 0.5, tear: 0, rgb: 0, block: 0, blockPx: 48, noise: 0, pixel: 0, low: 0, phos: 0, stencil: 0, xerox: 0, dim: 0 };

export class SignalFilter extends Filter {
  /** the frame's request (verbs and the stage take the max into it each frame; applied by `commit`) */
  want: SignalState = { ...SIGNAL_ZERO };
  constructor(pxScale = 1) {
    super({
      glProgram: GlProgram.from({ vertex: VERTEX, fragment: FRAG, name: 'teodio-signal' }),
      resources: {
        sig: {
          uTime: { value: 0, type: 'f32' },
          uSeed: { value: 0, type: 'f32' },
          uPx: { value: pxScale, type: 'f32' },
          uScan: { value: 0, type: 'f32' },
          uTrack: { value: 0, type: 'f32' },
          uTrackY: { value: 0.5, type: 'f32' },
          uTear: { value: 0, type: 'f32' },
          uRGB: { value: 0, type: 'f32' },
          uBlock: { value: 0, type: 'f32' },
          uBlockPx: { value: 48, type: 'f32' },
          uNoise: { value: 0, type: 'f32' },
          uPixel: { value: 0, type: 'f32' },
          uLow: { value: 0, type: 'f32' },
          uPhos: { value: 0, type: 'f32' },
          uPhosCol: { value: rgb3(0x9effd9), type: 'vec3<f32>' },
          uStencil: { value: 0, type: 'f32' },
          uStInk: { value: rgb3(0x141218), type: 'vec3<f32>' },
          uStMid: { value: rgb3(0xff2e88), type: 'vec3<f32>' },
          uStPaper: { value: rgb3(0xf2eee4), type: 'vec3<f32>' },
          uXerox: { value: 0, type: 'f32' },
          uXInk: { value: rgb3(0x17151b), type: 'vec3<f32>' },
          uXPaper: { value: rgb3(0xefeadc), type: 'vec3<f32>' },
          uDim: { value: 0, type: 'f32' },
        },
      },
    });
  }
  get u() {
    return this.resources.sig.uniforms as Record<string, number | Float32Array>;
  }
  set3(name: string, hex: number) {
    const a = this.u[name] as Float32Array;
    a[0] = ((hex >> 16) & 255) / 255;
    a[1] = ((hex >> 8) & 255) / 255;
    a[2] = (hex & 255) / 255;
  }
  /** start a frame: forget last frame's requests */
  reset() {
    Object.assign(this.want, SIGNAL_ZERO);
  }
  /** a clip asks for at least this much of an effect this frame */
  max(part: Partial<SignalState>) {
    const w = this.want as unknown as Record<string, number>;
    for (const [k, v] of Object.entries(part)) if (typeof v === 'number' && k !== 'trackY' && k !== 'blockPx') w[k] = Math.max(w[k] ?? 0, v);
    if (part.trackY !== undefined) this.want.trackY = part.trackY;
    if (part.blockPx !== undefined) this.want.blockPx = part.blockPx;
  }
  /** push the frame's state into the uniforms; `motion` scales the displacing effects (reduce motion) */
  /** motion < 1 = «reducir movimiento» (calms what displaces); calm = «reducir destellos» (calms the flicker: snow, blocks) */
  commit(m: number, seed: number, motion = 1, calm = false) {
    const u = this.u;
    const w = this.want;
    u.uTime = m;
    u.uSeed = seed;
    u.uScan = w.scan;
    u.uTrack = w.track * motion;
    u.uTrackY = w.trackY;
    u.uTear = w.tear * motion;
    u.uRGB = w.rgb * (0.4 + 0.6 * motion);
    u.uBlock = w.block * (0.35 + 0.65 * motion) * (calm ? 0.5 : 1);
    u.uBlockPx = w.blockPx;
    u.uNoise = w.noise * (calm ? 0.4 : 1);
    u.uPixel = w.pixel;
    u.uLow = w.low;
    u.uPhos = w.phos;
    u.uStencil = w.stencil;
    u.uXerox = w.xerox;
    u.uDim = w.dim;
  }
  /** anything to draw this frame */
  get live() {
    const w = this.want;
    return w.scan > 0.01 || w.track > 0.01 || w.tear > 0.01 || w.rgb > 0.05 || w.block > 0.01 || w.noise > 0.01 || w.pixel > 0.5 || w.low > 0.01 || w.phos > 0.01 || w.stencil > 0.01 || w.xerox > 0.01 || w.dim > 0.01;
  }
}
