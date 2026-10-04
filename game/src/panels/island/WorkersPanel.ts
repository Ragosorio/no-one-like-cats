/**
 * Oficios (KL24, GDD 2.15 "Gatos trabajadores"). Contract: `openWorkers()`.
 * Full panel lives in ./workers/WorkersView (lazy) so importing this file stays cheap.
 */
export function openWorkers(): void {
  void import('./workers/WorkersView').then((m) => m.openWorkersView());
}
