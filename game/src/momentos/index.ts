/**
 * MOMENTOS MUSICALES — public API (docs/part-ii/29-momentos-musicales.md).
 *
 *   import { playMomento } from '../momentos';
 *   const r = await playMomento('liky_fight', { crew, beforeCut });   // MomentoResult | null
 *
 * What it does, in order: hush the game's popups → the sound invitation (once in a life) → freeze the screen it was
 * called from (the cold open starts from that frame) → build the set + bake the actors while the song is fetched and
 * DECODED (prefetch, never a stutter) → play (unskippable the first time; Esc / the «II» button / a hidden tab pause) →
 * the hard cut → record the completion (cosmetic grade only) + Fonoteca → give the screen and the music back.
 *
 * The OUTCOME never depends on the player: nothing but `ext.momentos.<id>.best` (a cosmetic grade) reads the inputs.
 */
import type { Texture } from 'pixi.js';
import { Rectangle } from 'pixi.js';
import { game } from '../core/App';
import { scenes } from '../core/scenes';
import { audio } from '../core/audio';
import { audioApi } from '../audio/api';
import { G } from '../state/game';
import { hush } from '../ui/hush';
import type { MomentoDef, MomentoResult } from './types';
import type { Autoplay } from './core';
import { getMomento } from './registry';
import { commitMomento, momentoSeen } from './save';
import { MomentoRun } from './runner';
import { busGain } from '../core/settings';
import type { OnsetMap } from './types';

const ONSETS = import.meta.glob<{ default: OnsetMap }>('../data/music/beatmaps/*.onsets.json');
/** the per-stem onset tracks of a song (null when it has none) */
export async function loadOnsets(track: string): Promise<OnsetMap | null> {
  const id = track.split('.')[0];
  const f = ONSETS[`../data/music/beatmaps/${id}.onsets.json`];
  if (!f) return null;
  try {
    return (await f()).default;
  } catch {
    return null;
  }
}
/**
 * How much louder a Momento plays its original (dB): up to +6, but never past the headroom the player's own mix
 * leaves (the files peak at −1 dBTP; the boost + MÚSICA + GENERAL must stay ≤ −1 dBFS). Pure: tests check it.
 */
export function momentoBoostDb(musicGain = busGain('music'), masterGain = busGain('master')): number {
  const busDb = 20 * Math.log10(Math.max(1e-4, musicGain * masterGain));
  return Math.max(0, Math.min(6, -busDb));
}
import './songs';

export { registerMomento, getMomento, momentoIds, momentoForFase, seenMomentos } from './registry';
export type { MomentoDef, MomentoResult } from './types';

export interface PlayMomentoOpts {
  /** «Volver a ver»: exitable from the pause menu; nothing but the cosmetic grade is recorded */
  replay?: boolean;
  /** QA: synthetic inputs */
  autoplay?: Autoplay;
  /** QA: no clock (window.__momento.render(m)) */
  scrub?: boolean;
  quality?: 'high' | 'low';
  /** DEV route: no game scene underneath (no snapshot) */
  standalone?: boolean;
  /** the player's crew slugs (personalized cut-ins) */
  crew?: string[];
  /** ~0.4 s before the cut: ready the game underneath (a battle stages its next phase here) */
  beforeCut?: () => void;
  /** skip the sound invitation (the caller already asked) */
  noInvite?: boolean;
  /**
   * (optional) override parts of the registered definition for THIS run only (same id: the completion is the same
   * Momento). YONOSE TODO uses it to resume the finale at the credits: `{ edit, score }` = only the song's end.
   */
  def?: Partial<Omit<MomentoDef, 'id' | 'track'>>;
}

let playing: MomentoRun | null = null;
export const momentoPlaying = () => !!playing;

async function inviteSound(): Promise<boolean> {
  try {
    const m = await import('../audio/invite');
    return (await m.ensureAudioInvited()) === 'on';
  } catch {
    return false;
  }
}
function withTimeout<T>(p: Promise<T>, ms: number, d: T): Promise<T> {
  return Promise.race([p, new Promise<T>((r) => setTimeout(() => r(d), ms))]);
}

/** the frozen frame of the screen we were called from */
function snapshot(): Texture | null {
  try {
    const v = game.view;
    return game.pixi.renderer.generateTexture({ target: scenes.sceneLayer, frame: new Rectangle(v.x, v.y, v.w, v.h), resolution: Math.min(1, game.pixi.renderer.resolution) });
  } catch (e) {
    console.warn('[momento] snapshot', e);
    return null;
  }
}

