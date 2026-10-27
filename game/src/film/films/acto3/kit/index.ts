/**
 * ACTO III «Lo que está escrito» — the shared kit of the Library films (historia-v2/guiones/acto-3/00-indice.md §3).
 *
 *   BookFrame        THE SCREEN IS AN OPEN BOOK: two cream pages with wide margins, the gutter's shadow down the middle,
 *                    running heads and folios. Each film breaks it its own way (tilts, a codex, a burnt gutter, a split)
 *   Printed          in Libros everyone speaks as BOOK TEXT printed next to them, in their own typography (VOICE):
 *                    Canelo thick and crooked with grease spots, Luzterna in her handwriting (the Bitácora's), La Mano in
 *                    the margin, cold and perfect, Esquirla glitched, Brecha / Garbancito stencilled, El Lobo in an old
 *                    tale's capitals, the dossier typewritten
 *   Bitacora         LO QUE ARRIESGAMOS in HER handwriting (never her name): the logbook page rises and her pencil writes
 *   luzOf / Beam     Luzterna always floating, her lantern, the beam she carries everything with
 *   tailTip / flame  Canelo's tail flame (normal → 60 % → minimum)
 *   StaticKitten     Cerito (REGISTRO 000): his static painting with live static over it (never nadie_static_cat)
 *   manoFigure       La Mano: a pale stand-in painting + her white hand with the pen-nib claw (code-drawn)
 *   garbancito       Garbancito: his painting (the tiny Disruptor with his bandana and spray can), tiny
 *   esquirlaFigure   Esquirla: a stand-in with a broken visor and a glitch arm (code-drawn)
 *   MusicDuck        silence under the picture (the FIN of F19): a keyed duck of the music bus, a function of lt
 *
 * Rules: everything is a function of lt; textures, texts and big Graphics are made in build; per frame only small
 * redraws (a mask rect, a flame, a beam).
 */
import { Container, Graphics, Sprite, TilingSprite, Texture, type TextStyleOptions } from 'pixi.js';
import { CanvasTextMetrics, TextStyle } from 'pixi.js';
import type { FrameInfo, SceneCtx } from '../../../stage';
import type { Baker } from '../../../bake';
import { BAKE_UV } from '../../../bake';
import type { Actor } from '../../../../momentos/anime/actor';
import type { Kit } from '../../../../momentos/anime/kit';
import { siluetaKeep } from '../../../../momentos/songs/drunck/silueta';
import { audioApi } from '../../../../audio/api';
import { clamp01, rnd, seg, sm, wob } from './t';
import { STANDINS } from '../../../standins';

export * from './t';

/**
 * The Library's cast: the approved paintings (FILM-CAST, 2026-10-27; the ones who come back are in film/standins.ts)
 * and the STAND-INS of the characters still without art (La Mano, Esquirla), whose traits are code-drawn.
 */
export const STAND = {
  /** REGISTRO 000 «Cerito» (his static painting with live static over it; never nadie_static_cat) */
  cerito: STANDINS.cerito,
  /** La Mano: STAND-IN (pale, her right paw a white hand with a pen-nib claw, code-drawn) */
  mano: STANDINS.mano,
  /** La Encuadernadora (her painting: calico, goggles, the needle and the red thread, the apron) */
  encuadernadora: 'encuadernadora_needle_cat',
  /** Garbancito (his painting: the chickpea-sized Disruptor, bandana, spray can, the chickpea) */
  garbancito: 'garbancito_tiny_cat',
  brecha: 'brecha_crowbar_cat',
  bisagra: 'bisagra_hinge_cat',
  /** Esquirla: STAND-IN (broken visor and glitch arm code-drawn) */
  esquirla: STANDINS.esquirla,
  /** Harry Gatter (his painting: round glasses, the robe, the striped scarf, the wand) */
  harry: 'harrygatter_wand_cat',
  hipolito: 'hipolito_tavern_cat',
  /** the crew in the dark (their eyes in H85): Murciégato and Gato Araña, their paintings */
  murciegato: STANDINS.murciegato,
  aranya: STANDINS.aranya,
  /** La Gatoconda (her painting: the smile, the veil, the folded paws — a cameo portrait in F21) */
  gatoconda: 'gatoconda_smile_cat',
  /** El Lobo (his painting: grandmother's lace bonnet and gown, the claws) — F19 */
  lobo: 'lobo_grandma_cat',
  /** the Canelo of another box (the page of his Echo) */
  caneloEco: 'canelo_admiral_cat',
} as const;

/** the Library's palette */
export const LB = {
  paper: 0xf2e8d2,
  paperD: 0xe2d4b4,
  sepia: 0x3a2414,
  sepiaL: 0x7a5232,
  wash: 0xc9b48a,
  night: 0x1c2232,
  blue: 0x8fd4ff,
  lantern: 0x9fe0ff,
  warm: 0xffc27a,
  red: 0xb8322a,
  ink: 0x14100e,
  pen: 0x2c3e6b,
} as const;

// ------------------------------------------------------------------ build-time textures (one per film)
const CACHE = new WeakMap<Baker, Map<string, Texture>>();
const SRC: Record<string, [number, number, string]> = {
  glow: [256, 256, `void main() { vec2 uv = bakeUV() - 0.5; float d = length(uv) * 2.0; float a = pow(max(0.0, 1.0 - d), 2.2); finalColor = vec4(vec3(a), a); }`],
  // a soft wedge: apex on the left middle, opening to the right (the lantern beam)
  cone: [512, 256, `void main() { vec2 uv = bakeUV(); float x = uv.x; float y = abs(uv.y - 0.5) * 2.0; float w = mix(0.04, 1.0, x); float a = smoothstep(w, w * 0.55, y) * smoothstep(1.0, 0.55, x) * smoothstep(0.0, 0.06, x); finalColor = vec4(vec3(a), a); }`],
  static: [512, 512, `void main() { vec2 uv = bakeUV(); vec2 c = floor(uv * 256.0); float l = step(0.48, hash12(c)) * (0.55 + 0.45 * hash12(c + 7.0)); finalColor = vec4(vec3(l), 1.0); }`],
  // a soft vertical band (the gutter's shadow): dark in the middle
  gutter: [128, 8, `void main() { float x = abs(bakeUV().x - 0.5) * 2.0; float a = pow(1.0 - x, 2.6) * 0.85; finalColor = vec4(0.0, 0.0, 0.0, a); }`],
  // a fog wisp (soft, irregular)
  wisp: [512, 256, `void main() { vec2 uv = bakeUV(); float f = fbm(uv * vec2(3.0, 2.0) + 4.0); float m = smoothstep(0.0, 0.35, uv.x) * smoothstep(1.0, 0.65, uv.x) * smoothstep(0.0, 0.4, uv.y) * smoothstep(1.0, 0.6, uv.y); float a = smoothstep(0.35, 0.75, f) * m; finalColor = vec4(vec3(a), a); }`],
};
export function kitTex(ctx: SceneCtx, name: keyof typeof SRC): Texture {
  let m = CACHE.get(ctx.baker);
  if (!m) CACHE.set(ctx.baker, (m = new Map()));
  let t = m.get(name);
  if (!t) {
    const s = SRC[name];
    t = ctx.baker.shade(`a3-${name}`, s[0], s[1], `${BAKE_UV}\n${s[2]}`, {}, {}, { res: 1 });
    m.set(name, t);
  }
  return t;
}
/** the style's paper as a tiling sprite (cream) */
export function paperSprite(ctx: SceneCtx, w: number, h: number, name = 'lb:paper'): TilingSprite | Graphics {
  const t = ctx.tex(name);
  if (!t) return new Graphics().rect(0, 0, w, h).fill(LB.paper);
  return new TilingSprite({ texture: t, width: w, height: h });
}

