/**
 * Which cinematics exist, where they can play, and the one that is playing (pure: no Pixi).
 * Scripts register at import (src/cine/scenes/*); stages register while their scene is on screen
 * (the island: src/island/night/stage.ts). Only one cine plays at a time.
 */
import { CineRunner, type RunnerOpts } from './runner';
import type { CineHost, CineResult, CineScript, CineStage } from './types';

const scripts = new Map<string, CineScript>();
const stages = new Map<string, CineStage>();
let running: CineRunner | null = null;

export function registerCine(s: CineScript) {
  scripts.set(s.id, s);
}
export function getCine(id: string) {
  return scripts.get(id) ?? null;
}
export function cineIds() {
  return [...scripts.keys()];
}

export interface ReplayEntry {
  id: string;
  title: string;
  order: number;
  region?: string;
}
/** Ajustes › VOLVER A VER: the scenes this save has seen, in story order (pure: beatsSeen in, list out) */
export function replayList(beatsSeen: readonly string[]): ReplayEntry[] {
  const seen = new Set(beatsSeen);
  const out: ReplayEntry[] = [];
  for (const s of scripts.values()) {
    const r = s.replay;
    if (!r) continue;
    const keys = Array.isArray(r.seen) ? r.seen : [r.seen];
    if (!keys.some((k) => seen.has(k) || seen.has(k.split('#')[0]))) continue;
    out.push({ id: s.id, title: r.title, order: r.order, region: r.region });
  }
  return out.sort((a, b) => a.order - b.order);
}

/** a scene offers (or withdraws) its stage; withdrawing interrupts the cine playing on it */
export function setCineStage(id: string, stage: CineStage | null) {
  const old = stages.get(id);
  if (stage) stages.set(id, stage);
  else stages.delete(id);
  if (old && old !== stage && running?.stage === old) running.abort();
}
export function cineStage(id: string) {
  return stages.get(id) ?? null;
}
export function runningCine() {
  return running;
}

export interface StartOpts extends RunnerOpts {
  host?: CineHost;
  /** frame source: calls fn(dtSeconds) every frame; returns an unsubscribe */
  clock?: (fn: (dt: number) => void) => () => void;
}

/** play a registered cine on its stage. 'interrupted' when there's no stage or another cine is playing */
export async function startCine(id: string, o: StartOpts = {}): Promise<CineResult> {
  const script = scripts.get(id);
  if (!script) {
    console.warn('[cine] unknown', id);
    return 'interrupted';
  }
  const stage = stages.get(script.stage);
  if (!stage || !stage.alive() || running) return 'interrupted';
  const r = new CineRunner(script, stage, o.host ?? {}, o);
  running = r;
  if (o.clock) r.attach(o.clock);
  try {
    return await r.play();
  } finally {
    if (running === r) running = null;
  }
}
