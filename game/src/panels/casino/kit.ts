/**
 * Casino UI kit: the "neon-glitch dimension" inside the game's Swiss-poster identity.
 * Ink + cream paper + hot pink + cyan misregistration, Anton type, halftone, chasing bulbs.
 * Everything drawn in code (no emojis, no image assets besides the cat illustrations).
 */
import { Container, Graphics, Rectangle, Sprite, Text, TextStyleOptions, Texture, Ticker, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { game } from '../../core/App';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { icon } from '../../ui/icons';
import { halftoneTexture } from '../../art/textures';
import { fmt } from '../../core/format';
import { sfx } from '../../core/audio';
import type { Sym } from '../../state/sys/casino';

export const CP = {
  night: 0x120914,
  night2: 0x1c0f22,
  plum: 0x2a1631,
  ink: C.ink,
  paper: C.paper,
  paperDark: C.paperDark,
  pink: C.pinkHot,
  softPink: C.pink,
  cyan: C.cyan,
  yellow: C.yellow,
  red: C.red,
  green: 0x2fd27a,
  violet: C.violet,
  gold: 0xffc94a,
  felt: 0x15392c,
} as const;

// ------------------------------------------------------------------ text
export function neon(text: string, size: number, color: number = CP.pink, extra: TextStyleOptions = {}): Text {
  return txt(text, {
    fontFamily: F.poster,
    fontSize: size,
    fill: 0xffffff,
    stroke: { color, width: Math.max(2, size / 14), join: 'round' },
    dropShadow: { color, alpha: 0.95, blur: Math.max(6, size / 4), distance: 0, angle: 0 },
    letterSpacing: 1,
    ...extra,
  });
}
export function label(text: string, size = 20, fill: number = CP.paper, extra: TextStyleOptions = {}): Text {
  return txt(text, { fontFamily: F.ui, fontWeight: '700', fontSize: size, fill, ...extra });
}
export function heading(text: string, size = 40, fill: number = CP.paper, extra: TextStyleOptions = {}): Text {
  return txt(text, { fontFamily: F.poster, fontSize: size, fill, letterSpacing: 0, ...extra });
}
/** poster text with a CMYK misregistration ghost (cyan / pink) */
export function misprint(text: string, size: number, fill: number = CP.paper, font: string = F.poster): Container {
  const c = new Container();
  const mk = (col: number, dx: number, dy: number, a: number) => {
    const t = txt(text, { fontFamily: font, fontSize: size, fill: col, letterSpacing: 0 });
    t.position.set(dx, dy);
    t.alpha = a;
    return t;
  };
  const a = mk(CP.cyan, -3, 2, 0.8);
  const b = mk(CP.pink, 3, -1, 0.8);
  c.addChild(a, b, mk(fill, 0, 0, 1));
  return c;
}

// ------------------------------------------------------------------ blocks
/** solid poster block with ink border + offset print shadow */
export function block(w: number, h: number, color: number, o: { shadow?: number; off?: number; border?: number; borderColor?: number } = {}): Graphics {
  const off = o.off ?? 8;
  const g = new Graphics();
  if (off) g.rect(off, off, w, h).fill(o.shadow ?? CP.ink);
  g.rect(0, 0, w, h).fill(color);
  if (o.border !== 0) g.rect(0, 0, w, h).stroke({ width: o.border ?? 4, color: o.borderColor ?? CP.ink, alignment: 1 });
  return g;
}
export function halftone(w: number, h: number, color: number, alpha = 0.12, cell = 12, r = 2.2): TilingSprite {
  const t = new TilingSprite({ texture: halftoneTexture(color, cell, r), width: w, height: h });
  t.alpha = alpha;
  return t;
}

/** make any container a button with lift + squash */
export function clickable(c: Container, onTap: () => void, o: { sound?: boolean; hover?: boolean } = {}) {
  c.eventMode = 'static';
  c.cursor = 'pointer';
  const y0 = () => c.y;
  let base = c.y;
  c.on('pointerover', () => {
    if (o.hover === false) return;
    base = y0();
    gsap.to(c, { y: base - 3, duration: 0.1 });
    sfx('hover');
  });
  c.on('pointerout', () => {
    if (o.hover === false) return;
    gsap.to(c, { y: base, duration: 0.12 });
  });
  c.on('pointertap', () => {
    if (o.sound !== false) sfx('click');
    onTap();
  });
  return c;
}

/** chunky casino button: colored block, ink caption, optional sub-caption + icon */
export class CButton extends Container {
  face = new Container();
  private bg = new Graphics();
  private sh = new Graphics();
  cap: Text;
  sub?: Text;
  private _off = false;
  constructor(
    text: string,
    public onTap: () => void,
    public o: { w?: number; h?: number; color?: number; fg?: number; size?: number; sub?: string; icon?: Container; font?: string } = {},
  ) {
    super();
    const w = o.w ?? 240;
    const h = o.h ?? 72;
    this.sh.rect(7, 7, w, h).fill(CP.ink);
    this.draw(o.color ?? CP.pink);
    this.cap = txt(text, { fontFamily: o.font ?? F.poster, fontSize: o.size ?? 32, fill: o.fg ?? CP.ink, align: 'center' });
    this.cap.anchor.set(0.5);
    const hasSub = !!o.sub;
    const ix = o.icon ? 22 : 0;
    this.cap.position.set(w / 2 + ix, hasSub ? h * 0.38 : h / 2);
    this.face.addChild(this.bg, this.cap);
    if (o.icon) {
      o.icon.position.set(w / 2 - this.cap.width / 2 - 8 + ix - 18, this.cap.y);
      this.face.addChild(o.icon);
    }
    if (hasSub) {
      this.sub = txt(o.sub!, { fontFamily: F.ui, fontWeight: '700', fontSize: Math.round((o.size ?? 32) * 0.5), fill: o.fg ?? CP.ink });
      this.sub.anchor.set(0.5);
      this.sub.position.set(w / 2, h * 0.76);
      this.face.addChild(this.sub);
    }
    this.addChild(this.sh, this.face);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerover', () => {
      if (this._off) return;
      gsap.to(this.face, { x: -3, y: -3, duration: 0.1 });
      sfx('hover');
    });
    this.on('pointerout', () => gsap.to(this.face, { x: 0, y: 0, duration: 0.12 }));
    this.on('pointerdown', () => {
      if (!this._off) gsap.to(this.face, { x: 6, y: 6, duration: 0.05 });
    });
    this.on('pointerup', () => gsap.to(this.face, { x: -3, y: -3, duration: 0.12, ease: 'back.out(3)' }));
    this.on('pointertap', () => {
      if (this._off) {
        sfx('error');
        gsap.fromTo(this.face, { x: -8 }, { x: 0, duration: 0.35, ease: 'elastic.out(1,0.3)' });
        return;
      }
      sfx('click');
      this.onTap();
    });
  }
  get w() {
    return this.o.w ?? 240;
  }
  get h() {
    return this.o.h ?? 72;
  }
  draw(color: number) {
    this.bg.clear().rect(0, 0, this.w, this.h).fill(color).stroke({ width: 4, color: CP.ink, alignment: 1 });
  }
  set disabled(v: boolean) {
    this._off = v;
    this.face.alpha = v ? 0.45 : 1;
    this.cursor = v ? 'not-allowed' : 'pointer';
  }
  get disabled() {
    return this._off;
  }
  setText(t: string, sub?: string) {
    this.cap.text = t;
    if (sub !== undefined && this.sub) this.sub.text = sub;
  }
}

