/**
 * CINE — declarative scene timelines (docs/part-ii/20-estados-y-cine.md). Types only (no Pixi).
 *
 * A script is a list of STEPS. In a sequence, a step starts when the previous one ends (+ `after` s);
 * a step with `at` starts at that offset from the start of its sequence (in parallel); `async` starts it
 * and moves on. Every timed thing runs on the runner's own clock (elapsed time: FPS-independent,
 * pausable), so SALTAR can fold the rest of the script into its end state and an interruption can clean up.
 */
import type { WorldLook } from '../state/sys/worldState';
import type { MusicState } from '../audio/api';

export type Line = [speaker: string, text: string];
export type Ease = 'linear' | 'in' | 'out' | 'inOut' | 'outBack' | 'outCubic';
export type CineResult = 'done' | 'skipped' | 'interrupted';

/** a place in the scene: a named landmark ('faro', 'home', 'lagoon'…), an actor ('cat:<uid>', 'canelo'), or a point */
export type Target = string | { x: number; y: number };

export interface CameraCmd {
  /** 2D stages: a Target. 3D stages (regions): a world point [x, y, z] */
  to: Target | [number, number, number];
  zoom?: number;
  /** world-px offset added to the target (frame the sky above it, etc.) */
  offset?: [number, number];
  /** 3D orbit around `to` (regions): distance, pitch (rad, up from the horizon), yaw (rad) */
  dist?: number;
  pitch?: number;
  yaw?: number;
  dur?: number;
  ease?: Ease;
}
export interface WorldCmd {
  /** a registered world state id, or a patch merged onto the look the cine is heading to */
  to: string | Partial<WorldLook>;
  dur?: number;
  ease?: Ease;
}
export interface ActorCmd {
  /** 'all' | 'canelo' | 'cat:<uid>' | 'trait:<trait>' | 'near:<target>' */
  who: string;
  do: 'emote' | 'act' | 'hop' | 'look' | 'mark' | 'react';
  /** emote kind / act kind / look target / mark text ('!') / react kind */
  arg?: string;
  /** seconds between cats when `who` selects several */
  stagger?: number;
  /** look: seconds to keep looking */
  dur?: number;
}
export interface FxCmd {
  id: string;
  [k: string]: unknown;
}
export interface AudioCmd {
  state?: MusicState;
  cue?: string;
  release?: number | true;
  ambience?: string;
  level?: number;
  fade?: number;
  stinger?: string;
  gain?: number;
  duck?: boolean;
  /** the elegant «turn the sound on?» invitation (src/audio/invite.ts ensureAudioInvited) */
  invite?: boolean;
  /** wait for the playing track's next 'bar' | 'beat' | 'marker:<name>' | 'section:<name>' (max `maxWait` s) */
  sync?: string;
  maxWait?: number;
}
export interface SayCmd {
  /** lines of a story beat (data, e.g. historia.json) by index… */
  beat?: string;
  lines?: number[];
  /** …or literal lines */
  text?: Line[];
  /** blocking (default): waits until the player reads; false = a corner tip, the cine goes on */
  block?: boolean;
  dim?: number;
  /** steps fired (async) when line i of THIS say starts: «¿Ves? Otra.» + a burst of stars */
  onLine?: Record<number, Step | Step[]>;
}
export interface InteractCmd {
  target: Target;
  prompt?: string;
  /** seconds; on timeout the cine just moves on (the world keeps inviting through its own state) */
  timeout?: number;
}
export interface UiCmd {
  /** letterbox bars */
  bars?: boolean;
  /** the scene's HUD */
  hud?: boolean;
  /** the SALTAR button */
  skip?: boolean;
}

export interface StepTiming {
  /** offset (s) from the start of the enclosing sequence: runs in parallel with the rest */
  at?: number;
  /** delay (s) after the previous step of the sequence ended */
  after?: number;
  /** start it and move on (the sequence still waits for it before it ends) */
  async?: boolean;
  /** reduce-motion variant ('skip' = leave it out) */
  reduced?: Step | 'skip';
  /** run only when true */
  when?: (ctx: CineCtx) => boolean;
  /** a label for debugging/tests */
  id?: string;
}

/** drive a named stage parameter from its current value to `to` (0..1) over `dur` (the island rising from the
 *  sea, a glitch's strength…). SALTAR jumps it to `to`, like a world/camera move */
export interface DriveCmd {
  id: string;
  to: number;
  /** start value (default: whatever the stage reports, else 0) */
  from?: number;
  dur?: number;
  ease?: Ease;
}

export type Step = StepTiming &
  (
    | { camera: CameraCmd }
    | { drive: DriveCmd }
    | { world: WorldCmd }
    | { actor: ActorCmd }
    | { fx: FxCmd }
    | { audio: AudioCmd }
    | { say: SayCmd }
    | { interact: InteractCmd }
    | { wait: number }
    | { parallel: Step[] }
    | { seq: Step[] }
    | { persist: { beat: string } }
    | { ui: UiCmd }
    | { call: (ctx: CineCtx) => void | Promise<void> }
  );

