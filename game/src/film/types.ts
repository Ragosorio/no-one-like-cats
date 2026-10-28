/**
 * PELÍCULAS — authoring types (docs/part-iii/14 §2, docs/part-iii/cine-v2/02-api.md).
 *
 * A FILM is a Momento in FILM MODE: the same score format (`at` / `on` / `key` / `tap` from momentos/score.ts) on a
 * deterministic timeline, scenes BUILT AND BAKED before the clock (a styled loading screen), scrubbable (render(m)),
 * with 0–3 OPTIONAL inputs that never change anything but a flourish. What is new lives here: scenes with a style, a
 * 2.5D camera, weather and light, a presentation layer (letterbox, cards, subtitles) and transitions between scenes.
 *
 * Pure types: nothing here imports Pixi (the timeline / camera / validation are tested in node).
 */
import type { ScoreEntry } from '../momentos/types';

/** what a film is for — it decides the skip rule (timeline.ts skipMode) */
export type FilmKind = 'song' | 'briefing' | 'interlude' | 'demo';

/**
 * How a film can be left. 'never' = only pause (Esc / «II» / hidden tab) · 'pause' = the pause menu has SALIR ·
 * 'button' = a visible SALTAR chip (and SALIR in the pause menu).
 */
export type SkipMode = 'never' | 'pause' | 'button';
export interface SkipRule {
  /** the first time the player sees it */
  first: SkipMode;
  /** once seen (Volver a ver, a replayed briefing) */
  after: SkipMode;
}

// ------------------------------------------------------------------ camera (scene-local keyframes)
export type CamEase = 'linear' | 'in' | 'out' | 'inOut' | 'sine' | 'expoOut' | 'hold';
/**
 * A camera keyframe in SCENE-LOCAL seconds. Every field is optional: what a key doesn't set keeps the previous value
 * (the move tweens from where the camera got to). Units: x / y in the scene's world px (the 1920×1080 design box is
 * the plane at depth `focal`), z = dolly (world px toward the set), fov = zoom multiplier (1 = the lens at rest),
 * roll = Dutch angle (rad), focus = the depth in focus (rack focus), hand = handheld amplitude (px), whip = a whip pan
 * offset (px, with motion blur while it moves).
 */
export interface CamKey {
  t: number;
  x?: number;
  y?: number;
  z?: number;
  fov?: number;
  roll?: number;
  focus?: number;
  hand?: number;
  whip?: number;
  /** how the move INTO this key eases (default inOut) */
  ease?: CamEase;
}
export interface CamState {
  x: number;
  y: number;
  z: number;
  fov: number;
  roll: number;
  focus: number;
  hand: number;
  whip: number;
}

// ------------------------------------------------------------------ transitions
export type TransitionKind =
  | 'cut'
  | 'fade'
  | 'dissolve'
  | 'iris'
  | 'door'
  | 'pageTurn'
  | 'inkBleed'
  | 'paintSmear'
  | 'glitch'
  | 'objectToSet'
  | 'match'
  | 'whip'
  | 'lightLeak';
export interface TransitionSpec {
  kind: TransitionKind;
  /** seconds (the overlap of the two scenes); 'cut' = 0 */
  dur: number;
  /** fade: through this color (default the film's black) */
  color?: number;
  /** iris / objectToSet / match: the screen point (design box) it opens from or closes on */
  at?: [number, number];
  /** objectToSet: the object's rect on screen at the start [x, y, w, h] */
  rect?: [number, number, number, number];
  /** door / whip / paintSmear / pageTurn: direction (1 = to the right, -1 = to the left) */
  dir?: 1 | -1;
  /** ink / paint / light color */
  tint?: number;
  /** a seed for the noise masks */
  seed?: number;
  /**
   * play it on the OUTGOING scene (it closes / goes away over the next one) instead of revealing the incoming one —
   * e.g. an iris OUT that closes on a point while the next scene waits underneath
   */
  out?: boolean;
  /** take `at` from a named anchor of the outgoing set (live, e.g. 'lantern'), falling back to `at` */
  anchor?: string;
}

