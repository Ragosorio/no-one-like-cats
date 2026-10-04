/**
 * Parametric skins for the anime/cartoon ship renderer.
 * Every color and every "feature switch" the painter uses lives here, so a new skin is just
 * a new entry in STYLES (GDD §2.8: hull skins by Mk + one look per enemy faction).
 */
export type ShipStyleId =
  // player hulls by Casco Mk
  | 'raft' // Mk1
  | 'sloop' // Mk2
  | 'pirate' // Mk3-4
  | 'coral' // Mk5
  | 'coral6' // Mk6 (gold-foil runes)
  | 'cosmic' // Mk7 (also Cometas Errantes, zone 5)
  // enemy factions
  | 'duck' // El Patito Pirata (tutorial 1-1)
  | 'rat' // Piratas de la Bahía Sardina (zone 1)
  | 'stone' // Guardia de Piedra (zone 2)
  | 'kraken' // Flota del Kraken (zone 3)
  | 'library' // Biblioteca Hundida (zone 4)
  | 'bone' // La Marea Sin Nombre (zone 6)
  | 'noctis' // Bandera Negra (event)
  | 'void'; // ??? (nave de NADIE)

export type EmblemKind = 'catSkull' | 'ratSkull' | 'crescent' | 'paw' | 'duck' | 'tower' | 'kraken' | 'book' | 'fishbone' | 'mask' | 'question';
export type HullPattern = 'planks' | 'panels' | 'logs' | 'varnish' | 'stone' | 'rubber' | 'bookshelf' | 'ribs' | 'lacquer' | 'coral' | 'static';
export type RailKind = 'rail' | 'crenel' | 'rope' | 'lace' | 'bone' | 'none';
export type FigureKind = 'none' | 'duck' | 'gargoyle' | 'mask' | 'skull';
export type ExtraKind = 'palm' | 'tesla' | 'tentacles' | 'books' | 'eyes' | 'fog' | 'glitch' | 'stars' | 'tail';
export type DebrisKind = 'wood' | 'stone' | 'iron' | 'paper' | 'bone' | 'feather' | 'glitch' | 'coral' | 'rubber';
export type SailDeco = 'none' | 'sock' | 'writing' | 'constellation' | 'lace';

export interface Tone {
  base: number;
  shadow: number;
  light: number;
}

export interface StyleFeatures {
  pattern: HullPattern;
  rail: RailKind;
  portholes: 'round' | 'glow' | 'slit' | 'none';
  anchor: boolean;
  lifeRing: boolean;
  scroll: boolean;
  waterStripe: boolean;
  bowsprit: boolean;
  figure: FigureKind;
  extras: ExtraKind[];
  debris: DebrisKind;
  sailDeco: SailDeco;
  cabinRoof: 'roof' | 'crenel' | 'thatch' | 'dome';
  /** extra wet/lacquer specular 0..1 */
  gloss: number;
  /** inner glow veins (coral) */
  glow: number | null;
  /** gold-foil runes (coral Mk6) */
  runes: boolean;
  /** holes show nothing (void) */
  noInterior: boolean;
  /** colored halo around the ink outline */
  outlineGlow: number | null;
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
  /** pattern accent (bone ribs, coral veins, lace, rope, moss…) */
  accent: Tone;
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
  /** hull built from plates instead of planks (legacy flag, see feat.pattern) */
  panels: boolean;
  /** random patches + grime (rat) */
  grime: number;
  /** anchor / ornaments rust spots */
  rust: boolean;
  feat: StyleFeatures;
}

const F = (f: Partial<StyleFeatures> = {}): StyleFeatures => ({
  pattern: 'planks',
  rail: 'rail',
  portholes: 'round',
  anchor: true,
  lifeRing: true,
  scroll: true,
  waterStripe: true,
  bowsprit: true,
  figure: 'none',
  extras: [],
  debris: 'wood',
  sailDeco: 'none',
  cabinRoof: 'roof',
  gloss: 0,
  glow: null,
  runes: false,
  noInterior: false,
  outlineGlow: null,
  ...f,
});

