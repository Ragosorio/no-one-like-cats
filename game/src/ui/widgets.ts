import { Container, Graphics, Text, TextStyleOptions, TilingSprite, Sprite } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from './theme';
import { paperTexture } from '../art/textures';
import { sfx } from '../core/audio';
import { fmt } from '../core/format';

export function txt(text: string, style: TextStyleOptions = {}): Text {
  return new Text({
    text,
    style: { fontFamily: F.ui, fontSize: 24, fill: C.ink, ...style },
    resolution: 2,
  });
}

export function poster(text: string, size = 64, fill: number = C.ink, extra: TextStyleOptions = {}): Text {
  return txt(text, { fontFamily: F.poster, fontSize: size, fill, letterSpacing: -1, ...extra });
}

/** Paper card with ink border and a solid offset "print" shadow block. */
export class Panel extends Container {
  bg: Graphics;
  paper: TilingSprite;
  shadow: Graphics;
  constructor(
    public w: number,
    public h: number,
    opts: { color?: number; shadow?: number; border?: number; offset?: number; paper?: boolean } = {},
  ) {
    super();
    const off = opts.offset ?? 10;
    this.shadow = new Graphics().rect(off, off, w, h).fill(opts.shadow ?? C.ink);
    this.bg = new Graphics().rect(0, 0, w, h).fill(opts.color ?? C.paper);
    this.paper = new TilingSprite({ texture: paperTexture(opts.color ?? C.paper), width: w, height: h });
    this.paper.alpha = opts.paper === false ? 0 : 1;
    const border = new Graphics().rect(0, 0, w, h).stroke({ width: opts.border ?? 4, color: C.ink, alignment: 1 });
    this.addChild(this.shadow, this.bg, this.paper, border);
  }
}

export interface ButtonOpts {
  w?: number;
  h?: number;
  color?: number;
  textColor?: number;
  size?: number;
  font?: string;
  shadow?: number;
  disabled?: boolean;
  sound?: boolean;
}

/** Chunky poster button: block shadow, squash on press, lift on hover. */
export class Button extends Container {
  face = new Container();
  caption: Text;
  bg: Graphics;
  shadowG: Graphics;
  private _disabled = false;
  private onTap: () => void;
  readonly bw: number;
  readonly bh: number;
  constructor(text: string, onTap: () => void, o: ButtonOpts = {}) {
    super();
    this.onTap = onTap;
    const w = (this.bw = o.w ?? 260);
    const h = (this.bh = o.h ?? 76);
    this.shadowG = new Graphics().rect(6, 6, w, h).fill(o.shadow ?? C.ink);
    this.bg = new Graphics();
    this.drawBg(o.color ?? C.pink);
    this.caption = txt(text, { fontFamily: o.font ?? F.poster, fontSize: o.size ?? 34, fill: o.textColor ?? C.ink, align: 'center' });
    this.caption.anchor.set(0.5);
    this.caption.position.set(w / 2, h / 2);
    this.face.addChild(this.bg, this.caption);
    this.addChild(this.shadowG, this.face);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerover', () => {
      if (this._disabled) return;
      gsap.to(this.face, { x: -3, y: -3, duration: 0.12, ease: 'power2.out' });
      sfx('hover');
    });
    this.on('pointerout', () => gsap.to(this.face, { x: 0, y: 0, duration: 0.15 }));
    this.on('pointerdown', () => {
      if (this._disabled) return;
      gsap.to(this.face, { x: 5, y: 5, duration: 0.05 });
    });
    this.on('pointerup', () => gsap.to(this.face, { x: -3, y: -3, duration: 0.12, ease: 'back.out(3)' }));
    this.on('pointertap', () => {
      if (this._disabled) {
        sfx('error');
        gsap.fromTo(this, { x: this.x - 6 }, { x: this.x, duration: 0.3, ease: 'elastic.out(1,0.3)' });
        return;
      }
      if (o.sound !== false) sfx('click');
      this.onTap();
    });
    this.disabled = !!o.disabled;
  }
  drawBg(color: number) {
    this.bg.clear().rect(0, 0, this.bw, this.bh).fill(color).stroke({ width: 4, color: C.ink, alignment: 1 });
  }
  set disabled(v: boolean) {
    this._disabled = v;
    this.face.alpha = v ? 0.45 : 1;
    this.cursor = v ? 'not-allowed' : 'pointer';
  }
  get disabled() {
    return this._disabled;
  }
  setText(t: string) {
    this.caption.text = t;
  }
}

