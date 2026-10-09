/**
 * Per-cell status visuals (burning / wet / frozen / charged / rooted / cursed / voided / steam),
 * drawn on top of the illustration and animated "on twos" (12 fps) by the ship view.
 */
import { Container, Graphics, Sprite } from 'pixi.js';
import type { StatusId } from '../types';
import { flameFrames } from './decorArt';
import { hash } from './util';

export const STATUS_TINT: Partial<Record<StatusId, number>> = {
  frozen: 0xd2f1ff,
  burning: 0xffcfb0,
  charged: 0xfff2a8,
  wet: 0xaecbff,
  cursed: 0xdcc0ff,
  rooted: 0xd4ecb4,
  voided: 0x9a88b8,
  steam: 0xf2f2f2,
  prism: 0xe6e0ff,
};
const TINT_ORDER: StatusId[] = ['frozen', 'burning', 'charged', 'voided', 'wet', 'cursed', 'rooted', 'steam', 'prism'];

export function statusTint(st: Partial<Record<StatusId, number>>): number {
  for (const k of TINT_ORDER) if (st[k]) return STATUS_TINT[k] ?? 0xffffff;
  return 0xffffff;
}

export function hasAnyStatus(st: Partial<Record<StatusId, number>>) {
  for (const k in st) if (st[k as StatusId]) return true;
  return false;
}

export class CellStatusFx extends Container {
  private stat = new Graphics();
  private anim = new Graphics();
  private flame: Sprite | null = null;
  kinds = new Set<StatusId>();
  constructor(public seed: number, public ink: number, public coverage: number) {
    super();
    this.addChild(this.stat, this.anim);
  }

  set(st: Partial<Record<StatusId, number>>) {
    const next = new Set<StatusId>();
    for (const k in st) if (st[k as StatusId]) next.add(k as StatusId);
    const same = next.size === this.kinds.size && [...next].every((k) => this.kinds.has(k));
    this.kinds = next;
    if (!same) this.drawStatic();
    if (next.has('burning') && !this.flame) {
      const ff = flameFrames();
      this.flame = new Sprite(ff.frames[0]);
      this.flame.anchor.set(ff.ax, ff.ay);
      this.flame.position.set(0, 16);
      const k = Math.max(0.6, Math.min(1, this.coverage * 1.4));
      this.flame.scale.set(k * (hash(this.seed, 3) > 0.5 ? 1 : -1), k);
      this.addChild(this.flame);
    } else if (!next.has('burning') && this.flame) {
      this.flame.destroy();
      this.flame = null;
    }
  }

  get burning() {
    return this.kinds.has('burning');
  }

  private drawStatic() {
    const g = this.stat;
    g.clear();
    const s = this.seed;
    const ink = this.ink;
    const k = Math.max(0.55, Math.min(1, this.coverage * 1.4));
    if (this.kinds.has('rooted')) {
      for (let i = 0; i < 2; i++) {
        const y0 = -14 + i * 18 + hash(s, i, 1) * 6;
        g.moveTo(-22 * k, y0).bezierCurveTo(-8 * k, y0 - 14, 6 * k, y0 + 14, 22 * k, y0 - 4);
        g.stroke({ width: 6, color: ink, cap: 'round' });
        g.moveTo(-22 * k, y0).bezierCurveTo(-8 * k, y0 - 14, 6 * k, y0 + 14, 22 * k, y0 - 4);
        g.stroke({ width: 3, color: 0x3fae4a, cap: 'round' });
        for (let j = 0; j < 3; j++) {
          const lx = (-14 + j * 14) * k;
          const ly = y0 + (j === 1 ? 3 : -5);
          g.ellipse(lx, ly - 4, 4.5, 2.6).fill(0x7ed957).stroke({ width: 1.6, color: ink });
        }
      }
    }
    if (this.kinds.has('frozen')) {
      const R = 21 * k;
      const n = 11;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const r = R * (i % 2 ? 0.78 : 1.05) * (0.9 + hash(s, i, 3) * 0.2);
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r * 0.92;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath().fill({ color: 0xc8f4ff, alpha: 0.62 }).stroke({ width: 2.2, color: 0x2f8fc0, join: 'miter' });
      g.moveTo(-R * 0.6, -R * 0.1).lineTo(-R * 0.15, -R * 0.62).stroke({ width: 2.6, color: 0xffffff, alpha: 0.95, cap: 'round' });
      g.moveTo(-R * 0.45, R * 0.2).lineTo(-R * 0.25, 0).stroke({ width: 2, color: 0xffffff, alpha: 0.8, cap: 'round' });
      // facets
      g.moveTo(0, -R).lineTo(R * 0.15, R * 0.1).lineTo(R * 0.9, R * 0.3).stroke({ width: 1.2, color: 0x7fd0f0, alpha: 0.9 });
      // icicles
      for (let i = 0; i < 3; i++) {
        const x = (-12 + i * 12) * k;
        const h = 7 + hash(s, i, 9) * 8;
        g.moveTo(x - 3.5, R * 0.75).lineTo(x + 3.5, R * 0.75).lineTo(x, R * 0.75 + h).closePath().fill(0xe4fbff).stroke({ width: 1.6, color: 0x2f8fc0 });
      }
    }
    if (this.kinds.has('wet')) {
      g.moveTo(-12 * k, -12).lineTo(-4 * k, -18).stroke({ width: 2.6, color: 0xffffff, alpha: 0.85, cap: 'round' });
      g.moveTo(6 * k, 4).lineTo(12 * k, 0).stroke({ width: 2, color: 0xe6f4ff, alpha: 0.7, cap: 'round' });
    }
  }

