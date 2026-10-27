/**
 * F18 · PP «La Encuadernadora» (H83, before L-5) — a POP-UP BOOK briefing, 35.5 s, 0 clicks, `no_wey.melodia` (the isle
 * of No wey c45–52, derived; it plays whole, to its own ending). DÓNDE (EX LIBRIS) · QUÉ PASA (La Mano hides where ink
 * still obeys) · POR QUÉ (if she writes she can catch Cerito) · RIVAL (La Encuadernadora sews tales by force) · SU REGLA
 * (CAPÍTULOS: three pop-up pages, three turns each, over a real simulator shot) · Canelo's flame shadow and her beam ·
 * LO QUE ARRIESGAMOS in her hand. Guion: historia-v2/guiones/acto-3/h83-ex-libris.md.
 */
import type { FilmDef } from '../../../types';
import { moves, shot } from '../../../camera';

const sets = () => import('./sets');

export const F18: FilmDef = {
  id: 'f18',
  title: 'La Encuadernadora',
  kind: 'briefing',
  track: 'no_wey.melodia',
  loader: { style: 'davinci', caption: 'PRESENTACIÓN · EX LIBRIS' },
  scenes: [
    {
      id: 'libro',
      dur: 9.8,
      style: 'popup',
      set: sets,
      in: { kind: 'fade', dur: 0.6, color: 0x000000 },
      // high over the opening book, then down between the paper floors (F18-2)
      cam: shot([{ t: 0, x: 960, y: 470, z: -60, fov: 1 }], moves.crane(3.6, 8.6, 470, 600, 'inOut'), moves.dolly(3.6, 9.8, -60, 230, 'inOut'), [{ t: 0, hand: 1.5 }]),
      camRm: [{ t: 0, x: 960, y: 520, z: 0 }, { t: 9.8, z: 90, ease: 'linear' }],
    },
    {
      id: 'aguja',
      dur: 4.2,
      style: 'popup',
      set: sets,
      in: { kind: 'dissolve', dur: 0.4 },
      cam: shot([{ t: 0, x: 900, y: 600, z: 120 }], [{ t: 4.2, x: 960, z: 200, ease: 'sine' }]),
    },
    {
      id: 'rival',
      dur: 5.6,
      style: 'popup',
      set: sets,
      in: { kind: 'dissolve', dur: 0.5 },
      // a low angle: she rises toward the lens
      cam: shot([{ t: 0, x: 960, y: 640, z: 60, fov: 1.04 }], moves.crane(0, 2, 640, 560, 'expoOut'), [{ t: 5.6, z: 120, ease: 'sine' }]),
      camRm: [{ t: 0, x: 960, y: 580, z: 60 }],
    },
    { id: 'cap1', dur: 2.6, style: 'popup', set: sets, in: { kind: 'pageTurn', dur: 0.7, dir: -1, tint: 0xf5efe2 } },
    { id: 'cap2', dur: 2.4, style: 'popup', set: sets, in: { kind: 'pageTurn', dur: 0.7, dir: -1, tint: 0xf5efe2 } },
    { id: 'cap3', dur: 2.8, style: 'popup', set: sets, in: { kind: 'pageTurn', dur: 0.7, dir: -1, tint: 0xf5efe2 } },
    {
      id: 'pliegue',
      dur: 11.1,
      style: 'libros',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      cam: shot([{ t: 0, x: 1040, y: 600, z: 140 }], [{ t: 3.2, x: 1100, z: 60, ease: 'inOut' }, { t: 11.1, z: 40, ease: 'linear' }], [{ t: 0, hand: 2 }]),
    },
  ],
  close: { kind: 'fade', dur: 1, color: 0x000000 },
};