/** Progress bar with overshoot fill and optional label. */
export class Bar extends Container {
  fill: Graphics;
  back: Graphics;
  private _p = 0;
  caption?: Text;
  constructor(
    public w: number,
    public h: number,
    public color: number = C.pink,
    back: number = C.paperDark,
    withLabel = false,
  ) {
    super();
    this.back = new Graphics().rect(0, 0, w, h).fill(back).stroke({ width: 3, color: C.ink, alignment: 1 });
    this.fill = new Graphics().rect(0, 0, w, h).fill(color);
    this.fill.scale.x = 0;
    this.addChild(this.back, this.fill);
    if (withLabel) {
      this.caption = txt('', { fontFamily: F.ui, fontWeight: '700', fontSize: Math.max(12, h * 0.62) });
      this.caption.anchor.set(0.5);
      this.caption.position.set(w / 2, h / 2);
      this.addChild(this.caption);
    }
  }
  setColor(c: number) {
    this.color = c;
    this.fill.clear().rect(0, 0, this.w, this.h).fill(c);
  }
  set(p: number, animate = true) {
    p = Math.max(0, Math.min(1, p));
    if (animate && Math.abs(p - this._p) > 0.001) {
      gsap.to(this.fill.scale, { x: p, duration: 0.35, ease: p > this._p ? 'back.out(1.6)' : 'power2.out' });
    } else this.fill.scale.x = p;
    this._p = p;
  }
  get value() {
    return this._p;
  }
}

/** Number that rolls to its target value (tick-up). */
export class Counter extends Container {
  text: Text;
  private shown = 0;
  private target = 0;
  private tween?: gsap.core.Tween;
  constructor(
    style: TextStyleOptions,
    public prefix = '',
    public formatter: (n: number) => string = fmt,
  ) {
    super();
    this.text = txt(prefix + '0', style);
    this.addChild(this.text);
  }
  set(v: number, animate = true) {
    if (v === this.target) return;
    const up = v > this.target;
    this.target = v;
    this.tween?.kill();
    if (!animate) {
      this.shown = v;
      this.text.text = this.prefix + this.formatter(v);
      return;
    }
    const obj = { v: this.shown };
    this.tween = gsap.to(obj, {
      v,
      duration: 0.45,
      ease: 'power2.out',
      onUpdate: () => {
        this.shown = obj.v;
        this.text.text = this.prefix + this.formatter(obj.v);
      },
    });
    if (up) {
      gsap.fromTo(this.text.scale, { x: 1.18, y: 1.18 }, { x: 1, y: 1, duration: 0.35, ease: 'back.out(3)' });
    }
  }
}

/** Swiss poster decoration: 3x6 dot grid */
export function dotGrid(cols = 3, rows = 6, gap = 18, r = 2.5, color: number = C.ink) {
  const g = new Graphics();
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) g.circle(x * gap, y * gap, r).fill(color);
  return g;
}

/** thin "+" crosshair marks */
export function crosses(color: number = C.ink) {
  const g = new Graphics();
  const plus = (x: number, y: number, s: number) => {
    g.moveTo(x - s, y).lineTo(x + s, y).moveTo(x, y - s).lineTo(x, y + s);
  };
  plus(0, 0, 14);
  plus(34, 22, 9);
  g.stroke({ width: 2, color });
  return g;
}

/** Fullscreen paper background */
export function paperBg(w: number, h: number, color: number = C.paper) {
  const s = new TilingSprite({ texture: paperTexture(color), width: w, height: h });
  return s;
}

export function hitArea(c: Container, w: number, h: number) {
  const g = new Graphics().rect(0, 0, w, h).fill({ color: 0xffffff, alpha: 0.001 });
  c.addChildAt(g, 0);
  return g;
}

export { Sprite };
