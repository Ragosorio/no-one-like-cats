/**
 * THE KIT — what a Momento's stage and every verb get to work with (docs/part-ii/29 §5).
 *
 *  - CLIPS: everything that happens is a Clip [t0, t1) in momento time with mount / update(lt) / unmount. The ClipHost
 *    mounts what is active at m and unmounts the rest, so ANY instant can be drawn (seek, scrub, pause) and the picture
 *    is a pure function of time — that is what keeps it on the beat and makes contact sheets exact.
 *  - CAMERA: the base framing comes from key tracks ('cam.x', 'cam.y', 'cam.zoom', 'cam.rot'); clips add punches, shakes,
 *    rolls and whip offsets on top every frame (Camera.add*). Reduce motion scales the additive part.
 *  - FRAME FX: impact / flash / aberration are per-frame maxima that clips push (k.fx); the post filter shows them.
 */
import { Container, Renderer, Sprite, Text, TextStyle, Texture, type TextStyleOptions } from 'pixi.js';
import type { BeatMap } from '../../audio/beatgrid';
import type { Args, Cue, ResolvedScore } from '../types';
import type { FlashGuard } from '../flash';
import type { Palette } from './palette';
import { vnoise } from './draw';

export const W = 1920;
export const H = 1080;

export interface Clip {
  t0: number;
  t1: number;
  /** draw order inside its layer (higher = on top) */
  z?: number;
  mount?(k: Kit): void;
  update(lt: number, k: Kit): void;
  unmount?(k: Kit): void;
  /** internal */
  _on?: boolean;
  /** DEV: the verb that made it (slow-clip report) */
  _tag?: string;
}
export type VerbFn = (k: Kit, args: Args, cue: Cue) => Clip | Clip[] | void | null;

/** a clip from plain functions */
export function clip(t0: number, dur: number, f: { mount?: (k: Kit) => void; update?: (lt: number, k: Kit) => void; unmount?: (k: Kit) => void; z?: number }): Clip {
  return { t0, t1: t0 + Math.max(0.001, dur), z: f.z, mount: f.mount, update: f.update ?? (() => undefined), unmount: f.unmount };
}

export class ClipHost {
  private clips: Clip[] = [];
  private dirty = false;
  private next = 0;
  private active: Clip[] = [];
  private lastM = -Infinity;
  constructor(private k: Kit) {}
  add(c: Clip | Clip[] | void | null) {
    if (!c) return;
    const list = Array.isArray(c) ? c : [c];
    this.clips.push(...list);
    if (list.length) this.dirty = true;
  }
  get count() {
    return this.clips.length;
  }
  get activeCount() {
    return this.active.length;
  }
  update(m: number) {
    const k = this.k;
    if (m < this.lastM - 1e-6) {
      // seek backward: start over
      for (const c of this.active) this.off(c);
      this.active = [];
      this.next = 0;
    }
    if (this.dirty) {
      this.clips.sort((a, b) => a.t0 - b.t0);
      this.dirty = false;
      this.next = 0;
    }
    while (this.next < this.clips.length && this.clips[this.next].t0 <= m) {
      const c = this.clips[this.next++];
      if (!c._on && m < c.t1) this.on(c);
    }
    for (let i = this.active.length - 1; i >= 0; i--) {
      const c = this.active[i];
      if (m >= c.t1 || m < c.t0) {
        this.off(c);
        this.active.splice(i, 1);
      }
    }
    this.active.sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
    for (const c of this.active) {
      const t = import.meta.env.DEV ? performance.now() : 0;
      try {
        c.update(m - c.t0, k);
      } catch (e) {
        console.warn('[momento] clip', e);
      }
      if (import.meta.env.DEV) this.note(m, 'update', c, t);
    }
    this.lastM = m;
  }
  /** DEV: clips that ate a frame ([m, phase, ms, verb]) */
  slow: [number, string, number, string][] = [];
  private note(m: number, phase: string, c: Clip, t: number) {
    const ms = performance.now() - t;
    if (ms > 8 && this.slow.length < 200) this.slow.push([Math.round(m * 100) / 100, phase, Math.round(ms), c._tag ?? '?']);
  }
  private on(c: Clip) {
    c._on = true;
    this.active.push(c);
    const t = import.meta.env.DEV ? performance.now() : 0;
    try {
      c.mount?.(this.k);
    } catch (e) {
      console.warn('[momento] mount', e);
    }
    if (import.meta.env.DEV) this.note(this.k.m, 'mount', c, t);
  }
  private off(c: Clip) {
    if (!c._on) return;
    c._on = false;
    try {
      c.unmount?.(this.k);
    } catch (e) {
      console.warn('[momento] unmount', e);
    }
  }
  dispose() {
    for (const c of this.active) this.off(c);
    this.active = [];
    this.clips = [];
  }
}

