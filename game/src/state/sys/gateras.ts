/**
 * Parte III · LA CARTA DE LAS CAJAS — the save slice, the HUELLAS DE 000, the price of a gatera and opening one
 * (docs/part-iii/05-mapa-y-dimensiones.md §1–2, 11-contrato-porcion.md §1–2 B).
 *
 *   G.s.ext.gateras (optional; a save without the Parte III stays byte-for-byte as it was — nothing is created on load):
 *     { v: 1, open: { [dim]: at }, huellas: number, stages: { [dim]: { cleared, wins } }, seen: string[] }
 *   · open[dim]       when Maneki opened that gatera (ms). An id is forever.
 *   · huellas         HUELLAS DE 000: 3 per stage won for the first time, 10 per boss — given by the game, never farmed.
 *   · stages[dim]     cleared = how many stages of it are won (linear, like the Diario del Mar); wins[n] = wins per stage.
 *   · seen            scenes / notes already shown (never shown twice).
 *   Additive fields (mecanicas-v2/03 §1.3 — all optional, never created on load: a v1 save reads byte-for-byte the same):
 *   · nodes[dim][id]  wins per NODE of any shape (detours `d1`, activities `a1`, encounters `e…`, the nodes of a bracket
 *                     / shelf / tour). Winning a node proves nothing about the others (only the LINE rule below does).
 *   · peak            the highest island income seen (Marea divided out): Maneki charges max(now, peak) (02 §2.1).
 *   · acts[dim]       activities: { seed, round, done[] } (La Ronda, Patrulla…).
 *   · enc[id]         encounters: 'visto' | 'ganado'.
 *   · photos          trip photos (élites / bosses won), in order.
 *   The normalizer (afterLoad) only repairs: unknown keys are kept, numbers are clamped, nothing is ever subtracted.
 *   «A win of stage n proves 1…n» applies ONLY to `line` dimensions (stages[dim]); a broken additive section is set
 *   aside in `<field>Broken`, never dropped.
 *
 *   PRICE: max(floor, incomePerSec() / mareaMult() × secs) — minutes of island income (like the Kit de Vuelo), divided by
 *   the Marea Final so its ×1000 never prices a gatera. The Borracha: 900 s, floor 4.5 B.
 *
 * Pure state: no Pixi here (the Carta is scenes/GaterasMapScene.ts, its flow app/cajasFlow.ts).
 */
import { G } from '../game';
import { incomePerSec, nicePrice } from './shop';
import { mareaMult, mareaUntil } from './island';
import REGIONES from '../../data/gateras/regiones.json';

export type DimId = 'p3d_borracha' | 'p3d_superheroes' | 'p3d_anime' | 'p3d_libros' | 'p3d_pop';
export const DIM_IDS: DimId[] = ['p3d_borracha', 'p3d_superheroes', 'p3d_anime', 'p3d_libros', 'p3d_pop'];
const isDim = (k: string): k is DimId => (DIM_IDS as string[]).includes(k);

