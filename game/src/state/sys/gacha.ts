/**
 * Gacha "Portal del Multiverso" (casino agent): banners with visible odds, pity ramps and the CANDY DIRECTOR.
 *
 * Counters (G.s.casino.pity, per banner):
 *   `${id}:e`   pulls since the last ÉPICO+            → guaranteed every `epicPity`
 *   `${id}:l`   pulls since the last LEGENDARIO+       → soft ramp after `softPity`, guaranteed at `hardPity`
 *   `${id}:m`   pulls since the last MÍTICO            → guaranteed at `mythicPity` (cat banners)
 *   `${id}:c`   pulls since the last CAT               → a cat at least every `catPity` pulls
 *   `${id}:hot` pulls left in the RACHA CALIENTE window (legendary+ x3, épico x1.5)
 *   `${id}:esc` pulls since the last "¡SE ESCAPÓ!"     → escapes have a cooldown
 *
 * Candy director ("la casa siempre gana, pero te da dulces") — every rule is REAL and printed in the odds panel:
 *   1. SUERTE DE PRINCIPIANTE: until you pull your first LEGENDARIO+ (stats.gacha_legends = 0) the ramp starts at
 *      pull 9 and the hard guarantee is pull 20 (instead of 24 / 40 on the Portal Michi).
 *   2. ¡SE ESCAPÓ UN LEGENDARIO!: a pull that is not legendary+ has `ESCAPE.p` to show a legendary that runs away.
 *      It leaves a RASTRO: +`ESCAPE.trail` on the legendary counter and a RACHA CALIENTE of `ESCAPE.hot` pulls.
 *      Cooldown `ESCAPE.cooldown` pulls, so the candy comes in waves and then dries up again.
 *   3. Soft pity ramps long before the hard pity; mythic has its own (long) guarantee.
 *   4. Cats you DON'T own weigh x3 in every cat roll; Lumen (la Fotógrafa) has a rate-up while you don't have her.
 *   5. RISK MODES (cat banners): ALTO RIESGO (3 boletos) and TODO O NADA (10): far higher legendary/mythic odds,
 *      but most of the time you get only a consolation. They count as 3 / 10 pulls for the LEGENDARY and MÍTICO
 *      guarantees (the ones they honour). The ÉPICO guarantee is not part of their fixed odds, so a risk pull moves
 *      that counter by 1, like any pull (2026-10 fix: it moved by 3 / 10 and turned the next normal pull into a
 *      surprise guaranteed épico that the odds panel never mentioned).
 * Pulls cost Boletos (earned playing / La Caja / Tragamichis) or Ojos de Gato. No real money anywhere.
 * Rewards are granted the moment you pull (the animation only presents them).
 */
import { G } from '../game';
import { RarityId } from '../econ';
import { catDef } from '../../data/content';
import { AccRarity } from './accessories';
import { Granted, Prize, accPrize, catsOfRarity, cs, foodIncome, gachaCats, grantPrize, income, rand, rollCatPrize, weighted, addTickets } from './casino';

export type Tier = 'common' | 'rare' | 'epic' | 'legendary' | 'holo' | 'mythic';
/** rank order (index ≥ 3 = "legendario o mejor") */
export const TIER_ORDER: Tier[] = ['common', 'rare', 'epic', 'legendary', 'holo', 'mythic'];
export const TIER_NAME: Record<Tier, string> = { common: 'COMÚN', rare: 'RARO', epic: 'ÉPICO', legendary: 'LEGENDARIO', holo: 'HOLO', mythic: 'MÍTICO' };
export const rankOf = (t: Tier) => TIER_ORDER.indexOf(t);

interface Entry {
  w: number;
  label: string;
  /** rarities this cat entry can give: the banner's featured cat only appears here if its rarity is one of them */
  feat?: RarityId[];
  make: (featured: string | null) => Prize;
  /** this entry gives a cat (for the cat guarantee) */
  cat?: boolean;
}

