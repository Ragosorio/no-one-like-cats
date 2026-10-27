/**
 * PARTE II · REINICIO NARRATIVO (docs/part-ii/21-migracion-reinicio.md).
 *
 * The Part II opening, cinematics and music were renewed: every save that already played some of Part II goes
 * back to its narrative start (H31 «Las estrellas caen hacia arriba») and keeps EVERYTHING it owns. One retro
 * patch, once per save, forever:
 *
 *  - eligible: H30 «Fin» done (Part I finished) AND some Part II narrative progress (a mission done, a step past
 *    H31 active, a Part II beat seen, a story-gating flag). Part I saves and fresh post-«Fin» saves: no-op (they
 *    meet the renewed opening the first time anyway).
 *  - before touching anything: the island as it was goes to RESPALDOS (vault history + a localStorage copy),
 *    marked with this patch id so restoring it gives back that island without resetting it again.
 *  - RESETS only narrative position: H31+ missions (done / active / pinned / tips / baselines), Part II beats,
 *    the flags that would skip a scene (won_/event_done_ of the Part II battles, the CARTA's region:* flags,
 *    region_visited:*, nacar_haz_ok + its counter, pagina_canelo_vista, oleada<n>_fin).
 *  - KEEPS everything else: cats (levels, stars, forms, holo, names), resources, crystals, orbs, elements,
 *    habitats, ships, buildings, islands, Part I, prizes, forms (forma:* flags + reveal bookkeeping), the DIARIO
 *    PERDIDO pages (pagina_leida:*), counters, ext.* (music / Fonoteca, bank, shop…), achievements, stats.
 *  - fills the CLAIMED-REWARDS LEDGER (rupturasLedger.ts) from the save's history, so replaying pays each unique
 *    reward once: battles' gems / crystals / cats, missions' fixed gems.
 *
 * The plan is computed on read-only data first and committed in one go: an error leaves the save untouched
 * (the patch is then marked done as a no-op: the player keeps their old position, nothing is lost).
 */
import { BUILD_ID, G } from '../game';
import { registerPatch } from '../patches';
import { SAVE_VERSION } from '../migrate';
import { SAVE_KEY } from '../../core/save';
import { snapshot } from '../../core/vault';
import { MISSION_BY_ID } from '../../data/content';
import { FORMS } from '../../data/rupturas/formas';
import { REGION_IDS, REGION_INFO } from '../../regions';
import { STORY_BATTLES } from './storyBattles';
import { REFLEJO_CINEMATIC, RUPTURAS_ON_DONE, RUPTURAS_ON_NEW } from '../../ui/story/rupturasScript';
import { O2_ON_DONE, O2_ON_NEW } from '../../ui/story/rupturasScriptO2';
import { O3_ON_DONE, O3_ON_NEW } from '../../ui/story/rupturasScriptO3';
import { O4_ON_DONE, O4_ON_NEW } from '../../ui/story/rupturasScriptO4';
import historiaO1 from '../../data/rupturas/historia.json';
import historiaO2 from '../../data/rupturas/historia-o2.json';
import historiaO3 from '../../data/rupturas/historia-o3.json';
import historiaO4 from '../../data/rupturas/historia-o4.json';
import { PART2_FIRST, claimReward, isAfterPart2Mission, isPart2Mission, resetApplied, rupturasExt } from './rupturasLedger';

/** forever id (never reuse, never rename). A later reset is a NEW id + RESET_V bump. */
export const RESET_PATCH_ID = '2026-10-rupturas-reinicio-v2';
export const RESET_V = 2;
/** RESPALDOS: the history entry's reason (shown as is) and the localStorage copy */
export const RESET_SNAPSHOT_REASON = 'antes de la renovación de la Parte II';
export const RESET_BACKUP_KEY = 'nolc-save-bak-parte2-reinicio';
/** NOVEDADES: what the player reads (warm, no spoilers, not a bug) */
export const RESET_NOTE =
  'La Parte II recibió una renovación cinematográfica y musical: su historia vuelve a empezar y tu progreso queda intacto (tus gatos, formas, islas y recursos siguen contigo). Las escenas se vuelven a ver; los premios únicos que ya ganaste no se repiten. Luzterna te espera en el faro.';

