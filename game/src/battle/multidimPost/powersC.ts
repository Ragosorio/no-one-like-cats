/**
 * After the Parte III · post MULTIDIMENSIONAL powers 41–60 (the magic library, the other side, the desert, the gothic
 * school, a galaxy far away, the family, the palace, bachata, ballads, relax, two colors, sugar, the pyramid, the party,
 * neon and the pitch). Same rules as powersA.ts.
 */
import type { Battle, PathPoint, ShotPath } from '../sim';
import type { Cell } from '../ship';
import type { CatState, StatusId } from '../types';
import type { UltCtx } from '../ults';
import { chemCombo } from './kitD';
import { clamp, collapse, cut, landing, normal, shipSpan, shipTop } from '../ults';
import {
  CAT_K,
  CELL,
  DMG_K,
  PW,
  S,
  T,
  alive,
  bestModules,
  cellNear,
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
} from './kit';
import { aimedModule } from './powersA';

export function ultsC() {
  return {
    xp_hermiaune,
    xp_lunalovegata,
    xp_miaunce,
    xp_heisenmiau,
    xp_michiercoles,
    xp_michiwan,
    xp_gatoleone,
    xp_gatoneta,
    xp_romiau,
    xp_miauki,
    xp_postmaulone,
    xp_miautentacion,
    xp_sabrina,
    xp_daftmiau,
    xp_partymichi,
    xp_miauknd,
    xp_miaussi,
    xp_gatistiano,
    xp_miaupe,
    xp_lamiau,
  };
}

/** a blow that goes through every shield: bubble, legacy shield, arcane layers and the cats' own (restored after) */
export function bare<T>(b: Battle, side: number, fn: () => T): T {
  const s = b.sides[side];
  const keep = { bubble: s.bubble, ward: s.ward, shieldHp: s.shieldHp, shields: s.cats.map((c) => c.shields) };
  s.bubble = 0;
  s.ward = null;
  s.shieldHp = 0;
  for (const c of s.cats) c.shields = 0;
  try {
    return fn();
  } finally {
    s.bubble = keep.bubble;
    s.ward = keep.ward;
    s.shieldHp = keep.shieldHp;
    s.cats.forEach((c, i) => (c.shields = keep.shields[i]));
  }
}
/** a sweep along their deck: one impact on the center of every top cell */
function deckSweep(b: Battle, o: UltCtx, el: import('../types').ElementId, kind: import('../types').Trajectory): ShotPath {
  const enemy = 1 - o.side;
  const dir = dirOf(o.side);
  const cells = deck(b, enemy).sort((a, z) => dir * (b.cellCenter(enemy, a.x, a.y).x - b.cellCenter(enemy, z.x, z.y).x));
  const pts: PathPoint[] = [o.origin];
  const at: number[] = [];
  let prev = o.origin;
  cells.forEach((c, i) => {
    const q = b.cellCenter(enemy, c.x, c.y);
    pts.push(...(i ? line(prev, q, 10) : hop(prev, q, 110, 14)));
    at.push(pts.length - 1);
    prev = q;
  });
  return drawn(b, o.side, pts, el, kind, at);
}

