/**
 * ACTO II — the PAGE kit: what every comic, newspaper, manga and anime film of the act is drawn with.
 *
 *   word / letters      cached text sprites (built in build, never on the clock)
 *   Panel               a comic panel (viñeta): white gutter + thick border, its content MASKED to the panel, an `over`
 *                       layer for what breaks the border (a web, a villain's fist); `show(lt, t0)` pops / wipes it in
 *   caption             a narration box (caja de texto) in a flat colour with an offset shadow
 *   balloon             a comic speech balloon (oval, tail toward the speaker; `shout` = spiky)
 *   Onoma               SOLID onomatopoeia: extruded block letters (they can be hit: cracks + smoke)
 *   burst / speedLines  the explosion star and the radial / parallel speed lines (built once, jittered on twos)
 *   dotsFill            a halftone field (a baked dot tile, tinted, masked to a shape)
 *   reveal              the shared «enter» of a piece: pop (scale with overshoot) — a fade with «Reducir movimiento»
 *
 * Rules: everything is a function of lt; texts and big Graphics are made in build; per frame only transforms / alpha
 * and tiny redraws.
 */
import { Container, Graphics, Sprite, TilingSprite, type Texture, type TextStyleOptions } from 'pixi.js';
import { CanvasTextMetrics, TextStyle } from 'pixi.js';
import type { Kit } from '../../../../momentos/anime/kit';
import { clamp01, outBack, rnd, seg, sm } from './t';

export const INK = 0x0d0a14;
export const PAPER = 0xfff8e8;
/** the comic multiverse's flat inks */
export const CMY = { cyan: 0x22b8e8, magenta: 0xec2d7a, yellow: 0xffd23a, red: 0xe5322d, blue: 0x2a54c8, green: 0x2fae5a, orange: 0xff8a1e, purple: 0x6a3aa8, night: 0x1a1240 } as const;
/** Luzterna's lantern blue (the one cold colour of every warm frame) */
export const LANTERN = 0x58d0ff;

// ------------------------------------------------------------------ text
/** a cached text sprite (anchor centre) — build only */
export const word = (k: Kit, text: string, style: TextStyleOptions, anchor = 0.5) => k.text.sprite(text, style, anchor);
/**
 * a text whose «Ō» the display fonts don't have (Bangers / Anton ship only the latin subset): the word is set with a
 * plain O and the macron is drawn as a bar of the same ink — ITŌ, SHŌNEN. Centered like `word` (single line).
 */
export function wordM(k: Kit, text: string, style: TextStyleOptions, anchor = 0.5): Container {
  if (!/[ŌŪ]/.test(text)) return word(k, text, style, anchor);
  const c = new Container();
  const plain = text.replace(/Ō/g, 'O').replace(/Ū/g, 'U');
  const t = word(k, plain, style, anchor);
  c.addChild(t);
  const ts = new TextStyle(style);
  const W = CanvasTextMetrics.measureText(plain, ts).width;
  const size = Number(style.fontSize ?? 40);
  const bar = new Graphics();
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== 'Ō' && text[i] !== 'Ū') continue;
    const x0 = CanvasTextMetrics.measureText(plain.slice(0, i), ts).width;
    const x1 = CanvasTextMetrics.measureText(plain.slice(0, i + 1), ts).width;
    const left = -W * anchor + x0;
    const w = x1 - x0;
    const y = -t.height * anchor + size * 0.02;
    const stroke = (style.stroke as { color?: number; width?: number } | undefined) ?? undefined;
    if (stroke?.width) bar.roundRect(left + w * 0.12 - stroke.width / 2, y - stroke.width / 2, w * 0.76 + stroke.width, size * 0.1 + stroke.width, 3).fill(stroke.color ?? INK);
    bar.roundRect(left + w * 0.12, y, w * 0.76, size * 0.1, 3).fill(typeof style.fill === 'number' ? style.fill : INK);
  }
  c.addChild(bar);
  return c;
}
/** comic lettering (Bangers, all caps) */
export const comicStyle = (size: number, fill: number = INK, o: Partial<TextStyleOptions> = {}): TextStyleOptions => ({ fontFamily: 'Bangers', fontSize: size, fill, letterSpacing: size * 0.04, align: 'center', lineHeight: size * 1.05, ...o });

