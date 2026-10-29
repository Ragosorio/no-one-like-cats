/**
 * After the Parte III · the post MULTIDIMENSIONAL powers' rules on the field, inside a turn (agent PODERES-2). The small
 * hooks sim.ts and multidim.ts call; every one of them is a no-op until a post power of YOUR crew created this battle's
 * state (or one of the four that keep a tally from the start — Pinomichi's nose, Yugi's pieces, Michimpostor's votes,
 * Hermiaune's snapshot — is in your crew), so no battle without them changes (tests/multidimPost.test.ts checks it).
 *
 * The post modules: kit.ts (state, clocks, helpers) · powersA/B/C.ts (the 60 casts, in roster order) · hooks.ts (this
 * file: the rules during a shot, and the single door multidim.ts imports) · turn.ts (the clocks and the blows that land
 * at a turn's start) · hud.ts (the AI's timing and the HUD chips). The view's side is battle/fx/multidimPostFx.ts.
 *
 *   sim.fire()          mdFire (atk × and who fires) · mdAltPaths (portals, the deduced volley, the offer, the cake and
 *                       the barrel, the stopped time) · mdAfterShot (copies, bananas, counters, the caught shot, clues)
 *   sim.resolveImpact() mdImpact (the caught shot, clones, rubber, the undercover, the high ground)
 *   sim.hitCat()        mdHitAdjust (alloy, the shield, rings, the sugar heart)
 *   sim.cap()           mdAbsorb (the sugar heart on cells)
 *   sim.shooters/cannons mdBench (stopped time, the truce) · sim.meterMul mdMeterMul (the cake)
 *   multidim.ts         mdpShot · mdpCellMul · mdpDodge · mdpCatMul · mdpAfterHit · mdpAfterFire · mdpFeats, and —
 *                       re-exported at the bottom from their own modules — mdpStartTurn (turn.ts) · mdpWorth / mdpChips
 *                       (hud.ts). turn.ts borrows frac / crew / tail / clampHeal / chillOff from here.
 */
import type { Battle, BattleEvent, PathPoint, ShotPath } from '../sim';
import type { Cell } from '../ship';
import type { CatState, ShotDef } from '../types';
import type { UltFn } from '../ults';
import { shipSpan } from '../ults';
import { mdOn } from '../multidim';
import { ultsA } from './powersA';
import { ultsB, banana } from './powersB';
import { ultsC, bare } from './powersC';
import {
  CELL,
  MdpState,
  S,
  bestModules,
  bleed,
  cellNear,
  dash,
  dirOf,
  endPt,
  feat,
  fx,
  hop,
  info,
  lastAt,
  line,
  lob,
  moduleNear,
  on,
  peek,
  stun,
  vsBoss,
  withBudget,
} from './kit';

/** the 60 powers, by species (a function: safe to call while the import cycle with multidim.ts is still loading) */
export function postUlts(): Record<string, UltFn> {
  return { ...ultsA(), ...ultsB(), ...ultsC() } as unknown as Record<string, UltFn>;
}
/** what the post powers did this battle (player side): md_<species> casts and a few counters */
export function mdpFeats(b: Battle): Record<string, number> {
  return { ...(peek(b)?.feats ?? {}) };
}
export const frac = (b: Battle, side: number) => (vsBoss(b, side) ? 0.18 : 0.45);
export const crew = (b: Battle, side: number, id: string) => b.sides[side].cats.some((c) => c.def.catId === id && mdOn(b, c));
const shotEvents = (st: MdpState, ev: BattleEvent[]) => ev.slice(st.ctx?.ev0 ?? 0);
const dealtTo = (evs: BattleEvent[], side: number) => evs.reduce((a, e) => a + ((e.k === 'cell' || (e.k === 'cat' && !e.dot)) && e.side === side ? e.dmg : 0), 0);

// ------------------------------------------------------------------ fire()
/** fire(), once per shot: who fires, and the attack multipliers of the post rules */
export function mdFire(b: Battle, side: 0 | 1, cat: CatState | undefined, ult: boolean, cannonId: number | undefined, ev: BattleEvent[]): number {
  const st = peek(b);
  if (!st) return 1;
  st.ctx = { side, cat, ult, kind: cannonId !== undefined ? 'cannon' : cat ? (ult ? 'ult' : 'cat') : 'part', cannonId, ev0: ev.length, caught: false, remate: false };
  if (on(st.chill[side])) for (const c of b.sides[side].cats) st.stun0.set(c, c.stunned);
  let m = 1;
  // Michi-Wan's high ground
  const hi = st.high;
  if (hi && hi.side === side && hi.mine.now) m *= 1.2;
  if (hi && hi.side !== side && hi.theirs.now) m *= 0.7;
  if (cat) {
    // El Michipulín's pill
    const sh = st.shrink.get(cat);
    if (sh && sh.t.now) m *= sh.atk;
    // Hierro Michi's upgrades stay for the rest of the battle
    const up = st.upgrade.get(cat);
    if (up) m *= 1 + up.bonus;
    // Miaussi's assist: the next cat shot of that crew (not the volley)
    if (st.assist[side] > 0) {
      m *= st.assist[side];
      st.assist[side] = 0;
      const p = b.muzzle(side, cat.def.uid);
      info(ev, '¡ASISTENCIA! x2.5', p.x, p.y - 120, 0x75aadb);
      feat(b, side, 'md_assist');
    }
  }
  // Condorgato's punchline: the last cannon of the volley (no cannons left: the cat's shot)
  const pu = st.punch;
  if (pu && pu.side === side && pu.volleys > 0) {
    const list = b.cannons(side);
    const last = cannonId !== undefined && list.length > 0 && list[list.length - 1].id === cannonId;
    const noCannons = cannonId === undefined && cat && !ult && list.length === 0;
    if (last || noCannons) {
      m *= 3;
      st.ctx.remate = true;
      pu.turnUsed = true;
      const p = cannonId !== undefined ? b.cannonMuzzle(side, cannonId) : b.muzzle(side, cat!.def.uid);
      fx(ev, 'mdpJoke', side, p.x, p.y, { n: 0, path: -1 });
      info(ev, '¡Y EL REMATE! x3', p.x, p.y - 100, 0xf2a33a);
    }
  }
  return m;
}

