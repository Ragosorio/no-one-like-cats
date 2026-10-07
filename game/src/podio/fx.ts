/**
 * El Podio — attack effects (cat vs cat, NOT lobbed cannonballs): beams, slashes, orbs, rocks from the
 * sky, sniper reticles, hypnosis spirals, spirits, heals, fur shields and the ULTI cut-in.
 * Every effect runs on a gsap timeline scaled by the battle speed (×0.5 … ×4). Each call resolves
 * at its IMPACT moment; tails (fade-outs) keep playing on their own.
 */
import { Container, Graphics, Sprite, Text, TilingSprite } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../core/App';
import { C, F } from '../ui/theme';
import { txt } from '../ui/widgets';
import { elementFx, catTexture } from '../art/catArt';
import { glowTexture, sparkTexture, dotTexture, halftoneTexture } from '../art/textures';
import { Particles } from '../fx/particles';
import { ELEMENT_BY_ID } from '../data/content';
import { settings } from '../core/settings';
import { applyCatTint } from '../art/tint';
import { livingCat } from '../art/catArt';

export type P2 = { x: number; y: number };

export function elColor(el: string) {
  return elementFx(el === 'storm' ? 'storm' : el);
}

export class PodioFx {
  constructor(
    public layer: Container,
    public particles: Particles,
    public speed: () => number,
  ) {}

  private tl(onDone?: () => void) {
    const t = gsap.timeline({ onComplete: onDone });
    t.timeScale(this.speed());
    return t;
  }
  private add<T extends Container>(o: T) {
    this.layer.addChild(o);
    return o;
  }

  /** burst + onomatopoeia at the impact point */
  impact(at: P2, el: string, o: { crit?: boolean; super?: boolean; small?: boolean } = {}) {
    const f = elColor(el);
    const n = o.small ? 8 : o.crit ? 26 : 16;
    this.particles.burst(at.x, at.y, { count: n, tint: [f.main, f.accent, 0xffffff], speed: [250, o.crit ? 900 : 650], life: [0.25, 0.6], gravity: 600, scale: [0.3, 0.8], blend: 'add', stepped: true });
    if (!o.small) {
      this.particles.burst(at.x, at.y, { count: 6, texture: sparkTexture(), tint: [0xffffff, f.accent], speed: [100, 400], life: [0.3, 0.5], gravity: 0, scale: [0.5, 1.1] });
      const ring = this.add(new Graphics().circle(0, 0, 60).stroke({ width: 10, color: f.accent }));
      ring.position.set(at.x, at.y);
      ring.scale.set(0.3);
      const t = this.tl(() => ring.destroy());
      t.to(ring.scale, { x: o.crit ? 2.6 : 1.8, y: o.crit ? 2.6 : 1.8, duration: 0.3, ease: 'power2.out' }, 0).to(ring, { alpha: 0, duration: 0.3 }, 0);
    }
  }

  /** shout word (element onomatopoeia) */
  word(at: P2, el: string, size = 96, forced?: string) {
    const list = ELEMENT_BY_ID.get(el)?.onomatopoeia ?? ['¡PUM!'];
    const w = forced ?? list[Math.floor(Math.random() * list.length)] ?? '¡PUM!';
    const f = elColor(el);
    const c = new Container();
    const mk = (fill: number, dx: number, dy: number) => {
      const t = txt(w, { fontFamily: F.comic, fontSize: size, fill, stroke: { color: C.ink, width: size / 9, join: 'round' }, letterSpacing: 2 });
      t.anchor.set(0.5);
      t.position.set(dx, dy);
      return t;
    };
    const ga = mk(C.cyan, -5, 3);
    const gb = mk(C.pinkHot, 5, -3);
    ga.alpha = gb.alpha = 0.8;
    c.addChild(ga, gb, mk(f.accent, 0, 0));
    c.position.set(at.x, at.y);
    c.rotation = (Math.random() - 0.5) * 0.4;
    c.scale.set(0.1);
    this.add(c);
    this.tl(() => c.destroy({ children: true }))
      .to(c.scale, { x: 1.15, y: 1.15, duration: 0.12, ease: 'back.out(5)' })
      .to(c.scale, { x: 1, y: 1, duration: 0.12 })
      .to(c, { y: at.y - 40, duration: 0.5 }, 0.1)
      .to(c, { alpha: 0, duration: 0.2 }, 0.55);
  }

