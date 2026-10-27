/**
 * PELÍCULAS — the engine side (Pixi objects, no GPU): the catalog and the implementations agree (styles, their bake
 * jobs, weather jobs, transitions), the PRE-BAKE list is complete (every job a film's manifest names is queued by
 * something), the post looks blend, the weather is a pure function of time and respects «Reducir movimiento», and
 * lightning goes through the FlashGuard («Reducir destellos» → soft).
 */
import { describe, expect, it } from 'vitest';
import '../src/core/pixiFixes';
import { STYLES, TRANSITIONS, WEATHER, CORE_BAKES } from '../src/film/catalog';
import { STYLE_MODULES } from '../src/film/styles';
import { KIND_ID, playedKind } from '../src/film/transitions';
import { WEATHER_JOBS, flashGrant, makeWeather, strikeEnv } from '../src/film/weather';
import { look, mixLook, NEUTRAL } from '../src/film/post';
import { bakeManifest } from '../src/film/timeline';
import { DEMO } from '../src/film/demo';
import { FlashGuard } from '../src/momentos/flash';
import { getFilm, filmIds } from '../src/film/registry';
import '../src/film/films';

/** a baker that only records the jobs it is given */
function fakeBaker() {
  const names: string[] = [];
  return { names, b: { add: (name: string) => void names.push(name), mark: (name: string) => void names.push(name) } };
}

describe('catalog ↔ implementation', () => {
  it('every catalog style has a module (look, cat bake) and every module is in the catalog', () => {
    expect(Object.keys(STYLE_MODULES).sort()).toEqual(Object.keys(STYLES).sort());
    for (const [id, m] of Object.entries(STYLE_MODULES)) {
      expect(m.id).toBe(id);
      expect(typeof m.catBake).toBe('function');
      expect(STYLES[id].bakes.some((j) => j.endsWith('cats')), `${id} has a cats job`).toBe(true);
    }
  });

  it('each style queues exactly its catalog jobs (the cats job is the stage’s)', () => {
    for (const [id, m] of Object.entries(STYLE_MODULES)) {
      const f = fakeBaker();
      m.prepare?.({ baker: f.b as never, tex: new Map(), params: {} });
      const want = STYLES[id].bakes.filter((j) => !j.endsWith('cats')).sort();
      expect(f.names.sort(), id).toEqual(want);
    }
  });

  it('every weather bake job is one bakeWeather knows; every transition kind has a shader branch', () => {
    for (const [kind, w] of Object.entries(WEATHER)) for (const j of w.bakes) expect(WEATHER_JOBS, `${kind}: ${j}`).toContain(j);
    expect(Object.keys(KIND_ID).sort()).toEqual(Object.keys(TRANSITIONS).sort());
    expect(new Set(Object.values(KIND_ID)).size).toBe(Object.keys(KIND_ID).length);
  });

  it('the PRE-BAKE list is complete: every job of the demo’s manifest is queued by the core, a style, the weather or the cats step', () => {
    const queued = new Set<string>(CORE_BAKES);
    for (const s of DEMO.scenes) {
      const id = typeof s.style === 'string' ? s.style : s.style.id;
      const f = fakeBaker();
      STYLE_MODULES[id].prepare?.({ baker: f.b as never, tex: new Map(), params: {} });
      for (const n of f.names) queued.add(n);
      queued.add(STYLES[id].bakes.find((j) => j.endsWith('cats'))!);
      for (const w of s.weather ?? []) for (const j of WEATHER[w.kind].bakes) if (WEATHER_JOBS.includes(j)) queued.add(j);
    }
    const missing = bakeManifest(DEMO).filter((j) => !queued.has(j));
    expect(missing).toEqual([]);
  });

  it('the demo is registered', () => {
    expect(filmIds()).toContain('demo');
    expect(getFilm('demo')).toBe(DEMO);
  });
});

describe('post looks', () => {
  it('a look is the neutral one plus overrides; blending lands on both ends', () => {
    const a = look({ grain: 0.1, mono: 1, tint: 0xff0000 });
    const b = look({ grain: 0.3, mono: 0, tint: 0x0000ff });
    expect(look().grain).toBe(NEUTRAL.grain);
    expect(mixLook(a, b, 0)).toEqual(a);
    expect(mixLook(a, b, 1).grain).toBeCloseTo(0.3, 9);
    expect(mixLook(a, b, 0.5).mono).toBeCloseTo(0.5, 9);
    expect(mixLook(a, b, 1).tint).toBe(0x0000ff);
  });
});

describe('weather and light', () => {
  const T = {};
  it('rain is a pure function of time (the same instant draws the same drops), with fewer drops under «Reducir movimiento»', () => {
    const fx = makeWeather({ kind: 'rain', amount: 1, seed: 3, ground: 800 }, T, 1)!;
    const frame = { amount: 1, cx: 960, cy: 540, rm: false, rf: false, density: 1 };
    const snap = () =>
      fx.node.children.map((c) => [c.visible, Math.round(c.position.x * 100), Math.round(c.position.y * 100)].join(','));
    fx.update(3.21, frame);
    const a = snap();
    fx.update(9.9, frame);
    fx.update(3.21, frame);
    expect(snap()).toEqual(a);
    const visible = () => fx.node.children.filter((c) => c.visible).length;
    fx.update(3.21, frame);
    const full = visible();
    fx.update(3.21, { ...frame, rm: true });
    expect(visible()).toBeLessThan(full * 0.75);
    expect(fx.ground).toBeTruthy();
    fx.destroy();
  });

  it('wind / snow / fog / rays build and update without a renderer; heat is the post’s', () => {
    for (const spec of [
      { kind: 'wind' as const, particle: 'leaf' },
      { kind: 'snow' as const },
      { kind: 'fog' as const },
      { kind: 'rays' as const },
      { kind: 'lightning' as const, strikes: [1] },
      { kind: 'heat' as const },
    ]) {
      const fx = makeWeather(spec, T, 0.5);
      expect(fx, spec.kind).toBeTruthy();
      fx!.update(1.05, { amount: 1, cx: 960, cy: 540, rm: true, rf: true, density: 0.5 });
      fx!.destroy();
    }
  });

  it('lightning: a deterministic envelope, and the full-screen flash goes through the FlashGuard («Reducir destellos» → soft)', () => {
    expect(strikeEnv([2], 1.99)).toBe(0);
    expect(strikeEnv([2], 2.03)).toBe(1);
    expect(strikeEnv([2], 2.1)).toBeLessThan(0.5);
    expect(strikeEnv([2], 2.15)).toBeGreaterThan(0.5);
    expect(strikeEnv([2], 3.2)).toBe(0);
    const g = new FlashGuard(false);
    expect(flashGrant(g, 1, false)).toBe('full');
    expect(flashGrant(new FlashGuard(true), 1, true)).toBe('soft');
    expect(flashGrant(g, 1.1, true)).toBe('soft');
    // never more than 3 full flashes a second
    const g2 = new FlashGuard(false);
    const grants = [0, 0.1, 0.2, 0.3, 0.4].map((m) => flashGrant(g2, m, false));
    expect(grants.filter((x) => x === 'full').length).toBe(3);
  });

  it('«Reducir movimiento» plays a dissolve for every travelling transition', () => {
    expect(playedKind({ kind: 'pageTurn', dur: 1 }, true)).toBe('dissolve');
    expect(playedKind({ kind: 'pageTurn', dur: 1 }, false)).toBe('pageTurn');
    expect(playedKind({ kind: 'fade', dur: 1 }, true)).toBe('fade');
  });
});
