/**
 * SISTEMA-2 (owner 2026-10-29, ⚠️ spoilers of the Parte III):
 *   A · MODO ETERNO: LA SUERTE ETERNA also drops boletos, gems, pescaditos and gold into the botín; the botín holds every
 *       currency, doubles whole, pays whole on a WIN and is lost on a LOSS. An OLD save's open session (pot without its
 *       multi-currency part) still resolves exactly as before.
 *   B · the MULTIVERSO DESBORDADO banner: it doesn't exist before the Parte III; after it every legendary / mythic result
 *       is a post Multidimensional, with printed odds, its own counters and guarantees; the one-time notice.
 *   C · a Multiverse cat that comes out of a legendary / mythic roll SHOWS its own rarity (never the gold it was rolled as).
 * Every post cat here is a STUB (tests/helpers/postStubs.ts); the shipped ones step out so the pools are exact.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

const { G } = await import('../src/state');
const { SAVE_KEY } = await import('../src/core/save');
const { CAT_BY_ID } = await import('../src/data/content');
const R = await import('../src/data/postp3/reglas');
const P = await import('../src/state/sys/postp3');
const MD = await import('../src/state/sys/multidim');
const CS = await import('../src/state/sys/casino');
const GA = await import('../src/state/sys/gacha');
const ET = await import('../src/state/sys/casino/eterno');
const V = await import('../src/state/sys/postVitrina');
const AV = await import('../src/state/sys/multiversoAviso');
const { RARITY } = await import('../src/ui/theme');
const { markBeat } = await import('../src/state/ext/story');
const { CONTINUARA_BEAT } = await import('../src/state/sys/gaterasWorld');
const { stubPostCat, injectPostCats, hideShippedPostCats } = await import('./helpers/postStubs');
type CatDef = import('../src/data/content').CatDef;

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const fixture = (name: string) => readFileSync(new URL(`../test-saves/${name}.json`, import.meta.url), 'utf8');
function load(name: string) {
  mem.clear();
  mem.set(SAVE_KEY, fixture(name));
  G.load();
  if (!G.loaded) throw new Error(`${name} no carga`);
}
const finish = () => markBeat(CONTINUARA_BEAT);

let undo: (() => void)[] = [];
const inject = (defs: CatDef[]) => {
  undo.push(injectPostCats(defs));
  return defs;
};
beforeEach(() => {
  undo.push(hideShippedPostCats());
});
afterEach(() => {
  for (const u of undo.splice(0).reverse()) u();
  vi.restoreAllMocks();
});

/** a known save with a bit of every balance */
function rich() {
  load('h93-final');
  G.s.gold = 50_000.5;
  G.s.gems = 300;
  G.s.food = 7000;
  const c = CS.cs();
  c.tickets = 40;
  c.chips = 2000;
}

