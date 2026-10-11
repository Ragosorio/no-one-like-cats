/**
 * MOMENTO: yonose_todo (H64→H65) — THE single entry point of the Parte II finale: «Mentira» (H64) carried on into the
 * Parte II credits (H65) in one piece. Everything that starts it goes through playFinale(): tapping the faro or the
 * page by it at night (app/oleada4Flow.ts onFaroTap / the page prop), the pinned mission's IR (H64 / H65), and the
 * catch-up after a reload between the two (oleada4Flow resumes the credits).
 *
 * The YONOSE TODO Momento engine (another agent; the ORIGINAL songs are reserved for the 6 «Momentos musicales»)
 * takes the whole finale over with registerFinaleMomento(fn). Its scene is the song: «Mentira» lands on the climax hit
 * (FINALE_SONG.climax), the song carries on into the credits, and REGISTRO 000 changes state on the closing tick-tock
 * (FINALE_SONG.fadeTail). The engine owns picture and sound; the MISSION PLUMBING stays here, in the FinaleCtx it gets:
 * ask/choose (the cosmetic choice), asleep (Canelo on the page: persists b64_mentira#b), mentira (H64 done + Fonoteca:
 * YONOSE TODO complete), wake (REGISTRO 000 despertando: persists b65_continuara#a, H65 done → flag oleada4_fin) and
 * credits() (the credits as DATA: ui/story/creditsParteII.ts creditsData). Every call is idempotent and does nothing
 * in a replay.
 *
 * Without an engine: the fallback is the two island cines (ui/story/o4Cines.ts h64_mentira → h65_creditos) over a
 * yonose_todo VARIATION (never the original), with a simple credits roll on the clock.
 */
import { G } from '../state/game';
import { markBeat } from '../state/ext/story';
import { checkMissions } from '../state/sys/missions';
import { chooseMentira, finishCredits, finishMentira, type MentiraChoice } from '../state/sys/rupturasO4';
import { unlockSoon } from '../cine/sound';
import { CREDITS_LINES, MENTIRA_LINES, MENTIRA_OPTIONS } from '../ui/story/rupturasScriptO4';
import { PAGE_ASLEEP } from '../ui/story/o4Pagina';
import type { Line } from '../ui/dialog';

/** YONOSE TODO's beat map (docs/part-ii/18 §4.5): where the Momento's beats fall (seconds into the original) */
export const FINALE_SONG = { id: 'yonose_todo', prechorus: 138.667, climax: 149.333, outro: 189.333, fadeTail: 202.667, end: 207.8 } as const;
/** the variation the fallback plays (the 3-layer aftermath: keys → + bass → + drums), first that exists */
export const FINALE_FALLBACK_BEDS = ['yonose_todo.aftermath', 'yonose_todo.aftermath_bajo', 'yonose_todo.aftermath_ritmo'];

export interface FinaleCtx {
  /** «volver a ver»: nothing persists, nothing is unlocked */
  replay: boolean;
  /** 'mentira' = the whole finale (H64 active) · 'credits' = H64 already done (a reload in between): credits only */
  from: 'mentira' | 'credits';
  /** a beat's lines, personalized (b64_mentira / b65_continuara; indexes in MENTIRA_LINES / CREDITS_LINES) */
  lines(beat: string, idx?: number[]): Line[];
  lineMap: { mentira: typeof MENTIRA_LINES; credits: typeof CREDITS_LINES };
  options: typeof MENTIRA_OPTIONS;
  /** the cosmetic question «¿Qué escribes?» with the game's own prompt (or call choose() from your own UI) */
  ask(): Promise<MentiraChoice>;
  choose(pick: MentiraChoice): void;
  /** Canelo is asleep on the page (point of no return of H64: the page by the faro shows him there from now on) */
  asleep(): void;
  /** «…Mentira.»: H64 is done and YONOSE TODO is complete in the Fonoteca */
  mentira(): void;
  /** REGISTRO 000: observando → despertando. H65 done (flag oleada4_fin) */
  wake(): void;
  /** the credits as data (names, the 6 songs credited to Ragosorio, the cats, stats) */
  credits(): Promise<import('../ui/story/creditsParteII').CreditsData>;
}
/** 'fallback' = the Momento could not play at all (no beat map, an error before its clock): the cines take over */
export type FinaleMomento = (ctx: FinaleCtx) => Promise<'done' | 'interrupted' | 'fallback'>;

