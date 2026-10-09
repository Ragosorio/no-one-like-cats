/**
 * Small deterministic noise kit (AgentGameEngine `core/noise`): seeded hash, value noise, fbm.
 * Pure functions — the same island is generated on every machine and in tests.
 */

export function hash2(x: number, y: number, seed = 0) {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263 + seed * 2147483647;
  h = (h ^ (h >>> 13)) * 1274126177;
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** smooth value noise in [0,1] */
export function vnoise(x: number, y: number, seed = 0) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  const u = fade(xf);
  const v = fade(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** fractal value noise in roughly [-1,1] */
export function fbm(x: number, y: number, oct = 4, seed = 0) {
  let amp = 0.5;
  let f = 1;
  let s = 0;
  let norm = 0;
  for (let i = 0; i < oct; i++) {
    s += (vnoise(x * f, y * f, seed + i * 17) * 2 - 1) * amp;
    norm += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return s / norm;
}

/** mulberry32: tiny seeded PRNG for scattering */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
