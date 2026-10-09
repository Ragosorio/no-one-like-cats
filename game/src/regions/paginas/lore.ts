/**
 * Texts of the Isla de las Páginas Hundidas: the DIARIO PERDIDO (fished one page at a time), the
 * residents' cards and REGISTRO 000's lines. Tone: docs/part-ii/03 §6 (Luzterna short with a punchline,
 * the Archive's dry catalog voice). The pages SEED the saga — margins, FOLIO, the blank page being
 * written, a cat too many in the photos — and never explain it (05 §5.4: what Parte II keeps quiet).
 */
import type { Line } from '../../ui/dialog';

/** each fished page: what it says (CAPTION) + Luzterna's reaction. Max 2 lines a beat (05 §5.6). */
export const DIARIO: { n: number; page: string; luz: string }[] = [
  {
    n: 1,
    page: 'DIARIO PERDIDO · PÁG. 1 — «Día uno del catálogo. El mar no tenía nombre, así que le pusimos número. Las olas protestaron. También se archivaron.»',
    luz: '¿Archivar olas? Esto lo escribió alguien con MUCHÍSIMO tiempo libre. O con muchísimo miedo de olvidar algo.',
  },
  {
    n: 2,
    page: 'DIARIO PERDIDO · PÁG. 2 — «Regla cuarta de la Sala: nada se borra sin firma. Nada se escribe sin fecha. Nadie escribe en los márgenes.»',
    luz: '«Nadie escribe en los márgenes». …No, Capi, no ESE Nadie. Es una regla. Creo. Ojalá.',
  },
  {
    n: 3,
    page: 'DIARIO PERDIDO · PÁG. 3 — «La goma trabaja de noche. Nunca la hemos visto, pero se nota dónde estuvo: ahí no queda nada. Ni el hueco.»',
    luz: 'Una goma de borrar con turno nocturno. Conozco a alguien así… o conocía. Ya no me acuerdo. Qué conveniente.',
  },
  {
    n: 4,
    page: 'DIARIO PERDIDO · PÁG. 4 — «FOLIO 001: capitán. Llegó en balsa. Pidió un gato; se le dieron tres. Nota: vigilar al naranja.»',
    luz: '¿«Vigilar al naranja»? Canelo, ¿qué hiciste? …Está dormido. Claro que está dormido.',
  },
  {
    n: 5,
    page: 'DIARIO PERDIDO · PÁG. 5 — «Foto 12 del expediente: tres gatos en cubierta. Al revelarla salen cuatro. Nadie recuerda al cuarto.»',
    luz: 'Odio esa frase. Odio que la hayan escrito con tan bonita letra. Y odio que la foto no venga pegada.',
  },
  {
    n: 6,
    page: 'DIARIO PERDIDO · PÁG. 6 — «La página en blanco no está vacía: está esperando. El papel tiene paciencia. La tinta, no.»',
    luz: 'Es lo más tierno y lo más aterrador que he leído, Capi. Y estoy muerta: he leído MUCHO.',
  },
  {
    n: 7,
    page: 'DIARIO PERDIDO · PÁG. 7 — Una nota al margen, con otra letra: «no la cierren todavía». Debajo, con la letra del catálogo: «¿quién escribió esto?»',
    luz: 'Esa letra… se parece a… No. A nada. Tú sigue pescando, Capi. Y no me enseñes tu lista del súper.',
  },
  {
    n: 8,
    page: 'DIARIO PERDIDO · PÁG. 8 — «Última entrada. El faro se apagó. Si alguien lo vuelve a prender, que no apunte a casa: que apunte aquí. Para que sepan dónde buscarnos.»',
    luz: 'Ese faro se apagó cuando yo era chiquita. Alguien lo anotó. Alguien ME anotó… Ya los encontramos, ¿no? Ojalá seamos los únicos buscando.',
  },
];

