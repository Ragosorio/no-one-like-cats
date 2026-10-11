/**
 * The Momentos' slice of the save: `G.s.ext.momentos` (OPTIONAL — absent on every save that never played one).
 *
 *   { seen: { <momentoId>: { at, best?, plays? } } }
 *
 * - `at`     Date.now() of the first COMPLETION (the Momento becomes skippable-in-replay and shows in «Volver a ver»)
 * - `best`   best cosmetic rhythm grade (S/A/B/C) — never gates anything
 * - `plays`  completions (first time + replays), cosmetic
 *
 * Rules (docs/ACTUALIZACIONES.md): never subtract, never break. Normalization is pure and idempotent: unknown ids and
 * unknown keys are kept, only malformed values are repaired; an empty slice is dropped. Nothing else in the save ever
 * depends on what the player pressed during a Momento.
 */
import type { Grade, MomentoResult } from './types';
import { betterGrade } from './core';

export interface MomentoSeen {
  at: number;
  best?: Grade;
  plays?: number;
  [k: string]: unknown;
}
export interface MomentosExt {
  seen: Record<string, MomentoSeen>;
  [k: string]: unknown;
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const GRADES = new Set(['S', 'A', 'B', 'C']);

/** repair a raw slice (null = nothing worth keeping) */
export function normalizeMomentos(raw: unknown): MomentosExt | null {
  if (!isObj(raw)) return null;
  const seenIn = isObj(raw.seen) ? raw.seen : {};
  const seen: Record<string, MomentoSeen> = {};
  for (const [id, v] of Object.entries(seenIn)) {
    if (!id || id.length > 80) continue;
    const r = isObj(v) ? v : {};
    const at = typeof r.at === 'number' && Number.isFinite(r.at) && r.at > 0 ? r.at : 1;
    const out: MomentoSeen = { ...r, at };
    if (r.best !== undefined && !(typeof r.best === 'string' && GRADES.has(r.best))) delete out.best;
    if (r.plays !== undefined) {
      const p = typeof r.plays === 'number' && Number.isFinite(r.plays) ? Math.max(1, Math.floor(r.plays)) : 1;
      out.plays = p;
    }
    seen[id] = out;
  }
  const out: MomentosExt = { ...raw, seen };
  return Object.keys(seen).length || Object.keys(raw).some((k) => k !== 'seen') ? out : null;
}

type SaveLike = { ext?: Record<string, unknown> };

/** the slice of a save (normalized view; never writes) */
export function momentosOf(s: SaveLike | null | undefined): MomentosExt {
  return normalizeMomentos(s?.ext?.momentos) ?? { seen: {} };
}
export function momentoSeen(s: SaveLike | null | undefined, id: string): boolean {
  return !!momentosOf(s).seen[id];
}

/**
 * Record a COMPLETED Momento (pure on the object you pass). Only `end === 'done'` counts. Returns true the first time.
 * The ONLY fields an input can influence are cosmetic: `best` (and nothing else reads them for gameplay).
 */
export function commitMomento(s: SaveLike, res: MomentoResult, now: number): boolean {
  if (res.end !== 'done') return false;
  const ext = (s.ext ??= {});
  const cur = normalizeMomentos(ext.momentos) ?? { seen: {} };
  const prev = cur.seen[res.id];
  const first = !prev;
  cur.seen[res.id] = { ...(prev ?? {}), at: prev?.at ?? now, best: betterGrade(prev?.best, res.grade), plays: (prev?.plays ?? 0) + 1 };
  ext.momentos = cur;
  return first;
}

/** keys an input can change (tests diff saves ignoring exactly these) */
export const COSMETIC_KEYS = ['best'] as const;
