/** A 2×2 fishing pen of the Muelle at sea level: fish shadows while growing, jumping fish when ready. */
import { Container, Graphics } from 'pixi.js';
import { G, FarmPlot } from '../../state/game';
import { isoToScreen } from '../iso';
import { penArt, P, centerOf } from '../buildingArt';
import { DROP } from '../terrain';
import { ClockBubble, TagBubble } from '../worldUi';
import type { Spot } from '../layout';
import type { IslandCtx } from './ctx';
import { ctaVisible } from '../../state/ext/island';
import { C } from '../../ui/theme';

interface Fish {
  g: Graphics;
  x: number;
  y: number;
  a: number;
  sp: number;
}

export class FarmView {
  root = new Container();
  art = new Container();
  fishLayer = new Container();
  bubble = new Container();
  clock = new ClockBubble(24);
  ready: TagBubble;
  sow: TagBubble;
  private fish: Fish[] = [];
  private sig = '';
  private acc = 0;
  private jumpT = 1;
  farm: FarmPlot | null = null;
  active = false;
  private ctr: { x: number; y: number };
  constructor(
    public spot: Spot,
    private ctx: IslandCtx,
    onTap: (v: FarmView) => void,
  ) {
    const p = isoToScreen(spot.gx, spot.gy);
    this.root.position.set(p.x, p.y);
    this.root.zIndex = spot.gx + spot.gy + spot.w + spot.h;
    this.bubble.position.set(p.x, p.y);
    this.ctr = centerOf(spot.w, spot.h);
    this.ctr.y += DROP;
    this.fishLayer.position.set(0, 0);
    this.root.addChild(this.art, this.fishLayer);
    ctx.objects.addChild(this.root);
    ctx.bubbles.addChild(this.bubble);
    this.ready = new TagBubble('¡LISTO!', { icon: 'food', color: C.yellow, size: 24 });
    this.sow = new TagBubble('SEMBRAR', { color: C.paper, size: 20 });
    this.bubble.addChild(this.clock, this.ready, this.sow);
    for (const c of [this.clock, this.ready, this.sow]) c.position.set(this.ctr.x, this.ctr.y - 50);
    this.clock.y = this.ctr.y - 70;
    const a = P(-0.5, -0.5);
    const b = P(spot.w - 0.5, -0.5);
    const c = P(spot.w - 0.5, spot.h - 0.5);
    const d = P(-0.5, spot.h - 0.5);
    const hit = new Graphics().poly([a.x, a.y + DROP, b.x, b.y + DROP, c.x, c.y + DROP, d.x, d.y + DROP]).fill({ color: 0xffffff, alpha: 0.001 });
    this.root.addChildAt(hit, 0);
    for (const t of [this.root, this.bubble]) {
      t.eventMode = 'static';
      t.cursor = 'pointer';
      t.on('pointertap', () => {
        if (ctx.tapOk()) onTap(this);
      });
    }
  }

  get center() {
    return { x: this.root.x + this.ctr.x, y: this.root.y + this.ctr.y };
  }

  sync(active: boolean, f: FarmPlot | null) {
    this.active = active && !!f;
    this.farm = f;
    this.root.visible = this.bubble.visible = this.active;
    if (!this.active || !f) return;
    const sig = `${f.level}`;
    if (sig !== this.sig) {
      this.sig = sig;
      this.art.removeChildren().forEach((c) => c.destroy({ children: true }));
      this.art.addChild(penArt(f.level, this.spot.w, this.spot.h));
    }
    const want = f.crop ? (f.ready ? 6 : 4) : 1;
    while (this.fish.length < want) this.addFish();
    while (this.fish.length > want) this.fish.pop()!.g.destroy();
  }

  private addFish() {
    const g = new Graphics();
    g.ellipse(0, 0, 13, 5).fill({ color: 0x0d2235, alpha: 0.45 });
    g.poly([10, 0, 18, -5, 18, 5]).fill({ color: 0x0d2235, alpha: 0.45 });
    this.fishLayer.addChild(g);
    this.fish.push({ g, x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 34, a: Math.random() * 6.28, sp: 14 + Math.random() * 16 });
  }

  update(dt: number) {
    if (!this.active || !this.farm) return;
    const f = this.farm;
    const t = f.busy ? G.timerFor('farm_upgrade', f.id) : f.crop && !f.ready ? G.timerFor('crop', f.id) : null;
    this.clock.visible = !!t;
    if (t) this.clock.set(t.leftMs, t.totalMs);
    this.ready.visible = f.ready && !f.busy;
    this.sow.visible = !f.crop && !f.busy && ctaVisible('sow');
    this.ready.tick(dt);
    this.sow.tick(dt);
    this.sow.alpha = 0.85;
    // fish on twos
    this.acc += dt;
    if (this.acc >= 1 / 12) {
      const step = this.acc;
      this.acc = 0;
      for (const fi of this.fish) {
        fi.a += (Math.random() - 0.5) * 0.6;
        fi.x += Math.cos(fi.a) * fi.sp * step;
        fi.y += Math.sin(fi.a) * fi.sp * step * 0.5;
        if (Math.abs(fi.x) > 46) {
          fi.x = Math.sign(fi.x) * 46;
          fi.a = Math.PI - fi.a;
        }
        if (Math.abs(fi.y) > 18) {
          fi.y = Math.sign(fi.y) * 18;
          fi.a = -fi.a;
        }
        fi.g.position.set(this.ctr.x + fi.x, this.ctr.y + fi.y);
        fi.g.scale.x = Math.cos(fi.a) > 0 ? -1 : 1;
      }
    }
    if (f.ready) {
      this.jumpT -= dt;
      if (this.jumpT <= 0) {
        this.jumpT = 0.7 + Math.random() * 1.2;
        this.jump();
      }
    }
  }

  /** a fish leaps out (ready state) */
  private jump() {
    const g = new Graphics();
    g.ellipse(0, 0, 14, 7).fill(0x7fd8ff).stroke({ width: 2.5, color: C.ink });
    g.poly([11, 0, 20, -7, 20, 7]).fill(0x7fd8ff).stroke({ width: 2.5, color: C.ink });
    g.circle(-7, -2, 2).fill(C.ink);
    const x0 = this.root.x + this.ctr.x + (Math.random() - 0.5) * 70;
    const y0 = this.root.y + this.ctr.y + (Math.random() - 0.5) * 20;
    g.position.set(x0, y0);
    const dir = Math.random() < 0.5 ? -1 : 1;
    g.scale.x = -dir;
    this.ctx.wfx.addChild(g);
    const o = { t: 0 };
    this.ctx.bag.to(o, {
      t: 1,
      duration: 0.7,
      ease: 'none',
      onUpdate: () => {
        g.x = x0 + dir * 36 * o.t;
        g.y = y0 - Math.sin(o.t * Math.PI) * 60;
        g.rotation = dir * (o.t - 0.5) * 2.2;
      },
      onComplete: () => {
        this.splashRing(g.x, y0);
        g.destroy();
      },
    });
  }

  splashRing(x: number, y: number) {
    const r = new Graphics().ellipse(0, 0, 10, 4).stroke({ width: 3, color: 0xffffff });
    r.position.set(x, y);
    this.ctx.wfx.addChild(r);
    this.ctx.bag.to(r.scale, { x: 3, y: 3, duration: 0.5, ease: 'power2.out' });
    this.ctx.bag.to(r, { alpha: 0, duration: 0.5, onComplete: () => r.destroy() });
  }
}
