/** Parte III · each MULTIDIMENSIONAL cat with art → its own universe in the reveal (see kit.ts). A new one needs its entry here. */
import type { Signature } from './kit';
import { homiau } from './homiau';
import { gatarana } from './gatarana';
import { murciegato } from './murciegato';
import { supersiames } from './supersiames';
import { harrygatter } from './harrygatter';
import { gatomalo } from './gatomalo';
import { tailorswift } from './tailorswift';
import { billie } from './billie';
import { vangato } from './vangato';
// UNIVERSOS-B (2026-10-28): the reference cats
import { gatzilla } from './gatzilla';
import { emiau } from './emiau';
import { gritito } from './gritito';
import { gatoconda } from './gatoconda';
import { sonrisa } from './sonrisa';
import { sirsimon } from './sirsimon';
import { garbancito } from './garbancito';
import { maneki } from './maneki';
// UNIVERSOS-A (2026-10-28): the reference cats
import { comecroquetas } from './comecroquetas';
import { bigoton } from './bigoton';
import { ovillo } from './ovillo';
import { estambre } from './estambre';
import { gataranaNoir } from './gataranaNoir';
import { gataranaBlanca } from './gataranaBlanca';
import { gatarana2099 } from './gatarana2099';
import { gatemson } from './gatemson';

export const SIGNATURES: Record<string, Signature> = {
  x_homiau: homiau,
  x_gatarana: gatarana,
  x_murciegato: murciegato,
  x_supersiames: supersiames,
  x_harrygatter: harrygatter,
  x_gatomalo: gatomalo,
  x_tailorswift: tailorswift,
  x_billiebigotish: billie,
  x_vangato: vangato,
  // UNIVERSOS-B
  l_gatzilla: gatzilla,
  l_emiau: emiau,
  c_gritito: gritito,
  e_gatoconda: gatoconda,
  e_sonrisa: sonrisa,
  e_sirsimon: sirsimon,
  r_garbancito: garbancito,
  e_maneki: maneki,
  // UNIVERSOS-A
  e_comecroquetas: comecroquetas,
  l_bigoton: bigoton,
  e_ovillo: ovillo,
  e_estambre: estambre,
  r_gatarana_noir: gataranaNoir,
  r_gatarana_blanca: gataranaBlanca,
  r_gatarana_2099: gatarana2099,
  r_gatemson: gatemson,
};

export function signatureOf(species?: string): Signature | null {
  return (species && SIGNATURES[species]) || null;
}