// ------------------------------------------------------------------ A · the Eterno's botín
describe('A · MODO ETERNO: the botín holds every currency', { timeout: 120_000 }, () => {
  beforeEach(rich);

  it('a drop of the table currency joins the main number; any other one the multi-currency part; ×2 doubles all of it', () => {
    const s = ET.startEterno('slot');
    ET.addDrop(s.id, { field: 'tickets', n: 3 }); // before the lock: nothing
    expect(ET.eternoState().open?.pot).toBeUndefined();
    ET.lockEterno(s.id, 'chips');
    ET.addLuck(s.id, 100);
    ET.addDrop(s.id, { field: 'chips', n: 5 });
    ET.addDrop(s.id, { field: 'tickets', n: 3 });
    ET.addDrop(s.id, { field: 'gems', n: 2 });
    ET.addDrop(s.id, { field: 'food', n: 120.5 });
    ET.addDrop(s.id, { field: 'gold', n: 900 });
    ET.addDrop('et-otra', { field: 'gems', n: 50 }); // another session: nothing
    ET.addDrop(s.id, { field: 'gems', n: -4 }); // garbage: nothing
    ET.addDrop(s.id, { field: 'orbs' as never, n: 9 }); // not a currency at risk: nothing
    const pot = ET.eternoState().open!.pot!;
    expect(pot).toMatchObject({ cur: 'chips', amount: 105, doublings: 0, extra: { tickets: 3, gems: 2, food: 120.5, gold: 900 } });
    ET.doublePot(s.id);
    ET.doublePot(s.id);
    expect(ET.potTotals(ET.eternoState().open!.pot)).toEqual({ chips: 420, tickets: 12, gems: 8, food: 482, gold: 3600 });
    expect(ET.potHasAny(ET.eternoState().open!.pot)).toBe(true);
  });

  it('WIN: every balance ×2 and the WHOLE botín added (each currency it holds)', () => {
    const s = ET.startEterno('roulette');
    ET.lockEterno(s.id, 'chips');
    ET.addLuck(s.id, 100);
    ET.addDrop(s.id, { field: 'tickets', n: 3 });
    ET.addDrop(s.id, { field: 'gems', n: 2 });
    ET.addDrop(s.id, { field: 'food', n: 10 });
    ET.addDrop(s.id, { field: 'gold', n: 250 });
    ET.doublePot(s.id); // 200 chips · 6 tickets · 4 gems · 20 food · 500 gold
    const r = ET.resolveEterno(s.id, 0.2)!;
    expect(r.record.r).toBe('win');
    expect(r.record.after).toEqual({ gold: 50_000.5 * 2 + 500, gems: 300 * 2 + 4, food: 7000 * 2 + 20, tickets: 40 * 2 + 6, chips: 2000 * 2 + 200 });
    expect(r.record.pot).toMatchObject({ cur: 'chips', amount: 200, doublings: 1, extra: { tickets: 6, gems: 4, food: 20, gold: 500 } });
    // the record is a copy: it can't move with anything afterwards
    expect(r.record.pot!.extra).not.toBe(ET.eternoState().open?.pot?.extra);
  });

  it('LOSS: exactly the five balances (and the registered extras) go to 0 and the botín with its drops is gone — nothing else moves', () => {
    const s = ET.startEterno('plinko');
    ET.lockEterno(s.id, 'gold');
    ET.addLuck(s.id, 5000);
    ET.addDrop(s.id, { field: 'tickets', n: 7 });
    ET.addDrop(s.id, { field: 'gold', n: 300 }); // the table's currency: into the main number
    const before = clone(G.s) as Record<string, unknown> & { casino: Record<string, unknown> };
    const r = ET.resolveEterno(s.id, 0.9)!;
    expect(r.record.r).toBe('loss');
    expect(ET.atRisk()).toEqual({ gold: 0, gems: 0, food: 0, tickets: 0, chips: 0 });
    expect(r.record.pot).toMatchObject({ cur: 'gold', amount: 5300, extra: { tickets: 7 } });
    const after = clone(G.s) as typeof before;
    for (const x of [before, after]) {
      delete x.gold;
      delete x.gems;
      delete x.food;
      delete x.savedAt;
      delete x.casino.tickets;
      delete x.casino.chips;
      delete x.casino.eterno;
      // the soft resources other systems put at stake (ETERNO_EXTRA: the Combustible Astral) go to 0 too, as always
      const astral = (x.ext as Record<string, Record<string, unknown>> | undefined)?.astral;
      if (astral) delete astral.fuel;
    }
    expect(Object.keys(r.record.extra ?? {}).length).toBeLessThanOrEqual(ET.ETERNO_EXTRA.length);
    expect(after).toEqual(before);
  });

  it('an OLD save: a locked session saved with the old botín (no multi-currency part) resolves exactly as before', () => {
    const s = ET.startEterno('slot');
    ET.lockEterno(s.id, 'chips');
    // the shape every save had until 2026-10-29
    ET.eternoState().open!.pot = { cur: 'chips', amount: 400, doublings: 2 };
    G.save();
    G.s = clone(G.s); // reload through JSON
    expect(ET.potTotals(ET.eternoState().open!.pot)).toEqual({ gold: 0, gems: 0, food: 0, tickets: 0, chips: 400 });
    const win = ET.resolveEterno(s.id, 0.1)!;
    expect(win.record.after!.chips).toBe(2000 * 2 + 400);
    expect(win.record.after!.tickets).toBe(40 * 2);
    expect(win.record.pot).toEqual({ cur: 'chips', amount: 400, doublings: 2 });
    // and abandoned on the old shape: settleAbandoned draws it with the saved botín
    rich();
    const t = ET.startEterno('dice');
    ET.lockEterno(t.id, 'gems');
    ET.eternoState().open!.pot = { cur: 'gems', amount: 30, doublings: 1 };
    G.s = clone(G.s);
    const rec = ET.settleAbandoned()!;
    expect(['win', 'loss']).toContain(rec.r);
    expect(rec.pot).toEqual({ cur: 'gems', amount: 30, doublings: 1 });
    if (rec.r === 'win') expect(G.s.gems).toBeGreaterThanOrEqual(300 * 2 + 30);
    else expect(G.s.gems).toBe(0);
  });

  it('a botín with garbage in it (a hand-edited save) pays only what is a real amount', () => {
    const s = ET.startEterno('slot');
    ET.lockEterno(s.id, 'chips');
    ET.eternoState().open!.pot = { cur: 'chips', amount: 50, doublings: 0, extra: { tickets: Number.NaN, gems: -3, gold: 10 } as never };
    const r = ET.resolveEterno(s.id, 0.1)!;
    expect(r.record.after).toMatchObject({ chips: 4050, tickets: 80, gems: 600, gold: 50_000.5 * 2 + 10 });
  });

  it('the resolution stays idempotent with a multi-currency botín (double tap, reload)', () => {
    const s = ET.startEterno('slot');
    ET.lockEterno(s.id, 'chips');
    ET.addDrop(s.id, { field: 'tickets', n: 5 });
    expect(ET.resolveEterno(s.id, 0.3)!.applied).toBe(true);
    const snap = clone(G.s) as Record<string, unknown>;
    expect(ET.resolveEterno(s.id, 0.9)!.applied).toBe(false);
    G.s = clone(G.s);
    expect(ET.resolveEterno(s.id, 0.9)!.applied).toBe(false);
    const now = clone(G.s) as Record<string, unknown>;
    delete now.savedAt;
    delete snap.savedAt;
    expect(now).toEqual(snap);
  });

  it('what a lucky round drops: printed chances and sizes (gold / pescaditos = seconds of production)', () => {
    const D = ET.ETERNO.drops;
    expect(D.table.reduce((s, x) => s + x.w, 0)).toBe(100);
    const inc = { gold: 12, food: 3 };
    // r() < chance drops; the second draw picks by weight
    const seq = (...v: number[]) => () => v.shift()!;
    expect(ET.luckyDrop(false, seq(D.chance + 1e-9, 0), inc)).toBeNull();
    expect(ET.luckyDrop(false, seq(0, 0), inc)).toEqual({ field: 'tickets', n: 1 });
    expect(ET.luckyDrop(true, seq(0, 0), inc)).toEqual({ field: 'tickets', n: 2 });
    expect(ET.luckyDrop(false, seq(0, 0.36), inc)).toEqual({ field: 'gems', n: 1 });
    expect(ET.luckyDrop(false, seq(0, 0.61), inc)).toEqual({ field: 'food', n: 90 });
    expect(ET.luckyDrop(true, seq(0, 0.99), inc)).toEqual({ field: 'gold', n: 720 });
    expect(ET.luckyDrop(true, seq(D.jackpotChance + 1e-9, 0), inc)).toBeNull();
    // 200k rounds: the rates the config prints
    let n = 0;
    let tk = 0;
    for (let i = 0; i < 200_000; i++) {
      const d = ET.luckyDrop(false, Math.random, inc);
      if (d) {
        n++;
        if (d.field === 'tickets') tk++;
      }
    }
    expect(Math.abs(n / 200_000 - D.chance)).toBeLessThan(0.003);
    expect(Math.abs(tk / n - 0.35)).toBeLessThan(0.02);
  });

  it('balance: a whole session (~170 lucky rounds, doubling every 4 s) pays a modest bonus on a WIN', () => {
    // the panel's timeline (luckyPhase): luck from 21.1 s, rounds at 7×(1+k)/s, a 0.7 s slam at each doubling
    const inc = { gold: 10, food: 4 };
    const N = 3000;
    const tot = { tickets: 0, gems: 0, food: 0, gold: 0 } as Record<string, number>;
    for (let i = 0; i < N; i++) {
      let t = 21.1;
      let next = 24;
      const drops: { field: string; n: number }[] = [];
      while (t < 40) {
        if (t >= next && next < 40) {
          next += 4;
          t += 0.7;
          for (const d of drops) d.n *= 2;
          continue;
        }
        const d = ET.luckyDrop(Math.random() < ET.ETERNO.luck.jackpotChance, Math.random, inc);
        if (d) drops.push({ ...d });
        t += 1 / (7 * (1 + (t - 20) / 20));
      }
      for (const d of drops) tot[d.field] += d.n;
    }
    const avg = (k: string) => tot[k] / N;
    // ≈ 32 boletos · 23 gemas · ~9 min of each production on a WIN (ETERNO.drops comment)
    expect(avg('tickets')).toBeGreaterThan(20);
    expect(avg('tickets')).toBeLessThan(45);
    expect(avg('gems')).toBeGreaterThan(14);
    expect(avg('gems')).toBeLessThan(34);
    expect(avg('gold') / inc.gold / 60).toBeGreaterThan(5);
    expect(avg('gold') / inc.gold / 60).toBeLessThan(14);
  });
});

