import type { Container } from 'pixi.js';
import gsap from 'gsap';

/** Kill every gsap tween targeting a display tree (before destroying it), so no tween writes into dead objects. */
export function killTweensDeep(o: Container | null | undefined) {
  if (!o || o.destroyed) return;
  gsap.killTweensOf(o);
  gsap.killTweensOf(o.scale);
  gsap.killTweensOf(o.position);
  gsap.killTweensOf(o.pivot);
  gsap.killTweensOf(o.skew);
  for (const c of o.children) killTweensDeep(c as Container);
}

/** kill tweens, then destroy the whole tree */
export function destroyDeep(o: Container | null | undefined) {
  if (!o || o.destroyed) return;
  killTweensDeep(o);
  o.destroy({ children: true });
}

/** await a gsap animation, but never longer than maxMs of real time (its targets may be destroyed/killed) */
export function settle(start: (done: () => void) => void, maxMs: number): Promise<void> {
  return new Promise<void>((res) => {
    let fin = false;
    const done = () => {
      if (fin) return;
      fin = true;
      res();
    };
    window.setTimeout(done, maxMs);
    try {
      start(done);
    } catch {
      done();
    }
  });
}
