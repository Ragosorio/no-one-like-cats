import './core/pixiFixes'; // Pixi v8 footguns (Graphics contexts leaked on destroy({children}))
import '@fontsource/anton';
import { initPwa } from './core/pwa';
import { initUpdates } from './core/updates';
import { initSaveGuard } from './ui/saveGuard';
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
import 'pixi.js/mesh';
import 'pixi.js/graphics';
import 'pixi.js/text';
import 'pixi.js/sprite-tiling';
import { Ticker } from 'pixi.js';
import { game } from './core/App';
import { scenes } from './core/scenes';
import { audio } from './core/audio';
import { loadSettings } from './core/settings';
import { F } from './ui/theme';
import { G } from './state/game';
import { bootGame, newGame } from './state';
import { goBattle, goIsland, goMap, goTitle } from './app/flow';
import { mountMicroOverlay } from './ui/micro/MicroOverlay';
import { initStory } from './app/story';
import { initForms } from './app/formsFlow';
import { initOleada2 } from './app/oleada2Flow';
import { initOleada3 } from './app/oleada3Flow';
import { initOleada4 } from './app/oleada4Flow';
import { applyAudioSettings } from './panels/Settings';
import { installAudio } from './audio/engine';
import { preloadElementIcons } from './ui/elementIcon';
import './state/sys/micro';
import './momentos/install'; // Parte II · Momentos musicales: their save slice is normalized on every load (src/momentos)

async function loadFonts() {
  const fams = Object.values(F);
  const all = Promise.all([
    ...fams.map((f) => document.fonts.load(`40px "${f}"`).catch(() => undefined)),
    document.fonts.load('700 40px "Space Grotesk"').catch(() => undefined),
    // the italic cut is bundled but loads lazily: Pixi measured the first italic texts (Diario's tip, photo captions)
    // with the fallback and cut their last word once the real face arrived («…En todos tus suéter»)
    document.fonts.load('italic 400 40px "Playfair Display"').catch(() => undefined),
  ]);
  // a slow CDN (seen: a 408 on GitHub Pages) must not hold the boot on a black screen
  await Promise.race([all, new Promise((r) => setTimeout(r, 4000))]);
}

/**
 * Dev routes: ?scene=island|map|battle|title|art|catlive|shiplab|sandbox|islandlab|dev|fxlab
 * (&new=1 starts a fresh save). No param = the real game (title screen).
 * ?scene=dev is the LABORATORIO hub that lists every lab; ?dev=1 adds a LAB button to the title.
 */
async function route(scene: string | null, fresh: boolean) {
  const needsState = ['island', 'map', 'region'].includes(scene ?? '');
  if (needsState) {
    // &new=1 wipes the live save: dev server only (on the public site it would cost a player their island)
    if (fresh && import.meta.env.DEV) newGame();
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
      // ?scene=battle&music=liky_fight (DEV): the choreographed battle-music test fight (src/battle/music)
      const musicId = import.meta.env.DEV ? new URLSearchParams(location.search).get('music') : null;
      const mk = musicId ? (await import('./dev/devMusicBattle')).devMusicBattle(musicId) : devBattle;
      const devB = (): InstanceType<typeof BattleScene> => new BattleScene(mk(() => scenes.go(devB())));
      return scenes.go(devB(), 'none');
    }
    case 'art': {
      const { ArtLab } = await import('./scenes/ArtLab');
      return scenes.go(new ArtLab(), 'none');
    }
    case 'catlive': {
      const { CatLiveLab } = await import('./scenes/CatLiveLab');
      return scenes.go(new CatLiveLab(), 'none');
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
    case 'dev': {
      const { DevLab } = await import('./scenes/DevLab');
      return scenes.go(new DevLab(), 'none');
    }
    case 'fxlab': {
      const { FxLab } = await import('./scenes/FxLab');
      return scenes.go(new FxLab(), 'none');
    }
    case 'region': {
      // dev only: ?scene=region&region=paginas|nacar|reflejo (Parte II 3D regions)
      if (!import.meta.env.DEV) return goTitle();
      const { goRegion } = await import('./app/flow');
      return goRegion(new URLSearchParams(location.search).get('region') ?? 'paginas');
    }
    case 'caja': {
      // dev only: ?scene=caja&set=bar|calle (&cine=p3_bar_a) — Parte III, La Borracha (app/gaterasFlow.ts)
      if (!import.meta.env.DEV) return goTitle();
      bootGame();
      return (await import('./app/gaterasFlow')).devCaja(new URLSearchParams(location.search));
    }
    case 'cajas': {
      // dev only: ?scene=cajas (&save=h65-normal) — Parte III, la Carta de las Cajas (scenes/GaterasMapScene.ts)
      if (!import.meta.env.DEV) return goTitle();
      bootGame();
      (await import('./state/sys/gateras')).setGaterasDev(true);
      return (await import('./app/cajasFlow')).goCajas('none');
    }
    default:
      return goTitle();
  }
}

