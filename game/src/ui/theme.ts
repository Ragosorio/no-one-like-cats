/** Palette & type system from research/10-direccion-de-arte.md */
export const C = {
  paper: 0xede4d6,
  paperDark: 0xd9cdb8,
  linen: 0xeae1d3,
  ink: 0x171317,
  inkBlue: 0x1f2b4a,
  pink: 0xe8879a,
  pinkHot: 0xff2e88,
  red: 0xc8102e,
  inferno: 0x4e0000,
  orange: 0xff6a1a,
  yellow: 0xffc94a,
  gold: 0xb89558,
  mint: 0xa7e8d7,
  mintLight: 0xc6f0e4,
  plum: 0x5c3d5b,
  plumInk: 0x231626,
  orchid: 0x8f6b93,
  lilac: 0xb7a4c7,
  chaos: 0x0d110f,
  oceanNoir: 0x172b35,
  river: 0x1c3a51,
  theatre: 0x204a7a,
  megaBlue: 0x3569a3,
  cyan: 0x00e5ff,
  violet: 0x8a5cff,
  olive: 0x4f5a45,
  white: 0xffffff,
  green: 0x3fae6a,
} as const;

export const F = {
  poster: 'Anton',
  bebas: 'Bebas Neue',
  comic: 'Bangers',
  heavy: 'Dela Gothic One',
  brush: 'Permanent Marker',
  news: 'UnifrakturMaguntia',
  serif: 'Playfair Display',
  glitch: 'Rubik Glitch',
  ui: 'Space Grotesk',
} as const;

export const RARITY = {
  common: { name: 'COMÚN', color: 0x9a8f80, glow: 0xd9cdb8 },
  rare: { name: 'RARO', color: 0x3569a3, glow: 0x6fa8ff },
  epic: { name: 'ÉPICO', color: 0xff2e88, glow: 0xff7ab8 },
  legendary: { name: 'LEGENDARIO', color: 0xb89558, glow: 0xffd77a },
  mythic: { name: 'MÍTICO', color: 0x8a5cff, glow: 0x00e5ff },
  primordial: { name: 'PRIMORDIAL', color: 0x171317, glow: 0xff2e88 },
} as const;
export type Rarity = keyof typeof RARITY;
