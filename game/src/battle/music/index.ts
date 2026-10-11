/**
 * BATTLE MUSIC — a battle that feels designed around its song (docs/part-ii/24-batallas-musicales.md).
 *
 * BattleScene owns the fight; this owns the music around it. Per battle it resolves a PLAN (plan.ts, data in
 * src/data/music/battles.json), cues the song, follows the audio clock (clock.ts; an internal clock when there is
 * no sound) and drives presentation only:
 *   - reactions: beat-map hits / bars / sections / markers → camera, sky light, sea spray, crew groove, UI pulse,
 *     freeze-frames on stops, a special set piece on drops (stage.ts)
 *   - enemy choreography: the sim already decided WHAT the enemy does; here we decide WHEN it is shown — the
 *     release waits (≤ 1 bar) and the flight stretches so the impact lands on a strong hit; volleys batch on accents
 *   - state rules: turn / hull / boss phase / signal → a quantized jump to another section (or song)
 *   - SINCRO (plan.sincro): windows on strong hits; a release inside one becomes an explicit sim input
 *   - RUIDO (H35): the meter ducks and muffles the music · victory / defeat endings · Fonoteca unlocks
 *
 * Nothing here can change a sim result: no sim call reads the clock, and the only input that reaches the sim
 * (`{ sincro }`) is the player's own, passed like the angle and the power.
 */
import { Ticker } from 'pixi.js';
import type { BattleScene } from '../../scenes/BattleScene';
import type { BattleEvent, ShotPath } from '../sim';
import type { ShotDef } from '../types';
import { audioApi } from '../../audio/api';
import type { BeatMap, GridEvent } from '../../audio/beatgrid';
import { occurrences } from '../../audio/beatgrid';
import { audio, sfx } from '../../core/audio';
import { G } from '../../state/game';
import { nzState } from '../ruido';
import { scComboFor } from '../sincro';
import { onFase } from '../fases';
import { floatText } from '../../fx/juice';
import { F, C } from '../../ui/theme';
import { BattleMusicPlan, GoalOverlay, MusicTarget, ReactionEvent, ScenePhase, UnlockCfg, pickRule, reactionMatches, resolvePlan } from './plan';
import { Cursor, Delivered, TimedHit, battleEvents, chooseSlot, landingSpots, filePos, hitsBetween, nextBar, opensWindow, secPerBar, secPerBeat, sectionAtFile, sincroJudge, timeOfName, validLoop } from './timeline';
import { MusicClock, Timeline, audioUsable, rhythmOffsetSec } from './clock';
import { MusicStage } from './stage';
import { SincroRing } from './sincroUi';
import { removeLowpass, setMusicLowpass } from './musicFilter';

const perf = () => performance.now();
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const bare = (s: string) => s.replace(/^[a-z]_/, '');

interface FlightSync {
  /** unwrapped time the flight started / must hit */
  u0: number;
  uHit: number;
  /** point index of the impact it must land on */
  idx: number;
}
interface Target {
  u: number;
  strength: number;
  kind: string;
  claimed: boolean;
  who: string;
}

export interface MusicTrace {
  /** cursor deliveries: what the battle reacted to (perf ms, audio ctx time, heard u) */
  events: { type: string; name?: string; u: number; perf: number; ctx: number | null; late: number }[];
  /** the engine's own events (audioApi.on), for latency comparisons */
  engine: { ev: string; name?: string; time: number; perf: number; ctx: number | null }[];
  /** enemy releases planned */
  slots: { who: string; flight: number; delay: number; rate: number; hitU: number; kind: string; strength: number; batched: boolean; perf: number }[];
  /** synced impacts as they were shown: error vs the hit (ms, + = late); first = the impact the flight was timed for */
  impacts: { perf: number; u: number; hitU: number; errMs: number; strength: number; who: string; first: boolean }[];
  /** state jumps / endings */
  jumps: { perf: number; why: string; track: string; section: string }[];
  sincro: { perf: number; ok: boolean; deltaMs: number | null }[];
}