/** segmented selector (currency, stake…) */
export class Seg<T> extends Container {
  private items: { v: T; c: Container; bg: Graphics; t: Text }[] = [];
  value: T;
  constructor(
    opts: { v: T; label: string; icon?: Container; disabled?: boolean }[],
    initial: T,
    public onChange: (v: T) => void,
    o: { w?: number; h?: number; size?: number; color?: number; gap?: number } = {},
  ) {
    super();
    this.value = initial;
    const w = o.w ?? 150;
    const h = o.h ?? 52;
    const gap = o.gap ?? 8;
    opts.forEach((op, i) => {
      const c = new Container();
      c.x = i * (w + gap);
      const bg = new Graphics();
      const t = txt(op.label, { fontFamily: F.poster, fontSize: o.size ?? 24, fill: CP.ink });
      t.anchor.set(0.5);
      t.position.set(w / 2 + (op.icon ? 14 : 0), h / 2);
      c.addChild(bg, t);
      if (op.icon) {
        op.icon.position.set(w / 2 - t.width / 2 - 6, h / 2);
        c.addChild(op.icon);
      }
      if (op.disabled) c.alpha = 0.35;
      else
        clickable(
          c,
          () => {
            this.set(op.v);
            this.onChange(op.v);
          },
          { hover: false },
        );
      this.addChild(c);
      this.items.push({ v: op.v, c, bg, t });
    });
    this.w = w;
    this.h = h;
    this.color = o.color ?? CP.yellow;
    this.redraw();
  }
  private w: number;
  private h: number;
  private color: number;
  set(v: T) {
    this.value = v;
    this.redraw();
  }
  private redraw() {
    for (const it of this.items) {
      const on = it.v === this.value;
      it.bg.clear();
      if (on) it.bg.rect(5, 5, this.w, this.h).fill(CP.ink);
      it.bg.rect(0, 0, this.w, this.h).fill(on ? this.color : CP.paperDark).stroke({ width: 3, color: CP.ink, alignment: 1 });
      it.c.y = on ? -3 : 0;
      it.t.style.fill = CP.ink;
    }
  }
}

