/**
 * ACTO II — the Bitácora page: LO QUE ARRIESGAMOS in HER handwriting (pen-blue Permanent Marker, a pencil whose tip
 * glows faintly blue: her light) — and NEVER her name (TEMPERATURA v3 §11.5: «LO QUE ARRIESGAMOS sin anotarse ella»).
 *
 * The page is always the same notebook (blue rules, red margin, tape, the gordo's face doodled in the corner), but each
 * film brings it in its own way: it COVERS a comic page like a panel slapped on top, rises over a newspaper, slides in
 * as an anime episode card, unrolls over the ukiyo-e scroll.
 */
import { Container, Graphics, Sprite, type TextStyleOptions } from 'pixi.js';
import { CanvasTextMetrics, TextStyle } from 'pixi.js';
import type { SceneCtx } from '../../../stage';
import { word, wordM } from './ink';
import { castTex } from './cast';
import { clamp01, outBack, sm } from './t';

export const NB = { paper: 0xf3ead2, rule: 0x9db8d9, margin: 0xd9786e, pencil: 0x55535e, pen: 0x2c3e6b, tape: 0xe9e0b8 } as const;
export type BitacoraEnter = 'rise' | 'slap' | 'slide' | 'unroll';
export interface BitacoraOpts {
  header?: string;
  w?: number;
  size?: number;
  /** the page's resting centre-top (design y of its top edge) */
  top?: number;
  x?: number;
  /** seconds the writing takes (default by length) */
  write?: number;
  enter?: BitacoraEnter;
  tilt?: number;
  /** paper tint (washi, newsprint…) */
  paper?: number;
  /** a band on top (an anime episode card) */
  band?: { text: string; color: number; ink?: number };
}
const lines = (text: string, style: TextStyleOptions) => CanvasTextMetrics.measureText(text, new TextStyle(style)).lines;