export type StageKind = 'normal' | 'elite' | 'boss';
export interface GateraStageDef {
  n: number;
  name: string;
  kind: StageKind;
  /** playable in this build (the vertical slice: B-1…B-5) */
  playable: boolean;
  /** position inside the region's screen (0..1) */
  at: [number, number];
  captain?: string;
  captainName?: string;
  /** the captain's painting when it isn't its species' (B-5: `dona_police_cat`, a candidate the owner still has to approve) */
  captainArt?: string;
  line?: string;
  crew?: string[];
  archetype?: string;
  personality?: string;
  ai?: string;
  powerMul?: number;
  band?: 'historia' | 'jefe' | 'final';
  hpMulX?: number;
  mareo?: import('../../battle/mareo').MareoCfg;
  /** the box's power on an élite (02 §6.3): a cataclysm that scales with YOUR hull — side and caster come from the dim */
  cata?: { id: import('../../battle/cataclysm').CataId; first: number; every: number; power: number };
  /** a boss's phases (battle/fases.ts), plain data — El Cadenero «cierra la puerta» */
  fases?: import('../../battle/fases').FasesCfg;
  teach?: string;
  /** the control elements this stage TEACHES on purpose (tests/p3Rosters.test.ts lets it bring them) */
  teaches?: string[];
  /** the presentation film CINE registers for this stage (else the generic animated card) — app/stageIntro.ts */
  film?: string;
  /** QUÉ PASA, one line for the presentation (else «Seguimos el rastro de Cerito por …») */
  pasa?: string;
  /** what we risk, one line for the presentation (else a default by kind) */
  stakes?: string;
  /** the stamp the victory screen drops on its first win (an id; the art reads it) */
  stamp?: string;
  /** Acto I story rules (battle/barRules.ts): «RIMA» (EMIAU) and «LISTA VIP» (El Cadenero) */
  rima?: import('../../battle/barRules').RimaCfg;
  vip?: import('../../battle/barRules').VipCfg;
  /** Parte III · Actos II–IV: this stage's own rules (battle/actRules.ts: duelo, pausas, enredo, correccion, esquirlas,
   *  pose…), merged over its box's dimension rule (`dims[].rules`) */
  rules?: Partial<import('../../battle/sim').StageRules>;
  /** story battles in the dark (H85: she turns her lantern off) / with her light on the trajectories (H87) */
  dark?: boolean;
  luz?: boolean;
  /** a one-turn help on that side's turn N: Brecha if she got the map in H87 (`p3_mapa_brecha`), else Bisagra (H88, H93) */
  ayuda?: { side: 0 | 1; turn: number };
  /** a mission requirement on a STAGE of a line (`mission:H73`): locked until the story gets there (El Cadenero) */
  story?: string;
  /** bar conditions this battle carries (battle/ronda.ts: «SIN DERRAMAR», «LA ÚLTIMA Y NOS VAMOS») */
  conditions?: import('../../battle/ronda').BarConditionId[];
  /** «LA ÚLTIMA Y NOS VAMOS» in this many rounds (default the catalogue's 4) */
  turns?: number;
  /** what winning it gives besides huellas, said on the card (a rescue: `rescate_<id>`; granted when its art exists) */
  reward?: string;
  note?: { text: string; at: [number, number]; rot?: number };
}
/** the shape of a dimension on the Carta (05 §1.4): a route, a tournament bracket, a shelf of stories, a tour */
export type CartaShape = 'line' | 'bracket' | 'shelf' | 'tour';
export type NodeKind = 'stage' | 'elite' | 'boss' | 'desvio' | 'actividad' | 'encuentro' | 'escena';
/**
 * A node of the Carta beyond the line of stages (mecanicas-v2/03 §1.3). Same battle fields as a stage.
 *   requires   what opens it — all must hold: a node id of the same dimension (won), `mission:H70` (done), `flag:x`
 *   revealedBy hidden on the Carta until this holds (same syntax), e.g. `flag:ronda_1`
 */
export interface GateraNodeDef extends Omit<GateraStageDef, 'n' | 'kind'> {
  id: string;
  kind: NodeKind;
  requires?: string[];
  revealedBy?: string;
  /** huellas of its first win (default: 3 for stage / élite / detour, the boss's 10, 0 for the rest) */
  huellas?: number;
}
/**
 * LA RONDA (05 §4, mecanicas-v2/02 §3.1): `locales` short battles built from a stage of the route (`base`), lighter
 * (`powerMul`, `hpMul`), each with a BAR CONDITION seeded by `ext.gateras.acts[dim].seed` + the round: reloading gives
 * the same round, playing it again shuffles it. Finishing the round sets `reveals` (the detour appears).
 */
