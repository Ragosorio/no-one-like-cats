/**
 * After the Parte III · the post MULTIDIMENSIONAL powers at the start of a turn (agent PODERES-2): every clock (and what
 * each one undoes when it runs out), the tallies (Pinomichi's nose, Hermiaune's snapshot) and the blows that land then —
 * Gatojo's stopped time coming back, Michi Atom's ball, Ryumiau's notebook, Ahab's rope, the barrel opening, the
 * piranhas, Daft Miau's laser, Sabrina's confetti — queued for the view (Battle.queued).
 *
 * multidim.ts mdStartTurn → mdpStartTurn, re-exported by hooks.ts (the single door; the rules during a shot live there,
 * the AI's timing and the HUD chips in hud.ts, the state and clocks in kit.ts). Borrows frac / crew / tail / clampHeal /
 * chillOff from hooks.ts: function bodies only, so the cycle hooks ↔ turn is safe.
 */
import type { Battle, BattleEvent, PathPoint, ShotPath } from '../sim';
import type { CatState, ShotDef } from '../types';
import { collapse, cut, shipSpan, shipTop } from '../ults';
import { mdOn } from '../multidim';
import { spreadCells } from './powersA';
import { chillOff, clampHeal, crew, frac, tail } from './hooks';
import { dStartTurn } from './turnD';
import { CELL, DMG_K, MdpState, S, alive, bleed, dash, dirOf, drawn, feat, fx, heal, info, isBossCaptain, lastAt, left, line, lob, moduleNear, on, peek, queue, tick, withBudget } from './kit';