// ------------------------------------------------------------------ icons
export function ticketIcon(s = 40, color: number = CP.pink): Container {
  const c = new Container();
  const g = new Graphics();
  const w = s * 1.1;
  const h = s * 0.66;
  const x = -w / 2;
  const y = -h / 2;
  const r = h * 0.18;
  g.moveTo(x, y)
    .lineTo(x + w, y)
    .lineTo(x + w, y + h / 2 - r)
    .arc(x + w, y + h / 2, r, -Math.PI / 2, Math.PI / 2, true)
    .lineTo(x + w, y + h)
    .lineTo(x, y + h)
    .lineTo(x, y + h / 2 + r)
    .arc(x, y + h / 2, r, Math.PI / 2, -Math.PI / 2, true)
    .closePath()
    .fill(color)
    .stroke({ width: Math.max(2, s / 14), color: CP.ink, join: 'round' });
  for (let i = 0; i < 4; i++) g.rect(x + w * 0.68 - 1, y + h * (0.12 + i * 0.22), 2.5, h * 0.12).fill(CP.ink);
  g.star(x + w * 0.34, 0, 5, h * 0.3, h * 0.13).fill(CP.paper).stroke({ width: 1.5, color: CP.ink });
  c.addChild(g);
  c.rotation = -0.12;
  return c;
}
export type CurKind = 'gold' | 'gems' | 'chips' | 'tickets' | 'food';
export function curIcon(k: CurKind, s = 34): Container {
  if (k === 'gold') return icon('gold', s);
  if (k === 'gems') return icon('gem', s);
  if (k === 'chips') return chipIcon(s);
  if (k === 'food') return icon('food', s);
  return ticketIcon(s);
}
/** casino chip: ink rim with paper notches, pink core, paw */
export function chipIcon(s = 34, color: number = CP.pink): Container {
  const c = new Container();
  const g = new Graphics();
  const r = s / 2;
  g.circle(0, 0, r).fill(color).stroke({ width: Math.max(2, s / 14), color: CP.ink });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.moveTo(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72)
      .lineTo(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.98)
      .stroke({ width: Math.max(2, s / 9), color: CP.paper, cap: 'butt' });
  }
  g.circle(0, 0, r * 0.56).fill(CP.paper).stroke({ width: Math.max(1.5, s / 20), color: CP.ink });
  paw(g, 0, r * 0.05, r * 0.36, CP.ink);
  c.addChild(g);
  return c;
}
export function paw(g: Graphics, x: number, y: number, r: number, color: number) {
  g.ellipse(x, y + r * 0.35, r * 0.5, r * 0.42).fill(color);
  for (const [dx, dy] of [
    [-0.55, -0.2],
    [-0.2, -0.55],
    [0.2, -0.55],
    [0.55, -0.2],
  ])
    g.circle(x + dx * r, y + dy * r, r * 0.2).fill(color);
}

/** resource pill for the top bar */
export class ResPill extends Container {
  value: Text;
  private shown = 0;
  private tw?: gsap.core.Tween;
  constructor(
    kind: CurKind,
    public get: () => number,
    w = 190,
  ) {
    super();
    const bg = new Graphics().rect(5, 5, w, 54).fill(CP.ink).rect(0, 0, w, 54).fill(CP.paper).stroke({ width: 3, color: CP.ink, alignment: 1 });
    const ic = curIcon(kind, 34);
    ic.position.set(30, 27);
    this.value = txt('0', { fontFamily: F.poster, fontSize: 32, fill: CP.ink });
    this.value.position.set(56, 6);
    this.addChild(bg, ic, this.value);
    this.shown = get();
    this.value.text = fmt(this.shown);
  }
  refresh() {
    const v = this.get();
    if (Math.abs(v - this.shown) < 0.5) return;
    const up = v > this.shown;
    const o = { v: this.shown };
    this.tw?.kill();
    this.tw = gsap.to(o, {
      v,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => {
        if (!this.value.destroyed) this.value.text = fmt(o.v);
      },
    });
    this.shown = v;
    if (up) gsap.fromTo(this.value.scale, { x: 1.25, y: 1.25 }, { x: 1, y: 1, duration: 0.35, ease: 'back.out(3)' });
  }
  override destroy(o?: Parameters<Container['destroy']>[0]) {
    this.tw?.kill();
    super.destroy(o);
  }
}

