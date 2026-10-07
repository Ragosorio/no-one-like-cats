/**
 * Island economy: habitats (gold + buffer), fishing dock (crops), expansions, offline production.
 * Habitats are placed freely (Dragon City style, SAVE v3): buy one of any element you know, put it
 * anywhere it fits (island/placement.ts), move it, sell it. Price grows with how many you own.
 */
import { G, Habitat, FarmPlot } from '../game';
import { Emitter } from '../../core/events';
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
import { checkHabitatSpot, ensureHabitatPositions, hasHabitatSpace, nearestHabitatSpot } from '../../island/placement';
import { LEGACY_PLOTS } from '../migrate';
import { registerPatch } from '../patches';
import { legacyHabitatCost } from '../econ';
import { fmt } from '../../core/format';

export const HOME = 'home';

/** island-only notifications the scene turns into juice (auto-harvest, bank deposits, new cat moved in) */
export const islandBus = new Emitter<{ autoHarvest: { farm: string; food: number }; housed: { cat: string; habitat: string } }>();

/** worker config straight from balance (cats.workers) */
function wcfg(role: 'banker' | 'farmer' | 'builder' | 'voyager') {
  return (BAL.cats.workers as unknown as Record<string, { value: number; max: number }>)[role];
}

// ---------------------------------------------------------------- regions
export function regionsUnlocked(): string[] {
  return [HOME, ...G.s.expansions.cleared.map((n) => EXPANSIONS[n - 1].id)];
}
/** @deprecated habitats are placed freely now; kept for old callers (legacy plot count) */
export function habitatPlots(region: string) {
  if (region === HOME) return BAL.habitats.plots_start;
  return EXPANSIONS.find((e) => e.id === region)?.balance.hab_plots ?? 0;
}
export function farmPlots(region: string) {
  if (region === HOME) return BAL.farms.plots_start;
  return EXPANSIONS.find((e) => e.id === region)?.balance.farm_plots ?? 0;
}
/**
 * First free spot for a habitat (nearest to the home center), or null when nothing fits.
 * (Name kept from the fixed-plot days: callers only test it for "is there room?".)
 */
export function freeHabitatPlot(): { region: string; plot: number; gx: number; gy: number } | null {
  if (!hasHabitatSpace()) return null;
  const s = nearestHabitatSpot();
  return s ? { region: s.region, plot: -1, gx: s.gx, gy: s.gy } : null;
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
  const bankers = Math.min(wcfg('banker').max, h.cats.filter((u) => G.s.workers[u] === 'banker').length);
  return sum * t.mult * (1 + wcfg('banker').value * bankers) * globalGoldMult();
}
export function habitatCap(h: Habitat) {
  return habitatRate(h) * habitatTier(h.tier).buffer_min * 60;
}
export function globalGoldMult() {
  return islandGoldMult(speciesCount(), expansionBonus('catdex_bonus'), expansionBonus('gold'), G.s.momentum) * mareaMult();
}

// ---------------------------------------------------------------- Marea Final (b23): the whole island x1000 for 3:00
export function mareaUntil() {
  return Number((G.s.ext as Record<string, unknown> | undefined)?.mareaUntil ?? 0);
}
export function mareaMult() {
  return Date.now() < mareaUntil() ? 1000 : 1;
}
export function startMareaFinal(seconds = 180) {
  G.s.ext ??= {};
  (G.s.ext as Record<string, unknown>).mareaUntil = Date.now() + seconds * 1000;
  G.recalc();
  window.setTimeout(() => G.recalc(), seconds * 1000 + 100);
}
export function habitatCapacity(h: Habitat) {
  return habitatTier(h.tier).capacity;
}

/** price of one more habitat of `element` (grows with how many you own, and with copies of that element) */
export function habitatCost(element: string) {
  return newHabitatCost(G.s.habitats.length, G.s.habitats.filter((h) => h.element === element).length);
}
/** without an element: the cheapest one you could buy now (an element you have the fewest of) */
export function nextHabitatCost(element?: string) {
  if (element) return habitatCost(element);
  const els = G.s.elements.length ? G.s.elements : ['fire'];
  return Math.min(...els.map(habitatCost));
}
export function canBuildHabitat() {
  return hasHabitatSpace() && buildersBusy() < builders();
}
/**
 * Buy a new tier-1 habitat of an element (10 s build) with its 3×3 footprint at (gx, gy) — or, without
 * a spot, on the free spot nearest to the home center.
 */
