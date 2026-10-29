/**
 * PARTE III · LAS CANCIONES (agent P3-CINE, 2026-10-29). The owner: «no hay como "canciones" a las que volver a
 * reproducir cuando debería de existir igual que en la parte dos».
 *
 * Part II's originals each power a Momento (src/momentos), listed in Ajustes › VOLVER A VER as «♪ <song>». In Part III
 * the prologue's DRUNCK is still a Momento; the other eight originals each play inside a SONG FILM (film kind 'song',
 * its track the original — whole, or its fragment). This is that list, in story order: «Volver a ver» shows a «♪» row
 * for every song whose film this save has watched (panels/Replays.ts), and the Fonoteca gets the song when its film
 * is watched (it used to stay «???» forever: only Momentos and Part II battles unlocked songs).
 *
 * Music rule kept: the originals play only in Momentos, films and the Fonoteca — a ♪ row replays the film itself.
 * Nothing new in the save: «reached» is the films' own `film:<id>` seen keys (ext.gateras.seen); the Fonoteca unlock
 * is its usual optional slice (ext.music.unlocked). Spoilers: a row only exists once its film was seen.
 */
import { G } from '../state/game';
import { gateras } from '../state/sys/gateras';

export interface P3Song {
  /** the catalog song (tracks.json id = its original's ref) */
  song: string;
  /** as the catalog titles it (Fonoteca, «Volver a ver») */
  title: string;
  /** the story mission it plays in (story order) */
  mission: string;
  /** the song film(s) that play it — variants of one moment (F25 and its Bisagra cut); the first one seen replays */
  films: string[];
  /** where the Fonoteca says it was found (spoiler-free place) */
  source: string;
}

/** the eight Part III originals that play in films (DRUNCK, H66, is a Momento: momentos/songs/drunck) */
export const P3_SONGS: readonly P3Song[] = [
  { song: 'emen', title: 'EM%EN', mission: 'H73', films: ['f06'], source: 'La Borracha · Cuadra 8' },
  { song: 'oh_shit', title: 'OH SHIT', mission: 'H74', films: ['f08'], source: 'La Borracha' },
  { song: 'daria', title: 'Daria', mission: 'H81', films: ['f16'], source: 'Mar Shōnen' },
  { song: 'no_wey', title: 'No wey', mission: 'H87', films: ['f23'], source: 'Ex Libris' },
  { song: 'distor', title: 'DISTOR', mission: 'H88', films: ['f25', 'f25_bisagra'], source: 'Ex Libris' },
  { song: 'no_game', title: 'NO G@ME NO LIF€', mission: 'H91', films: ['f29'], source: 'La Gira' },
  { song: 'xti', title: 'xti es amor', mission: 'H92', films: ['f30'], source: 'Tu isla' },
  { song: 'sadie', title: 'SADIE', mission: 'H94', films: ['f35_sadie'], source: 'Tu isla' },
];

/** the film ids that are a song's moment (Replays lists them as ♪, not twice as ▶) */
export const P3_SONG_FILMS: ReadonlySet<string> = new Set(P3_SONGS.flatMap((s) => s.films));

/** the song a film plays (null for any other film) */
export function songOfFilm(filmId: string): P3Song | null {
  const id = filmId.toLowerCase();
  return P3_SONGS.find((s) => s.films.includes(id)) ?? null;
}

/** the save's seen films (ext.gateras.seen `film:<id>`) */
function seenFilmIds(seen: readonly string[] | null | undefined): Set<string> {
  return new Set((seen ?? []).filter((k) => typeof k === 'string' && k.startsWith('film:')).map((k) => k.slice(5)));
}

/**
 * «Volver a ver»: the songs this save reached (one of their films watched or skipped), in story order, each with the
 * film that replays it. Pure given the seen list (default: this save's).
 */
export function reachedP3Songs(seen: readonly string[] | null | undefined = gateras()?.seen): { song: P3Song; film: string; order: number }[] {
  const s = seenFilmIds(seen);
  const out: { song: P3Song; film: string; order: number }[] = [];
  for (const song of P3_SONGS) {
    const film = song.films.find((f) => s.has(f));
    if (film) out.push({ song, film, order: Number(song.mission.slice(1)) || 999 });
  }
  return out.sort((a, b) => a.order - b.order);
}

