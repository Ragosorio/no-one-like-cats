/**
 * Parte II · Oleada 3 «LA ERA ASTRAL» (docs/part-ii/25-oleada-3.md · guion 13). Same pattern as rupturasO2.ts:
 * story battles, flags and the systems this wave brings. Imported by state/index.ts after rupturasO2.ts.
 *
 *   H50 Puerto Cometa              use_feature region_cometa      (flag region:cometa; arriving = done) → Escafandra's
 *                                                                  gift: Kit Astral on your aerobarco + a full tank
 *   H51 Sincronía                  win_battle ruptura_sincronia   (the port's test dock, gravity ×0.5: SINCRO) → Tanquecito
 *   H52 La Estrella que empujaron  win_battle ruptura_estrella    (first ASTRAL battle: ×0.25, no wind, a towed
 *                                                                  planetoid with an orbital well) → Satélito
 *   H53 Canelo Astral              use_feature sello_canelo       (break the seal: app/oleada3Flow) → forma:canelo_astral
 *   H54 Maneki, el conserje        use_feature ficha_maneki       (sweep the Archivo's card) → Maneki joins (if not yours)
 *   H55 Los Disruptores            win_battle ruptura_disruptores (2 phases: astral → GLITCH, rifts that flip owners)
 *   H56 La nota al margen…         use_feature firma_bitacora     (sign the port's logbook)
 *   H57 El Leviatán Invertido      win_battle ruptura_leviatan    (MULTI-LAYER BOSS: sea → sky → astral rift, battle/fases.ts)
 *                                                                  → Jonás · flag oleada3_fin
 *
 * Systems: COMBUSTIBLE ASTRAL (a soft resource: at stake in ETERNO, cats/forms never are) and the KIT ASTRAL (your
 * aerobarco becomes a NAVE ASTRAL: same ship, same name) — `G.s.ext.astral`, sold at the TALLER COMETA
 * (panels/CometaShop.ts). Astral battles need a nave astral and fuel (app/oleada3Flow.ts astralPreflight).
 * Missions + beats: data/rupturas/historia-o3.json; when each beat plays: ui/story/rupturasScriptO3.ts.
 */
import { G } from '../game';
import { registerPatch } from '../patches';
import { STORY_BATTLES, StoryBattleDef } from './storyBattles';
import { adopt } from './cats';
import { claimReward, rewardClaimed } from './rupturasLedger';
import { hasFlightKit, installFlightKit, kitShips } from './rupturasO2';
import { ETERNO_EXTRA } from './casino/eterno';
import { CATA_INFO, poderDe } from '../../battle/cataclysm';
import type { CataId } from '../../battle/cataclysm';
import type { StageRules } from '../../battle/sim';
import type { FaseDef, FaseEnv, FasesCfg } from '../../battle/fases';
import { REGION_INFO, RegionId } from '../../regions';
import { registerWorldState, type WorldLook, type WorldSave } from './worldState';

const done = (id: string) => !!G.s?.missions?.done.includes(id);
const seen = (id: string) => !!G.s?.missions && (G.s.missions.active.includes(id) || G.s.missions.done.includes(id));

/** Oleada 2 finished (H49 «Primordial de la Gravedad»): the sky's seam opens */
export const oleada3Open = () => done('H49');

// ------------------------------------------------------------------ Puerto Cometa on the CARTA
export const O3_REGION_MISSION: Partial<Record<RegionId, string>> = { cometa: 'H50' };
export function syncO3Flags() {
  if (!G.s?.missions) return;
  for (const [r, m] of Object.entries(O3_REGION_MISSION)) {
    const f = REGION_INFO[r as RegionId]?.mapFlag;
    if (f && m && seen(m) && !G.has(f)) G.flag(f);
  }
}
G.on('mission', (p) => {
  if (p.kind !== 'progress') syncO3Flags();
});
G.afterLoad.push(syncO3Flags);

// ------------------------------------------------------------------ COMBUSTIBLE ASTRAL + KIT ASTRAL
/**
 * Save data (optional; absent = never reached Puerto Cometa): `G.s.ext.astral = { fuel, at, kit }`.
 *   fuel  Combustible Astral (soft: at stake in ETERNO like gold; never below 0, never above the tank)
 *   at    last refinery tick (ms): Puerto Cometa refines FUEL_PROD.per every FUEL_PROD.everyMs, offline too, up to the tank
 *   kit   { level, ships, at } — the KIT ASTRAL: level 1 nave astral · 2 Escudo de Cometa · 3 Velas Solares (global, like
 *         the Kit de Vuelo); `ships` = YOUR ships that carry it (they keep id, name, crew, layout and history)
 */
