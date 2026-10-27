/**
 * Parte III · the MULTIDIMENSIONAL reveals (fx/sequences/multiverse/): every Multidimensional cat in the data has its
 * own universe in the reveal, and every universe belongs to a real Multidimensional cat.
 */
import { describe, expect, it } from 'vitest';

const ESP = (await import('../src/data/gateras/especies.json')).default as { cats: { id: string; rarity: string }[] };
const { SIGNATURES } = await import('../src/fx/sequences/multiverse');

describe('each Multidimensional cat brings its universe to the reveal', () => {
  const multi = ESP.cats.filter((c) => c.rarity === 'multidimensional').map((c) => c.id);
  it('the 9 with art, one universe each', () => {
    expect(multi.length).toBe(9);
    expect(Object.keys(SIGNATURES).sort()).toEqual([...multi].sort());
  });
  it('each universe has its tag, its frame and a dark/light stage', () => {
    for (const [id, s] of Object.entries(SIGNATURES)) {
      expect(s.tag.length, id).toBeGreaterThan(4);
      expect(s.tag, id).toBe(s.tag.toUpperCase());
      expect(typeof s.frame, id).toBe('number');
      expect(typeof s.dark, id).toBe('boolean');
    }
  });
  it('no two universes share a tag', () => {
    const tags = Object.values(SIGNATURES).map((s) => s.tag);
    expect(new Set(tags).size).toBe(tags.length);
  });
});
