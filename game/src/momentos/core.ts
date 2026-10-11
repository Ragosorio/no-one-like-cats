/**
 * MOMENTO CORE — the input/prompt state machine (pure; no Pixi, no audio, no clock).
 *
 * The runner feeds it momento time (`advance(m)`) and the player's gestures already converted to momento time with the
 * latency + «Ajuste de ritmo» correction (`input(kind, m)`). It answers with events: prompts to show, judgements, and
 * the BRANCH cues each judgement unlocks. Nothing here can touch a save: the result is a cosmetic grade.
 *
 * Judging (s): tap |Δ| ≤ 0.06 great · ≤ 0.15 hit · a press up to 0.25 s before the window = that prompt's miss
 * (mashing never wins) · no press = miss when the window closes. hold: press in the window and keep it through `until`
 * (release prompts: let go on `until`). mash: taps between the prompt and `until` vs `need`. choice: the first side
 * picked before the decision, else the fallback.
 */
import type { Cue, Grade, Judgement, MomentoResult, Prompt, ResolvedAct, ResolvedScore } from './types';
import { EARLY_S, GREAT_S, HIT_S } from './score';

export type InputKind = 'down' | 'up' | 'left' | 'right';
export type Autoplay = 'great' | 'hit' | 'miss' | 'none';

export interface PromptState {
  p: Prompt;
  shown: boolean;
  done: boolean;
  result?: Judgement;
  /** tap / hold start: press time − target (s) */
  delta?: number;
  /** hold: when the press started / ended */
  from?: number;
  to?: number;
  /** mash: taps counted */
  taps: number;
  choice?: 'left' | 'right';
  /** the player actually answered (choice) / pressed (others) */
  answered: boolean;
}

export type CoreEvent =
  | { k: 'show'; s: PromptState }
  | { k: 'press'; s: PromptState | null; m: number; kind: InputKind }
  | { k: 'judge'; s: PromptState; result: Judgement; at: number; cues: Cue[] };

const SCORE: Record<string, number> = { great: 1, hit: 0.6, miss: 0 };

export class MomentoCore {
  readonly states: PromptState[];
  private cueId = 1_000_000;
  /** branch cues created so far (also returned in each judge event) */
  readonly branchCues: Cue[] = [];
  private lastM = -Infinity;
  /** autoplay (QA, tests): synthetic gestures at the right (or wrong) times */
  private autoQueue: { m: number; kind: InputKind }[] = [];

  constructor(
    readonly score: ResolvedScore,
    readonly autoplay: Autoplay = 'none',
  ) {
    this.states = score.prompts.map((p) => ({ p, shown: false, done: false, taps: 0, answered: false }));
    if (autoplay !== 'none') this.autoQueue = this.planAuto(autoplay);
  }

  /** synthetic gestures for an autoplay profile */
  private planAuto(a: Autoplay): { m: number; kind: InputKind }[] {
    const q: { m: number; kind: InputKind }[] = [];
    let side: 'left' | 'right' = 'left';
    for (const s of this.states) {
      const p = s.p;
      const off = a === 'great' ? 0 : a === 'hit' ? 0.1 : -0.21; // 'miss' presses too early (inside the early zone)
      if (p.type === 'tap') q.push({ m: p.m + off, kind: 'down' }, { m: p.m + off + 0.05, kind: 'up' });
      else if (p.type === 'hold') {
        if (a === 'miss') q.push({ m: p.m + 0.3, kind: 'down' }, { m: p.m + 0.45, kind: 'up' });
        else q.push({ m: p.m + off, kind: 'down' }, { m: p.mEnd + (p.spec.release ? off : 0.3), kind: 'up' });
      } else if (p.type === 'mash') {
        const need = p.spec.need ?? [6, 12];
        const n = a === 'great' ? need[1] + 2 : a === 'hit' ? need[0] + 1 : Math.max(0, need[0] - 3);
        const span = Math.max(0.2, p.mEnd - p.m - 0.1);
        for (let i = 0; i < n; i++) q.push({ m: p.m + (span * i) / Math.max(1, n), kind: 'down' }, { m: p.m + (span * i) / Math.max(1, n) + 0.03, kind: 'up' });
      } else if (p.type === 'choice' && a !== 'miss') {
        q.push({ m: (p.mShow + p.mEnd) / 2, kind: side });
        side = side === 'left' ? 'right' : 'left';
      }
    }
    return q.sort((x, y) => x.m - y.m);
  }

