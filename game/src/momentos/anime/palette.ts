/**
 * PALETTES — the Momentos' limited color scripts (style guide: docs/part-ii/29 §3).
 *
 * Every section of a song gets ONE palette of 6 colors + a sky ramp + a sea ramp + a post grade. The world, the FX and
 * the ink all draw from the palette that is live, so a section reads at a glance: muted verse, saturated drop,
 * near-monochrome break. Switching palettes blends over a fraction of a beat (paletteAt).
 *
 * Ink is never pure black: it is the palette's deepest color (colored lineart), which is what separates the Momentos
 * from the game's black-ink paper look.
 */
import type { Key } from '../types';

export interface Palette {
  name: string;
  /** line art + deepest shadow */
  ink: number;
  /** cel shadow tone */
  shadow: number;
  /** main mid tone */
  base: number;
  /** cel light tone */
  light: number;
  /** the section's signature accent (FX, type, rim light) */
  accent: number;
  /** secondary accent */
  accent2: number;
  /** sky ramp, top → horizon (hard bands, never a smooth gradient) */
  sky: number[];
  /** sea ramp, horizon → bottom */
  sea: number[];
  /** post grade: shadows pulled toward `shade`, lights toward `glow`; sat multiplier; halftone strength 0..1 */
  grade: { shade: number; glow: number; sat: number; tone: number; vignette: number };
}

export const PALETTES: Record<string, Palette> = {
  /** cold open: almost no color, one magenta accent waiting */
  noir: {
    name: 'noir',
    ink: 0x0b0716,
    shadow: 0x1c1830,
    base: 0x3a3550,
    light: 0xd9d4e8,
    accent: 0xff2e88,
    accent2: 0x00e5ff,
    // the night before the party: almost black, and the party colors will be the only color on screen
    sky: [0x06040d, 0x0a0715, 0x0f0b1e, 0x151028, 0x1c1633],
    sea: [0x14102a, 0x0e0b1f, 0x080614],
    grade: { shade: 0x0b0716, glow: 0xe8e0ff, sat: 0.7, tone: 0.55, vignette: 0.55 },
  },
  /** the party wakes up: night neon */
  neon: {
    name: 'neon',
    ink: 0x150a33,
    shadow: 0x3b1a6b,
    base: 0x6a2fb0,
    light: 0xffd6f5,
    accent: 0xff2e88,
    accent2: 0x00e5ff,
    sky: [0x120838, 0x1d0b4f, 0x2c0f66, 0x47137a, 0x6a1a86],
    sea: [0x2a0f5c, 0x1b0a43, 0x10062b],
    grade: { shade: 0x22094f, glow: 0xfff0fb, sat: 1.15, tone: 0.25, vignette: 0.45 },
  },
  /** verse: muted dusk (teal sea, violet sky, amber lanterns) */
  dusk: {
    name: 'dusk',
    ink: 0x14213a,
    shadow: 0x2f4a66,
    base: 0x5c7c96,
    light: 0xf6d7b0,
    accent: 0xffa53d,
    accent2: 0xff6fae,
    sky: [0x2b2a5e, 0x4a3f7a, 0x7a5a8e, 0xb7798e, 0xf0a77e],
    sea: [0x2d6b78, 0x1f4f61, 0x153748],
    grade: { shade: 0x1c2b4a, glow: 0xffe6c4, sat: 0.85, tone: 0.3, vignette: 0.4 },
  },
  /** prechorus: tension rising — teal into hot magenta */
  rise: {
    name: 'rise',
    ink: 0x1a0c2e,
    shadow: 0x46205e,
    base: 0x8a2f7d,
    light: 0xffe0f0,
    accent: 0xffe14a,
    accent2: 0xff2e88,
    sky: [0x241047, 0x4a1563, 0x7d1d6f, 0xc12f6c, 0xff6b5e],
    sea: [0x3a1a5a, 0x271042, 0x170829],
    grade: { shade: 0x2a0b3d, glow: 0xfff3d6, sat: 1.1, tone: 0.2, vignette: 0.45 },
  },
  /** the drop: full saturation — hot pink, electric yellow, cyan on deep indigo */
  drop: {
    name: 'drop',
    ink: 0x120b2e,
    shadow: 0x2e1d78,
    base: 0xff2e88,
    light: 0xfff7d6,
    accent: 0xffe14a,
    accent2: 0x00e5ff,
    sky: [0x1a0f5c, 0x3a1a9e, 0x7a1fc4, 0xd62f9a, 0xffb347],
    sea: [0x2b2a9e, 0x1c1a74, 0x110f4a],
    grade: { shade: 0x1b0f55, glow: 0xffffff, sat: 1.3, tone: 0.12, vignette: 0.35 },
  },
  /** break: moonlit near-monochrome lilac — she recovers */
  moon: {
    name: 'moon',
    ink: 0x2a2140,
    shadow: 0x6b5f8f,
    base: 0xa99cc7,
    light: 0xf4efff,
    accent: 0xff9ecf,
    accent2: 0xbfe9ff,
    sky: [0x3d3460, 0x544a7c, 0x6e6496, 0x8c82b0, 0xb3a9cf],
    sea: [0x5b5184, 0x463d6b, 0x322a52],
    grade: { shade: 0x3a3060, glow: 0xfaf6ff, sat: 0.75, tone: 0.5, vignette: 0.35 },
  },
  /** the sky chase: sunset orange + teal */
  chase: {
    name: 'chase',
    ink: 0x10213a,
    shadow: 0x1f5f7a,
    base: 0x2fb3c4,
    light: 0xfff4dc,
    accent: 0xff8a1f,
    accent2: 0xffe14a,
    sky: [0x1f6fb0, 0x3f95cf, 0x7ab8e0, 0xffc58a, 0xff8a4f],
    sea: [0xf6e7d6, 0xe4cdb8, 0xc9ab95],
    grade: { shade: 0x123049, glow: 0xfff6e2, sat: 1.15, tone: 0.15, vignette: 0.3 },
  },
  /** break2: the standoff — monochrome ink + gold */
  gold: {
    name: 'gold',
    ink: 0x14100c,
    shadow: 0x3d342a,
    base: 0x7d705f,
    light: 0xfff4e0,
    accent: 0xffc23a,
    accent2: 0xfff4e0,
    sky: [0x231d17, 0x3a3027, 0x5a4b3b, 0x8a7254, 0xd7a85a],
    sea: [0x5a4b3b, 0x3a3027, 0x231d17],
    grade: { shade: 0x1d1712, glow: 0xfff1d2, sat: 0.12, tone: 0.7, vignette: 0.5 },
  },
  /** above the clouds at night: deep blue + violet, stars, the party's neon on top */
  stratos: {
    name: 'stratos',
    ink: 0x0a0b2a,
    shadow: 0x1d2468,
    base: 0x3a46b8,
    light: 0xe6ecff,
    accent: 0xff4fd8,
    accent2: 0x5cf2ff,
    sky: [0x05061c, 0x0b0f36, 0x141c58, 0x23307e, 0x3b4aa8],
    sea: [0x2a3a8e, 0x1d2a6e, 0x131c4c],
    grade: { shade: 0x0a0b2a, glow: 0xf2f4ff, sat: 1.1, tone: 0.3, vignette: 0.5 },
  },
  /** dawn after the long night: rose, peach and gold, tired and warm */
  dawn: {
    name: 'dawn',
    ink: 0x2a1430,
    shadow: 0x7a3a6a,
    base: 0xd8708a,
    light: 0xfff2e2,
    accent: 0xffb347,
    accent2: 0x9fe6ff,
    sky: [0x3a2a6a, 0x8a4a8a, 0xd8708a, 0xffa27a, 0xffd59a],
    sea: [0xf2d9c8, 0xe6bfae, 0xc89a8e],
    grade: { shade: 0x2a1430, glow: 0xfff6e8, sat: 1.0, tone: 0.2, vignette: 0.35 },
  },
  /** the finale: everything, white-hot */
  finale: {
    name: 'finale',
    ink: 0x1a0626,
    shadow: 0x5a1270,
    base: 0xff3d7f,
    light: 0xffffff,
    accent: 0xffe14a,
    accent2: 0x3df2ff,
    sky: [0x2a0a5e, 0x5a12a0, 0xa318b8, 0xff3d7f, 0xffd24a],
    sea: [0x3a1a8e, 0x26106a, 0x160944],
    grade: { shade: 0x2a0840, glow: 0xffffff, sat: 1.35, tone: 0.1, vignette: 0.3 },
  },
};

