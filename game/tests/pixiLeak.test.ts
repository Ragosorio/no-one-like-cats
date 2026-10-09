/**
 * Regression (2026-10-08): Pixi v8 only destroys a Graphics' own context on a bare destroy();
 * destroy({ children: true }) leaked every context + its GPU batches (~67 MB per battle round).
 */
import { describe, expect, it } from 'vitest';
import { Container, Graphics, GraphicsContext } from 'pixi.js';
import '../src/core/pixiFixes';

describe('Graphics contexts are freed with the tree', () => {
  it('destroy({ children: true }) destroys owned contexts of the whole tree', () => {
    const root = new Container();
    const a = new Graphics().rect(0, 0, 10, 10).fill(0xff0000);
    const b = new Graphics().circle(0, 0, 5).fill(0x00ff00);
    root.addChild(a);
    a.addChild(b);
    const ca = a.context;
    const cb = b.context;
    root.destroy({ children: true });
    expect(ca.destroyed).toBe(true);
    expect(cb.destroyed).toBe(true);
  });
  it('a shared context passed in from outside survives', () => {
    const shared = new GraphicsContext().rect(0, 0, 4, 4).fill(0x0000ff);
    const g = new Graphics(shared);
    g.destroy({ children: true });
    expect(shared.destroyed).toBe(false);
  });
});
