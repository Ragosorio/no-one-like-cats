/**
 * The MULTIVERSO DESBORDADO's one-time notice — its words and its flag (the drawing: panels/casino/multiversoAviso.ts).
 * ⚠️ Spoilers of the Parte III: due only after it (postP3Unlocked), so a player before the finale never sees it.
 * MADAME NOIR, the croupier, says it (the casino's own voice). Luzterna is only mentioned: she doesn't appear or speak.
 */
import { G } from '../game';
import { postP3Unlocked } from './postp3';

/** the save's flag: the notice was shown (forever) */
export const AVISO_FLAG = 'multiverso_aviso';
/** who says it (the casino's host) */
export const AVISO_WHO = 'MADAME NOIR';
/** what she says, one balloon at a time (Latin American Spanish, light and kind) */
export const AVISO_LINES: readonly string[] = [
  '¡Atención, michis del Gato Negro! Parece que el casino logró conectar más cajas.',
  'Dicen que fue para quitarnos un poquito la tristeza por Luzterna…',
  '…y, de paso, sacarles unas fichitas. ¿Qué? La casa también tiene corazón. Y caja registradora.',
  'Ya está abierto el MULTIVERSO DESBORDADO, en el Portal: ahí todo lo legendario sale MULTIDIMENSIONAL, cada uno con su propio color. Pásenle.',
];

/** due now: past the Parte III and never shown */
export function avisoDue(): boolean {
  return !!G.s && postP3Unlocked() && !G.has(AVISO_FLAG);
}
/** it was shown: remember it (and save right away, so a crash can't show it twice) */
export function markAvisoSeen() {
  G.flag(AVISO_FLAG);
  G.save();
}
