/**
 * Spoken lines via the Web Speech API (speechSynthesis), optional and off-able.
 * Prefers a Latin-American Spanish voice (es-MX → es-US → es-419 → any es-* → es-ES).
 *   voice.enabled = true/false   (persisted in localStorage 'nolc-voice')
 *   speak('¿Miedo, capitana?', { pitch: 1.1 })
 * Honors the global mute (settings.muted). Never throws if the API is missing.
 */
import { settings } from './settings';

const KEY = 'nolc-voice';

function synth(): SpeechSynthesis | null {
  try {
    return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  } catch {
    return null;
  }
}

let cached: SpeechSynthesisVoice | null | undefined;
function pickVoice(): SpeechSynthesisVoice | null {
  const s = synth();
  if (!s) return null;
  if (cached !== undefined && cached !== null) return cached;
  const vs = s.getVoices();
  if (!vs.length) return null;
  const by = (re: RegExp) => vs.find((v) => re.test(v.lang.replace('_', '-')));
  cached = by(/^es-MX/i) ?? by(/^es-US/i) ?? by(/^es-419/i) ?? by(/^es-(AR|CO|CL|PE|VE)/i) ?? by(/^es/i) ?? null;
  return cached;
}
// voices load asynchronously in Chrome
try {
  synth()?.addEventListener?.('voiceschanged', () => {
    cached = undefined;
    pickVoice();
  });
} catch {
  /* ignore */
}

function load(): boolean {
  try {
    const v = localStorage.getItem(KEY);
    return v === null ? true : v === '1';
  } catch {
    return true;
  }
}

export const voice = {
  _enabled: load(),
  get enabled() {
    return this._enabled;
  },
  set enabled(v: boolean) {
    this._enabled = v;
    try {
      localStorage.setItem(KEY, v ? '1' : '0');
    } catch {
      /* ignore */
    }
    if (!v) stopVoice();
  },
  /** true when the browser can speak at all */
  get supported() {
    return !!synth();
  },
  /** name of the chosen voice (for the settings chip) */
  get voiceName() {
    return pickVoice()?.name ?? null;
  },
};

/** strip things TTS reads badly: stage directions (*zoom*), parentheses, ellipses, symbols */
export function speakable(text: string): string {
  return text
    .replace(/\*[^*]*\*/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[¡!¿?]{2,}/g, (m) => m[m.length - 1])
    .replace(/…|\.\.\./g, ', ')
    .replace(/[#_~^|<>{}[\]]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Speak a line (interrupting the previous one). Returns false if it can't speak. */
export function speak(text: string, o: { pitch?: number; rate?: number; volume?: number; queue?: boolean } = {}): boolean {
  const s = synth();
  if (!s || !voice.enabled || settings.muted) return false;
  const line = speakable(text);
  if (!line) return false;
  try {
    if (!o.queue) s.cancel();
    const u = new SpeechSynthesisUtterance(line);
    const v = pickVoice();
    if (v) u.voice = v;
    u.lang = v?.lang ?? 'es-MX';
    u.pitch = o.pitch ?? 1;
    u.rate = o.rate ?? 1.05;
    u.volume = Math.max(0, Math.min(1, (o.volume ?? 1) * Math.max(0.2, settings.sfxVolume + 0.3)));
    s.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function stopVoice() {
  try {
    synth()?.cancel();
  } catch {
    /* ignore */
  }
}