// ---------------------------------------------------------------- Hermiaune · TIME TURNER!
// She turns the hourglass and UNDOES their last turn: the damage they did you in it is repaired (your cats' life — the
// ones that fell get up —, your cells and modules still standing) and the meter they gained in it is taken away. What
// fell off the ship and what the Void erased don't come back.
function xp_hermiaune(b: Battle, o: UltCtx): ShotPath[] {
  const own = b.sides[o.side];
  const enemy = 1 - o.side;
  const me = b.shipCenter(o.side);
  stamp(b, o, me.x, me.y);
  const st = S(b);
  const snap = st.snapshot;
  st.snapshot = null;
  if (!snap) {
    info(o.events, 'NO HAY NADA QUE DESHACER… TODAVÍA', me.x, me.y - 200, 0xe6c34a);
    return [];
  }
  let cells = 0;
  for (const c of own.ship.cells()) {
    const was = snap.cells.get(c);
    if (was === undefined || c.status.voided || was <= c.hp) continue;
    const amount = was - c.hp;
    c.hp = was;
    cells += amount;
    o.events.push({ k: 'heal', side: o.side, cell: c, amount });
  }
  own.ship.modules.forEach((m, i) => {
    if (snap.alive[i] && !m.alive && own.ship.moduleCells(m.id).length && own.ship.moduleCells(m.id).every((c) => !c.status.voided)) {
      const mm = m as typeof m & { _reported?: boolean };
      mm.alive = true;
      mm._reported = false;
      for (const c of own.cats) if (c.room === m.id && !c.ko) c.exposed = false;
      const p = b.roomCenter(o.side, m.id);
      fx(o.events, 'mdpRebuild', o.side, p.x, p.y, { path: -1 });
    }
  });
  const back: string[] = [];
  for (const c of own.cats) {
    const was = snap.cats.get(c);
    if (!was) continue;
    if (c.ko && !was.ko) {
      c.ko = false;
      c.hp = Math.max(1, was.hp);
      c.lives = Math.max(1, was.lives);
      c.overboard = was.overboard;
      c.exposed = !own.ship.modules[c.room].alive;
      c.fx = { burning: 0, shocked: 0, wet: 0, frozen: 0 };
      const p = b.roomCenter(o.side, c.room);
      fx(o.events, 'mdpRevive', o.side, p.x, p.y, { uid: c.def.uid, n: 1, path: -1 });
      back.push(c.def.name);
    } else if (!c.ko && was.hp > c.hp) c.hp = was.hp;
  }
  if (snap.flood < own.flood) own.flood = snap.flood;
  if (snap.breaches < own.breaches) own.breaches = snap.breaches;
  o.events.push({ k: 'flood', side: o.side, flood: own.flood, breaches: own.breaches });
  let meter = 0;
  for (const [c, m] of snap.meters)
    if (c.side === enemy && !c.ko && c.ultCharge > m) {
      meter += c.ultCharge - m;
      c.ultCharge = m;
    }
  fx(o.events, 'mdpTurner', o.side, me.x, me.y, { n: cells, path: -1 });
  info(o.events, `¡DESHECHO! +${cells} DE BARCO · SU BARRA −${Math.round(meter * 100)}${back.length ? ` · VUELVE ${back.join(', ').toUpperCase()}` : ''}`, me.x, me.y - 200, 0xe6c34a);
  return [];
}

// ---------------------------------------------------------------- Luna Lovegata · UPSIDE-DOWN WORLD!
// She reads her magazine upside down and the world listens: everything that HELPS their side turns on them — cat
// shields become EXPUESTO (take ×1.5, 2 turns), their boosts and spare lives become Maldito, their wells pull their own
// shots (2 turns) — and if the wind was helping them, now it helps you.
function xp_lunalovegata(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const es = b.sides[enemy];
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y);
  const st = S(b);
  const flipped: string[] = [];
  const curse = (cells: Cell[]) => {
    for (const c of cells) c.status.cursed = Math.max(c.status.cursed ?? 0, 2);
    if (cells.length) o.events.push({ k: 'status', side: enemy, cells, status: 'cursed' });
  };
  let shields = 0;
  for (const c of alive(b, enemy)) {
    if (c.shields > 0) {
      shields += c.shields;
      c.shields = 0;
      st.exposed.set(c, T(2));
    }
    if (c.lives > 1) {
      c.lives = 1;
      curse(es.ship.moduleCells(c.room));
      flipped.push(`${c.def.name.toUpperCase()} SIN SEGUNDA VIDA`);
    }
  }
  if (shields) flipped.push(`${shields} ESCUDOS → EXPUESTOS`);
  if (es.buffs.stone > 0 || es.buffs.empower > 0) {
    es.buffs.stone = 0;
    es.buffs.empower = 0;
    curse(es.ship.cells().filter((c) => c.module !== undefined));
    flipped.push('REFUERZOS → MALDITOS');
  }
  const wells = b.wells.filter((w) => w.owner === enemy && w.affects !== enemy);
  if (wells.length) {
    st.flips = { side: enemy, wells: wells.map((w) => ({ w, affects: w.affects })), t: T(2) };
    for (const w of wells) w.affects = enemy;
    flipped.push(`${wells.length} POZOS AL REVÉS`);
  }
  const dir = dirOf(o.side);
  if (b.wind * dir < 0) {
    b.wind = -b.wind;
    flipped.push('EL VIENTO');
  }
  fx(o.events, 'mdpUpside', enemy, ctr.x, ctr.y, { n: flipped.length, path: -1 });
  info(o.events, flipped.length ? `¡AL REVÉS!: ${flipped.join(' · ')}` : '¡AL REVÉS! (NADA LOS AYUDABA)', ctr.x, ctr.y - 220, 0xd96c9e);
  return [];
}

