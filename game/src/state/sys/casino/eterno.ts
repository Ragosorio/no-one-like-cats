/**
 * MODO ETERNO (owner's rule, v2 2026-10-08).
 *
 * A 40-second session on ANY table:
 *   0–20 s   CALENTANDO: normal paid rounds, faster and faster (top speed at 15 s). ENFRIAR is allowed:
 *            stop = no 50/50, no reward, you keep what you won rolling.
 *   20–40 s  SIN FRENOS: it can't be stopped any more. LA SUERTE ETERNA: every round is a WIN (nothing is
 *            paid for them) and the winnings pile up in the BOTÍN, which DOUBLES every 4 s (×2 ×4 ×8 ×16).
 *            Besides the table's currency, lucky rounds DROP soft resources into the botín too (owner 2026-10-29:
 *            boletos, gems, pescaditos and gold; jackpots drop more — ETERNO.drops). They double with it.
 *   40 s     it explodes → FAIR 50/50 (crypto RNG, never steered):
 *     WIN  → gold, gems, food, tickets and chips are MULTIPLIED (×2), the whole botín is added (every currency it
 *            holds), + 1 special cat
 *            (legendary 40% · legendary HOLO 35% · mythic 25%; heroic/divine never)
 *     LOSS → exactly these balances become 0: G.s.gold, G.s.gems, G.s.food, casino.tickets, casino.chips
 *            (and the botín is gone). Nothing else is touched.
 *
 * Integrity:
 *   - resolveEterno(id, roll) is the ONE function that applies the outcome; idempotent per session id.
 *   - the roll is drawn at the explosion and applied + saved BEFORE the animation shows it.
 *   - a session abandoned (reload / crash) BEFORE the lock = stopped (nothing drawn, nothing changes).
 *     AFTER the lock it can't be escaped: the next time the casino opens, its 50/50 is drawn with the saved botín.
 */
import { G } from '../../game';
import { RarityId } from '../../econ';
import { Granted, catsOfRarity, cs, foodIncome, grantPrize, income, rand, rollCatPrize, withPostTable } from '../casino';

export const ETERNO = {
  /** session length (seconds of real time) */
  seconds: 40,
  /** from here ENFRIAR is gone and LA SUERTE ETERNA starts */
  lockAt: 20,
  /** the auto-play reaches top speed at this second */
  rampSeconds: 15,
  /** the botín doubles every N seconds of the lucky phase (at 24, 28, 32, 36 s → ×16) */
  doubleEvery: 4,
  /** what a WIN multiplies every balance at risk by */
  winMultiplier: 2,
  /** lucky rounds: per second, and what each pays in stakes of the table (a few are jackpots) */
  luck: { perSecond: 7, mult: [1.5, 6] as [number, number], jackpotChance: 0.07, jackpotMult: [10, 25] as [number, number] },
  /** P(win) of the final draw — 50/50, printed in the confirmation */
  winChance: 0.5,
  /** what the special reward is (shares add to 1; mythic falls back to a legendary HOLO if you can't field one yet) */
  reward: { legendary: 0.4, holo: 0.35, mythic: 0.25 },
  /**
   * LA SUERTE ETERNA's extras (owner 2026-10-29: «los premios cuando ya no se puede enfriar deben también dar boletos y
   * así»). On top of its payout in the table's currency, a lucky round may DROP one soft resource into the botín:
   *   normal round  `chance` to drop one (by weight): 1 boleto · 1 gema · 30 s of your pescaditos · 30 s of your gold
   *   jackpot round `jackpotChance` to drop one, twice as big (2 · 2 · 60 s · 60 s)
   * Gold / pescaditos are seconds of YOUR production (income / foodIncome), like every casino prize, so they scale with
   * your island and not with the stake. A drop in the table's own currency simply joins the main number.
   * Expected per session (~170 lucky rounds, ~12 of them jackpots; the doublings weigh the drops ×5 on average):
   *   before doubling ≈ 6.4 boletos · 4.6 gemas · 110 s of pescaditos · 110 s of gold
   *   on a WIN        ≈ 32 boletos · 23 gemas · ~9 min of pescaditos · ~9 min of gold  (EV per session: half)
   * A bonus on top: the main botín (stake × luck × up to ×16) is still the bulk, and a WIN already doubles your balances.
   */
  drops: {
    chance: 0.04,
    jackpotChance: 0.5,
    table: [
      { field: 'tickets', w: 35, n: 1, jackpot: 2 },
      { field: 'gems', w: 25, n: 1, jackpot: 2 },
      { field: 'food', w: 20, sec: 30, jackpot: 60 },
      { field: 'gold', w: 20, sec: 30, jackpot: 60 },
    ] as { field: 'tickets' | 'gems' | 'food' | 'gold'; w: number; n?: number; sec?: number; jackpot: number }[],
  },
  /** how many resolved session ids are remembered (only the open one can ever resolve anyway) */
  keepIds: 40,
} as const;