// ------------------------------------------------------------------ the panel
export interface PanelOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  /** border width (default 9) */
  border?: number;
  /** the panel's own background */
  bg?: number;
  /** a slight tilt (rad) */
  rot?: number;
  /** the white gutter around it (px, default 14) */
  gutter?: number;
  gutterColor?: number;
  ink?: number;
}
export class Panel extends Container {
  readonly content = new Container();
  readonly over = new Container();
  readonly frame = new Graphics();
  readonly mask0 = new Graphics();
  constructor(readonly o: PanelOpts) {
    super();
    const { w, h } = o;
    const b = o.border ?? 9;
    const gut = o.gutter ?? 14;
    const back = new Graphics();
    if (gut > 0) back.rect(-w / 2 - gut, -h / 2 - gut, w + gut * 2, h + gut * 2).fill(o.gutterColor ?? 0xffffff);
    back.rect(-w / 2, -h / 2, w, h).fill(o.bg ?? PAPER);
    this.mask0.rect(-w / 2, -h / 2, w, h).fill(0xffffff);
    this.content.mask = this.mask0;
    this.frame.rect(-w / 2, -h / 2, w, h).stroke({ width: b, color: o.ink ?? INK, alignment: 0.5 });
    this.addChild(back, this.content, this.mask0, this.frame, this.over);
    this.position.set(o.x + w / 2, o.y + h / 2);
    this.rotation = o.rot ?? 0;
  }
  /** the panel's local point → its parent (page) space */
  centre(): [number, number] {
    return [this.x, this.y];
  }
  /**
   * pop it in at t0 (scale from 0.6 with overshoot, a slight spin) — or wipe / fade. Hidden before t0, gone after t1.
   */
  show(lt: number, t0: number, rm = false, how: 'pop' | 'drop' | 'fade' = 'pop', t1 = Infinity) {
    const on = lt >= t0 && lt < t1;
    this.visible = on;
    if (!on) return;
    const p = seg(lt, t0, t0 + (how === 'fade' ? 0.35 : 0.3));
    const r0 = this.o.rot ?? 0;
    if (rm || how === 'fade') {
      this.alpha = sm(p);
      this.scale.set(1);
      this.rotation = r0;
      return;
    }
    this.alpha = Math.min(1, p * 4);
    if (how === 'drop') {
      this.scale.set(1);
      this.position.y = this.o.y + this.o.h / 2 - (1 - outBack(p, 1.6)) * 160;
    } else {
      const s = 0.6 + 0.4 * outBack(p, 2.4);
      this.scale.set(s);
      this.rotation = r0 + (1 - p) * 0.05;
    }
  }
}

// ------------------------------------------------------------------ narration box
export interface CaptionOpts {
  fill?: number;
  ink?: number;
  size?: number;
  /** wrap width */
  w?: number;
  rot?: number;
  font?: string;
}
export function caption(k: Kit, text: string, o: CaptionOpts = {}): Container {
  const c = new Container();
  const size = o.size ?? 40;
  const t = word(k, text, { fontFamily: o.font ?? 'Bangers', fontSize: size, fill: o.ink ?? INK, letterSpacing: size * 0.05, align: 'left', wordWrap: true, wordWrapWidth: o.w ?? 560, lineHeight: size * 1.12 });
  const pw = t.width + size * 0.9;
  const ph = t.height + size * 0.6;
  const g = new Graphics();
  g.rect(-pw / 2 + 9, -ph / 2 + 9, pw, ph).fill(INK);
  g.rect(-pw / 2, -ph / 2, pw, ph).fill(o.fill ?? CMY.yellow).stroke({ width: 5, color: INK });
  c.addChild(g, t);
  c.rotation = o.rot ?? 0;
  return c;
}