// ------------------------------------------------------------------ text
/** a cached text sprite — call in build only */
export const word = (k: Kit, text: string, style: TextStyleOptions, anchor = 0.5) => k.text.sprite(text, style, anchor);
export function wrapLines(text: string, style: TextStyleOptions): string[] {
  return CanvasTextMetrics.measureText(text, new TextStyle(style)).lines;
}

export type Voice = 'canelo' | 'luz' | 'mano' | 'esquirla' | 'brecha' | 'garbancito' | 'lobo' | 'typed' | 'harry' | 'print';
/** how each one speaks in Libros (00-indice.md §3.2) */
export const VOICE: Record<Voice, TextStyleOptions> = {
  canelo: { fontFamily: 'Bangers', fontSize: 50, fill: 0x2a1a0e, letterSpacing: 2 },
  luz: { fontFamily: 'Permanent Marker', fontSize: 44, fill: LB.pen },
  mano: { fontFamily: 'Playfair Display', fontStyle: 'italic', fontSize: 40, fill: 0x16121e, letterSpacing: 1 },
  esquirla: { fontFamily: 'Rubik Glitch', fontSize: 46, fill: 0x101018 },
  brecha: { fontFamily: 'Bebas Neue', fontSize: 52, fill: 0x1a1a1a, letterSpacing: 3 },
  garbancito: { fontFamily: 'Bebas Neue', fontSize: 26, fill: 0x1a1a1a, letterSpacing: 2 },
  lobo: { fontFamily: 'UnifrakturMaguntia', fontSize: 120, fill: 0x14100e },
  typed: { fontFamily: ['Courier New', 'Courier', 'monospace'], fontSize: 34, fill: 0x1a1a1a, fontWeight: '700' },
  harry: { fontFamily: 'Playfair Display', fontWeight: '700', fontSize: 38, fill: 0x2a1a0e },
  print: { fontFamily: 'Playfair Display', fontSize: 38, fill: LB.sepia },
};

export interface PrintedOpts {
  /** wrap width (px) */
  w?: number;
  size?: number;
  fill?: number;
  /** a calm paper plate behind (readability over a busy picture) */
  plate?: number;
  /** letters tremble (a scream; weak letters) */
  tremble?: number;
  /** anchor of the block: 0 = left, 0.5 = centre */
  align?: number;
  /** a mirror-written note (Leonardo) */
  mirror?: boolean;
}
/**
 * A line of book text printed next to whoever speaks. Built once; `update(p, lt)` reveals it (0..1: typeset left to
 * right for type, written for hands) and sets its alpha. Canelo's letters are crooked, one sprite each, with grease spots.
 */
export class Printed extends Container {
  private lines: Sprite[] = [];
  private letters: { s: Sprite; x: number; y: number; r: number }[] = [];
  private widths: number[] = [];
  private mask2 = new Graphics();
  private plateG: Graphics | null = null;
  readonly W: number;
  readonly H: number;
  constructor(
    k: Kit,
    readonly voice: Voice,
    text: string,
    private o: PrintedOpts = {},
  ) {
    super();
    const base = VOICE[voice];
    const size = o.size ?? (base.fontSize as number);
    const style: TextStyleOptions = { ...base, fontSize: size, ...(o.fill !== undefined ? { fill: o.fill } : {}), wordWrap: true, wordWrapWidth: o.w ?? 760, lineHeight: size * 1.2 };
    const ls = wrapLines(text, style);
    const lh = size * 1.2;
    const body = new Container();
    let maxW = 0;
    if (voice === 'canelo') {
      // one sprite per letter, each a little crooked (thick and crooked type, «escribe feo»)
      let idx = 0;
      ls.forEach((line, li) => {
        let x = 0;
        for (const ch of line) {
          const sp = word(k, ch === ' ' ? ' ' : ch, { ...style, wordWrap: false }, 0.5);
          const w = CanvasTextMetrics.measureText(ch, new TextStyle({ ...style, wordWrap: false })).width;
          const r = (rnd(idx * 3.1) - 0.5) * 0.22;
          const y = li * lh + lh * 0.5 + (rnd(idx * 7.7) - 0.5) * size * 0.16;
          sp.position.set(x + w / 2, y);
          sp.rotation = r;
          body.addChild(sp);
          this.letters.push({ s: sp, x: x + w / 2, y, r });
          x += w + 1;
          idx++;
        }
        maxW = Math.max(maxW, x);
        this.widths.push(x);
      });
      // grease spots (fish)
      const g = new Graphics();
      for (let i = 0; i < 3; i++) g.ellipse(rnd(i + text.length) * maxW, rnd(i * 5 + 2) * ls.length * lh, 9 + rnd(i) * 10, 6 + rnd(i + 4) * 6).fill({ color: 0xc8a050, alpha: 0.28 });
      body.addChildAt(g, 0);
    } else {
      ls.forEach((line, i) => {
        const sp = word(k, line, { ...style, wordWrap: false }, 0);
        sp.anchor.set(0, 0);
        sp.position.set(0, i * lh);
        body.addChild(sp);
        this.lines.push(sp);
        this.widths.push(sp.width);
        maxW = Math.max(maxW, sp.width);
      });
    }
    this.W = maxW;
    this.H = ls.length * lh;
    const ax = (o.align ?? 0) * maxW;
    body.position.set(-ax, 0);
    this.mask2.position.set(-ax, 0);
    if (o.plate !== undefined) {
      const g = (this.plateG = new Graphics());
      g.roundRect(-ax - 26, -16, maxW + 52, this.H + 30, 14).fill({ color: o.plate, alpha: 0.88 });
      this.addChild(g);
    }
    body.mask = this.mask2;
    this.addChild(body, this.mask2);
    if (o.mirror) body.scale.x = -1, body.position.x = maxW - ax;
  }
  /** p = reveal 0..1 (by width), a = alpha; lt drives the tremble */
  update(p: number, a = 1, lt = 0) {
    this.visible = a > 0.003;
    if (!this.visible) return;
    this.alpha = a;
    const m = this.mask2.clear();
    const total = this.widths.reduce((s, w) => s + w, 0) || 1;
    let left = clamp01(p) * total;
    const lh = this.H / Math.max(1, this.widths.length);
    this.widths.forEach((w, i) => {
      const ww = Math.min(w, Math.max(0, left));
      left -= w;
      if (ww > 0) m.rect(this.o.mirror ? this.W - ww : -6, i * lh - lh * 0.2, ww + 10, lh * 1.35).fill(0xffffff);
    });
    const tr = this.o.tremble ?? 0;
    if (tr > 0 && this.letters.length) {
      const st = Math.floor(lt * 14);
      this.letters.forEach((L, i) => {
        L.s.position.set(L.x + (rnd(st * 31 + i) - 0.5) * tr, L.y + (rnd(st * 17 + i * 3) - 0.5) * tr);
        L.s.rotation = L.r + (rnd(st + i * 9) - 0.5) * tr * 0.02;
      });
    }
  }
}

