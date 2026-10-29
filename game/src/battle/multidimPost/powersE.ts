/**
 * After the Parte III · TANDA 2 · post MULTIDIMENSIONAL powers 14–25 (pixels, the screen, the telenovela, books, pop and
 * the court) — agent PODERES-3. Same rules as powersD.ts; what changed and why: docs/post-p3/agentes/PODERES-3.md.
 */
import type { Battle, PathPoint, ShotPath } from '../sim';
import { CAT_K, DMG_K } from '../sim';
import type { Cell } from '../ship';
import type { CatState, ShotDef, StatusId } from '../types';
import type { UltCtx } from '../ults';
import { collapse, cut, shipTop } from '../ults';
import { mdExtendOwn } from '../multidim';
import { CELL, PW, S, T, alive, bestModules, dash, dirOf, fx, heal, hop, info, isBossCaptain, lastAt, line, lob, mk, on, stamp, strongest, stun, vsBoss } from './kit';
import type { Timer } from './kit';
import { D, breakSafely, hullFrac, peekD } from './kitD';
import { cabin, flight, fracOf, mark } from './powersD';
import { bare } from './powersC';

export function ultsE() {
  return {
    xp_tetrimiau,
    xp_laracroqueta,
    xp_pobregatito,
    xp_felinamente,
    xp_gorrimiau,
    xp_docmiauwn,
    xp_pinkmiau,
    xp_miauty,
    xp_michincipe,
    xp_garjona,
    xp_shakimiau,
    xp_miaucol,
  };
}

/** the center of a side's live core (else the ship's center) */
export function coreAt(b: Battle, side: number): PathPoint {
  const core = b.sides[side].ship.modules.find((m) => m.kind === 'core' && m.alive);
  return core ? b.roomCenter(side, core.id) : b.shipCenter(side);
}

// ---------------------------------------------------------------- Tetrimiau · LINE CLEAR!
// Four pieces fall and complete a line: the row of their ship with the most live cells (a tie: the lowest) is CLEARED
// — every cell of it breaks, except the ones that hold something up (a ship can't drop its rows like the game does:
// those stay as cracked pillars) and the core (it loses half of what it has left). The cells right above each cleared
// one take 0.15·P as they fall onto the gap. Then the integrity check.
function xp_tetrimiau(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const ship = b.sides[enemy].ship;
  const rows = new Map<number, Cell[]>();
  for (const c of ship.cells()) rows.set(c.y, [...(rows.get(c.y) ?? []), c]);
  const pick = [...rows.entries()].sort((a, z) => z[1].length - a[1].length || z[0] - a[0])[0];
  const ctr = b.shipCenter(enemy);
  if (!pick) {
    stamp(b, o, ctr.x, ctr.y);
    return [];
  }
  const [y, row] = pick;
  const dir = dirOf(o.side);
  row.sort((a, z) => dir * (a.x - z.x));
  const mid = b.cellCenter(enemy, row[Math.floor(row.length / 2)].x, y);
  stamp(b, o, mid.x, mid.y);
  // the four pieces, falling onto the row
  const paths: ShotPath[] = [];
  for (let i = 0; i < 4; i++) {
    const c = row[Math.min(row.length - 1, Math.floor(((i + 0.5) / 4) * row.length))];
    const t = b.cellCenter(enemy, c.x, c.y);
    const from = { x: t.x, y: -200 - i * 60 };
    paths.push(flight([from, ...line(from, t, 26)], 'neutral', 'heavy'));
  }
  const at = lastAt(paths[3]);
  const was = new Set(row.filter((c) => c.hp > 0));
  const broke = breakSafely(b, enemy, row, o.events, 3, at);
  const gone = [...was].filter((c) => ship.get(c.x, c.y) !== c || c.hp <= 0);
  // what was right above a cleared cell falls onto the gap
  const P = o.atk * PW(o) * DMG_K;
  for (const g of gone) {
    const up = ship.get(g.x, g.y - 1);
    if (up && up.hp > 0) cut(b, enemy, up, P * 0.15, o.events, 3, at);
  }
  collapse(b, enemy, o.events, 3, at);
  fx(o.events, 'mdpLine', enemy, mid.x, mid.y, { n: broke, w: row.length, path: 3, at });
  info(o.events, broke >= row.length - 1 ? '¡LÍNEA COMPLETA!' : `¡LÍNEA! ${broke} DE ${row.length} CELDAS`, mid.x, mid.y - 160, 0x8a4dff, 3, at);
  return paths;
}

