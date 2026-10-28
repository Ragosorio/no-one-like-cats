/**
 * PELÍCULAS — public API (docs/part-iii/cine-v2/02-api.md).
 *
 *   import { playFilm } from '../film';
 *   const r = await playFilm('mi_pelicula', { seen });      // FilmResult | null
 *
 * In order: hush the game's popups → (a film with music: the sound invitation, decode the track) → the STYLED LOADING
 * SCREEN while everything is built and baked (MomentoRun.prepare → FilmStage.build) → play on the Momento clock
 * (pause: Esc / «II» / a hidden tab; skip per skipMode: never / SALIR in the pause menu / a SALTAR chip) → give the
 * screen and the music back. A film changes nothing in the save: the caller records «seen» (MECÁNICAS wires it).
 */
import { Circle, Container, Graphics, Text, Ticker } from 'pixi.js';
import { game } from '../core/App';
import { scenes } from '../core/scenes';
import { audio } from '../core/audio';
import { audioApi } from '../audio/api';
import { resolveTrack } from '../audio/catalog';
import { soundIsOn } from '../audio/invite';
import { settings } from '../core/settings';
import { hush } from '../ui/hush';
import { MomentoRun } from '../momentos/runner';
import type { Judgement, OnsetMap } from '../momentos/types';
import type { FilmDef, SkipMode } from './types';
import { gateTimes, segueOf, skipMode, timeBase, toMomentoDef, trackMapOf, validateFilm, type GateAt } from './timeline';
import { FilmStage } from './stage';
import { BareLoader, FilmLoader } from './loader';
import { getFilm } from './registry';
import { pauseTextureGC, type GcHost } from './texturegc';
import './films';

export { registerFilm, getFilm, filmIds } from './registry';
export type { FilmDef } from './types';

export interface PlayFilmOpts {
  /** the player already watched it to the end once (decides the skip rule) */
  seen?: boolean;
  /** QA: no clock (window.__film.render(m)) */
  scrub?: boolean;
  quality?: 'high' | 'low';
  /** DEV route: no game scene underneath */
  standalone?: boolean;
  /** the caller already asked about sound */
  noInvite?: boolean;
}
export interface FilmResult {
  id: string;
  /** 'done' = watched to the end · 'exited' = skipped / left · 'aborted' = the scene went away */
  end: 'done' | 'exited' | 'aborted';
  /** how it could be left this time */
  skip: SkipMode;
  /** the optional inputs (flourishes only) */
  inputs: Record<string, Judgement>;
}

const ONSETS = import.meta.glob<{ default: OnsetMap }>('../data/music/beatmaps/*.onsets.json');
async function onsetsOf(track: string): Promise<OnsetMap | null> {
  const f = ONSETS[`../data/music/beatmaps/${track}.onsets.json`] ?? ONSETS[`../data/music/beatmaps/${track.split('.')[0]}.onsets.json`];
  if (!f || track.includes('.')) return null;
  try {
    return (await f()).default;
  } catch {
    return null;
  }
}

let playing: MomentoRun | null = null;

export const filmPlaying = () => !!playing;

/** the SALTAR chip (skippable films) */
function skipChip(run: MomentoRun): Container {
  const c = new Container();
  const t = new Text({ text: 'SALTAR  ›', style: { fontFamily: 'Space Grotesk', fontWeight: '600', fontSize: 22, fill: 0xf2ede2, letterSpacing: 4 } });
  t.anchor.set(0.5);
  const w = t.width + 48;
  const g = new Graphics().roundRect(-w / 2, -26, w, 52, 26).fill({ color: 0x07050d, alpha: 0.55 }).roundRect(-w / 2, -26, w, 52, 26).stroke({ width: 2, color: 0xf2ede2, alpha: 0.5 });
  c.addChild(g, t);
  // bottom right (the pause «II» lives top right; subtitles sit centred)
  const v = run.k.view;
  c.position.set(v.x + v.w - w / 2 - 40, v.y + v.h - 60);
  c.eventMode = 'static';
  c.cursor = 'pointer';
  c.on('pointertap', (e) => {
    e.stopPropagation();
    run.finish('exited');
  });
  return c;
}

