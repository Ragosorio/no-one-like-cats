/**
 * CombatSim — pure, deterministic battle logic (no rendering).
 * The view asks the sim to resolve an action and then animates the returned events.
 */
import { Rng } from '../core/rng';
import { CELL, Cell, DIRS, ModuleInst, ShipBlueprint, ShipModel } from './ship';
import { GRAVITY, DT } from './ballistics';
import { BattleCatDef, CatFx, CatState, ElementId, ShotDef, StatusId } from './types';

export interface PathPoint {
  x: number;
  y: number;
}
export interface ShotPath {
  points: PathPoint[];
  element: ElementId;
  kind: ShotDef['trajectory'];
  /** index in points where each impact happens */
  impacts: number[];
}

export type BattleEvent =
  | { k: 'impact'; x: number; y: number; side: number; radius: number; element: ElementId; crit: boolean; path: number; at: number; total: number }
  | { k: 'cell'; side: number; cell: Cell; dmg: number; destroyed: boolean; path: number; at: number }
  | { k: 'chunk'; side: number; cells: Cell[]; path: number; at: number }
  | { k: 'cat'; side: number; uid: string; dmg: number; ko: boolean; shield: boolean; revived?: boolean; element?: ElementId; fx: CatFx; overboard?: boolean; dot?: boolean; path: number; at: number }
  | { k: 'reaction'; name: string; x: number; y: number; mult: number; path: number; at: number }
  | { k: 'module'; side: number; id: number; kind: ModuleInst['kind']; path: number; at: number }
  | { k: 'splash'; x: number; y: number; path: number; at: number }
  | { k: 'shieldHit'; side: number; absorbed: number; broken: boolean; path: number; at: number }
  | { k: 'tick'; side: number; cell: Cell; dmg: number; status: StatusId; destroyed: boolean }
  | { k: 'spread'; side: number; cell: Cell; status: StatusId };

export interface SideSetup {
  blueprint: ShipBlueprint;
  hpMul: number;
  cats: BattleCatDef[];
  origin: { x: number; y: number };
  flip: boolean;
  /** neutral cannon attack value */
  cannonAtk: number;
  shieldHp?: number;
}

export interface BattleConfig {
  seed: number;
  waterY: number;
  wind?: number;
  sides: [SideSetup, SideSetup];
}

export interface SideState {
  setup: SideSetup;
  ship: ShipModel;
  cats: CatState[];
  shieldHp: number;
  shieldMax: number;
  windNext: number;
}

export type VictoryReason = 'core' | 'crew' | 'sunk';

const MAT_RESIST: Record<string, Partial<Record<ElementId, number>>> = {
  wood: { fire: 1.5, earth: 1.2, electric: 0.7 },
  iron: { fire: 0.6, electric: 1.4, earth: 1.1, water: 0.8 },
  crystal: { magic: 0.6, earth: 1.5, ice: 0.8, void: 1.3 },
  bone: { spirit: 0.6, fire: 0.9 },
  void: { void: 0.3, magic: 1.3, cosmic: 1.3 },
};
/** global damage tuning */
export const DMG_K = 0.95;
export const CAT_K = 0.7;
const FLAMMABLE = new Set(['wood', 'bone']);

export const NEUTRAL_SHOT: ShotDef = {
  id: 'cannon',
  name: 'CAÑONAZO',
  element: 'neutral',
  trajectory: 'ballistic',
  power: 1,
  radius: 70,
  preview: 0.45,
  catMul: 0.4,
};

export class Battle {
  rng: Rng;
  sides: [SideState, SideState];
  turn = 1;
  active: 0 | 1 = 0;
  wind: number;
  waterY: number;
  winner: 0 | 1 | null = null;
  reason: VictoryReason | null = null;
  log: string[] = [];

  constructor(public cfg: BattleConfig) {
    this.rng = new Rng(cfg.seed);
    this.waterY = cfg.waterY;
    this.wind = cfg.wind ?? Math.round(this.rng.range(-50, 50));
    this.sides = cfg.sides.map((s, i) => this.mkSide(s, i as 0 | 1)) as [SideState, SideState];
  }

