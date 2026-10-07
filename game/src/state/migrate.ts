/**
 * Save migrations — how an update reaches an old save without breaking it.
 *
 * Three layers, run in this order every time a save is loaded (state/game.ts › load):
 *  1. MIGRATIONS  structural changes, one per SAVE_VERSION bump (rename a field, move data around).
 *                 Pure functions over plain JSON: no game systems, no content lookups.
 *  2. normalize() fills anything missing or broken with defaults (new fields appear automatically,
 *                 NaN/negative money is repaired, arrays stay arrays). Unknown fields are KEPT.
 *  3. patches     (state/patches.ts) one-shot gameplay fixes that need the game systems
 *                 ("you beat the Arcanist before Merlina was wired → here she is").
 *
 * Rules (docs/ACTUALIZACIONES.md): never delete player data, never lower a currency or a level,
 * every step is idempotent, and a copy of the save is kept before the first migration (core/save.ts).
 */
import type { GameState } from './game';

/** bump when a MIGRATION is added (plain new optional fields don't need a bump: normalize() covers them) */
export const SAVE_VERSION = 3;

type AnyState = Record<string, unknown> & Partial<GameState>;

/** MIGRATIONS[n] upgrades a save from version n-1 to n */
const MIGRATIONS: Record<number, (s: AnyState) => void> = {
  // v2 (2026-10): update ledger — which one-shot patches ran and which "novedades" were seen
  2: (s) => {
    s.patches ??= [];
    s.updatesSeen ??= [];
  },
  // v3 (2026-10): free habitat placement — a habitat is no longer "plot i of region r" but a 3×3
  // footprint at tile (gx, gy). Every old habitat lands on the exact tile its plot had, so nothing
  // moves on screen; tier, element, cats, buffer and timers are untouched. `plot` stays (unused).
  3: (s) => {
    for (const h of (s.habitats ?? []) as unknown as Record<string, unknown>[]) {
      if (!h || typeof h !== 'object') continue;
      if (Number.isFinite(h.gx) && Number.isFinite(h.gy)) continue;
      const spot = LEGACY_PLOTS[String(h.region)]?.[Number(h.plot)];
      // unknown plot (hand-edited save): no position yet → island/placement puts it on the nearest free spot
      if (spot) {
        h.gx = spot[0];
        h.gy = spot[1];
      }
    }
  },
};

/**
 * Top-left tile of every fixed habitat plot of the pre-2026-10 island (island/layout.ts LEGACY_HAB_PLOTS
 * produces the same table; it's copied here as plain data so this migration never depends on the planner).
 */
const LEGACY_PLOTS: Record<string, [number, number][]> = {
  home: [[24, 23], [20, 24], [24, 19]],
  bosque_costero: [[10, 26], [10, 30]],
  acantilado_rocoso: [[23, 8], [23, 12]],
  isla_volcanica: [[38, 23], [34, 24]],
  puerto_mareas: [[24, 38]],
  glaciar_bigote: [[8, 9], [7, 13]],
  ruinas_arcanas: [[37, 37], [38, 41]],
  arrecife_prismatico: [[7, 39], [11, 39]],
  atolon_estelar: [[43, 6], [43, 2]],
};
export { LEGACY_PLOTS };

export function migrate(raw: AnyState, from: number): { state: AnyState; steps: number[] } {
  const steps: number[] = [];
  for (let v = Math.max(1, from) + 1; v <= SAVE_VERSION; v++) {
    const m = MIGRATIONS[v];
    if (!m) continue;
    try {
      m(raw);
      steps.push(v);
    } catch (e) {
      // a broken migration must not eat the save: normalize() still makes it loadable
      console.error(`[save] migración v${v} falló`, e);
    }
  }
  return { state: raw, steps };
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const num = (v: unknown, d: number, min = -Infinity) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(min, v) : d);

/**
 * Deep-fill a save against the defaults. Shape rules:
 * - missing key → default; wrong type → default (arrays stay arrays, objects stay objects)
 * - numbers: NaN/Infinity → default; currencies never negative
 * - nested objects (ship, campaign, missions…) are filled key by key, extra keys survive
 */