/**
 * «Continue» gates: at each gate the clock stops (the picture holds, the puppets breathe) and a button waits for a tap.
 * If the pause menu resumes the clock while a gate is up, the gate holds it again.
 */
function watchGates(run: MomentoRun, gates: GateAt[]): () => void {
  let i = 0;
  let ui: Container | null = null;
  const tick = () => {
    if (ui) {
      if (!run.clock.paused) run.clock.pause(true);
      return;
    }
    if (i >= gates.length || run.k.m < gates[i].m) return;
    const g = gates[i];
    run.clock.pause(true);
    ui = gateButton(run, g, () => {
      ui?.destroy({ children: true });
      ui = null;
      i++;
      run.clock.pause(false);
    });
  };
  Ticker.shared.add(tick);
  return () => {
    Ticker.shared.remove(tick);
    ui?.destroy({ children: true });
    ui = null;
  };
}
/** free touches: invisible round buttons over the set's hotspots, moved every frame */
function watchTouches(run: MomentoRun): () => void {
  const stage = run.k.stage as unknown as FilmStage;
  const pool = new Map<string, Container>();
  const layer = new Container();
  run.k.layers.ui.addChildAt(layer, 0);
  const tick = () => {
    const spots = stage.hotspotsNow();
    const seen = new Set<string>();
    for (const h of spots) {
      seen.add(h.name);
      let c = pool.get(h.name);
      if (!c) {
        const cc = new Container();
        cc.eventMode = 'static';
        cc.cursor = 'pointer';
        cc.on('pointertap', (e) => {
          e.stopPropagation();
          stage.tapHotspot(h.name);
        });
        layer.addChild(cc);
        pool.set(h.name, (c = cc));
      }
      c.position.set(h.x, h.y);
      c.hitArea = new Circle(0, 0, h.r);
      c.visible = true;
    }
    for (const [n, c] of pool) if (!seen.has(n)) c.visible = false;
  };
  Ticker.shared.add(tick);
  return () => {
    Ticker.shared.remove(tick);
    layer.destroy({ children: true });
  };
}

/** quiet windows (FilmDef.quiet): the film's music ducks deep while film time is inside one (FILM-ACTO4) */
function watchQuiet(run: MomentoRun, wins: [number, number][]): () => void {
  let held = false;
  const set = (on: boolean) => {
    if (on === held) return;
    held = on;
    audioApi.duck(on, 40, 'film-quiet');
  };
  const tick = () => set(wins.some(([a, b]) => run.k.m >= a && run.k.m < b));
  Ticker.shared.add(tick);
  return () => {
    Ticker.shared.remove(tick);
    set(false);
  };
}

function gateButton(run: MomentoRun, g: GateAt, done: () => void): Container {
  const c = new Container();
  const t = new Text({ text: g.label.toUpperCase(), style: { fontFamily: 'Space Grotesk', fontWeight: '600', fontSize: 30, fill: 0xf6f1e7, letterSpacing: 6 } });
  t.anchor.set(0.5);
  const w = t.width + 80;
  const glow = new Graphics().roundRect(-w / 2 - 10, -42, w + 20, 84, 42).fill({ color: 0xffd9a0, alpha: 0.18 });
  const g2 = new Graphics().roundRect(-w / 2, -32, w, 64, 32).fill({ color: 0x07050d, alpha: 0.6 }).roundRect(-w / 2, -32, w, 64, 32).stroke({ width: 2, color: 0xf6f1e7, alpha: 0.7 });
  c.addChild(glow, g2, t);
  const v = run.k.view;
  const anch = typeof g.at === 'string' ? run.k.stage.anchor?.(g.at, run.k) : g.at;
  c.position.set(anch?.[0] ?? 960, anch?.[1] ?? v.y + v.h - 150);
  c.eventMode = 'static';
  c.cursor = 'pointer';
  let tt = 0;
  const pulse = (tk: Ticker) => {
    if (c.destroyed) return void Ticker.shared.remove(pulse);
    tt += tk.deltaMS / 1000;
    glow.alpha = 0.6 + 0.4 * Math.sin(tt * 2.4);
  };
  Ticker.shared.add(pulse);
  c.on('pointertap', (e) => {
    e.stopPropagation();
    Ticker.shared.remove(pulse);
    done();
  });
  run.k.layers.ui.addChild(c);
  return c;
}

