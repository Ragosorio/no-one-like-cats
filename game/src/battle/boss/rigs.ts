/**
 * Boss rigs & field effects drawn in code (GDD 2.10):
 *  - GargoyleWings: stone wings + red eyes on the boss cat; flap when she takes off (phase 3).
 *  - ThroatFx: carved gargoyle mouth over La Garganta + purr meter (RRRRR 1/3) and purr waves.
 *  - KrakenRig: 4 tentacles wrapped on the hull (separate targets), the head with the Eye and beak,
 *    reaching tentacles that grab the player's modules, submerge overlay.
 *  - BubbleFx: Escudo Burbuja / Burbuja de Estática dome (¡CLANK!, break shards).
 *  - RainFx: field rain (gargoyle phase 2, Diluvio Perpetuo) with lightning flashes.
 * All animate on twos (12 fps) like the rest of the battle art.
 */
import { Container, Graphics, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import type { Part } from '../sim';
import { settings } from '../../core/settings';

const INK = 0x171317;

/** stepped ticker helper: calls fn at 12 fps while alive */
export class Stepped extends Container {
  protected t = Math.random() * 10;
  private acc = 0;
  protected frame = 0;
  constructor() {
    super();
    Ticker.shared.add(this.tick, this);
  }
  private tick(tk: Ticker) {
    if (this.destroyed) return;
    this.acc += tk.deltaMS / 1000;
    if (this.acc < 1 / 12) return;
    this.t += this.acc;
    this.acc = 0;
    this.frame++;
    this.step();
  }
  protected step() {}
  override destroy(o?: Parameters<Container['destroy']>[0]) {
    Ticker.shared.remove(this.tick, this);
    gsap.killTweensOf(this);
    super.destroy(o ?? { children: true });
  }
}

// ================================================================ Gargoyle
export class GargoyleWings extends Stepped {
  private l = new Graphics();
  private r = new Graphics();
  private eyes = new Graphics();
  flying = false;
  constructor(public size: number, public flip: boolean) {
    super();
    this.addChild(this.l, this.r);
    this.drawWing(this.l, -1);
    this.drawWing(this.r, 1);
    this.l.position.set(-size * 0.12, -size * 0.58);
    this.r.position.set(size * 0.12, -size * 0.58);
    this.step();
  }
  /** overlay drawn ABOVE the cat (red eyes) */
  eyesLayer() {
    const s = this.size;
    const g = this.eyes;
    g.clear();
    const dir = this.flip ? -1 : 1;
    for (const ex of [-0.09, 0.08]) {
      g.circle(dir * s * ex, -s * 0.62, s * 0.05).fill({ color: 0xff2020, alpha: 0.35 });
      g.ellipse(dir * s * ex, -s * 0.62, s * 0.022, s * 0.016).fill(0xff3a2a);
    }
    return g;
  }
  private drawWing(g: Graphics, side: number) {
    const s = this.size;
    const w = s * 0.62;
    const h = s * 0.5;
    g.clear();
    // stone wing membrane with 3 fingers
    const pts: [number, number][] = [
      [0, 0],
      [side * w * 0.35, -h * 0.55],
      [side * w * 0.8, -h * 0.75],
      [side * w, -h * 0.35],
      [side * w * 0.82, -h * 0.05],
      [side * w * 0.9, h * 0.25],
      [side * w * 0.62, h * 0.12],
      [side * w * 0.55, h * 0.42],
      [side * w * 0.32, h * 0.2],
      [side * w * 0.18, h * 0.38],
    ];
    g.poly(pts.flat()).fill(0x6f6a5e).stroke({ width: 5, color: INK, join: 'round' });
    // bones
    for (const [x, y] of [pts[2], pts[4], pts[6], pts[8]]) g.moveTo(0, 0).lineTo(x, y).stroke({ width: 3, color: 0x4a463e, cap: 'round' });
    // light rim + moss + cracks
    g.moveTo(0, 0).lineTo(pts[1][0], pts[1][1]).lineTo(pts[2][0], pts[2][1]).stroke({ width: 3, color: 0xc4bdab, cap: 'round' });
    g.ellipse(side * w * 0.5, -h * 0.25, w * 0.1, h * 0.06).fill(0x5f9f52);
    g.moveTo(side * w * 0.6, -h * 0.5).lineTo(side * w * 0.66, -h * 0.35).lineTo(side * w * 0.6, -h * 0.25).stroke({ width: 1.6, color: INK, alpha: 0.7 });
  }
  protected override step() {
    const fl = this.flying ? Math.sin(this.frame * 1.1) : Math.sin(this.t * 1.2) * 0.12;
    const a = this.flying ? 0.35 + fl * 0.45 : 0.15 + fl * 0.1;
    this.l.rotation = a;
    this.r.rotation = -a;
    this.l.scale.y = this.flying ? 0.85 + fl * 0.2 : 0.75;
    this.r.scale.y = this.l.scale.y;
  }
}

/** carved gargoyle mouth over the throat module + purr pips */
export class ThroatFx extends Stepped {
  private mouth = new Graphics();
  private waves = new Graphics();
  private pips = new Container();
  private caption: ReturnType<typeof txt>;
  purr = 0;
  purring = 0;
  dead = false;
  constructor(public w: number, public h: number) {
    super();
    this.addChild(this.waves, this.mouth, this.pips);
    this.caption = txt('RRR 0/3', { fontFamily: F.comic, fontSize: 30, fill: C.mint, stroke: { color: INK, width: 6 } });
    this.caption.anchor.set(0.5);
    this.caption.position.set(0, -h * 0.5 - 70);
    this.addChild(this.caption);
    this.drawMouth();
    this.setPurr(0);
  }
  private drawMouth() {
    const { w, h } = this;
    const g = this.mouth;
    g.clear();
    // brow + snout frame
    g.roundRect(-w * 0.55, -h * 0.55, w * 1.1, h * 1.1, 18).stroke({ width: 7, color: INK }).stroke({ width: 4, color: 0x9a9384 });
    g.moveTo(-w * 0.5, -h * 0.25).lineTo(-w * 0.15, -h * 0.4).lineTo(0, -h * 0.28).lineTo(w * 0.15, -h * 0.4).lineTo(w * 0.5, -h * 0.25).stroke({ width: 6, color: INK, join: 'round' });
    // fangs
    for (const fx of [-0.3, -0.12, 0.12, 0.3]) g.poly([w * fx - 7, h * 0.18, w * fx + 7, h * 0.18, w * fx, h * 0.42]).fill(0xede4d6).stroke({ width: 2.5, color: INK });
    for (const fx of [-0.2, 0.2]) g.poly([w * fx - 6, h * 0.52, w * fx + 6, h * 0.52, w * fx, h * 0.3]).fill(0xede4d6).stroke({ width: 2.5, color: INK });
  }
  setPurr(n: number) {
    this.purr = n;
    this.pips.removeChildren().forEach((c) => c.destroy());
    for (let i = 0; i < 3; i++) {
      const g = new Graphics().circle(0, 0, 11).fill(i < n ? C.mint : 0x3a3630).stroke({ width: 4, color: INK });
      g.position.set((i - 1) * 30, -this.h * 0.5 - 34);
      this.pips.addChild(g);
    }
    this.caption.text = this.dead ? 'GARGANTA ROTA' : `RRR ${n}/3`;
    this.caption.style.fill = n >= 2 ? C.pinkHot : C.mint;
    if (n > 0) gsap.fromTo(this.pips.scale, { x: 1.4, y: 1.4 }, { x: 1, y: 1, duration: 0.35, ease: 'back.out(3)' });
  }
  /** big purr: waves for a while */
  pulse(dur = 1.4) {
    this.purring = dur;
  }
  kill() {
    this.dead = true;
    this.setPurr(0);
    this.pips.visible = false;
    this.mouth.alpha = 0.35;
  }
  protected override step() {
    const g = this.waves;
    g.clear();
    if (this.purring > 0) {
      this.purring -= 1 / 12;
      for (let i = 0; i < 3; i++) {
        const ph = ((this.t * 1.6 + i / 3) % 1);
        const r = this.w * 0.6 + ph * 120;
        g.arc(0, 0, r, -Math.PI * 0.9, -Math.PI * 0.1).stroke({ width: 6 * (1 - ph), color: C.mint, alpha: 1 - ph });
      }
    }
  }
}

// ================================================================ Kraken
interface TentacleView {
  part: Part;
  g: Graphics;
  hurt: number;
  dead: boolean;
  seed: number;
}

export class KrakenRig extends Stepped {
  /** behind the ship: the mantle */
  back = new Container();
  /** in front of the ship: tentacles + head + eye */
  front = new Container();
  private tents: TentacleView[] = [];
  private head = new Graphics();
  private eyeG = new Graphics();
  private grabs = new Map<number, { g: Graphics; x: number; y: number; top: number; seed: number }>();
  /** where reaching tentacles live (world layer above the player's ship) */
  grabLayer = new Container();
  eyeState: 'closed' | 'tell' | 'open' = 'closed';
  private blink = 0;
  dazed = 0;
  submerged = false;
  private sub = new Graphics();
  constructor(parts: Part[], public waterY: number, public shipBox: { x: number; y: number; w: number; h: number }) {
    super();
    this.addChild(this.front, this.grabLayer);
    for (const p of parts) {
      if (p.kind === 'tentacle') {
        const g = new Graphics();
        this.front.addChild(g);
        this.tents.push({ part: p, g, hurt: 0, dead: false, seed: p.id * 1.7 });
      }
    }
    const eye = parts.find((p) => p.kind === 'eye');
    if (eye) {
      this.head.position.set(eye.x - 70, eye.y0 + 120);
      this.eyeG.position.set(eye.x, eye.y0);
    }
    // the mantle and its giant eye live BEHIND the ship (the scene re-parents `back`)
    this.back.addChild(this.head, this.eyeG);
    this.front.addChild(this.sub);
    this.drawHead();
    this.step();
  }
  private drawHead() {
    const g = this.head;
    g.clear();
    // giant mantle rising behind the hull
    g.ellipse(0, 0, 280, 230).fill(0x7a3f9a).stroke({ width: 8, color: INK });
    g.ellipse(-70, -90, 120, 60).fill({ color: 0xd8a8ee, alpha: 0.35 });
    for (let i = 0; i < 9; i++) {
      const a = -2.6 + i * 0.32;
      g.circle(Math.cos(a) * 200, Math.sin(a) * 160 + 30, 9 + (i % 3) * 3).fill(0xb987d6).stroke({ width: 2.5, color: INK });
    }
    // brow ridges
    g.moveTo(10, -190).quadraticCurveTo(70, -215, 140, -185).stroke({ width: 12, color: INK, cap: 'round' });
    g.moveTo(10, -190).quadraticCurveTo(70, -215, 140, -185).stroke({ width: 6, color: 0x9b5ab8, cap: 'round' });
  }
  private drawEye() {
    const g = this.eyeG;
    g.clear();
    const R = 52;
    if (this.eyeState === 'open') {
      g.circle(0, 0, R + 12).fill({ color: 0xffd400, alpha: 0.3 });
      g.circle(0, 0, R).fill(0xfff3b0).stroke({ width: 7, color: INK });
      const look = Math.sin(this.t * 2) * 8;
      g.ellipse(look - 10, 0, 12, R * 0.82).fill(INK);
      g.circle(look - 18, -14, 7).fill(0xffffff);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.moveTo(Math.cos(a) * (R - 4), Math.sin(a) * (R - 4)).lineTo(Math.cos(a) * (R - 16), Math.sin(a) * (R - 16)).stroke({ width: 2, color: 0xd8462a, alpha: 0.6 });
      }
      // target marker
      if (this.frame % 6 < 4) g.circle(0, 0, R + 22).stroke({ width: 5, color: C.pinkHot });
    } else {
      const glow = this.eyeState === 'tell' ? 0.6 + 0.4 * Math.sin(this.frame) : 0;
      if (glow) g.circle(0, 0, R + 18).fill({ color: 0xffd400, alpha: 0.35 * glow });
      // closed lid with lashes
      g.ellipse(0, 0, R, R * 0.42).fill(0x6a3488).stroke({ width: 7, color: INK });
      g.moveTo(-R, 0).quadraticCurveTo(0, 18, R, 0).stroke({ width: 5, color: INK });
      for (let i = -2; i <= 2; i++) g.moveTo(i * 16, 9).lineTo(i * 20, 22).stroke({ width: 4, color: INK, cap: 'round' });
      if (glow) g.moveTo(-R * 0.6, 4).quadraticCurveTo(0, 12, R * 0.6, 4).stroke({ width: 4, color: 0xffd400 });
      if (this.dazed > 0) {
        for (let i = 0; i < 3; i++) {
          const a = this.t * 4 + (i * Math.PI * 2) / 3;
          g.star(Math.cos(a) * 60, -40 + Math.sin(a) * 12, 5, 9, 4).fill(C.yellow).stroke({ width: 2, color: INK });
        }
      }
    }
  }
  setEye(s: KrakenRig['eyeState']) {
    this.eyeState = s;
    if (s === 'open') gsap.fromTo(this.eyeG.scale, { x: 1, y: 0.2 }, { x: 1, y: 1, duration: 0.3, ease: 'back.out(3)' });
  }
  hurtTentacle(id: number, destroyed: boolean) {
    const t = this.tents.find((k) => k.part.id === id);
    if (!t || t.dead) return;
    t.hurt = 1;
    if (destroyed) {
      t.dead = true;
      const g = t.g;
      gsap.to(g, { y: g.y + 260, rotation: (t.part.id % 2 ? 1 : -1) * 0.4, alpha: 0, duration: 1.1, ease: 'power2.in' });
    }
  }
  tentacleTop(id: number) {
    const t = this.tents.find((k) => k.part.id === id);
    return t ? { x: t.part.x, y: Math.min(t.part.y0, t.part.y1) } : null;
  }
  /** a tentacle rises from the sea next to the grabbed module and wraps it */
  grab(id: number, x: number, y: number) {
    this.release(id);
    const g = new Graphics();
    this.grabLayer.addChild(g);
    const rec = { g, x, y, top: this.waterY + 40, seed: id * 2.3 };
    this.grabs.set(id, rec);
    gsap.to(rec, { top: y - 30, duration: 0.45, ease: 'back.out(1.6)' });
  }
  release(id: number) {
    const r = this.grabs.get(id);
    if (!r) return;
    this.grabs.delete(id);
    gsap.to(r, { top: this.waterY + 60, duration: 0.35, ease: 'power2.in', onComplete: () => r.g.destroy() });
  }
  setSubmerged(on: boolean) {
    this.submerged = on;
  }
  protected override step() {
    for (const t of this.tents) {
      if (t.dead) continue;
      drawTentacle(t.g, t.part.x, t.part.y0, Math.min(t.part.y0, t.part.y1), this.t, t.seed, t.part.id % 2 ? 1 : -1, t.hurt > 0 && this.frame % 2 === 0, t.part.hp / t.part.maxHp);
      t.hurt = Math.max(0, t.hurt - 0.2);
    }
    for (const r of this.grabs.values()) {
      if (r.g.destroyed) continue;
      drawTentacle(r.g, r.x + 30, this.waterY + 40, r.top, this.t, r.seed, -1, false, 1, true);
    }
    if (this.dazed > 0) this.dazed -= 1 / 12;
    this.blink++;
    this.drawEye();
    const s = this.sub;
    s.clear();
    if (this.submerged) {
      const b = this.shipBox;
      const top = b.y + 30 + Math.sin(this.t * 2) * 6;
      s.rect(b.x - 30, top, b.w + 60, this.waterY - top + 30).fill({ color: 0x0d4a7a, alpha: 0.42 });
      for (let x = b.x - 30; x < b.x + b.w + 30; x += 36) s.moveTo(x, top + Math.sin(x / 40 + this.t * 3) * 5).lineTo(x + 24, top + Math.sin((x + 24) / 40 + this.t * 3) * 5).stroke({ width: 4, color: 0x7fd8ff });
      for (let i = 0; i < 8; i++) {
        const ph = (this.t * 0.6 + i / 8) % 1;
        s.circle(b.x + ((i * 97) % b.w), this.waterY - ph * (this.waterY - top), 4 + (i % 3) * 2).stroke({ width: 2, color: 0xc8fbff, alpha: 1 - ph });
      }
    }
  }
}

