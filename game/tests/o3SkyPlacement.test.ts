/**
 * Oleada 3 sky + island placement (MENORES 2026-10-10):
 *  - the passing sky pieces (tug, graffiti, Leviathan, eye) clear the islands on screen like the ones that stay
 *    (SkyLine.clearOnScreen, the math o3Sky.settle uses)
 *  - Maneki sweeps on a free tile: nothing built on it or tall in front of it (ui/story/manekiSpot.ts)
 */
import { describe, expect, it } from 'vitest';
import { SkyLine } from '../src/ui/story/skyLine';
import { clearTile, manekiTile, type ManekiArea } from '../src/ui/story/manekiSpot';
import { isoToScreen } from '../src/island/iso';

describe('sky pieces clear the islands on screen (SkyLine.clearOnScreen)', () => {
  // a 6×6 island at the origin; the world draws at screen = o + world · s
  const tiles: { gx: number; gy: number }[] = [];
  for (let gx = 0; gx < 6; gx++) for (let gy = 0; gy < 6; gy++) tiles.push({ gx, gy });
  const line = SkyLine.fromTiles(tiles);
  const o = { x: 800, y: 500 };
  const s = 0.5;

  it('a piece over the islands rises until its lowest point is above their top edge', () => {
    const top = o.y + line.minY * s;
    const y = line.clearOnScreen(o.x, top + 100, 150, 60, o, s);
    expect(y + 60).toBeLessThanOrEqual(top);
    expect(y + 60).toBeGreaterThan(top - 40);
  });
  it('never moves a piece down, and leaves it alone over open sea', () => {
    expect(line.clearOnScreen(o.x, -2000, 150, 60, o, s)).toBe(-2000);
    const farRight = o.x + 4000;
    expect(line.clearOnScreen(farRight, 300, 100, 60, o, s)).toBe(300);
  });
  it('a wider piece is cleared against every column it spans', () => {
    const at = isoToScreen(5, 0); // the right-hand corner of the island, lower than its top
    const sx = o.x + at.x * s;
    const narrow = line.clearOnScreen(sx + 200, 900, 10, 0, o, s);
    const wide = line.clearOnScreen(sx + 200, 900, 400, 0, o, s);
    expect(wide).toBeLessThanOrEqual(narrow);
  });
  it('a bad transform (scale 0) changes nothing', () => {
    expect(line.clearOnScreen(o.x, 123, 50, 50, o, 0)).toBe(123);
  });
});

describe('Maneki sweeps on a free tile (manekiTile)', () => {
  const k = (gx: number, gy: number) => `${gx},${gy}`;
  const area = (built: string[], decor: string[] = [], size = 20): ManekiArea => ({
    land: (gx, gy) => gx >= 0 && gy >= 0 && gx < size && gy < size,
    built: (gx, gy) => built.includes(k(gx, gy)),
    decor: (gx, gy) => decor.includes(k(gx, gy)),
  });
  // a 3×3 building (the Puerto) whose footprint is (10..12, 10..12)
  const puerto: string[] = [];
  for (let x = 10; x < 13; x++) for (let y = 10; y < 13; y++) puerto.push(k(x, y));

  it('keeps her old tile when nothing stands on it or in front of it (small islands look the same)', () => {
    expect(manekiTile({ gx: 4, gy: 4 }, area(puerto))).toEqual({ gx: 4, gy: 4 });
  });
  it('moves her off a building', () => {
    const t = manekiTile({ gx: 11, gy: 11 }, area(puerto))!;
    expect(puerto).not.toContain(k(t.gx, t.gy));
    expect(clearTile(t, area(puerto), 5, true)).toBe(true);
  });
  it('moves her out from BEHIND a building (a tall one in front hides her) but stays near', () => {
    // (9, 8): the Puerto's tiles are a few rows in front of it, in the same screen column
    expect(clearTile({ gx: 9, gy: 8 }, area(puerto), 5, true)).toBe(false);
    const t = manekiTile({ gx: 9, gy: 8 }, area(puerto))!;
    expect(clearTile(t, area(puerto), 5, true)).toBe(true);
    expect(Math.abs(t.gx - 9) + Math.abs(t.gy - 8)).toBeLessThanOrEqual(6);
  });
  it('never on the sea or on land you do not own; a tree right in front is avoided when possible', () => {
    const a = area([], [k(3, 2), k(2, 3), k(3, 3)]);
    const t = manekiTile({ gx: 2, gy: 2 }, a)!;
    expect(a.land(t.gx, t.gy)).toBe(true);
    expect(t).not.toEqual({ gx: 2, gy: 2 });
    expect(manekiTile({ gx: -5, gy: -5 }, area([]), 3)).toBeNull();
  });
  it('a crowded island still gets a free tile (the rules relax), never a built one', () => {
    // everything built except a ring of single free tiles with buildings right in front of them
    const built: string[] = [];
    for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++) if ((x + y) % 3 !== 0) built.push(k(x, y));
    const a = area(built, [], 8);
    const t = manekiTile({ gx: 4, gy: 4 }, a)!;
    expect(t).not.toBeNull();
    expect(built).not.toContain(k(t.gx, t.gy));
  });
  it('is deterministic (same island, same spot)', () => {
    const a = area(puerto, [k(5, 5)]);
    expect(manekiTile({ gx: 11, gy: 12 }, a)).toEqual(manekiTile({ gx: 11, gy: 12 }, a));
  });
});
