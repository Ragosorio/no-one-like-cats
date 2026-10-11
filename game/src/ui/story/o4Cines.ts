/**
 * Parte II · Oleada 4 «El Umbral» — the CINE scenes of the wave on YOUR island (src/cine contract, docs/part-ii/20 §3 ·
 * docs/part-ii/27-oleada-4.md §Escenas). Registered at import (app/oleada4Flow.ts imports this file at boot): the story
 * director plays them through `special: 'cine'` (ui/story/rupturasScriptO4.ts); Ajustes › VOLVER A VER replays the
 * ones with `replay` (nothing persists in a replay: every call with an effect checks `c.replay`).
 *
 *   h58_suenos       H58 a: night falls in watercolor; every cat dozes and the same dream rises off the island to the sea
 *   h59_ecos         H59 a: morning; the cats wake up stretching, with things they didn't have («?»), the eco motif
 *   h62_correctores  H62 a: the Correctores' «perfect» reaches your island — colors flatten, every cat strikes the same
 *                    pose toward the white fleet, until Canelo says no and the picture tears
 *   h64_pagina       H64 a: the clearest night; the blank page comes down from the sky like a leaf and lands by your
 *                    faro (a prop that STAYS there: ui/story/o4Pagina.ts). Then the world invites: TOCA EL FARO
 *   h64_mentira      H64 b: tap the faro (or the page): you're asked what to write (cosmetic, remembered), Canelo climbs
 *                    onto the page and falls asleep on it, and «…Mentira.»                       ┐ the FALLBACK of the
 *   h65_creditos     H65: dawn, Canelo still asleep on the page, then the Parte II credits;     ┘ finale: app/o4Finale.ts
 *                    REGISTRO 000 wakes on the last card (ui/story/creditsParteII.ts)            playFinale() — MOMENTO
 *
 * The world states each scene blends to are registered by state/sys/rupturasO4.ts (derived from mission progress).
 * Music (2026-10-10): the six ORIGINAL songs are reserved for the «Momentos musicales» — these scenes only use
 * variations (`*.ambient`, `*.explore`, `*.aftermath*`, `yonose_todo.menu_loop`), `amb.*`, stingers and director
 * states. The Fonoteca unlocks of doc 18 §8 live in app/oleada4Flow.ts O4_SONGS.
 */
import { registerCine } from '../../cine/registry';
import type { CineCtx, CineScript, Step } from '../../cine/types';
import { audioApi } from '../../audio/api';
import { cueBest, motif } from '../../cine/sound';
import { storyLayer, say } from '../dialog';
import { C } from '../theme';
import { G } from '../../state/game';
import { chooseMentira, mentiraChoice, type MentiraChoice } from '../../state/sys/rupturasO4';
import { dreamLayers } from '../../state/sys/suenosDream';
import { CREDITS_LINES, MENTIRA_LINES, MENTIRA_OPTIONS, MENTIRA_REPLY } from './rupturasScriptO4';
import { FINALE_FALLBACK_BEDS, finaleCtx, finaleRunning } from '../../app/o4Finale';
import { MentiraPanel } from './o4Mentira';
import { syncFaroPage, PAGE_ARRIVED, PAGE_ASLEEP } from './o4Pagina';
// the wave's scenes inside La Isla que Nadie Recuerda (b60 b, b61 a, b61 c) register with these
import './o4RegionCines';
export { O4_REGION_CINES } from './o4RegionCines';

const B58 = 'b58_suenos';
const B59 = 'b59_ecos';
const B62 = 'b62_correctores';
const B64 = 'b64_mentira';
const B65 = 'b65_continuara';

/** a narrative cue of the first ref that exists, released when the cine ends (however it ends) */
function cueOwned(c: CineCtx, refs: string[], o: Parameters<typeof cueBest>[1] = {}) {
  if (c.skipping) return;
  if (cueBest(refs, o)) c.own(() => audioApi.release(2.5));
}

