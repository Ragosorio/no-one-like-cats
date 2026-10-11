/**
 * NARRATIVE WORLD STATE (Parte II · docs/part-ii/20-estados-y-cine.md).
 *
 * «Si la historia dice que algo pasa, pasa en pantalla.» The island's light, sky, cats and sound follow a
 * WORLD STATE that is DERIVED from story progress (missions active/done + beats seen), never stored as a
 * loose flag. So it survives scene changes, reloads and the Part II narrative reset by construction: the
 * same save always produces the same world.
 *
 *   registerWorldState({ id, priority, when: (save) => boolean, look: { … } })
 *   currentWorldState(save?)  → the highest-priority state whose `when` is true ('normal' otherwise)
 *   lookOf(state)             → its full WorldLook (NORMAL_LOOK + the state's overrides)
 *   mixLook(a, b, k)          → blend two looks (tweens, cinematics)
 *
 * Who renders it: the 2D island (src/island/night/*) — world grade, astral sky, upward-falling stars,
 * emissive lights, cats' reactions — and the audio facade (ambience bed + music state). Cinematics
 * (src/cine) may drive the look for a while and then hand it back to the derived state.
 *
 * Each wave registers its own states (from its own `state/sys/rupturasO<n>.ts`, at import time):
 *   registerWorldState({ id: 'o2_trombas', priority: 40, when: (s) => active(s, 'H42'), look: { … } })
 * Rules: ids are forever; `when` must be a pure function of the save (no clocks, no randomness);
 * a later wave uses a higher priority band (O1: 10–39, O2: 40–69, O3: 70–99, O4: 100–129).
 *
 * This file is pure (no Pixi): tests and tools can import it.
 */
import type { MusicState } from '../../audio/api';
import { G } from '../game';

/** what the world looks/sounds like (every number is 0..1 unless said otherwise) */
export interface WorldLook {
  // ---- grade of the WORLD layers (terrain, buildings, cats); the UI is never graded
  /** brightness multiplier (1 = as painted) */
  exposure: number;
  /** multiply color (0xffffff = none) */
  tint: number;
  /** 1 = as painted, 0 = grey */
  saturation: number;
  /** additive color floor: nights are deep blue, NEVER black (08 §4) */
  lift: number;
  // ---- the sky behind the floating islands
  /** astral night sky over the day void (0 = day, 1 = full night) */
  sky: number;
  /** multiply color of the night sky (variations per wave) */
  skyTint: number;
  /** fixed stars (density × brightness) */
  stars: number;
  /** stars that fall UPWARD, per second on screen (0 = none) */
  starFall: number;
  /** aurora / nebula bands (halftone ink) */
  aurora: number;
  /** a seam in the sky, like a page that was glued back */
  seam: number;
  // ---- light that really lights the night (additive, above the graded world)
  /** windows, lanterns, portals, dimension glows */
  lights: number;
  /** the faro's lamp + its beam sweeping OUTWARD */
  faro: number;
  /** sparkles / star reflections on the lagoons */
  seaGlow: number;
  /** screen vignette */
  vignette: number;
  /** daytime ambient life (gulls, sunbeams): 1 = as always, 0 = gone */
  dayLife: number;
  // ---- the cats
  /** fraction of the cats reacting to the sky by personality (staggered, 0..1) */
  cats: number;
  // ---- sound (audio/api.ts facade; the island applies it when the derived state changes)
  /** ambience bed id: 'sea', 'night_astral', … */
  ambience: string;
  /** adaptive music state */
  music: MusicState;
}

/** the minimum a save must have to derive the world (G.s satisfies it) */
export interface WorldSave {
  missions: { active: string[]; done: string[] };
  beatsSeen: string[];
  flags?: Record<string, boolean>;
}

export interface WorldStateDef {
  id: string;
  /** higher wins when several states match */
  priority: number;
  /** pure function of the save: missions, beats, flags */
  when: (s: WorldSave) => boolean;
  /** overrides on top of NORMAL_LOOK */
  look: Partial<WorldLook>;
  /** seconds to blend INTO this state when it begins while the island is on screen (default 4) */
  blend?: number;
  /** the world invites the player to act while in this state: the island marks `target` ('faro'…) */
  prompt?: { target: string; text: string; when?: (s: WorldSave) => boolean };
  /** the look follows the player's REAL clock, gently (dusk and night tints over the state's own look: clockLook).
   *  Only for lingering daytime states (the scarred sky): a story night stays a story night */
  clock?: boolean;
  /** who registered it (docs / debugging) */
  wave?: string;
  note?: string;
}

