/**
 * LA PLANTILLA DE PRESENTACIÓN — one data-driven briefing film for every Carta stage that has no hand-made film
 * (docs/part-iii/14 §2: «antes de cada batalla, un video»; mecanicas-v2 / app/stageIntro.ts). FILM-ACTO1, ronda 4.
 *
 * MECÁNICAS-IMPL's hook asks, in order: a film registered for the stage (`stages[].film`, then `p3d_<dim>_<n>`) → THIS
 * template (registerBriefingTemplate) → the animated card. The template turns the stage's BriefingData into a FilmDef
 * of ~25 s, 0 clicks, in five beats (each one presented → shown → given a consequence):
 *
 *   donde   DÓNDE           the place's facade with its own name lit on the sign; the channel bug «LA BORRACHA · B-3»
 *   pasa    QUÉ PASA        a news lower third with `pasa`; Cerito's footprints cross the street — and Luzterna's beam
 *                           sweeps along them until they glow (her silent action: her light finds the trail)
 *   rival   CONTRA QUIÉN    crash zoom on the door: the rival's own painting (`rival.slug`), the name plate, their line
 *   regla   SU REGLA        the rule, SHOWN with the real simulator (`rule.demo`, battle/demo.ts): the same shot done
 *                           well ✔ and badly ✘ on the two ships; without a demo, the rule's lines as cards
 *   riesgo  QUÉ ARRIESGAMOS the Bitácora page in her handwriting (`stakes`, never her name) + the honest estimate
 *                           («CON ESTA TRIPULACIÓN: N %», the same live run as the Carta) and the huellas a first win pays
 *
 * SKINS: each dimension dresses the same five beats in its own style (style id, aspect, typography, music, backdrop).
 * La Borracha is registered here (TV cartoon, 4:3, the bass rumble of Drunck from the street). Another act adds its
 * box with `registerBriefingSkin('p3d_superheroes', { … })` — a pure call (the backdrop is a lazy Pixi module). Without
 * a skin, a dimension gets the neutral one (the game's own painting, 16:9).
 *
 * Docs: docs/part-iii/cine-v2/04-plantilla-presentacion.md.
 */
import type { FilmDef, FilmSceneDef, TypeStyle } from '../../types';
import type { BriefingData } from '../../../app/stageIntro';
import { registerBriefingTemplate } from '../../../app/stageIntro';
import regiones from '../../../data/gateras/regiones.json';

/** what a backdrop module draws: the place, behind everything (a Pixi Container; see sets.ts BorrachaFacade) */
export interface BriefingBackdropArgs {
  /** the stage's place name (lit on the sign) */
  title: string;
  /** a seed per stage (windows, puddles…) */
  seed: number;
}
export interface BriefingSkin {
  /** film style id (catalog) for the five scenes */
  style: string;
  /** picture aspect (4/3 = La Borracha's TV) */
  aspect: number;
  /** the TV screen overlay (rounded corners, scanlines) */
  tv?: boolean;
  /** cards / subtitles typography */
  type: TypeStyle;
  /** derived music per stage kind (never an original) */
  track: { normal: string | null; elite: string | null; boss: string | null };
  /** loading-screen caption */
  caption: string;
  /** colours of the plates (lower third, name plate) */
  pal: { ink: number; plate: number; accent: number; paper: number; text: number };
  /** the place behind the beats (lazy Pixi module: `default` or `backdrop` export) — default: La Borracha's facade */
  backdrop?: () => Promise<unknown>;
  /** weather over the place */
  rain?: number;
}

export const BORRACHA_SKIN: BriefingSkin = {
  style: 'tv',
  aspect: 4 / 3,
  tv: true,
  type: 'tv',
  track: { normal: 'drunck.barra', elite: 'drunck.battle', boss: 'drunck.battle' },
  caption: 'PRESENTACIÓN · LA BORRACHA',
  pal: { ink: 0x1d1430, plate: 0xd9483a, accent: 0xffd23a, paper: 0xfff6e0, text: 0xfff6e0 },
  rain: 0.35,
};
export const NEUTRAL_SKIN: BriefingSkin = {
  style: 'pintura',
  aspect: 16 / 9,
  tv: false,
  type: 'default',
  track: { normal: null, elite: null, boss: null },
  caption: 'PRESENTACIÓN',
  pal: { ink: 0x0b0716, plate: 0x2a3d6e, accent: 0xff2e88, paper: 0xf6f1e7, text: 0xf6f1e7 },
  rain: 0,
};

/** skins by box id (an act registers its own) and by the box's `look` in the data (regiones.json dims[].look) */
const SKINS = new Map<string, BriefingSkin>();
const LOOK_SKINS = new Map<string, BriefingSkin>([['tv', BORRACHA_SKIN]]);
type DimRow = { id: string; look?: string; code?: string | null; name?: string };
const DIMS = (regiones as unknown as { dims: DimRow[] }).dims;
/** another act dresses its dimension's briefings (pure; call it at import time of the act's index) */
export function registerBriefingSkin(dim: string, skin: Partial<BriefingSkin>) {
  SKINS.set(dim, { ...(SKINS.get(dim) ?? NEUTRAL_SKIN), ...skin });
}
/** the skin of a box: its own, else the one of its data `look` (La Borracha's TV = 'tv'), else the neutral one */
export const skinFor = (dim: string): BriefingSkin => SKINS.get(dim) ?? LOOK_SKINS.get(DIMS.find((d) => d.id === dim)?.look ?? '') ?? NEUTRAL_SKIN;

