/**
 * Pure (no Pixi) archipelago generation: home + the 8 expansions from content.json.
 * Deterministic so building plots never move between sessions.
 */
import { EXPANSIONS } from '../data/content';
import { Rng } from '../core/rng';

export interface RegionDef {
  id: string;
  biome: string;
  cx: number;
  cy: number;
  r: number;
  /** expansion number (0 = home) */
  n?: number;
}

export interface Tile {
  gx: number;
  gy: number;
  region: string;
}

export const GRID = 52;
/** content regions are spread around home so every expansion is its own island (sea channels between) */
export const SPREAD = 1.65;
export const HOME_ID = 'home';

export const HOME_REGION: RegionDef = { id: HOME_ID, biome: 'home', cx: 24, cy: 24, r: 7.6, n: 0 };

export function islandRegions(): RegionDef[] {
  const H = HOME_REGION;
  return [
    H,
    ...EXPANSIONS.map((e) => ({
      id: e.id,
      biome: e.biome,
      cx: H.cx + (e.region.cx - 22) * SPREAD,
      cy: H.cy + (e.region.cy - 22) * SPREAD,
      r: e.region.r,
      n: e.n,
    })),
  ];
}

export const key = (gx: number, gy: number) => `${gx},${gy}`;

/** One blob per region with a noisy edge. First region claims overlapping tiles. */
export function generateArchipelago(regions: RegionDef[], seed = 7): Map<string, Tile> {
  const rng = new Rng(seed);
  const tiles = new Map<string, Tile>();
  for (const r of regions) {
    const wob = Array.from({ length: 12 }, () => rng.range(0.8, 1.12));
    for (let gy = Math.floor(r.cy - r.r - 2); gy <= r.cy + r.r + 2; gy++)
      for (let gx = Math.floor(r.cx - r.r - 2); gx <= r.cx + r.r + 2; gx++) {
        if (gx < 1 || gy < 1 || gx >= GRID - 1 || gy >= GRID - 1) continue;
        const dx = gx - r.cx;
        const dy = gy - r.cy;
        const a = Math.atan2(dy, dx);
        const idx = ((a + Math.PI) / (Math.PI * 2)) * 12;
        const i0 = Math.floor(idx) % 12;
        const i1 = (i0 + 1) % 12;
        const f = idx - Math.floor(idx);
        const rr = r.r * (wob[i0] * (1 - f) + wob[i1] * f);
        if (dx * dx + dy * dy <= rr * rr) {
          const k = key(gx, gy);
          if (!tiles.has(k)) tiles.set(k, { gx, gy, region: r.id });
        }
      }
  }
  // remove 1-tile peninsulas / lonely tiles (look noisy in iso)
  for (let pass = 0; pass < 2; pass++)
    for (const t of [...tiles.values()]) {
      let n = 0;
      for (const [dx, dy] of N4) if (tiles.has(key(t.gx + dx, t.gy + dy))) n++;
      if (n <= 1) tiles.delete(key(t.gx, t.gy));
    }
  // fill 1-tile holes
  for (let gy = 1; gy < GRID - 1; gy++)
    for (let gx = 1; gx < GRID - 1; gx++) {
      if (tiles.has(key(gx, gy))) continue;
      const ns = N4.map(([dx, dy]) => tiles.get(key(gx + dx, gy + dy))).filter(Boolean) as Tile[];
      if (ns.length >= 4) tiles.set(key(gx, gy), { gx, gy, region: ns[0].region });
    }
  return tiles;
}

export const N4: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
export const N8: [number, number][] = [...N4, [1, 1], [-1, -1], [1, -1], [-1, 1]];