export async function playMomento(id: string, o: PlayMomentoOpts = {}): Promise<MomentoResult | null> {
  const reg = getMomento(id);
  const def = reg && o.def ? { ...reg, ...o.def } : reg;
  if (!def || playing) return null;
  const [map, onsets] = await Promise.all([audioApi.beatMap(def.track), loadOnsets(def.track)]);
  if (!map || !map.beats.length) {
    console.warn('[momento] sin mapa de beats', def.track);
    return null;
  }
  hush('momento', true);
  // only the Momento's song is heard: the music that was playing (the battle's song), battle / game sfx, the sea, the
  // wind, ambience loops and voices fade out now (short fade) and come back after the cut (doc 29 §6). The Momento's
  // song is a NEW cue on the music decks: it plays normally.
  if (!o.scrub) audioApi.solo(true, { key: 'momento', fade: 0.3, decks: true });
  let run: MomentoRun | null = null;
  let snap: Texture | null = null;
  const hidden: { c: { renderable: boolean }; was: boolean }[] = [];
  let boosted = 0;
  try {
    const wantSound = o.scrub ? false : o.noInvite ? true : await inviteSound();
    // decode the song while the set is built (a Momento never stutters at its start)
    // (the 9 s grace starts once the set is ready: on a loaded machine building the set and decoding compete, and a
    // decode that lost that race used to leave the whole Momento silent)
    const audioReady = wantSound && audio.ctx ? audioApi.prepare(def.track) : Promise.resolve(false);
    snap = o.standalone ? null : snapshot();
    const seen = momentoSeen(G.s, def.id);
    const r = game.pixi.renderer;
    run = new MomentoRun(def, map, {
      renderer: r,
      host: game.root,
      view: game.view,
      pxScale: game.scale * r.resolution,
      replay: !!o.replay || seen,
      autoplay: o.autoplay,
      scrub: o.scrub,
      quality: o.quality ?? (import.meta.env.DEV ? ((new URLSearchParams(location.search).get('mq') as 'high' | 'low' | null) ?? undefined) : undefined),
      audio: wantSound,
      crew: o.crew,
      snapshot: snap,
      onsets,
      beforeCut: () => {
        // the game underneath comes back for the hard cut
        for (const h of hidden) h.c.renderable = h.was;
        hidden.length = 0;
        o.beforeCut?.();
      },
    });
    playing = run;
    if (import.meta.env.DEV) installDev(run);
    await run.prepare();
    // the game under the Momento doesn't need drawing (GPU for the Momento)
    for (const c of [scenes.sceneLayer, scenes.overlayLayer]) {
      hidden.push({ c, was: c.renderable });
      c.renderable = false;
    }
    const withAudio = await withTimeout(audioReady, 9000, false);
    // the original plays up front (within the mix's headroom); undone after the Momento
    boosted = withAudio ? momentoBoostDb() : 0;
    if (boosted > 0) audioApi.musicBoost(boosted);
    const res = await run.play(withAudio);
    // ---- after the cut
    if (res.end === 'done' && !o.scrub && G.s?.cats?.length) {
      const first = commitMomento(G.s as unknown as { ext?: Record<string, unknown> }, res, Date.now());
      G.save();
      if (first || !o.replay) unlockFonoteca(def.unlocks ?? [], def.source ?? 'Islas Invertidas');
    }
    const keep = def.tail === 'keep' && !o.replay && !o.standalone && res.end === 'done';
    if (!keep && wantSound) audioApi.release(res.end === 'done' ? 0.9 : 0.4);
    return res;
  } catch (e) {
    console.error('[momento]', e);
    return null;
  } finally {
    if (boosted > 0) audioApi.musicBoost(0);
    for (const h of hidden) h.c.renderable = h.was;
    if (def && !o.scrub) audioApi.unprepare(def.track);
    if (run && !(o.scrub && import.meta.env.DEV)) {
      run.dispose();
      // DEV: keep only a summary (never the disposed run: it would pin its objects)
      if (import.meta.env.DEV) {
        const r = run;
        (window as unknown as { __momento: unknown }).__momento = { last: { result: r.result, trace: r.trace, warnings: r.score.warnings } };
      }
    }
    snap?.destroy(true);
    playing = null;
    if (!o.scrub) audioApi.solo(false, { key: 'momento', fade: 0.6, decks: true });
    hush('momento', false);
  }
}

/** Fonoteca (doc 18 §8): unlock what the Momento brings, only refs the catalog knows, after the hush */
function unlockFonoteca(refs: string[], source: string) {
  for (const ref of refs) {
    window.setTimeout(() => {
      void audioApi.beatMap(ref).then((m) => {
        if (!m) return;
        void import('../audio/fonoteca').then((f) => {
          if (!f.isUnlocked(ref)) audioApi.unlockSong(ref, source);
        });
      });
    }, 1500);
  }
}

function installDev(run: MomentoRun) {
  (window as unknown as { __momento: unknown }).__momento = {
    run,
    render: (m: number) => run.frame(m),
    state: () => ({ m: run.clock.m, mode: run.clock.mode, paused: run.clock.paused, quality: run.quality, clips: run.host.count, active: run.host.activeCount, log: run.clock.log.slice(-12), warnings: run.score.warnings }),
    result: () => run.result,
    trace: () => run.trace,
    pause: (on = true) => run.setPaused(on),
    cut: () => run.score.mCut,
  };
}