export interface RondaDef {
  /** the activity's node (dims[].nodes, kind 'actividad'): where it sits and what opens it */
  node: string;
  name: string;
  /** each locale: its base stage; `powerMul` / `hpMul` on top of the activity's (the karaoke's Sonido stuns: lighter) */
  locales: { id: string; name: string; base: number; powerMul?: number; hpMul?: number }[];
  powerMul?: number;
  hpMul?: number;
  /** the flag the first full round sets */
  reveals: string;
}
export interface DimDef {
  id: DimId;
  /** default `line` (the Borracha: `stages` in order, like the Diario del Mar) */
  shape?: CartaShape;
  /** the nodes of a non-line shape, or the extra nodes of a line (its detour, activity, encounters) */
  nodes?: GateraNodeDef[];
  /** the letter of its stages («B» → B-3) */
  code?: string;
  /** its activity of short bar battles (La Ronda): the node that opens it, its locales, their seeded conditions */
  ronda?: RondaDef;
  /** its look in battle (palette over the Borracha's night, enemy ship style); unset = the Borracha's */
  battle?: { palette?: { skyTop?: number; skyBottom?: number; sea?: number; seaDark?: number }; style?: string };
  /** the box's rule, on every battle of the box (Onomatopeya, Poder, Capítulos, Ritmo: battle/actRules.ts) */
  rules?: Partial<import('../../battle/sim').StageRules>;
  order: number;
  name: string;
  sub: string;
  /** how the Carta draws it: 'tv' (the Borracha), 'blank', or a look registered by the scene (scenes/cartaModel.ts) */
  look: string;
  /** Maneki's tag title («LA GATERA DE LA CERVEZA»); else «LA GATERA: <name>» */
  gatera?: string;
  /** the box's own music on the Carta (a track id; nothing plays without it) */
  music?: string;
  price: { secs: number; floor: number; huellas: number };
  story?: string;
  box: { x: number; y: number; w: number; h: number };
  screen?: { x: number; y: number; w: number; h: number };
  tear: [number, number][];
  home?: [number, number][];
  smell?: string;
  palette?: Record<string, string>;
  notes?: { text: string; at: [number, number]; rot?: number }[];
}
export interface Regiones {
  huellas: { firstWin: number; boss: number };
  island: { x: number; y: number; r: number; faro: [number, number] };
  dims: DimDef[];
  stages: Partial<Record<DimId, GateraStageDef[]>>;
}
export const REG = REGIONES as unknown as Regiones;
export const DIMS: DimDef[] = REG.dims;
export const dimDef = (id: DimId) => DIMS.find((d) => d.id === id)!;
export const stagesOf = (id: DimId): GateraStageDef[] => REG.stages[id] ?? [];
export const stageOf = (id: DimId, n: number) => stagesOf(id).find((s) => s.n === n);
/**
 * The battle id of a node (`p3d_borracha_3`) — what the win flag and the music plan read. Ids of more than one digit
 * are fine (mecanicas-v2/03 §1.2): stages `p3d_<dim>_<n>` (10, 11… too), detours `p3d_<dim>_d<k>`, activities
 * `p3d_<dim>_a<k>`, encounters `p3d_<dim>_e<id>`. The win flag is always `won_<battle id>`.
 */
export const gateraBattleId = (dim: DimId, node: number | string) => `${dim}_${node}`;
/** a Carta node id: digits, or a letter + letters/digits (`3`, `10`, `d1`, `a2`, `ecadenero`) */
export const NODE_ID_RE = /^[a-z0-9]+$/;
/** the battle-id pattern of the Carta (any dimension, any node) — the mission IR uses it too (app/cajasFlow.ts) */
export const GATERA_BATTLE_RE = /^(p3d_[a-z]+)_([a-z0-9]+)$/;
export function parseBattleId(id: string): { dim: DimId; node: string; n: number | null } | null {
  const m = GATERA_BATTLE_RE.exec(id);
  if (!m || !isDim(m[1])) return null;
  return { dim: m[1], node: m[2], n: /^\d+$/.test(m[2]) ? Number(m[2]) : null };
}

// ------------------------------------------------------------------ the save slice
export interface GaterasExt {
  v: 1;
  open: Partial<Record<DimId, number>>;
  huellas: number;
  stages: Partial<Record<DimId, { cleared: number; wins: Record<string, number> }>>;
  seen: string[];
  /** wins per node of any shape: node id → wins (additive, 03 §1.3) */
  nodes?: Partial<Record<DimId, Record<string, number>>>;
  /** the highest island income seen, Marea divided out (Maneki's price never drops by emptying habitats) */
  peak?: number;
  /** activities: seed, round and the results */
  acts?: Partial<Record<DimId, { seed: number; round: number; done: string[] }>>;
  /** encounters: id → 'visto' | 'ganado' */
  enc?: Record<string, 'visto' | 'ganado'>;
  /** trip photos (élites and bosses won), in order */
  photos?: string[];
}

const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const nonNeg = (v: unknown) => Math.max(0, Math.floor(num(v)));
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const uniqStr = (v: unknown[]) => [...new Set(v.filter((x): x is string => typeof x === 'string'))];

/** the shape of a dimension (pure on the data) */
export const shapeOf = (dim: DimId): CartaShape => DIMS.find((d) => d.id === dim)?.shape ?? 'line';

/**
 * The additive sections (03 §1.3). Only touched when present, so a v1 save gains no key. A section that isn't an
 * object goes to `<field>Broken` (set aside, never dropped); inside a good section a broken entry does the same.
 */
