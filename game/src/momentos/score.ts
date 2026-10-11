/**
 * SCORE — the authoring helpers and the resolver (pure; tests/momentos.test.ts).
 *
 *   at('big_hit_1', 'impact', ['sfxText', { text: '¡FIESTA!' }])        one-shot acts at a time
 *   on({ hits: { in: 'chorus', kind: 'kick', min: 0.8 } }, 'cannon')     acts on every match (hits / beats / bars / times)
 *   key('verse', { 'cam.zoom': 1.3, 'shipB.y': -380 }, { beats: 8, ease: 'inOut' })   property tracks (tweens / switches)
 *   tap('silence_1', { id: 'stop1' }, { great: ['poseCool'], miss: ['poseTrip'] })
 *   hold('#22', '#24', { id: 'brace' }, {...}) · mash('#39:2', '#43', { id: 'volley', need: [8, 16] }, {...})
 *   choice('#46', { id: 'dodge', fallback: 'left' }, { left: [...], right: [...] })
 *
 * resolveScore(def, map) turns the score into sorted cues, key tracks and prompts on MOMENTO time, and lists every
 * authoring problem in `warnings` (unknown names, prompts too close, inputs outside the edit…). The tests require
 * zero warnings for every registered Momento.
 */
import type { BeatMap } from '../audio/beatgrid';
import type { Act, Args, Cue, DoEntry, EachEntry, EachSpec, Ease, InputEntry, InputSpec, Judgement, Key, KeyEntry, MomentoDef, OnsetMap, Prompt, ResolvedAct, ResolvedScore, ScoreEntry, When } from './types';
import { editLength, expandEach, resolveEdit, resolveWhen, songToM, spb, spBar } from './time';

// ------------------------------------------------------------------ authoring helpers
export const at = (when: When, ...act: Act[]): DoEntry => ({ kind: 'do', when, act });
export const on = (each: EachSpec, ...act: Act[]): EachEntry => ({ kind: 'each', each, act });
export const key = (when: When, set: Record<string, number | string>, o: { dur?: number; beats?: number; ease?: Ease; seg?: number } = {}): KeyEntry => ({ kind: 'key', when, set, ...o });
type Branches = Partial<Record<Judgement, Act[]>>;
export const tap = (when: When, spec: Omit<InputSpec, 'type'>, branches: Branches, always?: Act[]): InputEntry => ({ kind: 'input', when, input: { ...spec, type: 'tap' }, branches, always });
export const hold = (when: When, until: When, spec: Omit<InputSpec, 'type' | 'until'>, branches: Branches, always?: Act[]): InputEntry => ({
  kind: 'input',
  when,
  input: { ...spec, type: 'hold', until },
  branches,
  always,
});
export const mash = (when: When, until: When, spec: Omit<InputSpec, 'type' | 'until'>, branches: Branches, always?: Act[]): InputEntry => ({
  kind: 'input',
  when,
  input: { ...spec, type: 'mash', until },
  branches,
  always,
});
export const choice = (when: When, spec: Omit<InputSpec, 'type'>, branches: Branches, always?: Act[]): InputEntry => ({ kind: 'input', when, input: { ...spec, type: 'choice' }, branches, always });
/** a verb with args (sugar for ['verb', args]) */
export const v = (verb: string, args?: Args, delay?: { dt?: number; beats?: number }): Act => ({ do: verb, args, ...delay });

// ------------------------------------------------------------------ input timing constants
/** tap window half-widths (s): |Δ| ≤ GREAT → great, ≤ HIT → hit */
export const GREAT_S = 0.06;
export const HIT_S = 0.15;
/** a press this early before a tap window counts as that prompt's miss (mashing never wins) */
export const EARLY_S = 0.25;
/** prompts closer than this (momento s) to the previous graded one are flagged (clutter) */
export const MIN_PROMPT_GAP = 0.3;

// ------------------------------------------------------------------ the resolver
function actOf(a: Act, map: BeatMap): ResolvedAct {
  if (typeof a === 'string') return { verb: a, args: {}, dt: 0 };
  if (Array.isArray(a)) return { verb: a[0], args: a[1] ?? {}, dt: 0 };
  return { verb: a.do, args: a.args ?? {}, dt: (a.dt ?? 0) + (a.beats ?? 0) * spb(map) };
}