// ------------------------------------------------------------------ the open book (screen plane)
export interface BookOpts {
  /** running head, left page (small caps) */
  head?: string;
  /** running head, right page */
  title?: string;
  /** the folio of the left page */
  folio?: number;
  /** the plate window [x0, y0, x1, y1] */
  win?: [number, number, number, number];
  paper?: number;
}
/**
 * THE OPEN BOOK over the picture: cream margins with the plate printed inside a thin double rule, the gutter's shadow,
 * the curve of the pages darkening toward the gutter and the fore-edges, running heads and folios. Two halves (left and
 * right page) so a film can tilt or split them. Mount it as a screen plane.
 */
export class BookFrame extends Container {
  readonly left = new Container();
  readonly right = new Container();
  private gut: Sprite;
  readonly win: [number, number, number, number];
  constructor(ctx: SceneCtx, o: BookOpts = {}) {
    super();
    const W = 1920;
    const H = 1080;
    const win = (this.win = o.win ?? [92, 70, 1828, 1010]);
    const paper = o.paper ?? LB.paper;
    for (const [half, x0, x1] of [
      [this.left, -200, 960],
      [this.right, 960, W + 200],
    ] as const) {
      const g = new Graphics();
      // the margins: paper everywhere outside the plate window (with a bleed beyond the screen)
      g.rect(x0, -200, x1 - x0, win[1] + 200).fill(paper);
      g.rect(x0, win[3], x1 - x0, H - win[3] + 200).fill(paper);
      if (x0 < win[0]) g.rect(x0, win[1], win[0] - x0, win[3] - win[1]).fill(paper);
      if (x1 > win[2]) g.rect(win[2], win[1], x1 - win[2], win[3] - win[1]).fill(paper);
      // the printed double rule around the plate
      const rx0 = Math.max(win[0], x0);
      const rx1 = Math.min(win[2], x1);
      g.rect(rx0 - 8, win[1] - 8, rx1 - rx0 + 16, 2).fill({ color: LB.sepia, alpha: 0.7 });
      g.rect(rx0 - 8, win[3] + 6, rx1 - rx0 + 16, 2).fill({ color: LB.sepia, alpha: 0.7 });
      g.rect(rx0 - 3, win[1] - 3, rx1 - rx0 + 6, 1).fill({ color: LB.sepia, alpha: 0.5 });
      g.rect(rx0 - 3, win[3] + 2, rx1 - rx0 + 6, 1).fill({ color: LB.sepia, alpha: 0.5 });
      if (x0 < win[0]) g.rect(win[0] - 8, win[1] - 8, 2, win[3] - win[1] + 16).fill({ color: LB.sepia, alpha: 0.7 }).rect(win[0] - 3, win[1] - 3, 1, win[3] - win[1] + 6).fill({ color: LB.sepia, alpha: 0.5 });
      if (x1 > win[2]) g.rect(win[2] + 6, win[1] - 8, 2, win[3] - win[1] + 16).fill({ color: LB.sepia, alpha: 0.7 }).rect(win[2] + 2, win[1] - 3, 1, win[3] - win[1] + 6).fill({ color: LB.sepia, alpha: 0.5 });
      // the curve of the page: darker toward the fore-edge
      for (let i = 0; i < 6; i++) {
        const x = x0 < 0 ? i * 8 : W - (i + 1) * 8;
        g.rect(x, -200, 8, H + 400).fill({ color: 0x5a4020, alpha: 0.05 * (6 - i) * 0.5 });
      }
      half.addChild(g);
      // the paper's fibres over the margins
      const t = ctx.tex('lb:paper');
      if (t) {
        const fib = new TilingSprite({ texture: t, width: x1 - x0, height: H + 400 });
        fib.position.set(x0, -200);
        fib.alpha = o.paper !== undefined ? 0.2 : 0.55;
        fib.blendMode = 'multiply';
        const mk = g.clone();
        fib.mask = mk;
        half.addChild(fib, mk);
      }
    }
    const k = ctx.k;
    const small: TextStyleOptions = { fontFamily: 'Playfair Display', fontSize: 22, fill: LB.sepiaL, letterSpacing: 6 };
    if (o.head) {
      const h = word(k, o.head.toUpperCase(), small);
      h.position.set((win[0] + 960) / 2, win[1] / 2 + 2);
      this.left.addChild(h);
    }
    if (o.title) {
      const h = word(k, o.title.toUpperCase(), small);
      h.position.set((960 + win[2]) / 2, win[1] / 2 + 2);
      this.right.addChild(h);
    }
    if (o.folio) {
      const f1 = word(k, String(o.folio), { ...small, letterSpacing: 2, fontSize: 24 });
      f1.position.set(win[0] + 20, (win[3] + H) / 2);
      const f2 = word(k, String(o.folio + 1), { ...small, letterSpacing: 2, fontSize: 24 });
      f2.position.set(win[2] - 20, (win[3] + H) / 2);
      this.left.addChild(f1);
      this.right.addChild(f2);
    }
    // the gutter: a soft shadow down the middle (over the picture too) + a thin highlight
    this.gut = new Sprite(kitTex(ctx, 'gutter'));
    this.gut.anchor.set(0.5, 0);
    this.gut.width = 230;
    this.gut.height = H + 400;
    this.gut.position.set(960, -200);
    this.gut.alpha = 0.5;
    this.addChild(this.left, this.right, this.gut);
  }
  /**
   * open: 0 = no book (full bleed) … 1 = the book · tilt: the pages lean toward the gutter (rad, F20) ·
   * split: the halves drift apart (px, F25) · gutter: the shadow's strength
   */
  set(o: { open?: number; tilt?: number; split?: number; gutter?: number; lift?: number } = {}) {
    const open = o.open ?? 1;
    this.visible = open > 0.003;
    if (!this.visible) return;
    const t = o.tilt ?? 0;
    const sp = o.split ?? 0;
    const lift = o.lift ?? 0;
    // the margins slide out as the book «opens» away (0 → off screen)
    const out = (1 - open) * 260;
    this.left.pivot.set(960, 540);
    this.left.position.set(960 - sp - out, 540 - lift);
    this.left.rotation = -t;
    this.right.pivot.set(960, 540);
    this.right.position.set(960 + sp + out, 540 + lift);
    this.right.rotation = t;
    this.left.alpha = this.right.alpha = Math.min(1, open * 1.6);
    this.gut.alpha = (o.gutter ?? 0.5) * open;
    this.gut.x = 960;
  }
}