function drawTentacle(g: Graphics, x: number, base: number, top: number, t: number, seed: number, side: number, flash: boolean, hp: number, reach = false) {
  g.clear();
  const h = Math.max(20, base - top);
  const n = 12;
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const sway = Math.sin(t * 1.8 + u * 3.2 + seed) * 12 * u;
    const curl = u > 0.7 ? Math.sin((u - 0.7) * 10) * (reach ? 46 : 26) * side : 0;
    pts.push([x + sway + curl, base - u * h]);
  }
  const col = flash ? 0xffffff : hp < 0.35 ? 0xc46a7a : 0x9b5ab8;
  for (const pass of [0, 1]) {
    for (let i = 0; i < n; i++) {
      const w = (1 - i / n) * 30 + 7;
      g.moveTo(pts[i][0], pts[i][1]).lineTo(pts[i + 1][0], pts[i + 1][1]).stroke({ width: pass ? w : w + 7, color: pass ? col : INK, cap: 'round' });
    }
  }
  for (let i = 1; i < n - 1; i++) {
    const w = (1 - i / n) * 30 + 7;
    g.circle(pts[i][0] - side * w * 0.25, pts[i][1], Math.max(2, w * 0.18)).fill(0xd8a8ee).stroke({ width: 1.4, color: INK });
  }
  if (!reach && hp < 1) {
    // little hp bar on the tentacle tip
    const tx = pts[n][0];
    const ty = pts[n][1] - 22;
    g.rect(tx - 24, ty, 48, 8).fill(INK);
    g.rect(tx - 22, ty + 2, 44 * Math.max(0, hp), 4).fill(hp < 0.35 ? C.red : C.mint);
  }
}

