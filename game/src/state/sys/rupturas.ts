/**
 * Parte II · Oleada 1 «LA MAREA IMPOSIBLE» (docs/part-ii/12-puente-oleada-1.md). It plays inside the game
 * after H30 «Fin», like the Grietas and the ending did, plus NEW ISLANDS visited in 3D (src/regions,
 * scenes/RegionScene via app/flow goRegion) that only exist in Part II.
 *
 *   H31 Las estrellas caen hacia arriba  use_feature faro            (tap your faro) → 3D cinematic «el reflejo»
 *   H32 REGISTRO 000                     use_feature registro000     (open the Catdex card before Nº01)
 *   H33 La Isla de las Páginas Hundidas  use_feature region_paginas  (flag region:paginas → on the CARTA; land there)
 *   H34 La Biblioteca a la Deriva        win_battle ruptura_paginas
 *   H35 Shhh                             win_battle ruptura_bibliotecario
 *   H36 La página de Canelo              use_feature pagina_canelo   (the region's floating page: his Eco)
 *   H37 Canelo quiere el timón           wins_with_species c_canelo ×3 (every mode: campaign, errands, story, duels, Podio)
 *   H38 ¡A BABOR!                        final_blow c_canelo         → flag forma:canelo_almirante
 *   H39 Isla Nácar                       win_battle ruptura_nacar    (flag region:nacar; the beam puzzle first) → CRISTAL
 *   H40 Madre Nácar                      win_battle ruptura_madrenacar
 *   H41 La letra en el margen            win_battle ruptura_corrector → flag oleada1_fin
 *
 * Missions + beats: data/rupturas/historia.json (merged onto content.json). When each beat plays:
 * ui/story/rupturasScript.ts → app/story.ts. Saves that never finished Part I see nothing: H31 waits for H30.
 */
import { G } from '../game';
import { registerPatch } from '../patches';
import { MISSION_BY_ID } from '../../data/content';
import { STORY_BATTLES, StoryBattleDef } from './storyBattles';
import { CATA_INFO, poderDe } from '../../battle/cataclysm';
import type { CataId } from '../../battle/cataclysm';
import type { StageRules } from '../../battle/sim';
import { REGION_IDS, REGION_INFO, RegionId } from '../../regions';

const done = (id: string) => !!G.s?.missions?.done.includes(id);

/** Part I finished («Fin»): Parte II can start */
export const partIIOpen = () => done('H30');
/** REGISTRO 000 is in the Catdex (after H31) */
export const registro000Visible = () => done('H31');
/** the static word was read (H32): FOLIO 000 on the crew profile, the Diario caption, the casino user */
export const folioRevealed = () => done('H32');

/** the counters H31 / H32 read (use_feature → `feature_<feature>`) */
export function tapFaro() {
  G.count('feature_faro');
}
export function openRegistro000() {
  G.count('feature_registro000');
}

// ------------------------------------------------------------------ the 3D islands on the CARTA (src/regions)
/**
 * Each island appears on the sea chart (MapScene, «MAR DE LAS RUPTURAS») when the mission that sends you there
 * APPEARS: it sets the island's `mapFlag` (REGION_INFO). The flag stays: the island can be revisited forever.
 * Saves without Parte II never get a flag, so their chart is the same as always.
 */
export const REGION_MISSION: Partial<Record<RegionId, string>> = { paginas: 'H33', nacar: 'H39' };
/** Isla Nácar's beam puzzle solved: the region flags it when its activity emits `feature_haz_nacar` */
export const NACAR_HAZ_FLAG = 'nacar_haz_ok';
export const nacarHazOk = () => G.has(NACAR_HAZ_FLAG) || (G.s.counters.feature_haz_nacar ?? 0) > 0;

