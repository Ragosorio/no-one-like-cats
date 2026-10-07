/**
 * Free placement (Dragon City style) — pure, no Pixi. Who owns which tile of the archipelago:
 *   · static  fixed buildings (Santuario, Puerto + balsa, Altar, Mesa, Faro, Banco), fishing pens,
 *             expansion secrets and the expedition pier (island/layout.ts plan)
 *   · habitats  3×3 footprint at Habitat.gx/gy, anywhere on land you own (home + cleared expansions)
 *   · decor   the shop decorations (G.s.decor.placed)
 * Natural shrubs/trees/rocks never block: they get hidden under whatever you build (DecorLayer).
 * Used by the island system (buy/move/sell), the placement mode (DecorLayer) and the shop.
 */
import { G, Habitat } from '../state/game';
import { BAL } from '../state/econ';
import { EXPANSIONS } from '../data/content';
import { decorDef, decorState } from '../state/sys/decor';
import { islandPlan, Spot } from './layout';
import { key } from './archipelago';

export const HAB_SIZE: number = BAL.habitats.placement.footprint;
const HOME = 'home';

let staticCache: Set<string> | null = null;
/** tiles taken by things that never move */
export function staticBlocked(): Set<string> {
  if (staticCache) return staticCache;
  const p = islandPlan();
  const out = new Set<string>();
  const mark = (s: Spot | undefined) => {
    if (!s) return;
    for (let y = Math.floor(s.gy); y < Math.floor(s.gy) + s.h; y++) for (let x = Math.floor(s.gx); x < Math.floor(s.gx) + s.w; x++) out.add(key(x, y));
  };
  for (const r of p.plans.values()) {
    r.farms.forEach(mark);
    mark(r.secret);
    mark(r.pier);
  }
  const h = p.home;
  [h.sanctuary, h.port, h.altar, h.mesa, h.lighthouse, h.bank, h.boat].forEach(mark);
  staticCache = out;
  return out;
}

/** regions the player can build on */
export function ownedRegions(): Set<string> {
  const out = new Set<string>([HOME]);
  for (const n of G.s.expansions.cleared) {
    const e = EXPANSIONS[n - 1];
    if (e) out.add(e.id);
  }
  return out;
}

export function regionAt(gx: number, gy: number): string | null {
  return islandPlan().tiles.get(key(gx, gy))?.region ?? null;
}

export function habitatSpot(h: Pick<Habitat, 'gx' | 'gy'>): Spot {
  return { gx: h.gx, gy: h.gy, w: HAB_SIZE, h: HAB_SIZE };
}
export function hasSpot(h: Habitat) {
  return Number.isFinite(h.gx) && Number.isFinite(h.gy);
}

/** tile → habitat id */
export function habitatTiles(ignoreId?: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const h of G.s.habitats) {
    if (h.id === ignoreId || !hasSpot(h)) continue;
    for (let y = h.gy; y < h.gy + HAB_SIZE; y++) for (let x = h.gx; x < h.gx + HAB_SIZE; x++) out.set(key(x, y), h.id);
  }
  return out;
}
export function decorTiles(ignoreUid?: string): Set<string> {
  const out = new Set<string>();
  for (const p of decorState().placed) {
    if (p.uid === ignoreUid) continue;
    const s = decorDef(p.id)?.size ?? 1;
    for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) out.add(key(p.x + dx, p.y + dy));
  }
  return out;
}

export type SpotCheck = { ok: true; region: string } | { ok: false; reason: string };

interface Occ {
  owned: Set<string>;
  stat: Set<string>;
  habs: Map<string, string>;
  decor: Set<string>;
}
function occ(ignoreHab?: string): Occ {
  return { owned: ownedRegions(), stat: staticBlocked(), habs: habitatTiles(ignoreHab), decor: decorTiles() };
}

function check(gx: number, gy: number, o: Occ): SpotCheck {
  const tiles = islandPlan().tiles;
  let region: string | null = null;
  let why: string | null = null;
  for (let y = gy; y < gy + HAB_SIZE; y++)
    for (let x = gx; x < gx + HAB_SIZE; x++) {
      const t = tiles.get(key(x, y));
      if (!t) return { ok: false, reason: 'Se sale de la isla' };
      if (region === null) region = t.region;
      else if (t.region !== region) return { ok: false, reason: 'No puede quedar entre dos islas' };
      if (!o.owned.has(t.region)) return { ok: false, reason: 'Ese terreno todavía no es tuyo' };
      const k = key(x, y);
      if (o.stat.has(k)) why ??= 'Ahí hay un edificio';
      else if (o.habs.has(k)) why ??= 'Ahí ya hay un hábitat';
      else if (o.decor.has(k)) why ??= 'Ahí hay decoración (muévela o guárdala)';
    }
  if (why) return { ok: false, reason: why };
  return { ok: true, region: region! };
}

/** can a 3×3 habitat go with its top-left tile at (gx, gy)? */
export function checkHabitatSpot(gx: number, gy: number, ignoreId?: string): SpotCheck {
  if (!Number.isFinite(gx) || !Number.isFinite(gy)) return { ok: false, reason: 'Fuera del mapa' };
  return check(Math.round(gx), Math.round(gy), occ(ignoreId));
}

