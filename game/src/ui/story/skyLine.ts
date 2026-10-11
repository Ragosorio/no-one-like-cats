/**
 * The archipelago's top edge, so the story's sky props (ui/story/o2Sky.ts, o3Sky.ts) sit in the sky ABOVE the islands
 * instead of over the far ones on a big archipelago (PULIDO, 2026-10-10).
 *
 * World space (the island's iso plane): per column of 128 px, the highest point the islands reach — the tile tops
 * plus room for what stands on them (trees, buildings, cliffs drawn upward). Built once per island scene from the plan
 * the scene already has (found like the camera bounds, without touching IslandScene).
 */
import type { Container } from 'pixi.js';
import { isoToScreen, TH, TW } from '../../island/iso';

const COL = 128;
/** what stands above a tile's center: its own top face + the tallest buildings and trees */
const ROOM = TH / 2 + 190;

export class SkyLine {
  private top = new Map<number, number>();
  /** highest point of the whole archipelago (world y) */
  readonly minY: number;
  private constructor(tiles: Iterable<{ gx: number; gy: number }>) {
    let minY = Infinity;
    for (const t of tiles) {
      const p = isoToScreen(t.gx, t.gy);
      const y = p.y - ROOM;
      minY = Math.min(minY, y);
      for (let c = Math.floor((p.x - TW / 2) / COL); c <= Math.floor((p.x + TW / 2) / COL); c++) this.top.set(c, Math.min(this.top.get(c) ?? Infinity, y));
    }
    this.minY = minY;
  }
  /** the island scene's skyline (null outside an island scene) */
  static of(scene: Container): SkyLine | null {
    const plan = (scene as unknown as { plan?: { tiles?: Map<string, { gx: number; gy: number }> } }).plan;
    if (!plan?.tiles?.size) return null;
    return new SkyLine(plan.tiles.values());
  }
  /** world y of the islands' top over [x0, x1] (Infinity = open sea all the way down) */
  topOver(x0: number, x1: number): number {
    let y = Infinity;
    for (let c = Math.floor(Math.min(x0, x1) / COL); c <= Math.floor(Math.max(x0, x1) / COL); c++) y = Math.min(y, this.top.get(c) ?? Infinity);
    return y;
  }
  /**
   * the y a prop whose lowest point hangs `below` under its anchor must take so it clears the islands over
   * [x0, x1] by `gap` (never lower than it already is: props only ever move UP)
   */
  clear(y: number, x0: number, x1: number, below: number, gap = 40): number {
    const top = this.topOver(x0, x1);
    return Number.isFinite(top) ? Math.min(y, top - gap - below) : y;
  }
  /**
   * the same for a SCREEN-space piece (ui/story/o3Sky.ts): the world draws at screen = o + world · s. A piece at
   * (x, y) spanning ±`half` and hanging `below` under its anchor gets the y that keeps it `gap` px above the islands
   * under it on screen (never lower than asked; open sea = unchanged)
   */
  clearOnScreen(x: number, y: number, half: number, below: number, o: { x: number; y: number }, s: number, gap = 24): number {
    if (!(s > 0)) return y;
    const top = this.topOver((x - half - o.x) / s, (x + half - o.x) / s);
    return Number.isFinite(top) ? Math.min(y, o.y + top * s - gap - below) : y;
  }
  /** a skyline from bare tiles (tests, tools) */
  static fromTiles(tiles: Iterable<{ gx: number; gy: number }>): SkyLine {
    return new SkyLine(tiles);
  }
}
