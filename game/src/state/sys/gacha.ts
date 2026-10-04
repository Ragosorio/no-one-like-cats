/**
 * Gacha "Portal del Multiverso" (casino agent): banners with visible odds and pity.
 *   G.s.casino.pity[`${banner}:e`] → pulls since the last ÉPICO+ (guaranteed every 10)
 *   G.s.casino.pity[`${banner}:l`] → pulls since the last LEGENDARIO+ (soft pity, then guaranteed)
 * Pulls cost Boletos (earned in the casino / La Caja) or Ojos de Gato (earned playing). No real money anywhere.
 * Rewards are granted the moment you pull (the animation only presents them).
 */
import { G } from '../game';
import { RarityId } from '../econ';
import { catDef } from '../../data/content';
import { AccRarity } from './accessories';
import { Granted, Prize, accPrize, cs, eligibleCats, foodIncome, grantPrize, income, rand, rollCatPrize, weighted, addTickets } from './casino';

export type Tier = 'common' | 'rare' | 'epic' | 'legendary' | 'holo';
export const TIER_ORDER: Tier[] = ['common', 'rare', 'epic', 'legendary', 'holo'];
export const TIER_NAME: Record<Tier, string> = { common: 'COMÚN', rare: 'RARO', epic: 'ÉPICO', legendary: 'LEGENDARIO', holo: 'HOLO' };

interface Entry {
  w: number;
  label: string;
  make: (featured: string | null) => Prize;
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
  accent: number;
  accent2: number;
  hasCats: boolean;
}

const sec = (s: number) => Math.round(s * income());
const fsec = (s: number) => Math.max(30, Math.round(s * foodIncome()));
const cat = (rar: RarityId[], w: number[], holo = 0, featuredOn = false) => (f: string | null) => rollCatPrize(rar, w, holo, featuredOn ? f : null);
const acc = (r: AccRarity) => () => accPrize(r);