/** the exact balances that go to 0 on a loss — and nothing else */
export const AT_RISK = ['gold', 'gems', 'food', 'tickets', 'chips'] as const;
export type EternoField = (typeof AT_RISK)[number];
export const AT_RISK_NAME: Record<EternoField, string> = { gold: 'Oro', gems: 'Gemas', food: 'Pescaditos', tickets: 'Boletos', chips: 'Fichas' };
/**
 * Other SOFT resources a later system puts at stake too (Parte II · Oleada 3: Combustible Astral, bible §11): ×2 on a
 * win, 0 on a loss, exactly like the five above. Registered by their own module; cats, forms, Nácar and Tinta never.
 */
export interface EternoExtra {
  key: string;
  name: string;
  get(): number;
  set(v: number): void;
}
export const ETERNO_EXTRA: EternoExtra[] = [];
/** the extras the player actually holds right now (the confirmation lists them) */
export function extraAtRisk(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const x of ETERNO_EXTRA) {
    const v = x.get();
    if (v > 0) out[x.key] = v;
  }
  return out;
}

export interface EternoSession {
  id: string;
  /** Date.now() at start */
  at: number;
  /** game the machine was running ("slot", "roulette"…) */
  game: string;
  /** past the lock: it can't be stopped or escaped any more */
  locked?: boolean;
  /** LA SUERTE ETERNA's winnings, at stake in the 50/50 */
  pot?: EternoPot;
}
/**
 * The BOTÍN: `amount` in the table's currency `cur` (the shape every save since 2026-10-08 has) plus, optionally, the
 * drops of other currencies (`extra`, 2026-10-29). An old save's pot has no `extra`: it is exactly the old botín.
 */
