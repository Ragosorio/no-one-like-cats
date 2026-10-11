/**
 * BATTLE MUSIC PLANS (pure: no Pixi, no Web Audio — tests run it in node). Schema + authoring guide:
 * docs/part-ii/24-batallas-musicales.md. Data: src/data/music/battles.json.
 *
 * A plan says, for one battle (or a kind of battle, or a story goal that rides on any battle):
 *   which song plays and from where · which turn / hull / phase / signal moves it to another section (quantized) ·
 *   which beat-map hits / bars / markers drive which PRESENTATION reaction · how the enemy's shots line up with the
 *   music · whether SINCRO windows exist · what the music does on victory / defeat (+ the Fonoteca unlock).
 *
 * The sim never reads any of this. The music decides WHEN things are shown, never WHAT happens; the only bridge is
 * SINCRO, an explicit player input (battle/sincro.ts).
 */
import RAW from '../../data/music/battles.json';

export type Quantize = 'bar' | 'beat' | 'now';
export type ScenePhase = 'intro' | 'aim' | 'flight' | 'enemy' | 'end';
/** presentation verbs a reaction can use (src/battle/music/stage.ts) */
export type ReactionVerb = 'camera' | 'sky' | 'sea' | 'crew' | 'ui' | 'freeze' | 'special' | 'tide';
export const REACTION_VERBS: ReactionVerb[] = ['camera', 'sky', 'sea', 'crew', 'ui', 'freeze', 'special', 'tide'];

export interface ReactionRule {
  /** 'hit' · 'hit:<kind>' · 'bar' · 'beat' · 'section' · 'section:<name>' · 'marker:<name>' */
  on: string;
  minStrength?: number;
  /** energy of the section the event falls in (beat map `sections[].energy`) */
  minEnergy?: number;
  maxEnergy?: number;
  /** only inside these sections */
  sections?: string[];
  /** every n-th matching occurrence (1 = all) */
  every?: number;
  /** only while the battle screen is in one of these phases */
  phases?: ScenePhase[];
  do: ReactionVerb[];
  /** 0..1 (default 1); hit strength multiplies it */
  amount?: number;
  /** a color for sky / tide (hex number) */
  color?: number;
}

export interface StateWhen {
  /** the n-th enemy turn starts (1 = the first) */
  enemyTurn?: number;
  /** the n-th player turn starts */
  playerTurn?: number;
  /** at any turn start from this battle turn on */
  turnAtLeast?: number;
  /** enemy / player structure left (0..1, sim.hullPct) */
  enemyHullBelow?: number;
  playerHullBelow?: number;
  /** boss phase reached (sim.boss.phase) */
  bossPhase?: number;
  /** a named signal sent by the battle's own code: BattleMusic.signal(name) (e.g. 'phase:2') */
  signal?: string;
  /** only while the song is still before this section / marker (file time, first pass) */
  before?: string;
  /** not while the song is inside one of these sections */
  unlessSection?: string[];
}
export interface MusicTarget {
  /** another song (default: the plan's) */
  track?: string;
  /** section or marker to start from */
  section: string;
  quantize?: Quantize;
  /** loop the song's loop region afterwards (default: true when the target lies inside it) */
  loop?: boolean;
  /** a stinger played with the switch */
  stinger?: string;
  /** narrative cue (survives the scene change; ends by itself) */
  narrative?: boolean;
  /** used when `track` isn't in the catalog yet (a version / composition still to come) */
  fallback?: MusicTarget;
}
export interface StateRule {
  id?: string;
  when: StateWhen;
  to: MusicTarget;
  /** fire only once (default true) */
  once?: boolean;
}

