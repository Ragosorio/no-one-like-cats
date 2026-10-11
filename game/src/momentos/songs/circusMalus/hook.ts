/**
 * The H62 interlude (Pixi side, lazy): the battle on screen hands the music and the frame to the Momento, which plays
 * at «El Plan», which ENDS the fight (FaseDef.endsBattle, owner's rule 2026-10-10): the victory follows the cut.
 */
import { scenes } from '../../../core/scenes';
import { runBattleMomento } from '../../battle';
import { CIRCUS_MALUS } from './score';

interface BattleLike {
  spec: { player: { cats: { slug: string }[] } };
  music?: { suspend?: () => void; resume?: (over?: boolean) => void } | null;
  sim?: { winner: 0 | 1 | null };
  destroyed: boolean;
}

export async function playH62Interlude(): Promise<void> {
  const sc = scenes.current as unknown as BattleLike | null;
  if (!sc || sc.destroyed || !sc.spec?.player?.cats) return;
  // the phase's white flash fades first: the cold open freezes (and stamps) a clean battle frame
  await new Promise((r) => setTimeout(r, 560));
  if (sc.destroyed) return;
  await runBattleMomento(sc, CIRCUS_MALUS.id, async () => undefined);
}