export class BattleMusic {
  readonly plan: BattleMusicPlan | null;
  readonly goals: GoalOverlay[];
  readonly source: string;
  readonly clock = new MusicClock();
  stage: MusicStage | null = null;
  ring: SincroRing | null = null;
  private cursor: Cursor | null = null;
  private timelines = new Map<string, Timeline>();
  private used = new Set<number>();
  private turns = { enemy: 0, player: 0 };
  private lastPhase: ScenePhase = 'intro';
  private everyCount = new Map<number, number>();
  private flights = new WeakMap<ShotPath[], FlightSync>();
  private targets: Target[] = [];
  private volleyPrev: { u: number; n: number } | null = null;
  private firstEnemyShot = true;
  private ruidoLevel = 0;
  private ruidoDucked = false;
  private defeatDucked = false;
  private ended = false;
  private disposed = false;
  private unlocks: UnlockCfg[] = [];
  /** perf time of the last cue this battle asked for (re-cues never stack on a slow decode) */
  private lastCue = 0;
  private audioAsked = false;
  private offs: (() => void)[] = [];
  private signals: string[] = [];
  /** the plan's song is the one that should be playing (false after a finale took over) */
  private following = true;
  sincroStats = { shots: 0, onBeat: 0 };
  /** smoothed frame time (s): a synced impact aims half a frame early, so at low FPS it lands centred on the hit */
  private frameDt = 1 / 60;
  trace: MusicTrace = { events: [], engine: [], slots: [], impacts: [], jumps: [], sincro: [] };
  ready: Promise<void> = Promise.resolve();

  constructor(private s: BattleScene) {
    const sp = s.spec;
    const meta = sp.meta;
    const kind = sp.boss ? 'boss' : sp.mode === 'duel' ? 'duel' : meta?.errand ? 'errand' : meta?.special ? 'story' : 'default';
    const crewSpecies = s.sim.sides[0].cats.map((c) => G.s?.cats?.find((k) => k.uid === c.def.uid)?.species ?? c.def.catId);
    const r = resolvePlan({ battleId: meta?.special ?? meta?.key ?? null, kind, activeMissions: G.s?.missions?.active ?? [], crewSpecies });
    this.plan = r.plan && r.plan.track ? r.plan : null;
    this.goals = r.goals;
    this.source = r.source;
  }

  /** anything to do at all */
  get active() {
    return !!this.plan || this.goals.some((g) => g.finale);
  }

  // ------------------------------------------------------------------ lifecycle
  start() {
    if (!this.active || this.disposed) return;
    this.stage = new MusicStage(this.s);
    if (this.plan?.sincro.enabled) {
      this.ring = new SincroRing(this.s);
      this.ring.teach = this.plan.sincro.teach;
    }
    if (import.meta.env.DEV) {
      (window as unknown as { __battleMusic: BattleMusic }).__battleMusic = this;
      for (const ev of ['hit', 'bar', 'section'])
        this.offs.push(audioApi.on(ev, (i) => this.pushTrace(this.trace.engine, { ev, name: i.name, time: i.time, perf: perf(), ctx: audio.ctx?.currentTime ?? null })));
    }
    // multi-phase battles (battle/fases.ts): each staged phase is a signal the plan can name ('fase:<id>', 'phase:<n>')
    const battle = this.s.spec.meta?.special ?? null;
    this.offs.push(
      onFase((e) => {
        if (e.from < 0 || (e.battle && battle && e.battle !== battle)) return;
        this.signal(`fase:${e.id}`);
        this.signal(`phase:${e.index + 1}`);
      }),
    );
    Ticker.shared.add(this.tick, this);
    this.ready = this.boot().catch((e) => console.warn('[battleMusic] sin música de batalla', e));
  }

  private async boot() {
    const p = this.plan;
    if (!p || !p.track) return;
    const tracks = new Set<string>([p.track]);
    if (p.fallback) tracks.add(p.fallback);
    const targets = (t?: MusicTarget): MusicTarget[] => (t ? [t, ...targets(t.fallback)] : []);
    for (const st of p.states) for (const t of targets(st.to)) if (t.track) tracks.add(t.track);
    for (const t of [p.victory.track, ...targets(p.endTo ?? undefined).map((x) => x.track), ...this.goals.flatMap((g) => targets(g.finale).map((x) => x.track))]) if (t) tracks.add(t);
    await Promise.all([...tracks].map((t) => this.timelineOf(t)));
    // a version / composition that isn't in the catalog yet: its fallback song plays the plan
    const song = this.timelines.get(p.track) ? p.track : p.fallback && this.timelines.get(p.fallback) ? p.fallback : null;
    const tl0 = song ? this.timelines.get(song) : null;
    if (!tl0 || !song || this.disposed) return;
    const tl: Timeline = { ...tl0, loop: this.loopFor(tl0, p.loop) };
    const file = p.startAt ?? (p.startSection ? timeOfName(tl.map, p.startSection) ?? 0 : 0);
    this.audioAsked = true;
    this.lastCue = perf();
    audioApi.cue(song, { section: p.startAt === undefined ? p.startSection : undefined, at: p.startAt, loop: p.loop, sync: true, quantize: 'now', fadeIn: p.fadeIn, restart: true });
    for (const t of tracks) if (t !== song) audioApi.prefetch(t);
    this.clock.start(tl, file, true);
    this.cursor = new Cursor(tl.events, tl.loop, file, p.lateSkipMs / 1000);
  }

