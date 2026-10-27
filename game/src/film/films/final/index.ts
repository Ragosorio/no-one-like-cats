/**
 * EL FINAL «Se apaga» — the finale films (historia-v2/guiones/final, H93–H97; fichas F31–F40 in 03-peliculas.md).
 * ⚠️ SPOILERS. Duelo rules from the first chord of SADIE to «Continuará»: no rewards, no jingles, no tips, no jokes.
 * Originals only in films; SADIE material never before the death.
 */
import type { FilmDef } from '../../types';
import { moves, shot } from '../../camera';
import sadieMap from '../../../data/music/beatmaps/sadie.json';
import { at, key, tap, v } from '../../../momentos/score';
import { DEUDA_FALSA } from './deuda';
import { CONTINUAR, REGRESO } from './timing';

const BAR = 4.8;
const c = (bar: number) => (bar - 1) * BAR;
const recuerda = (bar: number, id: string) => tap(c(bar), { id, label: 'RECUERDA', anchor: [930, 880], lead: 1 }, { great: [v('ring', { at: [930, 470], dur: 0.9 })], hit: [v('ring', { at: [930, 470], dur: 0.9 })], miss: [] });

/** F35 · PC SADIE «Linterna mágica» — complete, bar by bar */
export const F35_SADIE: FilmDef = {
  id: 'f35_sadie',
  title: 'Linterna mágica',
  kind: 'song',
  track: 'sadie',
  map: sadieMap,
  loader: { style: 'silent', caption: 'PELÍCULA' },
  scenes: [
    {
      id: 'sadie',
      dur: 172.8,
      style: 'linterna',
      set: () => import('./sadie'),
      aspect: 2.39,
      cam: shot([{ t: 0, z: 0 }], moves.dolly(0, 115, 0, 70, 'sine'), [{ t: 150, z: 70 }, { t: 172, z: 110, ease: 'inOut' }]),
      subs: [
        { t: c(10) + 1, dur: 7.5, who: 'Luzterna', text: 'No la voy a soltar, Capi. Esta vez no es que se me olvide.' },
        { t: c(14) + 1, dur: 7, who: 'Luzterna', text: '¿Esto es lo que ve la gente cuando se muere? …Qué cursi.' },
        { t: c(26), dur: 6, who: 'Luzterna', text: 'Cuida la página, gordo. Y no te la comas.' },
        { t: c(33) + 0.2, dur: 2.6, text: '(Canelo maúlla)' },
      ],
    },
  ],
  score: [recuerda(9, 'recuerda_h48'), recuerda(17, 'recuerda_h67'), recuerda(21, 'recuerda_h73')],
  close: { kind: 'cut', dur: 0 },
};

const rain = (amount = 0.9, ground = 860) => ({ kind: 'rain' as const, amount, angle: 0.32, ground, seed: 7 });
const caida = () => import('./caida');

/** F32 · PH «La caída» — closes the siege of H93 without a victory screen */
export const F32_CAIDA: FilmDef = {
  id: 'f32_caida',
  title: 'La caída',
  kind: 'interlude',
  track: null,
  loader: { style: 'default', caption: 'PELÍCULA' },
  scenes: [
    {
      id: 'playa',
      dur: 14,
      style: 'realismo',
      set: caida,
      aspect: 2.39,
      in: { kind: 'dissolve', dur: 0.8 },
      weather: [rain(), { kind: 'lightning', strikes: [2.2, 9.6], z: 5000, seed: 4 }, { kind: 'fog', amount: 0.45, z: 1700 }],
      cam: shot([{ t: 0, x: 900, z: -60, hand: 7 }], moves.truck(0, 14, 900, 1020, 'sine'), moves.dolly(8, 13, -60, 120)),
      subs: [
        { t: 8.3, dur: 3, who: 'La Mano', text: 'Lo sostiene tu mirada, gato. Ciérrala.' },
        { t: 11.4, dur: 2.4, who: 'Luzterna', text: 'Al gordo no.' },
      ],
    },
    { id: 'cenital', dur: 3, style: 'realismo', set: caida, aspect: 2.39, in: { kind: 'cut', dur: 0 }, cam: [{ t: 0, hand: 3 }] },
    { id: 'cola', dur: 2.4, style: 'realismo', set: caida, aspect: 2.39, in: { kind: 'cut', dur: 0 }, cam: [{ t: 0, z: 80 }] },
    {
      id: 'caida',
      dur: 5,
      style: 'realismo',
      set: caida,
      aspect: 2.39,
      in: { kind: 'cut', dur: 0 },
      weather: [rain(0.8)],
      cam: shot([{ t: 0, x: 980, y: 600, z: 260 }], [{ t: 5, z: 300, ease: 'linear' }]),
    },
    { id: 'bufanda', dur: 3, style: 'realismo', set: caida, aspect: 2.39, in: { kind: 'cut', dur: 0 }, weather: [rain(0.7, 700)] },
    {
      id: 'fin',
      dur: 4,
      style: 'realismo',
      set: caida,
      aspect: 2.39,
      in: { kind: 'cut', dur: 0 },
      weather: [rain(0.7)],
      cam: [{ t: 0, x: 900, y: 560, z: 0 }],
    },
    { id: 'bitacora', dur: 4.6, style: 'realismo', set: caida, aspect: 2.39, in: { kind: 'fade', dur: 1.6, color: 0x000000 } },
  ],
  // La Mano's nib, amplified: when she starts the line (K3) and when it goes round the bubble (K5)
  score: [at(8, v('sound', { name: 'nib' })), at(14.05, v('sound', { name: 'nib' }))],
  close: { kind: 'fade', dur: 0.6, color: 0x000000 },
};

