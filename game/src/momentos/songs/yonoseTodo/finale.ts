/**
 * YONOSE TODO — the finale hook (app/o4Finale.ts registerFinaleMomento). Loaded lazily (index.ts, browser only).
 *
 * playFinale() → this: the Momento takes the picture and the sound; the MISSION PLUMBING stays in o4Finale's FinaleCtx
 * and is called through the bridge at its song times (bridge.ts). `from: 'credits'` (a reload between «Mentira» and
 * REGISTRO 000, or «Volver a ver» of the credits) plays the song from the prechorus with the end of the score only.
 * If the Momento cannot play at all (no beat map, an error before its clock), the fallback cines take over
 * ('fallback'); if it played and was left (a replay's SALIR), it is 'interrupted'.
 */
import { registerFinaleMomento, type FinaleCtx } from '../../../app/o4Finale';
import { FinaleBridge, setFinaleBridge } from './bridge';
import { RESUME_DEF, YONOSE_TODO } from './score';

export async function playYonoseFinale(ctx: FinaleCtx): Promise<'done' | 'interrupted' | 'fallback'> {
  const { playMomento } = await import('../../index');
  const bridge = new FinaleBridge({ choose: (p) => ctx.choose(p), asleep: () => ctx.asleep(), mentira: () => ctx.mentira(), wake: () => ctx.wake() }, ctx.from);
  bridge.lines = (beat, idx) => ctx.lines(beat, idx);
  setFinaleBridge(bridge);
  let res: Awaited<ReturnType<typeof playMomento>> = null;
  try {
    res = await playMomento(YONOSE_TODO.id, { replay: ctx.replay, def: ctx.from === 'credits' ? RESUME_DEF : undefined });
  } finally {
    setFinaleBridge(null);
  }
  if (!res) return bridge.started ? 'interrupted' : 'fallback';
  bridge.finish(res.end);
  return res.end === 'done' ? 'done' : 'interrupted';
}

export function installFinale() {
  registerFinaleMomento(playYonoseFinale);
}
