/**
 * Parte II · Oleada 4 · H60 «La Isla que Nadie Recuerda» (guion 13 · biblia 05 §4): YOUR island, the version where
 * you never arrived. It is generated from your own save — your habitats' layout, their elements, the silhouettes
 * of the cats that live in them — all in ruins. It never punishes: it is sad, and you repair it with your cats.
 *
 * Save data (optional; absent = never visited): `G.s.ext.olvidada = { layout, repaired, at? }`
 *   layout    the ruins, snapshotted ONCE when the mission appears (building more habitats later doesn't move them)
 *   repaired  ruin id → uid of the cat that repaired it
 * The region (regions/olvidada.ts) draws `olvidadaRuins()` and calls `repairRuin()`. When every ruin stands again it
 * emits `feature_olvidada` (H60's goal). The narrative reset of Parte II replays H60: when H60 appears again
 * (not done) the island goes back to ruins and is snapshotted again — nothing is paid twice (Polvillo is in the
 * claimed-rewards ledger, rupturasO4.ts).
 */
import { CAT_BY_ID } from '../../data/content';
import { G } from '../game';
import type { GameState, Habitat, OwnedCat } from '../game';

export const RUINS_MAX = 8;
export const RUINS_MIN = 3;
export const OLVIDADA_FEATURE = 'olvidada';
const MISSION = 'H60';

export interface Ruin {
  /** the habitat's id (or `ruina_<n>` for the padding ones) */
  id: string;
  /** what it was: a habitat of that element, or one of the island's landmarks */
  kind: 'habitat' | 'faro' | 'muelle' | 'casa';
  element: string;
  tier: number;
  /** footprint on YOUR island (tiles; the region maps them onto its terrain) */
  gx: number;
  gy: number;
  /** the species that lived there (≤3): their silhouettes wait among the ruins */
  silhouettes: string[];
}

export interface OlvidadaSave {
  layout: Ruin[];
  repaired: Record<string, string>;
  at?: number;
}

type LayoutSave = Pick<GameState, 'cats'> & Partial<Pick<GameState, 'habitats'>>;

const PADS: { kind: Ruin['kind']; gx: number; gy: number }[] = [
  { kind: 'faro', gx: 2, gy: 2 },
  { kind: 'muelle', gx: 12, gy: 9 },
  { kind: 'casa', gx: 7, gy: 5 },
];

