/**
 * Typed access to src/data/content.json (generated from research/04-gdd + 04-content.json).
 * Numbers that say "balance:..." are resolved from balance.json via BAL.
 */
import base from './content.json';
import { mergeContent } from './mergeContent';
// Parte II — La Era de las Rupturas: its content lives in its own modules and is merged on load, so
// Part I's content.json stays untouched (append-only: arrays concatenate, objects merge by key).
import rupturasEspecies from './rupturas/especies.json';
import rupturasHistoria from './rupturas/historia.json';
import especiesO2 from './rupturas/especies-o2.json';
import historiaO2 from './rupturas/historia-o2.json';
import especiesO3 from './rupturas/especies-o3.json';
import historiaO3 from './rupturas/historia-o3.json';
import especiesO4 from './rupturas/especies-o4.json';
import historiaO4 from './rupturas/historia-o4.json';
// Parte III — the vertical slice (docs/part-iii/11): its story lives in data/gateras/
import gaterasHistoria from './gateras/historia.json';
// Parte III — its collectible cats (GATOS-DATOS: docs/part-iii/mecanicas-v2/05-gatos-coleccionables.md). Appended AFTER
// every older species, so no Catdex number moves. A MULTIDIMENSIONAL only merges with the flag on (state/sys/multidim.ts)
import gaterasEspecies from './gateras/especies.json';
// After the Parte III — the cats that only show up once it's over (state/sys/postp3.ts): appended AFTER the box cats, so
// no Catdex number moves; checked on load (data/postp3/validate.ts). Shipped empty: nothing changes until cats land
import postEspecies from './postp3/especies.json';
import { validatePostCats } from './postp3/validate';
import { ContentConflict } from './mergeContent';
import { P3_MULTIDIM } from '../state/sys/multidim';
// (balance.json through econ, never as a bare JSON import: scripts/verify-missions.ts merges every `./*.json` import here)
import { BAL } from '../state/econ';

const p3Especies = {
  ...gaterasEspecies,
  cats: (gaterasEspecies.cats as { rarity: string }[]).filter((c) => P3_MULTIDIM.on || c.rarity !== 'multidimensional'),
};
const postCats = (postEspecies.cats as { rarity: string }[]).filter((c) => P3_MULTIDIM.on || c.rarity !== 'multidimensional');
const raw = mergeContent(base as unknown as Record<string, unknown>, rupturasEspecies as Record<string, unknown>,
  rupturasHistoria as Record<string, unknown>,
  ...([especiesO2, historiaO2, especiesO3, historiaO3, especiesO4, historiaO4] as Record<string, unknown>[]),
  gaterasHistoria as Record<string, unknown>,
  p3Especies as Record<string, unknown>,
  { cats: postCats } as Record<string, unknown>,
);
{
  // a bad post cat stops the game in dev and in the tests (like a content conflict); in production it's only a warning
  const problems = validatePostCats(postCats as Parameters<typeof validatePostCats>[0], {
    balance: BAL as unknown as Record<string, unknown>,
    roles: (raw as { roles: { id: string }[] }).roles.map((r) => r.id),
    elements: (raw as { elements: { id: string }[] }).elements.map((e) => e.id),
  });
  const env = (import.meta as { env?: { DEV?: boolean; MODE?: string } }).env;
  if (problems.length && (!env || env.DEV || env.MODE === 'test')) throw new ContentConflict(problems.join('\n'));
  for (const p of problems) console.warn('[content]', p);
}
// materials[] is an id-keyed array, so a module can't reach into a material's `mult`: a new element brings its hull
// multipliers as `materialMult[element][material]` (rupturas/especies.json) and they're folded in here — only where
// Part I has no value (append-only, like the merge)
for (const [el, row] of Object.entries((raw as { materialMult?: Record<string, Record<string, number>> }).materialMult ?? {}))
  for (const m of (raw as { materials: { id: string; mult: Record<string, number> }[] }).materials) if (row[m.id] !== undefined) m.mult[el] ??= row[m.id];
import type { RarityId } from '../state/econ';

