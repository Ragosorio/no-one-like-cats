/**
 * Free placement (Dragon City style) — pure, no Pixi. Who owns which tile of the archipelago:
 *   · static  fixed buildings (Santuario, Puerto + balsa, Altar, Mesa, Faro, Banco), fishing pens,
 *             expansion secrets and the expedition pier (island/layout.ts plan)
 *   · habitats  a square yard at Habitat.gx/gy whose side GROWS with the tier (balance.json
 *             habitats.tiers[].footprint: 3×3 → 4×4 at T4 → 5×5 at T7), anywhere on land you own
 *             (home + cleared expansions). While an upgrade runs, the bigger yard is already reserved.
 *   · decor   the shop decorations (G.s.decor.placed)
 * Natural shrubs/trees/rocks never block: they get hidden under whatever you build (DecorLayer).
 * Used by the island system (buy/move/sell/upgrade), the placement mode (DecorLayer) and the shop.
 *
 * Old saves (habitats were always 3×3): a habitat whose tier now asks for more room grows in place
 * when its neighbours leave space (in any direction); otherwise it stays "compact" — the size it had
 * — until it is moved or upgraded somewhere roomier. Compact sizes live in `G.s.ext.habFoot`.
 */
import { G, Habitat } from '../state/game';
import { BAL } from '../state/econ';
import { EXPANSIONS } from '../data/content';
import { decorDef, decorState } from '../state/sys/decor';
import { islandPlan, Spot } from './layout';
import { key } from './archipelago';

/** footprint of a NEW habitat (tier 1) — the shop, room counters and expansions count in these */
export const HAB_SIZE: number = BAL.habitats.placement.footprint;
const HOME = 'home';

/** side (tiles) of the yard a habitat of `tier` stands on */
export function tierFootprint(tier: number): number {
  const tiers = BAL.habitats.tiers as { footprint?: number }[];
  const i = Math.max(1, Math.min(tiers.length, Math.round(Number.isFinite(tier) ? tier : 1))) - 1;
  return Math.max(HAB_SIZE, tiers[i]?.footprint ?? HAB_SIZE);
}

// ------------------------------------------------------------------ per-habitat size
/** compact (grandfathered) habitats: id → the side they keep until moved/upgraded with room */
function compactMap(): Record<string, number> | undefined {
  return (G.s.ext as Record<string, unknown> | undefined)?.habFoot as Record<string, number> | undefined;
}
function setCompact(id: string, size: number | null) {
  if (size === null) {
    const m = compactMap();
    if (m && id in m) delete m[id];
    return;
  }
  const ext = (G.s.ext ??= {}) as Record<string, unknown>;
  ((ext.habFoot ??= {}) as Record<string, number>)[id] = size;
}
function upgradeTimer(h: Habitat) {
  return G.s.timers.find((t) => t.kind === 'habitat_upgrade' && t.ref === h.id) ?? null;
}
/** the tier whose yard this habitat needs: its own, or the one it's being upgraded to (reserved) */
export function habitatTargetTier(h: Habitat): number {
  const up = upgradeTimer(h);
  return up ? Math.max(h.tier, Number(up.data?.tier ?? h.tier + 1)) : h.tier;
}
/** the yard its tier deserves (incl. a running upgrade's reserved tiles) */
export function habitatFullSize(h: Habitat): number {
  return tierFootprint(habitatTargetTier(h));
}
/** the yard it stands on right now (smaller than the full one only for grandfathered habitats) */
export function habitatSize(h: Habitat): number {
  const full = habitatFullSize(h);
  const c = compactMap()?.[h.id];
  return Number.isFinite(c) && (c as number) >= HAB_SIZE ? Math.min(full, c as number) : full;
}
/** an old habitat that still stands on a smaller yard than its tier (no room around it yet) */
export function isCompact(h: Habitat) {
  return habitatSize(h) < habitatFullSize(h);
}
/** forget the compact size of a sold habitat */
export function forgetHabitat(id: string) {
  setCompact(id, null);
}

