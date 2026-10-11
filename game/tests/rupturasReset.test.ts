/**
 * Parte II · REINICIO NARRATIVO + REGISTRO DE PREMIOS (docs/part-ii/21-migracion-reinicio.md).
 *
 * Every save that played some of Part II goes back to H31 and keeps everything it owns; replaying pays each unique
 * reward once. Fixtures: test-saves/rupturas-*.json (built from post-finale.json by scripts/make-rupturas-fixtures.ts,
 * never by hand) + every older fixture. "Before" = the same fixture loaded with the reset pre-marked as applied,
 * so both sides went through the same migrations, normalize() and patches.
 */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';

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

// RESPALDOS spy: what the live island looked like at the moment the snapshot was requested
interface SnapCall {
  reason: string;
  raw: string;
  liveDone: string[];
  liveBeats: string[];
}
const { snaps } = vi.hoisted(() => ({ snaps: [] as SnapCall[] }));
vi.mock('../src/core/vault', async (orig) => {
  const real = await orig<typeof import('../src/core/vault')>();
  return {
    ...real,
    snapshot: async (reason: string, raw?: string | null) => {
      const g = (globalThis as unknown as { __G?: { s: { missions: { done: string[] }; beatsSeen: string[] } } }).__G;
      snaps.push({ reason, raw: raw ?? '', liveDone: [...(g?.s.missions.done ?? [])], liveBeats: [...(g?.s.beatsSeen ?? [])] });
    },
  };
});

const { G } = await import('../src/state');
const { SAVE_KEY } = await import('../src/core/save');
const { patchNotes, runPatches } = await import('../src/state/patches');
const { checkMissions, lastRewards } = await import('../src/state/sys/missions');
const { applyStoryResult, claimStoryCat, STORY_BATTLES } = await import('../src/state/sys/storyBattles');
const { countCrewWins } = await import('../src/state/sys/campaign');
const R = await import('../src/state/sys/rupturas');
const X = await import('../src/state/sys/rupturasReset');
const L = await import('../src/state/sys/rupturasLedger');
const F = await import('../src/state/sys/forms');
const { FORM_BY_ID } = await import('../src/data/rupturas/formas');
import type { BattleResult } from '../src/scenes/BattleScene';

const WIN: BattleResult = { won: true, reason: 'sunk', turns: 5, modulesDestroyed: 4, damageDealt: 1000, catsLost: 0, perfect: false };
const P2 = ['H31', 'H32', 'H33', 'H34', 'H35', 'H36', 'H37', 'H38', 'H39', 'H40', 'H41'];
const FIXTURES = readdirSync(new URL('../test-saves/', import.meta.url))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''));
const PART_I = ['late-game', 'post-story', 'post-boss1', 'post-boss2', 'post-boss3', 'pre-boss3', 'casino-v1', 'm2-postboss2', 'isla-m2'];

const envOf = (f: string) => JSON.parse(readFileSync(new URL(`../test-saves/${f}.json`, import.meta.url), 'utf8'));
/** load a fixture the way the game does. `skipReset`: the reset already marked as applied (the "before" island) */
function load(f: string, o: { skipReset?: boolean; env?: unknown } = {}) {
  const env = (o.env as { state: { patches?: string[] } }) ?? envOf(f);
  if (o.skipReset) env.state.patches = [...(env.state.patches ?? []), X.RESET_PATCH_ID];
  mem.clear();
  mem.set(SAVE_KEY, JSON.stringify(env));
  patchNotes.length = 0;
  snaps.length = 0;
  G.load();
  expect(G.loaded, f).toBe(true);
}
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const done = (id: string) => G.s.missions.done.includes(id);
const active = (id: string) => G.s.missions.active.includes(id);
const claimed = () => Object.keys(((G.s.ext?.rupturas as { claimed?: object } | undefined)?.claimed ?? {}) as object).sort();

