/**
 * A Momento on a battle's PHASE CHANGE (BattleScene → checkBossPhase, marked «MOMENTO:»).
 *
 * OWNER'S RULE (2026-10-10): the Momento ENDS the battle. Its phase has `endsBattle` (battle/fases.ts), so the sim
 * already declared the victory when it entered the phase (deterministic: the estimate agrees). After the cut the
 * battle music does NOT come back (BattleMusic.resume(true)) and BattleScene goes straight to the victory.
 * Older description of the hand-off, still true up to the cut:
 *
 * The sim already switched the phase (deterministic: the estimate never sees any of this). Here, between the shot that
 * crossed the threshold and the next turn: the battle music steps aside, the Momento plays (it freezes the battle frame
 * as its cold open), ~0.4 s before its hard cut the new phase is staged UNDER it (layer swap, banner, music signal), and
 * when it ends the battle is over (FaseDef.endsBattle, see above): BattleScene goes to the victory.
 */
import { playMomento } from './index';

interface BattleLike {
  spec: { player: { cats: { slug: string }[] } };
  music?: { suspend?: () => void; resume?: (over?: boolean) => void } | null;
  sim?: { winner: 0 | 1 | null };
  destroyed: boolean;
}

/** the fight is over (an ending phase): nothing of the battle plays after the Momento */
export const battleOver = (scene: { sim?: { winner: 0 | 1 | null } } | null | undefined) => scene?.sim?.winner != null;

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
  scene.music?.resume?.(battleOver(scene));
  await staged;
}