export function buildHabitat(element: string, at?: { gx: number; gy: number }): Habitat | null {
  if (buildersBusy() >= builders()) return null;
  const spot = at ?? nearestHabitatSpot();
  if (!spot) return null;
  const chk = checkHabitatSpot(spot.gx, spot.gy);
  if (!chk.ok) return null;
  if (!G.spend({ gold: habitatCost(element) })) return null;
  const h: Habitat = { id: G.uid('h'), element, tier: 1, region: chk.region, plot: -1, gx: Math.round(spot.gx), gy: Math.round(spot.gy), buffer: 0, cats: [], busy: true };
  G.s.habitats.push(h);
  G.startTimer('build', h.id, habitatTier(1).build_s * 1000 * buildTimeMul(), `Hábitat de ${element}`, 'mission');
  G.count('habitats_bought');
  return h;
}
/** move a habitat (cats, buffer, timers travel with it). Free. */
export function moveHabitat(id: string, gx: number, gy: number) {
  const h = habitat(id);
  if (!h) return false;
  const chk = checkHabitatSpot(gx, gy, id);
  if (!chk.ok) return false;
  h.gx = Math.round(gx);
  h.gy = Math.round(gy);
  h.region = chk.region;
  G.count('habitats_moved');
  return true;
}
/** gold you get back for selling: part of what a replacement would cost + part of the upgrades paid */
export function habitatSellValue(h: Habitat) {
  const P = BAL.habitats.placement;
  const others = G.s.habitats.filter((x) => x.id !== h.id);
  const rebuy = newHabitatCost(others.length, others.filter((x) => x.element === h.element).length);
  let ups = 0;
  for (let t = 2; t <= h.tier; t++) ups += BAL.habitats.tiers[t - 1]?.cost ?? 0;
  return Math.floor(rebuy * P.sell_back + ups * P.upgrade_sell_back);
}
export function canSellHabitat(h: Habitat): string | null {
  if (h.busy) return 'Está en obra: espera a que terminen.';
  if (G.s.habitats.length <= 1) return 'Es tu último hábitat. Tus gatos se quedarían en la calle.';
  return null;
}
/**
 * Sell a habitat: its buffer (gold + fish) is collected first, its cats move to another habitat with
 * room (or wait homeless until you make room), then you get `habitatSellValue` back.
 */
export function sellHabitat(id: string): { gold: number; homeless: string[] } | null {
  const h = habitat(id);
  if (!h || canSellHabitat(h)) return null;
  const value = habitatSellValue(h);
  collectHabitat(h);
  const cats = [...h.cats];
  for (const uid of cats) {
    const c = getCat(uid);
    if (c) c.habitat = null;
  }
  G.s.habitats = G.s.habitats.filter((x) => x.id !== id);
  delete fishMap()[id];
  G.add('gold', value, 'habitat_sell');
  G.count('habitats_sold');
  autoHouse();
  G.recalc();
  return { gold: value, homeless: cats.filter((u) => !getCat(u)?.habitat) };
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
  G.startTimer('habitat_upgrade', h.id, next.build_s * 1000 * buildTimeMul(), `Mejorando a ${next.name}`, 'mission', { tier: next.tier });
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
    if (h && house(c.uid, h)) islandBus.emit('housed', { cat: c.uid, habitat: h.id });
  }
}
// a brand-new cat (Resonance, boss, secret…) moves into a matching habitat with room by itself
G.on('catAdded', (p) => {
  if (p.isNew && p.cat && !p.cat.habitat) autoHouse();
});
export function collect(h: Habitat) {
  const n = Math.floor(h.buffer);
  if (n <= 0) return 0;
  h.buffer -= n;
  G.add('gold', n, 'habitat');
  G.count('collect_gold');
  return n;
}
/** gold + fish of one habitat (what a tap on the island collects) */
export function collectHabitat(h: Habitat) {
  return { gold: collect(h), food: collectFish(h) };
}
/** "Recolectar todo": gold AND fish of every habitat */
export function collectAllBoth() {
  let gold = 0;
  let food = 0;
  for (const h of G.s.habitats) {
    gold += collect(h);
    food += collectFish(h);
  }
  if (gold > 0 || food > 0) G.count('collect_all');
  return { gold, food };
}
export function collectAll() {
  return collectAllBoth().gold;
}

