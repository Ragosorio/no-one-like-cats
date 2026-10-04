/**
 * Reliquias (pasivas de FLOTA: todas las que tienes cuentan en cualquier barco) y Artefactos
 * (ranuras POR BARCO: `ships[].artifactSlots`). Contenido no simulado (GDD §9 #24).
 *
 * Contrato con Combate: `gearBattleMods(shipId)` → multiplicadores que buildBattle aplica.
 * Neutro = { hpMul 1, cannonAtkMul 1, catDmgMul 1, ultStart 0, notes [] }.
 * Obtención: jefes (automático al derrotarlos), misiones (banderas `artifact:<id>` / `relic:<id>`),
 * élites/encargos/eventos → Combate llama `grantRelic(id)` / `grantArtifact(id)`.
 */
import { G } from '../game';
import { CONTENT, SHIP_BY_ID } from '../../data/content';
import { layoutOf } from './ship';

export interface GearBattleMods {
  /** multiplies the player's ship hpMul (structure) */
  hpMul: number;
  /** multiplies the player's cannonAtk (volley) */
  cannonAtkMul: number;
  /** multiplies the damage of every player cat shot */
  catDmgMul: number;
  /** initial ultimate meter for the crew, 0..1 (fraction of a full meter) */
  ultStart: number;
  /** short lines for the pre-battle / battle HUD ("Bigote Roto: +10% andanada") */
  notes: string[];
}

/** optional tactical flags for the sim (Combate may implement them; the knobs above already carry the effect) */
export interface GearBattleExtras {
  previewBonus: number;
  pushImmune: boolean;
  firstHitHalf: boolean;
  conductionJumps: number;
  curseTurns: number;
  /** artifact ids equipped on the ship (1 use per battle in the GDD) */
  artifacts: string[];
  /** utility modules placed on the ship that the sim models as plain hull */
  utility: string[];
}

type Mods = Partial<Omit<GearBattleMods, 'notes'>>;

export interface GearDef {
  id: string;
  name: string;
  /** glyph drawn by the UI */
  glyph: 'whisker' | 'eye' | 'mask' | 'crown' | 'sucker' | 'book' | 'dust' | 'tooth' | 'wrench' | 'bubble' | 'smoke' | 'anchor' | 'leaf' | 'flare';
  color: number;
  /** how you get it (player copy) */
  source: string;
  /** GDD effect text (flavour) */
  lore: string;
  /** what it does in battle in this build (via gearBattleMods) */
  effect: string;
  mods: Mods;
  /** M3+ content: shown as a teaser */
  future?: boolean;
}

const relicLore = new Map(((CONTENT.modules as { relics?: { id: string; effect: string }[] })?.relics ?? []).map((r) => [r.id, r.effect]));
const artLore = new Map(((CONTENT.modules as { artifacts?: { id: string; effect: string }[] })?.artifacts ?? []).map((r) => [r.id, r.effect]));

