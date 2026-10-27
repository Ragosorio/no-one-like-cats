/**
 * F29 · PC NO G@ME NO LIF€ «El show» (H91, closes the Firma battle — `reason: 'momento'`; guion:
 * historia-v2/guiones/acto-4/h91-firma.md §F29 · ficha: 03-peliculas.md F29). COMPLETE: c1 → end (3:25.9).
 * 90 BPM (felt at 180), F♯m, 1 bar = 2.667 s, c1 = 0 s (musica-v2/no-game-no-life.md).
 *
 * STYLE: a POP VIDEOCLIP THAT TURNS INTO A VIDEOGAME. It opens as a game's start screen, goes on as stadium video (LED
 * walls, confetti, a crane, fans' vertical phones) and, with every layer of distortion, THE HUD EATS MORE OF THE SHOW.
 * The picture follows the song's distortion curve — the «Future Flu» synth enters four times and stays longer each time:
 *
 *   layer 1  c14.021–19  (5 bars)   the HUD fails for an instant: JUGADOR 1: FIRMA · PREMIO: CERITO — and comes back
 *   layer 2  c27–35      (8 bars)   the game becomes a trap: the two side screens answer each other bar by bar
 *                                    (arpeggio = the show · Tap = the HUD), c28–35
 *   layer 3  c38–45      (7 bars)   pirate signal: Esquirla hijacks the show, the stadium goes 8-bit (arcade level)
 *   layer 4  c57–77      (20 bars)  it never leaves: the frame cracks, the rig falls, the tear — and the ping-pong
 *                                    island / stadium, bar by bar (arpeggio = the island · Tap = the stadium), c66–77
 *
 *   c1–5    inicio      the dark stadium; the LED wall is a game's START SCREEN · PRESS START blinks · c3 a spot comes
 *                       on, the camera pushes in; the spot finds the glass cube: Cerito inside              [P]
 *   c5–7    cajas       among the flight cases, the crew in disguise: Luzterna sees the cube (her lantern tilts by
 *                       itself toward it); Canelo looks at the buffet                                          [C]
 *   c7–8    entrada     first drum hit: crane down, Firma rises from the trapdoor, a cover pose on every kick
 *   c8–9    malo        left screen: Gato Malo on a giant inflatable bunny, waving his coloured nails
 *   c9–11   tailor      right screen: Tailor Swift spins, crystal mic, throws a bracelet to the crowd
 *   c11–13  emiau       a fan's phone (9:16): EMIAU, the opener, on the runway, his hand gestures
 *   c13–14  premio      Firma opens her arms toward the cube like someone presenting an award               [A]
 *   c14–15  falla       LAYER 1: the HUD fails an instant over the three screens                             [P]
 *   c15–17  luz         close on Luzterna lit by the flicker: she notices, grips the lantern                 [C]
 *   c17–19  cerito      the cube: Cerito's paws on the glass, looking toward her light; behind, Canelo eats  [M]
 *   c19–23  luces       ¡LUCES!: a sea of phone lights, confetti on the beat, a crane over the stage, fans' phones
 *   c23–27  vigas       the crew climbs the light rig beam by beam; Luzterna's beam passes for one more spotlight
 *   c27–35  trampa      LAYER 2: the two screens answer each other (show / HUD): PREMIO: CERITO · CARGANDO SHOW…
 *                       70 % · JUGADOR 2: ? over the crew frozen on the beams · c34 both HUD
 *   c35–38  tapa        Firma lifts the cube's lid to the crowd: «¡Y ahora, nuestro invitado sin forma!»
 *   c38–39  pirata      LAYER 3: Esquirla's glitch face covers Firma; the stadium dissolves to 8-bit from the floor
 *                       up · ESTA LLAVE ES NUESTRA
 *   c39–45  arcade      a platform level: Comecroquetas eats the buffet's croquettes, our ship enters, the lantern's
 *                       light is a power-up; Canelo, tired, stays behind and leans on the ship (flame small); c41 the
 *                       crew advances, Esquirla's glitch arm reaches for the cube, Hipólito jumps asleep, EMIAU
 *                       fires on the beat
 *   c45–49  mitad       drums back: the stadium comes back HALF (pixels below, neon above); her light pushes the arm
 *                       away from the cube; the crew reaches the cube's platform
 *   c49–53  pose        Firma, half pixelated, poses — and the pose fails: her shield crumbles into pixels; on the
 *                       screens Esquirla laughs                                                               [P]
 *   c53–57  valle       the lowest valley (piano + 808): Firma without a pose looks at Luzterna; she says nothing,
 *                       she lights her so she can see herself whole · «Este show no era para él.»            [C]
 *   c57–59  ruptura     LAYER 4: the LED frame cracks, the rig falls on Firma — ¡ATRAPA!: Luzterna stops it with
 *                       the beam (never with her hands), a palm from Firma, and sets it aside slowly         [M]
 *   c59–61  asalvo      Firma on the floor, safe, without a pose, looks at Luzterna
 *   c61–63  libre       the cube cracks; Cerito runs into her light
 *   c63–66  rasgadura   Esquirla opens a huge tear; through it, YOUR ISLAND AT NIGHT: the lighthouse, the warm hollow
 *                       where Canelo sleeps under his palm, Cerito's blanket next to it
 *   c66–77  pingpong    island (c66 68 70 72 75) / stadium (c67 69 71 73–74 76): the blanket by the hollow / Canelo
 *                       asleep standing · ink swirls / Luzterna with Cerito in the beam · AN INK EYE opens and looks /
 *                       she sees it, her smile goes · the eye moves to the hollow / Esquirla jumps into the tear · the
 *                       eye closes / the crowd silent, Firma standing without a pose
 *   c77–end cierre      the tear shuts; the LED screens go out one by one with the echo. Black.
 *
 * NO lives counter over Canelo, NO «GAME OVER? → CONTINUE?» (TEMP-P3): the end is screens going out.
 * Clicks (3, optional, flourishes only): PRESS START (c4) · ¡LUCES! (c19) · ¡ATRAPA! (c58: the beam catches anyway).
 * «Reducir destellos»: the HUD's glitch is a slow colour sweep, the 8-bit dissolve a pixel fade, strobes soft pulses.
 */