/** everything the player OWNS (must be identical before / after the reset) */
/** drop the numeric `at` timestamps inside ext.* (in place): they move with the wall clock, not with what you own */
function stripClocks(o: unknown) {
  if (!o || typeof o !== 'object') return;
  for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
    if (k === 'at' && typeof v === 'number') delete (o as Record<string, unknown>)[k];
    else stripClocks(v);
  }
}
function inventory() {
  const s = clone(G.s) as unknown as Record<string, unknown> & typeof G.s;
  const flags = Object.fromEntries(Object.entries(s.flags).filter(([f]) => !X.isStoryGateFlag(f)));
  const counters = { ...s.counters };
  // the raw gates the reset puts back to 0 (the puzzle's counter, a Part II damage battle's best %)
  delete counters.feature_haz_nacar;
  for (const k of Object.keys(counters)) if (k.startsWith('dmgpct_') && L.isPart2Mission(STORY_BATTLES[k.slice(7)]?.mission)) delete counters[k];
  const ext = { ...(s.ext ?? {}) } as Record<string, unknown>;
  delete ext.rupturas;
  // clocks are not ownership: a lazy refinery / install stamp (`at`, ms) may be written with Date.now() on each load
  // (ext.astral of Oleada 3). What you own — fuel, kits, ships, levels — is still compared field by field.
  stripClocks(ext);
  const notP2 = (xs: string[]) => xs.filter((id) => !L.isPart2Mission(id));
  const cats = s.cats.map((c) => ({ ...c }));
  return {
    res: { gold: s.gold, food: s.food, gems: s.gems, purr: s.purr, prisma: s.prisma, scrap: s.scrap, blueprint: s.blueprint, kl: s.kl, klXp: s.klXp, playMs: s.playMs, nextId: s.nextId },
    totals: { cats: cats.length, levels: cats.reduce((a, c) => a + c.level, 0), stars: cats.reduce((a, c) => a + c.stars, 0), orbs: Object.values(s.orbs).reduce((a, n) => a + n, 0), crystals: Object.values(s.crystals).reduce((a, n) => a + n, 0) },
    cats,
    crystals: s.crystals,
    orbs: s.orbs,
    catdex: s.catdex,
    elements: s.elements,
    habitats: s.habitats,
    farms: s.farms,
    expansions: s.expansions,
    timers: s.timers,
    resonance: s.resonance,
    ship: s.ship,
    layouts: s.layouts,
    campaign: s.campaign,
    stats: s.stats,
    gear: s.gear,
    errands: s.errands,
    decor: s.decor,
    casino: s.casino,
    accessories: s.accessories,
    podio: s.podio,
    player: s.player,
    explained: s.explained,
    workers: s.workers,
    expeditions: s.expeditions,
    updatesSeen: s.updatesSeen,
    flags,
    counters,
    ext,
    partI: {
      done: notP2(s.missions.done),
      active: notP2(s.missions.active),
      pinned: notP2(s.missions.pinned),
      seenLines: notP2(s.missions.seenLines),
      progress: Object.fromEntries(Object.entries(s.missions.progress).filter(([k]) => !L.isPart2Mission(k.split(':')[0]))),
      beats: s.beatsSeen.filter((b) => !X.isPart2Beat(b)),
    },
  };
}

