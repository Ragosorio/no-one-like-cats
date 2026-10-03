import { Container, Graphics, Ticker } from 'pixi.js';
import { W } from '../core/App';
import { C } from '../ui/theme';

interface Cloud {
  g: Graphics;
  speed: number;
}
interface Bird {
  g: Graphics;
  vx: number;
  phase: number;
  y0: number;
}
interface Streak {
  g: Graphics;
  life: number;
}

/**
 * Living sky: flat poster clouds drifting with the wind, seagulls flapping on twos,
 * and wind streaks that show direction/strength (gameplay readability).
 */
export class SkyLife extends Container {
  clouds: Cloud[] = [];
  birds: Bird[] = [];
  streaks: Streak[] = [];
  wind = 0;
  private acc = 0;
  private flap = 0;
  private streakAcc = 0;
  constructor(public horizon: number) {
    super();
    for (let i = 0; i < 6; i++) this.addCloud(Math.random() * W);
    for (let i = 0; i < 3; i++) this.addBird(Math.random() * W);
    Ticker.shared.add(this.tick, this);
  }
  private addCloud(x: number) {
    const g = new Graphics();
    const w = 140 + Math.random() * 200;
    const y = 160 + Math.random() * (this.horizon - 420);
    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const r = w * (0.18 + Math.random() * 0.14);
      g.circle((i / (n - 1) - 0.5) * w * 0.8, -r * 0.4 + Math.random() * 8, r);
    }
    g.fill({ color: 0xffffff, alpha: 0.13 });
    g.rect(-w * 0.5, 0, w, 6).fill({ color: 0xffffff, alpha: 0.1 });
    g.position.set(x, y);
    this.addChildAt(g, 0);
    this.clouds.push({ g, speed: 6 + Math.random() * 10 });
  }
  private addBird(x: number) {
    const g = new Graphics();
    g.position.set(x, 180 + Math.random() * 220);
    this.addChild(g);
    this.birds.push({ g, vx: (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 40), phase: Math.random() * 6, y0: g.y });
  }
  private drawBird(b: Bird, up: boolean) {
    const g = b.g;
    g.clear();
    const s = 14;
    const wy = up ? -s * 0.7 : s * 0.25;
    g.moveTo(-s, wy).quadraticCurveTo(-s * 0.4, -s * 0.2, 0, 0).quadraticCurveTo(s * 0.4, -s * 0.2, s, wy).stroke({ width: 3.5, color: C.paper, cap: 'round' });
    g.circle(0, 1, 3).fill(C.paper);
  }
  private tick(t: Ticker) {
    const dt = t.deltaMS / 1000;
    for (const c of this.clouds) {
      c.g.x += (c.speed + this.wind * 0.25) * dt;
      if (c.g.x > W + 250) c.g.x = -250;
      if (c.g.x < -250) c.g.x = W + 250;
    }
    this.acc += dt;
    if (this.acc >= 1 / 12) {
      this.acc = 0;
      this.flap++;
      for (const b of this.birds) {
        b.g.x += b.vx / 12;
        b.g.y = b.y0 + Math.sin(this.flap / 6 + b.phase) * 10;
        if (b.g.x > W + 60) b.g.x = -60;
        if (b.g.x < -60) b.g.x = W + 60;
        this.drawBird(b, (this.flap + Math.floor(b.phase * 3)) % 4 < 2);
      }
    }
    // wind streaks
    this.streakAcc += dt * Math.min(6, Math.abs(this.wind) / 10);
    if (this.streakAcc > 1) {
      this.streakAcc = 0;
      const g = new Graphics();
      const len = 60 + Math.abs(this.wind) * 1.6;
      g.moveTo(0, 0).lineTo(len, 0).stroke({ width: 2.5, color: 0xffffff, alpha: 0.35, cap: 'round' });
      g.position.set(this.wind > 0 ? -len : W, 140 + Math.random() * (this.horizon - 260));
      this.addChild(g);
      this.streaks.push({ g, life: 2.2 });
    }
    for (let i = this.streaks.length - 1; i >= 0; i--) {
      const s = this.streaks[i];
      s.life -= dt;
      s.g.x += this.wind * 9 * dt;
      s.g.alpha = Math.min(1, s.life);
      if (s.life <= 0) {
        s.g.destroy();
        this.streaks.splice(i, 1);
      }
    }
  }
  override destroy() {
    Ticker.shared.remove(this.tick, this);
    super.destroy({ children: true });
  }
}