export interface Banner {
  id: string;
  name: string;
  kicker: string;
  tagline: string;
  /** gems per single pull (x10 = 9 × this) */
  gems: number;
  tiers: Record<Tier, number>;
  table: Record<Tier, Entry[]>;
  /** pulls since ÉPICO+ that guarantee one */
  epicPity: number;
  /** soft pity start / hard pity for LEGENDARIO+ */
  softPity: number;
  hardPity: number;
  /** +probability per pull past softPity */
  softStep: number;
  /** guaranteed MÍTICO (0 = none) */
  mythicPity: number;
  /** a cat at least every N pulls (0 = none) */
  catPity: number;
  accent: number;
  accent2: number;
  hasCats: boolean;
}

/** the photographer (s_lumen): rate-up inside LEGENDARIO cat rolls while you don't own her */
export const LUMEN = 's_lumen';
export const LUMEN_SHARE = 0.35;
/** beginner's luck (only until your first LEGENDARIO+ from the portal) */
export const BEGINNER = { softPity: 8, hardPity: 20 };
/** "¡se nos escapó un legendario!" */
export const ESCAPE = { p: 0.05, trail: 5, hot: 5, cooldown: 10 };
/** RACHA CALIENTE multipliers */
export const HOT = { legend: 2.5, epic: 1.5 };

const sec = (s: number) => Math.round(s * income());
const fsec = (s: number) => Math.max(30, Math.round(s * foodIncome()));
const lumenFeatured = () => (G.s.catdex[LUMEN] === 'registered' ? null : LUMEN);
const cat =
  (rar: RarityId[], w: number[], holo = 0, featuredOn: 'banner' | 'lumen' | false = false) =>
  (f: string | null) =>
    rollCatPrize(rar, w, holo, featuredOn === 'banner' ? f : featuredOn === 'lumen' ? lumenFeatured() : null, featuredOn === 'lumen' ? LUMEN_SHARE : 0.5, true);
const acc = (r: AccRarity) => () => accPrize(r);
/** MÍTICO: a mythic cat you can field (elements discovered); if none exists for you yet, a LEGENDARIO HOLO */
const mythicCat = (): Prize => {
  if (catsOfRarity('mythic', true).length) return rollCatPrize(['mythic'], undefined, 0.15, null, 0.5, true);
  return rollCatPrize(['legendary'], undefined, 1, lumenFeatured(), LUMEN_SHARE, true);
};
const MYTHIC_ENTRY: Entry[] = [{ w: 100, label: 'Gato MÍTICO (o legendario HOLO)', make: mythicCat, cat: true }];