/** pure: the ruins of this save (biggest habitats first, stable), padded with landmarks up to RUINS_MIN */
export function olvidadaLayoutFrom(save: LayoutSave | null | undefined): Ruin[] {
  const cats = new Map((save?.cats ?? []).map((c) => [c.uid, c] as [string, OwnedCat]));
  const habs: Habitat[] = [...(save?.habitats ?? [])].sort((a, b) => (b.tier ?? 0) - (a.tier ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const out: Ruin[] = habs.slice(0, RUINS_MAX).map((h) => ({
    id: h.id,
    kind: 'habitat',
    element: h.element,
    tier: h.tier ?? 1,
    gx: h.gx ?? 0,
    gy: h.gy ?? 0,
    silhouettes: (h.cats ?? [])
      .map((u) => cats.get(u)?.species)
      .filter((s): s is string => !!s)
      .slice(0, 3),
  }));
  const anyEl = out[0]?.element ?? CAT_BY_ID.get(save?.cats?.[0]?.species ?? '')?.elements?.[0] ?? 'water';
  for (let i = 0; out.length < RUINS_MIN && i < PADS.length; i++) {
    const p = PADS[i];
    out.push({ id: `ruina_${p.kind}`, kind: p.kind, element: anyEl, tier: 1, gx: p.gx, gy: p.gy, silhouettes: [] });
  }
  return out;
}

/** pure: a well-formed copy of whatever is in the save (tests call it directly) */
export function normalizeOlvidada(raw: unknown): OlvidadaSave | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const layout = Array.isArray(r.layout)
    ? (r.layout as Ruin[]).filter((x) => x && typeof x.id === 'string' && typeof x.element === 'string').map((x) => ({
        id: x.id,
        kind: (['habitat', 'faro', 'muelle', 'casa'] as const).includes(x.kind) ? x.kind : 'habitat',
        element: x.element,
        tier: Number.isFinite(x.tier) ? x.tier : 1,
        gx: Number.isFinite(x.gx) ? x.gx : 0,
        gy: Number.isFinite(x.gy) ? x.gy : 0,
        silhouettes: Array.isArray(x.silhouettes) ? x.silhouettes.filter((s) => typeof s === 'string').slice(0, 3) : [],
      }))
    : [];
  const ids = new Set(layout.map((x) => x.id));
  const repaired: Record<string, string> = {};
  if (r.repaired && typeof r.repaired === 'object') {
    for (const [k, v] of Object.entries(r.repaired as Record<string, unknown>)) if (ids.has(k) && typeof v === 'string') repaired[k] = v;
  }
  const out: OlvidadaSave = { layout, repaired };
  if (typeof r.at === 'number' && Number.isFinite(r.at)) out.at = r.at;
  return out;
}

function read(): OlvidadaSave | null {
  return normalizeOlvidada(G.s?.ext?.olvidada);
}
function write(o: OlvidadaSave) {
  (G.s.ext ??= {}).olvidada = o;
}

const missionSeen = () => !!G.s?.missions && (G.s.missions.active.includes(MISSION) || G.s.missions.done.includes(MISSION));

/** the island's ruins (snapshotted the first time anyone asks once H60 appeared; before that: a live preview) */
export function olvidadaRuins(): Ruin[] {
  const o = read();
  if (o?.layout.length) return o.layout;
  const layout = olvidadaLayoutFrom(G.s);
  if (missionSeen() && G.s.cats.length) write({ layout, repaired: {}, at: Date.now() });
  return layout;
}
export function isRepaired(ruinId: string) {
  return !!read()?.repaired[ruinId];
}
/** uid of the cat that repaired it (null = still in ruins) */
export function repairedBy(ruinId: string): string | null {
  return read()?.repaired[ruinId] ?? null;
}
/** 0..1 */
export function olvidadaProgress(): number {
  const ruins = olvidadaRuins();
  if (!ruins.length) return 0;
  const o = read();
  return ruins.filter((r) => o?.repaired[r.id]).length / ruins.length;
}

/** who can repair that ruin: your cats of its element first; if you have none of that element, anyone (it never blocks) */
export function repairersFor(ruinId: string): OwnedCat[] {
  const ruin = olvidadaRuins().find((r) => r.id === ruinId);
  if (!ruin) return [];
  const used = new Set(Object.values(read()?.repaired ?? {}));
  const free = G.s.cats.filter((c) => !used.has(c.uid));
  const match = free.filter((c) => CAT_BY_ID.get(c.species)?.elements?.includes(ruin.element));
  return match.length ? match : free.length ? free : [...G.s.cats];
}

/** the repairs are open (H60 active) */
export function olvidadaOpen() {
  return !!G.s?.missions?.active.includes(MISSION);
}

/** repair a ruin with one of your cats. true = it stands again. The last one emits `feature_olvidada` (H60). */
export function repairRuin(ruinId: string, catUid: string): boolean {
  if (!olvidadaOpen()) return false;
  const ruins = olvidadaRuins();
  if (!ruins.some((r) => r.id === ruinId)) return false;
  if (!G.s.cats.some((c) => c.uid === catUid)) return false;
  const o = read() ?? { layout: ruins, repaired: {}, at: Date.now() };
  if (o.repaired[ruinId]) return false;
  o.repaired[ruinId] = catUid;
  write(o);
  G.count('feature_olvidada_ruina');
  if (ruins.every((r) => o.repaired[r.id])) G.count(`feature_${OLVIDADA_FEATURE}`);
  G.emit('changed', undefined);
  G.save();
  return true;
}

/**
 * H60 appears (again, after the narrative reset): the island is in ruins again, re-read from the save as it is NOW.
 * A save that reloads with H60 active and every ruin already standing answers the mission (no deadlock).
 */
G.on('mission', (p) => {
  if (p.id !== MISSION || p.kind !== 'new' || !G.s?.ext) return;
  const o = read();
  if (o && Object.keys(o.repaired).length) delete G.s.ext.olvidada;
});
G.afterLoad.push(() => {
  const ext = G.s.ext;
  if (ext && ext.olvidada !== undefined) {
    const o = normalizeOlvidada(ext.olvidada);
    if (o) ext.olvidada = o;
    else delete ext.olvidada;
  }
  if (!olvidadaOpen()) return;
  const o = read();
  if (!o?.layout.length || !o.layout.every((r) => o.repaired[r.id])) return;
  const base = G.s.missions.progress[`${MISSION}:feature_${OLVIDADA_FEATURE}`] ?? 0;
  if ((G.s.counters[`feature_${OLVIDADA_FEATURE}`] ?? 0) <= base) G.count(`feature_${OLVIDADA_FEATURE}`);
});
