/**
 * Floating plates: every island floats on its own slab of rock that holds a small lagoon (the
 * water ring the fishing pens / boats sit on). The slab hangs below as an inverted mountain whose
 * silhouette style depends on the dimension (round, jagged, crystal, pixel stairs, upside-down city).
 */
import { key, Tile } from '../archipelago';
import { isoToScreen, TW, TH } from '../iso';
import type { DimDef } from './defs';

export interface Plate {
  id: string;
  land: Tile[];
  wet: Tile[];
  has: Set<string>;
  /** wet tile → distance (tiles) to its island */
  dist: Map<string, number>;
  /** land centre (screen, land level) */
  cx: number;
  cy: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function h2(a: number, b: number, s = 0) {
  let h = (a * 374761393 + b * 668265263 + s * 974711) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** land ∪ lagoon ring per region. `force` = water tiles that must be inside a plate (pens, boats). */
export function buildPlates(tiles: Map<string, Tile>, force: Set<string> = new Set(), R = 1.6): Map<string, Plate> {
  const near = new Map<string, Map<string, number>>();
  for (const t of tiles.values())
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -3; dx <= 3; dx++) {
        const k = key(t.gx + dx, t.gy + dy);
        if (tiles.has(k)) continue;
        const d = Math.hypot(dx, dy);
        let m = near.get(k);
        if (!m) near.set(k, (m = new Map()));
        if ((m.get(t.region) ?? 99) > d) m.set(t.region, d);
      }
  const plates = new Map<string, Plate>();
  const get = (id: string) => {
    let p = plates.get(id);
    if (!p) plates.set(id, (p = { id, land: [], wet: [], has: new Set(), dist: new Map(), cx: 0, cy: 0, minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }));
    return p;
  };
  for (const t of tiles.values()) {
    const p = get(t.region);
    p.land.push(t);
    p.has.add(key(t.gx, t.gy));
  }
  for (const [k, m] of near) {
    const list = [...m.entries()].sort((a, b) => a[1] - b[1]);
    const [r1, d1] = list[0];
    const d2 = list[1]?.[1] ?? 99;
    const [gx, gy] = k.split(',').map(Number);
    let ok: boolean;
    if (force.has(k)) ok = true;
    else if (d1 > R) ok = false;
    else if (d2 <= 2.9) ok = d1 <= 1.01 && d2 >= 2.4;
    else ok = !(d1 > 1.5 && h2(gx, gy, 5) < 0.2);
    if (!ok) continue;
    const p = get(r1);
    p.wet.push({ gx, gy, region: r1 });
    p.has.add(k);
    p.dist.set(k, d1);
  }
  // prune lonely wet tiles (keeps the rim clean)
  for (const p of plates.values()) {
    for (let pass = 0; pass < 2; pass++)
      p.wet = p.wet.filter((t) => {
        const k = key(t.gx, t.gy);
        if (force.has(k)) return true;
        let n = 0;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ])
          if (p.has.has(key(t.gx + dx, t.gy + dy))) n++;
        if (n <= 1) {
          p.has.delete(k);
          return false;
        }
        return true;
      });
    let sx = 0;
    let sy = 0;
    for (const t of p.land) {
      const s = isoToScreen(t.gx, t.gy);
      sx += s.x;
      sy += s.y;
    }
    p.cx = sx / Math.max(1, p.land.length);
    p.cy = sy / Math.max(1, p.land.length);
    for (const t of [...p.land, ...p.wet]) {
      const s = isoToScreen(t.gx, t.gy);
      p.minX = Math.min(p.minX, s.x - TW / 2);
      p.maxX = Math.max(p.maxX, s.x + TW / 2);
      p.minY = Math.min(p.minY, s.y - TH / 2);
      p.maxY = Math.max(p.maxY, s.y + TH / 2);
    }
  }
  return plates;
}

export interface Face {
  /** top edge at sea level, left→right on screen */
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  side: 'l' | 'r';
  gx: number;
  gy: number;
  /** nothing of the plate in front of it (good spot for a waterfall) */
  front: boolean;
}