/** a path that ends in the barrel / a cake: the ultimate is spent and does nothing */
function fizzle(b: Battle, side: number, origin: PathPoint, to: PathPoint): ShotPath {
  return { points: [origin, ...hop(origin, to, 90, 14)], element: 'neutral', kind: 'ballistic', impacts: [], owners: [] };
}
/** a short visual segment (the last stretch before the first impact) of a stored path */
export function tail(p: ShotPath, k = 12): ShotPath {
  const first = p.impacts.length ? p.impacts[0] : p.points.length - 1;
  const s = Math.max(0, first - k);
  return { ...p, points: p.points.slice(s), impacts: p.impacts.map((i) => i - s), jumps: undefined, seal: undefined };
}

/**
 * fire(), instead of the shot's own paths (returns null to fly as usual): Rick's portals, Sherlock's deduced volley,
 * Don Gatoleone's offer, the barrel and the cake that eat an ultimate, Michi-Wan's drop over the first wall, and
 * Gatojo's stopped time (the shot hangs in the air until it comes back). Resolves what it returns.
 */
export function mdAltPaths(b: Battle, side: 0 | 1, cat: CatState | undefined, ult: boolean, cannonId: number | undefined, shot: ShotDef, atk: number, origin: PathPoint, angle: number, power: number, wind: number, ev: BattleEvent[]): ShotPath[] | null {
  const st = peek(b);
  if (!st) return null;
  const enemy = 1 - side;
  // ---- an ultimate of theirs into the barrel / the cake
  if (ult && cat) {
    const br = st.barrel;
    if (br && br.side === enemy && br.t.now && !br.by.ko) {
      br.last = cat;
      const me = b.roomCenter(br.side, br.by.room);
      fx(ev, 'mdpBarrelBlock', br.side, me.x, me.y, { uid: cat.def.uid, path: 0, at: 0 });
      info(ev, '¡SE ESTRELLÓ EN EL BARRIL!', me.x, me.y - 150, 0xf2c14e, 0, 0);
      return [fizzle(b, side, origin, { x: me.x, y: me.y - 20 })];
    }
    const ck = st.cake;
    if (ck && ck.side === side && ck.armed && ck.t.now) {
      ck.armed = false;
      stun(b, cat, 2);
      const p = b.roomCenter(side, cat.room);
      fx(ev, 'mdpFull', side, p.x, p.y, { uid: cat.def.uid, path: -1 });
      info(ev, `${cat.def.name.toUpperCase()} SE DURMIÓ DE LA PANZA LLENA`, p.x, p.y - 140, 0xf7c6d9);
      return [fizzle(b, side, origin, { x: origin.x + dirOf(side) * 60, y: origin.y - 10 })];
    }
    return null;
  }
  // ---- Don Gatoleone's offer: that cat's next shot goes against its own ship
  if (cat && st.offer.has(cat)) {
    st.offer.delete(cat);
    const home = b.roomCenter(side, cat.room);
    const s = b.sides[side];
    const near = bestModules(b, side, 99).filter((m) => m.id !== cat.room && Math.hypot(b.roomCenter(side, m.id).x - home.x, b.roomCenter(side, m.id).y - home.y) <= CELL * 4.5);
    const m = near[0] ?? moduleNear(b, side, home, new Set([cat.room])) ?? s.ship.modules.find((k) => k.alive);
    const t = m ? b.roomCenter(side, m.id) : b.shipCenter(side);
    const pts = [origin, ...hop(origin, t, 170, 13)];
    // the shot is theirs, the target too: owner = the other side, so it lands as a foe's blow on their own ship
    const p: ShotPath = { points: pts, element: shot.element, kind: 'ballistic', impacts: [pts.length - 1], owners: [enemy] };
    b.resolvePaths(side, { ...shot, projectiles: 1 }, atk, [p], ev);
    fx(ev, 'mdpBetray', side, t.x, t.y, { uid: cat.def.uid, path: 0, at: pts.length - 1 });
    info(ev, '«POR RESPETO»: DISPARA CONTRA SU PROPIO BARCO', home.x, home.y - 150, 0xd9b24c, 0, pts.length - 1);
    feat(b, enemy, 'md_offer');
    return [p];
  }
  // ---- the shots of a crew with portals / a deduced volley / the high ground (then maybe stored by the stopped time)
  let paths: ShotPath[] | null = null;
  const mk = st.marks;
  const live = mk && mk.side === enemy ? mk.cells.filter((c) => c.hp > 0 && b.sides[enemy].ship.get(c.x, c.y) === c) : [];
  if (cannonId !== undefined && mk && mk.volley && live.length) {
    const c = live[mk.next++ % live.length];
    const t = b.cellCenter(enemy, c.x, c.y);
    paths = [lob(b, side, origin, t, 120, shot.element, shot.trajectory === 'meteor' ? 'ballistic' : shot.trajectory)];
    fx(ev, 'mdpDeduce', enemy, t.x, t.y, { path: 0, at: paths[0].points.length - 1 });
  } else if ((cat || cannonId !== undefined) && st.portals[side].now) {
    paths = portalPaths(b, side, shot, origin, angle, power, ev);
  } else if ((cat || cannonId !== undefined) && st.high && st.high.side === side && st.high.mine.now) {
    // from above: the first wall it meets is flown over (no damage there), the blow lands on the next cell
    const deeper = { ...shot, pierce: (shot.pierce ?? (shot.trajectory === 'heavy' ? 2 : shot.trajectory === 'phase' ? 6 : 0)) + 1 };
    paths = b.buildPaths(deeper, origin, angle, power, wind, side).map((p) => (p.impacts.length > 1 ? { ...p, impacts: p.impacts.slice(1), owners: p.owners?.slice(1) } : p));
  }
  const ts = st.timeStop;
  if (ts && ts.side === enemy && (cat || cannonId !== undefined)) {
    const ps = paths ?? b.buildPaths(shot, origin, angle, power, wind, side);
    if (ps.some((p) => p.impacts.length)) ts.stored.push({ shot, atk, paths: ps.map((p) => ({ ...p })) });
    const shown = ps.map((p) => {
      const cutAt = p.impacts.length ? p.impacts[0] : p.points.length - 1;
      return { ...p, points: p.points.slice(0, cutAt + 1), impacts: [], owners: [] } as ShotPath;
    });
    shown.forEach((p, i) => {
      const q = p.points[p.points.length - 1];
      fx(ev, 'mdpPause', enemy, q.x, q.y, { path: i, at: p.points.length - 1 });
    });
    return shown;
  }
  if (paths) b.resolvePaths(side, shot, atk, paths, ev);
  return paths;
}

