/** Player settings (persisted separately from the save). */
export const settings = {
  reduceMotion: false,
  reduceFlashes: false,
  muted: false,
  sfxVolume: 0.7,
  musicVolume: 0.35,
  /** "sin filtro" (profanity) vs "familiar" */
  sinFiltro: true,
};

const KEY = 'nolc-settings';

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) Object.assign(settings, JSON.parse(raw));
  } catch {
    /* storage unavailable */
  }
}

export function saveSettings() {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable */
  }
}