export class Bitacora extends Container {
  private page = new Container();
  private texts: Container[] = [];
  private widths: number[] = [];
  private wmask = new Graphics();
  private pencil = new Graphics();
  private glow: Sprite;
  readonly dur: number;
  readonly W: number;
  readonly H: number;
  private top: number;
  constructor(
    ctx: SceneCtx,
    text: string,
    private o: BitacoraOpts = {},
  ) {
    super();
    const k = ctx.k;
    const W = (this.W = o.w ?? 1180);
    const size = o.size ?? 50;
    const style: TextStyleOptions = { fontFamily: 'Permanent Marker', fontSize: size, fill: NB.pen, wordWrap: true, wordWrapWidth: W - 230, lineHeight: size * 1.25 };
    const ls = lines(text, style);
    const band = o.band ? 74 : 0;
    const H = (this.H = band + 150 + ls.length * size * 1.25 + 70);
    this.top = o.top ?? 1080 - H - 40;
    const g = new Graphics();
    g.roundRect(-W / 2 + 12, 16, W, H, 10).fill({ color: 0x000000, alpha: 0.4 });
    g.roundRect(-W / 2, 0, W, H, 8).fill(o.paper ?? NB.paper);
    for (let y = band + 120; y < H - 20; y += size * 1.25) g.rect(-W / 2 + 20, y + size * 0.95, W - 40, 2).fill({ color: NB.rule, alpha: 0.8 });
    g.rect(-W / 2 + 120, band, 3, H - band).fill({ color: NB.margin, alpha: 0.85 });
    g.circle(W / 2 - 150, H - 40, 58).stroke({ width: 6, color: 0x9a6a3a, alpha: 0.16 });
    this.page.addChild(g);
    if (o.band) {
      const b = new Graphics().roundRect(-W / 2, 0, W, band, 8).fill(o.band.color).rect(-W / 2, band - 10, W, 10).fill(o.band.color);
      const bt = word(k, o.band.text, { fontFamily: 'Bangers', fontSize: 50, fill: o.band.ink ?? 0xffffff, letterSpacing: 6, stroke: { color: 0x0d0a14, width: 6, join: 'round' } });
      bt.position.set(0, band / 2 + 2);
      this.page.addChild(b, bt);
    }
    for (const [x, rot] of [
      [-W / 2 + 70, -0.12],
      [W / 2 - 80, 0.1],
    ] as const) {
      const t = new Graphics().rect(-70, -22, 140, 44).fill({ color: NB.tape, alpha: 0.78 });
      t.position.set(x, band + 4);
      t.rotation = rot;
      this.page.addChild(t);
    }
    // the gordo's face doodled in the corner (no names, ever)
    const d = new Graphics();
    const dx = W / 2 - 120;
    const dy = band + 72;
    d.circle(dx, dy, 30).stroke({ width: 3, color: NB.pen });
    d.poly([dx - 26, dy - 16, dx - 22, dy - 44, dx - 6, dy - 26]).stroke({ width: 3, color: NB.pen, join: 'round' });
    d.poly([dx + 26, dy - 16, dx + 22, dy - 44, dx + 6, dy - 26]).stroke({ width: 3, color: NB.pen, join: 'round' });
    d.circle(dx - 10, dy - 4, 3).fill(NB.pen).circle(dx + 10, dy - 4, 3).fill(NB.pen);
    d.moveTo(dx - 26, dy + 24).quadraticCurveTo(dx, dy + 36, dx + 26, dy + 24).stroke({ width: 7, color: 0xd9786e });
    this.page.addChild(d);
    const header = word(k, o.header ?? 'LO QUE ARRIESGAMOS:', { fontFamily: 'Permanent Marker', fontSize: 34, fill: NB.pencil, letterSpacing: 2 }, 0);
    header.anchor.set(0, 0.5);
    header.position.set(-W / 2 + 150, band + 66);
    this.page.addChild(header);
    const body = new Container();
    ls.forEach((line, i) => {
      const sp = wordM(k, line, { ...style, wordWrap: false }, 0);
      sp.position.set(-W / 2 + 150, band + 120 + i * size * 1.25);
      body.addChild(sp);
      this.texts.push(sp);
      this.widths.push(sp.width);
    });
    body.mask = this.wmask;
    this.page.addChild(body, this.wmask);
    this.glow = new Sprite(castTex(ctx, 'glow'));
    this.glow.anchor.set(0.5);
    this.glow.tint = 0x58d0ff;
    this.glow.blendMode = 'add';
    this.glow.scale.set(0.9);
    this.page.addChild(this.glow, this.pencil);
    this.addChild(this.page);
    this.dur = o.write ?? Math.max(1.6, Math.min(3.4, text.length / 22));
  }
  /** t = seconds since the page started coming in (enter 0.45 s, then the writing over `dur`) */
  update(t: number, rm = false) {
    const p = clamp01(t / 0.45);
    const x0 = this.o.x ?? 960;
    const tilt = this.o.tilt ?? -0.015;
    this.page.visible = t >= 0;
    if (t < 0) return;
    const how = rm ? 'fade' : (this.o.enter ?? 'rise');
    this.page.rotation = tilt;
    this.page.alpha = 1;
    this.page.scale.set(1);
    if (how === 'fade') {
      this.page.position.set(x0, this.top);
      this.page.alpha = sm(p);
    } else if (how === 'rise') {
      this.page.position.set(x0, this.top + (1 - sm(p)) * (this.H + 200));
    } else if (how === 'slap') {
      // slapped on the page like a panel: from big and tilted, lands with a squash
      const s = 1 + (1 - outBack(p, 1.8)) * 0.5;
      this.page.position.set(x0, this.top);
      this.page.scale.set(s);
      this.page.rotation = tilt + (1 - p) * 0.18;
      this.page.alpha = Math.min(1, p * 3);
    } else if (how === 'slide') {
      this.page.position.set(x0 + (1 - outBack(p, 1.4)) * 1500, this.top);
    } else {
      // unroll: the page grows down from its top edge
      this.page.position.set(x0, this.top);
      this.page.scale.set(1, Math.max(0.02, sm(p)));
    }
    const wp = clamp01((t - 0.5) / this.dur);
    const total = this.widths.reduce((a, b) => a + b, 0) || 1;
    let left = wp * total;
    const band = this.o.band ? 74 : 0;
    const m = this.wmask.clear();
    let head: [number, number] = [-this.W / 2 + 150, band + 120];
    m.rect(-this.W / 2, 0, this.W, band + 112).fill(0xffffff);
    this.texts.forEach((sp, i) => {
      const w = Math.min(this.widths[i], Math.max(0, left));
      left -= this.widths[i];
      if (w > 0) {
        m.rect(sp.x - 6, sp.y - 8, w + 8, sp.height + 16).fill(0xffffff);
        head = [sp.x + w, sp.y + sp.height * 0.7];
      }
    });
    const pc = this.pencil.clear();
    const writing = wp > 0 && wp < 1;
    const wig = writing && !rm ? Math.sin(t * 40) * 4 : 0;
    const px = head[0] + 8;
    const py = head[1] - 6 + wig;
    pc.poly([px, py, px + 16, py - 34, px + 128, py - 164, px + 112, py - 176, px, py]).fill(0xe8b84a).stroke({ width: 3, color: 0x3a2a14 });
    pc.poly([px, py, px + 16, py - 34, px + 4, py - 30]).fill(0x3a2a14);
    pc.rect(px + 110, py - 182, 20, 18).fill(0xd9786e);
    pc.alpha = sm((t - 0.3) / 0.3) * (wp >= 1 ? 1 - sm((t - 0.5 - this.dur) / 0.6) : 1);
    this.glow.position.set(px, py);
    this.glow.alpha = pc.alpha * (writing ? 0.35 : 0.15);
  }
}
