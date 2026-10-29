/**
 * After the Parte III · post MULTIDIMENSIONAL powers 1–20 (anime, books, the neighbourhood, the comic strip). Design:
 * docs/post-p3/01-roster.md / 04-roster.json → post.power (DISEÑO); what changed and why: docs/post-p3/agentes/PODERES-2.md.
 * `P` = the power's unit (attack × the ultimate's multiplier, kit.PW). Every power runs inside sim.fire with the 45 %
 * (bosses 18 %) structure budget already set. The rules they leave on the field live in kit.ts (state), hooks.ts (during
 * a shot), turn.ts (at a turn's start) and hud.ts (the AI's timing and the chips).
 */
import type { Battle, PathPoint, ShotPath } from '../sim';
import { CAT_K, DMG_K } from '../sim';
import type { Cell } from '../ship';
import type { ShotDef } from '../types';
import type { UltCtx } from '../ults';
import { clamp, collapse, cut, landing, normal, shipSpan, shipTop } from '../ults';
import {
  CELL,
  PW,
  S,
  T,
  alive,
  bestModules,
  cellNear,
  dash,
  deck,
  dirOf,
  drawn,
  fx,
  heal,
  hop,
  hurtable,
  info,
  isBossCaptain,
  lastAt,
  line,
  lob,
  mk,
  moduleNear,
  stamp,
  strongest,
  stun,
  surfaceY,
  vsBoss,
} from './kit';

export function ultsA() {
  return {
    xp_gomitas,
    xp_kagebunyan,
    xp_gatojo,
    xp_unzarpazo,
    xp_pegaso,
    xp_michiatom,
    xp_mazingato,
    xp_ryumiau,
    xp_miaunya,
    xp_yugi,
    xp_gatote,
    xp_sherlock,
    xp_frankengato,
    xp_gatula,
    xp_ahab,
    xp_pinomichi,
    xp_michipulin,
    xp_barril,
    xp_miaufalda,
    xp_condorgato,
  };
}

/** the module under (or nearest) where the plain ultimate would land */
export function aimedModule(b: Battle, o: UltCtx) {
  const enemy = 1 - o.side;
  const tgt = landing(b, o);
  const hit = b.cellAt(tgt.x, tgt.y);
  if (hit && hit.side === enemy && hit.cell.module !== undefined) {
    const m = b.sides[enemy].ship.modules[hit.cell.module];
    if (m.alive) return m;
  }
  return moduleNear(b, enemy, tgt);
}
/** points spread over a ship (golden-angle sampling of its live cells) — meteors, confetti, bubbles */
export function spreadCells(b: Battle, side: number, n: number): Cell[] {
  const cells = b.sides[side].ship.cells().sort((a, z) => a.x - z.x || a.y - z.y);
  if (!cells.length) return [];
  return Array.from({ length: n }, (_, i) => cells[Math.floor((((i * 0.6180339887) % 1) + 1) % 1 * cells.length)]);
}

// ---------------------------------------------------------------- Gomitas D. Michi · CATLING GUN!
// Twelve rubber punches fanned over their whole deck, and your crew turns to RUBBER for their next 2 turns: their
// beams (rayo), rocks (roca) and waves (onda) — Storm, Earth and Sound blows — bounce off your cats and cells.
function xp_gomitas(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const top = deck(b, enemy);
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, shipTop(b, enemy));
  const punch = mk(o, 'md_punetazo', PW(o) * 0.12, { element: 'water', trajectory: 'beam', radius: CELL * 1.0, statuses: [{ id: 'wet', turns: 2 }] });
  const paths: ShotPath[] = [];
  for (let i = 0; i < 12 && top.length; i++) {
    const c = top[Math.min(top.length - 1, Math.floor(((i + 0.5) / 12) * top.length))];
    const t = b.cellCenter(enemy, c.x, c.y);
    // the arm stretches in a fan (a little arc above the line) and lands on the deck
    const from = { x: o.origin.x, y: o.origin.y - 6 - (i % 4) * 6 };
    const pts = [from, ...hop(from, t, 40 + (i % 3) * 30, 15)];
    paths.push(drawn(b, o.side, pts, 'water', 'beam', [pts.length - 1]));
  }
  b.resolvePaths(o.side, punch, o.atk, paths, o.events);
  S(b).rubber[o.side] = T(2);
  const me = b.shipCenter(o.side);
  fx(o.events, 'mdpRubber', o.side, me.x, me.y, { n: 2, path: 0, at: lastAt(paths[0]) });
  return paths;
}

