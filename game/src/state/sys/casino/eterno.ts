/**
 * MODO ETERNO (casino overhaul 2026-10, owner's definitive rule).
 *
 * A 20-second session: the machine keeps playing normal rounds (each one paid and settled as usual) while it
 * accelerates and overheats. At 20 s it explodes and a FAIR 50/50 is drawn (crypto RNG, never steered):
 *   WIN  → the player keeps everything + ONE special cat: legendary, mythic or HOLO (casino pools; heroic/divine never)
 *   LOSS → exactly these balances become 0: G.s.gold, G.s.gems, G.s.food, casino.tickets, casino.chips.
 *          Nothing else is touched (cats, ships, habitats, buildings, levels, stars, orbs, crystals, prisma, purr,
 *          scrap, blueprints, story, catdex…).
 * Stopping before the 20 s (ENFRIAR) forfeits the special reward and skips the 50/50.
 *
 * Integrity:
 *   - resolveEterno(id, roll) is the ONE function that applies the outcome. It is idempotent: a session id resolves
 *     once (ids are persisted in `done`), so a double tap or a reload can never apply it twice or re-roll it.
 *   - the roll is drawn at the explosion and applied + saved in the same synchronous call, BEFORE the animation
 *     shows it: reloading during the reveal changes nothing.
 *   - a session left open by a reload / crash (before the explosion) is settled as ABANDONED = same as stopping:
 *     no roll had been drawn yet, so nothing was known and nothing is lost or won.
 */
import { G } from '../../game';
import { RarityId } from '../../econ';
import { Granted, catsOfRarity, cs, grantPrize, rand, rollCatPrize } from '../casino';

export const ETERNO = {
  /** session length (seconds of real time) */
  seconds: 20,
  /** P(win) of the final draw — 50/50, printed in the confirmation */
  winChance: 0.5,
  /** what the special reward is (shares add to 1; mythic falls back to a legendary HOLO if you can't field one yet) */
  reward: { legendary: 0.5, holo: 0.35, mythic: 0.15 },
  /** how many resolved session ids are remembered (only the open one can ever resolve anyway) */
  keepIds: 40,
} as const;

/** the exact balances that go to 0 on a loss — and nothing else */
export const AT_RISK = ['gold', 'gems', 'food', 'tickets', 'chips'] as const;
export type EternoField = (typeof AT_RISK)[number];
export const AT_RISK_NAME: Record<EternoField, string> = { gold: 'Oro', gems: 'Gemas', food: 'Pescaditos', tickets: 'Boletos', chips: 'Fichas' };

export interface EternoSession {
  id: string;
  /** Date.now() at start */
  at: number;
  /** game the machine was running ("slot", "roulette"…) */
  game: string;
}
export type EternoOutcome = 'win' | 'loss' | 'stop' | 'abandon';
export interface EternoRecord {
  id: string;
  r: EternoOutcome;
  /** the draw (win/loss only) */
  roll?: number;
  at: number;
  /** loss: what each field had (now 0) */
  lost?: Record<EternoField, number>;
  /** win: the special cat */
  prize?: Granted;
}
export interface EternoState {
  open?: EternoSession | null;
  /** resolved session ids (newest first) */
  done: string[];
  last?: EternoRecord | null;
  wins: number;
  losses: number;
  stops: number;
}

export function eternoState(): EternoState {
  const c = cs() as ReturnType<typeof cs> & { eterno?: EternoState };
  const e = (c.eterno ??= { done: [], wins: 0, losses: 0, stops: 0 });
  if (!Array.isArray(e.done)) e.done = [];
  e.wins = Number.isFinite(e.wins) ? e.wins : 0;
  e.losses = Number.isFinite(e.losses) ? e.losses : 0;
  e.stops = Number.isFinite(e.stops) ? e.stops : 0;
  return e;
}

/** current amounts of the five fields at risk (what the confirmation prints) */
export function atRisk(): Record<EternoField, number> {
  const c = cs();
  return { gold: G.s.gold ?? 0, gems: G.s.gems ?? 0, food: G.s.food ?? 0, tickets: c.tickets ?? 0, chips: c.chips ?? 0 };
}