// ---- playing Part II (the same steps a player takes; the UI's reveal adopts with the ledger key)
const canelo = () => G.s.cats.find((c) => c.species === 'c_canelo')!;
const activeFormIdOfCanelo = () => F.activeFormId(canelo());
const ALMIRANTE = () => FORM_BY_ID.get('canelo_almirante')!;
const loots: Record<string, ReturnType<typeof applyStoryResult>> = {};
function battle(id: string) {
  const loot = applyStoryResult(id, WIN);
  loots[id] = loot;
  if (loot.newCat) claimStoryCat(loot.newCat, loot.catKey);
}
const STEPS: Record<string, () => void> = {
  H31: () => R.tapFaro(),
  H32: () => R.openRegistro000(),
  H33: () => G.count('feature_region_paginas'),
  H34: () => battle('ruptura_paginas'),
  H35: () => battle('ruptura_bibliotecario'),
  H36: () => G.count('feature_pagina_canelo'),
  H37: () => {
    for (let i = 0; i < 3; i++) countCrewWins([canelo().uid]);
  },
  H38: () => countCrewWins([canelo().uid], canelo().uid),
  H39: () => {
    G.flag('nacar_haz_ok');
    G.count('feature_haz_nacar');
    battle('ruptura_nacar');
  },
  H40: () => battle('ruptura_madrenacar'),
  H41: () => battle('ruptura_corrector'),
};
function playWave(onStep?: (id: string) => void) {
  for (const id of P2) {
    expect(active(id), `${id} active before playing it`).toBe(true);
    STEPS[id]();
    checkMissions();
    expect(done(id), `${id} done`).toBe(true);
    onStep?.(id);
  }
}
/** every resource event while `fn` runs */
function watchRes(fn: () => void) {
  const ev: { key: string; delta: number; source?: string }[] = [];
  const off = G.on('res', (p) => ev.push(p));
  try {
    fn();
  } finally {
    off?.();
  }
  return ev;
}

// =====================================================================================================
describe('who gets the reset', () => {
  it('(1) Part I not finished: untouched byte-for-byte (every Part I fixture, old shapes included)', () => {
    for (const f of PART_I) {
      load(f, { skipReset: true });
      const before = JSON.stringify(G.s);
      expect(X.applyRupturasReset(), f).toBe('parte1');
      expect(JSON.stringify(G.s), f).toBe(before);
      expect(G.s.ext?.rupturas, f).toBeUndefined();
      // the real boot: the patch is marked done, says nothing, backs nothing up, changes nothing
      load(f);
      expect(G.s.patches).toContain(X.RESET_PATCH_ID);
      expect(patchNotes).not.toContain(X.RESET_NOTE);
      expect(snaps).toEqual([]);
      expect(mem.has(X.RESET_BACKUP_KEY)).toBe(false);
      const { patches: _a, ...now } = JSON.parse(JSON.stringify(G.s));
      const { patches: _b, ...was } = JSON.parse(before);
      expect(now, f).toEqual(was);
    }
  });

  it('(2) just finished Part I (post-finale): no-op, then H31 appears with the renewed opening', () => {
    load('post-finale', { skipReset: true });
    const before = JSON.stringify(G.s);
    expect(X.applyRupturasReset()).toBe('sin-progreso');
    expect(JSON.stringify(G.s)).toBe(before);
    load('post-finale');
    expect(patchNotes).not.toContain(X.RESET_NOTE);
    expect(snaps).toEqual([]);
    checkMissions();
    expect(active('H31')).toBe(true);
    // H31 active with nothing seen yet is not "progress" either
    expect(X.planReset().progress).toBe(false);
  });

  it('a Part I player who reaches Part II after the update plays it for the first time, rewards and all', () => {
    load('post-finale');
    checkMissions();
    const gems0 = G.s.gems;
    const n0 = G.s.cats.length;
    const ev = watchRes(() => playWave());
    // battles 2 + 5 + 0 + 0 + 0 gems… plus missions' fixed gems (H32 2, H34 2, H35 5, H38 3, H40 5, H41 10)
    const storyGems = ev.filter((e) => e.key === 'gems' && (e.source === 'story' || e.source === 'mission')).reduce((a, e) => a + e.delta, 0);
    expect(storyGems).toBeGreaterThanOrEqual(27);
    expect(G.s.gems).toBeGreaterThan(gems0);
    expect(G.s.cats.length).toBe(n0 + 5);
    expect(G.s.elements).toContain('crystal');
    expect(G.s.crystals.crystal).toBe(20);
    expect(L.resetApplied()).toBe(false);
    // the ledger filled itself live
    expect(claimed()).toEqual(expect.arrayContaining(['battle:ruptura_nacar', 'cat:ruptura_corrector', 'mission:H31', 'mission:H41']));
  });
});