// ------------------------------------------------------------------ the logbook: LO QUE ARRIESGAMOS (her hand)
export const NB = { paper: 0xf3ead2, rule: 0x9db8d9, margin: 0xd9786e, pencil: 0x55535e, pen: 0x2c3e6b, tape: 0xe9e0b8 } as const;
export interface BitacoraOpts {
  header?: string;
  w?: number;
  size?: number;
  top?: number;
  write?: number;
  /** a last line, BIG («Esta batalla la mando YO.») */
  big?: string;
  /** shaky writing, still angry (F24) */
  rage?: boolean;
}
/**
 * The Bitácora page: it rises from below and covers the lower part of the screen; her hand writes LO QUE ARRIESGAMOS in
 * pen-blue marker, line by line, with a pencil that glows faintly blue (her light — never her name). In the corner, the
 * gordo's face with his scarf. `update(t)` with t = seconds since the page started rising.
 */
export class Bitacora extends Container {
  private page = new Container();
  private lines: Sprite[] = [];
  private wmask = new Graphics();
  private pencil = new Graphics();
  private glow: Sprite;
  private widths: number[] = [];
  readonly dur: number;
  private W: number;
  private H: number;
  private top: number;
  private rage: boolean;
  constructor(ctx: SceneCtx, text: string, o: BitacoraOpts = {}) {
    super();
    const k = ctx.k;
    const W = (this.W = o.w ?? 1240);
    const size = o.size ?? 46;
    this.rage = !!o.rage;
    const style: TextStyleOptions = { fontFamily: 'Permanent Marker', fontSize: size, fill: NB.pen, wordWrap: true, wordWrapWidth: W - 230, lineHeight: size * 1.25 };
    const ls = wrapLines(text, style);
    const bigSize = size * 1.75;
    const H = (this.H = 150 + ls.length * size * 1.25 + (o.big ? bigSize * 1.3 : 0) + 70);
    this.top = o.top ?? 1080 - H + 24;
    const g = new Graphics();
    g.roundRect(-W / 2 + 10, 14, W, H + 60, 10).fill({ color: 0x000000, alpha: 0.35 });
    g.roundRect(-W / 2, 0, W, H + 60, 8).fill(NB.paper);
    for (let y = 120; y < H + 40; y += size * 1.25) g.rect(-W / 2 + 20, y + size * 0.95, W - 40, 2).fill({ color: NB.rule, alpha: 0.8 });
    g.rect(-W / 2 + 120, 0, 3, H + 60).fill({ color: NB.margin, alpha: 0.85 });
    g.circle(W / 2 - 150, H - 30, 62).stroke({ width: 6, color: 0x9a6a3a, alpha: 0.18 });
    for (const [x, rot] of [
      [-W / 2 + 60, -0.12],
      [W / 2 - 70, 0.1],
    ] as const) {
      const t = new Graphics().rect(-70, -22, 140, 44).fill({ color: NB.tape, alpha: 0.75 });
      t.position.set(x, 4);
      t.rotation = rot;
      this.page.addChild(t);
    }
    this.page.addChildAt(g, 0);
    // the gordo's face with his scarf in the corner (no names, ever)
    const d = new Graphics();
    const dx = W / 2 - 120;
    const dy = 70;
    d.circle(dx, dy, 30).stroke({ width: 3, color: NB.pen });
    d.poly([dx - 26, dy - 16, dx - 22, dy - 44, dx - 6, dy - 26]).stroke({ width: 3, color: NB.pen, join: 'round' });
    d.poly([dx + 26, dy - 16, dx + 22, dy - 44, dx + 6, dy - 26]).stroke({ width: 3, color: NB.pen, join: 'round' });
    d.circle(dx - 10, dy - 4, 3).fill(NB.pen).circle(dx + 10, dy - 4, 3).fill(NB.pen);
    d.moveTo(dx - 26, dy + 24).quadraticCurveTo(dx, dy + 36, dx + 26, dy + 24).stroke({ width: 7, color: 0xd9786e });
    this.page.addChild(d);
    const header = word(k, o.header ?? 'LO QUE ARRIESGAMOS:', { fontFamily: 'Permanent Marker', fontSize: 34, fill: NB.pencil, letterSpacing: 2 }, 0);
    header.anchor.set(0, 0.5);
    header.position.set(-W / 2 + 150, 66);
    this.page.addChild(header);
    const body = new Container();
    ls.forEach((line, i) => {
      const sp = word(k, line, { ...style, wordWrap: false }, 0);
      sp.anchor.set(0, 0);
      sp.position.set(-W / 2 + 150, 120 + i * size * 1.25);
      if (this.rage) sp.rotation = (rnd(i * 3) - 0.5) * 0.03;
      body.addChild(sp);
      this.lines.push(sp);
      this.widths.push(sp.width);
    });
    if (o.big) {
      const sp = word(k, o.big, { fontFamily: 'Permanent Marker', fontSize: bigSize, fill: NB.pen }, 0);
      sp.anchor.set(0, 0);
      sp.position.set(-W / 2 + 150, 132 + ls.length * size * 1.25);
      sp.rotation = -0.025;
      body.addChild(sp);
      this.lines.push(sp);
      this.widths.push(sp.width);
    }
    body.mask = this.wmask;
    this.page.addChild(body, this.wmask);
    this.glow = new Sprite(kitTex(ctx, 'glow'));
    this.glow.anchor.set(0.5);
    this.glow.tint = LB.lantern;
    this.glow.blendMode = 'add';
    this.glow.scale.set(0.9);
    this.page.addChild(this.glow, this.pencil);
    this.addChild(this.page);
    this.dur = o.write ?? Math.max(1.8, Math.min(4.2, (text.length + (o.big?.length ?? 0) * 1.5) / 30));
  }
  /** t = seconds since the page started rising (rise 0.45 s, then write over `dur`) */
  update(t: number, rm = false) {
    this.visible = t > 0;
    if (!this.visible) return;
    const rise = sm(t / 0.45);
    this.page.position.set(960, rm ? this.top : this.top + (1 - rise) * (this.H + 160));
    this.page.alpha = rm ? rise : 1;
    const wp = clamp01((t - 0.5) / this.dur);
    const total = this.widths.reduce((a, b) => a + b, 0) || 1;
    let left = wp * total;
    const m = this.wmask.clear();
    let head: [number, number] = [-this.W / 2 + 150, 120];
    m.rect(-this.W / 2, 0, this.W, 112).fill(0xffffff);
    this.lines.forEach((sp, i) => {
      const w = Math.min(this.widths[i], Math.max(0, left));
      left -= this.widths[i];
      if (w > 0) {
        m.rect(sp.x - 6, sp.y - 10, w + 8, sp.height + 20).fill(0xffffff);
        head = [sp.x + w, sp.y + sp.height * 0.7];
      }
    });
    const p = this.pencil.clear();
    const writing = wp > 0 && wp < 1;
    const [hx, hy] = head;
    const wig = writing ? Math.sin(t * (this.rage ? 70 : 40)) * (this.rage ? 7 : 4) : 0;
    const px = hx + 8;
    const py = hy - 6 + wig;
    p.poly([px, py, px + 16, py - 34, px + 128, py - 164, px + 112, py - 176, px, py]).fill(0xe8b84a).stroke({ width: 3, color: 0x3a2a14 });
    p.poly([px, py, px + 16, py - 34, px + 4, py - 30]).fill(0x3a2a14);
    p.rect(px + 110, py - 182, 20, 18).fill(0xd9786e);
    p.alpha = sm((t - 0.3) / 0.3) * (wp >= 1 ? 1 - sm((t - 0.5 - this.dur) / 0.6) : 1);
    this.glow.position.set(px, py);
    this.glow.alpha = p.alpha * (writing ? 0.35 : 0.15);
  }
}

