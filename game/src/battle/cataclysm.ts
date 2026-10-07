/**
 * CATACLISMOS — the zone's / boss's / grieta's own power (never a cat): something enormous falls on YOUR
 * ship every few turns. Pure sim rules, called from Battle (sim.ts); same determinism as the rest (seeded
 * from the battle seed, integer damage). The view only stages what the sim resolved (battle/cataFx.ts), and
 * the honest estimate plays the very same battles, so the cataclysm is in its numbers too.
 *
 *  Rhythm (counted on the caster's turns): WARNING (banner + ghost marks on your ship + a SEAL hanging over
 *  their ship) → your turn: fly a CAT's shot THROUGH the seal (it doesn't stop the shot; the automatic cannons
 *  don't count): each projectile that crosses it takes −50%, two cancel it (a spread / cluster can) → it
 *  lands at the caster's next turn.
 *
 *  Everything scales with the SIZE of the ship it falls on (cells beyond a normal 95-cell hull): a huge
 *  hull is a huge target. A Gorrión (93) barely notices; a 208-cell Bastión gets the full sky. One landing
 *  never takes more than cataCap() of the target's structure.
 *
 *   meteors  LLUVIA DE METEORITOS  1 + (extra cells)/10 meteors (max 14) straight down on the marks, heavier
 *                                  on a bigger hull (bubbles stop them as usual)
 *   moon     LA LUNA BAJA          the moon comes down on the TALLEST part of the ship: one crushing blow whose
 *                                  size and weight grow with the hull (it goes through bubbles); the tide
 *                                  comes up (both waterlines wet) and gravity drops (×0.8) for 2 rounds
 *   sun      EL SOL BAJA           heat on every EXPOSED cell (an open side or top): dries what was wet and
 *                                  melts ice; the top-most wood burns and the exposed cannons overheat (skip
 *                                  their next volley), both one per so many extra cells
 *   tide     MAREA NEGRA           the black sea climbs the hull: the waterline takes damage, the cells nearest
 *                                  the water rot (CURSED ×1.5, 2 turns) and the ship floods
 */
import type { Battle, BattleEvent, ShotPath } from './sim';
import { CAT_K, DMG_K, MAT_RESIST, clampMul } from './sim';
import { CELL } from './ship';
import type { Cell, ShipBlueprint } from './ship';
import type { ShotDef } from './types';
import { Rng } from '../core/rng';

export type CataId = 'meteors' | 'moon' | 'sun' | 'tide';

export interface CataCfg {
  id: CataId;
  /** the side that casts it (the stage / the boss); it falls on the other ship */
  side: 0 | 1;
  /** who casts it, for the labels ("LAS RUINAS SUMERGIDAS", "EL ARCANISTA", "LA GRIETA BOREAL") */
  by: string;
  /** caster turn of the first warning (1 = its first turn) */
  first: number;
  /** caster turns from one landing to the next (the warning comes the turn before) */
  every: number;
  /** strength (× the caster's cannon attack) */
  power: number;
}

export interface CataState {
  cfg: CataCfg;
  /** caster turns until the next warning */
  in: number;
  /** warned: lands at the start of the caster's next turn */
  charging: boolean;
  /** seal hits this charge (each −50%; two cancel it) */
  cracks: number;
  /** world points on the target ship (meteors: one per meteor; moon: the crush; tide: waterline ends) */
  marks: { x: number; y: number }[];
  /** times it landed / was cancelled */
  casts: number;
  stops: number;
  /** the moon's low gravity: rounds left (counted on the caster's turns) */
  lowG: number;
  /** target ship cells at the start (the size that decides how hard it hits) */
  cells0: number;
  /** the SEAL over the caster's ship (solid only while charging; shots fly through it) */
  seal: { x: number; y: number; r: number };
}

