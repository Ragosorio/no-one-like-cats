/**
 * FONOTECA state: which songs/versions the player unlocked, favorites, «Música de la isla».
 * Lives in G.s.ext.music (musicSave.ts) + a mirror outside the save (localStorage 'nolc-fonoteca') so a
 * collection survives the Parte II narrative reset or restoring an older backup: the mirror is merged
 * back (union, never subtracting) whenever a Part II save loads.
 */
import { G } from '../state/game';
import { MusicExt, MusicUnlock, RepeatMode, defaultMusicExt, mergeUnlocks, normalizeMusicExt, songOf } from './musicSave';

const MIRROR = 'nolc-fonoteca';
/** Parte II = H30 «Fin» done (same rule as state/sys/rupturas.ts › partIIOpen) */
export const partII = () => G.s.missions.done.includes('H30');

/** the save's Fonoteca (create = store a fresh one when the save has none) */
export function musicExt(create = false): MusicExt {
  const cur = G.s.ext?.music;
  if (cur && typeof cur === 'object') return cur as MusicExt;
  const fresh = defaultMusicExt();
  if (create) (G.s.ext ??= {}).music = fresh;
  return fresh;
}

export interface UnlockEvent {
  ref: string;
  song: string;
  source: string;
  /** first version of this song ever unlocked (the big animation) */
  firstOfSong: boolean;
}
const listeners = new Set<(e: UnlockEvent) => void>();
export function onSongUnlock(fn: (e: UnlockEvent) => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

function readMirror(): { unlocked: Record<string, MusicUnlock>; favorites: string[] } | null {
  try {
    const raw = localStorage.getItem(MIRROR);
    if (!raw) return null;
    const m = normalizeMusicExt(JSON.parse(raw));
    return { unlocked: m.unlocked, favorites: m.favorites };
  } catch {
    return null;
  }
}
function writeMirror(m: MusicExt) {
  try {
    const prev = readMirror();
    const unlocked = { ...(prev?.unlocked ?? {}) };
    mergeUnlocks(unlocked, m.unlocked);
    localStorage.setItem(MIRROR, JSON.stringify({ unlocked, favorites: m.favorites }));
  } catch {
    /* storage unavailable: the save still has it */
  }
}

/** merge the mirror into a Part II save (after load). Returns how many unlocks came back. */
export function restoreFromMirror(): number {
  if (!partII()) return 0;
  const mir = readMirror();
  if (!mir || !Object.keys(mir.unlocked).length) return 0;
  const m = musicExt(true);
  const n = mergeUnlocks(m.unlocked, mir.unlocked);
  for (const f of mir.favorites) if (!m.favorites.includes(f)) m.favorites.push(f);
  // already-celebrated songs don't celebrate again
  for (const k of Object.keys(mir.unlocked)) if (!m.toasted.includes(songOf(k))) m.toasted.push(songOf(k));
  return n;
}
G.afterLoad.push(() => {
  try {
    restoreFromMirror();
  } catch (e) {
    console.error('[fonoteca] mirror', e);
  }
});

/** unlock a song or version (idempotent). True when it was new. */
export function unlockSong(ref: string, source = ''): boolean {
  const id = typeof ref === 'string' ? ref.trim() : '';
  if (!id) return false;
  const m = musicExt(true);
  if (m.unlocked[id]) return false;
  const song = songOf(id);
  const firstOfSong = !Object.keys(m.unlocked).some((k) => songOf(k) === song);
  m.unlocked[id] = { at: Date.now(), source: String(source ?? '').slice(0, 120) };
  const celebrate = firstOfSong && !m.toasted.includes(song);
  if (celebrate) m.toasted.push(song);
  writeMirror(m);
  // persist right away (an unlock must survive a crash) — only a loaded save, never the title's blank state
  if (G.loaded) G.save();
  const e: UnlockEvent = { ref: id, song, source: m.unlocked[id].source, firstOfSong: celebrate };
  for (const fn of [...listeners]) {
    try {
      fn(e);
    } catch (err) {
      console.error('[fonoteca] listener', err);
    }
  }
  return true;
}

export const isUnlocked = (ref: string) => !!musicExt().unlocked[ref];
/** any version of the song unlocked */
export const songUnlocked = (song: string) => Object.keys(musicExt().unlocked).some((k) => songOf(k) === song);
/** unlocked refs of a song (original first) */
export function unlockedRefs(song: string): string[] {
  return Object.keys(musicExt().unlocked)
    .filter((k) => songOf(k) === song)
    .sort((a, b) => (a === song ? -1 : b === song ? 1 : a.localeCompare(b)));
}
export const unlockedCount = () => Object.keys(musicExt().unlocked).length;
export const unlockInfo = (ref: string): MusicUnlock | null => musicExt().unlocked[ref] ?? null;
/** the Fonoteca's HUD entry: Part II and at least one song */
export const fonotecaAvailable = () => partII() && unlockedCount() > 0;

export const isFavorite = (song: string) => musicExt().favorites.includes(song);
export function toggleFavorite(song: string) {
  const m = musicExt(true);
  const i = m.favorites.indexOf(song);
  if (i >= 0) m.favorites.splice(i, 1);
  else m.favorites.push(song);
  writeMirror(m);
  return i < 0;
}

/** «Música de la isla»: a ref the player unlocked, or null (the director decides) */
export const islandTrack = () => {
  const r = musicExt().islandTrack;
  return r && isUnlocked(r) ? r : null;
};
export function setIslandTrack(ref: string | null) {
  const m = musicExt(true);
  m.islandTrack = ref && isUnlocked(ref) ? ref : null;
  return m.islandTrack;
}
export function setPrefs(p: Partial<{ shuffle: boolean; repeat: RepeatMode }>) {
  const m = musicExt(true);
  Object.assign(m.prefs, p);
}
export function setLast(ref: string | null) {
  musicExt(true).last = ref;
}