export const BANNERS: Banner[] = [
  {
    id: 'michi',
    name: 'PORTAL MICHI',
    kicker: 'ESTÁNDAR · SIEMPRE ABIERTO',
    tagline: 'Gatos, materiales y accesorios. Épico cada 8, legendario a más tardar en 40. Lumen ronda por aquí.',
    gems: 6,
    tiers: { common: 0.518, rare: 0.31, epic: 0.14, legendary: 0.025, holo: 0.004, mythic: 0.003 },
    table: {
      common: [
        { w: 25, label: 'Pescaditos (2 min)', make: () => ({ kind: 'food', n: fsec(120), tier: 'common' }) },
        { w: 20, label: 'Oro (2 min)', make: () => ({ kind: 'gold', n: sec(120), tier: 'common' }) },
        { w: 20, label: '6 Orbes de Alma', make: () => ({ kind: 'orbs', n: 6, tier: 'common' }) },
        { w: 15, label: '25 Fichas', make: () => ({ kind: 'chips', n: 25, tier: 'common' }) },
        { w: 10, label: '4 Chatarra', make: () => ({ kind: 'scrap', n: 4, tier: 'common' }) },
        { w: 10, label: 'Accesorio común', make: acc('common') },
      ],
      rare: [
        { w: 45, label: 'Gato común o raro', make: cat(['common', 'rare'], [0.45, 0.55]), cat: true },
        { w: 18, label: 'Accesorio raro', make: acc('rare') },
        { w: 13, label: '1 Plano', make: () => ({ kind: 'blueprint', n: 1, tier: 'rare' }) },
        { w: 14, label: '3 Cristales', make: () => ({ kind: 'crystal', n: 3, tier: 'rare' }) },
        { w: 10, label: '1 Orbe Prisma', make: () => ({ kind: 'prisma', n: 1, tier: 'rare' }) },
      ],
      epic: [
        { w: 60, label: 'Gato raro o épico', make: cat(['rare', 'epic'], [0.45, 0.55]), cat: true },
        { w: 16, label: 'Accesorio épico', make: acc('epic') },
        { w: 12, label: '3 Orbes Prisma', make: () => ({ kind: 'prisma', n: 3, tier: 'epic' }) },
        { w: 12, label: '5 Ojos de Gato', make: () => ({ kind: 'gems', n: 5, tier: 'epic' }) },
      ],
      legendary: [
        { w: 80, label: 'Gato LEGENDARIO (Lumen 35%)', make: cat(['legendary'], [1], 0, 'lumen'), cat: true },
        { w: 20, label: 'Accesorio legendario', make: acc('legendary') },
      ],
      holo: [{ w: 100, label: 'Gato HOLO (épico+, súper roto)', make: cat(['epic', 'legendary'], [0.55, 0.45], 1, 'lumen'), cat: true }],
      mythic: MYTHIC_ENTRY,
    },
    epicPity: 8,
    softPity: 24,
    hardPity: 40,
    softStep: 0.06,
    mythicPity: 160,
    catPity: 6,
    accent: 0xff2e88,
    accent2: 0x00e5ff,
    hasCats: true,
  },
  {
    id: 'holo',
    name: 'MULTIVERSO HOLO',
    kicker: 'DESTACADO · CAMBIA CON TU REINO',
    tagline: 'El gato destacado sale la mitad de las veces. HOLO al 1.5%. Legendario a más tardar en 36.',
    gems: 8,
    tiers: { common: 0.48, rare: 0.32, epic: 0.15, legendary: 0.03, holo: 0.015, mythic: 0.005 },
    table: {
      common: [
        { w: 30, label: 'Pescaditos (2 min)', make: () => ({ kind: 'food', n: fsec(120), tier: 'common' }) },
        { w: 25, label: 'Oro (2 min)', make: () => ({ kind: 'gold', n: sec(120), tier: 'common' }) },
        { w: 25, label: '8 Orbes de Alma', make: () => ({ kind: 'orbs', n: 8, tier: 'common' }) },
        { w: 20, label: '30 Fichas', make: () => ({ kind: 'chips', n: 30, tier: 'common' }) },
      ],
      rare: [
        { w: 60, label: 'Gato común o raro', make: cat(['common', 'rare'], [0.4, 0.6]), cat: true },
        { w: 18, label: 'Accesorio raro', make: acc('rare') },
        { w: 22, label: '1 Orbe Prisma', make: () => ({ kind: 'prisma', n: 1, tier: 'rare' }) },
      ],
      epic: [
        { w: 75, label: 'Gato raro o épico (destacado 50%)', make: cat(['rare', 'epic'], [0.45, 0.55], 0, 'banner'), cat: true, feat: ['rare', 'epic'] },
        { w: 25, label: 'Accesorio épico', make: acc('epic') },
      ],
      legendary: [
        { w: 85, label: 'Gato épico o legendario (destacado 50%)', make: cat(['epic', 'legendary'], [0.35, 0.65], 0, 'banner'), cat: true, feat: ['epic', 'legendary'] },
        { w: 15, label: 'Accesorio legendario', make: acc('legendary') },
      ],
      holo: [{ w: 100, label: 'Gato HOLO (destacado 50%)', make: cat(['epic', 'legendary'], [0.5, 0.5], 1, 'banner'), cat: true, feat: ['epic', 'legendary'] }],
      mythic: MYTHIC_ENTRY,
    },
    epicPity: 8,
    softPity: 22,
    hardPity: 36,
    softStep: 0.07,
    mythicPity: 140,
    catPity: 5,
    accent: 0x8a5cff,
    accent2: 0xffc94a,
    hasCats: true,
  },
  {
    id: 'cofre',
    name: 'COFRE DEL SASTRE',
    kicker: 'ACCESORIOS Y MEJORAS',
    tagline: 'Sombreros, capas, planos y cristales. Sin gatos, más barato.',
    gems: 4,
    tiers: { common: 0.58, rare: 0.3, epic: 0.1, legendary: 0.02, holo: 0, mythic: 0 },
    table: {
      common: [
        { w: 40, label: 'Accesorio común', make: acc('common') },
        { w: 30, label: '6 Chatarra', make: () => ({ kind: 'scrap', n: 6, tier: 'common' }) },
        { w: 30, label: '3 Cristales', make: () => ({ kind: 'crystal', n: 3, tier: 'common' }) },
      ],
      rare: [
        { w: 45, label: 'Accesorio raro', make: acc('rare') },
        { w: 30, label: '2 Planos', make: () => ({ kind: 'blueprint', n: 2, tier: 'rare' }) },
        { w: 25, label: '6 Cristales', make: () => ({ kind: 'crystal', n: 6, tier: 'rare' }) },
      ],
      epic: [
        { w: 60, label: 'Accesorio épico', make: acc('epic') },
        { w: 20, label: '4 Planos', make: () => ({ kind: 'blueprint', n: 4, tier: 'epic' }) },
        { w: 20, label: '2 Orbes Prisma', make: () => ({ kind: 'prisma', n: 2, tier: 'epic' }) },
      ],
      legendary: [{ w: 100, label: 'Accesorio legendario', make: acc('legendary') }],
      holo: [],
      mythic: [],
    },
    epicPity: 8,
    softPity: 16,
    hardPity: 28,
    softStep: 0.09,
    mythicPity: 0,
    catPity: 0,
    accent: 0xffc94a,
    accent2: 0xc8102e,
    hasCats: false,
  },
];
export const BANNER_BY_ID = new Map(BANNERS.map((b) => [b.id, b]));
export function banner(id?: string | null): Banner {
  return (id && BANNER_BY_ID.get(id)) || BANNERS[0];
}

