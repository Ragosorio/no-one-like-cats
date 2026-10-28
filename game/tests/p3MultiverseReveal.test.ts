/**
 * Parte III · the MULTIDIMENSIONAL reveals (fx/sequences/multiverse/): every Multidimensional cat in the data has its
 * own universe in the reveal, and every universe belongs to a real Multidimensional cat.
 * 2026-10-28: every reference cat became Multidimensional (the owner). PENDING lists the ones whose universe is still
 * being built; each one leaves the list the moment its universe is registered — it ends empty.
 */
import { describe, expect, it } from 'vitest';

const ESP = (await import('../src/data/gateras/especies.json')).default as { cats: { id: string; rarity: string }[] };
const { SIGNATURES } = await import('../src/fx/sequences/multiverse');

const PENDING: string[] = [];

describe('each Multidimensional cat brings its universe to the reveal', () => {
  const multi = ESP.cats.filter((c) => c.rarity === 'multidimensional').map((c) => c.id);
  it('every universe belongs to a Multidimensional cat; every Multidimensional cat has one (or is still PENDING)', () => {
    for (const id of Object.keys(SIGNATURES)) expect(multi, id).toContain(id);
    const missing = multi.filter((id) => !SIGNATURES[id]);
    expect(missing.sort()).toEqual([...PENDING].filter((id) => !SIGNATURES[id]).sort());
    // a registered universe must leave PENDING
    expect(PENDING.filter((id) => SIGNATURES[id]), 'remove these from PENDING').toEqual([]);
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
