/**
 * PELÍCULAS — the timeline (pure; tests/filmTimeline.test.ts).
 *
 *  - sceneTimeline(def): where each scene starts and ends in FILM time (the next scene's `in` overlaps the end of the
 *    previous one; the first scene's `in` comes from black; `close` covers the end of the last one).
 *  - activeAt(tl, m): which scene(s) are on screen at m and how far the transition between them is (0..1).
 *  - timeBase(def, trackMap?): the beat map the score resolves on — the track's own (scenes added as markers) or a
 *    synthetic grid (silence: 60 BPM, one beat = one second, the scenes as sections).
 *  - toMomentoDef(def, stage): the film as a MomentoDef (cards / subtitles / strikes compiled into cues, inputs marked
 *    optional) — so MomentoRun plays it unchanged.
 *  - validateFilm(def, map): every authoring problem (tests require zero) — including resolveScore's own warnings.
 *  - skipMode(def, seen), bakeManifest(def), isOriginalRef(ref).
 */
import { cleanBeatMap, type BeatMap } from '../audio/beatgrid';
import type { Act, InputEntry, MomentoDef, ScoreEntry, StageFactory } from '../momentos/types';
import { at, v, resolveScore } from '../momentos/score';
import { resolveWhen } from '../momentos/time';
import tracksJson from '../data/music/tracks.json';
import type { FilmDef, FilmKind, FilmSceneDef, SkipMode, SkipRule, TransitionSpec } from './types';
import { CORE_BAKES, STYLES, TRANSITIONS, TYPE_STYLES, WEATHER } from './catalog';

export const MAX_INPUTS = 3;
/** default close: a short fade to black */
export const DEFAULT_CLOSE: TransitionSpec = { kind: 'fade', dur: 1.2, color: 0x000000 };

export interface SceneSpan {
  id: string;
  index: number;
  /** film time */
  start: number;
  end: number;
  /** the transition into this scene (overlap with the previous one, or from black for the first) */
  inT: TransitionSpec;
}
export interface FilmTimeline {
  scenes: SceneSpan[];
  close: TransitionSpec;
  /** total film length (s) */
  length: number;
}

const styleId = (s: FilmSceneDef['style']) => (typeof s === 'string' ? s : s.id);
const CUT: TransitionSpec = { kind: 'cut', dur: 0 };

export function sceneTimeline(def: FilmDef): FilmTimeline {
  const out: SceneSpan[] = [];
  let cursor = 0;
  def.scenes.forEach((s, i) => {
    const inT = s.in ?? CUT;
    const prev = out[i - 1];
    // the overlap never eats more than half of either scene
    const prevDur = prev ? prev.end - prev.start : Infinity;
    const ov = i === 0 ? 0 : Math.max(0, Math.min(inT.kind === 'cut' ? 0 : inT.dur, prevDur / 2, s.dur / 2));
    const start = i === 0 ? 0 : cursor - ov;
    out.push({ id: s.id, index: i, start, end: start + Math.max(0.001, s.dur), inT: { ...inT, dur: i === 0 ? Math.min(inT.kind === 'cut' ? 0 : inT.dur, s.dur / 2) : ov } });
    cursor = start + Math.max(0.001, s.dur);
  });
  const close = def.close ?? DEFAULT_CLOSE;
  const last = out[out.length - 1];
  const length = last ? last.end : 0;
  return { scenes: out, close: { ...close, dur: last ? Math.min(close.kind === 'cut' ? 0 : close.dur, (last.end - last.start) / 2) : 0 }, length };
}

/**
 * What is on screen at film time m: scene `a` (−1 = black), and while a transition runs, scene `b` coming in
 * (−1 = black, the close) with its progress p ∈ [0, 1). `t` is the transition playing (null = none).
 */
