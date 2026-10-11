/**
 * Regressions from the long-session memory hunt (2026-10-10, docs/part-ii/agentes/FUGA.md).
 *
 * 1. Pixi's BigPool kept every big Graphics' render data (each with its own batcher) after the Graphics died, and
 *    those batchers' buffers only ever grow: ≈ +30 MB of ArrayBuffers per isla ↔ carta ↔ regiones ↔ batallas
 *    round. SceneManager.swap now trims the pools after destroying the old scene.
 * 2. Pixi's text system kept a (null) key per string ever shown (`_activeTextures`): now the key is dropped.
 * 3. The chart's handwritten notes slide off the sheets' vertical title strips (MapScene › mapNight).
 */
import { describe, expect, it } from 'vitest';
import { AbstractTextSystem, BatchableGraphics, BigPool, GraphicsContextRenderData } from 'pixi.js';
import { trimPixiPools } from '../src/core/pixiFixes';
import { noteShift, type Rect } from '../src/island/night/mapNight';

type Inner = { _pool: unknown[]; _index: number };

describe('Pixi pools are trimmed between scenes', () => {
  it('frees every pooled render data (and its grown batcher buffers)', () => {
    const pool = BigPool.getPool(GraphicsContextRenderData);
    // what a big Graphics leaves in the pool when it dies: render data whose batcher grew to fit its geometry
    // (a stand-in batcher: the real one needs a WebGL-capable document to build its shader)
    let freed = 0;
    const datas = Array.from({ length: 5 }, () => {
      const d = Object.create(GraphicsContextRenderData.prototype) as GraphicsContextRenderData;
      Object.assign(d, { batcher: { attributeBuffer: { size: 800_000 }, destroy: () => freed++ }, instructions: { destroy: () => {} } });
      return d;
    });
    for (const d of datas) BigPool.return(d);
    expect(pool.totalFree).toBeGreaterThanOrEqual(5);
    const out = trimPixiPools();
    expect(out.renderData).toBeGreaterThanOrEqual(5);
    expect(freed).toBe(5);
    expect(pool.totalFree).toBe(0);
    expect((pool as unknown as Inner)._pool.length).toBe(0);
    for (const d of datas) expect(d.batcher).toBeNull();
    // a second trim is a no-op
    expect(trimPixiPools().renderData).toBe(0);
  });

  it('keeps a bounded number of free BatchableGraphics', () => {
    const pool = BigPool.getPool(BatchableGraphics);
    const items = Array.from({ length: 5000 }, () => BigPool.get(BatchableGraphics));
    for (const b of items) BigPool.return(b);
    expect(pool.totalFree).toBeGreaterThanOrEqual(5000);
    trimPixiPools();
    expect(pool.totalFree).toBe(4096);
    expect((pool as unknown as Inner)._pool.length).toBe(4096);
    // a second trim is a no-op
    expect(trimPixiPools().batchables).toBe(0);
  });
});

describe('text texture keys do not pile up', () => {
  it('drops the key when the last Text using a string lets go', () => {
    const sys = Object.create(AbstractTextSystem.prototype) as AbstractTextSystem;
    const returned: unknown[] = [];
    const keys: Record<string, { texture: unknown; usageCount: number } | null> = { '02:31|style': { texture: 'a', usageCount: 2 } };
    Object.assign(sys, { _activeTextures: keys, returnTexture: (t: unknown) => returned.push(t) });
    sys.decreaseReferenceCount('02:31|style');
    expect(keys['02:31|style']?.usageCount).toBe(1); // still in use: kept
    sys.decreaseReferenceCount('02:31|style');
    expect(returned).toEqual(['a']);
    expect('02:31|style' in keys).toBe(false);
    // an unknown key is a no-op
    sys.decreaseReferenceCount('nope');
    expect(Object.keys(keys)).toEqual([]);
  });
});

describe('chart notes keep off the vertical title strips and island names', () => {
  const strip: Rect = { x0: 900, x1: 930, y0: 300, y1: 800 };
  const free = (x: number, y: number, hw: number, hh: number, r: Rect) => x + hw <= r.x0 || x - hw >= r.x1 || y + hh <= r.y0 || y - hh >= r.y1;
  it('does not move a note that touches nothing', () => {
    expect(noteShift(200, 900, 100, 20, [strip], 0, 1920)).toEqual({ dx: 0, dy: 0 });
    // same column, but well below the strip
    expect(noteShift(915, 900, 100, 20, [strip], 0, 1920)).toEqual({ dx: 0, dy: 0 });
  });
  it('slides a note sideways off a strip, to the nearest side', () => {
    const r = noteShift(940, 600, 100, 20, [strip], 0, 1920);
    expect(r.dy).toBe(0);
    expect(r.dx).toBeGreaterThan(0);
    expect(940 + r.dx - 100).toBeGreaterThanOrEqual(930);
    const l = noteShift(890, 600, 100, 20, [strip], 0, 1920);
    expect(l.dx).toBeLessThan(0);
    expect(890 + l.dx + 100).toBeLessThanOrEqual(900);
  });
  it('goes the other way when the nearest side would leave the screen', () => {
    const edge: Rect = { x0: 120, x1: 150, y0: 0, y1: 1080 };
    expect(noteShift(130, 500, 100, 20, [edge], 0, 1920).dx).toBeGreaterThan(0);
  });
  it('clears two neighbouring strips at once', () => {
    const b: Rect = { x0: 1060, x1: 1090, y0: 300, y1: 800 };
    const r = noteShift(1000, 600, 100, 20, [strip, b], 0, 1920);
    for (const s of [strip, b]) expect(free(1000 + r.dx, 600 + r.dy, 100, 20, s)).toBe(true);
  });
  it('steps up or down off a wide island name instead of crossing the chart', () => {
    const ribbon: Rect = { x0: 100, x1: 500, y0: 700, y1: 730 };
    const r = noteShift(200, 740, 90, 20, [ribbon], 0, 1920, 0, 1080);
    expect(r.dx).toBe(0);
    expect(free(200, 740 + r.dy, 90, 20, ribbon)).toBe(true);
    expect(Math.abs(r.dy)).toBeLessThan(100);
  });
});
