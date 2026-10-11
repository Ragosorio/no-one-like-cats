/**
 * YONOSE TODO — the storyboard's paper furniture (screen space, already pencil: never redrawn by the Animatic filter):
 *
 *   Frame      the panel border, the slate (ESC. 64) and the frame counter (one frame per keys note), and the TIMING
 *              STRIP along the bottom: an animatic's sound bar where every kick (a block), every accent (a tick) and
 *              every bass note (a bar at its pitch) scrolls under the playhead — the music, written down.
 *   Captions   the dialogue under the panel, handwritten (the story's own lines, personalized)
 *   Thumbs     «¿QUÉ ESCRIBES?»: three thumbnails to pick from (tap / click, 1·2·3, ←·↓·→, A·S·D)
 *   Registro   REGISTRO 000's card on the closing tick-tock, in the game's own paper and ink
 */
import { Container, Graphics, Rectangle, Sprite } from 'pixi.js';
import type { Kit } from '../../anime/kit';
import type { Onset } from '../../types';
import { box, circle, sketch } from './pencil';
import { GRAPHITE } from './paper';
import { BAR, BEAT, LETTER_TICS, PICK, STRIKE_TICS, WAKE_T } from './times';
import { MENTIRA_OPTIONS } from '../../../ui/story/rupturasScriptO4';
import type { MentiraChoice } from '../../../state/sys/rupturasO4';
import { REGISTRO_000 } from '../../../ui/story/rupturasScript';

