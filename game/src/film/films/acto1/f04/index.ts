/**
 * F04 · PH «La mañana en blanco y negro» (H72 ♥; guion: historia-v2/guiones/acto-1/h72-la-resaca.md §F04).
 *
 * STYLE: a 1920s SILENT FILM on the Borracha's TV — black & white with grain and scratches, a ROUND vignette, the
 * projector's flicker, a fixed camera, iris in and out, black intertitles in an art-déco frame (the hangover: «the light
 * hurts and so does sound»). Rubber-hose greys. the piano is MÚSICA's `drunck.cinemudo` «En el cine mudo» (a silent-film piano from Drunck's own material; pending
 * the owner's OK because it adds a timbre) — until it is registered, `drunck.resaca`.
 * Six films: the prologue, four vignettes the player visits from the B&W map (the bar opens last), the epilogue.
 *
 *   f04_prologo   20 s  0 taps   the fountain: Canelo floating like a rubber duck; «¡MI BUFANDA!»; she laughs
 *   f04_doneria   25 s  1 tap    Homiau remembers last night for the first time in his life · «¡DONA!»
 *   f04_hipomart  25 s  1 tap    her lantern gets away and rolls down the aisle — tap: Canelo's foot stops it (J);
 *                                no tap: a mop does · then the lantern tilts by itself toward a tiny tear of static
 *   f04_parque    25 s  1 tap    «¿tú te acuerdas de cuando estabas viva?» · «PAN»: the sweet bread she can only smell
 *   f04_bar       25 s  0 taps   the rag that was a rag · THE SCARF on the floor under Hipólito's stool, held, still
 *   f04_epilogo   20 s  0 taps   she straightens his scarf with the beam (no words: TEMPERATURA R7) · «(Ella no
 *                                duerme. Nunca duerme.)» · the lantern points at the bathroom's tear · the iris closes
 *                                and the COLOUR comes back as a wave from the edges: La Borracha at night again
 *
 * Taps only change a flourish (the set reads k.judged): without them every vignette plays just as well.
 */
import { derived } from '../music';
import type { FilmDef, FilmSceneDef } from '../../../types';
import { tap, v } from '../../../../momentos/score';

const TV43 = 4 / 3;
/** the B&W stock of every silent scene (the style's sepia → orthochromatic grey with a breath of warmth) */
const LOOK = { mono: 0.8, sepia: 0.2, grain: 0.13, vig: 0.42, flicker: 0.7, scratch: 0.75, contrast: 1.18, hal: 0.32, halT: 0.72, halR: 9 };
const s1 = () => import('./sets1');
const s2 = () => import('./sets2');
type Sets = Awaited<ReturnType<typeof s1>> & Awaited<ReturnType<typeof s2>>;
type Key = keyof Sets;
const set = (k: Key) => () => Promise.all([s1(), s2()]).then(([a, b]) => ({ ...a, ...b })[k]);

/** a silent scene: fixed camera, 4:3, the B&W look */
function M(id: string, dur: number, k: Key, o: Partial<FilmSceneDef> = {}): FilmSceneDef {
  return { id, dur, style: 'mudo', set: set(k), aspect: TV43, in: { kind: 'cut', dur: 0 }, look: LOOK, cam: [{ t: 0, x: 960, y: 540 }], ...o };
}
const irisIn = (at: [number, number] = [960, 540]) => ({ kind: 'iris' as const, dur: 1.0, at });
const irisOut = (anchor: string, at: [number, number] = [960, 540]) => ({ kind: 'iris' as const, dur: 1.0, at, anchor, out: true });
const loader = { style: 'silent' as const, caption: 'LA BORRACHA · DE MAÑANA' };

/** the silent-film piano (MÚSICA, oleada 3b) — `drunck.resaca` as the fallback */
const SILENT_PIANO = derived(['drunck.cinemudo'], 'drunck.resaca');