export const CATA_INFO: Record<CataId, { name: string; shout: string; rule: string; counter: string; color: number }> = {
  meteors: {
    name: 'LLUVIA DE METEORITOS',
    shout: '¡LLUVIA DE METEORITOS!',
    rule: 'Llueven meteoritos sobre tu barco: uno más por cada 10 celdas de casco arriba de 95, y más pesados entre más grande el barco (uno chico recibe uno solo, chiquito).',
    counter: 'Pasa un tiro de GATO por el SELLO que flota sobre su barco (no frena tu tiro): cada proyectil que lo cruza le quita la mitad y dos lo cancelan. Tus cañones automáticos no cuentan.',
    color: 0xff8a2e,
  },
  moon: {
    name: 'LA LUNA BAJA',
    shout: '¡LA LUNA SE CAE!',
    rule: 'La luna aplasta la parte MÁS ALTA de tu barco y atraviesa las burbujas: entre más grande el casco, más grande y pesado el golpe. Sube la marea (se moja la línea de flotación) y todo pesa menos por 2 rondas.',
    counter: 'Pasa un tiro de GATO por el SELLO que flota sobre su barco (no frena tu tiro): cada proyectil que lo cruza le quita la mitad y dos lo cancelan. Tus cañones automáticos no cuentan.',
    color: 0xdfe6ff,
  },
  sun: {
    name: 'EL SOL BAJA',
    shout: '¡QUE BAJE EL SOL!',
    rule: 'El sol cuece cada celda EXPUESTA de tu barco: seca lo mojado, derrite el hielo, prende la madera de arriba y recalienta tus cañones expuestos (se saltan su próxima andanada). Un casco grande junta mucho más calor; uno chico casi ni suda.',
    counter: 'Pasa un tiro de GATO por el SELLO que flota sobre su barco (no frena tu tiro): cada proyectil que lo cruza le quita la mitad y dos lo cancelan. Tus cañones automáticos no cuentan.',
    color: 0xffd400,
  },
  tide: {
    name: 'MAREA NEGRA',
    shout: '¡MAREA NEGRA!',
    rule: 'El mar negro trepa tu casco: pudre la línea de flotación (MALDITA: x1.5 de daño por 2 turnos) y te inunda. Entre más largo y grande el barco, más mar le cabe; a uno chico casi ni lo moja.',
    counter: 'Pasa un tiro de GATO por el SELLO que flota sobre su barco (no frena tu tiro): cada proyectil que lo cruza le quita la mitad y dos lo cancelan. Tus cañones automáticos no cuentan.',
    color: 0x9b5ab8,
  },
};

/** "PODER DEL ARCANISTA" / "PODER DE LA GRIETA BOREAL" (de + el = del) */
export function poderDe(by: string) {
  return by.startsWith('EL ') ? `PODER DEL ${by.slice(3)}` : `PODER DE ${by}`;
}

/** a normal hull (a Gorrión is 93 cells with its modules): cells up to here don't attract the sky */
export const CATA_FREE_CELLS = 95;
/** balance scripts: global strength (mul) and how much the AI chases the seal (seal) */
export const CATA_TUNE = { mul: 1, seal: 1 };

/** cells of a blueprint (hull + module footprints), the same count the sim starts with */
export function bpCells(bp: ShipBlueprint) {
  const on = new Set<string>();
  bp.hull.forEach((row, y) => [...row].forEach((ch, x) => ch !== '.' && x < bp.cols && on.add(`${x},${y}`)));
  for (const m of bp.modules) for (let y = m.y; y < m.y + m.h; y++) for (let x = m.x; x < m.x + m.w; x++) on.add(`${x},${y}`);
  return on.size;
}

/** how much of a ship the sky sees: extra cells over a normal hull and their share of the ship */
export function cataSize(cells0: number) {
  const excess = Math.max(0, cells0 - CATA_FREE_CELLS);
  return { cells: cells0, excess, k: excess / Math.max(1, cells0) };
}

const METEOR: ShotDef = { id: 'cata_meteor', name: 'METEORITO', element: 'earth', trajectory: 'ballistic', power: 1, radius: 46, gravityScale: 1.6, windScale: 0, catMul: 0.35 };
const MOON: ShotDef = { id: 'cata_moon', name: 'LA LUNA', element: 'cosmic', trajectory: 'ballistic', power: 1, radius: CELL * 2, gravityScale: 1.4, windScale: 0, catMul: 0.3 };

export function cataInit(b: Battle, cfg: CataCfg) {
  const target = 1 - cfg.side;
  const s = b.sides[cfg.side];
  const w = s.ship.cols * CELL;
  const y = Math.max(190, s.setup.origin.y - 170);
  // over their ship, clear of the boss's own floating parts (Distraxia's fog, ink cats)
  const free = (fx: number) => s.parts.every((p) => Math.hypot(p.x - (s.setup.origin.x + w * fx), (p.y0 + p.y1) / 2 - y) > p.r + 42 + 30);
  const fx = [0.5, 0.72, 0.3, 0.85].find(free) ?? 0.5;
  const seal = { x: Math.round(s.setup.origin.x + w * fx), y, r: 42 };
  b.cata = { cfg, in: Math.max(1, cfg.first), charging: false, cracks: 0, marks: [], casts: 0, stops: 0, lowG: 0, cells0: b.sides[target].ship.cells().length, seal };
}