export interface AstralSave {
  fuel: number;
  at: number;
  kit: { level: number; ships: string[]; at?: number };
}
export interface AstralLevelDef {
  level: number;
  name: string;
  what: string;
  /** seconds of gold income · scrap · blueprints · Combustible Astral */
  cost: { goldSecs: number; scrap: number; blueprint: number; fuel: number };
}
export const ASTRAL_LEVELS: AstralLevelDef[] = [
  { level: 1, name: 'KIT ASTRAL', what: 'Tu aerobarco se vuelve NAVE ASTRAL (y sigue siendo tuyo). Sin él no hay batallas en el vacío.', cost: { goldSecs: 0, scrap: 0, blueprint: 0, fuel: 0 } },
  { level: 2, name: 'ESCUDO DE COMETA', what: 'En el vacío, el primer impacto rival a tu casco en cada capa se deshace contra el escudo.', cost: { goldSecs: 3600, scrap: 400, blueprint: 0, fuel: 20 } },
  { level: 3, name: 'VELAS SOLARES', what: 'Cada viaje cuesta la mitad de combustible y el tanque crece a 150.', cost: { goldSecs: 7200, scrap: 800, blueprint: 12, fuel: 40 } },
];
/** installing on another ship of yours (the first one is Escafandra's gift) */
export const ASTRAL_EXTRA_SHIP = { goldSecs: 1800, scrap: 150, fuel: 10 };
/** the refinery: +1 every 4 minutes of real time (15/h), offline too, up to the tank. No aggressive timers. */
export const FUEL_PROD = { per: 1, everyMs: 4 * 60_000 };
export const TANK = { base: 60, velas: 150 };
/** a trip into the void (an astral battle). Velas Solares halve it. */
export const TRIP_COST = 10;
/** the Taller sells fuel for gold (a gold sink: bible §11): 10 for ~4 min of income, at least 1 500 */
export const FUEL_PACK = { n: 10, goldSecs: 240, minGold: 1500 };
/** Escafandra's gift on arrival (H50, once per save: ledger `fuel:mission_H50`) */
export const ARRIVAL_FUEL = 40;
/** first win of each astral story battle pays some fuel back (ledger `fuel:<battle>`) */
export const WIN_FUEL = 15;

const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
/** pure: a well-formed copy of whatever is in the save (tests call it directly). null = nothing usable. */
export function normalizeAstral(raw: unknown): AstralSave | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const k = (r.kit && typeof r.kit === 'object' && !Array.isArray(r.kit) ? r.kit : {}) as Record<string, unknown>;
  const ships = Array.isArray(k.ships) ? [...new Set(k.ships.filter((x): x is string => typeof x === 'string' && !!x))] : [];
  const lv = Math.floor(num(k.level, 1));
  const kit: AstralSave['kit'] = { level: ships.length ? Math.max(1, Math.min(ASTRAL_LEVELS.length, lv)) : 0, ships };
  if (typeof k.at === 'number' && Number.isFinite(k.at)) kit.at = k.at;
  const cap = kit.level >= 3 ? TANK.velas : TANK.base;
  return { fuel: Math.max(0, Math.min(Math.max(cap, 9999), Math.floor(num(r.fuel)))), at: num(r.at, 0), kit };
}
function save(): AstralSave | null {
  return normalizeAstral(G.s.ext?.astral);
}
function write(a: AstralSave) {
  (G.s.ext ??= {}).astral = a;
}
/** the namespace (created on demand: a save that never reached Puerto Cometa stays byte-identical) */
function ensure(): AstralSave {
  const a = save() ?? { fuel: 0, at: Date.now(), kit: { level: 0, ships: [] } };
  write(a);
  return a;
}
G.afterLoad.push(() => {
  const ext = G.s.ext;
  if (!ext || ext.astral === undefined) return;
  const a = normalizeAstral(ext.astral);
  if (a) ext.astral = a;
  else delete ext.astral;
});

/** Puerto Cometa is open to you (H50 appeared, or the save already holds astral data) */
export function cometaOpen() {
  return seen('H50') || !!save();
}
/** the refinery runs once you arrived (H50 done) */
export const refineryOn = () => done('H50') || !!save()?.kit.ships.length;