  private mkSide(s: SideSetup, side: 0 | 1): SideState {
    const ship = new ShipModel(s.blueprint, s.hpMul);
    ship.snapshotMax();
    const rooms = ship.modules.filter((m) => m.kind === 'catroom').sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
    const cats: CatState[] = s.cats.slice(0, rooms.length).map((def, i) => ({
      def,
      side,
      hp: def.hp,
      maxHp: def.hp,
      room: rooms[i].id,
      ko: false,
      exposed: false,
      stunned: 0,
      cooldown: 0,
      ultCharge: 0,
      ultUsed: 0,
      charging: 0,
      shields: def.limitation === 'shields' ? def.shields ?? 3 : 0,
      lives: def.limitation === 'secondLife' ? 2 : 1,
      rage: 0,
      fx: { burning: 0, shocked: 0, wet: 0, frozen: 0 },
    }));
    const hasShield = ship.modules.some((m) => m.kind === 'shield');
    const shieldMax = hasShield ? s.shieldHp ?? Math.round(120 * s.hpMul) : 0;
    return { setup: s, ship, cats, shieldHp: shieldMax, shieldMax, windNext: 0 };
  }

  // ---------- geometry
  cellCenter(side: number, x: number, y: number) {
    const s = this.sides[side];
    const lx = s.setup.flip ? (s.ship.cols - 1 - x) * CELL : x * CELL;
    return { x: s.setup.origin.x + lx + CELL / 2, y: s.setup.origin.y + y * CELL + CELL / 2 };
  }
  toGrid(side: number, wx: number, wy: number) {
    const s = this.sides[side];
    let gx = Math.floor((wx - s.setup.origin.x) / CELL);
    const gy = Math.floor((wy - s.setup.origin.y) / CELL);
    if (s.setup.flip) gx = s.ship.cols - 1 - gx;
    return { x: gx, y: gy };
  }
  cellAt(wx: number, wy: number): { side: number; cell: Cell } | null {
    for (let side = 0; side < 2; side++) {
      const s = this.sides[side];
      if (wx < s.setup.origin.x || wy < s.setup.origin.y) continue;
      const g = this.toGrid(side, wx, wy);
      const c = s.ship.get(g.x, g.y);
      if (c) return { side, cell: c };
    }
    return null;
  }
  roomCenter(side: number, roomId: number) {
    const m = this.sides[side].ship.modules[roomId];
    const a = this.cellCenter(side, m.x, m.y);
    const b = this.cellCenter(side, m.x + m.w - 1, m.y + m.h - 1);
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }
  muzzle(side: number, catUid?: string) {
    const s = this.sides[side];
    if (catUid) {
      const c = s.cats.find((k) => k.def.uid === catUid);
      if (c) {
        const p = this.roomCenter(side, c.room);
        return { x: p.x + (s.setup.flip ? -30 : 30), y: p.y - 40 };
      }
    }
    const cannon = s.ship.modules.find((m) => m.kind === 'cannon' && m.alive) ?? s.ship.modules[0];
    const tip = s.setup.flip ? cannon.x : cannon.x + cannon.w - 1;
    const p = this.cellCenter(side, tip, cannon.y);
    return { x: p.x + (s.setup.flip ? -CELL : CELL), y: p.y - 6 };
  }
  /** muzzle of a specific cannon module */
  cannonMuzzle(side: number, moduleId: number) {
    const s = this.sides[side];
    const m = s.ship.modules[moduleId];
    const tip = s.setup.flip ? m.x : m.x + m.w - 1;
    const p = this.cellCenter(side, tip, m.y);
    return { x: p.x + (s.setup.flip ? -CELL * 0.6 : CELL * 0.6), y: p.y - 8 };
  }
  /** alive, not-overloaded cannons */
  cannons(side: number) {
    return this.sides[side].ship.modules.filter((m) => m.kind === 'cannon' && m.alive && m.disabled <= 0);
  }

  /** fraction of the arc the shooter can preview (mast alive = long) */
  previewMul(side: number) {
    const mast = this.sides[side].ship.modules.find((m) => m.kind === 'mast');
    return mast && !mast.alive ? 0.5 : 1;
  }

  // ---------- availability
  shooters(side: number) {
    return this.sides[side].cats.filter((c) => !c.ko && c.stunned <= 0 && c.cooldown <= 0);
  }
  canCannon(side: number) {
    return this.sides[side].ship.modules.some((m) => m.kind === 'cannon' && m.alive && m.disabled <= 0);
  }
  canUlt(c: CatState) {
    if (!c.def.ultimate || c.ko || c.stunned > 0) return false;
    const lim = c.def.ultimate.limits?.usesPerBattle;
    if (lim !== undefined && c.ultUsed >= lim) return false;
    const arc = this.sides[c.side].ship.modules.find((m) => m.kind === 'arcane');
    if (arc && !arc.alive) return false;
    return c.ultCharge >= 1;
  }

