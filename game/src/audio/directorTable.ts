/**
 * Director resolution (pure): which music a state means, given the table (src/data/music/director.json),
 * the catalog, the player's Fonoteca choice and any active cue. No Web Audio here — tests run it in node.
 *
 * Priority (highest first):
 *   1. listen   the Fonoteca is playing something the player picked (panel open)
 *   2. cue      a scene/narrative cue (audioApi.cue) — overrides everything below
 *   3. island   the player's «Música de la isla» (Fonoteca), only in state 'island', only Part II
 *   4. table    partII[state] (+ contexts) → first available track, else its procedural mood
 * Part I (save not past H30): partI[state] → procedural mood, exactly the old behaviour.
 */
import type { MusicState, CueOpts } from './api';
import type { Mood } from '../core/music';
import type { Quantize } from './player';

export interface StateEntry {
  tracks?: string[];
  pick?: 'first' | 'rotate' | 'random';
  procedural?: Mood;
  silence?: boolean;
  fade?: number;
  quantize?: Quantize;
  loop?: boolean;
  sync?: boolean;
  section?: string;
  /** ambience bed this state brings (only when the entry names one) */
  ambience?: string;
  /** a stinger played when ENTERING this state */
  stinger?: string;
  /** states whose music is likely next (prefetched) */
  prefetch?: string[];
}
export interface DirectorTable {
  defaults: { fade: number; quantize: Quantize; loop: boolean };
  partI: Partial<Record<string, Mood>>;
  partII: Partial<Record<string, StateEntry>>;
  contexts: Record<string, StateEntry>;
  moodToState: Partial<Record<Mood, MusicState>>;
  stingers: Record<string, { procedural?: string; file?: string; gain?: number }>;
  ambienceFiles: Record<string, string>;
}

export type Target =
  | { kind: 'silence'; fade: number; source: 'state' | 'partI' }
  | { kind: 'procedural'; mood: Mood; fade: number; source: 'state' | 'partI' }
  | {
      kind: 'track';
      ref: string;
      fade: number;
      quantize: Quantize;
      loop: boolean;
      sync: boolean;
      section?: string;
      /** a cue's start position in the file (s): CueOpts.at */
      at?: number;
      source: 'listen' | 'cue' | 'island' | 'state';
    };

export interface DirectorInput {
  state: MusicState;
  context?: string;
  partII: boolean;
  /** does the catalog have this ref (and its file)? */
  has: (ref: string) => boolean;
  islandTrack?: string | null;
  cue?: { ref: string; opts: CueOpts & { sync?: boolean } } | null;
  listen?: { ref: string; loop?: boolean } | null;
  /** rotation counter for pick:'rotate' */
  rotation?: number;
  /** 0..1 random source for pick:'random' */
  random?: () => number;
}

const MOODS: Mood[] = ['island', 'battle', 'tension', 'boss', 'silence'];
const isMood = (m: unknown): m is Mood => typeof m === 'string' && (MOODS as string[]).includes(m);

/** a table from loose JSON (unknown keys ignored, bad values → defaults) */
export function cleanTable(raw: unknown): DirectorTable {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
  const d = obj(r.defaults);
  const q = (v: unknown): Quantize | undefined => (v === 'bar' || v === 'beat' || v === 'now' ? v : undefined);
  const entry = (v: unknown): StateEntry => {
    const e = obj(v);
    return {
      tracks: Array.isArray(e.tracks) ? e.tracks.filter((x): x is string => typeof x === 'string') : undefined,
      pick: e.pick === 'rotate' || e.pick === 'random' || e.pick === 'first' ? e.pick : undefined,
      procedural: isMood(e.procedural) ? e.procedural : undefined,
      silence: e.silence === true ? true : undefined,
      fade: typeof e.fade === 'number' && e.fade >= 0 ? e.fade : undefined,
      quantize: q(e.quantize),
      loop: typeof e.loop === 'boolean' ? e.loop : undefined,
      sync: e.sync === true ? true : undefined,
      section: typeof e.section === 'string' ? e.section : undefined,
      ambience: typeof e.ambience === 'string' ? e.ambience : undefined,
      stinger: typeof e.stinger === 'string' ? e.stinger : undefined,
      prefetch: Array.isArray(e.prefetch) ? e.prefetch.filter((x): x is string => typeof x === 'string') : undefined,
    };
  };
  const map = <T>(v: unknown, f: (x: unknown) => T | undefined) => {
    const out: Record<string, T> = {};
    for (const [k, x] of Object.entries(obj(v))) {
      const y = f(x);
      if (y !== undefined) out[k] = y;
    }
    return out;
  };
  return {
    defaults: { fade: typeof d.fade === 'number' ? d.fade : 2.5, quantize: q(d.quantize) ?? 'bar', loop: d.loop !== false },
    partI: map(r.partI, (x) => (isMood(x) ? x : undefined)),
    partII: map(r.partII, entry),
    contexts: map(r.contexts, entry),
    moodToState: map(r.moodToState, (x) => (typeof x === 'string' ? (x as MusicState) : undefined)),
    stingers: map(r.stingers, (x) => {
      const s = obj(x);
      return { procedural: typeof s.procedural === 'string' ? s.procedural : undefined, file: typeof s.file === 'string' ? s.file : undefined, gain: typeof s.gain === 'number' ? s.gain : undefined };
    }),
    ambienceFiles: map(r.ambienceFiles, (x) => (typeof x === 'string' ? x : undefined)),
  };
}

