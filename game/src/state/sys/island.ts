/** Island economy: habitats (gold + buffer), fishing dock (crops), expansions, offline production. */
import { G, Habitat, FarmPlot } from '../game';
import { EXPANSIONS, catDef } from '../../data/content';
import {
  BAL,
  crop,
  cropTimeMs,
  farmUpgradeCost,
  farmUpgradeTimeMs,
  farmYield,
  habitatTier,
  islandGoldMult,
  newHabitatCost,
} from '../econ';
import { catGold, cat as getCat, speciesCount } from './cats';

export const HOME = 'home';

// ---------------------------------------------------------------- plots
export function regionsUnlocked(): string[] {
  return [HOME, ...G.s.expansions.cleared.map((n) => EXPANSIONS[n - 1].id)];
}
export function habitatPlots(region: string) {
  if (region === HOME) return BAL.habitats.plots_start;
  return EXPANSIONS.find((e) => e.id === region)?.balance.hab_plots ?? 0;
}
export function farmPlots(region: string) {
  if (region === HOME) return BAL.farms.plots_start;
  return EXPANSIONS.find((e) => e.id === region)?.balance.farm_plots ?? 0;
}
export function freeHabitatPlot(): { region: string; plot: number } | null {
  for (const r of regionsUnlocked())
    for (let i = 0; i < habitatPlots(r); i++) if (!G.s.habitats.some((h) => h.region === r && h.plot === i)) return { region: r, plot: i };
  return null;
}
export function totalFarmPlots() {
  return regionsUnlocked().reduce((a, r) => a + farmPlots(r), 0);
}

// ---------------------------------------------------------------- bonuses from expansions
export function expansionBonus(key: string) {
  let v = 0;
  for (const n of G.s.expansions.cleared) v += EXPANSIONS[n - 1].balance.bonus[key] ?? 0;
  return v;
}
export function builders() {
  return BAL.start.builders + expansionBonus('builders') + (G.has('extra_builder') ? 1 : 0);
}
export function buildersBusy() {
  return G.s.timers.filter((t) => t.kind === 'build' || t.kind === 'habitat_upgrade' || t.kind === 'expansion').length;
}

// ---------------------------------------------------------------- habitats
export function habitat(id: string) {
  return G.s.habitats.find((h) => h.id === id);
}
export function habitatRate(h: Habitat) {
  if (h.busy && h.tier === 0) return 0;
  const t = habitatTier(h.tier);
  let sum = 0;
  for (const uid of h.cats) {
    const c = getCat(uid);
    if (c) sum += catGold(c);
  }
  return sum * t.mult * globalGoldMult();
}
export function habitatCap(h: Habitat) {
  return habitatRate(h) * habitatTier(h.tier).buffer_min * 60;
}
export function globalGoldMult() {
  return islandGoldMult(speciesCount(), expansionBonus('catdex_bonus'), expansionBonus('gold'), G.s.momentum);
}
export function habitatCapacity(h: Habitat) {
  return habitatTier(h.tier).capacity;
}