/** region activities (use_feature) → the island they happen on; entering an island emits `feature_region_<id>` */
const FEATURE_REGION: Record<string, RegionId> = { pagina_canelo: 'paginas', haz_nacar: 'nacar' };
function featureRegion(feature: unknown): RegionId | null {
  const f = String(feature ?? '');
  if (f in FEATURE_REGION) return FEATURE_REGION[f];
  const id = f.startsWith('region_') ? f.slice(7) : '';
  return (REGION_IDS as readonly string[]).includes(id) ? (id as RegionId) : null;
}
/** extra condition before a region's story battle can be fought (its marker shows / the pinned mission launches it) */
export function regionBattleReady(battleId: string) {
  return battleId === 'ruptura_nacar' ? nacarHazOk() : true;
}

/** idempotent: the map flags of the islands whose mission already appeared (live, and on every load) */
export function syncRegionFlags() {
  if (!G.s?.missions) return;
  const seen = (id: string) => G.s.missions.active.includes(id) || G.s.missions.done.includes(id);
  for (const [r, m] of Object.entries(REGION_MISSION)) {
    const f = REGION_INFO[r as RegionId].mapFlag;
    if (f && m && seen(m) && !G.has(f)) G.flag(f);
  }
  if (!G.has(NACAR_HAZ_FLAG) && (G.s.counters.feature_haz_nacar ?? 0) > 0) G.flag(NACAR_HAZ_FLAG);
}
G.on('mission', (p) => {
  if (p.kind !== 'progress') syncRegionFlags();
});
G.afterLoad.push(syncRegionFlags);

/** an active story mission happens on that island (the chart marks it, the map opens on it) */
export function regionCalls(id: RegionId) {
  return G.s.missions.active.some((mid) => {
    const m = MISSION_BY_ID.get(mid);
    if (!m || m.chain !== 'historia') return false;
    const g = m.goal as { type: string; feature?: unknown; battle?: unknown };
    if (g.type === 'use_feature') return featureRegion(g.feature) === id;
    return typeof g.battle === 'string' && REGION_INFO[id].battles.includes(g.battle);
  });
}

export interface MapRegion {
  id: RegionId;
  name: string;
  /** the story is waiting there */
  call: boolean;
}
/** the islands drawn on the chart, in order (none at all without Parte II) */
export function mapRegions(): MapRegion[] {
  return REGION_IDS.filter((id) => {
    const f = REGION_INFO[id].mapFlag;
    return !!f && G.has(f);
  }).map((id) => ({ id, name: REGION_INFO[id].name, call: regionCalls(id) }));
}

/**
 * Where the HUD's IR (a pinned story mission) should take you instead of the usual: the island of a region
 * activity, or Isla Nácar while its first battle still hides behind the beam puzzle. null = as usual.
 */
export function regionForGoal(goal: { type: string; feature?: unknown; battle?: unknown }): RegionId | null {
  if (goal.type === 'use_feature') return featureRegion(goal.feature);
  if ((goal.type === 'win_battle' || goal.type === 'damage_pct') && typeof goal.battle === 'string' && !regionBattleReady(goal.battle)) {
    return REGION_IDS.find((id) => REGION_INFO[id].battles.includes(goal.battle as string)) ?? null;
  }
  return null;
}

// ------------------------------------------------------------------ the five battles
/**
 * The enemy crews are the Lote D species themselves (data/rupturas/especies.json). There is no stand-in map
 * anymore: a missing species is a data bug, and tests/rupturasStory.test.ts fails on it before it can ship
 * (every crew species must exist and every battle must build and play headless).
 */
export function crewOf(ids: string[]) {
  return [...ids];
}

