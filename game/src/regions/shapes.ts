/**
 * Small terrain kit shared by the Parte II regions: a warped round island with pads (flattened spots),
 * deterministic and pure (World3D samples it; tests can too).
 */
import { fbm, lerp, smoothstep } from '../engine/core/noise';

export interface Pad {
  x: number;
  z: number;
  r: number;
  h: number;
}

export interface IslandShape {
  radius: number;
  seed: number;
  /** base land height and how hilly it is */
  base: number;
  hills: number;
  pads: Pad[];
  /** extra height bumps (mountains, cliffs) */
  bumps?: { x: number; z: number; r: number; h: number }[];
}

export function islandHeight(s: IslandShape) {
  return (x: number, z: number) => {
    const a = Math.atan2(z, x);
    const warp = 1 + 0.14 * Math.sin(a * 3 + s.seed) + 0.07 * Math.sin(a * 5 - s.seed * 1.7) + 0.1 * fbm(x * 0.03, z * 0.03, 3, s.seed);
    const r = Math.hypot(x, z) / (s.radius * warp);
    const m = 1 - smoothstep(0.62, 1.0, r);
    if (m <= 0) return -6 - 3 * smoothstep(0, 30, Math.hypot(x, z) - s.radius);
    let h = m * (s.base + s.hills * fbm(x * 0.045, z * 0.045, 4, s.seed + 1));
    for (const b of s.bumps ?? []) h += m * b.h * Math.exp(-((x - b.x) ** 2 + (z - b.z) ** 2) / (b.r * b.r));
    h = lerp(-1.6, h, smoothstep(0.0, 0.22, m));
    for (const p of s.pads) {
      const d = Math.hypot(x - p.x, z - p.z);
      const w = 1 - smoothstep(p.r * 0.7, p.r * 1.35, d);
      if (w > 0) h = lerp(h, p.h, w);
    }
    return h;
  };
}

export function walkableOn(height: (x: number, z: number) => number) {
  return (x: number, z: number) => {
    const h = height(x, z);
    if (h < 0.45) return false;
    const e = 0.6;
    const sl = Math.hypot(height(x + e, z) - height(x - e, z), height(x, z + e) - height(x, z - e)) / (2 * e);
    return sl < 1.1;
  };
}