// ------------------------------------------------------------------ H58 a · the island dreams
export const H58_SUENOS: CineScript = {
  id: 'h58_suenos',
  stage: 'island',
  releaseBlend: 3,
  replay: { title: 'La isla ronca a coro', seen: `${B58}#a`, order: 58 },
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    { audio: { state: 'explore_mystery', ambience: 'night_astral', level: 0.45, fade: 2.5 } },
    // the dream has its own recording when it exists (doc 18 §5.2 H58: amb.suenos); else the night's
    { call: (c) => (audioApi.setLayers('amb.suenos', dreamLayers(G.s), { fade: 3 }), cueOwned(c, ['amb.suenos', 'amb.night_astral'], { fadeIn: 3, loop: true })) },
    { world: { to: 'o4_suenos', dur: 5 }, async: true },
    { camera: { to: 'home', offset: [0, -60], zoom: 0.66, dur: 3.2, ease: 'inOut' }, async: true },
    // every cat dozes off, a beat apart, then they breathe together
    { actor: { who: 'all', do: 'emote', arg: 'sleepy', stagger: 0.06 }, after: 0.8 },
    { wait: 1.6 },
    {
      say: {
        beat: B58,
        lines: [0],
        // the same dream rises off the island, one bubble per sleeper, and drifts out to sea
        onLine: { 0: [{ fx: { id: 'burst', n: 40, dur: 6, far: 60 }, after: 1.2, reduced: { fx: { id: 'burst', n: 14, dur: 6, far: 20 } } }] },
      },
    },
    { camera: { to: 'lagoon', offset: [-140, -280], zoom: 0.56, dur: 3.6, ease: 'inOut' }, async: true },
    { say: { beat: B58, lines: [1, 2] } },
    { actor: { who: 'canelo', do: 'emote', arg: 'sleepy' } },
    { say: { beat: B58, lines: [3] } },
    { persist: { beat: `${B58}#a` } },
    { ui: { bars: false, hud: true, skip: false } },
  ],
};

// ------------------------------------------------------------------ H59 a · they wake up with another life
export const H59_ECOS: CineScript = {
  id: 'h59_ecos',
  stage: 'island',
  releaseBlend: 2,
  replay: { title: 'Amanecen raros', seen: `${B59}#a`, order: 59 },
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    { audio: { state: 'island', ambience: 'sea', level: 0.5, fade: 3 } },
    { world: { to: 'o4_eco', dur: 4 }, async: true },
    { camera: { to: 'home', offset: [40, -30], zoom: 0.72, dur: 3, ease: 'inOut' }, async: true },
    { actor: { who: 'all', do: 'act', arg: 'stretch', stagger: 0.07 }, after: 1.2 },
    { wait: 1.4 },
    {
      say: {
        beat: B59,
        lines: [0],
        // sand from a beach that doesn't exist, a hat nobody bought: «?» over cat after cat
        onLine: { 0: [{ actor: { who: 'all', do: 'mark', arg: '?', stagger: 0.18 }, after: 1 }] },
      },
    },
    { call: (c) => void (!c.skipping && motif('eco')) },
    { say: { beat: B59, lines: [1, 2] } },
    { actor: { who: 'all', do: 'emote', arg: 'happy', stagger: 0.05 } },
    { say: { beat: B59, lines: [3] } },
    { persist: { beat: `${B59}#a` } },
    { ui: { bars: false, hud: true, skip: false } },
  ],
};

// ------------------------------------------------------------------ H62 a · a perfect world, on your island
export const H62_CORRECTORES: CineScript = {
  id: 'h62_correctores',
  stage: 'island',
  releaseBlend: 1.5,
  replay: { title: 'Un mundo sin errores', seen: `${B62}#a`, order: 62 },
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    { audio: { state: 'silence', ambience: 'night_astral', level: 0.35, fade: 1.5 } },
    // the Correctores' circus, tidied up (CIRCUS MALUS is theirs; its original is the H62 Momento: a variation here)
    { call: (c) => cueOwned(c, ['circus_malus.explore'], { fadeIn: 2, loop: true }) },
    { camera: { to: 'rocks', offset: [0, -220], zoom: 0.55, dur: 3, ease: 'inOut' }, async: true },
    { wait: 1 },
    { say: { beat: B62, lines: [0] } },
    // corrected: the colors flatten to a perfect white and every cat takes the same pose, the same way, at once
    { world: { to: { exposure: 1.06, tint: 0xf4f4ff, saturation: 0.3, aurora: 0.2, starFall: 0, vignette: 0.12 }, dur: 2.2, ease: 'out' }, async: true },
    { fx: { id: 'pose', at: 'rocks' } },
    { say: { beat: B62, lines: [1, 2] } },
    {
      say: {
        beat: B62,
        lines: [3],
        // «No va a poder no querer.» — Canelo can not-want just fine
        onLine: { 0: [{ actor: { who: 'canelo', do: 'emote', arg: 'attack' }, after: 1.2 }, { actor: { who: 'canelo', do: 'mark', arg: '¡NO!' }, after: 1.3 }] },
      },
    },
    {
      parallel: [
        { fx: { id: 'pose', off: true } },
        { call: (c) => c.releaseWorld(1) },
        { fx: { id: 'glitch', on: 'scene', dur: 0.6, k: 0.9 }, reduced: 'skip' },
        { call: (c) => void (!c.skipping && motif('correccion')), at: 0.2 },
      ],
    },
    { wait: 1.2 },
    { persist: { beat: `${B62}#a` } },
    { ui: { bars: false, hud: true, skip: false } },
  ],
};

