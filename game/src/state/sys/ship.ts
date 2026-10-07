/** Player ships: owned/active, Mk per family (global), shipyard timers, crew, Ship Power (SP), layout editor. */
import { G } from '../game';
import { CONTENT, SHIP_BY_ID } from '../../data/content';
import { BAL, FamilyId, modulePower, moduleCost, mkCap, mkMaterials } from '../econ';
import { cat as getCat, catPow } from './cats';
import { ShipBlueprint, MATERIAL_HP, Material, DIRS } from '../../battle/ship';
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

/** content role line ("Rápido y ligero…") and "recomendado para" */
export function shipRole(shipId: string) {
  return (SHIP_BY_ID.get(shipId) as unknown as { role?: string })?.role ?? '';
}
export function shipRecommendedFor(shipId: string) {
  return (SHIP_BY_ID.get(shipId) as unknown as { recommendedFor?: string })?.recommendedFor ?? '';
}
export function shipName(shipId: string) {
  return SHIP_BY_ID.get(shipId)?.name ?? balanceShip(shipId)?.name ?? shipId;
}

/** switch the ship that sails (fills an empty crew with the strongest cats) */
export function setActiveShip(id: string) {
  if (!G.s.ship.owned.includes(id)) return false;
  const changed = G.s.ship.active !== id;
  G.s.ship.active = id;
  if (!crew(id).length) autoCrew(id);
  if (changed) {
    G.count('switch_ship');
    G.count(`switch_ship_${id}`);
  }
  G.recalc();
  return true;
}

// ---------------------------------------------------------------- Mk
export function mk(f: FamilyId) {
  return G.s.ship.mk[f] ?? 0;
}
export function mkUnlocked(f: FamilyId) {
  if (f === 'shield') return G.s.campaign.bossesDefeated >= 3;
  return true;
}
/** the boss you must beat to reach Mk `n` (cap rule: Mk ≤ bosses + 2) */
export function bossForMk(n: number) {
  return Math.max(0, n - 2);
}
/** null when the Mk is allowed by bosses; otherwise the requirement text ("Mk III requiere vencer al Jefe 1") */
export function mkRequirement(n: number): { boss: number; text: string } | null {
  if (n <= mkCap(G.s.campaign.bossesDefeated)) return null;
  const b = bossForMk(n);
  return { boss: b, text: `Mk ${roman(n)} requiere vencer al Jefe ${b}` };
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
  const req = mkRequirement(c.next);
  if (req) return { ok: false, why: req.text };
  if (G.timerFor('yard', f)) return { ok: false, why: 'En obra' };
  if (yardBusy() >= yardQueues()) return { ok: false, why: 'Astillero ocupado' };
  if (G.s.gold < c.gold) return { ok: false, why: 'Faltan Doblones' };
  if (G.s.scrap < c.scrap) return { ok: false, why: 'Falta Chatarra' };
  if (G.s.blueprint < c.blueprint) return { ok: false, why: 'Faltan Planos' };
  if (c.crystals && totalCrystals() < c.crystals) return { ok: false, why: 'Faltan Cristales' };
  return { ok: true, why: '' };
}
export function totalCrystals() {
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
    G.emit('res', { key: 'crystal', delta: -c.crystals });
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
  if (f === 'shield' && G.s.ship.mk.shield >= 1) G.count('equip_shield');
  G.recalc();
});

