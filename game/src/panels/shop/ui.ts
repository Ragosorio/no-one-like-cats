/** Tienda: shared poster pieces (cards, price buttons, stamps, scroller) + purchase juice. */
import { Container, FederatedPointerEvent, FederatedWheelEvent, Graphics, Sprite, Text, TextStyleOptions, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { icon, IconKind } from '../../ui/icons';
import { halftoneTexture, sparkTexture } from '../../art/textures';
import { scenes } from '../../core/scenes';
import { sfx } from '../../core/audio';
import { fmt } from '../../core/format';

export type Cur = 'gold' | 'gems';
export const curIcon = (c: Cur): IconKind => (c === 'gold' ? 'gold' : 'gem');

// ---------------------------------------------------------------- safe teardown
/** kill every tween on a subtree (Pixi nulls transforms on destroy: a live tween would throw) */
export function killTree(node: Container) {
  if (!node || node.destroyed) return;
  const stack: Container[] = [node];
  while (stack.length) {
    const n = stack.pop()!;
    if (n.destroyed) continue;
    gsap.killTweensOf(n);
    gsap.killTweensOf([n.scale, n.position, n.pivot, n.skew]);
    for (const c of n.children) stack.push(c as Container);
  }
}
export function clearTree(c: Container) {
  for (const ch of c.removeChildren()) {
    killTree(ch as Container);
    ch.destroy({ children: true });
  }
}

// ---------------------------------------------------------------- text
export function t(text: string, size: number, fill: number = C.ink, font: string = F.ui, extra: TextStyleOptions = {}): Text {
  return txt(text, { fontFamily: font, fontSize: size, fill, ...(font === F.ui ? { fontWeight: '700' } : {}), ...extra });
}
export function para(text: string, width: number, size = 17, fill: number = C.ink, extra: TextStyleOptions = {}): Text {
  return txt(text, { fontFamily: F.ui, fontSize: size, fill, wordWrap: true, wordWrapWidth: width, lineHeight: Math.round(size * 1.3), ...extra });
}
/** shrink a text to fit a width */
export function fit(tx: Text, w: number) {
  if (tx.width > w) tx.scale.set(w / tx.width);
  return tx;
}

// ---------------------------------------------------------------- blocks
/** poster block: ink offset shadow + flat fill + ink border */
export function block(w: number, h: number, fill: number, off = 8, border = 4): Graphics {
  return new Graphics().rect(off, off, w, h).fill(C.ink).rect(0, 0, w, h).fill(fill).stroke({ width: border, color: C.ink, alignment: 1 });
}
export function halftoneRect(w: number, h: number, color: number, cell = 12, r = 2.6, alpha = 0.35) {
  const s = new TilingSprite({ texture: halftoneTexture(color, cell, r), width: w, height: h });
  s.alpha = alpha;
  return s;
}
/** big accent circle with halftone dots inside (Swiss poster) */
export function dotCircle(r: number, fill: number, dots: number, alpha = 0.45) {
  const c = new Container();
  const g = new Graphics().circle(0, 0, r).fill(fill);
  const ht = halftoneRect(r * 2, r * 2, dots, 11, 2.4, alpha);
  ht.position.set(-r, -r);
  const m = new Graphics().circle(0, 0, r).fill(0xffffff);
  ht.mask = m;
  c.addChild(g, ht, m);
  return c;
}
/** rubber stamp (double border, slight rotation) */
export function stamp(text: string, color: number = C.red, size = 30, rot = -0.1, font: string = F.poster): Container {
  const c = new Container();
  const tx = txt(text, { fontFamily: font, fontSize: size, fill: color, letterSpacing: 2 });
  tx.anchor.set(0.5);
  const w = tx.width + size * 0.9;
  const h = tx.height + size * 0.3;
  const g = new Graphics()
    .roundRect(-w / 2, -h / 2, w, h, 6)
    .stroke({ width: 4, color })
    .roundRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 4)
    .stroke({ width: 2, color });
  c.addChild(g, tx);
  c.rotation = rot;
  return c;
}
/** ¡NUEVO! starburst seal that wobbles */
export function newSeal(size = 46, text = '¡NUEVO!'): Container {
  const c = new Container();
  const g = new Graphics();
  const pts: number[] = [];
  const n = 14;
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const r = i % 2 ? size * 0.78 : size;
    pts.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.poly(pts.map((v, i) => v + 4 * (i % 2 ? 1 : 1))).fill(C.ink);
  g.poly(pts).fill(C.pinkHot).stroke({ width: 3, color: C.ink });
  const tx = txt(text, { fontFamily: F.comic, fontSize: size * 0.42, fill: C.yellow, stroke: { color: C.ink, width: 4 }, letterSpacing: 1 });
  tx.anchor.set(0.5);
  c.addChild(g, tx);
  c.rotation = 0.18;
  gsap.to(c, { rotation: -0.06, duration: 0.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  gsap.to(c.scale, { x: 1.08, y: 1.08, duration: 0.3, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  return c;
}
/** small flat chip */
export function chip(text: string, bg: number, fg: number = C.ink, size = 17, font: string = F.bebas): Container {
  const c = new Container();
  const tx = txt(text, { fontFamily: font, fontSize: size, fill: fg, letterSpacing: 1 });
  tx.position.set(9, 2);
  const g = new Graphics().rect(0, 0, tx.width + 18, tx.height + 4).fill(bg).stroke({ width: 2.5, color: C.ink });
  c.addChild(g, tx);
  return c;
}
/** icon + amount (red if not affordable) */
export function priceTag(cur: Cur, v: number, ok = true, size = 26): Container {
  const c = new Container();
  const ic = icon(curIcon(cur), size + 4);
  ic.position.set((size + 4) / 2, size / 2 + 3);
  const tx = txt(fmt(v), { fontFamily: F.heavy, fontSize: size, fill: ok ? C.ink : C.red });
  tx.position.set(size + 10, 0);
  c.addChild(ic, tx);
  return c;
}

// ---------------------------------------------------------------- buttons
/** set by Scroller when a drag-scroll ends: taps right after a drag are ignored (no accidental buys) */
let dragEndedAt = 0;
export function justDragged() {
  return performance.now() - dragEndedAt < 120;
}
export interface BtnOpts {
  w?: number;
  h?: number;
  color?: number;
  fg?: number;
  size?: number;
  disabled?: boolean;
  /** price shown on the right side of the button */
  price?: { cur: Cur; v: number; ok: boolean };
  sound?: boolean;
}
/** chunky poster button (optionally with a price) */
export class Btn extends Container {
  face = new Container();
  private _dis = false;
  readonly bw: number;
  readonly bh: number;
  constructor(
    label: string,
    private onTap: (b: Btn) => void,
    o: BtnOpts = {},
  ) {
    super();
    const w = (this.bw = o.w ?? 240);
    const h = (this.bh = o.h ?? 64);
    const sh = new Graphics().rect(6, 6, w, h).fill(C.ink);
    const bg = new Graphics().rect(0, 0, w, h).fill(o.color ?? C.pinkHot).stroke({ width: 4, color: C.ink, alignment: 1 });
    this.face.addChild(bg);
    const fg = o.fg ?? C.paper;
    const lt = txt(label, { fontFamily: F.poster, fontSize: o.size ?? 30, fill: fg });
    lt.anchor.set(0.5);
    if (o.price) {
      const pt = priceTag(o.price.cur, o.price.v, o.price.ok, Math.round((o.size ?? 30) * 0.72));
      const pw = pt.width;
      const sep = new Graphics().rect(0, 0, pw + 22, h - 14).fill(C.paper).stroke({ width: 2.5, color: C.ink });
      sep.position.set(w - pw - 30, 7);
      pt.position.set(w - pw - 19, h / 2 - pt.height / 2);
      lt.position.set((w - pw - 30) / 2, h / 2);
      fit(lt, w - pw - 44);
      this.face.addChild(sep, pt, lt);
    } else {
      lt.position.set(w / 2, h / 2);
      fit(lt, w - 20);
      this.face.addChild(lt);
    }
    this.addChild(sh, this.face);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerover', () => {
      if (this._dis) return;
      gsap.to(this.face, { x: -3, y: -3, duration: 0.1 });
      sfx('hover');
    });
    this.on('pointerout', () => gsap.to(this.face, { x: 0, y: 0, duration: 0.12 }));
    this.on('pointerdown', () => !this._dis && gsap.to(this.face, { x: 5, y: 5, duration: 0.05 }));
    this.on('pointerup', () => gsap.to(this.face, { x: -3, y: -3, duration: 0.12, ease: 'back.out(3)' }));
    this.on('pointertap', () => {
      if (justDragged()) return;
      if (this._dis) {
        sfx('error');
        gsap.fromTo(this.face, { x: -7 }, { x: 0, duration: 0.3, ease: 'elastic.out(1,0.3)' });
        return;
      }
      if (o.sound !== false) sfx('click');
      this.onTap(this);
    });
    this.disabled = !!o.disabled;
  }
  set disabled(v: boolean) {
    this._dis = v;
    this.face.alpha = v ? 0.5 : 1;
    this.cursor = v ? 'not-allowed' : 'pointer';
  }
  get disabled() {
    return this._dis;
  }
}

/** hover lift for any card container (keeps baseY) */
export function hoverLift(c: Container, face: Container, onTap?: () => void, sound = true) {
  c.eventMode = 'static';
  c.cursor = onTap ? 'pointer' : 'default';
  c.on('pointerover', () => {
    gsap.to(face, { y: -6, duration: 0.12, ease: 'power2.out' });
    if (onTap && sound) sfx('hover');
  });
  c.on('pointerout', () => gsap.to(face, { y: 0, duration: 0.15 }));
  if (onTap)
    c.on('pointertap', () => {
      sfx('click');
      onTap();
    });
}

/** diagonal glossy sheen sweeping across a w×h area (escaparate shine) */
export function sheen(w: number, h: number, every = 3.2, delay = 0): Container {
  const c = new Container();
  const g = new Graphics().poly([0, 0, 50, 0, 10, h, -40, h]).fill({ color: 0xffffff, alpha: 0.35 }).poly([62, 0, 76, 0, 36, h, 22, h]).fill({ color: 0xffffff, alpha: 0.25 });
  const m = new Graphics().rect(0, 0, w, h).fill(0xffffff);
  g.mask = m;
  g.x = -120;
  c.addChild(g, m);
  gsap.to(g, { x: w + 120, duration: 0.9, ease: 'power2.inOut', repeat: -1, repeatDelay: every, delay });
  return c;
}

// ---------------------------------------------------------------- scroller
/** masked vertical scroller (wheel + drag + bar). Children go in `content`. */
export class Scroller extends Container {
  content = new Container();
  private maskG: Graphics;
  private bar = new Graphics();
  private contentH = 0;
  private drag: { y: number; s: number; moved: number } | null = null;
  scrollY = 0;
  lastMoved = 0;
  constructor(
    public bw: number,
    public bh: number,
  ) {
    super();
    const hit = new Graphics().rect(0, 0, bw, bh).fill({ color: 0xffffff, alpha: 0.001 });
    this.maskG = new Graphics().rect(-12, -12, bw + 24, bh + 12).fill(0xffffff);
    this.addChild(hit, this.content, this.maskG, this.bar);
    this.content.mask = this.maskG;
    this.eventMode = 'static';
    this.on('wheel', (e: FederatedWheelEvent) => this.scrollTo(this.scrollY + e.deltaY * 0.9));
    this.on('pointerdown', (e: FederatedPointerEvent) => {
      this.drag = { y: e.global.y, s: this.scrollY, moved: 0 };
      this.lastMoved = 0;
    });
    const stop = () => {
      if (this.drag) {
        this.lastMoved = this.drag.moved;
        if (this.drag.moved > 8) dragEndedAt = performance.now();
      }
      this.drag = null;
    };
    this.on('pointerup', stop);
    this.on('pointerupoutside', stop);
    this.on('globalpointermove', (e: FederatedPointerEvent) => {
      if (!this.drag) return;
      const dy = (e.global.y - this.drag.y) / (this.worldTransform.d || 1);
      this.drag.moved = Math.max(this.drag.moved, Math.abs(dy));
      if (this.drag.moved > 8) this.scrollTo(this.drag.s - dy, false);
    });
  }
  get wasDrag() {
    return (this.drag?.moved ?? this.lastMoved) > 8;
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
    gsap.killTweensOf(this.content);
    if (animate) gsap.to(this.content, { y: -this.scrollY, duration: 0.25, ease: 'power2.out' });
    else this.content.y = -this.scrollY;
    this.bar.clear();
    if (this.maxScroll <= 0) return;
    const h = Math.max(50, (this.bh * this.bh) / this.contentH);
    const by = (this.scrollY / this.maxScroll) * (this.bh - h);
    this.bar.rect(this.bw + 6, 0, 8, this.bh).fill({ color: C.ink, alpha: 0.12 }).rect(this.bw + 6, by, 8, h).fill(C.ink);
  }
}

// ---------------------------------------------------------------- purchase juice
/** coins (or gems) fly from one global point to another, with a pentatonic coin rattle */
export function flyCoins(cur: Cur, from: { x: number; y: number }, to: { x: number; y: number }, n = 8, onArrive?: () => void) {
  const layer = scenes.fxLayer;
  const a = layer.toLocal(from);
  const b = layer.toLocal(to);
  let arrived = 0;
  for (let i = 0; i < n; i++) {
    const ic = icon(curIcon(cur), 34);
    ic.position.set(a.x + (Math.random() - 0.5) * 30, a.y + (Math.random() - 0.5) * 20);
    ic.scale.set(0);
    layer.addChild(ic);
    const mid = { x: (a.x + b.x) / 2 + (Math.random() - 0.5) * 260, y: Math.min(a.y, b.y) - 90 - Math.random() * 120 };
    const o = { p: 0 };
    const s = { x: ic.x, y: ic.y };
    gsap.to(ic.scale, { x: 1, y: 1, duration: 0.12, delay: i * 0.04, ease: 'back.out(3)' });
    gsap.to(o, {
      p: 1,
      duration: 0.5 + Math.random() * 0.15,
      delay: 0.08 + i * 0.045,
      ease: 'power2.in',
      onUpdate: () => {
        const q = o.p;
        ic.position.set((1 - q) * (1 - q) * s.x + 2 * (1 - q) * q * mid.x + q * q * b.x, (1 - q) * (1 - q) * s.y + 2 * (1 - q) * q * mid.y + q * q * b.y);
        ic.rotation = q * 7;
      },
      onComplete: () => {
        ic.destroy({ children: true });
        arrived++;
        sfx(cur === 'gold' ? 'coin' : 'gem', 1 + arrived * 0.07);
        if (arrived === n) onArrive?.();
      },
    });
  }
}
/** ¡KA-CHING! onomatopoeia + sparkle burst at a global point (fx layer) */
export function kaChing(at: { x: number; y: number }, word = '¡KA-CHING!', color: number = C.yellow) {
  const layer = scenes.fxLayer;
  const p = layer.toLocal(at);
  const c = new Container();
  const mk = (fill: number, dx: number, dy: number, alpha = 1) => {
    const tx = txt(word, { fontFamily: F.comic, fontSize: 92, fill, stroke: { color: C.ink, width: 10, join: 'round' }, letterSpacing: 2 });
    tx.anchor.set(0.5);
    tx.position.set(dx, dy);
    tx.alpha = alpha;
    return tx;
  };
  const ga = mk(C.cyan, -6, 4, 0.85);
  const gb = mk(C.pinkHot, 6, -4, 0.85);
  ga.blendMode = 'multiply';
  gb.blendMode = 'multiply';
  c.addChild(ga, gb, mk(color, 0, 0));
  c.position.set(p.x, p.y);
  c.rotation = -0.12;
  c.scale.set(0.1);
  layer.addChild(c);
  gsap
    .timeline({ onComplete: () => c.destroy({ children: true }) })
    .to(c.scale, { x: 1.15, y: 1.15, duration: 0.12, ease: 'back.out(5)' })
    .to(c.scale, { x: 1, y: 1, duration: 0.15 })
    .to(c, { y: p.y - 40, duration: 0.8 }, 0)
    .to(c, { alpha: 0, duration: 0.25 }, 0.75);
  const tex = sparkTexture();
  for (let i = 0; i < 14; i++) {
    const s = new Sprite(tex);
    s.anchor.set(0.5);
    s.tint = i % 3 ? C.yellow : 0xffffff;
    s.position.set(p.x, p.y);
    s.scale.set(0);
    layer.addChild(s);
    const a = Math.random() * Math.PI * 2;
    const r = 90 + Math.random() * 120;
    const sc = 0.3 + Math.random() * 0.6;
    gsap
      .timeline({ delay: Math.random() * 0.1, onComplete: () => s.destroy() })
      .to(s, { x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, duration: 0.55, ease: 'power3.out' }, 0)
      .to(s.scale, { x: sc, y: sc, duration: 0.2, ease: 'back.out(3)' }, 0)
      .to(s.scale, { x: 0, y: 0, duration: 0.3 }, 0.35);
  }
  sfx('levelup', 1.6);
}
/** slam a stamp onto a container (purchase confirmation) */
export function slamStamp(parent: Container, x: number, y: number, text = '¡COMPRADO!', color: number = C.red, size = 34) {
  const s = stamp(text, color, size, -0.16);
  s.position.set(x, y);
  s.scale.set(2.6);
  s.alpha = 0;
  parent.addChild(s);
  gsap.to(s, { alpha: 0.95, duration: 0.08 });
  gsap.to(s.scale, { x: 1, y: 1, duration: 0.22, ease: 'power4.in', onComplete: () => sfx('hit', 0.8) });
  gsap.to(s, { alpha: 0, duration: 0.35, delay: 1.1, onComplete: () => !s.destroyed && s.destroy({ children: true }) });
  return s;
}
/** little receipt that prints out of a point (KA-CHING register) */
export function receipt(parent: Container, x: number, y: number, n: number, item: string, cur: Cur, v: number) {
  const c = new Container();
  const w = 190;
  const lines = [`TICKET #${String(n).padStart(4, '0')}`, item.toUpperCase().slice(0, 20), `TOTAL  ${fmt(v)}`, '¡GRACIAS, MIAU!'];
  const g = new Graphics();
  const h = 18 + lines.length * 20;
  const zig: number[] = [0, 0, w, 0, w, h];
  for (let xx = w; xx >= 0; xx -= 10) zig.push(xx, h + (((w - xx) / 10) % 2 ? 6 : 0));
  g.poly(zig).fill(0xfffdf6).stroke({ width: 2, color: C.ink });
  c.addChild(g);
  lines.forEach((l, i) => {
    const tx = txt(l, { fontFamily: i === 1 ? F.bebas : 'monospace', fontSize: i === 1 ? 18 : 13, fill: C.ink, fontWeight: i === 2 ? '700' : '400' });
    tx.position.set(12, 8 + i * 20);
    c.addChild(tx);
  });
  const ic = icon(curIcon(cur), 16);
  ic.position.set(w - 20, 8 + 2 * 20 + 9);
  c.addChild(ic);
  const m = new Graphics().rect(-4, 0, w + 8, h + 12).fill(0xffffff);
  c.mask = m;
  m.position.set(x, y);
  c.position.set(x, y - h - 10);
  parent.addChild(m, c);
  sfx('tick');
  gsap.to(c, { y, duration: 0.5, ease: 'steps(6)' });
  gsap.to([c, m], {
    alpha: 0,
    duration: 0.3,
    delay: 1.8,
    onComplete: () => {
      if (!c.destroyed) c.destroy({ children: true });
      if (!m.destroyed) m.destroy();
    },
  });
}