/** the state entry with its context override merged in */
export function entryFor(t: DirectorTable, state: string, context?: string): StateEntry {
  const base = t.partII[state] ?? {};
  const ctx = context ? (t.contexts[`${state}:${context}`] ?? t.contexts[context]) : undefined;
  if (!ctx) return base;
  const merged: StateEntry = { ...base };
  for (const [k, v] of Object.entries(ctx)) if (v !== undefined) (merged as Record<string, unknown>)[k] = v;
  return merged;
}

/** pick a track from the entry's candidates that the catalog has */
export function pickTrack(e: StateEntry, has: (ref: string) => boolean, rotation = 0, random: () => number = Math.random): string | null {
  const avail = (e.tracks ?? []).filter(has);
  if (!avail.length) return null;
  if (e.pick === 'rotate') return avail[((rotation % avail.length) + avail.length) % avail.length];
  if (e.pick === 'random') return avail[Math.min(avail.length - 1, Math.floor(random() * avail.length))];
  return avail[0];
}

export function resolveTarget(t: DirectorTable, i: DirectorInput): Target {
  const D = t.defaults;
  if (i.listen && i.has(i.listen.ref)) return { kind: 'track', ref: i.listen.ref, fade: 1.2, quantize: 'now', loop: !!i.listen.loop, sync: false, source: 'listen' };
  if (i.cue && i.has(i.cue.ref)) {
    const o = i.cue.opts;
    return { kind: 'track', ref: i.cue.ref, fade: o.fadeIn ?? D.fade, quantize: o.quantize ?? D.quantize, loop: o.loop ?? D.loop, sync: !!o.sync, section: o.section, at: o.at, source: 'cue' };
  }
  if (!i.partII) {
    const mood = t.partI[i.state] ?? (i.state === 'silence' || i.state === 'title' ? 'silence' : 'island');
    return mood === 'silence' ? { kind: 'silence', fade: 0, source: 'partI' } : { kind: 'procedural', mood, fade: 0, source: 'partI' };
  }
  const e = entryFor(t, i.state, i.context);
  const fade = e.fade ?? D.fade;
  if (i.state === 'island' && i.islandTrack && i.has(i.islandTrack)) return { kind: 'track', ref: i.islandTrack, fade, quantize: 'bar', loop: true, sync: false, source: 'island' };
  if (e.silence) return { kind: 'silence', fade, source: 'state' };
  const ref = pickTrack(e, i.has, i.rotation, i.random);
  if (ref) return { kind: 'track', ref, fade, quantize: e.quantize ?? D.quantize, loop: e.loop ?? D.loop, sync: !!e.sync, section: e.section, source: 'state' };
  const mood = e.procedural ?? t.partI[i.state] ?? 'silence';
  return mood === 'silence' ? { kind: 'silence', fade, source: 'state' } : { kind: 'procedural', mood, fade, source: 'state' };
}

/**
 * (agent FINAL) a QUIET hold over a resolved target: the game's own music (a state's track, the island's, a procedural
 * mood) becomes silence; a cue (a film's song) and a listen (the Fonoteca) stay. Pure.
 */
export function quietOver(t: Target, quiet: boolean): Target {
  if (!quiet || t.kind === 'silence') return t;
  if (t.kind === 'track' && (t.source === 'cue' || t.source === 'listen')) return t;
  return { kind: 'silence', fade: t.fade, source: 'state' };
}

/** two targets mean the same music (no restart, no crossfade) */
export function sameTarget(a: Target | null, b: Target | null) {
  if (!a || !b || a.kind !== b.kind) return false;
  if (a.kind === 'track' && b.kind === 'track') return a.ref === b.ref && a.loop === b.loop;
  if (a.kind === 'procedural' && b.kind === 'procedural') return a.mood === b.mood;
  return a.kind === 'silence';
}
