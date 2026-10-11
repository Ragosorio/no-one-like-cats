/**
 * Oleada 3 «La Era Astral» calibration (docs/part-ii/25-oleada-3.md §6): test-saves/post-finale.json's crew vs the four
 * O3 story battles (state/sys/rupturasO3.ts), with the Kit Astral at a given level, `seeds` seeds × your aim normal/hard.
 * Same sim / AI / turn flow as the battle screen and the estimate worker (battle/autoplay.ts). Prints the phases reached
 * (battle/fases.ts) for the multi-layer boss.
 *
 * Run:  npx vite-node scripts/balance-astral.ts [-- --seeds 16 --kit 1 --only ruptura_leviatan --mul ruptura_estrella=1.2]
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
const O3 = await import('../src/state/sys/rupturasO3');
const { Battle } = await import('../src/battle/sim');
const { autoBattle } = await import('../src/battle/autoplay');
const { DIFFICULTY } = await import('../src/battle/ai');
const { fasesState } = await import('../src/battle/fases');

mem.set(SAVE_KEY, readFileSync(new URL('../test-saves/post-finale.json', import.meta.url), 'utf8'));
G.load();
const seeds = Number(opt('seeds', '16'));
const kit = Number(opt('kit', '1'));
const only = opt('only', '');
for (const kv of opt('mul', '').split(',').filter(Boolean)) {
  const [id, v] = kv.split('=');
  STORY_BATTLES[id].powerMul = Number(v);
}
if (kit > 0) (G.s.ext ??= {}).astral = { fuel: 60, at: Date.now(), kit: { level: kit, ships: [G.s.ship.active] } };
let last: InstanceType<typeof Battle> | null = null;
const start = Battle.prototype.startTurn;
Battle.prototype.startTurn = function (side) {
  last = this;
  return start.call(this, side);
};
console.log(`crew ${G.s.ship.crew[G.s.ship.active].join(',')} · kit astral ${O3.astralKitLevel()}`);
for (const id of O3.O3_BATTLES) {
  if (only && !only.split(',').includes(id)) continue;
  const def = STORY_BATTLES[id];
  const row: string[] = [];
  for (const d of ['normal', 'hard'] as const) {
    let pass = 0;
    let t = 0;
    let dmg = 0;
    let lost = 0;
    let bodies = 0;
    let shield = 0;
    const reached: number[] = [];
    for (let i = 0; i < seeds; i++) {
      const sp = buildStoryBattle(id, () => undefined);
      const r = autoBattle(sp, DIFFICULTY[d], Number(opt('base', '4242')) + i * 101, 30);
      const b = last!;
      if (r.won) pass++;
      t += r.turns;
      dmg += Math.round((1 - b.hullPct(1)) * 100);
      lost += r.hullLost;
      const fs = fasesState(b);
      bodies += fs?.bodyHits ?? 0;
      shield += fs?.shieldHits ?? 0;
      reached.push((fs?.idx ?? 0) + 1);
    }
    const ph = reached.reduce((a, n) => ((a[n] = (a[n] ?? 0) + 1), a), {} as Record<number, number>);
    row.push(`${d} ${pass}/${seeds} t${(t / seeds).toFixed(1)} daño ${Math.round(dmg / seeds)}% tuyo −${Math.round((100 * lost) / seeds)}% cuerpo×${(bodies / seeds).toFixed(1)} escudo×${(shield / seeds).toFixed(1)} capas ${JSON.stringify(ph)}`);
  }
  console.log(`${id.padEnd(20)} ×${def.powerMul}  ${row.join(' · ')}`);
}
