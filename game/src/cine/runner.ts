/**
 * The CINE runner: plays one CineScript on a CineStage (docs/part-ii/20-estados-y-cine.md). No Pixi here:
 * the clock is injected (`tick(dt)`), so tests drive it frame by frame.
 *
 * Guarantees
 * - ORDER: a sequence's steps start in order; `at` steps start at their offset; the sequence ends after all.
 * - TIME: every wait/tween is scheduled on LOGICAL time (start + duration), not "when the frame noticed",
 *   so 30 fps and 144 fps reach the same step at the same time (FPS-independent).
 * - PAUSE: `pause()` or the stage being `blocked()` (a panel open) freezes the clock.
 * - SKIP (SALTAR): the rest of the script runs instantly in «fold» mode — tweens jump to their end, waits,
 *   dialog, interactions and flourishes vanish, world / camera / persist / audio state still apply —
 *   so the world is exactly where the script leaves it. Never half-transformed.
 * - INTERRUPT (scene gone / `abort()`): nothing else runs; flourishes are stopped; the world is handed back
 *   to the DERIVED world state (whatever the save says), blending.
 */
import { lookOf, mixLook, type WorldLook } from '../state/sys/worldState';
import type { CineCtx, CineHost, CineResult, CineScript, CineStage, Ease, Step } from './types';

export class CineAbort extends Error {
  constructor() {
    super('cine interrupted');
  }
}

const clamp01 = (k: number) => (k <= 0 ? 0 : k >= 1 ? 1 : k);
export const EASES: Record<Ease, (k: number) => number> = {
  linear: (k) => k,
  in: (k) => k * k,
  out: (k) => 1 - (1 - k) * (1 - k),
  inOut: (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2),
  outCubic: (k) => 1 - (1 - k) ** 3,
  outBack: (k) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * (k - 1) ** 3 + c1 * (k - 1) ** 2;
  },
};

interface Timer {
  due: number;
  resolve: (t: number) => void;
  reject: (e: unknown) => void;
}
interface Tween {
  t0: number;
  dur: number;
  ease: (k: number) => number;
  apply: (k: number) => void;
  resolve: (t: number) => void;
  reject: (e: unknown) => void;
  dead?: boolean;
}

export interface RunnerOpts {
  replay?: boolean;
  /** safety net: how long an `audio.invite` may stay unanswered before the cine goes on (s; SALTAR always works) */
  inviteTimeout?: number;
}

export class CineRunner implements CineCtx {
  now = 0;
  skipping = false;
  aborted = false;
  paused = false;
  result: CineResult | null = null;
  readonly replay: boolean;
  /** step ids in the order they STARTED (tests, debugging) */
  readonly log: { id: string; t: number }[] = [];
  private timers: Timer[] = [];
  private tweens: Tween[] = [];
  private onSkip = new Set<() => void>();
  private onAbort = new Set<() => void>();
  private cleanups: (() => void)[] = [];
  private worldTarget: WorldLook | null = null;
  private worldDriven = false;
  private worldTw: Tween | null = null;
  private camTw: Tween | null = null;
  private detach: (() => void) | null = null;

  constructor(
    readonly script: CineScript,
    readonly stage: CineStage,
    readonly host: CineHost = {},
    private o: RunnerOpts = {},
  ) {
    this.replay = !!o.replay;
  }
  get reduceMotion() {
    return !!this.host.reduceMotion;
  }
  get reduceFlashes() {
    return !!this.host.reduceFlashes;
  }

  /** drive the clock from a frame source (returns nothing; detached at the end) */
  attach(subscribe: (fn: (dt: number) => void) => () => void) {
    this.detach = subscribe((dt) => this.tick(dt));
  }

  // ------------------------------------------------------------------ control
  async play(): Promise<CineResult> {
    try {
      if (!this.stage.alive()) throw new CineAbort();
      await this.seq(this.script.steps, 0);
      this.check();
      this.script.finish?.(this);
      this.result = this.skipping ? 'skipped' : 'done';
    } catch (e) {
      if (e instanceof CineAbort || this.aborted) this.result = 'interrupted';
      else {
        // a bug in a step must never leave the world half-done nor loop the scene: settle as skipped
        console.warn('[cine]', this.script.id, e);
        this.result = 'skipped';
        try {
          this.script.finish?.(this);
        } catch {
          /* ignore */
        }
      }
    } finally {
      this.end();
    }
    return this.result!;
  }

