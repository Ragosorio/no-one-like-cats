/**
 * CombatSim — pure, deterministic battle logic (no rendering).
 * The view asks the sim to resolve an action and then animates the returned events.
 *
 * M2 additions: GDD material table (stone/canvas…), cat affinity, Tormenta (rayo/ráfaga) with
 * Conducción / Ventisca / Estallido / Avivar / Sobrecarga, Escudo Burbuja (player) and Burbuja de
 * Estática (Kraken), boss rules (Gárgola: piel de piedra + ronroneo + lluvia + vuelo; Kraken:
 * tentáculos + ojo + burbuja + inmersión), stage rules (cubierta mojada, pararrayos, enredaderas,
 * Diluvio Perpetuo, armadura), enrage and sudden death.
 */
import { Rng } from '../core/rng';
import { CELL, Cell, DIRS, Material, ModuleInst, ShipBlueprint, ShipModel } from './ship';
import { GRAVITY, DT } from './ballistics';
import { BattleCatDef, CatFx, CatState, ElementId, ShotDef, StatusId } from './types';
import { CONTENT } from '../data/content';
// Parte 2: Hielo, Luz, Sombra, Sonido, Tiempo, Vacío (small hooks below, rules in multiverso.ts)
import { p2BeginFire, p2Flight, p2Impact, p2PostHitCat, p2PreHitCat, p2PreviewMul, p2React, p2Shooters, p2StartTurn } from './multiverso';

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

export type BossWhat =
  | 'purr' // gargoyle purr counter (n = 1..3)
  | 'purrStop' // throat hit: purr interrupted + stun
  | 'heal' // purr completed: healed n (internal hp)
  | 'rain' // phase 2 rain: everything wet
  | 'fly' // gargoyle takes off
  | 'perch' // gargoyle moves to another hover point (n = point)
  | 'eyeTell' // kraken beak opens next turn
  | 'eyeOpen'
  | 'eyeClose'
  | 'weak' // weak point hit
  | 'submerge'
  | 'surface'
  | 'grab' // tentacle grabs a module (part, module, side = grabbed side)
  | 'release'
  | 'throw' // tentacle throws a cat into the sea (uid)
  | 'squeeze'
  | 'enrage'
  | 'suddenDeath'
  | 'wetDeck'
  | 'regrow'
  | 'staticUp';

export type BattleEvent =
  | { k: 'impact'; x: number; y: number; side: number; radius: number; element: ElementId; crit: boolean; path: number; at: number; total: number }
  | { k: 'cell'; side: number; cell: Cell; dmg: number; destroyed: boolean; path: number; at: number }
  | { k: 'chunk'; side: number; cells: Cell[]; path: number; at: number }
  | {
      k: 'cat';
      side: number;
      uid: string;
      dmg: number;
      ko: boolean;
      shield: boolean;
      revived?: boolean;
      element?: ElementId;
      fx: CatFx;
      overboard?: boolean;
      dot?: boolean;
      /** affinity multiplier applied (1.5 super effective, 0.75 not very) */
      aff?: number;
      stunned?: boolean;
      path: number;
      at: number;
    }
  | { k: 'reaction'; name: string; x: number; y: number; mult: number; path: number; at: number }
  | { k: 'module'; side: number; id: number; kind: ModuleInst['kind']; path: number; at: number }
  | { k: 'splash'; x: number; y: number; path: number; at: number }
  | { k: 'shieldHit'; side: number; absorbed: number; broken: boolean; path: number; at: number }
  | { k: 'tick'; side: number; cell: Cell; dmg: number; status: StatusId; destroyed: boolean }
  | { k: 'spread'; side: number; cell: Cell; status: StatusId }
  | { k: 'flood'; side: number; flood: number; breaches: number }
  | { k: 'phase'; n: number }
  | { k: 'boss'; what: BossWhat; side: number; n?: number; module?: number; part?: number; uid?: string; x?: number; y?: number; path: number; at: number }
  | { k: 'part'; side: number; id: number; dmg: number; destroyed: boolean; path: number; at: number }
  | { k: 'bubble'; side: number; what: 'block' | 'break' | 'up' | 'down'; x: number; y: number; path: number; at: number }
  | { k: 'heal'; side: number; cell: Cell; amount: number }
  | { k: 'status'; side: number; cells: Cell[]; status: StatusId }
  | { k: 'info'; text: string; x: number; y: number; color: number; path: number; at: number };

export interface SideSetup {
  blueprint: ShipBlueprint;
  hpMul: number;
  cats: BattleCatDef[];
  origin: { x: number; y: number };
  flip: boolean;
  /** neutral cannon attack value */
  cannonAtk: number;
  shieldHp?: number;
  /** weapon type shot per cannon module (in module order); default = neutral cannon */
  cannonShots?: ShotDef[];
  /** Escudo Burbuja: impacts nullified per turn (0/undefined = none). Needs live shield modules. */
  bubble?: number;
  /** Gorrión perk: two cats on turn 1 */
  firstTurnDouble?: boolean;
  /** initial ultimate meter for the whole crew (0..1, gear) */
  ultStart?: number;
  /** incoming damage multiplier on this side's cells (errand armor x2 → 0.5) */
  armor?: number;
  /** utility modules (editor) modelled as side flags: Despensa heals cats, Bombas halve flooding, Ancla ignores pushes */
  pantry?: boolean;
  pump?: boolean;
  anchor?: boolean;
  /** extra Conducción jumps (Corona del Trueno / Torre Tesla) */
  conductionBonus?: number;
}

export interface BossConfig {
  id: 'sardina' | 'gargoyle' | 'kraken';
  /** boss side (always the enemy) */
  side: 0 | 1;
  /** uid of the boss cat (captain) */
  captain: string;
  enrageTurn: number;
}

export interface StageRules {
  /** sides whose deck stays wet (Balandra Eléctrica) */
  wetDeck?: number[];
  /** Diluvio Perpetuo: every cell of both ships is wet at every turn start */
  wetAll?: boolean;
  /** sides with a lightning rod: absorbs the first ⚡ impact each turn while its mast lives */
  rod?: number[];
  /** sides whose vines heal the most damaged cell each turn (Galera de Raíces) */
  regrow?: number[];
  /** Barón Ladrillo: AI targets supports */
  demolisher?: number[];
  /** this side leaves at the end of `turn` (Barco del Vacío): the other side "wins" by surviving */
  retreat?: { side: 0 | 1; turn: number };
}

export interface BattleConfig {
  seed: number;
  waterY: number;
  wind?: number;
  /** 'duel': cats on small platforms, only crew K.O. wins */
  mode?: 'siege' | 'duel';
  sides: [SideSetup, SideSetup];
  boss?: BossConfig;
  rules?: StageRules;
  /** sudden death from this turn (GDD: 10). 0 disables */
  suddenDeath?: number;
}

/** separately targetable boss pieces (tentacles, the Kraken eye, the flying gargoyle) */
export interface Part {
  id: number;
  kind: 'tentacle' | 'eye' | 'gargoyle';
  side: number;
  /** capsule from (x, y0) to (x, y1) with radius r (world coords) */
  x: number;
  y0: number;
  y1: number;
  r: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  /** collides only while active (eye open, gargoyle flying) */
  active: boolean;
  material: Material;
  grab: number | null;
}

export interface BossState {
  id: BossConfig['id'];
  phase: 1 | 2 | 3;
  purr: number;
  flying: boolean;
  perch: number;
  eyeIn: number;
  eyeOpen: boolean;
  submerged: boolean;
  /** kraken stunned by an eye hit: no grabs next turn */
  dazed: boolean;
  enraged: boolean;
}

export interface SideState {
  setup: SideSetup;
  ship: ShipModel;
  cats: CatState[];
  shieldHp: number;
  shieldMax: number;
  windNext: number;
  /** flooding 0..1 (1 = sunk). Breaches = hull cells destroyed below the waterline by water/earth */
  flood: number;
  breaches: number;
  /** bubble charges available now / per turn */
  bubble: number;
  bubbleMax: number;
  bubbleKind: 'bubble' | 'static' | null;
  parts: Part[];
  /** lightning rod already used this turn */
  rodUsed: boolean;
}

