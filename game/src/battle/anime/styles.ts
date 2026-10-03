/**
 * Parametric skins for the anime/cartoon ship renderer.
 * Every color the painter uses lives here, so a new skin is just a new entry in STYLES.
 */
export type ShipStyleId = 'pirate' | 'rat' | 'cosmic';

export type EmblemKind = 'catSkull' | 'ratSkull' | 'crescent';

export interface Tone {
  base: number;
  shadow: number;
  light: number;
}

export interface ShipStyle {
  id: ShipStyleId;
  ink: number;
  /** hull paint (above waterline) */
  hull: Tone & { deep: number; plank: number };
  /** paint below the waterline + boot stripe */
  bottom: number;
  stripe: number;
  /** gunwale / moldings / frames */
  trim: Tone;
  /** cannons, rivets, iron plates */
  metal: Tone;
  /** mast poles, yards, barrels */
  wood: Tone;
  /** what you see through holes */
  interior: { base: number; rib: number; shade: number };
  cabin: { wall: number; wallShadow: number; roof: number; roofShadow: number; door: number };
  window: { glass: number; glow: number };
  sail: Tone & { stitch: number; emblem: number; emblemShade: number; ragged: boolean; patches: boolean };
  flag: { base: number; shadow: number; emblem: number };
  emblem: EmblemKind;
  /** core orb + muzzle glow */
  core: { base: number; light: number; glow: number };
  muzzle: number;
  crystal: Tone;
  /** neon strips (cosmic). empty = none */
  neon: number[];
  /** hull built from plates instead of planks */
  panels: boolean;
  /** random patches + grime (rat) */
  grime: number;
  /** anchor / ornaments rust spots */
  rust: boolean;
}

export const STYLES: Record<ShipStyleId, ShipStyle> = {
  /** Captain Yo-Ho: royal blue/violet hull, gold trims, purple sails with a gold cat-skull. */
  pirate: {
    id: 'pirate',
    ink: 0x171317,
    hull: { base: 0x4250c4, shadow: 0x2d2f8c, deep: 0x1f1c5c, light: 0x7186ef, plank: 0x262a78 },
    bottom: 0x2a1d63,
    stripe: 0xf4ead8,
    trim: { base: 0xf5b43a, shadow: 0xb8701e, light: 0xffe38f },
    metal: { base: 0x30344a, shadow: 0x1b1d2b, light: 0x6d7699 },
    wood: { base: 0xa8683a, shadow: 0x6e3f22, light: 0xd8955a },
    interior: { base: 0x1a1230, rib: 0x2f2350, shade: 0x0c0818 },
    cabin: { wall: 0x5b6fe0, wallShadow: 0x3a45a8, roof: 0x7a2f8f, roofShadow: 0x4d1c5e, door: 0x2a1d63 },
    window: { glass: 0x1a2350, glow: 0xffcf5a },
    sail: { base: 0x5d68d6, shadow: 0x3d3f9e, light: 0x8e9cf2, stitch: 0x2f3286, emblem: 0xf5b43a, emblemShade: 0xb8701e, ragged: false, patches: false },
    flag: { base: 0x22203a, shadow: 0x121022, emblem: 0xf4ead8 },
    emblem: 'catSkull',
    core: { base: 0xff2e88, light: 0xffb3d6, glow: 0xff5aa8 },
    muzzle: 0xff8a1a,
    crystal: { base: 0x7fe3ff, shadow: 0x2f8fc0, light: 0xe6fbff },
    neon: [],
    panels: false,
    grime: 0,
    rust: true,
  },
  /** Rat pirates: dirty brown wood, patches, rusty iron, cream sails with a rat skull. */
  rat: {
    id: 'rat',
    ink: 0x1a1210,
    hull: { base: 0x8a5732, shadow: 0x5c3519, deep: 0x3b2010, light: 0xb67b48, plank: 0x4a2a14 },
    bottom: 0x3d4a2c,
    stripe: 0x9b9a7c,
    trim: { base: 0x8f8a70, shadow: 0x5a5644, light: 0xc4bd9a },
    metal: { base: 0x5a524c, shadow: 0x342e2a, light: 0x8d837a },
    wood: { base: 0x7a5232, shadow: 0x4c3019, light: 0xa77445 },
    interior: { base: 0x1d140d, rib: 0x372617, shade: 0x0d0805 },
    cabin: { wall: 0xa3784a, wallShadow: 0x6f4d2b, roof: 0x4f5a3a, roofShadow: 0x323a24, door: 0x2c1d10 },
    window: { glass: 0x232a20, glow: 0xd8ff6a },
    sail: { base: 0xd9cba2, shadow: 0xa8996f, light: 0xf2e8c8, stitch: 0x7d6f4b, emblem: 0x221a16, emblemShade: 0x4a3a30, ragged: true, patches: true },
    flag: { base: 0x221a16, shadow: 0x100c0a, emblem: 0xe9dfc0 },
    emblem: 'ratSkull',
    core: { base: 0x9cff3a, light: 0xe6ffb0, glow: 0x7dff2a },
    muzzle: 0xffb21a,
    crystal: { base: 0xa8ff7a, shadow: 0x4f9a3a, light: 0xf0ffe0 },
    neon: [],
    panels: false,
    grime: 1,
    rust: true,
  },
  /** Celestial ship: dark armored hull, neon magenta/cyan/orange, torn red sails. */
  cosmic: {
    id: 'cosmic',
    ink: 0x07050b,
    hull: { base: 0x352a48, shadow: 0x1e1729, deep: 0x110c19, light: 0x5a4b78, plank: 0x150f1e },
    bottom: 0x1a1024,
    stripe: 0xff2e88,
    trim: { base: 0x6a5a86, shadow: 0x3a2f4e, light: 0xa898c8 },
    metal: { base: 0x2a2436, shadow: 0x15111d, light: 0x5c5174 },
    wood: { base: 0x3a3048, shadow: 0x221b2c, light: 0x5e4f74 },
    interior: { base: 0x0b0812, rib: 0x241a34, shade: 0x050308 },
    cabin: { wall: 0x2f2640, wallShadow: 0x1b1526, roof: 0x4a2a5e, roofShadow: 0x2a173a, door: 0x0e0a16 },
    window: { glass: 0x10182a, glow: 0x00e5ff },
    sail: { base: 0xb8163e, shadow: 0x6e0a26, light: 0xe8406a, stitch: 0x4a0618, emblem: 0x00e5ff, emblemShade: 0x0088aa, ragged: true, patches: false },
    flag: { base: 0xff2e88, shadow: 0x9a0f50, emblem: 0x0d0a14 },
    emblem: 'crescent',
    core: { base: 0x00e5ff, light: 0xc8fbff, glow: 0x3af0ff },
    muzzle: 0xff6a1a,
    crystal: { base: 0xff5ad0, shadow: 0x8a1f7a, light: 0xffd6f4 },
    neon: [0xff2e88, 0x00e5ff, 0xff8a2a],
    panels: true,
    grime: 0,
    rust: false,
  },
};

export function getStyle(id: ShipStyleId | undefined): ShipStyle {
  return STYLES[id ?? 'pirate'] ?? STYLES.pirate;
}