interface RupturaSpec {
  id: string;
  mission: string;
  stage: number;
  title: string;
  enemy: string;
  captain: string;
  line: string;
  archetype: string;
  enemyCats: string[];
  /** strength vs your fleet (the grietas fight at ×1.15–1.35, the ending at ×1.09–1.45) */
  powerMul: number;
  hpMulX: number;
  cata: CataId;
  /** who casts the cataclysm (the intro says «PODER DE …») */
  by: string;
  /** battle rules on top of the cataclysm (H35 «Shhh»: the Bibliotecario's noise) */
  rules?: Omit<StageRules, 'cataclysm'>;
  intro: string[];
  color: number;
  reward: StoryBattleDef['reward'];
}
/**
 * Tuning: grieta-like (zone 6, a cataclysm every 3 turns at power 4) with a ×3 hull so the fight lasts.
 * Headless sims on test-saves/post-finale.json (AI aim normal + hard, 16 seeds each, 2026-10-09, with the real
 * Lote D cats): Páginas ×1.05 32/32 wins in ~3.7 turns (it falls by crew K.O.: it's the opener) ·
 * Bibliotecario ×1.25 31/32 in ~5.6 · Nácar ×1.25 30/32 in ~6.5 · Madre Nácar ×1.3 32/32 in ~5 ·
 * Corrector ×1.2 30/32 in ~5.1 (its fortress repairs itself; ×1.35 lost half). Grieta Boreal on that crew:
 * 32/32 in ~4.4.
 * Losing costs nothing but the try; it scales with your fleet like every story battle.
 */
export const RUPTURA_CATA_POWER = 4;
export const RUPTURA_SPECS: RupturaSpec[] = [
  {
    id: 'ruptura_paginas',
    mission: 'H34',
    stage: 8,
    title: 'LA ISLA DE LAS PÁGINAS HUNDIDAS',
    enemy: 'La Biblioteca a la Deriva',
    captain: 'Archivista',
    line: 'Silencio en la sala. Esta isla figura en el catálogo desde siempre.',
    archetype: 'biblioteca',
    enemyCats: ['e_archivista', 'r_tintero', 'c_marcapaginas', 'c_marcapaginas'],
    // the opener: at ×1.1–1.15 an early shot to your core lost ~1 in 6
    powerMul: 1.05,
    hpMulX: 3,
    cata: 'tide',
    by: 'LA MAREA DE TINTA',
    intro: ['Sus gatos de {magic} Magia, {water} Agua y {shadow} Sombra salen de entre las páginas.', '{storm} Tormenta y {light} Luz les pegan ×1.5 a casi todos.'],
    color: 0x3b5b86,
    reward: { cat: 'c_marcapaginas' },
  },
  {
    id: 'ruptura_bibliotecario',
    mission: 'H35',
    stage: 9,
    title: 'SHHH',
    enemy: 'La Sala de Lectura Hundida',
    captain: 'El Bibliotecario Ahogado',
    line: 'Shhh.',
    archetype: 'galeon_runas',
    enemyCats: ['l_bibliotecario', 'e_archivista', 'r_tintero', 'c_marcapaginas'],
    powerMul: 1.25,
    hpMulX: 3,
    cata: 'moon',
    by: 'EL BIBLIOTECARIO AHOGADO',
    // ODIA EL RUIDO (battle/ruido.ts): Sonido ×2 on his ship; 3 hits of Sonido wake him furious (his next turn ×1.5).
    // Post-finale sims (16 seeds × aim normal/hard): 31/32 without a Sonido cat · 31/32 and 32/32 with Headliner aboard
    // (¡SHHHH! ~0.3 times per fight). docs/part-ii/15-balance-cristal.md §5
    rules: { noise: { side: 1 } },
    intro: [
      'Odia el ruido: tus tiros de {sound} Sonido le pegan ×2 a su barco.',
      'Cada golpe de {sound} suma RUIDO. Con 3 grita ¡SHHHH! y su turno pega ×1.5.',
      '{storm} Tormenta y {light} Luz les pegan ×1.5 a sus gatos de {water} Agua y {magic} Magia.',
    ],
    color: 0x1f5f7a,
    reward: { cat: 'l_bibliotecario' },
  },
  {
    id: 'ruptura_nacar',
    mission: 'H39',
    stage: 8,
    title: 'ISLA NÁCAR',
    enemy: 'El Monte de Cristal',
    captain: 'Prismarina',
    line: 'Este cristal no se toca: se mira. Y si lo miras mucho, te mira de vuelta.',
    archetype: 'templo_flotante',
    enemyCats: ['e_prismarina', 'r_facetas', 'r_espejito', 'c_brillito'],
    powerMul: 1.25,
    hpMulX: 3,
    cata: 'sun',
    by: 'ISLA NÁCAR',
    intro: ['Sus gatos usan un elemento que todavía no conoces: CRISTAL. Sus tiros rebotan.', '{earth} Tierra le pega ×1.5 al Cristal. Y el Cristal le pega ×1.5 a tu {light} Luz y a tu {sound} Sonido.'],
    color: 0xd9c8ff,
    reward: { element: 'crystal', cat: 'c_brillito', crystals: 20 },
  },
  {
    id: 'ruptura_madrenacar',
    mission: 'H40',
    stage: 9,
    title: 'MADRE NÁCAR',
    enemy: 'La Caverna que Recuerda',
    captain: 'Madre Nácar',
    line: 'Ya te vi ganar esta pelea. Y perderla. Veamos cuál toca hoy.',
    archetype: 'observatorio',
    enemyCats: ['l_madrenacar', 'e_prismarina', 'r_espejito', 'r_facetas'],
    powerMul: 1.3,
    hpMulX: 3,
    cata: 'meteors',
    by: 'MADRE NÁCAR',
    intro: ['Madre Nácar ya vio cómo termina esta pelea. Varias veces. Enséñale una que no vio.', '{earth} Tierra le pega ×1.5 al Cristal.'],
    color: 0xf0e2ff,
    reward: { cat: 'l_madrenacar' },
  },
  {
    id: 'ruptura_corrector',
    mission: 'H41',
    stage: 9,
    title: 'LA LETRA EN EL MARGEN',
    enemy: 'La Fe de Erratas',
    captain: 'El Corrector',
    line: 'Su isla tiene demasiadas contradicciones. Las vamos a corregir.',
    archetype: 'fortaleza_relojera',
    // the Corrector's perfect crew: even a Canelo that obeys
    enemyCats: ['c_canelo', 'r_farolillo', 'r_espejito', 'c_espumita'],
    // its fortress repairs itself: at ×1.35 it beat the post-finale crew half the time
    powerMul: 1.2,
    hpMulX: 3,
    cata: 'tide',
    by: 'LA FE DE ERRATAS',
    intro: ['Un barco blanco perfecto. Su tripulación obedece TODO. Hasta un Canelo.', '{earth} Tierra y {storm} Tormenta les pegan ×1.5 a casi todos.'],
    color: 0xf4f4f0,
    reward: { cat: 'c_espumita' },
  },
];

