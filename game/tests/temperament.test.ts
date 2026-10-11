/**
 * Purposeful motion (docs/part-ii/31-animaciones-con-proposito.md): every species resolves a temperament and a weight,
 * the defaults hold, the primordials are heavy and solemn, Canelo has his own, every reaction/quirk builds a sane
 * intent, «reducir movimiento» switches it all off, and the driver rolls its OWN dice (never Math.random, never the sim's).
 */
import { describe, expect, it, vi } from 'vitest';
import { Container } from 'pixi.js';
import { CATS, CONTENT } from '../src/data/content';
import {
  CANELO,
  DEFAULT_TEMPERAMENT,
  EVENT_KINDS,
  TEMPERAMENTS,
  motionAmount,
  motionProfile,
  type Quirk,
  type Reaction,
} from '../src/art/temperament';
import { CHANNELS, IntentDriver, arriveIntent, departIntent, hopIntent, quirkIntent, reactionIntent, sample, type Intent } from '../src/art/intent';
import { Rng } from '../src/core/rng';

const REACTIONS: Reaction[] = ['flinch', 'hide', 'brace', 'advance', 'gawk', 'bounce', 'cheer', 'puff', 'pounce', 'late', 'glare', 'preen', 'nod', 'loom', 'swat', 'zoom', 'ignore'];
const QUIRKS: Quirk[] = ['tap', 'pounce', 'glance', 'sniff', 'puff', 'preen', 'nod', 'stretch', 'zoom', 'flare', 'glare', 'scan', 'sigh', 'loom', 'bow', 'swat'];

function fakeBody() {
  const pose = { lean: 0, crouch: 0, headDy: 0, headA: 0, look: 0 };
  const calls: string[] = [];
  const puppet = { pose, destroyed: false, emote: (k: string) => calls.push('emote:' + k), doAct: (k: string) => calls.push('act:' + k) };
  const body = new Container();
  const lifted = new Container();
  return { pose, calls, body, lifted, ib: { puppet, body, lifted, size: 104 } };
}

/** every value an intent can produce stays finite and modest (no cat folds in half) */
function checkIntent(it: Intent) {
  expect(it.dur).toBeGreaterThan(0);
  expect(it.dur).toBeLessThan(8);
  for (const ch of CHANNELS) {
    const keys = it.tracks[ch];
    if (!keys) continue;
    for (let t = 0; t <= it.dur; t += 0.02) {
      const v = sample(keys, t);
      expect(Number.isFinite(v)).toBe(true);
      const lim = ch === 'headDy' ? 16 : ch === 'lift' ? 0.6 : ch === 'sx' || ch === 'sy' ? 0.3 : 1.2;
      expect(Math.abs(v)).toBeLessThanOrEqual(lim);
    }
    // it ends at rest
    expect(Math.abs(sample(keys, it.dur + 1))).toBeLessThan(1e-6);
  }
}

describe('every species resolves a motion profile', () => {
  it('the 14 traits of content.json all have a temperament', () => {
    for (const t of CONTENT.traits) expect(TEMPERAMENTS[t.id], t.id).toBeDefined();
  });
  it(`all ${CATS.length} species resolve (trait temperament, weight, reactions for every event)`, () => {
    expect(CATS.length).toBeGreaterThanOrEqual(120);
    for (const c of CATS) {
      const p = motionProfile(c.id);
      expect(p.species).toBe(c.id);
      expect(p.weight.mass).toBeGreaterThan(0.5);
      expect(p.weight.squash).toBeGreaterThan(0.3);
      expect(p.weight.inertia).toBeGreaterThan(0.7);
      expect(p.temperament.tempo).toBeGreaterThan(0.5);
      expect(p.temperament.latency[0]).toBeLessThanOrEqual(p.temperament.latency[1]);
      expect(p.temperament.quirks.length).toBeGreaterThan(0);
      for (const k of EVENT_KINDS) expect(REACTIONS).toContain(p.temperament.react[k]);
      if (c.id !== 'c_canelo' && !c.primordial) expect(p.temperament).toBe(TEMPERAMENTS[c.trait] ?? DEFAULT_TEMPERAMENT);
    }
  });
  it('an unknown species gets the default house cat (never throws)', () => {
    const p = motionProfile('zz_no_existe');
    expect(p.temperament).toBe(DEFAULT_TEMPERAMENT);
    expect(p.weight.mass).toBe(1);
    expect(p.solemn).toBe(false);
    expect(p.signature).toBeNull();
  });
});

