/**
 * Parte II · Oleada 2 «EL CIELO DESPIERTA» (docs/part-ii/22-oleada-2.md · guion 13). Same pattern as rupturas.ts /
 * grietas.ts: story battles, flags and the systems this wave brings. Imported by state/index.ts after rupturas.ts.
 *
 *   H42 Trombas                 use_feature region_invertidas  (the waterspouts lift you: flag region:invertidas)
 *   H43 El Kit de Vuelo         use_feature kit_vuelo          (install it on a ship of yours, in the Astillero)
 *   H44 Islas Invertidas        win_battle cielo_invertidas    (first sky battle) → GRAVEDAD + Plomito
 *   H45 Corona Celeste          use_feature region_corona      (flag region:corona) → Hélice joins (oleada2Flow)
 *   H46 La embajada             damage_pct cielo_embajada 30%  (it leaves at turn 7; they came for Canelo)
 *   H47 El otro almirante       win_battle cielo_almirante     (gravity inverts over your ship from turn 3)
 *   H48 Luzterna lo sabe        use_feature linterna           (a 2-option choice, remembered: linternaChoice())
 *   H49 Primordial de la Gravedad win_battle cielo_masamadre   (a mass in the middle of the field) → flag oleada2_fin
 *
 * Missions + beats: data/rupturas/historia-o2.json. When each beat plays: ui/story/rupturasScriptO2.ts. The screens
 * (Astillero's VUELO tab, the choice, Hélice's arrival, the sky preflight): app/oleada2Flow.ts + panels/shipyard/FlightTab.ts.
 */
import { G } from '../game';
import { registerPatch } from '../patches';
import { STORY_BATTLES, StoryBattleDef } from './storyBattles';
import { adopt } from './cats';
import { claimReward, rewardClaimed } from './rupturasLedger';
import { CATA_INFO, poderDe } from '../../battle/cataclysm';
import type { CataId } from '../../battle/cataclysm';
import type { StageRules } from '../../battle/sim';
import type { SkyCfg } from '../../battle/cielo';
import { REGION_INFO, RegionId } from '../../regions';
import { registerWorldState, active as wsActive, done as wsDone, seen as wsSeen, type WorldLook, type WorldSave } from './worldState';

const done = (id: string) => !!G.s?.missions?.done.includes(id);
const seen = (id: string) => !!G.s?.missions && (G.s.missions.active.includes(id) || G.s.missions.done.includes(id));

/** Oleada 1 finished (H41 «La letra en el margen»): the sky can wake up */
export const oleada2Open = () => done('H41');

// ------------------------------------------------------------------ the sky islands on the CARTA
/** the mission whose appearance puts each sky island on the chart (REGION_INFO.mapFlag); flags stay forever */
export const KIT_OFFERED = 'kit_vuelo:ofrecido';
export const O2_REGION_MISSION: Partial<Record<RegionId, string>> = { invertidas: 'H42', corona: 'H45' };
export function syncO2Flags() {
  if (!G.s?.missions) return;
  for (const [r, m] of Object.entries(O2_REGION_MISSION)) {
    const f = REGION_INFO[r as RegionId]?.mapFlag;
    if (f && m && seen(m) && !G.has(f)) G.flag(f);
  }
  // the glossary's Kit de Vuelo / sky entries open with the offer (H43)
  if (seen('H43') && !G.has(KIT_OFFERED)) G.flag(KIT_OFFERED);
}
G.on('mission', (p) => {
  if (p.kind !== 'progress') syncO2Flags();
});
G.afterLoad.push(syncO2Flags);

// ------------------------------------------------------------------ KIT DE VUELO (your own ship becomes an aerobarco)
/**
 * Save data (optional, absent = never had one): `G.s.ext.flightKit = { level, ships, at }`.
 *   level  1 Kit de Vuelo (it flies: required for sky battles) · 2 Estabilizadores · 3 Ancla de Nube — global, like Mk
 *   ships  the ships of YOURS that carry it (they keep their id, name, crew, layout and history: nothing else changes)
 * The first install is the mechanic's gift (H43); another ship costs a little; levels are bought in the Astillero.
 */