/** Rick's portals: each projectile comes out one cell above where it was aimed (no wind) and drops straight down */
function portalPaths(b: Battle, side: number, shot: ShotDef, origin: PathPoint, angle: number, power: number, ev: BattleEvent[]): ShotPath[] {
  const enemy = 1 - side;
  const span = shipSpan(b, enemy);
  const dir = dirOf(side);
  return b.buildPaths(shot, origin, angle, power, 0, side).map((p, i) => {
    const aim = endPt(p);
    const tx = Math.max(span.x0, Math.min(span.x1, aim.x));
    const hit = b.cellAt(aim.x, aim.y);
    const ty = hit && hit.side === enemy ? aim.y : surfaceY0(b, enemy, tx);
    const out = { x: tx, y: ty - CELL * 1.1 };
    const drop = b.integrate({ ...shot, trajectory: 'beam', projectiles: 1, gravityScale: 1, windScale: 0, pierce: shot.pierce ?? 0 }, out, Math.PI / 2, 260, 0, side);
    const enter = { x: origin.x + dir * 50, y: origin.y - 40 };
    const pre: PathPoint[] = [origin, ...line(origin, enter, 12)];
    const k = pre.length;
    const q: ShotPath = { ...drop, points: [...pre, ...drop.points], impacts: drop.impacts.map((j) => j + k), owners: drop.owners, jumps: [k] };
    fx(ev, 'mdpPortal', side, enter.x, enter.y, { n: 0, path: i, at: k - 1 });
    fx(ev, 'mdpPortal', enemy, out.x, out.y, { n: 1, path: i, at: k });
    return q;
  });
}
function surfaceY0(b: Battle, side: number, x: number) {
  const s = b.sides[side];
  const gx = b.toGrid(side, x, s.setup.origin.y).x;
  for (let y = 0; y < s.ship.rows; y++) if (s.ship.get(gx, y)) return s.setup.origin.y + y * CELL + CELL / 2;
  return b.waterY - CELL;
}

/**
 * fire(), after the shot resolved (before the bookkeeping): the extra paths it brings — Mr. Miaubody's copy, Miaunion's
 * banana, Miaupé's counter, Miaunce's throw-back, Kagebunyan's clones blowing back, Blumiau's solved case — and the
 * tallies (Yugi's pieces, Michimpostor's votes, Doomiau's law, the punchline's stun, Zoomic's rings, Sherlock's marks).
 */
