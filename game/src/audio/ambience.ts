/**
 * Ambience beds: procedural Web Audio (noise + filters + slow LFOs + sparse one-shots), crossfaded.
 * Beds: sea · wind · rain · storm · cave · night_astral (+ 'none'). File beds later: director.json
 * › ambienceFiles[bed] = 'music/amb/sea.mp3' streams a looping file instead (same crossfade).
 *
 * Everything goes to the ambient bus (Ajustes › AMBIENTE), ducked half as much as music by dialogs.
 * Cost: ~10–20 nodes per bed, one shared 4 s noise buffer per colour, a 250 ms timer for one-shots.
 */
import { audio } from '../core/audio';
import { musicUrl } from './catalog';

type Colour = 'white' | 'pink' | 'brown';
const noise = new Map<Colour, AudioBuffer>();
function noiseBuf(ctx: AudioContext, c: Colour): AudioBuffer {
  const hit = noise.get(c);
  if (hit && hit.sampleRate === ctx.sampleRate) return hit;
  const len = Math.floor(ctx.sampleRate * 4);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (c === 'white') d[i] = w * 0.5;
      else if (c === 'pink') {
        b0 = 0.997 * b0 + w * 0.029591;
        b1 = 0.985 * b1 + w * 0.032534;
        b2 = 0.95 * b2 + w * 0.048056;
        d[i] = (b0 + b1 + b2 + w * 0.05) * 1.6;
      } else {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.2;
      }
    }
    // crossfade the loop seam (4 s buffer, 50 ms)
    const f = Math.floor(ctx.sampleRate * 0.05);
    for (let i = 0; i < f; i++) {
      const k = i / f;
      d[i] = d[i] * k + d[len - f + i] * (1 - k);
    }
  }
  noise.set(c, buf);
  return buf;
}

class Bed {
  out: GainNode;
  private nodes: AudioNode[] = [];
  protected srcs: (AudioScheduledSourceNode | null)[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextShot = 0;
  el?: HTMLAudioElement;
  constructor(
    public id: string,
    protected ctx: AudioContext,
  ) {
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.out.connect(audio.ambientBus);
  }
  protected keep<T extends AudioNode>(n: T): T {
    this.nodes.push(n);
    return n;
  }
  /** a looping noise source (random start, slightly detuned per layer for width) */
  protected noise(c: Colour, rate = 1): AudioBufferSourceNode {
    const s = this.ctx.createBufferSource();
    s.buffer = noiseBuf(this.ctx, c);
    s.loop = true;
    s.playbackRate.value = rate;
    s.start(this.ctx.currentTime, Math.random() * 3.9);
    this.srcs.push(s);
    return s;
  }
  protected filter(type: BiquadFilterType, freq: number, q = 0.7) {
    const f = this.keep(this.ctx.createBiquadFilter());
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }
  protected gain(v: number) {
    const g = this.keep(this.ctx.createGain());
    g.gain.value = v;
    return g;
  }
  /** slow LFO: param oscillates base ± depth at `hz` */
  protected lfo(param: AudioParam, base: number, depth: number, hz: number, type: OscillatorType = 'sine') {
    param.value = base;
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = hz;
    const g = this.keep(this.ctx.createGain());
    g.gain.value = depth;
    o.connect(g).connect(param);
    o.start(this.ctx.currentTime + Math.random() * 0.5);
    this.srcs.push(o);
  }
  protected pan(v: number) {
    const p = this.keep(this.ctx.createStereoPanner());
    p.pan.value = v;
    return p;
  }
  /** sparse one-shots every [min,max] s (rain drops, cave drips, thunder, astral sparkles) */
  protected every(min: number, max: number, shot: (t: number) => void) {
    this.nextShot = this.ctx.currentTime + min * Math.random();
    this.timer = setInterval(() => {
      const now = this.ctx.currentTime;
      // a throttled tab wakes up late: schedule only what's ahead, never a burst of catch-up shots
      if (this.nextShot < now) this.nextShot = now + 0.05;
      while (this.nextShot < now + 0.3) {
        shot(this.nextShot);
        this.nextShot += min + Math.random() * (max - min);
      }
    }, 250);
  }
  /** a short enveloped voice into `to` at time t */
  protected blip(t: number, o: { wave: OscillatorType | 'noise'; f: number; to?: number; dur: number; vol: number; lp?: number; hp?: number; pan?: number; colour?: Colour }, to: AudioNode = this.out) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol, t + Math.min(0.01, o.dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    let n: AudioNode = g;
    if (o.lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(o.lp, t);
      n.connect(f);
      n = f;
    }
    if (o.hp) {
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = o.hp;
      n.connect(f);
      n = f;
    }
    if (o.pan !== undefined) {
      const p = ctx.createStereoPanner();
      p.pan.value = o.pan;
      n.connect(p);
      n = p;
    }
    n.connect(to);
    let s: AudioScheduledSourceNode;
    if (o.wave === 'noise') {
      const b = ctx.createBufferSource();
      b.buffer = noiseBuf(ctx, o.colour ?? 'white');
      b.connect(g);
      s = b;
      b.start(t, Math.random() * 3);
    } else {
      const osc = ctx.createOscillator();
      osc.type = o.wave;
      osc.frequency.setValueAtTime(o.f, t);
      if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + o.dur);
      osc.connect(g);
      s = osc;
      osc.start(t);
    }
    s.stop(t + o.dur + 0.05);
    s.onended = () => {
      try {
        g.disconnect();
        n.disconnect();
      } catch {
        /* ok */
      }
    };
  }
  fade(v: number, dur: number) {
    const g = this.out.gain;
    const now = this.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(v, now + Math.max(0.02, dur));
  }
  dispose() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    for (const s of this.srcs) {
      try {
        s?.stop();
      } catch {
        /* ok */
      }
      s?.disconnect();
    }
    this.srcs = [];
    for (const n of this.nodes) n.disconnect();
    this.nodes = [];
    if (this.el) {
      this.el.pause();
      this.el.removeAttribute('src');
      this.el.load();
      this.el = undefined;
    }
    this.out.disconnect();
  }
}