export interface FlightKitSave {
  level: number;
  ships: string[];
  /** when the first one was installed (ms) */
  at?: number;
}
export interface KitLevelDef {
  level: number;
  name: string;
  what: string;
  /** seconds of gold income · scrap · blueprints · Gravedad crystals */
  cost: { goldSecs: number; scrap: number; blueprint: number; gravity: number };
}
export const KIT_LEVELS: KitLevelDef[] = [
  { level: 1, name: 'KIT DE VUELO', what: 'Tu barco vuela (y sigue siendo tuyo). Sin él no hay batallas en el cielo.', cost: { goldSecs: 0, scrap: 0, blueprint: 0, gravity: 0 } },
  { level: 2, name: 'ESTABILIZADORES', what: 'En el cielo, el viento en capas empuja 30% menos tus tiros.', cost: { goldSecs: 3600, scrap: 300, blueprint: 8, gravity: 10 } },
  { level: 3, name: 'ANCLA DE NUBE', what: 'En el cielo tus módulos rotos no se caen al vacío: pelean con las reglas del mar.', cost: { goldSecs: 7200, scrap: 600, blueprint: 16, gravity: 25 } },
];
/** installing on another ship (the first one is free) */
export const KIT_EXTRA_SHIP = { goldSecs: 1800, scrap: 150 };
/** the Corona natives fly with stabilizers */
export const ENEMY_KIT = 2;

/** pure: a well-formed copy of whatever is in the save (tests call it directly) */
export function normalizeFlightKit(raw: unknown): FlightKitSave | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const ships = Array.isArray(r.ships) ? [...new Set(r.ships.filter((x): x is string => typeof x === 'string' && !!x))] : [];
  const lv = typeof r.level === 'number' && Number.isFinite(r.level) ? Math.floor(r.level) : 1;
  const out: FlightKitSave = { level: ships.length ? Math.max(1, Math.min(KIT_LEVELS.length, lv)) : 0, ships };
  if (typeof r.at === 'number' && Number.isFinite(r.at)) out.at = r.at;
  return out;
}
function kitSave(): FlightKitSave | null {
  return normalizeFlightKit(G.s.ext?.flightKit);
}
function writeKit(k: FlightKitSave) {
  (G.s.ext ??= {}).flightKit = k;
}
G.afterLoad.push(() => {
  const ext = G.s.ext;
  if (!ext || ext.flightKit === undefined) return;
  const k = normalizeFlightKit(ext.flightKit);
  if (k) ext.flightKit = k;
  else delete ext.flightKit;
});
/**
 * H43 asks you to install the kit. A ship that already flies (the narrative reset replays Parte II and keeps your
 * ships as they are) answers it right away: no deadlock, nothing to buy twice.
 */
function kitAlreadyAnswers() {
  if (G.s.missions?.active.includes('H43') && kitShips().length) {
    const base = G.s.missions.progress['H43:feature_kit_vuelo'] ?? 0;
    if ((G.s.counters.feature_kit_vuelo ?? 0) <= base) G.count('feature_kit_vuelo');
  }
}
G.on('mission', (p) => {
  if (p.id === 'H43' && p.kind === 'new') kitAlreadyAnswers();
});
G.afterLoad.push(kitAlreadyAnswers);