// ---------------------------------------------------------------- Miaunce · MIND CATCH!
// She holds out her paw and STOPS in mid-air the next shot they fire at your ship (a cat's or an ultimate, within their
// next 2 turns): she turns it round and sends it back at the cat that fired it, ×1.5 (an ultimate keeps the 45 % / 18 %
// cap). Cannonballs don't count.
function xp_miaunce(b: Battle, o: UltCtx): ShotPath[] {
  const me = b.roomCenter(o.side, o.cat.room);
  stamp(b, o, me.x, me.y);
  S(b).catch = { side: o.side, t: T(2), by: o.cat };
  fx(o.events, 'mdpCatchReady', o.side, me.x, me.y, { n: 2, uid: o.cat.def.uid, path: -1 });
  return [];
}

// ---------------------------------------------------------------- Heisenmiau · PURE CHEMISTRY!
// The chemistry goes off: a flask leaves Prisma where you aimed, then every cell of their ship with any status blows up
// once per status it carries (0.3·P each, all of them used up), chaining out from the flask. The more statuses your
// crew left them, the worse.
function xp_heisenmiau(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const es = b.sides[enemy];
  const tgt = landing(b, o);
  const start = cellNear(b, enemy, tgt);
  const t = start ? b.cellCenter(enemy, start.x, start.y) : b.shipCenter(enemy);
  stamp(b, o, t.x, t.y);
  const flask = mk(o, 'md_matraz', PW(o) * 0.3, { element: 'crystal', trajectory: 'ballistic', radius: CELL * 1.2, statuses: [{ id: 'prism', turns: 2 }] });
  const p = lob(b, o.side, o.origin, t, 160, 'crystal');
  b.resolvePaths(o.side, flask, o.atk, [p], o.events);
  const at = p.points.length - 1;
  // the chain: from the flask outward (nearest first), every cell with a status once
  const g = start ?? cellNear(b, enemy, t);
  const lit = es.ship
    .cells()
    .filter((c) => Object.keys(c.status).some((k) => k !== 'voided'))
    .sort((a, z) => (g ? Math.hypot(a.x - g.x, a.y - g.y) - Math.hypot(z.x - g.x, z.y - g.y) : 0) || a.y - z.y || a.x - z.x);
  let n = 0;
  // with Pinkmiau's lab (tanda 2, agent PODERES-3) every status counts twice, max 6 per cell
  const twice = chemCombo(b, o.side);
  for (const c of lit) {
    const ids = (Object.keys(c.status) as StatusId[]).filter((k) => k !== 'voided');
    if (!ids.length || c.hp <= 0) continue;
    for (const k of ids) delete c.status[k];
    if (!hurtable(b, enemy, c)) continue;
    const q = b.cellCenter(enemy, c.x, c.y);
    const count = twice ? Math.min(6, ids.length * 2) : ids.length;
    const d = cut(b, enemy, c, o.atk * PW(o) * 0.3 * count * DMG_K, o.events, 0, at);
    if (d > 0 && n < 24) fx(o.events, 'mdpChem', enemy, q.x, q.y, { n: count, path: 0, at });
    n++;
  }
  collapse(b, enemy, o.events, 0, at);
  info(o.events, n ? `¡QUÍMICA PURA! ${n} CELDAS DETONADAS${twice ? ' (x2 CON PINKMIAU)' : ''}` : 'NADA QUE COCINAR (SOLO EL MATRAZ)', t.x, t.y - 170, 0x4fc3f7, 0, at);
  return [p];
}

// ---------------------------------------------------------------- Michiércoles · PIRANHA POOL!
// She drops piranhas in their water: at the start of each of their next 3 turns every cell of their ship at the
// waterline or below takes a bite (0.2·P, one 45 % / 18 % cap for the three) and gets soaked, and the cats in cabins
// under the waterline lose 10 % of their life.
function xp_michiercoles(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const span = shipSpan(b, enemy);
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, b.waterY);
  const drop = { x: (span.x0 + span.x1) / 2, y: b.waterY + 6 };
  const p = drawn(b, o.side, [o.origin, ...hop(o.origin, drop, 180, 14)], 'shadow', 'ballistic', []);
  S(b).piranhas = { side: enemy, t: T(3), atk: o.atk, pw: PW(o), budget: Math.round((b.sides[enemy].ship.initialMax?.[0] ?? 0) * (b.cfg.boss?.side === enemy ? 0.18 : 0.45)) };
  fx(o.events, 'mdpPiranha', enemy, drop.x, b.waterY, { n: 3, path: 0, at: p.points.length - 1 });
  return [p];
}

