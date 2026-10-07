/**
 * "Every system explains itself" — first-appearance beats (owned by the story module).
 *
 * Each feature gets ONE short Luzterna beat (2–4 lines: in-world reason + "do THIS for THIS") the first
 * time it matters, and it is never repeated (G.s.explained). Played by app/story.ts:
 *   · appear  — it just became available during play (a mission, a Kingdom level, a HUD button):
 *               played when calm (island/map, no panel open, no other beat), spaced out (≥20 s)
 *   · use     — the player opened its panel (Modal title match) / scene: played right away, over it.
 *               This is how OLD saves get the explanation: never dumped on load, shown on first use.
 *   · tip     — small ones are a non-blocking corner bubble instead of a dialog.
 * Features already reachable when a save boots are "use-only" for that session (app/story.ts).
 * Every beat has a glossary entry with the same id (data/glossary.ts) for later.
 */
import type { Line } from '../dialog';
import { G } from '../../state/game';
import { EXPANSIONS } from '../../data/content';
import { hudUnlocks, missionSeen } from '../../state/ext/island';

export interface FeatureIntro {
  /** = its glossary id */
  id: string;
  lines: Line[];
  /** lines when it plays because the player opened it (old saves: generic wording); default `lines` */
  useLines?: Line[];
  /** became available → explain when calm */
  appear?: () => boolean;
  /** its panel (Modal title, upper case) is open → explain now, over it */
  panel?: RegExp;
  /** being on this scene counts as using it */
  scene?: 'map' | 'island';
  /** extra condition for both triggers */
  when?: () => boolean;
  /** an existing story beat already told this (seen → nothing to add) */
  covered?: string;
  /** non-blocking corner bubble instead of a dialog */
  tip?: boolean;
  /** only on this screen */
  onlyOn?: 'map' | 'island';
  /** missions whose "new mission" tip would repeat it */
  missions?: string[];
}

const L = (t: string): Line => ['LUZTERNA', t];
const expansionTitles = new RegExp(`^(${EXPANSIONS.map((e) => e.name.toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})$`);

/** shown once, after the very first feature beat */
export const GLOSSARY_HINT = '¿Se te olvidó algo? Cada misión tiene un botón «?» y en MISIONES está el GLOSARIO. Ahí está todo, sin prisa.';

