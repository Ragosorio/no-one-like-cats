/**
 * After the Parte III · TANDA 2 · the second batch's rules during a shot (agent PODERES-3). hooks.ts calls these from
 * the hooks PODERES-2 already wired into sim.ts (mdFire, mdpShot, mdAltPaths, mdAfterShot, mdImpact, mdpCatMul,
 * mdpAfterFire) plus one new one (mdFloor, in sim.hurtCell). Every one is a no-op until a tanda-2 power of YOUR crew
 * created its rule (kitD.ts) — or, for the three that keep a tally from the start (Doc Miauwn's misses, Felinamente's
 * book, Garjona's story), until one of them sails with you.
 *
 *   fire()            dFire (the wind ×1.15, the conquest, the toy cars ×0.5) · dShot (Miauton's gravity)
 *   mdAltPaths        dPrep (Leonardo's machines, the toy cars' swerve) · dHome (Gorrimiau's compass)
 *   mdAfterShot       dAfterShot (the braid's ribbons, the misses log, the tallies, the objection, the lab's Vapor,
 *                     the conquered cells, Miauzart's encore, the compass's prize)
 *   resolveImpact()   dTrap (Mi Pobre Gatito's traps)
 *   hurtCell()        dFloor (Bastet's 30 % floor)
 *   hitCat()          dCatMul (Garjona's MARKED ×1.25) · mdpAfterFire dAfterFire (braided whiskers: no meter)
 * The turn's clocks live in turnD.ts, the AI's timing and the chips in hudD.ts.
 */
import type { Battle, BattleEvent, PathPoint, ShotPath } from '../sim';
import type { Cell } from '../ship';
import type { CatState, ShotDef } from '../types';
import { collapse, cut } from '../ults';
import { p2Flight } from '../multiverso';
import { mdOn } from '../multidim';
import { CAT_BY_ID } from '../../data/content';
import { CELL, DMG_K, S, T, alive, endPt, feat, fx, heal, hop, info, lastAt, lob, on, stun, vsBoss, withBudget } from './kit';
import type { MdpState } from './kit';
import { D, inTriangle, peekD } from './kitD';
import type { DState } from './kitD';
import { compassTarget } from './powersE';
import { conquer, flight, mark } from './powersD';

const frac = (b: Battle, side: number) => (vsBoss(b, side) ? 0.18 : 0.45);
const crewHas = (b: Battle, id: string) => b.sides[0].cats.some((c) => c.def.catId === id && mdOn(b, c));
/** a tally cat sails with you: the post state opens at the first shot (and the tanda-2 part with it) */
export function dTallies(b: Battle) {
  return crewHas(b, 'xp_docmiauwn') || crewHas(b, 'xp_felinamente') || crewHas(b, 'xp_garjona');
}
const key = (cat: CatState | undefined, cannonId: number | undefined, side: number) => (cat ? `c:${cat.def.uid}` : `k:${side}:${cannonId}`);