/** after the eight: loose pages with nothing secret on them (the Archive's day-to-day) */
export const LOOSE: Line[][] = [
  [
    ['CAPTION', 'PÁGINA SUELTA — «Se solicita lápiz rojo. Responde al nombre de "el bueno". Recompensa: una sardina.»'],
    ['LUZTERNA', 'Si lo encuentras, es mío. Tengo cosas que corregir. Empezando por tu peinado.'],
  ],
  [
    ['CAPTION', 'PÁGINA SUELTA — «Inventario: cuatro millones de libros, un gato. El gato está encima de los libros.»'],
    ['LUZTERNA', 'Hay cosas que no cambian en ningún universo. Literal.'],
  ],
  [
    ['CAPTION', 'PÁGINA SUELTA — «Reclamo 88: alguien dobló la esquina de la página 213. Firmado: Marcapáginas.»'],
    ['LUZTERNA', 'Fue él. Siempre es el que pone la queja.'],
  ],
  [
    ['CAPTION', 'PÁGINA SUELTA — Está en blanco. Huele a tinta fresca, como si alguien estuviera a punto de escribir en ella.'],
    ['LUZTERNA', 'Suéltala, Capi. Suéltala despacito. No le demos ideas a nadie.'],
  ],
  [
    ['CAPTION', 'PÁGINA SUELTA — «Horario de la Sala de Lectura: siempre. Ruido permitido: nunca. Gatos permitidos: no se les pudo impedir.»'],
    ['LUZTERNA', 'Ni a los gatos ni a mí. Las reglas son para los vivos.'],
  ],
  [
    ['CAPTION', 'PÁGINA SUELTA — «Registro de visitas: un pato con sombrero. Pidió un libro de piratas. Se le dio uno de patos. Se fue indignado.»'],
    ['LUZTERNA', '¡Cuac! …Perdón. Se me pegó.'],
  ],
];

/** residents: a card that is a joke first and the honest how-to second (03 §6, pattern 7) */
export const BIOS: Record<string, string> = {
  c_marcapaginas: 'Vive en la página 213 de este libro. Lleva cuarenta años ahí y jura que ya casi lo termina. Si lo mueves, pierde el hilo y te lo cobra en siestas.',
  r_tintero: 'Firma todo lo que pisa: el piso, las piedras, tu barco. Dice que el charco de tinta es su spa. El charco no opina, porque es tinta.',
  e_archivista: 'Cataloga todo lo que pasa por la isla. Ya te catalogó a ti: «Varios». Se duerme a media ficha y despierta exigiendo silencio.',
  l_bibliotecario_sleep: 'Duerme en la Sala de Lectura sobre una pila de libros mojados. Ronca bajito, por educación. Si lo vas a despertar, que sea a cañonazos: odia el ruido, pero odia más que lo despierten a medias.',
  l_bibliotecario_awake: 'Despierto y de malas. Patrulla la isla callando a las olas, a las gaviotas y a tus gatos. Las olas no le hacen caso. Tus gatos tampoco.',
  c_espumita: 'Hace burbujas cuando está feliz, cuando está enojada y cuando se aburre. O sea, siempre. Su pasatiempo es ensuciar cosas limpias. Las olas la adoran.',
};

/** fallback how-to (the data's obtain.how wins when it exists) */
export const HOW: Record<string, string> = {
  c_marcapaginas: 'Se queda contigo al vencer a la Biblioteca a la Deriva. Después: Resonancia con un padre de Magia.',
  r_tintero: 'Resonancia: Sombra + Agua.',
  e_archivista: 'Resonancia: Magia + Agua, los dos padres Nv15+.',
  l_bibliotecario: 'Se queda contigo cuando le ganas en la Sala de Lectura.',
  c_espumita: 'Resonancia con un padre de Agua.',
};

export const REGISTRO_CARD = 'Especie: desconocida · Elemento: ninguno · Rareza: no aplicable · Estado: observando';

/** what happens when you tap REGISTRO 000 (it is gone before the camera gets there) */
export const REGISTRO_LINES: Line[][] = [
  [
    ['SISTEMA', 'REGISTRO 000 · FOLIO 000 · STATUS: OBSERVING'],
    ['LUZTERNA', '¿Capi? ¿A qué le apuntas? Ahí no hay nada… ¿Verdad que no había nada?'],
  ],
  [
    ['SISTEMA', 'ENTRY NOT FOUND.'],
    ['LUZTERNA', 'Te juro que ahí estaba. Sentado. Mirándonos. …Mejor prendo más la linterna.'],
  ],
  [
    ['SISTEMA', 'REGISTRO 000 · LAST SEEN: NOW'],
    ['LUZTERNA', 'Otra vez esa roca vacía. Qué raro que una roca vacía me dé tanto frío. Estoy MUERTA, no debería tener frío.'],
  ],
];
