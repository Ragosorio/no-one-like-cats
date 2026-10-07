/**
 * Why is there a casino on a cat island? (casino agent) — Luzterna's beat the first time El Gato Negro shows up
 * (story.ts WHEN 'casino_intro', after the first boss). Lore: what Distraxia erases doesn't vanish, it falls
 * through the cracks of the multiverse… and most of it lands in Madame Noir's casino.
 * Kept here (types only, no runtime imports) so the story module stays light.
 */
import type { Line } from '../../ui/dialog';

export const CASINO_INTRO: Line[] = [
  ['LUZTERNA', '¿Oyes eso, {name}? Monedas y música de elevador. La Gárgola se cayó tan fuerte que abrió una grieta en el muelle.'],
  ['LUZTERNA', 'Ahí atrás está El Gato Negro: un casino que flota entre mundos. Lo que Distraxia borra no desaparece del todo… se cae por las grietas. Y casi todo cae ahí.'],
  ['LUZTERNA', 'Incluidos gatos. Gatos perdidos de otros multiversos. Madame Noir los "rescata" y los pone de premio. ¿Legal? En ningún mundo hay leyes para gatos.'],
  ['LUZTERNA', 'La casa siempre gana, que quede clarito. Pero reparte dulces: boletos, rachas calientes y, de vez en cuando, un legendario que se le escapa.'],
  ['LUZTERNA', 'Si te quedas atrás con los jefes, es tu vía rápida: un buen gato del Portal te salva una zona entera. Y se juega con fichas y boletos que ganas peleando. Cero dinero de verdad.'],
  ['LUZTERNA', 'Ah, y dicen que Lumen, la gata fotógrafa, ronda el Portal tomándole fotos a todo. Si la ves salir, no la dejes ir.'],
];