export const HAND = 'Permanent Marker';
export const SANS = 'Space Grotesk';
export const SERIF = 'Playfair Display';
export const POSTER = 'Anton';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// ------------------------------------------------------------------ the storyboard frame + timing strip
export class Frame {
  readonly root = new Container();
  private g = new Graphics();
  private strip = new Graphics();
  private slate: Sprite;
  private counter: Sprite[] = [];
  private lastStep = -1;
  private digitsW = 0;
  private cuadro: Sprite;
  constructor(private k: Kit) {
    this.root.addChild(this.g, this.strip);
    this.slate = k.text.sprite('ESC. 64  ·  PLANO 1', { fontFamily: SANS, fontWeight: '700', fontSize: 22, fill: GRAPHITE, letterSpacing: 4 }, 0);
    this.root.addChild(this.slate);
    for (let d = 0; d < 10; d++) k.text.get(String(d), { fontFamily: SANS, fontWeight: '700', fontSize: 22, fill: GRAPHITE });
    this.digitsW = k.text.get('0', { fontFamily: SANS, fontWeight: '700', fontSize: 22, fill: GRAPHITE }).width;
    for (let i = 0; i < 4; i++) {
      const s = new Sprite();
      this.counter.push(s);
      this.root.addChild(s);
    }
    this.cuadro = k.text.sprite('CUADRO', { fontFamily: SANS, fontWeight: '700', fontSize: 16, fill: GRAPHITE, letterSpacing: 4 }, 0);
    this.root.addChild(this.cuadro);
  }
  update(t: number, alpha: number, frameNo: number, kicks: Onset[], accents: Onset[], bass: Onset[]) {
    this.root.visible = alpha > 0.01;
    if (!this.root.visible) return;
    this.root.alpha = alpha;
    const step = Math.floor(t * 12);
    const { x, y, w, h } = this.k.view;
    // the slate (bottom left) and the counter (bottom right: a frame per keys note), over the timing strip
    const n = String(Math.min(9999, frameNo)).padStart(4, '0');
    const cx = x + w - 70 - 4 * this.digitsW;
    for (let i = 0; i < 4; i++) {
      const s = this.counter[i];
      s.texture = this.k.text.get(n[i], { fontFamily: SANS, fontWeight: '700', fontSize: 22, fill: GRAPHITE });
      s.position.set(cx + i * this.digitsW, y + h - 128);
    }
    this.cuadro.position.set(cx - 96, y + h - 124);
    this.slate.position.set(x + 70, y + h - 128);
    if (step === this.lastStep) return;
    this.lastStep = step;
    const g = this.g;
    g.clear();
    box(g, x + 26, y + 26, w - 52, h - 52, { seed: step % 3, width: 2.4, alpha: 0.55 });
    // registration marks
    for (const [mx, my] of [
      [x + 26, y + 26],
      [x + w - 26, y + 26],
      [x + 26, y + h - 26],
      [x + w - 26, y + h - 26],
    ]) {
      sketch(g, [mx - 14, my, mx + 14, my], { seed: step % 3, width: 1.6, alpha: 0.5, passes: 1 });
      sketch(g, [mx, my - 14, mx, my + 14], { seed: (step % 3) + 5, width: 1.6, alpha: 0.5, passes: 1 });
    }
    // the timing strip: ±4 s around the playhead
    const s = this.strip;
    s.clear();
    const y0 = y + h - 64;
    const mid = x + w / 2;
    const pps = 150;
    const x0 = x + 60;
    const x1 = x + w - 60;
    sketch(s, [x0, y0, x1, y0], { seed: 7 + (step % 3), width: 1.4, alpha: 0.45, passes: 1 });
    const tb0 = Math.ceil((t - 6) / BEAT);
    for (let b = tb0; b * BEAT < t + 6; b++) {
      const bx = mid + (b * BEAT - t) * pps;
      if (bx < x0 || bx > x1) continue;
      const isBar = Math.abs(b * BEAT - Math.round((b * BEAT) / BAR) * BAR) < 0.01;
      s.moveTo(bx, y0 - (isBar ? 12 : 6)).lineTo(bx, y0 + (isBar ? 12 : 6)).stroke({ width: isBar ? 1.6 : 1, color: GRAPHITE, alpha: 0.45 });
    }
    for (const o of bass) {
      if (o.t > t + 6) break;
      const end = o.t + (o.dur ?? 0.2);
      if (end < t - 6) continue;
      const bx = Math.max(x0, mid + (o.t - t) * pps);
      const ex = Math.min(x1, mid + (end - t) * pps);
      const yy = y0 + 22 - Math.max(0, Math.min(14, ((o.midi ?? 30) - 25) * 1.1));
      if (ex > bx) s.moveTo(bx, yy).lineTo(ex, yy).stroke({ width: 3, color: 0x4f6f9f, alpha: 0.55 });
    }
    for (const o of kicks) {
      if (o.t > t + 6) break;
      if (o.t < t - 6) continue;
      const bx = mid + (o.t - t) * pps;
      if (bx < x0 || bx > x1) continue;
      const sz = 4 + o.strength * 5;
      s.rect(bx - sz / 2, y0 - 26 - sz, sz, sz).fill({ color: GRAPHITE, alpha: 0.6 });
    }
    for (const o of accents) {
      if (o.t > t + 6) break;
      if (o.t < t - 6 || o.strength < 0.4) continue;
      const bx = mid + (o.t - t) * pps;
      if (bx < x0 || bx > x1) continue;
      s.moveTo(bx, y0 - 10).lineTo(bx + 3, y0 - 18 - o.strength * 6).stroke({ width: 1.3, color: GRAPHITE, alpha: 0.5 });
    }
    // the playhead
    sketch(s, [mid, y0 - 40, mid, y0 + 26], { seed: 11 + (step % 3), width: 2, color: 0xc0463c, alpha: 0.7, passes: 1 });
  }
}

// ------------------------------------------------------------------ captions (dialogue under the panel)
export function captionSprite(k: Kit, who: string, text: string): Container {
  const c = new Container();
  const lab = k.text.sprite(who, { fontFamily: SANS, fontWeight: '700', fontSize: 20, fill: 0x6a6258, letterSpacing: 4 }, 0);
  const body = k.text.sprite(text, { fontFamily: HAND, fontSize: 36, fill: GRAPHITE, wordWrap: true, wordWrapWidth: 1040, lineHeight: 46 }, 0);
  body.position.set(0, 30);
  const bg = new Graphics()
    .roundRect(-26, -20, Math.max(lab.width, body.width) + 52, body.height + 66, 10)
    .fill({ color: 0xfbf6ea, alpha: 0.86 });
  box(bg, -26, -20, Math.max(lab.width, body.width) + 52, body.height + 66, { seed: 3, width: 1.8, alpha: 0.45, over: 8 });
  c.addChild(bg, lab, body);
  (c as Container & { bodyW: number }).bodyW = body.width;
  return c;
}

