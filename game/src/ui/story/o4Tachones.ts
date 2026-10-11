/**
 * Parte II · Oleada 4 — INK THAT CHANGES ITS MIND. A line written by hand on a blank page, where `~~words~~` are
 * written first and then struck through with an ink scribble before the rest goes on (Distraxia «speaks» this way
 * in H61; REGISTRO 000's card changes its ESTADO this way in the Parte II credits).
 *
 *   const ink = new InkText('~~Lo siento.~~ No me arrepiento.', { size: 52, width: 1100 })
 *   await ink.play({ onStrike })   // tap-to-finish lives in the caller; ink.finish() completes it at once
 *
 *   playTachones(lines, o)          the full-screen blank page (H61): one line at a time, tap to go on
 *
 * Pixi only (no G): the caller decides when and marks the beats.
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../../core/App';
import { C, F } from '../theme';
import { Button, txt } from '../widgets';

export interface InkSeg {
  text: string;
  struck: boolean;
}
/** `~~a~~ b` → [{a, struck}, {b}] (an unclosed `~~` just strikes to the end) */
export function parseInk(markup: string): InkSeg[] {
  const out: InkSeg[] = [];
  const parts = markup.split('~~');
  parts.forEach((p, i) => {
    if (p) out.push({ text: p, struck: i % 2 === 1 });
  });
  return out;
}
/** the text a screen reader / a log should get: struck words removed */
export function inkPlain(markup: string): string {
  return parseInk(markup)
    .filter((s) => !s.struck)
    .map((s) => s.text)
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

interface Word {
  t: Text;
  seg: number;
  line: number;
}

export interface InkOpts {
  size?: number;
  width?: number;
  color?: number;
  font?: string;
  align?: 'left' | 'center';
  /** ink color of the strike */
  strike?: number;
  lineHeight?: number;
}

/** a hand-written line whose struck words get crossed out while it is written */
export class InkText extends Container {
  private words: Word[] = [];
  private segs: InkSeg[];
  private strikes = new Graphics();
  private done = false;
  private skip = false;
  private tweens: gsap.core.Tween[] = [];
  private o: Required<InkOpts>;

  constructor(markup: string, o: InkOpts = {}) {
    super();
    this.o = {
      size: o.size ?? 48,
      width: o.width ?? 1100,
      color: o.color ?? C.ink,
      font: o.font ?? F.brush,
      align: o.align ?? 'center',
      strike: o.strike ?? C.ink,
      lineHeight: o.lineHeight ?? (o.size ?? 48) * 1.35,
    };
    this.segs = parseInk(markup);
    this.layout();
    this.addChild(this.strikes);
  }

  private layout() {
    const { size, width, color, font, lineHeight, align } = this.o;
    const space = size * 0.32;
    const rows: Word[][] = [[]];
    let x = 0;
    this.segs.forEach((s, si) => {
      for (const w of s.text.split(/\s+/).filter(Boolean)) {
        const t = txt(w, { fontFamily: font, fontSize: size, fill: color }) as Text;
        if (x > 0 && x + t.width > width) {
          rows.push([]);
          x = 0;
        }
        t.position.set(x, 0);
        t.alpha = 0;
        x += t.width + space;
        const word: Word = { t, seg: si, line: rows.length - 1 };
        rows[rows.length - 1].push(word);
        this.words.push(word);
        this.addChild(t);
      }
    });
    rows.forEach((row, ri) => {
      if (!row.length) return;
      const last = row[row.length - 1].t;
      const rowW = last.x + last.width;
      const dx = align === 'center' ? (width - rowW) / 2 : 0;
      for (const w of row) w.t.position.set(w.t.x + dx, ri * lineHeight);
    });
  }

  /** total height (for layout) */
  get inkHeight() {
    const rows = this.words.length ? Math.max(...this.words.map((w) => w.line)) + 1 : 0;
    return rows * this.o.lineHeight;
  }

  /** write it; struck segments are crossed out right after they're written. `speed` = words per second */
  async play(o: { speed?: number; onStrike?: () => void; reduceMotion?: boolean } = {}): Promise<void> {
    const per = 1 / (o.speed ?? 5);
    for (let si = 0; si < this.segs.length; si++) {
      const ws = this.words.filter((w) => w.seg === si);
      for (const w of ws) {
        if (this.destroyed) return;
        if (this.skip) {
          w.t.alpha = 1;
          continue;
        }
        w.t.y -= o.reduceMotion ? 0 : 6;
        this.tweens.push(gsap.to(w.t, { alpha: 1, y: w.t.y + (o.reduceMotion ? 0 : 6), duration: 0.22, ease: 'sine.out' }));
        await this.wait(per);
      }
      if (this.segs[si].struck) {
        if (!this.skip) await this.wait(0.35);
        o.onStrike?.();
        await this.strike(ws, this.skip);
        if (!this.skip) await this.wait(0.25);
      }
    }
    this.done = true;
  }

  /** show everything at once (a tap while writing) */
  finish() {
    this.skip = true;
    for (const f of [...this.pending]) f();
  }
  get finished() {
    return this.done;
  }

  private pending = new Set<() => void>();
  private wait(s: number) {
    return new Promise<void>((r) => {
      if (this.skip || this.destroyed) return r();
      const done = () => {
        window.clearTimeout(t);
        this.pending.delete(done);
        r();
      };
      const t = window.setTimeout(done, s * 1000);
      this.pending.add(done);
    });
  }

  /** a quick ink scribble across those words (per row), drawn left to right */
  private strike(ws: Word[], instant: boolean): Promise<void> {
    const rows = new Map<number, Word[]>();
    for (const w of ws) rows.set(w.line, [...(rows.get(w.line) ?? []), w]);
    const spans = [...rows.values()].map((r) => ({ x0: r[0].t.x - 6, x1: r[r.length - 1].t.x + r[r.length - 1].t.width + 6, y: r[0].t.y + this.o.size * 0.58 }));
    const k = { v: instant ? 1 : 0 };
    const draw = () => {
      if (this.strikes.destroyed) return;
      this.strikes.clear();
      for (const sp of spans) {
        const x = sp.x0 + (sp.x1 - sp.x0) * k.v;
        // two slightly crooked passes: a hand, not a ruler
        this.strikes.moveTo(sp.x0, sp.y + 2).lineTo(x, sp.y - 3).stroke({ width: Math.max(4, this.o.size * 0.11), color: this.o.strike, alpha: 0.92, cap: 'round' });
        if (k.v > 0.5) {
          const x2 = sp.x0 + (sp.x1 - sp.x0) * Math.min(1, (k.v - 0.5) * 2);
          this.strikes.moveTo(sp.x0 + 4, sp.y - 6).lineTo(x2, sp.y + 4).stroke({ width: Math.max(3, this.o.size * 0.07), color: this.o.strike, alpha: 0.75, cap: 'round' });
        }
      }
      // keep the strikes drawn by earlier segments: re-add them as baked lines
    };
    if (instant) {
      this.bake(spans);
      return Promise.resolve();
    }
    return new Promise((res) => {
      this.tweens.push(
        gsap.to(k, {
          v: 1,
          duration: 0.45,
          ease: 'power2.inOut',
          onUpdate: draw,
          onComplete: () => {
            this.bake(spans);
            res();
          },
        }),
      );
    });
  }
  /** a finished strike becomes its own Graphics, so the next one can animate on `strikes` */
  private bake(spans: { x0: number; x1: number; y: number }[]) {
    this.strikes.clear();
    const g = new Graphics();
    for (const sp of spans) {
      g.moveTo(sp.x0, sp.y + 2).lineTo(sp.x1, sp.y - 3).stroke({ width: Math.max(4, this.o.size * 0.11), color: this.o.strike, alpha: 0.92, cap: 'round' });
      g.moveTo(sp.x0 + 4, sp.y - 6).lineTo(sp.x1, sp.y + 4).stroke({ width: Math.max(3, this.o.size * 0.07), color: this.o.strike, alpha: 0.75, cap: 'round' });
    }
    this.addChildAt(g, this.children.indexOf(this.strikes));
  }

  override destroy(o?: Parameters<Container['destroy']>[0]) {
    for (const t of this.tweens) t.kill();
    this.tweens = [];
    for (const f of [...this.pending]) f();
    super.destroy(o ?? { children: true });
  }
}

/**
 * H61: the blank page fills the screen and writes, one line at a time; tap = finish the line / go on.
 * Resolves when the last line was read (or SALTAR). `onStrike` fires on every strikethrough (the stinger).
 */
export function playTachones(layer: Container, lines: string[], o: { onStrike?: () => void; reduceMotion?: boolean; title?: string } = {}): Promise<void> {
  return new Promise((resolve) => {
    const root = new Container();
    root.eventMode = 'static';
    root.hitArea = { contains: () => true };
    layer.addChild(root);
    const dim = new Graphics().rect(0, 0, W, H).fill({ color: 0x0c0a12, alpha: 0.72 });
    root.addChild(dim);
    // the page: no face, no frame — a sheet that breathes and glows a little
    const page = new Container();
    const PW = 1280;
    const PH = 820;
    const glow = new Graphics();
    for (let i = 6; i >= 1; i--) glow.roundRect(-PW / 2 - i * 14, -PH / 2 - i * 14, PW + i * 28, PH + i * 28, 30 + i * 8).fill({ color: 0xfff8e8, alpha: 0.025 });
    const sheet = new Graphics().roundRect(-PW / 2, -PH / 2, PW, PH, 10).fill({ color: 0xfbf8f1 });
    // faint ruled lines, like a notebook that forgot what it was for
    for (let y = -PH / 2 + 120; y < PH / 2 - 40; y += 64) sheet.moveTo(-PW / 2 + 70, y).lineTo(PW / 2 - 70, y).stroke({ width: 2, color: 0xb9c6dc, alpha: 0.35 });
    page.addChild(glow, sheet);
    page.position.set(W / 2, H / 2 - 10);
    root.addChild(page);
    if (o.title) {
      const tt = txt(o.title, { fontFamily: F.bebas, fontSize: 30, fill: 0x8d8678, letterSpacing: 6 }) as Text;
      tt.anchor.set(0.5, 0);
      tt.position.set(0, -PH / 2 + 36);
      page.addChild(tt);
    }
    const hint = txt('TOCA PARA SEGUIR', { fontFamily: F.bebas, fontSize: 26, fill: 0xd9d2c4, letterSpacing: 4 }) as Text;
    hint.anchor.set(0.5);
    hint.position.set(W / 2, H - 46);
    hint.alpha = 0;
    root.addChild(hint);
    const skip = new Button('SALTAR', () => end(), { w: 180, h: 54, size: 24, color: C.paper });
    skip.position.set(W - 220, 30);
    root.addChild(skip);

    let ink: InkText | null = null;
    let i = 0;
    let waitingTap = false;
    let ended = false;
    const breathe = gsap.to(page.scale, { x: 1.008, y: 1.008, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.from(page, { alpha: 0, duration: 0.9, ease: 'sine.out' });
    gsap.from(dim, { alpha: 0, duration: 0.6 });

    const next = async () => {
      if (ended) return;
      if (i >= lines.length) return end();
      if (ink) {
        const old = ink;
        gsap.to(old, { alpha: 0, duration: 0.35, onComplete: () => old.destroy() });
      }
      ink = new InkText(lines[i++], { size: 54, width: PW - 220, color: 0x1d1a24, strike: 0x1d1a24 });
      ink.position.set(-(PW - 220) / 2, -ink.inkHeight / 2);
      page.addChild(ink);
      hint.alpha = 0;
      await ink.play({ onStrike: o.onStrike, reduceMotion: o.reduceMotion });
      if (ended) return;
      waitingTap = true;
      gsap.to(hint, { alpha: 0.9, duration: 0.4 });
    };
    root.on('pointertap', () => {
      if (ended) return;
      if (ink && !ink.finished) ink.finish();
      else if (waitingTap) {
        waitingTap = false;
        void next();
      }
    });
    const end = () => {
      if (ended) return;
      ended = true;
      breathe.kill();
      gsap.to(root, {
        alpha: 0,
        duration: 0.6,
        onComplete: () => {
          root.destroy({ children: true });
          resolve();
        },
      });
    };
    void next();
  });
}
