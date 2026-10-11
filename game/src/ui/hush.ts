/**
 * HUSH — while a scene plays (a CINE, a region cinematic, a form reveal…), gameplay popups wait their turn.
 *
 *   hush('cine', true) … hush('cine', false)    holds are counted per key; the world is hushed while any is held
 *   hushed()                                     is anything holding the screen right now?
 *   whenCalm(fn, key?)                           hushed → queue fn (deduped by key) and return true; else false
 *
 * Who asks: corner tips (ui/dialog tip), toasts (ui/modal toast), the story director's mission cards / panels /
 * beats (app/story canTip), the form reveal (app/formsFlow), the microevents (state/sys/micro + ui/micro).
 * Nothing is dropped: when the last hold is released the queue plays back after a short breath, one item at a
 * time (a toast every ~0.35 s, so they never pile up on top of each other). A scene's own lines bypass it.
 *
 * Pure (no Pixi): tests drive it with fake timers.
 */
const holds = new Map<string, number>();
const queue: { key: string; fn: () => void }[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<(on: boolean) => void>();

/** seconds of calm after the scene before the first queued popup shows */
export const HUSH_GRACE = 0.9;
/** seconds between two queued popups */
export const HUSH_STEP = 0.35;
/** the queue never grows without bound (a very long scene): the oldest of the same kind go first */
export const HUSH_MAX = 24;

/** is anything holding the screen? (`except`: holds that don't count for this asker, e.g. the story's own scene
 *  may start while a region keeps its sunk island hushed for it) */
export function hushed(except?: readonly string[]) {
  if (!except?.length) return holds.size > 0;
  for (const k of holds.keys()) if (!except.includes(k)) return true;
  return false;
}

/** take (on) or release (off) a hold. Every `true` needs its `false` (same key). */
export function hush(key: string, on: boolean) {
  const was = hushed();
  const n = holds.get(key) ?? 0;
  if (on) holds.set(key, n + 1);
  else if (n <= 1) holds.delete(key);
  else holds.set(key, n - 1);
  const now = hushed();
  if (now !== was) for (const f of [...listeners]) safe(() => f(now));
  if (now) {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = null;
  } else if (was) schedule(HUSH_GRACE);
}

/** drop every hold (a scene crashed, a new game) and play the queue back */
export function hushReset() {
  const was = hushed();
  holds.clear();
  if (was) {
    for (const f of [...listeners]) safe(() => f(false));
    schedule(HUSH_GRACE);
  }
}

/** if the world is hushed, keep `fn` for later (same `key` = replace the older one) and say so */
export function whenCalm(fn: () => void, key?: string): boolean {
  if (!hushed()) return false;
  if (key) {
    const i = queue.findIndex((q) => q.key === key);
    if (i >= 0) queue.splice(i, 1);
  }
  queue.push({ key: key ?? '', fn });
  if (queue.length > HUSH_MAX) queue.splice(0, queue.length - HUSH_MAX);
  return true;
}

/** queued popups (tests / debugging) */
export function hushQueue() {
  return queue.map((q) => q.key);
}

/** listen to hushed ↔ calm (returns off) */
export function onHush(fn: (on: boolean) => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

function schedule(sec: number) {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushOne, sec * 1000);
}
function flushOne() {
  flushTimer = null;
  if (hushed()) return;
  const q = queue.shift();
  if (!q) return;
  safe(q.fn);
  if (queue.length) schedule(HUSH_STEP);
}
function safe(fn: () => void) {
  try {
    fn();
  } catch (e) {
    console.warn('[hush]', e);
  }
}

(globalThis as unknown as { __hush: unknown }).__hush = { hushed, queue: hushQueue, reset: hushReset };
