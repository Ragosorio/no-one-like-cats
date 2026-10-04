/**
 * Navigation between scenes. Lazy imports keep scenes decoupled (each is owned by a different module).
 * Every scene/panel that needs to navigate imports from here — never imports another scene directly.
 */
import { scenes } from '../core/scenes';
import { music } from '../core/music';

export async function goTitle() {
  const { TitleScene } = await import('../scenes/TitleScene');
  const { G } = await import('../state/game');
  const { bootGame, newGame } = await import('../state');
  const hasSave = !!localStorageHas();
  scenes.go(
    new TitleScene(
      async () => {
        const info = bootGame();
        const { maybeIntro } = await import('./story');
        await maybeIntro(info);
      },
      hasSave,
      async () => {
        newGame();
        const { maybeIntro } = await import('./story');
        await maybeIntro({ isNew: true, offlineMs: 0, offlineGold: 0 });
      },
    ),
    'none',
  );
  void G;
}

function localStorageHas() {
  try {
    return localStorage.getItem('nolc-save-v1');
  } catch {
    return null;
  }
}

export async function goIsland() {
  const { IslandScene } = await import('../scenes/IslandScene');
  music.play('island');
  await scenes.go(new IslandScene(), 'blocks');
}

export async function goMap() {
  const { MapScene } = await import('../scenes/MapScene');
  music.play('island');
  await scenes.go(new MapScene(), 'blocks');
}

/** start a campaign battle; on end shows results then returns to the map */
export async function goBattle(zone: number, stage: number) {
  const { startCampaignBattle } = await import('./battleFlow');
  await startCampaignBattle(zone, stage);
}
