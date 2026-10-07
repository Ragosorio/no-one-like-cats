/**
 * Story battles (Capítulo 1, zonas 3–6): the one-off fights the H-chain asks for. They reuse the
 * siege builder (same ships, same cats, same rules as the campaign) with a story twist each:
 *   H11 event_raijin          → El Heredero del Trueno: pararrayos; premio Raijin (Mítico)
 *   H14 story_heraldo         → Algo viene: el Heraldo del Arcanista; premio NUEVO ELEMENTO: MAGIA
 *   H18 event_grieta          → La Grieta: la Singularidad; premio Singularidad (Mítico) + 1 fragmento
 *   H19 event_vacio           → Un barco que no debería existir: NO se puede hundir; se va al turno 8;
 *                               1 Fragmento del Vacío por cada 15% de daño (máx. 3)
 *   H20 story_patito_revancha → Hace mucho tiempo, en una balsa…: el Patito Pirata, con daño absurdo
 * Winning flags `won_<id>` (what the win_battle missions read); rewards are given once.
 */
import { G } from '../game';
import { registerPatch } from '../patches';
import { catDef } from '../../data/content';
import { adopt, cat as getCat } from './cats';
import { crew, shipPower } from './ship';
import { buildSiege } from './campaign';
import { absStage, battleGold, battleScrap } from '../econ';
import { STORY_SHIPS } from '../../battle/shipgen';
import type { BattleResult, BattleSpec } from '../../scenes/BattleScene';
import type { StageRules } from '../../battle/sim';

export interface StoryBattleDef {
  id: string;
  /** story mission that asks for it */
  mission: string;
  zone: number;
  /** stage whose rewards/ships it borrows */
  stage: number;
  title: string;
  enemy: string;
  captain: string;
  line: string;
  archetype: string;
  enemyCats: string[];
  /** enemy power = your ship power × this */
  powerMul: number;
  hpMulX?: number;
  displayMulX?: number;
  rules?: StageRules;
  blueprint?: keyof typeof STORY_SHIPS;
  /** what the intro card says (honest: only mechanics that exist) */
  intro: string[];
  color: number;
  /** crystals: of the reward element (Grietas del Multiverso, state/sys/grietas.ts) */
  reward: { element?: string; cat?: string; fragments?: number; gems?: number; crystals?: number };
  /** Barco del Vacío: graded by damage, not by sinking */
  grade?: 'damage';
}

