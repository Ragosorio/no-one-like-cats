/**
 * After the Parte III · post MULTIDIMENSIONAL powers 21–40 (the bottom of the sea, portals, the four nations, the
 * mystery van, the neighbourhood's villains, superheroes, cubes, the ship, rings, double lives, twins and the high
 * society). Same rules as powersA.ts.
 */
import type { Battle, PathPoint, ShotPath } from '../sim';
import { CAT_K } from '../sim';
import type { CatState, ShotDef } from '../types';
import type { UltCtx } from '../ults';
import { ULTS, clamp, collapse, cut, landing, normal, shipSpan, shipTop } from '../ults';
import { MD_ULTS } from '../multidim';
import { p2Night, p2SetNight } from '../multiverso';
import {
  CELL,
  DMG_K,
  PW,
  S,
  T,
  alive,
  bestModules,
  cellNear,
  dash,
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
  stamp,
  strongest,
  stun,
  surfaceY,
} from './kit';
import { spreadCells } from './powersA';

export function ultsB() {
  return {
    xp_esponja,
    xp_rick,
    xp_miaang,
    xp_miauby,
    xp_blumiau,
    xp_miaubody,
    xp_gatogro,
    xp_grru,
    xp_miaunion,
    xp_garritas,
    xp_supermichi,
    xp_hierromichi,
    xp_michimerica,
    xp_doomiau,
    xp_ssssmichi,
    xp_michimpostor,
    xp_zoomic,
    xp_hannah,
    xp_gemichi,
    xp_persafalsa,
  };
}

// ---------------------------------------------------------------- Michi Esponja · ORDER UP!
// He shouts he's ready… and it's catching: your WHOLE crew's ultimate meter is FULL (a once-per-battle one already spent
// stays spent, ★5 aside). And a rain of bubbles soaks their ship (6 × 0.1·P, Mojado).
function xp_esponja(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y);
  for (const c of alive(b, o.side)) c.ultCharge = 1;
  const bubble = mk(o, 'md_burbuja', PW(o) * 0.1, { element: 'water', trajectory: 'ballistic', radius: CELL * 1.1, statuses: [{ id: 'wet', turns: 2 }] });
  const paths = spreadCells(b, enemy, 6).map((c, i) => lob(b, o.side, { x: o.origin.x, y: o.origin.y - i * 8 }, b.cellCenter(enemy, c.x, c.y), 120 + i * 20, 'water'));
  b.resolvePaths(o.side, bubble, o.atk, paths, o.events);
  const me = b.shipCenter(o.side);
  fx(o.events, 'mdpReady', o.side, me.x, me.y, { path: -1 });
  info(o.events, '¡ESTOY LISTO! TU TRIPULACIÓN, CON LA BARRA LLENA', me.x, me.y - 200, 0xffe14d);
  return paths;
}

// ---------------------------------------------------------------- Rick Michez · PORTAL RUN!
// Portals over every target: the rest of this turn and your next 2, every shot of your crew (cats and cannons) comes out
// of a portal one cell above where it was aimed — no wind, no arc, no miss (walls still stop it).
function xp_rick(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, shipTop(b, enemy) - CELL * 2);
  S(b).portals[o.side] = T(2, true);
  fx(o.events, 'mdpPortal', enemy, ctr.x, shipTop(b, enemy) - CELL * 2, { n: 2, path: -1 });
  info(o.events, 'PORTALES: TUS TIROS NO FALLAN (ESTE TURNO Y 2 MÁS)', ctr.x, ctr.y - 220, 0x97ce4c);
  return [];
}