  /** straight energy beam from → to */
  beam(from: P2, to: P2, el: string, width = 46): Promise<void> {
    const f = elColor(el);
    const len = Math.hypot(to.x - from.x, to.y - from.y);
    const ang = Math.atan2(to.y - from.y, to.x - from.x);
    const c = this.add(new Container());
    c.position.set(from.x, from.y);
    c.rotation = ang;
    const outer = new Graphics().roundRect(0, -width / 2, len, width, width / 2).fill(f.main).stroke({ width: 5, color: C.ink });
    const core = new Graphics().roundRect(0, -width / 5, len, (width * 2) / 5, width / 5).fill(0xffffff);
    const glow = new Sprite(glowTexture());
    glow.anchor.set(0.5);
    glow.tint = f.accent;
    glow.blendMode = 'add';
    glow.scale.set(2.2);
    c.addChild(outer, core, glow);
    outer.scale.x = core.scale.x = 0;
    return new Promise((res) => {
      const t = this.tl(() => c.destroy({ children: true }));
      t.to([outer.scale, core.scale], { x: 1, duration: 0.16, ease: 'power3.in' }, 0)
        .call(res, [], 0.16)
        .to(outer.scale, { y: 1.5, duration: 0.08, yoyo: true, repeat: 3 }, 0.16)
        .to(c, { alpha: 0, duration: 0.2 }, 0.42);
    });
  }

