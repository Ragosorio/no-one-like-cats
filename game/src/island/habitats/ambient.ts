/**
 * Ambient life of a habitat: a small fixed pool of particles (embers, bubbles, snow, notes, spores…)
 * that move analytically from the time (no per-frame allocations, stepped "on twos" like the rest of
 * the island), glows that breathe, and the reaction when its gold is collected (a burst: particles
 * speed up, glows flare, a ring sweeps the yard). Shapes share one GraphicsContext per kind+colour.
 * settings.reduceMotion: particles hide, glows stay still.
 */
import { Container, Graphics, GraphicsContext, Sprite } from 'pixi.js';
import { C } from '../../ui/theme';
import { settings } from '../../core/settings';
import type { Pt } from './kit';

export type PKind = 'ember' | 'bubble' | 'leaf' | 'petal' | 'mote' | 'spark' | 'firefly' | 'twinkle' | 'static' | 'snow' | 'note' | 'spore' | 'sand' | 'rune' | 'shard';

const ctxCache = new Map<string, GraphicsContext>();
function shapeOf(kind: PKind, col: number): GraphicsContext {
  const k = `${kind}:${col}`;
  const hit = ctxCache.get(k);
  if (hit) return hit;
  const g = new GraphicsContext();
  const ink = { width: 1.2, color: C.ink, alpha: 0.9 };
  switch (kind) {
    case 'ember':
      g.poly([0, -4.5, 2.6, 0, 0, 4.5, -2.6, 0]).fill(col);
      g.poly([0, -2, 1.1, 0, 0, 2, -1.1, 0]).fill(0xfff1b0);
      break;
    case 'bubble':
      g.circle(0, 0, 4.2).fill({ color: col, alpha: 0.25 }).stroke({ width: 1.4, color: 0xffffff, alpha: 0.9 });
      g.circle(-1.4, -1.5, 1.2).fill(0xffffff);
      break;
    case 'leaf':
      g.moveTo(-5, 0).quadraticCurveTo(0, -5, 5, 0).quadraticCurveTo(0, 5, -5, 0).fill(col).stroke(ink);
      g.moveTo(-4, 0).lineTo(4, 0).stroke({ width: 0.8, color: C.ink, alpha: 0.5 });
      break;
    case 'petal':
      g.ellipse(0, 0, 3.6, 2.2).fill(col).stroke({ width: 1, color: C.ink, alpha: 0.6 });
      break;
    case 'mote':
      g.circle(0, 0, 4).fill({ color: col, alpha: 0.25 });
      g.circle(0, 0, 1.8).fill(col);
      break;
    case 'spark':
      g.star(0, 0, 4, 5.5, 1.4).fill(col).stroke({ width: 1, color: C.ink, alpha: 0.7 });
      break;
    case 'firefly':
      g.circle(0, 0, 6).fill({ color: col, alpha: 0.22 });
      g.circle(0, 0, 3).fill({ color: col, alpha: 0.5 });
      g.circle(0, 0, 1.6).fill(0xffffff);
      break;
    case 'twinkle':
      g.star(0, 0, 4, 6, 1.3).fill(col);
      break;
    case 'static':
      g.rect(-3, -0.8, 6, 1.6).fill(col);
      break;
    case 'snow':
      g.circle(0, 0, 2.6).fill(col).stroke({ width: 0.8, color: 0x5aa9d6, alpha: 0.7 });
      break;
    case 'note':
      g.ellipse(0, 0, 3.6, 2.7).fill(col).stroke(ink);
      g.rect(2.4, -10, 1.8, 10).fill(C.ink);
      g.poly([2.4, -10, 7.5, -6.5, 3.2, -6.5]).fill(C.ink);
      break;
    case 'spore':
      g.circle(0, 0, 5).fill({ color: col, alpha: 0.2 });
      g.circle(0, 0, 2).fill(col);
      break;
    case 'sand':
      g.rect(-1.4, -1.4, 2.8, 2.8).fill(col);
      break;
    case 'rune':
      g.circle(0, 0, 4.5).stroke({ width: 1.4, color: col });
      g.poly([0, -3.2, 2.8, 1.8, -2.8, 1.8]).stroke({ width: 1.2, color: col });
      break;
    case 'shard':
      g.poly([0, -4, 3, 2.5, -2.5, 3]).fill(col).stroke({ width: 1, color: C.ink, alpha: 0.8 });
      break;
  }
  ctxCache.set(k, g);
  return g;
}

type Motion = 'rise' | 'fall' | 'wander' | 'blink' | 'jitter' | 'spiral';
const MOTION: Record<PKind, Motion> = {
  ember: 'rise',
  bubble: 'rise',
  note: 'rise',
  rune: 'rise',
  shard: 'rise',
  spore: 'wander',
  leaf: 'fall',
  petal: 'fall',
  snow: 'fall',
  mote: 'wander',
  firefly: 'wander',
  twinkle: 'blink',
  spark: 'jitter',
  static: 'jitter',
  sand: 'spiral',
};

interface Part {
  g: Graphics;
  m: Motion;
  x0: number;
  y0: number;
  ph: number;
  sp: number;
  amp: number;
  h: number;
}

// a fixed jitter table (no Math.random per frame)
const JIT: number[] = [];
for (let i = 0; i < 64; i++) JIT.push(Math.sin(i * 12.9898) * 43758.5453 - Math.floor(Math.sin(i * 12.9898) * 43758.5453) - 0.5);

