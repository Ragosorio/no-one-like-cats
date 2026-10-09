/**
 * Pixi v8 footguns, fixed once for the whole game (imported first thing in main.ts).
 *
 * Graphics.destroy(options): Pixi only destroys the Graphics' OWN context when destroy() is called
 * with NO arguments. `destroy({ children: true })` — how every scene, panel and sequence here tears
 * down its tree — left each Graphics' context, its batches and its GPU buffers alive. Measured
 * 2026-10-08: +~1 000 GraphicsContexts and ~67 MB of heap that never came back per island → battle →
 * island round (heap 124 → 326 MB after three battles). Contexts passed in from outside
 * (`new Graphics(sharedCtx)`) are not owned and are left alone, as before.
 */
import { Graphics } from 'pixi.js';

type Owned = { _ownedContext?: { destroyed?: boolean; destroy: () => void } | null };
const destroy = Graphics.prototype.destroy;
Graphics.prototype.destroy = function (this: Graphics, options?: Parameters<typeof destroy>[0]) {
  const owned = (this as unknown as Owned)._ownedContext;
  destroy.call(this, options);
  if (owned && !owned.destroyed && options && options !== true && (options as { context?: boolean }).context !== true) owned.destroy();
};
