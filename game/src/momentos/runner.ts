/**
 * MOMENTO RUNNER — plays one Momento on screen (Pixi). Pure parts live in core / clock / score; this file glues them
 * to the picture, the song, the player's hands and the pause menu, and cleans everything up (no leaks: textures,
 * puppets, listeners, ticker, decoded audio).
 *
 * Frame loop:  m = clock.update()  →  core.advance(m) (prompts, misses, autoplay)  →  palette + camera base from key
 * tracks  →  stage.update(world time)  →  clips.update(m)  →  prompts  →  camera.apply  →  post uniforms  →  cut?
 */
import { Container, Graphics, Rectangle, Sprite, Ticker, type FederatedPointerEvent, type Renderer, type Texture } from 'pixi.js';
import type { BeatMap } from '../audio/beatgrid';
import { audioApi } from '../audio/api';
import { audio } from '../core/audio';
import { settings } from '../core/settings';
import type { Args, Cue, MomentoDef, MomentoResult, ResolvedScore } from './types';
import { resolveScore, propAt } from './score';
import { MomentoCore, type Autoplay, type CoreEvent, type InputKind } from './core';
import { MomentoClock, VISUAL_LEAD, type AudioDriver } from './clock';
import { FlashGuard } from './flash';
import { mToSong, onsetList, spb, spBar } from './time';
import type { Onset, OnsetMap, OnsetTrack } from './types';
import { Camera, ClipHost, TextCache, W, H, type Kit, type Layers, type StageApi, type VerbFn } from './anime/kit';
import { TOOLKIT_VERBS, warmText } from './anime/fx';
import { PANEL_VERBS } from './anime/cutin';
import { PostFilter } from './anime/shaders';
import { paletteAt, PALETTES } from './anime/palette';
import { Studio } from './anime/actor';
import { PromptUI } from './anime/prompts';
import { PauseUI } from './anime/pause';

/** a press reaches the page ~8 ms after the finger (input pipeline); judged positions subtract it */
export const INPUT_LAG = 0.008;
const TAP_KEYS = new Set(['Space', 'Enter', 'NumpadEnter', 'KeyJ', 'KeyK', 'KeyF', 'KeyZ', 'KeyX']);
const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA']);
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD']);

export interface RunOpts {
  renderer: Renderer;
  /** where the view mounts (above everything) */
  host: Container;
  view: { x: number; y: number; w: number; h: number };
  /** the screen resolution scale (design box → device px) for screen-space patterns */
  pxScale: number;
  replay?: boolean;
  autoplay?: Autoplay;
  /** no clock: drive with render(m) (contact sheets) */
  scrub?: boolean;
  quality?: 'high' | 'low';
  /** try to play the song (else the internal clock) */
  audio: boolean;
  /** the player's crew (slugs) — cut-ins personalize with them */
  crew?: string[];
  /** the frozen previous screen (the cold open starts from it) */
  snapshot?: Texture | null;
  /** the song's onset tracks (src/data/music/beatmaps/<id>.onsets.json) */
  onsets?: OnsetMap | null;
  /** ~0.4 s before the cut: the caller readies the game underneath */
  beforeCut?: () => void;
  /** dev trace */
  onReady?: (r: MomentoRun) => void;
}

export interface SyncSample {
  cue: number;
  t: number;
  heard: number;
  errMs: number;
}

