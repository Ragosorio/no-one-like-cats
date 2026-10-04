/**
 * Casino lounge loop: a tiny swing combo (walking bass, brushed hats, Rhodes-ish stabs, vibes)
 * synthesized on the shared music bus. Original, procedural — no recognizable melodies.
 */
import { audio } from '../../core/audio';

type V = Parameters<typeof audio.voice>[0];
const BPM = 100;
const BEAT = 60 / BPM;
// ii–V–I–vi in D-flat-ish (semitones from A2=110Hz)
const PROG = [
  { root: 6, third: 9, seventh: 13 },
  { root: 11, third: 15, seventh: 18 },
  { root: 4, third: 8, seventh: 11 },
  { root: 1, third: 4, seventh: 8 },
];
const PENTA = [0, 3, 5, 7, 10, 12, 15];
const hz = (semi: number) => 110 * Math.pow(2, semi / 12);

let timer: number | null = null;
let nextT = 0;
let step = 0; // 8th notes
let intensity = 0;

function at(v: V, t: number) {
  const ctx = audio.ctx;
  if (!ctx || audio.muted) return;
  audio.voice({ ...v, delay: Math.max(0, t - ctx.currentTime) }, audio.musicBus);
}

function schedule() {
  const ctx = audio.ctx;
  if (!ctx) return;
  while (nextT < ctx.currentTime + 0.25) {
    const bar = Math.floor(step / 8) % PROG.length;
    const s8 = step % 8;
    const ch = PROG[bar];
    const swing = s8 % 2 === 1 ? BEAT * 0.16 : 0;
    const t = nextT + swing;
    // hats: swung 8ths, accent on 2 & 4
    at({ wave: 'noise', freq: 6, dur: 0.05, vol: s8 === 2 || s8 === 6 ? 0.05 : 0.025, hp: 6000 }, t);
    // walking bass on quarters
    if (s8 % 2 === 0) {
      const walk = [ch.root, ch.root + 7, ch.third + 12, ch.root + 5][s8 / 2];
      at({ wave: 'triangle', freq: hz(walk - 12), dur: BEAT * 0.9, vol: 0.16, lp: 700 }, t);
    }
    // stabs on 2 and 4
    if (s8 === 2 || s8 === 6) {
      for (const n of [ch.third, ch.seventh, ch.root + 12]) at({ wave: 'triangle', freq: hz(n + 12), dur: 0.22, vol: 0.035, lp: 2400, attack: 0.01 }, t);
    }
    // kick-ish thump on 1 and 3 (soft)
    if (s8 === 0 || s8 === 4) at({ wave: 'sine', freq: 90, to: 45, dur: 0.18, vol: 0.12 }, t);
    // vibes
    if (Math.random() < 0.18 + intensity * 0.25 && s8 % 2 === 0) {
      const n = PENTA[Math.floor(Math.random() * PENTA.length)] + ch.root + 24;
      at({ wave: 'sine', freq: hz(n), dur: 0.5, vol: 0.05, vib: 5, attack: 0.01 }, t);
      at({ wave: 'sine', freq: hz(n) * 2, dur: 0.3, vol: 0.015 }, t);
    }
    nextT += BEAT / 2;
    step++;
  }
}

export const lounge = {
  start() {
    if (timer !== null) return;
    const ctx = audio.ctx;
    nextT = (ctx?.currentTime ?? 0) + 0.1;
    step = 0;
    timer = window.setInterval(() => {
      if (!audio.ctx) return;
      if (nextT < audio.ctx.currentTime) nextT = audio.ctx.currentTime + 0.05;
      schedule();
    }, 90);
  },
  stop() {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
  },
  /** 0..1 — more vibes during big moments */
  hype(v: number) {
    intensity = Math.max(0, Math.min(1, v));
  },
};
