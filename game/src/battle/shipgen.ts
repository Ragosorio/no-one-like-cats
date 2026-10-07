/**
 * Procedural enemy ships from GDD archetypes (size, hull material, cannons, catrooms, mast, specials).
 * Ships face RIGHT in blueprint space (the sim flips the enemy). Always connected to the keel.
 */
import { ShipBlueprint, ModuleKind } from './ship';
import { Rng } from '../core/rng';

export interface ShipGenSpec {
  cols: number;
  rows: number;
  /** hull letter: W wood, I iron, S stone, C crystal, B bone */
  mat: string;
  cannons: number;
  catrooms: number;
  mast: boolean;
  extras?: ('powder' | 'pantry' | 'wall' | 'shield' | 'arcane' | 'barrels')[];
  seed?: number;
  /** Torre-Barco: a tall stone tower with snipers on top (bring the base down!) */
  tower?: boolean;
}

const MAT_LETTER: Record<string, string> = { madera: 'W', hierro: 'I', piedra: 'S', cristal: 'C', hueso: 'B' };

export function specFromArchetype(a: { size: string; hull: string; cannons: number; catrooms: number; mast: boolean; special: string }, seed = 1): ShipGenSpec {
  const [c, r] = a.size.split('x').map(Number);
  const first = a.hull.split(/[ +]/)[0];
  const extras: ShipGenSpec['extras'] = [];
  const sp = a.special.toLowerCase() + ' ' + a.hull.toLowerCase();
  if (sp.includes('santab')) extras.push('powder');
  if (sp.includes('despensa')) extras.push('pantry');
  if (sp.includes('muro')) extras.push('wall');
  if (sp.includes('escudo')) extras.push('shield');
  return { cols: c, rows: r, mat: MAT_LETTER[first] ?? 'W', cannons: a.cannons, catrooms: a.catrooms, mast: a.mast, extras, seed };
}