export interface ShotSpec {
  name: string;
  cry?: string;
  archetype: string;
  element: string;
  dmg: number;
  radius: number;
  projectiles: number;
  spreadDeg: number;
  bounces: number;
  pierce: number;
  status: string | null;
  statusTurns: number;
  gravityMul: number;
  speedMul: number;
  special?: string;
}
export interface UltSpec {
  name: string;
  effect: string;
  dmg: number;
  meterCost: number;
  usesPerBattle: number | null;
  chargeTurns: number;
  structureCap: number;
}
export interface TintSpec {
  hue?: number;
  sat?: number;
  bright?: number;
  overlay?: string;
  overlayAlpha?: number;
  decal?: string;
  scale?: number;
}
export interface CatDef {
  id: string;
  name: string;
  epithet: string;
  art: { slug: string; tint: TintSpec | null; aura: string[] };
  elements: string[];
  rarity: RarityId;
  primordial: boolean;
  secret: boolean;
  role: string;
  worker: string | null;
  trait: string;
  battleForm: { name: string; cry: string };
  economy: { goldMod: number | null };
  combat: {
    recarga: number;
    shot: ShotSpec;
    ultimate: UltSpec;
    limitation: string | null;
    passive: string;
    star3: string;
    star5: string;
  };
  obtain: { source: string; how: string };
  hint: string | null;
  lore: string;
  /** Parte III: its box (`p3d_borracha`…) or the pass-through multiverse it comes from (`pinceles`, `pantalla`, `pixel`, `mitos`) */
  origin?: string;
  /** Parte III: how it is collected — data, not code (state/sys/p3cats.ts; docs/part-iii/mecanicas-v2/05-gatos-coleccionables.md) */
  p3?: P3Source;
  /** after the Parte III: its table and its weight there (state/sys/postp3.ts; data/postp3/reglas.ts) */
  post?: PostSource;
}
/**
 * Where a post-Parte III cat comes from (data/postp3/especies.json), only once the Parte III is over:
 *   source   `casino:<game>[:<sub>]` (that table's Multiverse pool) or `podio:<champion>` (data/postp3/reglas.ts)
 *   weight   its relative weight inside that pool (2 = twice as often as a 1)
 */
export interface PostSource {
  source: string;
  weight: number;
  /** its showcase on one of the coin tables (data/postp3/reglas.ts VITRINA_TABLES), or its big table's name */
  vitrina?: string;
  /** the showcase's star */
  star?: boolean;
  /** the Catdex sets it belongs to (not loaded yet) */
  sets?: string[];
}
/**
 * Where a Parte III cat comes from (mecanicas-v2/02-loop.md §4): never the Portal, the Casino nor the Resonance.
 *   historia   `mission` done → the whole cat, once
 *   etapa      the FIRST win of `dim`/`node` (an élite's captain, a stage the story marks)
 *   rescate    a win of `dim`/`node` while `after` holds (`mission:H77`): the node shows it on its card
 *   actividad  `mission` done or `flag` set; `orbs` pays its orbs per activity battle on the way (before it joins)
 *   recordar   after the story (`after: mission:H97`): a win of `dim`/`node`, or `anyWin` of the Carta
 */
export interface P3Source {
  kind: 'historia' | 'etapa' | 'rescate' | 'actividad' | 'recordar';
  dim?: string;
  node?: string;
  after?: string;
  mission?: string;
  flag?: string;
  anyWin?: boolean;
  /** the Catdex knows it as a RUMOR once this holds (`mission:H70`: Borrón's file) */
  rumor?: string;
  /** a rescue whose node is on the main route: a win from BEFORE its requirement also counts once it holds (Homiau) */
  catchUp?: boolean;
  /** activity orbs: per activity battle won (`beats`: the flow's battle steps) or per locale of a box's Ronda (`ronda`) */
  orbs?: { beats?: string[]; ronda?: string };
}
export interface ElementDef {
  id: string;
  name: string;
  emoji: string;
  order: number;
  unlock: string;
  palette: string[];
  verb: string;
  shotArchetype: string;
  status: string;
  beats: string;
  beatenBy: string;
  levelUpgrades: Record<string, { name: string; effect: string }>;
  onomatopoeia: string[];
}
export interface MissionDef {
  id: string;
  chain: 'historia' | 'capitan' | 'criador' | 'explorador';
  title: string;
  goal: Record<string, unknown> & { type: string; text: string };
  trigger: string;
  purpose: string;
  reward: Record<string, unknown> & { std: boolean };
  unlocks: string[];
  line?: string;
  /** what the mission is FOR (shown under the goal + in the glossary) */
  why?: string;
  estTime?: string;
  /** Parte III: the Bitácora's 5-field card (docs/part-iii/03 §3; panels/Bitacora.ts) */
  card?: MissionCard;
}
/** PASA · IMPORTA · QUEREMOS · AHÍ when the mission appears; CAMBIÓ when it's done (one line each) */
export interface MissionCard {
  pasa: string;
  importa: string;
  queremos: string;
  ahi: string;
  cambio: string;
  /** a heading over CAMBIÓ («GATERA DESCUBIERTA · …») */
  kicker?: string;
}
export interface StageDef {
  stage: string;
  name: string;
  type: 'normal' | 'elite' | 'boss' | 'errand';
  archetype: string;
  personality: string;
  power: number;
  enemyCats: string[];
  aiDifficulty: string;
  note?: string;
  eliteRule?: string;
  eliteLine?: string;
}
export interface ZoneDef {
  zone: number;
  name: string;
  elements: string[];
  aiDifficulty: string;
  stages: StageDef[];
}
export interface ShipDef {
  id: string;
  name: string;
  archetype: string;
  utilityBudget: number;
  artifactSlots: number;
  special: string;
  grid: { cols: number; rows: number; waterlineRow: number };
  hull: string[];
  modules: { kind: string; x: number; y: number; w: number; h: number; slot?: number }[];
  art: string;
}
export interface ExpansionDef {
  n: number;
  id: string;
  name: string;
  biome: string;
  region: { cx: number; cy: number; r: number };
  balance: { kl: number; cost: number; clear_s: number; hab_plots: number; farm_plots: number; bonus: Record<string, number>; opens: string };
  opensDesign: string;
  secret: { name: string; condition: string; content: string; reward: string };
  visual: string;
}
export interface BeatDef {
  id: string;
  time: string;
  trigger: string;
  style: string;
  title: string;
  lines: [string, string][];
}
export interface BossDef {
  id: string;
  n: number;
  type: string;
  name: string;
  title: string;
  zone: number;
  elements: string[];
  captainArt: { slug: string; treatment: string };
  ship: { name: string; size: string; materials: string; notable: string[] };
  rule: string;
  weakPoint: string;
  phases: { range: [number, number]; name: string; behavior: string }[];
  enrageTurn: number;
  ai: { personality: string; difficulty: string };
  lines: Record<string, string>;
}