// ---------------------------------------------------------------- Miaang · FOUR-ELEMENT STATE!
// The arrow lights up: four blows on the same spot, one per element, Water → Storm → Earth → Fire, each with its status
// — every reaction they can set off goes off (Conducción, Estallido, Vapor…) and the cat in that cabin is stunned.
function xp_miaang(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const tgt = landing(b, o);
  const cell = cellNear(b, enemy, tgt);
  const t = cell ? b.cellCenter(enemy, cell.x, cell.y) : b.shipCenter(enemy);
  stamp(b, o, t.x, t.y);
  const els: [ShotDef['element'], ShotDef['statuses']][] = [
    ['water', [{ id: 'wet', turns: 2 }]],
    ['electric', [{ id: 'charged', turns: 2 }]],
    ['earth', []],
    ['fire', [{ id: 'burning', turns: 2 }]],
  ];
  const corners: PathPoint[] = [
    { x: t.x - 220, y: t.y - 260 },
    { x: t.x + 220, y: t.y - 260 },
    { x: t.x - 300, y: t.y - 40 },
    { x: t.x, y: t.y - 340 },
  ];
  const paths: ShotPath[] = [];
  els.forEach(([el, statuses], i) => {
    const pts = [o.origin, ...hop(o.origin, corners[i], 60, 16), ...line(corners[i], t, 12)];
    const p = drawn(b, o.side, pts, el, 'ballistic', [pts.length - 1]);
    const blow = mk(o, `md_${el}`, PW(o) * 0.35, { element: el, trajectory: 'ballistic', radius: CELL * 1.1, statuses });
    b.resolvePaths(o.side, blow, o.atk, [p], o.events, i);
    fx(o.events, 'mdpElements', enemy, t.x, t.y, { n: i, path: i, at: pts.length - 1 });
    paths.push(p);
  });
  if (cell?.module !== undefined) {
    const cat = b.sides[enemy].cats.find((c) => c.room === cell.module && !c.ko && !b.isFlying(c));
    if (cat) {
      stun(b, cat, 2);
      info(o.events, '¡ATURDIDO POR LOS CUATRO!', t.x, t.y - 120, 0xf6a01a, 3, lastAt(paths[3]));
    }
  }
  return paths;
}

// ---------------------------------------------------------------- Miauby-Doo · UNMASKED!
// He pulls the villain's mask off: everything that helps their side is gone — cat shields, boosts, field rules, wells
// and swirls — and their barriers (bubble, shield, arcane layers) go dark for 2 of their turns.
function xp_miauby(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const es = b.sides[enemy];
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y);
  const gone: string[] = [];
  const shields = es.cats.reduce((a, c) => a + (c.ko ? 0 : c.shields), 0);
  for (const c of es.cats) c.shields = 0;
  if (shields) gone.push(`${shields} ESCUDOS`);
  if (es.buffs.stone > 0 || es.buffs.empower > 0) gone.push('SUS REFUERZOS');
  es.buffs.stone = 0;
  es.buffs.empower = 0;
  const wells = b.wells.filter((w) => w.owner === enemy).length;
  if (wells) gone.push(`${wells} POZOS`);
  b.wells = b.wells.filter((w) => w.owner !== enemy);
  if (p2Night(b, enemy)) {
    p2SetNight(b, enemy, 0);
    gone.push('SU NOCHE');
  }
  const st = S(b);
  if (!st.unmask && (es.ward || es.bubbleMax > 0 || es.shieldHp > 0)) {
    st.unmask = { side: enemy, t: T(2), ward: es.ward, bubbleMax: es.bubbleMax, shieldHp: es.shieldHp };
    es.ward = null;
    es.bubble = 0;
    es.bubbleMax = 0;
    es.shieldHp = 0;
    gone.push('SUS BARRERAS (2 TURNOS)');
  }
  fx(o.events, 'mdpUnmask', enemy, ctr.x, ctr.y, { n: gone.length, path: -1 });
  info(o.events, gone.length ? `¡DESENMASCARADO! SIN ${gone.join(' · ')}` : '¡DESENMASCARADO! (NO TRAÍA NADA)', ctr.x, ctr.y - 220, 0xe6c34a);
  return [];
}

// ---------------------------------------------------------------- Blumiau · THREE PAW CLUES!
// Three CLUES (blue pawprints) hidden on their 3 best modules. Every time your crew hits one, it's found: that blow does
// ×1.5. Finding the third: «¡LO RESOLVIMOS!» — a 2·P blow on that module that goes through every shield.
function xp_blumiau(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y);
  const mods = bestModules(b, enemy, 3);
  S(b).clues = { side: enemy, modules: mods.map((m) => m.id), found: 0, hits: [], atk: o.atk, pw: PW(o), by: o.cat };
  mods.forEach((m, i) => {
    const p = b.roomCenter(enemy, m.id);
    fx(o.events, 'mdpClue', enemy, p.x, p.y, { n: i, path: -1 });
  });
  info(o.events, 'TRES PISTAS EN SU BARCO: ¡ENCUÉNTRALAS!', ctr.x, ctr.y - 220, 0x6ec6f0);
  return [];
}

