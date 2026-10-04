/**
 * Safety net: Pixi v8 nulls a container's transform on destroy(), so any GSAP tween that touches
 * x/y of a destroyed object throws inside GSAP's ticker — and one throwing tween freezes ALL tweens
 * (scene transitions included). These accessors make late writes/reads on destroyed objects no-ops.
 * Imported by the island scene and the HUD (recommend importing once from main.ts too).
 */
import { Container } from 'pixi.js';

type Pos = { _position: { x: number; y: number } | null };
const proto = Container.prototype as unknown as Record<string, unknown>;
if (!(proto as { __safeXY?: boolean }).__safeXY) {
  Object.defineProperty(proto, 'x', {
    configurable: true,
    get(this: Pos) {
      return this._position ? this._position.x : 0;
    },
    set(this: Pos, v: number) {
      if (this._position) this._position.x = v;
    },
  });
  Object.defineProperty(proto, 'y', {
    configurable: true,
    get(this: Pos) {
      return this._position ? this._position.y : 0;
    },
    set(this: Pos, v: number) {
      if (this._position) this._position.y = v;
    },
  });
  (proto as { __safeXY?: boolean }).__safeXY = true;
}
export {};
