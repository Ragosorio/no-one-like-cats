import { Container, FederatedPointerEvent, FederatedWheelEvent } from 'pixi.js';
import gsap from 'gsap';
import { W, H } from '../core/App';

/**
 * Drag-to-pan + wheel-zoom camera over a world container.
 * Distinguishes a click from a drag so buildings still receive taps.
 */
export class IslandCamera {
  zoom = 0.85;
  minZoom = 0.45;
  maxZoom = 1.4;
  private dragging = false;
  private moved = 0;
  private last = { x: 0, y: 0 };
  bounds = { minX: -2400, maxX: 2400, minY: -400, maxY: 2800 };
  /** true while the last pointer gesture was a drag (to cancel taps) */
  wasDrag = false;

  constructor(public world: Container, public input: Container) {
    input.eventMode = 'static';
    input.on('pointerdown', this.down, this);
    input.on('globalpointermove', this.move, this);
    input.on('pointerup', this.up, this);
    input.on('pointerupoutside', this.up, this);
    input.on('wheel', this.wheel, this);
    this.apply();
  }

  /** world point to center the screen on */
  center = { x: 0, y: 900 };

  apply() {
    this.world.scale.set(this.zoom);
    this.world.position.set(W / 2 - this.center.x * this.zoom, H / 2 - this.center.y * this.zoom);
  }

  lookAt(x: number, y: number, animate = true, zoom?: number) {
    const target = { x, y, z: zoom ?? this.zoom };
    if (!animate) {
      this.center = { x, y };
      this.zoom = target.z;
      this.apply();
      return;
    }
    const obj = { x: this.center.x, y: this.center.y, z: this.zoom };
    gsap.to(obj, {
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
    this.dragging = true;
    this.moved = 0;
    this.wasDrag = false;
    this.last = { x: e.global.x, y: e.global.y };
  }
  private move(e: FederatedPointerEvent) {
    if (!this.dragging) return;
    const dx = e.global.x - this.last.x;
    const dy = e.global.y - this.last.y;
    this.last = { x: e.global.x, y: e.global.y };
    this.moved += Math.abs(dx) + Math.abs(dy);
    if (this.moved > 8) this.wasDrag = true;
    const s = this.world.parent ? this.world.parent.worldTransform.a : 1;
    this.center.x -= dx / s / this.zoom;
    this.center.y -= dy / s / this.zoom;
    this.clamp();
    this.apply();
  }
  private up() {
    this.dragging = false;
  }
  private wheel(e: FederatedWheelEvent) {
    const f = Math.exp(-e.deltaY * 0.0015);
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * f));
    this.apply();
  }
  private clamp() {
    const b = this.bounds;
    this.center.x = Math.max(b.minX, Math.min(b.maxX, this.center.x));
    this.center.y = Math.max(b.minY, Math.min(b.maxY, this.center.y));
  }
}