// ------------------------------------------------------------------ weather + light
export type WeatherKind = 'rain' | 'fog' | 'wind' | 'snow' | 'lightning' | 'heat' | 'rays';
export interface WeatherSpec {
  kind: WeatherKind;
  /** 0..1 strength at rest (a score key '<scene>.<kind>' animates it) */
  amount?: number;
  /** wind direction / slant (rad, 0 = straight down for rain, → for wind) */
  angle?: number;
  /** tint of drops / fog / rays / particles */
  color?: number;
  /** wind: 'leaf' | 'petal' | 'ember' | 'dust' | 'firefly' | 'stroke' */
  particle?: string;
  /** rain: the ground line (scene world y) where splashes land; fog: the band [y0, y1] */
  ground?: number;
  band?: [number, number];
  /** rays / lightning: the source point (scene world) */
  from?: [number, number];
  /** lightning: strike times (scene-local s) — each one asks the FlashGuard */
  strikes?: number[];
  /** a seed (deterministic particles) */
  seed?: number;
  /** depth (for parallax: which plane it rides; default in front of everything) */
  z?: number;
}

// ------------------------------------------------------------------ presentation
/** typography per dimension / style (present.ts TYPE) */
export type TypeStyle = 'vangogh' | 'davinci' | 'noir' | 'tv' | 'silent' | 'ukiyoe' | 'bass' | 'default';
export interface CardSpec {
  /** scene-local start (s) */
  t: number;
  dur: number;
  text: string;
  /** a smaller second line */
  sub?: string;
  /** chapter numeral («I», «II»…) shown above */
  num?: string;
  style?: TypeStyle;
  /** where: 'center' | 'low' | 'high' | [x, y] */
  pos?: 'center' | 'low' | 'high' | [number, number];
  /** title size (px of the design box); default by length */
  size?: number;
}
export interface SubSpec {
  /** scene-local start (s) */
  t: number;
  dur: number;
  text: string;
  /** who speaks (shown small before the line) */
  who?: string;
  style?: TypeStyle;
}

// ------------------------------------------------------------------ scenes
/** a style reference: an id from the style library + its parameters */
export type StyleRef = string | { id: string; params?: Record<string, number | string> };

export interface FilmSceneDef {
  /** unique inside the film; usable as a time address in the score ('noche', 'noche+2', …) */
  id: string;
  /** seconds on screen, transitions included (the next scene's `in` overlaps the end of this one) */
  dur: number;
  style: StyleRef;
  /** the set module (film/stage.ts SetModule: `{ cats?, build(ctx) }`, or a module whose default export is one). Lazy so the pure core never imports Pixi. */
  set: () => Promise<unknown>;
  /** the camera (scene-local keyframes) */
  cam?: CamKey[];
  /**
   * the camera with «Reducir movimiento»: a calmer version of the fast travels (a hold or a slow push instead of a
   * flight). Default: `cam` itself (handheld and whip removed, parallax flattened, Dutch ×0.3).
   */
  camRm?: CamKey[];
  weather?: WeatherSpec[];
  /** how it comes in from the previous scene (the first scene: from black) */
  in?: TransitionSpec;
  /** the picture aspect this scene wants (letterbox / pillarbox): 1.78 = full frame, 2.39 = scope, 1.33 = old film */
  aspect?: number;
  /** cards and subtitles (compiled into score cues) */
  cards?: CardSpec[];
  subs?: SubSpec[];
  /** the post look of this scene (film/post.ts PostLook keys; the style's defaults underneath) */
  look?: Record<string, number>;
}


export interface FilmGate {
  scene: string;
  /** scene-local seconds */
  t: number;
  /** 1–3 words on the button */
  label: string;
  /** where the button sits (design box); default bottom centre. A set anchor name works too */
  at?: [number, number] | string;
}