export interface SyncCfg {
  /** weakest hit an enemy impact may land on */
  minStrength: number;
  /** a hit this strong can take a BATCH of impacts (several cannons on one accent) */
  strongStrength: number;
  /** most the release may wait (bars) */
  maxDelayBars: number;
  /** two separate impacts are at least this far apart (beats) */
  minGapBeats: number;
  /** impacts that may share one strong hit */
  batchMax: number;
  /** flight-time stretch allowed to land exactly on the hit: [fastest, slowest] × the natural duration */
  stretch: [number, number];
  /** the enemy's FIRST cat shot of the battle prefers these kinds (and may wait a bit more) */
  firstMove: { kinds: string[]; minStrength: number; maxDelayBars: number };
  /** cataclysm set pieces wait for the next downbeat / strong hit, at most this many bars */
  setPieceMaxBars: number;
}
export interface SincroCfg {
  enabled: boolean;
  /** windows open on hits at least this strong… */
  minStrength: number;
  /** …and on every hit of these kinds */
  kinds: string[];
  /** half-width of a window (ms each side of the hit), before the player's rhythm offset */
  windowMs: number;
  /** a teaching battle (H51): point at the right cat, a longer ring hint every time, a payoff line on the first SINCRO */
  teach: boolean;
}
export interface UnlockCfg {
  /** Fonoteca ref ('when_i_lose', 'te_odio.ambient') — only unlocked when the catalog knows it */
  song: string;
  /** shown in the Fonoteca («dónde se obtuvo») */
  source: string;
  /** wait this long after the battle screen closes (a weird final must not get a stinger on top) */
  delaySec?: number;
}
export interface EndCfg {
  /** jump here (quantized) when the battle is decided; null/absent = keep playing, then let go */
  track?: string;
  section?: string | null;
  quantize?: Quantize;
  narrative?: boolean;
  stinger?: string;
  /** a narrative ending gives the music back after this many seconds (0 = when the song ends) */
  releaseAfterSec?: number;
  /** fade the music out (defeat) */
  fade?: number;
  unlock?: UnlockCfg;
}
export interface RuidoCfg {
  /** music duck while the meter is high (dB) */
  duckDb: number;
  /** meter level (0..3, furious = 3) → low-pass cutoff (Hz), null = open */
  lowpassHz: (number | null)[];
  /** duck from this level on */
  duckFrom: number;
}
/** extra choreography hits the beat map doesn't have (e.g. te ODIO's chorus2 stops), file time */
export interface ExtraHit {
  time: number;
  kind: string;
  strength: number;
}

export interface BattleMusicPlan {
  id: string;
  /** null = no song of its own (presentation only follows nothing) */
  track: string | null;
  /** song to use while `track` isn't in the catalog yet (its startSection must exist there too) */
  fallback?: string;
  startSection?: string;
  startAt?: number;
  loop: boolean;
  fadeIn: number;
  /** when a non-looping section reaches the end of the song mid-battle, go back here (looping) */
  endTo?: MusicTarget | null;
  reactions: ReactionRule[];
  states: StateRule[];
  sync: SyncCfg & { enabled: boolean };
  sincro: SincroCfg;
  victory: EndCfg;
  defeat: EndCfg;
  ruido?: RuidoCfg | null;
  extraHits?: ExtraHit[];
  /** beat events later than this are skipped (low FPS / frozen tab) */
  lateSkipMs: number;
}

export interface GoalOverlay {
  id: string;
  /** active story mission */
  mission: string;
  /** a cat of this species must be in the crew (and, for the finale, land the final blow) */
  species?: string;
  /** plan id used when the battle has none of its own */
  plan?: string;
  /** the battle ends with that species' final blow → this music (next bar) */
  finale?: MusicTarget & { unlock?: UnlockCfg; releaseAfterSec?: number };
}

export interface BattleMusicDoc {
  plans: Record<string, BattleMusicPlan>;
  kinds: Record<string, string | null>;
  goals: GoalOverlay[];
}

