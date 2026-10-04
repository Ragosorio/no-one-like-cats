/**
 * Island "dimensions" (Spider-Verse multiverse): every expansion keeps the cozy anime grammar
 * (ink outlines, flat colour, halftone) but lives in its own style dimension with its own palette,
 * terrain pattern, floating-rock underside, falls, sky and animation.
 */
export type DimId = 'home' | 'forest' | 'cliff' | 'volcano' | 'ghost' | 'ice' | 'ruins' | 'reef' | 'cosmic';

export type PatternKind = 'grass' | 'lush' | 'hatch' | 'lava' | 'neon' | 'crystal' | 'pixel' | 'caustic' | 'stars';
export type FallKind = 'water' | 'lava' | 'ink' | 'data' | 'neon' | 'ice' | 'prism' | 'stars';
export type SpikeKind = 'round' | 'jagged' | 'crystal' | 'pixel' | 'city';

export interface DimDef {
  id: DimId;
  /** big label ("DIMENSIÓN INFERNO") */
  name: string;
  short: string;
  // ---- land (iso tiles)
  top: number;
  topAlt: number;
  beach: number;
  side: number;
  sideDark: number;
  tuft: number;
  /** outline colour for land / rock (ink) */
  ink: number;
  /** thin strata line on the shore cliffs */
  strata: number;
  pattern: PatternKind;
  /** pattern frames (boil) — 1 = static */
  patternFrames: number;
  /** pattern overlay alpha */
  patternAlpha: number;
  // ---- lagoon held by the floating plate
  lagoon: { a: number; b: number; foam: number; rim: number; rimDark: number };
  // ---- floating rock underside
  rock: { light: number; dark: number; line: number; accent: number };
  spikes: SpikeKind;
  /** underside depth multiplier */
  depth: number;
  fall: { kind: FallKind; color: number; core: number; count: number };
  /** accent for dimension labels / glows */
  accent: number;
  /** void tint near this island (backdrop key colour) */
  skyKey: number;
}