// ------------------------------------------------------------------ Luzterna: always floating, the lantern, the beam
export interface LuzRig {
  actor: Actor | null;
  /** the lantern in the actor's local px (before its flip) */
  lantern: [number, number];
}
export function luzOf(ctx: SceneCtx, size: number, bake?: string): LuzRig {
  const actor = bake ? ctx.actorAs(bake, 'luzterna', size) : ctx.actor('luzterna', size);
  let lantern: [number, number] = [-size * 0.22, -size * 0.5];
  const p = actor?.puppet;
  const r = siluetaKeep('luzterna')?.[0];
  if (p && r) lantern = [(r[0] - p.anchor.x * p.W) * p.scale.x, (r[1] - p.anchor.y * p.H) * p.scale.y];
  return { actor, lantern };
}
/** her float: a slow bob (px) — she never touches anything */
export const bob = (lt: number, rm: boolean, a = 12) => (rm ? a * 0.4 : a) * Math.sin(lt * 1.7);
/** where the lantern is in the actor's parent space */
export function lanternAt(rig: LuzRig): [number, number] {
  const a = rig.actor;
  if (!a) return [0, 0];
  const c = Math.cos(a.rotation);
  const s = Math.sin(a.rotation);
  const lx = rig.lantern[0] * a.scale.x;
  const ly = rig.lantern[1] * a.scale.y;
  return [a.x + lx * c - ly * s, a.y + lx * s + ly * c];
}
/** her beam (a soft additive cone): from → to, `spread` = half-width at the far end */
export class Beam extends Container {
  private cone: Sprite;
  private core: Sprite;
  private spot: Sprite;
  constructor(ctx: SceneCtx, color: number = LB.lantern) {
    super();
    this.cone = new Sprite(kitTex(ctx, 'cone'));
    this.cone.anchor.set(0, 0.5);
    this.core = new Sprite(kitTex(ctx, 'cone'));
    this.core.anchor.set(0, 0.5);
    this.spot = new Sprite(kitTex(ctx, 'glow'));
    this.spot.anchor.set(0.5);
    for (const s of [this.cone, this.core, this.spot]) {
      s.tint = color;
      s.blendMode = 'add';
    }
    this.addChild(this.cone, this.core, this.spot);
  }
  set(from: [number, number], to: [number, number], spread: number, alpha: number) {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const len = Math.max(1, Math.hypot(dx, dy));
    const rot = Math.atan2(dy, dx);
    this.visible = alpha > 0.003;
    if (!this.visible) return;
    for (const [s, w, a] of [
      [this.cone, spread, 0.55],
      [this.core, spread * 0.35, 0.6],
    ] as const) {
      s.position.set(from[0], from[1]);
      s.rotation = rot;
      s.scale.set(len / 512, (w * 2) / 256);
      s.alpha = alpha * a;
    }
    this.spot.position.set(to[0], to[1]);
    this.spot.scale.set((spread * 2.4) / 256, (spread * 1.2) / 256);
    this.spot.alpha = alpha * 0.7;
  }
}
/** a soft additive glow sprite (a lantern, an eye) */
export function glowSprite(ctx: SceneCtx, color: number, scale = 1): Sprite {
  const s = new Sprite(kitTex(ctx, 'glow'));
  s.anchor.set(0.5);
  s.tint = color;
  s.blendMode = 'add';
  s.scale.set(scale);
  return s;
}