// ------------------------------------------------------------------ (agent FINAL) warm films · held frames · music hand-overs
/**
 * EL FINAL (the owner, after playing it: «muchas pantallas de carga… se pierde esa sensación de "puta murió"»):
 *  - preloadFilm(id): while a film (or a light playable piece) is on screen, the NEXT film is built and baked off screen
 *    (MomentoRun `defer`, a polite baker) and its song decoded, so playFilm(id) starts on the cut — no loading screen.
 *  - `hold`: a film that ends keeps its last frame up (the game scene doesn't flash between two films). The next film
 *    mounts over it; or the caller lets it go with releaseFilmHold(fade) — and while it is up a scene can change under it.
 *  - FilmDef.keep / join / carry: one song across several films and playable pieces, instead of a restart per film.
 *  - `next`: called on the film's last frame, BEFORE it gives the music back — the caller sets what comes next (a state,
 *    a quiet hold) so the hand-over crossfades instead of dipping into the island's music.
 */
interface Built {
  def: FilmDef;
  seen: boolean;
  mode: SkipMode;
  run: MomentoRun;
  /** its track is registered and plays (else its own grid, silent) */
  music: boolean;
  wantSound: boolean;
  audioReady: Promise<boolean>;
  segueRef: string | null;
}
interface Warm {
  id: string;
  seen: boolean;
  ready: Promise<Built | null>;
  built: Built | null;
  dropped: boolean;
  /** where its bake reports (a play that caught it mid-bake points this at its loading screen) */
  sink: ((p: number, label: string) => void) | null;
  timer: ReturnType<typeof setTimeout> | null;
  gc: () => void;
}
const warm = new Map<string, Warm>();
/** a warm film nobody played within this long is dropped (its textures and decoded song freed) */
export const WARM_TTL_MS = 180_000;

// one GC pause for every warm film, the playing one and a held frame (pauseTextureGC nests by keeping the outer state)
let gcN = 0;
let gcRestore: (() => void) | null = null;
function gcHold(): () => void {
  if (gcN++ === 0) gcRestore = pauseTextureGC(game.pixi.renderer as unknown as GcHost);
  let done = false;
  return () => {
    if (done) return;
    done = true;
    if (--gcN === 0) {
      gcRestore?.();
      gcRestore = null;
    }
  };
}

// the player reports a variation by its CANONICAL ref ('amb.fut.jefe.grave' for 'fut.jefe.grave') and the clock
// compares refs: hand it the canonical one, or the song never «arrives»
const canon = (ref: string) => resolveTrack(ref)?.ref ?? ref;

