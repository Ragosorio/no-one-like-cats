/**
 * Collection helpers (Resonancia · Catdex · Altar de Almas) — read-only views over the state
 * plus display copy. Owned by the COLECCIÓN module; never mutates economy rules.
 */
import { G, OwnedCat, ResonanceJob } from '../game';
import { CATS, CONTENT, ELEMENTS, ELEMENT_BY_ID, ROLE_BY_ID, catDef, CatDef, ElementDef } from '../../data/content';
import { BAL, RarityId, catGoldPerSec, catPower, starMinLevel, starMult } from '../econ';
import { cat as getCat, starNeed, canStarUp, speciesCount } from '../sys/cats';
import { busyCats, revealCopy } from '../sys/resonance';

export type PrintRarity = RarityId | 'primordial';

/** rarity used for the "print quality" (Primordial legendaries print black-with-noise) */
export function printRarity(species: string): PrintRarity {
  const d = catDef(species);
  return d.primordial ? 'primordial' : d.rarity;
}

export const RARITY_ORDER: PrintRarity[] = ['common', 'rare', 'epic', 'legendary', 'primordial', 'mythic'];
export function rarityRank(r: PrintRarity) {
  return RARITY_ORDER.indexOf(r);
}

// ---------------------------------------------------------------- elements
export function elementDef(id: string): ElementDef | undefined {
  return ELEMENT_BY_ID.get(id);
}
export function elEmoji(id: string) {
  return ELEMENT_BY_ID.get(id)?.emoji ?? '❔';
}
export function elName(id: string) {
  return (ELEMENT_BY_ID.get(id)?.name ?? id).toUpperCase();
}
/** main color of an element (palette from content) */
export function elColor(id: string): number {
  const MAIN: Record<string, number> = {
    fire: 0xff6a1a,
    water: 0x3569a3,
    nature: 0x5fbf4a,
    earth: 0xa8743f,
    storm: 0xffd400,
    magic: 0x8f6b93,
    cosmic: 0x8a5cff,
    void: 0xff2e88,
  };
  return MAIN[id] ?? 0x9a8f80;
}
export function isElementKnown(id: string) {
  return G.s.elements.includes(id);
}
/** the chapter's catdex element row (void only once discovered) */
export function dexElements(): ElementDef[] {
  return [...ELEMENTS].filter((e) => !e.unlock.startsWith('chapter') || isElementKnown(e.id)).sort((a, b) => a.order - b.order);
}

// ---------------------------------------------------------------- catdex
export function dexTotal() {
  return CATS.length;
}
export function dexCount() {
  return speciesCount();
}
export function ownedOf(species: string): OwnedCat | undefined {
  return G.s.cats.filter((c) => c.species === species).sort((a, b) => b.stars - a.stars || b.level - a.level)[0];
}
export function roleName(def: CatDef) {
  return ROLE_BY_ID.get(def.role)?.name ?? def.role;
}
export function traitInfo(id: string) {
  return CONTENT.traits.find((t) => t.id === id);
}
export function workerName(id: string | null) {
  if (!id) return null;
  const w = (CONTENT as unknown as { workers: Record<string, { name: string; desc: string }> }).workers?.[id];
  return w?.name ?? id;
}
export function mutationInfo(id: string | null) {
  if (!id) return null;
  const list = (CONTENT as unknown as { mutations: { id: string; name: string; effect: string }[] }).mutations ?? [];
  return list.find((m) => m.id === id) ?? null;
}
export function limitationText(def: CatDef): string | null {
  const l = def.combat.limitation as unknown;
  if (!l) return null;
  if (typeof l === 'string') return l;
  return (l as { text?: string }).text ?? null;
}
/** human "possible parents" line for rumors */
export function possibleParents(def: CatDef): string {
  if (def.secret) return def.hint ?? 'Nadie sabe. Literalmente nadie.';
  return def.obtain.how;
}
export function hintFor(def: CatDef): string | null {
  return def.hint;
}

/** reaction discovery: battle flags `reaction_<NAME>` with the name as shouted in battle */
const REACTION_ALIASES: Record<string, string[]> = {
  conduccion: ['CONDUCCIÓN', 'CONDUCCION'],
  vapor: ['VAPOR', 'EXTINGUIDO'],
  ventisca: ['VENTISCA', 'MAR HELADO'],
  lluvia_escombros: ['LLUVIA DE ESCOMBROS'],
  devorar: ['DEVORAR'],
};
export function reactionKnown(r: { id: string; name: string }) {
  const keys = new Set<string>([
    r.name,
    r.name.toUpperCase(),
    r.id,
    r.id.toUpperCase(),
    r.name.replace(/\s*\(.*\)\s*/g, '').toUpperCase(),
    ...(REACTION_ALIASES[r.id] ?? []),
  ]);
  for (const k of keys) if (G.s.flags[`reaction_${k}`]) return true;
  return false;
}

