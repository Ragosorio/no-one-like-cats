/**
 * GameState + core systems: resources, green timers (+Ronroneo), momentum, kingdom XP,
 * save/load with offline progress, and an event bus for UI/juice.
 * Domain logic lives in state/sys/*.ts and registers timer handlers here.
 */
import { Emitter } from '../core/events';
import { readSave, writeSave, wipeSave } from '../core/save';
import {
  BAL,
  FamilyId,
  MomentumEvent,
  PurrAction,
  XpAction,
  RarityId,
  momentumAdd,
  momentumDecay,
  purrMinutes,
  purrPoolCapMin,
  xpFrac,
  xpPct,
} from './econ';

export const SAVE_VERSION = 1;

export type TimerKind = 'build' | 'habitat_upgrade' | 'farm_upgrade' | 'crop' | 'resonance' | 'yard' | 'expansion' | 'repair';

export interface Timer {
  id: string;
  kind: TimerKind;
  ref: string;
  totalMs: number;
  leftMs: number;
  label: string;
  /** affinity source family for Ronroneo bonus */
  affinity: 'combat' | 'harvest' | 'discovery' | 'mission';
  data?: Record<string, unknown>;
}

export interface OwnedCat {
  uid: string;
  species: string;
  name: string;
  level: number;
  /** 0..3 bites into the current level (4 ÑAM per level) */
  bites: number;
  stars: number;
  habitat: string | null;
  trait: string;
  mutation: string | null;
  bornAtMs: number;
  /** "Momentos" log */
  moments: string[];
  kos?: number;
}

export interface Habitat {
  id: string;
  element: string;
  tier: number;
  region: string;
  plot: number;
  buffer: number;
  cats: string[];
  busy: boolean;
}

export interface FarmPlot {
  id: string;
  region: string;
  plot: number;
  level: number;
  crop: string | null;
  ready: boolean;
  repeat: boolean;
  lastCrop: string | null;
  busy: boolean;
}

export interface ResonanceJob {
  id: string;
  a: string;
  b: string;
  result: string;
  rarity: RarityId;
  timerId: string;
  mutation: string | null;
  ready: boolean;
}

export interface GameState {
  v: number;
  createdAt: number;
  savedAt: number;
  playMs: number;
  gold: number;
  food: number;
  gems: number;
  /** Ronroneo reserve in minutes */
  purr: number;
  prisma: number;
  scrap: number;
  blueprint: number;
  crystals: Record<string, number>;
  orbs: Record<string, number>;
  kl: number;
  /** fraction of current kingdom bar 0..1 */
  klXp: number;
  momentum: number;
  cats: OwnedCat[];
  nextId: number;
  catdex: Record<string, 'rumor' | 'registered'>;
  elements: string[];
  habitats: Habitat[];
  farms: FarmPlot[];
  expansions: { bought: number[]; cleared: number[]; secrets: number[] };
  timers: Timer[];
  pinnedTimer: string | null;
  resonance: { jobs: ResonanceJob[]; pity: number; total: number; tutorialDone: boolean; slots: number };
  ship: { owned: string[]; active: string; mk: Record<FamilyId, number>; crew: Record<string, string[]> };
  campaign: { cleared: string[]; bossesDefeated: number; analysis: Record<string, number>; stageWins: Record<string, number> };
  missions: { active: string[]; done: string[]; progress: Record<string, number>; pinned: string[]; seenLines: string[] };
  counters: Record<string, number>;
  flags: Record<string, boolean>;
  beatsSeen: string[];
  stats: { victories: number; defeats: number; modulesDestroyed: number; catsKO: number; goldEarned: number; perfects: number };
}

export interface GameEvents extends Record<string, unknown> {
  res: { key: string; delta: number; source?: string };
  timerDone: Timer;
  timerProgress: Timer;
  catAdded: { cat: OwnedCat; isNew: boolean; orbs: number };
  catLevel: { cat: OwnedCat; level: number };
  klUp: { kl: number };
  purr: { minutes: number; applied: { timer: Timer | null; minutes: number }[]; source: string };
  mission: { id: string; kind: 'new' | 'progress' | 'done' };
  unlock: { what: string };
  element: { id: string };
  toast: { text: string; icon?: string; sub?: string };
  beat: { id: string };
  changed: undefined;
  saved: undefined;
}

export function defaultState(): GameState {
  const now = Date.now();
  return {
    v: SAVE_VERSION,
    createdAt: now,
    savedAt: now,
    playMs: 0,
    gold: BAL.start.gold,
    food: BAL.start.food,
    gems: BAL.start.gems,
    purr: 0,
    prisma: 0,
    scrap: 0,
    blueprint: 0,
    crystals: {},
    orbs: {},
    kl: 1,
    klXp: 0,
    momentum: 1,
    cats: [],
    nextId: 1,
    catdex: {},
    elements: ['fire', 'water', 'nature'],
    habitats: [],
    farms: [],
    expansions: { bought: [], cleared: [], secrets: [] },
    timers: [],
    pinnedTimer: null,
    resonance: { jobs: [], pity: 0, total: 0, tutorialDone: false, slots: BAL.resonance.slots_start },
    ship: { owned: ['balsa'], active: 'balsa', mk: { hull: 1, weapon: 1, shield: 0, engine: 1, core: 0 }, crew: { balsa: [] } },
    campaign: { cleared: [], bossesDefeated: 0, analysis: {}, stageWins: {} },
    missions: { active: [], done: [], progress: {}, pinned: [], seenLines: [] },
    counters: {},
    flags: {},
    beatsSeen: [],
    stats: { victories: 0, defeats: 0, modulesDestroyed: 0, catsKO: 0, goldEarned: 0, perfects: 0 },
  };
}