// ------------------------------------------------------------------ startTurn()
/** startTurn(): every clock of the post powers, and the blows that land at a turn's start */
export function mdpStartTurn(b: Battle, side: 0 | 1, ev: BattleEvent[]) {
  let st = peek(b);
  // the tallies that start before any cast
  if (!st) {
    if (side === 0 && b.sides[0].cats.some((c) => !c.ko && c.ultUsed === 0 && c.def.catId === 'xp_pinomichi' && mdOn(b, c))) st = S(b);
    else if (side === 1 && crew(b, 0, 'xp_hermiaune')) st = S(b);
    else return;
  }
  const foe = 1 - side;
  st.ctx = null;
  st.firstHit[side] = null;
  st.lastEnd[side] = null;
  st.benchNow[side] = st.benchNext[side] > 0;
  if (st.benchNow[side]) st.benchNext[side]--;
  st.benchNow[foe] = false;
  if (st.benchNow[side]) {
    const c = b.shipCenter(side);
    info(ev, st.timeStop && st.timeStop.side === side ? 'EL TIEMPO ESTÁ DETENIDO: ESTE TURNO NO PASA' : 'TREGUA: NADIE DISPARA ESTE TURNO', c.x, c.y - 230, 0xe6c34a);
  }
  if (st.marks) st.marks.volley = false;
  // ---- the daily clocks: your own turns (owner clock) and theirs (foe clock)
  tick(st.rubber[foe]);
  tick(st.alloy[foe]);
  tick(st.tele[foe]);
  tick(st.chill[foe]);
  tick(st.portals[side]);
  for (const k of st.clones) if (k.side === foe) tick(k.t);
  st.clones = st.clones.filter((k) => k.t.now || k.t.next > 0);
  for (const [c, t] of st.shrink) if (c.side === side) tick(t.t);
  for (const [c, t] of st.exposed) if (c.side === side) tick(t);
  for (const [c, t] of st.frozen) if (c.side === side) tick(t);
  if (st.barrel?.side === foe) tick(st.barrel.t);
  if (st.swamp?.side === side) tick(st.swamp.t);
  if (st.bananas?.side === side) tick(st.bananas.t);
  for (const [c, u] of st.upgrade) if (c.side === foe) tick(u.t);
  if (st.shield?.side === foe) tick(st.shield.t);
  if (st.decree?.side === side) tick(st.decree.t);
  if (st.undercover?.side === foe) tick(st.undercover.t);
  if (st.catch?.side === foe) tick(st.catch.t);
  if (st.piranhas?.side === side) tick(st.piranhas.t);
  if (st.high?.side === side) tick(st.high.mine);
  if (st.high?.side === foe) tick(st.high.theirs);
  if (st.cake?.side === side) tick(st.cake.t);
  if (st.heart?.side === foe) tick(st.heart.t);
  if (st.night?.side === foe) tick(st.night.t);
  if (st.counter?.side === foe) tick(st.counter.t);
  if (st.copy?.side === side) tick(st.copy.t);
  if (st.flips?.side === side) tick(st.flips.t);
  if (st.unmask?.side === side) tick(st.unmask.t);
  const ctr = b.shipCenter(side);
  // ---- Hermiaune: the snapshot at the start of their turn (what she can undo)
  if (side === 1 && crew(b, 0, 'xp_hermiaune')) snapshot(b, st);
  // ---- Gatojo: the stopped time comes back (at the start of their turn after next)
  const ts = st.timeStop;
  if (ts && ts.side === side && --ts.waits <= 0) {
    st.timeStop = null;
    resume(b, ts, ev);
  }
  // ---- Pinomichi's nose grows on every turn of yours he doesn't use the ultimate
  if (side === 0)
    for (const c of b.sides[0].cats)
      if (!c.ko && c.ultUsed === 0 && c.def.catId === 'xp_pinomichi' && mdOn(b, c)) {
        const n = Math.min(8, (st.nose.get(c) ?? 0) + 1);
        st.nose.set(c, n);
        if (n > 1) {
          const p = b.roomCenter(0, c.room);
          fx(ev, 'mdpNose', 0, p.x, p.y, { n, uid: c.def.uid, path: -1 });
        }
      }
  // ---- Michi Atom's ball lands
  for (const a of st.atom.filter((k) => k.side === side)) {
    if (--a.turns > 0) continue;
    st.atom.splice(st.atom.indexOf(a), 1);
    atomLands(b, a);
  }
  // ---- Ryumiau's notebook
  const nt = st.note;
  if (nt && nt.side === side) {
    if (nt.target.ko) {
      const next = alive(b, foe).sort((a, z) => z.hp - a.hp || z.def.atk - a.def.atk)[0];
      if (next) nt.target = next;
      else st.note = null;
    }
    if (st.note && --nt.turns <= 0) {
      st.note = null;
      noteFalls(b, nt.target, ev);
    } else if (st.note) {
      const p = b.roomCenter(foe, nt.target.room);
      fx(ev, 'mdpNote', foe, p.x, p.y, { n: nt.turns, uid: nt.target.def.uid, path: -1 });
      info(ev, `ANOTADO: ${nt.target.def.name.toUpperCase()} · ${nt.turns}…`, p.x, p.y - 150, 0xe8e8e8);
    }
  }
  // ---- Capitán Ahabigotes hauls the rope (at their turn's start)
  const hp = st.harpoon;
  if (hp && hp.side === side) haul(b, st, hp, ev);
  // ---- the barrel opens: the ball for whoever fired the last ultimate
  const br = st.barrel;
  if (br && br.side === side && br.t.now && br.t.next === 0) {
    st.barrel = null;
    if (!br.by.ko) barrelOut(b, br);
  }
  // ---- the swamp keeps them wet and their cannons stuck
  const sw = st.swamp;
  if (sw && sw.side === side && sw.t.now) {
    b.wetCells(side, b.sides[side].ship.cells(), ev);
    for (const m of b.sides[side].ship.modules) if (m.kind === 'cannon') m.disabled = Math.max(m.disabled, 1);
    info(ev, `PANTANO: CAÑONES ATASCADOS (${left(sw.t)})`, ctr.x, ctr.y - 200, 0x7aa83a);
  }
  if (sw && !on(sw.t)) st.swamp = null;
  // ---- Garritas' healing factor
  for (const [c, n] of st.regen) {
    if (c.side !== side || n <= 0) continue;
    st.regen.set(c, n - 1);
    if (c.ko) continue;
    const h = heal(c, c.maxHp * 0.15);
    if (h > 0) {
      const p = b.roomCenter(side, c.room);
      fx(ev, 'mdpRegen', side, p.x, p.y, { n: h, uid: c.def.uid, path: -1 });
      info(ev, `FACTOR CURATIVO +${h}`, p.x, p.y - 120, 0xffd23f);
    }
  }
  // ---- Doomiau's law: no healing for them
  if (st.decree) {
    clampHeal(b, st.decree);
    if (!on(st.decree.t)) st.decree = null;
  }
  // ---- the expelled cat comes back with half its life at most
  for (const [c, ex] of st.exile) {
    if (c.side !== side) continue;
    tick(ex.t);
    if (on(ex.t)) {
      c.ultCharge = ex.meter;
      continue;
    }
    st.exile.delete(c);
    if (c.ko) continue;
    c.hp = Math.min(c.hp, Math.max(1, Math.round(c.maxHp * 0.5)));
    c.ultCharge = ex.meter;
    const p = b.roomCenter(side, c.room);
    fx(ev, 'mdpReturn', side, p.x, p.y, { uid: c.def.uid, path: -1 });
    info(ev, `${c.def.name.toUpperCase()} VOLVIÓ DEL ESPACIO`, p.x, p.y - 140, 0x9fd8ff);
  }
  // ---- Romiau: the one in love hands over its meter
  for (const [c, l] of st.love) {
    if (c.side !== side) continue;
    tick(l.t);
    if (!l.t.now) {
      st.love.delete(c);
      continue;
    }
    if (c.ko) continue;
    const give = Math.min(0.25, c.ultCharge);
    c.ultCharge -= give;
    if (!l.by.ko) l.by.ultCharge = Math.min(1, l.by.ultCharge + 0.25);
    const p = b.roomCenter(side, c.room);
    fx(ev, 'mdpLove', side, p.x, p.y, { uid: c.def.uid, path: -1 });
    info(ev, 'ENAMORADO: LE REGALA 25 DE BARRA A ROMIAU', p.x, p.y - 140, 0xc8102e);
  }
  // ---- Michiércoles' piranhas
  const pr = st.piranhas;
  if (pr && pr.side === side) {
    if (pr.t.now) piranhas(b, pr, ev);
    else st.piranhas = null;
  }
  // ---- Daft Miau's pyramid fires at the close of your turn (= the start of theirs)
  const py = st.pyramid;
  if (py && py.side === foe) {
    pyramidLaser(b, st, py);
    if (--py.turns <= 0) st.pyramid = null;
  }
  // ---- Party Michi: the pile goes home
  const pl = st.pile;
  if (pl && pl.side === side) {
    st.pile = null;
    for (const [c, r] of pl.rooms) c.room = r;
    ev.push(...b.updateExposure(side));
    fx(ev, 'mdpPileBack', side, ctr.x, ctr.y, { path: -1 });
  }
  // ---- Sabrina's sugar heart bursts (broken, or after their 3 turns)
  const ht = st.heart;
  if (ht && ht.side === side && (ht.burst || !on(ht.t) || (ht.t.now && ht.t.next === 0))) {
    st.heart = null;
    confetti(b, ht);
  }
  // ---- Post Maulone: the chill clears whatever stuck
  chillOff(b, st);
  // ---- Luna's flipped wells and Miauby's suspended barriers come back
  if (st.flips && st.flips.side === side && !on(st.flips.t)) {
    for (const k of st.flips.wells) k.w.affects = k.affects;
    st.flips = null;
  }
  const um = st.unmask;
  if (um && um.side === side && !on(um.t)) {
    st.unmask = null;
    const s = b.sides[side];
    if (!s.ward && um.ward) s.ward = um.ward;
    if (um.bubbleMax > 0 && s.bubbleMax <= 0) {
      s.bubbleMax = um.bubbleMax;
      s.bubble = b.bubbleSource(side) ? um.bubbleMax : 0;
    }
    if (um.shieldHp > 0 && s.shieldHp <= 0) s.shieldHp = um.shieldHp;
    info(ev, 'SUS BARRERAS VUELVEN', ctr.x, ctr.y - 200, 0x8b5a2b);
  }
  // ---- Condorgato: one volley of the punchline gone per turn of yours
  const pu = st.punch;
  if (pu && pu.side === side && --pu.volleys <= 0) st.punch = null;
  // ---- the rest of the clocks that end
  if (st.bananas && !on(st.bananas.t)) st.bananas = null;
  if (st.shield && !on(st.shield.t)) st.shield = null;
  if (st.undercover && !on(st.undercover.t)) st.undercover = null;
  if (st.catch && !on(st.catch.t)) st.catch = null;
  if (st.high && !on(st.high.mine) && !on(st.high.theirs)) st.high = null;
  if (st.cake && !on(st.cake.t)) st.cake = null;
  if (st.night && !on(st.night.t)) st.night = null;
  if (st.counter && !on(st.counter.t)) st.counter = null;
  if (st.copy && !on(st.copy.t)) st.copy = null;
  if (st.barrel && st.barrel.by.ko && !on(st.barrel.t)) st.barrel = null;
  // Zoomic's scattered rings: one turn of his to pick them up
  for (const [c, r] of st.rings) {
    if (c.side !== side) continue;
    if (r.stale) {
      r.loose = 0;
      r.stale = false;
    } else if (r.loose > 0) r.stale = true;
  }
  // tanda 2 (agent PODERES-3): its clocks and the blows at a turn's start (turnD.ts)
  if (st.d) dStartTurn(b, st, side, ev);
}

