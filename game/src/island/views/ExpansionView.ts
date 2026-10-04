/** Locked/available expansion (paper veil + aspirational price plaque) and its clearing site. */
import { Container, Graphics, Texture } from 'pixi.js';
import gsap from 'gsap';
import { G } from '../../state/game';
import { EXPANSIONS } from '../../data/content';
import { isoToScreen } from '../iso';
import { decorArt } from '../decorArt';
import { ClockBubble, PricePlaque } from '../worldUi';
import { plate } from '../buildingArt';
import type { RegionPlan } from '../layout';
import type { IslandCtx } from './ctx';
import { IslandCat, catTexture } from '../../art/catArt';
import { slugOf } from '../../art/tint';
import { txt } from '../../ui/widgets';
import { C, F } from '../../ui/theme';
import { onomatopoeia } from '../../fx/juice';
import { sfx } from '../../core/audio';

function h2(a: number, b: number, s = 0) {
  let h = (a * 374761393 + b * 668265263 + s * 974711) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

interface Kitten {
  c: Container;
  cat: IslandCat;
  hammer: Graphics;
  gx: number;
  gy: number;
  t: number;
  /** 'hammer' swings in place; 'cart' hauls rubble back and forth with a wheelbarrow */
  job: 'hammer' | 'cart';
  from?: { x: number; y: number };
  to?: { x: number; y: number };
}
interface Gull {
  g: Container;
  wing: Graphics;
  a: number;
  r: number;
  sp: number;
}

export class ExpansionView {
  plaque: PricePlaque;
  clock = new ClockBubble(40);
  private clearTag: Container;
  private rocks: { c: Container; gx: number; gy: number; alive: boolean }[] = [];
  private kittens: Kitten[] = [];
  private gulls: Gull[] = [];
  private props: Container[] = [];
  private dustT = 0;
  /** plaque offset applied by the scene to keep it out from under the HUD */
  tether = new Graphics();
  readonly anchor: { x: number; y: number };
  private site = new Container();
  state = '';
  private clearingSince = 0;
  private acc = 0;
  readonly n: number;
  readonly center: { x: number; y: number };
  private clouds = new Container();
  private cloudT = Math.random() * 10;
  constructor(
    public plan: RegionPlan,
    private ctx: IslandCtx,
    onTap: (n: number) => void,
  ) {
    this.n = plan.def.n ?? 0;
    const e = EXPANSIONS[this.n - 1];
    this.plaque = new PricePlaque(e.name);
    const c = isoToScreen(plan.center.gx, plan.center.gy);
    this.center = c;
    this.plaque.position.set(c.x, c.y + 10);
    this.anchor = { x: c.x, y: c.y + 10 };
    ctx.bubbles.addChild(this.tether);
    this.clock.position.set(c.x, c.y - 150);
    this.clearTag = plate('LIMPIANDO…', C.yellow, 24);
    this.clearTag.position.set(c.x, c.y - 214);
    this.clearTag.visible = false;
    ctx.bubbles.addChild(this.clearTag);
    ctx.bubbles.addChildAt(this.clouds, 0);
    this.buildClouds();
    ctx.bubbles.addChild(this.plaque, this.clock);
    this.plaque.on('pointertap', () => {
      if (ctx.tapOk()) onTap(this.n);
    });
    this.clock.visible = false;
    ctx.objects.addChild(this.site);
    this.site.sortableChildren = false;
  }

  /** paper cut-out clouds drifting over veiled land ("velo de papel") */
  private buildClouds() {
    const tiles = this.plan.tiles;
    const picks = tiles.filter((t) => h2(t.gx, t.gy, 31) < 0.07).slice(0, 4);
    for (const t of picks) {
      const g = new Graphics();
      const n = 4 + Math.floor(h2(t.gx, t.gy, 2) * 3);
      const blobs: [number, number, number][] = [];
      for (let i = 0; i < n; i++) blobs.push([(i - (n - 1) / 2) * 34 + (h2(i, t.gx) - 0.5) * 12, -Math.sin((i / (n - 1)) * Math.PI) * 26 + (h2(t.gy, i) - 0.5) * 8, 26 + h2(i, t.gy, 5) * 18]);
      for (const [x, y, r] of blobs) g.circle(x, y, r + 4).fill(C.ink);
      g.rect(-((n - 1) / 2) * 34 - 4, -4, (n - 1) * 34 + 8, 30).fill(C.ink);
      for (const [x, y, r] of blobs) g.circle(x, y, r).fill(0xf6efe2);
      g.rect(-((n - 1) / 2) * 34, -2, (n - 1) * 34, 24).fill(0xf6efe2);
      for (const [x, y, r] of blobs) g.circle(x - r * 0.25, y - r * 0.3, r * 0.35).fill({ color: 0xffffff, alpha: 0.6 });
      g.rect(-((n - 1) / 2) * 34, 14, (n - 1) * 34, 8).fill({ color: 0xd9cdb8, alpha: 0.8 });
      const p = isoToScreen(t.gx, t.gy);
      g.position.set(p.x, p.y - 60);
      (g as Graphics & { bx?: number; ph?: number }).bx = p.x;
      (g as Graphics & { bx?: number; ph?: number }).ph = h2(t.gx, t.gy, 8) * 6;
      this.clouds.addChild(g);
    }
  }

  sync(st: 'locked' | 'available' | 'clearing' | 'cleared') {
    const e = EXPANSIONS[this.n - 1];
    this.clouds.visible = st === 'locked' || st === 'available';
    this.plaque.visible = st === 'locked' || st === 'available';
    if (this.plaque.visible) this.plaque.show(st === 'available' ? 'available' : 'locked', e.balance.cost, e.balance.kl, G.s.gold >= e.balance.cost);
    if (st !== this.state) {
      const prev = this.state;
      this.state = st;
      if (st === 'clearing') {
        this.buildSite();
        this.clearingSince = performance.now();
      }
      else this.clearSite();
      if (prev === 'clearing' && st === 'cleared') return true;
    }
    return false;
  }

  private buildSite() {
    this.clearSite();
    const tiles = this.plan.tiles;
    const picks = tiles.filter((t) => h2(t.gx, t.gy, 21) < 0.22).slice(0, 14);
    for (const t of picks) {
      const c = decorArt(h2(t.gx, t.gy, 4) < 0.5 ? 'boulder' : 'rock', h2(t.gx, t.gy, 6));
      const p = isoToScreen(t.gx, t.gy);
      c.position.set(p.x, p.y);
      c.zIndex = t.gx + t.gy;
      this.ctx.objects.addChild(c);
      this.rocks.push({ c, gx: t.gx, gy: t.gy, alive: true });
    }
    // logs + bushes to haul away (debris) and a work zone: cones + OBRA sign
    for (const t of tiles.filter((q) => h2(q.gx, q.gy, 51) < 0.08).slice(0, 5)) {
      const c = decorArt(h2(t.gx, t.gy, 52) < 0.5 ? 'bush' : 'grass', h2(t.gx, t.gy, 53));
      const p = isoToScreen(t.gx, t.gy);
      c.position.set(p.x, p.y);
      c.zIndex = t.gx + t.gy;
      this.ctx.objects.addChild(c);
      this.rocks.push({ c, gx: t.gx, gy: t.gy, alive: true });
    }
    const cg = this.plan.center;
    const pile = new Graphics();
    for (const [x, y, r] of [
      [-14, 0, 14],
      [8, -4, 12],
      [0, -14, 11],
      [18, 6, 9],
    ])
      pile.circle(x, y, r).fill(0x8f8778).stroke({ width: 2.5, color: C.ink });
    const pp = isoToScreen(cg.gx + 2.2, cg.gy + 1.4);
    pile.position.set(pp.x, pp.y);
    pile.zIndex = cg.gx + cg.gy + 3.6;
    this.ctx.objects.addChild(pile);
    this.props.push(pile);
    for (const [dx, dy] of [
      [-2.2, 1.6],
      [-1.4, 2.4],
      [2.6, -1.8],
    ]) {
      const cone = new Graphics();
      cone.ellipse(0, 2, 10, 4).fill({ color: C.ink, alpha: 0.2 });
      cone.poly([-8, 0, 0, -26, 8, 0]).fill(C.orange).stroke({ width: 2.5, color: C.ink });
      cone.rect(-5, -14, 10, 4).fill(C.paper);
      const p = isoToScreen(cg.gx + dx, cg.gy + dy);
      cone.position.set(p.x, p.y);
      cone.zIndex = cg.gx + dx + cg.gy + dy;
      this.ctx.objects.addChild(cone);
      this.props.push(cone);
    }
    const sign = new Container();
    const sg = new Graphics();
    sg.rect(-3, -46, 6, 46).fill(0x8a5a2e).stroke({ width: 2, color: C.ink });
    sg.poly([0, -96, 30, -66, 0, -36, -30, -66]).fill(C.yellow).stroke({ width: 3, color: C.ink });
    sign.addChild(sg);
    const st = txt('OBRA', { fontFamily: F.poster, fontSize: 18, fill: C.ink });
    st.anchor.set(0.5);
    st.position.set(0, -66);
    sign.addChild(st);
    const sp = isoToScreen(cg.gx - 2.6, cg.gy + 0.6);
    sign.position.set(sp.x, sp.y);
    sign.zIndex = cg.gx + cg.gy - 2;
    this.ctx.objects.addChild(sign);
    this.props.push(sign);
    // the crew: your own cats in hard hats (2 hammering, 1 hauling rubble to the pile)
    const owned = [...new Set(G.s.cats.map((c) => slugOf(c.species)))].filter((sl) => catTexture(sl) !== Texture.WHITE);
    const slugs = owned.length >= 3 ? owned.slice(0, 3) : ['canelo_cozy_cat', 'margarita_daisy_cat', owned[0] ?? 'canelo_cozy_cat'];
    const spots = [
      { gx: cg.gx - 1.0, gy: cg.gy + 1.0, job: 'hammer' as const },
      { gx: cg.gx + 1.2, gy: cg.gy - 0.8, job: 'hammer' as const },
      { gx: cg.gx - 0.6, gy: cg.gy - 1.4, job: 'cart' as const },
    ];
    spots.forEach((s0, i) => {
      const k = new Container();
      const cat = new IslandCat(slugs[i] ?? 'canelo_cozy_cat', 72);
      const hat = new Graphics();
      hat.arc(0, -56, 17, Math.PI, 0).fill(C.yellow).stroke({ width: 3, color: C.ink });
      hat.rect(-22, -58, 44, 6).fill(C.yellow).stroke({ width: 2.5, color: C.ink });
      hat.rect(-3, -73, 6, 10).fill(0xffd77a);
      const hammer = new Graphics();
      if (s0.job === 'hammer') {
        hammer.rect(-2, -26, 4, 26).fill(0x8a5a2e).stroke({ width: 2, color: C.ink });
        hammer.rect(-9, -32, 18, 9).fill(0x6b6b6b).stroke({ width: 2, color: C.ink });
        hammer.position.set(22, -24);
      } else {
        // wheelbarrow with rubble, in front of the cat
        hammer.poly([10, -10, 50, -10, 44, 6, 16, 6]).fill(0xc8102e).stroke({ width: 2.5, color: C.ink });
        hammer.circle(26, -14, 6).fill(0x8f8778).stroke({ width: 2, color: C.ink });
        hammer.circle(38, -16, 5).fill(0xa59d8c).stroke({ width: 2, color: C.ink });
        hammer.circle(46, 10, 7).fill(C.ink);
        hammer.circle(46, 10, 3).fill(C.paper);
        hammer.moveTo(10, -8).lineTo(-4, -18).stroke({ width: 3, color: 0x8a5a2e });
      }
      cat.addChild(hat);
      k.addChild(cat, hammer);
      const p = isoToScreen(s0.gx, s0.gy);
      k.position.set(p.x, p.y);
      k.zIndex = s0.gx + s0.gy;
      if (i === 1) k.scale.x = -1;
      this.ctx.objects.addChild(k);
      const kit: Kitten = { c: k, cat, hammer, gx: s0.gx, gy: s0.gy, t: i * 0.3, job: s0.job };
      if (s0.job === 'cart') {
        kit.from = p;
        kit.to = { x: pp.x - 40, y: pp.y - 10 };
      }
      this.kittens.push(kit);
    });
    // seagulls circling the noisy work site
    for (let i = 0; i < 3; i++) {
      const g = new Container();
      const body = new Graphics();
      body.ellipse(0, 0, 10, 5).fill(C.paper).stroke({ width: 2.5, color: C.ink });
      body.poly([9, -1, 16, 1, 9, 3]).fill(C.yellow).stroke({ width: 1.5, color: C.ink });
      const wing = new Graphics();
      g.addChild(wing, body);
      this.ctx.wfx.addChild(g);
      this.gulls.push({ g, wing, a: (i / 3) * Math.PI * 2, r: 120 + i * 40, sp: 0.6 + i * 0.15 });
    }
    this.clock.visible = true;
    this.clearTag.visible = true;
  }

  private clearSite() {
    for (const r of this.rocks) r.c.destroy({ children: true });
    this.rocks = [];
    for (const k of this.kittens) k.c.destroy({ children: true });
    this.kittens = [];
    for (const g of this.gulls) g.g.destroy({ children: true });
    this.gulls = [];
    for (const p of this.props) p.destroy({ children: true });
    this.props = [];
    this.clock.visible = false;
    if (this.clearTag) this.clearTag.visible = false;
  }

  update(dt: number) {
    this.plaque.tick(dt);
    if (this.clouds.visible) {
      this.cloudT += dt;
      const tw = Math.floor(this.cloudT * 8) / 8;
      for (const c of this.clouds.children) {
        const g = c as Graphics & { bx: number; ph: number };
        g.x = g.bx + Math.sin(tw * 0.3 + g.ph) * 30;
      }
    }
    if (this.state !== 'clearing') return;
    const t = G.timerFor('expansion', String(this.n));
    if (t) {
      this.clock.set(t.leftMs, t.totalMs);
      const alive = Math.ceil((t.leftMs / t.totalMs) * this.rocks.length);
      let count = this.rocks.filter((r) => r.alive).length;
      for (const r of this.rocks) {
        if (count <= alive) break;
        if (!r.alive) continue;
        r.alive = false;
        count--;
        this.crack(r.c);
      }
    }
    this.acc += dt;
    if (this.acc >= 1 / 12) {
      const step = this.acc;
      this.acc = 0;
      for (const k of this.kittens) {
        k.t += step;
        if (k.job === 'hammer') {
          const ph = (k.t * 2.4) % 1;
          k.hammer.rotation = ph < 0.6 ? -1.1 + ph * 0.5 : -0.8 + (ph - 0.6) * 4;
          k.cat.y = ph > 0.85 ? -4 : 0;
        } else if (k.from && k.to) {
          // haul: 0..1 go, 1..2 back (flip), bob on twos
          const ph = (k.t * 0.25) % 2;
          const f = ph < 1 ? ph : 2 - ph;
          const e = f * f * (3 - 2 * f);
          k.c.x = k.from.x + (k.to.x - k.from.x) * e;
          k.c.y = k.from.y + (k.to.y - k.from.y) * e;
          k.c.scale.x = (ph < 1 ? 1 : -1) * Math.sign(k.to.x - k.from.x || 1);
          k.cat.y = Math.floor(k.t * 8) % 2 ? -3 : 0;
        }
      }
      // gulls circle on twos
      for (const gl of this.gulls) {
        gl.a += gl.sp * step;
        const x = this.center.x + Math.cos(gl.a) * gl.r;
        const y = this.center.y - 200 + Math.sin(gl.a) * gl.r * 0.35;
        gl.g.position.set(x, y);
        gl.g.scale.x = Math.sin(gl.a) > 0 ? -1 : 1;
        const flap = Math.sin(this.cloudT * 9 + gl.r);
        gl.wing.clear().moveTo(-14, -6 - flap * 8).quadraticCurveTo(-6, -2, 0, 0).quadraticCurveTo(6, -2, 14, -6 - flap * 8).stroke({ width: 3.5, color: C.ink, cap: 'round', join: 'round' });
      }
    }
    // dust puffs from the hammering
    this.dustT -= dt;
    if (this.dustT <= 0 && this.kittens.length) {
      this.dustT = 0.35 + Math.random() * 0.35;
      const k = this.kittens[Math.floor(Math.random() * 2)];
      if (k) this.dust(k.c.x + 30 * Math.sign(k.c.scale.x), k.c.y - 6);
    }
  }

  /** true if the player actually watched the clearing site (Ronroneo can finish it instantly) */
  sawClearing() {
    return this.state === 'clearing' && performance.now() - this.clearingSince > 1500;
  }

  /** short montage when the clearing finished before anyone could see it: rocks pop one by one */
  quickClear(duration = 1.3) {
    const tiles = this.plan.tiles.filter((t) => h2(t.gx, t.gy, 21) < 0.22).slice(0, 10);
    const rocks: Container[] = [];
    for (const t of tiles) {
      const c = decorArt(h2(t.gx, t.gy, 4) < 0.5 ? 'boulder' : 'rock', h2(t.gx, t.gy, 6));
      const p = isoToScreen(t.gx, t.gy);
      c.position.set(p.x, p.y);
      c.zIndex = t.gx + t.gy;
      this.ctx.objects.addChild(c);
      rocks.push(c);
    }
    const step = duration / Math.max(1, rocks.length);
    rocks.forEach((c, i) => {
      this.ctx.bag.add(
        gsap.delayedCall(0.15 + i * step, () => {
          if (c.destroyed) return;
          this.crack(c);
          this.ctx.bag.add(gsap.delayedCall(0.3, () => c.destroy({ children: true })));
        }),
      );
    });
  }

  private dust(x: number, y: number) {
    const g = new Graphics().circle(0, 0, 9).fill({ color: 0xd9cdb8, alpha: 0.85 }).stroke({ width: 2, color: C.ink, alpha: 0.35 });
    g.position.set(x, y);
    this.ctx.wfx.addChild(g);
    this.ctx.bag.to(g, { y: y - 26, x: x + (Math.random() - 0.5) * 30, alpha: 0, duration: 0.7, ease: 'power1.out', onComplete: () => g.destroy() });
    this.ctx.bag.to(g.scale, { x: 2, y: 2, duration: 0.7 });
  }

  /** the scene nudges the plaque out from under the HUD; a tether keeps it pinned to its island */
  setPlaqueOffset(dx: number, dy: number) {
    this.plaque.position.set(this.anchor.x + dx, this.anchor.y + dy);
    this.tether.clear();
    if (!this.plaque.visible || Math.hypot(dx, dy) < 8) return;
    const n = Math.max(2, Math.floor(Math.hypot(dx, dy) / 16));
    for (let i = 0; i < n; i += 2) {
      const a = i / n;
      const b = Math.min(1, (i + 1) / n);
      this.tether.moveTo(this.anchor.x + dx * (1 - a), this.anchor.y + dy * (1 - a)).lineTo(this.anchor.x + dx * (1 - b), this.anchor.y + dy * (1 - b));
    }
    this.tether.stroke({ width: 3, color: C.ink, alpha: 0.6 });
    this.tether.circle(this.anchor.x, this.anchor.y, 6).fill(C.ink);
  }

  private crack(c: Container) {
    const x = c.x;
    const y = c.y - 20;
    sfx('hit', 0.9 + Math.random() * 0.3);
    onomatopoeia(this.ctx.wfx, x, y - 30, '¡CRACK!', { size: 46, color: C.paper, font: F.comic, dur: 0.7 });
    for (let i = 0; i < 6; i++) {
      const g = new Graphics().poly([-6, 0, 0, -7, 7, -2, 4, 6, -4, 5]).fill(0x8f8778).stroke({ width: 2, color: C.ink });
      g.position.set(x, y);
      this.ctx.wfx.addChild(g);
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const d = 50 + Math.random() * 60;
      const o = { t: 0 };
      this.ctx.bag.to(o, {
        t: 1,
        duration: 0.55,
        ease: 'none',
        onUpdate: () => {
          g.x = x + Math.cos(a) * d * o.t;
          g.y = y + Math.sin(a) * d * o.t + 160 * o.t * o.t;
          g.rotation = o.t * 6;
          g.alpha = 1 - o.t * 0.8;
        },
        onComplete: () => g.destroy(),
      });
    }
    this.ctx.bag.to(c.scale, { x: 0, y: 0, duration: 0.18, ease: 'back.in(2)', onComplete: () => (c.visible = false) });
  }
}
