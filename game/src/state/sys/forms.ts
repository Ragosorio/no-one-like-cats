/**
 * FORMS — the rules that need a save (registry and pure helpers: data/rupturas/formas.ts).
 *
 * - `OwnedCat.form` is optional: absent = original. Old saves load unchanged (migrate.ts only drops a
 *   malformed value). A stored form that isn't valid NOW (unknown id, sealed, flag missing) is ignored:
 *   the cat draws and fights as the original, and the stored value is left alone.
 * - Unlock = the form's flag (`forma:<id>`, a mission's `unlocks`). Sealed forms never unlock this wave.
 * - Switching is free and instant: `setForm` emits `cat` {why:'form'} (open panels redraw) and saves.
 * - Instance → painting goes through `catSlug(c)`; while the form's art isn't in the build, art/catArt.ts
 *   draws the original's painting (resolveFormSlug).
 * - Reveal bookkeeping (ext.forms): which unlocked forms already had their reveal / were seen in the sheet.
 *   Derived from the flags, so a save that already holds the flag gets its reveal once, on any load.
 */
import { G, OwnedCat } from '../game';
import { CAT_BY_ID } from '../../data/content';
import { FORMS, FormDef, formFor, formsOf } from '../../data/rupturas/formas';

/** a sealed form never unlocks; the rest unlock with their flag */
export function formUnlocked(f: FormDef): boolean {
  return !f.sealed && G.has(f.unlockFlag);
}

/** the form this cat is showing (undefined = original) */
export function activeForm(c: Pick<OwnedCat, 'species' | 'form'>): FormDef | undefined {
  const f = formFor(c.species, c.form);
  return f && formUnlocked(f) ? f : undefined;
}
export function activeFormId(c: Pick<OwnedCat, 'species' | 'form'>): string | undefined {
  return activeForm(c)?.id;
}

/** THE instance → painting slug choke point (island, sheet, portraits, battle builder) */
export function catSlug(c: Pick<OwnedCat, 'species' | 'form'>): string {
  return activeForm(c)?.slug ?? CAT_BY_ID.get(c.species)?.art.slug ?? 'canelo_cozy_cat';
}

/** the cat sheet shows the FORMA selector: the species has forms and Parte II started (or one is unlocked) */
export function formsVisible(c: Pick<OwnedCat, 'species'>): boolean {
  const fs = formsOf(c.species);
  if (!fs.length) return false;
  return fs.some(formUnlocked) || G.s.missions.done.includes('H30');
}

export type FormSwitch = 'ok' | 'same' | 'sealed' | 'locked' | 'unknown';

/**
 * Switch a cat's form (`null` / 'original' = back to the original). Free and instant. Never touches
 * anything else of the cat (level, stars, orbs, name, home): only the optional `form` field.
 */
export function setForm(c: OwnedCat, formId: string | null): FormSwitch {
  if (!formId || formId === 'original') {
    if (c.form === undefined) return 'same';
    delete c.form;
  } else {
    const f = formFor(c.species, formId);
    if (!f) return 'unknown';
    if (f.sealed) return 'sealed';
    if (!formUnlocked(f)) return 'locked';
    if (c.form === f.id) return 'same';
    c.form = f.id;
    markFormSeen(f.id);
  }
  G.recalc();
  G.emit('cat', { uid: c.uid, why: 'form' });
  G.save();
  return 'ok';
}

// ------------------------------------------------------------------ reveal bookkeeping (ext.forms)
interface FormsExt {
  /** unlocked forms whose reveal already played */
  revealed: string[];
  /** unlocked forms the player already saw in the cat sheet (the ¡NUEVO! highlight goes away) */
  seen: string[];
}
function ext(): FormsExt {
  const root = (G.s.ext ??= {});
  const cur = root.forms as Partial<FormsExt> | undefined;
  const st: FormsExt = {
    revealed: Array.isArray(cur?.revealed) ? cur!.revealed.filter((x) => typeof x === 'string') : [],
    seen: Array.isArray(cur?.seen) ? cur!.seen.filter((x) => typeof x === 'string') : [],
  };
  root.forms = st;
  return st;
}

/** unlocked forms that still owe the player their reveal (live unlock or an old save with the flag) */
export function formRevealsPending(): FormDef[] {
  if (!G.s.cats.length) return [];
  const done = (G.s.ext?.forms as Partial<FormsExt> | undefined)?.revealed ?? [];
  return FORMS.filter((f) => formUnlocked(f) && !done.includes(f.id) && G.s.cats.some((c) => c.species === f.species));
}
export function markFormRevealed(id: string) {
  const st = ext();
  if (!st.revealed.includes(id)) st.revealed.push(id);
  // the reveal grants nothing: replaying it (a lost save, a second window) can never pay twice
}
/** unlocked but never looked at in the sheet → the selector highlights it */
export function formIsNew(f: FormDef): boolean {
  if (!formUnlocked(f)) return false;
  const seen = (G.s.ext?.forms as Partial<FormsExt> | undefined)?.seen ?? [];
  return !seen.includes(f.id);
}
export function markFormSeen(id: string) {
  const st = ext();
  if (!st.seen.includes(id)) st.seen.push(id);
}

/** the owned cat a form reveal is about (first of its species) */
export function formOwner(f: FormDef): OwnedCat | undefined {
  return G.s.cats.find((c) => c.species === f.species);
}

// unlocking a form changes nothing derived by itself (the player switches in the sheet), but an unlock that
// lands while a cat already holds that form id (a save from a newer build) changes its Poder: recompute
G.on('unlock', ({ what }) => {
  if (FORMS.some((f) => f.unlockFlag === what) && G.s.cats.some((c) => c.form)) G.recalc();
});
