/**
 * PELÍCULAS — catalog rows of the GRAPHIC styles (pure; film/catalog.ts spreads them into STYLES). The Pixi side is
 * styles/grafico.ts. Added by FILM-ACTO1 for the Act I films (La Borracha is a TV box: its films are «programas» and
 * each rival presents itself in the language of its world), but every one is generic: a cat treatment + a post look +
 * the paper / screen textures it bakes. Docs: docs/part-iii/cine-v2/03-estilos-graficos.md.
 */
import type { StyleInfo } from '../catalog';

export const GRAFICO_STYLES: Record<string, StyleInfo> = {
  tv: {
    id: 'tv',
    label: 'Caricatura de TV a todo color (La Borracha): línea uniforme, colores planos, barrido de tele',
    bakes: ['tv:screen', 'tv:cats'],
    type: 'tv',
    status: 'implementado',
  },
  sombras: {
    id: 'sombras',
    label: 'Teatro de sombras: recorte café con borde de luz cálida, nunca negro',
    bakes: ['sombras:luz', 'sombras:cats'],
    type: 'davinci',
    status: 'implementado',
  },
  estencil: {
    id: 'estencil',
    label: 'Esténcil y cartel de propaganda: rojo y negro sobre papel kraft, con puentes y spray',
    bakes: ['estencil:kraft', 'estencil:cats'],
    type: 'bass',
    status: 'implementado',
  },
  fotocopia: {
    id: 'fotocopia',
    label: 'Flyer fotocopiado: blanco y negro de copiadora, tóner y trama gruesa',
    bakes: ['fotocopia:papel', 'fotocopia:cats'],
    type: 'noir',
    status: 'implementado',
  },
  vhs: {
    id: 'vhs',
    label: 'VHS de cámara casera: color lavado y corrido, líneas de tracking, nieve',
    bakes: ['vhs:cinta', 'vhs:cats'],
    type: 'tv',
    status: 'implementado',
  },
  cartel: {
    id: 'cartel',
    label: 'Cartel de lucha libre: dos tintas (rojo y negro) sobre papel amarillo, trama',
    bakes: ['cartel:papel', 'cartel:cats'],
    type: 'bass',
    status: 'implementado',
  },
  comic: {
    id: 'comic',
    label: 'Cómic impreso: puntos de trama, desregistro, contorno grueso',
    bakes: ['comic:puntos', 'comic:cats'],
    type: 'tv',
    status: 'implementado',
  },
  anime: {
    id: 'anime',
    label: 'Anime: cel con sombra dura, línea de color y brillo',
    bakes: ['anime:cats'],
    type: 'ukiyoe',
    status: 'implementado',
  },
  pixel: {
    id: 'pixel',
    label: 'Videojuego de 8 bits: bloques y paleta corta',
    bakes: ['pixel:cats'],
    type: 'tv',
    status: 'implementado',
  },
  plastilina: {
    id: 'plastilina',
    label: 'Plastilina: masa suave con brillo, huellas digitales',
    bakes: ['plastilina:cats'],
    type: 'tv',
    status: 'implementado',
  },
};