// ------------------------------------------------------------------ camera
export class Camera {
  x = W / 2;
  y = H / 2;
  zoom = 1;
  rot = 0;
  private dz = 0;
  private dx = 0;
  private dy = 0;
  private dr = 0;
  motion = 1;
  /** a zoom punch (+0.08 = 8 % in) */
  punch(z: number) {
    this.dz += z * this.motion;
  }
  shake(amp: number, m: number, seed = 1, freq = 22) {
    const a = amp * this.motion;
    this.dx += vnoise(m * freq, seed) * a;
    this.dy += vnoise(m * freq, seed + 77) * a;
  }
  roll(r: number) {
    this.dr += r * this.motion;
  }
  offset(dx: number, dy: number) {
    this.dx += dx * this.motion;
    this.dy += dy * this.motion;
  }
  begin(x: number, y: number, zoom: number, rot: number, motion: number) {
    this.x = x;
    this.y = y;
    this.zoom = zoom;
    this.rot = rot;
    this.motion = motion;
    this.dz = this.dx = this.dy = this.dr = 0;
  }
  apply(world: Container) {
    world.pivot.set(this.x, this.y);
    world.position.set(W / 2 + this.dx, H / 2 + this.dy);
    world.scale.set(this.zoom * (1 + this.dz));
    world.rotation = this.rot + this.dr;
  }
  /** a world point → design-box screen point (current frame) */
  toScreen(wx: number, wy: number): [number, number] {
    const z = this.zoom * (1 + this.dz);
    const r = this.rot + this.dr;
    const lx = (wx - this.x) * z;
    const ly = (wy - this.y) * z;
    return [W / 2 + this.dx + lx * Math.cos(r) - ly * Math.sin(r), H / 2 + this.dy + lx * Math.sin(r) + ly * Math.cos(r)];
  }
}

// ------------------------------------------------------------------ text cache (no Text creation mid-performance)
export class TextCache {
  private map = new Map<string, Texture>();
  constructor(private renderer: Renderer) {}
  get(text: string, style: TextStyleOptions): Texture {
    const key = `${text}\u0000${JSON.stringify(style)}`;
    let t = this.map.get(key);
    if (!t) {
      const tx = new Text({ text, style: new TextStyle(style), resolution: 2 });
      t = this.renderer.generateTexture({ target: tx, resolution: 2 });
      tx.destroy();
      this.map.set(key, t);
    }
    return t;
  }
  sprite(text: string, style: TextStyleOptions, anchor = 0.5): Sprite {
    const s = new Sprite(this.get(text, style));
    s.anchor.set(anchor);
    return s;
  }
  get size() {
    return this.map.size;
  }
  dispose() {
    for (const t of this.map.values()) t.destroy(true);
    this.map.clear();
  }
}

// ------------------------------------------------------------------ the kit
export interface Layers {
  /** screen-space backdrop (sky) — under the world */
  bg: Container;
  /** camera space: the set */
  world: Container;
  /** camera space, over the set: projectiles, explosions, smoke */
  wfx: Container;
  /** screen space over the world: speed / focus lines, flashes */
  screen: Container;
  /** cut-ins and manga panels */
  panels: Container;
  /** onomatopoeia */
  type: Container;
  /** prompts, pause (never graded, never impact-framed) */
  ui: Container;
}
export interface FrameFx {
  impact: number;
  invert: boolean;
  impactAccent: number;
  flash: number;
  flashColor: number;
  aberr: number;
}

