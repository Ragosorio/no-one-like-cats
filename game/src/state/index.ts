/** Wires all systems (side-effect registration) and exposes new game / boot. */
import { G } from './game';
import { BAL } from './econ';
import { adopt } from './sys/cats';
import { setupNewIsland, autoHouse } from './sys/island';
import { setCrew } from './sys/ship';
import { checkMissions } from './sys/missions';
import './sys/resonance';
import './sys/campaign';
import './sys/secrets';
import './sys/workforce';
import './sys/decor';

export function newGame() {
  G.reset();
  setupNewIsland();
  // starting cats (balance.start.cats): Canelo, Gelatino, Brote — free (no discovery rewards)
  const uids: string[] = [];
  for (const sp of BAL.start.cats) {
    const r = adopt(sp, { free: true });
    if (r.cat) uids.push(r.cat.uid);
  }
  autoHouse(); // Brote stays homeless on purpose (mission K03)
  setCrew('balsa', uids);
  G.recalc();
  checkMissions();
  G.save();
}

export interface BootInfo {
  isNew: boolean;
  offlineMs: number;
  offlineGold: number;
}

export function bootGame(): BootInfo {
  const { offlineMs } = G.load();
  if (!G.loaded) {
    newGame();
    return { isNew: true, offlineMs: 0, offlineGold: 0 };
  }
  const goldBefore = G.s.gold + G.s.habitats.reduce((a, h) => a + h.buffer, 0);
  if (offlineMs > 5000) G.offline(offlineMs);
  const goldAfter = G.s.gold + G.s.habitats.reduce((a, h) => a + h.buffer, 0);
  G.recalc();
  checkMissions();
  return { isNew: false, offlineMs, offlineGold: Math.max(0, goldAfter - goldBefore) };
}

export { G };
