import '@fontsource/anton';
import '@fontsource/bebas-neue';
import '@fontsource/bangers';
import '@fontsource/dela-gothic-one';
import '@fontsource/permanent-marker';
import '@fontsource/unifrakturmaguntia';
import '@fontsource/playfair-display';
import '@fontsource/playfair-display/700.css';
import '@fontsource/rubik-glitch';
import '@fontsource/space-grotesk';
import '@fontsource/space-grotesk/700.css';
import './island/safety';
import './core/safety';
import '@fontsource/playfair-display/400-italic.css';
import { Ticker } from 'pixi.js';
import { game } from './core/App';
import { scenes } from './core/scenes';
import { audio } from './core/audio';
import { loadSettings } from './core/settings';
import { F } from './ui/theme';
import { G } from './state/game';
import { bootGame, newGame } from './state';
import { goIsland, goMap, goTitle } from './app/flow';
import { mountMicroOverlay } from './ui/micro/MicroOverlay';
import './state/sys/micro';

async function loadFonts() {
  const fams = Object.values(F);
  await Promise.all(fams.map((f) => document.fonts.load(`40px "${f}"`).catch(() => undefined)));
  await document.fonts.load('700 40px "Space Grotesk"').catch(() => undefined);
}

/**
 * Dev routes: ?scene=island|map|battle|title|art|shiplab|sandbox|islandlab
 * (&new=1 starts a fresh save). No param = the real game (title screen).
 */
async function route(scene: string | null, fresh: boolean) {
  const needsState = ['island', 'map'].includes(scene ?? '');
  if (needsState) {
    if (fresh) newGame();
    else bootGame();
  }
  switch (scene) {
    case 'island':
      return goIsland();
    case 'map':
      return goMap();
    case 'battle': {
      const { BattleScene } = await import('./scenes/BattleScene');
      const { devBattle } = await import('./dev/devBattle');
      const devB = (): InstanceType<typeof BattleScene> => new BattleScene(devBattle(() => scenes.go(devB())));
      return scenes.go(devB(), 'none');
    }
    case 'art': {
      const { ArtLab } = await import('./scenes/ArtLab');
      return scenes.go(new ArtLab(), 'none');
    }
    case 'shiplab': {
      const { ShipArtLab } = await import('./scenes/ShipArtLab');
      return scenes.go(new ShipArtLab(), 'none');
    }
    case 'sandbox': {
      const { BattleSandbox } = await import('./scenes/BattleSandbox');
      return scenes.go(new BattleSandbox(), 'none');
    }
    case 'islandlab': {
      const { IslandSandbox } = await import('./scenes/IslandSandbox');
      return scenes.go(new IslandSandbox(), 'none');
    }
    default:
      return goTitle();
  }
}

async function boot() {
  loadSettings();
  await loadFonts();
  await game.init(document.getElementById('app')!);
  scenes.init();
  mountMicroOverlay();
  window.addEventListener('pointerdown', () => audio.unlock());
  // the economy clock runs whenever a save is loaded (island, map, battles…)
  Ticker.shared.add((t) => {
    if (G.s.cats.length) G.tick(Math.min(1000, t.deltaMS));
  });
  window.addEventListener('beforeunload', () => {
    if (G.s.cats.length) G.save();
  });
  const q = new URLSearchParams(location.search);
  await route(q.get('scene'), q.get('new') === '1');
}

boot();