/** the mechanic already offered it (H43 appeared) */
export function flightKitAvailable() {
  return seen('H43') || !!kitSave()?.ships.length;
}
/** ships of yours with the kit (only ships you own) */
export function kitShips(): string[] {
  const k = kitSave();
  return k ? k.ships.filter((s) => G.s.ship.owned.includes(s)) : [];
}
export function hasFlightKit(shipId = G.s.ship.active) {
  return kitShips().includes(shipId);
}
/** the kit level (0 = no ship has it) */
export function flightKitLevel() {
  return kitShips().length ? kitSave()!.level : 0;
}
const goldFor = (secs: number) => (secs <= 0 ? 0 : Math.max(2000, Math.round(G.goldPerSec * secs)));
/** what installing on `shipId` costs (null = free: the mechanic's gift) */
export function installCost(): { gold: number; scrap: number } | null {
  if (!kitShips().length) return null;
  return { gold: goldFor(KIT_EXTRA_SHIP.goldSecs), scrap: KIT_EXTRA_SHIP.scrap };
}
export function canInstall(shipId = G.s.ship.active): { ok: boolean; why: string } {
  if (!flightKitAvailable()) return { ok: false, why: 'Todavía nadie te ofrece uno' };
  if (!G.s.ship.owned.includes(shipId)) return { ok: false, why: 'Ese barco no es tuyo' };
  if (hasFlightKit(shipId)) return { ok: false, why: 'Ya vuela' };
  const c = installCost();
  if (c && G.s.gold < c.gold) return { ok: false, why: 'Faltan Doblones' };
  if (c && G.s.scrap < c.scrap) return { ok: false, why: 'Falta Chatarra' };
  return { ok: true, why: '' };
}
/** turn your ship into an aerobarco (it keeps its id, name, crew, layout and history) */
export function installFlightKit(shipId = G.s.ship.active): boolean {
  if (!canInstall(shipId).ok) return false;
  const c = installCost();
  if (c && !G.spend({ gold: c.gold, scrap: c.scrap })) return false;
  const k = kitSave() ?? { level: 1, ships: [] };
  k.ships.push(shipId);
  k.level = Math.max(1, k.level);
  k.at ??= Date.now();
  writeKit(k);
  G.count('feature_kit_vuelo');
  G.count(`kit_vuelo_${shipId}`);
  G.recalc();
  return true;
}
export function kitUpgradeCost(): { gold: number; scrap: number; blueprint: number; gravity: number; next: KitLevelDef } | null {
  const lv = flightKitLevel();
  const next = KIT_LEVELS[lv];
  if (!lv || !next) return null;
  return { gold: goldFor(next.cost.goldSecs), scrap: next.cost.scrap, blueprint: next.cost.blueprint, gravity: next.cost.gravity, next };
}
export function canUpgradeKit(): { ok: boolean; why: string } {
  const lv = flightKitLevel();
  if (!lv) return { ok: false, why: 'Primero instala el kit' };
  const c = kitUpgradeCost();
  if (!c) return { ok: false, why: 'Kit al máximo' };
  if (G.s.gold < c.gold) return { ok: false, why: 'Faltan Doblones' };
  if (G.s.scrap < c.scrap) return { ok: false, why: 'Falta Chatarra' };
  if (G.s.blueprint < c.blueprint) return { ok: false, why: 'Faltan Planos' };
  if ((G.s.crystals.gravity ?? 0) < c.gravity) return { ok: false, why: 'Faltan cristales de Gravedad' };
  return { ok: true, why: '' };
}
export function upgradeFlightKit(): boolean {
  if (!canUpgradeKit().ok) return false;
  const c = kitUpgradeCost()!;
  if (!G.spend({ gold: c.gold, scrap: c.scrap, blueprint: c.blueprint })) return false;
  if (c.gravity) {
    G.s.crystals.gravity = (G.s.crystals.gravity ?? 0) - c.gravity;
    G.emit('res', { key: 'crystal', delta: -c.gravity, source: 'gravity' });
  }
  const k = kitSave()!;
  k.level = c.next.level;
  writeKit(k);
  G.count(`kit_vuelo_lv${k.level}`);
  G.recalc();
  return true;
}

// ------------------------------------------------------------------ H48: the lantern (a choice, remembered)
export type LinternaChoice = 'apagar' | 'encendida';
export const LINTERNA_FLAG: Record<LinternaChoice, string> = { apagar: 'linterna:apagala', encendida: 'linterna:encendida' };
/** what you told Luzterna in H48 (null = not asked yet). Later dialogs and reactions read it. */
export function linternaChoice(): LinternaChoice | null {
  if (G.has(LINTERNA_FLAG.apagar)) return 'apagar';
  if (G.has(LINTERNA_FLAG.encendida)) return 'encendida';
  return null;
}
/** the choice is open: H48 is active (answering completes it). A replay after the narrative reset asks again. */
export function linternaPending() {
  return !!G.s.missions?.active.includes('H48');
}
/** answer (cosmetic: neither option costs or gives anything) — completes H48; the newest answer is the one remembered */
export function chooseLinterna(c: LinternaChoice): boolean {
  if (!linternaPending()) return false;
  for (const k of Object.values(LINTERNA_FLAG)) delete G.s.flags[k];
  G.flag(LINTERNA_FLAG[c]);
  G.count('feature_linterna');
  return true;
}

