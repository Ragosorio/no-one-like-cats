import { beforeEach, describe, expect, it } from 'vitest';
import { G, newGame } from '../src/state';
import { adopt } from '../src/state/sys/cats';
import { catWhere, fold, queryCats } from '../src/state/ext/catQuery';
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
