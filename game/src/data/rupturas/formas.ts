/**
 * FORMAS — evolutions as switchable manifestations (Parte II, docs/part-ii/12-puente-oleada-1.md §4 and
 * 05-biblia-parte-ii.md §7.3). A form is NOT a species: it is how ONE owned cat chooses to show up.
 *
 * - Never replaces the original: `OwnedCat.form` absent = original. Switching is free and instant.
 * - A form may change the painting (slug), ADD elements, override the shot/ultimate text and stats
 *   (content-shaped, like content.json) and point the ultimate at a sim effect (`ult.key` → battle/ults.ts).
 * - Power bump is modest (Poder ×powMul, ~+10–15%): a form never makes a cat the best of the game.
 * - Unlock: a story flag (`unlockFlag`, set by a mission's `unlocks`). `sealed` forms are visible but locked
 *   (with their hint) no matter what flags exist, until a later wave opens them.
 *
 * Pure data + pure helpers (no game state): the battle builder, the art layer and the tests import this.
 * The rules that need a save (unlocked? active?) live in state/sys/forms.ts.
 */
import { CAT_BY_ID, type CatDef, type ShotSpec, type UltSpec } from '../content';

export interface FormDef {
  /** forever id (stored in saves as OwnedCat.form) */
  id: string;
  /** species it belongs to */
  species: string;
  /** full name (reveal, sheet) */
  name: string;
  /** selector label (short, caps) */
  label: string;
  /** painting slug (public/cats-svg/<slug>.svg + lite + rig). Until the art lands the original's is drawn. */
  slug: string;
  /** elements added after the species' own (the first element — affinity, habitat — never changes) */
  elementsAdd: string[];
  /** Poder multiplier of the cat while in this form (feeds ship power and the crew's damage share) */
  powMul: number;
  /** overrides on the content shot (same shape as content.json › cats[].combat.shot) */
  shot?: Partial<ShotSpec>;
  /** overrides on the content ultimate; `key` = sim effect in battle/ults.ts ULTS (absent = species behavior) */
  ult?: Partial<UltSpec> & { key?: string };
  /** Battle Form name / cry while in this form */
  battleForm?: { name: string; cry: string };
  /** epithet shown with the name (reveal, sheet) */
  epithet: string;
  /** one line for the sheet: what changes, in the player's words */
  blurb: string;
  /** chips for the reveal */
  chips: string[];
  /** flag that unlocks it (state/sys/forms.ts) */
  unlockFlag: string;
  /** shown on a locked (not yet earned) form */
  lockedHint: string;
  /** sealed in this wave: always locked, shows `sealedHint` */
  sealed?: boolean;
  sealedHint?: string;
  /** design note: its behavior on the island (not wired yet; the island uses the painting only) */
  island: string;
  /** design note: the lore line for the reveal */
  caption: string;
}