export const F04_FILMS: FilmDef[] = [
  {
    id: 'f04_prologo',
    title: 'La mañana en blanco y negro',
    kind: 'interlude',
    track: SILENT_PIANO,
    loader,
    scenes: [
      M('rotulo', 2.8, 'p_rotulo', { in: { kind: 'fade', dur: 0.4, color: 0x000000 } }),
      M('fuente', 6.0, 'p_fuente', { in: irisIn([960, 600]) }),
      M('medio', 3.0, 'p_medio'),
      M('dos', 5.5, 'p_dos'),
      M('cara', 2.6, 'p_cara'),
      M('rotulo2', 2.0, 'p_rotulo2', { in: irisOut('face', [900, 470]) }),
    ],
    close: { kind: 'fade', dur: 0.5, color: 0x000000 },
  },
  {
    id: 'f04_doneria',
    title: 'La mañana: la Donería',
    kind: 'interlude',
    track: SILENT_PIANO,
    loader,
    scenes: [
      M('mostrador', 4.5, 'd_mostrador', { in: irisIn([1000, 560]) }),
      M('homiau', 5, 'd_homiau'),
      M('abrazo', 5, 'd_abrazo'),
      M('pregunta', 7, 'd_pregunta'),
      M('dona', 4, 'd_dona'),
    ],
    // ¡DONA! (optional): with it Homiau gives the donut away (and regrets it mid-air); without it he eats it
    score: [tap(22.7, { id: 'dona', label: '¡DONA!', anchor: [1260, 300], lead: 0.45 }, { great: [v('sparkle', { at: [960, 560], n: 8 })], hit: [v('sparkle', { at: [960, 560], n: 5 })] })],
    close: { kind: 'iris', dur: 1.0, at: [960, 560], anchor: 'donut' },
  },
  {
    id: 'f04_hipomart',
    title: 'La mañana: el Hipo-Mart',
    kind: 'interlude',
    track: SILENT_PIANO,
    loader,
    scenes: [
      M('pasillo', 4, 'h_pasillo', { in: irisIn([960, 520]) }),
      M('congelador', 5, 'h_congelador'),
      M('persecucion', 6, 'h_persecucion', { cam: [{ t: 0, x: 1500, y: 540 }, { t: 3.9, x: 700, ease: 'linear' }, { t: 6, x: 700 }], camRm: [{ t: 0, x: 960, y: 540 }] }),
      M('abraza', 5, 'h_abraza'),
      M('brujula', 5, 'h_brujula'),
    ],
    // the J beat (optional): tap the rolling lantern — Canelo's foot stops it; without the tap a mop does
    score: [tap(12.9, { id: 'linterna', label: '¡PÁRALA!', anchor: [960, 300], lead: 0.6 }, { great: [v('ring', { at: [700, 820], r1: 220 })], hit: [v('ring', { at: [700, 820], r1: 160 })] })],
    close: { kind: 'iris', dur: 1.0, at: [1240, 420], anchor: 'tear' },
  },
  {
    id: 'f04_parque',
    title: 'La mañana: el parque',
    kind: 'interlude',
    track: SILENT_PIANO,
    loader,
    scenes: [
      M('banca', 4, 'q_banca', { in: irisIn([960, 600]) }),
      M('dos', 5, 'q_dos'),
      M('perfil', 9, 'q_perfil'),
      M('pan', 7, 'q_pan'),
    ],
    // PAN (optional): the squashed sweet bread from behind his ear; without it he eats it and offers her the crumbs
    score: [tap(19.4, { id: 'pan', label: 'PAN', anchor: [1300, 280], lead: 0.6 }, { great: [v('sparkle', { at: [760, 520], n: 8 })], hit: [v('sparkle', { at: [760, 520], n: 5 })] })],
    close: { kind: 'iris', dur: 1.0, at: [1000, 520], anchor: 'bread' },
  },
  {
    id: 'f04_bar',
    title: 'La mañana: La Última Ronda',
    kind: 'interlude',
    track: SILENT_PIANO,
    loader,
    scenes: [
      M('cerrado', 4, 'b_cerrado', { in: irisIn([1100, 520]) }),
      M('puerta', 4, 'b_puerta'),
      M('espuma', 3, 'b_espuma'),
      // B4: fixed and low, nothing moves (the image Cronos will name in H92)
      M('bufanda', 7, 'b_bufanda', { look: { ...LOOK, flicker: 0.45, scratch: 0.5 } }),
      M('recoge', 4, 'b_recoge'),
      M('cuello', 3, 'b_cuello'),
    ],
    close: { kind: 'iris', dur: 1.0, at: [960, 600], anchor: 'scarf' },
  },
  {
    id: 'f04_epilogo',
    title: 'La mañana: la azotea',
    kind: 'interlude',
    track: SILENT_PIANO,
    loader,
    scenes: [
      M('azotea', 5, 'e_azotea', { in: irisIn([960, 640]) }),
      M('ella', 6, 'e_ella'),
      M('linterna', 5.4, 'e_linterna'),
      // E4: the iris closes on the lantern and the colour floods back in from the edges (prep → development → exit)
      { id: 'color', dur: 4.6, style: 'tv', set: set('e_color'), aspect: TV43, in: irisOut('lantern', [1230, 560]), cam: [{ t: 0, x: 960, y: 540, fov: 1.02 }, { t: 4.6, fov: 1, ease: 'sine' }] },
    ],
    close: { kind: 'fade', dur: 0.8, color: 0x000000 },
  },
];
