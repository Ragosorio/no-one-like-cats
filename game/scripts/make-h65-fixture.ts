/**
 * Builds test-saves/h65-normal.json FROM CODE (docs/part-iii/11 §2 A10 · investigacion/sistemas.md §2.3 profile (a)):
 * a save that JUST finished the Parte II, playing normally — not a dev save with 3 tier-1 habitats and 50 B put by
 * hand. ~17 M/s of gold, ~2 h of income in the bank, Reino 40, ~45 species at Nv45 ★1–3, tier-8 habitats.
 *
 *  1. rupturas-o4.json loaded through the real game systems (migrations, normalize, patches).
 *  2. Oleada 4 played with the same steps as tests/rupturasO4.test.ts (battles won, an Eco woken, the island nobody
 *     remembers repaired, Distraxia read, «Mentira» with the choice «nada», the credits) → H58–H65 done, their beats
 *     seen, their cats in the crew.
 *  3. The island of someone who played ~12 h: species adopted (free) up to the profile, stars and levels within the
 *     Reino's caps, 10 expansions, habitats BUILT AND UPGRADED WITH THE GAME'S OWN RULES (buildHabitat / upgradeHabitat:
 *     real spots, real footprints; the build timers are rushed), cats housed by autoHouse, the ship crewed.
 *  4. H66+ stripped from `active`: on load the game activates H66 by itself (trigger mission:H65), like rupturas-o4
 *     does with H58 — the fixture is the moment the Parte III update lands.
 *
 *   cd game && npx vite-node scripts/make-h65-fixture.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';

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
const { SAVE_VERSION } = await import('../src/state/migrate');
const { checkMissions } = await import('../src/state/sys/missions');
const { applyStoryResult, claimStoryCat } = await import('../src/state/sys/storyBattles');
const O4 = await import('../src/state/sys/rupturasO4');
const E = await import('../src/state/sys/ecos');
const OLV = await import('../src/state/sys/olvidada');
const FIN = await import('../src/app/o4Finale');
const { O4_ON_DONE, O4_ON_NEW } = await import('../src/ui/story/rupturasScriptO4');
const { isAfterPart2Mission } = await import('../src/state/sys/rupturasLedger');
const econ = await import('../src/state/econ');
const isl = await import('../src/state/sys/island');
const cats = await import('../src/state/sys/cats');
const { nearestHabitatSpot } = await import('../src/island/placement');
const ship = await import('../src/state/sys/ship');
const content = await import('../src/data/content');
import type { BattleResult } from '../src/scenes/BattleScene';

/** the profile (sistemas.md §2.3 (a) «H65 jugando normal») */
const PROFILE = { kl: 40, level: 45, stars: [0.2, 0.4, 0.4, 0, 0, 0], species: 45, tier: 8, exps: 10, bankHours: 2, gems: 160 };

const dir = new URL('../test-saves/', import.meta.url);
const read = (f: string) => JSON.parse(readFileSync(new URL(`${f}.json`, dir), 'utf8'));
const die = (why: string): never => {
  throw new Error(`[h65-normal] ${why}`);
};

// ------------------------------------------------------------------ 1. load
mem.set(SAVE_KEY, JSON.stringify(read('rupturas-o4')));
G.load();
if (!G.loaded) die('rupturas-o4 no cargó');
checkMissions();