export const lerpColor = (a: number, b: number, k: number) => {
  const t = Math.max(0, Math.min(1, k));
  const r = ((a >> 16) & 255) + ((((b >> 16) & 255) - ((a >> 16) & 255)) * t);
  const g = ((a >> 8) & 255) + ((((b >> 8) & 255) - ((a >> 8) & 255)) * t);
  const bl = (a & 255) + (((b & 255) - (a & 255)) * t);
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
};
export const shade = (c: number, k: number) => lerpColor(c, k < 0 ? 0x000000 : 0xffffff, Math.abs(k));

function mixRamp(a: number[], b: number[], k: number) {
  const n = Math.max(a.length, b.length);
  return Array.from({ length: n }, (_, i) => lerpColor(a[Math.min(i, a.length - 1)], b[Math.min(i, b.length - 1)], k));
}
export function mixPalette(a: Palette, b: Palette, k: number): Palette {
  if (k <= 0) return a;
  if (k >= 1) return b;
  const L = (x: number, y: number) => lerpColor(x, y, k);
  const n = (x: number, y: number) => x + (y - x) * k;
  return {
    name: k < 0.5 ? a.name : b.name,
    ink: L(a.ink, b.ink),
    shadow: L(a.shadow, b.shadow),
    base: L(a.base, b.base),
    light: L(a.light, b.light),
    accent: L(a.accent, b.accent),
    accent2: L(a.accent2, b.accent2),
    sky: mixRamp(a.sky, b.sky, k),
    sea: mixRamp(a.sea, b.sea, k),
    grade: { shade: L(a.grade.shade, b.grade.shade), glow: L(a.grade.glow, b.grade.glow), sat: n(a.grade.sat, b.grade.sat), tone: n(a.grade.tone, b.grade.tone), vignette: n(a.grade.vignette, b.grade.vignette) },
  };
}

/**
 * The palette live at momento time m from the 'pal' key track (string values = palette names; a key's `dur` is its
 * blend time, default 0.3 s). `extra` = a stage's own palettes.
 */
export function paletteAt(keys: Key[] | undefined, m: number, dflt: string, extra: Record<string, Palette> = {}): Palette {
  const get = (n: string | number) => extra[String(n)] ?? PALETTES[String(n)] ?? PALETTES[dflt] ?? PALETTES.neon;
  if (!keys?.length) return get(dflt);
  let prev: string | number = dflt;
  let cur: Key | null = null;
  for (const k of keys) {
    if (k.m > m + 1e-9) break;
    if (cur) prev = cur.value;
    cur = k;
  }
  if (!cur) return get(dflt);
  const blend = cur.dur > 0 ? cur.dur : 0.3;
  return mixPalette(get(prev), get(cur.value), (m - cur.m) / blend);
}
