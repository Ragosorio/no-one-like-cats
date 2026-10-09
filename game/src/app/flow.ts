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
  const { hasSave: has } = await import('../core/save');
  const hasSave = has();
  scenes.go(
    new TitleScene(
      async () => {
        const info = bootGame();
        const { maybeIntro } = await import('./story');
        await maybeIntro(info);
      },
      hasSave,
      async () => {
        // NUEVA PARTIDA sat next to CONTINUAR and wiped the island with one tap: now it asks first
        if (!(await confirmNewGame())) return;
        newGame();
        const { maybeIntro } = await import('./story');
        await maybeIntro({ isNew: true, offlineMs: 0, offlineGold: 0 });
      },
    ),
    'none',
  );
  void G;
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

/** "¿Seguro?": what you'd lose, CANCELAR on the safe side, and the island kept in the history anyway */
async function confirmNewGame(): Promise<boolean> {
  const { Modal } = await import('../ui/modal');
  const { Button, txt } = await import('../ui/widgets');
  const { C, F } = await import('../ui/theme');
  const { readSave } = await import('../core/save');
  const { summarize, describe } = await import('../core/vault');
  const env = readSave();
  const sum = env ? summarize(JSON.stringify(env)) : null;
  if (!sum || !sum.cats) return true;
  return new Promise((resolve) => {
    let answered = false;
    const m = new Modal('¿EMPEZAR DE CERO?', 900, 420, { band: C.red, subtitle: 'NUEVA PARTIDA' });
    const t = txt(`Tu isla actual: ${describe(sum)}.\n\nSe guarda una copia en Ajustes › RESPALDOS por si te arrepientes, pero la partida que juegues se vuelve la principal.`, { fontFamily: F.ui, fontWeight: '700', fontSize: 20, fill: C.ink, wordWrap: true, wordWrapWidth: m.innerW, lineHeight: 28 });
    m.body.addChild(t);
    const done = (v: boolean) => {
      if (answered) return;
      answered = true;
      m.close();
      resolve(v);
    };
    const keep = new Button('NO, SEGUIR CON MI ISLA', () => done(false), { w: 420, h: 70, size: 28, color: C.mint });
    keep.position.set(0, m.innerH - 80);
    const wipe = new Button('SÍ, EMPEZAR DE CERO', () => done(true), { w: 340, h: 70, size: 26, color: C.ink, textColor: C.paper });
    wipe.position.set(m.innerW - 340, m.innerH - 80);
    m.body.addChild(keep, wipe);
    m.onClose = () => done(false);
    m.open();
  });
}