/** Part I's island: sunny paper diorama. Every state starts from this. */
export const NORMAL_LOOK: Readonly<WorldLook> = Object.freeze({
  exposure: 1,
  tint: 0xffffff,
  saturation: 1,
  lift: 0x000000,
  sky: 0,
  skyTint: 0xffffff,
  stars: 0,
  starFall: 0,
  aurora: 0,
  seam: 0,
  lights: 0,
  faro: 0,
  seaGlow: 0,
  vignette: 0,
  dayLife: 1,
  cats: 0,
  ambience: 'sea',
  music: 'island',
});

const REG: WorldStateDef[] = [];
const NORMAL: WorldStateDef = { id: 'normal', priority: 0, when: () => true, look: {}, wave: 'base', note: 'Parte I: la isla de siempre.' };

/** register (or replace, by id) a world state */
export function registerWorldState(def: WorldStateDef) {
  const i = REG.findIndex((d) => d.id === def.id);
  if (i >= 0) REG.splice(i, 1);
  REG.push(def);
  REG.sort((a, b) => b.priority - a.priority);
}
export function worldStates(): readonly WorldStateDef[] {
  return [...REG, NORMAL];
}
export function worldStateById(id: string): WorldStateDef | null {
  return id === 'normal' ? NORMAL : (REG.find((d) => d.id === id) ?? null);
}

/** the state the story says the world is in (pure: same save → same state) */
export function currentWorldState(save: WorldSave | null | undefined = G.s): WorldStateDef {
  if (!save?.missions || !save.beatsSeen) return NORMAL;
  for (const d of REG) {
    try {
      if (d.when(save)) return d;
    } catch {
      /* a broken predicate never breaks the island */
    }
  }
  return NORMAL;
}

export function lookOf(state: WorldStateDef | string): WorldLook {
  const d = typeof state === 'string' ? worldStateById(state) : state;
  return { ...NORMAL_LOOK, ...(d?.look ?? {}) };
}

// ------------------------------------------------------------------ blending
const NUM_KEYS = ['exposure', 'saturation', 'sky', 'stars', 'starFall', 'aurora', 'seam', 'lights', 'faro', 'seaGlow', 'vignette', 'dayLife', 'cats'] as const;
const COLOR_KEYS = ['tint', 'lift', 'skyTint'] as const;

export function mixColor(a: number, b: number, k: number) {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const r = Math.round(ar + (((b >> 16) & 255) - ar) * k);
  const g = Math.round(ag + (((b >> 8) & 255) - ag) * k);
  const bl = Math.round(ab + ((b & 255) - ab) * k);
  return (r << 16) | (g << 8) | bl;
}

/** blend two looks; the sound keys switch at the halfway point */
export function mixLook(a: WorldLook, b: WorldLook, k: number): WorldLook {
  if (k <= 0) return { ...a };
  if (k >= 1) return { ...b };
  const t = k;
  const out = { ...(t < 0.5 ? a : b) } as WorldLook;
  for (const key of NUM_KEYS) out[key] = a[key] + (b[key] - a[key]) * t;
  for (const key of COLOR_KEYS) out[key] = mixColor(a[key], b[key], t);
  return out;
}

// ------------------------------------------------------------------ the player's real clock (states with `clock`)
const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** 0 = day … 1 = night, by the local hour (0..24): dusk 18:30→20:45, dawn 4:45→6:45 */
export function clockNight(hour: number) {
  const h = ((hour % 24) + 24) % 24;
  return h >= 12 ? smooth(18.5, 20.75, h) : 1 - smooth(4.75, 6.75, h);
}
/** 0..1 golden light around sunset and sunrise (peaks ~18:45 and ~6:00) */
export function clockGold(hour: number) {
  const h = ((hour % 24) + 24) % 24;
  const bell = (c: number, w: number) => Math.max(0, 1 - Math.abs(h - c) / w);
  return Math.min(1, bell(18.75, 1.6) + bell(6, 1.1));
}
/** a soft night: the day's scars under a blue hour (never the astral night of the story) */
const CLOCK_NIGHT: Partial<WorldLook> = { exposure: 0.8, tint: 0xb6bdff, saturation: 0.88, lift: 0x07081a, sky: 0.62, stars: 0.6, aurora: 0.08, lights: 0.8, seaGlow: 0.35, vignette: 0.3, dayLife: 0.2, cats: 0.12 };
const CLOCK_GOLD: Partial<WorldLook> = { exposure: 0.97, tint: 0xffe2c6, saturation: 1.04 };
/**
 * A state's look under the player's real clock (pure: same look + same hour → same result). Gentle by design:
 * golden light at sunset/sunrise, a soft blue night with a few stars and the windows lit. Sound never changes.
 */
