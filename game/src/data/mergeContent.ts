/**
 * Append-only merge of content modules (Parte II and later): arrays concatenate, plain objects merge
 * key by key (recursively), and a scalar may only be set where the base has nothing. Overwriting an
 * existing Part I value is refused (thrown in dev/tests, ignored in prod) — expansions add, never edit.
 * An array item whose `id` already exists in the base is refused the same way (ids are forever).
 */
type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);

export class ContentConflict extends Error {}

function fail(msg: string) {
  const env = (import.meta as { env?: { DEV?: boolean; MODE?: string } }).env;
  const dev = !env || env.DEV || env.MODE === 'test';
  if (dev) throw new ContentConflict(msg);
  console.warn('[content]', msg);
}

function mergeInto(dst: Obj, src: Obj, path: string) {
  for (const [k, v] of Object.entries(src)) {
    if (k.startsWith('$')) continue; // $comment, $schema…: notes for humans
    const at = path ? `${path}.${k}` : k;
    const cur = dst[k];
    if (cur === undefined) {
      dst[k] = v;
    } else if (Array.isArray(cur) && Array.isArray(v)) {
      const ids = new Set(cur.map((x) => (isObj(x) ? x.id : undefined)).filter((x) => x !== undefined));
      for (const item of v) {
        if (isObj(item) && item.id !== undefined && ids.has(item.id)) {
          fail(`${at}: id "${String(item.id)}" ya existe en el contenido base`);
          continue;
        }
        cur.push(item);
      }
    } else if (isObj(cur) && isObj(v)) {
      mergeInto(cur, v, at);
    } else if (cur !== v) {
      fail(`${at}: no se puede sobrescribir un valor de la Parte I`);
    }
  }
}

export function mergeContent<T extends Obj>(base: T, ...mods: Obj[]): T {
  for (const m of mods) mergeInto(base, m, '');
  return base;
}
