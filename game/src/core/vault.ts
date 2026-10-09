/**
 * EL BAÚL: your island must survive anything short of losing the computer.
 *
 * Four layers on top of core/save.ts (localStorage):
 *  1. History (IndexedDB): a snapshot every 10 min of play, on hide and before anything that replaces
 *     the save (paste, restore, new game). Keeps the newest 15 + one per day for 30 days. Every entry
 *     has a summary (Reino, gatos, horas) so you can tell which one is "the good one".
 *  2. A folder of yours (File System Access API, Chrome/Edge): you pick it once; the game keeps
 *     `NoOneLikeCats.nocat` (latest) and `respaldos/isla-AAAA-MM-DD.nocat` (one per day) there.
 *     Real files on your disk: clearing the browser's data can't touch them.
 *  3. `.nocat` files anywhere (download / open), also the format of the folder copies.
 *  4. `navigator.storage.persist()`: asks the browser not to evict the game's storage.
 *
 * Anti-overwrite (state/game.ts › save): one writer tab at a time (Web Locks), and never write a save
 * with LESS play time than the one already on disk (an old tab / old device copy can't erase progress).
 *
 * .nocat = readable JSON: { format: 'nocat', v: 1, game, exportedAt, summary, save: <envelope> }.
 * Importing also accepts the old base64 code and a bare envelope.
 */
import { SAVE_KEY } from './save';

export interface SaveSummary {
  name: string;
  kl: number;
  cats: number;
  species: number;
  playMin: number;
  gold: number;
  savedAt: number;
}
export interface Snap {
  id: string;
  at: number;
  reason: string;
  raw: string;
  sum: SaveSummary;
}

// ------------------------------------------------------------------ summaries / .nocat format
export function summarize(raw: string): SaveSummary | null {
  try {
    const env = JSON.parse(raw) as { savedAt?: number; state?: Record<string, unknown> };
    const s = (env.state ?? {}) as { player?: { name?: string }; kl?: number; cats?: unknown[]; counters?: { species?: number }; playMs?: number; gold?: number; savedAt?: number };
    if (!env.state) return null;
    return {
      name: s.player?.name ?? '',
      kl: s.kl ?? 1,
      cats: s.cats?.length ?? 0,
      species: s.counters?.species ?? 0,
      playMin: Math.round((s.playMs ?? 0) / 60000),
      gold: Math.round(s.gold ?? 0),
      savedAt: env.savedAt ?? s.savedAt ?? 0,
    };
  } catch {
    return null;
  }
}

/** "Reino 29 · 32 gatos · 5 h 3 min" */
export function describe(s: SaveSummary) {
  const h = Math.floor(s.playMin / 60);
  const t = h ? `${h} h ${s.playMin % 60} min` : `${s.playMin} min`;
  return `Reino ${s.kl} · ${s.cats} gatos · ${t} jugadas`;
}

export function toNocat(raw: string) {
  const env = JSON.parse(raw);
  return JSON.stringify({ format: 'nocat', v: 1, game: 'NO ONE LIKE CATS', exportedAt: new Date().toISOString(), summary: summarize(raw), save: env }, null, 1);
}

