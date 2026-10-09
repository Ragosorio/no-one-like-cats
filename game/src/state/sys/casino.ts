/**
 * Casino "El Gato Negro" (casino agent): Fichas, Boletos, slot machine + roulette, prize granting,
 * stake memory, auto-play preferences and the "candy" rules (la casa siempre gana, pero te da dulces).
 *
 * Rules (player feedback 2026-10 · "adictivo pero justo"):
 *  - only in-game currency; gems are earned playing; nothing is sold for real money. Ever.
 *  - every probability / payout is visible BEFORE betting; RTP is computed exactly from the reel strips,
 *    per risk tier (BAJA / MEDIA / ALTA). Reels are independent and uniform over their public strips.
 *  - RISK TIERS: a bigger stake changes the paytable — fewer lines pay (more spins with nothing) but what pays,
 *    pays more (gold RTP 95.3% → 96.2% → 97.3%; chip prizes jump to tickets, gems and legendary cats).
 *  - LA CASA TE DEBE: every losing bet fills a visible meter; when full the house pays a boleto + fichas.
 *    You can never go a long streak without getting *something*.
 *  - gold bets: EV < 1 always (the house wins), stake capped by income (balance.gambit).
 *  - auto-play exists (with stop conditions); the casino can't be hidden (it's part of the story now).
 */
import { G } from '../game';
import { BAL, RarityId } from '../econ';
import { CATS, CatDef, catDef } from '../../data/content';
import { adopt } from './cats';
import { ACC_BY_ID, AccRarity, addAccessory, rollAccessory } from './accessories';
import { registerPatch } from '../patches';

export type Cur = 'gold' | 'gems' | 'chips';
export type GameId = 'slot' | 'roulette' | 'gacha' | 'caja' | 'plinko' | 'dice' | 'scratch' | 'boxes' | 'bingo' | 'hilo' | 'eterno';

export interface HistEntry {
  g: GameId;
  cur: Cur | 'tickets';
  stake: number;
  win: number;
  /** short label of the result ("17 ROJO", "3x PEZ") */
  r: string;
}

export interface CasinoState {
  tickets: number;
  pity: Record<string, number>;
  stats: Record<string, number>;
  // ---- extra fields (persist in the same object; optional for old saves)
  chips?: number;
  sync?: { vic: number; kl: number; boss: number; perf: number };
  gemBets?: number;
  hist?: HistEntry[];
  welcomed?: boolean;
  /** +n consecutive wins / -n consecutive losses */
  streak?: number;
  /** LA CASA TE DEBE: losing bets since the last real win / candy payout */
  owed?: number;
  /** stake memory + auto-play settings (persist across sessions) */
  prefs?: CasinoPrefs;
  /** open multi-step hands (already paid; a reload resumes them, it never re-deals) — see state/sys/casino/*.ts */
  duel?: unknown;
  boxes?: unknown;
  hilo?: unknown;
  /** MODO ETERNO sessions (state/sys/casino/eterno.ts) */
  eterno?: unknown;
}

/**
 * Animation speed of the auto-play (2026-10 overhaul): the player picks x1 · x2 · x10. ETERNO is not a speed but a
 * session (state/sys/casino/eterno.ts) that ramps the speed continuously, so views accept any number ≥ 1.
 *   ≥ 4   "fast": shorter banners, no host chatter
 *   ≥ 10  results-first: the reels/wheel still move but every banner is skipped (results stay readable)
 *   ≥ INSTANT_SPEED (only reached by ETERNO): the result is placed instantly
 */
export type AutoSpeed = number;
export const AUTO_SPEEDS = [1, 2, 10] as const;
export type AutoSpeedChoice = (typeof AUTO_SPEEDS)[number];
export const INSTANT_SPEED = 25;
export interface AutoPrefs {
  speed: AutoSpeedChoice;
  /** rounds per run (0 = until a stop condition) */
  rounds: number;
  /** stop on a big win (slot ×5+ / jackpot / pleno · gacha épico+ cat) */
  stopBig: boolean;
  /** stop on LEGENDARIO or better (gacha / cat prizes) */
  stopLegend: boolean;
  /** stop on a cat you didn't have */
  stopNew: boolean;
  /** stop if the balance drops below this % of what you had when you pressed AUTO (0 = never) */
  floorPct: number;
  /** prefs schema: 2 = x1/x2/x10 speeds + "until you stop" defaults (2026-10 overhaul) */
  v?: number;
}
/** continuous play by default: a prize never ends the run (stop conditions are opt-in), the balance floor stays on */
export const AUTO_DEFAULT: AutoPrefs = { speed: 2, rounds: 0, stopBig: false, stopLegend: false, stopNew: false, floorPct: 50, v: 2 };
export interface CasinoPrefs {
  tab?: string;
  slot?: { cur?: Cur; tier?: Partial<Record<Cur, number>> };
  roulette?: { cur?: Cur; bet?: RouletteBet; stake?: Partial<Record<Cur, number>> };
  gacha?: { banner?: string; pay?: 'tickets' | 'gems'; mode?: string; n?: 1 | 10 };
  auto?: AutoPrefs;
  /** new tables (plinko, dados, rasca, cajas, bingo, mayor/menor): currency + stake + risk memory per game */
  games?: Record<string, MiniPrefs>;
}
export interface MiniPrefs {
  cur?: Cur;
  /** remembered stake value (stakeFor() keeps it when the option list changes) */
  stake?: number;
  /** risk tier / variant */
  tier?: number;
  /** cards per round (bingo) */
  n?: number;
  /** bingo cards the player keeps between rounds (cosmetic: every card has the same odds) */
  cards?: number[][];
}

export function cs(): CasinoState {
  G.s.casino ??= { tickets: 0, pity: {}, stats: {} };
  const c = G.s.casino as CasinoState;
  c.pity ??= {};
  c.stats ??= {};
  c.tickets ??= 0;
  c.chips ??= 0;
  c.hist ??= [];
  c.gemBets ??= 0;
  c.streak ??= 0;
  c.owed ??= 0;
  c.prefs ??= {};
  return c;
}
export function prefs(): CasinoPrefs {
  return cs().prefs!;
}
export function autoPrefs(): AutoPrefs {
  const p = prefs();
  p.auto = migrateAutoPrefs(p.auto);
  return p.auto;
}
/**
 * Saved auto-play prefs → current schema. Old speeds x4 / TURBO (99) become x10; the old defaults (25 rounds,
 * stop on any big win / legendary) become "until you stop" once — a player who picked other values keeps them.
 */