function snapshot(b: Battle, st: MdpState) {
  const s = b.sides[0];
  st.snapshot = {
    cells: new Map(s.ship.cells().map((c) => [c, c.hp])),
    alive: s.ship.modules.map((m) => m.alive),
    cats: new Map(s.cats.map((c) => [c, { hp: c.hp, ko: c.ko, lives: c.lives, overboard: !!c.overboard }])),
    meters: new Map(b.sides[1].cats.map((c) => [c, c.ultCharge])),
    flood: s.flood,
    breaches: s.breaches,
  };
}

/** Gatojo: every stored shot lands at once (×1.3; a boss captain's ship ×1.15) */
function resume(b: Battle, ts: NonNullable<MdpState['timeStop']>, ev: BattleEvent[]) {
  const side = 1 - ts.side;
  const ctr = b.shipCenter(ts.side);
  if (!ts.stored.length) {
    info(ev, 'EL TIEMPO VUELVE A CORRER', ctr.x, ctr.y - 220, 0xe6c34a);
    fx(ev, 'mdpResume', ts.side, ctr.x, ctr.y, { n: 0, path: -1 });
    return;
  }
  const events: BattleEvent[] = [];
  const paths: ShotPath[] = [];
  fx(events, 'mdpResume', ts.side, ctr.x, ctr.y, { n: ts.stored.length, path: 0, at: 0 });
  for (const s of ts.stored) {
    const ps = s.paths.map((p) => tail(p));
    b.resolvePaths(side, s.shot, s.atk * ts.mul, ps, events, paths.length);
    paths.push(...ps);
  }
  info(events, `¡Y EL TIEMPO VUELVE! ${ts.stored.length} TIROS A LA VEZ x${ts.mul}`, ctr.x, ctr.y - 230, 0xe6c34a, 0, 0);
  queue(b, { side, label: 'EL TIEMPO VUELVE A CORRER', paths, events, shot: ts.stored[0].shot });
  feat(b, side, 'md_timestop', ts.stored.length);
}

