import gsap from 'gsap';

/**
 * Keeps references to tweens/timelines whose callbacks touch display objects, so a scene/HUD can
 * kill them all on destroy (Pixi v8 nulls transforms on destroy → late tween writes would throw).
 */
export class TweenBag {
  private s = new Set<gsap.core.Animation>();
  add<T extends gsap.core.Animation>(t: T): T {
    this.s.add(t);
    if (this.s.size > 160) for (const a of this.s) if (a.totalProgress() >= 1) this.s.delete(a);
    return t;
  }
  tl(vars?: gsap.TimelineVars) {
    return this.add(gsap.timeline(vars));
  }
  to(target: gsap.TweenTarget, vars: gsap.TweenVars) {
    return this.add(gsap.to(target, vars));
  }
  fromTo(target: gsap.TweenTarget, from: gsap.TweenVars, to: gsap.TweenVars) {
    return this.add(gsap.fromTo(target, from, to));
  }
  killAll() {
    for (const a of this.s) a.kill();
    this.s.clear();
  }
}