// ------------------------------------------------------------------ marquee bulbs
export class Marquee extends Container {
  private bulbs: Graphics[] = [];
  private t = 0;
  mode: 'chase' | 'flash' | 'rainbow' = 'chase';
  speed = 1;
  constructor(
    w: number,
    h: number,
    gap = 34,
    public onColor: number = CP.yellow,
    public offColor: number = 0x5a3a20,
  ) {
    super();
    const pts: [number, number][] = [];
    const nx = Math.max(2, Math.round(w / gap));
    const ny = Math.max(2, Math.round(h / gap));
    for (let i = 0; i < nx; i++) pts.push([(i / nx) * w, 0]);
    for (let i = 0; i < ny; i++) pts.push([w, (i / ny) * h]);
    for (let i = 0; i < nx; i++) pts.push([w - (i / nx) * w, h]);
    for (let i = 0; i < ny; i++) pts.push([0, h - (i / ny) * h]);
    for (const [x, y] of pts) {
      const b = new Graphics().circle(0, 0, 7).fill(0xffffff).stroke({ width: 2.5, color: CP.ink });
      b.position.set(x, y);
      this.addChild(b);
      this.bulbs.push(b);
    }
    Ticker.shared.add(this.tick, this);
  }
  private tick(tk: Ticker) {
    this.t += (tk.deltaMS / 1000) * this.speed;
    const n = this.bulbs.length;
    const step = Math.floor(this.t * 10);
    const rb = [CP.pink, CP.yellow, CP.cyan, CP.green, 0xff6a1a];
    for (let i = 0; i < n; i++) {
      let lit: boolean;
      if (this.mode === 'flash') lit = step % 2 === 0;
      else lit = (i + step) % 3 === 0;
      const col = this.mode === 'rainbow' ? rb[(i + step) % rb.length] : lit ? this.onColor : this.offColor;
      this.bulbs[i].tint = col;
      this.bulbs[i].alpha = this.mode === 'rainbow' || lit ? 1 : 0.85;
    }
  }
  burst(ms = 1600, mode: 'flash' | 'rainbow' = 'rainbow') {
    this.mode = mode;
    this.speed = 2.4;
    window.setTimeout(() => {
      if (this.destroyed) return;
      this.mode = 'chase';
      this.speed = 1;
    }, ms);
  }
  override destroy(o?: Parameters<Container['destroy']>[0]) {
    Ticker.shared.remove(this.tick, this);
    super.destroy(o);
  }
}

