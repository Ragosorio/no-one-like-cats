/**
 * Where Maneki sweeps on YOUR island (ui/story/o3Sky.ts, H54): a free tile near her old spot (home + (150, 96)) that
 * nothing stands on and nothing tall stands IN FRONT of, so she reads at a glance on a big archipelago too (until
 * 2026-10-10 she stood behind the Puerto on `rupturas-o4` and her scene drew her over it). MENORES 2026-10-10.
 *
 * Pure (no Pixi, no G): o3Sky feeds it the island's land and what's built on it (island/placement.ts).
 *
 * «In front» on the iso grid: a tile T is drawn over by any tile B with a bigger depth (gx + gy) in the same or a
 * neighbouring screen column (gx − gy): a building on B rises up over T. `reach` = how many depth rows in front must
 * be free (buildings are up to ~3 tiles tall: 5 rows; small decor and trees: 2).
 */
export type Tile = { gx: number; gy: number };

export interface ManekiArea {
  /** a tile she may stand on (land you own) */
  land(gx: number, gy: number): boolean;
  /** something built there (buildings, habitats, shop decor) */
  built(gx: number, gy: number): boolean;
  /** natural decor there (trees, rocks): avoided when possible, never required */
  decor?(gx: number, gy: number): boolean;
}

/**
 * T is clear: land, nothing on it, and nothing tall in the `reach` rows in front of it. `behind` > 0: nor a building
 * right behind it in its own column (the building's name plate hangs at its front and would cover her head)
 */
export function clearTile(t: Tile, a: ManekiArea, reach: number, avoidDecor: boolean, behind = 0): boolean {
  if (!a.land(t.gx, t.gy) || a.built(t.gx, t.gy)) return false;
  if (avoidDecor && a.decor?.(t.gx, t.gy)) return false;
  const s = t.gx + t.gy;
  const c = t.gx - t.gy;
  for (let dd = 1; dd <= reach; dd++)
    for (let dc = -1; dc <= 1; dc++) {
      const S = s + dd;
      const Cc = c + dc;
      if ((S + Cc) % 2 !== 0) continue;
      const gx = (S + Cc) / 2;
      const gy = (S - Cc) / 2;
      if (a.built(gx, gy)) return false;
      // a tree right in front would hide her too (only the next row)
      if (avoidDecor && dd <= 1 && a.decor?.(gx, gy)) return false;
    }
  for (let dd = 1; dd <= behind; dd++) {
    // same screen column, `dd` rows behind: (gx − 1, gy − 1) for 2 rows, (gx − 1, gy) / (gx, gy − 1) for 1
    if (dd % 2 === 0 ? a.built(t.gx - dd / 2, t.gy - dd / 2) : a.built(t.gx - (dd + 1) / 2, t.gy - (dd - 1) / 2) || a.built(t.gx - (dd - 1) / 2, t.gy - (dd + 1) / 2)) return false;
  }
  return true;
}

/**
 * the tile for Maneki: `want` itself when it's clear, else the clear tile nearest to it (screen distance, within
 * `maxR` tiles), relaxing the rules step by step (no name plate over her → no decor → fewer rows in front → just a
 * free tile). Null = keep `want` (nothing better around).
 */
export function manekiTile(want: Tile, a: ManekiArea, maxR = 8): Tile | null {
  const levels: [number, boolean, number][] = [
    [5, true, 4],
    [5, true, 0],
    [5, false, 0],
    [2, false, 0],
    [0, false, 0],
  ];
  // candidates by screen distance to `want` (iso: x ∝ gx − gy, y ∝ (gx + gy) / 2)
  const cand: { t: Tile; d: number }[] = [];
  for (let dy = -maxR; dy <= maxR; dy++)
    for (let dx = -maxR; dx <= maxR; dx++) {
      const sx = dx - dy;
      const sy = (dx + dy) / 2;
      cand.push({ t: { gx: want.gx + dx, gy: want.gy + dy }, d: sx * sx + sy * sy });
    }
  cand.sort((p, q) => p.d - q.d || p.t.gx - q.t.gx || p.t.gy - q.t.gy);
  for (const [reach, avoid, behind] of levels) {
    const hit = cand.find((c) => clearTile(c.t, a, reach, avoid, behind));
    if (hit) return hit.t;
  }
  return null;
}