/** Michi Atom's ball comes down on the module (or the nearest one) */
function atomLands(b: Battle, a: MdpState['atom'][number]) {
  const enemy = 1 - a.side;
  const es = b.sides[enemy];
  let m = es.ship.modules[a.module];
  if (!m || !m.alive || !es.ship.moduleCells(m.id).length) m = moduleNear(b, enemy, b.roomCenter(enemy, a.module)) ?? m;
  if (!m) return;
  const t = b.roomCenter(enemy, m.id);
  const from = { x: t.x - dirOf(a.side) * 160, y: -360 };
  const p = drawn(b, a.side, [from, ...line(from, t, 18)], 'earth', 'ballistic', []);
  p.impacts = [p.points.length - 1];
  p.owners = [a.side];
  const ball: ShotDef = { id: 'md_balon', name: 'BALÓN INFINITO', element: 'earth', trajectory: 'ballistic', power: a.pw * 3, radius: a.radius, catMul: 0.5 };
  const events: BattleEvent[] = [];
  withBudget(b, enemy, frac(b, enemy), () => b.resolvePaths(a.side, ball, a.atk, [p], events));
  const cat = es.cats.find((c) => c.room === m!.id && !c.ko);
  if (cat) S(b).exposed.set(cat, { now: false, next: 2 });
  fx(events, 'mdpGoal', enemy, t.x, t.y, { uid: cat?.def.uid, path: 0, at: p.points.length - 1 });
  if (cat) info(events, `¡GOOOL! ${cat.def.name.toUpperCase()} QUEDA EXPUESTO`, t.x, t.y - 150, 0x3a7bd5, 0, p.points.length - 1);
  queue(b, { side: a.side, label: '¡EL BALÓN INFINITO LLEGA!', paths: [p], events, shot: ball });
  feat(b, a.side, 'md_goal');
}

