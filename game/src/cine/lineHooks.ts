/**
 * Beat-line hooks: a surface on screen (a panel, a card) reacts to a story line as it's said, without the story
 * knowing about it. app/story.ts fires `<beat>#<part>` + the line's index within that part; e.g. the REGISTRO 000
 * sheet develops its FOLIO stamp out of the static exactly when the caption says so. Pure (no Pixi).
 */
type Hook = (i: number, speaker: string, text: string) => void;
const hooks = new Map<string, Set<Hook>>();

/** listen to the lines of a beat part (`b32_registro#b`); returns off */
export function onBeatLine(key: string, fn: Hook) {
  let set = hooks.get(key);
  if (!set) hooks.set(key, (set = new Set()));
  set.add(fn);
  return () => void set!.delete(fn);
}

/** the story says line `i` of `key` now */
export function fireBeatLine(key: string, i: number, speaker: string, text: string) {
  for (const fn of [...(hooks.get(key) ?? [])]) {
    try {
      fn(i, speaker, text);
    } catch (e) {
      console.warn('[lineHooks]', key, e);
    }
  }
}