type TimerHandler = (t: Timer) => void;

class Game {
  s: GameState = defaultState();
  bus = new Emitter<GameEvents>();
  private timerHandlers = new Map<TimerKind, TimerHandler>();
  /** derived gold/s, recomputed by island system */
  goldPerSec = 0;
  foodPerSec = 0;
  /** functions other systems register to recompute derived values */
  recompute: (() => void)[] = [];
  private saveAcc = 0;
  loaded = false;

  // ------------------------------------------------------------ lifecycle
  load(): { offlineMs: number } {
    const env = readSave<GameState>();
    if (env && env.version === SAVE_VERSION && env.state) {
      this.s = { ...defaultState(), ...env.state };
      this.loaded = true;
      const offlineMs = Math.max(0, Date.now() - env.savedAt);
      this.recalc();
      return { offlineMs };
    }
    this.s = defaultState();
    this.loaded = false;
    return { offlineMs: 0 };
  }
  save() {
    this.s.savedAt = Date.now();
    writeSave(this.s, SAVE_VERSION);
    this.bus.emit('saved', undefined);
  }
  reset() {
    wipeSave();
    this.s = defaultState();
  }
  uid(prefix: string) {
    return `${prefix}${this.s.nextId++}`;
  }
  on<K extends keyof GameEvents>(k: K, fn: (p: GameEvents[K]) => void) {
    return this.bus.on(k, fn);
  }
  emit<K extends keyof GameEvents>(k: K, p: GameEvents[K]) {
    this.bus.emit(k, p);
  }
  recalc() {
    for (const f of this.recompute) f();
  }

  // ------------------------------------------------------------ resources
  add(key: 'gold' | 'food' | 'gems' | 'prisma' | 'scrap' | 'blueprint', n: number, source?: string) {
    if (!n) return;
    this.s[key] = Math.max(0, this.s[key] + n);
    if (key === 'gold' && n > 0) this.s.stats.goldEarned += n;
    this.emit('res', { key, delta: n, source });
  }
  addCrystals(el: string, n: number) {
    this.s.crystals[el] = (this.s.crystals[el] ?? 0) + n;
    this.emit('res', { key: 'crystal', delta: n, source: el });
  }
  addOrbs(species: string, n: number) {
    this.s.orbs[species] = (this.s.orbs[species] ?? 0) + n;
    if (!this.s.catdex[species]) this.s.catdex[species] = 'rumor';
    this.emit('res', { key: 'orbs', delta: n, source: species });
    this.count('orbs_any_drop');
  }
  can(cost: Partial<Record<'gold' | 'food' | 'gems' | 'scrap' | 'blueprint' | 'prisma', number>>) {
    return Object.entries(cost).every(([k, v]) => (this.s[k as 'gold'] ?? 0) >= (v ?? 0));
  }
  spend(cost: Partial<Record<'gold' | 'food' | 'gems' | 'scrap' | 'blueprint' | 'prisma', number>>) {
    if (!this.can(cost)) return false;
    for (const [k, v] of Object.entries(cost)) if (v) this.add(k as 'gold', -v);
    return true;
  }

  // ------------------------------------------------------------ counters/flags (missions read these)
  count(key: string, n = 1) {
    this.s.counters[key] = (this.s.counters[key] ?? 0) + n;
  }
  flag(key: string, v = true) {
    const was = !!this.s.flags[key];
    this.s.flags[key] = v;
    if (v && !was) this.emit('unlock', { what: key });
  }
  has(key: string) {
    return !!this.s.flags[key];
  }

  // ------------------------------------------------------------ timers
  onTimer(kind: TimerKind, fn: TimerHandler) {
    this.timerHandlers.set(kind, fn);
  }
  startTimer(kind: TimerKind, ref: string, ms: number, label: string, affinity: Timer['affinity'], data?: Record<string, unknown>): Timer {
    const t: Timer = { id: this.uid('t'), kind, ref, totalMs: ms, leftMs: ms, label, affinity, data };
    this.s.timers.push(t);
    if (ms <= 0) this.finishTimer(t);
    return t;
  }
  timer(id: string) {
    return this.s.timers.find((t) => t.id === id);
  }
  timerFor(kind: TimerKind, ref: string) {
    return this.s.timers.find((t) => t.kind === kind && t.ref === ref);
  }
  private finishTimer(t: Timer) {
    this.s.timers = this.s.timers.filter((x) => x !== t);
    if (this.s.pinnedTimer === t.id) this.s.pinnedTimer = null;
    this.timerHandlers.get(t.kind)?.(t);
    this.emit('timerDone', t);
  }
  /** reduce a timer by ms (returns ms actually used) */
  rush(t: Timer, ms: number) {
    const used = Math.min(ms, t.leftMs);
    t.leftMs -= used;
    this.emit('timerProgress', t);
    if (t.leftMs <= 0) this.finishTimer(t);
    return used;
  }