function normalizeAdditive(r: Record<string, unknown>, out: Record<string, unknown>) {
  const aside = (field: string, key: string | null, v: unknown) => {
    const k = `${field}Broken`;
    if (key === null) out[k] = v;
    else out[k] = { ...(isObj(out[k]) ? (out[k] as object) : {}), [key]: v };
  };
  if (r.nodes !== undefined) {
    if (!isObj(r.nodes)) {
      aside('nodes', null, r.nodes);
      delete out.nodes;
    } else {
      const nodes: Record<string, Record<string, number>> = {};
      for (const [dim, v] of Object.entries(r.nodes)) {
        if (!isObj(v)) {
          aside('nodes', dim, v);
          continue;
        }
        // every key is kept (known or not: a later build may know it); only the count is repaired
        const wins: Record<string, number> = {};
        for (const [id, w] of Object.entries(v)) wins[id] = nonNeg(w);
        nodes[dim] = wins;
      }
      out.nodes = nodes;
    }
  }
  if (r.peak !== undefined) out.peak = Math.max(0, num(r.peak));
  if (r.acts !== undefined) {
    if (!isObj(r.acts)) {
      aside('acts', null, r.acts);
      delete out.acts;
    } else {
      const acts: Record<string, { seed: number; round: number; done: string[] }> = {};
      for (const [dim, v] of Object.entries(r.acts)) {
        if (!isObj(v)) {
          aside('acts', dim, v);
          continue;
        }
        acts[dim] = { ...v, seed: Math.floor(num(v.seed)) >>> 0, round: nonNeg(v.round), done: Array.isArray(v.done) ? uniqStr(v.done) : [] };
      }
      out.acts = acts;
    }
  }
  if (r.enc !== undefined) {
    if (!isObj(r.enc)) {
      aside('enc', null, r.enc);
      delete out.enc;
    } else {
      const enc: Record<string, string> = {};
      for (const [id, v] of Object.entries(r.enc)) if (typeof v === 'string') enc[id] = v;
      out.enc = enc;
    }
  }
  if (r.photos !== undefined) {
    if (!Array.isArray(r.photos)) {
      aside('photos', null, r.photos);
      delete out.photos;
    } else out.photos = uniqStr(r.photos);
  }
}

/** pure: repair a slice (null when there's nothing usable). Never subtracts: bad numbers become 0, extra keys stay. */
export function normalizeGateras(raw: unknown): GaterasExt | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const out: GaterasExt & Record<string, unknown> = { ...(r as object), v: 1, open: {}, huellas: nonNeg(r.huellas), stages: {}, seen: [] } as GaterasExt & Record<string, unknown>;
  const open = r.open && typeof r.open === 'object' ? (r.open as Record<string, unknown>) : {};
  for (const [k, v] of Object.entries(open)) {
    if (!isDim(k)) continue;
    const at = num(v, NaN);
    // an opened gatera stays open even if its date got lost
    out.open[k] = Number.isFinite(at) && at > 0 ? at : 1;
  }
  const st = r.stages && typeof r.stages === 'object' ? (r.stages as Record<string, unknown>) : {};
  for (const [k, v] of Object.entries(st)) {
    if (!isDim(k) || !v || typeof v !== 'object') continue;
    const s = v as Record<string, unknown>;
    const wins: Record<string, number> = {};
    if (s.wins && typeof s.wins === 'object') for (const [n, w] of Object.entries(s.wins as Record<string, unknown>)) if (/^\d+$/.test(n)) wins[n] = nonNeg(w);
    // cleared can't be below what the wins prove — ONLY on a line (winning n means 1..n were cleared); a bracket, a
    // shelf or a tour proves nothing about its other nodes (03 §1.3)
    const proven = shapeOf(k) === 'line' ? Object.entries(wins).reduce((a, [n, w]) => (w > 0 ? Math.max(a, Number(n)) : a), 0) : 0;
    out.stages[k] = { cleared: Math.min(9, Math.max(nonNeg(s.cleared), proven)), wins };
  }
  if (Array.isArray(r.seen)) out.seen = uniqStr(r.seen);
  normalizeAdditive(r, out);
  return out;
}

/** the slice (read-only view; undefined until the Parte III touches it) */
export function gateras(): GaterasExt | undefined {
  return G.s.ext?.gateras as GaterasExt | undefined;
}
/** the slice, created on first need (only Parte III actions call this) */
function gx(): GaterasExt {
  G.s.ext ??= {};
  const cur = normalizeGateras(G.s.ext.gateras);
  if (cur) {
    G.s.ext.gateras = cur;
    return cur;
  }
  const fresh: GaterasExt = { v: 1, open: {}, huellas: 0, stages: {}, seen: [] };
  G.s.ext.gateras = fresh;
  return fresh;
}