// ---------------------------------------------------------------- Kagebunyan · NYAN CLONE PARADE!
// Three shadow clones over your cabins (the strongest cats first): each swallows whole the next blow that lands on its
// cabin and blows up back at them (0.5·P at their cell nearest the line of that shot). 3 of their turns, or until popped.
function xp_kagebunyan(b: Battle, o: UltCtx): ShotPath[] {
  const own = alive(b, o.side).sort((a, z) => z.def.atk - a.def.atk || (a.def.uid < z.def.uid ? -1 : 1));
  const me = b.roomCenter(o.side, o.cat.room);
  stamp(b, o, me.x, me.y);
  const st = S(b);
  st.clones = st.clones.filter((k) => k.side !== o.side);
  own.slice(0, 3).forEach((c, i) => {
    st.clones.push({ side: o.side, room: c.room, t: T(3), atk: o.atk, pw: PW(o), by: o.cat });
    const p = b.roomCenter(o.side, c.room);
    fx(o.events, 'mdpClone', o.side, p.x, p.y, { n: i, uid: c.def.uid, path: -1 });
  });
  return [];
}

// ---------------------------------------------------------------- Gatojo · THE MIAURLD!
// Time stops: their whole ship (cats and cannons) misses its next turn, and every shot of yours this turn and next hangs
// in the air — when time comes back, they all land at once ×1.3 (a boss captain's ship: ×1.15).
function xp_gatojo(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y);
  const st = S(b);
  st.timeStop = { side: enemy, waits: 2, mul: vsBoss(b, enemy) ? 1.15 : 1.3, stored: [] };
  st.benchNext[enemy] = Math.max(st.benchNext[enemy], 1);
  fx(o.events, 'mdpZaWarudo', enemy, ctr.x, ctr.y, { n: 1, path: -1 });
  info(o.events, 'EL TIEMPO SE DETIENE: SU PRÓXIMO TURNO NO PASA', ctr.x, ctr.y - 220, 0xe6c34a);
  return [];
}

// ---------------------------------------------------------------- Un Zarpazo · SERIOUS PAW!
// One serious paw: the module where you aimed DISAPPEARS whole, whatever its life (the 45 % / 18 % cap still holds).
// The core only loses half of what it has left: the design's «core at 1» meant the very next blow there (the cannons of
// that same turn) ended any fight on the spot — the Parte III keeps its core-erasers off the core for the same reason
// (Cheshire never bites it; Garbancito takes 60 %). Then he gets bored: he doesn't act his next turn.
function xp_unzarpazo(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const es = b.sides[enemy];
  const m = aimedModule(b, o);
  const t = m ? b.roomCenter(enemy, m.id) : b.shipCenter(enemy);
  stamp(b, o, t.x, t.y);
  const p = dash(b, o.side, o.origin, t, 'earth', 'heavy');
  p.impacts = [];
  p.owners = [];
  const at = p.points.length - 1;
  if (m) {
    for (const c of es.ship.moduleCells(m.id)) {
      if (c.hp <= 0 || !hurtable(b, enemy, c)) continue;
      cut(b, enemy, c, m.kind === 'core' ? Math.min(c.hp - 1, Math.ceil(c.hp / 2)) : c.hp, o.events, 0, at);
    }
    collapse(b, enemy, o.events, 0, at);
    fx(o.events, 'mdpSerious', enemy, t.x, t.y, { n: m.kind === 'core' ? 1 : 0, path: 0, at });
  }
  o.cat.stunned = Math.max(o.cat.stunned, 2);
  const me = b.roomCenter(o.side, o.cat.room);
  info(o.events, '…OK. (SE ABURRIÓ: SU PRÓXIMO TURNO NO HACE NADA)', me.x, me.y - 120, 0xffd23f, 0, at);
  return [p];
}

// ---------------------------------------------------------------- Michi de Pegaso · PEGASUS MEOWTEOR!
// A hundred paw meteors (twenty blows, 0.06·P each) across their ship, and YOUR COSMOS BURNS: × (1 + 1.5 × the life
// your crew has lost), up to ×2.5.
function xp_pegaso(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const own = b.sides[o.side].cats;
  const max = own.reduce((a, c) => a + c.maxHp, 0);
  const lost = own.reduce((a, c) => a + (c.maxHp - Math.max(0, c.hp)), 0);
  const mul = Math.min(2.5, 1 + (1.5 * lost) / Math.max(1, max));
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, shipTop(b, enemy) - CELL * 2, Math.round(mul * 100));
  const meteor = mk(o, 'md_meteoro', PW(o) * 0.06 * mul, { element: 'cosmic', trajectory: 'ray', radius: CELL * 0.9, gravityScale: 0, windScale: 0 });
  const dir = dirOf(o.side);
  const paths = spreadCells(b, enemy, 20).map((c, i) => {
    const t = b.cellCenter(enemy, c.x, c.y);
    const from = { x: t.x - dir * (120 + (i % 5) * 30), y: -140 - (i % 4) * 50 };
    return b.integrate(meteor, from, Math.atan2(t.y - from.y, t.x - from.x), 1300, 0, o.side);
  });
  b.resolvePaths(o.side, meteor, o.atk, paths, o.events);
  fx(o.events, 'mdpCosmos', enemy, ctr.x, ctr.y, { n: Math.round(mul * 100), path: 0, at: lastAt(paths[0]) });
  return paths;
}