export type VictoryReason = 'core' | 'crew' | 'sunk' | 'retreat';

/** GDD material table (content.materials): multiplier per element of the shot; 'storm' = sim 'electric' */
const MAT_RESIST: Record<string, Partial<Record<ElementId, number>>> = (() => {
  const out: Record<string, Partial<Record<ElementId, number>>> = {};
  const map: Record<string, ElementId> = { storm: 'electric' };
  for (const m of CONTENT.materials) {
    const row: Partial<Record<ElementId, number>> = {};
    for (const [el, v] of Object.entries(m.mult)) row[map[el] ?? (el as ElementId)] = v;
    // derived (when content has no column): the ice shards behave like water, the wind like storm
    row.ice ??= row.water ?? 1;
    row.wind = row.electric ?? 1;
    out[m.id] = row;
  }
  return out;
})();
const AFFINITY = CONTENT.affinity as Record<string, Record<string, number>>;
const toContentEl = (e: ElementId) => (e === 'electric' || e === 'wind' ? 'storm' : e);
/** cat-vs-cat affinity: attacker shot element vs defender PRIMARY element */
export function affinity(att: ElementId, def: ElementId | undefined) {
  if (!def) return 1;
  return AFFINITY[toContentEl(att)]?.[toContentEl(def)] ?? 1;
}

/** global damage tuning */
export const DMG_K = 0.95;
export const CAT_K = 0.7;
const FLAMMABLE = new Set(['wood', 'bone', 'canvas']);
/** sinking threshold (structure fraction) */
export const SINK_AT = 0.28;
/** boss damage bonus once enraged */
const ENRAGE_MUL = 1.25;

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