export const RELICS: GearDef[] = [
  { id: 'reliquia_bigote', name: 'Bigote Roto', glyph: 'whisker', color: 0xc8102e, source: 'Jefe 1 · Capitán Bigotes Rotos', lore: relicLore.get('reliquia_bigote') ?? '', effect: '+10% daño de la andanada', mods: { cannonAtkMul: 1.1 } },
  { id: 'reliquia_ojo', name: 'Ojo de Gárgola', glyph: 'eye', color: 0x4f8f4a, source: 'Jefe 2 · La Gárgola Ronroneante', lore: relicLore.get('reliquia_ojo') ?? '', effect: '+8% daño de tus gatos (apuntan mejor)', mods: { catDmgMul: 1.08 } },
  { id: 'reliquia_ventosa', name: 'Ventosa del Kraken', glyph: 'sucker', color: 0x3569a3, source: 'Jefe 3 · Kraken Voltaico', lore: relicLore.get('reliquia_ventosa') ?? '', effect: '+12% vida del barco (se aferra al mar)', mods: { hpMul: 1.12 } },
  { id: 'reliquia_mascara', name: 'Antifaz de Noctis', glyph: 'mask', color: 0x8c2bff, source: 'Evento · Bandera Negra', lore: relicLore.get('reliquia_mascara') ?? '', effect: '+8% vida del barco · +5% daño de gatos', mods: { hpMul: 1.08, catDmgMul: 1.05 } },
  { id: 'reliquia_corona', name: 'Corona del Trueno', glyph: 'crown', color: 0xffc94a, source: 'Evento · Heroica 1 (sprint)', lore: relicLore.get('reliquia_corona') ?? '', effect: 'Tripulación empieza con 15% de ultimate', mods: { ultStart: 0.15 } },
  { id: 'reliquia_grimorio', name: 'Grimorio del Arcanista', glyph: 'book', color: 0x5c3d5b, source: 'Jefe 4 · El Arcanista', lore: relicLore.get('reliquia_grimorio') ?? '', effect: '+6% daño de gatos', mods: { catDmgMul: 1.06 }, future: true },
  { id: 'reliquia_polvo', name: 'Polvo de la Estrella Errante', glyph: 'dust', color: 0x00e5ff, source: 'Jefe 5 · Estrella Errante', lore: relicLore.get('reliquia_polvo') ?? '', effect: '+10% ultimate inicial · +5% daño de gatos', mods: { ultStart: 0.1, catDmgMul: 1.05 }, future: true },
  { id: 'reliquia_diente', name: 'Diente del Primer Mar', glyph: 'tooth', color: 0xd9d4de, source: 'Jefe 6 · El Primer Mar', lore: relicLore.get('reliquia_diente') ?? '', effect: '+10% daño a todo', mods: { catDmgMul: 1.1, cannonAtkMul: 1.1 }, future: true },
];
/** relic granted automatically when the boss falls */
const RELIC_BY_BOSS: Record<number, string> = { 1: 'reliquia_bigote', 2: 'reliquia_ojo', 3: 'reliquia_ventosa', 4: 'reliquia_grimorio', 5: 'reliquia_polvo', 6: 'reliquia_diente' };

export const ARTIFACTS: GearDef[] = [
  { id: 'kit_reparacion', name: 'Kit de Reparación', glyph: 'wrench', color: 0xb89558, source: 'Misión C17 · Merodeador', lore: artLore.get('kit_reparacion') ?? '', effect: '+12% vida del barco (carpinteros a bordo)', mods: { hpMul: 1.12 } },
  { id: 'burbuja_emergencia', name: 'Burbuja de Emergencia', glyph: 'bubble', color: 0x00e5ff, source: 'Misión C19 · tu primer escudo', lore: artLore.get('burbuja_emergencia') ?? '', effect: '+8% vida · +5% andanada', mods: { hpMul: 1.08, cannonAtkMul: 1.05 } },
  { id: 'bomba_humo', name: 'Bomba de Humo', glyph: 'smoke', color: 0x9a8f80, source: 'Misión C17 · Merodeador', lore: artLore.get('bomba_humo') ?? '', effect: '+10% daño de gatos (no te ven venir)', mods: { catDmgMul: 1.1 } },
  { id: 'ancla_emergencia', name: 'Ancla de Emergencia', glyph: 'anchor', color: 0x6d7699, source: 'Misión C20 · Bastión', lore: artLore.get('ancla_emergencia') ?? '', effect: '+10% vida del barco', mods: { hpMul: 1.1 } },
  { id: 'catnip', name: 'Catnip Táctico', glyph: 'leaf', color: 0x3fae6a, source: 'Misión C24 · Bajel Arcano', lore: artLore.get('catnip') ?? '', effect: 'Tripulación empieza con 25% de ultimate', mods: { ultStart: 0.25 } },
  { id: 'bengala', name: 'Bengala', glyph: 'flare', color: 0xff6a1a, source: 'Misión E12 · ¡Sinergia descubierta!', lore: artLore.get('bengala') ?? '', effect: '+12% daño de la andanada (ves dónde duele)', mods: { cannonAtkMul: 1.12 } },
];

export const RELIC_BY_ID = new Map(RELICS.map((r) => [r.id, r]));
export const ARTIFACT_BY_ID = new Map(ARTIFACTS.map((a) => [a.id, a]));