// ---------------------------------------------------------------- fishing cats ("pescadores")
/**
 * Like Dragon City's food dragons: species that know the Granjero trade (catdex worker 'farmer':
 * Gelatino, Brote, Nenúfar…) ALSO fish at home — a pile of Pescaditos grows on their habitat next to
 * the coins. Not simulated (GDD §9 #24): indexed to the cat's own production and small
 * (a bonus next to the dock: ~10–30% early, a few % late).
 */
export const FISH_PER_GOLD = 0.2;
export function isFisher(species: string) {
  return catDef(species).worker === 'farmer';
}
export function catFish(uid: string) {
  const c = getCat(uid);
  return c && isFisher(c.species) ? catGold(c) * FISH_PER_GOLD : 0;
}
export function habitatFishRate(h: Habitat) {
  if (h.busy && h.tier === 0) return 0;
  let sum = 0;
  for (const uid of h.cats) sum += catFish(uid);
  if (sum <= 0) return 0;
  // better homes help a little (√ of the tier multiplier) — gold keeps the full multiplier
  return sum * Math.sqrt(habitatTier(h.tier).mult) * (1 + foodBonus()) * mareaMult();
}
function fishMap(): Record<string, number> {
  G.s.ext ??= {};
  return (G.s.ext.fish ??= {}) as Record<string, number>;
}
export function fishBuffer(h: Habitat) {
  return fishMap()[h.id] ?? 0;
}
export function fishCap(h: Habitat) {
  return habitatFishRate(h) * habitatTier(h.tier).buffer_min * 60;
}
function addFish(h: Habitat, n: number) {
  const m = fishMap();
  m[h.id] = Math.min(fishCap(h), (m[h.id] ?? 0) + n);
}
export function collectFish(h: Habitat) {
  const m = fishMap();
  const n = Math.floor(m[h.id] ?? 0);
  if (n <= 0) return 0;
  m[h.id] = (m[h.id] ?? 0) - n;
  G.add('food', n, 'habitat_fish');
  G.count('collect_fish');
  G.count('collect_fish_food', n);
  return n;
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
export function harvest(f: FarmPlot, source: 'harvest' | 'auto_harvest' = 'harvest') {
  if (!f.crop || !f.ready) return 0;
  const id = f.crop;
  const food = farmYield(id, f.level, foodBonus()) * (G.has('migration_x15') ? 15 : 1);
  G.add('food', food, source);
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
  const farmers = G.s.cats.filter((c) => G.s.workers[c.uid] === 'farmer').length;
  return expansionBonus('food') + wcfg('farmer').value * Math.min(wcfg('farmer').max, farmers);
}
/** build-time multiplier from Constructor workers (balance: −20% each, max 2) */
export function buildTimeMul() {
  const n = G.s.cats.filter((c) => G.s.workers[c.uid] === 'builder').length;
  return Math.max(0.2, 1 - wcfg('builder').value * Math.min(wcfg('builder').max, n));
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
  // Reino XP only when the island reaches a new record of habitats (buy → sell → buy doesn't farm XP)
  const ext = (G.s.ext ??= {}) as Record<string, unknown>;
  const best = Number(ext.habitatsRecord ?? 0);
  if (G.s.habitats.length > best) {
    ext.habitatsRecord = G.s.habitats.length;
    G.xp('build_done');
  }
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
  // KL21 "Mar de Pescados Automático": ready catches go straight to the Silo
  if (autoHarvestOn()) {
    const food = harvest(f, 'auto_harvest');
    if (food > 0) {
      G.count('feature_auto_harvest');
      G.count('auto_harvests');
      islandBus.emit('autoHarvest', { farm: f.id, food });
    }
  }
});
export function autoHarvestKl() {
  return BAL.automation.find((a) => a.id === 'auto_harvest')?.kl ?? 21;
}
export function autoHarvestOn() {
  return G.s.kl >= autoHarvestKl() && !G.has('auto_harvest_off');
}
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
  for (const h of G.s.habitats) f += habitatFishRate(h);
  for (const p of G.s.farms) {
    const id = p.lastCrop ?? 'sardinas';
    const c = crop(id);
    f += farmYield(id, p.level, foodBonus()) / c.time_s;
  }
  G.foodPerSec = f;
}
G.recompute.push(recomputeRates);

