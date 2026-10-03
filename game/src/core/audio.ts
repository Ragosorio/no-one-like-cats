/**
 * Procedural sound: every SFX is synthesized with Web Audio (no audio files).
 * A "voice" is an oscillator or noise burst with pitch slide + ADSR-ish envelope.
 */
type Wave = OscillatorType | 'noise';

interface Voice {
  wave: Wave;
  freq: number;
  /** end frequency (slide) */
  to?: number;
  dur: number;
  attack?: number;
  vol?: number;
  delay?: number;
  /** lowpass cutoff */
  lp?: number;
  /** highpass cutoff */
  hp?: number;
  /** vibrato depth in Hz */
  vib?: number;
}

class AudioEngine {
  ctx: AudioContext | null = null;
  master!: GainNode;
  sfxBus!: GainNode;
  musicBus!: GainNode;
  private noiseBuf: AudioBuffer | null = null;
  muted = false;
  sfxVolume = 0.7;
  musicVolume = 0.35;

  /** Must be called from a user gesture. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    this.master.connect(comp).connect(this.ctx.destination);
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = this.sfxVolume;
    this.sfxBus.connect(this.master);
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = this.musicVolume;
    this.musicBus.connect(this.master);
    const len = this.ctx.sampleRate * 1;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) this.master.gain.value = m ? 0 : 1;
  }

  voice(v: Voice, bus?: AudioNode, pitchMul = 1) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t0 = ctx.currentTime + (v.delay ?? 0);
    const g = ctx.createGain();
    const vol = v.vol ?? 0.3;
    const atk = v.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + v.dur);
    let node: AudioNode = g;
    if (v.lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = v.lp;
      g.connect(f);
      node = f;
    }
    if (v.hp) {
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = v.hp;
      node.connect(f);
      node = f;
    }
    node.connect(bus ?? this.sfxBus);
    if (v.wave === 'noise') {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      src.playbackRate.setValueAtTime(v.freq * pitchMul, t0);
      if (v.to) src.playbackRate.exponentialRampToValueAtTime(Math.max(0.01, v.to * pitchMul), t0 + v.dur);
      src.connect(g);
      src.start(t0);
      src.stop(t0 + v.dur + 0.05);
    } else {
      const o = ctx.createOscillator();
      o.type = v.wave;
      o.frequency.setValueAtTime(v.freq * pitchMul, t0);
      if (v.to) o.frequency.exponentialRampToValueAtTime(Math.max(1, v.to * pitchMul), t0 + v.dur);
      if (v.vib) {
        const lfo = ctx.createOscillator();
        const lg = ctx.createGain();
        lfo.frequency.value = 7;
        lg.gain.value = v.vib;
        lfo.connect(lg).connect(o.frequency);
        lfo.start(t0);
        lfo.stop(t0 + v.dur);
      }
      o.connect(g);
      o.start(t0);
      o.stop(t0 + v.dur + 0.05);
    }
  }

  play(name: SfxName, pitchMul = 1) {
    if (!this.ctx || this.muted) return;
    const recipe = SFX[name];
    for (const v of recipe) this.voice(v, undefined, pitchMul);
  }
}

const SFX = {
  click: [{ wave: 'square', freq: 900, to: 600, dur: 0.05, vol: 0.12 }],
  hover: [{ wave: 'sine', freq: 1400, dur: 0.03, vol: 0.05 }],
  coin: [
    { wave: 'square', freq: 988, dur: 0.06, vol: 0.12 },
    { wave: 'square', freq: 1319, dur: 0.18, vol: 0.12, delay: 0.06 },
  ],
  gem: [
    { wave: 'sine', freq: 1568, dur: 0.12, vol: 0.2 },
    { wave: 'sine', freq: 2093, dur: 0.25, vol: 0.18, delay: 0.07 },
    { wave: 'triangle', freq: 3136, dur: 0.3, vol: 0.08, delay: 0.12 },
  ],
  pop: [{ wave: 'sine', freq: 400, to: 1200, dur: 0.08, vol: 0.2 }],
  nyam: [
    { wave: 'sawtooth', freq: 220, to: 330, dur: 0.07, vol: 0.12, lp: 1500 },
    { wave: 'sawtooth', freq: 300, to: 180, dur: 0.1, vol: 0.12, lp: 1200, delay: 0.08 },
  ],
  levelup: [
    { wave: 'square', freq: 523, dur: 0.08, vol: 0.12 },
    { wave: 'square', freq: 659, dur: 0.08, vol: 0.12, delay: 0.08 },
    { wave: 'square', freq: 784, dur: 0.08, vol: 0.12, delay: 0.16 },
    { wave: 'square', freq: 1047, dur: 0.35, vol: 0.14, delay: 0.24, vib: 8 },
  ],
  whoosh: [{ wave: 'noise', freq: 0.4, to: 2, dur: 0.35, vol: 0.2, lp: 3000, attack: 0.15 }],
  shoot: [
    { wave: 'noise', freq: 1, to: 0.3, dur: 0.25, vol: 0.35, lp: 2000 },
    { wave: 'sine', freq: 180, to: 60, dur: 0.2, vol: 0.4 },
  ],
  boom: [
    { wave: 'noise', freq: 0.8, to: 0.1, dur: 0.9, vol: 0.6, lp: 900 },
    { wave: 'sine', freq: 90, to: 30, dur: 0.6, vol: 0.7 },
  ],
  bigboom: [
    { wave: 'noise', freq: 0.6, to: 0.05, dur: 1.8, vol: 0.7, lp: 700 },
    { wave: 'sine', freq: 70, to: 20, dur: 1.4, vol: 0.9 },
    { wave: 'sawtooth', freq: 55, to: 25, dur: 1.2, vol: 0.25, lp: 300 },
  ],
  hit: [
    { wave: 'noise', freq: 1.5, to: 0.5, dur: 0.15, vol: 0.4, lp: 2500 },
    { wave: 'square', freq: 200, to: 80, dur: 0.12, vol: 0.2 },
  ],
  crit: [
    { wave: 'noise', freq: 2, to: 0.4, dur: 0.25, vol: 0.45, lp: 4000 },
    { wave: 'sawtooth', freq: 880, to: 220, dur: 0.25, vol: 0.2 },
    { wave: 'square', freq: 1760, dur: 0.1, vol: 0.1, delay: 0.02 },
  ],
  shield: [
    { wave: 'triangle', freq: 600, to: 1200, dur: 0.25, vol: 0.2, vib: 30 },
    { wave: 'sine', freq: 1800, dur: 0.3, vol: 0.08 },
  ],
  zap: [
    { wave: 'sawtooth', freq: 1200, to: 200, dur: 0.18, vol: 0.18, vib: 200 },
    { wave: 'noise', freq: 3, dur: 0.15, vol: 0.2, hp: 2000 },
  ],
  splash: [{ wave: 'noise', freq: 0.7, to: 0.2, dur: 0.5, vol: 0.3, lp: 1800, attack: 0.03 }],
  freeze: [
    { wave: 'sine', freq: 2400, to: 1800, dur: 0.4, vol: 0.12, vib: 40 },
    { wave: 'noise', freq: 4, dur: 0.3, vol: 0.12, hp: 5000 },
  ],
  charge: [{ wave: 'sawtooth', freq: 110, to: 880, dur: 0.9, vol: 0.15, lp: 2500, attack: 0.3 }],
  reveal: [
    { wave: 'sine', freq: 392, dur: 0.5, vol: 0.15 },
    { wave: 'sine', freq: 523, dur: 0.5, vol: 0.15, delay: 0.12 },
    { wave: 'sine', freq: 659, dur: 0.6, vol: 0.15, delay: 0.24 },
    { wave: 'sine', freq: 784, dur: 0.9, vol: 0.15, delay: 0.36 },
    { wave: 'triangle', freq: 1568, dur: 1.2, vol: 0.1, delay: 0.5, vib: 6 },
  ],
  fanfare: [
    { wave: 'square', freq: 523, dur: 0.12, vol: 0.13 },
    { wave: 'square', freq: 523, dur: 0.12, vol: 0.13, delay: 0.14 },
    { wave: 'square', freq: 523, dur: 0.12, vol: 0.13, delay: 0.28 },
    { wave: 'square', freq: 698, dur: 0.6, vol: 0.15, delay: 0.42, vib: 6 },
    { wave: 'sawtooth', freq: 349, dur: 0.6, vol: 0.08, delay: 0.42, lp: 2000 },
  ],
  drumroll: [{ wave: 'noise', freq: 1, dur: 1.2, vol: 0.18, lp: 1200, attack: 0.8 }],
  sting: [
    { wave: 'sawtooth', freq: 147, dur: 0.8, vol: 0.2, lp: 1200 },
    { wave: 'sawtooth', freq: 156, dur: 0.8, vol: 0.2, lp: 1200 },
  ],
  error: [{ wave: 'square', freq: 200, to: 140, dur: 0.18, vol: 0.12 }],
  tick: [{ wave: 'square', freq: 2000, dur: 0.02, vol: 0.06 }],
  alarm: [
    { wave: 'square', freq: 880, dur: 0.15, vol: 0.12 },
    { wave: 'square', freq: 660, dur: 0.15, vol: 0.12, delay: 0.18 },
    { wave: 'square', freq: 880, dur: 0.15, vol: 0.12, delay: 0.36 },
    { wave: 'square', freq: 660, dur: 0.15, vol: 0.12, delay: 0.54 },
  ],
  meow: [
    { wave: 'sawtooth', freq: 520, to: 900, dur: 0.12, vol: 0.12, lp: 2200 },
    { wave: 'sawtooth', freq: 900, to: 420, dur: 0.28, vol: 0.12, lp: 2000, delay: 0.11, vib: 12 },
  ],
  purr: [{ wave: 'sawtooth', freq: 28, dur: 0.8, vol: 0.12, lp: 300, vib: 4, attack: 0.1 }],
  paper: [{ wave: 'noise', freq: 2.5, to: 1, dur: 0.18, vol: 0.18, hp: 1500, attack: 0.02 }],
  glitch: [
    { wave: 'square', freq: 60, to: 2000, dur: 0.08, vol: 0.12 },
    { wave: 'noise', freq: 5, dur: 0.1, vol: 0.12, delay: 0.05, hp: 3000 },
    { wave: 'square', freq: 3000, to: 80, dur: 0.08, vol: 0.1, delay: 0.1 },
  ],
} satisfies Record<string, Voice[]>;

export type SfxName = keyof typeof SFX;

export const audio = new AudioEngine();
export const sfx = (name: SfxName, pitch = 1) => audio.play(name, pitch);
