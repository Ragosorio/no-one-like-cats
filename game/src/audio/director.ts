/**
 * The adaptive music director (stateful side of directorTable.ts).
 *
 * Owns: the adaptive state, the active cue, the Fonoteca's «listen», and the switch between file
 * music (MusicPlayer) and the Part I procedural sequencer (core/music.ts). Only ever ONE of them is
 * audible: switching to a file track fades the procedural submix (procBus) out and stops it; going
 * back fades it in again.
 */
import { audio } from '../core/audio';
import { music, Mood } from '../core/music';
import type { CueOpts, MusicState } from './api';
import { hasTrack, resolveTrack } from './catalog';
import { DirectorTable, Target, cleanTable, entryFor, quietOver, resolveTarget, sameTarget } from './directorTable';
import { MusicPlayer } from './player';
import { islandTrack, partII } from './fonoteca';
import TABLE_RAW from '../data/music/director.json';

export class Director {
  table: DirectorTable = cleanTable(TABLE_RAW);
  state: MusicState = 'title';
  context: string | undefined;
  private cueReq: { ref: string; opts: CueOpts } | null = null;
  private listenReq: { ref: string; loop: boolean; onEnd?: () => void } | null = null;
  private applied: Target | null = null;
  private rotation = new Map<string, number>();
  private procToken = 0;
  /** the procedural mood a file track interrupted (Part I cues give it back on release) */
  private resumeMood: Mood | null = null;
  /** refs whose file failed to load this session */
  readonly broken = new Set<string>();
  /** non-looping state tracks that already played to their end in the current state (no replay loop) */
  private spent = new Set<string>();
  private has = (ref: string) => !this.broken.has(ref) && !this.spent.has(ref) && hasTrack(ref);
  /** set when a state brought its own ambience (so leaving it can clear it) */
  onAmbience: ((bed: string, fade: number) => void) | null = null;
  onStinger: ((id: string) => void) | null = null;
  /** debug trail */
  trail: { t: number; what: string }[] = [];

  constructor(public player: MusicPlayer) {}

  private note(what: string) {
    this.trail.push({ t: Math.round((audio.ctx?.currentTime ?? 0) * 100) / 100, what });
    if (this.trail.length > 60) this.trail.shift();
  }

  setState(s: MusicState, o: { fade?: number; context?: string } = {}) {
    const changed = s !== this.state || o.context !== this.context;
    if (changed) {
      // a scene-scoped (non-narrative) cue ends when the scene's state changes
      if (this.cueReq && !this.cueReq.opts.narrative) this.cueReq = null;
      if (s !== this.state) this.rotation.set(s, (this.rotation.get(s) ?? -1) + 1);
      this.state = s;
      this.context = o.context;
      this.spent.clear();
      const e = partII() ? entryFor(this.table, s, o.context) : null;
      if (e?.ambience) this.onAmbience?.(e.ambience, e.fade ?? this.table.defaults.fade);
      if (e?.stinger) this.onStinger?.(e.stinger);
      this.note(`state ${s}${o.context ? `:${o.context}` : ''}`);
    }
    this.apply(o.fade);
  }
  cue(ref: string, o: CueOpts = {}) {
    this.cueReq = { ref, opts: o };
    this.note(`cue ${ref}${o.restart ? ' (restart)' : ''}`);
    // (ext) restart: a jump inside the song that is already playing (same ref) — a new deck at the next bar/beat
    this.apply(undefined, o.restart === true);
  }
  release(fade?: number) {
    if (!this.cueReq) return;
    this.note(`release ${this.cueReq.ref}`);
    this.cueReq = null;
    this.apply(fade);
  }
  get cueRef() {
    return this.cueReq?.ref ?? null;
  }
  /**
   * (agent FINAL) keyed QUIET holds: while any is on, the game's own music — the state's track, the island's, the
   * procedural moods — stays silent; cues (a film's song) and the Fonoteca still play. The Parte III finale holds it
   * («Música: ninguna»), so a film without its own song is silence, and a released film song falls back to silence
   * instead of the island's music.
   */
  private quiets = new Set<string>();
  quiet(key: string, on: boolean, fade = 1.2) {
    const was = this.quiets.size > 0;
    if (on) this.quiets.add(key);
    else this.quiets.delete(key);
    if (was === this.quiets.size > 0) return;
    this.note(`quiet ${on ? 'on' : 'off'} (${key})`);
    this.apply(fade);
  }
  get quieted() {
    return this.quiets.size > 0;
  }
  /** Fonoteca: the player picked something to listen to (wins over everything while set) */
  listen(ref: string, o: { loop?: boolean; onEnd?: () => void } = {}) {
    this.listenReq = { ref, loop: !!o.loop, onEnd: o.onEnd };
    this.applied = null; // a listen always (re)starts, even the same ref
    this.apply(1.2, true);
  }
  stopListening(fade = 1.6) {
    if (!this.listenReq) return;
    this.listenReq = null;
    this.apply(fade);
  }
  get listening() {
    return this.listenReq?.ref ?? null;
  }

