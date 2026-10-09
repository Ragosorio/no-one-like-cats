/**
 * Spread heavy, independent UI work over frames (a time budget per frame) so opening a big panel
 * never freezes the game: the first items appear at once, the rest stream in while you can already
 * scroll and tap. Measured 2026-10-08: the Catdex rasterized 86 cat portraits in one go (~5.5 s of
 * main thread, ~7 FPS while opening); sliced at 10 ms/frame it opens instantly and stays at 60.
 */
import { Container, Ticker } from 'pixi.js';

/**
 * Run `jobs` in order, at most `budgetMs` of work per frame. Stops if `owner` is destroyed.
 * A job may return `false` = "not ready yet" (e.g. its art is still loading): it is retried next frame.
 */
export function runSliced(jobs: (() => void | boolean)[], owner: Container, budgetMs = 10) {
  let i = 0;
  const step = () => {
    if (owner.destroyed) return stop();
    const t0 = performance.now();
    // always at least one job per frame, even if a single job is over budget
    do {
      if (jobs[i]() === false) break;
      i++;
    } while (i < jobs.length && performance.now() - t0 < budgetMs);
    if (i >= jobs.length) stop();
  };
  const stop = () => Ticker.shared.remove(step);
  if (!jobs.length) return stop;
  Ticker.shared.add(step);
  step();
  return stop;
}