  // ---------- turn flow
  /** Called at the beginning of `side`'s turn: status ticks on its own ship. */
  startTurn(side: 0 | 1): BattleEvent[] {
    this.active = side;
    const ev: BattleEvent[] = [];
    const s = this.sides[side];
    const ship = s.ship;
    for (const m of ship.modules) if (m.disabled > 0) m.disabled--;
    for (const c of s.cats) {
      if (c.cooldown > 0) c.cooldown--;
      if (c.stunned > 0) c.stunned--;
      if (c.ko) continue;
      if (c.fx.burning > 0) {
        const dmg = Math.max(1, Math.round(c.maxHp * 0.07));
        c.hp -= dmg;
        if (c.hp <= 0) this.koOrRevive(c);
        ev.push({ k: 'cat', side, uid: c.def.uid, dmg, ko: c.ko, shield: false, element: 'fire', fx: { ...c.fx }, dot: true, path: -1, at: 0 });
      }
      for (const k of ['burning', 'shocked', 'wet', 'frozen'] as const) if (c.fx[k] > 0) c.fx[k]--;
    }
    // statuses
    const cells = ship.cells();
    const toSpread: Cell[] = [];
    for (const c of cells) {
      for (const st of Object.keys(c.status) as StatusId[]) {
        const left = (c.status[st] ?? 0) - 1;
        let dmg = 0;
        if (st === 'burning') {
          dmg = Math.round(c.maxHp * 0.2);
          if (this.rng.chance(0.55)) toSpread.push(c);
        } else if (st === 'rooted') dmg = Math.round(c.maxHp * 0.16);
        if (dmg > 0) {
          c.hp -= dmg;
          const destroyed = c.hp <= 0;
          if (destroyed) ship.destroyCell(c.x, c.y);
          ev.push({ k: 'tick', side, cell: c, dmg, status: st, destroyed });
          this.damageCatsInCell(side, c, Math.round(dmg * 0.5), ev, -1, 0, st === 'burning' ? 'fire' : 'nature');
        }
        if (left <= 0) delete c.status[st];
        else c.status[st] = left;
      }
    }
    for (const c of toSpread) {
      const ns = DIRS.map(([dx, dy]) => ship.get(c.x + dx, c.y + dy)).filter(
        (n): n is Cell => !!n && FLAMMABLE.has(n.material) && !n.status.burning && !n.status.wet,
      );
      if (ns.length) {
        const n = this.rng.pick(ns);
        n.status.burning = 2;
        ev.push({ k: 'spread', side, cell: n, status: 'burning' });
      }
    }
    const chunks = ship.collapse();
    for (const ch of chunks) ev.push({ k: 'chunk', side, cells: ch, path: -1, at: 0 });
    ev.push(...this.updateExposure(side));
    this.checkVictory();
    return ev;
  }

  endTurn() {
    if (this.active === 1) this.turn++;
    // wind drifts a little each turn
    this.wind = Math.max(-70, Math.min(70, Math.round(this.wind + this.rng.range(-12, 12))));
  }

  // ---------- firing
  /**
   * Resolve a shot. shooter: cat uid or 'cannon'. Returns paths for the view and ordered events.
   */
  fire(side: 0 | 1, shooter: string, angle: number, power: number, ult = false, cannonId?: number): { paths: ShotPath[]; events: BattleEvent[]; shot: ShotDef; atk: number } {
    const s = this.sides[side];
    let shot: ShotDef = NEUTRAL_SHOT;
    let atk = s.setup.cannonAtk;
    let cat: CatState | undefined;
    if (shooter !== 'cannon') {
      cat = s.cats.find((c) => c.def.uid === shooter);
      if (cat) {
        shot = ult && cat.def.ultimate ? cat.def.ultimate : cat.def.shot;
        atk = cat.def.atk * (1 + cat.rage * 0.5);
      }
    }
    const origin = cannonId !== undefined ? this.cannonMuzzle(side, cannonId) : this.muzzle(side, cat?.def.uid);
    const windNow = this.wind + this.sides[side].windNext;
    this.sides[side].windNext = 0;
    const paths = this.buildPaths(shot, origin, angle, power, windNow, side);
    const events: BattleEvent[] = [];
    paths.forEach((p, pi) => {
      for (const idx of p.impacts) {
        const pt = p.points[idx];
        this.resolveImpact(side, shot, atk, pt.x, pt.y, events, pi, idx, idx === p.impacts[p.impacts.length - 1]);
      }
      const last = p.points[p.points.length - 1];
      if (!p.impacts.length && last.y >= this.waterY - 4) events.push({ k: 'splash', x: last.x, y: this.waterY, path: pi, at: p.points.length - 1 });
    });
    // post: shooter bookkeeping
    if (cat) {
      cat.cooldown = ult ? 2 : 1;
      if (ult) {
        cat.ultUsed++;
        cat.ultCharge = 0;
      } else cat.ultCharge = Math.min(1, cat.ultCharge + 0.34);
    }
    if (shot.trajectory === 'gust') this.sides[1 - side].windNext = side === 0 ? 90 : -90;
    for (let i = 0; i < 2; i++) events.push(...this.updateExposure(i));
    this.checkVictory();
    return { paths, events, shot, atk };
  }