interface BuildOpts {
  seen: boolean;
  scrub?: boolean;
  quality?: 'high' | 'low';
  noInvite?: boolean;
  /** may show the sound invitation (a play); a warm-up never asks: it decodes only when the sound is already on */
  ask: boolean;
  /** baked while another film plays (asked before each bake job) */
  polite?: () => boolean;
  progress: (p: number, label: string) => void;
}
/** everything a film needs before its first frame: its stage built and baked (off screen), its song decoded */
async function build(def: FilmDef, o: BuildOpts): Promise<Built> {
  const mode = skipMode(def, o.seen);
  const registered = def.track ? await audioApi.beatMap(def.track).catch(() => null) : null;
  const trackMap = trackMapOf(def, registered);
  if (def.track && !trackMap) console.warn('[film] sin mapa de pulsos, se usa la rejilla sintética', def.track);
  const map = timeBase(def, trackMap);
  if (import.meta.env.DEV) {
    const w = validateFilm(def, map);
    if (w.length) console.warn(`[film] ${def.id}:`, w);
  }
  // the music plays only once the track is registered (a bundled map alone keeps the film silent on its grid)
  const music = !!def.track && !!registered && !o.scrub;
  let wantSound = false;
  if (music) {
    if (o.noInvite) wantSound = true;
    else if (!o.ask) wantSound = soundIsOn() || settings.soundInvite === 'on';
    else
      try {
        wantSound = (await (await import('../audio/invite')).ensureAudioInvited()) === 'on';
      } catch {
        wantSound = false;
      }
  }
  // (FILM-ACTO3) a segue: the second track is decoded too, so its quantized hand-over lands exactly on the bar
  const sg = music ? segueOf(def, trackMap) : null;
  const audioReady = wantSound && audio.ctx ? Promise.all([audioApi.prepare(def.track!), sg ? audioApi.prepare(sg.ref) : Promise.resolve(true)]).then((r) => r[0]) : Promise.resolve(false);
  const segueRef = sg && wantSound && audio.ctx ? sg.ref : null;
  const r = game.pixi.renderer;
  const pxScale = game.scale * r.resolution;
  const onsets = def.track ? await onsetsOf(def.track) : null;
  const mdef = toMomentoDef(def, async () => (k: unknown) => new FilmStage(k as never, def, { pxScale, live: !o.scrub, onProgress: o.progress, polite: o.polite }), trackMap);
  const run = new MomentoRun(music ? { ...mdef, track: canon(mdef.track) } : mdef, map, {
    renderer: r,
    host: game.root,
    view: game.view,
    pxScale,
    replay: mode !== 'never',
    scrub: o.scrub,
    quality: o.quality ?? (import.meta.env.DEV ? ((new URLSearchParams(location.search).get('mq') as 'high' | 'low' | null) ?? undefined) : undefined),
    audio: wantSound,
    onsets,
    segue: sg ? { ...sg, ref: canon(sg.ref) } : undefined,
    defer: true,
  });
  try {
    await run.prepare();
  } catch (e) {
    run.dispose();
    if (wantSound && def.track) audioApi.unprepare(def.track);
    if (segueRef) audioApi.unprepare(segueRef);
    throw e;
  }
  return { def, seen: o.seen, mode, run, music, wantSound, audioReady, segueRef };
}
function disposeBuilt(b: Built) {
  b.run.dispose();
  if (b.wantSound && b.def.track) audioApi.unprepare(b.def.track);
  if (b.segueRef) audioApi.unprepare(b.segueRef);
}
function dropWarm(w: Warm) {
  if (w.dropped) return;
  w.dropped = true;
  if (w.timer) clearTimeout(w.timer);
  if (warm.get(w.id) === w) warm.delete(w.id);
  void w.ready.then((b) => {
    if (b) disposeBuilt(b);
    w.gc();
  });
}

/**
 * Warm a film ahead (agent FINAL): built and baked off screen, its song decoded, ready for playFilm(id) to start on the
 * cut. `after` (ms): start a little later (the film on screen first settles its own opening). Resolves true when ready.
 * A warm film nobody plays is dropped after WARM_TTL_MS. Idempotent per id (a different `seen` rebuilds it).
 */
export function preloadFilm(id: string, o: { seen?: boolean; after?: number } = {}): Promise<boolean> {
  const def = getFilm(id);
  if (!def) return Promise.resolve(false);
  const seen = !!o.seen;
  const had = warm.get(id);
  if (had && had.seen === seen && !had.dropped) return had.ready.then((b) => !!b);
  if (had) dropWarm(had);
  // a film with music when the sound was never answered: the invitation belongs to its play (no warm-up)
  if (def.track && !soundIsOn() && settings.soundInvite === null) return Promise.resolve(false);
  const w: Warm = { id, seen, ready: Promise.resolve(null), built: null, dropped: false, sink: null, timer: null, gc: gcHold() };
  w.ready = (async () => {
    if (o.after) await new Promise((r) => setTimeout(r, o.after));
    if (w.dropped) return null;
    try {
      // polite only while a film is on screen; with nothing playing (a dark wait, a held frame) it bakes at full speed
      const b = await build(def, { seen, ask: false, polite: () => !!playing, progress: (p, label) => w.sink?.(p, label) });
      if (w.dropped) {
        disposeBuilt(b);
        return null;
      }
      w.built = b;
      return b;
    } catch (e) {
      console.warn('[film] no se pudo precargar', id, e);
      if (warm.get(id) === w) warm.delete(id);
      return null;
    }
  })();
  w.timer = setTimeout(() => dropWarm(w), WARM_TTL_MS);
  warm.set(id, w);
  return w.ready.then((b) => !!b);
}
/** drop warm films (all, or one): their textures and decoded songs are freed */
export function dropPreloads(id?: string) {
  for (const w of [...warm.values()]) if (!id || w.id === id) dropWarm(w);
}
export const preloaded = () => [...warm.values()].map((w) => ({ id: w.id, ready: !!w.built }));