const pirate: ShipStyle = {
  id: 'pirate',
  ink: 0x171317,
  hull: { base: 0x4250c4, shadow: 0x2d2f8c, deep: 0x1f1c5c, light: 0x7186ef, plank: 0x262a78 },
  bottom: 0x2a1d63,
  stripe: 0xf4ead8,
  trim: { base: 0xf5b43a, shadow: 0xb8701e, light: 0xffe38f },
  accent: { base: 0xf5b43a, shadow: 0xb8701e, light: 0xffe38f },
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
  feat: F(),
};

const coral: ShipStyle = {
  id: 'coral',
  ink: 0x2a0f22,
  hull: { base: 0xf27fa8, shadow: 0xc4527e, deep: 0x8a2f5a, light: 0xffb6cf, plank: 0xa8406a },
  bottom: 0x1f5f6c,
  stripe: 0x3fe0d0,
  trim: { base: 0xfff0f5, shadow: 0xd8a8c0, light: 0xffffff },
  accent: { base: 0x3fe0d0, shadow: 0x1a9a92, light: 0xb8fff6 },
  metal: { base: 0x7a3f6a, shadow: 0x4f2244, light: 0xb87aa4 },
  wood: { base: 0xd8739a, shadow: 0x9c4468, light: 0xffa8c8 },
  interior: { base: 0x3a0f2a, rib: 0x5a1f44, shade: 0x1e0616 },
  cabin: { wall: 0x3fe0d0, wallShadow: 0x1a9a92, roof: 0xff7ab8, roofShadow: 0xc4527e, door: 0x1a3a4a },
  window: { glass: 0x1a3a4a, glow: 0xb8fff6 },
  sail: { base: 0x86e8de, shadow: 0x3fb0a8, light: 0xd0fff9, stitch: 0x1a7a74, emblem: 0xff7ab8, emblemShade: 0xc4527e, ragged: false, patches: false },
  flag: { base: 0x3fe0d0, shadow: 0x1a9a92, emblem: 0xffffff },
  emblem: 'paw',
  core: { base: 0x5ff5e6, light: 0xd8fffb, glow: 0x5ff5e6 },
  muzzle: 0x5ff5e6,
  crystal: { base: 0x5ff5e6, shadow: 0x1a9a92, light: 0xe8fffd },
  neon: [],
  panels: false,
  grime: 0,
  rust: false,
  feat: F({ pattern: 'coral', portholes: 'glow', debris: 'coral', glow: 0x5ff5e6, cabinRoof: 'dome' }),
};