/** is the seal up for shots of `owner` (only the side that suffers the cataclysm can crack it) */
export function sealOpen(b: Battle, owner: number) {
  const c = b.cata;
  return !!c && c.charging && owner !== c.cfg.side;
}

/** AI: a shot that flies through the SEAL is worth what the cataclysm threatens (its strength × how much of
 * the ship the sky sees): a small hull or a weak cataclysm isn't worth bending a shot for; a Bastión under the
 * sun is */
export function sealValue(b: Battle, side: number) {
  const c = b.cata;
  if (!c || !c.charging || c.cfg.side === side) return 0;
  const { k } = cataSize(c.cells0);
  return Math.min(12, 4 * c.cfg.power * k) * (c.cracks ? 1.3 : 1) * CATA_TUNE.seal;
}

/** the most one landing may take from the target's structure: nothing much from a normal hull, up to 40% from
 * a huge one under a strong cataclysm */
export function cataCap(cells0: number, power: number) {
  const { k } = cataSize(cells0);
  return Math.min(0.4, 0.03 + k * (0.25 + 0.08 * power));
}

/** start of the caster's turn: land the charged cataclysm, or count down to the next warning */
export function cataStart(b: Battle, side: 0 | 1, ev: BattleEvent[]) {
  const c = b.cata;
  if (!c || side !== c.cfg.side || b.winner !== null) return;
  if (c.lowG > 0) {
    c.lowG--;
    if (!c.lowG) b.field.tideMul = 1;
  }
  if (c.charging) {
    c.charging = false;
    const mul = Math.max(0, 1 - 0.5 * c.cracks);
    c.cracks = 0;
    c.in = Math.max(1, c.cfg.every - 1);
    if (mul > 0) cast(b, mul);
    c.marks = [];
    return;
  }
  c.in--;
  if (c.in > 0) return;
  // the warning: marks on the target ship and the seal over the caster
  c.charging = true;
  c.cracks = 0;
  c.marks = pickMarks(b);
  const t = 1 - c.cfg.side;
  const ctr = b.shipCenter(t);
  ev.push({ k: 'cata', what: 'tell', id: c.cfg.id, side: t, x: ctr.x, y: ctr.y, n: c.marks.length, path: -1, at: 0 });
}

/** a CAT's shot of the suffering side flew through the SEAL (sim.integrate marks it): −50%, the second cancels it */
export function cataCrack(b: Battle, attSide: number, ev: BattleEvent[], path: number, at: number) {
  const c = b.cata;
  if (!c || !c.charging || attSide === c.cfg.side) return;
  c.cracks++;
  const { x, y } = c.seal;
  if (c.cracks >= 2) {
    c.charging = false;
    c.cracks = 0;
    c.stops++;
    c.in = Math.max(1, c.cfg.every - 1);
    c.marks = [];
    ev.push({ k: 'cata', what: 'stop', id: c.cfg.id, side: 1 - c.cfg.side, x, y, path, at });
  } else ev.push({ k: 'cata', what: 'crack', id: c.cfg.id, side: 1 - c.cfg.side, x, y, n: c.cracks, path, at });
}

// ------------------------------------------------------------------ marks
function pickMarks(b: Battle): { x: number; y: number }[] {
  const c = b.cata!;
  const t = 1 - c.cfg.side;
  const s = b.sides[t];
  const { excess } = cataSize(c.cells0);
  const x0 = s.setup.origin.x + CELL * 0.5;
  const x1 = s.setup.origin.x + (s.ship.cols - 0.5) * CELL;
  if (c.cfg.id === 'meteors') {
    const n = Math.min(14, 1 + Math.round(excess / 10));
    // its own seeded stream: the battle's dice stay exactly as they'd be without the sky
    const rr = new Rng(b.cfg.seed * 13 + b.turn * 101 + c.casts * 7);
    return Array.from({ length: n }, (_, i) => {
      const x = Math.round(x0 + ((i + 0.15 + rr.next() * 0.7) / n) * (x1 - x0));
      return { x, y: topAt(b, t, x) };
    });
  }
  if (c.cfg.id === 'moon') {
    const tall = tallest(b, t);
    return [tall];
  }
  if (c.cfg.id === 'tide') return [
    { x: x0, y: b.waterY - CELL },
    { x: x1, y: b.waterY - CELL },
  ];
  // sun: the exposed cells (the view draws the heat on them)
  return exposedCells(b, t).map((cell) => b.cellCenter(t, cell.x, cell.y));
}

