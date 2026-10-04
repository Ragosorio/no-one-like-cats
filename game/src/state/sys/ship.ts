/** Player ships: owned/active, Mk per family (global), shipyard timers, crew, Ship Power (SP). */
import { G } from '../game';
import { SHIP_BY_ID } from '../../data/content';
import { BAL, FamilyId, modulePower, moduleCost, mkCap, mkMaterials } from '../econ';
import { cat as getCat, catPow } from './cats';
import { ShipBlueprint, MATERIAL_HP, Material } from '../../battle/ship';
import { WEAPON_TYPES, weaponShot } from '../../battle/weapons';

export const FAMILIES: FamilyId[] = ['hull', 'weapon', 'shield', 'engine', 'core'];
export const FAMILY_NAME: Record<FamilyId, string> = { hull: 'Casco', weapon: 'Armas', shield: 'Escudos', engine: 'Motor', core: 'Núcleo' };

/** Hull class per Casco Mk (GDD 2.8) */
export const HULL_BY_MK = [
  { name: 'Casco de Balsa', mat: 'wood' as Material, cellHp: 60 },
  { name: 'Balandra', mat: 'wood' as Material, cellHp: 75 },
  { name: 'Fragata', mat: 'iron' as Material, cellHp: 90 },
  { name: 'Galeón', mat: 'iron' as Material, cellHp: 110 },
  { name: 'Acorazado de Coral', mat: 'crystal' as Material, cellHp: 125 },
  { name: 'Acorazado Arcano', mat: 'crystal' as Material, cellHp: 145 },
  { name: 'Casco Celestial', mat: 'crystal' as Material, cellHp: 170 },
];

export function balanceShip(id: string) {
  return BAL.ship.ships.find((s) => s.id === id)!;
}
export function activeShip() {
  return G.s.ship.active;
}
export function crewSize(shipId: string) {
  return balanceShip(shipId)?.crew ?? 3;
}
export function crew(shipId = G.s.ship.active) {
  return (G.s.ship.crew[shipId] ?? []).filter((u) => !!getCat(u));
}
export function setCrew(shipId: string, uids: string[]) {
  G.s.ship.crew[shipId] = uids.slice(0, crewSize(shipId));
  G.recalc();
}
/** fill empty crew slots with the strongest free cats */
export function autoCrew(shipId = G.s.ship.active) {
  const cur = crew(shipId);
  const pool = G.s.cats.filter((c) => !cur.includes(c.uid)).sort((a, b) => catPow(b) - catPow(a));
  while (cur.length < crewSize(shipId) && pool.length) cur.push(pool.shift()!.uid);
  setCrew(shipId, cur);
}

// ---------------------------------------------------------------- Mk
export function mk(f: FamilyId) {
  return G.s.ship.mk[f] ?? 0;
}
export function mkUnlocked(f: FamilyId) {
  if (f === 'shield') return G.s.campaign.bossesDefeated >= 3;
  return true;
}
export function upgradeCost(f: FamilyId) {
  const next = mk(f) + 1;
  const mats = mkMaterials(next);
  return {
    gold: moduleCost(f, next),
    scrap: mats.scrap,
    blueprint: mats.blueprints,
    crystals: f === 'weapon' || f === 'shield' || f === 'core' ? mats.crystals : 0,
    timeMs: mats.timeMs,
    next,
  };
}
export function yardBusy() {
  return G.s.timers.filter((t) => t.kind === 'yard').length;
}
export function yardQueues() {
  return BAL.start.yard_queues + (G.s.expansions.cleared.includes(4) ? 1 : 0);
}
export function canUpgrade(f: FamilyId) {
  if (!mkUnlocked(f)) return { ok: false, why: 'Se desbloquea con el Jefe 3' };
  const c = upgradeCost(f);
  if (c.next > BAL.ship.mk.max) return { ok: false, why: 'Mk máximo' };
  if (c.next > mkCap(G.s.campaign.bossesDefeated)) return { ok: false, why: `Mk ${c.next} requiere vencer al siguiente jefe` };
  if (G.timerFor('yard', f)) return { ok: false, why: 'En obra' };
  if (yardBusy() >= yardQueues()) return { ok: false, why: 'Astillero ocupado' };
  if (G.s.gold < c.gold) return { ok: false, why: 'Faltan Doblones' };
  if (G.s.scrap < c.scrap) return { ok: false, why: 'Falta Chatarra' };
  if (G.s.blueprint < c.blueprint) return { ok: false, why: 'Faltan Planos' };
  if (c.crystals && totalCrystals() < c.crystals) return { ok: false, why: 'Faltan Cristales' };
  return { ok: true, why: '' };
}
function totalCrystals() {
  return Object.values(G.s.crystals).reduce((a, b) => a + b, 0);
}
export function upgrade(f: FamilyId) {
  if (!canUpgrade(f).ok) return false;
  const c = upgradeCost(f);
  G.spend({ gold: c.gold, scrap: c.scrap, blueprint: c.blueprint });
  if (c.crystals) {
    // spend from the largest crystal stacks
    let left = c.crystals;
    for (const k of Object.keys(G.s.crystals).sort((a, b) => G.s.crystals[b] - G.s.crystals[a])) {
      const use = Math.min(left, G.s.crystals[k]);
      G.s.crystals[k] -= use;
      left -= use;
      if (left <= 0) break;
    }
  }
  G.startTimer('yard', f, c.timeMs, `${FAMILY_NAME[f]} Mk ${roman(c.next)}`, 'combat', { mk: c.next });
  return true;
}
G.onTimer('yard', (t) => {
  const f = t.ref as FamilyId;
  G.s.ship.mk[f] = (t.data?.mk as number) ?? mk(f) + 1;
  G.xp('ship_upgrade');
  G.count(`mk_${f}_${G.s.ship.mk[f]}`);
  G.count('ship_upgrades');
  G.recalc();
});

