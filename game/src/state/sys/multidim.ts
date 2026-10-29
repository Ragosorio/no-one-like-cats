/**
 * Parte III · la rareza MULTIDIMENSIONAL (docs/part-iii/mecanicas-v2/02-loop.md §7, 03-plan-implementacion.md etapa 2,
 * 06-gatos-rareza-arte.md §1) — detrás de la bandera P3_MULTIDIM.
 *
 * 2026-10-27 (GATOS-DATOS, decisión del coordinador): ENCENDIDA para los Multidimensionales que tienen arte aprobado
 * (los 9 de `data/gateras/especies.json`, prefijo `x_`). Los huecos sin arte (Michi-Wan, Lince, Bastet, El Michito del
 * Barril) quedan dormidos: no hay especie, no hay nada que ver.
 *
 *   · RarityId la conoce (state/econ.ts) y TODAS las tablas por rareza la tienen (balance.json rarities.*, el `hatch`
 *     de kingdom, ui/theme RARITY, la impresión de la carta, los RANK) — tests/rarityFinite.test.ts lo exige: nunca un
 *     NaN silencioso por una rareza sin entrada.
 *   · `rarities.order` (el orden de PODER que todo el juego recorre) NO la incluye: rarityOrder() la mete entre
 *     legendario y mítico (poder base 6.9) y la interfaz la pone AL FINAL del filtro (categoryOrder()).
 *   · Nunca sale del Portal, del Casino ni de la Resonancia (poolable()); ningún gato de la Parte III sale de ahí ni de la
 *     tienda de gatos (poolableCat / isP3Cat): se consiguen por historia, rescate o actividad (state/sys/p3cats.ts).
 *   · Con la bandera apagada, las especies Multidimensionales no se fusionan (data/content.ts).
 *   · Sus REGLAS DE ORIGEN, el Cruce y la Ventaja de casa (02 §7.2) siguen dormidas: piden la prueba de parejas de §7.3.
 */
import { BAL, type RarityId } from '../econ';

export const MULTIDIM: RarityId = 'multidimensional';
/** the flag (mutable for tests); ON since 2026-10-27 for the Multidimensionals with approved art */
export const P3_MULTIDIM = { on: true };

export const isMultidim = (r: string | undefined | null) => r === MULTIDIM;

/** the POWER order of the rarities (BAL.rarities.order; with the flag, MULTIDIMENSIONAL between legendary and mythic) */
export function rarityOrder(): RarityId[] {
  const base = BAL.rarities.order as RarityId[];
  if (!P3_MULTIDIM.on || base.includes(MULTIDIM)) return [...base];
  const i = base.indexOf('legendary');
  return [...base.slice(0, i + 1), MULTIDIM, ...base.slice(i + 1)];
}
/** a rarity's power rank (fractional for the primordials, which are legendary underneath); −1 = unknown */
export function rarityRank(r: string, primordial = false): number {
  const i = rarityOrder().indexOf(r as RarityId);
  return i < 0 ? -1 : i + (primordial ? 0.5 : 0);
}
/** the order the INTERFACE shows (the RAREZA filter): the power order, MULTIDIMENSIONAL last (a category of its own) */
export function categoryOrder(): RarityId[] {
  const o = rarityOrder().filter((r) => r !== MULTIDIM);
  return P3_MULTIDIM.on ? [...o, MULTIDIM] : o;
}
/** may a species of this rarity come out of the Portal, the Casino or the Resonance? (a Multidimensional: never) */
export const poolable = (r: string | undefined | null) => !isMultidim(r);
/**
 * A cat of the Parte III (data/gateras/especies.json: `obtain.source` 'p3:<fuente>'). Pure on the data, so the pools can
 * read it without the save: they never come out of the Portal, the Casino, the Resonance, the cat shop nor the Podio.
 */
export const isP3Cat = (def: { obtain?: { source?: string } } | undefined | null) => !!def?.obtain?.source?.startsWith('p3:');
/**
 * A cat of AFTER the Parte III (data/postp3/especies.json: a `post` block, `obtain.source` 'post:…'). Pure on the data:
 * it never enters the generic pools (Portal, Casino, Resonance, cat shop, the Podio's rivals); only its own table's
 * Multiverse pool or its Podio champion give it, once the Parte III is over (state/sys/postp3.ts).
 */
export const isPostCat = (def: { obtain?: { source?: string }; post?: unknown } | undefined | null) => !!def?.post || !!def?.obtain?.source?.startsWith('post:');
/** may this species come out of a random pool (Portal, Casino, Resonance)? never a Multidimensional, a Parte III cat nor a post cat */
export const poolableCat = (def: { rarity: string; obtain?: { source?: string }; post?: unknown }) => poolable(def.rarity) && !isP3Cat(def) && !isPostCat(def);
