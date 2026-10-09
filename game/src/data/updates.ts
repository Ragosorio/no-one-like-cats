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
    id: '2026-10-12-eterno-sin-frenos',
    date: '2026-10-12',
    title: 'ETERNO sin frenos',
    luzterna: 'Madame Noir le quitó los frenos a la máquina. Y le puso más suerte. Y más fuego. Yo me voy a esconder detrás del faro.',
    items: [
      { tag: 'CAMBIO', text: 'MODO ETERNO dura 40 segundos y funciona en TODAS las mesas. Los primeros 20 s la máquina acelera (a tope a los 15 s) y todavía la puedes enfriar.' },
      { tag: 'NUEVO', text: 'Los últimos 20 s: SIN FRENOS. Todas las tiradas ganan, gratis, y van a tu BOTÍN, que se duplica cada 4 segundos (×2, ×4, ×8, ×16).' },
      { tag: 'NUEVO', text: 'Si ganas el 50/50: TODO lo tuyo ×2 (oro, gemas, pescaditos, boletos y fichas) + el botín + un gato especial. Mítico ahora 25%. Si pierdes: todo a 0, botín incluido.' },
      { tag: 'CAMBIO', text: 'Piloto automático: x1, x10 y x20 (antes x1, x2 y x10). Más tiradas, más lluvia de monedas.' },
    ],
  },
  {
    id: '2026-10-11-el-baul',
    date: '2026-10-11',
    title: 'El Baúl: tu isla ya no se pierde',
    luzterna: 'Alguien perdió su isla y lloró. No diré quién. Ahora hay un baúl con candado, copia por día y una carpeta en tu compu. De nada, Capi.',
    items: [
      { tag: 'NUEVO', text: 'Ajustes › RESPALDOS › ELEGIR CARPETA: el juego guarda tu isla como archivo .nocat en una carpeta tuya (la última + una por día). Borrar los datos del navegador no la toca.' },
      { tag: 'NUEVO', text: 'DESCARGAR .nocat y ABRIR .nocat: lleva tu isla a otra compu o guárdala donde quieras. Con la app instalada, doble clic en un .nocat abre el juego con esa isla.' },
      { tag: 'NUEVO', text: 'Historial de tu isla: una copia cada 10 minutos y al cerrar, cada una con su resumen (Reino, gatos, horas). La más jugada nunca se borra.' },
      { tag: 'ARREGLO', text: 'Si el juego está abierto en dos ventanas, solo una guarda. Y una ventana vieja ya no puede pisar una isla más nueva.' },
      { tag: 'ARREGLO', text: 'NUEVA PARTIDA en la portada ya no borra tu isla de un toque: te pregunta y guarda una copia antes.' },
    ],
  },
  {
    id: '2026-10-11-casino-eterno',
    date: '2026-10-11',
    title: 'El casino crece (y ahora puede explotar)',
    luzterna: 'Madame Noir compró seis mesas nuevas y una máquina que se calienta hasta reventar. Yo no la toco. Tú sabrás.',
    items: [
      { tag: 'NUEVO', text: 'Seis juegos nuevos: Plinko, Duelo de Dados contra Don Cubilete, Mayor o Menor, Bingo Exprés, Rasca y Gana y Cajas Misteriosas. Cada uno trae su tabla con la probabilidad exacta de todo.' },
      { tag: 'NUEVO', text: 'MODO ETERNO: 20 segundos de máquina acelerando hasta explotar. Volado 50/50 honesto: si ganas, un gato legendario, mítico u HOLO; si pierdes, tu oro, gemas, pescaditos, boletos y fichas quedan en 0. Tus gatos, barcos y progreso nunca se tocan. Te pide confirmación y la puedes enfriar antes.' },
      { tag: 'CAMBIO', text: 'Piloto automático: velocidades x1, x2 y x10. Ya no se detiene a las 25 tiradas ni al ganar: juega hasta que lo pares (los topes siguen ahí si los quieres).' },
      { tag: 'ARREGLO', text: 'Portal HOLO: el destacado legendario ya no sale disfrazado de épico (ahora cuenta para tu garantía de legendario). Los tiros de Alto Riesgo y Todo o Nada cuentan como 1 para la garantía de épico.' },
      { tag: 'ARREGLO', text: 'Las fichas que ganas en el casino ya no se pierden al pasar de 1,500. El tope solo aplica a las fichas que llegan por pelear.' },
    ],
  },
  {
    id: '2026-10-11-habitats-crecen',
    date: '2026-10-11',
    title: 'Hábitats que crecen',
    luzterna: 'Ahora cada hábitat huele a su elemento. El de fuego, literalmente. No lo toquen.',
    items: [
      { tag: 'NUEVO', text: 'Cada elemento tiene su propio hábitat: lava y basalto, ríos que brillan, monolitos de hielo con aurora, catedrales de luz, círculos de runas, selvas de sombra neón, relojes que giran… y se ve más imponente con cada tier.' },
      { tag: 'NUEVO', text: 'Al mejorar, el hábitat ocupa más terreno: 4×4 desde el tier 4 y 5×5 desde el tier 7. El terreno nuevo se reserva mientras dura la obra.' },
      { tag: 'NUEVO', text: '¿No cabe? El botón MOVER Y MEJORAR te propone el lugar libre más cercano y lo mejora ahí mismo.' },
      { tag: 'CAMBIO', text: 'Tus hábitats de tier alto crecieron donde había espacio; los que no tenían lugar alrededor siguen de su tamaño y producen igual. Muévelos a un sitio amplio para que crezcan.' },
      { tag: 'NUEVO', text: 'Al recolectar oro, el hábitat reacciona con un destello de su elemento.' },
    ],
  },
  {
    id: '2026-10-11-rendimiento',
    date: '2026-10-11',
    title: 'Más fluido',
    luzterna: 'El juego se estaba comiendo la memoria como Canelo se come el atún. Ya lo pusimos a dieta.',
    items: [
      { tag: 'ARREGLO', text: 'Cada batalla dejaba memoria ocupada para siempre: después de muchas peleas el juego se ponía lento. Ya no.' },
      { tag: 'ARREGLO', text: 'El Catdex abre al instante (las cartas van llegando) y, desde la segunda vez que juegas, tus gatos cargan sin trabar nada.' },
      { tag: 'ARREGLO', text: 'La ESTIMACIÓN de la pre-batalla se calcula en segundo plano: el panel ya no da tirones mientras simula.' },
    ],
  },
  {
    id: '2026-10-11-el-archivo',
    date: '2026-10-11',
    title: 'El Archivo Rasgado: el final',
    luzterna: 'Te prometí que te contaba por qué estoy muerta. Cierra las seis grietas y ven. Trae tus Fragmentos del Vacío. Y pañuelos.',
    items: [
      { tag: 'NUEVO', text: 'La historia principal ya tiene final. Cuando cierres las seis Grietas del Multiverso aparece «Lo que el Archivo olvidó»: la última batalla, contra Distraxia, en el Archivo Rasgado.' },
      { tag: 'NUEVO', text: 'Tus Fragmentos del Vacío por fin sirven para algo: cada uno debilita a Distraxia. Con los diez, la pelea es mucho más amable.' },
      { tag: 'NUEVO', text: 'Respuestas: quién le pidió a Distraxia borrar el Archivo, qué era NADIE y por qué Luzterna nunca soltó la linterna. Y créditos nuevos: EDICIÓN DEFINITIVA.' },
    ],
  },
  {
    id: '2026-10-11-pulido-gatos-y-pantallas',
    date: '2026-10-11',
    title: 'Encuentra a cualquier gato',
    luzterna: 'Tienes tantos gatos que ya ni sabías dónde vivían. Ahora sí. De nada.',
    items: [
      { tag: 'ARREGLO', text: 'Adiós a las franjas negras: diálogos, victorias, resonancias y revelaciones cubren tu pantalla completa, sea del tamaño que sea.' },
      { tag: 'ARREGLO', text: 'Alimentar a un gato actualiza al instante su nivel en el hábitat, el Catdex y su ficha. Ya no hay que salir y volver a entrar.' },
      { tag: 'NUEVO', text: 'Catdex: la ficha muestra a TU gato, dónde vive (hábitat y barco) y te lleva directo a VER GATO, HÁBITAT o ALTAR; al cerrar vuelves al Catdex. Además tiene buscador.' },
      { tag: 'NUEVO', text: 'Pre-batalla: VER TODOS abre a todos tus gatos con buscador, filtros por elemento, poder, ataques, en qué barco están y si tienen ▲ ventaja o ▼ desventaja contra ese enemigo. SUGERIR también lo toma en cuenta.' },
      { tag: 'NUEVO', text: 'Santuario: buscador y filtros, historial de CRUCES con favoritos ★, REPETIR con un toque y LLENAR para poner a resonar todas tus ranuras libres de una vez.' },
      { tag: 'ARREGLO', text: '«Rumores» era imposible (solo existían 2 pistas). Ahora, al sentar una pareja parecida a una receta secreta, el gato se asoma como RUMOR y te dice qué falta. Pixel Glitch ya se puede criar (Tormenta + Cósmico, ambos Nv25+).' },
      { tag: 'NUEVO', text: 'Las rutas «a la segura» de los gatos secretos ya existen: el 10.º callejero trae a Mochi Maneki, 40 especies traen a Lumen y ganar con Solar y Lunita trae a Eclipse.' },
      { tag: 'NUEVO', text: '¡VICTORIA! nueva: rayos de cómic, título que se estrella, el MVP de la pelea, tarjetas de K.O. y confeti. El primer toque la completa; el segundo continúa.' },
      { tag: 'ARREGLO', text: 'Más misiones con IR útil (Rumores, Podio, casino, microeventos, Reino) y avisos que ya no se apilan repetidos.' },
    ],
  },
  {
    id: '2026-10-11-podio-revanchas',
    date: '2026-10-11',
    title: 'El Podio: revanchas para todos',
    luzterna: 'Llegar tarde a la fiesta ya no es pretexto. Ese gato nuevo también puede humillar a Barón Cartón. Y lo va a disfrutar.',
    items: [
      { tag: 'NUEVO', text: 'Con las flechas junto a la escalera puedes volver a CUALQUIER liga pasada y retar de nuevo a sus rivales y campeones.' },
      { tag: 'NUEVO', text: 'Cada gato tiene su primera victoria contra cada rival: XP de Podio completa y orbes, aunque otro gato tuyo ya le haya ganado. Busca la etiqueta +XP o toca «IR AL PRIMERO».' },
      { tag: 'BALANCE', text: 'Los gatos que van atrás de tu mejor gato del Podio ganan hasta el doble de XP hasta alcanzarlo.' },
      { tag: 'CAMBIO', text: 'Si tu gato está en su tope, la XP de su primera victoria se guarda y entra sola cuando lo subas de nivel o de estrella en la isla.' },
      { tag: 'BALANCE', text: 'Las revanchas de ligas viejas pagan menos oro cuanto más atrás estén. Los gatos de premio, las gemas de campeón y el ascenso siguen siendo una sola vez.' },
    ],
  },
  {
    id: '2026-10-10-fragmentos',
    date: '2026-10-10',
    title: 'Fragmentos del Vacío',
    luzterna: 'Unos jefes se quedaron con algo tuyo. Ya hablé con ellos. Bueno, les grité. Ya te lo mandaron.',
    items: [
      { tag: 'ARREGLO', text: 'Si venciste al Arcanista, a la Estrella Errante o al Primer Mar antes de que existieran los Fragmentos del Vacío, nunca te dieron los suyos y la misión «Fragmentos» era imposible. Ya te llegaron.' },
      { tag: 'NUEVO', text: 'El botón IR de «Fragmentos» abre la lista de los 10: de dónde sale cada uno, cuáles ya tienes y un IR directo al siguiente.' },
      { tag: 'ARREGLO', text: '«Continuará»: su botón IR ahora reproduce el final del capítulo en ese momento (y con él se abren las Grietas del Multiverso).' },
      { tag: 'ARREGLO', text: 'Más misiones con un IR que sí te lleva: crías y rarezas al Santuario, barcos y escudos al Astillero, Heroicos y Divinos al Podio, rangos y reacciones al mapa.' },
    ],
  },
  {
    id: '2026-10-09-cataclismos',
    date: '2026-10-09',
    title: 'Cataclismos',
    luzterna: 'El cielo se enteró de que tienes un barco gigante. Y se lo tomó personal.',
    items: [
      { tag: 'NUEVO', text: 'CATACLISMOS: las zonas 4 a 6, sus jefes y las Grietas tienen poder propio: LLUVIA DE METEORITOS, LA LUNA BAJA, EL SOL BAJA y MAREA NEGRA. Te avisan un turno antes: pasa un tiro de gato por su SELLO para debilitarlo (dos lo cancelan).' },
      { tag: 'BALANCE', text: 'Entre más grande tu barco, más le cae del cielo. Un Gorrión casi ni lo siente; un Bastión recibe el cielo completo.' },
      { tag: 'CAMBIO', text: 'El Bastión es el mismo barco, pero ahora pelea con ×0.9 de su Poder (PODER DE COMBATE en la pre-batalla): su casco gigante, sus 5 cañones y sus burbujas ya peleaban solos. La estimación lo toma en cuenta.' },
    ],
  },
  {
    id: '2026-10-09-estimacion-honesta',
    date: '2026-10-09',
    title: 'La estimación no miente',
    luzterna: 'Antes el periódico decía "vas a perder" y ganabas. Despedimos al periodista. Ahora la batalla y la predicción son literalmente la misma pelea.',
    items: [
      { tag: 'ARREGLO', text: 'La batalla en pantalla es exactamente la simulación de la ESTIMACIÓN: misma semilla, mismas decisiones. Y tras fallar el tiro de tu gato, tus cañones ya no apuntan a tu propio barco.' },
      { tag: 'CAMBIO', text: 'La ESTIMACIÓN simula hasta 40 peleas sin trabar el panel, y en ¿POR QUÉ? te dice qué supone de tu puntería, cuánto pesa la diferencia de Poder y su margen de error.' },
      { tag: 'BALANCE', text: 'Ir muy por debajo del Poder rival ahora sí se nota (antes, ser mucho más débil casi no importaba). La estimación te lo avisa antes de zarpar.' },
      { tag: 'ARREGLO', text: 'Rayos, orbes y ráfagas se apuntan rasantes: adiós al muro del Leviatán para tripulaciones chicas.' },
      { tag: 'ARREGLO', text: 'Duelos de balsa justos: las balsas están más cerca, caer al agua te saca del duelo, los rivales se ajustan a tu tripulación y la Orquesta Muda pelea 3 contra 3 de verdad.' },
    ],
  },
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
