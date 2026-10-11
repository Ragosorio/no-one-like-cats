/**
 * Parte II · Oleada 3 «La Era Astral» — its CINE scenes (src/cine contract, docs/part-ii/20 §3 · docs/part-ii/25 «Pasada de
 * cine»). Registered at import (app/oleada3Flow.ts imports this file at boot); the story director plays them through
 * `special: 'cine'` (ui/story/rupturasScriptO3.ts); the seal and the logbook are played by their interactions
 * (app/oleada3Flow.ts openFeature). Ajustes › VOLVER A VER replays the ones with `replay` — a replay persists nothing:
 * every `call` with an effect checks `c.replay`, and the world returns to what the save says.
 *
 *   h50_costura      H50 a (island): the seam in the sky strains and opens a crack; neon through it, a chrome sign buzzes on
 *   h50_llegada      H50 b (Puerto Cometa): the yard from the comet's tail to your ship; Escafandra hops over with a wrench,
 *                    ¡CLANK!, and sticks a COMBUSTIBLE decal on your hull (it stays)
 *   h52_remolcadora  H52 a (island): the sky past the port; the tug crosses dragging a planetoid on a cable of light — one
 *                    second of the Estrella Errante falling
 *   h52_bitacora     H52 b (island): the tug's logbook; the order writes itself in the MARGIN, then the doodle; she closes it
 *   h53_sello        H53 a (island): violet dusk; Canelo sits by your faro staring at a seal of runes that breathes with him
 *   h53_romper       H53 (the interaction): tap it — crac · ¡CRAC! · ¡¡CRAAAC!! — it breaks like an eggshell and Canelo
 *                    comes out the other side with a tail full of stars: CANELO ASTRAL (form card, the first time he
 *                    keeps it on). Completes H53. Stingers + world, never a song
 *   h53_penasco      H53 c (island, night): Canelo Astral sits facing the rock off your faro. The camera never shows what
 *                    he sees; you only hear it (REGISTRO 000's music box, very far)
 *   h54_maneki       H54 a (island): a bell; a cat with a broom sweeps star dust nobody else sees
 *   h55_grafiti      H55 a (island): the sky gets painted in neon; a ship made of paint cans crosses, Brecha upside down
 *   h55_casco        H55 b (island): Grafitera paints a box with its door open on your boat (it stays)
 *   h56_firma        H56 (the interaction, island or Puerto Cometa): FIRMAR — your name — the page slides to its margin:
 *                    an old note in the SAME hand. Silence; only Si♭–Do. Then Luzterna. Completes H56
 *   h57_leviatan     H57 a (island): the sea turns over; the Leviathan rises upside down through the islands into the sky
 *   h57_gracias      H57 b (island): the chains are gone; an eye the size of your island opens in the sky and says thanks
 *   h57_grieta       H57 c (island): the rift doesn't close — it breathes; a page's edge on the other side · CONTINUARÁ
 *
 * Music (doc 18 §5.2, with the owner's rule of 2026-10-10: the six originals belong to the Momentos musicales): only
 * variations (`liky_fight.explore`, `te_odio.explore`/`.ambient`, `hemkade.ambient`), `amb.*`, director states, stingers
 * and the procedural motifs of ui/story/o3Sound.ts. The two Momentos of this wave live inside battles (app/oleada3Flow.ts
 * marks their hooks).
 */
import { Container, Graphics } from 'pixi.js';
import { registerCine } from '../../cine/registry';
import type { CineCtx, CineScript, Step } from '../../cine/types';
import { audioApi } from '../../audio/api';
import { cueBest, motif, stingerOr, unlockSoon } from '../../cine/sound';
import { scenes } from '../../core/scenes';
import { game } from '../../core/App';
import { sfx } from '../../core/audio';
import { G } from '../../state/game';
import { markBeat } from '../../state/ext/story';
import { completeFeature, featurePending } from '../../state/sys/rupturasO3';
import { o3Sky } from './o3Sky';
import { bitacora, bitacoraRem, flashback } from './o3Screen';
import './o3Sound';

const B50 = 'b50_cometa';
const B52 = 'b52_estrella';
const B53 = 'b53_canelo';
const B54 = 'b54_maneki';
const B55 = 'b55_disruptores';
const B56 = 'b56_nota';
const B57 = 'b57_leviatan';

const BARS: Step = { ui: { bars: true, hud: false, skip: true } };