// ------------------------------------------------------------------ cats the story hands over outside a battle
/**
 * H45: Hélice decides to come with you. Paid once per save, forever (the Parte II claimed-rewards ledger,
 * rupturasLedger: `cat:mission_H45`), revealed by app/oleada2Flow.
 */
export const O2_STORY_CATS: { species: string; after: string }[] = [{ species: 'r_helice', after: 'H45' }];
const o2CatKey = (c: { after: string }) => `cat:mission_${c.after}`;
export function o2PendingCats(): string[] {
  return O2_STORY_CATS.filter((c) => done(c.after) && !rewardClaimed(o2CatKey(c))).map((c) => c.species);
}
/** adopt it (once: a replay or a narrative reset never pays twice) */
export function claimO2Cat(species: string) {
  const c = O2_STORY_CATS.find((k) => k.species === species);
  if (!c || rewardClaimed(o2CatKey(c))) return null;
  claimReward(o2CatKey(c));
  const r = adopt(species);
  G.save();
  return r;
}

// ------------------------------------------------------------------ the four sky battles
interface SkySpec {
  id: string;
  mission: string;
  stage: number;
  title: string;
  enemy: string;
  captain: string;
  line: string;
  archetype: string;
  enemyCats: string[];
  powerMul: number;
  hpMulX: number;
  /** the battle's sky (gravity 0.7 + layered wind + islets are the default) */
  sky?: SkyCfg;
  rules?: Omit<StageRules, 'cataclysm' | 'sky'>;
  cata?: { id: CataId; by: string };
  intro: string[];
  color: number;
  reward: StoryBattleDef['reward'];
  /** difficulty band (state/sys/storyScale.ts); default historia */
  band?: StoryBattleDef['band'];
  grade?: 'damage';
  passPct?: number;
}
/**
 * Tuning (docs/part-ii/22-oleada-2.md §5, scripts/balance-sky.ts): headless sims on test-saves/post-finale.json's crew,
 * Kit de Vuelo level 1, AI aim normal + hard, 3 seed bases × 32 seeds (192 fights each, 2026-10-09):
 *   Islas Invertidas ×1.2 184/192 in ~6.0 turns · La embajada ×1.2 189/192 (passes on 30% or a K.O. of its crew, ~4.9) ·
 *   El otro almirante ×1.2 185/192 in ~9.1 (the inversion stretches it) · Masa Madre ×1.3 187/192 in ~4.5
 *   (Kit level 3: 64/64). At ×1.35 the finale fell to ~90%: the mass + the falling moon make it swingy above ×1.3.
 * Losing costs nothing but the try; it scales with your fleet like every story battle (the story never walls).
 */