async function boot() {
  loadSettings();
  await loadFonts();
  await game.init(document.getElementById('app')!);
  await preloadElementIcons();
  scenes.init();
  initPwa();
  initUpdates();
  initSaveGuard();
  mountMicroOverlay();
  applyAudioSettings();
  installAudio(); // Parte II audio engine: buses, director, Fonoteca (src/audio, docs/part-ii/19)
  initStory();
  initForms(); // Parte II forms: the reveal when one unlocks (app/formsFlow.ts)
  initOleada2(); // Parte II · Oleada 2: the H48 choice, Hélice joining, the sky preflight (app/oleada2Flow.ts)
  initOleada3(); // Parte II · Oleada 3: the Taller Cometa, the seal / card / logbook, Maneki, the void preflight (app/oleada3Flow.ts)
  initOleada4(); // Parte II · Oleada 4: Ecos, the page by the faro, Polvillo, the strikethroughs, the credits (app/oleada4Flow.ts)
  void import('./app/cajasFlow').then((m) => m.initCajas()); // Parte III: the gatera by your faro (once the Borracha is open)
  window.addEventListener('pointerdown', () => audio.unlock());
  // the economy clock runs whenever a save is loaded (island, map, battles…)
  // dev: ?speed=4 runs the economy clock 4× faster (pacing tests); battles stay real-time
  const speed = import.meta.env.DEV ? Math.max(1, Number(new URLSearchParams(location.search).get('speed')) || 1) : 1;
  Ticker.shared.add((t) => {
    if (G.s.cats.length) G.tick(Math.min(1000, t.deltaMS) * speed);
  });
  window.addEventListener('beforeunload', () => {
    if (G.s.cats.length) G.save();
  });
  // tab hidden / app backgrounded: flush now (beforeunload never fires on mobile kills)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && G.s.cats.length) G.save();
  });
  const q = new URLSearchParams(location.search);
  if (import.meta.env.DEV) {
    const gsap = (await import('gsap')).default;
    (window as unknown as { __gsap: typeof gsap; __scenes: typeof scenes }).__gsap = gsap;
    (window as unknown as { __scenes: typeof scenes }).__scenes = scenes;
    // __overflow(): lists texts/controls leaking out of the open panel + overlapping texts
    void import('./dev/overflowAudit').then((m) => m.installOverflowAudit());
    // ?realtime=1: animations follow wall-clock even when the tab is throttled (testing)
    if (q.get('realtime') === '1') gsap.ticker.lagSmoothing(0);
    // ?save=post-boss1: load a fixture from game/test-saves/ into the save slot, then continue without the param
    const fixture = q.get('save');
    if (fixture) {
      const res = await fetch(`/test-saves/${fixture}.json`);
      if (res.ok) {
        localStorage.setItem('nolc-save-v1', await res.text());
      }
      q.delete('save');
      history.replaceState(null, '', `${location.pathname}${q.size ? `?${q}` : ''}`);
    }
  }
  // ?momento=liky_fight (DEV): a Momento musical standalone; ?momento=lab = the cel treatment lab (src/momentos/dev.ts)
  if (import.meta.env.DEV && q.get('momento')) {
    bootGame();
    return (await import('./momentos/dev')).devMomento(q.get('momento')!);
  }
  // ?film=demo (DEV): a film standalone (Parte III «Películas», src/film/dev.ts); &scrub=1 → __film.render(m)
  if (import.meta.env.DEV && q.get('film')) {
    bootGame();
    return (await import('./film/dev')).devFilm(q.get('film')!);
  }
  // ?stage=2-9: boot the save and jump straight into that campaign battle (dev)
  if (import.meta.env.DEV && q.get('stage')) {
    bootGame();
    const [z, st] = q.get('stage')!.split('-').map(Number);
    return goBattle(z, st);
  }
  if (q.get('dev') === '1') {
    const [{ mountDevShortcut }, { TitleScene }] = await Promise.all([import('./scenes/DevLab'), import('./scenes/TitleScene')]);
    mountDevShortcut(() => scenes.current instanceof TitleScene);
  }
  await route(q.get('scene'), q.get('new') === '1');
}

boot();