export function migrateAutoPrefs(old: Partial<AutoPrefs> | Record<string, unknown> | undefined): AutoPrefs {
  const o = { ...AUTO_DEFAULT, ...((old ?? {}) as Partial<AutoPrefs>) };
  const sp = Number((old as Partial<AutoPrefs> | undefined)?.speed ?? AUTO_DEFAULT.speed);
  o.speed = sp === 1 || sp === 2 ? sp : sp > 2 ? 10 : AUTO_DEFAULT.speed;
  if ((old as Partial<AutoPrefs> | undefined)?.v !== 2 && old) {
    if (o.rounds === 25) o.rounds = 0;
    if (o.stopBig === true) o.stopBig = false;
    if (o.stopLegend === true) o.stopLegend = false;
  }
  if (![0, 10, 25, 50, 100].includes(o.rounds)) o.rounds = 0;
  if (![0, 25, 50, 75].includes(o.floorPct)) o.floorPct = 50;
  o.v = 2;
  return o;
}
function stat(k: string, n = 1) {
  const s = cs().stats;
  s[k] = (s[k] ?? 0) + n;
}

// ------------------------------------------------------------------ randomness (uniform, crypto when available)
export function rand(): number {
  try {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] / 4294967296;
  } catch {
    return Math.random();
  }
}
export function randInt(n: number) {
  return Math.floor(rand() * n);
}
export function pick<T>(a: readonly T[]): T {
  return a[randInt(a.length)];
}
export function weighted<T>(items: readonly T[], w: (t: T) => number): T {
  const tot = items.reduce((s, t) => s + Math.max(0, w(t)), 0);
  let r = rand() * tot;
  for (const it of items) {
    r -= Math.max(0, w(it));
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

// ------------------------------------------------------------------ Fichas (chips) & Boletos (tickets)
/**
 * Not simulated (GDD §9 #24): chip/ticket income is tied to playing, never to the calendar.
 * 2026-10 rebalance: the old economy gave ~3 pulls per hour (14 pulls in 4.7 h → a legendary was impossible).
 * Now an engaged player earns ~20 pulls per hour (boletos per victory / Reino level / boss + cheaper La Caja).
 */
export const CHIPS = {
  welcome: 150,
  /** income cap: fichas EARNED BY PLAYING the campaign stop filling the tray at this amount. Winnings and prizes are never capped. */
  welcomeTickets: 10,
  perVictory: 6,
  perPerfect: 3,
  perKl: 25,
  perBoss: 80,
  cap: 1500,
  /** 1 boleto every N victories */
  victoriesPerTicket: 4,
  ticketsPerKl: 1,
  ticketsPerBoss: 5,
} as const;

export function chips() {
  return cs().chips ?? 0;
}
export function tickets() {
  return cs().tickets ?? 0;
}
/**
 * Add (or spend, n < 0) fichas. Returns what was REALLY added, so labels never lie.
 * Only campaign income (source 'sync') respects CHIPS.cap, and it never removes chips you already have;
 * casino winnings and prizes are not capped (2026-10: the old silent clamp ate prizes over 1500).
 */
export function addChips(n: number, source = 'casino'): number {
  if (!n) return 0;
  const c = cs();
  const before = c.chips ?? 0;
  let next = Math.max(0, before + n);
  if (source === 'sync' && n > 0) next = Math.max(before, Math.min(CHIPS.cap, next));
  c.chips = next;
  const d = next - before;
  if (d) G.emit('res', { key: 'chips', delta: d, source });
  return d;
}
export function addTickets(n: number, source = 'casino') {
  if (!n) return;
  const c = cs();
  c.tickets = Math.max(0, c.tickets + n);
  G.emit('res', { key: 'tickets', delta: n, source });
}

/** Credit chips earned by playing since the last visit. Returns what was added (and why). */
export function syncChips(): { gained: number; tickets: number; parts: string[] } {
  const c = cs();
  const now = { vic: G.s.stats.victories ?? 0, kl: G.s.kl, boss: G.s.campaign?.bossesDefeated ?? 0, perf: G.s.stats.perfects ?? 0 };
  if (!c.sync) c.sync = { ...now };
  const d = {
    vic: Math.max(0, now.vic - c.sync.vic),
    kl: Math.max(0, now.kl - c.sync.kl),
    boss: Math.max(0, now.boss - c.sync.boss),
    perf: Math.max(0, now.perf - c.sync.perf),
  };
  c.sync = { ...now };
  const parts: string[] = [];
  let gained = 0;
  let tk = 0;
  if (!c.welcomed) {
    c.welcomed = true;
    gained += CHIPS.welcome;
    tk += CHIPS.welcomeTickets;
    parts.push(`Regalo de la casa: +${CHIPS.welcome} fichas y ${CHIPS.welcomeTickets} boletos`);
  }
  if (d.vic) {
    gained += d.vic * CHIPS.perVictory;
    // boletos: 1 every N victories (the remainder carries over in stats)
    const carry = (c.stats.vic_carry ?? 0) + d.vic;
    const t = Math.floor(carry / CHIPS.victoriesPerTicket);
    c.stats.vic_carry = carry - t * CHIPS.victoriesPerTicket;
    tk += t;
    parts.push(`${d.vic} victorias: +${d.vic * CHIPS.perVictory}${t ? ` y ${t} ${t === 1 ? 'boleto' : 'boletos'}` : ''}`);
  }
  if (d.perf) {
    gained += d.perf * CHIPS.perPerfect;
    parts.push(`${d.perf} perfectas: +${d.perf * CHIPS.perPerfect}`);
  }
  if (d.kl) {
    gained += d.kl * CHIPS.perKl;
    tk += d.kl * CHIPS.ticketsPerKl;
    parts.push(`${d.kl} niveles de Reino: +${d.kl * CHIPS.perKl} y ${d.kl * CHIPS.ticketsPerKl} ${d.kl * CHIPS.ticketsPerKl === 1 ? 'boleto' : 'boletos'}`);
  }
  if (d.boss) {
    gained += d.boss * CHIPS.perBoss;
    tk += d.boss * CHIPS.ticketsPerBoss;
    parts.push(`${d.boss} jefes: +${d.boss * CHIPS.perBoss} y ${d.boss * CHIPS.ticketsPerBoss} boletos`);
  }
  if (gained) {
    const real = addChips(gained, 'sync');
    if (real < gained) parts.push(real > 0 ? `La bandeja de fichas llegó al tope de ${CHIPS.cap}: entraron ${real}` : `Tu bandeja de fichas ya está en el tope de ${CHIPS.cap} (lo que ganes apostando no tiene tope)`);
    gained = real;
  }
  if (tk) addTickets(tk, 'welcome');
  return { gained, tickets: tk, parts };
}

/**
 * The casino (Mesa del Gato) is open: wakes mission E11 (MISSION_GATES → flag 'gambit_open').
 * Called when entering the casino; isla/orquestador can also call it when the Mesa unlocks (Jefe 1).
 */
export function ensureGambitOpen() {
  if (!G.has('gambit_open')) G.flag('gambit_open');
}

// ------------------------------------------------------------------ the casino can't be hidden any more (2026-10)
/** old device-wide hide flag (Ajustes › OCULTAR CASINO, removed): only read by the patch below to clean it up */
const OLD_HIDE_KEY = 'nolc-casino-hidden';

registerPatch({
  id: '2026-10-casino-siempre-visible',
  why: 'El casino ya no se puede ocultar (es parte de la historia y la vía rápida para alcanzar). Quien lo ocultó lo vuelve a ver.',
  run() {
    let hidden = false;
    try {
      hidden = localStorage.getItem(OLD_HIDE_KEY) === '1';
      localStorage.removeItem(OLD_HIDE_KEY);
    } catch {
      /* storage unavailable */
    }
    if (hidden) return 'El casino El Gato Negro volvió al menú de tu isla. Ya no se puede ocultar: ahí viven los gatos que se pierden entre mundos.';
  },
});

registerPatch({
  id: '2026-10-casino-boletos-de-reapertura',
  why: 'La economía de boletos se multiplicó (antes ~3 tiros por hora). Las partidas viejas reciben el regalo de bienvenida nuevo + boletos por las victorias que ya tenían.',
  run() {
    if ((G.s.campaign?.bossesDefeated ?? 0) < 1) return; // the casino isn't open yet: the welcome gift will do
    const c = cs();
    const extra = (c.welcomed ? CHIPS.welcomeTickets - 2 : 0) + Math.min(30, Math.floor((G.s.stats.victories ?? 0) / CHIPS.victoriesPerTicket));
    if (extra <= 0) return;
    addTickets(extra, 'patch');
    return `El casino reabrió con más dulces: te regalamos ${extra} boletos de invocación. Además ahora el Portal garantiza tu PRIMER LEGENDARIO en 20 tiros.`;
  },
});

// ------------------------------------------------------------------ stakes (balance.gambit)
export function income() {
  return Math.max(1, G.goldPerSec || 0);
}
export function foodIncome() {
  return Math.max(0.5, G.foodPerSec || 0);
}
export const MIN_GOLD_STAKE = 10;
/** 2 significant digits, rounded down ("nice" casino numbers) */
export function nice(n: number) {
  if (n < 10) return Math.max(1, Math.floor(n));
  const p = Math.pow(10, Math.floor(Math.log10(n)) - 1);
  return Math.floor(n / p) * p;
}
/** GDD 2.13: apuesta_max = min(180 s de ingreso, 25% de la cartera, 600 s de ingreso / multiplicador máx.) */
export function goldStakeCap(maxMult: number) {
  const g = BAL.gambit;
  const inc = income();
  const cap = Math.min(g.stake_cap_gold_seconds_of_income * inc, g.stake_cap_wallet_pct * G.s.gold, (g.max_payout_seconds_of_income * inc) / Math.max(1, maxMult));
  return nice(Math.max(MIN_GOLD_STAKE, cap));
}
/** gem bets: max `gem_bet_max` per bet, and 1 gem bet every 2 Reino levels (balance.gambit.gem_bets_per_level_up) */
export const GEM_PAYOUT_CAP = 30;
export function gemBetsLeft() {
  return Math.max(0, Math.floor(G.s.kl * BAL.gambit.gem_bets_per_level_up) - (cs().gemBets ?? 0));
}
export function gemStakeMax(mult: number) {
  return Math.max(1, Math.min(BAL.gambit.gem_bet_max, Math.floor(GEM_PAYOUT_CAP / mult)));
}
export function balanceOf(cur: Cur) {
  return cur === 'gold' ? G.s.gold : cur === 'gems' ? G.s.gems : chips();
}
export function canPay(cur: Cur, n: number) {
  if (cur === 'gems' && gemBetsLeft() <= 0) return false;
  return balanceOf(cur) >= n && n > 0;
}
export function payBet(cur: Cur, n: number) {
  if (cur === 'gold') G.add('gold', -n, 'casino');
  else if (cur === 'gems') {
    G.add('gems', -n, 'casino');
    cs().gemBets = (cs().gemBets ?? 0) + 1;
  } else addChips(-n, 'bet');
}
export function creditWin(cur: Cur, n: number) {
  if (n <= 0) return;
  if (cur === 'gold') G.add('gold', n, 'casino');
  else if (cur === 'gems') G.add('gems', n, 'casino');
  else addChips(n, 'win');
}

// ------------------------------------------------------------------ LA CASA TE DEBE (candy meter)
/** every losing bet fills the meter; when full the house pays you a boleto + fichas and it starts again */
export const CANDY = { every: 15, tickets: 1, chips: 15 } as const;
export function owed() {
  return cs().owed ?? 0;
}

/** saves are throttled while auto-play runs at TURBO (never later than ~1.5 s after the bet) */
let lastSave = 0;
let saveTimer: ReturnType<typeof setTimeout> | 0 = 0;
export function persist() {
  const now = Date.now();
  if (now - lastSave > 1500) {
    lastSave = now;
    G.save();
    return;
  }
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = 0;
    lastSave = Date.now();
    G.save();
  }, 1500);
}

