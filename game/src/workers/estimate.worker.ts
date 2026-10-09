/**
 * Estimate sims off the main thread. The battle core (battle/sim, ai, autoplay…) is pure: same code,
 * same seeds, same result as on screen — just not competing with the frame.
 *   in:  { id, i, spec }   (spec without onEnd: structured-cloneable, checked 2026-10-08)
 *   out: { id, i, res }    (AutoResult)
 */
import { autoBattle } from '../battle/autoplay';
import { DIFFICULTY } from '../battle/ai';
import type { BattleSpec } from '../scenes/BattleScene';

self.onmessage = (e: MessageEvent<{ id: number; i: number; spec: BattleSpec }>) => {
  const { id, i, spec } = e.data;
  try {
    const res = autoBattle(spec, i % 2 ? DIFFICULTY.hard : DIFFICULTY.normal, 1000 + i * 77, 30);
    (self as unknown as Worker).postMessage({ id, i, res });
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, i, error: String(err) });
  }
};