  // ---------- trajectories
  buildPaths(shot: ShotDef, o: PathPoint, angle: number, power: number, wind: number, side: number): ShotPath[] {
    const n = shot.trajectory === 'spread' ? shot.projectiles ?? 3 : 1;
    const spread = ((shot.spreadDeg ?? 10) * Math.PI) / 180;
    const out: ShotPath[] = [];
    for (let i = 0; i < n; i++) {
      const a = n === 1 ? angle : angle + (i - (n - 1) / 2) * spread;
      out.push(this.integrate(shot, o, a, power * (shot.speedMul ?? 1), wind, side));
    }
    if (shot.trajectory === 'cluster') {
      // split at apex into bomblets
      const base = out[0];
      let apex = 0;
      for (let i = 1; i < base.points.length; i++) if (base.points[i].y < base.points[apex].y) apex = i;
      const ap = base.points[apex];
      const prev = base.points[Math.max(0, apex - 1)];
      const vx = (ap.x - prev.x) / DT;
      base.points = base.points.slice(0, apex + 1);
      base.impacts = [];
      const k = shot.projectiles ?? 4;
      for (let i = 0; i < k; i++) {
        const sub = this.integrate(
          { ...shot, trajectory: 'ballistic' },
          ap,
          Math.atan2(30 + i * 25, vx) ,
          Math.abs(vx) * (0.7 + i * 0.12),
          wind,
          side,
        );
        out.push(sub);
      }
    }
    if (shot.trajectory === 'meteor') {
      // meteor drops on the x where a normal ballistic shot would land
      const land = out[0].points[out[0].points.length - 1];
      out[0] = this.integrate({ ...shot, trajectory: 'ballistic', gravityScale: 2 }, { x: land.x + (side === 0 ? -60 : 60), y: -200 }, Math.PI / 2 - (side === 0 ? -0.05 : 0.05), 600, 0, side);
    }
    return out;
  }

