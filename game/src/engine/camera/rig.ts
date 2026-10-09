/**
 * Camera rig (AgentGameEngine `camera/rig`): desktop-first orbit camera with eased state.
 * - left drag: orbit · right/middle drag or WASD: pan · wheel: zoom · Q/E: rotate
 * - focus(target, dist): cinematic dolly to a point; follow(getter): track a moving object
 * - shake(): trauma-based shake (disabled under reduced motion)
 * All motion is critically damped, so cuts never pop unless `cut()` is asked for.
 */
import * as THREE from 'three';

export interface RigState {
  target: THREE.Vector3;
  yaw: number;
  pitch: number;
  dist: number;
}

const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt));

export class CameraRig {
  readonly cur: RigState;
  readonly goal: RigState;
  limits = { minDist: 6, maxDist: 110, minPitch: 0.12, maxPitch: 1.35, bound: 90 };
  /** follow a moving point (null = free) */
  follow: (() => THREE.Vector3) | null = null;
  reducedMotion = false;
  /** fixed-angle views (the PAGE view keeps the Part I isometric angle) */
  lockOrbit = false;
  private trauma = 0;
  private keys = new Set<string>();
  private drag: { btn: number; x: number; y: number } | null = null;
  private moved = 0;
  /** pointer over HUD UI → the camera ignores it (HUD canvas stacked on top of the 3D canvas) */
  ignore: ((clientX: number, clientY: number) => boolean) | null = null;
  /** fired on a click that was not a drag (screen px) */
  onClick: ((x: number, y: number) => void) | null = null;
  private off: (() => void)[] = [];

  constructor(
    readonly camera: THREE.PerspectiveCamera,
    readonly dom: HTMLElement,
    start: RigState,
  ) {
    this.cur = { target: start.target.clone(), yaw: start.yaw, pitch: start.pitch, dist: start.dist };
    this.goal = { target: start.target.clone(), yaw: start.yaw, pitch: start.pitch, dist: start.dist };
    const on = <K extends keyof HTMLElementEventMap>(el: HTMLElement | Window, ev: K, fn: (e: HTMLElementEventMap[K]) => void, opt?: AddEventListenerOptions) => {
      el.addEventListener(ev, fn as EventListener, opt);
      this.off.push(() => el.removeEventListener(ev, fn as EventListener));
    };
    on(dom, 'contextmenu', (e) => e.preventDefault());
    on(dom, 'pointerdown', (e) => {
      if (this.ignore?.(e.clientX, e.clientY)) return;
      this.drag = { btn: e.button, x: e.clientX, y: e.clientY };
      this.moved = 0;
      dom.setPointerCapture(e.pointerId);
    });
    on(dom, 'pointermove', (e) => {
      if (!this.drag) return;
      const dx = e.clientX - this.drag.x;
      const dy = e.clientY - this.drag.y;
      this.drag.x = e.clientX;
      this.drag.y = e.clientY;
      this.moved += Math.abs(dx) + Math.abs(dy);
      if (this.moved < 4) return;
      if (this.drag.btn === 0 && !e.shiftKey && !this.lockOrbit) {
        this.goal.yaw -= dx * 0.006;
        this.goal.pitch = THREE.MathUtils.clamp(this.goal.pitch + dy * 0.004, this.limits.minPitch, this.limits.maxPitch);
      } else this.pan(-dx, -dy);
      if (this.moved > 8) this.follow = null;
    });
    on(dom, 'pointerup', (e) => {
      if (this.drag && this.moved < 5 && this.drag.btn === 0) {
        const r = dom.getBoundingClientRect();
        this.onClick?.(e.clientX - r.left, e.clientY - r.top);
      }
      this.drag = null;
    });
    on(
      dom,
      'wheel',
      (e) => {
        if (this.ignore?.(e.clientX, e.clientY)) return;
        e.preventDefault();
        this.goal.dist = THREE.MathUtils.clamp(this.goal.dist * Math.exp(e.deltaY * 0.0012), this.limits.minDist, this.limits.maxDist);
      },
      { passive: false },
    );
    on(window, 'keydown', (e) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      this.keys.add(e.key.toLowerCase());
    });
    on(window, 'keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    on(window, 'blur', () => this.keys.clear());
  }

