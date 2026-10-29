/**
 * DESPUÉS DE LA PARTE III — the plumbing of the post-Parte III cats (state/sys/postp3.ts; data/postp3/; ⚠️ spoilers).
 * Every cat here is a STUB injected by the test (tests/helpers/postStubs.ts): data/postp3/especies.json ships empty.
 *
 *   · the data ships empty and changes nothing; the validator catches a bad post cat
 *   · the gate: «Continuará» / H96 done / H97+, robust to old saves and saves that skipped the films; never in the mourning
 *   · the Catdex: invisible before the gate (the same total, the same numbers); after it, a RUMOR while a table names it
 *   · the casino: before the gate not one number is drawn nor a counter moved; after it, each table with a pool gives
 *     its legendary / mythic cats from it at its share, with its guarantee, by weight (×3 unowned) — and prints it
 *   · the generic pools (Portal, Casino, Resonance, shop, the Podio's rivals) never get a post or a Parte III cat
 *   · the Podio: a post champion only after the gate; it pays its cat once (frontier, or a league crowned before)
 *   · old saves load untouched; the counters persist through a save and a reload
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
const { CATS, CAT_BY_ID, ELEMENTS } = await import('../src/data/content');
const BALANCE = (await import('../src/data/balance.json')).default as unknown as Record<string, unknown>;
const RAW = (await import('../src/data/content.json')).default as { roles: { id: string }[] };
const { validatePostCats } = await import('../src/data/postp3/validate');
const R = await import('../src/data/postp3/reglas');
const P = await import('../src/state/sys/postp3');
const MD = await import('../src/state/sys/multidim');
const CS = await import('../src/state/sys/casino');
const GA = await import('../src/state/sys/gacha');
const ET = await import('../src/state/sys/casino/eterno');
const PO = await import('../src/state/sys/podio');
const { rival, boutPower } = await import('../src/podio/ladder');
const PB = (await import('../src/data/podio.json')).default as { rewards: Record<string, number> };
const { dexStatus, dexVisible, adopt, speciesCount } = await import('../src/state/sys/cats');
const { dexTotal } = await import('../src/state/ext/collection');
const { markBeat } = await import('../src/state/ext/story');
const { CONTINUARA_BEAT, dueloActivo } = await import('../src/state/sys/gaterasWorld');
const { oddsFor } = await import('../src/state/sys/resonance');
const { catOffers } = await import('../src/state/sys/shop');
const { stubPostCat, injectPostCats, injectChampions, hideShippedPostCats } = await import('./helpers/postStubs');
const V = await import('../src/state/sys/postVitrina');
const PL = await import('../src/state/sys/casino/plinko');
type CatDef = import('../src/data/content').CatDef;

const fixture = (name: string) => readFileSync(new URL(`../test-saves/${name}.json`, import.meta.url), 'utf8');
function load(name: string) {
  mem.clear();
  mem.set(SAVE_KEY, fixture(name));
  G.load();
  if (!G.loaded) throw new Error(`${name} no carga`);
}
/** the Parte III over in this save: «Continuará» written (the director's beat), like the end of H96 */
const finish = () => markBeat(CONTINUARA_BEAT);
const BOUTS = 5;

// the stubs: one per table (and one per banner), one sealed by an element, one Podio heroic
const STUBS = (): CatDef[] => [
  stubPostCat('zz_leg_portal', 'l_ignis', 'casino:gacha', { weight: 2 }),
  stubPostCat('zz_md_holo', 'x_homiau', 'casino:gacha:holo', { weight: 1 }),
  stubPostCat('zz_myth_slot', 'm_raijin', 'casino:slot', { weight: 1 }),
  stubPostCat('zz_leg_slot', 'l_abisa', 'casino:slot', { weight: 3 }),
  stubPostCat('zz_md_caja', 'x_murciegato', 'casino:caja', { weight: 1 }),
  stubPostCat('zz_leg_eterno', 'l_silvana', 'casino:eterno', { weight: 1 }),
  stubPostCat('zz_hero', 'h_zarpa', 'podio:zz_campeon', { weight: 1 }),
];
const CHAMP = { id: 'zz_campeon', order: 9, mult: 1.5, trainer: 'LA CAMPEONA STUB', line: 'Línea de prueba.' };
let undo: (() => void)[] = [];
const inject = (defs = STUBS(), champs = [CHAMP]) => {
  undo.push(injectPostCats(defs), injectChampions(champs));
  return defs;
};
// every test works on exact stub pools: the shipped post cats step out (the «shipped cats» block brings them back)
beforeEach(() => {
  undo.push(hideShippedPostCats());
});
afterEach(() => {
  for (const u of undo.splice(0).reverse()) u();
  vi.restoreAllMocks();
});
/** the shipped post cats back in the catalog, for the tests about them */
const unhide = () => {
  for (const u of undo.splice(0).reverse()) u();
};
const SHIPPED = (await import('../src/data/postp3/especies.json')).default as { cats: { id: string; rarity: string; art: { slug: string }; post: { source: string; vitrina?: string } }[] };
const postKeys = () => Object.keys(G.s.casino?.pity ?? {}).filter((k) => k.startsWith('post:'));