export const FEATURES: FeatureIntro[] = [
  // ------------------------------------------------------------------ minute 1–10
  {
    id: 'habitat',
    appear: () => missionSeen('K03'),
    panel: /^(CONSTRUIR HÁBITAT|SIN CASA)$|^HÁBITAT DE /,
    missions: ['K03'],
    lines: [
      L('¿Ves a Brote ahí afuera, sin casa? Gato sin casa no produce ni un Doblón. Y se deprime. Y te juzga.'),
      L('Cada HÁBITAT es de un elemento y solo acepta gatos de ese elemento. Brote es de Naturaleza: necesita una casa de Naturaleza.'),
      L('Toca una parcela vacía › CONSTRUIR. Más gatos con casa = más oro. Y el oro paga todo lo demás: barco, comida, terreno.'),
    ],
    useLines: [
      L('Los HÁBITATS: aquí viven tus gatos, y un gato con casa produce oro solito. Sin casa, nada.'),
      L('Cada hábitat es de UN elemento (Fuego con Fuego, Agua con Agua…). Mejóralo y produce más, caben más gatos y tarda más en decir ¡LLENO!.'),
    ],
  },
  {
    id: 'muelle',
    covered: 'b04_pescado',
    panel: /^(MUELLE DE PESCA|¿QUÉ PESCAMOS\?)$/,
    lines: [
      L('El MUELLE DE PESCA: siembras peces, esperas y cosechas Pescaditos. Lo corto rinde si juegas; lo largo, si te vas un rato.'),
      L('¿Para qué tanto pescado? Para ALIMENTAR a tus gatos: gato que come sube de nivel, y gato con nivel produce más oro y pega más fuerte.'),
    ],
  },
  {
    id: 'reino',
    appear: () => missionSeen('H07'),
    panel: /^REINO$/,
    missions: ['H07'],
    lines: [
      L('¿Ves el escudo con el número, arriba a la izquierda? Es tu REINO: el nivel de tu isla entera.'),
      L('Se llena con TODO lo que haces: construir, pelear, cumplir misiones, descubrir gatos. Cada nivel deja crecer a tus gatos un nivel más y abre cosas nuevas.'),
      L('Así que cuando una misión diga «Llega a Reino 3», no hay truco: sigue jugando y la barra se llena sola. Tócala si quieres ver qué viene.'),
    ],
    useLines: [
      L('El REINO es el nivel de tu isla entera. Se llena con casi todo lo que haces, y cada nivel sube el tope de tus gatos y abre cosas.'),
      L('Este camino te dice qué da cada nivel. Las automatizaciones llegan cuando ya aprendiste a hacer algo a mano: es premio, no flojera.'),
    ],
  },
  {
    id: 'mapa',
    scene: 'map',
    lines: [
      L('La CARTA NÁUTICA. Seis mares; en cada uno, ocho batallas, una ÉLITE en la 5 y un JEFE al final que no deja pasar a nadie.'),
      L('¿Para qué pelear? Chatarra y cristales para el barco, oro… y cada jefe que cae trae un elemento o un gato nuevo. Y la historia, claro.'),
      L('Toca una etapa: te digo el poder del enemigo y tu chance de ganar. Si dice 30%, no llores después.'),
    ],
  },
  {
    id: 'ronroneo',
    appear: () => G.s.purr > 0 || G.s.stats.victories > 0,
    onlyOn: 'island',
    lines: [
      L('¿Viste ese relojito que ronronea? Es RONRONEO: minutos que ganas JUGANDO. Ganar, perder, cumplir misiones, descubrir gatos… todo da.'),
      L('La mitad adelanta sola el reloj verde que esté por terminar (o el que fijes con la chincheta). La otra mitad se guarda en tu reserva.'),
      L('O sea: mientras esperas una obra, ve a pelear. Esperar jugando es esperar menos.'),
    ],
  },
  {
    id: 'cristales',
    tip: true,
    appear: () => G.s.scrap > 0,
    lines: [L('Eso que soltó el barco enemigo es CHATARRA. Solo sale de pelear (y de expediciones) y sirve para mejorar tu barco en el Astillero.')],
  },
  {
    id: 'astillero',
    appear: () => missionSeen('C02'),
    panel: /^ASTILLERO$/,
    missions: ['C02'],
    lines: [
      L('Tu balsa es, técnicamente, un barco. Técnicamente. El ASTILLERO la arregla.'),
      L('Tus gatos ponen la puntería; el barco pone la vida y los cañones. Cada familia de piezas tiene un nivel Mk: Armas Mk II = tus cañones pegan más fuerte.'),
      L('Cuesta oro y CHATARRA, y la chatarra solo sale de pelear. Pelea, mejora, pelea más fuerte. El círculo de la vida.'),
    ],
  },
  {
    id: 'catdex',
    onlyOn: 'island',
    appear: () => hudUnlocks().catdex,
    panel: /^CATDEX$/,
    lines: [
      L('Se abrió el CATDEX: el registro de todos los gatos de este mar. Cada uno es una página que se le cayó al Archivo.'),
      L('Cada especie nueva te da gemas, Ronroneo y +2% de oro para TODA la isla. Las siluetas son las que te faltan: tócalas para ver de dónde salen.'),
      L('Coleccionar aquí no es vicio: es estrategia. (Bueno, también es vicio.)'),
    ],
    useLines: [
      L('El CATDEX: el registro de todos los gatos de este mar. Cada especie nueva te da gemas, Ronroneo y +2% de oro para TODA la isla.'),
      L('Las siluetas son las que te faltan: tócalas para ver de dónde salen. Y si completas un SET, el mar te premia.'),
    ],
  },
  {
    id: 'recolectar_todo',
    tip: true,
    appear: () => G.s.kl >= 3,
    onlyOn: 'island',
    missions: ['E01'],
    lines: [L('Reino 3: ya demostraste que sabes tocar monedas. Toma, RECOLECTAR TODO (abajo a la izquierda): toda la isla de un toque.')],
  },
  {
    id: 'expansiones',
    appear: () => missionSeen('E02'),
    panel: expansionTitles,
    onlyOn: 'island',
    missions: ['E02'],
    lines: [
      L('Esas nubes alrededor de tu isla esconden TERRENO. Ya tienes Reino para el primero: el Bosque Costero.'),
      L('Cada pedazo trae algo: más parcelas, un constructor extra, ranuras de Resonancia… y un SECRETO. Toca el letrero con el precio.'),
    ],
    useLines: [
      L('TERRENO nuevo. Se compra con oro, se limpia (reloj verde, ocupa un constructor) y abre parcelas o algo especial.'),
      L('Y cada pedazo esconde un SECRETO: a veces es tocar algo, a veces un gato de cierto elemento, a veces pelear. Busca.'),
    ],
  },
  {
    id: 'orbes',
    onlyOn: 'island',
    appear: () => missionSeen('K12'),
    missions: ['K12'],
    lines: [
      L('Esas bolitas brillantes son ORBES DE ALMA. Cada una es de UNA especie: orbes de Canelo, orbes de Gelatino…'),
      L('Salen de gatos repetidos, victorias, jefes y misiones. Un duplicado nunca es inútil.'),
      L('Junta 10 de un mismo gato y se despierta el ALTAR DE ALMAS. Ahí se gastan, ya verás.'),
    ],
  },
  {
    id: 'estrellas',
    onlyOn: 'island',
    appear: () => hudUnlocks().altar,
    panel: /^ALTAR DE ALMAS$/,
    missions: ['K13'],
    lines: [
      L('Despertó el ALTAR DE ALMAS. Aquí tus gatos suben de ESTRELLA, que no es lo mismo que subir de nivel.'),
      L('El nivel se paga con comida. La ★ se paga con Orbes de Alma de su misma especie, y pide nivel mínimo: ★2 pide Nv10, ★3 Nv20.'),
      L('¿Para qué? ★2 = +25% de poder y oro. ★3 = su ataque hace una cosa MÁS. Es mejorar al gato que ya quieres en vez de buscar otro.'),
    ],
    useLines: [
      L('El ALTAR DE ALMAS: aquí tus gatos suben de ESTRELLA (★), que no es lo mismo que subir de nivel.'),
      L('La ★ se paga con Orbes de Alma de su misma especie y pide nivel mínimo (★2 pide Nv10, ★3 Nv20). ★2 = +25% de poder y oro; ★3 = su ataque hace una cosa MÁS.'),
    ],
  },
  {
    id: 'ultimate',
    appear: () => G.has('first_meter_full'),
    missions: ['C11'],
    lines: [
      L('Uno de tus gatos llenó su medidor de ULTIMATE. Cuando su carta diga ULTIMATE LISTA, toca su botón ULT.'),
      L('Es su ataque especial: pega muchísimo más y cada gato hace algo distinto. Guárdala para el núcleo enemigo… o para un jefe.'),
    ],
  },
  {
    id: 'barcos',
    tip: true,
    appear: () => G.s.kl >= 5 && !G.s.ship.owned.includes('gorrion'),
    missions: ['C05'],
    lines: [L('Reino 5: el GORRIÓN ya está en el Astillero. Cuatro camarotes = un gato más disparando, y el primer turno dispara doble.')],
  },
  {
    id: 'editor',
    appear: () => missionSeen('C12'),
    panel: /^EDITOR DE PLANO$/,
    missions: ['C12'],
    lines: [
      L('El EDITOR DE PLANO: mueves módulos y camarotes como Tetris pirata. Todo tiene que tocar la quilla (la fila de abajo).'),
      L('Esconde a los gatos detrás del casco y aleja la santabárbara de ellos. GUARDAR Y PROBAR te deja dispararle a un muñeco sin perder nada.'),
    ],
  },
  {
    id: 'microeventos',
    tip: true,
    appear: () => missionSeen('E04'),
    missions: ['E04'],
    lines: [L('¡Reloj ROJO! Eso es un MICROEVENTO: algo pasa en tu isla y se va pronto. Tócalo si te interesa; si lo ignoras, no pierdes nada.')],
  },
  {
    id: 'momentum',
    tip: true,
    appear: () => G.s.momentum > 1.15,
    lines: [L('¿Ves la llamita junto al Reino? Es tu RACHA. Mientras sigas ganando, tu isla produce más y los peces crecen más rápido.')],
  },
  {
    id: 'reparacion',
    panel: /^BARCO EN REPARACIÓN$/,
    lines: [
      L('Tu barco salió madreado y está en REPARACIÓN (reloj verde). Sí, hasta los barcos de cartón necesitan su spa.'),
      L('Espera, acelera con RONRONEAR… o zarpa con OTRO barco de tu flota. Para eso tienes flota.'),
    ],
  },
  {
    id: 'asalto_rapido',
    tip: true,
    appear: () => G.has('can_quick_assault'),
    missions: ['C14'],
    lines: [L('Ya eres MUCHO más fuerte que alguna etapa ganada. Ahí aparece ASALTO RÁPIDO: ganas en 5 segundos y te llevas el botín.')],
  },
  {
    id: 'encargos',
    appear: () => missionSeen('C15'),
    panel: /^TABLERO DE ENCARGOS$|^ENCARGO: /,
    onlyOn: 'map',
    missions: ['C15'],
    lines: [
      L('ENCARGOS: batallas aparte con una regla rara. Solo barcos chicos, máximo tres gatos, todo mojado…'),
      L('La primera vez pagan cosas que no salen en otro lado: planos, Orbes Prisma, cristales. Lee la regla antes de zarpar, para eso está.'),
    ],
  },
  {
    id: 'tienda',
    panel: /^TIENDA$/,
    lines: [
      L('La TIENDA. Aquí no hay billetes reales: todo se paga con lo que ganas jugando.'),
      L('Lo útil: constructor extra, ranura de Resonancia, orbes para una estrella y gatos comunes que te falten. Las decoraciones dan XP de Reino la primera vez.'),
    ],
  },
  {
    id: 'repetir_receta',
    appear: () => G.s.kl >= 9,
    panel: /^MUELLE DE PESCA$/,
    when: () => G.s.kl >= 9,
    missions: ['K10'],
    lines: [
      L('Reino 9. Ya sembraste a mano sardinas suficientes para una vida entera. Por eso aparece REPETIR RECETA.'),
      L('Actívalo en cada parcela del Muelle: al cosechar, vuelve a sembrar lo mismo sola (si te alcanza el oro). Tú dedícate a cosas más interesantes.'),
    ],
  },
  {
    id: 'sets',
    tip: true,
    appear: () => missionSeen('K15'),
    missions: ['K15'],
    lines: [L('SETS del Catdex: junta a todos los gatos de un grupo (Catdex › SETS) y te llevas 10 Orbes Prisma, Ronroneo y una regla nueva de batalla.')],
  },
  {
    id: 'prisma',
    tip: true,
    appear: () => G.s.prisma > 0,
    lines: [L('Un ORBE PRISMA: el comodín. Vale por un Orbe de Alma de CUALQUIER gato. El Altar lo usa para completar la estrella que te falte.')],
  },
  {
    id: 'banco',
    appear: () => G.s.kl >= 15,
    panel: /^BANCO DEL REINO$/,
    when: () => G.s.kl >= 15,
    onlyOn: 'island',
    lines: [
      L('Abrió el BANCO DEL REINO. Desde hoy el oro de TODOS tus hábitats entra solo a tu cartera, aunque digan ¡LLENO!.'),
      L('Y sigue depositando un rato aunque cierres el juego. Se acabó pasar recogiendo monedas como abuelita en el parque.'),
    ],
  },
  {
    id: 'expediciones',
    appear: () => G.s.expansions.cleared.includes(4),
    panel: /^PUERTO DE LAS MAREAS$/,
    when: () => G.s.expansions.cleared.includes(4),
    missions: ['E14'],
    lines: [
      L('El PUERTO DE LAS MAREAS ya tiene muelles. Desde aquí salen las EXPEDICIONES: 1 o 2 gatos, 15 minutos, 1 hora o 4.'),
      L('Regresan con chatarra, cristales, orbes y a veces planos. Manda a los que NO van en tu barco y déjalos ir cuando te vayas a dormir.'),
    ],
  },
  {
    id: 'escudos',
    tip: true,
    appear: () => G.s.campaign.bossesDefeated >= 3,
    when: () => G.s.campaign.bossesDefeated >= 3,
    lines: [L('ESCUDOS: el Burbuja se come UN impacto entero por turno. El Bastión ya puede llevarlos; y los enemigos también, así que pégales dos veces.')],
  },
  {
    id: 'mutaciones',
    tip: true,
    appear: () => G.s.kl >= 20,
    missions: ['K22'],
    lines: [L('Reino 20: ya hay MUTACIONES. Cada Resonancia tiene chance de sacar un mutante, y sube si los dos padres viven en el mismo hábitat.')],
  },
  {
    id: 'silo',
    tip: true,
    appear: () => G.s.kl >= 21,
    missions: ['K21'],
    lines: [L('Reino 21: MAR DE PESCADOS AUTOMÁTICO. Las cosechas listas se van solas al Silo. Con Repetir receta, tu muelle ya no te necesita.')],
  },
  {
    id: 'oficios',
    appear: () => G.s.kl >= 24,
    panel: /^OFICIOS$/,
    when: () => G.s.kl >= 24,
    onlyOn: 'island',
    missions: ['K24'],
    lines: [
      L('Reino 24: tus gatos ya pueden tener OFICIO. Banquero, Granjero, Constructor o Viajero: cada especie sabe hacer uno.'),
      L('Mejoran la isla (más oro, más comida, obras más rápidas, mejores expediciones)… pero el que trabaja NO se sube al barco. Usa a los que no pelean.'),
    ],
  },
];

/** by id (debug / tests) */
export const FEATURE_BY_ID = new Map(FEATURES.map((f) => [f.id, f]));