export function mdAfterShot(b: Battle, side: 0 | 1, cat: CatState | undefined, ult: boolean, cannonId: number | undefined, shot: ShotDef, atk: number, paths: ShotPath[], ev: BattleEvent[]): ShotPath[] {
  const st = peek(b);
  if (!st) {
    // the tallies that start before any cast (Yugi, Michimpostor) open the state the first time they matter
    if (side === 0 && cat && !ult && cat.def.catId === 'xp_yugi' && mdOn(b, cat)) return yugi(b, S(b), cat, ev, 0);
    if (side === 1 && cat && crew(b, 0, 'xp_michimpostor')) S(b);
    else return [];
    return mdAfterShot(b, side, cat, ult, cannonId, shot, atk, paths, ev);
  }
  const enemy = 1 - side;
  const mine = shotEvents(st, ev);
  const out: ShotPath[] = [];
  const offset = () => paths.length + out.length;
  // where this turn's cat shots landed (Daft Miau's laser; volleyAim's rule)
  if (cat) {
    const imp = mine.find((e) => e.k === 'impact' && e.side === enemy);
    if (imp && imp.k === 'impact' && !st.firstHit[side]) st.firstHit[side] = { x: imp.x, y: imp.y };
    if (paths[0]) st.lastEnd[side] = endPt(paths[0]);
  }
  // Yugi's pieces
  if (side === 0 && cat && !ult && cat.def.catId === 'xp_yugi' && mdOn(b, cat)) yugi(b, st, cat, ev, 0);
  // Michimpostor's votes: who hurt you the most
  if (side === 1 && cat && crew(b, 0, 'xp_michimpostor')) {
    st.dmgBy ??= new Map();
    const d = dealtTo(mine, 0);
    if (d > 0) st.dmgBy.set(cat, (st.dmgBy.get(cat) ?? 0) + d);
  }
  // Condorgato's punchline: the cats it touches end up legs in the air
  if (st.ctx?.remate) {
    for (const e of mine)
      if (e.k === 'cat' && e.side === enemy && e.dmg > 0) {
        const c = b.sides[enemy].cats.find((k) => k.def.uid === e.uid);
        if (c && !c.ko) {
          stun(b, c, 2);
          const p = b.roomCenter(enemy, c.room);
          info(ev, '¡PATAS ARRIBA!', p.x, p.y - 110, 0xf2a33a, e.path, e.at);
        }
      }
    feat(b, side, 'md_remate');
  }
  // Doctor Doomiau's law: a cat of theirs that deals damage pays a quarter of it
  const dc = st.decree;
  if (dc && dc.side === side && dc.t.now && cat && !cat.ko) {
    const d = dealtTo(mine, enemy);
    if (d > 0) {
      const lastP = Math.max(0, paths.length - 1);
      bleed(b, cat, d * 0.25, ev, 'magic', lastP, lastAt(paths[lastP]));
      const p = b.roomCenter(side, cat.room);
      info(ev, `LA LEY DE DOOMIAU: PAGA ${Math.round(d * 0.25)}`, p.x, p.y - 130, 0x7cff6b, lastP, lastAt(paths[lastP]));
      dc.hp.set(cat, cat.hp);
      feat(b, enemy, 'md_decree');
    }
  }
  if (dc) clampHeal(b, dc);
  // Zoomic runs back for his scattered rings when his next shot connects
  if (cat && st.rings.has(cat)) {
    const r = st.rings.get(cat)!;
    if (r.loose > 0 && mine.some((e) => e.k === 'impact' && e.side === enemy)) {
      r.rings += r.loose;
      const p = b.roomCenter(side, cat.room);
      fx(ev, 'mdpRingBack', side, p.x, p.y, { n: r.rings, uid: cat.def.uid, path: -1 });
      info(ev, `¡RECUPERÓ ${r.loose} ANILLOS!`, p.x, p.y - 120, 0xffd23f);
      r.loose = 0;
      r.stale = false;
    }
  }
  // Blumiau's clues found by this shot (the ×1.5 already landed in mdpCellMul)
  const cl = st.clues;
  if (cl && cl.side === enemy && cl.hits.length) {
    for (const id of cl.hits) {
      if (!cl.modules.includes(id)) continue;
      cl.modules = cl.modules.filter((k) => k !== id);
      cl.found++;
      const q = b.roomCenter(enemy, id);
      fx(ev, 'mdpClueFound', enemy, q.x, q.y, { n: cl.found, path: -1 });
      if (cl.found >= 3) {
        const from = cl.by.ko ? { x: q.x - dirOf(side) * 200, y: -200 } : b.muzzle(side, cl.by.def.uid);
        const p = lob(b, side, from, q, 180, 'nature');
        const solved: ShotDef = { id: 'md_resuelto', name: '¡LO RESOLVIMOS!', element: 'nature', trajectory: 'ballistic', power: cl.pw * 2, radius: CELL * 1.4, catMul: 0.5 };
        const k = offset();
        withBudget(b, enemy, frac(b, enemy), () => bare(b, enemy, () => b.resolvePaths(side, solved, cl.atk, [p], ev, k)));
        fx(ev, 'mdpSolved', enemy, q.x, q.y, { path: k, at: p.points.length - 1 });
        out.push(p);
        feat(b, side, 'md_solved');
      }
    }
    cl.hits = [];
    if (cl.found >= 3 || !cl.modules.length) st.clues = null;
  }
  // Sherlock's marks: a marked point that was hit is no longer marked
  const mk = st.marks;
  if (mk && mk.side === enemy) {
    const hit = new Set(mine.filter((e) => e.k === 'cell' && e.side === enemy).map((e) => (e as { cell: Cell }).cell));
    const before = mk.cells.length;
    mk.cells = mk.cells.filter((c) => !hit.has(c) && c.hp > 0);
    if (mk.cells.length < before) feat(b, side, 'md_marks', before - mk.cells.length);
    if (!mk.cells.length) st.marks = null;
  }
  // Mr. Miaubody's copy from the past: its normal shot right after your cat's, at the same target (once a turn)
  const cp = st.copy;
  if (cp && cp.side === side && cp.t.now && cat && cp.turn !== b.turn && b.winner === null) {
    cp.turn = b.turn;
    const to = st.firstHit[side] ?? (paths[0] ? endPt(paths[0]) : b.shipCenter(enemy));
    const m = b.muzzle(side, cat.def.uid);
    const from = { x: m.x - dirOf(side) * 30, y: m.y - 30 };
    const p = lob(b, side, from, to, 150, cp.def.shot.element);
    const k = offset();
    b.resolvePaths(side, { ...cp.def.shot, projectiles: 1 }, cp.atk, [p], ev, k);
    fx(ev, 'mdpCopyShot', side, from.x, from.y, { uid: cp.of.def.uid, path: k, at: 0 });
    out.push(p);
    feat(b, side, 'md_copy');
  }
  // Miaunion's bananas: every ultimate of the crew brings one (his own cast already threw it)
  const ba = st.bananas;
  if (ba && ba.side === side && ba.t.now && ult && cat && cat !== ba.by && !ba.by.ko && b.winner === null) {
    const to = mine.find((e) => e.k === 'impact' && e.side === enemy) as { x: number; y: number } | undefined;
    const p = banana(b, side, b.muzzle(side, ba.by.def.uid), to ?? (paths[0] ? endPt(paths[0]) : b.shipCenter(enemy)), ev, offset());
    if (p) out.push(p);
    feat(b, side, 'md_banana');
  }
  // the clones that swallowed a blow of this shot blow up back at them
  for (const cb of st.cloneBack.splice(0)) {
    const p = dash(b, cb.side, { x: cb.x, y: cb.y }, cb.to, 'shadow', 'ballistic');
    const k = offset();
    const boom: ShotDef = { id: 'md_clon', name: 'CLON', element: 'shadow', trajectory: 'ballistic', power: cb.pw * 0.5, radius: CELL * 1.2, catMul: 0.5 };
    b.resolvePaths(cb.side, boom, cb.atk, [p], ev, k);
    fx(ev, 'mdpPoof', cb.side, cb.x, cb.y, { path: k, at: 0 });
    out.push(p);
    feat(b, cb.side, 'md_clone');
  }
  // Miaunce's catch: the shot goes back to the cat that fired it, ×1.5
  const cb = st.catchBack;
  if (cb && b.winner === null) {
    st.catchBack = null;
    const to = cb.to && !cb.to.ko ? b.roomCenter(1 - cb.side, cb.to.room) : b.shipCenter(1 - cb.side);
    const p = dash(b, cb.side, cb.from, to, cb.shot.element, 'ballistic');
    const k = offset();
    const back = { ...cb.shot, projectiles: 1, trajectory: 'ballistic' as const };
    const run = () => b.resolvePaths(cb.side, back, cb.atk * 1.5, [p], ev, k);
    if (cb.ult) withBudget(b, 1 - cb.side, frac(b, 1 - cb.side), run);
    else run();
    fx(ev, 'mdpThrowBack', cb.side, cb.from.x, cb.from.y, { path: k, at: 0 });
    out.push(p);
    feat(b, cb.side, 'md_catch');
  }
  // Miaupé's counter-attack: a cat of theirs hit your ship → an instant shot at its cabin
  const co = st.counter;
  if (co && co.side === enemy && co.t.now && cat && !cat.ko && !co.by.ko && b.winner === null && dealtTo(mine, enemy) > 0) {
    const t = b.roomCenter(side, cat.room);
    const p = dash(b, enemy, b.muzzle(enemy, co.by.def.uid), t, 'electric', 'beam');
    const k = offset();
    const zap: ShotDef = { id: 'md_contra', name: 'CONTRAGOLPE', element: 'electric', trajectory: 'beam', power: co.pw * 0.5, radius: CELL * 1.0, catMul: 0.6, statuses: [{ id: 'charged', turns: 2 }] };
    b.resolvePaths(enemy, zap, co.atk, [p], ev, k);
    fx(ev, 'mdpCounter', enemy, t.x, t.y, { uid: cat.def.uid, path: k, at: p.points.length - 1 });
    out.push(p);
    feat(b, enemy, 'md_counter');
  }
  // Post Maulone's chill: what their shot did to your crew comes right off; what your own shot did to you stays
  if (on(st.chill[side]))
    for (const c of b.sides[side].cats) if (c.stunned > (st.stun0.get(c) ?? 0)) st.selfStun.set(c, c.stunned);
  chillOff(b, st, side);
  st.ctx = null;
  return out;
}
function yugi(b: Battle, st: MdpState, cat: CatState, ev: BattleEvent[], ev0: number): ShotPath[] {
  const hit = ev.slice(st.ctx?.ev0 ?? ev0).some((e) => e.k === 'cell' && e.side === 1 - cat.side && e.dmg > 0);
  if (hit) {
    const n = Math.min(5, (st.pieces.get(cat) ?? 0) + 1);
    st.pieces.set(cat, n);
    const p = b.roomCenter(cat.side, cat.room);
    fx(ev, 'mdpPieces', cat.side, p.x, p.y, { n, uid: cat.def.uid, path: -1 });
  }
  return [];
}
export function clampHeal(b: Battle, dc: NonNullable<MdpState['decree']>) {
  if (!on(dc.t)) return;
  for (const c of b.sides[dc.side].cats) {
    if (c.ko) continue;
    const was = dc.hp.get(c);
    if (was !== undefined && c.hp > was) c.hp = was;
    dc.hp.set(c, c.hp);
  }
}
/** Post Maulone's chill: the stuns and freezes on the chilled crew come off — but not the ones it gave itself */
export function chillOff(b: Battle, st: MdpState, actor?: number) {
  for (const side of [0, 1]) {
    if (!on(st.chill[side]) || actor === side) continue;
    for (const c of b.sides[side].cats) {
      if (c.ko) continue;
      const own = st.selfStun.get(c);
      if (own !== undefined) {
        if (c.stunned <= 0) st.selfStun.delete(c);
        else continue;
      }
      if (c.stunned > 0 || c.fx.frozen > 0) {
        c.stunned = 0;
        c.fx.frozen = 0;
      }
    }
  }
}

