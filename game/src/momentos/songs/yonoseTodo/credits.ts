/**
 * YONOSE TODO — the Parte II credits as watercolor storyboard pages riding the climax (data: ui/story/creditsParteII.ts
 * creditsData; the six songs credited to their composer, the cast, every Parte II cat — «???» until met —, the night's
 * numbers, thanks and links). Each page is a pale wash card on the right of the frame (the island stays in view on the
 * left); it drops in on its bar, bounces with the kicks and drifts up when the next one comes. The cards go through
 * the WASH filter: granulation, pooled edges, ragged borders.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { Kit } from '../../anime/kit';
import type { CreditsData } from '../../../ui/story/creditsParteII';
import { WashFilter } from './paper';
import { box } from './pencil';
import { buildPanel, vignetteOf } from './dream';
import { HAND, POSTER, SANS, SERIF } from './ui';
import { BAR, BEAT, CREDITS, SEC } from './times';

const INK = 0x2a2530;
const SOFT = 0x6a6258;

interface Page {
  t0: number;
  t1: number;
  root: Container;
  card: Graphics;
  accent: number;
  w: number;
  h: number;
}

/** a few watercolor tints for the cast's swatches */
const SWATCH = [0xe0866a, 0x7fa6c9, 0xd8b45a, 0x8fbf8a, 0xc89ad8, 0xf0a77e, 0x6fb8b0, 0xe8a0b8];

export class CreditsRoll {
  readonly root = new Container();
  private pages: Page[] = [];
  private wash: WashFilter;
  constructor(
    private k: Kit,
    d: CreditsData,
  ) {
    this.wash = new WashFilter(3.7, 0.9);
    this.root.filters = [this.wash];
    const T = CREDITS;
    const end = SEC.fadeTail - BEAT;
    // ---- title
    this.page(T.title, T.creator, 0xf2b880, 980, 440, (c) => {
      this.line(c, d.title, POSTER, 92, INK, 0, -90, 6);
      this.line(c, d.subtitle, SANS, 30, INK, 0, 22, 4, '700');
      this.line(c, d.waves, SANS, 18, SOFT, 0, 82, 3, '700', 760);
    });
    // ---- the creator
    this.page(T.creator, T.songs, 0x9cc3e6, 820, 420, (c) => {
      this.line(c, 'UN JUEGO DE', SANS, 26, SOFT, 0, -110, 6, '700');
      this.line(c, d.creator.toUpperCase(), POSTER, 130, INK, 0, -20, 10);
      this.line(c, 'Idea, historia, gatos y código. Hecho con todo el corazón.', SERIF, 28, INK, 0, 96, 0, 'italic', 700);
    });
    // ---- the six songs
    this.page(T.songs, T.cast, 0xe8a0b8, 1000, 640, (c) => {
      this.line(c, 'MÚSICA ORIGINAL', SANS, 28, SOFT, 0, -270, 6, '700');
      d.songs.forEach((s, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = -430 + col * 450;
        const y = -170 + row * 150;
        const p = buildPanel(vignetteOf(s.id), 120, 82);
        p.grey.visible = false;
        p.root.position.set(x + 60, y + 40);
        c.addChild(p.root);
        const tt = this.k.text.sprite(s.title, { fontFamily: POSTER, fontSize: 38, fill: INK, letterSpacing: 2 }, 0);
        if (tt.width > 250) tt.scale.set(250 / tt.width);
        tt.position.set(x + 140, y + 6);
        const by = this.k.text.sprite(`de ${s.composer}`, { fontFamily: HAND, fontSize: 26, fill: SOFT }, 0);
        by.position.set(x + 142, y + 54);
        c.addChild(tt, by);
      });
    });
    // ---- the cast
    this.page(T.cast, T.cats, 0xa8d0a0, 900, 470, (c) => {
      this.line(c, 'REPARTO', SANS, 28, SOFT, 0, -170, 6, '700');
      d.leads.forEach((l, i) => this.line(c, l, SERIF, 34, INK, 0, -90 + i * 74, 0, 'italic', 820));
    });
    // ---- every Parte II cat
    this.page(T.cats, T.stats, 0xd8b45a, 940, 760, (c) => {
      this.line(c, 'LOS GATOS DE LA PARTE II', SANS, 26, SOFT, 0, -342, 5, '700');
      const cols = 4;
      d.cast.forEach((cat, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = -420 + col * 220;
        const y = -280 + row * 70;
        const sw = new Graphics().ellipse(x + 14, y + 16, 15, 12).fill(cat.known ? SWATCH[i % SWATCH.length] : 0xc8c4bc);
        const nm = this.k.text.sprite(cat.name, { fontFamily: cat.known ? SANS : HAND, fontWeight: '700', fontSize: cat.known ? 21 : 24, fill: cat.known ? INK : SOFT }, 0);
        nm.position.set(x + 38, y + 2);
        if (nm.width > 172) nm.scale.set(172 / nm.width);
        c.addChild(sw, nm);
      });
    });
    // ---- the night's numbers
    this.page(T.stats, T.thanks, 0x9cc3e6, 900, 470, (c) => {
      this.line(c, 'EL DIARIO DEL MAR · EDICIÓN NOCTURNA', SANS, 24, SOFT, 0, -180, 4, '700');
      d.stats.forEach((s, i) => this.line(c, s, SERIF, 30, INK, 0, -100 + i * 78, 0, i === 3 ? 'italic' : 'normal', 820));
    });
    // ---- thanks + links
    this.page(T.thanks, T.dawn, 0xf2b880, 900, 560, (c) => {
      this.line(c, 'GRACIAS', POSTER, 80, INK, 0, -210, 8);
      d.thanks.forEach((s, i) => this.line(c, s, SERIF, 30, INK, 0, -110 + i * 60, 0, 'italic', 820));
      d.links.forEach((l, i) => this.line(c, l.text, SANS, 22, SOFT, 0, 110 + i * 46, 2, '700', 820));
    });
    void end;
  }

