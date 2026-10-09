/**
 * El Podio — saved state shape (pure: no game imports, so state/game.ts can use it without cycles).
 * Lives in GameState.podio; defaultState() puts defaultPodio() there and normalize() fills old saves.
 */
export interface PodioCatState {
  /** podio XP into the current level */
  xp: number;
  /** podio level 1..20 (levels the cat's 4 powers) */
  lvl: number;
  wins: number;
  losses: number;
  /**
   * Rivals THIS cat has beaten: league -> bitmask of bouts (bit b = bout b). The first time a cat beats a
   * rival it earns full XP + first-win orbs (catch-up for cats obtained late); account-unique prizes live
   * in PodioState.champions. Missing on old saves: state/sys/podio.ts derives it from the cat's XP.
   */
  beaten?: Record<string, number>;
  /** first-win XP that didn't fit under the level cap; flows in by itself when the cap rises */
  bank?: number;
}

export interface PodioState {
  /** current league (1-based, endless after the named ones) */
  league: number;
  /** next bout in the league (0..bouts-1; the last one is the champion) */
  bout: number;
  /** per cat uid */
  cats: Record<string, PodioCatState>;
  /** battle speed ×0.5 / ×1 / ×2 / ×4 (persisted) */
  speed: number;
  /** auto-battle on/off (persisted) */
  auto: boolean;
  /** last cat sent to the arena (uid) */
  pick: string;
  /** leagues whose champion already paid the first-time prize */
  champions: number[];
  stats: { wins: number; losses: number; perfects: number };
}

export function defaultPodio(): PodioState {
  return { league: 1, bout: 0, cats: {}, speed: 1, auto: false, pick: '', champions: [], stats: { wins: 0, losses: 0, perfects: 0 } };
}
