/**
 * H31 «el reflejo» (cine reflejo, region stage of regions/reflejo.ts — the visit IS this scene; home afterwards).
 *
 * Night on the open sea seen from your faro: the stars keep falling UP out of the water while the camera climbs;
 * it tilts down and there, in the water, an island of books glows upside down (drive 'ghost') on the arc cell;
 * it looks up — nothing; Luzterna, three short lines; home. ~26 s. YONOSE's intro loop at −10 dB when it exists.
 */
import { registerCine } from '../registry';
import type { CineScript } from '../types';
import { audioApi } from '../../audio/api';
import { cueBest, motif } from '../sound';

export const REFLEJO: CineScript = {
  id: 'reflejo',
  stage: 'region',
  releaseBlend: 1,
  replay: { title: 'El reflejo', seen: 'b31_reflejo', order: 31.2, region: 'reflejo', enters: true },
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    { audio: { ambience: 'night_astral', level: 0.85, fade: 1.5 } },
    {
      call: (c) => {
        // the arc's song, far away under the night (doc 18 §5.2 H31): only if its quiet version exists
        const cued = cueBest(['yonose_todo.menu_loop', 'yonose_todo.ambient'], { fadeIn: 3, quantize: 'now' });
        if (!cued) return audioApi.setState('silence', { fade: 1.5 });
        audioApi.duck(true, 10, 'reflejo');
        // however the scene ends, the cue lets go and the duck comes back up
        c.own(() => {
          audioApi.duck(false, 10, 'reflejo');
          audioApi.release(3);
        });
      },
    },
    // at the lamp…
    { camera: { to: [0, 9, -14], yaw: 0.15, pitch: 0.12, dist: 12, dur: 0 } },
    { wait: 0.8 },
    // …climbing over the sea while the stars rise out of the water
    { camera: { to: [0, 22, -40], yaw: 0.1, pitch: 0.02, dist: 30, dur: 6, ease: 'inOut' }, async: true },
    { fx: { id: 'stars', at: [0, 0, -45], n: 50, spread: 45, up: 6, life: 5 } },
    { fx: { id: 'stars', at: [10, 0, -70], n: 40, spread: 40, up: 7, life: 5 }, after: 2 },
    { fx: { id: 'stars', at: [-10, 0, -55], n: 40, spread: 45, up: 6, life: 5 }, after: 2.2 },
    // down to the water: something glows in it
    { camera: { to: [0, -2, -66], yaw: 0, pitch: 0.42, dist: 46, dur: 4.5, ease: 'inOut' }, async: true, after: 0.6 },
    { drive: { id: 'ghost', to: 1, dur: 4, ease: 'in' }, after: 1.2 },
    { call: (c) => void (!c.skipping && motif('arco')) },
    { say: { text: [['LUZTERNA', 'Ahí, en el agua. Una isla entera hecha de libros… al revés.']] } },
    // and up there: nothing
    { camera: { to: [0, 16, -70], yaw: 0.05, pitch: 0.08, dist: 58, dur: 4, ease: 'inOut' }, async: true },
    { fx: { id: 'stars', at: [0, 0, -66], n: 60, spread: 30, up: 8, life: 5 }, after: 1 },
    { say: { text: [['LUZTERNA', 'Y arriba… nada. Solo existe en el reflejo. Como mis ganas de hacer ejercicio.']] }, after: 2.2 },
    { camera: { to: [0, 6, -30], yaw: -0.25, pitch: 0.22, dist: 44, dur: 3.5, ease: 'inOut' }, async: true },
    { say: { text: [['LUZTERNA', 'Mañana zarpamos. Hoy no. Hoy me da miedo. …Un poquito.']] }, after: 1.4 },
    { wait: 1.2 },
  ],
};

registerCine(REFLEJO);