// ------------------------------------------------------------------ H64 a · the page comes down to your faro
let pageHeld = false;
async function dropPage(c: CineCtx) {
  const p = syncFaroPage({ force: 'waiting' });
  if (!p) return;
  pageHeld = true;
  await p.fall(c.skipping || c.reduceMotion);
}
export const pageHeldByCine = () => pageHeld;

export const H64_PAGINA: CineScript = {
  id: 'h64_pagina',
  stage: 'island',
  releaseBlend: 3,
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    { audio: { state: 'emotional', ambience: 'night_astral', level: 0.6, fade: 3 } },
    // the clearest night of all: every light on, every cat looking up
    { world: { to: 'o4_mentira', dur: 5 }, async: true },
    { camera: { to: 'faro', offset: [60, -520], zoom: 0.58, dur: 3, ease: 'inOut' } },
    { actor: { who: 'awake', do: 'look', arg: 'faro', dur: 10, stagger: 0.08 } },
    { wait: 0.8 },
    {
      parallel: [
        { call: (c) => dropPage(c) },
        { say: { beat: B64, lines: MENTIRA_LINES.arrive }, at: 1.2 },
        { camera: { to: 'faro', offset: [150, 210], zoom: 0.82, dur: 5.5, ease: 'inOut' }, at: 0.8 },
      ],
    },
    { fx: { id: 'burst', n: 12, dur: 2.5, far: 0 }, reduced: 'skip' },
    { persist: { beat: `${B64}#a` } },
    { ui: { bars: false, hud: true, skip: false } },
  ],
  finish: () => {
    pageHeld = false;
  },
};

// ------------------------------------------------------------------ H64 b · «Mentira» (fallback of the finale)
let panel: MentiraPanel | null = null;
const finale = (c: CineCtx) => finaleCtx({ replay: c.replay });

/** «¿Qué escribes?»: the game's prompt, then Luzterna's answer. The pick is remembered (cosmetic) unless replaying */
export async function askMentira(replay = false): Promise<MentiraChoice> {
  const { choicePrompt } = await import('./profile');
  const pick = await choicePrompt(storyLayer(), {
    title1: '¿QUÉ',
    title2: 'ESCRIBES?',
    sub: 'La página está en blanco y el lápiz en tu mano. No hay respuesta mala.',
    tag: 'LA PÁGINA EN BLANCO',
    options: MENTIRA_OPTIONS.map((o) => ({ label: o.label, value: o.id, color: o.id === 'nada' ? C.paper : C.yellow })),
  });
  if (!replay) {
    chooseMentira(pick);
    G.save();
  }
  await say([['LUZTERNA', MENTIRA_REPLY[pick]]], { dim: 0.2 });
  return pick;
}

/** the close-up (a comic inset over the night): the page on the ground, then Canelo climbs onto it */
async function climb(c: CineCtx) {
  // SALTAR: nothing to watch (the page by the faro shows him asleep there afterwards)
  if (c.skipping) return;
  panel?.destroy();
  panel = new MentiraPanel(storyLayer(), { reduceMotion: c.reduceMotion });
  await panel.page(true);
  await panel.climb(c.skipping);
}

/** the finale's bed: YONOSE TODO «Reconstrucción» (a variation; the original is the Momento's). It carries on into
 *  the credits when the finale continues (playFinale), else it is handed back when this scene ends */
function bedOn(c: CineCtx) {
  if (c.skipping) return;
  const cur = audioApi.currentTrack() ?? '';
  if (!cur.startsWith('yonose_todo.')) cueBest([...FINALE_FALLBACK_BEDS.slice(0, 1), 'yonose_todo.ambient'], { fadeIn: 3, loop: true });
  c.own(() => {
    if (c.replay || !finaleRunning()) audioApi.release(3);
  });
}