// ------------------------------------------------------------------ slot symbols (drawn once → textures)
const SYM_PX = 150;
const symCache = new Map<string, Texture>();
function drawSymbol(sym: Sym, s: number): Container {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  const r = s / 2;
  const INK = { width: Math.max(3, s / 28), color: CP.ink, join: 'round' as const };
  switch (sym) {
    case 'neko': {
      // Le Chat Noir: black cat head on a yellow halo
      g.circle(0, 0, r * 0.92).fill(CP.yellow).stroke(INK);
      g.circle(0, 0, r * 0.74).stroke({ width: 3, color: 0xe0a020 });
      const hy = r * 0.12;
      g.poly([-r * 0.6, hy - r * 0.05, -r * 0.62, hy - r * 0.78, -r * 0.18, hy - r * 0.42]).fill(CP.ink);
      g.poly([r * 0.6, hy - r * 0.05, r * 0.62, hy - r * 0.78, r * 0.18, hy - r * 0.42]).fill(CP.ink);
      g.ellipse(0, hy, r * 0.62, r * 0.5).fill(CP.ink);
      g.poly([-r * 0.52, hy - r * 0.18, -r * 0.5, hy - r * 0.62, -r * 0.3, hy - r * 0.35]).fill(CP.pink);
      g.poly([r * 0.52, hy - r * 0.18, r * 0.5, hy - r * 0.62, r * 0.3, hy - r * 0.35]).fill(CP.pink);
      for (const sx of [-1, 1]) {
        g.ellipse(sx * r * 0.25, hy - r * 0.05, r * 0.15, r * 0.11).fill(CP.yellow);
        g.ellipse(sx * r * 0.25, hy - r * 0.05, r * 0.035, r * 0.1).fill(CP.ink);
        for (let k = -1; k <= 1; k++)
          g.moveTo(sx * r * 0.32, hy + r * 0.2 + k * r * 0.06)
            .lineTo(sx * r * 0.82, hy + r * 0.12 + k * r * 0.12)
            .stroke({ width: 2, color: CP.paper, cap: 'round' });
      }
      g.poly([-r * 0.07, hy + r * 0.12, r * 0.07, hy + r * 0.12, 0, hy + r * 0.2]).fill(CP.pink);
      break;
    }
    case 'wild': {
      g.star(0, 0, 10, r * 0.95, r * 0.62).fill(CP.cyan);
      g.star(4, -3, 10, r * 0.95, r * 0.62).fill({ color: CP.pink, alpha: 0.85 });
      g.star(2, -1, 10, r * 0.9, r * 0.58).fill(CP.yellow).stroke(INK);
      paw(g, 0, -r * 0.08, r * 0.42, CP.ink);
      const t = txt('COMODÍN', { fontFamily: F.poster, fontSize: s * 0.17, fill: CP.paper, stroke: { color: CP.ink, width: 5, join: 'round' } });
      t.anchor.set(0.5);
      t.position.set(0, r * 0.52);
      t.rotation = -0.08;
      c.addChild(t);
      break;
    }
    case 'gema': {
      g.poly([0, -r * 0.88, r * 0.78, -r * 0.2, 0, r * 0.9, -r * 0.78, -r * 0.2]).fill(CP.pink).stroke(INK);
      g.poly([0, -r * 0.88, r * 0.32, -r * 0.2, 0, r * 0.9, -r * 0.32, -r * 0.2]).fill({ color: 0xffffff, alpha: 0.25 });
      g.moveTo(-r * 0.78, -r * 0.2).lineTo(r * 0.78, -r * 0.2).stroke({ width: 2.5, color: CP.ink, alpha: 0.6 });
      g.ellipse(0, r * 0.12, r * 0.3, r * 0.22).fill(CP.yellow).stroke({ width: 2.5, color: CP.ink });
      g.ellipse(0, r * 0.12, r * 0.07, r * 0.2).fill(CP.ink);
      g.circle(-r * 0.3, -r * 0.42, r * 0.07).fill(0xffffff);
      break;
    }
    case 'doblon': {
      g.circle(r * 0.06, r * 0.06, r * 0.8).fill(0xb8862a);
      g.circle(0, 0, r * 0.8).fill(CP.gold).stroke(INK);
      g.circle(0, 0, r * 0.6).stroke({ width: 3, color: 0xb8862a });
      paw(g, 0, r * 0.04, r * 0.36, 0xb8862a);
      g.moveTo(-r * 0.45, -r * 0.5).lineTo(-r * 0.25, -r * 0.62).stroke({ width: 4, color: 0xffffff, cap: 'round', alpha: 0.7 });
      break;
    }
    case 'boleto': {
      const tk = ticketIcon(s * 0.82, CP.pink);
      tk.rotation = -0.18;
      c.addChild(tk);
      const t = txt('1 TIRO', { fontFamily: F.poster, fontSize: s * 0.13, fill: CP.ink });
      t.anchor.set(0.5);
      t.position.set(-s * 0.06, s * 0.3);
      t.rotation = -0.18;
      c.addChild(t);
      break;
    }
    case 'pez': {
      g.ellipse(-r * 0.12, 0, r * 0.62, r * 0.36).fill(0x7fd8ff).stroke(INK);
      g.poly([r * 0.42, 0, r * 0.86, -r * 0.38, r * 0.86, r * 0.38]).fill(0x7fd8ff).stroke(INK);
      g.poly([-r * 0.2, -r * 0.3, 0.05 * r, -r * 0.58, r * 0.15, -r * 0.3]).fill(0x5bb8e8).stroke({ width: 2.5, color: CP.ink });
      g.circle(-r * 0.46, -r * 0.06, r * 0.08).fill(CP.ink);
      g.moveTo(-r * 0.24, -r * 0.24).quadraticCurveTo(-r * 0.1, 0, -r * 0.24, r * 0.24).stroke({ width: 2.5, color: CP.ink });
      for (let i = 0; i < 3; i++) g.circle(-r * 0.02 + i * r * 0.14, r * 0.04 + (i % 2) * r * 0.08, r * 0.035).fill(0xffffff);
      break;
    }
    case 'ovillo': {
      g.circle(0, 0, r * 0.72).fill(CP.red).stroke(INK);
      for (let i = 0; i < 4; i++) {
        const a = -0.9 + i * 0.5;
        g.moveTo(Math.cos(a + Math.PI) * r * 0.7, Math.sin(a + Math.PI) * r * 0.7)
          .quadraticCurveTo(Math.cos(a + Math.PI / 2) * r * 0.25, Math.sin(a + Math.PI / 2) * r * 0.25, Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7)
          .stroke({ width: 3, color: 0xff8fa8 });
      }
      g.moveTo(r * 0.5, r * 0.5).bezierCurveTo(r * 0.9, r * 0.6, r * 0.6, r * 0.95, r * 0.95, r * 0.9).stroke({ width: 4, color: CP.red, cap: 'round' });
      break;
    }
    case 'pata': {
      g.circle(0, 0, r * 0.8).fill(CP.paper).stroke(INK);
      paw(g, 0, r * 0.05, r * 0.55, CP.pink);
      g.circle(0, 0, r * 0.8).stroke({ width: 3, color: CP.ink });
      break;
    }
  }
  return c;
}
export function symbolTexture(sym: Sym): Texture {
  let t = symCache.get(sym);
  if (t && !t.destroyed) return t;
  const wrap = new Container();
  const d = drawSymbol(sym, SYM_PX);
  d.position.set(SYM_PX * 0.55, SYM_PX * 0.55);
  wrap.addChild(d);
  t = game.pixi.renderer.generateTexture({ target: wrap, frame: new Rectangle(0, 0, SYM_PX * 1.1, SYM_PX * 1.1), resolution: 2, antialias: true });
  wrap.destroy({ children: true });
  symCache.set(sym, t);
  return t;
}
export function symbolSprite(sym: Sym, size: number): Sprite {
  const s = new Sprite(symbolTexture(sym));
  s.anchor.set(0.5);
  s.scale.set(size / (SYM_PX * 1.1));
  return s;
}