// ------------------------------------------------------------------ static map
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

/** the yard a habitat stands on (its own size: grows with the tier) */
export function habitatSpot(h: Habitat): Spot {
  const s = habitatSize(h);
  return { gx: h.gx, gy: h.gy, w: s, h: s };
}
export function hasSpot(h: Habitat) {
  return Number.isFinite(h.gx) && Number.isFinite(h.gy);
}

/** tile → habitat id (every habitat with its own size, reserved upgrade tiles included) */
export function habitatTiles(ignoreId?: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const h of G.s.habitats) {
    if (h.id === ignoreId || !hasSpot(h)) continue;
    const s = habitatSize(h);
    for (let y = h.gy; y < h.gy + s; y++) for (let x = h.gx; x < h.gx + s; x++) out.set(key(x, y), h.id);
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

function check(gx: number, gy: number, size: number, o: Occ): SpotCheck {
  const tiles = islandPlan().tiles;
  let region: string | null = null;
  let why: string | null = null;
  for (let y = gy; y < gy + size; y++)
    for (let x = gx; x < gx + size; x++) {
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

/**
 * Can a habitat yard of `size` go with its top-left tile at (gx, gy)? Default size: the full yard of
 * the habitat being moved (`ignoreId`), or a new one's (3×3).
 */
export function checkHabitatSpot(gx: number, gy: number, ignoreId?: string, size?: number): SpotCheck {
  if (!Number.isFinite(gx) || !Number.isFinite(gy)) return { ok: false, reason: 'Fuera del mapa' };
  const h = ignoreId ? G.s.habitats.find((x) => x.id === ignoreId) : undefined;
  const s = size ?? (h ? habitatFullSize(h) : HAB_SIZE);
  return check(Math.round(gx), Math.round(gy), s, occ(ignoreId));
}

/** every valid top-left tile for a yard of `size`, nearest to (nearX, nearY) first (default: the home island's center) */
export function freeHabitatSpots(opts: { ignoreId?: string; nearX?: number; nearY?: number; limit?: number; size?: number } = {}) {
  const plan = islandPlan();
  const home = plan.plans.get(HOME)!;
  const size = opts.size ?? HAB_SIZE;
  const half = Math.floor(size / 2);
  const nx = opts.nearX ?? home.center.gx - half;
  const ny = opts.nearY ?? home.center.gy - half;
  const o = occ(opts.ignoreId);
  const out: { gx: number; gy: number; region: string; d: number }[] = [];
  for (const t of plan.tiles.values()) {
    if (!o.owned.has(t.region)) continue;
    const c = check(t.gx, t.gy, size, o);
    if (c.ok) out.push({ gx: t.gx, gy: t.gy, region: c.region, d: Math.hypot(t.gx - nx, t.gy - ny) + (t.region === HOME ? 0 : 0.01) });
  }
  out.sort((a, b) => a.d - b.d || a.gy - b.gy || a.gx - b.gx);
  return opts.limit ? out.slice(0, opts.limit) : out;
}

export function nearestHabitatSpot(nearX?: number, nearY?: number, ignoreId?: string, size?: number) {
  return freeHabitatSpots({ ignoreId, nearX, nearY, limit: 1, size })[0] ?? null;
}

// ------------------------------------------------------------------ growing (upgrades)
/**
 * Top-left anchors of a `size` yard that still covers the `core` square (gx, gy, cur): the yard can
 * grow in any direction. Centered growth first, then growing towards the back (keeps the gate).
 */
function growAnchors(gx: number, gy: number, cur: number, size: number) {
  const d = Math.max(0, size - cur);
  const out: { gx: number; gy: number; w: number }[] = [];
  for (let dy = 0; dy <= d; dy++) for (let dx = 0; dx <= d; dx++) out.push({ gx: gx - dx, gy: gy - dy, w: Math.abs(dx - d / 2) + Math.abs(dy - d / 2) - (dx + dy) * 0.01 });
  return out.sort((a, b) => a.w - b.w);
}

export type GrowCheck = { ok: true; gx: number; gy: number; region: string } | { ok: false; reason: string };

/** where this habitat's yard fits at `size` without leaving the tiles it stands on (null = no room around it) */
export function growSpot(h: Habitat, size: number, opts: { ignoreDecor?: boolean } = {}): GrowCheck {
  if (!hasSpot(h)) return { ok: false, reason: 'Fuera del mapa' };
  const cur = Math.min(size, habitatSize(h));
  const o = occ(h.id);
  if (opts.ignoreDecor) o.decor = new Set();
  let first: string | null = null;
  for (const a of growAnchors(h.gx, h.gy, cur, size)) {
    const c = check(a.gx, a.gy, size, o);
    if (c.ok) return { ok: true, gx: a.gx, gy: a.gy, region: c.region };
    first ??= c.reason;
  }
  return { ok: false, reason: first ?? 'No cabe' };
}

export interface UpgradeRoom {
  /** yard side now → after the upgrade */
  from: number;
  to: number;
  /** extra tiles the yard needs (0 = same size) */
  extra: number;
  /** where it grows in place (null = no room around it) */
  at: { gx: number; gy: number } | null;
  /** why it doesn't grow in place */
  reason: string | null;
  /** nearest free spot of the new size elsewhere on your land (for "MOVER Y MEJORAR") */
  elsewhere: { gx: number; gy: number; region: string } | null;
}
/** does the next tier's yard fit? (in place, growing in any direction; or somewhere else) */
export function upgradeRoom(h: Habitat): UpgradeRoom {
  const from = habitatSize(h);
  const to = Math.max(from, tierFootprint(h.tier + 1));
  const g = growSpot(h, to);
  const at = g.ok ? { gx: g.gx, gy: g.gy } : null;
  return {
    from,
    to,
    extra: to * to - from * from,
    at,
    reason: g.ok ? null : g.reason,
    elsewhere: at ? null : nearestHabitatSpot(h.gx + Math.floor(from / 2) - Math.floor(to / 2), h.gy + Math.floor(from / 2) - Math.floor(to / 2), h.id, to),
  };
}

/** put a habitat on (gx, gy) with its full yard (moves / upgrades): forgets a compact size */
export function settleHabitatAt(h: Habitat, gx: number, gy: number, region: string) {
  h.gx = Math.round(gx);
  h.gy = Math.round(gy);
  h.region = region;
  setCompact(h.id, null);
}

/** a compact habitat whose upgrade just finished tries to grow into its new yard; else stays compact */
export function growAfterUpgrade(h: Habitat): boolean {
  if (!hasSpot(h) || compactMap()?.[h.id] === undefined) return false;
  const full = habitatFullSize(h);
  const g = growSpot(h, full);
  if (!g.ok) return false;
  settleHabitatAt(h, g.gx, g.gy, g.region);
  return true;
}

// ------------------------------------------------------------------ room counters (new habitats: 3×3)
// cheap memo for the UI (buildBlocker / shop strip are evaluated every refresh)
let roomSig = '';
let roomVal = 0;
function sig() {
  const hs = G.s.habitats.map((h) => `${h.gx},${h.gy},${habitatSize(h)}`).join(';');
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
    if (!check(t.gx, t.gy, HAB_SIZE, o).ok) continue;
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

// ------------------------------------------------------------------ load-time repair
/** what the last ensureHabitatPositions() did (the retro patch reports it once) */
export const settleStats = { moved: 0, grew: 0, compact: 0 };

/**
 * Every habitat must stand on a valid yard of its own size. Runs on every load (idempotent):
 *  · a compact (grandfathered) habitat grows into its full yard as soon as there is room around it;
 *  · an old-save habitat whose tier now needs a bigger yard grows in place (any direction) or, without
 *    room, keeps the biggest yard that fits around the 3×3 it stood on (compact, never moved away);
 *  · a habitat without a position (hand-edited save) or overlapping something that never moves gets
 *    the nearest free spot (full size, else 3×3 compact) — it is never removed.
 * Decorations never block the yard it already had (they go back to the chest: DecorLayer.validate),
 * but growth never swallows them. Returns how many were re-homed.
 */
export function ensureHabitatPositions(): number {
  settleStats.moved = settleStats.grew = settleStats.compact = 0;
  const plan = islandPlan();
  const home = plan.plans.get(HOME)!;
  // forget compact sizes of habitats that no longer exist
  const cm = compactMap();
  if (cm) for (const id of Object.keys(cm)) if (!G.s.habitats.some((h) => h.id === id)) delete cm[id];
  const noDecor = (id: string) => {
    const o = occ(id);
    o.decor = new Set(); // a decoration under a habitat goes to the chest instead (DecorLayer.validate)
    return o;
  };
  // pass 1 · an old-save habitat whose tier now asks for a bigger yard than fits where it stands:
  // shrink it to the 3×3 it always had (pass 2 grows it as much as the neighbours allow)
  const pending = new Set<string>();
  for (const h of G.s.habitats) {
    if (!hasSpot(h)) continue;
    const s = habitatSize(h);
    if (s <= HAB_SIZE || check(h.gx, h.gy, s, noDecor(h.id)).ok) continue;
    setCompact(h.id, HAB_SIZE);
    pending.add(h.id);
  }
  // pass 2 · valid yards (compact ones grow when there's room) or a new spot
  for (const h of G.s.habitats) {
    const full = habitatFullSize(h);
    if (hasSpot(h) && check(h.gx, h.gy, habitatSize(h), noDecor(h.id)).ok) {
      h.region = regionAt(h.gx, h.gy) ?? h.region;
      const size = habitatSize(h);
      let grew = false;
      for (let s = full; s > size && !grew; s--) {
        const g = growSpot(h, s);
        if (!g.ok) continue;
        settleHabitatAt(h, g.gx, g.gy, g.region);
        if (s < full) setCompact(h.id, s);
        grew = s === full;
        if (!grew) break;
      }
      if (pending.has(h.id) || grew) {
        if (isCompact(h)) settleStats.compact++;
        else settleStats.grew++;
      }
      continue;
    }
    // no valid yard where it stands: the nearest free spot (its full yard, else a compact 3×3)
    const half = Math.floor(full / 2);
    const near = hasSpot(h) ? { x: h.gx, y: h.gy } : { x: home.center.gx - half, y: home.center.gy - half };
    const sFull = nearestHabitatSpot(near.x, near.y, h.id, full);
    const s = sFull ?? nearestHabitatSpot(near.x, near.y, h.id, HAB_SIZE);
    if (!s) continue; // no room at all: keep it where it was (still produces, still houses its cats)
    h.gx = s.gx;
    h.gy = s.gy;
    h.region = s.region;
    setCompact(h.id, sFull ? null : HAB_SIZE);
    if (!sFull && full > HAB_SIZE) settleStats.compact++;
    settleStats.moved++;
  }
  return settleStats.moved;
}

const regionRoomCache = new Map<string, number>();
/** how many (new, 3×3) habitats an (empty) region holds — what an expansion "gives" (greedy, ignores decor) */
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
    if (!check(t.gx, t.gy, HAB_SIZE, o).ok) continue;
    n++;
    for (let y = t.gy; y < t.gy + HAB_SIZE; y++) for (let x = t.gx; x < t.gx + HAB_SIZE; x++) o.habs.set(key(x, y), '_');
  }
  regionRoomCache.set(region, n);
  return n;
}
