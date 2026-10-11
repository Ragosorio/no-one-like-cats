/**
 * Oleada 4 «El Umbral» calibration: the three story battles (state/sys/rupturasO4Battles.ts) against the crews of
 * test-saves/rupturas-o4.json (H57 done, Kit de Vuelo 2) and test-saves/post-finale.json, `seeds` seeds × `bases`
 * seed bases × your aim normal / hard. The same sim / AI / turn flow as the battle screen and the estimate worker
 * (battle/autoplay.ts). H58's dream comes from each fixture's own island (who sleeps there).
 *
 * Run:  npx vite-node scripts/balance-o4.ts [-- --seeds 32 --bases 3 --only umbral_final --fixture rupturas-o4
 *          --mul umbral_final=1.2 --hp umbral_final=3.5 --norules]   (--norules: the same fights without the O4 rules)
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
const O4 = await import('../src/state/sys/rupturasO4Battles');
const { Battle } = await import('../src/battle/sim');
const { autoBattle } = await import('../src/battle/autoplay');
const { DIFFICULTY } = await import('../src/battle/ai');
const { dreamState } = await import('../src/battle/suenos');
const { umState } = await import('../src/battle/umbral');
const { fasesState } = await import('../src/battle/fases');

const seeds = Number(opt('seeds', '32'));
const bases = Number(opt('bases', '3'));
const only = opt('only', '');
const fixtures = opt('fixture', 'rupturas-o4,post-finale').split(',');
const norules = args.includes('--norules');
for (const kv of opt('mul', '').split(',').filter(Boolean)) {
  const [id, v] = kv.split('=');
  STORY_BATTLES[id].powerMul = Number(v);
}
for (const kv of opt('hp', '').split(',').filter(Boolean)) {
  const [id, v] = kv.split('=');
  STORY_BATTLES[id].hpMulX = Number(v);
}
let last: InstanceType<typeof Battle> | null = null;
const start = Battle.prototype.startTurn;
Battle.prototype.startTurn = function (side) {
  last = this;
  return start.call(this, side);
};
// EL AGUA ES SUELO: count the bounces of FIRED paths (the AI's trial paths bounce too, they don't count)
let bounces = 0;
const fire = Battle.prototype.fire;
Battle.prototype.fire = function (...a: Parameters<typeof fire>) {
  const r = fire.apply(this, a);
  const wy = this.waterY - 4;
  for (const p of r.paths) bounces += p.points.filter((q) => q.y === wy).length;
  return r;
};

for (const fx of fixtures) {
  mem.clear();
  mem.set(SAVE_KEY, readFileSync(new URL(`../test-saves/${fx}.json`, import.meta.url), 'utf8'));
  G.load();
  const cfg = O4.dreamCfgFor(G.s);
  console.log(`\n== ${fx} · crew ${G.s.ship.crew[G.s.ship.active].join(',')} · sueño ${cfg.el} ${cfg.pool.map((p) => `${p.id}:${p.w}`).join(' ')}`);
  for (const id of O4.O4_BATTLES) {
    if (only && !only.split(',').includes(id)) continue;
    const def = STORY_BATTLES[id];
    const row: string[] = [];
    let all = 0;
    let allN = 0;
    for (const d of ['normal', 'hard'] as const) {
      let pass = 0;
      let t = 0;
      let lost = 0;
      let extra = { a: 0, b: 0, c: 0 };
      const phaseEnd = [0, 0, 0, 0, 0];
      const rulesSeen = new Map<string, number>();
      for (let base = 0; base < bases; base++) {
        for (let i = 0; i < seeds; i++) {
          bounces = 0;
          const sp = buildStoryBattle(id, () => undefined);
          if (norules) sp.rules = { ...sp.rules, dream: undefined, umbral: undefined, fases: undefined };
          const r = autoBattle(sp, DIFFICULTY[d], 4242 + base * 7919 + i * 101, 30);
          const b = last!;
          if (r.won) pass++;
          t += r.turns;
          lost += r.hullLost;
          const ds = dreamState(b);
          if (ds) {
            extra.a += bounces;
            extra.b += ds.fish;
            extra.c += ds.n + 1;
            for (const k of ds.order.slice(0, ds.n + 1)) rulesSeen.set(k, (rulesSeen.get(k) ?? 0) + 1);
          }
          const us = umState(b);
          if (us) {
            extra.a += us.corrected;
            extra.b += us.tachones;
          }
          const fs = fasesState(b);
          if (fs) phaseEnd[fs.idx]++;
        }
      }
      const n = seeds * bases;
      all += pass;
      allN += n;
      let more = '';
      if (id === 'umbral_suenos') more = ` rebote×${(extra.a / n).toFixed(1)} peces×${(extra.b / n).toFixed(1)} sueños×${(extra.c / n).toFixed(1)} [${[...rulesSeen].map(([k, v]) => `${k}${v}`).join(' ')}]`;
      else if (id === 'umbral_correctores') more = ` corrige×${(extra.a / n).toFixed(1)} tacha×${(extra.b / n).toFixed(1)}`;
      else more = ` fase-final[${phaseEnd.slice(0, 4).join('/')}] corrige×${(extra.a / n).toFixed(1)} tacha×${(extra.b / n).toFixed(1)}`;
      row.push(`${d} ${pass}/${n} t${(t / n).toFixed(1)} tuyo −${Math.round((100 * lost) / n)}%${more}`);
    }
    console.log(`${id.padEnd(19)} ×${def.powerMul} hp×${def.hpMulX}${norules ? ' SIN REGLAS' : ''}  ${Math.round((100 * all) / allN)}%  ${row.join(' · ')}`);
  }
}