  /** glowing orb that arcs to the target with a trail */
  orb(from: P2, to: P2, el: string, r = 34): Promise<void> {
    const f = elColor(el);
    const o = this.add(new Container());
    const g = new Graphics().circle(0, 0, r).fill(f.main).stroke({ width: 5, color: C.ink }).circle(-r * 0.3, -r * 0.3, r * 0.35).fill(0xffffff);
    const glow = new Sprite(glowTexture());
    glow.anchor.set(0.5);
    glow.tint = f.accent;
    glow.blendMode = 'add';
    glow.scale.set((r / 40) * 1.8);
    o.addChild(glow, g);
    o.position.set(from.x, from.y);
    const p = { k: 0 };
    const mid = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 220 };
    let acc = 0;
    return new Promise((res) => {
      const t = this.tl(() => {
        o.destroy({ children: true });
        res();
      });
      t.to(p, {
        k: 1,
        duration: 0.42,
        ease: 'power1.in',
        onUpdate: () => {
          const k = p.k;
          o.x = (1 - k) * (1 - k) * from.x + 2 * (1 - k) * k * mid.x + k * k * to.x;
          o.y = (1 - k) * (1 - k) * from.y + 2 * (1 - k) * k * mid.y + k * k * to.y;
          o.rotation += 0.3;
          if (++acc % 2 === 0) this.particles.burst(o.x, o.y, { count: 1, tint: [f.main, f.accent], speed: [10, 60], life: [0.2, 0.35], gravity: 0, scale: [0.4, 0.7], blend: 'add' });
        },
      });
    });
  }

  /** three anime slash crescents over the target */
  slash(to: P2, el: string, n = 3): Promise<void> {
    const f = elColor(el);
    return new Promise((res) => {
      const t = this.tl();
      for (let i = 0; i < n; i++) {
        const g = this.add(new Graphics());
        const a = -0.7 + i * 0.55 + (Math.random() - 0.5) * 0.2;
        g.position.set(to.x + (i - 1) * 30, to.y + (i - 1) * 20);
        g.rotation = a;
        g.moveTo(-190, 0).quadraticCurveTo(0, -70, 190, 0).quadraticCurveTo(0, -28, -190, 0).fill(0xffffff).stroke({ width: 4, color: f.main });
        g.scale.set(0.2, 1);
        g.alpha = 0;
        t.to(g, { alpha: 1, duration: 0.03 }, i * 0.08)
          .to(g.scale, { x: 1.2, duration: 0.1, ease: 'power3.out' }, i * 0.08)
          .to(g, { alpha: 0, duration: 0.18, onComplete: () => g.destroy() }, i * 0.08 + 0.12);
      }
      t.call(res, [], 0.1);
    });
  }

  /** a rock / meteor falls on the target */
  crush(to: P2, el: string): Promise<void> {
    const f = elColor(el);
    const rock = this.add(new Graphics());
    const pts: number[] = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const r = 70 + ((i * 37) % 5) * 9;
      pts.push(Math.cos(a) * r, Math.sin(a) * r);
    }
    rock.poly(pts).fill(el === 'cosmic' ? 0x5c3d5b : 0x8a5a30).stroke({ width: 6, color: C.ink });
    rock.poly(pts.map((v) => v * 0.45)).fill({ color: f.accent, alpha: 0.6 });
    rock.position.set(to.x + 120, -200);
    return new Promise((res) => {
      const t = this.tl(() => rock.destroy());
      t.to(rock, { x: to.x, y: to.y - 30, rotation: 2.2, duration: 0.32, ease: 'power2.in' })
        .call(res)
        .to(rock.scale, { x: 1.3, y: 0.6, duration: 0.06 })
        .to(rock, { alpha: 0, duration: 0.18 });
    });
  }

  /** sniper reticle then a thin, fast line */
  snipe(from: P2, to: P2, el: string): Promise<void> {
    const f = elColor(el);
    const ret = this.add(new Graphics());
    ret.circle(0, 0, 70).stroke({ width: 5, color: C.red }).circle(0, 0, 8).fill(C.red);
    for (const a of [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]) ret.moveTo(Math.cos(a) * 40, Math.sin(a) * 40).lineTo(Math.cos(a) * 100, Math.sin(a) * 100);
    ret.stroke({ width: 5, color: C.red });
    ret.position.set(to.x, to.y);
    ret.scale.set(2.2);
    ret.alpha = 0;
    return new Promise((res) => {
      const t = this.tl(() => ret.destroy());
      t.to(ret, { alpha: 1, duration: 0.1 })
        .to(ret.scale, { x: 1, y: 1, duration: 0.3, ease: 'power3.out' }, 0)
        .to(ret, { rotation: 0.6, duration: 0.3 }, 0)
        .call(() => void this.beam(from, to, el, 14).then(res), [], 0.34)
        .to(ret, { alpha: 0, duration: 0.15 }, 0.5);
      void f;
    });
  }

  /** hypnotic spiral (controllers) */
  spiral(to: P2, el: string): Promise<void> {
    const f = elColor(el);
    const g = this.add(new Graphics());
    for (let i = 0; i < 3; i++) {
      g.moveTo(0, 0);
      for (let k = 0; k < 60; k++) {
        const a = k * 0.25 + (i * Math.PI * 2) / 3;
        const r = k * 2.6;
        g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
    }
    g.stroke({ width: 8, color: f.accent }).stroke({ width: 2, color: C.ink });
    g.position.set(to.x, to.y - 40);
    g.scale.set(0.2);
    return new Promise((res) => {
      const t = this.tl(() => g.destroy());
      t.to(g.scale, { x: 1.4, y: 1.4, duration: 0.35, ease: 'back.out(2)' }, 0)
        .to(g, { rotation: 6, duration: 0.7, ease: 'none' }, 0)
        .call(res, [], 0.3)
        .to(g, { alpha: 0, duration: 0.2 }, 0.55);
    });
  }

  /** stun stars circling over a head (until cleared) */
  stunStars(at: P2): Container {
    const c = this.add(new Container());
    for (let i = 0; i < 3; i++) {
      const s = new Sprite(sparkTexture());
      s.anchor.set(0.5);
      s.tint = C.yellow;
      s.scale.set(0.55);
      c.addChild(s);
    }
    c.position.set(at.x, at.y);
    let t = 0;
    const tick = () => {
      if (c.destroyed) return gsap.ticker.remove(tick);
      t += 0.06;
      c.children.forEach((s, i) => {
        const a = t * 3 + (i * Math.PI * 2) / 3;
        s.position.set(Math.cos(a) * 70, Math.sin(a) * 20);
        s.alpha = Math.sin(a) > 0 ? 1 : 0.55;
      });
    };
    gsap.ticker.add(tick);
    return c;
  }

  /** a spirit that floats next to the summoner (persistent until removed) */
  spirit(at: P2, el: string): Container {
    const f = elColor(el);
    const c = this.add(new Container());
    const glow = new Sprite(glowTexture());
    glow.anchor.set(0.5);
    glow.tint = f.accent;
    glow.blendMode = 'add';
    glow.scale.set(1.6);
    const body = new Graphics()
      .moveTo(-34, 30)
      .quadraticCurveTo(-40, -40, 0, -46)
      .quadraticCurveTo(40, -40, 34, 30)
      .lineTo(20, 18)
      .lineTo(8, 34)
      .lineTo(-6, 18)
      .lineTo(-20, 34)
      .closePath()
      .fill({ color: f.main, alpha: 0.9 })
      .stroke({ width: 4, color: C.ink });
    body.poly([-30, -36, -22, -62, -10, -42]).fill(f.main).stroke({ width: 3, color: C.ink });
    body.poly([30, -36, 22, -62, 10, -42]).fill(f.main).stroke({ width: 3, color: C.ink });
    body.circle(-12, -14, 6).circle(12, -14, 6).fill(0xffffff);
    c.addChild(glow, body);
    c.position.set(at.x, at.y);
    c.scale.set(0);
    gsap.to(c.scale, { x: 1, y: 1, duration: 0.4, ease: 'back.out(3)' });
    gsap.to(body, { y: -14, duration: 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    return c;
  }
  /** spirit dashes to the target */
  spiritStrike(sp: Container, to: P2): Promise<void> {
    const home = { x: sp.x, y: sp.y };
    return new Promise((res) => {
      const t = this.tl();
      t.to(sp, { x: to.x, y: to.y, duration: 0.2, ease: 'power3.in' }).call(res).to(sp, { x: home.x, y: home.y, duration: 0.3, ease: 'power2.out' });
    });
  }

  /** green crosses rising + glow */
  heal(at: P2): Promise<void> {
    const t = this.tl();
    for (let i = 0; i < 7; i++) {
      const g = this.add(new Graphics().rect(-8, -24, 16, 48).rect(-24, -8, 48, 16).fill(C.green).stroke({ width: 3, color: C.ink }));
      g.position.set(at.x + (Math.random() - 0.5) * 220, at.y + 40 - Math.random() * 120);
      g.scale.set(0);
      t.to(g.scale, { x: 1, y: 1, duration: 0.2, ease: 'back.out(3)' }, i * 0.06)
        .to(g, { y: g.y - 160, alpha: 0, duration: 0.7, onComplete: () => g.destroy() }, i * 0.06 + 0.1);
    }
    this.particles.burst(at.x, at.y, { count: 14, tint: [C.green, C.mint, 0xffffff], speed: [80, 240], life: [0.4, 0.8], gravity: -200, blend: 'add' });
    return new Promise((res) => t.call(res, [], 0.3));
  }

  /** hexagonal fur shield (persistent; scene removes it when it breaks) */
  shield(at: P2, el: string): Graphics {
    const f = elColor(el);
    const g = this.add(new Graphics());
    const pts: number[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      pts.push(Math.cos(a) * 200, Math.sin(a) * 230);
    }
    g.poly(pts).fill({ color: f.accent, alpha: 0.18 }).stroke({ width: 7, color: f.accent, alpha: 0.9 });
    g.poly(pts.map((v) => v * 0.94)).stroke({ width: 2, color: 0xffffff, alpha: 0.7 });
    g.position.set(at.x, at.y);
    g.scale.set(0.2);
    gsap.to(g.scale, { x: 1, y: 1, duration: 0.35, ease: 'back.out(2.5)' });
    gsap.to(g, { alpha: 0.75, duration: 0.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    return g;
  }
  shatter(g: Graphics) {
    gsap.killTweensOf(g);
    gsap.killTweensOf(g.scale);
    this.particles.burst(g.x, g.y, { count: 24, texture: sparkTexture(), tint: [0xffffff, C.cyan], speed: [300, 800], life: [0.3, 0.6], gravity: 500 });
    gsap.to(g.scale, { x: 1.4, y: 1.4, duration: 0.15 });
    gsap.to(g, { alpha: 0, duration: 0.15, onComplete: () => g.destroy() });
  }

  /** a small DOT puff on a fighter (burn flames, root vines…) */
  puff(at: P2, kind: string) {
    const col: Record<string, number[]> = {
      burn: [0xff6a1a, 0xffc94a, C.red],
      root: [0x5fbf4a, 0xd4f27a, 0x1f4a2a],
      summon: [C.violet, C.cyan],
      regen: [C.green, C.mint],
    };
    this.particles.burst(at.x, at.y, { count: 12, tint: col[kind] ?? [0xffffff], speed: [80, 260], angle: [-Math.PI * 0.9, -Math.PI * 0.1], life: [0.35, 0.7], gravity: -300, blend: 'add', stepped: true });
  }

  /** dust when a fighter faints */
  dust(at: P2) {
    this.particles.burst(at.x, at.y, { count: 30, texture: dotTexture(), tint: [0xd9cdb8, 0x9a8f80], speed: [100, 420], angle: [-Math.PI, 0], life: [0.5, 1], gravity: 300, scale: [0.6, 1.4] });
  }

  /**
   * ULTI cut-in: a diagonal band crosses the screen with the cat's face, its battle-form name and the
   * attack shouted huge. ~1.2 s at ×1.
   */
  cutIn(o: { slug: string; species: string; side: 0 | 1; el: string; name: string; cry: string }): Promise<void> {
    const f = elColor(o.el);
    const root = this.add(new Container());
    const dim = new Graphics().rect(-400, -200, W + 800, H + 400).fill({ color: C.ink, alpha: 0.55 });
    root.addChild(dim);
    const band = new Container();
    const bandG = new Graphics().rect(-W, -170, W * 3, 340).fill(f.main).stroke({ width: 8, color: C.ink });
    const dots = new TilingSprite({ texture: halftoneTexture(0x000000, 14, 3), width: W * 3, height: 340 });
    dots.position.set(-W, -170);
    dots.alpha = 0.25;
    band.addChild(bandG, dots);
    // speed lines inside the band
    const lines = new Graphics();
    for (let i = 0; i < 26; i++) {
      const y = -160 + Math.random() * 320;
      lines.rect(-W + Math.random() * W * 3, y, 300 + Math.random() * 500, 4 + Math.random() * 6);
    }
    lines.fill({ color: 0xffffff, alpha: 0.55 });
    band.addChild(lines);
    // the cat (face crop, big)
    const cat = livingCat(o.slug, { anchorX: 0.5, anchorY: 0.4, acts: 'none' });
    applyCatTint(cat, o.species);
    cat.scale.set((o.side === 0 ? 1 : -1) * 1.15, 1.15);
    cat.position.set(o.side === 0 ? 420 : W - 420, 40);
    cat.emote('attack', 1.4);
    const mask = new Graphics().rect(-W, -166, W * 3, 332).fill(0xffffff);
    band.addChild(mask, cat);
    cat.mask = mask;
    void catTexture;
    const name = txt(o.name, { fontFamily: F.poster, fontSize: 92, fill: C.paper, stroke: { color: C.ink, width: 12, join: 'round' }, letterSpacing: 2 });
    name.anchor.set(o.side === 0 ? 0 : 1, 0.5);
    name.position.set(o.side === 0 ? 760 : W - 760, -30);
    if (name.width > 1080) name.scale.set(1080 / name.width);
    const cry = txt(o.cry, { fontFamily: F.comic, fontSize: 52, fill: f.accent, stroke: { color: C.ink, width: 8, join: 'round' } });
    cry.anchor.set(o.side === 0 ? 0 : 1, 0.5);
    cry.position.set(o.side === 0 ? 780 : W - 780, 70);
    if (cry.width > 1000) cry.scale.set(1000 / cry.width);
    band.addChild(name, cry);
    band.position.set(W / 2, H / 2);
    band.pivot.set(W / 2, 0);
    band.rotation = -0.12;
    root.addChild(band);
    const dir = o.side === 0 ? 1 : -1;
    band.x = W / 2 - dir * W * 1.2;
    dim.alpha = 0;
    const reduce = settings.reduceMotion;
    return new Promise((res) => {
      const t = this.tl(() => {
        root.destroy({ children: true });
        res();
      });
      t.to(dim, { alpha: 1, duration: 0.12 }, 0)
        .to(band, { x: W / 2, duration: reduce ? 0.01 : 0.22, ease: 'power4.out' }, 0)
        .from(name.scale, { x: 1.6 * name.scale.x, y: 1.6 * name.scale.y, duration: 0.25, ease: 'back.out(2)' }, 0.1)
        .to(lines, { x: -dir * 400, duration: 1, ease: 'none' }, 0)
        .to(cat, { x: cat.x + dir * 60, duration: 1, ease: 'none' }, 0)
        .to(band, { x: W / 2 + dir * W * 1.3, duration: 0.2, ease: 'power3.in' }, 0.95)
        .to(dim, { alpha: 0, duration: 0.15 }, 1.0);
    });
  }

  /** big centered banner text (SUPER EFECTIVO / NO MUY EFECTIVO / TURNO…) */
  banner(text: string, color: number, y = H * 0.36, size = 76, dur = 0.8) {
    const t: Text = txt(text, { fontFamily: F.poster, fontSize: size, fill: color, stroke: { color: C.ink, width: size / 7, join: 'round' }, letterSpacing: 3 });
    t.anchor.set(0.5);
    t.position.set(W / 2, y);
    t.rotation = -0.04;
    t.scale.set(0.3);
    this.add(t);
    this.tl(() => t.destroy())
      .to(t.scale, { x: 1, y: 1, duration: 0.18, ease: 'back.out(4)' })
      .to(t, { y: y - 20, duration: dur }, 0.1)
      .to(t, { alpha: 0, duration: 0.2 }, dur);
  }

  /** floating damage number */
  number(at: P2, text: string, o: { color?: number; size?: number; rot?: number } = {}) {
    const size = o.size ?? 64;
    const t = txt(text, { fontFamily: F.comic, fontSize: size, fill: o.color ?? C.paper, stroke: { color: C.ink, width: Math.max(5, size / 7), join: 'round' }, letterSpacing: 1 });
    t.anchor.set(0.5);
    t.position.set(at.x, at.y);
    t.rotation = o.rot ?? (Math.random() - 0.5) * 0.25;
    t.scale.set(0.2);
    this.add(t);
    this.tl(() => t.destroy())
      .to(t.scale, { x: 1, y: 1, duration: 0.16, ease: 'back.out(4)' })
      .to(t, { y: at.y - 110, duration: 0.95, ease: 'power1.out' }, 0)
      .to(t, { alpha: 0, duration: 0.25 }, 0.75);
  }
}
