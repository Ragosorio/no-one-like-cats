/**
 * F19 · PH «Lo que se derrama, se termina» (H84, after the stories) — a GUSTAVE DORÉ engraving with fog, 75.8 s,
 * 0 clicks, `fut.fosa.niebla` (La fosa re-mixed for the forest: a far howl in the fog; derived) that is CUT on the F of
 * the FIN (total silence to the end). The FIN falls on the Wolf — neither a ghost nor her friend [TEMP-P3]; she says
 * nothing about herself. Then the hard cut to the page of the other Canelo (C8), his flame (serious), «borrador».
 */
import type { FilmDef } from '../../../types';
import { moves, shot } from '../../../camera';

const sets = () => import('./sets');
const fog = (amount: number, z = 1300) => ({ kind: 'fog' as const, amount, z, color: 0xe8e4dc });

export const F19: FilmDef = {
  id: 'f19',
  title: 'Lo que se derrama, se termina',
  kind: 'interlude',
  track: 'fut.fosa.niebla',
  loader: { style: 'silent', caption: 'PELÍCULA' },
  scenes: [
    {
      id: 'libro',
      dur: 6.6,
      style: 'libros',
      set: sets,
      in: { kind: 'fade', dur: 0.6, color: 0x000000 },
      look: { sat: 0.3 },
      cam: shot([{ t: 0, x: 900, y: 560, z: 0 }], [{ t: 6.6, x: 1200, y: 600, z: 120, ease: 'inOut' }]),
    },
    {
      id: 'huellas',
      dur: 6.4,
      style: 'dore',
      set: sets,
      // the engraving «enters» from the prints
      in: { kind: 'inkBleed', dur: 1.0, at: [1500, 760], tint: 0x14100e, seed: 4 },
      weather: [fog(0.5)],
      cam: shot([{ t: 0, x: 700, y: 640, z: 60 }], moves.truck(0, 6.4, 700, 1300, 'inOut'), [{ t: 0, hand: 1.5 }]),
      camRm: [{ t: 0, x: 1100, y: 620, z: 60 }],
    },
    {
      id: 'lobo',
      dur: 5.4,
      style: 'dore',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      weather: [fog(0.4)],
      // contrapicado: low, looking up at him over the mushroom
      cam: shot([{ t: 0, x: 900, y: 640, z: 20, fov: 1.02, roll: 0.04 }], [{ t: 5.4, y: 600, z: 90, ease: 'sine' }]),
      camRm: [{ t: 0, x: 900, y: 620, z: 40 }],
    },
    {
      id: 'general',
      dur: 4.4,
      style: 'dore',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      weather: [fog(0.45)],
      cam: [{ t: 0, x: 960, y: 560, z: -80 }, { t: 4.4, z: -60, ease: 'linear' }],
    },
    {
      id: 'mano',
      dur: 6.4,
      style: 'dore',
      set: sets,
      in: { kind: 'dissolve', dur: 0.6 },
      weather: [fog(0.7)],
      cam: shot([{ t: 0, x: 1400, y: 600, z: 60 }], [{ t: 6.4, x: 1260, z: 120, ease: 'inOut' }]),
    },
    {
      id: 'margen',
      dur: 4.4,
      style: 'dore',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      weather: [fog(0.4)],
      cam: [{ t: 0, x: 1340, y: 640, z: 420 }, { t: 4.4, z: 460, ease: 'linear' }],
      camRm: [{ t: 0, x: 1340, y: 640, z: 420 }],
    },
    {
      id: 'fin',
      dur: 6.4,
      style: 'dore',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      weather: [fog(0.55)],
      cam: shot([{ t: 0, x: 1140, y: 560, z: 120 }], [{ t: 2.6, z: 140 }, { t: 6.4, x: 1060, y: 520, z: 40, ease: 'inOut' }]),
    },
    {
      id: 'garbancito',
      dur: 11.4,
      style: 'dore',
      set: sets,
      in: { kind: 'dissolve', dur: 0.5 },
      weather: [fog(0.5)],
      cam: shot([{ t: 0, x: 820, y: 720, z: 300 }], [{ t: 4.6, x: 820, z: 300 }, { t: 6.0, x: 400, y: 680, z: 220, ease: 'inOut' }, { t: 11.4, z: 240, ease: 'linear' }]),
    },
    {
      id: 'va',
      dur: 3.0,
      style: 'dore',
      set: sets,
      in: { kind: 'dissolve', dur: 0.5 },
      weather: [fog(0.75)],
      cam: [{ t: 0, x: 1300, y: 600, z: 0 }],
    },
    {
      id: 'grito',
      dur: 12,
      style: 'libros',
      set: sets,
      // corte inmediato, sin transición: the engraving ends at once
      in: { kind: 'cut', dur: 0 },
      cam: shot([{ t: 0, x: 960, y: 560, z: 0, hand: 4 }], [{ t: 1.0, hand: 1.5 }, { t: 2.0, x: 860, y: 700, z: 200, ease: 'inOut' }, { t: 6.8, z: 220 }, { t: 7.4, x: 780, y: 660, z: 420, ease: 'inOut' }]),
      camRm: [{ t: 0, x: 900, y: 640, z: 120 }],
    },
    {
      id: 'borrador',
      dur: 12,
      style: 'libros',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      cam: shot([{ t: 0, x: 980, y: 600, z: 40 }], [{ t: 8, x: 900, z: 60, ease: 'sine' }, { t: 12, z: 160, ease: 'inOut' }]),
    },
  ],
  close: { kind: 'fade', dur: 1.2, color: 0x000000 },
};