class ProceduralBed extends Bed {
  constructor(id: string, ctx: AudioContext) {
    super(id, ctx);
  }
  /** wire the bed; false when the id is unknown */
  make(): boolean {
    const out = this.out;
    switch (this.id) {
      case 'sea': {
        // the swell: brown noise, lowpassed, breathing at ~11 s; the foam: pink noise, band, offset phase
        const body = this.gain(0.55);
        const lp = this.filter('lowpass', 520, 0.5);
        this.noise('brown').connect(lp).connect(body).connect(out);
        this.lfo(body.gain, 0.5, 0.32, 0.09);
        this.lfo(lp.frequency, 520, 220, 0.07);
        const foam = this.gain(0.1);
        const bp = this.filter('bandpass', 1900, 0.5);
        const pn = this.pan(0);
        this.noise('pink', 1.03).connect(bp).connect(foam).connect(pn).connect(out);
        this.lfo(foam.gain, 0.09, 0.08, 0.11);
        this.lfo(pn.pan, 0, 0.45, 0.031);
        return true;
      }
      case 'wind': {
        const g = this.gain(0.35);
        const bp = this.filter('bandpass', 600, 1.1);
        const pn = this.pan(0);
        this.noise('pink').connect(bp).connect(g).connect(pn).connect(out);
        this.lfo(bp.frequency, 620, 320, 0.05);
        this.lfo(g.gain, 0.34, 0.2, 0.13);
        this.lfo(pn.pan, 0, 0.6, 0.021);
        const wh = this.gain(0.035);
        const bp2 = this.filter('bandpass', 1300, 9);
        this.noise('white', 0.97).connect(bp2).connect(wh).connect(out);
        this.lfo(bp2.frequency, 1300, 380, 0.033);
        this.lfo(wh.gain, 0.03, 0.028, 0.07);
        return true;
      }
      case 'rain':
      case 'storm': {
        const storm = this.id === 'storm';
        const g = this.gain(storm ? 0.42 : 0.3);
        const hp = this.filter('highpass', storm ? 700 : 1000, 0.5);
        const lp = this.filter('lowpass', 7500, 0.5);
        this.noise('pink').connect(hp).connect(lp).connect(g).connect(out);
        this.lfo(g.gain, storm ? 0.4 : 0.29, storm ? 0.1 : 0.04, 0.19);
        const under = this.gain(storm ? 0.28 : 0.12);
        this.noise('brown', 0.9).connect(this.filter('lowpass', storm ? 260 : 340)).connect(under).connect(out);
        if (storm) this.lfo(under.gain, 0.28, 0.12, 0.06);
        // drops on leaves and roofs
        this.every(0.03, storm ? 0.09 : 0.16, (t) =>
          this.blip(t, { wave: 'sine', f: 1800 + Math.random() * 2600, to: 900 + Math.random() * 600, dur: 0.035, vol: 0.012 + Math.random() * 0.02, pan: Math.random() * 1.6 - 0.8 }),
        );
        if (storm) {
          // distant thunder every 9–22 s (a separate timer: the drops own every())
          let next = this.ctx.currentTime + 4 + Math.random() * 6;
          const iv = setInterval(() => {
            const now = this.ctx.currentTime;
            if (next < now) next = now + 0.1;
            if (next < now + 0.4) {
              const dur = 3 + Math.random() * 2.5;
              const f = this.ctx.createBiquadFilter();
              f.type = 'lowpass';
              f.frequency.setValueAtTime(900, next);
              f.frequency.exponentialRampToValueAtTime(110, next + dur);
              f.connect(out);
              this.blip(next, { wave: 'noise', f: 1, dur, vol: 0.5, colour: 'brown', pan: Math.random() - 0.5 }, f);
              setTimeout(() => f.disconnect(), (dur + 1.5) * 1000);
              next += 9 + Math.random() * 13;
            }
          }, 300);
          const dispose = this.dispose.bind(this);
          this.dispose = () => {
            clearInterval(iv);
            dispose();
          };
        }
        return true;
      }
      case 'cave': {
        const drone = this.gain(0.32);
        this.noise('brown', 0.8).connect(this.filter('lowpass', 200, 0.6)).connect(drone).connect(out);
        this.lfo(drone.gain, 0.3, 0.08, 0.045);
        const room = this.gain(0.025);
        this.noise('pink').connect(this.filter('bandpass', 480, 4)).connect(room).connect(out);
        // drips with a stone echo
        const echo = this.keep(this.ctx.createDelay(1));
        echo.delayTime.value = 0.23;
        const fb = this.gain(0.38);
        const wet = this.gain(0.5);
        echo.connect(fb).connect(echo);
        echo.connect(wet).connect(out);
        this.every(1.4, 5, (t) => {
          const f = 900 + Math.random() * 900;
          const o = { wave: 'sine' as const, f, to: f * 0.55, dur: 0.07, vol: 0.05 + Math.random() * 0.03, pan: Math.random() * 1.4 - 0.7 };
          this.blip(t, o);
          this.blip(t, o, echo);
        });
        return true;
      }
      case 'night_astral': {
        // a slow, glassy chord (pentatonic), each partial breathing on its own; faint air; sparkles
        const notes = [196, 293.66, 392, 587.33, 880];
        notes.forEach((f, i) => {
          const o = this.ctx.createOscillator();
          o.type = i % 2 ? 'triangle' : 'sine';
          o.frequency.value = f;
          o.detune.value = (Math.random() - 0.5) * 8;
          const g = this.gain(0);
          const pn = this.pan((i / (notes.length - 1)) * 1.2 - 0.6);
          o.connect(g).connect(pn).connect(out);
          o.start();
          this.srcs.push(o);
          this.lfo(g.gain, 0.016 / (1 + i * 0.25), 0.014 / (1 + i * 0.25), 0.05 + i * 0.027);
        });
        const air = this.gain(0.018);
        this.noise('pink').connect(this.filter('highpass', 5500, 0.5)).connect(air).connect(out);
        this.lfo(air.gain, 0.016, 0.01, 0.08);
        const echo = this.keep(this.ctx.createDelay(1.5));
        echo.delayTime.value = 0.42;
        const fb = this.gain(0.45);
        const wet = this.gain(0.6);
        echo.connect(fb).connect(echo);
        echo.connect(this.filter('lowpass', 4500)).connect(wet).connect(out);
        const scale = [1174.66, 1318.51, 1567.98, 1760, 2349.32, 2637.02];
        this.every(1.8, 5.5, (t) => {
          const f = scale[Math.floor(Math.random() * scale.length)];
          const o = { wave: 'triangle' as const, f, dur: 1.4, vol: 0.018 + Math.random() * 0.012, pan: Math.random() * 1.6 - 0.8 };
          this.blip(t, o);
          this.blip(t, o, echo);
        });
        return true;
      }
    }
    return false;
  }
}

