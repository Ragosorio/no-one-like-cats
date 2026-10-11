/**
 * TEMPERAMENTS: how each cat MOVES with a purpose (docs/part-ii/31-animaciones-con-proposito.md).
 *
 * Pure data + resolution, no Pixi: the intent engine (art/intent.ts) turns a profile into anticipation, weight and
 * personality reactions. Presentation only — nothing here reaches the battle simulator or the save.
 *
 *   trait (data/content.json `trait`, 14 of them) → a TEMPERAMENT (tempo, latency, bounce, posture, quirks, reactions)
 *   rarity / primordial / a few species           → a WEIGHT (mass: slower anticipation, more inertia, less squash)
 *   primordial: true                              → SOLEMN overlay (no idle hops, slow turns, dignified reactions)
 *   c_canelo                                      → his own repertoire (SIGNATURE 'canelo'), in every form he wears
 * An unknown species or trait falls back to DEFAULT_TEMPERAMENT (a calm, curious house cat), so a new cat always moves.
 * To give a new cat its own personality: set its `trait` in content.json (done), or add a line to SPECIES below.
 */
import { CAT_BY_ID, type CatDef } from '../data/content';

/** something happened near the cat */
export type EventKind = 'startle' | 'wonder' | 'joy' | 'boom' | 'tap';
export const EVENT_KINDS: readonly EventKind[] = ['startle', 'wonder', 'joy', 'boom', 'tap'];

/** a body reaction the intent engine knows how to play (art/intent.ts `reactionIntent`) */
export type Reaction =
  | 'flinch' // reflex: drops and leans away, ears back, recovers
  | 'hide' // flinch, then cowers a while (and peeks)
  | 'brace' // plants its feet and leans in: «come on»
  | 'advance' // leans back (anticipation) and lunges toward it (walks there if it can)
  | 'gawk' // looks first, then rises on its toes, mouth open
  | 'bounce' // crouch → hop, maybe twice
  | 'cheer' // crouch → happy hop + little bounces
  | 'puff' // chest out, wide and proud
  | 'pounce' // butt wiggle, then a leap forward
  | 'late' // ...a second later, the head comes up slowly
  | 'glare' // half-lidded, leans back, ears flat
  | 'preen' // chin up, composed (then grooms)
  | 'nod' // slow dignified nod
  | 'loom' // rises slowly to its full height and holds (the primordials)
  | 'swat' // Canelo: leaps at it, misses, lands, pretends nothing happened
  | 'zoom' // Canelo: double hop, impatient
  | 'ignore'; // an ear flick at most

/** idle things a cat does on its own while it waits */
export type Quirk =
  | 'tap' // impatient: quick little crouch pulses (foot tapping)
  | 'pounce' // wiggle + small leap at nothing
  | 'glance' // nervous look around
  | 'sniff' // head down, leans forward
  | 'puff' // chest out
  | 'preen' // chin up + groom
  | 'nod' // dozing nod-off
  | 'stretch' // a big stretch
  | 'zoom' // a sprint to somewhere else (zoomies)
  | 'flare' // a fiery little lunge, tail flick
  | 'glare' // half-lidded stare
  | 'scan' // leans to look at something
  | 'sigh' // sinks down and comes back up slowly
  | 'loom' // primordial: rises, holds, settles
  | 'bow' // primordial: slow nod
  | 'swat'; // Canelo: jumps at a star that isn't there

export interface Temperament {
  id: string;
  /** seconds before it reacts to something (min, max) — before the tempo */
  latency: [number, number];
  /** time multiplier for every beat (1 = normal, >1 slower) */
  tempo: number;
  /** hop height and settle overshoot multiplier */
  bounce: number;
  /** seconds between idle hops (min, max); null = never hops on its own */
  hopEvery: [number, number] | null;
  /** chance an idle/joy hop is a double hop */
  doubleHop: number;
  /** -1 flees what startles it … +1 walks toward it */
  boldness: number;
  /** walk speed multiplier (presentation only) */
  pace: number;
  /** body bias while awake: lean (strut), crouch (shy, <0 stands tall), chin (head up) */
  posture: { lean: number; crouch: number; chin: number };
  /** idle repertoire (picked at random, repeats = more likely) */
  quirks: Quirk[];
  /** seconds between idle quirks (min, max) */
  quirkEvery: [number, number];
  /** what it does when something happens */
  react: Record<EventKind, Reaction>;
}

