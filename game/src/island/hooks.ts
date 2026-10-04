/**
 * Island scene hooks for panels (panels never import the scene): the IslandScene registers these on
 * enter and clears them on exit. Every call is optional — panels must work without an island behind.
 */
import type { Hud } from '../ui/hud/Hud';

export interface IslandHooks {
  /** pan the camera to an expansion (1..8) */
  focusRegion?: (n: number) => void;
  /** pan to the Banco del Reino / expedition pier / sanctuary */
  focusBuilding?: (id: 'bank' | 'pier' | 'sanctuary' | 'port') => void;
  /** open the build menu on the first free plot (optionally pre-picking an element) */
  buildOnFreePlot?: (element?: string) => boolean;
  /** HUD of the scene (fly-to effects) */
  hud?: () => Hud | null;
  /** refresh island views right away (after a state change made from a panel) */
  sync?: () => void;
}

export const islandHooks: IslandHooks = {};

export function setIslandHooks(h: IslandHooks | null) {
  for (const k of Object.keys(islandHooks) as (keyof IslandHooks)[]) delete islandHooks[k];
  if (h) Object.assign(islandHooks, h);
}