// ---------------------------------------------------------------- Lara Croqueta · RELIC RAID!
// She hooks onto their ship and raids the pantry: −25 meter from each of their cats (−40 if it was full; a boss captain
// −15), shared among your live cats, the emptiest first (max full). Before leaving, the two pointers: 2 × 0.4·P at the
// cat of theirs that had the most meter before the raid, Cegado.
function xp_laracroqueta(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const foes = alive(b, enemy);
  const richest = [...foes].sort((a, z) => z.ultCharge - a.ultCharge || (a.def.uid < z.def.uid ? -1 : 1))[0];
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, shipTop(b, enemy));
  let pool = 0;
  for (const c of foes) {
    const take = Math.min(c.ultCharge, isBossCaptain(b, c) ? 0.15 : c.ultCharge >= 1 ? 0.4 : 0.25);
    c.ultCharge -= take;
    pool += take;
  }
  const mates = alive(b, o.side).sort((a, z) => a.ultCharge - z.ultCharge || (a.def.uid < z.def.uid ? -1 : 1));
  // shared out: the emptiest first, level by level
  for (let guard = 0; pool > 1e-6 && guard < 50; guard++) {
    const open = mates.filter((c) => c.ultCharge < 1 - 1e-9);
    if (!open.length) break;
    const share = pool / open.length;
    for (const c of open) {
      const g = Math.min(share, 1 - c.ultCharge);
      c.ultCharge += g;
      pool -= g;
    }
  }
  const stolen = foes.length;
  info(o.events, `¡SAQUEO! BARRA DE ${stolen} GATOS`, ctr.x, ctr.y - 220, 0xc49a3c);
  const paths: ShotPath[] = [];
  if (richest) {
    const t = b.roomCenter(enemy, richest.room);
    for (let i = 0; i < 2; i++) {
      const from = { x: o.origin.x, y: o.origin.y - 10 - i * 14 };
      const p = flight([from, ...line(from, t, 30)], 'light', 'beam');
      const k = paths.push(p) - 1;
      b.hitCat(richest, Math.round(o.atk * PW(o) * 0.4 * CAT_K), o.events, k, p.points.length - 1, 'light', true);
    }
    b.sides[enemy].buffs.blind = Math.max(b.sides[enemy].buffs.blind, 1);
    fx(o.events, 'mdpRaid', enemy, t.x, t.y, { uid: richest.def.uid, path: 1, at: lastAt(paths[1]) });
  }
  return paths;
}

// ---------------------------------------------------------------- Mi Pobre Gatito · HOME TRAPS!
// He sets up the house: 4 traps hidden in your most valuable cells (cabins with a cat first), unseen by the preview and
// by their AI, for 4 of their turns or until sprung. A blow of theirs on a trapped cell does nothing there and the trap
// gets the shooter instead, in a fixed order: paint can (stun), hot doorknob (Ardiendo 2, −30 meter), toy cars (its next
// shot swerves 20° and hits ×0.5), the iron (0.45·P on its cabin). rulesD.ts springs them.
function xp_pobregatito(b: Battle, o: UltCtx): ShotPath[] {
  const s = b.sides[o.side];
  const me = b.roomCenter(o.side, o.cat.room);
  stamp(b, o, me.x, me.y);
  const cells: Cell[] = [];
  for (const m of bestModules(b, o.side, 99)) {
    if (cells.length >= 4) break;
    const own = s.ship.moduleCells(m.id).filter((c) => c.hp > 0);
    if (!own.length) continue;
    const q = b.roomCenter(o.side, m.id);
    own.sort((a, z) => Math.hypot(b.cellCenter(o.side, a.x, a.y).x - q.x, b.cellCenter(o.side, a.x, a.y).y - q.y) - Math.hypot(b.cellCenter(o.side, z.x, z.y).x - q.x, b.cellCenter(o.side, z.x, z.y).y - q.y) || a.y - z.y || a.x - z.x);
    cells.push(own[0]);
  }
  D(b).traps = { side: o.side, t: T(4), cells, next: 0, atk: o.atk, pw: PW(o), by: o.cat };
  for (const c of cells) {
    const q = b.cellCenter(o.side, c.x, c.y);
    fx(o.events, 'mdpTrapSet', o.side, q.x, q.y, { path: -1 });
  }
  info(o.events, `${cells.length} TRAMPAS ESCONDIDAS (SOLO TÚ LAS VES)`, me.x, me.y - 160, 0xc8102e);
  return [];
}