import type { FilmDef, FilmSceneDef, StyleRef, TransitionSpec } from '../../../types';
import noGameMap from '../../../../data/music/beatmaps/no_game.json';
import { tap, v } from '../../../../momentos/score';
import { NG } from '../music';

const A = () => import('./a');
const B = () => import('./b');
const C = () => import('./c');
const D = () => import('./d');
const E = () => import('./e');
const MODS: Record<string, () => Promise<Record<string, unknown>>> = {
  inicio: A,
  cajas: C,
  entrada: A,
  malo: B,
  tailor: B,
  emiau: B,
  premio: C,
  falla: A,
  luz: C,
  cerito: C,
  luces: A,
  vigas: C,
  trampa: B,
  tapa: C,
  pirata: A,
  arcade: D,
  mitad: D,
  pose: C,
  valle: C,
  ruptura: A,
  atrapa: C,
  asalvo: C,
  libre: C,
  rasgadura: E,
  pingpong: E,
  cierre: E,
};
const CUT: TransitionSpec = { kind: 'cut', dur: 0 };
/** the song's end (the file: 3:25.944) */
export const F29_END = 205.94;
function sc(id: string, c0: number, c1: number | 'end', style: StyleRef, extra: Partial<FilmSceneDef> = {}): FilmSceneDef {
  const t1 = c1 === 'end' ? F29_END : NG(c1);
  return { id, dur: t1 - NG(c0), style, set: () => MODS[id]().then((m) => m[id]), in: CUT, ...extra };
}
const POP = 'pop';
const W = (x: number, y: number, fov: number, t = 0) => ({ t, x, y, fov });

