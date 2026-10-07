/** El Podio — copy (Luzterna's presentation, announcer, results). Latin-American Spanish, sin filtro. */
import type { Line } from '../ui/dialog';

/** story beat when the Podio opens (mission P01 appears) */
export const PODIO_INTRO: Line[] = [
  ['LUZTERNA', '¿Oyes ese griterío, Capi? Detrás del muelle abrieron EL PODIO. Un gato contra otro gato: uno a la izquierda, otro a la derecha. Sin barcos. Sin cañones. Puro orgullo.'],
  ['LUZTERNA', '¿Para qué sirve? Para que cada gato se haga fuerte POR SU CUENTA. Cada duelo le sube su nivel de Podio y le afila sus cuatro poderes: Básico, Técnica, Estilo y la ULTI.'],
  ['LUZTERNA', 'Y lo que aprende ahí arriba se lo lleva a todos lados: en el barco pega más y llega con la ulti cargada, y en la isla hasta produce más oro. Al revés también: un gato bien alimentado llega más bravo al Podio.'],
  ['LUZTERNA', 'Pagan en Doblones, Pescaditos, orbes de ESE gato y Ronroneo: la mitad a tu bóveda y la otra mitad acelera tus relojes. Botón PODIO, abajo. Ve a que te rompan la cara. Con cariño.'],
];

/** first HEROICO ever (a VACÍO league champion paid it): what a Heroico is */
export const HEROICO_INTRO: Line[] = [
  ['LUZTERNA', '¿Viste lo que traía colgado del cinturón ese campeón? Ese gato no salió de ningún Santuario, Capi. Ese gato se GANÓ.'],
  ['LUZTERNA', 'Son los HEROICOS: los guerreros del Podio. No salen de la Resonancia ni del casino ni de abajo de una piedra. Solo los pagan los campeones de las ligas del Vacío, uno por liga, y solo la primera vez que les ganas.'],
  ['LUZTERNA', 'Pegan más que un Legendario y su ulti hace algo que ningún otro gato hace: tajos a toda la tripulación, terremotos en la quilla, lanzas del cielo, grimorios que roban barras. Y si un rival trae uno, hace exactamente lo mismo. Es una carta.'],
  ['LUZTERNA', 'Quedan más arriba. Cada campeón del Vacío trae el suyo. Súbele estrellas peleando con él en el Podio: cada victoria le da orbes de SU especie.'],
];
/** first DIVINO ever: the broken ones */
export const DIVINO_INTRO: Line[] = [
  ['LUZTERNA', '…Capi. No te muevas. No lo mires a los ojos. Bueno, míralo, ya es tuyo.'],
  ['LUZTERNA', 'Eso es un DIVINO. Los rotos. Gatos que estaban aquí antes que el mar, y que el Podio guardaba arriba de todo para que nadie los usara. Tú los usaste.'],
  ['LUZTERNA', 'Su ulti no es un tiro más fuerte: es el fin del mundo en forma de gato. Un agujero negro, el sol cayendo, mil cortes, la mitad de un barco desaparecida. Una vez por batalla, y hasta ellos tienen tope: contra un jefe, el mar no los deja pasarse.'],
  ['LUZTERNA', 'Hay cuatro, uno por cada liga del Vacío V al VIII. Si te los encuentras del otro lado del Podio, reza. Yo te prendo una vela.'],
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
export const SKIP_TEXT: Record<string, string> = { stun: '¡ATURDIDO!', shock: '¡TIESO! (CARGADO)', sleep: 'zZz… (DORMILÓN)' };

export function pick<T>(a: readonly T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}
