/**
 * H85 · PH «La oscuridad» (after «La biblioteca se derrumba») — her bravest scene, 91 s, 0 clicks, no music (the
 * script: «ninguna»): dust, her lantern's click, La Mano's dripping steps, Cerito's purr (the game's synthesized SFX
 * through the 'sound' verb). The Library's watercolour in the dark → black with the paper's texture (never more than
 * 1.5 s without a point of reference) → the crew's eyes → the door and the wave of blue → the crane of light → the ship.
 * The scene tells HER courage, not her fragility: nothing physical about her; she trembles because she is afraid.
 */
import type { FilmDef } from '../../../types';
import { at, v } from '../../../../momentos/score';
import { sceneTimeline } from '../../../timeline';
import { shot } from '../../../camera';

const sets = () => import('./sets');

const DEF: FilmDef = {
  id: 'h85_oscuridad',
  title: 'La oscuridad',
  kind: 'interlude',
  track: null,
  loader: { style: 'davinci', caption: 'PELÍCULA' },
  scenes: [
    {
      id: 'pasillo',
      dur: 10.4,
      style: 'libros',
      set: sets,
      in: { kind: 'fade', dur: 1.0, color: 0x000000 },
      look: { expo: 0.85, sat: 0.75, warm: -0.1 },
      cam: shot([{ t: 0, x: 760, y: 600, z: 0, hand: 2 }], [{ t: 3.2, x: 900, z: 40, ease: 'inOut' }, { t: 4.6, z: 40 }, { t: 7.0, x: 980, y: 680, z: 220, ease: 'inOut' }]),
    },
    {
      id: 'sombra',
      dur: 5.4,
      style: 'libros',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      look: { expo: 0.85, sat: 0.7, warm: -0.1 },
      cam: shot([{ t: 0, x: 1500, y: 560, z: 260 }], [{ t: 5.4, z: 320, ease: 'linear' }]),
    },
    {
      id: 'decide',
      dur: 5.4,
      style: 'libros',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      look: { expo: 0.85, sat: 0.75, warm: -0.1 },
      cam: shot([{ t: 0, x: 1180, y: 520, z: 120 }], [{ t: 5.4, z: 200, ease: 'linear' }]),
    },
    {
      id: 'apaga',
      dur: 3.4,
      style: 'libros',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      look: { expo: 0.85, sat: 0.75 },
      cam: [{ t: 0, x: 900, y: 420, z: 520 }],
      camRm: [{ t: 0, x: 900, y: 420, z: 520 }],
    },
    {
      id: 'negro',
      dur: 11,
      style: 'libros',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      look: { expo: 1, vig: 0.6, sat: 1 },
      cam: [{ t: 0, x: 960, y: 560, z: 0 }, { t: 11, z: 60, ease: 'linear' }],
    },
    {
      id: 'ojos',
      dur: 17,
      style: 'libros',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      look: { expo: 1, vig: 0.6, sat: 1 },
      cam: shot([{ t: 0, x: 1100, y: 600, z: 0 }], [{ t: 12, x: 760, ease: 'inOut' }], [{ t: 0, hand: 1.5 }]),
    },
    {
      id: 'puerta',
      dur: 8.4,
      style: 'libros',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      look: { sat: 0.85, warm: -0.06 },
      cam: shot([{ t: 0, x: 960, y: 620, z: 160 }], [{ t: 8.4, z: 80, ease: 'sine' }]),
    },
    {
      id: 'reverencia',
      dur: 10.4,
      style: 'libros',
      set: sets,
      in: { kind: 'cut', dur: 0 },
      look: { sat: 0.85, warm: -0.06 },
      cam: shot([{ t: 0, x: 980, y: 560, z: 160 }], [{ t: 2.0, x: 1350, ease: 'inOut' }, { t: 4.4, x: 1000, ease: 'inOut' }, { t: 10.4, z: 200, ease: 'linear' }]),
      camRm: [{ t: 0, x: 1000, y: 560, z: 120 }],
    },
    {
      id: 'grua',
      dur: 8.4,
      style: 'libros',
      set: sets,
      in: { kind: 'dissolve', dur: 0.6 },
      look: { sat: 0.85, warm: -0.06 },
      cam: shot([{ t: 0, x: 700, y: 560, z: 0 }], [{ t: 8.4, x: 1200, ease: 'inOut' }]),
    },
    {
      id: 'barco',
      dur: 12,
      style: 'libros',
      set: sets,
      in: { kind: 'dissolve', dur: 0.6 },
      look: { sat: 0.85, warm: -0.04 },
      cam: shot([{ t: 0, x: 980, y: 640, z: 120 }], [{ t: 12, x: 900, z: 220, ease: 'sine' }]),
    },
  ],
  close: { kind: 'fade', dur: 1.4, color: 0x000000 },
};
const T = (id: string, t: number) => (sceneTimeline(DEF).scenes.find((s) => s.id === id)?.start ?? 0) + t;
export const H85_OSCURIDAD: FilmDef = {
  ...DEF,
  score: [
    // her name for him, the only line before the dark
    // La Mano's steps, dripping ink (the nib, low), closer and closer
    at(T('sombra', 0.8), v('sound', { name: 'nib', pitch: 0.6 })),
    at(T('sombra', 2.4), v('sound', { name: 'nib', pitch: 0.62 })),
    at(T('sombra', 4.0), v('sound', { name: 'nib', pitch: 0.64 })),
    at(T('decide', 2.0), v('sound', { name: 'nib', pitch: 0.66 })),
    at(T('decide', 4.0), v('sound', { name: 'nib', pitch: 0.68 })),
    // the click: she turns it off
    at(T('apaga', 2.0), v('sound', { name: 'tick', pitch: 0.8 })),
    // the pale outline passes a metre away
    at(T('ojos', 10.0), v('sound', { name: 'nib', pitch: 0.7 })),
    at(T('ojos', 12.0), v('sound', { name: 'nib', pitch: 0.66 })),
    at(T('ojos', 14.0), v('sound', { name: 'nib', pitch: 0.6 })),
    // the click: the light again; Cerito purrs
    at(T('puerta', 1.4), v('sound', { name: 'tick', pitch: 1.1 })),
    at(T('puerta', 3.2), v('sound', { name: 'purr' })),
    at(T('grua', 0.6), v('sound', { name: 'paper', pitch: 0.8 })),
  ],
};