// ------------------------------------------------------------------ risk modes (bet size ↔ variance)
export type GachaMode = 'normal' | 'riesgo' | 'todo';
export interface ModeDef {
  id: GachaMode;
  name: string;
  /** boletos per pull (gems = cost × banner.gems) */
  cost: number;
  blurb: string;
  /** tier odds (common = "NADA" consolation) — null = the banner's own odds */
  odds: Record<Tier, number> | null;
  consolation: { label: string; make: () => Prize } | null;
}
export const MODES: Record<GachaMode, ModeDef> = {
  normal: { id: 'normal', name: 'NORMAL', cost: 1, blurb: 'Las probabilidades del portal, con todas sus garantías.', odds: null, consolation: null },
  riesgo: {
    id: 'riesgo',
    name: 'ALTO RIESGO',
    cost: 3,
    blurb: '3 boletos: legendario+ al 19%, pero 55% de las veces solo te llevas 15 fichas.',
    odds: { common: 0.55, rare: 0, epic: 0.26, legendary: 0.165, holo: 0.015, mythic: 0.01 },
    consolation: { label: 'NADA… bueno, 15 fichas', make: () => ({ kind: 'chips', n: 15, tier: 'common' }) },
  },
  todo: {
    id: 'todo',
    name: 'TODO O NADA',
    cost: 10,
    blurb: '10 boletos: 60% legendario o mejor (mítico al 7%). Si pierdes, te regresamos 1 boleto.',
    odds: { common: 0.4, rare: 0, epic: 0, legendary: 0.47, holo: 0.06, mythic: 0.07 },
    consolation: { label: 'NADA… toma 1 boleto de consuelo', make: () => ({ kind: 'tickets', n: 1, tier: 'common' }) },
  },
};
export function modesFor(b: Banner): GachaMode[] {
  return b.hasCats ? ['normal', 'riesgo', 'todo'] : ['normal'];
}