  private pan(dx: number, dy: number) {
    const k = this.goal.dist * 0.0016;
    const fx = Math.sin(this.goal.yaw);
    const fz = Math.cos(this.goal.yaw);
    // screen right = (fz, 0, -fx); screen up (on the ground) = (-fx, 0, -fz)
    this.goal.target.x += (dx * fz + dy * fx) * k;
    this.goal.target.z += (-dx * fx + dy * fz) * k;
    this.follow = null;
    const b = this.limits.bound;
    this.goal.target.x = THREE.MathUtils.clamp(this.goal.target.x, -b, b);
    this.goal.target.z = THREE.MathUtils.clamp(this.goal.target.z, -b, b + 40);
  }

  focus(target: THREE.Vector3, dist?: number, pitch?: number, yaw?: number) {
    this.goal.target.copy(target);
    if (dist !== undefined) this.goal.dist = dist;
    if (pitch !== undefined) this.goal.pitch = pitch;
    if (yaw !== undefined) this.goal.yaw = yaw;
  }

  /** jump without easing (hides a teleport behind a flash/fade) */
  cut() {
    this.cur.target.copy(this.goal.target);
    this.cur.yaw = this.goal.yaw;
    this.cur.pitch = this.goal.pitch;
    this.cur.dist = this.goal.dist;
  }

  shake(amount: number) {
    if (!this.reducedMotion) this.trauma = Math.min(1, this.trauma + amount);
  }

  update(dt: number, groundAt?: (x: number, z: number) => number) {
    const sp = (this.keys.has('shift') ? 2.2 : 1) * 520 * dt;
    if (this.keys.has('w') || this.keys.has('arrowup')) this.pan(0, -sp);
    if (this.keys.has('s') || this.keys.has('arrowdown')) this.pan(0, sp);
    if (this.keys.has('a') || this.keys.has('arrowleft')) this.pan(-sp, 0);
    if (this.keys.has('d') || this.keys.has('arrowright')) this.pan(sp, 0);
    if (this.keys.has('q') && !this.lockOrbit) this.goal.yaw += dt * 1.2;
    if (this.keys.has('e') && !this.lockOrbit) this.goal.yaw -= dt * 1.2;
    if (this.follow) this.goal.target.copy(this.follow());
    const c = this.cur;
    const g = this.goal;
    const k = this.follow ? 5 : 7;
    c.target.x = damp(c.target.x, g.target.x, k, dt);
    c.target.y = damp(c.target.y, g.target.y, k, dt);
    c.target.z = damp(c.target.z, g.target.z, k, dt);
    c.yaw = damp(c.yaw, g.yaw, 8, dt);
    c.pitch = damp(c.pitch, g.pitch, 8, dt);
    c.dist = damp(c.dist, g.dist, 6, dt);
    const cp = Math.cos(c.pitch);
    const pos = this.camera.position;
    pos.set(c.target.x + Math.sin(c.yaw) * cp * c.dist, c.target.y + Math.sin(c.pitch) * c.dist, c.target.z + Math.cos(c.yaw) * cp * c.dist);
    // never dip under the terrain / sea
    if (groundAt) pos.y = Math.max(pos.y, groundAt(pos.x, pos.z) + 1.2, 0.8);
    this.camera.lookAt(c.target);
    if (this.trauma > 0) {
      const s = this.trauma * this.trauma;
      const t = performance.now() / 1000;
      this.camera.rotation.z += Math.sin(t * 47) * 0.02 * s;
      this.camera.position.x += Math.sin(t * 31) * 0.4 * s;
      this.camera.position.y += Math.sin(t * 39 + 1) * 0.3 * s;
      this.trauma = Math.max(0, this.trauma - dt * 1.6);
    }
  }

  dispose() {
    this.off.forEach((f) => f());
  }
}
