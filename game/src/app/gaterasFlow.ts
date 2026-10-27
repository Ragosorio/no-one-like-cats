/**
 * Parte III · the bar and the way out (docs/part-iii/04 §2–§6, contract 11 §1): the single entry points.
 *
 *   playBarPrologue()  H66 «La última ronda»: scene A (p3_bar_a) → the Momento «Drunck» (drunck) → scene B and the
 *                      reveal (p3_bar_b) → emits `feature_p3_bar` (H66's goal) → straight on to the way out.
 *   playSalida()       H67 «¿Dónde andabas, gordo?»: the alley and the walk (p3_salida) → emits `feature_p3_salida`
 *                      → home. The waking of REGISTRO 000 (p3_despierta, island stage) is agent A's: its story
 *                      director plays it when H67 is done (ui/story/gaterasScript.ts P3_ON_DONE.H67) — never twice.
 *   resumeGateras()    whatever the save says is pending (H66 → the bar; H67 → the alley): a reload never deadlocks.
 *   replayCaja(id)     Ajustes › VOLVER A VER of the three caja cines (cine/replay.ts sends them here): nothing persists.
 *                      The Momento replays through the panel's generic «♪ DRUNCK» row (playMomento, replay).
 *
 * Who calls: agent A's page by the faro (ui/story/gaterasCines.ts enterH66) → playBarPrologue(); the pinned
 * mission's IR / the island's gatera → resumeGateras(). Between the bar and the alley, A's cards: CAMBIÓ of H66
 * («GATERA DESCUBIERTA») and H67's new card (panels/Bitacora.ts showP3Card) — awaited, optional (glob import).
 *
 * The Momento never touches the save beyond `ext.momentos.drunck` (cosmetic); the story beats are persisted by the
 * cines' own `persist` steps (b66_bar#a/#b, b67_salida#a); the features are counted here, once, never in a replay.
 */
import { G } from '../state/game';
import { scenes } from '../core/scenes';
import { hush } from '../ui/hush';
import type { CineResult, CineStage } from '../cine/types';

export const P3_FEATURES = { bar: 'feature_p3_bar', salida: 'feature_p3_salida' } as const;
export const CAJA_CINES = ['p3_bar_a', 'p3_bar_b', 'p3_salida'] as const;

let running = false;
export const gaterasRunning = () => running;

/** (agent A) something to show between the bar and the alley — e.g. the H67 card. Awaited; optional */
let interlude: ((after: 'bar' | 'salida') => Promise<void>) | null = null;
export function registerGaterasInterlude(fn: ((after: 'bar' | 'salida') => Promise<void>) | null) {
  interlude = fn;
}

