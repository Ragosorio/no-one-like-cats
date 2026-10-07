/** Campaign: zones/stages, battle setup (SP/EP scaling), rewards for victory/defeat, boss unlocks, errands. */
import { G } from '../game';
import { CATS, CONTENT, ZONES, StageDef, catDef, stageDef, zoneBoss, ROLE_BY_ID } from '../../data/content';
import { BAL, absStage, battleCrystals, battleGold, battleScrap, blueprintAmount, catPower, enemyPower } from '../econ';
import { adopt, cat as getCat, catHpBase, catPow, starPerks } from './cats';
import type { OwnedCat } from '../game';
import type { BattleCatDef } from '../../battle/types';
import { crew, playerBlueprint, shipPower, mk, autoCrew, cannonShotsFor, balanceShip, shipName } from './ship';
import { gearBattleMods, gearBattleExtras } from './gear';
import { rankDmgBonus, koRank, RANK_ORBS, KO_RANKS } from './ranks';
import { accessoryMods } from './accessories';
import { podioCatMods } from '../../podio/mods';
import { generateShip, specFromArchetype, STORY_SHIPS } from '../../battle/shipgen';
import { battleCatFrom } from '../../battle/catShots';
import { weaponShot } from '../../battle/weapons';
import type { BattleSpec, BattleResult, BattleIntro } from '../../scenes/BattleScene';
import type { BossConfig, StageRules } from '../../battle/sim';
import type { ShotDef } from '../../battle/types';
import type { ShipBlueprint } from '../../battle/ship';
import { DIFFICULTY } from '../../battle/ai';
import { styleFor } from '../../battle/anime';

export const STAGES_PER_ZONE = BAL.combat.stages_per_zone;

export function stageKey(zone: number, stage: number) {
  return `${zone}-${stage}`;
}
export function isCleared(key: string) {
  return G.s.campaign.cleared.includes(key);
}
export function zoneUnlocked(zone: number) {
  return zone === 1 || G.s.campaign.bossesDefeated >= zone - 1;
}
export function stageUnlocked(zone: number, stage: number) {
  if (!zoneUnlocked(zone)) return false;
  if (stage === 1) return true;
  return isCleared(stageKey(zone, stage - 1));
}
export function frontier(): { zone: number; stage: number } {
  for (let z = 1; z <= ZONES.length; z++) {
    if (!zoneUnlocked(z)) return { zone: z - 1, stage: STAGES_PER_ZONE };
    for (let s = 1; s <= STAGES_PER_ZONE; s++) if (!isCleared(stageKey(z, s))) return { zone: z, stage: s };
  }
  return { zone: ZONES.length, stage: STAGES_PER_ZONE };
}
export function stageInfo(zone: number, stage: number): StageDef | undefined {
  return stageDef(stageKey(zone, stage));
}
export function stagePower(zone: number, stage: number) {
  const key = stageKey(zone, stage);
  let ep = enemyPower(zone, stage);
  if (stage === STAGES_PER_ZONE) ep /= 1 + 0.25 * Math.min(1, G.s.campaign.analysis[key] ?? 0);
  return ep;
}
/** ship power with the situational perk of the active ship (GDD 2.8: Bastión +10% vs jefes) */
export function effectiveSP(zone: number, stage: number, sp = shipPower()) {
  const ship = G.s.ship.active;
  if (ship === 'bastion' && stage === STAGES_PER_ZONE) return sp * 1.1;
  if (ship === 'bajel' && (zone === 4 || zone === 5 || zone === 6)) return sp * 1.2;
  return sp;
}
/** balance win formula for a power ratio */
export function winChanceFor(S: number) {
  return Math.max(0.03, Math.min(0.97, 0.5 + 0.5 * Math.tanh(BAL.combat.win_curve_k * Math.log(S))));
}
/** estimated win chance shown in pre-battle (balance win formula) */
export function winChance(zone: number, stage: number) {
  return winChanceFor(effectiveSP(zone, stage) / stagePower(zone, stage));
}
export function fS(S: number) {
  return Math.max(0.35, Math.min(3, Math.pow(S, 0.8)));
}

const DIFF_MAP: Record<string, keyof typeof DIFFICULTY> = { grumete: 'easy', corsario: 'normal', capitan: 'hard', leyenda: 'boss' };
const FACTION_PALETTE: Record<number, BattleSpec['palette']> = {
  1: { skyTop: 0x0d110f, skyBottom: 0x204a7a, sea: 0x1c3a51, seaDark: 0x172b35 },
  2: { skyTop: 0x1a1a1f, skyBottom: 0x6f6a5e, sea: 0x2c3e40, seaDark: 0x1d2a2c },
  3: { skyTop: 0x0d110f, skyBottom: 0x3569a3, sea: 0x172b35, seaDark: 0x0d1a22 },
  4: { skyTop: 0x231626, skyBottom: 0x5c3d5b, sea: 0x2a1f35, seaDark: 0x1a1222 },
  5: { skyTop: 0x0d110f, skyBottom: 0x8a5cff, sea: 0x1a1030, seaDark: 0x0d0820 },
  6: { skyTop: 0x171317, skyBottom: 0x413b44, sea: 0x231e26, seaDark: 0x141116 },
};

/**
 * Balance knobs (calibrated with the headless script so that the shown estimate ≈ simulated win rate
 * of a decent player at the representative crew of each zone). Exported so balance scripts can tweak them.
 *  · hp: enemy structure multiplier · dmg: enemy damage (cats + cannons) · catHp: enemy crew hp
 */
export const COMBAT_TUNE = {
  zone: {
    1: { hp: 1, dmg: 1, catHp: 1 },
    2: { hp: 1, dmg: 1, catHp: 1 },
    3: { hp: 1, dmg: 1, catHp: 1 },
    4: { hp: 1, dmg: 1, catHp: 1 },
    5: { hp: 1, dmg: 1, catHp: 1 },
    6: { hp: 1, dmg: 1, catHp: 1 },
  } as Record<number, { hp: number; dmg: number; catHp: number }>,
  elite: { hp: 1.2, dmg: 1, catHp: 1.3 },
  /** per-stage strength multiplier (structure, crew hp and damage) on top of the zone */
  stage: {
    // zones 2-3, calibrated with the headless script (AI 'hard' as the player, representative crews on the Gorrión)
    '2-1': 2.06, '2-2': 1.55, '2-3': 1.99, '2-4': 0.6, '2-5': 1.07, '2-6': 1.85, '2-7': 1.13, '2-8': 1.54, '3-1': 2.24, '3-2': 1.78, '3-3': 3.02, '3-4': 2.15, '3-5': 2.4, '3-6': 2.15, '3-7': 2.2, '3-8': 2.24,
    // bosses (×BOSS tune) and errands
    '2-9': 0.97, '3-9': 0.68, enc_aguas_estrechas: 0.6, enc_rescate: 3.2, enc_diluvio: 2.5,
  } as Record<string, number>,
  boss: {
    1: { hp: 1.5, catHp: 1.6, capHp: 2.5, dmg: 1 },
    2: { hp: 1.1, catHp: 1.3, capHp: 2.2, dmg: 1 },
    3: { hp: 1.0, catHp: 1.3, capHp: 2.2, dmg: 1 },
    4: { hp: 1.0, catHp: 1.3, capHp: 2.0, dmg: 0.8 },
    5: { hp: 1.0, catHp: 1.3, capHp: 2.0, dmg: 1 },
    6: { hp: 0.7, catHp: 1.3, capHp: 1.3, dmg: 0.8 },
  } as Record<number, { hp: number; catHp: number; capHp: number; dmg: number }>,
};

