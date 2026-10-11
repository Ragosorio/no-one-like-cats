/**
 * Beat-grid math (pure, no Web Audio): beat maps → events, loop-aware "unwrapped" time, next bar/beat.
 *
 * Time model. A playing deck has an UNWRAPPED position u (seconds since the track's own 0, growing
 * forever while it plays) and a FILE position p = wrap(u). Without a loop p = u. With a loop
 * [start, end): the first pass plays 0 → end, then every pass replays start → end:
 *   p = u                                  for u < end
 *   p = start + ((u - start) mod (end - start))  afterwards
 * Events are defined in file time; their k-th occurrence lives at a unique unwrapped time, so a
 * cursor over unwrapped time can never fire the same occurrence twice.
 */

export interface Section {
  name: string;
  start: number;
  end: number;
  energy?: number;
}
export interface Marker {
  name: string;
  time: number;
}
/** src/data/music/beatmaps/<id>.json (MUSIC agent) */
export interface BeatMap {
  id: string;
  duration: number;
  bpm: number;
  offset: number;
  beats: number[];
  downbeats: number[];
  sections: Section[];
  markers: Marker[];
  /** optional: beats per bar when there are no downbeats (default 4) */
  beatsPerBar?: number;
  /** optional: a seamless loop the analysis found (used when the track declares none) */
  loop?: Loop | null;
  /** optional: choreography hits (MUSIC's analysis: kick/snare/stab/phrase…) → 'hit' events */
  hits?: Hit[];
  /** optional: where a voice sings → 'voice:start' / 'voice:end' events */
  voice?: { start: number; end: number }[];
}
export interface Hit {
  time: number;
  strength: number;
  kind: string;
}
export interface Loop {
  start: number;
  end: number;
}

export type GridKind = 'beat' | 'bar' | 'section' | 'marker' | 'hit' | 'voice';
export interface GridEvent {
  /** file time (s) */
  t: number;
  type: GridKind;
  name?: string;
  /** beat index in the file (0-based) */
  beat?: number;
  /** bar index in the file (0-based) */
  bar?: number;
  /** hits: 0..1 */
  strength?: number;
}
export interface Occurrence {
  e: GridEvent;
  /** unwrapped time of this occurrence */
  u: number;
}

const ORDER: Record<GridKind, number> = { section: 0, marker: 1, voice: 2, bar: 3, beat: 4, hit: 5 };
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** a beat map from loose JSON (missing arrays → empty, unsorted → sorted, junk → dropped) */
export function cleanBeatMap(raw: unknown, id = ''): BeatMap | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const nums = (v: unknown) => (Array.isArray(v) ? v.filter(finite).filter((x) => x >= 0).sort((a, b) => a - b) : []);
  const sections = (Array.isArray(r.sections) ? r.sections : [])
    .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
    .filter((s) => typeof s.name === 'string' && finite(s.start))
    .map((s) => ({ name: String(s.name), start: Number(s.start), end: finite(s.end) ? Number(s.end) : Infinity, energy: finite(s.energy) ? Number(s.energy) : undefined }))
    .sort((a, b) => a.start - b.start);
  const markers = (Array.isArray(r.markers) ? r.markers : [])
    .filter((m): m is Record<string, unknown> => !!m && typeof m === 'object')
    .filter((m) => typeof m.name === 'string' && finite(m.time))
    .map((m) => ({ name: String(m.name), time: Number(m.time) }))
    .sort((a, b) => a.time - b.time);
  return {
    id: typeof r.id === 'string' ? r.id : id,
    duration: finite(r.duration) ? r.duration : 0,
    bpm: finite(r.bpm) ? r.bpm : 0,
    offset: finite(r.offset) ? r.offset : 0,
    beats: nums(r.beats),
    downbeats: nums(r.downbeats),
    sections,
    markers,
    beatsPerBar: finite(r.beatsPerBar) && r.beatsPerBar > 0 ? Math.round(r.beatsPerBar) : undefined,
    loop: validLoop(r.loop as Loop | null),
    hits: (Array.isArray(r.hits) ? r.hits : [])
      .filter((h): h is Record<string, unknown> => !!h && typeof h === 'object' && finite(h.time) && h.time >= 0)
      .map((h) => ({ time: Number(h.time), strength: finite(h.strength) ? Math.max(0, Math.min(1, h.strength)) : 1, kind: typeof h.kind === 'string' ? h.kind : 'hit' }))
      .sort((a, b) => a.time - b.time),
    voice: (Array.isArray(r.voice) ? r.voice : [])
      .filter((v): v is Record<string, unknown> => !!v && typeof v === 'object' && finite(v.start) && finite(v.end) && v.end > v.start)
      .map((v) => ({ start: Number(v.start), end: Number(v.end) }))
      .sort((a, b) => a.start - b.start),
  };
}

/** a synthetic map from a tempo (tracks without a beat map yet) */
export function gridFromTempo(bpm: number, offset: number, duration: number, beatsPerBar = 4): BeatMap | null {
  if (!(bpm > 0) || !(duration > 0)) return null;
  const spb = 60 / bpm;
  const beats: number[] = [];
  const downbeats: number[] = [];
  for (let i = 0, t = Math.max(0, offset); t < duration; i++, t = offset + i * spb) {
    beats.push(t);
    if (i % beatsPerBar === 0) downbeats.push(t);
  }
  return { id: '', duration, bpm, offset, beats, downbeats, sections: [], markers: [], beatsPerBar };
}

