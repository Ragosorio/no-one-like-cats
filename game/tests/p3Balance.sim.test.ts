/**
 * Parte III · BALANCE DE LA CARTA (agente MECÁNICAS, ronda 4 — docs/part-iii/mecanicas-v2/01-auditoria.md §7, 02-loop.md §6).
 *
 * A measuring harness, not a gate: it plays the Carta's battles (regiones.json, as they are) with the same headless sim
 * and AI the estimate uses (autoBattle; half the fights aim «normal», half «hard») against representative crews on the
 * h65-normal fixture, and prints a table (win rate, turns, hull lost, EP/SP). Nothing is written: the save lives in an
 * in-memory localStorage and the crews are changed in memory.
 *
 * It does NOT run with `npm test` (it takes a few minutes). Turn it on with:
 *   cd game && NOLC_SIM=1 npx vitest run tests/p3Balance.sim.test.ts
 *   NOLC_SIM_SEEDS=64            more fights per cell (default 16)
 *   NOLC_SIM_SHIPS=bastion,bajel the ships to measure (default both: the policy is calibrated on them)
 *   NOLC_SIM_TARGETS=1           also assert the target bands (MECÁNICAS-IMPL calibrated CARTA_POLICY to them: h65
 *                                ~75–85 % on élite and boss, the floor crew ~55–65 %; the bands below carry the noise
 *                                of a 16-fight cell, ±12 points — use NOLC_SIM_SEEDS=64 for a tight read)
 * A synthetic crew owns a collection like it (the rest of the h65 cats go away): the policy's floor reads your best cats.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const RUN = !!process.env.NOLC_SIM;
const SEEDS = Number(process.env.NOLC_SIM_SEEDS ?? 16);
const TARGETS = !!process.env.NOLC_SIM_TARGETS;
const SHIPS = (process.env.NOLC_SIM_SHIPS ?? 'bastion,bajel').split(',').filter(Boolean);

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

/** representative crews (docs/part-iii/mecanicas-v2/02-loop.md §6.1); `null` = the fixture's own crew */
const CREWS: Record<string, { comp: string[]; level: number; stars: number; size?: number } | null> = {
  h65: null,
  medio40: { comp: ['e_meteoro', 'e_golem', 'e_galaxia', 'r_plasmin', 'r_magmito', 'e_tempano', 'r_kage'], level: 40, stars: 2 },
  raros40: { comp: ['r_plasmin', 'r_magmito', 'r_marejada', 'r_iman', 'r_solar', 'r_kage', 'r_escarcha'], level: 40, stars: 2, size: 5 },
};
/**
 * target win-rate bands per stage kind for the expected crew (h65) and the floor crew (raros40): 02-loop.md §6.2 and
 * the coordinator's brief (élite and boss: h65 75–85 %, raros40 55–65 %), widened by a 16-fight cell's noise
 */
const TARGET: Record<string, { h65: [number, number]; raros40: [number, number] }> = {
  normal: { h65: [0.8, 1], raros40: [0.5, 1] },
  elite: { h65: [0.62, 0.98], raros40: [0.4, 0.8] },
  boss: { h65: [0.62, 0.95], raros40: [0.4, 0.8] },
};

const fixture = new URL('../test-saves/h65-normal.json', import.meta.url);

