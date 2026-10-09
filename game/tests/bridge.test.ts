/**
 * Read-only save bridge (Rupturas slice): it must never write, must survive odd saves, and must
 * pick a recognizable cast (Canelo first, element variety, tier cap) from every fixture.
 */
import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import content from '../src/data/content.json';
import { parseIsland, pickCast, readSaveReadOnly, SAVE_KEY, type SpeciesInfo } from '../src/rupturas/bridge';

const species = new Map<string, SpeciesInfo>(
  (content as unknown as { cats: { id: string; name: string; art: { slug: string }; elements: string[]; rarity: string; primordial?: boolean; role?: string }[] }).cats.map((c) => [
    c.id,
    { id: c.id, name: c.name, slug: c.art.slug, elements: c.elements, rarity: c.rarity, primordial: c.primordial, role: c.role },
  ]),
);
const dir = path.join(__dirname, '..', 'test-saves');
const fixtures = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
const lite = (slug: string) => `cats-svg/lite/${slug}.svg`;

describe('read-only save bridge', () => {
  it('only ever reads storage', () => {
    const raw = fs.readFileSync(path.join(dir, 'late-game.json'), 'utf8');
    const storage = { getItem: vi.fn((k: string) => (k === SAVE_KEY ? raw : null)), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() };
    const env = readSaveReadOnly(storage);
    expect(env).not.toBeNull();
    const isl = parseIsland(env, species, 'partida')!;
    pickCast(isl, 16, lite);
    expect(storage.getItem).toHaveBeenCalledWith(SAVE_KEY);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
    expect(storage.clear).not.toHaveBeenCalled();
  });

  it('survives garbage: corrupt JSON, wrong shapes, unknown species', () => {
    expect(readSaveReadOnly({ getItem: () => '{not json' })).toBeNull();
    expect(readSaveReadOnly({ getItem: () => null })).toBeNull();
    expect(parseIsland(null, species, 'partida')).toBeNull();
    expect(parseIsland({ state: { cats: 'nope' } }, species, 'partida')).toBeNull();
    const isl = parseIsland({ state: { cats: [{ uid: 'x', species: 'zz_unknown' }, null, { uid: 'c1', species: 'c_canelo', level: 3 }] } }, species, 'partida')!;
    expect(isl.cats.map((c) => c.species)).toEqual(['c_canelo']);
  });

  it.each(fixtures)('%s → a cast with Canelo first, no duplicates, within the cap', (f) => {
    const env = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const isl = parseIsland(env, species, 'fixture');
    if (!isl || !isl.cats.length) return;
    for (const max of [8, 16]) {
      const cast = pickCast(isl, max, lite);
      expect(cast.length).toBeLessThanOrEqual(max);
      expect(new Set(cast.map((c) => c.id)).size).toBe(cast.length);
      if (isl.cats.some((c) => c.species === 'c_canelo')) {
        expect(cast[0].species).toBe('c_canelo');
        expect(cast[0].tags).toContain('canelo');
      }
      for (const c of cast) expect(c.url).toBe(lite(c.slug));
      // deterministic: same island, same cast, same traits
      expect(pickCast(isl, max, lite)).toEqual(cast);
    }
  });

  it('keeps element variety when the collection is lopsided', () => {
    const cats = Array.from({ length: 30 }, (_, i) => ({ uid: `f${i}`, species: 'c_chispa', level: 50, stars: 3 }));
    cats.push({ uid: 'w1', species: 'c_gelatino', level: 1, stars: 0 }, { uid: 'n1', species: 'c_brote', level: 1, stars: 0 });
    const isl = parseIsland({ state: { cats } }, species, 'partida')!;
    const cast = pickCast(isl, 9, lite);
    expect(cast.some((c) => c.species === 'c_gelatino')).toBe(true);
    expect(cast.some((c) => c.species === 'c_brote')).toBe(true);
  });
});
