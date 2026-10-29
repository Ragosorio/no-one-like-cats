/**
 * Parte III · LOS GATOS DE LAS CAJAS (GATOS-DATOS; ⚠️ spoilers) — docs/part-iii/mecanicas-v2/05-gatos-coleccionables.md.
 *
 *   · the data: 35 species appended after every older one (no Catdex number moves), their art, a source each
 *   · each source gives the right cat ONCE: etapa (a first win), historia (a mission), rescate (a win after a
 *     requirement; Homiau's catch-up), actividad (orbs per battle, then the cat), recordar (after H97, Maneki's any win)
 *   · repeats: a Multidimensional of the box you have, 35 % seeded (the same win always gives the same)
 *   · never the Portal, the Casino, the Resonance, the cat shop nor the Podio
 *   · old saves get nothing (late-game, rupturas-mid, post-finale…): no cat, no flag, the same Catdex
 *   · the reveal script (the director) and the MULTIDIMENSIONAL flag on
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

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
const { CATS, CAT_BY_ID, MISSION_BY_ID } = await import('../src/data/content');
const ESP = (await import('../src/data/gateras/especies.json')).default as { cats: { id: string }[] };
const P3 = await import('../src/state/sys/p3cats');
const MD = await import('../src/state/sys/multidim');
const GT = await import('../src/state/sys/gateras');
const GB = await import('../src/state/sys/gaterasBattles');
const { eligibleCats, gachaCats } = await import('../src/state/sys/casino');
const { oddsFor } = await import('../src/state/sys/resonance');
const { catOffers } = await import('../src/state/sys/shop');
const { rival } = await import('../src/podio/ladder');
const { dexStatus, dexVisible } = await import('../src/state/sys/cats');
const { dexTotal } = await import('../src/state/ext/collection');
const { markBeat } = await import('../src/state/ext/story');
const { P3_CAT_WHEN } = await import('../src/ui/story/p3CatsScript');
const { cardKey } = await import('../src/ui/story/gaterasScript');

const won = { won: true, reason: 'sunk', turns: 6, modulesDestroyed: 3, damageDealt: 100, catsLost: 0, perfect: false } as never;
const fixture = (name: string) => readFileSync(new URL(`../test-saves/${name}.json`, import.meta.url), 'utf8');
function load(name: string) {
  mem.clear();
  mem.set(SAVE_KEY, fixture(name));
  G.load();
  if (!G.loaded) throw new Error(`${name} no carga`);
}
const owned = (id: string) => G.s.cats.filter((c) => c.species === id).length;
const P3IDS = ESP.cats.map((c) => c.id);
/** the post-Parte III cats: invisible in every save of these tests (none finished the Parte III: state/sys/postp3.ts) */
const POSTN = () => CATS.filter((c) => MD.isPostCat(c)).length;
const done = (...ids: string[]) => {
  for (const id of ids) if (!G.s.missions.done.includes(id)) G.s.missions.done.push(id);
};