/** a narrative cue of the first ref that exists (variations only), released when the scene ends however it ends */
function cueOwned(c: CineCtx, refs: string[], o: Parameters<typeof cueBest>[1] = {}, release = 2.5) {
  if (c.skipping) return;
  if (cueBest(refs, o)) c.own(() => audioApi.release(release));
}
/** the Oleada 3 records of a moment (Fonoteca, doc 18 §8): only versions that exist; never in a replay */
export const O3_SONGS: { ref: string; source: string; when: () => boolean }[] = [
  { ref: 'liky_fight.explore', source: 'Puerto Cometa', when: () => !!G.s?.missions?.done.includes('H50') },
  { ref: 'te_odio.explore', source: 'Los Disruptores', when: () => !!G.s?.missions && (G.s.missions.active.includes('H55') || G.s.missions.done.includes('H55')) },
  { ref: 'te_odio.ambient', source: 'Los Disruptores', when: () => !!G.s?.missions?.done.includes('H55') },
  { ref: 'amb.archivo', source: 'Maneki, el conserje', when: () => !!G.s?.missions?.done.includes('H54') },
];
export function o3Unlock(refs: string[]) {
  for (const s of O3_SONGS) if (refs.includes(s.ref)) unlockSoon(s.ref, s.source);
}
/** catch-up (idempotent): what this save already earned, once its recording exists */
export function syncO3Songs() {
  for (const s of O3_SONGS) {
    try {
      if (s.when()) unlockSoon(s.ref, s.source);
    } catch {
      /* never breaks anything */
    }
  }
}
const unlockAt = (refs: string[]): Step => ({ call: (c) => void (!c.replay && o3Unlock(refs)) });

/** a screen-level piece owned by the scene (it goes when the scene ends, however it ends) */
function owned<T extends { stop: () => void }>(c: CineCtx, make: () => T): T {
  const x = make();
  c.own(x.stop);
  return x;
}
/** wait for something outside (a button, a promise) on the scene's terms: SALTAR or the scene going away let go */
function waitOut(c: CineCtx, p: Promise<unknown>): Promise<void> {
  if (c.skipping) return Promise.resolve();
  return new Promise((res) => {
    let done = false;
    const end = () => {
      if (done) return;
      done = true;
      window.clearInterval(iv);
      res();
    };
    const iv = window.setInterval(() => {
      if (c.skipping || !c.stage.alive()) end();
    }, 100);
    p.then(end, end);
  });
}
/** wall-clock pause that SALTAR / the scene leaving cuts short (for waits inside a `call`) */
const pause = (c: CineCtx, s: number) => waitOut(c, new Promise((r) => window.setTimeout(r, s * 1000)));

// ================================================================== H50 a · la costura se abre
export const H50_COSTURA: CineScript = {
  id: 'h50_costura',
  stage: 'island',
  releaseBlend: 2,
  replay: { title: 'Una rendija con neón', seen: `${B50}#a`, order: 50 },
  steps: [
    BARS,
    // the seam as it was (closed): it opens in this scene, replays included
    { drive: { id: 'o3:rift', from: 0, to: 0, dur: 0 } },
    { drive: { id: 'o3:sign', from: 0, to: 0, dur: 0 } },
    { fx: { id: 'o3:front', el: 'rift' } },
    { camera: { to: 'home', offset: [80, -420], zoom: 0.5, dur: 3, ease: 'inOut' }, async: true },
    { world: { to: { stars: 0.25, seam: 1, vignette: 0.22, dayLife: 0.7 }, dur: 3 }, async: true },
    { wait: 1.8 },
    // it strains (a creak of thread), then a crack of light
    { fx: { id: 'shake', k: 0.12 }, reduced: 'skip' },
    { fx: { id: 'o3:sfx', s: 'paper', v: 0.6 } },
    { drive: { id: 'o3:rift', to: 0.3, dur: 1.1, ease: 'out' } },
    { wait: 0.6 },
    // the party up there leaks through: LIKY FIGHT's «Puerto de fiesta», far away (a variation, ducked)
    {
      call: (c) => {
        if (c.skipping) return;
        cueOwned(c, ['liky_fight.explore'], { fadeIn: 4, loop: true }, 3);
        audioApi.duck(true, 10, 'o3_far');
        c.own(() => audioApi.duck(false, 10, 'o3_far'));
      },
    },
    { drive: { id: 'o3:rift', to: 1, dur: 3.4, ease: 'inOut' } },
    { actor: { who: 'awake', do: 'emote', arg: 'surprise', stagger: 0.06 }, at: 6.2 },
    { actor: { who: 'awake', do: 'mark', arg: '?', stagger: 0.1 }, at: 6.6 },
    // the sign buzzes on, one tube at a time
    { fx: { id: 'o3:sfx', s: 'glitch', v: 0.45 }, after: 0.2 },
    { drive: { id: 'o3:sign', to: 0.4, dur: 0.15, ease: 'linear' } },
    { drive: { id: 'o3:sign', to: 0.1, dur: 0.12, ease: 'linear' } },
    { drive: { id: 'o3:sign', to: 1, dur: 0.5, ease: 'out' } },
    { wait: 1.2 },
    { say: { beat: B50, lines: [0, 1, 2] } },
    { persist: { beat: `${B50}#a` } },
    { wait: 0.6 },
  ],
};

