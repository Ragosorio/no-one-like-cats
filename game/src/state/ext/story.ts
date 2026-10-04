/**
 * Story-side state helpers (owned by the story module): beats seen, Luzterna lines seen,
 * naming the first cat (H02) and the "Mientras no estabas…" summary.
 */
import { G } from '../game';
import type { BootInfo } from '../index';
import { checkMissions } from '../sys/missions';
import { catName } from '../../data/content';

export function beatSeen(id: string) {
  return G.s.beatsSeen.includes(id);
}
export function markBeat(id: string) {
  if (!G.s.beatsSeen.includes(id)) {
    G.s.beatsSeen.push(id);
    G.emit('beat', { id });
  }
}

export function lineSeen(id: string) {
  return G.s.missions.seenLines.includes(id);
}
export function markLine(id: string) {
  if (!G.s.missions.seenLines.includes(id)) G.s.missions.seenLines.push(id);
}

/** the starter cat the player names in H02 (Canelo) */
export function firstCat() {
  return G.s.cats.find((c) => c.species === 'c_canelo') ?? G.s.cats[0] ?? null;
}

const BAD = /(put[oa]|maric[oó]n|pendej|verga|mierda|chinga|cabr[oó]n|culer|nazi|hitler)/i;

/** Normalize a typed name: trims, collapses spaces, max 14 chars, no slurs (→ keeps the old name). */
export function sanitizeName(raw: string, fallback: string) {
  let n = raw.replace(/[\u0000-\u001f<>{}[\]\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 14);
  if (!n || BAD.test(n)) n = fallback;
  return n;
}

/** H02: apply the name (or accept the default) and count the action for the mission. */
export function nameFirstCat(raw: string) {
  const c = firstCat();
  if (!c) return '';
  const name = sanitizeName(raw, c.name || catName(c.species));
  c.name = name;
  if (!c.moments.includes('named')) c.moments.push(`Se llama ${name}. Así, sin más.`);
  G.count('name_cat');
  checkMissions();
  G.save();
  G.emit('changed', undefined);
  return name;
}

export interface OfflineSummary {
  ms: number;
  gold: number;
  /** crops ready to harvest */
  crops: number;
  /** finished resonance jobs waiting for a reveal (A + B names) */
  resonances: { a: string; b: string }[];
  /** green timers still running */
  running: number;
  /** "tiraron N vasos" */
  glasses: number;
  /** full habitat buffers */
  fullHabitats: number;
}

export function offlineSummary(info: BootInfo): OfflineSummary {
  const nameOf = (uid: string) => {
    const c = G.s.cats.find((x) => x.uid === uid);
    return c ? c.name || catName(c.species) : '???';
  };
  const res = G.s.resonance.jobs.filter((j) => j.ready).map((j) => ({ a: nameOf(j.a), b: nameOf(j.b) }));
  const crops = G.s.farms.filter((f) => f.ready).length;
  // one glass per cat every ~25 min, at least 1 — canon
  const glasses = Math.max(1, Math.round((info.offlineMs / 60000 / 25) * Math.max(1, G.s.cats.length) * (0.7 + Math.random() * 0.6)));
  let full = 0;
  for (const h of G.s.habitats) if (h.buffer > 0 && h.cats.length) full++;
  return { ms: info.offlineMs, gold: info.offlineGold, crops, resonances: res, running: G.s.timers.length, glasses, fullHabitats: full };
}