/** every event of a map, sorted by time (ties: section, marker, bar, beat) */
export function buildEvents(map: BeatMap | null): GridEvent[] {
  if (!map) return [];
  const ev: GridEvent[] = [];
  let downs = map.downbeats;
  if (!downs.length && map.beats.length) {
    const per = map.beatsPerBar ?? 4;
    downs = map.beats.filter((_, i) => i % per === 0);
  }
  map.beats.forEach((t, i) => ev.push({ t, type: 'beat', beat: i }));
  downs.forEach((t, i) => ev.push({ t, type: 'bar', bar: i }));
  for (const s of map.sections) ev.push({ t: s.start, type: 'section', name: s.name });
  for (const m of map.markers) ev.push({ t: m.time, type: 'marker', name: m.name });
  for (const h of map.hits ?? []) ev.push({ t: h.time, type: 'hit', name: h.kind, strength: h.strength });
  for (const v of map.voice ?? []) ev.push({ t: v.start, type: 'voice', name: 'start' }, { t: v.end, type: 'voice', name: 'end' });
  ev.sort((a, b) => a.t - b.t || ORDER[a.type] - ORDER[b.type]);
  // a beat knows its bar and a bar knows the beat it lands on (±20 ms tolerance) — handy for listeners
  const lastAtOrBefore = (arr: number[], t: number) => {
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid] <= t + 0.02) lo = mid + 1;
      else hi = mid;
    }
    return lo - 1;
  };
  for (const e of ev) {
    if (e.type === 'beat') e.bar = Math.max(0, lastAtOrBefore(downs, e.t));
    else if (e.type === 'bar') e.beat = Math.max(0, lastAtOrBefore(map.beats, e.t));
  }
  return ev;
}

/** first index with events[i].t > x (events sorted) */
function upper(events: GridEvent[], x: number) {
  let lo = 0;
  let hi = events.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (events[mid].t > x) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

/** a usable loop (end > start + 0.05) or null */
export function validLoop(loop: Loop | null | undefined): Loop | null {
  if (!loop || !finite(loop.start) || !finite(loop.end)) return null;
  if (loop.start < 0 || loop.end <= loop.start + 0.05) return null;
  return { start: loop.start, end: loop.end };
}

/** unwrapped → file position */
export function wrapPos(u: number, loop: Loop | null): number {
  const L = validLoop(loop);
  if (!L || u < L.end) return u;
  const P = L.end - L.start;
  return L.start + ((((u - L.start) % P) + P) % P);
}

/**
 * Every occurrence of `events` whose unwrapped time is in (a, b], in time order.
 * `maxIter` bounds the loop passes scanned (a huge window must not spin).
 */
export function occurrences(events: GridEvent[], a: number, b: number, loop: Loop | null, maxIter = 4096): Occurrence[] {
  const out: Occurrence[] = [];
  if (!(b > a) || !events.length) return out;
  const L = validLoop(loop);
  // first pass (or the whole track without a loop)
  const firstEnd = L ? L.end : Infinity;
  for (let i = upper(events, a); i < events.length; i++) {
    const t = events[i].t;
    if (t > b || t >= firstEnd) break;
    out.push({ e: events[i], u: t });
  }
  if (!L || b < L.end) return out;
  const P = L.end - L.start;
  // pass n ≥ 1 covers unwrapped [end + (n-1)P, end + nP) ↔ file [start, end)
  let n = Math.max(1, Math.floor((a - L.end) / P) + 1);
  for (let k = 0; k < maxIter; k++, n++) {
    const base = L.end + (n - 1) * P - L.start;
    if (base + L.start > b) break;
    // file times t in [start, end) with a < base + t ≤ b
    for (let i = upper(events, Math.max(a - base, L.start - 1e-12)); i < events.length; i++) {
      const t = events[i].t;
      if (t < L.start) continue;
      if (t >= L.end || base + t > b) break;
      out.push({ e: events[i], u: base + t });
    }
  }
  return out;
}

/**
 * The next bar (downbeat) or beat at or after `u + lead`, as UNWRAPPED time — where a quantized
 * transition should land. Null when the grid has no such points (caller switches 'now').
 * `horizon` caps the search (default 32 s).
 */
export function nextGridTime(events: GridEvent[], u: number, kind: 'bar' | 'beat', loop: Loop | null, lead = 0.05, horizon = 32): number | null {
  const from = u + lead;
  const occ = occurrences(events, from - 1e-6, from + horizon, loop);
  for (const o of occ) if (o.e.type === kind && o.u >= from - 1e-6) return o.u;
  return null;
}

/** the section that contains file position p (null when the map has none) */
export function sectionAt(map: BeatMap | null, p: number): Section | null {
  if (!map) return null;
  let cur: Section | null = null;
  for (const s of map.sections) {
    if (s.start <= p + 1e-6) cur = s;
    else break;
  }
  return cur;
}