// ---------------------------------------------------------------- Michi-Wan · HIGH GROUND!
// He takes the high ground: this turn and your next 2 your shots drop from above (they go through the first wall and hit
// +20 %), and their next 3 turns theirs have to climb: −30 % and they can't reach your decks under the water.
function xp_michiwan(b: Battle, o: UltCtx): ShotPath[] {
  const me = b.shipCenter(o.side);
  stamp(b, o, me.x, shipTop(b, o.side) - CELL * 2);
  S(b).high = { side: o.side, mine: T(2, true), theirs: T(3) };
  fx(o.events, 'mdpHighGround', o.side, me.x, shipTop(b, o.side), { n: 3, path: -1 });
  info(o.events, '¡TENGO LA VENTAJA DE LA ALTURA!', me.x, me.y - 220, 0xe8c170);
  return [];
}

// ---------------------------------------------------------------- Don Gatoleone · THE OFFER!
// He makes their strongest cat an offer: its next shot goes AGAINST ITS OWN SHIP (its most valuable module within 4
// cells of its cabin), and it hands its meter over to your crew «out of respect». A boss captain doesn't accept: it
// loses 50 meter.
function xp_gatoleone(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const target = strongest(b, enemy);
  const t = target ? b.roomCenter(enemy, target.room) : b.shipCenter(enemy);
  stamp(b, o, t.x, t.y);
  if (!target) return [];
  if (isBossCaptain(b, target)) {
    target.ultCharge = Math.max(0, target.ultCharge - 0.5);
    fx(o.events, 'mdpOffer', enemy, t.x, t.y, { n: 0, uid: target.def.uid, path: -1 });
    info(o.events, '«NO ACEPTO OFERTAS» (−50 DE BARRA)', t.x, t.y - 160, 0xd9b24c);
    return [];
  }
  const share = target.ultCharge;
  target.ultCharge = 0;
  const mates = alive(b, o.side).filter((c) => c !== o.cat);
  for (const c of mates) c.ultCharge = Math.min(1, c.ultCharge + share / Math.max(1, mates.length));
  S(b).offer.set(target, 1);
  fx(o.events, 'mdpOffer', enemy, t.x, t.y, { n: 1, uid: target.def.uid, path: -1 });
  info(o.events, `UNA OFERTA QUE ${target.def.name.toUpperCase()} NO PUEDE RECHAZAR`, t.x, t.y - 160, 0xd9b24c);
  return [];
}

// ---------------------------------------------------------------- María Gatoñeta · LET THEM EAT CAKE!
// Cake for everyone: their cats are STUFFED for 3 turns — no ultimate meter from anything (hitting or being hit) — and
// the first one that tries its ultimate falls asleep with a full belly (the meter is spent).
function xp_gatoneta(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y);
  const paths = alive(b, enemy).map((c, i) => drawn(b, o.side, [o.origin, ...hop(o.origin, b.roomCenter(enemy, c.room), 110 + i * 25, 14)], 'magic', 'ballistic', []));
  S(b).cake = { side: enemy, t: T(3), armed: true };
  fx(o.events, 'mdpCake', enemy, ctr.x, ctr.y, { n: 3, path: paths.length ? 0 : -1, at: paths.length ? paths[0].points.length - 1 : 0 });
  return paths;
}

// ---------------------------------------------------------------- Romiau Santos · BACHATA SERENADE!
// A bachata for their strongest cat, who falls IN LOVE: 2 of their turns it doesn't act, doesn't defend itself (takes
// ×1.25) and hands 25 of its meter to Romiau each turn. A boss captain falls in love for 1 turn.
function xp_romiau(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const target = strongest(b, enemy);
  const t = target ? b.roomCenter(enemy, target.room) : b.shipCenter(enemy);
  stamp(b, o, t.x, t.y);
  const p = drawn(b, o.side, [o.origin, ...hop(o.origin, t, 130, 14)], 'water', 'ballistic', []);
  if (target) {
    const n = isBossCaptain(b, target) ? 1 : 2;
    S(b).love.set(target, { t: T(n), by: o.cat });
    stun(b, target, n + 1);
    fx(o.events, 'mdpSerenade', enemy, t.x, t.y, { n, uid: target.def.uid, path: 0, at: p.points.length - 1 });
    info(o.events, `${target.def.name.toUpperCase()} SE ENAMORÓ`, t.x, t.y - 160, 0xc8102e, 0, p.points.length - 1);
  }
  return [p];
}