export function generateShip(spec: ShipGenSpec): ShipBlueprint {
  const rng = new Rng(spec.seed ?? 1);
  const W = Math.max(9, spec.cols);
  const H = Math.max(7, spec.rows);
  const grid: string[][] = Array.from({ length: H }, () => Array(W).fill('.'));
  const modules: ShipBlueprint['modules'] = [];
  const M = spec.mat;
  // hull body: 4 rows at the bottom; deck = H-4
  const deck = H - 4;
  const insets = [0, 0, 1, 2]; // deck, deck+1, deck+2, keel
  for (let i = 0; i < 4; i++) {
    const y = deck + i;
    const inL = insets[i] + (i === 0 ? 0 : 0);
    const inR = insets[i];
    for (let x = inL; x < W - inR; x++) grid[y][x] = M;
  }
  // bow rises one cell (prow) at the right
  if (deck - 1 >= 0) grid[deck - 1][W - 1] = M;
  const towerX = Math.floor(W / 2) - 2;
  if (spec.tower) {
    // 4-wide tower from row 2 to the deck
    for (let y = 2; y < deck; y++) for (let x = towerX; x < towerX + 4; x++) grid[y][x] = M;
  }
  const occupied = new Set<string>();
  const take = (x: number, y: number, w: number, h: number) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) occupied.add(`${xx},${yy}`);
  };
  const free = (x: number, y: number, w: number, h: number) => {
    if (x < 0 || y < 0 || x + w > W || y + h > H) return false;
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (occupied.has(`${xx},${yy}`)) return false;
    return true;
  };
  const add = (kind: ModuleKind, x: number, y: number, w: number, h: number, slot?: number) => {
    modules.push({ kind, x, y, w, h, slot });
    take(x, y, w, h);
    // ensure support below modules placed above deck
    for (let xx = x; xx < x + w; xx++) for (let yy = y + h; yy < deck; yy++) if (grid[yy][xx] === '.' && !occupied.has(`${xx},${yy}`)) grid[yy][xx] = M;
  };
  // core inside the hull, slightly aft of center
  const coreX = Math.floor(W / 2) - 1 - (W > 12 ? 1 : 0);
  add('core', coreX, deck + 1, 2, 2);
  // cannons at the bow (right side): deck row and one below
  const cannonSpots = [
    [W - 2, deck - 1],
    [W - 3, deck + 1],
    [W - 2, deck - 3],
    [W - 6, deck - 1],
  ];
  let placedC = 0;
  for (const [x, y] of cannonSpots) {
    if (placedC >= spec.cannons) break;
    if (y < 0) continue;
    if (free(x, y, 2, 1)) {
      add('cannon', x, y, 2, 1);
      placedC++;
    }
  }
  if (spec.tower) {
    // snipers: one room on the tower top, one inside the tower
    add('catroom', towerX + 1, 0, 2, 2, 0);
    add('catroom', towerX + 1, Math.max(3, deck - 4), 2, 2, 1);
    if (spec.mast && deck - 4 >= 0 && free(1, deck - 4, 1, 4)) add('mast', 1, deck - 4, 1, 4);
  }
  // mast near center top
  if (spec.mast && !spec.tower && deck - 4 >= 0) {
    const mx = Math.floor(W / 2) + (W % 2 ? 0 : 0);
    if (free(mx, deck - 4, 1, 4)) add('mast', mx, deck - 4, 1, 4);
  }
  // catrooms: on deck (above) from stern, then inside hull
  let slot = spec.tower ? 2 : 0;
  const roomSpots: [number, number][] = [
    [1, deck - 2],
    [Math.floor(W / 2) + 2, deck - 2],
    [Math.floor(W / 2) - 3, deck - 2],
    [1, deck],
    [W - 5, deck],
  ];
  for (const [x, y] of roomSpots) {
    if (slot >= spec.catrooms) break;
    if (y < 0) continue;
    if (free(x, y, 2, 2)) {
      add('catroom', x, y, 2, 2, slot++);
    }
  }
  // fallback: anywhere in hull
  for (let y = deck; y < H - 1 && slot < spec.catrooms; y++)
    for (let x = 1; x < W - 2 && slot < spec.catrooms; x++) if (grid[y][x] !== '.' && grid[y + 1]?.[x] !== '.' && free(x, y, 2, 2)) add('catroom', x, y, 2, 2, slot++);
  const ex = spec.extras ?? [];
  if (ex.includes('powder')) {
    // exposed near the bow on deck
    for (const [x, y] of [
      [W - 4, deck - 1],
      [W - 5, deck - 1],
      [3, deck - 1],
    ])
      if (free(x, y, 1, 1)) {
        add('powder', x, y, 1, 1);
        break;
      }
  }
  if (ex.includes('pantry')) {
    for (let x = 2; x < W - 2; x++)
      if (free(x, deck + 1, 1, 1)) {
        add('engine', x, deck + 1, 1, 1);
        break;
      }
  }
  if (ex.includes('wall')) {
    // iron wall at the bow, 3 tall above deck: forces lobbed shots
    const x = W - 1;
    for (let y = Math.max(0, deck - 4); y < deck; y++) if (!occupied.has(`${x},${y}`)) grid[y][x] = 'I';
    for (let y = Math.max(0, deck - 4); y < deck; y++) if (!occupied.has(`${x - 1},${y}`) && rng.chance(0.5)) grid[y][x - 1] = 'I';
  }
  if (ex.includes('shield')) {
    for (let x = 2; x < W - 3; x++)
      if (free(x, deck + 1, 2, 1)) {
        add('shield', x, deck + 1, 2, 1);
        break;
      }
  }
  if (ex.includes('barrels')) {
    let n = 0;
    for (let x = 2; x < W - 2 && n < 6; x++)
      if (free(x, deck - 1, 1, 1) && rng.chance(0.7)) {
        add('powder', x, deck - 1, 1, 1);
        n++;
      }
  }
  return { cols: W, rows: H, hull: grid.map((r) => r.join('')), modules };
}