// ------------------------------------------------------------------ data
describe('the data (data/postp3/especies.json)', () => {
  it('with the shipped cats stepped out: nothing for any table, nothing for the Podio', () => {
    expect(P.postCats()).toEqual([]);
    expect(CATS.some((c) => MD.isPostCat(c))).toBe(false);
    // DISEÑO's 8 champions are declared, but none fights until its Heroico is in the game
    expect(R.POST_CHAMPIONS.length).toBe(8);
    load('h93-final');
    finish();
    expect(P.postP3Unlocked()).toBe(true);
    for (const t of [{ game: 'gacha', sub: 'michi' }, { game: 'gacha', sub: 'holo' }, { game: 'slot' }, { game: 'caja' }, { game: 'eterno' }] as const) {
      expect(P.postPool(t.game, 'sub' in t ? t.sub : undefined)).toEqual([]);
      expect(P.postOdds(t)).toBeNull();
      expect(P.rollPostCat(t, () => 0)).toBeNull();
    }
    expect(postKeys()).toEqual([]);
    expect(P.activePostChampions()).toEqual([]);
  });

  it('the validator: a good stub passes; each kind of mistake is named', () => {
    const refs = { balance: BALANCE, roles: RAW.roles.map((r) => r.id), elements: ELEMENTS.map((e) => e.id) };
    expect(validatePostCats(STUBS() as never, refs)).toEqual([]);
    const bad = (patch: (d: CatDef & Record<string, unknown>) => void) => {
      const d = stubPostCat('zz_bad', 'l_ignis', 'casino:gacha') as CatDef & Record<string, unknown>;
      patch(d);
      return validatePostCats([d] as never, refs).join(' | ');
    };
    expect(bad((d) => (d.post!.source = 'casino:ruleta'))).toMatch(/post.source inválido/);
    expect(bad((d) => (d.post!.source = 'casino:gacha:cofre'))).toMatch(/post.source inválido/);
    expect(bad((d) => (d.post!.weight = 0))).toMatch(/post.weight/);
    expect(bad((d) => (d.obtain.source = 'casino:gacha'))).toMatch(/obtain.source/);
    expect(bad((d) => ((d.economy as unknown as Record<string, string>).goldBasePerS = 'balance:rarities.gold_base_per_s.legendaria'))).toMatch(/no existe en balance.json/);
    expect(bad((d) => ((d.combat as unknown as Record<string, string>).hpBase = 'roles.bombero.hp'))).toMatch(/ese rol no existe/);
    expect(bad((d) => (d.rarity = 'heroic'))).toMatch(/el casino nunca da/);
    expect(bad((d) => (d.p3 = { kind: 'historia' }))).toMatch(/no lleva bloque p3/);
    expect(bad((d) => (d.secret = true))).toMatch(/secreto/);
    expect(bad((d) => (d.elements = ['plasma']))).toMatch(/elemento desconocido/);
    const two = [stubPostCat('zz_a', 'h_zarpa', 'podio:x'), stubPostCat('zz_b', 'h_granbigote', 'podio:x')];
    expect(validatePostCats(two as never, refs).join(' | ')).toMatch(/ya paga a zz_a/);
  });

  it('sources: casino:<table>[:<banner>] and podio:<champion>; nothing else', () => {
    expect(R.parsePostSource('casino:gacha')).toEqual({ kind: 'casino', game: 'gacha' });
    expect(R.parsePostSource('casino:gacha:holo')).toEqual({ kind: 'casino', game: 'gacha', sub: 'holo' });
    expect(R.parsePostSource('casino:slot:2')).toBeNull();
    expect(R.parsePostSource('casino:plinko')).toBeNull();
    expect(R.parsePostSource('podio:la_reina')).toEqual({ kind: 'podio', champion: 'la_reina' });
    expect(R.parsePostSource('podio:')).toBeNull();
    expect(R.parsePostSource('p3:etapa')).toBeNull();
    // every rule is a real probability; the unowned weight is the casino's
    for (const r of Object.values(R.POST_CASINO)) {
      expect(r.share).toBeGreaterThan(0);
      expect(r.share).toBeLessThanOrEqual(1);
      expect(Number.isInteger(r.pity) && r.pity >= 0).toBe(true);
    }
    expect(P.POST_UNOWNED).toBe(CS.UNOWNED_WEIGHT);
    expect(Object.keys(R.POST_CASINO.gacha.subs!).sort()).toEqual(GA.BANNERS.filter((b) => b.hasCats).map((b) => b.id).sort());
  });
});

// ------------------------------------------------------------------ the shipped cats (scripts/postp3-sync.mjs, as their art lands)
describe('the shipped post cats', () => {
  it('never a cat without its painting (full + lite), each with a table and a valid source; ids unique', async () => {
    const { existsSync } = await import('node:fs');
    const ids = SHIPPED.cats.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of SHIPPED.cats) {
      expect(existsSync(new URL(`../public/cats-svg/${c.art.slug}.svg`, import.meta.url)), `${c.id} full`).toBe(true);
      expect(existsSync(new URL(`../public/cats-svg/lite/${c.art.slug}.svg`, import.meta.url)), `${c.id} lite`).toBe(true);
      expect(R.parsePostSource(c.post.source), c.id).toBeTruthy();
    }
  });
  it('they come after every older species, invisible before the gate, in their tables (and showcases) after it', () => {
    unhide();
    const at = CATS.findIndex((c) => MD.isPostCat(c));
    if (at < 0) return;
    expect(CATS.slice(at).every((c) => MD.isPostCat(c))).toBe(true);
    load('h93-final');
    for (const c of SHIPPED.cats) expect(dexVisible(c.id), c.id).toBe(false);
    expect(['gacha', 'slot', 'caja', 'eterno'].flatMap((g) => P.postPool(g as never, 'michi'))).toEqual([]);
    finish();
    for (const c of SHIPPED.cats) {
      const def = CAT_BY_ID.get(c.id)!;
      if (!def.elements.every((e) => G.s.elements.includes(e))) continue;
      expect(dexVisible(c.id), c.id).toBe(true);
      expect(dexStatus(c.id), c.id).toBe('rumor');
      const src = P.postSource(def);
      if (src?.kind === 'casino') expect(P.postPool(src.game, src.sub).map((x) => x.id), c.id).toContain(c.id);
      if (c.post.vitrina && V.isVitrinaTable(c.post.vitrina)) expect(V.vitrinaPool(c.post.vitrina).map((x) => x.id), c.id).toContain(c.id);
    }
  });
});

