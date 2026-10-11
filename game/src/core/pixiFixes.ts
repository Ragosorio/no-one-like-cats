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
import { AbstractTextSystem, BatchableGraphics, BigPool, Graphics, GraphicsContextRenderData } from 'pixi.js';

type Owned = { _ownedContext?: { destroyed?: boolean; destroy: () => void } | null };
const destroy = Graphics.prototype.destroy;
Graphics.prototype.destroy = function (this: Graphics, options?: Parameters<typeof destroy>[0]) {
  const owned = (this as unknown as Owned)._ownedContext;
  destroy.call(this, options);
  if (owned && !owned.destroyed && options && options !== true && (options as { context?: boolean }).context !== true) owned.destroy();
};

/**
 * Pixi's object pools, trimmed between scenes (core/scenes.ts › swap calls this after destroying the old scene).
 *
 * Every Graphics too big to batch (> 400 vertices: terrain, foam, bubbles, decor…) borrows a
 * `GraphicsContextRenderData` from `BigPool`, and each one owns a whole batcher. When the Graphics dies the
 * render data goes back to the pool WITH its buffers, those buffers only ever grow, and the next scene gets them
 * back in random order — so every slot slowly ratchets up to the biggest geometry it ever served. Measured
 * 2026-10-10 (FUGA): ~460 slots after the island, their ArrayBuffers 128 → 161 → 194 → 212 MB over four rounds of
 * isla ↔ carta ↔ regiones ↔ batallas (≈ +30 MB per round, never returned). The pool only helps within a scene
 * (a Graphics redrawn every frame gets its slot back), so between scenes the free slots are destroyed (batcher,
 * GPU buffers and all) and the next scene starts from small batchers that grow only to its own needs.
 * `BatchableGraphics` are tiny but the pool keeps the peak forever (~15 000 after the island): keep a few thousand.
 */
type PoolLike = { _pool: ({ destroy?: () => void } | undefined)[]; _index: number; _count: number };
function trimPool(pool: PoolLike, keep: number, destroyFree: boolean): number {
  const free = pool._index;
  // slots past _index only hold stale references to items in use: drop them as well
  if (free <= keep) {
    pool._pool.length = free;
    return 0;
  }
  for (let i = keep; i < free; i++) if (destroyFree) pool._pool[i]?.destroy?.();
  pool._pool.length = keep;
  pool._index = keep;
  pool._count -= free - keep;
  return free - keep;
}
export function trimPixiPools(): { renderData: number; batchables: number } {
  return {
    renderData: trimPool(BigPool.getPool(GraphicsContextRenderData) as unknown as PoolLike, 0, true),
    batchables: trimPool(BigPool.getPool(BatchableGraphics) as unknown as PoolLike, 4096, false),
  };
}

/**
 * Text textures are shared by key (`text.styleKey` = the string itself + its style + resolution). When the last
 * Text using a key lets go, Pixi returns the texture but leaves the key in `_activeTextures` set to null, so every
 * string ever shown stays there: each tick of a countdown («02:31», «02:30»…), each toast, each name. Measured
 * 2026-10-10 (FUGA): ~1 700 dead keys per isla ↔ carta ↔ regiones ↔ batallas round, growing with play time even
 * without changing scenes. Drop the key instead.
 */
type TextKeys = { _activeTextures: Record<string, unknown> | null };
const decrease = AbstractTextSystem.prototype.decreaseReferenceCount;
AbstractTextSystem.prototype.decreaseReferenceCount = function (this: AbstractTextSystem, textKey: string) {
  decrease.call(this, textKey);
  const map = (this as unknown as TextKeys)._activeTextures;
  if (map && map[textKey] === null) delete map[textKey];
};