// ------------------------------------------------------------------ Canelo's tail flame
/** the flame at each point of the act: normal · the 60 % he keeps from H85 on · the minimum (fainting) */
export const FLAME = { normal: 1, sesenta: 0.62, baja: 0.4, minima: 0.18 } as const;
/** the tail tip of an actor in its parent space (from the rig), or null */
export function tailTip(a: Actor | null): [number, number] | null {
  const p = a?.puppet;
  const rig = p?.brain.model?.rig;
  const pts = rig?.tail?.pts;
  if (!p || !pts?.length) return null;
  const [tx, ty] = pts[pts.length - 1];
  const lx = (tx - p.anchor.x * p.W) * p.scale.x * a!.scale.x;
  const ly = (ty - p.anchor.y * p.H) * p.scale.y * a!.scale.y;
  const c = Math.cos(a!.rotation);
  const s = Math.sin(a!.rotation);
  return [a!.x + lx * c - ly * s, a!.y + lx * s + ly * c];
}
/** a candle flame at (x, y), size k (1 = normal), flickering on twos; `draft` = a candle in a draught (F20) */
export function flame(g: Graphics, x: number, y: number, k: number, lt: number, o: { rm?: boolean; color?: number; core?: number; scale?: number; line?: number; draft?: number } = {}) {
  if (k <= 0.01) return;
  const st = o.rm ? 0 : Math.floor(lt * 12);
  const dr = o.draft ? (o.rm ? 0.3 : 1) * o.draft * wob(lt * 7, 3) : 0;
  const s = (o.scale ?? 1) * 46 * k * (1 - Math.abs(dr) * 0.35);
  const w = s * (0.55 + rnd(st) * 0.08);
  const h = s * (1.3 + rnd(st + 5) * 0.25);
  const lean = (rnd(st + 9) - 0.5) * s * 0.3 + dr * s * 0.9;
  g.moveTo(x - w, y)
    .quadraticCurveTo(x - w * 0.9, y - h * 0.6, x + lean, y - h)
    .quadraticCurveTo(x + w * 0.9, y - h * 0.6, x + w, y)
    .quadraticCurveTo(x, y + w * 0.9, x - w, y)
    .fill(o.color ?? 0xff8a1e);
  if (o.line !== undefined) g.stroke({ width: 3, color: o.line });
  g.moveTo(x - w * 0.5, y)
    .quadraticCurveTo(x - w * 0.4, y - h * 0.4, x + lean * 0.6, y - h * 0.62)
    .quadraticCurveTo(x + w * 0.45, y - h * 0.4, x + w * 0.5, y)
    .quadraticCurveTo(x, y + w * 0.5, x - w * 0.5, y)
    .fill(o.core ?? 0xffe27a);
}

// ------------------------------------------------------------------ Cerito (REGISTRO 000): a kitten of static
export class StaticKitten extends Container {
  private base: Sprite | null;
  private noise: TilingSprite;
  private eyes: Sprite[] = [];
  private eyePts: [number, number][] = [];
  /** the base is his painting (cerito_static_cat, in the style's bake); false = the tinted outline (not loaded) */
  private painted = false;
  constructor(
    private ctx: SceneCtx,
    size: number,
    slug: string = STAND.cerito,
  ) {
    super();
    const paint = ctx.still(slug);
    const base = (this.base = paint ?? ctx.silhouette(slug));
    const mask = ctx.silhouette(slug);
    this.painted = !!paint;
    this.noise = new TilingSprite({ texture: kitTex(ctx, 'static'), width: 900, height: 900 });
    if (base && mask) {
      const s = size / base.texture.height;
      base.scale.set(s);
      mask.scale.set(s);
      base.tint = this.painted ? 0xd8dbe6 : 0x9a9ab4;
      this.noise.position.set(-450, -880);
      this.noise.tileScale.set(1.4);
      this.noise.mask = mask;
      this.addChild(base, this.noise, mask);
      const p = ctx.studio.puppet(slug);
      const rig = p?.brain.model?.rig;
      if (p && rig?.eyes?.length) {
        const ps = size / p.H;
        for (const e of rig.eyes) this.eyePts.push([((e[0] + e[2]) / 2 - p.anchor.x * p.W) * ps, ((e[1] + e[3]) / 2 - p.anchor.y * p.H) * ps]);
      } else this.eyePts.push([-size * 0.16, -size * 0.66], [size * 0.08, -size * 0.62]);
      p?.destroy();
    }
    for (const _ of this.eyePts) {
      const e = new Sprite(kitTex(ctx, 'glow'));
      e.anchor.set(0.5);
      e.tint = 0x9fe8ff;
      e.blendMode = 'add';
      this.eyes.push(e);
      this.addChild(e);
    }
    this.eyePts.forEach((pt, i) => this.eyes[i].position.set(pt[0], pt[1]));
  }
  /** clear = 0 static … 1 a clear little cat · fray = its edges coming apart (no light holds it) */
  update(lt: number, o: { stare?: number; clear?: number; tint?: number; fray?: number } = {}) {
    const st = Math.floor(lt * 12);
    this.noise.tilePosition.set(rnd(st) * 300, rnd(st + 3) * 300);
    const clear = o.clear ?? 0;
    this.noise.alpha = (1 - clear) * (this.painted ? 0.5 : 1);
    if (this.base) this.base.tint = o.tint ?? (this.painted ? (clear > 0 ? 0xffffff : 0xd8dbe6) : clear > 0 ? 0xe9eef8 : 0x9a9ab4);
    const fray = o.fray ?? 0;
    this.alpha = fray > 0 ? 1 - fray * 0.5 * (0.5 + 0.5 * rnd(st * 7)) : 1;
    this.skew.x = fray > 0 ? (rnd(st * 3) - 0.5) * fray * 0.25 : 0;
    const stare = o.stare ?? 0.6;
    for (const e of this.eyes) {
      e.scale.set((0.18 + stare * 0.12) * (this.ctx.rf ? 0.8 : 1));
      e.alpha = 0.6 + stare * 0.4;
    }
  }
}