// ------------------------------------------------------------------ the gate
describe('the gate: the Parte III is over', () => {
  const save = (done: string[], active: string[] = [], beats: string[] = []) => ({ missions: { done, active }, beatsSeen: beats });
  it('«Continuará», H96 done or the story past it — and nothing else', () => {
    expect(P.POST_GATE_BEAT).toBe(CONTINUARA_BEAT);
    expect(P.postP3Unlocked(null)).toBe(false);
    expect(P.postP3Unlocked(save([]))).toBe(false);
    expect(P.postP3Unlocked(save(['H65', 'H92', 'H93', 'H94', 'H95'], ['H96']))).toBe(false);
    expect(P.postP3Unlocked(save(['H95'], ['H96'], ['b96_recado', 'b96_luz', 'b96_creditos']))).toBe(false);
    expect(P.postP3Unlocked(save(['H95'], ['H96'], ['b96_continuara']))).toBe(true);
    expect(P.postP3Unlocked(save(['H96']))).toBe(true);
    expect(P.postP3Unlocked(save(['H95'], ['H97']))).toBe(true);
    expect(P.postP3Unlocked(save(['H97']))).toBe(true);
    expect(P.postP3Unlocked(save([], ['H101']))).toBe(true);
    // a stray active H97–H99 this build doesn't know (rupturas-raro's phantom H99) doesn't open it
    expect(P.postP3Unlocked(save(['H65'], ['H99']))).toBe(false);
    // other chains never count (K33, P97, E96…)
    expect(P.postP3Unlocked(save(['P97', 'E96', 'K99', 'C96']))).toBe(false);
  });
  it('never during the mourning: SADIE → «Continuará» is closed, and it opens right after', () => {
    const s = save(['H93', 'H94', 'H95'], ['H96'], ['b94_sadie', 'b96_recado', 'b96_luz', 'b96_creditos']);
    expect(dueloActivo(s)).toBe(true);
    expect(P.postP3Unlocked(s)).toBe(false);
    s.beatsSeen.push('b96_continuara');
    expect(dueloActivo(s)).toBe(false);
    expect(P.postP3Unlocked(s)).toBe(true);
  });
  it('a save that skipped the films, or got past H96 before the beat existed, opens it the same', () => {
    load('h93-final');
    expect(P.postP3Unlocked()).toBe(false);
    for (const id of ['H93', 'H94', 'H95', 'H96']) G.s.missions.done.push(id);
    G.s.missions.active = G.s.missions.active.filter((m) => !/^H9\d$/.test(m));
    expect(G.s.beatsSeen.includes(CONTINUARA_BEAT)).toBe(false);
    expect(P.postP3Unlocked()).toBe(true);
  });
  it('old saves: every fixture loads closed', () => {
    for (const name of ['late-game', 'casino', 'post-finale', 'post-story', 'rupturas-mid', 'rupturas-fin', 'rupturas-o4', 'h65-normal', 'h69-acto1', 'h75-acto2', 'h83-acto3', 'h89-acto4', 'h93-final']) {
      load(name);
      expect(P.postP3Unlocked(), name).toBe(false);
    }
  });
});

// ------------------------------------------------------------------ the Catdex
describe('the Catdex', () => {
  it('before the gate: post cats are invisible — the same total, the same numbers, nothing sealed or rumored', () => {
    load('h93-final');
    const total0 = dexTotal();
    const reg0 = speciesCount();
    const order0 = CATS.map((c) => c.id);
    const defs = inject();
    expect(CATS.slice(0, order0.length).map((c) => c.id)).toEqual(order0);
    expect(dexTotal()).toBe(total0);
    expect(speciesCount()).toBe(reg0);
    for (const d of defs) {
      expect(dexVisible(d.id), d.id).toBe(false);
      expect(dexStatus(d.id), d.id).toBe('unknown');
    }
  });

  it('after it: visible, a RUMOR while a table names it, a sealed card when no table does; the counts add up', () => {
    load('h93-final');
    const total0 = dexTotal();
    const defs = inject();
    // a cat whose champion isn't declared, and one of an element you haven't found: sealed
    const orphan = stubPostCat('zz_hero_orphan', 'h_granbigote', 'podio:nadie');
    undo.push(injectPostCats([orphan]));
    finish();
    expect(dexTotal()).toBe(total0 + defs.length + 1);
    for (const d of defs) {
      expect(dexVisible(d.id), d.id).toBe(true);
      expect(dexStatus(d.id), d.id).toBe('rumor');
      expect(P.postWhereText(d), d.id).not.toMatch(/Todavía no sale/);
    }
    expect(dexStatus('zz_hero_orphan')).toBe('unknown');
    expect(P.postWhereText(orphan)).toMatch(/Todavía no sale/);
    const el = G.s.elements.indexOf('ice');
    G.s.elements.splice(el, 1);
    const icy = stubPostCat('zz_icy', 'l_ignis', 'casino:gacha', { elements: ['ice'] });
    undo.push(injectPostCats([icy]));
    expect(dexStatus('zz_icy')).toBe('unknown');
    expect(P.postPool('gacha', 'michi').some((c) => c.id === 'zz_icy')).toBe(false);
    G.s.elements.push('ice');
    expect(dexStatus('zz_icy')).toBe('rumor');
    // registered: like any cat
    const reg = speciesCount();
    adopt('zz_leg_portal');
    expect(dexStatus('zz_leg_portal')).toBe('registered');
    expect(speciesCount()).toBe(reg + 1);
    // the rumor is derived, never written: the save's catdex only holds what was registered
    expect(Object.keys(G.s.catdex).filter((k) => k.startsWith('zz_'))).toEqual(['zz_leg_portal']);
  });

  it('the Parte III cats keep their own rules (sealed until the story names them)', () => {
    load('h93-final');
    finish();
    inject();
    for (const c of CATS.filter((x) => MD.isP3Cat(x))) expect(MD.isPostCat(c), c.id).toBe(false);
    for (const c of CATS.filter((x) => MD.isPostCat(x))) expect(MD.isP3Cat(c), c.id).toBe(false);
  });
});

// ------------------------------------------------------------------ the casino
describe('the casino before the gate: zero change', () => {
  beforeEach(() => load('h93-final'));
  it('no pool, no odds, no draw, no counter — even with post cats in the data', () => {
    inject();
    const odds0 = JSON.stringify(GA.BANNERS.map((b) => GA.ratesTable(b)));
    let draws = 0;
    const rnd = () => (draws++, 0);
    for (const t of [{ game: 'gacha', sub: 'michi' }, { game: 'gacha', sub: 'holo' }, { game: 'slot' }, { game: 'caja' }, { game: 'eterno' }] as const) {
      expect(P.postOdds(t)).toBeNull();
      expect(P.rollPostCat(t, rnd)).toBeNull();
    }
    expect(draws).toBe(0);
    expect(postKeys()).toEqual([]);
    expect(JSON.stringify(GA.BANNERS.map((b) => GA.ratesTable(b)))).toBe(odds0);
  });
  it('500 Portal pulls, 60 Gatos Misteriosos and 200 Modo Eterno cats: never a post cat, never a counter', () => {
    const ids = new Set(inject().map((d) => d.id));
    CS.cs().tickets = 10_000;
    CS.cs().chips = 60 * 500;
    for (let i = 0; i < 50; i++) for (const p of GA.pull(i % 2 ? 'holo' : 'michi', 10, 'tickets')!) if (p.prize.kind === 'cat') expect(ids.has(p.prize.ref!)).toBe(false);
    for (let i = 0; i < 60; i++) expect(ids.has(CS.buyCaja('cat')!.ref!)).toBe(false);
    for (let i = 0; i < 200; i++) expect(ids.has(CS.withPostTable({ game: 'eterno' }, () => ET.eternoPrize()).ref!)).toBe(false);
    expect(postKeys()).toEqual([]);
  });
});