/** featured cat of the HOLO banner: an eligible épico/legendario, rotating with your Reino level */
export function featuredCat(): string | null {
  const list = gachaCats()
    .filter((c) => c.rarity === 'epic' || c.rarity === 'legendary')
    .sort((a, b) => a.id.localeCompare(b.id));
  if (!list.length) return null;
  const k = G.s.kl + (G.s.campaign?.bossesDefeated ?? 0) * 3;
  return list[k % list.length].id;
}

// ------------------------------------------------------------------ counters
const K = (b: Banner, k: string) => `${b.id}:${k}`;
export function pityOf(b: Banner) {
  const p = cs().pity;
  return { e: p[K(b, 'e')] ?? 0, l: p[K(b, 'l')] ?? 0, m: p[K(b, 'm')] ?? 0, c: p[K(b, 'c')] ?? 0, hot: p[K(b, 'hot')] ?? 0, esc: p[K(b, 'esc')] ?? 99 };
}
export function isBeginner(b: Banner) {
  return b.hasCats && (cs().stats.gacha_legends ?? 0) === 0;
}
/** soft / hard legendary pity in force (beginner's luck lowers both) */
export function pityCaps(b: Banner) {
  if (isBeginner(b)) return { soft: Math.min(b.softPity, BEGINNER.softPity), hard: Math.min(b.hardPity, BEGINNER.hardPity), beginner: true };
  return { soft: b.softPity, hard: b.hardPity, beginner: false };
}
/** pulls left until each guarantee (1 = the next pull is guaranteed) */
export function pityLeft(b: Banner) {
  const p = pityOf(b);
  const caps = pityCaps(b);
  return {
    epic: Math.max(1, b.epicPity - p.e),
    legendary: Math.max(1, caps.hard - p.l),
    mythic: b.mythicPity ? Math.max(1, b.mythicPity - p.m) : 0,
    cat: b.catPity ? Math.max(1, b.catPity - p.c) : 0,
    hot: p.hot,
    beginner: caps.beginner,
  };
}

/** move `amount` of probability into `to` (split by weights), taking it from common → rare → epic */
function shiftInto(o: Record<Tier, number>, amount: number, to: Partial<Record<Tier, number>>) {
  let left = amount;
  for (const src of ['common', 'rare', 'epic'] as Tier[]) {
    if (to[src]) continue;
    const take = Math.min(o[src], left);
    o[src] -= take;
    left -= take;
    if (left <= 1e-12) break;
  }
  const moved = amount - Math.max(0, left);
  const tw = Object.values(to).reduce((s, x) => s + (x ?? 0), 0) || 1;
  for (const [t, w] of Object.entries(to) as [Tier, number][]) o[t] += (moved * w) / tw;
}

/** effective tier odds for the NEXT normal pull (ramps, hot window and guarantees included) */
export function tierOdds(b: Banner, pity = pityOf(b)): Record<Tier, number> {
  const o = { ...b.tiers };
  const { soft, hard } = pityCaps(b);
  const nextL = pity.l + 1;
  const legW = () => ({ legendary: o.legendary || 1e-9, holo: o.holo, mythic: o.mythic });
  // RACHA CALIENTE
  if (pity.hot > 0) {
    shiftInto(o, (o.legendary + o.holo + o.mythic) * (HOT.legend - 1), legW());
    shiftInto(o, o.epic * (HOT.epic - 1), { epic: 1 });
  }
  // soft ramp
  if (nextL > soft) shiftInto(o, (nextL - soft) * b.softStep, legW());
  // hard guarantees
  if (b.mythicPity && pity.m + 1 >= b.mythicPity) return { common: 0, rare: 0, epic: 0, legendary: 0, holo: 0, mythic: 1 };
  if (nextL >= hard) shiftInto(o, 1, legW());
  if (pity.e + 1 >= b.epicPity) shiftInto(o, o.common + o.rare, { epic: o.epic, legendary: o.legendary, holo: o.holo, mythic: o.mythic });
  // clean float noise
  for (const t of TIER_ORDER) o[t] = Math.max(0, o[t]);
  const tot = TIER_ORDER.reduce((s, t) => s + o[t], 0);
  for (const t of TIER_ORDER) o[t] /= tot;
  return o;
}