/** Ryumiau: the noted one falls (shields and spare lives don't count); a boss captain loses 40 % */
function noteFalls(b: Battle, c: CatState, ev: BattleEvent[]) {
  if (c.ko) return;
  const p = b.roomCenter(c.side, c.room);
  fx(ev, 'mdpNoteKill', c.side, p.x, p.y, { uid: c.def.uid, path: -1 });
  if (isBossCaptain(b, c)) {
    bleed(b, c, c.maxHp * 0.4, ev, 'shadow');
    info(ev, 'EL CAPITÁN NO CAE… PERO PIERDE 40 %', p.x, p.y - 150, 0xc8102e);
  } else {
    c.shields = 0;
    c.lives = 1;
    const hp = c.hp;
    c.hp = 0;
    b.koOrRevive(c);
    ev.push({ k: 'cat', side: c.side, uid: c.def.uid, dmg: hp, ko: c.ko, shield: false, element: 'shadow', fx: { ...c.fx }, path: -1, at: 0 });
    info(ev, `${c.def.name.toUpperCase()}: TAL COMO ESTABA ESCRITO`, p.x, p.y - 150, 0xc8102e);
  }
  feat(b, 1 - c.side, 'md_note');
  b.checkVictory();
}

/** Capitán Ahabigotes: 10 % / 20 % / 30 % of the tied module's max life (one cap for the three; never the core) */
function haul(b: Battle, st: MdpState, hp: NonNullable<MdpState['harpoon']>, ev: BattleEvent[]) {
  const side = hp.side;
  const s = b.sides[side];
  let m = s.ship.modules[hp.module];
  if (!m?.alive || !s.ship.moduleCells(m.id).length) {
    const next = s.ship.modules.filter((k) => k.alive && k.kind !== 'core' && s.ship.moduleCells(k.id).length).sort((a, z) => s.ship.moduleCells(z.id).length - s.ship.moduleCells(a.id).length || a.id - z.id)[0];
    if (!next) {
      st.harpoon = null;
      return;
    }
    hp.module = next.id;
    m = next;
  }
  hp.step++;
  const pct = [0.1, 0.2, 0.3][hp.step - 1] ?? 0.3;
  const cells = s.ship.moduleCells(m.id);
  let amount = cells.reduce((a, c) => a + c.maxHp, 0) * pct;
  const prev = b.budget;
  b.budget = { side, left: hp.budget };
  for (const c of cells) {
    if (amount <= 0 || c.hp <= 0) continue;
    const d = cut(b, side, c, Math.min(amount, c.hp), ev, -1, 0);
    if (!d) break;
    amount -= d;
  }
  collapse(b, side, ev, -1, 0);
  hp.budget = b.budget.left;
  b.budget = prev;
  const p = b.roomCenter(side, m.id);
  fx(ev, 'mdpPull', side, p.x, p.y, { n: Math.round(pct * 100), path: -1 });
  info(ev, `¡JALA! −${Math.round(pct * 100)} % DEL MÓDULO`, p.x, p.y - 140, 0xe8e1d3);
  feat(b, 1 - side, 'md_haul');
  if (hp.step >= 3 || hp.budget <= 0) st.harpoon = null;
  b.checkVictory();
}