// ------------------------------------------------------------------ resolveImpact()
/**
 * resolveImpact(), before anything: false = the impact is gone (Miaunce caught the shot, a clone swallowed it, it
 * bounced off rubber, it can't reach the decks under the water from below), a point = it lands there instead (the
 * undercover cat's fooled aim), null = as usual.
 */
export function mdImpact(b: Battle, attSide: number, shot: ShotDef, x: number, y: number, ev: BattleEvent[], path: number, at: number): PathPoint | false | null {
  const st = peek(b);
  if (!st) return null;
  const def = 1 - attSide;
  const hit = b.cellAt(x, y);
  const ctx = st.ctx && st.ctx.side === attSide ? st.ctx : null;
  const gone = (text: string, color: number, name: string) => {
    info(ev, text, x, y - 60, color, path, at);
    fx(ev, name, def, x, y, { path, at });
    ev.push({ k: 'impact', x, y, side: def, radius: 24, element: shot.element, crit: false, path, at, total: 0 });
    return false as const;
  };
  // Miaunce: the whole next shot (a cat's or an ultimate) stops in the air
  if (ctx?.caught) return gone('…', 0xf7a1c4, 'mdpCaught');
  // the rest only stop what actually reaches the defender's ship
  if (!hit || hit.side !== def) return null;
  const ca = st.catch;
  if (ca && ca.side === def && ca.t.now && !ca.by.ko && ctx && (ctx.kind === 'cat' || ctx.kind === 'ult')) {
    st.catch = null;
    ctx.caught = true;
    st.catchBack = { side: def, shot, atk: ctx.cat ? lastAtk(b, ctx.cat, shot) : b.sides[attSide].setup.cannonAtk, ult: ctx.ult, from: { x, y }, to: ctx.cat ?? null };
    return gone('¡ATRAPADO EN EL AIRE!', 0xf7a1c4, 'mdpCatch');
  }
  // Kagebunyan's clones: the next blow on its cabin is swallowed whole
  {
    const i = st.clones.findIndex((k) => k.side === def && on(k.t) && (hit.cell.module === k.room || Math.hypot(b.roomCenter(def, k.room).x - x, b.roomCenter(def, k.room).y - y) <= CELL * 1.2));
    if (i >= 0) {
      const k = st.clones[i];
      st.clones.splice(i, 1);
      const from = ctx?.cat && !ctx.cat.ko ? b.roomCenter(attSide, ctx.cat.room) : ctx?.cannonId !== undefined ? b.roomCenter(attSide, ctx.cannonId) : b.shipCenter(attSide);
      const target = cellNear(b, attSide, from);
      const to = target ? b.cellCenter(attSide, target.x, target.y) : from;
      const p = b.roomCenter(def, k.room);
      st.cloneBack.push({ side: def, x: p.x, y: p.y - 20, to, atk: k.atk, pw: k.pw });
      return gone('¡ERA UN CLON!', 0xff7a1a, 'mdpPoof');
    }
  }
  // Gomitas' rubber: beams, rocks and waves bounce off
  if (st.rubber[def].now) {
    const rubbery = shot.trajectory === 'beam' || shot.trajectory === 'heavy' || shot.trajectory === 'wave' || shot.element === 'earth' || shot.element === 'sound' || (shot.element === 'electric' && shot.trajectory !== 'gust');
    if (rubbery) {
      feat(b, def, 'md_rubber');
      return gone('¡BOING! DE HULE', 0xd62839, 'mdpBoing');
    }
  }
  // Michi-Wan's high ground: their shots can't climb to your decks under the water
  const hi = st.high;
  if (hi && hi.side === def && hi.theirs.now && b.cellCenter(def, hit.cell.x, hit.cell.y).y > b.waterY) return gone('¡NO ALCANZA! (VENTAJA DE LA ALTURA)', 0xe8c170, 'mdpHigh');
  // Persa Falsa's undercover: a blow at a cabin, the core or a cannon lands on your least valuable cell instead
  const uc = st.undercover;
  if (uc && uc.side === def && uc.t.now && hit.cell.module !== undefined && (!vsBoss(b, attSide) || ctx?.kind === 'cannon')) {
    const kind = b.sides[def].ship.modules[hit.cell.module].kind;
    if (kind === 'catroom' || kind === 'core' || kind === 'cannon') {
      const ship = b.sides[def].ship;
      const rank = (c: Cell) => (c.module === undefined ? 0 : ship.modules[c.module].kind === 'mast' ? 1 : ship.modules[c.module].kind === 'engine' ? 2 : 9);
      const decoy = ship
        .cells()
        .filter((c) => rank(c) < 9)
        .map((c) => ({ c, q: b.cellCenter(def, c.x, c.y) }))
        .sort((a, z) => rank(a.c) - rank(z.c) || Math.hypot(a.q.x - x, a.q.y - y) - Math.hypot(z.q.x - x, z.q.y - y) || a.c.y - z.c.y)[0];
      if (decoy) {
        info(ev, '¿QUIÉN ES QUIÉN?', x, y - 70, 0xf7a1c4, path, at);
        fx(ev, 'mdpFooled', def, decoy.q.x, decoy.q.y, { path, at });
        feat(b, def, 'md_undercover');
        return decoy.q;
      }
    }
  }
  return null;
}
/** the attack a cat's shot carried (for the throw-back): its own attack, like fire() starts from */
function lastAtk(b: Battle, c: CatState, shot: ShotDef) {
  void shot;
  return c.def.atk * (1 + c.rage * 0.5);
}