export class MomentoRun {
  readonly score: ResolvedScore;
  readonly core: MomentoCore;
  readonly clock: MomentoClock;
  readonly k: Kit;
  readonly host: ClipHost;
  private root = new Container();
  private scene = new Container();
  private layers: Layers;
  private post: PostFilter;
  private bars = new Graphics();
  private stage!: StageApi;
  private verbs: Record<string, VerbFn> = {};
  private prompts!: PromptUI;
  private pause!: PauseUI;
  private hit = new Container();
  private studio: Studio;
  private text: TextCache;
  private offs: (() => void)[] = [];
  private freezes: [number, number][] = [];
  private done: ((r: MomentoResult) => void) | null = null;
  private ended = false;
  private cutWarned = false;
  private lastPerf = 0;
  private frameMs: number[] = [];
  private downKeys = new Set<string>();
  private nextCueId = 5_000_000;
  quality: 'high' | 'low';
  /** DEV: sync samples (on-screen hit vs heard song time), frames */
  trace = { sync: [] as SyncSample[], frames: 0, judged: [] as { id: string; r: string; at: number }[], clock: [] as number[], vis: [] as number[] };
  private syncCursor = 0;
  private hitCues: Cue[] = [];
  private onsetCache = new Map<OnsetTrack, Onset[]>();
  /** screen anchors clips published this frame (they win over the stage's) */
  readonly anchorOverrides = new Map<string, [number, number]>();