G.afterLoad.push(() => {
  const ext = G.s?.ext;
  if (!ext || ext.gateras === undefined) return;
  const n = normalizeGateras(ext.gateras);
  // a broken slice (not an object) is set aside, never silently dropped
  if (n) ext.gateras = n;
  else {
    ext.gaterasBroken = ext.gateras;
    delete ext.gateras;
  }
});

// ------------------------------------------------------------------ reading
export const isOpen = (dim: DimId) => !!gateras()?.open[dim];
export const huellas = () => gateras()?.huellas ?? 0;
export const clearedIn = (dim: DimId) => gateras()?.stages[dim]?.cleared ?? 0;
export const winsOf = (dim: DimId, n: number) => (shapeOf(dim) === 'line' ? gateras()?.stages[dim]?.wins[String(n)] : gateras()?.nodes?.[dim]?.[String(n)]) ?? 0;
export const seenG = (id: string) => !!gateras()?.seen.includes(id);
export function markSeenG(id: string) {
  const g = gx();
  if (!g.seen.includes(id)) g.seen.push(id);
}

/** the dev route (?scene=cajas) lets every story gate through (never in production) */
let devOpen = false;
export function setGaterasDev(on: boolean) {
  devOpen = on && !!import.meta.env?.DEV;
}
export const gaterasDev = () => devOpen;

/** the Carta exists for this save: the story reached H68 (or a gatera is already open) */
export function cartaAvailable(): boolean {
  if (devOpen || Object.keys(gateras()?.open ?? {}).length) return true;
  const m = G.s.missions;
  return !!m && ['H68', 'H69'].some((id) => m.active.includes(id) || m.done.includes(id));
}

/**
 * The story lets Maneki sell this gatera now. `dims[].story` is a mission id (active or done: the Borracha's H68) or a
 * requirement (`flag:x` / `mission:H74` = done). Superhéroes waits for El Cadenero's win (`flag:won_p3d_borracha_9`)
 * until NARRATIVA's mission for it exists (then its data names the mission).
 */
export function storyAllows(dim: DimId): boolean {
  if (devOpen) return true;
  const d = dimDef(dim);
  if (!d.story) return false;
  // a box with nothing to play yet (no stages, no nodes in the data) is never sold: no empty gateras
  if (!stagesOf(dim).length && !(d.nodes ?? []).length) return false;
  if (d.story.startsWith('flag:')) return G.has(d.story.slice(5));
  if (d.story.startsWith('mission:')) return !!G.s.missions?.done.includes(d.story.slice(8));
  const m = G.s.missions;
  return !!m && (m.active.includes(d.story) || m.done.includes(d.story));
}

// ------------------------------------------------------------------ nodes (any shape; 03 §1.3)
const NODE_KIND: Record<StageKind, NodeKind> = { normal: 'stage', elite: 'elite', boss: 'boss' };
/** a line's stage as a node: `n` requires `n−1` */
function stageNode(s: GateraStageDef): GateraNodeDef {
  const { n, kind, ...rest } = s;
  // a stage can also wait for the story (El Cadenero: `story: mission:H73`) on top of the stage before it
  return { ...rest, id: String(n), kind: NODE_KIND[kind], requires: [...(n > 1 ? [String(n - 1)] : []), ...(s.story ? [s.story] : [])] };
}
/** every node of a dimension: a line's stages (as nodes) + its extra nodes; another shape's own nodes */
export function nodesOf(dim: DimId): GateraNodeDef[] {
  const extra = DIMS.find((d) => d.id === dim)?.nodes ?? [];
  return shapeOf(dim) === 'line' ? [...stagesOf(dim).map(stageNode), ...extra] : [...extra];
}
export const nodeOf = (dim: DimId, id: string) => nodesOf(dim).find((d) => d.id === id);
/** a line's stage id (`3`): its progress lives in stages[dim] (cleared + wins), as it always did */
const isLineStage = (dim: DimId, id: string) => shapeOf(dim) === 'line' && /^\d+$/.test(id);
/** wins of a node (a line's stage reads stages[dim].wins) */
export function nodeWins(dim: DimId, id: string): number {
  if (isLineStage(dim, id)) return winsOf(dim, Number(id));
  return gateras()?.nodes?.[dim]?.[id] ?? 0;
}
/** a node is won: a line's stage by its `cleared` count (as today), any other node by its own wins — nothing else */
export function nodeCleared(dim: DimId, id: string): boolean {
  if (isLineStage(dim, id)) return Number(id) <= clearedIn(dim);
  return nodeWins(dim, id) > 0;
}
/** one requirement: `mission:H70` (done), `flag:x`, or a node id of the same dimension (won) */
export function requirementMet(dim: DimId, req: string): boolean {
  if (req.startsWith('mission:')) return !!G.s?.missions?.done.includes(req.slice(8));
  if (req.startsWith('flag:')) return G.has(req.slice(5));
  return nodeCleared(dim, req);
}
export type NodeState = 'cleared' | 'open' | 'locked' | 'hidden';
/** a node on the Carta: cleared / open / locked, or hidden until its `revealedBy` holds */
export function nodeState(dim: DimId, id: string): NodeState {
  if (nodeCleared(dim, id)) return 'cleared';
  const def = nodeOf(dim, id);
  if (!def) return 'locked';
  if (def.revealedBy && !requirementMet(dim, def.revealedBy)) return 'hidden';
  if (!def.playable || !isOpen(dim)) return 'locked';
  return (def.requires ?? []).every((r) => requirementMet(dim, r)) ? 'open' : 'locked';
}

