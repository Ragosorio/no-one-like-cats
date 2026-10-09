/**
 * Regression (2026-10-08, "the habitat shows the old level until you reopen it"):
 * every change to ONE owned cat that a screen displays must announce itself with `G.emit('cat')`,
 * because open panels (habitat, Catdex, crew picker…) redraw from that event instead of polling.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { G, newGame } from '../src/state';
import { feed } from '../src/state/sys/cats';
import { habitat, house } from '../src/state/sys/island';
import { renameCat } from '../src/state/ext/island';
import { catDef } from '../src/data/content';

describe('owned-cat change events', () => {
  let seen: { uid: string; why: string }[];
  beforeEach(() => {
    newGame();
    seen = [];
    G.on('cat', (e) => seen.push(e));
  });

  it('feeding to a new level emits cat/level once, with the new level already applied', () => {
    const c = G.s.cats[0];
    G.s.food = 1e12;
    const before = c.level;
    let levelAtEmit = -1;
    G.on('cat', (e) => {
      if (e.uid === c.uid && e.why === 'level') levelAtEmit = G.s.cats.find((x) => x.uid === e.uid)!.level;
    });
    for (let i = 0; i < 4; i++) feed(c);
    expect(c.level).toBe(before + 1);
    expect(seen.filter((e) => e.uid === c.uid && e.why === 'level')).toHaveLength(1);
    expect(levelAtEmit).toBe(before + 1);
  });

  it('a bite that does not level up stays quiet (no redraw storm while holding ÑAM)', () => {
    const c = G.s.cats[0];
    G.s.food = 1e12;
    feed(c);
    expect(seen).toHaveLength(0);
  });

  it('moving a cat into a habitat and renaming it are announced', () => {
    const homeless = G.s.cats.find((c) => !c.habitat)!;
    expect(homeless).toBeTruthy(); // Brote starts homeless (mission K03)
    const h = G.s.habitats.find((x) => !x.busy)!;
    h.element = catDef(homeless.species).elements[0]; // test setup: make it a valid home for Brote
    expect(house(homeless.uid, h)).toBe(true);
    expect(seen.some((e) => e.uid === homeless.uid && e.why === 'home')).toBe(true);
    expect(habitat(h.id)!.cats).toContain(homeless.uid);
    const c = G.s.cats[0];
    renameCat(c, 'Michi Prueba');
    expect(seen.some((e) => e.uid === c.uid && e.why === 'name')).toBe(true);
  });
});