/** every valid top-left tile, nearest to (nearX, nearY) first (default: the home island's center) */
export function freeHabitatSpots(opts: { ignoreId?: string; nearX?: number; nearY?: number; limit?: number } = {}) {
  const plan = islandPlan();
  const home = plan.plans.get(HOME)!;
  const nx = opts.nearX ?? home.center.gx - 1;
  const ny = opts.nearY ?? home.center.gy - 1;
  const o = occ(opts.ignoreId);
  const out: { gx: number; gy: number; region: string; d: number }[] = [];
  for (const t of plan.tiles.values()) {
    if (!o.owned.has(t.region)) continue;
    const c = check(t.gx, t.gy, o);
    if (c.ok) out.push({ gx: t.gx, gy: t.gy, region: c.region, d: Math.hypot(t.gx - nx, t.gy - ny) + (t.region === HOME ? 0 : 0.01) });
  }
  out.sort((a, b) => a.d - b.d);
  return opts.limit ? out.slice(0, opts.limit) : out;
}

export function nearestHabitatSpot(nearX?: number, nearY?: number, ignoreId?: string) {
  return freeHabitatSpots({ ignoreId, nearX, nearY, limit: 1 })[0] ?? null;
}

// cheap memo for the UI (buildBlocker / shop strip are evaluated every refresh)
let roomSig = '';
let roomVal = 0;
function sig() {
  const hs = G.s.habitats.map((h) => `${h.gx},${h.gy}`).join(';');
  const ds = decorState()
    .placed.map((p) => `${p.x},${p.y}`)
    .join(';');
  return `${G.s.expansions.cleared.join(',')}|${hs}|${ds}`;
}
/** how many MORE habitats fit right now (greedy packing from the home center outwards) */
export function roomForHabitats(): number {
  const s = sig();
  if (s === roomSig) return roomVal;
  const o = occ();
  const plan = islandPlan();
  const home = plan.plans.get(HOME)!;
  const tiles = [...plan.tiles.values()].filter((t) => o.owned.has(t.region)).sort((a, b) => Math.hypot(a.gx - home.center.gx, a.gy - home.center.gy) - Math.hypot(b.gx - home.center.gx, b.gy - home.center.gy));
  let n = 0;
  for (const t of tiles) {
    if (!check(t.gx, t.gy, o).ok) continue;
    n++;
    for (let y = t.gy; y < t.gy + HAB_SIZE; y++) for (let x = t.gx; x < t.gx + HAB_SIZE; x++) o.habs.set(key(x, y), '_');
  }
  roomSig = s;
  roomVal = n;
  return n;
}
export function hasHabitatSpace() {
  return roomForHabitats() > 0;
}

/** a decoration tile is free (land you own, nothing built on it) */
export function tileFreeForDecor(x: number, y: number, ignoreUid?: string) {
  const t = islandPlan().tiles.get(key(x, y));
  if (!t || !ownedRegions().has(t.region)) return false;
  const k = key(x, y);
  if (staticBlocked().has(k)) return false;
  if (habitatTiles().has(k)) return false;
  return !decorTiles(ignoreUid).has(k);
}

/**
 * Every habitat must stand on a valid footprint. A habitat without a position (hand-edited save) or
 * overlapping something that never moves gets the nearest free spot — it is never removed.
 * Returns how many were re-homed.
 */
export function ensureHabitatPositions(): number {
  let moved = 0;
  const plan = islandPlan();
  const home = plan.plans.get(HOME)!;
  for (const h of G.s.habitats) {
    const ok = hasSpot(h) && (() => {
      const o = occ(h.id);
      o.decor = new Set(); // a decoration under a habitat goes to the chest instead (DecorLayer.validate)
      return check(h.gx, h.gy, o).ok;
    })();
    if (ok) {
      h.region = regionAt(h.gx, h.gy) ?? h.region;
      continue;
    }
    const near = hasSpot(h) ? { x: h.gx, y: h.gy } : { x: home.center.gx - 1, y: home.center.gy - 1 };
    const s = nearestHabitatSpot(near.x, near.y, h.id);
    if (!s) continue; // no room at all: keep it where it was (still produces, still houses its cats)
    h.gx = s.gx;
    h.gy = s.gy;
    h.region = s.region;
    moved++;
  }
  return moved;
}

const regionRoomCache = new Map<string, number>();
/** how many habitats an (empty) region holds — what an expansion "gives" (greedy, ignores decor) */
export function regionRoom(region: string): number {
  const hit = regionRoomCache.get(region);
  if (hit !== undefined) return hit;
  const plan = islandPlan();
  const rp = plan.plans.get(region);
  if (!rp) return 0;
  const o: Occ = { owned: new Set([region]), stat: staticBlocked(), habs: new Map(), decor: new Set() };
  const tiles = [...rp.tiles].sort((a, b) => Math.hypot(a.gx - rp.center.gx, a.gy - rp.center.gy) - Math.hypot(b.gx - rp.center.gx, b.gy - rp.center.gy));
  let n = 0;
  for (const t of tiles) {
    if (!check(t.gx, t.gy, o).ok) continue;
    n++;
    for (let y = t.gy; y < t.gy + HAB_SIZE; y++) for (let x = t.gx; x < t.gx + HAB_SIZE; x++) o.habs.set(key(x, y), '_');
  }
  regionRoomCache.set(region, n);
  return n;
}
