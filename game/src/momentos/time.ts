/**
 * Musical time for Momentos (pure; tests/momentos.test.ts). Resolves `When` addresses on a beat map, expands `each`
 * specs (hits / beats / bars), and maps song time ↔ momento time through the EDIT (segments played back to back).
 *
 * All six original songs sit on an exact constant grid starting at 0 (docs/part-ii/18 §1.1), so a bar is
 * `downbeats[i]` and a beat offset is `k · 60/bpm` — no tempo maps needed.
 */
import type { BeatMap, Hit } from '../audio/beatgrid';
import type { EachSpec, EditSegment, HitFilter, Onset, OnsetFilter, OnsetMap, OnsetTrack, Segment, When } from './types';

export const spb = (map: BeatMap) => (map.bpm > 0 ? 60 / map.bpm : 0.5);
export const bpb = (map: BeatMap) => map.beatsPerBar ?? 4;
export const spBar = (map: BeatMap) => spb(map) * bpb(map);

/** downbeat of absolute bar i (extrapolated past the map's ends) */
export function barTime(map: BeatMap, i: number): number {
  const d = map.downbeats;
  const whole = Math.floor(i);
  const frac = i - whole;
  let t: number;
  if (d.length && whole >= 0 && whole < d.length) t = d[whole];
  else if (d.length) t = whole < 0 ? d[0] + whole * spBar(map) : d[d.length - 1] + (whole - d.length + 1) * spBar(map);
  else t = map.offset + whole * spBar(map);
  return t + frac * spBar(map);
}
/** the bar index whose downbeat is at or before t (fractional = position inside the bar) */
export function barAt(map: BeatMap, t: number): number {
  const d = map.downbeats;
  if (!d.length) return (t - map.offset) / spBar(map);
  let lo = 0;
  let hi = d.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (d[mid] <= t + 1e-6) lo = mid + 1;
    else hi = mid;
  }
  const i = Math.max(0, lo - 1);
  return i + (t - d[i]) / spBar(map);
}
/** t is on a bar line (±tol s) */
export function onBar(map: BeatMap, t: number, tol = 0.012): boolean {
  const b = barAt(map, t);
  const near = Math.round(b);
  return Math.abs(barTime(map, near) - t) <= tol;
}

function named(map: BeatMap, name: string): number | null {
  const s = map.sections.find((x) => x.name === name);
  if (s) return s.start;
  const m = map.markers.find((x) => x.name === name);
  return m ? m.time : null;
}

