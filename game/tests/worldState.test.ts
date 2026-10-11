/**
 * Narrative world state (src/state/sys/worldState.ts, docs/part-ii/20-estados-y-cine.md): the island's look is
 * DERIVED from story progress — Part I saves are 'normal', Oleada 1 walks presagio → noche_astral → cielo_roto —
 * so it survives reloads, scene changes and the Part II narrative reset. Plus the look math (blend, grade).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const mem = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, String(v)),
  removeItem: (k: string) => void mem.delete(k),
  key: (i: number) => [...mem.keys()][i] ?? null,
  get length() {
    return mem.size;
  },
  clear: () => mem.clear(),
};

const W = await import('../src/state/sys/worldState');
const { gradeMatrix, applyGrade } = await import('../src/island/night/grade');

type Save = { missions: { active: string[]; done: string[] }; beatsSeen: string[]; flags?: Record<string, boolean> };
const fixture = (name: string): Save => JSON.parse(readFileSync(new URL(`../test-saves/${name}.json`, import.meta.url), 'utf8')).state;
const PART_I = Array.from({ length: 30 }, (_, i) => `H${String(i + 1).padStart(2, '0')}`);
const save = (active: string[], done: string[], beats: string[] = []): Save => ({ missions: { active, done: [...PART_I, ...done] }, beatsSeen: beats });
const id = (s: Save | null) => W.currentWorldState(s).id;

describe('world state — derived from the story', () => {
  it('Part I saves (and no save) are the island of always', () => {
    expect(id(fixture('late-game'))).toBe('normal');
    expect(id(fixture('post-story'))).toBe('normal');
    // «Fin» done but H31 not activated yet (checkMissions activates it on load)
    expect(id(fixture('post-finale'))).toBe('normal');
    expect(id(null)).toBe('normal');
    expect(W.lookOf('normal')).toEqual(W.NORMAL_LOOK);
    expect(W.isNeutralGrade(W.lookOf('normal'))).toBe(true);
  });

  it('Oleada 1: presagio → noche astral (from the opening’s climax through REGISTRO 000 until the dawn scene) → cielo roto', () => {
    const f = fixture('post-finale');
    f.missions.active.push('H31');
    expect(id(f)).toBe('presagio');
    expect(id(save(['H31'], []))).toBe('presagio');
    // the opening persists b31_estrellas#a at its point of no return
    expect(id(save(['H31'], [], ['b31_estrellas#a']))).toBe('noche_astral');
    // tapping the faro completes H31: still night through the reflejo and REGISTRO 000
    expect(id(save(['H32'], ['H31'], ['b31_estrellas#a', 'b31_estrellas#b', 'b31_estrellas', 'b31_reflejo']))).toBe('noche_astral');
    // H32 done but the FOLIO reveal (its part b) hasn't played yet: the night holds
    expect(id(save(['H33'], ['H31', 'H32'], ['b31_estrellas#a', 'b32_registro#a']))).toBe('noche_astral');
    // FOLIO read: still night — «Amanece» is a scene (cine h33_amanecer) that really brings the sun up
    expect(id(save(['H33'], ['H31', 'H32'], ['b31_estrellas#a', 'b32_registro#a', 'b32_registro#b']))).toBe('noche_astral');
    // the dawn scene persists b33_paginas#a once the sun is up → daylight with a scar
    expect(id(save(['H33'], ['H31', 'H32'], ['b31_estrellas#a', 'b32_registro#a', 'b32_registro#b', 'b33_paginas#a']))).toBe('cielo_roto');
    // landing on Páginas (H33 done) ends the night too, even if the dawn never played (an old save)
    expect(id(save(['H34'], ['H31', 'H32', 'H33'], ['b31_estrellas#a', 'b32_registro#b']))).toBe('cielo_roto');
    // further on, whatever beats a save kept: daylight with a scar
    expect(id(save(['H37'], ['H31', 'H32', 'H33', 'H34', 'H35', 'H36']))).toBe('cielo_roto');
    expect(id(save([], ['H31', 'H32', 'H33', 'H34', 'H35', 'H36', 'H37', 'H38', 'H39', 'H40', 'H41']))).toBe('cielo_roto');
  });

  it('persistence: the same save gives the same world after a reload; the narrative reset replays the opening', () => {
    const s = save(['H32'], ['H31'], ['b31_estrellas#a', 'b31_estrellas#b', 'b31_estrellas']);
    expect(id(JSON.parse(JSON.stringify(s)))).toBe(id(s));
    // a Part II narrative reset (MIGRATION): H31.. back to the start, their beats forgotten → presagio again
    const reset = save(['H31'], [], []);
    expect(id(reset)).toBe('presagio');
    // pure: deriving never mutates the save
    const before = JSON.stringify(s);
    W.currentWorldState(s);
    expect(JSON.stringify(s)).toBe(before);
  });

  it('the registry: priority wins, ids replace, a broken predicate never breaks the island', () => {
    W.registerWorldState({ id: 'test_storm', priority: 500, when: (s) => s.missions.active.includes('TEST'), look: { exposure: 0.5 } });
    expect(id(save(['H31', 'TEST'], []))).toBe('test_storm');
    expect(id(save(['H31'], []))).toBe('presagio');
    W.registerWorldState({ id: 'test_storm', priority: 500, when: () => false, look: {} });
    expect(W.worldStates().filter((d) => d.id === 'test_storm')).toHaveLength(1);
    expect(id(save(['H31', 'TEST'], []))).toBe('presagio');
    W.registerWorldState({ id: 'test_boom', priority: 600, when: () => { throw new Error('boom'); }, look: {} });
    expect(id(save(['H31'], []))).toBe('presagio');
    W.registerWorldState({ id: 'test_boom', priority: -1, when: () => false, look: {} });
    W.registerWorldState({ id: 'test_storm', priority: -1, when: () => false, look: {} });
    // Oleada 1 sits in its band; the night invites the faro tap while H31 waits
    const noche = W.worldStateById('noche_astral')!;
    expect(noche.priority).toBeGreaterThanOrEqual(10);
    expect(noche.priority).toBeLessThan(40);
    expect(noche.prompt?.target).toBe('faro');
    expect(noche.prompt?.when?.(save(['H31'], [], ['b31_estrellas#a']))).toBe(true);
    expect(noche.prompt?.when?.(save(['H32'], ['H31']))).toBe(false);
  });
});

describe('world look — blend and grade', () => {
  const day = W.lookOf('normal');
  const night = W.lookOf('noche_astral');
  it('mixLook: exact ends, numbers in between, sound switches halfway', () => {
    expect(W.mixLook(day, night, 0)).toEqual(day);
    expect(W.mixLook(day, night, 1)).toEqual(night);
    const mid = W.mixLook(day, night, 0.5);
    expect(mid.sky).toBeCloseTo(0.5);
    expect(mid.exposure).toBeCloseTo((day.exposure + night.exposure) / 2);
    expect(W.mixLook(day, night, 0.49).music).toBe(day.music);
    expect(W.mixLook(day, night, 0.5).music).toBe(night.music);
    expect(W.mixColor(0x000000, 0xffffff, 0.5)).toBe(0x808080);
  });
  it('the grade: identity by day; at night darker and bluer, but never black', () => {
    const id = gradeMatrix(day);
    const c = applyGrade(id, 0.2, 0.5, 0.8);
    expect(c[0]).toBeCloseTo(0.2);
    expect(c[1]).toBeCloseTo(0.5);
    expect(c[2]).toBeCloseTo(0.8);
    const m = gradeMatrix(night);
    const grass = applyGrade(m, 0xa6 / 255, 0xcf / 255, 0x7e / 255);
    const lum = (v: number[]) => 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
    expect(lum(grass)).toBeLessThan(lum([0xa6 / 255, 0xcf / 255, 0x7e / 255]) * 0.7);
    expect(grass[2] / grass[0]).toBeGreaterThan(0x7e / 0xa6); // bluer
    const black = applyGrade(m, 0, 0, 0);
    expect(Math.max(...black)).toBeGreaterThan(0); // the lift: deep blue, never black (08 §4)
    expect(W.isNeutralGrade(night)).toBe(false);
    // the lingering scar keeps the painted colors (no grade filter by day)
    expect(W.isNeutralGrade(W.lookOf('cielo_roto'))).toBe(true);
  });
});

describe('the scar follows the player’s clock (cielo_roto · clockLook), gently', () => {
  const scar = W.lookOf('cielo_roto');
  it('only the lingering daytime state follows the clock; Part I and the story night never do', () => {
    expect(W.worldStateById('cielo_roto')!.clock).toBe(true);
    expect(W.worldStateById('noche_astral')!.clock).toBeFalsy();
    expect(W.worldStateById('presagio')!.clock).toBeFalsy();
    expect(W.worldStateById('normal')!.clock).toBeFalsy();
  });
  it('noon is the painted day; sunset is golden; night is a soft blue night — never the astral one, never black', () => {
    expect(W.clockLook(scar, 12)).toEqual(scar);
    expect(W.isNeutralGrade(W.clockLook(scar, 13.5))).toBe(true);
    const gold = W.clockLook(scar, 18.75);
    expect(gold.tint).not.toBe(0xffffff);
    expect(gold.sky).toBeLessThan(0.2);
    const night = W.clockLook(scar, 23);
    const astral = W.lookOf('noche_astral');
    expect(night.sky).toBeGreaterThan(0.5);
    expect(night.sky).toBeLessThan(astral.sky);
    expect(night.exposure).toBeGreaterThan(astral.exposure);
    expect(night.lift).not.toBe(0);
    expect(night.stars).toBeGreaterThanOrEqual(scar.stars);
    expect(night.seam).toBe(scar.seam);
    // the sound never changes with the clock
    expect(night.music).toBe(scar.music);
    expect(night.ambience).toBe(scar.ambience);
    // dawn brings the day back
    expect(W.clockLook(scar, 7.5)).toEqual(scar);
  });
  it('pure and continuous: same hour → same look; minutes apart → nearly the same light', () => {
    expect(W.clockLook(scar, 20.1)).toEqual(W.clockLook(scar, 20.1));
    for (let h = 0; h < 24; h += 0.25) {
      const a = W.clockLook(scar, h);
      const b = W.clockLook(scar, h + 0.05);
      expect(Math.abs(a.exposure - b.exposure)).toBeLessThan(0.02);
      expect(Math.abs(a.sky - b.sky)).toBeLessThan(0.05);
    }
  });
});