// ------------------------------------------------------------------ hitCat() / cap()
/** hitCat(), the damage a cat is about to take: Mazingato's alloy, Michimérica's shield, Zoomic's rings, Sabrina's heart */
export function mdHitAdjust(b: Battle, c: CatState, real: number, ev: BattleEvent[], path: number, at: number): number {
  const st = peek(b);
  if (!st || real <= 0) return real;
  const side = c.side;
  // the sugar heart swallows it first
  const ht = st.heart;
  if (ht && ht.side === side && on(ht.t) && ht.pool > 0) {
    const a = Math.min(ht.pool, real);
    ht.pool -= a;
    ht.absorbed += a;
    real -= a;
    if (ht.pool <= 0 && !ht.burst) {
      ht.burst = true;
      const p = b.shipCenter(side);
      info(ev, '¡EL CORAZÓN SE ROMPIÓ!', p.x, p.y - 200, 0xffd6e8, path, at);
    }
    if (real <= 0) return 0;
  }
  // Zoomic's rings: 10 rings instead of his life
  const r = st.rings.get(c);
  if (r && r.rings >= 10) {
    r.rings -= 10;
    r.loose += 10;
    r.stale = false;
    const p = b.roomCenter(side, c.room);
    fx(ev, 'mdpRingLoss', side, p.x, p.y, { n: r.rings, uid: c.def.uid, path, at });
    info(ev, `−10 ANILLOS (${r.rings})`, p.x, p.y - 110, 0xffd23f, path, at);
    feat(b, side, 'md_rings');
    return 0;
  }
  // Mazingato's alloy: no blow takes more than 20 % of a max life
  if (on(st.alloy[side])) {
    const capd = Math.max(1, Math.round(c.maxHp * 0.2));
    if (real > capd) {
      real = capd;
      const p = b.roomCenter(side, c.room);
      fx(ev, 'mdpAlloyHit', side, p.x, p.y, { path, at });
      feat(b, side, 'md_alloy');
    }
  }
  // Capitán Michimérica: a knockout blow on a mate → the mate keeps 1, he takes half
  const sh = st.shield;
  if (sh && sh.side === side && on(sh.t) && c !== sh.by && !sh.by.ko && real >= c.hp && c.hp > 1) {
    const orig = real;
    real = c.hp - 1;
    const p = b.roomCenter(side, c.room);
    fx(ev, 'mdpShield', side, p.x, p.y, { uid: c.def.uid, path, at });
    info(ev, '¡NO CAE! MICHIMÉRICA SE METE', p.x, p.y - 130, 0x2f4b8a, path, at);
    bleed(b, sh.by, orig * 0.5, ev, 'earth', path, at);
    feat(b, side, 'md_shield');
  }
  return real;
}
/** cap(): structure damage on a side — the sugar heart swallows it while it lasts */
export function mdAbsorb(b: Battle, side: number, dmg: number): number {
  const st = peek(b);
  const ht = st?.heart;
  if (!ht || ht.side !== side || ht.pool <= 0 || dmg <= 0 || !on(ht.t)) return dmg;
  const a = Math.min(ht.pool, dmg);
  ht.pool -= a;
  ht.absorbed += a;
  if (ht.pool <= 0) ht.burst = true;
  return dmg - a;
}