const noche = () => import('./noche');
/** F33 · PH «La noche sin Canelo» — the night without him; no music; the lighthouse is a gate from 90 s */
export const F33_NOCHE: FilmDef = {
  id: 'f33_noche',
  title: 'La noche sin Canelo',
  kind: 'interlude',
  track: null,
  loader: { style: 'default', caption: 'PELÍCULA' },
  scenes: [
    {
      id: 'casa1',
      dur: 40,
      style: 'pintura',
      set: noche,
      in: { kind: 'fade', dur: 2, color: 0x000000 },
      cam: shot([{ t: 0, x: 960, y: 120, z: 0 }], moves.crane(0.5, 8, 120, 560), [{ t: 19.5, x: 960, z: 0 }, { t: 22.5, x: 1060, y: 470, z: 330 }, { t: 26, x: 960, y: 560, z: 0 }]),
    },
    { id: 'barco', dur: 5, style: 'pintura', set: noche, in: { kind: 'cut', dur: 0 }, cam: [{ t: 0, x: 900, z: 0 }, { t: 5, z: 120, ease: 'linear' }] },
    {
      id: 'cono',
      dur: 9,
      style: 'pintura',
      set: noche,
      in: { kind: 'cut', dur: 0 },
      // (pass 5, R1) through her eyes: the bell of light over the two, ending on Canelo's CLOSED EYES
      cam: shot([{ t: 0, x: 680, y: 520, z: 120 }], [{ t: 3.5, x: 680, y: 560, z: 160 }, { t: 8.5, x: 740, y: 790, z: 560, ease: 'inOut' }]),
    },
    { id: 'barco2', dur: 4, style: 'pintura', set: noche, in: { kind: 'cut', dur: 0 }, cam: [{ t: 0, x: 700, y: 520, z: 380 }, { t: 4, z: 430, ease: 'linear' }] },
    {
      id: 'casa2',
      dur: 34,
      style: 'pintura',
      set: noche,
      in: { kind: 'cut', dur: 0 },
      cam: shot([{ t: 0, x: 980, y: 520, z: 220 }], [{ t: 12, x: 980, y: 540, z: 0, ease: 'inOut' }]),
      // (pass 6, S2) she finishes it next to him, who cannot hear it
      subs: [
        { t: 3, dur: 4.4, who: 'Luzterna', text: 'Gordo… tu bufanda… siempre me…' },
        { t: 8.2, dur: 3.2, who: 'Luzterna', text: '…me pareció horrible.' },
      ],
    },
  ],
  gates: [{ scene: 'casa2', t: 33.5, label: 'Toca el faro', at: 'faro' }],
  close: { kind: 'fade', dur: 0.5, color: 0x000000 },
};

const amanecer = () => import('./amanecer');
/** the glass of her lantern at the bottom of her float (A2b close-up): her puppet's lantern point, measured in the set */
const LAMP: [number, number] = [888, 594];
/**
 * F34 (1/3) · PH «Antes del amanecer» — the return and the relief (Klimt). The optional breakfast (R8) plays after it.
 * PASADA 7 (deuda falsa pagada, ./deuda): two sparks die, her beam and Cerito's nose together relight him, a pane of the
 * lantern goes black («tic»), «Me debes un vidrio, gordo.». Off: the measured control (one spark that catches).
 */