  /** frame step (12 fps) */
  step(frame: number, t: number) {
    const g = this.anim;
    g.clear();
    const s = this.seed;
    const ink = this.ink;
    const k = Math.max(0.55, Math.min(1, this.coverage * 1.4));
    if (this.flame) {
      const ff = flameFrames();
      this.flame.texture = ff.frames[(frame + Math.floor(s)) % ff.frames.length];
    }
    if (this.kinds.has('wet')) {
      for (let i = 0; i < 2; i++) {
        const ph = ((t * 0.9 + hash(s, i, 2)) % 1);
        const dx = (-8 + i * 14) * k;
        const dy = -10 + ph * 26;
        g.moveTo(dx, dy - 5).quadraticCurveTo(dx + 4, dy + 1, dx, dy + 3).quadraticCurveTo(dx - 4, dy + 1, dx, dy - 5).fill({ color: 0x6fb8ff, alpha: 1 - ph * 0.5 }).stroke({ width: 1.4, color: ink, alpha: 1 - ph * 0.5 });
      }
    }
    if (this.kinds.has('frozen') && frame % 4 < 2) {
      const sx = (hash(s, Math.floor(frame / 4), 1) - 0.5) * 30 * k;
      const sy = (hash(s, Math.floor(frame / 4), 2) - 0.5) * 26;
      const r = frame % 4 === 0 ? 5 : 3;
      g.moveTo(sx, sy - r).lineTo(sx + r * 0.25, sy - r * 0.25).lineTo(sx + r, sy).lineTo(sx + r * 0.25, sy + r * 0.25).lineTo(sx, sy + r).lineTo(sx - r * 0.25, sy + r * 0.25).lineTo(sx - r, sy).lineTo(sx - r * 0.25, sy - r * 0.25).closePath().fill(0xffffff);
    }
    if (this.kinds.has('charged') && hash(s, frame, 13) < 0.75) {
      for (let b = 0; b < 2; b++) {
        let x = (hash(s, frame, 20 + b) - 0.5) * 34 * k;
        let y = -18;
        g.moveTo(x, y);
        const pts: [number, number][] = [[x, y]];
        for (let i = 0; i < 4; i++) {
          x += (hash(s, frame, 30 + i + b * 5) - 0.5) * 18;
          y += 9;
          pts.push([x, y]);
        }
        for (const [w, c] of [[5, ink], [2.4, 0xffe14a]] as const) {
          g.moveTo(pts[0][0], pts[0][1]);
          for (const p of pts.slice(1)) g.lineTo(p[0], p[1]);
          g.stroke({ width: w, color: c, join: 'miter', cap: 'round' });
        }
      }
    }
    if (this.kinds.has('cursed')) {
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.35 + i / 3 + hash(s, i, 4) * 0.2) % 1;
        const rx = (hash(s, i, 8) - 0.5) * 26 * k;
        const ry = 14 - ph * 40;
        const a = 1 - Math.abs(ph - 0.5) * 2;
        const r = 5.5;
        g.circle(rx, ry, r + 3).fill({ color: 0x8a5cff, alpha: 0.25 * a });
        g.circle(rx, ry, r).stroke({ width: 3.6, color: ink, alpha: a });
        g.circle(rx, ry, r).stroke({ width: 1.8, color: 0xc9a6ff, alpha: a });
        g.moveTo(rx - r, ry).lineTo(rx + r, ry).moveTo(rx, ry - r).lineTo(rx + r * 0.6, ry + r * 0.6).stroke({ width: 1.6, color: 0xe9d8ff, alpha: a });
      }
    }
    if (this.kinds.has('voided')) {
      for (let i = 0; i < 4; i++) {
        if (hash(s, frame, 40 + i) < 0.4) continue;
        const x = (hash(s, frame, 50 + i) - 0.5) * 34;
        const y = (hash(s, frame, 60 + i) - 0.5) * 34;
        g.rect(x, y, 4 + hash(s, frame, i) * 10, 3 + hash(s, frame, i + 9) * 4).fill(i % 2 ? 0x0d0a14 : 0xff2e88);
      }
    }
    if (this.kinds.has('prism')) {
      // Cristal: nacre glints wander over the cell (pearl / sky / lilac / sea-glass)
      const cols = [0xf7f2ff, 0x8fd3ff, 0xb79cff, 0x6fe0c8];
      for (let i = 0; i < 2; i++) {
        const f = Math.floor(frame / 3) + i * 7;
        const gx = (hash(s, f, 70 + i) - 0.5) * 32 * k;
        const gy = (hash(s, f, 80 + i) - 0.5) * 28;
        const r = 3.5 + hash(s, f, 90 + i) * 3;
        g.poly([gx, gy - r * 1.4, gx + r, gy, gx, gy + r * 1.4, gx - r, gy]).fill(cols[(f + i) % 4]).stroke({ width: 1.4, color: ink });
      }
    }
    if (this.kinds.has('steam')) {
      const ph = (t * 0.6 + hash(s, 1, 1)) % 1;
      g.circle(Math.sin(t * 2 + s) * 6, -6 - ph * 22, 6 + ph * 6).fill({ color: 0xffffff, alpha: 0.6 * (1 - ph) });
    }
  }
}
