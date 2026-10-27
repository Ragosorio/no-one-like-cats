/**
 * F02 · PH «El precio de bajar» (H70; guion: historia-v2/guiones/acto-1/h70-borron.md §F02).
 *
 * STYLE: a SHADOW THEATRE of hands on the Donería's menu wall (Borrón turns the counter lamp: the lamp becomes a
 * projector) with Lotte Reiniger cut-outs when a shadow «becomes» a scene. Shadows are warm dark brown, never black,
 * with a rim of lamp light on the lamp side; cat shadows have lit eyes; every change has preparation → development →
 * exit. Between the theatre's beats, short cuts to the real table in La Borracha's TV cartoon: the consequences.
 * 50 s · 1 optional tap («¡HIC!») · `drunck.resaca` (the synth through a pillow).
 *
 *   0–3.4     lampara   (tv)       Borrón's paw turns the lamp to the wall: a circle of warm light opens on the menu
 *   2.6–15    manos     (sombras)  «Allá arriba éramos manos»: hands write in margins, lines fill by themselves ·
 *                                  «Y el folio cero se nos escapó»: a kitten of static leaps box to box, each box tears
 *   15–18     mesa1     (tv)       at «folio cero» Canelo's tail flame drops; Luzterna, without looking, drifts closer
 *   18–26     gato      (sombras)  THE KEY IMAGE: two hands seek each other, join, the fingers become ears — a cat's
 *                                  head; it opens lit eyes and jumps out of the hands as a cut-out cat
 *   26–30     mesa2     (tv)       Homiau: «Ooooh». Canelo tries a shadow cat with his paws: on the wall, a potato
 *   30–34.5   lapiz     (sombras)  «Pero al bajar, se pierde el lápiz»: the shadow pencil falls and snaps in two
 *   34.5–37   borron    (tv)       Borrón pats his paw for the pencil like for a phone; wipes a tear with his donut
 *   37–46.4   donas     (sombras)  «Y abajo todo se acaba»: shadow donuts vanish one by one, bitten by the dark — ¡HIC!
 *                                  (the tap) — «Y cada vez que pierdes, se te olvida algo»: a line of a card erases
 *   46.4–50   mesa3     (tv)       Luzterna and Canelo look at each other; the projector becomes a lamp again
 *
 * No hints about anyone's mortality (TEMPERATURA pass 3): Borrón explains the price of coming down, nothing else.
 */
import type { FilmDef } from '../../../types';
import { moves, shot } from '../../../camera';
import { tap, v } from '../../../../momentos/score';

const TV43 = 4 / 3;
/** the hiccup (film seconds): it comes on its own; a tap makes it bigger */
export const HIC_T = 40.2;

const sets = () => import('./sets');

