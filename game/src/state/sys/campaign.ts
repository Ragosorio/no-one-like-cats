/** Campaign: zones/stages, battle setup (SP/EP scaling), rewards for victory/defeat, boss unlocks. */
import { G } from '../game';
import { CATS, CONTENT, ZONES, StageDef, catDef, stageDef, zoneBoss, ROLE_BY_ID } from '../../data/content';
import { BAL, absStage, battleCrystals, battleGold, battleScrap, blueprintAmount, catPower, enemyPower } from '../econ';
import { adopt, cat as getCat, catHpBase, catPow } from './cats';
import { crew, playerBlueprint, shipPower, mk, autoCrew, cannonShotsFor } from './ship';
import { generateShip, specFromArchetype, STORY_SHIPS } from '../../battle/shipgen';
import { battleCatFrom } from '../../battle/catShots';
import type { BattleSpec, BattleResult } from '../../scenes/BattleScene';
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
/** estimated win chance shown in pre-battle (balance win formula) */
export function winChance(zone: number, stage: number) {
  const S = shipPower() / stagePower(zone, stage);
  return Math.max(0.03, Math.min(0.97, 0.5 + 0.5 * Math.tanh(BAL.combat.win_curve_k * Math.log(S))));
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

/** Build the BattleSpec for a campaign stage. */
export function buildBattle(zone: number, stage: number, onEnd: (r: BattleResult) => void): BattleSpec {
  const sd = stageInfo(zone, stage);
  const key = stageKey(zone, stage);
  if (!crew().length) autoCrew();
  const crewUids = crew();
  const SP = shipPower();
  const EP = stagePower(zone, stage);
  const S = SP / EP;
  const pf = fS(S);
  const ef = fS(1 / S) * (key === '1-1' ? 0.3 : 1);
  const avgPow = crewUids.reduce((a, u) => a + catPow(getCat(u)!), 0) / Math.max(1, crewUids.length);
  const playerCats = crewUids.map((u) => {
    const c = getCat(u)!;
    const share = Math.max(0.7, Math.min(1.4, catPow(c) / avgPow));
    return battleCatFrom({ uid: c.uid, species: c.species, name: c.name, level: c.level, stars: c.stars, dmgMul: pf * share, hpMul: share }, catHpBase(c));
  });
  // enemy ship
  let bp;
  const isBoss = sd?.type === 'boss';
  if (key === '1-1') bp = STORY_SHIPS.patito;
  else if (key === '1-9') bp = STORY_SHIPS.sardina_furiosa;
  else {
    const archName = (sd?.archetype ?? 'chalupa').split(' ')[0];
    const arch = (CONTENT.enemyArchetypes as Record<string, { size: string; hull: string; cannons: number; catrooms: number; mast: boolean; special: string }>)[archName] ?? CONTENT.enemyArchetypes.chalupa;
    const spec = specFromArchetype(arch, zone * 100 + stage);
    if (isBoss) {
      spec.cols = Math.max(spec.cols, 16);
      spec.rows = Math.max(spec.rows, 10);
      spec.cannons = Math.max(spec.cannons, 2);
      spec.catrooms = Math.max(spec.catrooms, 3);
    }
    bp = generateShip(spec);
  }
  const boss0 = isBoss ? zoneBoss(zone) : undefined;
  let enemyCatIds = sd?.enemyCats?.length ? [...sd.enemyCats] : [];
  if (isBoss && boss0) {
    // captain (by art) + crew from the zone's elements
    const captain = CATS.find((c) => c.art.slug === boss0.captainArt.slug && !c.art.tint)?.id ?? 'c_canelo';
    const els = boss0.elements.length ? boss0.elements : ZONES[zone - 1].elements;
    const crewIds = CATS.filter((c) => c.rarity === 'common' && els.includes(c.elements[0])).map((c) => c.id);
    enemyCatIds = [captain, ...crewIds.slice(0, 2)];
  }
  if (!enemyCatIds.length) enemyCatIds = ['c_canelo'];
  const enemyLevel = Math.max(1, Math.round(Math.log(EP / 5) / Math.log(1.07)) - 20);
  const hpBoost = isBoss ? 1.6 : sd?.type === 'elite' ? 1.3 : 1;
  const enemyCats = enemyCatIds.map((sp, i) => {
    const def = catDef(sp);
    const role = ROLE_BY_ID.get(def.role);
    const capMul = isBoss && i === 0 ? 2.5 / 1.6 : 1;
    return battleCatFrom({ uid: `e${i}`, species: sp, name: isBoss && i === 0 && boss0 ? boss0.name : def.name, level: Math.max(1, Math.min(50, enemyLevel)), stars: 1, dmgMul: ef, hpMul: hpBoost * capMul }, role?.hp ?? 100);
  });
  const { bp: pbp, hpMul } = playerBlueprint();
  const boss = isBoss ? zoneBoss(zone) : undefined;
  const pZone = ZONES[zone - 1];
  return {
    playerName: G.s.flags.shipName ? String(G.s.flags.shipName) : shipName(),
    enemyName: isBoss && boss ? boss.ship.name : sd?.name ?? 'Pirata',
    captain: isBoss && boss ? boss.name : sd?.type === 'elite' ? sd.name.split('—')[0].trim() : undefined,
    captainLine: isBoss && boss ? boss.lines.intro : sd?.eliteLine ?? (key === '1-1' ? '¡Cuac! ¡Esta es mi bahía! ¡Cuac!' : undefined),
    difficulty: DIFF_MAP[isBoss ? boss?.ai.difficulty ?? 'corsario' : sd?.aiDifficulty ?? pZone.aiDifficulty] ?? 'easy',
    palette: FACTION_PALETTE[zone],
    seed: Date.now() % 1e9,
    player: { blueprint: pbp, hpMul, cats: playerCats, cannonAtk: Math.round(40 * pf * 1.6 * (1 + 0.1 * (mk('weapon') - 1))), cannonShots: cannonShotsFor() },
    enemy: { blueprint: bp, hpMul: isBoss ? 1.5 : sd?.type === 'elite' ? 1.2 : 1, cats: enemyCats, cannonAtk: Math.round(40 * ef * 1.6) },
    displayMul: Math.max(1, EP / 2) / 10,
    meta: { zone, stage, key, boss: isBoss, ep: EP, sp: SP, weaponMk: mk('weapon') },
    playerStyle: styleFor('player', { hullMk: mk('hull') }),
    enemyStyle: styleFor('enemy', { zone, stageKey: key, boss: isBoss }),
    onEnd,
  } as BattleSpec;
}

function shipName() {
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
    if (isBoss && frontierWin) bossRewards(zone, loot);
  } else {
    G.s.stats.defeats++;
    const base = battleGold(abs, G.goldPerSec, false, false, m);
    loot.gold = Math.round(base * BAL.combat.reward.defeat_mult);
    loot.scrap = Math.max(1, Math.round(battleScrap(abs, false, m) * BAL.combat.reward.defeat_mult));
    if (isBoss) G.s.campaign.analysis[key] = Math.min(1, (G.s.campaign.analysis[key] ?? 0) + BAL.combat.boss_analysis_per_defeat);
    const enemySp = sd?.enemyCats?.[0];
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
}

/** called by UI after showing the boss loot: the primordial joins */
export function claimBossCat(species: string) {
  return adopt(species);
}

export { catPower };
