/**
 * Stingers: short musical one-shots on the music bus (Ajustes › MÚSICA), with a brief dip of the
 * music under them so they read. Procedural recipes here; a file stinger is declared in
 * director.json › stingers[id] = { "file": "music/stingers/x.mp3", "gain": 0.8 } (decoded, played,
 * released; if it fails or is not decoded within LATE_MS, its procedural recipe plays instead). Unknown ids
 * fall back to a core SFX with the same name, else nothing.
 */
import { audio, SfxName, Voice } from '../core/audio';
import { musicUrl } from './catalog';

const R = (f: number, n: number) => f * Math.pow(2, n / 12);

/** procedural recipes: voices + how long the music dips (s) */
export const STINGERS: Record<string, { voices: Voice[]; dip: number }> = {
  // a little door opening: rising arpeggio + a glassy tail
  discovery: {
    dip: 1.6,
    voices: [
      { wave: 'triangle', freq: R(523.25, 0), dur: 0.5, vol: 0.12 },
      { wave: 'triangle', freq: R(523.25, 4), dur: 0.5, vol: 0.12, delay: 0.09 },
      { wave: 'triangle', freq: R(523.25, 7), dur: 0.6, vol: 0.12, delay: 0.18 },
      { wave: 'sine', freq: R(523.25, 12), dur: 1.3, vol: 0.13, delay: 0.27, vib: 4 },
      { wave: 'sine', freq: R(523.25, 19), dur: 1.4, vol: 0.05, delay: 0.32 },
      { wave: 'noise', freq: 3, dur: 0.9, vol: 0.05, delay: 0.25, hp: 6000, attack: 0.3 },
    ],
  },
  // a needle on a record: dusty crackle, then a three-note bell
  unlock: {
    dip: 2.2,
    voices: [
      { wave: 'noise', freq: 2.2, to: 1.4, dur: 0.35, vol: 0.09, hp: 2600, attack: 0.01 },
      { wave: 'sine', freq: 659.25, dur: 0.9, vol: 0.13, delay: 0.32 },
      { wave: 'sine', freq: 1318.5, dur: 0.6, vol: 0.04, delay: 0.32 },
      { wave: 'sine', freq: 783.99, dur: 0.9, vol: 0.13, delay: 0.52 },
      { wave: 'sine', freq: 1567.98, dur: 0.6, vol: 0.04, delay: 0.52 },
      { wave: 'sine', freq: 1046.5, dur: 1.6, vol: 0.14, delay: 0.72, vib: 3 },
      { wave: 'triangle', freq: 2093, dur: 1.2, vol: 0.03, delay: 0.74 },
    ],
  },
  // a long falling whistle, then the soft thud far away
  star_fall: {
    dip: 2.6,
    voices: [
      { wave: 'sine', freq: 2600, to: 520, dur: 1.5, vol: 0.09, attack: 0.08, vib: 9 },
      { wave: 'triangle', freq: 5200, to: 1040, dur: 1.4, vol: 0.02, attack: 0.08 },
      { wave: 'noise', freq: 0.5, to: 0.12, dur: 1.4, vol: 0.32, delay: 1.45, lp: 600, attack: 0.02 },
      { wave: 'sine', freq: 70, to: 38, dur: 1.0, vol: 0.32, delay: 1.45 },
      { wave: 'sine', freq: 1567.98, dur: 1.8, vol: 0.035, delay: 1.6, vib: 5 },
    ],
  },
  // SINCRO on the pulse (battle/music): D5 + G5, short and bright (LIKY's G minor)
  sincro: {
    dip: 0.5,
    voices: [
      { wave: 'triangle', freq: 587.33, dur: 0.35, vol: 0.12, attack: 0.003 },
      { wave: 'triangle', freq: 783.99, dur: 0.35, vol: 0.12, attack: 0.003 },
      { wave: 'sine', freq: 1567.98, dur: 0.5, vol: 0.05, delay: 0.02 },
    ],
  },
  // the curtain: a soft swell into a major chord (gentler than the core SFX 'reveal')
  reveal: {
    dip: 2.4,
    voices: [
      { wave: 'noise', freq: 0.6, to: 1.6, dur: 1.0, vol: 0.06, lp: 2400, attack: 0.8 },
      { wave: 'triangle', freq: 261.63, dur: 2.0, vol: 0.07, delay: 0.85, attack: 0.05 },
      { wave: 'triangle', freq: 329.63, dur: 2.0, vol: 0.07, delay: 0.85, attack: 0.05 },
      { wave: 'triangle', freq: 392.0, dur: 2.0, vol: 0.07, delay: 0.85, attack: 0.05 },
      { wave: 'sine', freq: 1046.5, dur: 1.8, vol: 0.06, delay: 0.95, vib: 5 },
    ],
  },
};