export type StageState = 'cleared' | 'open' | 'locked';
/**
 * A stage on the Carta: cleared / open / locked (a line: n opens when n−1 is won; past the build = locked). Delegates
 * to nodeState — the same answers as the linear model always gave (tests/gaterasNodes.test.ts checks every case).
 */
export function stageState(dim: DimId, n: number): StageState {
  const s = nodeState(dim, String(n));
  return s === 'hidden' ? 'locked' : s;
}
/** the first stage not won yet (null: the gatera is closed, or every playable stage is won) */
export function frontierOf(dim: DimId): number | null {
  if (!isOpen(dim)) return null;
  const next = clearedIn(dim) + 1;
  // the next stage of the route, when it can be played now (a stage waiting for the story isn't the frontier yet)
  return stageState(dim, next) === 'open' ? next : null;
}

// ------------------------------------------------------------------ price & opening
/** pure: the gold a gatera costs at this income (the Marea Final divided out) */
export function priceFor(dim: DimId, income: number, marea = 1): number {
  const p = dimDef(dim).price;
  return nicePrice(Math.max(p.floor, (Math.max(0, income) / Math.max(1, marea)) * p.secs));
}
/** the highest island income this save has shown (Marea divided out; 0 before the Parte III touched the save) */
export const peakIncome = () => gateras()?.peak ?? 0;
/**
 * Remember the island income if it's the highest seen (02 §2.1, 01 §4.5): Maneki charges max(now, peak), so moving
 * cats out of their habitats never lowers a gatera's price. Parte III only: it writes only when the slice exists (or
 * `create` and the Carta exists for this save). Skipped during the Marea Final and 5 s after it (its ×1000 is divided
 * out, but G.goldPerSec catches up a beat late). Never lowers. Returns the peak.
 */
export function notePeakIncome(create = false, income = incomePerSec(), marea = mareaMult(), now = Date.now()): number {
  if (now < mareaUntil() + 5000) return peakIncome();
  if (!gateras() && !(create && cartaAvailable())) return 0;
  const g = gx();
  const v = Math.max(0, income) / Math.max(1, marea);
  if (Number.isFinite(v) && v > (g.peak ?? 0)) g.peak = v;
  return g.peak ?? 0;
}
/** what Maneki charges now: the price at max(income now, the peak income seen) — Parte III only */
export function gateraPrice(dim: DimId): { gold: number; huellas: number } {
  const now = Math.max(0, incomePerSec()) / Math.max(1, mareaMult());
  return { gold: priceFor(dim, Math.max(now, peakIncome())), huellas: dimDef(dim).price.huellas };
}

// the peak follows the island while the Parte III is on (every 20 s; never creates the slice, never saves by itself)
let peakAcc = 0;
G.tickers.push((dt) => {
  peakAcc += dt;
  if (peakAcc < 20_000) return;
  peakAcc = 0;
  if (G.loaded && gateras()) notePeakIncome();
});

export type BuyResult = { ok: true; gold: number } | { ok: false; why: 'story' | 'gold' | 'huellas' | 'open' };

