/**
 * Habitats that grow (2026-10): the yard side follows the tier (3×3 → 4×4 at T4 → 5×5 at T7), upgrades
 * need room for the bigger yard (growing in place in any direction, or "MOVER Y MEJORAR"), the tiles
 * are reserved while the upgrade runs, and old saves never overlap, never lose a habitat.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { G, newGame } from '../src/state';
import type { Habitat } from '../src/state/game';
import { BAL } from '../src/state/econ';
import { canUpgradeHabitat, moveHabitat, nextHabitatSize, sellHabitat, upgradeHabitat } from '../src/state/sys/island';
import {
  HAB_SIZE,
  checkHabitatSpot,
  ensureHabitatPositions,
  freeHabitatSpots,
  habitatSize,
  habitatSpot,
  isCompact,
  ownedRegions,
  roomForHabitats,
  staticBlocked,
  tierFootprint,
  upgradeRoom,
} from '../src/island/placement';
import { islandPlan } from '../src/island/layout';
import { patchNotes } from '../src/state/patches';

const key = (x: number, y: number) => `${x},${y}`;

/** every habitat on owned land, off static buildings, and no tile claimed twice */
function assertLayoutValid() {
  const seen = new Map<string, string>();
  const tiles = islandPlan().tiles;
  const owned = ownedRegions();
  const stat = staticBlocked();
  for (const h of G.s.habitats) {
    const s = habitatSpot(h);
    for (let y = s.gy; y < s.gy + s.h; y++)
      for (let x = s.gx; x < s.gx + s.w; x++) {
        const k = key(x, y);
        const t = tiles.get(k);
        expect(t, `${h.id} off the map at ${k}`).toBeTruthy();
        expect(owned.has(t!.region), `${h.id} on land you don't own at ${k}`).toBe(true);
        expect(stat.has(k), `${h.id} on a building at ${k}`).toBe(false);
        expect(seen.get(k), `${h.id} overlaps ${seen.get(k)} at ${k}`).toBeUndefined();
        seen.set(k, h.id);
      }
  }
}

function rich() {
  G.s.kl = 40;
  G.s.gold = 1e15;
  for (const el of ['fire', 'water', 'nature']) G.s.crystals[el] = 999;
}
function finishTimers() {
  for (let i = 0; i < 5 && G.s.timers.length; i++) G.tick(1e9);
}
function addHabitat(element: string, tier: number, gx: number, gy: number): Habitat {
  const h: Habitat = { id: G.uid('h'), element, tier, region: 'home', plot: -1, gx, gy, buffer: 0, cats: [], busy: false };
  G.s.habitats.push(h);
  return h;
}

describe('habitat footprint by tier', () => {
  it('reads balance.json: 3×3 at T1–3, 4×4 at T4–6, 5×5 at T7–10', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tierFootprint)).toEqual([3, 3, 3, 4, 4, 4, 5, 5, 5, 5]);
    expect(BAL.habitats.tiers.every((t) => typeof (t as { footprint?: number }).footprint === 'number')).toBe(true);
    expect(HAB_SIZE).toBe(3);
    // nonsense tiers never break the island
    expect(tierFootprint(0)).toBe(3);
    expect(tierFootprint(99)).toBe(5);
    expect(tierFootprint(Number.NaN)).toBe(3);
  });
});