describe('the data (data/gateras/especies.json)', () => {
  it('35 cats, appended after every older species: no Catdex number moves', () => {
    expect(P3IDS.length).toBe(35);
    expect(new Set(P3IDS).size).toBe(35);
    const at = CATS.findIndex((c) => c.id === P3IDS[0]);
    expect(CATS.slice(at, at + P3IDS.length).map((c) => c.id)).toEqual(P3IDS);
    // only the post-Parte III cats come after them (data/postp3/especies.json, appended last)
    expect(CATS.slice(at + P3IDS.length).every((c) => MD.isPostCat(c))).toBe(true);
    expect(CATS.slice(0, at).some((c) => MD.isP3Cat(c))).toBe(false);
  });

  it('every one has its painting (lite + full), a source, an origin and LatAm Spanish text', () => {
    for (const id of P3IDS) {
      const d = CAT_BY_ID.get(id)!;
      expect(existsSync(new URL(`../public/cats-svg/lite/${d.art.slug}.svg`, import.meta.url)), `${id} lite`).toBe(true);
      expect(existsSync(new URL(`../public/cats-svg/${d.art.slug}.svg`, import.meta.url)), `${id} full`).toBe(true);
      expect(d.obtain.source.startsWith('p3:'), id).toBe(true);
      expect(d.p3?.kind, id).toBe(d.obtain.source.slice(3));
      expect(d.origin, id).toBeTruthy();
      expect(d.lore.length, id).toBeGreaterThan(40);
      // no «vosotros» Spain-isms in the lore (LatAm voice); the one quote of Garbancito's tale is its catchphrase
      expect(/\b(vosotros|vuestro|coged|tío)\b/i.test(d.lore), id).toBe(false);
    }
  });

  it('every source names a real node, mission or flag of the Carta', () => {
    for (const id of P3IDS) {
      const s = CAT_BY_ID.get(id)!.p3!;
      if (s.mission) expect(MISSION_BY_ID.has(s.mission), `${id} ${s.mission}`).toBe(true);
      for (const r of [s.after, s.rumor]) if (r?.startsWith('mission:')) expect(MISSION_BY_ID.has(r.slice(8)), `${id} ${r}`).toBe(true);
      if (s.node) {
        expect(GT.DIM_IDS as string[], id).toContain(s.dim);
        expect(GB.gateraBattleDef(s.dim as never, s.node)?.crew?.length, `${id} ${s.dim} ${s.node}`).toBeGreaterThan(0);
      }
      if (s.kind === 'etapa' || s.kind === 'rescate') expect(s.node, id).toBeTruthy();
      if (s.kind === 'historia') expect(s.mission, id).toBeTruthy();
      if (s.kind === 'recordar') expect(s.after, id).toBe('mission:H97');
    }
  });

  it('no source pays during the finale (H93–H96: zero rewards between SADIE and «Continuará»)', () => {
    for (const id of P3IDS) {
      const s = CAT_BY_ID.get(id)!.p3!;
      for (const m of [s.mission, s.after?.replace('mission:', '')]) if (m) expect(['H93', 'H94', 'H95', 'H96'], id).not.toContain(m);
    }
  });

  it('the rosters use the real cats where they were stand-ins (and the captain sails)', () => {
    const cap = (dim: string, node: string) => GB.gateraBattleDef(dim as never, node)!;
    expect(cap('p3d_borracha', '5').captain).toBe('r_dona');
    expect(cap('p3d_borracha', '9').captain).toBe('e_cadenero');
    expect(cap('p3d_borracha', 'eemiau').crew).toEqual(['l_emiau', 'c_chispa', 'r_magmito', 'r_scratch']);
    expect(cap('p3d_superheroes', '5').captain).toBe('e_ovillo');
    expect(cap('p3d_superheroes', 'eestambre').captain).toBe('e_estambre');
    expect(cap('p3d_anime', 'a5').captain).toBe('l_bigoton');
    expect(cap('p3d_libros', 'l5').captain).toBe('e_encuadernadora');
    expect(cap('p3d_libros', 'l8').captain).toBe('e_sirsimon');
    expect(cap('p3d_pop', 'p5').captain).toBe('e_manager');
  });
});

describe('never from the Portal, the Casino, the Resonance, the cat shop nor the Podio', () => {
  it('no pool carries a box cat (h93-final: every element known, the Parte III played)', () => {
    load('h93-final');
    const isP3 = (c: { obtain: { source: string } }) => c.obtain.source.startsWith('p3:');
    expect(eligibleCats().filter(isP3)).toEqual([]);
    expect(gachaCats().filter(isP3)).toEqual([]);
    expect(catOffers().map((o) => o.def).filter(isP3)).toEqual([]);
    const owned = new Set(Object.keys(G.s.catdex).filter((k) => G.s.catdex[k] === 'registered'));
    let seen = 0;
    for (let seed = 1; seed <= 40; seed++)
      for (let lg = 1; lg <= 15; lg++)
        for (let bout = 0; bout < 6; bout++) {
          const r = rival(lg, bout, seed * 7919, G.s.elements, owned);
          expect(r.def.id).toBe(r.species);
          expect(MD.isP3Cat(r.def), `${seed} ${lg} ${bout} ${r.species}`).toBe(false);
          seen++;
        }
    expect(seen).toBe(40 * 15 * 6);
  });

  it('the Resonance never lists one, not even as a duplicate of a cat you have', () => {
    load('h93-final');
    // give the save a box cat of every element pair, then cross every pair of cats it has
    for (const id of ['r_hipolito', 'e_ovillo', 'x_murciegato', 'e_sonrisa']) if (!owned(id)) P3.grantP3Cat(id);
    const cats = G.s.cats.slice(0, 18);
    for (const a of cats)
      for (const b of cats) {
        if (a.uid === b.uid) continue;
        const t = oddsFor(a.uid, b.uid);
        const hit = [...t.rows.map((r) => r.species), ...t.secret].filter((s) => s && MD.isP3Cat(CAT_BY_ID.get(s)));
        expect(hit).toEqual([]);
      }
  });
});

