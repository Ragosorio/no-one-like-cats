/**
 * Typed access to src/data/content.json (generated from research/04-gdd + 04-content.json).
 * Numbers that say "balance:..." are resolved from balance.json via BAL.
 */
import raw from './content.json';
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
  return C.bosses.find((b) => b.type === 'zone_boss' && b.zone === zone);
}