const isRayo = (s: ShotDef) => s.element === 'electric' && s.trajectory !== 'gust';
const isGust = (s: ShotDef) => s.trajectory === 'gust';
const isMulti = (s: ShotDef) => (s.trajectory === 'spread' || s.trajectory === 'cluster') && (s.projectiles ?? 1) > 1;

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
  /** scales powder barrel blasts (attacker f(S) applies to the owner's barrels) */
  powderMul = 1;
  boss: BossState | null = null;
  /** sudden death already announced */
  private sdAnnounced = false;
  /** events produced outside fire()/startTurn() (phase changes) waiting for the view */
  pending: BattleEvent[] = [];

  constructor(public cfg: BattleConfig) {
    this.rng = new Rng(cfg.seed);
    this.waterY = cfg.waterY;
    this.wind = cfg.wind ?? Math.round(this.rng.range(-50, 50));
    this.sides = cfg.sides.map((s, i) => this.mkSide(s, i as 0 | 1)) as [SideState, SideState];
    if (cfg.boss) this.initBoss(cfg.boss);
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
      ultCharge: Math.max(0, Math.min(1, Math.max(s.ultStart ?? 0, def.ultStart ?? 0))),
      ultUsed: 0,
      charging: 0,
      shields: def.limitation === 'shields' ? def.shields ?? 3 : 0,
      lives: def.limitation === 'secondLife' ? 2 : 1,
      rage: 0,
      fx: { burning: 0, shocked: 0, wet: 0, frozen: 0 },
    }));
    const bubbleMods = ship.modules.filter((m) => m.kind === 'shield' && !m.tag);
    const bubble = s.bubble && bubbleMods.length ? s.bubble : 0;
    // legacy absorbing shield (zone 4+ arcane shields) only when no bubble is configured
    const hasShield = !bubble && ship.modules.some((m) => m.kind === 'shield' && !m.tag);
    const shieldMax = hasShield ? s.shieldHp ?? Math.round(120 * s.hpMul) : 0;
    return {
      setup: s,
      ship,
      cats,
      shieldHp: shieldMax,
      shieldMax,
      windNext: 0,
      flood: 0,
      breaches: 0,
      bubble,
      bubbleMax: bubble,
      bubbleKind: bubble ? 'bubble' : null,
      parts: [],
      rodUsed: false,
    };
  }

  // ---------- boss setup
  private initBoss(b: BossConfig) {
    this.boss = { id: b.id, phase: 1, purr: 0, flying: false, perch: 0, eyeIn: 2, eyeOpen: false, submerged: false, dazed: false, enraged: false };
    const s = this.sides[b.side];
    const ox = s.setup.origin.x;
    const oy = s.setup.origin.y;
    const w = s.ship.cols * CELL;
    if (b.id === 'kraken') {
      // 4 tentacles wrapped around the hull, rising from the sea (separate targets, 300 hp each)
      const hp = Math.round(300 * s.setup.hpMul);
      const deckY = oy + (s.ship.rows - 5) * CELL;
      const fr = s.setup.flip ? [0.06, 0.3, 0.64, 0.92] : [0.94, 0.7, 0.36, 0.08];
      fr.forEach((f, i) => {
        const top = deckY - (i % 2 === 0 ? 70 : 20);
        s.parts.push({ id: i, kind: 'tentacle', side: b.side, x: ox + w * f, y0: this.waterY + 10, y1: top, r: 24, hp, maxHp: hp, alive: true, active: true, material: 'bone', grab: null });
      });
      // the Eye: the kraken's mantle rises behind the ship; its giant eye is only hittable when the beak opens
      s.parts.push({ id: 4, kind: 'eye', side: b.side, x: s.setup.flip ? ox + w * 0.76 : ox + w * 0.24, y0: oy + 56, y1: oy + 56, r: 48, hp: 1, maxHp: 1, alive: true, active: false, material: 'bone', grab: null });
    }
    if (b.id === 'gargoyle') {
      const cap = s.cats.find((c) => c.def.uid === b.captain);
      const hp = cap ? cap.maxHp : 300;
      s.parts.push({ id: 0, kind: 'gargoyle', side: b.side, x: ox + w * 0.5, y0: oy + 40, y1: oy + 40, r: 46, hp, maxHp: hp, alive: true, active: false, material: 'stone', grab: null });
    }
  }

  private captain(): CatState | undefined {
    const b = this.cfg.boss;
    if (!b) return undefined;
    return this.sides[b.side].cats.find((c) => c.def.uid === b.captain);
  }

  /** the four hover points of the flying gargoyle (world coords) */
  perchPoint(i: number) {
    const b = this.cfg.boss!;
    const s = this.sides[b.side];
    const ox = s.setup.origin.x;
    const oy = s.setup.origin.y;
    const w = s.ship.cols * CELL;
    const pts = [
      { x: ox + w * 0.5, y: oy + 30 },
      { x: ox + w * 0.2, y: oy + 90 },
      { x: ox + w * 0.78, y: oy - 10 },
      { x: ox + w * 0.36, y: oy - 40 },
    ];
    return pts[i % pts.length];
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
  /** an active boss part under (wx, wy) belonging to `side` */
  partAt(wx: number, wy: number, side: number, pad = 0): Part | null {
    for (const p of this.sides[side].parts) {
      if (!p.alive || !p.active) continue;
      if (partDist(p, wx, wy) <= p.r + pad) return p;
    }
    return null;
  }
  partCenter(p: Part) {
    return { x: p.x, y: (p.y0 + p.y1) / 2 };
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
        if (this.isFlying(c)) {
          const p = s.parts.find((k) => k.kind === 'gargoyle')!;
          return { x: p.x + (s.setup.flip ? -50 : 50), y: p.y0 + 10 };
        }
        const p = this.roomCenter(side, c.room);
        return { x: p.x + (s.setup.flip ? -30 : 30), y: p.y - 40 };
      }
    }
    const cannon = s.ship.modules.find((m) => m.kind === 'cannon' && m.alive) ?? s.ship.modules[0];
    const tip = s.setup.flip ? cannon.x : cannon.x + cannon.w - 1;
    const p = this.cellCenter(side, tip, cannon.y);
    return { x: p.x + (s.setup.flip ? -CELL : CELL), y: p.y - 6 };
  }
  /** shot of a specific cannon module (weapon type) */
  cannonShot(side: number, moduleId: number): ShotDef {
    const s = this.sides[side];
    const idx = s.ship.modules.filter((m) => m.kind === 'cannon').findIndex((m) => m.id === moduleId);
    return s.setup.cannonShots?.[idx] ?? NEUTRAL_SHOT;
  }
  /** once-per-battle weapons already fired */
  usedOnce = new Set<string>();

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
    // the flying gargoyle's ship no longer fires
    if (this.boss?.flying && this.cfg.boss?.side === side) return [];
    return this.sides[side].ship.modules.filter((m) => {
      if (m.kind !== 'cannon' || !m.alive || m.disabled > 0) return false;
      // rooted/frozen cannons don't fire; starbreaker fires once
      const cells = this.sides[side].ship.moduleCells(m.id);
      if (cells.some((c) => c.status.rooted || c.status.frozen)) return false;
      if (this.cannonShot(side, m.id).id === 'starbreaker' && this.usedOnce.has(`${side}:${m.id}`)) return false;
      return true;
    });
  }

  /** fraction of the arc the shooter can preview (mast alive = long) */
  previewMul(side: number) {
    const mast = this.sides[side].ship.modules.find((m) => m.kind === 'mast');
    return (mast && !mast.alive ? 0.5 : 1) * p2PreviewMul(this, side);
  }

  isFlying(c: CatState) {
    return !!this.boss?.flying && this.cfg.boss?.captain === c.def.uid && c.side === this.cfg.boss.side;
  }

  // ---------- availability
  shooters(side: number) {
    const list = this.sides[side].cats.filter((c) => !c.ko && c.stunned <= 0 && c.cooldown <= 0);
    // phase 3 gargoyle: only the flying gargoyle acts
    if (this.boss?.flying && this.cfg.boss?.side === side) return list.filter((c) => this.isFlying(c));
    // TIME STOP (Tiempo ultimate): this side's cats skip the turn
    return p2Shooters(this, side, list);
  }
  canCannon(side: number) {
    return this.cannons(side).length > 0;
  }
  canUlt(c: CatState) {
    if (!c.def.ultimate || c.ko || c.stunned > 0) return false;
    const lim = c.def.ultimate.limits?.usesPerBattle;
    if (lim !== undefined && c.ultUsed >= lim) return false;
    const arc = this.sides[c.side].ship.modules.find((m) => m.kind === 'arcane' && !m.tag);
    if (arc && !arc.alive) return false;
    return c.ultCharge >= 1;
  }
  /** extra cat shots this turn (Gorrión turn 1, Bigotes Rotos phase 3) */
  extraShots(side: number) {
    if (this.boss && this.cfg.boss?.side === side && this.boss.id === 'sardina' && this.boss.phase === 3) return 1;
    if (this.turn === 1 && this.sides[side].setup.firstTurnDouble) return 1;
    return 0;
  }

  // ---------- turn flow
  /** Called at the beginning of `side`'s turn: status ticks on its own ship + boss/stage rules. */
  startTurn(side: 0 | 1): BattleEvent[] {
    this.active = side;
    const ev: BattleEvent[] = [...this.pending];
    this.pending = [];
    const s = this.sides[side];
    const ship = s.ship;
    p2StartTurn(this, side, ev);
    for (const m of ship.modules) if (m.disabled > 0) m.disabled--;
    s.rodUsed = false;
    // bubble regenerates at the start of its owner's turn
    if (s.bubbleKind && s.bubbleMax > 0 && this.bubbleSource(side) && s.bubble < s.bubbleMax) {
      s.bubble = s.bubbleMax;
      const c = this.shipCenter(side);
      ev.push({ k: 'bubble', side, what: 'up', x: c.x, y: c.y, path: -1, at: 0 });
    }
    if (s.breaches > 0) {
      s.flood = Math.min(1, s.flood + 0.09 * Math.min(4, s.breaches) * (s.setup.pump ? 0.5 : 1));
      ev.push({ k: 'flood', side, flood: s.flood, breaches: s.breaches });
    }
    let fed = false;
    for (const c of s.cats) {
      if (c.cooldown > 0) c.cooldown--;
      if (c.stunned > 0) c.stunned--;
      if (c.ko) continue;
      // Despensa de Pescaditos: +5% hp to every cat at the start of its turn
      if (s.setup.pantry && c.hp < c.maxHp) {
        c.hp = Math.min(c.maxHp, c.hp + Math.round(c.maxHp * 0.05));
        fed = true;
      }
      if (c.fx.burning > 0) {
        const dmg = Math.max(1, Math.round(c.maxHp * 0.08));
        c.hp -= dmg;
        if (c.hp <= 0) this.koOrRevive(c);
        ev.push({ k: 'cat', side, uid: c.def.uid, dmg, ko: c.ko, shield: false, element: 'fire', fx: { ...c.fx }, dot: true, path: -1, at: 0 });
      }
      for (const k of ['burning', 'shocked', 'wet', 'frozen'] as const) if (c.fx[k] > 0) c.fx[k]--;
    }
    if (fed) {
      const c = this.shipCenter(side);
      ev.push({ k: 'info', text: 'DESPENSA +5%', x: c.x, y: c.y - 160, color: 0x7ed957, path: -1, at: 0 });
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
    for (const c of toSpread) this.spreadFire(side, c, 1, ev);
    const chunks = ship.collapse();
    for (const ch of chunks) {
      ev.push({ k: 'chunk', side, cells: ch, path: -1, at: 0 });
      for (const c of ch) if (c.module !== undefined) this.reportModule(side, c.module, ev, -1, 0);
    }
    ev.push(...this.updateExposure(side));
    this.stageRulesAtStart(side, ev);
    this.bossAtStart(side, ev);
    this.checkVictory();
    ev.push(...this.updatePhase());
    return ev;
  }

  endTurn() {
    if (this.active === 1) {
      this.turn++;
      // sudden death (GDD 2.9.3): from turn 10 the storm floods both ships every round
      const sd = this.cfg.suddenDeath ?? 10;
      if (sd > 0 && this.turn >= sd && this.cfg.mode !== 'duel') {
        for (let i = 0; i < 2; i++) {
          const s = this.sides[i];
          s.flood = Math.min(1, s.flood + 0.16);
          this.pending.push({ k: 'flood', side: i, flood: s.flood, breaches: s.breaches });
        }
        if (!this.sdAnnounced) {
          this.sdAnnounced = true;
          this.pending.unshift({ k: 'boss', what: 'suddenDeath', side: 0, path: -1, at: 0 });
        }
        this.checkVictory();
      }
      const rt = this.cfg.rules?.retreat;
      if (rt && this.winner === null && this.turn > rt.turn) {
        this.winner = (1 - rt.side) as 0 | 1;
        this.reason = 'retreat';
      }
    }
    // wind drifts a little each turn
    this.wind = Math.max(-70, Math.min(70, Math.round(this.wind + this.rng.range(-12, 12))));
  }

  // ---------- stage & boss rules
  private stageRulesAtStart(side: 0 | 1, ev: BattleEvent[]) {
    const r = this.cfg.rules;
    if (!r) return;
    if (r.wetAll) {
      for (let i = 0; i < 2; i++) this.wetCells(i, this.sides[i].ship.cells(), ev);
    }
    if (r.wetDeck?.includes(side)) {
      const ship = this.sides[side].ship;
      const deck: Cell[] = [];
      for (let x = 0; x < ship.cols; x++) {
        for (let y = 0; y < ship.rows; y++) {
          const c = ship.get(x, y);
          if (c) {
            deck.push(c);
            break;
          }
        }
      }
      if (this.wetCells(side, deck, ev).length) {
        const c = this.shipCenter(side);
        ev.push({ k: 'boss', what: 'wetDeck', side, x: c.x, y: c.y - 120, path: -1, at: 0 });
      }
    }
    if (r.regrow?.includes(side)) {
      const ship = this.sides[side].ship;
      const dmg = ship.cells().filter((c) => c.hp < c.maxHp && !c.status.voided).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
      const heal = dmg.slice(0, 2);
      for (const c of heal) {
        const amount = Math.round(Math.min(c.maxHp - c.hp, c.maxHp * 0.5));
        c.hp += amount;
        ev.push({ k: 'heal', side, cell: c, amount });
      }
      if (heal.length) {
        const p = this.cellCenter(side, heal[0].x, heal[0].y);
        ev.push({ k: 'boss', what: 'regrow', side, x: p.x, y: p.y, path: -1, at: 0 });
      }
    }
  }

  private wetCells(side: number, cells: Cell[], ev: BattleEvent[]) {
    const out: Cell[] = [];
    for (const c of cells) {
      if (c.status.burning) delete c.status.burning;
      if (c.status.frozen) continue;
      if ((c.status.wet ?? 0) < 2) {
        c.status.wet = 2;
        out.push(c);
      }
    }
    if (out.length) ev.push({ k: 'status', side, cells: out, status: 'wet' });
    return out;
  }

  private bossAtStart(side: 0 | 1, ev: BattleEvent[]) {
    const B = this.boss;
    const cfg = this.cfg.boss;
    if (!B || !cfg) return;
    const bs = cfg.side;
    const S = this.sides[bs];
    // enrage
    if (!B.enraged && this.turn >= cfg.enrageTurn) {
      B.enraged = true;
      const c = this.shipCenter(bs);
      ev.push({ k: 'boss', what: 'enrage', side: bs, x: c.x, y: c.y, path: -1, at: 0 });
    }
    if (B.id === 'gargoyle') {
      // phase 2+: the sky purrs too — rain soaks the whole field every turn
      if (B.phase >= 2) {
        ev.push({ k: 'boss', what: 'rain', side: bs, path: -1, at: 0 });
        for (let i = 0; i < 2; i++) this.wetCells(i, this.sides[i].ship.cells(), ev);
      }
      if (side === bs) {
        const throat = S.ship.modules.find((m) => m.tag === 'throat');
        const cap = this.captain();
        if (throat?.alive && cap && !cap.ko) {
          B.purr++;
          const p = this.roomCenter(bs, throat.id);
          if (B.purr >= 3) {
            B.purr = 0;
            const healed = this.bossHeal(bs, 0.1, ev);
            ev.push({ k: 'boss', what: 'heal', side: bs, n: healed, x: p.x, y: p.y, path: -1, at: 0 });
          } else ev.push({ k: 'boss', what: 'purr', side: bs, n: B.purr, x: p.x, y: p.y, path: -1, at: 0 });
        }
        if (B.flying) {
          B.perch = (B.perch + 1) % 4;
          const pt = this.perchPoint(B.perch);
          const g = S.parts.find((p) => p.kind === 'gargoyle')!;
          g.x = pt.x;
          g.y0 = g.y1 = pt.y;
          ev.push({ k: 'boss', what: 'perch', side: bs, n: B.perch, x: pt.x, y: pt.y, path: -1, at: 0 });
        }
      }
    }
    if (B.id === 'kraken') {
      const eye = S.parts.find((p) => p.kind === 'eye');
      if (side === 0) {
        // player's turn: the beak opens on schedule
        if (eye && B.eyeIn <= 0) {
          B.eyeOpen = true;
          eye.active = true;
          ev.push({ k: 'boss', what: 'eyeOpen', side: bs, part: eye.id, x: eye.x, y: eye.y0, path: -1, at: 0 });
        }
      } else {
        if (eye && B.eyeOpen) {
          B.eyeOpen = false;
          eye.active = false;
          B.eyeIn = 3;
          ev.push({ k: 'boss', what: 'eyeClose', side: bs, part: eye.id, x: eye.x, y: eye.y0, path: -1, at: 0 });
        } else if (eye) {
          B.eyeIn--;
          if (B.eyeIn === 0) ev.push({ k: 'boss', what: 'eyeTell', side: bs, part: eye.id, x: eye.x, y: eye.y0, path: -1, at: 0 });
        }
        // phase 3: submerge every other turn (during the player's next turn)
        if (B.phase === 3) {
          const was = B.submerged;
          B.submerged = !was;
          const c = this.shipCenter(bs);
          ev.push({ k: 'boss', what: B.submerged ? 'submerge' : 'surface', side: bs, x: c.x, y: c.y, path: -1, at: 0 });
        }
        // tentacles grab modules (one catroom per turn at most)
        this.releaseGrabs(ev);
        if (B.dazed) {
          B.dazed = false;
        } else {
          const ps = this.sides[1 - bs];
          let roomTaken = false;
          const taken = new Set<number>();
          for (const t of S.parts) {
            if (t.kind !== 'tentacle' || !t.alive) continue;
            const pool = ps.ship.modules.filter((m) => m.alive && !taken.has(m.id) && ps.ship.moduleCells(m.id).length && (m.kind !== 'catroom' || !roomTaken) && (m.kind !== 'catroom' || ps.cats.some((c) => c.room === m.id && !c.ko)));
            if (!pool.length) continue;
            const pick = this.rng.weighted(pool, (m) => (m.kind === 'cannon' ? 4 : m.kind === 'catroom' ? 3 : m.kind === 'mast' ? 2 : m.kind === 'shield' ? 3 : 1));
            taken.add(pick.id);
            t.grab = pick.id;
            pick.disabled = Math.max(pick.disabled, 2);
            const pc = this.roomCenter(1 - bs, pick.id);
            ev.push({ k: 'boss', what: 'grab', side: 1 - bs, part: t.id, module: pick.id, x: pc.x, y: pc.y, path: -1, at: 0 });
            // squeeze: crush the grabbed cells a bit
            for (const c of ps.ship.moduleCells(pick.id)) {
              const dmg = Math.round(c.maxHp * 0.12 * (B.enraged ? ENRAGE_MUL : 1));
              c.hp -= dmg;
              const destroyed = c.hp <= 0;
              if (destroyed) {
                ps.ship.destroyCell(c.x, c.y);
                this.reportModule(1 - bs, pick.id, ev, -1, 0);
              }
              ev.push({ k: 'cell', side: 1 - bs, cell: c, dmg, destroyed, path: -1, at: 0 });
            }
            if (pick.kind === 'catroom') {
              roomTaken = true;
              const cat = ps.cats.find((c) => c.room === pick.id && !c.ko);
              if (cat) {
                cat.stunned = Math.max(cat.stunned, 2);
                const dmg = Math.round(cat.maxHp * 0.1);
                cat.hp -= dmg;
                cat.fx.wet = 2;
                cat.fx.burning = 0;
                if (cat.hp <= 0) this.koOrRevive(cat);
                ev.push({ k: 'boss', what: 'throw', side: 1 - bs, part: t.id, uid: cat.def.uid, x: pc.x, y: pc.y, path: -1, at: 0 });
                ev.push({ k: 'cat', side: 1 - bs, uid: cat.def.uid, dmg, ko: cat.ko, shield: false, element: 'water', fx: { ...cat.fx }, stunned: true, path: -1, at: 0 });
              }
            }
          }
          const chunks = ps.ship.collapse();
          for (const ch of chunks) {
            ev.push({ k: 'chunk', side: 1 - bs, cells: ch, path: -1, at: 0 });
            for (const c of ch) if (c.module !== undefined) this.reportModule(1 - bs, c.module, ev, -1, 0);
          }
          ev.push(...this.updateExposure(1 - bs));
        }
      }
    }
  }

  private releaseGrabs(ev: BattleEvent[]) {
    const bs = this.cfg.boss!.side;
    for (const t of this.sides[bs].parts) {
      if (t.grab === null) continue;
      ev.push({ k: 'boss', what: 'release', side: 1 - bs, part: t.id, module: t.grab, path: -1, at: 0 });
      t.grab = null;
    }
  }

  /** heal `frac` of the initial structure into damaged cells + the captain */
  private bossHeal(side: number, frac: number, ev: BattleEvent[]) {
    const s = this.sides[side];
    let budget = Math.round((s.ship.initialMax?.[0] ?? 0) * frac);
    const total = budget;
    const cells = s.ship.cells().filter((c) => c.hp < c.maxHp && !c.status.voided).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
    for (const c of cells) {
      if (budget <= 0) break;
      const amount = Math.min(budget, c.maxHp - c.hp);
      c.hp += amount;
      budget -= amount;
      ev.push({ k: 'heal', side, cell: c, amount });
    }
    const cap = this.captain();
    if (cap && !cap.ko) {
      const h = Math.round(cap.maxHp * frac);
      cap.hp = Math.min(cap.maxHp, cap.hp + h);
      const g = s.parts.find((p) => p.kind === 'gargoyle');
      if (g) g.hp = cap.hp;
    }
    return total - budget;
  }

  /** boss phase from damage taken (1/3 and 2/3 of the way to victory) */
  updatePhase(): BattleEvent[] {
    const B = this.boss;
    const cfg = this.cfg.boss;
    if (!B || !cfg || this.winner !== null) return [];
    const bs = cfg.side;
    const dmgFrac = (1 - this.hullPct(bs)) / (1 - SINK_AT);
    const core = this.sides[bs].ship.modules.find((m) => m.kind === 'core');
    const coreFrac = core ? 1 - this.sides[bs].ship.moduleCells(core.id).length / (core.w * core.h) : 0;
    const crew = this.sides[bs].cats;
    const crewFrac = crew.length ? crew.reduce((a, c) => a + (1 - Math.max(0, c.hp) / c.maxHp), 0) / crew.length : 0;
    const f = Math.max(dmgFrac, coreFrac * 1.5, crewFrac);
    const target = (f >= 0.67 ? 3 : f >= 0.34 ? 2 : 1) as 1 | 2 | 3;
    if (target <= B.phase) return [];
    const ev: BattleEvent[] = [];
    for (let n = B.phase + 1; n <= target; n++) {
      B.phase = n as 1 | 2 | 3;
      ev.push({ k: 'phase', n });
      this.enterPhase(n, ev);
    }
    return ev;
  }

  /** dev/testing: jump the boss to a phase (BattleScene.devPhase) */
  forcePhase(n: 1 | 2 | 3): BattleEvent[] {
    const B = this.boss;
    if (!B || n <= B.phase) return [];
    const ev: BattleEvent[] = [];
    for (let k = B.phase + 1; k <= n; k++) {
      B.phase = k as 1 | 2 | 3;
      ev.push({ k: 'phase', n: k });
      this.enterPhase(k, ev);
    }
    return ev;
  }

  private enterPhase(n: number, ev: BattleEvent[]) {
    const B = this.boss!;
    const bs = this.cfg.boss!.side;
    const S = this.sides[bs];
    if (B.id === 'kraken' && n === 2) {
      const gen = S.ship.modules.find((m) => m.tag === 'static');
      if (gen?.alive) {
        S.bubbleKind = 'static';
        S.bubbleMax = 1;
        S.bubble = 1;
        const c = this.shipCenter(bs);
        ev.push({ k: 'boss', what: 'staticUp', side: bs, x: c.x, y: c.y, path: -1, at: 0 });
        ev.push({ k: 'bubble', side: bs, what: 'up', x: c.x, y: c.y, path: -1, at: 0 });
      }
    }
    if (B.id === 'gargoyle' && n === 2) {
      ev.push({ k: 'boss', what: 'rain', side: bs, path: -1, at: 0 });
      for (let i = 0; i < 2; i++) this.wetCells(i, this.sides[i].ship.cells(), ev);
    }
    if (B.id === 'gargoyle' && n === 3) {
      const cap = this.captain();
      if (cap && !cap.ko) {
        B.flying = true;
        B.perch = 0;
        const g = S.parts.find((p) => p.kind === 'gargoyle')!;
        const pt = this.perchPoint(0);
        g.x = pt.x;
        g.y0 = g.y1 = pt.y;
        g.active = true;
        g.hp = cap.hp;
        g.maxHp = cap.maxHp;
        cap.exposed = false;
        cap.stunned = 0;
        cap.cooldown = 0;
        ev.push({ k: 'boss', what: 'fly', side: bs, uid: cap.def.uid, x: pt.x, y: pt.y, path: -1, at: 0 });
      }
    }
  }

  private bubbleSource(side: number) {
    const s = this.sides[side];
    if (s.bubbleKind === 'static') return s.ship.modules.some((m) => m.tag === 'static' && m.alive);
    return s.ship.modules.some((m) => m.kind === 'shield' && !m.tag && m.alive);
  }

  private shipCenter(side: number) {
    const s = this.sides[side];
    return { x: s.setup.origin.x + (s.ship.cols * CELL) / 2, y: s.setup.origin.y + (s.ship.rows * CELL) / 2 };
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
    if (shooter === 'cannon' && cannonId !== undefined) {
      shot = this.cannonShot(side, cannonId);
      const powder = s.ship.modules.some((m) => m.kind === 'powder' && m.alive);
      atk = s.setup.cannonAtk * (powder ? 1.25 : 1);
      if (shot.id === 'starbreaker') this.usedOnce.add(`${side}:${cannonId}`);
    }
    if (shooter !== 'cannon') {
      cat = s.cats.find((c) => c.def.uid === shooter);
      if (cat) {
        shot = ult && cat.def.ultimate ? cat.def.ultimate : cat.def.shot;
        atk = cat.def.atk * (1 + cat.rage * 0.5);
      }
    }
    if (this.boss?.enraged && this.cfg.boss?.side === side) atk *= ENRAGE_MUL;
    const origin = cannonId !== undefined ? this.cannonMuzzle(side, cannonId) : this.muzzle(side, cat?.def.uid);
    p2BeginFire(this);
    // INESTABLE (limitation): the shot wobbles a little, for whoever owns the cat
    if (cat?.def.limitation === 'unstable') angle += this.rng.range(-0.06, 0.06);
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
      cat.cooldown = (cat.def.reload ?? 1) + 1;
      if (ult) {
        cat.ultUsed++;
        cat.ultCharge = 0;
      } else cat.ultCharge = Math.min(1, cat.ultCharge + 0.25 * this.meterMul(side));
    }
    if (isGust(shot)) {
      // CORRIENTE: the next enemy projectile drifts (an Ancla ignores it)
      if (!this.sides[1 - side].setup.anchor) this.sides[1 - side].windNext = side === 0 ? 90 : -90;
      const last = paths[0].points[paths[0].impacts.length ? paths[0].impacts[paths[0].impacts.length - 1] : paths[0].points.length - 1];
      events.push({ k: 'info', text: 'CORRIENTE', x: last.x, y: last.y - 40, color: 0xc6f0e4, path: 0, at: paths[0].points.length - 1 });
    }
    for (let i = 0; i < 2; i++) events.push(...this.updateExposure(i));
    this.checkVictory();
    events.push(...this.updatePhase());
    return { paths, events, shot, atk };
  }

  // ---------- trajectories
  buildPaths(shot: ShotDef, o: PathPoint, angle: number, power: number, wind: number, side: number): ShotPath[] {
    const n = shot.trajectory === 'spread' ? shot.projectiles ?? 3 : shot.trajectory === 'ray' ? Math.max(1, shot.projectiles ?? 1) : 1;
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
        const sub = this.integrate({ ...shot, trajectory: 'ballistic' }, ap, Math.atan2(30 + i * 25, vx), Math.abs(vx) * (0.7 + i * 0.12), wind, side);
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
    const p2 = p2Flight(traj);
    const g = GRAVITY * (shot.gravityScale ?? (p2 ? p2.g : traj === 'beam' ? 0.15 : traj === 'heavy' ? 1.6 : traj === 'orb' ? 0.5 : traj === 'gust' ? 0.1 : 1));
    const windK = shot.windScale ?? (p2 ? p2.wind : traj === 'beam' || traj === 'phase' ? 0.2 : traj === 'heavy' ? 0.5 : traj === 'gust' ? 0 : 1);
    const speed = power * (p2 ? p2.speed : traj === 'beam' ? 1.7 : traj === 'orb' ? 0.85 : traj === 'gust' ? 1.5 : 1);
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    let x = o.x;
    let y = o.y;
    const pts: PathPoint[] = [{ x, y }];
    const impacts: number[] = [];
    let pierceLeft = shot.pierce ?? (p2 ? p2.pierce : traj === 'heavy' ? 2 : traj === 'phase' ? 6 : 0);
    let bounced = traj !== 'bounce';
    let torpedo = false;
    const pierced = new Set<Cell>();
    const enemy = 1 - side;
    const homingTarget = traj === 'homing' ? this.homingTarget(enemy) : null;
    const hasParts = this.sides[enemy].parts.length > 0;
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
        // boss parts (tentacles, open eye, flying gargoyle) stop the projectile
        if (hasParts && this.partAt(x, y, enemy)) {
          pts.push({ x, y });
          impacts.push(pts.length - 1);
          return { points: pts, element: shot.element, kind: traj, impacts };
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
    const hitPart = this.partAt(x, y, 1 - attSide, 2);
    const targetSide = hit ? hit.side : hitPart ? hitPart.side : x > 960 ? 1 : 0;
    const s = this.sides[targetSide];
    const p2f = p2Flight(shot.trajectory);
    const isPierce = !final && (shot.trajectory === 'heavy' || shot.trajectory === 'phase' || !!p2f);
    const isBounceFirst = !final && shot.trajectory === 'bounce';
    const radius = isPierce ? 20 : isBounceFirst ? 36 : shot.radius;
    let base = atk * shot.power * (isBounceFirst ? 0.35 : isPierce ? shot.pierceMul ?? (p2f ? p2f.pierceMul : shot.trajectory === 'phase' ? 2.2 : 0.9) : 1);
    const crit = !isPierce && this.rng.chance(0.1);
    if (crit) base *= 1.5;
    const foe = attSide !== targetSide;
    const B = this.boss;
    const bossSide = this.cfg.boss?.side;
    // kraken under water: only ⚡ (conducts) and torpedoes 💧 reach it
    if (foe && B?.submerged && targetSide === bossSide && !(shot.element === 'electric' || shot.trajectory === 'torpedo')) {
      ev.push({ k: 'info', text: '¡GLUB! SUMERGIDO', x, y: y - 30, color: 0x7fd8ff, path, at });
      ev.push({ k: 'splash', x, y: this.waterY, path, at });
      ev.push({ k: 'impact', x, y, side: targetSide, radius: 20, element: shot.element, crit: false, path, at, total: 0 });
      return;
    }
    // lightning rod: eats the first ⚡ of the turn
    if (foe && shot.element === 'electric' && this.cfg.rules?.rod?.includes(targetSide) && !s.rodUsed) {
      const mast = s.ship.modules.find((m) => m.kind === 'mast' && m.alive);
      if (mast) {
        s.rodUsed = true;
        const p = this.roomCenter(targetSide, mast.id);
        ev.push({ k: 'reaction', name: '¡PARARRAYOS!', x: p.x, y: p.y - 60, mult: 0, path, at });
        ev.push({ k: 'impact', x: p.x, y: p.y - 80, side: targetSide, radius: 30, element: shot.element, crit: false, path, at, total: 0 });
        return;
      }
    }
    // bubble shields: nullify one full impact per turn; ⚡ rayo overloads and pops them
    if (foe && s.bubble > 0 && s.bubbleKind && this.bubbleSource(targetSide)) {
      if (isRayo(shot) || shot.element === 'void') {
        s.bubble = 0;
        ev.push({ k: 'bubble', side: targetSide, what: 'break', x, y, path, at });
        ev.push({ k: 'reaction', name: shot.element === 'void' ? 'DEVORAR' : 'SOBRECARGA', x, y, mult: 1, path, at });
      } else {
        s.bubble--;
        ev.push({ k: 'bubble', side: targetSide, what: s.bubble > 0 ? 'block' : 'down', x, y, path, at });
        ev.push({ k: 'impact', x, y, side: targetSide, radius: 24, element: shot.element, crit: false, path, at, total: 0 });
        return;
      }
    }
    // legacy absorbing shield
    if (s.shieldHp > 0 && foe) {
      const shieldMod = s.ship.modules.find((m) => m.kind === 'shield' && !m.tag);
      if (shieldMod?.alive) {
        const absorbMul = shot.element === 'magic' ? 2 : 1;
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
    let reactionDone = false;
    // boss parts in the blast
    for (const p of s.parts) {
      if (!foe || !p.alive || !p.active) continue;
      const d = partDist(p, x, y);
      if (d > radius + p.r) continue;
      const fall = Math.max(0.35, 1 - Math.max(0, d - p.r) / Math.max(1, radius));
      const mult = clampMul((MAT_RESIST[p.material]?.[shot.element] ?? 1) * (shot.structMul ?? 1));
      if (p.kind === 'eye') {
        // weak point: the blow goes straight to the heart (x2) and dazes the kraken
        const core = s.ship.modules.find((m) => m.kind === 'core' && m.alive);
        const dmg = Math.round(base * 2 * DMG_K);
        ev.push({ k: 'boss', what: 'weak', side: targetSide, part: p.id, x: p.x, y: p.y0, path, at });
        if (core) {
          const cells = s.ship.moduleCells(core.id);
          for (const c of cells) {
            const dd = Math.round(dmg / cells.length);
            c.hp -= dd;
            total += dd;
            const destroyed = c.hp <= 0;
            if (destroyed) {
              s.ship.destroyCell(c.x, c.y);
              this.reportModule(targetSide, core.id, ev, path, at);
            }
            ev.push({ k: 'cell', side: targetSide, cell: c, dmg: dd, destroyed, path, at });
          }
        }
        if (B) B.dazed = true;
        const cap = this.captain();
        if (cap && !cap.ko) cap.stunned = Math.max(cap.stunned, 2);
        continue;
      }
      if (p.kind === 'gargoyle') {
        const cap = this.captain();
        if (cap && !cap.ko) {
          const dmg = Math.round(base * fall * Math.max(0.6, (shot.catMul ?? 0.5) * 1.6) * CAT_K * mult);
          this.hitCat(cap, dmg, ev, path, at, shot.element, true);
          p.hp = Math.max(0, cap.hp);
          total += dmg;
          ev.push({ k: 'part', side: targetSide, id: p.id, dmg, destroyed: cap.ko, path, at });
          if (cap.ko) p.alive = false;
        }
        continue;
      }
      const dmg = Math.max(1, Math.round(base * fall * mult * DMG_K * (s.setup.armor ?? 1)));
      p.hp -= dmg;
      total += dmg;
      const destroyed = p.hp <= 0;
      if (destroyed) {
        p.alive = false;
        if (p.grab !== null) {
          const mod = this.sides[1 - targetSide].ship.modules[p.grab];
          if (mod) mod.disabled = 0;
          ev.push({ k: 'boss', what: 'release', side: 1 - targetSide, part: p.id, module: p.grab, path, at });
          p.grab = null;
        }
      }
      ev.push({ k: 'part', side: targetSide, id: p.id, dmg, destroyed, path, at });
    }
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
    let throatHit = false;
    let skinShown = false;
    const shards: { side: number; c: Cell; dmg: number }[] = [];
    for (const a of affected) {
      const fall = Math.max(0.3, Math.pow(1 - Math.min(1, a.d / (radius + CELL * 0.35)), 0.55));
      let mult = (MAT_RESIST[a.c.material]?.[shot.element] ?? 1) * (shot.structMul ?? 1);
      // --- elemental reactions
      const st = a.c.status;
      const r = this.react(shot, a.c, a.side, ev, path, at, x, y, reactionDone);
      if (r.name) reactionDone = true;
      mult *= r.mult;
      if (st.cursed) mult *= 1.5;
      if (st.charged && isRayo(shot)) mult *= 1.25;
      mult = clampMul(mult);
      // Gárgola: stone skin halves everything except Tierra and Estallido
      if (B?.id === 'gargoyle' && a.side === bossSide && a.c.material === 'stone' && shot.element !== 'earth' && r.name !== 'ESTALLIDO') {
        mult *= 0.5;
        if (!skinShown && a.side !== attSide) {
          skinShown = true;
          ev.push({ k: 'info', text: 'PIEL DE PIEDRA x0.5', x, y: y - 40, color: 0xc4bdab, path, at });
        }
      }
      if (a.side !== attSide) mult *= this.sides[a.side].setup.armor ?? 1;
      const dmg = Math.max(1, Math.round(base * fall * mult * DMG_K));
      a.c.hp -= dmg;
      total += dmg;
      const destroyed = a.c.hp <= 0;
      if (r.name === 'ESTALLIDO') shards.push({ side: a.side, c: a.c, dmg: Math.round(dmg * 0.5) });
      if (r.name === 'AVIVAR') this.spreadFire(a.side, a.c, 2, ev);
      // statuses from the shot
      if (!destroyed) this.applyShotStatuses(shot, a.c);
      if (a.c.module !== undefined && a.side !== attSide && this.sides[a.side].ship.modules[a.c.module]?.tag === 'throat') throatHit = true;
      if (destroyed) {
        const mid = a.c.module;
        this.sides[a.side].ship.destroyCell(a.c.x, a.c.y);
        if (mid !== undefined) this.reportModule(a.side, mid, ev, path, at);
      } else if (isRayo(shot) && a.c.material === 'iron' && a.c.module !== undefined) {
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
      if (destroyed && (shot.element === 'water' || shot.element === 'earth') && this.cellCenter(a.side, a.c.x, a.c.y).y > this.waterY - CELL * 0.3) {
        this.sides[a.side].breaches++;
        if (!reactionDone) {
          ev.push({ k: 'reaction', name: 'BRECHA', x, y, mult: 1, path, at });
          reactionDone = true;
        }
      }
      if (a.d < radius) {
        const frozenBreak = r.name === 'ESTALLIDO' ? 1.5 : 1;
        this.damageCatsInCell(a.side, a.c, Math.round(base * fall * (shot.catMul ?? 0.5) * CAT_K * frozenBreak), ev, path, at, shot.element, isGust(shot), r.name === 'VENTISCA');
      }
    }
    // Estallido: ice shards (x0.5) into the 4 neighbours
    for (const sh of shards) {
      const ship = this.sides[sh.side].ship;
      for (const [dx, dy] of DIRS) {
        const n = ship.get(sh.c.x + dx, sh.c.y + dy);
        if (!n) continue;
        n.hp -= sh.dmg;
        total += sh.dmg;
        const destroyed = n.hp <= 0;
        if (destroyed) {
          const mid = n.module;
          ship.destroyCell(n.x, n.y);
          if (mid !== undefined) this.reportModule(sh.side, mid, ev, path, at);
        }
        ev.push({ k: 'cell', side: sh.side, cell: n, dmg: sh.dmg, destroyed, path, at });
      }
    }
    // gargoyle throat: interrupts the purr and stuns her
    if (throatHit && B?.id === 'gargoyle') {
      const cap = this.captain();
      if (B.purr > 0 || (cap && !cap.ko && cap.stunned <= 0)) {
        B.purr = 0;
        if (cap && !cap.ko) cap.stunned = Math.max(cap.stunned, 2);
        const throat = s.ship.modules.find((m) => m.tag === 'throat')!;
        const p = this.roomCenter(targetSide, throat.id);
        ev.push({ k: 'boss', what: 'purrStop', side: targetSide, x: p.x, y: p.y, path, at });
      }
    }
    // conduction chain (wet + rayo)
    if (isRayo(shot)) this.conduct(targetSide, x, y, base, ev, path, at, attSide);
    // Parte 2: blind, backstab, sound through cabins, rewind / time stop, erase
    p2Impact(this, { attSide, targetSide, shot, base, x, y, radius, final, total, path, at, catK: CAT_K, hitCat: (c, d, e, p, a, el, direct, chained) => this.hitCat(c, d, e, p, a, el, direct, chained) }, ev);
    ev.push({ k: 'impact', x, y, side: targetSide, radius, element: shot.element, crit, path, at, total });
    for (let side = 0; side < 2; side++) {
      const chunks = this.sides[side].ship.collapse();
      for (const ch of chunks) {
        ev.push({ k: 'chunk', side, cells: ch, path, at });
        for (const c of ch) if (c.module !== undefined) this.reportModule(side, c.module, ev, path, at);
      }
    }
    // a destroyed static generator drops the Kraken bubble for good
    if (s.bubbleKind === 'static' && !this.bubbleSource(targetSide) && s.bubble > 0) {
      s.bubble = 0;
      ev.push({ k: 'bubble', side: targetSide, what: 'break', x, y, path, at });
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

  private spreadFire(side: number, from: Cell, n: number, ev: BattleEvent[]) {
    const ship = this.sides[side].ship;
    for (let i = 0; i < n; i++) {
      const ns = DIRS.map(([dx, dy]) => ship.get(from.x + dx, from.y + dy)).filter((c): c is Cell => !!c && FLAMMABLE.has(c.material) && !c.status.burning && !c.status.wet);
      if (!ns.length) return;
      const c = this.rng.pick(ns);
      c.status.burning = 2;
      ev.push({ k: 'spread', side, cell: c, status: 'burning' });
    }
  }

  private react(shot: ShotDef, c: Cell, side: number, ev: BattleEvent[], path: number, at: number, x: number, y: number, done: boolean) {
    const st = c.status;
    const el = shot.element;
    let name = '';
    let mult = 1;
    const p2r = p2React(this, shot, c);
    if (p2r) {
      name = p2r.name;
      mult = p2r.mult;
    } else if (el === 'fire' && st.wet) {
      delete st.wet;
      st.steam = 2;
      name = 'VAPOR';
      mult = 0.8;
    } else if (el === 'fire' && st.rooted) {
      // fire burns the vines away
      delete st.rooted;
      name = 'QUEMA';
    } else if (el === 'water' && st.burning) {
      delete st.burning;
      st.steam = 2;
      name = 'VAPOR';
    } else if (el === 'ice' && st.wet) {
      delete st.wet;
      st.frozen = 3;
      name = 'MAR HELADO';
      mult = 1.2;
    } else if ((el === 'earth' || el === 'neutral' || shot.trajectory === 'heavy') && st.frozen) {
      delete st.frozen;
      name = 'ESTALLIDO';
      mult = 2;
    } else if (isGust(shot) && st.wet) {
      delete st.wet;
      st.frozen = 2;
      name = 'VENTISCA';
    } else if ((el === 'wind' || isGust(shot)) && st.burning) {
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
    if (name && !done && name !== 'QUEMA') ev.push({ k: 'reaction', name, x, y, mult, path, at });
    return { name, mult };
  }

  private applyShotStatuses(shot: ShotDef, c: Cell) {
    for (const s of shot.statuses ?? []) {
      if (s.id === 'burning' && (!FLAMMABLE.has(c.material) || c.status.wet)) continue;
      if (s.id === 'burning' && c.status.steam) continue;
      if (s.id === 'wet' && c.status.frozen) continue;
      if (s.id === 'wet' && c.status.burning) delete c.status.burning;
      c.status[s.id] = Math.max(c.status[s.id] ?? 0, s.turns);
    }
    if (isRayo(shot) && !c.status.wet) c.status.charged = Math.max(c.status.charged ?? 0, 1);
  }

  private conduct(side: number, x: number, y: number, base: number, ev: BattleEvent[], path: number, at: number, attSide: number) {
    const ship = this.sides[side].ship;
    const g = this.toGrid(side, x, y);
    // find the nearest wet cell to start
    const wet = ship.cells().filter((c) => c.status.wet);
    if (!wet.length) return;
    wet.sort((a, b) => Math.hypot(a.x - g.x, a.y - g.y) - Math.hypot(b.x - g.x, b.y - g.y));
    const start = wet[0];
    if (Math.hypot(start.x - g.x, start.y - g.y) > 4) return;
    // GDD: max 6 jumps (+2 with Tronador on board)
    const tronador = this.sides[attSide].cats.some((c) => !c.ko && c.def.catId === 'l_tronador');
    const maxJumps = 6 + (tronador ? 2 : 0) + (this.sides[attSide].setup.conductionBonus ?? 0);
    const seen = new Set<Cell>([start]);
    const q = [start];
    const chain: Cell[] = [];
    while (q.length && chain.length < maxJumps) {
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
    const stunned = new Set<CatState>();
    for (const c of chain) {
      const dmg = Math.round(base * 0.5 * 1.5 * (this.sides[side].setup.armor ?? 1));
      c.hp -= dmg;
      delete c.status.wet;
      c.status.charged = 1;
      const destroyed = c.hp <= 0;
      const mid = c.module;
      if (destroyed) {
        ship.destroyCell(c.x, c.y);
        if (mid !== undefined) this.reportModule(side, mid, ev, path, at);
      }
      ev.push({ k: 'cell', side, cell: c, dmg, destroyed, path, at });
      // stun cats in chained rooms (storm cats are immune to the stun)
      if (mid !== undefined) {
        const cat = this.sides[side].cats.find((k) => k.room === mid && !k.ko);
        if (cat && !stunned.has(cat)) {
          stunned.add(cat);
          if (!cat.def.elements.includes('electric')) cat.stunned = Math.max(cat.stunned, 2);
          this.hitCat(cat, Math.round(base * 0.25), ev, path, at, 'electric', false, true);
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
      // GDD: radius 3, 80 internal damage with linear falloff (+ burning)
      const dmg = Math.round(80 * this.powderMul * (1 - d / 4));
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

  private damageCatsInCell(side: number, cell: Cell, dmg: number, ev: BattleEvent[], path: number, at: number, el: ElementId = 'neutral', gust = false, freeze = false) {
    if (dmg <= 0 || cell.module === undefined) {
      // exposed cats can be hit through destroyed rooms: check by position
      const exposed = this.sides[side].cats.filter((c) => c.exposed && !c.ko && !this.isFlying(c));
      for (const c of exposed) {
        const m = this.sides[side].ship.modules[c.room];
        if (cell.x >= m.x - 1 && cell.x <= m.x + m.w && cell.y >= m.y - 1 && cell.y <= m.y + m.h) {
          // ráfaga: an exposed cat gets blown into the sea (loses a turn, swims back)
          if (gust && !c.overboard && !this.sides[side].setup.anchor) {
            c.stunned = Math.max(c.stunned, 2);
            c.fx.wet = 2;
            c.fx.burning = 0;
            const p = this.roomCenter(side, c.room);
            ev.push({ k: 'info', text: '¡AL AGUA!', x: p.x, y: p.y - 80, color: 0x7fd8ff, path, at });
          }
          this.hitCat(c, dmg, ev, path, at, el);
        }
      }
      return;
    }
    const cat = this.sides[side].cats.find((c) => c.room === cell.module && !c.ko && !this.isFlying(c));
    if (!cat) return;
    if (freeze && cat.fx.frozen <= 0) {
      // Ventisca: the cat in the frozen cabin turns into an ice block (💧 cats resist 50%)
      if (!(cat.def.elements[0] === 'water' && this.rng.chance(0.5))) {
        cat.fx.frozen = 2;
        cat.fx.burning = 0;
        cat.stunned = Math.max(cat.stunned, 2);
      }
    }
    this.hitCat(cat, dmg, ev, path, at, el);
  }

  hitCat(c: CatState, dmg: number, ev: BattleEvent[], path: number, at: number, el: ElementId = 'neutral', direct = false, chained = false) {
    if (c.ko || dmg <= 0) return;
    // Parte 2: fire cracks a frozen cat (×1.5), the void eats its shields / spare life
    const p2m = p2PreHitCat(c, el);
    if (c.shields > 0) {
      c.shields--;
      ev.push({ k: 'cat', side: c.side, uid: c.def.uid, dmg: 0, ko: false, shield: true, element: el, fx: { ...c.fx }, path, at });
      return;
    }
    const aff = el === 'neutral' ? 1 : affinity(el, c.def.elements[0]);
    let stunned = false;
    // frozen cat + earth / cannon: the ice shatters (x1.5)
    let iceBreak = 1;
    if (c.fx.frozen > 0 && (el === 'earth' || el === 'neutral')) {
      iceBreak = 1.5;
      c.fx.frozen = 0;
    }
    // elemental status on the cat itself
    if (el === 'fire') {
      if (c.fx.wet > 0) c.fx.wet = 0;
      else if (!c.def.elements.includes('fire')) c.fx.burning = 2;
    } else if (el === 'water') {
      c.fx.burning = 0;
      c.fx.wet = 2;
    } else if (el === 'electric') {
      // Electrocutado: -10 meter; wet → stunned (storm cats are immune to the stun)
      c.fx.shocked = 1;
      c.ultCharge = Math.max(0, c.ultCharge - 0.1);
      if (c.fx.wet > 0 && !c.def.elements.includes('electric')) {
        c.stunned = Math.max(c.stunned, 2);
        stunned = true;
      }
    } else if (el === 'ice') {
      // ice cats don't freeze (Parte 2); water cats resist 50%
      if (!c.def.elements.includes('ice') && !(c.def.elements[0] === 'water' && this.rng.chance(0.5))) {
        c.fx.frozen = 2;
        c.stunned = Math.max(c.stunned, 2);
      }
      c.fx.burning = 0;
    }
    if (chained && !c.def.elements.includes('electric')) stunned = true;
    // Parte 2: a sound wave stuns (then the cat is SORDO for a while)
    if (p2PostHitCat(this, c, el, 1 - c.side)) stunned = true;
    const real = Math.round(dmg * aff * iceBreak * p2m * (c.exposed && !direct ? 1.5 : 1) * (c.def.limitation === 'glass' ? 3 : 1));
    c.hp -= real;
    c.ultCharge = Math.min(1, c.ultCharge + 0.15 * this.meterMul(c.side));
    const revived = c.hp <= 0 ? this.koOrRevive(c) : false;
    ev.push({ k: 'cat', side: c.side, uid: c.def.uid, dmg: real, ko: c.ko, shield: false, revived, element: el, fx: { ...c.fx }, aff: aff !== 1 ? aff : undefined, stunned: stunned || undefined, path, at });
  }

  /** ultimate meter gain multiplier: without a Summoning Room ults effectively cost 125 */
  meterMul(side: number) {
    const arc = this.sides[side].ship.modules.find((m) => m.kind === 'arcane' && !m.tag);
    return arc && arc.alive ? 1 : 0.8;
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
    for (const ally of this.sides[c.side].cats) {
      if (ally.ko) continue;
      if (ally.def.limitation === 'berserk') ally.rage++;
      ally.ultCharge = Math.min(1, ally.ultCharge + 0.1);
    }
    return false;
  }

  private updateExposure(side: number): BattleEvent[] {
    const ev: BattleEvent[] = [];
    const s = this.sides[side];
    for (const c of s.cats) {
      if (this.isFlying(c)) continue;
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
    const lost: (VictoryReason | null)[] = [null, null];
    for (let side = 0; side < 2; side++) {
      const s = this.sides[side];
      const core = s.ship.modules.find((m) => m.kind === 'core');
      const duel = this.cfg.mode === 'duel';
      if (!duel && core && !core.alive) lost[side] = 'core';
      else if (s.cats.length && s.cats.every((c) => c.ko)) lost[side] = 'crew';
      else if (!duel && (s.ship.integrity() < SINK_AT || s.flood >= 1)) lost[side] = 'sunk';
      // the flying gargoyle falls: her crew surrenders
      if (!lost[side] && this.cfg.boss?.side === side && this.boss?.flying && this.captain()?.ko) lost[side] = 'crew';
    }
    if (!lost[0] && !lost[1]) return;
    let loser = lost[0] ? 0 : 1;
    // both at once (sudden death): the more damaged structure loses (tie → the side that just acted wins)
    if (lost[0] && lost[1]) {
      const a = this.hullPct(0);
      const b = this.hullPct(1);
      loser = Math.abs(a - b) < 1e-6 ? 1 - this.active : a < b ? 0 : 1;
    }
    this.winner = (1 - loser) as 0 | 1;
    this.reason = lost[loser];
  }

  /** Quick integrity estimate for HUD */
  hullPct(side: number) {
    return Math.max(0, Math.min(1, this.sides[side].ship.integrity()));
  }
  /** HUD hull bar: empty exactly when the ship sinks (integrity 28% or fully flooded) */
  hullBar(side: number) {
    const s = this.sides[side];
    const hull = (s.ship.integrity() - SINK_AT) / (1 - SINK_AT);
    return Math.max(0, Math.min(1, hull, 1 - (s.flood ?? 0)));
  }
}

function partDist(p: Part, x: number, y: number) {
  const lo = Math.min(p.y0, p.y1);
  const hi = Math.max(p.y0, p.y1);
  const cy = Math.max(lo, Math.min(hi, y));
  return Math.hypot(x - p.x, y - cy);
}

/** combined multiplier (material × statuses) bounded to [0.5, 3] (GDD 2.4) */
function clampMul(m: number) {
  return Math.max(0.5, Math.min(3, m));
}