// ---------------------------------------------------------------- El Miauki · TEARFUL BALLAD!
// A ballad so sad EVERYONE cries: their next turn and your next turn nobody shoots (no cats, no volleys — the statuses
// still run). Your crew uses it to recover: +30 % life and +30 meter for each cat of yours, right now.
function xp_miauki(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const me = b.shipCenter(o.side);
  stamp(b, o, (me.x + b.shipCenter(enemy).x) / 2, me.y);
  let healed = 0;
  for (const c of alive(b, o.side)) {
    healed += heal(c, c.maxHp * 0.3);
    c.ultCharge = Math.min(1, c.ultCharge + 0.3);
  }
  const st = S(b);
  st.benchNext[enemy] = Math.max(st.benchNext[enemy], 1);
  st.benchNext[o.side] = Math.max(st.benchNext[o.side], 1);
  fx(o.events, 'mdpBallad', o.side, me.x, me.y, { n: healed, path: -1 });
  info(o.events, `TREGUA: NADIE DISPARA UN TURNO · TU TRIPULACIÓN +${healed}`, me.x, me.y - 200, 0xf2e1c9);
  return [];
}

// ---------------------------------------------------------------- Post Maulone · CHILL VIBES!
// The most relaxed vibe on the sea: their next 3 turns your crew can't be stunned, put to sleep, tangled, charmed or
// frozen (whatever they had comes off). And an icy guitar riff freezes their deck (0.6·P each top cell, Congelado).
function xp_postmaulone(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, shipTop(b, enemy));
  for (const c of alive(b, o.side)) {
    c.stunned = 0;
    c.fx.frozen = 0;
  }
  S(b).chill[o.side] = T(3);
  const riff = mk(o, 'md_guitarrazo', PW(o) * 0.6, { element: 'ice', trajectory: 'ballistic', radius: CELL * 0.45, statuses: [{ id: 'frozen', turns: 2 }] });
  const p = deckSweep(b, o, 'ice', 'wave');
  b.resolvePaths(o.side, riff, o.atk, [p], o.events);
  const me = b.shipCenter(o.side);
  fx(o.events, 'mdpChill', o.side, me.x, me.y, { n: 3, path: 0, at: p.impacts[0] ?? 0 });
  return [p];
}

// ---------------------------------------------------------------- Miautentación · PAIN INTO ART!
// He gathers everything weighing on your crew: he TAKES OFF every bad status of your cats and cells (Ardiendo, Maldito,
// Aturdido, Congelado…) and turns each one into a blow on their most valuable modules, carrying that same status
// (0.25·P each, 10 at most). Nothing to take off: a 0.6·P wave.
function xp_miautentacion(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const own = b.sides[o.side];
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y);
  const pains: (StatusId | null)[] = [];
  for (const c of alive(b, o.side)) {
    if (c.fx.burning > 0) pains.push('burning');
    if (c.fx.frozen > 0) pains.push('frozen');
    if (c.fx.shocked > 0) pains.push('charged');
    if (c.fx.wet > 0) pains.push('wet');
    if (c.stunned > 0) pains.push(null);
    c.fx = { burning: 0, shocked: 0, wet: 0, frozen: 0 };
    c.stunned = 0;
  }
  const BAD: StatusId[] = ['burning', 'rooted', 'cursed', 'frozen', 'charged', 'wet', 'grav', 'prism', 'steam'];
  const cleaned: Cell[] = [];
  for (const c of own.ship.cells()) {
    let any = false;
    for (const k of BAD)
      if (c.status[k]) {
        pains.push(k);
        delete c.status[k];
        any = true;
      }
    if (any) cleaned.push(c);
  }
  if (cleaned.length) o.events.push({ k: 'status', side: o.side, cells: cleaned, status: 'wet' });
  if (!pains.length) {
    const paths = normal(b, o, { ...o.shot, trajectory: 'wave', projectiles: 1, pierce: 8, power: PW(o) * 0.6, statuses: [] });
    fx(o.events, 'mdpArt', enemy, ctr.x, ctr.y, { n: 0, path: 0, at: lastAt(paths[0]) });
    return paths;
  }
  const mods = bestModules(b, enemy, 5);
  const blows = pains.slice(0, 10);
  const paths: ShotPath[] = [];
  blows.forEach((k, i) => {
    const m = mods[i % Math.max(1, mods.length)];
    const t = m ? b.roomCenter(enemy, m.id) : ctr;
    const p = lob(b, o.side, { x: o.origin.x, y: o.origin.y - (i % 4) * 8 }, { x: t.x + ((i % 3) - 1) * 12, y: t.y }, 140 + (i % 4) * 30, 'sound');
    const blow = mk(o, `md_arte_${k ?? 'golpe'}`, PW(o) * 0.25, { element: 'sound', trajectory: 'ballistic', radius: CELL * 1.0, statuses: k ? [{ id: k, turns: 2 }] : [] });
    b.resolvePaths(o.side, blow, o.atk, [p], o.events, i);
    paths.push(p);
  });
  fx(o.events, 'mdpArt', enemy, ctr.x, ctr.y, { n: blows.length, path: 0, at: lastAt(paths[0]) });
  info(o.events, `${pains.length} PENAS → ${blows.length} GOLPES`, o.origin.x, o.origin.y - 150, 0xf2d24b);
  return paths;
}

