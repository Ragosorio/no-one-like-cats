/**
 * HEMKADE — the color script. Not NEÓN CEL's magenta/cyan party: an OCEAN that climbs into gold and then into the
 * stars. Teal/ultramarine + white foam + amber (the eye) at sea, bruised violet + white-cyan lightning in the storm,
 * cobalt + gold above the clouds, indigo + starlight in space. The breaks are copperplate PLATES (paper + ink pairs
 * below). No halftone anywhere (that is LIKY's manga screen): grade.tone stays 0.
 */
import type { Palette } from '../../anime/palette';

const g = (shade: number, glow: number, sat: number, vignette = 0.32) => ({ shade, glow, sat, tone: 0, vignette });

export const HEM_PALETTES: Record<string, Palette> = {
  /** the deep: night water, one amber light waiting */
  hAbyss: { name: 'hAbyss', ink: 0x061226, shadow: 0x0f2a45, base: 0x1d4a6b, light: 0xbfe6f0, accent: 0xffb02e, accent2: 0x6fe8ff, sky: [0x061226, 0x0a1c36, 0x10284a, 0x16385c, 0x1f4a6e], sea: [0x2f6f8f, 0x1d4a6b, 0x0f2a45], grade: g(0x061226, 0xd8f2ff, 0.8, 0.5) },
  /** the swell: dusk, a storm gathering over a rising sea */
  hSwell: { name: 'hSwell', ink: 0x101634, shadow: 0x2a3462, base: 0x4a6a9a, light: 0xffe2c0, accent: 0xffb02e, accent2: 0xff7a2a, sky: [0x1a1f4a, 0x343a72, 0x5e5688, 0xa87088, 0xf09a6a], sea: [0x3d7f9a, 0x285c78, 0x173a55], grade: g(0x141a3a, 0xffecd6, 0.95) },
  /** the breach: full day over a deep sea — ultramarine, teal, white foam, gold */
  hBreach: { name: 'hBreach', ink: 0x0a1a44, shadow: 0x173a7a, base: 0x2a6ad0, light: 0xffffff, accent: 0xffc21a, accent2: 0xff7a1a, sky: [0x1a4c9a, 0x2766c4, 0x4a90dc, 0x9ccdf2, 0xfff0c8], sea: [0x22a6c8, 0x1574a8, 0x0b3f78], grade: g(0x0a1a44, 0xffffff, 1.18, 0.28) },
  /** the storm: bruised violet, lightning white-cyan */
  hStorm: { name: 'hStorm', ink: 0x0c0a1e, shadow: 0x221c40, base: 0x4a3d70, light: 0xe8f6ff, accent: 0xd8f4ff, accent2: 0xffb21a, sky: [0x1a1638, 0x2a2450, 0x3c3468, 0x564a84, 0x7a6aa4], sea: [0x3a3d6a, 0x262a52, 0x171a38], grade: g(0x0c0a1e, 0xeaf6ff, 1.0, 0.45) },
  /** above the clouds: cobalt + gold, a white sun */
  hGilt: { name: 'hGilt', ink: 0x0c2050, shadow: 0x2a4f9a, base: 0x4f86d8, light: 0xffffff, accent: 0xffd23a, accent2: 0xff8a2a, sky: [0x1e4aa8, 0x3a74d0, 0x76aee8, 0xf2d79e, 0xffb45a], sea: [0xfff4e4, 0xf2d9c0, 0xd8b89e], grade: g(0x0c2050, 0xfffaf0, 1.15, 0.26) },
  /** leaving the air: indigo deepening, the first stars */
  hHigh: { name: 'hHigh', ink: 0x080a2a, shadow: 0x1a1f5a, base: 0x343c9a, light: 0xe8ecff, accent: 0xffd23a, accent2: 0x9fe8ff, sky: [0x05061e, 0x0c1240, 0x1a2468, 0x3a4690, 0x8a7ab0], sea: [0xe6e0f4, 0xc8c0e0, 0xa8a0c8], grade: g(0x080a2a, 0xf2f4ff, 1.05, 0.4) },
  /** the stars: deep violet, starlight, the rift's two colors */
  hAstral: { name: 'hAstral', ink: 0x07031c, shadow: 0x24125a, base: 0x5a2fb0, light: 0xfff6e0, accent: 0xfff0b0, accent2: 0x8ff6ff, sky: [0x04021a, 0x0a0632, 0x150c4c, 0x241466, 0x3a1f80], sea: [0x3a1f80, 0x241466, 0x150c4c], grade: g(0x07031c, 0xffffff, 1.2, 0.36) },
  /** the fall: back down to a sunset sea of clouds */
  hFall: { name: 'hFall', ink: 0x1a1434, shadow: 0x4a3a6a, base: 0x8a6f9a, light: 0xfff0dc, accent: 0xffb45a, accent2: 0x9fe6ff, sky: [0x24305e, 0x48508a, 0x8a6f9a, 0xe0907a, 0xffc48a], sea: [0xffe4d0, 0xf0c4b0, 0xd8a090], grade: g(0x1a1434, 0xfff2e0, 1.0) },
  /** the plates (breaks): sepia ink on cream — what the kit draws (type, cut-ins) reads as print */
  hPlate: { name: 'hPlate', ink: 0x2a2018, shadow: 0x6a5a48, base: 0xb8a68a, light: 0xf1e6cf, accent: 0xb8462a, accent2: 0x2a4a6a, sky: [0xf1e6cf, 0xf1e6cf, 0xf1e6cf, 0xf1e6cf, 0xf1e6cf], sea: [0xe6d8bc, 0xd8c8a8, 0xc8b490], grade: g(0x2a2018, 0xfff8ea, 0.7, 0.42) },
  /** the celestial atlas (break 3): gold lines on indigo */
  hAtlas: { name: 'hAtlas', ink: 0x0e1238, shadow: 0x2a2f6a, base: 0x4a4f9a, light: 0xffe6a8, accent: 0xffd27a, accent2: 0xbfe8ff, sky: [0x0e1238, 0x0e1238, 0x0e1238, 0x0e1238, 0x0e1238], sea: [0x1a1f4a, 0x141838, 0x0e1238], grade: g(0x0e1238, 0xfff2d0, 0.9, 0.45) },
};

/** paper / ink pairs of the plates (prop 'plate') */
export const PLATES: Record<string, [paper: number, ink: number]> = {
  sepia: [0xf1e6cf, 0x2a2018],
  gilt: [0xf6ead0, 0x3a2410],
  atlas: [0x0e1238, 0xffd27a],
};
