/**
 * CINE — declarative cinematics for scenes (docs/part-ii/20-estados-y-cine.md).
 *
 *   import { playCine } from '../cine';
 *   const res = await playCine('h31_opening', { host: { lines, persist } });   // 'done' | 'skipped' | 'interrupted'
 *   await playCine('h31_opening', { replay: true });                           // «volver a ver»: persists nothing
 *
 * Scripts: src/cine/scenes/*.ts (registerCine). Stages: a scene offers one while on screen (setCineStage).
 * Dev: __cine.play(id) · __cine.replay(id) · __cine.skip() · __cine.pause() · __cine.resume() · __cine.state()
 */
import { Ticker } from 'pixi.js';
import { audioApi } from '../audio/api';
import { settings } from '../core/settings';
import { BEAT_BY_ID } from '../data/content';
import { G } from '../state/game';
import { markBeat } from '../state/ext/story';
import { cancelDialogs, say, tip } from '../ui/dialog';
import { hush } from '../ui/hush';
import { CineOverlay } from './overlay';
import { cineIds, runningCine, startCine } from './registry';
import type { CineHost, CineResult, Line } from './types';
import './scenes';

export { registerCine, setCineStage, cineStage, runningCine, cineIds, getCine } from './registry';
export type { CineScript, CineStage, CineResult, Step } from './types';

// the AUDIO agent's sound invitation (src/audio/invite.ts → ensureAudioInvited). Optional: a glob, so this
// module still builds before that file exists; it is picked up as soon as it does.
const INVITE = import.meta.glob<{ ensureAudioInvited?: () => unknown }>('../audio/invite.ts');
export async function inviteAudio() {
  const load = INVITE['../audio/invite.ts'];
  if (!load) return;
  try {
    const m = await load();
    await m.ensureAudioInvited?.();
  } catch (e) {
    console.warn('[cine] audio invite', e);
  }
}

let overlay: CineOverlay | null = null;
let holding = false;
function holdScreen(on: boolean) {
  if (on === holding) return;
  holding = on;
  hush('cine', on);
}

/** the game's services for a cine (each can be overridden by the caller, e.g. the story's personalized lines) */
export function defaultHost(): CineHost {
  return {
    say: async (lines, o) => {
      if (!o.block) {
        lines.forEach(([sp, t], i) => {
          o.onLine?.(i);
          tip(t, { speaker: sp, force: true });
        });
        return;
      }
      // the cine's SALTAR is the only skip (the dialog's own would only skip lines)
      await say(lines, { dim: o.dim ?? 0, cinematic: false, skippable: false, onLine: (i) => o.onLine?.(i) });
    },
    cancelSay: () => cancelDialogs(),
    lines: (beat, idx) => {
      const b = BEAT_BY_ID.get(beat);
      if (!b) return [];
      return (idx ?? b.lines.map((_, i) => i)).map((i) => b.lines[i]).filter(Boolean).map(([s, t]) => [s, t] as Line);
    },
    persist: (beat) => {
      markBeat(beat);
      G.save();
    },
    audio: audioApi,
    invite: inviteAudio,
    ui: {
      set: (o, onSkip) => {
        overlay ??= new CineOverlay();
        overlay.set(o, onSkip);
        // the screen belongs to the scene while the letterbox is up / the HUD is away: gameplay popups wait
        // (src/ui/hush.ts). Control handed back (bars down, HUD back) = they may show again
        if (o.bars === true || o.hud === false) holdScreen(true);
        else if (o.bars === false) holdScreen(false);
      },
      clear: () => {
        overlay?.clear();
        overlay = null;
        holdScreen(false);
      },
    },
    reduceMotion: settings.reduceMotion,
    reduceFlashes: settings.reduceFlashes,
  };
}

const tickerClock = (fn: (dt: number) => void) => {
  const f = (t: Ticker) => fn(Math.min(0.25, t.deltaMS / 1000));
  Ticker.shared.add(f);
  return () => {
    Ticker.shared.remove(f);
  };
};

export interface PlayCineOpts {
  /** «volver a ver»: nothing is persisted; the world returns to what the save says */
  replay?: boolean;
  host?: Partial<CineHost>;
}
export function playCine(id: string, o: PlayCineOpts = {}): Promise<CineResult> {
  return startCine(id, { replay: o.replay, host: { ...defaultHost(), ...o.host }, clock: tickerClock });
}

(globalThis as unknown as { __cine: unknown }).__cine = {
  play: (id: string) => playCine(id),
  replay: (id: string) => playCine(id, { replay: true }),
  skip: () => runningCine()?.skip(),
  abort: () => runningCine()?.abort(),
  pause: () => runningCine()?.pause(),
  resume: () => runningCine()?.resume(),
  state: () => {
    const r = runningCine();
    return r ? { id: r.script.id, now: +r.now.toFixed(2), skipping: r.skipping, paused: r.paused, log: r.log.map((l) => `${l.t.toFixed(2)} ${l.id}`) } : null;
  },
  ids: () => cineIds(),
};
