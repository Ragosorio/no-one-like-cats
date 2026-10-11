/**
 * A low-pass on the MUSIC submix only (H35: the Bibliotecario «silences» the song as the RUIDO meter fills).
 *
 * The mixer (core/audio.ts) has no filter on the music bus, so this inserts one between musicDuck and master the
 * first time it is needed and takes it out again when it opens fully (the graph is exactly the engine's again).
 * Backwards compatible: nothing else changes, SFX / voices / ambience are untouched. If the engine ever grows its
 * own `musicLowpass()`, swap this file for a call to it (docs/part-ii/24-batallas-musicales.md §7).
 */
import { audio } from '../../core/audio';

let lp: BiquadFilterNode | null = null;
let restoreTimer = 0;
const OPEN = 20000;

/** cutoff in Hz; null = fully open (and, after the glide, out of the graph) */
export function setMusicLowpass(hz: number | null, glide = 0.25) {
  const ctx = audio.ctx;
  if (!ctx || !audio.musicDuck || !audio.master) return;
  window.clearTimeout(restoreTimer);
  if (hz === null) {
    if (!lp) return;
    const f = lp;
    f.frequency.cancelScheduledValues(ctx.currentTime);
    f.frequency.setTargetAtTime(OPEN, ctx.currentTime, glide / 3);
    restoreTimer = window.setTimeout(() => removeLowpass(), Math.max(200, glide * 1000 + 400));
    return;
  }
  if (!lp) {
    lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.9;
    lp.frequency.value = OPEN;
    try {
      audio.musicDuck.disconnect(audio.master);
    } catch {
      /* not connected there (another insert?) — then don't touch the graph */
      lp = null;
      return;
    }
    audio.musicDuck.connect(lp);
    lp.connect(audio.master);
  }
  const v = Math.max(120, Math.min(OPEN, hz));
  lp.frequency.cancelScheduledValues(ctx.currentTime);
  lp.frequency.setTargetAtTime(v, ctx.currentTime, glide / 3);
}

/** back to the engine's own graph (battle over / scene exit) */
export function removeLowpass() {
  window.clearTimeout(restoreTimer);
  if (!lp || !audio.ctx) return;
  try {
    audio.musicDuck.disconnect(lp);
  } catch {
    /* ok */
  }
  try {
    lp.disconnect();
  } catch {
    /* ok */
  }
  audio.musicDuck.connect(audio.master);
  lp = null;
}

/** DEV / tests: the current cutoff (null = no filter in the graph) */
export const musicLowpassHz = () => (lp ? lp.frequency.value : null);
