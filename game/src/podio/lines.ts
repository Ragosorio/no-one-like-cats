/** El Podio — copy (Luzterna's presentation, announcer, results). Latin-American Spanish, sin filtro. */
import type { Line } from '../ui/dialog';

/** story beat when the Podio opens (mission P01 appears) */
export const PODIO_INTRO: Line[] = [
  ['LUZTERNA', '¿Oyes ese griterío, Capi? Detrás del muelle abrieron EL PODIO. Un gato contra otro gato: uno a la izquierda, otro a la derecha. Sin barcos. Sin cañones. Puro orgullo.'],
  ['LUZTERNA', '¿Para qué sirve? Para que cada gato se haga fuerte POR SU CUENTA. Cada duelo le sube su nivel de Podio y le afila sus cuatro poderes: Básico, Técnica, Estilo y la ULTI.'],
  ['LUZTERNA', 'Y lo que aprende ahí arriba se lo lleva a todos lados: en el barco pega más y llega con la ulti cargada, y en la isla hasta produce más oro. Al revés también: un gato bien alimentado llega más bravo al Podio.'],
  ['LUZTERNA', 'Pagan en Doblones, Pescaditos, orbes de ESE gato y Ronroneo: la mitad a tu bóveda y la otra mitad acelera tus relojes. Botón PODIO, abajo. Ve a que te rompan la cara. Con cariño.'],
];

/** announcer when the duel starts */
export const START = ['¡PELEEN!', '¡A LOS BIGOTES!', '¡FIGHT!', '¡HAJIME!', '¡QUE SE ARMEN LOS MICHIS!'];
export const KO_WORDS = ['¡K.O.!', '¡NOQUEADO!', '¡FUERA!', '¡A DORMIR!'];
export const WIN_QUIPS = [
  'El público pide autógrafos. Tu gato pide croquetas.',
  'El rival se fue llorando. Con estilo, eso sí.',
  'Un pescado que pasaba lo grabó todo.',
  'Ganaste. Ahora no te pongas insoportable.',
];
export const LOSS_QUIPS = [
  'Perder también es entrenar. Eso dicen los que pierden.',
  'Tu gato dice que se resbaló. Le creemos.',
  'Aliméntalo en la isla y vuelve. Esto es personal.',
  'La revancha es gratis. El orgullo no.',
];
export const SKIP_TEXT: Record<string, string> = { stun: '¡ATURDIDO!', shock: '¡TIESO! (CARGADO)', sleep: 'zZz… (DORMILÓN)', freeze: '¡CONGELADO!' };

export function pick<T>(a: readonly T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}