// ================================================================== H50 b · llegada a Puerto Cometa (3D)
const inCometa = (c: CineCtx) => (c.stage as unknown as { regionId?: string }).regionId === 'cometa';
export const H50_LLEGADA: CineScript = {
  id: 'h50_llegada',
  stage: 'region',
  releaseBlend: 1,
  replay: { title: 'Se aceptan naves', seen: `${B50}#b`, order: 50.1, region: 'cometa' },
  steps: [
    BARS,
    { fx: { id: 'cometa:decal', on: false }, when: inCometa },
    { call: () => audioApi.setState('explore', { fade: 2, context: 'cometa' }) },
    // from behind the comet's tail, over the cranes and the signs, down to your ship at the pier
    { camera: { to: 'tail', yaw: 2.5, pitch: 0.16, dist: 120, dur: 0 }, when: inCometa },
    { camera: { to: 'yard', yaw: 0.2, pitch: 0.3, dist: 78, dur: 6.5, ease: 'inOut' }, when: inCometa },
    { camera: { to: 'ship', yaw: -0.85, pitch: 0.2, dist: 21, dur: 3.2, ease: 'inOut' }, when: inCometa },
    { fx: { id: 'cometa:hop' }, when: inCometa },
    { wait: 2.3 },
    { fx: { id: 'cometa:clank' }, when: inCometa },
    { fx: { id: 'shake', k: 0.12 }, reduced: 'skip' },
    { wait: 0.55 },
    { fx: { id: 'cometa:clank' }, when: inCometa },
    { wait: 0.6 },
    { fx: { id: 'cometa:decal' }, when: inCometa },
    { wait: 1.1 },
    { say: { beat: B50, lines: [3, 4, 5] } },
    { persist: { beat: `${B50}#b` } },
    unlockAt(['liky_fight.explore']),
    { camera: { to: 'yard', yaw: 0.6, pitch: 0.36, dist: 90, dur: 2.4, ease: 'inOut' }, when: inCometa },
  ],
};

// ================================================================== H52 a · la Remolcadora
export const H52_REMOLCADORA: CineScript = {
  id: 'h52_remolcadora',
  stage: 'island',
  releaseBlend: 2,
  replay: { title: 'Un cable de luz', seen: `${B52}#a`, order: 52 },
  steps: [
    BARS,
    { drive: { id: 'o3:tug', from: 0.001, to: 0.001, dur: 0 } },
    { fx: { id: 'o3:front', el: 'tug' } },
    { call: (c) => cueOwned(c, ['te_odio.ambient', 'te_odio.explore'], { fadeIn: 3, loop: true }, 3) },
    { camera: { to: 'home', offset: [0, -380], zoom: 0.52, dur: 3, ease: 'inOut' }, async: true },
    { world: { to: 'o3_remolcadora', dur: 4 }, async: true },
    { wait: 1.4 },
    { fx: { id: 'o3:motif', m: 'remolque' } },
    { drive: { id: 'o3:tug', to: 0.42, dur: 7, ease: 'out' } },
    {
      say: {
        beat: B52,
        lines: [0],
        // «ese cable»: one second of the day the Estrella Errante fell
        onLine: { 0: [{ fx: { id: 'o3:flashback' }, after: 1.4, reduced: { fx: { id: 'o3:flashback' }, after: 1.4 } }] },
      },
    },
    { drive: { id: 'o3:tug', to: 0.62, dur: 6, ease: 'linear' }, async: true },
    { say: { beat: B52, lines: [1, 2] } },
    { persist: { beat: `${B52}#a` } },
    { wait: 0.4 },
  ],
};

// ================================================================== H52 b · la bitácora de la Remolcadora
export const H52_BITACORA: CineScript = {
  id: 'h52_bitacora',
  stage: 'island',
  releaseBlend: 1.5,
  replay: { title: 'La bitácora de la Remolcadora', seen: `${B52}#b`, order: 52.1 },
  steps: [
    BARS,
    { audio: { state: 'silence', fade: 1.5 } },
    {
      call: async (c) => {
        if (c.skipping) return;
        const book = owned(c, () => bitacoraRem());
        (c as unknown as { _book?: unknown })._book = book;
        await pause(c, 1.6);
        book.write();
        await pause(c, 2.8);
        stingerOr('reveal');
        await pause(c, 0.6);
        book.doodle();
        await pause(c, 2.2);
      },
    },
    { say: { beat: B52, lines: [3, 4] } },
    { persist: { beat: `${B52}#b` } },
    { persist: { beat: B52 } },
    {
      call: async (c) => {
        const b = (c as unknown as { _book?: ReturnType<typeof bitacoraRem> })._book;
        if (!b || c.skipping) return;
        b.close();
        await pause(c, 1.8);
      },
    },
  ],
};