export function resolveScore(def: MomentoDef, map: BeatMap, onsets: OnsetMap | null = null): ResolvedScore {
  const warnings: string[] = [];
  const warn = (w: string) => warnings.push(w);
  const segments = resolveEdit(map, def.edit, warn);
  const len = editLength(segments);
  const cutT = def.cut !== undefined ? resolveWhen(map, def.cut) : null;
  let mCut = len;
  if (def.cut !== undefined) {
    const m = cutT === null ? null : songToM(segments, cutT);
    if (m === null) warn(`cut ${JSON.stringify(def.cut)} no está dentro de la edición`);
    else mCut = m;
  }
  const cues: Cue[] = [];
  const keys = new Map<string, Key[]>();
  const prompts: Prompt[] = [];
  let id = 0;
  const where = (w: When, seg: number | undefined, label: string): { t: number; m: number } | null => {
    const t = resolveWhen(map, w);
    if (t === null) {
      warn(`${label}: ${JSON.stringify(w)} no existe en ${map.id || def.track}`);
      return null;
    }
    const m = songToM(segments, t, seg);
    if (m === null) {
      warn(`${label}: ${JSON.stringify(w)} (${t.toFixed(3)} s) cae fuera de la edición`);
      return null;
    }
    return { t, m };
  };
  const pushActs = (acts: Act[], t: number, m: number, source: Cue['source'], extra: Partial<Cue> = {}) => {
    for (const a of acts) {
      const ra = actOf(a, map);
      if (!ra.verb) {
        warn(`acto vacío en ${t.toFixed(3)}`);
        continue;
      }
      cues.push({ id: ++id, t: t + ra.dt, m: m + ra.dt, act: ra, source, ...extra });
    }
  };

  // section palettes → 'pal' keys at each section start (explicit 'pal' keys in the score win: they come later)
  for (const [sec, pal] of Object.entries(def.palettes ?? {})) {
    const t = map.sections.find((s) => s.name === sec)?.start;
    if (t === undefined) {
      warn(`palettes: la sección ${sec} no existe`);
      continue;
    }
    const m = songToM(segments, t);
    if (m === null) continue;
    const arr = keys.get('pal') ?? [];
    arr.push({ m, value: pal, dur: 0.25, ease: 'linear' });
    keys.set('pal', arr);
  }
  def.score.forEach((e: ScoreEntry, i) => {
    const label = `score[${i}]`;
    if (e.kind === 'do') {
      const p = where(e.when, e.seg, label);
      if (p) pushActs(e.act, p.t, p.m, 'do', { tag: e.tag });
    } else if (e.kind === 'each') {
      if ('onsets' in e.each && !onsets) warn(`${label}: la canción no tiene pistas de onsets (<id>.onsets.json)`);
      const list = expandEach(map, e.each, onsets);
      if (!list.length) warn(`${label}: each ${JSON.stringify(e.each)} no encontró nada`);
      for (const x of list) {
        const m = songToM(segments, x.t);
        if (m === null || m > mCut + 1e-6) continue;
        pushActs(e.act, x.t, m, 'each', { tag: e.tag, hit: x.hit ? { strength: x.hit.strength, kind: x.hit.kind } : x.onset ? { strength: x.onset.strength, kind: x.onset.track } : undefined, onset: x.onset });
      }
    } else if (e.kind === 'key') {
      const p = where(e.when, e.seg, label);
      if (!p) return;
      const dur = e.beats !== undefined ? e.beats * spb(map) : (e.dur ?? 0);
      for (const [k, val] of Object.entries(e.set)) {
        const arr = keys.get(k) ?? [];
        arr.push({ m: p.m, value: val, dur: Math.max(0, dur), ease: e.ease ?? 'inOut' });
        keys.set(k, arr);
      }
    } else if (e.kind === 'input') {
      const p = where(e.when, e.seg, label);
      if (!p) return;
      const sp = e.input;
      let mEnd = p.m;
      if (sp.type === 'hold' || sp.type === 'mash') {
        const q = sp.until === undefined ? null : where(sp.until, e.seg, `${label}.until`);
        if (!q) warn(`${label} (${sp.id}): ${sp.type} necesita un 'until' válido`);
        else if (q.m <= p.m + 0.2) warn(`${label} (${sp.id}): ${sp.type} demasiado corto`);
        else mEnd = q.m;
      } else if (sp.type === 'choice' && sp.until !== undefined) {
        const q = where(sp.until, e.seg, `${label}.until`);
        if (q) mEnd = q.m;
      }
      if (sp.type === 'mash' && !(sp.need && sp.need[0] > 0 && sp.need[1] >= sp.need[0])) warn(`${label} (${sp.id}): mash necesita need [hit, great]`);
      const lead = Math.max(0.5, sp.lead ?? 1) * spBar(map);
      const branches: Prompt['branches'] = {};
      for (const [j, acts] of Object.entries(e.branches)) branches[j as Judgement] = (acts ?? []).map((a) => actOf(a, map));
      if (sp.type === 'choice' && !(branches.left && branches.right)) warn(`${label} (${sp.id}): choice necesita ramas left y right`);
      if (sp.type !== 'choice' && !(branches.great || branches.hit || branches.miss)) warn(`${label} (${sp.id}): sin ramas`);
      if (sp.label && sp.label.trim().split(/\s+/).length > 3) warn(`${label} (${sp.id}): la etiqueta tiene más de 3 palabras`);
      if (prompts.some((x) => x.id === sp.id)) warn(`${label}: id de input repetido ${sp.id}`);
      prompts.push({
        id: sp.id,
        type: sp.type,
        spec: sp,
        t: p.t,
        m: p.m,
        mEnd: Math.max(mEnd, p.m),
        mShow: Math.max(0, p.m - lead),
        branches,
        always: (e.always ?? []).map((a) => actOf(a, map)),
        optional: !!sp.optional,
      });
    }
  });

  cues.sort((a, b) => a.m - b.m || a.id - b.id);
  for (const arr of keys.values()) arr.sort((a, b) => a.m - b.m);
  prompts.sort((a, b) => a.m - b.m);
  // clutter / overlap checks: graded prompts never stack, and every input closes before the cut
  for (let i = 0; i < prompts.length; i++) {
    const p = prompts[i];
    const winEnd = (p.type === 'tap' ? p.m : p.mEnd) + HIT_S;
    if (winEnd > mCut + 1e-6) warn(`input ${p.id} cierra después del corte (${winEnd.toFixed(2)} > ${mCut.toFixed(2)})`);
    for (let j = i + 1; j < prompts.length; j++) {
      const q = prompts[j];
      if (q.m - p.m > 30) break;
      const pEnd = p.type === 'tap' ? p.m : p.mEnd;
      const overlap = q.m - HIT_S - EARLY_S < pEnd + HIT_S && q.type !== 'tap' && p.type !== 'tap';
      if (overlap) warn(`inputs ${p.id} y ${q.id} se enciman`);
      if (p.type === 'tap' && q.type === 'tap' && q.m - p.m < MIN_PROMPT_GAP) warn(`taps ${p.id} y ${q.id} a ${(q.m - p.m).toFixed(3)} s (mínimo ${MIN_PROMPT_GAP})`);
      // a tap inside a hold / choice / mash window would be ambiguous (same buttons)
      if (p.type !== 'tap' && q.type === 'tap' && q.m <= pEnd + HIT_S) warn(`tap ${q.id} dentro de ${p.type} ${p.id}`);
      if (p.type === 'tap' && q.type !== 'tap' && q.m - HIT_S < p.m + HIT_S) warn(`${q.type} ${q.id} empieza encima de tap ${p.id}`);
    }
  }
  const tailEnd = def.tail === 'keep' ? mCut : Math.min(len, mCut + 2.5);
  return { def, map, onsets, segments, mCut, length: Math.max(mCut, tailEnd), cues, keys, prompts, warnings };
}

