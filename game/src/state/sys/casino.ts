/**
 * Casino "El Gato Negro" (casino agent): Fichas, Boletos, honest slot machine + roulette, prize granting.
 *
 * Ethics (GDD 2.13 + 05 §7, user feedback):
 *  - only in-game currency; gems are earned playing; nothing is sold for real money.
 *  - every probability / payout is visible BEFORE betting; RTP is computed exactly from the reel strips.
 *  - reels are independent and uniform over their strips (no weighted "virtual reels", no fabricated near-misses);
 *    the symbols shown above/below the line are the real strip neighbours.
 *  - gold bets: EV < 1 (slot ≈ 95%, roulette 96%), stake capped by income (balance.gambit) so a single
 *    payout never exceeds `max_payout_seconds_of_income`.
 *  - special prizes (tickets, accessories, cats) only come from FICHAS, which are earned by playing (bounded).
 *  - no auto-spin; net balance history always visible; can be hidden (isCasinoHidden / setCasinoHidden).
 */
import { G } from '../game';
import { BAL, RarityId } from '../econ';
import { CATS, CatDef, catDef } from '../../data/content';
import { adopt } from './cats';
import { ACC_BY_ID, AccRarity, addAccessory, rollAccessory } from './accessories';

export type Cur = 'gold' | 'gems' | 'chips';
export type GameId = 'slot' | 'roulette' | 'gacha' | 'caja';

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
  return c;
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
/** Not simulated (GDD §9 #24): chip income is tied to playing, never to the calendar. */
export const CHIPS = {
  welcome: 100,
  welcomeTickets: 2,
  perVictory: 5,
  perPerfect: 3,
  perKl: 20,
  perBoss: 50,
  cap: 999,
} as const;

export function chips() {
  return cs().chips ?? 0;
}
export function tickets() {
  return cs().tickets ?? 0;
}
export function addChips(n: number, source = 'casino') {
  if (!n) return;
  const c = cs();
  c.chips = Math.max(0, Math.min(CHIPS.cap, (c.chips ?? 0) + n));
  G.emit('res', { key: 'chips', delta: n, source });
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
    parts.push(`${d.vic} victorias: +${d.vic * CHIPS.perVictory}`);
  }
  if (d.perf) {
    gained += d.perf * CHIPS.perPerfect;
    parts.push(`${d.perf} perfectas: +${d.perf * CHIPS.perPerfect}`);
  }
  if (d.kl) {
    gained += d.kl * CHIPS.perKl;
    parts.push(`${d.kl} niveles de Reino: +${d.kl * CHIPS.perKl}`);
  }
  if (d.boss) {
    gained += d.boss * CHIPS.perBoss;
    parts.push(`${d.boss} jefes: +${d.boss * CHIPS.perBoss}`);
  }
  if (gained) addChips(gained, 'sync');
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

// ------------------------------------------------------------------ hide toggle (device-wide, like Ajustes)
const HIDE_KEY = 'nolc-casino-hidden';
export function isCasinoHidden(): boolean {
  try {
    return localStorage.getItem(HIDE_KEY) === '1';
  } catch {
    return false;
  }
}
export function setCasinoHidden(v: boolean) {
  // GDD 2.13: hiding the table auto-completes its missions (E11 counts 'gambit')
  if (v && !(G.s.counters.gambit > 0)) G.count('gambit');
  try {
    if (v) localStorage.setItem(HIDE_KEY, '1');
    else localStorage.removeItem(HIDE_KEY);
  } catch {
    /* storage unavailable */
  }
  G.emit('changed', undefined);
}

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
function pay(cur: Cur, n: number) {
  if (cur === 'gold') G.add('gold', -n, 'casino');
  else if (cur === 'gems') {
    G.add('gems', -n, 'casino');
    cs().gemBets = (cs().gemBets ?? 0) + 1;
  } else addChips(-n, 'bet');
}
function credit(cur: Cur, n: number) {
  if (n <= 0) return;
  if (cur === 'gold') G.add('gold', n, 'casino');
  else if (cur === 'gems') G.add('gems', n, 'casino');
  else addChips(n, 'win');
}