// ------------------------------------------------------------------ fire()
/** fire(), the attack multipliers of the tanda-2 rules (st.ctx is already set) */
export function dFire(b: Battle, st: MdpState, d: DState, side: number, cat: CatState | undefined, ult: boolean, cannonId: number | undefined, ev: BattleEvent[]): number {
  let m = 1;
  // Quetzalgatl's wind behind you
  if (d.wind && d.wind.side === side && on(d.wind.t)) m *= 1.15;
  // Napoleón's conquered territory: the whole crew, for the rest of the battle
  if (cat && d.bonus[side] > 0) m *= 1 + d.bonus[side];
  // the toy cars: the next shot of the one that stepped on them swerves and hits ×0.5 (dPrep turns it)
  if ((cat || cannonId !== undefined) && !ult && d.swerve.has(key(cat, cannonId, side))) m *= 0.5;
  // Felinamente: the owner's cats' statuses before a shot of theirs (to tell a new one)
  const ob = d.objection;
  if ((ob && ob.side !== side && on(ob.t) && !ob.used) || (side === 1 && crewHas(b, 'xp_felinamente'))) {
    d.fx0.clear();
    for (const c of b.sides[1 - side].cats) d.fx0.set(c, { ...c.fx, stunned: c.stunned });
  }
  void st;
  void ev;
  return m;
}
/** mdShot(): Isaac Miauton's gravity — the owner's shots weigh half, the foe's double (a boss ×1.5) */
export function dShot(b: Battle, side: number, shot: ShotDef): ShotDef {
  const g = peekD(b)?.gravity;
  if (!g) return shot;
  const k = g.side === side ? (g.mine.now ? 0.5 : 1) : g.theirs.now ? g.heavy : 1;
  return k === 1 ? shot : { ...shot, gravityScale: gravityOf(shot) * k };
}
/** the gravity a shot flies with (sim.integrate's own rule) */
function gravityOf(shot: ShotDef) {
  if (shot.gravityScale !== undefined) return shot.gravityScale;
  const t = shot.trajectory;
  const p2 = p2Flight(t);
  return p2 ? p2.g : t === 'beam' ? 0.15 : t === 'heavy' ? 1.6 : t === 'orb' ? 0.5 : t === 'gust' ? 0.1 : 1;
}

