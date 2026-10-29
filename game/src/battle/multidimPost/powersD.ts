/**
 * After the Parte III · TANDA 2 · post MULTIDIMENSIONAL powers 1–13 (legends, myths, history, the old masters, anime)
 * — agent PODERES-3. Design: docs/post-p3/05-tanda-2.md and 04-roster.json → post.power (DISEÑO-2); what changed and why:
 * docs/post-p3/agentes/PODERES-3.md. `P` = the power's unit (kit.PW). Every power runs inside sim.fire with the 45 %
 * (bosses 18 %) structure budget already set. The rules they leave on the field live in kitD.ts (state), rulesD.ts
 * (during a shot), turnD.ts (at a turn's start) and hudD.ts (the AI's timing and the chips).
 */
import type { Battle, PathPoint, ShotPath } from '../sim';
import { CAT_K, DMG_K } from '../sim';
import type { Cell } from '../ship';
import type { CatState, StatusId } from '../types';
import type { UltCtx } from '../ults';
import { collapse, cut, landing, shipTop } from '../ults';
import { CELL, PW, T, alive, bestModules, cellNear, dash, deck, dirOf, drawn, fx, heal, hop, info, isBossCaptain, lastAt, line, lob, mk, stamp, stun, vsBoss } from './kit';
import { D, alone, rim } from './kitD';

export function ultsD() {
  return {
    xp_sombreronron,
    xp_gatejo,
    xp_maullorona,
    xp_quetzalgatl,
    xp_bastet,
    xp_cleogatra,
    xp_bonapata,
    xp_leonardo,
    xp_perla,
    xp_miauton,
    xp_miauzart,
    xp_miausagi,
    xp_tanjimiau,
  };
}

// ------------------------------------------------------------------ little helpers of this batch
/** a drawn path for the view only (its blows are applied by hand): no impacts, the events ride on its last point */
export function flight(pts: PathPoint[], el: ShotPath['element'], kind: ShotPath['kind'] = 'ballistic'): ShotPath {
  return { points: pts, element: el, kind, impacts: [], owners: [] };
}
/** a status on some cells of a side (at least `turns`), with its event */
export function mark(b: Battle, side: number, cells: Cell[], id: StatusId, turns: number, ev: UltCtx['events']) {
  const out = cells.filter((c) => c.hp > 0 && b.sides[side].ship.get(c.x, c.y) === c);
  for (const c of out) c.status[id] = Math.max(c.status[id] ?? 0, turns);
  if (out.length) ev.push({ k: 'status', side, cells: out, status: id });
}
/** the cells of a cat's cabin */
export const cabin = (b: Battle, c: CatState) => b.sides[c.side].ship.moduleCells(c.room);
/** the fraction of life a cat has */
export const fracOf = (c: CatState) => Math.max(0, c.hp) / Math.max(1, c.maxHp);
/** the weakest cat of a side: the lowest fraction of life (then the lowest uid) */
export function weakest(b: Battle, side: number) {
  return alive(b, side).sort((a, z) => fracOf(a) - fracOf(z) || (a.def.uid < z.def.uid ? -1 : 1))[0];
}

// ---------------------------------------------------------------- El Sombreronrón · MIDNIGHT BRAID!
// He braids midnight: the next 3 impacts of your crew's cat shots and ultimates on their ship (the rest of this turn and
// your 2 next) pin a ribbon each. The third closes the braid: every cell of theirs whose center lies in the triangle (or
// on its edge) takes 0.4·P and stays Enraizado 2, and the cats of the cabins inside get no meter on their next turn.
// The window runs out with 1–2 ribbons: 0.4·P on each ribbon (rulesD.ts / turnD.ts).
function xp_sombreronron(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, shipTop(b, enemy));
  D(b).braid = { side: o.side, t: T(2, true), pins: [], atk: o.atk, pw: PW(o), by: o.cat };
  const me = b.roomCenter(o.side, o.cat.room);
  fx(o.events, 'mdpBraid', o.side, me.x, me.y, { n: 0, path: -1 });
  info(o.events, 'TRES LISTONES: TUS PRÓXIMOS 3 IMPACTOS', ctr.x, ctr.y - 220, 0xe6c34a);
  return [];
}

