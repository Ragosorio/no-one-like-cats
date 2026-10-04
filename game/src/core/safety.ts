/**
 * Global safety: kill GSAP tweens that target a Pixi container (or its transform points) when it is
 * destroyed. A tween left alive on a destroyed object throws every tick and freezes ALL animations.
 */
import { Container } from 'pixi.js';
import gsap from 'gsap';

type Internals = { _scale?: object | null; _position?: object | null; _pivot?: object | null; _skew?: object | null };
const proto = Container.prototype as Container & { __safeDestroy?: boolean };
if (!proto.__safeDestroy) {
  const orig = proto.destroy;
  proto.destroy = function (this: Container & Internals, options?: Parameters<Container['destroy']>[0]) {
    if (!this.destroyed) {
      gsap.killTweensOf(this);
      if (this._scale) gsap.killTweensOf(this._scale);
      if (this._position) gsap.killTweensOf(this._position);
      if (this._pivot) gsap.killTweensOf(this._pivot);
      if (this._skew) gsap.killTweensOf(this._skew);
    }
    return orig.call(this, options);
  } as Container['destroy'];
  proto.__safeDestroy = true;
}
export {};
