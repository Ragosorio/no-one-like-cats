/** Casino sounds, synthesized with the shared Web Audio engine (no files). */
import { audio, sfx } from '../../core/audio';

type V = Parameters<typeof audio.voice>[0];
function play(vs: V[], pitch = 1) {
  if (!audio.ctx || audio.muted) return;
  for (const v of vs) audio.voice(v, undefined, pitch);
}

export const csfx = {
  lever() {
    play([
      { wave: 'sawtooth', freq: 140, to: 60, dur: 0.22, vol: 0.18, lp: 900 },
      { wave: 'noise', freq: 1.2, to: 0.4, dur: 0.2, vol: 0.18, lp: 1600, delay: 0.05 },
    ]);
  },
  reelTick(p = 1) {
    play([{ wave: 'square', freq: 1800, dur: 0.018, vol: 0.035 }], p);
  },
  reelStop(i = 0) {
    play([
      { wave: 'square', freq: 220 + i * 40, to: 110, dur: 0.09, vol: 0.16 },
      { wave: 'noise', freq: 2, to: 0.6, dur: 0.08, vol: 0.14, lp: 2400 },
    ]);
  },
  coin(p = 1) {
    play(
      [
        { wave: 'square', freq: 1319, dur: 0.05, vol: 0.07 },
        { wave: 'square', freq: 1760, dur: 0.12, vol: 0.06, delay: 0.05 },
      ],
      p,
    );
  },
  coinShower(n = 10, gap = 0.06) {
    for (let i = 0; i < n; i++) {
      play([{ wave: 'square', freq: 1319 + ((i * 97) % 600), dur: 0.06, vol: 0.05, delay: i * gap }]);
      play([{ wave: 'triangle', freq: 2637, dur: 0.08, vol: 0.03, delay: i * gap + 0.03 }]);
    }
  },
  winSmall() {
    play([
      { wave: 'square', freq: 784, dur: 0.08, vol: 0.1 },
      { wave: 'square', freq: 988, dur: 0.08, vol: 0.1, delay: 0.08 },
      { wave: 'square', freq: 1319, dur: 0.22, vol: 0.11, delay: 0.16, vib: 6 },
    ]);
  },
  winBig() {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319];
    notes.forEach((f, i) => play([{ wave: 'square', freq: f, dur: 0.12, vol: 0.11, delay: i * 0.09 }]));
    play([{ wave: 'sawtooth', freq: 262, dur: 0.9, vol: 0.07, lp: 1800, delay: 0.1 }]);
    play([{ wave: 'triangle', freq: 2093, dur: 0.6, vol: 0.06, delay: 0.62, vib: 10 }]);
  },
  jackpot() {
    const seq = [523, 523, 523, 698, 880, 1047, 880, 1047, 1397];
    seq.forEach((f, i) => play([{ wave: 'square', freq: f, dur: i === seq.length - 1 ? 0.9 : 0.12, vol: 0.12, delay: i * 0.13, vib: i === seq.length - 1 ? 9 : 0 }]));
    play([{ wave: 'sawtooth', freq: 131, dur: 1.6, vol: 0.09, lp: 1200 }]);
    play([{ wave: 'noise', freq: 0.5, to: 2, dur: 1.2, vol: 0.12, lp: 4000, attack: 0.6 }]);
    sfx('fanfare');
  },
  lose() {
    play([
      { wave: 'triangle', freq: 392, to: 370, dur: 0.16, vol: 0.09 },
      { wave: 'triangle', freq: 330, to: 262, dur: 0.32, vol: 0.09, delay: 0.16 },
    ]);
  },
  wheelTick(p = 1) {
    play([{ wave: 'square', freq: 2400, dur: 0.012, vol: 0.05, hp: 1200 }], p);
  },
  ballDrop() {
    play([
      { wave: 'triangle', freq: 1800, to: 900, dur: 0.06, vol: 0.12 },
      { wave: 'triangle', freq: 1500, to: 800, dur: 0.05, vol: 0.09, delay: 0.12 },
      { wave: 'triangle', freq: 1300, to: 700, dur: 0.04, vol: 0.07, delay: 0.21 },
    ]);
  },
  portal() {
    play([
      { wave: 'sawtooth', freq: 55, to: 220, dur: 1.6, vol: 0.14, lp: 900, attack: 0.5, vib: 3 },
      { wave: 'sine', freq: 110, to: 440, dur: 1.6, vol: 0.12, attack: 0.6 },
      { wave: 'noise', freq: 0.3, to: 1.5, dur: 1.5, vol: 0.1, lp: 2500, attack: 0.8 },
    ]);
  },
  beam(tier: number) {
    const base = [392, 494, 587, 784, 988][Math.max(0, Math.min(4, tier))];
    play([
      { wave: 'sawtooth', freq: base / 2, to: base, dur: 0.5, vol: 0.1, lp: 3000 },
      { wave: 'sine', freq: base * 2, dur: 0.9, vol: 0.08, delay: 0.1, vib: 6 },
    ]);
  },
  cardFly() {
    play([{ wave: 'noise', freq: 2.5, to: 1, dur: 0.12, vol: 0.08, hp: 1800, attack: 0.02 }]);
  },
  flip(tier = 0) {
    play([{ wave: 'noise', freq: 3, to: 1.4, dur: 0.1, vol: 0.12, hp: 1400 }]);
    if (tier >= 2) play([{ wave: 'triangle', freq: [0, 0, 1047, 1319, 1568][tier], dur: 0.5, vol: 0.1, delay: 0.06, vib: 8 }]);
    if (tier >= 3) play([{ wave: 'square', freq: 2093, dur: 0.6, vol: 0.05, delay: 0.14, vib: 12 }]);
  },
  tap() {
    sfx('click');
  },
};