export interface Active {
  a: number;
  b: number;
  p: number;
  t: TransitionSpec | null;
}
export function activeAt(tl: FilmTimeline, m: number): Active {
  const S = tl.scenes;
  if (!S.length) return { a: -1, b: -1, p: 0, t: null };
  // the close (the last scene going to black)
  const last = S[S.length - 1];
  if (tl.close.dur > 0 && m >= last.end - tl.close.dur) {
    const p = Math.min(1, (m - (last.end - tl.close.dur)) / tl.close.dur);
    if (p >= 1) return { a: -1, b: -1, p: 0, t: null };
    return { a: last.index, b: -1, p, t: tl.close };
  }
  if (m >= last.end) return { a: -1, b: -1, p: 0, t: null };
  // walk back to the latest scene that has started
  let i = S.length - 1;
  while (i > 0 && m < S[i].start) i--;
  const s = S[i];
  if (s.inT.dur > 0 && m < s.start + s.inT.dur) {
    const p = Math.max(0, (m - s.start) / s.inT.dur);
    return { a: i - 1, b: i, p, t: s.inT };
  }
  return { a: i, b: -1, p: 0, t: null };
}
/** scene-local time of scene i at film time m */
export const localT = (tl: FilmTimeline, i: number, m: number) => m - (tl.scenes[i]?.start ?? 0);

// ------------------------------------------------------------------ the time base
/** a synthetic constant grid for a film without a track (sections = the scenes) */
export function syntheticMap(def: FilmDef, tl = sceneTimeline(def)): BeatMap {
  const bpm = def.bpm && def.bpm > 0 ? def.bpm : 60;
  const spb = 60 / bpm;
  const duration = tl.length + 4;
  const beats: number[] = [];
  const downbeats: number[] = [];
  for (let i = 0; i * spb <= duration + 1e-9; i++) {
    const t = Math.round(i * spb * 1e6) / 1e6;
    beats.push(t);
    if (i % 4 === 0) downbeats.push(t);
  }
  return {
    id: `film:${def.id}`,
    duration,
    bpm,
    offset: 0,
    beats,
    downbeats,
    beatsPerBar: 4,
    sections: tl.scenes.map((s, i) => ({ name: s.id, start: s.start, end: tl.scenes[i + 1]?.start ?? tl.length, energy: 0.5 })),
    markers: tl.scenes.map((s) => ({ name: `${s.id}_end`, time: s.end })),
  };
}
/** the track's own map with the scenes added as markers (`<scene>` and `<scene>_end`) */
export function withSceneMarkers(map: BeatMap, tl: FilmTimeline, off = 0): BeatMap {
  return {
    ...map,
    duration: Math.max(map.duration, off + tl.length + 1),
    markers: [...map.markers, ...tl.scenes.flatMap((s) => [{ name: s.id, time: off + s.start }, { name: `${s.id}_end`, time: off + s.end }])].sort((a, b) => a.time - b.time),
  };
}
/** a fragment film's start in SONG seconds (`def.from` on the track map; 0 without a map or a `from`) */
export function songFrom(def: Pick<FilmDef, 'from'>, map: BeatMap | null): number {
  if (!map || def.from === undefined || map.id?.startsWith('film:')) return 0;
  const t = resolveWhen(map, def.from);
  return t !== null && t > 0 ? t : 0;
}
/** the track's own map (registered), else the film's bundled raw map (`def.map`), else null */
export function trackMapOf(def: FilmDef, registered?: BeatMap | null): BeatMap | null {
  if (!def.track) return null;
  if (registered) return registered;
  return def.map ? cleanBeatMap(def.map, def.track) : null;
}
export function timeBase(def: FilmDef, trackMap?: BeatMap | null): BeatMap {
  const tl = sceneTimeline(def);
  const m = trackMapOf(def, trackMap);
  return m ? withSceneMarkers(m, tl, songFrom(def, m)) : syntheticMap(def, tl);
}
/** the gates in FILM time (sorted) */
export interface GateAt {
  m: number;
  label: string;
  at?: [number, number] | string;
}
export function gateTimes(def: FilmDef, tl = sceneTimeline(def)): GateAt[] {
  const out: GateAt[] = [];
  for (const g of def.gates ?? []) {
    const sp = tl.scenes.find((s) => s.id === g.scene);
    if (sp) out.push({ m: sp.start + g.t, label: g.label, at: g.at });
  }
  return out.sort((a, b) => a.m - b.m);
}