describe('upgrading needs room for the bigger yard', () => {
  beforeEach(() => {
    newGame();
    rich();
  });

  it('a T3 with free land around grows to 4×4 in place; the tiles are reserved during the timer', () => {
    const h = G.s.habitats[0];
    h.tier = 3;
    expect(habitatSize(h)).toBe(3);
    const room = upgradeRoom(h);
    expect(room.to).toBe(4);
    expect(room.at).not.toBeNull();
    expect(canUpgradeHabitat(h)).toBe(true);
    expect(upgradeHabitat(h)).toBe(true);
    // reserved right away: the yard is 4×4 and nothing else may be built on it
    expect(habitatSize(h)).toBe(4);
    const s = habitatSpot(h);
    for (let y = s.gy; y < s.gy + 4; y++) for (let x = s.gx; x < s.gx + 4; x++) expect(checkHabitatSpot(x, y, undefined, 1).ok).toBe(false);
    assertLayoutValid();
    finishTimers();
    expect(h.tier).toBe(4);
    expect(habitatSize(h)).toBe(4);
    assertLayoutValid();
  });

  it('a tier that does not grow (T1 → T2) needs no extra room', () => {
    const h = G.s.habitats[0];
    const before = { gx: h.gx, gy: h.gy };
    expect(nextHabitatSize(h)).toBe(3);
    expect(upgradeHabitat(h)).toBe(true);
    expect({ gx: h.gx, gy: h.gy }).toEqual(before);
  });

  it('grows in another direction when one side is taken', () => {
    G.s.expansions.cleared = [1, 2, 3, 4, 5, 6, 7, 8];
    // somewhere open: the habitat, plus blockers touching its +x and +y sides (left/back stays free)
    let h: Habitat | null = null;
    for (const s of freeHabitatSpots({ size: 4 })) {
      const cand = addHabitat('fire', 3, s.gx + 1, s.gy + 1);
      const okX = checkHabitatSpot(cand.gx + 3, cand.gy, undefined, 3).ok;
      const okY = checkHabitatSpot(cand.gx, cand.gy + 3, undefined, 3).ok;
      if (okX && okY) {
        addHabitat('water', 1, cand.gx + 3, cand.gy);
        addHabitat('water', 1, cand.gx, cand.gy + 3);
        h = cand;
        break;
      }
      G.s.habitats.pop();
    }
    expect(h).toBeTruthy();
    if (!h) return;
    const area = { gx: h.gx - 1, gy: h.gy - 1 };
    assertLayoutValid();
    const room = upgradeRoom(h);
    expect(room.at).toEqual({ gx: h.gx - 1, gy: h.gy - 1 });
    expect(upgradeHabitat(h)).toBe(true);
    expect({ gx: h.gx, gy: h.gy }).toEqual({ gx: area.gx, gy: area.gy });
    assertLayoutValid();
    finishTimers();
    expect(habitatSize(h)).toBe(4);
    assertLayoutValid();
  });

  it('no room around it: the upgrade is refused, a spot elsewhere is suggested, MOVER Y MEJORAR works', () => {
    const h = G.s.habitats[0];
    h.tier = 6; // → T7: 4×4 → 5×5
    expect(ensureHabitatPositions()).toBeGreaterThanOrEqual(0);
    // fill every free 3×3 next to it so a 5×5 can't grow around it
    for (let i = 0; i < 40; i++) {
      const s = freeHabitatSpots({ nearX: h.gx, nearY: h.gy, limit: 1, size: 3 })[0];
      if (!s || Math.hypot(s.gx - h.gx, s.gy - h.gy) > 6) break;
      addHabitat('water', 1, s.gx, s.gy);
    }
    assertLayoutValid();
    const room = upgradeRoom(h);
    expect(room.at).toBeNull();
    expect(room.reason).toBeTruthy();
    expect(canUpgradeHabitat(h)).toBe(false);
    expect(upgradeHabitat(h)).toBe(false);
    const gold = G.s.gold;
    // there is land elsewhere (all expansions cleared for this test)
    G.s.expansions.cleared = [1, 2, 3, 4, 5, 6, 7, 8];
    const r2 = upgradeRoom(h);
    expect(r2.elsewhere).not.toBeNull();
    expect(canUpgradeHabitat(h, r2.elsewhere!)).toBe(true);
    expect(upgradeHabitat(h, r2.elsewhere!)).toBe(true);
    expect(G.s.gold).toBeLessThan(gold);
    expect({ gx: h.gx, gy: h.gy }).toEqual({ gx: r2.elsewhere!.gx, gy: r2.elsewhere!.gy });
    expect(habitatSize(h)).toBe(5);
    assertLayoutValid();
    finishTimers();
    expect(h.tier).toBe(7);
    assertLayoutValid();
  });

  it('a long chain of upgrades never overlaps anything', () => {
    G.s.expansions.cleared = [1, 2, 3, 4, 5, 6, 7, 8];
    for (const el of ['fire', 'water', 'nature']) G.s.crystals[el] = 1e6;
    for (let round = 0; round < 10; round++) {
      for (const h of G.s.habitats) {
        if (h.tier >= 10) continue;
        const room = upgradeRoom(h);
        if (room.at) upgradeHabitat(h);
        else if (room.elsewhere) upgradeHabitat(h, room.elsewhere);
        assertLayoutValid();
      }
      finishTimers();
      assertLayoutValid();
    }
    expect(G.s.habitats.every((h) => h.tier === 10 && habitatSize(h) === 5)).toBe(true);
  });
});

