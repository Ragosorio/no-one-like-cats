/**
 * POP — the style of the POP box (Act IV «La gira»): a VIDEOCLIP FRAME or an ERA POSTER. Neon and pastel FLAT colour,
 * one hard stage light, LED walls, vertical phone video, lens flares, confetti and — when the show turns into a game —
 * an 8-bit HUD (arte-v2/01-reglas-de-referencia.md §5: «Neón y pastel planos, una luz de escenario dura»).
 * Generic (FILM-ACTO4, documented in docs/part-iii/agentes/FILM-ACTO4.md «Estilo pop»):
 *
 *   popBake        the cat treatment: the painting posterized to 4 flat tones of its own hues (lit side lifted toward
 *                  pastel), a HARD key light from the upper left (the shadow side drops flat), a NEON RIM on the far edge
 *                  (magenta at the top → cyan at the feet) and a clean dark-violet outline. Baked once (Studio).
 *   prepPop        'pop:led' → ctx.tex('pop:dots' | 'pop:glow' | 'pop:cone' | 'pop:flare' | 'pop:spark' | 'pop:static')
 *   LedPanel       one LED screen: bezel, a masked content container, the LED dot grid (multiply), a sheen, power on/off
 *                  (an old-TV collapse to a line when it goes out)
 *   PhoneFrame     a vertical 9:16 phone recording (no brand): rounded black frame, red REC dot, a timer, phone grain
 *   pixelText      a 5×7 bitmap font drawn with rects (8-bit HUDs: no font file) — A–Z, Ñ, accents, 0–9, @ € and signs
 *   Confetti       closed-form confetti (seeded sprites, a pure function of t: scrubbable)
 *   Spots          stage spotlights: additive cones that sweep as a function of t
 *   glitchFilter   block displacement + RGB split + inverted blocks (one pass; uAmt 0 = clean)
 *   pixelFilter    the 8-bit dissolve: blocks + a short palette, rising from the bottom with a stepped edge
 *
 * Rules: everything is built in `build` and is a function of time; filters go on hosts with a huge filterArea and are
 * listed in the set's `filters` (compiled during the warm).
 */
import { Container, Filter, GlProgram, Graphics, Rectangle, RenderTexture, Sprite, Texture, TilingSprite, type Renderer } from 'pixi.js';
import { NOISE, VERTEX, glFilter, uni } from '../gl';
import { BAKE_UV, type Baker } from '../bake';
import type { CatBake } from './catbake';
import type { StylePrep } from './index';

/** the POP palette: neon accents over pastel fields */
export const POP = {
  pink: 0xff3d9a,
  hot: 0xff2e88,
  cyan: 0x3de8ff,
  yellow: 0xffe14a,
  lilac: 0xc8a8ff,
  mint: 0x9ff5d2,
  peach: 0xffc2a8,
  sky: 0xa8d8ff,
  violet: 0x6a3cff,
  ink: 0x1a0b2e,
  night: 0x0b0618,
  stage: 0x24123f,
  white: 0xfff6fb,
  gold: 0xf4c869,
  red: 0xff4658,
} as const;

// ------------------------------------------------------------------ the cat bake
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