export const O2_CATA_POWER = 4;
export const O2_SPECS: SkySpec[] = [
  {
    id: 'cielo_invertidas',
    mission: 'H44',
    stage: 8,
    title: 'ISLAS INVERTIDAS',
    enemy: 'La Cascada al Revés',
    captain: 'Cascada',
    line: '¿Por qué estás de cabeza? Ah, no: el que está bien soy yo.',
    archetype: 'templo_flotante',
    // MOMENTO: liky_fight (H44, between phase 1 and 2) — TWO PHASES (battle/fases.ts): phase 1 on the sea (the sky rules
    // sleep: SkyCfg.from), then at 35 % damage (or round 4) the LIKY FIGHT «Momento musical» plays (src/momentos,
    // docs/part-ii/29) and phase 2 wakes the sky (gravity ×0.7, layered wind, islets, the void). The sim switches the
    // phase deterministically; the Momento only plays between the phases (screen and estimate agree).
    sky: { from: 'cielo' },
    rules: {
      fases: {
        side: 1,
        phases: [
          { id: 'mar', name: 'El mar', env: { layer: 'sea' } },
          {
            id: 'cielo',
            name: 'El cielo',
            at: { hp: 0.35, turn: 4 },
            telegraph: 'LA FIESTA SUBE AL CIELO: todo pesa x0.7, el viento sopla por pisos y hay islotes.',
            env: { g: 0.7, layer: 'sky' },
            effects: ['skyWake'],
          },
        ],
      },
    },
    enemyCats: ['e_cascada', 'r_contrapeso', 'c_plomito', 'c_globito'],
    powerMul: 1.2,
    hpMulX: 3,
    cata: { id: 'meteors', by: 'LAS ISLAS INVERTIDAS' },
    intro: [
      'DOS FASES: empieza en el MAR. Al 35% de daño (o en la ronda 4) su barco sube al CIELO y tú detrás.',
      'EL CIELO: todo pesa ×0.7, el viento sopla distinto por pisos y los ISLOTES paran los tiros. Un módulo tuyo muy roto se cae al vacío.',
      'Sus gatos usan un elemento que todavía no conoces: GRAVEDAD. {void} Vacío y {time} Tiempo le pegan ×1.5; ella le pega ×1.5 a tu {storm} Tormenta y a tu {crystal} Cristal.',
    ],
    color: 0x3e6fd8,
    reward: { element: 'gravity', cat: 'c_plomito', crystals: 20 },
  },
  {
    id: 'cielo_embajada',
    mission: 'H46',
    stage: 9,
    title: 'LA EMBAJADA',
    enemy: 'La Embajada Blanca',
    captain: 'El Embajador',
    line: 'Solo queremos ayudar. Su gato es impaciente. Lo vamos a arreglar.',
    archetype: 'observatorio',
    enemyCats: ['r_ronron', 'r_ronron', 'c_globito', 'r_contrapeso'],
    powerMul: 1.2,
    hpMulX: 3,
    sky: { correct: { side: 1, cells: 2, frac: 0.4 }, target: { side: 1, species: 'c_canelo', mul: 1.25 } },
    rules: { retreat: { side: 1, turn: 7 } },
    intro: [
      'No hay que hundirla: hazle al menos 30% de daño antes de que se vaya (al final del turno 7).',
      'CORRECCIÓN: cada turno se repara sus 2 celdas más rotas. Pégale duro y en el mismo lugar.',
      'Vienen por Canelo: lo van a buscar a él. Y él pega ×1.25 (la impaciencia es justo lo que quieren quitarle).',
    ],
    color: 0xf4f4f0,
    reward: { cat: 'r_ronron' },
    grade: 'damage',
    passPct: 30,
  },
  {
    id: 'cielo_almirante',
    mission: 'H47',
    stage: 9,
    title: 'EL OTRO ALMIRANTE',
    enemy: 'La Errata Mayor',
    captain: 'El Almirante',
    line: 'Yo daba las órdenes. Las ballenas obedecen. Como todo debería.',
    archetype: 'galeon_runas',
    enemyCats: ['e_cascada', 'r_ronron', 'r_contrapeso', 'r_helice'],
    powerMul: 1.2,
    hpMulX: 3,
    sky: { invert: { turn: 3, side: 0 } },
    cata: { id: 'sun', by: 'LA ERRATA MAYOR' },
    intro: [
      'Desde el turno 3 «corrige» la gravedad sobre TU barco: lo que dispares cerca de ti va a querer subir.',
      'Trae una Hélice que SÍ obedece. {void} Vacío y {time} Tiempo le pegan ×1.5 a la Gravedad.',
    ],
    color: 0xe8e4d8,
    reward: { element: 'gravity', crystals: 15 },
  },
  {
    id: 'cielo_masamadre',
    band: 'jefe',
    mission: 'H49',
    stage: 9,
    title: 'MASA MADRE',
    enemy: 'El Horno del Cielo',
    captain: 'Masa Madre',
    line: 'Ven, acércate. Todo se acerca tarde o temprano.',
    archetype: 'fortin_piedra',
    enemyCats: ['l_masamadre', 'e_cascada', 'r_contrapeso', 'c_plomito'],
    // band jefe (×1.1, storyScale.ts): ×1.32 here → ×1.45 of your Poder (was ×1.3; BALANCE DE JEFES, doc 27)
    powerMul: 1.32,
    hpMulX: 3,
    sky: { mass: { r: 520, k: 650 } },
    cata: { id: 'moon', by: 'MASA MADRE' },
    intro: [
      'MASA: en medio del cielo hay un peso que jala TODOS los tiros hacia el centro. Los tuyos y los suyos.',
      'La primordial de la Gravedad. {void} Vacío y {time} Tiempo le pegan ×1.5; su Gravedad le pega ×1.5 a tu {storm} Tormenta.',
    ],
    color: 0xf0b44c,
    reward: { cat: 'l_masamadre' },
  },
];
export const O2_BATTLES = O2_SPECS.map((s) => s.id);
/** the sky battles: you need a ship with the Kit de Vuelo to fight them (app/oleada2Flow preflight) */
export const SKY_BATTLES = new Set(O2_BATTLES);
export const isSkyBattle = (id: string) => SKY_BATTLES.has(id);