export const STYLES: Record<ShipStyleId, ShipStyle> = {
  pirate,

  /** Mk1 — Balsa Bigotuda: lashed planks, tiny palm, sock-patched sail, paw flag. */
  raft: {
    ...pirate,
    id: 'raft',
    ink: 0x1d140c,
    hull: { base: 0xc9965a, shadow: 0x8f6236, deep: 0x5e3d1e, light: 0xeabf82, plank: 0x6e4724 },
    bottom: 0x7a5a32,
    stripe: 0xb08a52,
    trim: { base: 0xd8b878, shadow: 0x9c7a44, light: 0xf2dca6 },
    accent: { base: 0xd8b878, shadow: 0x9c7a44, light: 0xf2dca6 },
    metal: { base: 0x5a524c, shadow: 0x342e2a, light: 0x8d837a },
    wood: { base: 0x8f6236, shadow: 0x5e3d1e, light: 0xc08a52 },
    interior: { base: 0x2a1a0e, rib: 0x4a2f18, shade: 0x140c06 },
    cabin: { wall: 0xb08a52, wallShadow: 0x7a5a32, roof: 0xe0c27a, roofShadow: 0xa8884a, door: 0x2a1a0e },
    window: { glass: 0x2a1a0e, glow: 0xffcf5a },
    sail: { base: 0xefe6d2, shadow: 0xc8bb9c, light: 0xfffaf0, stitch: 0x8a7a5a, emblem: 0xe8879a, emblemShade: 0xb85a6e, ragged: false, patches: false },
    flag: { base: 0xefe6d2, shadow: 0xc8bb9c, emblem: 0xe8879a },
    emblem: 'paw',
    core: { base: 0xff7ab8, light: 0xffd0e6, glow: 0xff7ab8 },
    rust: true,
    feat: F({ pattern: 'logs', rail: 'rope', portholes: 'none', anchor: false, scroll: false, bowsprit: false, extras: ['palm'], sailDeco: 'sock', cabinRoof: 'thatch' }),
  },

  /** Mk2 — balandra barnizada: warm varnished wood, rope bands, cream stripe. */
  sloop: {
    ...pirate,
    id: 'sloop',
    ink: 0x1d0f08,
    hull: { base: 0xa8582e, shadow: 0x74381a, deep: 0x4a220e, light: 0xdb8a52, plank: 0x5a2a12 },
    bottom: 0x8a1f24,
    stripe: 0xede4d6,
    trim: { base: 0xe2c07c, shadow: 0xa07c40, light: 0xfbe9b8 },
    accent: { base: 0xd8b878, shadow: 0x9c7a44, light: 0xf2dca6 },
    metal: { base: 0x3a3530, shadow: 0x221e1b, light: 0x6d655c },
    wood: { base: 0x8a4a26, shadow: 0x5a2c14, light: 0xbc7442 },
    interior: { base: 0x24120a, rib: 0x40220f, shade: 0x120804 },
    cabin: { wall: 0xede4d6, wallShadow: 0xc8b89a, roof: 0x8a2a1a, roofShadow: 0x5a1a10, door: 0x24120a },
    window: { glass: 0x1a2a3a, glow: 0xffcf5a },
    sail: { base: 0xf2ead8, shadow: 0xcbbd9e, light: 0xfffbf0, stitch: 0x9a8a6a, emblem: 0xc8102e, emblemShade: 0x8a0a1e, ragged: false, patches: true },
    flag: { base: 0xc8102e, shadow: 0x8a0a1e, emblem: 0xede4d6 },
    emblem: 'paw',
    core: { base: 0xff7ab8, light: 0xffd0e6, glow: 0xff7ab8 },
    feat: F({ pattern: 'varnish', rail: 'rope', gloss: 0.6 }),
  },

  coral,
  /** Mk6 — coral with gold-foil runes and gold trims. */
  coral6: {
    ...coral,
    id: 'coral6',
    trim: { base: 0xf5c542, shadow: 0xb8861e, light: 0xfff0a0 },
    sail: { ...coral.sail, emblem: 0xf5c542, emblemShade: 0xb8861e },
    flag: { ...coral.flag, emblem: 0xf5c542 },
    feat: { ...coral.feat, runes: true },
  },

  /** Rat pirates: dirty brown wood, patches, rusty iron, cream sails with a rat skull. */
  rat: {
    ...pirate,
    id: 'rat',
    ink: 0x1a1210,
    hull: { base: 0x8a5732, shadow: 0x5c3519, deep: 0x3b2010, light: 0xb67b48, plank: 0x4a2a14 },
    bottom: 0x3d4a2c,
    stripe: 0x9b9a7c,
    trim: { base: 0x8f8a70, shadow: 0x5a5644, light: 0xc4bd9a },
    accent: { base: 0x8f8a70, shadow: 0x5a5644, light: 0xc4bd9a },
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
    grime: 1,
    rust: true,
    feat: F(),
  },

  /** Celestial ship (Mk7 / Cometas Errantes): dark armor, neon, torn red sails with constellations. */
  cosmic: {
    ...pirate,
    id: 'cosmic',
    ink: 0x07050b,
    hull: { base: 0x352a48, shadow: 0x1e1729, deep: 0x110c19, light: 0x5a4b78, plank: 0x150f1e },
    bottom: 0x1a1024,
    stripe: 0xff2e88,
    trim: { base: 0x6a5a86, shadow: 0x3a2f4e, light: 0xa898c8 },
    accent: { base: 0x00e5ff, shadow: 0x0088aa, light: 0xc8fbff },
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
    rust: false,
    feat: F({ pattern: 'panels', portholes: 'glow', sailDeco: 'constellation', extras: ['stars'] }),
  },

  /** El Patito Pirata: a rubber duck boat with a paper pirate hat. */
  duck: {
    ...pirate,
    id: 'duck',
    ink: 0x2a1a08,
    hull: { base: 0xffd23f, shadow: 0xf2a52a, deep: 0xc97a14, light: 0xfff2a8, plank: 0xe0a820 },
    bottom: 0xf4b232,
    stripe: 0xffffff,
    trim: { base: 0xffe36a, shadow: 0xf2a52a, light: 0xfff8d0 },
    accent: { base: 0xffbf2e, shadow: 0xe0901a, light: 0xffe680 },
    metal: { base: 0x3a3a4a, shadow: 0x22222e, light: 0x7a7a90 },
    wood: { base: 0xff8a2a, shadow: 0xc8601a, light: 0xffb060 },
    interior: { base: 0xb8740e, rib: 0xc98418, shade: 0x8a520a },
    cabin: { wall: 0x7ec8ff, wallShadow: 0x4f98d8, roof: 0xff7a1a, roofShadow: 0xc8501a, door: 0x2a4a7a },
    window: { glass: 0x2a4a7a, glow: 0xfff6c0 },
    sail: { base: 0xf6f2e8, shadow: 0xcfc8b4, light: 0xffffff, stitch: 0x7ec8ff, emblem: 0x2a1a08, emblemShade: 0x5a4a30, ragged: false, patches: false },
    flag: { base: 0x2a1a08, shadow: 0x140c04, emblem: 0xffd23f },
    emblem: 'duck',
    core: { base: 0xff7ab8, light: 0xffd0e6, glow: 0xff7ab8 },
    muzzle: 0xff8a1a,
    rust: false,
    feat: F({ pattern: 'rubber', rail: 'none', portholes: 'none', anchor: false, lifeRing: true, scroll: false, waterStripe: false, bowsprit: false, figure: 'duck', extras: ['tail'], debris: 'rubber', gloss: 1 }),
  },

  /** Guardia de Piedra: stone blocks with moss, crenellations, gargoyle figurehead. */
  stone: {
    ...pirate,
    id: 'stone',
    ink: 0x171317,
    hull: { base: 0x9a9384, shadow: 0x6f6a5e, deep: 0x4a463e, light: 0xc4bdab, plank: 0x55514a },
    bottom: 0x4f6a48,
    stripe: 0x4f8f4a,
    trim: { base: 0xb9b2a0, shadow: 0x7d776a, light: 0xdcd6c6 },
    accent: { base: 0x5f9f52, shadow: 0x3a6a34, light: 0x9fd66e },
    metal: { base: 0x55524c, shadow: 0x34322e, light: 0x8a867e },
    wood: { base: 0x6e5a44, shadow: 0x46382a, light: 0x96806a },
    interior: { base: 0x2a2723, rib: 0x3d3934, shade: 0x141210 },
    cabin: { wall: 0xa8a191, wallShadow: 0x7a7466, roof: 0x4a4f5a, roofShadow: 0x2f333c, door: 0x2a2420 },
    window: { glass: 0x2a2420, glow: 0xffb84a },
    sail: { base: 0xc9c1a8, shadow: 0x9a9278, light: 0xe6dfc8, stitch: 0x6f6a5e, emblem: 0x4f8f4a, emblemShade: 0x2f5f2c, ragged: false, patches: true },
    flag: { base: 0x4f8f4a, shadow: 0x2f5f2c, emblem: 0xe6dfc8 },
    emblem: 'tower',
    core: { base: 0xffb84a, light: 0xffe6b0, glow: 0xffa82a },
    muzzle: 0xffb84a,
    crystal: { base: 0x9fd66e, shadow: 0x4f8f4a, light: 0xe6ffd0 },
    rust: true,
    feat: F({ pattern: 'stone', rail: 'crenel', portholes: 'slit', lifeRing: false, scroll: false, bowsprit: false, figure: 'gargoyle', debris: 'stone', cabinRoof: 'crenel' }),
  },

  /** Flota del Kraken: wet blue iron, hazard yellow, Tesla coils, tentacles. */
  kraken: {
    ...pirate,
    id: 'kraken',
    ink: 0x0d1520,
    hull: { base: 0x3569a3, shadow: 0x214a7c, deep: 0x172b35, light: 0x74a8dc, plank: 0x173052 },
    bottom: 0x172b35,
    stripe: 0xffd400,
    trim: { base: 0xffd400, shadow: 0xb89400, light: 0xfff08a },
    accent: { base: 0x9b5ab8, shadow: 0x6a3488, light: 0xd8a8ee },
    metal: { base: 0x2c3e55, shadow: 0x18243a, light: 0x6d88a8 },
    wood: { base: 0x3d4f66, shadow: 0x24324a, light: 0x6d84a2 },
    interior: { base: 0x0d1a24, rib: 0x1d3346, shade: 0x060d12 },
    cabin: { wall: 0x2c5a8a, wallShadow: 0x1d3f66, roof: 0x172b35, roofShadow: 0x0d1a24, door: 0x0d1a24 },
    window: { glass: 0x0d1a24, glow: 0x00e5ff },
    sail: { base: 0x2e4a6a, shadow: 0x1d3248, light: 0x4f74a0, stitch: 0x172b35, emblem: 0xffd400, emblemShade: 0xb89400, ragged: false, patches: false },
    flag: { base: 0xffd400, shadow: 0xb89400, emblem: 0x172b35 },
    emblem: 'kraken',
    core: { base: 0x00e5ff, light: 0xc8fbff, glow: 0x3af0ff },
    muzzle: 0x00e5ff,
    crystal: { base: 0x00e5ff, shadow: 0x0088aa, light: 0xc8fbff },
    panels: true,
    rust: false,
    feat: F({ pattern: 'panels', portholes: 'glow', extras: ['tesla', 'tentacles'], debris: 'iron', gloss: 1 }),
  },

  /** Biblioteca Hundida: purple crystal + bookshelf wood, floating books, parchment sails. */
  library: {
    ...pirate,
    id: 'library',
    ink: 0x140a16,
    hull: { base: 0x5c3d5b, shadow: 0x3e2840, deep: 0x231626, light: 0x8f6b93, plank: 0x2a1a2c },
    bottom: 0x231626,
    stripe: 0xb89558,
    trim: { base: 0xb89558, shadow: 0x7d6236, light: 0xe6c98a },
    accent: { base: 0xc49bff, shadow: 0x7a4fbf, light: 0xf0e0ff },
    metal: { base: 0x4a3a52, shadow: 0x2a1f30, light: 0x7d6a88 },
    wood: { base: 0x6b4a3a, shadow: 0x452e24, light: 0x94705a },
    interior: { base: 0x140c16, rib: 0x2a1a2c, shade: 0x08040a },
    cabin: { wall: 0x8f6b93, wallShadow: 0x5c3d5b, roof: 0x3a2a5a, roofShadow: 0x231638, door: 0x140c16 },
    window: { glass: 0x1a1030, glow: 0xd9a8ff },
    sail: { base: 0xe8dcc0, shadow: 0xc2b18c, light: 0xf6efdc, stitch: 0x8f7a55, emblem: 0x5c3d5b, emblemShade: 0x3e2840, ragged: false, patches: false },
    flag: { base: 0x5c3d5b, shadow: 0x3e2840, emblem: 0xe8dcc0 },
    emblem: 'book',
    core: { base: 0xc49bff, light: 0xf0e0ff, glow: 0xb07aff },
    muzzle: 0xc49bff,
    crystal: { base: 0xc49bff, shadow: 0x7a4fbf, light: 0xf0e0ff },
    rust: false,
    feat: F({ pattern: 'bookshelf', portholes: 'glow', extras: ['books'], debris: 'paper', sailDeco: 'writing', cabinRoof: 'dome' }),
  },

  /** La Marea Sin Nombre: rib-cage hulls, torn sails, blinking eyes, fog. */
  bone: {
    ...pirate,
    id: 'bone',
    ink: 0x0d0b0f,
    hull: { base: 0x413b44, shadow: 0x2c272f, deep: 0x1a171c, light: 0x5e5763, plank: 0x221e25 },
    bottom: 0x1a171c,
    stripe: 0x8a5cff,
    trim: { base: 0xcfc9d4, shadow: 0x9a93a2, light: 0xf4f0f8 },
    accent: { base: 0xd9d4de, shadow: 0xa69fae, light: 0xf8f6fb },
    metal: { base: 0x413b44, shadow: 0x2c272f, light: 0x6e6674 },
    wood: { base: 0x5a4a44, shadow: 0x3a2f2b, light: 0x7d6a62 },
    interior: { base: 0x0d0b0f, rib: 0x241f27, shade: 0x050406 },
    cabin: { wall: 0x5e5763, wallShadow: 0x3e3843, roof: 0x2c272f, roofShadow: 0x1a171c, door: 0x0d0b0f },
    window: { glass: 0x0d0b0f, glow: 0x8a5cff },
    sail: { base: 0x9d97a3, shadow: 0x6f6976, light: 0xc4bfc9, stitch: 0x413b44, emblem: 0x171317, emblemShade: 0x413b44, ragged: true, patches: false },
    flag: { base: 0x171317, shadow: 0x0a080a, emblem: 0xd9d4de },
    emblem: 'fishbone',
    core: { base: 0x8a5cff, light: 0xd8c8ff, glow: 0x8a5cff },
    muzzle: 0x8a5cff,
    crystal: { base: 0x8a5cff, shadow: 0x4a2a9a, light: 0xd8c8ff },
    rust: false,
    feat: F({ pattern: 'ribs', rail: 'bone', portholes: 'none', lifeRing: false, scroll: false, bowsprit: false, figure: 'skull', extras: ['eyes', 'fog'], debris: 'bone' }),
  },

  /** Bandera Negra (Velo Noctis): black lacquer, purple lace, venetian mask. */
  noctis: {
    ...pirate,
    id: 'noctis',
    ink: 0x050407,
    hull: { base: 0x1c1624, shadow: 0x100c15, deep: 0x060408, light: 0x4a3a60, plank: 0x0a080d },
    bottom: 0x0d0b10,
    stripe: 0xb89558,
    trim: { base: 0xb89558, shadow: 0x7d6236, light: 0xf0d698 },
    accent: { base: 0xd296ff, shadow: 0x8c2bff, light: 0xf2dcff },
    metal: { base: 0x2a2233, shadow: 0x16121c, light: 0x5a4a6e },
    wood: { base: 0x241c2e, shadow: 0x120e18, light: 0x4a3a5e },
    interior: { base: 0x050407, rib: 0x1a1422, shade: 0x020103 },
    cabin: { wall: 0x2a2036, wallShadow: 0x16121c, roof: 0x8c2bff, roofShadow: 0x5a1aa8, door: 0x050407 },
    window: { glass: 0x0d0812, glow: 0xd296ff },
    sail: { base: 0x2e1846, shadow: 0x1a0c2a, light: 0x53307e, stitch: 0x8c2bff, emblem: 0xd296ff, emblemShade: 0x8c2bff, ragged: false, patches: false },
    flag: { base: 0x0d0b10, shadow: 0x050407, emblem: 0xd296ff },
    emblem: 'mask',
    core: { base: 0xd296ff, light: 0xf6e6ff, glow: 0xc07aff },
    muzzle: 0xd296ff,
    crystal: { base: 0xd296ff, shadow: 0x8c2bff, light: 0xf6e6ff },
    rust: false,
    feat: F({ pattern: 'lacquer', rail: 'lace', portholes: 'glow', figure: 'mask', debris: 'feather', sailDeco: 'lace', gloss: 1 }),
  },

  /** ??? — a ship made of static. Cells are erased, nothing inside. */
  void: {
    ...pirate,
    id: 'void',
    ink: 0x000000,
    hull: { base: 0x0b0b0e, shadow: 0x050506, deep: 0x000000, light: 0x26262e, plank: 0x000000 },
    bottom: 0x000000,
    stripe: 0xff2e88,
    trim: { base: 0x16161c, shadow: 0x0b0b0e, light: 0x34343e },
    accent: { base: 0xff2e88, shadow: 0x8a0f48, light: 0xffb3d6 },
    metal: { base: 0x111114, shadow: 0x050506, light: 0x34343e },
    wood: { base: 0x111114, shadow: 0x050506, light: 0x2a2a32 },
    interior: { base: 0x000000, rib: 0x000000, shade: 0x000000 },
    cabin: { wall: 0x0d0d10, wallShadow: 0x050506, roof: 0x050506, roofShadow: 0x000000, door: 0x000000 },
    window: { glass: 0x000000, glow: 0xff2e88 },
    sail: { base: 0x0e0e12, shadow: 0x050506, light: 0x2a2a32, stitch: 0xff2e88, emblem: 0xff2e88, emblemShade: 0x8a0f48, ragged: true, patches: false },
    flag: { base: 0x000000, shadow: 0x000000, emblem: 0xff2e88 },
    emblem: 'question',
    core: { base: 0xff2e88, light: 0xffb3d6, glow: 0xff2e88 },
    muzzle: 0xff2e88,
    crystal: { base: 0xff2e88, shadow: 0x8a0f48, light: 0xffb3d6 },
    rust: false,
    feat: F({ pattern: 'static', rail: 'none', portholes: 'none', anchor: false, lifeRing: false, scroll: false, waterStripe: false, bowsprit: false, extras: ['glitch'], debris: 'glitch', noInterior: true, outlineGlow: 0xff2e88 }),
  },
};