// ---------------------------------------------------------------- Felinamente Rubia · OBJECTION SUSTAINED!
// She opens the case with a giant law book on the cat of theirs that put the most statuses on your side this battle
// (nobody yet: the one with the most meter): 0.7·P. And the objection: during their next 3 turns the first new status on
// a cat of yours is overruled and lands, the same, on every cat of theirs (rulesD.ts); unused, at the end: Maldito 2 on
// their strongest cat's cabin (turnD.ts).
function xp_felinamente(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const d = D(b);
  const foes = alive(b, enemy);
  const culprit = [...foes].sort((a, z) => (d.statusBy.get(z) ?? 0) - (d.statusBy.get(a) ?? 0) || z.ultCharge - a.ultCharge || (a.def.uid < z.def.uid ? -1 : 1))[0];
  const t = culprit ? b.roomCenter(enemy, culprit.room) : b.shipCenter(enemy);
  stamp(b, o, t.x, t.y);
  const paths: ShotPath[] = [];
  if (culprit) {
    const from = { x: t.x, y: -200 };
    const p = flight([from, ...line(from, t, 24)], 'magic', 'heavy');
    paths.push(p);
    b.hitCat(culprit, Math.round(o.atk * PW(o) * 0.7 * CAT_K), o.events, 0, p.points.length - 1, 'magic', true);
    fx(o.events, 'mdpBook', enemy, t.x, t.y, { uid: culprit.def.uid, path: 0, at: p.points.length - 1 });
  }
  d.objection = { side: o.side, t: T(3), used: false };
  const me = b.roomCenter(o.side, o.cat.room);
  info(o.events, '¡OBJECIÓN! EL PRIMER ESTADO QUE TE PONGAN SE LES REGRESA', me.x, me.y - 170, 0xf7a1c4);
  return paths;
}

// ---------------------------------------------------------------- Capitán Gorrimiau · THE COMPASS SAYS TUNA!
// The compass points to what he wants most: the rest of this turn and your 2 next, every cat shot and cannonball of
// your side bends in the air up to 2.5 cells toward the cabin of their cat with the most meter (nobody with meter: the
// core); walls still stop it. If that cat falls to one of your shots, he takes +50 meter (rulesD.ts).
function xp_gorrimiau(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const t = compassTarget(b, enemy);
  stamp(b, o, t.x, t.y);
  D(b).compass = { side: o.side, t: T(2, true), by: o.cat };
  const me = b.roomCenter(o.side, o.cat.room);
  fx(o.events, 'mdpCompass', o.side, me.x, me.y, { path: -1 });
  info(o.events, 'LA BRÚJULA APUNTA AL ATÚN: TUS TIROS SE CURVAN', t.x, t.y - 170, 0xc49a3c);
  return [];
}
/** where the compass points: their cat with the most meter (then the core) */
export function compassTarget(b: Battle, side: number): PathPoint & { cat?: CatState } {
  const c = alive(b, side)
    .filter((k) => k.ultCharge > 0)
    .sort((a, z) => z.ultCharge - a.ultCharge || (a.def.uid < z.def.uid ? -1 : 1))[0];
  return c ? { ...b.roomCenter(side, c.room), cat: c } : coreAt(b, side);
}