export function recordBet(g: GameId, cur: Cur, stake: number, win: number, r: string, isWin = win > stake): Granted[] {
  const c = cs();
  c.hist!.unshift({ g, cur, stake, win, r });
  if (c.hist!.length > 40) c.hist!.length = 40;
  stat(`bets_${cur}`);
  stat(`staked_${cur}`, stake);
  stat(`won_${cur}`, win);
  const candy: Granted[] = [];
  if (isWin) {
    stat('wins');
    c.streak = Math.max(0, c.streak ?? 0) + 1;
    c.owed = 0;
  } else {
    stat('losses');
    c.streak = Math.min(0, c.streak ?? 0) - 1;
    c.owed = (c.owed ?? 0) + 1;
    if (c.owed >= CANDY.every) {
      c.owed = 0;
      stat('candy');
      candy.push(grantPrize({ kind: 'tickets', n: CANDY.tickets, tier: 'rare' }), grantPrize({ kind: 'chips', n: CANDY.chips, tier: 'common' }));
    }
  }
  stat(`spins_${g}`);
  // mission E11 (goal gambit_play → counter 'gambit')
  G.count('gambit');
  G.count('gambit_hands');
  G.count('casino_bets');
  // persist every bet (no reload-to-undo)
  persist();
  return candy;
}

