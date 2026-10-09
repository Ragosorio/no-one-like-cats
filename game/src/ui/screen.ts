/**
 * Full-screen layers that cover the REAL screen, not just the 1920×1080 design box.
 *
 * `game.view` is the whole visible screen in logical coordinates (bigger than the box on 16:10,
 * 4:3 or ultra-wide). Anything that dims, flashes or blocks "the whole screen" must use these
 * helpers; a `rect(0, 0, W, H)` leaves bands of un-dimmed world above/below (or beside) it.
 */
import { Container, FillInput, Graphics } from 'pixi.js';
import { game, H, ViewRect, W } from '../core/App';

/** Calls `fn(view)` now and on every resize until `owner` is destroyed. */
export function followView(owner: Container, fn: (v: ViewRect) => void) {
  fn(game.view);
  const off = game.onView((v) => {
    if (!owner.destroyed) fn(v);
  });
  owner.once('destroyed', () => off());
}

/** A rect that always covers the whole visible screen (repaints itself on resize). */
export function screenRect(fill: FillInput): Graphics {
  const g = new Graphics();
  followView(g, (v) => g.clear().rect(v.x, v.y, v.w, v.h).fill(fill));
  return g;
}

/** Re-fill an existing Graphics with a full-screen rect (for flashes that change color). */
export function paintScreen(g: Graphics, fill: FillInput) {
  const v = game.view;
  return g.clear().rect(v.x, v.y, v.w, v.h).fill(fill);
}

/**
 * Offset that pins box-designed content to the real screen edge: add `bottomDY()` to a y laid
 * out against H (the box bottom) to sit on the screen bottom instead; `topDY()` for the top.
 */
export const topDY = () => game.view.y;
export const bottomDY = () => game.view.y + game.view.h - H;
export const leftDX = () => game.view.x;
export const rightDX = () => game.view.x + game.view.w - W;
