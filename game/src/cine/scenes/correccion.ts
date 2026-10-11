/**
 * H41 «Correcciones» + «Continuará» (cine h41_correccion; h41_continuara = part c alone), island, after the Corrector.
 *
 * Feel: the uncanny «perfect», then defiance, then a hook. The Corrector speaks; CIRCUS MALUS's strange ending
 * plays (its four «perfect» chords, doc 18 §5.2 H41) and the island gets CORRECTED one chord at a time: the colors
 * flatten to perfect white; every cat stops and looks the same way at the same time; the sea and the falling stars
 * stand still. On the breath before the last chord Canelo refuses (he hisses), and on the last — wrong — chord the
 * correction TEARS: the world snaps back, and a signature is left written across the sky: «—N.». Luzterna. Then the
 * sky up there, a seam glowing, the Corrector's echo, and the card: CONTINUARÁ · EL CIELO DESPIERTA, on the arc cell
 * left unresolved. CIRCUS MALUS goes into the Fonoteca. Lines: b41_corrector [4..6] (b) + [7, 8] (c).
 * Synced to the track's markers (final_chord_2/3, breath, final_chord_4); without music, the same timing.
 */
import { registerCine } from '../registry';
import type { CineScript, Step } from '../types';
import type { WorldLook } from '../../state/sys/worldState';
import { audioApi } from '../../audio/api';
import { cueBest, motif, unlockMoment } from '../sound';
import { HAND } from './margen';

const B = 'b41_corrector';
const WHITE1: Partial<WorldLook> = { exposure: 1.08, tint: 0xf4f4ff, saturation: 0.38, lift: 0x000000, vignette: 0, seaGlow: 0 };
const WHITE2: Partial<WorldLook> = { exposure: 1.14, tint: 0xfafaff, saturation: 0.1, dayLife: 0, starFall: 0, seam: 0, stars: 0, lights: 0, faro: 0 };

/** part c: up to the sky, the echo, CONTINUARÁ */
const CONTINUA: Step[] = [
  { camera: { to: 'faro', offset: [-200, -620], zoom: 0.58, dur: 3.2, ease: 'inOut' }, async: true },
  { world: { to: { seam: 1, starFall: 0.6, stars: 0.35, sky: 0.22, vignette: 0.3 }, dur: 3.2 }, async: true },
  { say: { beat: B, lines: [7] } },
  { audio: { state: 'silence', fade: 1.2 } },
  { say: { beat: B, lines: [8] } },
  { wait: 0.4 },
  { fx: { id: 'card', title: 'CONTINUARÁ', sub: 'EL CIELO DESPIERTA' } },
  { call: (c) => void (!c.skipping && motif('arco_pregunta')), after: 0.9 },
  { wait: 4.8 },
  { persist: { beat: `${B}#c` } },
  { persist: { beat: B } },
  { audio: { state: 'island', fade: 4 } },
];

let cued = false;

export const CORRECCION: CineScript = {
  id: 'h41_correccion',
  stage: 'island',
  releaseBlend: 1.5,
  replay: { title: 'Correcciones', seen: `${B}#b`, order: 41 },
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    { camera: { to: 'home', offset: [-40, -30], zoom: 0.7, dur: 2.4, ease: 'inOut' }, async: true },
    { audio: { state: 'silence', fade: 1.5 } },
    { wait: 1.2 },
    { say: { beat: B, lines: [4] } },
    {
      call: (c) => {
        // the «perfect» ending of CIRCUS MALUS: four chords, the last one wrong (its stinger version; the original is a Momento's)
        cued = !!cueBest(['circus_malus.stinger'], { quantize: 'now', fadeIn: 0.05 });
        if (cued) c.own(() => audioApi.release(2));
        else if (!c.skipping) motif('correccion');
      },
    },
    // chord 1: the colors flatten
    { world: { to: WHITE1, dur: 0.7, ease: 'out' }, async: true },
    { audio: { sync: 'marker:final_chord_2', maxWait: 2.5 } },
    // chord 2: every cat, the same pose, the same way, the same time
    { fx: { id: 'pose', at: 'faro' } },
    { audio: { sync: 'marker:final_chord_3', maxWait: 2.5 } },
    // chord 3: even the sea and the stars stop
    { world: { to: WHITE2, dur: 0.5, ease: 'out' }, async: true },
    { audio: { sync: 'marker:breath', maxWait: 2.1 } },
    // the breath: Canelo says no
    { actor: { who: 'canelo', do: 'emote', arg: 'attack' } },
    { actor: { who: 'canelo', do: 'mark', arg: '¡NO!' } },
    { audio: { sync: 'marker:final_chord_4', maxWait: 0.6 } },
    // the last chord is wrong: the correction tears and the world snaps back — with a signature on it
    {
      parallel: [
        { fx: { id: 'glitch', on: 'scene', dur: 0.7, k: 1.3 } },
        { fx: { id: 'pose', off: true } },
        { call: (c) => c.releaseWorld(0.8) },
        { fx: { id: 'shake', k: 0.22 }, reduced: 'skip' },
        { fx: { id: 'ink', text: '—N.', x: 0.7, y: 0.3, size: 170, rot: -0.1, color: HAND, write: 1.4, hold: 7 }, at: 0.5 },
        { call: (c) => void (!c.skipping && motif('pluma')), at: 0.5 },
      ],
    },
    { wait: 2.2 },
    { say: { beat: B, lines: [5, 6], onLine: { 1: { actor: { who: 'species:c_espumita', do: 'hop' }, after: 0.4 } } } },
    { persist: { beat: `${B}#b` } },
    { call: (c) => void (!c.replay && unlockMoment(['circus_malus.stinger'])) },
    ...CONTINUA,
  ],
};

export const CONTINUARA: CineScript = {
  id: 'h41_continuara',
  stage: 'island',
  releaseBlend: 1.5,
  replay: { title: 'Continuará', seen: `${B}#c`, order: 41.1 },
  steps: [{ ui: { bars: true, hud: false, skip: true } }, ...CONTINUA],
};

registerCine(CORRECCION);
registerCine(CONTINUARA);
