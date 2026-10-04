/** Right column: green clocks (pin for auto-Ronroneo, "Ronronear" spends the reserve) + reserve chip. */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../theme';
import { txt } from '../widgets';
import { G, Timer } from '../../state/game';
import { fmtTime } from '../../core/format';
import { ELEMENT_NAME } from '../../data/elementsMeta';
import { sfx } from '../../core/audio';
import { card, pressable } from './parts';
import { glyph, GlyphKind } from './glyphs';

const W = 268;
const ROW_H = 66;
const GAP = 8;
const MAX_ROWS = 6;

const KIND_GLYPH: Record<string, GlyphKind> = {
  build: 'hammer',
  habitat_upgrade: 'hammer',
  farm_upgrade: 'wrench',
  crop: 'fish',
  resonance: 'swirl',
  yard: 'anchor',
  expansion: 'shovel',
  repair: 'wrench',
  expedition: 'ship',
};

export function timerLabel(t: Timer) {
  if (t.kind === 'build') {
    const h = G.s.habitats.find((x) => x.id === t.ref);
    return h ? `Hábitat de ${cap(ELEMENT_NAME[h.element] ?? h.element)}` : t.label;
  }
  return t.label;
}
function cap(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

class TimerRow extends Container {
  bar = new Graphics();
  time: Text;
  nameText: Text;
  pinBtn = new Container();
  purrBtn = new Container();
  private lastP = -1;
  private lastT = '';
  pinned = false;
  fresh = true;
  constructor(public t: Timer) {
    super();
    const bg = card(W, ROW_H, C.paper, 5);
    const ic = new Graphics().circle(30, ROW_H / 2, 22).fill(C.green).stroke({ width: 3, color: C.ink });
    const gl = glyph(KIND_GLYPH[t.kind] ?? 'hammer', 30, C.ink);
    gl.position.set(30, ROW_H / 2);
    this.nameText = txt(timerLabel(t), { fontFamily: F.ui, fontWeight: '700', fontSize: 15, fill: C.ink });
    this.nameText.position.set(60, 8);
    if (this.nameText.width > 140) this.nameText.scale.set(140 / this.nameText.width);
    this.time = txt('00:00', { fontFamily: F.heavy, fontSize: 22, fill: C.ink });
    this.time.position.set(60, 28);
    this.bar.position.set(60, ROW_H - 9);
    this.addChild(bg, ic, gl, this.nameText, this.time, this.bar);
    // pin
    const pb = new Graphics().circle(0, 0, 15).fill(C.paperDark).stroke({ width: 2, color: C.ink });
    this.pinBtn.addChild(pb, glyph('pin', 22, C.ink, C.pinkHot));
    this.pinBtn.position.set(W - 66, 22);
    pressable(this.pinBtn, () => {
      G.s.pinnedTimer = G.s.pinnedTimer === t.id ? null : t.id;
      sfx('pop', 1.2);
    });
    // purr
    const qb = new Graphics().roundRect(-18, -15, 36, 30, 6).fill(C.lilac).stroke({ width: 2.5, color: C.ink });
    this.purrBtn.addChild(qb, glyph('purr', 20, C.ink, C.mint));
    this.purrBtn.position.set(W - 24, 22);
    pressable(this.purrBtn, () => {
      const used = G.spendPurrOn(t);
      if (used > 0) {
        sfx('purr');
        gsap.fromTo(this.scale, { x: 1.06, y: 1.06 }, { x: 1, y: 1, duration: 0.35, ease: 'back.out(3)' });
      } else sfx('error');
    });
    this.addChild(this.pinBtn, this.purrBtn);
  }
  refresh() {
    const t = this.t;
    const p = t.totalMs > 0 ? 1 - t.leftMs / t.totalMs : 1;
    if (Math.abs(p - this.lastP) > 0.003) {
      this.lastP = p;
      const bw = W - 72;
      this.bar.clear().rect(0, 0, bw, 6).fill(C.paperDark).rect(0, 0, Math.max(2, bw * p), 6).fill(C.green);
    }
    const s = fmtTime(t.leftMs);
    if (s !== this.lastT) {
      this.lastT = s;
      this.time.text = s;
    }
    const pinned = G.s.pinnedTimer === t.id;
    if (pinned !== this.pinned) {
      this.pinned = pinned;
      (this.pinBtn.children[0] as Graphics).clear().circle(0, 0, 15).fill(pinned ? C.yellow : C.paperDark).stroke({ width: 2, color: C.ink });
      this.pinBtn.rotation = pinned ? -0.4 : 0;
    }
    this.purrBtn.visible = G.s.purr > 0.05;
  }
}

export class TimerColumn extends Container {
  private rows = new Map<string, TimerRow>();
  private reserve = new Container();
  private reserveText: Text;
  private more: Text;
  private sig = '';
  private shownPurr = -1;
  constructor() {
    super();
    const rb = card(W, 44, C.lilac, 5);
    const gl = glyph('purr', 26, C.ink, C.mint);
    gl.position.set(24, 22);
    this.reserveText = txt('RONRONEO 0 min', { fontFamily: F.bebas, fontSize: 24, fill: C.ink, letterSpacing: 1 });
    this.reserveText.position.set(46, 8);
    this.reserve.addChild(rb, gl, this.reserveText);
    this.more = txt('', { fontFamily: F.ui, fontWeight: '700', fontSize: 16, fill: C.paper, stroke: { color: C.ink, width: 4 } });
    this.addChild(this.reserve, this.more);
  }
  rowFor(timerId: string) {
    return this.rows.get(timerId) ?? null;
  }
  get reserveChip() {
    return this.reserve;
  }
  update() {
    const list = [...G.s.timers].sort((a, b) => (G.s.pinnedTimer === b.id ? 1 : 0) - (G.s.pinnedTimer === a.id ? 1 : 0) || a.leftMs - b.leftMs);
    const shown = list.slice(0, MAX_ROWS);
    const sig = shown.map((t) => t.id).join(',');
    const showReserve = G.s.purr > 0.01;
    if (sig !== this.sig) {
      this.sig = sig;
      for (const [id, r] of this.rows)
        if (!shown.some((t) => t.id === id)) {
          this.rows.delete(id);
          gsap.to(r, { alpha: 0, x: 40, duration: 0.2, onComplete: () => r.destroy({ children: true }) });
        }
      shown.forEach((t) => {
        if (!this.rows.has(t.id)) {
          const r = new TimerRow(t);
          this.rows.set(t.id, r);
          this.addChild(r);
          r.x = 60;
          r.alpha = 0;
          gsap.to(r, { x: 0, alpha: 1, duration: 0.3, ease: 'back.out(2)' });
        }
      });
    }
    let y = showReserve ? 56 : 0;
    for (const t of shown) {
      const r = this.rows.get(t.id)!;
      r.t = t;
      if (r.fresh) {
        r.fresh = false;
        r.y = y;
      } else if (Math.abs(r.y - y) > 0.5 && !gsap.isTweening(r)) gsap.to(r, { y, duration: 0.25, ease: 'power2.out' });
      r.refresh();
      y += ROW_H + GAP;
    }
    this.more.text = list.length > MAX_ROWS ? `+${list.length - MAX_ROWS} relojes más` : '';
    this.more.position.set(8, y);
    this.reserve.visible = showReserve;
    const pm = Math.round(G.s.purr * 10) / 10;
    if (pm !== this.shownPurr) {
      this.shownPurr = pm;
      this.reserveText.text = `RONRONEO  ${pm.toFixed(1)} min`;
    }
  }
}