  private async timelineOf(track: string): Promise<Timeline | null> {
    const have = this.timelines.get(track);
    if (have) return have;
    const map: BeatMap | null = await audioApi.beatMap(track);
    if (!map || !map.beats.length) return null;
    const own = this.plan?.track === track || this.plan?.fallback === track;
    const tl: Timeline = {
      track,
      map,
      events: battleEvents(map, own ? this.plan?.extraHits : []),
      // a sync cue loops at the song's loop region (tracks.json; else the map's own)
      loop: validLoop(map.loop) ?? null,
    };
    this.timelines.set(track, tl);
    return tl;
  }
  /** the loop a deck of `tl` uses when cued with loop = `on` */
  private loopFor(tl: Timeline, on: boolean) {
    return on ? (validLoop(tl.map.loop) ?? { start: 0, end: tl.map.duration }) : null;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    Ticker.shared.remove(this.tick, this);
    for (const off of this.offs.splice(0)) off();
    if (this.ruidoDucked) audioApi.duck(false, this.plan?.ruido?.duckDb ?? 6, 'ruido');
    if (this.defeatDucked) audioApi.duck(false, 12, 'battle-defeat');
    this.ruidoDucked = this.defeatDucked = false;
    removeLowpass();
    this.stage?.dispose();
    this.ring?.dispose();
    // the Fonoteca unlocks land on the next screen (never under the battle's end card)
    for (const u of this.unlocks) {
      const go = () => {
        void audioApi.beatMap(u.song).then((m) => {
          // only songs / versions the catalog knows (a version whose file isn't there yet waits for its own update)
          if (m) audioApi.unlockSong(u.song, u.source);
        });
      };
      if (u.delaySec) window.setTimeout(go, u.delaySec * 1000);
      else window.setTimeout(go, 600);
    }
    this.unlocks = [];
  }

  /** a named moment from the battle's own code (e.g. a multi-layer boss: signal('phase:2')) */
  signal(name: string) {
    this.signals.push(name);
  }

  // ------------------------------------------------------------------ a Momento musical takes the music (src/momentos)
  private suspended = false;
  private afterSuspend = false;
  private goCalls = 0;
  /** a Momento plays its original song over the battle: stop following / reacting / re-cueing until resume() */
  suspend() {
    if (this.disposed) return;
    this.suspended = true;
    // nothing muffles a Momento (doc 29 §6): H35's RUIDO lifts its duck and low-pass while the original plays;
    // resetting the level makes watchRuido() put them back on the first frame after resume()
    if (this.ruidoDucked) {
      audioApi.duck(false, this.plan?.ruido?.duckDb ?? 6, 'ruido');
      this.ruidoDucked = false;
    }
    if (this.plan?.ruido && this.ruidoLevel !== 0) setMusicLowpass(null, 0.2);
    this.ruidoLevel = -1;
  }
  /**
   * The Momento is over: signals that arrived meanwhile (the phase it staged: 'fase:<id>') are evaluated now, and the
   * first jump re-syncs the clock from scratch (the song playing is the Momento's, not ours). No rule fires → the plan's
   * song comes back at its loop start on the next bar. `over`: the Momento ended the fight — nothing is re-cued.
   */
  resume(over = false) {
    if (!this.suspended || this.disposed) return;
    this.suspended = false;
    // the Momento ENDED the battle (FaseDef.endsBattle): no battle song comes back — onFinish() plays the ending
    if (over) {
      this.signals.length = 0;
      return;
    }
    this.afterSuspend = true;
    const before = this.goCalls;
    while (this.signals.length) this.evaluate({ kind: 'signal', name: this.signals.shift()! });
    if (this.goCalls !== before) return;
    const tl = this.clock.tl;
    const p = this.plan;
    if (!tl || !p) return;
    const L = this.loopFor(tl, p.loop);
    const at = L?.start ?? 0;
    this.afterSuspend = false;
    audioApi.cue(tl.track, { at, quantize: 'bar', loop: !!L, sync: true, fadeIn: 0.06, restart: true });
    this.audioAsked = true;
    this.lastCue = perf();
    this.clock.start({ ...tl, loop: L }, at, audioUsable());
  }