/** "23 apuestas · 9 ganadas · −3%" (per currency) */
export function summary(cur: Cur) {
  const s = cs().stats;
  const bets = s[`bets_${cur}`] ?? 0;
  const staked = s[`staked_${cur}`] ?? 0;
  const won = s[`won_${cur}`] ?? 0;
  const wins = (cs().hist ?? []).filter((h) => h.cur === cur && h.win > h.stake).length;
  return { bets, staked, won, net: won - staked, pct: staked > 0 ? (won - staked) / staked : 0, recentWins: wins };
}

// ------------------------------------------------------------------ SLOT: "Tragamichis" (3 reels × 3 rows, 5 lines)
export type Sym = 'neko' | 'wild' | 'gema' | 'doblon' | 'boleto' | 'pez' | 'ovillo' | 'pata';
export const SYMS: Sym[] = ['neko', 'wild', 'gema', 'doblon', 'boleto', 'pez', 'ovillo', 'pata'];
export const SYM_NAME: Record<Sym, string> = {
  neko: 'GATO NEGRO',
  wild: 'COMODÍN',
  gema: 'OJO DE GATO',
  doblon: 'DOBLÓN',
  boleto: 'BOLETO',
  pez: 'PESCADITO',
  ovillo: 'ESTAMBRE',
  pata: 'PATITA',
};
/** symbols per strip (24 stops, same counts on every reel) */
export const SYM_COUNT: Record<Sym, number> = { neko: 2, wild: 2, gema: 2, doblon: 3, boleto: 2, pez: 4, ovillo: 4, pata: 5 };

/**
 * RISK TIERS (bet size ↔ variance). Same public strips; the paytable changes:
 *   BAJA  — every symbol pays (premio en 32% de las tiradas), gold RTP 95.3%, máx. x17.8
 *   MEDIA — PATITA no paga, el resto paga ~20% más (premio en 23%), gold RTP 96.2%, máx. x20.4
 *   ALTA  — PATITA y ESTAMBRE no pagan, el resto ~60% más (premio en 15%), gold RTP 97.3%, máx. x25.2
 * Bigger stake = more spins that give nothing, but bigger prizes and a slightly better return. The house still wins.
 */
export type SlotTier = 0 | 1 | 2;
export const SLOT_TIER_NAME = ['BAJA', 'MEDIA', 'ALTA'] as const;
export const SLOT_TIER_BLURB = ['Premios chicos y seguidos.', 'Menos premios, más gordos.', 'Casi nunca paga. Cuando paga, PAGA.'] as const;
export const PAYTABLES: { pay3: Record<Sym, number>; neko2: number }[] = [
  { pay3: { neko: 75, wild: 45, gema: 30, doblon: 24, boleto: 20, pez: 12, ovillo: 10, pata: 5 }, neko2: 4 },
  { pay3: { neko: 90, wild: 52, gema: 35, doblon: 28, boleto: 23, pez: 14, ovillo: 11, pata: 0 }, neko2: 5 },
  { pay3: { neko: 120, wild: 68, gema: 45, doblon: 36, boleto: 30, pez: 17, ovillo: 0, pata: 0 }, neko2: 0 },
];
/** legacy names (tier BAJA) */
export const PAY3 = PAYTABLES[0].pay3;
export const PAY2_NEKO = PAYTABLES[0].neko2;
/** row index on reels 1,2,3 for each payline */
export const LINES: [number, number, number][] = [
  [1, 1, 1],
  [0, 0, 0],
  [2, 2, 2],
  [0, 1, 2],
  [2, 1, 0],
];
export const STRIP_LEN = Object.values(SYM_COUNT).reduce((a, b) => a + b, 0);