// ---------------------------------------------------------------- Michi Atom · INFINITE PITCH SHOT!
// He kicks and the ball runs off down a pitch that never ends: it takes TWO turns to land (at the start of your second
// turn from now), ×3 with twice his shot's radius on the module you aimed at (or the nearest one), and leaves its cat
// EXPUESTO (takes ×1.5) 2 turns.
function xp_michiatom(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const m = aimedModule(b, o);
  const t = m ? b.roomCenter(enemy, m.id) : b.shipCenter(enemy);
  stamp(b, o, t.x, t.y);
  const dir = dirOf(o.side);
  // up, up and away: off the top of the screen
  const up = { x: o.origin.x + dir * 420, y: -520 };
  const p = drawn(b, o.side, [o.origin, ...hop(o.origin, up, 160, 16)], 'earth', 'ballistic', []);
  if (m) S(b).atom.push({ side: o.side, cat: o.cat, atk: o.atk, pw: PW(o), module: m.id, turns: 2, radius: o.cat.def.shot.radius * 2, shot: o.shot });
  fx(o.events, 'mdpKick', o.side, o.origin.x, o.origin.y, { n: 2, path: 0, at: p.points.length - 1 });
  info(o.events, 'EL BALÓN LLEGA EN 2 TURNOS…', t.x, t.y - 160, 0x3a7bd5, 0, p.points.length - 1);
  return [p];
}

// ---------------------------------------------------------------- Mazingato Z · ROCKET PAWNCH!
// Two rocket fists (where you aimed, and their best module) and a chest beam into their core (Ardiendo). And his ALLOY
// ARMOR spreads: their next 3 turns, no single blow takes more than 20 % of a cat of yours' max life.
function xp_mazingato(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const es = b.sides[enemy];
  const tgt = landing(b, o);
  const first = moduleNear(b, enemy, tgt);
  const second = bestModules(b, enemy, 2).find((m) => m.id !== first?.id) ?? first;
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y);
  const fist = mk(o, 'md_puno_cohete', PW(o) * 0.45, { element: 'fire', trajectory: 'ballistic', radius: CELL * 1.3 });
  const aims = [first, second].map((m) => (m ? b.roomCenter(enemy, m.id) : ctr));
  const paths = aims.map((t, i) => lob(b, o.side, { x: o.origin.x, y: o.origin.y - 10 - i * 16 }, t, 70 + i * 40, 'fire', 'ballistic'));
  b.resolvePaths(o.side, fist, o.atk, paths, o.events);
  const core = es.ship.modules.find((m) => m.kind === 'core' && m.alive);
  const ct = core ? b.roomCenter(enemy, core.id) : ctr;
  const beam = mk(o, 'md_rayo_pecho', PW(o) * 0.4, { element: 'fire', trajectory: 'ray', pierce: 3, pierceMul: 0.8, radius: CELL * 1.1, gravityScale: 0, windScale: 0, statuses: [{ id: 'burning', turns: 2 }] });
  const from = { x: o.origin.x, y: o.origin.y + 10 };
  const bp = b.integrate(beam, from, Math.atan2(ct.y - from.y, ct.x - from.x), 1300, 0, o.side);
  b.resolvePaths(o.side, beam, o.atk, [bp], o.events, paths.length);
  paths.push(bp);
  S(b).alloy[o.side] = T(3);
  const me = b.shipCenter(o.side);
  fx(o.events, 'mdpAlloy', o.side, me.x, me.y, { n: 3, path: 0, at: lastAt(paths[0]) });
  return paths;
}

// ---------------------------------------------------------------- Ryumiau · NOTE OF NINE LIVES!
// He writes a name: their cat with the most life is NOTED, and at the start of your third turn from now it falls, come
// what may (shields and spare lives don't count). A boss captain doesn't fall: it loses 40 % of its max life. If the
// noted one falls first, the notebook moves to the next with the most life.
function xp_ryumiau(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const target = alive(b, enemy).sort((a, z) => z.hp - a.hp || z.def.atk - a.def.atk)[0];
  const t = target ? b.roomCenter(enemy, target.room) : b.shipCenter(enemy);
  stamp(b, o, t.x, t.y);
  if (target) {
    S(b).note = { side: o.side, target, turns: 3, by: o.cat };
    fx(o.events, 'mdpNote', enemy, t.x, t.y, { n: 3, uid: target.def.uid, path: -1 });
    info(o.events, `ANOTADO: ${target.def.name.toUpperCase()} · 3…`, t.x, t.y - 150, 0xe8e8e8);
  }
  return [];
}