export function nextHabitatCost() {
  return newHabitatCost(G.s.habitats.length);
}
export function canBuildHabitat() {
  return !!freeHabitatPlot() && buildersBusy() < builders();
}
/** Build a new tier-1 habitat of an element (10 s build). */
export function buildHabitat(element: string): Habitat | null {
  const spot = freeHabitatPlot();
  if (!spot || buildersBusy() >= builders()) return null;
  if (!G.spend({ gold: nextHabitatCost() })) return null;
  const h: Habitat = { id: G.uid('h'), element, tier: 1, region: spot.region, plot: spot.plot, buffer: 0, cats: [], busy: true };
  G.s.habitats.push(h);
  G.startTimer('build', h.id, habitatTier(1).build_s * 1000, `Hábitat de ${element}`, 'mission');
  return h;
}
export function canUpgradeHabitat(h: Habitat) {
  const next = BAL.habitats.tiers[h.tier];
  if (!next || h.busy) return false;
  if (G.s.kl < next.kl) return false;
  if ((G.s.crystals[h.element] ?? 0) < next.crystals) return false;
  return G.s.gold >= next.cost && buildersBusy() < builders();
}
export function upgradeHabitat(h: Habitat) {
  const next = BAL.habitats.tiers[h.tier];
  if (!next || !canUpgradeHabitat(h)) return false;
  G.spend({ gold: next.cost });
  if (next.crystals) G.s.crystals[h.element] -= next.crystals;
  h.busy = true;
  G.startTimer('habitat_upgrade', h.id, next.build_s * 1000, `Mejorando a ${next.name}`, 'mission', { tier: next.tier });
  return true;
}
/** move a cat into a habitat (element rule + capacity) */
export function canHouse(h: Habitat, species: string) {
  return catDef(species).elements.includes(h.element) && h.cats.length < habitatCapacity(h);
}
export function house(catUid: string, h: Habitat) {
  const c = getCat(catUid);
  if (!c || !canHouse(h, c.species)) return false;
  if (c.habitat) {
    const old = habitat(c.habitat);
    if (old) old.cats = old.cats.filter((u) => u !== catUid);
  }
  h.cats.push(catUid);
  c.habitat = h.id;
  G.recalc();
  return true;
}
/** auto-house homeless cats where possible */
export function autoHouse() {
  for (const c of G.s.cats) {
    if (c.habitat) continue;
    const h = G.s.habitats.find((x) => !x.busy && canHouse(x, c.species));
    if (h) house(c.uid, h);
  }
}
export function collect(h: Habitat) {
  const n = Math.floor(h.buffer);
  if (n <= 0) return 0;
  h.buffer -= n;
  G.add('gold', n, 'habitat');
  G.count('collect_gold');
  return n;
}
export function collectAll() {
  let total = 0;
  for (const h of G.s.habitats) total += collect(h);
  if (total > 0) G.count('collect_all');
  return total;
}

// ---------------------------------------------------------------- farms
export function farm(id: string) {
  return G.s.farms.find((f) => f.id === id);
}
export function cropsAvailable() {
  return BAL.farms.crops.filter((c) => G.s.kl >= c.kl);
}
export function plant(f: FarmPlot, cropId: string) {
  if (f.crop || f.busy) return false;
  const c = crop(cropId);
  if (!G.spend({ gold: c.cost })) return false;
  f.crop = cropId;
  f.ready = false;
  f.lastCrop = cropId;
  G.startTimer('crop', f.id, cropTimeMs(cropId, G.s.momentum), c.name, 'harvest');
  G.count('plant');
  return true;
}
export function harvest(f: FarmPlot) {
  if (!f.crop || !f.ready) return 0;
  const id = f.crop;
  const food = farmYield(id, f.level, foodBonus()) * (G.has('migration_x15') ? 15 : 1);
  G.add('food', food, 'harvest');
  G.count(`harvest_${id}`);
  G.count('harvests');
  G.count('harvest_food', food);
  G.bump('harvest');
  f.crop = null;
  f.ready = false;
  if (f.repeat && G.s.kl >= 9) plant(f, id);
  return food;
}
export function foodBonus() {
  return expansionBonus('food');
}
export function canUpgradeFarm(f: FarmPlot) {
  return f.level < BAL.farms.upgrade.max_level && !f.busy && G.s.gold >= farmUpgradeCost(f.level + 1);
}
export function upgradeFarm(f: FarmPlot) {
  if (!canUpgradeFarm(f)) return false;
  G.spend({ gold: farmUpgradeCost(f.level + 1) });
  f.busy = true;
  G.startTimer('farm_upgrade', f.id, farmUpgradeTimeMs(f.level + 1), `Muelle nivel ${f.level + 1}`, 'harvest');
  return true;
}
function ensureFarmPlots() {
  for (const r of regionsUnlocked())
    for (let i = 0; i < farmPlots(r); i++)
      if (!G.s.farms.some((f) => f.region === r && f.plot === i))
        G.s.farms.push({ id: G.uid('f'), region: r, plot: i, level: 1, crop: null, ready: false, repeat: false, lastCrop: null, busy: false });
}

