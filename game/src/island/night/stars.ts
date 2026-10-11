/**
 * Stars that FALL UPWARD (pooled). A star detaches from the water / the void / the ground, starts slow and
 * accelerates up like reversed gravity, its trail stretching with speed. Used twice: far and faint behind
 * the islands (screen space, in the night sky) and near and bright in front (world space, lights layer).
 */
import { Container, Sprite } from 'pixi.js';
import { sparkTexture } from '../../art/textures';
import { streakTex } from './textures';

export interface StarSpawn {
  x: number;
  y: number;
  /** size multiplier (1 = near star) */
  scale?: number;
  /** initial upward speed px/s (positive = up) */
  v0?: number;
  /** upward acceleration px/s² */
  acc?: number;
  tint?: number;
  /** seconds before it starts rising (a burst staggers its stars) */
  delay?: number;
  /** called once when it starts rising (ripples, a cat glancing at it…) */
  onRise?: (x: number, y: number) => void;
  /** 'day': an ink-violet trail that reads over a sunny island (additive light would vanish) */
  look?: 'night' | 'day';
}

interface P {
  tail: Sprite;
  head: Sprite;
  x: number;
  y: number;
  vy: number;
  acc: number;
  wob: number;
  ph: number;
  age: number;
  delay: number;
  scale: number;
  day?: boolean;
  onRise?: (x: number, y: number) => void;
}

const TINTS = [0xffffff, 0xfff4d6, 0xe2dbff, 0xc8ecff, 0xffe0f2];

export class RisingStars extends Container {
  private live: P[] = [];
  private pool: P[] = [];
  constructor(
    private max = 90,
    private headScale = 0.34,
  ) {
    super();
    this.eventMode = 'none';
  }
  get count() {
    return this.live.length;
  }

  spawn(o: StarSpawn) {
    if (this.live.length >= this.max) return false;
    let p = this.pool.pop();
    if (!p) {
      const tail = new Sprite(streakTex());
      tail.anchor.set(0.5, 0.05);
      tail.blendMode = 'add';
      const head = new Sprite(sparkTexture());
      head.anchor.set(0.5);
      head.blendMode = 'add';
      this.addChild(tail, head);
      p = { tail, head, x: 0, y: 0, vy: 0, acc: 0, wob: 0, ph: 0, age: 0, delay: 0, scale: 1 };
    }
    p.x = o.x;
    p.y = o.y;
    p.vy = -(o.v0 ?? 40 + Math.random() * 60);
    p.acc = o.acc ?? 260 + Math.random() * 300;
    p.wob = (Math.random() - 0.5) * 18;
    p.ph = Math.random() * 6.28;
    p.age = 0;
    p.delay = o.delay ?? 0;
    p.scale = o.scale ?? 1;
    p.onRise = o.onRise;
    const tint = o.tint ?? TINTS[Math.floor(Math.random() * TINTS.length)];
    const day = o.look === 'day';
    p.tail.tint = day ? 0x6a4cff : tint;
    p.tail.blendMode = day ? 'normal' : 'add';
    p.head.tint = day ? 0xffffff : tint;
    p.day = day;
    p.tail.visible = p.head.visible = p.delay <= 0;
    p.tail.alpha = p.head.alpha = 0;
    this.live.push(p);
    return true;
  }

  /** `top`: y (this container's space) above which a star is gone */
  update(dt: number, top: number, reduceMotion: boolean) {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i];
      if (p.delay > 0) {
        p.delay -= dt;
        if (p.delay > 0) continue;
        p.tail.visible = p.head.visible = true;
      }
      if (p.age === 0) p.onRise?.(p.x, p.y);
      p.age += dt;
      const acc = reduceMotion ? p.acc * 0.45 : p.acc;
      p.vy -= acc * dt;
      p.y += p.vy * dt;
      p.x += Math.sin(p.age * 2.2 + p.ph) * p.wob * dt;
      const sp = -p.vy;
      const fade = Math.min(1, p.age / 0.35);
      p.head.position.set(p.x, p.y);
      p.head.rotation = p.age * 3 + p.ph;
      const tw = 0.75 + 0.25 * Math.sin(p.age * 18 + p.ph);
      p.head.scale.set(this.headScale * p.scale * (0.7 + 0.3 * tw));
      p.head.alpha = fade;
      p.tail.position.set(p.x, p.y);
      p.tail.scale.set(0.72 * p.scale, Math.max(0.08, Math.min(1.5, sp / 560)) * p.scale);
      p.tail.alpha = fade * (p.day ? 0.78 : 0.95);
      if (p.y < top - 260) {
        p.tail.visible = p.head.visible = false;
        this.live.splice(i, 1);
        this.pool.push(p);
      }
    }
  }

  clear() {
    for (const p of this.live.splice(0)) {
      p.tail.visible = p.head.visible = false;
      this.pool.push(p);
    }
  }
}
