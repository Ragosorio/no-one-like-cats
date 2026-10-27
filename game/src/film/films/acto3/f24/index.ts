/**
 * F24 · PP «Señal pirata» (H88, before L-9 «Esquirla») — THE HACKED BRIEFING, 37.5 s, 0 clicks, `distor.senal`
 * («Señal rota»: DISTOR c1–4, 808 + synth, no drums, its low-pass opening along the briefing; derived). It starts as a
 * normal Library briefing; at 6 s Esquirla's pirate signal takes it: who she is, what she wants (Cerito as THE KEY),
 * her rule ESQUIRLAS shown with the simulator's real shot; HER pencil scratches the signal off the page; LO QUE
 * ARRIESGAMOS, still angry. Reduce flashes: the glitch is a slow sweep, nothing blinks.
 */
import type { FilmDef } from '../../../types';
import { shot } from '../../../camera';

const sets = () => import('./sets');

export const F24: FilmDef = {
  id: 'f24',
  title: 'Señal pirata',
  kind: 'briefing',
  track: 'distor.senal',
  loader: { style: 'tv', caption: 'PRESENTACIÓN · EX LIBRIS' },
  scenes: [
    {
      id: 'pagina',
      dur: 6.4,
      style: 'libros',
      set: sets,
      in: { kind: 'fade', dur: 0.5, color: 0x000000 },
      cam: shot([{ t: 0, x: 960, y: 520, z: 0 }], [{ t: 3.0, z: 0 }, { t: 6.4, x: 940, y: 640, z: 260, ease: 'in' }]),
      camRm: [{ t: 0, x: 960, y: 540, z: 0 }, { t: 6.4, z: 80, ease: 'linear' }],
    },
    {
      id: 'senal',
      dur: 11.4,
      style: 'pirata',
      set: sets,
      in: { kind: 'glitch', dur: 0.8, seed: 7 },
      cam: shot([{ t: 0, x: 960, y: 560, z: 80 }], [{ t: 6, z: 20, ease: 'sine' }, { t: 7.2, x: 1100, y: 560, z: 40, ease: 'inOut' }], [{ t: 0, hand: 2 }]),
    },
    {
      id: 'esquirlas',
      dur: 7.4,
      style: 'pirata',
      set: sets,
      in: { kind: 'glitch', dur: 0.5, seed: 3 },
      cam: shot([{ t: 0, x: 960, y: 560, z: 0 }], [{ t: 2.2, x: 1080, y: 600, z: 160, ease: 'inOut' }], [{ t: 4.6, hand: 0 }, { t: 4.8, hand: 8, ease: 'expoOut' }, { t: 5.6, hand: 1 }]),
      camRm: [{ t: 0, x: 960, y: 560, z: 0 }],
    },
    {
      id: 'tachon',
      dur: 5.4,
      style: 'pirata',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      look: { aberr: 1.0 },
    },
    {
      id: 'riesgo',
      dur: 8.8,
      style: 'libros',
      set: sets,
      in: { kind: 'dissolve', dur: 0.6 },
      cam: [{ t: 0, x: 960, y: 540, z: 0 }, { t: 8.8, z: 40, ease: 'linear' }],
    },
  ],
  close: { kind: 'fade', dur: 1, color: 0x000000 },
};
