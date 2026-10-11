/**
 * Music player: at most ONE current deck (+ the one fading out) — never stacked songs.
 *
 * Two kinds of deck:
 *  - stream  HTMLAudioElement → MediaElementSource → deck gain → music bus. Long exploration tracks:
 *            the browser streams and keeps only a small window decoded (low memory). Loops = whole
 *            file (el.loop). Position comes from el.currentTime, re-anchored to the audio clock.
 *  - buffer  fetch + decodeAudioData → AudioBufferSourceNode. Sample-accurate start (start(when)),
 *            seamless loops at the track's loop points. Used for sync'd cues (special battles) and
 *            short looping beds. The decoded buffer is dropped the moment the deck stops.
 *
 * Transitions are quantized on the CURRENT deck's beat map (next bar / beat, audio clock) and
 * crossfade with equal-power curves. Beat-map events are delivered by BeatScheduler (clock.ts) from
 * the deck that is audible right now, with output-latency compensation (audibleNow()).
 */
import { audio } from '../core/audio';
import { BeatMap, GridEvent, Loop, buildEvents, nextGridTime, validLoop, wrapPos } from './beatgrid';
import { BeatScheduler } from './clock';
import { Resolved, beatMapFor } from './catalog';

export type Quantize = 'bar' | 'beat' | 'now';
export interface PlayOpts {
  /** fade-in seconds (default 2) */
  fade?: number;
  /** fade-out of the previous deck (default = fade) */
  fadeOut?: number;
  quantize?: Quantize;
  loop?: boolean;
  /** start at a named section / marker of the beat map */
  section?: string;
  /** start at this file position (s) */
  at?: number;
  /** sample-accurate (decoded buffer) */
  sync?: boolean;
  /** force a deck kind */
  mode?: 'stream' | 'buffer';
  /** linear volume of this deck (× the track trim) */
  volume?: number;
  /** restart even if this ref is already the current deck */
  restart?: boolean;
  /** called when a non-looping deck reaches its end (not when it is replaced) */
  onEnd?: () => void;
  /** the file could not be loaded/decoded (not called for superseded requests) */
  onError?: (e: unknown) => void;
  /** who asked (debug: 'director', 'fonoteca'…) */
  owner?: string;
}

/** the AudioContext time being HEARD right now (latency-compensated) */
export function audibleNow(ctx: AudioContext): number {
  const now = ctx.currentTime;
  // two estimates of what the ears get right now: the output timestamp, and currentTime minus the reported latencies.
  // Some devices (Bluetooth, TV audio) report their delay only in outputLatency: take the LATER-heard (smaller) one so
  // visuals never run ahead of the sound (Momentos, battle music)
  const lat = (ctx.outputLatency || 0) + (ctx.baseLatency || 0);
  const byLat = now - Math.min(0.5, Math.max(0, lat));
  try {
    const ts = ctx.getOutputTimestamp?.();
    if (ts && ts.contextTime && ts.performanceTime && typeof performance !== 'undefined') {
      const t = ts.contextTime + (performance.now() - ts.performanceTime) / 1000;
      if (t <= now + 0.01 && t >= now - 0.5) return Math.min(t, now, byLat + 0.005);
    }
  } catch {
    /* not supported */
  }
  return byLat;
}

let deckSeq = 0;
const EQ_IN = new Float32Array(33).map((_, i) => Math.sin((i / 32) * (Math.PI / 2)));
const EQ_OUT = new Float32Array(33).map((_, i) => Math.cos((i / 32) * (Math.PI / 2)));

/** decoded-audio accounting (memory check in headless: freed buffers must drop to 0) */
export const mem = { liveBytes: 0, peakBytes: 0, decoded: 0, released: 0, collected: 0, reused: 0 };
const fin = typeof FinalizationRegistry !== 'undefined' ? new FinalizationRegistry<number>(() => void mem.collected++) : null;

/**
 * Decoded buffers are REF-COUNTED: a deck, the prepared cache (prepareDecoded) or a jump that reuses the playing deck's
 * buffer each hold one reference; the bytes leave the accounting when the last holder lets go (then the GC frees them).
 */
