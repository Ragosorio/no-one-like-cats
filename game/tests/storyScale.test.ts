/**
 * BALANCE DE JEFES (state/sys/storyScale.ts, docs/part-ii/27-oleada-4.md §Balance de jefes): Parte II story battles
 * follow your crew past Nv50 by difficulty band. Checked here:
 *   · Parte I battles (no band) are bit-identical at every crew level, and the level term is exactly the old enemy
 *     at Nv ≤ 50 for every battle (Parte II adds only its band floor, which never makes a fight easier);
 *   · determinism: the spec is a pure function of the save, and the same spec + seed replays the same fight —
 *     the screen's step-by-step path and the estimate's are the same generator;
 *   · monotonic: a higher crew level never gets a weaker enemy;
 *   · the H63 bands hold, as sim results over fixed seeds.
 */
import { describe, expect, it } from 'vitest';
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

const { G } = await import('../src/state');
const { SAVE_KEY } = await import('../src/core/save');
const { STORY_BATTLES, buildStoryBattle } = await import('../src/state/sys/storyBattles');
await import('../src/state/sys/rupturas');
await import('../src/state/sys/rupturasO2');
await import('../src/state/sys/rupturasO3');
await import('../src/state/sys/rupturasO4Battles');
const SS = await import('../src/state/sys/storyScale');
const { autoBattle, autoBattleSteps } = await import('../src/battle/autoplay');
const { DIFFICULTY } = await import('../src/battle/ai');
type Spec = ReturnType<typeof buildStoryBattle>;

const FIX = readFileSync(new URL('../test-saves/post-finale.json', import.meta.url), 'utf8');
/** the balance crew (scripts/balance-jefes.ts «historia»): real species, Parte I + Parte II, on the post-finale Bastión */
const COMP = ['m_raijin', 'l_ignis', 'l_abisa', 'l_madrenacar', 'l_masamadre', 'l_jonas', 'e_brecha'];
/** the other balance crew («legend»: the fixture's own species) */
const LEGEND = ['l_ignis', 'l_tronador', 'l_astraprima', 'l_gea', 'e_meteoro', 'l_abisa', 'l_merlina'];
/** a third one: Parte II cats only, mixed elements and rarities */
const P2 = ['l_jonas', 'l_masamadre', 'l_madrenacar', 'e_cascada', 'e_brecha', 'e_prismarina', 'r_escafandra'];
function crewAt(level: number, stars: number, comp = COMP) {
  mem.clear();
  mem.set(SAVE_KEY, FIX);
  G.load();
  expect(G.loaded).toBe(true);
  G.s.ship.crew[G.s.ship.active].forEach((u, i) => {
    const c = G.s.cats.find((k) => k.uid === u)!;
    Object.assign(c, { species: comp[i % comp.length], level, stars, kos: 0, trait: 'leal', mutation: null });
  });
  (G.s.ext ??= {}).flightKit = { level: 1, ships: [G.s.ship.active] };
  (G.s.ext as Record<string, unknown>).astral = { fuel: 60, at: 0, kit: { level: 1, ships: [G.s.ship.active] } };
  G.recalc();
}
/** the spec without what differs per build by design (wall-clock seed, callback) */
const plain = (s: Spec) => JSON.parse(JSON.stringify({ ...s, seed: 0, onEnd: undefined }));
function withScale<T>(off: boolean, f: () => T): T {
  const was = SS.STORY_SCALE.off;
  SS.STORY_SCALE.off = off;
  try {
    return f();
  } finally {
    SS.STORY_SCALE.off = was;
  }
}
const ALL = Object.keys(STORY_BATTLES);
const PART2 = ALL.filter((id) => SS.storyBand(STORY_BATTLES[id]));
const PART1 = ALL.filter((id) => !SS.storyBand(STORY_BATTLES[id]));
const ratio = (s: Spec) => s.meta!.ep! / s.meta!.sp!;

