/**
 * Sound for scenes (Parte II · Oleada 1), on top of the audio facade (src/audio/api.ts) — never inside it.
 *
 *   stingerOr('eco')                 the declared stinger if the music table has it (a file or a recipe), else the
 *                                    scene's own little motif with the same musical idea (docs/part-ii/18 §9)
 *   motif('registro_000')            play a motif now (music bus, so Ajustes › MÚSICA governs it)
 *   cueBest(['a.ambient', 'a'], o)   cue the first ref that exists in tracks.json (null = none: stay as you are)
 *   unlockSoon('when_i_lose', 'H35') Fonoteca unlock, idempotent, after the scene (the record card never covers it)
 *   syncO1Songs()                    catch-up: every O1 unlock the save has earned (runs on the island)
 *
 * The motifs are the catalog's ideas played by code until their recordings exist (doc 18 §9): the arc cell
 * Si♭–Do–Re♭ rising, REGISTRO 000's cell a semitone off (Si–Do♯–Re, out of tune), LIKY FIGHT's melody in a music
 * box (Re–Si♭–Sol: Canelo's Eco), CIRCUS MALUS's «perfect» final chords, dry. No file is ever requested.
 */
import { audio, type Voice } from '../core/audio';
import { audioApi, type CueOpts } from '../audio/api';
import { hasTrack } from '../audio/catalog';
import { STINGERS, setStingerMotifs } from '../audio/stingers';
import table from '../data/music/director.json';
import { G } from '../state/game';
import { whenCalm } from '../ui/hush';

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
const CENTS = (c: number) => Math.pow(2, c / 1200);

/** a music-box / celesta tine: fundamental + a bright partial, quick attack, ringing decay */
function tine(midi: number, at: number, o: { dur?: number; vol?: number; detune?: number; bright?: number; vib?: number } = {}): Voice[] {
  const f = hz(midi) * CENTS(o.detune ?? 0);
  const vol = o.vol ?? 0.11;
  return [
    { wave: 'sine', freq: f, dur: o.dur ?? 1.2, vol, delay: at, attack: 0.004, vib: o.vib },
    { wave: 'sine', freq: f * 4.01, dur: (o.dur ?? 1.2) * 0.35, vol: vol * (o.bright ?? 0.22), delay: at, attack: 0.002 },
    { wave: 'triangle', freq: f * 2, dur: (o.dur ?? 1.2) * 0.6, vol: vol * 0.18, delay: at, attack: 0.003 },
  ];
}
/** dry chord, arpeggiated a hair (the music box can't strike four teeth at once) */
function chord(midis: number[], at: number, o: { dur?: number; vol?: number } = {}): Voice[] {
  return midis.flatMap((m, i) => tine(m, at + i * 0.018, { dur: o.dur ?? 0.55, vol: (o.vol ?? 0.07) * (i === 0 ? 1 : 0.85), bright: 0.12 }));
}
const hiss = (dur: number, at = 0, vol = 0.025): Voice => ({ wave: 'noise', freq: 1.6, to: 1.1, dur, vol, delay: at, hp: 3200, attack: 0.25 });

/** the scenes' motifs (doc 18 §6, §9). Each one is short: ≤ 6 s */
export const MOTIFS: Record<string, () => Voice[]> = {
  /** the arc cell, celesta, rising slowly: «stars that fall upward» (Si♭–Do–Re♭, then Fa–Si♭ opens it) */
  arco: () => [...tine(70, 0, { dur: 1.6 }), ...tine(72, 0.42, { dur: 1.6 }), ...tine(73, 0.84, { dur: 2.2 }), ...tine(77, 1.5, { dur: 2.2, vol: 0.07 }), ...tine(82, 1.9, { dur: 2.8, vol: 0.06 })],
  /** the arc cell alone, unresolved (a question) */
  arco_pregunta: () => [...tine(70, 0, { dur: 1.8 }), ...tine(72, 0.5, { dur: 1.8 }), ...tine(73, 1.0, { dur: 3, vol: 0.09 })],
  /** REGISTRO 000 «observando»: Si–Do♯–Re, a detuned music box (−30 cents, wobbling), tape hiss; ends on Re */
  registro_000: () => [hiss(3.6, 0, 0.03), ...tine(59, 0.15, { detune: -30, vib: 1.4, dur: 1.4 }), ...tine(61, 0.65, { detune: -24, vib: 1.4, dur: 1.4 }), ...tine(62, 1.15, { detune: -36, vib: 1.6, dur: 2.6 })],
  /** Canelo's Eco: LIKY FIGHT's melody (Re–Si♭–Sol) in a music box, twice — the second time winding down */
  eco: () => [
    ...tine(74, 0, { dur: 1 }),
    ...tine(70, 0.27, { dur: 1 }),
    ...tine(67, 0.54, { dur: 1.4 }),
    ...tine(74, 1.3, { dur: 1, detune: -8 }),
    ...tine(70, 1.62, { dur: 1, detune: -14 }),
    ...tine(67, 1.98, { dur: 2.4, detune: -22 }),
    { wave: 'sine', freq: hz(43), dur: 3.6, vol: 0.05, attack: 0.6 },
  ],
  /** CIRCUS MALUS's «perfect» ending as a correction, dry: Fa♯–Sol–Si–Do → Fa♯–Sol–Si–Re */
  correccion: () => [...chord([66, 67, 71, 72], 0), ...chord([66, 67, 71, 74], 0.9, { dur: 1.2 })],
  /** the cave that remembers: a glass chord in Mi menor (Isla Nácar), slow attack */
  cristal: () => [64, 67, 71, 76].map((m, i): Voice => ({ wave: 'sine', freq: hz(m), dur: 3.4, vol: 0.05, delay: i * 0.12, attack: 0.9, vib: 1.2 })),
  /** an island without anyone: a low hollow tone */
  vacio: () => [{ wave: 'sine', freq: hz(40), dur: 3.2, vol: 0.09, attack: 0.5 }, { wave: 'triangle', freq: hz(52) * CENTS(-12), dur: 2.6, vol: 0.025, attack: 0.8 }],
  /** the page writes itself (a quill on paper) */
  pluma: () => [0, 0.22, 0.41, 0.66, 0.84].map((t): Voice => ({ wave: 'noise', freq: 2.8, to: 2.2, dur: 0.14, vol: 0.05, delay: t, hp: 2400, attack: 0.01 })),
};