// ---------------------------------------------------------------- El Gatejo · TWO CADEJOS!
// He splits in two: the white Gatejo guards every cat of yours that is ALONE (no other cabin of yours touching its own)
// with 2 shields (max 3); the black one bites every lonely cat of theirs (0.55·P straight to the cat, Maldito 2 on its
// cabin; a boss captain 0.3·P). Nobody alone on a side: that spirit goes to its weakest cat.
function xp_gatejo(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const me = b.roomCenter(o.side, o.cat.room);
  stamp(b, o, me.x, me.y);
  const paths: ShotPath[] = [];
  let mine = alive(b, o.side).filter((c) => alone(b, c));
  if (!mine.length) mine = [weakest(b, o.side)].filter(Boolean);
  for (const c of mine) {
    c.shields = Math.min(3, c.shields + 2);
    const t = b.roomCenter(o.side, c.room);
    fx(o.events, 'mdpGuard', o.side, t.x, t.y, { uid: c.def.uid, path: -1 });
  }
  let theirs = alive(b, enemy).filter((c) => alone(b, c));
  if (!theirs.length) theirs = [weakest(b, enemy)].filter(Boolean);
  for (const c of theirs) {
    const t = b.roomCenter(enemy, c.room);
    const p = flight([o.origin, ...hop(o.origin, t, 120, 14)], 'void');
    const i = paths.push(p) - 1;
    const at = p.points.length - 1;
    b.hitCat(c, Math.round(o.atk * PW(o) * (isBossCaptain(b, c) ? 0.3 : 0.55) * CAT_K), o.events, i, at, 'void', true);
    mark(b, enemy, cabin(b, c), 'cursed', 2, o.events);
    fx(o.events, 'mdpBite', enemy, t.x, t.y, { uid: c.def.uid, path: i, at });
  }
  const mid = b.shipCenter(o.side);
  info(o.events, `GUARDA A ${mine.length} · MUERDE A ${theirs.length}`, mid.x, mid.y - 220, 0xf4f1ea);
  return paths;
}

// ---------------------------------------------------------------- La Maullorona · WEEPING RIVER!
// Seven big tears, one by one, each on their cat with the least life at that moment: 0.1·P + 0.5·P × the life it's
// missing (a boss captain: half that bonus), Mojado 2. Shields only hold if the cat is above 25 %.
function xp_maullorona(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, shipTop(b, enemy) - CELL * 2);
  const paths: ShotPath[] = [];
  for (let i = 0; i < 7; i++) {
    const c = weakest(b, enemy);
    if (!c) break;
    const t = b.roomCenter(enemy, c.room);
    const from = { x: t.x + dirOf(o.side) * (i % 2 ? -40 : 40), y: -160 - i * 30 };
    const p = flight([from, ...line(from, t, 22)], 'water', 'beam');
    const k = paths.push(p) - 1;
    const at = p.points.length - 1;
    const missing = 1 - c.hp / Math.max(1, c.maxHp);
    const bonus = 0.5 * missing * (isBossCaptain(b, c) ? 0.5 : 1);
    // under 25 % the tear goes through its shields (they're still there afterwards)
    const pierce = c.hp < c.maxHp * 0.25 && c.shields > 0;
    const keep = c.shields;
    if (pierce) c.shields = 0;
    b.hitCat(c, Math.round(o.atk * PW(o) * (0.1 + bonus) * CAT_K), o.events, k, at, 'water', true);
    if (pierce) c.shields = keep;
    if (!c.ko) c.fx.wet = Math.max(c.fx.wet, 2);
    mark(b, enemy, cabin(b, c), 'wet', 2, o.events);
    fx(o.events, 'mdpTear', enemy, t.x, t.y, { n: i + 1, path: k, at });
  }
  return paths;
}

