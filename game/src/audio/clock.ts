/**
 * Beat-map event scheduler, driven by the AUDIO clock (never by frame time).
 *
 * The player calls tick(u) with the unwrapped position the listener is HEARING right now (audio
 * clock + output-latency compensation, see player.ts › audibleNow). Every call fires the occurrences
 * whose unwrapped time falls in (firedUpTo, u + lookahead] and advances firedUpTo. Because that
 * window only moves forward and is half-open, an occurrence can never fire twice — not with jitter,
 * not when time goes backwards (seek/re-anchor), not with two tick sources (rAF + timer).
 *
 * Big frame gaps (low FPS, throttled background tab) — one consistent rule:
 *  - beat / bar / hit: fired only if late ≤ maxLate; older ones are SKIPPED (counted in stats.skipped)
 *  - section:    the most recent one crossed is always delivered (it is the current state); earlier
 *                late sections in the same gap are skipped
 *  - marker / voice: every one crossed is delivered, in order, flagged `late` (they are narrative
 *                cues), capped at maxMarkers per tick
 * A gap longer than maxScan is not scanned (only its last maxScan seconds are).
 */
import { GridEvent, Loop, occurrences } from './beatgrid';

export interface BeatInfo {
  /** AudioContext time at which the event is (was) audible */
  time: number;
  beat?: number;
  bar?: number;
  name?: string;
  /** seconds the event is being delivered after it became audible (0 when on time) */
  late?: number;
  /** id of the track (or variation) the event belongs to */
  track?: string;
  /** 'hit' events: 0..1 */
  strength?: number;
}
type Fn = (info: BeatInfo) => void;

export interface SchedulerOpts {
  /** fire this far ahead of audibility (≈ one frame: the visual lands with the sound) */
  lookahead?: number;
  /** beats/bars later than this are skipped */
  maxLate?: number;
  /** longest gap scanned in one tick */
  maxScan?: number;
  maxMarkers?: number;
}

export class BeatScheduler {
  private events: GridEvent[] = [];
  private loop: Loop | null = null;
  private firedUpTo = 0;
  private active = false;
  private toCtx: (u: number) => number = (u) => u;
  private track = '';
  private subs = new Map<string, Set<Fn>>();
  readonly opts: Required<SchedulerOpts>;
  stats = { fired: 0, skipped: 0, late: 0, ticks: 0 };

  constructor(o: SchedulerOpts = {}) {
    this.opts = { lookahead: o.lookahead ?? 0.016, maxLate: o.maxLate ?? 0.25, maxScan: o.maxScan ?? 120, maxMarkers: o.maxMarkers ?? 16 };
  }

  /**
   * Start following a new timeline. Occurrences at or before `startU` are considered already past
   * (a cue that starts mid-song does not replay its earlier markers); the section containing the
   * start is announced on the first tick.
   */
  setTimeline(events: GridEvent[], loop: Loop | null, startU: number, toCtx: (u: number) => number, track = '') {
    this.events = events;
    this.loop = loop;
    this.toCtx = toCtx;
    this.track = track;
    this.firedUpTo = startU - 1e-6;
    this.active = true;
    // the section we start inside fires right away (its start is <= startU, so it'd be skipped otherwise)
    let cur: GridEvent | null = null;
    for (const e of events) {
      if (e.type !== 'section') continue;
      if (e.t <= startU + 1e-6) cur = e;
    }
    this.pendingSection = cur && cur.t < startU - 1e-6 ? cur : null;
  }
  private pendingSection: GridEvent | null = null;

  /** stop following (nothing synced is playing) */
  clear() {
    this.active = false;
    this.events = [];
    this.pendingSection = null;
  }
  get following() {
    return this.active;
  }
  /** a seek: jump the cursor (events in between are not delivered) */
  jump(u: number) {
    this.firedUpTo = u - 1e-6;
  }

  on(event: string, fn: Fn): () => void {
    let s = this.subs.get(event);
    if (!s) this.subs.set(event, (s = new Set()));
    s.add(fn);
    return () => void s!.delete(fn);
  }
  /** listeners on an event (debug) */
  listeners(event: string) {
    return this.subs.get(event)?.size ?? 0;
  }

  private emit(ev: string, info: BeatInfo) {
    const s = this.subs.get(ev);
    if (!s?.size) return;
    for (const fn of [...s]) {
      try {
        fn(info);
      } catch (e) {
        console.error(`[audio] listener ${ev}`, e);
      }
    }
  }
  private fire(e: GridEvent, u: number, now: number) {
    const late = Math.max(0, now - u);
    if (late > 0.001) this.stats.late++;
    this.stats.fired++;
    const info: BeatInfo = { time: this.toCtx(u), beat: e.beat, bar: e.bar, name: e.name, late: late > 0.001 ? late : 0, track: this.track, strength: e.strength };
    if (e.type === 'beat') this.emit('beat', info);
    else if (e.type === 'bar') this.emit('bar', info);
    else {
      this.emit(`${e.type}:${e.name}`, info);
      this.emit(e.type, info);
    }
  }

  /** advance to the audible unwrapped position `u` */
  tick(u: number) {
    if (!this.active || !Number.isFinite(u)) return;
    this.stats.ticks++;
    if (this.pendingSection) {
      const s = this.pendingSection;
      this.pendingSection = null;
      this.fire(s, Math.min(u, s.t), u);
    }
    const b = u + this.opts.lookahead;
    if (b <= this.firedUpTo) return;
    let a = this.firedUpTo;
    if (b - a > this.opts.maxScan) {
      this.stats.skipped++;
      a = b - this.opts.maxScan;
    }
    this.firedUpTo = b;
    const occ = occurrences(this.events, a, b, this.loop);
    if (!occ.length) return;
    // the latest section crossed always wins; older late ones are skipped
    let lastSection = -1;
    for (let i = 0; i < occ.length; i++) if (occ[i].e.type === 'section') lastSection = i;
    let markers = 0;
    for (let i = 0; i < occ.length; i++) {
      const { e, u: ue } = occ[i];
      const late = u - ue;
      if (e.type === 'beat' || e.type === 'bar' || e.type === 'hit') {
        if (late > this.opts.maxLate) {
          this.stats.skipped++;
          continue;
        }
      } else if (e.type === 'section') {
        if (i !== lastSection && late > this.opts.maxLate) {
          this.stats.skipped++;
          continue;
        }
      } else if (e.type === 'marker' || e.type === 'voice') {
        if (++markers > this.opts.maxMarkers) {
          this.stats.skipped++;
          continue;
        }
      }
      this.fire(e, ue, u);
    }
  }
}