  // ------------------------------------------------------------------ per frame
  private tick(t?: Ticker) {
    if (this.disposed || this.s.destroyed || this.suspended) return;
    if (t) this.frameDt += (Math.min(0.1, t.deltaMS / 1000) - this.frameDt) * 0.1;
    const p = this.plan;
    const u = this.clock.update();
    const tl = this.clock.tl;
    if (p && tl && u !== null && this.cursor) {
      if (this.clock.discontinuity) {
        this.clock.discontinuity = false;
        this.cursor.reset(u, tl.events, tl.loop);
      }
      for (const d of this.cursor.advance(u)) this.deliver(d, tl);
    }
    this.watchPhase();
    while (this.signals.length) this.evaluate({ kind: 'signal', name: this.signals.shift()! });
    this.watchRuido();
    this.drawRing();
    this.watchSong();
  }

  private pushTrace<T>(arr: T[], x: T) {
    if (!import.meta.env.DEV) return;
    arr.push(x);
    if (arr.length > 4000) arr.shift();
  }

  private deliver(d: Delivered, tl: Timeline) {
    const e = d.e;
    if (import.meta.env.DEV && e.type !== 'beat') this.pushTrace(this.trace.events, { type: e.type, name: e.name, u: d.u, perf: perf(), ctx: audio.ctx?.currentTime ?? null, late: Math.round(d.late * 1000) });
    if (this.ended && e.type !== 'section') return;
    const p = this.plan!;
    const sec = sectionAtFile(tl.map, e.t);
    const ev: ReactionEvent = { type: e.type, name: e.name, strength: e.strength, energy: sec?.energy ?? 0.5, section: sec?.name ?? null };
    const phase = this.s.phase as ScenePhase;
    p.reactions.forEach((r, i) => {
      if (!reactionMatches(r, ev, phase)) return;
      const n = (this.everyCount.get(i) ?? 0) + 1;
      this.everyCount.set(i, n);
      if ((r.every ?? 1) > 1 && n % (r.every ?? 1) !== 1) return;
      const k = (r.amount ?? 1) * (e.type === 'hit' ? Math.max(0.5, e.strength ?? 1) : 1);
      for (const v of r.do) this.react(v, k, r.color, e, tl);
    });
  }

  private react(verb: string, k: number, color: number | undefined, e: GridEvent, tl: Timeline) {
    const st = this.stage;
    if (!st) return;
    // a flight in the air owns the camera: ambient verbs stay ambient
    const busy = !!this.s.follow;
    switch (verb) {
      case 'camera':
        if (!busy) st.camera(k);
        break;
      case 'sky':
        st.sky(k, color);
        break;
      case 'sea':
        st.sea(k);
        break;
      case 'crew':
        st.crew(k);
        break;
      case 'ui':
        if (this.s.phase === 'aim') st.ui(k);
        break;
      case 'freeze':
        if (!busy) st.freeze(stopLength(tl.map, e.t));
        break;
      case 'special':
        st.special(k, color);
        break;
      case 'tide':
        st.tide(k, color, Math.min(10, secPerBar(tl.map) * 4));
        break;
    }
  }

  // ------------------------------------------------------------------ turns & state rules
  private watchPhase() {
    const ph = this.s.phase as ScenePhase;
    const prev = this.lastPhase;
    if (ph === prev) return;
    this.lastPhase = ph;
    if (ph === 'enemy') {
      this.turns.enemy++;
      this.firstVolleyReset();
      this.evaluate({ kind: 'enemyTurn', n: this.turns.enemy });
    } else if ((ph === 'aim' || ph === 'flight') && (prev === 'enemy' || prev === 'intro')) {
      this.turns.player++;
      this.evaluate({ kind: 'playerTurn', n: this.turns.player });
      if (this.turns.player === 1 && this.plan?.sincro.teach) this.teachIntro();
    }
  }
  private firstVolleyReset() {
    this.volleyPrev = null;
  }

  private evaluate(trigger: { kind: 'enemyTurn' | 'playerTurn'; n: number } | { kind: 'signal'; name: string }) {
    const p = this.plan;
    if (!p || this.ended || !this.following) return;
    const tl = this.clock.tl;
    const pos = this.clock.file();
    const sim = this.s.sim;
    const facts = {
      trigger,
      turn: sim.turn,
      enemyHull: sim.hullPct(1),
      playerHull: sim.hullPct(0),
      bossPhase: sim.boss?.phase ?? 0,
      pos,
      looped: this.clock.looped || (pos !== null && this.clock.u !== null && Math.abs(pos - this.clock.u) > 0.01),
      section: tl && pos !== null ? sectionAtFile(tl.map, pos)?.name ?? null : null,
      timeOf: (n: string) => (tl ? timeOfName(tl.map, n) : null),
    };
    const hit = pickRule(p.states, facts, this.used);
    if (!hit) return;
    if (hit.rule.once !== false) this.used.add(hit.index);
    void this.go(hit.rule.to, `regla ${hit.rule.id ?? hit.index}`);
  }

