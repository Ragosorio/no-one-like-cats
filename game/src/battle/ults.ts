/**
 * Signature ultimates of the top-rarity cats (legendary / mythic / secret): real sim effects, not just a
 * bigger ball. A cat is a card: the same cat does exactly the same thing on either side (enemy copies
 * included — Raijin, Singularidad, Merlina, Ignis… show up in enemy crews).
 *
 * Every ultimate is capped (fire(): 35% of the enemy structure, 40% Starfall / Singularidad, 15% vs a
 * boss) through Battle.budget, and the view stages each one from `ultfx` events (battle/ultFx.ts).
 *
 *   m_singular   SINGULARITY: EVENT HORIZON  black hole where the orb lands: rips up to 4x4 cells, hurls
 *                                           the rubble at the core, and keeps bending EVERY shot 2 turns
 *   l_astraprima STELLAR DECREE: STARFALL    a falling sun on the aimed spot + 4 meteors across the ship
 *   m_raijin     THUNDER GOD OVERDRIVE       7 railguns from the sky, each pierces 2 (then he overheats)
 *   s_noctis     THOUSAND FACES              one dagger slash through EVERY enemy cat + the dagger in the
 *                                           core ×1.5; the enemy aims at decoys (blinded) next turn
 *   l_merlina    THE END!                    writes FIN on 3 modules: they blow up 2 turns later (if
 *                                           Merlina is still standing)
 *   l_ignis      FORGE ERUPTION              3 lava columns burst up through the ship; wood nearby burns
 *   l_tronador   PERFECT STORM               soaks the whole enemy ship + 3 lightning bolts (Conducción)
 *   l_gea        HEART OF STONE              2 turns: your modules can't be destroyed
 *   l_abisa      ABYSSAL LURE                next enemy turn every shot of theirs is dragged into the sea;
 *                                           floods them a bit
 *   l_silvana    PRIMAL FOREST               every enemy cell Rooted; their cannons jammed 2 turns
 *   s_sonata     GRAN FINALE                 one chord hits EVERY enemy module
 *   s_lumen      ETERNAL EXPOSURE            repeats your crew's last shot, exactly
 *   s_eclipse    TOTAL ECLIPSE               enemy blinded 2 turns (no preview / no crits), your next shot ×2
 */
import type { Battle, BattleEvent, ShotPath, PathPoint } from './sim';
import { CAT_K } from './sim';
import { CELL } from './ship';
import type { CatState, ShotDef } from './types';

export interface UltCtx {
  side: 0 | 1;
  cat: CatState;
  shot: ShotDef;
  atk: number;
  origin: PathPoint;
  angle: number;
  power: number;
  wind: number;
  events: BattleEvent[];
}
export type UltFn = (b: Battle, o: UltCtx) => ShotPath[];

export function ultBudgetFrac(catId: string) {
  return catId === 'm_singular' || catId === 'l_astraprima' ? 0.4 : 0.35;
}

/** where the plain ult shot would land (x, y) */
function landing(b: Battle, o: UltCtx, shot = o.shot) {
  const p = b.buildPaths(shot, o.origin, o.angle, o.power, o.wind, o.side)[0];
  const i = p.impacts.length ? p.impacts[p.impacts.length - 1] : p.points.length - 1;
  return p.points[i];
}

function normal(b: Battle, o: UltCtx, shot: ShotDef = o.shot) {
  const paths = b.buildPaths(shot, o.origin, o.angle, o.power, o.wind, o.side);
  b.resolvePaths(o.side, shot, o.atk, paths, o.events);
  return paths;
}

function endOf(p: ShotPath) {
  return { path: 0, at: p.points.length - 1 };
}

/** world x range of a side's ship */
function shipSpan(b: Battle, side: number) {
  const s = b.sides[side];
  return { x0: s.setup.origin.x + CELL * 0.5, x1: s.setup.origin.x + (s.ship.cols - 0.5) * CELL };
}

