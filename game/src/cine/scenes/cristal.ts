/**
 * H40 part b «Lo que recuerda el cristal» (cine h40_cristal, island, after Madre Nácar).
 *
 * Feel: a chill, then grief, then a joke to breathe. What the crystal shows is shown on YOUR island: the light goes
 * prismatic (a glass chord), the camera finds the rocks off the coast and there's a cat sitting there, made of
 * static, looking back (REGISTRO 000's out-of-tune cell) — blink, and it isn't. Then «your island without cats,
 * without faro»: the cats fade out, the faro goes dark, the color drains (a hollow low tone). Luzterna says «cover
 * it» and everything comes back. Lines: b40_madrenacar [3..5] (the caption that described it is gone: you see it).
 */
import { registerCine } from '../registry';
import type { CineScript } from '../types';
import type { WorldLook } from '../../state/sys/worldState';
import { motif } from '../sound';

const B = 'b40_madrenacar';
const PRISM: Partial<WorldLook> = { exposure: 0.84, tint: 0xd6ccff, saturation: 0.72, lift: 0x0a0820, sky: 0.55, skyTint: 0xd8c8ff, stars: 0.45, lights: 0.55, seaGlow: 0.7, vignette: 0.55, dayLife: 0.15, cats: 0 };
const EMPTY: Partial<WorldLook> = { exposure: 0.74, tint: 0xc8ccd8, saturation: 0.18, lift: 0x06060c, sky: 0.3, stars: 0.1, lights: 0, faro: 0, seaGlow: 0, vignette: 0.7, dayLife: 0, cats: 0, starFall: 0 };

export const CRISTAL: CineScript = {
  id: 'h40_cristal',
  stage: 'island',
  releaseBlend: 2,
  replay: { title: 'Lo que recuerda el cristal', seen: `${B}#b`, order: 40 },
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    { audio: { state: 'silence', fade: 1.5 } },
    { call: (c) => void (!c.skipping && motif('cristal')) },
    { world: { to: PRISM, dur: 2.4, ease: 'inOut' }, async: true },
    { camera: { to: 'rocks', offset: [0, -90], zoom: 1.1, dur: 3, ease: 'inOut' } },
    {
      say: {
        beat: B,
        lines: [3],
        onLine: {
          0: [
            { fx: { id: 'silhouette', at: 'rocks' }, after: 1.4 },
            { call: (c) => void (!c.skipping && motif('registro_000')), after: 1.5 },
          ],
        },
      },
    },
    { wait: 1.1 },
    // blink…
    { fx: { id: 'fade', to: 0.95, dur: 0.1 } },
    { wait: 0.16 },
    { fx: { id: 'silhouette', off: true } },
    { fx: { id: 'fade', to: 0, dur: 0.18 } },
    { wait: 1 },
    // …and your island, as if you had never arrived
    { camera: { to: 'home', offset: [-40, -20], zoom: 0.66, dur: 2.6, ease: 'inOut' }, async: true },
    {
      say: {
        beat: B,
        lines: [4],
        onLine: {
          0: [
            { fx: { id: 'hideCats', dur: 1.6 }, after: 0.6 },
            { world: { to: EMPTY, dur: 2.2, ease: 'inOut' }, after: 0.6 },
            { call: (c) => void (!c.skipping && motif('vacio')), after: 0.8 },
          ],
        },
      },
    },
    { wait: 0.6 },
    { say: { beat: B, lines: [5] } },
    // covered: everyone's back
    { fx: { id: 'hideCats', off: true } },
    { call: (c) => c.releaseWorld(1.6) },
    { actor: { who: 'awake', do: 'hop', stagger: 0.05 }, after: 0.5 },
    { persist: { beat: `${B}#b` } },
    { audio: { state: 'island', fade: 3 } },
    { wait: 1.2 },
  ],
};

registerCine(CRISTAL);
