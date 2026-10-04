/**
 * Pure (no Pixi) deterministic planner: where every plot, building and decoration lives on the
 * archipelago. Habitat plots are 3×3 land, fishing pens are 2×2 WATER tiles along the south coast
 * (so they sit in front of the cliffs and never get occluded), fixed buildings live in `home`.
 */
import { BAL } from '../state/econ';
import { EXPANSIONS } from '../data/content';
import { generateArchipelago, islandRegions, key, N4, N8, RegionDef, Tile, GRID, HOME_ID } from './archipelago';

export interface Spot {
  gx: number;
  gy: number;
  w: number;
  h: number;
}
export type DecorKind =
  | 'tree'
  | 'pine'
  | 'palm'
  | 'bush'
  | 'flower'
  | 'rock'
  | 'mushroom'
  | 'crystal'
  | 'lava'
  | 'snow'
  | 'column'
  | 'coral'
  | 'grass'
  | 'lamp'
  | 'star'
  | 'boulder';
export interface Decor {
  gx: number;
  gy: number;
  kind: DecorKind;
  v: number;
}
export interface RegionPlan {
  def: RegionDef;
  tiles: Tile[];
  center: { gx: number; gy: number };
  habitats: Spot[];
  farms: Spot[];
  decor: Decor[];
}
export interface HomePlan {
  sanctuary: Spot;
  port: Spot;
  altar: Spot;
  mesa: Spot;
  lighthouse: Spot;
  boat: Spot;
}
export interface IslandPlan {
  tiles: Map<string, Tile>;
  regions: RegionDef[];
  plans: Map<string, RegionPlan>;
  home: HomePlan;
}

