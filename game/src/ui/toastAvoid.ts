/**
 * TOASTS NEVER COVER WHAT YOU ARE READING (hotfix 2026-10-10, owner's reports: «Calidad 3D» over a page's caption,
 * five «NUEVA VERSIÓN» toasts over ELEGIR TRIPULACIÓN). Things a toast must not sit on register themselves here: an
 * open panel's body (ui/modal Modal), the dialog's speech box and caption card (ui/dialog). ui/modal toast() asks for
 * their rectangles and puts the banner in a free band of the screen (or waits a little when there is none).
 * Pure bookkeeping: a WeakRef-free Set pruned on read (destroyed / hidden containers are skipped and dropped).
 */
import type { Container } from 'pixi.js';

const avoid = new Set<Container>();

/** this container (while on screen) is never covered by a toast */
export function markToastAvoid(c: Container) {
  avoid.add(c);
}

function onScreen(c: Container): boolean {
  let o: Container | null = c;
  while (o) {
    if (o.destroyed || !o.visible || !o.renderable || o.alpha <= 0.02) return false;
    o = o.parent;
  }
  // detached from the stage: not on screen
  return true;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** the rectangles to avoid, in `space`'s local coordinates (the toast layer) */
export function toastAvoidRects(space: Container): Box[] {
  const out: Box[] = [];
  for (const c of [...avoid]) {
    if (c.destroyed) {
      avoid.delete(c);
      continue;
    }
    if (!c.parent || !onScreen(c)) continue;
    const b = c.getBounds();
    if (!(b.width > 0 && b.height > 0)) continue;
    const a = space.toLocal({ x: b.x, y: b.y });
    const z = space.toLocal({ x: b.x + b.width, y: b.y + b.height });
    out.push({ x: Math.min(a.x, z.x), y: Math.min(a.y, z.y), w: Math.abs(z.x - a.x), h: Math.abs(z.y - a.y) });
  }
  return out;
}

export const overlaps = (a: Box, b: Box, pad = 8) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;

/**
 * Where a w×h banner centred at x = cx can go, given the obstacles: the preferred y if free, else the first free y
 * scanning down then up inside [top, bottom], else null (no free band: the caller waits or shrinks).
 */
export function freeY(cx: number, w: number, h: number, prefer: number, rects: Box[], top: number, bottom: number): number | null {
  const free = (y: number) => !rects.some((r) => overlaps({ x: cx - w / 2, y, w, h }, r));
  if (free(prefer)) return prefer;
  for (let y = prefer; y + h <= bottom; y += 12) if (free(y)) return y;
  for (let y = prefer; y >= top; y -= 12) if (free(y)) return y;
  return null;
}