// ---------------------------------------------------------------- Banco del Reino (KL15)
export interface BankState {
  /** lifetime deposits */
  total: number;
  /** deposits since the island was last opened (for the "+X" flow) */
  pending: number;
  /** last offline deposit + its duration */
  lastOfflineGold: number;
  lastOfflineMs: number;
  /** first time the building opened (reveal) */
  opened: boolean;
}
export function bankKl() {
  return BAL.automation.find((a) => a.id === 'kingdom_bank')?.kl ?? 15;
}
export function bankUnlocked() {
  return G.s.kl >= bankKl();
}
export function bankState(): BankState {
  G.s.ext ??= {};
  const b = (G.s.ext.bank ??= { total: 0, pending: 0, lastOfflineGold: 0, lastOfflineMs: 0, opened: false }) as BankState;
  return b;
}
/** offline auto-deposit window: 2 h base (+2 h with the Puerto de las Mareas) */
export function bankOfflineHours() {
  return 2 + expansionBonus('offline_bank_h');
}
function deposit(n: number) {
  if (n <= 0) return;
  G.s.gold += n;
  G.s.stats.goldEarned += n;
  const b = bankState();
  b.total += n;
  b.pending += n;
}

let rateAcc = 0;
G.tickers.push((dt) => {
  rateAcc += dt;
  if (rateAcc > 500) {
    rateAcc = 0;
    recomputeRates();
  }
  const bank = bankUnlocked();
  let dep = 0;
  for (const h of G.s.habitats) {
    const r = habitatRate(h);
    if (r <= 0) continue;
    if (bank) {
      dep += r * (dt / 1000);
      // whatever was sitting in the buffer goes in too ("ignores LLENO")
      if (h.buffer > 0) {
        dep += h.buffer;
        h.buffer = 0;
      }
    } else h.buffer = Math.min(habitatCap(h), h.buffer + r * (dt / 1000));
  }
  deposit(dep);
  // fish piles (KL21 "Mar de Pescados Automático": they go straight to the Silo too)
  const silo = autoHarvestOn();
  for (const h of G.s.habitats) {
    const fr = habitatFishRate(h);
    if (fr <= 0) continue;
    if (silo) {
      siloAcc += fr * (dt / 1000) + fishBuffer(h);
      fishMap()[h.id] = 0;
    } else addFish(h, fr * (dt / 1000));
  }
  if (siloAcc >= 1) {
    const n = Math.floor(siloAcc);
    siloAcc -= n;
    G.add('food', n, 'auto_fish');
  }
});
let siloAcc = 0;
G.offliners.push((ms) => {
  recomputeRates();
  const bank = bankUnlocked();
  const bankMs = bankOfflineHours() * 3600 * 1000;
  let dep = 0;
  for (const h of G.s.habitats) {
    const r = habitatRate(h);
    if (bank) dep += r * (Math.min(ms, bankMs) / 1000);
    else h.buffer = Math.min(habitatCap(h), h.buffer + r * (ms / 1000));
  }
  for (const h of G.s.habitats) {
    const fr = habitatFishRate(h);
    if (fr <= 0) continue;
    if (autoHarvestOn()) G.add('food', Math.floor(fr * Math.min(ms, bankMs) / 1000), 'auto_fish');
    else addFish(h, fr * (ms / 1000));
  }
  if (bank) {
    deposit(dep);
    const b = bankState();
    b.lastOfflineGold = dep;
    b.lastOfflineMs = ms;
  }
});