const FIRST_MISSION = `H${PART2_FIRST}`;
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

// ------------------------------------------------------------------ what belongs to Part II's narrative
type BeatTable = Record<string, { beat: string }[]>;
/** beat ids of Part II: the beats of historia*.json + every beat the Part II hook tables play (H31's cinematic) */
function part2BeatIds(): Set<string> {
  const ids = new Set<string>([REFLEJO_CINEMATIC.beat]);
  for (const t of [RUPTURAS_ON_NEW, RUPTURAS_ON_DONE, O2_ON_NEW, O2_ON_DONE, O3_ON_NEW, O3_ON_DONE, O4_ON_NEW, O4_ON_DONE] as BeatTable[])
    for (const refs of Object.values(t ?? {})) for (const r of refs ?? []) if (typeof r?.beat === 'string') ids.add(r.beat);
  for (const h of [historiaO1, historiaO2, historiaO3, historiaO4] as unknown[]) {
    const beats = isObj(h) && isObj(h.story) ? h.story.beats : undefined;
    if (Array.isArray(beats)) for (const b of beats) if (isObj(b) && typeof b.id === 'string') ids.add(b.id);
  }
  return ids;
}
/**
 * `b31_estrellas#a` → `b31_estrellas`; Part II = a known Part II beat, the b31…b65 numbering (Part I ends at b30,
 * Parte III starts at b66: docs/part-iii/11 §2 A1), or the CARTA's «¡NUEVA ISLA!» ink (MapScene marks
 * `carta_<region>` the first time an island shows up).
 */
export function isPart2Beat(key: string, known = part2BeatIds()): boolean {
  const base = String(key).split('#')[0];
  if (/^b(6[6-9]|[7-9]\d|\d{3})_/.test(base)) return false; // Parte III+ (b66…): never Part II, whatever the tables say
  if (base.startsWith('carta_') && (REGION_IDS as readonly string[]).includes(base.slice(6))) return true;
  return known.has(base) || /^b(3[1-9]|[45]\d|6[0-5])_/.test(base);
}

/** the story battles of Part II (Oleada 1 «ruptura_*» + any later wave's, by their mission) */
function part2Battles(): Map<string, { mission: string; cat?: string }> {
  const out = new Map<string, { mission: string; cat?: string }>();
  for (const b of Object.values(STORY_BATTLES)) if (isPart2Mission(b.mission) || b.id.startsWith('ruptura_')) out.set(b.id, { mission: b.mission, cat: b.reward?.cat });
  return out;
}

/** a flag that would skip (or pre-play) a Part II scene: cleared by the reset, set again when the story gets there */
export function isStoryGateFlag(f: string, battles = part2Battles()): boolean {
  const won = /^(?:won|event_done)_(.+)$/.exec(f);
  if (won) return battles.has(won[1]) || won[1].startsWith('ruptura_');
  if (f.startsWith('region:')) return true; // the CARTA's islands (REGION_INFO mapFlag): syncRegionFlags puts them back
  if (f.startsWith('region_visited:')) return (REGION_IDS as readonly string[]).includes(f.slice(15));
  if (f === 'nacar_haz_ok' || f === 'pagina_canelo_vista') return true;
  // the Diario Perdido pages can be read again (their gold is guarded by the ledger key `pagina:<n>`)
  if (f.startsWith('pagina_leida:')) return true;
  return /^oleada\d+_fin$/.test(f);
}
/**
 * Counters that a Part II gate reads RAW (not as a mission baseline): rupturas.ts nacarHazOk / syncRegionFlags,
 * and a damage-graded Part II battle's best % (`damage_pct` goals read it directly). `dmgpct_paid_*` (what was
 * already paid) is a ledger: it stays.
 */
const gateCounters = (battles: Map<string, unknown>) => ['feature_haz_nacar', ...[...battles.keys()].map((id) => `dmgpct_${id}`)];