/** pay Maneki and open the gatera (the story gate, the gold and — from the 2nd box — the huellas) */
export function buyGatera(dim: DimId): BuyResult {
  if (isOpen(dim)) return { ok: false, why: 'open' };
  if (!storyAllows(dim)) return { ok: false, why: 'story' };
  const cost = gateraPrice(dim);
  if (huellas() < cost.huellas) return { ok: false, why: 'huellas' };
  if (G.s.gold < cost.gold) return { ok: false, why: 'gold' };
  if (!G.spend({ gold: cost.gold })) return { ok: false, why: 'gold' };
  if (cost.huellas) gx().huellas -= cost.huellas;
  openGatera(dim);
  return { ok: true, gold: cost.gold };
}

/**
 * Open a gatera (idempotent). Sets the flag `gatera:<dim>` and the box's mission feature (`feature_p3_gatera_<box>`:
 * the Borracha's is the one H68 reads, `feature_p3_gatera_borracha`). Saves.
 */
export function openGatera(dim: DimId) {
  const g = gx();
  if (!g.open[dim]) g.open[dim] = Date.now();
  g.stages[dim] ??= { cleared: 0, wins: {} };
  G.flag(`gatera:${dim}`);
  // the mission feature of the box (H68 reads `feature_p3_gatera_borracha`; every box has its own: mecanicas-v2/03 §2.4)
  const feature = `feature_p3_gatera_${dim.replace(/^p3d_/, '')}`;
  if (!G.s.counters[feature]) G.count(feature);
  G.save();
}

// ------------------------------------------------------------------ wins → huellas
/** huellas a FIRST win of that stage gives (3 per stage, 10 for the boss) */
export function huellasFor(dim: DimId, n: number) {
  return stageOf(dim, n)?.kind === 'boss' ? REG.huellas.boss : REG.huellas.firstWin;
}

/**
 * Record a win of stage n (state only: gold and the rest are gaterasBattles.ts). The first win advances the route,
 * pays its huellas and sets `won_p3d_<dim>_<n>` (the win_battle goal). Returns the huellas paid (0 on a repeat).
 */
export function recordWin(dim: DimId, n: number): { first: boolean; huellas: number } {
  // another shape keeps its wins per node (winning its 7th never marks 1–6)
  if (shapeOf(dim) !== 'line') return recordNodeWin(dim, String(n));
  const g = gx();
  const st = (g.stages[dim] ??= { cleared: 0, wins: {} });
  const k = String(n);
  st.wins[k] = (st.wins[k] ?? 0) + 1;
  const first = st.wins[k] === 1 && n > st.cleared;
  let paid = 0;
  if (first) {
    st.cleared = Math.max(st.cleared, n);
    paid = huellasFor(dim, n);
    g.huellas += paid;
  }
  G.flag(`won_${gateraBattleId(dim, n)}`);
  return { first, huellas: paid };
}

/** a trip photo (02 §5.2: élites and bosses won the first time) — additive `photos`, in order, never twice */
export function addPhoto(id: string): boolean {
  const g = gx();
  const ph = (g.photos ??= []);
  if (ph.includes(id)) return false;
  ph.push(id);
  return true;
}
export const photos = (): readonly string[] => gateras()?.photos ?? [];

/** the most huellas a dimension's ROUTE gives (8 stages × 3 + the boss 10 = 34; detours are extra margin) */
export function huellasMax(dim: DimId) {
  if (shapeOf(dim) === 'line') return stagesOf(dim).reduce((a, s) => a + huellasFor(dim, s.n), 0);
  return nodesOf(dim)
    .filter((d) => d.kind === 'stage' || d.kind === 'elite' || d.kind === 'boss')
    .reduce((a, d) => a + huellasForNode(dim, d.id), 0);
}

/** huellas the FIRST win of a node gives (02 §2.1: 3 per fight node — detours too —, 10 the boss, 0 the rest) */
export function huellasForNode(dim: DimId, id: string): number {
  if (isLineStage(dim, id)) return huellasFor(dim, Number(id));
  const def = nodeOf(dim, id);
  if (!def) return 0;
  if (typeof def.huellas === 'number') return Math.max(0, def.huellas);
  if (def.kind === 'boss') return REG.huellas.boss;
  return def.kind === 'stage' || def.kind === 'elite' || def.kind === 'desvio' ? REG.huellas.firstWin : 0;
}