// ---------------------------------------------------------------- Quetzalgatl · FEATHERED WIND!
// The wind is his: the rest of this turn and your 3 next (their 3 in between too) it blows at full strength from your
// ship to theirs, and your shots hit ×1.15. When it's over the old wind comes back. Five feathers seal their 5 live
// cannons nearest your ship for 1 of their turns (not against a boss).
function xp_quetzalgatl(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const ctr = b.shipCenter(enemy);
  stamp(b, o, (b.shipCenter(o.side).x + ctr.x) / 2, shipTop(b, enemy) - CELL * 2);
  const d = D(b);
  d.wind = { side: o.side, t: T(3, true), base: d.wind?.side === o.side ? d.wind.base : b.wind };
  b.wind = dirOf(o.side) * 70;
  fx(o.events, 'mdpWind', o.side, ctr.x, ctr.y, { n: 70, path: -1 });
  const paths: ShotPath[] = [];
  if (!vsBoss(b, enemy)) {
    const home = b.shipCenter(o.side);
    const guns = b.sides[enemy].ship.modules
      .filter((m) => m.kind === 'cannon' && m.alive)
      .sort((a, z) => Math.abs(b.roomCenter(enemy, a.id).x - home.x) - Math.abs(b.roomCenter(enemy, z.id).x - home.x) || a.id - z.id)
      .slice(0, 5);
    for (const m of guns) {
      m.disabled = Math.max(m.disabled, 2);
      const t = b.roomCenter(enemy, m.id);
      const p = flight([o.origin, ...hop(o.origin, t, 200, 16)], 'wind', 'gust');
      const i = paths.push(p) - 1;
      fx(o.events, 'mdpFeather', enemy, t.x, t.y, { path: i, at: p.points.length - 1 });
    }
    if (guns.length) info(o.events, `${guns.length} CAÑONES SELLADOS`, ctr.x, ctr.y - 160, 0x2bb3a3);
  }
  info(o.events, 'EL VIENTO ES TUYO (3 TURNOS) · TUS TIROS x1.15', ctr.x, ctr.y - 230, 0x2bb3a3);
  return paths;
}

// ---------------------------------------------------------------- Bastet · HOME GUARDIAN!
// She guards the house: during their next 3 turns no cell of yours goes under 30 % of its max life (the ones already
// under stay where they are). Every blow the floor clips is a ray for the sun disc; when their 3rd turn is over it falls
// on their core: 0.15·P × rays (max 1.5·P), Cegado their crew (turnD.ts).
function xp_bastet(b: Battle, o: UltCtx): ShotPath[] {
  const me = b.shipCenter(o.side);
  stamp(b, o, me.x, shipTop(b, o.side));
  D(b).guard = { side: o.side, t: T(3), rays: 0, atk: o.atk, pw: PW(o), by: o.cat, done: false };
  fx(o.events, 'mdpGuardian', o.side, me.x, me.y, { n: 3, path: -1 });
  info(o.events, 'TU BARCO NO BAJA DEL 30 % (3 TURNOS SUYOS)', me.x, me.y - 230, 0xe6c34a);
  return [];
}

// ---------------------------------------------------------------- Cleogatra · THE PEARL WAGER!
// She bets her biggest pearl: from now to the end of their 2nd next turn the damage is counted (life lost by their
// cells and cats against yours). Won: 1.6·P over their 3 most valuable modules, Prisma 2, +30 meter to your crew.
// Lost or tied: the pearl comes back and lands on their core for 0.5·P (turnD.ts settles it).
function xp_cleogatra(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y);
  D(b).wager = { side: o.side, t: T(2), mine0: life(b, o.side), theirs0: life(b, enemy), atk: o.atk, pw: PW(o), by: o.cat };
  const me = b.roomCenter(o.side, o.cat.room);
  fx(o.events, 'mdpWager', o.side, me.x, me.y, { path: -1 });
  info(o.events, 'LA APUESTA: 2 TURNOS DE DAÑO', ctr.x, ctr.y - 220, 0xf5f0e1);
  return [];
}
function life(b: Battle, side: number) {
  const s = b.sides[side];
  return s.ship.cells().reduce((a, c) => a + Math.max(0, c.hp), 0) + s.cats.reduce((a, c) => a + (c.ko ? 0 : Math.max(0, c.hp)), 0);
}