export const F34_AMANECER: FilmDef = {
  id: 'f34_amanecer',
  title: 'Antes del amanecer',
  kind: 'interlude',
  // «La llama vuelve»: Canelo's theme (LIKY FIGHT, derived): a low chord, then the whole theme from 4.5 s — the flame
  // catches on that entry (REGRESO.catchAt). With the debt, A1 stays almost silent: the chord is ducked under the walk
  track: 'liky_fight.amanecer',
  quiet: DEUDA_FALSA ? [[0, 2.2]] : undefined,
  loader: { style: 'davinci', caption: 'PELÍCULA' },
  scenes: [
    {
      id: 'regreso',
      dur: REGRESO.dur,
      style: 'realismo',
      set: amanecer,
      in: { kind: 'fade', dur: 1.4, color: 0x000000 },
      weather: [{ kind: 'fog', amount: 0.35, z: 1700, color: 0xc8c0c8 }],
      cam: DEUDA_FALSA
        ? shot(
            [{ t: 0, x: 860, y: 600, z: 240 }],
            [
              { t: 2.2, x: 880, y: 640, z: 330 },
              { t: 4.2, x: 900, y: 650, z: 380 },
              // A2b: the detail of the lantern — the pane goes black
              { t: 4.9, x: LAMP[0], y: LAMP[1], z: 600, ease: 'inOut' },
              { t: 6.4, x: LAMP[0], y: LAMP[1], z: 600 },
              { t: 7.8, x: 860, y: 600, z: 240, ease: 'inOut' },
              { t: 10.6, x: 900, y: 580, z: 220 },
              // A4b: on her and the lantern for the joke
              { t: 11.4, x: 960, y: 520, z: 420, ease: 'inOut' },
              { t: 15.3, x: 940, y: 540, z: 400 },
              { t: 16.6, x: 880, y: 580, z: 200, ease: 'inOut' },
              { t: REGRESO.dur, x: 900, y: 560, z: 80, ease: 'inOut' },
            ],
          )
        : shot([{ t: 0, x: 860, y: 600, z: 240 }], [{ t: 4.2, x: 900, z: 330 }, { t: 9, x: 840, z: 200 }, { t: REGRESO.dur, x: 900, y: 560, z: 80, ease: 'inOut' }]),
      // «Reducir movimiento»: the same beats with slow pushes (no quick zoom onto the lantern)
      camRm: DEUDA_FALSA
        ? [
            { t: 0, x: 860, y: 600, z: 240 },
            { t: 3, x: 880, y: 620, z: 300 },
            { t: 5.2, x: LAMP[0], y: LAMP[1], z: 460, ease: 'inOut' },
            { t: 7, x: LAMP[0], y: LAMP[1], z: 460 },
            { t: 9.6, x: 880, y: 590, z: 240, ease: 'inOut' },
            { t: 12, x: 940, y: 540, z: 340, ease: 'inOut' },
            { t: 15.4, x: 940, y: 540, z: 340 },
            { t: REGRESO.dur, x: 900, y: 560, z: 120, ease: 'inOut' },
          ]
        : undefined,
      subs: DEUDA_FALSA
        ? [
            { t: 13.1, dur: 2.6, who: 'Luzterna', text: 'Me debes un vidrio, gordo.' },
            { t: 15.4, dur: 1.6, text: '(Canelo maúlla, ofendido)' },
          ]
        : [],
    },
    {
      id: 'alivio',
      dur: 26,
      style: 'klimt',
      set: amanecer,
      in: { kind: 'lightLeak', dur: 1.2, tint: 0xffc860 },
      cam: shot([{ t: 0, x: 900, z: 0 }], moves.truck(0, 26, 900, 1000, 'sine')),
      subs: [
        { t: 8, dur: 5, who: 'Luzterna', text: '¡Gordo! ¡Me diste el susto de mi vida! ¡Nunca más te mueres sin avisar!' },
        { t: 14, dur: 2.2, text: '(Canelo maúlla)' },
      ],
    },
  ],
  // A2b: the pane goes black with a dry «tic» (the tiniest sound there is: no sting, no new music)
  score: DEUDA_FALSA ? [at(REGRESO.paneAt, v('sound', { name: 'tick', pitch: 0.55 }))] : [],
  close: { kind: 'lightLeak', dur: 1, tint: 0xffc860 },
};
/** F34 (2/2) · the blow: the light covers the two, La Mano, the overhead rhyme with H93, «…Ah.» → SADIE without a cut */
export const F34_GOLPE: FilmDef = {
  id: 'f34_golpe',
  title: 'Antes del amanecer (II)',
  kind: 'interlude',
  // the theme goes on, lower — and stops DRY at A8 (the end of this film)
  track: 'liky_fight.amanecer',
  from: 20,
  cutDry: true,
  loader: { style: 'default', caption: 'PELÍCULA' },
  scenes: [
    {
      id: 'golpe',
      dur: 12,
      style: 'realismo',
      set: amanecer,
      in: { kind: 'lightLeak', dur: 1, tint: 0xffc860 },
      cam: shot([{ t: 0, x: 960, y: 560, z: 0 }], [{ t: 7, x: 900, z: 40 }, { t: 12, x: 760, z: 90, ease: 'inOut' }]),
      subs: [{ t: 7.6, dur: 4, who: 'La Mano', text: 'La luz cuida lo que alumbra. A quien la carga, no.' }],
    },
  ],
  // the bars come in with La Mano (A7) and stay: SADIE plays in scope
  score: [key(7, { aspect: 2.39 }, { dur: 1.6 })],
  close: { kind: 'cut', dur: 0 },
};
/** F34 (3/3) · the stroke (R6: the overhead rhyme with H93, the same amplified nib), «te mato—», «…Ah.» → SADIE */
export const F34_TRAZO: FilmDef = {
  id: 'f34_trazo',
  title: 'Antes del amanecer (III)',
  kind: 'interlude',
  track: null,
  loader: { style: 'default', caption: 'PELÍCULA' },
  scenes: [
    { id: 'cenital2', dur: 3.4, style: 'realismo', set: amanecer, in: { kind: 'cut', dur: 0 }, subs: [{ t: 0.3, dur: 3, who: 'La Mano', text: '…Entonces la luz primero.' }] },
    {
      id: 'golpe2',
      dur: 9,
      style: 'realismo',
      set: amanecer,
      in: { kind: 'cut', dur: 0 },
      cam: shot([{ t: 0, x: 1300, y: 520, z: 260 }], [{ t: 3, x: 1300, y: 520, z: 240 }, { t: 3.2, x: 960, y: 540, z: 0, ease: 'hold' }, { t: 6, x: 960, y: 540, z: 0 }, { t: 9, x: 1380, y: 470, z: 420, ease: 'inOut' }]),
      subs: [
        { t: 0.4, dur: 2.6, who: 'Luzterna', text: '…y tú, si te vuelves a morir, te mato—' },
        { t: 6.6, dur: 2.2, who: 'Luzterna', text: '…Ah.' },
      ],
    },
  ],
  score: [key(0, { aspect: 2.39 }, { dur: 0 }), at(0.1, v('sound', { name: 'nib' })), at(6.42, v('sound', { name: 'nib', pitch: 0.8 }))],
  close: { kind: 'cut', dur: 0 },
};