  /** resolve and switch if the music should change */
  apply(fadeOverride?: number, restart = false) {
    if (!audio.ctx) {
      this.applied = null; // applied on unlock
      return;
    }
    // Part I with no cue/listen: hands off — the scenes drive core/music directly, exactly as always.
    // Only undo what a cue did (fade it out and give back the procedural mood it interrupted).
    if (!partII() && !this.cueReq && !this.listenReq) {
      if (this.applied?.kind === 'track') {
        this.player.stop(fadeOverride ?? 1.5);
        if (this.resumeMood && this.resumeMood !== 'silence') this.procIn(this.resumeMood, 1.5);
      }
      this.applied = null;
      this.resumeMood = null;
      return;
    }
    const t0 = resolveTarget(this.table, {
      state: this.state,
      context: this.context,
      partII: partII(),
      has: this.has,
      islandTrack: islandTrack(),
      cue: this.cueReq,
      listen: this.listenReq,
      rotation: this.rotation.get(this.state) ?? 0,
    });
    // a QUIET hold silences everything but a cue / a listen
    const t: Target = quietOver(t0, this.quiets.size > 0);
    if (!restart && sameTarget(t, this.applied)) {
      // same music — but a stopped deck (ended non-looping cue) must not leave us silent forever
      if (t.kind !== 'track' || this.player.cur) return;
    }
    this.applied = t;
    const fade = fadeOverride ?? t.fade;
    if (t.kind === 'track') {
      const r = resolveTrack(t.ref);
      if (!r) return;
      if (!this.resumeMood && music.mood !== 'silence') this.resumeMood = music.mood;
      this.procOut(Math.max(0.3, fade));
      this.note(`play ${t.ref} (${t.source}, q=${t.quantize}, fade=${fade})`);
      const src = t.source;
      void this.player.play(r, {
        fade,
        quantize: t.quantize,
        loop: t.loop,
        section: t.section,
        at: t.at,
        sync: t.sync,
        // the Fonoteca's «repeat one» repeats the whole song (a stream), not the game's loop region
        // (ext) …except a track with in-sync layers (src/audio/layers.ts): those need the decoded deck's sample clock
        mode: src === 'listen' ? (r.layers?.length ? 'buffer' : 'stream') : undefined,
        restart,
        owner: src,
        onEnd: () => this.ended(src, t.ref),
        onError: () => {
          // a file that can't load (404, decode error) is skipped for this session: next candidate / procedural
          this.broken.add(t.ref);
          this.note(`broken ${t.ref}`);
          if (this.applied === t) {
            this.applied = null;
            this.apply();
          }
        },
      });
      return;
    }
    this.resumeMood = null;
    // (agent FINAL) an explicitly short fade is honoured (a film's «corte en seco» into a quiet hold: silence, dry)
    this.player.stop(t.source === 'partI' ? 0.6 : Math.max(fadeOverride !== undefined ? 0.03 : 0.3, fade));
    if (t.kind === 'procedural') this.procIn(t.mood, t.source === 'partI' ? 0 : fade);
    else this.procOut(t.source === 'partI' ? 0 : Math.max(0.3, fade), true);
    this.note(`${t.kind}${t.kind === 'procedural' ? ` ${t.mood}` : ''}`);
  }

  /** a non-looping deck reached its end */
  private ended(source: string, ref: string) {
    if (source === 'listen' && this.listenReq?.ref === ref) {
      const cb = this.listenReq.onEnd;
      if (cb) return cb(); // the Fonoteca picks the next song
      this.listenReq = null;
    } else if (source === 'cue' && this.cueReq?.ref === ref) this.cueReq = null;
    else if (source === 'state') this.spent.add(ref); // a one-shot state song: next candidate / fallback
    this.applied = null;
    this.apply();
  }

  /** Part I procedural music back in (fade = 0 → exactly the old behaviour) */
  private procIn(mood: Mood, fade: number) {
    const ctx = audio.ctx;
    if (!ctx) return;
    this.procToken++;
    const g = audio.procBus.gain;
    g.cancelScheduledValues(ctx.currentTime);
    if (fade > 0 && music.mood === 'silence') {
      g.setValueAtTime(0, ctx.currentTime);
      g.linearRampToValueAtTime(1, ctx.currentTime + fade);
    } else g.setTargetAtTime(1, ctx.currentTime, 0.05);
    music.playRaw(mood);
  }
  /** fade the procedural submix out, then stop the sequencer (unless it came back meanwhile) */
  private procOut(fade: number, andStop = true) {
    const ctx = audio.ctx;
    if (!ctx || music.mood === 'silence') return;
    if (fade <= 0) {
      if (andStop) music.stopRaw();
      return;
    }
    const tok = ++this.procToken;
    const g = audio.procBus.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(g.value, ctx.currentTime);
    g.linearRampToValueAtTime(0, ctx.currentTime + fade);
    setTimeout(() => {
      if (tok !== this.procToken) return;
      // stop the sequencer only if the director still wants it silent (a Part I scene may own it again)
      if (andStop && (partII() || this.applied?.kind === 'track')) music.stopRaw();
      g.cancelScheduledValues(ctx.currentTime);
      g.setValueAtTime(1, ctx.currentTime + 0.05);
    }, (fade + 0.1) * 1000);
  }

  /** prefetch the music of states likely next */
  likelyNext(): string[] {
    if (!partII()) return [];
    const e = entryFor(this.table, this.state, this.context);
    const out: string[] = [];
    for (const s of e.prefetch ?? []) {
      const t = resolveTarget(this.table, { state: s as MusicState, partII: true, has: this.has, islandTrack: islandTrack() });
      if (t.kind === 'track') out.push(t.ref);
    }
    return out;
  }

  /** the router for core/music.ts: Part II scenes calling music.play(mood) go through the director */
  route = (mood: Mood): boolean => {
    if (!partII()) return false;
    const s = this.table.moodToState[mood] ?? (mood === 'silence' ? 'silence' : 'island');
    this.setState(s);
    return true;
  };

  status() {
    return {
      state: this.state,
      context: this.context ?? null,
      partII: partII(),
      cue: this.cueReq?.ref ?? null,
      listen: this.listenReq?.ref ?? null,
      quiet: [...this.quiets],
      applied: this.applied,
      procedural: music.mood,
    };
  }
}