// ------------------------------------------------------------------ speech balloon
export interface BalloonOpts {
  size?: number;
  /** tail tip relative to the balloon centre */
  tail?: [number, number];
  wrap?: number;
  shout?: boolean;
  fill?: number;
  ink?: number;
  font?: string;
  /** a thought / whisper: a dashed outline */
  whisper?: boolean;
}
export function balloon(k: Kit, text: string, o: BalloonOpts = {}): Container {
  const c = new Container();
  const size = o.size ?? 42;
  const ink = o.ink ?? INK;
  const t = word(k, text, { fontFamily: o.font ?? 'Bangers', fontSize: size, fill: ink, letterSpacing: size * 0.04, align: 'center', wordWrap: true, wordWrapWidth: o.wrap ?? 520, lineHeight: size * 1.08 });
  const w = t.width + size * 1.5;
  const h = t.height + size * 1.0;
  const fill = o.fill ?? 0xffffff;
  const g = new Graphics();
  const tail = o.tail ?? [-w * 0.2, h * 0.9];
  const tx = Math.max(-w / 2 + 40, Math.min(w / 2 - 40, tail[0] * 0.35));
  const ty = tail[1] >= 0 ? h * 0.38 : -h * 0.38;
  g.poly([tx - 22, ty, tx + 22, ty, tail[0], tail[1]]).fill(fill).stroke({ width: 5, color: ink, join: 'round' });
  if (o.shout) {
    const pts: number[] = [];
    const n = 24;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = i % 2 ? 1 : 1.18 + rnd(i) * 0.06;
      pts.push(Math.cos(a) * (w / 2) * r * 1.04, Math.sin(a) * (h / 2) * r * 1.1);
    }
    g.poly(pts).fill(fill).stroke({ width: 6, color: ink, join: 'miter' });
  } else {
    g.ellipse(0, 0, w / 2 + 6, h / 2 + 4).fill(fill).stroke({ width: o.whisper ? 3 : 5, color: ink });
  }
  // re-cover the tail root
  g.ellipse(tx, ty * 0.92, 26, 10).fill(fill);
  c.addChild(g, t);
  return c;
}

/** pop a piece in over [a, b] (scale with overshoot; «Reducir movimiento»: a fade) — hidden outside */
export function reveal(c: Container, lt: number, a: number, b = Infinity, rm = false, base = 1) {
  const on = lt >= a && lt < b;
  c.visible = on;
  if (!on) return;
  const p = (lt - a) / 0.2;
  const q = (b - lt) / 0.16;
  if (rm) {
    c.scale.set(base);
    c.alpha = Math.min(1, p, q);
    return;
  }
  c.alpha = Math.min(1, q, p * 3);
  const s = p < 1 ? 0.35 + 0.65 * outBack(clamp01(p), 2.6) : q < 1 ? 0.9 + 0.1 * q : 1;
  c.scale.set(base * Math.max(0.01, s));
}

// ------------------------------------------------------------------ solid onomatopoeia
export interface OnomaOpts {
  size?: number;
  fill?: number;
  /** the extrusion (side) colour */
  side?: number;
  ink?: number;
  /** extrusion depth (px) and direction */
  depth?: number;
  dir?: [number, number];
  rot?: number;
  font?: string;
}
/**
 * Block letters that STAY: the word is stacked `depth` times along `dir` in the side colour (a cheap extrusion: the
 * same cached texture), then the face with a thick ink outline. `crack(k)` draws cracks 0..1, `smoke(lt)` puffs.
 */
export class Onoma extends Container {
  readonly face: Sprite;
  private cracks = new Graphics();
  private puffs = new Graphics();
  private readonly w: number;
  private readonly h: number;
  constructor(k: Kit, text: string, o: OnomaOpts = {}) {
    super();
    const size = o.size ?? 220;
    const font = o.font ?? 'Bangers';
    const st = (fill: number, stroke?: number): TextStyleOptions => ({ fontFamily: font, fontSize: size, fill, letterSpacing: size * 0.02, ...(stroke !== undefined ? { stroke: { color: stroke, width: size * 0.07, join: 'round' } } : {}) });
    const depth = o.depth ?? Math.round(size * 0.14);
    const [dx, dy] = o.dir ?? [0.55, 0.85];
    const ink = o.ink ?? INK;
    for (let i = depth; i > 0; i -= 3) {
      const s = word(k, text, st(i === depth ? ink : (o.side ?? 0xb3261e), ink));
      s.position.set(dx * i, dy * i);
      this.addChild(s);
    }
    this.face = word(k, text, st(o.fill ?? CMY.yellow, ink));
    this.addChild(this.face, this.cracks, this.puffs);
    this.w = this.face.width;
    this.h = this.face.height;
    this.rotation = o.rot ?? 0;
  }
  /** cracks across the face (0..1), deterministic */
  crack(k01: number) {
    const g = this.cracks.clear();
    if (k01 <= 0.01) return;
    const n = Math.ceil(5 * k01);
    for (let i = 0; i < n; i++) {
      let x = (rnd(i * 3 + 1) - 0.5) * this.w * 0.8;
      let y = -this.h * 0.35;
      g.moveTo(x, y);
      for (let j = 0; j < 4; j++) {
        x += (rnd(i * 7 + j) - 0.5) * 50;
        y += this.h * 0.18 * k01;
        g.lineTo(x, y);
      }
      g.stroke({ width: 5, color: INK });
    }
  }
  /** grey smoke puffs rising from the top edge (a function of lt) */
  smoke(lt: number, amt = 1) {
    const g = this.puffs.clear();
    if (amt <= 0.01) return;
    for (let i = 0; i < 6; i++) {
      const ph = (lt * 0.6 + rnd(i)) % 1;
      const x = (rnd(i + 11) - 0.5) * this.w * 0.9 + Math.sin(lt * 2 + i) * 10;
      const y = -this.h * 0.42 - ph * 150;
      const r = 18 + ph * 34;
      g.circle(x, y, r).fill({ color: 0xd9d4e0, alpha: (1 - ph) * 0.75 * amt }).stroke({ width: 4, color: INK, alpha: (1 - ph) * 0.8 * amt });
    }
  }
  /** the letters' box (local, centred) */
  get box(): [number, number] {
    return [this.w, this.h];
  }
}