// ------------------------------------------------------------------ the film as a Momento
/** where a FILM second lands on the track: song time (+ the edit segment when the edit repeats a loop) */
export type Placer = (m: number) => { t: number; seg?: number };
const plainPlacer = (off: number): Placer => (m) => ({ t: off + m });
/** the score entries compiled from the scenes (cards, subtitles, lightning strikes, scene changes) */
export function sceneCues(def: FilmDef, tl = sceneTimeline(def), off = 0, place: Placer = plainPlacer(off)): ScoreEntry[] {
  const out: ScoreEntry[] = [];
  const atM = (m: number, act: Act): ScoreEntry => {
    const p = place(m);
    return p.seg === undefined ? at(p.t, act) : { ...at(p.t, act), seg: p.seg };
  };
  def.scenes.forEach((s, i) => {
    const sp = tl.scenes[i];
    const t0 = sp.start;
    out.push(atM(t0, v('scene', { id: s.id, i })));
    for (const c of s.cards ?? []) out.push(atM(t0 + c.t, v('card', { ...c, scene: s.id, style: c.style ?? STYLES[styleId(s.style)]?.type ?? 'default' })));
    for (const u of s.subs ?? []) out.push(atM(t0 + u.t, v('sub', { ...u, scene: s.id, style: u.style ?? STYLES[styleId(s.style)]?.type ?? 'default' })));
    for (const w of s.weather ?? []) if (w.kind === 'lightning') for (const t of w.strikes ?? []) out.push(atM(t0 + t, v('lightning', { scene: s.id, seed: w.seed ?? 1, from: w.from ?? null })));
  });
  return out;
}
/**
 * NUMBERS in a film's score are film seconds → song seconds (+ segment); string addresses are song time already.
 * An input's numeric `until` (choice / hold / mash) is film time too (QA-P3: F12's blanket stayed in film seconds, fell
 * «outside the edit» of its looped piece and the window closed at its start, 1.7 s instead of 3.9 s). If it would land
 * past the end of its prompt's segment (a loop boundary inside the window), it closes at that boundary.
 */
function placed(e: ScoreEntry, place: Placer): ScoreEntry {
  if (e.kind === 'each' || typeof e.when !== 'number') return e;
  const p = place(e.when);
  let out = (p.seg === undefined ? { ...e, when: p.t } : { ...e, when: p.t, seg: p.seg }) as ScoreEntry;
  if (out.kind === 'input' && typeof out.input.until === 'number') {
    const u = place(out.input.until);
    const t = u.seg === p.seg ? u.t : place(Math.max(e.when, nextSegStart(place, e.when) - 1e-3)).t;
    out = { ...out, input: { ...out.input, until: t } } as ScoreEntry;
  }
  return out;
}
/** the film second where the segment holding `m` ends (a looped edit), else +∞ */
function nextSegStart(place: Placer, m: number): number {
  const s0 = place(m).seg;
  if (s0 === undefined) return Infinity;
  let lo = m, hi = m + 1;
  while (place(hi).seg === s0 && hi - m < 600) hi += hi - m;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (place(mid).seg === s0) lo = mid;
    else hi = mid;
  }
  return hi;
}
/**
 * The edit a film plays: one segment from `from` — or, when a DERIVED piece (briefings, story films) is shorter than its
 * film, the piece played to its loop end and then its loop (tracks.json `loop`) repeated until the film ends, so the
 * music never runs out under the pictures. Originals are never looped (FILM-ACTO1).
 */
