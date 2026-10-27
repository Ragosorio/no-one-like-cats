/**
 * ACTO III — pure timing helpers for the sets (no Pixi). Every set is a function of scene-local time `lt`.
 * Song clocks: No wey 74 BPM (bar 3.2432 s, c1 = 0), DISTOR 112 BPM (bar 2.1429 s; F25 starts at c25).
 */
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** smoothstep 0..1 */
export const sm = (x: number) => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** progress of lt through [a, b] (0..1) */
export const seg = (lt: number, a: number, b: number) => clamp01((lt - a) / Math.max(1e-6, b - a));
/** on between a and b with fades (0..1) */
export const env = (lt: number, a: number, b: number, fi = 0.3, fo = 0.3) => Math.min(sm((lt - a) / Math.max(1e-6, fi)), sm((b - lt) / Math.max(1e-6, fo)));
export const outBack = (x: number, s = 1.70158) => {
  const c = clamp01(x) - 1;
  return 1 + c * c * ((s + 1) * c + s);
};
export const outExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp01(x)));
export const outCubic = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const inCubic = (x: number) => Math.pow(clamp01(x), 3);
export const inOut = (x: number) => {
  const c = clamp01(x);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
/** a damped spring settle (0 → 1 with overshoot): paper that pops up and wobbles */
export const springIn = (x: number, f = 2.2, d = 5) => (x <= 0 ? 0 : 1 - Math.exp(-d * x) * Math.cos(f * Math.PI * x));
/** deterministic noise 0..1 */
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** smooth 1D noise −1..1 */
export const wob = (t: number, seed = 0) => {
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  return (rnd(i + seed * 17) * (1 - u) + rnd(i + 1 + seed * 17) * u) * 2 - 1;
};
/** on twos: a step key that changes 12 times a second */
export const twos = (lt: number) => Math.floor(lt * 12);
/** a short bounce on each beat (0..1, peaks at the beat) */
export const beatPulse = (lt: number, spb: number, phase = 0) => {
  const p = ((lt - phase) / spb) % 1;
  return p < 0 ? 0 : Math.exp(-p * 7);
};

// ------------------------------------------------------------------ the songs
/** No wey: bar n (1-based, fractional ok) → song seconds */
export const NW_BAR = 240 / 74;
export const nw = (bar: number) => (bar - 1) * NW_BAR;
/** No wey: one beat */
export const NW_BEAT = 60 / 74;
/** DISTOR: bar n → song seconds; F25 film time = song time − c25 */
export const DS_BAR = 240 / 112;
export const DS_BEAT = 60 / 112;
export const ds = (bar: number) => (bar - 1) * DS_BAR;
export const f25 = (bar: number) => (bar - 25) * DS_BAR;
