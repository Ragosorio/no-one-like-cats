/**
 * GLOSARIO DEL MAR (data) — one entry per thing the game asks you to do or names in a mission.
 * Each entry answers QUÉ ES / PARA QUÉ SIRVE / CÓMO SE USA (+ DÓNDE), in Luzterna's world but plainly.
 * Read by: ui/story/glossary.ts (the panel + "¿QUÉ ES ESTO?" on mission cards) and the
 * first-appearance beats in ui/story/features.ts (each beat points at its entry).
 *
 * Rules for writing entries: verify the mechanic in code before writing a number; prefer the rule over
 * the exact figure (balance changes, the rule doesn't); element badges as {fire} tokens, never emojis;
 * text goes through the tone filter (ui/story/text.ts › clean) and {name}/{g:…} tokens (ui/gender.ts).
 */
import type { MissionDef } from './content';
import { G } from '../state/game';

export type GlossGroup = 'isla' | 'gatos' | 'barco' | 'mar' | 'reino';

export interface GlossEntry {
  id: string;
  term: string;
  group: GlossGroup;
  what: string;
  why: string;
  how: string;
  where?: string;
  /** one Luzterna line (shown in italics) */
  quip?: string;
  /** shown as "???" until true (never spoil a boss/element the player hasn't met) */
  gate?: { boss?: number; kl?: number; element?: string; flag?: string };
}

export const GLOSS_GROUPS: { id: GlossGroup; name: string }[] = [
  { id: 'isla', name: 'TU ISLA' },
  { id: 'gatos', name: 'TUS GATOS' },
  { id: 'barco', name: 'TU BARCO' },
  { id: 'mar', name: 'EL MAR (CAMPAÑA)' },
  { id: 'reino', name: 'REINO Y AUTOMÁTICOS' },
];