export function normalize(raw: AnyState, defaults: GameState): GameState {
  const s = raw as Record<string, unknown>;
  const d = defaults as unknown as Record<string, unknown>;
  for (const [k, dv] of Object.entries(d)) s[k] = fill(s[k], dv, k);
  // currencies & meters: never negative
  for (const k of ['gold', 'food', 'gems', 'purr', 'prisma', 'scrap', 'blueprint', 'playMs'] as const) s[k] = num(s[k], d[k] as number, 0);
  s.kl = Math.max(1, Math.floor(num(s.kl, 1, 1)));
  s.klXp = Math.min(0.999, num(s.klXp, 0, 0));
  s.nextId = Math.max(num(s.nextId, 1, 1), highestUid(s) + 1);
  // per-cat repairs (old saves from before a field existed)
  const cats = (s.cats as unknown[]).filter(isObj) as Record<string, unknown>[];
  for (const c of cats) {
    c.level = Math.max(1, Math.floor(num(c.level, 1, 1)));
    c.bites = Math.floor(num(c.bites, 0, 0)) % 4;
    c.stars = Math.max(1, Math.floor(num(c.stars, 1, 1)));
    if (!Array.isArray(c.moments)) c.moments = [];
    if (c.habitat === undefined) c.habitat = null;
    if (c.mutation === undefined) c.mutation = null;
    if (typeof c.trait !== 'string') c.trait = '';
    if (typeof c.name !== 'string' || !c.name) c.name = String(c.species ?? 'Gato');
  }
  // two cats with the same uid would make one of them unclickable forever
  const seen = new Set<string>();
  for (const c of cats) {
    if (typeof c.uid !== 'string' || seen.has(c.uid)) c.uid = `c${(s.nextId as number)++}`;
    seen.add(c.uid as string);
  }
  s.cats = cats.filter((c) => typeof c.species === 'string');
  // dedupe string lists the systems treat as sets
  for (const k of ['elements', 'beatsSeen', 'patches', 'updatesSeen'] as const) s[k] = [...new Set((s[k] as unknown[]).filter((x) => typeof x === 'string'))];
  const m = s.missions as Record<string, unknown>;
  for (const k of ['active', 'done', 'pinned', 'seenLines']) m[k] = [...new Set((m[k] as unknown[]).filter((x) => typeof x === 'string'))];
  m.active = (m.active as string[]).filter((id) => !(m.done as string[]).includes(id));
  // timers with broken clocks would never finish
  s.timers = (s.timers as unknown[]).filter(isObj).filter((t) => typeof t.id === 'string' && typeof t.kind === 'string');
  for (const t of s.timers as Record<string, unknown>[]) {
    t.totalMs = num(t.totalMs, 60_000, 0);
    t.leftMs = Math.min(num(t.leftMs, 0), t.totalMs as number);
  }
  return s as unknown as GameState;
}

function fill(v: unknown, dv: unknown, key: string): unknown {
  if (Array.isArray(dv)) return Array.isArray(v) ? v : [...dv];
  if (isObj(dv)) {
    if (!isObj(v)) return structuredClone(dv);
    // records keyed by id (counters, flags, orbs…) are open maps: only nested known shapes get filled
    for (const [k, sub] of Object.entries(dv)) v[k] = fill(v[k], sub, `${key}.${k}`);
    return v;
  }
  if (typeof dv === 'number') return num(v, dv);
  if (typeof dv === 'string') return typeof v === 'string' ? v : dv;
  if (typeof dv === 'boolean') return typeof v === 'boolean' ? v : dv;
  if (dv === null) return v === undefined ? null : v;
  return v === undefined ? dv : v;
}

/** biggest numeric suffix among generated ids (so nextId never hands out a duplicate) */
function highestUid(s: Record<string, unknown>) {
  let max = 0;
  const scan = (id: unknown) => {
    if (typeof id !== 'string') return;
    const n = Number(/(\d+)$/.exec(id)?.[1]);
    if (Number.isFinite(n) && n > max && n < 1e9) max = n;
  };
  for (const c of (s.cats as Record<string, unknown>[]) ?? []) scan(c?.uid);
  for (const t of (s.timers as Record<string, unknown>[]) ?? []) scan(t?.id);
  for (const h of (s.habitats as Record<string, unknown>[]) ?? []) scan(h?.id);
  return max;
}
