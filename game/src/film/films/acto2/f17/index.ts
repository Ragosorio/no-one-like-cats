/**
 * F17 · PH «La Vocación» (H82, the midpoint of Part III; guion: historia-v2/guiones/acto-2/h82-la-mano.md).
 *
 * STYLE: CARAVAGGIO — tenebrism, dark oil, one raking ray, figures coming out of the black, and two compositions you
 * recognise: the hand that points inside the ray (The Calling of Saint Matthew) and the two hands that almost touch (The
 * Creation of Adam), here to UN-create. La Mano calls from above; HER LANTERN IS THE OTHER LIGHT of the painting. The
 * anime 16:9 drips into oil inside a gilded museum frame, and drips back at the end. 90 s · 1 optional click (the
 * Capi's answer: «No.» / «Ni lo sueñes.» — cosmetic, both lead to her «No.»; not saved) · amb.vocacion (organ and low
 * strings, composed to this shot list: musica-v2/10-produccion-oleada3.md §5.1).
 *
 *   V1   0–8    the arena drips from cel into oil; the gold frame grows                                  [P]
 *   V2   8–16   a ray comes down from the closed sky to the gatera; La Mano descends inside it             [P] rival
 *   V3   16–26  the CALLING: she points the nib, through the ray, at Cerito hiding behind her skirt of light  [M]
 *   V4   26–36  the CREATION, backwards: her white hand reaches for Cerito's little paw — a centimetre apart   [M]
 *   V5   36–44  the offer, LOOKING AT CANELO: «Lo cierro todo. Sin dolor. Las cajas sanan. Solo denme al que no
 *               tiene forma.»                                                                           C7
 *   V6   44–50  the Capi answers (click): «No.» / «Ni lo sueñes.»
 *   V7   50–56  Luzterna puts the lantern between the two hands: «No.» — the second light
 *   V8   56–62  a drop of ink falls toward Cerito — ¡REBOTE! off the bubble of her light                  ★L3 (never said here)
 *   V9   62–70  her gaze goes from the lantern… to Canelo, and stays; his flame trembles · «Ese gato ve demasiado.»
 *   V10  70–78  Itō kneels at the edge of the ray, sheathes his threads · «Mi cacería terminó.»
 *   V11  78–86  she goes up the ray; it closes; an ink handprint stays in the sky
 *   V12  86–90  the oil drips back into cel; the frame withdraws (the 3 s of silence follow in the scene)
 */
import type { FilmDef, FilmSceneDef } from '../../../types';
import { choice, at, v } from '../../../../momentos/score';
import { MUSIC } from '../music';

const S = () => import('./sets');
const T = { escurre: 0, rayo: 8, vocacion: 16, adan: 26, oferta: 36, linterna: 50, mirada: 62, ito: 70, sube: 78, end: 90 } as const;
const X = 0.6;
const sc = (id: keyof typeof T, next: keyof typeof T, extra: Partial<FilmSceneDef> = {}): FilmSceneDef => ({
  id,
  dur: T[next] - T[id] + (next === 'end' ? 0 : X),
  style: 'caravaggio',
  set: () => S().then((m) => (m as unknown as Record<string, unknown>)[id]),
  in: { kind: 'dissolve', dur: X },
  cam: [
    { t: 0, x: 960, y: 540, fov: 1.0 },
    { t: T[next] - T[id], fov: 1.04, ease: 'linear' },
  ],
  camRm: [{ t: 0, x: 960, y: 540, fov: 1.0 }],
  ...extra,
});
const W = 'davinci' as const;

export const F17: FilmDef = {
  id: 'f17',
  title: 'La Vocación',
  kind: 'interlude',
  track: MUSIC.f17,
  loader: { style: 'davinci', caption: 'MAR SHŌNEN' },
  scenes: [
    sc('escurre', 'rayo', { in: { kind: 'fade', dur: 1.0, color: 0x000000 }, dur: T.rayo + X, cam: [{ t: 0, x: 960, y: 560, fov: 1.0 }, { t: 8, fov: 0.96, ease: 'sine' }] }),
    sc('rayo', 'vocacion', { weather: [{ kind: 'wind', particle: 'dust', amount: 0.4, color: 0xfff0d8, seed: 7 }] }),
    sc('vocacion', 'adan'),
    sc('adan', 'oferta', { cam: [{ t: 0, x: 960, y: 520, fov: 1.0 }, { t: 10, x: 960, y: 520, fov: 1.12, ease: 'linear' }] }),
    sc('oferta', 'linterna', { subs: [{ t: 0.8, dur: 6.2, who: 'LA MANO', text: 'Lo cierro todo. Sin dolor. Las cajas sanan. Solo denme al que no tiene forma.', style: W }] }),
    sc('linterna', 'mirada', { subs: [{ t: 2.4, dur: 1.8, who: 'LUZTERNA', text: 'No.', style: W }], cam: [{ t: 0, x: 960, y: 540, fov: 1.0 }, { t: 5.4, x: 960, y: 540, fov: 1.0, ease: 'hold' }, { t: 6.0, x: 1060, y: 600, fov: 1.35, ease: 'inOut' }, { t: 12, x: 1060, y: 600, fov: 1.38, ease: 'linear' }] }),
    sc('mirada', 'ito', { subs: [{ t: 3.6, dur: 3.2, who: 'LA MANO', text: 'Ese gato ve demasiado.', style: W }] }),
    sc('ito', 'sube', { subs: [{ t: 3.0, dur: 3.0, who: 'ITŌ', text: 'Mi cacería terminó.', style: W }] }),
    sc('sube', 'end', { dur: T.end - T.sube }),
  ],
  score: [
    choice(T.oferta + 8.4, { id: 'capi', fallback: 'left', until: T.oferta + 10.6, label: '¿QUÉ LE DICES?', anchor: [960, 180] }, { left: [], right: [] }),
    at(T.linterna + 6.75, v('sound', { name: 'tick', pitch: 2.2 })),
  ],
  close: { kind: 'fade', dur: 0.8, color: 0x000000 },
};