// ------------------------------------------------------------------ «¿Qué escribes?»
const KEYS: Record<string, number> = { Digit1: 0, Numpad1: 0, ArrowLeft: 0, KeyA: 0, Digit2: 1, Numpad2: 1, ArrowDown: 1, KeyS: 1, Digit3: 2, Numpad3: 2, ArrowRight: 2, KeyD: 2 };

export class Thumbs {
  readonly root = new Container();
  private cards: { c: Container; ring: Graphics; cross: Graphics; id: MentiraChoice }[] = [];
  private title: Sprite;
  private hint: Sprite;
  private off: (() => void) | null = null;
  constructor(
    private k: Kit,
    private onPick: (id: MentiraChoice) => void,
  ) {
    this.title = k.text.sprite('¿QUÉ ESCRIBES?', { fontFamily: HAND, fontSize: 70, fill: GRAPHITE }, 0.5);
    this.hint = k.text.sprite('1 · 2 · 3   o toca una', { fontFamily: SANS, fontWeight: '700', fontSize: 20, fill: 0x6a6258, letterSpacing: 3 }, 0.5);
    this.root.addChild(this.title, this.hint);
    MENTIRA_OPTIONS.forEach((o, i) => {
      const c = new Container();
      const g = new Graphics();
      const cw = 380;
      const ch = 250;
      g.rect(-cw / 2, -ch / 2, cw, ch).fill(0xfbf6ea);
      box(g, -cw / 2, -ch / 2, cw, ch, { seed: 20 + i, width: 2.4, alpha: 0.7 });
      this.sketchOption(g, o.id, cw, ch);
      const num = k.text.sprite(String(i + 1), { fontFamily: HAND, fontSize: 40, fill: GRAPHITE }, 0.5);
      num.position.set(-cw / 2 + 30, -ch / 2 + 30);
      const ring0 = new Graphics();
      circle(ring0, -cw / 2 + 30, -ch / 2 + 32, 24, 24, { seed: 40 + i, width: 2, alpha: 0.6 });
      const lab = k.text.sprite(o.label, { fontFamily: SANS, fontWeight: '700', fontSize: 21, fill: GRAPHITE, letterSpacing: 2, wordWrap: true, wordWrapWidth: cw - 20, align: 'center' }, 0.5);
      lab.position.set(0, ch / 2 + 34);
      const ring = new Graphics();
      const cross = new Graphics();
      c.addChild(g, ring0, num, lab, cross, ring);
      c.eventMode = 'static';
      c.cursor = 'pointer';
      c.hitArea = new Rectangle(-cw / 2, -ch / 2, cw, ch + 70);
      c.on('pointertap', () => this.onPick(o.id));
      this.cards.push({ c, ring, cross, id: o.id });
      this.root.addChild(c);
    });
    // keys (captured before the runner's own listener: this is built first)
    const kd = (e: KeyboardEvent) => {
      if (!this.root.visible || this.root.alpha < 0.5) return;
      const i = KEYS[e.code];
      if (i === undefined) return;
      this.onPick(MENTIRA_OPTIONS[i].id);
    };
    window.addEventListener('keydown', kd, true);
    this.off = () => window.removeEventListener('keydown', kd, true);
  }