// =====================================================================================================
describe('mid-Oleada 1 (H35 active)', () => {
  it('(3) resets the narrative, keeps cats and resources, fills the ledger, backs up first', () => {
    load('rupturas-mid', { skipReset: true });
    expect(active('H35')).toBe(true);
    const inv0 = inventory();
    const owned0 = G.s.cats.filter((c) => c.species === 'c_marcapaginas').length;
    expect(owned0).toBe(1);

    load('rupturas-mid');
    expect(patchNotes).toContain(X.RESET_NOTE);
    // RESPALDOS: requested BEFORE anything moved, with the island exactly as it was
    expect(snaps.length).toBe(1);
    expect(snaps[0].reason).toBe(X.RESET_SNAPSHOT_REASON);
    expect(snaps[0].liveDone).toEqual(expect.arrayContaining(['H31', 'H32', 'H33', 'H34']));
    expect(snaps[0].liveBeats.some((b) => b.startsWith('b31_'))).toBe(true);
    const backup = JSON.parse(snaps[0].raw);
    expect(backup.state.missions.done).toContain('H34');
    expect(backup.state.patches).toContain(X.RESET_PATCH_ID);
    expect(mem.get(X.RESET_BACKUP_KEY)).toBe(snaps[0].raw);

    // narrative: back to the start
    for (const id of P2) {
      expect(done(id), id).toBe(false);
      expect(active(id), id).toBe(false);
      expect(G.s.missions.pinned).not.toContain(id);
      expect(G.s.missions.seenLines).not.toContain(id);
    }
    expect(G.s.beatsSeen.filter((b) => X.isPart2Beat(b))).toEqual([]);
    expect(snaps[0].liveBeats).toContain('carta_paginas');
    expect(G.s.beatsSeen).not.toContain('carta_paginas');
    expect(G.s.beatsSeen).toContain('b30_creditos');
    expect(G.s.flags['region:paginas']).toBeUndefined();
    expect(G.s.flags['won_ruptura_paginas']).toBeUndefined();
    expect(G.s.flags['region_visited:paginas']).toBeUndefined();
    expect(R.mapRegions()).toEqual([]);
    // page read again for free: the flag is cleared, the gold stays claimed in the ledger
    expect(G.s.flags['pagina_leida:1']).toBeFalsy();
    expect(L.rewardClaimed('pagina:1')).toBe(true);

    // ownership: identical
    expect(inventory()).toEqual(inv0);
    expect(G.s.cats.filter((c) => c.species === 'c_marcapaginas').length).toBe(1);

    // the ledger, from the save's history
    expect(claimed()).toEqual(['battle:ruptura_paginas', 'cat:ruptura_paginas', 'mission:H31', 'mission:H32', 'mission:H33', 'mission:H34', 'pagina:1', 'pagina:2'].sort());
    expect(L.resetApplied(X.RESET_V)).toBe(true);

    // the chain restarts through its normal trigger
    checkMissions();
    expect(active('H31')).toBe(true);
    expect(G.s.missions.pinned).toContain('H31');
    for (const id of P2.slice(1)) expect(active(id) || done(id), id).toBe(false);
  });
});