// ---------------------------------------------------------------- Doc Miauwn · FIX THE PAST!
// Back to the past to fix your mistakes: every cat shot or cannonball of yours that fell in the water this battle
// without touching their ship (the 10 most recent) comes back now, one after the other: 0.25·P at the point of their
// ship nearest to where it was going, with its element and its status. Fewer than 3: also a 0.6·P bolt on their core.
function xp_docmiauwn(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const misses = (peekD(b)?.misses ?? []).slice(-10);
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y, misses.length);
  const paths: ShotPath[] = [];
  const ship = b.sides[enemy].ship;
  for (const m of misses) {
    const near = ship
      .cells()
      .map((c) => ({ c, q: b.cellCenter(enemy, c.x, c.y) }))
      .sort((a, z) => Math.hypot(a.q.x - m.x, a.q.y - m.y) - Math.hypot(z.q.x - m.x, z.q.y - m.y) || a.c.y - z.c.y || a.c.x - z.c.x)[0];
    if (!near) break;
    const from = { x: m.x, y: Math.max(m.y, b.waterY) };
    const p = lob(b, o.side, from, near.q, 110, m.element);
    const shot: ShotDef = { id: 'md_pasado', name: 'DEL PASADO', element: m.element, trajectory: 'ballistic', power: PW(o) * 0.25, radius: CELL * 1.0, catMul: 0.5, statuses: m.statuses };
    b.resolvePaths(o.side, shot, o.atk, [p], o.events, paths.length);
    fx(o.events, 'mdpPast', enemy, from.x, from.y, { path: paths.length, at: 0 });
    paths.push(p);
  }
  if (misses.length < 3) {
    const t = coreAt(b, enemy);
    const from = { x: t.x - dirOf(o.side) * 120, y: -220 };
    const p = dash(b, o.side, from, t, 'electric', 'beam');
    const bolt = mk(o, 'md_rayo88', PW(o) * 0.6, { element: 'electric', trajectory: 'beam', radius: CELL * 1.1, statuses: [{ id: 'charged', turns: 2 }] });
    b.resolvePaths(o.side, bolt, o.atk, [p], o.events, paths.length);
    fx(o.events, 'mdpBolt', enemy, t.x, t.y, { path: paths.length, at: p.points.length - 1 });
    paths.push(p);
  }
  info(o.events, misses.length ? `¡${misses.length} TIROS FALLADOS REGRESAN!` : 'NADA QUE ARREGLAR: ¡1.21 GIGAMIAUS AL NÚCLEO!', ctr.x, ctr.y - 220, 0xff8c1a);
  return paths;
}

// ---------------------------------------------------------------- Pinkmiau · LAB PARTNER!
// Goggles on, flasks to the teacher: an opening flask (0.5·P, radius 1.5, Ardiendo 2 + Vapor 2), and the rest of this
// turn and your 2 next every blow of your side that touches their ship leaves Vapor 2 on the cells it touches besides
// its own status (rulesD.ts). With Heisenmiau in your crew, during that window and 2 turns more PURE CHEMISTRY counts
// every status twice (max 6 per cell).
function xp_pinkmiau(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const p0 = b.buildPaths(o.shot, o.origin, o.angle, o.power, o.wind, o.side)[0];
  const end = p0.points[p0.impacts.length ? p0.impacts[p0.impacts.length - 1] : p0.points.length - 1];
  const hit = b.cellAt(end.x, end.y);
  const t = hit && hit.side === enemy ? end : b.shipCenter(enemy);
  stamp(b, o, t.x, t.y);
  const p = lob(b, o.side, o.origin, t, 170, 'crystal');
  const flask = mk(o, 'md_matracito', PW(o) * 0.5, { element: 'fire', trajectory: 'ballistic', radius: CELL * 1.5, statuses: [{ id: 'burning', turns: 2 }, { id: 'steam', turns: 2 }] });
  b.resolvePaths(o.side, flask, o.atk, [p], o.events);
  const combo = alive(b, o.side).some((c) => c.def.catId === 'xp_heisenmiau');
  D(b).lab = { side: o.side, t: T(2, true), combo: T(combo ? 4 : 0, combo) };
  fx(o.events, 'mdpLab', enemy, t.x, t.y, { n: combo ? 1 : 0, path: 0, at: lastAt(p) });
  info(o.events, combo ? '¡CON EL PROFE! CADA ESTADO CUENTA DOBLE' : 'CADA GOLPE DEJA VAPOR (3 TURNOS)', t.x, t.y - 180, 0xf7a1c4, 0, lastAt(p));
  return [p];
}