export const GLOSSARY: GlossEntry[] = [
  // ------------------------------------------------------------------ TU ISLA
  {
    id: 'doblones',
    term: 'Doblones (oro)',
    group: 'isla',
    what: 'La moneda principal. Tus gatos la producen solos, nomás por vivir en un hábitat. También cae al ganar batallas y misiones.',
    why: 'Con oro construyes y mejoras hábitats, siembras en el Muelle, compras terreno (expansiones) y mejoras el barco. Casi todo cuesta oro.',
    how: 'Toca las monedas que salen sobre cada hábitat para recogerlas. Si un hábitat dice ¡LLENO!, lo que produzca de más se pierde: pásate seguido (o espera al Banco del Reino).',
    where: 'Isla › hábitats · contador de arriba a la derecha',
    quip: 'Producen dinero nomás por existir. Ojalá yo.',
  },
  {
    id: 'habitat',
    term: 'Hábitats',
    group: 'isla',
    what: 'Las casas de tus gatos. Cada hábitat es de un elemento y solo aceptan gatos de ese elemento ({fire} con {fire}, {water} con {water}…). Empiezan como Caja de Cartón y se mejoran por tiers.',
    why: 'Un gato SIN CASA no produce nada. Un gato con casa produce oro (y algunos, pescaditos). Mejorar el hábitat multiplica lo que producen, les da más lugar y agranda el búfer antes de ¡LLENO!.',
    how: 'Toca una parcela vacía (CONSTRUIR) y elige el elemento. Toca un hábitat construido para recolectar, mudar gatos o MEJORAR. Construir ocupa a un constructor un ratito (reloj verde).',
    where: 'Isla › parcelas · panel «Sin casa» si un gato se queda afuera',
    quip: 'Un gato sin casa no produce. Y se queja. Y te mira feo.',
  },
  {
    id: 'pescaditos',
    term: 'Pescaditos (comida)',
    group: 'isla',
    what: 'La comida de tus gatos. Sale del Muelle de Pesca (siembras peces y cosechas) y de los gatos PESCADORES, que juntan un montoncito de pesca en su hábitat.',
    why: 'Solo sirve para una cosa, pero es la más importante: ALIMENTAR. Cada nivel que sube un gato le da más oro por segundo y más poder en batalla.',
    how: 'Siembra en el Muelle, espera y cosecha. Luego abre a un gato y dale ¡ÑAM! (4 mordidas = 1 nivel).',
    where: 'Isla › Muelle de Pesca · panel de cada gato',
  },
  {
    id: 'muelle',
    term: 'Muelle de Pesca',
    group: 'isla',
    what: 'Tus «granjas»: parcelas de agua donde siembras peces. Cada receta cuesta un poco de oro, tarda un tiempo y da pescaditos. Las recetas nuevas llegan con el Reino.',
    why: 'Es la fuente grande de comida. Lo corto rinde si estás jugando; lo largo, si te vas un rato. Mejorar una parcela le sube lo que rinde.',
    how: 'Toca un corral del muelle › SEMBRAR › elige el pez. Cuando diga ¡LISTO!, tócalo para cosechar (¡SPLASH!).',
    where: 'Isla › corrales de agua junto al muelle',
    quip: 'Esperas o sigues jugando. Esa es la regla de este mar.',
  },
  {
    id: 'repetir_receta',
    term: 'Repetir receta (siembra automática)',
    group: 'isla',
    what: 'Un interruptor por parcela: al cosechar, la parcela vuelve a sembrar la misma receta sola (si te alcanza el oro).',
    why: 'Aparece en Reino 9 porque ya sembraste a mano un montón de veces. Ya aprendiste: ahora el muelle trabaja en piloto automático y tú te ocupas de cosas más interesantes.',
    how: 'Muelle de Pesca › en cada parcela, activa REPETIR RECETA. Si te quedas sin oro, simplemente no resiembra (no pasa nada malo).',
    where: 'Muelle de Pesca › parcela',
    gate: { kl: 9 },
  },
  {
    id: 'silo',
    term: 'Mar de Pescados Automático (Silo)',
    group: 'isla',
    what: 'Las cosechas listas (y la pesca de tus gatos pescadores) se guardan solas en el Silo: la comida entra sin que toques nada.',
    why: 'Junto con Repetir receta, el muelle queda 100% solo. Es el premio por haber llegado lejos: ya no tienes que vigilar peces.',
    how: 'Viene encendido. Si extrañas cosechar a mano, se apaga en el letrero de arriba del Muelle de Pesca.',
    where: 'Muelle de Pesca › letrero de arriba',
    gate: { kl: 21 },
  },
  {
    id: 'recolectar_todo',
    term: 'Recolectar todo',
    group: 'isla',
    what: 'Un botón que junta el oro y la pesca de TODOS tus hábitats de un jalón.',
    why: 'Ya demostraste que sabes tocar monedas. Tus dedos merecen descanso.',
    how: 'Botón amarillo RECOLECTAR TODO, abajo a la izquierda en la isla.',
    where: 'Isla › abajo a la izquierda',
    gate: { kl: 3 },
  },
  {
    id: 'banco',
    term: 'Banco del Reino',
    group: 'isla',
    what: 'Un edificio que deposita solo el oro de todos tus hábitats directo a tu cartera, aunque estén LLENOS. Y sigue depositando un rato mientras no juegas.',
    why: 'Se acaba el «se me llenó y perdí oro». Tu isla gana dinero aunque no la estés mirando.',
    how: 'No hay que hacer nada: abre en Reino 15 y funciona solo. Tócalo para ver cuánto ha depositado.',
    where: 'Isla › edificio BANCO DEL REINO',
    gate: { kl: 15 },
  },
  {
    id: 'ronroneo',
    term: 'Ronroneo (reloj verde)',
    group: 'isla',
    what: 'Minutos de «adelantar el tiempo» que ganas JUGANDO: al ganar (o perder) batallas, cumplir misiones, descubrir gatos, subir de Reino. Solo funciona en relojes VERDES.',
    why: 'Es la forma de no esperar. La mitad de cada Ronroneo adelanta sola el reloj verde que fijaste con la chincheta (o el que esté por terminar); la otra mitad se guarda en tu reserva para usarla donde quieras.',
    how: 'En la columna de relojes (derecha): la chincheta fija el reloj al que quieres mandar el Ronroneo, y el botón RONRONEAR gasta tu reserva en ese reloj. También hay botones RONRONEAR en el Santuario, el Astillero y las obras.',
    where: 'Columna de relojes (derecha) · botones RONRONEAR',
    quip: 'El tiempo se dobla a tu favor si haces algo útil mientras.',
  },
  {
    id: 'relojes',
    term: 'Relojes verdes y rojos',
    group: 'isla',
    what: 'VERDE = algo que tarda (obras, cultivos, Resonancia, astillero, expediciones). No hay prisa y el Ronroneo lo acelera. ROJO = una oportunidad que se va (microeventos y eventos): no se puede acelerar ni alargar.',
    why: 'Para que sepas de un vistazo qué puede esperar y qué no.',
    how: 'Verde: déjalo correr y sigue jugando. Rojo: si te interesa, ve ya. Si lo ignoras no pierdes nada.',
  },
  {
    id: 'microeventos',
    term: 'Microeventos',
    group: 'isla',
    what: 'Cositas que pasan solas en tu isla con un reloj rojo chiquito: un pez dorado, un gato callejero, un cangrejo con chatarra, una lluvia de pescaditos, una burbuja de Resonancia.',
    why: 'Premios rápidos (comida, orbes, chatarra, Ronroneo) por estar atento. Ignorarlos no tiene castigo.',
    how: 'Cuando veas el letrero en la esquina, busca la cosa en la isla y tócala antes de que se acabe el reloj rojo.',
    where: 'Isla (aparecen solos de vez en cuando)',
    gate: { kl: 3 },
  },
  {
    id: 'expansiones',
    term: 'Expansiones (terreno)',
    group: 'isla',
    what: 'Las islas cubiertas de nubes alrededor de la tuya. Se compran con oro cuando tu Reino llega al nivel que piden y luego hay que limpiarlas (reloj verde, ocupa un constructor).',
    why: 'Cada una abre algo: más parcelas para hábitats y peces, un constructor extra, ranuras de Resonancia, el Puerto de expediciones… y un SECRETO.',
    how: 'Toca el letrero con precio sobre la nube › COMPRAR. Cuando termine de limpiarse, busca su secreto (a veces es tocar algo, a veces un gato de cierto elemento, a veces pelear).',
    where: 'Isla › letreros con precio sobre las nubes',
    gate: { kl: 3 },
  },
  {
    id: 'constructores',
    term: 'Constructores',
    group: 'isla',
    what: 'Gatitos con casco que hacen las obras. Cada obra (construir, mejorar, limpiar terreno) ocupa a uno mientras dure.',
    why: 'Si todos están ocupados, la siguiente obra tiene que esperar. Por eso conviene acelerar obras con Ronroneo.',
    how: 'Empiezas con uno. El Acantilado Rocoso trae otro y la Tienda vende un Constructor Extra con gemas.',
  },
  {
    id: 'oficios',
    term: 'Oficios (gatos trabajadores)',
    group: 'isla',
    what: 'Cada especie sabe UN oficio: Banquero (más oro en su hábitat), Granjero (más comida), Constructor (obras más rápidas) o Viajero (mejor botín en expediciones).',
    why: 'Convierte a gatos que no usas en batalla en una mejora de la isla. Ojo: el que trabaja NO se sube al barco.',
    how: 'Botón OFICIOS › elige gatos para cada oficio. Puedes cambiarlos cuando quieras.',
    where: 'Isla › botón OFICIOS',
    gate: { kl: 24 },
  },
  {
    id: 'expediciones',
    term: 'Expediciones (Puerto de las Mareas)',
    group: 'isla',
    what: 'Mandas 1 o 2 gatos a una zona del mapa por 15 min, 1 h o 4 h, y regresan con chatarra, cristales, orbes y a veces planos.',
    why: 'Es el canal de materiales de barco mientras haces otra cosa (o mientras duermes). Usa gatos que no estén en tu barco.',
    how: 'Puerto de las Mareas › elige destino, duración y gatos › ZARPAR. Cuando vuelvan, recoge el botín.',
    where: 'Isla › expansión Puerto de las Mareas',
    gate: { flag: 'expedition_open' },
  },
  {
    id: 'tienda',
    term: 'Tienda y decoración',
    group: 'isla',
    what: 'Todo se paga jugando: hábitats y edificios, orbes, gatos comunes que te falten, cofres y decoraciones para tu isla. Cero dinero real.',
    why: 'Para atajos cuando los quieras: un constructor extra, una ranura más de Resonancia, orbes para una estrella. Las decoraciones dan XP de Reino la primera vez y un pequeño bono si completas su set.',
    how: 'Botón TIENDA › pestañas arriba. Las decoraciones se colocan en tu isla.',
    where: 'Isla › botón TIENDA',
  },
  {
    id: 'gemas',
    term: 'Ojos de Gato (gemas)',
    group: 'isla',
    what: 'La moneda escasa. Sale de jugar contenido: gatos nuevos en el Catdex, jefes, secretos, hitos de Reino y algunas misiones.',
    why: 'Comodidades: constructor extra, ranura de Resonancia, reloj de arena grande, Orbes Prisma, decoraciones especiales, cofres.',
    how: 'Se gastan en la Tienda (y en el Altar para Prisma). No se compran con dinero real.',
    where: 'Contador de arriba',
  },
  {
    id: 'momentum',
    term: 'Racha (Momentum)',
    group: 'isla',
    what: 'La llamita junto al Reino. Sube cuando juegas activo (sobre todo al ganar batallas) y se enfría poco a poco si te vas.',
    why: 'Mientras está alta, tus hábitats producen más, los cultivos van más rápido, ganas más Ronroneo y el botín de batalla crece.',
    how: 'Encadena victorias y cosechas. No hay que hacer nada más.',
    where: 'Arriba a la izquierda (llama)',
  },
  {
    id: 'cristales',
    term: 'Chatarra, Cristales y Planos',
    group: 'isla',
    what: 'Materiales de barco. Chatarra y Cristales (uno por elemento) salen de PELEAR y de las expediciones. Los Planos salen de jefes y expediciones.',
    why: 'Mejorar el barco (Mk) en el Astillero cuesta chatarra y cristales. Los hábitats grandes (tier 5+) también piden cristales de su elemento.',
    how: 'Gana batallas (también repetir etapas ya ganadas sirve) o manda expediciones.',
    where: 'Astillero › MK · hábitats tier 5+',
  },

  // ------------------------------------------------------------------ TUS GATOS
  {
    id: 'nivel',
    term: 'Nivel y ¡ÑAM!',
    group: 'gatos',
    what: 'Cada gato tiene nivel. Sube alimentándolo con pescaditos: 4 mordidas (¡ÑAM!) = 1 nivel. El tope de nivel es tu Reino + 5.',
    why: 'Más nivel = más oro por segundo y más poder. Y en ciertos niveles (10, 20…) su disparo CAMBIA: no es «+27 de ataque», es «ahora su bola de pelo explota».',
    how: 'Toca a un gato › mantén ¡ÑAM!. Si llegó al tope, sube tu Reino. En Reino 6 aparece «Alimentar hasta Nv X».',
    where: 'Panel del gato (toca a cualquier gato en la isla)',
  },
  {
    id: 'elementos',
    term: 'Elementos y ventajas',
    group: 'gatos',
    what: 'Cada gato es de uno o dos elementos. En batalla se ganan en ciclo: {fire} Fuego > {nature} Naturaleza > {earth} Tierra > {storm} Tormenta > {water} Agua > {fire} Fuego. {magic} Magia y {cosmic} Cósmico se pegan fuerte entre sí.',
    why: 'Un tiro con ventaja hace ×1.5; al revés, ×0.75. Además, mezclar elementos provoca REACCIONES (Vapor, Conducción…). Los elementos nuevos llegan derrotando jefes.',
    how: 'Antes de pelear mira el elemento del enemigo y lleva gatos que le ganen. El Catdex › GRIMORIO lista las reacciones que ya descubriste.',
  },
  {
    id: 'rareza',
    term: 'Rarezas',
    group: 'gatos',
    what: 'COMÚN, RARO, ÉPICO, LEGENDARIO (los Primordiales, padres de cada elemento) y MÍTICO. Más arriba: HEROICO (premios del Podio) y DIVINO (los rotos).',
    why: 'Más rareza = más poder y oro base, pero también comen más y piden más orbes por estrella.',
    how: 'Los gatos nuevos salen de la Resonancia, de jefes, eventos, secretos y la Tienda. Heroicos y Divinos solo los pagan los campeones de las ligas del Vacío del Podio.',
  },
  {
    id: 'heroicos',
    term: 'Heroicos',
    group: 'gatos',
    what: 'Los guerreros del Podio: Capitana Zarpa, Gran Bigote, Valquiria y Nekomante. Marco carmesí con laureles. Pegan un poco más que un Mítico y su ulti hace algo que ningún otro gato hace.',
    why: 'Su ulti cambia la pelea: un tajo a TODOS los gatos rivales, un terremoto en la quilla, una lanza que electrocuta una columna entera, un grimorio que roba barras. Los rivales que los traen hacen exactamente lo mismo.',
    how: 'Gánale por primera vez al campeón de la LIGA DEL VACÍO (liga 8), VACÍO II, III y IV: cada uno paga uno. No salen de la Resonancia ni del casino. Sus estrellas suben con los orbes que gana peleando en el Podio (y con Prisma).',
    where: 'Isla › PODIO',
    quip: 'No se compran. No se invocan. Se le ganan a alguien que no quería soltarlos.',
    gate: { flag: 'podio_league_6' },
  },
  {
    id: 'divinos',
    term: 'Divinos',
    group: 'gatos',
    what: 'Los rotos: Big Bang, Mil Vidas, Sol Caído y Horizonte de Eventos. Marco de nácar con halo. Su ulti es el fin del mundo en forma de gato, una vez por batalla.',
    why: 'Big Bang revienta la mitad del barco, Mil Vidas da siete cortes a cada gato rival, Sol Caído hace caer el sol y Horizonte abre un agujero negro que se traga barco y tiros por 3 turnos. Hasta ellos tienen tope: contra jefes, 15%.',
    how: 'Gánale por primera vez al campeón de la LIGA DEL VACÍO V (liga 12), VI, VII y VIII: cada uno paga uno, y pelea CON ese gato. Es lo más difícil del mar.',
    where: 'Isla › PODIO',
    quip: 'Si te toca uno del otro lado, no es mala suerte. Es teología.',
    gate: { flag: 'podio_league_10' },
  },
  {
    id: 'resonancia',
    term: 'Resonancia (Santuario)',
    group: 'gatos',
    what: 'Juntas a dos gatos en el Santuario; ronronean en la misma frecuencia, abren una gatera y «llaman» a un gato de otro mundo. Lo que puede salir depende de los elementos de los padres (y de su nivel).',
    why: 'Es la forma principal de conseguir gatos nuevos. Si sale uno que ya tenías, no se pierde: se vuelve Orbes de Alma de esa especie.',
    how: 'Santuario › elige dos gatos (la tabla te dice qué puede salir y con qué probabilidad) › ¡A RESONAR!. Tarda según la rareza; el Ronroneo lo acelera.',
    where: 'Isla › Santuario de Resonancia',
    quip: 'Es sagrado. Y privado. Muy privado.',
  },
  {
    id: 'orbes',
    term: 'Orbes de Alma',
    group: 'gatos',
    what: 'Pedacitos de alma de UNA especie. Salen de duplicados (Resonancia, cofres), de algunas victorias, de jefes, misiones, expediciones y microeventos.',
    why: 'Se gastan en el Altar de Almas para subirle ESTRELLAS a esa especie. Un duplicado nunca es inútil.',
    how: 'Se juntan solos. Míralos en el panel del gato o en el Altar.',
    where: 'Panel del gato · Altar de Almas',
  },
  {
    id: 'estrellas',
    term: 'Estrellas (★2 a ★6)',
    group: 'gatos',
    what: 'El RANGO de un gato, aparte de su nivel. Todos empiezan en ★1. Subir una estrella cuesta Orbes de Alma de su misma especie y pide un nivel mínimo (★2 pide Nv10, ★3 Nv20, ★4 Nv30…).',
    why: '★2: +25% de poder y oro. ★3: su ataque gana un EFECTO SECUNDARIO. ★4: ataque nuevo. ★5: maestría. ★6: forma ascendida. Es como mejorar a un gato que ya quieres en vez de buscar otro.',
    how: 'Altar de Almas › elige al gato › SUBIR ★. Si te faltan orbes, el Orbe Prisma cubre lo que falte.',
    where: 'Isla › Altar de Almas (o el botón ALTAR del panel del gato)',
    quip: '¡TUNK! Sello de goma. Más fuerte.',
    gate: { flag: 'altar_almas' },
  },
  {
    id: 'prisma',
    term: 'Orbe Prisma',
    group: 'gatos',
    what: 'Un orbe comodín: 1 Prisma vale por 1 Orbe de Alma de CUALQUIER especie.',
    why: 'Para terminar una estrella cuando te faltan poquitos orbes de ese gato.',
    how: 'Se gana completando sets del Catdex y Encargos; también se compra con gemas (cantidad limitada por jefe). El Altar lo usa solo si lo dejas activado.',
    where: 'Altar de Almas',
  },
  {
    id: 'rasgos',
    term: 'Rasgos',
    group: 'gatos',
    what: 'La personalidad de cada gato (Impaciente, Dormilón, Perezoso…). Algunos cambian cómo pelea: por ejemplo Dormilón empieza con la ultimate medio cargada.',
    why: 'Dos gatos de la misma especie pueden pelear distinto. Desde Reino 30 (Herencia), un hijo puede heredar el rasgo de un padre.',
    how: 'Míralo en el panel del gato. Si quieres un rasgo, cría con padres que lo tengan.',
  },
  {
    id: 'mutaciones',
    term: 'Mutaciones',
    group: 'gatos',
    what: 'Desde Reino 20, cada Resonancia tiene una probabilidad chica de sacar un gato MUTANTE (Conductividad, Gigantismo, Fosilizado…).',
    why: 'Una mutación es un extra permanente. La probabilidad sube si los dos padres viven en el mismo hábitat, y un hábitat de cierto elemento empuja su mutación.',
    how: 'Cría, cría, cría. Si sale un duplicado con mutación, eliges: orbes o pasarle la mutación a tu mejor gato de esa especie.',
    gate: { kl: 20 },
  },
  {
    id: 'catdex',
    term: 'Catdex',
    group: 'gatos',
    what: 'El registro de los gatos del Primer Mar. Cada especie nueva que consigues queda registrada.',
    why: 'Cada especie registrada te da gemas, Ronroneo, XP de Reino y +2% de oro para TODA la isla. Las siluetas te dicen qué te falta; los «rumores», cómo podrías conseguirlo.',
    how: 'Botón CATDEX. Toca una ficha para ver de dónde sale.',
    where: 'Isla › botón CATDEX',
    gate: { flag: 'catdex' },
  },
  {
    id: 'sets',
    term: 'Sets del Catdex',
    group: 'gatos',
    what: 'Grupos de gatos con algo en común (por ejemplo «Piedra Viva»). Registrar a todos los de un set lo completa.',
    why: 'Completar un set da 10 Orbes Prisma y 5 minutos de Ronroneo, y además una regla nueva para tus batallas.',
    how: 'Catdex › pestaña SETS: ves cuáles te faltan de cada set.',
    where: 'Catdex › SETS',
    gate: { flag: 'catdex' },
  },
  {
    id: 'rangos',
    term: 'Rangos K.O. (Bronce, Plata, Oro)',
    group: 'gatos',
    what: 'Cada gato cuenta sus K.O.: módulos enemigos que destruye y gatos enemigos que noquea. Cuentan aunque pierdas.',
    why: 'Cada rango nuevo le da orbes de su especie y un pelín más de daño (hasta +10% en Oro III).',
    how: 'Pelea con él. Su rango se ve en su panel.',
    where: 'Panel del gato',
  },
  {
    id: 'secretos',
    term: 'Gatos ??? y rumores',
    group: 'gatos',
    what: 'Gatos que no salen en ningún manual. En el Catdex aparecen como ARCHIVO SELLADO con una pista. Un «rumor» es un gato del que ya oíste hablar.',
    why: 'Son de los más fuertes y raros. Cada uno pide una combinación especial (padres, niveles, estrellas, oficios…).',
    how: 'Lee las pistas del Catdex y prueba combinaciones en la Resonancia. Los secretos de las expansiones también dan rumores.',
    where: 'Catdex › filtro SECRETO',
  },

  // ------------------------------------------------------------------ TU BARCO
  {
    id: 'astillero',
    term: 'Astillero',
    group: 'barco',
    what: 'Donde se arma tu barco: mejoras (Mk), armas, equipo, tu flota y la tripulación de cada barco.',
    why: 'Tus gatos ponen la puntería; el barco pone el aguante y la artillería. Un gato fuerte en una balsa de cartón dura poco.',
    how: 'Botón ASTILLERO (o el PUERTO de tu isla). Arriba eliges barco; abajo, pestañas MEJORAS / ARMAS / EQUIPO; EDITAR PLANO mueve módulos y PROBAR te deja dispararle a un muñeco.',
    where: 'Isla › botón ASTILLERO',
  },
  {
    id: 'mk',
    term: 'Mk (mejoras del barco)',
    group: 'barco',
    what: 'El nivel de cada familia de piezas: Casco, Armas, Motor, Escudos y Núcleo, de Mk I a Mk VII. Sirven a TODA tu flota, no a un solo barco.',
    why: 'Casco = más vida por celda (de madera a hierro a cristal). Armas = la andanada hace más daño y dispersa menos. Todo sube el PODER DE BARCO, que es lo que compara el mapa contra el enemigo.',
    how: 'Astillero › MEJORAS. Cuesta oro, chatarra (y más arriba planos y cristales) y tarda un rato (reloj verde). El tope es: jefes derrotados + 2 (Mk III pide vencer al Jefe 1).',
    where: 'Astillero › MEJORAS',
  },
  {
    id: 'poder',
    term: 'Poder de Barco',
    group: 'barco',
    what: 'Un número que resume tu barco: sus módulos (según el Mk) más la fuerza de los gatos que van a bordo, por el multiplicador del barco.',
    why: 'El mapa lo compara con el poder enemigo para darte la ESTIMACIÓN de victoria. No decide la pelea (tu puntería sí), pero dice si vas parejo.',
    how: 'Súbelo con Mk, con gatos de más nivel/estrellas y llenando todos los camarotes.',
    where: 'Astillero (arriba) · tarjeta de cada etapa',
  },
  {
    id: 'barcos',
    term: 'Barcos (tu flota)',
    group: 'barco',
    what: 'Balsa (3 gatos) → Gorrión (4, dispara doble el primer turno) → Merodeador (5) → Bastión (7, escudos, bueno contra jefes) → Bajel Arcano (6, fuerte en las zonas del fondo).',
    why: 'Barco más grande = más camarotes, más cañones y multiplicador de poder. Y algunos Encargos solo dejan entrar cierto tipo de barco.',
    how: 'Astillero › FLOTA: compra y elige el barco activo. Los Mk se comparten, así que un barco nuevo no empieza de cero.',
    where: 'Astillero › FLOTA',
  },
  {
    id: 'tripulacion',
    term: 'Tripulación (camarotes)',
    group: 'barco',
    what: 'Cada barco tiene camarotes; en cada uno va un gato. En batalla, cada gato dispara desde su camarote.',
    why: 'Camarote vacío = un tiro menos y menos poder. Y si te rompen un camarote, ese gato queda EXPUESTO (recibe más daño).',
    how: 'Astillero o Pre-batalla › toca un camarote y luego un gato (o SUGERIR). Gatos de expedición o con oficio no pueden subir.',
  },
  {
    id: 'editor',
    term: 'Editor de plano',
    group: 'barco',
    what: 'El plano de tu barco en cuadritos. Puedes mover módulos y camarotes y agregar utilería (mástil, santabárbara, bombas, mamparos…).',
    why: 'Dónde pones las cosas importa: un camarote escondido detrás del casco aguanta más; la santabárbara da +25% a tus cañones pero explota si te la pegan.',
    how: 'Astillero › EDITAR PLANO. Todo tiene que tocar la quilla (la fila de abajo). GUARDAR Y PROBAR te manda a dispararle al muñeco sin riesgo.',
    where: 'Astillero › EDITAR PLANO',
  },
  {
    id: 'modulos',
    term: 'Módulos y santabárbara',
    group: 'barco',
    what: 'Las piezas del barco: Núcleo (el corazón), cañones, camarotes, motor, escudos y utilería. La santabárbara es el barril de pólvora.',
    why: 'Destruir el NÚCLEO enemigo gana la batalla. Romper lo que sostiene algo hace que se caiga todo lo de arriba. Y una santabárbara enemiga explota y daña su propio barco.',
    how: 'Apunta a lo que quieras quitarle. Si hay un muro enfrente, tira bombeado por arriba.',
  },
  {
    id: 'armas',
    term: 'Armas (andanada)',
    group: 'barco',
    what: 'Tus cañones disparan SOLOS al final de cada turno, al lugar donde pegó tu gato: eso es la andanada. Cada ranura de cañón puede llevar otra arma (Bobina Tesla, Mortero de Magma, Lanzaescarcha…).',
    why: 'Cambiar de arma no sube el poder: cambia la TÁCTICA. La Tesla con un gato de rayo a bordo, el mortero por encima de los muros, la escarcha para mojar todo.',
    how: 'Astillero › ARMAS: elige ranura y luego arma. Las armas nuevas salen de jefes y secretos.',
    where: 'Astillero › ARMAS',
  },
  {
    id: 'escudos',
    term: 'Escudos',
    group: 'barco',
    what: 'El Escudo Burbuja anula UN impacto completo por turno y se recarga en tu turno (¡CLANK!). Necesita módulos de escudo, así que solo lo usan barcos como el Bastión.',
    why: 'Llegan con el Jefe 3. A partir de ahí los enemigos también los traen: rompe el generador o pégale dos veces.',
    how: 'Astillero › EQUIPO y la familia Escudos en MEJORAS.',
    gate: { boss: 3 },
  },
  {
    id: 'batalla',
    term: 'Batalla (cómo se pelea)',
    group: 'barco',
    what: 'Por turnos. En tu turno eliges UN gato, arrastras para apuntar y sueltas para disparar. Luego tus cañones disparan solos. Después dispara el enemigo.',
    why: 'Ganas si destruyes el Núcleo enemigo, si noqueas a todos sus gatos o si lo hundes. Aunque pierdas, te llevas una parte del botín y tus gatos suman K.O.',
    how: 'Arrastra desde el gato, mira la línea de tiro y suelta. 1–7 cambia de gato. El elemento importa: busca la ventaja.',
    where: 'Mapa › etapa › ¡ZARPAR!',
  },
  {
    id: 'ultimate',
    term: 'Ultimate',
    group: 'barco',
    what: 'El ataque especial de cada gato. Su medidor se llena disparando y recibiendo golpes.',
    why: 'Pega muchísimo más fuerte que un tiro normal y cada gato hace algo distinto. Pantalla negra, viñetas, grito.',
    how: 'Cuando la carta del gato diga ULTIMATE LISTA, toca su botón ULT. La Sala de Invocación de tu barco ayuda a cargarla; si te la rompen, no hay ultimates.',
  },
  {
    id: 'hundir',
    term: 'Hundir (inundación)',
    group: 'barco',
    what: 'Si rompes celdas DEBAJO de la línea de agua con agua o tierra, abres una BRECHA y el barco empieza a llenarse de agua cada turno.',
    why: 'Un barco inundado al 100% se hunde aunque tenga el núcleo intacto. A veces es más fácil ahogarlo que romperlo.',
    how: 'Apunta bajito, al casco que toca el agua. Las Bombas de Achique de tu propio barco frenan la inundación.',
  },
  {
    id: 'reacciones',
    term: 'Reacciones elementales',
    group: 'barco',
    what: 'Mezclas de elementos en el barco enemigo: Mojado + rayo = CONDUCCIÓN; fuego + mojado = VAPOR; agua + congelado + golpe = ESTALLIDO; naturaleza + mojado = FLORECER…',
    why: 'Hacen daño extra o efectos (congelar, enraizar, aturdir). Un barco variado descubre más.',
    how: 'Prepara con un gato (mojar, quemar) y remata con otro. Cada reacción nueva se anota en Catdex › GRIMORIO.',
    where: 'Catdex › GRIMORIO',
  },

  // ------------------------------------------------------------------ EL MAR
  {
    id: 'mapa',
    term: 'Carta Náutica (el mapa)',
    group: 'mar',
    what: 'Seis zonas, cada una con 9 etapas: 8 batallas (una de ellas, la 5, es una ÉLITE) y un JEFE al final. La niebla de la siguiente zona se va al derrotar al jefe.',
    why: 'Es la historia y la fuente de chatarra, cristales y planos para el barco. Cada etapa muestra el poder enemigo y tu ESTIMACIÓN de victoria.',
    how: 'Botón ¡ZARPAR! › toca una etapa › ¡ZARPAR!. Las etapas ganadas se pueden repetir para farmear (pagan un poco menos).',
    where: 'Isla › botón ¡ZARPAR!',
  },
  {
    id: 'jefes',
    term: 'Jefes y análisis',
    group: 'mar',
    what: 'El último barco de cada zona. Tiene su propio truco (la Gárgola se cura ronroneando, el Kraken abraza módulos…).',
    why: 'Vencerlo abre la zona siguiente, sube el tope de Mk, da gemas, planos y casi siempre un elemento o un gato nuevo.',
    how: 'Lee lo que dice Luzterna antes de la pelea: siempre dice dónde pegar. Si pierdes, el ANÁLISIS sube 20%: ves más de sus trucos y se debilita un poco.',
  },
  {
    id: 'reparacion',
    term: 'Reparación del barco',
    group: 'mar',
    what: 'Después de una batalla en la que te dañaron el casco, ese barco queda en reparación un ratito (reloj verde).',
    why: 'Para que no encadenes peleas con un barco hecho trizas. Cuesta poquito y el Ronroneo lo acelera.',
    how: 'Espera, acelera con RONRONEAR o zarpa con OTRO barco de tu flota.',
  },
  {
    id: 'asalto_rapido',
    term: 'Asalto Rápido',
    group: 'mar',
    what: 'En etapas que ya ganaste y donde eres MUCHO más fuerte (ventaja ×2.5), un botón gana la batalla en 5 segundos.',
    why: 'Para farmear materiales sin repetir una pelea que ya dominas. Además, no deja tu barco en reparación.',
    how: 'Mapa › etapa ganada › ASALTO RÁPIDO.',
  },
  {
    id: 'encargos',
    term: 'Encargos',
    group: 'mar',
    what: 'Batallas aparte con una REGLA rara: solo barcos chicos, máximo 3 gatos, todo mojado, sin escudos, sin línea de tiro…',
    why: 'Pagan premios únicos la primera vez (planos, Orbes Prisma, cristales) y te obligan a usar barcos y gatos distintos.',
    how: 'Mapa › ENCARGOS (o un pin en el mapa) › lee la regla › ¡ZARPAR!. Se abren al ganar ciertas etapas.',
    where: 'Mapa › botón ENCARGOS',
    gate: { boss: 1 },
  },
  {
    id: 'eventos',
    term: 'Batallas de historia',
    group: 'mar',
    what: 'Peleas especiales que aparecen como misión fijada (la Torre del Trueno, el barco que brilla, la Grieta…). No están en las etapas del mapa.',
    why: 'Avanzan la historia y dan gatos míticos, elementos o fragmentos. Su poder se ajusta al tuyo: la historia nunca te bloquea.',
    how: 'Toca la misión fijada (la de la izquierda) › IR.',
    gate: { boss: 2 },
  },
  {
    id: 'vacio',
    term: 'Fragmentos del Vacío',
    group: 'mar',
    what: 'Pedacitos fríos y vacíos que sueltan algunos jefes y batallas de historia. Se cuentan sobre 10.',
    why: 'Nadie sabe todavía. Luzterna dice que van a importar.',
    how: 'Vence jefes del fondo y las batallas de historia del Vacío.',
    gate: { boss: 4 },
  },
  {
    id: 'mesa',
    term: 'Casino (Mesa del Gato)',
    group: 'mar',
    what: 'Juegos con probabilidades a la vista, fichas y premios (accesorios, orbes, Prisma). Se abre después del Jefe 1.',
    why: 'Es opcional: un extra para quien le guste. Si no te interesa, se puede ocultar en Ajustes.',
    how: 'Botón CASINO en la isla.',
    gate: { boss: 1 },
  },

  // ------------------------------------------------------------------ REINO
  {
    id: 'reino',
    term: 'Reino (nivel de tu isla)',
    group: 'reino',
    what: 'El nivel de tu cuenta: el escudo con número de arriba a la izquierda. Su barra se llena con casi todo: construir, ganar batallas, cumplir misiones, descubrir gatos, subir estrellas, limpiar terreno.',
    why: 'Cada nivel de Reino sube +1 el tope de nivel de tus gatos, da Ronroneo, abre misiones, recetas, tiers de hábitat, terreno y automatizaciones. «Llega a Reino 3» = sigue jugando normal hasta llenar la barra.',
    how: 'No se compra: se juega. Toca el escudo para ver el camino de hitos y qué te da el siguiente nivel.',
    where: 'Arriba a la izquierda (escudo REINO)',
    quip: 'Ya aprendiste esto; toma, ahora preocúpate por cosas más interesantes.',
  },
  {
    id: 'automaticos',
    term: 'Automatizaciones',
    group: 'reino',
    what: 'Cosas que el juego hace solo cuando ya demostraste que sabes hacerlas a mano: Recolectar todo, Alimentar hasta Nv X, Repetir receta, Banco del Reino, Cola de Resonancia, Mar de Pescados Automático…',
    why: 'Las tareas repetitivas se vuelven un botón (o nada) y tú te ocupas de lo interesante. Por eso no aparecen todas desde el inicio.',
    how: 'Llegan con el Reino. El panel REINO dice cuál sigue, qué hace y dónde vive.',
    where: 'Panel REINO › automatizaciones',
  },
];