// ------------------------------------------------------------------ property tracks
const EASES: Record<Ease, (x: number) => number> = {
  linear: (x) => x,
  in: (x) => x * x * x,
  out: (x) => 1 - (1 - x) ** 3,
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2),
  sineInOut: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  expoOut: (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)),
  back: (x) => {
    const c = 1.70158;
    return (c + 1) * x * x * x - c * x * x;
  },
  outBack: (x) => {
    const c = 1.70158;
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
  },
  elastic: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 2 ** (-10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  step: (x) => (x >= 1 ? 1 : 0),
};
export const ease = (e: Ease, x: number) => EASES[e](Math.max(0, Math.min(1, x)));

/**
 * A property's value at momento time m: the last key at or before m, tweened from the value the property had when that
 * key started (so chains of keys compose). Strings switch at the key time. `dflt` before the first key.
 */
export function propAt(keys: Key[] | undefined, m: number, dflt: number | string): number | string {
  if (!keys?.length) return dflt;
  let last: Key | null = null;
  let lastFrom: number | string = dflt;
  for (const k of keys) {
    if (k.m > m + 1e-9) break;
    // the value this key starts from = where the previous key had got to at this key's time
    const from = last ? keyValue(last, lastFrom, k.m) : dflt;
    last = k;
    lastFrom = from;
  }
  return last ? keyValue(last, lastFrom, m) : dflt;
}
function keyValue(k: Key, from: number | string, at: number): number | string {
  if (typeof k.value === 'string' || typeof from === 'string' || k.dur <= 0) return k.value;
  const x = (at - k.m) / k.dur;
  return x >= 1 ? k.value : from + (k.value - from) * ease(k.ease, x);
}
