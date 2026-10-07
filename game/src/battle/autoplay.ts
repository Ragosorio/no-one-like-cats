/**
 * Shared battle construction + headless auto-play (AI vs AI) with the exact same turn flow as
 * BattleScene: start-of-turn rules → cat shot(s) → automatic volley → end of turn.
 * Used by BattleScene (makeBattle) and by the balance scripts (autoBattle).
 */
import { Battle, INK_RUNE } from './sim';
import { CELL } from './ship';
import { aimCannon, aimFrom, aiProfile, decide, AiProfile, DIFFICULTY } from './ai';
import { summonShooters } from './bossLate';
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

/** cannon spread: the same rule for both sides (GDD 2.9.3): σ = 5° − 0.6°·Mk Arma (the enemy fleet's Mk is per zone) */
export function volleySigma(spec: BattleSpec, side: 0 | 1) {
  const mk = side === 0 ? spec.meta?.weaponMk ?? 1 : spec.meta?.enemyWeaponMk ?? 3;
  return Math.max(0.8, 5 - 0.6 * mk);
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
  /** boss phase reached (boss battles) and the turn each phase began */
  bossPhase?: number;
  phaseTurns?: number[];
}

/** play a whole battle AI vs AI (player side uses `playerProfile`) */
export function autoBattle(spec: BattleSpec, playerProfile: AiProfile = DIFFICULTY.hard, seed = 1, maxRounds = 30, log?: (b: Battle, side: 0 | 1, shot: string) => void): AutoResult {
  const b = makeBattle(spec, seed);
  const mem = [new Map<string, number>(), new Map<string, number>()];
  const kos: Record<string, number> = {};
  const prof = [playerProfile, enemyProfile(spec)];
  let g = 0;
  const dmgBy = new Map<string, number>();
  const phaseTurns: number[] = [];
  const notePhase = () => {
    const p = b.boss?.phase ?? 0;
    while (phaseTurns.length < p - 1) phaseTurns.push(b.turn);
  };
  while (b.winner === null && g++ < maxRounds) {
    for (const side of [0, 1] as const) {
      notePhase();
      b.startTurn(side);
      b.queued.length = 0; // boss volleys are already resolved; only the view animates them
      if (b.winner !== null) break;
      let target: { x: number; y: number } | null = null;
      const shots = 1 + b.extraShots(side);
      for (let k = 0; k < shots && b.winner === null; k++) {
        const d = decide(b, side, prof[side], mem[side], seed * 31 + g * 7 + side * 3 + k, { demolisher: spec.rules?.demolisher?.includes(side), dmgBy });
        if (!d) break;
        const r = b.fire(side, d.shooter, d.angle, d.power, d.ult);
        log?.(b, side, `${d.shooter}${d.ult ? '(ULT)' : ''} ->(${Math.round(d.target.x)},${Math.round(d.target.y)}) ${r.shot.name}`);
        for (const e of r.events) {
          if (e.k === 'impact' && e.side === 1 - side && !target) target = { x: e.x, y: e.y };
          if (side === 0) {
            if ((e.k === 'module' && e.side === 1) || (e.k === 'cat' && e.side === 1 && e.ko)) kos[d.shooter] = (kos[d.shooter] ?? 0) + 1;
          } else if (e.k === 'cat' && e.side === 0 && e.dmg > 0) dmgBy.set(d.shooter, (dmgBy.get(d.shooter) ?? 0) + e.dmg);
        }
      }
      // the Arcanista's ink cats fire their runes
      for (const p of summonShooters(b, side)) {
        if (b.winner !== null) break;
        const a = aimFrom(b, side, b.partMuzzle(side, p), INK_RUNE, seed + g * 11 + p.id, 3);
        b.fire(side, `part:${p.id}`, a.angle, a.power);
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
  notePhase();
  return { won: b.winner === 0, turns: b.turn, reason: b.reason, kos, hullLost: 1 - b.hullPct(0), bossPhase: b.boss?.phase, phaseTurns };
}