/** Hand-made ships for story moments. */
export const STORY_SHIPS: Record<string, ShipBlueprint> = {
  /** Jefe 2 — El Risco Flotante: stone fortress, the gargoyle perched on the tower, La Garganta (2x2) in the middle */
  risco_flotante: {
    cols: 18,
    rows: 12,
    hull: [
      '..................',
      '..................',
      '..................',
      '......SSSSSS......',
      '......SSSSSS......',
      '......SSSSSS......',
      '......SSSSSS......',
      '......SSSSSS.....S',
      'SSSSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSSSS',
      '.SSSSSSSSSSSSSSSS.',
      '...SSSSSSSSSSSS...',
    ],
    modules: [
      { kind: 'catroom', x: 7, y: 1, w: 2, h: 2, slot: 0 },
      { kind: 'arcane', x: 8, y: 5, w: 2, h: 2, tag: 'throat' },
      { kind: 'mast', x: 4, y: 4, w: 1, h: 4 },
      { kind: 'catroom', x: 1, y: 6, w: 2, h: 2, slot: 1 },
      { kind: 'catroom', x: 3, y: 9, w: 2, h: 2, slot: 2 },
      { kind: 'catroom', x: 13, y: 9, w: 2, h: 2, slot: 3 },
      { kind: 'core', x: 8, y: 9, w: 2, h: 2 },
      { kind: 'cannon', x: 12, y: 7, w: 2, h: 1 },
      { kind: 'cannon', x: 15, y: 7, w: 2, h: 1 },
    ],
  },
  /** Jefe 3 — Barco atrapado por el Kraken: wet iron, the static generator, 4 cabins (the tentacles are boss parts) */
  kraken: {
    cols: 20,
    rows: 12,
    hull: [
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '.IIIIIIIIIIIIIIIIII.',
      'IIIIIIIIIIIIIIIIIIII',
      'IIIIIIIIIIIIIIIIIIII',
      '.IIIIIIIIIIIIIIIIII.',
      '...IIIIIIIIIIIIII...',
    ],
    modules: [
      { kind: 'catroom', x: 16, y: 5, w: 2, h: 2, slot: 0 },
      { kind: 'mast', x: 10, y: 3, w: 1, h: 4 },
      { kind: 'catroom', x: 3, y: 6, w: 2, h: 2, slot: 1 },
      { kind: 'shield', x: 7, y: 6, w: 2, h: 1, tag: 'static' },
      { kind: 'catroom', x: 5, y: 9, w: 2, h: 2, slot: 2 },
      { kind: 'catroom', x: 13, y: 9, w: 2, h: 2, slot: 3 },
      { kind: 'core', x: 9, y: 9, w: 2, h: 2 },
      { kind: 'cannon', x: 14, y: 6, w: 2, h: 1 },
      { kind: 'cannon', x: 18, y: 7, w: 2, h: 1 },
      { kind: 'cannon', x: 18, y: 9, w: 2, h: 1 },
    ],
  },
  /**
   * Jefe 4 — La Biblioteca Errante: a crystal spire (the Arcanista on top), 3 arcane generators (the
   * ward's anchors, drawn as glowing lecterns), the Grimorio (core) deep in the wooden stacks.
   */
  biblioteca_errante: {
    cols: 18,
    rows: 12,
    hull: [
      '........CC........',
      '........CC........',
      '.......CCCC.......',
      '.......CCCC.......',
      '.......CCCC.......',
      '.......CCCC.......',
      '.......CCCC......W',
      '.......CCCC.....WW',
      'WWWWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWWWW',
      '.WWWWWWWWWWWWWWWW.',
      '...WWWWWWWWWWWW...',
    ],
    modules: [
      { kind: 'catroom', x: 8, y: 0, w: 2, h: 2, slot: 0 },
      { kind: 'cannon', x: 16, y: 7, w: 2, h: 1 },
      { kind: 'cannon', x: 11, y: 7, w: 2, h: 1 },
      { kind: 'cannon', x: 15, y: 9, w: 2, h: 1 },
      { kind: 'arcane', x: 7, y: 3, w: 2, h: 2, tag: 'ward' },
      { kind: 'arcane', x: 9, y: 5, w: 2, h: 2, tag: 'ward' },
      { kind: 'arcane', x: 1, y: 6, w: 2, h: 2, tag: 'ward' },
      { kind: 'mast', x: 4, y: 3, w: 1, h: 5 },
      { kind: 'catroom', x: 13, y: 6, w: 2, h: 2, slot: 1 },
      { kind: 'catroom', x: 5, y: 9, w: 2, h: 2, slot: 2 },
      { kind: 'core', x: 10, y: 9, w: 2, h: 2 },
    ],
  },
  /**
   * Jefe 5 — El Cometa: iron hull + crystal dome; the star-core under the dome, 2 gravity wells low on
   * bow and stern, the Estrella on top of the dome.
   */
  cometa: {
    cols: 20,
    rows: 11,
    hull: [
      '....................',
      '....................',
      '....................',
      '.........CC.........',
      '........CCCC........',
      '.......CCCCCC.....CC',
      '..CCCCCCCCCCCCCCCCC.',
      'IIIIIIIIIIIIIIIIIIII',
      'IIIIIIIIIIIIIIIIIIII',
      '.IIIIIIIIIIIIIIIIII.',
      '...IIIIIIIIIIIIII...',
    ],
    modules: [
      { kind: 'catroom', x: 9, y: 1, w: 2, h: 2, slot: 0 },
      { kind: 'cannon', x: 18, y: 5, w: 2, h: 1 },
      { kind: 'cannon', x: 17, y: 8, w: 2, h: 1 },
      { kind: 'core', x: 9, y: 6, w: 2, h: 2 },
      { kind: 'arcane', x: 1, y: 7, w: 2, h: 2, tag: 'well' },
      { kind: 'arcane', x: 15, y: 7, w: 2, h: 2, tag: 'well' },
      { kind: 'catroom', x: 3, y: 4, w: 2, h: 2, slot: 1 },
      { kind: 'catroom', x: 14, y: 4, w: 2, h: 2, slot: 2 },
      { kind: 'catroom', x: 5, y: 8, w: 2, h: 2, slot: 3 },
    ],
  },
  /**
   * Jefe 6 — El Leviatán Almirante: a whale of bone (it can't sink: the sea holds it). Three cores, one per
   * phase: the Coral Heart at the bow, the Espiráculo (blowhole) on top, the deep heart under the Coral
   * Heart (dig through the hole the first one leaves).
   */
  leviatan: {
    cols: 22,
    rows: 13,
    hull: [
      '......................',
      '......................',
      '......................',
      '.........BBBB.........',
      '......BBBBBBBBBB......',
      '....BBBBBBBBBBBBBB....',
      '..BBBBBBBBBBBBBBBBBB..',
      '.BBBBBBBBBBBBBBBBBBBB.',
      'BBBBBBBBBBBBBBBBBBBBBC',
      'BBBBBBBBBBBBBBBBBBBBCC',
      '.BBBBBBBBBBBBBBBBBBBB.',
      '..BBBBBBBBBBBBBBBBBB..',
      '.....BBBBBBBBBBBB.....',
    ],
    modules: [
      { kind: 'catroom', x: 7, y: 5, w: 2, h: 2, slot: 0 },
      { kind: 'cannon', x: 20, y: 8, w: 2, h: 1 },
      { kind: 'cannon', x: 14, y: 4, w: 2, h: 1 },
      { kind: 'cannon', x: 4, y: 5, w: 2, h: 1 },
      { kind: 'core', x: 17, y: 6, w: 2, h: 2, tag: 'core1' },
      { kind: 'core', x: 10, y: 3, w: 2, h: 2, tag: 'core2' },
      { kind: 'core', x: 17, y: 8, w: 2, h: 2, tag: 'core3' },
      { kind: 'catroom', x: 14, y: 7, w: 2, h: 2, slot: 1 },
      { kind: 'catroom', x: 3, y: 8, w: 2, h: 2, slot: 2 },
    ],
  },
  /** duel platform: a wooden raft for 1–2 cats, no core */
  duel_raft: {
    cols: 7,
    rows: 5,
    hull: ['.......', '.......', 'WWWWWWW', 'WWWWWWW', '.WWWWW.'],
    modules: [
      { kind: 'catroom', x: 1, y: 0, w: 2, h: 2, slot: 0 },
      { kind: 'catroom', x: 4, y: 0, w: 2, h: 2, slot: 1 },
    ],
  },
  /** duel platform for 3 cats a side (La Orquesta Muda) — same planks, one more cabin */
  duel_raft3: {
    cols: 10,
    rows: 5,
    hull: ['..........', '..........', 'WWWWWWWWWW', 'WWWWWWWWWW', '.WWWWWWWW.'],
    modules: [
      { kind: 'catroom', x: 1, y: 0, w: 2, h: 2, slot: 0 },
      { kind: 'catroom', x: 4, y: 0, w: 2, h: 2, slot: 1 },
      { kind: 'catroom', x: 7, y: 0, w: 2, h: 2, slot: 2 },
    ],
  },
  patito: {
    cols: 10,
    rows: 8,
    hull: [
      '.......WW.',
      '......WWWW',
      '......WWWW',
      '.......WW.',
      'WWWWWWWWWW',
      'WWWWWWWWWW',
      '.WWWWWWWW.',
      '..WWWWWW..',
    ],
    modules: [
      { kind: 'catroom', x: 2, y: 2, w: 2, h: 2, slot: 0 },
      { kind: 'core', x: 4, y: 5, w: 2, h: 2 },
      { kind: 'cannon', x: 7, y: 3, w: 2, h: 1 },
    ],
  },
  sardina_furiosa: {
    cols: 16,
    rows: 10,
    hull: [
      '................',
      '................',
      '................',
      '................',
      '...............W',
      'WWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWW',
      'WWWIIWWWWWWIIWWW',
      '.WWWWWWWWWWWWWW.',
      '..WWWWWWWWWWWW..',
    ],
    modules: [
      { kind: 'mast', x: 8, y: 0, w: 1, h: 5 },
      { kind: 'powder', x: 7, y: 4, w: 1, h: 1 },
      { kind: 'catroom', x: 1, y: 3, w: 2, h: 2, slot: 0 },
      { kind: 'catroom', x: 11, y: 3, w: 2, h: 2, slot: 1 },
      { kind: 'catroom', x: 2, y: 6, w: 2, h: 2, slot: 2 },
      { kind: 'cannon', x: 14, y: 4, w: 2, h: 1 },
      { kind: 'cannon', x: 13, y: 6, w: 2, h: 1 },
      { kind: 'core', x: 6, y: 7, w: 2, h: 2 },
      // the 6 powder barrels on deck (chain explosions)
      { kind: 'powder', x: 3, y: 4, w: 1, h: 1 },
      { kind: 'powder', x: 4, y: 4, w: 1, h: 1 },
      { kind: 'powder', x: 5, y: 4, w: 1, h: 1 },
      { kind: 'powder', x: 9, y: 4, w: 1, h: 1 },
      { kind: 'powder', x: 10, y: 4, w: 1, h: 1 },
      { kind: 'powder', x: 13, y: 4, w: 1, h: 1 },
    ],
  },
};
