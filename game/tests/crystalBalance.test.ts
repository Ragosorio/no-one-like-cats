/**
 * Cristal balance invariants (docs/part-ii/15-balance-cristal.md). Cheap guards for what the headless family sims
 * (scripts/balance-crystal.ts) calibrated: the FACETA/REFLEJO budget that made a pure Cristal crew win ~75%, the
 * 12 Lote D species inside their rarity's Part I band, and a small deterministic family duel.
 */
import { describe, expect, it } from 'vitest';
import { CR_TUNE } from '../src/battle/cristal';
import { CONTENT, catDef } from '../src/data/content';
import { duel, familyCrew, BUDGETS } from '../scripts/balance-crystal';

const NEW = ['c_brillito', 'r_facetas', 'r_espejito', 'e_prismarina', 'l_madrenacar', 's_refracta', 'c_marcapaginas', 'r_tintero', 'e_archivista', 'l_bibliotecario', 'c_espumita', 'r_farolillo'];

describe('Cristal tuning (cristal.ts CR_TUNE)', () => {
  it('the facet stops less than half and sends back a small shard; refraction shards are a bonus, not a copy', () => {
    // 0.5 / 0.35 (the first draft) made a pure Cristal crew win ~75% of family duels: the facet was the whole kit
    expect(CR_TUNE.facetKeep).toBeGreaterThan(0.5);
    expect(CR_TUNE.facetKeep).toBeLessThanOrEqual(0.75);
    expect(CR_TUNE.facetReflect).toBeGreaterThan(0);
    expect(CR_TUNE.facetReflect).toBeLessThanOrEqual(0.2);
    expect(CR_TUNE.shard).toBeGreaterThanOrEqual(0.5);
    expect(CR_TUNE.shard).toBeLessThan(1);
  });

  it('the data says the same numbers the rules use (REFLEJO plate / status texts)', () => {
    const reflejo = (CONTENT as unknown as { reactions: { id: string; mult: number; effect: string }[] }).reactions.find((r) => r.id === 'reflejo')!;
    expect(reflejo.mult).toBe(CR_TUNE.facetKeep);
    expect(reflejo.effect).toContain(`×${CR_TUNE.facetReflect}`);
    const refr = (CONTENT as unknown as { reactions: { id: string; effect: string }[] }).reactions.find((r) => r.id === 'refraccion')!;
    expect(refr.effect).toContain(`×${CR_TUNE.shard}`);
  });
});

describe('the 12 Lote D species sit in their rarity band (vs Part I species of the same rarity)', () => {
  const band = (rarity: string, f: (id: string) => number) => {
    const vals = CONTENT.cats.filter((c) => c.rarity === rarity && !NEW.includes(c.id)).map((c) => f(c.id));
    return [Math.min(...vals), Math.max(...vals)];
  };
  const shot = (id: string) => catDef(id).combat.shot;
  for (const id of NEW) {
    it(`${id}: shot damage, radius, ultimate damage and reload`, () => {
      const r = catDef(id).rarity;
      const [dLo, dHi] = band(r, (x) => shot(x).dmg * Math.max(1, shot(x).projectiles));
      const s = shot(id);
      expect(s.dmg * Math.max(1, s.projectiles)).toBeGreaterThanOrEqual(dLo);
      expect(s.dmg * Math.max(1, s.projectiles)).toBeLessThanOrEqual(dHi);
      const [rLo, rHi] = band(r, (x) => shot(x).radius);
      expect(s.radius).toBeGreaterThanOrEqual(rLo);
      expect(s.radius).toBeLessThanOrEqual(rHi);
      const [uLo, uHi] = band(r, (x) => catDef(x).combat.ultimate.dmg);
      expect(catDef(id).combat.ultimate.dmg).toBeGreaterThanOrEqual(uLo);
      expect(catDef(id).combat.ultimate.dmg).toBeLessThanOrEqual(uHi);
      const [kLo, kHi] = band(r, (x) => catDef(x).combat.recarga ?? 0);
      expect(catDef(id).combat.recarga ?? 0).toBeGreaterThanOrEqual(kLo);
      expect(catDef(id).combat.recarga ?? 0).toBeLessThanOrEqual(kHi);
    });
  }
});

describe('family duels (same harness as the balance doc, small and deterministic)', () => {
  it('a pure Cristal crew is a fair fight for a mid Part I family (Vacío), not a stomp', () => {
    let wins = 0;
    let n = 0;
    for (const ship of ['wood', 'iron']) {
      const r = duel((s) => familyCrew('crystal', 'A', s), (s) => familyCrew('void', 'A', s), ship, 'normal', BUDGETS.A.level, 8);
      wins += r.wins;
      n += r.n;
    }
    // first draft (facet 0.5 / reflect 0.35): 14/16 here · tuned: 10/16
    expect(wins / n).toBeGreaterThanOrEqual(0.25);
    expect(wins / n).toBeLessThanOrEqual(0.75);
  }, 60_000);

  it('family crews follow the budget: Cristal at A is common + rare + epic, mixed crews swap the cheapest slots', () => {
    expect(familyCrew('crystal', 'A', 0).map((id) => catDef(id).rarity)).toEqual(['common', 'rare', 'epic']);
    expect(familyCrew('fire', 'B', 3, 1).map((id) => catDef(id).elements[0])).toEqual(['crystal', 'fire', 'fire']);
  });
});
