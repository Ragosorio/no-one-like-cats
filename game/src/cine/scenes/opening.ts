/**
 * H31 «Las estrellas caen hacia arriba» — THE OPENING of Parte II, on the island (docs/part-ii/20-estados-y-cine.md §3).
 *
 * Fewer words, more world: the island you know → Luzterna calls you → (sound invitation) → the light drains, the
 * cats start to look up, the lagoons reflect stars that aren't in the sky yet → one shooting star crosses… brakes…
 * and falls UP → the lamp of YOUR faro lights by itself and its beam goes outward while the stars rise en masse →
 * the night stays (world state 'noche_astral', persisted at that point) → control comes back and the faro asks to
 * be tapped (H31's goal). Lines: data/rupturas/historia.json › b31_estrellas [0..3] (part b [4..6] plays on the tap).
 */
import type { WorldLook } from '../../state/sys/worldState';
import { G } from '../../state/game';
import { registerCine } from '../registry';
import type { CineScript } from '../types';
import { audioApi } from '../../audio/api';
import { unlockMoment } from '../sound';

const B = 'b31_estrellas';

/** the light starts to go: lavender dusk, windows warming up, a few cats notice */
const DUSK: Partial<WorldLook> = {
  exposure: 0.82,
  tint: 0xd6ccff,
  saturation: 0.9,
  lift: 0x05040f,
  sky: 0.5,
  stars: 0.12,
  lights: 0.35,
  vignette: 0.25,
  dayLife: 0.35,
  seaGlow: 0.15,
  cats: 0.3,
  starFall: 0,
};
/** night before the event: full sky, stars out, every light on, most cats watching — the faro still dark */
const NIGHT: Partial<WorldLook> = {
  exposure: 0.64,
  tint: 0xa4b0ff,
  saturation: 0.82,
  lift: 0x0a0a22,
  sky: 1,
  stars: 0.8,
  aurora: 0.22,
  lights: 0.85,
  seaGlow: 0.6,
  vignette: 0.5,
  dayLife: 0,
  cats: 0.8,
  starFall: 0,
};

const h31Waiting = () => !!G.s?.missions?.active.includes('H31');

export const OPENING: CineScript = {
  id: 'h31_opening',
  stage: 'island',
  releaseBlend: 1.2,
  replay: { title: 'Las estrellas suben', seen: 'b31_estrellas#a', order: 31 },
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    // the event's stinger and the night's bed are recordings now (doc 23): warm them so THE EVENT never waits on the
    // network (the stinger `star_fall` is the motif's file, `amb`; if it never loads the scene goes on in silence)
    { call: () => ['amb', 'amb.night_astral'].forEach((r) => audioApi.prefetch(r)) },
    // the island you know, framed around YOUR faro
    { camera: { to: 'faro', offset: [120, 40], zoom: 0.72, dur: 3, ease: 'inOut' }, async: true },
    { wait: 1.8 },
    // the call
    { say: { beat: B, lines: [0] } },
    // a natural moment to ask for sound: right before the sky does anything
    { audio: { invite: true } },
    { audio: { state: 'silence', fade: 5, ambience: 'night_astral', level: 0.7 } },
    // the light drains; the curious ones notice first
    { world: { to: DUSK, dur: 7, ease: 'inOut' }, async: true },
    { actor: { who: 'near:faro', do: 'look', arg: 'faro', dur: 5, stagger: 0.45 }, after: 2.2 },
    { wait: 3.2 },
    // the lagoons reflect stars that are not in the sky yet
    { fx: { id: 'reflect', to: 1 } },
    { camera: { to: 'lagoon', offset: [80, -150], zoom: 0.8, dur: 6.5, ease: 'inOut' }, async: true },
    { world: { to: NIGHT, dur: 6, ease: 'inOut' }, async: true },
    { wait: 5.2 },
    // one shooting star, like any night… that brakes, hangs there… and falls UP
    { fx: { id: 'shoot', reverse: true } },
    { actor: { who: 'awake', do: 'emote', arg: 'surprise', stagger: 0.05 }, after: 1.6 },
    { wait: 1.3 },
    { audio: { sync: 'bar', maxWait: 0.7 } },
    // THE EVENT: everything goes up, and the faro lights by itself
    {
      parallel: [
        { audio: { stinger: 'star_fall', state: 'island_night_astral', fade: 0.6 } },
        { fx: { id: 'ignite' } },
        { world: { to: 'noche_astral', dur: 2.4, ease: 'out' } },
        { fx: { id: 'burst', n: 70, dur: 4.5, far: 90 }, reduced: { fx: { id: 'burst', n: 26, dur: 5, far: 30 } } },
        { fx: { id: 'shake', k: 0.32 }, reduced: 'skip' },
        { actor: { who: 'awake', do: 'mark', arg: '!', stagger: 0.05 }, at: 0.3 },
        { actor: { who: 'canelo', do: 'react', arg: 'canelo' }, at: 1.1 },
        { fx: { id: 'reflect', to: 0.3 }, at: 2.5 },
        // pull back: the whole sky going up
        { camera: { to: 'faro', offset: [60, -120], zoom: 0.66, dur: 4, ease: 'inOut' }, at: 0.6 },
      ],
    },
    // point of no return: from here the island IS at night (reloads, the map and back…)
    { persist: { beat: `${B}#a` } },
    // the first night goes into the Fonoteca: the arc's intro loop, «Otras grabaciones» (the motif) and the night
    // (idempotent; the record card waits for the scene to hand control back: ui/hush.ts)
    { call: (c) => void (!c.replay && unlockMoment(['yonose_todo.menu_loop', 'amb', 'amb.night_astral'])) },
    { wait: 1.2 },
    { say: { beat: B, lines: [1, 2], onLine: { 1: [{ fx: { id: 'burst', n: 5, dur: 0.2, far: 0 }, after: 0.5 }, { fx: { id: 'burst', n: 7, dur: 0.2, far: 0 }, after: 0.7 }] } } },
    // control back: the faro is the way up
    { ui: { bars: false, hud: true, skip: false } },
    { camera: { to: 'faro', offset: [0, 140], zoom: 0.86, dur: 1.4, ease: 'inOut' }, async: true },
    { say: { beat: B, lines: [3], block: false }, when: (c) => !c.replay && h31Waiting() },
    { interact: { target: 'faro', prompt: 'TOCA EL FARO', timeout: 90 }, when: (c) => !c.replay && h31Waiting() },
  ],
};

registerCine(OPENING);