export function filmEdit(def: FilmDef, map: BeatMap | null, len: number): { edit: { from: number; to: number }[]; place: Placer; looped: boolean } {
  const off = songFrom(def, map);
  const one = { edit: [{ from: off, to: off + Math.max(0.5, len) }], place: plainPlacer(off), looped: false };
  // the synthetic grid (no track map yet) never loops: there is no audio to run out
  if (!def.track || !map || map.id?.startsWith('film:') || isOriginalRef(def.track)) return one;
  const lp = loopOf(def.track);
  // a piece that lasts as long as the film plays out whole (its own ending); only a shorter one loops
  if (!lp || !(lp.end > lp.start + 1) || off + len <= (lp.dur ?? lp.end) - 0.05) return one;
  const edit: { from: number; to: number; m0: number }[] = [{ from: off, to: lp.end, m0: 0 }];
  let m = lp.end - off;
  while (m < len - 1e-6) {
    const take = Math.min(lp.end - lp.start, len - m);
    edit.push({ from: lp.start, to: lp.start + take, m0: m });
    m += take;
  }
  const place: Placer = (mm) => {
    let i = edit.length - 1;
    while (i > 0 && mm < edit[i].m0 - 1e-9) i--;
    return { t: edit[i].from + (mm - edit[i].m0), seg: i };
  };
  return { edit: edit.map(({ from, to }) => ({ from, to })), place, looped: true };
}
/** inputs of a film are always optional bonus prompts (they never grade anything) */
function asOptional(e: ScoreEntry): ScoreEntry {
  if (e.kind !== 'input') return e;
  return { ...e, input: { ...e.input, optional: true } } as InputEntry;
}

/**
 * (FILM-ACTO3) a film's SEGUE resolved on its track map: the song time where the music hands over to `ref` and the
 * position in that track it starts from. Null without a segue, without a track map, or outside the film.
 */
export function segueOf(def: FilmDef, trackMap?: BeatMap | null): { ref: string; at: number; from: number } | null {
  const s = def.segue;
  const m = trackMapOf(def, trackMap ?? null);
  if (!s || !m) return null;
  const off = songFrom(def, m);
  const at = typeof s.at === 'number' ? off + s.at : resolveWhen(m, s.at);
  const len = sceneTimeline(def).length;
  if (at === null || !(at > off + 0.5) || !(at < off + len - 0.5)) return null;
  return { ref: s.track, at, from: Math.max(0, s.from ?? 0) };
}

export function toMomentoDef(def: FilmDef, stage: () => Promise<StageFactory>, trackMap?: BeatMap | null): MomentoDef {
  const tl = sceneTimeline(def);
  const len = tl.length;
  const tmap = trackMapOf(def, trackMap);
  const off = songFrom(def, tmap);
  const ed = filmEdit(def, tmap, len);
  // a segue splits a plain edit on its bar: the clock cues the second segment there and the run's driver plays the
  // segue track for it (MomentoRun opts.segue)
  const sg = ed.looped ? null : segueOf(def, tmap);
  return {
    id: `film:${def.id}`,
    track: def.track ?? `film:${def.id}`,
    title: def.title,
    edit: sg
      ? [
          { from: off, to: sg.at },
          { from: sg.at, to: off + Math.max(0.5, len) },
        ]
      : ed.edit,
    // a looped edit ends where its last segment ends (the default cut)
    cut: ed.looped ? undefined : off + Math.max(0.5, len),
    tail: def.track && tmap ? 'release' : 'keep',
    score: [...sceneCues(def, tl, off, ed.place), ...(def.score ?? []).map((e) => placed(asOptional(e), ed.place))],
    stage,
    props: { pal: 'film' },
  };
}

// ------------------------------------------------------------------ the rules
const RULES: Record<FilmKind, SkipRule> = {
  /** a song film is the song: the first time it plays whole; after, SALIR in the pause menu (like a Momento) */
  song: { first: 'never', after: 'pause' },
  /** a briefing: the first time it plays whole; after, a visible SALTAR */
  briefing: { first: 'never', after: 'button' },
  interlude: { first: 'never', after: 'button' },
  /** dev demos can always be left */
  demo: { first: 'button', after: 'button' },
};
export function skipRule(def: Pick<FilmDef, 'kind' | 'skip'>): SkipRule {
  return { ...RULES[def.kind], ...(def.skip ?? {}) };
}
/** how this film can be left now (`seen` = the player already watched it to the end once) */
export function skipMode(def: Pick<FilmDef, 'kind' | 'skip'>, seen: boolean): SkipMode {
  const r = skipRule(def);
  return seen ? r.after : r.first;
}