describe('old saves get nothing', () => {
  for (const name of ['late-game', 'rupturas-mid', 'post-finale', 'post-story', 'rupturas-fin', 'rupturas-o4']) {
    it(`${name}: no box cat, no flag, no Catdex entry; its Catdex total is the one it had`, () => {
      load(name);
      expect(P3.p3Touched()).toBe(false);
      expect(G.s.cats.filter((c) => P3IDS.includes(c.species))).toEqual([]);
      expect(Object.keys(G.s.flags).filter((k) => k.startsWith('p3cat_'))).toEqual([]);
      expect(Object.keys(G.s.catdex).filter((k) => P3IDS.includes(k))).toEqual([]);
      expect(dexTotal()).toBe(CATS.length - P3IDS.length - POSTN());
      expect(P3IDS.some((id) => dexVisible(id))).toBe(false);
      // the checks themselves never grant anything here
      expect(P3.checkP3Cats()).toEqual([]);
    });
  }
  it('h69-acto1 (the slice, before B-5): nothing yet; the box cats are sealed cards, never silhouettes', () => {
    load('h69-acto1');
    expect(P3.p3Touched()).toBe(true);
    expect(G.s.cats.filter((c) => P3IDS.includes(c.species))).toEqual([]);
    expect(dexTotal()).toBe(CATS.length - POSTN());
    for (const id of P3IDS) expect(dexStatus(id), id).toBe('unknown');
  });
});

describe('each source gives the right cat, once', () => {
  it('etapa: the élite B-5 → Oficial Dona (a real discovery), once; a repeat gives no second cat', () => {
    load('h69-acto1');
    const gems = G.s.gems;
    const loot = GB.applyGateraResult('p3d_borracha', 5, won);
    expect(loot.p3?.cats).toEqual(['r_dona']);
    expect(owned('r_dona')).toBe(1);
    expect(G.s.catdex.r_dona).toBe('registered');
    expect(G.s.gems).toBeGreaterThan(gems);
    expect(P3.p3Earned('r_dona')).toBe(true);
    const again = GB.applyGateraResult('p3d_borracha', 5, won);
    expect(again.p3?.cats ?? []).toEqual([]);
    expect(owned('r_dona')).toBe(1);
    expect(P3.grantP3Cat('r_dona')).toBe(false);
  });

  it('historia: H73 done → Hipólito (by the mission event, as the game completes it)', () => {
    load('h69-acto1');
    expect(owned('r_hipolito')).toBe(0);
    done('H73');
    G.emit('mission', { id: 'H73', kind: 'done' });
    expect(owned('r_hipolito')).toBe(1);
    G.emit('mission', { id: 'H73', kind: 'done' });
    expect(owned('r_hipolito')).toBe(1);
  });

  it('rescate: a variant of Gato Araña only after «Cruceta» (H77); the rumor opens with it', () => {
    load('h69-acto1');
    const S = 'p3d_superheroes' as const;
    GT.openGatera(S);
    for (let n = 1; n <= 5; n++) GB.applyGateraResult(S, n, won);
    expect(owned('e_ovillo')).toBe(1);
    expect(GB.applyGateraResult(S, 6, won).p3?.cats ?? []).toEqual([]);
    expect(owned('r_gatarana_noir')).toBe(0);
    expect(G.s.catdex.r_gatarana_noir).toBeUndefined();
    done('H77');
    P3.checkP3Cats();
    expect(G.s.catdex.r_gatarana_noir).toBe('rumor');
    expect(P3.p3NodeHints(S, '6', { won: true })).toContain('RESCATE: GATO ARAÑA NOIR');
    expect(GB.applyGateraResult(S, 6, won).p3?.cats).toEqual(['r_gatarana_noir']);
    expect(owned('r_gatarana_noir')).toBe(1);
  });

  it('rescate with catch-up: B-6 won BEFORE «La resaca» → Homiau when H72 is done', () => {
    load('h69-acto1');
    const B = 'p3d_borracha' as const;
    for (const n of [5, 6]) GB.applyGateraResult(B, n, won);
    expect(owned('x_homiau')).toBe(0);
    done('H72');
    G.emit('mission', { id: 'H72', kind: 'done' });
    expect(owned('x_homiau')).toBe(1);
  });

  it('actividad: each arc of H80 pays orbs of Super Siamés (a rumor first), the done mission brings him', () => {
    load('h69-acto1');
    markBeat('b80_arco1');
    markBeat('b80_arco2');
    expect(G.s.orbs.x_supersiames).toBe(10);
    expect(G.s.catdex.x_supersiames).toBe('rumor');
    expect(owned('x_supersiames')).toBe(0);
    markBeat('b80_arco3');
    done('H80');
    G.emit('mission', { id: 'H80', kind: 'done' });
    expect(owned('x_supersiames')).toBe(1);
    expect(G.s.orbs.x_supersiames).toBe(15);
  });

  it('recordar: after H97, El Cadenero at the door (B-9) and Maneki on any win of the Carta', () => {
    load('h69-acto1');
    const B = 'p3d_borracha' as const;
    for (let n = 5; n <= 8; n++) GB.applyGateraResult(B, n, won);
    G.s.missions.done.push('H73');
    const l9 = GB.applyGateraResult(B, 9, won);
    expect(l9.p3?.cats ?? []).not.toContain('e_cadenero');
    expect(owned('e_maneki')).toBe(0);
    done('H97');
    const again = GB.applyGateraResult(B, 9, won);
    expect(again.p3?.cats).toEqual(['e_cadenero', 'e_maneki']);
    expect(owned('e_cadenero')).toBe(1);
    expect(owned('e_maneki')).toBe(1);
  });

  it('the rumor the story opens: Borrón’s file after H70 (he joins only after H97)', () => {
    load('h69-acto1');
    done('H70');
    P3.checkP3Cats();
    expect(G.s.catdex.m_borron).toBe('rumor');
    expect(owned('m_borron')).toBe(0);
  });
});

