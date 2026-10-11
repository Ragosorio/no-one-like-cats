/**
 * Oleada 2 «El Cielo Despierta» calibration (docs/part-ii/22-oleada-2.md §5): test-saves/post-finale.json's crew vs
 * the four sky battles (state/sys/rupturasO2.ts), with the Kit de Vuelo at a given level, `seeds` seeds × your aim
 * normal/hard. The same sim / AI / turn flow as the battle screen and the estimate worker (battle/autoplay.ts).
 *
 * Run:  npx vite-node scripts/balance-sky.ts [-- --seeds 16 --kit 1 --only cielo_invertidas --mul cielo_embajada=1.2
 *          --nosky]          (--nosky: the same battles at sea, to see what the sky changes)
 */
import { readFileSync } from 'node:fs';

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
const O2 = await import('../src/state/sys/rupturasO2');
const { Battle } = await import('../src/battle/sim');
const { autoBattle } = await import('../src/battle/autoplay');
const { DIFFICULTY } = await import('../src/battle/ai');
const { skyState } = await import('../src/battle/cielo');
const { grFeats } = await import('../src/battle/gravedad');

mem.set(SAVE_KEY, readFileSync(new URL('../test-saves/post-finale.json', import.meta.url), 'utf8'));
G.load();
const seeds = Number(opt('seeds', '16'));
const kit = Number(opt('kit', '1'));
const only = opt('only', '');
const nosky = args.includes('--nosky');
for (const kv of opt('mul', '').split(',').filter(Boolean)) {
  const [id, v] = kv.split('=');
  STORY_BATTLES[id].powerMul = Number(v);
}
if (kit > 0) (G.s.ext ??= {}).flightKit = { level: kit, ships: [G.s.ship.active] };
let last: InstanceType<typeof Battle> | null = null;
const start = Battle.prototype.startTurn;
Battle.prototype.startTurn = function (side) {
  last = this;
  return start.call(this, side);
};
console.log(`crew ${G.s.ship.crew[G.s.ship.active].join(',')} · kit ${O2.flightKitLevel()} · ${nosky ? 'SIN CIELO' : 'cielo'}`);
for (const id of O2.O2_BATTLES) {
  if (only && !only.split(',').includes(id)) continue;
  const def = STORY_BATTLES[id];
  const row: string[] = [];
  for (const d of ['normal', 'hard'] as const) {
    let pass = 0;
    let t = 0;
    let dmg = 0;
    let islet = 0;
    let shove = 0;
    let lost = 0;
    for (let i = 0; i < seeds; i++) {
      const sp = buildStoryBattle(id, () => undefined);
      if (nosky) sp.rules = { ...sp.rules, sky: undefined };
      const r = autoBattle(sp, DIFFICULTY[d], Number(opt('base', '4242')) + i * 101, 30);
      const b = last!;
      const pct = Math.round((1 - b.hullPct(1)) * 100);
      const ok = def.grade === 'damage' ? pct >= (def.passPct ?? 15) || (r.won && r.reason !== 'retreat') : r.won;
      if (ok) pass++;
      t += r.turns;
      dmg += pct;
      lost += r.hullLost;
      islet += skyState(b)?.isletHits ?? 0;
      shove += grFeats(b).gr_shove ?? 0;
    }
    row.push(`${d} ${pass}/${seeds} t${(t / seeds).toFixed(1)} daño ${Math.round(dmg / seeds)}% tuyo −${Math.round((100 * lost) / seeds)}% islote×${(islet / seeds).toFixed(1)} vacío×${(shove / seeds).toFixed(1)}`);
  }
  console.log(`${id.padEnd(18)} ×${def.powerMul}  ${row.join(' · ')}`);
}