// ---------------------------------------------------------------- Miaunya · TELEPATHY PEANUTS!
// She reads her crew's minds: their next 2 turns, your cats see every cat shot coming and dodge it (no life lost; the
// structure still takes the blow — cannons and ultimates aren't read).
function xp_miaunya(b: Battle, o: UltCtx): ShotPath[] {
  const me = b.shipCenter(o.side);
  stamp(b, o, me.x, me.y);
  S(b).tele[o.side] = T(2);
  fx(o.events, 'mdpRead', o.side, me.x, me.y, { n: 2, path: -1 });
  return [];
}

// ---------------------------------------------------------------- Yugi Miauto · FORBIDDEN FIVE!
// He plays all his PIECES (each normal shot of his that lands on their ship gives one, up to 5): the blow hits
// ×(1 + 0.4 per piece). With all five the forbidden giant comes together whole and hits EVERY module of their ship.
function xp_yugi(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const st = S(b);
  const n = Math.min(5, st.pieces.get(o.cat) ?? 0);
  st.pieces.set(o.cat, 0);
  const tgt = landing(b, o);
  stamp(b, o, tgt.x, tgt.y, n);
  fx(o.events, 'mdpPieces', o.side, o.origin.x, o.origin.y, { n, path: -1 });
  const paths = normal(b, o, { ...o.shot, power: PW(o) * (1 + 0.4 * n) });
  if (n >= 5) {
    const fist = mk(o, 'md_prohibido', PW(o) * 0.35, { element: 'void', trajectory: 'ballistic', radius: CELL * 0.8 });
    const dir = dirOf(o.side);
    const mods = b.sides[enemy].ship.modules.filter((m) => m.alive && b.sides[enemy].ship.moduleCells(m.id).length);
    const giant = mods.map((m, i) => {
      const t = b.roomCenter(enemy, m.id);
      const from = { x: t.x - dir * 60, y: -300 - (i % 3) * 40 };
      return dash(b, o.side, from, t, 'void', 'ballistic');
    });
    b.resolvePaths(o.side, fist, o.atk, giant, o.events, paths.length);
    const ctr = b.shipCenter(enemy);
    fx(o.events, 'mdpExodia', enemy, ctr.x, shipTop(b, enemy), { path: paths.length, at: giant.length ? giant[0].points.length - 1 : 0 });
    paths.push(...giant);
  }
  return paths;
}

// ---------------------------------------------------------------- Don Gatote de la Mancha · CHARGE OF THE WINDMILLS!
// A lance charge dead straight along the whole row you aimed at, end to end (0.25·P every cell). ×2 when their ship
// stands better than yours (the more impossible the fight, the harder). A mast or an engine in that row: «¡GIGANTE!» —
// the lance sticks and he loses his next turn (the blow lands anyway).
function xp_gatote(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const es = b.sides[enemy];
  const tgt = landing(b, o);
  const span = shipSpan(b, enemy);
  const rowCells = (r: number) => es.ship.cells().filter((c) => c.y === r);
  let row = clamp(b.toGrid(enemy, clamp(tgt.x, span.x0, span.x1), tgt.y).y, 0, es.ship.rows - 1);
  for (let k = 0; k < es.ship.rows && !rowCells(row).length; k++) row = (row + 1) % es.ship.rows;
  const dir = dirOf(o.side);
  const cells = rowCells(row).sort((a, z) => dir * (b.cellCenter(enemy, a.x, a.y).x - b.cellCenter(enemy, z.x, z.y).x));
  const y = es.setup.origin.y + row * CELL + CELL / 2;
  const losing = b.hullPct(enemy) > b.hullPct(o.side);
  const start = { x: (dir > 0 ? span.x0 : span.x1) - dir * CELL * 3, y };
  stamp(b, o, (span.x0 + span.x1) / 2, y, losing ? 2 : 1);
  const pts: PathPoint[] = [o.origin, ...hop(o.origin, start, 120, 14)];
  const at: number[] = [];
  let prev = start;
  for (const c of cells) {
    const q = b.cellCenter(enemy, c.x, c.y);
    pts.push(...line(prev, q, 10));
    at.push(pts.length - 1);
    prev = q;
  }
  pts.push(...line(prev, { x: (dir > 0 ? span.x1 : span.x0) + dir * CELL * 2, y }, 12));
  const lance = mk(o, 'md_lanza', PW(o) * 0.25 * (losing ? 2 : 1), { element: 'earth', trajectory: 'ballistic', radius: CELL * 0.45 });
  const p = drawn(b, o.side, pts, 'earth', 'ballistic', at);
  const giant = cells.find((c) => c.module !== undefined && ['mast', 'engine'].includes(es.ship.modules[c.module].kind));
  const gAt = giant ? at[cells.indexOf(giant)] : -1;
  b.resolvePaths(o.side, lance, o.atk, [p], o.events);
  fx(o.events, 'mdpLance', enemy, start.x, y, { n: losing ? 2 : 1, path: 0, at: at[0] ?? 0 });
  if (losing) info(o.events, '¡ENTRE MÁS IMPOSIBLE, MÁS FUERTE! x2', start.x, y - 120, 0xc9b17a, 0, at[0] ?? 0);
  if (giant) {
    o.cat.stunned = Math.max(o.cat.stunned, 2);
    fx(o.events, 'mdpGiant', enemy, pts[gAt].x, pts[gAt].y, { path: 0, at: gAt });
  }
  return [p];
}