class FileBed extends Bed {
  make(url: string) {
    const el = new Audio();
    el.preload = 'auto';
    el.loop = true;
    el.crossOrigin = 'anonymous';
    el.src = url;
    this.el = el;
    this.ctx.createMediaElementSource(el).connect(this.out);
    void el.play().catch(() => undefined);
    return true;
  }
}

/** the ambience mixer: one bed at a time (+ the one fading out) */
export class Ambience {
  cur: Bed | null = null;
  private leaving = new Set<Bed>();
  /** desired bed (applied on unlock if the context didn't exist yet) */
  wanted: { bed: string; level: number } = { bed: 'none', level: 1 };
  files: Record<string, string> = {};

  set(bed: string, o: { fade?: number; level?: number } = {}) {
    const level = Math.max(0, Math.min(1.5, o.level ?? 1));
    const fade = Math.max(0.05, o.fade ?? 3);
    this.wanted = { bed: bed || 'none', level };
    const ctx = audio.ctx;
    if (!ctx) return;
    if (this.cur && this.cur.id === bed) {
      this.cur.fade(level, Math.min(fade, 1.5));
      return;
    }
    // anything still leaving goes now; the current bed fades out
    for (const b of this.leaving) this.retire(b, 0.1);
    if (this.cur) this.retire(this.cur, fade);
    this.cur = null;
    if (!bed || bed === 'none') return;
    let b: Bed | null = null;
    const file = this.files[bed];
    if (file) {
      const fb = new FileBed(bed, ctx);
      fb.make(musicUrl(file));
      b = fb;
    } else {
      const pb = new ProceduralBed(bed, ctx);
      if (pb.make()) b = pb;
      else {
        pb.dispose();
        if (import.meta.env?.DEV) console.warn(`[audio] ambiente desconocido: ${bed}`);
      }
    }
    if (!b) return;
    b.fade(level, fade);
    this.cur = b;
  }
  private retire(b: Bed, fade: number) {
    this.leaving.add(b);
    b.fade(0, fade);
    setTimeout(() => {
      b.dispose();
      this.leaving.delete(b);
    }, (fade + 0.2) * 1000);
  }
  /** debug */
  status() {
    return { bed: this.cur?.id ?? 'none', leaving: [...this.leaving].map((b) => b.id), wanted: this.wanted };
  }
}