export interface EternoPot {
  cur: EternoField;
  amount: number;
  doublings: number;
  /** drops in currencies other than `cur` (boletos, gems, pescaditos, gold) */
  extra?: Partial<Record<EternoField, number>>;
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
  /** win: what each field had before (×winMultiplier) and what it has now */
  before?: Record<EternoField, number>;
  after?: Record<EternoField, number>;
  /** the botín at the explosion (added on a win, gone on a loss) */
  pot?: EternoPot;
  /** ETERNO_EXTRA balances: before the draw (win: they doubled · loss: they went to 0) */
  extra?: Record<string, number>;
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

/** past 20 s: no ENFRIAR, the botín opens in the table's currency. Saved right away. */
export function lockEterno(id: string, cur: EternoField) {
  const e = eternoState();
  if (!e.open || e.open.id !== id || e.open.locked) return;
  e.open.locked = true;
  e.open.pot = { cur, amount: 0, doublings: 0 };
  G.save();
}
/** one lucky round: `amount` goes into the botín (saved at each doubling, not each round) */
export function addLuck(id: string, amount: number) {
  const o = eternoState().open;
  if (!o || o.id !== id || !o.locked || !o.pot || !(amount > 0)) return;
  o.pot.amount += amount;
}
/** a resource a lucky round dropped into the botín */
export interface EternoDrop {
  field: EternoField;
  n: number;
}
/**
 * What a lucky round drops on top of its payout (ETERNO.drops), or null. Gold / pescaditos are seconds of production
 * (`inc`: per second, the casino's income() / foodIncome()); boletos and gems are whole units.
 */
export function luckyDrop(jackpot: boolean, r: () => number = rand, inc: { gold: number; food: number } = { gold: income(), food: foodIncome() }): EternoDrop | null {
  const D = ETERNO.drops;
  if (!(r() < (jackpot ? D.jackpotChance : D.chance))) return null;
  const tot = D.table.reduce((s, x) => s + x.w, 0);
  let x = r() * tot;
  let e = D.table[D.table.length - 1];
  for (const it of D.table) {
    x -= it.w;
    if (x < 0) {
      e = it;
      break;
    }
  }
  if (e.sec !== undefined) {
    const per = Math.max(0, Number(e.field === 'gold' ? inc.gold : inc.food) || 0);
    const n = Math.round(per * (jackpot ? e.jackpot : e.sec));
    return n > 0 ? { field: e.field, n } : null;
  }
  return { field: e.field, n: jackpot ? e.jackpot : (e.n ?? 1) };
}
/** a drop lands in the botín: the table's currency joins `amount`, any other one the multi-currency part */
export function addDrop(id: string, d: EternoDrop) {
  const o = eternoState().open;
  if (!o || o.id !== id || !o.locked || !o.pot || !(d.n > 0) || !(AT_RISK as readonly string[]).includes(d.field)) return;
  if (d.field === o.pot.cur) o.pot.amount += d.n;
  else {
    const x = (o.pot.extra ??= {});
    x[d.field] = (x[d.field] ?? 0) + d.n;
  }
}
const num = (v: unknown) => (Number.isFinite(v) && (v as number) > 0 ? (v as number) : 0);
/** every currency the botín holds (0 for the rest) — an old save's pot (no `extra`) is just its `amount` in `cur` */
export function potTotals(pot: EternoPot | null | undefined): Record<EternoField, number> {
  const out: Record<EternoField, number> = { gold: 0, gems: 0, food: 0, tickets: 0, chips: 0 };
  if (!pot) return out;
  if ((AT_RISK as readonly string[]).includes(pot.cur)) out[pot.cur] += num(pot.amount);
  for (const k of AT_RISK) out[k] += num(pot.extra?.[k]);
  return out;
}
/** the botín holds something */
export const potHasAny = (pot: EternoPot | null | undefined) => AT_RISK.some((k) => potTotals(pot)[k] > 0);
/** the botín doubles (×2): its main number and every drop it holds. Saved. */
export function doublePot(id: string) {
  const o = eternoState().open;
  if (!o || o.id !== id || !o.pot) return;
  o.pot.amount *= 2;
  if (o.pot.extra) for (const k of AT_RISK) if (o.pot.extra[k] !== undefined) o.pot.extra[k] = num(o.pot.extra[k]) * 2;
  o.pot.doublings++;
  G.save();
}
/** what one lucky round pays, in units of the table's stake */
export function luckyMult(r: () => number = rand) {
  const L = ETERNO.luck;
  if (r() < L.jackpotChance) return L.jackpotMult[0] + r() * (L.jackpotMult[1] - L.jackpotMult[0]);
  return L.mult[0] + r() * (L.mult[1] - L.mult[0]);
}

/** the player cooled the machine down before the lock: no 50/50, no special reward. Idempotent. */
export function stopEterno(id: string, why: 'stop' | 'abandon' = 'stop'): EternoRecord | null {
  const e = eternoState();
  if (e.done.includes(id) || e.open?.id !== id) return null;
  // past the lock there's no way out (an abandoned locked session is resolved by settleAbandoned)
  if (e.open.locked) return null;
  const rec: EternoRecord = { id, r: why, at: Date.now() };
  remember(e, rec);
  e.stops++;
  G.save();
  return rec;
}

/**
 * A session still open when the casino opens again (reload / crash). Before the lock = abandoned (nothing
 * happens). After the lock = its 50/50 is drawn now, with the botín it had saved.
 */
export function settleAbandoned(): EternoRecord | null {
  const e = eternoState();
  if (!e.open) return null;
  if (e.open.locked) return resolveEterno(e.open.id, eternoRoll())?.record ?? null;
  return stopEterno(e.open.id, 'abandon');
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
  const pot: EternoPot | undefined = e.open.pot ? { ...e.open.pot, ...(e.open.pot.extra ? { extra: { ...e.open.pot.extra } } : {}) } : undefined;
  const rec: EternoRecord = { id, r: win ? 'win' : 'loss', roll, at: Date.now(), pot };
  // mark first: even if a grant below threw, this session can never resolve again
  remember(e, rec);
  if (win) {
    e.wins++;
    const before = atRisk();
    rec.before = before;
    const c = cs();
    const m = ETERNO.winMultiplier;
    // the whole botín: its main number and every drop (an old save's pot is just `amount` in `cur`)
    const tot = potTotals(pot);
    const potOf = (k: EternoField) => tot[k];
    const whole = (k: EternoField, v: number) => (k === 'gold' || k === 'food' ? v : Math.floor(v));
    G.s.gold = whole('gold', before.gold * m + potOf('gold'));
    G.s.gems = whole('gems', before.gems * m + potOf('gems'));
    G.s.food = whole('food', before.food * m + potOf('food'));
    c.tickets = whole('tickets', before.tickets * m + potOf('tickets'));
    c.chips = whole('chips', before.chips * m + potOf('chips'));
    rec.after = atRisk();
    for (const k of AT_RISK) {
      const d = rec.after[k] - before[k];
      if (d) G.emit('res', { key: k, delta: d, source: 'eterno' });
    }
    const ex = extraAtRisk();
    if (Object.keys(ex).length) rec.extra = ex;
    for (const x of ETERNO_EXTRA) if (ex[x.key]) x.set(ex[x.key] * m);
    // after the Parte III the special cat may come from the Multiverse (state/sys/postp3.ts)
    rec.prize = grantPrize(withPostTable({ game: 'eterno' }, () => eternoPrize()));
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
    const ex = extraAtRisk();
    if (Object.keys(ex).length) rec.extra = ex;
    for (const x of ETERNO_EXTRA) if (ex[x.key]) x.set(0);
  }
  G.save();
  return { record: rec, applied: true };
}