/** utility modules the sim doesn't model yet: their effect rides on the same knobs */
export const UTILITY_BATTLE: Record<string, { effect: string; mods: Mods }> = {
  pantry: { effect: 'Panza llena: +15% ultimate inicial', mods: { ultStart: 0.15 } },
  pump: { effect: 'Achique: +8% vida del barco', mods: { hpMul: 1.08 } },
  bulkhead: { effect: 'Mamparo: +3% vida del barco', mods: { hpMul: 1.03 } },
  anchor: { effect: 'Plataforma estable: +8% andanada', mods: { cannonAtkMul: 1.08 } },
  bridge: { effect: 'Puente de Mando: reliquias ×1.5 en este barco', mods: {} },
  tower: { effect: 'Torre Elemental: +10% daño de gatos', mods: { catDmgMul: 1.1 } },
};

// ---------------------------------------------------------------- state
export function gear() {
  G.s.gear ??= { relics: [], artifacts: [], equipped: {} };
  G.s.gear.relics ??= [];
  G.s.gear.artifacts ??= [];
  G.s.gear.equipped ??= {};
  return G.s.gear;
}
export function hasRelic(id: string) {
  return gear().relics.includes(id);
}
export function hasArtifact(id: string) {
  return gear().artifacts.includes(id);
}
export function ownedRelics() {
  syncGear();
  return RELICS.filter((r) => gear().relics.includes(r.id));
}
export function ownedArtifacts() {
  syncGear();
  return ARTIFACTS.filter((a) => gear().artifacts.includes(a.id));
}

/** Combat/Errands/Events: give a relic (true if new). */
export function grantRelic(id: string) {
  if (!RELIC_BY_ID.has(id) || hasRelic(id)) return false;
  gear().relics.push(id);
  markNew(id);
  G.count('relics');
  G.flag(`relic:${id}`);
  announce(`¡Reliquia: ${RELIC_BY_ID.get(id)!.name}!`, 'crown', 'Pasiva de flota · míralo en el Astillero');
  return true;
}
/** Combat/Errands/Events/Missions: give an artifact (true if new). */
export function grantArtifact(id: string) {
  if (!ARTIFACT_BY_ID.has(id) || hasArtifact(id)) return false;
  gear().artifacts.push(id);
  markNew(id);
  G.count('artifacts');
  G.flag(`artifact:${id}`);
  announce(`¡Artefacto: ${ARTIFACT_BY_ID.get(id)!.name}!`, 'star', 'Equípalo en un barco con ranura de artefacto');
  return true;
}

/** bus event + a toast (lazy import: state never depends on UI at load time) */
function announce(text: string, icon: 'crown' | 'star', sub: string) {
  G.emit('toast', { text, icon, sub });
  void import('../../ui/modal').then((m) => m.toast(text, { icon, sub })).catch(() => undefined);
}

/** pick up gear earned through progress (bosses, mission flags) — silent, idempotent */
let syncing = false;
export function syncGear() {
  if (syncing) return;
  syncing = true;
  try {
    const g = gear();
    for (let b = 1; b <= G.s.campaign.bossesDefeated; b++) {
      const id = RELIC_BY_BOSS[b];
      if (id && !g.relics.includes(id)) {
        g.relics.push(id);
        markNew(id);
      }
    }
    for (const r of RELICS) if (G.has(`relic:${r.id}`) && !g.relics.includes(r.id)) g.relics.push(r.id);
    for (const a of ARTIFACTS)
      if (G.has(`artifact:${a.id}`) && !g.artifacts.includes(a.id)) {
        g.artifacts.push(a.id);
        markNew(a.id);
      }
    // drop artifacts equipped on ships that lost slots / you no longer have
    for (const [ship, list] of Object.entries(g.equipped)) g.equipped[ship] = list.filter((x) => g.artifacts.includes(x)).slice(0, artifactSlots(ship));
  } finally {
    syncing = false;
  }
}
G.on('unlock', () => syncGear());

// "new" badges for the Shipyard
function seen(): string[] {
  G.s.ext ??= {};
  const e = G.s.ext as { gearSeen?: string[]; gearNew?: string[] };
  e.gearNew ??= [];
  return e.gearNew;
}
function markNew(id: string) {
  const n = seen();
  if (!n.includes(id)) n.push(id);
}
export function isNewGear(id: string) {
  return seen().includes(id);
}
export function markGearSeen(ids?: string[]) {
  const n = seen();
  const keep = ids ? n.filter((x) => !ids.includes(x)) : [];
  n.length = 0;
  n.push(...keep);
}
export function newGearCount() {
  return seen().length;
}