// ------------------------------------------------------------------ the plan (read-only)
export interface ResetPlan {
  done: string[];
  active: string[];
  beats: string[];
  lines: string[];
  pins: string[];
  progressKeys: string[];
  flags: string[];
  counters: Record<string, number>;
  claims: string[];
  /** there is something narrative to reset */
  progress: boolean;
}

export function planReset(): ResetPlan {
  const s = G.s;
  const m = isObj(s.missions) ? s.missions : ({} as Partial<typeof s.missions>);
  const done = strs(m.done);
  const active = strs(m.active);
  const flags = isObj(s.flags) ? s.flags : {};
  const counters = isObj(s.counters) ? s.counters : {};
  const known = part2BeatIds();
  const battles = part2Battles();
  const plan: ResetPlan = {
    done: done.filter(isPart2Mission),
    active: active.filter(isPart2Mission),
    beats: strs(s.beatsSeen).filter((k) => isPart2Beat(k, known)),
    lines: strs(m.seenLines).filter(isPart2Mission),
    pins: strs(m.pinned).filter(isPart2Mission),
    progressKeys: Object.keys(isObj(m.progress) ? m.progress : {}).filter((k) => isPart2Mission(k.split(':')[0])),
    flags: Object.keys(flags).filter((f) => isStoryGateFlag(f, battles)),
    counters: {},
    claims: [],
    progress: false,
  };
  for (const k of gateCounters(battles)) {
    const v = Number(counters[k] ?? 0);
    if (Number.isFinite(v) && v !== 0) plan.counters[k] = v;
  }
  plan.progress =
    plan.done.length > 0 ||
    plan.active.some((id) => id !== FIRST_MISSION) ||
    plan.beats.length > 0 ||
    plan.flags.some((f) => !!flags[f]) ||
    Object.keys(plan.counters).length > 0;

  // ---- the ledger, from the save's history (before anything is cleared)
  const claims = new Set<string>();
  for (const id of plan.done) claims.add(`mission:${id}`);
  const owns = (sp: string) => Array.isArray(s.cats) && s.cats.some((c) => isObj(c) && c.species === sp);
  const wonIds = new Set<string>();
  for (const f of Object.keys(flags)) {
    const w = /^(?:won|event_done)_(.+)$/.exec(f);
    if (w && flags[f] && (battles.has(w[1]) || w[1].startsWith('ruptura_'))) wonIds.add(w[1]);
  }
  for (const [id, b] of battles) if (done.includes(b.mission)) wonIds.add(id);
  for (const id of wonIds) {
    claims.add(`battle:${id}`);
    // the cat counts as paid only if it actually joined (a reveal that never ran would give it on the replay)
    const sp = battles.get(id)?.cat;
    if (sp && owns(sp)) claims.add(`cat:${id}`);
  }
  for (const f of Object.keys(flags)) {
    const p = /^pagina_leida:(.+)$/.exec(f);
    if (p && flags[f]) claims.add(`pagina:${p[1]}`);
  }
  plan.claims = [...claims];
  return plan;
}

export type ResetOutcome = 'parte1' | 'parte3' | 'ya-aplicado' | 'sin-progreso' | 'reiniciado' | 'error';

// ------------------------------------------------------------------ the backup (before any mutation)
/** the island exactly as it is now, marked with this patch so restoring it never resets it again */
function preResetEnvelope(): string {
  const state = { ...G.s, patches: [...strs(G.s.patches).filter((p) => p !== RESET_PATCH_ID), RESET_PATCH_ID] };
  return JSON.stringify({ version: SAVE_VERSION, savedAt: G.s.savedAt || Date.now(), build: BUILD_ID, state });
}
/** a durable copy in localStorage (Ajustes › RESPALDOS lists `nolc-save-bak-*`). Never overwritten; skipped when
 *  storage is tight so the live save always keeps room to grow (a full storage would stop it from saving). */
function localCopy(raw: string): boolean {
  try {
    if (localStorage.getItem(RESET_BACKUP_KEY)) return false;
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) used += k.length + (localStorage.getItem(k)?.length ?? 0);
    }
    const live = localStorage.getItem(SAVE_KEY)?.length ?? raw.length;
    // ~5 MB quotas: stay under 2M chars with the copy AND room for the live save to double
    if (used + raw.length + live > 2_000_000) return false;
    localStorage.setItem(RESET_BACKUP_KEY, raw);
    return true;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------ the reset
