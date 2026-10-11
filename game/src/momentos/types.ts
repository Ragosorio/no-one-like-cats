/**
 * MOMENTOS MUSICALES — authoring + runtime types (docs/part-ii/29-momentos-musicales.md).
 *
 * A Momento is an interactive music video driven by one of the owner's ORIGINAL songs: a SCORE (choreography in song
 * time) plays on a STAGE (the Momento's own set: world, actors, scene verbs) through the ANIME toolkit. Inputs only pick
 * animation branches: nothing the player does changes the save, the rewards or a battle result.
 *
 * Time vocabulary
 *   song time  t   seconds in the song file (beat maps, markers, sections all live here)
 *   momento    m   seconds since the Momento started (the EDIT maps song segments one after the other)
 *   local      lt  seconds since a clip started (clip.update(lt))
 */
import type { BeatMap } from '../audio/beatgrid';

// ------------------------------------------------------------------ time addresses
/**
 * A point in the SONG. Forms:
 *  - number                      song seconds
 *  - 'chorus' / 'silence_1'      a section start or a marker (sections win on a name clash)
 *  - 'chorus+2'                  2 bars after the chorus starts · 'chorus+2:1.5' = +2 bars +1.5 beats · 'shout_1-0:1' = 1 beat before
 *  - '#12' / '#12:2'             absolute bar 12 (0-based downbeat) / its beat 2 (0-based)
 *  - { section|marker|t|bar, bar?, beat?, bars?, beats?, sec? }   the same, as an object (offsets add)
 */
export type When =
  | number
  | string
  | {
      section?: string;
      marker?: string;
      /** song seconds base */
      t?: number;
      /** with section/marker: bar offset; alone: ABSOLUTE bar index */
      bar?: number;
      beat?: number;
      /** extra offsets (may be negative) */
      bars?: number;
      beats?: number;
      sec?: number;
    };

/** filter over the beat map's choreography hits (MUSIC's `hits`, or ones synthesized from the grid) */
export interface HitFilter {
  /** a section name, or a [from, to) range */
  in?: string | [When, When];
  kind?: string | string[];
  /** strength ≥ min / ≤ max */
  min?: number;
  max?: number;
  /** keep every n-th match (1 = all) */
  every?: number;
  /** drop matches closer than this to the previous kept one (s) */
  minGap?: number;
  /** first n matches */
  limit?: number;
  /** skip matches within ±40 ms of these */
  except?: When[];
}
/**
 * Per-stem ONSET tracks (game/src/data/music/beatmaps/<id>.onsets.json, docs/part-ii/29 §6b): every kick, accent, bass
 * note, melody attack… measured on the separated stems. Rows are compact arrays: [t, strength] (kick, snare, perc,
 * melody, vox) and [t, dur, midi | null, strength] (bass).
 */
export type OnsetTrack = 'kick' | 'snare' | 'perc' | 'bass' | 'melody' | 'vox';
export interface OnsetMap {
  id: string;
  bpm: number;
  tracks: Partial<Record<OnsetTrack, (number | null)[][]>>;
}
export interface Onset {
  t: number;
  strength: number;
  /** bass notes: length (s) and MIDI pitch */
  dur?: number;
  midi?: number | null;
}
export interface OnsetFilter {
  track: OnsetTrack;
  in?: string | [When, When];
  min?: number;
  max?: number;
  every?: number;
  minGap?: number;
  limit?: number;
  except?: When[];
}
export type EachSpec =
  | { onsets: OnsetFilter }
  | { hits: HitFilter }
  | { beats: { in: string | [When, When]; every?: number; offset?: number } }
  | { bars: { in: string | [When, When]; every?: number; offset?: number } }
  | { times: When[] };

// ------------------------------------------------------------------ acts (what happens)
export type Args = Record<string, unknown>;
/**
 * A verb call: 'impact' · ['speed', { dir: 0.3 }] · { do: 'cutin', args: {...}, beats: 0.5 }.
 * `dt` / `beats` delay it after the entry's time (seconds / beats).
 */
export type Act = string | [string, Args?] | { do: string; args?: Args; dt?: number; beats?: number };

export type Ease = 'linear' | 'in' | 'out' | 'inOut' | 'back' | 'outBack' | 'elastic' | 'step' | 'expoOut' | 'sineInOut';

export type InputType = 'tap' | 'hold' | 'mash' | 'choice';
export interface InputSpec {
  type: InputType;
  /** stable id (traces, tests, the result card) */
  id: string;
  /** hold / mash: the end of the gesture · choice: the decision moment (default: the entry time) */
  until?: When;
  /** hold: judge the RELEASE on `until` (else: just keep holding through it) */
  release?: boolean;
  /** mash: taps for 'hit' / 'great' */
  need?: [hit: number, great: number];
  /** choice: what happens with no answer */
  fallback?: 'left' | 'right';
  /** bars of warning before the target (default 1) — prompts appear one bar ahead */
  lead?: number;
  /** a bonus prompt: hitting it shows more, missing it costs nothing (never graded down) */
  optional?: boolean;
  /** where the prompt sits: a stage anchor name, or [x, y] in the 1920×1080 design box */
  anchor?: string | [number, number];
  /** 1–3 words, shown inside the prompt (never more) */
  label?: string;
}