export function tankCap() {
  return astralKitLevel() >= 3 ? TANK.velas : TANK.base;
}
/** refine what the time gave (lazy: on every read). Pure in `now` for tests. */
export function refine(now = Date.now()) {
  const a = save();
  if (!a) return;
  if (!refineryOn()) {
    a.at = now;
    write(a);
    return;
  }
  const cap = tankCap();
  if (a.at <= 0 || a.at > now) a.at = now;
  const n = Math.floor((now - a.at) / FUEL_PROD.everyMs) * FUEL_PROD.per;
  if (n > 0) {
    const room = Math.max(0, cap - a.fuel);
    const add = Math.min(room, n);
    a.at = a.fuel + n >= cap ? now : a.at + (n / FUEL_PROD.per) * FUEL_PROD.everyMs;
    a.fuel += add;
    write(a);
    if (add) G.emit('res', { key: 'fuel', delta: add, source: 'refineria' });
  } else write(a);
}
/** Combustible Astral now */
export function fuel(): number {
  refine();
  return save()?.fuel ?? 0;
}
/** ms until the next refined unit (null = tank full or refinery off) */
export function nextFuelIn(now = Date.now()): number | null {
  const a = save();
  if (!a || !refineryOn() || a.fuel >= tankCap()) return null;
  return Math.max(0, FUEL_PROD.everyMs - (now - a.at));
}
/** add fuel (rewards, purchases). It may overfill the tank from a reward; the refinery stops while it's full. */
export function addFuel(n: number, source = 'premio') {
  if (!(n > 0)) return;
  refine();
  const a = ensure();
  a.fuel += Math.floor(n);
  write(a);
  G.emit('res', { key: 'fuel', delta: Math.floor(n), source });
}
export function spendFuel(n: number): boolean {
  if (n <= 0) return true;
  refine();
  const a = save();
  if (!a || a.fuel < n) return false;
  a.fuel -= n;
  write(a);
  G.emit('res', { key: 'fuel', delta: -n, source: 'viaje' });
  return true;
}
function setFuel(v: number) {
  const a = ensure();
  a.fuel = Math.max(0, Math.floor(v));
  write(a);
}

// ETERNO: Combustible Astral is a soft resource (bible §11) — ×2 on a win, 0 on a loss. Cats and forms never.
ETERNO_EXTRA.push({ key: 'fuel', name: 'Combustible Astral', get: () => save()?.fuel ?? 0, set: (v) => (save() ? setFuel(v) : undefined) });

