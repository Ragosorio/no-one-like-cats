import { Container, Sprite, Texture, Ticker } from 'pixi.js';
import { dotTexture } from '../art/textures';

interface P {
  s: Sprite;
  vx: number;
  vy: number;
  vr: number;
  life: number;
  max: number;
  g: number;
  drag: number;
  s0: number;
  s1: number;
  a0: number;
  stepped: boolean;
}

export interface BurstOpts {
  count?: number;
  texture?: Texture;
  tint?: number | number[];
  speed?: [number, number];
  angle?: [number, number];
  life?: [number, number];
  gravity?: number;
  drag?: number;
  scale?: [number, number];
  endScale?: number;
  spin?: number;
  alpha?: number;
  blend?: 'normal' | 'add' | 'screen';
  /** animate "on twos" (Spider-Verse stepped motion) */
  stepped?: boolean;
}

/** Lightweight CPU particle layer. One per scene. */
export class Particles extends Container {
  private ps: P[] = [];
  private acc = 0;
  constructor() {
    super();
    Ticker.shared.add(this.update, this);
  }

  burst(x: number, y: number, o: BurstOpts = {}) {
    const n = o.count ?? 16;
    const tex = o.texture ?? dotTexture();
    const tints = Array.isArray(o.tint) ? o.tint : [o.tint ?? 0xffffff];
    for (let i = 0; i < n; i++) {
      const s = new Sprite(tex);
      s.anchor.set(0.5);
      s.position.set(x, y);
      s.tint = tints[Math.floor(Math.random() * tints.length)];
      s.blendMode = o.blend ?? 'normal';
      const [a0, a1] = o.angle ?? [0, Math.PI * 2];
      const a = a0 + Math.random() * (a1 - a0);
      const [sp0, sp1] = o.speed ?? [200, 600];
      const sp = sp0 + Math.random() * (sp1 - sp0);
      const [l0, l1] = o.life ?? [0.4, 0.9];
      const [sc0, sc1] = o.scale ?? [0.3, 0.8];
      const sc = sc0 + Math.random() * (sc1 - sc0);
      s.scale.set(sc);
      s.alpha = o.alpha ?? 1;
      s.rotation = Math.random() * Math.PI * 2;
      const life = l0 + Math.random() * (l1 - l0);
      this.ps.push({
        s,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        vr: (Math.random() - 0.5) * (o.spin ?? 6),
        life,
        max: life,
        g: o.gravity ?? 900,
        drag: o.drag ?? 1.5,
        s0: sc,
        s1: sc * (o.endScale ?? 0.1),
        a0: s.alpha,
        stepped: !!o.stepped,
      });
      this.addChild(s);
    }
  }

  private update(t: Ticker) {
    const dt = Math.min(0.05, t.deltaMS / 1000);
    this.acc += dt;
    const stepTick = this.acc >= 1 / 12;
    if (stepTick) this.acc = 0;
    for (let i = this.ps.length - 1; i >= 0; i--) {
      const p = this.ps[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.s.destroy();
        this.ps.splice(i, 1);
        continue;
      }
      p.vx *= 1 - p.drag * dt;
      p.vy *= 1 - p.drag * dt;
      p.vy += p.g * dt;
      if (!p.stepped || stepTick) {
        const k = p.stepped ? 1 / 12 : dt;
        p.s.x += p.vx * k;
        p.s.y += p.vy * k;
        p.s.rotation += p.vr * k;
        const f = 1 - p.life / p.max;
        p.s.scale.set(p.s0 + (p.s1 - p.s0) * f);
        p.s.alpha = p.a0 * Math.min(1, (p.life / p.max) * 2.5);
      }
    }
  }

  override destroy() {
    Ticker.shared.remove(this.update, this);
    super.destroy({ children: true });
  }
}
