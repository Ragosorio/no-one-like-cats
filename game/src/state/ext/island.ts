/**
 * Island UI helpers on top of the core systems (owned by the island module).
 * No new persistent schema: only reads G + calls state/sys functions; UI-only flags live in G.s.flags (ui_*).
 */
import { G, Habitat, OwnedCat } from '../game';
import { BAL } from '../econ';
import { EXPANSIONS, MISSION_BY_ID, catDef } from '../../data/content';
import {
  HOME,
  buildHabitat,
  builders,
  buildersBusy,
  canHouse,
  expansionState,
  freeHabitatPlot,
  habitatCap,
  habitatPlots,
  habitatRate,
  nextHabitatCost,
  regionsUnlocked,
} from '../sys/island';
import { checkMissions } from '../sys/missions';

export type AutoFeature = 'collect_all' | 'feed_bulk' | 'crop_repeat' | 'kingdom_bank' | 'auto_harvest';

export function featureKl(id: AutoFeature) {
  return BAL.automation.find((a) => a.id === id)?.kl ?? 99;
}
export function featureUnlocked(id: AutoFeature) {
  return G.s.kl >= featureKl(id);
}

export function expansionByRegion(id: string) {
  return EXPANSIONS.find((e) => e.id === id) ?? null;
}
export function regionLook(id: string): 'open' | 'veil' | 'available' | 'clearing' {
  if (id === HOME) return 'open';
  const e = expansionByRegion(id);
  if (!e) return 'veil';
  const st = expansionState(e.n);
  return st === 'cleared' ? 'open' : st === 'clearing' ? 'clearing' : st === 'available' ? 'available' : 'veil';
}

export function missionActive(id: string) {
  return G.s.missions.active.includes(id);
}
export function missionSeen(id: string) {
  return G.s.missions.active.includes(id) || G.s.missions.done.includes(id);
}
export function missionDone(id: string) {
  return G.s.missions.done.includes(id);
}

/** Canelo sleeps in his box until the player taps him (mission H01). */
export function caneloAsleep(c: OwnedCat) {
  return c.species === 'c_canelo' && missionActive('H01');
}
export function wakeCat(c: OwnedCat) {
  G.count('tap_cat');
  checkMissions();
  return true;
}
export function renameCat(c: OwnedCat, name: string) {
  const n = name.trim().slice(0, 18);
  if (!n) return false;
  c.name = n;
  G.count('name_cat');
  checkMissions();
  G.emit('changed', undefined);
  return true;
}

export function homelessCats() {
  return G.s.cats.filter((c) => !c.habitat);
}
export function habitatFull(h: Habitat) {
  const cap = habitatCap(h);
  return cap > 0 && h.buffer >= cap - 0.01;
}
export function habitatFill(h: Habitat) {
  const cap = habitatCap(h);
  return cap > 0 ? Math.min(1, h.buffer / cap) : 0;
}
export function habitatAt(region: string, plot: number) {
  return G.s.habitats.find((h) => h.region === region && h.plot === plot) ?? null;
}
export function plotUnlocked(region: string, plot: number) {
  return regionsUnlocked().includes(region) && plot < habitatPlots(region);
}

export function builderFree() {
  return buildersBusy() < builders();
}

/** reasons a habitat can't be built right now (null = ok) */
export function buildBlocker(): string | null {
  if (!freeHabitatPlot()) return 'No hay parcelas libres: compra una expansión.';
  if (!builderFree()) return 'Tus constructores están ocupados.';
  if (G.s.gold < nextHabitatCost()) return 'Te faltan Doblones.';
  return null;
}

/** build on a specific plot (the core system picks the first free plot; we move it to the tapped one) */
export function buildHabitatAt(element: string, region: string, plot: number) {
  const h = buildHabitat(element);
  if (!h) return null;
  if ((h.region !== region || h.plot !== plot) && !habitatAt(region, plot) && plotUnlocked(region, plot)) {
    h.region = region;
    h.plot = plot;
  }
  G.recalc();
  checkMissions();
  return h;
}

/** cats of an element that could move into this habitat (not already there) */
export function movableCats(h: Habitat) {
  return G.s.cats.filter((c) => c.habitat !== h.id && catDef(c.species).elements.includes(h.element));
}
export function homelessFor(element: string) {
  return homelessCats().filter((c) => catDef(c.species).elements.includes(element));
}
export function canHouseCat(h: Habitat, c: OwnedCat) {
  return canHouse(h, c.species);
}

export function habitatIncome(h: Habitat) {
  return habitatRate(h);
}

/** island scale for a cat: 0.85 at Nv1 → 1.0 at Nv50 */
export function catLevelScale(level: number) {
  return 0.85 + 0.15 * Math.min(1, (level - 1) / 49);
}

/** UI-only "seen" flags (persist with the save, no unlock event) */
export function uiSeen(key: string) {
  return !!G.s.flags[`ui_${key}`];
}
export function setUiSeen(key: string) {
  G.s.flags[`ui_${key}`] = true;
}

/** onboarding: hide calls-to-action until the story gets there (GDD: ≤3 new concepts at once) */
export function ctaVisible(key: 'sow' | 'build') {
  if (key === 'sow') return missionSeen('H03') || (G.s.counters.plant ?? 0) > 0 || G.s.kl >= 3;
  return missionSeen('K03') || G.s.habitats.length > BAL.start.habitats.length || G.s.kl >= 3;
}

/** which HUD buttons exist yet (GDD: never more than ~3 new concepts on screen) */
export function hudUnlocks() {
  return {
    sanctuary: missionSeen('H06') || G.has('santuario_resonancia') || G.s.resonance.total > 0,
    catdex: G.has('catdex') || missionDone('K07') || Object.keys(G.s.catdex).length > 3,
    shipyard: G.has('puerto_combate') || missionDone('H05') || G.s.campaign.cleared.length > 0,
    sail: missionSeen('H05') || G.s.campaign.cleared.length > 0,
    collectAll: featureUnlocked('collect_all'),
    momentum: uiSeen('momentum') || G.s.momentum > 1.005,
    gems: uiSeen('gems') || G.s.gems > 0,
    mesa: G.s.campaign.bossesDefeated >= 1,
    altar: G.has('altar_almas'),
  };
}

export { MISSION_BY_ID };