// the held frame of the last film (its picture stays up until the next film or releaseFilmHold)
interface Held {
  id: string;
  run: MomentoRun;
  hidden: { c: { renderable: boolean }; was: boolean }[];
  gc: () => void;
  timer: ReturnType<typeof setTimeout>;
}
let held: Held | null = null;
function setHeld(h: Held | null) {
  held = h;
  // DEV (headless checks): the screen is a film's held last frame
  if (import.meta.env.DEV) (window as unknown as { __filmHeld: string | null }).__filmHeld = h ? h.id : null;
}
/** a film's last frame is still on screen (FilmPort.holding) */
export const filmHolding = () => !!held;
/** the longest a held frame waits for whoever comes next (then it lets go by itself) */
export const HOLD_MAX_MS = 20_000;
/**
 * Let the held frame go (agent FINAL): the game scenes render again under it at once (a scene changed meanwhile can
 * draw its first frame there), and the frame fades over `fade` s. Resolves when it is gone. No-op without a hold.
 */
export function releaseFilmHold(fade = 0): Promise<void> {
  const h = held;
  if (!h) return Promise.resolve();
  setHeld(null);
  clearTimeout(h.timer);
  for (const x of h.hidden) x.c.renderable = x.was;
  const end = () => {
    h.run.dispose();
    h.gc();
  };
  if (fade <= 0) {
    end();
    return Promise.resolve();
  }
  // the run's root is the last thing it put on its host: fade its picture out (the post keeps drawing its last frame)
  const root = h.run.k.layers.bg.parent?.parent ?? null;
  return new Promise<void>((res) => {
    let t = 0;
    const tick = (tk: Ticker) => {
      t += tk.deltaMS / 1000;
      if (root && !root.destroyed) root.alpha = Math.max(0, 1 - t / fade);
      if (t >= fade) {
        Ticker.shared.remove(tick);
        end();
        res();
      }
    };
    Ticker.shared.add(tick);
  });
}

/** quiet a deck that carries on under a film: [film s, dB] points, linear between them */
function duckAt(pts: [number, number][], m: number): number {
  if (!pts.length) return 0;
  if (m <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [a, da] = pts[i - 1];
    const [b, db] = pts[i];
    if (m <= b) return da + ((db - da) * (m - a)) / Math.max(1e-6, b - a);
  }
  return pts[pts.length - 1][1];
}
/** a film riding music it didn't start (carry / join): its duck envelope and its dry cut, on the film clock */
function watchCarry(run: MomentoRun, def: FilmDef, joined: boolean): () => void {
  const c = def.carry;
  const pts: [number, number][] = joined ? [[0, def.join?.db ?? 0]] : (c?.duck ?? []);
  const KEY = 'film-carry';
  let cur = -1;
  let cut = false;
  const set = (db: number) => {
    const v = Math.round(Math.max(0, db) * 2) / 2;
    if (v === cur) return;
    cur = v;
    audio.unduck(KEY);
    if (v > 0) audio.duck(KEY, true, v);
  };
  const tick = () => {
    const m = run.k.m;
    if (!cut && c?.cut !== undefined && m >= c.cut) {
      cut = true;
      // «corte total»: whatever plays stops dry, and nothing of the game's comes back until the film ends
      audioApi.quiet(true, { key: 'film-cut', fade: 0.03 });
      if (audioApi.currentTrack()) audioApi.release(0.03);
      return;
    }
    if (!cut) set(duckAt(pts, m));
  };
  Ticker.shared.add(tick);
  tick();
  return () => {
    Ticker.shared.remove(tick);
    audio.unduck(KEY);
    if (cut) audioApi.quiet(false, { key: 'film-cut', fade: 0.03 });
  };
}

export interface PlayHandOff {
  /** keep the last frame up when it ends (releaseFilmHold, or the next film, takes it down) */
  hold?: boolean;
  /** called on the last frame (not when the scene took it away), before the film gives the music back */
  next?: () => void;
  /** if it isn't warm yet, wait on plain black instead of the titled loading screen (it continues what came before) */
  bare?: boolean;
  /** the caller takes its song over when it ends (FilmDef.keep is honoured only then: a replay never leaves it looping) */
  keep?: boolean;
}