  pause() {
    this.paused = true;
  }
  resume() {
    this.paused = false;
  }

  /** SALTAR: fold the rest of the script into its end state */
  skip() {
    if (this.result || this.aborted || this.skipping || this.script.skippable === false) return;
    this.skipping = true;
    this.host.cancelSay?.();
    for (const tw of this.tweens.splice(0)) {
      if (tw.dead) continue;
      tw.apply(1);
      tw.resolve(tw.t0 + tw.dur);
    }
    for (const t of this.timers.splice(0)) t.resolve(this.now);
    for (const f of [...this.onSkip]) f();
  }

  /** stop now (scene changed, the story needs the screen): the world goes back to the derived state */
  abort() {
    if (this.result || this.aborted) return;
    this.aborted = true;
    const err = new CineAbort();
    for (const tw of this.tweens.splice(0)) tw.reject(err);
    for (const t of this.timers.splice(0)) t.reject(err);
    for (const f of [...this.onAbort]) f();
    this.host.cancelSay?.();
  }

  /** advance the clock (seconds of real elapsed time) */
  tick(dt: number) {
    if (this.result || this.aborted) return;
    if (!this.stage.alive()) {
      this.abort();
      return;
    }
    if (this.paused || this.stage.blocked() || !(dt > 0)) return;
    this.now += dt;
    for (const tw of [...this.tweens]) {
      if (tw.dead) continue;
      const k = clamp01((this.now - tw.t0) / tw.dur);
      tw.apply(tw.ease(k));
      if (k >= 1) {
        this.drop(tw);
        tw.resolve(tw.t0 + tw.dur);
      }
    }
    this.timers.sort((a, b) => a.due - b.due);
    while (this.timers.length && this.timers[0].due <= this.now + 1e-9) {
      const t = this.timers.shift()!;
      t.resolve(t.due);
    }
  }

  private end() {
    this.detach?.();
    this.detach = null;
    for (const f of this.cleanups.splice(0).reverse()) {
      try {
        f();
      } catch (e) {
        console.warn('[cine] cleanup', e);
      }
    }
    this.timers.length = 0;
    this.tweens.length = 0;
    this.onSkip.clear();
    this.onAbort.clear();
    if (this.result === 'interrupted') this.host.cancelSay?.();
    try {
      this.host.ui?.clear();
      if (this.stage.alive()) {
        this.stage.hud(true);
        if (this.worldDriven) this.stage.worldRelease(this.result === 'interrupted' ? 1.2 : (this.script.releaseBlend ?? 1.5));
      }
    } catch (e) {
      console.warn('[cine] release', e);
    }
  }