// ------------------------------------------------------------------ host: Madame Noir (croupier black cat, drawn in code)
export class Host extends Container {
  private eyes: Graphics[] = [];
  private mouth = new Graphics();
  private body = new Container();
  private t = 0;
  private talkUntil = 0;
  private blinkAt = 2;
  private halo = new Graphics();
  constructor(public s = 300) {
    super();
    const r = s / 2;
    this.halo.circle(0, -r * 0.15, r * 0.95).fill(CP.yellow).stroke({ width: 5, color: CP.ink });
    this.halo.circle(0, -r * 0.15, r * 0.78).stroke({ width: 3, color: 0xe0a020 });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      this.halo.moveTo(Math.cos(a) * r * 0.98, -r * 0.15 + Math.sin(a) * r * 0.98).lineTo(Math.cos(a) * r * 1.12, -r * 0.15 + Math.sin(a) * r * 1.12).stroke({ width: 4, color: CP.yellow, cap: 'round' });
    }
    this.addChild(this.halo);
    const g = new Graphics();
    // tail
    g.moveTo(r * 0.45, r * 0.85).bezierCurveTo(r * 1.15, r * 0.7, r * 0.9, r * 0.05, r * 0.6, -r * 0.05).stroke({ width: r * 0.13, color: CP.ink, cap: 'round' });
    // body (sitting, Steinlen silhouette)
    g.moveTo(-r * 0.5, r * 0.95).bezierCurveTo(-r * 0.62, r * 0.35, -r * 0.35, r * 0.1, -r * 0.2, r * 0.05).lineTo(r * 0.2, r * 0.05).bezierCurveTo(r * 0.38, r * 0.12, r * 0.6, r * 0.4, r * 0.5, r * 0.95).closePath().fill(CP.ink);
    // head + ears
    const hy = -r * 0.25;
    g.poly([-r * 0.42, hy - r * 0.05, -r * 0.46, hy - r * 0.62, -r * 0.1, hy - r * 0.32]).fill(CP.ink);
    g.poly([r * 0.42, hy - r * 0.05, r * 0.46, hy - r * 0.62, r * 0.1, hy - r * 0.32]).fill(CP.ink);
    g.ellipse(0, hy, r * 0.45, r * 0.36).fill(CP.ink);
    g.poly([-r * 0.38, hy - r * 0.15, -r * 0.4, hy - r * 0.5, -r * 0.2, hy - r * 0.28]).fill(CP.pink);
    g.poly([r * 0.38, hy - r * 0.15, r * 0.4, hy - r * 0.5, r * 0.2, hy - r * 0.28]).fill(CP.pink);
    // whiskers
    for (const sx of [-1, 1])
      for (let k = -1; k <= 1; k++)
        g.moveTo(sx * r * 0.22, hy + r * 0.12 + k * r * 0.05)
          .lineTo(sx * r * 0.68, hy + r * 0.06 + k * r * 0.1)
          .stroke({ width: 2, color: CP.paper, cap: 'round' });
    g.poly([-r * 0.05, hy + r * 0.07, r * 0.05, hy + r * 0.07, 0, hy + r * 0.13]).fill(CP.pink);
    // bow tie
    g.poly([0, r * 0.1, -r * 0.2, -r * 0.0, -r * 0.2, r * 0.2]).fill(CP.pink).stroke({ width: 3, color: CP.ink });
    g.poly([0, r * 0.1, r * 0.2, -r * 0.0, r * 0.2, r * 0.2]).fill(CP.pink).stroke({ width: 3, color: CP.ink });
    g.circle(0, r * 0.1, r * 0.05).fill(CP.yellow).stroke({ width: 2, color: CP.ink });
    // top hat (tilted)
    const hat = new Graphics();
    hat.rect(-r * 0.26, -r * 0.42, r * 0.52, r * 0.42).fill(CP.ink).stroke({ width: 3, color: CP.paper, alpha: 0.25 });
    hat.rect(-r * 0.26, -r * 0.12, r * 0.52, r * 0.09).fill(CP.pink);
    hat.ellipse(0, 0, r * 0.42, r * 0.07).fill(CP.ink).stroke({ width: 3, color: CP.paper, alpha: 0.25 });
    hat.position.set(r * 0.12, hy - r * 0.36);
    hat.rotation = 0.22;
    this.body.addChild(g, hat);
    for (const sx of [-1, 1]) {
      const e = new Graphics();
      e.ellipse(0, 0, r * 0.11, r * 0.085).fill(CP.yellow);
      e.ellipse(0, 0, r * 0.028, r * 0.078).fill(CP.ink);
      e.position.set(sx * r * 0.18, hy - r * 0.04);
      this.body.addChild(e);
      this.eyes.push(e);
    }
    this.mouth.position.set(0, hy + r * 0.2);
    this.body.addChild(this.mouth);
    this.addChild(this.body);
    this.drawMouth(0);
    Ticker.shared.add(this.tick, this);
  }
  private drawMouth(open: number) {
    const r = this.s / 2;
    this.mouth.clear();
    if (open < 0.15) {
      this.mouth.moveTo(-r * 0.06, 0).quadraticCurveTo(-r * 0.03, r * 0.035, 0, 0).quadraticCurveTo(r * 0.03, r * 0.035, r * 0.06, 0).stroke({ width: 2.5, color: CP.paper, cap: 'round' });
    } else this.mouth.ellipse(0, r * 0.015, r * 0.05, r * 0.03 + open * r * 0.04).fill(CP.pink).stroke({ width: 2, color: CP.paper });
  }
  talk(ms: number) {
    this.talkUntil = this.t + ms / 1000;
  }
  private tick(tk: Ticker) {
    const dt = tk.deltaMS / 1000;
    this.t += dt;
    // breathing on twos
    const k = Math.floor(this.t * 12) / 12;
    this.body.y = Math.sin(k * 2) * 3;
    this.halo.rotation = Math.sin(k * 0.6) * 0.03;
    if (this.t > this.blinkAt) {
      for (const e of this.eyes) e.scale.y = 0.1;
      if (this.t > this.blinkAt + 0.12) {
        for (const e of this.eyes) e.scale.y = 1;
        this.blinkAt = this.t + 2 + Math.random() * 3;
      }
    }
    if (this.t < this.talkUntil) this.drawMouth(Math.abs(Math.sin(k * 14)) * (0.5 + 0.5 * Math.sin(k * 5)));
    else this.drawMouth(0);
  }
  override destroy(o?: Parameters<Container['destroy']>[0]) {
    Ticker.shared.remove(this.tick, this);
    super.destroy(o);
  }
}