export interface StageApi {
  /** scene verbs ('cannon', 'lightUp'…) — merged over the toolkit's */
  verbs: Record<string, VerbFn>;
  /** build the set (async: paintings, bakes) */
  build(k: Kit): Promise<void>;
  /** draw the set at momento time m (props, world state) — before the clips */
  update(k: Kit, m: number): void;
  /** after the clips (apply what they asked: pose overrides, follow-ups) */
  late?(k: Kit, m: number): void;
  /** named screen points for prompts / cut-ins (design box) */
  anchor?(name: string, k: Kit): [number, number] | null;
  /** extra palettes this stage defines */
  palettes?: Record<string, Palette>;
  /** prop defaults */
  props?: Record<string, number | string>;
  /** text / sfx this stage will ask for (prewarmed) */
  prewarm?(k: Kit): void;
  /** (optional) the prompts in this Momento's colors (default: NEÓN CEL's) */
  promptTheme?: Partial<import('./prompts').PromptTheme>;
  /**
   * The stage's OWN full-screen post filters (optional): they run on the Momento's scene AFTER the toolkit post (grade,
   * impact, flash), so a Momento can have its own look (te ODIO: broken signal, stencil, photocopy). `live(k)` says
   * whether they are needed this frame (default: always) — off frames cost nothing. The stage owns / destroys them.
   */
  post?: { filters: import('pixi.js').Filter[]; live?(k: Kit): boolean };
  destroy(): void;
}

export interface Kit {
  renderer: Renderer;
  /** the visible design-box rect (wider than 1920×1080 on wide screens) */
  view: { x: number; y: number; w: number; h: number };
  layers: Layers;
  cam: Camera;
  /** current momento time and frame delta */
  m: number;
  dt: number;
  score: ResolvedScore;
  map: BeatMap;
  /** seconds per beat / bar */
  beat: number;
  bar: number;
  num(name: string, dflt?: number): number;
  str(name: string, dflt?: string): string;
  pal: Palette;
  /** the palette a cue's type is drawn in: fixed at its instant (a branch: its prompt's target), so it can be baked ahead */
  palFor(cue: Cue): Palette;
  guard: FlashGuard;
  fx: FrameFx;
  quality: 'high' | 'low';
  reduceMotion: boolean;
  reduceFlashes: boolean;
  /** no sound: the picture carries the beat */
  silent: boolean;
  text: TextCache;
  stage: StageApi;
  /** the actors' studio (baked paintings, puppets) */
  studio: import('./actor').Studio;
  /** stepped time ("on twos" = 12 fps, "on threes" = 8 fps) */
  step(m: number, fps?: number): number;
  /**
   * A stepping key that restarts ON every beat: on twos between beats, but the first step of each beat lands exactly
   * on it. Use it for anything that reacts to the music (Actor.pose({ step }), redraws keyed on steps).
   */
  beatStep(m: number, fps?: number): number;
  /** the song's per-stem onset tracks (kick, snare, perc, bass, melody, vox) — null when it has none */
  onsets: import('../types').OnsetMap | null;
  /** an onset track as objects, cached */
  onsetList(track: import('../types').OnsetTrack): import('../types').Onset[];
  /**
   * Envelope of a track at m: Σ strength × e^(−age/τ) over the last few onsets at or before m, capped at 1 (0 after
   * ~6τ), so a quiet onset in a roll still jumps. `min` ignores weak onsets. Drives the always-on reactions: every kick, accent, bass note has a visible purpose.
   */
  env(track: import('../types').OnsetTrack, m: number, tau?: number, min?: number): number;
  /** the last onset of a track at or before m (index in onsetList, the onset), or null */
  last(track: import('../types').OnsetTrack, m: number, min?: number): { i: number; o: import('../types').Onset } | null;
  /** add clips at runtime (a verb spawning follow-ups) */
  spawn(c: Clip | Clip[] | void | null): void;
  /** call another verb now (composition) */
  call(verb: string, args: Args, at: number): void;
  /** particles budget multiplier (low tier = 0.5) */
  density: number;
  /** how a prompt was judged so far (null = not yet) — clips branch their look on it (e.g. a ball that got batted) */
  judged(id: string): { r: import('../types').Judgement; at: number } | null;
  /** a prompt's live state (mash taps, hold start…) */
  prompt(id: string): import('../core').PromptState | null;
  /** the frozen previous screen (cold open), the player's crew, replay mode */
  snapshot: import('pixi.js').Texture | null;
  crew: string[];
  /**
   * A full-frame SHOT is on screen this frame (a clip sets it in its update): the world layers aren't drawn under it
   * (GPU), and the stage's world anchors give way to the shot's (`setAnchor`).
   */
  fullFrame: boolean;
  /** a clip publishes a screen point for this frame (a prompt riding a cannonball, a face in a close-up) */
  setAnchor(name: string, p: [number, number]): void;
  /** a clip published this anchor this frame (a full-frame shot owns it) */
  anchorOwned(name: string): boolean;
}