export async function playFilm(idOrDef: string | FilmDef, o: PlayFilmOpts & PlayHandOff = {}): Promise<FilmResult | null> {
  const def = typeof idOrDef === 'string' ? getFilm(idOrDef) : idOrDef;
  if (!def || playing) return null;
  const seen = !!o.seen;
  // a warm one (same skip rule) starts on the cut; any other warm copy of it goes
  let w = typeof idOrDef === 'string' && !o.scrub ? (warm.get(def.id) ?? null) : null;
  if (w && w.seen !== seen) {
    dropWarm(w);
    w = null;
  }
  if (w) {
    warm.delete(def.id);
    if (w.timer) clearTimeout(w.timer);
  }
  hush('film', true);
  // join: its track is already playing (kept by the film before) → it rides that deck, no cue, no solo
  const joined = !!def.join && !!def.track && !o.scrub && audioApi.currentTrack() === canon(def.track);
  const carry = !!def.carry && !def.track && !o.scrub;
  // the loading screen only when nothing is ready AND nothing holds the screen (a held frame is the film's own cover)
  const prev = held;
  // this film claims the held frame: it stays up however long this one takes to be ready (no timeout)
  if (prev) clearTimeout(prev.timer);
  const needLoader = !w?.built && !prev;
  const mkLoader = () => (o.bare ? new BareLoader(game.root, game.view) : new FilmLoader(game.root, game.view, def.title, def.loader?.style ?? 'default', def.loader?.caption ?? 'PELÍCULA', settings.reduceMotion));
  const loader = needLoader ? mkLoader() : null;
  let built: Built | null = null;
  let soloed = false;
  let segueRef: string | null = null;
  let releaseGC: (() => void) | null = null;
  let ended: FilmResult['end'] = 'aborted';
  let stopQuiet: (() => void) | null = null;
  let stopCarry: (() => void) | null = null;
  let keepHeld = false;
  const hidden: { c: { renderable: boolean }; was: boolean }[] = [];
  try {
    // (FILM-ACTO1) no texture GC while the film plays: idle textures re-uploaded after 60 s were stalls (texturegc.ts)
    releaseGC = gcHold();
    if (w) {
      w.sink = loader ? (p, label) => loader.progress(p, label) : null;
      built = await w.ready;
      w.gc();
      if (built && built.mode !== skipMode(def, seen)) {
        disposeBuilt(built);
        built = null;
      }
    }
    const music0 = !!def.track && !o.scrub;
    // (a film with its song: everything else is hushed — the decks playing now fade out, the song comes in)
    if (music0 && !joined) {
      audioApi.solo(true, { key: 'film', fade: 0.3, decks: true });
      soloed = true;
    }
    if (!built) {
      // not warm (or its warm-up failed): built now, behind the loading screen — or behind the held frame
      const lo = loader ?? (prev ? null : mkLoader());
      try {
        built = await build(def, { seen, scrub: o.scrub, quality: o.quality, noInvite: o.noInvite, ask: true, progress: (p, label) => lo?.progress(p, label) });
      } finally {
        if (lo && lo !== loader) lo.destroy();
      }
    }
    const b = built;
    const run = b.run;
    if (soloed && !b.music) {
      audioApi.solo(false, { key: 'film', fade: 0.6, decks: true });
      soloed = false;
    }
    segueRef = b.segueRef;
    playing = run;
    // a carried song: crossfaded at the same file position to its thinner mix (FilmDef.carry.to)
    if (carry && def.carry?.to) {
      const now = audioApi.nowPlaying();
      if (now && now.ref !== canon(def.carry.to)) audioApi.cue(def.carry.to, { at: now.pos, quantize: 'now', fadeIn: 2.2, fadeOut: 2.2, loop: true, narrative: true });
    }
    run.mount(game.root);
    // the loading screen stays on top of the first frame until it fades
    if (loader) game.root.addChild(loader.root);
    if (b.mode === 'button' && !o.scrub) run.k.layers.ui.addChild(skipChip(run));
    for (const c of [scenes.sceneLayer, scenes.overlayLayer]) {
      hidden.push({ c, was: prev ? (prev.hidden.find((x) => x.c === c)?.was ?? c.renderable) : c.renderable });
      c.renderable = false;
    }
    // the frame held by the film before goes now that this one is up (the scenes stay hidden: this film owns them)
    if (prev) {
      setHeld(null);
      clearTimeout(prev.timer);
      prev.run.dispose();
      prev.gc();
    }
    if (import.meta.env.DEV) installDev(run, def);
    const withAudio = joined || !b.music ? false : await Promise.race([b.audioReady, new Promise<boolean>((res) => setTimeout(() => res(false), 9000))]);
    if (loader) await loader.hide();
    const stopGates = o.scrub ? null : watchGates(run, gateTimes(def));
    const stopTouches = o.scrub ? null : watchTouches(run);
    if (b.music && b.wantSound && !joined && def.quiet?.length) stopQuiet = watchQuiet(run, def.quiet);
    if (joined || carry) stopCarry = watchCarry(run, def, joined);
    const res = await run.play(withAudio);
    stopGates?.();
    stopTouches?.();
    ended = res.end;
    try {
      if (res.end !== 'aborted') o.next?.();
    } catch (e) {
      console.warn('[film] next', e);
    }
    stopCarry?.();
    stopCarry = null;
    const dry = res.end === 'done' && !!def.cutDry;
    if (joined) audioApi.release(dry ? 0.04 : 0.6);
    else if (b.music && b.wantSound) {
      // keep: the song goes on looping from where it is (the next film joins it, the caller releases it)
      const kept = !!def.keep && !!o.keep && res.end === 'done' && audioApi.keepLooping(def.track!);
      if (!kept) audioApi.release(res.end === 'done' ? (def.cutDry ? 0.04 : 0.9) : 0.4);
    }
    keepHeld = !!o.hold && res.end !== 'aborted';
    return { id: def.id, end: res.end, skip: b.mode, inputs: res.results };
  } catch (e) {
    console.error('[film]', e);
    return null;
  } finally {
    stopQuiet?.();
    stopCarry?.();
    loader?.destroy();
    if (w) w.sink = null;
    // (a deck keeps its own reference to the decoded song: a kept / fading one goes on)
    if (built?.wantSound && def.track) audioApi.unprepare(def.track);
    if (segueRef) audioApi.unprepare(segueRef);
    const run = built?.run ?? null;
    if (run && keepHeld) {
      // the last frame stays up: its UI (pause «II», chips) goes, its input is already deaf (ended)
      run.k.layers.ui.visible = false;
      const h: Held = { id: def.id, run, hidden: hidden.splice(0), gc: releaseGC ?? (() => undefined), timer: setTimeout(() => void releaseFilmHold(0.6), HOLD_MAX_MS) };
      releaseGC = null;
      setHeld(h);
      if (import.meta.env.DEV) (window as unknown as { __film: unknown }).__film = { last: { end: ended, slow: run.slow.slice(-40), clips: run.host.slow.slice(-40) } };
    } else {
      for (const h of hidden) h.c.renderable = h.was;
      if (prev && held === prev) void releaseFilmHold(0);
      if (run && !(o.scrub && import.meta.env.DEV)) {
        if (import.meta.env.DEV) (window as unknown as { __film: unknown }).__film = { last: { end: ended, slow: run.slow.slice(-40), clips: run.host.slow.slice(-40) } };
        run.dispose();
      }
    }
    releaseGC?.();
    playing = null;
    if (soloed) audioApi.solo(false, { key: 'film', fade: 0.6, decks: true });
    hush('film', false);
  }
}

function installDev(run: MomentoRun, def: FilmDef) {
  const stage = run.k.stage as unknown as FilmStage;
  (window as unknown as { __film: unknown }).__film = {
    run,
    stage,
    def,
    /** draw any instant (scrub) */
    render: (m: number) => run.frame(m),
    length: () => run.score.mCut,
    info: () => ({ ...stage.info(), m: run.clock.m, mode: run.clock.mode, quality: run.quality, warnings: run.score.warnings }),
    pause: (on = true) => run.setPaused(on),
    slow: () => ({ frames: run.slow.slice(-60), clips: run.host.slow.slice(-60) }),
  };
}
