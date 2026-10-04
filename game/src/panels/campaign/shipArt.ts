/**
 * Ship previews for the campaign screens. Uses the anime renderer (read-only) and falls back to a
 * flat ink drawing from the grid if anything goes wrong.
 */
import { Container, Graphics, Ticker } from 'pixi.js';
import { AnimeShipView } from '../../battle/anime';
import type { ShipStyleId } from '../../battle/anime';
import { CELL, ShipBlueprint, ShipModel } from '../../battle/ship';
import { SilhouetteFilter } from '../../fx/filters';
import { C } from '../../ui/theme';

export interface ShipPreview extends Container {
  /** logical hull size in px (before scaling) */
  hullW: number;
  hullH: number;
  /** scale applied to the ship view and its offset inside the preview */
  k: number;
  ox: number;
  oy: number;
}

/**
 * A bobbing ship preview fitted inside (maxW × maxH). Origin = top-left of the hull grid.
 * `silhouette` paints it solid ink (enemy "silueta").
 */
export function shipPreview(bp: ShipBlueprint, o: { maxW: number; maxH: number; flip?: boolean; style?: ShipStyleId; silhouette?: number; animate?: boolean }): ShipPreview {
  const root = new Container() as ShipPreview;
  const hullW = bp.cols * CELL;
  const hullH = bp.rows * CELL;
  root.hullW = hullW;
  root.hullH = hullH;
  // sails/flags overflow the grid upward a bit: leave headroom
  const s = Math.min(o.maxW / (hullW + 60), o.maxH / (hullH + 90));
  let view: Container;
  try {
    const model = new ShipModel(bp, 1);
    const v = new AnimeShipView(model, !!o.flip, o.style ?? 'pirate', { waterLocalY: hullH - 70 });
    view = v;
    if (o.animate !== false) {
      const tick = (t: Ticker) => {
        if (v.destroyed) return Ticker.shared.remove(tick);
        v.bob(Math.min(0.05, t.deltaMS / 1000));
      };
      Ticker.shared.add(tick);
      root.on('destroyed', () => Ticker.shared.remove(tick));
    }
  } catch (e) {
    console.warn('[shipArt] anime ship failed, using flat drawing', e);
    view = flatShip(bp, !!o.flip);
  }
  if (o.silhouette !== undefined) view.filters = [new SilhouetteFilter(o.silhouette, 1)];
  view.scale.set(s);
  view.position.set(30 * s, 70 * s);
  root.k = s;
  root.ox = 30 * s;
  root.oy = 70 * s;
  root.addChild(view);
  return root;
}

/** flat fallback: cells as ink blocks */
export function flatShip(bp: ShipBlueprint, flip = false): Container {
  const g = new Graphics();
  for (let y = 0; y < bp.rows; y++)
    for (let x = 0; x < bp.cols; x++) {
      const ch = bp.hull[y]?.[x] ?? '.';
      if (ch === '.') continue;
      const gx = flip ? bp.cols - 1 - x : x;
      g.rect(gx * CELL, y * CELL, CELL, CELL);
    }
  for (const m of bp.modules) {
    const gx = flip ? bp.cols - m.x - m.w : m.x;
    g.rect(gx * CELL, m.y * CELL, m.w * CELL, m.h * CELL);
  }
  g.fill(0x8a5a2e).stroke({ width: 3, color: C.ink });
  return g;
}