/**
 * Record a win of ANY node (03 §1.3). A line's stage goes through recordWin (its route, as always); every other node
 * counts in nodes[dim][id] and proves nothing about the others. The first win pays its huellas. Sets `won_<battle id>`.
 */
export function recordNodeWin(dim: DimId, id: string): { first: boolean; huellas: number } {
  if (isLineStage(dim, id)) return recordWin(dim, Number(id));
  const g = gx();
  const nodes = (g.nodes ??= {});
  const wins = (nodes[dim] ??= {});
  wins[id] = (wins[id] ?? 0) + 1;
  const first = wins[id] === 1;
  const paid = first ? huellasForNode(dim, id) : 0;
  g.huellas += paid;
  G.flag(`won_${gateraBattleId(dim, id)}`);
  return { first, huellas: paid };
}

// ------------------------------------------------------------------ LA RONDA (the activity's state: ext.gateras.acts)
export const rondaOf = (dim: DimId): RondaDef | undefined => DIMS.find((d) => d.id === dim)?.ronda;
export const isRondaLocale = (dim: DimId, id: string) => !!rondaOf(dim)?.locales.some((l) => l.id === id);
/** the seed a box's Ronda starts from: derived from when its gatera opened (stable; nothing is written to read it) */
const rondaSeed0 = (dim: DimId) => (Math.floor(num(gateras()?.open[dim], 1)) ^ 0x5eed1e) >>> 0;
/** the activity's progress (read-only: a save that never played it reads the first round) */
export function rondaProgress(dim: DimId): { seed: number; round: number; done: string[] } {
  const a = gateras()?.acts?.[dim];
  return a ? { seed: a.seed, round: a.round, done: [...a.done] } : { seed: rondaSeed0(dim), round: 0, done: [] };
}
/** a deterministic hash in [0, 1) of a few integers */
function h01(...n: number[]) {
  let h = 0x811c9dc5;
  for (const v of n) {
    h ^= v | 0;
    h = Math.imul(h, 0x01000193) >>> 0;
    h ^= h >>> 13;
  }
  // final avalanche (murmur3 fmix32): without it ~12 % of seeds dealt the same mix every round (La Ronda never changed)
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return (h >>> 0) / 0x100000000;
}
/**
 * The condition of each locale this round: the catalogue spread evenly over the locales (with 4 locales and 2
 * conditions: two of each), shuffled by (seed, round) — the same on reload, another mix the next round.
 */
export function rondaConditions(dim: DimId): Record<string, import('../../battle/ronda').BarConditionId> {
  const r = rondaOf(dim);
  if (!r) return {};
  const ids = ['sinDerramar', 'ultimaYNosVamos'] as const;
  const { seed, round } = rondaProgress(dim);
  const pool = r.locales.map((_, i) => ids[i % ids.length]);
  // Fisher–Yates with the seeded hash
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(h01(seed, round, i) * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return Object.fromEntries(r.locales.map((l, i) => [l.id, pool[i]]));
}
/** the next locale to play this round (in order), or null when the activity isn't defined */
export function nextRondaLocale(dim: DimId): string | null {
  const r = rondaOf(dim);
  if (!r) return null;
  const { done } = rondaProgress(dim);
  return r.locales.find((l) => !done.includes(l.id))?.id ?? r.locales[0]?.id ?? null;
}
/**
 * A locale won: it counts in this round; when the round is complete it closes (round + 1, a new mix) and the first
 * full round sets `reveals` (the detour appears). Additive state only (acts); never subtracts.
 */
export function recordRondaWin(dim: DimId, id: string): { done: number; of: number; roundDone: boolean; revealed: boolean } {
  const r = rondaOf(dim);
  if (!r || !isRondaLocale(dim, id)) return { done: 0, of: 0, roundDone: false, revealed: false };
  const g = gx();
  const acts = (g.acts ??= {});
  const a = (acts[dim] ??= { seed: rondaSeed0(dim), round: 0, done: [] });
  if (!a.done.includes(id)) a.done.push(id);
  const of = r.locales.length;
  let roundDone = false;
  let revealed = false;
  if (r.locales.every((l) => a.done.includes(l.id))) {
    roundDone = true;
    a.round += 1;
    a.done = [];
    if (!G.has(r.reveals)) {
      G.flag(r.reveals);
      revealed = true;
    }
  }
  return { done: roundDone ? of : a.done.length, of, roundDone, revealed };
}