// ---------------------------------------------------------------- Miauty la Fea · BALANCE SHEET!
// She balances the books: D = their ship's fraction of life − yours. D > 0: each cell of theirs loses D/2 of its max
// life (never the last point of it — the books don't break a cell; a core cell never more than half of what it has
// left) and each cell of yours not Borrada mends D/2 of its own (no revivals). D ≤ 0: interest — a 0.8·P folder blow on
// their core.
function xp_miauty(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const D0 = hullFrac(b, enemy) - hullFrac(b, o.side);
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y, Math.round(D0 * 100));
  if (D0 > 0) {
    const es = b.sides[enemy].ship;
    for (const c of es.cells()) {
      if (c.hp <= 1) continue;
      const core = c.module !== undefined && es.modules[c.module].kind === 'core';
      const loss = Math.min(c.maxHp * (D0 / 2), c.hp - 1, core ? Math.ceil(c.hp / 2) : Infinity);
      cut(b, enemy, c, loss, o.events, -1, 0);
    }
    let mended = 0;
    for (const c of b.sides[o.side].ship.cells()) {
      if (c.status.voided || c.hp >= c.maxHp) continue;
      const h = Math.min(c.maxHp - c.hp, Math.round(c.maxHp * (D0 / 2)));
      c.hp += h;
      mended += h;
    }
    fx(o.events, 'mdpBalance', enemy, ctr.x, ctr.y, { n: Math.round(D0 * 100), path: -1 });
    info(o.events, `CUENTAS CUADRADAS: −${Math.round(D0 * 50)} % A SU BARCO, +${Math.round(D0 * 50)} % AL TUYO`, ctr.x, ctr.y - 220, 0x6b4f2a);
    void mended;
    return [];
  }
  const t = coreAt(b, enemy);
  const p = lob(b, o.side, o.origin, t, 160, 'neutral');
  const folder = mk(o, 'md_carpetazo', PW(o) * 0.8, { element: 'neutral', trajectory: 'ballistic', radius: CELL * 1.2 });
  b.resolvePaths(o.side, folder, o.atk, [p], o.events);
  fx(o.events, 'mdpBalance', enemy, t.x, t.y, { n: 0, path: 0, at: lastAt(p) });
  info(o.events, 'VAS GANANDO: ¡INTERESES!', t.x, t.y - 170, 0x6b4f2a, 0, lastAt(p));
  return [p];
}

// ---------------------------------------------------------------- El Michíncipe · THE SHEEP IN THE BOX!
// He draws a box with three little holes — inside is exactly what you need, the first that applies: (1) your crew under
// 50 % of its total life: +30 % life to each cat of yours and one bad status off each; (2) they have cat shields,
// barriers, boosts or spare lives: all gone (barriers off for 2 of their turns) and 0.4·P on each module that had them;
// (3) else the sheep rams their core: 1.4·P through every shield, Flotando 1.
export function boxChoice(b: Battle, side: number): 1 | 2 | 3 {
  const own = b.sides[side].cats;
  const hp = own.reduce((a, c) => a + (c.ko ? 0 : Math.max(0, c.hp)), 0);
  const max = own.reduce((a, c) => a + c.maxHp, 0);
  if (max > 0 && hp < max * 0.5) return 1;
  const es = b.sides[1 - side];
  if (es.cats.some((c) => !c.ko && (c.shields > 0 || c.lives > 1)) || es.ward || es.bubble > 0 || es.bubbleMax > 0 || es.shieldHp > 0 || es.buffs.stone > 0 || es.buffs.empower > 0) return 2;
  return 3;
}
function xp_michincipe(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const es = b.sides[enemy];
  const pick = boxChoice(b, o.side);
  const me = b.roomCenter(o.side, o.cat.room);
  stamp(b, o, me.x, me.y, pick);
  if (pick === 1) {
    for (const c of alive(b, o.side)) {
      heal(c, c.maxHp * 0.3);
      const k = (['burning', 'frozen', 'shocked', 'wet'] as const).find((s) => c.fx[s] > 0);
      if (k) c.fx[k] = 0;
      else if (c.stunned > 0) c.stunned = 0;
    }
    fx(o.events, 'mdpBox', o.side, me.x, me.y, { n: 1, path: -1 });
    info(o.events, 'LA CAJA TRAE: ¡CURITAS PARA TODOS! (+30 %)', me.x, me.y - 170, 0xf2c94c);
    return [];
  }
  if (pick === 2) {
    const mods = new Set<number>();
    for (const c of es.cats) {
      if (c.ko) continue;
      if (c.shields > 0 || c.lives > 1) mods.add(c.room);
      c.shields = 0;
      if (c.lives > 1) c.lives = 1;
    }
    es.buffs.stone = 0;
    es.buffs.empower = 0;
    for (const m of es.ship.modules) if (m.alive && (m.kind === 'shield' || m.kind === 'arcane')) mods.add(m.id);
    const st = S(b);
    if (!st.unmask && (es.ward || es.bubbleMax > 0 || es.shieldHp > 0)) {
      st.unmask = { side: enemy, t: T(2), ward: es.ward, bubbleMax: es.bubbleMax, shieldHp: es.shieldHp };
      es.ward = null;
      es.bubble = 0;
      es.bubbleMax = 0;
      es.shieldHp = 0;
    }
    const paths: ShotPath[] = [];
    const hit = mk(o, 'md_cordero', PW(o) * 0.4, { element: 'light', trajectory: 'ballistic', radius: CELL * 0.9 });
    for (const id of [...mods].sort((a, z) => a - z)) {
      const t = b.roomCenter(enemy, id);
      paths.push(lob(b, o.side, o.origin, t, 140, 'light'));
    }
    b.resolvePaths(o.side, hit, o.atk, paths, o.events);
    const c = b.shipCenter(enemy);
    fx(o.events, 'mdpBox', enemy, c.x, c.y, { n: 2, path: -1 });
    info(o.events, 'LA CAJA TRAE: ¡SIN ESCUDOS NI BARRERAS!', c.x, c.y - 200, 0xf2c94c);
    return paths;
  }
  const t = coreAt(b, enemy);
  const p = dash(b, o.side, o.origin, t, 'light', 'beam');
  const ram = mk(o, 'md_borrego', PW(o) * 1.4, { element: 'light', trajectory: 'beam', radius: CELL * 1.2, statuses: [{ id: 'grav', turns: 1 }] });
  bare(b, enemy, () => b.resolvePaths(o.side, ram, o.atk, [p], o.events));
  fx(o.events, 'mdpBox', enemy, t.x, t.y, { n: 3, path: 0, at: lastAt(p) });
  info(o.events, 'LA CAJA TRAE: ¡EL BORREGO EMBISTE!', t.x, t.y - 170, 0xf2c94c, 0, lastAt(p));
  return [p];
}