// ---- the kit
/** ships of yours that are naves astrales */
export function astralShips(): string[] {
  const a = save();
  return a ? a.kit.ships.filter((s) => G.s.ship.owned.includes(s)) : [];
}
export function hasAstralKit(shipId = G.s.ship.active) {
  return astralShips().includes(shipId);
}
export function astralKitLevel() {
  return astralShips().length ? save()!.kit.level : 0;
}
/** what one trip into the void costs now */
export function tripCost() {
  return astralKitLevel() >= 3 ? Math.ceil(TRIP_COST / 2) : TRIP_COST;
}
const goldFor = (secs: number) => (secs <= 0 ? 0 : Math.max(2000, Math.round(G.goldPerSec * secs)));
export function astralInstallCost(): { gold: number; scrap: number; fuel: number } | null {
  if (!astralShips().length) return null;
  return { gold: goldFor(ASTRAL_EXTRA_SHIP.goldSecs), scrap: ASTRAL_EXTRA_SHIP.scrap, fuel: ASTRAL_EXTRA_SHIP.fuel };
}
export function canInstallAstral(shipId = G.s.ship.active): { ok: boolean; why: string } {
  if (!cometaOpen()) return { ok: false, why: 'Todavía no llegas a Puerto Cometa' };
  if (!G.s.ship.owned.includes(shipId)) return { ok: false, why: 'Ese barco no es tuyo' };
  if (hasAstralKit(shipId)) return { ok: false, why: 'Ya es nave astral' };
  if (!hasFlightKit(shipId)) return { ok: false, why: 'Primero tiene que volar: Kit de Vuelo (ASTILLERO › VUELO)' };
  const c = astralInstallCost();
  if (c && G.s.gold < c.gold) return { ok: false, why: 'Faltan Doblones' };
  if (c && G.s.scrap < c.scrap) return { ok: false, why: 'Falta Chatarra' };
  if (c && fuel() < c.fuel) return { ok: false, why: 'Falta Combustible Astral' };
  return { ok: true, why: '' };
}
function addShip(shipId: string) {
  const a = ensure();
  a.kit.ships.push(shipId);
  a.kit.level = Math.max(1, a.kit.level);
  a.kit.at ??= Date.now();
  write(a);
  G.count('feature_kit_astral');
  G.count(`kit_astral_${shipId}`);
  G.recalc();
}
/** your aerobarco becomes a NAVE ASTRAL (same id, name, crew, layout and history) */
export function installAstralKit(shipId = G.s.ship.active): boolean {
  if (!canInstallAstral(shipId).ok) return false;
  const c = astralInstallCost();
  if (c && !G.spend({ gold: c.gold, scrap: c.scrap })) return false;
  if (c && !spendFuel(c.fuel)) return false;
  addShip(shipId);
  return true;
}
export function astralUpgradeCost(): { gold: number; scrap: number; blueprint: number; fuel: number; next: AstralLevelDef } | null {
  const lv = astralKitLevel();
  const next = ASTRAL_LEVELS[lv];
  if (!lv || !next) return null;
  return { gold: goldFor(next.cost.goldSecs), scrap: next.cost.scrap, blueprint: next.cost.blueprint, fuel: next.cost.fuel, next };
}
export function canUpgradeAstral(): { ok: boolean; why: string } {
  if (!astralKitLevel()) return { ok: false, why: 'Primero instala el Kit Astral' };
  const c = astralUpgradeCost();
  if (!c) return { ok: false, why: 'Kit al máximo' };
  if (G.s.gold < c.gold) return { ok: false, why: 'Faltan Doblones' };
  if (G.s.scrap < c.scrap) return { ok: false, why: 'Falta Chatarra' };
  if (G.s.blueprint < c.blueprint) return { ok: false, why: 'Faltan Planos' };
  if (fuel() < c.fuel) return { ok: false, why: 'Falta Combustible Astral' };
  return { ok: true, why: '' };
}
export function upgradeAstralKit(): boolean {
  if (!canUpgradeAstral().ok) return false;
  const c = astralUpgradeCost()!;
  if (!G.spend({ gold: c.gold, scrap: c.scrap, blueprint: c.blueprint })) return false;
  if (!spendFuel(c.fuel)) return false;
  const a = ensure();
  a.kit.level = c.next.level;
  write(a);
  G.count(`kit_astral_lv${a.kit.level}`);
  G.recalc();
  return true;
}
export function fuelPackCost() {
  return Math.max(FUEL_PACK.minGold, Math.round(G.goldPerSec * FUEL_PACK.goldSecs));
}
export function canBuyFuel(): { ok: boolean; why: string } {
  if (!cometaOpen()) return { ok: false, why: 'Todavía no llegas a Puerto Cometa' };
  if (G.s.gold < fuelPackCost()) return { ok: false, why: 'Faltan Doblones' };
  return { ok: true, why: '' };
}
/** the Taller sells a pack (it may fill past the tank: you bought it) */
export function buyFuel(): boolean {
  if (!canBuyFuel().ok) return false;
  if (!G.spend({ gold: fuelPackCost() })) return false;
  addFuel(FUEL_PACK.n, 'taller');
  G.count('fuel_bought', FUEL_PACK.n);
  return true;
}

/**
 * H50: Escafandra's gift on arrival — a full first tank and the Kit Astral on your aerobarco (the active one if it
 * flies, else the first that does; a save with no aerobarco at all gets Hélice's kit too, so nothing deadlocks).
 * Paid once per save, forever (ledger): a replay after the narrative reset keeps what you have.
 */
export function grantCometaGift(): { fuel: number; ship: string | null } {
  const out = { fuel: 0, ship: null as string | null };
  if (!done('H50')) return out;
  ensure();
  if (!rewardClaimed('fuel:mission_H50')) {
    claimReward('fuel:mission_H50');
    addFuel(ARRIVAL_FUEL, 'escafandra');
    out.fuel = ARRIVAL_FUEL;
  }
  if (!astralShips().length) {
    let ship: string | undefined = hasFlightKit() ? G.s.ship.active : kitShips()[0];
    if (!ship) {
      // no aerobarco at all (an odd save): Hélice's first kit is free anyway
      installFlightKit(G.s.ship.active);
      ship = hasFlightKit() ? G.s.ship.active : undefined;
    }
    if (ship) {
      addShip(ship);
      claimReward('kit_astral:gift');
      out.ship = ship;
    }
  }
  return out;
}
G.on('mission', (p) => {
  if (p.id === 'H50' && p.kind === 'done') grantCometaGift();
});
G.afterLoad.push(() => {
  if (done('H50') && (!rewardClaimed('fuel:mission_H50') || !astralShips().length)) grantCometaGift();
  if (save()) refine();
});

/**
 * The TALLER COMETA (panels/CometaShop.ts), lazily — what Puerto Cometa's «Taller del Casco de Pecera» POI opens
 * (regions/cometa.ts looks for this export). Resolves when it closes.
 */
export async function openTallerCometa(): Promise<void> {
  const m = await import('../../panels/CometaShop');
  await m.openCometaShop();
}