/** top surface y of a ship at world x (first cell from the top), or the waterline */
function topAt(b: Battle, side: number, x: number) {
  const s = b.sides[side];
  for (let gy = 0; gy < s.ship.rows; gy++) {
    const g = b.toGrid(side, x, s.setup.origin.y + gy * CELL + CELL / 2);
    if (s.ship.get(g.x, gy)) return s.setup.origin.y + gy * CELL;
  }
  return b.waterY - CELL;
}

/** the tallest part of a ship: the middle of the columns that reach (almost) its highest row */
function tallest(b: Battle, side: number) {
  const s = b.sides[side];
  const tops: { x: number; row: number }[] = [];
  for (let gx = 0; gx < s.ship.cols; gx++) {
    for (let gy = 0; gy < s.ship.rows; gy++) {
      if (s.ship.get(gx, gy)) {
        tops.push({ x: b.cellCenter(side, gx, gy).x, row: gy });
        break;
      }
    }
  }
  if (!tops.length) return b.shipCenter(side);
  const min = Math.min(...tops.map((t) => t.row));
  const hi = tops.filter((t) => t.row <= min + 1);
  const x = Math.round(hi.reduce((a, t) => a + t.x, 0) / hi.length);
  return { x, y: s.setup.origin.y + min * CELL };
}

/** cells with an open side (or the top) */
export function exposedCells(b: Battle, side: number): Cell[] {
  const ship = b.sides[side].ship;
  return ship.cells().filter((c) => !ship.get(c.x, c.y - 1) || !ship.get(c.x - 1, c.y) || !ship.get(c.x + 1, c.y));
}

// ------------------------------------------------------------------ the blow
/** the moon's crush radius for a ship of `cells0` cells (sim and view agree) */
export function moonRadius(cells0: number) {
  return Math.min(CELL * 6, CELL * (1.6 + cataSize(cells0).excess / 30));
}