// ------------------------------------------------------------------ 2. play Oleada 4 (tests/rupturasO4.test.ts › playWave)
const WIN: BattleResult = { won: true, reason: 'sunk', turns: 6, modulesDestroyed: 4, damageDealt: 1000, catsLost: 0, perfect: false, enemyHullLost: 0.8 };
const active = (id: string) => G.s.missions.active.includes(id);
const done = (id: string) => G.s.missions.done.includes(id);
function step(id: string, fn: () => void) {
  if (!active(id)) die(`${id} no está activa`);
  fn();
  checkMissions();
  if (!done(id)) die(`${id} no se cumplió`);
}
const battle = (id: string) => {
  const l = applyStoryResult(id, WIN);
  if (l.newCat) claimStoryCat(l.newCat, l.catKey);
};
step('H58', () => battle('umbral_suenos'));
const eco = E.ecosReady()[0] ?? die('no hay gato con Eco listo');
step('H59', () => void E.wakeEco(eco));
step('H60', () => {
  for (const r of OLV.olvidadaRuins()) OLV.repairRuin(r.id, OLV.repairersFor(r.id)[0].uid);
});
for (const sp of O4.o4PendingCats()) O4.claimO4Cat(sp);
step('H61', () => O4.readDistraxia());
step('H62', () => battle('umbral_correctores'));
step('H63', () => battle('umbral_final'));
const fin = FIN.finaleCtx();
step('H64', () => {
  fin.choose('nada');
  fin.asleep();
  fin.mentira();
});
step('H65', () => fin.wake());
// the Oleada 4 beats were seen (a story that was played, not skipped)
const seen = new Set(G.s.beatsSeen);
for (const t of [O4_ON_NEW, O4_ON_DONE])
  for (const refs of Object.values(t))
    for (const r of refs) {
      seen.add(r.beat);
      if (r.part) seen.add(`${r.beat}#${r.part}`);
    }
for (const k of ['b61_distraxia#b', 'b64_mentira#a', 'b64_mentira#b', 'b64_mentira', 'b65_continuara']) seen.add(k);
G.s.beatsSeen = [...seen];

// ------------------------------------------------------------------ 3. the island of a normal ~12 h player
const P = PROFILE;
G.s.kl = Math.max(G.s.kl, P.kl);
const order = econ.BAL.rarities.order as string[];
const owned = () => new Set(G.s.cats.map((c) => c.species));
const pool = content.CATS.filter((c) => !owned().has(c.id) && !['heroic', 'divine'].includes(c.rarity) && !c.primordial).sort((a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity));
// every 3rd of the sorted pool: mostly common / rare, some epic and legendary (deterministic)
let pick = 0;
while (owned().size < P.species && pool.length) {
  const c = pool.splice(pick % pool.length, 1)[0];
  cats.adopt(c.id, { free: true });
  pick += 3;
}
// 40+ species: the secret Lumen already joined (app/story.ts WHEN secret_lumen_40) — a normal player has it
if (!owned().has('s_lumen')) cats.adopt('s_lumen', { free: true });
if (!G.s.beatsSeen.includes('secret_lumen_40')) G.s.beatsSeen.push('secret_lumen_40');
for (const c of G.s.cats) G.s.catdex[c.species] = 'registered';
const n = G.s.cats.length;
const byRarity = [...G.s.cats].sort((a, b) => order.indexOf(content.catDef(b.species).rarity) - order.indexOf(content.catDef(a.species).rarity));
let k = 0;
for (let s = 5; s >= 0; s--) {
  const cnt = Math.round(P.stars[s] * n);
  for (let j = 0; j < cnt && k < n; j++, k++) byRarity[k].stars = Math.max(byRarity[k].stars, s + 1);
}
for (const c of G.s.cats) c.level = Math.max(c.level, Math.min(P.level, econ.catLevelCapFor(G.s.kl, c.stars)));
G.s.expansions.bought = [...new Set([...G.s.expansions.bought, ...Array.from({ length: P.exps }, (_, j) => j + 1)])];
G.s.expansions.cleared = [...new Set([...G.s.expansions.cleared, ...G.s.expansions.bought])];