// ---------------------------------------------------------------- Sabrina Gatpenter · SUGAR HEART!
// A giant SUGAR HEART over your ship: it swallows every bit of damage (up to 25 % of your ship's life) for their next 3
// turns. When it breaks or runs out it bursts into sugar confetti on their ship: half of what it swallowed, in 8 blows.
function xp_sabrina(b: Battle, o: UltCtx): ShotPath[] {
  const me = b.shipCenter(o.side);
  stamp(b, o, me.x, me.y);
  const pool = Math.round((b.sides[o.side].ship.initialMax?.[0] ?? 0) * 0.25);
  S(b).heart = { side: o.side, t: T(3), pool, absorbed: 0, atk: o.atk, pw: PW(o), by: o.cat, burst: false };
  fx(o.events, 'mdpHeart', o.side, me.x, shipTop(b, o.side) - CELL, { n: pool, path: -1 });
  return [];
}

// ---------------------------------------------------------------- Daft Miau · LIGHT PYRAMID!
// The light pyramid goes up over your ship (and his gold-helmet partner steps out): for 3 turns, at the close of each of
// yours, it fires a laser where your cat hit (0.4·P; a miss: the nearest live module), silver (Cargado) and gold (Cegado).
function xp_daftmiau(b: Battle, o: UltCtx): ShotPath[] {
  const me = b.shipCenter(o.side);
  stamp(b, o, me.x, shipTop(b, o.side) - CELL * 2);
  S(b).pyramid = { side: o.side, turns: 3, k: 0, atk: o.atk, pw: PW(o), by: o.cat };
  fx(o.events, 'mdpPyramid', o.side, me.x, shipTop(b, o.side) - CELL * 2, { n: 3, path: -1 });
  return [];
}

// ---------------------------------------------------------------- Party Michi · BASS DROP PILE-UP!
// The party drags them all in: EVERY cat of theirs piles up dancing in the cabin with the most cats until their next
// turn, and the BASS DROP lands right there: 1.2·P that EVERY cat in the pile takes in full (and his partner hypes it).
function xp_partymichi(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const foes = alive(b, enemy);
  const count = new Map<number, number>();
  for (const c of foes) count.set(c.room, (count.get(c.room) ?? 0) + 1);
  const best = strongest(b, enemy);
  const room = [...count.entries()].sort((a, z) => z[1] - a[1] || (a[0] === best?.room ? -1 : z[0] === best?.room ? 1 : a[0] - z[0]))[0]?.[0];
  const t = room !== undefined ? b.roomCenter(enemy, room) : b.shipCenter(enemy);
  stamp(b, o, t.x, t.y);
  if (room !== undefined) {
    const st = S(b);
    st.pile = { side: enemy, rooms: new Map(foes.map((c) => [c, c.room])) };
    for (const c of foes) c.room = room;
  }
  const p = lob(b, o.side, o.origin, t, 280, 'sound');
  const drop = mk(o, 'md_bajo', PW(o) * 1.2, { element: 'sound', trajectory: 'ballistic', radius: CELL * 1.6, catMul: 0.5 });
  const before = o.events.length;
  b.resolvePaths(o.side, drop, o.atk, [p], o.events);
  const at = p.points.length - 1;
  const hit = new Set(o.events.slice(before).filter((e) => e.k === 'cat' && e.side === enemy).map((e) => (e as { uid: string }).uid));
  for (const c of foes) if (!c.ko && !hit.has(c.def.uid)) b.hitCat(c, Math.round(o.atk * PW(o) * 1.2 * 0.5 * CAT_K), o.events, 0, at, 'sound', true);
  fx(o.events, 'mdpPile', enemy, t.x, t.y, { n: foes.length, path: 0, at });
  return [p];
}

