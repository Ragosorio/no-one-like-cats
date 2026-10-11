/**
 * Parte II · Oleada 4 «EL UMBRAL» — the three story battles (registered in STORY_BATTLES like rupturas.ts / rupturasO2.ts).
 * Owner: the O4 battle agent (rules in battle/suenos.ts + battle/umbral.ts on top of the generic battle/fases.ts).
 * Contract with the story (rupturasO4.ts, data/rupturas/historia-o4.json, regions/index.ts REGION_INFO) — ids, missions
 * and rewards are FIXED:
 *
 *   umbral_suenos       H58  region suenos   captain e_duermevela · DREAM RULES drawn by phase from who sleeps on
 *                                             your island (state/sys/suenosDream.ts) → reward cat c_almohadon
 *   umbral_correctores  H62  region umbral   the Correctores' big battle: CORRECCIÓN + TACHÓN → reward cat r_tachon
 *   umbral_final        H63  region umbral   the saga's final boss, 4 phases (Correctores → Disruptores →
 *                                             Titiriteros → final) → reward cat l_bisagra
 *
 * Every reward goes through the Parte II claimed-rewards ledger by itself (storyBattles.applyStoryResult / claimStoryCat).
 * The battle config is built when the battle is (the `rules` getter reads the save ONCE, here): the sim and the
 * estimate worker only ever see plain data.
 */
import { G } from '../game';
import type { GameState } from '../game';
import { STORY_BATTLES, StoryBattleDef } from './storyBattles';
import { dreamElements, dreamersOf, dreamSeed, dreamWeights } from './suenosDream';
import { CATA_INFO, poderDe } from '../../battle/cataclysm';
import type { CataId } from '../../battle/cataclysm';
import type { StageRules } from '../../battle/sim';
import type { FaseDef, FasesCfg } from '../../battle/fases';
import { DREAM_AFFINITY, DREAM_IDS, dreamInfo } from '../../battle/suenos';
import type { DreamCfg, DreamId } from '../../battle/suenos';
import type { UmbralCfg, UmbralRules } from '../../battle/umbral';

export const O4_BATTLE_MISSION = {
  umbral_suenos: 'H58',
  umbral_correctores: 'H62',
  umbral_final: 'H63',
} as const;
export type O4BattleId = keyof typeof O4_BATTLE_MISSION;
export const O4_BATTLES = Object.keys(O4_BATTLE_MISSION) as O4BattleId[];

// ------------------------------------------------------------------ H58: the dream, from who sleeps on your island
/** rounds each dream lasts */
export const DREAM_EVERY = 2;
type DreamSave = Pick<GameState, 'cats'> & Partial<Pick<GameState, 'habitats'>>;

/**
 * The battle's DreamCfg from a save (pure): each rule weighs 1 + the dream weight of its elements (capped, so one
 * crowded habitat can't make a single rule the only dream), CANCIÓN DE CUNA +2 per sleepy dreamer, and ¡SUEÑO DE …!
 * dreams the island's strongest element. An empty island still dreams (every rule at 1).
 */
export function dreamCfgFor(save: DreamSave | null | undefined): DreamCfg {
  const w = dreamWeights(save);
  const who = dreamersOf(save);
  const el = dreamElements(save, 1)[0] ?? 'water';
  const sleepy = who.filter((d) => d.sleepy).length;
  const pool = DREAM_IDS.map((id) => {
    let x = 1;
    if (id === 'elemento') x += Math.min(4, (w[el] ?? 0) / 2);
    else x += Math.min(5, DREAM_AFFINITY[id].reduce((a, e) => a + (w[e] ?? 0), 0) / 2);
    if (id === 'arrullo') x += 2 * sleepy;
    return { id, w: Math.round(x * 100) / 100 };
  });
  return { every: DREAM_EVERY, pool, el, seed: dreamSeed(save), who: who.map((d) => d.name) };
}

/** the rules this island dreams most (strongest first), for the intro */
export function likelyDreams(cfg: DreamCfg, n = 3): DreamId[] {
  return [...cfg.pool].sort((a, b) => b.w - a.w || DREAM_IDS.indexOf(a.id) - DREAM_IDS.indexOf(b.id)).slice(0, n).map((p) => p.id);
}

