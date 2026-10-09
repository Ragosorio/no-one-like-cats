/**
 * AgentGameEngine pure-logic tests (no GPU): noise determinism, the island shape, Gerstner CPU
 * sampling, frame stats/auto quality and the ambient-life director with real puppet brains.
 */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { fbm, hash2, rng } from '../src/engine/core/noise';
import { AutoQuality, FrameStats, QUALITY, TIERS } from '../src/engine/core/perf';
import { Ocean } from '../src/engine/world/ocean';
import { LifeDirector, type LifeWorld } from '../src/engine/life/director';
import { PuppetBrain } from '../src/art/puppetCore';
import { PADS, heightAt, walkable } from '../src/rupturas/island';
import { activities, type Spots } from '../src/rupturas/life';
import type { PaperCat } from '../src/engine/world/paperCat';

describe('noise', () => {
  it('is deterministic and bounded', () => {
    expect(hash2(3, 4, 1)).toBe(hash2(3, 4, 1));
    expect(hash2(3, 4, 1)).not.toBe(hash2(4, 3, 1));
    for (let i = 0; i < 200; i++) {
      const v = fbm(i * 0.37, i * 0.11, 4, 2);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
    const a = rng(7);
    const b = rng(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('home island shape', () => {
  it('flattens every building pad to its height', () => {
    for (const p of Object.values(PADS)) expect(Math.abs(heightAt(p.x, p.z) - p.h)).toBeLessThan(0.05);
  });
  it('is land in the middle, sea far away, and cats cannot walk into deep water', () => {
    expect(heightAt(0, 0)).toBeGreaterThan(1);
    expect(heightAt(80, 80)).toBeLessThan(-3);
    expect(walkable(PADS.palm.x + 1.6, PADS.palm.z + 1.2)).toBe(true);
    expect(walkable(80, 80)).toBe(false);
  });
});

describe('ocean CPU sampling', () => {
  const tex = new THREE.DataTexture(new Uint16Array(4), 2, 2);
  const o = new Ocean({ size: 10, segments: 2, heightTex: tex, terrainHalf: 64 });
  it('bobs within the wave amplitude and is calm on the beach', () => {
    let maxY = 0;
    for (let t = 0; t < 60; t++) {
      o.update(0.25);
      const s = o.sample(100, 37);
      maxY = Math.max(maxY, Math.abs(s.y));
      expect(Number.isFinite(s.tiltX)).toBe(true);
    }
    const ampSum = o.waves.reduce((a, w) => a + w.steep / ((2 * Math.PI) / w.len), 0);
    expect(maxY).toBeGreaterThan(0.05);
    expect(maxY).toBeLessThanOrEqual(ampSum + 1e-6);
    // ground just under the surface: waves are damped to nothing
    expect(Math.abs(o.sample(5, 5, 0.2).y)).toBeLessThan(1e-6);
  });
});

describe('frame stats + auto quality', () => {
  it('reports percentiles and long frames', () => {
    const s = new FrameStats(100);
    for (let i = 0; i < 90; i++) s.push(16.7);
    for (let i = 0; i < 10; i++) s.push(50);
    expect(s.pct(50)).toBeCloseTo(16.7, 1);
    expect(s.pct(95)).toBe(50);
    expect(s.long).toBe(10);
  });
  it('steps down one tier after sustained slow frames, never up by itself', () => {
    const seen: string[] = [];
    const a = new AutoQuality('alto', (t) => seen.push(t));
    for (let i = 0; i < 4; i++) a.sample(30);
    expect(seen).toEqual(['medio']);
    for (let i = 0; i < 20; i++) a.sample(8);
    expect(a.tier).toBe('medio');
  });
  it('every tier is fully specified', () => {
    for (const t of TIERS) expect(Object.values(QUALITY[t]).every((v) => v !== undefined)).toBe(true);
  });
});

describe('ambient life director', () => {
  function fakeCat(slug: string): PaperCat {
    const root = new THREE.Group();
    return { root, brain: new PuppetBrain(slug), facing: 1, lift: 0, ground: 0, height: 2 } as unknown as PaperCat;
  }
  function setup(hour: number, rain: number) {
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 30, 40);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    const p = (x: number, z: number) => new THREE.Vector3(x, heightAt(x, z), z);
    const spots: Spots = {
      home: { canelo: p(PADS.palm.x + 1.6, PADS.palm.z + 1.2), gelatino: p(-2, 20), cometin: p(10, 9) },
      shelters: [p(PADS.palm.x + 1.6, PADS.palm.z + 1.2)],
      shore: [p(0, 30)],
      iceCenter: p(PADS.ice.x, PADS.ice.z),
      cosmic: p(PADS.cosmic.x - 4.4, PADS.cosmic.z + 1.6),
      lava: p(PADS.fire.x + 3.6, PADS.fire.z + 2.2),
    };
    const world: LifeWorld = {
      time: 0,
      hour,
      night: hour > 20 || hour < 5 ? 1 : 0,
      rain,
      storm: 0,
      agents: [],
      obstacles: [],
      groundAt: heightAt,
      walkable,
      camera,
      fx: {},
    };
    const d = new LifeDirector(world, activities(spots));
    const add = (id: string, slug: string, tags: string[], energy = 0.8) =>
      d.add({ id, name: id, cat: fakeCat(slug), pos: spots.home[id].clone(), needs: { energy, play: 0, social: 0 }, traits: { playful: 0.2, curious: 0.5 }, tags: new Set(tags) });
    return { d, world, add };
  }
  it('Canelo goes to sleep under his palm when it rains', () => {
    const { d, add } = setup(13, 1);
    const canelo = add('canelo', 'canelo_cozy_cat', ['fire', 'canelo'], 0.3);
    add('gelatino', 'jelly_aquatic_cat', ['water']);
    for (let i = 0; i < 60 * 15; i++) d.update(1 / 60);
    expect(canelo.activity?.id).toBe('nap');
    expect(canelo.label).toContain('palmera');
  });
  it('water cats dance in the rain while others take cover; cosmic cats stargaze at night', () => {
    const rain = setup(13, 1);
    const g = rain.add('gelatino', 'jelly_aquatic_cat', ['water']);
    rain.d.update(1 / 60);
    expect(g.activity?.id).toBe('raindance');
    const night = setup(23, 0);
    const c = night.add('cometin', 'cometin_stardust_cat', ['cosmic'], 0.95);
    night.d.update(1 / 60);
    expect(c.activity?.id).toBe('stargaze');
  });
  it('agents never end up in deep water unless swimming', () => {
    const { d, add } = setup(10, 0);
    const a = add('canelo', 'canelo_cozy_cat', ['fire']);
    const b = add('cometin', 'cometin_stardust_cat', ['cosmic']);
    for (let i = 0; i < 60 * 40; i++) d.update(1 / 60);
    for (const x of [a, b]) if (!x.swimming) expect(heightAt(x.pos.x, x.pos.z)).toBeGreaterThan(0);
  });
});

describe('puppet brain regression', () => {
  it('deforms exactly as before for a seeded run (2D island, battle and 3D share this)', () => {
    let s = 12345;
    const real = Math.random;
    Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
    try {
      const b = new PuppetBrain('canelo_cozy_cat', { anchorX: 0.5, anchorY: 0.94 });
      let acc = 0;
      for (let f = 0; f < 400; f++) {
        if (f === 80) b.walk = 1;
        if (f === 160) b.emote('happy');
        if (f === 240) b.sleeping = true;
        if (f === 320) b.emote('attack');
        b.tick(1 / 60);
        if (f % 20 === 0) for (let i = 0; i < b.pos.length; i += 37) acc += b.pos[i] * ((i % 7) + 1);
      }
      expect(acc.toFixed(2)).toMatchSnapshot();
    } finally {
      Math.random = real;
    }
  });
});
