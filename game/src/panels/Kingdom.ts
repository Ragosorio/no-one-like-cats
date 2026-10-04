/**
 * Reino (GDD 2.17 · 6.17): nivel, barra, hitos (content.kingdomMilestones) y automatizaciones
 * (content.automation). Contrato: `openKingdom()` — Isla lo abre al tocar el escudo de Reino del HUD.
 */
export function openKingdom(): void {
  void import('./kingdom/KingdomPanel').then((m) => m.openKingdomPanel());
}