describe('story bands: every Parte II battle has one, Parte I none', () => {
  it('bands', () => {
    expect(PART1.length).toBeGreaterThanOrEqual(5);
    expect(PART2.length).toBe(16);
    for (const id of PART2) expect(Number(STORY_BATTLES[id].mission.slice(1)), id).toBeGreaterThanOrEqual(31);
    for (const id of PART1) expect(Number(STORY_BATTLES[id].mission.slice(1)), id).toBeLessThan(31);
    expect(STORY_BATTLES.umbral_final.band).toBe('final');
    expect(SS.STORY_SCALE.mirrorMaxStars).toBe(5);
    for (const id of ['cielo_masamadre', 'ruptura_leviatan', 'umbral_correctores']) expect(STORY_BATTLES[id].band, id).toBe('jefe');
    // the floor never makes a fight easier than before the bands
    for (const t of Object.values(SS.STORY_SCALE.bands)) {
      expect(t.base).toBeGreaterThanOrEqual(1);
      expect(t.over).toBeGreaterThanOrEqual(0);
      expect(t.lvl).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('every enemy cat a Parte II battle lists fights', () => {
  it('its generated ship has a room per cat (Parte I keeps its archetype: covered by the bit-for-bit test below)', () => {
    crewAt(50, 3);
    for (const id of PART2) {
      const s = buildStoryBattle(id, () => undefined);
      const rooms = s.enemy.blueprint.modules.filter((m) => m.kind === 'catroom').length;
      expect(rooms, id).toBeGreaterThanOrEqual(STORY_BATTLES[id].enemyCats.length);
      expect(s.enemy.cats.length, id).toBe(STORY_BATTLES[id].enemyCats.length);
    }
  });
});

describe('≤ 50 invariance', () => {
  it('Parte I battles: the same spec (and the same fight) at any crew level, bit for bit', () => {
    for (const [lv, st] of [
      [30, 3],
      [50, 6],
      [80, 4],
      [100, 6],
    ]) {
      crewAt(lv, st);
      for (const id of PART1) {
        const before = withScale(true, () => plain(buildStoryBattle(id, () => undefined)));
        expect(plain(buildStoryBattle(id, () => undefined)), `${id} Nv${lv}`).toEqual(before);
      }
    }
    crewAt(50, 3);
    const id = 'event_grieta';
    const a = autoBattle(withScale(true, () => buildStoryBattle(id, () => undefined)), DIFFICULTY.hard, 4242, 30);
    const b = autoBattle(buildStoryBattle(id, () => undefined), DIFFICULTY.hard, 4242, 30);
    expect(b).toEqual(a);
  }, 120_000);

  it('the level term is the identity at Nv ≤ 50: same enemy level, ★1, same stats (Parte II only adds its band floor)', () => {
    const bases = Object.fromEntries(Object.entries(SS.STORY_SCALE.bands).map(([k, t]) => [k, t.base]));
    try {
      for (const t of Object.values(SS.STORY_SCALE.bands)) t.base = 1;
      for (const [lv, st] of [
        [10, 2],
        [30, 3],
        [38, 3],
        [50, 6],
      ]) {
        crewAt(lv, st);
        for (const id of PART2) {
          const before = withScale(true, () => plain(buildStoryBattle(id, () => undefined)));
          const now = plain(buildStoryBattle(id, () => undefined));
          expect(now, `${id} Nv${lv}`).toEqual(before);
          expect(now.meta.enemyLevel).toBeLessThanOrEqual(50);
          for (const c of now.enemy.cats) expect(c.stars).toBe(1);
        }
      }
    } finally {
      for (const [k, b] of Object.entries(bases)) SS.STORY_SCALE.bands[k as keyof typeof SS.STORY_SCALE.bands].base = b;
    }
    // with the floor: at ≤ 50 the enemy is the old one with its Poder × the band base, at every level (it follows
    // the crew, it never walls); the regular story band's base is 1, so those twelve fights are untouched at ≤ 50
    expect(SS.STORY_SCALE.bands.historia.base).toBe(1);
    for (const lv of [10, 30, 50]) {
      crewAt(lv, 3);
      for (const id of PART2) {
        const b = SS.STORY_SCALE.bands[SS.storyBand(STORY_BATTLES[id])!].base;
        const old = withScale(true, () => buildStoryBattle(id, () => undefined));
        const now = buildStoryBattle(id, () => undefined);
        expect(now.meta!.ep! / old.meta!.ep!, `${id} Nv${lv}`).toBeCloseTo(b, 9);
        expect(now.meta!.enemyLevel).toBeLessThanOrEqual(50);
        if (b === 1) expect(plain(now)).toEqual(plain(old));
      }
    }
  }, 120_000);
});

describe('regular story fights past Nv50', () => {
  it('only the shown enemy level follows you (no ★, no extra Poder): the same fight at Nv80 as without the bands', () => {
    crewAt(80, 4);
    const regular = PART2.filter((id) => SS.storyBand(STORY_BATTLES[id]) === 'historia');
    expect(regular.length).toBe(12);
    for (const id of regular) {
      const before = withScale(true, () => plain(buildStoryBattle(id, () => undefined)));
      const now = plain(buildStoryBattle(id, () => undefined));
      expect(now.meta.enemyLevel, id).toBe(80);
      for (const c of now.enemy.cats) {
        expect(c.level).toBe(80);
        expect(c.stars).toBe(1);
      }
      // levels past 20 change nothing in the sim (catShots thresholds are Nv10/Nv20): align them and it is the old spec
      now.meta.enemyLevel = before.meta.enemyLevel;
      now.enemy.cats.forEach((c: { level: number }, i: number) => (c.level = before.enemy.cats[i].level));
      expect(now, id).toEqual(before);
    }
    const id = 'cielo_almirante';
    expect(autoBattle(buildStoryBattle(id, () => undefined), DIFFICULTY.normal, 4242, 30)).toEqual(autoBattle(withScale(true, () => buildStoryBattle(id, () => undefined)), DIFFICULTY.normal, 4242, 30));
  }, 120_000);
});

describe('determinism (screen = estimate)', () => {
  it('the spec is a pure function of the save; the same spec + seed replays the same fight, step by step too', () => {
    crewAt(80, 4);
    for (const id of ['umbral_final', 'cielo_masamadre']) {
      const a = buildStoryBattle(id, () => undefined);
      expect(plain(buildStoryBattle(id, () => undefined))).toEqual(plain(a));
      const log = (out: string[]) => (b: { turn: number }, side: number, shot: string) => void out.push(`${b.turn}|${side}|${shot}`);
      const la: string[] = [];
      const lb: string[] = [];
      const r1 = autoBattle(a, DIFFICULTY.normal, 4343, 30, log(la));
      const it = autoBattleSteps(buildStoryBattle(id, () => undefined), DIFFICULTY.normal, 4343, 30, log(lb));
      let r2;
      for (;;) {
        const n = it.next();
        if (n.done) {
          r2 = n.value;
          break;
        }
      }
      expect(r2).toEqual(r1);
      expect(lb).toEqual(la);
      expect(la.length).toBeGreaterThan(0);
    }
  }, 120_000);
});

describe('monotonic in crew level', () => {
  it('a higher crew level never meets a weaker enemy (ratio, level, stars, hull, crew hp and damage)', () => {
    const LADDER: [number, number][] = [
      [30, 3],
      [50, 3],
      [51, 3],
      [60, 3],
      [70, 4],
      [80, 4],
      [90, 5],
      [100, 6],
      [100, 6],
    ];
    const prev = new Map<string, { r: number; lvl: number; st: number; hull: number; hp: number; atk: number; can: number }>();
    for (const [lv, st] of LADDER) {
      crewAt(lv, st);
      for (const id of PART2) {
        const s = buildStoryBattle(id, () => undefined);
        const cur = {
          r: ratio(s),
          lvl: s.meta!.enemyLevel!,
          st: s.enemy.cats[0].stars,
          hull: s.enemy.hpMul,
          hp: s.enemy.cats.reduce((a, c) => a + c.hp, 0),
          atk: s.enemy.cats.reduce((a, c) => a + c.atk, 0),
          can: s.enemy.cannonAtk,
        };
        // the mirrored ★ stop at ★5: ★6 is the player's alone
        for (const c of s.enemy.cats) expect(c.stars, `${id} Nv${lv}`).toBeLessThanOrEqual(SS.STORY_SCALE.mirrorMaxStars);
        if (lv === 100 && SS.STORY_SCALE.bands[SS.storyBand(STORY_BATTLES[id])!].stars) expect(cur.st, id).toBe(5);
        const p = prev.get(id);
        if (p) for (const k of Object.keys(cur) as (keyof typeof cur)[]) expect(cur[k], `${id} ${k} Nv${lv}`).toBeGreaterThanOrEqual(p[k] - 1e-9);
        prev.set(id, cur);
      }
    }
    // the curve itself, per band: flat to 50, rising to 100, flat after
    for (const band of ['historia', 'jefe', 'final'] as const) {
      let last = 0;
      for (let L = 1; L <= 120; L++) {
        const s = SS.scaleFor(band, L);
        expect(s.mul).toBeGreaterThanOrEqual(last);
        if (L <= 50) expect(s.mul).toBe(SS.STORY_SCALE.bands[band].base);
        last = s.mul;
      }
    }
  }, 120_000);
});

/** H63 «El Umbral» over fixed seeds (half aim normal, half hard; SINCRO off), the same autoplay as the estimate: wins of
 *  each balance crew (the band's target is their average; no reasonable crew should be walled) */
async function h63Wins(level: number, stars: number, seeds: number) {
  const out: number[] = [];
  for (const comp of [COMP, LEGEND, P2]) {
    crewAt(level, stars, comp);
    let w = 0;
    for (let i = 0; i < seeds; i++) {
      if (autoBattle(buildStoryBattle('umbral_final', () => undefined), i % 2 ? DIFFICULTY.hard : DIFFICULTY.normal, 4242 + i * 101, 30).won) w++;
      // yield between fights: minutes of synchronous sim starve the vitest worker's RPC («Timeout calling onTaskUpdate»)
      await new Promise((r) => setImmediate(r));
    }
    out.push(w);
  }
  return out;
}

describe('the bands hold for H63 (sim results, fixed seeds)', () => {
  it('PUERTAS CERRADAS: no wave crosses more than one wall here, on either side (the escort used to snipe your core)', () => {
    crewAt(60, 3);
    const sp = buildStoryBattle('umbral_final', () => undefined);
    const waves = [...sp.player.cats, ...sp.enemy.cats].flatMap((c) => [c.shot, c.ultimate]).filter((x) => x?.trajectory === 'wave');
    expect(waves.length).toBeGreaterThanOrEqual(4);
    for (const w of waves) expect(w!.pierce).toBeLessThanOrEqual(1);
    // only there: the same species keep their waves in another battle
    const other = buildStoryBattle('ruptura_disruptores', () => undefined);
    expect(other.enemy.cats.find((c) => c.catId === 'r_grafitera')!.shot.pierce).toBeGreaterThan(1);
  });

  // 3 crews × 16 seeds × 3 crew levels = 144 boss fights (~90 s per level on a calm machine): one test per level so each
  // gets its own generous budget on a busy machine; the assertions are exactly the same as one big test
  const N = 16;
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  // no crew walled, none walking over it
  const fair = (w: number[], tag: string) => {
    for (const x of w) expect(x, `${tag} ${w}`).toBeGreaterThanOrEqual(6);
    for (const x of w) expect(x, `${tag} ${w}`).toBeLessThanOrEqual(15);
  };
  it('the final boss: hard but fair at the expected crew (Nv60 ★3) whatever you own', async () => {
    const exp = await h63Wins(60, 3, N);
    console.log(`H63 wins /${N} (historia, legend, p2): Nv60 ${exp}`);
    // expected crew (Nv60 ★3): the three crews together around the final band (62–68 %, ± seed noise)
    expect(sum(exp), `Nv60 ${exp}`).toBeGreaterThanOrEqual(26);
    expect(sum(exp), `Nv60 ${exp}`).toBeLessThanOrEqual(36);
    fair(exp, 'Nv60');
  }, 900_000);
  // early (Nv30) and late (Nv80 ★4): still hard, still beatable — no wall below, no walkover above
  for (const [lv, st] of [
    [30, 3],
    [80, 4],
  ] as const) {
    it(`the final boss at Nv${lv} ★${st}: no wall below, no walkover above`, async () => {
      const r = await h63Wins(lv, st, N);
      console.log(`H63 wins /${N} (historia, legend, p2): Nv${lv} ${r}`);
      fair(r, `Nv${lv}`);
      expect(sum(r), `${r}`).toBeGreaterThanOrEqual(24);
      expect(sum(r), `${r}`).toBeLessThanOrEqual(38);
    }, 900_000);
  }
});