// ------------------------------------------------------------------ speech bubble
export class Bubble extends Container {
  private bg = new Graphics();
  private body: Text;
  private who: Text;
  private whoBg = new Graphics();
  private full = '';
  private shown = 0;
  private tw?: gsap.core.Tween;
  constructor(public w = 470) {
    super();
    this.body = txt('', { fontFamily: F.ui, fontWeight: '700', fontSize: 25, fill: CP.ink, wordWrap: true, wordWrapWidth: w - 44, lineHeight: 31 });
    this.body.position.set(22, 26);
    this.who = txt('MADAME NOIR', { fontFamily: F.poster, fontSize: 20, fill: CP.paper, letterSpacing: 1 });
    this.who.position.set(16, -14);
    this.addChild(this.bg, this.whoBg, this.who, this.body);
    this.visible = false;
  }
  say(text: string, who = 'MADAME NOIR', color: number = CP.pink) {
    this.full = text;
    this.who.text = who;
    this.body.text = text;
    const h = Math.max(96, this.body.height + 50);
    this.body.text = '';
    this.bg.clear();
    this.bg.rect(8, 8, this.w, h).fill(CP.ink);
    this.bg.rect(0, 0, this.w, h).fill(CP.paper).stroke({ width: 4, color: CP.ink, alignment: 1 });
    // tail towards the host (right side)
    this.bg.poly([this.w - 4, h * 0.35, this.w + 46, h * 0.22, this.w - 4, h * 0.62]).fill(CP.paper).stroke({ width: 4, color: CP.ink, join: 'round' });
    this.bg.rect(this.w - 8, h * 0.35 + 3, 8, h * 0.27 - 6).fill(CP.paper);
    this.whoBg.clear().rect(8, -22, this.who.width + 18, 30).fill(color).stroke({ width: 3, color: CP.ink });
    this.visible = true;
    this.alpha = 1;
    gsap.killTweensOf(this.scale);
    gsap.fromTo(this.scale, { x: 0.6, y: 0.6 }, { x: 1, y: 1, duration: 0.32, ease: 'back.out(2.6)' });
    this.tw?.kill();
    const o = { n: 0 };
    this.shown = 0;
    this.tw = gsap.to(o, {
      n: text.length,
      duration: Math.min(1.4, 0.02 * text.length),
      ease: 'none',
      onUpdate: () => {
        const n = Math.floor(o.n);
        if (n !== this.shown && !this.body.destroyed) {
          this.shown = n;
          this.body.text = this.full.slice(0, n);
        }
      },
    });
  }
  override destroy(o?: Parameters<Container['destroy']>[0]) {
    this.tw?.kill();
    super.destroy(o);
  }
}

