/**
 * Resonancia ("tus gatos se fueron a invocar otro gatito"): exact visible odds per
 * balance.resonance + GDD 2.6. Duplicates become orbs on reveal.
 */
import { G, ResonanceJob } from '../game';
import { CATS, CONTENT, catDef, CatDef } from '../../data/content';
import { BAL, RarityId, duplicateOrbs } from '../econ';
import { adopt, cat as getCat, collState, MUTATIONS, MutationDef, rollTrait } from './cats';
import { Rng } from '../../core/rng';

// heroic / divine parents count like a mythic (their own rank never makes a resonance juicier)
const RANK: Record<RarityId, number> = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4, heroic: 4, divine: 4 };
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
/**
 * Parte II: a primordial the story hands you (`obtain.source` 'ruptura:<mission>', e.g. the Bibliotecario at H34)
 * only resonates as a DUPLICATE: until you got the original it stays out of every pool (the table, the '???'
 * bucket and the casino), so nobody breeds it before its chapter.
 */
export function storyLocked(c: CatDef) {
  return c.obtain.source.startsWith('ruptura:') && G.s.catdex[c.id] !== 'registered';
}

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
    if (c.secret || c.rarity === 'mythic' || c.rarity === 'heroic' || c.rarity === 'divine' || storyLocked(c)) continue;
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
    if ((c.rarity === 'epic' || (c.rarity === 'legendary' && c.primordial)) && !storyLocked(c) && subset(c.elements, disc) && subset(c.elements, U)) {
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

/**
 * A secret recipe has a SHAPE (which parents: elements, jobs, species) and a THRESHOLD (levels, stars).
 * A pair with the right shape always leaves a clue (the cat becomes a RUMOR and the table says what's
 * missing); the threshold opens the '???' bucket. Nobody has to guess blind.
 */
function secretShape(id: string, sa: string, sb: string, U: Set<string>): boolean {
  const da = catDef(sa);
  const db = catDef(sb);
  switch (id) {
    case 's_maneki':
      return da.worker === 'banker' && db.worker === 'banker';
    case 's_caos':
      return U.has('storm') && U.has('cosmic');
    case 's_sonata':
      return U.has('magic') && U.has('cosmic') && U.has('storm');
    case 's_lumen':
      return U.has('fire') && U.has('water') && U.has('nature');
    case 's_eclipse':
      return (sa === 'r_solar' && db.elements.includes('cosmic')) || (sb === 'r_solar' && da.elements.includes('cosmic'));
    // Parte II · Oleada 1: a prism (Cristal), a light and a piece of sky
    case 's_refracta':
      return U.has('crystal') && U.has('light') && U.has('cosmic');
    default:
      return false;
  }
}
/** what the threshold asks for, in the player's words */
const SECRET_NEED: Record<string, string> = {
  s_maneki: 'los dos banqueros a Nv15+',
  s_caos: 'los dos a Nv25+',
  s_sonata: 'los dos a Nv30+',
  s_lumen: 'los dos con ★3+',
  s_eclipse: 'uno de los dos a Nv20+',
  s_refracta: 'los dos a Nv20+',
};
export interface SecretClue {
  species: string;
  /** the threshold is met too: the '???' bucket is in the table */
  ready: boolean;
  need: string;
}
/** secret cats this pair is "close to" (right shape), and whether the pair already qualifies */
export function secretClues(aUid: string, bUid: string): SecretClue[] {
  const a = getCat(aUid);
  const b = getCat(bUid);
  if (!a || !b) return [];
  const U = new Set([...catDef(a.species).elements, ...catDef(b.species).elements]);
  const out: SecretClue[] = [];
  for (const c of CATS) {
    if (!c.secret || !secretShape(c.id, a.species, b.species, U)) continue;
    out.push({ species: c.id, ready: secretConditionMet(c, a.species, b.species, a.level, b.level, a.stars, b.stars, U), need: SECRET_NEED[c.id] ?? '' });
  }
  return out;
}
// ---------------------------------------------------------------- crossing history (Santuario › CRUCES)
const HISTORY_CAP = 40;
const samePair = (h: { a: string; b: string }, a: string, b: string) => (h.a === a && h.b === b) || (h.a === b && h.b === a);
/** newest first, one row per pair (with how many times it was crossed); favorites are never trimmed */
export function recordCross(a: string, b: string, result: string, isNew: boolean) {
  const st = collState();
  const old = (st.history ?? []).find((h) => samePair(h, a, b));
  const row = { a, b, result, isNew, at: G.s.playMs, n: (old?.n ?? 1) + (old ? 1 : 0), fav: old?.fav };
  const rest = (st.history ?? []).filter((h) => !samePair(h, a, b));
  const keep = [row, ...rest];
  const favs = keep.filter((h) => h.fav);
  const others = keep.filter((h) => !h.fav).slice(0, Math.max(0, HISTORY_CAP - favs.length));
  st.history = keep.filter((h) => h.fav || others.includes(h));
}
export function toggleFavCross(a: string, b: string) {
  const h = (collState().history ?? []).find((x) => samePair(x, a, b));
  if (h) h.fav = !h.fav;
  return !!h?.fav;
}
/** pairs you can cross again right now (both cats still yours, alive and free), favorites first */
export function crossHistory() {
  return (collState().history ?? []).filter((h) => getCat(h.a) && getCat(h.b)).sort((x, y) => Number(!!y.fav) - Number(!!x.fav));
}

/** Seat a pair on the cushions: every secret it is close to becomes a RUMOR. Returns the new ones. */
export function noteSecretClues(aUid: string, bUid: string): string[] {
  const fresh: string[] = [];
  for (const k of secretClues(aUid, bUid)) {
    if (G.s.catdex[k.species]) continue;
    G.s.catdex[k.species] = 'rumor';
    G.count('secret_rumors');
    fresh.push(k.species);
  }
  return fresh;
}
/** secret cats whose clue you hold (a rumor) or that you already registered — mission E18 reads this */
export function secretCluesFound() {
  return CATS.filter((c) => c.secret && (G.s.catdex[c.id] === 'rumor' || G.s.catdex[c.id] === 'registered')).length;
}

function secretConditionMet(c: CatDef, sa: string, sb: string, la: number, lb: number, stA: number, stB: number, U: Set<string>) {
  const da = catDef(sa);
  const db = catDef(sb);
  switch (c.id) {
    case 's_maneki':
      return da.worker === 'banker' && db.worker === 'banker' && la >= 15 && lb >= 15;
    case 's_caos':
      // was "with a Flash Event active": that event never existed, so Pixel Glitch could not be bred
      return U.has('storm') && U.has('cosmic') && la >= 25 && lb >= 25;
    case 's_sonata':
      return U.has('magic') && U.has('cosmic') && U.has('storm') && la >= 30 && lb >= 30;
    case 's_lumen':
      return U.has('fire') && U.has('water') && U.has('nature') && stA >= 3 && stB >= 3;
    case 's_eclipse':
      return (sa === 'r_solar' && db.elements.includes('cosmic')) || (sb === 'r_solar' && da.elements.includes('cosmic'))
        ? la >= 20 || lb >= 20
        : false;
    case 's_refracta':
      return U.has('crystal') && U.has('light') && U.has('cosmic') && la >= 20 && lb >= 20;
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
/** KL18 "Cola de Resonancia" (balance.automation.resonance_queue) */
export function queueKl() {
  return BAL.automation.find((a) => a.id === 'resonance_queue')?.kl ?? 18;
}
export function queueUnlocked() {
  return G.s.kl >= queueKl();
}
/** cats reserved by a queued pair (they can't be used elsewhere or the queue would break) */
export function queuedCats() {
  return new Set(G.s.resQueue.flatMap((q) => [q.a, q.b]));
}
/**
 * Free slots. With the queue unlocked a FINISHED job waits for its reveal without blocking
 * its slot (the queue keeps running while you're away: "revelaciones en cola").
 */
export function freeSlots() {
  const jobs = G.s.resonance.jobs;
  const used = queueUnlocked() ? jobs.filter((j) => !j.ready).length : jobs.length;
  return G.s.resonance.slots - used;
}
/** gem sink: +1 resonance slot for balance.gems.sinks.resonance_slot.cost (max balance…max) */
export function gemSlotInfo() {
  const cfg = BAL.gems.sinks.resonance_slot;
  const bought = collState().gemSlots ?? 0;
  return { cost: cfg.cost, left: Math.max(0, cfg.max - bought), bought };
}
export function buyGemSlot() {
  const g = gemSlotInfo();
  if (g.left <= 0 || !G.spend({ gems: g.cost })) return false;
  collState().gemSlots = g.bought + 1;
  G.s.resonance.slots += 1;
  G.count('resonance_slot_bought');
  return true;
}

/** Start a resonance. Returns the job (result is rolled now but hidden until reveal). */
export function startResonance(aUid: string, bUid: string): ResonanceJob | null {
  if (aUid === bUid || freeSlots() <= 0) return null;
  const busy = busyCats();
  if (busy.has(aUid) || busy.has(bUid)) return null;
  const queued = queuedCats();
  if (queued.has(aUid) || queued.has(bUid)) return null;
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
  const mutation = rollMutation(aUid, bUid);
  const job: ResonanceJob = { id: G.uid('r'), a: aUid, b: bUid, result, rarity, timerId: '', mutation, ready: false };
  const t = G.startTimer('resonance', job.id, ms, `${a.name} + ${b.name}`, 'discovery');
  job.timerId = t.id;
  G.s.resonance.jobs.push(job);
  G.count('resonance_start');
  return job;
}

// ---------------------------------------------------------------- mutations (GDD 2.5 / 2.6 rule 8; design, not simulated)
/** KL20 "Mutaciones": 8% per resonance, x2 if both parents live in the same habitat; habitat element biases which one */
export const MUTATION_RULES = { kl: 20, chance: 0.08, sameHabitatMult: 2, biasPerParent: 3 };
export interface MutationOdds {
  unlocked: boolean;
  /** 0..1 */
  chance: number;
  sameHabitat: boolean;
  /** habitat elements of the parents that bias the draw */
  biasEls: string[];
  /** each mutation's share of the draw (0..1), sorted desc */
  table: { mut: MutationDef; p: number }[];
}
function habitatEl(uid: string) {
  const c = getCat(uid);
  return c?.habitat ? (G.s.habitats.find((h) => h.id === c.habitat)?.element ?? null) : null;
}
export function mutationOdds(aUid: string, bUid: string): MutationOdds {
  const a = getCat(aUid);
  const b = getCat(bUid);
  const forced = G.has('luna_resonancia');
  const unlocked = forced || G.s.kl >= MUTATION_RULES.kl;
  const sameHabitat = !!a?.habitat && a.habitat === b?.habitat;
  const chance = !unlocked ? 0 : forced ? 1 : Math.min(1, MUTATION_RULES.chance * (sameHabitat ? MUTATION_RULES.sameHabitatMult : 1));
  const els = [habitatEl(aUid), habitatEl(bUid)];
  const pool = MUTATIONS.filter((m) => (m.weight ?? 0) > 0);
  const w = pool.map((m) => {
    const hits = m.habitatBias ? els.filter((e) => e === m.habitatBias).length : 0;
    return (m.weight ?? 0) * (1 + MUTATION_RULES.biasPerParent * hits);
  });
  const tot = w.reduce((x, y) => x + y, 0) || 1;
  const table = pool.map((mut, i) => ({ mut, p: w[i] / tot })).sort((x, y) => y.p - x.p);
  return { unlocked, chance, sameHabitat, biasEls: [...new Set(els.filter((e): e is string => !!e))], table };
}
function rollMutation(aUid: string, bUid: string) {
  const o = mutationOdds(aUid, bUid);
  if (!o.unlocked || Math.random() >= o.chance || !o.table.length) return null;
  let r = Math.random();
  for (const row of o.table) {
    r -= row.p;
    if (r <= 0) return row.mut.id;
  }
  return o.table[0].mut.id;
}

G.onTimer('resonance', (t) => {
  const job = G.s.resonance.jobs.find((j) => j.id === t.ref);
  if (job) job.ready = true;
});

export interface RevealOutcome {
  cat: import('../game').OwnedCat | null;
  isNew: boolean;
  orbs: number;
  job: ResonanceJob;
  /** rolled trait of the newborn (70% species · 30% random · KL30 inheritance) */
  trait: string;
  inherited: boolean;
  /** duplicate that brought a mutation: id of the pending choice (orbs vs transfer) */
  mutChoice?: string;
}
/** Reveal a finished job: adopt, convert to orbs, or (duplicate + mutation) leave a choice pending. */
export function reveal(jobId: string): RevealOutcome | null {
  const job = G.s.resonance.jobs.find((j) => j.id === jobId);
  if (!job || !job.ready) return null;
  G.s.resonance.jobs = G.s.resonance.jobs.filter((j) => j !== job);
  const isNew = G.s.catdex[job.result] !== 'registered';
  const tr = rollTrait(job.result, [getCat(job.a), getCat(job.b)]);
  const st = collState();
  recordCross(job.a, job.b, job.result, isNew);
  G.xp('hatch', job.rarity);
  G.count('resonance_hatch');
  if (!isNew && job.mutation) {
    const orbs = duplicateOrbs(catDef(job.result).rarity);
    const id = G.uid('m');
    collState().mutChoices.push({ id, species: job.result, mutation: job.mutation, orbs });
    G.xp('hatch', job.rarity, 0.5);
    return { cat: null, isNew: false, orbs, job, trait: tr.trait, inherited: false, mutChoice: id };
  }
  const res = adopt(job.result, { mutation: job.mutation, trait: tr.trait });
  if (res.cat && tr.inherited) G.count('inherit_trait');
  return { ...res, job, trait: tr.trait, inherited: !!res.cat && tr.inherited };
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
