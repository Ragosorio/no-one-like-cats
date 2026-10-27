/**
 * THE DEMO FILM (`?film=demo`): ~47 s, zero clicks, three styles that flow into each other.
 *
 *   I   «La noche estrellada» (Van Gogh)   the sky paints itself over the lighthouse island; Canelo watches from the hill.
 *       The camera cranes down from the sky, pushes in on him, then tilts up and flies into the moon…
 *   ↓   MATCH CUT on the circle: the moon becomes the construction circle of a page of studies.
 *   II  «Estudio del gato» (Da Vinci)      a notebook page by candlelight: the circle and the square draw themselves, the
 *       cat is drawn inside them, the eye, the paw and the tail are measured, notes are written right to left.
 *   ↓   PAGE TURN: under the page, the night.
 *   III «Siempre llueve» (noir realism)    a long take in the rain: from the neon down to the wet street, rack focus from
 *       the drops on the lens to Canelo walking into the lamp's cone; lightning shows someone with a blue lantern at
 *       the end of the street — her light is the only new colour in the mono world.
 *   ↓   IRIS OUT on the lantern → «CONTINUARÁ».
 *
 * The aspect changes with the style: a canvas (1.5) → the full page (1.78) → scope (2.39).
 * Music: silence (the demo carries itself with picture; a film can name a derived variation in `track`).
 */
import type { FilmDef } from '../types';
import { moves, shot } from '../camera';

const LANTERN: [number, number] = [1312, 588];

export const DEMO: FilmDef = {
  id: 'demo',
  title: 'Tres cajas',
  kind: 'demo',
  track: null,
  loader: { style: 'vangogh', caption: 'PELÍCULA · DEMO' },
  scenes: [
    {
      id: 'noche',
      dur: 17,
      style: 'vangogh',
      set: () => import('./noche'),
      aspect: 1.5,
      in: { kind: 'paintSmear', dur: 2.2, dir: 1, tint: 0x1b2a7a, seed: 4 },
      weather: [{ kind: 'wind', particle: 'stroke', amount: 0.55, angle: 0.15, color: 0xf8e27a, z: 1500, seed: 8 }],
      cam: shot(
        [{ t: 0, x: 960, y: 150, z: 0 }],
        moves.crane(0.6, 7.2, 150, 545, 'inOut'),
        [{ t: 7.2, x: 990, ease: 'inOut' }],
        moves.dolly(7.4, 11.6, 0, 170, 'inOut'),
        // the tilt up to the moon and the flight into it
        [
          { t: 11.8, x: 990, y: 545, z: 170 },
          { t: 15.4, x: 1560, y: -70, z: 1020, ease: 'inOut' },
          { t: 17, z: 1130, ease: 'out' },
        ],
      ),
      // «Reducir movimiento»: no flight into the moon — a slow push on the island; the match dissolve finds the moon
      camRm: [
        { t: 0, x: 990, y: 545, z: 0 },
        { t: 14, z: 110, ease: 'sine' },
      ],
      cards: [{ t: 2.0, dur: 4.2, num: 'I', text: 'La noche estrellada', sub: 'una caja donde el cielo se pinta solo', pos: 'high' }],
      subs: [
        { t: 7.0, dur: 3.2, text: 'En una caja, el cielo se pinta solo.' },
        { t: 10.6, dur: 3.6, text: 'Canelo lo mira desde su faro. No sabe que alguien lo estudia.' },
      ],
    },
    {
      id: 'estudio',
      dur: 15,
      style: 'davinci',
      set: () => import('./estudio'),
      aspect: 16 / 9,
      in: { kind: 'match', dur: 1.8, at: [960, 540], anchor: 'moon', seed: 3 },
      cam: shot(
        // on the circle where the moon was, then the page pulls back to show itself on the desk
        [{ t: 0, x: 960, y: 470, z: 100 }],
        [{ t: 5.2, x: 960, y: 540, z: -260, ease: 'inOut' }],
        // a slow glide over the studies
        [{ t: 6.0, x: 960, z: -260 }, { t: 10.5, x: 1130, z: -120, ease: 'inOut' }],
        // and in on the eye, a touch of Dutch angle
        [
          { t: 10.5, y: 540, roll: 0 },
          { t: 14.2, y: 450, z: 170, roll: 0.025, ease: 'inOut' },
        ],
        [{ t: 0, hand: 2.5 }],
      ),
      cards: [{ t: 2.4, dur: 3.6, num: 'II', text: 'Estudio del gato', sub: 'otra caja: aquí todo se mide', pos: [960, 130] }],
      subs: [
        { t: 6.2, dur: 3.4, text: 'En otra caja, alguien lo dibuja para entenderlo.' },
        { t: 10.0, dur: 3.4, text: 'Mide la cola, la pata, el ojo. ¿Qué busca?' },
      ],
    },
    {
      id: 'lluvia',
      dur: 16.5,
      style: 'noir',
      set: () => import('./lluvia'),
      aspect: 2.39,
      in: { kind: 'pageTurn', dur: 1.8, dir: -1, tint: 0xe8d5a9 },
      weather: [
        { kind: 'rain', amount: 0.9, angle: 0.16, ground: 812, seed: 11 },
        { kind: 'fog', amount: 0.5, z: 2400, color: 0x8a94a6, angle: 0.2 },
        { kind: 'rays', amount: 0.55, from: [612, 300], z: 1000, color: 0xffd9a0 },
        { kind: 'lightning', strikes: [9.3], from: [1250, -60], z: 5200, seed: 2 },
      ],
      cam: shot(
        // from the neon's building (in focus) down to the street; the focus follows down to Canelo
        [{ t: 0, x: 1180, y: 170, z: 0, focus: 1800 }],
        moves.crane(0.4, 7.4, 170, 560, 'inOut'),
        [{ t: 7.4, x: 930, z: 110, ease: 'inOut' }],
        moves.rack(3.0, 7.0, 1800, 1000, 'inOut'),
        [
          { t: 9.6, roll: 0, z: 110 },
          { t: 11.4, roll: -0.04, ease: 'inOut' },
          { t: 15.6, z: 250, x: 1000, y: 635, ease: 'inOut' },
        ],
        [{ t: 0, hand: 4 }],
      ),
      cards: [{ t: 1.6, dur: 3.6, num: 'III', text: 'SIEMPRE LLUEVE', sub: 'la última caja de esta noche', pos: [960, 300] }],
      subs: [
        { t: 6.0, dur: 3.0, text: 'Y en otra caja, siempre llueve.' },
        { t: 11.6, dur: 3.4, text: 'Alguien lo espera al final de la calle.' },
      ],
    },
    {
      id: 'fin',
      dur: 4.8,
      style: 'noir',
      set: () => import('./fin'),
      aspect: 2.39,
      in: { kind: 'iris', dur: 1.6, at: LANTERN, anchor: 'lantern', out: true },
      cards: [{ t: 1.0, dur: 3.4, text: 'CONTINUARÁ', pos: 'center', style: 'noir' }],
    },
  ],
  close: { kind: 'fade', dur: 0.8, color: 0x000000 },
};
export { LANTERN };