// ---------------------------------------------------------------- Ricardo Garjona · THE STORY GOES ON!
// A story that never ends: every timed effect of your side (your post powers' windows and guards, your Parte III
// powers' clocks, your boosts) and every status your side left on their ship and cats lasts 2 turns more (stuns don't:
// no turn lock). A verse of 3 × 0.35·P on their 3 cabins with the most meter (Enraizado 1), and the cat of theirs that
// hurt you the most (nobody yet: the strongest) stays MARKED 3 turns: your shots at it ×1.25.
function xp_garjona(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, shipTop(b, enemy));
  const n = storyGoesOn(b, o.side, 2);
  const es = b.sides[enemy];
  const lit: Cell[] = [];
  for (const c of es.ship.cells()) {
    let any = false;
    for (const k of Object.keys(c.status) as StatusId[]) {
      if (k === 'voided' || !c.status[k]) continue;
      c.status[k] = Math.min(20, (c.status[k] ?? 0) + 2);
      any = true;
    }
    if (any) lit.push(c);
  }
  for (const c of alive(b, enemy)) for (const k of ['burning', 'shocked', 'wet', 'frozen'] as const) if (c.fx[k] > 0) c.fx[k] = Math.min(20, c.fx[k] + 2);
  // the verse
  const rooms = alive(b, enemy)
    .sort((a, z) => z.ultCharge - a.ultCharge || (a.def.uid < z.def.uid ? -1 : 1))
    .map((c) => c.room)
    .filter((r, i, all) => all.indexOf(r) === i)
    .slice(0, 3);
  const paths = rooms.map((r) => lob(b, o.side, o.origin, b.roomCenter(enemy, r), 150, 'sound'));
  const verse = mk(o, 'md_estrofa', PW(o) * 0.35, { element: 'sound', trajectory: 'ballistic', radius: CELL * 1.0, statuses: [{ id: 'rooted', turns: 1 }] });
  b.resolvePaths(o.side, verse, o.atk, paths, o.events);
  // the cat that hurt you the most is marked
  const d = D(b);
  const foes = alive(b, enemy);
  const worst = [...foes].sort((a, z) => (d.hurtBy.get(z) ?? 0) - (d.hurtBy.get(a) ?? 0) || z.def.atk - a.def.atk || (a.def.uid < z.def.uid ? -1 : 1))[0] ?? strongest(b, enemy);
  if (worst) {
    d.marked.set(worst, T(3));
    const p = b.roomCenter(enemy, worst.room);
    fx(o.events, 'mdpMarked', enemy, p.x, p.y, { uid: worst.def.uid, path: -1 });
  }
  const k = n + lit.length;
  info(o.events, k ? `LA HISTORIA SIGUE: +2 TURNOS A ${k} ${k === 1 ? 'COSA' : 'COSAS'}` : 'LA HISTORIA SIGUE (Y APENAS EMPIEZA)', ctr.x, ctr.y - 220, 0xd4a017);
  return paths;
}
/** +n turns to every timed effect the side owns (post powers, tanda 2, the Parte III's, its boosts); how many it found */
export function storyGoesOn(b: Battle, side: number, n: number): number {
  const foe = 1 - side;
  let k = 0;
  const add = (t: Timer | null | undefined) => {
    if (t && on(t)) {
      t.next += n;
      k++;
    }
  };
  const st = S(b);
  // windows and guards of yours
  add(st.rubber[side]);
  add(st.alloy[side]);
  add(st.tele[side]);
  add(st.chill[side]);
  add(st.portals[side]);
  for (const c of st.clones) if (c.side === side) add(c.t);
  if (st.bananas?.side === side) add(st.bananas.t);
  if (st.shield?.side === side) add(st.shield.t);
  if (st.undercover?.side === side) add(st.undercover.t);
  if (st.catch?.side === side) add(st.catch.t);
  if (st.high?.side === side) {
    add(st.high.mine);
    add(st.high.theirs);
  }
  if (st.heart?.side === side) add(st.heart.t);
  if (st.counter?.side === side) add(st.counter.t);
  if (st.copy?.side === side) add(st.copy.t);
  for (const [c, u] of st.upgrade) if (c.side === side) add(u.t);
  for (const [c, r] of st.regen) if (c.side === side && r > 0) {
    st.regen.set(c, r + n);
    k++;
  }
  if (st.pyramid?.side === side) {
    st.pyramid.turns += n;
    k++;
  }
  if (st.punch?.side === side) {
    st.punch.volleys += n;
    k++;
  }
  // what you left on them
  if (st.swamp?.side === foe) add(st.swamp.t);
  if (st.decree?.side === foe) add(st.decree.t);
  if (st.piranhas?.side === foe) add(st.piranhas.t);
  if (st.cake?.side === foe) add(st.cake.t);
  if (st.night?.side === foe) add(st.night.t);
  if (st.flips?.side === foe) add(st.flips.t);
  if (st.unmask?.side === foe) add(st.unmask.t);
  for (const [c, x] of st.shrink) if (c.side === foe) add(x.t);
  for (const [c, x] of st.love) if (c.side === foe) add(x.t);
  for (const [c, t] of st.exposed) if (c.side === foe) add(t);
  // tanda 2
  const d = st.d;
  if (d) {
    if (d.braid?.side === side) add(d.braid.t);
    if (d.wind?.side === side) add(d.wind.t);
    if (d.guard?.side === side && !d.guard.done) add(d.guard.t);
    if (d.conquest?.side === side) add(d.conquest.t);
    for (const [c, t] of d.codex) if (c.side === side) add(t);
    if (d.light?.side === side) {
      d.light.turns += n;
      k++;
    }
    if (d.gravity?.side === side) {
      add(d.gravity.mine);
      add(d.gravity.theirs);
    }
    if (d.encore?.side === side) add(d.encore.t);
    if (d.traps?.side === side) add(d.traps.t);
    if (d.objection?.side === side && !d.objection.used) add(d.objection.t);
    if (d.compass?.side === side) add(d.compass.t);
    if (d.lab?.side === side) {
      add(d.lab.t);
      add(d.lab.combo);
    }
    for (const [c, t] of d.marked) if (c.side === foe) add(t);
  }
  // the Parte III's clocks of that side
  k += mdExtendOwn(b, side, n);
  // the side's own boosts (Gea's stone, the Eclipse's flash) and the blindness it left on them
  const s = b.sides[side];
  if (s.buffs.stone > 0) {
    s.buffs.stone += n;
    k++;
  }
  if (b.sides[foe].buffs.blind > 0) {
    b.sides[foe].buffs.blind += n;
    k++;
  }
  void vsBoss;
  return k;
}