/** exposed south faces of a plate, back-to-front */
export function plateFaces(p: Plate, drop: number): Face[] {
  const out: Face[] = [];
  const all = [...p.land, ...p.wet].sort((a, b) => a.gx + a.gy - (b.gx + b.gy) || a.gx - b.gx);
  for (const t of all) {
    const s = isoToScreen(t.gx, t.gy);
    const y = s.y + drop;
    const front = !p.has.has(key(t.gx + 1, t.gy + 1));
    if (!p.has.has(key(t.gx, t.gy + 1))) out.push({ x0: s.x - TW / 2, y0: y, x1: s.x, y1: y + TH / 2, side: 'l', gx: t.gx, gy: t.gy, front });
    if (!p.has.has(key(t.gx + 1, t.gy))) out.push({ x0: s.x, y0: y + TH / 2, x1: s.x + TW / 2, y1: y, side: 'r', gx: t.gx, gy: t.gy, front });
  }
  return out;
}

/** hanging-rock depth (px below the rim) as a function of screen x */
export function depthProfile(p: Plate, d: DimDef, seed: number) {
  const halfW = (p.maxX - p.minX) / 2;
  const cx = (p.minX + p.maxX) / 2;
  const D = d.depth * Math.max(200, Math.min(560, halfW * 0.74));
  const bumps: { x: number; w: number; h: number }[] = [];
  const nb = 5;
  for (let i = 0; i < nb; i++) bumps.push({ x: cx + (h2(seed, i, 1) - 0.5) * 1.2 * halfW, w: (0.07 + h2(seed, i, 2) * 0.16) * halfW, h: (0.1 + h2(seed, i, 3) * 0.3) * D });
  const smooth = (X: number) => {
    const u = (X - cx) / halfW;
    const env = Math.max(0, 1 - u * u);
    let v = D * Math.pow(env, 1.55);
    for (const b of bumps) v += b.h * Math.exp(-(((X - b.x) / b.w) ** 2)) * env * env;
    return v;
  };
  const S = d.spikes;
  const fn = (X: number) => {
    let v: number;
    if (S === 'pixel') {
      const q = Math.floor(X / 24);
      v = smooth(q * 24 + 12);
      v = Math.round(v / 22) * 22 + (h2(q, seed, 7) < 0.3 ? 22 : 0);
    } else if (S === 'city') {
      const q = Math.floor(X / 34);
      const base = smooth(q * 34 + 17);
      const r = h2(q, seed, 8);
      v = base * (0.45 + r * 0.6);
      if (r > 0.86) v = base * 1.25;
      v = Math.round(v / 12) * 12;
    } else {
      v = smooth(X);
      if (S === 'round') v += Math.sin(X * 0.045 + seed) * D * 0.025 + Math.sin(X * 0.13) * D * 0.012;
      else if (S === 'jagged') {
        const q = Math.floor(X / 18);
        const f = X / 18 - q;
        const a = h2(q, seed, 9);
        const b = h2(q + 1, seed, 9);
        v += ((a * (1 - f) + b * f) - 0.5) * D * 0.22 * (0.4 + v / D);
      } else if (S === 'crystal') {
        const per = 30;
        const q = Math.floor(X / per);
        const f = X / per - q;
        const amp = h2(q, seed, 10);
        const tri = 1 - Math.abs(f - 0.5) * 2;
        v += (tri * amp * amp * 0.5 - 0.08) * D * (0.3 + v / D);
      }
    }
    return Math.max(16, v);
  };
  return { fn, D, cx, halfW };
}

/** sampled bottom edge of a face (left→right), with hard steps for pixel/city styles */
export function faceBottom(f: Face, depth: (x: number) => number, stepped: boolean, step: number): [number, number][] {
  const yAt = (x: number) => f.y0 + ((x - f.x0) / (f.x1 - f.x0)) * (f.y1 - f.y0);
  const pts: [number, number][] = [];
  if (!stepped) {
    const n = 6;
    for (let i = 0; i <= n; i++) {
      const x = f.x0 + ((f.x1 - f.x0) * i) / n;
      pts.push([x, yAt(x) + depth(x)]);
    }
    return pts;
  }
  let x = f.x0;
  pts.push([x, yAt(x) + depth(x + 0.01)]);
  let nx = (Math.floor(x / step) + 1) * step;
  while (nx < f.x1) {
    pts.push([nx, yAt(nx) + depth(nx - 0.01)]);
    pts.push([nx, yAt(nx) + depth(nx + 0.01)]);
    nx += step;
  }
  x = f.x1;
  pts.push([x, yAt(x) + depth(x - 0.01)]);
  return pts;
}