// ---------------------------------------------------------------- Mr. Miaubody · BACK IN TIME!
// Into the time machine and back with someone from the past: a COPY of your strongest cat (full life, can't be hit)
// fights for your next 2 turns, firing its normal shot right after your cat, at the same target.
function xp_miaubody(b: Battle, o: UltCtx): ShotPath[] {
  const best = alive(b, o.side).sort((a, z) => z.def.atk - a.def.atk || (a.def.uid < z.def.uid ? -1 : 1))[0] ?? o.cat;
  const me = b.roomCenter(o.side, o.cat.room);
  stamp(b, o, me.x, me.y);
  S(b).copy = { side: o.side, def: { ...best.def, uid: `${best.def.uid}~pasado` }, atk: best.def.atk, t: T(2), of: best, turn: -1 };
  fx(o.events, 'mdpTimeCopy', o.side, me.x, me.y, { uid: best.def.uid, path: -1 });
  info(o.events, `DEL PASADO: OTRO ${best.def.name.toUpperCase()} (2 TURNOS)`, me.x, me.y - 160, 0xd62839);
  return [];
}

// ---------------------------------------------------------------- Gatogro · SWAMP SWEET SWAMP!
// Their ship turns into a swamp for 3 turns: everything Mojado (and Enraizado once), their cannons stuck in the mud,
// and their cats move as through mud — each one takes a turn longer to shoot again. An ogre's roar: −20 meter each.
function xp_gatogro(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const es = b.sides[enemy];
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y);
  const cells = es.ship.cells();
  b.wetCells(enemy, cells, o.events);
  const rooted = cells.filter((c) => !c.status.burning && hurtable(b, enemy, c));
  for (const c of rooted) c.status.rooted = Math.max(c.status.rooted ?? 0, 1);
  if (rooted.length) o.events.push({ k: 'status', side: enemy, cells: rooted, status: 'rooted' });
  for (const m of es.ship.modules) if (m.kind === 'cannon') m.disabled = Math.max(m.disabled, 2);
  for (const c of es.cats) if (!c.ko) c.ultCharge = Math.max(0, c.ultCharge - 0.2);
  S(b).swamp = { side: enemy, t: T(3) };
  fx(o.events, 'mdpSwamp', enemy, ctr.x, ctr.y, { n: 3, path: -1 });
  const me = b.roomCenter(o.side, o.cat.room);
  fx(o.events, 'mdpRoar', o.side, me.x, me.y, { path: -1 });
  return [];
}

// ---------------------------------------------------------------- Grrrú · FREEZE RAY!
// He freezes SOLID their strongest cat and its cabin: 2 turns it doesn't act and has nowhere to hide (takes ×1.5), and
// the first rock or cannonball on the cabin SHATTERS it (×2, Estallido). With Miaunion in your crew the ray bounces and
// freezes their second strongest too. A boss captain: 1 turn.
function xp_grru(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const es = b.sides[enemy];
  const combo = alive(b, o.side).some((c) => c.def.catId === 'xp_miaunion');
  const first = strongest(b, enemy);
  const second = combo && first ? strongest(b, enemy, new Set([first])) : undefined;
  const t1 = first ? b.roomCenter(enemy, first.room) : b.shipCenter(enemy);
  stamp(b, o, t1.x, t1.y, combo ? 1 : 0);
  const pts: PathPoint[] = [o.origin, ...line(o.origin, t1, 14)];
  const ats: number[] = [pts.length - 1];
  const targets = [first, second].filter((c): c is CatState => !!c);
  if (second) {
    const t2 = b.roomCenter(enemy, second.room);
    pts.push(...hop(t1, t2, 50, 12));
    ats.push(pts.length - 1);
  }
  const ray: ShotPath = { points: pts, element: 'ice', kind: 'beam', impacts: [], owners: [] };
  const st = S(b);
  targets.forEach((c, i) => {
    const boss = isBossCaptain(b, c);
    stun(b, c, 3);
    c.fx.frozen = Math.max(c.fx.frozen, boss ? 1 : 2);
    c.fx.burning = 0;
    st.frozen.set(c, T(boss ? 1 : 2));
    st.exposed.set(c, T(boss ? 1 : 2));
    const cells = es.ship.moduleCells(c.room);
    for (const k of cells) {
      delete k.status.burning;
      k.status.frozen = Math.max(k.status.frozen ?? 0, 3);
    }
    if (cells.length) o.events.push({ k: 'status', side: enemy, cells, status: 'frozen' });
    const p = b.roomCenter(enemy, c.room);
    fx(o.events, i ? 'mdpFreezeCombo' : 'mdpFreeze', enemy, p.x, p.y, { uid: c.def.uid, path: 0, at: ats[i] });
  });
  if (second) info(o.events, '¡UIUUU! EL RAYO REBOTA (MIAUNION)', t1.x, t1.y - 170, 0xffe14d, 0, ats[1]);
  return [ray];
}

