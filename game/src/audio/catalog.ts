/**
 * Music catalog: src/data/music/tracks.json (+ beatmaps/<id>.json), written by the MUSIC agent.
 * Missing files are fine: the catalog is simply empty and the director falls back to procedural music.
 *
 * Track refs used everywhere (audioApi.cue, director.json, the Fonoteca):
 *   'liky_fight'           the song (its original version)
 *   'liky_fight.ambient'   a variation, by variation id or kind ('ambient', 'aftermath'…)
 */
import { BeatMap, Loop, cleanBeatMap, gridFromTempo, validLoop } from './beatgrid';

export interface TrackVariation {
  id: string;
  file: string;
  kind: string;
  title?: string;
  durationSec?: number;
  loop?: Loop | null;
  bpm?: number;
  /** beat map id when the variation has its own */
  beatmap?: string;
  gainDb?: number;
  /** (ext) stems that play in sync with this file, each with its own gain (src/audio/layers.ts) */
  layers?: { id: string; file: string; loop: Loop; gain: number }[];
}
export interface Track {
  id: string;
  title: string;
  file: string;
  durationSec: number;
  bpm: number;
  key: string;
  variations: TrackVariation[];
  loop: Loop | null;
  cover: { palette: string[]; motif: string };
  moods: string[];
  /** optional: loudness trim (dB) so every song sits at the same level */
  gainDb?: number;
  /** optional: measured integrated loudness; used for a trim when gainDb is absent */
  lufs?: number;
  /** optional: Fonoteca hint shown while the song is still hidden (no spoilers) */
  hint?: string;
  /** optional alternative encodes, best first (the first the browser can play wins) */
  files?: string[];
  /** beat map id when it isn't the song id */
  beatmap?: string;
}

/** a ref resolved against the catalog */
export interface Resolved {
  /** canonical id: 'song' or 'song.variation' */
  ref: string;
  track: Track;
  variation: TrackVariation | null;
  url: string;
  durationSec: number;
  loop: Loop | null;
  bpm: number;
  /** beat-map ids to try, most specific first */
  beatmapIds: string[];
  /** linear trim applied on the deck */
  trim: number;
  title: string;
  /** (ext) in-sync layers (urls resolved), empty when the track has none */
  layers?: { id: string; url: string; loop: Loop; gain: number }[];
}

// eager: tracks.json is small. A missing file → {} (empty catalog).
const RAW = import.meta.glob('../data/music/tracks.json', { eager: true, import: 'default' }) as Record<string, unknown>;
// lazy: beat maps are only fetched when their track plays.
const MAPS = import.meta.glob('../data/music/beatmaps/*.json', { import: 'default' }) as Record<string, () => Promise<unknown>>;