function dreamIntro(cfg: DreamCfg): string[] {
  const names = (cfg.who ?? []).slice(0, 3);
  const likely = likelyDreams(cfg, 3).map((id) => dreamInfo(id, cfg.el).name);
  return [
    `REGLAS DE SUEÑO: cada ${cfg.every} rondas el mar sueña una regla nueva, para LOS DOS barcos. Lee el aviso.`,
    names.length ? `Esta noche sueñan ${names.join(', ')}${(cfg.who?.length ?? 0) > 3 ? ' y más' : ''}: lo más probable es ${likely.join(' · ')}` : `Lo más probable: ${likely.join(' · ')}`,
  ];
}

// ------------------------------------------------------------------ H63: the four phases
/**
 * The Umbral's phases (battle/fases.ts decides WHEN; battle/umbral.ts what each one DOES). They enter by damage
 * (fasesProgress: max(hull lost toward sinking, crew life lost)) or, in a slow fight, by turn — so a long battle
 * still walks the four of them before the sudden death of turn 10.
 */
export const UMBRAL_PHASES: FaseDef[] = [
  { id: 'correctores', name: 'Los Correctores', telegraph: 'Todo perfecto: sin viento, se reparan y tachan tu mejor elemento.', env: { calm: true, layer: 'sea' } },
  {
    id: 'disruptores',
    name: 'Los Disruptores',
    at: { hp: 0.25, turn: 4 },
    telegraph: 'ROMPEN LA CAJA: viento ×1.5 que cambia de lado cada ronda, y TODO pega ×1.2.',
    env: { windMul: 1.5, layer: 'glitch' },
    effects: ['umbral'],
  },
  {
    id: 'titiriteros',
    name: 'Los Titiriteros',
    at: { hp: 0.5, turn: 6 },
    telegraph: 'HILOS: casi nada pesa (×0.3), no hay viento y una MANO jala los tiros. Cada ronda se mueve.',
    env: { g: 0.3, calm: true, layer: 'astral' },
    effects: ['umbral'],
  },
  {
    id: 'umbral',
    name: 'El Umbral',
    at: { hp: 0.75, turn: 8 },
    telegraph: 'TODO JUNTO: gravedad ×0.7, la mano, se repara y tacha. Y ahora pelea en serio.',
    env: { g: 0.7, windMul: 1.2, layer: 'sky' },
    effects: ['umbral'],
  },
];
export const UMBRAL_RULES: UmbralCfg = {
  side: 1,
  byFase: {
    correctores: { correct: { cells: 2, frac: 0.3 }, tachon: { mul: 0.6 }, name: '¡FE DE ERRATAS!', line: 'Se reparan y te tachan.' },
    disruptores: { gale: 42, chaos: 1.2, atk: 1.2, name: '¡GRAFITI EN EL CIELO!', line: 'Viento loco y todo pega más.' },
    titiriteros: { hand: { r: 320, k: 900, swing: 170, up: 400 }, atk: 1.3, name: '¡HILOS!', line: 'Una mano mueve las cosas.' },
    umbral: { correct: { cells: 1, frac: 0.25 }, tachon: { mul: 0.7 }, hand: { r: 240, k: 600, swing: 130, up: 420 }, atk: 1.5, name: '¡EL UMBRAL!', line: 'Todo junto. Ahora va en serio.' },
  },
};

// ------------------------------------------------------------------ H62: the Correctores' plan (two phases)
/**
 * The Correctores fight in two phases: LA CORRECCIÓN (their rules: they repair, they cross out) and, from half their
 * hull (or turn 5), EL PLAN — the page they want to write starts writing itself: the same rules, a little stronger.
 * The phase change is where the CIRCUS MALUS Momento plays (H62_MOMENTO below).
 */
export const CORRECTORES_PHASES: FaseDef[] = [
  { id: 'correccion', name: 'La Corrección', telegraph: 'Todo perfecto: se reparan y tachan tu mejor elemento.', env: { calm: true, layer: 'sea' } },
  {
    id: 'el_plan',
    name: 'El Plan',
    at: { hp: 0.5, turn: 5 },
    telegraph: 'EL PLAN: el mundo perfecto empieza a escribirse. Corrigen más rápido y sus tiros pegan más.',
    env: { calm: true, layer: 'sky' },
    effects: ['umbral'],
  },
];
export const CORRECTORES_PLAN: UmbralRules = { correct: { cells: 2, frac: 0.35 }, tachon: { mul: 0.6 }, atk: 1.1, name: '¡EL PLAN!', line: 'Corrigen más rápido y pegan más. No dejes de cambiar de elemento.' };
/**
 * MOMENTO: circus_malus (H62, phase change) — the CIRCUS MALUS Momento plays INSIDE this battle when it enters EL PLAN,
 * while the battle waits between the two phases (battle/fx/fasesFx.ts › FasesFx.stage awaits the interlude). The
 * Momento engine plugs in with:
 *   registerFaseInterlude(H62_MOMENTO.battle, H62_MOMENTO.fase, (change) => playCircusMomento(change))   (battle/fases.ts)
 * Presentation only: the sim already applied the phase, so the outcome (and the estimate worker) never changes.
 */
