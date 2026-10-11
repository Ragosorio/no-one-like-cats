/**
 * H35 part b «Notas al margen» (cine h35_margen, island, after beating the Bibliotecario).
 *
 * Feel: the floor gives way under the whole story. He explains, at home, and the island takes the tone of paper (a
 * page under everything); as he says «notes in the margins», handwriting that isn't anyone's writes itself on the
 * edges of the screen, with the scratch of a quill. WHEN I LOSE goes into the Fonoteca after the scene.
 * The notes stay, small, in the margins of the CARTA (island/night/mapNight.ts). Lines: b35_shhh [4..7].
 */
import { registerCine } from '../registry';
import type { CineScript } from '../types';
import { motif, unlockMoment } from '../sound';

const B = 'b35_shhh';
/** the unknown hand: blue-black ink, a little slanted */
export const HAND = 0x24224f;

export const MARGEN: CineScript = {
  id: 'h35_margen',
  stage: 'island',
  releaseBlend: 2,
  replay: { title: 'Notas al margen', seen: `${B}#b`, order: 35 },
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    { camera: { to: 'species:l_bibliotecario', zoom: 0.95, dur: 2.4, ease: 'inOut' }, async: true },
    { audio: { state: 'silence', fade: 2.5 } },
    { actor: { who: 'species:l_bibliotecario', do: 'emote', arg: 'sleepy' }, after: 0.8 },
    { wait: 1.6 },
    { say: { beat: B, lines: [4, 5] } },
    // a page under everything: the island turns the color of paper
    { world: { to: { exposure: 0.95, tint: 0xf1e6d2, saturation: 0.62, vignette: 0.32, dayLife: 0.4 }, dur: 2.5 }, async: true },
    { say: { beat: B, lines: [6] } },
    { camera: { to: 'home', offset: [-80, -40], zoom: 0.64, dur: 3, ease: 'inOut' }, async: true },
    {
      say: {
        beat: B,
        lines: [7],
        onLine: {
          0: [
            { fx: { id: 'ink', text: '¿y esta isla?', x: 0.17, y: 0.26, size: 64, rot: -0.14, color: HAND, write: 1.3 }, after: 0.7 },
            { call: (c) => void (!c.skipping && motif('pluma')), after: 0.7 },
            { fx: { id: 'ink', text: '(ver folio 000)', x: 0.8, y: 0.72, size: 52, rot: 0.07, color: HAND, write: 1.5 }, after: 2.1 },
            { call: (c) => void (!c.skipping && motif('pluma')), after: 2.1 },
          ],
        },
      },
    },
    // let the second note finish and be read
    { wait: 3 },
    { persist: { beat: `${B}#b` } },
    { call: (c) => void (!c.replay && unlockMoment(['when_i_lose.battle'])) },
    { audio: { state: 'island', fade: 4 } },
  ],
};

registerCine(MARGEN);