export function buyShip(id: string) {
  const b = balanceShip(id);
  if (!b || G.s.ship.owned.includes(id)) return false;
  if (!G.spend({ gold: b.cost })) return false;
  G.s.ship.owned.push(id);
  G.s.ship.crew[id] = [];
  G.count(`own_ship_${id}`);
  return true;
}
export function shipUnlocked(id: string) {
  const u = balanceShip(id)?.unlock ?? 'start';
  if (u === 'start') return true;
  const [k, v] = u.split(':');
  if (k === 'kl') return G.s.kl >= Number(v);
  if (k === 'boss') return G.s.campaign.bossesDefeated >= Number(v);
  return false;
}

// ---------------------------------------------------------------- power
export function shipPower(shipId = G.s.ship.active, crewUids = crew(shipId)) {
  const b = balanceShip(shipId);
  let slots = 0;
  for (const f of FAMILIES) {
    const n = (b.slots as Record<string, number>)[f] ?? 0;
    if (n > 0 && mk(f) > 0) slots += n * modulePower(f, mk(f));
  }
  let crewPow = 0;
  for (const u of crewUids) {
    const c = getCat(u);
    if (c) crewPow += catPow(c);
  }
  return b.mult * (slots + crewPow);
}

/** Player blueprint for battle: content layout with 'H' → hull material by Casco Mk. */
export function playerBlueprint(shipId = G.s.ship.active): { bp: ShipBlueprint; hpMul: number } {
  const def = SHIP_BY_ID.get(shipId)!;
  const hc = HULL_BY_MK[Math.max(0, Math.min(6, mk('hull') - 1))];
  const letter = hc.mat === 'wood' ? 'W' : hc.mat === 'iron' ? 'I' : 'C';
  const hull = def.hull.map((r) => r.replace(/H/g, letter));
  const modules = def.modules
    .filter((m) => ['core', 'cannon', 'catroom', 'mast', 'shield', 'engine', 'powder', 'arcane'].includes(m.kind))
    .map((m) => ({ kind: m.kind as ShipBlueprint['modules'][number]['kind'], x: m.x, y: m.y, w: m.w, h: m.h, slot: m.slot }));
  return { bp: { cols: def.grid.cols, rows: def.grid.rows, hull, modules }, hpMul: hc.cellHp / MATERIAL_HP[hc.mat] };
}

export function roman(n: number) {
  return ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][n] ?? String(n);
}

// ---------------------------------------------------------------- weapon types per cannon slot
export function weaponUnlocked(id: string) {
  const w = WEAPON_TYPES.find((x) => x.id === id);
  if (!w) return false;
  if (w.unlock === 'start') return true;
  if (w.unlock.startsWith('element:')) return G.s.elements.includes(w.unlock.split(':')[1]);
  return G.has(w.unlock);
}
export function cannonCount(shipId = G.s.ship.active) {
  return SHIP_BY_ID.get(shipId)?.modules.filter((m) => m.kind === 'cannon').length ?? 0;
}
export function weaponsOf(shipId = G.s.ship.active): string[] {
  const n = cannonCount(shipId);
  const cur = G.s.ship.weapons?.[shipId] ?? [];
  return Array.from({ length: n }, (_, i) => cur[i] ?? 'canon');
}
export function setWeapon(shipId: string, slot: number, id: string) {
  if (!weaponUnlocked(id)) return false;
  G.s.ship.weapons ??= {};
  const list = weaponsOf(shipId);
  list[slot] = id;
  G.s.ship.weapons[shipId] = list;
  if (new Set(list).size >= 2) G.count('weapon_types_2');
  return true;
}
export function cannonShotsFor(shipId = G.s.ship.active) {
  return weaponsOf(shipId).map(weaponShot);
}