describe('move and sell with sizes', () => {
  beforeEach(() => {
    newGame();
    rich();
    G.s.expansions.cleared = [1, 2, 3, 4, 5, 6, 7, 8];
  });

  it('moving a 5×5 checks its whole yard', () => {
    const h = G.s.habitats[0];
    h.tier = 8;
    ensureHabitatPositions();
    assertLayoutValid();
    const s = freeHabitatSpots({ size: 5, ignoreId: h.id, limit: 3 }).find((x) => x.gx !== h.gx || x.gy !== h.gy)!;
    expect(moveHabitat(h.id, s.gx, s.gy)).toBe(true);
    expect(habitatSize(h)).toBe(5);
    assertLayoutValid();
    // a 3×3 hole is not enough for it
    const hole = freeHabitatSpots({ size: 3, ignoreId: h.id }).find((x) => !checkHabitatSpot(x.gx, x.gy, h.id, 5).ok)!;
    expect(moveHabitat(h.id, hole.gx, hole.gy)).toBe(false);
    assertLayoutValid();
  });

  it('selling frees the whole yard (and forgets a compact size)', () => {
    const h = G.s.habitats[0];
    h.tier = 9;
    ensureHabitatPositions();
    const room0 = roomForHabitats();
    const r = sellHabitat(h.id);
    expect(r).not.toBeNull();
    expect(G.s.habitats.find((x) => x.id === h.id)).toBeUndefined();
    expect(roomForHabitats()).toBeGreaterThanOrEqual(room0);
    expect(((G.s.ext as Record<string, unknown>).habFoot as Record<string, number> | undefined)?.[h.id]).toBeUndefined();
    assertLayoutValid();
  });

  it('new habitats keep the 3×3 size in the shop counters', () => {
    const n = roomForHabitats();
    const first = freeHabitatSpots({ limit: 1 })[0];
    expect(checkHabitatSpot(first.gx, first.gy).ok).toBe(true);
    addHabitat('fire', 1, first.gx, first.gy);
    expect(roomForHabitats()).toBe(n - 1);
  });
});

describe('old saves (habitats were always 3×3)', () => {
  it('a crowded late save loads with no overlaps, nothing lost, nobody moved away, and a note', () => {
    newGame();
    G.s.expansions.cleared = [1, 2];
    // an old island: 3×3 habitats packed as tight as the old rules allowed, all high tiers
    let i = 0;
    for (;;) {
      const s = freeHabitatSpots({ limit: 1, size: 3 })[0];
      if (!s || i > 30) break;
      addHabitat(['fire', 'water', 'nature'][i % 3], 4 + (i % 7), s.gx, s.gy);
      i++;
    }
    for (const h of G.s.habitats) h.tier = Math.max(h.tier, 7);
    const before = new Map(G.s.habitats.map((h) => [h.id, { gx: h.gx, gy: h.gy, tier: h.tier, element: h.element }]));
    // a running upgrade from before the update (its tiles were never reserved)
    const up = G.s.habitats[1];
    G.startTimer('habitat_upgrade', up.id, 60_000, 'Mejorando', 'mission', { tier: up.tier + 1 });
    up.busy = true;
    // the save forgets the new patch (it ran before this update existed)
    G.s.patches = (G.s.patches ?? []).filter((p) => p !== '2026-10-habitats-crecen');
    delete (G.s.ext as Record<string, unknown>).habFoot;
    G.save();
    patchNotes.length = 0;
    G.load();
    expect(G.s.habitats.length).toBe(before.size);
    assertLayoutValid();
    let compact = 0;
    for (const h of G.s.habitats) {
      const b = before.get(h.id)!;
      expect(h.tier).toBe(b.tier);
      expect(h.element).toBe(b.element);
      // grew around its old 3×3 (never wandered off)
      expect(h.gx).toBeLessThanOrEqual(b.gx);
      expect(h.gy).toBeLessThanOrEqual(b.gy);
      expect(h.gx + habitatSize(h)).toBeGreaterThanOrEqual(b.gx + 3);
      expect(h.gy + habitatSize(h)).toBeGreaterThanOrEqual(b.gy + 3);
      if (isCompact(h)) compact++;
    }
    expect(compact).toBeGreaterThan(0); // packed tight: some had to stay compact
    expect(patchNotes.some((n) => n.includes('crecen'))).toBe(true);
    // loading again changes nothing (idempotent)
    const snap = JSON.stringify(G.s.habitats.map((h) => [h.gx, h.gy, habitatSize(h)]));
    ensureHabitatPositions();
    expect(JSON.stringify(G.s.habitats.map((h) => [h.gx, h.gy, habitatSize(h)]))).toBe(snap);
    // the running upgrade finishes fine
    finishTimers();
    assertLayoutValid();
  });

  it('a compact habitat grows as soon as there is room (sell the neighbour, reload)', () => {
    newGame();
    const [a, b] = G.s.habitats;
    a.tier = 8;
    b.tier = 1;
    // squeeze: put b right next to a
    b.gx = a.gx + 3;
    b.gy = a.gy;
    G.s.expansions.cleared = [];
    ensureHabitatPositions();
    assertLayoutValid();
    const wasCompact = isCompact(a);
    G.s.habitats = G.s.habitats.filter((h) => h.id !== b.id);
    ensureHabitatPositions();
    assertLayoutValid();
    if (wasCompact) expect(habitatSize(a)).toBeGreaterThan(3);
  });

  it('a habitat without a position or on top of a building is re-homed, never removed', () => {
    newGame();
    const h = G.s.habitats[0];
    h.tier = 7;
    (h as { gx: number }).gx = Number.NaN;
    const n = G.s.habitats.length;
    ensureHabitatPositions();
    expect(G.s.habitats.length).toBe(n);
    expect(Number.isFinite(h.gx)).toBe(true);
    assertLayoutValid();
  });
});