// a recorded stinger that fails or comes late falls back to the scene motif of the same idea (director.json
// stingers[id].procedural names it): never silence
setStingerMotifs((id) => (MOTIFS[id] ? MOTIFS[id]() : null));

/** one note of the beam (Isla Nácar's mirrors): Mi menor, higher with every bounce */
export function nacarNote(i: number) {
  const scale = [64, 67, 71, 76, 79, 83];
  playVoices(tine(scale[Math.max(0, Math.min(scale.length - 1, i))] + 12, 0, { dur: 1.4, vol: 0.06, bright: 0.3 }));
}

function playVoices(vs: Voice[]) {
  try {
    if (!audio.ctx || audio.muted) return;
    const bus = audio.musicBus;
    for (const v of vs) audio.voice(v, bus);
  } catch {
    /* sound never breaks a scene */
  }
}

/** play a scene motif now */
export function motif(id: keyof typeof MOTIFS | string) {
  const m = MOTIFS[id];
  if (m) playVoices(m());
}

/** the first declared stinger the music table knows (a recording or a recipe; ids in order of preference, e.g. the
 *  discovery in the scene's key first), else our motif of the same idea */
export function stingerOr(ids: string | string[], fallback?: string, gain?: number) {
  const list = Array.isArray(ids) ? ids : [ids];
  const declared = (table as { stingers?: Record<string, unknown> }).stingers ?? {};
  const id = list.find((x) => x in declared || x in STINGERS);
  if (id) {
    audioApi.stinger(id, { gain });
    return 'stinger';
  }
  const m = fallback ?? list[0];
  motif(m);
  return MOTIFS[m] ? 'motif' : 'none';
}

/** cue the first track ref that exists (variations arrive over time); null when none does */
export function cueBest(refs: string[], o: CueOpts = {}): string | null {
  for (const r of refs) {
    if (!hasTrack(r)) continue;
    audioApi.cue(r, { narrative: true, ...o });
    return r;
  }
  return null;
}

/** Fonoteca unlock after the scene (idempotent; only refs that exist in tracks.json: no ghost records) */
export function unlockSoon(ref: string, source: string) {
  if (!hasTrack(ref)) return false;
  const go = () => audioApi.unlockSong(ref, source);
  if (!whenCalm(go, `song:${ref}`)) go();
  return true;
}

// ------------------------------------------------------------------ Oleada 1 · Fonoteca (doc 18 §8)
const has = (id: string) => !!G.s?.missions?.done.includes(id);
/** the first night happened (the opening's climax: b31_estrellas#a) */
const firstNight = () => !!G.s?.beatsSeen?.some((b) => b === 'b31_estrellas#a' || b === 'b31_estrellas');
const on = (id: string) => !!G.s?.missions && (G.s.missions.done.includes(id) || G.s.missions.active.includes(id));
/** what Oleada 1 hands the Fonoteca, and when (mission state: so it is the same after a reload or a reset) */
// the ORIGINAL songs belong to the Momentos (src/momentos, doc 29): Oleada 1 hands out their versions only
export const O1_SONGS: { ref: string; source: string; when: () => boolean }[] = [
  // the first night (doc 18 §8): the arc's intro loop, «Otras grabaciones» (its original is the motif that plays
  // when the stars go up: id `amb` in tracks.json) and the night itself
  { ref: 'yonose_todo.menu_loop', source: 'Las estrellas caen hacia arriba', when: firstNight },
  { ref: 'amb', source: 'Las estrellas caen hacia arriba', when: firstNight },
  { ref: 'amb.night_astral', source: 'Las estrellas caen hacia arriba', when: firstNight },
  { ref: 'when_i_lose.ambient', source: 'La Isla de las Páginas Hundidas', when: () => has('H33') },
  { ref: 'when_i_lose.battle', source: 'Shhh', when: () => has('H35') },
  { ref: 'liky_fight.battle', source: '¡A BABOR!', when: () => has('H38') },
  { ref: 'amb.nacar', source: 'Isla Nácar', when: () => on('H39') },
  { ref: 'circus_malus.stinger', source: 'La letra en el margen', when: () => has('H41') },
];
/** the records of one moment (the scene calls it at its point of no return; idempotent, after the scene) */
export function unlockMoment(refs: string[]) {
  for (const s of O1_SONGS) if (refs.includes(s.ref)) unlockSoon(s.ref, s.source);
}
/** catch-up (idempotent): every O1 record this save has earned and whose recording exists */
export function syncO1Songs() {
  for (const s of O1_SONGS) {
    try {
      if (s.when()) unlockSoon(s.ref, s.source);
    } catch {
      /* never breaks the island */
    }
  }
}