// ---------------------------------------------------------------- The Miauknd · ENDLESS NIGHT!
// The night stays: every status on their ship and cats LASTS TWICE AS LONG (the ones they have, and the ones you give
// them this turn and next), and the hit sets their whole top deck on fire (0.6·P each top cell, Ardiendo).
function xp_miauknd(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const es = b.sides[enemy];
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, shipTop(b, enemy));
  // the ones they already have
  const lit: Cell[] = [];
  for (const c of es.ship.cells()) {
    let any = false;
    for (const k of Object.keys(c.status) as StatusId[]) {
      if (k === 'voided') continue;
      c.status[k] = Math.min(20, (c.status[k] ?? 0) * 2);
      any = true;
    }
    if (any) lit.push(c);
  }
  if (lit.length) o.events.push({ k: 'status', side: enemy, cells: lit, status: 'burning' });
  for (const c of alive(b, enemy)) {
    for (const k of ['burning', 'shocked', 'wet', 'frozen'] as const) c.fx[k] = Math.min(20, c.fx[k] * 2);
    if (c.stunned > 1) c.stunned = Math.min(9, 1 + (c.stunned - 1) * 2);
  }
  // …and the ones you give them now (the deck fire included)
  S(b).night = { side: enemy, t: T(1, true) };
  const fire = mk(o, 'md_noche', PW(o) * 0.6, { element: 'fire', trajectory: 'ballistic', radius: CELL * 0.45, statuses: [{ id: 'burning', turns: 4 }] });
  const p = deckSweep(b, o, 'fire', 'beam');
  b.resolvePaths(o.side, fire, o.atk, [p], o.events);
  fx(o.events, 'mdpNight', enemy, ctr.x, shipTop(b, enemy), { n: lit.length, path: 0, at: p.impacts[0] ?? 0 });
  return [p];
}

// ---------------------------------------------------------------- Miaussi · DRIBBLE OF THE CENTURY!
// From the halfway line: the ball goes THROUGH up to 5 cells without touching them (no shields, no shield modules) and
// blows up in the deepest module you aimed at (1.3·P). And the ASSIST: the next cat of yours that shoots hits ×2.5.
function xp_miaussi(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const tgt = landing(b, o);
  const span = shipSpan(b, enemy);
  const aim = { x: clamp(tgt.x, span.x0, span.x1), y: Math.min(Math.max(tgt.y, shipTop(b, enemy)), b.waterY - CELL * 0.5) };
  // walk the line from his paw through the aim and on: the cells it crosses, in order
  const ang = Math.atan2(aim.y - o.origin.y, aim.x - o.origin.x);
  const crossed: Cell[] = [];
  for (let d = 0; d < 2600 && crossed.length < 6; d += 8) {
    const x = o.origin.x + Math.cos(ang) * d;
    const y = o.origin.y + Math.sin(ang) * d;
    const hit = b.cellAt(x, y);
    if (hit && hit.side === enemy && !crossed.includes(hit.cell)) crossed.push(hit.cell);
    if (y > b.waterY + 40) break;
  }
  const goal = crossed[Math.min(5, crossed.length - 1)] ?? cellNear(b, enemy, aim);
  const t = goal ? b.cellCenter(enemy, goal.x, goal.y) : aim;
  stamp(b, o, t.x, t.y);
  const pts = [o.origin, ...line(o.origin, t, 12)];
  const p = drawn(b, o.side, pts, 'magic', 'ballistic', [pts.length - 1]);
  const shot = mk(o, 'md_gambeta', PW(o) * 1.3, { element: 'magic', trajectory: 'ballistic', radius: CELL * 1.3 });
  bare(b, enemy, () => b.resolvePaths(o.side, shot, o.atk, [p], o.events));
  S(b).assist[o.side] = 2.5;
  fx(o.events, 'mdpDribble', enemy, t.x, t.y, { n: Math.min(5, crossed.length), path: 0, at: pts.length - 1 });
  const me = b.roomCenter(o.side, o.cat.room);
  fx(o.events, 'mdpAssist', o.side, me.x, me.y, { path: 0, at: pts.length - 1 });
  return [p];
}

