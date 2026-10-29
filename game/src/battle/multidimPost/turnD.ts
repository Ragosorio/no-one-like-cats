/**
 * After the Parte III · TANDA 2 · the second batch at the start of a turn (agent PODERES-3): every clock of kitD.ts and
 * the blows that land then — El Sombreronrón's lone ribbons, Bastet's sun, Cleogatra's pearl, Felinamente's unused
 * objection — queued for the view (Battle.queued), plus Quetzalgatl's wind held at full strength, La Michi de la Perla's
 * light and the braided whiskers' meter. turn.ts mdpStartTurn → dStartTurn.
 */
import type { Battle, BattleEvent, ShotPath } from '../sim';
import type { ShotDef } from '../types';
import { CELL, DMG_K, alive, bestModules, dirOf, drawn, fx, heal, info, line, lob, on, queue, strongest, tick, vsBoss, withBudget } from './kit';
import type { MdpState } from './kit';
import { lifeOf } from './kitD';
import type { DState } from './kitD';
import { cabin, mark } from './powersD';
import { coreAt } from './powersE';
import { pinBlow } from './rulesD';

const frac = (b: Battle, side: number) => (vsBoss(b, side) ? 0.18 : 0.45);

/** startTurn(): the tanda-2 clocks, and the blows that land at a turn's start */
export function dStartTurn(b: Battle, st: MdpState, side: 0 | 1, ev: BattleEvent[]) {
  const d = st.d;
  if (!d) return;
  const foe = 1 - side;
  // ---- the clocks: the owner's own turns, or the foe's
  if (d.braid?.side === side) tick(d.braid.t);
  if (d.wind?.side === side) tick(d.wind.t);
  if (d.guard?.side === foe) tick(d.guard.t);
  if (d.wager?.side === foe) tick(d.wager.t);
  if (d.conquest?.side === side) tick(d.conquest.t);
  for (const [c, t] of d.codex) if (c.side === side) tick(t);
  if (d.gravity?.side === side) tick(d.gravity.mine);
  if (d.gravity?.side === foe) tick(d.gravity.theirs);
  if (d.encore?.side === side) tick(d.encore.t);
  if (d.traps?.side === foe) tick(d.traps.t);
  if (d.objection?.side === foe) tick(d.objection.t);
  if (d.compass?.side === side) tick(d.compass.t);
  if (d.lab?.side === side) {
    tick(d.lab.t);
    tick(d.lab.combo);
  }
  for (const [c, t] of d.marked) if (c.side === side) tick(t);
  for (const [c, x] of d.braided)
    if (c.side === side) {
      tick(x.t);
      if (x.t.now) x.meter = c.ultCharge;
    }
  const ctr = b.shipCenter(side);
  // ---- Quetzalgatl's wind: full strength from his ship to theirs, until the old wind comes back
  const w = d.wind;
  if (w) {
    if (on(w.t)) b.wind = dirOf(w.side) * 70;
    else {
      b.wind = w.base;
      d.wind = null;
      info(ev, 'EL VIENTO VUELVE A SER EL DE ANTES', b.shipCenter(w.side).x, ctr.y - 230, 0x2bb3a3);
    }
  }
  // ---- El Sombreronrón: the window ran out with 1–2 ribbons — each one blows on its own
  const br = d.braid;
  if (br && br.side === side && !on(br.t)) {
    d.braid = null;
    if (br.pins.length) {
      const events: BattleEvent[] = [];
      const p = drawn(b, side, [br.pins[0], ...br.pins.slice(1)], 'magic', 'beam', []);
      withBudget(b, foe, frac(b, foe), () => br.pins.forEach((q) => pinBlow(b, br, q, events, 0, p.points.length - 1)));
      fx(events, 'mdpPinBlow', foe, br.pins[0].x, br.pins[0].y, { n: br.pins.length, path: 0, at: p.points.length - 1 });
      queue(b, { side, label: 'LOS LISTONES SUELTOS ESTALLAN', paths: [p], events, shot: ribbon(br.pw) });
    }
  }
  // ---- Bastet's sun: their 3rd turn is over — it falls on their core with every ray it gathered
  const g = d.guard;
  if (g && g.side === side && !g.done && g.t.now && g.t.next === 0) {
    g.done = true;
    d.guard = null;
    sun(b, g);
  }
  // ---- Cleogatra's pearl: the wager is settled when their 2nd turn is over
  const wg = d.wager;
  if (wg && wg.side === side && wg.t.now && wg.t.next === 0) {
    d.wager = null;
    settle(b, wg);
  }
  // ---- Felinamente's objection never used: Maldito on their strongest cat's cabin
  const ob = d.objection;
  if (ob && ob.side === side && (ob.used || (ob.t.now && ob.t.next === 0) || !on(ob.t))) {
    d.objection = null;
    if (!ob.used) {
      const c = strongest(b, foe);
      if (c) {
        mark(b, foe, cabin(b, c), 'cursed', 2, ev);
        const p = b.roomCenter(foe, c.room);
        info(ev, `NADIE OBJETÓ NADA: ${c.def.name.toUpperCase()} QUEDA MALDITO`, p.x, p.y - 140, 0xf7a1c4);
      }
    }
  }
  // ---- La Michi de la Perla's soft light
  const li = d.light;
  if (li && li.side === side && li.turns > 0) {
    li.turns--;
    let healed = 0;
    for (const c of alive(b, side)) healed += heal(c, c.maxHp * 0.08);
    for (const c of b.sides[side].ship.cells()) {
      if (c.status.voided || c.hp >= c.maxHp) continue;
      const h = Math.min(c.maxHp - c.hp, Math.round(c.maxHp * 0.05));
      c.hp += h;
      healed += h;
    }
    fx(ev, 'mdpLight', side, ctr.x, ctr.y, { n: li.turns, path: -1 });
    info(ev, `LUZ DE VENTANA: +8 % A TUS GATOS, +5 % A TU BARCO (${li.turns})`, ctr.x, ctr.y - 230, 0xf2d27a);
    if (li.turns <= 0) d.light = null;
  }
  // ---- the rest of the clocks that end
  if (d.gravity && !on(d.gravity.mine) && !on(d.gravity.theirs)) d.gravity = null;
  if (d.encore && !on(d.encore.t)) d.encore = null;
  if (d.traps && !on(d.traps.t)) d.traps = null;
  if (d.compass && !on(d.compass.t)) d.compass = null;
  if (d.lab && !on(d.lab.t) && !on(d.lab.combo)) d.lab = null;
  if (d.conquest && !on(d.conquest.t)) d.conquest = null;
  for (const [c, t] of d.codex) if (!on(t)) d.codex.delete(c);
  for (const [c, t] of d.marked) if (!on(t) || c.ko) d.marked.delete(c);
  for (const [c, x] of d.braided) if (!on(x.t) || c.ko) d.braided.delete(c);
}

