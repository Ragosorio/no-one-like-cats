import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { W, H, game } from '../core/App';
import { C, F } from './theme';
import { Panel, txt, poster } from './widgets';
import { sfx } from '../core/audio';
import { scenes } from '../core/scenes';
import { icon, IconKind } from './icons';

/**
 * Poster-style modal: dim backdrop, paper panel, title band, close button.
 * Put content in `body` (coordinates relative to the panel's inner area).
 */
export class Modal extends Container {
  panel: Panel;
  body = new Container();
  private dim: Graphics;
  onClose?: () => void;
  closed = false;
  constructor(
    title: string,
    public w = 1400,
    public h = 820,
    opts: { color?: number; band?: number; bandText?: number; subtitle?: string } = {},
  ) {
    super();
    const v = game.view;
    this.dim = new Graphics().rect(v.x, v.y, v.w, v.h).fill({ color: C.ink, alpha: 0.6 });
    this.dim.eventMode = 'static';
    this.dim.on('pointertap', () => this.close());
    this.panel = new Panel(w, h, { color: opts.color ?? C.paper, offset: 14 });
    this.panel.position.set((W - w) / 2, (H - h) / 2);
    this.panel.eventMode = 'static';
    const band = new Graphics().rect(0, 0, w, 86).fill(opts.band ?? C.ink);
    const t = poster(title.toUpperCase(), 64, opts.bandText ?? C.paper);
    t.position.set(28, 4);
    this.panel.addChild(band, t);
    if (opts.subtitle) {
      const st = txt(opts.subtitle, { fontFamily: F.ui, fontWeight: '700', fontSize: 20, fill: opts.bandText ?? C.paper });
      st.position.set(t.x + t.width + 24, 34);
      this.panel.addChild(st);
    }
    const x = new Container();
    const xb = new Graphics().rect(0, 0, 64, 64).fill(C.pink).stroke({ width: 4, color: C.ink });
    const xt = poster('X', 44, C.ink);
    xt.anchor.set(0.5);
    xt.position.set(32, 32);
    x.addChild(xb, xt);
    x.position.set(w - 76, 11);
    x.eventMode = 'static';
    x.cursor = 'pointer';
    x.on('pointertap', () => this.close());
    this.panel.addChild(x);
    this.body.position.set(28, 108);
    this.panel.addChild(this.body);
    this.addChild(this.dim, this.panel);
  }

  /** phones: the poster grows to fill the screen (same layout, just bigger); centered in the real screen */
  fitToView() {
    const v = game.view;
    const k = Math.max(1, Math.min(0.5 / Math.max(0.01, game.scale), (v.w * 0.97) / (this.w + 20), (v.h * 0.97) / (this.h + 20)));
    this.panel.scale.set(k);
    this.panel.position.set(v.x + (v.w - this.w * k) / 2, v.y + (v.h - this.h * k) / 2);
  }

  open() {
    scenes.overlayLayer.addChild(this);
    this.fitToView();
    sfx('paper');
    this.dim.alpha = 0;
    gsap.to(this.dim, { alpha: 1, duration: 0.2 });
    gsap.from(this.panel, { y: this.panel.y + 60, alpha: 0, duration: 0.28, ease: 'back.out(1.6)' });
    window.addEventListener('keydown', this.esc);
    return this;
  }

  private esc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.close();
  };

  close() {
    if (this.closed) return;
    this.closed = true;
    window.removeEventListener('keydown', this.esc);
    sfx('paper');
    gsap.to(this.panel, { y: this.panel.y + 40, alpha: 0, duration: 0.18 });
    gsap.to(this.dim, {
      alpha: 0,
      duration: 0.2,
      onComplete: () => {
        this.destroy({ children: true });
        this.onClose?.();
      },
    });
  }

  get innerW() {
    return this.w - 56;
  }
  get innerH() {
    return this.h - 130;
  }
}

const toastLayer = () => scenes.fxLayer;
let toastY = 0;

/** Slide-in banner near the top. Non-blocking (T1 feedback). */
export function toast(text: string, o: { icon?: IconKind; color?: number; sub?: string; dur?: number } = {}) {
  const c = new Container();
  const t = txt(text, { fontFamily: F.poster, fontSize: 30, fill: C.ink });
  let x0 = 18;
  if (o.icon) {
    const ic = icon(o.icon, 34);
    ic.position.set(32, 30);
    c.addChild(ic);
    x0 = 58;
  }
  t.position.set(x0, 10);
  let w = x0 + t.width + 22;
  let h = 60;
  if (o.sub) {
    const s = txt(o.sub, { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.ink });
    s.position.set(x0, 46);
    c.addChild(s);
    w = Math.max(w, x0 + s.width + 22);
    h = 76;
  }
  const bg = new Graphics().rect(6, 6, w, h).fill(C.ink).rect(0, 0, w, h).fill(o.color ?? C.yellow).stroke({ width: 4, color: C.ink });
  c.addChildAt(bg, 0);
  c.addChild(t);
  const y = 130 + toastY;
  toastY += h + 14;
  c.position.set(W / 2 - w / 2, y);
  c.rotation = -0.015;
  toastLayer().addChild(c);
  gsap.from(c, { x: c.x + 80, alpha: 0, duration: 0.22, ease: 'back.out(2)' });
  gsap.to(c, {
    alpha: 0,
    y: y - 20,
    delay: o.dur ?? 2.2,
    duration: 0.3,
    onComplete: () => {
      c.destroy({ children: true });
      toastY = Math.max(0, toastY - (h + 14));
    },
  });
}