/**
 * Enemy ship weapons follow the same accuracy rule as yours (spread = 5° − 0.6°·Mk): this is the Mk the
 * enemy fleet of each zone brings (shown in the pre-battle "why").
 */
export const ENEMY_WEAPON_MK: Record<number, number> = { 1: 3, 2: 3, 3: 3, 4: 4, 5: 4, 6: 5 };

/** the hidden knobs of a stage, in plain numbers (the pre-battle "why" shows them) */
export function stageTune(zone: number, stage: number) {
  const sd = stageInfo(zone, stage);
  const key = stageKey(zone, stage);
  const isBoss = sd?.type === 'boss';
  const isElite = sd?.type === 'elite';
  const sk = COMBAT_TUNE.stage[key] ?? 1;
  const zt = COMBAT_TUNE.zone[zone] ?? { hp: 1, dmg: 1, catHp: 1 };
  const bt = isBoss ? COMBAT_TUNE.boss[zone] ?? { hp: 1.5, catHp: 1.6, capHp: 2.5, dmg: 1 } : null;
  const et = isElite ? COMBAT_TUNE.elite : { hp: 1, dmg: 1, catHp: 1 };
  return {
    hull: (bt ? bt.hp : et.hp * zt.hp) * sk,
    crewHp: (bt ? bt.catHp : et.catHp * zt.catHp) * sk,
    captainHp: bt ? bt.capHp * sk : undefined,
    dmg: (bt ? bt.dmg : et.dmg * zt.dmg) * sk,
    weaponMk: ENEMY_WEAPON_MK[zone] ?? 3,
  };
}

/** captain + crew for a zone boss */
function bossCrew(zone: number): string[] {
  const b = zoneBoss(zone);
  if (!b) return ['c_canelo'];
  const captain = CATS.find((c) => c.art.slug === b.captainArt.slug && !c.art.tint)?.id ?? 'c_canelo';
  if (zone === 2) return [captain, 'c_guijarro', 'c_musgo', 'c_terron'];
  if (zone === 3) return [captain, 'c_voltio', 'c_burbujas', 'c_nimbo'];
  // late bosses: hand-picked crews (the ward layers are "held" by them, in this order)
  if (zone === 4) return ['c_caramelo', 'c_guijarro', 'c_linterna'];
  if (zone === 5) return ['c_cometin', 'e_supernova', 'c_voltio', 'c_lunita'];
  if (zone === 6) return ['r_astral', 'r_arcanito', 'r_solar'];
  const els = b.elements.length ? b.elements : ZONES[zone - 1].elements;
  const crewIds = CATS.filter((c) => c.rarity === 'common' && els.includes(c.elements[0])).map((c) => c.id);
  return [captain, ...crewIds.slice(0, 2)];
}

interface SiegeInput {
  zone: number;
  stage: number;
  key: string;
  name: string;
  type: 'normal' | 'elite' | 'boss' | 'errand';
  archetype: string;
  personality: string;
  difficulty: string;
  enemyCats: string[];
  ep: number;
  crewUids: string[];
  captain?: string;
  captainLine?: string;
  rules?: StageRules;
  /** errand: player bubble disabled, armor… */
  noPlayerBubble?: boolean;
  enemyArmor?: number;
  sp?: number;
  special?: string;
  intro?: BattleIntro;
  /** story battles: a hand-made ship instead of the archetype generator */
  blueprint?: ShipBlueprint;
  /** extra enemy structure multiplier (Barco del Vacío: you can't sink it) */
  hpMulX?: number;
  /** shown numbers multiplier on top of the stage one (Patito revancha: absurd damage) */
  displayMulX?: number;
  /** sudden-death turn override (0 = off) */
  suddenDeath?: number;
}

const BOSS_INTRO: Record<number, { lines: string[]; weak: string }> = {
  1: { lines: ['BARRILES: revienta uno y estallan en cadena (daño a ÉL)', 'FASE 3: dispara dos veces por turno'], weak: 'PUNTO DÉBIL: la santabárbara tras el mástil' },
  2: { lines: ['PIEL DE PIEDRA: su piedra recibe x0.5, salvo {earth} Tierra y Estallido', 'RONRONEO: cada 3 turnos se cura 10% (RRR 1/3…)'], weak: 'PUNTO DÉBIL: La Garganta (interrumpe el ronroneo)' },
  3: { lines: ['TENTÁCULOS: agarran tus módulos y avientan gatos al agua. ¡Córtalos!', 'BURBUJA DE ESTÁTICA: anula 1 impacto por turno; {storm} rayo la revienta'], weak: 'PUNTO DÉBIL: el Ojo, cuando abre el pico' },
  4: {
    lines: ['ESCUDO ARCANO x3: {storm} rayo rompe 1 capa · {earth} y cañones x1.5', 'F2 PORTALES: tu tiro entra por uno… y sale siendo SUYO', 'F3 GATOS DE TINTA: de papel ({fire} x2), disparan runas'],
    weak: 'PUNTO DÉBIL: el Grimorio (núcleo), abierto tras invocar',
  },
  5: {
    lines: ['POZOS DE GRAVEDAD: curvan todo tiro cercano. Rómpelos', 'F2 GRAVEDAD x0.55 · F3 INVERTIDA SOBRE SU BARCO', 'LLUVIA DE ESTRELLAS: marca tu barco; tienes 1 turno'],
    weak: 'PUNTO DÉBIL: el núcleo-estrella (x2) mientras carga',
  },
  6: {
    lines: ['EL MAR ES EL JEFE: no se hunde. 3 núcleos, 1 por fase', 'F2 SE SUMERGE: congela el mar ({water} + ráfaga)', 'F3 DISTRAXIA BORRA TUS MÓDULOS: pégale a su ojo'],
    weak: 'PUNTO DÉBIL: el Espiráculo, cuando sale a respirar',
  },
};
const BOSS_COLOR: Record<number, number> = { 2: 0x9a9384, 3: 0x3569a3, 4: 0x6b3d8a, 5: 0xe8c45a, 6: 0x2a1f35 };

