/**
 * YONOSE TODO — the bridge between the Momento's picture and the finale's MISSION PLUMBING (app/o4Finale.ts FinaleCtx).
 * Pure (no Pixi): tests drive it.
 *
 * The plumbing stays in o4Finale.ts; the Momento only says WHEN, in song time, once each and in story order:
 *   choose(pick)   «¿Qué escribes?»: the player's pick (cosmetic, remembered), or «nada» when the thumbnails close
 *   asleep()       Canelo lies down on the page (ASLEEP_T)
 *   mentira()      the climax hit (MENTIRA_T): H64 done, YONOSE TODO complete in the Fonoteca
 *   wake()         the last tic (WAKE_T): REGISTRO 000 despertando, H65 done
 * A finale resumed at the credits (`from: 'credits'`) only wakes. Seeks backward (scrub) never fire anything twice. A
 * replay's ctx persists nothing (o4Finale), and the bridge still keeps its own once-only books.
 */
import type { MentiraChoice } from '../../../state/sys/rupturasO4';
import { ASLEEP_T, MENTIRA_T, PICK, WAKE_T } from './times';

export interface FinaleHooks {
  choose(pick: MentiraChoice): void;
  asleep(): void;
  mentira(): void;
  wake(): void;
}
export type PlumbStep = 'choose' | 'asleep' | 'mentira' | 'wake';

export class FinaleBridge {
  /** what fired, in order (tests) */
  readonly fired: PlumbStep[] = [];
  /** the pick (null until chosen or defaulted) and whether the PLAYER made it */
  pick: MentiraChoice | null = null;
  picked = false;
  /** the clock reached the Momento at least once (it really played) */
  started = false;
  /** personalized story lines (o4Finale ctx.lines) */
  lines: ((beat: string, idx?: number[]) => [string, string][]) | null = null;

  constructor(
    readonly hooks: FinaleHooks | null,
    readonly from: 'mentira' | 'credits' = 'mentira',
  ) {}

  private fire(step: PlumbStep, f: () => void) {
    if (this.fired.includes(step)) return;
    this.fired.push(step);
    try {
      f();
    } catch (e) {
      console.warn('[yonose] plumbing', step, e);
    }
  }

  /** the player picks a thumbnail (only inside the window, only once) */
  choose(pick: MentiraChoice, t: number): boolean {
    if (this.from !== 'mentira' || this.pick || t < PICK.open - 0.5 || t > PICK.decide + 0.2) return false;
    this.pick = pick;
    this.picked = true;
    this.fire('choose', () => this.hooks?.choose(pick));
    return true;
  }

  /** song time t was drawn (every frame of a real play) */
  advance(t: number) {
    this.started = true;
    if (this.from === 'mentira') {
      if (t >= PICK.decide && !this.pick) {
        this.pick = 'nada';
        this.fire('choose', () => this.hooks?.choose('nada'));
      }
      if (t >= ASLEEP_T) this.fire('asleep', () => this.hooks?.asleep());
      if (t >= MENTIRA_T) this.fire('mentira', () => this.hooks?.mentira());
    }
    if (t >= WAKE_T) this.fire('wake', () => this.hooks?.wake());
  }

  /** the Momento ended: played to the cut → everything the story owes is paid (in order) */
  finish(end: 'done' | 'exited' | 'aborted') {
    if (end === 'done') this.advance(Infinity);
  }
}

// ------------------------------------------------------------------ the live bridge (one finale at a time)
let current: FinaleBridge | null = null;
export const finaleBridge = () => current;
export function setFinaleBridge(b: FinaleBridge | null) {
  current = b;
}
