/**
 * STUB post-Parte III cats for the tests ONLY (never shipped: data/postp3/especies.json stays as it is). A stub is a deep
 * clone of a real species with a new id, its rarity and its `post` block, pushed into CATS / CAT_BY_ID the way
 * data/content.ts merges data/postp3/especies.json (appended last); `inject` returns the undo.
 */
import { CATS, CAT_BY_ID, type CatDef } from '../../src/data/content';
import { POST_CHAMPIONS, type PostChampion } from '../../src/data/postp3/reglas';
import { isPostCat } from '../../src/state/sys/multidim';

export function stubPostCat(id: string, baseId: string, source: string, o: { weight?: number; rarity?: string; elements?: string[]; vitrina?: string; star?: boolean } = {}): CatDef {
  const base = CAT_BY_ID.get(baseId);
  if (!base) throw new Error(`no hay ${baseId}`);
  const def = JSON.parse(JSON.stringify(base)) as CatDef & { p3?: unknown; origin?: string };
  delete def.p3;
  delete def.origin;
  def.id = id;
  def.name = `Stub ${id}`;
  def.secret = false;
  if (o.rarity) def.rarity = o.rarity as CatDef['rarity'];
  if (o.elements) {
    def.elements = [...o.elements];
    def.combat.shot.element = o.elements[0];
  }
  def.obtain = { source: `post:${source.split(':')[0]}`, how: 'Stub de prueba.' };
  def.post = { source, weight: o.weight ?? 1 };
  if (o.vitrina) def.post.vitrina = o.vitrina;
  if (o.star) def.post.star = true;
  return def;
}

/** append stubs to the catalog (after every real species, like the post module); returns the undo */
export function injectPostCats(defs: CatDef[]): () => void {
  for (const d of defs) {
    if (CAT_BY_ID.has(d.id)) throw new Error(`${d.id} ya existe`);
    CATS.push(d);
    CAT_BY_ID.set(d.id, d);
  }
  return () => {
    for (const d of defs) {
      const i = CATS.indexOf(d);
      if (i >= 0) CATS.splice(i, 1);
      CAT_BY_ID.delete(d.id);
    }
  };
}

/** declare stub Podio champions; returns the undo */
export function injectChampions(list: PostChampion[]): () => void {
  POST_CHAMPIONS.push(...list);
  return () => {
    for (const c of list) {
      const i = POST_CHAMPIONS.indexOf(c);
      if (i >= 0) POST_CHAMPIONS.splice(i, 1);
    }
  };
}

/**
 * Take the SHIPPED post cats (data/postp3/especies.json, landing with their art) out of the catalog for a test that
 * needs exact stub pools; returns the undo (they come back in their place).
 */
export function hideShippedPostCats(): () => void {
  const hidden = CATS.map((c, i) => [c, i] as const).filter(([c]) => isPostCat(c));
  for (const [c] of [...hidden].reverse()) {
    CATS.splice(CATS.indexOf(c), 1);
    CAT_BY_ID.delete(c.id);
  }
  return () => {
    for (const [c, i] of hidden) {
      CATS.splice(i, 0, c);
      CAT_BY_ID.set(c.id, c);
    }
  };
}