  // ------------------------------------------------------------ Ronroneo
  /**
   * Gain Ronroneo from playing. Auto-applies to the pinned timer (or the one closest to finishing),
   * with +50% affinity bonus if matching. Leftover goes to the reserve; reserve overflow → gold.
   */
  purr(action: PurrAction, source: Timer['affinity']) {
    const base = purrMinutes(action, this.s.kl, this.s.momentum, false);
    const applied: { timer: Timer | null; minutes: number }[] = [];
    let left = base;
    let guard = 0;
    while (left > 0.001 && guard++ < 8) {
      const t = this.pickPurrTarget();
      if (!t) break;
      const mult = t.affinity === source ? 1 + BAL.ronroneo.affinity_bonus : 1;
      const needMin = t.leftMs / 60000 / mult;
      const useMin = Math.min(left, needMin);
      this.rush(t, useMin * mult * 60000);
      applied.push({ timer: t, minutes: useMin * mult });
      left -= useMin;
    }
    if (left > 0.001) {
      const cap = purrPoolCapMin(this.s.kl, this.has('big_hourglass'));
      const room = Math.max(0, cap - this.s.purr);
      const toPool = Math.min(room, left);
      this.s.purr += toPool;
      const overflow = left - toPool;
      if (overflow > 0) this.add('gold', overflow * BAL.ronroneo.overflow_to_gold_seconds_per_min * this.goldPerSec, 'purr_overflow');
      applied.push({ timer: null, minutes: toPool });
    }
    this.emit('purr', { minutes: base, applied, source });
    return base;
  }
  private pickPurrTarget(): Timer | null {
    const pinned = this.s.pinnedTimer ? this.timer(this.s.pinnedTimer) : null;
    if (pinned) return pinned;
    let best: Timer | null = null;
    for (const t of this.s.timers) if (!best || t.leftMs < best.leftMs) best = t;
    return best;
  }
  /** spend reserve minutes on a timer manually */
  spendPurrOn(t: Timer) {
    if (this.s.purr <= 0) return 0;
    const need = t.leftMs / 60000;
    const use = Math.min(need, this.s.purr);
    this.s.purr -= use;
    this.rush(t, use * 60000);
    this.emit('res', { key: 'purr', delta: -use });
    return use;
  }

  // ------------------------------------------------------------ momentum & xp
  bump(ev: MomentumEvent) {
    this.s.momentum = momentumAdd(this.s.momentum, ev);
  }
  xp(action: XpAction | 'hatch', rarity?: RarityId, mult = 1) {
    let gain = xpFrac(xpPct(action, rarity), this.s.kl) * mult;
    while (gain > 0 && this.s.kl < BAL.kingdom.level_cap) {
      const room = 1 - this.s.klXp;
      if (gain >= room) {
        gain -= room;
        this.s.klXp = 0;
        this.s.kl++;
        this.onKlUp();
      } else {
        this.s.klXp += gain;
        gain = 0;
      }
    }
    this.emit('res', { key: 'xp', delta: 0 });
  }
  private onKlUp() {
    const kl = this.s.kl;
    if (kl % BAL.kingdom.milestone_gems_every === 0) this.add('gems', BAL.kingdom.milestone_gems, 'milestone');
    this.purr('level_up', 'mission');
    this.emit('klUp', { kl });
  }

  // ------------------------------------------------------------ tick
  tick(dtMs: number) {
    this.s.playMs += dtMs;
    this.s.momentum = momentumDecay(this.s.momentum, dtMs / 1000);
    // timers (copy because finishing mutates)
    for (const t of [...this.s.timers]) {
      t.leftMs -= dtMs;
      if (t.leftMs <= 0) this.finishTimer(t);
    }
    for (const f of this.tickers) f(dtMs);
    this.saveAcc += dtMs;
    if (this.saveAcc > 10000) {
      this.saveAcc = 0;
      this.save();
    }
  }
  tickers: ((dtMs: number) => void)[] = [];

  /** advance offline time: green timers + production (domain systems handle caps) */
  offline(ms: number) {
    for (const t of [...this.s.timers]) {
      t.leftMs -= ms;
      if (t.leftMs <= 0) this.finishTimer(t);
    }
    for (const f of this.offliners) f(ms);
    // momentum cools fully
    this.s.momentum = momentumDecay(this.s.momentum, ms / 1000);
  }
  offliners: ((ms: number) => void)[] = [];
}

export const G = new Game();
(globalThis as unknown as { __G: Game }).__G = G;