// ------------------------------------------------------------------ the three interactions (app/oleada3Flow.ts)
/** H53 seal · H54 the Archivo's card · H56 the logbook: the mission that asks for each */
export const O3_FEATURES: Record<string, string> = { sello_canelo: 'H53', ficha_maneki: 'H54', firma_bitacora: 'H56' };
/** that interaction is open (its mission is active) */
export function featurePending(f: string) {
  const m = O3_FEATURES[f];
  return !!m && !!G.s.missions?.active.includes(m);
}
/** the player finished it: completes its mission (a replay after the reset plays it again) */
export function completeFeature(f: string): boolean {
  if (!featurePending(f)) return false;
  G.count(`feature_${f}`);
  if (f === 'firma_bitacora') G.flag('bitacora_firmada');
  return true;
}

// ------------------------------------------------------------------ cats the story hands over outside a battle
/** H54: Maneki stays with you (if she isn't yours already). Once per save, forever (ledger `cat:mission_H54`). */
export const O3_STORY_CATS: { species: string; after: string }[] = [{ species: 's_maneki', after: 'H54' }];
const o3CatKey = (c: { after: string }) => `cat:mission_${c.after}`;
export function o3PendingCats(): string[] {
  return O3_STORY_CATS.filter((c) => done(c.after) && !rewardClaimed(o3CatKey(c))).map((c) => c.species);
}
/** adopt it (once). Already yours → nothing is adopted; the ledger marks it so it's never offered again. */
export function claimO3Cat(species: string) {
  const c = O3_STORY_CATS.find((k) => k.species === species);
  if (!c || rewardClaimed(o3CatKey(c))) return null;
  claimReward(o3CatKey(c));
  if (G.s.cats.some((k) => k.species === species)) return { cat: null, isNew: false, orbs: 0, already: true as const };
  const r = adopt(species);
  G.save();
  return r;
}

// ------------------------------------------------------------------ the battles
/** the void: gravity ×0.25, no wind (bible §9.2) */
export const ASTRAL_G = 0.25;
const astral = (o: Partial<FaseEnv> = {}): FaseEnv => ({ g: ASTRAL_G, calm: true, layer: 'astral', ...o });
/** a planetoid in the middle of the field with an orbital well: a shot can swing around it */
export const PLANETOID = { up: 360, r: 46, well: { r: 330, k: 950 }, look: 'planet' };

interface O3Spec {
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
  phases: FaseDef[];
  /** a pure-void battle: needs a nave astral and a trip's fuel (app/oleada3Flow astralPreflight) */
  astral: boolean;
  rules?: Omit<StageRules, 'cataclysm' | 'fases'>;
  cata?: { id: CataId; by: string };
  intro: string[];
  color: number;
  reward: StoryBattleDef['reward'];
  /** difficulty band (state/sys/storyScale.ts); default historia */
  band?: StoryBattleDef['band'];
}
/**
 * Tuning (docs/part-ii/25-oleada-3.md §6, scripts/balance-astral.ts): headless sims on test-saves/post-finale.json's
 * crew with the Kit Astral level 1, AI aim normal + hard, 16 seeds each — numbers in the doc.
 * Losing costs nothing but the try (and the trip's fuel, which the Taller always sells and Escafandra fía);
 * it scales with your fleet like every story battle (the story never walls).
 */