const bufRefs = new WeakMap<AudioBuffer, { n: number; bytes: number }>();
function retainBuf(b: AudioBuffer) {
  let r = bufRefs.get(b);
  if (!r) {
    r = { n: 0, bytes: b.length * b.numberOfChannels * 4 };
    bufRefs.set(b, r);
    mem.liveBytes += r.bytes;
    mem.peakBytes = Math.max(mem.peakBytes, mem.liveBytes);
    mem.decoded++;
    fin?.register(b, r.bytes);
  }
  r.n++;
}
function releaseBuf(b: AudioBuffer) {
  const r = bufRefs.get(b);
  if (!r) return;
  r.n--;
  if (r.n <= 0) {
    mem.liveBytes = Math.max(0, mem.liveBytes - r.bytes);
    mem.released++;
    bufRefs.delete(b);
  }
}

/**
 * PREPARED songs (ext, for Momentos and anything that must start instantly): fetch + decode ONCE, keep the buffer until
 * released. Every buffer deck of that file then starts without fetching or decoding, and section jumps are instant.
 */
interface Prepared {
  holds: number;
  buf: AudioBuffer | null;
  pending: Promise<AudioBuffer | null> | null;
}
const prepared = new Map<string, Prepared>();
/** decode `url` now (or reuse it) and keep it; resolves true when the buffer is ready */
export async function prepareDecoded(ctx: AudioContext | null, url: string): Promise<boolean> {
  let p = prepared.get(url);
  if (!p) {
    p = { holds: 0, buf: null, pending: null };
    prepared.set(url, p);
  }
  p.holds++;
  if (p.buf) return true;
  if (!ctx) return false;
  if (!p.pending) {
    const entry = p;
    entry.pending = (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
        const buf = await ctx.decodeAudioData(await res.arrayBuffer());
        if (prepared.get(url) !== entry || entry.holds <= 0) return null;
        entry.buf = buf;
        retainBuf(buf);
        return buf;
      } catch (e) {
        console.warn('[audio] prepare', url, e);
        return null;
      } finally {
        entry.pending = null;
      }
    })();
  }
  return !!(await p.pending);
}
/** let go of a prepared song (the buffer is dropped when nothing plays it any more) */
export function releaseDecoded(url: string) {
  const p = prepared.get(url);
  if (!p) return;
  p.holds--;
  if (p.holds > 0) return;
  prepared.delete(url);
  if (p.buf) releaseBuf(p.buf);
}
/** the prepared buffer of `url`, or the decode in flight */
function preparedFor(url: string): AudioBuffer | Promise<AudioBuffer | null> | null {
  const p = prepared.get(url);
  return p ? (p.buf ?? p.pending) : null;
}
export function preparedStatus() {
  return [...prepared.entries()].map(([url, p]) => ({ url, holds: p.holds, ready: !!p.buf }));
}

export class Deck {
  readonly id = ++deckSeq;
  kind: 'stream' | 'buffer';
  gain: GainNode;
  events: GridEvent[] = [];
  map: BeatMap | null = null;
  loop: Loop | null = null;
  looping = false;
  state: 'loading' | 'scheduled' | 'playing' | 'paused' | 'stopping' | 'stopped' = 'loading';
  /** ctx time at which unwrapped u = startU is rendered */
  startCtx = 0;
  startU = 0;
  volume = 1;
  /** volume before the player's boost (Momentos) */
  baseVolume = 1;
  stopAt = Infinity;
  el?: HTMLAudioElement;
  private mes?: MediaElementAudioSourceNode;
  src?: AudioBufferSourceNode;
  buffer?: AudioBuffer;
  // stream clock
  private anchor = NaN;
  private wraps = 0;
  private lastP = 0;
  private pausedU = 0;
  onEnd?: () => void;
  owner = '';
  /** the listener has heard this stream long enough to keep a copy (see MusicPlayer.onListened) */
  warmed = false;

  constructor(
    public ref: Resolved,
    kind: 'stream' | 'buffer',
    private ctx: AudioContext,
    out: AudioNode,
  ) {
    this.kind = kind;
    this.gain = ctx.createGain();
    this.gain.gain.value = 0;
    this.gain.connect(out);
  }

  get duration() {
    return this.buffer?.duration ?? (this.el && Number.isFinite(this.el.duration) ? this.el.duration : this.ref.durationSec);
  }