// ---------------------------------------------------------------- Sherlock Ronrones · THE GAME IS AFOOT!
// Deduction: their ship laid bare and their 3 weakest points MARKED (the cells with the least life left in a core, a
// cabin with a cat or a cannon): a blow there is a sure critical (×1.5) until it's hit. And your next volley doesn't
// follow your cat: each cannon goes straight for one of those 3 points.
function xp_sherlock(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const es = b.sides[enemy];
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y);
  const valuable = (c: Cell) => {
    if (c.module === undefined) return false;
    const m = es.ship.modules[c.module];
    return m.alive && (m.kind === 'core' || m.kind === 'cannon' || (m.kind === 'catroom' && es.cats.some((k) => k.room === m.id && !k.ko)));
  };
  const pool = es.ship
    .cells()
    .filter((c) => valuable(c) && hurtable(b, enemy, c))
    .sort((a, z) => a.hp / a.maxHp - z.hp / z.maxHp || a.hp - z.hp || a.y - z.y || a.x - z.x);
  const picked: Cell[] = [];
  const used = new Set<number>();
  // three points in three different modules when it can
  for (const c of pool) if (picked.length < 3 && !used.has(c.module!)) (picked.push(c), used.add(c.module!));
  for (const c of pool) if (picked.length < 3 && !picked.includes(c)) picked.push(c);
  S(b).marks = { side: enemy, cells: picked, volley: true, next: 0 };
  picked.forEach((c, i) => {
    const q = b.cellCenter(enemy, c.x, c.y);
    fx(o.events, 'mdpMark', enemy, q.x, q.y, { n: i, path: -1 });
  });
  info(o.events, 'ELEMENTAL: TU ANDANADA VA A SUS 3 PUNTOS DÉBILES', ctr.x, ctr.y - 220, 0xc9a66b);
  return [];
}

