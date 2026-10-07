/**
 * Rigs for bosses 4–6 and field effects (drawn in code, animated on twos like the rest of the battle):
 *  - WardFx: the Arcanista's / Leviatán's layered arcane dome (one hex shell per layer).
 *  - PortalFx: the two rune portals (now: solid, next: ghost) and the link between them.
 *  - InkCatFx: a paper-and-ink cat summoned from the Grimorio (one per part).
 *  - WellFx: a gravity well / black hole / Abisa's lure (swirl pulled to its center).
 *  - GravityFx: low gravity (motes floating up) and the inverted column (chevrons going up).
 *  - StarTellFx: the Estrella's charge: crosshairs on your ship + the glowing core.
 *  - SeaIceFx: the sea freezing around the Leviatán (meter 0..3, full sheet) + the blowhole spout.
 *  - FogEyeFx: Distraxia (violet fog with an eye) and her mark on your module.
 *  - CoreMarker: the ring around the core that matters right now.
 *  - WizardHat / Grimoire decals for the Arcanista.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { C, F } from '../../ui/theme';
import { txt } from '../../ui/widgets';
import { Stepped } from './rigs';
import type { Part, Portals } from '../sim';

const INK = 0x171317;
const ORCHID = 0xc77dff;
const ORCHID_D = 0x6b3d8a;

// ================================================================ Ward
export class WardFx extends Stepped {
  private g = new Graphics();
  private cap: ReturnType<typeof txt>;
  layers: number;
  constructor(public box: { x: number; y: number; w: number; h: number }, public max: number) {
    super();
    this.layers = max;
    this.cap = txt('', { fontFamily: F.poster, fontSize: 26, fill: C.paper, stroke: { color: INK, width: 6 } });
    this.cap.anchor.set(0.5);
    this.addChild(this.g, this.cap);
    this.setLayers(max);
  }
  setLayers(n: number) {
    this.layers = n;
    this.cap.text = n > 0 ? `ESCUDO ARCANO ${n}/${this.max}` : '';
    this.visible = n > 0;
  }
  hit(x: number, y: number) {
    const r = new Graphics();
    r.position.set(x, y);
    this.addChild(r);
    const o = { k: 0 };
    gsap.to(o, {
      k: 1,
      duration: 0.45,
      onUpdate: () => {
        if (r.destroyed) return;
        r.clear();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const rr = 18 + o.k * 90;
          r.poly(hexPts(Math.cos(a) * rr * 0.6, Math.sin(a) * rr * 0.6, 16 * (1 - o.k) + 4)).stroke({ width: 3, color: 0xffffff, alpha: 1 - o.k });
        }
        r.circle(0, 0, 14 + o.k * 70).stroke({ width: 8 * (1 - o.k) + 1, color: ORCHID, alpha: 1 - o.k });
      },
      onComplete: () => r.destroy(),
    });
  }
  pop() {
    const b = this.box;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h * 0.55;
    for (let i = 0; i < 22; i++) {
      const s = new Graphics().poly(hexPts(0, 0, 9)).fill({ color: 0xf2d9ff, alpha: 0.9 }).stroke({ width: 2, color: ORCHID });
      const a = (i / 22) * Math.PI * 2;
      s.position.set(cx + Math.cos(a) * b.w * 0.62, cy + Math.sin(a) * b.h * 0.7);
      this.parent?.addChild(s);
      gsap.to(s, { x: s.x + Math.cos(a) * 180, y: s.y + Math.sin(a) * 130 + 140, rotation: 5, alpha: 0, duration: 0.9, ease: 'power2.out', onComplete: () => s.destroy() });
    }
  }
  protected override step() {
    const g = this.g;
    g.clear();
    if (this.layers <= 0) return;
    const b = this.box;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h * 0.55;
    for (let i = 0; i < this.layers; i++) {
      const k = 1 + i * 0.07;
      const rx = b.w * 0.6 * k;
      const ry = b.h * 0.74 * k;
      const wob = Math.sin(this.t * 1.6 + i) * 4;
      g.ellipse(cx, cy, rx + wob, ry - wob).fill({ color: ORCHID, alpha: 0.06 }).stroke({ width: 4, color: i === this.layers - 1 ? ORCHID : 0xe2b8ff, alpha: 0.75 });
      // hex runes crawling on the shell
      for (let j = 0; j < 10; j++) {
        const a = this.t * (0.25 + i * 0.08) * (i % 2 ? -1 : 1) + (j / 10) * Math.PI * 2;
        if (Math.sin(a) > 0.2) continue; // only the top arc
        g.poly(hexPts(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 9)).stroke({ width: 2, color: 0xffffff, alpha: 0.55 });
      }
    }
    this.cap.position.set(cx, b.y - 60 + Math.sin(this.t * 2) * 3);
  }
}

function hexPts(x: number, y: number, r: number) {
  const out: number[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    out.push(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  return out;
}

// ================================================================ Portals
export class PortalFx extends Stepped {
  private g = new Graphics();
  private tags = new Container();
  now: Portals | null = null;
  next: Portals | null = null;
  constructor() {
    super();
    this.addChild(this.g, this.tags);
  }
  set(now: Portals | null, next: Portals | null) {
    const moved = !!now && (!this.now || now.a.x !== this.now.a.x || now.a.y !== this.now.a.y);
    this.now = now;
    this.next = next;
    this.tags.removeChildren().forEach((c) => c.destroy());
    if (now) {
      for (const [p, t, col] of [
        [now.a, 'SU PORTAL', 0xffb02e],
        [now.b, 'TU PORTAL', 0x00e5ff],
      ] as const) {
        const l = txt(t, { fontFamily: F.poster, fontSize: 18, fill: col, stroke: { color: INK, width: 5 } });
        l.anchor.set(0.5);
        l.position.set(p.x, p.y - now.r - 22);
        this.tags.addChild(l);
      }
      if (moved) {
        this.flash(now.a.x, now.a.y);
        this.flash(now.b.x, now.b.y);
      }
    }
  }
  flash(x: number, y: number) {
    const r = new Graphics().circle(0, 0, 40).fill({ color: 0xffffff, alpha: 0.8 });
    r.position.set(x, y);
    this.addChild(r);
    gsap.to(r.scale, { x: 2.4, y: 2.4, duration: 0.3 });
    gsap.to(r, { alpha: 0, duration: 0.3, onComplete: () => r.destroy() });
  }
  protected override step() {
    const g = this.g;
    g.clear();
    const draw = (p: { x: number; y: number }, r: number, col: number, ghost: boolean, dir: number) => {
      if (ghost) {
        for (let i = 0; i < 16; i++) {
          if (i % 2) continue;
          const a0 = (i / 16) * Math.PI * 2 + this.t * 0.5;
          g.arc(p.x, p.y, r, a0, a0 + Math.PI / 8).stroke({ width: 3, color: col, alpha: 0.55 });
          g.moveTo(p.x + Math.cos(a0 + Math.PI / 8) * r, p.y + Math.sin(a0 + Math.PI / 8) * r);
        }
        return;
      }
      g.circle(p.x, p.y, r + 10).fill({ color: col, alpha: 0.12 });
      g.circle(p.x, p.y, r).fill({ color: INK, alpha: 0.75 }).stroke({ width: 7, color: INK });
      g.circle(p.x, p.y, r - 3).stroke({ width: 4, color: col });
      // swirl
      for (let k = 0; k < 3; k++) {
        const a = this.t * 3 * dir + (k * Math.PI * 2) / 3;
        g.moveTo(p.x, p.y);
        for (let s = 1; s <= 8; s++) {
          const rr = (s / 8) * (r - 8);
          g.lineTo(p.x + Math.cos(a + s * 0.45 * dir) * rr, p.y + Math.sin(a + s * 0.45 * dir) * rr);
        }
        g.stroke({ width: 3, color: col, alpha: 0.85 });
      }
      // runes on the rim
      for (let k = 0; k < 8; k++) {
        const a = -this.t * dir + (k / 8) * Math.PI * 2;
        g.rect(p.x + Math.cos(a) * (r + 2) - 3, p.y + Math.sin(a) * (r + 2) - 3, 6, 6).fill(0xffffff);
      }
    };
    if (this.next) {
      draw(this.next.a, this.next.r, 0xffb02e, true, 1);
      draw(this.next.b, this.next.r, 0x00e5ff, true, -1);
    }
    if (this.now) {
      const n = this.now;
      // dotted link
      for (let i = 1; i < 14; i++) {
        const u = i / 14;
        const x = n.b.x + (n.a.x - n.b.x) * u;
        const y = n.b.y + (n.a.y - n.b.y) * u - Math.sin(u * Math.PI) * 60;
        if ((i + this.frame) % 3) g.circle(x, y, 3).fill({ color: 0xe2b8ff, alpha: 0.7 });
      }
      draw(n.a, n.r, 0xffb02e, false, 1);
      draw(n.b, n.r, 0x00e5ff, false, -1);
    }
  }
}

// ================================================================ Ink cats
export class InkCatFx extends Stepped {
  private g = new Graphics();
  private hurtT = 0;
  dead = true;
  constructor(public part: Part) {
    super();
    this.addChild(this.g);
    this.position.set(part.x, part.y0);
    this.visible = false;
  }
  summon() {
    this.dead = false;
    this.visible = true;
    this.alpha = 1;
    this.position.set(this.part.x, this.part.y0);
    gsap.fromTo(this.scale, { x: 0.1, y: 1.6 }, { x: 1, y: 1, duration: 0.45, ease: 'elastic.out(1.1,0.4)' });
  }
  hurt(destroyed: boolean) {
    this.hurtT = 1;
    if (destroyed && !this.dead) {
      this.dead = true;
      // ink splash
      for (let i = 0; i < 14; i++) {
        const d = new Graphics().circle(0, 0, 5 + Math.random() * 7).fill(INK);
        d.position.set(this.x, this.y);
        this.parent?.addChild(d);
        const a = Math.random() * Math.PI * 2;
        gsap.to(d, { x: d.x + Math.cos(a) * 90, y: d.y + Math.sin(a) * 60 + 160, alpha: 0, duration: 0.8, ease: 'power2.in', onComplete: () => d.destroy() });
      }
      gsap.to(this.scale, { x: 1.6, y: 0.1, duration: 0.25, onComplete: () => void (this.visible = false) });
    }
  }
  protected override step() {
    if (!this.visible) return;
    const g = this.g;
    g.clear();
    const bob = Math.sin(this.t * 2.4 + this.part.id) * 6;
    const flash = this.hurtT > 0 && this.frame % 2 === 0;
    this.hurtT = Math.max(0, this.hurtT - 0.25);
    const col = flash ? 0xffffff : INK;
    const y = bob;
    // paper square it was drawn on (it's a page!)
    g.rect(-40, y - 34, 80, 72).fill({ color: 0xede4d6, alpha: 0.85 }).stroke({ width: 3, color: INK });
    for (let i = 0; i < 5; i++) g.moveTo(-34, y - 22 + i * 13).lineTo(34, y - 22 + i * 13).stroke({ width: 1, color: 0x3569a3, alpha: 0.4 });
    // ink cat: body, head, ears, drippy tail
    g.ellipse(0, y + 12, 24, 16).fill(col);
    g.circle(-14, y - 6, 15).fill(col);
    g.poly([-26, y - 14, -22, y - 30, -14, y - 18]).fill(col);
    g.poly([-10, y - 18, -3, y - 30, -1, y - 12]).fill(col);
    g.moveTo(22, y + 10).quadraticCurveTo(44, y - 6, 34, y - 26).stroke({ width: 7, color: col, cap: 'round' });
    for (let i = 0; i < 3; i++) g.ellipse(-12 + i * 12, y + 30 + ((this.frame + i * 3) % 6) * 2, 3, 5).fill(INK);
    // eyes
    g.ellipse(-19, y - 8, 4, 5).fill(0xffffff);
    g.ellipse(-9, y - 8, 4, 5).fill(0xffffff);
    g.circle(-18, y - 7, 1.8).fill(C.pinkHot);
    g.circle(-8, y - 7, 1.8).fill(C.pinkHot);
    // hp bar
    const hp = Math.max(0, this.part.hp / this.part.maxHp);
    g.rect(-30, y + 44, 60, 8).fill(INK);
    g.rect(-28, y + 46, 56 * hp, 4).fill(hp < 0.35 ? C.red : ORCHID);
  }
}

// ================================================================ Wells / black hole / lure
export class WellFx extends Stepped {
  private g = new Graphics();
  constructor(public wx: number, public wy: number, public r: number, public kind: 'well' | 'hole' | 'lure' | 'sun' | 'horizon') {
    super();
    this.addChild(this.g);
    gsap.from(this.scale, { x: 0, y: 0, duration: 0.5, ease: 'back.out(2)' });
    this.pivot.set(wx, wy);
    this.position.set(wx, wy);
  }
  close() {
    gsap.to(this.scale, { x: 0, y: 0, duration: 0.4, ease: 'back.in(2)', onComplete: () => this.destroy() });
  }
  protected override step() {
    const g = this.g;
    g.clear();
    const x = this.wx;
    const y = this.wy;
    if (this.kind === 'lure') {
      // Abisa's angler light under the waves
      const pulse = 0.6 + 0.4 * Math.sin(this.t * 4);
      g.circle(x, y, 70 * pulse + 30).fill({ color: 0x7fd8ff, alpha: 0.18 });
      g.circle(x, y, 26).fill(0xe6fbff).stroke({ width: 5, color: INK });
      g.moveTo(x, y - 26).quadraticCurveTo(x - 40, y - 90, x - 10, y - 130).stroke({ width: 5, color: INK });
      for (let i = 0; i < 6; i++) {
        const ph = (this.t * 0.7 + i / 6) % 1;
        const a = (i / 6) * Math.PI * 2 + this.t;
        const rr = 260 * (1 - ph);
        g.circle(x + Math.cos(a) * rr, y - 40 + Math.sin(a) * rr * 0.4, 3).fill({ color: 0xc8fbff, alpha: ph });
      }
      return;
    }
    if (this.kind === 'horizon') {
      // Horizonte de Eventos: a big hole over their deck, a pink/cyan accretion disk, light bending into it
      const R = 92;
      const sp = this.t * 1.6;
      for (let k = 0; k < 7; k++) {
        const a0 = sp + (k * Math.PI * 2) / 7;
        g.moveTo(x + Math.cos(a0) * this.r * 0.8, y + Math.sin(a0) * this.r * 0.8 * 0.4);
        for (let s = 1; s <= 18; s++) {
          const u = 1 - s / 18;
          const rr = R + u * (this.r * 0.8 - R);
          const a = a0 + s * 0.3;
          g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.4);
        }
        g.stroke({ width: 4, color: k % 2 ? 0x00e5ff : 0xff2e88, alpha: 0.55 });
      }
      // lensing ring + disk
      g.ellipse(x, y, R * 2.3, R * 0.55).stroke({ width: 16, color: 0xff7ab8, alpha: 0.35 });
      g.ellipse(x, y, R * 2.1, R * 0.48).stroke({ width: 6, color: 0xffe9b0, alpha: 0.9 });
      g.circle(x, y, R + 10).stroke({ width: 10, color: 0xffffff, alpha: 0.25 + 0.15 * Math.sin(this.t * 5) });
      g.circle(x, y, R).fill(0x000000).stroke({ width: 5, color: 0x00e5ff });
      // the front of the disk passes in front of the hole
      g.rect(x - R * 1.6, y - 4, R * 3.2, 8).fill({ color: 0xffe9b0, alpha: 0.85 });
      // static (TV noise) specks falling in
      for (let i = 0; i < 14; i++) {
        const ph = (this.t * 0.6 + i / 14) % 1;
        const a = (i / 14) * Math.PI * 2 + this.t * 0.8;
        const rr = this.r * 0.9 * (1 - ph) + R;
        g.rect(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.45, 5, 3).fill({ color: 0xffffff, alpha: ph });
      }
      return;
    }
    if (this.kind === 'sun') {
      // Sol Caído: the sun sitting on their deck, still burning
      const R = 110 + Math.sin(this.t * 3) * 6;
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2 + this.t * 0.4;
        const len = R + 40 + 26 * Math.sin(this.t * 4 + i * 1.7);
        g.poly([x + Math.cos(a - 0.09) * R * 0.9, y + Math.sin(a - 0.09) * R * 0.9, x + Math.cos(a) * len, y + Math.sin(a) * len, x + Math.cos(a + 0.09) * R * 0.9, y + Math.sin(a + 0.09) * R * 0.9]).fill({ color: i % 2 ? 0xff6a1a : 0xffd400, alpha: 0.85 });
      }
      g.circle(x, y, R * 1.25).fill({ color: 0xffb02e, alpha: 0.22 });
      g.circle(x, y, R).fill(0xffd400).stroke({ width: 6, color: INK });
      g.circle(x, y, R * 0.72).fill(0xfff2c0);
      g.circle(x - R * 0.3, y - R * 0.3, R * 0.18).fill({ color: 0xffffff, alpha: 0.9 });
      return;
    }
    const hole = this.kind === 'hole';
    const R = hole ? 70 : 38;
    // accretion swirl pulled into the center
    const arms = hole ? 5 : 3;
    for (let k = 0; k < arms; k++) {
      const a0 = this.t * (hole ? 2.6 : 1.8) + (k * Math.PI * 2) / arms;
      g.moveTo(x + Math.cos(a0) * this.r * 0.7, y + Math.sin(a0) * this.r * 0.7 * 0.45);
      for (let s = 1; s <= 14; s++) {
        const u = 1 - s / 14;
        const rr = R + u * (this.r * 0.7 - R);
        const a = a0 + s * 0.32;
        g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.45);
      }
      g.stroke({ width: hole ? 4 : 3, color: hole ? 0xff7ab8 : 0xb9a7ff, alpha: 0.65 });
    }
    if (hole) {
      g.ellipse(x, y, R * 1.7, R * 0.5).stroke({ width: 10, color: 0xffb02e, alpha: 0.8 });
      g.circle(x, y, R).fill(0x000000).stroke({ width: 6, color: 0xffd9a0 });
      g.ellipse(x, y, R * 1.7, R * 0.5).stroke({ width: 4, color: 0xffffff, alpha: 0.6 });
    } else {
      g.circle(x, y, R).fill({ color: 0x1a1030, alpha: 0.85 }).stroke({ width: 5, color: 0xb9a7ff });
      g.circle(x, y, R * 0.45).fill(0xb9a7ff);
    }
  }
}

// ================================================================ Field gravity
export class GravityFx extends Stepped {
  private g = new Graphics();
  mode: 0 | 1 | 2 = 0;
  anti: { x0: number; x1: number; y0: number; y1: number } | null = null;
  constructor(public w: number, public h: number) {
    super();
    this.addChild(this.g);
  }
  protected override step() {
    const g = this.g;
    g.clear();
    if (this.mode >= 1) {
      // motes drifting UP: things weigh less
      for (let i = 0; i < 40; i++) {
        const x = (i * 211.7) % this.w;
        const y = this.h - ((this.t * (18 + (i % 5) * 6) + i * 53) % this.h);
        g.circle(x, y, 2 + (i % 3)).fill({ color: 0xe8c45a, alpha: 0.5 });
      }
    }
    const a = this.anti;
    if (this.mode === 2 && a) {
      g.rect(a.x0, a.y0, a.x1 - a.x0, a.y1 - a.y0).fill({ color: ORCHID_D, alpha: 0.16 });
      g.moveTo(a.x0, a.y0).lineTo(a.x0, a.y1).stroke({ width: 3, color: ORCHID, alpha: 0.6 });
      g.moveTo(a.x1, a.y0).lineTo(a.x1, a.y1).stroke({ width: 3, color: ORCHID, alpha: 0.6 });
      // chevrons going up
      for (let cx = a.x0 + 50; cx < a.x1; cx += 120) {
        for (let k = 0; k < 4; k++) {
          const yy = a.y1 - (((this.t * 70 + k * 90) % (a.y1 - a.y0)) as number);
          g.moveTo(cx - 18, yy + 12).lineTo(cx, yy).lineTo(cx + 18, yy + 12).stroke({ width: 4, color: 0xe2b8ff, alpha: 0.7 });
        }
      }
    }
  }
}

// ================================================================ Star rain tell
export class StarTellFx extends Stepped {
  private g = new Graphics();
  targets: { x: number; y: number }[] = [];
  core: { x: number; y: number } | null = null;
  constructor() {
    super();
    this.addChild(this.g);
  }
  set(targets: { x: number; y: number }[], core: { x: number; y: number } | null) {
    this.targets = targets;
    this.core = core;
  }
  protected override step() {
    const g = this.g;
    g.clear();
    for (const p of this.targets) {
      const s = 1 + 0.15 * Math.sin(this.t * 6);
      g.circle(p.x, p.y, 34 * s).stroke({ width: 5, color: INK }).stroke({ width: 3, color: 0xffd400 });
      g.moveTo(p.x - 48, p.y).lineTo(p.x + 48, p.y).moveTo(p.x, p.y - 48).lineTo(p.x, p.y + 48).stroke({ width: 3, color: 0xffd400 });
      // falling streak hint from the sky
      g.moveTo(p.x, 150).lineTo(p.x, p.y - 50).stroke({ width: 2, color: 0xffd400, alpha: 0.25 + 0.2 * Math.sin(this.t * 5) });
    }
    if (this.core) {
      const c = this.core;
      const r = 70 + Math.sin(this.t * 7) * 8;
      g.circle(c.x, c.y, r + 26).fill({ color: 0xffd400, alpha: 0.18 });
      g.star(c.x, c.y, 8, r, r * 0.55, this.t).stroke({ width: 4, color: 0xffd400 });
    }
  }
}

// ================================================================ Sea ice + blowhole
export class SeaIceFx extends Stepped {
  private g = new Graphics();
  level = 0;
  frozen = false;
  spout: { x: number; y: number } | null = null;
  constructor(public x0: number, public x1: number, public waterY: number) {
    super();
    this.addChild(this.g);
  }
  protected override step() {
    const g = this.g;
    g.clear();
    const full = this.frozen ? 1 : this.level / 3;
    if (full > 0) {
      const w = this.x1 - this.x0;
      const cx = (this.x0 + this.x1) / 2;
      const half = (w / 2) * full;
      g.rect(cx - half, this.waterY - 6, half * 2, 26).fill({ color: 0xdff8ff, alpha: 0.85 }).stroke({ width: 3, color: 0x7fd8ff });
      for (let x = cx - half + 20; x < cx + half - 20; x += 46) g.moveTo(x, this.waterY - 2).lineTo(x + 18, this.waterY + 12).lineTo(x + 8, this.waterY + 18).stroke({ width: 2, color: 0x7fd8ff });
    }
    if (this.spout) {
      const s = this.spout;
      for (let i = 0; i < 10; i++) {
        const ph = (this.t * 1.4 + i / 10) % 1;
        const x = s.x + Math.sin(i * 2.1) * 30 * ph;
        const y = s.y - 30 - ph * 190;
        g.circle(x, y, 8 + 10 * ph).fill({ color: 0xc8fbff, alpha: 0.75 * (1 - ph) });
      }
    }
  }
}

// ================================================================ Distraxia
export class FogEyeFx extends Stepped {
  private g = new Graphics();
  private markG = new Graphics();
  private blinkT = 0;
  mark: { x: number; y: number } | null = null;
  markLabel = txt('', { fontFamily: F.poster, fontSize: 24, fill: 0xf2d9ff, stroke: { color: INK, width: 6 } });
  constructor(public part: Part) {
    super();
    this.addChild(this.g, this.markG, this.markLabel);
    this.markLabel.anchor.set(0.5);
    this.visible = false;
  }
  show() {
    this.visible = true;
    gsap.fromTo(this, { alpha: 0 }, { alpha: 1, duration: 0.8 });
  }
  blink() {
    this.blinkT = 1;
  }
  setMark(m: { x: number; y: number } | null) {
    this.mark = m;
    this.markLabel.text = m ? 'DISTRAXIA LO BORRA EN TU PRÓXIMO TURNO' : '';
    if (m) this.markLabel.position.set(m.x, m.y - 90);
  }
  protected override step() {
    if (!this.visible) return;
    const g = this.g;
    g.clear();
    const p = this.part;
    const x = p.x;
    const y = p.y0 + Math.sin(this.t * 1.3) * 8;
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + this.t * 0.4;
      g.circle(x + Math.cos(a) * 62, y + Math.sin(a) * 26, 34 + (i % 3) * 8).fill({ color: 0x6b3d8a, alpha: 0.35 });
    }
    const open = this.blinkT > 0 ? 0.1 : 1;
    this.blinkT = Math.max(0, this.blinkT - 0.12);
    g.ellipse(x, y, 46, 30 * open).fill(0xf2d9ff).stroke({ width: 6, color: INK });
    if (open > 0.5) {
      const look = this.mark ? Math.max(-14, Math.min(14, (this.mark.x - x) / 40)) : Math.sin(this.t) * 10;
      g.circle(x + look, y, 16).fill(0x8a2be2);
      g.ellipse(x + look, y, 5, 14).fill(INK);
    }
    const m = this.markG;
    m.clear();
    if (this.mark) {
      const k = this.mark;
      const pulse = 0.5 + 0.5 * Math.sin(this.t * 6);
      m.circle(k.x, k.y, 58 + pulse * 8).stroke({ width: 6, color: INK }).stroke({ width: 4, color: ORCHID });
      // dotted gaze from the eye
      for (let i = 1; i < 18; i++) {
        const u = i / 18;
        if ((i + this.frame) % 3) m.circle(x + (k.x - x) * u, y + (k.y - y) * u, 3).fill({ color: ORCHID, alpha: 0.7 });
      }
    }
  }
}

// ================================================================ the core that matters now
export class CoreMarker extends Stepped {
  private g = new Graphics();
  private cap = txt('', { fontFamily: F.poster, fontSize: 22, fill: C.yellow, stroke: { color: INK, width: 6 } });
  at: { x: number; y: number } | null = null;
  hot = false;
  constructor() {
    super();
    this.cap.anchor.set(0.5);
    this.addChild(this.g, this.cap);
  }
  set(at: { x: number; y: number } | null, text: string, hot: boolean) {
    this.at = at;
    this.hot = hot;
    this.cap.text = text;
    if (at) this.cap.position.set(at.x, at.y - 74);
  }
  protected override step() {
    const g = this.g;
    g.clear();
    if (!this.at) return;
    const { x, y } = this.at;
    const r = 52 + Math.sin(this.t * (this.hot ? 8 : 3)) * 6;
    g.circle(x, y, r).stroke({ width: 6, color: INK }).stroke({ width: 3, color: this.hot ? C.pinkHot : C.yellow });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + this.t;
      g.moveTo(x + Math.cos(a) * (r + 6), y + Math.sin(a) * (r + 6)).lineTo(x + Math.cos(a) * (r + 20), y + Math.sin(a) * (r + 20)).stroke({ width: 4, color: this.hot ? C.pinkHot : C.yellow });
    }
  }
}

// ================================================================ Arcanista decals
/** pointy hat + floating grimoire on the Arcanista */
export function wizardDecal(size: number, flip: boolean) {
  const c = new Container();
  const g = new Graphics();
  const s = size;
  const dir = flip ? -1 : 1;
  // hat
  g.poly([-s * 0.2, -s * 0.78, s * 0.2, -s * 0.78, dir * s * 0.12, -s * 1.22]).fill(0x3a1f4a).stroke({ width: 4, color: INK, join: 'round' });
  g.ellipse(0, -s * 0.78, s * 0.3, s * 0.06).fill(0x3a1f4a).stroke({ width: 4, color: INK });
  g.star(dir * s * 0.02, -s * 0.95, 5, s * 0.05, s * 0.022).fill(0xffd400);
  c.addChild(g);
  // grimoire floating next to him
  const book = new Graphics();
  book.roundRect(-s * 0.13, -s * 0.09, s * 0.26, s * 0.18, 4).fill(ORCHID_D).stroke({ width: 3, color: INK });
  book.moveTo(0, -s * 0.09).lineTo(0, s * 0.09).stroke({ width: 2, color: INK });
  book.circle(0, 0, s * 0.03).fill(0xffd400);
  book.position.set(dir * s * 0.42, -s * 0.5);
  c.addChild(book);
  gsap.to(book, { y: book.y - 14, duration: 1.1, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  book.on('destroyed', () => gsap.killTweensOf(book));
  return c;
}