// ------------------------------------------------------------------ live chat feed (streamer vibes; fictional viewers)
export class ChatFeed extends Container {
  private lines: Container[] = [];
  private viewers: Text;
  private dot: Graphics;
  private t = 0;
  constructor(
    public w = 440,
    public h = 380,
  ) {
    super();
    const bg = new Graphics().rect(8, 8, w, h).fill(CP.ink).rect(0, 0, w, h).fill(0x0c060e).stroke({ width: 4, color: CP.ink, alignment: 1 });
    bg.rect(0, 0, w, 48).fill(CP.plum);
    this.addChild(bg, halftone(w, h - 48, CP.pink, 0.05, 14, 1.8));
    (this.children[1] as TilingSprite).y = 48;
    this.dot = new Graphics().circle(0, 0, 8).fill(CP.red);
    this.dot.position.set(22, 24);
    const live = txt('EN VIVO', { fontFamily: F.poster, fontSize: 24, fill: CP.paper });
    live.position.set(38, 9);
    this.viewers = txt('1,204 michis viendo', { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: CP.softPink });
    this.viewers.anchor.set(1, 0);
    this.viewers.position.set(w - 14, 15);
    this.addChild(this.dot, live, this.viewers);
    const mask = new Graphics().rect(0, 50, w, h - 52).fill(0xffffff);
    this.addChild(mask);
    this.box.mask = mask;
    this.addChild(this.box);
    Ticker.shared.add(this.tick, this);
  }
  private box = new Container();
  private tick(tk: Ticker) {
    this.t += tk.deltaMS / 1000;
    this.dot.alpha = Math.floor(this.t * 2) % 2 ? 0.35 : 1;
    if (Math.random() < 0.004) this.viewers.text = `${(1180 + Math.floor(Math.random() * 90)).toLocaleString('en-US')} michis viendo`;
  }
  push(user: string, msg: string, color: number) {
    const c = new Container();
    const u = txt(user, { fontFamily: F.ui, fontWeight: '700', fontSize: 19, fill: color });
    const m = txt(msg, { fontFamily: F.ui, fontWeight: '700', fontSize: 19, fill: CP.paper, wordWrap: true, wordWrapWidth: this.w - 40 - u.width - 10, breakWords: true });
    m.x = u.width + 10;
    c.addChild(u, m);
    c.x = 16;
    const hh = Math.max(u.height, m.height) + 8;
    (c as Container & { hh: number }).hh = hh;
    this.box.addChild(c);
    this.lines.push(c);
    // layout bottom-up
    let y = this.h - 12;
    for (let i = this.lines.length - 1; i >= 0; i--) {
      const l = this.lines[i] as Container & { hh: number };
      y -= l.hh;
      gsap.to(l, { y, duration: 0.18 });
    }
    c.y = this.h - 12 - hh + 20;
    c.alpha = 0;
    gsap.to(c, { alpha: 1, duration: 0.15 });
    while (this.lines.length > 14) this.lines.shift()!.destroy({ children: true });
  }
  override destroy(o?: Parameters<Container['destroy']>[0]) {
    Ticker.shared.remove(this.tick, this);
    super.destroy(o);
  }
}

/** kill tweens on a whole subtree (core/safety covers containers; this also catches text/scale objects) */
export function killDeep(c: Container) {
  gsap.killTweensOf(c);
  gsap.killTweensOf(c.scale);
  gsap.killTweensOf(c.position);
  for (const ch of c.children) killDeep(ch as Container);
}
