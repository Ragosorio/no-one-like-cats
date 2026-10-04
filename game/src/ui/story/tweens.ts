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
