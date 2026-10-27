/**
 * MOMENTO CLOCK — the master clock of a Momento, in MOMENTO time m (tests/momentos.test.ts drive it with a fake driver).
 *
 *   audio     the song really plays: m comes from the HEARD song position (audioApi.trackTime(), output latency
 *             compensated) minus the player's «Ajuste de ritmo», mapped through the edit segments
 *   internal  no sound (declined / locked / failed / too slow): performance.now() paces the very same timeline — the
 *             Momento plays identically with strong visual beats, and never waits
 *   pending   the song was asked for and is about to sound (≤ PENDING_MS), m holds at the start
 *
 * Edits (segments): the next segment is cued half a bar before the boundary with quantize 'bar' — the engine starts the
 * new deck exactly on that bar line, reusing the decoded buffer (no re-decode) — and the clock follows it.
 * Pause: the deck pauses (audio) / the pace stops (internal). Late join: in internal mode, when the sound becomes
 * usable, the song is cued at the current position and the clock hops onto it once it is heard.
 */
import type { Segment } from './types';
import { mToSong } from './time';

export interface AudioDriver {
  /** an AudioContext exists and is running */
  usable(): boolean;
  /** heard position of the synced deck (s, file time) or null */
  trackTime(): number | null;
  /** ref currently playing */
  current(): string | null;
  /** start / jump the song (file position), quantized on the playing deck */
  cue(at: number, quantize: 'now' | 'bar'): void;
  pause(on: boolean): void;
  /** the player's «Ajuste de ritmo» (s, + = the music reaches the ears later) */
  offset(): number;
  /** performance.now() */
  now(): number;
}

export type MomentoClockMode = 'pending' | 'audio' | 'internal';
/** a requested song that hasn't sounded after this long: the Momento paces itself */
export const PENDING_MS = 2600;
/** audio readings missing this long → internal */
const LOST_MS = 600;
/** one frame of display latency: draw the state that will be ON SCREEN when this frame shows */
export const VISUAL_LEAD = 0.012;

export class MomentoClock {
  mode: MomentoClockMode = 'pending';
  /** last computed momento time */
  m = 0;
  paused = false;
  /** the song was asked for at least once (an audio Momento) */
  wantsAudio = false;
  /** at some point the clock ran on audio / on internal */
  usedAudio = false;
  usedInternal = false;
  private seg = 0;
  private iM0 = 0;
  private iT0 = 0;
  private pendSince = 0;
  private lostSince = 0;
  private nextCued = -1;
  private lateJoin: { at: number; since: number } | null = null;
  log: { at: number; what: string }[] = [];

  constructor(
    private segs: Segment[],
    private d: AudioDriver,
    private track: string,
    /** bar length (s) — when the next segment is cued */
    private bar: number,
  ) {}

  private note(what: string) {
    this.log.push({ at: Math.round(this.d.now()), what });
    if (this.log.length > 80) this.log.shift();
  }

  /** begin at momento 0: with sound (cue the first segment) or on the internal clock */
  start(withAudio: boolean) {
    const s0 = this.segs[0];
    this.wantsAudio = withAudio;
    if (withAudio && this.d.usable() && s0) {
      this.mode = 'pending';
      this.pendSince = this.d.now();
      this.d.cue(s0.from, 'now');
      this.note(`pending @${s0.from.toFixed(2)}`);
    } else this.toInternal(0, 'sin audio');
  }

  private toInternal(m: number, why: string) {
    this.mode = 'internal';
    this.usedInternal = true;
    this.iM0 = m;
    this.iT0 = this.d.now();
    this.note(`internal (${why}) m=${m.toFixed(3)}`);
  }

  /** map a heard file position to momento time, following the segment the song is in */
  private fromFile(p: number): number | null {
    const segs = this.segs;
    const cur = segs[this.seg];
    if (!cur) return null;
    // the next segment started (its deck is the one heard now)
    const nx = segs[this.seg + 1];
    // (FILM-ACTO4) a LOOPED edit repeats material of the current segment (a derived piece under a longer film): the new
    // deck's position falls INSIDE the current segment's range, so it's told apart by the clock being at the boundary
    const atEnd = this.m >= cur.m0 + (cur.to - cur.from) - 0.6 && p < cur.to - 1;
    if (nx && this.nextCued === this.seg + 1 && p >= nx.from - 0.05 && p <= nx.from + 1.5 && (!(p >= cur.from && p <= cur.to - 0.25) || atEnd)) {
      this.seg++;
      this.note(`segmento ${this.seg} (${nx.from.toFixed(2)})`);
      return nx.m0 + (p - nx.from);
    }
    if (p >= cur.from - 0.3 && p <= cur.to + 1.5) return cur.m0 + (p - cur.from);
    return null;
  }