// ---------------------------------------------------------------- Frankengato · SPARK OF NINE LIVES!
// Lightning strikes your ship: your strongest fallen cat gets up with 50 % life and a full meter (in its cabin if it
// still stands, else the nearest free one). If nobody has fallen, the bolt chains through 5 of their cells (Cargado).
function xp_frankengato(b: Battle, o: UltCtx): ShotPath[] {
  const own = b.sides[o.side];
  const enemy = 1 - o.side;
  const fallen = own.cats.filter((c) => c.ko).sort((a, z) => z.def.atk - a.def.atk || (a.def.uid < z.def.uid ? -1 : 1))[0];
  if (fallen) {
    const room = own.ship.modules[fallen.room];
    if (!room.alive || !own.ship.moduleCells(room.id).length) {
      const free = own.ship.modules
        .filter((m) => m.kind === 'catroom' && m.alive && !own.cats.some((c) => c.room === m.id && !c.ko))
        .sort((a, z) => Math.hypot(a.x - room.x, a.y - room.y) - Math.hypot(z.x - room.x, z.y - room.y) || a.id - z.id)[0];
      if (free) fallen.room = free.id;
    }
    const p = b.roomCenter(o.side, fallen.room);
    stamp(b, o, p.x, p.y, 1);
    fallen.ko = false;
    fallen.hp = Math.max(1, Math.round(fallen.maxHp * 0.5));
    fallen.lives = Math.max(1, fallen.lives);
    fallen.ultCharge = 1;
    fallen.stunned = 0;
    fallen.cooldown = 0;
    fallen.overboard = false;
    fallen.exposed = !own.ship.modules[fallen.room].alive;
    fallen.fx = { burning: 0, shocked: 0, wet: 0, frozen: 0 };
    const pts = [{ x: p.x + 40, y: -320 }, ...line({ x: p.x + 40, y: -320 }, { x: p.x, y: p.y - 30 }, 16)];
    const bolt: ShotPath = { points: pts, element: 'electric', kind: 'beam', impacts: [], owners: [] };
    fx(o.events, 'mdpRevive', o.side, p.x, p.y, { uid: fallen.def.uid, path: 0, at: pts.length - 1 });
    info(o.events, `¡ESTÁ VIVO! ${fallen.def.name.toUpperCase()} SE LEVANTA`, p.x, p.y - 160, 0xf2d24b, 0, pts.length - 1);
    return [bolt];
  }
  // nobody to raise: the bolt chains through five of their cells
  const es = b.sides[enemy];
  const tgt = landing(b, o);
  const start = cellNear(b, enemy, tgt);
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y, 0);
  if (!start) return [];
  const chain: Cell[] = [start];
  const seen = new Set<Cell>([start]);
  while (chain.length < 5) {
    const cur = chain[chain.length - 1];
    const next = es.ship
      .cells()
      .filter((c) => !seen.has(c))
      .sort((a, z) => Math.hypot(a.x - cur.x, a.y - cur.y) - Math.hypot(z.x - cur.x, z.y - cur.y) || a.y - z.y || a.x - z.x)[0];
    if (!next) break;
    seen.add(next);
    chain.push(next);
  }
  const first = b.cellCenter(enemy, start.x, start.y);
  const pts: PathPoint[] = [o.origin, ...line(o.origin, first, 16)];
  const at = [pts.length - 1];
  for (let i = 1; i < chain.length; i++) {
    pts.push(...line(b.cellCenter(enemy, chain[i - 1].x, chain[i - 1].y), b.cellCenter(enemy, chain[i].x, chain[i].y), 10));
    at.push(pts.length - 1);
  }
  const spark = mk(o, 'md_chispa', PW(o) * 0.3, { element: 'electric', trajectory: 'beam', radius: CELL * 0.45, statuses: [{ id: 'charged', turns: 2 }] });
  const p = drawn(b, o.side, pts, 'electric', 'beam', at);
  b.resolvePaths(o.side, spark, o.atk, [p], o.events);
  fx(o.events, 'mdpSpark', enemy, first.x, first.y, { n: chain.length, path: 0, at: at[0] });
  return [p];
}

// ---------------------------------------------------------------- Conde Gatula · CHILDREN OF THE NIGHT!
// A cloud of bats bites EVERY cat of theirs (0.35·P, wherever it hides), and everything they take is shared out as life
// among your crew (the most hurt first); what's left over once you're full turns into shields (1 per 20 % of a life).
function xp_gatula(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y);
  const foes = alive(b, enemy);
  const paths: ShotPath[] = [];
  let drunk = 0;
  foes.forEach((c, i) => {
    const t = b.roomCenter(enemy, c.room);
    const p = drawn(b, o.side, [o.origin, ...hop(o.origin, t, 90 + i * 25, 14)], 'shadow', 'ballistic', []);
    const at = p.points.length - 1;
    paths.push(p);
    const hp = c.hp;
    b.hitCat(c, Math.round(o.atk * PW(o) * 0.35 * CAT_K), o.events, i, at, 'shadow', true);
    drunk += Math.max(0, hp - Math.max(0, c.hp));
    fx(o.events, 'mdpBats', enemy, t.x, t.y, { uid: c.def.uid, path: i, at });
  });
  // the blood goes round your crew, the most hurt first
  const own = alive(b, o.side);
  let pool = drunk;
  const healed: string[] = [];
  for (const c of [...own].sort((a, z) => a.hp / a.maxHp - z.hp / z.maxHp || (a.def.uid < z.def.uid ? -1 : 1))) {
    if (pool <= 0) break;
    const h = heal(c, pool);
    pool -= h;
    if (h > 0) {
      const p = b.roomCenter(o.side, c.room);
      fx(o.events, 'mdpDrain', o.side, p.x, p.y, { n: h, uid: c.def.uid, path: 0, at: lastAt(paths[0]) });
      healed.push(`${c.def.name} +${h}`);
    }
  }
  // what's left: shields (1 per 20 % of a life, at most 3 per cat)
  if (pool > 0 && own.length) {
    const unit = Math.max(1, (own.reduce((a, c) => a + c.maxHp, 0) / own.length) * 0.2);
    let n = Math.floor(pool / unit);
    for (let k = 0; n > 0 && k < own.length * 3; k++) {
      const c = own[k % own.length];
      if (c.shields >= 3) continue;
      c.shields++;
      n--;
    }
  }
  const me = b.roomCenter(o.side, o.cat.room);
  if (drunk > 0) info(o.events, `SANGRE PARA TU TRIPULACIÓN: +${drunk}`, me.x, me.y - 140, 0xc8102e, 0, lastAt(paths[0]));
  return paths;
}