  /** a side choice is open at m (pointer presses become left/right) */
  wantsSide(m: number): boolean {
    return this.states.some((s) => !s.done && s.p.type === 'choice' && m >= s.p.mShow && m <= s.p.mEnd);
  }
  /** prompts on screen at m (shown, not finished) — the prompt UI reads this */
  visible(m: number): PromptState[] {
    return this.states.filter((s) => s.shown && (!s.done || m - this.doneAt(s) < 0.6));
  }
  private doneAt(s: PromptState) {
    return s.p.type === 'tap' ? s.p.m + HIT_S : s.p.mEnd;
  }

  /** move to momento time m: show prompts, close windows (misses), run autoplay */
  advance(m: number): CoreEvent[] {
    const out: CoreEvent[] = [];
    if (m < this.lastM - 0.5) this.lastM = m; // a seek back: nothing re-judges, prompts stay as they were
    while (this.autoQueue.length && this.autoQueue[0].m <= m) {
      const g = this.autoQueue.shift()!;
      out.push(...this.input(g.kind, g.m));
    }
    for (const s of this.states) {
      const p = s.p;
      if (!s.shown && m >= p.mShow) {
        s.shown = true;
        out.push({ k: 'show', s });
      }
      if (s.done) continue;
      if (p.type === 'tap' && m > p.m + HIT_S) out.push(this.judge(s, 'miss', p.m + HIT_S));
      else if (p.type === 'hold') {
        if (s.from === undefined && m > p.mEnd - 0.3) out.push(this.judge(s, 'miss', p.mEnd));
        else if (s.from !== undefined && s.to === undefined && m >= p.mEnd + (p.spec.release ? HIT_S : 0)) {
          // held through the end: great when it started in the window (a release prompt that never let go: hit)
          const r: Judgement = p.spec.release ? 'hit' : Math.abs(s.delta ?? 1) <= HIT_S ? 'great' : 'hit';
          out.push(this.judge(s, r, p.mEnd));
        }
      } else if (p.type === 'mash' && m >= p.mEnd) {
        const need = p.spec.need ?? [6, 12];
        out.push(this.judge(s, s.taps >= need[1] ? 'great' : s.taps >= need[0] ? 'hit' : 'miss', p.mEnd));
      } else if (p.type === 'choice' && m >= p.mEnd) out.push(this.judge(s, s.choice ?? p.spec.fallback ?? 'left', p.mEnd));
    }
    this.lastM = Math.max(this.lastM, m);
    return out;
  }