// ---------------------------------------------------------------- resonance
export function pickerCats() {
  const busy = busyCats();
  return [...G.s.cats]
    .map((c) => ({ cat: c, def: catDef(c.species), busy: busy.has(c.uid) }))
    .sort((a, b) => Number(a.busy) - Number(b.busy) || rarityRank(printRarity(b.cat.species)) - rarityRank(printRarity(a.cat.species)) || b.cat.level - a.cat.level);
}

/** Canelo + Brote while the tutorial resonance (mission H06) is pending */
export function tutorialPair(): [string, string] | null {
  if (G.s.resonance.tutorialDone) return null;
  if (!G.s.missions.active.includes('H06')) return null;
  const busy = busyCats();
  const a = G.s.cats.find((c) => c.species === 'c_canelo' && !busy.has(c.uid));
  const b = G.s.cats.find((c) => c.species === 'c_brote' && !busy.has(c.uid));
  return a && b ? [a.uid, b.uid] : null;
}
export function isTutorialResonance() {
  return !G.s.resonance.tutorialDone;
}
export const TUTORIAL_RESONANCE_MS = 90000;

/** "Vapor Ronin: ambos padres Nv15+" → + " — te faltan 3 niveles en Gelatino" */
export function missingDetail(text: string, aUid: string, bUid: string): string {
  const m = /Nv(\d+)\+/.exec(text);
  if (!m) return text;
  const need = Number(m[1]);
  const gaps: { n: number; name: string }[] = [];
  for (const uid of [aUid, bUid]) {
    const c = getCat(uid);
    if (c && c.level < need) gaps.push({ n: need - c.level, name: c.name });
  }
  if (!gaps.length) return text;
  const first = `${gaps[0].n} nivel${gaps[0].n === 1 ? '' : 'es'} en ${gaps[0].name}`;
  const rest = gaps[1] ? ` y ${gaps[1].n} en ${gaps[1].name}` : '';
  return `${text} — te ${gaps[0].n === 1 && !gaps[1] ? 'falta' : 'faltan'} ${first}${rest}`;
}

export interface JobView {
  job: ResonanceJob;
  p: number;
  leftMs: number;
  totalMs: number;
  phase: 'resonando' | 'eclosionando' | 'listo';
  /** progress inside the current phase 0..1 */
  phaseP: number;
}
export function jobView(job: ResonanceJob): JobView {
  const t = job.ready ? undefined : G.timer(job.timerId);
  const totalMs = t?.totalMs ?? 1;
  const leftMs = t ? Math.max(0, t.leftMs) : 0;
  const p = job.ready || !t ? 1 : 1 - leftMs / totalMs;
  const split = 1 - BAL.resonance.hatch_share_of_time;
  if (job.ready || !t) return { job, p: 1, leftMs: 0, totalMs, phase: 'listo', phaseP: 1 };
  if (p < split) return { job, p, leftMs, totalMs, phase: 'resonando', phaseP: p / split };
  return { job, p, leftMs, totalMs, phase: 'eclosionando', phaseP: (p - split) / (1 - split) };
}
export function readyJobs() {
  return G.s.resonance.jobs.filter((j) => j.ready);
}
export function parentNames(job: ResonanceJob) {
  return [getCat(job.a)?.name ?? '¿?', getCat(job.b)?.name ?? '¿?'] as const;
}

