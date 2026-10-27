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
};

export function signatureOf(species?: string): Signature | null {
  return (species && SIGNATURES[species]) || null;
}