const D: Record<DimId, DimDef> = {
  // COZY ISLA — Ghibli greens, warm cliffs, sunbeams
  home: {
    id: 'home',
    name: 'COZY ISLA',
    short: 'COZY',
    top: 0xa6cf7e,
    topAlt: 0x99c472,
    beach: 0xf2dca8,
    side: 0xd29a5c,
    sideDark: 0x9a6334,
    tuft: 0x6f9e4f,
    ink: 0x171317,
    strata: 0x171317,
    pattern: 'grass',
    patternFrames: 1,
    patternAlpha: 1,
    lagoon: { a: 0x7fd8e4, b: 0x3f9ccc, foam: 0xffffff, rim: 0xc48a52, rimDark: 0x8a5a30 },
    rock: { light: 0xb98250, dark: 0x7a4c2a, line: 0x4a2c16, accent: 0x6fae4f },
    spikes: 'round',
    depth: 1.05,
    fall: { kind: 'water', color: 0x9fe3f2, core: 0xffffff, count: 3 },
    accent: 0xffc94a,
    skyKey: 0x8fd3f2,
  },
  // VALLE ANIME — exuberant crater valley, lakes, rainbow, fireflies
  forest: {
    id: 'forest',
    name: 'DIMENSIÓN VALLE',
    short: 'VALLE',
    top: 0x62b84c,
    topAlt: 0x57ab43,
    beach: 0xbfe08a,
    side: 0x6e6a4c,
    sideDark: 0x444232,
    tuft: 0x2c7a34,
    ink: 0x14201a,
    strata: 0x14201a,
    pattern: 'lush',
    patternFrames: 1,
    patternAlpha: 1,
    lagoon: { a: 0x5cc8f0, b: 0x2378c4, foam: 0xffffff, rim: 0x6a6e56, rimDark: 0x3e4234 },
    rock: { light: 0x6c7a62, dark: 0x3a4436, line: 0x1c241c, accent: 0x49a03e },
    spikes: 'jagged',
    depth: 1.25,
    fall: { kind: 'water', color: 0xb5ecff, core: 0xffffff, count: 4 },
    accent: 0xd4f27a,
    skyKey: 0x4fb2ef,
  },
  // DIMENSIÓN TINTA — ink & pencil that boils; white lines on black underneath
  cliff: {
    id: 'cliff',
    name: 'DIMENSIÓN TINTA',
    short: 'TINTA',
    top: 0xf3eee3,
    topAlt: 0xe8e2d5,
    beach: 0xfaf7f0,
    side: 0x1c181c,
    sideDark: 0x0e0c0e,
    tuft: 0x171317,
    ink: 0x0b090b,
    strata: 0xf3eee3,
    pattern: 'hatch',
    patternFrames: 3,
    patternAlpha: 1,
    lagoon: { a: 0x1a171a, b: 0x0b090b, foam: 0xf3eee3, rim: 0x2a262a, rimDark: 0x0b090b },
    rock: { light: 0x221e22, dark: 0x0b090b, line: 0xf3eee3, accent: 0xf3eee3 },
    spikes: 'jagged',
    depth: 1.15,
    fall: { kind: 'ink', color: 0xf3eee3, core: 0xffffff, count: 2 },
    accent: 0xf3eee3,
    skyKey: 0x171317,
  },
  // DIMENSIÓN INFERNO — red sky, giant sun, lava rivers, embers, banners
  volcano: {
    id: 'volcano',
    name: 'DIMENSIÓN INFERNO',
    short: 'INFERNO',
    top: 0x3b2424,
    topAlt: 0x331f1f,
    beach: 0x2a1a1a,
    side: 0x5e1308,
    sideDark: 0x2a0806,
    tuft: 0xff6a1a,
    ink: 0x120404,
    strata: 0xff6a1a,
    pattern: 'lava',
    patternFrames: 1,
    patternAlpha: 1,
    lagoon: { a: 0xff7a1a, b: 0xc8102e, foam: 0xffd76a, rim: 0x3a1410, rimDark: 0x1a0504 },
    rock: { light: 0x4a1610, dark: 0x1c0605, line: 0xff6a1a, accent: 0xffc94a },
    spikes: 'jagged',
    depth: 1.2,
    fall: { kind: 'lava', color: 0xff6a1a, core: 0xffd76a, count: 3 },
    accent: 0xff6a1a,
    skyKey: 0xc8102e,
  },
  // NEÓN NOIR — floating city lights, spectral fog, flickering neon
  ghost: {
    id: 'ghost',
    name: 'DIMENSIÓN NEÓN NOIR',
    short: 'NEÓN',
    top: 0x2c3448,
    topAlt: 0x262e41,
    beach: 0x3a4259,
    side: 0x1a2032,
    sideDark: 0x0d111d,
    tuft: 0x00e5ff,
    ink: 0x05070d,
    strata: 0xff2e88,
    pattern: 'neon',
    patternFrames: 1,
    patternAlpha: 1,
    lagoon: { a: 0x1c3a51, b: 0x0d1a26, foam: 0x7ff3ff, rim: 0x232b3e, rimDark: 0x0d111d },
    rock: { light: 0x1c2336, dark: 0x0a0d17, line: 0xffd76a, accent: 0xff2e88 },
    spikes: 'city',
    depth: 1.35,
    fall: { kind: 'neon', color: 0x00e5ff, core: 0xffffff, count: 4 },
    accent: 0x00e5ff,
    skyKey: 0x3a2a6a,
  },
  // CRISTAL Y AURORA — snow, faceted ice, aurora ribbons
  ice: {
    id: 'ice',
    name: 'DIMENSIÓN AURORA',
    short: 'AURORA',
    top: 0xf2fafd,
    topAlt: 0xe2f1f8,
    beach: 0xffffff,
    side: 0x8cc8e2,
    sideDark: 0x4a80b4,
    tuft: 0x9fd2e8,
    ink: 0x14223a,
    strata: 0xffffff,
    pattern: 'crystal',
    patternFrames: 1,
    patternAlpha: 1,
    lagoon: { a: 0xaeeaf6, b: 0x5fb4dc, foam: 0xffffff, rim: 0x9ad2ea, rimDark: 0x5a8fc0 },
    rock: { light: 0x8fd0ee, dark: 0x3a6aa8, line: 0xffffff, accent: 0xc8f4ff },
    spikes: 'crystal',
    depth: 1.1,
    fall: { kind: 'ice', color: 0xd8f6ff, core: 0xffffff, count: 2 },
    accent: 0x7cffc4,
    skyKey: 0x1f3a6a,
  },
  // DIMENSIÓN GLITCH — chromatic aberration, scanlines, psychedelic eye
  ruins: {
    id: 'ruins',
    name: 'DIMENSIÓN GLITCH',
    short: 'GLITCH',
    top: 0x3e2b60,
    topAlt: 0x362554,
    beach: 0x55447a,
    side: 0x24173a,
    sideDark: 0x0f0818,
    tuft: 0x00e5ff,
    ink: 0x07040c,
    strata: 0xff2e88,
    pattern: 'pixel',
    patternFrames: 2,
    patternAlpha: 1,
    lagoon: { a: 0x0d110f, b: 0x05060a, foam: 0x00e5ff, rim: 0x2a1c40, rimDark: 0x0f0818 },
    rock: { light: 0x281a40, dark: 0x0b0612, line: 0x00e5ff, accent: 0xff2e88 },
    spikes: 'pixel',
    depth: 1.25,
    fall: { kind: 'data', color: 0x00e5ff, core: 0xff2e88, count: 3 },
    accent: 0xff2e88,
    skyKey: 0x2a2aff,
  },
  // PRISMÁTICO — pastel coral, caustics, rainbow refractions, bubbles
  reef: {
    id: 'reef',
    name: 'DIMENSIÓN PRISMA',
    short: 'PRISMA',
    top: 0xf7b2c8,
    topAlt: 0xeac2dc,
    beach: 0xfff1e0,
    side: 0x3d8c9e,
    sideDark: 0x1c3a51,
    tuft: 0xff7ab8,
    ink: 0x10243a,
    strata: 0xffffff,
    pattern: 'caustic',
    patternFrames: 2,
    patternAlpha: 1,
    lagoon: { a: 0x8ff0e6, b: 0x2fb4c8, foam: 0xffffff, rim: 0x3d8c9e, rimDark: 0x1c3a51 },
    rock: { light: 0x3d8c9e, dark: 0x173550, line: 0xff9ac8, accent: 0xffd0e6 },
    spikes: 'round',
    depth: 1.1,
    fall: { kind: 'prism', color: 0xbff8ff, core: 0xffffff, count: 3 },
    accent: 0xff7ab8,
    skyKey: 0x7fe0ff,
  },
  // CÓSMICA — nebula, constellations, orbiting shards, shooting stars
  cosmic: {
    id: 'cosmic',
    name: 'DIMENSIÓN ESTELAR',
    short: 'ESTELAR',
    top: 0x3a2a5c,
    topAlt: 0x33244f,
    beach: 0x5a3a80,
    side: 0x1a1030,
    sideDark: 0x0b0616,
    tuft: 0x8a5cff,
    ink: 0x05030a,
    strata: 0x8a5cff,
    pattern: 'stars',
    patternFrames: 1,
    patternAlpha: 1,
    lagoon: { a: 0x2a1650, b: 0x0d0620, foam: 0xc8b4ff, rim: 0x231638, rimDark: 0x0b0616 },
    rock: { light: 0x24163c, dark: 0x090512, line: 0x8a5cff, accent: 0x00e5ff },
    spikes: 'crystal',
    depth: 1.3,
    fall: { kind: 'stars', color: 0xb9a4ff, core: 0xffffff, count: 2 },
    accent: 0x8a5cff,
    skyKey: 0x24124a,
  },
};

export const DIMS = D;

export function dimOf(biome: string | undefined): DimDef {
  return (biome && (D as Record<string, DimDef>)[biome]) || D.home;
}

/** paper veil palette for sealed dimensions */
export const VEIL = { top: 0xe9dfcc, topAlt: 0xe1d5bf, side: 0xc4b392, sideDark: 0x9c8b6c, rock: 0xd6c8ac, rockDark: 0xa8977a };