// ---------------------------------------------------------------- reveal copy
export interface RevealInfo {
  species: string;
  name: string;
  rarity: PrintRarity;
  elements: string[];
  caption: string;
  subtitle: string;
  isNew: boolean;
  orbs: number;
  /** duplicate star bar */
  dup?: { before: number; after: number; need: number; star: number; missing: number; ready: boolean; minLevel: number };
  dex: [number, number, number];
  chips: string[];
  mutation: string | null;
  secret: boolean;
}
type RevealCopy = Record<string, string | string[]>;
function pickCopy(key: string) {
  const rc = CONTENT.resonanceRules.revealCopy as RevealCopy;
  const v = rc[key] ?? rc.common;
  const list = Array.isArray(v) ? v : [v];
  return list[Math.floor(Math.random() * list.length)];
}
export function revealInfo(species: string, isNew: boolean, orbs: number, mutation: string | null = null): RevealInfo {
  const def = catDef(species);
  const rarity = printRarity(species);
  const reg = dexCount();
  const dex: [number, number, number] = [isNew ? reg - 1 : reg, reg, dexTotal()];
  let caption: string;
  let dup: RevealInfo['dup'];
  if (!isNew) {
    const owned = ownedOf(species);
    const after = G.s.orbs[species] ?? 0;
    const before = Math.max(0, after - orbs);
    const maxed = !owned || owned.stars >= BAL.cats.stars.max;
    const need = maxed ? 0 : starNeed(owned);
    const missingBefore = Math.max(0, need - before);
    if (!maxed) dup = { before, after, need, star: (owned?.stars ?? 1) + 1, missing: missingBefore, ready: owned ? canStarUp(owned) : false, minLevel: owned ? starMinLevel(owned.stars) : 0 };
    caption = pickCopy('duplicate')
      .replace('{orbs}', String(orbs))
      .replace('{name}', def.name)
      .replace('{missing}', String(Math.min(orbs, missingBefore) || orbs));
  } else {
    caption = def.secret ? pickCopy('secret').replace('{name}', def.name) : revealCopy(def.rarity, def.name);
  }
  const chips = [roleName(def).toUpperCase(), (traitInfo(def.trait)?.name ?? def.trait).toUpperCase(), def.combat.shot.name.toUpperCase()];
  return {
    species,
    name: def.name,
    rarity,
    elements: def.elements,
    caption,
    subtitle: `${roleName(def).toUpperCase()} · ${def.combat.ultimate.name}`,
    isNew,
    orbs,
    dup,
    dex,
    chips,
    mutation: mutationInfo(mutation)?.name ?? null,
    secret: def.secret,
  };
}

// ---------------------------------------------------------------- stars (Altar)
export interface StarInfo {
  cat: OwnedCat;
  max: boolean;
  next: number;
  need: number;
  own: number;
  prisma: number;
  prismaUse: number;
  minLevel: number;
  levelOk: boolean;
  orbsOk: boolean;
  can: boolean;
  unlockKey: string;
  unlockText: string;
  powerNow: number;
  powerNext: number;
  goldNow: number;
  goldNext: number;
  hpNow: number;
}
export function starInfo(c: OwnedCat): StarInfo {
  const def = catDef(c.species);
  const max = c.stars >= BAL.cats.stars.max;
  const next = Math.min(BAL.cats.stars.max, c.stars + 1);
  const need = max ? 0 : starNeed(c);
  const own = G.s.orbs[c.species] ?? 0;
  const prisma = G.s.prisma;
  const prismaUse = Math.max(0, Math.min(prisma, need - own));
  const minLevel = max ? 0 : starMinLevel(c.stars);
  const gm = def.economy.goldMod ?? 1;
  const unlockKey = BAL.cats.stars.unlocks[next - 1] ?? '';
  return {
    cat: c,
    max,
    next,
    need,
    own,
    prisma,
    prismaUse,
    minLevel,
    levelOk: c.level >= minLevel,
    orbsOk: own + prisma >= need,
    can: canStarUp(c),
    unlockKey,
    unlockText: starUnlockText(def, next),
    powerNow: catPower(def.rarity, c.level, c.stars),
    powerNext: catPower(def.rarity, c.level, next),
    goldNow: catGoldPerSec(def.rarity, c.level, c.stars) * gm,
    goldNext: catGoldPerSec(def.rarity, c.level, next) * gm,
    hpNow: ROLE_BY_ID.get(def.role)?.hp ?? 100,
  };
}
export function starUnlockText(def: CatDef, star: number): string {
  switch (star) {
    case 2: {
      const pct = Math.round((starMult(2) / starMult(1) - 1) * 100);
      return `+${pct}% PODER y +${pct}% ORO. Más gato, mismo gato.`;
    }
    case 3:
      return def.combat.star3.replace(/^★3:\s*/, '');
    case 4:
      return `Su ataque cambia: ${def.combat.shot.name} se ve (y se siente) distinto.`;
    case 5:
      return def.combat.star5.replace(/^★5:\s*/, '');
    case 6:
      return 'FORMA ASCENDIDA. Halo, corona y paleta invertida en la ultimate.';
    default:
      return '';
  }
}