export function buyShip(id: string) {
  const b = balanceShip(id);
  if (!b || G.s.ship.owned.includes(id)) return false;
  if (!shipUnlocked(id)) return false;
  if (!G.spend({ gold: b.cost })) return false;
  G.s.ship.owned.push(id);
  G.s.ship.crew[id] = [];
  G.count(`own_ship_${id}`);
  G.count('own_ships');
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
/** "REINO 15" / "JEFE 3" */
export function shipUnlockText(id: string) {
  const [k, v] = (balanceShip(id)?.unlock ?? '').split(':');
  return k === 'kl' ? `Reino ${v}` : k === 'boss' ? `Jefe ${v}` : '???';
}

// ---------------------------------------------------------------- power
export function slotPower(shipId = G.s.ship.active) {
  const b = balanceShip(shipId);
  let slots = 0;
  for (const f of FAMILIES) {
    const n = (b.slots as Record<string, number>)[f] ?? 0;
    if (n > 0 && mk(f) > 0) slots += n * modulePower(f, mk(f));
  }
  return slots;
}
export function shipPower(shipId = G.s.ship.active, crewUids = crew(shipId)) {
  const b = balanceShip(shipId);
  let crewPow = 0;
  for (const u of crewUids) {
    const c = getCat(u);
    if (c) crewPow += catPow(c);
  }
  return b.mult * (slotPower(shipId) + crewPow);
}

export function hullClass(m = mk('hull')) {
  return HULL_BY_MK[Math.max(0, Math.min(6, m - 1))];
}

// ---------------------------------------------------------------- layout editor (GDD 2.8)
export interface LayoutModule {
  kind: string;
  x: number;
  y: number;
  w: number;
  h: number;
  slot?: number;
}
export interface UtilityDef {
  kind: string;
  name: string;
  cost: number;
  footprint: [number, number];
  material: string;
  alive: string;
  destroyed: string;
  unlock: string;
}
export const UTILITY: UtilityDef[] = ((CONTENT.modules as { utility?: UtilityDef[] })?.utility ?? []) as UtilityDef[];
export const UTILITY_BY_KIND = new Map(UTILITY.map((u) => [u.kind, u]));
/** structural modules: fixed count per ship (can be moved, never removed) */
export const FIXED_KINDS = new Set(['core', 'cannon', 'catroom', 'engine', 'shield']);
/** module kinds the combat sim understands; other utility kinds become hull cells in battle (effects via gear.ts) */
export const SIM_KINDS = new Set(['core', 'cannon', 'catroom', 'mast', 'shield', 'engine', 'powder', 'arcane']);

export const MODULE_NAME: Record<string, string> = {
  core: 'Corazón',
  cannon: 'Cañón',
  catroom: 'Camarote',
  engine: 'Motor',
  shield: 'Escudo',
  ...Object.fromEntries(UTILITY.map((u) => [u.kind, u.name])),
};

export function utilityCost(kind: string) {
  return UTILITY_BY_KIND.get(kind)?.cost ?? 0;
}
export function utilityBudget(shipId: string) {
  return SHIP_BY_ID.get(shipId)?.utilityBudget ?? 0;
}
export function utilityUnlocked(kind: string) {
  const u = UTILITY_BY_KIND.get(kind);
  if (!u) return false;
  if (u.unlock === 'start') return true;
  if (G.has(`module:${kind}`)) return true;
  const [k, v] = u.unlock.split(':');
  if (k === 'mission') return G.s.missions.done.includes(v);
  if (k === 'boss') return G.s.campaign.bossesDefeated >= Number(v);
  if (k === 'expansion') return G.s.expansions.cleared.includes(Number(v));
  return G.has(u.unlock);
}
export function utilityUnlockText(kind: string) {
  const u = UTILITY_BY_KIND.get(kind);
  if (!u) return '';
  const [k, v] = u.unlock.split(':');
  if (k === 'mission') return `Misión ${v}`;
  if (k === 'boss') return `Vence al Jefe ${v}`;
  if (k === 'expansion') return `Expansión ${v}`;
  return u.unlock;
}

export function defaultLayout(shipId: string): LayoutModule[] {
  const def = SHIP_BY_ID.get(shipId);
  return (def?.modules ?? []).map((m) => ({ kind: m.kind, x: m.x, y: m.y, w: m.w, h: m.h, ...(m.slot !== undefined ? { slot: m.slot } : {}) }));
}
/** the saved layout if valid, else the content default */
export function layoutOf(shipId = G.s.ship.active): LayoutModule[] {
  const saved = G.s.layouts?.[shipId];
  if (saved?.length) {
    const copy = saved.map((m) => ({ ...m }));
    if (validateLayout(shipId, copy).ok) return copy;
  }
  return defaultLayout(shipId);
}
export function isCustomLayout(shipId = G.s.ship.active) {
  return !!G.s.layouts?.[shipId]?.length && validateLayout(shipId, G.s.layouts[shipId].map((m) => ({ ...m }))).ok;
}
/** save a layout (refuses invalid ships) */
export function saveLayout(shipId: string, mods: LayoutModule[]) {
  const copy = mods.map((m) => ({ kind: m.kind, x: m.x, y: m.y, w: m.w, h: m.h, ...(m.slot !== undefined ? { slot: m.slot } : {}) }));
  if (!validateLayout(shipId, copy).ok) return false;
  G.s.layouts ??= {};
  G.s.layouts[shipId] = copy;
  G.recalc();
  return true;
}
export function resetLayout(shipId: string) {
  if (G.s.layouts) delete G.s.layouts[shipId];
  G.recalc();
}
export function layoutSig(mods: LayoutModule[]) {
  return mods.map((m) => `${m.kind}${m.x},${m.y}`).join('|');
}

export interface LayoutIssue {
  code: 'bounds' | 'overlap' | 'floating' | 'mast' | 'engine' | 'core' | 'catroom' | 'budget' | 'count' | 'locked';
  msg: string;
  /** index in the module list */
  module?: number;
}
export interface LayoutCheck {
  ok: boolean;
  issues: LayoutIssue[];
  /** "x,y" of cells not connected to the keel */
  floating: Set<string>;
  /** module indices with a problem */
  bad: Set<number>;
  utilityUsed: number;
  budget: number;
}

function hullChars(shipId: string): string[] {
  return SHIP_BY_ID.get(shipId)?.hull ?? [];
}
const isHullCh = (ch: string | undefined) => !!ch && ch !== '.';

/** occupancy grid: -1 empty, -2 plain hull, >=0 module index */
export function occupancy(shipId: string, mods: LayoutModule[], skip = -1) {
  const def = SHIP_BY_ID.get(shipId)!;
  const { cols, rows } = def.grid;
  const hull = hullChars(shipId);
  const occ: number[][] = [];
  for (let y = 0; y < rows; y++) {
    occ.push([]);
    for (let x = 0; x < cols; x++) occ[y].push(isHullCh(hull[y]?.[x]) ? -2 : -1);
  }
  mods.forEach((m, i) => {
    if (i === skip) return;
    for (let yy = m.y; yy < m.y + m.h; yy++)
      for (let xx = m.x; xx < m.x + m.w; xx++) if (yy >= 0 && yy < rows && xx >= 0 && xx < cols) occ[yy][xx] = i;
  });
  return occ;
}

/** BFS from the keel (bottom row) over filled cells. Returns the set of connected "x,y". */
function connected(occ: number[][], removed?: Set<string>) {
  const rows = occ.length;
  const cols = occ[0]?.length ?? 0;
  const seen = new Set<string>();
  const st: [number, number][] = [];
  const filled = (x: number, y: number) => x >= 0 && y >= 0 && x < cols && y < rows && occ[y][x] !== -1 && !removed?.has(`${x},${y}`);
  for (let x = 0; x < cols; x++)
    if (filled(x, rows - 1)) {
      seen.add(`${x},${rows - 1}`);
      st.push([x, rows - 1]);
    }
  while (st.length) {
    const [x, y] = st.pop()!;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      const k = `${nx},${ny}`;
      if (filled(nx, ny) && !seen.has(k)) {
        seen.add(k);
        st.push([nx, ny]);
      }
    }
  }
  return seen;
}

