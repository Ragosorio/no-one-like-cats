/**
 * "Novedades": what each update brings, told to the player once (newest first).
 * Old saves see every note they missed; brand-new games start with all of them marked as seen.
 *
 * Adding an update (docs/ACTUALIZACIONES.md):
 *  1. put a new entry at the TOP with a fresh `id` (YYYY-MM-DD-slug) — never reuse or rename an id
 *  2. if the update changes rules that old saves already depend on, add a patch in state/patches.ts
 *  3. if it reshapes saved data, add a migration in state/migrate.ts (and bump SAVE_VERSION)
 */
export type UpdateTag = 'NUEVO' | 'ARREGLO' | 'CAMBIO' | 'BALANCE';

export interface UpdateNote {
  id: string;
  date: string;
  title: string;
  /** what Luzterna says when she hands you the notes */
  luzterna: string;
  items: { tag: UpdateTag; text: string }[];
}

export const UPDATES: UpdateNote[] = [
  {
    id: '2026-10-09-grietas-del-multiverso',
    date: '2026-10-09',
    title: 'Grietas del Multiverso',
    luzterna: 'Terminaste el capítulo y el mar decidió que no era suficiente. Se abrieron seis grietas. Yo no fui. Esta vez de verdad.',
    items: [
      { tag: 'NUEVO', text: 'Al terminar el Capítulo 1 se abren seis GRIETAS con seis elementos nuevos: Hielo, Sonido, Sombra, Tiempo, Luz y Vacío. Gana cada grieta y su Primordial se queda en tu isla, con su hábitat.' },
      { tag: 'NUEVO', text: '32 gatos nuevos con dibujo propio (la Catdex ahora tiene 86): 24 de los elementos nuevos y 8 de dos rarezas nuevas.' },
      { tag: 'NUEVO', text: 'En batalla: el Hielo congela cañones, la Luz atraviesa y ciega, la Sombra dispara invisible y apuñala, el Sonido aturde a través de paredes, el Tiempo rebobina tu barco y detiene el tiempo, y el Vacío borra celdas para siempre. Mismas reglas para el enemigo.' },
      { tag: 'NUEVO', text: 'HEROICO y DIVINO, arriba de Mítico. No se invocan: los campeones de las ligas del Vacío del Podio pelean con su premio y te lo dan la primera vez que les ganas.' },
      { tag: 'NUEVO', text: 'Ultis divinas: la mitad del barco de un golpe, mil cortes a toda la tripulación, el sol cayendo y un agujero negro que se traga barco y tiros. Y ultis propias para Bóreas, Áurea, Medianoche, Headliner, Nadie y Cronos.' },
      { tag: 'NUEVO', text: 'En el Podio cada elemento nuevo trae su técnica (FROST BITE, PRISM FLASH, SHADOW STITCH, SONIC BOOM, REWIND CLAW, NULL BITE) y hay sinergias nuevas: Choque térmico, Nota alta, Arcoíris y Acelerar.' },
      { tag: 'BALANCE', text: 'Los gatos de rayo y ráfaga (Raijin, Valquiria…) ya apuntan casi plano: antes la puntería automática los tiraba al cielo. A ★5 los legendarios nuevos usan su ulti dos veces, como dice su ficha.' },
      { tag: 'CAMBIO', text: 'Las expediciones con un gato de un elemento nuevo traen cristales de SU elemento, y el panel del hábitat te dice de dónde salen.' },
    ],
  },
  {
    id: '2026-10-08-podio-casino-habitats',
    date: '2026-10-08',
    title: 'El Podio, hábitats libres y un casino sin vergüenza',
    luzterna: 'Abrieron un coliseo de gatos, te dejaron poner casas donde se te antoje y el casino ya no se esconde. Yo solo pedí una siesta.',
    items: [
      { tag: 'NUEVO', text: 'EL PODIO: duelos 1 contra 1 entre gatos con cuatro poderes (Básico, Técnica, Estilo y ULTI), velocidad ×½ a ×4 y modo AUTO. Ligas de Cartón a Vacío; cada victoria paga oro, comida, orbes de ESE gato y Ronroneo. Botón PODIO abajo, después del Jefe 1.' },
      { tag: 'NUEVO', text: 'Lo que tu gato aprende en el Podio sirve en el barco (pega más y llega con la ulti cargada) y en la isla (produce más oro).' },
      { tag: 'NUEVO', text: 'Hábitats libres: compra hábitats de cualquier elemento y ponlos donde quepan; muévelos gratis o véndelos. Tus hábitats se quedaron exactamente donde estaban.' },
      { tag: 'NUEVO', text: 'Cada mejora de hábitat se ve distinta y da más espacio (hasta 14 gatos), con dos niveles nuevos: Ancla Dimensional y Trono Multiversal.' },
      { tag: 'NUEVO', text: 'Cuatro islas para después de la historia: Jardín Sakura, Oasis Dorado, Isla Caramelo y el Abismo del Ronroneo, cada una con su secreto.' },
      { tag: 'NUEVO', text: 'Casino con piloto automático (x1, x2, x4 o TURBO) que se para cuando tú digas, apuestas BAJA/MEDIA/ALTA, ALTO RIESGO y TODO O NADA en el Portal, y LA CASA TE DEBE.' },
      { tag: 'BALANCE', text: 'Muchos más boletos, tu primer legendario garantizado en 20 tiros, gato garantizado cada 6, rachas calientes y Lumen la Fotógrafa en el Portal. Cuando sale algo épico o mejor, el gato aparece directo con su presentación completa.' },
      { tag: 'ARREGLO', text: 'Tu apuesta ya no se reinicia al cambiar de color o de moneda. El casino ya no se puede ocultar, y Luzterna te cuenta por qué existe.' },
      { tag: 'NUEVO', text: 'Los jefes 4, 5 y 6 por fin pelean distinto: el Arcanista con portales, la Estrella Errante con pozos de gravedad y EL PRIMER MAR con tres núcleos y un final con STARFALL.' },
      { tag: 'NUEVO', text: 'Ultimates de verdad para legendarios y míticos: agujero negro, el sol que cae, los rieles de Raijin, los mil cortes de Noctis, el FIN de Merlina y más. Mismo gato, mismas reglas de los dos lados.' },
      { tag: 'NUEVO', text: 'Al apuntar ves cuánto le pega tu gato a cada material del casco enemigo; cada golpe dice ¡SÚPER EFECTIVO! o RESISTE. Lo que te dispara el barco enemigo dice MORTERO o CAÑÓN DEL BARCO, y ¿POR QUÉ? en la pre-batalla enseña los ajustes ocultos.' },
      { tag: 'NUEVO', text: 'Los 22 gatos que eran otro gato teñido ahora tienen su propio dibujo: Chispa y su bengala, Neblino en su tetera, Rencor y sus nueve colas, Eclipse y su corona solar.' },
      { tag: 'NUEVO', text: 'GLOSARIO DEL MAR: botón «¿QUÉ ES ESTO?» en cada misión, y cada sistema se presenta la primera vez que lo usas. Todas las misiones dicen para qué sirven.' },
      { tag: 'NUEVO', text: 'SIMULACRO (Reino 40): tu flota repite sola la mejor etapa ganada cada 3 minutos, también mientras no estás.' },
      { tag: 'ARREGLO', text: 'Misiones que nunca se completaban: Banquete del Leviatán, Bandera Negra, Lo que guardan las ruinas (la Orquesta Muda ya despertó y te da a Sonata Prima) y el Simulacro.' },
      { tag: 'ARREGLO', text: 'El Duelo de Balsa ya no se esconde: MAPA › ENCARGOS, desde Reino 5 o el Jefe 1. Y los duelos ya no se ponen más fuertes que tu propio barco.' },
      { tag: 'NUEVO', text: 'El juego y su herramienta de arte, MAI SVG, son de código abierto (MIT). Hay guías para colaborar y un laboratorio para desarrolladores.' },
    ],
  },
  {
    id: '2026-10-07-capitulo-1-completo',
    date: '2026-10-07',
    title: 'Capítulo 1 completo',
    luzterna: 'Mientras dormías alguien arregló el universo. No fui yo. Yo solo leo los periódicos.',
    items: [
      { tag: 'ARREGLO', text: 'La historia de las zonas 4 a 6 ya está conectada: el Heraldo del Arcanista te entrega la MAGIA (con su hábitat), y vienen Raijin, la Grieta, el Barco del Vacío y la revancha del Patito.' },
      { tag: 'ARREGLO', text: 'Merlina ahora sí llega al vencer al Arcanista, con su animación. Si ya lo venciste, te llega sola en un momento tranquilo.' },
      { tag: 'NUEVO', text: 'El final del capítulo: la Marea Final (toda tu isla ×1000 por 3 minutos), NADIE y los créditos. Los créditos también están en Ajustes.' },
      { tag: 'CAMBIO', text: 'La probabilidad de victoria ahora simula la pelea con TU barco real y te dice por qué ganarías o perderías.' },
      { tag: 'BALANCE', text: 'Los Mamparos cuestan 1 punto de utilería y hay máximo 3 por barco (un barco lleno de hierro gratis era inhundible).' },
      { tag: 'NUEVO', text: 'Al apuntar ves el ángulo y la potencia, y un fantasma de tu tiro anterior.' },
      { tag: 'CAMBIO', text: 'Ronroneo: la mitad de lo que ganas va directo a tu reserva; las granjas automáticas ya no se lo comen.' },
      { tag: 'ARREGLO', text: 'El oro y los peces ya no titilan, la ruleta recuerda tu apuesta y la carga inicial es mucho más fluida.' },
      { tag: 'NUEVO', text: 'Se puede instalar como app (celular y compu), juega sin internet, sin bordes negros y con letras grandes en el celular.' },
      { tag: 'NUEVO', text: 'Tu partida ahora se respalda sola antes de cada actualización. Ajustes › RESPALDOS para copiarla o recuperarla.' },
    ],
  },
];

export const UPDATE_IDS = UPDATES.map((u) => u.id);