// ------------------------------------------------------------------ La Mano (stand-in + her hand)
/** her white hand with the pen-nib claw (code-drawn), the nib at local (−16, −92)·s */
export function manoHand(s = 1): Graphics {
  const g = new Graphics();
  g.roundRect(-30 * s, -20 * s, 60 * s, 46 * s, 18 * s).fill(0xf6f4f0);
  for (let i = 0; i < 4; i++) g.roundRect((-28 + i * 15) * s, -54 * s, 12 * s, 40 * s, 6 * s).fill(0xf6f4f0);
  g.roundRect(26 * s, -10 * s, 26 * s, 12 * s, 6 * s).fill(0xf6f4f0);
  g.poly([-24 * s, -54 * s, -16 * s, -92 * s, -8 * s, -54 * s]).fill(0x1a1a22);
  g.moveTo(-16 * s, -88 * s).lineTo(-16 * s, -60 * s).stroke({ width: 1.5 * s, color: 0xd0d0d8 });
  g.roundRect(-30 * s, -20 * s, 60 * s, 46 * s, 18 * s).stroke({ width: 2 * s, color: 0xb8b4c0 });
  return g;
}
export interface ManoRig {
  root: Container;
  actor: Actor | null;
  hand: Graphics;
  /** the nib in root space */
  nib: () => [number, number];
}
export function manoFigure(ctx: SceneCtx, size: number, o: { bake?: string; tint?: number } = {}): ManoRig {
  const root = new Container();
  const a = o.bake ? ctx.actorAs(o.bake, STAND.mano, size) : ctx.actor(STAND.mano, size);
  if (a) {
    if (a.puppet) a.puppet.tint = o.tint ?? 0xeceaf2;
    root.addChild(a);
  }
  const s = size / 300;
  const hand = manoHand(s);
  hand.position.set(size * 0.3, -size * 0.42);
  root.addChild(hand);
  return { root, actor: a, hand, nib: () => [hand.x + (-16 * s) * hand.scale.x, hand.y + -92 * s * hand.scale.y] };
}

// ------------------------------------------------------------------ Garbancito and Esquirla (stand-ins + drawn traits)
export function garbancito(ctx: SceneCtx, size: number, bake?: string): { root: Container; actor: Actor | null } {
  const root = new Container();
  const a = bake ? ctx.actorAs(bake, STAND.garbancito, size) : ctx.actor(STAND.garbancito, size);
  if (a) root.addChild(a);
  // his painting wears its own bandana: the code-drawn red kerchief was the stand-in's (kept only as a fallback)
  if (a) return { root, actor: a };
  const g = new Graphics();
  // the Disruptors' red kerchief around his neck
  const y = -size * 0.42;
  g.poly([-size * 0.24, y, size * 0.2, y - size * 0.03, size * 0.05, y + size * 0.16]).fill(0xc8322a).stroke({ width: Math.max(1, size * 0.02), color: 0x3a0e0a });
  g.poly([size * 0.16, y - size * 0.02, size * 0.34, y + size * 0.08, size * 0.24, y + size * 0.12]).fill(0xc8322a);
  root.addChild(g);
  return { root, actor: a };
}
export interface EsquirlaRig {
  root: Container;
  actor: Actor | null;
  arm: Graphics;
  /** redraw the glitch arm reaching to (x, y) in root space, on twos */
  reach(lt: number, to: [number, number], k?: number): void;
}
export function esquirlaFigure(ctx: SceneCtx, size: number, bake?: string): EsquirlaRig {
  const root = new Container();
  const a = bake ? ctx.actorAs(bake, STAND.esquirla, size) : ctx.actor(STAND.esquirla, size);
  if (a) root.addChild(a);
  // the broken visor across her eyes
  const v = new Graphics();
  const vy = -size * 0.7;
  v.poly([-size * 0.26, vy - size * 0.04, size * 0.2, vy - size * 0.07, size * 0.22, vy + size * 0.04, -size * 0.25, vy + size * 0.07]).fill({ color: 0x1a1030, alpha: 0.9 }).stroke({ width: 3, color: 0x58f0ff });
  v.moveTo(-size * 0.05, vy - size * 0.05).lineTo(size * 0.02, vy + size * 0.01).lineTo(-size * 0.03, vy + size * 0.05).stroke({ width: 2, color: 0xff3ad0 });
  root.addChild(v);
  const arm = new Graphics();
  root.addChild(arm);
  const shoulder: [number, number] = [size * 0.18, -size * 0.45];
  return {
    root,
    actor: a,
    arm,
    reach(lt, to, k = 1) {
      const g = arm.clear();
      if (k <= 0.01) return;
      const st = Math.floor(lt * 12);
      const n = 9;
      let [px, py] = shoulder;
      for (let i = 1; i <= n; i++) {
        const f = (i / n) * k;
        const x = shoulder[0] + (to[0] - shoulder[0]) * f + (rnd(st * 13 + i) - 0.5) * 22;
        const y = shoulder[1] + (to[1] - shoulder[1]) * f + (rnd(st * 7 + i * 3) - 0.5) * 22 - Math.sin(f * Math.PI) * 60;
        // a chain of glitch blocks (cyan / magenta)
        g.rect(Math.min(px, x) - 6, Math.min(py, y) - 6, Math.abs(x - px) + 12, Math.abs(y - py) + 12).fill({ color: i % 2 ? 0x58f0ff : 0xff3ad0, alpha: 0.75 });
        px = x;
        py = y;
      }
      g.rect(to[0] - 18, to[1] - 18, 36, 36).fill({ color: 0xffffff, alpha: 0.85 }).stroke({ width: 3, color: 0xff3ad0 });
    },
  };
}

// ------------------------------------------------------------------ silence under the picture
/**
 * A keyed duck of the music bus (−dB), driven by lt so it is a pure function of time: `set(on)` every frame; only a
 * change touches the audio. Release in the set's destroy(). (F19: «la música se corta en la F».)
 */
export class MusicDuck {
  private on = false;
  constructor(
    private key: string,
    private db = 60,
  ) {}
  set(on: boolean) {
    if (on === this.on) return;
    this.on = on;
    try {
      audioApi.duck(on, this.db, this.key);
    } catch {
      /* audio may be unavailable */
    }
  }
  release() {
    this.set(false);
  }
}

const DUCKS = new WeakMap<Baker, MusicDuck>();
/** one duck per film run (every scene's set shares it, so its state is a function of FILM time, not of which set) */
export function filmDuck(ctx: SceneCtx, key: string, db = 60): MusicDuck {
  let d = DUCKS.get(ctx.baker);
  if (!d) DUCKS.set(ctx.baker, (d = new MusicDuck(key, db)));
  return d;
}

