/**
 * M2 economy systems: worker cats (KL24), expeditions (Puerto de las Mareas), resonance queue (KL18).
 * GDD 2.5 (workers), 2.19 (expeditions), 2.6 rule 7 (queue).
 */
import { G } from '../game';
import { BAL } from '../econ';
import { catDef, ZONES } from '../../data/content';
import { cat as getCat } from './cats';
import { crew, setCrew } from './ship';
import { startResonance, freeSlots } from './resonance';
import { expansionBonus } from './island';

// ---------------------------------------------------------------- workers
export type WorkerRole = 'banker' | 'farmer' | 'builder' | 'voyager';
export const WORKER_NAME: Record<WorkerRole, string> = { banker: 'Banquero', farmer: 'Granjero', builder: 'Constructor', voyager: 'Viajero' };
type WorkerCfg = { value: number; max: number; name: string };

export function workersUnlocked() {
  return G.s.kl >= BAL.cats.workers.unlock_kl;
}
export function workerRoleOf(uid: string): WorkerRole | null {
  return (G.s.workers[uid] as WorkerRole) || null;
}
export function workers(role?: WorkerRole) {
  return G.s.cats.filter((c) => {
    const r = workerRoleOf(c.uid);
    return r && (!role || r === role);
  });
}
/** a cat can only work the role its species has (balance catdex worker) */
export function canWork(uid: string): WorkerRole | null {
  const c = getCat(uid);
  if (!c) return null;
  return (catDef(c.species).worker as WorkerRole) ?? null;
}
export function assignWorker(uid: string, on: boolean) {
  if (!workersUnlocked()) return false;
  const role = canWork(uid);
  if (!role) return false;
  if (on) {
    const cfg = (BAL.cats.workers as unknown as Record<WorkerRole, WorkerCfg>)[role];
    if (workers(role).length >= cfg.max) return false;
    G.s.workers[uid] = role;
    // a working cat can't sail
    for (const sh of Object.keys(G.s.ship.crew)) setCrew(sh, crew(sh).filter((u) => u !== uid));
    G.count('workers_assigned');
  } else delete G.s.workers[uid];
  G.recalc();
  return true;
}
export function workerBonus(role: WorkerRole, habitatId?: string) {
  const cfg = (BAL.cats.workers as unknown as Record<WorkerRole, WorkerCfg>)[role];
  const list = workers(role).filter((c) => !habitatId || c.habitat === habitatId);
  return list.length * cfg.value;
}
export function isWorking(uid: string) {
  return !!workerRoleOf(uid);
}

// ---------------------------------------------------------------- expeditions
export interface Expedition {
  id: string;
  zone: number;
  hours: number;
  cats: string[];
  timerId: string;
  ready: boolean;
}
export function expeditionSlots() {
  return expansionBonus('expedition_slots');
}
export function expeditions(): Expedition[] {
  return G.s.expeditions;
}
export function expeditionLoot(zone: number, hours: number, catUids: string[]) {
  const e = BAL.expeditions;
  const k = Math.pow(hours, e.hour_exponent);
  const voyagers = catUids.filter((u) => workerRoleOf(u) === 'voyager').length;
  const m = k * (1 + 0.5 * voyagers);
  return {
    scrap: Math.round((e.scrap_per_h + e.scrap_per_zone_per_h * zone) * m),
    crystals: Math.round(e.crystals_per_h * m),
    orbs: Math.round(e.orbs_per_h * m),
    blueprints: Math.floor(e.blueprint_per_h * m + Math.random() * 0.5),
    element: ZONES[zone - 1]?.elements[0] ?? 'fire',
  };
}
export function startExpedition(zone: number, hours: number, catUids: string[]) {
  if (expeditions().length >= expeditionSlots() || !catUids.length) return null;
  const busy = new Set(expeditions().flatMap((x) => x.cats));
  if (catUids.some((u) => busy.has(u) || crew().includes(u))) return null;
  const ex: Expedition = { id: G.uid('x'), zone, hours, cats: catUids.slice(0, 2), timerId: '', ready: false };
  const t = G.startTimer('expedition', ex.id, hours * 3600 * 1000, `Expedición Z${zone} (${hours} h)`, 'combat');
  ex.timerId = t.id;
  expeditions().push(ex);
  return ex;
}
export function claimExpedition(id: string) {
  const list = expeditions();
  const ex = list.find((x) => x.id === id);
  if (!ex || !ex.ready) return null;
  const loot = expeditionLoot(ex.zone, ex.hours, ex.cats);
  G.add('scrap', loot.scrap, 'expedition');
  G.addCrystals(loot.element, loot.crystals);
  if (loot.blueprints) G.add('blueprint', loot.blueprints, 'expedition');
  const sp = getCat(ex.cats[0])?.species;
  if (sp) G.addOrbs(sp, loot.orbs);
  G.s.expeditions = list.filter((x) => x !== ex);
  G.count('expeditions_done');
  // KL32: auto-repeat
  if (G.s.kl >= 32) startExpedition(ex.zone, ex.hours, ex.cats);
  return loot;
}
G.onTimer('expedition', (t) => {
  const ex = expeditions().find((x) => x.id === t.ref);
  if (ex) ex.ready = true;
});

// ---------------------------------------------------------------- resonance queue (KL18)
export function resonanceQueue(): { a: string; b: string }[] {
  return G.s.resQueue;
}
export function queueResonance(a: string, b: string) {
  if (G.s.kl < 18) return false;
  const q = resonanceQueue();
  if (q.length >= 3 * G.s.resonance.slots) return false;
  q.push({ a, b });
  return true;
}
/** called after a reveal frees a slot */
export function pumpQueue() {
  const q = resonanceQueue();
  while (q.length && freeSlots() > 0) {
    const n = q.shift()!;
    if (!startResonance(n.a, n.b)) break;
  }
}
G.tickers.push(() => {
  if (resonanceQueue().length && freeSlots() > 0) pumpQueue();
});