// ---------------------------------------------------------------- new game setup
export function setupNewIsland() {
  const s = G.s;
  s.habitats = [];
  // the starting habitats stand where the first plots always were (the home paths lead there)
  BAL.start.habitats.forEach((hb, i) => {
    const spot = LEGACY_PLOTS.home[i];
    s.habitats.push({ id: G.uid('h'), element: hb.element, tier: hb.tier, region: HOME, plot: i, gx: spot[0], gy: spot[1], buffer: 0, cats: [], busy: false });
  });
  (s.ext ??= {}).habitatsRecord = s.habitats.length;
  s.farms = [];
  ensureFarmPlots();
}
export { ensureFarmPlots };

// every loaded save: habitats without a valid footprint get the nearest free spot (never removed).
// unshift: runs before the retro patches (state/patches.ts), which may house cats in them.
G.afterLoad.unshift(() => {
  const n = ensureHabitatPositions();
  if (n) console.info(`[island] ${n} hábitat(s) reubicados en un lugar libre`);
  const ext = (G.s.ext ??= {}) as Record<string, unknown>;
  ext.habitatsRecord = Math.max(Number(ext.habitatsRecord ?? 0), G.s.habitats.length);
});

// ---------------------------------------------------------------- 2026-10 · free habitats (SAVE v3)
registerPatch({
  id: '2026-10-habitats-reembolso',
  why: 'Hábitats libres: el hábitat extra y las mejoras de tier 4–8 cuestan menos que antes (y menos cristales). Quien ya pagó el precio viejo recibe la diferencia; nunca se cobra.',
  run() {
    const start = BAL.start.habitats.length;
    const L = BAL.habitats.legacy;
    let gold = 0;
    // extra habitats, in the order they were bought (the save keeps them in purchase order)
    const seen: Record<string, number> = {};
    G.s.habitats.forEach((h, i) => {
      if (i >= start) {
        const paidOld = legacyHabitatCost(i);
        const paidNew = newHabitatCost(i, seen[h.element] ?? 0);
        gold += Math.max(0, paidOld - paidNew);
      }
      seen[h.element] = (seen[h.element] ?? 0) + 1;
    });
    // tier upgrades already paid (an upgrade still running was paid too)
    const crystals: Record<string, number> = {};
    for (const h of G.s.habitats) {
      const running = G.s.timers.find((t) => t.kind === 'habitat_upgrade' && t.ref === h.id);
      const reached = running ? Number(running.data?.tier ?? h.tier + 1) : h.tier;
      for (let t = 2; t <= reached; t++) {
        const o = L.tiers[t - 1];
        const n = BAL.habitats.tiers[t - 1];
        if (!o || !n) continue;
        gold += Math.max(0, o.cost - n.cost);
        const dc = Math.max(0, o.crystals - n.crystals);
        if (dc) crystals[h.element] = (crystals[h.element] ?? 0) + dc;
      }
    }
    gold = Math.floor(gold);
    if (gold > 0) G.add('gold', gold, 'patch_refund');
    let nc = 0;
    for (const [el, n] of Object.entries(crystals)) {
      G.s.crystals[el] = (G.s.crystals[el] ?? 0) + n;
      nc += n;
    }
    if (gold > 0 || nc > 0)
      return `Los hábitats y sus mejoras bajaron de precio. Te devolvimos la diferencia de lo que ya habías pagado: +${fmt(gold)} Doblones${nc ? ` y +${nc} cristales` : ''}.`;
  },
});

registerPatch({
  id: '2026-10-habitats-capacidad',
  why: 'Los tiers 3+ ahora tienen más espacio (capacidad 4/5/6/7/8/10): los gatos sin casa que ya caben se mudan solos.',
  run() {
    const before = G.s.cats.filter((c) => !c.habitat).length;
    autoHouse();
    const moved = before - G.s.cats.filter((c) => !c.habitat).length;
    if (moved > 0) return `Tus hábitats ahora tienen más espacio: ${moved === 1 ? '1 gato sin casa se mudó' : `${moved} gatos sin casa se mudaron`} solo${moved === 1 ? '' : 's'}.`;
  },
});
