/** Small UI pieces shared by the collection panels (scroll box, chips, odometer, glitch text). */
import { Container, FederatedPointerEvent, FederatedWheelEvent, Graphics, Text, TextStyleOptions, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { sfx } from '../../core/audio';
import { elColor, elEmoji } from '../../state/ext/collection';
import type { Modal } from '../../ui/modal';

/**
 * Kill every GSAP tween targeting this node or its descendants (and their scale/position/
 * pivot/skew/filters). A tween left running on a destroyed Pixi object throws on every tick
 * and freezes ALL gsap animations in the game, so always call this before destroying.
 */
export function killTree(node: Container) {
  if (!node || node.destroyed) return;
  const stack: Container[] = [node];
  // x/y/width/height on a destroyed Container throw (its _position is nulled); infinite
  // loops would leak. Finite tweens on scale/alpha/filters finish harmlessly (and let
  // fx helpers like speedLines run their own cleanup in onComplete).
  const deadly = (t: gsap.core.Tween) => {
    const v = t.vars as Record<string, unknown>;
    return 'x' in v || 'y' in v || 'width' in v || 'height' in v || (typeof v.repeat === 'number' && v.repeat < 0);
  };
  const loops = (t: gsap.core.Tween) => typeof t.vars.repeat === 'number' && t.vars.repeat < 0;
  while (stack.length) {
    const n = stack.pop()!;
    if (n.destroyed) continue;
    for (const t of gsap.getTweensOf(n)) if (deadly(t)) t.kill();
    for (const t of gsap.getTweensOf([n.scale, n.pivot, n.skew])) if (loops(t)) t.kill();
    gsap.killTweensOf(n.position);
    const f = n.filters;
    if (f) for (const x of Array.isArray(f) ? f : [f]) for (const t of gsap.getTweensOf(x)) if (loops(t)) t.kill();
    for (const c of n.children) stack.push(c as Container);
  }
}
/** destroy all children safely */
export function clearChildren(c: Container) {
  for (const ch of c.removeChildren()) {
    killTree(ch as Container);
    ch.destroy({ children: true });
  }
}
/** destroy a node safely */
export function destroyTree(c: Container | null | undefined) {
  if (!c || c.destroyed) return;
  killTree(c);
  c.destroy({ children: true });
}
/** make Modal.close() kill our tweens first (Modal destroys its panel after fading) */
export function guardModal(m: Modal, extra?: () => void) {
  const orig = m.close.bind(m);
  m.close = () => {
    if (m.closed) return;
    extra?.();
    killTree(m.body);
    for (const ch of m.panel.children) if (ch !== m.body) killTree(ch as Container);
    orig();
  };
}

/** Masked vertical scroller: wheel + drag + thin scrollbar. Put children in `content`. */
export class ScrollBox extends Container {
  content = new Container();
  private maskG: Graphics;
  private bar: Graphics;
  private contentH = 0;
  private y0 = 0;
  private dragging = false;
  private dragStartY = 0;
  private dragStartScroll = 0;
  private moved = 0;
  scrollY = 0;
  constructor(
    public bw: number,
    public bh: number,
    public barColor: number = C.ink,
  ) {
    super();
    const hit = new Graphics().rect(0, 0, bw, bh).fill({ color: 0xffffff, alpha: 0.001 });
    this.maskG = new Graphics().rect(0, 0, bw, bh).fill(0xffffff);
    this.bar = new Graphics();
    this.addChild(hit, this.content, this.maskG, this.bar);
    this.content.mask = this.maskG;
    this.eventMode = 'static';
    this.on('wheel', (e: FederatedWheelEvent) => {
      this.scrollTo(this.scrollY + e.deltaY * 0.9);
    });
    this.on('pointerdown', (e: FederatedPointerEvent) => {
      this.dragging = true;
      this.moved = 0;
      this.dragStartY = e.global.y;
      this.dragStartScroll = this.scrollY;
    });
    const stop = () => (this.dragging = false);
    this.on('pointerup', stop);
    this.on('pointerupoutside', stop);
    this.on('globalpointermove', (e: FederatedPointerEvent) => {
      if (!this.dragging) return;
      const dy = (e.global.y - this.dragStartY) / (this.worldTransform.d || 1);
      this.moved = Math.max(this.moved, Math.abs(dy));
      if (this.moved > 6) this.scrollTo(this.dragStartScroll - dy, false);
    });
  }
  /** true if the last pointer gesture was a drag (use to ignore taps) */
  get wasDrag() {
    return this.moved > 6;
  }
  setContentHeight(h: number) {
    this.contentH = h;
    this.scrollTo(this.scrollY, false);
  }
  get maxScroll() {
    return Math.max(0, this.contentH - this.bh);
  }
  scrollTo(y: number, animate = true) {
    this.scrollY = Math.max(0, Math.min(this.maxScroll, y));
    if (animate) gsap.to(this.content, { y: this.y0 - this.scrollY, duration: 0.25, ease: 'power2.out', overwrite: true });
    else {
      gsap.killTweensOf(this.content);
      this.content.y = this.y0 - this.scrollY;
    }
    this.drawBar();
  }
  private drawBar() {
    this.bar.clear();
    if (this.maxScroll <= 0) return;
    const h = Math.max(40, (this.bh * this.bh) / this.contentH);
    const y = (this.scrollY / this.maxScroll) * (this.bh - h);
    this.bar.roundRect(this.bw - 7, y, 6, h, 3).fill({ color: this.barColor, alpha: 0.65 });
  }
}

/** flat label chip */
export function chip(text: string, o: { bg?: number; fg?: number; size?: number; font?: string; pad?: number; border?: number | null } = {}) {
  const c = new Container();
  const t = txt(text, { fontFamily: o.font ?? F.ui, fontWeight: '700', fontSize: o.size ?? 16, fill: o.fg ?? C.paper, letterSpacing: 1 });
  const pad = o.pad ?? 8;
  const g = new Graphics().rect(0, 0, t.width + pad * 2, t.height + 4).fill(o.bg ?? C.ink);
  if (o.border !== null) g.stroke({ width: 2, color: o.border ?? C.ink });
  t.position.set(pad, 2);
  c.addChild(g, t);
  return c;
}

/** element disc with emoji */
export function elBadge(el: string, r = 22) {
  const c = new Container();
  const g = new Graphics().circle(0, 0, r).fill(elColor(el)).stroke({ width: Math.max(2, r * 0.14), color: C.ink });
  const t = txt(elEmoji(el), { fontSize: r * 1.1 });
  t.anchor.set(0.5);
  t.y = 1;
  c.addChild(g, t);
  return c;
}

/** Text with CMY misregistered ghosts that jitter on twos (for "???") */
export class GlitchText extends Container {
  private ghosts: Text[] = [];
  private main: Text;
  private acc = 0;
  constructor(text: string, style: TextStyleOptions, public amp = 3) {
    super();
    const a = txt(text, { ...style, fill: C.cyan });
    const b = txt(text, { ...style, fill: C.pinkHot });
    this.main = txt(text, style);
    for (const t of [a, b, this.main]) t.anchor.set(0.5);
    a.alpha = 0.8;
    b.alpha = 0.8;
    this.ghosts = [a, b];
    this.addChild(a, b, this.main);
    Ticker.shared.add(this.tick, this);
  }
  private tick(t: Ticker) {
    this.acc += t.deltaMS;
    if (this.acc < 1000 / 12) return;
    this.acc = 0;
    const burst = Math.random() < 0.12 ? 3 : 1;
    this.ghosts[0].position.set(-this.amp * burst * Math.random(), (Math.random() - 0.5) * this.amp);
    this.ghosts[1].position.set(this.amp * burst * Math.random(), (Math.random() - 0.5) * this.amp);
    this.main.x = Math.random() < 0.08 ? (Math.random() - 0.5) * this.amp * 2 : 0;
  }
  override destroy(o?: Parameters<Container['destroy']>[0]) {
    Ticker.shared.remove(this.tick, this);
    super.destroy(o ?? { children: true });
  }
}

/** Per-digit rolling odometer (storyboard g). */
export class Odometer extends Container {
  private cols: Container[] = [];
  private style: TextStyleOptions;
  private digitH: number;
  private digitW: number;
  constructor(style: TextStyleOptions) {
    super();
    this.style = style;
    const probe = txt('0', style);
    this.digitH = probe.height;
    this.digitW = probe.width;
    probe.destroy();
  }
  /** set text (digits roll, other characters are static) */
  set(from: string, to: string, stagger = 0.05, dur = 0.6) {
    this.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.cols = [];
    const len = Math.max(from.length, to.length);
    const f = from.padStart(len, ' ');
    const t = to.padStart(len, ' ');
    let x = 0;
    for (let i = 0; i < len; i++) {
      const ch = t[i];
      const col = new Container();
      col.x = x;
      if (/\d/.test(ch)) {
        const start = /\d/.test(f[i]) ? Number(f[i]) : 0;
        const end = Number(ch);
        const strip = new Container();
        const steps = end >= start ? end - start : end + 10 - start;
        const loops = steps + (i < len - 1 ? 10 : 0);
        for (let k = 0; k <= loops; k++) {
          const d = txt(String((start + k) % 10), this.style);
          d.y = k * this.digitH;
          strip.addChild(d);
        }
        const m = new Graphics().rect(-2, 0, this.digitW + 4, this.digitH).fill(0xffffff);
        col.addChild(strip, m);
        strip.mask = m;
        gsap.to(strip, { y: -loops * this.digitH, duration: dur + i * 0.02, delay: i * stagger, ease: 'power3.out' });
        x += this.digitW;
      } else {
        const d = txt(ch === ' ' ? '' : ch, this.style);
        col.addChild(d);
        x += ch === ' ' ? 0 : d.width;
      }
      this.addChild(col);
      this.cols.push(col);
    }
  }
}

/** Tab label with underline */
export class Tab extends Container {
  private line: Graphics;
  private cap: Text;
  constructor(text: string, onTap: () => void, public activeColor: number = C.pinkHot, public fg: number = C.ink, size = 40) {
    super();
    this.cap = txt(text, { fontFamily: F.poster, fontSize: size, fill: fg });
    this.line = new Graphics().rect(0, 0, this.cap.width, 8).fill(activeColor);
    this.line.y = this.cap.height + 2;
    this.addChild(this.line, this.cap);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointertap', () => {
      sfx('click');
      onTap();
    });
    this.on('pointerover', () => (this.cap.alpha = 0.7));
    this.on('pointerout', () => (this.cap.alpha = 1));
  }
  set active(v: boolean) {
    this.line.visible = v;
    gsap.to(this.line.scale, { x: v ? 1 : 0, duration: 0.2 });
  }
}

/** Generic clickable wrapper with hover lift */
export function clickable(c: Container, onTap: () => void, o: { lift?: number; sound?: boolean } = {}) {
  c.eventMode = 'static';
  c.cursor = 'pointer';
  const lift = o.lift ?? 4;
  c.on('pointerover', () => gsap.to(c.pivot, { y: lift, duration: 0.12 }));
  c.on('pointerout', () => gsap.to(c.pivot, { y: 0, duration: 0.15 }));
  c.on('pointertap', () => {
    if (o.sound !== false) sfx('click');
    onTap();
  });
  return c;
}
