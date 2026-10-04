/**
 * Comic speech bubbles for island chatter. Origin (0,0) = tail tip (put it on the cat's head).
 *  - 'say'    white ink bubble with halftone shading (the hot take)
 *  - 'retract' yellow caption box, slightly crooked, with a sweat drop (the walk-back)
 *  - 'shout'  spiky starburst with Bangers lettering (a second cat reacting)
 */
import { Container, Graphics, Text } from 'pixi.js';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';

export type BubbleKind = 'say' | 'retract' | 'shout';

const INK = C.ink;

export class ChatBubble extends Container {
  readonly body = new Container();
  private txtLabel: Text;
  private full: string;
  private shown = 0;
  /** chars per second for the typewriter */
  cps = 46;
  w = 0;
  h = 0;
  private tw = 0;
  private th = 0;
  /** horizontal offset of the body relative to the tail (to dodge screen edges) */
  private shift = 0;
  private bg = new Graphics();
  readonly kind: BubbleKind;
  done = false;
  constructor(text: string, kind: BubbleKind, opts: { maxW?: number; flip?: boolean } = {}) {
    super();
    this.kind = kind;
    this.full = text;
    const maxW = opts.maxW ?? (kind === 'shout' ? 260 : 330);
    if (kind === 'shout') {
      this.txtLabel = txt(text, { fontFamily: F.comic, fontSize: 34, fill: INK, letterSpacing: 1, align: 'center' });
    } else {
      this.txtLabel = txt(text, {
        fontFamily: F.ui,
        fontWeight: kind === 'say' ? '700' : '600',
        fontSize: kind === 'say' ? 23 : 20,
        fill: INK,
        wordWrap: true,
        wordWrapWidth: maxW,
        lineHeight: kind === 'say' ? 27 : 24,
        align: 'left',
      });
    }
    this.txtLabel.anchor.set(kind === 'shout' ? 0.5 : 0);
    const tw = Math.max(this.txtLabel.width, kind === 'shout' ? 90 : 60);
    const th = this.txtLabel.height;
    this.tw = tw;
    this.th = th;
    const padX = kind === 'say' ? 26 : kind === 'retract' ? 20 : 34;
    const padY = kind === 'say' ? 18 : kind === 'retract' ? 13 : 26;
    this.w = tw + padX * 2;
    this.h = th + padY * 2;
    this.body.addChild(this.bg, this.txtLabel);
    this.addChild(this.body);
    this.draw();
    if (kind !== 'shout') {
      this.txtLabel.text = '';
    } else this.shown = text.length;
    if (opts.flip) this.scale.x = 1;
  }

  /** offset the body sideways (tail tip stays on the cat) */
  setShift(dx: number) {
    const lim = this.w / 2 - 34;
    const s = Math.max(-lim, Math.min(lim, dx));
    if (Math.abs(s - this.shift) < 0.5) return;
    this.shift = s;
    this.draw();
  }

