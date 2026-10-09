import type { Container } from 'pixi.js';
import type { Particles } from '../../fx/particles';
import type { Ev } from './lines';
import type { Marquee } from './kit';

/** What the CasinoScene offers to each game view. */
export interface CasinoCtx {
  /** effects layer above the views (inside the shaken root) */
  fx: Container;
  /** top-most layer (full-screen takeovers, reveals) — not shaken */
  top: Container;
  particles: Particles;
  marquee: Marquee;
  shake(amount: number): void;
  /** host bubble (+ voice if enabled). `p` = probability to actually speak (anti-spam) */
  say(ev: Ev, p?: number): void;
  /** fictional live chat reactions */
  chat(ev: Ev, n?: number): void;
  /** refresh the resource pills now */
  refresh(): void;
  /**
   * Freeze the HUD pills at their CURRENT values (+ deltas, e.g. the stake) so a result is never
   * revealed by the counters before the reels/wheel/portal show it. Call BEFORE resolving the bet.
   */
  freeze(deltas?: Partial<Record<PillKind, number>>): void;
  /** let the pills catch up with the real balances */
  unfreeze(): void;
  /**
   * Concurrent-safe version of freeze for the newer tables: hide `deltas` (already credited) from the pills until the
   * returned release() is called (e.g. when the coins land). Several holds can overlap (plinko balls in flight).
   */
  hold(deltas: Partial<Record<PillKind, number>>): () => void;
  /** lock navigation while a spin/animation runs */
  setBusy(b: boolean): void;
  readonly busy: boolean;
  /** screen position of a resource pill (for flying loot) */
  pillPos(kind: 'gold' | 'gems' | 'chips' | 'tickets'): { x: number; y: number };
  /** open another tab of the casino */
  go(tab: CasinoTab, arg?: string): void;
}

export type PillKind = 'gold' | 'gems' | 'chips' | 'tickets';
export type CasinoTab = 'slot' | 'roulette' | 'gacha' | 'caja' | 'acc' | 'plinko' | 'dice' | 'scratch' | 'boxes' | 'bingo' | 'hilo';

export interface CasinoView extends Container {
  /** called before destroy (stop timers, listeners) */
  dispose?(): void;
  /** keyboard shortcut (Space / Enter) */
  primary?(): void;
}
