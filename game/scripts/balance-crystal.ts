/**
 * Cristal balance harness (docs/part-ii/15-balance-cristal.md). Headless AI-vs-AI ship battles with the same
 * sim / AI / turn flow as the battle screen and the estimate worker (battle/autoplay.ts autoBattle).
 *
 *   FAMILY crews: three cats of one element (its species whose FIRST element is that one; non-secret), with
 *   the same rarity budget on both sides:  A = common + rare + epic (Nv10) · B = rare + epic + legendary (Nv20).
 *   When an element has several species of a rarity, seed i takes candidate (i + slot) mod n, so 16 seeds
 *   rotate through all of them. Both sides use the same AI profile; seeds alternate which side Cristal plays
 *   (even = player side 0 / first move, odd = side 1).
 *   TEST SHIPS: the sparrow (14×10, 3 cabins, 1 cannon, core, powder) with the three player hull classes at
 *   their cell hp: wood 75 (Balandra) · iron 110 (Galeón) · crystal 145 (Acorazado Arcano); cannon atk 64 / 77 / 90.
 *   Cats fight at species stats (dmgMul 1, hpMul 1, ★1): rarity is the budget, not a power multiplier.
 *
 *   MIXED crews (--mix 1|2): the family crew with its first 1–2 slots (cheapest rarities) swapped for Cristal species
 *   of the same rarity; `--me fire --vs fire --mix 1` is the mirror test (does Cristal earn its slot?).
 *
 * H35 «Shhh» (the Bibliotecario's noise rule): `-- --biblio --seeds 16`.
 *
 * Run:  npx vite-node scripts/balance-crystal.ts [-- --seeds 16 --diff normal,hard --ship wood,iron,crystal,balsa,test6
 *          --budget A,B --me crystal --vs fire,water --mix 1 --crew c_brillito,… --json out.json]
 *   what-ifs (in memory only): --tune facetKeep=0.6,facetReflect=0.15,shard=0.75 · --set r_facetas.shot.dmg=45
 *   · --mat wood.crystal=1.25 · --aff earth.crystal=1.25. The full grid (13 families × 2 budgets × 3 ships × 2 AI ×
 *   16 seeds) is ~2500 battles, ~9 min in one process: split it with --vs over a few processes.
 */
import { autoBattle } from '../src/battle/autoplay';
import { DIFFICULTY } from '../src/battle/ai';
import { BLUEPRINTS } from '../src/battle/blueprints';
import { battleCatFrom } from '../src/battle/catShots';
import type { ShipBlueprint } from '../src/battle/ship';
import type { BattleSpec } from '../src/scenes/BattleScene';
import { CONTENT, ROLE_BY_ID, catDef } from '../src/data/content';
import { MAT_RESIST } from '../src/battle/sim';
import { CR_TUNE } from '../src/battle/cristal';

export const FAMILIES = ['fire', 'water', 'nature', 'earth', 'storm', 'magic', 'cosmic', 'ice', 'sound', 'shadow', 'time', 'light', 'void'];
export const BUDGETS: Record<string, { rar: string[]; level: number }> = {
  A: { rar: ['common', 'rare', 'epic'], level: 10 },
  B: { rar: ['rare', 'epic', 'legendary'], level: 20 },
};
const MAT_LETTER: Record<string, string> = { wood: 'W', iron: 'I', crystal: 'C' };
export const SHIPS: Record<string, { hpMul: number; cannon: number; mat: string; bp?: string }> = {
  /** the all-wood raft (Casco de Balsa, cell hp 60) */
  balsa: { hpMul: 1, cannon: 64, mat: 'wood', bp: 'balsa' },
  /** tests/crystal.test.ts's fixture: the sparrow at ×6 hull, cannon 30 (long fights, cats decide) */
  test6: { hpMul: 6, cannon: 30, mat: 'wood' },
  wood: { hpMul: 75 / 60, cannon: 64, mat: 'wood' },
  iron: { hpMul: 110 / 140, cannon: 77, mat: 'iron' },
  crystal: { hpMul: 145 / 90, cannon: 90, mat: 'crystal' },
};
function hull(mat: string, id = 'sparrow'): ShipBlueprint {
  const bp = BLUEPRINTS[id];
  const L = MAT_LETTER[mat];
  // the wooden test ship keeps the sparrow's two iron ribs; the others are one material
  return { ...bp, hull: bp.hull.map((r) => (mat === 'wood' ? r : r.replace(/[WI]/g, L))) };
}

