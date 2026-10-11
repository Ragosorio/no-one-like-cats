/**
 * Boots the Parte II audio engine and installs the facade (src/audio/api.ts). Called once from
 * main.ts. Part I is untouched: core/music.ts only routes through the director once the save is past
 * H30, and the catalog/beat maps/songs are never fetched before something asks for them.
 */
import { audio, applyMix } from '../core/audio';
import { music } from '../core/music';
import { installAudioApi } from './api';
import type { AudioApi, CueOpts, MusicState } from './api';
import { MusicPlayer, mem, prepareDecoded, preparedStatus, releaseDecoded } from './player';
import { Director } from './director';
import { Ambience } from './ambience';
import { playStinger } from './stingers';
import { onSongUnlock, partII, unlockSong } from './fonoteca';
import { beatMapFor, catalog, resolveTrack, setCatalog } from './catalog';
import { LayerMixer } from './layers';

export const player = new MusicPlayer();
export const director = new Director(player);
export const ambience = new Ambience();
/** (ext) in-sync layers of the playing track (src/audio/layers.ts) */
export const layers = new LayerMixer(player);

const prefetched = new Set<string>();
/** warm the HTTP / service-worker cache for a track (full file, low priority, once per session) */
export function prefetch(ref: string) {
  const r = resolveTrack(ref);
  if (!r || prefetched.has(r.url)) return;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return;
  prefetched.add(r.url);
  fetch(r.url, { priority: 'low' } as RequestInit)
    .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(String(res.status)))))
    .then(() => undefined)
    .catch(() => prefetched.delete(r.url));
}

let installed = false;
export function installAudio() {
  if (installed) return;
  installed = true;
  ambience.files = director.table.ambienceFiles;
  director.onAmbience = (bed, fade) => ambience.set(bed, { fade });
  director.onStinger = (id) => playStinger(id, { files: director.table.stingers });
  music.router = director.route;
  layers.watch();
  // a song really listened to (20 s) is kept whole in the worker's music cache → it replays offline
  player.onListened = (r) => {
    if (typeof navigator !== 'undefined' && navigator.serviceWorker?.controller) prefetch(r.ref);
  };

  // nothing in the facade may throw (api.ts contract)
  const safe =
    <A extends unknown[], R>(name: string, f: (...a: A) => R, d: R) =>
    (...a: A): R => {
      try {
        return f(...a);
      } catch (e) {
        console.error(`[audio] ${name}`, e);
        return d;
      }
    };
  const afterState = () => {
    for (const ref of director.likelyNext()) prefetch(ref);
  };
  const api: AudioApi = {
    setState: safe('setState', (s: MusicState, o?: { fade?: number; context?: string }) => {
      director.setState(s, o ?? {});
      afterState();
    }, undefined),
    cue: safe('cue', (id: string, o?: CueOpts) => director.cue(id, o ?? {}), undefined),
    release: safe('release', (fade?: number) => director.release(fade), undefined),
    ambience: safe('ambience', (bed: string, o?: { fade?: number; level?: number }) => ambience.set(bed, o ?? {}), undefined),
    stinger: safe('stinger', (id: string, o?: { gain?: number }) => playStinger(id, { gain: o?.gain, files: director.table.stingers }), undefined),
    duck: safe('duck', (on: boolean, amount?: number, key?: string) => audio.duck(key ?? 'api', on, amount ?? 6), undefined),
    trackTime: safe('trackTime', () => player.trackTime(), null),
    on: safe('on', (ev: string, fn: Parameters<AudioApi['on']>[1]) => player.sched.on(ev, fn), () => undefined),
    unlockSong: safe('unlockSong', (id: string, src: string) => void unlockSong(id, src), undefined),
    prefetch: safe('prefetch', (id: string) => prefetch(id), undefined),
    currentTrack: safe('currentTrack', () => (player.cur && player.cur.state !== 'stopped' ? player.cur.ref.ref : null), null),
    musicState: safe('musicState', () => director.state, 'title' as MusicState),
    beatMap: async (id?: string) => {
      try {
        const ref = id ?? player.cur?.ref.ref;
        if (!ref) return null;
        if (!id && player.cur?.map) return player.cur.map;
        const r = resolveTrack(ref);
        return r ? await beatMapFor(r) : null;
      } catch (e) {
        console.error('[audio] beatMap', e);
        return null;
      }
    },
    prepare: async (id: string) => {
      try {
        const r = resolveTrack(id);
        if (!r) return false;
        return await prepareDecoded(audio.ctx, r.url);
      } catch (e) {
        console.error('[audio] prepare', e);
        return false;
      }
    },
    unprepare: safe('unprepare', (id: string) => {
      const r = resolveTrack(id);
      if (r) releaseDecoded(r.url);
    }, undefined),
    setLayers: safe('setLayers', (id: string, g: Record<string, number> | null, o?: { fade?: number }) => {
      const r = resolveTrack(id);
      layers.set(r?.ref ?? id, g, o?.fade);
    }, undefined),
    pauseMusic: safe('pauseMusic', (p: boolean) => player.setPaused(p), undefined),
    musicBoost: safe('musicBoost', (db: number) => player.setBoost(db), undefined),
    solo: safe('solo', (on: boolean, o?: { fade?: number; key?: string; decks?: boolean }) => {
      const fade = o?.fade ?? 0.25;
      if (audio.solo(o?.key ?? 'api', on, fade) && o?.decks) player.hushDecks(on, fade);
    }, undefined),
  };
  installAudioApi(api);

  // the context is born on the first gesture: apply what was asked before it existed
  audio.onUnlock(() => {
    applyMix();
    if (partII() || director.cueRef) director.apply();
    const w = ambience.wanted;
    if (w.bed !== 'none') ambience.set(w.bed, { level: w.level, fade: 2 });
  });

  // a new song in the Fonoteca: the record animation (once per song) + its stinger
  onSongUnlock((e) => {
    if (e.firstOfSong) playStinger('unlock', { files: director.table.stingers });
    void import('./unlockToast').then((m) => m.showUnlock(e)).catch(() => undefined);
    void import('../panels/Fonoteca').then((m) => m.refreshFonoteca()).catch(() => undefined);
  });

  if (import.meta.env.DEV) installDevHook();
}

