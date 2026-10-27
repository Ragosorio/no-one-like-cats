/**
 * F21 · PH «El plan» (H86) — LEONARDO'S NOTEBOOK, 90 s on `amb.plan` (a new piece: lute and strings, a pavane in D;
 * it cuts dry at 84.0 on «No, wey»), + the return to the ship (R3), 26 s in silence. 0 clicks.
 * Her light brought them; the plan is light + eyes; the threat names only Canelo; she says no. [TEMP-P3, P4, R3]
 */
import type { FilmDef } from '../../../types';
import { moves, shot } from '../../../camera';

const sets = () => import('./sets');

export const F21: FilmDef = {
  id: 'f21',
  title: 'El plan',
  kind: 'interlude',
  track: 'amb.plan',
  loader: { style: 'davinci', caption: 'PELÍCULA' },
  scenes: [
    {
      id: 'indice',
      dur: 6.4,
      style: 'libros',
      set: sets,
      in: { kind: 'fade', dur: 0.8, color: 0x000000 },
      look: { expo: 0.9, warm: 0.12 },
      cam: shot([{ t: 0, x: 1000, y: 580, z: 0 }], [{ t: 4.6, x: 960, y: 620, z: 160, ease: 'inOut' }]),
    },
    {
      id: 'codice1',
      dur: 20.4,
      style: 'davinci',
      set: sets,
      // the camera enters the notebook: its page grows into the frame
      in: { kind: 'objectToSet', dur: 0.4, rect: [760, 600, 400, 60] },
      cam: shot([{ t: 0, x: 960, y: 540, z: 0 }], [{ t: 4.0, x: 760, y: 700, z: 120, ease: 'inOut' }, { t: 9.0, x: 820, y: 480, z: 60, ease: 'inOut' }, { t: 20.4, x: 900, y: 560, z: 40, ease: 'sine' }], [{ t: 0, hand: 1 }]),
      camRm: [{ t: 0, x: 960, y: 540, z: 20 }],
    },
    {
      id: 'culpa',
      dur: 5.6,
      style: 'libros',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      look: { expo: 0.9, warm: 0.1 },
      cam: shot([{ t: 0, x: 1100, y: 520, z: 120 }], [{ t: 5.6, z: 170, ease: 'linear' }]),
    },
    {
      id: 'codice2',
      dur: 24,
      style: 'davinci',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      cam: shot([{ t: 0, x: 600, y: 460, z: 220 }], [{ t: 8.6, x: 620, y: 600, z: 80, ease: 'inOut' }, { t: 10.6, x: 1300, y: 560, z: 120, ease: 'inOut' }, { t: 19.4, x: 1300, z: 120 }, { t: 21, x: 1180, y: 300, z: 300, ease: 'inOut' }]),
      camRm: [{ t: 0, x: 960, y: 540, z: 0 }],
    },
    {
      id: 'retrato',
      dur: 6,
      style: 'libros',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      look: { warm: 0.14 },
      cam: shot([{ t: 0, x: 700, y: 500, z: 160 }], moves.truck(0, 5, 700, 960, 'inOut'), [{ t: 6, z: 220, ease: 'linear' }]),
      camRm: [{ t: 0, x: 960, y: 500, z: 160 }],
    },
    {
      id: 'exige',
      dur: 10,
      style: 'libros',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      look: { expo: 0.9, warm: 0.1 },
      cam: shot([{ t: 0, x: 1000, y: 560, z: 40 }], [{ t: 5.9, z: 60 }, { t: 6.0, x: 1140, y: 520, z: 120, ease: 'hold' }]),
    },
    {
      id: 'pagina',
      dur: 12,
      style: 'davinci',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      cam: shot([{ t: 0, x: 960, y: 540, z: 0 }], [{ t: 5, z: 40, ease: 'sine' }, { t: 12, z: 160, ease: 'in' }]),
    },
    {
      id: 'nowey',
      dur: 6,
      style: 'libros',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      look: { expo: 0.9, warm: 0.1 },
      cam: [{ t: 0, x: 1120, y: 540, z: 140 }],
    },
    {
      id: 'regreso',
      dur: 26,
      style: 'libros',
      set: sets,
      in: { kind: 'fade', dur: 1.0, color: 0x000000 },
      look: { sat: 0.85, warm: -0.04 },
      cam: shot([{ t: 0, x: 1100, y: 600, z: 40 }], [{ t: 4, x: 960, y: 620, z: 120, ease: 'inOut' }, { t: 18.4, z: 140 }, { t: 22, x: 1300, y: 520, z: 60, ease: 'inOut' }]),
    },
  ],
  close: { kind: 'fade', dur: 1.4, color: 0x000000 },
};
