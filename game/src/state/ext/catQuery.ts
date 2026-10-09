/**
 * One way to search, filter and sort OWNED cats, shared by every screen that lists them
 * (Santuario, crew picker, Catdex "tus gatos", Podio…). Pure reads over G.s — no UI here.
 *
 *   queryCats({ text: 'medi', elements: ['shadow'], sort: 'power' })
 *
 * Text search ignores case and accents and matches the cat's own name, its species name and its
 * epithet ("medianoche", "Medianoche", "rey de las doce" all find Medianoche).
 */
import { G, OwnedCat } from '../game';
import { CatDef, catDef, SHIP_BY_ID } from '../../data/content';
import { BAL, RarityId } from '../econ';
import { catPow } from '../sys/cats';
import { habitat } from '../sys/island';
import { busyCats } from '../sys/resonance';
import { catBusy, resonanceQueue } from '../sys/workforce';
import { ELEMENT_NAME } from '../../data/elementsMeta';

export type CatSort = 'power' | 'level' | 'name' | 'rarity' | 'recent' | 'stars';
export const SORT_LABEL: Record<CatSort, string> = {
  power: 'PODER',
  level: 'NIVEL',
  rarity: 'RAREZA',
  stars: 'ESTRELLAS',
  recent: 'RECIENTES',
  name: 'NOMBRE',
};
export type CatPlace = 'any' | 'home' | 'homeless' | 'ship' | 'free';

export interface CatQuery {
  text?: string;
  /** cats having ANY of these elements (empty = all) */
  elements?: string[];
  rarities?: RarityId[];
  minLevel?: number;
  place?: CatPlace;
  sort?: CatSort;
  /** default: descending for power/level/rarity/stars/recent, ascending for name */
  asc?: boolean;
  /** restrict to these uids (e.g. eligible cats of a screen) */
  only?: Iterable<string>;
}

/** lowercase, no accents, collapsed spaces: "Áurea  la Primera" → "aurea la primera" */
export function fold(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function rarityRankOf(def: CatDef) {
  const order = BAL.rarities.order as string[];
  return order.indexOf(def.rarity) + (def.primordial ? 0.5 : 0);
}

export interface CatWhere {
  habitatId: string | null;
  /** ships whose crew includes the cat */
  ships: string[];
  busy: 'resonating' | 'queued' | 'worker' | 'expedition' | null;
  /** one short human line: "Hábitat de Sombra · Bajel Arcano" */
  label: string;
}

/** Where a cat is right now: its home, the ships it sails on and what keeps it busy. */
export function catWhere(uid: string): CatWhere {
  const c = G.s.cats.find((x) => x.uid === uid);
  const ships = Object.entries(G.s.ship.crew)
    .filter(([id, crew]) => G.s.ship.owned.includes(id) && crew.includes(uid))
    .map(([id]) => id);
  let busy: CatWhere['busy'] = null;
  if (busyCats().has(uid)) busy = 'resonating';
  else if (resonanceQueue().some((q) => q.a === uid || q.b === uid)) busy = 'queued';
  else busy = catBusy(uid);
  const h = c?.habitat ? habitat(c.habitat) : null;
  const parts: string[] = [];
  parts.push(h ? `Hábitat de ${elementWord(h.element)}` : 'Sin casa');
  for (const s of ships) parts.push(SHIP_BY_ID.get(s)?.name ?? s);
  if (busy) parts.push(BUSY_LABEL[busy]);
  return { habitatId: h?.id ?? null, ships, busy, label: parts.join(' · ') };
}
const BUSY_LABEL: Record<NonNullable<CatWhere['busy']>, string> = {
  resonating: 'resonando',
  queued: 'en la cola',
  worker: 'trabajando',
  expedition: 'de expedición',
};
function elementWord(id: string) {
  const n = ELEMENT_NAME[id] ?? id;
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
}

function matches(c: OwnedCat, def: CatDef, q: CatQuery, needle: string) {
  if (needle) {
    const hay = fold(`${c.name} ${def.name} ${def.epithet ?? ''}`);
    if (!needle.split(' ').every((w) => hay.includes(w))) return false;
  }
  if (q.elements?.length && !def.elements.some((e) => q.elements!.includes(e))) return false;
  if (q.rarities?.length && !q.rarities.includes(def.rarity as RarityId)) return false;
  if (q.minLevel && c.level < q.minLevel) return false;
  switch (q.place ?? 'any') {
    case 'home':
      return !!c.habitat;
    case 'homeless':
      return !c.habitat;
    case 'ship':
      return Object.entries(G.s.ship.crew).some(([id, crew]) => G.s.ship.owned.includes(id) && crew.includes(c.uid));
    case 'free':
      return !catWhere(c.uid).busy;
    default:
      return true;
  }
}

export function sortCats(list: OwnedCat[], sort: CatSort = 'power', asc?: boolean): OwnedCat[] {
  const key = (c: OwnedCat): number | string => {
    const def = catDef(c.species);
    switch (sort) {
      case 'power':
        return catPow(c);
      case 'level':
        return c.level * 10 + c.stars;
      case 'rarity':
        return rarityRankOf(def) * 1e6 + catPow(c);
      case 'stars':
        return c.stars * 1e3 + c.level;
      case 'recent':
        return c.bornAtMs;
      case 'name':
        return fold(c.name);
    }
  };
  const up = asc ?? sort === 'name';
  return [...list].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    const d = typeof ka === 'string' ? ka.localeCompare(kb as string, 'es') : (ka as number) - (kb as number);
    return (up ? d : -d) || a.uid.localeCompare(b.uid);
  });
}

/** filter + sort the player's cats */
export function queryCats(q: CatQuery = {}): OwnedCat[] {
  const only = q.only ? new Set(q.only) : null;
  const needle = fold(q.text ?? '');
  const hits = G.s.cats.filter((c) => (!only || only.has(c.uid)) && matches(c, catDef(c.species), q, needle));
  return sortCats(hits, q.sort ?? 'power', q.asc);
}

/** elements present among some cats (for filter chips that never show an empty option) */
export function elementsAmong(cats: OwnedCat[]): string[] {
  const order = G.s.elements;
  const set = new Set(cats.flatMap((c) => catDef(c.species).elements));
  return [...order.filter((e) => set.has(e)), ...[...set].filter((e) => !order.includes(e))];
}
