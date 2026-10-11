/**
 * Battle-music timeline math (pure; tests/battleMusic.test.ts). Works in the audio engine's UNWRAPPED time u
 * (seconds since the song's own 0, growing forever while it loops — src/audio/beatgrid.ts header).
 *
 *  - choreoHits: MUSIC's choreography hits (LIKY FIGHT has 382), or hits synthesized from the grid for songs
 *    without them (downbeats, phrase starts, energy jumps = 'drop', big_hit markers, silences = 'stop')
 *  - Cursor: delivers the timeline's events once each, in order; late beats/bars/hits are SKIPPED by one rule
 *  - chooseSlot: where an enemy impact should land (next suitable hit, capped delay, batching, flight stretch)
 *  - sincroJudge: is a release inside a SINCRO window (latency + the player's rhythm offset)
 */
import { BeatMap, GridEvent, Hit, Loop, Section, buildEvents, occurrences, validLoop, wrapPos } from '../../audio/beatgrid';
import type { ExtraHit, SincroCfg, SyncCfg } from './plan';

export const secPerBeat = (map: BeatMap) => (map.bpm > 0 ? 60 / map.bpm : 0.5);
export const secPerBar = (map: BeatMap) => secPerBeat(map) * (map.beatsPerBar ?? 4);

/** the section containing file position p */
export function sectionAtFile(map: BeatMap, p: number): Section | null {
  let cur: Section | null = null;
  for (const s of map.sections) {
    if (s.start <= p + 1e-6) cur = s;
    else break;
  }
  return cur;
}
/** a section or marker name → file time (sections first) */
export function timeOfName(map: BeatMap, name: string): number | null {
  const s = map.sections.find((x) => x.name === name);
  if (s) return s.start;
  const m = map.markers.find((x) => x.name === name);
  return m ? m.time : null;
}

/**
 * Choreography hits of a song. MUSIC's own `hits` win; otherwise they are derived from the grid so every song with a
 * beat map can drive a battle: downbeats (kick 0.7, every 4th bar 'phrase' 0.85), beat 3 (snare 0.5), section starts
 * whose energy jumps (≥ 0.75 after ≤ 0.72: 'drop' 1.0), big_hit markers ('phrase' 1.0), silence markers ('stop' 0.9).
 * A plan may add its own (extraHits). Same-time hits merge (strongest wins; drop/stop/reentry kinds win ties).
 */
export function choreoHits(map: BeatMap, extra: ExtraHit[] = []): Hit[] {
  const out: Hit[] = [];
  if (map.hits?.length) out.push(...map.hits);
  else {
    const per = map.beatsPerBar ?? 4;
    const downs = map.downbeats.length ? map.downbeats : map.beats.filter((_, i) => i % per === 0);
    downs.forEach((t, i) => out.push({ time: t, strength: i % 4 === 0 ? 0.85 : 0.7, kind: i % 4 === 0 ? 'phrase' : 'kick' }));
    const downSet = downs;
    let di = 0;
    for (let i = 0; i < map.beats.length; i++) {
      const t = map.beats[i];
      while (di + 1 < downSet.length && downSet[di + 1] <= t + 0.02) di++;
      const k = Math.round((t - (downSet[di] ?? 0)) / secPerBeat(map));
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
    }
  }
  for (const h of extra) out.push({ time: h.time, strength: h.strength, kind: h.kind });
  out.sort((a, b) => a.time - b.time);
  const PRIO: Record<string, number> = { drop: 3, stop: 3, reentry: 3, build: 2, shout: 2, phrase: 1 };
  const merged: Hit[] = [];
  for (const h of out) {
    const last = merged[merged.length - 1];
    if (last && Math.abs(h.time - last.time) < 0.03) {
      if ((PRIO[h.kind] ?? 0) > (PRIO[last.kind] ?? 0)) last.kind = h.kind;
      last.strength = Math.max(last.strength, h.strength);
      continue;
    }
    merged.push({ ...h });
  }
  return merged;
}

/** the event list a battle follows: beats, bars, sections, markers + the choreography hits */
export function battleEvents(map: BeatMap, extra: ExtraHit[] = []): GridEvent[] {
  return buildEvents({ ...map, hits: choreoHits(map, extra) });
}

export interface TimedHit {
  /** unwrapped time */
  u: number;
  /** file time */
  t: number;
  strength: number;
  kind: string;
  energy: number;
  section: string | null;
}