  /** move the music to a target (quantized). Narrative targets outlive the battle. */
  private async go(t: MusicTarget, why: string, opts: { narrative?: boolean; releaseAfterSec?: number } = {}): Promise<void> {
    this.goCalls++;
    const p = this.plan;
    const track = t.track ?? this.clock.tl?.track ?? p?.track;
    if (!track) return;
    const tl = await this.timelineOf(track);
    const file = tl ? timeOfName(tl.map, t.section) : null;
    if (!tl || file === null) {
      if (t.fallback) return this.go(t.fallback, `${why} (alternativa)`, opts);
      return;
    }
    if (this.disposed && !(opts.narrative ?? t.narrative)) return;
    const L = validLoop(tl.map.loop);
    // loop only when the target lies inside the loop region (a cue past the loop end would wrap straight back)
    const loop = t.loop ?? (!!L && file >= L.start - 0.01 && file < L.end - 1);
    const narrative = opts.narrative ?? t.narrative ?? false;
    if (t.stinger) audioApi.stinger(t.stinger);
    audioApi.cue(track, { section: t.section, quantize: t.quantize ?? 'bar', loop, sync: true, fadeIn: 0.06, narrative, restart: true });
    this.audioAsked = true;
    this.lastCue = perf();
    const timeline: Timeline = { ...tl, loop: this.loopFor(tl, loop) };
    if (this.afterSuspend) {
      // right after a Momento: the deck playing isn't ours — follow the new one from scratch
      this.afterSuspend = false;
      this.clock.start(timeline, file, audioUsable());
    } else this.clock.jump(timeline, file, t.quantize ?? 'bar', audioUsable());
    this.pushTrace(this.trace.jumps, { perf: perf(), why, track, section: t.section });
    if (narrative && opts.releaseAfterSec) {
      const ref = track;
      window.setTimeout(() => {
        if (audioApi.currentTrack() === ref) audioApi.release(4);
      }, opts.releaseAfterSec * 1000);
    }
  }

  /** the plan's song stopped mid-battle (a non-looping section reached the end): back to its loop */
  private watchSong() {
    const p = this.plan;
    if (!p || this.ended || !this.following || !this.audioAsked || this.clock.mode !== 'internal' || !audioUsable()) return;
    // a deck asked for is still decoding (weak CPU): wait for it, never ask again on top of it
    if (this.clock.waitingForAudio) return;
    const now = perf();
    if (now - this.lastCue < 12000) return;
    this.lastCue = now;
    const tl = this.clock.tl;
    const pos = this.clock.file();
    if (!tl || pos === null) return;
    // the song ended (internal clock ran past its end): endTo; otherwise re-cue where the internal clock is
    if (p.endTo && (pos >= tl.map.duration - 0.5 || !audioApi.currentTrack())) {
      void this.go(p.endTo, 'fin de la canción');
      return;
    }
    const L = this.loopFor(tl, p.loop);
    audioApi.cue(tl.track, { at: pos + 0.1, loop: !!L, sync: true, quantize: 'now', fadeIn: 0.4, restart: true });
    this.clock.start({ ...tl, loop: L }, pos + 0.1, true);
  }

  // ------------------------------------------------------------------ enemy choreography
  /** sync is on for this battle right now */
  get volleySync() {
    return !!this.plan?.sync.enabled && !this.ended && this.clock.u !== null && !!this.clock.tl;
  }

  /**
   * natural real-time flight to the impact we time (s): the first BIG impact the screen shows (a piercing shot's small
   * puffs through the first layers come earlier and don't count — BattleScene shows them as puffs), else the first
   * impact of any path (all paths advance in lockstep in flyShot), else the end of the flight
   */
  private flightOf(paths: ShotPath[], events: BattleEvent[], quick: boolean): { idx: number; sec: number } {
    let idx = Infinity;
    for (const e of events) if (e.k === 'impact' && e.radius > 24 && e.total > 0 && e.at < idx) idx = e.at;
    if (!Number.isFinite(idx)) for (const p of paths) idx = Math.min(idx, p.impacts.length ? p.impacts[0] : p.points.length - 1);
    if (!Number.isFinite(idx)) idx = 0;
    return { idx, sec: idx / (120 * (quick ? 1.7 : 1)) };
  }

