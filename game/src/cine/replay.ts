/**
 * «VOLVER A VER» (Ajustes): replay a Parte II scene the player has already seen.
 *
 * - The list is derived from the save (cine/registry.ts replayList): a scene shows once its beat key was seen,
 *   with a spoiler-safe title, in story order.
 * - A replay NEVER changes progress: `playCine(id, { replay: true })` skips every `persist` step, the scripts'
 *   side effects check `ctx.replay`, and when it ends the world blends back to the state the save derives
 *   (the night, the dawn, the scar: whatever the story says right now).
 * - Island scenes go home first; region scenes sail to their 3D island (RegionScene registers the 'region' stage
 *   once the island is built; a region whose own entrance IS the scene just plays it).
 */
import { G } from '../state/game';
import { cineStage, getCine, replayList, runningCine, type ReplayEntry } from './registry';
import type { CineResult, CineStage, Line } from './types';
import './scenes';

export function seenScenes(): ReplayEntry[] {
  return replayList(G.s?.beatsSeen ?? []);
}

/** a replay is on its way to a region: its own entrance scene (if any) yields to it */
let pending: { region: string; id: string } | null = null;
export function pendingRegionReplay(region: string) {
  return pending && pending.region === region ? pending.id : null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitStage(id: string, ms: number, ok: (s: CineStage) => boolean = () => true): Promise<CineStage | null> {
  const t0 = performance.now();
  while (performance.now() - t0 < ms) {
    const st = cineStage(id);
    if (st && st.alive() && !st.blocked() && ok(st) && !runningCine()) return st;
    await sleep(120);
  }
  return null;
}

/** play a seen scene again (from Ajustes). Resolves when it's over */
/** the finale's two scenes: with the YONOSE TODO Momento registered they replay as the finale itself */
const FINALE_SCENES: Record<string, 'mentira' | 'credits'> = { h64_mentira: 'mentira', h65_creditos: 'credits' };

export async function replayScene(id: string): Promise<CineResult> {
  const s = getCine(id);
  if (!s || runningCine()) return 'interrupted';
  // MOMENTO: yonose_todo (H64→H65) — «Mentira» and the credits replay through playFinale (the Momento; a replay persists
  // nothing and applies no mission effect). Without the Momento, the fallback cines below.
  if (FINALE_SCENES[id]) {
    const fin = await import('../app/o4Finale');
    if (fin.hasFinaleMomento()) return fin.playFinale({ replay: true, from: FINALE_SCENES[id] });
  }
  const [{ playCine }, flow, story] = await Promise.all([import('./index'), import('../app/flow'), import('../app/story')]);
  const lines = (beat: string, idx?: number[]): Line[] => story.storyLines(beat, idx);
  if (s.stage === 'region' && s.replay?.region) {
    const region = s.replay.region;
    if (s.replay.enters) {
      // the island's entrance is the scene itself (el reflejo): sailing there plays it, and it brings you home
      await flow.goRegion(region);
      return 'done';
    }
    pending = { region, id };
    try {
      await flow.goRegion(region);
      const st = await waitStage('region', 45000, (x) => (x as CineStage & { regionId?: string }).regionId === region);
      if (!st) return 'interrupted';
      return await playCine(id, { replay: true, host: { lines } });
    } finally {
      pending = null;
    }
  }
  if (!cineStage(s.stage)?.alive()) await flow.goIsland();
  const st = await waitStage(s.stage, 10000);
  if (!st) return 'interrupted';
  return playCine(id, { replay: true, host: { lines } });
}