const ribbon = (pw: number): ShotDef => ({ id: 'md_liston', name: 'LISTÓN', element: 'magic', trajectory: 'ballistic', power: pw * 0.4, radius: CELL, catMul: 0.5 });

/** Bastet's sun disc on their core: 0.15·P per ray (max 1.5·P), Cegado their crew */
function sun(b: Battle, g: NonNullable<DState['guard']>) {
  const enemy = 1 - g.side;
  const t = coreAt(b, enemy);
  const rays = Math.min(10, g.rays);
  const from = { x: t.x - dirOf(g.side) * 140, y: -380 };
  const p = drawn(b, g.side, [from, ...line(from, t, 20)], 'light', 'beam', []);
  p.impacts = [p.points.length - 1];
  p.owners = [g.side];
  const disc: ShotDef = { id: 'md_sol', name: 'DISCO DE SOL', element: 'light', trajectory: 'beam', power: g.pw * 0.15 * Math.max(1, rays), radius: CELL * 1.4, catMul: 0.5 };
  const events: BattleEvent[] = [];
  if (rays > 0) withBudget(b, enemy, frac(b, enemy), () => b.resolvePaths(g.side, disc, g.atk, [p], events));
  b.sides[enemy].buffs.blind = Math.max(b.sides[enemy].buffs.blind, 1);
  fx(events, 'mdpSun', enemy, t.x, t.y, { n: rays, path: 0, at: p.points.length - 1 });
  info(events, rays ? `EL SOL DE BASTET: ${rays} RAYOS` : 'EL SOL DE BASTET (NADIE TE PEGÓ: SOLO LOS CIEGA)', t.x, t.y - 170, 0xe6c34a, 0, p.points.length - 1);
  queue(b, { side: g.side, label: '¡EL DISCO DE SOL CAE!', paths: rays ? [p] : [], events, shot: disc });
}