// ---------------------------------------------------------------- Gatistiano Ronaldo · HAT-TRICK!
// Three shots at the SAME module, one after another: ×1, ×1.5 and ×2.5 (0.4·P; if the module breaks, the rest go to the
// nearest one). Then the celebration: your crew gets +20 meter.
function xp_gatistiano(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  let m = aimedModule(b, o);
  const t0 = m ? b.roomCenter(enemy, m.id) : b.shipCenter(enemy);
  stamp(b, o, t0.x, t0.y);
  const paths: ShotPath[] = [];
  let last = t0;
  [1, 1.5, 2.5].forEach((k, i) => {
    if (m && !m.alive) m = moduleNear(b, enemy, last);
    const t = m ? b.roomCenter(enemy, m.id) : last;
    last = t;
    const p = lob(b, o.side, { x: o.origin.x, y: o.origin.y - i * 10 }, t, 130 + i * 50, 'fire');
    const ball = mk(o, `md_gol_${i + 1}`, PW(o) * 0.4 * k, { element: 'fire', trajectory: 'ballistic', radius: CELL * 1.2 });
    b.resolvePaths(o.side, ball, o.atk, [p], o.events, i);
    fx(o.events, 'mdpHatTrick', enemy, t.x, t.y, { n: i, path: i, at: p.points.length - 1 });
    paths.push(p);
  });
  for (const c of alive(b, o.side)) if (c !== o.cat) c.ultCharge = Math.min(1, c.ultCharge + 0.2);
  const me = b.roomCenter(o.side, o.cat.room);
  info(o.events, '¡SIUUU! TU TRIPULACIÓN +20 DE BARRA', me.x, me.y - 150, 0xe6c34a, 2, lastAt(paths[2]));
  return paths;
}

// ---------------------------------------------------------------- Miaupé · COUNTER-ATTACK!
// He waits for the counter: their next 2 turns, every time a cat of theirs hits your ship he answers ON THE SPOT with a
// shot at that cat's cabin (0.5·P, lightning, Cargado) — without spending your turn. He doesn't answer cannons.
function xp_miaupe(b: Battle, o: UltCtx): ShotPath[] {
  const me = b.roomCenter(o.side, o.cat.room);
  stamp(b, o, me.x, me.y);
  S(b).counter = { side: o.side, t: T(2), by: o.cat, atk: o.atk, pw: PW(o) };
  fx(o.events, 'mdpCounterReady', o.side, me.x, me.y, { n: 2, uid: o.cat.def.uid, path: -1 });
  return [];
}

// ---------------------------------------------------------------- Lamiau Yamal · BACKDOOR CURL!
// He curls it round the outside: the ball goes all the way round their ship and comes in THROUGH THE STERN, at their 2
// rearmost modules — those blows go through every shield, are critical (0.6·P ×1.5) and leave Flotando.
function xp_lamiau(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const es = b.sides[enemy];
  const dir = dirOf(o.side);
  const span = shipSpan(b, enemy);
  const mods = es.ship.modules
    .filter((m) => m.alive && es.ship.moduleCells(m.id).length)
    .sort((a, z) => dir * (b.roomCenter(enemy, z.id).x - b.roomCenter(enemy, a.id).x) || a.id - z.id)
    .slice(0, 2);
  const aims = mods.map((m) => b.roomCenter(enemy, m.id));
  const ctr = b.shipCenter(enemy);
  if (!aims.length) aims.push(ctr);
  stamp(b, o, aims[0].x, aims[0].y);
  // the curl: high over their ship, round past the stern, and back in from behind
  const far = (dir > 0 ? span.x1 : span.x0) + dir * CELL * 4;
  const over = { x: far, y: shipTop(b, enemy) - CELL * 5 };
  const behind = { x: far - dir * CELL, y: aims[0].y };
  const pts: PathPoint[] = [o.origin, ...hop(o.origin, over, 220, 16), ...hop(over, behind, 40, 12), ...line(behind, aims[0], 10)];
  const at = [pts.length - 1];
  if (aims[1]) {
    pts.push(...hop(aims[0], aims[1], 50, 10));
    at.push(pts.length - 1);
  }
  const curl = mk(o, 'md_rosca', PW(o) * 0.6 * 1.5, { element: 'gravity', trajectory: 'ballistic', radius: CELL * 1.2, statuses: [{ id: 'grav', turns: 2 }] });
  const p = drawn(b, o.side, pts, 'gravity', 'ballistic', at);
  bare(b, enemy, () => b.resolvePaths(o.side, curl, o.atk, [p], o.events));
  fx(o.events, 'mdpCurl', enemy, behind.x, behind.y, { path: 0, at: at[0] });
  return [p];
}

export type { CatState };
