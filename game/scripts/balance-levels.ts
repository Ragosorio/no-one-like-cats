/**
 * Niveles 51–100 harness (docs/part-ii/16-niveles-100.md). Prints:
 *   1. the curves (gold/s, power, food per level, food from Nv50) for a ★6 cat at Nv 50/60/…/100;
 *   2. the Podio ladder: power of each bout and the level its rival shows, before (min 60 clamp, 1.07 curve)
 *      and now (econ.catLevelForPower, Nv1–100), plus the Nv a ★6 divine / legendary needs to match it;
 *   3. Podio duels (podio/engine Duel, same code as PodioScene): your ★6 cats (4 Divinos, 4 Heroicos, 2 Míticos,
 *      podio Nv20, no accessories) at Nv 50/60/…/100 against every bout of leagues --from..--to, rivals from
 *      --islands island seeds × --seeds duel seeds. The player side plays with the auto AI (sharp).
 *   4. story battles (--story): post-finale crew at ★6 Nv50 / Nv70 / Nv100 vs every story battle (grietas,
 *      finale, rupturas): they scale with your fleet (powerMul), so the win rates must not move.
 *
 * Run:  npx vite-node scripts/balance-levels.ts [-- --from 15 --to 23 --islands 6 --seeds 6 --story --story-seeds 8]
 */
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

const args = process.argv.slice(2);
const arg = (k: string, d: number) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? Number(args[i + 1]) : d;
};
const FROM = arg('from', 15);
const TO = arg('to', 23);
const ISLANDS = arg('islands', 6);
const SEEDS = arg('seeds', 6);
const STORY = args.includes('--story');
const STORY_SEEDS = arg('story-seeds', 8);

const { BAL, catGoldPerSec, catPower, catLevelForPower, feedCost, feedCostRange } = await import('../src/state/econ');
const { CATS, catDef } = await import('../src/data/content');
const PB = (await import('../src/data/podio.json')).default;
const { boutPower, rival, league } = await import('../src/podio/ladder');
const { Duel } = await import('../src/podio/engine');
const { powersOf } = await import('../src/podio/powers');
type RarityId = Parameters<typeof catPower>[0];

const fmt = (n: number) => {
  const a = Math.abs(n);
  for (const [v, s] of [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'k']] as const) if (a >= v) return `${(n / v).toFixed(a >= v * 100 ? 0 : a >= v * 10 ? 1 : 2)}${s}`;
  return n.toFixed(a >= 100 ? 0 : 1);
};
const pad = (s: string | number, n: number) => String(s).padStart(n);

// ------------------------------------------------------------------ 1. curves
console.log('\n== 1. CURVAS (★6) ==');
console.log('Nv  | oro/s divino | ×Nv50 | poder divino | ×Nv50 | comida/nivel común | divino  | comida desde Nv50 (divino)');
const LV = [1, 10, 20, 30, 40, 49, 50, 51, 55, 60, 70, 80, 90, 99, 100];
for (const l of LV) {
  const g = catGoldPerSec('divine', l, 6);
  const p = catPower('divine', l, 6);
  console.log(
    `${pad(l, 3)} | ${pad(fmt(g), 12)} | ${pad((g / catGoldPerSec('divine', 50, 6)).toFixed(2), 5)} | ${pad(fmt(p), 12)} | ${pad((p / catPower('divine', 50, 6)).toFixed(2), 5)} | ${pad(fmt(feedCost(l, 'common')), 18)} | ${pad(fmt(feedCost(l, 'divine')), 7)} | ${l >= 50 ? fmt(feedCostRange(50, l, 'divine')) : '-'}`,
  );
}
console.log('\nComida por tramo (4 mordidas por nivel):');
for (const r of ['common', 'legendary', 'divine'] as RarityId[]) {
  const seg = [50, 60, 70, 80, 90].map((a) => `${a}→${a + 10}: ${fmt(feedCostRange(a, a + 10, r))}`).join(' · ');
  console.log(`  ${r.padEnd(9)} 1→50: ${fmt(feedCostRange(1, 50, r))} · ${seg} · total 50→100: ${fmt(feedCostRange(50, 100, r))}`);
}

// ------------------------------------------------------------------ 2. ladder before / after
console.log('\n== 2. PODIO: poder de cada liga y el Nv que muestra su rival ==');
const oldLevel = (r: RarityId, stars: number, power: number) =>
  Math.max(1, Math.min(60, Math.round(1 + Math.log(power / catPower(r, 1, stars)) / Math.log(BAL.cats.power_per_level))));
const need = (r: RarityId, power: number) => Math.max(1, catLevelForPower(r, 6, power));
console.log('liga               | bout0 poder | champ poder | rival leg. ★ antes→ahora (b0 / champ) | Nv ★6 divino (b0/champ) | Nv ★6 legendario');
for (let lg = 1; lg <= Math.max(TO, 24); lg++) {
  const b0 = boutPower(lg, 0);
  const ch = boutPower(lg, PB.ladder.bouts_per_league - 1);
  const st0 = Math.min(6, 1 + Math.floor((lg - 1) / 2));
  const stc = Math.min(6, st0 + 1);
  const nowL = (st: number, p: number) => Math.max(1, Math.min(100, Math.round(catLevelForPower('legendary', st, p))));
  console.log(
    `${league(lg).name.padEnd(18)} | ${pad(fmt(b0), 11)} | ${pad(fmt(ch), 11)} | Nv ${pad(oldLevel('legendary', st0, b0), 2)}→${pad(nowL(st0, b0), 3)} / Nv ${pad(oldLevel('legendary', stc, ch), 2)}→${pad(nowL(stc, ch), 3)}         | ${pad(need('divine', b0).toFixed(0), 5)} / ${pad(need('divine', ch).toFixed(0), 4)}           | ${pad(need('legendary', b0).toFixed(0), 4)} / ${pad(need('legendary', ch).toFixed(0), 4)}`,
  );
}