// ================================================================== H53 a · Canelo no parpadea
export const H53_SELLO: CineScript = {
  id: 'h53_sello',
  stage: 'island',
  releaseBlend: 2,
  replay: { title: 'Canelo no parpadea', seen: `${B53}#a`, order: 53 },
  steps: [
    BARS,
    { drive: { id: 'o3:seal', from: 0, to: 0, dur: 0 } },
    { fx: { id: 'o3:vigil', at: 'seal', before: true } },
    { audio: { state: 'island_night_astral', ambience: 'night_astral', level: 0.5, fade: 3 } },
    { world: { to: 'o3_sello', dur: 5 }, async: true },
    { camera: { to: 'faro', offset: [-150, 120], zoom: 0.9, dur: 3.2, ease: 'inOut' }, async: true },
    { wait: 2.2 },
    // the seal comes out of the dusk, breathing with him
    { fx: { id: 'o3:motif', m: 'latido' } },
    { drive: { id: 'o3:seal', to: 1, dur: 3.2, ease: 'out' } },
    { fx: { id: 'o3:motif', m: 'latido' }, after: 0.2 },
    { camera: { to: 'faro', offset: [-200, 140], zoom: 1.12, dur: 4, ease: 'inOut' }, async: true },
    { wait: 1.2 },
    { say: { beat: B53, lines: [0, 1] } },
    { fx: { id: 'o3:motif', m: 'latido' } },
    { say: { beat: B53, lines: [2] } },
    { persist: { beat: `${B53}#a` } },
    { wait: 0.4 },
  ],
};