export function clockLook(base: WorldLook, hour: number): WorldLook {
  const g = clockGold(hour);
  const n = clockNight(hour);
  let out = g > 0.001 ? mixLook(base, { ...base, ...CLOCK_GOLD }, g * (1 - n * 0.7)) : { ...base };
  if (n > 0.001) {
    const night = { ...out, ...CLOCK_NIGHT };
    // a state's own stars / seam / starFall never go DOWN at night
    night.stars = Math.max(out.stars, CLOCK_NIGHT.stars!);
    night.seam = out.seam;
    night.starFall = out.starFall;
    out = mixLook(out, night, n);
  }
  out.ambience = base.ambience;
  out.music = base.music;
  return out;
}
/** the local hour of this device (0..24) */
export function localHour(d = new Date()) {
  return d.getHours() + d.getMinutes() / 60;
}

/** a look equal to the painted world: the island skips the grade filter entirely */
export function isNeutralGrade(l: WorldLook) {
  return Math.abs(l.exposure - 1) < 0.004 && Math.abs(l.saturation - 1) < 0.004 && l.tint === 0xffffff && l.lift === 0;
}

// ------------------------------------------------------------------ helpers for predicates
export const active = (s: WorldSave, id: string) => s.missions.active.includes(id);
export const done = (s: WorldSave, id: string) => s.missions.done.includes(id);
export const seen = (s: WorldSave, beat: string) => s.beatsSeen.includes(beat);

// ================================================================== Oleada 1 · La Marea Imposible
/**
 * H31 «Las estrellas caen hacia arriba» → H33 «Amanece»:
 *
 *   presagio      H31 active, opening not seen yet. The island you know; now and then a stray star rises in
 *                 broad daylight and a curious cat looks up. (The 20 s breath after «Fin» feels intentional.)
 *   noche_astral  from the opening's climax (beat b31_estrellas#a) through H32 (REGISTRO 000) and the FOLIO
 *                 reveal, until the sun really comes up: the dawn scene (cine h33_amanecer) persists
 *                 b33_paginas#a once it's day (landing on Páginas, H33 done, ends it too).
 *   cielo_roto    after the night: daylight is back but the sky kept a scar (a seam, a rare star going up).
 *                 It follows the player's real clock, gently (clockLook): golden sunsets, a soft blue night.
 */
export const O1_STATES = {
  presagio: 'presagio',
  noche: 'noche_astral',
  roto: 'cielo_roto',
} as const;

const openingSeen = (s: WorldSave) => seen(s, 'b31_estrellas#a') || seen(s, 'b31_estrellas');
/** «Amanece»: the dawn is a scene (cine h33_amanecer) that persists b33_paginas#a when the sun is up */
const dawnSeen = (s: WorldSave) => seen(s, 'b33_paginas#a') || seen(s, 'b33_paginas');

/** the night of the falling stars, as the island shows it (the opening cine drives toward this) */
export const NOCHE_ASTRAL_LOOK: Partial<WorldLook> = {
  exposure: 0.6,
  tint: 0x9fb0ff,
  saturation: 0.8,
  lift: 0x0a0a24,
  sky: 1,
  stars: 1,
  starFall: 2.2,
  aurora: 0.55,
  seam: 0.18,
  lights: 1,
  faro: 1,
  seaGlow: 0.85,
  vignette: 0.55,
  dayLife: 0,
  cats: 1,
  ambience: 'night_astral',
  music: 'island_night_astral',
};

registerWorldState({
  id: O1_STATES.noche,
  priority: 30,
  wave: 'O1',
  blend: 5,
  note: 'Noche astral: de la apertura de H31 hasta que amanece de verdad (cine h33_amanecer, b33 parte a).',
  // while H31 waits for its tap, the faro calls you (the opening's last step points there too)
  prompt: { target: 'faro', text: 'TOCA EL FARO', when: (s) => active(s, 'H31') },
  when: (s) => (active(s, 'H31') && openingSeen(s)) || (done(s, 'H31') && !done(s, 'H33') && !dawnSeen(s)),
  look: NOCHE_ASTRAL_LOOK,
});
registerWorldState({
  id: O1_STATES.presagio,
  priority: 29,
  wave: 'O1',
  blend: 3,
  note: 'H31 activa, antes de la apertura: casi normal, una estrella sube a plena luz.',
  when: (s) => active(s, 'H31') && !openingSeen(s),
  look: { exposure: 0.985, tint: 0xf6f3ff, saturation: 0.97, starFall: 0.16 },
});
registerWorldState({
  id: O1_STATES.roto,
  priority: 10,
  wave: 'O1',
  blend: 7,
  note: 'Después de la noche: de día, pero el cielo quedó con una costura y alguna estrella todavía sube. Sigue la hora real del jugador (atardecer y noche suaves).',
  clock: true,
  when: (s) => done(s, 'H31'),
  look: { seam: 0.65, starFall: 0.1, stars: 0.14 },
});