function record(g: GameId, cur: Cur, stake: number, win: number, r: string, isWin = win > stake) {
  const c = cs();
  c.hist!.unshift({ g, cur, stake, win, r });
  if (c.hist!.length > 40) c.hist!.length = 40;
  stat(`bets_${cur}`);
  stat(`staked_${cur}`, stake);
  stat(`won_${cur}`, win);
  if (isWin) {
    stat('wins');
    c.streak = Math.max(0, c.streak ?? 0) + 1;
  } else {
    stat('losses');
    c.streak = Math.min(0, c.streak ?? 0) - 1;
  }
  stat(`spins_${g}`);
  // mission E11 (goal gambit_play → counter 'gambit')
  G.count('gambit');
  G.count('gambit_hands');
  G.count('casino_bets');
  // persist every bet right away (no reload-to-undo)
  G.save();
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
/** line pays as multiples of the LINE bet (stake / 5) for 3 in a line; COMODÍN substitutes for all but GATO NEGRO */
export const PAY3: Record<Sym, number> = { neko: 75, wild: 45, gema: 30, doblon: 24, boleto: 20, pez: 12, ovillo: 10, pata: 5 };
/** GATO NEGRO + GATO NEGRO on reels 1–2 (third reel anything else) */
export const PAY2_NEKO = 4;
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

function lineResult(a: Sym, b: Sym, c: Sym): { sym: Sym | 'neko2'; mult: number } | null {
  const syms = [a, b, c];
  const nonW = syms.filter((s) => s !== 'wild');
  if (nonW.length === 0) return { sym: 'wild', mult: PAY3.wild };
  const base = nonW[0];
  if (base === 'neko') {
    if (syms.every((s) => s === 'neko')) return { sym: 'neko', mult: PAY3.neko };
  } else if (syms.every((s) => s === base || s === 'wild')) return { sym: base, mult: PAY3[base] };
  if (a === 'neko' && b === 'neko') return { sym: 'neko2', mult: PAY2_NEKO };
  return null;
}

export function evalGrid(grid: Sym[][]): LineWin[] {
  const out: LineWin[] = [];
  LINES.forEach((L, li) => {
    const r = lineResult(grid[0][L[0]], grid[1][L[1]], grid[2][L[2]]);
    if (!r) return;
    const cells: [number, number][] = r.sym === 'neko2' ? [[0, L[0]], [1, L[1]]] : [[0, L[0]], [1, L[1]], [2, L[2]]];
    out.push({ line: li, sym: r.sym, mult: r.mult, cells });
  });
  return out;
}

/** exact math by enumerating all 24³ stop combinations (≈14k, a few ms) */
function slotMath() {
  const N = STRIP_LEN;
  let tot = 0;
  let maxM = 0;
  let hits = 0;
  let wins = 0;
  const freq: Record<string, number> = {};
  for (let a = 0; a < N; a++)
    for (let b = 0; b < N; b++)
      for (let c = 0; c < N; c++) {
        const w = evalGrid(gridAt([a, b, c]));
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
export const SLOT = slotMath();

/** chip spins cost a fixed amount (no "min-bet farming" of special prizes) */
export const SLOT_CHIP_STAKE = 10;

export type PrizeKind = 'gold' | 'food' | 'gems' | 'tickets' | 'chips' | 'orbs' | 'prisma' | 'scrap' | 'blueprint' | 'crystal' | 'accessory' | 'cat';
export interface Prize {
  kind: PrizeKind;
  n: number;
  /** species (orbs/cat), element (crystal), accessory id */
  ref?: string;
  /** cat prize: holo foil variant */
  holo?: boolean;
  /** tier for presentation */
  tier?: 'common' | 'rare' | 'epic' | 'legendary' | 'holo';
}

/** what a winning line gives when playing with FICHAS (shown in the paytable) */
export const CHIP_LINE_PRIZE: Record<Sym | 'neko2', { text: string; tier: Prize['tier'] }> = {
  neko: { text: 'GATO ÉPICO+ (25% HOLO)', tier: 'legendary' },
  wild: { text: '+100 FICHAS + ACCESORIO ÉPICO', tier: 'epic' },
  gema: { text: '+2 OJOS DE GATO', tier: 'epic' },
  doblon: { text: 'ORO (90 s de producción)', tier: 'rare' },
  boleto: { text: '+1 BOLETO DE INVOCACIÓN', tier: 'rare' },
  pez: { text: 'PESCADITOS (150 s)', tier: 'common' },
  ovillo: { text: 'ACCESORIO SORPRESA', tier: 'common' },
  pata: { text: '+10 FICHAS', tier: 'common' },
  neko2: { text: '+5 ORBES DE ALMA (gato al azar)', tier: 'common' },
};

function chipLinePrizes(sym: Sym | 'neko2'): Prize[] {
  switch (sym) {
    case 'neko':
      return [rollCatPrize(['epic', 'legendary'], [0.72, 0.28], 0.25)];
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
}

export function slotStakes(cur: Cur): number[] {
  if (cur === 'chips') return [SLOT_CHIP_STAKE];
  if (cur === 'gems') return [];
  const cap = goldStakeCap(SLOT.maxM);
  return [...new Set([nice(Math.max(MIN_GOLD_STAKE, cap / 4)), nice(Math.max(MIN_GOLD_STAKE, cap / 2)), cap])];
}

export interface SlotResult {
  cur: Cur;
  stake: number;
  stops: number[];
  grid: Sym[][];
  wins: LineWin[];
  /** paid back in the bet currency (gold mode) or chips from chip prizes */
  payout: number;
  prizes: Prize[];
  granted: Granted[];
  /** total multiplier of the stake (gold) */
  mult: number;
  jackpot: boolean;
}

export function spinSlot(cur: Cur, stake: number): SlotResult | null {
  if (cur === 'gems') return null;
  if (cur === 'chips') stake = SLOT_CHIP_STAKE;
  if (!canPay(cur, stake)) return null;
  pay(cur, stake);
  const stops = [randInt(STRIP_LEN), randInt(STRIP_LEN), randInt(STRIP_LEN)];
  const grid = gridAt(stops);
  const wins = evalGrid(grid);
  const lineBet = stake / LINES.length;
  let payout = 0;
  const prizes: Prize[] = [];
  const mult = wins.reduce((s, w) => s + w.mult, 0) / LINES.length;
  if (cur === 'gold') {
    payout = Math.round(wins.reduce((s, w) => s + w.mult * lineBet, 0));
    credit('gold', payout);
  } else {
    for (const w of wins) prizes.push(...chipLinePrizes(w.sym));
  }
  const granted = prizes.map(grantPrize);
  const jackpot = wins.some((w) => w.sym === 'neko');
  // chips value of chip prizes counts as "won" for the history
  const chipWon = granted.filter((g) => g.kind === 'chips').reduce((s, g) => s + g.n, 0);
  const won = cur === 'gold' ? payout : chipWon;
  const label = wins.length ? wins.map((w) => (w.sym === 'neko2' ? '2x GATO' : `3x ${SYM_NAME[w.sym as Sym]}`)).join(' + ') : 'NADA';
  const realPrize = granted.some((g) => g.kind !== 'chips') || won > stake;
  record('slot', cur, stake, won, label, cur === 'gold' ? won > stake : realPrize);
  if (jackpot) {
    stat('jackpots');
    G.count('casino_jackpots');
  }
  if (mult > (cs().stats.best_mult ?? 0)) cs().stats.best_mult = mult;
  return { cur, stake, stops, grid, wins, payout: won, prizes, granted, mult, jackpot };
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
export const ROULETTE_CHIP_STAKES = [10, 25, 50];
export function rouletteStakes(cur: Cur, b: RouletteBet): number[] {
  const m = betMult(b);
  if (cur === 'chips') return ROULETTE_CHIP_STAKES;
  if (cur === 'gems') {
    const mx = gemStakeMax(m);
    return Array.from({ length: mx }, (_, i) => i + 1);
  }
  const cap = goldStakeCap(m);
  return [...new Set([nice(Math.max(MIN_GOLD_STAKE, cap / 4)), nice(Math.max(MIN_GOLD_STAKE, cap / 2)), cap])];
}

export interface RouletteResult {
  cur: Cur;
  stake: number;
  bet: RouletteBet;
  pocket: number;
  color: PocketColor;
  win: boolean;
  payout: number;
}
export function spinRoulette(cur: Cur, bet: RouletteBet, stake: number): RouletteResult | null {
  if (cur === 'gems') stake = Math.min(stake, gemStakeMax(betMult(bet)));
  if (!canPay(cur, stake)) return null;
  pay(cur, stake);
  const pocket = WHEEL[randInt(WHEEL.length)];
  const win = betWins(bet, pocket);
  const payout = win ? stake * betMult(bet) : 0;
  credit(cur, payout);
  const color = pocketColor(pocket);
  record('roulette', cur, stake, payout, `${pocket} ${color === 'red' ? 'ROJO' : color === 'black' ? 'NEGRO' : 'GATO'}`);
  return { cur, stake, bet, pocket, color, win, payout };
}

// ------------------------------------------------------------------ cat pool (shared with the gacha)
/** cats the casino/gacha can give: no secrets, no heroic rewards, boss cats only after that boss, elements discovered */
export function eligibleCats(): CatDef[] {
  const bosses = G.s.campaign?.bossesDefeated ?? 0;
  return CATS.filter((c) => {
    if (c.secret) return false;
    const src = c.obtain?.source ?? '';
    if (src.startsWith('heroic')) return false;
    if (src.startsWith('boss:') && bosses < Number(src.split(':')[1])) return false;
    return c.elements.every((e) => G.s.elements.includes(e));
  });
}
export function catsOfRarity(r: RarityId): CatDef[] {
  return eligibleCats().filter((c) => c.rarity === r);
}
/** pick a cat of one of the rarities (falls back to the closest available rarity) */
export function rollCatDef(rarities: RarityId[], weights?: number[], featured?: string | null, featuredShare = 0.5): CatDef {
  const order: RarityId[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];
  let r = weights ? weighted(rarities, (x) => weights[rarities.indexOf(x)]) : pick(rarities);
  let list = catsOfRarity(r);
  let i = order.indexOf(r);
  while (!list.length && i > 0) list = catsOfRarity(order[--i]);
  if (!list.length) list = eligibleCats();
  if (featured && rand() < featuredShare) {
    const f = list.find((c) => c.id === featured) ?? eligibleCats().find((c) => c.id === featured && order.indexOf(c.rarity) >= order.indexOf(r) - 1);
    if (f) return f;
  }
  r = list[0].rarity;
  return pick(list);
}
export function rollCatPrize(rarities: RarityId[], weights: number[] | undefined, holoChance: number, featured?: string | null): Prize {
  const def = rollCatDef(rarities, weights, featured);
  const holo = rand() < holoChance;
  return { kind: 'cat', n: 1, ref: def.id, holo, tier: holo ? 'holo' : (def.rarity as Prize['tier']) };
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
    case 'chips':
      addChips(p.n, 'prize');
      return { ...p, label: `+${p.n} FICHAS` };
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
  { id: 'ticket', name: 'Boleto de Invocación', cost: 150, desc: 'Un tiro en cualquier portal del gacha.', prize: () => ({ kind: 'tickets', n: 1, tier: 'rare' }) },
  { id: 'cat', name: 'Gato Misterioso', cost: 800, desc: '70% raro · 25% épico · 5% legendario. 5% HOLO.', prize: () => rollCatPrize(['rare', 'epic', 'legendary'], [0.7, 0.25, 0.05], 0.05) },
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
  if (G.s.campaign.bossesDefeated >= 1 && !G.has('gambit_open') && !isCasinoHidden()) ensureGambitOpen();
});
