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
import './sys/casino';
import './sys/simulacro';
import './sys/storyBattles'; // registers the Fragmentos retro patch before any save loads
import './sys/podio';
import './sys/grietas';
import './sys/finale'; // EL ARCHIVO RASGADO (H29–H30), after the grietas register theirs
import './sys/rupturas'; // Parte II · Oleada 1 «La Marea Imposible» (H31–H41), after «Fin»
// Parte II renovada: reinicio narrativo (una vez por partida) + registro de premios. Its patch must run BEFORE any
// later wave's patch reads Part II progress (patches run in registration order); it reads STORY_BATTLES at run time.
import './sys/rupturasReset';
import './sys/rupturasO2'; // Oleada 2 «El Cielo Despierta» (H42–H49)
import './sys/rupturasO3'; // Oleada 3 «La Era Astral» (H50–H57)
import './sys/rupturasO4'; // Oleada 4 «El Umbral» (H58–H65)
import { markAllPatched } from './patches';
import { UPDATE_IDS } from '../data/updates';

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
  // a fresh island has nothing to repair and no "novedades" to catch up on
  markAllPatched();
  G.s.updatesSeen = [...UPDATE_IDS];
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