export interface FilmDef {
  id: string;
  /** shown in Volver a ver and on the loading screen (spoiler-free) */
  title: string;
  kind: FilmKind;
  /**
   * The music. null / undefined = silence (a synthetic 60 BPM grid). A derived variation ('drunck.resaca') for
   * briefings and interludes; an owner ORIGINAL only in a 'song' film (validateFilm enforces it).
   */
  track?: string | null;
  /** synthetic grid tempo when there is no track (default 60: one beat = one second) */
  bpm?: number;
  /**
   * A FRAGMENT film: the song time where the film starts (a bar line: '#36' = c37 — score bars are 0-based —, or
   * seconds). Film time 0 = this instant of the track; scenes, cards and NUMBERS in the score stay in film seconds;
   * string addresses ('#44', 'oh_shit_1') resolve on the song as always. Without a track map it is ignored (the
   * synthetic grid starts at 0). Default 0 (FILM-ACTO1).
   */
  from?: number | string;
  /**
   * the track's beat map as raw JSON (import 'data/music/beatmaps/<id>.json'): the timeline uses it when the track is
   * not registered in tracks.json yet (the film plays silent on that exact grid until the audio lands)
   */
  map?: unknown;
  /**
   * (FILM-ACTO3, optional) a SEGUE: at `at` (film seconds, or a song address like '#64' = c65) the music goes on in
   * ANOTHER registered track, from its position `from` (s, default 0) — one film, two decks, no seam (No wey → its
   * bridge into DISTOR, `no_wey.puente`). `at` must fall on a bar line; the clock follows the second deck unaware.
   * Without a track map (or without sound) nothing changes: the film keeps its own time.
   */
  segue?: { track: string; at: number | string; from?: number };
  /**
   * «continue» gates: the clock stops at a scene-local instant and waits for the player's tap (DÍSELO, «toca el faro»).
   * They count as inputs (0–3 in total) and never change anything but when the film goes on. Scrub ignores them.
   */
  gates?: FilmGate[];
  scenes: FilmSceneDef[];
  /** the score, in FILM time (Momento format: at / on / key / tap / hold — at most 3 inputs, all optional) */
  score?: ScoreEntry[];
  /** override the kind's skip rule */
  skip?: Partial<SkipRule>;
  /** the music stops DRY at the film's end (no release fade): «corte en seco» */
  cutDry?: boolean;
  /**
   * (agent FINAL) its song goes ON after the film ends, looping at the track's loop points: what follows (a playable
   * piece, the next film with `join`) rides it, and whoever comes last releases it. EL FINAL: Canelo's theme from the
   * dawn through the breakfast into the blow («el tema de Canelo, en bucle suave… sigue, más bajo… se corta en seco»).
   */
  keep?: boolean;
  /**
   * (agent FINAL) when its track is already playing (kept by the film before), the film rides that deck from where it
   * is — no restart, its own clock — ducked `db`; otherwise it plays its track from `from` as usual.
   */
  join?: { db?: number };
  /**
   * (agent FINAL) a film without its own track that CARRIES the music playing when it starts (a battle's): optionally
   * crossfaded to `to` at the same file position (a thinner mix of the same piece: «pierde capas»), ducked along `duck`
   * ([film s, dB] points, linear in between), and cut dry at `cut` (film s) — after the cut, silence until the film ends.
   */
  carry?: { to?: string; duck?: [number, number][]; cut?: number };
  /**
   * film-time windows [from, to] (s) where the film's own music goes quiet (ducked deep, live runs only, always
   * released when the film ends) — e.g. the empty stadium after the karaoke (FILM-ACTO4). Absent = no change.
   */
  quiet?: [number, number][];
  /** the loading screen: its look ('vangogh' | 'davinci' | 'noir' | …) and a caption */
  loader?: { style?: TypeStyle; caption?: string };
  /** how it ends (after the last scene): default a 1.2 s fade to black */
  close?: TransitionSpec;
  /** default post look for the whole film */
  look?: Record<string, number>;
}