export const O3_CATA_POWER = 4;
export const O3_SPECS: O3Spec[] = [
  {
    id: 'ruptura_sincronia',
    mission: 'H51',
    stage: 8,
    title: 'SINCRONÍA',
    enemy: 'El Muelle de Pruebas',
    captain: 'Escafandra',
    line: 'Examen práctico. Si sobreviven, les sello el pasaporte. Si no, también, pero con lástima.',
    archetype: 'fortin_piedra',
    enemyCats: ['r_escafandra', 'c_tanquecito', 'c_satelito', 'r_plasmin'],
    powerMul: 1.2,
    hpMulX: 2.5,
    phases: [{ id: 'muelle', name: 'El muelle de pruebas', env: { g: 0.5, calm: true, layer: 'astral' } }],
    astral: false,
    intro: [
      'EL MUELLE DE PRUEBAS: todo pesa x0.5 y no hay viento. Apunta más bajo y con menos fuerza.',
      'SINCRO: con {fire} Fuego y {storm} Tormenta en tu tripulación, suelta el disparo cuando brille el anillo (va al ritmo de la música): SOBRECARGA (Plasma), el golpe salta de módulo en módulo.',
      'Escafandra pelea con sus muchachos. {water} Agua y {earth} Tierra les pegan bien a casi todos.',
    ],
    color: 0x7fd8ff,
    reward: { cat: 'c_tanquecito' },
  },
  {
    id: 'ruptura_estrella',
    mission: 'H52',
    stage: 9,
    title: 'LA ESTRELLA QUE EMPUJARON',
    enemy: 'La Remolcadora',
    captain: 'La Remolcadora',
    line: 'Carga: un planetoide. Destino: otra caja. Motivo: no me corresponde preguntar.',
    archetype: 'observatorio',
    enemyCats: ['c_satelito', 'r_astral', 'e_meteoro', 'c_satelito'],
    // BALANCE DE JEFES (doc 27): with its 4th cat aboard (catrooms) ×1.2 → ×1.1
    powerMul: 1.1,
    hpMulX: 3,
    phases: [{ id: 'vacio', name: 'El vacío', env: astral({ bodies: [{ ...PLANETOID, drift: { dx: 110, every: 2 } }] }) }],
    astral: true,
    cata: { id: 'meteors', by: 'LA REMOLCADORA' },
    intro: [
      'EL VACÍO: todo pesa x0.25 y no hay viento. Tus tiros vuelan casi en línea recta: menos fuerza.',
      'EL REMOLQUE: arrastran un planetoide entre los barcos. Para los tiros, y su POZO ORBITAL los curva: un tiro puede darle la vuelta.',
      'Su tripulación es {cosmic} Cósmica. {earth} Tierra y {void} Vacío les pegan bien.',
    ],
    color: 0x8a5cff,
    reward: { element: 'cosmic', cat: 'c_satelito', crystals: 20 },
  },
  {
    id: 'ruptura_disruptores',
    mission: 'H55',
    stage: 9,
    title: 'LOS DISRUPTORES',
    enemy: 'La Lata de Pintura',
    captain: 'Brecha',
    line: '¡Ninguna caja es hogar! …Bueno, la mía sí, pero la mía es una nave. Es distinto.',
    archetype: 'galeon_runas',
    enemyCats: ['e_brecha', 'r_grafitera', 'c_hueco', 'r_ecomudo'],
    powerMul: 1.1,
    hpMulX: 3,
    phases: [
      { id: 'vacio', name: 'El vacío', env: astral({ bodies: [{ dx: -60, up: 440, r: 30, hp: 0.03, look: 'debris' }, { dx: 70, up: 250, r: 34, hp: 0.03, look: 'debris' }] }) },
      {
        id: 'glitch',
        name: 'Fase glitch',
        at: { hp: 0.5 },
        telegraph: 'ABREN GRIETAS: un tiro que entra por una sale por la otra… y cambia de dueño.',
        env: astral({ layer: 'glitch', portals: { a: { dx: -150, up: 470 }, b: { dx: 150, up: 300 }, r: 46 } }),
      },
    ],
    astral: true,
    cata: { id: 'moon', by: 'LOS DISRUPTORES' },
    intro: [
      'EL VACÍO: todo pesa x0.25 y no hay viento. Escombros flotando tapan el centro (se rompen).',
      'A la mitad abren GRIETAS: lo que entra por una sale por la otra y se vuelve del otro bando. No les tires a través.',
      'Su tripulación es de {void} Vacío y {storm} Tormenta. {crystal} Cristal y {earth} Tierra les pegan bien.',
    ],
    color: 0xff2e88,
    reward: { cat: 'r_grafitera' },
  },
  {
    id: 'ruptura_leviatan',
    band: 'jefe',
    mission: 'H57',
    stage: 9,
    title: 'EL LEVIATÁN INVERTIDO',
    enemy: 'El Leviatán Invertido',
    captain: 'El Leviatán',
    line: '…CORRIGE… ESE… MAR…',
    archetype: 'barco_hueso',
    enemyCats: ['e_cascada', 'e_brecha', 'l_masamadre', 'e_meteoro'],
    // band jefe (×1.1, storyScale.ts): ×1.02 here → ×1.12 of your Poder; with its 4th cat aboard (catrooms) that is
    // still harder than the old ×1.2 with three (BALANCE DE JEFES, doc 27)
    powerMul: 1.02,
    hpMulX: 3.5,
    phases: [
      { id: 'mar', name: 'El mar', env: { layer: 'sea' } },
      {
        id: 'cielo',
        name: 'El cielo',
        at: { hp: 0.34 },
        telegraph: 'TE ARRASTRA AL CIELO: todo pesa x0.7, el viento sopla x1.6 y una nube tapa el centro.',
        env: { g: 0.7, windMul: 1.6, layer: 'sky', bodies: [{ up: 430, r: 62, hp: 0.04, look: 'cloud' }] },
      },
      {
        id: 'grieta',
        name: 'La grieta astral',
        at: { hp: 0.67 },
        telegraph: 'LA GRIETA ASTRAL: casi nada pesa, no hay viento y un planetoide jala los tiros.',
        env: astral({ bodies: [{ ...PLANETOID, up: 380, r: 50, well: { r: 350, k: 1000 } }] }),
        effects: ['clearWells'],
      },
    ],
    astral: false,
    cata: { id: 'tide', by: 'EL LEVIATÁN' },
    intro: [
      'TRES CAPAS: empieza en el MAR. Al 34% de daño te arrastra al CIELO (x0.7, viento x1.6). Al 67%, a la GRIETA ASTRAL (x0.25, sin viento).',
      'Cada capa cambia cómo vuelan los tiros: mira la línea de tiro después de cada cambio.',
      'Lo cuidan sus cadenas: una tripulación de varios mundos. Ningún elemento les pega bien a todos: mezcla.',
    ],
    color: 0x2e3a5a,
    reward: { cat: 'l_jonas' },
  },
];
export const O3_BATTLES = O3_SPECS.map((s) => s.id);
/** pure-void battles: you need a nave astral and a trip's Combustible Astral (app/oleada3Flow preflight) */
export const ASTRAL_BATTLES = new Set(O3_SPECS.filter((s) => s.astral).map((s) => s.id));
export const isAstralBattle = (id: string) => ASTRAL_BATTLES.has(id);

