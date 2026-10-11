/**
 * Which Momentos exist (pure: no Pixi). Songs register at import (src/momentos/songs/*); the battle hook asks
 * `momentoForFase(battle, fase)`; «Volver a ver» asks `seenMomentos(save)`.
 */
import type { MomentoDef } from './types';
import { momentosOf } from './save';

const defs = new Map<string, MomentoDef>();

export function registerMomento(def: MomentoDef) {
  defs.set(def.id, def);
}
export function getMomento(id: string) {
  return defs.get(id) ?? null;
}
export function momentoIds() {
  return [...defs.keys()];
}
/** the Momento that plays when battle `battleId` enters phase `faseId` (null = none) */
export function momentoForFase(battleId: string | null | undefined, faseId: string | null | undefined): MomentoDef | null {
  if (!battleId || !faseId) return null;
  for (const d of defs.values()) if (d.battle && d.battle.id === battleId && d.battle.fase === faseId) return d;
  return null;
}
/** Momentos this save completed at least once, in story order (mission number) — for «Volver a ver» */
export function seenMomentos(save: { ext?: Record<string, unknown> } | null | undefined): { id: string; title: string; order: number }[] {
  const seen = momentosOf(save).seen;
  const order = (d: MomentoDef) => Number(String(d.mission ?? 'H999').replace(/\D/g, '')) || 999;
  return [...defs.values()].filter((d) => seen[d.id]).map((d) => ({ id: d.id, title: d.title, order: order(d) })).sort((a, b) => a.order - b.order);
}
