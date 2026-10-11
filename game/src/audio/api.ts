/**
 * AUDIO FACADE (Parte II) — the one door every system uses for music, ambience, stingers and mixing.
 * Contract shared by the story, scenes, battles and the Fonoteca (docs/part-ii/19-audio-arquitectura.md).
 *
 * The audio engine (src/audio/*) implements it; until it does, these are safe no-ops so callers can be
 * written against the contract. Rules:
 *  - track ids come from src/data/music/tracks.json (e.g. 'liky_fight', 'liky_fight.ambient')
 *  - music STATES are the adaptive layer: the director picks/crossfades tracks per state, bar-quantized
 *  - narrative cues (cue()) override the player's chosen island music while active
 *  - nothing here may throw if audio is locked/muted/unavailable
 */
export type MusicState =
  | 'title'
  | 'island'
  | 'island_night_astral'
  | 'explore'
  | 'explore_mystery'
  | 'discovery'
  | 'battle'
  | 'battle_special'
  | 'boss'
  | 'victory'
  | 'emotional'
  | 'silence';

export interface CueOpts {
  /** start at a named section/marker of the track (beat map) */
  section?: string;
  fadeIn?: number;
  fadeOut?: number;
  /** wait for the next bar/beat of the CURRENT track before switching */
  quantize?: 'bar' | 'beat' | 'now';
  loop?: boolean;
  /**
   * this cue is narrative: it lasts until release() (survives state changes). A NON-narrative cue
   * (a special battle's song) also ends by itself when the adaptive state changes to another state.
   * Either kind overrides the player's island music while active.
   */
  narrative?: boolean;
  /** (ext) sample-accurate playback from a decoded buffer — use for beat-synced scenes */
  sync?: boolean;
  /** (ext) start at this file position in seconds (when no section is given) */
  at?: number;
  /**
   * (ext) restart even when this ref is already the current track: a quantized jump to another section of the SAME
   * song (battle music plans, src/battle/music). Without it a cue of the playing ref is a no-op, as always.
   */
  restart?: boolean;
}

export interface AudioApi {
  /** adaptive state (director chooses the music) */
  setState(state: MusicState, opts?: { fade?: number; context?: string }): void;
  /** play a specific track/variation now (narrative scenes, special battles); returns a handle */
  cue(trackId: string, opts?: CueOpts): void;
  /** stop narrative cue and give music back to the adaptive state */
  release(fade?: number): void;
  /** ambience bed (procedural or file): 'sea', 'rain', 'storm', 'night_astral', 'cave', 'none'… */
  ambience(bed: string, opts?: { fade?: number; level?: number }): void;
  /** one-shot musical/sfx stinger: 'discovery', 'unlock', 'star_fall', 'reveal'… */
  stinger(id: string, opts?: { gain?: number }): void;
  /**
   * dialogue/voice ducking of music (and ambience, half as deep). Holds are counted per key
   * (default 'api'): every duck(true) needs its duck(false). amount = dB (default 6).
   */
  duck(on: boolean, amount?: number, key?: string): void;
  /** seconds since the current track's start in the audio clock, null if nothing synced is playing */
  trackTime(): number | null;
  /**
   * subscribe to beat-map events of the playing track: 'beat', 'bar', 'section:<name>', 'marker:<name>'
   * (+ ext: 'section' / 'marker' with info.name, 'hit' / 'hit:<kind>' with info.strength — MUSIC's
   * choreography hits —, 'voice:start' / 'voice:end'). info.time = AudioContext time of the event
   * (compare with ctx.currentTime); events fire when they become audible (latency-compensated).
   */
  on(event: string, fn: (info: { time: number; beat?: number; bar?: number; name?: string; strength?: number; late?: number }) => void): () => void;
  /** unlock a song in the player's Fonoteca (idempotent, persisted) */
  unlockSong(songId: string, source: string): void;
  /** (ext) warm the cache for a track you'll cue soon (no-op when unknown / data saver) */
  prefetch(trackId: string): void;
  /** (ext) ref of the file track playing now ('liky_fight', 'liky_fight.ambient'), null for procedural/silence */
  currentTrack(): string | null;
  /** (ext) the adaptive state last set */
  musicState(): MusicState;
  /**
   * (ext) the beat map of a track (default: the one playing): beats, downbeats, sections, markers,
   * loop, hits (time/strength/kind) and voice ranges — for choreography. Null when it has none.
   */
  beatMap(trackId?: string): Promise<import('./beatgrid').BeatMap | null>;
  /**
   * (ext) fetch + DECODE a track now and keep it decoded until unprepare(): a later `cue(…, { sync: true })` of it starts
   * at once (no fetch, no decode) and quantized jumps inside it are instant. Resolves true when ready (false: unknown
   * track, no AudioContext yet, network / decode error). Every prepare() needs its unprepare(). Momentos use it.
   */
  prepare(trackId: string): Promise<boolean>;
  unprepare(trackId: string): void;
  /** (ext) pause / resume the music deck that is playing (the director keeps its state). Momentos' pause menu. */
  pauseMusic(paused: boolean): void;
  /** (ext) play the music decks `db` louder (0 = normal). Momentos: their original sounds up front (doc 29 §6) */
  musicBoost(db: number): void;
  /**
   * (ext) gains (0..1) of a track's in-sync LAYERS (tracks.json `layers`, src/audio/layers.ts), by layer id; layers not
   * named are silent; null = the track's defaults. Kept per track: applies now if it plays, else when it starts.
   * e.g. setLayers('amb.suenos', { calido: 1, magia: 0.6 }, { fade: 3 }). No-op for tracks without layers.
   */
  setLayers(trackId: string, gains: Record<string, number> | null, opts?: { fade?: number }): void;
}

const noop = () => undefined;
const impl: AudioApi = {
  setState: noop,
  cue: noop,
  release: noop,
  ambience: noop,
  stinger: noop,
  duck: noop,
  trackTime: () => null,
  on: () => noop,
  unlockSong: noop,
  prefetch: noop,
  currentTrack: () => null,
  musicState: () => 'title',
  beatMap: async () => null,
  prepare: async () => false,
  unprepare: noop,
  pauseMusic: noop,
  musicBoost: noop,
  setLayers: noop,
};

/** the live implementation (installed by src/audio/engine.ts at boot) */
export const audioApi: AudioApi = impl;
export function installAudioApi(real: Partial<AudioApi>) {
  Object.assign(impl, real);
}