// ---------------------------------------------------------------- Miaunion · BANANA ALARM!
// The minion's alarm: this turn and your next 3, every ultimate of your crew brings an extra BANANA BOMB onto the same
// spot (0.5·P, Cegado). With Grrrú in your crew the bananas also freeze (1 turn). The alarm's own banana flies now.
function xp_miaunion(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const tgt = landing(b, o);
  stamp(b, o, tgt.x, tgt.y);
  const st = S(b);
  st.bananas = { side: o.side, t: T(3, true), by: o.cat, atk: o.atk, pw: PW(o) };
  const p = banana(b, o.side, o.origin, tgt, o.events, 0);
  void enemy;
  return p ? [p] : [];
}
/** one banana bomb from `from` onto `to` (resolved; returns its path) */
export function banana(b: Battle, side: number, from: PathPoint, to: PathPoint, ev: import('../sim').BattleEvent[], offset: number): ShotPath | null {
  const st = S(b);
  const ba = st.bananas;
  if (!ba) return null;
  const enemy = 1 - side;
  const span = shipSpan(b, enemy);
  const aim = { x: clamp(to.x, span.x0, span.x1), y: Math.min(to.y, b.waterY - CELL * 0.5) };
  const p = lob(b, side, { x: from.x, y: from.y - 30 }, aim, 160, 'light');
  const shot: ShotDef = { id: 'md_platano', name: 'PLÁTANO BOMBA', element: 'light', trajectory: 'ballistic', power: ba.pw * 0.5, radius: CELL * 1.3, catMul: 0.5 };
  const before = ev.length;
  b.resolvePaths(side, shot, ba.atk, [p], ev, offset);
  b.sides[enemy].buffs.blind = Math.max(b.sides[enemy].buffs.blind, 1);
  const combo = alive(b, side).some((c) => c.def.catId === 'xp_grru');
  if (combo)
    for (const e of ev.slice(before))
      if (e.k === 'cat' && e.side === enemy && !e.dot) {
        const c = b.sides[enemy].cats.find((k) => k.def.uid === e.uid);
        if (c && !c.ko) {
          stun(b, c, 2);
          c.fx.frozen = Math.max(c.fx.frozen, 1);
        }
      }
  fx(ev, 'mdpBanana', enemy, aim.x, aim.y, { n: combo ? 1 : 0, path: offset, at: p.points.length - 1 });
  return p;
}

// ---------------------------------------------------------------- Garritas · BERSERKER CLAWS!
// Six slashes in a cross through their ship (two diagonals, 0.2·P), and his HEALING FACTOR kicks in: your next 4 turns
// he gets 15 % of his max life back at the start of each, and every blow he takes gives him +10 meter.
function xp_garritas(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const es = b.sides[enemy];
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y);
  const claw = mk(o, 'md_garras', PW(o) * 0.2, { element: 'nature', trajectory: 'ray', pierce: 10, pierceMul: 0.8, radius: CELL * 0.9, gravityScale: 0, windScale: 0 });
  const top = shipTop(b, enemy);
  const bottom = top + es.ship.rows * CELL;
  const paths: ShotPath[] = [];
  for (const d of [1, -1])
    for (const k of [-1, 0, 1]) {
      const x = ctr.x + k * CELL * 2.2 - d * CELL * 3;
      const from = { x, y: top - CELL * 3 };
      const to = { x: x + d * CELL * 6, y: bottom };
      paths.push(b.integrate(claw, from, Math.atan2(to.y - from.y, to.x - from.x), 1400, 0, o.side));
    }
  b.resolvePaths(o.side, claw, o.atk, paths, o.events);
  S(b).regen.set(o.cat, 4);
  const me = b.roomCenter(o.side, o.cat.room);
  fx(o.events, 'mdpClaws', enemy, ctr.x, ctr.y, { path: 0, at: lastAt(paths[0]) });
  info(o.events, 'FACTOR CURATIVO: +15 % CADA TURNO (4 TURNOS)', me.x, me.y - 150, 0xffd23f, 0, lastAt(paths[0]));
  return paths;
}