// ------------------------------------------------------------------ bursts and speed lines
/** an explosion star (built once) */
export function burst(g: Graphics, x: number, y: number, r: number, o: { n?: number; fill?: number; ink?: number; seed?: number; inner?: number } = {}) {
  const n = o.n ?? 16;
  const pts: number[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const rr = i % 2 ? r * (o.inner ?? 0.62) : r * (0.9 + rnd((o.seed ?? 1) * 31 + i) * 0.3);
    pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.poly(pts).fill(o.fill ?? CMY.yellow).stroke({ width: 7, color: o.ink ?? INK, join: 'miter' });
}
/** radial speed lines around (cx, cy): wedges from r0 outward (built once; rotate the Graphics to jitter) */
export function speedLines(g: Graphics, cx: number, cy: number, r0: number, r1: number, o: { n?: number; color?: number; seed?: number; width?: number } = {}) {
  const n = o.n ?? 60;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd((o.seed ?? 3) + i) * 0.08;
    const w = (o.width ?? 0.018) * (0.4 + rnd(i * 5 + 1));
    const ra = r0 * (1 + rnd(i * 3 + 2) * 0.35);
    g.poly([cx + Math.cos(a) * ra, cy + Math.sin(a) * ra, cx + Math.cos(a - w) * r1, cy + Math.sin(a - w) * r1, cx + Math.cos(a + w) * r1, cy + Math.sin(a + w) * r1]).fill(o.color ?? INK);
  }
}
/** parallel motion lines (a streak field) in a rect, along angle `ang` */
export function streaks(g: Graphics, x: number, y: number, w: number, h: number, o: { n?: number; color?: number; seed?: number; ang?: number; len?: number } = {}) {
  const n = o.n ?? 30;
  const ca = Math.cos(o.ang ?? 0);
  const sa = Math.sin(o.ang ?? 0);
  for (let i = 0; i < n; i++) {
    const px = x + rnd((o.seed ?? 5) + i) * w;
    const py = y + rnd((o.seed ?? 5) + i + 99) * h;
    const L = (o.len ?? 220) * (0.4 + rnd(i * 7));
    const th = 2 + rnd(i * 3) * 5;
    g.poly([px, py - th, px + ca * L, py + sa * L, px, py + th]).fill(o.color ?? INK);
  }
}

// ------------------------------------------------------------------ halftone
/** a halftone field: the baked dot tile, tinted, filling w × h (mask it to a shape if needed) */
export function dotsFill(tex: Texture | undefined, w: number, h: number, o: { tint?: number; scale?: number; alpha?: number; x?: number; y?: number } = {}): Container {
  if (!tex) {
    const g = new Graphics();
    for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < w; x += 16) g.circle((o.x ?? 0) + x, (o.y ?? 0) + y, 4).fill({ color: o.tint ?? INK, alpha: o.alpha ?? 1 });
    return g;
  }
  const t = new TilingSprite({ texture: tex, width: w, height: h });
  t.position.set(o.x ?? 0, o.y ?? 0);
  t.tileScale.set(o.scale ?? 0.4);
  t.tint = o.tint ?? INK;
  t.alpha = o.alpha ?? 1;
  return t;
}
/** a flat-band sky (comic dusk): bands of colour top → bottom over [y0, y1] */
export function bandSky(g: Graphics, x: number, y0: number, w: number, y1: number, cols: number[]) {
  const h = (y1 - y0) / cols.length;
  cols.forEach((c, i) => g.rect(x, y0 + i * h, w, h + 1).fill(c));
}