let momento: FinaleMomento | null = null;
/** the YONOSE TODO Momento engine takes the finale over (null = back to the fallback) */
export function registerFinaleMomento(fn: FinaleMomento | null) {
  momento = fn;
}
/** the Momento engine has the finale (Ajustes › VOLVER A VER plays the finale through playFinale, not the cines) */
export const hasFinaleMomento = () => !!momento;

const persist = (k: string) => {
  markBeat(k);
  G.save();
};

export function finaleCtx(o: { replay?: boolean; from?: 'mentira' | 'credits'; lines?: FinaleCtx['lines'] } = {}): FinaleCtx {
  const replay = !!o.replay;
  return {
    replay,
    from: o.from ?? (G.s.missions.active.includes('H64') ? 'mentira' : 'credits'),
    lines: o.lines ?? (() => []),
    lineMap: { mentira: MENTIRA_LINES, credits: CREDITS_LINES },
    options: MENTIRA_OPTIONS,
    ask: async () => {
      const { askMentira } = await import('../ui/story/o4Cines');
      return askMentira(replay);
    },
    choose: (pick) => {
      if (replay) return;
      chooseMentira(pick);
      G.save();
    },
    asleep: () => {
      if (replay) return;
      persist(PAGE_ASLEEP);
      void import('../ui/story/o4Pagina').then((m) => m.syncFaroPage()).catch(() => undefined);
    },
    mentira: () => {
      if (replay) return;
      finishMentira();
      checkMissions();
      // «Mentira»: the song is complete in your Fonoteca (doc 18 §8)
      unlockSoon(FINALE_SONG.id, 'Mentira');
    },
    wake: () => {
      if (replay) return;
      persist('b65_continuara#a');
      finishCredits();
      checkMissions();
      unlockSoon('registro_000', 'Continuará');
    },
    credits: async () => (await import('../ui/story/creditsParteII')).creditsData(),
  };
}

let running = false;
export const finaleRunning = () => running;

// MOMENTO: yonose_todo (H64→H65)
/**
 * Play the finale (the Momento engine takes it over through registerFinaleMomento). `from` defaults to what the save says (H64 active → everything;
 * H65 active → the credits). A replay (Ajustes › VOLVER A VER) persists nothing.
 */
export async function playFinale(o: { replay?: boolean; from?: 'mentira' | 'credits' } = {}): Promise<'done' | 'interrupted'> {
  if (running) return 'interrupted';
  const m = G.s.missions;
  const from = o.from ?? (m.active.includes('H64') ? 'mentira' : 'credits');
  if (!o.replay && from === 'mentira' && !m.active.includes('H64')) return 'interrupted';
  if (!o.replay && from === 'credits' && !m.active.includes('H65')) return 'interrupted';
  running = true;
  try {
    const { storyLines } = await import('./story');
    const ctx = finaleCtx({ replay: o.replay, from, lines: (beat, idx) => storyLines(beat, idx) });
    if (momento) {
      const r = await momento(ctx);
      if (r !== 'fallback') return r;
    }
    // fallback: the two island cines (o4Cines.ts), over a yonose_todo variation
    const { playCine, runningCine } = await import('../cine');
    if (runningCine()) return 'interrupted';
    const host = { lines: ctx.lines };
    if (from === 'mentira') {
      const r = await playCine('h64_mentira', { replay: o.replay, host });
      if (r === 'interrupted') return r;
      // the song carries on into the credits: no gap, no new screen in between
      if (!o.replay && !G.s.missions.active.includes('H65')) return 'done';
    }
    return (await playCine('h65_creditos', { replay: o.replay, host })) === 'interrupted' ? 'interrupted' : 'done';
  } finally {
    running = false;
  }
}