export const ULTS: Record<string, UltFn> = {
  // ------------------------------------------------------------------ black hole
  m_singular(b, o) {
    const paths = normal(b, o);
    const p = paths[0];
    const raw = p.points[p.impacts.length ? p.impacts[p.impacts.length - 1] : p.points.length - 1];
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    // the hole opens where the orb ends — never off the field (a miss still tears the sky near their ship)
    const span = shipSpan(b, enemy);
    const end = { x: Math.max(span.x0 - 120, Math.min(span.x1 + 120, raw.x)), y: Math.max(120, Math.min(b.waterY - 40, raw.y)) };
    const { path, at } = endOf(p);
    o.events.push({ k: 'ultfx', fx: 'blackhole', side: enemy, x: end.x, y: end.y, path, at });
    // rip: cells within ~2 cells of the hole are swallowed (capped by the budget)
    let swallowed = 0;
    const cells = es.ship
      .cells()
      .map((c) => ({ c, d: Math.hypot(b.cellCenter(enemy, c.x, c.y).x - end.x, b.cellCenter(enemy, c.x, c.y).y - end.y) }))
      .filter((k) => k.d <= CELL * 2.3)
      .sort((a, z) => a.d - z.d)
      .slice(0, 16);
    for (const { c } of cells) {
      const dmg = b.cap(enemy, c.hp);
      if (dmg <= 0) break;
      b.hurtCell(enemy, c, dmg);
      swallowed += dmg;
      const destroyed = c.hp <= 0;
      if (destroyed) {
        const mid = c.module;
        es.ship.destroyCell(c.x, c.y);
        if (mid !== undefined) b.reportModule(enemy, mid, o.events, path, at);
      }
      o.events.push({ k: 'cell', side: enemy, cell: c, dmg, destroyed, path, at });
    }
    // the rubble is thrown at the core
    const core = es.ship.modules.find((m) => m.kind === 'core' && m.alive);
    if (core && swallowed > 0) {
      const cc = es.ship.moduleCells(core.id);
      for (const c of cc) {
        const dmg = b.cap(enemy, Math.round((swallowed * 0.3) / cc.length));
        if (dmg <= 0) continue;
        b.hurtCell(enemy, c, dmg);
        const destroyed = c.hp <= 0;
        if (destroyed) {
          es.ship.destroyCell(c.x, c.y);
          b.reportModule(enemy, core.id, o.events, path, at);
        }
        o.events.push({ k: 'cell', side: enemy, cell: c, dmg, destroyed, path, at });
      }
    }
    for (const ch of es.ship.collapse()) {
      o.events.push({ k: 'chunk', side: enemy, cells: ch, path, at });
      for (const c of ch) if (c.module !== undefined) b.reportModule(enemy, c.module, o.events, path, at);
    }
    // the hole stays open 2 turns and bends EVERY projectile that passes (both sides)
    b.wells.push({ x: end.x, y: Math.min(end.y, b.waterY - 60), r: 320, k: 2300, turns: 2, owner: o.side, kind: 'hole' });
    return paths;
  },

  // ------------------------------------------------------------------ the sun falls
  l_astraprima(b, o) {
    const enemy = 1 - o.side;
    const sun: ShotDef = { ...o.shot, trajectory: 'meteor', radius: Math.max(o.shot.radius, CELL * 3.6), pierce: 2, power: o.shot.power * 0.7 };
    const paths = b.buildPaths(sun, o.origin, o.angle, o.power, o.wind, o.side);
    const end = paths[0].points[paths[0].points.length - 1];
    const span = shipSpan(b, enemy);
    const small: ShotDef = { ...o.shot, id: 'starfall_shard', trajectory: 'ballistic', radius: CELL * 1.4, pierce: 0, power: o.shot.power * 0.22, gravityScale: 2 };
    const extra: ShotPath[] = [];
    for (let i = 0; i < 4; i++) {
      const x = span.x0 + ((i + 0.5) / 4) * (span.x1 - span.x0) + (b.rng.next() - 0.5) * CELL;
      extra.push(b.integrate(small, { x: x + (o.side === 0 ? -40 : 40), y: -260 - i * 90 }, Math.PI / 2 + (o.side === 0 ? 0.04 : -0.04), 480, 0, o.side));
    }
    o.events.push({ k: 'ultfx', fx: 'sun', side: enemy, x: end.x, y: end.y, path: 0, at: 0 });
    b.resolvePaths(o.side, sun, o.atk, paths, o.events);
    b.resolvePaths(o.side, small, o.atk, extra, o.events, 1);
    return [...paths, ...extra];
  },

  // ------------------------------------------------------------------ 7 railguns
  m_raijin(b, o) {
    const enemy = 1 - o.side;
    const tgt = landing(b, o);
    const span = shipSpan(b, enemy);
    const rail: ShotDef = { ...o.shot, trajectory: 'beam', projectiles: 1, pierce: 2, radius: CELL * 1.1, power: o.shot.power * 0.32, gravityScale: 0.02, windScale: 0 };
    const paths: ShotPath[] = [];
    const tx = Math.max(span.x0, Math.min(span.x1, tgt.x));
    for (let i = 0; i < 7; i++) {
      const off = (i - 3) * CELL * 1.25;
      const sx = tx + off * 0.35 + (o.side === 0 ? -520 : 520);
      const sy = -120 - Math.abs(i - 3) * 30;
      const ex = tx + off;
      const ey = b.waterY - CELL * 3;
      paths.push(b.integrate(rail, { x: sx, y: sy }, Math.atan2(ey - sy, ex - sx), 1100, 0, o.side));
    }
    o.events.push({ k: 'ultfx', fx: 'thunder', side: enemy, x: tx, y: 200, n: 7, path: 0, at: 0 });
    b.resolvePaths(o.side, rail, o.atk, paths, o.events);
    // SOBRECARGA: the thunder god overheats (2 turns stunned) — his limitation, on either side
    o.cat.stunned = Math.max(o.cat.stunned, 3);
    o.events.push({ k: 'info', text: 'RAIJIN SE SOBRECALIENTA', x: b.roomCenter(o.side, o.cat.room).x, y: b.roomCenter(o.side, o.cat.room).y - 120, color: 0xffd400, path: 0, at: paths[0].points.length - 1 });
    return paths;
  },

  // ------------------------------------------------------------------ one slash through every cat
  s_noctis(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const dagger: ShotDef = { ...o.shot, trajectory: 'homing', projectiles: 1, power: o.shot.power * 0.6 };
    const paths = b.buildPaths(dagger, o.origin, o.angle, o.power, o.wind, o.side);
    const p = paths[0];
    const { path, at } = endOf(p);
    const alive = es.cats.filter((c) => !c.ko && !b.isFlying(c));
    o.events.push({ k: 'ultfx', fx: 'slash', side: enemy, x: b.shipCenter(enemy).x, y: b.shipCenter(enemy).y, n: alive.length, path, at: 0 });
    for (const c of alive) b.hitCat(c, Math.round(o.atk * o.shot.power * 0.42 * CAT_K), o.events, path, Math.min(at, 6), o.cat.def.elements[0] ?? 'magic', true);
    // the real dagger goes for the core (×1.5)
    const core = es.ship.modules.find((m) => m.kind === 'core' && m.alive);
    b.resolvePaths(o.side, dagger, o.atk * (core ? 1.5 : 1), paths, o.events);
    es.buffs.blind = Math.max(es.buffs.blind, 1);
    return paths;
  },

  // ------------------------------------------------------------------ FIN
  l_merlina(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const paths = normal(b, o, { ...o.shot, power: o.shot.power * 0.25 });
    const { path, at } = endOf(paths[0]);
    const value: Record<string, number> = { core: 9, catroom: 7, cannon: 6, shield: 6, arcane: 5, powder: 6, mast: 3, engine: 3 };
    const pool = es.ship.modules
      .filter((m) => m.alive && es.ship.moduleCells(m.id).length && !es.buffs.fin.some((f) => f.module === m.id))
      .sort((a, z) => (value[z.kind] ?? 1) - (value[a.kind] ?? 1));
    const marks = pool.slice(0, 3);
    const cellsN = marks.reduce((a, m) => a + es.ship.moduleCells(m.id).length, 0) || 1;
    const allowed = b.budget?.left ?? Infinity;
    const per = Math.max(1, Math.round(Math.min(o.atk * o.shot.power * 0.55 * 0.95, allowed / cellsN)));
    if (b.budget) b.budget.left = Math.max(0, b.budget.left - per * cellsN);
    for (const m of marks) {
      es.buffs.fin.push({ module: m.id, turns: 2, dmg: per, by: o.cat.def.uid });
      const c = b.roomCenter(enemy, m.id);
      o.events.push({ k: 'ultfx', fx: 'fin', side: enemy, x: c.x, y: c.y, n: 2, w: m.id, path, at });
    }
    return paths;
  },

  // ------------------------------------------------------------------ lava columns
  l_ignis(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const tgt = landing(b, o);
    const span = shipSpan(b, enemy);
    const tx = Math.max(span.x0 + CELL, Math.min(span.x1 - CELL, tgt.x));
    const col: ShotDef = { ...o.shot, id: 'eruption', trajectory: 'beam', projectiles: 1, pierce: 4, radius: CELL * 1.2, power: o.shot.power * 0.45, gravityScale: 0.01, windScale: 0, statuses: [{ id: 'burning', turns: 2 }] };
    const paths = [-1.7, 0, 1.7].map((k) => b.integrate(col, { x: tx + k * CELL, y: b.waterY + 40 }, -Math.PI / 2, 900, 0, o.side));
    o.events.push({ k: 'ultfx', fx: 'eruption', side: enemy, x: tx, y: b.waterY, n: 3, path: 0, at: 0 });
    b.resolvePaths(o.side, col, o.atk, paths, o.events);
    // all wood within 3 cells catches fire
    const lit = es.ship.cells().filter((c) => (c.material === 'wood' || c.material === 'canvas') && !c.status.wet && Math.abs(b.cellCenter(enemy, c.x, c.y).x - tx) <= CELL * 3);
    for (const c of lit) c.status.burning = Math.max(c.status.burning ?? 0, 2);
    if (lit.length) o.events.push({ k: 'status', side: enemy, cells: lit, status: 'burning' });
    return paths;
  },

  // ------------------------------------------------------------------ the perfect storm
  l_tronador(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    o.events.push({ k: 'ultfx', fx: 'storm', side: enemy, x: b.shipCenter(enemy).x, y: 120, n: 3, path: 0, at: 0 });
    b.wetCells(enemy, es.ship.cells(), o.events);
    const bolt: ShotDef = { ...o.shot, trajectory: 'beam', projectiles: 1, pierce: 0, radius: CELL * 1.1, power: o.shot.power * 0.5, gravityScale: 0.05, windScale: 0 };
    const cells = es.ship.cells();
    const paths: ShotPath[] = [];
    for (let i = 0; i < 3 && cells.length; i++) {
      const c = cells[Math.floor(b.rng.next() * cells.length)];
      const p = b.cellCenter(enemy, c.x, c.y);
      paths.push(b.integrate(bolt, { x: p.x + (i - 1) * 30, y: -120 }, Math.atan2(p.y + 120, -(i - 1) * 30), 1300, 0, o.side));
    }
    b.resolvePaths(o.side, bolt, o.atk, paths, o.events);
    return paths;
  },

  // ------------------------------------------------------------------ support ultimates
  l_gea(b, o) {
    const s = b.sides[o.side];
    s.buffs.stone = Math.max(s.buffs.stone, 2);
    const c = b.shipCenter(o.side);
    o.events.push({ k: 'ultfx', fx: 'stone', side: o.side, x: c.x, y: c.y, path: 0, at: 0 });
    return normal(b, o);
  },
  l_abisa(b, o) {
    const enemy = 1 - o.side;
    const own = b.sides[o.side];
    const edge = own.setup.flip ? own.setup.origin.x - 220 : own.setup.origin.x + own.ship.cols * CELL + 220;
    b.wells.push({ x: edge, y: b.waterY + 60, r: 760, k: 2600, turns: 1, owner: o.side, affects: enemy, kind: 'lure' });
    o.events.push({ k: 'ultfx', fx: 'lure', side: o.side, x: edge, y: b.waterY, path: 0, at: 0 });
    const es = b.sides[enemy];
    es.flood = Math.min(0.95, es.flood + 0.2);
    o.events.push({ k: 'flood', side: enemy, flood: es.flood, breaches: es.breaches });
    return normal(b, o);
  },
  l_silvana(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const cells = es.ship.cells();
    for (const c of cells) if (!c.status.burning) c.status.rooted = Math.max(c.status.rooted ?? 0, 1);
    for (const m of es.ship.modules) if (m.kind === 'cannon') m.disabled = Math.max(m.disabled, 2);
    o.events.push({ k: 'ultfx', fx: 'forest', side: enemy, x: b.shipCenter(enemy).x, y: b.shipCenter(enemy).y, path: 0, at: 0 });
    o.events.push({ k: 'status', side: enemy, cells, status: 'rooted' });
    return normal(b, o);
  },
  s_sonata(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const paths = normal(b, o, { ...o.shot, power: o.shot.power * 0.3 });
    const { path, at } = endOf(paths[0]);
    o.events.push({ k: 'ultfx', fx: 'chord', side: enemy, x: b.shipCenter(enemy).x, y: b.shipCenter(enemy).y, path, at });
    const note: ShotDef = { ...o.shot, id: 'finale_note', radius: CELL * 0.8, power: o.shot.power * 0.32, statuses: [] };
    for (const m of es.ship.modules) {
      if (!m.alive || !es.ship.moduleCells(m.id).length) continue;
      const c = b.roomCenter(enemy, m.id);
      b.resolveImpact(o.side, note, o.atk, c.x, c.y, o.events, path, at, true);
    }
    return paths;
  },
  s_lumen(b, o) {
    const last = b.lastShot[o.side];
    o.events.push({ k: 'ultfx', fx: 'flash', side: o.side, x: o.origin.x, y: o.origin.y, path: 0, at: 0 });
    if (!last) return normal(b, o, { ...o.shot, power: o.shot.power * 1.5 });
    const paths = b.buildPaths(last.shot, last.origin, last.angle, last.power, o.wind, o.side);
    b.resolvePaths(o.side, last.shot, last.atk, paths, o.events);
    return paths;
  },
  s_eclipse(b, o) {
    const enemy = 1 - o.side;
    b.sides[enemy].buffs.blind = Math.max(b.sides[enemy].buffs.blind, 2);
    b.sides[o.side].buffs.empower = 1;
    o.events.push({ k: 'ultfx', fx: 'eclipse', side: enemy, x: 960, y: 220, path: 0, at: 0 });
    return normal(b, o);
  },
};
