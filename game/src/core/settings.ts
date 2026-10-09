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
  let saved = false;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      Object.assign(settings, JSON.parse(raw));
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
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable */
  }
}