const mano = () => import('./mano');
const POSADA_ORANGE = { accHue: 0.07, accW: 0.09 };
/** F37 · PH «La Mano» — Posada linocut: the silent reckoning, the card that erases, the lantern left on the step */
export const F37_MANO: FilmDef = {
  id: 'f37_mano',
  title: 'La Mano',
  kind: 'interlude',
  track: null,
  loader: { style: 'bass', caption: 'PELÍCULA' },
  scenes: [
    {
      id: 'mano1',
      dur: 34,
      style: 'posada',
      set: mano,
      aspect: 2.39,
      look: POSADA_ORANGE,
      in: { kind: 'inkBleed', dur: 2.2, tint: 0x0f0c0b, at: [900, 600] },
      cam: shot([{ t: 0, x: 1100, y: 560, z: 0 }], [{ t: 10, x: 900, z: 120 }, { t: 22, x: 1000, y: 540, z: 60 }, { t: 30, x: 1130, y: 600, z: 260, ease: 'inOut' }]),
    },
    {
      id: 'mano2',
      dur: 40,
      style: 'posada',
      set: mano,
      aspect: 2.39,
      look: POSADA_ORANGE,
      in: { kind: 'cut', dur: 0 },
      cam: shot([{ t: 0, x: 1100, y: 560, z: 120 }], [{ t: 18, x: 1200, z: 40 }, { t: 34, x: 1450, y: 600, z: 200, ease: 'inOut' }]),
      subs: [
        { t: 10.5, dur: 3.6, who: 'La Mano', text: 'Lo vi. Lo vi en la oscuridad.' },
        { t: 18, dur: 4, who: 'Borrón', text: 'Así le pasó a Itō. El que ve ya no puede tachar.' },
      ],
    },
  ],
  close: { kind: 'fade', dur: 1.6, color: 0x0f0c0b },
};
/** F38 · PH «La vigilia» — one long take round the dark lighthouse until dawn; scope opens to full; the player decides */
export const F38_VIGILIA: FilmDef = {
  id: 'f38_vigilia',
  title: 'La vigilia',
  kind: 'interlude',
  // «Antes de la luz» (SADIE c33–36, the clean piano ×1.5): the only SADIE material outside F35, after the death
  track: 'sadie.luz',
  loader: { style: 'default', caption: 'PELÍCULA' },
  scenes: [
    {
      id: 'vigilia',
      dur: 46,
      style: 'realismo',
      set: mano,
      in: { kind: 'fade', dur: 2, color: 0x000000 },
      cam: shot([{ t: 0, x: 600, y: 300, z: 0 }], moves.crane(0, 6, 300, 560), moves.truck(6, 44, 600, 1400, 'sine'), moves.dolly(6, 44, 0, 140, 'sine')),
    },
  ],
  score: [key(0, { aspect: 2.39 }, { dur: 0 }), key(34, { aspect: 16 / 9 }, { dur: 6 })],
  gates: [{ scene: 'vigilia', t: 45.5, label: 'Seguir' }],
  close: { kind: 'fade', dur: 0.8, color: 0x000000 },
};

