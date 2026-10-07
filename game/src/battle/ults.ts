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
 *
 * HEROICOS (El Podio's champions' prizes) — 35% cap, bosses 15%:
 *   h_zarpa      BROADSIDE OF A HUNDRED BLADES  one flaming slash through EVERY enemy cat (burning) + a cut in
 *                                               every cabin; ★3 they burn longer, ★5 the slash comes back (½)
 *   h_granbigote YOKOZUNA EARTHQUAKE            his rock pierces +1 and the quake CRACKS the whole enemy keel (never
 *                                               breaks it: Maldito ×1.5 for 2 turns); his own ship is stone until his next turn
 *   h_valquiria  VALKYRIE'S JUDGMENT            a spear from the sky straight down a whole column (pierces 8), the
 *                                               column soaked first so the lightning CONDUCTS; ★5 a 2nd spear on the core
 *   h_nekomante  FORBIDDEN PAGE                 curses the 3 best modules (×1.5) and STEALS 40% of every enemy cat's
 *                                               meter, shared among his own crew
 * DIVINOS (the "broken" ones) — once per battle, their own caps:
 *   d_horizonte  ZERO POINT                     a black hole opens ABOVE their ship and stays 3 turns: swallows the
 *                                               nearest cells (25%), then more at each of your turns (8%) and drains
 *                                               25% meter from their cats; THEIR shots that cross it vanish
 *   d_solcaido   SUNDOWN                        the sun comes down on the ship center (huge blast, 42%), the whole ship
 *                                               catches fire (wet → steam), cats burn and are blinded; the sun stays 2
 *                                               turns burning what's under it (6% a turn)
 *   d_milvidas   SENJIN                         seven shadow cuts to EVERY enemy cat (each eats a shield), never more
 *                                               than 70% of a cat's life (bosses 25%), and a cut in every cabin
 *   d_bigbang    BIG BANG                       HALF the enemy ship (the half the note lands on) blows up at once (45%,
 *                                               the core holds at 1 hp); cats in that half stunned; breaches flood
 * Per-turn effects of the divines that stay (horizon / sun) run in ultTicks() at the start of the owner's turn.
 *
 * LEGENDARIOS DEL MULTIVERSO (Parte 2, the six primordials of the new elements) — 35% cap, bosses 15%;
 * ★5 = twice per battle (content star5, battle/catShots.ts):
 *   l_boreas     AURORA ZERO            3 icicles (×0.7) + the aurora freezes EVERY enemy cannon (no volley next turn)
 *                                       and frosts their deck: frozen cells shatter ×2 under a cannonball / rock,
 *                                       ×1.75 under fire (CHOQUE TÉRMICO); ★3 shields and the summoning room freeze too
 *   l_aurea      HALO JUDGEMENT         a cathedral of 5 light beams from a halo over their ship, each piercing 6 rows;
 *                                       CEGADO 3 (Luz) + DESLUMBRADOS their next turn (no crits, cannons aim blind); ★3 6 beams
 *   l_medianoche ENDLESS MIDNIGHT       3 invisible shadows (×0.8, stab EVERY cat) and the night stays: this turn and the
 *                                       next 2, every shot of his side (cannons too) flies invisible and stabs the
 *                                       nearest cat from behind (multiverso.ts); ★3 one more turn
 *   l_headliner  WALL OF SOUND          one flat shockwave per deck through every wall (cabins crossed are hit) and the
 *                                       chord reaches EVERY enemy cat: all stunned, except sound cats and SORDOS; ★3 4 waves
 *   l_nadie      DEAD CHANNEL           "nadie te ve" (no projectile): a 2-column stripe of their ship is ERASED (BORRADO,
 *                                       never repaired; the core and the cells holding the ship together stay at 1 hp),
 *                                       and it eats every shield: bubble, shield, cat shields, spare lives; ★3 3 columns
 *   l_cronos     ETERNAL SECOND         TIME STOP (multiverso.ts) with its set piece: sepia, the clock stops
 */
import type { Battle, BattleEvent, ShotPath, PathPoint } from './sim';
import { CAT_K, DMG_K } from './sim';
import { CELL } from './ship';
import type { Cell } from './ship';
import type { CatState, ElementId, ShotDef } from './types';
import type { ShipModel } from './ship';
import { p2Blind, p2CanStop, p2Deaf, p2Heard, p2Night, p2SetNight } from './multiverso';

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

/** structure an ultimate may erase in one go (fraction of the victim's starting structure; bosses: 15% in sim.fire) */
export function ultBudgetFrac(catId: string, stars = 1) {
  switch (catId) {
    case 'm_singular':
    case 'l_astraprima':
      return 0.4;
    case 'd_bigbang':
      return stars >= 5 ? 0.5 : 0.45;
    case 'd_solcaido':
      return 0.42;
    case 'd_horizonte':
    case 'd_milvidas':
      return 0.25;
    default:
      return 0.35;
  }
}