/** hits whose unwrapped time is in (a, b] */
export function hitsBetween(events: GridEvent[], map: BeatMap, loop: Loop | null, a: number, b: number): TimedHit[] {
  const out: TimedHit[] = [];
  for (const o of occurrences(events, a, b, loop)) {
    if (o.e.type !== 'hit') continue;
    const sec = sectionAtFile(map, o.e.t);
    out.push({ u: o.u, t: o.e.t, strength: o.e.strength ?? 1, kind: o.e.name ?? 'hit', energy: sec?.energy ?? 0.5, section: sec?.name ?? null });
  }
  return out;
}
/** strength a bare downbeat gets as a landing spot (LIKY's kick is on every beat; a bar line is always musical) */
export const BAR_SPOT = 0.65;
/**
 * Where an enemy impact may land: the choreography hits plus every downbeat (a bar line is always a musical place
 * to hit, even where the analysis kept no accent). Same time (±30 ms) → the stronger one.
 */
export function landingSpots(events: GridEvent[], map: BeatMap, loop: Loop | null, a: number, b: number): TimedHit[] {
  const out: TimedHit[] = [];
  for (const o of occurrences(events, a, b, loop)) {
    if (o.e.type !== 'hit' && o.e.type !== 'bar') continue;
    const sec = sectionAtFile(map, o.e.t);
    const h: TimedHit = { u: o.u, t: o.e.t, strength: o.e.type === 'bar' ? BAR_SPOT : o.e.strength ?? 1, kind: o.e.type === 'bar' ? 'bar' : o.e.name ?? 'hit', energy: sec?.energy ?? 0.5, section: sec?.name ?? null };
    const last = out[out.length - 1];
    if (last && Math.abs(last.u - h.u) < 0.03) {
      if (h.strength > last.strength) out[out.length - 1] = { ...h, kind: h.kind === 'bar' ? last.kind : h.kind };
      continue;
    }
    out.push(h);
  }
  return out;
}

/** the next downbeat at or after u (unwrapped), null when none in 8 s */
export function nextBar(events: GridEvent[], loop: Loop | null, u: number, lead = 0): number | null {
  for (const o of occurrences(events, u + lead - 1e-6, u + lead + 8, loop)) if (o.e.type === 'bar') return o.u;
  return null;
}

// ------------------------------------------------------------------ the cursor
export interface Delivered {
  e: GridEvent;
  u: number;
  /** seconds after it became audible */
  late: number;
}
/**
 * Delivers every occurrence once, in order, as the heard position advances (the same contract as the engine's
 * BeatScheduler, so audio-on and audio-off battles behave alike):
 *  - beat / bar / hit later than `lateSkip` → skipped (counted) · section: only the latest crossed · marker: all
 *  - time going backwards or a jump (a section change, a re-cue) → `reset(u)`: nothing in between is delivered
 */
export class Cursor {
  firedUpTo: number;
  stats = { fired: 0, skipped: 0, resets: 0 };
  constructor(
    public events: GridEvent[],
    public loop: Loop | null,
    startU: number,
    public lateSkip = 0.12,
    public lookahead = 0.016,
  ) {
    this.firedUpTo = startU - 1e-6;
  }
  reset(u: number, events?: GridEvent[], loop?: Loop | null) {
    if (events) this.events = events;
    if (loop !== undefined) this.loop = loop;
    this.firedUpTo = u - 1e-6;
    this.stats.resets++;
  }
  advance(u: number, maxScan = 30): Delivered[] {
    const b = u + this.lookahead;
    if (!(b > this.firedUpTo)) return [];
    let a = this.firedUpTo;
    if (b - a > maxScan) a = b - maxScan;
    this.firedUpTo = b;
    const occ = occurrences(this.events, a, b, this.loop);
    let lastSection = -1;
    for (let i = 0; i < occ.length; i++) if (occ[i].e.type === 'section') lastSection = i;
    const out: Delivered[] = [];
    for (let i = 0; i < occ.length; i++) {
      const { e, u: ue } = occ[i];
      const late = Math.max(0, u - ue);
      if ((e.type === 'beat' || e.type === 'bar' || e.type === 'hit' || e.type === 'voice') && late > this.lateSkip) {
        this.stats.skipped++;
        continue;
      }
      if (e.type === 'section' && i !== lastSection) {
        this.stats.skipped++;
        continue;
      }
      this.stats.fired++;
      out.push({ e, u: ue, late });
    }
    return out;
  }
}

