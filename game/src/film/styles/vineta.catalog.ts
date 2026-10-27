/**
 * PELÍCULAS — catalog rows of the PAGE & PANEL styles (pure; film/catalog.ts spreads them into STYLES). The Pixi side is
 * styles/vineta.ts. Added by FILM-ACTO2 for the Act II films (the comic multiverse and the shōnen sea: every rival
 * presents itself in the language of its world), but every one is generic: a cat treatment + a post look + the paper /
 * screen textures it bakes. Docs: docs/part-iii/cine-v2/05-estilos-acto2.md.
 */
import type { StyleInfo } from '../catalog';

export const VINETA_STYLES: Record<string, StyleInfo> = {
  aracnido: {
    id: 'aracnido',
    label: 'Cómic moderno del «verso arácnido»: tintas planas corridas, puntos de trama en dos colores, línea gruesa, animación a dos cuadros',
    bakes: ['aracnido:puntos', 'aracnido:cats'],
    type: 'tv',
    status: 'implementado',
  },
  periodico: {
    id: 'periodico',
    label: 'Periódico de los 40: trama a 45° en papel de diario amarillento, una tinta de color corrida',
    bakes: ['periodico:papel', 'periodico:cats'],
    type: 'noir',
    status: 'implementado',
  },
  edadplata: {
    id: 'edadplata',
    label: 'Cómic de la Edad de Plata: tintas planas de imprenta, puntos Ben-Day grandes, papel envejecido',
    bakes: ['edadplata:papel', 'edadplata:cats'],
    type: 'tv',
    status: 'implementado',
  },
  nocturna: {
    id: 'nocturna',
    label: 'Documental con visión nocturna: verde fósforo, grano, teleobjetivo, visor de cámara',
    bakes: ['nocturna:visor', 'nocturna:cats'],
    type: 'default',
    status: 'implementado',
  },
  manga: {
    id: 'manga',
    label: 'Manga en tramas (yonkoma): blanco y negro con trama de puntos, un solo color que se conserva (el azul)',
    bakes: ['manga:trama', 'manga:cats'],
    type: 'ukiyoe',
    status: 'implementado',
  },
  hilo: {
    id: 'hilo',
    label: 'Hilo continuo: el mundo es una sola línea blanca sobre índigo; los luchadores en cel',
    bakes: ['hilo:indigo', 'hilo:cats'],
    type: 'ukiyoe',
    status: 'implementado',
  },
  caravaggio: {
    id: 'caravaggio',
    label: 'Caravaggio: tenebrismo, óleo oscuro, un solo rayo de luz rasante',
    bakes: ['caravaggio:lienzo', 'caravaggio:cats'],
    type: 'davinci',
    status: 'implementado',
  },
};