function cast(b: Battle, mul: number) {
  const c = b.cata!;
  const caster = c.cfg.side;
  const t = 1 - caster;
  const ts = b.sides[t];
  const { excess, k } = cataSize(c.cells0);
  const atk = b.sides[caster].setup.cannonAtk * c.cfg.power * mul * CATA_TUNE.mul;
  const events: BattleEvent[] = [];
  const info = CATA_INFO[c.cfg.id];
  const ctr = b.shipCenter(t);
  c.casts++;
  // never more than a slice of the ship in one go (a 208-cell hull can lose more than a 93-cell one)
  const prev = b.budget;
  b.budget = { side: t, left: Math.round((ts.ship.initialMax?.[0] ?? 0) * cataCap(c.cells0, c.cfg.power * mul)) };
  let paths: ShotPath[] = [];
  let shot: ShotDef = METEOR;
  if (c.cfg.id === 'meteors') {
    // one meteor per 10 extra cells (a normal hull gets a small one), heavier on a bigger hull
    shot = { ...METEOR, power: 0.25 + 0.6 * k };
    paths = c.marks.map((m, i) => b.integrate(shot, { x: m.x + (i % 2 ? 26 : -26), y: -180 - (i % 5) * 70 }, Math.PI / 2 + (i % 2 ? -0.025 : 0.025), 360, 0, caster));
    events.push({ k: 'cata', what: 'fall', id: c.cfg.id, side: t, x: ctr.x, y: ctr.y, n: paths.length, path: -1, at: 0 });
    b.resolvePaths(caster, shot, atk, paths, events);
  } else if (c.cfg.id === 'moon') {
    // the crush grows with the hull (radius and weight)
    const m = c.marks[0] ?? tallest(b, t);
    const r = moonRadius(c.cells0);
    shot = { ...MOON, power: 0.2 + 1.3 * k, radius: r };
    paths = [b.integrate(shot, { x: m.x, y: -520 }, Math.PI / 2, 300, 0, caster)];
    events.push({ k: 'cata', what: 'fall', id: c.cfg.id, side: t, x: m.x, y: m.y, n: Math.round(r), path: -1, at: 0 });
    // the moon is too big for a bubble: it goes right through (the bubbles stay up)
    const keep = ts.bubble;
    ts.bubble = 0;
    b.resolvePaths(caster, shot, atk, paths, events);
    ts.bubble = keep;
    // the tide comes up with the moon (everybody's waterline gets wet) and everything weighs less for 2 rounds
    for (let i = 0; i < 2; i++) b.wetCells(i, b.sides[i].ship.cells().filter((cell) => b.cellCenter(i, cell.x, cell.y).y > b.waterY - CELL * 1.5), events);
    b.field.tideMul = 0.8;
    c.lowG = 2;
  } else if (c.cfg.id === 'sun') {
    events.push({ k: 'cata', what: 'fall', id: c.cfg.id, side: t, x: ctr.x, y: ctr.y, path: -1, at: 0 });
    heat(b, t, atk * 0.5 * k, Math.round(excess / 6), events);
    // the heat overheats the exposed cannons: one per 25 extra cells skips its next volley
    const hot = new Set(exposedCells(b, t).filter((cell) => cell.module !== undefined).map((cell) => cell.module!));
    const guns = ts.ship.modules.filter((m) => m.kind === 'cannon' && m.alive && hot.has(m.id)).slice(0, Math.round(excess / 25));
    for (const g of guns) {
      g.disabled = Math.max(g.disabled, 2);
      const p = b.roomCenter(t, g.id);
      events.push({ k: 'info', text: '¡CAÑÓN RECALENTADO!', x: p.x, y: p.y - 50, color: 0xff8a2e, path: -1, at: 0 });
    }
  } else {
    events.push({ k: 'cata', what: 'fall', id: c.cfg.id, side: t, x: ctr.x, y: b.waterY, path: -1, at: 0 });
    tide(b, t, atk * 0.55 * k, Math.round(excess / 5), events);
    if (excess > 0) flood(b, t, excess * 0.0013, events);
  }
  for (const ch of ts.ship.collapse()) {
    events.push({ k: 'chunk', side: t, cells: ch, path: -1, at: 0 });
    for (const cell of ch) if (cell.module !== undefined) b.reportModule(t, cell.module, events, -1, 0);
  }
  events.push(...b.updateExposure(t));
  events.push({ k: 'cata', what: 'land', id: c.cfg.id, side: t, x: ctr.x, y: ctr.y, n: Math.round(mul * 100), path: -1, at: 0 });
  b.budget = prev;
  b.checkVictory();
  b.queued.push({ side: caster, label: mul < 1 ? `${info.shout} (SELLO ROTO: x${mul})` : info.shout, paths, events, shot, cata: c.cfg.id });
}

function hurt(b: Battle, side: number, cell: Cell, raw: number, ev: BattleEvent[]) {
  const dmg = b.cap(side, Math.max(0, Math.round(raw)));
  if (dmg <= 0) return 0;
  b.hurtCell(side, cell, dmg);
  const destroyed = cell.hp <= 0;
  if (destroyed) {
    const mid = cell.module;
    b.sides[side].ship.destroyCell(cell.x, cell.y);
    if (mid !== undefined) b.reportModule(side, mid, ev, -1, 0);
  }
  ev.push({ k: 'cell', side, cell, dmg, destroyed, path: -1, at: 0 });
  return dmg;
}

const FLAMMABLE = new Set(['wood', 'bone', 'canvas']);

/**
 * EL SOL BAJA: every exposed cell cooks (dry, no ice); the `burn` top-most flammable ones catch fire; the
 * cats in exposed cabins sweat it out. A small hull (no extra cells) only gets dried.
 */
