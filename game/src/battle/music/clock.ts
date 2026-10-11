/**
 * The battle's MUSIC CLOCK: the heard position of the plan's song, in the engine's unwrapped time u.
 *
 *  audio     audioApi.trackTime() (the audio clock, latency-compensated: what is being HEARD now) minus the
 *            player's «Ajuste de ritmo». Used whenever the plan's song really plays.
 *  internal  the same timeline paced by performance.now() — audio off / locked / failed: the battle keeps its
 *            choreography and its SINCRO windows (visible on the same schedule), it never waits for sound.
 *  pending   the song was asked for and is loading (≤ PENDING_MS): no beat events yet.
 *
 * Reading the wrong deck is the classic bug here (trackTime() follows whichever deck is audible, and during a
 * crossfade that is still the OLD one). A new deck is only believed when its position is plausible for what was
 * asked (near the requested start) AND it broke continuity with the previous reading.
 */
import { audioApi } from '../../audio/api';
import type { BeatMap, GridEvent, Loop } from '../../audio/beatgrid';
import { audio } from '../../core/audio';
import { settings } from '../../core/settings';
import { filePos, nextBar } from './timeline';

export type ClockMode = 'pending' | 'audio' | 'internal';
export interface Timeline {
  track: string;
  map: BeatMap;
  events: GridEvent[];
  loop: Loop | null;
}

/** how long a requested song may take to become audible before the battle paces itself */
export const PENDING_MS = 2600;
/** a requested deck that is late is still followed when it finally sounds, up to this long after the request */
const AWAIT_MS = 20000;
/** a jump that never shows up in the audio is given up after this */
const JUMP_TIMEOUT_MS = 4500;
/** audio readings missing this long → internal (keeps the visuals going) */
const LOST_MS = 700;

const perf = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
export const audioUsable = () => !!audio.ctx && audio.ctx.state === 'running';
export const rhythmOffsetSec = () => Math.max(-0.2, Math.min(0.2, (Number(settings.rhythmOffsetMs) || 0) / 1000));

interface Expect {
  tl: Timeline;
  /** file position the new deck starts at */
  file: number;
  /** trackTime() when it was asked (the old deck's continuation is NOT the new deck) */
  baseU: number | null;
  basePerf: number;
  since: number;
  /** internal pacing: switch at this perf time (next bar) */
  atPerf?: number;
}

export class MusicClock {
  mode: ClockMode = 'pending';
  tl: Timeline | null = null;
  /** heard position (u) at the last update, offset applied */
  u: number | null = null;
  /** raw audio reading at the last update (no offset) */
  private rawU: number | null = null;
  private rawPerf = 0;
  /** internal pacing: u = iU0 + (perf − iT0) / 1000 */
  private iU0 = 0;
  private iT0 = 0;
  private expect: Expect | null = null;
  /**
   * a deck asked for that didn't sound in time (slow decode on a weak CPU): the internal clock paces the battle, but the
   * moment that deck is heard the clock follows it (one resync) — it is never asked for again meanwhile
   */
  private awaiting: Expect | null = null;
  private lostSince = 0;
  /** set when the timeline changed under the reader (a jump / re-cue / mode switch): the cursor resets */
  discontinuity = false;
  /** where the current deck started (file time) — the song «looped» once u passes the loop end */
  startFile = 0;
  log: { at: number; what: string }[] = [];

  private note(what: string) {
    this.log.push({ at: Math.round(perf()), what });
    if (this.log.length > 60) this.log.shift();
  }

  /** follow `tl` from file position `file` (the cue was just issued, or there is no audio) */
  start(tl: Timeline, file: number, audioAsked: boolean) {
    this.tl = tl;
    this.startFile = file;
    this.awaiting = null;
    const now = perf();
    if (!audioAsked || !audioUsable()) {
      this.toInternal(tl, file, now, 'sin audio');
      return;
    }
    this.mode = 'pending';
    this.expect = { tl, file, baseU: audioApi.trackTime(), basePerf: now, since: now };
    this.note(`pending ${tl.track}@${file.toFixed(2)}`);
  }