/** the timing of the five beats (film seconds; scenes overlap by their transitions) */
export const BEATS = { donde: 5.2, pasa: 5.6, rival: 5.6, regla: 6.4, riesgo: 5.2 } as const;

const sets = () => import('./sets');
const seedOf = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % 997;

/** the stage's short label for the stamp: the data's own (`S-3`, `A-2`…); an old caller without it: the box's code + n */
export function stampOf(d: Pick<BriefingData, 'label' | 'n' | 'node' | 'dim'>): string {
  if (d.label) return d.label;
  const code = DIMS.find((x) => x.id === d.dim)?.code;
  return /^\d+$/.test(d.node) || !d.node ? `${code ?? 'B'}-${d.n}` : d.node.toUpperCase();
}

/** the briefing film of a stage (pure: the sets load lazily with the data in their closures) */
export function briefingFilm(d: BriefingData): FilmDef {
  const skin = skinFor(d.dim);
  const seed = seedOf(d.battleId);
  const S = (name: 'donde' | 'pasa' | 'rival' | 'regla' | 'riesgo') => () => sets().then((m) => m.beat(name, d, skin, seed));
  const base = { style: skin.style, aspect: skin.aspect };
  const rain = skin.rain ? [{ kind: 'rain' as const, amount: skin.rain, angle: 0.12, ground: 930, color: 0xbfd6ff, seed: 3 + (seed % 7) }] : undefined;
  const scenes: FilmSceneDef[] = [
    {
      id: 'donde',
      dur: BEATS.donde,
      ...base,
      set: S('donde'),
      in: { kind: 'fade', dur: 0.5, color: 0x000000 },
      weather: rain,
      // the stamp of the stage: its real label (B-3 / S-2 / A-4 / L-8 / P-6 / a detour's) / ÉLITE / JEFE over the place's name
      cards: [{ t: 1.5, dur: 3.3, num: d.kind === 'boss' ? 'JEFE' : d.kind === 'elite' ? 'ÉLITE' : stampOf(d), text: d.title.toUpperCase(), sub: d.dimName, pos: 'low', style: skin.type }],
      // a crane down from the night sky to the sign
      cam: [
        { t: 0, x: 960, y: 300, fov: 1.05 },
        { t: 2.4, y: 540, fov: 1, ease: 'inOut' },
        { t: BEATS.donde, fov: 1.06, ease: 'linear' },
      ],
      camRm: [{ t: 0, x: 960, y: 540, fov: 1 }],
    },
    {
      id: 'pasa',
      dur: BEATS.pasa,
      ...base,
      set: S('pasa'),
      in: { kind: 'whip', dur: 0.5, dir: -1 },
      weather: rain,
      cam: [
        { t: 0, x: 900, y: 620, fov: 1.12 },
        { t: BEATS.pasa, x: 1020, fov: 1.16, ease: 'linear' },
      ],
      camRm: [{ t: 0, x: 960, y: 600, fov: 1.12 }],
    },
    {
      id: 'rival',
      dur: BEATS.rival,
      ...base,
      set: S('rival'),
      in: { kind: 'cut', dur: 0 },
      cam: [
        { t: 0, x: 960, y: 560, fov: 1, hand: 2.5 },
        { t: 0.25, fov: 1.18, y: 520, ease: 'expoOut' },
        { t: BEATS.rival, fov: 1.22, ease: 'linear' },
      ],
      camRm: [{ t: 0, x: 960, y: 540, fov: 1.1 }],
    },
    { id: 'regla', dur: BEATS.regla, ...base, set: S('regla'), in: { kind: 'glitch', dur: 0.45, seed: 5 } },
    {
      id: 'riesgo',
      dur: BEATS.riesgo,
      ...base,
      set: S('riesgo'),
      in: { kind: 'cut', dur: 0 },
      weather: rain,
      cam: [{ t: 0, x: 960, y: 540, fov: 1.04 }, { t: BEATS.riesgo, fov: 1, ease: 'sine' }],
    },
  ];
  return {
    id: `brief_${d.battleId}`.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    title: `${d.tag}: ${d.title}`,
    kind: 'briefing',
    track: skin.track[d.kind] ?? null,
    loader: { style: skin.type, caption: skin.caption },
    look: skin.style === 'tv' ? { grain: 0.05, warm: 0.06 } : undefined,
    scenes,
    close: { kind: 'fade', dur: 0.6, color: 0x000000 },
  };
}

/** wire it into the Carta's hook (idempotent; films.ts imports this module) */
export function installBriefingTemplate() {
  registerBriefingTemplate((d) => briefingFilm(d));
}
installBriefingTemplate();