/** Cleogatra's wager: won → 1.6·P over their 3 best modules, Prisma, +30 meter; lost or tied → 0.5·P on their core */
function settle(b: Battle, wg: NonNullable<DState['wager']>) {
  const enemy = 1 - wg.side;
  const theirs = Math.max(0, wg.theirs0 - lifeOf(b, enemy));
  const mine = Math.max(0, wg.mine0 - lifeOf(b, wg.side));
  const events: BattleEvent[] = [];
  const paths: ShotPath[] = [];
  const from = wg.by.ko ? { x: b.shipCenter(wg.side).x, y: -200 } : b.roomCenter(wg.side, wg.by.room);
  let shot: ShotDef;
  if (theirs > mine) {
    shot = { id: 'md_perla', name: 'LA PERLA', element: 'crystal', trajectory: 'ballistic', power: (wg.pw * 1.6) / 3, radius: CELL * 1.3, catMul: 0.5, statuses: [{ id: 'prism', turns: 2 }] };
    for (const m of bestModules(b, enemy, 3)) paths.push(lob(b, wg.side, from, b.roomCenter(enemy, m.id), 170, 'crystal'));
    withBudget(b, enemy, frac(b, enemy), () => b.resolvePaths(wg.side, shot, wg.atk, paths, events));
    for (const c of alive(b, wg.side)) c.ultCharge = Math.min(1, c.ultCharge + 0.3);
    const q = b.shipCenter(enemy);
    fx(events, 'mdpPearlWin', enemy, q.x, q.y, { n: Math.round(theirs), w: Math.round(mine), path: 0, at: paths[0] ? paths[0].points.length - 1 : 0 });
    info(events, `¡APUESTA GANADA! ${Math.round(theirs)} CONTRA ${Math.round(mine)} · +30 DE BARRA`, q.x, q.y - 220, 0xf5f0e1);
  } else {
    shot = { id: 'md_perla', name: 'LA PERLA', element: 'crystal', trajectory: 'ballistic', power: wg.pw * 0.5, radius: CELL * 1.2, catMul: 0.5 };
    const t = coreAt(b, enemy);
    paths.push(lob(b, wg.side, from, t, 170, 'crystal'));
    withBudget(b, enemy, frac(b, enemy), () => b.resolvePaths(wg.side, shot, wg.atk, paths, events));
    fx(events, 'mdpPearlLose', enemy, t.x, t.y, { n: Math.round(theirs), w: Math.round(mine), path: 0, at: paths[0].points.length - 1 });
    info(events, `APUESTA PERDIDA (${Math.round(theirs)} CONTRA ${Math.round(mine)}): LA PERLA DE CONSOLACIÓN`, t.x, t.y - 170, 0xf5f0e1);
  }
  queue(b, { side: wg.side, label: 'LA APUESTA DE LA PERLA', paths, events, shot });
  void DMG_K;
}