// MOMENTO: circus_malus (H62, phase change)
export const H62_MOMENTO = { battle: 'umbral_correctores', fase: 'el_plan', song: 'circus_malus' } as const;

// ------------------------------------------------------------------ the three battles
interface O4Spec {
  id: O4BattleId;
  stage: number;
  title: string;
  enemy: string;
  captain: string;
  line: string;
  archetype: string;
  enemyCats: string[];
  powerMul: number;
  hpMulX: number;
  /** power: default O4_CATA_POWER */
  cata?: { id: CataId; by: string; power?: number };
  /** the battle's rules besides the cataclysm, read when the battle is built */
  rules: () => StageRules;
  intro: () => string[];
  color: number;
  reward: StoryBattleDef['reward'];
  /** difficulty band (state/sys/storyScale.ts); default historia */
  band?: StoryBattleDef['band'];
  wavePierce?: number;
}

/**
 * Tuning (scripts/balance-o4.ts): headless sims, AI aim normal + hard, 3 seed bases × 32 seeds (192 fights per battle
 * and fixture, 2026-10-09), the same sim / AI / turn flow as the screen and the estimate worker:
 *   2026-10-10 (16 seeds × 2 bases, rupturas-o4 crew = post-finale): Archipiélago 100 % · t5.9 · −2 % hull;
 *   Correctores 100 % · t8.2 · −28 % (EL PLAN at half their hull, where the CIRCUS MALUS Momento plays);
 *   El Umbral ×1.35 · hp×5 · phase attacks 1.2/1.3/1.5 → 100 % · t7.0 · −9 % (normal) / −11 % (hard), most fights
 *   reach the fourth phase. No walls — but the final boss was a walkover.
 *   2026-10-10 BALANCE DE JEFES (state/sys/storyScale.ts, doc 27 §Balance de jefes): each battle has a difficulty band;
 *   H62 is a «jefe» (×1.1 on top of powerMul) and H63 the «final» (×1.56, plus PUERTAS CERRADAS), and past Nv50 both follow your crew's level
 *   and ★ (the enemy level is no longer capped at 50). Numbers per crew (Nv30–100) in the doc.
 * Losing costs nothing but the try; it scales with your fleet like every story battle (the story never walls).
 */