  /** download/decode (stream: until it can play) */
  async load(signal: { stale: boolean }): Promise<boolean> {
    if (this.kind === 'buffer') {
      // a prepared song (or its decode in flight): no fetch, no decode
      const pre = preparedFor(this.ref.url);
      if (pre) {
        const buf = pre instanceof Promise ? await pre : pre;
        if (signal.stale) return false;
        if (buf) {
          this.adopt(buf);
          mem.reused++;
          return true;
        }
      }
      const res = await fetch(this.ref.url);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${this.ref.url}`);
      const data = await res.arrayBuffer();
      if (signal.stale) return false;
      const buf = await this.ctx.decodeAudioData(data);
      if (signal.stale) return false;
      this.adopt(buf);
      return true;
    }
    const el = new Audio();
    el.preload = 'auto';
    el.crossOrigin = 'anonymous';
    el.src = this.ref.url;
    this.el = el;
    this.mes = this.ctx.createMediaElementSource(el);
    this.mes.connect(this.gain);
    el.addEventListener('seeking', () => (this.anchor = NaN));
    el.addEventListener('waiting', () => (this.anchor = NaN));
    el.addEventListener('playing', () => (this.anchor = NaN));
    el.addEventListener('ended', () => {
      if (this.state === 'playing' && !this.looping) this.finish();
    });
    await new Promise<void>((resolve, reject) => {
      const done = () => {
        clearTimeout(to);
        el.removeEventListener('canplay', done);
        el.removeEventListener('error', fail);
        resolve();
      };
      const fail = () => {
        clearTimeout(to);
        el.removeEventListener('canplay', done);
        reject(new Error(`no se pudo abrir ${this.ref.url}`));
      };
      const to = setTimeout(done, 8000); // slow network: start anyway, the element buffers
      if (el.readyState >= 3) return done();
      el.addEventListener('canplay', done);
      el.addEventListener('error', fail, { once: true });
      el.load();
    });
    return !signal.stale;
  }

  /** keep only the first `sec` seconds of the decoded audio (a loop never goes past its end) */
  trim(sec: number) {
    const b = this.buffer;
    if (!b) return;
    const len = Math.min(b.length, Math.ceil(sec * b.sampleRate));
    if (len >= b.length) return;
    const nb = this.ctx.createBuffer(b.numberOfChannels, len, b.sampleRate);
    for (let ch = 0; ch < b.numberOfChannels; ch++) nb.copyToChannel(b.getChannelData(ch).subarray(0, len), ch);
    this.adopt(nb);
  }

  /** hold a decoded buffer (shared buffers are ref-counted: see retainBuf) */
  adopt(buf: AudioBuffer) {
    if (this.buffer === buf) return;
    retainBuf(buf);
    if (this.buffer) releaseBuf(this.buffer);
    this.buffer = buf;
  }

  /** start rendering at ctx time `when`, from unwrapped/file position `at` */
  start(when: number, at: number, loop: boolean) {
    const ctx = this.ctx;
    this.looping = loop;
    this.startU = at;
    this.startCtx = when;
    if (this.kind === 'buffer' && this.buffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.buffer;
      const L = loop ? validLoop(this.loop) : null;
      if (loop) {
        src.loop = true;
        if (L && L.end <= this.buffer.duration + 0.01) {
          src.loopStart = L.start;
          src.loopEnd = Math.min(L.end, this.buffer.duration);
        }
      }
      src.connect(this.gain);
      src.onended = () => {
        if (this.src === src && this.state === 'playing' && !this.looping) this.finish();
      };
      src.start(Math.max(when, ctx.currentTime), Math.max(0, Math.min(this.buffer.duration - 0.01, wrapPos(at, this.loop))));
      this.src = src;
      this.state = 'playing';
      return;
    }
    const el = this.el!;
    el.loop = loop;
    try {
      el.currentTime = at;
    } catch {
      /* not seekable yet */
    }
    this.wraps = 0;
    this.lastP = at;
    this.state = 'scheduled';
    const go = () => {
      if (this.state !== 'scheduled') return;
      this.state = 'playing';
      this.anchor = NaN;
      void el.play().catch(() => undefined);
    };
    const delay = (when - ctx.currentTime - 0.02) * 1000;
    if (delay > 4) setTimeout(go, delay);
    else go();
  }

  /** unwrapped position RENDERED at ctx time t (stream: from the element, smoothed) */
  uAt(t: number): number {
    if (this.state === 'paused') return this.pausedU;
    if (this.kind === 'buffer') return this.startU + Math.max(0, t - this.startCtx);
    const el = this.el;
    if (!el) return 0;
    if (this.state === 'scheduled') return this.startU;
    const p = el.currentTime;
    const d = this.duration;
    // a wrap of el.loop (position jumped back near the start while not seeking)
    if (this.looping && d > 1 && p < this.lastP - d / 2 && !el.seeking) this.wraps++;
    this.lastP = p;
    const u = p + this.wraps * (d || 0);
    if (el.paused || el.seeking || el.readyState < 3) {
      this.anchor = NaN;
      return u;
    }
    const est = this.ctx.currentTime - u;
    if (!Number.isFinite(this.anchor) || Math.abs(est - this.anchor) > 0.08) this.anchor = est;
    else this.anchor += (est - this.anchor) * 0.05;
    return t - this.anchor;
  }
  /** ctx time at which unwrapped position u is rendered */
  ctxAt(u: number): number {
    if (this.kind === 'buffer') return this.startCtx + (u - this.startU);
    if (!Number.isFinite(this.anchor)) this.uAt(this.ctx.currentTime);
    return Number.isFinite(this.anchor) ? this.anchor + u : this.ctx.currentTime + (u - this.uAt(this.ctx.currentTime));
  }
  /** file position (s) for UI */
  position(): number {
    const u = this.uAt(this.ctx.currentTime);
    if (this.kind === 'stream' && this.el) return this.el.currentTime;
    const d = this.duration;
    const p = wrapPos(u, this.looping ? this.loop ?? (d ? { start: 0, end: d } : null) : null);
    return d ? Math.min(p, d) : p;
  }

  fadeTo(v: number, at: number, dur: number) {
    const g = this.gain.gain;
    const now = this.ctx.currentTime;
    const t = Math.max(at, now);
    const from = g.value;
    if (typeof (g as AudioParam & { cancelAndHoldAtTime?: (t: number) => void }).cancelAndHoldAtTime === 'function') g.cancelAndHoldAtTime(t);
    else {
      g.cancelScheduledValues(t);
      g.setValueAtTime(from, t);
    }
    if (dur <= 0.01) {
      g.setValueAtTime(v, t);
      return;
    }
    // equal-power when fading fully in/out; a short linear ramp otherwise
    if (v > from && from < 0.001) g.setValueCurveAtTime(EQ_IN.map((x) => x * v), t, dur);
    else if (v < 0.001 && from > 0) {
      const f = from;
      g.setValueCurveAtTime(EQ_OUT.map((x) => Math.max(0, x * f)), t, dur);
    } else g.linearRampToValueAtTime(v, t + dur);
  }

  /** fade out from `at`, then free everything */
  stop(fade: number, at = this.ctx.currentTime) {
    if (this.state === 'stopped' || this.state === 'stopping') {
      // already leaving: only ever make it faster
      const end = Math.max(this.ctx.currentTime, at) + Math.max(0.03, fade);
      if (end < this.stopAt) {
        this.fadeTo(0, this.ctx.currentTime, Math.max(0.03, fade));
        this.stopAt = end;
      }
      return;
    }
    this.state = 'stopping';
    this.fadeTo(0, at, Math.max(0.03, fade));
    this.stopAt = Math.max(this.ctx.currentTime, at) + Math.max(0.03, fade);
    if (this.kind === 'buffer' && this.src) {
      try {
        this.src.stop(this.stopAt + 0.02);
      } catch {
        /* already stopped */
      }
    }
  }
  pause() {
    if (this.state !== 'playing') return;
    this.pausedU = this.uAt(this.ctx.currentTime);
    this.state = 'paused';
    if (this.kind === 'stream') this.el?.pause();
    else {
      try {
        this.src?.stop();
      } catch {
        /* ok */
      }
      this.src?.disconnect();
      this.src = undefined;
    }
  }
  resume() {
    if (this.state !== 'paused') return;
    if (this.kind === 'stream') {
      this.state = 'playing';
      this.anchor = NaN;
      void this.el?.play().catch(() => undefined);
    } else this.start(this.ctx.currentTime + 0.03, this.pausedU, this.looping);
  }
  /** jump to a file position (s) */
  seek(p: number) {
    const d = this.duration;
    const x = Math.max(0, Math.min(d ? d - 0.05 : p, p));
    if (this.kind === 'stream' && this.el) {
      this.wraps = 0;
      this.lastP = x;
      this.anchor = NaN;
      this.el.currentTime = x;
      if (this.state === 'paused') this.pausedU = x;
      return x;
    }
    if (this.state === 'paused') {
      this.pausedU = x;
      return x;
    }
    if (this.src) {
      try {
        this.src.onended = null;
        this.src.stop();
      } catch {
        /* ok */
      }
      this.src.disconnect();
      this.src = undefined;
    }
    this.start(this.ctx.currentTime + 0.02, x, this.looping);
    return x;
  }

  private finish() {
    this.state = 'stopping';
    this.stopAt = this.ctx.currentTime;
    const cb = this.onEnd;
    this.onEnd = undefined;
    cb?.();
  }

  /** free nodes, element and decoded audio */
  dispose() {
    if (this.state === 'stopped') return;
    this.state = 'stopped';
    try {
      if (this.src) {
        this.src.onended = null;
        this.src.stop();
      }
    } catch {
      /* ok */
    }
    this.src?.disconnect();
    this.src = undefined;
    if (this.buffer) {
      releaseBuf(this.buffer);
      this.buffer = undefined;
    }
    if (this.el) {
      const el = this.el;
      el.pause();
      el.removeAttribute('src');
      try {
        el.load();
      } catch {
        /* ok */
      }
      this.el = undefined;
    }
    this.mes?.disconnect();
    this.mes = undefined;
    this.gain.disconnect();
  }
}

/** where a play request starts in the file: a section / marker of the map, else `at` */
function startAt(map: BeatMap | null, o: PlayOpts): number {
  let at = Math.max(0, o.at ?? 0);
  if (o.section && map) {
    const s = map.sections.find((x) => x.name === o.section) ?? null;
    const m = map.markers.find((x) => x.name === o.section) ?? null;
    at = s ? s.start : m ? m.time : at;
  }
  return at;
}

/** longest loop end (s) decoded for a seamless loop */
export const LOOP_BUFFER_MAX_SEC = 150;

/** which deck kind a request gets (see header) */
export function chooseMode(r: Resolved, o: PlayOpts): 'stream' | 'buffer' {
  if (o.mode) return o.mode;
  if (o.sync) return 'buffer';
  // seamless loop points need a buffer — only when the loop ends early enough: the buffer is trimmed
  // to the loop end, ≈ 23 MB per stereo minute at 48 kHz (a 150 s loop ≈ 58 MB). Longer: stream, whole-file loop.
  const L = validLoop(r.loop);
  if (o.loop && L && L.end <= LOOP_BUFFER_MAX_SEC) return 'buffer';
  return 'stream';
}

export class MusicPlayer {
  /** the deck that owns the transport (latest request) */
  cur: Deck | null = null;
  /** the deck whose beat map drives events (promoted when it becomes audible) */
  private synced: Deck | null = null;
  private leaving = new Set<Deck>();
  readonly sched = new BeatScheduler();
  private req = 0;
  private pendingReq: { stale: boolean } | null = null;
  private raf = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  /** a stream deck was heard for 20 s: the engine may keep the whole file in the music cache (offline replays) */
  onListened: ((r: Resolved) => void) | null = null;
  /** debug log of switches */
  log: { at: number; ref: string; kind: string; when: number; quantize: string }[] = [];

  private get ctx() {
    return audio.ctx;
  }

  /** play a resolved track (crossfade from whatever is current). Resolves to the new deck, or null. */
  async play(r: Resolved, o: PlayOpts = {}): Promise<Deck | null> {
    const ctx = this.ctx;
    if (!ctx) return null;
    if (!o.restart && this.cur && this.cur.ref.ref === r.ref && (this.cur.state === 'playing' || this.cur.state === 'scheduled' || this.cur.state === 'loading')) {
      this.cur.onEnd = o.onEnd;
      return this.cur;
    }
    if (this.pendingReq) this.pendingReq.stale = true;
    const signal = { stale: false };
    this.pendingReq = signal;
    const myReq = ++this.req;
    const kind = chooseMode(r, o);
    const deck = new Deck(r, kind, ctx, audio.musicBus);
    deck.owner = o.owner ?? '';
    deck.loop = validLoop(r.loop);
    deck.baseVolume = (o.volume ?? 1) * r.trim;
    deck.volume = deck.baseVolume * this.boost;
    try {
      // (ext) a jump inside the song that is playing (restart): reuse its decoded buffer — no re-decode, the jump lands
      // on the next bar instead of 1–2 s later (docs/part-ii/24 §7)
      const donor = kind === 'buffer' && o.restart ? this.donorFor(r) : null;
      const [ok0, map] = await Promise.all([donor ? Promise.resolve(true) : deck.load(signal), beatMapFor(r)]);
      let ok = ok0;
      if (donor) {
        const want = startAt(map, o);
        if (donor.duration >= want + 0.5) {
          deck.adopt(donor);
          mem.reused++;
        } else ok = await deck.load(signal);
      }
      if (!ok || signal.stale || myReq !== this.req) {
        deck.dispose();
        return null;
      }
      deck.map = map;
      deck.events = buildEvents(map);
    } catch (e) {
      console.warn('[audio] no se pudo cargar', r.ref, e);
      deck.dispose();
      if (myReq === this.req) {
        this.pendingReq = null;
        o.onError?.(e);
      }
      return null;
    }
    this.pendingReq = null;
    // where to start in the file
    const at = startAt(deck.map, o);
    // when: the next bar/beat of what's playing now (audio clock), else right away
    const now = ctx.currentTime;
    let when = now + (kind === 'buffer' ? 0.06 : 0.02);
    const q = o.quantize ?? 'bar';
    const prev = this.cur && this.cur.state === 'playing' ? this.cur : null;
    if (q !== 'now' && prev && prev.events.length) {
      const u = prev.uAt(now);
      const lead = kind === 'buffer' ? 0.1 : 0.2;
      const next = nextGridTime(prev.events, u, q, prev.looping ? prev.loop : null, lead, 8);
      if (next !== null) {
        const t = prev.ctxAt(next);
        if (t > now && t - now < 8) when = t;
      }
    }
    const fadeIn = Math.max(0, o.fade ?? 2);
    const fadeOut = Math.max(0.03, o.fadeOut ?? (fadeIn || 0.8));
    // the outgoing deck(s): the current one fades from `when`; anything already leaving goes now
    for (const d of this.leaving) d.stop(0.08);
    if (this.cur && this.cur !== deck) {
      this.cur.stop(fadeOut, when);
      this.leaving.add(this.cur);
    }
    // a stream loops the whole file (el.loop); a buffer loops at the track's loop points when it has them
    const whole = deck.duration ? { start: 0, end: deck.duration } : null;
    deck.loop = kind === 'buffer' ? (validLoop(r.loop) ?? validLoop(deck.map?.loop) ?? whole) : whole;
    // a looping buffer never plays past its loop end: keep only [0, end] decoded (memory)
    if (kind === 'buffer' && o.loop && deck.loop && deck.buffer && deck.loop.end < deck.buffer.duration - 1) deck.trim(deck.loop.end + 0.05);
    deck.onEnd = o.onEnd;
    deck.start(when, at, !!o.loop);
    deck.fadeTo(deck.volume, when, fadeIn);
    this.cur = deck;
    this.log.push({ at: now, ref: r.ref, kind, when, quantize: q });
    if (this.log.length > 40) this.log.shift();
    this.ensureTicking();
    return deck;
  }

  /** a decoded buffer of the same file that a restart jump can reuse (current / leaving decks) */
  private donorFor(r: Resolved): AudioBuffer | null {
    for (const d of [this.cur, ...this.leaving]) if (d && d.kind === 'buffer' && d.buffer && d.ref.url === r.url && d.state !== 'stopped') return d.buffer;
    const pre = preparedFor(r.url);
    return pre && !(pre instanceof Promise) ? pre : null;
  }

  /** linear gain on every music deck (Momentos play their original louder: setBoost) */
  boost = 1;
  /** (ext) boost the music decks by `db` (0 = off), now and for the decks to come; a short ramp */
  setBoost(db: number) {
    this.boost = 10 ** (Math.max(0, Math.min(12, db)) / 20);
    for (const d of [this.cur, ...this.leaving]) {
      if (!d || d.state === 'stopping' || d.state === 'stopped') continue;
      d.volume = d.baseVolume * this.boost;
      if (this.hushed.has(d)) continue; // a hushed deck stays silent (hushDecks)
      d.fadeTo(d.volume, this.ctx?.currentTime ?? 0, 0.25);
    }
  }

  /** decks silenced by hushDecks(true) (a Momento: the music that was playing before its song) */
  private hushed = new Set<Deck>();
  /**
   * (ext) a Momento takes the music: the decks playing NOW fade to silence over `fade` s (they keep running, the
   * director keeps its state; the Momento's own cue crossfades them away). Off: any of them still playing comes back.
   */
  hushDecks(on: boolean, fade = 0.3) {
    const now = this.ctx?.currentTime ?? 0;
    if (on) {
      for (const d of [this.cur, ...this.leaving]) {
        if (!d || d.state === 'stopping' || d.state === 'stopped') continue;
        d.fadeTo(0, now, fade);
        this.hushed.add(d);
      }
      return;
    }
    for (const d of this.hushed) if (d.state === 'playing' || d.state === 'scheduled' || d.state === 'paused') d.fadeTo(d.volume, now, fade);
    this.hushed.clear();
  }

  /** (ext) pause / resume the current deck (Momentos' pause menu, a hidden tab) */
  setPaused(on: boolean) {
    if (on) this.cur?.pause();
    else this.resume();
  }

  /** fade the current deck out (and cancel a pending load) */
  stop(fade = 1.5) {
    if (this.pendingReq) this.pendingReq.stale = true;
    this.pendingReq = null;
    this.req++;
    if (this.cur) {
      this.cur.stop(fade);
      this.leaving.add(this.cur);
      this.cur = null;
    }
  }

  pause() {
    this.cur?.pause();
  }
  resume() {
    this.cur?.resume();
    this.ensureTicking();
  }
  /** jump the current deck to a file position (events in between are not delivered) */
  seek(p: number) {
    const c = this.cur;
    const ctx = this.ctx;
    if (!c || !ctx) return;
    c.seek(p);
    if (this.synced === c) this.sched.jump(c.uAt(ctx.currentTime));
  }

  /** seconds since the synced track started, as HEARD (null when nothing synced plays) */
  trackTime(): number | null {
    const ctx = this.ctx;
    const d = this.synced;
    if (!ctx || !d || d.state === 'stopped') return null;
    return d.uAt(audibleNow(ctx));
  }
  get syncedDeck() {
    return this.synced;
  }

  /** every deck alive (debug: overlapping tracks) */
  decks() {
    return [...(this.cur ? [this.cur] : []), ...this.leaving].map((d) => ({
      id: d.id,
      ref: d.ref.ref,
      kind: d.kind,
      state: d.state,
      gain: Math.round(d.gain.gain.value * 1000) / 1000,
      pos: Math.round(d.position() * 100) / 100,
      owner: d.owner,
    }));
  }

  private ensureTicking() {
    if (!this.timer) this.timer = setInterval(() => this.tick(), 100);
    if (!this.raf && typeof requestAnimationFrame === 'function') {
      const loop = () => {
        this.raf = 0;
        this.tick();
        if (this.cur || this.leaving.size) this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }
  }

  /** one step: promote the audible deck, deliver events, free finished decks */
  tick() {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const heard = audibleNow(ctx);
    for (const d of [...this.leaving]) {
      if (d.state === 'stopped' || now >= d.stopAt + 0.05) {
        d.dispose();
        this.leaving.delete(d);
        if (this.synced === d) {
          this.synced = null;
          this.sched.clear();
        }
      }
    }
    const c = this.cur;
    if (c && c.state === 'stopping' && now >= c.stopAt) {
      // ended by itself (non-looping)
      c.dispose();
      this.cur = null;
    }
    if (c && c !== this.synced && (c.state === 'playing' || c.state === 'paused') && heard >= c.ctxAt(c.startU) - 0.002) {
      this.synced = c;
      const loop = c.looping ? c.loop : null;
      this.sched.setTimeline(c.events, loop, c.startU, (u) => c.ctxAt(u), c.ref.ref);
    }
    if (c && c.kind === 'stream' && !c.warmed && c.state === 'playing' && now - c.startCtx > 20) {
      c.warmed = true;
      this.onListened?.(c.ref);
    }
    const s = this.synced;
    if (s && s.state === 'playing') this.sched.tick(s.uAt(heard));
    else if (s && s.state === 'stopped') {
      this.synced = null;
      this.sched.clear();
    }
    if (!this.cur && !this.leaving.size) {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    }
  }
}
