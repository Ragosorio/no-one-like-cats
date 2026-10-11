/**
 * Isla de las Páginas Hundidas (region stage, regions/paginas.ts).
 *
 * h33_llegada «Tierra a la vista» — the first landing. Feel: awe, a little dread. The island is still under the sea
 * when you arrive (paginas starts it sunk while this scene is owed): only the tip of its lighthouse breaks the
 * water. On WHEN I LOSE's opening hit it starts to RISE (drive 'rise': real motion, the sea's foam climbing the
 * cliffs, water pouring off the books, loose pages flying up); the voices come in as it breaks the surface; the
 * camera comes in low over the water and lands on the beach, where your cats come ashore one by one. Two lines.
 * Lines: b33_paginas [3, 4]. Persists b33_paginas#b.
 *
 * h36_eco «Una página con nombre» — Canelo's golden page lands on the book: it glows, a music box plays LIKY
 * FIGHT's melody (Re–Si♭–Sol: his Eco), the caption IS the page; Canelo climbs on it and sits. Three lines.
 * Lines: b36_pagina_canelo [2..4]. Persists b36_pagina_canelo#b.
 */
import { registerCine } from '../registry';
import type { CineScript } from '../types';
import { audioApi } from '../../audio/api';
import { cueBest, stingerOr, unlockMoment } from '../sound';

export const LLEGADA: CineScript = {
  id: 'h33_llegada',
  stage: 'region',
  releaseBlend: 1,
  replay: { title: 'Tierra a la vista', seen: 'b33_paginas#b', order: 33.1, region: 'paginas' },
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    // (a replay starts from the island as it is: send it back under first, behind the letterbox)
    { drive: { id: 'rise', from: 0, to: 0, dur: 0 }, when: (c) => c.replay },
    // low over the water, the lighthouse tip ahead
    { camera: { to: [0, 4, -6], yaw: 0.55, pitch: 0.14, dist: 92, dur: 0 } },
    {
      call: (c) => {
        // WHEN I LOSE's ambient version (voices and keys, no drums): the original belongs to a Momento
        const ref = cueBest(['when_i_lose.ambient'], { quantize: 'now', fadeIn: 0.4 });
        if (!ref) audioApi.setState('silence', { fade: 1 });
        else c.own(() => audioApi.release(5));
      },
    },
    { audio: { ambience: 'sea', level: 1, fade: 1 } },
    { wait: 1.2 },
    { audio: { sync: 'bar', maxWait: 0.8 } },
    // it comes up: heavy at first, then it settles
    { drive: { id: 'rise', to: 1, dur: 13, ease: 'inOut' }, async: true },
    { fx: { id: 'shake', k: 0.25 }, after: 0.4 },
    { camera: { to: [0, 6, -4], yaw: 0.62, pitch: 0.24, dist: 74, dur: 12, ease: 'inOut' }, async: true },
    { fx: { id: 'shake', k: 0.18 }, after: 5 },
    { wait: 8 },
    // down to the beach: your cats come ashore
    { camera: { to: 'arrival', yaw: 0.35, pitch: 0.34, dist: 20, dur: 3.2, ease: 'inOut' } },
    { fx: { id: 'land' } },
    { wait: 1.8 },
    { say: { beat: 'b33_paginas', lines: [3, 4] } },
    { persist: { beat: 'b33_paginas#b' } },
    { call: (c) => void (!c.replay && unlockMoment(['when_i_lose.ambient'])) },
    { camera: { to: 'center', yaw: 0.55, pitch: 0.5, dist: 60, dur: 2.5, ease: 'inOut' } },
  ],
  // SALTAR / the end: the island is up, everyone ashore
  finish: (c) => {
    (c.stage as { drive?: (id: string, k: number, ctx: typeof c) => void }).drive?.('rise', 1, c);
    c.stage.fx({ id: 'land' }, c);
  },
};

export const ECO: CineScript = {
  id: 'h36_eco',
  stage: 'region',
  releaseBlend: 1,
  replay: { title: 'Una página con nombre', seen: 'b36_pagina_canelo#b', order: 36, region: 'paginas' },
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    { camera: { to: 'rest', yaw: 0.35, pitch: 0.82, dist: 8.5, dur: 2.4, ease: 'inOut' } },
    { fx: { id: 'sit' }, when: (c) => c.replay },
    { fx: { id: 'pageGlow' } },
    // the music box: his melody, as if someone wound it up a long time ago
    { call: (c) => void (!c.skipping && stingerOr('eco')) },
    { wait: 1.4 },
    { say: { beat: 'b36_pagina_canelo', lines: [2] } },
    { actor: { who: 'canelo', do: 'emote', arg: 'happy' } },
    { camera: { to: 'rest', yaw: 0.6, pitch: 0.55, dist: 13, dur: 3.5, ease: 'inOut' }, async: true },
    { say: { beat: 'b36_pagina_canelo', lines: [3, 4] } },
    { persist: { beat: 'b36_pagina_canelo#b' } },
    { wait: 1.2 },
  ],
};

registerCine(LLEGADA);
registerCine(ECO);
