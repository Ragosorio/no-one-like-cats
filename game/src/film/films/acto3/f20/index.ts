/**
 * F20 · PP «El índice» (H85, before «La biblioteca se derrumba») — GERMAN EXPRESSIONISM, 32.6 s, 0 clicks,
 * `fut.fosa.latido` (La fosa · niebla + a heartbeat, derived). The open book's pages lean toward the gutter (straight
 * with «Reducir movimiento»). DÓNDE (EL ÍNDICE) · QUÉ PASA (Cerito's first card is here) · POR QUÉ (it can say who wrote
 * him) · RIVAL Y REGLA (the Library collapses: hold 4 turns — the simulator's falls on a ship, a painted tally) ·
 * Canelo's flame like a candle in a draught, her beam warming it · LO QUE ARRIESGAMOS (Canelo's danger said in full).
 */
import type { FilmDef } from '../../../types';
import { moves, shot } from '../../../camera';

const sets = () => import('./sets');

export const F20: FilmDef = {
  id: 'f20',
  title: 'El índice',
  kind: 'briefing',
  track: 'fut.fosa.latido',
  loader: { style: 'bass', caption: 'PRESENTACIÓN · EL ÍNDICE' },
  look: { grain: 0.07 },
  scenes: [
    {
      id: 'pasillo',
      dur: 4.6,
      style: 'expresionismo',
      set: sets,
      in: { kind: 'fade', dur: 0.5, color: 0x000000 },
      cam: shot([{ t: 0, x: 960, y: 540, z: -40, roll: -0.03 }], moves.dolly(0, 4.6, -40, 160, 'in'), moves.dutch(0, 4.6, -0.06)),
      camRm: [{ t: 0, x: 960, y: 540, z: 0 }],
    },
    {
      id: 'fichero',
      dur: 5.2,
      style: 'expresionismo',
      set: sets,
      in: { kind: 'dissolve', dur: 0.4 },
      cam: shot([{ t: 0, x: 980, y: 560, z: 0, roll: 0.04 }], [{ t: 1.0, z: 0 }, { t: 3.2, x: 1020, y: 620, z: 280, ease: 'inOut' }]),
      camRm: [{ t: 0, x: 1000, y: 600, z: 120 }],
    },
    {
      id: 'ficha',
      dur: 4.4,
      style: 'expresionismo',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      // the lens stays focused far behind the card: nothing can be read yet
      cam: shot([{ t: 0, focus: 1700, z: 0, roll: -0.05 }], [{ t: 4.4, z: 60, ease: 'linear' }]),
      camRm: [{ t: 0, focus: 1700, z: 0 }],
    },
    {
      id: 'derrumbe',
      dur: 7.8,
      style: 'expresionismo',
      set: sets,
      in: { kind: 'dissolve', dur: 0.4 },
      cam: shot([{ t: 0, x: 960, y: 560, z: 0, roll: 0.05 }], moves.dutch(2.0, 3.2, -0.08), [{ t: 2.2, hand: 0 }, { t: 2.6, hand: 10, ease: 'expoOut' }, { t: 3.6, hand: 2 }]),
      camRm: [{ t: 0, x: 960, y: 560, z: 0 }],
    },
    {
      id: 'canelo',
      dur: 11.4,
      style: 'libros',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      look: { expo: 0.92, sat: 0.8, warm: -0.04 },
      cam: shot([{ t: 0, x: 900, y: 620, z: 200 }], [{ t: 3.6, x: 960, y: 560, z: 40, ease: 'inOut' }], [{ t: 0, hand: 2.5 }]),
    },
  ],
  close: { kind: 'fade', dur: 1, color: 0x000000 },
};