/** the battle's sky with both kits (yours is read live: it changes as you upgrade it) */
export function skyFor(s: SkySpec): SkyCfg {
  return { islets: 2, ...s.sky, kit: [Math.max(1, flightKitLevel()), ENEMY_KIT] };
}

for (const s of O2_SPECS) {
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
    enemyCats: [...s.enemyCats],
    powerMul: s.powerMul,
    hpMulX: s.hpMulX,
    get rules(): StageRules {
      const cata = s.cata ? { cataclysm: { id: s.cata.id, side: 1 as const, by: s.cata.by, first: 1, every: 3, power: O2_CATA_POWER } } : {};
      return { ...s.rules, ...cata, sky: skyFor(s) };
    },
    intro: [...s.intro, ...(s.cata ? [`${poderDe(s.cata.by)}: ${CATA_INFO[s.cata.id].name} cada 3 turnos · TÍRALE A SU SELLO`] : [])],
    color: s.color,
    reward: s.reward,
    band: s.band ?? 'historia',
    ...(s.grade ? { grade: s.grade, passPct: s.passPct, damageFragments: false } : {}),
  };
  STORY_BATTLES[def.id] = def;
}

/** the sky battle the active story mission asks for (null = none) */
export function activeSkyBattle(): string | null {
  for (const id of G.s.missions.active) {
    const b = O2_SPECS.find((s) => s.mission === id);
    if (b) return b.id;
  }
  return null;
}

// ------------------------------------------------------------------ the world, as the story says it is (20 §1 · band 40–69)
/**
 * «Si la historia lo dice, pasa en el mundo» (docs/part-ii/22 «Pasada de cine»). Derived ONLY from mission progress
 * (+ one beat for the lantern's invitation): a reload, a trip to the CARTA or the Parte II narrative reset land on the
 * same world. Daytime states follow the player's real clock (`clock`, like O1's `cielo_roto`); the lantern's night is
 * a story night. Part I saves never match any of them. What lives IN the sky (the waterspouts, the hanging islands,
 * Corona Celeste, the galleon, the signal, your aerobarco) is drawn by ui/story/o2Sky.ts from the same progress.
 *
 *   o2_trombas    H42 active: a windy, cooler day — three waterspouts stand up out of the Primer Mar
 *   o2_cielo      H43–H44 active: the sky is awake — airy blue light, wind; islands hang up there
 *   o2_corona     H45–H46 active: Corona Celeste's «perfect» white creeps into the light (flatter, whiter)
 *   o2_almirante  H47 active: a cold light; a white galleon waits among the hanging islands
 *   o2_senal      H48 active: night at your faro — the lantern is a signal (TOCA EL FARO once she has asked)
 *   o2_masa       H49 active: warm oven-gold light; Corona tilts toward its biggest oven
 *   o2_costura    H49 done: day again, but the seam in the sky is wider than ever (it stays)
 */
export const O2_STATES = {
  trombas: 'o2_trombas',
  cielo: 'o2_cielo',
  corona: 'o2_corona',
  almirante: 'o2_almirante',
  senal: 'o2_senal',
  masa: 'o2_masa',
  costura: 'o2_costura',
} as const;