describe('the casino after the gate', () => {
  beforeEach(() => {
    load('h93-final');
    finish();
  });

  it('the generic pools never get a post cat nor a Parte III cat (Portal, Casino, Resonance, shop, Podio rivals)', () => {
    const defs = inject();
    const bad = (c: CatDef) => MD.isPostCat(c) || MD.isP3Cat(c);
    expect(CS.eligibleCats().filter(bad)).toEqual([]);
    expect(CS.gachaCats().filter(bad)).toEqual([]);
    expect(catOffers().filter((o) => bad(o.def))).toEqual([]);
    for (const d of defs) adopt(d.id, { free: true });
    const cats = G.s.cats.slice(-10);
    for (const a of cats)
      for (const b of cats) {
        if (a.uid === b.uid) continue;
        const t = oddsFor(a.uid, b.uid);
        expect([...t.rows.map((r) => r.species), ...t.secret].filter((s) => s && bad(CAT_BY_ID.get(s)!))).toEqual([]);
      }
    const owned = new Set(defs.map((d) => d.id));
    for (let lg = 1; lg <= 20; lg++) for (let b = 0; b < BOUTS; b++) expect(bad(rival(lg, b, 12345, G.s.elements, owned).def), `${lg}-${b}`).toBe(false);
  });

  it('each table has its pool (banner by banner) and its odds add up to its share', () => {
    inject();
    const ids = (t: string, sub?: string) => P.postPool(t as never, sub).map((c) => c.id);
    expect(ids('gacha', 'michi')).toEqual(['zz_leg_portal']);
    expect(ids('gacha', 'holo')).toEqual(['zz_leg_portal', 'zz_md_holo']);
    expect(ids('slot')).toEqual(['zz_myth_slot', 'zz_leg_slot']);
    expect(ids('caja')).toEqual(['zz_md_caja']);
    expect(ids('eterno')).toEqual(['zz_leg_eterno']);
    const o = P.postOdds({ game: 'slot' })!;
    expect(o.share).toBe(R.POST_CASINO.slot.share);
    expect(o.cats.reduce((s, c) => s + c.inPool, 0)).toBeCloseTo(1, 12);
    expect(o.cats.reduce((s, c) => s + c.next, 0)).toBeCloseTo(o.next, 12);
    // weights: 1 and 3, both unowned (×3 each: the ratio stays 1:3)
    expect(o.cats.map((c) => c.inPool)).toEqual([0.25, 0.75]);
    adopt('zz_leg_slot');
    // now the one you don't have weighs ×3: 3 vs 3
    expect(P.postOdds({ game: 'slot' })!.cats.map((c) => c.inPool)).toEqual([0.5, 0.5]);
  });

  it('the guarantee: share by share, and the pity-th legendary / mythic cat in a row is certain; then it starts again', () => {
    inject();
    const t = { game: 'gacha' as const, sub: 'michi' };
    const N = R.POST_CASINO.gacha.pity;
    expect(N).toBeGreaterThan(1);
    expect(P.postPityLeft(t)).toBe(N);
    // unlucky every time: N − 1 misses, then the guarantee
    for (let i = 1; i < N; i++) {
      expect(P.rollPostCat(t, () => 0.999)).toBeNull();
      expect(P.postPityCount(t)).toBe(i);
    }
    expect(P.postPityLeft(t)).toBe(1);
    expect(P.postOdds(t)!.next).toBe(1);
    expect(P.rollPostCat(t, () => 0.999)?.id).toBe('zz_leg_portal');
    expect(P.postPityCount(t)).toBe(0);
    // each banner keeps its own count
    P.rollPostCat({ game: 'gacha', sub: 'holo' }, () => 0.999);
    expect(P.postPityCount({ game: 'gacha', sub: 'holo' })).toBe(1);
    expect(P.postPityCount(t)).toBe(0);
    expect(postKeys().sort()).toEqual(['post:gacha:holo', 'post:gacha:michi']);
  });

  it('the printed share is the real one (no guarantee in the way): 40k legendary / mythic cats, by weight', () => {
    inject();
    const pity = R.POST_CASINO.slot.pity;
    R.POST_CASINO.slot.pity = 0;
    try {
      let s = 7;
      const rnd = () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296);
      const n = 40_000;
      const got: Record<string, number> = {};
      let post = 0;
      for (let i = 0; i < n; i++) {
        const c = P.rollPostCat({ game: 'slot' }, rnd);
        if (c) {
          post++;
          got[c.id] = (got[c.id] ?? 0) + 1;
        }
      }
      expect(post / n).toBeGreaterThan(R.POST_CASINO.slot.share - 0.01);
      expect(post / n).toBeLessThan(R.POST_CASINO.slot.share + 0.01);
      expect(got.zz_leg_slot / post).toBeGreaterThan(0.73);
      expect(got.zz_leg_slot / post).toBeLessThan(0.77);
    } finally {
      R.POST_CASINO.slot.pity = pity;
    }
  });

  it('the Portal: with its guarantee due, the banner’s next legendary / mythic CAT is its post cat (a real discovery)', () => {
    inject();
    CS.cs().tickets = 100;
    const b = GA.banner('michi');
    CS.cs().pity['post:gacha:michi'] = R.POST_CASINO.gacha.pity - 1;
    // legendary pulls until one gives a legendary / mythic cat (the tier can also pay an accessory or an épico HOLO)
    let got: import('../src/state/sys/gacha').Pull | undefined;
    for (let i = 0; i < 60 && !got; i++) {
      CS.cs().pity['michi:l'] = GA.pityCaps(b).hard - 1;
      const before = CS.cs().pity['post:gacha:michi'];
      const [p] = GA.pull('michi', 1, 'tickets')!;
      expect(GA.rankOf(p.tier)).toBeGreaterThanOrEqual(3);
      const d = p.prize.kind === 'cat' ? CAT_BY_ID.get(p.prize.ref!)! : null;
      if (d && (MD.isPostCat(d) || d.rarity === 'legendary' || d.rarity === 'mythic')) got = p;
      // an accessory or an épico never moves the Multiverse counter
      else expect(CS.cs().pity['post:gacha:michi']).toBe(before);
    }
    expect(got?.prize.ref).toBe('zz_leg_portal');
    expect(got!.got.isNew).toBe(true);
    expect(G.s.catdex.zz_leg_portal).toBe('registered');
    expect(CS.cs().pity['post:gacha:michi']).toBe(0);
    // the holo banner's own counter never moved
    expect(CS.cs().pity['post:gacha:holo'] ?? 0).toBe(0);
  });

  it('the Tragamichis: three GATO NEGRO on a line with fichas → the Multiverse at its guarantee', () => {
    inject();
    CS.cs().chips = 1000;
    CS.cs().pity['post:slot'] = R.POST_CASINO.slot.pity - 1;
    // the reels stop on GATO NEGRO (the strips are public), every other draw high (épico+ roll → LEGENDARIO; no HOLO)
    const stops = CS.STRIPS.map((s) => s.indexOf('neko'));
    const queue = stops.map((i) => (i + 0.5) / CS.STRIP_LEN);
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(<T extends ArrayBufferView | null>(a: T) => {
      const v = queue.length ? queue.shift()! : 0.97;
      (a as unknown as Uint32Array)[0] = Math.floor(v * 4294967296);
      return a;
    });
    const r = CS.spinSlot('chips', 0)!;
    expect(r.wins.some((w) => w.sym === 'neko')).toBe(true);
    const cat = r.granted.find((g) => g.kind === 'cat')!;
    expect(['zz_myth_slot', 'zz_leg_slot']).toContain(cat.ref);
    expect(CS.cs().pity['post:slot']).toBe(0);
  });

  it('La Caja: the Gato Misterioso’s legendary comes from the Multiverse at its guarantee', () => {
    inject();
    CS.cs().chips = 500 * 400;
    CS.cs().pity['post:caja'] = R.POST_CASINO.caja.pity - 1;
    let got: string | undefined;
    for (let i = 0; i < 400 && !got; i++) {
      const g = CS.buyCaja('cat')!;
      if (CAT_BY_ID.get(g.ref!)!.rarity === 'legendary' || MD.isPostCat(CAT_BY_ID.get(g.ref!))) got = g.ref;
    }
    expect(got).toBe('zz_md_caja');
    expect(CS.cs().pity['post:caja']).toBe(0);
  });

  it('Modo Eterno: the special cat of a WIN is the Multiverse’s at its guarantee', () => {
    inject();
    CS.cs().pity['post:eterno'] = R.POST_CASINO.eterno.pity - 1;
    const s = ET.startEterno('slot');
    ET.lockEterno(s.id, 'chips');
    const r = ET.resolveEterno(s.id, 0.1)!;
    expect(r.record.r).toBe('win');
    expect(r.record.prize?.ref).toBe('zz_leg_eterno');
  });

  it('the Parte III cats stay out of every table after the gate too', () => {
    inject();
    CS.cs().tickets = 3000;
    for (let i = 0; i < 30; i++) for (const p of GA.pull('michi', 10, 'tickets')!) if (p.prize.kind === 'cat') expect(MD.isP3Cat(CAT_BY_ID.get(p.prize.ref!)), p.prize.ref).toBe(false);
  });
});