// ---------------------------------------------------------------- artifact slots per ship
export function artifactSlots(shipId: string) {
  return SHIP_BY_ID.get(shipId)?.artifactSlots ?? 0;
}
export function equippedArtifacts(shipId: string): string[] {
  const g = gear();
  return (g.equipped[shipId] ?? []).filter((x) => g.artifacts.includes(x)).slice(0, artifactSlots(shipId));
}
/** equip on the first free slot (or `slot`); an artifact lives on one ship at a time */
export function equipArtifact(shipId: string, id: string, slot?: number) {
  const n = artifactSlots(shipId);
  if (!n || !hasArtifact(id)) return false;
  const g = gear();
  for (const k of Object.keys(g.equipped)) g.equipped[k] = (g.equipped[k] ?? []).filter((x) => x !== id);
  const list = equippedArtifacts(shipId);
  if (slot !== undefined && slot < n) {
    list[slot] = id;
  } else if (list.length < n) list.push(id);
  else list[n - 1] = id;
  g.equipped[shipId] = list.filter(Boolean).slice(0, n);
  G.count('equip_artifact');
  return true;
}
export function unequipArtifact(shipId: string, id: string) {
  const g = gear();
  g.equipped[shipId] = (g.equipped[shipId] ?? []).filter((x) => x !== id);
}
/** ship that currently carries an artifact (or null) */
export function artifactShip(id: string) {
  const g = gear();
  for (const [k, list] of Object.entries(g.equipped)) if (list.includes(id) && artifactSlots(k) > 0) return k;
  return null;
}

// ---------------------------------------------------------------- battle contract
function hasBridge(shipId: string) {
  return layoutOf(shipId).some((m) => m.kind === 'bridge');
}

export function gearBattleMods(shipId: string): GearBattleMods {
  syncGear();
  const out: GearBattleMods = { hpMul: 1, cannonAtkMul: 1, catDmgMul: 1, ultStart: 0, notes: [] };
  const apply = (m: Mods, k = 1, note?: string) => {
    if (m.hpMul) out.hpMul *= 1 + (m.hpMul - 1) * k;
    if (m.cannonAtkMul) out.cannonAtkMul *= 1 + (m.cannonAtkMul - 1) * k;
    if (m.catDmgMul) out.catDmgMul *= 1 + (m.catDmgMul - 1) * k;
    if (m.ultStart) out.ultStart += m.ultStart * k;
    if (note) out.notes.push(note);
  };
  const bridge = hasBridge(shipId);
  const rk = bridge ? 1.5 : 1;
  for (const r of ownedRelics()) apply(r.mods, rk, `${r.name}: ${r.effect}${bridge ? ' (×1.5 Puente)' : ''}`);
  for (const id of equippedArtifacts(shipId)) {
    const a = ARTIFACT_BY_ID.get(id);
    if (a) apply(a.mods, 1, `${a.name}: ${a.effect}`);
  }
  for (const m of layoutOf(shipId)) {
    const u = UTILITY_BATTLE[m.kind];
    if (u && Object.keys(u.mods).length) apply(u.mods, 1, u.effect);
  }
  out.ultStart = Math.min(0.9, out.ultStart);
  out.hpMul = round3(out.hpMul);
  out.cannonAtkMul = round3(out.cannonAtkMul);
  out.catDmgMul = round3(out.catDmgMul);
  out.ultStart = round3(out.ultStart);
  return out;
}

export function gearBattleExtras(shipId: string): GearBattleExtras {
  syncGear();
  const lay = layoutOf(shipId);
  return {
    previewBonus: hasRelic('reliquia_ojo') ? 0.25 : 0,
    pushImmune: hasRelic('reliquia_ventosa') || lay.some((m) => m.kind === 'anchor'),
    firstHitHalf: hasRelic('reliquia_mascara'),
    conductionJumps: hasRelic('reliquia_corona') ? 1 : 0,
    curseTurns: hasRelic('reliquia_grimorio') ? 1 : 0,
    artifacts: equippedArtifacts(shipId),
    utility: lay.filter((m) => UTILITY_BATTLE[m.kind]).map((m) => m.kind),
  };
}

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}