// ---------------------------------------------------------------- Napoleón Bonapata · GRAND CONQUEST!
// A flaming bicorne where you aim (0.7·P, radius 1.5, Ardiendo 2) opens the campaign: the rest of this turn and your 2
// next, every cell of theirs your side destroys is conquered territory — +4 % damage to your whole crew for the rest of
// the battle per cell (max +40 %; a boss: +2 %, max +20 %).
function xp_bonapata(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const tgt = landing(b, o);
  const c0 = cellNear(b, enemy, tgt);
  const t = c0 ? b.cellCenter(enemy, c0.x, c0.y) : b.shipCenter(enemy);
  stamp(b, o, t.x, t.y);
  const d = D(b);
  const boss = vsBoss(b, enemy);
  d.conquest = { side: o.side, t: T(2, true), cells: 0, per: boss ? 0.02 : 0.04, max: boss ? 0.2 : 0.4 };
  const p = lob(b, o.side, o.origin, t, 190, 'fire');
  const shot = mk(o, 'md_bicornio', PW(o) * 0.7, { element: 'fire', trajectory: 'ballistic', radius: CELL * 1.5, statuses: [{ id: 'burning', turns: 2 }] });
  const n0 = o.events.length;
  b.resolvePaths(o.side, shot, o.atk, [p], o.events);
  conquer(b, o.side, o.events.slice(n0), o.events, 0, lastAt(p));
  return [p];
}
/** the conquered cells of a shot of the conquering side (cells destroyed, and the chunks that fell) */
export function conquer(b: Battle, side: number, mine: UltCtx['events'], ev: UltCtx['events'], path: number, at: number) {
  const cq = D(b).conquest;
  if (!cq || cq.side !== side || !(cq.t.now || cq.t.next > 0)) return;
  const enemy = 1 - side;
  let n = 0;
  for (const e of mine) {
    if (e.k === 'cell' && e.side === enemy && e.destroyed) n++;
    else if (e.k === 'chunk' && e.side === enemy) n += e.cells.length;
  }
  if (!n) return;
  const d = D(b);
  cq.cells += n;
  const was = d.bonus[side];
  d.bonus[side] = Math.min(cq.max, cq.cells * cq.per);
  if (d.bonus[side] > was) {
    const p = b.shipCenter(enemy);
    fx(ev, 'mdpConquest', enemy, p.x, p.y, { n: Math.round(d.bonus[side] * 100), path, at });
    info(ev, `¡TERRITORIO! +${Math.round(d.bonus[side] * 100)} % DE DAÑO`, p.x, p.y - 200, 0x1f3a93, path, at);
  }
}

