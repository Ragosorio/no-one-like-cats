/**
 * The faro as a door for the story: a flow waits for the player to TAP the faro on the island (H92 «La noche
 * estrellada»: «sentarse con ella» starts F30). IslandScene calls notifyFaroTap() on every tap of the faro.
 */
let waiters: (() => void)[] = [];
/** resolves on the next tap of the faro */
export function waitFaroTap(): Promise<void> {
  return new Promise((r) => waiters.push(r));
}
/** IslandScene: the faro was tapped */
export function notifyFaroTap() {
  const w = waiters;
  waiters = [];
  for (const f of w) f();
}
/** a story is waiting for the faro (the island may make it glow a little) */
export const faroWaiting = () => waiters.length > 0;