  // ------------------------------------------------------------------ time primitives
  private check() {
    if (this.aborted) throw new CineAbort();
  }
  /** resolves at logical time `t` (immediately when skipping or already past) */
  private until(t: number): Promise<number> {
    this.check();
    if (this.skipping) return Promise.resolve(this.now);
    if (t <= this.now + 1e-9) return Promise.resolve(t);
    return new Promise((resolve, reject) => this.timers.push({ due: t, resolve, reject }));
  }
  private tween(t0: number, dur: number, ease: Ease | undefined, apply: (k: number) => void, slot?: 'world' | 'cam'): Promise<number> {
    this.check();
    // a new world/camera move replaces the running one (no two tweens fighting over the same thing)
    const prev = slot === 'world' ? this.worldTw : slot === 'cam' ? this.camTw : null;
    if (prev && !prev.dead) {
      this.drop(prev);
      prev.resolve(this.now);
    }
    if (this.skipping || dur <= 0) {
      apply(1);
      return Promise.resolve(this.skipping ? this.now : t0 + Math.max(0, dur));
    }
    return new Promise((resolve, reject) => {
      const tw: Tween = { t0, dur, ease: EASES[ease ?? 'inOut'], apply, resolve, reject };
      this.tweens.push(tw);
      if (slot === 'world') this.worldTw = tw;
      if (slot === 'cam') this.camTw = tw;
      // started in the past (a long frame): catch up right away
      if (this.now > t0) tw.apply(tw.ease(clamp01((this.now - t0) / dur)));
    });
  }
  private drop(tw: Tween) {
    tw.dead = true;
    const i = this.tweens.indexOf(tw);
    if (i >= 0) this.tweens.splice(i, 1);
    if (this.worldTw === tw) this.worldTw = null;
    if (this.camTw === tw) this.camTw = null;
  }
  /** wait for something outside the runner (the player); SALTAR releases it, an interruption rejects it */
  private external(p: Promise<unknown>): Promise<void> {
    this.check();
    if (this.skipping) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const off = () => {
        this.onSkip.delete(sk);
        this.onAbort.delete(ab);
      };
      const sk = () => {
        off();
        resolve();
      };
      const ab = () => {
        off();
        reject(new CineAbort());
      };
      this.onSkip.add(sk);
      this.onAbort.add(ab);
      p.then(
        () => {
          off();
          resolve();
        },
        (e) => {
          off();
          if (this.aborted) reject(new CineAbort());
          else {
            console.warn('[cine] external', e);
            resolve();
          }
        },
      );
    });
  }
  /** hand the world back to the derived state mid-scene (blending); later world steps start from what's on screen */
  releaseWorld(blend: number) {
    if (this.worldTw && !this.worldTw.dead) {
      this.drop(this.worldTw);
      this.worldTw.resolve(this.now);
    }
    this.worldTarget = null;
    this.worldDriven = false;
    this.stage.worldRelease(blend);
  }
  /** keep a stopper until the cine ends (any way it ends) */
  own(stop: (() => void) | void | null | undefined) {
    if (stop) this.cleanups.push(stop);
  }

  // ------------------------------------------------------------------ steps
  private variant(s: Step): Step | null {
    if (s.when && !s.when(this)) return null;
    if (this.reduceMotion && s.reduced) {
      if (s.reduced === 'skip') return null;
      return { ...s.reduced, at: s.at, after: s.after, async: s.async } as Step;
    }
    return s;
  }

  /** a sequence starting at logical time t0; resolves with its logical end time */
  private async seq(steps: Step[], t0: number): Promise<number> {
    let t = t0;
    const spawned: Promise<number>[] = [];
    for (const raw of steps) {
      this.check();
      const s = this.variant(raw);
      if (!s) continue;
      if (s.at !== undefined || s.async) {
        const p = this.exec(s, s.at !== undefined ? t0 + s.at : t + (s.after ?? 0));
        p.catch(() => undefined); // awaited below; an interruption must not surface as «unhandled»
        spawned.push(p);
        continue;
      }
      const start = t + (s.after ?? 0);
      t = await this.exec(s, start);
    }
    const ends = await Promise.all(spawned);
    return Math.max(t, ...ends);
  }

  private async exec(s: Step, t0: number): Promise<number> {
    if (t0 > this.now) t0 = await this.until(t0);
    this.check();
    const label = s.id ?? Object.keys(s).find((k) => !['at', 'after', 'async', 'reduced', 'when', 'id'].includes(k)) ?? '?';
    this.log.push({ id: label, t: t0 });
    if ('wait' in s) return this.until(t0 + s.wait);
    if ('seq' in s) return this.seq(s.seq, t0);
    if ('parallel' in s) {
      const ps = s.parallel.map((p) => this.seq([p], t0));
      for (const p of ps) p.catch(() => undefined);
      const ends = await Promise.all(ps);
      return Math.max(t0, ...ends);
    }
    if ('camera' in s) {
      const c = s.camera;
      // reduce motion: cut instead of travelling
      if (this.stage.cameraTween) {
        const apply = this.stage.cameraTween(c);
        return apply ? this.tween(t0, this.reduceMotion ? 0 : (c.dur ?? 1.5), c.ease, apply, 'cam') : t0;
      }
      if (Array.isArray(c.to)) return t0;
      const p = this.stage.resolve(c.to);
      if (!p) return t0;
      const from = this.stage.cameraGet();
      const to = { x: p.x + (c.offset?.[0] ?? 0), y: p.y + (c.offset?.[1] ?? 0), zoom: c.zoom ?? from.zoom };
      // reduce motion: cut instead of travelling
      const dur = this.reduceMotion ? 0 : (c.dur ?? 1.5);
      return this.tween(t0, dur, c.ease, (k) => this.stage.cameraSet(from.x + (to.x - from.x) * k, from.y + (to.y - from.y) * k, from.zoom + (to.zoom - from.zoom) * k), 'cam');
    }
    if ('drive' in s) {
      const d = s.drive;
      if (!this.stage.drive) return t0;
      const from = d.from ?? this.stage.driveGet?.(d.id) ?? 0;
      return this.tween(t0, d.dur ?? 1, d.ease ?? 'inOut', (k) => this.stage.drive!(d.id, from + (d.to - from) * k, this));
    }
    if ('world' in s) {
      const w = s.world;
      const from = this.stage.worldGet();
      const base = this.worldTarget ?? from;
      const to: WorldLook = typeof w.to === 'string' ? lookOf(w.to) : { ...base, ...w.to };
      this.worldTarget = to;
      this.worldDriven = true;
      return this.tween(t0, w.dur ?? 2, w.ease ?? 'inOut', (k) => this.stage.worldSet(mixLook(from, to, k)), 'world');
    }
    if ('actor' in s) {
      if (!this.skipping) this.stage.actor(s.actor, this);
      return t0;
    }
    if ('fx' in s) {
      if (!this.skipping) this.own(this.stage.fx(s.fx, this));
      return t0;
    }
    if ('persist' in s) {
      if (!this.replay) this.host.persist?.(s.persist.beat);
      return t0;
    }
    if ('ui' in s) {
      this.host.ui?.set(s.ui, () => this.skip());
      if (s.ui.hud !== undefined) this.stage.hud(s.ui.hud);
      return t0;
    }
    if ('call' in s) {
      await s.call(this);
      return Math.max(t0, this.now);
    }
    if ('audio' in s) return this.audio(s.audio, t0);
    if ('say' in s) return this.say(s.say, t0);
    if ('interact' in s) {
      if (this.skipping) return this.now;
      const h = this.stage.interact(s.interact, this);
      this.own(h.cancel);
      const waits: Promise<unknown>[] = [h.done];
      if (s.interact.timeout) waits.push(this.until(this.now + s.interact.timeout));
      await this.external(Promise.race(waits));
      h.cancel();
      return this.now;
    }
    return t0;
  }

  private async audio(a: NonNullable<Extract<Step, { audio: unknown }>['audio']>, t0: number): Promise<number> {
    const api = this.host.audio ?? {};
    let t = t0;
    if (a.invite && !this.skipping && this.host.invite) {
      const limit = this.until(this.now + (this.o.inviteTimeout ?? 600)).catch(() => undefined);
      await this.external(Promise.race([this.host.invite(), limit]));
      t = this.now;
    }
    if (a.sync && !this.skipping && api.on) {
      const on = api.on;
      let off: (() => void) | null = null;
      const hit = new Promise<void>((res) => (off = on(a.sync!, () => res())));
      const limit = this.until(this.now + (a.maxWait ?? 0.6)).catch(() => undefined);
      try {
        await this.external(Promise.race([hit, limit]));
      } finally {
        (off as (() => void) | null)?.();
      }
      t = this.now;
    }
    const ctxTag = { fade: a.fade, context: `cine:${this.script.id}` };
    if (a.state) api.setState?.(a.state, ctxTag);
    if (a.cue) api.cue?.(a.cue, { fade: a.fade, narrative: true });
    if (a.release !== undefined) api.release?.(a.release === true ? a.fade : a.release);
    if (a.ambience) api.ambience?.(a.ambience, { fade: a.fade, level: a.level });
    if (!this.skipping) {
      if (a.stinger) api.stinger?.(a.stinger, { gain: a.gain });
      if (a.duck !== undefined) api.duck?.(a.duck);
    }
    return t;
  }

  private async say(c: NonNullable<Extract<Step, { say: unknown }>['say']>, t0: number): Promise<number> {
    if (this.skipping || !this.host.say) return this.now;
    const lines = c.text ?? (c.beat ? (this.host.lines?.(c.beat, c.lines) ?? []) : []);
    if (!lines.length) return t0;
    const onLine = c.onLine
      ? (i: number) => {
          const st = c.onLine![i];
          if (!st || this.skipping || this.aborted) return;
          this.seq(Array.isArray(st) ? st : [st], this.now).catch(() => undefined);
        }
      : undefined;
    if (c.block === false) {
      void this.host.say(lines, { block: false, onLine });
      return t0;
    }
    this.host.audio?.duck?.(true, 0.35);
    try {
      await this.external(this.host.say(lines, { block: true, dim: c.dim, onLine }));
    } finally {
      this.host.audio?.duck?.(false);
    }
    return this.now;
  }
}