describe('repeats: orbs of the box’s Multidimensional you have, 35 % seeded', () => {
  it('nothing without one; with Homiau, about 35 % of the repeats of a Borracha node, the same every time', () => {
    load('h69-acto1');
    const B = 'p3d_borracha' as const;
    expect(P3.repeatOrbs(B, '3', 2)).toBeNull();
    P3.grantP3Cat('x_homiau');
    let hits = 0;
    for (let w = 2; w < 402; w++) {
      const r = P3.repeatOrbs(B, '3', w);
      expect(P3.repeatOrbs(B, '3', w)).toEqual(r);
      if (r) {
        hits++;
        expect(r).toEqual({ species: 'x_homiau', n: 3 });
      }
    }
    expect(hits / 400).toBeGreaterThan(0.27);
    expect(hits / 400).toBeLessThan(0.43);
    // another box's Multidimensional never drops here
    expect(P3.multidimOf('p3d_superheroes')).toEqual(['e_ovillo', 'x_gatarana', 'r_gatemson', 'x_murciegato', 'e_estambre', 'r_gatarana_noir', 'r_gatarana_blanca', 'r_gatarana_2099']);
  });

  it('a real repeat win pays them through applyGateraResult (and its toast / stamp can say so)', () => {
    load('h69-acto1');
    const B = 'p3d_borracha' as const;
    P3.grantP3Cat('x_homiau');
    const before = G.s.orbs.x_homiau ?? 0;
    let paid = 0;
    for (let i = 0; i < 30; i++) {
      const l = GB.applyGateraResult(B, 3, won);
      for (const o of l.p3?.orbs ?? []) paid += o.n;
    }
    expect((G.s.orbs.x_homiau ?? 0) - before).toBe(paid);
    expect(paid).toBeGreaterThan(0);
  });
});

describe('the reveal and the flag', () => {
  it('one reveal per box cat; a story cat waits for its mission’s CAMBIÓ card', () => {
    expect(P3_CAT_WHEN.map((w) => w.species)).toEqual(P3IDS);
    const w = (id: string) => P3_CAT_WHEN.find((x) => x.species === id)!;
    expect(w('r_hipolito').after).toBe(cardKey('H73', 'done'));
    expect(w('x_supersiames').after).toBe(cardKey('H80', 'done'));
    expect(w('r_dona').after).toBeUndefined();
    expect(w('r_dona').key).toBe('p3cat_r_dona');
  });

  it('MULTIDIMENSIONAL is on: between legendary and mythic in power, last in the interface, 25 species (every reference cat)', () => {
    expect(MD.P3_MULTIDIM.on).toBe(true);
    const o = MD.rarityOrder();
    expect(o.indexOf('multidimensional')).toBe(o.indexOf('legendary') + 1);
    expect(MD.categoryOrder().at(-1)).toBe('multidimensional');
    // the Parte III's 25 (the post-Parte III ones have their own tests: tests/postp3.test.ts)
    expect(CATS.filter((c) => c.rarity === 'multidimensional' && !MD.isPostCat(c)).length).toBe(25);
    // all from the Parte III (never the Portal, the Casino nor the Resonance); the ids never changed (saves keep them)
    expect(CATS.filter((c) => c.rarity === 'multidimensional' && !MD.isPostCat(c)).every((c) => MD.isP3Cat(c))).toBe(true);
  });
});