export const STORY_BATTLES: Record<string, StoryBattleDef> = {
  event_raijin: {
    id: 'event_raijin',
    mission: 'H11',
    zone: 3,
    stage: 6,
    title: 'EL HEREDERO DEL TRUENO',
    enemy: 'La Torre del Trueno',
    captain: 'Raijin',
    line: '¿Tú eres el que quiere heredar el trueno? Primero sobrevive a él.',
    archetype: 'pararrayos',
    enemyCats: ['m_raijin', 'c_voltio', 'c_nimbo'],
    powerMul: 0.95,
    rules: { rod: [1] },
    intro: ['PARARRAYOS: se traga tus tiros de {storm} rayo mientras su mástil siga vivo', 'Usa {fire} fuego, {earth} tierra o {water} agua… o tumba el mástil primero'],
    color: 0xffd400,
    reward: { cat: 'm_raijin', gems: 2 },
  },
  story_heraldo: {
    id: 'story_heraldo',
    mission: 'H14',
    zone: 4,
    stage: 1,
    title: 'ALGO VIENE',
    enemy: 'El Barco que Brilla',
    captain: 'Heraldo del Arcanista',
    line: 'Ah. Así que tú eres el que anda despertando primordiales. Qué ruidoso.',
    archetype: 'galeon_runas',
    enemyCats: ['c_linterna', 'c_caramelo'],
    powerMul: 0.6,
    intro: ['Ese barco brilla. Los barcos no brillan.', 'Sus gatos usan un elemento que todavía no conoces: {magic} MAGIA'],
    color: 0xb89558,
    reward: { element: 'magic' },
  },
  event_grieta: {
    id: 'event_grieta',
    mission: 'H18',
    zone: 5,
    stage: 6,
    title: 'LA GRIETA',
    enemy: 'La Grieta Cósmica',
    captain: 'Singularidad',
    line: '…',
    archetype: 'observatorio',
    enemyCats: ['m_singular', 'c_lunita', 'c_cometin'],
    powerMul: 1.05,
    // the crack's own power (CATACLISMOS): stars fall on your ship every 3 turns, harder the bigger your hull
    rules: { cataclysm: { id: 'meteors', side: 1, by: 'LA GRIETA', first: 2, every: 3, power: 3 } },
    intro: ['Algo se acurruca dentro de la grieta… y te está mirando', 'Gana y quizá te siga a casa', 'PODER DE LA GRIETA: LLUVIA DE METEORITOS cada 3 turnos · TÍRALE A SU SELLO'],
    color: 0x8a5cff,
    reward: { cat: 'm_singular', fragments: 1 },
  },
  event_vacio: {
    id: 'event_vacio',
    mission: 'H19',
    zone: 6,
    stage: 8,
    title: 'UN BARCO QUE NO DEBERÍA EXISTIR',
    enemy: 'Barco del Vacío',
    captain: '???',
    line: '…ELEMENT: ??? …',
    archetype: 'barco_hueso',
    enemyCats: ['s_caos', 'c_lunita', 'r_astral'],
    powerMul: 0.8,
    hpMulX: 2,
    rules: { retreat: { side: 1, turn: 8 } },
    intro: ['NO lo puedes hundir. Se va al final del turno 8', 'Hazle al menos 15% de daño: 1 Fragmento del Vacío por cada 15% (máx. 3)'],
    color: 0xff2e88,
    reward: { fragments: 0 },
    grade: 'damage',
  },
  story_patito_revancha: {
    id: 'story_patito_revancha',
    mission: 'H20',
    zone: 1,
    stage: 1,
    title: 'HACE MUCHO TIEMPO, EN UNA BALSA…',
    enemy: 'El Patito Pirata',
    captain: 'Patito',
    line: '¿Te… te acuerdas de mí? ¡Cuac! …no, por favor, no con ESO.',
    archetype: 'chalupa',
    enemyCats: ['c_canelo'],
    powerMul: 0.02,
    displayMulX: 1e6,
    blueprint: 'patito',
    intro: ['El primer barco que hundiste en tu vida', 'Hoy tu daño se mide en notación científica'],
    color: 0xffc94a,
    reward: { gems: 1, fragments: 1 },
  },
};

const cnt = (k: string) => G.s.counters[k] ?? 0;

export const STORY_BATTLE_BY_MISSION = new Map(Object.values(STORY_BATTLES).map((b) => [b.mission, b]));

export function storyBattleDone(id: string) {
  return G.has(`won_${id}`);
}

/** enemy power so the fight scales with your fleet (the story never walls you) */
function storyPower(def: StoryBattleDef) {
  return Math.max(5, shipPower() * def.powerMul);
}

export function buildStoryBattle(id: string, onEnd: (r: BattleResult) => void): BattleSpec {
  const def = STORY_BATTLES[id];
  const spec = buildSiege(
    {
      zone: def.zone,
      stage: def.stage,
      key: id,
      name: def.enemy,
      type: 'errand',
      archetype: def.archetype,
      personality: 'afinador',
      difficulty: def.zone >= 5 ? 'capitan' : 'corsario',
      enemyCats: [...def.enemyCats],
      ep: storyPower(def),
      crewUids: crew(),
      captain: def.captain,
      captainLine: def.line,
      rules: def.rules,
      special: id,
      blueprint: def.blueprint ? STORY_SHIPS[def.blueprint] : undefined,
      hpMulX: def.hpMulX,
      displayMulX: def.displayMulX,
      suddenDeath: def.grade === 'damage' ? 0 : undefined,
      intro: { kind: 'errand', tag: 'HISTORIA', title: def.title, subtitle: def.enemy, lines: def.intro, color: def.color },
    },
    onEnd,
  );
  spec.meta = { ...spec.meta!, stage: 0, boss: false };
  return spec;
}

export interface StoryLoot {
  won: boolean;
  first: boolean;
  gold: number;
  scrap: number;
  gems: number;
  fragments: number;
  newElement: string | null;
  newCat: string | null;
  /** crystals of the new element (Grietas) */
  crystals?: { el: string; n: number };
  /** Barco del Vacío: % of its hull you took (0–100) */
  damagePct?: number;
}