// ================================================================ Bubble shield
export class BubbleFx extends Stepped {
  private dome = new Graphics();
  private arcs = new Graphics();
  active = false;
  constructor(public box: { x: number; y: number; w: number; h: number }, public kind: 'bubble' | 'static') {
    super();
    this.addChild(this.dome, this.arcs);
    this.alpha = 0;
  }
  private get col() {
    return this.kind === 'static' ? 0xffe14a : C.cyan;
  }
  setOn(on: boolean) {
    if (on === this.active) return;
    this.active = on;
    gsap.to(this, { alpha: on ? 1 : 0, duration: 0.3 });
    if (on) gsap.fromTo(this.scale, { x: 0.7, y: 0.7 }, { x: 1, y: 1, duration: 0.4, ease: 'back.out(2)' });
  }
  /** blocked an impact at (x, y): ripple */
  block(x: number, y: number) {
    const r = new Graphics();
    r.position.set(x, y);
    this.addChild(r);
    const o = { k: 0 };
    gsap.to(o, {
      k: 1,
      duration: 0.5,
      onUpdate: () => {
        if (r.destroyed) return;
        r.clear();
        r.circle(0, 0, 20 + o.k * 110).stroke({ width: 10 * (1 - o.k) + 2, color: 0xffffff, alpha: 1 - o.k });
        r.circle(0, 0, 10 + o.k * 70).stroke({ width: 6 * (1 - o.k) + 1, color: this.col, alpha: 1 - o.k });
      },
      onComplete: () => r.destroy(),
    });
  }
  shatter() {
    const b = this.box;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    for (let i = 0; i < 18; i++) {
      const s = new Graphics().poly([0, -10, 7, 6, -6, 8]).fill({ color: 0xe6fbff, alpha: 0.9 }).stroke({ width: 2, color: this.col });
      const a = (i / 18) * Math.PI * 2;
      s.position.set(cx + Math.cos(a) * b.w * 0.55, cy + Math.sin(a) * b.h * 0.6);
      this.parent?.addChild(s);
      gsap.to(s, { x: s.x + Math.cos(a) * 160, y: s.y + Math.sin(a) * 120 + 120, rotation: 4, alpha: 0, duration: 0.8, ease: 'power2.out', onComplete: () => s.destroy() });
    }
    this.active = false;
    this.alpha = 0;
  }
  protected override step() {
    const b = this.box;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h * 0.55;
    const rx = b.w * 0.6;
    const ry = b.h * 0.72;
    const g = this.dome;
    g.clear();
    if (!this.active && this.alpha <= 0.01) return;
    const wob = Math.sin(this.t * 2) * 4;
    g.ellipse(cx, cy, rx + wob, ry - wob).fill({ color: this.col, alpha: 0.1 }).stroke({ width: 5, color: this.col, alpha: 0.8 });
    g.ellipse(cx, cy, rx + wob - 10, ry - wob - 10).stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
    // specular highlight
    g.ellipse(cx - rx * 0.45, cy - ry * 0.55, rx * 0.18, ry * 0.07).fill({ color: 0xffffff, alpha: 0.55 });
    const a = this.arcs;
    a.clear();
    if (this.kind === 'static' && this.frame % 2 === 0) {
      for (let k = 0; k < 3; k++) {
        const ang = this.t * 1.3 + k * 2.1 + this.frame * 0.3;
        let x = cx + Math.cos(ang) * rx;
        let y = cy + Math.sin(ang) * ry;
        a.moveTo(x, y);
        for (let j = 0; j < 4; j++) {
          x += (Math.random() - 0.5) * 40;
          y += (Math.random() - 0.5) * 40;
          a.lineTo(x, y);
        }
        a.stroke({ width: 3, color: 0xffffff }).stroke({ width: 1.5, color: 0xffe14a });
      }
    }
  }
}