// ------------------------------------------------------------------ the Fonoteca
/** never during the mourning (no jingles, no record cards: gaterasWorld.dueloActivo) */
async function mourning(): Promise<boolean> {
  try {
    const { dueloActivo } = await import('../state/sys/gaterasWorld');
    return dueloActivo();
  } catch {
    return false;
  }
}

/**
 * A song film was just watched: its song goes into the Fonoteca (idempotent; only songs the catalog knows). With its
 * record card — silently during the mourning.
 */
export async function unlockSongOfFilm(filmId: string): Promise<boolean> {
  const s = songOfFilm(filmId);
  if (!s || !G.loaded) return false;
  try {
    const [{ hasTrack }, F] = await Promise.all([import('../audio/catalog'), import('../audio/fonoteca')]);
    if (!hasTrack(s.song) || F.isUnlocked(s.song)) return false;
    return F.unlockSong(s.song, s.source, { silent: await mourning() });
  } catch (e) {
    console.warn('[canciones P3] no se pudo guardar en la Fonoteca', s.song, e);
    return false;
  }
}

/**
 * A save that watched song films before this update (or a film whose unlock was cut short): its songs go into the
 * Fonoteca quietly, with ONE note instead of a record card per song. Runs after a load.
 */
export async function syncP3Songs(o: { toast?: boolean } = {}): Promise<number> {
  if (!G.loaded) return 0;
  const reached = reachedP3Songs();
  if (!reached.length) return 0;
  try {
    const [{ hasTrack }, F] = await Promise.all([import('../audio/catalog'), import('../audio/fonoteca')]);
    let n = 0;
    for (const { song } of reached) if (hasTrack(song.song) && !F.isUnlocked(song.song) && F.unlockSong(song.song, song.source, { silent: true })) n++;
    if (n && o.toast !== false && !(await mourning())) {
      const { toast } = await import('../ui/modal');
      const { C } = await import('../ui/theme');
      toast(n === 1 ? 'UNA CANCIÓN NUEVA EN LA FONOTECA' : `${n} CANCIONES NUEVAS EN LA FONOTECA`, { icon: 'star', sub: 'Las de la Parte III que ya escuchaste.', color: C.mint, dur: 3.6 });
    }
    return n;
  } catch (e) {
    console.warn('[canciones P3] sincronizar la Fonoteca', e);
    return 0;
  }
}
// after a load, once the island has settled (the offline report and the first popups go first)
G.afterLoad.push(() => {
  if (typeof window === 'undefined') return;
  window.setTimeout(() => void syncP3Songs(), 6000);
});

// ------------------------------------------------------------------ «Volver a ver»
export interface ReplayEntry {
  id: string;
  title: string;
}
/**
 * The rows of Ajustes › VOLVER A VER, as Part II taught them — its scenes, then its songs — for both parts: the
 * prologue, Part II's scenes, Part II's ♪ Momentos, Part III's ▶ films, Part III's ♪ songs (DRUNCK's Momento and the
 * song films), each group in story order. A song film is a ♪ row, not a second ▶ row. Pure.
 */
export function replayEntries(p: {
  scenes: ReplayEntry[];
  momentos: { id: string; title: string; order: number }[];
  films: ReplayEntry[];
  songs: { song: P3Song; film: string; order: number }[];
}): ReplayEntry[] {
  const P3 = 66;
  const p3 = [
    ...p.momentos.filter((m) => m.order >= P3).map((m) => ({ id: `momento:${m.id}`, title: `♪ ${m.title}`, order: m.order })),
    ...p.songs.map((s) => ({ id: `film:${s.film}`, title: `♪ ${s.song.title}`, order: s.order })),
  ].sort((a, b) => a.order - b.order);
  return [
    { id: '__prologo', title: 'Prólogo' },
    ...p.scenes,
    ...p.momentos.filter((m) => m.order < P3).map((m) => ({ id: `momento:${m.id}`, title: `♪ ${m.title}` })),
    ...p.films.filter((f) => !P3_SONG_FILMS.has(f.id.replace(/^film:/, ''))).map((f) => ({ id: f.id, title: `▶ ${f.title}` })),
    ...p3.map(({ id, title }) => ({ id, title })),
  ];
}