function lcgShuffle<T>(list: T[], seed: number): T[] {
  let r = seed;
  const rnd = () => (r = (r * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
function mkStrip(seed: number): Sym[] {
  const list: Sym[] = [];
  for (const s of SYMS) for (let i = 0; i < SYM_COUNT[s]; i++) list.push(s);
  return lcgShuffle(list, seed);
}
/** fixed, public reel strips (shown in "Tira honesta") */
export const STRIPS: Sym[][] = [mkStrip(7), mkStrip(19), mkStrip(41)];

export interface LineWin {
  line: number;
  sym: Sym | 'neko2';
  /** line multiplier (of the line bet) */
  mult: number;
  /** which reels form the win (for highlighting) */
  cells: [number, number][];
}

export function gridAt(stops: number[]): Sym[][] {
  const N = STRIP_LEN;
  return stops.map((s, ri) => [STRIPS[ri][(s - 1 + N) % N], STRIPS[ri][s], STRIPS[ri][(s + 1) % N]]);
}

function lineResult(a: Sym, b: Sym, c: Sym, tier: SlotTier): { sym: Sym | 'neko2'; mult: number } | null {
  const pt = PAYTABLES[tier];
  const syms = [a, b, c];
  const nonW = syms.filter((s) => s !== 'wild');
  if (nonW.length === 0) return { sym: 'wild', mult: pt.pay3.wild };
  const base = nonW[0];
  if (base === 'neko') {
    if (syms.every((s) => s === 'neko')) return { sym: 'neko', mult: pt.pay3.neko };
  } else if (syms.every((s) => s === base || s === 'wild') && pt.pay3[base] > 0) return { sym: base, mult: pt.pay3[base] };
  if (a === 'neko' && b === 'neko' && pt.neko2 > 0) return { sym: 'neko2', mult: pt.neko2 };
  return null;
}

export function evalGrid(grid: Sym[][], tier: SlotTier = 0): LineWin[] {
  const out: LineWin[] = [];
  LINES.forEach((L, li) => {
    const r = lineResult(grid[0][L[0]], grid[1][L[1]], grid[2][L[2]], tier);
    if (!r) return;
    const cells: [number, number][] = r.sym === 'neko2' ? [[0, L[0]], [1, L[1]]] : [[0, L[0]], [1, L[1]], [2, L[2]]];
    out.push({ line: li, sym: r.sym, mult: r.mult, cells });
  });
  return out;
}

/** exact math by enumerating all 24³ stop combinations (≈14k per tier, a few ms) */
function slotMath(tier: SlotTier) {
  const N = STRIP_LEN;
  let tot = 0;
  let maxM = 0;
  let hits = 0;
  let wins = 0;
  const freq: Record<string, number> = {};
  for (let a = 0; a < N; a++)
    for (let b = 0; b < N; b++)
      for (let c = 0; c < N; c++) {
        const w = evalGrid(gridAt([a, b, c]), tier);
        const m = w.reduce((s, x) => s + x.mult, 0) / LINES.length;
        for (const x of w) freq[x.sym] = (freq[x.sym] ?? 0) + 1;
        tot += m;
        if (m > 0) hits++;
        if (m > 1) wins++;
        maxM = Math.max(maxM, m);
      }
  const T = N * N * N;
  const perSpin: Record<string, number> = {};
  for (const [k, v] of Object.entries(freq)) perSpin[k] = v / T;
  return { rtp: tot / T, maxM, hit: hits / T, win: wins / T, perSpin };
}
export const SLOT_MATH = [slotMath(0), slotMath(1), slotMath(2)];
/** legacy (tier BAJA) */
export const SLOT = SLOT_MATH[0];

/** chip spins cost a fixed amount per risk tier (no "min-bet farming" of special prizes) */
export const SLOT_CHIP_STAKES = [10, 30, 100] as const;
export const SLOT_CHIP_STAKE = SLOT_CHIP_STAKES[0];

export type PrizeKind = 'gold' | 'food' | 'gems' | 'tickets' | 'chips' | 'orbs' | 'prisma' | 'scrap' | 'blueprint' | 'crystal' | 'accessory' | 'cat';
export type PrizeTier = 'common' | 'rare' | 'epic' | 'legendary' | 'holo' | 'mythic';
export interface Prize {
  kind: PrizeKind;
  n: number;
  /** species (orbs/cat), element (crystal), accessory id */
  ref?: string;
  /** cat prize: holo foil variant */
  holo?: boolean;
  /** tier for presentation */
  tier?: PrizeTier;
}

/** what a winning line gives when playing with FICHAS, per risk tier (shown in the paytable) */
export const CHIP_LINE_PRIZE: Record<Sym | 'neko2', { text: string; tier: PrizeTier }>[] = [
  {
    neko: { text: 'GATO ÉPICO+ (25% HOLO)', tier: 'legendary' },
    wild: { text: '+100 FICHAS + ACCESORIO ÉPICO', tier: 'epic' },
    gema: { text: '+2 OJOS DE GATO', tier: 'epic' },
    doblon: { text: 'ORO (90 s de producción)', tier: 'rare' },
    boleto: { text: '+1 BOLETO DE INVOCACIÓN', tier: 'rare' },
    pez: { text: 'PESCADITOS (150 s)', tier: 'common' },
    ovillo: { text: 'ACCESORIO SORPRESA', tier: 'common' },
    pata: { text: '+10 FICHAS', tier: 'common' },
    neko2: { text: '+5 ORBES DE ALMA (gato al azar)', tier: 'common' },
  },
  {
    neko: { text: 'GATO LEGENDARIO+ (mítico 5%, 30% HOLO)', tier: 'legendary' },
    wild: { text: '+200 FICHAS + ACCESORIO ÉPICO', tier: 'epic' },
    gema: { text: '+6 OJOS DE GATO', tier: 'epic' },
    doblon: { text: 'ORO (5 min de producción)', tier: 'rare' },
    boleto: { text: '+3 BOLETOS', tier: 'rare' },
    pez: { text: '+1 BOLETO + PESCADITOS', tier: 'rare' },
    ovillo: { text: 'ACCESORIO RARO O MEJOR', tier: 'rare' },
    pata: { text: 'nada', tier: 'common' },
    neko2: { text: '+1 BOLETO + 10 ORBES', tier: 'rare' },
  },
  {
    neko: { text: 'GATO LEGENDARIO o MÍTICO (40% HOLO)', tier: 'mythic' },
    wild: { text: '+6 BOLETOS + ACCESORIO LEGENDARIO', tier: 'legendary' },
    gema: { text: '+20 OJOS DE GATO', tier: 'legendary' },
    doblon: { text: 'ORO (15 min de producción)', tier: 'epic' },
    boleto: { text: '+10 BOLETOS', tier: 'legendary' },
    pez: { text: '+3 BOLETOS', tier: 'epic' },
    ovillo: { text: 'nada', tier: 'common' },
    pata: { text: 'nada', tier: 'common' },
    neko2: { text: 'nada', tier: 'common' },
  },
];

function chipLinePrizes(sym: Sym | 'neko2', tier: SlotTier): Prize[] {
  if (tier === 0)
    switch (sym) {
      case 'neko':
        return [rollCatPrize(['epic', 'legendary'], [0.72, 0.28], 0.25, null, 0.5, true)];
      case 'wild':
        return [{ kind: 'chips', n: 100, tier: 'epic' }, accPrize('epic')];
      case 'gema':
        return [{ kind: 'gems', n: 2, tier: 'epic' }];
      case 'doblon':
        return [{ kind: 'gold', n: Math.round(90 * income()), tier: 'rare' }];
      case 'boleto':
        return [{ kind: 'tickets', n: 1, tier: 'rare' }];
      case 'pez':
        return [{ kind: 'food', n: Math.max(30, Math.round(150 * foodIncome())), tier: 'common' }];
      case 'ovillo':
        return [accPrize(weighted<AccRarity>(['common', 'rare', 'epic'], (r) => ({ common: 70, rare: 25, epic: 5, legendary: 0 })[r]))];
      case 'pata':
        return [{ kind: 'chips', n: 10, tier: 'common' }];
      case 'neko2':
        return [{ kind: 'orbs', n: 5, tier: 'common' }];
    }
  if (tier === 1)
    switch (sym) {
      case 'neko':
        return [rollCatPrize(['epic', 'legendary', 'mythic'], [0.35, 0.6, 0.05], 0.3, null, 0.5, true)];
      case 'wild':
        return [{ kind: 'chips', n: 200, tier: 'epic' }, accPrize('epic')];
      case 'gema':
        return [{ kind: 'gems', n: 6, tier: 'epic' }];
      case 'doblon':
        return [{ kind: 'gold', n: Math.round(300 * income()), tier: 'rare' }];
      case 'boleto':
        return [{ kind: 'tickets', n: 3, tier: 'rare' }];
      case 'pez':
        return [{ kind: 'tickets', n: 1, tier: 'rare' }, { kind: 'food', n: Math.max(60, Math.round(300 * foodIncome())), tier: 'common' }];
      case 'ovillo':
        return [accPrize(weighted<AccRarity>(['rare', 'epic', 'legendary'], (r) => ({ common: 0, rare: 70, epic: 25, legendary: 5 })[r]))];
      case 'neko2':
        return [{ kind: 'tickets', n: 1, tier: 'rare' }, { kind: 'orbs', n: 10, tier: 'common' }];
      default:
        return [];
    }
  switch (sym) {
    case 'neko':
      return [rollCatPrize(['legendary', 'mythic'], [0.8, 0.2], 0.4, null, 0.5, true)];
    case 'wild':
      return [{ kind: 'tickets', n: 6, tier: 'legendary' }, accPrize('legendary')];
    case 'gema':
      return [{ kind: 'gems', n: 20, tier: 'legendary' }];
    case 'doblon':
      return [{ kind: 'gold', n: Math.round(900 * income()), tier: 'epic' }];
    case 'boleto':
      return [{ kind: 'tickets', n: 10, tier: 'legendary' }];
    case 'pez':
      return [{ kind: 'tickets', n: 3, tier: 'epic' }];
    default:
      return [];
  }
}

/** stakes per risk tier: chips = fixed 10/30/100 · gold = ¼ / ½ / all of the tier's cap */
export function slotStakes(cur: Cur): number[] {
  if (cur === 'chips') return [...SLOT_CHIP_STAKES];
  if (cur === 'gems') return [];
  return SLOT_MATH.map((m, i) => {
    const cap = goldStakeCap(m.maxM);
    return nice(Math.max(MIN_GOLD_STAKE, i === 0 ? cap / 4 : i === 1 ? cap / 2 : cap));
  });
}

export interface SlotResult {
  cur: Cur;
  stake: number;
  tier: SlotTier;
  stops: number[];
  grid: Sym[][];
  wins: LineWin[];
  /** paid back in the bet currency (gold mode) or chips from chip prizes */
  payout: number;
  prizes: Prize[];
  granted: Granted[];
  /** LA CASA TE DEBE paid out on this spin */
  candy: Granted[];
  /** total multiplier of the stake (gold) */
  mult: number;
  jackpot: boolean;
}

export function spinSlot(cur: Cur, tier: SlotTier): SlotResult | null {
  if (cur === 'gems') return null;
  const stake = slotStakes(cur)[tier] ?? 0;
  if (!canPay(cur, stake)) return null;
  payBet(cur, stake);
  const stops = [randInt(STRIP_LEN), randInt(STRIP_LEN), randInt(STRIP_LEN)];
  const grid = gridAt(stops);
  const wins = evalGrid(grid, tier);
  const lineBet = stake / LINES.length;
  let payout = 0;
  const prizes: Prize[] = [];
  const mult = wins.reduce((s, w) => s + w.mult, 0) / LINES.length;
  if (cur === 'gold') {
    payout = Math.round(wins.reduce((s, w) => s + w.mult * lineBet, 0));
    creditWin('gold', payout);
  } else {
    for (const w of wins) prizes.push(...chipLinePrizes(w.sym, tier));
  }
  const granted = prizes.map(grantPrize);
  const jackpot = wins.some((w) => w.sym === 'neko');
  // chips value of chip prizes counts as "won" for the history
  const chipWon = granted.filter((g) => g.kind === 'chips').reduce((s, g) => s + g.n, 0);
  const won = cur === 'gold' ? payout : chipWon;
  const label = wins.length ? wins.map((w) => (w.sym === 'neko2' ? '2x GATO' : `3x ${SYM_NAME[w.sym as Sym]}`)).join(' + ') : 'NADA';
  const realPrize = granted.some((g) => g.kind !== 'chips') || won > stake;
  const candy = recordBet('slot', cur, stake, won, label, cur === 'gold' ? won > stake : realPrize);
  stat(`slot_tier${tier}`);
  if (jackpot) {
    stat('jackpots');
    G.count('casino_jackpots');
  }
  if (mult > (cs().stats.best_mult ?? 0)) cs().stats.best_mult = mult;
  return { cur, stake, tier, stops, grid, wins, payout: won, prizes, granted, candy, mult, jackpot };
}

// ------------------------------------------------------------------ ROULETTE: "Ruleta del Multiverso" (25 pockets)
/** wheel order (clockwise from the top); 0 = GATO NEGRO (green) */
export const WHEEL = [0, 17, 4, 21, 9, 14, 2, 23, 11, 6, 19, 1, 16, 8, 24, 13, 3, 20, 10, 15, 5, 22, 12, 7, 18];
export type PocketColor = 'red' | 'black' | 'green';
export function pocketColor(n: number): PocketColor {
  if (n === 0) return 'green';
  const i = WHEEL.indexOf(n);
  return i % 2 === 1 ? 'red' : 'black';
}
export type RouletteBet = { kind: 'color'; v: 'red' | 'black' } | { kind: 'third'; v: 0 | 1 | 2 } | { kind: 'num'; v: number };
/** payout multiplier (returns stake × mult on a win) — every bet has EV 0.96 */
export function betMult(b: RouletteBet): number {
  return b.kind === 'color' ? 2 : b.kind === 'third' ? 3 : 24;
}
export function betWins(b: RouletteBet, n: number): boolean {
  if (b.kind === 'color') return pocketColor(n) === b.v;
  if (b.kind === 'third') return n >= 1 + b.v * 8 && n <= 8 + b.v * 8;
  return n === b.v;
}
export function betChance(b: RouletteBet): number {
  return b.kind === 'color' ? 12 / 25 : b.kind === 'third' ? 8 / 25 : 1 / 25;
}
export function betLabel(b: RouletteBet): string {
  if (b.kind === 'color') return b.v === 'red' ? 'ROJO' : 'NEGRO';
  if (b.kind === 'third') return ['1–8', '9–16', '17–24'][b.v];
  return b.v === 0 ? 'GATO NEGRO (0)' : `NÚMERO ${b.v}`;
}
export const ROULETTE_CHIP_STAKES = [10, 25, 50, 100];
/** BONO PLENO: a NUMBER hit with fichas also pays boletos (1 per 25 fichas staked, rounded up) */
export function plenoTickets(cur: Cur, b: RouletteBet, stake: number) {
  return cur === 'chips' && b.kind === 'num' ? Math.ceil(stake / 25) : 0;
}
export function rouletteStakes(cur: Cur, b: RouletteBet): number[] {
  const m = betMult(b);
  if (cur === 'chips') return ROULETTE_CHIP_STAKES;
  if (cur === 'gems') {
    const mx = gemStakeMax(m);
    return Array.from({ length: mx }, (_, i) => i + 1);
  }
  const cap = goldStakeCap(m);
  return [...new Set([nice(Math.max(MIN_GOLD_STAKE, cap / 8)), nice(Math.max(MIN_GOLD_STAKE, cap / 4)), nice(Math.max(MIN_GOLD_STAKE, cap / 2)), cap])];
}
/**
 * Stake memory: the option to use for a remembered stake. Never resets to the minimum when the list changes
 * (ROJO ⇄ NEGRO, currency, a new cap): the largest option ≤ the remembered value, or the smallest one.
 */
export function stakeFor(options: readonly number[], remembered: number | undefined): number {
  if (!options.length) return 0;
  if (remembered === undefined) return options[0];
  let best = options[0];
  for (const o of options) if (o <= remembered + 1e-9) best = o;
  return best;
}

export interface RouletteResult {
  cur: Cur;
  stake: number;
  bet: RouletteBet;
  pocket: number;
  color: PocketColor;
  win: boolean;
  payout: number;
  /** BONO PLENO + LA CASA TE DEBE */
  bonus: Granted[];
}
export function spinRoulette(cur: Cur, bet: RouletteBet, stake: number): RouletteResult | null {
  if (cur === 'gems') stake = Math.min(stake, gemStakeMax(betMult(bet)));
  if (!canPay(cur, stake)) return null;
  payBet(cur, stake);
  const pocket = WHEEL[randInt(WHEEL.length)];
  const win = betWins(bet, pocket);
  const payout = win ? stake * betMult(bet) : 0;
  creditWin(cur, payout);
  const color = pocketColor(pocket);
  const bonus: Granted[] = [];
  const pt = win ? plenoTickets(cur, bet, stake) : 0;
  if (pt) bonus.push(grantPrize({ kind: 'tickets', n: pt, tier: 'epic' }));
  bonus.push(...recordBet('roulette', cur, stake, payout, `${pocket} ${color === 'red' ? 'ROJO' : color === 'black' ? 'NEGRO' : 'GATO'}`));
  return { cur, stake, bet, pocket, color, win, payout, bonus };
}

// ------------------------------------------------------------------ cat pool (shared with the gacha)
/** cats the casino can give: no secrets, no heroic rewards, boss cats only after that boss, elements discovered */
export function eligibleCats(): CatDef[] {
  const bosses = G.s.campaign?.bossesDefeated ?? 0;
  return CATS.filter((c) => {
    if (c.secret) return false;
    const src = c.obtain?.source ?? '';
    if (src.startsWith('heroic') || src.startsWith('podio') || c.rarity === 'heroic' || c.rarity === 'divine') return false;
    if (src.startsWith('boss:') && bosses < Number(src.split(':')[1])) return false;
    return c.elements.every((e) => G.s.elements.includes(e));
  });
}
/**
 * Portal-only extras (2026-10): Lumen (la Fotógrafa) lives in the portal now, and the MÍTICO tier can give
 * the mythics (heroic rewards and Sonata Prima) once you discovered their elements.
 */
export const GACHA_EXTRA = new Set(['s_lumen', 's_sonata', 'm_raijin', 'm_singular']);
export function gachaCats(): CatDef[] {
  const base = eligibleCats();
  for (const id of GACHA_EXTRA) {
    const c = CATS.find((x) => x.id === id);
    if (c && c.elements.every((e) => G.s.elements.includes(e))) base.push(c);
  }
  return base;
}
export function catsOfRarity(r: RarityId, gacha = false): CatDef[] {
  return (gacha ? gachaCats() : eligibleCats()).filter((c) => c.rarity === r);
}
/** cats you don't own weigh x3 (the casino wants your collection to grow) */
export const UNOWNED_WEIGHT = 3;
/** pick a cat of one of the rarities (falls back to the closest available rarity) */
export function rollCatDef(rarities: RarityId[], weights?: number[], featured?: string | null, featuredShare = 0.5, gacha = false): CatDef {
  const order: RarityId[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];
  const r = weights ? weighted(rarities, (x) => weights[rarities.indexOf(x)]) : pick(rarities);
  let list = catsOfRarity(r, gacha);
  let i = order.indexOf(r);
  while (!list.length && i > 0) list = catsOfRarity(order[--i], gacha);
  if (!list.length) list = gacha ? gachaCats() : eligibleCats();
  // featured rate-up: only inside the rarities THIS roll can give (2026-10 fix: the old "one step below" test was always
  // true for a higher-rarity featured cat, so the HOLO banner's épico entry handed out its featured LEGENDARY labelled as
  // épico — legendary pity not reset, beginner's luck not counted, printed odds wrong)
  if (featured && rand() < featuredShare) {
    const pool = gacha ? gachaCats() : eligibleCats();
    const f = pool.find((c) => c.id === featured && rarities.includes(c.rarity as RarityId));
    if (f) return f;
  }
  return weighted(list, (c) => (G.s.catdex[c.id] === 'registered' ? 1 : UNOWNED_WEIGHT));
}
export function rollCatPrize(rarities: RarityId[], weights: number[] | undefined, holoChance: number, featured?: string | null, featuredShare = 0.5, gacha = false): Prize {
  const def = rollCatDef(rarities, weights, featured, featuredShare, gacha);
  const holo = rand() < holoChance;
  return { kind: 'cat', n: 1, ref: def.id, holo, tier: holo ? 'holo' : (def.rarity as PrizeTier) };
}
export function accPrize(r: AccRarity): Prize {
  return { kind: 'accessory', n: 1, ref: rollAccessory(r, rand).id, tier: r };
}

// ------------------------------------------------------------------ granting
export interface Granted extends Prize {
  label: string;
  /** cat prizes */
  isNew?: boolean;
  orbs?: number;
  /** existing cat became holo */
  upgraded?: boolean;
  uid?: string;
}

const RES_NAME: Record<string, string> = {
  gold: 'ORO',
  food: 'PESCADITOS',
  gems: 'OJOS DE GATO',
  tickets: 'BOLETOS',
  chips: 'FICHAS',
  prisma: 'ORBE PRISMA',
  scrap: 'CHATARRA',
  blueprint: 'PLANOS',
};
function fmtN(n: number) {
  return n < 10000 ? Math.floor(n).toLocaleString('en-US') : n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : `${(n / 1e3).toFixed(1)}K`;
}

export function grantPrize(p: Prize): Granted {
  switch (p.kind) {
    case 'gold':
    case 'food':
    case 'gems':
    case 'prisma':
    case 'scrap':
    case 'blueprint':
      G.add(p.kind, p.n, 'casino');
      return { ...p, label: `+${fmtN(p.n)} ${RES_NAME[p.kind]}` };
    case 'tickets':
      addTickets(p.n, 'prize');
      return { ...p, label: `+${p.n} ${p.n === 1 ? 'BOLETO' : 'BOLETOS'}` };
    case 'chips': {
      const real = addChips(p.n, 'prize');
      return { ...p, n: real, label: `+${real} FICHAS` };
    }
    case 'crystal': {
      const el = p.ref ?? pick(G.s.elements);
      G.addCrystals(el, p.n);
      return { ...p, ref: el, label: `+${p.n} CRISTALES` };
    }
    case 'orbs': {
      const sp = p.ref ?? (G.s.cats.length ? pick(G.s.cats).species : 'c_canelo');
      G.addOrbs(sp, p.n);
      return { ...p, ref: sp, label: `+${p.n} ORBES DE ${catDef(sp).name.toUpperCase()}` };
    }
    case 'accessory': {
      const id = p.ref ?? rollAccessory('common', rand).id;
      addAccessory(id, p.n);
      return { ...p, ref: id, label: `${(ACC_BY_ID.get(id)?.name ?? id).toUpperCase()}` };
    }
    case 'cat':
      return grantCat(p);
  }
}

function grantCat(p: Prize): Granted {
  const species = p.ref ?? 'c_canelo';
  const def = catDef(species);
  const owned = G.s.cats.find((c) => c.species === species);
  stat('cats_won');
  G.count('casino_cats');
  if (p.holo) {
    stat('holo');
    G.count('holo_cats');
    if (!owned) {
      const r = adopt(species);
      if (r.cat) r.cat.holo = true;
      G.recalc();
      return { ...p, isNew: r.isNew, orbs: 0, uid: r.cat?.uid, label: `${def.name.toUpperCase()} HOLO` };
    }
    if (!owned.holo) {
      owned.holo = true;
      G.recalc();
      G.emit('changed', undefined);
      return { ...p, isNew: false, upgraded: true, orbs: 0, uid: owned.uid, label: `${def.name.toUpperCase()} AHORA ES HOLO` };
    }
  }
  const r = adopt(species);
  return { ...p, holo: false, isNew: r.isNew, orbs: r.orbs, uid: r.cat?.uid ?? owned?.uid, label: r.isNew ? `¡${def.name.toUpperCase()}!` : `${def.name.toUpperCase()} · +${r.orbs} ORBES` };
}

// ------------------------------------------------------------------ LA CAJA (prize counter): fichas → premios fijos
export interface CajaItem {
  id: string;
  name: string;
  cost: number;
  desc: string;
  prize: () => Prize;
}
export const CAJA: CajaItem[] = [
  { id: 'food', name: 'Bolsa de Pescaditos', cost: 30, desc: '3 minutos de tu producción de comida.', prize: () => ({ kind: 'food', n: Math.max(60, Math.round(180 * foodIncome())), tier: 'common' }) },
  { id: 'orbs', name: 'Orbes de Alma x10', cost: 45, desc: 'Para el gato que elijas al azar de tu isla.', prize: () => ({ kind: 'orbs', n: 10, tier: 'common' }) },
  { id: 'prisma', name: 'Orbe Prisma', cost: 70, desc: 'Comodín: vale por un orbe de cualquier especie.', prize: () => ({ kind: 'prisma', n: 1, tier: 'rare' }) },
  { id: 'acc', name: 'Accesorio Sorpresa', cost: 110, desc: '60% común · 30% raro · 9% épico · 1% legendario.', prize: () => accPrize(weighted<AccRarity>(['common', 'rare', 'epic', 'legendary'], (r) => ({ common: 60, rare: 30, epic: 9, legendary: 1 })[r])) },
  { id: 'ticket', name: 'Boleto de Invocación', cost: 60, desc: 'Un tiro en cualquier portal del gacha.', prize: () => ({ kind: 'tickets', n: 1, tier: 'rare' }) },
  { id: 'tickets5', name: 'Fajo de 5 Boletos', cost: 280, desc: 'Cinco tiros. Sale más barato que de uno en uno.', prize: () => ({ kind: 'tickets', n: 5, tier: 'epic' }) },
  { id: 'cat', name: 'Gato Misterioso', cost: 500, desc: '60% raro · 30% épico · 10% legendario. 8% HOLO.', prize: () => rollCatPrize(['rare', 'epic', 'legendary'], [0.6, 0.3, 0.1], 0.08, null, 0.5, true) },
];
export function buyCaja(id: string): Granted | null {
  const it = CAJA.find((x) => x.id === id);
  if (!it || chips() < it.cost) return null;
  addChips(-it.cost, 'caja');
  stat('caja_buys');
  const g = grantPrize(it.prize());
  cs().hist!.unshift({ g: 'caja', cur: 'chips', stake: it.cost, win: 0, r: it.name.toUpperCase() });
  if (cs().hist!.length > 40) cs().hist!.length = 40;
  return g;
}

// wake E11 when the Mesa unlocks (Jefe 1), not only on the first visit
G.tickers.push(() => {
  if (G.s.campaign.bossesDefeated >= 1 && !G.has('gambit_open')) ensureGambitOpen();
});