// ------------------------------------------------------------------ cleaning
type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : {});
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const optNum = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : undefined);
const quant = (v: unknown): Quantize | undefined => (v === 'bar' || v === 'beat' || v === 'now' ? v : undefined);
const PHASES: ScenePhase[] = ['intro', 'aim', 'flight', 'enemy', 'end'];

/** deep merge for `extends`: objects merge, arrays and scalars replace */
export function deepMerge(base: unknown, over: unknown): unknown {
  if (over === undefined) return base;
  const b = obj(base);
  const o = obj(over);
  if (!over || typeof over !== 'object' || Array.isArray(over) || !base || typeof base !== 'object' || Array.isArray(base)) return over;
  const out: Obj = { ...b };
  for (const [k, v] of Object.entries(o)) out[k] = k in b ? deepMerge(b[k], v) : v;
  return out;
}

function cleanTarget(v: unknown, depth = 0): MusicTarget | null {
  const t = obj(v);
  const section = str(t.section);
  if (!section) return null;
  const fb = depth < 2 ? cleanTarget(t.fallback, depth + 1) : null;
  return {
    ...(fb ? { fallback: fb } : {}),
    track: str(t.track),
    section,
    quantize: quant(t.quantize),
    loop: typeof t.loop === 'boolean' ? t.loop : undefined,
    stinger: str(t.stinger),
    narrative: t.narrative === true ? true : undefined,
  };
}
function cleanUnlock(v: unknown): UnlockCfg | undefined {
  const u = obj(v);
  const song = str(u.song);
  return song ? { song, source: str(u.source) ?? '', delaySec: optNum(u.delaySec) } : undefined;
}
function cleanEnd(v: unknown): EndCfg {
  const e = obj(v);
  return {
    track: str(e.track),
    section: str(e.section) ?? null,
    quantize: quant(e.quantize),
    narrative: e.narrative === true ? true : undefined,
    stinger: str(e.stinger),
    releaseAfterSec: optNum(e.releaseAfterSec),
    fade: optNum(e.fade),
    unlock: cleanUnlock(e.unlock),
  };
}
function cleanReaction(v: unknown): ReactionRule | null {
  const r = obj(v);
  const on = str(r.on);
  const verbs = (strs(r.do) ?? []).filter((x): x is ReactionVerb => (REACTION_VERBS as string[]).includes(x));
  if (!on || !verbs.length) return null;
  return {
    on,
    minStrength: optNum(r.minStrength),
    minEnergy: optNum(r.minEnergy),
    maxEnergy: optNum(r.maxEnergy),
    sections: strs(r.sections),
    every: Math.max(1, Math.round(num(r.every, 1))),
    phases: strs(r.phases)?.filter((p): p is ScenePhase => (PHASES as string[]).includes(p)),
    do: verbs,
    amount: optNum(r.amount),
    color: typeof r.color === 'number' ? r.color : typeof r.color === 'string' && /^#?[0-9a-f]{6}$/i.test(r.color) ? parseInt(r.color.replace('#', ''), 16) : undefined,
  };
}
function cleanState(v: unknown): StateRule | null {
  const s = obj(v);
  const to = cleanTarget(s.to);
  if (!to) return null;
  const w = obj(s.when);
  const when: StateWhen = {
    enemyTurn: optNum(w.enemyTurn),
    playerTurn: optNum(w.playerTurn),
    turnAtLeast: optNum(w.turnAtLeast),
    enemyHullBelow: optNum(w.enemyHullBelow),
    playerHullBelow: optNum(w.playerHullBelow),
    bossPhase: optNum(w.bossPhase),
    signal: str(w.signal),
    before: str(w.before),
    unlessSection: strs(w.unlessSection),
  };
  if (Object.values(when).every((x) => x === undefined)) return null;
  return { id: str(s.id), when, to, once: s.once !== false };
}