/**
 * Apply the reset to `G.s` if this save qualifies. Never throws. `backup: false` skips RESPALDOS (tests of the
 * plan itself). Returns what happened (the patch shows the note only for 'reiniciado').
 */
export function applyRupturasReset(opts: { backup?: boolean; at?: number } = {}): ResetOutcome {
  try {
    const s = G.s;
    if (!s || !isObj(s.missions) || !strs(s.missions.done).includes('H30')) return 'parte1';
    if (resetApplied(RESET_V)) return 'ya-aplicado';
    // a save that already lives in Parte III (H66+ done or active) is never sent back to H31 (docs/part-iii/08 §6.1)
    if ([...strs(s.missions.done), ...strs(s.missions.active)].some(isAfterPart2Mission)) return 'parte3';
    const plan = planReset();
    if (!plan.progress) return 'sin-progreso';
    const at = opts.at ?? Date.now();

    // 1) RESPALDOS first: the island as it was (sync string; IndexedDB writes it in the background)
    if (opts.backup !== false) {
      const raw = preResetEnvelope();
      void snapshot(RESET_SNAPSHOT_REASON, raw);
      localCopy(raw);
    }

    // 2) commit (plain assignments on validated arrays/objects)
    const m = s.missions;
    const drop = (xs: unknown) => strs(xs).filter((id) => !isPart2Mission(id));
    m.done = drop(m.done);
    m.active = drop(m.active);
    m.pinned = drop(m.pinned);
    m.seenLines = drop(m.seenLines);
    if (isObj(m.progress)) for (const k of plan.progressKeys) delete m.progress[k];
    const beats = new Set(plan.beats);
    s.beatsSeen = strs(s.beatsSeen).filter((k) => !beats.has(k));
    if (isObj(s.flags)) for (const f of plan.flags) delete s.flags[f];
    if (isObj(s.counters)) for (const k of Object.keys(plan.counters)) s.counters[k] = 0;

    // 3) the ledger (merge: a claim is never removed) + what moved, for support / rollback
    const ext = rupturasExt();
    for (const k of plan.claims) claimReward(k, at);
    ext.reset = { v: RESET_V, at, done: plan.done, active: plan.active, beats: plan.beats, flags: plan.flags, counters: plan.counters };
    return 'reiniciado';
  } catch (e) {
    console.error('[rupturas] el reinicio narrativo no se aplicó (la partida quedó como estaba)', e);
    return 'error';
  }
}

registerPatch({
  id: RESET_PATCH_ID,
  why: 'Parte II renovada (apertura, cinemáticas, música): quien ya la jugó vuelve a H31 sin perder nada; los premios únicos quedan en el registro ext.rupturas.claimed para no pagarse dos veces.',
  run() {
    return applyRupturasReset() === 'reiniciado' ? RESET_NOTE : undefined;
  },
});

// ------------------------------------------------------------------ replay: the form reveal plays again in its place
/**
 * A form unlocked by a Part II mission (H38 → Canelo Almirante) stays unlocked through the reset, and its reveal
 * stays «seen» so it never jumps the story. When the replay reaches that mission again, the reveal is re-armed
 * and app/formsFlow.ts plays it as a scene (it grants nothing).
 */
G.on('mission', (p) => {
  if (p.kind !== 'done' || !isPart2Mission(p.id) || !resetApplied(RESET_V)) return;
  const unlocks = MISSION_BY_ID.get(p.id)?.unlocks ?? [];
  const forms = (G.s.ext as Record<string, unknown> | undefined)?.forms as { revealed?: unknown } | undefined;
  if (!forms || !Array.isArray(forms.revealed)) return;
  const again = FORMS.filter((f) => unlocks.includes(f.unlockFlag)).map((f) => f.id);
  if (again.length) forms.revealed = (forms.revealed as unknown[]).filter((id) => !again.includes(id as string));
});