/** odds of a pull in a given mode (risk modes have fixed odds, but the guarantees still apply) */
export function modeOdds(b: Banner, mode: GachaMode, pity = pityOf(b)): Record<Tier, number> {
  const md = MODES[mode];
  if (!md.odds || !b.hasCats) return tierOdds(b, pity);
  const o = { ...md.odds };
  const { hard } = pityCaps(b);
  if (b.mythicPity && pity.m + md.cost >= b.mythicPity) return { common: 0, rare: 0, epic: 0, legendary: 0, holo: 0, mythic: 1 };
  if (pity.l + md.cost >= hard) shiftInto(o, 1, { legendary: o.legendary, holo: o.holo, mythic: o.mythic });
  return o;
}

/** P(legendary+) of the n-th pull from zero (normal mode, no hot window) — the ramp table for the odds panel */
export function rampTable(b: Banner, beginner = isBeginner(b)): { pull: number; p: number }[] {
  const caps = beginner ? { soft: Math.min(b.softPity, BEGINNER.softPity), hard: Math.min(b.hardPity, BEGINNER.hardPity) } : { soft: b.softPity, hard: b.hardPity };
  const out: { pull: number; p: number }[] = [];
  const base = b.tiers.legendary + b.tiers.holo + b.tiers.mythic;
  for (let n = 1; n <= caps.hard; n++) {
    let p = base;
    if (n > caps.soft) p = Math.min(1, p + (n - caps.soft) * b.softStep);
    if (n >= caps.hard) p = 1;
    out.push({ pull: n, p });
  }
  return out;
}
/** expected pulls to the next legendary+ from zero (ignores escapes/hot windows, which only make it sooner) */
export function expectedPulls(b: Banner, beginner = isBeginner(b)) {
  let alive = 1;
  let e = 0;
  for (const r of rampTable(b, beginner)) {
    e += alive * r.p * r.pull;
    alive *= 1 - r.p;
  }
  return e;
}

/** an entry's label, honest about the featured cat (it only shows up in the rarities the entry can give) */
export function entryLabel(e: { label: string; feat?: RarityId[] }, featured: string | null = featuredCat()): string {
  if (!e.feat) return e.label;
  const r = featured ? (catDef(featured).rarity as RarityId) : null;
  if (r && e.feat.includes(r)) return e.label;
  return e.label.replace(/ \(destacado 50%\)/, r ? ' (el destacado no sale aquí)' : '');
}

/** flat list for the "Probabilidades" table: every reward with its exact chance (base odds) */
export function ratesTable(b: Banner, mode: GachaMode = 'normal'): { tier: Tier; p: number; items: { label: string; p: number }[] }[] {
  const md = MODES[mode];
  const featured = b.id === 'holo' ? featuredCat() : null;
  const tiers = md.odds && b.hasCats ? md.odds : b.tiers;
  return TIER_ORDER.filter((t) => tiers[t] > 0).map((t) => {
    if (md.odds && t === 'common' && md.consolation) return { tier: t, p: tiers[t], items: [{ label: md.consolation.label, p: tiers[t] }] };
    const list = b.table[t].length ? b.table[t] : b.table.legendary;
    const tot = list.reduce((s, e) => s + e.w, 0);
    return { tier: t, p: tiers[t], items: list.map((e) => ({ label: entryLabel(e, featured), p: (tiers[t] * e.w) / tot })) };
  });
}

