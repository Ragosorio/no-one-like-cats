import { ShipBlueprint } from './ship';

/** Starter ships. Hull rows top→bottom. Modules overwrite hull cells. */
export const BLUEPRINTS: Record<string, ShipBlueprint> = {
  balsa: {
    cols: 12,
    rows: 9,
    hull: [
      '............',
      '............',
      '............',
      '............',
      '..WWWWWWWW..',
      'WWWWWWWWWWWW',
      'WWWWWWWWWWWW',
      '.WWWWWWWWWW.',
      '..WWWWWWWW..',
    ],
    modules: [
      { kind: 'mast', x: 5, y: 0, w: 1, h: 4 },
      { kind: 'catroom', x: 1, y: 3, w: 2, h: 2, slot: 0 },
      { kind: 'catroom', x: 8, y: 3, w: 2, h: 2, slot: 1 },
      { kind: 'cannon', x: 10, y: 4, w: 2, h: 1 },
      { kind: 'core', x: 5, y: 5, w: 2, h: 2 },
      { kind: 'catroom', x: 3, y: 5, w: 2, h: 2, slot: 2 },
    ],
  },
  sparrow: {
    cols: 14,
    rows: 10,
    hull: [
      '..............',
      '..............',
      '..............',
      '......WW......',
      '..WWWWWWWWWW..',
      'WWWWWWWWWWWWWW',
      'WWWIIWWWWIIWWW',
      'WWWWWWWWWWWWWW',
      '.WWWWWWWWWWWW.',
      '...WWWWWWWW...',
    ],
    modules: [
      { kind: 'mast', x: 6, y: 0, w: 1, h: 4 },
      { kind: 'catroom', x: 2, y: 2, w: 2, h: 2, slot: 0 },
      { kind: 'catroom', x: 9, y: 2, w: 2, h: 2, slot: 1 },
      { kind: 'cannon', x: 12, y: 4, w: 2, h: 1 },
      { kind: 'core', x: 6, y: 6, w: 2, h: 2 },
      { kind: 'catroom', x: 3, y: 6, w: 2, h: 2, slot: 2 },
      { kind: 'powder', x: 10, y: 7, w: 1, h: 1 },
    ],
  },
};