/** the barrel opens: the ball at whoever fired the last ultimate (nobody: their cat with the most meter) */
function barrelOut(b: Battle, br: NonNullable<MdpState['barrel']>) {
  const enemy = 1 - br.side;
  const target = br.last && !br.last.ko ? br.last : alive(b, enemy).sort((a, z) => z.ultCharge - a.ultCharge || z.def.atk - a.def.atk)[0];
  if (!target) return;
  const t = b.roomCenter(enemy, target.room);
  const p = lob(b, br.side, b.muzzle(br.side, br.by.def.uid), t, 170, 'earth');
  const ball: ShotDef = { id: 'md_pelotazo', name: 'PELOTAZO', element: 'earth', trajectory: 'ballistic', power: br.pw * 1.5, radius: CELL * 1.3, catMul: 0.6 };
  const events: BattleEvent[] = [];
  withBudget(b, enemy, frac(b, enemy), () => b.resolvePaths(br.side, ball, br.atk, [p], events));
  fx(events, 'mdpBarrelOut', enemy, t.x, t.y, { uid: target.def.uid, path: 0, at: p.points.length - 1 });
  queue(b, { side: br.side, label: '¡FUE SIN QUERER QUERIENDO!', paths: [p], events, shot: ball });
  feat(b, br.side, 'md_barrel');
}

/** Michiércoles' piranhas bite the waterline (one cap for the three turns) */
function piranhas(b: Battle, pr: NonNullable<MdpState['piranhas']>, ev: BattleEvent[]) {
  const side = pr.side;
  const s = b.sides[side];
  const low = s.ship.cells().filter((c) => b.cellCenter(side, c.x, c.y).y >= b.waterY - CELL * 0.5);
  const prev = b.budget;
  b.budget = { side, left: pr.budget };
  for (const c of low) cut(b, side, c, pr.atk * pr.pw * 0.2 * DMG_K, ev, -1, 0);
  pr.budget = b.budget.left;
  b.budget = prev;
  b.wetCells(side, low.filter((c) => c.hp > 0 && s.ship.get(c.x, c.y) === c), ev);
  collapse(b, side, ev, -1, 0);
  for (const c of s.cats) {
    if (c.ko || b.isFlying(c)) continue;
    if (b.roomCenter(side, c.room).y >= b.waterY - CELL * 0.5) bleed(b, c, c.maxHp * 0.1, ev, 'water');
  }
  const span = shipSpan(b, side);
  fx(ev, 'mdpPiranha', side, (span.x0 + span.x1) / 2, b.waterY, { n: left(pr.t), path: -1 });
  info(ev, `¡PIRAÑAS! (${left(pr.t)})`, (span.x0 + span.x1) / 2, b.waterY - 120, 0x5b3a7a);
  feat(b, 1 - side, 'md_piranha');
  b.checkVictory();
}

