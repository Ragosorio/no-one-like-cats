/**
 * The H62 interlude (Pixi side, lazy): the battle on screen hands the music and the frame to the Momento, which plays
 * between «La Corrección» and «El Plan»; the fight resumes on the next turn in the new phase. Presentation only.
 */
import { scenes } from '../../../core/scenes';
import { runBattleMomento } from '../../battle';
import { CIRCUS_MALUS } from './score';

interface BattleLike {
  spec: { player: { cats: { slug: string }[] } };
  music?: { suspend?: () => void; resume?: () => void } | null;
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