export class Ambient {
  readonly layer = new Container();
  private parts: Part[] = [];
  private glows: { s: Sprite | Graphics; base: number; ph: number }[] = [];
  private ring: Graphics | null = null;
  private T = 0;
  private lastT = -1;
  private reactT = -99;
  private boost = 0;

  constructor(private r: () => number) {}

  /**
   * add `n` particles; `spot()` gives a base point (px) for each, `h` = travel height (px)
   * (rise/fall), `amp` = sideways sway / wander radius, `sp` = cycles per second
   */
  add(kind: PKind, col: number, n: number, spot: () => Pt, opt: { h?: number; amp?: number; sp?: number } = {}) {
    const ctx = shapeOf(kind, col);
    for (let i = 0; i < n; i++) {
      const g = new Graphics(ctx);
      const p = spot();
      const part: Part = { g, m: MOTION[kind], x0: p.x, y0: p.y, ph: this.r(), sp: (opt.sp ?? 0.25) * (0.75 + this.r() * 0.5), amp: (opt.amp ?? 8) * (0.6 + this.r() * 0.8), h: (opt.h ?? 70) * (0.7 + this.r() * 0.6) };
      g.position.set(p.x, p.y);
      this.layer.addChild(g);
      this.parts.push(part);
    }
  }
  /** a glow (or any display object) whose alpha breathes and flares on collect */
  glow(s: Sprite | Graphics, base = s.alpha) {
    this.glows.push({ s, base, ph: this.r() * 6 });
  }
  /** the collect ring (drawn by the caller, centered on the yard, hidden until a collect) */
  setRing(g: Graphics) {
    this.ring = g;
    g.visible = false;
  }
  /** gold collected: 0.9 s burst */
  react() {
    this.reactT = this.lastT < 0 ? 0 : this.lastT;
  }

  tick(t: number) {
    const dt = this.lastT < 0 ? 0 : Math.max(0, Math.min(0.25, t - this.lastT));
    this.lastT = t;
    this.boost = Math.max(0, 1 - (t - this.reactT) / 0.9);
    const still = settings.reduceMotion;
    this.T += dt * (1 + this.boost * 2.5);
    const T = this.T;
    for (const gl of this.glows) gl.s.alpha = Math.min(1, gl.base * (still ? 1 : 1 + Math.sin(T * 1.7 + gl.ph) * 0.12) + this.boost * 0.45);
    if (this.ring) {
      this.ring.visible = this.boost > 0.02;
      if (this.ring.visible) {
        const k = 1 - this.boost;
        this.ring.scale.set(0.35 + k * 0.9);
        this.ring.alpha = this.boost;
      }
    }
    // LOD: zoomed far out the particles are specks — skip them (and their math)
    const far = (this.layer.parent?.worldTransform.a ?? 1) < 0.42;
    this.layer.visible = !still && !far;
    if (still || far) return;
    for (let i = 0; i < this.parts.length; i++) {
      const p = this.parts[i];
      const g = p.g;
      const k = (T * p.sp + p.ph) % 1;
      switch (p.m) {
        case 'rise':
          g.x = p.x0 + Math.sin(k * 6.28 * 1.3 + p.ph * 6) * p.amp;
          g.y = p.y0 - k * p.h;
          g.alpha = k < 0.12 ? k / 0.12 : k > 0.7 ? (1 - k) / 0.3 : 1;
          break;
        case 'fall':
          g.x = p.x0 + Math.sin(k * 6.28 * 1.6 + p.ph * 6) * p.amp;
          g.y = p.y0 - p.h + k * p.h;
          g.rotation = Math.sin(k * 9 + p.ph) * 0.9;
          g.alpha = k < 0.1 ? k / 0.1 : k > 0.85 ? (1 - k) / 0.15 : 1;
          break;
        case 'wander':
          g.x = p.x0 + Math.sin(T * p.sp * 4.1 + p.ph * 6.28) * p.amp * 2;
          g.y = p.y0 - p.h * 0.4 + Math.cos(T * p.sp * 3.3 + p.ph * 6.28) * p.amp;
          g.alpha = 0.45 + 0.55 * Math.abs(Math.sin(T * 1.9 + p.ph * 6.28));
          break;
        case 'blink': {
          const s = Math.max(0, Math.sin(T * p.sp * 9 + p.ph * 6.28));
          g.scale.set(0.3 + s * 0.9);
          g.alpha = s;
          break;
        }
        case 'jitter': {
          const f = (Math.floor(T * 12) + i * 7) & 63;
          g.x = p.x0 + JIT[f] * p.amp * 2;
          g.y = p.y0 + JIT[(f + 17) & 63] * p.amp;
          g.visible = JIT[(f + 31) & 63] > -0.15 - this.boost * 0.3;
          break;
        }
        case 'spiral': {
          const a = T * p.sp * 6 + p.ph * 6.28;
          const rr = p.amp * (0.4 + 0.6 * k);
          g.x = p.x0 + Math.cos(a) * rr * 2;
          g.y = p.y0 - k * p.h + Math.sin(a) * rr;
          g.alpha = k > 0.75 ? (1 - k) / 0.25 : 1;
          break;
        }
      }
    }
  }
}
