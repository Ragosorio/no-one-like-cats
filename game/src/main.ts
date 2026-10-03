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
import { game } from './core/App';
import { scenes } from './core/scenes';
import { audio } from './core/audio';
import { loadSettings } from './core/settings';
import { F } from './ui/theme';
import { BattleSandbox } from './scenes/BattleSandbox';
import { ArtLab } from './scenes/ArtLab';
import { IslandSandbox } from './scenes/IslandSandbox';
import { BattleScene } from './scenes/BattleScene';
import { devBattle } from './dev/devBattle';
import { TitleScene } from './scenes/TitleScene';

async function loadFonts() {
  const fams = Object.values(F);
  await Promise.all(fams.map((f) => document.fonts.load(`40px "${f}"`).catch(() => undefined)));
  await document.fonts.load('700 40px "Space Grotesk"').catch(() => undefined);
}

async function boot() {
  loadSettings();
  await loadFonts();
  await game.init(document.getElementById('app')!);
  scenes.init();
  window.addEventListener('pointerdown', () => audio.unlock(), { once: false });
  const dev = new URLSearchParams(location.search).get('scene');
  const devB = () => new BattleScene(devBattle((r) => { console.log('battle result', r); scenes.go(devB()); }));
  scenes.go(dev === 'title' ? new TitleScene(() => scenes.go(devB()), false) : dev === 'art' ? new ArtLab() : dev === 'island' ? new IslandSandbox() : dev === 'sandbox' ? new BattleSandbox() : devB(), 'none');
}

boot();