/** the battle's phases with your kit read live (Escudo de Cometa: Kit Astral level 2+) */
export function fasesFor(s: O3Spec): FasesCfg {
  const shield = astralKitLevel() >= 2 && (s.astral || s.phases.some((p) => p.env?.layer === 'astral')) ? 1 : 0;
  return { side: 1, phases: s.phases, shield: [shield, 0] };
}

for (const s of O3_SPECS) {
  const def: StoryBattleDef = {
    id: s.id,
    mission: s.mission,
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
      const cata = s.cata ? { cataclysm: { id: s.cata.id, side: 1 as const, by: s.cata.by, first: 1, every: 3, power: O3_CATA_POWER } } : {};
      return { ...s.rules, ...cata, fases: fasesFor(s) };
    },
    intro: [...s.intro, ...(s.cata ? [`${poderDe(s.cata.by)}: ${CATA_INFO[s.cata.id].name} cada 3 turnos · TÍRALE A SU SELLO`] : [])],
    color: s.color,
    reward: s.reward,
    band: s.band ?? 'historia',
  };
  STORY_BATTLES[def.id] = def;
}

/** first win of a void battle pays some fuel back (once per save: ledger `fuel:<battle>`) */
G.on('mission', (p) => {
  if (p.kind !== 'done') return;
  const s = O3_SPECS.find((k) => k.mission === p.id && (k.astral || k.id === 'ruptura_leviatan'));
  if (!s || rewardClaimed(`fuel:${s.id}`)) return;
  claimReward(`fuel:${s.id}`);
  addFuel(WIN_FUEL, 'botin');
});

// ------------------------------------------------------------------ the world, as the story says it is (20 §1 · band 70–99)
/**
 * «Si la historia lo dice, pasa en el mundo» (docs/part-ii/25 «Pasada de cine»). Derived ONLY from mission progress and
 * the beat parts the scenes persist: a reload, a trip to the CARTA or the Parte II narrative reset land on the same world.
 * Daytime states follow the player's real clock (`clock`, like O1's `cielo_roto`). Part I saves never match any of them.
 * What lives IN the sky (the neon seam and its sign, the tug and its planetoid, the seal, the graffiti, the Leviathan, the
 * rift that stays open) and on the island (Canelo watching the seal / the rock, Maneki sweeping, the tag on your boat) is
 * drawn by ui/story/o3Sky.ts from the same progress (`o3SkyState`).
 *
 *   o3_costura      b50 a seen (the seam opened) … until H57: day, the seam open a crack, neon light through it
 *   o3_remolcadora  H52 active after its scene: the sky past the port — deeper blue, day stars, the tug crossing
 *   o3_sello        H53 active after its scene: violet dusk; a seal of runes breathes off your faro, Canelo stares at it
 *   o3_grafiti      H55 active after its scene: somebody painted the sky (neon graffiti, a little glitch in the light)
 *   o3_leviatan     H57 active after its scene: a cold, dark day; the Leviathan swims upside down up there, in chains
 *   o3_grieta       H57 done: day again; the astral rift never closed — it breathes, and a page's edge shows through
 */
export const O3_STATES = {
  costura: 'o3_costura',
  remolcadora: 'o3_remolcadora',
  sello: 'o3_sello',
  grafiti: 'o3_grafiti',
  leviatan: 'o3_leviatan',
  grieta: 'o3_grieta',
} as const;