// ------------------------------------------------------------------ the Podio
describe('the Podio: the Copa Fuera de la Caja', () => {
  const climbTo = (league: number) => {
    const p = PO.ps();
    p.league = league;
    p.bout = 0;
    p.champions = Array.from({ length: league - 1 }, (_, i) => i + 1);
  };
  const lateCat = () => {
    const r = adopt('c_chispa', { free: true });
    const c = r.cat ?? G.s.cats.find((x) => x.species === 'c_chispa')!;
    c.level = 90;
    c.stars = 6;
    return c;
  };
  /** two Heroicos of the Copa: one for a real champion (the first) and the stub's */
  const twoHeroes = () => [stubPostCat('zz_hero_borracha', 'h_granbigote', 'podio:copa_borracha'), ...STUBS()];
  beforeEach(() => {
    load('h93-final');
    G.flag('podio_unlocked');
  });

  it('DISEÑO\'s eight challenges, in order, each a little harder (×1.10 … ×1.45)', () => {
    const list = [...R.POST_CHAMPIONS].sort((a, b) => a.order - b.order);
    expect(list.map((c) => c.id)).toEqual(['copa_borracha', 'copa_superheroes', 'copa_anime', 'copa_libros', 'copa_pop', 'copa_pinceles', 'copa_pantalla', 'copa_pixel']);
    expect(list.map((c) => c.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    list.forEach((c, i) => expect(c.mult).toBeCloseTo(1.1 + 0.05 * i, 9));
    for (const c of list) expect(c.trainer && c.line, c.id).toBeTruthy();
    // every post cat of the Podio has its champion; a champion without its cat yet is dormant (the art comes in waves)
    for (const c of P.postCats()) {
      const s = P.postSource(c);
      if (s?.kind === 'podio') expect(list.map((x) => x.id), c.id).toContain(s.champion);
    }
  });

  it('before the gate: no Copa (no row, no rival), the ladder exactly as it was', () => {
    climbTo(12);
    const before = Array.from({ length: 15 }, (_, i) => Array.from({ length: BOUTS }, (_, b) => PO.rivalAt(i + 1, b).species));
    inject(twoHeroes());
    expect(P.copaChallenges()).toEqual([]);
    expect(PO.copaOpen()).toBe(false);
    expect(PO.copaRival('copa_borracha')).toBeNull();
    expect(Array.from({ length: 15 }, (_, i) => Array.from({ length: BOUTS }, (_, b) => PO.rivalAt(i + 1, b).species))).toEqual(before);
    // and no league pays a post cat
    for (let lg = 1; lg <= 30; lg++) expect(MD.isPostCat(CAT_BY_ID.get(PO.championPrize(lg) ?? ''))).toBe(false);
  });

  it('after it: a row of its own, in order (the first open, the next sealed); the ladder doesn\'t move', () => {
    climbTo(12);
    const before = Array.from({ length: 15 }, (_, i) => Array.from({ length: BOUTS }, (_, b) => PO.rivalAt(i + 1, b).species));
    inject(twoHeroes());
    finish();
    expect(PO.copaOpen()).toBe(true);
    const row = P.copaChallenges();
    expect(row.map((c) => [c.champion.id, c.state])).toEqual([
      ['copa_borracha', 'next'],
      ['zz_campeon', 'sealed'],
    ]);
    expect(PO.copaRival('zz_campeon')).toBeNull();
    expect(Array.from({ length: 15 }, (_, i) => Array.from({ length: BOUTS }, (_, b) => PO.rivalAt(i + 1, b).species))).toEqual(before);
  });

  it('anchored to your frontier league (never below 8): its champion\'s power × the challenge\'s mult, with its Heroico', () => {
    inject(twoHeroes());
    finish();
    climbTo(3);
    const low = PO.copaRival('copa_borracha')!;
    expect(low.league).toBe(8);
    expect(low.copa).toBe('copa_borracha');
    expect(low.species).toBe('zz_hero_borracha');
    expect(low.champion).toBe(true);
    expect(low.trainer).toBe('LA INVICTA DE LA BARRA');
    expect(low.taunt).toMatch(/Codo en la mesa/);
    expect(low.power).toBeCloseTo(boutPower(8, 4) * 1.1, 6);
    climbTo(14);
    const high = PO.copaRival('copa_borracha')!;
    expect(high.league).toBe(14);
    expect(high.power).toBeCloseTo(boutPower(14, 4) * 1.1, 6);
    expect(high.power).toBeGreaterThan(low.power);
  });

  it('the first win pays its Heroico once (+ champion orbs and gems), opens the next; rematches never pay the cat', () => {
    inject(twoHeroes());
    finish();
    climbTo(10);
    const p0 = JSON.stringify({ league: PO.ps().league, bout: PO.ps().bout, champions: PO.ps().champions });
    const c = lateCat();
    const out = PO.copaOutlook(c, 'copa_borracha')!;
    expect(out.prize).toBe('zz_hero_borracha');
    expect(out.gems).toBe(PB.rewards.champion_gems);
    expect(out.orbs).toBe(PB.rewards.orbs_champion);
    // a loss costs nothing and pays no cat
    const gems0 = G.s.gems;
    const lost = PO.applyCopaDuel(c, 'copa_borracha', false, false);
    expect(lost.prize).toBeNull();
    expect(P.postChampionPaid('copa_borracha')).toBe(false);
    const win = PO.applyCopaDuel(c, 'copa_borracha', true, false, true);
    expect(win.firstChampion).toBe(true);
    expect(win.prize?.species).toBe('zz_hero_borracha');
    expect(win.leagueUp).toBe(false);
    expect(G.s.gems - gems0).toBeGreaterThanOrEqual(PB.rewards.champion_gems);
    expect(G.s.catdex.zz_hero_borracha).toBe('registered');
    expect(P.postChampionPaid('copa_borracha')).toBe(true);
    // the ladder never moved
    expect(JSON.stringify({ league: PO.ps().league, bout: PO.ps().bout, champions: PO.ps().champions })).toBe(p0);
    // the next one opens; the first one is a rematch now
    expect(P.copaChallenges().map((k) => k.state)).toEqual(['paid', 'next']);
    const re = PO.copaOutlook(c, 'copa_borracha')!;
    expect(re.prize).toBeNull();
    expect(re.kind).toBe('repeat');
    for (let i = 0; i < 4; i++) expect(PO.applyCopaDuel(c, 'copa_borracha', true, true).prize).toBeNull();
    expect(G.s.cats.filter((x) => x.species === 'zz_hero_borracha')).toHaveLength(1);
    // the stub's challenge pays its own cat
    expect(PO.applyCopaDuel(c, 'zz_campeon', true, false).prize?.species).toBe('zz_hero');
    expect(P.copaChallenges().map((k) => k.state)).toEqual(['paid', 'paid']);
  });

  it('a champion whose Heroico isn\'t in the game yet is skipped: it never blocks the row', () => {
    inject();
    finish();
    // only the stub's Heroico exists: the real champions before it are dormant, the stub's challenge is open
    expect(P.copaChallenges().map((c) => [c.champion.id, c.state])).toEqual([['zz_campeon', 'next']]);
  });
});

// ------------------------------------------------------------------ the vitrinas
describe('the vitrinas of the coin tables', () => {
  /** a showcase of 8 (1 legendary, 2 mythic, 5 Multidimensional, the star weighs 4) on `t` */
  const SHOWCASE = (t: string, src = 'casino:gacha:michi') => [
    stubPostCat(`zz_${t}_leg`, 'l_ignis', src, { vitrina: t, weight: 10 }),
    stubPostCat(`zz_${t}_m1`, 'm_raijin', src, { vitrina: t, weight: 10 }),
    stubPostCat(`zz_${t}_m2`, 'm_singular', src, { vitrina: t, weight: 10 }),
    ...[1, 2, 3, 4, 5].map((i) => stubPostCat(`zz_${t}_md${i}`, 'x_homiau', src, { vitrina: t, weight: i === 1 ? 4 : 10, star: i === 1 })),
  ];
  const keys = () => Object.keys(G.s.casino?.pity ?? {}).filter((k) => k.startsWith('post:vit') || k === 'post:sellos');
  /** crypto RNG pinned to `v` (the casino's rand): every draw returns it */
  const pinRand = (v: number) =>
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(<T extends ArrayBufferView | null>(a: T) => {
      (a as unknown as Uint32Array)[0] = Math.floor(v * 4294967296);
      return a;
    });
  beforeEach(() => load('h93-final'));

  it('the data: a vitrina is one of the seven coin tables (or the big table\'s own name); the validator says so', () => {
    expect(Object.keys(R.VITRINA_TABLES).sort()).toEqual(['bingo', 'boxes', 'dice', 'hilo', 'plinko', 'roulette', 'scratch']);
    const refs = { balance: BALANCE, roles: RAW.roles.map((r) => r.id), elements: ELEMENTS.map((e) => e.id) };
    expect(validatePostCats(SHOWCASE('plinko') as never, refs)).toEqual([]);
    expect(validatePostCats([stubPostCat('zz_x', 'l_ignis', 'casino:slot', { vitrina: 'slot' })] as never, refs)).toEqual([]);
    expect(validatePostCats([stubPostCat('zz_x', 'l_ignis', 'casino:slot', { vitrina: 'tragamonedas' })] as never, refs).join()).toMatch(/post.vitrina desconocida/);
    expect(validatePostCats([stubPostCat('zz_x', 'h_zarpa', 'podio:x', { vitrina: 'plinko' })] as never, refs).join()).toMatch(/no va en una vitrina/);
    // the numbers DISEÑO printed (03 §4)
    expect(R.POST_VITRINA.chance).toBe(0.006);
    expect(R.POST_VITRINA.roll.consolation + R.POST_VITRINA.roll.legendary + R.POST_VITRINA.roll.mythic + R.POST_VITRINA.roll.multidimensional).toBeCloseTo(1, 12);
    expect(R.POST_VITRINA.pity).toEqual({ cat: 5, md: 15, spark: 25 });
  });

  it('before the gate: no showcase, no draw, no counter — the tables play exactly as before', () => {
    inject([...SHOWCASE('plinko'), ...SHOWCASE('roulette', 'casino:gacha:holo')]);
    let draws = 0;
    expect(V.vitrinaOnBet('plinko', 'chips', true, 3, () => (draws++, 0))).toEqual([]);
    expect(draws).toBe(0);
    expect(V.vitrinaOdds('plinko')).toBeNull();
    pinRand(0);
    CS.cs().chips = 1000;
    const r = PL.plinkoDrop('chips', 0, 25, () => 0.3)!;
    expect(r.candy.filter((g) => g.vitrina)).toEqual([]);
    const rr = CS.spinRoulette('chips', { kind: 'color', v: 'red' }, 25)!;
    expect(rr.bonus.filter((g) => g.vitrina)).toEqual([]);
    expect(keys()).toEqual([]);
    expect(V.vitrinaSelloOnCandy()).toBe(0);
  });

  it('after it, a bet that counts opens the showcase at its fixed chance, rolled apart: the payout never changes', () => {
    inject(SHOWCASE('plinko'));
    CS.cs().chips = 10_000;
    const path = () => 0.3;
    pinRand(0.5); // the Momento misses at 0.5
    const a = PL.plinkoDrop('chips', 0, 25, path)!;
    finish();
    const b = PL.plinkoDrop('chips', 0, 25, path)!;
    expect([b.slot, b.payout]).toEqual([a.slot, a.payout]);
    expect(b.candy.filter((g) => g.vitrina)).toEqual([]);
    vi.restoreAllMocks();
    pinRand(0); // the Momento hits (0 < 0.6 %): a throw — consolation, you have none of them: 40 fichas
    const c = PL.plinkoDrop('chips', 0, 25, path)!;
    expect([c.slot, c.payout]).toEqual([a.slot, a.payout]);
    const v = c.candy.filter((g) => g.vitrina);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ vitrina: 'plinko', kind: 'chips', n: R.POST_VITRINA.consolation.chipsIfNone });
    expect(keys().sort()).toEqual(['post:vit:plinko:c', 'post:vit:plinko:md', 'post:vit:plinko:s']);
    // a small bet never counts (10 fichas), whatever the dice say
    expect(PL.plinkoDrop('chips', 0, 10, path)!.candy.filter((g) => g.vitrina)).toEqual([]);
  });

  it('what counts: fichas ≥ 25, gold ≥ ¼ of the table\'s cap, never gems; a Bingo card is a bet; never in the MODO ETERNO', () => {
    expect(V.vitrinaQualifies('chips', 10, 0)).toBe(false);
    expect(V.vitrinaQualifies('chips', 25, 0)).toBe(true);
    expect(V.vitrinaQualifies('gold', 99, 100)).toBe(false);
    expect(V.vitrinaQualifies('gold', 100, 100)).toBe(true);
    expect(V.vitrinaQualifies('gems', 3, 0)).toBe(false);
    inject(SHOWCASE('bingo', 'casino:slot'));
    finish();
    expect(V.vitrinaOnBet('bingo', 'chips', true, 3, () => 0)).toHaveLength(3);
    expect(V.vitrinaOnBet('slot', 'chips', true, 1, () => 0)).toEqual([]);
    const s = ET.startEterno('bingo');
    expect(V.vitrinaOnBet('bingo', 'chips', true, 3, () => 0)).toEqual([]);
    ET.stopEterno(s.id);
    expect(V.vitrinaOnBet('bingo', 'chips', true, 1, () => 0)).toHaveLength(1);
  });

  it('the Ruleta: a spin that counts is one bet', () => {
    inject(SHOWCASE('roulette', 'casino:gacha:holo'));
    finish();
    CS.cs().chips = 1000;
    pinRand(0);
    const r = CS.spinRoulette('chips', { kind: 'color', v: 'red' }, 25)!;
    expect(r.bonus.filter((g) => g.vitrina)).toHaveLength(1);
    expect(CS.spinRoulette('chips', { kind: 'color', v: 'red' }, 10)!.bonus.filter((g) => g.vitrina)).toEqual([]);
  });

  it('a throw: only cats you lack; a cat at the latest every 5 throws, a Multidimensional every 15', () => {
    const defs = inject(SHOWCASE('dice'));
    finish();
    const ids = new Set(defs.filter((d) => d.post?.vitrina === 'dice').map((d) => d.id));
    // unlucky every time (rnd 0 = consolation): four consolations, the fifth is a cat
    for (let i = 1; i <= 4; i++) {
      const g = V.vitrinaThrow('dice', 'momento', () => 0);
      expect(g.kind, `throw ${i}`).toBe('chips');
      expect(V.vitrinaCounters('dice').catLeft).toBe(5 - i);
    }
    const cat = V.vitrinaThrow('dice', 'momento', () => 0);
    expect(cat.kind).toBe('cat');
    expect(ids.has(cat.ref!)).toBe(true);
    expect(V.vitrinaCounters('dice').catLeft).toBe(5);
    // the Multidimensional guarantee
    CS.cs().pity['post:vit:dice:md'] = 14;
    const md = V.vitrinaThrow('dice', 'momento', () => 0.99);
    expect(CAT_BY_ID.get(md.ref!)!.rarity).toBe('multidimensional');
    expect(V.vitrinaCounters('dice').mdLeft).toBe(15);
    // never a repeat: with every Multidimensional owned, a Multidimensional roll falls to a mythic
    for (const d of defs) if (d.rarity === 'multidimensional') adopt(d.id, { free: true });
    const fall = V.vitrinaThrow('dice', 'momento', () => 0.99);
    expect(CAT_BY_ID.get(fall.ref!)!.rarity).toBe('mythic');
    // complete: every throw is a consolation of orbs ×3
    for (const d of defs) adopt(d.id, { free: true });
    const done = V.vitrinaThrow('dice', 'momento', () => 0.99);
    expect(done).toMatchObject({ kind: 'orbs', n: R.POST_VITRINA.consolation.orbs * R.POST_VITRINA.consolation.completeOrbsMult });
    expect(ids.has(done.ref!)).toBe(true);
  });

  it('the printed throw table is the real one, and it adds up after the guarantees', () => {
    inject(SHOWCASE('hilo', 'casino:gacha:holo'));
    finish();
    const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
    expect(V.vitrinaThrowOdds('hilo')).toEqual({ consolation: 0.6, legendary: 0.14, mythic: 0.11, multidimensional: 0.15 });
    CS.cs().pity['post:vit:hilo:c'] = 4;
    expect(V.vitrinaThrowOdds('hilo').consolation).toBe(0);
    expect(sum(V.vitrinaThrowOdds('hilo'))).toBeCloseTo(1, 12);
    CS.cs().pity['post:vit:hilo:md'] = 14;
    expect(V.vitrinaThrowOdds('hilo').multidimensional).toBe(1);
    // 30k seeded throws, no guarantees in the way: the shares are the table's
    CS.cs().pity['post:vit:hilo:c'] = -1e9;
    let s = 11;
    const rnd = () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296);
    const n = 4_000;
    const got = { consolation: 0, cat: 0 };
    for (let i = 0; i < n; i++) {
      CS.cs().pity['post:vit:hilo:c'] = 0;
      CS.cs().pity['post:vit:hilo:md'] = 0;
      for (const d of P.postCats()) if (d.post?.vitrina === 'hilo') delete G.s.catdex[d.id];
      const g = V.vitrinaThrow('hilo', 'momento', rnd);
      got[g.kind === 'cat' ? 'cat' : 'consolation']++;
    }
    expect(got.consolation / n).toBeGreaterThan(0.575);
    expect(got.consolation / n).toBeLessThan(0.625);
  });

  it('the spark: 25 throws in a showcase, pick any cat of it you lack (and it goes back down by 25)', () => {
    inject(SHOWCASE('scratch', 'casino:slot'));
    finish();
    expect(V.vitrinaSparkReady('scratch')).toBe(false);
    expect(V.vitrinaSparkPick('scratch', 'zz_scratch_md1')).toBeNull();
    CS.cs().pity['post:vit:scratch:s'] = 27;
    expect(V.vitrinaSparkReady('scratch')).toBe(true);
    const g = V.vitrinaSparkPick('scratch', 'zz_scratch_md1')!;
    expect(g).toMatchObject({ kind: 'cat', ref: 'zz_scratch_md1', vitrina: 'scratch', via: 'chispa' });
    expect(G.s.catdex.zz_scratch_md1).toBe('registered');
    expect(V.vitrinaCounters('scratch').spark).toBe(2);
    // never a cat you already have
    CS.cs().pity['post:vit:scratch:s'] = 25;
    expect(V.vitrinaSparkPick('scratch', 'zz_scratch_md1')).toBeNull();
  });

  it('the Sellos: LA CASA TE DEBE pays one more while a showcase is open; 5 buy a throw where you choose', () => {
    inject(SHOWCASE('boxes', 'casino:caja'));
    finish();
    CS.cs().chips = 100_000;
    CS.cs().owed = CS.CANDY.every - 1;
    // a losing bet pays the candy → a Sello
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    CS.recordBet('boxes', 'chips', 25, 0, 'CAJAS x0', false);
    expect(V.sellos()).toBe(1);
    expect(V.vitrinaRedeemSellos('boxes')).toBeNull();
    CS.cs().pity['post:sellos'] = 5;
    const g = V.vitrinaRedeemSellos('boxes', () => 0.99)!;
    expect(g).toMatchObject({ vitrina: 'boxes', via: 'sellos' });
    expect(V.sellos()).toBe(0);
    expect(V.vitrinaCounters('boxes').spark).toBe(1);
  });
});