export interface Weight {
  /** 0.8 kitten-light … 2 a titan */
  mass: number;
  /** squash & stretch amplitude (lighter = squashier) */
  squash: number;
  /** time multiplier from inertia (heavier = slower to start and to settle) */
  inertia: number;
}

export interface MotionProfile {
  species: string;
  trait: string;
  temperament: Temperament;
  weight: Weight;
  /** primordial: slow, heavy, dignified */
  solemn: boolean;
  /** a cat with its own hand-made repertoire */
  signature: 'canelo' | null;
}

const T = (id: string, t: Omit<Temperament, 'id'>): Temperament => ({ ...t, id });

/** the 14 traits of data/content.json → how they move */
export const TEMPERAMENTS: Record<string, Temperament> = {
  impaciente: T('impaciente', {
    latency: [0.03, 0.15], tempo: 0.8, bounce: 1.15, hopEvery: [3, 7], doubleHop: 0.35, boldness: 0.7, pace: 1.25,
    posture: { lean: 0.12, crouch: 0, chin: 0 }, quirks: ['tap', 'tap', 'zoom', 'pounce'], quirkEvery: [4, 9],
    react: { startle: 'advance', wonder: 'pounce', joy: 'bounce', boom: 'flinch', tap: 'bounce' },
  }),
  travieso: T('travieso', {
    latency: [0.05, 0.2], tempo: 0.85, bounce: 1.35, hopEvery: [2.5, 6], doubleHop: 0.45, boldness: 0.5, pace: 1.15,
    posture: { lean: 0.05, crouch: 0, chin: 0 }, quirks: ['pounce', 'pounce', 'zoom', 'glance'], quirkEvery: [4, 9],
    react: { startle: 'bounce', wonder: 'pounce', joy: 'bounce', boom: 'bounce', tap: 'bounce' },
  }),
  gloton: T('gloton', {
    latency: [0.15, 0.4], tempo: 1.05, bounce: 0.9, hopEvery: [7, 13], doubleHop: 0.1, boldness: 0.2, pace: 0.9,
    posture: { lean: 0.04, crouch: 0.05, chin: 0 }, quirks: ['sniff', 'sniff', 'sigh'], quirkEvery: [5, 11],
    react: { startle: 'gawk', wonder: 'gawk', joy: 'cheer', boom: 'flinch', tap: 'cheer' },
  }),
  dormilon: T('dormilon', {
    latency: [0.6, 1.4], tempo: 1.5, bounce: 0.6, hopEvery: [16, 28], doubleHop: 0, boldness: 0, pace: 0.7,
    posture: { lean: 0, crouch: 0.1, chin: -0.2 }, quirks: ['nod', 'nod', 'stretch'], quirkEvery: [6, 12],
    react: { startle: 'late', wonder: 'late', joy: 'late', boom: 'flinch', tap: 'late' },
  }),
  perezoso: T('perezoso', {
    latency: [0.4, 1.1], tempo: 1.4, bounce: 0.65, hopEvery: [16, 30], doubleHop: 0, boldness: 0.1, pace: 0.75,
    posture: { lean: -0.04, crouch: 0.12, chin: 0 }, quirks: ['stretch', 'sigh', 'nod'], quirkEvery: [7, 13],
    react: { startle: 'late', wonder: 'late', joy: 'nod', boom: 'flinch', tap: 'late' },
  }),
  chismoso: T('chismoso', {
    latency: [0.08, 0.25], tempo: 0.9, bounce: 1, hopEvery: [7, 13], doubleHop: 0.15, boldness: 0.45, pace: 1.05,
    posture: { lean: 0.06, crouch: 0, chin: 0.1 }, quirks: ['scan', 'scan', 'glance'], quirkEvery: [4, 9],
    react: { startle: 'gawk', wonder: 'advance', joy: 'cheer', boom: 'gawk', tap: 'cheer' },
  }),
  bravucon: T('bravucon', {
    latency: [0.1, 0.25], tempo: 1, bounce: 0.9, hopEvery: [8, 15], doubleHop: 0.1, boldness: 1, pace: 1,
    posture: { lean: 0.16, crouch: 0, chin: 0.3 }, quirks: ['puff', 'puff', 'flare'], quirkEvery: [5, 10],
    react: { startle: 'brace', wonder: 'brace', joy: 'puff', boom: 'advance', tap: 'puff' },
  }),
  miedoso: T('miedoso', {
    latency: [0.02, 0.1], tempo: 0.9, bounce: 0.8, hopEvery: [10, 18], doubleHop: 0, boldness: -1, pace: 0.95,
    posture: { lean: -0.05, crouch: 0.14, chin: 0 }, quirks: ['glance', 'glance', 'sigh'], quirkEvery: [3, 7],
    react: { startle: 'hide', wonder: 'hide', joy: 'cheer', boom: 'hide', tap: 'flinch' },
  }),
  presumido: T('presumido', {
    latency: [0.15, 0.35], tempo: 1.1, bounce: 0.85, hopEvery: [9, 16], doubleHop: 0.05, boldness: 0.3, pace: 0.9,
    posture: { lean: -0.04, crouch: -0.08, chin: 0.6 }, quirks: ['preen', 'preen', 'puff'], quirkEvery: [5, 10],
    react: { startle: 'preen', wonder: 'gawk', joy: 'puff', boom: 'flinch', tap: 'preen' },
  }),
  rencoroso: T('rencoroso', {
    latency: [0.2, 0.5], tempo: 1.1, bounce: 0.7, hopEvery: [14, 24], doubleHop: 0, boldness: 0.5, pace: 0.95,
    posture: { lean: -0.05, crouch: 0.04, chin: 0 }, quirks: ['glare', 'glare', 'sigh'], quirkEvery: [5, 11],
    react: { startle: 'glare', wonder: 'glare', joy: 'nod', boom: 'brace', tap: 'glare' },
  }),
  curioso: T('curioso', {
    latency: [0.05, 0.2], tempo: 0.95, bounce: 1.1, hopEvery: [5, 10], doubleHop: 0.2, boldness: 0.7, pace: 1.05,
    posture: { lean: 0.05, crouch: 0, chin: 0.15 }, quirks: ['scan', 'glance', 'pounce'], quirkEvery: [4, 8],
    react: { startle: 'gawk', wonder: 'advance', joy: 'bounce', boom: 'gawk', tap: 'bounce' },
  }),
  leal: T('leal', {
    latency: [0.1, 0.3], tempo: 1, bounce: 1, hopEvery: [6, 12], doubleHop: 0.15, boldness: 0.6, pace: 1,
    posture: { lean: 0.04, crouch: 0, chin: 0.1 }, quirks: ['scan', 'sigh', 'stretch'], quirkEvery: [5, 10],
    react: { startle: 'brace', wonder: 'gawk', joy: 'cheer', boom: 'brace', tap: 'cheer' },
  }),
  callejero: T('callejero', {
    latency: [0.1, 0.3], tempo: 0.9, bounce: 0.9, hopEvery: [8, 14], doubleHop: 0.1, boldness: 0.3, pace: 1.1,
    posture: { lean: 0.03, crouch: 0.03, chin: 0 }, quirks: ['glance', 'stretch', 'sniff'], quirkEvery: [5, 10],
    react: { startle: 'flinch', wonder: 'gawk', joy: 'nod', boom: 'flinch', tap: 'nod' },
  }),
  piromano: T('piromano', {
    latency: [0.05, 0.2], tempo: 0.85, bounce: 1.15, hopEvery: [5, 10], doubleHop: 0.25, boldness: 0.8, pace: 1.1,
    posture: { lean: 0.1, crouch: 0, chin: 0.1 }, quirks: ['flare', 'flare', 'pounce'], quirkEvery: [4, 9],
    react: { startle: 'advance', wonder: 'bounce', joy: 'cheer', boom: 'cheer', tap: 'bounce' },
  }),
};

