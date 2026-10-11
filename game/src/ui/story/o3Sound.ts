/**
 * Parte II · Oleada 3 «La Era Astral» — the little motifs its scenes play (docs/part-ii/18 §6 · §9), added to the scene
 * sound layer (src/cine/sound.ts MOTIFS) so `stingerOr('canelo_astral')` plays the declared stinger the day a recording
 * exists and this procedural idea until then. Never a song: the six originals are reserved for the Momentos musicales
 * (owner, 2026-10-10); the scenes use variations, `amb.*`, director states and these motifs.
 *
 *   canelo_astral     H53: LIKY FIGHT's cell (Re–Si♭–Sol) in celesta, then it climbs and opens — the seal is gone
 *   titiriteros       H54: Si♭ lydian (Si♭–Do–Re–Mi) on a harp, glass harmonics — «a hospital», luminous
 *   arco_dos          H56: only Si♭–Do of the arc cell, soft piano, unresolved (the question stays open)
 *   leviatan_gracias  H57: a low whale glissando in Fa minor, then the arc cell in a horn (Si♭–Do–Re♭)
 *   cascabel          H54: Maneki's bell (bright partials, a little shake)
 *   latido            H53: the seal breathing with Canelo's purr (a soft low thump)
 *   chunk             H51: a rubber stamp that shakes the pier
 *   clank             H50: a wrench on a hull
 *   spray             H55: an aerosol can
 *   remolque          H52: the tug's cable humming (a low beating hum)
 */
import type { Voice } from '../../core/audio';
import { MOTIFS } from '../../cine/sound';

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
/** celesta / music-box tine (same recipe family as cine/sound.ts) */
function tine(midi: number, at: number, o: { dur?: number; vol?: number; bright?: number; detune?: number } = {}): Voice[] {
  const f = hz(midi) * Math.pow(2, (o.detune ?? 0) / 1200);
  const vol = o.vol ?? 0.1;
  const dur = o.dur ?? 1.2;
  return [
    { wave: 'sine', freq: f, dur, vol, delay: at, attack: 0.004 },
    { wave: 'sine', freq: f * 4.01, dur: dur * 0.35, vol: vol * (o.bright ?? 0.22), delay: at, attack: 0.002 },
    { wave: 'triangle', freq: f * 2, dur: dur * 0.6, vol: vol * 0.18, delay: at, attack: 0.003 },
  ];
}
/** soft piano-ish note: a sine body + a quieter octave, slow-ish decay */
function piano(midi: number, at: number, dur = 3.2, vol = 0.1): Voice[] {
  const f = hz(midi);
  return [
    { wave: 'sine', freq: f, dur, vol, delay: at, attack: 0.008 },
    { wave: 'triangle', freq: f * 2, dur: dur * 0.5, vol: vol * 0.25, delay: at, attack: 0.006, lp: 2400 },
    { wave: 'sine', freq: f * 3, dur: dur * 0.25, vol: vol * 0.08, delay: at, attack: 0.004 },
  ];
}
/** a horn: a filtered triangle with a slow attack */
function horn(midi: number, at: number, dur = 1.6, vol = 0.09): Voice[] {
  const f = hz(midi);
  return [
    { wave: 'triangle', freq: f, dur, vol, delay: at, attack: 0.18, lp: 900, vib: 1.2 },
    { wave: 'sawtooth', freq: f, dur, vol: vol * 0.25, delay: at, attack: 0.25, lp: 600 },
  ];
}
/** harp pluck (bright attack, quick decay) */
function harp(midi: number, at: number, vol = 0.08): Voice[] {
  const f = hz(midi);
  return [
    { wave: 'triangle', freq: f, dur: 1.6, vol, delay: at, attack: 0.002 },
    { wave: 'sine', freq: f * 2, dur: 0.8, vol: vol * 0.3, delay: at, attack: 0.002 },
  ];
}

