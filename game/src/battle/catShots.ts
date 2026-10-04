/** Content cat (GDD) → combat sim definitions (ShotDef / BattleCatDef). */
import { CatDef, ShotSpec, catDef } from '../data/content';
import { BattleCatDef, ElementId, Limitation, ShotDef, StatusId, Trajectory } from './types';
import { CELL } from './ship';

export const SIM_ELEMENT: Record<string, ElementId> = {
  fire: 'fire',
  water: 'water',
  nature: 'nature',
  earth: 'earth',
  storm: 'electric',
  magic: 'magic',
  cosmic: 'cosmic',
  void: 'void',
};
const STATUS: Record<string, StatusId> = {
  ardiendo: 'burning',
  mojado: 'wet',
  enraizado: 'rooted',
  cargado: 'charged',
  maldito: 'cursed',
  congelado: 'frozen',
};
const TRAJ: Record<string, Trajectory> = {
  bola_rebote: 'bounce',
  torpedo: 'torpedo',
  semilla: 'seed',
  roca: 'heavy',
  rayo: 'beam',
  rafaga: 'gust',
  runa: 'homing',
  orbe_gravitatorio: 'orb',
  objetivo: 'meteor',
};
const LIMIT: Record<string, Limitation> = {
  'UNA BALA': 'oneShot',
  'SEGUNDA VIDA (Revenant)': 'secondLife',
  VENGANZA: 'berserk',
  '3 ESCUDOS': 'shields',
  'CAÑÓN DE CRISTAL': 'glass',
  INESTABLE: 'unstable',
  CARGA: 'charge',
  'CARGA 2 TURNOS': 'charge',
};

/** shot with level thresholds applied (Nv10 radius +25% for most elements, etc.) */
export function shotFromSpec(s: ShotSpec, level: number): ShotDef {
  let traj: Trajectory = TRAJ[s.archetype] ?? 'ballistic';
  if (traj === 'bounce' && s.bounces <= 0) traj = 'ballistic';
  let radius = s.radius * CELL;
  let projectiles = s.projectiles;
  let pierce = s.pierce || (traj === 'heavy' ? 2 : 0);
  const el = SIM_ELEMENT[s.element] ?? 'neutral';
  // Nv10 / Nv20 element upgrades (GDD 2.3)
  if (level >= 10) {
    if (s.element === 'nature') projectiles = Math.max(projectiles, 2);
    else radius *= 1.25;
  }
  if (level >= 20 && s.element === 'earth') pierce += 1;
  const status = s.status ? STATUS[s.status] : undefined;
  const statuses = status ? [{ id: status, turns: Math.max(1, s.statusTurns || 2) }] : [];
  if (s.element === 'water' && !statuses.length) statuses.push({ id: 'wet', turns: 2 });
  return {
    id: s.name,
    name: s.name,
    element: el,
    trajectory: projectiles > 1 && traj !== 'cluster' ? (traj === 'ballistic' || traj === 'bounce' || traj === 'seed' || traj === 'homing' ? 'spread' : traj) : traj,
    power: 1,
    radius,
    projectiles,
    spreadDeg: s.spreadDeg || (projectiles > 1 ? 6 : 0),
    gravityScale: s.gravityMul !== 1 ? s.gravityMul : undefined,
    speedMul: s.speedMul !== 1 ? s.speedMul : undefined,
    pierce,
    statuses,
    preview: traj === 'beam' ? 0.6 : traj === 'homing' ? 0.3 : 0.45,
    catMul: traj === 'beam' ? 0.8 : 0.5,
    structMul: traj === 'beam' ? 0.75 : 1,
  };
}

export function ultFromDef(def: CatDef, level: number): ShotDef {
  const s = def.combat.shot;
  const u = def.combat.ultimate;
  const base = shotFromSpec(s, level);
  const name = u.name;
  const shout = name.split('(')[0].trim();
  const isMeteor = /STARFALL|METEOR|DECREE/i.test(name) || s.archetype === 'objetivo';
  const ult: ShotDef = {
    ...base,
    id: `${def.id}_ult`,
    name: shout,
    shout,
    power: u.dmg / Math.max(1, s.dmg),
    radius: base.radius * 1.35,
    limits: { usesPerBattle: u.usesPerBattle ?? undefined, chargeTurns: u.chargeTurns || undefined },
  };
  if (isMeteor) {
    ult.trajectory = 'meteor';
    ult.radius = Math.max(ult.radius, CELL * 3.2);
    ult.pierce = 3;
  } else if (['bounce', 'ballistic', 'seed', 'homing', 'torpedo'].includes(base.trajectory)) {
    ult.trajectory = base.trajectory === 'torpedo' ? 'torpedo' : 'spread';
    ult.projectiles = 3;
    ult.spreadDeg = 7;
  } else if (base.trajectory === 'heavy') {
    ult.pierce = (ult.pierce ?? 2) + 2;
    ult.radius *= 1.2;
  }
  return ult;
}

export interface CatBattleInput {
  uid: string;
  species: string;
  name: string;
  level: number;
  stars: number;
  /** internal damage multiplier (f(S) · catShare) */
  dmgMul: number;
  /** hp multiplier (catShare) */
  hpMul: number;
}

export function battleCatFrom(i: CatBattleInput, roleHp: number): BattleCatDef {
  const def = catDef(i.species);
  const shot = shotFromSpec(def.combat.shot, i.level);
  const ult = ultFromDef(def, i.level);
  const lim = def.combat.limitation ? LIMIT[def.combat.limitation] ?? 'none' : 'none';
  return {
    uid: i.uid,
    catId: def.id,
    slug: def.art.slug,
    name: i.name,
    elements: def.elements.map((e) => SIM_ELEMENT[e] ?? 'neutral'),
    tint: undefined,
    level: i.level,
    stars: i.stars,
    hp: Math.round(roleHp * i.hpMul * (1 + (i.stars - 1) * 0.08)),
    atk: Math.round(def.combat.shot.dmg * i.dmgMul * 1.6),
    shot,
    ultimate: ult,
    limitation: lim,
    shields: lim === 'shields' ? 3 : undefined,
    passive: def.combat.passive,
  };
}