/** presentation card for bosses / elites (BattleScene.introCard) */
function stageIntro(zone: number, stage: number): BattleIntro | undefined {
  const sd = stageInfo(zone, stage);
  if (sd?.type === 'boss') {
    const b = zoneBoss(zone);
    const bi = BOSS_INTRO[zone];
    if (!b) return undefined;
    const analysis = G.s.campaign.analysis[stageKey(zone, stage)] ?? 0;
    const lines = [...(bi?.lines ?? [b.rule])];
    lines.push(analysis >= 0.4 || zone === 1 ? bi?.weak ?? b.weakPoint : 'PUNTO DÉBIL: ??? (Análisis 40% o descúbrelo peleando)');
    return { kind: 'boss', tag: `JEFE ${b.n}`, title: b.name, subtitle: b.title.replace(/\s*\(balance:[^)]*\)/, ''), lines, color: BOSS_COLOR[zone] ?? C_RED, slug: b.captainArt.slug ?? undefined };
  }
  if (sd?.type === 'elite') {
    const el = (CONTENT.elites as { zone: number; name: string; ship: string; rule: string }[] | undefined)?.find((x) => x.zone === zone);
    const slug = sd.enemyCats?.[0] ? catDef(sd.enemyCats[0]).art.slug : undefined;
    return { kind: 'elite', tag: 'ÉLITE', title: el?.name ?? sd.name.split('—')[0].trim(), subtitle: el?.ship ?? sd.name.split('—')[1]?.trim(), lines: [sd.eliteRule ?? el?.rule ?? ''], color: 0xffc94a, slug };
  }
  return undefined;
}
const C_RED = 0xc8102e;

/** Build the BattleSpec for a campaign stage. `opts.sp` overrides the ship power (balance scripts). */
export function buildBattle(zone: number, stage: number, onEnd: (r: BattleResult) => void, opts: { sp?: number } = {}): BattleSpec {
  const sd = stageInfo(zone, stage);
  const key = stageKey(zone, stage);
  if (!crew().length) autoCrew();
  const isBoss = sd?.type === 'boss';
  const boss = isBoss ? zoneBoss(zone) : undefined;
  const pZone = ZONES[zone - 1];
  const spec = buildSiege(
    {
      zone,
      stage,
      key,
      name: isBoss && boss ? boss.ship.name : sd?.name ?? 'Pirata',
      type: (sd?.type ?? 'normal') as SiegeInput['type'],
      archetype: (sd?.archetype ?? 'chalupa').split(' ')[0],
      personality: isBoss ? boss?.ai.personality ?? 'afinador' : sd?.personality ?? 'afinador',
      difficulty: isBoss ? boss?.ai.difficulty ?? 'corsario' : sd?.aiDifficulty ?? pZone.aiDifficulty,
      enemyCats: isBoss ? bossCrew(zone) : sd?.enemyCats?.length ? [...sd.enemyCats] : ['c_canelo'],
      ep: stagePower(zone, stage),
      crewUids: crew(),
      captain: isBoss && boss ? boss.name : sd?.type === 'elite' ? sd.name.split('—')[0].trim() : undefined,
      captainLine: isBoss && boss ? boss.lines.intro : sd?.eliteLine ?? (key === '1-1' ? '¡Cuac! ¡Esta es mi bahía! ¡Cuac!' : undefined),
      sp: opts.sp,
      intro: stageIntro(zone, stage),
    },
    onEnd,
  );
  return spec;
}

