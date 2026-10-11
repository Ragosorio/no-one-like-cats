/**
 * LAYERS (ext, docs/part-ii/30-composiciones-nuevas.md §API de capas): a track can carry extra stems that play IN SYNC
 * with it, each with its own gain — the Archipiélago de los Sueños sounds one layer per kind of cat sleeping on the
 * island; El Umbral one layer per force that is still there.
 *
 *   tracks.json   variation.layers = [{ id, file, loop: {start, end}, gain? }]  — every layer loop is an exact divisor
 *                 of the track's loop (same grid, same bars), files are never faded: they are only played INSIDE the loop
 *   audioApi      setLayers('amb.suenos', { calido: 1, agua: 0.5 }, { fade: 3 })   (null = the defaults from tracks.json)
 *
 * How (deliberately outside player.ts): a ~5 Hz watcher looks at the CURRENT deck. When it is a decoded (buffer) deck of a
 * track with layers, every layer with gain > 0 is fetched + decoded once and started as its own looping
 * AudioBufferSource at the sample position that matches the deck (same AudioContext clock: sample-accurate), through a
 * GainNode into the DECK's gain node — so the deck's fades, crossfades, ducking, trim and the music bus apply to the
 * layers for free. A seek / pause / resume of the deck (its source node changes) restarts the layers aligned; a deck that
 * is stopped takes its layers with it. Stream decks (no sample clock) play without layers. Nothing here throws.
 */
import { audio } from '../core/audio';
import { validLoop, wrapPos, type Loop } from './beatgrid';
import type { Resolved } from './catalog';
import type { Deck, MusicPlayer } from './player';

export interface LayerDef {
  id: string;
  url: string;
  loop: Loop;
  /** default gain (0..1) when nobody set one */
  gain: number;
}

interface Running {
  src: AudioBufferSourceNode;
  gain: GainNode;
}

interface Attachment {
  deck: Deck;
  /** the deck's source node the layers were aligned to (a new one = seek / resume → realign) */
  anchor: AudioBufferSourceNode | undefined;
  layers: Map<string, Running>;
  /** a fade-out is scheduled for a non-looping deck's ending */
  endingSet: boolean;
  pending: Set<string>;
}

const TICK_MS = 200;
const START_LEAD = 0.06;

export class LayerMixer {
  private wanted = new Map<string, Record<string, number>>();
  private fades = new Map<string, number>();
  private att: Attachment[] = [];
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private timer: ReturnType<typeof setInterval> | null = null;
  /** debug counters (window.__audio.layers()) */
  stats = { started: 0, realigned: 0, stopped: 0, decoded: 0, failed: 0 };

  constructor(private player: MusicPlayer) {}

  /** gains per layer id for a track ref (null = defaults). Applies at once to a playing deck of that track. */
  set(ref: string, gains: Record<string, number> | null, fade = 2) {
    if (gains) this.wanted.set(ref, { ...gains });
    else this.wanted.delete(ref);
    this.fades.set(ref, Math.max(0.02, fade));
    this.ensure();
    this.tick();
  }

  status() {
    return {
      wanted: Object.fromEntries(this.wanted),
      attached: this.att.map((a) => ({ deck: a.deck.id, ref: a.deck.ref.ref, state: a.deck.state, layers: [...a.layers.entries()].map(([k, r]) => ({ id: k, gain: Math.round(r.gain.gain.value * 1000) / 1000 })), pending: [...a.pending] })),
      buffers: [...this.buffers.keys()],
      stats: { ...this.stats },
    };
  }

  /** the gain a layer of `r` should have now */
  private gainOf(r: Resolved, l: LayerDef) {
    const w = this.wanted.get(r.ref);
    const g = w ? (w[l.id] ?? 0) : l.gain;
    return Math.max(0, Math.min(1.5, Number.isFinite(g) ? g : 0));
  }

  private always = false;
  /** keep watching for the whole session (engine: a layered track may start from anywhere — the director, a cine, the
   *  Fonoteca). One tick = a few property reads when nothing is layered. */
  watch() {
    this.always = true;
    this.ensure();
  }