/** Daft Miau's pyramid: a laser where your cat hit this turn (a miss: the nearest live module) */
function pyramidLaser(b: Battle, st: MdpState, py: NonNullable<MdpState['pyramid']>) {
  const enemy = 1 - py.side;
  const own = b.shipCenter(py.side);
  const from = { x: own.x, y: shipTop(b, py.side) - CELL * 3 };
  const end = st.firstHit[py.side] ?? st.lastEnd[py.side];
  let t: PathPoint;
  const hit = end ? b.cellAt(end.x, end.y) : null;
  if (end && hit && hit.side === enemy) t = end;
  else {
    const m = moduleNear(b, enemy, end ?? b.shipCenter(enemy));
    t = m ? b.roomCenter(enemy, m.id) : b.shipCenter(enemy);
  }
  const silver = py.k % 2 === 0;
  py.k++;
  const p = dash(b, py.side, from, t, silver ? 'electric' : 'light', 'beam');
  const laser: ShotDef = { id: silver ? 'md_laser_plata' : 'md_laser_oro', name: 'LÁSER', element: silver ? 'electric' : 'light', trajectory: 'beam', power: py.pw * 0.4, radius: CELL * 1.0, catMul: 0.6, statuses: silver ? [{ id: 'charged', turns: 2 }] : [] };
  const events: BattleEvent[] = [];
  withBudget(b, enemy, frac(b, enemy), () => b.resolvePaths(py.side, laser, py.atk, [p], events));
  if (!silver) b.sides[enemy].buffs.blind = Math.max(b.sides[enemy].buffs.blind, 1);
  fx(events, 'mdpLaser', enemy, t.x, t.y, { n: silver ? 0 : 1, path: 0, at: p.points.length - 1 });
  queue(b, { side: py.side, label: silver ? 'PIRÁMIDE: LÁSER DE PLATA' : 'PIRÁMIDE: LÁSER DE ORO', paths: [p], events, shot: laser });
  feat(b, py.side, 'md_laser');
}

/** Sabrina's heart bursts: half of what it swallowed, in 8 confetti blows on their ship */
function confetti(b: Battle, ht: NonNullable<MdpState['heart']>) {
  const enemy = 1 - ht.side;
  const own = b.shipCenter(ht.side);
  const half = ht.absorbed * 0.5;
  const events: BattleEvent[] = [];
  if (half < 1) {
    info(events, 'EL CORAZÓN SE DESINFLA (NO TRAGÓ NADA)', own.x, own.y - 200, 0xffd6e8);
    queue(b, { side: ht.side, label: '', paths: [], events, shot: { id: 'md_confeti', name: 'CONFETI', element: 'crystal', trajectory: 'ballistic', power: 0, radius: 1 } });
    return;
  }
  // each blow lands `half / 8` raw on its spot: power = that / attack (resolveImpact multiplies them back)
  const per = half / 8 / DMG_K;
  const shot: ShotDef = { id: 'md_confeti', name: 'CONFETI DE AZÚCAR', element: 'crystal', trajectory: 'ballistic', power: per / Math.max(1, ht.atk), radius: CELL * 1.0, catMul: 0.4, statuses: [{ id: 'prism', turns: 2 }] };
  const from = { x: own.x, y: shipTop(b, ht.side) - CELL * 2 };
  const paths = spreadCells(b, enemy, 8).map((c, i) => lob(b, ht.side, { x: from.x, y: from.y - i * 6 }, b.cellCenter(enemy, c.x, c.y), 200 + (i % 3) * 40, 'crystal'));
  withBudget(b, enemy, frac(b, enemy), () => b.resolvePaths(ht.side, shot, ht.atk, paths, events));
  const ctr = b.shipCenter(enemy);
  fx(events, 'mdpConfetti', enemy, ctr.x, ctr.y, { n: Math.round(half), path: 0, at: lastAt(paths[0]) });
  queue(b, { side: ht.side, label: '¡EL CORAZÓN ESTALLA!', paths, events, shot });
  feat(b, ht.side, 'md_heart', Math.round(ht.absorbed));
}