// ------------------------------------------------------------------ small drawing helpers
/** a wobbly ink line through points (hand-drawn) */
export function inkLine(g: Graphics, pts: [number, number][], o: { width?: number; color?: number; alpha?: number; amp?: number; seed?: number } = {}) {
  if (pts.length < 2) return;
  const amp = o.amp ?? 1.6;
  const s = o.seed ?? 1;
  g.moveTo(pts[0][0] + wob(0, s) * amp, pts[0][1] + wob(0.5, s) * amp);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0] + wob(i * 0.7, s) * amp, pts[i][1] + wob(i * 0.7 + 0.3, s + 1) * amp);
  g.stroke({ width: o.width ?? 3, color: o.color ?? LB.sepia, alpha: o.alpha ?? 1, cap: 'round', join: 'round' });
}
/** the first fraction p of a polyline (by length) */
export function partial(pts: [number, number][], p: number): [number, number][] {
  if (p >= 1) return pts;
  if (p <= 0 || pts.length < 2) return pts.slice(0, 1);
  let total = 0;
  const lens: number[] = [];
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    lens.push(l);
    total += l;
  }
  let left = total * p;
  const out: [number, number][] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (left >= lens[i - 1]) {
      out.push(pts[i]);
      left -= lens[i - 1];
    } else {
      const k = left / Math.max(1e-6, lens[i - 1]);
      out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]);
      break;
    }
  }
  return out;
}
/** pop a container in (scale from 0 with overshoot), or just fade with «Reducir movimiento» */
export function popIn(c: Container, lt: number, a: number, b: number, rm = false, base = 1) {
  const p = seg(lt, a, b);
  c.visible = p > 0;
  if (rm) {
    c.alpha = sm(p);
    c.scale.set(base);
    return;
  }
  const k = p >= 1 ? 1 : 1 - Math.pow(1 - p, 3) * Math.cos(p * Math.PI * 2.2);
  c.alpha = 1;
  c.scale.set(base * Math.max(0, k));
}
/** a FrameInfo-free helper: the camera's handheld is the stage's; this is a set's own breathing for a still prop */
export const breathe = (lt: number, rm: boolean, a = 0.012) => 1 + (rm ? 0 : a * Math.sin(lt * 1.3));
export type { FrameInfo };

// ------------------------------------------------------------------ the real simulator's shot (battle/demo.ts)
let demoCache: Promise<{ pts: [number, number][]; field: { waterY: number; player: { x0: number; x1: number }; enemy: { x0: number; x1: number } }; caption: string } | null> | null = null;
/**
 * A real shot computed by the battle simulator (battle/demo.ts, the same physics as the battle): its flight in battle
 * world coordinates (1920 × 1080 field) and the two ships' extents. The briefings draw THIS arc when they show a rule,
 * so what the film shows is what the battle does. Cached per session (it runs the sim once, at build).
 */
export function demoShot() {
  demoCache ??= import('../../../../battle/demo')
    .then((m) => {
      const d = m.ruleDemo('mareo');
      const s = d.shots.find((x) => x.good) ?? d.shots[0];
      // the flight up to its landing (the sim keeps integrating after the first impact)
      let end = s.points.length - 1;
      let best = Infinity;
      s.points.forEach((p, i) => {
        const dd = Math.hypot(p.x - s.x, p.y - s.y);
        if (dd < best) {
          best = dd;
          end = i;
        }
      });
      return { pts: s.points.slice(0, end + 1).map((p) => [p.x, p.y] as [number, number]), field: d.field, caption: d.caption };
    })
    .catch((e) => {
      console.warn('[acto3] sin tiro del simulador', e);
      return null;
    });
  return demoCache;
}
/** map battle-world points into a rect [x, y, w, h] (keeps the aspect, the field's water on the rect's bottom third) */
export function fitField(pts: [number, number][], rect: [number, number, number, number]): [number, number][] {
  const s = Math.min(rect[2] / 1920, rect[3] / 1080);
  return pts.map(([x, y]) => [rect[0] + (x * s) + (rect[2] - 1920 * s) / 2, rect[1] + y * s + (rect[3] - 1080 * s) / 2]);
}

let fallCache: Promise<{ falls: [number, number][][]; field: { waterY: number; player: { x0: number; x1: number }; enemy: { x0: number; x1: number } }; caption: string } | null> | null = null;
/** the simulator's falling objects onto YOUR ship (battle/demo.ts «botellas»: the same physics as debris from above) */
export function demoFalls() {
  fallCache ??= import('../../../../battle/demo')
    .then((m) => {
      const d = m.ruleDemo('botellas');
      return { falls: d.shots.map((s) => s.points.map((p) => [p.x, p.y] as [number, number])), field: d.field, caption: d.caption };
    })
    .catch(() => null);
  return fallCache;
}

/** jagged hand-painted letters (expressionist intertitles): one sprite per letter, skewed and tilted */
export function jagged(k: Kit, text: string, o: { size?: number; fill?: number; stroke?: number; font?: string; seed?: number } = {}): Container {
  const c = new Container();
  const size = o.size ?? 90;
  const style: TextStyleOptions = { fontFamily: o.font ?? 'Anton', fontSize: size, fill: o.fill ?? 0xe8e0b0, stroke: { color: o.stroke ?? 0x0c0e08, width: size * 0.08, join: 'miter' } };
  let x = 0;
  const seed = o.seed ?? 3;
  const parts: Sprite[] = [];
  [...text].forEach((ch, i) => {
    if (ch === ' ') {
      x += size * 0.35;
      return;
    }
    const sp = word(k, ch, style, 0.5);
    const w = CanvasTextMetrics.measureText(ch, new TextStyle(style)).width;
    sp.position.set(x + w / 2, (rnd(i * 5 + seed) - 0.5) * size * 0.22);
    sp.rotation = (rnd(i * 3 + seed) - 0.5) * 0.3;
    sp.skew.x = (rnd(i * 7 + seed) - 0.5) * 0.5;
    sp.scale.set(1, 0.9 + rnd(i * 11 + seed) * 0.35);
    parts.push(sp);
    c.addChild(sp);
    x += w * 1.02;
  });
  for (const p of parts) p.x -= x / 2;
  return c;
}

/**
 * Draw live containers ONCE at build, in their default state (everything visible, alpha 1): every texture is uploaded
 * and every shape tessellated before the clock. The stage's own warm samples a few instants, where a prop that fades in
 * later is still at alpha 0 and gets skipped (measured: a 100 ms first-use stall in F18 at 5.3 s). Call it at the end
 * of build with the set's live containers.
 */
export function prewarm(ctx: SceneCtx, ...nodes: (Container | null | undefined)[]) {
  for (const n of nodes) if (n) ctx.baker.warm(n);
}