/** rewards + flags. The new element is pushed here; the discovery/reveal sequences are UI (storyFlow). */
export function applyStoryResult(id: string, r: BattleResult): StoryLoot {
  const def = STORY_BATTLES[id];
  const abs = absStage(Math.max(1, def.zone), Math.max(1, def.stage));
  const dmgPct = Math.round(Math.max(0, Math.min(1, r.enemyHullLost ?? 0)) * 100);
  const passed = def.grade === 'damage' ? dmgPct >= 15 : r.won;
  const first = passed && !storyBattleDone(id);
  const loot: StoryLoot = { won: passed, first, gold: 0, scrap: 0, gems: 0, fragments: 0, newElement: null, newCat: null };
  G.s.stats.modulesDestroyed += r.modulesDestroyed;
  const m = G.s.momentum;
  loot.gold = Math.round(battleGold(abs, G.goldPerSec, first, r.perfect, m) * (passed ? 1 : 0.3));
  loot.scrap = Math.max(1, Math.round(battleScrap(abs, r.perfect, m) * (passed ? 1 : 0.3)));
  if (def.grade === 'damage') {
    loot.damagePct = dmgPct;
    // best damage so far (H19 reads it)
    const k = `dmgpct_${id}`;
    if (dmgPct > cnt(k)) G.s.counters[k] = dmgPct;
  }
  if (passed) {
    G.s.stats.victories++;
    G.purr('victory', 'combat');
    G.bump('victory');
    G.xp('victory');
    G.count('wins');
  } else {
    G.s.stats.defeats++;
    G.purr('defeat', 'combat');
    G.count('defeats');
  }
  if (first) {
    G.flag(`won_${id}`);
    G.flag(`event_done_${id}`);
    loot.gems = def.reward.gems ?? 0;
    loot.fragments = def.grade === 'damage' ? Math.min(3, Math.floor(dmgPct / 15)) : def.reward.fragments ?? 0;
    const el = def.reward.element;
    if (el && !G.s.elements.includes(el)) {
      G.s.elements.push(el);
      G.flag(`element:${el}`);
      loot.newElement = el;
      G.emit('element', { id: el });
    }
    if (def.reward.cat) loot.newCat = def.reward.cat;
    if (el && def.reward.crystals) {
      G.addCrystals(el, def.reward.crystals);
      loot.crystals = { el, n: def.reward.crystals };
    }
  } else if (def.grade === 'damage' && passed) {
    // a better attempt later still pays the missing fragments
    const before = Math.min(3, Math.floor(cnt(`dmgpct_paid_${id}`) / 15));
    loot.fragments = Math.max(0, Math.min(3, Math.floor(dmgPct / 15)) - before);
  }
  if (def.grade === 'damage' && passed) G.s.counters[`dmgpct_paid_${id}`] = Math.max(cnt(`dmgpct_paid_${id}`), dmgPct);
  if (loot.fragments) addVoidFragments(loot.fragments);
  G.add('gold', loot.gold, 'story');
  G.add('scrap', loot.scrap, 'story');
  if (loot.gems) G.add('gems', loot.gems, 'story');
  G.recalc();
  G.save();
  return loot;
}

/** the primordial / mythic joins (called by the UI right before its reveal) */
export function claimStoryCat(species: string) {
  return adopt(species);
}

// ------------------------------------------------------------------ Fragmentos del Vacío
/** 10 in the chapter: Arcanista 1, Orquesta 1, Estrella 1, Grieta 1, Barco del Vacío ≤3, Primer Mar 2, Patito 1 */
export function addVoidFragments(n: number) {
  if (n <= 0) return;
  G.count('void_fragments', n);
}
export function voidFragments() {
  return cnt('void_fragments');
}

// the boss fragments arrived in the update that wired zones 4–6: saves that had already beaten those bosses
// never got them, and E25 (7/10) became impossible (max reachable 6). Pay them now.
registerPatch({
  id: '2026-10-fragmentos-de-jefes',
  why: 'Jefes 4–6 vencidos antes de que existieran los Fragmentos del Vacío: E25 quedaba imposible.',
  run() {
    let n = 0;
    for (const z of [4, 5, 6]) {
      if (G.s.campaign.bossesDefeated < z || G.has(`frag_boss_${z}`)) continue;
      G.flag(`frag_boss_${z}`);
      n += z === 6 ? 2 : 1;
    }
    if (!n) return;
    addVoidFragments(n);
    return `Los jefes que venciste antes de que existieran los Fragmentos del Vacío te mandaron los suyos: +${n} (ahora tienes ${voidFragments()} de 10).`;
  },
});

/** who the crew's MVP is for the story poster (fallback to the strongest) */
export function storyMvpName(r: BattleResult) {
  const c = getCat(r.mvp ?? '') ?? getCat(crew()[0] ?? '');
  return c ? c.name || catDef(c.species).name : '';
}