  constructor(
    readonly def: MomentoDef,
    readonly map: BeatMap,
    readonly o: RunOpts,
  ) {
    this.score = resolveScore(def, map, o.onsets ?? null);
    if (this.score.warnings.length) console.warn(`[momento] ${def.id}:`, this.score.warnings);
    this.core = new MomentoCore(this.score, o.autoplay ?? 'none');
    this.quality = o.quality ?? 'high';
    const driver: AudioDriver = {
      usable: () => !!audio.ctx && audio.ctx.state === 'running',
      trackTime: () => audioApi.trackTime(),
      current: () => audioApi.currentTrack(),
      cue: (at, q) => audioApi.cue(def.track, { at, sync: true, quantize: q, fadeIn: 0.01, fadeOut: q === 'bar' ? 0.03 : 0.25, narrative: true, restart: true, loop: false }),
      pause: (on) => audioApi.pauseMusic(on),
      offset: () => Math.max(-0.2, Math.min(0.2, (Number(settings.rhythmOffsetMs) || 0) / 1000)),
      now: () => performance.now(),
    };
    this.clock = new MomentoClock(this.score.segments, driver, def.track, spBar(map));
    const mk = () => new Container();
    this.layers = { bg: mk(), world: mk(), wfx: mk(), screen: mk(), panels: mk(), type: mk(), ui: mk() };
    this.layers.world.addChild(this.layers.wfx);
    // full-frame shots (zIndex 0–1) < manga pages (5) < cut-ins (10) < the cold open (20)
    this.layers.panels.sortableChildren = true;
    this.scene.addChild(this.layers.bg, this.layers.world, this.layers.screen, this.layers.panels, this.layers.type, this.bars);
    this.root.addChild(this.scene, this.hit, this.layers.ui);
    this.post = new PostFilter();
    this.post.u.uDot = 5.5 * o.pxScale;
    this.studio = new Studio(o.renderer, this.quality === 'high');
    this.text = new TextCache(o.renderer);
    const self = this;
    const keys = this.score.keys;
    const stageProps = (): Record<string, number | string> => ({ ...(self.stage?.props ?? {}), ...(def.props ?? {}) });
    this.k = {
      renderer: o.renderer,
      view: o.view,
      layers: this.layers,
      cam: new Camera(),
      m: 0,
      dt: 1 / 60,
      score: this.score,
      map,
      beat: spb(map),
      bar: spBar(map),
      num: (name, d = 0) => {
        const v = propAt(keys.get(name), self.k.m, stageProps()[name] ?? d);
        return typeof v === 'number' ? v : Number(v) || d;
      },
      str: (name, d = '') => String(propAt(keys.get(name), self.k.m, stageProps()[name] ?? d)),
      pal: PALETTES.noir,
      palFor: (cue) => self.palAt(cue.prompt ? (self.score.prompts.find((p) => p.id === cue.prompt)?.m ?? cue.m) : cue.m),
      guard: new FlashGuard(settings.reduceFlashes),
      fx: { impact: 0, invert: false, impactAccent: 0xff2e88, flash: 0, flashColor: 0xffffff, aberr: 0 },
      quality: this.quality,
      reduceMotion: settings.reduceMotion,
      reduceFlashes: settings.reduceFlashes,
      silent: !o.audio,
      text: this.text,
      stage: null as unknown as StageApi,
      studio: this.studio,
      step: (m, fps = 12) => Math.floor(m * fps) / fps,
      beatStep: (m, fps = 12) => {
        const b = spb(map);
        const i = Math.floor((m - map.offset) / b);
        return i * 1000 + Math.floor((m - map.offset - i * b) * fps);
      },
      onsets: o.onsets ?? null,
      onsetList: (track: OnsetTrack): Onset[] => {
        let l = self.onsetCache.get(track);
        if (!l) self.onsetCache.set(track, (l = onsetList(o.onsets ?? null, track)));
        return l;
      },
      last: (track, m, min = 0) => {
        const l = self.k.onsetList(track);
        let lo = 0;
        let hi = l.length;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (l[mid].t <= m) lo = mid + 1;
          else hi = mid;
        }
        for (let i = lo - 1; i >= 0 && i >= lo - 12; i--) if (l[i].strength >= min) return { i, o: l[i] };
        return null;
      },
      env: (track, m, tau = 0.1, min = 0) => {
        const x = self.k.last(track, m, min);
        if (!x) return 0;
        // the tails add up (capped at 1): a quiet ghost kick in a roll still JUMPS on top of the one before it
        const l = self.k.onsetList(track);
        let v = 0;
        for (let i = x.i; i >= 0 && i > x.i - 4; i--) {
          const o = l[i];
          if (o.strength < min) continue;
          const age = m - o.t;
          if (age > tau * 6) break;
          v += o.strength * Math.exp(-age / tau);
        }
        return Math.min(1, v);
      },
      spawn: (c) => self.host.add(c),
      call: (verb, args, at) => self.callVerb(verb, args, at),
      density: this.quality === 'high' ? 1 : 0.5,
      judged: (id) => {
        const st = self.core.states.find((x) => x.p.id === id);
        if (!st?.done || !st.result) return null;
        const j = self.trace.judged.find((x) => x.id === id);
        return { r: st.result, at: j?.at ?? st.p.m };
      },
      prompt: (id) => self.core.states.find((x) => x.p.id === id) ?? null,
      snapshot: o.snapshot ?? null,
      crew: o.crew ?? [],
      fullFrame: false,
      setAnchor: (name, p) => void self.anchorOverrides.set(name, p),
      anchorOwned: (name) => self.anchorOverrides.has(name),
    };
    this.host = new ClipHost(this.k);
  }

  /** build the stage, bake the actors, schedule every clip */
  async prepare() {
    const factory = (await this.def.stage()) as (k: Kit) => StageApi;
    this.stage = factory(this.k);
    const own = this.stage.anchor?.bind(this.stage);
    this.stage.anchor = (name, k) => this.anchorOverrides.get(name) ?? own?.(name, k) ?? null;
    this.k.stage = this.stage;
    this.verbs = { ...TOOLKIT_VERBS, ...PANEL_VERBS, ...this.stage.verbs };
    await this.stage.build(this.k);
    // fonts for the type (katakana subsets load on demand)
    // every act that can mount type (cues + every prompt branch), so its glyphs and textures are ready before the clock
    const acts: { m: number; verb: string; args: Args }[] = this.score.cues.map((c) => ({ m: c.m, verb: c.act.verb, args: c.act.args }));
    for (const p of this.score.prompts) for (const list of Object.values(p.branches)) for (const a of list ?? []) acts.push({ m: p.m, verb: a.verb, args: a.args });
    const kata = new Set<string>('ドンバンパーティー最高一時停止リズム');
    for (const a of acts) if (typeof a.args.kata === 'string') for (const ch of a.args.kata) kata.add(ch);
    await Promise.all([document.fonts.load('80px "Anton"'), document.fonts.load('40px "Dela Gothic One"', [...kata].join('')), document.fonts.load('700 22px "Space Grotesk"')].map((p) => p.catch(() => undefined)));
    this.stage.prewarm?.(this.k);
    for (const a of acts) {
      this.k.pal = this.palAt(a.m);
      warmText(this.k, a.verb, a.args);
    }
    // dry-run every branch once (its clips are dropped): verbs bake their words in the body (sfx, also nested), so a
    // judged hit doesn't pay a texture upload on the very frame it lands
    for (const p of this.score.prompts) {
      for (const [result, list] of Object.entries(p.branches)) {
        for (const a of list ?? []) {
          try {
            this.verbs[a.verb]?.(this.k, a.args, { id: -1, t: p.t, m: p.m + a.dt, act: a, source: 'branch', prompt: p.id, result: result as Cue['result'] });
          } catch {
            /* a verb that needs the live frame: it bakes when it fires */
          }
        }
      }
    }
    for (const c of this.score.cues) {
      if (c.act.verb === 'freeze') {
        const d = typeof c.act.args.beats === 'number' ? (c.act.args.beats as number) * this.k.beat : typeof c.act.args.dur === 'number' ? (c.act.args.dur as number) : 0.25;
        this.freezes.push([c.m, c.m + d]);
        continue;
      }
      this.schedule(c);
      if (c.source === 'each' && c.hit) this.hitCues.push(c);
    }
    this.hitCues.sort((a, b) => a.m - b.m);
    this.prompts = new PromptUI(this.k, this.core);
    this.pause = new PauseUI(this.k, !!this.o.replay, (on) => this.setPaused(on), () => this.exit());
    this.mountInput();
    this.o.host.addChild(this.root);
    this.frame(0, 0);
  }

  private schedule(c: Cue) {
    const f = this.verbs[c.act.verb];
    if (!f) {
      console.warn(`[momento] verbo desconocido: ${c.act.verb}`);
      return;
    }
    const made = f(this.k, c.act.args, c);
    if (import.meta.env.DEV && made) for (const x of Array.isArray(made) ? made : [made]) x._tag = c.act.verb;
    this.host.add(made);
  }
  private callVerb(verb: string, args: Args, at: number) {
    const { t } = mToSong(this.score.segments, at);
    this.schedule({ id: ++this.nextCueId, t, m: at, act: { verb, args, dt: 0 }, source: 'branch' });
  }

  /** world time: holds still inside freeze frames (the stops) */
  worldM(m: number) {
    for (const [a, b] of this.freezes) if (m >= a && m < b) return a;
    return m;
  }

  /** start the clock (audio was prepared by the caller) and resolve when the Momento ends */
  play(withAudio: boolean): Promise<MomentoResult> {
    return new Promise<MomentoResult>((res) => {
      this.done = res;
      if (this.o.scrub) return;
      this.clock.start(withAudio);
      this.k.silent = this.clock.mode === 'internal';
      this.lastPerf = performance.now();
      Ticker.shared.add(this.tick, this);
    });
  }

  private tick() {
    if (this.ended) return;
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastPerf) / 1000);
    this.lastPerf = now;
    const m = this.clock.update();
    this.k.silent = this.clock.mode === 'internal';
    // DEV: per frame [perf ms, drawn m, heard song time (offset applied) or NaN] — drift / sync-proof tooling
    if (import.meta.env.DEV && this.trace.clock.length < 3 * 90000) {
      const raw = this.clock.mode === 'audio' ? audioApi.trackTime() : null;
      this.trace.clock.push(Math.round(now * 10) / 10, Math.round(m * 10000) / 10000, raw === null ? NaN : Math.round((raw - Math.max(-0.2, Math.min(0.2, (Number(settings.rhythmOffsetMs) || 0) / 1000))) * 10000) / 10000);
    }
    if (!this.clock.paused) this.frame(m, dt);
    this.watchQuality(now, dt);
  }

  palAt(m: number) {
    return paletteAt(this.score.keys.get('pal'), m, (this.stage?.props?.pal as string) ?? 'noir', this.stage?.palettes);
  }
  /** draw momento time m (also the scrub entry point) */
  /** DEV: the slowest frames (where the time went) */
  slow: { m: number; ms: number; parts: number[] }[] = [];
  frame(m: number, dt = 1 / 60) {
    const k = this.k;
    const T0 = performance.now();
    k.m = m;
    k.dt = dt;
    this.trace.frames++;
    for (const e of this.core.advance(m)) this.onCore(e);
    k.pal = this.palAt(m);
    const motion = k.reduceMotion ? 0.3 : 1;
    k.cam.begin(k.num('cam.x', W / 2), k.num('cam.y', H / 2), k.num('cam.zoom', 1), k.num('cam.rot', 0), motion);
    k.fx.impact = 0;
    k.fx.flash = 0;
    k.fx.aberr = 0;
    k.fx.invert = false;
    k.fullFrame = false;
    this.anchorOverrides.clear();
    const T1 = performance.now();
    this.stage?.update(k, this.worldM(m));
    const T2 = performance.now();
    this.host.update(m);
    const T3 = performance.now();
    this.stage?.late?.(k, this.worldM(m));
    const T4 = performance.now();
    this.prompts?.update(m);
    if (import.meta.env.DEV && performance.now() - T0 > 25) {
      this.slow.push({ m: Math.round(m * 100) / 100, ms: Math.round(performance.now() - T0), parts: [T1 - T0, T2 - T1, T3 - T2, T4 - T3].map((x) => Math.round(x)) });
      if (this.slow.length > 200) this.slow.shift();
    }
    k.cam.apply(this.layers.world);
    // DEV sync proof: what this frame actually DREW — the camera's zoom punch on top of the keyed zoom, and our hull's dip
    if (import.meta.env.DEV && !this.o.scrub && this.trace.vis.length < 5 * 90000) {
      const z = k.num('cam.zoom', 1);
      this.trace.vis.push(Math.round(m * 10000) / 10000, Math.round((this.layers.world.scale.x / (z || 1) - 1) * 1e5) / 1e5, Math.round(k.env('kick', m, 0.1) * 1000) / 1000, Math.round(k.env('snare', m, 0.08) * 1000) / 1000, k.fullFrame ? 1 : 0);
    }
    // a full-frame shot covers the set: don't draw what nobody sees
    this.layers.world.visible = !k.fullFrame;
    this.layers.bg.visible = !k.fullFrame;
    this.applyPost();
    this.drawBars(k.num('bars', 0));
    this.measureSync(m);
    if (!this.o.scrub && !this.ended) {
      if (!this.cutWarned && m >= this.score.mCut - 0.4) {
        this.cutWarned = true;
        try {
          this.o.beforeCut?.();
        } catch (e) {
          console.warn('[momento] beforeCut', e);
        }
      }
      if (m >= this.score.mCut) this.finish('done');
    }
  }

  private applyPost() {
    const k = this.k;
    const p = this.post;
    const u = p.u;
    const g = k.pal.grade;
    const live = k.fx.impact > 0 || k.fx.flash > 0.001 || k.fx.aberr > 0.01;
    const high = this.quality === 'high';
    u.uGrade = high ? 1 : 0;
    u.uSat = g.sat;
    u.uTone = g.tone;
    u.uVig = g.vignette;
    p.set3('uShade', g.shade);
    p.set3('uGlow', g.glow);
    u.uImpact = k.fx.impact;
    u.uImpInvert = k.fx.invert ? 1 : 0;
    p.set3('uImpInk', k.pal.ink);
    p.set3('uImpPaper', 0xfff8ec);
    p.set3('uImpAcc', k.fx.impactAccent);
    u.uFlash = k.fx.flash;
    p.set3('uFlashCol', k.fx.flashColor);
    u.uAberr = high ? k.fx.aberr : 0;
    const want = high || live;
    // the stage's own post (StageApi.post) runs after the toolkit's, only on the frames it says it is needed
    const own = this.stage?.post;
    const ownOn = !!own && own.filters.length > 0 && (own.live ? own.live(k) : true);
    const list = [...(want ? [p] : []), ...(ownOn ? own!.filters : [])];
    const cur = (this.scene.filters ?? []) as readonly unknown[];
    if (cur.length !== list.length || list.some((f, i) => cur[i] !== f)) this.scene.filters = list;
  }

  private drawBars(v: number) {
    const g = this.bars;
    g.clear();
    if (v <= 0.001) return;
    const { x, y, w, h } = this.k.view;
    const bh = 130 * v + Math.max(0, y < 0 ? -y : 0) * 0;
    g.rect(x, y, w, bh).fill(this.k.pal.ink).rect(x, y + h - bh, w, bh).fill(this.k.pal.ink);
  }

  /** DEV: when an each-over-hits cue first shows, how far is the heard song from its beat (ms) */
  private measureSync(m: number) {
    if (this.o.scrub || this.clock.mode !== 'audio') {
      while (this.syncCursor < this.hitCues.length && this.hitCues[this.syncCursor].m <= m) this.syncCursor++;
      return;
    }
    const raw = audioApi.trackTime();
    while (this.syncCursor < this.hitCues.length && this.hitCues[this.syncCursor].m <= m) {
      const c = this.hitCues[this.syncCursor++];
      if (raw === null) continue;
      const heard = raw - Math.max(-0.2, Math.min(0.2, (Number(settings.rhythmOffsetMs) || 0) / 1000));
      if (this.trace.sync.length < 2000) this.trace.sync.push({ cue: c.id, t: c.t, heard, errMs: Math.round((heard + VISUAL_LEAD - c.t) * 10000) / 10 });
    }
  }

  private onCore(e: CoreEvent) {
    if (e.k === 'press') this.prompts?.pressed(e.s);
    else if (e.k === 'judge') {
      this.prompts?.judged(e.s, e.result, e.at);
      this.trace.judged.push({ id: e.s.p.id, r: e.result, at: e.at });
      for (const c of e.cues) this.schedule(c);
    }
  }

  // ------------------------------------------------------------------ input
  private mountInput() {
    const k = this.k;
    const hit = this.hit;
    hit.eventMode = 'static';
    hit.hitArea = new Rectangle(k.view.x, k.view.y, k.view.w, k.view.h);
    const toM = (ts: number) => this.clock.at(ts) - INPUT_LAG;
    const down = (e: FederatedPointerEvent) => {
      if (this.clock.paused || this.ended) return;
      const ts = (e.nativeEvent as Event | undefined)?.timeStamp ?? performance.now();
      const m = this.o.scrub ? k.m : toM(ts);
      const kind: InputKind = this.core.wantsSide(m) ? (e.global.x < this.o.renderer.screen.width / 2 ? 'left' : 'right') : 'down';
      this.input(kind, m);
    };
    const up = (e: FederatedPointerEvent) => {
      if (this.ended) return;
      const m = this.o.scrub ? k.m : toM((e.nativeEvent as Event | undefined)?.timeStamp ?? performance.now());
      this.input('up', m);
    };
    hit.on('pointerdown', down);
    hit.on('pointerup', up);
    hit.on('pointerupoutside', up);
    const kd = (e: KeyboardEvent) => {
      if (this.ended) return;
      const code = e.code;
      if (code === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!e.repeat) this.setPaused(!this.clock.paused);
        return;
      }
      const tap = TAP_KEYS.has(code);
      const side = LEFT_KEYS.has(code) ? 'left' : RIGHT_KEYS.has(code) ? 'right' : null;
      if (!tap && !side) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.repeat || this.clock.paused || this.downKeys.has(code)) return;
      this.downKeys.add(code);
      const m = this.o.scrub ? k.m : toM(e.timeStamp);
      if (side) this.input(side, m);
      else this.input('down', m);
    };
    const ku = (e: KeyboardEvent) => {
      if (!this.downKeys.delete(e.code)) return;
      if (TAP_KEYS.has(e.code) && !this.ended) this.input('up', this.o.scrub ? k.m : toM(e.timeStamp));
    };
    const vis = () => {
      if (document.visibilityState === 'hidden' && !this.ended && !this.o.scrub) this.setPaused(true);
    };
    window.addEventListener('keydown', kd, true);
    window.addEventListener('keyup', ku, true);
    document.addEventListener('visibilitychange', vis);
    this.offs.push(
      () => window.removeEventListener('keydown', kd, true),
      () => window.removeEventListener('keyup', ku, true),
      () => document.removeEventListener('visibilitychange', vis),
    );
  }
  input(kind: InputKind, m: number) {
    for (const e of this.core.input(kind, m)) this.onCore(e);
  }

  setPaused(on: boolean) {
    if (this.ended || this.o.scrub) return;
    this.clock.pause(on);
    this.pause.show(on);
    if (!on) this.lastPerf = performance.now();
  }
  private exit() {
    if (!this.o.replay) return;
    this.clock.pause(false);
    this.finish('exited');
  }

  // ------------------------------------------------------------------ quality / end
  private badWindows = 0;
  private watchQuality(now: number, dt: number) {
    if (this.quality === 'low' || this.o.quality || this.clock.paused) return;
    // the first seconds carry one-off costs (first mounts, text textures, shader compiles): don't judge them
    if (this.k.m < 3) return;
    this.frameMs.push(dt * 1000);
    if (this.frameMs.length < 120) return;
    const s = [...this.frameMs].sort((a, b) => a - b);
    const p95 = s[Math.floor(s.length * 0.95)];
    this.frameMs = [];
    // two bad windows in a row (≈ 4 s under ~40 fps) → the low tier
    this.badWindows = p95 > 24 ? this.badWindows + 1 : 0;
    if (this.badWindows >= 2) {
      this.quality = 'low';
      this.k.quality = 'low';
      this.k.density = 0.5;
      console.info(`[momento] calidad baja (p95 ${p95.toFixed(1)} ms)`);
    }
    void now;
  }

  get result(): MomentoResult {
    return this.core.result('done', this.clock.kind);
  }

  /** end now: 'done' at the cut, 'exited' from a replay's pause menu, 'aborted' when the host scene went away */
  finish(end: MomentoResult['end']) {
    if (this.ended) return;
    this.ended = true;
    Ticker.shared.remove(this.tick, this);
    const r = this.core.result(end, this.clock.kind);
    const cb = this.done;
    this.done = null;
    cb?.(r);
  }

  /** free everything (the caller hides / shows the game around it) */
  dispose() {
    this.finish('aborted');
    for (const off of this.offs.splice(0)) off();
    this.host.dispose();
    this.prompts?.dispose();
    this.pause?.dispose();
    try {
      this.stage?.destroy();
    } catch (e) {
      console.warn('[momento] stage destroy', e);
    }
    this.scene.filters = [];
    this.post.destroy();
    this.root.destroy({ children: true });
    // textures may still be bound to the last frame's shaders: free them after two more frames
    const studio = this.studio;
    const text = this.text;
    let n = 0;
    const later = () => {
      if (++n < 3) return void requestAnimationFrame(later);
      studio.dispose();
      text.dispose();
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(later);
    else {
      studio.dispose();
      text.dispose();
    }
  }

  /** DEV: the snapshot sprite helper for stages */
  static snapshotSprite(t: Texture | null | undefined): Sprite | null {
    return t ? new Sprite(t) : null;
  }
}
