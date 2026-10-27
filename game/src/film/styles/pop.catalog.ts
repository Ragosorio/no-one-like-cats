/**
 * PELÍCULAS — catalog row of the POP style (pure; film/catalog.ts spreads it into STYLES). The Pixi side is
 * styles/pop.ts. Added by FILM-ACTO4 for the Act IV films (La Gira, the POP box: «fotograma de videoclip o póster de
 * era», arte-v2/01-reglas-de-referencia.md §5), but generic: a cat treatment + a post look + the LED / stage textures.
 * Docs: docs/part-iii/agentes/FILM-ACTO4.md «Estilo pop».
 */
import type { StyleInfo } from '../catalog';

export const POP_STYLES: Record<string, StyleInfo> = {
  pop: {
    id: 'pop',
    label: 'Pop: fotograma de videoclip y póster de era (neón y pastel planos, una luz de escenario dura, pantallas LED)',
    bakes: ['pop:led', 'pop:cats'],
    type: 'default',
    status: 'implementado',
  },
};
