/**
 * RAREZAS FINITAS (docs/part-iii/mecanicas-v2/03-plan-implementacion.md §1.5 and etapa 2): every rarity — the seven of
 * `rarities.order` AND the Parte III MULTIDIMENSIONAL (P3_MULTIDIM, on since 2026-10-27) — has an entry in every table the game
 * reads by rarity, so a cat of it never computes a silent NaN for its Poder, gold, food, orbs or gems (econ.ts reads
 * `B.rarities.*[r]` without a default). Also: one single RARITY_H (there were six copies, one of them partial), every
 * RARITY_* table complete, the flag off leaves the game's order untouched, and the pools never give a Multidimensional.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

const { G } = await import('../src/state');
const { SAVE_KEY } = await import('../src/core/save');
const E = await import('../src/state/econ');
const { RARITY } = await import('../src/ui/theme');
const { RARITY_H, rarityHeight } = await import('../src/art/rarityHeight');
const MD = await import('../src/state/sys/multidim');
const { CATS, CAT_BY_ID } = await import('../src/data/content');
const { eligibleCats, gachaCats } = await import('../src/state/sys/casino');
const { RARITY_ORDER } = await import('../src/state/ext/collection');
type RarityId = import('../src/state/econ').RarityId;

const ALL: RarityId[] = [...(E.BAL.rarities.order as RarityId[]), 'multidimensional'];
const fin = (v: number) => Number.isFinite(v) && v > 0;

afterEach(() => {
  MD.P3_MULTIDIM.on = true;
});

describe('every rarity table answers a finite number for every rarity', () => {
  it('Poder, gold, food, star orbs, duplicate orbs, discovery gems, hatch XP — finite and > 0 at every level / ★', () => {
    const bad: string[] = [];
    for (const r of ALL)
      for (const level of [1, 10, 25, 49, 50, 51, 75, 100])
        for (const stars of [1, 2, 3, 4, 5, 6]) {
          const vals: Record<string, number> = { catPower: E.catPower(r, level, stars), catGoldPerSec: E.catGoldPerSec(r, level, stars), feedCost: E.feedCost(level, r), starOrbs: E.starOrbs(r, Math.min(stars, 5)), duplicateOrbs: E.duplicateOrbs(r), discoveryGems: E.discoveryGems(r), hatchXp: E.xpPct('hatch', r) };
          for (const [k, v] of Object.entries(vals)) if (!fin(v)) bad.push(`${k}(${r}, Nv${level}, ★${stars}) = ${v}`);
        }
    expect(bad).toEqual([]);
  });

  it('balance.json: every per-rarity table has every rarity (except the Resonance times: only what it can hatch)', () => {
    const t = E.BAL.rarities as unknown as Record<string, Record<string, unknown>>;
    for (const table of ['names', 'gold_base_per_s', 'power_base', 'food_mult', 'duplicate_orbs', 'star_orbs_base', 'discovery_gems']) for (const r of ALL) expect(t[table][r], `${table}.${r}`).toBeDefined();
    // the Resonance hatches common…legendary only (resonance.ts pools): never a mythic+, never a Multidimensional
    for (const r of ['common', 'rare', 'epic', 'legendary']) expect(fin(Number(t.resonance_time_s[r])), r).toBe(true);
    expect(t.resonance_time_s.multidimensional).toBeUndefined();
  });

  it('the interface and the regions know every rarity (theme, print, height, collection order)', () => {
    for (const r of ALL) {
      expect((RARITY as Record<string, { name: string }>)[r]?.name, r).toBeTruthy();
      expect(fin(RARITY_H[r]), `RARITY_H.${r}`).toBe(true);
      expect(fin(rarityHeight(r))).toBe(true);
      expect(RARITY_ORDER).toContain(r);
    }
    expect(rarityHeight('rara_inventada')).toBe(2.5);
  });

  it('one RARITY_H for the whole game (no local copies), and every other RARITY_* table covers every rarity', () => {
    const SRC = fileURLToPath(new URL('../src/', import.meta.url));
    const walk = (d: string, out: string[] = []) => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p, out);
        else if (p.endsWith('.ts')) out.push(p);
      }
      return out;
    };
    const defs: string[] = [];
    const partial: string[] = [];
    for (const f of walk(SRC)) {
      const code = readFileSync(f, 'utf8');
      for (const m of code.matchAll(/const (RARITY_[A-Z_]+)\s*:\s*Record<[^>]+>\s*=\s*\{([^}]*)\}/g)) {
        defs.push(`${m[1]} @ ${f.slice(SRC.length)}`);
        const missing = ALL.filter((r) => !new RegExp(`\\b${r}\\s*:`).test(m[2]));
        if (missing.length) partial.push(`${m[1]} @ ${f.slice(SRC.length)}: le falta ${missing.join(', ')}`);
      }
    }
    expect(defs.filter((d) => d.startsWith('RARITY_H ')).map((d) => d.split(' @ ')[1])).toEqual(['art/rarityHeight.ts']);
    expect(partial).toEqual([]);
  });
});

describe('P3_MULTIDIM (ON since 2026-10-27, GATOS-DATOS): the Multidimensionals with approved art', () => {
  it('on by default: the 9 with art + the 16 reference cats of the Parte III (2026-10-28, the owner); the dormant slots have none', () => {
    MD.P3_MULTIDIM.on = true;
    // (the post-Parte III Multidimensionals have their own checks: tests/postp3.test.ts, data/postp3/especies.json)
    const md = CATS.filter((c) => c.rarity === ('multidimensional' as string) && !MD.isPostCat(c)).map((c) => c.id);
    expect(md).toEqual(['x_homiau', 'c_gritito', 'e_ovillo', 'x_gatarana', 'r_gatemson', 'x_murciegato', 'e_estambre', 'r_gatarana_noir', 'r_gatarana_blanca', 'r_gatarana_2099', 'l_gatzilla', 'l_bigoton', 'x_supersiames', 'e_comecroquetas', 'x_harrygatter', 'r_garbancito', 'e_sirsimon', 'e_sonrisa', 'e_gatoconda', 'l_emiau', 'x_gatomalo', 'x_tailorswift', 'x_billiebigotish', 'x_vangato', 'e_maneki']);
    // Michi-Wan, Lince, Bastet and El Michito del Barril wait for their art (02-catalogo-v2 §1.2): no species
    for (const id of ['x_michiwan', 'x_lince', 'x_bastet', 'x_michavo']) expect(CAT_BY_ID.has(id), id).toBe(false);
    for (const id of md) expect(existsSync(new URL(`../public/cats-svg/lite/${CAT_BY_ID.get(id)!.art.slug}.svg`, import.meta.url)), id).toBe(true);
  });

  it('off (runtime): the game’s order is exactly rarities.order', () => {
    MD.P3_MULTIDIM.on = false;
    expect(MD.rarityOrder()).toEqual(E.BAL.rarities.order);
    expect(MD.categoryOrder()).toEqual(E.BAL.rarities.order);
    expect(MD.rarityRank('multidimensional')).toBe(-1);
  });

  it('on: between legendary and mythic in power; LAST in the interface’s categories', () => {
    MD.P3_MULTIDIM.on = true;
    const o = MD.rarityOrder();
    expect(o.indexOf('multidimensional')).toBe(o.indexOf('legendary') + 1);
    expect(o.indexOf('mythic')).toBe(o.indexOf('multidimensional') + 1);
    expect(MD.categoryOrder().at(-1)).toBe('multidimensional');
    expect(MD.rarityRank('legendary', true)).toBe(o.indexOf('legendary') + 0.5);
  });

  it('a Multidimensional never comes out of the Casino, the Portal nor the Resonance', () => {
    mem.clear();
    mem.set(SAVE_KEY, readFileSync(new URL('../test-saves/h65-normal.json', import.meta.url), 'utf8'));
    G.load();
    // a legendary the casino CAN give in this save (so the test proves it would see a cat that's eligible)
    const base = eligibleCats().find((c) => c.rarity === 'legendary')!;
    expect(base).toBeTruthy();
    const fake = { ...base, id: 'x_prueba', rarity: 'multidimensional', name: 'Prueba' } as typeof base;
    CATS.push(fake);
    CAT_BY_ID.set(fake.id, fake);
    try {
      expect(eligibleCats().some((c) => c.id === 'x_prueba')).toBe(false);
      expect(gachaCats().some((c) => c.id === 'x_prueba')).toBe(false);
      expect(MD.poolable('multidimensional')).toBe(false);
      expect(MD.poolable('legendary')).toBe(true);
      // the same cat as a legendary IS in the pool (the check can see an eligible cat)
      expect(eligibleCats().some((c) => c.id === base.id)).toBe(true);
      // and no real cat of the Parte III boxes is in any pool (GATOS-DATOS: multidim.ts isP3Cat)
      expect(eligibleCats().filter((c) => c.obtain.source.startsWith('p3:'))).toEqual([]);
      expect(gachaCats().filter((c) => c.obtain.source.startsWith('p3:'))).toEqual([]);
    } finally {
      CATS.splice(CATS.indexOf(fake), 1);
      CAT_BY_ID.delete(fake.id);
    }
  });
});