describe.skipIf(!RUN || !existsSync(fixture))('Parte III · balance de la Carta (medición, NOLC_SIM=1)', () => {
  type Mods = {
    G: typeof import('../src/state').G;
    SAVE_KEY: string;
    GT: typeof import('../src/state/sys/gateras');
    GB: typeof import('../src/state/sys/gaterasBattles');
    autoBattle: typeof import('../src/battle/autoplay').autoBattle;
    DIFFICULTY: typeof import('../src/battle/ai').DIFFICULTY;
  };
  let M: Mods;
  const raw = RUN && existsSync(fixture) ? readFileSync(fixture, 'utf8') : '';

  beforeAll(async () => {
    const { G } = await import('../src/state');
    const { SAVE_KEY } = await import('../src/core/save');
    M = {
      G,
      SAVE_KEY,
      GT: await import('../src/state/sys/gateras'),
      GB: await import('../src/state/sys/gaterasBattles'),
      autoBattle: (await import('../src/battle/autoplay')).autoBattle,
      DIFFICULTY: (await import('../src/battle/ai')).DIFFICULTY,
    };
    crewSizeOf = (await import('../src/state/sys/ship')).crewSize;
  });

  function load(name: string, ship = 'bastion') {
    const { G, SAVE_KEY } = M;
    mem.clear();
    mem.set(SAVE_KEY, raw);
    G.load();
    // another ship borrows the Bastión's crew (its first N cats)
    const size = ship === 'bastion' ? 99 : crewSizeOf(ship);
    if (!G.s.ship.owned.includes(ship)) G.s.ship.owned.push(ship);
    G.s.ship.crew[ship] = G.s.ship.crew.bastion.slice(0, size);
    G.s.ship.active = ship;
    const cr = CREWS[name];
    if (!cr) {
      G.recalc();
      return;
    }
    const uids = G.s.ship.crew[ship].slice(0, cr.size ?? 99);
    G.s.ship.crew[ship] = uids;
    uids.forEach((u, i) => {
      const c = G.s.cats.find((k) => k.uid === u)!;
      Object.assign(c, { species: cr.comp[i % cr.comp.length], level: cr.level, stars: cr.stars, kos: 0, trait: 'leal', mutation: null, form: undefined });
    });
    // a player with this crew owns a collection like it (the policy's floor reads your BEST cats)
    G.s.cats = G.s.cats.filter((c) => uids.includes(c.uid));
    G.recalc();
  }
  let crewSizeOf: (ship: string) => number = () => 7;

  const B = 'p3d_borracha' as const;
  function measure(n: number) {
    const { GB, autoBattle, DIFFICULTY } = M;
    let wins = 0;
    let turns = 0;
    let lost = 0;
    const spec0 = GB.buildGateraBattle(B, n, () => undefined);
    for (let i = 0; i < SEEDS; i++) {
      const r = autoBattle(GB.buildGateraBattle(B, n, () => undefined), i % 2 ? DIFFICULTY.hard : DIFFICULTY.normal, 4242 + i * 101, 30);
      if (r.won) wins++;
      turns += r.turns;
      lost += r.hullLost;
    }
    return { win: wins / SEEDS, turns: turns / SEEDS, lost: lost / SEEDS, epsp: (spec0.meta?.ep ?? 0) / Math.max(1, spec0.meta?.sp ?? 1) };
  }

  it('mide B-1…B-9 contra tres tripulaciones en el Bastión y el Bajel e imprime la tabla', () => {
    const rows: string[] = [];
    const bad: string[] = [];
    for (const ship of SHIPS)
      for (const name of Object.keys(CREWS)) {
        load(name, ship);
        for (const st of M.GT.stagesOf(B).filter((s) => s.playable)) {
          const r = measure(st.n);
          expect(Number.isFinite(r.win) && r.win >= 0 && r.win <= 1).toBe(true);
          rows.push(`${ship.padEnd(8)} ${name.padEnd(8)} B-${st.n} ${st.kind.padEnd(6)} ${Math.round(r.win * 100)}% · t${r.turns.toFixed(1)} · −${Math.round(r.lost * 100)}% casco · EP/SP ${r.epsp.toFixed(2)}`);
          const band = TARGET[st.kind]?.[name as 'h65' | 'raros40'];
          if (band && (r.win < band[0] || r.win > band[1])) bad.push(`${ship} ${name} B-${st.n} (${st.kind}): ${Math.round(r.win * 100)}% fuera de [${band.map((x) => Math.round(x * 100)).join('–')}]%`);
        }
      }
    console.log(`\nBALANCE DE LA CARTA (${SEEDS} peleas por celda)\n${rows.join('\n')}${bad.length ? `\n\nFuera de banda (02-loop §6.2):\n${bad.join('\n')}` : ''}\n`);
    if (TARGETS) expect(bad).toEqual([]);
  }, 1_800_000);

  it('una celda es determinista (mismas semillas → mismo resultado)', () => {
    load('h65');
    const { GB, autoBattle, DIFFICULTY } = M;
    const a = autoBattle(GB.buildGateraBattle(B, 5, () => undefined), DIFFICULTY.normal, 777, 30);
    const b = autoBattle(GB.buildGateraBattle(B, 5, () => undefined), DIFFICULTY.normal, 777, 30);
    expect(b).toEqual(a);
  }, 120_000);
});
