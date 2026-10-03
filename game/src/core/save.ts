/**
 * Save slots in localStorage (with an in-memory fallback when storage is unavailable).
 * The game state object is plain JSON; `version` lets us migrate old saves.
 */
const KEY = 'nolc-save-v1';
let memory: string | null = null;

export interface SaveEnvelope<T> {
  version: number;
  savedAt: number;
  state: T;
}

export function writeSave<T>(state: T, version: number) {
  const env: SaveEnvelope<T> = { version, savedAt: Date.now(), state };
  const raw = JSON.stringify(env);
  try {
    localStorage.setItem(KEY, raw);
  } catch {
    memory = raw;
  }
}

export function readSave<T>(): SaveEnvelope<T> | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    raw = memory;
  }
  if (!raw) raw = memory;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SaveEnvelope<T>;
  } catch {
    return null;
  }
}

export function wipeSave() {
  memory = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Export/import as a base64 string so players can back up or move saves. */
export function exportSave(): string {
  const env = readSave();
  return env ? btoa(unescape(encodeURIComponent(JSON.stringify(env)))) : '';
}

export function importSave(code: string): boolean {
  try {
    const raw = decodeURIComponent(escape(atob(code.trim())));
    JSON.parse(raw);
    try {
      localStorage.setItem(KEY, raw);
    } catch {
      memory = raw;
    }
    return true;
  } catch {
    return false;
  }
}