export const MAX_BULKHEADS = 3;

export function validateLayout(shipId: string, mods: LayoutModule[]): LayoutCheck {
  const def = SHIP_BY_ID.get(shipId);
  const issues: LayoutIssue[] = [];
  const bad = new Set<number>();
  const floating = new Set<string>();
  const budget = utilityBudget(shipId);
  let used = 0;
  if (!def) return { ok: false, issues: [{ code: 'count', msg: 'Barco desconocido' }], floating, bad, utilityUsed: 0, budget };
  const { cols, rows } = def.grid;
  const hull = hullChars(shipId);
  const add = (code: LayoutIssue['code'], msg: string, module?: number) => {
    issues.push({ code, msg, module });
    if (module !== undefined) bad.add(module);
  };
  // counts of structural modules must match the ship
  const base = defaultLayout(shipId);
  for (const k of FIXED_KINDS) {
    const need = base.filter((m) => m.kind === k).length;
    const have = mods.filter((m) => m.kind === k).length;
    if (need !== have) add('count', `Faltan o sobran módulos: ${MODULE_NAME[k] ?? k} (${have}/${need})`);
  }
  // bounds + overlap
  const owner: number[][] = Array.from({ length: rows }, () => Array(cols).fill(-1));
  /** factory-fitted utility (in the content layout) is allowed even before you unlock it elsewhere */
  const factoryLeft = new Map<string, number>();
  for (const m of base) if (!FIXED_KINDS.has(m.kind)) factoryLeft.set(m.kind, (factoryLeft.get(m.kind) ?? 0) + 1);
  mods.forEach((m, i) => {
    if (m.x < 0 || m.y < 0 || m.x + m.w > cols || m.y + m.h > rows) {
      add('bounds', `${moduleLabel(mods, i)} se sale del plano`, i);
      return;
    }
    for (let yy = m.y; yy < m.y + m.h; yy++)
      for (let xx = m.x; xx < m.x + m.w; xx++) {
        const o = owner[yy][xx];
        if (o >= 0) {
          add('overlap', `${moduleLabel(mods, i)} se encima con ${moduleLabel(mods, o)}`, i);
          bad.add(o);
        } else owner[yy][xx] = i;
      }
    if (!FIXED_KINDS.has(m.kind)) {
      used += utilityCost(m.kind);
      const factory = factoryLeft.get(m.kind) ?? 0;
      if (factory > 0) factoryLeft.set(m.kind, factory - 1);
      if (!UTILITY_BY_KIND.has(m.kind)) add('locked', `Módulo desconocido: ${m.kind}`, i);
      else if (factory <= 0 && !utilityUnlocked(m.kind)) add('locked', `${MODULE_NAME[m.kind]} aún no está desbloqueado`, i);
    }
  });
  if (used > budget) add('budget', `Utilería ${used}/${budget}: te pasaste del presupuesto`);
  // Mamparos: real iron cells, so they're capped (playtest: a hull full of free bulkheads was unsinkable)
  const bulk = mods.filter((m) => m.kind === 'bulkhead').length;
  if (bulk > MAX_BULKHEADS) add('budget', `Mamparos ${bulk}/${MAX_BULKHEADS}: máximo ${MAX_BULKHEADS} por barco`);
  // connectivity (same BFS as battle/ship.ts collapse)
  const occ = occupancy(shipId, mods);
  const conn = connected(occ);
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) if (occ[y][x] !== -1 && !conn.has(`${x},${y}`)) floating.add(`${x},${y}`);
  if (floating.size) {
    const loose = new Set<number>();
    for (const k of floating) {
      const [x, y] = k.split(',').map(Number);
      if (occ[y][x] >= 0) loose.add(occ[y][x]);
    }
    for (const i of loose) add('floating', `${moduleLabel(mods, i)} no está conectado a la quilla: se caería`, i);
    if (!loose.size) add('floating', 'Hay casco suelto: se caería al agua');
  }
  const filled = (x: number, y: number) => x >= 0 && y >= 0 && x < cols && y < rows && occ[y][x] !== -1;
  const hullAt = (x: number, y: number) => isHullCh(hull[y]?.[x]);
  mods.forEach((m, i) => {
    if (bad.has(i)) return;
    if (m.kind === 'mast') {
      // stands on the top deck: its foot touches the hull and nothing is stacked on it
      const footY = m.y + m.h - 1;
      let onHull = false;
      for (let xx = m.x; xx < m.x + m.w; xx++) if (hullAt(xx, footY + 1) || hullAt(xx, footY)) onHull = true;
      let covered = false;
      for (let xx = m.x; xx < m.x + m.w; xx++) if (filled(xx, m.y - 1)) covered = true;
      if (!onHull || covered || m.y >= def.grid.waterlineRow) add('mast', 'El mástil va parado sobre la cubierta superior', i);
    } else if (m.kind === 'engine') {
      if (m.y + m.h - 1 < rows - 3) add('engine', 'El motor va en las filas de abajo, sobre la quilla', i);
    } else if (m.kind === 'core') {
      let ringOk = true;
      for (let yy = m.y - 1; yy <= m.y + m.h; yy++)
        for (let xx = m.x - 1; xx <= m.x + m.w; xx++) {
          const inside = yy >= m.y && yy < m.y + m.h && xx >= m.x && xx < m.x + m.w;
          if (!inside && !filled(xx, yy)) ringOk = false;
        }
      if (!ringOk) add('core', 'El Corazón necesita casco alrededor (≥1 celda del borde)', i);
    } else if (m.kind === 'catroom') {
      let touches = false;
      for (let yy = m.y - 1; yy <= m.y + m.h && !touches; yy++)
        for (let xx = m.x - 1; xx <= m.x + m.w; xx++) {
          const corner = (yy === m.y - 1 || yy === m.y + m.h) && (xx === m.x - 1 || xx === m.x + m.w);
          if (!corner && hullAt(xx, yy)) {
            touches = true;
            break;
          }
        }
      if (!touches) add('catroom', 'Los camarotes tienen que tocar la cubierta o el casco', i);
    }
  });
  return { ok: issues.length === 0, issues, floating, bad, utilityUsed: used, budget };
}

