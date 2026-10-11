import { beforeEach, describe, expect, it } from 'vitest';
import { G, newGame } from '../src/state';
import { adopt } from '../src/state/sys/cats';
import { catTier, catWhere, fold, queryCats, tiersAmong } from '../src/state/ext/catQuery';
import { catDef } from '../src/data/content';
import { renameCat } from '../src/state/ext/island';

describe('queryCats (shared search / filter / sort)', () => {
  beforeEach(() => newGame());

  it('folds case and accents', () => {
    expect(fold('  ÁUREA   la Primera ')).toBe('aurea la primera');
  });

  it('finds by custom name, species name or epithet, ignoring accents', () => {
    const c = G.s.cats[0];
    renameCat(c, 'Señor Bigotón');
    expect(queryCats({ text: 'bigoton' }).map((x) => x.uid)).toEqual([c.uid]);
    expect(queryCats({ text: 'SENOR big' }).map((x) => x.uid)).toEqual([c.uid]);
    // the species name still finds it after the rename
    expect(queryCats({ text: 'canelo' }).some((x) => x.uid === c.uid)).toBe(true);
    expect(queryCats({ text: 'zzz-no-existe' })).toEqual([]);
  });

  it('filters by rarity tier (primordials are their own tier) and lists the tiers you own, low → high', () => {
    adopt('r_neblino', { free: true });
    adopt('l_ignis', { free: true });
    const tiers = tiersAmong(G.s.cats);
    expect(tiers).toContain('rare');
    expect(tiers).toContain('primordial');
    expect(tiers.indexOf('rare')).toBeLessThan(tiers.indexOf('primordial'));
    const prim = queryCats({ tiers: ['primordial'] });
    expect(prim.length).toBeGreaterThan(0);
    expect(prim.every((c) => catDef(c.species).primordial)).toBe(true);
    const leg = queryCats({ tiers: ['legendary'] });
    expect(leg.every((c) => catTier(catDef(c.species)) === 'legendary' && !catDef(c.species).primordial)).toBe(true);
    const both = queryCats({ tiers: ['rare', 'primordial'] });
    expect(both.length).toBe(queryCats({ tiers: ['rare'] }).length + prim.length);
  });

  it('filters by element and sorts by level both ways', () => {
    adopt('c_chispa', { free: true });
    G.s.cats.forEach((c, i) => (c.level = 5 + i * 3));
    const fire = queryCats({ elements: ['fire'] });
    expect(fire.length).toBeGreaterThan(0);
    expect(fire.every((c) => c.species === 'c_canelo' || c.species === 'c_chispa')).toBe(true);
    const down = queryCats({ sort: 'level' }).map((c) => c.level);
    expect(down).toEqual([...down].sort((a, b) => b - a));
    const up = queryCats({ sort: 'level', asc: true }).map((c) => c.level);
    expect(up).toEqual([...up].sort((a, b) => a - b));
  });

  it('knows where a cat is: habitat, ship crew, homeless', () => {
    const crewed = G.s.ship.crew.balsa[0];
    const w = catWhere(crewed);
    expect(w.ships).toContain('balsa');
    const homeless = G.s.cats.find((c) => !c.habitat)!;
    expect(catWhere(homeless.uid).label).toMatch(/Sin casa/);
    expect(queryCats({ place: 'homeless' }).map((c) => c.uid)).toContain(homeless.uid);
  });
});
