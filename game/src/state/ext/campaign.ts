/**
 * Campaign UI helpers (owned by the CAMPAÑA module): stage presentation data, loot previews,
 * Quick Assault and a tiny memo shared between Map → Pre-battle → Battle → Results.
 * Pure reads on top of state/sys/campaign + ship; the only writes go through applyResult.
 */
import { G } from '../game';
import { BAL, absStage, battleCrystals, battleGold, battleScrap, blueprintAmount } from '../econ';
import { ZONES, CONTENT, catDef, zoneBoss } from '../../data/content';
import {
  STAGES_PER_ZONE,
  applyResult,
  isCleared,
  stageInfo,
  stageKey,
  stagePower,
  stageUnlocked,
  winChance,
  zoneUnlocked,
  Loot,
} from '../sys/campaign';
import { shipPower } from '../sys/ship';
import { ownsSpecies } from '../sys/cats';
import { claimBossCat } from '../sys/campaign';
import type { BattleResult } from '../../scenes/BattleScene';

export type StageKind = 'normal' | 'elite' | 'boss';

/** Quick Assault needs SP/EP ≥ this on an already-won stage (GDD 2.9.1). */
export const QUICK_ASSAULT_RATIO = 2.5;

/** Factions per zone (GDD 2.8 table). */
export const FACTION: Record<number, { name: string; short: string; palette: number[] }> = {
  1: { name: 'Piratas de la Bahía Sardina', short: 'Bahía Sardina', palette: [0x8a5a2e, 0xc99358, 0xc8102e, 0xede4d6] },
  2: { name: 'Guardia de Piedra', short: 'Guardia de Piedra', palette: [0x6f6a5e, 0xb9b2a0, 0x4f8f4a, 0x171317] },
  3: { name: 'Flota del Kraken', short: 'Flota del Kraken', palette: [0x3569a3, 0x172b35, 0xffd400, 0x00e5ff] },
  4: { name: 'Biblioteca Hundida del Arcanista', short: 'Biblioteca Hundida', palette: [0x231626, 0x5c3d5b, 0x8f6b93, 0xb89558] },
  5: { name: 'Cometas Errantes', short: 'Cometas Errantes', palette: [0x0d110f, 0xff2e88, 0x00e5ff, 0x8a5cff] },
  6: { name: 'La Marea Sin Nombre', short: 'Marea Sin Nombre', palette: [0xd9d4de, 0x413b44, 0x8a5cff, 0x171317] },
};

/** AI personalities → one honest line for the player (GDD 2.9.10). */
export const PERSONALITY: Record<string, { name: string; line: string }> = {
  torpe: { name: 'Torpe', line: 'Dispara a lo loco. A veces se pega solo.' },
  afinador: { name: 'Afinador', line: 'Uno corto, uno largo… y el tercero te lo clava.' },
  saqueador: { name: 'Saqueador', line: 'Va por tus camarotes: quiere tus gatos.' },
  vengativo: { name: 'Vengativo', line: 'Le pegas y te la devuelve el doble.' },
  elementalista: { name: 'Elementalista', line: 'Combina estados: te moja y luego te electrocuta.' },
  demoledor: { name: 'Demoledor', line: 'Apunta a tus soportes para derrumbarte.' },
  francotirador: { name: 'Francotirador', line: 'Tiros rectos y finos al núcleo.' },
  calculador: { name: 'Calculador', line: 'Lee el viento y no regala nada.' },
};

export function stageKind(zone: number, stage: number): StageKind {
  const t = stageInfo(zone, stage)?.type;
  if (t === 'boss' || stage === STAGES_PER_ZONE) return 'boss';
  if (t === 'elite' || stage === 5) return 'elite';
  return 'normal';
}

export const KIND_LABEL: Record<StageKind, string> = { normal: 'NORMAL', elite: 'ÉLITE', boss: 'JEFE' };