// ------------------------------------------------------------------ enemy impact slots
export interface SlotQuery {
  /** heard position now (unwrapped) */
  now: number;
  /** natural flight time to the first impact (s, real time) */
  flight: number;
  /** upcoming hits (sorted) */
  hits: TimedHit[];
  spb: number;
  bar: number;
  cfg: SyncCfg;
  /** the battle's first enemy cat shot */
  first?: boolean;
  /** the previous slot of this volley (gap / batch rules) */
  prev?: { u: number; n: number } | null;
  /** no target later than this (a pending section jump) */
  horizon?: number;
}
export interface Slot {
  hit: TimedHit;
  /** when to release (unwrapped) — ≥ now */
  release: number;
  /** flight playback rate (natural duration / scheduled duration) */
  rate: number;
  /** delay added before the release (s) */
  delay: number;
  /** shares its hit with the previous impact */
  batched: boolean;
}

/**
 * Where an enemy impact lands. The release may wait (≤ maxDelayBars, firstMove: its own cap) and the flight may be
 * stretched within cfg.stretch so the impact falls exactly on the hit. Later hits of the same volley keep ≥ minGap
 * beats apart, unless they BATCH on a strong hit (≤ batchMax impacts). Scored: strength − 0.15 per beat waited.
 * Null = nothing suitable (release now, unsynced).
 */
export function chooseSlot(q: SlotQuery): Slot | null {
  const { cfg } = q;
  const D = Math.max(0.05, q.flight);
  const minDur = D * cfg.stretch[0];
  const maxDur = D * cfg.stretch[1];
  const capBars = q.first ? Math.max(cfg.maxDelayBars, cfg.firstMove.maxDelayBars) : cfg.maxDelayBars;
  const latest = q.now + D + capBars * q.bar;
  const earliest = q.now + minDur;
  let best: { h: TimedHit; score: number; batched: boolean } | null = null;
  const firstWanted = (h: TimedHit) => cfg.firstMove.kinds.includes(h.kind) || h.strength >= cfg.firstMove.minStrength;
  for (const h of q.hits) {
    if (h.u < earliest - 1e-6) continue;
    if (h.u > latest + 1e-6 || (q.horizon !== undefined && h.u > q.horizon)) break;
    if (h.strength < cfg.minStrength) continue;
    let batched = false;
    if (q.prev) {
      const same = Math.abs(h.u - q.prev.u) < 0.03;
      if (same) {
        if (h.strength < cfg.strongStrength || q.prev.n >= cfg.batchMax) continue;
        batched = true;
      } else if (h.u < q.prev.u + cfg.minGapBeats * q.spb - 0.02) continue;
    }
    const waitBeats = Math.max(0, h.u - (q.now + D)) / q.spb;
    let score = h.strength - 0.15 * waitBeats;
    if (q.first && firstWanted(h)) score += 1; // the first big move wants a big hit
    if (batched) score += 0.1;
    if (!best || score > best.score + 1e-9) best = { h, score, batched };
  }
  if (!best) return null;
  const h = best.h;
  const until = h.u - q.now;
  let dur = D;
  let release = h.u - D;
  if (until <= maxDur) {
    // release now, stretch the flight to land on it
    dur = Math.max(minDur, until);
    release = q.now;
  }
  return { hit: h, release: Math.max(q.now, release), rate: D / dur, delay: Math.max(0, release - q.now), batched: best.batched };
}

// ------------------------------------------------------------------ SINCRO windows
export interface SincroQuery {
  /** heard position at the moment of the check (unwrapped) */
  heardU: number;
  /** how long ago the input happened (s): pointer event → this check */
  inputLag: number;
  /** player's rhythm offset (ms, + = the sound reaches them later) */
  offsetMs: number;
  /** hits around that time */
  hits: TimedHit[];
  cfg: SincroCfg;
}
export const opensWindow = (h: TimedHit, cfg: SincroCfg) => h.strength >= cfg.minStrength || cfg.kinds.includes(h.kind);
/**
 * The input's musical time = what was heard when it happened, minus the player's own lag (rhythm offset). It is
 * SINCRO when a window-opening hit is within ±windowMs. Returns the hit and the signed error (s, + = late).
 */
export function sincroJudge(q: SincroQuery): { hit: TimedHit; delta: number } | null {
  const u = q.heardU - q.inputLag - q.offsetMs / 1000;
  const w = q.cfg.windowMs / 1000;
  let best: { hit: TimedHit; delta: number } | null = null;
  for (const h of q.hits) {
    if (!opensWindow(h, q.cfg)) continue;
    const d = u - h.u;
    if (Math.abs(d) <= w + 1e-9 && (!best || Math.abs(d) < Math.abs(best.delta))) best = { hit: h, delta: d };
  }
  return best;
}

/** file position of an unwrapped time on a loop (re-export for the clock) */
export const filePos = (u: number, loop: Loop | null) => wrapPos(u, loop);
export { validLoop };