// habitats with the game's rules: build where the game would, upgrade in place while there's room
const rushAll = () => {
  for (const t of [...G.s.timers]) if (t.kind === 'build' || t.kind === 'habitat_upgrade') G.rush(t, t.leftMs + 1);
};
const rich = () => {
  G.s.gold = 1e15;
  for (const el of G.s.elements) G.s.crystals[el] = Math.max(G.s.crystals[el] ?? 0, 999);
};
/** upgrade in place; when the yard can't grow there, «MOVER Y MEJORAR» to the nearest spot where it fits */
function upgradeTo(h: (typeof G.s.habitats)[number], tier: number) {
  while (h.tier < tier) {
    rich();
    let ok = isl.upgradeHabitat(h);
    if (!ok) {
      const at = nearestHabitatSpot(undefined, undefined, h.id, isl.nextHabitatSize(h));
      ok = !!at && isl.upgradeHabitat(h, at);
    }
    if (!ok) break;
    rushAll();
  }
}
rich();
rushAll();
for (const h of G.s.habitats) upgradeTo(h, P.tier);
const cap = (h: (typeof G.s.habitats)[number]) => isl.habitatCapacity(h);
const elOf = (sp: string) => content.catDef(sp).elements[0];
for (let guard = 0; guard < 60; guard++) {
  isl.autoHouse();
  const homeless = G.s.cats.filter((c) => !c.habitat);
  if (!homeless.length) break;
  const el = elOf(homeless[0].species);
  rich();
  // where its tier-8 yard (5×5) will fit
  const h = isl.buildHabitat(el, nearestHabitatSpot(undefined, undefined, undefined, 5) ?? undefined);
  if (!h) break;
  rushAll();
  upgradeTo(h, P.tier);
  void cap;
}
isl.autoHouse();
G.s.momentum = 1;
G.recalc();
const gps = G.goldPerSec;
// the bank: ~2 h of income; crystals and gems a normal player would have left
G.s.gold = Math.round(gps * 3600 * P.bankHours);
G.s.food = Math.max(G.s.food, Math.round(gps * 600));
G.s.gems = P.gems;
for (const el of G.s.elements) G.s.crystals[el] = 20;
ship.autoCrew();

// Luzterna already told where the 3D islands live (app/story.ts CHART_ISLANDS_TOLD, once per save)
G.flag('aviso_carta_islas');
// the Fonoteca of Oleada 4 already in hand (app/oleada4Flow.ts O4_SONGS: derived from the missions done), so the
// first thing on load is the Parte III update, not a toast of old records
{
  const music = ((G.s.ext ??= {}).music ??= { unlocked: {}, favorites: [], islandTrack: null, toasted: [], prefs: { shuffle: false, repeat: 'all' }, last: null }) as { unlocked: Record<string, { at: number; source: string }>; toasted: string[] };
  const at = Date.now();
  for (const ref of ['amb.suenos', 'yonose_todo.aftermath', 'circus_malus.stinger', 'amb.umbral', 'yonose_todo', 'amb.registro_000']) {
    music.unlocked[ref] ??= { at, source: 'fixture' };
    if (!music.toasted.includes(ref)) music.toasted.push(ref);
  }
}

// ------------------------------------------------------------------ 4. the moment the update lands
const m = G.s.missions;
m.active = m.active.filter((id) => !isAfterPart2Mission(id));
// the side missions on the board were already announced (a played save has seen their «nueva misión» tips)
for (const id of m.active) if (!m.seenLines.includes(id)) m.seenLines.push(id);
m.pinned = m.pinned.filter((id) => !isAfterPart2Mission(id));
G.s.savedAt = Date.now();

const homeless = G.s.cats.filter((c) => !c.habitat).length;
const tiers = G.s.habitats.reduce((acc, h) => ((acc[h.tier] = (acc[h.tier] ?? 0) + 1), acc), {} as Record<number, number>);
const state = JSON.parse(JSON.stringify(G.s));
const env = { version: SAVE_VERSION, savedAt: Date.now(), build: 'fixture-h65-normal', state };
writeFileSync(new URL('h65-normal.json', dir), JSON.stringify(env, null, 1) + '\n');
console.log(
  `fixture: h65-normal · ${(gps / 1e6).toFixed(1)} M/s · oro ${(G.s.gold / 1e9).toFixed(0)} B · Reino ${G.s.kl} · ${owned().size} especies · ${G.s.cats.length} gatos (${homeless} sin hábitat) · hábitats por tier ${JSON.stringify(tiers)} · H65 hecha: ${done('H65')}`,
);
