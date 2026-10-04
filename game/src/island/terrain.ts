import { Container, Graphics } from 'pixi.js';
import { TW, TH, isoToScreen } from './iso';
import { C } from '../ui/theme';
import { key, N4, N8, Tile, RegionDef, generateArchipelago } from './archipelago';

export { generateArchipelago };
export type { RegionDef, Tile };
export { GRID } from './archipelago';

export interface Biome {
  top: number;
  topAlt: number;
  side: number;
  sideDark: number;
  edge: number;
  beach: number;
  tuft: number;
}

export const BIOMES: Record<string, Biome> = {
  home: { top: 0xa6cf7e, topAlt: 0x99c472, side: 0xd29a5c, sideDark: 0x9a6334, edge: 0xede4d6, beach: 0xf2dca8, tuft: 0x6f9e4f },
  forest: { top: 0x5f9c55, topAlt: 0x558f4b, side: 0x8a6a42, sideDark: 0x5a4329, edge: 0xd9e8b0, beach: 0xd9cf98, tuft: 0x3b6e37 },
  cliff: { top: 0xc4bca8, topAlt: 0xb6ae99, side: 0x7d776a, sideDark: 0x504c43, edge: 0xede4d6, beach: 0xd8d0bc, tuft: 0x8f9a6a },
  ice: { top: 0xeef8fb, topAlt: 0xdcf0f6, side: 0x8cc4dc, sideDark: 0x4a7fb0, edge: 0xffffff, beach: 0xffffff, tuft: 0xb5dcea },
  ruins: { top: 0x9a77a0, topAlt: 0x8a6990, side: 0x664566, sideDark: 0x2d1c33, edge: 0xb89558, beach: 0xb7a4c7, tuft: 0x6d4f72 },
  volcano: { top: 0x4a3433, topAlt: 0x3f2c2b, side: 0x5e1308, sideDark: 0x2a0806, edge: 0xff6a1a, beach: 0x2d2424, tuft: 0xff6a1a },
  cosmic: { top: 0x2d1c3a, topAlt: 0x372347, side: 0x1a1024, sideDark: 0x0d110f, edge: 0x00e5ff, beach: 0x4b2f66, tuft: 0x8a5cff },
  ghost: { top: 0xdcd6e0, topAlt: 0xcfc8d4, side: 0x4e4752, sideDark: 0x221d24, edge: 0xffffff, beach: 0xeae6ee, tuft: 0x9b93a2 },
  reef: { top: 0xf7b2c8, topAlt: 0x9fe6e0, side: 0x3d8c9e, sideDark: 0x1c3a51, edge: 0xffffff, beach: 0xfff1e0, tuft: 0xff7ab8 },
};

export const DROP = 46; // cliff height px (sea level is DROP below land)
export const SEA = 0x4b93c4;
export const SEA_DEEP = 0x3a7fb1;
export const SHALLOW = 0x7fd0de;

export type RegionLook = 'open' | 'veil' | 'available' | 'clearing';