// ------------------------------------------------------------------ availability / meter
/** shooters() / cannons(): this side sits this turn out (Gatojo's stopped time, El Miauki's truce) */
export function mdBench(b: Battle, side: number): boolean {
  return !!peek(b)?.benchNow[side];
}
/** meterMul(): Gatoñeta's cake — stuffed cats gain no meter */
export function mdMeterMul(b: Battle, side: number): number {
  const ck = peek(b)?.cake;
  return ck && ck.side === side && ck.t.now ? 0 : 1;
}

// ------------------------------------------------------------------ the hooks multidim.ts forwards
/** mdShot(): the Miauknd's night — the statuses your shots leave them last twice as long */
export function mdpShot(b: Battle, side: number, shot: ShotDef): ShotDef {
  const nt = peek(b)?.night;
  if (!nt || nt.side === side || !nt.t.now || !shot.statuses?.length) return shot;
  return { ...shot, statuses: shot.statuses.map((s) => ({ ...s, turns: s.turns * 2 })) };
}
/** mdCellMul(): Sherlock's marked points (a sure critical) and Blumiau's clues (×1.5, found) */
export function mdpCellMul(b: Battle, side: number, c: Cell, mult: number): number {
  const st = peek(b);
  if (!st) return mult;
  const mk = st.marks;
  if (mk && mk.side === side && mk.cells.includes(c)) mult *= 1.5;
  const cl = st.clues;
  if (cl && cl.side === side && c.module !== undefined && cl.modules.includes(c.module)) {
    mult *= 1.5;
    if (!cl.hits.includes(c.module)) cl.hits.push(c.module);
  }
  return mult;
}
/** mdDodge(): your crew reads their cat shots (Miaunya); an expelled cat is in space (Michimpostor) */
export function mdpDodge(b: Battle, c: CatState, ev: BattleEvent[], path: number, at: number): boolean {
  const st = peek(b);
  if (!st) return false;
  const ex = st.exile.get(c);
  if (ex && on(ex.t)) {
    const p = b.roomCenter(c.side, c.room);
    info(ev, '¡ESTÁ EN EL ESPACIO!', p.x, p.y - 80, 0x9fd8ff, path, at);
    return true;
  }
  const ctx = st.ctx;
  if (st.tele[c.side].now && ctx && ctx.kind === 'cat' && ctx.side !== c.side) {
    const p = b.roomCenter(c.side, c.room);
    info(ev, '¡LO VI VENIR!', p.x, p.y - 80, 0xf7a1c4, path, at);
    fx(ev, 'mdpDodge', c.side, p.x, p.y, { uid: c.def.uid, path, at });
    feat(b, c.side, 'md_tele');
    return true;
  }
  return false;
}
/** mdCatMul(): tiny (×1.3), in love (×1.25), exposed (×1.5) */
export function mdpCatMul(b: Battle, c: CatState): number {
  const st = peek(b);
  if (!st) return 1;
  let m = 1;
  // (what they take counts from the cast on; what they deal, on their own turns)
  const sh = st.shrink.get(c);
  if (sh && on(sh.t)) m *= sh.take;
  if (on(st.love.get(c)?.t)) m *= 1.25;
  if (on(st.exposed.get(c))) m *= 1.5;
  return m;
}
/** mdAfterHit(): Hierro Michi's upgrade protocol, Garritas' healing factor (+10 meter per blow) */
export function mdpAfterHit(b: Battle, c: CatState, real: number, ev: BattleEvent[], path: number, at: number) {
  const st = peek(b);
  if (!st || c.ko || real <= 0) return;
  const up = st.upgrade.get(c);
  if (up && on(up.t) && up.bonus < 0.5 - 1e-9) {
    up.bonus = Math.min(0.5, up.bonus + 0.1);
    if (up.shields < 3) {
      up.shields++;
      c.shields++;
    }
    const p = b.roomCenter(c.side, c.room);
    fx(ev, 'mdpUpgrade', c.side, p.x, p.y, { n: Math.round(up.bonus * 100), uid: c.def.uid, path, at });
    info(ev, `MEJORA +${Math.round(up.bonus * 100)} % · +1 ESCUDO`, p.x, p.y - 120, 0xe6c34a, path, at);
  }
  if ((st.regen.get(c) ?? 0) > 0) c.ultCharge = Math.min(1, c.ultCharge + 0.1);
}
/** mdAfterFire(), after the bookkeeping: the swamp's mud (+1 reload), the law's no-healing, the exile's frozen meter */
export function mdpAfterFire(b: Battle, side: number, cat: CatState | undefined, ult: boolean, ev: BattleEvent[]) {
  const st = peek(b);
  if (!st) return;
  const sw = st.swamp;
  if (sw && sw.side === side && sw.t.now && cat) {
    cat.cooldown += 1;
    const p = b.roomCenter(side, cat.room);
    info(ev, 'EN EL LODO: +1 TURNO PARA VOLVER A DISPARAR', p.x, p.y - 120, 0x7aa83a);
  }
  for (const [c, ex] of st.exile) if (on(ex.t)) c.ultCharge = ex.meter;
  if (st.decree) clampHeal(b, st.decree);
  chillOff(b, st, side);
  void ult;
}

// the turn's start (turn.ts) and the AI / HUD (hud.ts), for multidim.ts
export { mdpStartTurn } from './turn';
export { mdpWorth, mdpChips } from './hud';
export type { MdpChip } from './hud';