// ================================================================ Rain
export class RainFx extends Stepped {
  private g = new Graphics();
  private shade = new Graphics();
  active = false;
  private bolt = 0;
  constructor(public w: number, public h: number) {
    super();
    this.addChild(this.shade, this.g);
    this.alpha = 0;
  }
  setOn(on: boolean) {
    if (on === this.active) return;
    this.active = on;
    gsap.to(this, { alpha: on ? 1 : 0, duration: 0.6 });
  }
  /** sky lightning flash */
  lightning() {
    this.bolt = 3;
  }
  protected override step() {
    if (!this.active && this.alpha <= 0.01) return;
    const g = this.g;
    g.clear();
    const n = settings.reduceMotion ? 50 : 140;
    for (let i = 0; i < n; i++) {
      const x = ((i * 137.5 + this.frame * 46) % (this.w + 200)) - 100;
      const y = ((i * 71.3 + this.frame * 130) % (this.h + 100)) - 50;
      g.moveTo(x, y).lineTo(x - 10, y + 34).stroke({ width: 2, color: 0xc6e6ff, alpha: 0.55 });
    }
    const t = this.shade;
    t.clear();
    t.rect(0, 0, this.w, this.h).fill({ color: 0x0d1a2a, alpha: 0.18 });
    if (this.bolt > 0) {
      this.bolt--;
      if (!settings.reduceFlashes) t.rect(0, 0, this.w, this.h).fill({ color: 0xffffff, alpha: 0.18 * this.bolt });
      let x = 300 + ((this.frame * 397) % (this.w - 600));
      let y = 0;
      t.moveTo(x, y);
      while (y < this.h * 0.45) {
        x += (Math.random() - 0.5) * 80;
        y += 40 + Math.random() * 30;
        t.lineTo(x, y);
      }
      t.stroke({ width: 7, color: INK }).stroke({ width: 3, color: 0xffe14a });
    }
  }
}
