/**
 * F22 · PP «La corrección» (H87, before the Correctors) — a TECHNICAL DRAWING white on white, 44 s, 0 clicks,
 * `no_wey.nodije` («Lo que no dije»: No wey c45–48, the melody alone ×2, derived; it plays whole). DÓNDE (the dock,
 * 1:100) · QUÉ PASA (a fleet of twelve identical ships; the real range of a shot) · POR QUÉ (the dossier: «una farera
 * muerta que habla y su tripulación · ERRORES: 6») · RIVAL Y REGLA (CORRECCIÓN: a module goes white, her light gives the
 * colour back) · she takes the helm with her beam, Canelo at 60 % sits down · LO QUE ARRIESGAMOS in her hand, staining
 * the white («Esta batalla la mando YO.»). It never names her; she never writes herself into the list.
 */
import type { FilmDef } from '../../../types';
import { moves, shot } from '../../../camera';

const sets = () => import('./sets');

export const F22: FilmDef = {
  id: 'f22',
  title: 'La corrección',
  kind: 'briefing',
  track: 'no_wey.nodije',
  loader: { style: 'default', caption: 'PRESENTACIÓN · EL MUELLE' },
  scenes: [
    {
      id: 'plano',
      dur: 5.6,
      style: 'tecnico',
      set: sets,
      in: { kind: 'fade', dur: 0.6, color: 0xf6f7f8 },
      cam: shot([{ t: 0, x: 960, y: 600, z: -40 }], [{ t: 5.6, x: 980, y: 560, z: 60, ease: 'sine' }]),
    },
    {
      id: 'flota',
      dur: 6.6,
      style: 'tecnico',
      set: sets,
      in: { kind: 'dissolve', dur: 0.4 },
      // the camera travels over the fleet in plan, then down to the elevation
      cam: shot([{ t: 0, x: 760, y: 360, z: 160 }], moves.truck(0, 3.2, 760, 1160, 'inOut'), [{ t: 3.4, x: 1160, y: 360, z: 160 }, { t: 6.2, x: 900, y: 700, z: 40, ease: 'inOut' }]),
      camRm: [{ t: 0, x: 960, y: 540, z: 0 }],
    },
    {
      id: 'expediente',
      dur: 6.2,
      style: 'tecnico',
      set: sets,
      in: { kind: 'dissolve', dur: 0.4 },
      cam: shot([{ t: 0, x: 900, y: 520, z: 60 }], [{ t: 4.0, x: 960, y: 560, z: 0, ease: 'inOut' }, { t: 4.1, hand: 6 }, { t: 4.6, hand: 0 }]),
      camRm: [{ t: 0, x: 960, y: 560, z: 0 }],
    },
    {
      id: 'regla',
      dur: 8.4,
      style: 'tecnico',
      set: sets,
      in: { kind: 'dissolve', dur: 0.4 },
      cam: shot([{ t: 0, x: 960, y: 560, z: 0 }], [{ t: 4.6, z: 0 }, { t: 6.4, x: 760, y: 560, z: 140, ease: 'inOut' }]),
    },
    {
      id: 'proa',
      dur: 4.6,
      style: 'libros',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      cam: shot([{ t: 0, x: 1000, y: 600, z: 40 }], [{ t: 4.6, x: 1080, z: 100, ease: 'sine' }], [{ t: 0, hand: 2 }]),
    },
    {
      id: 'canelo',
      dur: 5.0,
      style: 'libros',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      cam: shot([{ t: 0, x: 900, y: 700, z: 260 }], [{ t: 5, z: 300, ease: 'linear' }], [{ t: 0, hand: 1.5 }]),
    },
    {
      id: 'riesgo',
      dur: 9.0,
      style: 'tecnico',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      cam: [{ t: 0, x: 960, y: 540, z: 0 }],
    },
  ],
  close: { kind: 'fade', dur: 1, color: 0x000000 },
};
