/**
 * H31 part b «Desde el faro» (cine h31_faro, island): you tapped the faro. Up there the beam stops sweeping and turns
 * outward — the lagoons show a reflection of something that isn't there — and the camera follows the light out to
 * sea, toward where the Primer Mar's faro has always pointed. Then the story sails to «el reflejo» (3D).
 * Lines: historia.json › b31_estrellas [4..6]. Persists b31_estrellas#b at the end.
 */
import { registerCine } from '../registry';
import type { CineScript } from '../types';

const B = 'b31_estrellas';
/** out to sea, up-left on screen: the same bearing the island of books will show up on at dawn */
export const FARO_BEARING = 3.45;

export const FARO: CineScript = {
  id: 'h31_faro',
  stage: 'island',
  releaseBlend: 1,
  replay: { title: 'Desde el faro', seen: `${B}#b`, order: 31.1 },
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    // up the tower, close to the lamp
    { camera: { to: 'faro', offset: [0, -40], zoom: 1.05, dur: 2.4, ease: 'inOut' }, async: true },
    // the beam stops going round and turns outward, slowly
    { fx: { id: 'aim', angle: FARO_BEARING }, after: 0.8 },
    { wait: 1.6 },
    { say: { beat: B, lines: [4], onLine: { 0: { fx: { id: 'reflect', to: 1 }, after: 1.1 } } } },
    // follow the light out over the sea
    { camera: { to: 'faro', offset: [-560, -230], zoom: 0.6, dur: 4.2, ease: 'inOut' }, async: true },
    { audio: { stinger: 'reveal', gain: 0.55 }, after: 0.5 },
    { say: { beat: B, lines: [5, 6], onLine: { 1: { fx: { id: 'burst', n: 10, dur: 2.5, far: 30 }, after: 0.4 } } } },
    { persist: { beat: `${B}#b` } },
    { wait: 0.8 },
  ],
};

registerCine(FARO);
