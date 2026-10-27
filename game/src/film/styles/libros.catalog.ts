/**
 * PELÍCULAS — catalog rows of the BOOK styles (pure; film/catalog.ts spreads them into STYLES). The Pixi side is
 * styles/libros.ts. Added by FILM-ACTO3 for Act III «Lo que está escrito» (the Library box: the screen is an OPEN BOOK
 * and every rival presents itself in the language of its page), but each one is generic: a cat treatment + a post look +
 * the paper / screen textures it bakes. Docs: docs/part-iii/cine-v2/05-estilos-libro.md.
 */
import type { StyleInfo } from '../catalog';

export const LIBROS_STYLES: Record<string, StyleInfo> = {
  libros: {
    id: 'libros',
    label: 'Lámina de libro ilustrado victoriano: pluma sepia y acuarela plana de 2–3 valores sobre papel',
    bakes: ['libros:papel', 'libros:cats'],
    type: 'davinci',
    status: 'implementado',
  },
  popup: {
    id: 'popup',
    label: 'Libro desplegable: recortes de cartulina con borde troquelado que se levantan del pliegue',
    bakes: ['popup:carton', 'popup:cats'],
    type: 'davinci',
    status: 'implementado',
  },
  dore: {
    id: 'dore',
    label: 'Grabado de Doré: tramado de buril que sigue la forma, negro de tinta, papel crema, luna',
    bakes: ['dore:papel', 'dore:cats'],
    type: 'silent',
    status: 'implementado',
  },
  expresionismo: {
    id: 'expresionismo',
    label: 'Expresionismo alemán: sombras pintadas, perspectivas chuecas, verde y sepia',
    bakes: ['expresionismo:pinceladas', 'expresionismo:cats'],
    type: 'bass',
    status: 'implementado',
  },
  tecnico: {
    id: 'tecnico',
    label: 'Plano técnico blanco sobre blanco: líneas gris perla, cotas, ejes de simetría',
    bakes: ['tecnico:rejilla', 'tecnico:cats'],
    type: 'default',
    status: 'implementado',
  },
  tinta: {
    id: 'tinta',
    label: 'Noir de tinta y aguada: grises fríos y un solo color (el de la linterna)',
    bakes: ['tinta:aguada', 'tinta:cats'],
    type: 'noir',
    status: 'implementado',
  },
  pirata: {
    id: 'pirata',
    label: 'Señal pirata de televisión: barras de color, barrido, separación de color',
    bakes: ['pirata:barras', 'pirata:cats'],
    type: 'tv',
    status: 'implementado',
  },
  datamosh: {
    id: 'datamosh',
    label: 'Datamosh sobre acuarela: bloques de compresión y píxeles que arrastran el cuadro anterior',
    bakes: ['datamosh:bloques', 'datamosh:cats'],
    type: 'davinci',
    status: 'implementado',
  },
};
