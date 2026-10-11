/**
 * YONOSE TODO — the finale's clock (pure: no Pixi). Song seconds; 90 BPM, a bar is 8/3 s, '#n' = bar n.
 *
 * Every input target and every story beat sits on a MEASURED onset (beatmaps/yonose_todo.onsets.json, regenerated
 * grid-informed by audio-derivados/scripts/onsets_yonose.py): keys notes for the quiet story, the 808 kicks and the
 * dembow accents for the loud parts, the closing tick-tock for REGISTRO 000. tests/momentoYonoseTodo.test.ts checks it.
 */
export const BAR = 8 / 3;
export const BEAT = 2 / 3;
export const bar = (n: number, beat = 0) => n * BAR + beat * BEAT;

/** the song's sections (beatmaps/yonose_todo.json; doc 18 §4.5) */
export const SEC = {
  intro: 0,
  verse: 21.333,
  bridge: 53.333,
  brk: 64.0,
  naked: 74.667,
  chorus: 85.333,
  break2: 117.333,
  prechorus: 138.667,
  climax: 149.333,
  outro: 189.333,
  fadeTail: 202.667,
  end: 207.8,
} as const;

// ------------------------------------------------------------------ inputs (on measured onsets)
/** Luzterna lifts her lantern — keys, the last intro downbeat */
export const FAROL = 18.67;
/** every cat of the island hops in on a strong 808 kick of the verse (#9–#13): «todos los gatos mirando» */
export const ARRIVE = [24.01, 25.341, 26.671, 28.003, 29.334, 31.335, 32.005, 34.676];
/** three of those arrivals are (bonus) taps */
export const GATOS = [ARRIVE[0], ARRIVE[2], ARRIVE[4]];
/** big_hit_1 (the marker says 30.859; the measured accent is 30.839): every cat looks up at the faro */
export const BIG1 = 30.839;
/** Canelo's three turns on the page — keys (#21, #21:2, #22) */
export const VUELTAS = [56.003, 57.337, 58.667];
/** Luzterna pokes him on the break's rim accents (bonus taps) */
export const PICA = [67.173, 69.844];
/** «calor»: hold from the naked keys (#29) and let go ON the chorus hit */
export const CALOR = 77.337;
/** the dream panels, one per two bars, on dembow accents of the chorus */
export const SUENOS = [88.505, 94.334, 99.172, 104.505, 109.839, 115.172];
/** «…Mentira»: hold from the prechorus keys (#54) and let go ON the climax hit */
export const MENTIRA_HOLD = 143.998;
/** paint on the credits' pages: climax accents (big_hit_4 / big_hit_5 among them) */
export const PINTA = [158.839, 166.835, 176.51, 184.505];

// ------------------------------------------------------------------ the story beats (app/o4Finale.ts plumbing)
/** «¿Qué escribes?»: three storyboard thumbnails from #14; no answer by big_hit_2 = «nada» */
export const PICK = { open: 37.333, decide: 45.0, close: 50.667 } as const;
/** Canelo lies down on the page (#23, keys): point of no return of H64 */
export const ASLEEP_T = 61.336;
/** the climax hit: «…Mentira.» — H64 done, YONOSE TODO complete in the Fonoteca */
export const MENTIRA_T = 149.333;
/** REGISTRO 000's card: «observando» struck on the first tics, «despertando» written one letter per tic */
export const STRIKE_TICS = [202.672, 203.178, 203.673, 204.178];
export const LETTER_TICS = [204.509, 204.673, 205.004, 205.343, 205.84, 206.004, 206.345, 206.674, 206.84, 207.171, 207.335];
/** the last tic: the word is underlined, REGISTRO 000 wakes (H65 done), CONTINUARÁ */
export const WAKE_T = 207.675;
/** the hard cut: the last tics have rung, CONTINUARÁ has been read */
export const CUT = 208.6;

// ------------------------------------------------------------------ the stage's timeline (song seconds)
/** Canelo walks in (#20) → onto the page (#21) → three turns → asleep (#23) */
export const CANELO = { walk: bar(20), onPage: bar(20, 3), asleep: ASLEEP_T } as const;
/** the far hand writes «A nadie le gustan los gatos.» on the keys of break2 */
export const WRITE = { from: bar(46), to: bar(49) } as const;
/** the credits (climax → outro) */
export const CREDITS = {
  title: bar(57),
  creator: bar(59),
  songs: bar(61),
  cast: bar(64),
  cats: bar(66),
  stats: bar(69, 2),
  /** thanks + links on one page (#71–#72) */
  thanks: bar(71),
  /** dawn by the faro: Luzterna's last lines (#73, #75) */
  dawn: bar(73),
  bye: bar(75),
} as const;

/** the resume point when the finale restarts at the credits (a reload between «Mentira» and REGISTRO 000) */
export const RESUME = SEC.prechorus;

// ------------------------------------------------------------------ the set's layout (world px; the wide shot = the 1920×1080 box)
type XY = [number, number];
export const P: { horizon: number; faro: XY; lamp: XY; page: XY; luz: XY; margin: XY; moon: XY } = {
  horizon: 590,
  /** the faro's foot and its lantern */
  faro: [700, 668],
  lamp: [700, 268],
  /** the blank page on the grass by the faro (centre), Canelo sleeps on it */
  page: [1010, 712],
  luz: [1410, 744],
  /** the page's far margin, where the far hand writes */
  margin: [1086, 738],
  moon: [1500, 210],
};