  private ensure() {
    if (!this.timer) this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  tick() {
    try {
      this.step();
    } catch (e) {
      console.warn('[audio] layers', e);
    }
  }

  private step() {
    const ctx = audio.ctx;
    // decks that are gone take their layers with them
    for (const a of [...this.att]) {
      if (a.deck.state === 'stopped' || a.deck.state === 'paused' || (a.deck.state === 'playing' && a.deck.src !== a.anchor)) {
        if (a.deck.state === 'playing') this.stats.realigned++;
        this.detach(a);
      }
    }
    const d = this.player.cur;
    const layered = !!ctx && !!d && d.kind === 'buffer' && !!d.ref.layers?.length && d.state === 'playing' && !!d.src;
    if (ctx && d && layered) {
      let a = this.att.find((x) => x.deck === d);
      if (!a) {
        a = { deck: d, anchor: d.src, layers: new Map(), endingSet: false, pending: new Set() };
        this.att.push(a);
      }
      const fade = this.fades.get(d.ref.ref) ?? 2;
      // a non-looping deck (the Fonoteca playing it once): fixed gains, the layers fade with the file's own ending
      a.endingSet = !d.looping;
      for (const l of d.ref.layers!) {
        const g = this.gainOf(d.ref, l);
        const run = a.layers.get(l.id);
        if (run) {
          if (!a.endingSet && Math.abs(run.gain.gain.value - g) > 0.002) ramp(run.gain, g, fade);
          continue;
        }
        if (g <= 0.001 || a.pending.has(l.id)) continue;
        a.pending.add(l.id);
        void this.load(l.url).then((buf) => {
          a!.pending.delete(l.id);
          if (!buf || !audio.ctx || !this.att.includes(a!) || a!.deck.state !== 'playing' || a!.deck.src !== a!.anchor) return;
          this.startLayer(a!, l, buf);
        });
      }
    }
    // free decoded layers nobody plays any more; stop ticking when idle
    const live = new Set(this.att.flatMap((x) => (x.deck.ref.layers ?? []).map((l) => l.url)));
    const keep = new Set([...live, ...(d?.ref.layers ?? []).map((l) => l.url)]);
    for (const u of [...this.buffers.keys()]) if (!keep.has(u)) this.buffers.delete(u);
    if (!this.att.length && !(d && d.ref.layers?.length) && this.timer && !this.always) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** start one layer aligned to the deck: same sample of the shared grid */
  private startLayer(a: Attachment, l: LayerDef, buf: AudioBuffer) {
    const ctx = audio.ctx!;
    const d = a.deck;
    const L = d.ref.loop;
    const LL = validLoop(l.loop);
    if (!L || !LL) return;
    const T = Math.max(ctx.currentTime + START_LEAD, d.startCtx);
    const p = wrapPos(d.uAt(T), d.looping ? d.loop : null);
    const P = LL.end - LL.start;
    const off = LL.start + ((((p - L.start) % P) + P) % P);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.loopStart = LL.start;
    src.loopEnd = Math.min(LL.end, buf.duration);
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(g).connect(d.gain);
    src.start(T, Math.max(0, Math.min(buf.duration - 0.01, off)));
    const target = this.gainOf(d.ref, l);
    g.gain.setValueAtTime(0, T);
    const LR = validLoop(d.ref.loop);
    g.gain.linearRampToValueAtTime(target, T + Math.max(0.05, this.fades.get(d.ref.ref) ?? 2));
    const fin = T + Math.max(0.05, this.fades.get(d.ref.ref) ?? 2);
    if (!d.looping && LR) fadeBetween(g, target, Math.max(fin + 0.05, d.ctxAt(LR.end)), d.ctxAt(Math.max(LR.end + 0.5, d.duration || LR.end + 3)));
    a.layers.set(l.id, { src, gain: g });
    this.stats.started++;
  }

  private detach(a: Attachment) {
    for (const r of a.layers.values()) {
      try {
        r.src.stop();
      } catch {
        /* already stopped */
      }
      r.src.disconnect();
      r.gain.disconnect();
      this.stats.stopped++;
    }
    a.layers.clear();
    this.att = this.att.filter((x) => x !== a);
  }

  private load(url: string): Promise<AudioBuffer | null> {
    let p = this.buffers.get(url);
    if (!p) {
      const ctx = audio.ctx;
      if (!ctx) return Promise.resolve(null);
      p = fetch(url)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`HTTP ${r.status} ${url}`))))
        .then((b) => ctx.decodeAudioData(b))
        .then((b) => {
          this.stats.decoded++;
          return b;
        })
        .catch((e) => {
          console.warn('[audio] layer', url, e);
          this.stats.failed++;
          this.buffers.delete(url);
          return null;
        });
      this.buffers.set(url, p);
    }
    return p;
  }
}

function ramp(g: GainNode, v: number, dur: number) {
  const ctx = g.context;
  const now = ctx.currentTime;
  const p = g.gain;
  const from = p.value;
  p.cancelScheduledValues(now);
  p.setValueAtTime(from, now);
  p.linearRampToValueAtTime(v, now + dur);
}

/** hold `v` until t0, then fade to 0 by t1 (scheduled after any ramp already in place) */
function fadeBetween(g: GainNode, v: number, t0: number, t1: number) {
  const p = g.gain;
  const a = Math.max(g.context.currentTime, t0);
  p.setValueAtTime(v, a);
  p.linearRampToValueAtTime(0, Math.max(a + 0.05, t1));
}