const FLAMMABLE = new Set(['wood', 'bone', 'canvas']);
/** a capped structure hit on one cell (destroy + module report + view event); returns the damage dealt */
function cut(b: Battle, side: number, c: Cell, raw: number, ev: BattleEvent[], path: number, at: number) {
  const dmg = b.cap(side, Math.max(0, Math.round(raw)));
  if (dmg <= 0) return 0;
  b.hurtCell(side, c, dmg);
  const destroyed = c.hp <= 0;
  if (destroyed) {
    const mid = c.module;
    b.sides[side].ship.destroyCell(c.x, c.y);
    if (mid !== undefined) b.reportModule(side, mid, ev, path, at);
  }
  ev.push({ k: 'cell', side, cell: c, dmg, destroyed, path, at });
  return dmg;
}
function collapse(b: Battle, side: number, ev: BattleEvent[], path: number, at: number) {
  for (const ch of b.sides[side].ship.collapse()) {
    ev.push({ k: 'chunk', side, cells: ch, path, at });
    for (const c of ch) if (c.module !== undefined) b.reportModule(side, c.module, ev, path, at);
  }
}
/** the element a cat hits other cats with (its shot's element, as the sim knows it) */
function catEl(c: CatState): ElementId {
  return c.def.shot.element ?? c.def.elements[0] ?? 'neutral';
}
const isBossVs = (b: Battle, side: number) => b.cfg.boss?.side === side;
/** shrink the running ultimate budget (a divine's own cast cap vs a boss) */
function capBudget(b: Battle, side: number, frac: number) {
  if (!b.budget || b.budget.side !== side) return;
  b.budget.left = Math.min(b.budget.left, Math.round((b.sides[side].ship.initialMax?.[0] ?? 0) * frac));
}
/** top of a side's ship (world y) */
function shipTop(b: Battle, side: number) {
  return b.sides[side].setup.origin.y;
}