export const O2_LOOKS: Record<keyof typeof O2_STATES, Partial<WorldLook>> = {
  trombas: { exposure: 1, tint: 0xf1f5ff, saturation: 1, seam: 0.65, starFall: 0.08, stars: 0.1, vignette: 0.06, ambience: 'wind', music: 'island' },
  cielo: { exposure: 1.02, tint: 0xeef4ff, saturation: 1.03, seam: 0.7, starFall: 0.1, stars: 0.12, ambience: 'wind', music: 'island' },
  corona: { exposure: 1.04, tint: 0xf7f7fb, saturation: 0.86, lift: 0x050505, seam: 0.7, starFall: 0.06, stars: 0.1, vignette: 0.05, ambience: 'wind', music: 'island' },
  almirante: { exposure: 0.96, tint: 0xe4eaf6, saturation: 0.84, lift: 0x04060c, seam: 0.75, starFall: 0.06, stars: 0.12, vignette: 0.18, dayLife: 0.7, ambience: 'wind', music: 'island' },
  senal: { exposure: 0.6, tint: 0xa6b4ff, saturation: 0.82, lift: 0x0a0c26, sky: 0.92, skyTint: 0xc8d4ff, stars: 0.85, starFall: 0.12, aurora: 0.12, seam: 0.55, lights: 1, faro: 1, seaGlow: 0.55, vignette: 0.5, dayLife: 0, cats: 0.55, ambience: 'night_astral', music: 'island' },
  masa: { exposure: 0.99, tint: 0xfff0d8, saturation: 1.06, seam: 0.8, starFall: 0.05, stars: 0.08, vignette: 0.08, ambience: 'wind', music: 'island' },
  costura: { seam: 0.95, starFall: 0.08, stars: 0.16 },
};

/** the lantern already asked (H48 part a played): the faro invites until you answer */
export const LINTERNA_ASKED = 'b48_linterna#a';
const o2ws = (id: keyof typeof O2_STATES, priority: number, when: (s: WorldSave) => boolean, note: string, o: { blend?: number; clock?: boolean; prompt?: { target: string; text: string; when?: (s: WorldSave) => boolean } } = {}) =>
  registerWorldState({ id: O2_STATES[id], priority, wave: 'O2', blend: o.blend ?? 5, note, when, look: O2_LOOKS[id], ...(o.clock ? { clock: true } : {}), ...(o.prompt ? { prompt: o.prompt } : {}) });

// the night holds until her answer's scene has played (b48_linterna#b): no daylight flash between question and answer
o2ws('senal', 60, (s) => wsActive(s, 'H48') || (wsDone(s, 'H48') && !wsSeen(s, 'b48_linterna#b') && !wsSeen(s, 'b48_linterna') && !wsDone(s, 'H49')), 'H48 activa (y hasta que suena su respuesta): de noche en tu faro; la linterna manda una señal.', {
  blend: 5,
  prompt: { target: 'faro', text: 'TOCA EL FARO', when: (s) => wsActive(s, 'H48') && wsSeen(s, LINTERNA_ASKED) },
});
o2ws('masa', 55, (s) => wsActive(s, 'H49'), 'H49 activa: luz dorada de horno; Corona Celeste se inclina.', { clock: true });
o2ws('almirante', 50, (s) => wsActive(s, 'H47'), 'H47 activa: luz fría; un galeón blanco entre las islas colgantes.', { clock: true });
o2ws('corona', 48, (s) => wsActive(s, 'H45') || wsActive(s, 'H46'), 'H45–H46: el blanco «perfecto» de Corona Celeste se cuela en la luz.', { clock: true });
o2ws('trombas', 46, (s) => wsActive(s, 'H42'), 'H42 activa: día de viento; tres trombas salen del Primer Mar.', { clock: true, blend: 4 });
o2ws('cielo', 44, (s) => wsActive(s, 'H43') || wsActive(s, 'H44'), 'H43–H44: el cielo despierto; aire azul y viento.', { clock: true });
o2ws('costura', 41, (s) => wsDone(s, 'H49'), 'Después de la Oleada 2: de día, con la costura del cielo más ancha que nunca.', { clock: true, blend: 7 });

// ------------------------------------------------------------------ old saves
registerPatch({
  id: '2026-10-oleada2-cielo-despierta',
  why: 'Parte II · Oleada 2 (H42–H49) arranca después de H41: quien ya cerró la Oleada 1 debe enterarse.',
  run() {
    if (!oleada2Open()) return;
    return 'Empezó EL CIELO DESPIERTA (Parte II · Oleada 2). Hay remolinos en el mar que suben: toca la misión «Trombas».';
  },
});

/** income seconds → gold, for the UI (same rule the costs use) */
export const kitGold = goldFor;