const fileCache = new Map<string, Promise<AudioBuffer | null>>();
/** a file stinger heard this late is off the moment it marks: play the recipe instead */
const LATE_MS = 700;

export function playStinger(id: string, o: { gain?: number; files?: Record<string, { procedural?: string; file?: string; gain?: number }> } = {}) {
  const ctx = audio.ctx;
  if (!ctx || audio.muted) return;
  const decl = o.files?.[id];
  const gain = Math.max(0, Math.min(2, (o.gain ?? 1) * (decl?.gain ?? 1)));
  if (decl?.file) {
    const url = musicUrl(decl.file);
    let p = fileCache.get(url);
    if (!p) {
      p = fetch(url)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
        .then((b) => ctx.decodeAudioData(b))
        .catch(() => null);
      fileCache.set(url, p);
    }
    // not loaded in time (first play, slow network) or failed → the procedural one, never silence
    let settled = false;
    const fallback = () => procedural(id, decl.procedural, gain);
    const late = setTimeout(() => {
      if (settled) return;
      settled = true;
      fallback();
    }, LATE_MS);
    void p.then((buf) => {
      clearTimeout(late);
      // a failed load is retried next time (offline blip); stingers are short: keep a handful decoded
      if (!buf) fileCache.delete(url);
      else if (fileCache.size > 6) fileCache.delete(fileCache.keys().next().value as string);
      if (settled) return;
      settled = true;
      if (!buf) return fallback();
      if (!audio.ctx || audio.muted) return;
      const s = ctx.createBufferSource();
      s.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = gain;
      s.connect(g).connect(audio.musicBus);
      dip(Math.min(4, buf.duration));
      s.onended = () => g.disconnect();
      s.start();
    });
    return;
  }
  procedural(id, decl?.procedural, gain);
}

/**
 * (ext) the scenes' motifs as last-chance recipes (src/cine/sound.ts registers MOTIFS): a recorded stinger whose file
 * fails or comes late plays the scene motif of the same idea ('tromba', 'eco', 'correccion'…) instead of nothing.
 */
let motifRecipe: ((id: string) => Voice[] | null) | null = null;
export function setStingerMotifs(fn: (id: string) => Voice[] | null) {
  motifRecipe = fn;
}
function fromMotif(id: string | undefined): { voices: Voice[]; dip: number } | null {
  if (!id || !motifRecipe) return null;
  const v = motifRecipe(id);
  return v && v.length ? { voices: v, dip: 2.4 } : null;
}

/** the recipe named in the table, else the id's own, else a scene motif of that name, else its family
 *  (discovery_mi → discovery), else a core SFX */
function procedural(id: string, named: string | undefined, gain: number) {
  const ctx = audio.ctx;
  if (!ctx || audio.muted) return;
  const rec = (named && STINGERS[named]) || STINGERS[id] || fromMotif(named) || fromMotif(id) || STINGERS[id.split('_')[0]];
  if (rec) {
    const g = ctx.createGain();
    g.gain.value = gain;
    g.connect(audio.musicBus);
    for (const v of rec.voices) audio.voice(v, g);
    dip(rec.dip);
    setTimeout(() => g.disconnect(), (rec.dip + 3) * 1000);
    return;
  }
  // last resort: a core SFX of that name
  if (id in sfxNames) audio.play(id as SfxName);
}
// names of the core SFX (keyof at runtime without importing the table)
const sfxNames: Record<string, true> = Object.fromEntries(
  ['click', 'hover', 'coin', 'gem', 'pop', 'nyam', 'levelup', 'whoosh', 'shoot', 'boom', 'bigboom', 'hit', 'crit', 'shield', 'zap', 'splash', 'freeze', 'charge', 'reveal', 'fanfare', 'drumroll', 'sting', 'error', 'tick', 'alarm', 'meow', 'purr', 'paper', 'glitch'].map((k) => [k, true]),
);

/** music dips ~4 dB under a stinger, then comes back */
function dip(sec: number) {
  audio.duck('stinger', true, 4);
  setTimeout(() => audio.duck('stinger', false), sec * 1000);
}