export const FORMS: FormDef[] = [
  {
    id: 'canelo_almirante',
    species: 'c_canelo',
    name: 'Canelo Almirante',
    label: 'ALMIRANTE',
    slug: 'canelo_admiral_cat',
    elementsAdd: ['water'],
    powMul: 1.12,
    ult: {
      key: 'canelo_almirante',
      name: '¡A BABOR! (取舵いっぱい)',
      effect: 'Canelo da la orden: suelta su andanada y TODA la tripulación dispara su propio tiro por donde él apunta (al 30%). Es liderazgo, no fuerza bruta.',
    },
    battleForm: { name: 'CANELO — ALMIRANTE DE LA BAÑERA', cry: '¡A BABOR, BOLA DE INÚTILES!' },
    epithet: 'el Almirante',
    blurb: 'Fuego + Agua · ulti ¡A BABOR! (la tripulación apunta como él) · Poder +12%',
    chips: ['FUEGO + AGUA', 'ULTI: ¡A BABOR!', 'PODER +12%'],
    unlockFlag: 'forma:canelo_almirante',
    lockedHint: 'Canelo quiere mandar. Gánale peleas con él a bordo (misión «¡A BABOR!», Parte II).',
    island: 'Patrulla el muelle, duerme en el barco y les grita a las gaviotas.',
    caption: 'Sigue siendo Canelo: la misma bufanda, la misma panza, la misma impaciencia. Ahora con gorro y ganas de mandar.',
  },
  {
    id: 'canelo_astral',
    species: 'c_canelo',
    name: 'Canelo Astral',
    label: 'ASTRAL',
    slug: 'canelo_astral_cat',
    elementsAdd: ['cosmic'],
    powMul: 1.12,
    ult: {
      name: 'BOLA DE PELO DE HORIZONTE',
      effect: 'Un proyectil que entra a una grieta y reaparece en otro punto del campo, elegido por ti.',
    },
    battleForm: { name: 'CANELO — LA ANOMALÍA', cry: '¿QUIÉN ESTÁ EN LAS ROCAS?' },
    epithet: 'la Anomalía',
    blurb: 'Fuego + Cósmico · ulti Bola de Pelo de Horizonte',
    chips: ['FUEGO + CÓSMICO', 'ULTI: HORIZONTE'],
    unlockFlag: 'forma:canelo_astral',
    lockedHint: 'Algo en el cielo todavía no se abre.',
    sealed: true,
    sealedHint: 'Algo en el cielo todavía no se abre.',
    island: 'Es el único que puede ver a REGISTRO 000: se queda mirando el peñasco.',
    caption: 'Mira algo que tú no ves. Y no parpadea.',
  },
];

export const FORM_BY_ID = new Map(FORMS.map((f) => [f.id, f]));
export const FORM_BY_SLUG = new Map(FORMS.map((f) => [f.slug, f]));

/** the forms a species can take (selector order) */
export function formsOf(species: string): FormDef[] {
  return FORMS.filter((f) => f.species === species);
}

/** a stored form id that belongs to this species (else undefined: unknown ids, other species → original) */
export function formFor(species: string, formId: string | null | undefined): FormDef | undefined {
  if (!formId) return undefined;
  const f = FORM_BY_ID.get(formId);
  return f && f.species === species ? f : undefined;
}

/** the original painting a form slug stands on while its own art isn't there (undefined = not a form slug) */
export function formBaseSlug(slug: string): string | undefined {
  const f = FORM_BY_SLUG.get(slug);
  return f ? CAT_BY_ID.get(f.species)?.art.slug : undefined;
}

/**
 * The painting to draw for `slug`: a form's own art once it exists (`hasArt`: its rig is in catRigs.json),
 * else the original's. Non-form slugs pass through. Pure (art/catArt.ts injects `hasArt`).
 */
export function resolveFormSlug(slug: string, hasArt: (slug: string) => boolean): string {
  if (hasArt(slug)) return slug;
  return formBaseSlug(slug) ?? slug;
}

/**
 * The content definition as the cat fights in this form: painting, elements (added, never replacing the
 * first), shot / ultimate / Battle Form overrides. Unknown form or another species' form → `def` untouched.
 */
export function applyForm(def: CatDef, formId: string | null | undefined): CatDef {
  const f = formFor(def.id, formId);
  if (!f) return def;
  const { key: _key, ...ultOver } = f.ult ?? {};
  return {
    ...def,
    epithet: f.epithet,
    art: { ...def.art, slug: f.slug },
    elements: [...new Set([...def.elements, ...f.elementsAdd])],
    battleForm: f.battleForm ?? def.battleForm,
    combat: {
      ...def.combat,
      shot: { ...def.combat.shot, ...(f.shot ?? {}) },
      ultimate: { ...def.combat.ultimate, ...ultOver },
    },
  };
}

/** sim ultimate key of a form (battle/ults.ts ULTS); undefined = the species' own */
export function formUltKey(species: string, formId: string | null | undefined): string | undefined {
  return formFor(species, formId)?.ult?.key;
}

/** Poder multiplier of a form (1 = original) */
export function formPowMul(species: string, formId: string | null | undefined): number {
  return formFor(species, formId)?.powMul ?? 1;
}