export const RUPTURA_BATTLES = RUPTURA_SPECS.map((s) => s.id);

for (const s of RUPTURA_SPECS) {
  const def: StoryBattleDef = {
    id: s.id,
    mission: s.mission,
    // post-story rewards and the Marea Sin Nombre's sky
    zone: 6,
    stage: s.stage,
    title: s.title,
    enemy: s.enemy,
    captain: s.captain,
    line: s.line,
    archetype: s.archetype,
    get enemyCats() {
      return crewOf(s.enemyCats);
    },
    powerMul: s.powerMul,
    hpMulX: s.hpMulX,
    rules: { ...s.rules, cataclysm: { id: s.cata, side: 1, by: s.by, first: 1, every: 3, power: RUPTURA_CATA_POWER } },
    intro: [...s.intro, `${poderDe(s.by)}: ${CATA_INFO[s.cata].name} cada 3 turnos · TÍRALE A SU SELLO`],
    color: s.color,
    reward: s.reward,
  };
  STORY_BATTLES[def.id] = def;
}

// ------------------------------------------------------------------ old saves
registerPatch({
  id: '2026-10-oleada1-marea-imposible',
  why: 'Parte II · Oleada 1 (H31–H41) arranca después de H30 «Fin»: quien ya terminó la historia debe enterarse.',
  run() {
    if (!partIIOpen()) return;
    return 'Empezó LA MAREA IMPOSIBLE (Parte II · Oleada 1). De noche, Luzterna te espera en el faro: toca la misión «Las estrellas caen hacia arriba».';
  },
});