// ---------------------------------------------------------------- Capitán Ahabigotes · THE WHITE FISH!
// He harpoons their biggest module and ties the rope: at the start of each of their next 3 turns he hauls — the module
// loses 10 %, 20 % and 30 % of its max life (one 45 % / 18 % cap for the three); if it breaks, the rope jumps to the
// next biggest. Never the core (PODERES-2b): 60 % of its max life, whatever their attack or their life, broke it on the
// third haul (a module falls with half its cells) — a sure win on any ship whose biggest module is the core.
function xp_ahab(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const m = biggestModule(b, enemy);
  const t = m !== undefined ? b.roomCenter(enemy, m) : b.shipCenter(enemy);
  stamp(b, o, t.x, t.y);
  const p = dash(b, o.side, o.origin, t, 'water', 'beam');
  p.impacts = [];
  p.owners = [];
  if (m !== undefined) {
    S(b).harpoon = { side: enemy, module: m, step: 0, budget: Math.round((b.sides[enemy].ship.initialMax?.[0] ?? 0) * (vsBoss(b, enemy) ? 0.18 : 0.45)) };
    fx(o.events, 'mdpHarpoon', enemy, t.x, t.y, { path: 0, at: p.points.length - 1 });
    info(o.events, '¡AMARRADO! JALA 3 TURNOS: 10 %, 20 %, 30 %', t.x, t.y - 150, 0xe8e1d3, 0, p.points.length - 1);
  }
  return [p];
}
/** the live module with the most cells (then the lowest id) — never the core: Ahab's rope, which hauls by max life */
export function biggestModule(b: Battle, side: number, skip = -1): number | undefined {
  const ship = b.sides[side].ship;
  return ship.modules
    .filter((m) => m.alive && m.kind !== 'core' && m.id !== skip && ship.moduleCells(m.id).length)
    .sort((a, z) => ship.moduleCells(z.id).length - ship.moduleCells(a.id).length || a.id - z.id)[0]?.id;
}

// ---------------------------------------------------------------- Pinomichi · NOSE OF TRUTH!
// His nose grows every turn he DOESN'T use the ultimate («ahorita no la uso», he lies): +1 cell of reach per turn, up to
// 8. The ultimate is one straight nose-poke through every one of those cells (0.45·P each), Enraizado.
function xp_pinomichi(b: Battle, o: UltCtx): ShotPath[] {
  const st = S(b);
  const n = Math.max(1, Math.min(8, st.nose.get(o.cat) ?? 1));
  st.nose.set(o.cat, 1);
  const tgt = landing(b, o);
  const enemy = 1 - o.side;
  const span = shipSpan(b, enemy);
  // a straight poke at the height of their ship's middle (through the hull, not along the deck)
  const aim = { x: clamp(tgt.x, span.x0, span.x1), y: b.shipCenter(enemy).y };
  stamp(b, o, aim.x, aim.y, n);
  const nose = mk(o, 'md_nariz', PW(o) * 0.45, { element: 'nature', trajectory: 'ray', pierce: n - 1, pierceMul: 1, radius: CELL * 0.8, gravityScale: 0, windScale: 0, statuses: [{ id: 'rooted', turns: 2 }] });
  const p = b.integrate(nose, o.origin, Math.atan2(aim.y - o.origin.y, aim.x - o.origin.x), 1300, 0, o.side);
  b.resolvePaths(o.side, nose, o.atk, [p], o.events);
  fx(o.events, 'mdpNose', o.side, o.origin.x, o.origin.y, { n, path: 0, at: lastAt(p) });
  return [p];
}

// ---------------------------------------------------------------- El Michipulín Colorado · SHRINK PILL!
// He was going to take his shrinking pill… and throws it at them: their strongest cat is TINY for 3 turns (hits ×0.3,
// takes ×1.3) and a squeaky mallet stuns it 1 turn. A boss captain: ×0.6 / ×1.15, 2 turns.
function xp_michipulin(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const target = strongest(b, enemy);
  const t = target ? b.roomCenter(enemy, target.room) : b.shipCenter(enemy);
  stamp(b, o, t.x, t.y);
  const p = drawn(b, o.side, [o.origin, ...hop(o.origin, t, 150, 14)], 'nature', 'ballistic', []);
  if (target) {
    const boss = isBossCaptain(b, target);
    S(b).shrink.set(target, { t: T(boss ? 2 : 3), atk: boss ? 0.6 : 0.3, take: boss ? 1.15 : 1.3 });
    stun(b, target, 2);
    fx(o.events, 'mdpShrink', enemy, t.x, t.y, { uid: target.def.uid, path: 0, at: p.points.length - 1 });
    info(o.events, `¡CHIQUITO! ${target.def.name.toUpperCase()} PEGA x${boss ? 0.6 : 0.3}`, t.x, t.y - 150, 0xd62839, 0, p.points.length - 1);
  }
  return [p];
}