  /**
   * Before an ENEMY shot is shown (its result is already in the sim): wait — at most a bar, the first big move a bit
   * more — so its impact lands on a suitable hit; the shooter telegraphs on the beats while it waits. Cannons of one
   * volley keep a beat apart or BATCH on a strong accent.
   */
  async beforeEnemyShot(res: { paths: ShotPath[]; shot: ShotDef; events: BattleEvent[] }, who: 'cat' | 'cannon' | 'boss', uid: string | null, quick: boolean): Promise<void> {
    const p = this.plan;
    if (!p || !this.volleySync || this.s.fast || !res.paths.length) return;
    // a jump on its way (the first enemy turn's drop): give it a moment to land
    const t0 = perf();
    while (this.clock.jumping && perf() - t0 < 2500 && !this.disposed) await nextFrame();
    const tl = this.clock.tl;
    const now = this.clock.now();
    if (!tl || now === null || this.disposed) return;
    const { idx, sec } = this.flightOf(res.paths, res.events, quick);
    const spb = secPerBeat(tl.map);
    const bar = secPerBar(tl.map);
    const first = who === 'cat' && this.firstEnemyShot;
    if (who === 'cat') this.firstEnemyShot = false;
    const hits = landingSpots(tl.events, tl.map, tl.loop, now, now + sec * p.sync.stretch[1] + 2.2 * bar);
    const slot = chooseSlot({ now, flight: sec, hits, spb, bar, cfg: p.sync, first, prev: who === 'cannon' ? this.volleyPrev : null });
    if (!slot) {
      if (who === 'cannon') this.volleyPrev = null;
      return;
    }
    if (who === 'cannon') this.volleyPrev = { u: slot.hit.u, n: slot.batched ? (this.volleyPrev?.n ?? 0) + 1 : 1 };
    this.pushTrace(this.trace.slots, { who, flight: sec, delay: slot.delay, rate: slot.rate, hitU: slot.hit.u, kind: slot.hit.kind, strength: slot.hit.strength, batched: slot.batched, perf: perf() });
    // telegraph on the beats while the release waits
    const beats = occurrences(tl.events, now, slot.release, tl.loop).filter((o) => o.e.type === 'beat').map((o) => o.u);
    const muzzle = res.paths[0].points[0];
    const cap = (first ? Math.max(p.sync.maxDelayBars, p.sync.firstMove.maxDelayBars) : p.sync.maxDelayBars) * bar + 0.3;
    const start = perf();
    let bi = 0;
    for (;;) {
      if (this.disposed || this.s.destroyed || this.s.fast) break;
      const u = this.clock.now();
      if (u === null || u >= slot.release - 0.008 || (perf() - start) / 1000 > cap) break;
      while (bi < beats.length && u >= beats[bi]) {
        this.stage?.telegraph(who === 'cat' ? uid : null, muzzle.x, muzzle.y, 0.5 + 0.5 * (bi / Math.max(1, beats.length)));
        bi++;
      }
      await nextFrame();
    }
    const u0 = this.clock.now() ?? slot.release;
    if (slot.hit.u - u0 > 0.05) this.flights.set(res.paths, { u0, uHit: slot.hit.u, idx });
    this.targets.push({ u: slot.hit.u, strength: slot.hit.strength, kind: slot.hit.kind, claimed: false, who });
    if (this.targets.length > 24) this.targets.shift();
  }

  /**
   * flyShot asks this every frame for a synced flight: how far (in sim steps) the projectile should be NOW so it
   * reaches its impact exactly on the hit — driven by the music clock, not by frame time. undefined = not synced.
   */
  flightAcc(paths: ShotPath[], idx: number, stepDt: number): number | undefined {
    const f = this.flights.get(paths);
    if (!f) return undefined;
    const u = this.clock.now();
    if (u === null || idx >= f.idx || this.disposed) {
      this.flights.delete(paths);
      return undefined;
    }
    const prog = Math.max(0, Math.min(1, (u + Math.min(0.05, this.frameDt / 2) - f.u0) / Math.max(0.05, f.uHit - f.u0)));
    const want = Math.floor(f.idx * prog + 1e-6);
    return want > idx ? (want - idx) * stepDt + 1e-9 : 0;
  }

  /** an impact is being shown (BattleScene.applyEvent): synced ones get the camera / light they deserve */
  onImpact(e: Extract<BattleEvent, { k: 'impact' }>) {
    if (!this.plan || !this.stage || this.ended) return;
    const u = this.clock.now();
    const tl = this.clock.tl;
    if (u === null || !tl) return;
    const t = this.targets.find((x) => Math.abs(u - x.u) <= 0.15);
    if (t) {
      // every synced impact is measured; a batch on one accent reacts once
      this.pushTrace(this.trace.impacts, { perf: perf(), u, hitU: t.u, errMs: Math.round((u - t.u) * 1000), strength: t.strength, who: t.who, first: !t.claimed });
      if (t.claimed) return;
      t.claimed = true;
      this.stage.camera(t.strength);
      this.stage.sky(0.4 + 0.6 * t.strength);
      if (t.strength >= 0.9 || t.kind === 'drop') this.stage.sea(t.strength, e.x);
      return;
    }
    // the player's own impact landing on a strong hit: a flourish, nothing more
    if (e.side === 1) {
      const near = hitsBetween(tl.events, tl.map, tl.loop, u - 0.13, u + 0.13).find((h) => h.strength >= 0.8);
      if (near) this.stage.flourish(e.x, e.y, near.strength);
    }
  }

