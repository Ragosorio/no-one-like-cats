/**
 * Entry point for El Podio (1 vs 1 cat duels). Safe to call from anywhere (dynamic imports; never
 * imports another scene statically). Leaving the Podio returns to the island (goIsland).
 */
export function openPodio(): void {
  void enter();
}

async function enter() {
  const [{ scenes }, { PodioScene }, { podioUnlocked }, { toast }, { G }] = await Promise.all([
    import('../../core/scenes'),
    import('../../scenes/PodioScene'),
    import('../../state/sys/podio'),
    import('../../ui/modal'),
    import('../../state/game'),
  ]);
  if (!podioUnlocked()) {
    toast('EL PODIO: cerrado', { sub: 'Abre cuando venzas al Capitán Bigotes Rotos (Jefe 1).' });
    return;
  }
  if (!G.s.cats.length) return;
  if (scenes.current instanceof PodioScene) return;
  await scenes.go(new PodioScene(), 'blocks');
}