export interface Pull {
  tier: Tier;
  prize: Prize;
  got: Granted;
  /** a guarantee forced this tier */
  pity: 'epic' | 'legendary' | 'mythic' | null;
  /** "¡se escapó!": species of the legendary that ran away (the pull still gives its prize) */
  escaped?: string;
  /** this pull ran inside a RACHA CALIENTE */
  hot?: boolean;
  /** first legendary+ ever (beginner's luck) */
  firstLegend?: boolean;
  mode: GachaMode;
}

function pullOne(b: Banner, featured: string | null, mode: GachaMode): Pull {
  const p = cs().pity;
  const st = cs().stats;
  const md = MODES[mode];
  const cost = md.odds && b.hasCats ? md.cost : 1;
  const pity = pityOf(b);
  const odds = md.odds && b.hasCats ? modeOdds(b, mode, pity) : tierOdds(b, pity);
  const baseOdds = md.odds && b.hasCats ? md.odds : b.tiers;
  let tier = weighted(TIER_ORDER, (t) => odds[t]);
  const rank = rankOf(tier);
  // which guarantee (if any) forced it: the tier was impossible at the base odds or the ramp hit 100%
  let forced: Pull['pity'] = null;
  if (tier === 'mythic' && odds.mythic >= 0.999) forced = 'mythic';
  else if (rank >= 3 && odds.common + odds.rare + odds.epic <= 1e-9 && baseOdds.common + baseOdds.rare + baseOdds.epic > 0) forced = 'legendary';
  else if (rank === 2 && odds.common + odds.rare <= 1e-9 && baseOdds.common + baseOdds.rare > 0) forced = 'epic';
  const firstLegend = rank >= 3 && b.hasCats && (st.gacha_legends ?? 0) === 0;
  // prize
  let entry: Entry;
  if (md.odds && b.hasCats && tier === 'common' && md.consolation) entry = { w: 1, label: md.consolation.label, make: md.consolation.make };
  else {
    const list = b.table[tier].length ? b.table[tier] : b.table.legendary;
    entry = weighted(list, (x) => x.w);
    // cat guarantee: N pulls without a cat → this one is a cat (common tier borrows the rare cat roll)
    if (b.catPity && !entry.cat && pity.c + 1 >= b.catPity) {
      const src = b.table[tier].find((x) => x.cat) ?? b.table.rare.find((x) => x.cat);
      if (src) entry = src;
    }
  }
  const prize = entry.make(featured);
  prize.tier = prize.holo ? 'holo' : tier === 'holo' ? 'legendary' : tier;
  if (tier === 'mythic' && prize.kind === 'cat') prize.tier = catDef(prize.ref!).rarity === 'mythic' ? 'mythic' : 'holo';
  const got = grantPrize(prize);
  // counters
  const wasHot = pity.hot > 0;
  // the épico guarantee is a normal-pull rule: risk pulls move its counter by 1 (they still count `cost` below)
  p[K(b, 'e')] = rank >= 2 ? 0 : pity.e + (md.odds && b.hasCats ? 1 : cost);
  p[K(b, 'l')] = rank >= 3 ? 0 : pity.l + cost;
  p[K(b, 'm')] = tier === 'mythic' ? 0 : pity.m + cost;
  p[K(b, 'c')] = prize.kind === 'cat' ? 0 : pity.c + 1;
  p[K(b, 'hot')] = Math.max(0, pity.hot - 1);
  p[K(b, 'esc')] = Math.min(99, pity.esc + 1);
  if (rank >= 3) {
    st.gacha_legends = (st.gacha_legends ?? 0) + 1;
    p[K(b, 'hot')] = 0;
  }
  if (tier === 'mythic') st.gacha_mythics = (st.gacha_mythics ?? 0) + 1;
  // ¡SE ESCAPÓ! (only normal pulls on cat banners, outside a hot window, with cooldown)
  let escaped: string | undefined;
  if (rank < 3 && b.hasCats && mode === 'normal' && !wasHot && pity.esc >= ESCAPE.cooldown && rand() < ESCAPE.p) {
    const legs = catsOfRarity('legendary', true);
    const unowned = legs.filter((c) => G.s.catdex[c.id] !== 'registered');
    const pool = unowned.length ? unowned : legs;
    if (pool.length) {
      escaped = (pool.find((c) => c.id === LUMEN && rand() < 0.4) ?? pool[Math.floor(rand() * pool.length)]).id;
      const caps = pityCaps(b);
      p[K(b, 'l')] = Math.min(caps.hard - 1, (p[K(b, 'l')] ?? 0) + ESCAPE.trail);
      p[K(b, 'hot')] = ESCAPE.hot;
      p[K(b, 'esc')] = 0;
      st.gacha_escapes = (st.gacha_escapes ?? 0) + 1;
    }
  }
  return { tier, prize, got, pity: forced, escaped, hot: wasHot, firstLegend, mode };
}