// ------------------------------------------------------------------ score entries (authoring)
export interface DoEntry {
  kind: 'do';
  when: When;
  act: Act[];
  /** which edit segment (when the edit repeats song material); default: the first segment containing it */
  seg?: number;
  tag?: string;
}
export interface EachEntry {
  kind: 'each';
  each: EachSpec;
  act: Act[];
  tag?: string;
}
export interface KeyEntry {
  kind: 'key';
  when: When;
  /** property → target value (numbers tween, strings switch) */
  set: Record<string, number | string>;
  /** tween length: seconds, or beats when `beats` is given */
  dur?: number;
  beats?: number;
  ease?: Ease;
  seg?: number;
}
export interface InputEntry {
  kind: 'input';
  when: When;
  input: InputSpec;
  /**
   * Branches, each a list of acts. They start at the branch time: tap great/hit → on the beat (the target; a late press
   * starts them at the press) · tap miss → when the window closes · hold/mash → at `until` · choice → at the decision.
   */
  branches: Partial<Record<Judgement, Act[]>>;
  /** acts that run in every branch (same timing) */
  always?: Act[];
  seg?: number;
}
export type ScoreEntry = DoEntry | EachEntry | KeyEntry | InputEntry;

// ------------------------------------------------------------------ the definition
export interface EditSegment {
  /** song time where the segment starts — must be a bar line (except the very first) */
  from: When;
  /** song time where it ends — must be a bar line, except the last segment (it may end anywhere: the cut) */
  to: When;
}
export interface MomentoDef {
  id: string;
  /** tracks.json ref of the ORIGINAL song (originals are reserved for Momentos) */
  track: string;
  /** shown in replays / the Fonoteca (spoiler-free) */
  title: string;
  /** story mission that hosts it (informational; the hook decides when it plays) */
  mission?: string;
  /** a battle phase change that plays it (src/momentos/battle.ts) */
  battle?: { id: string; fase: string };
  /** song segments played back to back (default: the whole song) */
  edit?: EditSegment[];
  /**
   * The HARD CUT: the Momento's last frame (song time; default: the end of the edit). The song may ring a little longer
   * (`tail`) while the game takes over.
   */
  cut?: When;
  /** after the cut the music: 'release' (fade to the game's music at the next bar) or 'keep' (the caller takes over) */
  tail?: 'release' | 'keep';
  /** palette per section (names from anime/palette.ts or the stage's own) — the default for `pal` */
  palettes?: Record<string, string>;
  score: ScoreEntry[];
  /** the Momento's set (Pixi; lazy so the pure core never imports Pixi) */
  stage: () => Promise<StageFactory>;
  /** Fonoteca refs to unlock on the first completion (idempotent; only refs the catalog knows) */
  unlocks?: string[];
  /** where the Fonoteca says the song was found (spoiler-free place name; default 'Islas Invertidas', LIKY FIGHT's) */
  source?: string;
  /** defaults for this Momento's props (camera, palette, stage props) */
  props?: Record<string, number | string>;
}

/** a stage module's default export */
export type StageFactory = (host: unknown) => unknown;

// ------------------------------------------------------------------ resolved (runtime)
export interface ResolvedAct {
  verb: string;
  args: Args;
  /** delay after the owner's time (s) */
  dt: number;
}
export interface Cue {
  id: number;
  /** song time */
  t: number;
  /** momento time */
  m: number;
  act: ResolvedAct;
  source: 'do' | 'each' | 'branch';
  tag?: string;
  /** the hit that produced it (each over hits): strength / kind */
  hit?: { strength: number; kind: string };
  /** the onset that produced it (each over onsets): its track, strength, bass length / pitch */
  onset?: Onset & { track: OnsetTrack };
  /** a branch cue: which prompt + result */
  prompt?: string;
  result?: Judgement;
}
export interface Key {
  m: number;
  value: number | string;
  dur: number;
  ease: Ease;
}
export type Judgement = 'great' | 'hit' | 'miss' | 'left' | 'right';
export interface Prompt {
  id: string;
  type: InputType;
  spec: InputSpec;
  /** target (song + momento time) */
  t: number;
  m: number;
  /** hold / mash end · choice decision (momento time) */
  mEnd: number;
  /** when the prompt appears */
  mShow: number;
  branches: Partial<Record<Judgement, ResolvedAct[]>>;
  always: ResolvedAct[];
  optional: boolean;
}
export interface Segment {
  /** song times */
  from: number;
  to: number;
  /** momento time at `from` */
  m0: number;
}
export interface ResolvedScore {
  def: MomentoDef;
  map: BeatMap;
  /** the song's onset tracks (null when it has none) */
  onsets: OnsetMap | null;
  segments: Segment[];
  /** momento time of the hard cut */
  mCut: number;
  /** total momento length (≥ mCut: the tail) */
  length: number;
  cues: Cue[];
  keys: Map<string, Key[]>;
  prompts: Prompt[];
  /** authoring problems (tests fail on any) */
  warnings: string[];
}

export interface MomentoResult {
  id: string;
  /** cosmetic only */
  grade: Grade;
  pct: number;
  counts: { great: number; hit: number; miss: number; bonus: number };
  /** prompt id → result */
  results: Record<string, Judgement>;
  /** 'done' (played to the cut) · 'exited' (replay left from the pause menu) · 'aborted' (the scene went away) */
  end: 'done' | 'exited' | 'aborted';
  clock: 'audio' | 'internal' | 'mixed';
}
export type Grade = 'S' | 'A' | 'B' | 'C';