export function getStyle(id: ShipStyleId | string | undefined): ShipStyle {
  return STYLES[(id ?? 'pirate') as ShipStyleId] ?? STYLES.pirate;
}

/** Player hull skin by Casco Mk (GDD §2.8). */
export function hullStyleForMk(mk: number): ShipStyleId {
  if (mk <= 1) return 'raft';
  if (mk === 2) return 'sloop';
  if (mk <= 4) return 'pirate';
  if (mk === 5) return 'coral';
  if (mk === 6) return 'coral6';
  return 'cosmic';
}

const ZONE_STYLE: Record<number, ShipStyleId> = { 1: 'rat', 2: 'stone', 3: 'kraken', 4: 'library', 5: 'cosmic', 6: 'bone' };

/**
 * Which skin a ship should wear.
 *  - player: by hull Mk (1 raft · 2 sloop · 3-4 pirate · 5 coral · 6 coral+runes · 7 cosmic)
 *  - enemy: stage 1-1 → duck (tutorial), otherwise by zone (1 rat · 2 stone · 3 kraken · 4 library · 5 cosmic · 6 bone);
 *    stageKey 'noctis…' / 'void…' (or 'event:noctis', '???') pick the special factions.
 */
export function styleFor(kind: 'player' | 'enemy', opts: { hullMk?: number; zone?: number; stageKey?: string; boss?: boolean } = {}): ShipStyleId {
  if (kind === 'player') return hullStyleForMk(opts.hullMk ?? 3);
  const key = (opts.stageKey ?? '').toLowerCase();
  if (key === '1-1' || key.endsWith(':1-1') || key.includes('patito') || key.includes('duck')) return 'duck';
  if (key.includes('noctis') || key.includes('bandera')) return 'noctis';
  if (key.includes('void') || key.includes('???') || key.includes('nadie') || key.includes('vacio')) return 'void';
  let zone = opts.zone;
  if (zone === undefined) {
    const m = /(\d+)\s*-\s*\d+/.exec(key);
    if (m) zone = parseInt(m[1], 10);
  }
  return ZONE_STYLE[zone ?? 1] ?? 'rat';
}