  private sketchOption(g: Graphics, id: MentiraChoice, cw: number, ch: number) {
    if (id === 'perfecto') {
      // identical cats in a ruled grid, perfectly symmetric
      for (let r = 0; r < 2; r++)
        for (let q = 0; q < 4; q++) {
          const x = -cw / 2 + 70 + q * 80;
          const y = -20 + r * 74;
          circle(g, x, y, 22, 20, { seed: 1, width: 1.8, alpha: 0.75, turns: 1.02 });
          sketch(g, [x - 18, y - 12, x - 14, y - 32, x - 4, y - 18], { seed: 2, width: 1.8, alpha: 0.75, passes: 1 });
          sketch(g, [x + 4, y - 18, x + 14, y - 32, x + 18, y - 12], { seed: 3, width: 1.8, alpha: 0.75, passes: 1 });
          sketch(g, [x - 8, y + 2, x + 8, y + 2], { seed: 4, width: 1.6, alpha: 0.7, passes: 1 });
        }
      sketch(g, [-cw / 2 + 30, 76, cw / 2 - 30, 76], { seed: 9, width: 1.2, alpha: 0.5, passes: 1, wob: 0 });
    } else if (id === 'romper') {
      // boxes cracking open, pieces flying
      for (let i = 0; i < 3; i++) {
        const x = -110 + i * 110;
        const y = 20 + (i % 2) * 20;
        box(g, x - 40, y - 40, 80, 80, { seed: 50 + i, width: 2, alpha: 0.75 });
        sketch(g, [x - 10, y - 40, x + 4, y - 14, x - 8, y + 6, x + 10, y + 40], { seed: 60 + i, width: 2.2, alpha: 0.85 });
        sketch(g, [x + 30, y - 52, x + 48, y - 70], { seed: 70 + i, width: 1.6, alpha: 0.6, passes: 1 });
        sketch(g, [x - 44, y - 50, x - 60, y - 66], { seed: 80 + i, width: 1.6, alpha: 0.6, passes: 1 });
      }
    } else {
      // nothing: the page as it is (a faint outline), a little cat asleep in the corner
      sketch(g, [-120, -40, 120, -44, 140, 60, -136, 62, -120, -40], { seed: 90, width: 1.4, alpha: 0.35, passes: 1 });
      circle(g, 110, 82, 20, 11, { seed: 91, width: 1.6, alpha: 0.6 });
      sketch(g, [96, 76, 100, 64, 108, 74], { seed: 92, width: 1.6, alpha: 0.6, passes: 1 });
    }
  }

  /** `show` 0..1 (the thumbs prop), the pick so far, song time */
  update(t: number, show: number, pick: MentiraChoice | null, pickAt: number, kick: number) {
    this.root.visible = show > 0.01;
    if (!this.root.visible) return;
    this.root.alpha = clamp01(show * 1.4);
    const { x, y, w } = this.k.view;
    const cx = x + w / 2;
    this.title.position.set(cx, y + 238 - (1 - show) * 60);
    this.hint.position.set(cx, y + 300 - (1 - show) * 60);
    const step = Math.floor(t * 12);
    this.cards.forEach((cd, i) => {
      const bob = Math.sin(t * 2.2 + i * 1.3) * 4 - kick * 7 * (i === 1 ? 1.2 : 1);
      cd.c.position.set(cx + (i - 1) * 440, y + 520 + bob + (1 - show) * 220 * (1 + i * 0.3));
      cd.c.rotation = (i - 1) * 0.035 + Math.sin(t * 1.4 + i) * 0.01;
      const chosen = pick === cd.id;
      const since = t - pickAt;
      cd.ring.clear();
      cd.cross.clear();
      if (pick) {
        if (chosen) {
          const p = clamp01(since / 0.45);
          if (p > 0) circle(cd.ring, 0, 0, 230, 170, { seed: 7 + (step % 3), width: 5, color: 0xc0463c, alpha: 0.9, turns: 1.12 * p });
          cd.c.scale.set(1 + 0.06 * Math.min(1, since * 3));
        } else {
          cd.c.scale.set(0.94);
          cd.c.alpha = 0.6;
          if (since > 0.15) sketch(cd.cross, [-150, -90, 150, 90], { seed: 3 + i, width: 2, alpha: 0.5, passes: 1 });
        }
      } else {
        cd.c.alpha = 1;
        cd.c.scale.set(1);
      }
    });
    void PICK;
  }
  destroy() {
    this.off?.();
    this.off = null;
  }
}