// agent A's Parte III mission cards (optional: the flow builds and runs without them)
const BITACORA = import.meta.glob<{ showP3Card?: (id: string, phase: 'new' | 'done') => Promise<void> }>('../panels/Bitacora.ts');
async function p3Card(id: string, phase: 'new' | 'done') {
  try {
    const load = BITACORA['../panels/Bitacora.ts'];
    const m = load ? await load() : null;
    await m?.showP3Card?.(id, phase);
  } catch (e) {
    console.warn('[gateras] card', id, phase, e);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function waitStage(id: string, ms: number): Promise<CineStage | null> {
  const { cineStage, runningCine } = await import('../cine/registry');
  const t0 = performance.now();
  while (performance.now() - t0 < ms) {
    const st = cineStage(id);
    if (st && st.alive() && !st.blocked() && !runningCine()) return st;
    await sleep(80);
  }
  return null;
}

/**
 * the CajaScene on screen (with that set), entering it if needed. `cruce`: we arrive THROUGH THE CAT FLAP (H66 for
 * real, after the island's p3_pelo left the screen in the flap's light): the new scene starts under that same light
 * (scenes/caja/barDirector.ts armCruce) and no iris closes in between — p3_bar_a wipes the light away in TV bands.
 */
async function goCaja(set: 'bar' | 'calle', cruce = false) {
  const { CajaScene } = await import('../scenes/CajaScene');
  const cur = scenes.current;
  if (cur instanceof CajaScene && cur.isAlive) {
    if (cur.ready && cur.set !== set) cur.useSet(set);
  } else {
    if (cruce) (await import('../scenes/caja/barDirector')).armCruce();
    await scenes.go(new CajaScene({ set }), cruce ? 'none' : 'iris');
  }
  return waitStage('caja', 25000);
}

async function lines() {
  const { storyLines } = await import('./story');
  return (beat: string, idx?: number[]) => storyLines(beat, idx);
}
async function play(id: string, replay: boolean): Promise<CineResult> {
  const [{ playCine }, l] = await Promise.all([import('../cine'), lines()]);
  return playCine(id, { replay, host: { lines: l } });
}

function count(feature: string) {
  G.count(feature);
  void import('../state/sys/missions').then((m) => m.checkMissions());
  G.save();
}

/** the Momento «Drunck» between scene A and scene B (null = it couldn't play: the story goes on without it) */
async function playDrunck(replay: boolean) {
  const { playMomento } = await import('../momentos');
  try {
    // MOMENTO: drunck (H66) — the long gulp is the cold open
    return await playMomento('drunck', { replay });
  } catch (e) {
    console.warn('[gateras] drunck', e);
    return null;
  }
}

// ------------------------------------------------------------------ H66
export async function playBarPrologue(o: { replay?: boolean; chain?: boolean } = {}): Promise<'done' | 'interrupted'> {
  const replay = !!o.replay;
  if (running) return 'interrupted';
  if (!replay && !G.s.missions.active.includes('H66')) return 'interrupted';
  running = true;
  hush('gateras', true);
  try {
    if (!(await goCaja('calle', !replay))) return 'interrupted';
    if ((await play('p3_bar_a', replay)) === 'interrupted') return 'interrupted';
    await playDrunck(replay);
    const { CajaScene } = await import('../scenes/CajaScene');
    const sc = scenes.current;
    if (!(sc instanceof CajaScene) || !sc.isAlive) return 'interrupted';
    sc.showGulp(false);
    if ((await play('p3_bar_b', replay)) === 'interrupted') return 'interrupted';
    if (!replay) count(P3_FEATURES.bar);
  } finally {
    running = false;
    hush('gateras', false);
  }
  // the story is one night: the alley follows the bar (unless a replay or the caller wants to stop here).
  // In between, on the bar's last frame: CAMBIÓ of H66 (GATERA DESCUBIERTA) and the card of H67
  if (!replay && o.chain !== false) {
    // one night, one hold: popups (the Fonoteca's «NUEVA CANCIÓN» card) wait until we are home, not between scenes
    hush('gateras_noche', true);
    try {
      await p3Card('H66', 'done');
      await p3Card('H67', 'new');
      try {
        await interlude?.('bar');
      } catch (e) {
        console.warn('[gateras] interlude', e);
      }
      return await playSalida();
    } finally {
      hush('gateras_noche', false);
    }
  }
  return 'done';
}

// ------------------------------------------------------------------ H67
export async function playSalida(o: { replay?: boolean } = {}): Promise<'done' | 'interrupted'> {
  const replay = !!o.replay;
  if (running) return 'interrupted';
  if (!replay && !G.s.missions.active.includes('H67')) {
    // H66 just got done and the mission system hasn't opened H67 yet: give it a moment
    await sleep(400);
    if (!G.s.missions.active.includes('H67')) return 'interrupted';
  }
  running = true;
  hush('gateras', true);
  try {
    if (!(await goCaja('calle'))) return 'interrupted';
    if ((await play('p3_salida', replay)) === 'interrupted') return 'interrupted';
    if (!replay) count(P3_FEATURES.salida);
  } finally {
    running = false;
    hush('gateras', false);
  }
  // home: the waking of REGISTRO 000 is agent A's (its director plays p3_despierta once H67 is done, at home)
  const { goIsland } = await import('./flow');
  await goIsland();
  return 'done';
}

/** whatever is pending (H66 → the bar · H67 → the alley); the island's gatera and the mission's IR call this */
export async function resumeGateras(): Promise<'done' | 'interrupted' | 'none'> {
  const a = G.s.missions.active;
  if (a.includes('H66')) return playBarPrologue();
  if (a.includes('H67')) return playSalida();
  return 'none';
}

// ------------------------------------------------------------------ VOLVER A VER
/** a caja cine again (Ajustes): the right set, nothing persisted, then home */
export async function replayCaja(id: string): Promise<CineResult> {
  if (running || !(CAJA_CINES as readonly string[]).includes(id)) return 'interrupted';
  running = true;
  let r: CineResult = 'interrupted';
  try {
    if (!(await goCaja(id === 'p3_salida' ? 'calle' : id === 'p3_bar_b' ? 'bar' : 'calle'))) return 'interrupted';
    r = await play(id, true);
    if (id === 'p3_bar_a') {
      const { CajaScene } = await import('../scenes/CajaScene');
      const sc = scenes.current;
      if (sc instanceof CajaScene) sc.showGulp(false);
    }
  } finally {
    running = false;
  }
  const { goIsland } = await import('./flow');
  await goIsland();
  return r;
}

// ------------------------------------------------------------------ DEV
/**
 * ?scene=caja&set=bar|calle — the set alone (window.__caja) · &cine=p3_bar_a — that cine as a replay (persists nothing) ·
 * &flow=bar|salida — the whole flow as a replay (&real=1: for real, on the loaded save)
 */
export async function devCaja(q: URLSearchParams) {
  const set = q.get('set') === 'calle' ? 'calle' : 'bar';
  const flow = q.get('flow');
  const real = q.get('real') === '1';
  if (flow === 'bar') return playBarPrologue({ replay: !real, chain: real });
  if (flow === 'salida') return playSalida({ replay: !real });
  if (!(await goCaja(set))) return;
  const cine = q.get('cine');
  if (cine) {
    await play(cine, true);
    const { CajaScene } = await import('../scenes/CajaScene');
    if (scenes.current instanceof CajaScene) scenes.current.showGulp(false);
  }
}