export const BANNERS: Banner[] = [
  {
    id: 'michi',
    name: 'PORTAL MICHI',
    kicker: 'ESTÁNDAR · SIEMPRE ABIERTO',
    tagline: 'Gatos, materiales y accesorios. Épico garantizado cada 10.',
    gems: 10,
    tiers: { common: 0.64, rare: 0.25, epic: 0.085, legendary: 0.02, holo: 0.005 },
    table: {
      common: [
        { w: 25, label: 'Pescaditos (2 min)', make: () => ({ kind: 'food', n: fsec(120), tier: 'common' }) },
        { w: 20, label: 'Oro (90 s)', make: () => ({ kind: 'gold', n: sec(90), tier: 'common' }) },
        { w: 20, label: '5 Orbes de Alma', make: () => ({ kind: 'orbs', n: 5, tier: 'common' }) },
        { w: 15, label: '25 Fichas', make: () => ({ kind: 'chips', n: 25, tier: 'common' }) },
        { w: 10, label: '4 Chatarra', make: () => ({ kind: 'scrap', n: 4, tier: 'common' }) },
        { w: 10, label: 'Accesorio común', make: acc('common') },
      ],
      rare: [
        { w: 40, label: 'Gato común o raro', make: cat(['common', 'rare'], [0.5, 0.5]) },
        { w: 20, label: 'Accesorio raro', make: acc('rare') },
        { w: 15, label: '1 Plano', make: () => ({ kind: 'blueprint', n: 1, tier: 'rare' }) },
        { w: 15, label: '3 Cristales', make: () => ({ kind: 'crystal', n: 3, tier: 'rare' }) },
        { w: 10, label: '1 Orbe Prisma', make: () => ({ kind: 'prisma', n: 1, tier: 'rare' }) },
      ],
      epic: [
        { w: 50, label: 'Gato raro o épico', make: cat(['rare', 'epic'], [0.6, 0.4]) },
        { w: 20, label: 'Accesorio épico', make: acc('epic') },
        { w: 15, label: '3 Orbes Prisma', make: () => ({ kind: 'prisma', n: 3, tier: 'epic' }) },
        { w: 15, label: '5 Ojos de Gato', make: () => ({ kind: 'gems', n: 5, tier: 'epic' }) },
      ],
      legendary: [
        { w: 70, label: 'Gato épico o legendario', make: cat(['epic', 'legendary'], [0.6, 0.4]) },
        { w: 30, label: 'Accesorio legendario', make: acc('legendary') },
      ],
      holo: [{ w: 100, label: 'Gato HOLO (raro+, súper roto)', make: cat(['rare', 'epic', 'legendary'], [0.5, 0.35, 0.15], 1) }],
    },
    epicPity: 10,
    softPity: 45,
    hardPity: 60,
    softStep: 0.06,
    accent: 0xff2e88,
    accent2: 0x00e5ff,
    hasCats: true,
  },
  {
    id: 'holo',
    name: 'MULTIVERSO HOLO',
    kicker: 'DESTACADO · CAMBIA CON TU REINO',
    tagline: 'El gato destacado sale la mitad de las veces. HOLO al 2%.',
    gems: 12,
    tiers: { common: 0.55, rare: 0.3, epic: 0.1, legendary: 0.03, holo: 0.02 },
    table: {
      common: [
        { w: 30, label: 'Pescaditos (2 min)', make: () => ({ kind: 'food', n: fsec(120), tier: 'common' }) },
        { w: 25, label: 'Oro (2 min)', make: () => ({ kind: 'gold', n: sec(120), tier: 'common' }) },
        { w: 25, label: '8 Orbes de Alma', make: () => ({ kind: 'orbs', n: 8, tier: 'common' }) },
        { w: 20, label: '30 Fichas', make: () => ({ kind: 'chips', n: 30, tier: 'common' }) },
      ],
      rare: [
        { w: 55, label: 'Gato común o raro', make: cat(['common', 'rare'], [0.4, 0.6]) },
        { w: 20, label: 'Accesorio raro', make: acc('rare') },
        { w: 25, label: '1 Orbe Prisma', make: () => ({ kind: 'prisma', n: 1, tier: 'rare' }) },
      ],
      epic: [
        { w: 70, label: 'Gato raro o épico (destacado 50%)', make: cat(['rare', 'epic'], [0.5, 0.5], 0, true) },
        { w: 30, label: 'Accesorio épico', make: acc('epic') },
      ],
      legendary: [
        { w: 80, label: 'Gato épico o legendario (destacado 50%)', make: cat(['epic', 'legendary'], [0.5, 0.5], 0, true) },
        { w: 20, label: 'Accesorio legendario', make: acc('legendary') },
      ],
      holo: [{ w: 100, label: 'Gato HOLO (destacado 50%)', make: cat(['epic', 'legendary'], [0.6, 0.4], 1, true) }],
    },
    epicPity: 10,
    softPity: 35,
    hardPity: 50,
    softStep: 0.07,
    accent: 0x8a5cff,
    accent2: 0xffc94a,
    hasCats: true,
  },
  {
    id: 'cofre',
    name: 'COFRE DEL SASTRE',
    kicker: 'ACCESORIOS Y MEJORAS',
    tagline: 'Sombreros, capas, planos y cristales. Sin gatos, más barato.',
    gems: 6,
    tiers: { common: 0.6, rare: 0.3, epic: 0.085, legendary: 0.015, holo: 0 },
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
    },
    epicPity: 10,
    softPity: 30,
    hardPity: 40,
    softStep: 0.08,
    accent: 0xffc94a,
    accent2: 0xc8102e,
    hasCats: false,
  },
];
export const BANNER_BY_ID = new Map(BANNERS.map((b) => [b.id, b]));
export function banner(id?: string | null): Banner {
  return (id && BANNER_BY_ID.get(id)) || BANNERS[0];
}

/** featured cat of the HOLO banner: an eligible épico/legendario, rotating with your Reino level */
export function featuredCat(): string | null {
  const list = eligibleCats()
    .filter((c) => c.rarity === 'epic' || c.rarity === 'legendary')
    .sort((a, b) => a.id.localeCompare(b.id));
  if (!list.length) return null;
  const k = G.s.kl + (G.s.campaign?.bossesDefeated ?? 0) * 3;
  return list[k % list.length].id;
}

export function pityOf(b: Banner) {
  const p = cs().pity;
  return { e: p[`${b.id}:e`] ?? 0, l: p[`${b.id}:l`] ?? 0 };
}
/** pulls left until the guarantee (1 = the next pull is guaranteed) */
export function pityLeft(b: Banner) {
  const p = pityOf(b);
  return { epic: Math.max(1, b.epicPity - p.e), legendary: Math.max(1, b.hardPity - p.l) };
}