const recado = () => import('./recado');
/** F39 · PH «El recado» · créditos · «Continuará» — DÍSELO is a gate; the lighthouse lights up orange */
export const F39_RECADO: FilmDef = {
  id: 'f39_recado',
  title: 'El recado',
  kind: 'interlude',
  track: null,
  loader: { style: 'default', caption: 'PELÍCULA' },
  scenes: [
    { id: 'dia', dur: 10, style: 'pintura', set: recado, in: { kind: 'fade', dur: 2, color: 0x000000 }, cam: [{ t: 0, x: 900, y: 560, z: 60 }, { t: 10, x: 960, z: 120, ease: 'sine' }] },
    {
      id: 'diselo',
      dur: 20,
      style: 'pintura',
      set: recado,
      in: { kind: 'cut', dur: 0 },
      cam: shot([{ t: 0, x: 980, y: 600, z: 260 }], [{ t: 12, x: 1020, z: 300 }, { t: 20, x: 960, y: 560, z: 80, ease: 'inOut' }]),
      subs: [{ t: 0.5, dur: 4.6, who: 'Bitácora', text: 'Dice que tu bufanda siempre le pareció horrible. Con cariño.' }],
    },
    {
      id: 'faro',
      dur: 26,
      style: 'pintura',
      set: recado,
      in: { kind: 'dissolve', dur: 1.4 },
      cam: shot([{ t: 0, x: 1120, y: 300, z: 300 }], [{ t: 8.5, x: 1120, y: 260, z: 340 }, { t: 9.2, x: 960, y: 520, z: -120, ease: 'inOut' }, { t: 18, x: 1080, y: 600, z: 160, ease: 'inOut' }]),
      cards: [{ t: 19, dur: 6.5, text: 'Nadie puede escribir debajo de un gato dormido.', sub: 'Y este no se va a ir.', pos: 'low', style: 'default', size: 54 }],
    },
  ],
  gates: [{ scene: 'dia', t: 9.6, label: 'Díselo' }],
  close: { kind: 'fade', dur: 1.6, color: 0x000000 },
};
/** F39 · the credits over her Carta, with «Antes de la luz» */
export const F39_CREDITOS: FilmDef = {
  id: 'f39_creditos',
  title: 'Créditos',
  kind: 'interlude',
  track: 'sadie.luz',
  loader: { style: 'default', caption: 'CRÉDITOS' },
  scenes: [{ id: 'creditos', dur: 30, style: 'pintura', set: recado, in: { kind: 'fade', dur: 2, color: 0x000000 }, cam: shot([{ t: 0, x: 860, y: 520, z: 0 }], moves.truck(0, 30, 860, 1080, 'sine')) }],
  close: { kind: 'fade', dur: 2, color: 0x000000 },
};
/**
 * F39 · «Continuará.» (h96-el-recado.md R12–R13). After SADIE's dry cut, the vigil and the credits' clean piano: NO music.
 * Black; her Carta comes up, dim; the Capi's hand writes «Continuará.» small in its bottom margin. The only sound is that
 * pencil — the soft, unamplified opposite of La Mano's nib (the stroke that crossed her out): a hand that goes on
 * writing in the notebook she started. Parts I and II ended on a big poster CONTINUARÁ; here it is the same word,
 * whispered. (Considered and left out: pure silence — after SADIE's black it reads as a second death or a frozen game;
 * the orange faro — it already had its moment in R8–R10; any sound from her lantern — a resurrection hook.)
 */
