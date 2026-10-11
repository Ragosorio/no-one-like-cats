/**
 * Parte II · Oleada 4 «El Umbral» — the CINE scenes that play INSIDE La Isla que Nadie Recuerda (region `olvidada`,
 * regions/olvidada.ts → RegionBuild.cine: points, fx, drives). Until 2026-10-10 these three parts were dialog
 * (MENORES 2026-10-10, docs/part-ii/27-oleada-4.md §Escenas):
 *
 *   h60_color    b60 b: the last wall stands — the island in color, the cats that remember, Polvillo shakes the dust off
 *   h61_pagina   b61 a: the blank page breathes over your first habitat; Luzterna says to touch it
 *   h61_linea    b61 c: the strikethroughs gather into one line of ink that points at the edge of the chart
 *
 * Played by the story director (ui/story/rupturasScriptO4.ts: `special: 'cine'`, `onlyOn: 'region'`); the beat ids
 * and their lines never change. «Volver a ver» sails to the island and plays them again (`replay.region`): a replay
 * paints the moment back (the old photo, the blank page, the line) and hands the island back to what the save says
 * (`finish`). Nothing persists in a replay. Every 3D step is guarded by `inOlvidada` (played anywhere else — a reload
 * that lands in another region — only the lines are said). The music is the region's own (YONOSE TODO
 * «Reconstrucción» variations, director state `emotional:olvidada`): no originals here.
 */
import { registerCine } from '../../cine/registry';
import type { CineCtx, CineScript, Step } from '../../cine/types';
import { motif } from '../../cine/sound';

const B60 = 'b60_olvidada';
const B61 = 'b61_distraxia';

const inOlvidada = (c: CineCtx) => (c.stage as unknown as { regionId?: string }).regionId === 'olvidada';
const replayHere = (c: CineCtx) => c.replay && inOlvidada(c);
const has = (c: CineCtx, id: string) => (c.stage.driveGet?.(id) ?? 0) > 0;
const BARS: Step = { ui: { bars: true, hud: false, skip: true } };
/** hand the island back to what the save says (after the last step, and after SALTAR) */
const giveBack =
  (...ids: string[]) =>
  (c: CineCtx) => {
    if (!inOlvidada(c)) return;
    for (const id of ids) c.stage.drive?.(id, -1, c);
  };

// ------------------------------------------------------------------ H60 b · el color vuelve
export const H60_COLOR: CineScript = {
  id: 'h60_color',
  stage: 'region',
  releaseBlend: 1,
  replay: { title: 'El color vuelve', seen: `${B60}#b`, order: 60.1, region: 'olvidada' },
  steps: [
    BARS,
    // a replay starts from the old photo: every ruin down, no color; then the habitats stand and the wave runs
    // (the first time, the island's own last wave just ran: regions/olvidada.ts holds the story until it ends)
    { drive: { id: 'color', from: 0, to: 0, dur: 0 }, when: replayHere },
    { drive: { id: 'reparada', from: 0, to: 0, dur: 0 }, when: replayHere },
    // (the page and the line of ink come later in the story)
    { drive: { id: 'pagina', from: 0, to: 0, dur: 0 }, when: replayHere },
    { drive: { id: 'linea', from: 0, to: 0, dur: 0 }, when: replayHere },
    { camera: { to: 'centro', pitch: 0.42, dist: 72, dur: 0 }, when: replayHere },
    { wait: 0.6, when: replayHere },
    { drive: { id: 'reparada', to: 1, dur: 2.2, ease: 'out' }, when: replayHere },
    { fx: { id: 'ola', dur: 4 }, when: replayHere },
    // over the island in color, slowly around
    { camera: { to: 'centro', pitch: 0.36, dist: 62, dur: 6, ease: 'inOut' }, async: true, when: inOlvidada },
    { say: { beat: B60, lines: [3] } },
    // the cats that didn't remember their names, glad
    { actor: { who: 'all', do: 'hop', stagger: 0.05 } },
    { fx: { id: 'stars', n: 30, spread: 14, up: 4, life: 3 }, when: inOlvidada, reduced: 'skip' },
    // Polvillo, out of the dust of the last ruin (still waiting for you here) — else the lighthouse that lit up
    { camera: { to: 'polvillo', pitch: 0.2, dist: 13, dur: 2.6, ease: 'inOut' }, when: (c) => inOlvidada(c) && has(c, 'polvillo') },
    { camera: { to: 'faro', pitch: 0.24, dist: 28, dur: 2.6, ease: 'inOut' }, when: (c) => inOlvidada(c) && !has(c, 'polvillo') },
    { fx: { id: 'polvo' }, when: inOlvidada },
    { say: { beat: B60, lines: [4, 5] } },
    { persist: { beat: `${B60}#b` } },
    { wait: 0.4 },
  ],
  finish: (c) => {
    if (!inOlvidada(c) || !c.replay) return;
    // a skipped replay lands on the island as it is: all raised, in color, the page and the line as the save says
    c.stage.drive?.('reparada', 1, c);
    c.stage.drive?.('color', 1, c);
    giveBack('pagina', 'linea')(c);
  },
};