// ================================================================== H53 · el sello se rompe (the interaction)
const FORM = 'canelo_astral';
/** a tap anywhere on the scene (under the letterbox and SALTAR) counts as touching the seal */
function tapLayer(c: CineCtx) {
  const v = game.view;
  const hit = new Container();
  hit.label = 'cineFx';
  hit.addChild(new Graphics().rect(v.x, v.y, v.w, v.h).fill({ color: 0xffffff, alpha: 0.001 }));
  hit.eventMode = 'static';
  hit.cursor = 'pointer';
  hit.on('pointertap', () => (c.stage as unknown as { tapped?: (id: string) => void }).tapped?.('o3:sello'));
  scenes.overlayLayer.addChild(hit);
  c.own(() => !hit.destroyed && hit.destroy({ children: true }));
}
let worn = false;
const crackStep = (n: number): Step[] => [
  { interact: { target: 'o3:sello', prompt: '¡TÓCALO!', timeout: 600 } },
  { drive: { id: 'o3:crack', to: n, dur: 0.12, ease: 'out' } },
  { fx: { id: 'o3:crack', n } },
  { fx: { id: 'o3:sfx', s: n < 3 ? 'crit' : 'bigboom', v: 0.7 + n * 0.12 } },
  { fx: { id: 'shake', k: 0.08 + n * 0.06 }, reduced: 'skip' },
  { actor: { who: 'canelo', do: 'emote', arg: n < 3 ? 'surprise' : 'attack' } },
];
export const H53_ROMPER: CineScript = {
  id: 'h53_romper',
  stage: 'island',
  releaseBlend: 2.5,
  replay: { title: 'Cáscara de huevo', seen: `${B53}#b`, order: 53.1 },
  steps: [
    BARS,
    { drive: { id: 'o3:seal', from: 1, to: 1, dur: 0 } },
    { drive: { id: 'o3:crack', from: 0, to: 0, dur: 0 } },
    { fx: { id: 'o3:vigil', at: 'seal', before: true } },
    { world: { to: 'o3_sello', dur: 1.5 }, async: true },
    { audio: { state: 'silence', ambience: 'night_astral', level: 0.4, fade: 1.5 } },
    { camera: { to: 'faro', offset: [-200, 120], zoom: 1.1, dur: 2, ease: 'inOut' } },
    {
      call: (c) => {
        worn = false;
        if (c.skipping) return;
        tapLayer(c);
        void import('../../art/catArt').then((m) => m.preloadCats(['canelo_astral_cat']));
      },
    },
    { fx: { id: 'o3:prompt', text: '¡TÓCALO!' } },
    ...crackStep(1),
    ...crackStep(2),
    ...crackStep(3),
    { fx: { id: 'o3:prompt', off: true } },
    // it holds a breath… everything goes quiet… and it breaks like an eggshell
    { fx: { id: 'o3:motif', m: 'latido' }, after: 0.4 },
    { fx: { id: 'o3:motif', m: 'latido' }, after: 0.5 },
    { fx: { id: 'o3:sfx', s: 'charge', v: 0.9 }, after: 0.3 },
    { world: { to: { exposure: 0.62, vignette: 0.6, lights: 0.3 }, dur: 1.2 } },
    // POINT OF NO RETURN: the beat part this scene IS, then the mission (so the story never queues it again)
    { persist: { beat: `${B53}#b` } },
    {
      call: (c) => {
        if (c.replay) return;
        if (featurePending('sello_canelo')) {
          completeFeature('sello_canelo');
          G.save();
        }
      },
    },
    {
      parallel: [
        { fx: { id: 'o3:shatter' } },
        { call: (c) => void (!c.skipping && (stingerOr('reveal'), stingerOr('canelo_astral'))) },
        { fx: { id: 'o3:sfx', s: 'bigboom', v: 1 } },
        { fx: { id: 'shake', k: 0.45 }, reduced: 'skip' },
        { drive: { id: 'o3:seal', to: 0, dur: 1.6, ease: 'in' } },
        { world: { to: { exposure: 0.95, tint: 0xe8e0ff, sky: 0.7, stars: 1, starFall: 1.4, vignette: 0.25, lights: 0.8 }, dur: 0.6, ease: 'out' } },
        { fx: { id: 'burst', n: 50, dur: 3, far: 40 }, reduced: { fx: { id: 'burst', n: 14, dur: 3, far: 10 } } },
      ],
    },
    { wait: 0.7 },
    // Canelo crosses and comes out the other side with a tail full of stars — his song, the port's version
    { fx: { id: 'o3:astral' } },
    { camera: { to: 'faro', offset: [-110, 120], zoom: 1.45, dur: 1.4, ease: 'outCubic' }, async: true },
    { call: (c) => cueOwned(c, ['liky_fight.explore'], { fadeIn: 0.3, loop: true }, 3) },
    { actor: { who: 'near:faro', do: 'mark', arg: '!', stagger: 0.08 }, at: 0.2 },
    { wait: 1.8 },
    {
      // the story says he shines now: the first time ever he keeps the form on (free to switch back in his sheet)
      call: async (c) => {
        if (c.replay) return;
        const [{ FORMS }, forms] = await Promise.all([import('../../data/rupturas/formas'), import('../../state/sys/forms')]);
        const f = FORMS.find((x) => x.id === FORM);
        const owner = f ? forms.formOwner(f) : undefined;
        if (f && owner && forms.formUnlocked(f) && forms.formIsNew(f)) worn = forms.setForm(owner, FORM) === 'ok';
        forms.markFormRevealed(FORM);
        G.save();
      },
    },
    { say: { beat: B53, lines: [3] } },
    {
      call: async (c) => {
        if (c.skipping) return;
        const [{ FORMS }, flow] = await Promise.all([import('../../data/rupturas/formas'), import('../../app/formsFlow')]);
        const f = FORMS.find((x) => x.id === FORM);
        if (f) await flow.revealForm(f, { replay: c.replay, worn, scene: true });
      },
    },
    { wait: 0.5 },
  ],
  finish: (c) => {
    // SALTAR: the seal is gone, Canelo shines — and the mission is done (never half)
    if (!c.replay && featurePending('sello_canelo')) {
      markBeat(`${B53}#b`);
      completeFeature('sello_canelo');
      G.save();
    }
  },
};

// ================================================================== H53 c · el peñasco
export const H53_PENASCO: CineScript = {
  id: 'h53_penasco',
  stage: 'island',
  releaseBlend: 3,
  replay: { title: 'Mucho rato', seen: `${B53}#c`, order: 53.2 },
  steps: [
    BARS,
    { fx: { id: 'o3:vigil', at: 'rock' } },
    { audio: { state: 'island_night_astral', ambience: 'night_astral', level: 0.45, fade: 3 } },
    { world: { to: { exposure: 0.66, tint: 0xa8b4ff, saturation: 0.86, lift: 0x0a0c26, sky: 0.95, skyTint: 0xc8d4ff, stars: 0.9, starFall: 0.12, aurora: 0.1, seam: 0.9, lights: 0.9, faro: 0.8, seaGlow: 0.6, vignette: 0.45, dayLife: 0, cats: 0.4 }, dur: 4 }, async: true },
    { camera: { to: 'faro', offset: [-120, 170], zoom: 0.95, dur: 3.5, ease: 'inOut' } },
    { wait: 1.5 },
    // what he sees, only he sees: the camera stays on him; somewhere very far, a music box out of tune
    { camera: { to: 'faro', offset: [-150, 200], zoom: 1.2, dur: 5, ease: 'inOut' }, async: true },
    { wait: 1.6 },
    { call: (c) => void (!c.skipping && stingerOr('registro_000', undefined, 0.35)) },
    { wait: 3.2 },
    { say: { beat: B53, lines: [4] } },
    { persist: { beat: `${B53}#c` } },
    { persist: { beat: B53 } },
    { wait: 1.2 },
  ],
};

