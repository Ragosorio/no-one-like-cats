/**
 * Contract (casino agent): entry points for the Casino ("El Gato Negro") and the Gacha ("Portal de Invocación").
 *   openCasino()          → enters CasinoScene on the slots/roulette floor
 *   openGacha(banner?)    → enters CasinoScene on the gacha portal (optionally a specific banner id)
 * Both are safe to call from anywhere (dynamic import; never imports another scene).
 * Leaving the casino returns to the island via goIsland().
 */
export function openCasino(): void {
  void enter('floor');
}

export function openGacha(banner?: string): void {
  void enter('gacha', banner);
}

async function enter(tab: 'floor' | 'gacha', banner?: string) {
  const { scenes } = await import('../../core/scenes');
  const { CasinoScene } = await import('../../scenes/CasinoScene');
  if (scenes.current instanceof CasinoScene) {
    scenes.current.show(tab, banner);
    return;
  }
  await scenes.go(new CasinoScene(tab, banner), 'blocks');
}
