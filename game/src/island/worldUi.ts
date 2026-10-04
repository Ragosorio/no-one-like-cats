/** World-space UI on the island: green clocks, coin piles, "¡LISTA!" bubbles, price plaques. */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../ui/theme';
import { txt } from '../ui/widgets';
import { icon, IconKind } from '../ui/icons';
import { fmt, fmtTime } from '../core/format';

const INK = { width: 3, color: C.ink, join: 'round' as const };

/** green timer: circular progress + mm:ss pill. Rule: green = productive, absolute color. */
export class ClockBubble extends Container {
  private ring = new Graphics();
  private timeText: Text;
  private pill = new Graphics();
  private lastText = '';
  private lastP = -1;
  constructor(public r = 26) {
    super();
    const face = new Graphics().circle(3, 3, r).fill(C.ink).circle(0, 0, r).fill(C.paper).stroke(INK);
    this.timeText = txt('00:00', { fontFamily: F.heavy, fontSize: 18, fill: C.paper });
    this.timeText.anchor.set(0.5);
    this.timeText.y = r + 16;
    this.addChild(this.pill, face, this.ring, this.timeText);
    const hourglass = new Graphics();
    hourglass.poly([-8, -11, 8, -11, 0, 0, 8, 11, -8, 11, 0, 0]).fill(C.green).stroke({ width: 2.5, color: C.ink, join: 'round' });
    this.addChild(hourglass);
  }
  set(leftMs: number, totalMs: number) {
    const p = totalMs > 0 ? 1 - leftMs / totalMs : 1;
    if (Math.abs(p - this.lastP) > 0.004) {
      this.lastP = p;
      const r = this.r - 4;
      this.ring.clear();
      this.ring.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p).stroke({ width: 7, color: C.green, cap: 'round' });
    }
    const t = fmtTime(leftMs);
    if (t !== this.lastText) {
      this.lastText = t;
      this.timeText.text = t;
      const w = this.timeText.width + 18;
      this.pill.clear().roundRect(-w / 2 + 3, this.r + 3 + 3, w, 26, 13).fill(C.ink).roundRect(-w / 2, this.r + 3, w, 26, 13).fill(C.green).stroke({ width: 3, color: C.ink });
    }
  }
}

/** speech bubble with icon + text, bobbing on twos */
export class TagBubble extends Container {
  private t = Math.random() * 6;
  private acc = 0;
  body = new Container();
  caption: Text;
  constructor(text: string, opts: { icon?: IconKind; color?: number; textColor?: number; size?: number } = {}) {
    super();
    const size = opts.size ?? 24;
    this.caption = txt(text, { fontFamily: F.comic, fontSize: size, fill: opts.textColor ?? C.ink, letterSpacing: 1 });
    this.caption.anchor.set(0, 0.5);
    let x0 = 12;
    if (opts.icon) {
      const ic = icon(opts.icon, size * 1.3);
      ic.position.set(12 + size * 0.65, 0);
      this.body.addChild(ic);
      x0 = 18 + size * 1.3;
    }
    this.caption.position.set(x0, 0);
    const w = x0 + this.caption.width + 14;
    const h = size + 18;
    const bg = new Graphics();
    bg.roundRect(4, -h / 2 + 4, w, h, 12).fill(C.ink);
    bg.roundRect(0, -h / 2, w, h, 12).fill(opts.color ?? C.yellow).stroke(INK);
    bg.poly([w / 2 - 8, h / 2 - 1, w / 2 + 8, h / 2 - 1, w / 2 - 2, h / 2 + 12]).fill(opts.color ?? C.yellow).stroke(INK);
    bg.rect(w / 2 - 7, h / 2 - 4, 14, 4).fill(opts.color ?? C.yellow);
    this.body.addChildAt(bg, 0);
    this.body.addChild(this.caption);
    this.body.x = -w / 2;
    this.body.y = -h / 2 - 12;
    this.addChild(this.body);
  }
  tick(dt: number) {
    this.acc += dt;
    if (this.acc < 1 / 12) return;
    this.t += this.acc;
    this.acc = 0;
    this.body.y = -this.body.height / 2 - 12 + Math.sin(this.t * 4) * 4;
  }
  pop() {
    gsap.fromTo(this.scale, { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.35, ease: 'back.out(3)' });
  }
}