export function buildSiege(o: SiegeInput, onEnd: (r: BattleResult) => void): BattleSpec {
  const { zone, stage, key } = o;
  const isBoss = o.type === 'boss';
  const isElite = o.type === 'elite';
  const crewUids = o.crewUids;
  const shipId = G.s.ship.active;
  const SP = effectiveSP(zone, stage, o.sp ?? shipPower(shipId, crewUids));
  const EP = o.ep;
  const S = SP / EP;
  const pf = fS(S);
  const ef = fS(1 / S) * (key === '1-1' ? 0.3 : 1);
  const gear = gearBattleMods(shipId);
  const extras = gearBattleExtras(shipId);
  const avgPow = crewUids.reduce((a, u) => a + catPow(getCat(u)!), 0) / Math.max(1, crewUids.length);
  const playerCats = crewUids.map((u) => {
    const c = getCat(u)!;
    const share = Math.max(0.7, Math.min(1.4, catPow(c) / avgPow));
    const rank = 1 + rankDmgBonus(c.kos ?? 0);
    // casino accessories + Holo foil (small capped bonuses; catPow doesn't include powMul yet)
    const acc = accessoryMods(c);
    // El Podio: that cat's podio power levels → +dmg and an earlier ultimate on the ship (podio/mods.ts)
    const pm = podioCatMods(c);
    const bc = applyCatPerks(battleCatFrom({ uid: c.uid, species: c.species, name: c.name, level: c.level, stars: c.stars, dmgMul: pf * share * rank * gear.catDmgMul * acc.powMul * pm.dmgMul, hpMul: share * acc.hpMul * pm.hpMul }, catHpBase(c)), c);
    return pm.ultStart ? { ...bc, ultStart: Math.min(1, (bc.ultStart ?? 0) + pm.ultStart) } : bc;
  });
  // ---- enemy ship
  const tune = isBoss ? COMBAT_TUNE.boss[zone] ?? { hp: 1.5, catHp: 1.6, capHp: 2.5, dmg: 1 } : null;
  const zt = COMBAT_TUNE.zone[zone] ?? { hp: 1, dmg: 1, catHp: 1 };
  const et = isElite ? COMBAT_TUNE.elite : { hp: 1, dmg: 1, catHp: 1 };
  const sk = COMBAT_TUNE.stage[key] ?? 1;
  const eDmg = (tune?.dmg ?? et.dmg) * (isBoss ? 1 : zt.dmg) * sk;
  let bp: ShipBlueprint;
  let enemyShots: ShotDef[] | undefined;
  const rules: StageRules = { ...(o.rules ?? {}) };
  let bossCfg: BossConfig | undefined;
  if (o.blueprint) bp = o.blueprint;
  else if (key === '1-1') bp = STORY_SHIPS.patito;
  else if (isBoss && zone === 1) bp = STORY_SHIPS.sardina_furiosa;
  else if (isBoss && zone === 2) {
    bp = STORY_SHIPS.risco_flotante;
    // 2 slow, precise mortars (rocks)
    enemyShots = [rockMortar(), rockMortar()];
  } else if (isBoss && zone === 3) {
    bp = STORY_SHIPS.kraken;
    enemyShots = [weaponShot('tesla'), weaponShot('canon'), weaponShot('tesla')];
  } else if (isBoss && zone === 4) {
    bp = STORY_SHIPS.biblioteca_errante;
    enemyShots = [weaponShot('riel'), weaponShot('canon'), weaponShot('canon')];
  } else if (isBoss && zone === 5) {
    bp = STORY_SHIPS.cometa;
    enemyShots = [cosmicOrb(), weaponShot('tesla')];
  } else if (isBoss && zone === 6) {
    bp = STORY_SHIPS.leviatan;
    enemyShots = [weaponShot('canon'), weaponShot('riel'), weaponShot('mortero')];
  } else {
    const arch = (CONTENT.enemyArchetypes as Record<string, { size: string; hull: string; cannons: number; catrooms: number; mast: boolean; special: string }>)[o.archetype] ?? CONTENT.enemyArchetypes.chalupa;
    const spec = specFromArchetype(arch, zone * 100 + stage + (o.type === 'errand' ? 50 : 0));
    if (o.archetype === 'torre_barco') spec.tower = true;
    if (isBoss) {
      spec.cols = Math.max(spec.cols, 16);
      spec.rows = Math.max(spec.rows, 10);
      spec.cannons = Math.max(spec.cannons, 2);
      spec.catrooms = Math.max(spec.catrooms, 3);
    }
    bp = generateShip(spec);
    // archetype rules (GDD 2.9.13 enemyArchetypes.special)
    if (o.archetype === 'balandra_electrica') {
      rules.wetDeck = [...(rules.wetDeck ?? []), 1];
      enemyShots = Array.from({ length: spec.cannons }, (_, i) => (i === 0 ? weaponShot('tesla') : weaponShot('canon')));
    }
    if (o.archetype === 'pararrayos') rules.rod = [...(rules.rod ?? []), 1];
    if (o.archetype === 'galera_raices') rules.regrow = [...(rules.regrow ?? []), 1];
    if (o.archetype === 'catapulta') enemyShots = Array.from({ length: spec.cannons }, () => rockMortar());
  }
  if (isElite && zone === 2) rules.demolisher = [1];
  // ---- enemy crew
  const enemyLevel = Math.max(1, Math.round(Math.log(EP / 5) / Math.log(1.07)) - 20);
  const hpBoost = (isBoss ? tune!.catHp : et.catHp * zt.catHp) * sk;
  const bossDef = isBoss ? zoneBoss(zone) : undefined;
  const enemyCats = o.enemyCats.map((sp, i) => {
    const def = catDef(sp);
    const role = ROLE_BY_ID.get(def.role);
    const capMul = isBoss && i === 0 ? tune!.capHp / tune!.catHp : 1;
    const capName = isBoss && i === 0 && bossDef && zone !== 6 ? bossDef.name : def.name;
    return battleCatFrom(
      { uid: `e${i}`, species: sp, name: capName, level: Math.max(1, Math.min(50, enemyLevel)), stars: 1, dmgMul: ef * eDmg, hpMul: hpBoost * capMul },
      role?.hp ?? 100,
    );
  });
  if (isBoss && bossDef) {
    const id = (['sardina', 'gargoyle', 'kraken', 'arcanist', 'star', 'leviathan'] as const)[zone - 1] ?? null;
    if (id) bossCfg = { id, side: 1, captain: 'e0', enrageTurn: bossDef.enrageTurn ?? 14 };
  }
  // ---- player ship
  const { bp: pbp, hpMul } = playerBlueprint(shipId);
  const shieldMods = pbp.modules.filter((m) => m.kind === 'shield').length;
  const bubble = !o.noPlayerBubble && mk('shield') >= 1 && shieldMods > 0 ? (shieldMods >= 3 ? 2 : 1) : 0;
  const enemyHpMul = (isBoss ? tune!.hp : et.hp * zt.hp) * sk * (o.hpMulX ?? 1);
  const pZone = ZONES[zone - 1];
  const spec: BattleSpec = {
    playerName: G.s.flags.shipName ? String(G.s.flags.shipName) : shipLabel(),
    enemyName: o.name,
    captain: o.captain,
    captainLine: o.captainLine,
    difficulty: DIFF_MAP[o.difficulty] ?? DIFF_MAP[pZone.aiDifficulty] ?? 'easy',
    personality: o.personality,
    palette: FACTION_PALETTE[zone],
    seed: Date.now() % 1e9,
    player: {
      blueprint: pbp,
      hpMul: hpMul * gear.hpMul,
      cats: playerCats,
      cannonAtk: Math.round(40 * pf * 1.6 * (1 + 0.1 * (mk('weapon') - 1)) * gear.cannonAtkMul),
      cannonShots: cannonShotsFor(shipId),
      bubble,
      firstTurnDouble: shipId === 'gorrion',
      ultStart: gear.ultStart,
      pantry: extras.utility.includes('pantry'),
      pump: extras.utility.includes('pump'),
      anchor: extras.pushImmune || extras.utility.includes('anchor'),
      conductionBonus: extras.conductionJumps,
    },
    enemy: { blueprint: bp, hpMul: enemyHpMul, cats: enemyCats, cannonAtk: Math.round(40 * ef * 1.6 * eDmg), cannonShots: enemyShots, armor: o.enemyArmor },
    displayMul: (Math.max(1, EP / 2) / 10) * (o.displayMulX ?? 1),
    meta: {
      zone,
      stage,
      key,
      boss: isBoss,
      ep: EP,
      sp: SP,
      weaponMk: mk('weapon'),
      enemyWeaponMk: ENEMY_WEAPON_MK[zone] ?? 3,
      tune: { hull: enemyHpMul, crewHp: hpBoost, dmg: eDmg, stage: sk },
      enemyLevel: Math.max(1, Math.min(50, enemyLevel)),
      special: o.special,
      gearNotes: gear.notes,
      conductionBonus: extras.conductionJumps,
      previewBonus: extras.previewBonus,
    },
    playerStyle: styleFor('player', { hullMk: mk('hull') }),
    enemyStyle: styleFor('enemy', { zone, stageKey: key, boss: isBoss }),
    boss: bossCfg,
    rules,
    intro: o.intro,
    // late bosses have long phase arcs: the storm comes later (the Primer Mar can't sink: it only drowns you)
    suddenDeath: o.suddenDeath ?? (isBoss && zone === 6 ? 20 : isBoss && zone >= 4 ? 13 : undefined),
    onEnd,
  };
  return spec;
}

/**
 * ★3/★5 shot deltas (Colección: starPerks), traits and mutations that are simple stat/shot changes
 * (the bespoke ones are listed in the report as pending).
 */
function applyCatPerks(d: BattleCatDef, c: OwnedCat): BattleCatDef {
  const sp = starPerks(c);
  const shot = { ...d.shot };
  if (sp.shot.projectiles > 0) {
    shot.projectiles = (shot.projectiles ?? 1) + sp.shot.projectiles;
    if (['ballistic', 'bounce', 'seed', 'homing'].includes(shot.trajectory)) shot.trajectory = 'spread';
    shot.spreadDeg = shot.spreadDeg || 6;
  }
  if (sp.shot.pierce > 0) shot.pierce = (shot.pierce ?? 0) + sp.shot.pierce;
  if (sp.shot.bounces > 0 && shot.trajectory === 'ballistic') shot.trajectory = 'bounce';
  let atk = d.atk;
  let reload = d.reload ?? 0;
  let ultStart = 0;
  switch (c.trait) {
    case 'perezoso':
      reload += 1;
      atk *= 1.2;
      break;
    case 'impaciente':
      atk *= 1.03;
      break;
    case 'dormilon':
      ultStart = 0.5;
      break;
  }
  switch (c.mutation) {
    case 'gigantismo':
      shot.radius *= 1.15;
      break;
    case 'chamuscado':
      if (!shot.statuses?.some((s) => s.id === 'burning')) shot.statuses = [...(shot.statuses ?? []), { id: 'burning', turns: 1 }];
      break;
  }
  return { ...d, shot, atk: Math.round(atk), reload, ultStart };
}

