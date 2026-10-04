/**
 * Resonancia ("tus gatos se fueron a invocar otro gatito"): exact visible odds per
 * balance.resonance + GDD 2.6. Duplicates become orbs on reveal.
 */
import { G, ResonanceJob } from '../game';
import { CATS, CONTENT, catDef, CatDef } from '../../data/content';
import { BAL, RarityId } from '../econ';
import { adopt, cat as getCat } from './cats';
import { Rng } from '../../core/rng';

const RANK: Record<RarityId, number> = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 };
type Bucket = 'common' | 'rare' | 'epic' | 'legendary' | 'secret';

export interface OddsRow {
  species: string | null; // null for the aggregated "???" row
  bucket: Bucket;
  pct: number;
  known: boolean;
}
export interface OddsTable {
  rows: OddsRow[];
  /** candidates inside the secret bucket (hidden from UI) */
  secret: string[];
  missing: string[];
  timeRange: [number, number];
}

const subset = (els: string[], U: Set<string>) => els.every((e) => U.has(e));

export function oddsFor(aUid: string, bUid: string): OddsTable {
  const a = getCat(aUid)!;
  const b = getCat(bUid)!;
  const da = catDef(a.species);
  const db = catDef(b.species);
  const disc = new Set(G.s.elements);
  const U = new Set([...da.elements, ...db.elements].filter((e) => disc.has(e)));
  const shared = new Set(da.elements.filter((e) => db.elements.includes(e) && disc.has(e)));
  const minEpic = 15;
  const pool: Record<Bucket, string[]> = { common: [], rare: [], epic: [], legendary: [], secret: [] };
  const missing: string[] = [];
  for (const c of CATS) {
    if (c.secret || c.rarity === 'mythic') continue;
    if (!subset(c.elements, U)) {
      continue;
    }
    if (c.rarity === 'common' && c.elements.length === 1) pool.common.push(c.id);
    else if (c.rarity === 'rare') pool.rare.push(c.id);
    else if (c.rarity === 'epic') {
      if (a.level >= minEpic && b.level >= minEpic) pool.epic.push(c.id);
      else missing.push(`${c.name}: ambos padres Nv${minEpic}+`);
    } else if (c.rarity === 'legendary' && c.primordial && shared.has(c.elements[0])) {
      if (a.level >= 20 && b.level >= 20) pool.legendary.push(c.id);
      else missing.push(`${c.name}: ambos padres Nv20+`);
    }
  }
  // secret bucket: unregistered epic/legendary resonance species whose elements are known + secret cats whose condition holds
  for (const c of CATS) {
    if (G.s.catdex[c.id] === 'registered') continue;
    if (c.secret) {
      if (secretConditionMet(c, a.species, b.species, a.level, b.level, a.stars, b.stars, U)) pool.secret.push(c.id);
      continue;
    }
    if ((c.rarity === 'epic' || (c.rarity === 'legendary' && c.primordial)) && subset(c.elements, disc) && subset(c.elements, U)) {
      if (!pool.epic.includes(c.id) && !pool.legendary.includes(c.id)) pool.secret.push(c.id);
    }
  }
  const rankSum = RANK[da.rarity] + RANK[db.rarity];
  const W: Record<Bucket, number> = {
    common: BAL.resonance.bucket_weights.common,
    rare: BAL.resonance.bucket_weights.rare,
    epic: BAL.resonance.bucket_weights.epic + BAL.resonance.parent_rarity_bonus.epic_per_rank * rankSum + Math.min(BAL.resonance.pity.cap, G.s.resonance.pity * BAL.resonance.pity.epic_bonus_per_miss),
    legendary: BAL.resonance.bucket_weights.legendary + BAL.resonance.parent_rarity_bonus.legendary_per_rank * rankSum,
    secret: BAL.resonance.bucket_weights.secret,
  };
  let total = 0;
  for (const k of Object.keys(W) as Bucket[]) if (pool[k].length) total += W[k];
  const rows: OddsRow[] = [];
  for (const k of ['common', 'rare', 'epic', 'legendary'] as Bucket[]) {
    if (!pool[k].length) continue;
    const each = W[k] / total / pool[k].length;
    for (const id of pool[k]) rows.push({ species: id, bucket: k, pct: each * 100, known: !!G.s.catdex[id] });
  }
  rows.sort((x, y) => y.pct - x.pct);
  if (pool.secret.length) rows.push({ species: null, bucket: 'secret', pct: (W.secret / total) * 100, known: false });
  const times = rows.map((r) => (r.species ? resTimeMs(catDef(r.species).rarity) : resTimeMs('epic')));
  return { rows, secret: pool.secret, missing, timeRange: [Math.min(...times), Math.max(...times)] };
}