// ------------------------------------------------------------------ B · the MULTIVERSO banner
const MDS = (n = 6) => Array.from({ length: n }, (_, i) => stubPostCat(`zz_mv_md${i}`, 'x_homiau', i % 2 ? 'casino:slot' : 'casino:gacha:holo', { weight: i === 0 ? 4 : 10, star: i === 0 }));
const OTHERS = () => [stubPostCat('zz_mv_leg', 'l_ignis', 'casino:gacha', { weight: 10 }), stubPostCat('zz_mv_myth', 'm_raijin', 'casino:gacha:michi', { weight: 10 })];

describe('B · MULTIVERSO DESBORDADO: the banner of the Multidimensionals', { timeout: 120_000 }, () => {
  beforeEach(() => {
    load('h93-final');
    CS.cs().tickets = 100_000;
  });

  it('before the Parte III it does not exist: not on view, not reachable by id, no notice', () => {
    inject([...MDS(), ...OTHERS()]);
    expect(P.postP3Unlocked()).toBe(false);
    expect(GA.activeBanners().map((b) => b.id)).toEqual(['michi', 'holo', 'cofre']);
    expect(GA.banner('multiverso').id).toBe('michi');
    expect(P.multiversoPool()).toEqual([]);
    expect(AV.avisoDue()).toBe(false);
    // the shipped list never changed (tests and the FxLab read it)
    expect(GA.BANNERS.map((b) => b.id)).toEqual(['michi', 'holo', 'cofre']);
  });

  it('after it: a fourth tab, priced like the cat banners, printed odds that add up, only NORMAL', () => {
    inject([...MDS(), ...OTHERS()]);
    finish();
    expect(GA.activeBanners().map((b) => b.id)).toEqual(['michi', 'holo', 'multiverso', 'cofre']);
    const b = GA.banner('multiverso');
    expect(b.id).toBe('multiverso');
    expect(Object.values(b.tiers).reduce((s, x) => s + x, 0)).toBeCloseTo(1, 12);
    expect(b.tiers.holo).toBe(0);
    expect(GA.modesFor(b)).toEqual(['normal']);
    expect([GA.pullCost(b, 1, 'tickets'), GA.pullCost(b, 10, 'tickets'), GA.pullCost(b, 1, 'gems'), GA.pullCost(b, 10, 'gems')]).toEqual([1, 10, 8, 72]);
    expect(GA.pullCost(b, 1, 'gems')).toBe(GA.banner('holo').gems);
    // the guarantees, in the same style as the other cat banners
    expect([b.epicPity, b.softPity, b.hardPity, b.mythicPity, b.catPity]).toEqual([8, 22, 36, 140, 5]);
    const rt = GA.ratesTable(b);
    expect(rt.reduce((s, t) => s + t.p, 0)).toBeCloseTo(1, 12);
    expect(rt.flatMap((t) => t.items).reduce((s, x) => s + x.p, 0)).toBeCloseTo(1, 12);
    expect(GA.tierLabelOf(b, 'legendary')).toBe('MULTIDIMENSIONAL');
    // its pool: every post MULTIDIMENSIONAL (whatever its table), never a post legendary / mythic
    expect(P.multiversoPool().map((c) => c.id).sort()).toEqual(MDS().map((c) => c.id).sort());
    // a risk mode asked for by an old pref falls back to NORMAL
    const res = GA.pull('multiverso', 1, 'tickets', 'todo')!;
    expect(res[0].mode).toBe('normal');
  });

  it('every legendary / mythic result is a post Multidimensional that SHOWS as one; its own counters, no Multiverse share', () => {
    inject([...MDS(), ...OTHERS()]);
    finish();
    const ids = new Set(MDS().map((c) => c.id));
    let top = 0;
    let since = 0;
    let worst = 0;
    for (let i = 0; i < 400; i++)
      for (const p of GA.pull('multiverso', 10, 'tickets')!) {
        since++;
        if (GA.rankOf(p.tier) >= 3) {
          top++;
          worst = Math.max(worst, since);
          since = 0;
          expect(p.prize.kind).toBe('cat');
          expect(ids.has(p.prize.ref!)).toBe(true);
          expect(CAT_BY_ID.get(p.prize.ref!)!.rarity).toBe('multidimensional');
          expect(p.look).toBe('multidimensional');
          expect(p.got.tier).toBe('multidimensional');
        } else expect(p.look).toBe(p.tier);
        expect(p.escaped).toBeUndefined();
      }
    expect(top).toBeGreaterThan(80);
    // the hard guarantee (36; 20 for a beginner)
    expect(worst).toBeLessThanOrEqual(36);
    const keys = Object.keys(CS.cs().pity);
    expect(keys.filter((k) => k.startsWith('multiverso:')).sort()).toEqual(['multiverso:c', 'multiverso:e', 'multiverso:esc', 'multiverso:hot', 'multiverso:l', 'multiverso:m']);
    // no share drawn on top of it, and the other banners' counters never moved
    expect(keys.filter((k) => k.startsWith('post:'))).toEqual([]);
    expect(keys.filter((k) => k.startsWith('michi:') || k.startsWith('holo:'))).toEqual([]);
  });

  it('the MÍTICO line gives one you DON\'T have (with all of them, any); the unowned weigh ×3 in the printed table', () => {
    inject([...MDS(4)]);
    finish();
    const b = GA.banner('multiverso');
    // you have three of the four
    for (const id of ['zz_mv_md0', 'zz_mv_md1', 'zz_mv_md2']) G.s.catdex[id] = 'registered';
    CS.cs().pity['multiverso:m'] = b.mythicPity - 1;
    const [p] = GA.pull('multiverso', 1, 'tickets')!;
    expect(p.tier).toBe('mythic');
    expect(p.pity).toBe('mythic');
    expect(p.prize.ref).toBe('zz_mv_md3');
    expect(p.look).toBe('multidimensional');
    const o = P.multiversoOdds({ legendary: 0.03, mythic: 0.01 })!;
    expect(o.cats.reduce((s, c) => s + c.inLine, 0)).toBeCloseTo(1, 12);
    expect(o.cats.reduce((s, c) => s + c.inMissing, 0)).toBeCloseTo(1, 12);
    // md0 (star, 4) owned ×1 · md1, md2 owned 10 · md3 unowned 10 ×3 = 30 → 30 / 54 (it now has all four: md3 was just won)
    G.s.catdex.zz_mv_md3 = undefined as never;
    delete G.s.catdex.zz_mv_md3;
    const o2 = P.multiversoOdds({ legendary: 0.03, mythic: 0.01 })!;
    const c3 = o2.cats.find((c) => c.id === 'zz_mv_md3')!;
    expect(c3.inLine).toBeCloseTo(30 / 54, 12);
    expect(c3.inMissing).toBe(1);
    expect(c3.next).toBeCloseTo(0.03 * (30 / 54) + 0.01, 12);
  });

  it('a new wave of Multidimensionals joins it by itself (no id list anywhere)', () => {
    inject(MDS(2));
    finish();
    expect(P.multiversoPool()).toHaveLength(2);
    inject([stubPostCat('zz_mv_wave2', 'x_homiau', 'casino:caja', { weight: 10 })]);
    expect(P.multiversoPool().map((c) => c.id)).toContain('zz_mv_wave2');
  });

  it('the notice: due once after the Parte III, said by MADAME NOIR, Luzterna only mentioned', () => {
    inject(MDS(2));
    expect(AV.avisoDue()).toBe(false);
    finish();
    expect(AV.avisoDue()).toBe(true);
    AV.markAvisoSeen();
    expect(AV.avisoDue()).toBe(false);
    expect(G.has(AV.AVISO_FLAG)).toBe(true);
    // it survives a save + reload
    G.save();
    G.load();
    expect(AV.avisoDue()).toBe(false);
    expect(AV.AVISO_WHO).toBe('MADAME NOIR');
    const all = AV.AVISO_LINES.join(' ');
    expect(all).toMatch(/conectar más cajas/);
    expect(all).toMatch(/tristeza por Luzterna/);
    expect(all).toMatch(/fichitas/);
    // she is mentioned once, never as the one talking
    expect(all.match(/Luzterna/g)).toHaveLength(1);
    expect(AV.AVISO_LINES.some((l) => /^LUZTERNA/i.test(l))).toBe(false);
  });
});