  private draw() {
    const g = this.bg;
    g.clear();
    const w = this.w;
    const h = this.h;
    const tail = this.kind === 'shout' ? 26 : 34;
    const cx = this.shift;
    const top = -tail - h;
    if (this.kind === 'say') {
      const r = Math.min(30, h / 2);
      const tb = Math.max(-w / 2 + r, Math.min(w / 2 - r - 26, -cx - 6)) + cx;
      // drop shadow
      g.roundRect(cx - w / 2 + 6, top + 6, w, h, r).fill(INK);
      g.poly([tb + 6, -tail + 2, tb + 34, -tail + 2, 8, 6]).fill(INK);
      // ink rim
      g.roundRect(cx - w / 2 - 3.5, top - 3.5, w + 7, h + 7, r + 3).fill(INK);
      g.poly([tb - 4, -tail, tb + 32, -tail, 0, 4]).fill(INK);
      // paper
      g.roundRect(cx - w / 2, top, w, h, r).fill(0xfffdf6);
      g.poly([tb + 2, -tail - 4, tb + 26, -tail - 4, 1, -5]).fill(0xfffdf6);
      // halftone shading (lower-right)
      for (let yy = 0; yy < 4; yy++)
        for (let xx = 0; xx < 7; xx++) {
          const x = cx + w / 2 - 16 - xx * 11 - (yy % 2) * 5;
          const y = top + h - 12 - yy * 10;
          const rad = Math.max(0, 3.4 - xx * 0.42 - yy * 0.7);
          if (rad > 0.6) g.circle(x, y, rad).fill({ color: 0xe8879a, alpha: 0.6 });
        }
      // gloss tick
      g.moveTo(cx - w / 2 + 14, top + 12).quadraticCurveTo(cx - w / 2 + 10, top + 20, cx - w / 2 + 12, top + 30).stroke({ width: 4, color: 0xffffff, cap: 'round' });
    } else if (this.kind === 'retract') {
      const tb = Math.max(-w / 2 + 16, Math.min(w / 2 - 40, -cx - 10)) + cx;
      g.rect(cx - w / 2 + 5, top + 5, w, h).fill(INK);
      g.poly([tb, -tail, tb + 22, -tail, 2, 2]).fill(INK);
      g.rect(cx - w / 2, top, w, h).fill(C.yellow).stroke({ width: 3.5, color: INK, join: 'miter' });
      g.poly([tb + 3, -tail - 2, tb + 19, -tail - 2, 2, -4]).fill(C.yellow);
      g.moveTo(tb, -tail).lineTo(2, 0).lineTo(tb + 22, -tail).stroke({ width: 3.5, color: INK, join: 'round' });
      // sweat drop (top-right)
      const sx = cx + w / 2 - 4;
      const sy = top - 6;
      g.moveTo(sx, sy - 18).quadraticCurveTo(sx + 11, sy - 2, sx, sy + 4).quadraticCurveTo(sx - 11, sy - 2, sx, sy - 18).fill(0x7fd8ff).stroke({ width: 2.5, color: INK });
      g.circle(sx - 3, sy - 4, 2).fill(0xffffff);
      this.body.rotation = -0.035;
    } else {
      // starburst
      const n = 14;
      const pts: number[] = [];
      const shPts: number[] = [];
      for (let i = 0; i < n * 2; i++) {
        const a = (i / (n * 2)) * Math.PI * 2;
        const k = i % 2 ? 0.78 : 1 + ((i * 7) % 5) * 0.03;
        const x = cx + Math.cos(a) * (w / 2) * k;
        const y = top + h / 2 + Math.sin(a) * (h / 2) * k;
        pts.push(x, y);
        shPts.push(x + 6, y + 6);
      }
      g.poly(shPts).fill(INK);
      g.poly(pts).fill(0xffffff).stroke({ width: 4, color: INK, join: 'miter' });
      g.poly([cx - 10, top + h - 6, cx + 12, top + h - 8, 0, 0]).fill(0xffffff).stroke({ width: 4, color: INK, join: 'round' });
      g.poly([cx - 7, top + h - 12, cx + 9, top + h - 13, 0, -4]).fill(0xffffff);
      this.body.rotation = 0.06;
    }
    if (this.kind === 'shout') this.txtLabel.position.set(cx, top + h / 2);
    else this.txtLabel.position.set(cx - this.tw / 2 + (this.kind === 'retract' ? -4 : 0), top + (h - this.th) / 2);
  }

  /** typewriter; returns how many new characters appeared (for babble sounds) */
  tick(dt: number): number {
    if (this.shown >= this.full.length) {
      this.done = true;
      return 0;
    }
    const before = Math.floor(this.shown);
    this.shown = Math.min(this.full.length, this.shown + dt * this.cps);
    const now = Math.floor(this.shown);
    if (now !== before) this.txtLabel.text = this.full.slice(0, now);
    return now - before;
  }
  skip() {
    this.shown = this.full.length;
    this.txtLabel.text = this.full;
    this.done = true;
  }
}
