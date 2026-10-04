import { Container, Graphics, Sprite } from 'pixi.js';
import { W, H } from '../core/App';
import { TW, TH, isoToScreen } from './iso';
import { C } from '../ui/theme';
import { key, N4, N8, Tile, RegionDef, generateArchipelago } from './archipelago';
import { islandPlan } from './layout';
import { DIMS, dimOf, DimDef } from './dimensions/defs';
import { buildPlates, Plate } from './dimensions/plates';
import { RegionLayer, mixColor as mix, shade as shd } from './dimensions/regionLayer';
import { skyTex, dropSky, HAS_SKY, SKY } from './dimensions/sky';
import { createFx, DimFx } from './dimensions/fx';
import { dimWorld, camOf, RegionLook as Look } from './dimensions/state';

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

/** legacy palette view of the dimensions (kept for other modules) */
export const BIOMES: Record<string, Biome> = Object.fromEntries(
  Object.values(DIMS).map((d) => [d.id, { top: d.top, topAlt: d.topAlt, side: d.side, sideDark: d.sideDark, edge: d.accent, beach: d.beach, tuft: d.tuft }]),
);

export const DROP = 46; // cliff height px (lagoon level is DROP below land)
export const SEA = 0x4b93c4;
export const SEA_DEEP = 0x3a7fb1;
export const SHALLOW = 0x7fd0de;

export type RegionLook = Look;

export const mixColor = mix;
export const shade = shd;

/** parallax of the dimension skies (1 = glued to the world) */
const SKY_PARALLAX = 0.82;

interface SkyRec {
  holder: Container;
  sprite: Sprite;
  dim: DimDef;
  sealed: boolean | null;
  base: { x: number; y: number };
  radius: number;
  scale: number;
}

/**
 * The archipelago as floating "dimensions": each island is a RegionLayer (hanging rock, lagoon,
 * land, pattern) over its own sky bubble. Locked islands are sealed paper dimensions.
 */
