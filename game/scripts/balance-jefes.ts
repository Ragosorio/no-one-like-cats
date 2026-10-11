/**
 * BALANCE DE JEFES (docs/part-ii/27-oleada-4.md §Balance de jefes, doc 16 §4b): every Parte II story battle against
 * representative crews at Nv30 / 50 / 60 / 80 / 100, `seeds` fights each (half your aim normal, half hard, SINCRO off),
 * the same sim / AI / turn flow as the battle screen and the estimate worker (battle/autoplay.ts).
 *
 * The crews are real species (Parte I legendaries + mythic and Parte II cats earned along the story) on the
 * post-finale fixture's Bastión, Kit de Vuelo 1 and Kit Astral 1 (the worst case). Only level / stars change
 * between crews, so the table shows what the level scaling (state/sys/storyScale.ts) does by itself.
 *
 * Run:  npx vite-node scripts/balance-jefes.ts [-- --seeds 64 --crews n30,n50,n60,n80,n100 --only umbral_final
 *          --comp historia|legend|p2 --noscale --json out.jsonl --tune final.base=1.8 --mul id=1.3 --hp id=4]   (--noscale: the story battles as before the bands)
 */
import { readFileSync, appendFileSync } from 'node:fs';

const args = process.argv.slice(2);
const opt = (k: string, d: string) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
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
const { buildStoryBattle, STORY_BATTLES } = await import('../src/state/sys/storyBattles');
const SS = await import('../src/state/sys/storyScale');
const { autoBattle } = await import('../src/battle/autoplay');
const { DIFFICULTY } = await import('../src/battle/ai');
const { Battle } = await import('../src/battle/sim');
let last: InstanceType<typeof Battle> | null = null;
const start = Battle.prototype.startTurn;
Battle.prototype.startTurn = function (side) {
  last = this;
  return start.call(this, side);
};

const seeds = Number(opt('seeds', '64'));
const only = opt('only', '');
const out = opt('json', '');
const noscale = args.includes('--noscale');
const COMPS: Record<string, string[]> = {
  // a story crew: the mythic of H11, Parte I legendaries and the cats Parte II hands you (O1 Madrenácar, O2 Masa Madre, O3 Jonás + Brecha)
  historia: ['m_raijin', 'l_ignis', 'l_abisa', 'l_madrenacar', 'l_masamadre', 'l_jonas', 'e_brecha'],
  // the post-finale fixture's own crew (7 Parte I legendaries + 1 epic)
  legend: ['l_ignis', 'l_tronador', 'l_astraprima', 'l_gea', 'e_meteoro', 'l_abisa', 'l_merlina'],
  // Parte II cats only, mixed elements and rarities (water+cosmic, gravity, crystal, gravity+water, void+storm, crystal+water, cosmic+earth)
  p2: ['l_jonas', 'l_masamadre', 'l_madrenacar', 'e_cascada', 'e_brecha', 'e_prismarina', 'r_escafandra'],
};
const CREWS: Record<string, { level: number; stars: number }> = {
  n30: { level: 30, stars: 3 },
  n50: { level: 50, stars: 3 },
  n60: { level: 60, stars: 3 },
  // the level H63's boss shows to a Nv60 crew (60 + 5): «beatable by a crew at the boss's level»
  n65: { level: 65, stars: 3 },
  n80: { level: 80, stars: 4 },
  n100: { level: 100, stars: 6 },
};
const comp = COMPS[opt('comp', 'historia')];
const crews = opt('crews', Object.keys(CREWS).join(',')).split(',');
if (noscale) SS.STORY_SCALE.off = true;
// --tune final.base=1.5,jefe.over=0.3 · --mul umbral_final=1.4 (what-ifs without touching the code)
for (const kv of opt('tune', '').split(',').filter(Boolean)) {
  const [k, v] = kv.split('=');
  const [band, key] = k.split('.') as [keyof typeof SS.STORY_SCALE.bands, 'base' | 'over' | 'lvl'];
  SS.STORY_SCALE.bands[band][key] = Number(v);
}
const muls = opt('mul', '').split(',').filter(Boolean).map((kv) => kv.split('='));

const fixture = readFileSync(new URL('../test-saves/post-finale.json', import.meta.url), 'utf8');
function load(lv: number, st: number) {
  mem.clear();
  mem.set(SAVE_KEY, fixture);
  G.load();
  const uids = G.s.ship.crew[G.s.ship.active];
  uids.forEach((u, i) => {
    const c = G.s.cats.find((k) => k.uid === u)!;
    Object.assign(c, { species: comp[i % comp.length], level: lv, stars: st, kos: 0, trait: 'leal', mutation: null, form: undefined });
  });
  (G.s.ext ??= {}).flightKit = { level: 1, ships: [G.s.ship.active] };
  (G.s.ext as Record<string, unknown>).astral = { fuel: 60, at: Date.now(), kit: { level: 1, ships: [G.s.ship.active] } };
  G.recalc();
}

for (const [id, v] of muls) STORY_BATTLES[id].powerMul = Number(v);
for (const [id, v] of opt('hp', '').split(',').filter(Boolean).map((kv) => kv.split('='))) STORY_BATTLES[id].hpMulX = Number(v);
const ids = Object.keys(STORY_BATTLES).filter((id) => SS.storyBand(STORY_BATTLES[id]) && (!only || only.split(',').includes(id)));
for (const cr of crews) {
  const { level, stars } = CREWS[cr];
  load(level, stars);
  for (const id of ids) {
    const def = STORY_BATTLES[id];
    let pass = 0;
    let turns = 0;
    let lost = 0;
    const spec0 = buildStoryBattle(id, () => undefined);
    for (let i = 0; i < seeds; i++) {
      const sp = buildStoryBattle(id, () => undefined);
      const r = autoBattle(sp, i % 2 ? DIFFICULTY.hard : DIFFICULTY.normal, 4242 + i * 101, 30);
      const pct = Math.round((1 - last!.hullPct(1)) * 100);
      const ok = def.grade === 'damage' ? pct >= (def.passPct ?? 15) || (r.won && r.reason !== 'retreat') : r.won;
      if (ok) pass++;
      turns += r.turns;
      lost += r.hullLost;
    }
    const m = spec0.meta!;
    const row = { tune: opt('tune', ''), mul: def.powerMul, hp: def.hpMulX, crew: cr, comp: opt('comp', 'historia'), id, mission: def.mission, band: SS.storyBand(def), scale: noscale ? 'off' : 'on', win: pass / seeds, n: seeds, turns: turns / seeds, lost: lost / seeds, ep: Math.round(m.ep ?? 0), sp: Math.round(m.sp ?? 0), lvl: m.enemyLevel };
    console.log(`${cr.padEnd(5)} ${id.padEnd(22)} ${String(row.band).padEnd(6)} ${pass}/${seeds} (${Math.round(row.win * 100)}%) t${row.turns.toFixed(1)} tuyo −${Math.round(row.lost * 100)}% EP/SP ${(row.ep / Math.max(1, row.sp)).toFixed(2)} Nv${row.lvl}`);
    if (out) appendFileSync(out, JSON.stringify(row) + '\n');
  }
}
