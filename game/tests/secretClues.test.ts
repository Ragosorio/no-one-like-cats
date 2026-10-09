/**
 * Regression (2026-10-08): mission E18 "Rumores" asked for clues of 3 secret cats but only 2 clues
 * existed in the whole game, and Pixel Glitch (s_caos) needed a "Flash Event" that never existed.
 * Now a pair shaped like a secret recipe leaves a clue, and every secret has a reachable recipe.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { G, newGame } from '../src/state';
import { adopt } from '../src/state/sys/cats';
import { noteSecretClues, oddsFor, secretClues, secretCluesFound } from '../src/state/sys/resonance';
import { CATS } from '../src/data/content';

function own(species: string, level = 1, stars = 1) {
  const r = adopt(species, { free: true });
  const c = r.cat ?? G.s.cats.find((x) => x.species === species)!;
  c.level = level;
  c.stars = stars;
  return c;
}

describe('secret cat clues', () => {
  beforeEach(() => newGame());

  it('two low-level bankers leave the Maneki clue without opening the ??? bucket', () => {
    const a = own('c_chispa', 3);
    const b = own('r_pimenton', 3);
    const k = secretClues(a.uid, b.uid).find((x) => x.species === 's_maneki');
    expect(k).toBeTruthy();
    expect(k!.ready).toBe(false);
    expect(k!.need).toMatch(/Nv15/);
    expect(G.s.catdex.s_maneki).toBeUndefined();
    expect(noteSecretClues(a.uid, b.uid)).toContain('s_maneki');
    expect(G.s.catdex.s_maneki).toBe('rumor');
    // seating the same pair again is not a second clue
    expect(noteSecretClues(a.uid, b.uid)).toEqual([]);
  });

  it('the same bankers at Nv15 qualify (the ??? row appears)', () => {
    const a = own('c_chispa', 15);
    const b = own('r_pimenton', 15);
    expect(secretClues(a.uid, b.uid).find((x) => x.species === 's_maneki')!.ready).toBe(true);
    expect(oddsFor(a.uid, b.uid).secret).toContain('s_maneki');
  });

  it('Pixel Glitch is breedable: Storm + Cosmic, both Nv25+', () => {
    const storm = CATS.find((c) => !c.secret && c.elements.length === 1 && c.elements[0] === 'storm' && c.rarity === 'common')!;
    const cosmic = CATS.find((c) => !c.secret && c.elements.length === 1 && c.elements[0] === 'cosmic' && c.rarity === 'common')!;
    for (const e of ['storm', 'cosmic']) if (!G.s.elements.includes(e)) G.s.elements.push(e);
    const a = own(storm.id, 25);
    const b = own(cosmic.id, 25);
    expect(oddsFor(a.uid, b.uid).secret).toContain('s_caos');
  });

  it('E18 progress counts every clue held, including secret cats already registered', () => {
    const before = secretCluesFound();
    G.s.catdex.s_sonata = 'registered';
    G.s.catdex.s_lumen = 'rumor';
    expect(secretCluesFound()).toBe(before + 2);
  });
});