const clamp = (v: number, a: number, z: number) => Math.max(a, Math.min(z, v));
/** would removing `c` leave any OTHER cell hanging (not linked to the bottom row)? (ship.collapse rule) */
function holdsShip(ship: ShipModel, c: Cell) {
  const seen = new Set<Cell>([c]);
  const stack: Cell[] = [];
  for (let x = 0; x < ship.cols; x++) {
    const k = ship.get(x, ship.rows - 1);
    if (k && k !== c) {
      seen.add(k);
      stack.push(k);
    }
  }
  while (stack.length) {
    const k = stack.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = ship.get(k.x + dx, k.y + dy);
      if (n && !seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return ship.cells().some((k) => !seen.has(k));
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

  // ================================================================== HEROICOS
  // ------------------------------------------------------------------ one slash for every cat aboard
  h_zarpa(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const stars = o.cat.def.stars;
    const alive = es.cats.filter((c) => !c.ko && !b.isFlying(c));
    const ctr = b.shipCenter(enemy);
    o.events.push({ k: 'ultfx', fx: 'cutlass', side: enemy, x: ctr.x, y: ctr.y, n: alive.length, path: 0, at: 0 });
    const paths = normal(b, o, { ...o.shot, power: o.shot.power * 0.5 });
    const { path, at } = endOf(paths[0]);
    const t = Math.min(at, 6);
    for (const k of stars >= 5 ? [1, 0.5] : [1]) {
      for (const c of alive) {
        if (!c.ko) {
          b.hitCat(c, Math.round(o.atk * o.shot.power * 0.3 * k * CAT_K), o.events, path, t, 'fire', true);
          if (stars >= 3 && !c.ko && c.fx.burning > 0) c.fx.burning += 1;
        }
        // the blade goes through its cabin too
        for (const cell of es.ship.moduleCells(c.room)) cut(b, enemy, cell, o.atk * o.shot.power * 0.12 * k * DMG_K, o.events, path, t);
      }
    }
    collapse(b, enemy, o.events, path, t);
    return paths;
  },

  // ------------------------------------------------------------------ the earth bows
  h_granbigote(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const stars = o.cat.def.stars;
    o.events.push({ k: 'ultfx', fx: 'yokozuna', side: o.side, x: b.shipCenter(o.side).x, y: b.shipCenter(o.side).y, path: 0, at: 0 });
    const paths = normal(b, o, { ...o.shot, power: o.shot.power * 0.5 });
    const { path, at } = endOf(paths[0]);
    // the lowest cell(s) of every column are the keel (ships are not rectangles)
    const depth = stars >= 3 ? 2 : 1;
    const byCol = new Map<number, Cell[]>();
    for (const c of es.ship.cells()) {
      const list = byCol.get(c.x) ?? [];
      list.push(c);
      byCol.set(c.x, list);
    }
    const quake: Cell[] = [];
    for (const list of byCol.values()) {
      list.sort((a, z) => z.y - a.y);
      quake.push(...list.slice(0, depth));
    }
    o.events.push({ k: 'ultfx', fx: 'quake', side: enemy, x: b.shipCenter(enemy).x, y: b.waterY - CELL, n: quake.length, path, at });
    // the quake CRACKS the keel (it never breaks it by itself): every keel cell is left Maldito (×1.5) for 2 turns,
    // so the next hits down there bring the ship down
    const cracked: Cell[] = [];
    for (const c of quake) {
      if (c.hp <= 0) continue;
      cut(b, enemy, c, Math.min(o.atk * o.shot.power * 0.25 * DMG_K, c.hp - 1), o.events, path, at);
      if (c.hp > 0) {
        c.status.cursed = Math.max(c.status.cursed ?? 0, 2);
        cracked.push(c);
      }
    }
    if (cracked.length) o.events.push({ k: 'status', side: enemy, cells: cracked, status: 'cursed' });
    collapse(b, enemy, o.events, path, at);
    // his own ship holds like a sumo wrestler: its modules can't fall until his next turn
    const own = b.sides[o.side];
    own.buffs.stone = Math.max(own.buffs.stone, stars >= 5 ? 2 : 1);
    return paths;
  },

  // ------------------------------------------------------------------ the spear from Valhalla
  h_valquiria(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const stars = o.cat.def.stars;
    const span = shipSpan(b, enemy);
    const tgt = landing(b, o);
    // the spear picks the cabin / core column closest to where she aimed
    const mods = es.ship.modules.filter((m) => m.alive && (m.kind === 'catroom' || m.kind === 'core') && es.ship.moduleCells(m.id).length);
    const near = mods.map((m) => b.roomCenter(enemy, m.id).x).sort((a, z) => Math.abs(a - tgt.x) - Math.abs(z - tgt.x))[0];
    const tx = Math.max(span.x0, Math.min(span.x1, near ?? tgt.x));
    const spear: ShotDef = { ...o.shot, trajectory: 'beam', projectiles: 1, pierce: 8 + (stars >= 3 ? 2 : 0), radius: CELL * 1.1, power: o.shot.power * 0.45, gravityScale: 0.02, windScale: 0 };
    const xs = [tx];
    if (stars >= 5) {
      const core = es.ship.modules.find((m) => m.kind === 'core' && m.alive);
      if (core) xs.push(b.roomCenter(enemy, core.id).x);
    }
    // the storm soaks the column first: the lightning CONDUCTS through all of it
    const soaked = es.ship.cells().filter((c) => xs.some((x) => Math.abs(b.cellCenter(enemy, c.x, c.y).x - x) <= CELL * 0.75));
    b.wetCells(enemy, soaked, o.events);
    o.events.push({ k: 'ultfx', fx: 'valkyrie', side: enemy, x: tx, y: 160, n: xs.length, path: 0, at: 0 });
    const paths = xs.map((x) => b.integrate(spear, { x: x + (o.side === 0 ? -50 : 50), y: -320 }, Math.atan2(b.waterY + 320, o.side === 0 ? 50 : -50), 1400, 0, o.side));
    b.resolvePaths(o.side, spear, o.atk, paths, o.events);
    return paths;
  },

  // ------------------------------------------------------------------ the forbidden page
  h_nekomante(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const stars = o.cat.def.stars;
    o.events.push({ k: 'ultfx', fx: 'grimoire', side: enemy, x: b.shipCenter(enemy).x, y: b.shipCenter(enemy).y, path: 0, at: 0 });
    const paths = normal(b, o, { ...o.shot, power: o.shot.power * 0.6 });
    const { path, at } = endOf(paths[0]);
    const value: Record<string, number> = { core: 9, catroom: 7, cannon: 6, shield: 6, arcane: 5, powder: 6, mast: 3, engine: 3 };
    const marks = es.ship.modules
      .filter((m) => m.alive && es.ship.moduleCells(m.id).length)
      .sort((a, z) => (value[z.kind] ?? 1) - (value[a.kind] ?? 1))
      .slice(0, stars >= 3 ? 4 : 3);
    const cursed: Cell[] = [];
    for (const m of marks)
      for (const c of es.ship.moduleCells(m.id)) {
        c.status.cursed = Math.max(c.status.cursed ?? 0, 2);
        cursed.push(c);
      }
    if (cursed.length) o.events.push({ k: 'status', side: enemy, cells: cursed, status: 'cursed' });
    // the grimoire steals their spells: meter out of every enemy cat, shared among his crew
    const frac = stars >= 5 ? 0.6 : 0.4;
    let stolen = 0;
    for (const c of es.cats) {
      if (c.ko) continue;
      const take = Math.min(c.ultCharge, frac);
      c.ultCharge -= take;
      stolen += take;
    }
    const allies = b.sides[o.side].cats.filter((c) => !c.ko && c !== o.cat);
    for (const a of allies) a.ultCharge = Math.min(1, a.ultCharge + stolen / allies.length);
    o.events.push({ k: 'ultfx', fx: 'drain', side: enemy, x: b.shipCenter(enemy).x, y: shipTop(b, enemy) - 80, n: Math.round(frac * 100), w: allies.length ? 1 : 0, path, at });
    return paths;
  },

  // ================================================================== DIVINOS
  // ------------------------------------------------------------------ nothing escapes
  d_horizonte(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const stars = o.cat.def.stars;
    const boss = isBossVs(b, enemy);
    if (boss) capBudget(b, enemy, 0.06);
    const span = shipSpan(b, enemy);
    const tgt = landing(b, o);
    // the hole opens ON their deck (half in, half out), over the spot the orb was going to land (never at the very tip)
    const w = span.x1 - span.x0;
    const hx = Math.max(span.x0 + w * 0.25, Math.min(span.x1 - w * 0.25, tgt.x));
    const col = es.ship.cells().filter((c) => Math.abs(b.cellCenter(enemy, c.x, c.y).x - hx) <= CELL * 1.5);
    const deck = col.length ? Math.min(...col.map((c) => b.cellCenter(enemy, c.x, c.y).y)) : shipTop(b, enemy);
    const hy = Math.max(110, deck);
    o.events.push({ k: 'ultfx', fx: 'horizon', side: enemy, x: hx, y: hy, path: 0, at: 0 });
    const orb = b.integrate({ ...o.shot, trajectory: 'orb', power: o.shot.power * 0.3, statuses: [] }, o.origin, o.angle, o.power, o.wind, o.side);
    // the orb doesn't land: it BECOMES the hole (its flight ends where the hole opens)
    const near0 = orb.points.findIndex((pt) => Math.hypot(pt.x - hx, pt.y - hy) < CELL * 2);
    if (near0 > 0) orb.points = orb.points.slice(0, near0 + 1);
    orb.points.push({ x: hx, y: hy });
    orb.impacts = [];
    orb.owners = [];
    const at = orb.points.length - 1;
    o.events.push({ k: 'ultfx', fx: 'horizonOpen', side: enemy, x: hx, y: hy, path: 0, at });
    const near = es.ship
      .cells()
      .map((c) => ({ c, d: Math.hypot(b.cellCenter(enemy, c.x, c.y).x - hx, b.cellCenter(enemy, c.x, c.y).y - hy) }))
      .filter((k) => k.d <= CELL * 3.8)
      .sort((a, z) => a.d - z.d)
      .slice(0, 18);
    for (const { c } of near) if (!cut(b, enemy, c, c.hp, o.events, 0, at)) break;
    collapse(b, enemy, o.events, 0, at);
    b.wells.push({
      x: hx,
      y: hy,
      r: 360,
      k: 2600,
      turns: stars >= 3 ? 4 : 3,
      owner: o.side,
      kind: 'horizon',
      hidden: true,
      eat: CELL * 1.8,
      tick: { frac: boss ? 0.03 : 0.08, cells: 6 + (stars >= 5 ? 2 : 0), atk: 0, drain: 0.25 },
    });
    return [orb];
  },

  // ------------------------------------------------------------------ the sun comes down
  d_solcaido(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const stars = o.cat.def.stars;
    const ctr = b.shipCenter(enemy);
    o.events.push({ k: 'ultfx', fx: 'sundown', side: enemy, x: ctr.x, y: ctr.y, path: 0, at: 0 });
    const sun: ShotDef = { ...o.shot, trajectory: 'ballistic', projectiles: 1, radius: CELL * 4.2, pierce: 0, power: o.shot.power * 0.55, catMul: 0.1, gravityScale: 2.4, windScale: 0, statuses: [{ id: 'burning', turns: 2 }] };
    const p = b.integrate(sun, { x: ctr.x + (o.side === 0 ? -30 : 30), y: -520 }, Math.PI / 2 + (o.side === 0 ? -0.03 : 0.03), 420, 0, o.side);
    const { path, at } = endOf(p);
    o.events.push({ k: 'ultfx', fx: 'sunImpact', side: enemy, x: ctr.x, y: ctr.y, path, at });
    b.resolvePaths(o.side, sun, o.atk, [p], o.events);
    // everything under the sun catches fire (6 cells around the center, not inside the cabins: the cats burn on
    // their own); what was wet anywhere boils
    const lit: Cell[] = [];
    for (const c of es.ship.cells()) {
      const p = b.cellCenter(enemy, c.x, c.y);
      if (c.status.wet) {
        delete c.status.wet;
        c.status.steam = 2;
      } else if (FLAMMABLE.has(c.material) && Math.hypot(p.x - ctr.x, p.y - ctr.y) <= CELL * 6 && (c.module === undefined || es.ship.modules[c.module]?.kind !== 'catroom')) {
        c.status.burning = Math.max(c.status.burning ?? 0, 2);
        lit.push(c);
      }
    }
    if (lit.length) o.events.push({ k: 'status', side: enemy, cells: lit, status: 'burning' });
    for (const c of es.cats) if (!c.ko && !b.isFlying(c)) b.hitCat(c, Math.round(o.atk * o.shot.power * 0.08 * CAT_K), o.events, path, at, 'fire', true);
    // the glare: Luz already leaves them CEGADO (multiverso.ts, 3 turns for an ultimate); ★3 also ECLIPSADO
    // (no criticals, the AI aims far worse) for their next turn
    if (stars >= 3) es.buffs.blind = Math.max(es.buffs.blind, 1);
    b.wells.push({
      x: ctr.x,
      y: shipTop(b, enemy) - CELL * 0.6,
      r: 1,
      k: 0,
      turns: stars >= 5 ? 3 : 2,
      owner: o.side,
      kind: 'sun',
      hidden: true,
      tick: { frac: isBossVs(b, enemy) ? 0.03 : 0.06, cells: 4, atk: o.atk * o.shot.power * 0.15 },
    });
    return [p];
  },

  // ------------------------------------------------------------------ a thousand cuts
  d_milvidas(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const stars = o.cat.def.stars;
    const alive = es.cats.filter((c) => !c.ko && !b.isFlying(c));
    const cuts = stars >= 3 ? 9 : 7;
    o.events.push({ k: 'ultfx', fx: 'senjin', side: enemy, x: b.shipCenter(enemy).x, y: b.shipCenter(enemy).y, n: cuts, path: 0, at: 0 });
    const paths = normal(b, o, { ...o.shot, trajectory: 'homing', projectiles: 1, power: o.shot.power * 0.3 });
    const { path, at } = endOf(paths[0]);
    const t = Math.min(at, 6);
    const el = catEl(o.cat);
    const boss = isBossVs(b, enemy);
    for (const c of alive) {
      // never a K.O. on its own: at most 70% of a cat's life (★5 85%, the boss captain 25%)
      const capHp = c.maxHp * (boss ? 0.25 : stars >= 5 ? 0.85 : 0.7);
      const perCut = Math.round(o.atk * o.shot.power * 0.15 * CAT_K);
      let lost = 0;
      for (let k = 0; k < cuts && !c.ko && lost < capHp; k++) {
        const before = c.hp;
        const lives = c.lives;
        b.hitCat(c, Math.max(1, Math.min(perCut, Math.round(capHp - lost))), o.events, path, t, el, true);
        lost += c.lives < lives ? capHp : Math.max(0, before - c.hp);
      }
      for (const cell of es.ship.moduleCells(c.room)) cut(b, enemy, cell, o.atk * o.shot.power * 0.1 * DMG_K, o.events, path, t);
    }
    collapse(b, enemy, o.events, path, t);
    return paths;
  },

  // ------------------------------------------------------------------ in the beginning there was a cat
  d_bigbang(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const stars = o.cat.def.stars;
    const ctr = b.shipCenter(enemy);
    const span = shipSpan(b, enemy);
    o.events.push({ k: 'ultfx', fx: 'bigbang', side: enemy, x: ctr.x, y: ctr.y, path: 0, at: 0 });
    const note = b.buildPaths({ ...o.shot, power: o.shot.power * 0.25, statuses: [] }, o.origin, o.angle, o.power, o.wind, o.side)[0];
    const end = note.points[note.impacts.length ? note.impacts[note.impacts.length - 1] : note.points.length - 1];
    // the half the note lands on (a miss: the half nearer to where it fell)
    const left = end.x < ctr.x;
    const { path, at } = endOf(note);
    note.impacts = [];
    note.owners = [];
    o.events.push({ k: 'ultfx', fx: 'bigbangBoom', side: enemy, x: left ? (span.x0 + ctr.x) / 2 : (span.x1 + ctr.x) / 2, y: ctr.y, n: left ? 0 : 1, w: Math.round((span.x1 - span.x0) / 2), path, at });
    const half = es.ship
      .cells()
      .filter((c) => b.cellCenter(enemy, c.x, c.y).x < ctr.x === left)
      .map((c) => ({ c, d: Math.hypot(b.cellCenter(enemy, c.x, c.y).x - end.x, b.cellCenter(enemy, c.x, c.y).y - end.y) }))
      .sort((a, z) => a.d - z.d);
    const rooms = new Set<number>();
    // the blast opens the hull below the waterline too, but it floods like 2 breaches at most (it's a bang, not a reef)
    let holes = 0;
    for (const { c } of half) {
      if (c.module !== undefined) rooms.add(c.module);
      // the core holds at 1 hp: the Big Bang never wins the fight on its own
      const core = c.module !== undefined && es.ship.modules[c.module]?.kind === 'core';
      const raw = core ? c.hp - 1 : c.hp;
      if (raw <= 0) continue;
      const below = b.cellCenter(enemy, c.x, c.y).y > b.waterY - CELL * 0.3;
      const dealt = cut(b, enemy, c, raw, o.events, path, at);
      if (!dealt && b.budget && b.budget.left <= 0) break;
      if (c.hp <= 0 && below && holes < 2) {
        holes++;
        es.breaches++;
      }
    }
    collapse(b, enemy, o.events, path, at);
    if (holes) o.events.push({ k: 'flood', side: enemy, flood: es.flood, breaches: es.breaches });
    // the sound: everyone in that half is deaf and dizzy
    const el = catEl(o.cat);
    for (const c of es.cats) {
      if (c.ko || b.isFlying(c) || !rooms.has(c.room)) continue;
      b.hitCat(c, Math.round(o.atk * o.shot.power * 0.2 * CAT_K), o.events, path, at, el, true);
      if (!c.ko) c.stunned = Math.max(c.stunned, stars >= 3 ? 3 : 2);
    }
    return [note];
  },

  // ================================================================== LEGENDARIOS DEL MULTIVERSO
  // ------------------------------------------------------------------ the aurora comes down
  l_boreas(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const stars = o.cat.def.stars;
    const ctr = b.shipCenter(enemy);
    o.events.push({ k: 'ultfx', fx: 'aurora', side: enemy, x: ctr.x, y: shipTop(b, enemy), path: 0, at: 0 });
    const paths = normal(b, o, { ...o.shot, power: o.shot.power * 0.7 });
    const { path, at } = endOf(paths[0]);
    const frozen: Cell[] = [];
    const freeze = (c: Cell) => {
      if (c.hp <= 0 || (c.status.frozen ?? 0) >= 2) return;
      delete c.status.burning;
      delete c.status.wet;
      c.status.frozen = 2;
      frozen.push(c);
    };
    // every cannon they have freezes solid: no volley on their next turn
    const kinds = new Set(stars >= 3 ? ['cannon', 'shield', 'arcane'] : ['cannon']);
    for (const m of es.ship.modules) {
      if (!m.alive || !kinds.has(m.kind)) continue;
      const cells = es.ship.moduleCells(m.id);
      if (!cells.length) continue;
      cells.forEach(freeze);
      const c = b.roomCenter(enemy, m.id);
      o.events.push({ k: 'ultfx', fx: 'auroraFreeze', side: enemy, x: c.x, y: c.y, n: m.kind === 'cannon' ? 1 : 0, path, at });
    }
    // and the aurora frosts their whole deck (the top cell of every column, not the cabins): it shatters ×2 under
    // the next cannonball
    const top = new Map<number, Cell>();
    for (const c of es.ship.cells()) if (!top.has(c.x) || top.get(c.x)!.y > c.y) top.set(c.x, c);
    top.forEach((c) => {
      if (c.module === undefined || es.ship.modules[c.module]?.kind !== 'catroom') freeze(c);
    });
    if (frozen.length) o.events.push({ k: 'status', side: enemy, cells: frozen, status: 'frozen' });
    return paths;
  },

  // ------------------------------------------------------------------ the cathedral of light
  l_aurea(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const stars = o.cat.def.stars;
    const span = shipSpan(b, enemy);
    const tgt = landing(b, o);
    const n = stars >= 3 ? 6 : 5;
    // the halo opens high over the spot she aimed at; the beams fan down across the WHOLE ship like light
    // through cathedral windows, each one piercing 6 rows
    const hx = clamp(tgt.x, span.x0 + CELL * 2, span.x1 - CELL * 2);
    const hy = -180;
    o.events.push({ k: 'ultfx', fx: 'cathedral', side: enemy, x: hx, y: shipTop(b, enemy), n, path: 0, at: 0 });
    const beam: ShotDef = { ...o.shot, trajectory: 'ray', projectiles: 1, pierce: 5, radius: CELL * 1.1, power: o.shot.power * 0.3, gravityScale: 0, windScale: 0 };
    // the first beams fall through their cabins (one per cat), the rest spread over the ship
    const aims: { x: number; y: number }[] = es.cats.filter((c) => !c.ko && !b.isFlying(c)).map((c) => b.roomCenter(enemy, c.room));
    for (let i = 0; aims.length < n; i++) aims.push({ x: span.x0 + ((i + 0.5) / n) * (span.x1 - span.x0), y: b.waterY });
    aims.splice(n);
    const paths = aims.map((t) => b.integrate(beam, { x: hx, y: hy }, Math.atan2(t.y - hy, t.x - hx), 1100, 0, o.side));
    b.resolvePaths(o.side, beam, o.atk, paths, o.events);
    // JUDGMENT: every cat whose cabin a beam went through is struck by the light (once)
    for (const c of es.cats) {
      if (c.ko || b.isFlying(c)) continue;
      const room = es.ship.modules[c.room];
      const hit = paths.findIndex((p) =>
        p.impacts.some((i) => {
          const g = b.toGrid(enemy, p.points[i].x, p.points[i].y);
          return g.x >= room.x && g.x < room.x + room.w && g.y >= room.y && g.y < room.y + room.h;
        }),
      );
      if (hit >= 0) b.hitCat(c, Math.round(o.atk * o.shot.power * 0.2 * CAT_K), o.events, hit, paths[hit].points.length - 1, 'light', true);
    }
    // Luz already leaves them CEGADO 3 (multiverso.ts); the judgment also DAZZLES them for their next turn:
    // no criticals and their cannons aim blind too
    es.buffs.blind = Math.max(es.buffs.blind, 1);
    o.events.push({ k: 'ultfx', fx: 'dazzle', side: enemy, x: b.shipCenter(enemy).x, y: shipTop(b, enemy), path: 0, at: paths[0].points.length - 1 });
    return paths;
  },

  // ------------------------------------------------------------------ endless midnight
  l_medianoche(b, o) {
    const stars = o.cat.def.stars;
    const turns = stars >= 3 ? 4 : 3;
    const ctr = b.shipCenter(1 - o.side);
    o.events.push({ k: 'ultfx', fx: 'midnight', side: 1 - o.side, x: ctr.x, y: ctr.y, n: turns - 1, path: 0, at: 0 });
    // three invisible shadows: the first one that lands stabs EVERY enemy cat from behind (multiverso.ts)
    const paths = normal(b, o, { ...o.shot, power: o.shot.power * 0.3 });
    // the night stays: this turn and the next ones, every shot of his side is invisible and stabs
    p2SetNight(b, o.side, turns);
    return paths;
  },

  // ------------------------------------------------------------------ the power chord
  l_headliner(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const stars = o.cat.def.stars;
    const span = shipSpan(b, enemy);
    const top = shipTop(b, enemy);
    const bottom = top + es.ship.rows * CELL;
    // one wave per deck where their cats are (then filled up through the hull), flat, from the speaker wall
    const n = stars >= 3 ? 4 : 3;
    const ys: number[] = [];
    for (const c of es.cats) {
      if (c.ko || b.isFlying(c)) continue;
      const y = b.roomCenter(enemy, c.room).y;
      if (!ys.some((k) => Math.abs(k - y) < CELL * 0.8)) ys.push(y);
    }
    for (const f of [0.5, 0.25, 0.75, 0.4, 0.6]) {
      if (ys.length >= n) break;
      const y = top + CELL * 0.5 + f * (bottom - top - CELL);
      if (!ys.some((k) => Math.abs(k - y) < CELL * 0.8)) ys.push(y);
    }
    ys.splice(n);
    const wave: ShotDef = { ...o.shot, trajectory: 'wave', projectiles: 1, pierce: 40, radius: CELL * (stars >= 3 ? 1.2 : 0.9), power: o.shot.power * 0.6, gravityScale: 0, windScale: 0 };
    const sx = o.side === 0 ? span.x0 - CELL * 2.5 : span.x1 + CELL * 2.5;
    const paths = ys.map((y) => b.integrate(wave, { x: sx, y }, o.side === 0 ? 0 : Math.PI, 800, 0, o.side));
    o.events.push({ k: 'ultfx', fx: 'wallofsound', side: enemy, x: sx, y: (top + bottom) / 2, n: ys.length, path: 0, at: 0 });
    b.resolvePaths(o.side, wave, o.atk, paths, o.events);
    const at = Math.round(Math.min(...paths.map((p) => p.points.length - 1)) * 0.6);
    o.events.push({ k: 'ultfx', fx: 'powerchord', side: enemy, x: b.shipCenter(enemy).x, y: b.shipCenter(enemy).y, path: 0, at });
    // the chord gets through every wall: the cats the waves missed hear it too (stunned unless SORDO / sound cats)
    for (const c of es.cats) {
      if (c.ko || b.isFlying(c) || p2Heard(b, c)) continue;
      b.hitCat(c, Math.round(o.atk * o.shot.power * 0.2 * CAT_K), o.events, 0, at, 'sound', true);
    }
    return paths;
  },

  // ------------------------------------------------------------------ nobody sees you
  l_nadie(b, o) {
    const enemy = 1 - o.side;
    const es = b.sides[enemy];
    const stars = o.cat.def.stars;
    const span = shipSpan(b, enemy);
    const tgt = landing(b, o);
    // the stripe: the columns under the spot he aimed at (never off the ship)
    const width = stars >= 3 ? 3 : 2;
    const g = b.toGrid(enemy, clamp(tgt.x, span.x0, span.x1), tgt.y).x;
    const c0 = clamp(g - Math.floor((width - 1) / 2), 0, Math.max(0, es.ship.cols - width));
    const cols = new Set(Array.from({ length: width }, (_, i) => c0 + i));
    const xs = [...cols].map((x) => b.cellCenter(enemy, x, 0).x);
    const sx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const ctr = b.shipCenter(enemy);
    o.events.push({ k: 'ultfx', fx: 'nobody', side: enemy, x: sx, y: ctr.y, path: 0, at: 0 });
    // nobody sees it coming: no projectile at all — the eye closes and the stripe is simply gone
    const path = 0;
    const at = 0;
    o.events.push({ k: 'ultfx', fx: 'nobodyErase', side: enemy, x: sx, y: ctr.y, w: width * CELL, n: es.ship.rows * CELL, path, at });
    // top to bottom: every cell of the stripe is BORRADO (statuses eaten, never repaired); the core and the cells
    // that hold the ship together stay standing at 1 hp (it erases, it doesn't cut the ship in two)
    const stripe = es.ship
      .cells()
      .filter((c) => cols.has(c.x))
      .sort((a, z) => a.y - z.y);
    const erased: Cell[] = [];
    const rooms = new Set<number>();
    for (const c of stripe) {
      if (c.hp <= 0) continue;
      c.status = { voided: 99 };
      erased.push(c);
      if (c.module !== undefined) rooms.add(c.module);
      const core = c.module !== undefined && es.ship.modules[c.module]?.kind === 'core';
      const raw = core || holdsShip(es.ship, c) ? c.hp - 1 : c.hp;
      if (raw > 0) cut(b, enemy, c, raw, o.events, path, at);
    }
    const left = erased.filter((c) => c.hp > 0);
    if (left.length) o.events.push({ k: 'status', side: enemy, cells: left, status: 'voided' });
    collapse(b, enemy, o.events, path, at);
    // it eats every shield: the bubble, the old shield, cat shields and spare lives
    let ate = 0;
    if (es.bubble > 0 && es.bubbleKind) {
      es.bubble = 0;
      ate++;
      o.events.push({ k: 'bubble', side: enemy, what: 'break', x: ctr.x, y: ctr.y, path, at });
    }
    if (es.shieldHp > 0) {
      es.shieldHp = 0;
      ate++;
      o.events.push({ k: 'shieldHit', side: enemy, absorbed: 0, broken: true, path, at });
    }
    const el = catEl(o.cat);
    for (const c of es.cats) {
      if (c.ko || b.isFlying(c)) continue;
      if (c.shields > 0 || c.lives > 1) ate++;
      c.shields = 0;
      if (c.lives > 1) c.lives = 1;
      // the cats whose cabin was in the stripe get the static too
      if (rooms.has(c.room)) b.hitCat(c, Math.round(o.atk * o.shot.power * 0.25 * CAT_K), o.events, path, at, el, true);
    }
    o.events.push({ k: 'ultfx', fx: 'nobodyAte', side: enemy, x: ctr.x, y: shipTop(b, enemy), n: ate, path, at });
    return [];
  },

  // ------------------------------------------------------------------ the eternal second
  l_cronos(b, o) {
    const enemy = 1 - o.side;
    const ctr = b.shipCenter(enemy);
    // the stop itself is the Tiempo rule (multiverso.ts: lands on impact, never chained); this is its set piece
    o.events.push({ k: 'ultfx', fx: 'timestop', side: enemy, x: ctr.x, y: ctr.y, n: p2CanStop(b, enemy) ? 1 : 0, path: 0, at: 0 });
    return normal(b, o);
  },
};

/**
 * AI: is THIS the moment for that cat's ultimate? (the same answer for the player's auto-aim, the enemy
 * and the honest estimate's simulations). Once-per-battle ultimates that hit cats wait for cats to hit;
 * the meter thief waits for meters worth stealing.
 */
export function ultWorth(b: Battle, c: CatState): boolean {
  const enemy = 1 - c.side;
  const es = b.sides[enemy];
  const alive = es.cats.filter((k) => !k.ko && !b.isFlying(k));
  switch (c.def.catId) {
    case 'd_milvidas':
    case 'h_zarpa':
    case 's_noctis':
      // slashes through cats: worth it with two targets, or one that's still healthy
      return alive.length >= 2 || (alive.length === 1 && alive[0].hp > alive[0].maxHp * 0.3);
    case 'h_nekomante':
      // steal when there's something to steal (or the fight is dragging on)
      return es.cats.reduce((a, k) => a + (k.ko ? 0 : k.ultCharge), 0) >= 0.5 || b.turn >= 5;
    case 'd_horizonte':
      return !b.wells.some((w) => w.kind === 'horizon' && w.owner === c.side);
    case 'd_bigbang':
    case 'd_solcaido':
      // the big ones: never on a ship that's already sinking by itself
      return es.ship.integrity() > 0.45;
    // ---- the multiverse legendaries
    case 'l_boreas':
      // freeze when there's a volley to stop (or the fight drags on)
      return b.cannons(enemy).length > 0 || b.turn >= 4;
    case 'l_aurea':
      // don't blind the already blind
      return !p2Blind(b, enemy) || b.turn >= 5;
    case 'l_medianoche':
      // one night at a time, and someone to stab
      return !p2Night(b, c.side) && alive.length > 0;
    case 'l_headliner': {
      // the chord is worth it when it stuns two (or the last one standing); against a crew it can't stun (all
      // sound cats), it's still a big wave once the fight drags on
      const stun = alive.filter((k) => k.stunned <= 0 && !k.def.elements.includes('sound') && !p2Deaf(b, k)).length;
      return (stun > 0 && stun >= Math.min(2, alive.length)) || b.turn >= 6;
    }
    case 'l_cronos':
      // TIME STOP can't be chained: wait until it can land on a crew that would shoot
      return p2CanStop(b, enemy) && alive.some((k) => k.stunned <= 1);
    default:
      return true;
  }
}

/**
 * Divines that stay on the field act at the start of their OWNER's turn (before the wells age):
 *   horizon  swallows the nearest cells (whole) and drains every enemy cat's meter
 *   sun      burns the cells under it (damage + fire) and the cats in them
 * Each tick has its own structure cap (WellTick.frac).
 */
export function ultTicks(b: Battle, side: number, ev: BattleEvent[]) {
  for (const w of b.wells) {
    if (w.owner !== side || !w.tick) continue;
    const enemy = 1 - side;
    const es = b.sides[enemy];
    const prev = b.budget;
    b.budget = { side: enemy, left: Math.round((es.ship.initialMax?.[0] ?? 0) * w.tick.frac) };
    const near = es.ship
      .cells()
      .map((c) => ({ c, d: Math.hypot(b.cellCenter(enemy, c.x, c.y).x - w.x, b.cellCenter(enemy, c.x, c.y).y - w.y) }))
      .sort((a, z) => a.d - z.d)
      .slice(0, w.tick.cells);
    if (w.kind === 'horizon') {
      ev.push({ k: 'ultfx', fx: 'horizonTick', side: enemy, x: w.x, y: w.y, n: near.length, path: -1, at: 0 });
      for (const { c } of near) if (!cut(b, enemy, c, c.hp, ev, -1, 0)) break;
      const drain = w.tick.drain ?? 0;
      if (drain > 0) for (const c of es.cats) if (!c.ko) c.ultCharge = Math.max(0, c.ultCharge - drain);
    } else if (w.kind === 'sun') {
      ev.push({ k: 'ultfx', fx: 'sunTick', side: enemy, x: w.x, y: w.y, n: near.length, path: -1, at: 0 });
      const burnt: Cell[] = [];
      const scorched = new Set<CatState>();
      for (const { c } of near) {
        cut(b, enemy, c, w.tick.atk * DMG_K, ev, -1, 0);
        if (c.hp > 0 && FLAMMABLE.has(c.material) && !c.status.wet) {
          c.status.burning = Math.max(c.status.burning ?? 0, 2);
          burnt.push(c);
        }
        if (c.module !== undefined) {
          const cat = es.cats.find((k) => k.room === c.module && !k.ko && !b.isFlying(k));
          if (cat && !scorched.has(cat)) {
            scorched.add(cat);
            b.hitCat(cat, Math.round(w.tick.atk * 0.25 * CAT_K), ev, -1, 0, 'fire');
          }
        }
      }
      if (burnt.length) ev.push({ k: 'status', side: enemy, cells: burnt, status: 'burning' });
    }
    collapse(b, enemy, ev, -1, 0);
    b.budget = prev;
  }
}