const STR = /^([A-Za-z_][\w]*|#\d+(?::\d+(?:\.\d+)?)?)(?:([+-])(\d+(?:\.\d+)?)(?::(\d+(?:\.\d+)?))?)?$/;

/** resolve a When to song seconds; null (+ a reason) when it names nothing */
export function resolveWhen(map: BeatMap, w: When): number | null {
  if (typeof w === 'number') return Number.isFinite(w) ? w : null;
  if (typeof w === 'string') {
    const s = w.trim();
    const m = STR.exec(s);
    if (!m) return null;
    let base: number | null;
    if (m[1].startsWith('#')) {
      const [bar, beat] = m[1].slice(1).split(':');
      base = barTime(map, Number(bar)) + (beat ? Number(beat) * spb(map) : 0);
    } else base = named(map, m[1]);
    if (base === null) return null;
    if (m[2]) {
      const sign = m[2] === '-' ? -1 : 1;
      const bars = Number(m[3] ?? 0);
      const beats = Number(m[4] ?? 0);
      base += sign * (bars * spBar(map) + beats * spb(map));
    }
    return base;
  }
  if (!w || typeof w !== 'object') return null;
  let base: number | null = null;
  if (w.section !== undefined) base = map.sections.find((x) => x.name === w.section)?.start ?? null;
  else if (w.marker !== undefined) base = map.markers.find((x) => x.name === w.marker)?.time ?? null;
  else if (w.t !== undefined) base = w.t;
  else if (w.bar !== undefined) return barTime(map, w.bar) + (w.beat ?? 0) * spb(map) + (w.bars ?? 0) * spBar(map) + (w.beats ?? 0) * spb(map) + (w.sec ?? 0);
  if (base === null || !Number.isFinite(base)) return null;
  const relBar = w.section !== undefined || w.marker !== undefined || w.t !== undefined ? (w.bar ?? 0) : 0;
  return base + (relBar + (w.bars ?? 0)) * spBar(map) + ((w.beat ?? 0) + (w.beats ?? 0)) * spb(map) + (w.sec ?? 0);
}

/** a section name or a [from, to) pair → song range */
export function resolveRange(map: BeatMap, r: string | [When, When]): [number, number] | null {
  if (typeof r === 'string') {
    const s = map.sections.find((x) => x.name === r);
    if (!s) return null;
    return [s.start, Number.isFinite(s.end) ? s.end : map.duration];
  }
  const a = resolveWhen(map, r[0]);
  const b = resolveWhen(map, r[1]);
  return a === null || b === null ? null : [a, b];
}

/**
 * Choreography hits: MUSIC's own (LIKY FIGHT has 382), else synthesized from the grid so every song can be authored
 * the same way (downbeats = kick 0.7 / every 4th 'phrase' 0.85, beat 3 = snare 0.5, energy jumps = drop 1.0,
 * big_hit markers = phrase 1.0, silences = stop 0.9 + reentry at silence_n_end).
 */
export function songHits(map: BeatMap): Hit[] {
  if (map.hits?.length) return map.hits;
  const out: Hit[] = [];
  const per = bpb(map);
  const downs = map.downbeats.length ? map.downbeats : map.beats.filter((_, i) => i % per === 0);
  downs.forEach((t, i) => out.push({ time: t, strength: i % 4 === 0 ? 0.85 : 0.7, kind: i % 4 === 0 ? 'phrase' : 'kick' }));
  for (const t of map.beats) {
    const k = Math.round((barAt(map, t) % 1) * per);
    if (k === 2) out.push({ time: t, strength: 0.5, kind: 'snare' });
  }
  for (let i = 1; i < map.sections.length; i++) {
    const s = map.sections[i];
    const prev = map.sections[i - 1];
    if ((s.energy ?? 0) >= 0.75 && (prev.energy ?? 1) <= 0.72) out.push({ time: s.start, strength: 1, kind: 'drop' });
  }
  for (const m of map.markers) {
    if (/^big_hit/.test(m.name)) out.push({ time: m.time, strength: 1, kind: 'phrase' });
    else if (/^silence_\d+$/.test(m.name)) out.push({ time: m.time, strength: 0.9, kind: 'stop' });
    else if (/^silence_\d+_end$/.test(m.name)) out.push({ time: m.time, strength: 0.9, kind: 'reentry' });
  }
  out.sort((a, b) => a.time - b.time);
  const merged: Hit[] = [];
  for (const h of out) {
    const last = merged[merged.length - 1];
    if (last && Math.abs(last.time - h.time) < 0.03) {
      if (h.strength > last.strength) Object.assign(last, h);
      continue;
    }
    merged.push({ ...h });
  }
  return merged;
}

/** the hits a filter selects, in time order */
export function selectHits(map: BeatMap, f: HitFilter): Hit[] {
  const range = f.in ? resolveRange(map, f.in) : [0, map.duration];
  if (!range) return [];
  const kinds = f.kind === undefined ? null : new Set(Array.isArray(f.kind) ? f.kind : [f.kind]);
  const except = (f.except ?? []).map((w) => resolveWhen(map, w)).filter((x): x is number => x !== null);
  const out: Hit[] = [];
  let n = 0;
  let last = -Infinity;
  for (const h of songHits(map)) {
    if (h.time < range[0] - 1e-6 || h.time >= range[1] - 1e-6) continue;
    if (kinds && !kinds.has(h.kind)) continue;
    if (f.min !== undefined && h.strength < f.min) continue;
    if (f.max !== undefined && h.strength > f.max) continue;
    if (except.some((x) => Math.abs(x - h.time) < 0.04)) continue;
    if (f.minGap !== undefined && h.time - last < f.minGap - 1e-6) continue;
    n++;
    if ((f.every ?? 1) > 1 && (n - 1) % (f.every ?? 1) !== 0) continue;
    out.push(h);
    last = h.time;
    if (f.limit !== undefined && out.length >= f.limit) break;
  }
  return out;
}

/** an onset track as objects (bass rows carry length + pitch) */
export function onsetList(om: OnsetMap | null | undefined, track: OnsetTrack): Onset[] {
  const rows = om?.tracks?.[track];
  if (!rows) return [];
  return rows.map((r) => (track === 'bass' ? { t: Number(r[0]), dur: Number(r[1]), midi: r[2] === null ? null : Number(r[2]), strength: Number(r[3] ?? 0.5) } : { t: Number(r[0]), strength: Number(r[1] ?? 0.5) }));
}
/** the onsets a filter selects, in time order */
export function selectOnsets(map: BeatMap, om: OnsetMap | null | undefined, f: OnsetFilter): Onset[] {
  const range = f.in ? resolveRange(map, f.in) : [0, map.duration];
  if (!range) return [];
  const except = (f.except ?? []).map((w) => resolveWhen(map, w)).filter((x): x is number => x !== null);
  const out: Onset[] = [];
  let n = 0;
  let last = -Infinity;
  for (const o of onsetList(om, f.track)) {
    if (o.t < range[0] - 1e-6 || o.t >= range[1] - 1e-6) continue;
    if (f.min !== undefined && o.strength < f.min) continue;
    if (f.max !== undefined && o.strength > f.max) continue;
    if (except.some((x) => Math.abs(x - o.t) < 0.04)) continue;
    if (f.minGap !== undefined && o.t - last < f.minGap - 1e-6) continue;
    n++;
    if ((f.every ?? 1) > 1 && (n - 1) % (f.every ?? 1) !== 0) continue;
    out.push(o);
    last = o.t;
    if (f.limit !== undefined && out.length >= f.limit) break;
  }
  return out;
}

/** an `each` spec → song times (+ the hit / onset that produced it) */
export function expandEach(map: BeatMap, e: EachSpec, om?: OnsetMap | null): { t: number; hit?: Hit; onset?: Onset & { track: OnsetTrack } }[] {
  if ('onsets' in e) return selectOnsets(map, om, e.onsets).map((o) => ({ t: o.t, onset: { ...o, track: e.onsets.track } }));
  if ('hits' in e) return selectHits(map, e.hits).map((h) => ({ t: h.time, hit: h }));
  if ('times' in e) return e.times.map((w) => resolveWhen(map, w)).filter((t): t is number => t !== null).map((t) => ({ t }));
  const spec = 'beats' in e ? e.beats : e.bars;
  const range = resolveRange(map, spec.in);
  if (!range) return [];
  const step = ('beats' in e ? spb(map) : spBar(map)) * Math.max(1, spec.every ?? 1);
  const off = (spec.offset ?? 0) * ('beats' in e ? spb(map) : spBar(map));
  const out: { t: number }[] = [];
  // index-based (no float drift): a grid point within 20 ms of the range end belongs to the next range
  for (let i = 0; i < 10000; i++) {
    const t = range[0] + off + i * step;
    if (t >= range[1] - 0.02) break;
    out.push({ t });
  }
  return out;
}

// ------------------------------------------------------------------ the edit
/** resolve the edit list into back-to-back segments (song → momento time) */
export function resolveEdit(map: BeatMap, edit: EditSegment[] | undefined, warn: (w: string) => void): Segment[] {
  const list = edit?.length ? edit : [{ from: 0, to: map.duration }];
  const out: Segment[] = [];
  let m = 0;
  list.forEach((s, i) => {
    const from = resolveWhen(map, s.from);
    const to = resolveWhen(map, s.to);
    if (from === null || to === null || !(to > from)) {
      warn(`edit[${i}]: no se resuelve (${JSON.stringify(s)})`);
      return;
    }
    if (i > 0 && !onBar(map, from)) warn(`edit[${i}].from ${from.toFixed(3)} no cae en un compás`);
    if (i < list.length - 1 && !onBar(map, to)) warn(`edit[${i}].to ${to.toFixed(3)} no cae en un compás`);
    out.push({ from, to, m0: m });
    m += to - from;
  });
  return out;
}
/** song time → momento time (segment `seg` if given, else the first segment that contains t) */
export function songToM(segs: Segment[], t: number, seg?: number): number | null {
  if (seg !== undefined) {
    const s = segs[seg];
    return s && t >= s.from - 0.5 && t <= s.to + 0.5 ? s.m0 + (t - s.from) : null;
  }
  for (const s of segs) if (t >= s.from - 1e-6 && t <= s.to + 1e-6) return s.m0 + (t - s.from);
  // a little before the first segment (prompt lead-ins, a pre-roll) still maps
  const f = segs[0];
  if (f && t < f.from && t > f.from - 4) return f.m0 + (t - f.from);
  return null;
}
/** momento time → { song time, segment index } (clamped into the edit) */
export function mToSong(segs: Segment[], m: number): { t: number; seg: number } {
  if (!segs.length) return { t: m, seg: 0 };
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = segs[i];
    if (m >= s.m0 - 1e-9 || i === 0) return { t: s.from + (m - s.m0), seg: i };
  }
  return { t: m, seg: 0 };
}
export const editLength = (segs: Segment[]) => (segs.length ? segs[segs.length - 1].m0 + (segs[segs.length - 1].to - segs[segs.length - 1].from) : 0);