// =====================================================================================================
describe('Oleada 1 finished (H41 done, Canelo Almirante, Cristal)', () => {
  it('(4) reset keeps the form and the element; replaying pays no unique reward twice', () => {
    load('rupturas-fin', { skipReset: true });
    const inv0 = inventory();
    expect(done('H41')).toBe(true);
    expect(activeFormIdOfCanelo()).toBe('canelo_almirante');

    load('rupturas-fin');
    expect(patchNotes).toContain(X.RESET_NOTE);
    expect(inventory()).toEqual(inv0);
    // permanent: the form, its reveal bookkeeping, the element and its crystals, the reward cats
    expect(G.s.flags['forma:canelo_almirante']).toBe(true);
    expect(activeFormIdOfCanelo()).toBe('canelo_almirante');
    expect(F.formRevealsPending()).toEqual([]);
    expect(G.s.elements).toContain('crystal');
    expect(G.s.crystals.crystal).toBeGreaterThanOrEqual(20);
    for (const sp of ['c_marcapaginas', 'l_bibliotecario', 'c_brillito', 'l_madrenacar', 'c_espumita']) expect(G.s.cats.some((c) => c.species === sp), sp).toBe(true);
    // narrative gates: the puzzle and the golden page can be played again
    for (const f of ['oleada1_fin', 'nacar_haz_ok', 'pagina_canelo_vista', 'region:nacar', 'region:paginas', 'won_ruptura_corrector', 'event_done_ruptura_nacar']) expect(G.s.flags[f], f).toBeUndefined();
    expect(G.s.counters.feature_haz_nacar).toBe(0);
    expect(R.nacarHazOk()).toBe(false);
    expect(claimed()).toEqual(
      expect.arrayContaining([...P2.map((id) => `mission:${id}`), ...R.RUPTURA_BATTLES.map((b) => `battle:${b}`), ...R.RUPTURA_BATTLES.map((b) => `cat:${b}`)]),
    );

    // ---- REPLAY the whole wave
    checkMissions();
    const cats0 = G.s.cats.map((c) => `${c.uid}:${c.species}`).sort();
    const dex0 = clone(G.s.catdex);
    const orbs0 = clone(G.s.orbs);
    const crystals0 = clone(G.s.crystals);
    const prisma0 = G.s.prisma;
    let revealArmed = false;
    const ev = watchRes(() =>
      playWave((id) => {
        if (id === 'H38') {
          // the form reveal plays again in its place (it grants nothing), then it's seen again
          revealArmed = F.formRevealsPending().some((f) => f.id === 'canelo_almirante');
          F.markFormRevealed('canelo_almirante');
        }
      }),
    );
    expect(revealArmed).toBe(true);
    expect(F.formRevealsPending()).toEqual([]);
    // no gems (only a Reino milestone may give some), no crystals, no orbs, no prisma, no new cat
    expect(ev.filter((e) => e.key === 'gems' && e.source !== 'milestone')).toEqual([]);
    expect(ev.filter((e) => e.key === 'crystal' || e.key === 'orbs' || e.key === 'prisma')).toEqual([]);
    expect(G.s.cats.map((c) => `${c.uid}:${c.species}`).sort()).toEqual(cats0);
    expect(G.s.catdex).toEqual(dex0);
    expect(G.s.orbs).toEqual(orbs0);
    expect(G.s.crystals).toEqual(crystals0);
    expect(G.s.prisma).toBe(prisma0);
    // the battles were fought (scenes, flags) and said so
    for (const b of R.RUPTURA_BATTLES) {
      expect(loots[b].first, b).toBe(true);
      expect(loots[b].alreadyPaid, b).toBe(true);
      expect(loots[b].gems, b).toBe(0);
      expect(G.s.flags[`won_${b}`], b).toBe(true);
    }
    expect(loots.ruptura_nacar.newElement).toBeNull();
    expect(loots.ruptura_nacar.replayElement).toBe('crystal');
    expect(loots.ruptura_nacar.crystals).toBeUndefined();
    // a replayed reveal adopts nothing
    expect(claimStoryCat('c_espumita', 'cat:ruptura_corrector')).toMatchObject({ cat: null, orbs: 0, already: true });
    // missions: only the income part, never gems / orbs
    for (const id of P2) {
      const r = lastRewards.get(id)!;
      expect(r.gems, id).toBe(0);
      expect(r.orbs, id).toBeNull();
    }
    // and the story is back where it was: Oleada 1 done, its islands on the chart
    expect(G.s.flags.oleada1_fin).toBe(true);
    // Oleada 1's islands are back on the CARTA (finishing H41 also opens the next wave's first island)
    expect(R.mapRegions().map((r) => r.id).slice(0, 2)).toEqual(['paginas', 'nacar']);
    expect(F.formUnlocked(ALMIRANTE())).toBe(true);
  });
});