export type PayWith = 'tickets' | 'gems';
export function pullCost(b: Banner, n: 1 | 10, w: PayWith, mode: GachaMode = 'normal') {
  const md = MODES[mode];
  if (md.odds && b.hasCats) return w === 'tickets' ? md.cost : md.cost * b.gems;
  if (w === 'tickets') return n;
  return n === 1 ? b.gems : b.gems * 9;
}
export function canPull(b: Banner, n: 1 | 10, w: PayWith, mode: GachaMode = 'normal') {
  const c = pullCost(b, n, w, mode);
  return w === 'tickets' ? cs().tickets >= c : G.s.gems >= c;
}

/** pay and pull; returns null if it can't be afforded. Risk modes always pull once. */
export function pull(bannerId: string, n: 1 | 10, w: PayWith, mode: GachaMode = 'normal'): Pull[] | null {
  const b = banner(bannerId);
  if (!b.hasCats) mode = 'normal';
  if (mode !== 'normal') n = 1;
  if (!canPull(b, n, w, mode)) return null;
  const cost = pullCost(b, n, w, mode);
  if (w === 'tickets') addTickets(-cost, 'gacha');
  else G.add('gems', -cost, 'gacha');
  const featured = b.id === 'holo' ? featuredCat() : null;
  const out: Pull[] = [];
  for (let i = 0; i < n; i++) out.push(pullOne(b, featured, mode));
  const st = cs().stats;
  st.pulls = (st.pulls ?? 0) + n;
  if (n === 10) st.pulls_x10 = (st.pulls_x10 ?? 0) + 1;
  if (mode !== 'normal') st[`pulls_${mode}`] = (st[`pulls_${mode}`] ?? 0) + 1;
  st[`pulls_${b.id}`] = (st[`pulls_${b.id}`] ?? 0) + n;
  const best = out.reduce((m, p) => Math.max(m, rankOf(p.tier)), 0);
  const h = cs().hist!;
  h.unshift({ g: 'gacha', cur: w === 'tickets' ? 'tickets' : 'gems', stake: cost, win: 0, r: `${b.name} ${mode === 'normal' ? `x${n}` : MODES[mode].name} · ${TIER_NAME[TIER_ORDER[best]]}` });
  if (h.length > 40) h.length = 40;
  G.count('gacha_pulls', n);
  G.save();
  return out;
}

/** presentation helpers */
export function tierColor(t: Tier): number {
  return { common: 0xd9cdb8, rare: 0x6fa8ff, epic: 0xff2e88, legendary: 0xffc94a, holo: 0x00e5ff, mythic: 0xff3b1f }[t];
}
export function prizeTitle(g: Granted): string {
  if (g.kind === 'cat') return catDef(g.ref!).name;
  return g.label;
}
export { rand };
