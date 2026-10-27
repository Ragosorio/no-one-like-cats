/**
 * F08 · PC OH SHIT «Caída por el multiverso» (fin de H74; guion: historia-v2/guiones/acto-1/h74-el-cadenero-y-oh-shit.md
 * §F08 · ficha: 03-peliculas.md F08). FRAGMENT c37 → end (2:22): it opens from the silence of Borrón's warning on the
 * three chopped hits of the suspense.
 *
 * STYLE: a MULTIVERSE COLLAGE — every universe brings its style, its frame and its own way of CENSORING «OH SH—» (the
 * song never says it: it only exists written). The 4:3 TV cracks (c45, c49, c53) and its glass falls toward the camera
 * at c57 («the screen leaves the box»); each «Synth Drop» (c72, c87, c100, c115) is a white crack between universes.
 * Canelo's flame drops a step at every crack — nobody says a word. Luzterna holds him by the scarf from c57 on.
 *
 *   c37–45   LA TELE (tv, 4:3)           the handle turns by itself · «¿Listos?» «No.» · the tear · a print · «Una noche
 *                                         nomás, dijo.»                                                   [legible]
 *   c45–57   EL TÚNEL (tv, 4:3)          ¡SALTA! (diver / belly) · static rings, flashes of the bar · Cerito ahead · the
 *                                         silent scream censored the TV way: PIIIIP · the glass cracks
 *   c57–63   NOIR DE CÓMIC (noir)        the glass shatters at us · rooftop in the rain · Murciégato turns · «OH, #@!%»
 *   c63–69   VERSO ARÁCNIDO (comic)      low angle, on twos, dots · Gato Araña waves · «¡OH, MICH—!»
 *   c69–73   ANIME (anime)               close-up, speed lines, giant sweat drop · «¿¡NANI!?» · crack (c72)
 *   c73–77   EL GRITO (vangogh)          the frame itself screams (¡GRITA!: all of it waves) · CERITO, CLEAR, LOOKS AT
 *                                         CANELO — only Canelo sees him                                   [legible]
 *   c77–81   TELENOVELA (tv, 4:3)        the triple zoom, the diva paw · «¡¿QUÉÉÉ?!»
 *   c81–89   PLASTILINA (plastilina)     the clay family's breakfast; he steals the bread · «¡Ay, caray!» · crack (c87)
 *   c89–93   WESTERN (mudo, sepia)       an eye on every bar (film strip) · SE BUSCA: CERITO · «AQUÍ YACE UN OH SH—»
 *   c93–97   KAIJU (mudo, cold)          Gatzilla's foot — she pulls him out by the scarf · «¡¡OH NO!!» (dubbed)
 *   c97–101  8 BITS (pixel)              Comecroquetas chases him · «CONTINUE?» in the game's HUD · crack (c100)
 *   c101–105 EGIPTO (ukiyoe)             the gods bow · a scared-cat hieroglyph · «¡Por fin alguien que me entiende!»
 *   c105–113 RÁFAGA (one bar each)       Gato Araña Noir · Gata Araña · 2099 · a pixel Canelo · a clay Canelo ·
 *                                         Murciégato · a Homiau from another TV · a woodblock wave — each with its censor
 *   c113–117 «TE TENGO» (pintura)        her, the scarf held tight; she smiles at him · the last crack (c115)  [legible]
 *   c117–123 CIUDAD MAYÚSCULA (comic)    the panel builds itself · ¡CAE! · he collapses two seconds · the cat-signal
 *                                                                                                         [legible]
 * 3 optional taps (¡SALTA! c45 · ¡GRITA! c73 · ¡CAE! c117): flourishes only; the default looks just as good.
 */
import type { FilmDef, FilmSceneDef, StyleRef, TransitionSpec } from '../../../types';
import ohShitMap from '../../../../data/music/beatmaps/oh_shit.json';
import { tap, v } from '../../../../momentos/score';
import { T } from './time';

type SetKey = string;
const S1 = () => import('./s1');
const S2 = () => import('./s2');
const S3 = () => import('./s3');
const S4 = () => import('./s4');
const S5 = () => import('./s5');
const MODS: Record<SetKey, () => Promise<Record<string, unknown>>> = {
  puerta: S1,
  tunel: S1,
  noir: S2,
  arana: S2,
  anime: S2,
  grito: S3,
  novela: S3,
  plastilina: S3,
  western: S4,
  kaiju: S4,
  pixel: S4,
  egipto: S4,
  r1: S5,
  r2: S5,
  r3: S5,
  r4: S5,
  r5: S5,
  r6: S5,
  r7: S5,
  r8: S5,
  tengo: S5,
  ciudad: S5,
};
const CUT: TransitionSpec = { kind: 'cut', dur: 0 };
/** a scene from bar c0 to bar c1 (all cuts: the cracks and the shatter are drawn by the sets, on the bar) */
function sc(id: SetKey, c0: number, c1: number, style: StyleRef, extra: Partial<FilmSceneDef> = {}): FilmSceneDef {
  return { id, dur: T(c1) - T(c0), style, set: () => MODS[id]().then((m) => m[id]), in: CUT, aspect: 16 / 9, ...extra };
}
const TV43 = 4 / 3;