// ================================================================== H54 a · un cascabel
export const H54_MANEKI: CineScript = {
  id: 'h54_maneki',
  stage: 'island',
  releaseBlend: 2,
  replay: { title: 'Un cascabel en el muelle', seen: `${B54}#a`, order: 54 },
  steps: [
    BARS,
    { audio: { state: 'explore_mystery', fade: 2 } },
    // close on her spot (PULIDO 2026-10-10: at 1.05 she was one more small cat behind the buildings). Her spot is a
    // free tile near home (MENORES 2026-10-10: on a big archipelago the old one was behind the Puerto); same framing
    { camera: { to: 'maneki', offset: [0, -66], zoom: 1.3, dur: 2.6, ease: 'inOut' } },
    { fx: { id: 'o3:motif', m: 'cascabel' } },
    { wait: 1 },
    { fx: { id: 'o3:maneki' } },
    { fx: { id: 'o3:motif', m: 'cascabel' }, after: 0.3 },
    // the cats don't see what she sweeps: nobody looks
    { wait: 2.4 },
    { say: { beat: B54, lines: [0, 1] } },
    { call: (c) => void (!c.skipping && stingerOr('titiriteros')) },
    { say: { beat: B54, lines: [2] } },
    { persist: { beat: `${B54}#a` } },
    { wait: 0.4 },
  ],
};

// ================================================================== H55 a · el cielo pintado
export const H55_GRAFITI: CineScript = {
  id: 'h55_grafiti',
  stage: 'island',
  releaseBlend: 2,
  replay: { title: 'Alguien pintó el cielo', seen: `${B55}#a`, order: 55 },
  steps: [
    BARS,
    { drive: { id: 'o3:graffiti', from: 0, to: 0, dur: 0 } },
    { fx: { id: 'o3:front', el: 'graffiti' } },
    { fx: { id: 'o3:front', el: 'can' } },
    { call: (c) => cueOwned(c, ['te_odio.explore'], { fadeIn: 1.5, loop: true }, 3) },
    { camera: { to: 'home', offset: [0, -380], zoom: 0.52, dur: 2.6, ease: 'inOut' }, async: true },
    { world: { to: 'o3_grafiti', dur: 3 }, async: true },
    { wait: 1.2 },
    { fx: { id: 'glitch', dur: 0.5, k: 0.6 } },
    // spray, spray, spray: the letters land one tag at a time
    {
      parallel: [
        { drive: { id: 'o3:graffiti', to: 1, dur: 5.5, ease: 'linear' } },
        { seq: [0, 1, 2, 3, 4].map((i): Step => ({ fx: { id: 'o3:motif', m: 'spray' }, after: i ? 1 : 0.1 })) },
      ],
    },
    { actor: { who: 'awake', do: 'mark', arg: '!', stagger: 0.08 } },
    // their ship: paint cans tied together, Brecha hanging upside down from the mast
    { drive: { id: 'o3:can', from: 0.001, to: 0.5, dur: 4, ease: 'out' } },
    { say: { beat: B55, lines: [0, 1] } },
    { drive: { id: 'o3:can', to: 0.62, dur: 4, ease: 'linear' }, async: true },
    { say: { beat: B55, lines: [2] } },
    { persist: { beat: `${B55}#a` } },
    unlockAt(['te_odio.explore']),
    { drive: { id: 'o3:can', to: 0.999, dur: 2.5, ease: 'in' } },
  ],
};

// ================================================================== H55 b · una caja con la puerta abierta
export const H55_CASCO: CineScript = {
  id: 'h55_casco',
  stage: 'island',
  releaseBlend: 2,
  replay: { title: 'Una caja con la puerta abierta', seen: `${B55}#b`, order: 55.1 },
  steps: [
    BARS,
    { call: (c) => cueOwned(c, ['te_odio.ambient', 'te_odio.explore'], { fadeIn: 2, loop: true }, 3) },
    { camera: { to: 'boat', offset: [0, -60], zoom: 1.05, dur: 2.6, ease: 'inOut' } },
    { say: { beat: B55, lines: [3, 4] } },
    { fx: { id: 'o3:motif', m: 'spray' } },
    { fx: { id: 'o3:motif', m: 'spray' }, after: 0.8 },
    { persist: { beat: `${B55}#b` } },
    { persist: { beat: B55 } },
    // the tag shows on your boat (o3Sky: H55 done) and she says it, floating by it
    { fx: { id: 'o3:say', at: 'tag', text: '«Me caen bien. A ver qué tal es su caja por dentro.»', hold: 4.5 }, after: 0.4 },
    { wait: 2.6 },
    { say: { beat: B55, lines: [5] } },
    unlockAt(['te_odio.ambient']),
    { wait: 0.4 },
  ],
};