// ---------------------------------------------------------------- Supermichi · SKY LIFT!
// He gets under their ship, LIFTS it out of the water and lets go: the whole bottom row (the keel) takes the fall
// (0.6·P each, capped), and whatever ends up cut off from the keel breaks away and sinks. The last two keel cells always
// hold (a whole ship sinking at once was never the joke).
function xp_supermichi(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const es = b.sides[enemy];
  const span = shipSpan(b, enemy);
  const dir = dirOf(o.side);
  const keelY = es.ship.rows - 1;
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y);
  const under = es.setup.origin.y + es.ship.rows * CELL + CELL * 0.6;
  const a = { x: (dir > 0 ? span.x0 : span.x1) - dir * CELL, y: under };
  const z = { x: (dir > 0 ? span.x1 : span.x0) + dir * CELL, y: under };
  const pts: PathPoint[] = [o.origin, ...hop(o.origin, a, 80, 16), ...line(a, z, 14), ...line(z, { x: z.x, y: shipTop(b, enemy) - CELL * 4 }, 16)];
  const p: ShotPath = { points: pts, element: 'light', kind: 'heavy', impacts: [], owners: [] };
  const at = pts.length - 1;
  const keel = es.ship.cells().filter((c) => c.y === keelY);
  const P = o.atk * PW(o) * 0.6 * DMG_K;
  for (const c of keel) {
    if (!hurtable(b, enemy, c)) continue;
    const standing = es.ship.cells().filter((k) => k.y === keelY).length;
    // the last two keel cells hold at 1
    const raw = standing <= 2 ? Math.min(P, c.hp - 1) : P;
    if (raw > 0) cut(b, enemy, c, raw, o.events, 0, at);
  }
  collapse(b, enemy, o.events, 0, at);
  fx(o.events, 'mdpLift', enemy, ctr.x, ctr.y, { path: 0, at });
  return [p];
}

// ---------------------------------------------------------------- Hierro Michi · UPGRADE PROTOCOL!
// Six mini-missiles at their 6 most valuable modules (0.2·P), and the UPGRADE PROTOCOL: their next 3 turns, every blow
// he takes adds a piece of armor — +1 shield (up to 3) and +10 % damage for the rest of the battle (up to +50 %).
function xp_hierromichi(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y);
  const mods = bestModules(b, enemy, 6);
  const aims = mods.length ? Array.from({ length: 6 }, (_, i) => b.roomCenter(enemy, mods[i % mods.length].id)) : [];
  const missile = mk(o, 'md_minimisil', PW(o) * 0.2, { element: 'fire', trajectory: 'ballistic', radius: CELL * 1.0 });
  const paths = aims.map((t, i) => lob(b, o.side, { x: o.origin.x, y: o.origin.y - 20 - (i % 3) * 10 }, t, 200 + (i % 3) * 60, 'fire'));
  b.resolvePaths(o.side, missile, o.atk, paths, o.events);
  const st = S(b);
  const prev = st.upgrade.get(o.cat);
  st.upgrade.set(o.cat, { t: T(3), bonus: prev?.bonus ?? 0, shields: 0 });
  const me = b.roomCenter(o.side, o.cat.room);
  fx(o.events, 'mdpUpgrade', o.side, me.x, me.y, { n: Math.round((prev?.bonus ?? 0) * 100), uid: o.cat.def.uid, path: paths.length ? 0 : -1, at: lastAt(paths[0]) });
  return paths;
}

// ---------------------------------------------------------------- Capitán Michimérica · NEVER FALL!
// Shield up for everyone: their next 3 turns, when a blow would knock out a cat of yours he steps in — that cat keeps 1
// life and he takes half the blow (he can fall). And a shield throw bounces across 3 of their cabins (0.35·P each).
function xp_michimerica(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const dir = dirOf(o.side);
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y);
  const cabins = alive(b, enemy)
    .map((c) => b.roomCenter(enemy, c.room))
    .sort((a, z) => dir * (a.x - z.x));
  while (cabins.length && cabins.length < 3) cabins.push(cabins[cabins.length % Math.max(1, cabins.length)]);
  if (!cabins.length) cabins.push(ctr, ctr, ctr);
  const pts: PathPoint[] = [o.origin];
  const at: number[] = [];
  let prev = o.origin;
  for (const q of cabins.slice(0, 3)) {
    pts.push(...hop(prev, q, prev === o.origin ? 120 : 70, 13));
    at.push(pts.length - 1);
    prev = q;
  }
  const bash = mk(o, 'md_escudazo', PW(o) * 0.35, { element: 'earth', trajectory: 'ballistic', radius: CELL * 1.1 });
  const p = drawn(b, o.side, pts, 'earth', 'ballistic', at);
  b.resolvePaths(o.side, bash, o.atk, [p], o.events);
  S(b).shield = { side: o.side, t: T(3), by: o.cat };
  const me = b.shipCenter(o.side);
  fx(o.events, 'mdpShieldUp', o.side, me.x, me.y, { n: 3, path: 0, at: at[0] });
  return [p];
}