/** any cat without a known trait: a calm, curious house cat */
export const DEFAULT_TEMPERAMENT: Temperament = T('default', {
  latency: [0.1, 0.3], tempo: 1, bounce: 1, hopEvery: [6, 12], doubleHop: 0.15, boldness: 0.4, pace: 1,
  posture: { lean: 0, crouch: 0, chin: 0 }, quirks: ['scan', 'glance', 'stretch'], quirkEvery: [5, 10],
  react: { startle: 'gawk', wonder: 'gawk', joy: 'cheer', boom: 'flinch', tap: 'cheer' },
});

/** mass by rarity (bigger legends weigh more); primordials are titans */
const RARITY_MASS: Record<string, number> = { common: 0.9, rare: 1, epic: 1.1, legendary: 1.3, mythic: 1.4, heroic: 1.4, divine: 1.5, secret: 1.2 };
export const PRIMORDIAL_MASS = 1.8;

/** cats whose body is a joke about weight (or lightness), by species id */
const SPECIES_MASS: Record<string, number> = {
  c_plomito: 1.7, // made of lead, sleeps like it
  c_espumita: 0.75, // foam
};

export function weightOf(mass: number): Weight {
  const m = Math.max(0.6, Math.min(2.2, mass));
  return { mass: m, squash: Math.max(0.35, Math.min(1.3, 1.25 - (m - 0.8) * 0.6)), inertia: 0.75 + m * 0.3 };
}