export const O4_CATA_POWER = 4;
export const O4_SPECS: O4Spec[] = [
  {
    id: 'umbral_suenos',
    stage: 8,
    title: 'EL ARCHIPIÉLAGO DE LOS SUEÑOS',
    enemy: 'La Siesta Flotante',
    captain: 'Duermevela',
    line: 'Shh… no despiertes a nadie. Aquí se pelea soñando.',
    archetype: 'galeon_niebla',
    enemyCats: ['e_duermevela', 'r_sonambulo', 'c_almohadon', 'c_almohadon'],
    powerMul: 1.2,
    hpMulX: 3,
    // BALANCE DE JEFES (doc 27): the only Parte II fight without a power of its own was a walkover (100 %, −1 % hull,
    // the same with or without the dreams: every dream hits both sides). LA LUNA of the siesta falls every 3 turns and
    // every dream changes how your shots reach her seal (TODO FLOTA, VENTOLERA, EL AGUA ES SUELO) → ~86–98 %, −20 % hull
    cata: { id: 'moon', by: 'DUERMEVELA', power: 3.5 },
    rules: () => ({ dream: dreamCfgFor(G.s) }),
    intro: () => [
      ...dreamIntro(dreamCfgFor(G.s)),
      'Su tripulación es {magic} Magia, {shadow} Sombra y {cosmic} Cósmico. {light} Luz le pega ×1.5 a la Magia y a la Sombra; {magic} Magia y {void} Vacío, a los Almohadones.',
    ],
    color: 0x8f7ad8,
    reward: { cat: 'c_almohadon' },
  },
  {
    id: 'umbral_correctores',
    band: 'jefe',
    stage: 9,
    title: 'LOS CORRECTORES TIENEN UN PLAN',
    enemy: 'La Redacción',
    captain: 'La Redacción',
    line: 'Un mundo sin erratas. Sin sorpresas. Sin tachones… salvo los nuestros.',
    archetype: 'fortaleza_relojera',
    enemyCats: ['r_tachon', 'r_ronron', 'r_espejito', 'r_farolillo'],
    // band jefe (×1.1, storyScale.ts): ×1.31 here → ×1.44 of your Poder (BALANCE DE JEFES, doc 27)
    powerMul: 1.31,
    hpMulX: 3,
    cata: { id: 'sun', by: 'LA REDACCIÓN' },
    rules: () => ({ fases: { side: 1, phases: CORRECTORES_PHASES } satisfies FasesCfg, umbral: { side: 1, base: UMBRAL_RULES.byFase!.correctores, byFase: { el_plan: CORRECTORES_PLAN } } }),
    intro: () => [
      'CORRECCIÓN: cada turno reparan sus 2 celdas más rotas. Pégales duro y en el mismo lugar. A la mitad de su casco empieza EL PLAN.',
      'TACHÓN: el elemento que más les pegó en tu turno queda TACHADO tu siguiente turno (×0.6). Cambia de elemento.',
      '{time} Tiempo le pega ×1.5 al Vacío y a la Gravedad; {earth} Tierra, al Cristal y a la Luz.',
    ],
    color: 0xf4f4f0,
    reward: { cat: 'r_tachon' },
  },
  {
    id: 'umbral_final',
    band: 'final',
    stage: 9,
    title: 'EL UMBRAL',
    enemy: 'La Bisagra del Archivo',
    captain: 'Bisagra',
    line: 'Todo lo que se abre, se cierra. Yo decido cuándo.',
    archetype: 'observatorio',
    enemyCats: ['l_bisagra', 'r_ronron', 'e_brecha', 'r_grafitera'],
    powerMul: 1.35,
    hpMulX: 5,
    // PUERTAS CERRADAS (BALANCE DE JEFES, doc 27): with her whole escort aboard, Ronrón's and Grafitera's waves crossed
    // every wall to your core: the final hinged on owning the two elements that kill them first (38 % vs 88 % by crew).
    // The Bisagra closes every door: no wave crosses a wall here — theirs or yours.
    wavePierce: 1,
    rules: () => ({ fases: { side: 1, phases: UMBRAL_PHASES } satisfies FasesCfg, umbral: UMBRAL_RULES }),
    intro: () => [
      'CUATRO FASES: LOS CORRECTORES → LOS DISRUPTORES (25% de daño) → LOS TITIRITEROS (50%) → EL UMBRAL (75%). Cada una cambia las reglas.',
      'Corrección y tachón · viento loco y todo ×1.2 · gravedad ×0.3 y una mano que jala los tiros · todo junto.',
      '{cosmic} Cósmico y {ice} Hielo le pegan ×1.5 a la jefa de {time} Tiempo; {magic} Magia y {time} Tiempo, a su escolta de {void} Vacío.',
      'PUERTAS CERRADAS: aquí ninguna onda atraviesa paredes. Ni las de su escolta ni las tuyas.',
    ],
    color: 0xc9a8ff,
    reward: { cat: 'l_bisagra' },
  },
];

for (const s of O4_SPECS) {
  const def: StoryBattleDef = {
    id: s.id,
    mission: O4_BATTLE_MISSION[s.id],
    // post-story rewards and the Marea Sin Nombre's sky
    zone: 6,
    stage: s.stage,
    title: s.title,
    enemy: s.enemy,
    captain: s.captain,
    line: s.line,
    archetype: s.archetype,
    enemyCats: [...s.enemyCats],
    powerMul: s.powerMul,
    hpMulX: s.hpMulX,
    get rules(): StageRules {
      const cata = s.cata ? { cataclysm: { id: s.cata.id, side: 1 as const, by: s.cata.by, first: 1, every: 3, power: s.cata.power ?? O4_CATA_POWER } } : {};
      return { ...s.rules(), ...cata };
    },
    get intro(): string[] {
      return [...s.intro(), ...(s.cata ? [`${poderDe(s.cata.by)}: ${CATA_INFO[s.cata.id].name} cada 3 turnos · TÍRALE A SU SELLO`] : [])];
    },
    color: s.color,
    reward: s.reward,
    band: s.band ?? 'historia',
    ...(s.wavePierce !== undefined ? { wavePierce: s.wavePierce } : {}),
  };
  STORY_BATTLES[def.id] = def;
}
