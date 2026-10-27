/**
 * Parte III · LA RONDA — the bar conditions (docs/part-iii/05-mapa-y-dimensiones.md §4, mecanicas-v2/02 §3.1, 03 §2.6).
 *
 * Two tiny sim knobs (StageRules, sim.ts — the estimate plays them too, so the odds are honest):
 *   turnLimit  «LA ÚLTIMA Y NOS VAMOS»  win by the end of round N or the round is lost (reason 'condicion')
 *   intact     «SIN DERRAMAR»           lose more than `allow` modules and the round is lost (reason 'condicion')
 * Here: the catalogue of conditions (data → rules), the chips the battle shows and the intro lines. Pure, no Pixi.
 */
import type { StageRules } from './sim';

export type BarConditionId = 'sinDerramar' | 'ultimaYNosVamos';
export interface BarCondition {
  id: BarConditionId;
  /** the stamp on the card / chip */
  name: string;
  /** one line, in the player's words */
  line: string;
  /** the sim rules it adds (the player is side 0) */
  rules: Pick<StageRules, 'turnLimit' | 'intact'>;
}

export const BAR_CONDITIONS: Record<BarConditionId, BarCondition> = {
  sinDerramar: { id: 'sinDerramar', name: 'SIN DERRAMAR', line: 'SIN DERRAMAR: si pierdes más de un módulo, se acabó la ronda', rules: { intact: { side: 0, allow: 1 } } },
  ultimaYNosVamos: { id: 'ultimaYNosVamos', name: 'LA ÚLTIMA Y NOS VAMOS', line: 'LA ÚLTIMA Y NOS VAMOS: gana antes del turno 5 o cierran el bar', rules: { turnLimit: { side: 0, turns: 4 } } },
};
export const BAR_CONDITION_IDS = Object.keys(BAR_CONDITIONS) as BarConditionId[];

/** the intro / ¿POR QUÉ? lines of the rules a battle carries (only what the sim plays) */
export function rondaLines(r: StageRules | undefined): string[] {
  const out: string[] = [];
  if (r?.intact?.side === 0) out.push(r.intact.allow ? `SIN DERRAMAR: si pierdes más de ${r.intact.allow === 1 ? 'un módulo' : `${r.intact.allow} módulos`}, se acabó la ronda` : 'SIN DERRAMAR: si pierdes un solo módulo, se acabó la ronda');
  if (r?.turnLimit?.side === 0) out.push(`LA ÚLTIMA Y NOS VAMOS: gana antes del turno ${r.turnLimit.turns + 1} o cierran el bar`);
  return out;
}

export interface RondaChip {
  text: string;
  color: number;
  ink?: number;
  hot?: boolean;
}
/** the chips on YOUR side of the rule strip (turn = the battle's round, 1-based) */
export function rondaChips(r: StageRules | undefined, turn: number): RondaChip[] {
  const out: RondaChip[] = [];
  if (r?.intact?.side === 0) out.push({ text: r.intact.allow ? `SIN DERRAMAR: MÁXIMO ${r.intact.allow} MÓDULO${r.intact.allow > 1 ? 'S' : ''} PERDIDO${r.intact.allow > 1 ? 'S' : ''}` : 'SIN DERRAMAR: NO PIERDAS NI UN MÓDULO', color: 0xe8a33d, ink: 0x171317 });
  const tl = r?.turnLimit;
  if (tl?.side === 0) {
    const left = tl.turns - turn + 1;
    out.push(left <= 1 ? { text: '¡ÚLTIMA RONDA! GANA YA', color: 0xc8102e, ink: 0xffffff, hot: true } : { text: `CIERRAN EL BAR EN ${left} TURNOS`, color: 0xe8a33d, ink: 0x171317 });
  }
  return out;
}