  private integrate(shot: ShotDef, o: PathPoint, angle: number, power: number, wind: number, side: number): ShotPath {
    const traj = shot.trajectory;
    let g = GRAVITY * (shot.gravityScale ?? (traj === 'beam' ? 0.15 : traj === 'heavy' ? 1.6 : traj === 'orb' ? 0.5 : traj === 'gust' ? 0.1 : 1));
    const windK = shot.windScale ?? (traj === 'beam' || traj === 'phase' ? 0.2 : traj === 'heavy' ? 0.5 : 1);
    let speed = power * (traj === 'beam' ? 1.7 : traj === 'orb' ? 0.85 : traj === 'gust' ? 1.5 : 1);
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    let x = o.x;
    let y = o.y;
    const pts: PathPoint[] = [{ x, y }];
    const impacts: number[] = [];
    let pierceLeft = shot.pierce ?? (traj === 'heavy' ? 2 : traj === 'phase' ? 6 : 0);
    let bounced = traj !== 'bounce';
    let torpedo = false;
    const pierced = new Set<Cell>();
    const enemy = 1 - side;
    const homingTarget = traj === 'homing' ? this.homingTarget(enemy) : null;
    for (let step = 0; step < 900; step++) {
      const sub = Math.max(1, Math.ceil((Math.hypot(vx, vy) * DT) / 8));
      const sdt = DT / sub;
      for (let k = 0; k < sub; k++) {
        if (!torpedo) {
          vx += wind * windK * sdt;
          vy += g * sdt;
        }
        if (homingTarget && step > 20) {
          const dx = homingTarget.x - x;
          const dy = homingTarget.y - y;
          const d = Math.hypot(dx, dy) || 1;
          const sp = Math.hypot(vx, vy);
          vx += (dx / d) * sp * 2.2 * sdt;
          vy += (dy / d) * sp * 2.2 * sdt;
          const n = Math.hypot(vx, vy) / sp;
          vx /= n;
          vy /= n;
        }
        x += vx * sdt;
        y += vy * sdt;
        // torpedo: enter the water and run straight under the waterline
        if (traj === 'torpedo' && !torpedo && y >= this.waterY) {
          torpedo = true;
          y = this.waterY + 20;
          vx = Math.sign(vx || 1) * 760;
          vy = 0;
        }
        const hit = this.cellAt(x, y);
        if (hit && hit.side !== side) {
          if (pierced.has(hit.cell)) continue;
          if (pierceLeft > 0) {
            pierceLeft--;
            pierced.add(hit.cell);
            pts.push({ x, y });
            impacts.push(pts.length - 1);
            if (traj === 'heavy') {
              vx *= 0.8;
              vy *= 0.8;
            }
            continue;
          }
          if (!bounced) {
            bounced = true;
            pts.push({ x, y });
            impacts.push(pts.length - 1);
            vx = -vx * 0.45;
            vy = -Math.abs(vy) * 0.55 - 180;
            x += vx * DT * 2;
            y += vy * DT * 2;
            continue;
          }
          pts.push({ x, y });
          impacts.push(pts.length - 1);
          return { points: pts, element: shot.element, kind: traj, impacts };
        }
      }
      pts.push({ x, y });
      if (!torpedo && y >= this.waterY + 10) break;
      if (x < -300 || x > 2300 || y > 1300) break;
    }
    if (traj === 'phase' && impacts.length) {
      // phase ends where it stops; last pierced cell is the "explosion"
    }
    return { points: pts, element: shot.element, kind: traj, impacts };
  }