/** Estrella Errante's cannon: a slow cosmic orb */
function cosmicOrb(): ShotDef {
  return { id: 'orbe_estelar', name: 'Orbe Estelar', element: 'cosmic', trajectory: 'orb', radius: 54, power: 1, preview: 0.45, catMul: 0.45 };
}

/** catapult / gargoyle mortar: a heavy lobbed rock (earth) */
function rockMortar(): ShotDef {
  return { id: 'roca', name: 'Roca', element: 'earth', trajectory: 'heavy', gravityScale: 1.3, pierce: 1, radius: 52, power: 1.05, preview: 0.45, catMul: 0.45 };
}

function shipLabel() {
  return CONTENT.ships.find((s) => s.id === G.s.ship.active)?.name ?? 'Balsa Bigotuda';
}

export interface Loot {
  won: boolean;
  gold: number;
  food: number;
  scrap: number;
  blueprint: number;
  crystals: { el: string; n: number } | null;
  orbs: { species: string; n: number } | null;
  gems: number;
  purr: number;
  golden: boolean;
  unlocks: string[];
  newElement: string | null;
  newCat: string | null;
  /** prisma orbs (errands) */
  prisma?: number;
}

/** Apply rewards after a campaign battle. */
export function applyResult(zone: number, stage: number, r: BattleResult): Loot {
  const key = stageKey(zone, stage);
  const sd = stageInfo(zone, stage);
  const abs = absStage(zone, stage);
  const frontierWin = !isCleared(key);
  const isBoss = sd?.type === 'boss';
  const loot: Loot = { won: r.won, gold: 0, food: 0, scrap: 0, blueprint: 0, crystals: null, orbs: null, gems: 0, purr: 0, golden: false, unlocks: [], newElement: null, newCat: null };
  const m = G.s.momentum;
  G.s.stats.modulesDestroyed += r.modulesDestroyed;
  if (r.won) {
    G.s.stats.victories++;
    if (r.perfect) G.s.stats.perfects++;
    G.s.campaign.stageWins[key] = (G.s.campaign.stageWins[key] ?? 0) + 1;
    loot.gold = Math.round(battleGold(abs, G.goldPerSec, frontierWin, r.perfect, m, G.has('flash_active')));
    loot.scrap = battleScrap(abs, r.perfect, m);
    if (stage >= BAL.combat.reward.blueprint_min_stage && Math.random() < BAL.combat.reward.blueprint_chance) loot.blueprint = blueprintAmount(zone);
    const el = (sd?.enemyCats?.[0] ? catDef(sd.enemyCats[0]).elements[0] : ZONES[zone - 1].elements[0]) ?? 'fire';
    loot.crystals = { el, n: battleCrystals(zone) };
    if (Math.random() < BAL.orbs.victory_drop_chance) {
      const crewU = crew();
      const c = getCat(crewU[Math.floor(Math.random() * crewU.length)]);
      if (c) loot.orbs = { species: c.species, n: BAL.orbs.victory_drop_amount };
    }
    if (r.perfect && Math.random() < BAL.combat.reward.perfect_gem_chance) loot.gems += 1;
    // first win ever: golden loot (H05)
    if (!G.s.flags.firstWin) {
      G.flag('firstWin');
      loot.golden = true;
      loot.gold *= 3;
      loot.orbs = { species: getCat(crew()[0])?.species ?? 'c_canelo', n: 10 };
    }
    if (frontierWin) G.s.campaign.cleared.push(key);
    G.purr('victory', 'combat');
    if (r.perfect) G.purr('perfect_extra', 'combat');
    if (r.reason === 'core') G.purr('core_destroyed', 'combat');
    G.bump('victory');
    if (r.perfect) G.bump('perfect_extra');
    G.xp('victory');
    if (r.perfect) G.xp('perfect_extra');
    G.count('wins');
    G.count(`wins_zone_${zone}`);
    if (r.perfect) G.count('wins_perfect');
    if (r.reason === 'sunk') G.count('wins_sink');
    if (r.reason === 'core') G.count('wins_core');
    if (r.reason === 'crew') G.count('wins_crew');
    if (isBoss && frontierWin) bossRewards(zone, loot);
  } else {
    G.s.stats.defeats++;
    const base = battleGold(abs, G.goldPerSec, false, false, m);
    loot.gold = Math.round(base * BAL.combat.reward.defeat_mult);
    loot.scrap = Math.max(1, Math.round(battleScrap(abs, false, m) * BAL.combat.reward.defeat_mult));
    if (isBoss) G.s.campaign.analysis[key] = Math.min(1, (G.s.campaign.analysis[key] ?? 0) + BAL.combat.boss_analysis_per_defeat);
    const enemySp = sd?.enemyCats?.[0] ?? (isBoss ? bossCrew(zone)[1] : undefined);
    if (enemySp) loot.orbs = { species: enemySp, n: 3 };
    G.purr('defeat', 'combat');
    G.bump('defeat');
    G.xp('defeat');
    G.count('defeats');
  }
  G.add('gold', loot.gold, 'battle');
  G.add('scrap', loot.scrap, 'battle');
  if (loot.blueprint) G.add('blueprint', loot.blueprint, 'battle');
  if (loot.crystals) G.addCrystals(loot.crystals.el, loot.crystals.n);
  if (loot.orbs) G.addOrbs(loot.orbs.species, loot.orbs.n);
  if (loot.gems) G.add('gems', loot.gems, 'battle');
  G.count('modules_destroyed', r.modulesDestroyed);
  applyBattleAftermath(r);
  G.recalc();
  G.save();
  return loot;
}

function bossRewards(zone: number, loot: Loot) {
  const b = BAL.bosses[zone - 1];
  G.s.campaign.bossesDefeated = Math.max(G.s.campaign.bossesDefeated, zone);
  loot.gems += b.gems;
  loot.blueprint += BAL.combat.reward.boss_blueprints;
  const el = ZONES[zone - 1].elements[0];
  loot.crystals = { el, n: BAL.combat.reward.boss_crystals };
  const best = crew().map((u) => getCat(u)!).sort((x, y) => catPow(y) - catPow(x))[0];
  if (best) loot.orbs = { species: best.species, n: BAL.orbs.boss_orbs };
  G.purr('boss', 'combat');
  G.bump('boss');
  G.xp('boss');
  G.count(`boss_${zone}`);
  // Fragmentos del Vacío (E25): the Arcanista's grimoire, the Estrella, the Primer Mar
  if (zone >= 4 && !G.has(`frag_boss_${zone}`)) {
    G.flag(`frag_boss_${zone}`);
    G.count('void_fragments', zone === 6 ? 2 : 1);
  }
  for (const u of b.unlocks) {
    const [k, v] = u.split(':');
    loot.unlocks.push(u);
    if (k === 'element' && !G.s.elements.includes(v)) {
      G.s.elements.push(v);
      loot.newElement = v;
      G.emit('element', { id: v });
    }
    if (k === 'cat') {
      loot.newCat = v;
    }
    G.flag(u);
  }
  // GDD 2.10 extras: Jefe 2 → Bobina Tesla; Jefe 3 → Escudo Burbuja (family Escudo)
  if (zone === 2) G.flag('weapon:tesla');
  if (zone === 3) G.flag('shield:burbuja');
}