export const F08: FilmDef = {
  id: 'f08',
  title: 'Caída por el multiverso',
  kind: 'song',
  track: 'oh_shit',
  map: ohShitMap,
  from: '#36', // c37 (the score's '#i' is 0-based: '#0' = c1)
  loader: { style: 'tv', caption: 'PELÍCULA · LA BORRACHA' },
  scenes: [
    sc('puerta', 37, 45, 'tv', { aspect: TV43, in: { kind: 'fade', dur: 0.4, color: 0x000000 } }),
    sc('tunel', 45, 57, 'tv', { aspect: TV43 }),
    sc('noir', 57, 63, 'noir', {
      weather: [
        { kind: 'rain', amount: 0.85, angle: 0.14, ground: 1000, seed: 21 },
        { kind: 'lightning', strikes: [4.4], from: [1500, -60], z: 4000, seed: 3 },
      ],
    }),
    sc('arana', 63, 69, 'comic'),
    sc('anime', 69, 73, 'anime'),
    sc('grito', 73, 77, 'vangogh', { look: { sat: 1.18, warm: 0.12 } }),
    sc('novela', 77, 81, 'tv', {
      aspect: TV43,
      look: { hal: 0.6, halT: 0.55, halR: 12, warm: 0.16, sat: 1.15, vig: 0.45, lift: 0.04 },
      // the triple zoom (three crash zooms on the chords); «Reducir movimiento»: one slow push
      cam: [
        { t: 0, x: 960, y: 540, fov: 1 },
        { t: 0.75, fov: 1 },
        { t: 0.9, x: 960, y: 450, fov: 1.35, ease: 'expoOut' },
        { t: 1.35, fov: 1.35 },
        { t: 1.5, x: 960, y: 440, fov: 1.8, ease: 'expoOut' },
        { t: 1.95, fov: 1.8 },
        { t: 2.1, x: 980, y: 430, fov: 2.3, ease: 'expoOut' },
      ],
      camRm: [
        { t: 0, x: 960, y: 540, fov: 1 },
        { t: 3, x: 960, y: 450, fov: 1.5, ease: 'sine' },
      ],
    }),
    sc('plastilina', 81, 89, 'plastilina', { aspect: 1.66 }),
    sc('western', 89, 93, 'mudo', { look: { sepia: 1, warm: 0.3, contrast: 1.2, flicker: 0.35, scratch: 0.6 } }),
    sc('kaiju', 93, 97, 'mudo', { aspect: 1.37, look: { sepia: 0.08, contrast: 1.3, flicker: 0.5, scratch: 0.7, grain: 0.14 } }),
    sc('pixel', 97, 101, 'pixel'),
    sc('egipto', 101, 105, 'ukiyoe'),
    sc('r1', 105, 106, 'noir'),
    sc('r2', 106, 107, 'comic'),
    sc('r3', 107, 108, 'comic', { look: { sat: 1.25 } }),
    sc('r4', 108, 109, 'pixel'),
    sc('r5', 109, 110, 'plastilina'),
    sc('r6', 110, 111, 'noir'),
    sc('r7', 111, 112, 'tv', { aspect: TV43, look: { sat: 1.25, warm: 0.1 } }),
    sc('r8', 112, 113, 'ukiyoe'),
    sc('tengo', 113, 117, 'pintura', { look: { warm: 0.08, vig: 0.4 } }),
    sc('ciudad', 117, 123, 'comic', {
      // O33: the crane up to the sky (the cat-signal) — parallax over sky / city / rooftop
      cam: [
        { t: 0, x: 960, y: 540, z: 0 },
        { t: T(121) - T(117), x: 960, y: 540, z: 0 },
        { t: T(123) - T(117) - 0.2, x: 1060, y: 120, z: -160, ease: 'inOut' },
      ],
      camRm: [
        { t: 0, x: 960, y: 540 },
        { t: T(121) - T(117), x: 960, y: 540 },
        { t: T(123) - T(117) - 0.2, x: 1040, y: 150, ease: 'sine' },
      ],
    }),
  ],
  score: [
    tap(T(45), { id: 'salta', label: '¡SALTA!', anchor: [960, 250] }, { great: [v('sparkle', { at: [960, 420], n: 9, spread: 200 })], hit: [v('sparkle', { at: [960, 420], n: 5 })] }),
    tap(T(73), { id: 'grita', label: '¡GRITA!', anchor: [960, 250] }, { great: [v('ring', { at: [960, 540], r0: 60, r1: 900 })], hit: [v('ring', { at: [960, 540], r0: 60, r1: 600 })] }),
    tap(T(117), { id: 'cae', label: '¡CAE!', anchor: [960, 250] }, { great: [v('sparkle', { at: [860, 820], n: 10, spread: 260 })], hit: [v('sparkle', { at: [860, 820], n: 6 })] }),
  ],
  close: { kind: 'fade', dur: 1.2, color: 0x000000 },
};
