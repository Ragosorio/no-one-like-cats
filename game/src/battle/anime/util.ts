import { Container, Matrix } from 'pixi.js';
import gsap from 'gsap';

export type Pt = [number, number];

/** Deterministic hash → [0,1). */
export function hash(a: number, b = 0, c = 0): number {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1) ^ Math.imul(c | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Signed deterministic hash → [-1,1). */
export function shash(a: number, b = 0, c = 0): number {
  return hash(a, b, c) * 2 - 1;
}

/** Small seeded PRNG (mulberry32). */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function css(c: number, a = 1): string {
  if (a >= 1) return '#' + (c & 0xffffff).toString(16).padStart(6, '0');
  return `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;
}

export function mix(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t);
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v;
}

/** Fixed-distance corner cutting (rounded rectilinear outlines without Chaikin's length-relative blowup). */
export function roundPoly(pts: Pt[], radii: number[]): Pt[] {
  let cur = pts;
  for (const r of radii) {
    const out: Pt[] = [];
    const n = cur.length;
    for (let i = 0; i < n; i++) {
      const p0 = cur[(i - 1 + n) % n];
      const p1 = cur[i];
      const p2 = cur[(i + 1) % n];
      const d0 = Math.hypot(p0[0] - p1[0], p0[1] - p1[1]);
      const d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const a = Math.min(r, d0 * 0.5);
      const b = Math.min(r, d2 * 0.5);
      if (d0 < 1e-6 || d2 < 1e-6) {
        out.push(p1);
        continue;
      }
      out.push([p1[0] + ((p0[0] - p1[0]) / d0) * a, p1[1] + ((p0[1] - p1[1]) / d0) * a]);
      out.push([p1[0] + ((p2[0] - p1[0]) / d2) * b, p1[1] + ((p2[1] - p1[1]) / d2) * b]);
    }
    cur = dedupe(out);
  }
  return cur;
}

function dedupe(pts: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (const p of pts) {
    const q = out[out.length - 1];
    if (!q || Math.abs(q[0] - p[0]) > 0.01 || Math.abs(q[1] - p[1]) > 0.01) out.push(p);
  }
  if (out.length > 1) {
    const a = out[0];
    const b = out[out.length - 1];
    if (Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[1] - b[1]) < 0.01) out.pop();
  }
  return out;
}

/** Move a display object to a new parent keeping its on-screen transform. */
export function reparentKeep(obj: Container, parent: Container) {
  const g = obj.getGlobalTransform(new Matrix(), false);
  const inv = parent.getGlobalTransform(new Matrix(), false).clone().invert();
  inv.append(g);
  parent.addChild(obj);
  obj.setFromMatrix(inv);
}

/** Smooth noise-ish wobble from sines (no allocation). */
export function wob(t: number, seed: number) {
  return Math.sin(t * 1.7 + seed) * 0.6 + Math.sin(t * 3.1 + seed * 2.3) * 0.4;
}

/** Kill every gsap tween targeting this object (and its scale/position) or any descendant. */
export function killTweensDeep(o: Container) {
  if (o.destroyed) return;
  gsap.killTweensOf(o);
  gsap.killTweensOf(o.scale);
  gsap.killTweensOf(o.position);
  for (const c of o.children) killTweensDeep(c as Container);
}