/** called by UI after showing the boss loot: the primordial joins */
export function claimBossCat(species: string) {
  return adopt(species);
}

export { catPower };

// ---------------------------------------------------------------- after every battle: K.O. ranks + repair

export interface RankUp {
  uid: string;
  from: string;
  to: string;
  tier: number;
}
/** rank-ups of the last battle (Results / battle can show them) */
export const lastRankUps: RankUp[] = [];

/**
 * K.O. ranks (GDD 2.9.11): every module destroyed + cat knocked out by a cat counts for that cat,
 * win or lose. Each new rank gives +2 orbs of that cat. Emits counters `rank_<id>` (first time any
 * cat reaches it) and `kos` (total).
 */
export function applyKos(kos: Record<string, number> | undefined) {
  lastRankUps.length = 0;
  if (!kos) return lastRankUps;
  for (const [uid, n] of Object.entries(kos)) {
    const c = getCat(uid);
    if (!c || n <= 0) continue;
    const before = koRank(c.kos ?? 0);
    c.kos = (c.kos ?? 0) + n;
    G.count('kos', n);
    const after = koRank(c.kos);
    if (after.tier > before.tier) {
      for (let t = before.tier + 1; t <= after.tier; t++) {
        const id = KO_RANKS[t].id;
        G.addOrbs(c.species, RANK_ORBS);
        if (!G.has(`rank_${id}`)) {
          G.flag(`rank_${id}`);
          G.count(`rank_${id}`);
        }
        c.moments.push(`Ascendió a ${KO_RANKS[t].name} (${c.kos} K.O.)`);
      }
      lastRankUps.push({ uid, from: before.name, to: after.name, tier: after.tier });
    }
  }
  return lastRankUps;
}

/** highest K.O. rank tier among owned cats (missions 'cat_rank') */
export function bestRankTier() {
  return Math.max(0, ...G.s.cats.map((c) => koRank(c.kos ?? 0).tier));
}

/**
 * Reparación (GDD 2.9.11, balance.ship.repair, not simulated): green clock of 0.6 s per 1% of hull
 * damage + 2% of the cost of the last Mk upgrade. A victory without damage leaves no clock. While it
 * runs that ship can't sail (sail with another one or speed it up with Ronroneo).
 */
export function startRepair(shipId: string, hullLost: number) {
  const pct = Math.round(Math.max(0, Math.min(1, hullLost)) * 100);
  if (pct <= 0) return null;
  const R = BAL.ship.repair;
  const ms = pct * R.time_per_damage_pct_s * 1000;
  const prev = G.timerFor('repair', shipId);
  const gold = Math.round(lastUpgradeCost() * R.gold_pct_of_last_upgrade * (pct / 100));
  if (gold > 0) G.add('gold', -Math.min(gold, G.s.gold), 'repair');
  if (prev) {
    prev.totalMs += ms;
    prev.leftMs += ms;
    return prev;
  }
  return G.startTimer('repair', shipId, ms, `Reparación · ${shipName(shipId)}`, 'combat', { pct, gold });
}
export function repairTimer(shipId = G.s.ship.active) {
  return G.timerFor('repair', shipId) ?? null;
}
export function isRepairing(shipId = G.s.ship.active) {
  return !!repairTimer(shipId);
}
function lastUpgradeCost() {
  let best = 0;
  for (const f of ['hull', 'weapon', 'shield', 'engine', 'core'] as const) {
    const n = mk(f);
    if (n <= 0) continue;
    const fam = BAL.ship.families[f];
    best = Math.max(best, fam.cost_base * Math.pow(fam.cost_growth, n - 1));
  }
  return best;
}
G.onTimer('repair', (t) => {
  G.count('repairs');
  G.emit('toast', { text: '¡Barco reparado!', sub: t.label.replace('Reparación · ', '') });
});

/** K.O. + repair after any battle (campaign, errand) */
export function applyBattleAftermath(r: BattleResult) {
  applyKos(r.kos);
  if (r.hullLost !== undefined) startRepair(G.s.ship.active, r.won ? r.hullLost : Math.max(0.3, r.hullLost));
}

// ---------------------------------------------------------------- special battles (duels, secrets)
export interface SpecialDef {
  id: string;
  name: string;
  captain: string;
  line: string;
  enemyCats: string[];
  power: number | 'frontier';
  hpMul: number;
  zone: number;
  /** your cats on the raft (default 2) */
  crew?: number;
}
export const SPECIALS: Record<string, SpecialDef> = {
  duel_guardian_bosque: {
    id: 'duel_guardian_bosque',
    name: 'Guardián Musgoso',
    captain: 'Guardián Musgoso',
    line: 'Rrr… este santuario tiene dueño. Y raíces.',
    enemyCats: ['c_musgo'],
    power: 'frontier',
    hpMul: 1.7,
    zone: 1,
  },
  // Ruinas Arcanas (expansion 6) secret → H16 "Lo que guardan las ruinas"; prize: Sonata Prima
  secret_orquesta: {
    id: 'secret_orquesta',
    name: 'La Orquesta Muda',
    captain: 'La Directora',
    line: '…shhh. La función empezó hace tres siglos. Llegas tarde. Siéntate y no toses.',
    enemyCats: ['r_runachispa', 'r_astral', 's_maneki'],
    power: 'frontier',
    hpMul: 1,
    zone: 4,
    crew: 3,
  },
  duel_callejero: {
    id: 'duel_callejero',
    name: 'Gato Callejero',
    captain: 'Callejero',
    line: '¿Qué me ves? ¿Quieres pleito o quieres croquetas?',
    enemyCats: ['c_chispa'],
    power: 'frontier',
    hpMul: 1,
    zone: 1,
  },
};