// ---------------------------------------------------------------- Doctor Doomiau · DOOMIAU COMMANDS!
// An iron law for their ship, 2 turns: every cat of theirs that deals damage PAYS — loses a quarter of what it dealt
// from its own life — and none of them can heal while it lasts. And an arcane bolt curses their core (Maldito 3).
function xp_doomiau(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const es = b.sides[enemy];
  const core = es.ship.modules.find((m) => m.kind === 'core' && m.alive);
  const t = core ? b.roomCenter(enemy, core.id) : b.shipCenter(enemy);
  stamp(b, o, t.x, t.y);
  const p = dash(b, o.side, o.origin, t, 'magic', 'beam');
  p.impacts = [];
  p.owners = [];
  const at = p.points.length - 1;
  if (core) {
    const cells = es.ship.moduleCells(core.id);
    for (const c of cells) c.status.cursed = Math.max(c.status.cursed ?? 0, 3);
    if (cells.length) o.events.push({ k: 'status', side: enemy, cells, status: 'cursed' });
  }
  S(b).decree = { side: enemy, t: T(2), hp: new Map(alive(b, enemy).map((c) => [c, c.hp])) };
  const ctr = b.shipCenter(enemy);
  fx(o.events, 'mdpDecree', enemy, ctr.x, ctr.y, { n: 2, path: 0, at });
  return [p];
}

// ---------------------------------------------------------------- Ssssmichi · BIG HUG!
// He walks over to their ship, hugs the cabin with the most cats and… PUM: a huge blast (2·P, radius 3.5) that leaves a
// crater. He's knocked out (it's not a defeat while someone else stands). If he's your last cat standing he doesn't
// blow up: he gets sad and only hisses.
function xp_ssssmichi(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const es = b.sides[enemy];
  const mates = alive(b, o.side).filter((c) => c !== o.cat);
  if (!mates.length) {
    const ctr = b.shipCenter(enemy);
    stamp(b, o, ctr.x, ctr.y, 0);
    const paths = normal(b, o, { ...o.shot, trajectory: 'wave', projectiles: 1, power: PW(o) * 0.4, statuses: [] });
    const me = b.roomCenter(o.side, o.cat.room);
    fx(o.events, 'mdpHiss', o.side, me.x, me.y, { path: 0, at: lastAt(paths[0]) });
    info(o.events, 'sssss… (ES TU ÚLTIMO GATO: NO EXPLOTA)', me.x, me.y - 140, 0x8bc34a, 0, lastAt(paths[0]));
    return paths;
  }
  const count = new Map<number, number>();
  for (const c of alive(b, enemy)) count.set(c.room, (count.get(c.room) ?? 0) + 1);
  const best = strongest(b, enemy);
  const room = [...count.entries()].sort((a, z) => z[1] - a[1] || (a[0] === best?.room ? -1 : z[0] === best?.room ? 1 : a[0] - z[0]))[0]?.[0];
  const t = room !== undefined ? b.roomCenter(enemy, room) : b.shipCenter(enemy);
  stamp(b, o, t.x, t.y, 1);
  const pts = [o.origin, ...hop(o.origin, t, 140, 12)];
  const p = drawn(b, o.side, pts, 'fire', 'ballistic', [pts.length - 1]);
  const boom = mk(o, 'md_abrazo', PW(o) * 2, { element: 'fire', trajectory: 'ballistic', radius: CELL * 3.5 });
  b.resolvePaths(o.side, boom, o.atk, [p], o.events);
  const at = pts.length - 1;
  const me = o.cat;
  const hp = me.hp;
  me.hp = 0;
  me.ko = true;
  me.fx = { burning: 0, shocked: 0, wet: 0, frozen: 0 };
  o.events.push({ k: 'cat', side: o.side, uid: me.def.uid, dmg: hp, ko: true, shield: false, element: 'fire', fx: { ...me.fx }, path: 0, at });
  fx(o.events, 'mdpHug', enemy, t.x, t.y, { path: 0, at });
  void es;
  return [p];
}