// ---------------------------------------------------------------- Shakimiau · SEISMIC DANCE!
// She dances so hard the sea shakes: 0.1·P on every cell of theirs, then every cell under 30 % of its life crumbles —
// from the top down, never one that holds something up (no free collapses) and a core cell never more than half of
// what it had left. Inside the cap.
function xp_shakimiau(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const ship = b.sides[enemy].ship;
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y);
  const P = o.atk * PW(o) * DMG_K;
  for (const c of ship.cells().sort((a, z) => a.y - z.y || a.x - z.x)) {
    if (c.hp <= 0) continue;
    cut(b, enemy, c, P * 0.1, o.events, -1, 0);
  }
  collapse(b, enemy, o.events, -1, 0);
  const weak = ship
    .cells()
    .filter((c) => c.hp > 0 && c.hp < c.maxHp * 0.3)
    .sort((a, z) => a.y - z.y || a.x - z.x);
  const n = breakSafely(b, enemy, weak, o.events, -1, 0);
  collapse(b, enemy, o.events, -1, 0);
  fx(o.events, 'mdpQuake', enemy, ctr.x, ctr.y, { n, path: -1 });
  info(o.events, n ? `¡TERREMOTO! ${n} CELDAS SE DERRUMBAN` : '¡TERREMOTO! (EL BARCO AGUANTA)', ctr.x, ctr.y - 220, 0xe0a030);
  return [];
}

