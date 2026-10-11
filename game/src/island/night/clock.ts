/**
 * The island's clock for clock-following world states (state/sys/worldState.ts › clockLook): the player's real
 * local hour. DEV: `?hour=21.5` in the URL or `__night.hour(21.5)` fixes it (headless shots); `null` = real again.
 */
import { localHour } from '../../state/sys/worldState';

const devQs = import.meta.env.DEV && typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
let devHour: number | null = devQs?.get('hour') ? Number(devQs.get('hour')) : null;
let gen = 0;

export function islandHour() {
  return devHour ?? localHour();
}
/** bumps when the dev hour changes (the island re-reads at once) */
export function clockGen() {
  return gen;
}

if (import.meta.env.DEV)
  (globalThis as unknown as { __night: unknown }).__night = {
    /** fix the island clock (null = the real one) */
    hour: (h: number | null) => {
      devHour = h === null || h === undefined ? null : Number(h);
      gen++;
      return islandHour();
    },
  };