const DEFAULT_SYNC: BattleMusicPlan['sync'] = {
  enabled: true,
  minStrength: 0.6,
  strongStrength: 0.85,
  maxDelayBars: 1,
  minGapBeats: 1,
  batchMax: 3,
  stretch: [0.8, 1.3],
  firstMove: { kinds: ['drop', 'reentry', 'phrase'], minStrength: 0.9, maxDelayBars: 1.25 },
  setPieceMaxBars: 1,
};
const DEFAULT_SINCRO: SincroCfg = { enabled: false, minStrength: 0.8, kinds: ['drop', 'reentry'], windowMs: 170, teach: false };

/** a plan from loose JSON (after `extends` was merged). Bad values → defaults; never throws. */
export function cleanPlan(id: string, raw: unknown): BattleMusicPlan {
  const p = obj(raw);
  const sy = obj(p.sync);
  const fm = obj(sy.firstMove);
  const sc = obj(p.sincro);
  const st = Array.isArray(sy.stretch) ? sy.stretch : [];
  const ru = p.ruido === null ? null : obj(p.ruido);
  return {
    id,
    track: str(p.track) ?? null,
    fallback: str(p.fallback),
    startSection: str(p.startSection),
    startAt: optNum(p.startAt),
    loop: p.loop !== false,
    fadeIn: Math.max(0, num(p.fadeIn, 0.3)),
    endTo: cleanTarget(p.endTo),
    reactions: (Array.isArray(p.reactions) ? p.reactions : []).map(cleanReaction).filter((r): r is ReactionRule => !!r),
    states: (Array.isArray(p.states) ? p.states : []).map(cleanState).filter((r): r is StateRule => !!r),
    sync: {
      enabled: sy.enabled !== false,
      minStrength: num(sy.minStrength, DEFAULT_SYNC.minStrength),
      strongStrength: num(sy.strongStrength, DEFAULT_SYNC.strongStrength),
      maxDelayBars: Math.max(0, Math.min(2, num(sy.maxDelayBars, DEFAULT_SYNC.maxDelayBars))),
      minGapBeats: Math.max(0, num(sy.minGapBeats, DEFAULT_SYNC.minGapBeats)),
      batchMax: Math.max(1, Math.round(num(sy.batchMax, DEFAULT_SYNC.batchMax))),
      stretch: [Math.max(0.5, Math.min(1, num(st[0], 0.8))), Math.max(1, Math.min(2, num(st[1], 1.3)))],
      firstMove: {
        kinds: strs(fm.kinds) ?? DEFAULT_SYNC.firstMove.kinds,
        minStrength: num(fm.minStrength, DEFAULT_SYNC.firstMove.minStrength),
        maxDelayBars: Math.max(0, Math.min(2, num(fm.maxDelayBars, DEFAULT_SYNC.firstMove.maxDelayBars))),
      },
      setPieceMaxBars: Math.max(0, Math.min(2, num(sy.setPieceMaxBars, DEFAULT_SYNC.setPieceMaxBars))),
    },
    sincro: {
      enabled: sc.enabled === true,
      minStrength: num(sc.minStrength, DEFAULT_SINCRO.minStrength),
      kinds: strs(sc.kinds) ?? DEFAULT_SINCRO.kinds,
      // forgiving by contract: never narrower than 150 ms each side
      windowMs: Math.max(150, Math.min(300, num(sc.windowMs, DEFAULT_SINCRO.windowMs))),
      teach: sc.teach === true,
    },
    victory: cleanEnd(p.victory),
    defeat: cleanEnd(p.defeat),
    ruido: ru
      ? Object.keys(ru).length
        ? {
            duckDb: Math.max(0, Math.min(24, num(ru.duckDb, 6))),
            lowpassHz: (Array.isArray(ru.lowpassHz) ? ru.lowpassHz : []).map((x) => (typeof x === 'number' && x > 0 ? x : null)),
            duckFrom: Math.max(0, num(ru.duckFrom, 2)),
          }
        : undefined
      : null,
    extraHits: (Array.isArray(p.extraHits) ? p.extraHits : [])
      .map(obj)
      .filter((h) => typeof h.time === 'number')
      .map((h) => ({ time: num(h.time, 0), kind: str(h.kind) ?? 'hit', strength: Math.max(0, Math.min(1, num(h.strength, 0.9))) })),
    lateSkipMs: Math.max(30, Math.min(500, num(p.lateSkipMs, 120))),
  };
}