// ---------------------------------------------------------------- Miaucol Yordan · DUNK FROM THE LINE!
// From the free-throw line, over everything, onto their core: 0.9·P + 0.35·P per ring (a cat of theirs your side
// knocked out this battle, max 6), over the walls in front (no cell stops it), through one shield layer. No rings:
// the dunk also stuns their cat with the most meter.
function xp_miaucol(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const es = b.sides[enemy];
  const rings = Math.min(6, es.cats.filter((c) => c.ko).length);
  const t = coreAt(b, enemy);
  stamp(b, o, t.x, t.y, rings);
  const top = { x: (o.origin.x + t.x) / 2, y: Math.min(shipTop(b, enemy), shipTop(b, o.side)) - CELL * 6 };
  const pts = [o.origin, ...hop(o.origin, top, 40, 18), ...line(top, t, 16)];
  const p: ShotPath = { points: pts, element: 'neutral', kind: 'ballistic', impacts: [pts.length - 1], owners: [o.side] };
  const dunk = mk(o, 'md_clavada', PW(o) * (0.9 + 0.35 * rings), { element: 'neutral', trajectory: 'ballistic', radius: CELL * 1.2 });
  // one shield layer down for the dunk (the bubble first, then the ward, then the shield's life)
  // (the layer it goes over stays as it was: it was jumped, not broken)
  const layer = es.bubble > 0 ? 'bubble' : es.ward ? 'ward' : es.shieldHp > 0 ? 'shieldHp' : null;
  const keep = { bubble: es.bubble, ward: es.ward, shieldHp: es.shieldHp };
  if (layer === 'bubble') es.bubble = 0;
  else if (layer === 'ward') es.ward = null;
  else if (layer === 'shieldHp') es.shieldHp = 0;
  try {
    b.resolvePaths(o.side, dunk, o.atk, [p], o.events);
  } finally {
    if (layer === 'bubble') es.bubble = keep.bubble;
    else if (layer === 'ward') es.ward = keep.ward;
    else if (layer === 'shieldHp') es.shieldHp = keep.shieldHp;
  }
  if (!rings) {
    const c = alive(b, enemy).sort((a, z) => z.ultCharge - a.ultCharge || (a.def.uid < z.def.uid ? -1 : 1))[0];
    if (c) {
      stun(b, c, 2);
      const q = b.roomCenter(enemy, c.room);
      info(o.events, '¡SE QUEDÓ VIENDO EL CLAVADO!', q.x, q.y - 110, 0xce1141, 0, lastAt(p));
    }
  }
  fx(o.events, 'mdpDunk', enemy, t.x, t.y, { n: rings, path: 0, at: lastAt(p) });
  return [p];
}

export { cabin, fracOf, mark, peekD };
