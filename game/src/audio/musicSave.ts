/**
 * The Fonoteca's slice of the save: G.s.ext.music (optional; absent on every save before Parte II).
 * Pure — no game imports — so state/migrate.ts › normalize() can repair it on every load.
 *
 * Rules (docs/ACTUALIZACIONES.md): never lose an unlock. Unknown song ids are KEPT (a newer build's
 * song, or the catalog arriving later); only malformed values are repaired. Unknown keys survive.
 */
export type RepeatMode = 'off' | 'all' | 'one';
export interface MusicUnlock {
  /** Date.now() of the first unlock */
  at: number;
  /** where it was obtained (spoiler-free text shown in the Fonoteca, e.g. «Isla Nácar») */
  source: string;
}
export interface MusicExt {
  /** 'song' or 'song.variation' → first unlock */
  unlocked: Record<string, MusicUnlock>;
  /** song ids */
  favorites: string[];
  /** «Música de la isla»: a ref the player chose for the island (Part II), or null = the director's */
  islandTrack: string | null;
  /** songs whose unlock animation already played */
  toasted: string[];
  prefs: { shuffle: boolean; repeat: RepeatMode };
  /** last ref played in the Fonoteca */
  last: string | null;
  [k: string]: unknown;
}

export const defaultMusicExt = (): MusicExt => ({ unlocked: {}, favorites: [], islandTrack: null, toasted: [], prefs: { shuffle: false, repeat: 'all' }, last: null });

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const okId = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= 120;
const ids = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter(okId).map((x) => x.trim()))] : []);

/** repair (in place when possible) — idempotent */
export function normalizeMusicExt(raw: unknown): MusicExt {
  const d = defaultMusicExt();
  if (!isObj(raw)) return d;
  const m = raw as Record<string, unknown>;
  // unlocked: map (current) — or an array of ids (hand-edited / early shape)
  const un: Record<string, MusicUnlock> = {};
  if (Array.isArray(m.unlocked)) {
    for (const id of ids(m.unlocked)) un[id] = { at: 0, source: '' };
  } else if (isObj(m.unlocked)) {
    for (const [k, v] of Object.entries(m.unlocked)) {
      if (!okId(k)) continue;
      const e = isObj(v) ? v : {};
      un[k.trim()] = {
        at: typeof e.at === 'number' && Number.isFinite(e.at) && e.at >= 0 ? e.at : 0,
        source: typeof e.source === 'string' ? e.source.slice(0, 120) : '',
      };
    }
  }
  m.unlocked = un;
  m.favorites = ids(m.favorites);
  m.islandTrack = okId(m.islandTrack) ? m.islandTrack : null;
  m.toasted = ids(m.toasted);
  const p = isObj(m.prefs) ? m.prefs : {};
  m.prefs = { ...p, shuffle: p.shuffle === true, repeat: p.repeat === 'off' || p.repeat === 'one' || p.repeat === 'all' ? p.repeat : 'all' };
  m.last = okId(m.last) ? m.last : null;
  return m as MusicExt;
}

/** the song id of a ref ('liky_fight.ambient' → 'liky_fight') */
export const songOf = (ref: string) => {
  const i = ref.indexOf('.');
  return i > 0 ? ref.slice(0, i) : ref;
};

/** union of two unlock maps (earliest date, first non-empty source) — merging a mirror never loses anything */
export function mergeUnlocks(into: Record<string, MusicUnlock>, from: Record<string, MusicUnlock>) {
  let added = 0;
  for (const [k, v] of Object.entries(from)) {
    const cur = into[k];
    if (!cur) {
      into[k] = { at: v.at, source: v.source };
      added++;
    } else {
      if (v.at && (!cur.at || v.at < cur.at)) cur.at = v.at;
      if (!cur.source && v.source) cur.source = v.source;
    }
  }
  return added;
}