const C = raw as unknown as {
  elements: ElementDef[];
  affinity: Record<string, Record<string, number>>;
  materials: { id: string; name: string; hp: number; tags: string[]; mult: Record<string, number> }[];
  roles: { id: string; name: string; hp: number; desc: string }[];
  traits: { id: string; name: string; effect: string }[];
  cats: CatDef[];
  ships: ShipDef[];
  enemies: ZoneDef[];
  enemyArchetypes: Record<string, { size: string; hull: string; cannons: number; catrooms: number; mast: boolean; special: string }>;
  bosses: BossDef[];
  missions: MissionDef[];
  expansions: ExpansionDef[];
  kingdomMilestones: { kl: number; catLevelCap: number; unlocks: { text: string; kind: string; changesRules: boolean }[] }[];
  story: { characters: { id: string; name: string; role: string; voice: string }[]; beats: BeatDef[]; defeatCopy: string[] };
  catdexSets: { id: string; name: string; cats: string[]; rule: string }[];
  resonanceRules: { copy: string[]; revealCopy: Record<string, string | string[]> } & Record<string, unknown>;
  [k: string]: unknown;
};

export const CONTENT = C;
export const CATS = C.cats;
export const CAT_BY_ID = new Map(C.cats.map((c) => [c.id, c]));
export const ELEMENTS = C.elements;
export const ELEMENT_BY_ID = new Map(C.elements.map((e) => [e.id, e]));
export const MISSIONS = C.missions;
export const MISSION_BY_ID = new Map(C.missions.map((m) => [m.id, m]));
export const ZONES = C.enemies;
export const SHIPS = C.ships;
export const SHIP_BY_ID = new Map(C.ships.map((s) => [s.id, s]));
export const EXPANSIONS = C.expansions;
export const BOSSES = C.bosses;
export const BEATS = C.story.beats;
export const BEAT_BY_ID = new Map(C.story.beats.map((b) => [b.id, b]));
export const ROLE_BY_ID = new Map(C.roles.map((r) => [r.id, r]));

export function catDef(id: string): CatDef {
  const c = CAT_BY_ID.get(id);
  if (!c) throw new Error('unknown cat ' + id);
  return c;
}
export function stageDef(stage: string): StageDef | undefined {
  const [z] = stage.split('-').map(Number);
  return ZONES[z - 1]?.stages.find((s) => s.stage === stage);
}
export function affinityMult(attEl: string, defEl: string) {
  return C.affinity[attEl]?.[defEl] ?? 1;
}
export function materialMult(material: string, el: string) {
  return C.materials.find((m) => m.id === material)?.mult[el] ?? 1;
}
export function catName(id: string) {
  return CAT_BY_ID.get(id)?.name ?? id;
}
export function zoneBoss(zone: number) {
  return C.bosses.find((b) => (b.type === 'zone_boss' || b.type === 'final_boss') && b.zone === zone);
}
