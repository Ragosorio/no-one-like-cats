/**
 * DUELO DE DADOS vs. DON CUBILETE (the casino's dice cat). Best of 3 rounds; win 2 rounds → you're paid x2.6.
 * Each round:
 *   1. you roll 2 dice (shown);
 *   2. YOUR DECISION: keep them, or re-roll ONE die (you pick which) — once per round;
 *   3. Don Cubilete rolls 2 dice. His public rule: if he's below your total he re-rolls his LOWER die, once;
 *   4. higher total wins the round. TIE = the house wins the round (it's his casino).
 * The win chance of each option is computed exactly (enumeration of every die) and shown before you decide.
 * With the best decision every round: P(win a round) = 41.13%, P(win the duel) = 36.84%, RTP = 95.8%.
 * A duel is paid when it starts and saved after every roll: reloading resumes it with the same dice.
 */
import { Cur, cs, persist } from '../casino';
import { Rng, Settled, defaultRng, miniStakes, pay, payout, rint, settle, validStake } from './common';

export const DICE = { mult: 2.6, need: 2 } as const;
const D6 = [1, 2, 3, 4, 5, 6];

/** P(Don Cubilete ends ≥ T): he rolls 2 dice and re-rolls the lower one if he is below T */
export function catReaches(T: number): number {
  let w = 0;
  for (const a of D6)
    for (const b of D6) {
      if (a + b >= T) {
        w += 1;
        continue;
      }
      const hi = Math.max(a, b);
      w += D6.filter((r) => hi + r >= T).length / 6;
    }
  return w / 36;
}
/** P(you win the round) with a final total of T (ties go to the house) */
const PW: number[] = [];
for (let t = 0; t <= 13; t++) PW[t] = 1 - catReaches(t);
export const roundWin = (total: number) => PW[Math.max(0, Math.min(13, total))];

/** win chance of each decision for a roll [a, b]: keep, re-roll die 0, re-roll die 1 */
export function options(dice: [number, number]) {
  const [a, b] = dice;
  return {
    keep: roundWin(a + b),
    r0: D6.reduce((s, r) => s + roundWin(b + r), 0) / 6,
    r1: D6.reduce((s, r) => s + roundWin(a + r), 0) / 6,
  };
}
/** the best decision (-1 keep, 0 / 1 = re-roll that die). Ties prefer keeping. */
export function bestChoice(dice: [number, number]): -1 | 0 | 1 {
  const o = options(dice);
  if (o.keep >= o.r0 && o.keep >= o.r1) return -1;
  return o.r0 >= o.r1 ? 0 : 1;
}
/** exact P(win a round) with the best decision */
export const P_ROUND = (() => {
  let p = 0;
  for (const a of D6) for (const b of D6) p += Math.max(...Object.values(options([a, b]))) / 36;
  return p;
})();
/** best of 3 */
export const P_DUEL = P_ROUND * P_ROUND * (3 - 2 * P_ROUND);
export const DICE_RTP = P_DUEL * DICE.mult;

export function diceStakes(cur: Cur) {
  return miniStakes(cur, DICE.mult);
}

export interface Duel {
  cur: Cur;
  stake: number;
  round: number;
  me: number;
  cat: number;
  /** your current dice (waiting for your decision) */
  dice: [number, number];
}
export interface RoundResult {
  before: [number, number];
  /** which die you re-rolled (-1 none) and its new value */
  rerolled: -1 | 0 | 1;
  mine: [number, number];
  catFirst: [number, number];
  /** which of his dice he re-rolled (-1 none) */
  catRerolled: -1 | 0 | 1;
  catDice: [number, number];
  winner: 'me' | 'cat';
  score: [number, number];
  /** duel over: settled */
  done: Settled | null;
  won?: boolean;
  /** next round's dice (already rolled & saved) */
  next?: [number, number];
}

const die = (rng: Rng) => 1 + rint(6, rng);
export function duel(): Duel | null {
  const d = cs().duel as Duel | undefined | null;
  if (!d || !Array.isArray(d.dice) || d.dice.length !== 2) return null;
  return d;
}
export function duelStart(cur: Cur, stake: number, rng: Rng = defaultRng): Duel | null {
  if (duel()) return null;
  if (!validStake(cur, stake, DICE.mult)) return null;
  pay(cur, stake);
  const d: Duel = { cur, stake, round: 1, me: 0, cat: 0, dice: [die(rng), die(rng)] };
  cs().duel = d;
  persist();
  return d;
}
export function duelDecide(choice: -1 | 0 | 1, rng: Rng = defaultRng): RoundResult | null {
  const d = duel();
  if (!d) return null;
  const before: [number, number] = [d.dice[0], d.dice[1]];
  const mine: [number, number] = [before[0], before[1]];
  if (choice === 0 || choice === 1) mine[choice] = die(rng);
  const total = mine[0] + mine[1];
  const catFirst: [number, number] = [die(rng), die(rng)];
  const catDice: [number, number] = [catFirst[0], catFirst[1]];
  let catRerolled: -1 | 0 | 1 = -1;
  if (catFirst[0] + catFirst[1] < total) {
    catRerolled = catFirst[0] <= catFirst[1] ? 0 : 1;
    catDice[catRerolled] = die(rng);
  }
  const winner = total > catDice[0] + catDice[1] ? 'me' : 'cat';
  if (winner === 'me') d.me++;
  else d.cat++;
  const res: RoundResult = { before, rerolled: choice, mine, catFirst, catRerolled, catDice, winner, score: [d.me, d.cat], done: null };
  if (d.me >= DICE.need || d.cat >= DICE.need) {
    const won = d.me >= DICE.need;
    cs().duel = null;
    res.won = won;
    res.done = settle('dice', d.cur, d.stake, won ? payout(d.stake, DICE.mult) : 0, `DADOS ${d.me}-${d.cat}`);
  } else {
    d.round++;
    d.dice = [die(rng), die(rng)];
    res.next = [d.dice[0], d.dice[1]];
    persist();
  }
  return res;
}
