/**
 * Las dos caras de la isla (Rupturas): PÁGINA ⇄ MUNDO.
 *
 * Canon: the Part I view is the island AS THE ARCHIVE WRITES IT — a page (flat map colors, iso grid,
 * inked coast, unlit painted cats). Since the Rupturas the page has thickness; Luzterna's lantern
 * (la Lente de la Farera) lets you see the WORLD. Both are true and both stay playable: the page is
 * where you build and read the margins; the world is where cats live, weather happens and REGISTRO 000
 * watches. Switching is a pop-up book: the island lifts off the page in a wave from the center.
 *
 * Here PÁGINA is a flattened 3D look-alike; in the real game PÁGINA is the actual Pixi island (07 §7).
 */
import * as THREE from 'three';

export type ViewMode = 'mundo' | 'pagina';

export interface Poppable {
  obj: THREE.Object3D;
  /** 0..1 stagger (0 = rises first) */
  delay: number;
  /** rest scale.y in the world view */
  restY: number;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** ease-out with a little overshoot: paper snapping upright */
const popEase = (t: number) => {
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const smooth = (t: number) => t * t * (3 - 2 * t);

export class IslandViews {
  mode: ViewMode = 'mundo';
  /** 0 = world, 1 = page (animated) */
  k = 0;
  private target = 0;
  private dur = 1.8;
  private items: Poppable[] = [];
  onChange: ((m: ViewMode) => void) | null = null;

  add(obj: THREE.Object3D, center = new THREE.Vector3(0, 0, 4)) {
    const p = obj.getWorldPosition(new THREE.Vector3());
    const d = Math.hypot(p.x - center.x, p.z - center.z);
    this.items.push({ obj, delay: clamp01(d / 70) * 0.55, restY: obj.scale.y });
  }

  /** slow, ceremonial unfold for the story beat (H31) */
  setDuration(sec: number) {
    this.dur = sec;
  }
  set(m: ViewMode, instant = false) {
    this.mode = m;
    this.target = m === 'pagina' ? 1 : 0;
    if (instant) this.k = this.target;
    this.onChange?.(m);
  }
  toggle() {
    this.set(this.mode === 'mundo' ? 'pagina' : 'mundo');
  }
  get busy() {
    return this.k !== this.target;
  }

  /** advance the transition; returns the world-ness of each layer for the caller to apply */
  update(dt: number, reduced: boolean) {
    const step = dt / (reduced ? 0.6 : this.dur);
    if (this.k < this.target) this.k = Math.min(this.target, this.k + step);
    else if (this.k > this.target) this.k = Math.max(this.target, this.k - step);
    // world amount w: 1 = fully popped up
    const w = 1 - this.k;
    for (const it of this.items) {
      // each piece rises in its own window: the wave spreads from the center
      const local = clamp01((w * 1.55 - it.delay) / 0.9);
      const s = reduced ? smooth(local) : local >= 1 ? 1 : popEase(local);
      it.obj.scale.y = Math.max(0.015, it.restY * s);
    }
    return { world: w, lens: smooth(this.k) };
  }
}