function secretConditionMet(c: CatDef, sa: string, sb: string, la: number, lb: number, stA: number, stB: number, U: Set<string>) {
  const da = catDef(sa);
  const db = catDef(sb);
  switch (c.id) {
    case 's_maneki':
      return da.worker === 'banker' && db.worker === 'banker' && la >= 15 && lb >= 15;
    case 's_caos':
      return U.has('storm') && U.has('cosmic') && G.has('flash_active');
    case 's_sonata':
      return U.has('magic') && U.has('cosmic') && U.has('storm') && la >= 30 && lb >= 30;
    case 's_lumen':
      return U.has('fire') && U.has('water') && U.has('nature') && stA >= 3 && stB >= 3;
    case 's_eclipse':
      return (sa === 'r_solar' && db.elements.includes('cosmic')) || (sb === 'r_solar' && da.elements.includes('cosmic'))
        ? la >= 20 || lb >= 20
        : false;
    default:
      return false;
  }
}

export function resTimeMs(r: RarityId) {
  const t = BAL.rarities.resonance_time_s as Record<string, number>;
  return (t[r] ?? t.legendary) * 1000;
}

export function busyCats() {
  return new Set(G.s.resonance.jobs.filter((j) => !j.ready).flatMap((j) => [j.a, j.b]));
}
export function freeSlots() {
  return G.s.resonance.slots - G.s.resonance.jobs.length;
}

/** Start a resonance. Returns the job (result is rolled now but hidden until reveal). */
export function startResonance(aUid: string, bUid: string): ResonanceJob | null {
  if (aUid === bUid || freeSlots() <= 0) return null;
  const busy = busyCats();
  if (busy.has(aUid) || busy.has(bUid)) return null;
  const a = getCat(aUid)!;
  const b = getCat(bUid)!;
  let result: string;
  let ms: number;
  const tutorial = !G.s.resonance.tutorialDone;
  if (tutorial) {
    result = 'r_pimenton';
    ms = 90000; // balance.timer_rules.tutorial_first_resonance
    G.s.resonance.tutorialDone = true;
  } else {
    const t = oddsFor(aUid, bUid);
    const rng = new Rng(Date.now() ^ (G.s.resonance.total * 7919));
    let roll = rng.next() * 100;
    let pick: OddsRow = t.rows[0];
    for (const r of t.rows) {
      roll -= r.pct;
      if (roll <= 0) {
        pick = r;
        break;
      }
    }
    result = pick.species ?? rng.pick(t.secret);
    ms = resTimeMs(catDef(result).rarity);
    // everything visible in the table becomes a "rumor"
    for (const r of t.rows) if (r.species && !G.s.catdex[r.species]) G.s.catdex[r.species] = 'rumor';
  }
  const rarity = catDef(result).rarity;
  if (RANK[rarity] >= 2) G.s.resonance.pity = 0;
  else G.s.resonance.pity = Math.min(BAL.resonance.pity.cap, G.s.resonance.pity + 1);
  G.s.resonance.total++;
  const mutation = rollMutation(a.habitat !== null && a.habitat === b.habitat, a.habitat);
  const job: ResonanceJob = { id: G.uid('r'), a: aUid, b: bUid, result, rarity, timerId: '', mutation, ready: false };
  const t = G.startTimer('resonance', job.id, ms, `${a.name} + ${b.name}`, 'discovery');
  job.timerId = t.id;
  G.s.resonance.jobs.push(job);
  G.count('resonance_start');
  return job;
}

function rollMutation(sameHabitat: boolean, habitatId: string | null) {
  if (G.s.kl < 20 && !G.has('luna_resonancia')) return null;
  const chance = G.has('luna_resonancia') ? 1 : 0.08 * (sameHabitat ? 2 : 1);
  if (Math.random() > chance) return null;
  const muts = (CONTENT as unknown as { mutations: { id: string; habitatBias?: string | null; weight?: number }[] }).mutations ?? [];
  if (!muts.length) return null;
  const el = habitatId ? G.s.habitats.find((h) => h.id === habitatId)?.element : null;
  const biased = muts.filter((m) => m.habitatBias && m.habitatBias === el);
  const list = biased.length && Math.random() < 0.6 ? biased : muts;
  return list[Math.floor(Math.random() * list.length)].id;
}

G.onTimer('resonance', (t) => {
  const job = G.s.resonance.jobs.find((j) => j.id === t.ref);
  if (job) job.ready = true;
});

/** Reveal a finished job: adopt or convert to orbs. */
export function reveal(jobId: string) {
  const job = G.s.resonance.jobs.find((j) => j.id === jobId);
  if (!job || !job.ready) return null;
  G.s.resonance.jobs = G.s.resonance.jobs.filter((j) => j !== job);
  const res = adopt(job.result, { mutation: job.mutation });
  G.xp('hatch', job.rarity);
  G.count('resonance_hatch');
  return { ...res, job };
}

export function revealCopy(rarity: RarityId, name: string) {
  const rc = CONTENT.resonanceRules.revealCopy as Record<string, string[]>;
  const list = rc[rarity] ?? rc.common ?? ['¡{name}!'];
  return list[Math.floor(Math.random() * list.length)].replace('{name}', name);
}
export function startCopy(a: string, b: string, t: string) {
  const list = CONTENT.resonanceRules.copy;
  return list[Math.floor(Math.random() * list.length)].replace('{A}', a).replace('{B}', b).replace('{t}', t);
}