/** 1–2 cats per side on wooden rafts; only crew K.O. wins. */
export function buildDuel(id: string, onEnd: (r: BattleResult) => void): BattleSpec {
  const sp = SPECIALS[id];
  const f = frontier();
  const SP = shipPower();
  // duels are side quests: as hard as your campaign frontier, but never harder than your own ship
  // (a late save with a lagging fleet used to face its zone-6 frontier and could never win: 0/16)
  const EP = sp.power === 'frontier' ? Math.min(stagePower(Math.max(1, f.zone), Math.max(1, f.stage)), SP) : sp.power;
  const crewUids = crew().slice(0, sp.crew ?? 2);
  const S = SP / EP;
  const pf = fS(S);
  const ef = fS(1 / S);
  const playerCats = crewUids.map((u) => {
    const c = getCat(u)!;
    return battleCatFrom({ uid: c.uid, species: c.species, name: c.name, level: c.level, stars: c.stars, dmgMul: pf, hpMul: 1.4 }, catHpBase(c));
  });
  const enemyCats = sp.enemyCats.map((s2, i) => {
    const def = catDef(s2);
    return battleCatFrom({ uid: `e${i}`, species: s2, name: i === 0 ? sp.captain : def.name, level: 5, stars: 1, dmgMul: ef, hpMul: sp.hpMul }, ROLE_BY_ID.get(def.role)?.hp ?? 100);
  });
  return {
    playerName: 'Tu balsa',
    enemyName: sp.name,
    captain: sp.captain,
    captainLine: sp.line,
    difficulty: 'normal',
    palette: FACTION_PALETTE[sp.zone],
    seed: Date.now() % 1e9,
    mode: 'duel',
    player: { blueprint: STORY_SHIPS.duel_raft, hpMul: 1.5, cats: playerCats, cannonAtk: 0 },
    enemy: { blueprint: STORY_SHIPS.duel_raft, hpMul: 1.5, cats: enemyCats, cannonAtk: 0 },
    displayMul: Math.max(1, EP / 2) / 10,
    meta: { zone: sp.zone, stage: 0, key: id, boss: false, ep: EP, sp: SP, special: id },
    playerStyle: 'raft',
    enemyStyle: 'raft',
    onEnd,
  } as BattleSpec;
}

/** rewards for special battles */
export function applySpecialResult(id: string, r: BattleResult) {
  applyKos(r.kos);
  if (!r.won) {
    G.purr('defeat', 'combat');
    G.xp('defeat');
    return { won: false };
  }
  G.flag(`won_${id}`);
  G.purr('victory', 'combat');
  G.bump('victory');
  G.xp('victory');
  G.count('wins');
  return { won: true };
}

// ---------------------------------------------------------------- Encargos (errands, GDD 2.9.13)
export interface ErrandDef {
  id: string;
  zone: number;
  afterStage: number;
  name: string;
  restriction: string;
  archetype: string;
  powerAsStage: number;
  reward: string;
}
export const ERRANDS: ErrandDef[] = ZONES.flatMap((z) => ((z as unknown as { errands?: ErrandDef[] }).errands ?? []).map((e) => ({ ...e })));
export const ERRAND_BY_ID = new Map(ERRANDS.map((e) => [e.id, e]));

/** rules per errand (restriction text lives in content) */
export interface ErrandRule {
  /** ships allowed to sail (null = any) */
  ships: string[] | null;
  maxCats?: number;
  noFire?: boolean;
  wetAll?: boolean;
  enemyArmor?: number;
  noBubble?: boolean;
  noPreview?: boolean;
  scrapMul?: number;
  /** poster flavor */
  tagline: string;
  enemy: string;
  captain: string;
  line: string;
  color: number;
  reward: { blueprint?: number; mvpOrbs?: number; prisma?: number; crystals?: { el: string; n: number }; scrap?: number; gems?: number };
}
export const ERRAND_RULES: Record<string, ErrandRule> = {
  enc_aguas_estrechas: {
    ships: ['balsa', 'gorrion'],
    tagline: 'Un estrecho entre acantilados: los barcos grandes se atoran.',
    enemy: 'La Torre del Estrecho',
    captain: 'Guardia Adoquín',
    line: '¿Ese cascarón? Pasa… si cabes. Ja. JA.',
    color: 0x9fd66e,
    reward: { blueprint: 2, mvpOrbs: 10 },
  },
  enc_rescate: {
    ships: null,
    maxCats: 3,
    tagline: 'Una galera tiene gatitos enjaulados. Entra ligero: solo caben 3 gatos.',
    enemy: 'Galera de las Jaulas',
    captain: 'Cabo Musgo',
    line: '¡Nadie se lleva a mis rehenes peluditos!',
    color: 0xff7ab8,
    reward: { prisma: 5 },
  },
  enc_diluvio: {
    ships: null,
    noFire: true,
    wetAll: true,
    tagline: 'Llueve sin parar: TODO está Mojado. Los gatos {fire} se quedan en casa.',
    enemy: 'Balandra del Diluvio',
    captain: 'Bruma Voltio',
    line: '¿Paraguas? Aquí no usamos de eso. Usamos pararrayos.',
    color: 0x00e5ff,
    reward: { crystals: { el: 'storm', n: 10 }, blueprint: 2 },
  },
  enc_asedio_pesado: { ships: null, enemyArmor: 0.5, tagline: 'Blindaje doble. Trae algo pesado.', enemy: 'Galeón Blindado', captain: 'Archivista Tinta', line: 'Mis páginas son de hierro.', color: 0xb89558, reward: { blueprint: 4 } },
  enc_tormenta_arcana: { ships: null, noBubble: true, tagline: 'Solo funcionan los escudos arcanos.', enemy: 'Observatorio Arcano', captain: 'Astróloga Lira', line: 'Tu burbujita aquí no flota.', color: 0xc49bff, reward: { crystals: { el: 'magic', n: 15 }, prisma: 5 } },
  enc_saqueo: { ships: ['merodeador'], scrapMul: 2, tagline: 'Solo el Merodeador: chatarra doble.', enemy: 'Satélite Cargado', captain: 'Cadete Órbita', line: '¡Eso es MÍO! …bueno, era.', color: 0xff2e88, reward: { scrap: 60, blueprint: 3 } },
  enc_ultima_niebla: { ships: null, noPreview: true, tagline: 'Niebla total: sin vista previa de trayectoria.', enemy: 'Galeón de Niebla', captain: 'Doña Niebla', line: '¿Me ves? Yo a ti sí.', color: 0xd9d4de, reward: { gems: 2 } },
};