  /** one step (every frame). Returns the momento time to DRAW (visual lead included). */
  update(): number {
    const now = this.d.now();
    if (this.paused) return this.m + VISUAL_LEAD;
    if (this.mode === 'internal') {
      let m = this.iM0 + (now - this.iT0) / 1000;
      // the sound came back (the player unlocked it mid-way): cue the song where we are and hop on when it's heard
      if (this.wantsAudio && this.d.usable()) {
        const raw = this.d.trackTime();
        if (this.lateJoin && raw !== null && this.d.current() === this.track) {
          const mm = this.fromFileQuiet(raw - this.d.offset());
          if (mm !== null && Math.abs(mm - m) < 0.35) {
            this.mode = 'audio';
            this.usedAudio = true;
            this.lateJoin = null;
            this.note(`internal → audio m=${mm.toFixed(3)}`);
            m = Math.max(this.m, mm);
          }
        } else if (!this.lateJoin || now - this.lateJoin.since > 6000) {
          const { t, seg } = mToSong(this.segs, m + 0.35);
          if (seg === this.seg && t < (this.segs[seg]?.to ?? 0) - 1) {
            this.lateJoin = { at: t, since: now };
            this.d.cue(t, 'now');
            this.note(`late join cue @${t.toFixed(2)}`);
          }
        }
      }
      this.m = Math.max(this.m, m);
      this.maybeCueNext();
      return this.m + VISUAL_LEAD;
    }
    const raw = this.d.usable() ? this.d.trackTime() : null;
    const ref = this.d.current();
    if (this.mode === 'pending') {
      const s0 = this.segs[0];
      if (raw !== null && ref === this.track && s0 && raw >= s0.from - 0.2 && raw <= s0.from + 3) {
        this.mode = 'audio';
        this.usedAudio = true;
        this.note(`audio @${raw.toFixed(3)}`);
      } else if (now - this.pendSince > PENDING_MS || !this.d.usable()) {
        this.toInternal(0, 'la canción no llegó');
        return this.m + VISUAL_LEAD;
      } else return (this.m = 0);
    }
    // audio
    if (raw === null || ref !== this.track) {
      if (!this.lostSince) this.lostSince = now;
      if (now - this.lostSince > LOST_MS) {
        this.lostSince = 0;
        this.toInternal(this.m, 'se perdió el audio');
      }
      return this.m + VISUAL_LEAD;
    }
    this.lostSince = 0;
    const mm = this.fromFile(raw - this.d.offset());
    if (mm !== null) this.m = Math.max(this.m, mm);
    this.maybeCueNext();
    return this.m + VISUAL_LEAD;
  }
  private fromFileQuiet(p: number) {
    const cur = this.segs[this.seg];
    return cur && p >= cur.from - 0.3 && p <= cur.to + 1.5 ? cur.m0 + (p - cur.from) : null;
  }

  /** half a bar before a segment boundary: cue the next segment (the engine lands it ON the bar) */
  private maybeCueNext() {
    const k = this.seg + 1;
    const nx = this.segs[k];
    const cur = this.segs[this.seg];
    if (!nx || !cur || this.nextCued >= k) return;
    const endM = cur.m0 + (cur.to - cur.from);
    if (this.m < endM - this.bar * 0.5) return;
    this.nextCued = k;
    if (this.mode === 'audio') {
      this.d.cue(nx.from, 'bar');
      this.note(`cue segmento ${k} @${nx.from.toFixed(2)}`);
    } else {
      // internal: the pace simply continues into the next segment (momento time is continuous)
      this.seg = k;
    }
  }

  /** the momento time a gesture happened at (performance.now() timestamp of the event) */
  at(perfTs: number): number {
    if (this.paused) return this.m;
    const now = this.d.now();
    // the clock's m is "now" at the last update; events carry their own timestamp (usually ≤ 1 frame old)
    if (this.mode === 'internal') return this.iM0 + (Math.min(perfTs, now) - this.iT0) / 1000;
    const raw = this.d.usable() ? this.d.trackTime() : null;
    const base = raw !== null && this.d.current() === this.track ? (this.fromFileQuiet(raw - this.d.offset()) ?? this.m) : this.m;
    return base - Math.max(0, now - perfTs) / 1000;
  }

  pause(on: boolean) {
    if (on === this.paused) return;
    if (on) {
      if (this.mode === 'internal') this.m = this.iM0 + (this.d.now() - this.iT0) / 1000;
      this.paused = true;
      if (this.mode !== 'internal') this.d.pause(true);
      this.note(`pausa m=${this.m.toFixed(3)}`);
    } else {
      this.paused = false;
      if (this.mode === 'internal') {
        this.iM0 = this.m;
        this.iT0 = this.d.now();
      } else this.d.pause(false);
      this.note('sigue');
    }
  }

  /** which clocks this run used (result card) */
  get kind(): 'audio' | 'internal' | 'mixed' {
    return this.usedAudio && this.usedInternal ? 'mixed' : this.usedAudio ? 'audio' : 'internal';
  }
}
