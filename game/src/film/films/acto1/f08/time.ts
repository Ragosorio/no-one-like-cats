/**
 * F08 OH SHIT — the clock (pure). 145 BPM, 4/4, bar 1 at 0 s; the film starts at c37 (59.586 s of the song).
 * T(c) = film seconds of song bar c (fractional bars allowed: c41.125).
 */
export const BAR = 240 / 145;
export const T = (c: number) => (c - 37) * BAR;
/** the song's end: the last region ends at 201.931 s → c123 */
export const END = T(123);
