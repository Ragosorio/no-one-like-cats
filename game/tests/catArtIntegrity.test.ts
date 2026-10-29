/**
 * Cat art integrity (ARTE-INTEG, Parte III arte v2 — docs/part-iii/agentes/ARTE-INTEG.md):
 * every painting is a PAIR (full + lite SVG), listed in both MAI manifests, and has a rig; every rig points at a
 * painting (Luzterna's lives in story/). For the Parte III v2 paintings the manifests must match the files byte for
 * byte, the SVGs must be pure vectors (no <image>, no scripts) and the rigs must be sane (the head ellipse holds the
 * ear bases, eyes sit inside the 700×700 painting) — the lessons of their integration, kept as a guard.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { PINNED_SHARD } from '../src/art/artShardPins';

const at = (p: string) => new URL(`../${p}`, import.meta.url);
const svgs = (dir: string) => new Set(readdirSync(at(dir)).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4)));
const FULL = svgs('public/cats-svg');
const LITE = svgs('public/cats-svg/lite');
const EXPORT = JSON.parse(readFileSync(at('public/cats-svg/game-export.json'), 'utf8')).files as Record<string, { bytesIn: number; bytesOut: number; preset?: string }>;
const THUMBS = JSON.parse(readFileSync(at('public/cats-svg/lite/game-thumbs.json'), 'utf8')).files as Record<string, { bytes: number; paths: number; premultipliedRgbMae: number }>;
type Rig = { head: number[]; neck: number[]; ears: number[][]; eyes: number[][]; tail: { pts: number[][]; r: number } | null; floats: number[][]; pins?: number[][] };
const RIGS = JSON.parse(readFileSync(at('src/data/catRigs.json'), 'utf8')) as Record<string, Rig>;
/** paintings with a rig that are not cats-svg (story art) */
const NOT_CATS_SVG = new Set(['luzterna']);

/** Parte III arte v2, integrated 2026-10-27: W1 (21), natives (8), pilot (3) + the story characters of Fase 2 (Cerito ×2, Itō) */
const P3_V2_ART = [
  'homiau_donut_cat', 'murciegato_cowl_cat', 'gatarana_web_cat', 'ovillo_yarnarms_cat', 'estambre_yarnstorm_cat', 'supersiames_aura_cat',
  'harrygatter_wand_cat', 'emiau_rapper_cat', 'gatomalo_bunny_cat', 'tailor_eras_cat', 'maneki_janitor_cat', 'bigoton_rival_cat',
  'sonrisa_grin_cat', 'sirsimon_ghost_cat', 'garbancito_tiny_cat', 'gatzilla_kaiju_cat', 'gatoconda_smile_cat', 'gritito_scream_cat',
  'gatarana_noir_cat', 'gatarana_blanca_cat', 'gatarana_2099_cat',
  'cadenero_bouncer_cat', 'borron_inkblot_cat', 'lobo_grandma_cat', 'encuadernadora_needle_cat', 'manager_backstage_cat', 'gatemson_editor_cat',
  'bocina_boombox_cat', 'scratch_dj_cat',
  'vangato_sunflower_cat', 'billie_whisper_cat', 'comecroquetas_pellet_cat',
  'cerito_static_cat', 'cerito_fur_cat', 'ito_threads_cat',
];

describe('every cat painting is complete', () => {
  it('full and lite come in pairs', () => {
    expect([...FULL].filter((s) => !LITE.has(s))).toEqual([]);
    expect([...LITE].filter((s) => !FULL.has(s))).toEqual([]);
  });
  it('both MAI manifests list exactly the paintings on disk (a merge never clobbers them)', () => {
    expect(Object.keys(EXPORT).sort()).toEqual([...FULL].sort());
    expect(Object.keys(THUMBS).sort()).toEqual([...LITE].sort());
  });
  it('every painting has a rig and every rig has its painting', () => {
    expect([...FULL].filter((s) => !RIGS[s])).toEqual([]);
    expect(Object.keys(RIGS).filter((s) => !NOT_CATS_SVG.has(s) && !FULL.has(s))).toEqual([]);
  });
});