// ------------------------------------------------------------------ 3. duels
const ALL_EL = [...new Set(CATS.flatMap((c) => c.elements))];
const OWNED = new Set(CATS.map((c) => c.id));
const MINE = ['d_horizonte', 'd_solcaido', 'd_milvidas', 'd_bigbang', 'h_zarpa', 'h_granbigote', 'h_valquiria', 'h_nekomante', 'm_raijin', 'm_singular'].filter((id) => CATS.some((c) => c.id === id));
const { roleAtk, roleHp, aiSkill } = await import('../src/state/sys/podio');
function me(species: string, level: number) {
  const def = catDef(species);
  const P = catPower(def.rarity, level, 6);
  return {
    side: 0 as const,
    species,
    name: def.name,
    owner: 'TÚ',
    slug: def.art.slug,
    elements: [...def.elements],
    rarity: def.rarity,
    role: def.role,
    level,
    stars: 6,
    podioLvl: PB.levels.max,
    power: P * roleAtk(def.role),
    hp: P * PB.stats.hp_per_power * roleHp(def.role),
    powers: powersOf(species),
    trait: def.trait,
    mutation: null,
  };
}
const { rivalFighter } = await import('../src/state/sys/podio');
function duelWin(lv: number, lg: number, bout: number) {
  let w = 0;
  let n = 0;
  for (let isl = 0; isl < ISLANDS; isl++) {
    const r = rival(lg, bout, 1000 + isl * 7919, ALL_EL, OWNED);
    const foe = rivalFighter(r);
    for (const sp of MINE) {
      for (let s = 0; s < SEEDS; s++) {
        const d = new Duel(me(sp, lv), foe, 17 + s * 101 + isl * 13, aiSkill(lg, r.champion));
        for (let i = 0; i < 600 && !d.over; i++) d.step();
        n++;
        if (d.winner === 0) w++;
      }
    }
  }
  return w / Math.max(1, n);
}
console.log(`\n== 3. DUELOS DEL PODIO: % de victorias de tus ★6 (${MINE.length} gatos × ${ISLANDS} islas × ${SEEDS} semillas por casilla) ==`);
const LVS = [50, 60, 70, 80, 90, 100];
console.log('liga               | ' + LVS.map((l) => `Nv${l} b0/b2/champ`.padStart(18)).join(' | '));
for (let lg = FROM; lg <= TO; lg++) {
  const cells = LVS.map((lv) => {
    const a = duelWin(lv, lg, 0);
    const b = duelWin(lv, lg, 2);
    const c = duelWin(lv, lg, PB.ladder.bouts_per_league - 1);
    return `${pad(Math.round(a * 100), 4)}/${pad(Math.round(b * 100), 3)}/${pad(Math.round(c * 100), 3)}%`.padStart(18);
  });
  console.log(`${league(lg).name.padEnd(18)} | ${cells.join(' | ')}`);
}

// ------------------------------------------------------------------ 4. story battles
if (STORY) {
  const { G } = await import('../src/state');
  const { SAVE_KEY } = await import('../src/core/save');
  const { STORY_BATTLES, buildStoryBattle } = await import('../src/state/sys/storyBattles');
  const { autoBattle } = await import('../src/battle/autoplay');
  const { DIFFICULTY } = await import('../src/battle/ai');
  const { crew } = await import('../src/state/sys/ship');
  const env = readFileSync(new URL('../test-saves/post-finale.json', import.meta.url), 'utf8');
  const load = () => {
    mem.clear();
    mem.set(SAVE_KEY, env);
    G.load();
  };
  const ids = Object.keys(STORY_BATTLES);
  console.log(`\n== 4. BATALLAS DE HISTORIA (post-finale, tripulación ★6; ${STORY_SEEDS} semillas × IA normal/difícil) ==`);
  const table: Record<string, string[]> = {};
  const powers: string[] = [];
  for (const lv of [50, 70, 100]) {
    load();
    for (const c of G.s.cats) {
      c.level = lv;
      c.stars = 6;
    }
    G.recalc();
    const crewPow = crew().reduce((a, u) => a + catPower(catDef(G.s.cats.find((c) => c.uid === u)!.species).rarity, lv, 6), 0);
    powers.push(`Nv${lv}: poder de tripulación ${fmt(crewPow)}`);
    for (const id of ids) {
      let w = 0;
      for (let s = 0; s < STORY_SEEDS; s++) {
        const spec = buildStoryBattle(id, () => undefined);
        const r = autoBattle(spec, s % 2 ? DIFFICULTY.hard : DIFFICULTY.normal, 1000 + s * 77, 30);
        if (r.won) w++;
      }
      (table[id] ??= []).push(`${pad(Math.round((w / STORY_SEEDS) * 100), 3)}%`);
    }
  }
  console.log(powers.join(' · '));
  console.log('batalla                  |  Nv50 |  Nv70 | Nv100');
  for (const id of ids) console.log(`${id.padEnd(24)} | ${table[id].map((x) => pad(x, 5)).join(' | ')}`);
}
