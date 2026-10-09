/**
 * M2 economy systems: worker cats (KL24), expeditions (Puerto de las Mareas), resonance queue (KL18).
 * GDD 2.5 (workers), 2.15 (automations), 2.19 (expeditions), 2.6 rule 7 (queue).
 * All numbers come from balance.json (cats.workers, expeditions).
 */
import { G } from '../game';
import { BAL } from '../econ';
import { catDef, ZONES } from '../../data/content';
import { cat as getCat } from './cats';
import { crew, setCrew } from './ship';
import { startResonance, freeSlots } from './resonance';
import { expansionBonus } from './island';
import { zoneUnlocked } from './campaign';

// ---------------------------------------------------------------- workers
export type WorkerRole = 'banker' | 'farmer' | 'builder' | 'voyager';
export const WORKER_ROLES: WorkerRole[] = ['banker', 'farmer', 'builder', 'voyager'];
export const WORKER_NAME: Record<WorkerRole, string> = { banker: 'Banquero', farmer: 'Granjero', builder: 'Constructor', voyager: 'Viajero' };
type WorkerCfg = { value: number; max: number; name: string; effect: string };

export function workerCfg(role: WorkerRole): WorkerCfg {
  return (BAL.cats.workers as unknown as Record<WorkerRole, WorkerCfg>)[role];
}
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
/** cats whose species can take this job (working or not) */
export function workerCandidates(role: WorkerRole) {
  return G.s.cats.filter((c) => catDef(c.species).worker === role);
}
/** why a cat can't start working right now (null = ok) */
export function workerBlocker(uid: string): string | null {
  if (!workersUnlocked()) return `Los oficios abren en Reino ${BAL.cats.workers.unlock_kl}.`;
  const role = canWork(uid);
  if (!role) return 'Este gato no tiene oficio (y está orgulloso de eso).';
  if (workerRoleOf(uid)) return null;
  if (workers(role).length >= workerCfg(role).max) return `Ya tienes ${workerCfg(role).max} ${WORKER_NAME[role].toLowerCase()}s: es el máximo.`;
  return null;
}
export function assignWorker(uid: string, on: boolean) {
  if (!workersUnlocked()) return false;
  const role = canWork(uid);
  if (!role) return false;
  if (on) {
    if (workerRoleOf(uid)) return true;
    if (workers(role).length >= workerCfg(role).max) return false;
    G.s.workers[uid] = role;
    // a working cat can't sail
    for (const sh of Object.keys(G.s.ship.crew)) setCrew(sh, crew(sh).filter((u) => u !== uid));
    G.count('workers_assigned');
    G.count(`workers_assigned_${role}`);
  } else delete G.s.workers[uid];
  G.recalc();
  return true;
}
export function workerBonus(role: WorkerRole, habitatId?: string) {
  const cfg = workerCfg(role);
  const list = workers(role).filter((c) => !habitatId || c.habitat === habitatId);
  return Math.min(cfg.max, list.length) * cfg.value;
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
export function expeditionsUnlocked() {
  return expeditionSlots() > 0;
}
export function expeditionSlots() {
  return expansionBonus('expedition_slots');
}
export function expeditions(): Expedition[] {
  return G.s.expeditions;
}
/** durations offered (seconds) — balance.expeditions.durations_s */
export function expeditionDurations(): number[] {
  return BAL.expeditions.durations_s;
}
/** zones the player already reached (expeditions only go to discovered seas) */
export function expeditionZones() {
  return ZONES.filter((z) => zoneUnlocked(z.zone)).map((z) => z.zone);
}
export function zoneName(zone: number) {
  return ZONES[zone - 1]?.name ?? `Zona ${zone}`;
}
/** cats on the ACTIVE ship can't leave; nor can cats already away */
export function expeditionBlocker(uid: string): string | null {
  if (expeditions().some((x) => x.cats.includes(uid))) return 'Ya está de expedición.';
  if (crew().includes(uid)) return 'Está en la tripulación del barco activo.';
  return null;
}
export interface ExpeditionLoot {
  scrap: number;
  crystals: number;
  orbs: number;
  /** expected blueprints (fraction = chance of one more) */
  blueprints: number;
  element: string;
}
/** loot formula (balance.expeditions): h^0.85 × (1 + 0.5·viajeros) × rates of the zone */
/** Parte 2: a cat of a multiverse element brings back crystals of ITS element (their habitats need them for tiers 5+);
 * Parte II's Cristal works the same (no campaign zone of its own either) */
const MULTIVERSE = ['ice', 'sound', 'shadow', 'time', 'light', 'void', 'crystal'];
export function expeditionCrystalElement(catUids: string[]): string | null {
  for (const u of catUids) {
    const c = getCat(u);
    const el = c ? catDef(c.species).elements.find((e) => MULTIVERSE.includes(e)) : undefined;
    if (el) return el;
  }
  return null;
}
export function expeditionLoot(zone: number, hours: number, catUids: string[]): ExpeditionLoot {
  const e = BAL.expeditions;
  const k = Math.pow(hours, e.hour_exponent);
  const voyagers = Math.min(workerCfg('voyager').max, catUids.filter((u) => workerRoleOf(u) === 'voyager').length);
  const m = k * (1 + workerCfg('voyager').value * voyagers);
  return {
    scrap: Math.round((e.scrap_per_h + e.scrap_per_zone_per_h * zone) * m),
    crystals: Math.round(e.crystals_per_h * m),
    orbs: Math.round(e.orbs_per_h * m),
    blueprints: e.blueprint_per_h * m,
    // a cat of a multiverse element brings back crystals of ITS element (state/sys/grietas.ts)
    element: expeditionCrystalElement(catUids) ?? ZONES[zone - 1]?.elements[0] ?? 'fire',
  };
}
export function startExpedition(zone: number, hours: number, catUids: string[]) {
  if (expeditions().length >= expeditionSlots() || !catUids.length) return null;
  if (catUids.some((u) => expeditionBlocker(u))) return null;
  const secs = Math.round(hours * 3600);
  const ex: Expedition = { id: G.uid('x'), zone, hours, cats: catUids.slice(0, 2), timerId: '', ready: false };
  const t = G.startTimer('expedition', ex.id, secs * 1000, `Expedición · ${zoneName(zone)}`, 'combat', { zone, secs });
  ex.timerId = t.id;
  expeditions().push(ex);
  G.count('expeditions_started');
  return ex;
}
export interface ClaimedLoot {
  scrap: number;
  crystals: number;
  element: string;
  blueprints: number;
  orbs: { species: string; n: number }[];
}
export function claimExpedition(id: string): ClaimedLoot | null {
  const list = expeditions();
  const ex = list.find((x) => x.id === id);
  if (!ex || !ex.ready) return null;
  const loot = expeditionLoot(ex.zone, ex.hours, ex.cats);
  const bp = Math.floor(loot.blueprints) + (Math.random() < loot.blueprints % 1 ? 1 : 0);
  G.add('scrap', loot.scrap, 'expedition');
  G.addCrystals(loot.element, loot.crystals);
  if (bp) G.add('blueprint', bp, 'expedition');
  // the orbs belong to the cats that went ("so you can train one for its stars")
  const orbs: { species: string; n: number }[] = [];
  const cats = ex.cats.map((u) => getCat(u)).filter((c): c is NonNullable<typeof c> => !!c);
  cats.forEach((c, i) => {
    const n = Math.floor(loot.orbs / cats.length) + (i < loot.orbs % cats.length ? 1 : 0);
    if (n > 0) {
      G.addOrbs(c.species, n);
      orbs.push({ species: c.species, n });
    }
  });
  G.s.expeditions = list.filter((x) => x !== ex);
  G.count('expeditions_done');
  G.count(`expeditions_done_${Math.round(ex.hours * 3600)}`);
  G.xp('victory', undefined, 0.5);
  // KL32: auto-repeat with the same crew and duration
  if (G.s.kl >= 32) startExpedition(ex.zone, ex.hours, ex.cats);
  return { scrap: loot.scrap, crystals: loot.crystals, element: loot.element, blueprints: bp, orbs };
}
export function readyExpeditions() {
  return expeditions().filter((x) => x.ready);
}
G.onTimer('expedition', (t) => {
  const ex = expeditions().find((x) => x.id === t.ref);
  if (ex) ex.ready = true;
});

/** what keeps a cat off the ship right now (UI: crew pickers should grey these out) */
export function catBusy(uid: string): 'worker' | 'expedition' | null {
  if (expeditions().some((x) => x.cats.includes(uid))) return 'expedition';
  if (isWorking(uid)) return 'worker';
  return null;
}

// ---------------------------------------------------------------- resonance queue (KL18)
export function resonanceQueue(): { a: string; b: string }[] {
  return G.s.resQueue;
}
export function queueUnlocked() {
  return G.s.kl >= (BAL.automation.find((a) => a.id === 'resonance_queue')?.kl ?? 18);
}
export function queueResonance(a: string, b: string) {
  if (!queueUnlocked()) return false;
  const q = resonanceQueue();
  if (q.length >= 3 * G.s.resonance.slots) return false;
  q.push({ a, b });
  if (q.length >= 3) G.count('feature_resonance_queue');
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

// ---------------------------------------------------------------- ticker: queue pump + "working/away cats don't sail"
let sanAcc = 0;
G.tickers.push((dt) => {
  if (resonanceQueue().length && freeSlots() > 0) pumpQueue();
  sanAcc += dt;
  if (sanAcc < 1000) return;
  sanAcc = 0;
  for (const sh of Object.keys(G.s.ship.crew)) {
    const cur = G.s.ship.crew[sh] ?? [];
    if (cur.some((u) => catBusy(u))) setCrew(sh, cur.filter((u) => !catBusy(u)));
  }
});
