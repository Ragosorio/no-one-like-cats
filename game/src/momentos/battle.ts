/**
 * A Momento on a battle's PHASE CHANGE (BattleScene → checkBossPhase, marked «MOMENTO:»).
 *
 * The sim already switched the phase (deterministic: the estimate never sees any of this). Here, between the shot that
 * crossed the threshold and the next turn: the battle music steps aside, the Momento plays (it freezes the battle frame
 * as its cold open), ~0.4 s before its hard cut the new phase is staged UNDER it (layer swap, banner, music signal), and
 * when it ends the battle continues in the new layer while the battle music takes the next bar.
 */
import { playMomento } from './index';

interface BattleLike {
  spec: { player: { cats: { slug: string }[] } };
  music?: { suspend?: () => void; resume?: () => void } | null;
  destroyed: boolean;
}

export async function runBattleMomento(scene: BattleLike, id: string, stage: () => Promise<void>): Promise<void> {
  scene.music?.suspend?.();
  let staged: Promise<void> | null = null;
  try {
    await playMomento(id, {
      crew: scene.spec.player.cats.map((c) => c.slug),
      beforeCut: () => {
        staged = stage();
      },
    });
  } catch (e) {
    console.error('[momento] batalla', e);
  }
  if (scene.destroyed) return;
  // the Momento could not play (no beat map, an error): the phase still has to be staged
  staged ??= stage();
  scene.music?.resume?.();
  await staged;
}