export const F39_CONTINUARA: FilmDef = {
  id: 'f39_continuara',
  title: 'Continuará',
  kind: 'interlude',
  track: null,
  loader: { style: 'default', caption: '' },
  scenes: [{ id: 'continuara', dur: CONTINUAR.dur, style: 'pintura', set: recado, in: { kind: 'cut', dur: 0 } }],
  score: CONTINUAR.strokes.map((t, i) => at(t, v('sound', { name: 'pencil', pitch: [1, 0.92, 1.08, 0.96, 1.04, 0.9, 1.1, 0.98, 1.02, 1.2][i] ?? 1 }))),
  close: { kind: 'cut', dur: 0 },
};

const ronda = () => import('./ronda');
/** F40 · PH «La última ronda» — the bar epilogue, 4:3, the cartoon without its laugh track */
export const F40_RONDA: FilmDef = {
  id: 'f40_ronda',
  title: 'La última ronda',
  kind: 'interlude',
  track: null,
  loader: { style: 'tv', caption: 'PELÍCULA' },
  scenes: [
    { id: 'letrero', dur: 5, style: 'borracha', set: ronda, aspect: 4 / 3, in: { kind: 'fade', dur: 1.4, color: 0xffffff } },
    { id: 'bar', dur: 21, style: 'borracha', set: ronda, aspect: 4 / 3, in: { kind: 'cut', dur: 0 }, cam: shot([{ t: 0, x: 960, y: 560, z: 0 }], [{ t: 10, x: 1300, y: 640, z: 320, ease: 'inOut' }, { t: 14, x: 960, y: 560, z: 0, ease: 'inOut' }]) },
    { id: 'vaso', dur: 10, style: 'borracha', set: ronda, aspect: 4 / 3, in: { kind: 'cut', dur: 0 }, cam: [{ t: 0, x: 760, y: 600, z: 380 }, { t: 10, x: 800, z: 420, ease: 'linear' }] },
    {
      id: 'barra',
      dur: 22,
      style: 'borracha',
      set: ronda,
      aspect: 4 / 3,
      in: { kind: 'cut', dur: 0 },
      cam: [{ t: 0, x: 600, y: 520, z: 260 }],
      subs: [
        { t: 1, dur: 3.4, who: 'Canelo', text: 'Ella siempre venía a buscarme.' },
        { t: 5, dur: 2.4, who: 'Hipólito', text: '¿Y luego?' },
        { t: 8.2, dur: 4.6, who: 'Canelo', text: 'Luego me acuerdo de ella. Todos los días.' },
      ],
    },
    { id: 'mano', dur: 8, style: 'borracha', set: ronda, aspect: 4 / 3, in: { kind: 'cut', dur: 0 }, cam: [{ t: 0, x: 1560, y: 620, z: 360 }, { t: 8, z: 420, ease: 'linear' }] },
  ],
  close: { kind: 'fade', dur: 3, color: 0xffffff },
};

