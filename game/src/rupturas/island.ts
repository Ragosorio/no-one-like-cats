/**
 * La isla de siempre, en 2.5D: the shape and the points of interest of the home island used by the
 * Parte II vertical slice. Game content (not engine): the engine's Heightfield samples `heightAt`.
 *
 * Units: 1 = roughly one cat-length. Sea level is y = 0. +x east, +z south (toward the default camera).
 */
import { clamp, fbm, lerp, smoothstep } from '../engine/core/noise';

export const SEA = 0;
export const ISLAND_R = 44;
/** half-size of the square the terrain mesh / height texture covers */
export const TERRAIN_HALF = 64;

export interface Pad {
  x: number;
  z: number;
  r: number;
  h: number;
}

/** flattened spots where buildings stand (smoothly blended into the terrain) */
export const PADS: Record<string, Pad> = {
  lighthouse: { x: 27, z: -22, r: 6.5, h: 7.2 },
  palm: { x: 1, z: -3, r: 4.5, h: 2.4 },
  fire: { x: -15, z: 4, r: 6.5, h: 2.0 },
  ice: { x: -7, z: 15, r: 5.8, h: 1.7 },
  cosmic: { x: 15, z: 7, r: 6, h: 2.6 },
  dock: { x: 3, z: 27, r: 5, h: 0.9 },
  sanctuary: { x: -6, z: -16, r: 5, h: 3.6 },
};

export const POI = {
  dockEnd: { x: 3, z: 37 },
  shipMoor: { x: 9, z: 41 },
  /** where the practice raft floats for the ability demo */
  arena: { x: 62, z: 96 },
};

/** island silhouette: a warped circle with a headland to the north-east for the lighthouse */
function mask(x: number, z: number) {
  const a = Math.atan2(z, x);
  const warp = 1 + 0.16 * Math.sin(a * 3 + 0.6) + 0.08 * Math.sin(a * 5 - 1.2) + 0.1 * fbm(x * 0.03, z * 0.03, 3, 5);
  // headland toward the lighthouse
  const hx = x - 27;
  const hz = z + 22;
  const head = Math.exp(-(hx * hx + hz * hz) / 260) * 0.45;
  const r = Math.hypot(x, z) / (ISLAND_R * warp * (1 + head));
  return 1 - smoothstep(0.62, 1.0, r);
}

/** terrain height (world units) at x,z — pure, deterministic */
export function heightAt(x: number, z: number) {
  const m = mask(x, z);
  if (m <= 0) return -6 - 3 * smoothstep(0, 30, Math.hypot(x, z) - ISLAND_R);
  // rolling base + a ridge toward the north-east cliff
  let h = m * (2.2 + 1.4 * fbm(x * 0.045, z * 0.045, 4, 1));
  h += m * m * 4.5 * Math.exp(-((x - 20) ** 2 + (z + 18) ** 2) / 420);
  h += m * 1.2 * Math.exp(-((x + 8) ** 2 + (z + 14) ** 2) / 300);
  // gentle terraces (stylized steps on hills), only where it is high
  const step = 1.25;
  const terr = Math.floor(h / step) * step + smoothstep(0.35, 1, (h % step) / step) * step;
  h = lerp(h, terr, 0.45 * smoothstep(2.5, 4.5, h));
  // beach shelf: below the mask edge sink under the sea
  h = lerp(-1.6, h, smoothstep(0.0, 0.22, m));
  for (const p of Object.values(PADS)) {
    const d = Math.hypot(x - p.x, z - p.z);
    const w = 1 - smoothstep(p.r * 0.7, p.r * 1.35, d);
    if (w > 0) h = lerp(h, p.h, w);
  }
  // the dock pier: a raised path to the sea
  return h;
}

/** cheap normal-ish slope (rise per unit) */
export function slopeAt(x: number, z: number) {
  const e = 0.6;
  const dx = heightAt(x + e, z) - heightAt(x - e, z);
  const dz = heightAt(x, z + e) - heightAt(x, z - e);
  return Math.hypot(dx, dz) / (2 * e);
}

/** can a cat walk here? (above the waterline, not a cliff) */
export function walkable(x: number, z: number) {
  const h = heightAt(x, z);
  return h > SEA + 0.45 && slopeAt(x, z) < 1.1;
}

export const clampToIsland = (x: number, z: number) => {
  const r = Math.hypot(x, z);
  const max = ISLAND_R * 0.82;
  if (r <= max) return [x, z] as const;
  return [(x / r) * max, (z / r) * max] as const;
};

export { clamp };
