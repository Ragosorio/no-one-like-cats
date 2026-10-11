/** Player settings (persisted separately from the save). */

/** the five mixer buses (src/audio/*, docs/part-ii/19-audio-arquitectura.md) */
export type BusId = 'master' | 'music' | 'sfx' | 'ambient' | 'voice';
export const BUS_IDS: BusId[] = ['master', 'music', 'sfx', 'ambient', 'voice'];

/**
 * Slider positions 0..1 (what Ajustes shows). The bus GAIN is v² (busGain): sliders feel even across
 * their travel. Music 0.6 → gain 0.36 ≈ the old default (musicVolume 0.35 was a raw gain).
 */
export const VOL_DEFAULTS: Record<BusId, number> = { master: 0.9, music: 0.6, sfx: 0.84, ambient: 0.7, voice: 0.85 };

export const settings = {
  reduceMotion: false,
  reduceFlashes: false,
  muted: false,
  /** LEGACY raw gains (≤ 2026-10-09). Still written (= vol² ) so an older cached build sounds the same; read `vol`. */
  sfxVolume: 0.7,
  musicVolume: 0.35,
  /** "sin filtro" (profanity) vs "familiar" */
  sinFiltro: true,
  /** per-bus slider positions 0..1 */
  vol: { ...VOL_DEFAULTS } as Record<BusId, number>,
  /** Parte II sound invitation (src/audio/invite.ts): null = never shown; the player's answer otherwise */
  soundInvite: null as null | 'on' | 'off',
  /**
   * Ajustes › Audio «Ajuste de ritmo» (ms, −200…+200): how much later than the engine thinks the music reaches the
   * player's ears (Bluetooth headphones, TV sound). Battle music plans (src/battle/music) shift their beat by it.
   */
  rhythmOffsetMs: 0,
  /** settings shape version (2 = per-bus `vol`) */
  sv: 2,
};

export type Settings = typeof settings;

const KEY = 'nolc-settings';

const clamp01 = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : d);

/**
 * Old settings → new shape (pure; tests/audio.test.ts). Never throws, keeps unknown keys.
 * v1 had raw gains `musicVolume`/`sfxVolume`; v2 keeps the same LOUDNESS: slider = √gain.
 */
export function migrateSettings(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...raw };
  const old = (raw.vol && typeof raw.vol === 'object' ? raw.vol : null) as Record<string, unknown> | null;
  const vol: Record<BusId, number> = { ...VOL_DEFAULTS };
  if (old) {
    for (const b of BUS_IDS) vol[b] = clamp01(old[b], VOL_DEFAULTS[b]);
  } else {
    if (typeof raw.musicVolume === 'number' && Number.isFinite(raw.musicVolume)) vol.music = Math.round(Math.sqrt(clamp01(raw.musicVolume, 0.35)) * 100) / 100;
    if (typeof raw.sfxVolume === 'number' && Number.isFinite(raw.sfxVolume)) vol.sfx = Math.round(Math.sqrt(clamp01(raw.sfxVolume, 0.7)) * 100) / 100;
  }
  out.vol = vol;
  if (out.soundInvite !== 'on' && out.soundInvite !== 'off') out.soundInvite = null;
  if (typeof out.muted !== 'boolean') out.muted = false;
  out.sv = 2;
  out.musicVolume = vol.music * vol.music;
  out.sfxVolume = vol.sfx * vol.sfx;
  return out;
}

/** bus gain for a slider value (0..1 → 0..1, perceptual-ish curve) */
export const sliderGain = (v: number) => Math.max(0, Math.min(1, v)) ** 2;
/** current gain of a bus (master excluded unless asked; mute not applied) */
export const busGain = (b: BusId) => sliderGain(settings.vol[b] ?? VOL_DEFAULTS[b]);
/** linear 0..1 loudness for things outside the Web Audio graph (speech synthesis) */
export function voiceLoudness() {
  if (settings.muted) return 0;
  return Math.max(0, Math.min(1, (settings.vol.voice ?? VOL_DEFAULTS.voice) * (settings.vol.master ?? VOL_DEFAULTS.master) * 1.25));
}

export function loadSettings() {
  let saved = false;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') Object.assign(settings, migrateSettings(parsed));
      saved = true;
    }
  } catch {
    /* storage unavailable */
  }
  // first run: follow the system's "reduce motion" (the player can still change it in Ajustes)
  if (!saved) {
    try {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        settings.reduceMotion = true;
        settings.reduceFlashes = true;
      }
    } catch {
      /* no matchMedia */
    }
  }
}

export function saveSettings() {
  // legacy mirrors (an older cached tab reads these)
  settings.musicVolume = busGain('music');
  settings.sfxVolume = busGain('sfx');
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable */
  }
}