  /**
   * The song moves to `file` of `tl` (a section jump, a song swap, a re-cue). Audio: the caller already issued the cue
   * (bar-quantized by the engine) and the clock waits for the new deck. Internal: switch at the next bar.
   */
  jump(tl: Timeline, file: number, quantize: 'bar' | 'beat' | 'now', audioAsked: boolean) {
    const now = perf();
    if (this.mode === 'audio' && audioAsked) {
      this.expect = { tl, file, baseU: this.rawU, basePerf: this.rawPerf || now, since: now };
      this.note(`jump(audio) ${tl.track}@${file.toFixed(2)}`);
      return;
    }
    const cur = this.u;
    let atPerf = now;
    if (quantize !== 'now' && cur !== null && this.tl) {
      const nb = nextBar(this.tl.events, this.tl.loop, cur, 0.05);
      if (nb !== null) atPerf = now + (nb - cur) * 1000;
    }
    if (this.mode === 'pending') {
      // nothing audible yet: start the internal clock there
      this.toInternal(tl, file, now, 'jump antes de sonar');
      return;
    }
    this.expect = { tl, file, baseU: null, basePerf: now, since: now, atPerf };
    this.note(`jump(internal) ${tl.track}@${file.toFixed(2)} en ${Math.round(atPerf - now)} ms`);
  }

  /** a jump is still on its way (scheduling must not look past it) */
  get jumping() {
    return !!this.expect && this.mode !== 'pending';
  }
  /** a requested deck is still loading (don't ask for it again) */
  get waitingForAudio() {
    return this.mode === 'pending' || (!!this.awaiting && perf() - this.awaiting.since < AWAIT_MS);
  }

  private toInternal(tl: Timeline, u0: number, at: number, why: string) {
    this.tl = tl;
    this.mode = 'internal';
    this.iU0 = u0;
    this.iT0 = at;
    this.expect = null;
    this.discontinuity = true;
    this.note(`internal (${why}) ${tl.track}@${u0.toFixed(2)}`);
  }

