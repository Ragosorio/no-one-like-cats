/**
 * PELÍCULAS — the registry (pure): films register their FilmDef here (film/films.ts lists them).
 */
import type { FilmDef } from './types';

const FILMS = new Map<string, FilmDef>();
export function registerFilm(def: FilmDef) {
  FILMS.set(def.id, def);
}
/**
 * A film by id. Ids are lowercase (validateFilm); a stage's data may name it in capitals (`stages[].film: "F01"`, as in
 * historia-v2/03-peliculas.md), so an exact miss retries in lowercase (FILM-ACTO1, backward compatible).
 */
export const getFilm = (id: string) => FILMS.get(id) ?? FILMS.get(id.toLowerCase()) ?? null;
export const filmIds = () => [...FILMS.keys()];