type TrackRow = { id: string; variations?: { id: string; kind?: string; durationSec?: number; loop?: { start: number; end: number } }[] };
const TRACKS = tracksJson as unknown as TrackRow[];
/** a variation's loop points (tracks.json), if it has them */
export function loopOf(ref: string, tracks: TrackRow[] = TRACKS): { start: number; end: number; dur?: number } | null {
  for (const t of tracks) for (const x of t.variations ?? []) if (x.id === ref && x.loop) return { ...x.loop, dur: x.durationSec };
  return null;
}
/** an owner ORIGINAL (bare song id with an original variation, or '<id>.original') — only song films may play one */
export function isOriginalRef(ref: string, tracks: TrackRow[] = TRACKS): boolean {
  for (const t of tracks) {
    const orig = t.variations?.find((x) => x.kind === 'original');
    if (!orig) continue;
    if (ref === t.id || ref === orig.id) return true;
  }
  return /\.original$/.test(ref);
}
export function knownTrack(ref: string, tracks: TrackRow[] = TRACKS): boolean {
  return tracks.some((t) => t.id === ref || t.variations?.some((x) => x.id === ref));
}

/** every bake job this film needs before the clock (core + per style + per weather + per transition) */
export function bakeManifest(def: FilmDef): string[] {
  const out = new Set<string>(CORE_BAKES);
  for (const s of def.scenes) {
    for (const b of STYLES[styleId(s.style)]?.bakes ?? []) out.add(b);
    for (const w of s.weather ?? []) for (const b of WEATHER[w.kind]?.bakes ?? []) out.add(b);
  }
  return [...out];
}
/** the inputs of a film (score entries of kind 'input') */
export const filmInputs = (def: FilmDef) => (def.score ?? []).filter((e): e is InputEntry => e.kind === 'input');