describe('Parte III arte v2 (35 paintings)', () => {
  it('no versioned slugs left (murciegato v5, gato malo v2, estambre v2 live under the clean name)', () => {
    expect(new Set(P3_V2_ART).size).toBe(35);
    for (const s of P3_V2_ART) expect(s, s).not.toMatch(/_v\d+$|_bal$/);
    for (const s of FULL) expect(s, s).not.toMatch(/_v\d+$|_bal$/);
  });
  it('files, manifests and rigs are all there; manifests match the files byte for byte', () => {
    for (const s of P3_V2_ART) {
      expect(FULL.has(s) && LITE.has(s), s).toBe(true);
      expect(statSync(at(`public/cats-svg/${s}.svg`)).size, `${s} full`).toBe(EXPORT[s].bytesOut);
      expect(statSync(at(`public/cats-svg/lite/${s}.svg`)).size, `${s} lite`).toBe(THUMBS[s].bytes);
      expect(THUMBS[s].premultipliedRgbMae, `${s} lite MAE gate`).toBeLessThan(22);
      expect([undefined, 'balanced-color-preserved'], s).toContain(EXPORT[s].preset);
    }
  });
  it('pure vectors: no raster, no scripts', () => {
    for (const s of P3_V2_ART)
      for (const f of [`public/cats-svg/${s}.svg`, `public/cats-svg/lite/${s}.svg`]) {
        const src = readFileSync(at(f), 'utf8');
        expect(/<image\b/i.test(src), f).toBe(false);
        expect(/<script\b|\son[a-z]+\s*=|javascript:/i.test(src), f).toBe(false);
      }
  });
  it('rigs are sane: ear bases inside the head, eyes and tail inside the painting', () => {
    const inside = (x: number, y: number) => x >= 0 && x <= 700 && y >= 0 && y <= 700;
    for (const s of P3_V2_ART) {
      const r = RIGS[s];
      const [hx, hy, rx, ry] = r.head;
      for (const [bx, by] of r.ears.slice(0, 2)) expect(Math.hypot((bx - hx) / rx, (by - hy) / ry), `${s} ear base`).toBeLessThanOrEqual(1);
      for (const e of r.eyes) {
        expect(e[0] < e[2] && e[1] < e[3], `${s} eye box`).toBe(true);
        expect(inside(e[0], e[1]) && inside(e[2], e[3]), `${s} eye`).toBe(true);
        expect(Math.hypot(((e[0] + e[2]) / 2 - hx) / rx, ((e[1] + e[3]) / 2 - hy) / ry), `${s} eye in head`).toBeLessThan(1);
      }
      expect(r.eyes.length, `${s} has two eyes`).toBe(2);
      expect(r.tail && r.tail.pts.every(([x, y]) => inside(x, y)), `${s} tail`).toBe(true);
      for (const [x, y] of [...r.floats, ...(r.pins ?? [])]) expect(inside(x, y), `${s} prop`).toBe(true);
    }
  });
  it('Sir Simón: the breastplate stain is wine purple, not blood red (full and lite)', () => {
    // the recolored stain colors (scratch tool recolor.mjs, 2026-10-27); the original reds are gone from the stain
    expect(readFileSync(at('public/cats-svg/sirsimon_ghost_cat.svg'), 'utf8')).toContain('fill="#592643"');
    expect(readFileSync(at('public/cats-svg/lite/sirsimon_ghost_cat.svg'), 'utf8')).toContain('fill="#6D2E52"');
  });
  it('Cerito: static and fur are the same drawing (same rig, same canvas) so a film can cross-fade them', () => {
    expect(RIGS.cerito_static_cat).toEqual(RIGS.cerito_fur_cat);
    for (const f of ['cerito_static_cat', 'cerito_fur_cat']) expect(readFileSync(at(`public/cats-svg/lite/${f}.svg`), 'utf8')).toMatch(/viewBox="0 0 240 240"/);
  });
});

/** post-Parte III batch (ARTE-POST, docs/post-p3/agentes/ARTE-POST.md): every painting of the batch is pinned to art site 1 */
const POST_ART = [...PINNED_SHARD].filter(([, k]) => k === 1).map(([s]) => s);
describe('post-Parte III art (pinned to art site 1)', () => {
  it('files, manifests and rigs are there; manifests match the files byte for byte', () => {
    for (const s of POST_ART) {
      expect(FULL.has(s) && LITE.has(s) && !!RIGS[s], s).toBe(true);
      expect(s, s).not.toMatch(/_v\d+$|_bal$/);
      expect(statSync(at(`public/cats-svg/${s}.svg`)).size, `${s} full`).toBe(EXPORT[s].bytesOut);
      expect(statSync(at(`public/cats-svg/lite/${s}.svg`)).size, `${s} lite`).toBe(THUMBS[s].bytes);
      expect(THUMBS[s].premultipliedRgbMae, `${s} lite MAE gate`).toBeLessThan(22);
      expect([undefined, 'balanced-color-preserved'], s).toContain(EXPORT[s].preset);
    }
  });
  it('pure vectors: no raster, no scripts', () => {
    for (const s of POST_ART)
      for (const f of [`public/cats-svg/${s}.svg`, `public/cats-svg/lite/${s}.svg`]) {
        const src = readFileSync(at(f), 'utf8');
        expect(/<image\b/i.test(src), f).toBe(false);
        expect(/<script\b|\son[a-z]+\s*=|javascript:/i.test(src), f).toBe(false);
      }
  });
  it('rigs are sane: ear bases inside the head, two eyes inside it, tail and props inside the painting', () => {
    const inside = (x: number, y: number) => x >= 0 && x <= 700 && y >= 0 && y <= 700;
    for (const s of POST_ART) {
      const r = RIGS[s];
      const [hx, hy, rx, ry] = r.head;
      for (const [bx, by] of r.ears.slice(0, 2)) expect(Math.hypot((bx - hx) / rx, (by - hy) / ry), `${s} ear base`).toBeLessThanOrEqual(1);
      expect(r.eyes.length, `${s} has two eyes`).toBe(2);
      for (const e of r.eyes) {
        expect(e[0] < e[2] && e[1] < e[3], `${s} eye box`).toBe(true);
        expect(inside(e[0], e[1]) && inside(e[2], e[3]), `${s} eye`).toBe(true);
        expect(Math.hypot(((e[0] + e[2]) / 2 - hx) / rx, ((e[1] + e[3]) / 2 - hy) / ry), `${s} eye in head`).toBeLessThan(1);
      }
      expect(r.tail && r.tail.pts.every(([x, y]) => inside(x, y)), `${s} tail`).toBe(true);
      for (const [x, y] of [...r.floats, ...(r.pins ?? [])]) expect(inside(x, y), `${s} prop`).toBe(true);
    }
  });
});
