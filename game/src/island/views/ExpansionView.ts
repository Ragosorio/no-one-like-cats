/** Locked/available expansion (paper veil + aspirational price plaque) and its clearing site. */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import { G } from '../../state/game';
import { EXPANSIONS } from '../../data/content';
import { isoToScreen } from '../iso';
import { decorArt } from '../decorArt';
import { ClockBubble, PricePlaque } from '../worldUi';
import { plate } from '../buildingArt';
import type { RegionPlan } from '../layout';
import type { IslandCtx } from './ctx';
import { IslandCat } from '../../art/catArt';
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
}

export class ExpansionView {
  plaque: PricePlaque;
  clock = new ClockBubble(40);
  private clearTag: Container;
  private rocks: { c: Container; gx: number; gy: number; alive: boolean }[] = [];
  private kittens: Kitten[] = [];
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
    // two helmet kittens
    const slugs = ['canelo_cozy_cat', 'margarita_daisy_cat'];
    for (let i = 0; i < 2; i++) {
      const k = new Container();
      const cat = new IslandCat(slugs[i], 72);
      const hat = new Graphics();
      hat.arc(0, -56, 17, Math.PI, 0).fill(C.yellow).stroke({ width: 3, color: C.ink });
      hat.rect(-22, -58, 44, 6).fill(C.yellow).stroke({ width: 2.5, color: C.ink });
      hat.rect(-3, -73, 6, 10).fill(0xffd77a);
      const hammer = new Graphics();
      hammer.rect(-2, -26, 4, 26).fill(0x8a5a2e).stroke({ width: 2, color: C.ink });
      hammer.rect(-9, -32, 18, 9).fill(0x6b6b6b).stroke({ width: 2, color: C.ink });
      hammer.position.set(22, -24);
      cat.addChild(hat);
      k.addChild(cat, hammer);
      const t = tiles[Math.floor(h2(i, this.n, 3) * tiles.length)] ?? tiles[0];
      const gx = this.plan.center.gx + (i ? 1.2 : -1.0);
      const gy = this.plan.center.gy + (i ? -0.8 : 1.0);
      void t;
      const p = isoToScreen(gx, gy);
      k.position.set(p.x, p.y);
      k.zIndex = gx + gy;
      if (i) k.scale.x = -1;
      this.ctx.objects.addChild(k);
      this.kittens.push({ c: k, cat, hammer, gx, gy, t: i * 0.3 });
    }
    this.clock.visible = true;
    this.clearTag.visible = true;
  }

  private clearSite() {
    for (const r of this.rocks) r.c.destroy({ children: true });
    this.rocks = [];
    for (const k of this.kittens) k.c.destroy({ children: true });
    this.kittens = [];
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
        const ph = (k.t * 2.4) % 1;
        k.hammer.rotation = ph < 0.6 ? -1.1 + ph * 0.5 : -0.8 + (ph - 0.6) * 4;
        k.cat.y = ph > 0.85 ? -4 : 0;
      }
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