/** species of an element family at a rarity (primary element; else any with the element) */
export function candidates(el: string, rarity: string): string[] {
  const pool = CONTENT.cats.filter((c) => c.rarity === rarity && !c.secret);
  const prim = pool.filter((c) => c.elements[0] === el).map((c) => c.id);
  return prim.length ? prim : pool.filter((c) => c.elements.includes(el)).map((c) => c.id);
}
export function familyCrew(el: string, budget: string, seed: number, mix = 0): string[] {
  return BUDGETS[budget].rar.map((r, slot) => {
    // MIXED crews: the first `mix` slots (the cheapest rarities) go to Cristal species of the same rarity
    const c = candidates(slot < mix ? 'crystal' : el, r);
    return c[(seed + slot) % c.length];
  });
}

function cats(ids: string[], level: number, tag: string) {
  return ids.map((sp, i) => battleCatFrom({ uid: `${tag}${i}`, species: sp, name: sp, level, stars: 1, dmgMul: 1, hpMul: 1 }, ROLE_BY_ID.get(catDef(sp).role)!.hp));
}

export function spec(a: string[], b: string[], ship: string, diff: keyof typeof DIFFICULTY, level: number, rules?: BattleSpec['rules']): BattleSpec {
  const s = SHIPS[ship];
  const bp = hull(s.mat, s.bp);
  return {
    player: { blueprint: bp, hpMul: s.hpMul, cats: cats(a, level, 'p'), cannonAtk: s.cannon },
    enemy: { blueprint: bp, hpMul: s.hpMul, cats: cats(b, level, 'e'), cannonAtk: s.cannon },
    playerName: 'A',
    enemyName: 'B',
    difficulty: diff,
    rules,
    onEnd: () => undefined,
  } as BattleSpec;
}

/** crew X vs crew Y, X alternating sides by seed; returns X's wins and the average turns */
export function duel(x: (seed: number) => string[], y: (seed: number) => string[], ship: string, diff: keyof typeof DIFFICULTY, level: number, seeds: number) {
  let wins = 0;
  let turns = 0;
  for (let i = 0; i < seeds; i++) {
    const seed = 1000 + i * 7919;
    const xs = x(i);
    const ys = y(i);
    const xFirst = i % 2 === 0;
    const sp = xFirst ? spec(xs, ys, ship, diff, level) : spec(ys, xs, ship, diff, level);
    const r = autoBattle(sp, DIFFICULTY[diff], seed, 30);
    if (r.won === xFirst) wins++;
    turns += r.turns;
  }
  return { wins, n: seeds, turns: turns / seeds };
}