// ---------------------------------------------------------------- Michimpostor · EMERGENCY MEETING!
// Emergency meeting on their ship: they vote, and out goes the cat that has hurt you the most this battle. It's off in
// space for 2 of their turns (doesn't act, can't be hit, its meter frozen) and comes back with half its life at most.
// A boss captain leaves for 1 turn.
function xp_michimpostor(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const st = S(b);
  const dmg = (c: CatState) => st.dmgBy?.get(c) ?? 0;
  const target = alive(b, enemy).sort((a, z) => dmg(z) - dmg(a) || z.def.atk - a.def.atk || (a.def.uid < z.def.uid ? -1 : 1))[0];
  const t = target ? b.roomCenter(enemy, target.room) : b.shipCenter(enemy);
  stamp(b, o, t.x, t.y);
  if (target) {
    const n = isBossCaptain(b, target) ? 1 : 2;
    st.exile.set(target, { t: T(n), meter: target.ultCharge });
    stun(b, target, n + 1);
    fx(o.events, 'mdpVote', enemy, t.x, t.y, { n, uid: target.def.uid, path: -1 });
    info(o.events, `${target.def.name.toUpperCase()} FUE EXPULSADO`, t.x, t.y - 160, 0xc51111);
  }
  return [];
}

// ---------------------------------------------------------------- Zoomic · RING RUSH!
// He spins into a ball and bounces across their ship (8 × 0.2·P) picking up 30 RINGS. While he has rings, blows don't
// take his life: each knocks 10 rings loose, scattered for a turn; if his next shot connects, he runs back for them.
function xp_zoomic(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const span = shipSpan(b, enemy);
  const dir = dirOf(o.side);
  const xs = Array.from({ length: 8 }, (_, i) => (dir > 0 ? span.x0 : span.x1) + dir * ((i + 0.5) / 8) * (span.x1 - span.x0));
  const lands = xs.map((x) => ({ x, y: surfaceY(b, enemy, x) + CELL * 0.5 }));
  stamp(b, o, lands[0].x, lands[0].y);
  const pts: PathPoint[] = [o.origin, ...hop(o.origin, lands[0], 140, 14)];
  const at = [pts.length - 1];
  for (let i = 1; i < lands.length; i++) {
    pts.push(...hop(lands[i - 1], lands[i], 70, 11));
    at.push(pts.length - 1);
  }
  const ball = mk(o, 'md_bolita', PW(o) * 0.2, { element: 'electric', trajectory: 'ballistic', radius: CELL * 1.1 });
  const p = drawn(b, o.side, pts, 'electric', 'ballistic', at);
  b.resolvePaths(o.side, ball, o.atk, [p], o.events);
  S(b).rings.set(o.cat, { rings: 30, loose: 0, stale: false });
  const me = b.roomCenter(o.side, o.cat.room);
  fx(o.events, 'mdpRings', o.side, me.x, me.y, { n: 30, uid: o.cat.def.uid, path: 0, at: at[at.length - 1] });
  return [p];
}

// ---------------------------------------------------------------- Hannah Michitana · SECRET IDENTITY!
// The wig goes on: she dresses up as their strongest cat and uses ITS ultimate (generic, signature or Multidimensional
// power), at her own ultimate's strength (it costs them nothing). If that cat has no ultimate, she gives her concert:
// three waves that stun.
function xp_hannah(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const best = strongest(b, enemy);
  const u = best?.def.ultimate;
  if (best && u && best.def.catId !== 'xp_hannah') {
    const shot: ShotDef = { ...u, power: o.shot.power, limits: undefined };
    const key = best.def.ultKey ?? best.def.catId;
    const md = !best.def.ultKey && Object.prototype.hasOwnProperty.call(MD_ULTS, best.def.catId) ? MD_ULTS[best.def.catId] : undefined;
    const sig = md ? undefined : ULTS[key];
    const t = b.roomCenter(enemy, best.room);
    // a copied Multidimensional power stamps itself (as Hannah's): one stamp per cast
    if (!md) stamp(b, o, t.x, t.y, 1);
    fx(o.events, 'mdpWig', o.side, o.origin.x, o.origin.y, { uid: best.def.uid, path: -1 });
    info(o.events, `¡DISFRAZADA DE ${best.def.name.toUpperCase()}!: ${u.name}`, o.origin.x, o.origin.y - 160, 0xff4fa3);
    const co: UltCtx = { ...o, shot };
    if (md) return md(b, co);
    if (sig) return sig(b, co);
    // a generic ultimate: its projectiles fly where she aimed (her own ultimate's landing), with its element and statuses
    const aim = landing(b, o);
    const span = shipSpan(b, enemy);
    const n = Math.max(1, shot.projectiles ?? 1);
    const paths = Array.from({ length: n }, (_, i) => {
      const x = clamp(aim.x + (i - (n - 1) / 2) * CELL * 1.2, span.x0, span.x1);
      return lob(b, o.side, { x: o.origin.x, y: o.origin.y - i * 8 }, { x, y: Math.min(aim.y, b.waterY - CELL * 0.5) }, 150 + i * 20, shot.element, 'ballistic');
    });
    b.resolvePaths(o.side, { ...shot, trajectory: 'ballistic', projectiles: 1 }, o.atk, paths, o.events);
    return paths;
  }
  // the concert: three waves in a fan that stun
  const ctr = b.shipCenter(enemy);
  stamp(b, o, ctr.x, ctr.y, 0);
  const wave = mk(o, 'md_concierto', PW(o) * 0.45, { element: 'sound', trajectory: 'wave', pierce: 8, radius: CELL * 1.2 });
  const paths = [-1, 0, 1].map((k) => b.integrate(wave, o.origin, o.angle + k * 0.06, o.power, o.wind, o.side));
  const before = o.events.length;
  b.resolvePaths(o.side, wave, o.atk, paths, o.events);
  for (const e of o.events.slice(before))
    if (e.k === 'cat' && e.side === enemy && !e.dot) {
      const c = b.sides[enemy].cats.find((k) => k.def.uid === e.uid);
      if (c && !c.ko) stun(b, c, 2);
    }
  fx(o.events, 'mdpConcert', enemy, ctr.x, ctr.y, { path: 0, at: lastAt(paths[0]) });
  return paths;
}