export interface ReplayInfo {
  /** spoiler-safe title for Ajustes › VOLVER A VER */
  title: string;
  /** the beat key (or keys: any) that says the player has seen it */
  seen: string | string[];
  /** its place in the list (story order: 31.0, 31.1…) */
  order: number;
  /** a region cine: the 3D island it plays on (the replay sails there first) */
  region?: string;
  /** the region plays it by itself on entry (its whole visit IS the scene): the replay only sails there */
  enters?: boolean;
}

export interface CineScript {
  id: string;
  /** where it can play (a CineStage id): 'island' | 'region' */
  stage: string;
  /** listed in Ajustes › VOLVER A VER once seen (replays persist nothing: src/cine/replay.ts) */
  replay?: ReplayInfo;
  steps: Step[];
  /** default true */
  skippable?: boolean;
  /** extra end state applied after the last step AND after a skip (not after an interruption) */
  finish?: (ctx: CineCtx) => void;
  /** seconds the world blends back to the derived state when the cine releases it (default 1.5) */
  releaseBlend?: number;
}

/** what a stage (the island, later others) lets a cine do. Implemented by e.g. island/night/stage.ts */
export interface CineStage {
  readonly id: string;
  /** a panel / modal is over the scene: the cine pauses */
  blocked(): boolean;
  /** the stage is gone (scene changed): the cine is interrupted */
  alive(): boolean;
  resolve(t: Target): { x: number; y: number } | null;
  cameraGet(): { x: number; y: number; zoom: number };
  cameraSet(x: number, y: number, zoom: number): void;
  /** the look on screen right now */
  worldGet(): WorldLook;
  /** drive the world (the stage stops following the derived state until worldRelease) */
  worldSet(l: WorldLook): void;
  /** hand the world back to the derived state, blending over `blend` seconds */
  worldRelease(blend: number): void;
  actor(cmd: ActorCmd, ctx: CineCtx): void;
  /** one-shot flourish; returns a stopper (called when the cine ends or is interrupted) */
  fx(cmd: FxCmd, ctx: CineCtx): (() => void) | void;
  /** wait for the player to tap a target; `cancel` removes the prompt */
  interact(cmd: InteractCmd, ctx: CineCtx): { done: Promise<void>; cancel: () => void };
  hud(visible: boolean): void;
  /** 3D stages: a camera move as an apply(k) (from-state captured now); the runner tweens it on its clock */
  cameraTween?(cmd: CameraCmd): ((k: number) => void) | null;
  /** a named continuous parameter (DriveCmd): read and set (0..1). Optional: stages without it ignore drives */
  driveGet?(id: string): number | undefined;
  drive?(id: string, k: number, ctx: CineCtx): void;
}

/** services outside the stage; every field is optional so tests can fake only what they need */
export interface CineHost {
  say?(lines: Line[], o: { block: boolean; dim?: number; onLine?: (i: number) => void }): Promise<void>;
  /** close any open dialog right now (SALTAR / interruption) */
  cancelSay?(): void;
  /** resolve a beat's lines (personalized: names, «Capi», gender) */
  lines?(beat: string, idx?: number[]): Line[];
  /** persist a story step (markBeat + save); never called in replay mode */
  persist?(beat: string): void;
  audio?: Partial<{
    setState(s: MusicState, o?: { fade?: number; context?: string }): void;
    cue(id: string, o?: { fade?: number; narrative?: boolean }): void;
    release(fade?: number): void;
    ambience(bed: string, o?: { fade?: number; level?: number }): void;
    stinger(id: string, o?: { gain?: number }): void;
    duck(on: boolean, amount?: number): void;
    on(ev: string, fn: (info: unknown) => void): () => void;
  }>;
  invite?(): Promise<void>;
  /** letterbox / SALTAR overlay (cine/overlay.ts) */
  ui?: { set(o: UiCmd, onSkip: () => void): void; clear(): void };
  reduceMotion?: boolean;
  reduceFlashes?: boolean;
}

export interface CineCtx {
  readonly script: CineScript;
  readonly stage: CineStage;
  readonly host: CineHost;
  /** SALTAR was pressed: steps fold into their end effects */
  readonly skipping: boolean;
  /** «volver a ver»: nothing is persisted, the world returns to the derived state at the end */
  readonly replay: boolean;
  readonly reduceMotion: boolean;
  readonly reduceFlashes: boolean;
  /** runner clock (s since the cine started; pauses with it) */
  readonly now: number;
  /** keep a cleanup until the cine ends, however it ends (done, skipped, interrupted) */
  own(stop: (() => void) | void | null | undefined): void;
  /** hand the world back to the derived state now, blending (a later `world` step patches onto what's on screen) */
  releaseWorld(blend: number): void;
}
