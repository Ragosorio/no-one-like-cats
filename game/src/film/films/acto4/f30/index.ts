/**
 * F30 · PC xti es amor «La noche estrellada» (H92, the breath of the act; guion:
 * historia-v2/guiones/acto-4/h92-la-noche-estrellada.md · ficha: 03-peliculas.md F30). COMPLETE: c1 → end (3:18.0).
 * 140 BPM, F♯, 1 bar = 12/7 s, c1 = 0 s (musica-v2/xti-es-amor.md). It starts when the player touches the lighthouse.
 *
 * STYLE: VAN GOGH — «La noche estrellada» made into your island. Thick strokes that MOVE along a flow field (swirls in
 * the sky, waves in the sea, the grass that sways), the lighthouse's beam painted as one more swirl, Canelo's palm as the
 * cypress in front, the island's houses with yellow windows as the village, the stars as yellow halos. Full bleed, no
 * frame. At the end the painting becomes a REAL CANVAS (craquelure, varnish) and fades. Warm, loving — the last quiet
 * night of the Part (it's never called that): of Luzterna, NOTHING about her mortality (no scarf, no knitting, no gift,
 * no cold, no shadow — she never had one —, no farewell). The flags are Canelo's: the fish «for tomorrow» with a little
 * sun drawn in the sand, Cronos's line by the fire WITHOUT ANYONE TURNING, the flame that drops by itself while he sleeps.
 *
 *   c1–2      regreso  your island at dusk in the game's own painting; strokes come down over it (R4)          [P]
 *   c2–9      cielo    the sky alone: swirls and stars; the title painted with a brush, it unravels at c5; a crane
 *                      down through the swirl: the lighthouse, its beam turning like a swirl, the cypress-palm      [M]
 *   c9–13     balcon   (the songstarter) Luzterna sitting in the air on the balcony, the lantern on her lap      [C]
 *   c13–17    isla     from the balcony: the first cats walk to the fire                                        [A]
 *   c17–33    gatos    one cat every two bars, on the beat: Canelo with a fish · Cerito chasing the beam's swirl ·
 *                      Nadie on a rock, looking at the stars · Noctis licks a paw · Maneki sweeps the stars' reflection
 *                      off the dock · Grafitera paints the sky's swirl on a rock · Hipólito asleep on the railing as if
 *                      it were a bar · Homiau passes a donut to Borrón (if they're on your island; else two of your cats)
 *   c33–41    ensena   (break) she floats down and teaches Cerito to come to the light: the beam on the sand, in, out,
 *                      in — TOCA A CERITO (opt.) — he curls up and SLEEPS IN THE BEAM: his static calms to soft strokes
 *   c41–57    fuego    (tutti) all around the fire; Canelo shares his fish: a piece by Cerito's nose, another to her —
 *                      she can't eat: she smells it with her eyes closed (the sweet bread of H72) and gives it back ·
 *                      dances, Grafitera paints Canelo, Maneki claps · c49 Canelo hides the rest under the blanket and
 *                      draws a little sun in the sand: «for tomorrow» · he pats it and leans on the palm
 *   c57–73    cronos   (break) Cronos by the fire, not looking at anyone: his line · NOBODY TURNS: only Canelo
 *                      scratches the base of his tail, where the flame is low, and yawns · the fill: the sky turns
 *                      faster and calms, heads start to nod
 *   c73–81    pad      the stillest shot of the Part: Canelo asleep leaning IN HER BEAM; HIS FLAME DROPS BY ITSELF and
 *                      comes back halfway · she looks at him, doesn't wake him — TOCA A CANELO (opt.): he turns over —
 *                      she hums: painted notes that become stars
 *   c81–105   baile    (tutti 2) they fall asleep one by one; fireflies · c89 MIRA LAS ESTRELLAS (opt.): the swirl
 *                      shines · she looks up, then down at her crew; laughs without sound at Hipólito's snore bubble ·
 *                      the whole island as «La noche estrellada»
 *   c105–end  cierre   all asleep; she isn't (she never sleeps): she keeps watch · a crane up; c113 the painting becomes
 *                      a real canvas; the pad goes out by itself; the canvas fades to black
 */
import type { FilmDef, FilmSceneDef, TransitionSpec, CamKey } from '../../../types';
import xtiMap from '../../../../data/music/beatmaps/xti.json';
import { tap, v } from '../../../../momentos/score';
import { XT } from '../music';

