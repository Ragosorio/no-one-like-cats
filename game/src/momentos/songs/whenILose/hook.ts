/**
 * The H35 interlude (Pixi side, lazy): the battle on screen hands the music and the frame to the Momento, which plays
 * at «La memoria del Archivo», which ENDS the fight (FaseDef.endsBattle, owner's rule 2026-10-10): the victory follows.
 */
import { scenes } from '../../../core/scenes';
import { runBattleMomento } from '../../battle';
import { H35_MOMENTO } from './index';

interface BattleLike {
  spec: { player: { cats: { slug: string }[] } };
  music?: { suspend?: () => void; resume?: (over?: boolean) => void } | null;
  sim?: { winner: 0 | 1 | null };
  destroyed: boolean;
}

export async function playH35Interlude(): Promise<void> {
  const sc = scenes.current as unknown as BattleLike | null;
  if (!sc || sc.destroyed || !sc.spec?.player?.cats) return;
  // the phase's flash fades first: the cold open freezes a clean battle frame
  await new Promise((r) => setTimeout(r, 560));
  if (sc.destroyed) return;
  await runBattleMomento(sc, H35_MOMENTO.song, async () => undefined);
}
