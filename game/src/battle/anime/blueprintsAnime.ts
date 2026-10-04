import { ShipBlueprint } from '../ship';

/**
 * Ship plans shaped for the anime renderer: raised stern castle (left) and forecastle (bow, right),
 * a rounded keel, cabins on deck between the masts and an embedded cat niche.
 * Same format as BLUEPRINTS (rows top→bottom, modules overwrite hull cells).
 */
export const ANIME_BLUEPRINTS: Record<string, ShipBlueprint> = {
  /** Player flagship, Yo-Ho style. */
  galleon: {
    cols: 18,
    rows: 11,
    hull: [
      '..................',
      '..................',
      '..................',
      '..................',
      'WWW...............',
      'WWWW..........WWW.',
      'WWWWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWWWW',
      '.WWWWWWWWWWWWWWWWW',
      '..WWWWWWWWWWWWWWW.',
      '....WWWWWWWWWWW...',
    ],
    modules: [
      { kind: 'mast', x: 5, y: 1, w: 1, h: 5 },
      { kind: 'mast', x: 12, y: 2, w: 1, h: 4 },
      { kind: 'catroom', x: 0, y: 2, w: 2, h: 2, slot: 0 },
      { kind: 'catroom', x: 8, y: 4, w: 2, h: 2, slot: 1 },
      { kind: 'cannon', x: 15, y: 4, w: 2, h: 1 },
      { kind: 'core', x: 8, y: 7, w: 2, h: 2 },
      { kind: 'catroom', x: 3, y: 7, w: 2, h: 2, slot: 2 },
      { kind: 'powder', x: 13, y: 8, w: 1, h: 1 },
    ],
  },
  /** Scrappy rat raider with iron patches. */
  ratship: {
    cols: 16,
    rows: 10,
    hull: [
      '................',
      '................',
      '................',
      '................',
      'WW..............',
      'WWW.........WWW.',
      'WWWWWWWWWWWWWWWW',
      'WWWIIWWWWWWIIWWW',
      '.WWWWWWWWWWWWWW.',
      '...WWWWWWWWWW...',
    ],
    modules: [
      { kind: 'mast', x: 6, y: 2, w: 1, h: 4 },
      { kind: 'catroom', x: 0, y: 2, w: 2, h: 2, slot: 0 },
      { kind: 'catroom', x: 9, y: 4, w: 2, h: 2, slot: 1 },
      { kind: 'cannon', x: 13, y: 4, w: 2, h: 1 },
      { kind: 'core', x: 7, y: 7, w: 2, h: 2 },
      { kind: 'catroom', x: 2, y: 7, w: 2, h: 2, slot: 2 },
      { kind: 'powder', x: 11, y: 8, w: 1, h: 1 },
    ],
  },
  /** Late-game celestial galleon: armored, shield, engine and arcane modules. */
  celestial: {
    cols: 18,
    rows: 11,
    hull: [
      '..................',
      '..................',
      '..................',
      '..................',
      'III...............',
      'IIII..........III.',
      'IIIIIIIIIIIIIIIIII',
      'IIIICIIIIIIICIIIII',
      '.IIIIIIIIIIIIIIIII',
      '..IIIIIIIIIIIIIII.',
      '....IIIIIIIIIIII..',
    ],
    modules: [
      { kind: 'mast', x: 5, y: 1, w: 1, h: 5 },
      { kind: 'mast', x: 12, y: 2, w: 1, h: 4 },
      { kind: 'catroom', x: 0, y: 2, w: 2, h: 2, slot: 0 },
      { kind: 'catroom', x: 8, y: 4, w: 2, h: 2, slot: 1 },
      { kind: 'cannon', x: 15, y: 4, w: 2, h: 1 },
      { kind: 'shield', x: 13, y: 5, w: 1, h: 1 },
      { kind: 'core', x: 7, y: 7, w: 2, h: 2 },
      { kind: 'catroom', x: 3, y: 7, w: 2, h: 2, slot: 2 },
      { kind: 'engine', x: 1, y: 8, w: 2, h: 1 },
      { kind: 'arcane', x: 12, y: 7, w: 1, h: 1 },
      { kind: 'powder', x: 14, y: 8, w: 1, h: 1 },
    ],
  },
};