const S = () => import('./sets');
export const F30_END = 198.02;
const CUT: TransitionSpec = { kind: 'cut', dur: 0 };
interface Sc {
  id: string;
  c0: number;
  c1: number | 'end';
  style?: string;
  inT?: TransitionSpec;
  cam: CamKey[];
  camRm?: CamKey[];
  extra?: Partial<FilmSceneDef>;
}
/** scenes on bar lines: each one's dur includes the NEXT one's transition, so every scene starts on its bar */
function build(list: Sc[]): FilmSceneDef[] {
  return list.map((s, i) => {
    const t1 = s.c1 === 'end' ? F30_END : XT(s.c1);
    const next = list[i + 1]?.inT;
    const over = next && next.kind !== 'cut' ? next.dur : 0;
    const t0 = i === 0 ? 0 : XT(s.c0);
    return { id: s.id, dur: t1 - t0 + over, style: s.style ?? 'vangogh', set: () => S().then((m) => (m as Record<string, unknown>)[s.id]), in: s.inT ?? CUT, cam: s.cam, camRm: s.camRm, ...s.extra };
  });
}
/** local seconds of a bar inside a scene that starts at bar c0 */
const L = (c0: number, bar: number) => XT(bar) - XT(c0);
const K = (t: number, x: number, y: number, fov: number, ease: CamKey['ease'] = 'inOut'): CamKey => ({ t, x, y, fov, ease });
const H = (t: number, x: number, y: number, fov: number): CamKey => ({ t, x, y, fov, ease: 'hold' });

const SCENES: Sc[] = [
  {
    id: 'regreso',
    c0: 1,
    c1: 2,
    style: 'pintura',
    inT: { kind: 'fade', dur: 0.6, color: 0x000000 },
    cam: [K(0, 960, 520, 1), K(2.9, 960, 200, 1, 'sine')],
    camRm: [K(0, 960, 420, 1)],
  },
  {
    id: 'cielo',
    c0: 2,
    c1: 9,
    inT: { kind: 'paintSmear', dur: 1.2, dir: -1, tint: 0x13235c, seed: 30 },
    cam: [K(0, 980, -430, 1), K(L(2, 5), 1000, -400, 1.02, 'linear'), K(L(2, 9), 1080, 520, 1.0, 'inOut')],
    camRm: [K(0, 980, -430, 1), K(L(2, 5), 1000, -400, 1.0, 'linear'), K(L(2, 9), 1080, 520, 1.0, 'sine')],
    extra: {
      weather: [{ kind: 'wind', particle: 'stroke', amount: 0.35, color: 0xf4c430, seed: 30 }],
      cards: [{ t: 0.4, dur: L(2, 5) - 0.5, text: 'La noche estrellada', style: 'vangogh', pos: 'high', size: 120 }],
    },
  },
  { id: 'balcon', c0: 9, c1: 13, cam: [K(0, 1300, 330, 1.75), K(L(9, 13), 1310, 330, 1.85, 'linear')] },
  { id: 'isla', c0: 13, c1: 17, inT: { kind: 'dissolve', dur: 0.8 }, cam: [K(0, 760, 800, 1.25), K(L(13, 17), 800, 810, 1.3, 'linear')] },
  {
    id: 'gatos',
    c0: 17,
    c1: 33,
    cam: [
      K(0, 420, 820, 1.5),
      K(L(17, 19) - 0.05, 640, 830, 1.55, 'linear'),
      H(L(17, 19), 1060, 870, 1.9),
      H(L(17, 21), 300, 820, 1.9),
      H(L(17, 23), 1580, 860, 1.9),
      H(L(17, 25), 1930, 860, 1.9),
      H(L(17, 27), 540, 860, 1.9),
      H(L(17, 29), 2140, 840, 1.9),
      H(L(17, 31), 540, 860, 1.85),
    ],
    extra: { weather: [{ kind: 'wind', particle: 'stroke', amount: 0.25, color: 0xf4c430, seed: 17 }] },
  },
  { id: 'ensena', c0: 33, c1: 41, cam: [K(0, 1240, 700, 1.4), K(L(33, 35), 1210, 860, 1.8), K(L(33, 41), 1190, 880, 1.95, 'linear')] },
  {
    id: 'fuego',
    c0: 41,
    c1: 57,
    cam: [K(0, 1050, 760, 1.1), K(L(41, 41.9), 1050, 760, 1.12, 'linear'), H(L(41, 42), 1000, 860, 1.6), K(L(41, 45), 1010, 860, 1.66, 'linear'), H(L(41, 45), 1000, 780, 1.12), H(L(41, 49), 1010, 870, 1.8), K(L(41, 53), 1100, 880, 1.85, 'linear'), H(L(41, 53), 1000, 890, 2.0)],
  },
  {
    id: 'cronos',
    c0: 57,
    c1: 73,
    cam: [K(0, 720, 840, 2.0), K(L(57, 61), 720, 840, 2.05, 'linear'), H(L(57, 61), 1000, 800, 1.1), K(L(57, 65), 1000, 800, 1.12, 'linear'), K(L(57, 69), 1000, 400, 0.95), K(L(57, 73), 1050, 680, 1.1)],
    extra: { subs: [{ t: 0.6, dur: 6.4, who: 'Cronos', text: 'Vi el final. Una bufanda en el suelo y alguien que no se levanta.' }] },
  },
  { id: 'pad', c0: 73, c1: 81, inT: { kind: 'dissolve', dur: 1.0 }, cam: [K(0, 1250, 840, 1.6), K(L(73, 77), 1250, 840, 1.6, 'linear'), K(L(73, 81), 1270, 820, 1.8, 'sine')] },
  {
    id: 'baile',
    c0: 81,
    c1: 105,
    cam: [K(0, 1100, 780, 1.1), K(L(81, 89), 1120, 780, 1.14, 'linear'), H(L(81, 89), 1100, 160, 0.92), K(L(81, 91), 1100, 100, 0.95, 'linear'), H(L(81, 91), 1360, 720, 1.85), K(L(81, 97), 1350, 720, 1.9, 'linear'), H(L(81, 97), 1050, 470, 0.72), K(L(81, 105), 1050, 490, 0.74, 'linear')],
  },
  {
    id: 'cierre',
    c0: 105,
    c1: 'end',
    cam: [K(0, 1330, 700, 1.9), K(L(105, 107), 1330, 700, 1.95, 'linear'), K(L(105, 113), 1120, 220, 0.78, 'inOut'), K(F30_END - XT(105), 1120, 210, 0.76, 'linear')],
    camRm: [K(0, 1330, 700, 1.9), K(L(105, 113), 1120, 220, 0.78, 'sine')],
  },
];