// ------------------------------------------------------------------ CLI
// importers (tests, diagnostics) set BALANCE_LIB=1 before a dynamic import
const isMain = typeof process !== 'undefined' && !process.env.VITEST && !process.env.BALANCE_LIB && /vite-node|balance-crystal/.test(process.argv[1] ?? '');
if (isMain) {
  const args = process.argv.slice(2);
  const opt = (k: string, d: string) => {
    const i = args.indexOf(`--${k}`);
    return i >= 0 ? args[i + 1] : d;
  };
  const seeds = Number(opt('seeds', '16'));
  if (args.includes('--biblio')) {
    await biblio(seeds);
    process.exit(0);
  }
  const diffs = opt('diff', 'normal,hard').split(',') as (keyof typeof DIFFICULTY)[];
  const ships = opt('ship', 'wood,iron,crystal').split(',');
  const budgets = opt('budget', 'A,B').split(',');
  const vs = opt('vs', FAMILIES.join(',')).split(',');
  const crewArg = opt('crew', '');
  const me = opt('me', 'crystal');
  const mix = Number(opt('mix', '0'));
  const json = opt('json', '');
  // what-if knobs (in memory only): --tune facetKeep=0.6 · --set e_prismarina.shot.dmg=80 · --mat wood.crystal=1.25 · --aff earth.crystal=1.25
  const pairs = (k: string) => (opt(k, '') ? opt(k, '').split(',').map((kv) => kv.split('=') as [string, string]) : []);
  for (const [k, v] of pairs('tune')) (CR_TUNE as Record<string, number>)[k] = Number(v);
  for (const [k, v] of pairs('set')) {
    const [id, ...path] = k.split('.');
    let o = catDef(id).combat as unknown as Record<string, unknown>;
    for (const p of path.slice(0, -1)) o = o[p] as Record<string, unknown>;
    o[path[path.length - 1]] = isNaN(Number(v)) ? v : Number(v);
  }
  for (const [k, v] of pairs('mat')) {
    const [m, el] = k.split('.');
    (MAT_RESIST[m] as Record<string, number>)[el] = Number(v);
  }
  for (const [k, v] of pairs('aff')) {
    const [a, d] = k.split('.');
    const aff = CONTENT.affinity as Record<string, Record<string, number>>;
    (aff[a] ??= {})[d] = Number(v);
  }
  const rows: { budget: string; ship: string; diff: string; vs: string; wins: number; n: number; turns: number }[] = [];
  const t0 = Date.now();
  for (const budget of budgets) {
    const level = BUDGETS[budget].level;
    const mine = crewArg ? () => crewArg.split(',') : (s: number) => familyCrew(me, budget, s, mix);
    console.log(`\n== ${crewArg || me}${mix ? ` +${mix} Cristal` : ''} (budget ${budget}, Nv${level}) — wins of ${seeds} per cell`);
    console.log(['vs'.padEnd(8), ...ships.flatMap((sh) => diffs.map((d) => `${sh}/${d}`.padEnd(14)))].join(' '));
    const tot: Record<string, number> = {};
    for (const el of vs) {
      const row = [el.padEnd(8)];
      for (const sh of ships)
        for (const d of diffs) {
          const r = duel(mine, (s) => familyCrew(el, budget, s), sh, d, level, seeds);
          rows.push({ budget, ship: sh, diff: d, vs: el, ...r });
          tot[`${sh}/${d}`] = (tot[`${sh}/${d}`] ?? 0) + r.wins;
          row.push(`${String(r.wins).padStart(2)}/${r.n} ${Math.round((100 * r.wins) / r.n)}% t${r.turns.toFixed(1)}`.padEnd(14));
        }
      console.log(row.join(' '));
    }
    console.log(['avg'.padEnd(8), ...ships.flatMap((sh) => diffs.map((d) => `${Math.round((100 * tot[`${sh}/${d}`]) / (seeds * vs.length))}%`.padEnd(14)))].join(' '));
  }
  console.log(`\n(${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  if (json) (await import('node:fs')).writeFileSync(json, JSON.stringify(rows));
}

/**
 * H35 «Shhh» calibration (`--biblio`): test-saves/post-finale.json's crew vs ruptura_bibliotecario, `seeds` seeds ×
 * your aim normal/hard, with the noise rule and without it, with the usual crew (no Sonido) and with Headliner aboard.
 */
async function biblio(seeds: number) {
  const { readFileSync } = await import('node:fs');
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
  const { checkMissions } = await import('../src/state/sys/missions');
  const { buildStoryBattle } = await import('../src/state/sys/storyBattles');
  await import('../src/state/sys/rupturas');
  const { Battle } = await import('../src/battle/sim');
  const { nzState } = await import('../src/battle/ruido');
  mem.set(SAVE_KEY, readFileSync(new URL('../test-saves/post-finale.json', import.meta.url), 'utf8'));
  G.load();
  checkMissions();
  const ship = G.s.ship.active;
  const base = [...G.s.ship.crew[ship]];
  let last: InstanceType<typeof Battle> | null = null;
  const start = Battle.prototype.startTurn;
  Battle.prototype.startTurn = function (side) {
    last = this;
    return start.call(this, side);
  };
  const crews: [string, [string, string] | null][] = [
    ['sin Sonido (su tripulación)', null],
    ['Headliner en vez de Merlina', ['c103', 'c118']],
    ['Headliner en vez de Abisa', ['c101', 'c118']],
  ];
  for (const [label, sw] of crews) {
    G.s.ship.crew[ship] = sw ? base.map((u) => (u === sw[0] ? sw[1] : u)) : [...base];
    for (const rule of [true, false]) {
      const row: string[] = [];
      for (const d of ['normal', 'hard'] as const) {
        let w = 0;
        let t = 0;
        let wakes = 0;
        for (let i = 0; i < seeds; i++) {
          const sp = buildStoryBattle('ruptura_bibliotecario', () => undefined);
          if (!rule) sp.rules = { ...sp.rules, noise: undefined };
          const r = autoBattle(sp, DIFFICULTY[d], 4242 + i * 101, 30);
          if (r.won) w++;
          t += r.turns;
          wakes += (last && nzState(last)?.wakes) || 0;
        }
        row.push(`${d} ${w}/${seeds} t${(t / seeds).toFixed(1)} ¡SHHHH!×${(wakes / seeds).toFixed(1)}`);
      }
      console.log(`${label.padEnd(30)} ${rule ? 'con regla' : 'sin regla'}  ${row.join(' · ')}`);
    }
  }
}