export const F29: FilmDef = {
  id: 'f29',
  title: 'El show',
  kind: 'song',
  track: 'no_game',
  map: noGameMap,
  loader: { style: 'bass', caption: 'PELÍCULA · LA GIRA' },
  scenes: [
    sc('inicio', 1, 5, POP, {
      in: { kind: 'fade', dur: 0.6, color: 0x000000 },
      cam: [W(960, 470, 0.5), { t: NG(3) - 0.2, x: 960, y: 470, fov: 0.53, ease: 'linear' }, { t: NG(5), x: 1440, y: 560, fov: 1.0, ease: 'inOut' }],
      camRm: [W(960, 470, 0.5), { t: NG(3), x: 1440, y: 560, fov: 1.0, ease: 'hold' }],
    }),
    sc('cajas', 5, 7, POP, { cam: [W(980, 560, 1.08, 0), { t: NG(2) * 1, x: 1000, y: 560, fov: 1.12, ease: 'linear' }], look: { warm: -0.03 } }),
    sc('entrada', 7, 8, POP, { cam: [{ t: 0, x: 960, y: 200, fov: 0.62 }, { t: 1.2, x: 960, y: 560, fov: 0.78, ease: 'expoOut' }, { t: NG(2), x: 960, y: 580, fov: 0.82, ease: 'linear' }], camRm: [W(960, 560, 0.78)] }),
    sc('malo', 8, 9, POP, { cam: [W(960, 540, 1.04), { t: NG(2), x: 960, y: 540, fov: 1.0, ease: 'linear' }] }),
    sc('tailor', 9, 11, POP, { cam: [W(960, 540, 1.0), { t: NG(3), x: 960, y: 540, fov: 1.06, ease: 'linear' }] }),
    sc('emiau', 11, 13, POP, { cam: [{ t: 0, x: 960, y: 540, fov: 1.0, hand: 6 }, { t: NG(3), x: 960, y: 540, fov: 1.04, ease: 'linear' }] }),
    sc('premio', 13, 14.021, POP, { cam: [W(900, 560, 1.0), { t: NG(14.021) - NG(13), x: 940, y: 560, fov: 1.08, ease: 'linear' }] }),
    sc('falla', 14.021, 15, POP, { cam: [W(960, 300, 0.56), { t: NG(15) - NG(14.021), x: 960, y: 300, fov: 0.6, ease: 'linear' }] }),
    sc('luz', 15, 17, POP, { cam: [{ t: 0, x: 980, y: 540, fov: 1.0, hand: 1.2 }, { t: NG(3), x: 980, y: 520, fov: 1.1, ease: 'linear' }] }),
    sc('cerito', 17, 19, POP, { cam: [{ t: 0, x: 960, y: 560, fov: 1.0, focus: 1000 }, { t: NG(3), x: 960, y: 560, fov: 1.06, ease: 'linear' }] }),
    sc('luces', 19, 23, POP, {
      cam: [{ t: 0, x: 960, y: 100, fov: 0.48 }, { t: NG(5), x: 960, y: 520, fov: 0.62, ease: 'inOut' }],
      camRm: [W(960, 380, 0.5)],
    }),
    sc('vigas', 23, 27, POP, { cam: [{ t: 0, x: 760, y: 520, fov: 1.0, hand: 2 }, { t: NG(5), x: 1160, y: 500, fov: 1.0, ease: 'linear' }], camRm: [W(960, 510, 1.0)] }),
    sc('trampa', 27, 35, POP, { cam: [W(960, 540, 1.0)] }),
    sc('tapa', 35, 38, POP, {
      cam: [W(960, 560, 1.0), { t: NG(4) - NG(1), x: 960, y: 540, fov: 1.12, ease: 'linear' }],
      subs: [{ t: 2.6, dur: 3.6, who: 'Firma', text: '¡Y ahora, nuestro invitado sin forma!' }],
    }),
    sc('pirata', 38, 39, POP, { cam: [W(960, 470, 0.52), { t: NG(2), x: 960, y: 470, fov: 0.56, ease: 'linear' }] }),
    sc('arcade', 39, 45, 'pixel', { in: { kind: 'cut', dur: 0 }, cam: [W(960, 540, 1.0)] }),
    sc('mitad', 45, 49, POP, { cam: [W(960, 470, 0.56), { t: NG(5), x: 960, y: 540, fov: 0.7, ease: 'inOut' }], camRm: [W(960, 500, 0.6)] }),
    sc('pose', 49, 53, POP, { cam: [W(940, 520, 1.0), { t: NG(5), x: 960, y: 520, fov: 1.08, ease: 'linear' }] }),
    sc('valle', 53, 57, POP, {
      cam: [W(960, 560, 1.0), { t: NG(5), x: 960, y: 560, fov: 1.05, ease: 'linear' }],
      look: { sat: 0.7, contrast: 1.0, vig: 0.55 },
      subs: [{ t: 4.6, dur: 3.6, who: 'Firma', text: 'Este show no era para él.' }],
    }),
    sc('ruptura', 57, 57.6, POP, { cam: [{ t: 0, x: 960, y: 420, fov: 0.55, hand: 7 }, { t: 1.6, x: 960, y: 440, fov: 0.6, ease: 'linear' }], camRm: [W(960, 420, 0.55)] }),
    sc('atrapa', 57.6, 59, POP, { cam: [{ t: 0, x: 960, y: 560, fov: 1.0, hand: 2 }, { t: NG(59) - NG(57.6), x: 960, y: 540, fov: 1.06, ease: 'linear' }] }),
    sc('asalvo', 59, 61, POP, { cam: [W(960, 600, 1.0), { t: NG(3), x: 960, y: 600, fov: 1.06, ease: 'linear' }] }),
    sc('libre', 61, 63, POP, { cam: [W(960, 560, 1.0), { t: NG(3), x: 900, y: 560, fov: 1.0, ease: 'inOut' }] }),
    sc('rasgadura', 63, 66, POP, {
      cam: [{ t: 0, x: 960, y: 460, fov: 0.55, hand: 3 }, { t: NG(65) - NG(63), x: 1180, y: 460, fov: 0.62, ease: 'inOut' }, { t: NG(66) - NG(63), x: 1180, y: 460, fov: 1.6, ease: 'inOut' }],
      camRm: [W(960, 460, 0.55), { t: NG(65) - NG(63), x: 1180, y: 460, fov: 1.6, ease: 'hold' }],
    }),
    sc('pingpong', 66, 77, POP, { cam: [W(960, 540, 1.0)] }),
    sc('cierre', 77, 'end', POP, { cam: [W(960, 440, 0.52), { t: 3.2, x: 960, y: 440, fov: 0.5, ease: 'linear' }] }),
  ],
  score: [
    tap(NG(4), { id: 'start', label: 'PRESS START', anchor: [960, 900] }, { great: [v('sparkle', { at: [960, 330], n: 10, spread: 400 })], hit: [v('sparkle', { at: [960, 330], n: 6, spread: 300 })] }),
    tap(NG(19), { id: 'luces', label: '¡LUCES!', anchor: [960, 880] }, { great: [v('sparkle', { at: [960, 600], n: 12, spread: 700 })], hit: [v('sparkle', { at: [960, 600], n: 7, spread: 500 })] }),
    tap(NG(58), { id: 'atrapa', label: '¡ATRAPA!', anchor: [700, 860] }, { great: [v('ring', { at: [900, 420], dur: 0.9 })], hit: [v('ring', { at: [900, 420], dur: 0.9 })] }),
  ],
  close: { kind: 'cut', dur: 0 },
};