// ------------------------------------------------------------------ mdAltPaths
export interface Prep {
  shot: ShotDef;
  angle: number;
  /** the paths must be built and resolved here (the shot changed) */
  force: boolean;
  /** what comes after the shot resolved (the second shot, the bounces, the heal) */
  after?: (paths: ShotPath[], atk: number, ev: BattleEvent[]) => ShotPath[];
}
/** a cat's / cannon's normal shot, before it flies: Leonardo's machine for it, the toy cars' swerve */
export function dPrep(b: Battle, d: DState, side: number, cat: CatState | undefined, cannonId: number | undefined, shot: ShotDef, origin: PathPoint, angle: number, power: number, wind: number, ev: BattleEvent[]): Prep | null {
  let out: Prep | null = null;
  const k = key(cat, cannonId, side);
  if (d.swerve.has(k)) {
    d.swerve.delete(k);
    const a = angle + (side === 0 ? -1 : 1) * ((20 * Math.PI) / 180);
    out = { shot, angle: a, force: true };
    const p = cat ? b.muzzle(side, cat.def.uid) : b.cannonMuzzle(side, cannonId!);
    info(ev, '¡LOS CARRITOS! SALE DESVIADO', p.x, p.y - 100, 0xc8102e);
  }
  const t = cat ? d.codex.get(cat) : undefined;
  if (cat && t && t.now) {
    d.codex.delete(cat);
    const role = CAT_BY_ID.get(cat.def.catId)?.role ?? '';
    const base = out ?? { shot, angle, force: true };
    const s = { ...base.shot };
    let after: Prep['after'];
    let label = '';
    if (role === 'artillero') {
      label = '+2 PROYECTILES';
      if (s.trajectory === 'spread' || s.trajectory === 'ray') s.projectiles = (s.projectiles ?? (s.trajectory === 'spread' ? 3 : 1)) + 2;
      else {
        const a0 = base.angle;
        after = (paths, atk, e) => {
          const extra = [-1, 1].map((i) => b.buildPaths(s, origin, a0 + i * 0.07, power, wind, side)[0]);
          b.resolvePaths(side, s, atk, extra, e, paths.length);
          return extra;
        };
      }
    } else if (role === 'francotirador') {
      label = 'PERFORA +2';
      s.pierce = (s.pierce ?? 0) + 2;
    } else if (role === 'demoledor') {
      label = 'RADIO x1.5';
      s.radius = s.radius * 1.5;
    } else if (role === 'asediador') {
      label = '+2 REBOTES';
      after = (paths, atk, e) => {
        const out2: ShotPath[] = [];
        let from = endPt(paths[0]);
        for (let i = 0; i < 2; i++) {
          const to = { x: from.x + (side === 0 ? 1 : -1) * CELL * 1.5, y: from.y + CELL * 0.2 };
          const p = lob(b, side, from, to, 50, s.element);
          b.resolvePaths(side, { ...s, projectiles: 1 }, atk * 0.6, [p], e, paths.length + out2.length);
          out2.push(p);
          from = to;
        }
        return out2;
      };
    } else if (role === 'controlador') {
      label = 'ESTADO +2 TURNOS';
      s.statuses = (s.statuses ?? []).map((x) => ({ ...x, turns: x.turns + 2 }));
    } else if (role === 'soporte') {
      label = 'Y CURA 15 %';
      after = () => {
        const w = alive(b, side).sort((a, z) => a.hp / a.maxHp - z.hp / z.maxHp || (a.def.uid < z.def.uid ? -1 : 1))[0];
        if (w) heal(w, w.maxHp * 0.15);
        return [];
      };
    } else if (role === 'tanque') {
      label = '+2 ESCUDOS';
      cat.shields = Math.min(3, cat.shields + 2);
    } else if (role === 'invocador') {
      label = 'SE REPITE AL 50 %';
      after = (paths, atk, e) => {
        const again = paths.map((p) => ({ ...p, points: [...p.points], impacts: [...p.impacts], owners: p.owners ? [...p.owners] : undefined }));
        b.resolvePaths(side, s, atk * 0.5, again, e, paths.length);
        return again;
      };
    }
    out = { shot: s, angle: base.angle, force: true, after };
    const p = b.muzzle(side, cat.def.uid);
    if (label) {
      fx(ev, 'mdpInvention', side, p.x, p.y, { uid: cat.def.uid, path: -1 });
      info(ev, `MÁQUINA: ${label}`, p.x, p.y - 120, 0xb5543a);
    }
    feat(b, side, 'md_codex');
  }
  return out;
}
/** Gorrimiau's compass: the shot bends (up to 2.5 cells) toward the cabin of their cat with the most meter */
export function dHome(b: Battle, d: DState, side: number, cat: CatState | undefined, cannonId: number | undefined, shot: ShotDef, origin: PathPoint, angle: number, power: number, wind: number, ev: BattleEvent[]): ShotPath[] | null {
  const cp = d.compass;
  if (!cp || cp.side !== side || !on(cp.t) || (!cat && cannonId === undefined)) return null;
  const enemy = 1 - side;
  const target = compassTarget(b, enemy);
  cp.prey = target.cat ?? null;
  cp.preyKo = target.cat?.ko ?? false;
  const land = (ps: ShotPath[]) => {
    const e = ps.map(endPt);
    return { x: e.reduce((a, q) => a + q.x, 0) / e.length, y: e.reduce((a, q) => a + q.y, 0) / e.length };
  };
  const base = b.buildPaths(shot, origin, angle, power, wind, side);
  const L = land(base);
  const gap = Math.hypot(target.x - L.x, target.y - L.y);
  if (gap < CELL * 0.3) return base;
  const reach = CELL * 2.5;
  const want = { x: L.x + ((target.x - L.x) * Math.min(1, reach / gap)), y: L.y + ((target.y - L.y) * Math.min(1, reach / gap)) };
  let best = base;
  let score = Math.hypot(L.x - want.x, L.y - want.y);
  for (let da = -0.12; da <= 0.1201; da += 0.03)
    for (let dp = -0.2; dp <= 0.2001; dp += 0.05) {
      if (Math.abs(da) < 1e-9 && Math.abs(dp) < 1e-9) continue;
      const ps = b.buildPaths(shot, origin, angle + da, power * (1 + dp), wind, side);
      const q = land(ps);
      if (Math.hypot(q.x - L.x, q.y - L.y) > reach + 4) continue;
      const sc = Math.hypot(q.x - want.x, q.y - want.y);
      if (sc < score - 0.5) {
        score = sc;
        best = ps;
      }
    }
  if (best !== base) {
    const q = land(best);
    fx(ev, 'mdpCompassBend', enemy, q.x, q.y, { path: 0, at: lastAt(best[0]) });
  }
  return best;
}