export const O3_MOTIFS: Record<string, () => Voice[]> = {
  canelo_astral: () => [
    ...tine(74, 0, { dur: 0.9 }),
    ...tine(70, 0.22, { dur: 0.9 }),
    ...tine(67, 0.44, { dur: 1.1 }),
    // …and it climbs past where it used to stop: the seal is gone
    ...tine(70, 0.9, { dur: 1, vol: 0.08 }),
    ...tine(74, 1.08, { dur: 1, vol: 0.08 }),
    ...tine(79, 1.26, { dur: 1.4, vol: 0.08 }),
    ...tine(86, 1.46, { dur: 2.4, vol: 0.06, bright: 0.4 }),
    { wave: 'sine', freq: hz(43), dur: 2.6, vol: 0.09, attack: 0.02, delay: 0.88 },
    { wave: 'noise', freq: 3, to: 6, dur: 1.6, vol: 0.03, delay: 0.88, hp: 5000, attack: 0.4 },
  ],
  titiriteros: () => [...harp(58, 0), ...harp(60, 0.16), ...harp(62, 0.32), ...harp(64, 0.48, 0.07), ...tine(82, 0.7, { dur: 2.6, vol: 0.04, bright: 0.6 }), ...tine(88, 0.9, { dur: 2.8, vol: 0.03, bright: 0.7 })],
  arco_dos: () => [...piano(58, 0, 3.4, 0.1), ...piano(60, 0.9, 4.2, 0.09)],
  leviatan_gracias: () => [
    { wave: 'sine', freq: hz(29), to: hz(36), dur: 2.4, vol: 0.13, attack: 0.5, vib: 0.8 },
    { wave: 'triangle', freq: hz(41), to: hz(48), dur: 2.4, vol: 0.05, attack: 0.6, lp: 500 },
    { wave: 'sine', freq: hz(36), to: hz(29), dur: 2.2, vol: 0.11, delay: 2.1, attack: 0.3, vib: 0.6 },
    ...horn(46, 2.4, 1.3),
    ...horn(48, 3.4, 1.3),
    ...horn(49, 4.4, 2.6, 0.1),
  ],
  cascabel: () =>
    [0, 0.07, 0.15, 0.21, 0.3].flatMap((t, i): Voice[] => [
      { wave: 'sine', freq: 2637 * (1 + i * 0.013), dur: 0.35, vol: 0.05, delay: t, attack: 0.002 },
      { wave: 'sine', freq: 3951 * (1 - i * 0.008), dur: 0.22, vol: 0.03, delay: t, attack: 0.002 },
    ]),
  latido: () => [
    { wave: 'sine', freq: 62, to: 44, dur: 0.32, vol: 0.12, attack: 0.01 },
    { wave: 'sine', freq: 58, to: 42, dur: 0.28, vol: 0.08, delay: 0.24, attack: 0.01 },
  ],
  chunk: () => [
    { wave: 'noise', freq: 1.2, to: 0.6, dur: 0.12, vol: 0.18, attack: 0.002, lp: 1800 },
    { wave: 'sine', freq: 90, to: 50, dur: 0.3, vol: 0.2, attack: 0.002 },
  ],
  clank: () => [
    { wave: 'square', freq: 1180, to: 1120, dur: 0.18, vol: 0.06, attack: 0.001, lp: 5000 },
    { wave: 'square', freq: 1745, dur: 0.12, vol: 0.04, attack: 0.001, lp: 6000 },
    { wave: 'sine', freq: 2390, dur: 0.5, vol: 0.04, attack: 0.001 },
    { wave: 'noise', freq: 2, dur: 0.06, vol: 0.08, attack: 0.001, hp: 2500 },
  ],
  spray: () => [{ wave: 'noise', freq: 3, to: 2.6, dur: 0.7, vol: 0.06, attack: 0.04, hp: 4200 }],
  remolque: () => [
    { wave: 'sawtooth', freq: 55, dur: 2.6, vol: 0.035, attack: 0.6, lp: 300, vib: 0.6 },
    { wave: 'sawtooth', freq: 55.8, dur: 2.6, vol: 0.035, attack: 0.6, lp: 300 },
  ],
};

let installed = false;
/** add the wave's motifs to the scene sound layer (idempotent) */
export function installO3Motifs() {
  if (installed) return;
  installed = true;
  for (const [k, f] of Object.entries(O3_MOTIFS)) if (!(k in MOTIFS)) MOTIFS[k] = f;
}
installO3Motifs();
