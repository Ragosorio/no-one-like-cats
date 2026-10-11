/**
 * H32 «Una ficha de más» (cine h32_registro, island, still the astral night).
 *
 * Feel: something is watching. Back from «el reflejo» the music simply stops (1.5 s of night and sea), then the
 * picture TEARS (the island itself glitches), a system line types itself in static, REGISTRO 000's out-of-tune
 * music box (Si–Do♯–Re, the arc cell a semitone off) and the cats notice: Canelo hisses at nothing, the curious
 * ones get a «?». Two lines of Luzterna, control back: the Catdex button glitches too and an arrow says ÁBRELA.
 * In the Catdex the card inserts itself (panels/collection/registro000.ts). Lines: b32_registro [0, 1].
 */
import { registerCine } from '../registry';
import type { CineScript } from '../types';
import { stingerOr } from '../sound';

const B = 'b32_registro';

export const REGISTRO: CineScript = {
  id: 'h32_registro',
  stage: 'island',
  releaseBlend: 1,
  replay: { title: 'Una ficha de más', seen: `${B}#a`, order: 32 },
  steps: [
    { ui: { bars: true, hud: false, skip: true } },
    { camera: { to: 'home', offset: [-60, -40], zoom: 0.82, dur: 2.4, ease: 'inOut' }, async: true },
    // silence: the night keeps breathing, nothing else
    { audio: { state: 'silence', fade: 0.6 } },
    { wait: 1.6 },
    {
      parallel: [
        { call: (c) => void (!c.skipping && stingerOr('registro_000')) },
        { fx: { id: 'glitch', on: 'scene', dur: 1.2, k: 1 } },
        { fx: { id: 'banner', text: 'NEW ENTRY DETECTED — REGISTRO 000', sub: 'AUTOR: —   ·   FECHA: —', hold: 3.6 }, at: 0.25 },
        { actor: { who: 'awake', do: 'emote', arg: 'surprise', stagger: 0.04 }, at: 0.3 },
        { actor: { who: 'canelo', do: 'emote', arg: 'attack' }, at: 0.7 },
        { actor: { who: 'near:home', do: 'mark', arg: '?', stagger: 0.14 }, at: 0.8 },
        { fx: { id: 'glitch', on: 'scene', dur: 0.45, k: 0.6 }, at: 2.4 },
      ],
    },
    { wait: 1.6 },
    { say: { beat: B, lines: [0, 1] } },
    { persist: { beat: `${B}#a` } },
    // control back: the Catdex button itself is glitching now
    { ui: { bars: false, hud: true, skip: false } },
    { audio: { state: 'island_night_astral', fade: 3 } },
    { fx: { id: 'glitch', on: 'hud:catdex', dur: 1.8, k: 0.7 }, after: 0.6 },
    { fx: { id: 'point', at: 'hud:catdex', text: 'ÁBRELA' } },
    // the button keeps a ¡NUEVO! until you open it (not in a replay)
    { fx: { id: 'markNew', at: 'hud:catdex' }, when: (c) => !c.replay },
    { wait: 4.5 },
  ],
};

registerCine(REGISTRO);
