/**
 * New VERSIONS of songs already in the Fonoteca that arrive together (a save loading, a Momento's unlocks) make ONE
 * toast (audio/unlockToast.ts groups them; hotfix 2026-10-10: five «NUEVA VERSIÓN» toasts used to pile up). Pure.
 */
export function versionsToast(titles: string[]): { text: string; sub: string } {
  if (titles.length === 1) return { text: `NUEVA VERSIÓN: ${titles[0]}`, sub: 'Ya suena en tu Fonoteca.' };
  const shown = titles.slice(0, 3).join(' · ');
  const more = titles.length > 3 ? ` y ${titles.length - 3} más` : '';
  return { text: `${titles.length} VERSIONES NUEVAS`, sub: `Ya suenan en tu Fonoteca: ${shown}${more}.` };
}
