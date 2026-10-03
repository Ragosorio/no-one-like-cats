import { audio } from './audio';

/**
 * Procedural music: a tiny lookahead step-sequencer (16th notes) with
 * drums, bass, pad chords and a pentatonic lead. Moods switch on the downbeat.
 */
export type Mood = 'island' | 'battle' | 'tension' | 'boss' | 'silence';

interface MoodDef {
  bpm: number;
  /** chord roots in semitones relative to A2 (110Hz) per bar */
  prog: number[];
  minor: boolean;
  kick: number[];
  snare: number[];
  hat: number[];
  bass: (number | null)[];
  lead: number; // lead density 0..1
  swing: number;
  padVol: number;
  leadWave: OscillatorType;
}

const MOODS: Record<Exclude<Mood, 'silence'>, MoodDef> = {
  island: {
    bpm: 84,
    prog: [3, 0, 8, 10], // C, A, F, G (relative to A)
    minor: false,
    kick: [0, 7, 10],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 8, 10, 12, 14],
    bass: [0, null, null, 0, null, null, 7, null, 0, null, null, null, 5, null, 7, null],
    lead: 0.28,
    swing: 0.12,
    padVol: 0.05,
    leadWave: 'triangle',
  },
  battle: {
    bpm: 132,
    prog: [0, 0, 8, 10, 0, 0, 5, 7],
    minor: true,
    kick: [0, 4, 8, 11, 12],
    snare: [4, 12],
    hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    bass: [0, 0, 12, 0, 0, 12, 0, 7, 0, 0, 12, 0, 10, 0, 7, 5],
    lead: 0.45,
    swing: 0,
    padVol: 0.035,
    leadWave: 'square',
  },
  tension: {
    bpm: 110,
    prog: [0, 1, 0, 1],
    minor: true,
    kick: [0, 8],
    snare: [12],
    hat: [2, 6, 10, 14],
    bass: [0, null, 0, null, 0, null, 0, null, 1, null, 1, null, 1, null, 1, null],
    lead: 0.15,
    swing: 0,
    padVol: 0.05,
    leadWave: 'sawtooth',
  },
  boss: {
    bpm: 148,
    prog: [0, 0, 1, 1, 5, 5, 6, 7],
    minor: true,
    kick: [0, 3, 6, 8, 11, 14],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 8, 10, 12, 14],
    bass: [0, 12, 0, 12, 0, 12, 0, 12, 1, 13, 1, 13, 1, 13, 3, 15],
    lead: 0.5,
    swing: 0,
    padVol: 0.04,
    leadWave: 'sawtooth',
  },
};

const PENTA_MAJ = [0, 2, 4, 7, 9, 12, 14, 16];
const PENTA_MIN = [0, 3, 5, 7, 10, 12, 15, 17];

class Music {
  mood: Mood = 'silence';
  private next: Mood | null = null;
  private step = 0;
  private bar = 0;
  private nextTime = 0;
  private timer: number | null = null;
  private seed = 1;

  play(m: Mood) {
    if (!audio.ctx) return;
    if (m === this.mood) return;
    if (this.mood === 'silence') {
      this.mood = m;
      this.step = 0;
      this.bar = 0;
      this.nextTime = audio.ctx.currentTime + 0.1;
      this.start();
    } else this.next = m;
  }

  stop() {
    this.mood = 'silence';
    if (this.timer) window.clearInterval(this.timer);
    this.timer = null;
  }

  private rand() {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }

  private start() {
    if (this.timer) window.clearInterval(this.timer);
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  private schedule() {
    const ctx = audio.ctx;
    if (!ctx || this.mood === 'silence') return;
    while (this.nextTime < ctx.currentTime + 0.12) {
      if (this.step === 0 && this.next) {
        this.mood = this.next;
        this.next = null;
        this.bar = 0;
        if (this.mood === 'silence') return this.stop();
      }
      this.tick(this.nextTime);
      const def = MOODS[this.mood as Exclude<Mood, 'silence'>];
      const sixteenth = 60 / def.bpm / 4;
      const sw = this.step % 2 === 0 ? sixteenth * (1 + def.swing) : sixteenth * (1 - def.swing);
      this.nextTime += sw;
      this.step = (this.step + 1) % 16;
      if (this.step === 0) this.bar++;
    }
  }

  private tick(t: number) {
    const def = MOODS[this.mood as Exclude<Mood, 'silence'>];
    const ctx = audio.ctx!;
    const bus = audio.musicBus;
    const s = this.step;
    const root = def.prog[this.bar % def.prog.length];
    const f0 = 110 * Math.pow(2, root / 12);
    const note = (freq: number, dur: number, wave: OscillatorType, vol: number, lp = 3000, slide?: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = lp;
      o.type = wave;
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(f).connect(g).connect(bus);
      o.start(t);
      o.stop(t + dur + 0.02);
    };
    const noise = (dur: number, vol: number, hp: number) => {
      const src = ctx.createBufferSource();
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = hp;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(g).connect(bus);
      src.start(t);
    };
    if (def.kick.includes(s)) note(120, 0.22, 'sine', 0.5, 800, 40);
    if (def.snare.includes(s)) noise(0.16, 0.22, 1500);
    if (def.hat.includes(s)) noise(0.04, this.mood === 'island' ? 0.05 : 0.07, 7000);
    const b = def.bass[s];
    if (b !== null && b !== undefined) note(f0 * Math.pow(2, b / 12) / 2, 0.18, 'sawtooth', 0.12, 600);
    if (s === 0) {
      // pad chord (root, third, fifth, seventh)
      const third = def.minor ? 3 : 4;
      for (const iv of [0, third, 7, def.minor ? 10 : 11]) note(f0 * 2 * Math.pow(2, iv / 12), (60 / def.bpm) * 3.8, 'triangle', def.padVol, 1400);
    }
    if (s % 2 === 0 && this.rand() < def.lead) {
      const scale = def.minor ? PENTA_MIN : PENTA_MAJ;
      const iv = scale[Math.floor(this.rand() * scale.length)];
      note(f0 * 4 * Math.pow(2, iv / 12), 0.16, def.leadWave, 0.045, 2600);
    }
  }
}

export const music = new Music();