  private homingTarget(side: number) {
    const s = this.sides[side];
    const core = s.ship.modules.find((m) => m.kind === 'core' && m.alive);
    const room = s.cats.find((c) => !c.ko);
    const m = core ?? (room ? s.ship.modules[room.room] : s.ship.modules[0]);
    const a = this.cellCenter(side, m.x, m.y);
    const b = this.cellCenter(side, m.x + m.w - 1, m.y + m.h - 1);
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  // ---------- damage resolution
  private resolveImpact(attSide: number, shot: ShotDef, atk: number, x: number, y: number, ev: BattleEvent[], path: number, at: number, final: boolean) {
    const hit = this.cellAt(x, y);
    const targetSide = hit ? hit.side : x > 960 ? 1 : 0;
    const s = this.sides[targetSide];
    const isPierce = !final && (shot.trajectory === 'heavy' || shot.trajectory === 'phase');
    const isBounceFirst = !final && shot.trajectory === 'bounce';
    let radius = isPierce ? 20 : isBounceFirst ? 36 : shot.radius;
    let base = atk * shot.power * (isBounceFirst ? 0.35 : isPierce ? (shot.trajectory === 'phase' ? 2.2 : 0.9) : 1);
    const crit = !isPierce && this.rng.chance(0.1);
    if (crit) base *= 1.5;
    // shield absorbs before anything
    if (s.shieldHp > 0 && attSide !== targetSide) {
      const shieldMod = s.ship.modules.find((m) => m.kind === 'shield');
      if (shieldMod?.alive) {
        let absorbMul = shot.element === 'magic' ? 2 : 1;
        if (shot.element === 'void') {
          s.shieldHp = 0;
          ev.push({ k: 'reaction', name: 'DEVORAR', x, y, mult: 1, path, at });
          ev.push({ k: 'shieldHit', side: targetSide, absorbed: 0, broken: true, path, at });
        } else {
          const absorbed = Math.min(s.shieldHp, base * 0.5 * absorbMul);
          s.shieldHp -= absorbed;
          base -= absorbed / absorbMul;
          ev.push({ k: 'shieldHit', side: targetSide, absorbed, broken: s.shieldHp <= 0, path, at });
        }
      }
    }
    let total = 0;
    const affected: { c: Cell; side: number; d: number }[] = [];
    for (let side = 0; side < 2; side++) {
      const ship = this.sides[side].ship;
      for (const c of ship.cells()) {
        const p = this.cellCenter(side, c.x, c.y);
        const d = Math.hypot(p.x - x, p.y - y);
        if (d <= radius + CELL * 0.35) affected.push({ c, side, d });
      }
    }
    affected.sort((a, b) => a.d - b.d);
    let reactionDone = false;
    for (const a of affected) {
      const fall = Math.max(0.3, Math.pow(1 - Math.min(1, a.d / (radius + CELL * 0.35)), 0.55));
      let mult = (MAT_RESIST[a.c.material]?.[shot.element] ?? 1) * (shot.structMul ?? 1);
      // --- elemental reactions
      const st = a.c.status;
      const r = this.react(shot, a.c, a.side, ev, path, at, x, y, reactionDone);
      if (r.name) reactionDone = true;
      mult *= r.mult;
      if (st.cursed) mult *= 1.5;
      const dmg = Math.max(1, Math.round(base * fall * mult * DMG_K));
      a.c.hp -= dmg;
      total += dmg;
      const destroyed = a.c.hp <= 0;
      // statuses from the shot
      if (!destroyed) this.applyShotStatuses(shot, a.c);
      if (destroyed) {
        const mid = a.c.module;
        this.sides[a.side].ship.destroyCell(a.c.x, a.c.y);
        if (mid !== undefined) {
          const m = this.sides[a.side].ship.modules[mid];
          if (!m.alive && !(m as ModuleInst & { _reported?: boolean })._reported) {
            (m as ModuleInst & { _reported?: boolean })._reported = true;
            ev.push({ k: 'module', side: a.side, id: mid, kind: m.kind, path, at });
            if (m.kind === 'powder') this.powderBlast(a.side, m, ev, path, at);
          }
        }
      } else if (shot.element === 'electric' && a.c.material === 'iron' && a.c.module !== undefined) {
        const m = this.sides[a.side].ship.modules[a.c.module];
        if (m.disabled <= 0) {
          m.disabled = 1;
          if (!reactionDone) {
            ev.push({ k: 'reaction', name: 'SOBRECARGA', x, y, mult: 1, path, at });
            reactionDone = true;
          }
        }
      }
      ev.push({ k: 'cell', side: a.side, cell: a.c, dmg, destroyed, path, at });
      if (a.d < radius) this.damageCatsInCell(a.side, a.c, Math.round(base * fall * (shot.catMul ?? 0.5) * CAT_K), ev, path, at, shot.element);
    }
    // conduction chain (wet + electric)
    if (shot.element === 'electric') this.conduct(targetSide, x, y, base, ev, path, at);
    ev.push({ k: 'impact', x, y, side: targetSide, radius, element: shot.element, crit, path, at, total });
    for (let side = 0; side < 2; side++) {
      const chunks = this.sides[side].ship.collapse();
      for (const ch of chunks) {
        ev.push({ k: 'chunk', side, cells: ch, path, at });
        for (const c of ch) if (c.module !== undefined) this.reportModule(side, c.module, ev, path, at);
      }
    }
  }

  private reportModule(side: number, id: number, ev: BattleEvent[], path: number, at: number) {
    const m = this.sides[side].ship.modules[id] as ModuleInst & { _reported?: boolean };
    this.sides[side].ship.refreshModule(id);
    if (!m.alive && !m._reported) {
      m._reported = true;
      ev.push({ k: 'module', side, id, kind: m.kind, path, at });
      // powder barrels chain-explode
      if (m.kind === 'powder') this.powderBlast(side, m, ev, path, at);
    }
  }

  private react(shot: ShotDef, c: Cell, side: number, ev: BattleEvent[], path: number, at: number, x: number, y: number, done: boolean) {
    const st = c.status;
    const el = shot.element;
    let name = '';
    let mult = 1;
    if (el === 'fire' && st.wet) {
      delete st.wet;
      st.steam = 2;
      name = 'VAPOR';
      mult = 0.8;
    } else if (el === 'water' && st.burning) {
      delete st.burning;
      name = 'EXTINGUIDO';
    } else if (el === 'ice' && st.wet) {
      delete st.wet;
      st.frozen = 3;
      name = 'MAR HELADO';
      mult = 1.2;
    } else if ((el === 'earth' || el === 'neutral' || shot.trajectory === 'heavy') && st.frozen) {
      delete st.frozen;
      name = 'ESTALLIDO';
      mult = 2;
    } else if (el === 'wind' && st.burning) {
      st.burning = (st.burning ?? 0) + 2;
      name = 'AVIVAR';
      mult = 1.5;
    } else if (el === 'magic' && Object.keys(st).length) {
      for (const k of Object.keys(st) as StatusId[]) st[k] = (st[k] ?? 0) * 2;
      name = 'AMPLIFICAR';
      mult = 1.3;
    } else if (el === 'void' && Object.keys(st).length) {
      for (const k of Object.keys(st) as StatusId[]) delete st[k];
      name = 'DEVORAR';
      mult = 1.2;
    } else if (el === 'nature' && st.wet) {
      st.rooted = 6;
      name = 'FLORECER';
    }
    if (name && !done) ev.push({ k: 'reaction', name, x, y, mult, path, at });
    return { name, mult };
  }

  private applyShotStatuses(shot: ShotDef, c: Cell) {
    for (const s of shot.statuses ?? []) {
      if (s.id === 'burning' && (!FLAMMABLE.has(c.material) || c.status.wet)) continue;
      if (s.id === 'burning' && c.status.steam) continue;
      c.status[s.id] = Math.max(c.status[s.id] ?? 0, s.turns);
    }
  }

  private conduct(side: number, x: number, y: number, base: number, ev: BattleEvent[], path: number, at: number) {
    const ship = this.sides[side].ship;
    const g = this.toGrid(side, x, y);
    // find the nearest wet cell to start
    const wet = ship.cells().filter((c) => c.status.wet);
    if (!wet.length) return;
    wet.sort((a, b) => Math.hypot(a.x - g.x, a.y - g.y) - Math.hypot(b.x - g.x, b.y - g.y));
    const start = wet[0];
    if (Math.hypot(start.x - g.x, start.y - g.y) > 4) return;
    const seen = new Set<Cell>([start]);
    const q = [start];
    const chain: Cell[] = [];
    while (q.length && chain.length < 8) {
      const c = q.shift()!;
      chain.push(c);
      for (const [dx, dy] of DIRS) {
        const n = ship.get(c.x + dx, c.y + dy);
        if (n && n.status.wet && !seen.has(n)) {
          seen.add(n);
          q.push(n);
        }
      }
    }
    const p = this.cellCenter(side, start.x, start.y);
    ev.push({ k: 'reaction', name: 'CONDUCCIÓN', x: p.x, y: p.y, mult: 1.5, path, at });
    for (const c of chain) {
      const dmg = Math.round(base * 0.5 * 1.5);
      c.hp -= dmg;
      delete c.status.wet;
      c.status.charged = 1;
      const destroyed = c.hp <= 0;
      if (destroyed) {
        const mid = c.module;
        ship.destroyCell(c.x, c.y);
        if (mid !== undefined) this.reportModule(side, mid, ev, path, at);
      }
      ev.push({ k: 'cell', side, cell: c, dmg, destroyed, path, at });
      // stun cats in chained rooms
      if (c.module !== undefined) {
        const cat = this.sides[side].cats.find((k) => k.room === c.module && !k.ko);
        if (cat) {
          cat.stunned = Math.max(cat.stunned, 2);
          this.damageCatsInCell(side, c, Math.round(base * 0.25), ev, path, at, 'electric');
        }
      }
    }
  }

  private powderBlast(side: number, m: ModuleInst, ev: BattleEvent[], path: number, at: number) {
    const ctr = this.cellCenter(side, m.x, m.y);
    ev.push({ k: 'reaction', name: '¡SANTABÁRBARA!', x: ctr.x, y: ctr.y, mult: 2, path, at });
    const ship = this.sides[side].ship;
    for (const c of ship.cells()) {
      const d = Math.hypot(c.x - m.x, c.y - m.y);
      if (d > 3) continue;
      const dmg = Math.round(c.maxHp * (1.1 - d * 0.25));
      c.hp -= dmg;
      const destroyed = c.hp <= 0;
      if (destroyed) {
        const mid = c.module;
        ship.destroyCell(c.x, c.y);
        if (mid !== undefined) this.reportModule(side, mid, ev, path, at);
      } else if (FLAMMABLE.has(c.material)) c.status.burning = 2;
      ev.push({ k: 'cell', side, cell: c, dmg, destroyed, path, at });
      this.damageCatsInCell(side, c, Math.round(dmg * 0.4), ev, path, at, 'fire');
    }
  }

  private damageCatsInCell(side: number, cell: Cell, dmg: number, ev: BattleEvent[], path: number, at: number, el: ElementId = 'neutral') {
    if (dmg <= 0 || cell.module === undefined) {
      // exposed cats can be hit through destroyed rooms: check by position
      const exposed = this.sides[side].cats.filter((c) => c.exposed && !c.ko);
      for (const c of exposed) {
        const m = this.sides[side].ship.modules[c.room];
        if (cell.x >= m.x - 1 && cell.x <= m.x + m.w && cell.y >= m.y - 1 && cell.y <= m.y + m.h) this.hitCat(c, dmg, ev, path, at, el);
      }
      return;
    }
    const cat = this.sides[side].cats.find((c) => c.room === cell.module && !c.ko);
    if (cat) this.hitCat(cat, dmg, ev, path, at, el);
  }

  private hitCat(c: CatState, dmg: number, ev: BattleEvent[], path: number, at: number, el: ElementId = 'neutral') {
    if (c.ko || dmg <= 0) return;
    if (c.shields > 0) {
      c.shields--;
      ev.push({ k: 'cat', side: c.side, uid: c.def.uid, dmg: 0, ko: false, shield: true, element: el, fx: { ...c.fx }, path, at });
      return;
    }
    // elemental status on the cat itself
    if (el === 'fire') {
      if (c.fx.wet > 0) c.fx.wet = 0;
      else c.fx.burning = 2;
    } else if (el === 'water') {
      c.fx.burning = 0;
      c.fx.wet = 2;
    } else if (el === 'electric') {
      c.fx.shocked = 1;
      if (c.fx.wet > 0) {
        c.stunned = Math.max(c.stunned, 2);
        dmg *= 1.5;
      }
    } else if (el === 'ice') {
      c.fx.frozen = 2;
      c.stunned = Math.max(c.stunned, 2);
      c.fx.burning = 0;
    }
    const real = Math.round(dmg * (c.exposed ? 1.5 : 1) * (c.def.limitation === 'glass' ? 3 : 1));
    c.hp -= real;
    c.ultCharge = Math.min(1, c.ultCharge + 0.12);
    const revived = c.hp <= 0 ? this.koOrRevive(c) : false;
    ev.push({ k: 'cat', side: c.side, uid: c.def.uid, dmg: real, ko: c.ko, shield: false, revived, element: el, fx: { ...c.fx }, path, at });
  }

  /** returns true if the cat used a second life */
  private koOrRevive(c: CatState): boolean {
    c.lives--;
    if (c.lives > 0) {
      c.hp = Math.round(c.maxHp * 0.6);
      return true;
    }
    c.hp = 0;
    c.ko = true;
    c.fx = { burning: 0, shocked: 0, wet: 0, frozen: 0 };
    for (const ally of this.sides[c.side].cats) if (!ally.ko && ally.def.limitation === 'berserk') ally.rage++;
    return false;
  }

  private updateExposure(side: number): BattleEvent[] {
    const ev: BattleEvent[] = [];
    const s = this.sides[side];
    for (const c of s.cats) {
      const room = s.ship.modules[c.room];
      if (!room.alive && !c.exposed) c.exposed = true;
      // the whole room sank: the cat falls into the sea
      if (!c.ko && !c.overboard && s.ship.moduleCells(room.id).length === 0 && !room.alive) {
        c.overboard = true;
        const dmg = Math.round(c.maxHp * 0.5);
        c.hp -= dmg;
        if (c.hp <= 0) {
          c.hp = 0;
          c.ko = true;
          c.fx = { burning: 0, shocked: 0, wet: 0, frozen: 0 };
        }
        c.fx.wet = c.ko ? 0 : 2;
        ev.push({ k: 'cat', side, uid: c.def.uid, dmg, ko: c.ko, shield: false, element: 'water', fx: { ...c.fx }, overboard: true, path: -1, at: 0 });
      }
    }
    return ev;
  }

  checkVictory() {
    if (this.winner !== null) return;
    for (let side = 0; side < 2; side++) {
      const s = this.sides[side];
      const core = s.ship.modules.find((m) => m.kind === 'core');
      let lost: VictoryReason | null = null;
      if (core && !core.alive) lost = 'core';
      else if (s.cats.length && s.cats.every((c) => c.ko)) lost = 'crew';
      else if (s.ship.integrity() < 0.28) lost = 'sunk';
      if (lost) {
        this.winner = (1 - side) as 0 | 1;
        this.reason = lost;
        return;
      }
    }
  }

  /** Quick integrity estimate for HUD */
  hullPct(side: number) {
    return Math.max(0, Math.min(1, this.sides[side].ship.integrity()));
  }
}