// ------------------------------------------------------------------ mdAfterShot
/**
 * fire(), after the shot resolved: the tanda-2 tallies and triggers. `mine` = this shot's own events (before any extra
 * shot); `k0` = the index the next extra path gets. Returns the extra paths it adds.
 */
export function dAfterShot(b: Battle, d: DState, side: number, cat: CatState | undefined, ult: boolean, cannonId: number | undefined, shot: ShotDef, paths: ShotPath[], mine: BattleEvent[], ev: BattleEvent[], k0: number): ShotPath[] {
  const enemy = 1 - side;
  const out: ShotPath[] = [];
  const k = () => k0 + out.length;
  const lastP = Math.max(0, paths.length - 1);
  const atEnd = lastAt(paths[lastP]);
  // ---- Doc Miauwn's log: a shot of yours that fell without touching their ship
  if (side === 0 && !ult && (cat || cannonId !== undefined) && paths.length && crewHas(b, 'xp_docmiauwn')) {
    if (!mine.some((e) => e.k === 'impact' && e.side === 1) && !mine.some((e) => (e.k === 'cell' || e.k === 'cat') && e.side === 1)) {
      const q = paths[0].points[paths[0].points.length - 1];
      d.misses.push({ x: q.x, y: q.y, element: shot.element, statuses: (shot.statuses ?? []).map((s) => ({ ...s })) });
      if (d.misses.length > 10) d.misses.splice(0, d.misses.length - 10);
    }
  }
  // ---- the foe's tallies: who hurt you (Garjona), who left statuses on you (Felinamente)
  if (side === 1 && cat) {
    if (crewHas(b, 'xp_garjona')) {
      const dmg = mine.reduce((a, e) => a + ((e.k === 'cell' || (e.k === 'cat' && !e.dot)) && e.side === 0 ? e.dmg : 0), 0);
      if (dmg > 0) d.hurtBy.set(cat, (d.hurtBy.get(cat) ?? 0) + dmg);
    }
    if (crewHas(b, 'xp_felinamente')) {
      let n = mine.filter((e) => e.k === 'status' && e.side === 0).length;
      for (const c of b.sides[0].cats) {
        const was = d.fx0.get(c);
        if (!was || c.ko) continue;
        if (c.stunned > was.stunned) n++;
        for (const s of ['burning', 'shocked', 'wet', 'frozen'] as const) if (c.fx[s] > 0 && was[s] <= 0) n++;
      }
      if (n > 0) d.statusBy.set(cat, (d.statusBy.get(cat) ?? 0) + n);
    }
  }
  // ---- Felinamente's objection: the first new status on a cat of the owner goes back to all of theirs
  const ob = d.objection;
  if (ob && ob.side === enemy && on(ob.t) && !ob.used && (cat || cannonId !== undefined)) {
    for (const c of [...b.sides[ob.side].cats].sort((a, z) => (a.def.uid < z.def.uid ? -1 : 1))) {
      const was = d.fx0.get(c);
      if (!was || c.ko) continue;
      const fresh = c.stunned > was.stunned ? 'stunned' : (['frozen', 'burning', 'wet', 'shocked'] as const).find((s) => c.fx[s] > 0 && was[s] <= 0);
      if (!fresh) continue;
      ob.used = true;
      const value = fresh === 'stunned' ? c.stunned : c.fx[fresh];
      if (fresh === 'stunned') c.stunned = was.stunned;
      else c.fx[fresh] = was[fresh];
      for (const f of alive(b, side)) {
        if (fresh === 'stunned') stun(b, f, value);
        else f.fx[fresh] = Math.max(f.fx[fresh], value);
      }
      const p = b.roomCenter(ob.side, c.room);
      fx(ev, 'mdpObjection', ob.side, p.x, p.y, { uid: c.def.uid, path: lastP, at: atEnd });
      info(ev, '¡OBJECIÓN ACEPTADA! SE LES REGRESA A TODOS', p.x, p.y - 140, 0xf7a1c4, lastP, atEnd);
      feat(b, ob.side, 'md_objection');
      break;
    }
  }
  // ---- El Sombreronrón's braid: a ribbon per impact of a cat shot / ultimate of the owner on their ship
  const br = d.braid;
  if (br && br.side === side && on(br.t) && cat && br.pins.length < 3) {
    // where it landed: its impacts — or, for a power that hits by hand (a bite, a tear), the cells and cats it hurt
    const spots: { x: number; y: number; path: number; at: number }[] = [];
    for (const e of mine) if (e.k === 'impact' && e.side === enemy) spots.push({ x: e.x, y: e.y, path: e.path, at: e.at });
    if (!spots.length)
      for (const e of mine) {
        if (e.k === 'cell' && e.side === enemy && e.dmg > 0) spots.push({ ...b.cellCenter(enemy, e.cell.x, e.cell.y), path: e.path, at: e.at });
        else if (e.k === 'cat' && e.side === enemy && e.dmg > 0) {
          const c = b.sides[enemy].cats.find((k) => k.def.uid === e.uid);
          if (c) spots.push({ ...b.roomCenter(enemy, c.room), path: e.path, at: e.at });
        }
      }
    for (const q of spots) {
      if (br.pins.length >= 3) break;
      // one ribbon per spot (two blows on the same spot pin one)
      if (br.pins.some((p) => Math.hypot(p.x - q.x, p.y - q.y) < CELL * 0.5)) continue;
      br.pins.push({ x: q.x, y: q.y });
      fx(ev, 'mdpPin', enemy, q.x, q.y, { n: br.pins.length, path: q.path, at: q.at });
    }
    if (br.pins.length >= 3) out.push(...braid(b, d, br, ev, k()));
  }
  // ---- Pinkmiau's lab: every blow that touches their ship leaves Vapor 2
  const lab = d.lab;
  if (lab && lab.side === side && lab.t.now) {
    const cells = [...new Set(mine.filter((e) => e.k === 'cell' && e.side === enemy && e.dmg > 0).map((e) => (e as { cell: Cell }).cell))];
    if (cells.length) {
      mark(b, enemy, cells, 'steam', 2, ev);
      feat(b, side, 'md_lab', cells.length);
    }
  }
  // ---- Napoleón: the cells this shot conquered
  const cq = d.conquest;
  if (cq && cq.side === side && on(cq.t)) conquer(b, side, mine, ev, lastP, atEnd);
  // ---- Gorrimiau's compass: the cat it pointed at fell to this shot
  const cp = d.compass;
  if (cp && cp.side === side && cp.prey && !cp.preyKo && cp.prey.ko) {
    cp.by.ultCharge = Math.min(1, cp.by.ultCharge + 0.5);
    const p = b.roomCenter(side, cp.by.room);
    info(ev, '¡EL ATÚN ES MÍO! +50 DE BARRA', p.x, p.y - 140, 0xc49a3c, lastP, atEnd);
    cp.prey = null;
  }
  // ---- Miauzart's encore: another cat's ultimate plays again at 60 % (its direct damage, its own cap)
  const en = d.encore;
  if (en && en.side === side && en.t.now && ult && cat && cat !== en.by && b.winner === null) {
    d.encore = null;
    out.push(...encore(b, en.by, side, mine, ev, k()));
  }
  return out;
}
/** the braid closes: the triangle of the three ribbons */
function braid(b: Battle, d: DState, br: NonNullable<DState['braid']>, ev: BattleEvent[], k: number): ShotPath[] {
  d.braid = null;
  const enemy = 1 - br.side;
  const [a, b2, c] = br.pins;
  const ship = b.sides[enemy].ship;
  const inside = ship.cells().filter((x) => inTriangle(b.cellCenter(enemy, x.x, x.y), a, b2, c, CELL * 0.15));
  const pts = [a, ...hop(a, b2, 30, 14), ...hop(b2, c, 30, 14), ...hop(c, a, 30, 14)];
  const p = flight(pts, 'magic', 'beam');
  const at = pts.length - 1;
  const P = br.atk * br.pw * DMG_K;
  withBudget(b, enemy, frac(b, enemy), () => {
    if (inside.length) for (const x of inside) cut(b, enemy, x, P * 0.4, ev, k, at);
    else for (const q of br.pins) pinBlow(b, br, q, ev, k, at);
  });
  collapse(b, enemy, ev, k, at);
  mark(b, enemy, inside, 'rooted', 2, ev);
  const rooms = new Set(inside.map((x) => x.module).filter((m): m is number => m !== undefined));
  for (const cat of alive(b, enemy)) if (rooms.has(cat.room)) d.braided.set(cat, { t: T(1), meter: cat.ultCharge });
  const cx = (a.x + b2.x + c.x) / 3;
  const cy = (a.y + b2.y + c.y) / 3;
  fx(ev, 'mdpBraidClose', enemy, cx, cy, { n: inside.length, path: k, at });
  info(ev, inside.length ? `¡TRENZADO! ${inside.length} CELDAS EN EL TRIÁNGULO` : '¡TRENZADO! (UN TRIÁNGULO FLACO: PEGA EN LOS LISTONES)', cx, cy - 150, 0xe6c34a, k, at);
  feat(b, br.side, 'md_braid');
  return [p];
}
/** a lone ribbon's blow (radius 1): the window ran out short, or the triangle came out flat */
export function pinBlow(b: Battle, br: NonNullable<DState['braid']>, q: PathPoint, ev: BattleEvent[], path: number, at: number) {
  const enemy = 1 - br.side;
  const shot: ShotDef = { id: 'md_liston', name: 'LISTÓN', element: 'magic', trajectory: 'ballistic', power: br.pw * 0.4, radius: CELL * 1.0, catMul: 0.5 };
  b.resolveImpact(br.side, shot, br.atk, q.x, q.y, ev, path, at, true);
  void enemy;
}
/** the encore: every blow of that ultimate on their side, again at 60 % */
function encore(b: Battle, by: CatState, side: number, mine: BattleEvent[], ev: BattleEvent[], k: number): ShotPath[] {
  const enemy = 1 - side;
  const first = mine.find((e) => e.k === 'impact' && e.side === enemy) as { x: number; y: number } | undefined;
  const to = first ?? b.shipCenter(enemy);
  const from = by.ko ? { x: to.x - (side === 0 ? 300 : -300), y: -150 } : b.roomCenter(side, by.room);
  const p = flight([from, ...hop(from, to, 160, 16)], 'sound');
  const at = p.points.length - 1;
  let n = 0;
  withBudget(b, enemy, frac(b, enemy), () => {
    for (const e of mine) {
      if (e.k === 'cell' && e.side === enemy && e.dmg > 0) {
        const c = e.cell;
        if (c.hp <= 0 || b.sides[enemy].ship.get(c.x, c.y) !== c) continue;
        if (cut(b, enemy, c, e.dmg * 0.6, ev, k, at) > 0) n++;
      } else if (e.k === 'cat' && e.side === enemy && !e.dot && !e.shield && e.dmg > 0) {
        const c = b.sides[enemy].cats.find((x) => x.def.uid === e.uid);
        if (!c || c.ko) continue;
        b.hitCat(c, Math.round((e.dmg * 0.6) / (e.aff ?? 1)), ev, k, at, e.element, true);
        n++;
      }
    }
  });
  collapse(b, enemy, ev, k, at);
  fx(ev, 'mdpEncoreHit', enemy, to.x, to.y, { n, path: k, at });
  info(ev, n ? '¡BRAVO, ENCORE! (OTRA VEZ, AL 60 %)' : '¡BRAVO, ENCORE! (NO HABÍA QUÉ REPETIR)', to.x, to.y - 170, 0xe8c7a0, k, at);
  feat(b, side, 'md_encore');
  return [p];
}

