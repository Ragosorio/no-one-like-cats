/**
 * DESPUÉS DE LA PARTE III · the post cats' data, checked when the content loads (data/content.ts) and by the tests.
 * Pure: it gets the cats and what they may point at, and returns the problems (Spanish, one line each). Every
 * `balance:…` reference must resolve to a number in balance.json and every `roles.<id>.hp` to a role, so a cat of a
 * rarity or role without its table never computes a silent NaN (the rule of tests/rarityFinite.test.ts).
 */
import { POST_CASINO, VITRINA_TABLES, parsePostSource } from './reglas';

interface RawPostCat {
  id?: unknown;
  rarity?: unknown;
  secret?: unknown;
  elements?: unknown;
  obtain?: { source?: unknown };
  post?: { source?: unknown; weight?: unknown; vitrina?: unknown };
  p3?: unknown;
  combat?: { shot?: { element?: unknown } };
  [k: string]: unknown;
}

export interface PostCatRefs {
  /** balance.json (the `balance:` references resolve inside it) */
  balance: Record<string, unknown>;
  roles: readonly string[];
  elements: readonly string[];
}

/** every string value of a JSON tree, with its path */
function strings(v: unknown, path: string, out: [string, string][]) {
  if (typeof v === 'string') out.push([path, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => strings(x, `${path}[${i}]`, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) strings(x, path ? `${path}.${k}` : k, out);
  return out;
}
function dig(o: unknown, keys: string[]): unknown {
  let cur = o;
  for (const k of keys) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}

export function validatePostCats(cats: readonly RawPostCat[], refs: PostCatRefs): string[] {
  const out: string[] = [];
  const rarities = Object.keys((refs.balance.rarities as { gold_base_per_s?: Record<string, number> })?.gold_base_per_s ?? {});
  const seen = new Set<string>();
  const champs = new Map<string, string>();
  for (const c of cats) {
    const id = typeof c.id === 'string' ? c.id : '';
    const at = `post · ${id || '(sin id)'}`;
    if (!id) {
      out.push(`${at}: le falta el id`);
      continue;
    }
    if (seen.has(id)) out.push(`${at}: id repetido`);
    seen.add(id);
    if (c.p3 !== undefined) out.push(`${at}: un gato post no lleva bloque p3`);
    if (c.secret) out.push(`${at}: un gato post no puede ser secreto (su tabla lo nombra)`);
    if (typeof c.rarity !== 'string' || !rarities.includes(c.rarity)) out.push(`${at}: rareza desconocida «${String(c.rarity)}»`);
    const src = parsePostSource(c.post?.source);
    if (!src) out.push(`${at}: post.source inválido «${String(c.post?.source)}» (casino:<mesa>[:<sub>] o podio:<campeón>)`);
    const w = c.post?.weight;
    if (typeof w !== 'number' || !Number.isFinite(w) || w <= 0) out.push(`${at}: post.weight tiene que ser un número mayor que 0`);
    if (typeof c.obtain?.source !== 'string' || !c.obtain.source.startsWith('post:')) out.push(`${at}: obtain.source tiene que empezar con 'post:'`);
    if (src?.kind === 'casino' && (c.rarity === 'heroic' || c.rarity === 'divine')) out.push(`${at}: el casino nunca da un ${c.rarity} (los Heroicos son del Podio)`);
    // its showcase: one of the coin tables (it ALSO lives in its big table) or the big table's own name; never a Heroico
    const vit = c.post?.vitrina;
    if (vit !== undefined && !(typeof vit === 'string' && (vit in VITRINA_TABLES || vit in POST_CASINO))) out.push(`${at}: post.vitrina desconocida «${String(vit)}» (${[...Object.keys(VITRINA_TABLES), ...Object.keys(POST_CASINO)].join(', ')})`);
    if (vit !== undefined && src?.kind === 'podio') out.push(`${at}: un gato del Podio no va en una vitrina`);
    if (src?.kind === 'podio') {
      if (champs.has(src.champion)) out.push(`${at}: el campeón «${src.champion}» ya paga a ${champs.get(src.champion)}`);
      champs.set(src.champion, id);
    }
    const els = Array.isArray(c.elements) ? c.elements : [];
    if (!els.length) out.push(`${at}: le faltan elementos`);
    for (const e of els) if (!refs.elements.includes(String(e))) out.push(`${at}: elemento desconocido «${String(e)}»`);
    const shotEl = c.combat?.shot?.element;
    if (shotEl !== undefined && !refs.elements.includes(String(shotEl))) out.push(`${at}: el tiro usa un elemento desconocido «${String(shotEl)}»`);
    for (const [path, v] of strings(c, '', [])) {
      if (v.startsWith('balance:')) {
        const n = dig(refs.balance, v.slice(8).split('.'));
        if (typeof n !== 'number' || !Number.isFinite(n)) out.push(`${at}: ${path} = «${v}» no existe en balance.json`);
      } else if (/^roles\.[a-z_]+\.hp$/.test(v) && !refs.roles.includes(v.split('.')[1])) out.push(`${at}: ${path} = «${v}»: ese rol no existe`);
    }
  }
  return out;
}