const POP_FRAG = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputClamp;
uniform vec2 uTexel;
uniform float uScale;
uniform vec2 uLight;
${NOISE}
vec4 S(vec2 uv) { return texture(uTexture, clamp(uv, uInputClamp.xy, uInputClamp.zw)); }
vec3 C(vec2 uv) { vec4 c = S(uv); return c.a > 0.0 ? c.rgb / c.a : vec3(0.0); }
float Ls(vec2 uv, float r) {
  vec3 s = C(uv) * 2.0;
  float w = 2.0;
  for (int i = 0; i < 6; i++) { float a = float(i) * 1.0472; vec2 o = vec2(cos(a), sin(a)) * r * uScale * uTexel; vec4 c = S(uv + o); if (c.a > 0.1) { s += c.rgb / c.a; w += 1.0; } }
  return lum(s / w);
}
float ringA(vec2 uv, float r) {
  float s = 0.0;
  for (int i = 0; i < 8; i++) { float a = float(i) * 0.7854; s += S(uv + vec2(cos(a), sin(a)) * r * uScale * uTexel).a; }
  return s / 8.0;
}
// the alpha's gradient over a wide radius ~ the form's normal (points out of the body)
vec2 aNorm(vec2 uv, float r) {
  vec2 e = uTexel * r * uScale;
  float l = S(uv - vec2(e.x, 0.0)).a, rr = S(uv + vec2(e.x, 0.0)).a, t = S(uv - vec2(0.0, e.y)).a, b = S(uv + vec2(0.0, e.y)).a;
  vec2 g = vec2(l - rr, t - b);
  float n = length(g);
  return n > 1e-3 ? g / n : vec2(0.0);
}
void main() {
  vec2 uv = vTextureCoord;
  vec4 c0 = S(uv);
  if (c0.a < 0.01) { finalColor = vec4(0.0); return; }
  vec3 col = c0.rgb / c0.a;
  float l = Ls(uv, 2.5);
  // posterize the light into 4 flat tones, keep the painting's hue (and push its chroma a little)
  float q = (floor(l * 4.0 + 0.35) + 0.15) / 4.0;
  vec3 hue = col / max(lum(col), 0.06);
  vec3 flat_ = clamp(hue * q, 0.0, 1.0);
  flat_ = mix(vec3(lum(flat_)), flat_, 1.25);
  // the hard key light: the side that faces it lifts toward pastel, the far side drops flat
  vec2 n = aNorm(uv, 26.0);
  float face = dot(n, normalize(uLight));
  float lit = smoothstep(-0.05, 0.12, face);
  vec3 c = mix(flat_ * vec3(0.66, 0.6, 0.86), mix(flat_, vec3(1.0, 0.96, 1.0), 0.16), lit);
  // neon rim on the edge away from the light (magenta at the top -> cyan at the feet)
  float edge = clamp(c0.a - ringA(uv, 7.0), 0.0, 1.0);
  float rim = smoothstep(0.08, 0.32, edge) * smoothstep(0.0, 0.5, -face);
  vec3 neon = mix(vec3(1.0, 0.24, 0.62), vec3(0.24, 0.9, 1.0), clamp(uv.y / max(uInputClamp.w, 1e-4), 0.0, 1.0));
  c = mix(c, neon, rim * 0.85);
  // a clean outline
  float ol = smoothstep(0.55, 0.95, c0.a) * (1.0 - smoothstep(0.82, 0.98, ringA(uv, 2.6)));
  c = mix(c, vec3(0.16, 0.06, 0.24), ol * 0.9);
  float a = smoothstep(0.35, 0.6, c0.a);
  finalColor = vec4(c * a, a);
}`;
/** the POP treatment of a painting (key light from the upper left) */
export const popBake: CatBake = (r, src) => {
  const tex = pass(r, src, POP_FRAG, { uLight: { value: new Float32Array([-0.7, -0.7]), type: 'vec2<f32>' } });
  return { tex, sil: pass(r, tex, SIL) };
};

// ------------------------------------------------------------------ the bake job: LED, light and spark textures
const shade = (b: Baker, name: string, w: number, h: number, body: string, res = 1) => b.shade(name, w, h, `${BAKE_UV}\n${body}`, {}, {}, { res });
export function prepPop(p: StylePrep) {
  p.baker.add('pop:led', 'las pantallas del estadio', () => {
    // one LED «pixel»: a rounded cell, faint RGB sub-pixels, dark gaps (multiplied over a screen's content)
    p.tex.set(
      'pop:dots',
      shade(
        p.baker,
        'pop-dots',
        8,
        8,
        `void main() { vec2 uv = bakeUV(); vec2 d = abs(uv - 0.5) * 2.0; float cell = 1.0 - smoothstep(0.62, 0.86, max(d.x, d.y));
  vec3 sub = uv.x < 0.36 ? vec3(1.0, 0.82, 0.86) : uv.x < 0.66 ? vec3(0.84, 1.0, 0.88) : vec3(0.86, 0.88, 1.0);
  vec3 c = mix(vec3(0.22, 0.2, 0.26), sub, cell); finalColor = vec4(c, 1.0); }`,
      ),
    );
    p.tex.set('pop:glow', shade(p.baker, 'pop-glow', 256, 256, `void main() { vec2 uv = bakeUV() - 0.5; float d = length(uv) * 2.0; float a = pow(max(0.0, 1.0 - d), 2.2); finalColor = vec4(vec3(a), a); }`));
    // a stage beam: apex at the left middle, a hot core, dust in the air
    p.tex.set(
      'pop:cone',
      shade(
        p.baker,
        'pop-cone',
        512,
        256,
        `void main() { vec2 uv = bakeUV(); float x = uv.x; float y = abs(uv.y - 0.5) * 2.0; float w = mix(0.03, 1.0, x);
  float body = smoothstep(w, w * 0.4, y) * smoothstep(1.0, 0.45, x) * smoothstep(0.0, 0.04, x);
  float core = smoothstep(w * 0.35, 0.0, y) * smoothstep(1.0, 0.2, x);
  float dust = 0.82 + 0.18 * fbm(vec2(x * 9.0, uv.y * 14.0));
  float a = clamp((body * 0.7 + core * 0.5) * dust, 0.0, 1.0); finalColor = vec4(vec3(a), a); }`,
      ),
    );
    // an anamorphic lens streak (horizontal)
    p.tex.set(
      'pop:flare',
      shade(p.baker, 'pop-flare', 512, 64, `void main() { vec2 uv = bakeUV() - 0.5; float a = exp(-abs(uv.y) * 38.0) * pow(max(0.0, 1.0 - abs(uv.x) * 2.0), 1.6); a += exp(-length(uv * vec2(6.0, 18.0)) * 3.0) * 0.6; finalColor = vec4(vec3(a), a); }`),
    );
    // a four-point sparkle
    p.tex.set(
      'pop:spark',
      shade(p.baker, 'pop-spark', 128, 128, `void main() { vec2 uv = bakeUV() - 0.5; vec2 a = abs(uv); float s = max(exp(-a.x * 60.0) * (1.0 - a.y * 2.0), exp(-a.y * 60.0) * (1.0 - a.x * 2.0)); s = clamp(s, 0.0, 1.0) + exp(-length(uv) * 14.0); s = clamp(s, 0.0, 1.0); finalColor = vec4(vec3(s), s); }`),
    );
    p.tex.set('pop:static', shade(p.baker, 'pop-static', 256, 256, `void main() { vec2 uv = bakeUV(); vec2 c = floor(uv * 128.0); float l = step(0.5, hash12(c)) * (0.5 + 0.5 * hash12(c + 7.0)); finalColor = vec4(vec3(l), 1.0); }`));
  });
}

// ------------------------------------------------------------------ an LED screen
export interface LedOpts {
  /** the bezel colour and width */
  bezel?: number;
  bw?: number;
  /** LED dot strength (0 = a clean screen) and pitch scale */
  dots?: number;
  dotScale?: number;
  /** the screen's black (behind the content) */
  black?: number;
  /** corner radius */
  r?: number;
}
/**
 * One LED screen of w × h (local 0,0 = top-left). Put the picture in `content` (masked to the screen). `power(p, lt)`
 * turns it on/off: 1 = on; going to 0 collapses the picture to a bright line (an old screen going out) unless `soft`.
 */
export class LedPanel extends Container {
  readonly content = new Container();
  private mask_ = new Graphics();
  private black: Graphics;
  private dots: TilingSprite | null;
  private sheen: Sprite | null;
  private line: Graphics;
  private bez: Graphics;
  constructor(
    tex: (n: string) => Texture | undefined,
    readonly w: number,
    readonly h: number,
    readonly o: LedOpts = {},
  ) {
    super();
    const r = o.r ?? 6;
    const bw = o.bw ?? 14;
    this.bez = new Graphics().roundRect(-bw, -bw, w + bw * 2, h + bw * 2, r + bw * 0.6).fill(o.bezel ?? 0x0c0a12).roundRect(-bw, -bw, w + bw * 2, h + bw * 2, r + bw * 0.6).stroke({ width: 2, color: 0x3a3450, alpha: 0.8 });
    // rivets on the bezel (a stadium screen, not a TV)
    for (let x = 0; x <= w; x += Math.max(80, w / 8)) this.bez.circle(x, -bw / 2, 2).fill(0x4a4460).circle(x, h + bw / 2, 2).fill(0x4a4460);
    this.black = new Graphics().rect(0, 0, w, h).fill(o.black ?? 0x06040a);
    this.mask_.rect(0, 0, w, h).fill(0xffffff);
    this.content.mask = this.mask_;
    const dt = tex('pop:dots');
    this.dots = dt && (o.dots ?? 0.5) > 0 ? new TilingSprite({ texture: dt, width: w, height: h }) : null;
    if (this.dots) {
      this.dots.blendMode = 'multiply';
      this.dots.alpha = o.dots ?? 0.5;
      this.dots.tileScale.set(o.dotScale ?? 1);
    }
    const gl = tex('pop:glow');
    this.sheen = gl ? new Sprite(gl) : null;
    if (this.sheen) {
      this.sheen.blendMode = 'add';
      this.sheen.alpha = 0.06;
      this.sheen.position.set(w * 0.05, -h * 0.25);
      this.sheen.setSize(w * 0.7, h * 0.8);
    }
    this.line = new Graphics().rect(0, -3, w, 6).fill(0xffffff);
    this.line.visible = false;
    this.addChild(this.bez, this.black, this.content, this.mask_);
    if (this.dots) this.addChild(this.dots);
    if (this.sheen) this.addChild(this.sheen);
    this.addChild(this.line);
  }
  /** 1 = on · 0 = off (collapses to a line on the way out; `soft` = a plain fade) */
  power(p: number, soft = false) {
    const k = Math.max(0, Math.min(1, p));
    if (soft || k >= 1 || k <= 0) {
      this.content.scale.set(1);
      this.content.position.set(0, 0);
      this.content.alpha = k;
      this.line.visible = false;
      return;
    }
    // collapse: the picture squeezes to its middle line, then the line shrinks and goes out
    const sy = Math.max(0.004, (k - 0.35) / 0.65);
    if (k > 0.35) {
      this.content.alpha = 1;
      this.content.scale.set(1, sy);
      this.content.position.set(0, (this.h * (1 - sy)) / 2);
      this.line.visible = false;
    } else {
      this.content.alpha = 0;
      this.line.visible = true;
      const lw = k / 0.35;
      this.line.scale.set(lw, 1);
      this.line.position.set((this.w * (1 - lw)) / 2, this.h / 2);
      this.line.alpha = lw;
    }
  }
}

// ------------------------------------------------------------------ a vertical phone recording (9:16)
/**
 * A fan's phone held up: rounded black frame, the picture in `content` (w × h, local 0,0 = the screen's top-left), a red
 * REC dot that blinks, a timer (mm:ss, from `t0`), phone grain. No brand, no app interface: just the dot and the time.
 */
export class PhoneFrame extends Container {
  readonly content = new Container();
  private mask_ = new Graphics();
  private dot: Graphics;
  private timer = new Graphics();
  private noise: TilingSprite | null;
  private lastSec = -1;
  constructor(
    tex: (n: string) => Texture | undefined,
    readonly w = 300,
    readonly h = 534,
    private t0 = 0,
  ) {
    super();
    const bw = 12;
    const frame = new Graphics()
      .roundRect(-bw, -bw, w + bw * 2, h + bw * 2, 34)
      .fill(0x0a0a10)
      .roundRect(-bw, -bw, w + bw * 2, h + bw * 2, 34)
      .stroke({ width: 3, color: 0x2a2a36 })
      .rect(0, 0, w, h)
      .fill(0x05050a);
    this.mask_.roundRect(0, 0, w, h, 22).fill(0xffffff);
    this.content.mask = this.mask_;
    const st = tex('pop:static');
    this.noise = st ? new TilingSprite({ texture: st, width: w, height: h }) : null;
    if (this.noise) {
      this.noise.alpha = 0.07;
      this.noise.blendMode = 'add';
      this.noise.mask = null;
    }
    this.dot = new Graphics().circle(0, 0, 9).fill(0xff2a3a);
    this.dot.position.set(26, 30);
    this.timer.position.set(44, 22);
    this.addChild(frame, this.content, this.mask_);
    if (this.noise) this.addChild(this.noise);
    this.addChild(this.dot, this.timer);
  }
  update(lt: number) {
    const t = Math.max(0, lt - this.t0);
    this.dot.alpha = Math.floor(t * 2) % 2 === 0 ? 1 : 0.35;
    const sec = Math.floor(t);
    if (sec !== this.lastSec) {
      this.lastSec = sec;
      const mm = String(Math.floor(sec / 60)).padStart(2, '0');
      const ss = String(sec % 60).padStart(2, '0');
      pixelText(this.timer.clear(), `${mm}:${ss}`, 0, 0, 2.2, 0xffffff);
    }
    if (this.noise) this.noise.tilePosition.set((Math.floor(lt * 12) * 37) % 256, (Math.floor(lt * 12) * 91) % 256);
  }
}

// ------------------------------------------------------------------ the 5×7 pixel font
// each glyph: 7 rows of 5 chars ('#' = on). Accents are drawn above the cap height by pixelText.
const GLYPHS: Record<string, string> = {
  A: '.###.#...##...#######...##...##...#',
  B: '####.#...##...#####.#...##...#####.',
  C: '.###.#...##....#....#....#...#.###.',
  D: '####.#...##...##...##...##...#####.',
  E: '######....#....####.#....#....#####',
  F: '######....#....####.#....#....#....',
  G: '.###.#...##....#.####...##...#.####',
  H: '#...##...##...#######...##...##...#',
  I: '.###...#....#....#....#....#...###.',
  J: '..###...#....#....#....##..#..##...',
  K: '#...##..#.#.#..##...#.#..#..#.#...#',
  L: '#....#....#....#....#....#....#####',
  M: '#...###.###.#.##.#.##...##...##...#',
  N: '#...###..##.#.##..###...##...##...#',
  O: '.###.#...##...##...##...##...#.###.',
  P: '####.#...##...#####.#....#....#....',
  Q: '.###.#...##...##...##.#.##..#..##.#',
  R: '####.#...##...#####.#.#..#..#.#...#',
  S: '.#####....#.....###.....#....#####.',
  T: '#####..#....#....#....#....#....#..',
  U: '#...##...##...##...##...##...#.###.',
  V: '#...##...##...##...##...#.#.#...#..',
  W: '#...##...##...##.#.##.#.##.#.#.#.#.',
  X: '#...##...#.#.#...#...#.#.#...##...#',
  Y: '#...##...#.#.#...#....#....#....#..',
  Z: '#####....#...#...#...#...#....#####',
  '0': '.###.#...##..###.#.###..##...#.###.',
  '1': '..#...##....#....#....#....#...###.',
  '2': '.###.#...#....#...#...#...#...#####',
  '3': '####.....#....#.###.....#....#####.',
  '4': '...#...##..#.#.#..#.#####...#....#.',
  '5': '######....####.....#....##...#.###.',
  '6': '.###.#....#....####.#...##...#.###.',
  '7': '#####....#...#...#...#....#....#...',
  '8': '.###.#...##...#.###.#...##...#.###.',
  '9': '.###.#...##...#.####....#....#.###.',
  ':': '.......##..##.......##..##.........',
  '.': '.........................##...##...',
  ',': '....................##...##...#....',
  '!': '..#....#....#....#....#.........#..',
  '?': '.###.#...#....#...#....#.........#.',
  '-': '...............' + '.###.' + '...............',
  '·': '...............' + '.##..' + '.##..' + '..........',
  '/': '....#....#...#...#...#...#....#....',
  "'": '..#....#...........................',
  '"': '.#.#..#.#..........................',
  '%': '##..###..#...#...#...#...#..###..##',
  '>': '.#.....#.....#.....#...#...#...#...',
  '<': '...#...#...#...#.....#.....#.....#.',
  '@': '.###.#...##.###.#.##.###.#....####.',
  '€': '..####.#...####.#...####.#.....####',
  '+': '.......#....#..#####..#....#.......',
  '*': '.......#.#.#.#.###.#.#.#.#.........',
  '(': '...#...#...#....#....#.....#.....#.',
  ')': '.#.....#.....#....#....#...#...#...',
  '=': '..........#####.....#####..........',
  '♥': '.....##.##########.###...#.........',
  '★': '..#....#..#####.###..#.#.#...#.....',
};
const ACCENT: Record<string, [string, number]> = { Á: ['A', 1], É: ['E', 1], Í: ['I', 1], Ó: ['O', 1], Ú: ['U', 1], Ñ: ['N', 2], Ü: ['U', 3] };
/** width of a pixel text (px = size of one pixel; 6 columns per glyph incl. spacing) */
export const pixelWidth = (text: string, px: number) => Math.max(0, text.length * 6 - 1) * px;
/**
 * Draw `text` in the 5×7 pixel font into `g` at (x, y) = top-left of the cap height. `px` = one pixel. Unknown glyphs
 * are blanks. Returns `g`. Build-time (or on a rare change): one rect per lit pixel, merged.
 */
export function pixelText(g: Graphics, text: string, x: number, y: number, px: number, color: number, o: { align?: 'left' | 'center' | 'right'; shadow?: number } = {}) {
  const t = text.toUpperCase();
  const w = pixelWidth(t, px);
  let x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  const draw = (ox: number, oy: number, col: number) => {
    let cx = x0 + ox;
    for (const chRaw of t) {
      const acc = ACCENT[chRaw];
      const ch = acc ? acc[0] : chRaw;
      const gl = GLYPHS[ch];
      if (gl)
        for (let i = 0; i < gl.length; i++) {
          if (gl[i] !== '#') continue;
          const r = Math.floor(i / 5);
          const c = i % 5;
          g.rect(cx + c * px, y + oy + r * px, px, px);
        }
      if (acc) {
        // an acute accent (2 px) or a tilde / diaeresis above the cap height
        if (acc[1] === 1) g.rect(cx + 2 * px, y + oy - 2 * px, px, px).rect(cx + 3 * px, y + oy - 3 * px, px, px);
        else if (acc[1] === 2) g.rect(cx + 0.5 * px, y + oy - 2 * px, px * 1.5, px).rect(cx + 2.5 * px, y + oy - 2.5 * px, px * 2, px);
        else g.rect(cx + px, y + oy - 2 * px, px, px).rect(cx + 3 * px, y + oy - 2 * px, px, px);
      }
      cx += 6 * px;
    }
    g.fill(col);
  };
  if (o.shadow !== undefined) draw(px, px, o.shadow);
  draw(0, 0, color);
  void x0;
  return g;
}

// ------------------------------------------------------------------ confetti (closed form)
export interface ConfettiOpts {
  n: number;
  /** the area it falls through (local) */
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  colors?: number[];
  seed?: number;
  /** fall speed (px/s) */
  speed?: number;
  size?: [number, number];
}
const rr = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
/**
 * Confetti as sprites, a pure function of t (falls from `start`; `amount` 0..1 scales how many show). With «Reducir
 * movimiento» it falls slower and doesn't spin.
 */
export class Confetti extends Container {
  private bits: { sp: Sprite; x: number; y: number; ph: number; sp2: number; w: number; drift: number }[] = [];
  constructor(private o: ConfettiOpts) {
    super();
    const cols = o.colors ?? [POP.pink, POP.cyan, POP.yellow, POP.lilac, POP.mint, POP.white, POP.gold];
    const [s0, s1] = o.size ?? [10, 18];
    for (let i = 0; i < o.n; i++) {
      const sp = new Sprite(Texture.WHITE);
      sp.anchor.set(0.5);
      const w = s0 + (s1 - s0) * rr(i * 3 + (o.seed ?? 0));
      sp.width = w;
      sp.height = w * 0.5;
      sp.tint = cols[i % cols.length];
      this.addChild(sp);
      this.bits.push({ sp, x: o.x0 + (o.x1 - o.x0) * rr(i + 11 + (o.seed ?? 0)), y: rr(i + 57) * (o.y1 - o.y0), ph: rr(i + 91) * 6.28, sp2: 0.7 + rr(i + 33) * 0.6, w, drift: (rr(i + 5) - 0.5) * 120 });
    }
  }
  /** t = seconds since the confetti started falling (negative = none yet) */
  update(t: number, amount = 1, rm = false) {
    const H = this.o.y1 - this.o.y0;
    const sp = (this.o.speed ?? 260) * (rm ? 0.45 : 1);
    const n = Math.floor(this.bits.length * Math.max(0, Math.min(1, amount)));
    this.bits.forEach((b, i) => {
      const on = t > 0 && i < n;
      b.sp.visible = on;
      if (!on) return;
      // each piece enters from the top after its own delay (the first wave fills in over ~1 s)
      const ty = t * sp * b.sp2 - b.y * 0.15;
      if (ty < 0) {
        b.sp.visible = false;
        return;
      }
      const y = this.o.y0 + ((ty + b.y) % H);
      const x = b.x + Math.sin(t * 1.3 + b.ph) * b.drift * (rm ? 0.3 : 1);
      b.sp.position.set(x, y);
      if (rm) {
        b.sp.rotation = b.ph;
        b.sp.scale.y = Math.abs(b.sp.scale.y);
      } else {
        b.sp.rotation = b.ph + t * 3 * b.sp2;
        b.sp.width = b.w * Math.abs(Math.cos(t * 5 * b.sp2 + b.ph));
      }
    });
  }
}

// ------------------------------------------------------------------ stage spotlights
export interface SpotDef {
  /** where the lamp hangs (local) */
  x: number;
  y: number;
  /** the beam length and its half-width at the far end */
  len: number;
  half: number;
  color: number;
  /** resting angle (rad, 0 = to the right, π/2 = straight down) */
  a: number;
  /** sweep amplitude (rad) and speed (rad/s), phase */
  amp?: number;
  w?: number;
  ph?: number;
  alpha?: number;
}
/** additive stage beams; `update(t, k)` sweeps them (k = intensity 0..1, or per-spot through `aim`) */
export class Spots extends Container {
  readonly beams: { sp: Sprite; lamp: Sprite | null; d: SpotDef }[] = [];
  constructor(tex: (n: string) => Texture | undefined, defs: SpotDef[]) {
    super();
    const cone = tex('pop:cone');
    const glow = tex('pop:glow');
    for (const d of defs) {
      if (!cone) break;
      const sp = new Sprite(cone);
      sp.anchor.set(0, 0.5);
      sp.blendMode = 'add';
      sp.tint = d.color;
      sp.position.set(d.x, d.y);
      sp.scale.set(d.len / 512, (d.half * 2) / 256);
      const lamp = glow ? new Sprite(glow) : null;
      if (lamp) {
        lamp.anchor.set(0.5);
        lamp.blendMode = 'add';
        lamp.tint = d.color;
        lamp.position.set(d.x, d.y);
        lamp.scale.set(0.35);
      }
      this.addChild(sp);
      if (lamp) this.addChild(lamp);
      this.beams.push({ sp, lamp, d });
    }
  }
  update(t: number, k = 1, rm = false, aim?: (i: number) => number | null) {
    this.beams.forEach((b, i) => {
      const d = b.d;
      const fixed = aim?.(i);
      const a = fixed ?? d.a + Math.sin(t * (d.w ?? 0.6) * (rm ? 0.4 : 1) + (d.ph ?? 0)) * (d.amp ?? 0.25);
      b.sp.rotation = a;
      b.sp.alpha = (d.alpha ?? 0.5) * k;
      b.sp.visible = k > 0.003;
      if (b.lamp) {
        b.lamp.alpha = Math.min(1, k * 1.2);
        b.lamp.visible = b.sp.visible;
      }
    });
  }
}

// ------------------------------------------------------------------ filters
const BIG = new Rectangle(-4000, -4000, 1920 + 8000, 1080 + 8000);
const GLITCH = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputClamp;
uniform vec4 uInputSize;
uniform float uAmt;
uniform float uSeed;
uniform float uSplit;
${NOISE}
vec4 S(vec2 uv) { return texture(uTexture, clamp(uv, uInputClamp.xy, uInputClamp.zw)); }
void main() {
  vec2 uv = vTextureCoord;
  vec2 q = uv / max(uInputClamp.zw, vec2(1e-4));
  if (uAmt <= 0.001) { finalColor = S(uv); return; }
  float rows = 22.0 + floor(hash12(vec2(uSeed, 1.0)) * 18.0);
  float r = floor(q.y * rows);
  float h = hash12(vec2(r, uSeed));
  float on = step(1.0 - uAmt * 0.6, h);
  float dx = (hash12(vec2(r * 1.7, uSeed + 7.0)) - 0.5) * 0.14 * uAmt * on;
  float r2 = floor(q.y * 140.0);
  float h2 = hash12(vec2(r2, uSeed + 11.0));
  dx += step(1.0 - uAmt * 0.3, h2) * (h2 - 0.5) * 0.035 * uAmt;
  vec2 p = uv + vec2(dx * uInputClamp.z, 0.0);
  float sp = uSplit * uAmt * uInputSize.z;
  vec4 c = S(p);
  float red = S(p + vec2(sp, 0.0)).r;
  float blu = S(p - vec2(sp, 0.0)).b;
  c.rgb = vec3(red, c.g, blu);
  vec2 blk = floor(q * vec2(16.0, 30.0));
  float inv = step(1.0 - uAmt * 0.1, hash12(blk + uSeed * 3.1));
  c.rgb = mix(c.rgb, vec3(c.a) - c.rgb, inv * 0.85);
  float tint = step(1.0 - uAmt * 0.12, hash12(blk.yx + uSeed * 1.7));
  c.rgb = mix(c.rgb, vec3(c.g * 0.2, c.r, c.b * 1.2) , tint * 0.8);
  finalColor = c;
}`;
/** the block glitch (set `uAmt` 0..1 and `uSeed` on 12 fps steps; uSplit = RGB split px). `glitchSet(f, amt, seed)` */
export function glitchFilter(): Filter {
  return glFilter('pop-glitch', GLITCH, { uAmt: { value: 0, type: 'f32' }, uSeed: { value: 0, type: 'f32' }, uSplit: { value: 14, type: 'f32' } });
}
export function glitchSet(f: Filter, amt: number, seed: number, split = 14) {
  const u = uni(f);
  u.uAmt = amt;
  u.uSeed = seed;
  u.uSplit = split;
}