function heat(b: Battle, t: number, perCell: number, burn: number, ev: BattleEvent[]) {
  const s = b.sides[t];
  const cells = exposedCells(b, t);
  const cooked = new Set<number>();
  for (const cell of cells) {
    delete cell.status.wet;
    delete cell.status.frozen;
    const mult = clampMul(MAT_RESIST[cell.material]?.fire ?? 1);
    if (perCell > 0) hurt(b, t, cell, perCell * mult * DMG_K * (s.setup.armor ?? 1), ev);
    if (cell.module !== undefined && s.ship.modules[cell.module]?.kind === 'catroom') cooked.add(cell.module);
  }
  // what faces the sun the most burns first (top rows, then the open sides)
  const burnt = cells
    .filter((cell) => cell.hp > 0 && s.ship.get(cell.x, cell.y) === cell && FLAMMABLE.has(cell.material) && !cell.status.steam)
    .sort((a, z) => a.y - z.y || a.x - z.x)
    .slice(0, burn);
  for (const cell of burnt) cell.status.burning = Math.max(cell.status.burning ?? 0, 2);
  if (burnt.length) ev.push({ k: 'status', side: t, cells: burnt, status: 'burning' });
  // the heat itself (no fire status on the cats: the burning cabins do that on their own); never more than a
  // third of a cat's life in one go
  if (perCell > 0) for (const cat of s.cats) if (!cat.ko && cooked.has(cat.room) && !b.isFlying(cat)) b.hitCat(cat, Math.round(Math.min(perCell * 1.5 * CAT_K, cat.maxHp * 0.33)), ev, -1, 0, 'neutral', true);
}

/** MAREA NEGRA: the waterline takes the black sea; the `rot` cells nearest the water get CURSED (×1.5, 2 turns) */
function tide(b: Battle, t: number, perCell: number, rotN: number, ev: BattleEvent[]) {
  const s = b.sides[t];
  const band = s.ship.cells().filter((cell) => b.cellCenter(t, cell.x, cell.y).y > b.waterY - CELL * 1.3);
  const soaked = new Set<number>();
  for (const cell of band) {
    delete cell.status.burning;
    const dealt = perCell > 0 ? hurt(b, t, cell, perCell * DMG_K * (s.setup.armor ?? 1), ev) : 0;
    if (dealt > 0 && cell.module !== undefined && s.ship.modules[cell.module]?.kind === 'catroom') soaked.add(cell.module);
  }
  // the rot climbs from the water up (lowest cells first, then along the hull)
  const ctr = b.shipCenter(t).x;
  const rot = band
    .filter((cell) => cell.hp > 0 && s.ship.get(cell.x, cell.y) === cell)
    .sort((a, z) => z.y - a.y || Math.abs(b.cellCenter(t, a.x, a.y).x - ctr) - Math.abs(b.cellCenter(t, z.x, z.y).x - ctr))
    .slice(0, rotN);
  for (const cell of rot) cell.status.cursed = Math.max(cell.status.cursed ?? 0, 2);
  if (rot.length) ev.push({ k: 'status', side: t, cells: rot, status: 'cursed' });
  if (perCell > 0) for (const cat of s.cats) if (!cat.ko && soaked.has(cat.room) && !b.isFlying(cat)) b.hitCat(cat, Math.round(Math.min(perCell * CAT_K, cat.maxHp * 0.25)), ev, -1, 0, 'neutral', true);
}

function flood(b: Battle, t: number, amount: number, ev: BattleEvent[]) {
  const s = b.sides[t];
  s.flood = Math.min(1, s.flood + amount * (s.setup.pump ? 0.5 : 1));
  ev.push({ k: 'flood', side: t, flood: s.flood, breaches: s.breaches });
}

/** the pre-battle "¿POR QUÉ?" / intro lines for a cataclysm against a ship of `cells` cells */
export function cataLines(cfg: CataCfg, cells: number): string[] {
  const info = CATA_INFO[cfg.id];
  const { excess, k } = cataSize(cells);
  const size =
    k <= 0
      ? `Tu barco tiene ${cells} celdas: es de tamaño normal, casi no le hace.`
      : cfg.id === 'meteors'
        ? `Tu barco tiene ${cells} celdas: te caen ${Math.min(14, 1 + Math.round(excess / 10))} meteoritos por lluvia (a uno de 95 celdas o menos, 1 chiquito).`
        : `Tu barco tiene ${cells} celdas (${excess} arriba de lo normal): ${k > 0.4 ? 'es ENORME, le cae con todo' : 'es grande, le cae más que a uno chico'}. Puede llevarse hasta ${Math.round(100 * cataCap(cells, cfg.power))}% de tu casco por golpe.`;
  return [`${poderDe(cfg.by)}: ${info.name} (no es un gato). Cada ${cfg.every} turnos, avisado un turno antes. ${info.rule}`, size, info.counter];
}
