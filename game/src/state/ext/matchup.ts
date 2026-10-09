/**
 * How one cat fares against one fight, in numbers the crew picker can show and explain:
 *   - its shots vs the enemy HULL (the material most of the hull is made of: content.materials[].mult)
 *   - its shots vs the enemy CATS' elements (content.affinity, attacker → defender)
 *   - what those cats' elements do back to it
 * Pure reads; the same tables the battle sim uses.
 */
import { affinityMult, catDef, CONTENT } from '../../data/content';
import type { ShipBlueprint } from '../../battle/ship';

const CHAR_MAT: Record<string, string> = { W: 'wood', I: 'iron', C: 'crystal', B: 'bone', V: 'void', S: 'stone', L: 'canvas' };
const MATS = CONTENT.materials as { id: string; name: string; mult: Record<string, number> }[];

export interface FightContext {
  /** elements of the enemy cats (or the boss) */
  enemyElements: string[];
  /** main hull material and its share (0–1), if the blueprint is known */
  hull: { id: string; name: string; share: number } | null;
}

export function hullOf(bp: ShipBlueprint | null): FightContext['hull'] {
  if (!bp) return null;
  const count: Record<string, number> = {};
  for (const row of bp.hull) for (const ch of row) if (CHAR_MAT[ch]) count[CHAR_MAT[ch]] = (count[CHAR_MAT[ch]] ?? 0) + 1;
  const total = Object.values(count).reduce((a, b) => a + b, 0);
  const main = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
  if (!main || !total) return null;
  const m = MATS.find((x) => x.id === main[0]);
  return { id: main[0], name: (m?.name ?? main[0]).split(' ')[0], share: main[1] / total };
}

export interface Matchup {
  /** its main element's multiplier against the hull (1 = neutral) */
  hull: number;
  /** best multiplier of its elements against the enemy cats */
  vsCats: number;
  /** worst multiplier the enemy cats' elements have against it (incoming) */
  incoming: number;
  /** one number: >1 good, <1 bad (hull dominates: that's what sinks ships) */
  score: number;
  verdict: 'ventaja' | 'desventaja' | 'neutral';
  /** short Spanish reasons, strongest first ("×1.5 contra Madera") */
  notes: string[];
}

export function catMatchup(species: string, ctx: FightContext): Matchup {
  const els = catDef(species).elements;
  const main = els[0];
  const mat = ctx.hull ? MATS.find((m) => m.id === ctx.hull!.id) : null;
  const hull = mat ? (mat.mult[main] ?? 1) : 1;
  let vsCats = 1;
  let incoming = 1;
  if (ctx.enemyElements.length) {
    vsCats = Math.max(...els.flatMap((a) => ctx.enemyElements.map((d) => affinityMult(a, d))));
    incoming = Math.max(...ctx.enemyElements.flatMap((a) => els.map((d) => affinityMult(a, d))));
  }
  const score = Math.pow(hull, 0.6) * Math.pow(vsCats, 0.25) * Math.pow(1 / incoming, 0.15);
  const verdict = score >= 1.06 ? 'ventaja' : score <= 0.94 ? 'desventaja' : 'neutral';
  const notes: string[] = [];
  if (ctx.hull && hull !== 1) notes.push(`×${hull} contra ${ctx.hull.name}`);
  if (vsCats > 1) notes.push(`×${vsCats} a sus gatos`);
  if (incoming > 1) notes.push(`recibe ×${incoming}`);
  if (vsCats < 1 && !notes.length) notes.push(`×${vsCats} a sus gatos`);
  return { hull, vsCats, incoming, score, verdict, notes };
}