// ---------------------------------------------------------------- El Michito del Barril · BARREL HIDEOUT!
// Into the barrel: their next 2 turns, every ultimate they fire crashes into the barrel and does nothing (the meter is
// spent all the same). When he comes out he throws the ball at the cat that fired the last one: ×1.5.
function xp_barril(b: Battle, o: UltCtx): ShotPath[] {
  const me = b.roomCenter(o.side, o.cat.room);
  stamp(b, o, me.x, me.y);
  S(b).barrel = { side: o.side, t: T(2), last: null, by: o.cat, atk: o.atk, pw: PW(o) };
  fx(o.events, 'mdpBarrel', o.side, me.x, me.y, { n: 2, uid: o.cat.def.uid, path: -1 });
  info(o.events, '¡SE METIÓ AL BARRIL! SUS ULTIS SE VAN A ESTRELLAR', me.x, me.y - 150, 0xf2c14e);
  return [];
}

// ---------------------------------------------------------------- Miaufalda · WORLD BANDAGE!
// A band-aid on the world: EVERY cell of your ship gets 25 % of its max life back, and your most valuable destroyed
// module works again with what's left of it, at half life. What the Void erased stays erased (not even she can).
function xp_miaufalda(b: Battle, o: UltCtx): ShotPath[] {
  const own = b.sides[o.side];
  const me = b.shipCenter(o.side);
  stamp(b, o, me.x, me.y);
  let healed = 0;
  for (const c of own.ship.cells()) {
    if (c.status.voided || c.hp >= c.maxHp) continue;
    const amount = Math.min(c.maxHp - c.hp, Math.round(c.maxHp * 0.25));
    c.hp += amount;
    healed += amount;
    o.events.push({ k: 'heal', side: o.side, cell: c, amount });
  }
  fx(o.events, 'mdpBandage', o.side, me.x, me.y, { n: healed, path: -1 });
  const order = (k: string) => ({ core: 0, catroom: 1, cannon: 2 } as Record<string, number>)[k] ?? 3;
  const dead = own.ship.modules
    .filter((m) => !m.alive && own.ship.moduleCells(m.id).length && own.ship.moduleCells(m.id).every((c) => !c.status.voided))
    .sort((a, z) => order(a.kind) - order(z.kind) || a.id - z.id)[0];
  if (dead) rearm(b, o.side, dead.id, 0.5, o.events);
  return [];
}
/** a destroyed module works again with what's left of it (its cells at least at `frac` of their life) */
export function rearm(b: Battle, side: number, id: number, frac: number, ev: import('../sim').BattleEvent[]) {
  const s = b.sides[side];
  const m = s.ship.modules[id] as import('../ship').ModuleInst & { _reported?: boolean };
  for (const c of s.ship.moduleCells(id)) {
    const amount = Math.max(0, Math.round(c.maxHp * frac) - c.hp);
    if (amount > 0) {
      c.hp += amount;
      ev.push({ k: 'heal', side, cell: c, amount });
    }
  }
  m.alive = true;
  m._reported = false;
  m.disabled = 0;
  for (const c of s.cats) if (c.room === id && !c.ko) c.exposed = false;
  const p = b.roomCenter(side, id);
  fx(ev, 'mdpRebuild', side, p.x, p.y, { path: -1 });
  info(ev, '¡REARMADO!', p.x, p.y - 90, 0x6ec6f0);
}

// ---------------------------------------------------------------- Condorgato · BACKFLIP PUNCHLINE!
// A joke so bad everyone falls over backwards: for 3 volleys of yours, the LAST cannon of each one is the PUNCHLINE —
// ×3, and the cat it hits ends up legs in the air (stunned, deaf or not). With no cannons left, your cat's shot is it.
function xp_condorgato(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y);
  S(b).punch = { side: o.side, volleys: 3, turnUsed: false };
  const me = b.roomCenter(o.side, o.cat.room);
  fx(o.events, 'mdpJoke', o.side, me.x, me.y, { n: 3, path: -1 });
  return [];
}

// re-exports the other power files use
export { surfaceY, DMG_K };
export type { ShotDef };