export function errandState() {
  G.s.errands ??= { offered: [], active: [], done: [] };
  return G.s.errands;
}
export function errandUnlocked(e: ErrandDef) {
  return isCleared(stageKey(e.zone, e.afterStage));
}
export function errandDone(id: string) {
  return errandState().done.includes(id);
}
/** errands visible on the board (zones 1..frontier), with their status */
export function errandBoard() {
  const st = errandState();
  for (const e of ERRANDS) if (errandUnlocked(e) && !st.offered.includes(e.id)) st.offered.push(e.id);
  return ERRANDS.map((e) => ({ def: e, rule: ERRAND_RULES[e.id], unlocked: errandUnlocked(e), done: st.done.includes(e.id) }));
}
/** crew for an errand (restrictions applied) */
export function errandCrew(id: string, shipId = G.s.ship.active) {
  const rule = ERRAND_RULES[id];
  let uids = crew(shipId);
  if (rule?.noFire) {
    const ok = (u: string) => catDef(getCat(u)!.species).elements[0] !== 'fire';
    uids = uids.filter(ok);
    // fill with the strongest non-fire cats not aboard
    const pool = G.s.cats.filter((c) => !uids.includes(c.uid) && catDef(c.species).elements[0] !== 'fire').sort((a, b) => catPow(b) - catPow(a));
    const cap = balanceShip(shipId)?.crew ?? 3;
    while (uids.length < cap && pool.length) uids.push(pool.shift()!.uid);
  }
  if (rule?.maxCats) uids = uids.slice(0, rule.maxCats);
  return uids;
}
/** why the active ship can't take this errand (null = ok) */
export function errandBlock(id: string, shipId = G.s.ship.active): string | null {
  const e = ERRAND_BY_ID.get(id);
  const rule = ERRAND_RULES[id];
  if (!e || !rule) return 'Encargo desconocido';
  if (!errandUnlocked(e)) return `Gana la etapa ${e.zone}-${e.afterStage}`;
  if (rule.ships && !rule.ships.includes(shipId)) return `Solo: ${rule.ships.map((s) => balanceShip(s)?.name ?? s).join(' o ')}`;
  if (!errandCrew(id, shipId).length) return 'No tienes gatos que puedan ir';
  return null;
}
export function errandPower(id: string) {
  const e = ERRAND_BY_ID.get(id)!;
  return enemyPower(e.zone, e.powerAsStage);
}
export function errandWinChance(id: string) {
  const e = ERRAND_BY_ID.get(id)!;
  const uids = errandCrew(id);
  return winChanceFor(shipPower(G.s.ship.active, uids) / errandPower(id)) * (e ? 1 : 1);
}

/** Battle for an errand: the zone faction with the errand's archetype, power of `powerAsStage`. */
export function buildErrand(id: string, onEnd: (r: BattleResult) => void, opts: { sp?: number } = {}): BattleSpec {
  const e = ERRAND_BY_ID.get(id)!;
  const rule = ERRAND_RULES[id];
  const z = ZONES[e.zone - 1];
  const base = stageInfo(e.zone, e.powerAsStage);
  const crewUids = errandCrew(id);
  const spec = buildSiege(
    {
      zone: e.zone,
      stage: e.powerAsStage,
      key: id,
      name: rule?.enemy ?? e.name,
      type: 'errand',
      archetype: e.archetype,
      personality: base?.personality ?? 'afinador',
      difficulty: z.aiDifficulty,
      enemyCats: base?.enemyCats?.length ? [...base.enemyCats] : ['c_canelo'],
      ep: errandPower(id),
      crewUids,
      captain: rule?.captain,
      captainLine: rule?.line,
      rules: rule?.wetAll ? { wetAll: true } : undefined,
      noPlayerBubble: rule?.noBubble,
      enemyArmor: rule?.enemyArmor,
      sp: opts.sp,
      special: id,
      intro: { kind: 'errand', tag: 'ENCARGO', title: e.name, subtitle: rule?.enemy, lines: [e.restriction, rule?.tagline ?? ''].filter(Boolean), color: rule?.color ?? 0xffc94a },
    },
    onEnd,
  );
  spec.meta = { ...spec.meta!, stage: 0, boss: false, errand: id, noPreview: rule?.noPreview };
  spec.enemyStyle = styleFor('enemy', { zone: e.zone, stageKey: `${e.zone}-${e.powerAsStage}` });
  return spec;
}

export interface ErrandLoot extends Loot {
  first: boolean;
  errand: string;
}

/** rewards for an errand battle: standard battle loot + the poster reward the first time */
export function applyErrandResult(id: string, r: BattleResult): ErrandLoot {
  const e = ERRAND_BY_ID.get(id)!;
  const rule = ERRAND_RULES[id];
  const st = errandState();
  const first = r.won && !st.done.includes(id);
  const abs = absStage(e.zone, e.powerAsStage);
  const m = G.s.momentum;
  const loot: ErrandLoot = { won: r.won, gold: 0, food: 0, scrap: 0, blueprint: 0, crystals: null, orbs: null, gems: 0, purr: 0, golden: false, unlocks: [], newElement: null, newCat: null, prisma: 0, first, errand: id };
  G.s.stats.modulesDestroyed += r.modulesDestroyed;
  if (r.won) {
    G.s.stats.victories++;
    loot.gold = Math.round(battleGold(abs, G.goldPerSec, first, r.perfect, m));
    loot.scrap = Math.round(battleScrap(abs, r.perfect, m) * (rule?.scrapMul ?? 1));
    if (first && rule) {
      const rw = rule.reward;
      loot.blueprint += rw.blueprint ?? 0;
      loot.prisma = rw.prisma ?? 0;
      loot.gems += rw.gems ?? 0;
      loot.scrap += rw.scrap ?? 0;
      if (rw.crystals) loot.crystals = { ...rw.crystals };
      if (rw.mvpOrbs) {
        const mvp = getCat(r.mvp ?? '') ?? getCat(errandCrew(id)[0] ?? '');
        if (mvp) loot.orbs = { species: mvp.species, n: rw.mvpOrbs };
      }
      st.done.push(id);
      G.flag(`errand_done_${id}`);
      G.flag(`won_${id}`);
      G.count('errands_done');
      G.count(`errand_${id}`);
    }
    G.purr('victory', 'combat');
    G.bump('victory');
    G.xp('victory');
    G.count('wins');
    if (r.perfect) G.count('wins_perfect');
    if (r.reason === 'sunk') G.count('wins_sink');
  } else {
    G.s.stats.defeats++;
    loot.gold = Math.round(battleGold(abs, G.goldPerSec, false, false, m) * BAL.combat.reward.defeat_mult);
    loot.scrap = Math.max(1, Math.round(battleScrap(abs, false, m) * BAL.combat.reward.defeat_mult));
    G.purr('defeat', 'combat');
    G.bump('defeat');
    G.xp('defeat');
    G.count('defeats');
  }
  G.add('gold', loot.gold, 'errand');
  G.add('scrap', loot.scrap, 'errand');
  if (loot.blueprint) G.add('blueprint', loot.blueprint, 'errand');
  if (loot.prisma) G.add('prisma', loot.prisma, 'errand');
  if (loot.gems) G.add('gems', loot.gems, 'errand');
  if (loot.crystals) G.addCrystals(loot.crystals.el, loot.crystals.n);
  if (loot.orbs) G.addOrbs(loot.orbs.species, loot.orbs.n);
  G.count('modules_destroyed', r.modulesDestroyed);
  // C18-style counters (resolveBattle does this for campaign stages; errands don't go through it)
  if (r.modulesDestroyed > 0) G.count(`modules_with_${G.s.ship.active}`, r.modulesDestroyed);
  applyBattleAftermath(r);
  G.recalc();
  G.save();
  return loot;
}