// ---------------------------------------------------------------- Leonardo da Michi · CODEX OF INVENTIONS!
// A machine for every cat of yours, by what it does: its next shot in your 2 next turns comes out improved (rulesD.ts):
// artillero +2 projectiles, francotirador +2 pierce, demoledor radius ×1.5, asediador 2 bounces, controlador its status
// +2 turns, soporte also heals 15 % to your most hurt cat, tanque +2 shields for itself, invocador its shot again at 50 %.
// And now: 3 sketches of 0.35·P on 3 cells spread over their deck (no status).
function xp_leonardo(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, shipTop(b, enemy));
  const d = D(b);
  for (const c of alive(b, o.side)) {
    d.codex.set(c, T(2));
    const p = b.roomCenter(o.side, c.room);
    fx(o.events, 'mdpMachine', o.side, p.x, p.y, { uid: c.def.uid, path: -1 });
  }
  const top = deck(b, enemy);
  const paths: ShotPath[] = [];
  const sketch = mk(o, 'md_boceto', PW(o) * 0.35, { element: 'neutral', trajectory: 'ballistic', radius: CELL * 0.9 });
  for (let i = 0; i < 3 && top.length; i++) {
    const c = top[Math.min(top.length - 1, Math.floor(((i + 0.5) / 3) * top.length))];
    const t = b.cellCenter(enemy, c.x, c.y);
    paths.push(lob(b, o.side, o.origin, t, 130 + i * 30, 'neutral'));
  }
  b.resolvePaths(o.side, sketch, o.atk, paths, o.events);
  info(o.events, 'UNA MÁQUINA PARA CADA GATO: SU PRÓXIMO TIRO MEJORA', ctr.x, ctr.y - 220, 0xb5543a);
  return paths;
}

// ---------------------------------------------------------------- La Michi de la Perla · SOFT WINDOW LIGHT!
// She opens the window: at the start of your next 4 turns a soft light heals every cat of yours 8 % of its max life and
// mends every cell of yours not Borrada 5 % (no revivals, no modules back) (turnD.ts). The pearl hangs on your most hurt
// cat: +2 shields (max 3).
function xp_perla(b: Battle, o: UltCtx): ShotPath[] {
  const me = b.shipCenter(o.side);
  stamp(b, o, me.x, shipTop(b, o.side));
  D(b).light = { side: o.side, turns: 4 };
  const c = weakest(b, o.side);
  if (c) {
    c.shields = Math.min(3, c.shields + 2);
    const p = b.roomCenter(o.side, c.room);
    fx(o.events, 'mdpPearl', o.side, p.x, p.y, { uid: c.def.uid, path: -1 });
  }
  fx(o.events, 'mdpWindow', o.side, me.x, me.y, { n: 4, path: -1 });
  info(o.events, 'LUZ DE VENTANA: CURA Y REPARA 4 TURNOS', me.x, me.y - 230, 0xf2d27a);
  return [];
}

// ---------------------------------------------------------------- Isaac Miauton · LAW OF GRAVITY!
// A giant apple on the highest cell of their ship (0.9·P), one bounce down (0.45·P), Flotando 2. And gravity changes:
// the rest of this turn and your 2 next your shots weigh half; their 2 next turns theirs weigh double (a boss ×1.5) —
// and their aim doesn't correct for it (rulesD.ts: the shot changes at fire time, the AI aims with the plain one).
function xp_miauton(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const es = b.sides[enemy];
  const top = es.ship.cells().sort((a, z) => a.y - z.y || Math.abs(a.x - es.ship.cols / 2) - Math.abs(z.x - es.ship.cols / 2))[0];
  const t = top ? b.cellCenter(enemy, top.x, top.y) : b.shipCenter(enemy);
  stamp(b, o, t.x, t.y);
  const from = { x: t.x, y: -220 };
  const p = drawn(b, o.side, [from, ...line(from, t, 24)], 'gravity', 'heavy', []);
  p.impacts = [p.points.length - 1];
  p.owners = [o.side];
  const apple = mk(o, 'md_manzana', PW(o) * 0.9, { element: 'gravity', trajectory: 'heavy', radius: CELL * 1.0, statuses: [{ id: 'grav', turns: 2 }] });
  b.resolvePaths(o.side, apple, o.atk, [p], o.events);
  const paths = [p];
  // the bounce: one cell down (the next live cell under it, else the nearest)
  const under = top ? es.ship.cells().filter((c) => c.x === top.x && c.y > top.y).sort((a, z) => a.y - z.y)[0] ?? cellNear(b, enemy, { x: t.x, y: t.y + CELL }) : undefined;
  if (under) {
    const u = b.cellCenter(enemy, under.x, under.y);
    const q = drawn(b, o.side, [t, ...hop(t, u, 30, 10)], 'gravity', 'heavy', []);
    q.impacts = [q.points.length - 1];
    q.owners = [o.side];
    b.resolvePaths(o.side, { ...apple, id: 'md_manzana2', power: PW(o) * 0.45 }, o.atk, [q], o.events, 1);
    paths.push(q);
  }
  D(b).gravity = { side: o.side, mine: T(2, true), theirs: T(2), heavy: vsBoss(b, enemy) ? 1.5 : 2 };
  fx(o.events, 'mdpApple', enemy, t.x, t.y, { path: 0, at: lastAt(p) });
  info(o.events, 'LA GRAVEDAD CAMBIA: SUS TIROS PESAN x2, LOS TUYOS x0.5', b.shipCenter(enemy).x, t.y - 200, 0xc0392b, 0, lastAt(p));
  return paths;
}