const PIXEL = `precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputClamp;
uniform vec4 uInputSize;
uniform float uP;
uniform float uBlock;
uniform float uLevels;
${NOISE}
vec4 S(vec2 uv) { return texture(uTexture, clamp(uv, uInputClamp.xy, uInputClamp.zw)); }
void main() {
  vec2 uv = vTextureCoord;
  if (uP <= 0.001) { finalColor = S(uv); return; }
  vec2 q = uv / max(uInputClamp.zw, vec2(1e-4));
  vec2 px = uv * uInputSize.xy;
  vec2 cell = floor(px / uBlock);
  // the front rises from the bottom in stepped blocks (a little jagged)
  float colY = 1.0 - (cell.y * uBlock) / max(uInputSize.y * uInputClamp.w, 1.0);
  float jag = hash12(vec2(cell.x, 3.0)) * 0.06;
  float inside = step(colY, uP * 1.08 - 0.04 + jag);
  if (inside < 0.5) { finalColor = S(uv); return; }
  vec2 cuv = (cell + 0.5) * uBlock / uInputSize.xy;
  vec4 c = S(cuv);
  vec3 col = c.a > 0.0 ? c.rgb / c.a : vec3(0.0);
  col = floor(col * uLevels + 0.5) / uLevels;
  // the block's own dark edge (a sprite pixel)
  vec2 f = fract(px / uBlock);
  float edge = step(0.92, max(f.x, f.y));
  col *= 1.0 - edge * 0.25;
  finalColor = vec4(col * c.a, c.a);
}`;
/** the 8-bit dissolve (uP 0..1 = how much of the frame, from the bottom, is pixels) — `pixelSet(f, p, block)` */
export function pixelFilter(): Filter {
  return glFilter('pop-pixel', PIXEL, { uP: { value: 0, type: 'f32' }, uBlock: { value: 12, type: 'f32' }, uLevels: { value: 4, type: 'f32' } });
}
export function pixelSet(f: Filter, p: number, block = 12, levels = 4) {
  const u = uni(f);
  u.uP = p;
  u.uBlock = block;
  u.uLevels = levels;
}
/** a host container for a full-frame filter (a huge filterArea: its pooled texture never changes size) */
export function filterHost(filters: Filter[]): Container {
  const c = new Container();
  c.filterArea = BIG;
  c.filters = filters;
  return c;
}