const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d);
/** 'beatmaps/liky_fight.json' | 'liky_fight' → 'liky_fight' */
const mapId = (v: unknown) => (typeof v === 'string' && v ? v.replace(/^.*\//, '').replace(/\.json$/i, '') : undefined);
/** a variation that IS the original (MUSIC lists it for completeness): an alias of the song, not a version */
const isOriginal = (t: { file: string }, v: { kind: string; file: string }) => v.kind === 'original' || v.file === t.file;
const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

function cleanTrack(raw: unknown): Track | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = str(r.id).trim();
  const file = str(r.file);
  if (!id || !file) return null;
  const cov = (r.cover && typeof r.cover === 'object' ? r.cover : {}) as Record<string, unknown>;
  const vars = (Array.isArray(r.variations) ? r.variations : [])
    .filter((v): v is Record<string, unknown> => !!v && typeof v === 'object' && typeof v.file === 'string')
    .map((v) => ({
      id: str(v.id, str(v.kind, 'version')),
      file: str(v.file),
      kind: str(v.kind, str(v.id, 'version')),
      title: typeof v.title === 'string' ? v.title : undefined,
      durationSec: typeof v.durationSec === 'number' ? v.durationSec : undefined,
      loop: validLoop(v.loop as Loop | null),
      bpm: typeof v.bpm === 'number' ? v.bpm : undefined,
      beatmap: mapId(v.beatmap),
      gainDb: typeof v.gainDb === 'number' ? v.gainDb : undefined,
      layers: cleanLayers(v.layers),
    }));
  return {
    id,
    title: str(r.title, id),
    file,
    durationSec: num(r.durationSec),
    bpm: num(r.bpm),
    key: str(r.key),
    variations: vars,
    loop: validLoop(r.loop as Loop | null),
    cover: { palette: Array.isArray(cov.palette) ? cov.palette.filter((c): c is string => typeof c === 'string') : [], motif: str(cov.motif, 'waves') },
    moods: Array.isArray(r.moods) ? r.moods.filter((m): m is string => typeof m === 'string') : [],
    gainDb: typeof r.gainDb === 'number' ? r.gainDb : undefined,
    lufs: typeof r.lufs === 'number' ? r.lufs : undefined,
    hint: typeof r.hint === 'string' ? r.hint : undefined,
    files: Array.isArray(r.files) ? r.files.filter((f): f is string => typeof f === 'string') : undefined,
    beatmap: mapId(r.beatmap),
  };
}

/** (ext) layers: [{ id, file, loop: {start, end}, gain? }] — anything malformed is dropped (never a 404 by accident) */
function cleanLayers(raw: unknown): TrackVariation['layers'] {
  if (!Array.isArray(raw)) return undefined;
  const out: NonNullable<TrackVariation['layers']> = [];
  raw.forEach((l, i) => {
    if (!l || typeof l !== 'object') return;
    const o = l as Record<string, unknown>;
    const file = str(o.file);
    const loop = validLoop(o.loop as Loop | null);
    if (!file || !loop) return;
    out.push({ id: str(o.id, String(i)), file, loop, gain: typeof o.gain === 'number' && Number.isFinite(o.gain) ? o.gain : 1 });
  });
  return out.length ? out : undefined;
}

function parseCatalog(raw: unknown): Track[] {
  const list = Array.isArray(raw) ? raw : raw && typeof raw === 'object' && Array.isArray((raw as { tracks?: unknown }).tracks) ? (raw as { tracks: unknown[] }).tracks : [];
  const seen = new Set<string>();
  const out: Track[] = [];
  for (const t of list.map(cleanTrack)) {
    if (!t || seen.has(t.id)) continue;
    seen.add(t.id);
    out.push(t);
  }
  return out;
}

let tracks: Track[] = parseCatalog(Object.values(RAW)[0]);
const devMaps = new Map<string, BeatMap>();
const mapCache = new Map<string, BeatMap | null>();

/** every song in the catalog (catalog order = Fonoteca order) */
export function catalog(): readonly Track[] {
  return tracks;
}
export function trackById(id: string) {
  return tracks.find((t) => t.id === id) ?? null;
}

/** DEV: swap the catalog at runtime (tests / headless before the MUSIC files land) */
export function setCatalog(raw: unknown, maps: Record<string, unknown> = {}) {
  tracks = parseCatalog(raw);
  mapCache.clear();
  devMaps.clear();
  for (const [id, m] of Object.entries(maps)) {
    const c = cleanBeatMap(m, id);
    if (c) devMaps.set(id, c);
  }
}

/** public URL of a music file (files live in public/music/, served next to the game) */
export function musicUrl(file: string) {
  if (/^(https?:|blob:|data:)/.test(file)) return file;
  let f = file.replace(/^\.?\//, '');
  if (!f.startsWith('music/')) f = `music/${f}`;
  const base = (import.meta.env?.BASE_URL as string | undefined) ?? './';
  return `${base.endsWith('/') ? base : `${base}/`}${f}`;
}

/** first file this browser can play (tracks may list several encodes) */
function pickFile(main: string, alts?: string[]): string {
  const all = [...(alts ?? []), main].filter(Boolean);
  if (all.length < 2 || typeof document === 'undefined') return main;
  const probe = document.createElement('audio');
  const type = (f: string) => {
    const ext = f.split('?')[0].split('.').pop()?.toLowerCase();
    return ext === 'opus' ? 'audio/ogg; codecs=opus' : ext === 'ogg' ? 'audio/ogg' : ext === 'm4a' || ext === 'aac' ? 'audio/mp4' : ext === 'webm' ? 'audio/webm' : ext === 'mp3' ? 'audio/mpeg' : '';
  };
  return all.find((f) => probe.canPlayType(type(f)) !== '') ?? main;
}

const dbToGain = (db: number) => Math.pow(10, db / 20);
/** target loudness for the trim from `lufs` (streaming-ish level, leaves headroom for SFX) */
const TARGET_LUFS = -16;
/** baseline trim for mastered songs vs. the procedural synth (which is quiet) */
const FILE_TRIM = 0.6;

/** resolve 'song' / 'song.variation' (by variation id, full id or kind) */
export function resolveTrack(ref: string): Resolved | null {
  if (!ref) return null;
  const direct = trackById(ref);
  let track = direct;
  let variation: TrackVariation | null = null;
  if (!track) {
    // full variation id anywhere ('liky_fight.ambient' or 'liky_fight_ambient')
    for (const t of tracks) {
      const v = t.variations.find((x) => x.id === ref);
      if (v) {
        track = t;
        variation = v;
        break;
      }
    }
  }
  if (!track) {
    const dot = ref.indexOf('.');
    if (dot <= 0) return null;
    track = trackById(ref.slice(0, dot));
    const key = ref.slice(dot + 1);
    if (!track) return null;
    variation = track.variations.find((v) => v.id === key || v.id === `${track!.id}.${key}` || v.id === `${track!.id}_${key}`) ?? track.variations.find((v) => v.kind === key) ?? null;
    if (!variation) return null;
  }
  // 'song.original' is the song itself
  if (variation && isOriginal(track, variation)) variation = null;
  const vkey = variation ? variationKey(track, variation) : '';
  const canon = variation ? `${track.id}.${vkey}` : track.id;
  const gainDb = variation?.gainDb ?? track.gainDb ?? (track.lufs !== undefined ? TARGET_LUFS - track.lufs : 0);
  return {
    ref: canon,
    track,
    variation,
    url: musicUrl(variation ? variation.file : pickFile(track.file, track.files)),
    durationSec: (variation ? variation.durationSec : track.durationSec) ?? track.durationSec,
    loop: variation ? (variation.loop ?? null) : track.loop,
    bpm: (variation ? variation.bpm : undefined) ?? track.bpm,
    beatmapIds: variation ? [variation.beatmap, canon, `${track.id}_${vkey}`, variation.id].filter((x): x is string => !!x) : [track.beatmap, track.id].filter((x): x is string => !!x),
    trim: FILE_TRIM * dbToGain(Math.max(-18, Math.min(6, gainDb))),
    title: variation?.title ?? (variation ? `${track.title} · ${versionsOf(track).find((v) => v.ref === canon)?.label.toLowerCase() ?? vkey}` : track.title),
    layers: (variation?.layers ?? []).map((l) => ({ id: l.id, url: musicUrl(l.file), loop: l.loop, gain: l.gain })),
  };
}

/** short key of a variation ('ambient' for 'liky_fight.ambient') */
export function variationKey(track: Track, v: TrackVariation) {
  return v.id.startsWith(`${track.id}.`) ? v.id.slice(track.id.length + 1) : v.id.startsWith(`${track.id}_`) ? v.id.slice(track.id.length + 1) : v.id;
}

/** every playable ref of a song: the original first, then its variations */
export function versionsOf(track: Track): { ref: string; label: string; kind: string }[] {
  const LABEL: Record<string, string> = {
    ambient: 'AMBIENTE',
    aftermath: 'DESPUÉS',
    explore: 'EXPLORACIÓN',
    menu_loop: 'BUCLE',
    loop: 'BUCLE',
    stinger: 'REMATE',
    calm: 'TRANQUILA',
    intro: 'INTRO',
    stem: 'STEM',
    instrumental: 'INSTRUMENTAL',
  };
  return [
    { ref: track.id, label: 'ORIGINAL', kind: 'original' },
    ...track.variations
      .filter((v) => !isOriginal(track, v))
      .map((v) => {
        const key = variationKey(track, v);
        return { ref: `${track.id}.${key}`, label: (v.title ?? LABEL[v.kind] ?? LABEL[key] ?? key).toUpperCase(), kind: v.kind };
      }),
  ];
}

/** does the catalog know this ref? */
export const hasTrack = (ref: string) => !!resolveTrack(ref);

/** beat map of a resolved track: its own map, else a grid from its tempo, else null */
export async function beatMapFor(r: Resolved): Promise<BeatMap | null> {
  for (const id of r.beatmapIds) {
    if (mapCache.has(id)) {
      const m = mapCache.get(id);
      if (m) return m;
      continue;
    }
    const dev = devMaps.get(id);
    if (dev) {
      mapCache.set(id, dev);
      return dev;
    }
    const loader = MAPS[`../data/music/beatmaps/${id}.json`];
    let map: BeatMap | null = null;
    if (loader) {
      try {
        map = cleanBeatMap(await loader(), id);
      } catch {
        map = null;
      }
    }
    mapCache.set(id, map);
    if (map) return map;
  }
  // a variation without its own map follows the song's tempo only when it has one of its own
  return gridFromTempo(r.bpm, 0, r.durationSec || 600);
}
