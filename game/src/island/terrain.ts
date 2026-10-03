import { Container, Graphics } from 'pixi.js';
import { TW, TH, isoToScreen } from './iso';
import { C } from '../ui/theme';
import { Rng } from '../core/rng';

export interface Biome {
  top: number;
  topAlt: number;
  side: number;
  sideDark: number;
  edge: number;
}

export const BIOMES: Record<string, Biome> = {
  home: { top: 0x9cc77a, topAlt: 0x8cb96c, side: 0xc99358, sideDark: 0x8a5a2e, edge: 0xede4d6 },
  forest: { top: 0x4f8f4a, topAlt: 0x45803f, side: 0x7a5a36, sideDark: 0x4f3a22, edge: 0xd9e8b0 },
  cliff: { top: 0xb9b2a0, topAlt: 0xa9a28f, side: 0x6f6a5e, sideDark: 0x47443c, edge: 0xede4d6 },
  ice: { top: 0xe8f4f8, topAlt: 0xd6ecf2, side: 0x7fb8d4, sideDark: 0x3569a3, edge: 0xffffff },
  ruins: { top: 0x8f6b93, topAlt: 0x7f5d83, side: 0x5c3d5b, sideDark: 0x231626, edge: 0xb89558 },
  volcano: { top: 0x3a2a2a, topAlt: 0x2f2222, side: 0x4e0000, sideDark: 0x1a0505, edge: 0xff6a1a },
  cosmic: { top: 0x231626, topAlt: 0x2d1c33, side: 0x0d110f, sideDark: 0x000000, edge: 0x00e5ff },
  ghost: { top: 0xd9d4de, topAlt: 0xc9c3cf, side: 0x413b44, sideDark: 0x171317, edge: 0xffffff },
};

export interface RegionDef {
  id: string;
  biome: string;
  cx: number;
  cy: number;
  r: number;
}

export interface Tile {
  gx: number;
  gy: number;
  region: string;
}

export const GRID = 44;

/** Generate an archipelago: one blob per region with a noisy edge. Deterministic. */
export function generateArchipelago(regions: RegionDef[], seed = 7): Map<string, Tile> {
  const rng = new Rng(seed);
  const tiles = new Map<string, Tile>();
  for (const r of regions) {
    const wob = Array.from({ length: 12 }, () => rng.range(0.75, 1.15));
    for (let gy = Math.floor(r.cy - r.r - 2); gy <= r.cy + r.r + 2; gy++)
      for (let gx = Math.floor(r.cx - r.r - 2); gx <= r.cx + r.r + 2; gx++) {
        const dx = gx - r.cx;
        const dy = gy - r.cy;
        const a = Math.atan2(dy, dx);
        const idx = ((a + Math.PI) / (Math.PI * 2)) * 12;
        const i0 = Math.floor(idx) % 12;
        const i1 = (i0 + 1) % 12;
        const f = idx - Math.floor(idx);
        const rr = r.r * (wob[i0] * (1 - f) + wob[i1] * f);
        if (dx * dx + dy * dy <= rr * rr) {
          const k = `${gx},${gy}`;
          if (!tiles.has(k)) tiles.set(k, { gx, gy, region: r.id });
        }
      }
  }
  return tiles;
}

const DROP = 46; // cliff height px

/**
 * Draws island tiles as flat poster-style diamonds with cliff faces on the
 * south-west/south-east edges. Locked regions are drawn as paper "veil".
 */
export class TerrainView extends Container {
  g = new Graphics();
  constructor(public tiles: Map<string, Tile>, public regionBiome: Record<string, string>) {
    super();
    this.addChild(this.g);
  }

  has(gx: number, gy: number, region?: string) {
    const t = this.tiles.get(`${gx},${gy}`);
    return !!t && (region === undefined || t.region === region);
  }

  redraw(unlocked: Set<string>) {
    const g = this.g;
    g.clear();
    const list = [...this.tiles.values()].sort((a, b) => a.gx + a.gy - (b.gx + b.gy) || a.gx - b.gx);
    for (const t of list) {
      const locked = !unlocked.has(t.region);
      const biome = BIOMES[this.regionBiome[t.region]] ?? BIOMES.home;
      const p = isoToScreen(t.gx, t.gy);
      const top = locked ? 0xd9cdb8 : (t.gx + t.gy) % 2 ? biome.top : biome.topAlt;
      const side = locked ? 0xb5a88f : biome.side;
      const sideDark = locked ? 0x8f8470 : biome.sideDark;
      const hw = TW / 2;
      const hh = TH / 2;
      // cliff faces where the neighbour is empty (south-east: gx+1, south-west: gy+1)
      if (!this.has(t.gx + 1, t.gy)) {
        g.poly([p.x + hw, p.y, p.x, p.y + hh, p.x, p.y + hh + DROP, p.x + hw, p.y + DROP]).fill(sideDark).stroke({ width: 3, color: C.ink, join: 'round' });
      }
      if (!this.has(t.gx, t.gy + 1)) {
        g.poly([p.x - hw, p.y, p.x, p.y + hh, p.x, p.y + hh + DROP, p.x - hw, p.y + DROP]).fill(side).stroke({ width: 3, color: C.ink, join: 'round' });
      }
      g.poly([p.x, p.y - hh, p.x + hw, p.y, p.x, p.y + hh, p.x - hw, p.y]).fill(top);
      // ink edges only on the island border
      const edges: [number, number, number, number, number, number][] = [
        [0, -1, p.x, p.y - hh, p.x + hw, p.y],
        [1, 0, p.x + hw, p.y, p.x, p.y + hh],
        [0, 1, p.x, p.y + hh, p.x - hw, p.y],
        [-1, 0, p.x - hw, p.y, p.x, p.y - hh],
      ];
      for (const [dx, dy, x0, y0, x1, y1] of edges) {
        const n = this.tiles.get(`${t.gx + dx},${t.gy + dy}`);
        if (!n) g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: 4, color: C.ink, cap: 'round' });
        else if (n.region !== t.region) g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: 2, color: C.ink, alpha: 0.35 });
      }
      if (locked && (t.gx * 7 + t.gy * 3) % 5 === 0) {
        // hatch marks on locked land
        g.moveTo(p.x - 18, p.y + 6).lineTo(p.x + 18, p.y - 6).stroke({ width: 2, color: C.ink, alpha: 0.25 });
      }
    }
  }
}