/**
 * The SOLEMN overlay of the primordials: they never hop on their own, react slowly and with weight, and keep a
 * flavor of their trait (the bravos plant their feet, the vain ones lift the chin, the gossips lean in).
 */
export function solemnize(t: Temperament): Temperament {
  const flavor: Partial<Record<EventKind, Reaction>> =
    t.id === 'bravucon' ? { startle: 'brace', boom: 'brace', joy: 'puff', tap: 'puff' }
    : t.id === 'piromano' ? { boom: 'puff', joy: 'puff' }
    : t.id === 'presumido' ? { wonder: 'preen', tap: 'preen', startle: 'preen' }
    : t.id === 'chismoso' ? { wonder: 'gawk', startle: 'gawk' }
    : t.id === 'rencoroso' ? { startle: 'glare', wonder: 'glare', tap: 'glare' }
    : t.id === 'leal' ? { startle: 'brace', boom: 'brace' }
    : t.id === 'perezoso' || t.id === 'dormilon' ? { startle: 'late', wonder: 'late', tap: 'late' }
    : {};
  const quirk: Quirk = t.id === 'presumido' ? 'preen' : t.id === 'rencoroso' ? 'glare' : t.id === 'bravucon' ? 'puff' : 'scan';
  return {
    ...t,
    id: `${t.id}+solemn`,
    latency: [t.latency[0] + 0.15, t.latency[1] + 0.35],
    tempo: t.tempo * 1.45,
    bounce: t.bounce * 0.45,
    hopEvery: null,
    doubleHop: 0,
    boldness: Math.max(0.2, t.boldness),
    pace: t.pace * 0.72,
    posture: { lean: t.posture.lean * 0.5, crouch: Math.min(0, t.posture.crouch) - 0.06, chin: Math.max(0.25, t.posture.chin) },
    quirks: ['loom', 'bow', quirk],
    quirkEvery: [8, 16],
    react: { startle: 'loom', wonder: 'loom', joy: 'nod', boom: 'loom', tap: 'nod', ...flavor },
  };
}

/** Canelo: impatient, first to jump, never admits a miss. Same in every form (Almirante, Astral…). */
export const CANELO: Temperament = T('canelo', {
  ...TEMPERAMENTS.impaciente,
  latency: [0, 0.08],
  bounce: 1.25,
  hopEvery: [4, 8],
  doubleHop: 0.6,
  quirks: ['tap', 'tap', 'zoom', 'swat', 'pounce'],
  quirkEvery: [3.5, 7],
  react: { startle: 'advance', wonder: 'swat', joy: 'zoom', boom: 'brace', tap: 'zoom' },
});

const cache = new Map<string, MotionProfile>();

/** the motion profile of a species (never throws: unknown ids get the default house cat) */
export function motionProfile(species: string): MotionProfile {
  const hit = cache.get(species);
  if (hit) return hit;
  const def: CatDef | undefined = CAT_BY_ID.get(species);
  const trait = def?.trait ?? '';
  const base = TEMPERAMENTS[trait] ?? DEFAULT_TEMPERAMENT;
  const solemn = !!def?.primordial;
  const signature = species === 'c_canelo' ? 'canelo' : null;
  const temperament = signature ? CANELO : solemn ? solemnize(base) : base;
  const mass = SPECIES_MASS[species] ?? (solemn ? PRIMORDIAL_MASS : (RARITY_MASS[def?.rarity ?? ''] ?? 1));
  const p: MotionProfile = { species, trait, temperament, weight: weightOf(mass), solemn, signature };
  cache.set(species, p);
  return p;
}

/**
 * How much purposeful motion to play: 0 with «reducir movimiento» (the cats keep their plain, older acting:
 * no anticipations, no squash, no extra hops), 1 otherwise.
 */
export function motionAmount(reduceMotion: boolean): number {
  return reduceMotion ? 0 : 1;
}

/** a stable 32-bit seed from a string (cat uid): each cat gets its own visual dice */
export function seedOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
