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