export const MENTIRA: CineScript = {
  id: 'h64_mentira',
  stage: 'island',
  releaseBlend: 2.5,
  replay: { title: 'Una noche en el faro', seen: PAGE_ASLEEP, order: 64 },
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    { audio: { state: 'emotional', ambience: 'night_astral', level: 0.6, fade: 2 } },
    { call: (c) => bedOn(c) },
    { world: { to: 'o4_mentira', dur: 2 }, async: true },
    { camera: { to: 'faro', offset: [150, 210], zoom: 0.9, dur: 2.5, ease: 'inOut' }, async: true },
    { actor: { who: 'awake', do: 'look', arg: 'faro', dur: 12, stagger: 0.06 }, after: 0.6 },
    { wait: 1.2 },
    // a replay starts where the night started
    { say: { beat: B64, lines: MENTIRA_LINES.arrive }, when: (c) => c.replay },
    { say: { beat: B64, lines: MENTIRA_LINES.ask } },
    // the replay asks again but remembers nothing; SALTAR never asks
    { call: async (c) => void (!c.skipping && (await askMentira(c.replay))) },
    // before the pencil touches the paper…
    { call: (c) => climb(c) },
    { say: { beat: B64, lines: MENTIRA_LINES.climb } },
    // point of no return: Canelo is asleep on the page (and stays there, by your faro: ui/story/o4Pagina.ts)
    { persist: { beat: PAGE_ASLEEP } },
    { call: (c) => finale(c).asleep() },
    { say: { beat: B64, lines: MENTIRA_LINES.law } },
    { say: { beat: B64, lines: MENTIRA_LINES.border } },
    { wait: 0.6 },
    {
      parallel: [
        { call: (c) => panel?.slam('MENTIRA.', { flash: !c.reduceFlashes }) },
        { audio: { stinger: 'reveal' } },
        { call: (c) => void (!c.skipping && motif('arco')) },
        { fx: { id: 'burst', n: 50, dur: 3.5, far: 40 }, reduced: { fx: { id: 'burst', n: 16, dur: 3.5, far: 10 } } },
        { actor: { who: 'all', do: 'emote', arg: 'happy', stagger: 0.03 }, at: 0.2 },
        { say: { beat: B64, lines: MENTIRA_LINES.mentira } },
      ],
    },
    // H64 done + YONOSE TODO complete in the Fonoteca (app/o4Finale.ts)
    { call: (c) => finale(c).mentira() },
    { say: { beat: B64, lines: MENTIRA_LINES.end } },
    { call: () => panel?.close() },
    { persist: { beat: B64 } },
    { ui: { bars: false, hud: true, skip: false } },
  ],
  finish: (c) => {
    if (panel && !panel.destroyed) void panel.close();
    panel = null;
    // SALTAR folds the scene: Canelo is asleep and it's done all the same
    finale(c).asleep();
    finale(c).mentira();
  },
};

// ------------------------------------------------------------------ H65 «Continuará» (fallback of the finale)
const CREDITS_STEPS: Step[] = [
  { ui: { bars: true, hud: false, skip: false } },
  { audio: { state: 'emotional', ambience: 'sea', level: 0.45, fade: 3 } },
  { world: { to: 'o4_alba', dur: 6 }, async: true },
  // Canelo, still asleep on the page by the faro. Nobody dares to move him.
  { camera: { to: 'faro', offset: [150, 220], zoom: 0.95, dur: 3.5, ease: 'inOut' }, async: true },
  { wait: 2.2 },
  { say: { beat: B65, lines: CREDITS_LINES.dawn } },
  {
    call: async (c) => {
      const { playCreditsParteII } = await import('./creditsParteII');
      await playCreditsParteII(storyLayer(), {
        reduceMotion: c.reduceMotion,
        replay: c.replay,
        onWake: () => {
          motif('arco_pregunta');
          // REGISTRO 000: observando → despertando. The end of the Parte II (H65 → flag oleada4_fin)
          finale(c).wake();
        },
      });
    },
  },
  { call: () => audioApi.release(4) },
  { ui: { bars: false, hud: true, skip: false } },
];
export const CREDITOS: CineScript = {
  id: 'h65_creditos',
  stage: 'island',
  releaseBlend: 3,
  // the credits are watched to the end: their own button runs to the last card (the mission is that card)
  skippable: false,
  replay: { title: 'Créditos de la Parte II', seen: [`${B65}#a`, B65], order: 65 },
  steps: CREDITS_STEPS,
};

for (const s of [H58_SUENOS, H59_ECOS, H62_CORRECTORES, H64_PAGINA, MENTIRA, CREDITOS]) registerCine(s);

/** what you were going to write (Ajustes / later waves read it; null = not asked yet) */
export const o4Choice = mentiraChoice;
export const O4_CINES = [H58_SUENOS, H59_ECOS, H62_CORRECTORES, H64_PAGINA, MENTIRA, CREDITOS].map((s) => s.id);
export { PAGE_ARRIVED };