/**
 * Collapse preview ("si te rompen esto, se cae esto"): remove the module's cells (or one cell)
 * and BFS from the keel. Returns cells and module indices that would sink with it.
 */
export function collapsePreview(shipId: string, mods: LayoutModule[], target: { module?: number; cell?: [number, number] }) {
  const occ = occupancy(shipId, mods);
  const removed = new Set<string>();
  if (target.module !== undefined) {
    const m = mods[target.module];
    if (m) for (let yy = m.y; yy < m.y + m.h; yy++) for (let xx = m.x; xx < m.x + m.w; xx++) removed.add(`${xx},${yy}`);
  } else if (target.cell) removed.add(`${target.cell[0]},${target.cell[1]}`);
  const conn = connected(occ, removed);
  const cells: [number, number][] = [];
  const modules = new Set<number>();
  for (let y = 0; y < occ.length; y++)
    for (let x = 0; x < occ[y].length; x++) {
      const k = `${x},${y}`;
      if (occ[y][x] === -1 || removed.has(k) || conn.has(k)) continue;
      cells.push([x, y]);
      if (occ[y][x] >= 0) modules.add(occ[y][x]);
    }
  // a module "falls" if more than half its cells go (battle rule: dies at > 50% lost)
  const falling: number[] = [];
  for (const i of modules) {
    const m = mods[i];
    const n = cells.filter(([x, y]) => x >= m.x && x < m.x + m.w && y >= m.y && y < m.y + m.h).length;
    if (n > (m.w * m.h) / 2) falling.push(i);
  }
  return { cells, modules: falling };
}

