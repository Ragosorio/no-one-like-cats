/**
 * PARTE II · REGISTRO DE PREMIOS COBRADOS (`G.s.ext.rupturas.claimed`) — docs/part-ii/21-migracion-reinicio.md.
 *
 * The Part II story can be played again (the narrative reset, state/sys/rupturasReset.ts): the scenes, battles
 * and reveals replay, but a UNIQUE reward is paid once per save, forever. Every Part II reward path asks here:
 *   `battle:<id>`  a story battle's one-time payout (gems, crystals, fragments, first-clear gold)   storyBattles.ts
 *   `cat:<id>`     the cat that battle hands over (adopted once; a replay shows «ya es parte…»)     storyBattles.ts
 *   `mission:<id>` a Parte II mission's reward (a replay pays only the small income part)          missions.ts
 *   `pagina:<n>`   a DIARIO PERDIDO page read (its first-read gold; the flag pagina_leida:<n> stays) recorded only
 *
 * Leaf module (imports only G): missions.ts and storyBattles.ts import it without cycles. Never throws, never
 * removes a key, tolerant to any junk in the save (a non-object is replaced, non-number values are kept as claimed).
 */
import { G } from '../game';

/** Parte II starts at H31 (H31–H41 Oleada 1, H42–H65 Oleadas 2–4: docs/part-ii/17) */
export const PART2_FIRST = 31;

/** `H31`…`H99` → 31…; anything else → 0 */
export function missionNum(id: unknown): number {
  const m = /^H(\d{2,3})$/.exec(String(id ?? ''));
  return m ? Number(m[1]) : 0;
}
/** a Parte II story mission (the narrative the reset replays) */
export const isPart2Mission = (id: unknown) => missionNum(id) >= PART2_FIRST;

export interface RupturasExt {
  /** unique rewards already paid: key → when (ms) */
  claimed: Record<string, number>;
  /** the narrative reset applied to this save (rupturasReset.ts): what it moved, for support / rollback */
  reset?: { v: number; at: number; done: string[]; active: string[]; beats: string[]; flags: string[]; counters: Record<string, number> };
  /** KNOWN ISLANDS (rupturas.ts knownRegions): region ids this save has had on its chart — they stay, reset or not */
  known?: string[];
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** the namespace, repaired in place (missing / broken → empty ledger; every valid entry survives) */
export function rupturasExt(): RupturasExt {
  const root = (G.s.ext ??= {}) as Record<string, unknown>;
  const cur = isObj(root.rupturas) ? (root.rupturas as Record<string, unknown>) : {};
  if (!isObj(cur.claimed)) cur.claimed = {};
  root.rupturas = cur;
  return cur as unknown as RupturasExt;
}

/** read-only: never creates the namespace (a save that never touched Parte II stays byte-identical) */
export function rewardClaimed(key: string): boolean {
  const r = (G.s?.ext as Record<string, unknown> | undefined)?.rupturas;
  const c = isObj(r) ? r.claimed : undefined;
  return isObj(c) && c[key] !== undefined && c[key] !== null;
}

/** mark a unique reward as paid (idempotent: the first date stays) */
export function claimReward(key: string, at = Date.now()) {
  const c = rupturasExt().claimed;
  if (c[key] === undefined || c[key] === null) c[key] = at;
}

/** the narrative reset already ran on this save (any version ≥ v) */
export function resetApplied(v = 1): boolean {
  const r = (G.s?.ext as Record<string, unknown> | undefined)?.rupturas;
  const rs = isObj(r) ? r.reset : undefined;
  return isObj(rs) && Number(rs.v) >= v;
}

// ------------------------------------------------------------------ the hooks' questions
/** ledger key of a story battle's one-time payout (Parte II battles only: Part I behaves exactly as before) */
export function battleKey(battleId: string, mission: string): string | null {
  return isPart2Mission(mission) ? `battle:${battleId}` : null;
}
export function catKey(battleId: string, mission: string): string | null {
  return isPart2Mission(mission) ? `cat:${battleId}` : null;
}
/** a Parte II mission completed again after the reset: its unique reward was already paid */
export function missionRewardClaimed(id: string): boolean {
  return isPart2Mission(id) && rewardClaimed(`mission:${id}`);
}
export function claimMissionReward(id: string) {
  if (isPart2Mission(id)) claimReward(`mission:${id}`);
}