const extras = () => import('./extras');
const storm = (amount = 0.9) => [{ kind: 'rain' as const, amount, angle: 0.34, ground: 860, seed: 5 }, { kind: 'lightning' as const, strikes: [3.2], z: 5000, seed: 6 }];
/** F31 · PP «Se acerca una luz» — the siege briefing (storm realism; «fut.jefe.grave» under the storm) */
export const F31_LUZ: FilmDef = {
  id: 'f31_luz',
  title: 'Se acerca una luz',
  kind: 'briefing',
  track: 'fut.jefe.grave',
  loader: { style: 'noir', caption: 'PRESENTACIÓN' },
  scenes: [
    { id: 'isla', dur: 6, style: 'realismo', set: extras, in: { kind: 'fade', dur: 1.2, color: 0x000000 }, weather: storm(), cam: shot([{ t: 0, x: 1000, y: 620, z: -200, hand: 12 }], [{ t: 6, x: 1060, z: -120, ease: 'linear' }]), cards: [{ t: 1, dur: 4.4, text: 'TU ISLA', pos: 'high', style: 'noir' }] },
    {
      id: 'gatera',
      dur: 15,
      style: 'realismo',
      set: extras,
      in: { kind: 'cut', dur: 0 },
      weather: storm(0.8),
      cam: shot([{ t: 0, x: 1150, y: 600, z: 220, hand: 6 }], [{ t: 6, x: 900, y: 600, z: 120 }, { t: 12, x: 760, y: 640, z: 380, ease: 'inOut' }]),
      subs: [{ t: 6.4, dur: 4.2, who: 'Itō', text: 'Vienen esta noche. Por los ojos del gato.' }],
    },
    {
      id: 'cielo',
      dur: 15,
      style: 'realismo',
      set: extras,
      in: { kind: 'cut', dur: 0 },
      weather: storm(0.7),
      cam: shot([{ t: 0, x: 960, y: 200, z: 0, hand: 5 }], moves.crane(0, 6, 200, 560)),
      subs: [{ t: 1, dur: 4.4, who: 'Itō', text: 'No voy a pelear contra ellos. Tampoco con ustedes.' }],
      cards: [{ t: 8, dur: 6, text: 'EL ASEDIO: HUNDIR A LOS DOS', pos: 'high', style: 'noir', size: 70 }],
    },
    { id: 'reverencia', dur: 14, style: 'realismo', set: extras, in: { kind: 'cut', dur: 0 }, weather: storm(0.8), cam: shot([{ t: 0, x: 900, y: 600, z: 200, hand: 5 }], [{ t: 14, x: 760, z: 260, ease: 'sine' }]) },
    { id: 'bitacora', dur: 8, style: 'realismo', set: extras, in: { kind: 'cut', dur: 0 }, weather: [{ kind: 'rain', amount: 0.5, angle: 0.3, ground: 1200, seed: 9 }] },
  ],
  // the bars come in slowly to scope
  score: [key(0, { aspect: 16 / 9 }, { dur: 0 }), key(4, { aspect: 2.39 }, { dur: 8 })],
  close: { kind: 'fade', dur: 0.8, color: 0x000000 },
};
/** F36 · PH «MIRA» — cat vision; one optional MIRA (he looks on his own at 4 s anyway) */
export const F36_MIRA: FilmDef = {
  id: 'f36_mira',
  title: 'MIRA',
  kind: 'interlude',
  track: null,
  loader: { style: 'noir', caption: 'PELÍCULA' },
  scenes: [
    { id: 'ojos', dur: 6, style: 'pintura', set: extras, in: { kind: 'cut', dur: 0 }, aspect: 2.39 },
    { id: 'vision', dur: 16, style: 'gato', set: extras, aspect: 2.39, in: { kind: 'iris', dur: 1.4, at: [960, 560] }, cam: shot([{ t: 0, x: 960, y: 560, z: 0 }], [{ t: 16, x: 1000, z: 120, ease: 'sine' }]) },
    { id: 'cambio', dur: 6, style: 'pintura', set: extras, aspect: 2.39, in: { kind: 'fade', dur: 1.6, color: 0x000000 } },
  ],
  score: [tap(3.6, { id: 'mira', label: 'MIRA', anchor: [960, 760], lead: 1 }, { great: [v('ring', { at: [960, 560], dur: 0.6 })], hit: [v('ring', { at: [960, 560], dur: 0.6 })], miss: [] })],
  close: { kind: 'fade', dur: 1.2, color: 0x000000 },
};

export const FINAL_FILMS: FilmDef[] = [F31_LUZ, F32_CAIDA, F33_NOCHE, F34_AMANECER, F34_GOLPE, F34_TRAZO, F35_SADIE, F36_MIRA, F37_MANO, F38_VIGILIA, F39_RECADO, F39_CREDITOS, F39_CONTINUARA, F40_RONDA];