function hash2(a: number, b: number, s = 0) {
  let h = (a * 374761393 + b * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const DECOR_BY_BIOME: Record<string, DecorKind[]> = {
  home: ['palm', 'bush', 'flower', 'flower', 'grass', 'rock', 'tree'],
  forest: ['pine', 'pine', 'tree', 'mushroom', 'bush', 'grass'],
  cliff: ['boulder', 'rock', 'rock', 'grass', 'column'],
  volcano: ['lava', 'rock', 'boulder', 'crystal'],
  ghost: ['lamp', 'rock', 'grass', 'tree'],
  ice: ['snow', 'snow', 'crystal', 'pine'],
  ruins: ['column', 'column', 'crystal', 'grass'],
  reef: ['coral', 'coral', 'rock', 'star'],
  cosmic: ['star', 'crystal', 'crystal', 'column'],
};

let cached: IslandPlan | null = null;

export function islandPlan(): IslandPlan {
  if (cached) return cached;
  const regions = islandRegions();
  const tiles = generateArchipelago(regions);
  const occ = new Set<string>();
  const ring = new Set<string>();
  const land = (gx: number, gy: number) => tiles.get(key(gx, gy));
  const isWater = (gx: number, gy: number) => !tiles.has(key(gx, gy)) && gx >= 0 && gy >= 0 && gx < GRID && gy < GRID;

  const mark = (s: Spot, withRing = true) => {
    for (let y = s.gy; y < s.gy + s.h; y++) for (let x = s.gx; x < s.gx + s.w; x++) occ.add(key(x, y));
    if (withRing)
      for (let y = s.gy - 1; y <= s.gy + s.h; y++) for (let x = s.gx - 1; x <= s.gx + s.w; x++) if (!occ.has(key(x, y))) ring.add(key(x, y));
  };
  const free = (gx: number, gy: number) => !occ.has(key(gx, gy)) && !ring.has(key(gx, gy));

  /** land footprint fully inside region; `inland` = its ring must be land too */
  const landFits = (reg: string, s: Spot, inland: boolean) => {
    for (let y = s.gy; y < s.gy + s.h; y++)
      for (let x = s.gx; x < s.gx + s.w; x++) {
        const t = land(x, y);
        if (!t || t.region !== reg || !free(x, y)) return false;
      }
    if (inland)
      for (let y = s.gy - 1; y <= s.gy + s.h; y++)
        for (let x = s.gx - 1; x <= s.gx + s.w; x++) if (!land(x, y)) return false;
    return true;
  };

  const best = (reg: RegionDef, w: number, h: number, ok: (s: Spot) => boolean, score: (s: Spot) => number): Spot | null => {
    let out: Spot | null = null;
    let bs = Infinity;
    const r = Math.ceil(reg.r) + 4;
    for (let gy = Math.floor(reg.cy - r); gy <= reg.cy + r; gy++)
      for (let gx = Math.floor(reg.cx - r); gx <= reg.cx + r; gx++) {
        const s = { gx, gy, w, h };
        if (!ok(s)) continue;
        const sc = score(s);
        if (sc < bs) {
          bs = sc;
          out = s;
        }
      }
    return out;
  };
  const ctr = (s: Spot) => ({ x: s.gx + s.w / 2, y: s.gy + s.h / 2 });
  const dist = (s: Spot, x: number, y: number) => Math.hypot(ctr(s).x - x, ctr(s).y - y);

  /** water pen: all water, in front rows water too, touching region land on its back sides */
  const penFits = (reg: string, s: Spot, deep = 2) => {
    for (let y = s.gy; y < s.gy + s.h + deep; y++)
      for (let x = s.gx; x < s.gx + s.w + deep; x++) {
        if (!isWater(x, y)) return false;
        if (y < s.gy + s.h && x < s.gx + s.w && occ.has(key(x, y))) return false;
      }
    // keep pens from touching other pens
    for (let y = s.gy - 1; y <= s.gy + s.h; y++) for (let x = s.gx - 1; x <= s.gx + s.w; x++) if (occ.has(key(x, y))) return false;
    let touch = 0;
    for (let x = s.gx; x < s.gx + s.w; x++) if (land(x, s.gy - 1)?.region === reg) touch++;
    for (let y = s.gy; y < s.gy + s.h; y++) if (land(s.gx - 1, y)?.region === reg) touch++;
    return touch >= 2;
  };

  /** place n spots; tries several first picks so the greedy rest still fits (small regions) */
  const placeMany = (p: RegionPlan, n: number, w: number, h: number, fits: ((q: Spot) => boolean)[], score: (q: Spot) => number, withRing = true): Spot[] => {
    if (n <= 0) return [];
    const pickNext = () => {
      for (const f of fits) {
        const s = best(p.def, w, h, f, score);
        if (s) return s;
      }
      return null;
    };
    const cands: Spot[] = [];
    const r = Math.ceil(p.def.r) + 4;
    for (const f of fits)
      for (let gy = Math.floor(p.def.cy - r); gy <= p.def.cy + r; gy++)
        for (let gx = Math.floor(p.def.cx - r); gx <= p.def.cx + r; gx++) {
          const q = { gx, gy, w, h };
          if (f(q) && !cands.some((c) => c.gx === gx && c.gy === gy)) cands.push(q);
        }
    cands.sort((a, b) => score(a) - score(b));
    let bestRes: Spot[] = [];
    for (const c of cands.slice(0, 80)) {
      const o = new Set(occ);
      const rg = new Set(ring);
      mark(c, withRing);
      const res = [c];
      while (res.length < n) {
        const s = pickNext();
        if (!s) break;
        mark(s, withRing);
        res.push(s);
      }
      if (res.length === n) return res;
      if (res.length > bestRes.length) bestRes = res;
      occ.clear();
      o.forEach((k) => occ.add(k));
      ring.clear();
      rg.forEach((k) => ring.add(k));
    }
    for (const s of bestRes) mark(s, withRing);
    return bestRes;
  };

  const plans = new Map<string, RegionPlan>();
  for (const def of regions) {
    const rt = [...tiles.values()].filter((t) => t.region === def.id);
    const cx = rt.reduce((a, t) => a + t.gx, 0) / Math.max(1, rt.length);
    const cy = rt.reduce((a, t) => a + t.gy, 0) / Math.max(1, rt.length);
    plans.set(def.id, { def, tiles: rt, center: { gx: cx, gy: cy }, habitats: [], farms: [], decor: [] });
  }

  // ------------------------------------------------------------ home fixed buildings
  const home = plans.get(HOME_ID)!;
  const hd = home.def;
  const hc = { x: home.center.gx + 0.5, y: home.center.gy + 0.5 };
  // port: land 3×3 whose front (2 rows) is water — facing the camera (+gy or +gx side)
  const portFits = (s: Spot) => {
    if (!landFits(HOME_ID, s, false)) return false;
    let frontY = true;
    for (let x = s.gx; x < s.gx + s.w; x++) if (!isWater(x, s.gy + s.h) || !isWater(x, s.gy + s.h + 1)) frontY = false;
    let frontX = true;
    for (let y = s.gy; y < s.gy + s.h; y++) if (!isWater(s.gx + s.w, y) || !isWater(s.gx + s.w + 1, y)) frontX = false;
    return frontY || frontX;
  };
  let port = best(hd, 3, 3, portFits, (s) => -(ctr(s).x + ctr(s).y) + Math.abs(ctr(s).x - ctr(s).y) * 0.6);
  if (!port) port = best(hd, 3, 3, (s) => landFits(HOME_ID, s, false), (s) => -(ctr(s).x + ctr(s).y));
  mark(port!);
  // boat: 2×2 water right in front of the port
  const boat: Spot = isWater(port!.gx + 1, port!.gy + 3) ? { gx: port!.gx + 0.5, gy: port!.gy + 3, w: 2, h: 2 } : { gx: port!.gx + 3, gy: port!.gy + 0.5, w: 2, h: 2 };
  for (let y = Math.floor(boat.gy); y < boat.gy + 2; y++) for (let x = Math.floor(boat.gx); x < boat.gx + 2; x++) occ.add(key(x, y));

  const sanctuary =
    best(hd, 3, 3, (s) => landFits(HOME_ID, s, true), (s) => ctr(s).x + ctr(s).y + Math.abs(ctr(s).x - ctr(s).y) * 0.8 + dist(s, hc.x, hc.y) * 0.4) ??
    best(hd, 3, 3, (s) => landFits(HOME_ID, s, false), (s) => ctr(s).x + ctr(s).y)!;
  mark(sanctuary);

  // habitats in home
  const habCount = (id: string) => (id === HOME_ID ? BAL.habitats.plots_start : (EXPANSIONS.find((e) => e.id === id)?.balance.hab_plots ?? 0));
  const farmCount = (id: string) => (id === HOME_ID ? BAL.farms.plots_start : (EXPANSIONS.find((e) => e.id === id)?.balance.farm_plots ?? 0));
  const placeHabitats = (p: RegionPlan) => {
    p.habitats = placeMany(
      p,
      habCount(p.def.id),
      3,
      3,
      [(q) => landFits(p.def.id, q, true), (q) => landFits(p.def.id, q, false)],
      (q) => dist(q, p.center.gx + 0.5, p.center.gy + 0.5) + hash2(q.gx, q.gy) * 0.2,
    );
  };
  placeHabitats(home);

  const altar = best(hd, 2, 2, (s) => landFits(HOME_ID, s, true), (s) => dist(s, hc.x, hc.y) + (ctr(s).x - ctr(s).y) * 0.3) ?? { gx: Math.round(hc.x), gy: Math.round(hc.y), w: 2, h: 2 };
  mark(altar);
  const mesa = best(hd, 2, 2, (s) => landFits(HOME_ID, s, false), (s) => dist(s, hc.x, hc.y) - (ctr(s).x - ctr(s).y) * 0.3) ?? { gx: Math.round(hc.x), gy: Math.round(hc.y), w: 2, h: 2 };
  mark(mesa);

  // home pens near the port
  const pc = ctr(port!);
  const placeFarms = (p: RegionPlan, nearX: number, nearY: number) => {
    p.farms = placeMany(p, farmCount(p.def.id), 2, 2, [(q) => penFits(p.def.id, q, 2), (q) => penFits(p.def.id, q, 1)], (q) => dist(q, nearX, nearY), false);
  };
  placeFarms(home, pc.x, pc.y);

  // lighthouse: a coast corner of home, far from the port
  const lighthouse =
    best(
      hd,
      1,
      1,
      (s) => landFits(HOME_ID, s, false) && isWater(s.gx + 1, s.gy) && isWater(s.gx, s.gy + 1),
      (s) => -dist(s, pc.x, pc.y),
    ) ?? best(hd, 1, 1, (s) => landFits(HOME_ID, s, false), (s) => -dist(s, hc.x, hc.y))!;
  mark(lighthouse);

  // ------------------------------------------------------------ expansions
  for (const p of plans.values()) {
    if (p.def.id === HOME_ID) continue;
    placeHabitats(p);
    placeFarms(p, p.center.gx + 3, p.center.gy + 3);
  }

  // ------------------------------------------------------------ decoration on free land
  for (const p of plans.values()) {
    const kinds = DECOR_BY_BIOME[p.def.biome] ?? DECOR_BY_BIOME.home;
    const dens = p.def.id === HOME_ID ? 0.2 : 0.34;
    for (const t of p.tiles) {
      if (occ.has(key(t.gx, t.gy)) || ring.has(key(t.gx, t.gy))) continue;
      const h = hash2(t.gx, t.gy, 3);
      let coast = 0;
      for (const [dx, dy] of N8) if (!tiles.has(key(t.gx + dx, t.gy + dy))) coast++;
      if (h > dens + coast * 0.04) continue;
      const v = hash2(t.gx, t.gy, 9);
      let kind = kinds[Math.floor(hash2(t.gx, t.gy, 5) * kinds.length)];
      if (coast > 0 && p.def.biome === 'home' && v < 0.5) kind = 'palm';
      p.decor.push({ gx: t.gx + (v - 0.5) * 0.3, gy: t.gy + (hash2(t.gx, t.gy, 11) - 0.5) * 0.3, kind, v });
    }
  }

  cached = { tiles, regions, plans, home: { sanctuary, port: port!, altar, mesa, lighthouse, boat } };
  return cached;
}

/** land tiles touching water (for foam / beaches) */
export function isCoast(tiles: Map<string, Tile>, gx: number, gy: number) {
  for (const [dx, dy] of N4) if (!tiles.has(key(gx + dx, gy + dy))) return true;
  return false;
}

/** ASCII dump for debugging */
export function planAscii(p: IslandPlan) {
  const rows: string[] = [];
  const glyph = new Map<string, string>();
  const put = (s: Spot, ch: string) => {
    for (let y = Math.floor(s.gy); y < s.gy + s.h; y++) for (let x = Math.floor(s.gx); x < s.gx + s.w; x++) glyph.set(key(x, y), ch);
  };
  for (const r of p.plans.values()) {
    r.habitats.forEach((s) => put(s, 'H'));
    r.farms.forEach((s) => put(s, 'F'));
  }
  put(p.home.sanctuary, 'S');
  put(p.home.port, 'P');
  put(p.home.altar, 'A');
  put(p.home.mesa, 'M');
  put(p.home.lighthouse, 'L');
  put(p.home.boat, 'B');
  const letters: Record<string, string> = {};
  p.regions.forEach((r, i) => (letters[r.id] = 'hbcvpgrae'[i] ?? '?'));
  for (let y = 0; y < GRID; y++) {
    let line = '';
    for (let x = 0; x < GRID; x++) {
      const g = glyph.get(key(x, y));
      const t = p.tiles.get(key(x, y));
      line += g ?? (t ? letters[t.region] : '.');
    }
    rows.push(line);
  }
  return rows.join('\n');
}
