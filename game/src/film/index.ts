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
import { settings } from '../core/settings';
import { hush } from '../ui/hush';
import { MomentoRun } from '../momentos/runner';
import type { Judgement, OnsetMap } from '../momentos/types';
import type { FilmDef, SkipMode } from './types';
import { gateTimes, segueOf, skipMode, timeBase, toMomentoDef, trackMapOf, validateFilm, type GateAt } from './timeline';
import { FilmStage } from './stage';
import { FilmLoader } from './loader';
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

export async function playFilm(idOrDef: string | FilmDef, o: PlayFilmOpts = {}): Promise<FilmResult | null> {
  const def = typeof idOrDef === 'string' ? getFilm(idOrDef) : idOrDef;
  if (!def || playing) return null;
  const mode = skipMode(def, !!o.seen);
  const registered = def.track ? await audioApi.beatMap(def.track).catch(() => null) : null;
  const trackMap = trackMapOf(def, registered);
  if (def.track && !trackMap) console.warn('[film] sin mapa de pulsos, se usa la rejilla sintética', def.track);
  const map = timeBase(def, trackMap);
  if (import.meta.env.DEV) {
    const w = validateFilm(def, map);
    if (w.length) console.warn(`[film] ${def.id}:`, w);
  }
  hush('film', true);
  // the music plays only once the track is registered (a bundled map alone keeps the film silent on its grid)
  const music = !!def.track && !!registered && !o.scrub;
  if (music) audioApi.solo(true, { key: 'film', fade: 0.3, decks: true });
  const loader = new FilmLoader(game.root, game.view, def.title, def.loader?.style ?? 'default', def.loader?.caption ?? 'PELÍCULA', settings.reduceMotion);
  let run: MomentoRun | null = null;
  let segueRef: string | null = null;
  let restoreGC: (() => void) | null = null;
  let ended: FilmResult['end'] = 'aborted';
  let stopQuiet: (() => void) | null = null;
  const hidden: { c: { renderable: boolean }; was: boolean }[] = [];
  try {
    let wantSound = false;
    if (music) {
      if (o.noInvite) wantSound = true;
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
    if (sg && wantSound && audio.ctx) segueRef = sg.ref;
    const r = game.pixi.renderer;
    const pxScale = game.scale * r.resolution;
    const onsets = def.track ? await onsetsOf(def.track) : null;
    const mdef = toMomentoDef(def, async () => (k: unknown) => new FilmStage(k as never, def, { pxScale, live: !o.scrub, onProgress: (p, label) => loader.progress(p, label) }), trackMap);
    // the player reports a variation by its CANONICAL ref ('amb.fut.jefe.grave' for 'fut.jefe.grave') and the clock
    // compares refs: hand it the canonical one, or the song never «arrives»
    const canon = (ref: string) => resolveTrack(ref)?.ref ?? ref;
    run = new MomentoRun(music ? { ...mdef, track: canon(mdef.track) } : mdef, map, {
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
    });
    playing = run;
    // (FILM-ACTO1) no texture GC while the film plays: idle textures re-uploaded after 60 s were stalls (texturegc.ts)
    restoreGC = pauseTextureGC(r as unknown as GcHost);
    await run.prepare();
    // the loading screen stays on top of the first frame until it fades
    game.root.addChild(loader.root);
    if (mode === 'button' && !o.scrub) run.k.layers.ui.addChild(skipChip(run));
    for (const c of [scenes.sceneLayer, scenes.overlayLayer]) {
      hidden.push({ c, was: c.renderable });
      c.renderable = false;
    }
    if (import.meta.env.DEV) installDev(run, def);
    const withAudio = await Promise.race([audioReady, new Promise<boolean>((res) => setTimeout(() => res(false), 9000))]);
    await loader.hide();
    const stopGates = o.scrub ? null : watchGates(run, gateTimes(def));
    const stopTouches = o.scrub ? null : watchTouches(run);
    if (music && wantSound && def.quiet?.length) stopQuiet = watchQuiet(run, def.quiet);
    const res = await run.play(withAudio);
    stopGates?.();
    stopTouches?.();
    ended = res.end;
    if (music && wantSound) audioApi.release(res.end === 'done' ? (def.cutDry ? 0.04 : 0.9) : 0.4);
    return { id: def.id, end: res.end, skip: mode, inputs: res.results };
  } catch (e) {
    console.error('[film]', e);
    return null;
  } finally {
    stopQuiet?.();
    restoreGC?.();
    loader.destroy();
    for (const h of hidden) h.c.renderable = h.was;
    if (def.track && music) audioApi.unprepare(def.track);
    if (segueRef) audioApi.unprepare(segueRef);
    if (run && !(o.scrub && import.meta.env.DEV)) {
      const r = run;
      if (import.meta.env.DEV) (window as unknown as { __film: unknown }).__film = { last: { end: ended, slow: r.slow.slice(-40), clips: r.host.slow.slice(-40) } };
      r.dispose();
    }
    playing = null;
    if (music) audioApi.solo(false, { key: 'film', fade: 0.6, decks: true });
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