/**
 * the Van Gogh shots become ONE scene `noche` (c2 → end): their cameras are joined on the bars (each shot's first key
 * is a cut: ease 'hold'), their cards / subtitles move to the scene's time. Only the opening R4 is a scene of its own.
 */
function night(list: Sc[]): FilmSceneDef[] {
  const [r4, ...shots] = list;
  const t0 = XT(2);
  const cam: CamKey[] = [];
  const subs: NonNullable<FilmSceneDef['subs']> = [];
  const cards: NonNullable<FilmSceneDef['cards']> = [];
  shots.forEach((s, i) => {
    const off = XT(s.c0) - t0;
    s.cam.forEach((k, j) => cam.push({ ...k, t: Math.max(cam.length ? cam[cam.length - 1].t : 0, k.t + off), ease: i > 0 && j === 0 ? 'hold' : k.ease }));
    for (const u of s.extra?.subs ?? []) subs.push({ ...u, t: u.t + off });
    for (const c of s.extra?.cards ?? []) cards.push({ ...c, t: c.t + off });
  });
  const [first] = build([r4, { ...shots[0], c1: 'end' }]);
  return [
    first,
    {
      id: 'noche',
      dur: F30_END - t0,
      style: 'vangogh',
      set: () => S().then((m) => (m as Record<string, unknown>).noche),
      in: shots[0].inT ?? CUT,
      cam,
      cards,
      subs,
      weather: [{ kind: 'wind', particle: 'stroke', amount: 0.28, color: 0xf4c430, seed: 30 }],
    },
  ];
}

export const F30: FilmDef = {
  id: 'f30',
  title: 'La noche estrellada',
  kind: 'song',
  track: 'xti',
  map: xtiMap,
  loader: { style: 'vangogh', caption: 'PELÍCULA' },
  scenes: night(SCENES),
  score: [
    tap(XT(38), { id: 'cerito', label: 'TOCA A CERITO', anchor: [960, 300] }, { great: [v('sparkle', { at: [960, 620], n: 6, spread: 160 })], hit: [v('sparkle', { at: [960, 620], n: 4, spread: 120 })] }),
    tap(XT(78), { id: 'canelo', label: 'TOCA A CANELO', anchor: [960, 300] }, { great: [v('sparkle', { at: [900, 640], n: 5, spread: 140 })], hit: [v('sparkle', { at: [900, 640], n: 3, spread: 100 })] }),
    tap(XT(90), { id: 'estrellas', label: 'MIRA LAS ESTRELLAS', anchor: [960, 860] }, { great: [v('sparkle', { at: [960, 300], n: 12, spread: 700 })], hit: [v('sparkle', { at: [960, 300], n: 8, spread: 500 })] }),
  ],
  close: { kind: 'fade', dur: 1.4, color: 0x000000 },
};