export const O3_LOOKS: Record<keyof typeof O3_STATES, Partial<WorldLook>> = {
  costura: { seam: 1, starFall: 0.1, stars: 0.2, ambience: 'sea', music: 'island' },
  remolcadora: { exposure: 0.93, tint: 0xe8e6ff, saturation: 0.95, lift: 0x04040c, sky: 0.3, skyTint: 0xc8b8ff, stars: 0.5, starFall: 0.08, seam: 1, dayLife: 0.6, vignette: 0.18, cats: 0.25, ambience: 'wind', music: 'island' },
  sello: { exposure: 0.74, tint: 0xd2c2ff, saturation: 0.9, lift: 0x0c0820, sky: 0.62, skyTint: 0xd6a8ff, stars: 0.7, starFall: 0.15, aurora: 0.18, seam: 1, lights: 0.6, seaGlow: 0.45, vignette: 0.38, dayLife: 0.15, cats: 0.35, ambience: 'night_astral', music: 'island_night_astral' },
  grafiti: { exposure: 0.97, tint: 0xfff0fa, saturation: 1.04, sky: 0.18, skyTint: 0xff9ad6, stars: 0.35, starFall: 0.12, seam: 1, vignette: 0.1, ambience: 'wind', music: 'explore' },
  leviatan: { exposure: 0.82, tint: 0xc8dcff, saturation: 0.84, lift: 0x060c18, sky: 0.42, skyTint: 0x9fd0ff, stars: 0.45, seam: 1, seaGlow: 0.3, vignette: 0.32, dayLife: 0.3, cats: 0.65, ambience: 'wind', music: 'explore' },
  grieta: { seam: 1, starFall: 0.14, stars: 0.3, aurora: 0.05, ambience: 'sea', music: 'island' },
};

const o3ws = (id: keyof typeof O3_STATES, priority: number, when: (s: WorldSave) => boolean, note: string, o: { blend?: number; clock?: boolean } = {}) =>
  registerWorldState({ id: O3_STATES[id], priority, wave: 'O3', blend: o.blend ?? 5, note, when, look: O3_LOOKS[id], ...(o.clock ? { clock: true } : {}) });
const wsActive = (s: WorldSave, id: string) => s.missions.active.includes(id);
const wsDone = (s: WorldSave, id: string) => s.missions.done.includes(id);
const wsSeen = (s: WorldSave, k: string) => s.beatsSeen.includes(k) || s.beatsSeen.includes(k.split('#')[0]);
/** the seam opened over your island (H50 part a) — or the save is already past it */
export const costuraOpen = (s: WorldSave) => wsSeen(s, 'b50_cometa#a') || wsDone(s, 'H50');

o3ws('leviatan', 90, (s) => wsActive(s, 'H57') && wsSeen(s, 'b57_leviatan#a'), 'H57 activa (después de su escena): día frío; el Leviatán nada al revés allá arriba, encadenado.', { blend: 6 });
o3ws('sello', 85, (s) => wsActive(s, 'H53') && wsSeen(s, 'b53_canelo#a'), 'H53 activa (después de su escena): atardecer violeta; un sello de runas respira frente a tu faro y Canelo no le quita los ojos.', { blend: 6 });
o3ws('grafiti', 82, (s) => wsActive(s, 'H55') && wsSeen(s, 'b55_disruptores#a'), 'H55 activa (después de su escena): alguien pintó el cielo.', { clock: true });
o3ws('remolcadora', 80, (s) => wsActive(s, 'H52') && wsSeen(s, 'b52_estrella#a'), 'H52 activa (después de su escena): el cielo más allá del puerto; la Remolcadora cruza con su planetoide.', { clock: true });
o3ws('grieta', 72, (s) => wsDone(s, 'H57'), 'Después de la Oleada 3: de día; la grieta astral nunca se cerró, respira.', { clock: true, blend: 7 });
o3ws('costura', 71, (s) => costuraOpen(s) && !wsDone(s, 'H57'), 'La Era Astral: la costura del cielo abierta una rendija; luz de neón del otro lado.', { clock: true, blend: 6 });

// ------------------------------------------------------------------ old saves
registerPatch({
  id: '2026-10-oleada3-era-astral',
  why: 'Parte II · Oleada 3 (H50–H57) arranca después de H49: quien ya cerró la Oleada 2 debe enterarse.',
  run() {
    if (!oleada3Open()) return;
    return 'Empezó LA ERA ASTRAL (Parte II · Oleada 3). La costura del cielo se abrió: toca la misión «Puerto Cometa».';
  },
});

/** income seconds → gold, for the UI (same rule the costs use) */
export const astralGold = goldFor;