// ------------------------------------------------------------------ saves
describe('save safety', () => {
  it('old saves load untouched: no post counter, no flag, no Catdex entry, the same Catdex', () => {
    for (const name of ['late-game', 'post-finale', 'rupturas-fin', 'h89-acto4', 'h93-final']) {
      load(name);
      const dex = JSON.stringify(G.s.catdex);
      const total = dexTotal();
      inject();
      expect(postKeys(), name).toEqual([]);
      expect(Object.keys(G.s.flags).filter((k) => k.startsWith('postchamp_')), name).toEqual([]);
      expect(JSON.stringify(G.s.catdex), name).toBe(dex);
      expect(dexTotal(), name).toBe(total);
      for (const u of undo.splice(0).reverse()) u();
    }
  });
  it('after the gate the counters, the cat and the paid champion survive a save and a reload', () => {
    load('h93-final');
    inject();
    finish();
    P.rollPostCat({ game: 'slot' }, () => 0.999);
    P.rollPostCat({ game: 'slot' }, () => 0.999);
    adopt('zz_md_caja');
    G.flag(P.postChampionKey('zz_campeon'));
    G.save();
    G.load();
    expect(P.postP3Unlocked()).toBe(true);
    expect(P.postPityCount({ game: 'slot' })).toBe(2);
    expect(G.s.catdex.zz_md_caja).toBe('registered');
    expect(P.postChampionPaid('zz_campeon')).toBe(true);
  });
});