/** the whole document (battles.json): presets + battles merged through `extends` (max depth 6, cycles cut) */
export function cleanDoc(raw: unknown): BattleMusicDoc {
  const r = obj(raw);
  const presets = obj(r.presets);
  const battles = obj(r.battles);
  const defaults = obj(r.defaults);
  const resolveRaw = (id: string, depth = 0, seen = new Set<string>()): unknown => {
    const own = battles[id] ?? presets[id];
    if (own === null || own === undefined) return null;
    const ext = str(obj(own).extends);
    if (ext && depth < 6 && !seen.has(ext)) {
      seen.add(id);
      const base = resolveRaw(ext, depth + 1, seen);
      return deepMerge(base ?? {}, own);
    }
    return own;
  };
  const plans: Record<string, BattleMusicPlan> = {};
  for (const id of [...Object.keys(presets), ...Object.keys(battles)]) {
    const rawPlan = resolveRaw(id);
    if (rawPlan === null || id.startsWith('$')) continue;
    plans[id] = cleanPlan(id, deepMerge(defaults, rawPlan));
  }
  const kinds: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(obj(r.kinds))) kinds[k] = typeof v === 'string' && plans[v] ? v : null;
  const goals: GoalOverlay[] = [];
  for (const [id, gv] of Object.entries(obj(r.goals))) {
    const g = obj(gv);
    const mission = str(g.mission);
    if (!mission) continue;
    const f = obj(g.finale);
    const ft = cleanTarget(g.finale);
    goals.push({
      id,
      mission,
      species: str(g.species),
      plan: str(g.plan) && plans[String(g.plan)] ? String(g.plan) : undefined,
      finale: ft ? { ...ft, unlock: cleanUnlock(f.unlock), releaseAfterSec: optNum(f.releaseAfterSec) } : undefined,
    });
  }
  return { plans, kinds, goals };
}

let DOC: BattleMusicDoc = cleanDoc(RAW);
export const musicDoc = () => DOC;
/** tests / DEV: swap the document */
export function setMusicDoc(raw: unknown) {
  DOC = cleanDoc(raw);
}

// ------------------------------------------------------------------ resolution
export interface PlanContext {
  /** story battle id / errand id / special id (spec.meta.special ?? spec.meta.key) */
  battleId?: string | null;
  /** 'default' | 'boss' | 'story' | 'errand' | 'duel' … */
  kind: string;
  /** active story missions */
  activeMissions: string[];
  /** species in the player's crew for this battle */
  crewSpecies: string[];
  /** DEV: force a plan (?scene=battle&music=…) */
  force?: string | null;
}
export interface ResolvedPlan {
  plan: BattleMusicPlan | null;
  /** goal overlays riding on this battle (finales) */
  goals: GoalOverlay[];
  /** why (debug) */
  source: 'force' | 'battle' | 'goal' | 'kind' | 'none';
}
const bare = (s: string) => s.replace(/^[a-z]_/, '');

/**
 * Which plan a battle plays: forced (DEV) > the battle's own id > an active goal that applies (H38) > its kind.
 * Unknown battle ids are fine (a plan written for a battle that doesn't exist yet just waits).
 */
