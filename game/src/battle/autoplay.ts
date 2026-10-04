/**
 * Shared battle construction + headless auto-play (AI vs AI) with the exact same turn flow as
 * BattleScene: start-of-turn rules → cat shot(s) → automatic volley → end of turn.
 * Used by BattleScene (makeBattle) and by the balance scripts (autoBattle).
 */
import { Battle } from './sim';
import { CELL } from './ship';
import { aimCannon, aiProfile, decide, AiProfile, DIFFICULTY } from './ai';
import type { BattleSpec } from '../scenes/BattleScene';

export const WATER_Y = 820;
const SCREEN_W = 1920;

/** the sim for a spec, with the battle-screen geometry */
export function makeBattle(spec: BattleSpec, seed = spec.seed ?? Math.floor(Math.random() * 1e9)) {
  const eW = spec.enemy.blueprint.cols * CELL;
  const originY = (bp: { rows: number }) => WATER_Y - bp.rows * CELL + 70;
  return new Battle({
    seed,
    waterY: WATER_Y,
    mode: spec.mode,
    boss: spec.boss,
    rules: spec.rules,
    suddenDeath: spec.suddenDeath,
    sides: [
      { ...spec.player, origin: { x: 70, y: originY(spec.player.blueprint) }, flip: false },
      { ...spec.enemy, origin: { x: SCREEN_W - 70 - eW, y: originY(spec.enemy.blueprint) }, flip: true },
    ],
  });
}

/** cannon spread: player tightens with the Arma Mk (GDD 2.9.3), enemies use a fixed σ */
export function volleySigma(spec: BattleSpec, side: 0 | 1) {
  return side === 0 ? Math.max(0.8, 5 - 0.6 * (spec.meta?.weaponMk ?? 1)) : 3;
}

export function enemyProfile(spec: BattleSpec): AiProfile {
  return aiProfile(spec.difficulty, spec.personality);
}

export interface AutoResult {
  won: boolean;
  turns: number;
  reason: string | null;
  /** K.O. credited per player cat uid (modules destroyed + cats knocked out) */
  kos: Record<string, number>;
  hullLost: number;
}

/** play a whole battle AI vs AI (player side uses `playerProfile`) */
export function autoBattle(spec: BattleSpec, playerProfile: AiProfile = DIFFICULTY.hard, seed = 1, maxRounds = 30): AutoResult {
  const b = makeBattle(spec, seed);
  const mem = [new Map<string, number>(), new Map<string, number>()];
  const kos: Record<string, number> = {};
  const prof = [playerProfile, enemyProfile(spec)];
  let g = 0;
  const dmgBy = new Map<string, number>();
  while (b.winner === null && g++ < maxRounds) {
    for (const side of [0, 1] as const) {
      b.startTurn(side);
      if (b.winner !== null) break;
      let target: { x: number; y: number } | null = null;
      const shots = 1 + b.extraShots(side);
      for (let k = 0; k < shots && b.winner === null; k++) {
        const d = decide(b, side, prof[side], mem[side], seed * 31 + g * 7 + side * 3 + k, { demolisher: spec.rules?.demolisher?.includes(side), dmgBy });
        if (!d) break;
        const r = b.fire(side, d.shooter, d.angle, d.power, d.ult);
        for (const e of r.events) {
          if (e.k === 'impact' && e.side === 1 - side && !target) target = { x: e.x, y: e.y };
          if (side === 0) {
            if ((e.k === 'module' && e.side === 1) || (e.k === 'cat' && e.side === 1 && e.ko)) kos[d.shooter] = (kos[d.shooter] ?? 0) + 1;
          } else if (e.k === 'cat' && e.side === 0 && e.dmg > 0) dmgBy.set(d.shooter, (dmgBy.get(d.shooter) ?? 0) + e.dmg);
        }
      }
      for (const m of b.cannons(side)) {
        if (b.winner !== null) break;
        const a = aimCannon(b, side, m.id, seed + g * 7 + m.id, volleySigma(spec, side), target ?? undefined);
        b.fire(side, 'cannon', a.angle, a.power, false, m.id);
      }
      b.endTurn();
      if (b.winner !== null) break;
    }
  }
  return { won: b.winner === 0, turns: b.turn, reason: b.reason, kos, hullLost: 1 - b.hullPct(0) };
}