  /** a cataclysm set piece is about to play: start it on the next downbeat (≤ setPieceMaxBars) */
  async beforeSetPiece() {
    const p = this.plan;
    const tl = this.clock.tl;
    const now = this.clock.now();
    if (!p || !tl || now === null || this.s.fast) return;
    const nb = nextBar(tl.events, tl.loop, now, 0.05);
    if (nb === null || nb - now > p.sync.setPieceMaxBars * secPerBar(tl.map)) return;
    const start = perf();
    while (!this.disposed && (this.clock.now() ?? nb) < nb - 0.01 && perf() - start < 2500) await nextFrame();
  }

  // ------------------------------------------------------------------ SINCRO
  private windowState(): { toNext: number | null; open: boolean; w: number } {
    const p = this.plan!;
    const tl = this.clock.tl;
    const u = this.clock.u;
    const w = p.sincro.windowMs / 1000;
    if (!tl || u === null) return { toNext: null, open: false, w };
    const hs = hitsBetween(tl.events, tl.map, tl.loop, u - w, u + 1.2).filter((h) => opensWindow(h, p.sincro));
    let toNext: number | null = null;
    let open = false;
    for (const h of hs) {
      if (Math.abs(u - h.u) <= w) open = true;
      if (h.u > u && (toNext === null || h.u - u < toNext)) toNext = h.u - u;
    }
    return { toNext, open, w };
  }

  /** the shooter could fire a combo with SINCRO (the ring only shows when it means something) */
  private sincroCapable() {
    const cat = this.s.sim.sides[0].cats.find((c) => c.def.uid === this.s.selected);
    return !!scComboFor(this.s.sim, cat);
  }

  private drawRing() {
    const ring = this.ring;
    if (!ring) return;
    const vis = !this.ended && this.s.phase === 'aim' && this.clock.u !== null && this.sincroCapable();
    if (!vis) return ring.draw({ visible: false, x: 0, y: 0, toNext: null, open: false, w: 0 });
    const m = this.s.sim.muzzle(0, this.s.selected);
    const ws = this.windowState();
    ring.draw({ visible: true, x: m.x, y: m.y, ...ws });
  }

  /**
   * The player just released a shot: is it SINCRO? (latency-compensated: the heard position minus the player's
   * rhythm offset). Returns the explicit input for sim.fire — the sim decides what it does.
   */
  sincroNow(inputLagSec = 0.008): boolean {
    const p = this.plan;
    if (!p?.sincro.enabled || this.ended) return false;
    const tl = this.clock.tl;
    const heard = this.clock.now();
    if (!tl || heard === null) return false;
    const capable = this.sincroCapable();
    const hits = hitsBetween(tl.events, tl.map, tl.loop, heard - 0.6, heard + 0.6);
    // the clock already subtracted the offset (audio mode): judge on the heard position as is
    const j = sincroJudge({ heardU: heard, inputLag: inputLagSec, offsetMs: 0, hits, cfg: p.sincro });
    if (capable) {
      this.sincroStats.shots++;
      if (j) this.sincroStats.onBeat++;
    }
    this.pushTrace(this.trace.sincro, { perf: perf(), ok: !!j, deltaMs: j ? Math.round(j.delta * 1000) : null });
    if (j && capable) {
      const m = this.s.sim.muzzle(0, this.s.selected);
      const pt = this.s.overlay.toLocal(this.s.world.toGlobal(m));
      floatText(this.s.overlay, pt.x, pt.y - 90, 'SINCRO', { color: 0xffe14a, size: 54, font: F.poster, rise: 50, dur: 0.9 });
      audioApi.stinger('sincro');
      sfx('zap', 1.5);
      this.stage?.sky(0.6, 0xffe14a);
      // the teaching battle's payoff, once
      if (p.sincro.teach && !this.taught) {
        this.taught = true;
        floatText(this.s.overlay, 960, 260, '¡ESO ES SINCRO!', { color: 0xffe14a, size: 64, font: F.poster, rise: 40, dur: 1.6 });
      }
    }
    return !!j;
  }
  /**
   * A teaching battle's first turn: if nobody aboard can SINCRO, say what it needs; if the chosen cat can't but a
   * crewmate can, point at it. Words about the cats and the ring only — never about the music.
   */
  private teachIntro() {
    const sim = this.s.sim;
    const crew = sim.sides[0].cats.filter((c) => !c.ko);
    const able = crew.filter((c) => scComboFor(sim, c));
    const line = !able.length
      ? 'SINCRO: NECESITAS FUEGO + TORMENTA EN TU TRIPULACIÓN'
      : !able.some((c) => c.def.uid === this.s.selected)
        ? `SINCRO: ${able.map((c) => c.def.name.toUpperCase()).join(' O ')} LO TIENE`
        : null;
    if (line) floatText(this.s.overlay, 960, 300, line, { color: 0xffe14a, size: 40, font: F.poster, rise: 20, dur: 3.2 });
  }
  private taught = false;

