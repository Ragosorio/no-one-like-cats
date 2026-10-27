/**
 * Parte III · Actos II–IV — the ACTIVITY battles (short fights a story flow plays, not nodes of the Carta):
 *
 *   H80 «Entrenamiento» (Anime): three arcs — t1 the pirate (aim), t2 the ninja (stealth in the fog: in the dark),
 *        t3 martial arts (endure: survive 3 turns)
 *   H84 «Finales perdidos» (Libros): three stories — c1 Los tres cerditos, c2 La liebre y la tortuga, c3 El patito feo
 *   H90 «La gira» (POP): three dates — g1 Estadio Neón, g2 Estadio Pastel, g3 Estadio Espejo (the set list changes the
 *        element that has SINCRO: each date's crew is built in pairs of one element)
 *
 * Each one plays its box's rule (`dims[].rules`) and the Carta's difficulty policy, lighter (activity: never a wall).
 * Loseable, retried at no cost (app/actsFlow.ts). Stand-in species until ARTE paints the new cats.
 */
import { G } from '../game';
import { buildSiege } from './campaign';
import { crew, shipPower } from './ship';
import { catDef } from '../../data/content';
import { CARTA_POLICY, cartaShipWeight, potentialPower } from './gaterasBattles';
import { dimDef, type DimId } from './gateras';
import { actRuleLines } from '../../battle/actRules';
import type { BattleResult, BattleSpec } from '../../scenes/BattleScene';
import type { StageRules } from '../../battle/sim';

export interface ActBattleDef {
  id: string;
  dim: DimId;
  name: string;
  tag: string;
  crew: string[];
  powerMul: number;
  hpMulX: number;
  rules?: Partial<StageRules>;
  dark?: boolean;
  lines?: string[];
}
const D = (id: string, dim: DimId, name: string, tag: string, crewIds: string[], powerMul: number, hpMulX: number, o: Partial<ActBattleDef> = {}): ActBattleDef => ({ id, dim, name, tag, crew: crewIds, powerMul, hpMulX, ...o });

export const ACT_BATTLES: Record<string, ActBattleDef> = {
  // H80 · Entrenamiento (h80-entrenamiento.md: pirata, puntería · ninja, sigilo con niebla · artes marciales, aguantar)
  t1: D('t1', 'p3d_anime', 'Arco del pirata', 'ENTRENAMIENTO · PUNTERÍA', ['r_marejada', 'c_gelatino'], 1.3, 1.8, { lines: ['Apunta con el corazón'] }),
  t2: D('t2', 'p3d_anime', 'Arco del ninja', 'ENTRENAMIENTO · SIGILO', ['r_kage', 'c_sombrita'], 1.3, 1.8, { dark: true, lines: ['Sigilo con niebla: solo se ven los ojos'] }),
  t3: D('t3', 'p3d_anime', 'Arco de las artes marciales', 'ENTRENAMIENTO · AGUANTAR', ['e_golem', 'c_terron'], 1.4, 2.2, { rules: { retreat: { side: 1, turn: 3 } }, lines: ['AGUANTA 3 TURNOS'] }),
  // H84 · Finales perdidos (h84-finales-perdidos.md: tres cuentos de dominio público)
  c1: D('c1', 'p3d_libros', 'Los tres cerditos', 'FINALES PERDIDOS · 1 DE 3', ['c_tanquecito', 'c_terron', 'c_guijarro'], 1.35, 1.9),
  c2: D('c2', 'p3d_libros', 'La liebre y la tortuga', 'FINALES PERDIDOS · 2 DE 3', ['c_cometin', 'r_contrapeso'], 1.35, 1.9),
  c3: D('c3', 'p3d_libros', 'El patito feo', 'FINALES PERDIDOS · 3 DE 3', ['c_espumita', 'c_burbujas', 'c_copito'], 1.35, 1.9),
  // H90 · La gira (h90-la-gira.md: tres fechas)
  g1: D('g1', 'p3d_pop', 'Estadio Neón', 'FECHA 1 · ESTADIO NEÓN', ['c_voltio', 'c_nimbo', 'r_plasmin'], 1.4, 2.0),
  g2: D('g2', 'p3d_pop', 'Estadio Pastel', 'FECHA 2 · ESTADIO PASTEL', ['c_caramelo', 'c_linterna', 'r_origami'], 1.4, 2.0),
  g3: D('g3', 'p3d_pop', 'Estadio Espejo', 'FECHA 3 · ESTADIO ESPEJO', ['r_espejito', 'c_brillito', 'r_facetas'], 1.45, 2.2),
};

/** the battle id the music plans and the estimate key read (`meta.special`) */
export const actBattleKey = (id: string) => `p3_act_${id}`;

/** enemy Poder for this crew: the Carta's policy, normal band (pure given the save) */
export function actPower(id: string, crewUids = crew()): number {
  const def = ACT_BATTLES[id];
  const ship = G.s.ship.active;
  const own = shipPower(ship, crewUids) * def.powerMul;
  const floor = CARTA_POLICY.floor * potentialPower(ship) * def.powerMul;
  return Math.max(floor, own) * (CARTA_POLICY.band.normal ?? 1) * cartaShipWeight(ship, 'normal');
}

/** the BattleSpec of an activity battle (the same an estimate would sim) */
export function buildActBattle(id: string, onEnd: (r: BattleResult) => void): BattleSpec {
  const def = ACT_BATTLES[id];
  if (!def) throw new Error(`[actividad] no existe la batalla ${id}`);
  const box = dimDef(def.dim);
  const rules = { ...JSON.parse(JSON.stringify(box.rules ?? {})), ...JSON.parse(JSON.stringify(def.rules ?? {})) } as NonNullable<BattleSpec['rules']>;
  const crewUids = crew();
  const spec = buildSiege(
    {
      zone: 3,
      stage: 10,
      key: actBattleKey(id),
      name: def.name,
      type: 'errand',
      archetype: 'chalupa',
      personality: 'afinador',
      difficulty: 'grumete',
      enemyCats: [...def.crew],
      ep: actPower(id, crewUids),
      crewUids,
      captain: def.name,
      rules: Object.keys(rules).length ? rules : undefined,
      special: actBattleKey(id),
      mirror: CARTA_POLICY.off ? undefined : { ...CARTA_POLICY.mirror },
      hpMulX: def.hpMulX,
      catrooms: def.crew.length,
      intro: { kind: 'errand', tag: def.tag, title: def.name.toUpperCase(), subtitle: box.name, lines: [...(def.lines ?? []), ...actRuleLines(rules)], color: 0xe8a33d, slug: catDef(def.crew[0]).art.slug ?? undefined },
    },
    onEnd,
  );
  const look = box.battle?.palette;
  if (look) spec.palette = { skyTop: 0x0f1830, skyBottom: 0x2a3d6e, sea: 0x1b2a4a, seaDark: 0x101a30, ...look };
  spec.meta = { ...spec.meta!, boss: false };
  if (def.dark) spec.final = { dark: true };
  return spec;
}