// ------------------------------------------------------------------ resolveImpact()
/** Mi Pobre Gatito's traps: an impact of theirs on a trapped cell does nothing there — the trap gets the shooter */
export function dTrap(b: Battle, st: MdpState, d: DState, attSide: number, shot: ShotDef, x: number, y: number, cell: Cell, ev: BattleEvent[], path: number, at: number): boolean {
  const tr = d.traps;
  const def = 1 - attSide;
  const ctx = st.ctx && st.ctx.side === attSide ? st.ctx : null;
  if (!tr || tr.side !== def || !on(tr.t) || !ctx || (!ctx.cat && ctx.cannonId === undefined)) return false;
  const reach = Math.max(CELL * 0.75, shot.radius * 0.5);
  const i = tr.cells.findIndex((c) => c === cell || (c.hp > 0 && Math.hypot(b.cellCenter(def, c.x, c.y).x - x, b.cellCenter(def, c.x, c.y).y - y) <= reach));
  if (i < 0) return false;
  tr.cells.splice(i, 1);
  const kind = tr.next++ % 4;
  const names = ['¡LATA DE PINTURA!', '¡PERILLA CALIENTE!', '¡LOS CARRITOS!', '¡LA PLANCHA!'];
  ev.push({ k: 'impact', x, y, side: def, radius: 24, element: shot.element, crit: false, path, at, total: 0 });
  info(ev, names[kind], x, y - 70, 0xc8102e, path, at);
  fx(ev, 'mdpTrap', def, x, y, { n: kind, path, at });
  const c = ctx.cat && !ctx.cat.ko ? ctx.cat : undefined;
  const gun = ctx.cannonId !== undefined ? b.sides[attSide].ship.modules[ctx.cannonId] : undefined;
  const at2 = c ? b.roomCenter(attSide, c.room) : gun ? b.roomCenter(attSide, gun.id) : b.shipCenter(attSide);
  if (kind === 0) {
    if (c) stun(b, c, 2);
    else if (gun) gun.disabled = Math.max(gun.disabled, 2);
  } else if (kind === 1) {
    if (c) {
      c.fx.burning = Math.max(c.fx.burning, 2);
      c.ultCharge = Math.max(0, c.ultCharge - 0.3);
    } else if (gun) mark(b, attSide, b.sides[attSide].ship.moduleCells(gun.id), 'burning', 2, ev);
  } else if (kind === 2) {
    d.swerve.add(key(c, gun?.id, attSide));
  } else {
    const iron: ShotDef = { id: 'md_plancha', name: 'LA PLANCHA', element: 'fire', trajectory: 'heavy', power: tr.pw * 0.45, radius: CELL * 1.0, catMul: 0.5 };
    withBudget(b, attSide, frac(b, attSide), () => b.resolveImpact(def, iron, tr.atk, at2.x, at2.y, ev, path, at, true));
  }
  fx(ev, 'mdpTrapHit', attSide, at2.x, at2.y, { n: kind, path, at });
  feat(b, def, 'md_trap');
  if (!tr.cells.length) d.traps = null;
  return true;
}

// ------------------------------------------------------------------ hurtCell() / hitCat() / after fire
/** hurtCell(): Bastet's floor — the owner's cells don't go under 30 % of their max life; every clipped blow is a ray */
export function dFloor(b: Battle, side: number, c: Cell, dmg: number): number {
  const g = peekD(b)?.guard;
  if (!g || g.side !== side || g.done || !on(g.t) || dmg <= 0) return dmg;
  const floor = Math.ceil(c.maxHp * 0.3);
  if (c.hp - dmg >= floor) return dmg;
  g.rays++;
  return Math.max(0, c.hp - floor);
}
/** mdCatMul(): Garjona's MARKED cats take ×1.25 from the shots of the side that marked them */
export function dCatMul(b: Battle, st: MdpState, d: DState, c: CatState): number {
  const t = d.marked.get(c);
  if (!t || !on(t)) return 1;
  return st.ctx && st.ctx.side !== c.side ? 1.25 : 1;
}
/** mdAfterFire(): braided whiskers — those cats gain no meter this turn of theirs */
export function dAfterFire(b: Battle, d: DState) {
  for (const [c, x] of d.braided) if (x.t.now && !c.ko && c.ultCharge > x.meter) c.ultCharge = x.meter;
  void b;
}
export { D, S };
