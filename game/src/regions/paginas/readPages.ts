/**
 * Which page the Isla de las Páginas Hundidas still has to give (hotfix 2026-10-10, owner: «las páginas se repiten
 * siempre; si ya leí todas no deberían aparecer otra vez»). Pure: no Pixi, no three.js (tests import it).
 *
 *  - the eight DIARIO PERDIDO pages come first, in order. A page counts as read when its story flag is set
 *    (`pagina_leida:<n>`) OR it was read in an earlier pass of the story (the ledger key `pagina:<n>`: the narrative
 *    reset clears the flags, but the player already read those words — they don't come back);
 *  - then each LOOSE page once (optional flags `pagina_suelta:<i>`, never cleared by the reset);
 *  - then nothing: no more pages float on the island.
 */
export const DIARIO_PAGES = 8;
export const looseFlag = (i: number) => `pagina_suelta:${i}`;

export type NextPage = { kind: 'diario'; n: number } | { kind: 'loose'; i: number } | null;

export interface PageReader {
  has(flag: string): boolean;
  claimed(key: string): boolean;
}

export function diarioRead(n: number, r: PageReader) {
  return r.has(`pagina_leida:${n}`) || r.claimed(`pagina:${n}`);
}

export function nextPage(r: PageReader, loose: number, diario = DIARIO_PAGES): NextPage {
  for (let n = 1; n <= diario; n++) if (!diarioRead(n, r)) return { kind: 'diario', n };
  for (let i = 0; i < loose; i++) if (!r.has(looseFlag(i))) return { kind: 'loose', i };
  return null;
}

/** how many pages are still left to read (the island floats at most this many) */
export function pagesLeft(r: PageReader, loose: number, diario = DIARIO_PAGES): number {
  let n = 0;
  for (let k = 1; k <= diario; k++) if (!diarioRead(k, r)) n++;
  for (let i = 0; i < loose; i++) if (!r.has(looseFlag(i))) n++;
  return n;
}