export const F02: FilmDef = {
  id: 'f02',
  title: 'El precio de bajar',
  kind: 'interlude',
  track: 'drunck.resaca',
  loader: { style: 'davinci', caption: 'LA BORRACHA · LA DONERÍA' },
  scenes: [
    {
      id: 'lampara',
      dur: 3.4,
      style: 'tv',
      set: () => sets().then((m) => m.lampara),
      aspect: TV43,
      in: { kind: 'fade', dur: 0.6, color: 0x000000 },
      cam: [
        { t: 0, x: 900, y: 560, fov: 1 },
        { t: 1.1, fov: 1.02 },
        { t: 2.6, x: 1000, y: 400, fov: 1.6, ease: 'inOut' },
      ],
      camRm: [
        { t: 0, x: 900, y: 560, fov: 1 },
        { t: 3.4, x: 960, y: 480, fov: 1.15, ease: 'sine' },
      ],
    },
    {
      id: 'manos',
      dur: 12.4,
      style: 'sombras',
      set: () => sets().then((m) => m.manos),
      aspect: TV43,
      // the lit circle on the wall grows into the frame: the lamp became a projector
      in: { kind: 'objectToSet', dur: 0.8, rect: [704, 172, 512, 512] },
      cam: shot(moves.dolly(0, 12.4, 0, 110, 'sine'), [{ t: 0, hand: 1.5 }]),
      subs: [
        { t: 1.0, dur: 3.0, text: 'Allá arriba éramos manos.', who: 'Borrón' },
        { t: 7.6, dur: 3.0, text: 'Y el folio cero se nos escapó.', who: 'Borrón' },
      ],
    },
    {
      id: 'mesa1',
      dur: 3,
      style: 'tv',
      set: () => sets().then((m) => m.mesa1),
      aspect: TV43,
      in: { kind: 'cut', dur: 0 },
      cam: [
        { t: 0, x: 960, y: 560, fov: 1.06 },
        { t: 3, fov: 1.12, ease: 'sine' },
      ],
    },
    {
      id: 'gato',
      dur: 8,
      style: 'sombras',
      set: () => sets().then((m) => m.gato),
      aspect: TV43,
      in: { kind: 'cut', dur: 0 },
      cam: shot(moves.dolly(0, 8, 60, 190, 'sine'), [{ t: 0, hand: 1.2 }]),
      subs: [
        { t: 0.4, dur: 3.2, text: 'Para cruzar cajas hay que ser gato.', who: 'Borrón' },
        { t: 4.4, dur: 3.2, text: 'Así que nos escribimos gatos.', who: 'Borrón' },
      ],
    },
    {
      id: 'mesa2',
      dur: 4,
      style: 'tv',
      set: () => sets().then((m) => m.mesa2),
      aspect: TV43,
      in: { kind: 'cut', dur: 0 },
      cam: [{ t: 0, x: 960, y: 540, fov: 1 }],
    },
    {
      id: 'lapiz',
      dur: 4.5,
      style: 'sombras',
      set: () => sets().then((m) => m.lapiz),
      aspect: TV43,
      in: { kind: 'cut', dur: 0 },
      cam: shot(moves.dolly(0, 4.5, 120, 200, 'sine'), [{ t: 0, hand: 1.2 }]),
      subs: [{ t: 0.4, dur: 3.4, text: 'Pero al bajar, se pierde el lápiz.', who: 'Borrón' }],
    },
    {
      id: 'borron',
      dur: 2.5,
      style: 'tv',
      set: () => sets().then((m) => m.borron),
      aspect: TV43,
      in: { kind: 'cut', dur: 0 },
      cam: [
        { t: 0, x: 960, y: 560, fov: 1.15 },
        { t: 2.5, fov: 1.22, ease: 'sine' },
      ],
    },
    {
      id: 'donas',
      dur: 9.4,
      style: 'sombras',
      set: () => sets().then((m) => m.donas),
      aspect: TV43,
      in: { kind: 'cut', dur: 0 },
      cam: shot(moves.dolly(0, 9.4, 60, 170, 'sine'), [{ t: 0, hand: 1.2 }]),
      subs: [
        { t: 0.4, dur: 2.8, text: 'Y abajo todo se acaba. ¡Hic!', who: 'Borrón' },
        { t: 4.6, dur: 3.4, text: 'Y cada vez que pierdes, se te olvida algo.', who: 'Borrón' },
      ],
    },
    {
      id: 'mesa3',
      dur: 3.6,
      style: 'tv',
      set: () => sets().then((m) => m.mesa3),
      aspect: TV43,
      in: { kind: 'cut', dur: 0 },
      cam: [
        { t: 0, x: 960, y: 540, fov: 1.08 },
        { t: 3.6, x: 940, fov: 1, ease: 'sine' },
      ],
    },
  ],
  score: [
    // ¡HIC! (optional): the hiccup always comes at HIC_T; a tap makes the shadows jump higher (the set reads judged('hic'))
    tap(HIC_T, { id: 'hic', label: '¡HIC!', anchor: [1300, 260] }, { great: [v('ring', { at: [960, 520], r1: 360 })], hit: [v('ring', { at: [960, 520], r1: 260 })] }),
  ],
  close: { kind: 'fade', dur: 0.8, color: 0x000000 },
};
