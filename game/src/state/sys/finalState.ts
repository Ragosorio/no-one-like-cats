/**
 * PARTE III · EL FINAL «Se apaga» (H93–H97) — what the finale leaves in the save. ⚠️ SPOILERS.
 * Guiones: docs/part-iii/historia-v2/guiones/final/. Who is alive, the night without Canelo and the mourning are DERIVED
 * from missions + beats (state/sys/gaterasWorld.ts); this slice keeps only what the story turns into an object:
 *
 *   ext.fin = {
 *     v: 1,
 *     llama?: number      Canelo's flame, %: −5 per box crossed (Actos II–IV), 60 from H85, 0 the night of H93–H94,
 *                         then 30 for good (TEMPERATURA Q8: never goes up)
 *     faro?: 'naranja'    H96: Canelo lit the faro with his own small flame (not her blue light)
 *     linterna?: 'escalon' | 'estante'   her broken lantern: on the faro's step (H95, La Mano), on the shelf (H96)
 *     quedo?: true        «Lo que quedó» was opened (the hidden list, the little envelope)
 *     premios?: true      the finale's prizes were paid there, in silence (once)
 *   }
 *
 * ADDITIVE: never created on load (only the finale writes it). The normalizer only repairs: unknown keys are kept, a
 * broken slice is set aside (`finBroken`), a broken field too (`<field>Broken`), and the flame never goes back up.
 */
import { G } from '../game';
import { caneloSinLlama, luzternaFallecida } from './gaterasWorld';
import { beatSeen } from '../ext/story';
import { isOpen, type DimId } from './gateras';

export interface FinExt {
  v: 1;
  llama?: number;
  faro?: 'naranja';
  linterna?: 'escalon' | 'estante';
  quedo?: true;
  premios?: true;
  [k: string]: unknown;
}
const FARO = ['naranja'] as const;
const LINTERNA = ['escalon', 'estante'] as const;

/** the slice as stored, repaired; null = not an object (set aside by the caller) */
export function normalizeFin(raw: unknown): FinExt | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const out: FinExt = { ...r, v: 1 } as FinExt;
  const bad = (k: string) => {
    out[`${k}Broken`] = r[k];
    delete out[k];
  };
  if (r.llama !== undefined) {
    const n = Number(r.llama);
    if (typeof r.llama !== 'number' || !Number.isFinite(n)) bad('llama');
    else out.llama = Math.max(0, Math.min(100, Math.round(n)));
  }
  if (r.faro !== undefined && !FARO.includes(r.faro as never)) bad('faro');
  if (r.linterna !== undefined && !LINTERNA.includes(r.linterna as never)) bad('linterna');
  for (const k of ['quedo', 'premios'] as const) {
    if (r[k] === undefined) continue;
    if (r[k] === true) out[k] = true;
    else bad(k);
  }
  return out;
}

export function fin(): FinExt | undefined {
  return G.s.ext?.fin as FinExt | undefined;
}
/** the slice, created on first need (only the finale calls this) */
function fx(): FinExt {
  G.s.ext ??= {};
  const cur = normalizeFin(G.s.ext.fin);
  if (cur) {
    G.s.ext.fin = cur;
    return cur;
  }
  const fresh: FinExt = { v: 1 };
  G.s.ext.fin = fresh;
  return fresh;
}

G.afterLoad.push(() => {
  const ext = G.s?.ext;
  if (!ext || ext.fin === undefined) return;
  const n = normalizeFin(ext.fin);
  if (n) ext.fin = n;
  else {
    ext.finBroken = ext.fin;
    delete ext.fin;
  }
});

// ------------------------------------------------------------------ Canelo's flame (Q8)
/** the flame after the dawn of H94: Cerito gave it back, small, and it never grows again */
export const LLAMA_DESPUES = 30;
/**
 * Canelo's flame, % (what the crew card, the Bitácora and the Catdex show): 100 before the finale, 0 the night without
 * him, 30 from the dawn on. The stored value wins (and only ever goes down); a save that is past the dawn without it
 * (a reload in the middle, an older build) still reads 30.
 */
export function llamaCanelo(): number {
  const stored = fin()?.llama;
  if (caneloSinLlama()) return 0;
  if (typeof stored === 'number') return Math.min(stored, 100 - 5 * CRUCES.filter((d) => isOpen(d)).length);
  if (beatSeen('b94_amanecer') || luzternaFallecida() || G.s.missions.done.includes('H94')) return LLAMA_DESPUES;
  // every wall he crosses lowers it a little (OH SHIT, «la llama baja al cruzar una rasgadura»: one box, −5 %)
  return 100 - 5 * CRUCES.filter((d) => isOpen(d)).length;
}
/** the boxes whose crossing lowers his flame (the Actos II–IV); H85 then fixes it at 60 % (app/actsFlow.ts) */
export const CRUCES: DimId[] = ['p3d_superheroes', 'p3d_anime', 'p3d_libros', 'p3d_pop'];
/** the dawn: the flame comes back, at `pct` (never higher than it already is) */
export function setLlama(pct: number) {
  const f = fx();
  const n = Math.max(0, Math.min(100, Math.round(pct)));
  f.llama = typeof f.llama === 'number' ? Math.min(f.llama, n) : n;
}
/** the label the UI shows under Canelo («SIN LLAMA» the night of H94, «LLAMA 30 %» after), or null before the finale */
export function llamaLabel(): string | null {
  if (caneloSinLlama()) return 'SIN LLAMA';
  const p = llamaCanelo();
  return p < 100 ? `LLAMA ${p} %` : null;
}

// ------------------------------------------------------------------ the objects of the finale
export const faroNaranja = () => fin()?.faro === 'naranja' || G.s.missions.done.includes('H96');
export function setFaroNaranja() {
  fx().faro = 'naranja';
}
export const linterna = (): 'escalon' | 'estante' | null => fin()?.linterna ?? null;
export function setLinterna(where: 'escalon' | 'estante') {
  fx().linterna = where;
}
export const quedoVisto = () => fin()?.quedo === true;
/** «Lo que quedó» is waiting: «Continuará» was written and the notebook hasn't shown it yet (panels/Bitacora.ts) */
export const loQueQuedoDue = () => beatSeen('b96_continuara') && !quedoVisto();
export function markQuedo() {
  fx().quedo = true;
}

/** the finale's prizes (H93–H96 pay nothing at the time: the mourning), paid once and in silence at «Lo que quedó» */
export const PREMIOS_FINAL = { gems: 40 } as const;
export function payPremiosFinal(): boolean {
  const f = fx();
  if (f.premios) return false;
  f.premios = true;
  // 'lo_que_quedo': the resource listeners can tell it apart (no toast, no jingle: the page is the only sign)
  G.add('gems', PREMIOS_FINAL.gems, 'lo_que_quedo');
  return true;
}
