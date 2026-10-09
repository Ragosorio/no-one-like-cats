/** Portal (gacha) fixes: featured rate-up stays inside its rarities; risk pulls move the épico counter by 1. */
import { beforeEach, describe, expect, it } from 'vitest';
import { G, newGame } from '../src/state';
import { CATS } from '../src/data/content';
import { cs, gachaCats, rollCatDef } from '../src/state/sys/casino';
import { BANNERS, MODES, entryLabel, pityOf, pull, rankOf, ratesTable, tierOdds } from '../src/state/sys/gacha';

function late() {
  newGame();
  G.s.elements = [...new Set([...G.s.elements, 'earth', 'storm', 'magic', 'cosmic', 'void', 'ice', 'sound', 'shadow', 'time', 'light'])];
  G.s.campaign.bossesDefeated = 6;
  cs().tickets = 100000;
}
const rar = (id: string) => CATS.find((c) => c.id === id)!.rarity;

describe('gacha: featured cat', { timeout: 60_000 }, () => {
  beforeEach(late);

  it('a LEGENDARY featured cat never comes out of a raro/épico roll (was ~50%)', () => {
    const leg = gachaCats().find((c) => c.rarity === 'legendary')!;
    let featuredHits = 0;
    for (let i = 0; i < 4000; i++) {
      const d = rollCatDef(['rare', 'epic'], [0.45, 0.55], leg.id, 0.5, true);
      expect(['rare', 'epic']).toContain(d.rarity);
      if (d.id === leg.id) featuredHits++;
    }
    expect(featuredHits).toBe(0);
    // …and it still has its 50% inside the legendary roll
    let n = 0;
    for (let i = 0; i < 4000; i++) if (rollCatDef(['epic', 'legendary'], [0.35, 0.65], leg.id, 0.5, true).id === leg.id) n++;
    expect(n / 4000).toBeGreaterThan(0.4);
  });

  it('an ÉPICO featured cat keeps its 50% in the raro/épico line', () => {
    const ep = gachaCats().find((c) => c.rarity === 'epic')!;
    let n = 0;
    for (let i = 0; i < 4000; i++) if (rollCatDef(['rare', 'epic'], [0.45, 0.55], ep.id, 0.5, true).id === ep.id) n++;
    expect(n / 4000).toBeGreaterThan(0.45);
    expect(n / 4000).toBeLessThan(0.6);
  });

  it('HOLO banner: no pull below the legendary tier ever gives a legendary+ cat (3000 pulls)', () => {
    for (let i = 0; i < 300; i++) {
      const res = pull('holo', 10, 'tickets')!;
      for (const p of res) {
        if (p.got.kind !== 'cat' || rankOf(p.tier) >= 3) continue;
        expect(['common', 'rare', 'epic']).toContain(rar(p.got.ref!));
      }
    }
  });

  it('the odds table only promises the featured cat where it can appear', () => {
    const holo = BANNERS.find((b) => b.id === 'holo')!;
    const epicLine = holo.table.epic[0];
    const leg = gachaCats().find((c) => c.rarity === 'legendary')!;
    const ep = gachaCats().find((c) => c.rarity === 'epic')!;
    expect(entryLabel(epicLine, leg.id)).not.toContain('destacado 50%');
    expect(entryLabel(epicLine, ep.id)).toContain('destacado 50%');
    expect(ratesTable(holo).length).toBeGreaterThan(0);
  });
});

describe('gacha: risk modes and the épico counter', { timeout: 60_000 }, () => {
  beforeEach(late);

  it('a TODO O NADA / ALTO RIESGO pull moves the épico counter by 1 (and the legendary one by its cost)', () => {
    const b = BANNERS[0];
    let checked = 0;
    for (let i = 0; i < 400 && checked < 20; i++) {
      for (const mode of ['todo', 'riesgo'] as const) {
        const before = pityOf(b);
        const r = pull(b.id, 1, 'tickets', mode)!;
        const after = pityOf(b);
        const rank = rankOf(r[0].tier);
        if (rank < 2) {
          expect(after.e).toBe(before.e + 1);
          checked++;
        }
        if (rank < 3 && !r[0].escaped) expect(after.l).toBe(before.l + MODES[mode].cost);
      }
    }
    expect(checked).toBeGreaterThan(0);
    // and the next NORMAL pull is not secretly forced to épico by a risk pull
    // (both counters: after 400 risk pulls the legendary guarantee is full and the next pull is rightly 100% legendary)
    cs().pity[`${b.id}:e`] = 0;
    cs().pity[`${b.id}:l`] = 0;
    pull(b.id, 1, 'tickets', 'todo');
    const o = tierOdds(b);
    if (pityOf(b).e < b.epicPity - 1) expect(o.common + o.rare).toBeGreaterThan(0);
  });
});
