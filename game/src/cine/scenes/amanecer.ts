/**
 * H33 part a «Amanece» (cine h33_amanecer, island): the astral night ends ON SCREEN.
 *
 * Feel: relief, then a new question. The night music leaves, the blue hour comes (stars thinning, the lamps still
 * on), the cats yawn; on the arc cell rising the sun comes up gold, the gulls come back, the cats stretch — and out
 * where the faro's beam pointed that night, on the horizon, there is an island of books (drive 'farIsle': from now on
 * it's always there). Then the day with its scar (cielo_roto: it follows the player's clock from the next visit on).
 * Persists b33_paginas#a when the sun is up (that ends the world state 'noche_astral'). Lines: b33_paginas [0..2].
 */
import { registerCine } from '../registry';
import type { CineScript } from '../types';
import type { WorldLook } from '../../state/sys/worldState';
import { motif } from '../sound';

const B = 'b33_paginas';

const BLUE_HOUR: Partial<WorldLook> = { exposure: 0.7, tint: 0xb0b6ff, saturation: 0.85, lift: 0x0a0a22, sky: 0.85, stars: 0.45, starFall: 0.5, aurora: 0.18, seam: 0.3, lights: 0.85, faro: 0.75, seaGlow: 0.45, vignette: 0.42, dayLife: 0, cats: 0.55 };
const SUNRISE: Partial<WorldLook> = { exposure: 0.94, tint: 0xffd2b4, saturation: 0.98, lift: 0x0a0406, sky: 0.28, stars: 0.12, starFall: 0.15, aurora: 0, seam: 0.5, lights: 0.2, faro: 0.1, seaGlow: 0.15, vignette: 0.18, dayLife: 0.7, cats: 0.15 };

export const AMANECER: CineScript = {
  id: 'h33_amanecer',
  stage: 'island',
  releaseBlend: 2,
  replay: { title: 'Amanece', seen: `${B}#a`, order: 33 },
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    // toward the horizon the beam pointed at
    { camera: { to: 'faro', offset: [-1700, -470], zoom: 0.6, dur: 4, ease: 'inOut' }, async: true },
    { audio: { state: 'silence', fade: 4 } },
    { world: { to: BLUE_HOUR, dur: 4.5, ease: 'inOut' }, async: true },
    { actor: { who: 'awake', do: 'act', arg: 'yawn', stagger: 0.1 }, after: 1.6 },
    { wait: 2.6 },
    { audio: { ambience: 'sea', fade: 6 } },
    // the sun comes up on the arc cell; something is out there
    { call: (c) => void (!c.skipping && motif('arco')) },
    { world: { to: SUNRISE, dur: 4.5, ease: 'out' }, async: true },
    { drive: { id: 'farIsle', to: 1, dur: 5.5, ease: 'inOut' }, async: true, after: 0.8 },
    { actor: { who: 'all', do: 'act', arg: 'stretch', stagger: 0.07 }, after: 1.4 },
    { wait: 3.6 },
    { say: { beat: B, lines: [0, 1] } },
    // full daylight, with its scar
    { world: { to: 'cielo_roto', dur: 3.5, ease: 'inOut' }, async: true },
    { call: (c) => (c.stage as { holdDay?: () => void }).holdDay?.(), when: (c) => !c.replay },
    { persist: { beat: `${B}#a` } },
    { audio: { state: 'island', fade: 4 } },
    { ui: { bars: false, hud: true, skip: false } },
    { say: { beat: B, lines: [2] } },
    { fx: { id: 'point', at: 'hud:sail', text: 'LA CARTA' } },
    { wait: 4 },
  ],
};

registerCine(AMANECER);
