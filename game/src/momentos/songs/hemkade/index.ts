/**
 * HEMKADE (H57) — registers the Momento and plugs it into the battle's layer change (sea → sky) through the FASES
 * interlude hook (battle/fases.ts registerFaseInterlude): FasesFx.stage() flashes, swaps to the sky layer, emits the
 * phase and then AWAITS this interlude before its banner; BattleScene waits for that staging before the next turn.
 * Presentation only: the sim already entered the phase; nothing here touches the outcome or the estimate.
 *
 * Pixi-free at import (songs/index.ts must stay pure): the player and the scene are loaded lazily.
 */
import { registerMomento } from '../../registry';
import { registerFaseInterlude, type FaseChange } from '../../../battle/fases';
import { HEMKADE } from './score';

registerMomento(HEMKADE);

/** H57_MOMENTO in app/oleada3Flow.ts (kept equal by tests/momentoHemkade.test.ts) */
export const HEMKADE_HOOK = { battle: 'ruptura_leviatan', fase: 'cielo' } as const;

interface BattleLike {
  spec?: { player?: { cats?: { slug: string }[] } };
  music?: { suspend?: () => void; resume?: () => void } | null;
  destroyed?: boolean;
}

export async function playHemkadeInterlude(_change: FaseChange): Promise<void> {
  const [{ scenes }, { playMomento }] = await Promise.all([import('../../../core/scenes'), import('../../index')]);
  const sc = (scenes as unknown as { current?: BattleLike | null }).current ?? null;
  // the battle music steps aside (the 'fase:cielo' signal stays queued: on resume the plan jumps to its sky section)
  sc?.music?.suspend?.();
  try {
    await playMomento(HEMKADE.id, { crew: sc?.spec?.player?.cats?.map((c) => c.slug) ?? [] });
  } finally {
    if (!sc?.destroyed) sc?.music?.resume?.();
  }
}

registerFaseInterlude(HEMKADE_HOOK.battle, HEMKADE_HOOK.fase, playHemkadeInterlude);