// ------------------------------------------------------------------ H61 a · una página que respira
export const H61_PAGINA: CineScript = {
  id: 'h61_pagina',
  stage: 'region',
  releaseBlend: 1,
  replay: { title: 'Una página que respira', seen: `${B61}#a`, order: 61, region: 'olvidada' },
  steps: [
    BARS,
    // a replay brings the page back, blank (later in the story it's written on, or gone)
    { drive: { id: 'pagina', from: 1, to: 1, dur: 0 }, when: replayHere },
    { drive: { id: 'escritura', from: 0, to: 0, dur: 0 }, when: replayHere },
    { drive: { id: 'linea', from: 0, to: 0, dur: 0 }, when: replayHere },
    { camera: { to: 'centro', pitch: 0.34, dist: 54, dur: 0 }, when: replayHere },
    // from over the island down to the page over your first habitat
    { camera: { to: 'pagina', pitch: 0.2, dist: 24, dur: 3.6, ease: 'inOut' }, when: inOlvidada },
    { say: { beat: B61, lines: [0] } },
    { call: (c) => void (!c.skipping && motif('pluma')) },
    { camera: { to: 'pagina', pitch: 0.14, dist: 15, dur: 2.6, ease: 'inOut' }, async: true, when: inOlvidada },
    { say: { beat: B61, lines: [1, 2] } },
    { persist: { beat: `${B61}#a` } },
    { wait: 0.3 },
  ],
  // the camera stays on the page: LA PÁGINA EN BLANCO is right there to touch
  finish: giveBack('pagina', 'escritura', 'linea'),
};

// ------------------------------------------------------------------ H61 c · una línea hacia el borde
export const H61_LINEA: CineScript = {
  id: 'h61_linea',
  stage: 'region',
  releaseBlend: 1,
  replay: { title: 'Una línea hacia el borde', seen: `${B61}#c`, order: 61.2, region: 'olvidada' },
  steps: [
    BARS,
    { drive: { id: 'pagina', from: 1, to: 1, dur: 0 }, when: replayHere },
    { drive: { id: 'escritura', from: 1, to: 1, dur: 0 }, when: replayHere },
    { camera: { to: 'pagina', pitch: 0.2, dist: 18, dur: 1.6, ease: 'inOut' }, when: inOlvidada },
    // the strikes gather into one line that runs over the sea… and the camera follows it toward the edge
    { drive: { id: 'linea', from: 0, to: 0, dur: 0 }, when: inOlvidada },
    {
      parallel: [
        { drive: { id: 'linea', to: 1, dur: 5.5, ease: 'inOut' } },
        { camera: { to: 'borde', pitch: 0.34, dist: 78, dur: 6, ease: 'inOut' } },
      ],
      async: true,
      when: inOlvidada,
    },
    { call: (c) => void (!c.skipping && motif('pluma')), after: 0.4 },
    { say: { beat: B61, lines: [7] } },
    { say: { beat: B61, lines: [8] } },
    { persist: { beat: `${B61}#c` } },
    // back over the island (the line stays, pointing out to sea)
    { camera: { to: 'centro', pitch: 0.36, dist: 62, dur: 2.4, ease: 'inOut' }, when: inOlvidada },
  ],
  finish: giveBack('pagina', 'escritura', 'linea'),
};

export const O4_REGION_CINES = [H60_COLOR, H61_PAGINA, H61_LINEA].map((s) => s.id);
for (const s of [H60_COLOR, H61_PAGINA, H61_LINEA]) registerCine(s);