/** DEV only: window.__audio (headless checks, the browser console) */
function installDevHook() {
  const trace: { ev: string; time: number; beat?: number; bar?: number; name?: string; late?: number; at: number }[] = [];
  let tracing: (() => void)[] = [];
  const hook = {
    audio,
    player,
    director,
    ambience,
    mem,
    prepared: () => preparedStatus(),
    catalog,
    setCatalog,
    resolveTrack,
    unlock: (id: string, src = 'Laboratorio') => unlockSong(id, src),
    decks: () => player.decks(),
    layers: () => layers.status(),
    status: () => ({
      ctx: audio.ctx?.state ?? 'none',
      latency: audio.ctx ? { base: audio.ctx.baseLatency, output: (audio.ctx as AudioContext & { outputLatency?: number }).outputLatency ?? null } : null,
      director: director.status(),
      decks: player.decks(),
      trackTime: player.trackTime(),
      ambience: ambience.status(),
      duckDb: audio.duckDb,
      boost: player.boost,
      soloed: audio.soloed,
      gains: { ...audio.gains, muted: audio.muted },
      mem: { ...mem },
      sched: { ...player.sched.stats },
    }),
    /** record every beat/bar/section/marker delivered (check: never twice) */
    trace(on = true) {
      for (const off of tracing) off();
      tracing = [];
      trace.length = 0;
      if (!on) return trace;
      for (const ev of ['beat', 'bar', 'section', 'marker', 'hit', 'voice'])
        tracing.push(player.sched.on(ev, (i) => trace.push({ ev, time: i.time, beat: i.beat, bar: i.bar, name: i.name, late: i.late, at: audio.ctx?.currentTime ?? 0 })));
      return trace;
    },
    traced: () => trace,
    invite: () => import('./invite').then((m) => m.ensureAudioInvited()),
    fonoteca: () => import('../panels/Fonoteca').then((m) => m.openFonoteca()),
  };
  (window as unknown as { __audio: typeof hook }).__audio = hook;
}