// ================================================================== H56 · la firma (the interaction)
const firmaSteps = (): Step[] => [
  BARS,
  { audio: { state: 'silence', fade: 1.2 } },
  {
    call: async (c) => {
      if (c.skipping) return;
      const page = owned(c, () => bitacora());
      audioApi.duck(true, 18, 'bitacora');
      c.own(() => audioApi.duck(false, 18, 'bitacora'));
      await pause(c, 0.8);
      await waitOut(c, page.ask());
      page.hideAsk();
      await waitOut(c, page.sign(c.skipping));
      await pause(c, 1);
      // the camera slides to the margin of the same page…
      page.slide(2.6);
      await pause(c, 2.8);
      // …where an old note is waiting, in the same hand. Only two notes of the arc: the question stays open
      page.note(2.4);
      await pause(c, 1.2);
      motif('arco_dos');
      await pause(c, 1.8);
      page.pull(2);
      await pause(c, 3.2);
    },
  },
  // POINT OF NO RETURN: the parts this scene says (b: the note, c: Luzterna), then the mission
  { persist: { beat: `${B56}#b` } },
  { persist: { beat: `${B56}#c` } },
  { persist: { beat: B56 } },
  {
    call: (c) => {
      if (c.replay) return;
      if (featurePending('firma_bitacora')) {
        completeFeature('firma_bitacora');
        G.save();
      }
    },
  },
  // Luzterna says nothing for a while; then she says it
  { wait: 1.6 },
  { say: { beat: B56, lines: [3] } },
  { wait: 1.2 },
  { say: { beat: B56, lines: [4] } },
  { wait: 0.6 },
];
const firmaFinish = (c: CineCtx) => {
  if (!c.replay && featurePending('firma_bitacora')) {
    markBeat(`${B56}#b`);
    markBeat(`${B56}#c`);
    markBeat(B56);
    completeFeature('firma_bitacora');
    G.save();
  }
};
export const H56_FIRMA: CineScript = { id: 'h56_firma', stage: 'island', releaseBlend: 1.5, replay: { title: 'Puro trámite', seen: `${B56}#c`, order: 56 }, steps: firmaSteps(), finish: firmaFinish };
/** the same scene when the logbook opens inside Puerto Cometa (the page is screen-level: any stage will do) */
export const H56_FIRMA_COMETA: CineScript = { id: 'h56_firma_cometa', stage: 'region', releaseBlend: 1, steps: firmaSteps(), finish: firmaFinish };

// ================================================================== H57 a · el mar se voltea
export const H57_LEVIATAN: CineScript = {
  id: 'h57_leviatan',
  stage: 'island',
  releaseBlend: 2.5,
  replay: { title: 'El mar se voltea', seen: `${B57}#a`, order: 57 },
  steps: [
    BARS,
    { drive: { id: 'o3:lev', from: 0, to: 0, dur: 0 } },
    { drive: { id: 'o3:chains', from: 1, to: 1, dur: 0 } },
    { fx: { id: 'o3:front', el: 'lev' } },
    { audio: { state: 'silence', ambience: 'wind', level: 0.8, fade: 1.5 } },
    { world: { to: 'o3_leviatan', dur: 4 }, async: true },
    { camera: { to: 'home', offset: [0, 200], zoom: 0.55, dur: 2.6, ease: 'inOut' } },
    // the Primer Mar turns over: everything shudders, something huge comes up from under the islands
    { fx: { id: 'shake', k: 0.3 }, reduced: 'skip' },
    { fx: { id: 'o3:motif', m: 'leviatan_gracias' } },
    { call: (c) => cueOwned(c, ['hemkade.ambient'], { fadeIn: 3, loop: true }, 4) },
    { drive: { id: 'o3:lev', to: 0.35, dur: 3.5, ease: 'in' } },
    { fx: { id: 'shake', k: 0.4 }, reduced: 'skip' },
    { camera: { to: 'home', offset: [0, -420], zoom: 0.5, dur: 5.5, ease: 'inOut' }, async: true },
    { drive: { id: 'o3:lev', to: 1, dur: 5.5, ease: 'out' } },
    { actor: { who: 'awake', do: 'emote', arg: 'surprise', stagger: 0.05 } },
    { actor: { who: 'awake', do: 'mark', arg: '!', stagger: 0.06 } },
    { wait: 1 },
    { say: { beat: B57, lines: [0, 1] } },
    { fx: { id: 'o3:front', el: 'lev', off: true } },
    { say: { beat: B57, lines: [2] } },
    { persist: { beat: `${B57}#a` } },
    { wait: 0.4 },
  ],
};