export function resolvePlan(ctx: PlanContext, doc: BattleMusicDoc = DOC): ResolvedPlan {
  const goals = doc.goals.filter((g) => ctx.activeMissions.includes(g.mission) && (!g.species || ctx.crewSpecies.some((s) => bare(s) === bare(g.species!))));
  if (ctx.force && doc.plans[ctx.force]) return { plan: doc.plans[ctx.force], goals, source: 'force' };
  if (ctx.battleId && doc.plans[ctx.battleId]) return { plan: doc.plans[ctx.battleId], goals, source: 'battle' };
  const g = goals.find((x) => x.plan);
  if (g) return { plan: doc.plans[g.plan!], goals, source: 'goal' };
  const k = doc.kinds[ctx.kind] ?? doc.kinds.default ?? null;
  return k && doc.plans[k] ? { plan: doc.plans[k], goals, source: 'kind' } : { plan: null, goals, source: 'none' };
}

// ------------------------------------------------------------------ state rules
export interface BattleFacts {
  /** what just happened: a turn start (with its count) or a signal */
  trigger: { kind: 'enemyTurn' | 'playerTurn'; n: number } | { kind: 'signal'; name: string };
  turn: number;
  enemyHull: number;
  playerHull: number;
  bossPhase: number;
  /** file position heard now (s) and whether the song already looped once */
  pos: number | null;
  looped: boolean;
  /** section the song is in now */
  section: string | null;
  /** section / marker name → file time */
  timeOf: (name: string) => number | null;
}

/** does this rule fire now? (pure) */
export function ruleMatches(r: StateRule, f: BattleFacts): boolean {
  const w = r.when;
  const t = f.trigger;
  if (w.signal !== undefined) {
    if (t.kind !== 'signal' || t.name !== w.signal) return false;
  } else if (t.kind === 'signal') return false;
  if (w.enemyTurn !== undefined && !(t.kind === 'enemyTurn' && t.n === w.enemyTurn)) return false;
  if (w.playerTurn !== undefined && !(t.kind === 'playerTurn' && t.n === w.playerTurn)) return false;
  if (w.turnAtLeast !== undefined && f.turn < w.turnAtLeast) return false;
  if (w.enemyHullBelow !== undefined && !(f.enemyHull < w.enemyHullBelow)) return false;
  if (w.playerHullBelow !== undefined && !(f.playerHull < w.playerHullBelow)) return false;
  if (w.bossPhase !== undefined && f.bossPhase < w.bossPhase) return false;
  if (w.before !== undefined) {
    const at = f.timeOf(w.before);
    if (at === null || f.pos === null || f.looped || f.pos >= at) return false;
  }
  if (w.unlessSection?.length && f.section && w.unlessSection.includes(f.section)) return false;
  return true;
}

/** the first rule that fires (skipping the once-rules already used) */
export function pickRule(rules: StateRule[], f: BattleFacts, used: Set<number>): { rule: StateRule; index: number } | null {
  for (let i = 0; i < rules.length; i++) {
    if (used.has(i)) continue;
    if (ruleMatches(rules[i], f)) return { rule: rules[i], index: i };
  }
  return null;
}

// ------------------------------------------------------------------ reactions
export interface ReactionEvent {
  /** 'hit' | 'bar' | 'beat' | 'section' | 'marker' */
  type: string;
  /** hit kind / section name / marker name */
  name?: string;
  strength?: number;
  energy: number;
  section: string | null;
}
/** the rule's `on` matches the event (pure) */
export function reactionMatches(r: ReactionRule, e: ReactionEvent, phase: ScenePhase): boolean {
  const [type, name] = r.on.split(':');
  if (type !== e.type) return false;
  if (name !== undefined && name !== e.name) return false;
  if (r.minStrength !== undefined && (e.strength ?? 1) < r.minStrength) return false;
  if (r.minEnergy !== undefined && e.energy < r.minEnergy) return false;
  if (r.maxEnergy !== undefined && e.energy > r.maxEnergy) return false;
  if (r.sections?.length && (!e.section || !r.sections.includes(e.section))) return false;
  if (r.phases?.length && !r.phases.includes(phase)) return false;
  return true;
}