export function mixColor(a: number, b: number, t: number) {
  const r = ((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t;
  const g = ((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t;
  const bl = (a & 255) * (1 - t) + (b & 255) * t;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
}
export function shade(c: number, k: number) {
  const r = Math.min(255, Math.max(0, Math.round(((c >> 16) & 255) * k)));
  const g = Math.min(255, Math.max(0, Math.round(((c >> 8) & 255) * k)));
  const b = Math.min(255, Math.max(0, Math.round((c & 255) * k)));
  return (r << 16) | (g << 8) | b;
}
function h2(a: number, b: number, s = 0) {
  let h = (a * 374761393 + b * 668265263 + s * 974711) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const VEIL = { top: 0xe9dfcc, topAlt: 0xe1d5bf, side: 0xc4b392, sideDark: 0x9c8b6c };
const DIRT = 0x9c7650;

/**
 * Poster-style iso terrain: shallows + foam at sea level, flat diamonds with beaches,
 * cliff faces with strata on the south sides. Locked regions are a paper veil.
 */
export class TerrainView extends Container {
  shallows = new Graphics();
  foamA = new Graphics();
  foamB = new Graphics();
  g = new Graphics();
  bridges = new Graphics();
  private foamT = 0;
  constructor(
    public tiles: Map<string, Tile>,
    public regionBiome: Record<string, string>,
  ) {
    super();
    this.addChild(this.shallows, this.foamA, this.foamB, this.g, this.bridges);
    this.drawSea();
  }

  has(gx: number, gy: number) {
    return this.tiles.has(key(gx, gy));
  }

  /** shallow ring + two alternating foam drawings (boil on twos) */
  private drawSea() {
    const s = this.shallows;
    const hw = TW / 2;
    const hh = TH / 2;
    const ring = new Set<string>();
    const ring2 = new Set<string>();
    for (const t of this.tiles.values())
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const k = key(t.gx + dx, t.gy + dy);
          if (this.tiles.has(k)) continue;
          if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) ring.add(k);
          else ring2.add(k);
        }
    const dia = (g: Graphics, gx: number, gy: number, color: number, alpha: number, k = 1) => {
      const p = isoToScreen(gx, gy);
      const y = p.y + DROP;
      g.poly([p.x, y - hh * k, p.x + hw * k, y, p.x, y + hh * k, p.x - hw * k, y]).fill({ color, alpha });
    };
    for (const k of ring2) {
      if (ring.has(k)) continue;
      const [gx, gy] = k.split(',').map(Number);
      dia(s, gx, gy, SHALLOW, 0.22, 1.08);
    }
    for (const k of ring) {
      const [gx, gy] = k.split(',').map(Number);
      dia(s, gx, gy, SHALLOW, 0.55, 1.06);
    }
    // foam strokes along coast edges at sea level (front edges only are visible)
    for (const [g, off] of [
      [this.foamA, 0],
      [this.foamB, 1],
    ] as const) {
      for (const t of this.tiles.values()) {
        const p = isoToScreen(t.gx, t.gy);
        const y = p.y + DROP;
        const wob = (h2(t.gx, t.gy, off) - 0.5) * 6;
        if (!this.has(t.gx + 1, t.gy)) {
          g.moveTo(p.x + hw + 8, y + 4 + wob).lineTo(p.x + 6, y + hh + 6 + wob).stroke({ width: 4, color: 0xffffff, alpha: 0.85, cap: 'round' });
          if (h2(t.gx, t.gy, 7 + off) < 0.5)
            g.moveTo(p.x + hw + 18, y + 14).lineTo(p.x + hw - 12, y + 28).stroke({ width: 3, color: 0xffffff, alpha: 0.5, cap: 'round' });
        }
        if (!this.has(t.gx, t.gy + 1)) {
          g.moveTo(p.x - hw - 8, y + 4 + wob).lineTo(p.x - 6, y + hh + 6 + wob).stroke({ width: 4, color: 0xffffff, alpha: 0.85, cap: 'round' });
          if (h2(t.gx, t.gy, 13 + off) < 0.5)
            g.moveTo(p.x - hw - 18, y + 14).lineTo(p.x - hw + 12, y + 28).stroke({ width: 3, color: 0xffffff, alpha: 0.5, cap: 'round' });
        }
      }
    }
    this.foamB.visible = false;
  }

  /** call from the scene update (foam boils at ~3 fps) */
  tick(dt: number) {
    this.foamT += dt;
    if (this.foamT > 0.38) {
      this.foamT = 0;
      this.foamA.visible = !this.foamA.visible;
      this.foamB.visible = !this.foamA.visible;
    }
  }

  redraw(lookOrOpen: ((region: string) => RegionLook) | Set<string>) {
    const look = typeof lookOrOpen === 'function' ? lookOrOpen : (r: string): RegionLook => (lookOrOpen.has(r) ? 'open' : 'veil');
    const g = this.g;
    g.clear();
    const list = [...this.tiles.values()].sort((a, b) => a.gx + a.gy - (b.gx + b.gy) || a.gx - b.gx);
    const hw = TW / 2;
    const hh = TH / 2;
    for (const t of list) {
      const lk = look(t.region);
      const veil = lk === 'veil' || lk === 'available';
      const biome = BIOMES[this.regionBiome[t.region]] ?? BIOMES.home;
      const p = isoToScreen(t.gx, t.gy);
      let coast = false;
      for (const [dx, dy] of N4) if (!this.has(t.gx + dx, t.gy + dy)) coast = true;
      const alt = (t.gx + t.gy) % 2 === 1;
      let top = veil ? (alt ? VEIL.top : VEIL.topAlt) : coast ? biome.beach : alt ? biome.top : biome.topAlt;
      let side = veil ? VEIL.side : biome.side;
      let sideDark = veil ? VEIL.sideDark : biome.sideDark;
      if (lk === 'clearing') {
        top = mixColor(top, DIRT, 0.55);
        side = mixColor(side, DIRT, 0.4);
        sideDark = mixColor(sideDark, DIRT, 0.3);
      }
      if (lk === 'available') top = mixColor(top, 0xfff3c4, 0.25);
      const ink = { width: 3, color: C.ink, join: 'round' as const };
      if (!this.has(t.gx + 1, t.gy)) {
        g.poly([p.x + hw, p.y, p.x, p.y + hh, p.x, p.y + hh + DROP, p.x + hw, p.y + DROP]).fill(sideDark).stroke(ink);
        g.moveTo(p.x + hw, p.y + DROP * 0.45).lineTo(p.x, p.y + hh + DROP * 0.45).stroke({ width: 2, color: C.ink, alpha: 0.25 });
      }
      if (!this.has(t.gx, t.gy + 1)) {
        g.poly([p.x - hw, p.y, p.x, p.y + hh, p.x, p.y + hh + DROP, p.x - hw, p.y + DROP]).fill(side).stroke(ink);
        g.moveTo(p.x - hw, p.y + DROP * 0.45).lineTo(p.x, p.y + hh + DROP * 0.45).stroke({ width: 2, color: C.ink, alpha: 0.2 });
      }
      g.poly([p.x, p.y - hh, p.x + hw, p.y, p.x, p.y + hh, p.x - hw, p.y]).fill(top);
      // beach: inner grass diamond fades to sand on the shore side
      if (coast && !veil) {
        const inner = alt ? biome.top : biome.topAlt;
        const k = 0.5;
        const ox = (this.has(t.gx + 1, t.gy) ? 1 : 0) - (this.has(t.gx - 1, t.gy) ? 1 : 0);
        const oy = (this.has(t.gx, t.gy + 1) ? 1 : 0) - (this.has(t.gx, t.gy - 1) ? 1 : 0);
        const cx = p.x + (ox - oy) * hw * 0.25;
        const cy = p.y + (ox + oy) * hh * 0.25;
        g.poly([cx, cy - hh * k, cx + hw * k, cy, cx, cy + hh * k, cx - hw * k, cy]).fill({ color: lk === 'clearing' ? mixColor(inner, DIRT, 0.55) : inner, alpha: 0.9 });
      }
      // texture: tufts / hatch
      const r = h2(t.gx, t.gy, 1);
      if (veil) {
        if ((t.gx * 7 + t.gy * 3) % 4 === 0) g.moveTo(p.x - 20, p.y + 7).lineTo(p.x + 20, p.y - 7).stroke({ width: 2, color: C.ink, alpha: 0.18 });
      } else if (r < 0.35 && !coast) {
        const tx = p.x + (h2(t.gx, t.gy, 2) - 0.5) * 50;
        const ty = p.y + (h2(t.gx, t.gy, 4) - 0.5) * 20;
        const tc = lk === 'clearing' ? shade(DIRT, 0.8) : biome.tuft;
        g.moveTo(tx - 6, ty).lineTo(tx - 3, ty - 8).moveTo(tx, ty).lineTo(tx, ty - 10).moveTo(tx + 6, ty).lineTo(tx + 3, ty - 8).stroke({ width: 2.5, color: tc, cap: 'round', alpha: 0.85 });
      }
      // ink edges only on the island border; dashed-ish seam between regions
      const edges: [number, number, number, number, number, number][] = [
        [0, -1, p.x, p.y - hh, p.x + hw, p.y],
        [1, 0, p.x + hw, p.y, p.x, p.y + hh],
        [0, 1, p.x, p.y + hh, p.x - hw, p.y],
        [-1, 0, p.x - hw, p.y, p.x, p.y - hh],
      ];
      for (const [dx, dy, x0, y0, x1, y1] of edges) {
        const n = this.tiles.get(key(t.gx + dx, t.gy + dy));
        if (!n) g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: 4, color: C.ink, cap: 'round' });
        else if (n.region !== t.region) {
          const mx = (x0 + x1) / 2;
          const my = (y0 + y1) / 2;
          g.moveTo(x0, y0).lineTo(mx - (mx - x0) * 0.2, my - (my - y0) * 0.2).stroke({ width: 3, color: C.ink, alpha: 0.4, cap: 'round' });
        }
      }
    }
  }

  /** wooden plank bridges between home and each non-locked neighbour island */
  drawBridges(regions: RegionDef[], look: (region: string) => RegionLook) {
    const g = this.bridges;
    g.clear();
    const home = regions[0];
    for (const r of regions.slice(1)) {
      const lk = look(r.id);
      const b = this.findBridge(home.id, r.id);
      if (!b) continue;
      const a = isoToScreen(b.ax, b.ay);
      const c = isoToScreen(b.bx, b.by);
      const n = Math.max(2, Math.round(Math.hypot(b.bx - b.ax, b.by - b.ay) * 3));
      const alongX = b.ay === b.by;
      // ropes / rails
      const perp = alongX ? { x: -TW / 6, y: TH / 6 } : { x: TW / 6, y: TH / 6 };
      const broken = lk === 'veil';
      for (let i = 0; i <= n; i++) {
        if (broken && i > n * 0.35 && i < n * 0.7) continue;
        const f = i / n;
        const x = a.x + (c.x - a.x) * f;
        const y = a.y + (c.y - a.y) * f + Math.sin(f * Math.PI) * 10;
        g.poly([x - perp.x - 6, y - perp.y, x + perp.x - 6, y + perp.y, x + perp.x + 6, y + perp.y + 3, x - perp.x + 6, y - perp.y + 3])
          .fill(i % 2 ? 0xc99358 : 0xb98348)
          .stroke({ width: 2, color: C.ink });
      }
      for (const s of [-1, 1]) {
        g.moveTo(a.x + perp.x * s, a.y + perp.y * s - 16);
        for (let i = 1; i <= 8; i++) {
          const f = i / 8;
          if (broken && f > 0.4 && f < 0.7) {
            g.moveTo(a.x + (c.x - a.x) * 0.7 + perp.x * s, a.y + (c.y - a.y) * 0.7 + perp.y * s - 10);
            continue;
          }
          g.lineTo(a.x + (c.x - a.x) * f + perp.x * s, a.y + (c.y - a.y) * f + perp.y * s - 16 + Math.sin(f * Math.PI) * 14);
        }
        g.stroke({ width: 2.5, color: C.ink, alpha: 0.8 });
      }
    }
  }

  private bridgeCache = new Map<string, { ax: number; ay: number; bx: number; by: number } | null>();
  findBridge(ra: string, rb: string) {
    const ck = ra + '|' + rb;
    if (this.bridgeCache.has(ck)) return this.bridgeCache.get(ck)!;
    let best: { ax: number; ay: number; bx: number; by: number } | null = null;
    let bd = Infinity;
    for (const t of this.tiles.values()) {
      if (t.region !== ra) continue;
      for (const [dx, dy] of N4) {
        for (let d = 2; d <= 6; d++) {
          const x = t.gx + dx * d;
          const y = t.gy + dy * d;
          const n = this.tiles.get(key(x, y));
          if (!n) continue;
          if (n.region === rb) {
            // all between must be water
            let ok = true;
            for (let k = 1; k < d; k++) if (this.has(t.gx + dx * k, t.gy + dy * k)) ok = false;
            const centerBias = Math.abs(dx ? t.gy - (y + t.gy) / 2 : t.gx - (x + t.gx) / 2);
            if (ok && d + centerBias * 0.01 < bd) {
              bd = d;
              best = { ax: t.gx + dx * 0.5, ay: t.gy + dy * 0.5, bx: x - dx * 0.5, by: y - dy * 0.5 };
            }
          }
          break;
        }
      }
    }
    this.bridgeCache.set(ck, best);
    return best;
  }
}

export { N8 };