describe('Canelo and the primordials', () => {
  it('Canelo has his own repertoire (swat, zoomies, foot-tapping) and is the quickest to react', () => {
    const p = motionProfile('c_canelo');
    expect(p.signature).toBe('canelo');
    expect(p.temperament).toBe(CANELO);
    expect(p.temperament.id).toBe('canelo');
    expect(p.temperament.quirks).toEqual(expect.arrayContaining(['swat', 'zoom', 'tap']));
    expect(p.temperament.react.wonder).toBe('swat');
    for (const c of CATS) if (c.id !== 'c_canelo') expect(motionProfile(c.id).temperament.latency[1]).toBeGreaterThanOrEqual(p.temperament.latency[1]);
  });
  it('every primordial is heavy, slow, never hops on its own and reacts with dignity', () => {
    const prims = CATS.filter((c) => c.primordial);
    expect(prims.length).toBeGreaterThanOrEqual(13);
    for (const c of prims) {
      const p = motionProfile(c.id);
      const base = TEMPERAMENTS[c.trait] ?? DEFAULT_TEMPERAMENT;
      expect(p.solemn).toBe(true);
      expect(p.weight.mass).toBeGreaterThanOrEqual(1.8);
      expect(p.temperament.hopEvery).toBeNull();
      expect(p.temperament.tempo).toBeGreaterThan(base.tempo);
      expect(p.temperament.bounce).toBeLessThan(base.bounce);
      for (const k of EVENT_KINDS) expect(['flinch', 'hide', 'bounce', 'cheer', 'pounce', 'swat', 'zoom']).not.toContain(p.temperament.react[k]);
    }
  });
  it('a primordial gathers itself slower and lands with more inertia than a common cat', () => {
    const light = hopIntent(motionProfile('c_chispa'));
    const heavy = hopIntent(motionProfile('l_gea'));
    expect(heavy.dur).toBeGreaterThan(light.dur);
    const peak = (it: Intent) => Math.max(...Array.from({ length: 200 }, (_, i) => sample(it.tracks.lift!, (i / 200) * it.dur)));
    expect(peak(heavy)).toBeLessThan(peak(light));
  });
});

describe('every reaction and quirk builds a sane intent for every kind of cat', () => {
  const who = ['c_canelo', 'l_ignis', 'c_lunita', 'c_chispa', 'c_nimbo', 'zz_no_existe'];
  it('reactions', () => {
    for (const id of who) for (const r of REACTIONS) for (const dir of [1, -1]) checkIntent(reactionIntent(r, motionProfile(id), new Rng(7), dir));
  });
  it('quirks, hops, depart and arrive', () => {
    for (const id of who) {
      const p = motionProfile(id);
      for (const q of QUIRKS) checkIntent(quirkIntent(q, p, new Rng(3)));
      checkIntent(hopIntent(p));
      checkIntent(hopIntent(p, { double: true, forward: 1 }));
      checkIntent(departIntent(p));
      checkIntent(arriveIntent(p, 1.9));
    }
  });
});

describe('the driver', () => {
  it('«reducir movimiento» switches it off: nothing plays, the pose stays at rest', () => {
    expect(motionAmount(true)).toBe(0);
    expect(motionAmount(false)).toBe(1);
    const f = fakeBody();
    const d = new IntentDriver(f.ib, motionProfile('c_canelo'), 'uid-1');
    d.posture = 1;
    expect(d.play(hopIntent(d.profile), motionAmount(true))).toBe(false);
    for (let i = 0; i < 30; i++) d.update(1 / 12, motionAmount(true));
    expect(d.busy).toBe(false);
    expect(f.pose).toEqual({ lean: 0, crouch: 0, headDy: 0, headA: 0, look: 0 });
    expect(f.lifted.y).toBe(0);
    expect(f.body.scale.x).toBe(1);
    expect(f.calls).toEqual([]);
  });
  it('plays anticipation → action → settle and puts the body back at rest', () => {
    const f = fakeBody();
    const d = new IntentDriver(f.ib, motionProfile('c_chispa'), 'uid-2');
    expect(d.play(hopIntent(d.profile), 1)).toBe(true);
    let minCrouchFirst = 0;
    let lifted = 0;
    for (let i = 0; i < 2; i++) {
      d.update(1 / 30, 1);
      minCrouchFirst = Math.max(minCrouchFirst, f.pose.crouch);
    }
    expect(minCrouchFirst).toBeGreaterThan(0.3); // it crouches BEFORE it leaves the ground
    expect(f.lifted.y).toBe(0);
    for (let i = 0; i < 60; i++) {
      d.update(1 / 30, 1);
      lifted = Math.min(lifted, f.lifted.y);
    }
    expect(lifted).toBeLessThan(-10);
    expect(f.calls).toContain('emote:happy');
    expect(d.busy).toBe(false);
    expect(f.lifted.y).toBe(0);
    expect(f.body.scale.x).toBe(1);
    expect(f.body.scale.y).toBe(1);
    expect(f.pose.crouch).toBe(0);
  });
  it('rolls its own seeded dice: same uid, same choices; never Math.random', () => {
    const spy = vi.spyOn(Math, 'random');
    const run = (uid: string) => {
      const f = fakeBody();
      const d = new IntentDriver(f.ib, motionProfile('c_lunita'), uid);
      const seq: number[] = [];
      for (let i = 0; i < 5; i++) {
        d.play(reactionIntent('hide', d.profile, d.rng), 1);
        for (let k = 0; k < 40; k++) d.update(1 / 12, 1);
        seq.push(+d.rng.next().toFixed(6));
      }
      return seq;
    };
    const a = run('gato-a');
    expect(run('gato-a')).toEqual(a);
    expect(run('gato-b')).not.toEqual(a);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
  it('the temperament posture eases in while free and out when motion is off', () => {
    const f = fakeBody();
    const d = new IntentDriver(f.ib, motionProfile('l_astraprima'), 'uid-3');
    d.posture = 1;
    for (let i = 0; i < 40; i++) d.update(1 / 12, 1);
    expect(f.pose.headDy).toBeLessThan(-1); // chin up
    d.update(1 / 12, 0);
    expect(f.pose.headDy).toBe(0);
  });
});