// ---------------------------------------------------------------- expansions
export function expansionState(n: number): 'locked' | 'available' | 'clearing' | 'cleared' {
  if (G.s.expansions.cleared.includes(n)) return 'cleared';
  if (G.s.expansions.bought.includes(n)) return 'clearing';
  const e = EXPANSIONS[n - 1];
  return G.s.kl >= e.balance.kl ? 'available' : 'locked';
}
export function buyExpansion(n: number) {
  const e = EXPANSIONS[n - 1];
  if (expansionState(n) !== 'available' || buildersBusy() >= builders()) return false;
  if (!G.spend({ gold: e.balance.cost })) return false;
  G.s.expansions.bought.push(n);
  G.startTimer('expansion', String(n), e.balance.clear_s * 1000, `Limpiando ${e.name}`, 'mission');
  G.count(`buy_expansion_${n}`);
  return true;
}

// ---------------------------------------------------------------- timers
G.onTimer('build', (t) => {
  const h = habitat(t.ref);
  if (!h) return;
  h.busy = false;
  G.xp('build_done');
  G.count('habitats_built');
  G.count(`habitat_built_${h.element}`);
  autoHouse();
  G.recalc();
});
G.onTimer('habitat_upgrade', (t) => {
  const h = habitat(t.ref);
  if (!h) return;
  h.busy = false;
  h.tier = (t.data?.tier as number) ?? h.tier + 1;
  G.xp('build_done', undefined, 1 + h.tier * 0.2);
  G.count(`habitat_tier_${h.tier}`);
  autoHouse();
  G.recalc();
});
G.onTimer('crop', (t) => {
  const f = farm(t.ref);
  if (!f) return;
  f.ready = true;
  if (G.s.kl >= 21 && G.has('auto_harvest_on')) harvest(f);
});
G.onTimer('farm_upgrade', (t) => {
  const f = farm(t.ref);
  if (!f) return;
  f.busy = false;
  f.level++;
  G.xp('build_done');
});
G.onTimer('expansion', (t) => {
  const n = Number(t.ref);
  if (!G.s.expansions.cleared.includes(n)) G.s.expansions.cleared.push(n);
  G.xp('expansion');
  G.count(`clear_expansion_${n}`);
  if (EXPANSIONS[n - 1].balance.bonus.resonance_slots) G.s.resonance.slots += EXPANSIONS[n - 1].balance.bonus.resonance_slots;
  ensureFarmPlots();
  G.recalc();
});

// ---------------------------------------------------------------- production
function recomputeRates() {
  let g = 0;
  for (const h of G.s.habitats) g += habitatRate(h);
  G.goldPerSec = g;
  let f = 0;
  for (const p of G.s.farms) {
    const id = p.lastCrop ?? 'sardinas';
    const c = crop(id);
    f += farmYield(id, p.level, foodBonus()) / c.time_s;
  }
  G.foodPerSec = f;
}
G.recompute.push(recomputeRates);

let rateAcc = 0;
G.tickers.push((dt) => {
  rateAcc += dt;
  if (rateAcc > 500) {
    rateAcc = 0;
    recomputeRates();
  }
  const bank = G.s.kl >= 15;
  for (const h of G.s.habitats) {
    const r = habitatRate(h);
    if (r <= 0) continue;
    if (bank) {
      G.s.gold += r * (dt / 1000);
      G.s.stats.goldEarned += r * (dt / 1000);
    } else h.buffer = Math.min(habitatCap(h), h.buffer + r * (dt / 1000));
  }
});
G.offliners.push((ms) => {
  recomputeRates();
  const bank = G.s.kl >= 15;
  const bankMs = (2 + expansionBonus('offline_bank_h')) * 3600 * 1000;
  for (const h of G.s.habitats) {
    const r = habitatRate(h);
    if (bank) G.s.gold += r * (Math.min(ms, bankMs) / 1000);
    else h.buffer = Math.min(habitatCap(h), h.buffer + r * (ms / 1000));
  }
});

// ---------------------------------------------------------------- new game setup
export function setupNewIsland() {
  const s = G.s;
  s.habitats = [];
  BAL.start.habitats.forEach((hb, i) => {
    s.habitats.push({ id: G.uid('h'), element: hb.element, tier: hb.tier, region: HOME, plot: i, buffer: 0, cats: [], busy: false });
  });
  s.farms = [];
  ensureFarmPlots();
}
export { ensureFarmPlots };
