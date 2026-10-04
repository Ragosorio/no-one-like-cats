/**
 * Campaign battle flow: (pre-battle panel →) repair gate → BattleScene → applyResult → ResultsScene.
 * Errands: board → BattleScene → applyErrandResult → errand results poster → map.
 * Owned by the COMBATE module. Scenes never import each other: flow glues them.
 */
import { Container, Rectangle, Texture } from 'pixi.js';
import gsap from 'gsap';
import { scenes } from '../core/scenes';
import { W, H, game } from '../core/App';
import { music } from '../core/music';
import { BattleScene } from '../scenes/BattleScene';
import type { BattleResult, BattleSpec } from '../scenes/BattleScene';
import { buildBattle, buildErrand, applyErrandResult, isRepairing } from '../state/sys/campaign';
import { crew } from '../state/sys/ship';
import { cat as getCat, catPow } from '../state/sys/cats';
import { resolveBattle, stageKind, LastBattle } from '../state/ext/campaign';

/** optional extras BattleScene may attach to its result (MVP uid, photo of the final impact) */
type ResultExtras = BattleResult & { mvp?: string; photo?: Texture };

/**
 * Safety net: a tween whose target was destroyed before its first render throws on init every tick,
 * which aborts the whole GSAP root render (scene transitions freeze). Seen with BattleCat particles
 * (art/catArt.ts spawnParticle) when a BattleCat is destroyed through its parent. Sweep them out.
 */
let janitor = false;
function installTweenJanitor() {
  if (janitor) return;
  janitor = true;
  // independent of gsap.ticker: when the root render throws, later ticker listeners never run
  window.setInterval(() => {
    for (const tw of gsap.globalTimeline.getChildren(true, true, false)) {
      const targets = (tw as gsap.core.Tween).targets?.() as unknown[] | undefined;
      if (targets?.some((x) => x instanceof Container && x.destroyed)) tw.kill();
    }
  }, 250);
}

/** the active ship is being repaired: offer Ronroneo / another ship / wait. Resolves true to sail. */
async function repairGate(): Promise<boolean> {
  if (!isRepairing()) return true;
  const { openRepairGate } = await import('../battle/ui/repairGate');
  return openRepairGate();
}

export async function startCampaignBattle(zone: number, stage: number) {
  installTweenJanitor();
  if (!(await repairGate())) return;
  music.play(stageKind(zone, stage) === 'boss' ? 'boss' : 'battle');
  let scene: BattleScene | null = null;
  let ended = false;
  const spec: BattleSpec = buildBattle(zone, stage, (r) => {
    if (ended) return;
    ended = true;
    const ext = r as ResultExtras;
    const photo = ext.photo ?? capturePhoto(scene);
    const mvp = ext.mvp ?? pickMvp();
    const last = resolveBattle(zone, stage, r, { mvp });
    void showResults(last, photo);
  });
  scene = new BattleScene(spec);
  await scenes.go(scene, 'blocks');
}

/** Encargo (errand) battle: restrictions are applied by buildErrand (ship/crew/rules) */
export async function startErrandBattle(id: string) {
  installTweenJanitor();
  if (!(await repairGate())) return;
  music.play('battle');
  let ended = false;
  const spec: BattleSpec = buildErrand(id, (r) => {
    if (ended) return;
    ended = true;
    const loot = applyErrandResult(id, { ...r, mvp: r.mvp ?? pickMvp() ?? undefined });
    void (async () => {
      const { goMap } = await import('./flow');
      await goMap();
      const { showErrandResults } = await import('../panels/errands/results');
      showErrandResults(id, r, loot);
    })();
  });
  await scenes.go(new BattleScene(spec), 'blocks');
}

export async function showResults(last: LastBattle, photo: Texture | null) {
  const { ResultsScene } = await import('../scenes/ResultsScene');
  music.play(last.result.won ? 'island' : 'tension');
  await scenes.go(new ResultsScene(last, photo), 'blocks');
}

/** "photo of the impact": the battle world (no HUD/overlay) rendered to a texture */
function capturePhoto(scene: BattleScene | null): Texture | null {
  if (!scene || scene.destroyed) return null;
  try {
    const target = scene.camRoot ?? scene;
    return game.pixi.renderer.generateTexture({ target, frame: new Rectangle(0, 0, W, H), resolution: 0.5 });
  } catch (e) {
    console.warn('[battleFlow] photo capture failed', e);
    return null;
  }
}

/** MVP fallback: power-weighted pick from the crew (BattleScene can provide the real one) */
function pickMvp(): string | null {
  const cats = crew()
    .map((u) => getCat(u))
    .filter((c): c is NonNullable<typeof c> => !!c);
  if (!cats.length) return null;
  const total = cats.reduce((a, c) => a + catPow(c), 0);
  let r = Math.random() * total;
  for (const c of cats) {
    r -= catPow(c);
    if (r <= 0) return c.uid;
  }
  return cats[0].uid;
}