// =====================================================================================================
describe('collections and permanent things', () => {
  it('(5) every reward and collection survives (Fonoteca ext.music, casino, decor, accessories, gear, bank, holo)', () => {
    load('rupturas-fin', { skipReset: true });
    const music0 = clone(G.s.ext?.music);
    const inv0 = inventory();
    expect(music0).toBeTruthy();
    expect(Object.keys((music0 as { unlocked: object }).unlocked).length).toBe(3);
    load('rupturas-fin');
    expect(G.s.ext?.music).toEqual(music0);
    expect(inventory()).toEqual(inv0);
    expect(G.s.cats.some((c) => c.holo)).toBe(true);
    expect(G.s.decor?.placed.length).toBe(1);
    expect(G.s.casino?.tickets).toBe(3);
  });

  it('totals (resources, cats, stars, levels, orbs, crystals) are equal before / after on EVERY fixture', () => {
    for (const f of FIXTURES) {
      load(f, { skipReset: true });
      const inv0 = inventory();
      load(f);
      expect(inventory(), f).toEqual(inv0);
    }
  });
});

// =====================================================================================================
describe('robustness', () => {
  it('(6) an old SAVE_VERSION save (v1 shape) migrates and resets in one load', () => {
    load('rupturas-mid-v1', { skipReset: true });
    const inv0 = inventory();
    load('rupturas-mid-v1');
    expect(G.loadInfo.from).toBe(1);
    expect(G.loadInfo.migrated).toEqual([2, 3]);
    expect(G.s.habitats.every((h) => Number.isFinite(h.gx) && Number.isFinite(h.gy))).toBe(true);
    expect(patchNotes).toContain(X.RESET_NOTE);
    expect(inventory()).toEqual(inv0);
    expect(G.s.missions.done.filter(L.isPart2Mission)).toEqual([]);
    // the same cats as the v3 copy of the same save (the other retro patches may pay the v1 copy something extra)
    const t1 = inventory().totals;
    load('rupturas-mid');
    const t3 = inventory().totals;
    expect([t3.cats, t3.levels, t3.stars]).toEqual([t1.cats, t1.levels, t1.stars]);
  });

  it('(7) reload after the reset: the patch never runs again and the island is stable', () => {
    load('rupturas-fin');
    checkMissions();
    G.save();
    const a = { inv: inventory(), m: clone(G.s.missions), beats: [...G.s.beatsSeen], ledger: clone(G.s.ext?.rupturas), flags: clone(G.s.flags) };
    patchNotes.length = 0;
    snaps.length = 0;
    G.load();
    checkMissions();
    expect(patchNotes).toEqual([]);
    expect(snaps).toEqual([]);
    expect(G.s.patches.filter((p) => p === X.RESET_PATCH_ID).length).toBe(1);
    expect({ inv: inventory(), m: clone(G.s.missions), beats: [...G.s.beatsSeen], ledger: clone(G.s.ext?.rupturas), flags: clone(G.s.flags) }).toEqual(a);
    // even if the patch ledger were lost, the save's own marker stops a second reset
    G.s.patches = G.s.patches.filter((p) => p !== X.RESET_PATCH_ID);
    G.s.missions.done.push('H31', 'H32');
    runPatches();
    expect(patchNotes).toEqual([]);
    expect(X.applyRupturasReset()).toBe('ya-aplicado');
    expect(done('H32')).toBe(true);
  });

  it('restoring the RESPALDOS copy gives the old island back, without resetting it again', () => {
    load('rupturas-mid');
    const raw = snaps[0].raw;
    mem.set(SAVE_KEY, raw);
    patchNotes.length = 0;
    G.load();
    expect(patchNotes).not.toContain(X.RESET_NOTE);
    expect(done('H34')).toBe(true);
    expect(active('H35')).toBe(true);
  });

  it('(8) inconsistent records (H38 done without H36, active+done, unknown ids, no ext) end up sane', () => {
    load('rupturas-raro', { skipReset: true });
    const inv0 = inventory();
    expect(G.s.ext?.rupturas).toBeUndefined();
    expect(envOf('rupturas-raro').state.ext).toBeUndefined();
    load('rupturas-raro');
    expect(patchNotes).toContain(X.RESET_NOTE);
    const m = G.s.missions;
    for (const list of [m.done, m.active, m.pinned, m.seenLines]) expect(list.filter(L.isPart2Mission)).toEqual([]);
    expect(Object.keys(m.progress).filter((k) => L.isPart2Mission(k.split(':')[0]))).toEqual([]);
    expect(G.s.beatsSeen.filter((b) => b.startsWith('b77_'))).toEqual([]);
    expect(G.s.flags['won_ruptura_inventada']).toBeUndefined();
    expect(G.s.flags['region:inventada']).toBeUndefined();
    expect(inventory()).toEqual(inv0);
    const c = claimed();
    expect(c).toContain('mission:H38');
    expect(c).toContain('mission:H77');
    expect(c).not.toContain('mission:H36');
    expect(c).toContain('battle:ruptura_madrenacar'); // won (flag) even though H40 wasn't marked done
    checkMissions();
    expect(G.s.missions.active.filter(L.isPart2Mission)).toEqual(['H31']);
  });

  it('never throws, never touches a save it cannot read, and skips the copy when storage is tight', () => {
    load('rupturas-mid', { skipReset: true });
    const missions = G.s.missions;
    (G.s as unknown as { missions: unknown }).missions = null;
    expect(X.applyRupturasReset()).toBe('parte1');
    G.s.missions = missions;
    // a nearly full storage: the reset still happens, the extra localStorage copy doesn't
    mem.set('relleno', 'x'.repeat(1_990_000));
    snaps.length = 0;
    expect(X.applyRupturasReset()).toBe('reiniciado');
    expect(snaps.length).toBe(1);
    expect(mem.has(X.RESET_BACKUP_KEY)).toBe(false);
  });

  it('every Part II battle is known to the ledger, and Part I battles keep their old behavior', () => {
    for (const b of R.RUPTURA_BATTLES) expect(L.battleKey(b, STORY_BATTLES[b].mission)).toBe(`battle:${b}`);
    for (const b of ['event_raijin', 'story_heraldo', 'event_grieta', 'event_vacio', 'story_patito_revancha']) expect(L.battleKey(b, STORY_BATTLES[b].mission)).toBeNull();
    expect(L.isPart2Mission('H30')).toBe(false);
    expect(L.isPart2Mission('H31')).toBe(true);
    expect(L.isPart2Mission('H65')).toBe(true);
    expect(L.isPart2Mission('C31')).toBe(false);
    expect(X.isPart2Beat('b30_creditos')).toBe(false);
    expect(X.isPart2Beat('b31_reflejo')).toBe(true);
    expect(X.isPart2Beat('b41_corrector#c')).toBe(true);
    expect(X.isStoryGateFlag('forma:canelo_almirante')).toBe(false);
    // the Diario Perdido pages are re-readable after the reset (their gold is guarded by the ledger)
    expect(X.isStoryGateFlag('pagina_leida:3')).toBe(true);
    expect(X.isStoryGateFlag('won_event_raijin')).toBe(false);
    expect(X.isStoryGateFlag('won_ruptura_nacar')).toBe(true);
  });
});