/** "Cañón 2", "Camarote 3", "Mástil / Cofa"… (numbers follow module order per kind) */
export function moduleLabel(mods: LayoutModule[], i: number) {
  const m = mods[i];
  if (!m) return '';
  const same = mods.filter((x) => x.kind === m.kind);
  const n = same.indexOf(m) + 1;
  if (m.kind === 'catroom') return `Camarote ${(m.slot ?? n - 1) + 1}`;
  if (same.length > 1) return `${MODULE_NAME[m.kind] ?? m.kind} ${n}`;
  return MODULE_NAME[m.kind] ?? m.kind;
}

/** Player blueprint for battle: layout (custom or default) with 'H' → hull material by Casco Mk. */
export function playerBlueprint(shipId = G.s.ship.active): { bp: ShipBlueprint; hpMul: number } {
  return blueprintFor(shipId, layoutOf(shipId));
}
/** blueprint of `shipId` with an arbitrary module list (editor preview); battle uses playerBlueprint */
export function blueprintFor(shipId: string, mods: LayoutModule[]): { bp: ShipBlueprint; hpMul: number } {
  const def = SHIP_BY_ID.get(shipId)!;
  const hc = hullClass();
  const letter = hc.mat === 'wood' ? 'W' : hc.mat === 'iron' ? 'I' : 'C';
  const hull = def.hull.map((r) => r.replace(/H/g, letter).split(''));
  const shieldsOn = mk('shield') >= 1 && mkUnlocked('shield');
  const modules: ShipBlueprint['modules'] = [];
  for (const m of mods) {
    const asModule = SIM_KINDS.has(m.kind) && (m.kind !== 'shield' || shieldsOn);
    if (asModule) {
      modules.push({ kind: m.kind as ShipBlueprint['modules'][number]['kind'], x: m.x, y: m.y, w: m.w, h: m.h, slot: m.slot });
      continue;
    }
    // utility the sim doesn't model yet (or unpowered shield): keep it as structure
    for (let yy = m.y; yy < m.y + m.h; yy++) for (let xx = m.x; xx < m.x + m.w; xx++) if (hull[yy] && xx < hull[yy].length) hull[yy][xx] = m.kind === 'bulkhead' || m.kind === 'pump' || m.kind === 'anchor' ? 'I' : letter;
  }
  return { bp: { cols: def.grid.cols, rows: def.grid.rows, hull: hull.map((r) => r.join('')), modules }, hpMul: hc.cellHp / MATERIAL_HP[hc.mat] };
}

