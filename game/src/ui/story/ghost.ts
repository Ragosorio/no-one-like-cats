/**
 * PARTE III · after her death, Luzterna never comes back alive by accident (coordinator, ronda 4; docs/part-iii/08 §6).
 * ⚠️ SPOILERS. One place every voice asks:
 *
 *   luzternaAllowed()      she may speak / show her face now: she's alive in this save, or a memory is playing
 *   asMemory(fn)           runs `fn` as a memory («Volver a ver», her own last scene): her lines and face pass
 *   ghostLines(lines)      a dialog line of hers after her death becomes a WRITTEN memory: the Bitácora says it, no face
 *   tipSpeaker(sp?)        the corner tip's voice: hers alive; the Bitácora's after (voiceFor('tip'))
 *   luzternaPortraitOk()   her ghost portrait may show (the offline report, prompts, rewards…)
 *   dueloMuted()           the mourning (SADIE → «Continuará»): tips, NOVEDADES, jingles and prizes stay silent
 *
 * The guard test (tests/finalVoz.test.ts) scans the defaults and every LuzternaPortrait in src after H94.
 */
import { dueloActivo, luzternaFallecida, voiceFor } from '../../state/sys/gaterasWorld';
import type { Line } from '../dialog';

let memories = 0;
/** her own memories may show her (Replays, her last scene): everything inside `fn` */
export async function asMemory<T>(fn: () => Promise<T>): Promise<T> {
  memories++;
  try {
    return await fn();
  } finally {
    memories--;
  }
}
export const inMemory = () => memories > 0;
export const luzternaAllowed = () => inMemory() || !luzternaFallecida();
export const luzternaPortraitOk = luzternaAllowed;

/** her lines after her death: the Bitácora says them (her words, written; never her voice or her face) */
export function ghostLines(lines: Line[]): Line[] {
  if (luzternaAllowed()) return lines;
  const to = voiceFor('presentaciones').speaker ?? 'BITÁCORA';
  return lines.map(([sp, t]) => (sp === 'LUZTERNA' ? [to, t] : [sp, t]) as Line);
}
/** who says a corner tip: the caller's speaker, or hers while she lives; never hers after */
export function tipSpeaker(sp?: string): string {
  if (luzternaAllowed()) return sp ?? 'LUZTERNA';
  if (!sp || sp === 'LUZTERNA') return voiceFor('tip').speaker ?? 'BITÁCORA';
  return sp;
}
/** the mourning: nothing that celebrates or chatters (a memory playing is not the mourning's business) */
export const dueloMuted = () => !inMemory() && dueloActivo();