// ---------------------------------------------------------------- Gemichi · TWIN SWAP!
// They swap places: your most hurt cat and their healthiest trade LIFE (as a share of each one's max) and their statuses.
// Nobody notices until it's too late. A boss captain trades 30 points at most.
function xp_gemichi(b: Battle, o: UltCtx): ShotPath[] {
  const enemy = 1 - o.side;
  const frac = (c: CatState) => c.hp / c.maxHp;
  const mine = alive(b, o.side).sort((a, z) => frac(a) - frac(z) || (a.def.uid < z.def.uid ? -1 : 1))[0];
  const theirs = alive(b, enemy).sort((a, z) => frac(z) - frac(a) || z.def.atk - a.def.atk)[0];
  const t = theirs ? b.roomCenter(enemy, theirs.room) : b.shipCenter(enemy);
  stamp(b, o, t.x, t.y);
  if (!mine || !theirs) return [];
  let fa = frac(theirs);
  let fb = frac(mine);
  if (isBossCaptain(b, theirs) && fa - fb > 0.3) {
    const a0 = frac(mine);
    const b0 = frac(theirs);
    fa = a0 + 0.3;
    fb = b0 - 0.3;
  }
  const mineHp = mine.hp;
  const theirHp = theirs.hp;
  mine.hp = Math.max(1, Math.min(mine.maxHp, Math.round(fa * mine.maxHp)));
  theirs.hp = Math.max(1, Math.min(theirs.maxHp, Math.round(fb * theirs.maxHp)));
  const fxA = { ...mine.fx };
  mine.fx = { ...theirs.fx };
  theirs.fx = fxA;
  const s = mine.stunned;
  mine.stunned = theirs.stunned;
  theirs.stunned = s;
  const pm = b.roomCenter(o.side, mine.room);
  const lost = theirHp - theirs.hp;
  if (lost > 0) o.events.push({ k: 'cat', side: enemy, uid: theirs.def.uid, dmg: lost, ko: false, shield: false, element: 'crystal', fx: { ...theirs.fx }, path: -1, at: 0 });
  fx(o.events, 'mdpSwap', enemy, t.x, t.y, { uid: theirs.def.uid, path: -1 });
  fx(o.events, 'mdpSwap', o.side, pm.x, pm.y, { n: 1, uid: mine.def.uid, path: -1 });
  info(o.events, `¡CAMBIO! ${mine.def.name.toUpperCase()} +${Math.max(0, mine.hp - mineHp)}`, pm.x, pm.y - 150, 0xd9e8f5);
  return [];
}

// ---------------------------------------------------------------- Persa Falsa · UNDERCOVER!
// She slips in: their next 2 turns nobody on their side knows who's who on your ship. Every blow of theirs headed for
// a cabin, the core or a cannon lands instead on your least valuable cell nearby (hull, then mast, then engine).
// Against a boss, only its cannons are fooled.
function xp_persafalsa(b: Battle, o: UltCtx): ShotPath[] {
  const me = b.shipCenter(o.side);
  stamp(b, o, me.x, me.y);
  S(b).undercover = { side: o.side, t: T(2) };
  fx(o.events, 'mdpUndercover', o.side, me.x, me.y, { n: 2, path: -1 });
  return [];
}

export { heal, cut, collapse, CAT_K };
