/**
 * Retro patches: one-shot gameplay fixes applied to OLD saves when an update lands.
 *
 * A migration (state/migrate.ts) reshapes JSON; a patch uses the game systems to make an old save
 * behave as if the new rules had always existed — and tells the player what changed, in their own
 * words, in the "novedades" panel (data/updates.ts).
 *
 * Contract (docs/ACTUALIZACIONES.md):
 * - `id` is forever: once it ran on a save it never runs again (ledger: GameState.patches).
 * - `run()` must be safe on ANY save (fresh, ancient, half-finished) and never take away
 *   currencies, cats, levels or progress. Give, repair, refund, re-home — never subtract.
 * - return a short Spanish note when the player should know (shown once), or nothing.
 * - a patch that throws is skipped and retried next boot; the game keeps loading.
 * - brand-new games mark every patch as applied (there's nothing to repair).
 */
import { G } from './game';
import { MAX_BULKHEADS, validateLayout } from './sys/ship';

export interface Patch {
  id: string;
  /** what it fixes (for developers) */
  why: string;
  run: () => string | void;
}

const PATCHES: Patch[] = [];
/** notes produced this session (consumed by the "novedades" panel) */
export const patchNotes: string[] = [];

/** add a patch (feature modules call this at import time; order = registration order) */
export function registerPatch(p: Patch) {
  // a module evaluated twice (dev hot reload, a second import URL) re-registers the same id: keep one
  const i = PATCHES.findIndex((x) => x.id === p.id);
  if (i >= 0) PATCHES[i] = p;
  else PATCHES.push(p);
}

export function runPatches() {
  const done = (G.s.patches ??= []);
  for (const p of PATCHES) {
    if (done.includes(p.id)) continue;
    try {
      const note = p.run();
      done.push(p.id);
      if (note) patchNotes.push(note);
    } catch (e) {
      console.error(`[patch] ${p.id} falló (se reintenta la próxima vez)`, e);
    }
  }
  G.recalc();
}

/** a fresh island has nothing to repair */
export function markAllPatched() {
  G.s.patches = PATCHES.map((p) => p.id);
}

export function patchIds() {
  return PATCHES.map((p) => p.id);
}

G.afterLoad.push(runPatches);

// ------------------------------------------------------------------ 2026-10 · v2

registerPatch({
  id: '2026-10-mamparos-max-3',
  why: 'Los Mamparos pasaron a costar 1 y máximo 3 por barco; los diseños con más quedaban inválidos y el juego volvía al barco de fábrica sin avisar.',
  run() {
    const fixed: string[] = [];
    for (const [shipId, mods] of Object.entries(G.s.layouts ?? {})) {
      if (!Array.isArray(mods)) continue;
      if (mods.filter((m) => m.kind === 'bulkhead').length <= MAX_BULKHEADS) continue;
      let cur = mods.map((m) => ({ ...m }));
      const overBudget = () => {
        const chk = validateLayout(shipId, cur);
        return chk.issues.some((x) => x.code === 'budget');
      };
      // drop bulkheads one by one (over the cap, or while they bust the utility budget now that they cost 1),
      // preferring the ones whose removal keeps the hull in one piece
      let guard = 0;
      while (guard++ < 64 && (cur.filter((m) => m.kind === 'bulkhead').length > MAX_BULKHEADS || overBudget())) {
        const idxs = cur.map((m, i) => (m.kind === 'bulkhead' ? i : -1)).filter((i) => i >= 0);
        if (!idxs.length) break;
        let pick = idxs[idxs.length - 1];
        for (const i of [...idxs].reverse()) {
          const chk = validateLayout(shipId, cur.filter((_, j) => j !== i));
          if (!chk.issues.some((x) => x.code === 'floating')) {
            pick = i;
            break;
          }
        }
        cur = cur.filter((_, j) => j !== pick);
      }
      if (validateLayout(shipId, cur).ok) {
        G.s.layouts![shipId] = cur;
        fixed.push(shipId);
      } else {
        // keep their design untouched (it's still in the save); the shipyard shows what to fix
        G.flag(`layout_needs_fix_${shipId}`);
      }
    }
    if (fixed.length) return `Tu barco tenía más de ${MAX_BULKHEADS} Mamparos (ahora cuestan 1 punto y hay máximo ${MAX_BULKHEADS}). Quitamos los que ya no cabían; el resto de tu diseño quedó igual.`;
    if (Object.keys(G.s.flags).some((f) => f.startsWith('layout_needs_fix_'))) return `Tu diseño de barco tenía demasiados Mamparos (máximo ${MAX_BULKHEADS}). Tu diseño sigue guardado: ábrelo en el Astillero y ajústalo.`;
  },
});