/** effective tier odds for the NEXT pull (soft pity included) */
export function tierOdds(b: Banner): Record<Tier, number> {
  const o = { ...b.tiers };
  const { e, l } = pityOf(b);
  const next = l + 1;
  if (next >= b.hardPity) return { common: 0, rare: 0, epic: 0, legendary: 1 - o.holo, holo: o.holo };
  if (next > b.softPity) {
    const add = Math.min(o.common, (next - b.softPity) * b.softStep);
    o.legendary += add;
    o.common -= add;
  }
  if (e + 1 >= b.epicPity) {
    const lo = o.common + o.rare;
    const hi = o.epic + o.legendary + o.holo;
    return { common: 0, rare: 0, epic: o.epic + (lo * o.epic) / hi, legendary: o.legendary + (lo * o.legendary) / hi, holo: o.holo + (lo * o.holo) / hi };
  }
  return o;
}

/** flat list for the "Probabilidades" table: every reward with its exact chance (base odds, no pity) */
export function ratesTable(b: Banner): { tier: Tier; p: number; items: { label: string; p: number }[] }[] {
  return TIER_ORDER.filter((t) => b.tiers[t] > 0).map((t) => {
    const tot = b.table[t].reduce((s, e) => s + e.w, 0);
    return { tier: t, p: b.tiers[t], items: b.table[t].map((e) => ({ label: e.label, p: (b.tiers[t] * e.w) / tot })) };
  });
}

export interface Pull {
  tier: Tier;
  prize: Prize;
  got: Granted;
  /** pity forced this tier */
  pity: 'epic' | 'legendary' | null;
}

function pullOne(b: Banner, featured: string | null): Pull {
  const p = cs().pity;
  const odds = tierOdds(b);
  let tier = weighted(TIER_ORDER, (t) => odds[t]);
  const { e, l } = pityOf(b);
  let forced: Pull['pity'] = null;
  if (l + 1 >= b.hardPity && TIER_ORDER.indexOf(tier) < 3) {
    tier = 'legendary';
    forced = 'legendary';
  } else if (e + 1 >= b.epicPity && TIER_ORDER.indexOf(tier) < 2) {
    tier = 'epic';
    forced = 'epic';
  }
  const rank = TIER_ORDER.indexOf(tier);
  p[`${b.id}:e`] = rank >= 2 ? 0 : e + 1;
  p[`${b.id}:l`] = rank >= 3 ? 0 : l + 1;
  const list = b.table[tier].length ? b.table[tier] : b.table.legendary;
  const entry = weighted(list, (x) => x.w);
  const prize = entry.make(featured);
  // the card shows the tier you rolled (as in the odds table); holo stays holo
  prize.tier = prize.holo ? 'holo' : tier;
  const got = grantPrize(prize);
  return { tier, prize, got, pity: forced };
}

export type PayWith = 'tickets' | 'gems';
export function pullCost(b: Banner, n: 1 | 10, w: PayWith) {
  if (w === 'tickets') return n;
  return n === 1 ? b.gems : b.gems * 9;
}
export function canPull(b: Banner, n: 1 | 10, w: PayWith) {
  const c = pullCost(b, n, w);
  return w === 'tickets' ? cs().tickets >= c : G.s.gems >= c;
}

/** pay and pull; returns null if it can't be afforded */
export function pull(bannerId: string, n: 1 | 10, w: PayWith): Pull[] | null {
  const b = banner(bannerId);
  if (!canPull(b, n, w)) return null;
  const cost = pullCost(b, n, w);
  if (w === 'tickets') addTickets(-cost, 'gacha');
  else G.add('gems', -cost, 'gacha');
  const featured = b.id === 'holo' ? featuredCat() : null;
  const out: Pull[] = [];
  for (let i = 0; i < n; i++) out.push(pullOne(b, featured));
  const st = cs().stats;
  st.pulls = (st.pulls ?? 0) + n;
  if (n === 10) st.pulls_x10 = (st.pulls_x10 ?? 0) + 1;
  st[`pulls_${b.id}`] = (st[`pulls_${b.id}`] ?? 0) + n;
  cs().hist!.unshift({ g: 'gacha', cur: w === 'tickets' ? 'tickets' : 'gems', stake: cost, win: 0, r: `${b.name} x${n}` });
  if (cs().hist!.length > 40) cs().hist!.length = 40;
  G.count('gacha_pulls', n);
  G.save();
  return out;
}

/** presentation helpers */
export function tierColor(t: Tier): number {
  return { common: 0xd9cdb8, rare: 0x6fa8ff, epic: 0xff2e88, legendary: 0xffc94a, holo: 0x00e5ff }[t];
}
export function prizeTitle(g: Granted): string {
  if (g.kind === 'cat') return catDef(g.ref!).name;
  return g.label;
}
export { rand };