// ---------------------------------------------------------------- Miauzart · BRAVO, ENCORE!
// A three-note minuet fanned over 30° (3 × 0.3·P; the third stuns the cat of the cabin it touches), and the audience
// stands up: the next ultimate of another cat of yours in your 3 next turns plays twice — it repeats right away at 60 %
// (its direct damage, with its own cap; rulesD.ts).
function xp_miauzart(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const tgt = landing(b, o);
  const c0 = cellNear(b, enemy, tgt);
  const t = c0 ? b.cellCenter(enemy, c0.x, c0.y) : b.shipCenter(enemy);
  stamp(b, o, t.x, t.y);
  // three notes fanned over their ship (his own wave would roll along the sea): the near one, the middle, the far one
  const note = mk(o, 'md_nota', PW(o) * 0.3, { element: 'sound', trajectory: 'ballistic', radius: CELL * 1.0, pierce: 0, projectiles: 1 });
  const paths: ShotPath[] = [];
  for (let i = 0; i < 3; i++) {
    const want = { x: t.x + dirOf(o.side) * (i - 1) * CELL * 1.6, y: t.y - (i - 1) * CELL * 0.4 };
    const c = cellNear(b, enemy, want);
    const q = c ? b.cellCenter(enemy, c.x, c.y) : t;
    paths.push(lob(b, o.side, o.origin, q, 140 + i * 45, 'sound'));
  }
  b.resolvePaths(o.side, note, o.atk, paths, o.events);
  // the third note: the cat of the cabin it touched
  const third = paths[2];
  if (third.impacts.length) {
    const q = third.points[third.impacts[third.impacts.length - 1]];
    const hit = b.cellAt(q.x, q.y);
    const c = hit && hit.side === enemy && hit.cell.module !== undefined ? b.sides[enemy].cats.find((k) => !k.ko && k.room === hit.cell.module) : undefined;
    if (c) {
      stun(b, c, 2);
      const p = b.roomCenter(enemy, c.room);
      info(o.events, '¡ATURDIDO POR EL MINUETO!', p.x, p.y - 110, 0xe8c7a0, 2, lastAt(third));
    }
  }
  D(b).encore = { side: o.side, t: T(3), by: o.cat };
  const me = b.roomCenter(o.side, o.cat.room);
  fx(o.events, 'mdpEncore', o.side, me.x, me.y, { path: -1 });
  return paths;
}