export class TerrainView extends Container {
  backdrops = new Container();
  regionsLayer = new Container();
  bridges = new Graphics();
  layers = new Map<string, RegionLayer>();
  plates: Map<string, Plate>;
  private skies = new Map<string, SkyRec>();
  private fxs = new Map<string, DimFx>();
  private t = 0;
  constructor(
    public tiles: Map<string, Tile>,
    public regionBiome: Record<string, string>,
  ) {
    super();
    this.addChild(this.backdrops, this.regionsLayer, this.bridges);
    this.interactiveChildren = false;
    // water that must stay inside a lagoon: fishing pens + the home raft
    const force = new Set<string>();
    try {
      const plan = islandPlan();
      if (plan.tiles === tiles) {
        for (const p of plan.plans.values())
          for (const f of p.farms) for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) force.add(key(Math.floor(f.gx) + x, Math.floor(f.gy) + y));
        const b = plan.home.boat;
        for (let y = -1; y <= b.h; y++) for (let x = -1; x <= b.w; x++) force.add(key(Math.floor(b.gx) + x, Math.floor(b.gy) + y));
        const pier = [...plan.plans.values()].find((p) => p.pier)?.pier;
        if (pier) for (let y = pier.gy; y < pier.gy + pier.h + 2; y++) for (let x = pier.gx; x < pier.gx + pier.w + 2; x++) if (!tiles.has(key(x, y))) force.add(key(x, y));
      }
    } catch {
      /* sandbox archipelagos have no plan */
    }
    this.plates = buildPlates(tiles, force);
    dimWorld.plates = this.plates;
    dimWorld.biome = regionBiome;
    dimWorld.looks.clear();
    const order = [...this.plates.values()].sort((a, b) => a.cy - b.cy);
    for (const p of order) {
      const L = new RegionLayer(p, regionBiome[p.id] ?? 'home', (x, y) => this.has(x, y), DROP);
      this.regionsLayer.addChild(L);
      this.layers.set(p.id, L);
      const d = L.dim;
      if (HAS_SKY[d.id]) {
        const holder = new Container();
        const sprite = new Sprite();
        sprite.anchor.set(0.5);
        holder.addChild(sprite);
        this.backdrops.addChild(holder);
        const diam = Math.max(p.maxX - p.minX, p.maxY - p.minY + L.profile.D) * 2.15;
        const base = { x: (p.minX + p.maxX) / 2, y: (p.minY + p.maxY) / 2 + L.profile.D * 0.32 };
        sprite.position.set(base.x, base.y);
        sprite.scale.set(diam / SKY);
        this.skies.set(p.id, { holder, sprite, dim: d, sealed: null, base, radius: diam / 2, scale: diam / SKY });
      }
    }
  }

  has(gx: number, gy: number) {
    return this.tiles.has(key(gx, gy));
  }

  /** call from the scene update */
  tick(dt: number) {
    this.t += dt;
    const cam = camOf(this.parent as Container | null, W, H);
    dimWorld.cam = cam;
    const mx = 260 / Math.max(0.3, cam.zoom);
    for (const [id, L] of this.layers) {
      const b = L.bounds;
      const vis = b.x1 > cam.x0 - mx && b.x0 < cam.x1 + mx && b.y1 > cam.y0 - mx && b.y0 < cam.y1 + mx;
      L.visible = vis;
      if (!vis) continue;
      L.tick(dt);
      this.fxs.get(id)?.tick(dt, this.t, cam);
    }
    for (const s of this.skies.values()) {
      const dx = (cam.cx - s.base.x) * (1 - SKY_PARALLAX);
      const dy = (cam.cy - s.base.y) * (1 - SKY_PARALLAX);
      s.holder.position.set(dx, dy);
      const x = s.base.x + dx;
      const y = s.base.y + dy;
      s.holder.visible = x + s.radius > cam.x0 && x - s.radius < cam.x1 && y + s.radius > cam.y0 && y - s.radius < cam.y1;
    }
  }

  redraw(lookOrOpen: ((region: string) => RegionLook) | Set<string>) {
    const look = typeof lookOrOpen === 'function' ? lookOrOpen : (r: string): RegionLook => (lookOrOpen.has(r) ? 'open' : 'veil');
    for (const [id, L] of this.layers) {
      const lk = look(id);
      dimWorld.looks.set(id, lk);
      if (lk !== L.look) {
        this.fxs.get(id)?.destroy();
        this.fxs.delete(id);
        L.build(lk);
      }
      const sky = this.skies.get(id);
      if (sky) {
        const sealed = lk === 'veil' || lk === 'available';
        if (sealed !== sky.sealed) {
          if (sky.sealed !== null) dropSky(sky.dim, sky.sealed);
          sky.sealed = sealed;
          sky.sprite.texture = skyTex(sky.dim, sealed);
          // sealed dimensions are smaller paper portals; open ones bleed wide
          sky.sprite.scale.set(sky.scale * (sealed ? 0.52 : 1));
          // sealed portals sit higher so their glowing tear peeks above the paper island
          sky.sprite.y = sky.base.y - (sealed ? sky.radius * 0.52 * 0.55 : 0);
        }
        sky.sprite.alpha = lk === 'clearing' ? 0.55 : 1;
        sky.sprite.tint = lk === 'available' ? 0xfff6dc : 0xffffff;
      }
      if (lk === 'open' && !this.fxs.has(id)) {
        const fx = createFx(L, { holder: sky?.holder ?? this.backdrops, sprite: sky?.sprite ?? null });
        if (fx) this.fxs.set(id, fx);
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
      // dangling broken planks
      if (broken)
        for (const f of [0.38, 0.66]) {
          const x = a.x + (c.x - a.x) * f;
          const y = a.y + (c.y - a.y) * f + Math.sin(f * Math.PI) * 10;
          g.poly([x - 5, y, x + 5, y, x + 3, y + 26, x - 7, y + 24]).fill(0xb98348).stroke({ width: 2, color: C.ink });
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

  override destroy(options?: Parameters<Container['destroy']>[0]) {
    for (const f of this.fxs.values()) f.destroy();
    this.fxs.clear();
    if (dimWorld.plates === this.plates) {
      dimWorld.plates = null;
      dimWorld.looks.clear();
    }
    super.destroy(options);
  }
}

export { N8, dimOf };