// ================================================================== H57 b · gracias
export const H57_GRACIAS: CineScript = {
  id: 'h57_gracias',
  stage: 'island',
  releaseBlend: 2.5,
  replay: { title: 'Un sonido grave', seen: `${B57}#b`, order: 57.1 },
  steps: [
    BARS,
    { drive: { id: 'o3:lev', from: 1, to: 1, dur: 0 } },
    { drive: { id: 'o3:chains', from: 0, to: 0, dur: 0 } },
    { drive: { id: 'o3:eye', from: 0, to: 0, dur: 0 } },
    { fx: { id: 'o3:front', el: 'eye' } },
    { audio: { state: 'silence', ambience: 'night_astral', level: 0.5, fade: 2 } },
    { world: { to: { exposure: 0.66, tint: 0xa8c4ff, saturation: 0.86, lift: 0x08102a, sky: 1, skyTint: 0xbfe8ff, stars: 1, starFall: 0.4, aurora: 0.4, seam: 1, lights: 0.8, seaGlow: 0.7, vignette: 0.45, dayLife: 0, cats: 0.9 }, dur: 4 }, async: true },
    { camera: { to: 'home', offset: [0, -380], zoom: 0.5, dur: 3.5, ease: 'inOut' } },
    { call: (c) => cueOwned(c, ['hemkade.ambient'], { fadeIn: 4, loop: true }, 5) },
    { wait: 1 },
    // nobody orders it anything now: it stays still… and an eye the size of your island opens
    { drive: { id: 'o3:eye', to: 1, dur: 3.5, ease: 'inOut' } },
    { actor: { who: 'awake', do: 'look', arg: 'home', dur: 8, stagger: 0.05 } },
    { wait: 0.8 },
    // a sound that isn't a roar: thanks (a whale's glissando, the arc cell in a horn)
    { call: (c) => void (!c.skipping && stingerOr('leviatan_gracias')) },
    { fx: { id: 'shake', k: 0.12 }, reduced: 'skip', after: 0.4 },
    { wait: 4.6 },
    { fx: { id: 'o3:blink' } },
    { wait: 0.8 },
    { say: { beat: B57, lines: [3, 4] } },
    { persist: { beat: `${B57}#b` } },
    { drive: { id: 'o3:eye', to: 0, dur: 2.5, ease: 'inOut' } },
  ],
};

// ================================================================== H57 c · la grieta respira
export const H57_GRIETA: CineScript = {
  id: 'h57_grieta',
  stage: 'island',
  releaseBlend: 3,
  replay: { title: 'Respira', seen: `${B57}#c`, order: 57.2 },
  steps: [
    BARS,
    { drive: { id: 'o3:grieta', from: 0, to: 0, dur: 0 } },
    { drive: { id: 'o3:page', from: 0, to: 0, dur: 0 } },
    { fx: { id: 'o3:front', el: 'grieta' } },
    { audio: { state: 'silence', ambience: 'night_astral', level: 0.5, fade: 2 } },
    { call: (c) => cueOwned(c, ['hemkade.ambient'], { fadeIn: 3, loop: true }, 5) },
    { camera: { to: 'home', offset: [120, -420], zoom: 0.5, dur: 3, ease: 'inOut' } },
    // where the Leviathan was: the rift doesn't close. It breathes
    { drive: { id: 'o3:grieta', to: 1, dur: 4, ease: 'out' } },
    { wait: 1.2 },
    { drive: { id: 'o3:page', to: 1, dur: 3, ease: 'inOut' } },
    { say: { beat: B57, lines: [5] } },
    { persist: { beat: `${B57}#c` } },
    { persist: { beat: B57 } },
    { call: (c) => void (!c.skipping && motif('arco_pregunta')) },
    { fx: { id: 'card', title: 'CONTINUARÁ', sub: 'EL UMBRAL', hold: 5 } },
    { wait: 5.2 },
  ],
};

export const O3_CINES: CineScript[] = [H50_COSTURA, H50_LLEGADA, H52_REMOLCADORA, H52_BITACORA, H53_SELLO, H53_ROMPER, H53_PENASCO, H54_MANEKI, H55_GRAFITI, H55_CASCO, H56_FIRMA, H56_FIRMA_COMETA, H57_LEVIATAN, H57_GRACIAS, H57_GRIETA];
for (const s of O3_CINES) registerCine(s);

/** sfx without importing core/audio in callers (kept for dev tools) */
export const o3Sfx = sfx;
