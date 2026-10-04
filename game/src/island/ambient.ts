/** Ambient life over the sea: seagulls gliding (on twos) and fish leaping far from the coast. */
import { Container, Graphics } from 'pixi.js';
import { C } from '../ui/theme';
import { isoToScreen } from './iso';
import { DROP } from './terrain';
import { key, Tile } from './archipelago';
import type { TweenBag } from '../ui/hud/tweenBag';

interface Gull {
  g: Container;
  wingL: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ph: number;
}

export class Ambient extends Container {
  private gulls: Gull[] = [];
  private acc = 0;
  private t = 0;
  private fishT = 2;
  private seaTiles: { x: number; y: number }[] = [];
  constructor(
    tiles: Map<string, Tile>,
    private bounds: { minX: number; maxX: number; minY: number; maxY: number },
    private bag: TweenBag,
  ) {
    super();
    // open-sea spots (2+ tiles away from any land) for leaping fish
    for (let gy = 0; gy < 52; gy += 2)
      for (let gx = 0; gx < 52; gx += 2) {
        let near = false;
        for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2 && !near; dx++) if (tiles.has(key(gx + dx, gy + dy))) near = true;
        if (!near) {
          const p = isoToScreen(gx, gy);
          if (p.x > bounds.minX - 600 && p.x < bounds.maxX + 600 && p.y > bounds.minY - 300 && p.y < bounds.maxY + 300) this.seaTiles.push({ x: p.x, y: p.y + DROP });
        }
      }
    for (let i = 0; i < 6; i++) this.spawnGull(true);
  }

  private spawnGull(anywhere: boolean) {
    const g = new Container();
    const body = new Graphics();
    body.ellipse(0, 0, 10, 5).fill(C.paper).stroke({ width: 2.5, color: C.ink });
    body.poly([9, -1, 16, 1, 9, 3]).fill(C.yellow).stroke({ width: 1.5, color: C.ink });
    const wingL = new Graphics();
    const shadow = new Graphics().ellipse(0, 120, 12, 4).fill({ color: C.ink, alpha: 0.12 });
    g.addChild(shadow, wingL, body);
    const b = this.bounds;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const x = anywhere ? b.minX + Math.random() * (b.maxX - b.minX) : dir > 0 ? b.minX - 400 : b.maxX + 400;
    const y = b.minY - 200 + Math.random() * (b.maxY - b.minY + 200);
    g.scale.x = dir;
    this.addChild(g);
    this.gulls.push({ g, wingL, x, y, vx: dir * (60 + Math.random() * 50), vy: (Math.random() - 0.5) * 14, ph: Math.random() * 6 });
  }

  update(dt: number) {
    this.t += dt;
    this.acc += dt;
    if (this.acc >= 1 / 12) {
      const step = this.acc;
      this.acc = 0;
      const b = this.bounds;
      for (let i = this.gulls.length - 1; i >= 0; i--) {
        const gl = this.gulls[i];
        gl.x += gl.vx * step;
        gl.y += gl.vy * step + Math.sin(this.t * 0.8 + gl.ph) * 6 * step;
        gl.g.position.set(gl.x, gl.y);
        const flap = Math.sin(this.t * 7 + gl.ph);
        gl.wingL.clear();
        const wy = -6 - flap * 9;
        gl.wingL.moveTo(-14, wy).quadraticCurveTo(-6, -2, 0, 0).quadraticCurveTo(6, -2, 14, wy).stroke({ width: 3.5, color: C.ink, cap: 'round', join: 'round' });
        if (gl.x < b.minX - 700 || gl.x > b.maxX + 700) {
          gl.g.destroy({ children: true });
          this.gulls.splice(i, 1);
          this.spawnGull(false);
        }
      }
    }
    this.fishT -= dt;
    if (this.fishT <= 0 && this.seaTiles.length) {
      this.fishT = 1.5 + Math.random() * 3;
      const p = this.seaTiles[Math.floor(Math.random() * this.seaTiles.length)];
      this.leap(p.x + (Math.random() - 0.5) * 60, p.y);
    }
  }

  private leap(x0: number, y0: number) {
    const g = new Graphics();
    g.ellipse(0, 0, 12, 6).fill(0x9fd6ea).stroke({ width: 2.5, color: C.ink });
    g.poly([10, 0, 18, -6, 18, 6]).fill(0x9fd6ea).stroke({ width: 2.5, color: C.ink });
    const dir = Math.random() < 0.5 ? -1 : 1;
    g.scale.x = -dir;
    g.position.set(x0, y0);
    this.addChild(g);
    const o = { t: 0 };
    const ring = (x: number) => {
      const r = new Graphics().ellipse(0, 0, 9, 3.5).stroke({ width: 2.5, color: 0xffffff });
      r.position.set(x, y0);
      this.addChildAt(r, 0);
      this.bag.to(r.scale, { x: 3, y: 3, duration: 0.6, ease: 'power2.out' });
      this.bag.to(r, { alpha: 0, duration: 0.6, onComplete: () => r.destroy() });
    };
    ring(x0);
    this.bag.to(o, {
      t: 1,
      duration: 0.8,
      ease: 'none',
      onUpdate: () => {
        g.x = x0 + dir * 46 * o.t;
        g.y = y0 - Math.sin(o.t * Math.PI) * 70;
        g.rotation = dir * (o.t - 0.5) * 2.4;
      },
      onComplete: () => {
        ring(g.x);
        g.destroy();
      },
    });
  }
}