export function roman(n: number) {
  return ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][n] ?? String(n);
}

// ---------------------------------------------------------------- weapon types per cannon slot
export function weaponUnlocked(id: string) {
  const w = WEAPON_TYPES.find((x) => x.id === id);
  if (!w) return false;
  if (w.unlock === 'start') return true;
  if (G.has(w.unlock) || G.has(`weapon:${id}`)) return true;
  if (w.unlock.startsWith('element:')) return G.s.elements.includes(w.unlock.split(':')[1]);
  // GDD alternatives: Mortero = secreto de la Expansión 3, Riel = Jefe 4
  if (id === 'mortero') return G.s.expansions.secrets.includes(3);
  if (id === 'escarcha') return G.s.expansions.secrets.includes(5);
  if (id === 'riel') return G.s.campaign.bossesDefeated >= 4;
  return false;
}
/** how to get a locked weapon type (teaser copy) */
export const WEAPON_UNLOCK_HINT: Record<string, string> = {
  canon: 'De serie',
  mortero: 'Enciende La Forja Dormida (Expansión 3)',
  tesla: 'Vence al Jefe 2 y descubre la Tormenta',
  escarcha: 'Descongela al gato del glaciar (Expansión 5)',
  arpon: 'Evento: Migración del Leviatán',
  riel: 'Vence al Jefe 4',
  starbreaker: 'Evento: Estrella Fugaz',
};
export function cannonCount(shipId = G.s.ship.active) {
  return SHIP_BY_ID.get(shipId)?.modules.filter((m) => m.kind === 'cannon').length ?? 0;
}
export function weaponsOf(shipId = G.s.ship.active): string[] {
  const n = cannonCount(shipId);
  const cur = G.s.ship.weapons?.[shipId] ?? [];
  return Array.from({ length: n }, (_, i) => (cur[i] && weaponUnlocked(cur[i]) ? cur[i] : 'canon'));
}
export function setWeapon(shipId: string, slot: number, id: string) {
  if (!weaponUnlocked(id)) return false;
  G.s.ship.weapons ??= {};
  const list = weaponsOf(shipId);
  list[slot] = id;
  G.s.ship.weapons[shipId] = list;
  if (new Set(list).size >= 2) {
    G.count('weapon_types_2');
    if (!G.has('equip_weapon_types_2')) {
      G.flag('equip_weapon_types_2');
      G.count('equip_weapon_types');
    }
  }
  return true;
}
export function cannonShotsFor(shipId = G.s.ship.active) {
  return weaponsOf(shipId).map(weaponShot);
}

// ---------------------------------------------------------------- shield types (family Escudo, GDD 2.8)
export interface ShieldType {
  id: string;
  name: string;
  unlock: string;
  rule: string;
}
export const SHIELD_TYPES: ShieldType[] = ((CONTENT.modules as { families?: { shield?: { types?: ShieldType[] } } })?.families?.shield?.types ?? []) as ShieldType[];
export const SHIELD_UNLOCK_HINT: Record<string, string> = {
  burbuja: 'Vence al Jefe 3 (Kraken Voltaico)',
  espejo: 'Concha Espejo (Expansión 7)',
  arcano: 'Vence al Jefe 4',
  sacrificial: 'Evento: Marea Fantasma',
  vacio: 'Capítulo 2 · requiere el elemento Vacío',
};
export function shieldUnlocked(id: string) {
  if (id === 'burbuja') return G.s.campaign.bossesDefeated >= 3 || G.has('shield:burbuja');
  if (id === 'espejo') return G.has('shield:espejo');
  if (id === 'arcano') return G.s.campaign.bossesDefeated >= 4;
  if (id === 'sacrificial') return G.has('shield:sacrificial');
  return false;
}
export function shieldSlots(shipId = G.s.ship.active) {
  return (balanceShip(shipId)?.slots as Record<string, number> | undefined)?.shield ?? 0;
}