export function prettyArchetype(zone: number, stage: number) {
  const sd = stageInfo(zone, stage);
  if (stageKind(zone, stage) === 'boss') return zoneBoss(zone)?.ship.name ?? 'Buque insignia';
  const raw = (sd?.archetype ?? 'chalupa').split(' ')[0];
  if (raw === 'patito') return 'Patito de hule';
  const s = raw.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** unique elements of the stage's enemy crew (boss → boss elements) */
export function stageElements(zone: number, stage: number): string[] {
  const sd = stageInfo(zone, stage);
  if (stageKind(zone, stage) === 'boss') {
    const b = zoneBoss(zone);
    if (b) return [...b.elements];
  }
  const set = new Set<string>();
  for (const sp of sd?.enemyCats ?? []) {
    try {
      for (const e of catDef(sp).elements) set.add(e);
    } catch {
      /* unknown cat id */
    }
  }
  if (!set.size) for (const e of ZONES[zone - 1]?.elements ?? []) set.add(e);
  return [...set];
}

/** captain / headline data for cards & pre-battle */
export function stageCaptain(zone: number, stage: number): { name: string; line: string | null; personality: string } {
  const sd = stageInfo(zone, stage);
  const kind = stageKind(zone, stage);
  const pers = sd?.personality ?? 'torpe';
  if (kind === 'boss') {
    const b = zoneBoss(zone);
    return { name: b ? `${b.name} — ${b.title}` : sd?.name ?? 'Jefe', line: b?.lines.intro ?? null, personality: b?.ai.personality ?? pers };
  }
  if (stageKey(zone, stage) === '1-1') return { name: 'El Patito Pirata', line: '¡Cuac! ¡Esta es mi bahía! ¡Cuac!', personality: pers };
  if (kind === 'elite') {
    const name = (sd?.name ?? 'Élite').split('—')[0].trim();
    return { name, line: sd?.eliteLine ?? null, personality: pers };
  }
  const names = CAPTAINS[zone] ?? CAPTAINS[1];
  return { name: names[(zone * 7 + stage * 3) % names.length], line: null, personality: pers };
}

/** flavor names for unnamed captains, per faction */
const CAPTAINS: Record<number, string[]> = {
  1: ['Capitán Sardino', 'Cabo Pulgas', 'La Tía Anchoa', 'Contramaestre Escamas', 'Pirata Boquerón', 'Grumete Mojado'],
  2: ['Sargento Pedrusco', 'Cabo Musgo', 'Doña Almena', 'Teniente Grava', 'Guardia Adoquín'],
  3: ['Capitán Chispazo', 'Bruma Voltio', 'Contramaestre Pararrayos', 'Cabo Nimbo', 'La Señora Trueno'],
  4: ['Bibliotecario Polilla', 'Escribana Runa', 'Fray Pergamino', 'Archivista Tinta', 'Hermano Índice'],
  5: ['Navegante Cometa', 'Astróloga Lira', 'Cadete Órbita', 'Piloto Nebulosa', 'Capitán Perihelio'],
  6: ['El Ahogado', 'Doña Niebla', 'Capitán Costilla', 'El Que No Parpadea', 'Marinero Sin Nombre'],
};

/** the enemy crew element used for crystal drops (mirrors applyResult) */
export function dropElement(zone: number, stage: number) {
  const sd = stageInfo(zone, stage);
  try {
    return (sd?.enemyCats?.[0] ? catDef(sd.enemyCats[0]).elements[0] : ZONES[zone - 1].elements[0]) ?? 'fire';
  } catch {
    return ZONES[zone - 1]?.elements[0] ?? 'fire';
  }
}

export interface LootPreview {
  frontier: boolean;
  gold: number;
  scrap: number;
  blueprintChance: number;
  blueprints: number;
  crystals: { el: string; n: number };
  gems: number;
  boss: boolean;
}

/** honest preview of a victory's loot (same formulas as applyResult, without randomness) */
export function lootPreview(zone: number, stage: number): LootPreview {
  const abs = absStage(zone, stage);
  const frontier = !isCleared(stageKey(zone, stage));
  const m = G.s.momentum;
  const R = BAL.combat.reward;
  const boss = stageKind(zone, stage) === 'boss';
  const p: LootPreview = {
    frontier,
    gold: Math.round(battleGold(abs, G.goldPerSec, frontier, false, m, G.has('flash_active'))),
    scrap: battleScrap(abs, false, m),
    blueprintChance: stage >= R.blueprint_min_stage ? R.blueprint_chance : 0,
    blueprints: blueprintAmount(zone),
    crystals: { el: dropElement(zone, stage), n: battleCrystals(zone) },
    gems: 0,
    boss,
  };
  if (boss && frontier) {
    const b = BAL.bosses[zone - 1];
    p.gems = b?.gems ?? 0;
    p.blueprintChance = 1;
    p.blueprints = R.boss_blueprints;
    p.crystals = { el: ZONES[zone - 1].elements[0], n: R.boss_crystals };
  }
  return p;
}

export function powerRatio(zone: number, stage: number) {
  return shipPower() / Math.max(1e-9, stagePower(zone, stage));
}

export function canQuickAssault(zone: number, stage: number) {
  return isCleared(stageKey(zone, stage)) && powerRatio(zone, stage) >= QUICK_ASSAULT_RATIO;
}

/** sets the mission trigger flag when any won stage is quick-assaultable (C14) */
export function refreshQuickAssaultFlag() {
  if (G.has('can_quick_assault')) return;
  for (const k of G.s.campaign.cleared) {
    const [z, s] = k.split('-').map(Number);
    if (canQuickAssault(z, s)) {
      G.flag('can_quick_assault');
      return;
    }
  }
}

/** Resolve an already-won stage instantly as a victory (Asalto Rápido). */
export function quickAssault(zone: number, stage: number): Loot | null {
  if (!canQuickAssault(zone, stage)) return null;
  const r: BattleResult = { won: true, reason: 'core', turns: 3, modulesDestroyed: 4, damageDealt: 0, catsLost: 0, perfect: false };
  G.count('quick_assault');
  return applyResult(zone, stage, r);
}

export function stageState(zone: number, stage: number): 'cleared' | 'open' | 'locked' {
  if (isCleared(stageKey(zone, stage))) return 'cleared';
  return stageUnlocked(zone, stage) ? 'open' : 'locked';
}

export function chanceLabel(zone: number, stage: number) {
  return `Estimación ${Math.round(winChance(zone, stage) * 100)}%`;
}

/** number of resonance recipes that involve an element (for the T4 counter) */
export function resonancesWith(el: string) {
  const recipes = (CONTENT.resonanceRecipes as { parents: string[] }[] | undefined) ?? [];
  const n = recipes.filter((r) => r.parents?.includes(el)).length;
  return n || CONTENT.cats.filter((c) => c.elements.includes(el)).length;
}

export { zoneUnlocked, stageUnlocked, isCleared, stageKey, STAGES_PER_ZONE };

// ---------------------------------------------------------------- memo between scenes
export interface LastBattle {
  zone: number;
  stage: number;
  key: string;
  result: BattleResult;
  loot: Loot;
  /** cleared for the first time with this battle */
  firstClear: boolean;
  purrMinutes: number;
  purrApplied: { label: string; minutes: number }[];
  momentumBefore: number;
  momentumAfter: number;
  analysisBefore: number;
  analysisAfter: number;
  mvp: string | null;
  quick?: boolean;
}

export const campaignMemo: {
  last: LastBattle | null;
  /** stage key that was just unlocked (map animates the route to it) */
  justUnlocked: string | null;
  /** stage key that was just cleared */
  justCleared: string | null;
} = { last: null, justUnlocked: null, justCleared: null };

/**
 * applyResult + capture of everything the Results screen wants to show
 * (Ronroneo stamps per timer, Momentum before/after, boss Analysis, route unlocks).
 */
export function resolveBattle(zone: number, stage: number, r: BattleResult, o: { mvp?: string | null; quick?: boolean } = {}): LastBattle {
  const key = stageKey(zone, stage);
  const wasCleared = isCleared(key);
  const momentumBefore = G.s.momentum;
  const analysisBefore = G.s.campaign.analysis[key] ?? 0;
  const applied: { label: string; minutes: number }[] = [];
  let purrMinutes = 0;
  const off = G.on('purr', (p) => {
    purrMinutes += p.minutes;
    for (const a of p.applied) {
      if (a.minutes <= 0.001) continue;
      const label = a.timer ? a.timer.label : 'Reserva de Ronroneo';
      const prev = applied.find((x) => x.label === label);
      if (prev) prev.minutes += a.minutes;
      else applied.push({ label, minutes: a.minutes });
    }
  });
  let loot: Loot;
  try {
    if (o.quick) {
      const q = quickAssault(zone, stage);
      loot = q ?? applyResult(zone, stage, r);
    } else loot = applyResult(zone, stage, r);
  } finally {
    off();
  }
  const firstClear = !wasCleared && isCleared(key);
  campaignMemo.justCleared = firstClear ? key : null;
  campaignMemo.justUnlocked = null;
  if (firstClear) {
    const next = stage < STAGES_PER_ZONE ? stageKey(zone, stage + 1) : zone < ZONES.length && zoneUnlocked(zone + 1) ? stageKey(zone + 1, 1) : null;
    campaignMemo.justUnlocked = next;
  }
  const last: LastBattle = {
    zone,
    stage,
    key,
    result: r,
    loot,
    firstClear,
    purrMinutes,
    purrApplied: applied,
    momentumBefore,
    momentumAfter: G.s.momentum,
    analysisBefore,
    analysisAfter: G.s.campaign.analysis[key] ?? 0,
    mvp: o.mvp ?? null,
    quick: o.quick,
  };
  campaignMemo.last = last;
  return last;
}

/**
 * Safety net: a boss primordial whose reveal never played (game closed mid-results) still joins.
 * Returns the species that were claimed now.
 */
export function claimPendingBossCats(): string[] {
  const out: string[] = [];
  for (let i = 0; i < G.s.campaign.bossesDefeated; i++) {
    for (const u of BAL.bosses[i]?.unlocks ?? []) {
      const [k, v] = u.split(':');
      if (k === 'cat' && G.has(u) && !ownsSpecies(v)) {
        claimBossCat(v);
        out.push(v);
      }
    }
  }
  return out;
}