export const GLOSS_BY_ID = new Map(GLOSSARY.map((e) => [e.id, e]));

/** is the entry reachable for this save? (otherwise it shows as "???") */
export function glossKnown(e: GlossEntry | undefined): boolean {
  if (!e) return false;
  const g = e.gate;
  if (!g) return true;
  const s = G.s;
  if (g.boss !== undefined && s.campaign.bossesDefeated < g.boss) return false;
  if (g.kl !== undefined && s.kl < g.kl) return false;
  if (g.element !== undefined && !s.elements.includes(g.element)) return false;
  if (g.flag !== undefined && !gateFlag(g.flag)) return false;
  return true;
}
function gateFlag(f: string) {
  const s = G.s;
  if (f === 'expedition_open') return s.expansions.cleared.includes(4) || s.expeditions.length > 0;
  if (f === 'catdex') return !!s.flags.catdex || s.missions.done.includes('K07') || Object.keys(s.catdex).length > 3;
  if (f === 'altar_almas') return !!s.flags.altar_almas || s.cats.some((c) => c.stars > 1);
  return !!s.flags[f];
}

/** glossary ids for a mission: by goal type, plus per-mission extras */
const BY_GOAL: Record<string, string[]> = {
  tap_cat: ['habitat'],
  name_cat: ['catdex'],
  harvest_food: ['muelle', 'pescaditos'],
  harvest: ['muelle', 'pescaditos'],
  plant: ['muelle', 'relojes'],
  cat_level: ['nivel', 'pescaditos'],
  win_battle: ['batalla', 'mapa'],
  defeat_boss: ['jefes', 'mapa'],
  reach_kl: ['reino'],
  collect_gold: ['doblones', 'habitat'],
  build_habitat: ['habitat', 'elementos'],
  upgrade_habitat: ['habitat', 'doblones'],
  resonance_start: ['resonancia', 'ronroneo'],
  resonance_hatch: ['resonancia', 'rareza'],
  resonance_parallel: ['resonancia'],
  species_owned: ['catdex', 'resonancia'],
  catdex_set: ['sets', 'catdex', 'prisma'],
  orbs_of_species: ['orbes', 'estrellas'],
  star_up: ['estrellas', 'orbes', 'prisma'],
  own_rarity: ['rareza', 'resonancia'],
  own_mutation: ['mutaciones', 'resonancia'],
  inherit_trait: ['rasgos', 'resonancia'],
  assign_worker: ['oficios'],
  use_feature: ['automaticos'],
  ship_upgrade: ['mk', 'astillero', 'cristales'],
  own_ship: ['barcos', 'astillero'],
  own_ships: ['barcos', 'astillero'],
  own_ship_or_event: ['barcos'],
  crew_full: ['tripulacion', 'barcos'],
  destroy_module_arc: ['modulos', 'batalla'],
  destroy_module: ['modulos', 'batalla'],
  destroy_modules_with: ['modulos', 'barcos'],
  win_by: ['hundir', 'batalla'],
  stages_cleared: ['mapa', 'jefes'],
  use_ultimate: ['ultimate', 'batalla'],
  edit_layout: ['editor', 'astillero'],
  win_perfect: ['batalla'],
  quick_assault: ['asalto_rapido', 'mapa'],
  errand: ['encargos'],
  equip_weapon_types: ['armas', 'astillero'],
  equip_shield: ['escudos', 'astillero'],
  use_automation: ['automaticos'],
  cat_rank: ['rangos'],
  buy_expansion: ['expansiones', 'constructores'],
  clear_expansion: ['expansiones', 'constructores'],
  expansion_secret: ['expansiones', 'secretos'],
  micro_complete: ['microeventos', 'relojes'],
  event_complete: ['eventos', 'relojes'],
  gambit_play: ['mesa'],
  reaction_discovered: ['reacciones', 'elementos'],
  expedition_complete: ['expediciones'],
  secret_rumors: ['secretos', 'catdex'],
  void_fragments: ['vacio'],
  damage_pct: ['batalla', 'vacio'],
  watch: [],
};
const FEATURE_TERM: Record<string, string> = {
  collect_all: 'recolectar_todo',
  feed_bulk: 'nivel',
  crop_repeat: 'repetir_receta',
  resonance_queue: 'resonancia',
  auto_harvest: 'silo',
};
const EXTRA: Record<string, string[]> = {
  H03: ['nivel'],
  P02: ['heroicos'],
  P03: ['divinos'],
  H05: ['elementos'],
  H07: ['reino'],
  H11: ['eventos'],
  H12: ['astillero'],
  K05: ['reino'],
  K12: ['estrellas'],
  K13: ['nivel'],
  K25: ['nivel'],
  K14: ['jefes'],
  K17: ['nivel'],
  K23: ['cristales'],
  K32: ['nivel', 'reino'],
  C02: ['cristales'],
  C10: ['jefes', 'cristales'],
  C27: ['reino'],
  C28: ['modulos'],
  E01: ['doblones'],
  E05: ['batalla'],
  E10: ['elementos', 'nivel'],
  E12: ['batalla'],
};

export function missionTerms(m: MissionDef): string[] {
  const g = m.goal as { type: string; feature?: string };
  const base = [...(BY_GOAL[g.type] ?? [])];
  if (g.type === 'use_feature' && g.feature && FEATURE_TERM[g.feature]) base.unshift(FEATURE_TERM[g.feature]);
  if (g.type === 'reach_kl' || g.type === 'use_feature') base.push('reino');
  const out: string[] = [];
  for (const id of [...base, ...(EXTRA[m.id] ?? [])]) if (GLOSS_BY_ID.has(id) && !out.includes(id)) out.push(id);
  return out.length ? out : ['reino'];
}