// ------------------------------------------------------------------ REGISTRO 000's card (the game's own paper and ink)
export class RegistroCard {
  readonly root = new Container();
  private strike = new Graphics();
  private under = new Graphics();
  private word: Sprite;
  private wordMask = new Graphics();
  private prefixW: number[] = [];
  private cont: Sprite;
  private est!: Sprite;
  private lastKey = '';
  constructor(private k: Kit) {
    const cw = 980;
    const ch = 620;
    const g = new Graphics();
    g.rect(-cw / 2 + 12, -ch / 2 + 14, cw, ch).fill({ color: 0x16120f, alpha: 0.85 });
    g.rect(-cw / 2, -ch / 2, cw, ch).fill(0xf3ead8).stroke({ width: 5, color: 0x16120f });
    g.rect(-cw / 2 + 40, -ch / 2 + 130, 240, 300).fill(0xe6dccb).stroke({ width: 4, color: 0x16120f });
    this.root.addChild(g);
    const title = k.text.sprite(REGISTRO_000.title, { fontFamily: POSTER, fontSize: 84, fill: 0x16120f, letterSpacing: 4 }, 0);
    title.position.set(-cw / 2 + 40, -ch / 2 + 22);
    const serial = k.text.sprite(REGISTRO_000.serial, { fontFamily: SANS, fontWeight: '700', fontSize: 26, fill: 0x16120f, letterSpacing: 3 }, 1);
    serial.position.set(cw / 2 - 40, -ch / 2 + 52);
    const q = k.text.sprite('?', { fontFamily: POSTER, fontSize: 200, fill: 0x16120f }, 0.5);
    q.position.set(-cw / 2 + 160, -ch / 2 + 280);
    this.root.addChild(title, serial, q);
    REGISTRO_000.fields.forEach(([lab, val], i) => {
      const yy = -ch / 2 + 128 + i * 98;
      const l = k.text.sprite(lab, { fontFamily: SANS, fontWeight: '700', fontSize: 22, fill: 0x6a6258, letterSpacing: 4 }, 0);
      l.position.set(-cw / 2 + 320, yy);
      const v = k.text.sprite(val.toUpperCase(), { fontFamily: POSTER, fontSize: 40, fill: 0x16120f, letterSpacing: 2 }, 0);
      v.position.set(-cw / 2 + 320, yy + 26);
      this.root.addChild(l, v);
      if (i === 3) this.est = v;
    });
    const estado = this.est;
    const style = { fontFamily: HAND, fontSize: 62, fill: 0xd2337a };
    const word = 'despertando';
    this.word = k.text.sprite(word, style, 0);
    this.word.position.set(estado.x + estado.width + 34, estado.y - 18);
    for (let i = 0; i <= word.length; i++) this.prefixW.push(i === 0 ? 0 : k.text.get(word.slice(0, i), style).width);
    this.word.mask = this.wordMask;
    this.cont = k.text.sprite('CONTINUARÁ', { fontFamily: POSTER, fontSize: 132, fill: 0x16120f, letterSpacing: 8 }, 0.5);
    this.cont.position.set(0, ch / 2 + 120);
    this.root.addChild(this.strike, this.word, this.wordMask, this.under, this.cont);
  }
  update(t: number, show: number) {
    this.root.visible = show > 0.01;
    if (!this.root.visible) return;
    const { x, y, w, h } = this.k.view;
    this.root.position.set(x + w / 2, y + h / 2 - 70 + (1 - show) * 700);
    this.root.rotation = -0.02 * show + (1 - show) * 0.2;
    const est = this.est;
    const strikes = STRIKE_TICS.filter((s) => t >= s).length;
    const letters = LETTER_TICS.filter((s) => t >= s).length;
    const woke = t >= WAKE_T;
    const key = `${strikes}|${letters}|${woke}|${Math.floor(t * 12) % 3}`;
    if (key === this.lastKey) return;
    this.lastKey = key;
    const g = this.strike;
    g.clear();
    for (let i = 0; i < strikes; i++) {
      const yy = est.y + 24 + (i - 1.5) * 5;
      sketch(g, [est.x - 8, yy + (i % 2 ? 3 : -2), est.x + est.width + 10, yy + (i % 2 ? -3 : 2)], { seed: 30 + i * 5 + (Math.floor(t * 12) % 3), width: 4, color: 0x16120f, alpha: 0.9, passes: 1, over: 6 });
    }
    const m = this.wordMask;
    m.clear();
    m.rect(this.word.x - 4, this.word.y - 20, this.prefixW[Math.min(letters, this.prefixW.length - 1)] + 6, 140).fill(0xffffff);
    this.under.clear();
    if (woke) sketch(this.under, [this.word.x, this.word.y + 84, this.word.x + this.word.width + 12, this.word.y + 78], { seed: 9, width: 4, color: 0xd2337a, alpha: 0.9, over: 10 });
    this.cont.visible = woke;
    if (woke) this.cont.scale.set(1 + 0.25 * Math.max(0, 1 - (t - WAKE_T) * 6));
  }
}
