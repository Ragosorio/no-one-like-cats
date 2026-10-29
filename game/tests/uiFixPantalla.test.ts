/**
 * UI-FIX (2026-10-29, the owner: «haz que los muelles se muestren bien y no así de chiquitos» · «las revelaciones no
 * ocupan toda la pantalla y deberían poder hacerlo»).
 * 1) The Muelle de Pesca grid (panels/island/DockPanel.ts → dockGrid): the cards fill the panel's width, one whole row
 *    always fits (the rest scrolls), and they never shrink to the old half size on a big screen.
 * 2) The reveal's full-screen paint (fx/sequences/multiverse/kit.ts): cover() and viewIn() follow the REAL screen
 *    (game.view) on any aspect, not the 1920×1080 box.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { Container } from 'pixi.js';

const { dockGrid } = await import('../src/panels/island/DockPanel');
const { game, W, H } = await import('../src/core/App');
const { cover, viewIn } = await import('../src/fx/sequences/multiverse/kit');

const CARD_W = 330;
const CARD_H = 506;
const GAP = 22;

describe('Muelle de Pesca: the dock grid uses the panel', () => {
  // [docks, usable width, usable height, real px per unit] — the panel's inner area on each screen (openDock's math)
  const screens: [string, number, number, number][] = [
    ['2000×1300', 1788, 996, 1.04],
    ['1600×900', 1788, 836, 0.83],
    ['1280×720', 1788, 836, 0.67],
    ['phone 844×390', 1545, 542, 0.5],
  ];
  for (const [name, aw, ah, eff] of screens) {
    for (const n of [2, 4, 13, 20]) {
      it(`${name}, ${n} docks: fills the width, one row fits, readable`, () => {
        const g = dockGrid(n, aw, ah, eff);
        const gridW = g.cols * CARD_W * g.s + (g.cols - 1) * GAP;
        expect(g.cols).toBeGreaterThanOrEqual(1);
        expect(g.cols).toBeLessThanOrEqual(n);
        expect(gridW).toBeLessThanOrEqual(aw + 0.5);
        expect(CARD_H * g.s + 8).toBeLessThanOrEqual(ah);
        expect(g.rows).toBe(Math.ceil(n / g.cols));
        expect(g.s).toBeLessThanOrEqual(1.5);
        // many docks on a desktop screen: a full row of cards, at a real size (the old grid shrank them to ~0.48)
        if (n >= 13 && eff >= 0.6) {
          expect(gridW).toBeGreaterThan(aw * 0.8);
          expect(g.s).toBeGreaterThan(0.8);
        }
      });
    }
  }
  it('a smaller window gets bigger cards (fewer columns), not tinier text', () => {
    const big = dockGrid(14, 1788, 996, 1.04);
    const small = dockGrid(14, 1788, 836, 0.67);
    expect(small.s).toBeGreaterThan(big.s);
    expect(small.cols).toBeLessThan(big.cols);
  });
});

describe('reveals: full-screen paint follows the real screen', () => {
  const v0 = { ...game.view };
  afterEach(() => {
    game.view = { ...v0 };
  });
  const aspects: [string, number, number][] = [
    ['16:9', 1920, 1080],
    ['3:2', 1920, 1280],
    ['4:3', 1920, 1440],
    ['21:9', 2520, 1080],
    ['phone', 2337, 1080],
  ];
  for (const [name, vw, vh] of aspects) {
    it(`${name}: cover() paints past every edge of the screen; viewIn() is the screen`, () => {
      game.view = { x: (W - vw) / 2, y: (H - vh) / 2, w: vw, h: vh };
      const g = cover(0x000000);
      const b = g.getLocalBounds();
      expect(b.minX).toBeLessThan(game.view.x);
      expect(b.minY).toBeLessThan(game.view.y);
      expect(b.maxX).toBeGreaterThan(game.view.x + vw);
      expect(b.maxY).toBeGreaterThan(game.view.y + vh);
      g.destroy();
      const root = new Container();
      const fg = new Container();
      root.addChild(fg);
      game.root.addChild(root);
      const r = viewIn({ fg, root } as never, fg);
      expect(r.x).toBeCloseTo(game.view.x, 3);
      expect(r.y).toBeCloseTo(game.view.y, 3);
      expect(r.w).toBeCloseTo(vw, 3);
      expect(r.h).toBeCloseTo(vh, 3);
      root.destroy({ children: true });
    });
  }
});
