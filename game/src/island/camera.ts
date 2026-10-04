import { Container, FederatedPointerEvent, FederatedWheelEvent, Ticker } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../core/App';

/**
 * Drag-to-pan (with a little inertia) + wheel-zoom toward the cursor over a world container.
 * Distinguishes a click from a drag so buildings still receive taps (check `wasDrag`).
 */
export class IslandCamera {
  zoom = 0.85;
  minZoom = 0.42;
  maxZoom = 1.35;
  private dragging = false;
  private moved = 0;
  private last = { x: 0, y: 0 };
  private vel = { x: 0, y: 0 };
  private lastMoveT = 0;
  bounds = { minX: -2400, maxX: 2400, minY: -400, maxY: 2800 };
  /** true while the last pointer gesture was a drag (to cancel taps) */
  wasDrag = false;
  onChange?: () => void;
  private tween?: gsap.core.Tween;

  constructor(
    public world: Container,
    public input: Container,
  ) {
    input.eventMode = 'static';
    input.on('pointerdown', this.down, this);
    input.on('globalpointermove', this.move, this);
    input.on('pointerup', this.up, this);
    input.on('pointerupoutside', this.up, this);
    input.on('wheel', this.wheel, this);
    Ticker.shared.add(this.tick, this);
    this.apply();
  }

  /** world point to center the screen on */
  center = { x: 0, y: 900 };

  apply() {
    this.world.scale.set(this.zoom);
    this.world.position.set(W / 2 - this.center.x * this.zoom, H / 2 - this.center.y * this.zoom);
    this.onChange?.();
  }

  lookAt(x: number, y: number, animate = true, zoom?: number) {
    const target = { x, y, z: zoom ?? this.zoom };
    this.tween?.kill();
    this.vel = { x: 0, y: 0 };
    if (!animate) {
      this.center = { x, y };
      this.zoom = target.z;
      this.clamp();
      this.apply();
      return;
    }
    const obj = { x: this.center.x, y: this.center.y, z: this.zoom };
    this.tween = gsap.to(obj, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration: 0.7,
      ease: 'power3.inOut',
      onUpdate: () => {
        this.center = { x: obj.x, y: obj.y };
        this.zoom = obj.z;
        this.apply();
      },
    });
  }

  private down(e: FederatedPointerEvent) {
    if (e.button === 2) return;
    this.tween?.kill();
    this.dragging = true;
    this.moved = 0;
    this.wasDrag = false;
    this.vel = { x: 0, y: 0 };
    this.last = { x: e.global.x, y: e.global.y };
    this.lastMoveT = performance.now();
  }
  private move(e: FederatedPointerEvent) {
    if (!this.dragging) return;
    const dx = e.global.x - this.last.x;
    const dy = e.global.y - this.last.y;
    this.last = { x: e.global.x, y: e.global.y };
    this.moved += Math.abs(dx) + Math.abs(dy);
    if (this.moved > 10) this.wasDrag = true;
    const s = this.world.parent ? this.world.parent.worldTransform.a : 1;
    const wx = dx / s / this.zoom;
    const wy = dy / s / this.zoom;
    this.center.x -= wx;
    this.center.y -= wy;
    const now = performance.now();
    const dt = Math.max(1, now - this.lastMoveT) / 1000;
    this.lastMoveT = now;
    this.vel = { x: (wx / dt) * 0.6 + this.vel.x * 0.4, y: (wy / dt) * 0.6 + this.vel.y * 0.4 };
    this.clamp();
    this.apply();
  }
  private up() {
    if (performance.now() - this.lastMoveT > 90) this.vel = { x: 0, y: 0 };
    this.dragging = false;
  }
  private tick(t: Ticker) {
    if (this.dragging) return;
    const sp = Math.abs(this.vel.x) + Math.abs(this.vel.y);
    if (sp < 4) return;
    const dt = Math.min(0.05, t.deltaMS / 1000);
    this.center.x -= this.vel.x * dt;
    this.center.y -= this.vel.y * dt;
    const k = Math.pow(0.04, dt);
    this.vel.x *= k;
    this.vel.y *= k;
    this.clamp();
    this.apply();
  }
  private wheel(e: FederatedWheelEvent) {
    const f = Math.exp(-e.deltaY * 0.0015);
    const nz = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * f));
    // keep the world point under the cursor fixed
    const s = this.world.parent ? this.world.parent.worldTransform.a : 1;
    const px = (e.global.x - (this.world.parent?.worldTransform.tx ?? 0)) / s;
    const py = (e.global.y - (this.world.parent?.worldTransform.ty ?? 0)) / s;
    const wx = (px - this.world.x) / this.zoom;
    const wy = (py - this.world.y) / this.zoom;
    this.zoom = nz;
    this.center.x = wx - (px - W / 2) / nz;
    this.center.y = wy - (py - H / 2) / nz;
    this.clamp();
    this.apply();
  }
  private clamp() {
    const b = this.bounds;
    this.center.x = Math.max(b.minX, Math.min(b.maxX, this.center.x));
    this.center.y = Math.max(b.minY, Math.min(b.maxY, this.center.y));
  }
  destroy() {
    Ticker.shared.remove(this.tick, this);
    this.tween?.kill();
    this.input.off('pointerdown', this.down, this);
    this.input.off('globalpointermove', this.move, this);
    this.input.off('pointerup', this.up, this);
    this.input.off('pointerupoutside', this.up, this);
    this.input.off('wheel', this.wheel, this);
  }
}
