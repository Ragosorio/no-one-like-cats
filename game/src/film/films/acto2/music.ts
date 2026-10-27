/**
 * ACTO II — the music of each film (musica-v2/10-produccion-oleada3.md §6). Derived pieces only in briefings and story
 * films; the owner's original (Daria) only in its song film. All of them are registered in tracks.json.
 */
export const MUSIC = {
  /** F09 «Ciudad Mayúscula»: Viñeta (boom-bap orchestra, 95 BPM, a crash every page = every 4 bars) */
  f09: 'fut.vineta',
  /** F10 «Villanos sueltos»: Viñeta + newsreel fanfare in open fourths on every page */
  f10: 'fut.vineta.noticiero',
  /** F11 «Cruceta»: Viñeta in mono, band-limited (the printed Silver Age comic, an old radio) */
  f11: 'fut.vineta.mono',
  /** F12 «Cerito»: «Pad de la noche» (xti c73–80, the pad alone) */
  f12: 'xti.pad',
  /** F13 «El Gran Torneo»: «Calle fría» (Daria c9–16, piano + shimmer + 808, no drums, no voice) */
  f13: 'daria.calle',
  /** F14 «Entrenamiento» and F15 «Itō»: «Piano de vinilo» (Daria c9–16, the piano alone, ×1.5 slower) */
  f14: 'daria.piano',
  f15: 'daria.piano',
  /** F16 «Una sola línea»: Daria (ORIGINAL), fragment c25 → end */
  f16: 'daria',
  /** F17 «La Vocación»: the act's own piece (organ and low strings, 90 s, composed to the shot list) */
  f17: 'amb.vocacion',
} as const;
/** fut.vineta: 95 BPM, 2 bars of intro, a crash every page (4 bars) */
export const VINETA = { bpm: 95, beat: 60 / 95, bar: 240 / 95, page: (n: number) => (240 / 95) * (2 + 4 * n) } as const;