  /** a gesture at momento time m (already latency / offset corrected) */
  input(kind: InputKind, m: number): CoreEvent[] {
    const out: CoreEvent[] = [];
    if (kind === 'left' || kind === 'right') {
      const s = this.states.find((x) => !x.done && x.p.type === 'choice' && m >= x.p.mShow && m <= x.p.mEnd);
      if (s && !s.choice) {
        s.choice = kind;
        s.answered = true;
      }
      out.push({ k: 'press', s: s ?? null, m, kind });
      return out;
    }
    if (kind === 'up') {
      const s = this.states.find((x) => !x.done && x.p.type === 'hold' && x.from !== undefined && x.to === undefined);
      if (s) {
        s.to = m;
        const p = s.p;
        const span = Math.max(0.001, p.mEnd - p.m);
        if (p.spec.release && m >= p.mEnd - HIT_S) {
          const d = m - p.mEnd;
          const r: Judgement = Math.abs(d) <= GREAT_S && Math.abs(s.delta ?? 1) <= HIT_S ? 'great' : 'hit';
          out.push(this.judge(s, r, Math.max(p.mEnd, m)));
        } else if (!p.spec.release && m >= p.mEnd - HIT_S) {
          out.push(this.judge(s, Math.abs(s.delta ?? 1) <= HIT_S ? 'great' : 'hit', p.mEnd));
        } else {
          // let go early: enough of it held = hit, else miss (the branch still lands on `until`)
          out.push(this.judge(s, (m - p.m) / span >= 0.6 ? 'hit' : 'miss', p.mEnd));
        }
      }
      return out;
    }
    // 'down'
    const mashing = this.states.find((x) => !x.done && x.p.type === 'mash' && m >= x.p.m - HIT_S && m <= x.p.mEnd);
    if (mashing) {
      mashing.taps++;
      mashing.answered = true;
      out.push({ k: 'press', s: mashing, m, kind });
      return out;
    }
    const holding = this.states.find((x) => !x.done && x.p.type === 'hold' && x.from === undefined && m >= x.p.m - HIT_S && m <= x.p.mEnd - 0.3);
    if (holding) {
      holding.from = m;
      holding.delta = m - holding.p.m;
      holding.answered = true;
      out.push({ k: 'press', s: holding, m, kind });
      return out;
    }
    // taps: the nearest open window; else an early press eats the next window (miss)
    let best: PromptState | null = null;
    for (const s of this.states) {
      if (s.done || s.p.type !== 'tap') continue;
      const d = Math.abs(m - s.p.m);
      if (d <= HIT_S && (!best || d < Math.abs(m - best.p.m))) best = s;
    }
    if (best) {
      const d = m - best.p.m;
      best.delta = d;
      best.answered = true;
      out.push({ k: 'press', s: best, m, kind });
      out.push(this.judge(best, Math.abs(d) <= GREAT_S ? 'great' : 'hit', Math.max(best.p.m, m)));
      return out;
    }
    const early = this.states.find((s) => !s.done && s.p.type === 'tap' && !s.p.optional && m < s.p.m - HIT_S && m >= s.p.m - HIT_S - EARLY_S);
    if (early) {
      early.delta = m - early.p.m;
      early.answered = true;
      out.push({ k: 'press', s: early, m, kind });
      out.push(this.judge(early, 'miss', early.p.m + HIT_S));
      return out;
    }
    out.push({ k: 'press', s: null, m, kind });
    return out;
  }

  private judge(s: PromptState, result: Judgement, at: number): CoreEvent {
    s.done = true;
    s.result = result;
    const acts: ResolvedAct[] = [...(s.p.branches[result] ?? []), ...s.p.always];
    const cues: Cue[] = acts.map((a) => ({ id: ++this.cueId, t: s.p.t + (at - s.p.m) + a.dt, m: at + a.dt, act: a, source: 'branch', prompt: s.p.id, result }));
    this.branchCues.push(...cues);
    return { k: 'judge', s, result, at, cues };
  }

  /** everything judged (or the Momento reached its cut) */
  get finished() {
    return this.states.every((s) => s.done);
  }

  /** the cosmetic result */
  result(end: MomentoResult['end'] = 'done', clock: MomentoResult['clock'] = 'audio'): MomentoResult {
    const counts = { great: 0, hit: 0, miss: 0, bonus: 0 };
    let sum = 0;
    let n = 0;
    const results: Record<string, Judgement> = {};
    for (const s of this.states) {
      const r = s.result ?? (s.p.type === 'choice' ? s.p.spec.fallback ?? 'left' : 'miss');
      results[s.p.id] = r;
      if (s.p.type === 'choice') continue;
      if (s.p.optional) {
        if (r === 'great' || r === 'hit') counts.bonus++;
        continue;
      }
      counts[r as 'great' | 'hit' | 'miss']++;
      sum += SCORE[r] ?? 0;
      n++;
    }
    const pct = n ? sum / n : 1;
    return { id: this.score.def.id, grade: gradeOf(pct), pct: Math.round(pct * 1000) / 1000, counts, results, end, clock };
  }
}

export function gradeOf(pct: number): Grade {
  return pct >= 0.92 ? 'S' : pct >= 0.75 ? 'A' : pct >= 0.5 ? 'B' : 'C';
}
const GRADE_ORDER: Grade[] = ['C', 'B', 'A', 'S'];
export const betterGrade = (a: Grade | undefined, b: Grade) => (!a || GRADE_ORDER.indexOf(b) > GRADE_ORDER.indexOf(a) ? b : a);