/** stacked coins over a habitat (height ~ fill) + amount, or a red LLENO stamp */
export class CoinPile extends Container {
  private coins = new Container();
  private amount: Text;
  private stamp: Container;
  private shownN = -1;
  private full = false;
  private t = Math.random() * 5;
  private acc = 0;
  constructor() {
    super();
    this.amount = txt('0', { fontFamily: F.heavy, fontSize: 22, fill: C.yellow, stroke: { color: C.ink, width: 6, join: 'round' } });
    this.amount.anchor.set(0.5, 1);
    this.stamp = new Container();
    const sb = new Graphics().rect(-56, -20, 112, 40).fill(C.red).stroke({ width: 4, color: C.ink });
    sb.rect(-50, -14, 100, 28).stroke({ width: 2, color: C.paper });
    const st = txt('LLENO', { fontFamily: F.poster, fontSize: 30, fill: C.paper, letterSpacing: 2 });
    st.anchor.set(0.5);
    this.stamp.addChild(sb, st);
    this.stamp.rotation = -0.12;
    this.stamp.visible = false;
    this.addChild(this.coins, this.amount, this.stamp);
  }
  set(buffer: number, fill: number, full: boolean) {
    const n = buffer < 1 ? 0 : Math.max(1, Math.min(6, Math.ceil(fill * 6)));
    if (n !== this.shownN) {
      this.shownN = n;
      this.coins.removeChildren().forEach((c) => c.destroy({ children: true }));
      for (let i = 0; i < n; i++) {
        const g = new Graphics();
        const x = (i % 2) * 6 - 3;
        g.ellipse(x, -i * 9, 22, 9).fill(0xb8862a).stroke({ width: 2.5, color: C.ink });
        g.ellipse(x, -i * 9 - 4, 22, 9).fill(C.yellow).stroke({ width: 2.5, color: C.ink });
        g.ellipse(x, -i * 9 - 4, 12, 4).stroke({ width: 2, color: 0xb8862a });
        this.coins.addChild(g);
      }
      if (n > 0 && this.shownN >= 0) gsap.fromTo(this.coins.scale, { x: 1.15, y: 0.85 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
    }
    this.coins.visible = n > 0;
    this.amount.visible = n > 0;
    this.amount.text = fmt(Math.floor(buffer));
    this.amount.y = -n * 9 - 14;
    if (full !== this.full) {
      this.full = full;
      this.stamp.visible = full;
      if (full) gsap.fromTo(this.stamp.scale, { x: 2.2, y: 2.2 }, { x: 1, y: 1, duration: 0.25, ease: 'back.out(2)' });
    }
    this.stamp.y = -n * 9 - 64;
  }
  tick(dt: number) {
    this.acc += dt;
    if (this.acc < 1 / 12) return;
    this.t += this.acc;
    this.acc = 0;
    if (this.full) this.stamp.rotation = -0.12 + Math.sin(this.t * 6) * 0.04;
  }
}

/** aspirational price plaque on a locked/available expansion */
export class PricePlaque extends Container {
  private bg = new Graphics();
  private body = new Container();
  private t = Math.random() * 5;
  private acc = 0;
  state = '';
  constructor(public name: string) {
    super();
    this.addChild(this.body);
    this.body.addChild(this.bg);
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }
  /** rebuild for a state */
  show(state: 'locked' | 'available', price: number, kl: number, affordable: boolean) {
    const key = `${state}|${affordable}|${price}`;
    if (key === this.state) return;
    this.state = key;
    this.body.removeChildren().forEach((c) => c !== this.bg && c.destroy({ children: true }));
    this.body.addChild(this.bg);
    const avail = state === 'available';
    const title = txt(this.name.toUpperCase(), { fontFamily: F.poster, fontSize: 34, fill: avail ? C.ink : C.paper, letterSpacing: 0 });
    title.anchor.set(0.5, 0);
    title.y = 12;
    const row = new Container();
    const coin = icon('gold', 34);
    coin.position.set(17, 18);
    const pr = txt(fmt(price), { fontFamily: F.heavy, fontSize: 30, fill: avail ? C.ink : C.yellow });
    pr.position.set(40, 0);
    row.addChild(coin, pr);
    row.position.set(-row.width / 2, 56);
    const sub = new Container();
    if (avail) {
      const btnW = 196;
      const b = new Graphics().rect(-btnW / 2 + 5, 5, btnW, 44).fill(C.ink).rect(-btnW / 2, 0, btnW, 44).fill(affordable ? C.pinkHot : C.pink).stroke(INK);
      const bt = txt('¡COMPRAR!', { fontFamily: F.poster, fontSize: 28, fill: affordable ? C.paper : C.ink });
      bt.anchor.set(0.5);
      bt.y = 22;
      sub.addChild(b, bt);
    } else {
      const lock = new Graphics();
      lock.roundRect(-9, 2, 18, 15, 3).fill(C.paper);
      lock.arc(0, 2, 6, Math.PI, 0).stroke({ width: 3.5, color: C.paper });
      const lt = txt(`REINO ${kl}`, { fontFamily: F.bebas, fontSize: 30, fill: C.paper, letterSpacing: 2 });
      lt.position.set(20, -2);
      lock.position.set(0, 6);
      sub.addChild(lock, lt);
      sub.x = -(lt.width + 20) / 2 + 10;
    }
    sub.y = 104;
    this.body.addChild(title, row, sub);
    const w = Math.max(title.width, row.width, 210) + 44;
    const h = avail ? 166 : 150;
    const bg = this.bg;
    bg.clear();
    bg.rect(-w / 2 + 9, 9, w, h).fill(C.ink);
    bg.rect(-w / 2, 0, w, h).fill(avail ? C.yellow : C.ink).stroke({ width: 4, color: avail ? C.ink : C.paper, alignment: 1 });
    if (!avail) bg.rect(-w / 2 + 8, 8, w - 16, h - 16).stroke({ width: 1.5, color: C.paper, alpha: 0.5 });
    // dotted corner marks (swiss)
    for (let k = 0; k < 3; k++) bg.circle(-w / 2 + 14 + k * 9, h - 12, 2).fill(avail ? C.ink : C.paper);
    // string to the ground
    bg.moveTo(0, h).lineTo(0, h + 40).stroke({ width: 3, color: C.ink });
    bg.circle(0, h + 42, 5).fill(C.ink);
    this.body.y = -(h + 46);
  }
  tick(dt: number) {
    this.acc += dt;
    if (this.acc < 1 / 12) return;
    this.t += this.acc;
    this.acc = 0;
    this.body.rotation = Math.sin(this.t * 1.6) * 0.025;
  }
}

/**
 * Dragon-City style piles on a habitat's doorstep: a stack of coins and a heap of Pescaditos that grow
 * with each buffer, numbers on top, red LLENO stamp. Big invisible hit circle = easy to tap.
 */
export class YieldPile extends Container {
  private coins = new Container();
  private fish = new Container();
  private tags = new Container();
  private goldText: Text;
  private fishText: Text;
  private goldIc: Container;
  private fishIc: Container;
  private stamp: Container;
  private shownG = -1;
  private shownF = -1;
  private full = false;
  private t = Math.random() * 5;
  private acc = 0;
  /** radius of the tap target (world px) */
  static HIT = 78;
  constructor() {
    super();
    const hit = new Graphics().circle(0, -40, YieldPile.HIT).fill({ color: 0xffffff, alpha: 0.001 });
    const shadow = new Graphics().ellipse(4, 4, 46, 14).fill({ color: C.ink, alpha: 0.16 });
    this.goldIc = icon('gold', 28);
    this.fishIc = icon('food', 30);
    const st = { fontFamily: F.heavy, fontSize: 22, fill: C.paper, stroke: { color: C.ink, width: 6, join: 'round' as const } };
    this.goldText = txt('0', st);
    this.fishText = txt('0', st);
    this.tags.addChild(this.goldIc, this.goldText, this.fishIc, this.fishText);
    this.stamp = new Container();
    const sb = new Graphics().rect(-56, -20, 112, 40).fill(C.red).stroke({ width: 4, color: C.ink });
    sb.rect(-50, -14, 100, 28).stroke({ width: 2, color: C.paper });
    const s = txt('LLENO', { fontFamily: F.poster, fontSize: 30, fill: C.paper, letterSpacing: 2 });
    s.anchor.set(0.5);
    this.stamp.addChild(sb, s);
    this.stamp.rotation = -0.12;
    this.stamp.visible = false;
    this.addChild(hit, shadow, this.fish, this.coins, this.tags, this.stamp);
  }
  set(gold: number, gFill: number, gFull: boolean, fish: number, fFill: number, fFull: boolean) {
    const ng = gold < 1 ? 0 : Math.max(1, Math.min(8, Math.ceil(gFill * 8)));
    const nf = fish < 1 ? 0 : Math.max(1, Math.min(6, Math.ceil(fFill * 6)));
    if (ng !== this.shownG) {
      const grew = ng > this.shownG && this.shownG >= 0;
      this.shownG = ng;
      this.coins.removeChildren().forEach((c) => c.destroy({ children: true }));
      // main stack + a lazy side stack once it's tall
      const stacks = ng > 4 ? [ng - Math.floor(ng / 3), Math.floor(ng / 3)] : [ng];
      stacks.forEach((cnt, si) => {
        for (let i = 0; i < cnt; i++) {
          const g = new Graphics();
          const x = (si ? 30 : -6) + ((i * 7) % 3) * 2 - 2;
          const y = (si ? 6 : 0) - i * 10;
          g.ellipse(x, y, 25, 10).fill(0xb8862a).stroke({ width: 2.5, color: C.ink });
          g.ellipse(x, y - 4, 25, 10).fill(C.yellow).stroke({ width: 2.5, color: C.ink });
          g.ellipse(x, y - 4, 14, 5).stroke({ width: 2, color: 0xb8862a });
          this.coins.addChild(g);
        }
      });
      if (grew) gsap.fromTo(this.coins.scale, { x: 1.15, y: 0.85 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
    }
    if (nf !== this.shownF) {
      const grew = nf > this.shownF && this.shownF >= 0;
      this.shownF = nf;
      this.fish.removeChildren().forEach((c) => c.destroy({ children: true }));
      // pyramid of fish: 3 / 2 / 1
      const slots = [
        [0, 0],
        [24, 2],
        [-22, 4],
        [12, -12],
        [-10, -10],
        [2, -24],
      ];
      for (let i = 0; i < nf; i++) {
        const [fx, fy] = slots[i];
        const g = new Graphics();
        const col = i % 2 ? 0x7fd8ff : 0x9fe6f0;
        g.ellipse(0, 0, 16, 8).fill(col).stroke({ width: 2.5, color: C.ink });
        g.poly([12, 0, 22, -7, 22, 7]).fill(col).stroke({ width: 2.5, color: C.ink });
        g.circle(-9, -2, 1.8).fill(C.ink);
        g.moveTo(-3, -6).quadraticCurveTo(0, 0, -3, 6).stroke({ width: 1.5, color: C.ink, alpha: 0.6 });
        g.position.set(fx, fy);
        g.scale.x = i % 3 === 1 ? -1 : 1;
        g.rotation = (i % 2 ? -1 : 1) * 0.12;
        this.fish.addChild(g);
      }
      if (grew) gsap.fromTo(this.fish.scale, { x: 1.2, y: 0.8 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
    }
    const both = ng > 0 && nf > 0;
    this.coins.x = both ? -26 : 0;
    this.fish.x = both ? 40 : 0;
    this.fish.y = both ? 6 : 0;
    this.coins.visible = ng > 0;
    this.fish.visible = nf > 0;
    // labels (coin and/or fish amounts) above the tallest pile
    const top = Math.min(ng ? -ng * 10 + (ng > 4 ? Math.floor(ng / 3) * 10 : 0) : 0, nf ? -34 : 0) - 26;
    this.goldIc.visible = this.goldText.visible = ng > 0;
    this.fishIc.visible = this.fishText.visible = nf > 0;
    let x = 0;
    if (ng) {
      this.goldText.text = fmt(Math.floor(gold));
      this.goldIc.position.set(x + 14, 0);
      this.goldText.anchor.set(0, 0.5);
      this.goldText.position.set(x + 30, 0);
      x += 36 + this.goldText.width + 10;
    }
    if (nf) {
      this.fishText.text = fmt(Math.floor(fish));
      this.fishIc.position.set(x + 15, 0);
      this.fishText.anchor.set(0, 0.5);
      this.fishText.position.set(x + 32, 0);
      x += 36 + this.fishText.width;
    }
    this.tags.position.set(-x / 2, top);
    const full = (gFull && ng > 0) || (fFull && nf > 0);
    if (full !== this.full) {
      this.full = full;
      this.stamp.visible = full;
      if (full) gsap.fromTo(this.stamp.scale, { x: 2.2, y: 2.2 }, { x: 1, y: 1, duration: 0.25, ease: 'back.out(2)' });
    }
    this.stamp.y = top - 44;
  }
  get empty() {
    return this.shownG <= 0 && this.shownF <= 0;
  }
  tick(dt: number) {
    this.acc += dt;
    if (this.acc < 1 / 12) return;
    this.t += this.acc;
    this.acc = 0;
    if (this.full) this.stamp.rotation = -0.12 + Math.sin(this.t * 6) * 0.04;
    this.tags.y += Math.sin(this.t * 4) * 0.6;
  }
}