  /** one step (every frame). Returns the heard position (offset applied) or null. */
  update(now = perf()): number | null {
    const tl = this.tl;
    if (!tl) return (this.u = null);
    if (this.mode === 'internal') {
      const e = this.expect;
      if (e && e.atPerf !== undefined && now >= e.atPerf) {
        this.tl = e.tl;
        this.iU0 = e.file;
        this.iT0 = e.atPerf;
        this.startFile = e.file;
        this.expect = null;
        this.discontinuity = true;
        this.note(`internal → ${e.tl.track}@${e.file.toFixed(2)}`);
      }
      // the song started for real after all (late decode, or the player unlocked the sound): follow the audio
      const raw = audioUsable() ? audioApi.trackTime() : null;
      const ref = audioApi.currentTrack();
      const aw = this.awaiting;
      if (aw && now - aw.since > AWAIT_MS) this.awaiting = null;
      if (aw && raw !== null && ref === aw.tl.track && this.isNewDeck(raw, aw, now)) {
        this.mode = 'audio';
        this.tl = aw.tl;
        this.startFile = aw.file;
        this.awaiting = null;
        this.expect = null;
        this.rawU = raw;
        this.rawPerf = now;
        this.discontinuity = true;
        this.note(`audio (tarde) ${aw.tl.track}@${raw.toFixed(3)}`);
        return (this.u = raw - rhythmOffsetSec());
      }
      if (raw !== null && ref === this.tl?.track && this.plausible(raw, this.iU0 + (now - this.iT0) / 1000, 2.5)) {
        this.mode = 'audio';
        this.rawU = raw;
        this.rawPerf = now;
        this.discontinuity = true;
        this.note('internal → audio');
        return (this.u = raw - rhythmOffsetSec());
      }
      return (this.u = this.iU0 + Math.max(0, now - this.iT0) / 1000);
    }
    const raw = audioUsable() ? audioApi.trackTime() : null;
    const ref = audioApi.currentTrack();
    const e = this.expect;
    if (this.mode === 'pending') {
      if (e && raw !== null && ref === e.tl.track && this.isNewDeck(raw, e, now)) {
        this.mode = 'audio';
        this.tl = e.tl;
        this.startFile = e.file;
        this.expect = null;
        this.rawU = raw;
        this.rawPerf = now;
        this.discontinuity = true;
        this.note(`audio ${e.tl.track}@${raw.toFixed(3)}`);
        return (this.u = raw - rhythmOffsetSec());
      }
      if (now - (e?.since ?? now) > PENDING_MS || !audioUsable()) {
        // the song didn't come yet (locked, 404, slow decode): pace on our own from the asked start, keep listening for it
        const aw = e && audioUsable() ? e : null;
        this.toInternal(e?.tl ?? tl, (e?.file ?? 0) + Math.max(0, now - (e?.since ?? now)) / 1000, now, 'la canción no llegó');
        this.awaiting = aw;
        return (this.u = this.iU0);
      }
      return (this.u = null);
    }
    // audio
    if (e) {
      if (raw !== null && (ref === e.tl.track || ref === tl.track) && this.isNewDeck(raw, e, now)) {
        this.tl = e.tl;
        this.startFile = e.file;
        this.expect = null;
        this.discontinuity = true;
        this.note(`jump llegó ${e.tl.track}@${raw.toFixed(3)}`);
      } else if (now - e.since > JUMP_TIMEOUT_MS) {
        this.expect = null;
        this.note('jump perdido');
      }
    }
    const cur = this.tl!;
    if (raw === null || (ref !== cur.track && !(e && ref === e.tl.track))) {
      if (!this.lostSince) this.lostSince = now;
      const guess = this.rawU !== null ? this.rawU + (now - this.rawPerf) / 1000 : this.startFile;
      if (now - this.lostSince > LOST_MS) {
        this.lostSince = 0;
        this.toInternal(cur, guess, now, 'se perdió el audio');
        return (this.u = guess);
      }
      return (this.u = guess - rhythmOffsetSec());
    }
    this.lostSince = 0;
    // a reading that jumps without a jump asked (a re-cue by someone else, a seek): resync the readers
    if (this.rawU !== null && Math.abs(raw - (this.rawU + (now - this.rawPerf) / 1000)) > 0.35) this.discontinuity = true;
    this.rawU = raw;
    this.rawPerf = now;
    return (this.u = raw - rhythmOffsetSec());
  }

  /** the heard position right now (fresh read; offset applied) — for input judging */
  now(): number | null {
    if (this.mode === 'internal') return this.iU0 + Math.max(0, perf() - this.iT0) / 1000;
    if (this.mode === 'audio') {
      const raw = audioUsable() ? audioApi.trackTime() : null;
      if (raw !== null && this.rawU !== null && Math.abs(raw - (this.rawU + (perf() - this.rawPerf) / 1000)) < 0.35) return raw - rhythmOffsetSec();
      return this.u;
    }
    return null;
  }

  /** performance.now() at which unwrapped position u will be heard */
  perfAt(u: number): number | null {
    const cur = this.now();
    return cur === null ? null : perf() + (u - cur) * 1000;
  }

  /** file position heard now */
  file(): number | null {
    return this.u === null || !this.tl ? null : filePos(this.u, this.tl.loop);
  }
  /** the song passed its loop end at least once */
  get looped() {
    const L = this.tl?.loop;
    return !!L && this.u !== null && this.u >= L.end;
  }

  private plausible(raw: number, want: number, tol: number) {
    return Math.abs(raw - want) <= tol;
  }
  /** a reading belongs to the deck that was asked for */
  private isNewDeck(raw: number, e: Expect, now: number) {
    const p = filePos(raw, e.tl.loop);
    const near = raw >= e.file - 0.15 && raw <= e.file + 4.5 ? true : p >= e.file - 0.15 && p <= e.file + 4.5;
    if (!near) return false;
    if (e.baseU === null) return true;
    const cont = e.baseU + (now - e.basePerf) / 1000;
    // the old deck still talking (its continuation) is not the new one — unless both are the same place anyway
    return Math.abs(raw - cont) > 0.3 || Math.abs(e.file - cont) < 0.3;
  }
}