export function validateFilm(def: FilmDef, map?: BeatMap | null): string[] {
  const w: string[] = [];
  const tl = sceneTimeline(def);
  if (!def.id || !/^[a-z0-9_]+$/.test(def.id)) w.push(`id «${def.id}»: usa minúsculas, números y _`);
  if (!def.scenes.length) w.push('la película no tiene escenas');
  const ids = new Set<string>();
  def.scenes.forEach((s, i) => {
    const label = `escena ${s.id || i}`;
    if (!s.id || !/^[a-z][a-z0-9_]*$/.test(s.id)) w.push(`${label}: id inválido (minúsculas, empieza con letra)`);
    if (ids.has(s.id)) w.push(`${label}: id repetido`);
    ids.add(s.id);
    if (!(s.dur > 0)) w.push(`${label}: dur debe ser > 0`);
    const sid = styleId(s.style);
    if (!STYLES[sid]) w.push(`${label}: estilo desconocido «${sid}»`);
    const inT = s.in;
    if (inT) {
      if (!TRANSITIONS[inT.kind]) w.push(`${label}: transición desconocida «${inT.kind}»`);
      else if (inT.kind !== 'cut' && !(inT.dur > 0)) w.push(`${label}: la transición ${inT.kind} necesita dur > 0`);
      const prev = def.scenes[i - 1];
      if (i > 0 && prev && inT.kind !== 'cut' && inT.dur > Math.min(prev.dur, s.dur) / 2 + 1e-9) w.push(`${label}: la transición dura más que la mitad de una escena (se recorta)`);
    }
    if (s.aspect !== undefined && !(s.aspect >= 1 && s.aspect <= 2.76)) w.push(`${label}: aspect ${s.aspect} fuera de [1, 2.76]`);
    for (const c of s.cards ?? []) {
      if (c.t < 0 || c.t + c.dur > s.dur + 1e-6) w.push(`${label}: la tarjeta «${c.text}» sale de la escena`);
      if (c.style && !TYPE_STYLES.includes(c.style)) w.push(`${label}: tipografía desconocida «${c.style}»`);
    }
    for (const u of s.subs ?? []) {
      if (u.t < 0 || u.t + u.dur > s.dur + 1e-6) w.push(`${label}: el subtítulo «${u.text}» sale de la escena`);
      if (u.text.length > 90) w.push(`${label}: subtítulo de más de 90 caracteres («${u.text.slice(0, 24)}…»)`);
      // reading speed: ≥ 0.9 s and ~15 caracteres por segundo como máximo
      if (u.dur < Math.max(0.9, u.text.length / 17)) w.push(`${label}: el subtítulo «${u.text.slice(0, 24)}…» no da tiempo de leer (${u.dur} s)`);
    }
    for (const x of s.weather ?? []) {
      if (!WEATHER[x.kind]) w.push(`${label}: clima desconocido «${x.kind}»`);
      for (const t of x.strikes ?? []) if (t < 0 || t > s.dur) w.push(`${label}: relámpago en ${t} s fuera de la escena`);
    }
    for (const [name, keys] of [
      ['cámara', s.cam],
      ['cámara calma', s.camRm],
    ] as const) {
      let lastT = -Infinity;
      for (const k of keys ?? []) {
        if (k.t < lastT) w.push(`${label}: las llaves de ${name} no están en orden (${k.t})`);
        if (k.t < 0 || k.t > s.dur + 1e-6) w.push(`${label}: llave de ${name} en ${k.t} s fuera de la escena`);
        if (k.fov !== undefined && !(k.fov > 0.2 && k.fov < 6)) w.push(`${label}: fov ${k.fov} fuera de rango`);
        lastT = k.t;
      }
    }
  });
  if (def.close && !TRANSITIONS[def.close.kind]) w.push(`close: transición desconocida «${def.close.kind}»`);
  // the music
  if (def.track) {
    if (!knownTrack(def.track) && !def.map) w.push(`track «${def.track}» no está en tracks.json (o trae su mapa en \`map\`)`);
    if (isOriginalRef(def.track) && def.kind !== 'song') w.push(`track «${def.track}» es una ORIGINAL del dueño: solo una película de canción puede usarla`);
  }
  if (def.kind === 'song' && !def.track) w.push('una película de canción necesita su canción (track)');
  if (def.segue) {
    if (!def.track) w.push('segue: una película sin pista no puede cambiar de pista');
    if (!knownTrack(def.segue.track)) w.push(`segue: la pista «${def.segue.track}» no está en tracks.json`);
    if (isOriginalRef(def.segue.track) && def.kind !== 'song') w.push(`segue: «${def.segue.track}» es una ORIGINAL del dueño`);
  }
  if (def.kind === 'briefing' && (tl.length < 15 || tl.length > 75)) w.push(`una presentación dura de 20 a 60 s (esta: ${tl.length.toFixed(1)} s)`);
  // the inputs: 0–3, all optional, never a mash (no grading, no button-mashing in a film)
  const inputs = filmInputs(def);
  const nGates = (def.gates ?? []).length;
  if (inputs.length + nGates > MAX_INPUTS) w.push(`${inputs.length + nGates} entradas (contando las puertas): una película admite de 0 a ${MAX_INPUTS}`);
  for (const g of def.gates ?? []) {
    const sc = def.scenes.find((s) => s.id === g.scene);
    if (!sc) w.push(`puerta «${g.label}»: la escena ${g.scene} no existe`);
    else if (g.t < 0 || g.t > sc.dur) w.push(`puerta «${g.label}»: ${g.t} s fuera de la escena`);
    if (g.label.trim().split(/\s+/).length > 3) w.push(`puerta «${g.label}»: más de 3 palabras`);
  }
  for (const e of inputs) {
    if (e.input.type === 'mash') w.push(`entrada ${e.input.id}: una película no tiene machaqueo (mash)`);
    if (e.input.optional === false) w.push(`entrada ${e.input.id}: en una película toda entrada es opcional`);
    // the branches can only add a flourish: the same verbs must be harmless with or without the press
    for (const [j, acts] of Object.entries(e.branches)) for (const a of acts ?? []) if (verbOf(a) === 'scene') w.push(`entrada ${e.input.id}/${j}: una rama no puede cambiar de escena`);
  }
  // the score itself (unknown names, things outside the film…)
  const m = map ?? timeBase(def, null);
  const md = toMomentoDef(def, async () => () => null, trackMapOf(def, map ?? null));
  for (const x of resolveScore(md, m).warnings) w.push(`partitura: ${x}`);
  return w;
}
const verbOf = (a: Act) => (typeof a === 'string' ? a : Array.isArray(a) ? a[0] : a.do);