  /** «Coreografía» (H51): share of SINCRO-capable releases that were on the pulse */
  get sincroAccuracy() {
    return this.sincroStats.shots ? this.sincroStats.onBeat / this.sincroStats.shots : 0;
  }

  // ------------------------------------------------------------------ RUIDO (H35)
  private watchRuido() {
    const cfg = this.plan?.ruido;
    if (!cfg || this.ended) return;
    const st = nzState(this.s.sim);
    if (!st) return;
    const level = st.furious ? 3 : Math.min(3, st.ruido);
    if (level === this.ruidoLevel) return;
    this.ruidoLevel = level;
    setMusicLowpass(cfg.lowpassHz[level] ?? null, 0.6);
    const duck = level >= cfg.duckFrom;
    if (duck !== this.ruidoDucked) {
      this.ruidoDucked = duck;
      audioApi.duck(duck, cfg.duckDb, 'ruido');
    }
  }

  // ------------------------------------------------------------------ the end
  /** the battle is decided (BattleScene.finish): the ending music, on the next bar */
  onFinish(won: boolean) {
    if (this.ended || !this.active) return;
    this.ended = true;
    this.ring?.draw({ visible: false, x: 0, y: 0, toNext: null, open: false, w: 0 });
    if (this.ruidoDucked) {
      audioApi.duck(false, this.plan?.ruido?.duckDb ?? 6, 'ruido');
      this.ruidoDucked = false;
    }
    if (this.plan?.ruido) setMusicLowpass(null, 0.8);
    const sim = this.s.sim;
    // a story goal's finale (H38: Canelo's final blow) wins over the plan's own ending
    if (won && sim.finalBlow) {
      const fb = sim.finalBlow;
      const species = G.s?.cats?.find((k) => k.uid === fb)?.species ?? sim.sides[0].cats.find((c) => c.def.uid === fb)?.def.catId ?? '';
      const g = this.goals.find((x) => x.finale && (!x.species || bare(x.species) === bare(species)));
      if (g?.finale) {
        this.following = false;
        void this.go(g.finale, `remate ${g.id}`, { narrative: g.finale.narrative ?? true, releaseAfterSec: g.finale.releaseAfterSec });
        if (g.finale.unlock) this.unlocks.push(g.finale.unlock);
        return;
      }
    }
    const p = this.plan;
    if (!p) return;
    const end = won ? p.victory : p.defeat;
    if (end.unlock && won) this.unlocks.push(end.unlock);
    if (end.stinger) audioApi.stinger(end.stinger);
    if (end.section) {
      this.following = false;
      void this.go({ track: end.track, section: end.section, quantize: end.quantize ?? 'bar', loop: false, narrative: end.narrative }, won ? 'victoria' : 'derrota', { narrative: end.narrative, releaseAfterSec: end.releaseAfterSec });
      return;
    }
    if (!won) {
      // the song deflates under the end card (the results screen takes the music back)
      this.defeatDucked = true;
      audioApi.duck(true, 12, 'battle-defeat');
      setMusicLowpass(900, end.fade ?? 2.5);
    }
  }
}

/** how long a stop holds (its silence marker pair; 0.25 s by default) */
function stopLength(map: BeatMap, t: number): number {
  const m = map.markers.find((x) => /^silence_\d+$/.test(x.name) && Math.abs(x.time - t) < 0.12);
  if (m) {
    const end = map.markers.find((x) => x.name === `${m.name}_end`);
    if (end && end.time > m.time) return Math.min(0.4, end.time - m.time);
  }
  return 0.25;
}

/** create + start (BattleScene.enter) — inert when the battle has no plan */
export function startBattleMusic(s: BattleScene): BattleMusic {
  const m = new BattleMusic(s);
  m.start();
  return m;
}

export type { TimedHit };
export { filePos, rhythmOffsetSec };
