/**
 * Puente de SOLO LECTURA entre la partida real y el slice de Rupturas (07 §7, paso 1).
 *
 * Reads the player's save envelope ({version, savedAt, state}) from storage with getItem ONLY and turns
 * the collection into a cast for the 2.5D island: Canelo first, then the cats the player cares about
 * (stars, level), with element variety. Never writes, never migrates, never touches backups.
 */
import type { CastDef } from './cast';

export const SAVE_KEY = 'nolc-save-v1';

export interface SpeciesInfo {
  id: string;
  name: string;
  slug: string;
  elements: string[];
  rarity: string;
  primordial?: boolean;
  role?: string;
}

export interface BridgeCat {
  uid: string;
  species: string;
  name: string;
  level: number;
  stars: number;
  info: SpeciesInfo;
}

export interface BridgeIsland {
  source: 'partida' | 'fixture';
  kl: number;
  catCount: number;
  catdex: number;
  habitatElements: string[];
  cats: BridgeCat[];
}

/** the only storage access in this module: a read */
export function readSaveReadOnly(storage: Pick<Storage, 'getItem'>): unknown | null {
  try {
    const raw = storage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface RawCat {
  uid?: string;
  species?: string;
  name?: string;
  level?: number;
  stars?: number;
}

/** tolerant parse: unknown shapes give null, unknown species are skipped (never throw on a save) */
export function parseIsland(env: unknown, species: Map<string, SpeciesInfo>, source: BridgeIsland['source']): BridgeIsland | null {
  const st = (env as { state?: Record<string, unknown> } | null)?.state;
  if (!st || typeof st !== 'object' || !Array.isArray(st.cats)) return null;
  const cats: BridgeCat[] = [];
  for (const c of st.cats as RawCat[]) {
    const info = c && typeof c.species === 'string' ? species.get(c.species) : undefined;
    if (!info) continue;
    cats.push({ uid: String(c.uid ?? `${c.species}-${cats.length}`), species: info.id, name: c.name || info.name, level: Number(c.level) || 1, stars: Number(c.stars) || 0, info });
  }
  const habs = Array.isArray(st.habitats) ? (st.habitats as { element?: string }[]).map((h) => h?.element).filter((e): e is string => typeof e === 'string') : [];
  const catdex = st.catdex && typeof st.catdex === 'object' ? Object.keys(st.catdex as object).length : 0;
  return { source, kl: Number(st.kl) || 0, catCount: cats.length, catdex, habitatElements: habs, cats };
}

const RARITY_H: Record<string, number> = { common: 2.4, rare: 2.5, epic: 2.7, legendary: 3.1, mythic: 3.2, heroic: 3.0, divine: 3.3 };

/** stable 0..1 from a string (traits must not change between visits) */
function h01(s: string, salt: number) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Choose who lives on the slice's island: Canelo, then by (stars, level), keeping element variety
 * (no element gets more than ⌈max/3⌉ seats while others wait).
 */
export function pickCast(island: BridgeIsland, max: number, lite: (slug: string) => string): CastDef[] {
  const sorted = [...island.cats].sort((a, b) => {
    const ca = a.species === 'c_canelo' ? 1 : 0;
    const cb = b.species === 'c_canelo' ? 1 : 0;
    return cb - ca || b.stars - a.stars || b.level - a.level || a.uid.localeCompare(b.uid);
  });
  const cap = Math.ceil(max / 3);
  const perEl = new Map<string, number>();
  const chosen: BridgeCat[] = [];
  const later: BridgeCat[] = [];
  for (const c of sorted) {
    if (chosen.length >= max) break;
    const el = c.info.elements[0] ?? 'none';
    if ((perEl.get(el) ?? 0) >= cap) {
      later.push(c);
      continue;
    }
    perEl.set(el, (perEl.get(el) ?? 0) + 1);
    chosen.push(c);
  }
  for (const c of later) if (chosen.length < max) chosen.push(c);
  return chosen.map((c) => {
    const tags = [...c.info.elements];
    if (c.species === 'c_canelo') tags.push('canelo');
    if (c.info.primordial) tags.push('primordial');
    if (c.info.primordial && c.info.elements.includes('fire')) tags.push('lava');
    const calm = c.info.primordial || c.info.role === 'tanque';
    return {
      id: c.uid,
      species: c.species,
      name: c.name,
      slug: c.info.slug,
      url: lite(c.info.slug),
      height: c.species === 'c_canelo' ? 2.6 : RARITY_H[c.info.rarity] ?? 2.5,
      tags,
      traits: { playful: calm ? 0.2 + h01(c.uid, 1) * 0.3 : 0.4 + h01(c.uid, 2) * 0.6, curious: h01(c.uid, 3) },
      meta: `${c.info.elements.join(' + ')} · ${c.info.rarity} · Nv ${c.level}${c.stars ? ` · ★${c.stars}` : ''}. De tu partida (solo lectura).`,
      acts: calm ? 'calm' : 'all',
    } as CastDef;
  });
}