/** uniform [0,1) from the platform CSPRNG (53 bits), Math.random only if crypto is missing */
export function eternoRoll(): number {
  try {
    const a = new Uint32Array(2);
    crypto.getRandomValues(a);
    return (a[0] * 2097152 + (a[1] >>> 11)) / 9007199254740992;
  } catch {
    return Math.random();
  }
}
/** the rule of the draw (exactly 50%: [0, 0.5) wins) */
export function eternoWins(roll: number): boolean {
  return roll < ETERNO.winChance;
}

function newId(): string {
  let r = '';
  try {
    const a = new Uint32Array(2);
    crypto.getRandomValues(a);
    r = a[0].toString(36) + a[1].toString(36);
  } catch {
    r = Math.random().toString(36).slice(2);
  }
  return `et-${Date.now().toString(36)}-${r}`;
}

function remember(e: EternoState, rec: EternoRecord) {
  e.done.unshift(rec.id);
  if (e.done.length > ETERNO.keepIds) e.done.length = ETERNO.keepIds;
  e.last = rec;
  if (e.open?.id === rec.id) e.open = null;
}

/** open a session (an older open one is settled as abandoned first). Saved right away. */
export function startEterno(game: string): EternoSession {
  const e = eternoState();
  if (e.open) settleAbandoned();
  const s: EternoSession = { id: newId(), at: Date.now(), game };
  e.open = s;
  G.save();
  return s;
}

/** the player cooled the machine down before the explosion: no 50/50, no special reward. Idempotent. */
export function stopEterno(id: string, why: 'stop' | 'abandon' = 'stop'): EternoRecord | null {
  const e = eternoState();
  if (e.done.includes(id) || e.open?.id !== id) return null;
  const rec: EternoRecord = { id, r: why, at: Date.now() };
  remember(e, rec);
  e.stops++;
  G.save();
  return rec;
}

/** a session still open when the casino opens again (reload / crash before the explosion) = abandoned */
export function settleAbandoned(): EternoRecord | null {
  const e = eternoState();
  return e.open ? stopEterno(e.open.id, 'abandon') : null;
}

/** the special reward: legendary, mythic or HOLO (from the casino/portal pools: no heroic, no divine, no Podio cats) */
export function eternoPrize(r: () => number = rand) {
  const x = r();
  const w = ETERNO.reward;
  if (x < w.mythic && catsOfRarity('mythic', true).length) return rollCatPrize(['mythic'], undefined, 0, null, 0.5, true);
  if (x < w.mythic + w.holo) return rollCatPrize(['legendary'], undefined, 1, null, 0.5, true);
  return rollCatPrize(['legendary' as RarityId], undefined, 0, null, 0.5, true);
}

export interface EternoResolution {
  record: EternoRecord;
  /** this call applied it (false = it had already been resolved: nothing changed) */
  applied: boolean;
}

/**
 * THE resolution. Pure state function over G.s: applies the outcome of `roll` to session `id` exactly once.
 * Returns null for an unknown session / invalid roll (nothing changes); for an already-resolved id returns the
 * stored record with applied=false (nothing changes). Saves immediately after applying.
 */
export function resolveEterno(id: string, roll: number): EternoResolution | null {
  const e = eternoState();
  if (e.done.includes(id)) return e.last?.id === id ? { record: e.last, applied: false } : { record: { id, r: 'stop', at: 0 }, applied: false };
  if (!e.open || e.open.id !== id) return null;
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1) return null;
  const win = eternoWins(roll);
  const rec: EternoRecord = { id, r: win ? 'win' : 'loss', roll, at: Date.now() };
  // mark first: even if a grant below threw, this session can never resolve again
  remember(e, rec);
  if (win) {
    e.wins++;
    rec.prize = grantPrize(eternoPrize());
  } else {
    e.losses++;
    const lost = atRisk();
    rec.lost = lost;
    const c = cs();
    G.s.gold = 0;
    G.s.gems = 0;
    G.s.food = 0;
    c.tickets = 0;
    c.chips = 0;
    for (const k of AT_RISK) if (lost[k]) G.emit('res', { key: k, delta: -lost[k], source: 'eterno' });
  }
  G.save();
  return { record: rec, applied: true };
}