/** a save envelope (as JSON text) from a .nocat file, the base64 code or a bare envelope; null if none */
export function fromAny(text: string): string | null {
  const t = text.trim();
  const tryEnv = (s: string) => {
    try {
      const o = JSON.parse(s);
      const env = o?.format === 'nocat' ? o.save : o;
      return env && typeof env === 'object' && env.state && typeof env.state === 'object' ? JSON.stringify(env) : null;
    } catch {
      return null;
    }
  };
  if (t.startsWith('{')) return tryEnv(t);
  try {
    return tryEnv(decodeURIComponent(escape(atob(t))));
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ IndexedDB (history + folder handle)
let dbP: Promise<IDBDatabase> | null = null;
function db() {
  if (!dbP)
    dbP = new Promise((res, rej) => {
      const r = indexedDB.open('nolc-vault', 1);
      r.onupgradeneeded = () => {
        r.result.createObjectStore('snaps', { keyPath: 'id' });
        r.result.createObjectStore('kv');
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  return dbP;
}
function req<T>(store: string, mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((res, rej) => {
        const tx = d.transaction(store, mode);
        const r = f(tx.objectStore(store));
        r.onsuccess = () => res(r.result as T);
        r.onerror = () => rej(r.error);
      }),
  );
}
const kvGet = <T>(k: string) => req<T | undefined>('kv', 'readonly', (s) => s.get(k));
const kvSet = (k: string, v: unknown) => req('kv', 'readwrite', (s) => s.put(v, k));

export async function listSnaps(): Promise<Snap[]> {
  try {
    const all = await req<Snap[]>('snaps', 'readonly', (s) => s.getAll());
    return all.sort((a, b) => b.sum.savedAt - a.sum.savedAt);
  } catch {
    return [];
  }
}

/** keep a copy of `raw` (default: the save on disk) in the history. Never throws. */
export async function snapshot(reason: string, raw?: string | null) {
  try {
    const r = raw ?? localStorage.getItem(SAVE_KEY);
    if (!r) return;
    const sum = summarize(r);
    if (!sum || !sum.cats) return;
    const all = await listSnaps();
    // the same save twice is one entry
    if (all.some((x) => x.sum.savedAt === sum.savedAt && x.raw.length === r.length)) return;
    await req('snaps', 'readwrite', (s) => s.put({ id: `${sum.savedAt}-${Date.now()}`, at: Date.now(), reason, raw: r, sum } satisfies Snap));
    await prune();
  } catch {
    /* no IndexedDB (private mode…): the other layers still work */
  }
}

async function prune() {
  const all = await listSnaps();
  const keep = new Set(all.slice(0, 15).map((x) => x.id));
  const days = new Set<string>();
  const cutoff = Date.now() - 30 * 86400_000;
  for (const x of all) {
    const day = new Date(x.sum.savedAt).toDateString();
    if (x.sum.savedAt >= cutoff && !days.has(day)) {
      days.add(day);
      keep.add(x.id);
    }
  }
  // the biggest island ever seen is never pruned (the one you'd cry about)
  const best = [...all].sort((a, b) => b.sum.playMin - a.sum.playMin)[0];
  if (best) keep.add(best.id);
  for (const x of all) if (!keep.has(x.id)) await req('snaps', 'readwrite', (s) => s.delete(x.id));
}

// ------------------------------------------------------------------ your folder
type DirHandle = FileSystemDirectoryHandle & {
  queryPermission?: (o: { mode: 'readwrite' }) => Promise<PermissionState>;
  requestPermission?: (o: { mode: 'readwrite' }) => Promise<PermissionState>;
};
type Picker = (o: { mode: 'readwrite'; id?: string; startIn?: string }) => Promise<DirHandle>;
export const folderSupported = () => typeof (window as unknown as { showDirectoryPicker?: Picker }).showDirectoryPicker === 'function';

export type FolderStatus = { kind: 'unsupported' } | { kind: 'none' } | { kind: 'paused'; name: string } | { kind: 'on'; name: string; lastAt: number };

export async function folderStatus(): Promise<FolderStatus> {
  if (!folderSupported()) return { kind: 'unsupported' };
  try {
    const h = await kvGet<DirHandle>('folder');
    if (!h) return { kind: 'none' };
    const p = (await h.queryPermission?.({ mode: 'readwrite' })) ?? 'prompt';
    if (p !== 'granted') return { kind: 'paused', name: h.name };
    return { kind: 'on', name: h.name, lastAt: (await kvGet<number>('folderLastAt')) ?? 0 };
  } catch {
    return { kind: 'none' };
  }
}

/** user gesture: pick (or re-pick) the folder, then write right away */
export async function chooseFolder(): Promise<boolean> {
  const pick = (window as unknown as { showDirectoryPicker?: Picker }).showDirectoryPicker;
  if (!pick) return false;
  try {
    const h = await pick({ mode: 'readwrite', id: 'nolc-respaldos', startIn: 'documents' });
    await kvSet('folder', h);
    await writeFolder(true);
    return true;
  } catch {
    return false;
  }
}

/** user gesture: Chrome asks again after a restart ("¿permitir que el juego edite la carpeta…?") */
export async function resumeFolder(): Promise<boolean> {
  try {
    const h = await kvGet<DirHandle>('folder');
    if (!h) return false;
    const p = await h.requestPermission?.({ mode: 'readwrite' });
    if (p !== 'granted') return false;
    await writeFolder(true);
    return true;
  } catch {
    return false;
  }
}

export async function forgetFolder() {
  try {
    await kvSet('folder', undefined);
  } catch {
    /* ignore */
  }
}

let lastFolderWrite = 0;
/** write the latest + today's copy into the folder (only if permission is already granted: never prompts) */
export async function writeFolder(force = false) {
  if (!force && Date.now() - lastFolderWrite < 4 * 60_000) return;
  try {
    const h = await kvGet<DirHandle>('folder');
    if (!h || (await h.queryPermission?.({ mode: 'readwrite' })) !== 'granted') return;
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw || !summarize(raw)?.cats) return;
    const text = toNocat(raw);
    const put = async (dir: FileSystemDirectoryHandle, name: string) => {
      const f = await dir.getFileHandle(name, { create: true });
      const w = await f.createWritable();
      await w.write(text);
      await w.close();
    };
    await put(h, 'NoOneLikeCats.nocat');
    const day = localDay();
    await put(await h.getDirectoryHandle('respaldos', { create: true }), `isla-${day}.nocat`);
    lastFolderWrite = Date.now();
    await kvSet('folderLastAt', lastFolderWrite);
  } catch {
    /* folder moved / deleted / no space: the status in RESPALDOS shows it as paused */
  }
}

/** YYYY-MM-DD in the player's own time zone (toISOString is UTC: evenings in América were "tomorrow") */
function localDay(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ------------------------------------------------------------------ files
export function downloadNocat() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  const blob = new Blob([toNocat(raw)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `NoOneLikeCats-${localDay()}.nocat`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return true;
}

/** user gesture: pick a .nocat (or any text with a save) → the envelope JSON, or null */
export function openNocatFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.nocat,.json,.txt,application/json,text/plain';
    input.onchange = async () => {
      const f = input.files?.[0];
      resolve(f ? fromAny(await f.text()) : null);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

// ------------------------------------------------------------------ boot
/** the installed app can be the default for .nocat files (double-click → opens the game with it) */
export function onLaunchFile(cb: (envRaw: string) => void) {
  const lq = (window as unknown as { launchQueue?: { setConsumer: (f: (p: { files: FileSystemFileHandle[] }) => void) => void } }).launchQueue;
  lq?.setConsumer(async (p) => {
    const fh = p.files?.[0];
    if (!fh) return;
    const env = fromAny(await (await fh.getFile()).text());
    if (env) cb(env);
  });
}

let started = false;
/** ask for persistent storage, then keep the history + folder fed while you play */
export function startVault(isLoaded: () => boolean) {
  if (started) return;
  started = true;
  void navigator.storage?.persist?.().catch(() => undefined);
  const tick = () => {
    if (!isLoaded()) return;
    void snapshot('auto');
    void writeFolder();
  };
  window.setInterval(tick, 10 * 60_000);
  window.setTimeout(tick, 60_000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && isLoaded()) {
      void snapshot('al salir');
      void writeFolder(true);
    }
  });
}