// ------------------------------------------------------------------ C · what a Multiverse result shows
describe('C · a Multiverse cat shows its OWN rarity', { timeout: 120_000 }, () => {
  beforeEach(() => {
    load('h93-final');
    CS.cs().tickets = 100_000;
    CS.cs().chips = 100_000;
  });

  it('catShowTier: HOLO stays HOLO; a Multidimensional shows multidimensional; a post legendary / mythic its own; others the table tier', () => {
    const [md, leg, myth] = inject([stubPostCat('zz_c_md', 'x_homiau', 'casino:slot'), stubPostCat('zz_c_leg', 'l_ignis', 'casino:slot'), stubPostCat('zz_c_myth', 'm_raijin', 'casino:slot')]);
    expect(CS.catShowTier(md, false, 'legendary')).toBe('multidimensional');
    expect(CS.catShowTier(md, true, 'legendary')).toBe('holo');
    expect(CS.catShowTier(leg, false, 'mythic')).toBe('legendary');
    expect(CS.catShowTier(myth, false, 'legendary')).toBe('mythic');
    expect(CS.catShowTier(CAT_BY_ID.get('l_ignis')!, false, 'epic')).toBe('epic');
    expect(MD.isPostCat(md)).toBe(true);
    // the multidimensional look is the theme's (the casino draws it with RARITY.multidimensional)
    expect(GA.tierColor('multidimensional')).toBe(RARITY.multidimensional.color);
    expect(GA.lookRank('multidimensional')).toBeGreaterThan(GA.lookRank('holo'));
    expect(GA.lookRank('multidimensional')).toBeLessThan(GA.lookRank('mythic'));
  });

  it('the Portal: a legendary roll swapped for a Multidimensional of the Multiverse shows as MULTIDIMENSIONAL, not gold', () => {
    inject([stubPostCat('zz_c_md', 'x_homiau', 'casino:gacha:michi', { weight: 10 })]);
    finish();
    const b = GA.banner('michi');
    let got: import('../src/state/sys/gacha').Pull | undefined;
    for (let i = 0; i < 80 && !got; i++) {
      CS.cs().pity['michi:l'] = GA.pityCaps(b).hard - 1;
      CS.cs().pity['post:gacha:michi'] = R.POST_CASINO.gacha.pity - 1;
      const [p] = GA.pull('michi', 1, 'tickets')!;
      if (p.prize.ref === 'zz_c_md') got = p;
    }
    expect(got).toBeDefined();
    expect(GA.rankOf(got!.tier)).toBeGreaterThanOrEqual(3); // the odds drew a legendary / mythic tier…
    expect(got!.look).toBe('multidimensional'); // …and what it shows is the cat's own rarity
    expect(got!.prize.tier).toBe('multidimensional');
    expect(got!.got.tier).toBe('multidimensional');
    // the history line names it too
    expect(String(CS.cs().hist![0].r)).toMatch(/MULTIDIMENSIONAL/);
  });

  it('a post mythic drawn on a legendary line shows MYTHIC; a post legendary on the mythic line shows LEGENDARY', () => {
    inject([stubPostCat('zz_c_myth', 'm_raijin', 'casino:gacha:michi', { weight: 10 })]);
    finish();
    const b = GA.banner('michi');
    let seen: import('../src/state/sys/gacha').Pull | undefined;
    for (let i = 0; i < 80 && !seen; i++) {
      CS.cs().pity['michi:l'] = GA.pityCaps(b).hard - 1;
      CS.cs().pity['post:gacha:michi'] = R.POST_CASINO.gacha.pity - 1;
      const [p] = GA.pull('michi', 1, 'tickets')!;
      if (p.prize.ref === 'zz_c_myth' && p.tier === 'legendary') seen = p;
    }
    expect(seen?.look).toBe('mythic');
    expect(seen?.got.tier).toBe('mythic');
  });

  it('the Tragamichis, La Caja and the Eterno prize: a swapped Multidimensional carries the multidimensional tier', () => {
    inject([stubPostCat('zz_c_slot', 'x_homiau', 'casino:slot', { weight: 10 }), stubPostCat('zz_c_caja', 'x_homiau', 'casino:caja', { weight: 10 }), stubPostCat('zz_c_et', 'x_homiau', 'casino:eterno', { weight: 10 })]);
    finish();
    // the slot's GATO NEGRO prize (tier ALTA: legendary or mythic) with its guarantee due
    CS.cs().pity['post:slot'] = R.POST_CASINO.slot.pity - 1;
    const s = CS.withPostTable({ game: 'slot' }, () => CS.rollCatPrize(['legendary', 'mythic'], [0.9, 0.1], 0, null, 0.5, true));
    expect(s).toMatchObject({ ref: 'zz_c_slot', tier: 'multidimensional' });
    // La Caja's Gato Misterioso, until its 10 % legendary line comes up (the guarantee makes it the Multiverse's)
    let caja: import('../src/state/sys/casino').Granted | null = null;
    for (let i = 0; i < 400 && caja?.ref !== 'zz_c_caja'; i++) {
      CS.cs().pity['post:caja'] = R.POST_CASINO.caja.pity - 1;
      caja = CS.buyCaja('cat');
    }
    expect(caja).toMatchObject({ ref: 'zz_c_caja', tier: 'multidimensional' });
    // the Eterno's special cat
    let et: import('../src/state/sys/casino').Prize | null = null;
    for (let i = 0; i < 200 && et?.ref !== 'zz_c_et'; i++) {
      CS.cs().pity['post:eterno'] = R.POST_CASINO.eterno.pity - 1;
      et = CS.withPostTable({ game: 'eterno' }, () => ET.eternoPrize());
    }
    expect(et?.ref).toBe('zz_c_et');
    expect(et?.tier === 'multidimensional' || et?.tier === 'holo').toBe(true);
    if (!et?.holo) expect(et?.tier).toBe('multidimensional');
  });

  it('HOLO handling stays: a Multidimensional in HOLO foil shows HOLO', () => {
    inject([stubPostCat('zz_c_md', 'x_homiau', 'casino:slot', { weight: 10 })]);
    finish();
    CS.cs().pity['post:slot'] = R.POST_CASINO.slot.pity - 1;
    const p = CS.withPostTable({ game: 'slot' }, () => CS.rollCatPrize(['legendary'], undefined, 1, null, 0.5, true));
    expect(p).toMatchObject({ ref: 'zz_c_md', holo: true, tier: 'holo' });
  });

  it('the vitrinas (a throw, the spark): a Multidimensional of the showcase shows multidimensional, a mythic mythic', () => {
    const SHOW = [
      stubPostCat('zz_v_leg', 'l_ignis', 'casino:gacha:michi', { vitrina: 'plinko', weight: 10 }),
      stubPostCat('zz_v_m1', 'm_raijin', 'casino:gacha:michi', { vitrina: 'plinko', weight: 10 }),
      stubPostCat('zz_v_md1', 'x_homiau', 'casino:gacha:michi', { vitrina: 'plinko', weight: 10 }),
      stubPostCat('zz_v_md2', 'x_homiau', 'casino:gacha:michi', { vitrina: 'plinko', weight: 4, star: true }),
    ];
    inject(SHOW);
    finish();
    // the Multidimensional guarantee due → the throw is one
    CS.cs().pity['post:vit:plinko:md'] = R.POST_VITRINA.pity.md - 1;
    const g = V.vitrinaThrow('plinko', 'momento', () => 0.5);
    expect(CAT_BY_ID.get(g.ref!)!.rarity).toBe('multidimensional');
    expect(g.tier).toBe('multidimensional');
    // the spark: pick the mythic → mythic
    CS.cs().pity['post:vit:plinko:s'] = R.POST_VITRINA.pity.spark;
    const sp = V.vitrinaSparkPick('plinko', 'zz_v_m1')!;
    expect(sp.tier).toBe('mythic');
    CS.cs().pity['post:vit:plinko:s'] = R.POST_VITRINA.pity.spark;
    const left = SHOW.find((c) => c.rarity === 'multidimensional' && G.s.catdex[c.id] !== 'registered')!;
    expect(V.vitrinaSparkPick('plinko', left.id)!.tier).toBe('multidimensional');
  });
});

describe('C · the casino draws the Multidimensional look with the collection\'s palette', () => {
  it('mdLook: the theme colours and the five boxes of the Multidimensional cards', async () => {
    const L = await import('../src/panels/casino/mdLook');
    // the collection's palette, read from its source (importing it would load every universe: too heavy for this check)
    const src = readFileSync(new URL('../src/panels/collection/multidimCard.ts', import.meta.url), 'utf8');
    const m = src.match(/export const DIMS5 = \[([^\]]+)\]/);
    expect(m).not.toBeNull();
    expect([...L.MD_DIMS]).toEqual(m![1].split(',').map((x) => Number(x.trim())));
    expect(L.MD).toBe(RARITY.multidimensional.color);
    expect(L.MD_GLOW_COL).toBe(RARITY.multidimensional.glow);
    expect(GA.MD_COLOR).toBe(RARITY.multidimensional.color);
    expect(GA.MD_GLOW).toBe(RARITY.multidimensional.glow);
    const { TIER_COL, TIER_LABEL } = await import('../src/panels/casino/prizes');
    expect(TIER_COL.multidimensional).toBe(RARITY.multidimensional.color);
    expect(TIER_LABEL.multidimensional).toBe('MULTIDIMENSIONAL');
  });
});
