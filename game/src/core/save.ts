/**
 * Save slots in localStorage (with an in-memory fallback when storage is unavailable).
 * The game state object is plain JSON; `version` lets us migrate old saves (state/migrate.ts).
 *
 * Safety net (a game update must never cost anyone their cats):
 * - `nolc-save-v1`       the live save (key name is historical: the real version lives inside the envelope)
 * - `nolc-save-prev`     the previous good write (rotated every few minutes) → recovers a corrupted live save
 * - `nolc-save-bak-<v>`  a copy taken right before a save of version <v> was migrated to a newer one
 */
export const SAVE_KEY = 'nolc-save-v1';
const PREV_KEY = 'nolc-save-prev';
const BAK_PREFIX = 'nolc-save-bak-';
const PREV_EVERY_MS = 5 * 60_000;
let memory: string | null = null;
let lastPrevAt = 0;

export interface SaveEnvelope<T> {
  version: number;
  savedAt: number;
  /** build that wrote it (see core/updates.ts) */
  build?: string;
  state: T;
}

function get(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return key === SAVE_KEY ? memory : null;
  }
}
function set(key: string, raw: string) {
  try {
    localStorage.setItem(key, raw);
    return true;
  } catch {
    if (key === SAVE_KEY) memory = raw;
    return false;
  }
}

export function writeSave<T>(state: T, version: number, build?: string) {
  const env: SaveEnvelope<T> = { version, savedAt: Date.now(), build, state };
  const raw = JSON.stringify(env);
  // rotate the last good save before overwriting it (cheap: once every few minutes)
  const now = Date.now();
  if (now - lastPrevAt > PREV_EVERY_MS) {
    const cur = get(SAVE_KEY);
    if (cur && parse(cur)) set(PREV_KEY, cur);
    lastPrevAt = now;
  }
  if (!set(SAVE_KEY, raw)) memory = raw;
}

function parse<T>(raw: string | null): SaveEnvelope<T> | null {
  if (!raw) return null;
  try {
    const env = JSON.parse(raw) as SaveEnvelope<T>;
    if (!env || typeof env !== 'object' || !env.state || typeof env.state !== 'object') return null;
    if (typeof env.version !== 'number') env.version = 1;
    return env;
  } catch {
    return null;
  }
}

/** the live save, or the last good copy when the live one is unreadable */
export function readSave<T>(): (SaveEnvelope<T> & { recovered?: boolean }) | null {
  const live = parse<T>(get(SAVE_KEY) ?? memory);
  if (live) return live;
  if (!get(SAVE_KEY) && !memory) return null;
  const prev = parse<T>(get(PREV_KEY));
  if (prev) {
    console.warn('[save] la partida estaba dañada: se recuperó la copia anterior');
    return { ...prev, recovered: true };
  }
  return null;
}

export function hasSave() {
  return !!readSave();
}

/** keep a copy of a save before a migration touches it (one per old version; never overwritten) */
export function backupBeforeMigration(version: number | string) {
  const raw = get(SAVE_KEY);
  if (!raw) return;
  const key = `${BAK_PREFIX}${version}`;
  if (!get(key)) set(key, raw);
}

/** every migration backup, newest version first */
export function listBackups(): { version: number; savedAt: number; key: string }[] {
  const out: { version: number; savedAt: number; key: string }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || (!k.startsWith(BAK_PREFIX) && k !== PREV_KEY)) continue;
      const env = parse(get(k));
      if (env) out.push({ version: env.version, savedAt: env.savedAt ?? 0, key: k });
    }
  } catch {
    /* no storage */
  }
  return out.sort((a, b) => b.savedAt - a.savedAt);
}

/** put a backup back as the live save (the game reloads afterwards) */
export function restoreBackup(key: string) {
  const raw = get(key);
  if (!raw || !parse(raw)) return false;
  const cur = get(SAVE_KEY);
  if (cur) set(`${BAK_PREFIX}undo`, cur);
  return set(SAVE_KEY, raw);
}

export function wipeSave() {
  memory = null;
  // the last deleted island stays recoverable from Ajustes › RESPALDOS (only one, overwritten each time)
  const cur = get(SAVE_KEY);
  if (cur && parse(cur)) set(`${BAK_PREFIX}borrada`, cur);
  try {
    // the migration backups stay: "borrar partida" is for the live game only
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(PREV_KEY);
  } catch {
    /* ignore */
  }
}

/** Export/import as a base64 string so players can back up or move saves. */
export function exportSave(): string {
  const raw = get(SAVE_KEY) ?? memory;
  return raw && parse(raw) ? btoa(unescape(encodeURIComponent(raw))) : '';
}

export function importSave(code: string): boolean {
  try {
    const raw = decodeURIComponent(escape(atob(code.trim())));
    if (!parse(raw)) return false;
    const cur = get(SAVE_KEY);
    if (cur) set(`${BAK_PREFIX}undo`, cur);
    if (!set(SAVE_KEY, raw)) memory = raw;
    return true;
  } catch {
    return false;
  }
}