// ---------------------------------------------------------------- Miausagi · FULL MOON UNITY!
// A full-moon beam on the cell you aim at: 0.4·P × (1 + 0.25·E), radius 1.5 + 0.4·E, Flotando 1 — E = the different
// elements among your live cats (max 5). For friendship every cat of yours gains 15 meter (25 if E = 5).
function xp_miausagi(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const mates = alive(b, o.side);
  const E = Math.min(5, new Set(mates.map((c) => c.def.elements[0])).size);
  const tgt = landing(b, o);
  const c0 = cellNear(b, enemy, tgt);
  const t = c0 ? b.cellCenter(enemy, c0.x, c0.y) : b.shipCenter(enemy);
  stamp(b, o, t.x, t.y, E);
  const from = { x: t.x, y: -240 };
  const p = drawn(b, o.side, [from, ...line(from, t, 26)], 'light', 'beam', []);
  p.impacts = [p.points.length - 1];
  p.owners = [o.side];
  const beam = mk(o, 'md_luna', PW(o) * 0.4 * (1 + 0.25 * E), { element: 'light', trajectory: 'beam', radius: CELL * (1.5 + 0.4 * E), statuses: [{ id: 'grav', turns: 1 }] });
  b.resolvePaths(o.side, beam, o.atk, [p], o.events);
  const gain = E >= 5 ? 0.25 : 0.15;
  for (const c of mates) c.ultCharge = Math.min(1, c.ultCharge + gain);
  fx(o.events, 'mdpMoon', enemy, t.x, t.y, { n: E, path: 0, at: lastAt(p) });
  info(o.events, `${E} ELEMENTOS · +${Math.round(gain * 100)} DE BARRA`, t.x, t.y - 200, 0xf7a1c4, 0, lastAt(p));
  return [p];
}

// ---------------------------------------------------------------- Tanjimiau · FLOWING DRAGON!
// A water dragon runs the rim of their ship cell by cell (from the bow, over the top, clockwise), up to 16: the k-th
// cell takes 0.05·P + 0.015·P × k, Mojado 1 (a short rim: another lap). At the end his little sister kicks the last
// cell: its blow again ×2.
function xp_tanjimiau(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const ring = rim(b, enemy, o.side);
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, shipTop(b, enemy));
  if (!ring.length) return [];
  const pts: PathPoint[] = [o.origin];
  const stops: { c: Cell; at: number }[] = [];
  let lap = 0;
  for (let k = 0; stops.length < 16 && lap < 4; k++) {
    if (k > 0 && k % ring.length === 0) lap++;
    const c = ring[k % ring.length];
    if (c.hp <= 0 && lap > 0) continue;
    const q = b.cellCenter(enemy, c.x, c.y);
    pts.push(...(stops.length === 0 ? hop(o.origin, q, 120, 16) : line(pts[pts.length - 1], q, 12)));
    stops.push({ c, at: pts.length - 1 });
  }
  const p = flight(pts, 'water', 'beam');
  const P = o.atk * PW(o) * DMG_K;
  const wet: Cell[] = [];
  let last: { c: Cell; dmg: number; at: number } | null = null;
  stops.forEach((s, i) => {
    const k = i + 1;
    if (s.c.hp <= 0 || b.sides[enemy].ship.get(s.c.x, s.c.y) !== s.c) return;
    const raw = P * (0.05 + 0.015 * k);
    cut(b, enemy, s.c, raw, o.events, 0, s.at);
    if (s.c.hp > 0) wet.push(s.c);
    last = { c: s.c, dmg: raw, at: s.at };
    if (i % 3 === 0) fx(o.events, 'mdpDragon', enemy, b.cellCenter(enemy, s.c.x, s.c.y).x, b.cellCenter(enemy, s.c.x, s.c.y).y, { n: k, path: 0, at: s.at });
  });
  mark(b, enemy, wet, 'wet', 1, o.events);
  const kick = last as { c: Cell; dmg: number; at: number } | null;
  if (kick && kick.c.hp > 0 && b.sides[enemy].ship.get(kick.c.x, kick.c.y) === kick.c) {
    cut(b, enemy, kick.c, kick.dmg * 2, o.events, 0, kick.at);
    const q = b.cellCenter(enemy, kick.c.x, kick.c.y);
    fx(o.events, 'mdpKick', enemy, q.x, q.y, { n: 1, path: 0, at: kick.at });
    info(o.events, '¡LA HERMANITA PATEA!', q.x, q.y - 110, 0xf28fb0, 0, kick.at);
  }
  collapse(b, enemy, o.events, 0, lastAt(p));
  return [p];
}

export { bestModules, heal };