  private page(t0: number, t1: number, accent: number, w: number, h: number, fill: (c: Container) => void) {
    const root = new Container();
    const card = new Graphics();
    card.roundRect(-w / 2, -h / 2, w, h, 26).fill({ color: accent, alpha: 0.42 });
    card.roundRect(-w / 2 + 26, -h / 2 + 22, w - 52, h - 44, 18).fill({ color: 0xfbf3e2, alpha: 0.78 });
    box(card, -w / 2 + 14, -h / 2 + 10, w - 28, h - 20, { seed: Math.round(t0), width: 2, alpha: 0.4, over: 10 });
    root.addChild(card);
    const inner = new Container();
    fill(inner);
    root.addChild(inner);
    root.visible = false;
    this.root.addChild(root);
    this.pages.push({ t0, t1, root, card, accent, w, h });
  }

  private line(c: Container, text: string, font: string, size: number, fill: number, x: number, y: number, ls = 0, weight: string = 'normal', wrap = 0) {
    const style = {
      fontFamily: font,
      fontSize: size,
      fill,
      letterSpacing: ls,
      ...(weight === 'italic' ? { fontStyle: 'italic' as const } : weight === '700' ? { fontWeight: '700' as const } : {}),
      ...(wrap ? { wordWrap: true, wordWrapWidth: wrap, align: 'center' as const } : {}),
    };
    const s: Sprite = this.k.text.sprite(text, style, 0.5);
    s.position.set(x, y);
    c.addChild(s);
    return s;
  }

  /** the page on screen now (its card's top-left corner is the 'credit' anchor) */
  active: Page | null = null;
  update(t: number, kick: number, bass: number) {
    const { x, y, w, h } = this.k.view;
    const cx = x + w - 40 - Math.min(520, w * 0.27);
    const cy = y + h / 2 + 10;
    this.active = null;
    let any = false;
    for (const p of this.pages) {
      const on = t >= p.t0 - 0.2 && t < p.t1 + 0.6;
      p.root.visible = on;
      if (!on) continue;
      any = true;
      const a = Math.min(1, (t - p.t0 + 0.2) / 0.45);
      const out = Math.max(0, (t - p.t1) / 0.6);
      const drop = (1 - Math.min(1, (t - p.t0 + 0.2) / 0.5)) ** 3;
      p.root.alpha = Math.max(0, a * (1 - out));
      p.root.position.set(cx, cy + drop * 160 - out * 120 - kick * 8);
      p.root.rotation = -0.025 + Math.sin(t * 0.7 + p.t0) * 0.008;
      p.root.scale.set(Math.min(1, (h - 120) / p.h) * (1 + bass * 0.01));
      if (t < p.t1) this.active = p;
    }
    this.root.visible = any;
    const u = this.wash.u;
    u.uPx = this.k.renderer.resolution * (this.k.renderer.screen.width / Math.max(1, w));
    void BAR;
  }
  /** the corner of the page now (screen) */
  corner(): [number, number] | null {
    const p = this.active;
    if (!p) return null;
    const s = p.root.scale.x;
    return [p.root.x - (p.w / 2 - 70) * s, p.root.y - (p.h / 2 - 50) * s];
  }
  destroy() {
    this.wash.destroy();
  }
}
