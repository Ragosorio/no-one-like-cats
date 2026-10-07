/**
 * Parte 2 — Grietas del Multiverso: what Luzterna (and each primordial) says when a grieta opens
 * (mission appears) and after you win it (what the element does + why it showed up). Played by
 * app/story.ts (ON_NEW / ON_DONE of H23–H28). Generated from the content brief; edit freely.
 */
import type { Line } from '../dialog';

/** the first time any grieta appears (right after the credits): what the grietas are */
export const GRIETAS_EXPLAIN: Line[] = [
  ['LUZTERNA', '¿Ves esas rayas en el cielo, {name}? Cuando el Leviatán se hundió, rompió el fondo del Primer Mar. Y un mar roto se agrieta. Como mi corazón, pero en el cielo.'],
  ['LUZTERNA', 'Son las GRIETAS DEL MULTIVERSO. Del otro lado hay otros mares, con elementos que aquí no existían: hielo, sonido, sombras, tiempo… cosas que no vienen en ningún mapa.'],
  ['LUZTERNA', 'Por cada grieta se asoma un barco de ese elemento, y cada uno trae a su PRIMORDIAL. Gánale y se queda en tu isla, con todo y elemento. Ganga.'],
];

export const MULTI_INTRO: Record<string, Line[]> = {
  ice: [
    ['SISTEMA', '(Justo donde se hundió el Leviatán, el cielo cruje como hielo de charco. Por la raja se cuela una luz verde.)'],
    ['LUZTERNA', 'La primera grieta. Rompiste el Primer Mar, {name}. Bueno, rompimos. Bueno, el Leviatán. Fue en equipo.'],
    ['BÓREAS', 'Por esta raja se me está metiendo el calor. Ciérrenla. O vengan a cerrarla ustedes.'],
    ['LUZTERNA', 'Toca la misión fijada. Y abrígate: yo ya no siento frío, pero me acuerdo de cómo se sentía y no, gracias.'],
  ],
  sound: [
    ['SISTEMA', '(Acabas de coronarte en el Podio. El público ruge tan fuerte que el cielo se raja de lado a lado. Del otro lado alguien afina una guitarra.)'],
    ['LUZTERNA', 'Felicidades, {g:campeón|campeona|campeone}. Tu público gritó tan fuerte que rompió el cielo. Literal. Eso no lo cubre el seguro.'],
    ['HEADLINER', '¿QUIÉN ABRIÓ? Estaba en pleno solo de guitarra, carajo.'],
    ['LUZTERNA', 'Toca la misión fijada. Y si después te zumban los oídos, no es el mar. Es él.'],
  ],
  shadow: [
    ['SISTEMA', '(En el Jardín Sakura los faroles de papel se encienden solos. Las sombras de tus gatos caminan para el otro lado.)'],
    ['LUZTERNA', '¿Viste? Tu sombra se movió antes que tú. Yo no tengo sombra, estoy muerta. Pero si tuviera, estaría nerviosa.'],
    ['MEDIANOCHE', 'Bonitos faroles. Cada uno es una puerta. Gracias por prenderlos todos.'],
    ['LUZTERNA', 'Toca la misión fijada. Y no le des la espalda a nada. A NADA.'],
  ],
  time: [
    ['SISTEMA', '(En el Oasis Dorado, el reloj de arena de la Esfinge Bostezante empieza a correr al revés. La arena sube.)'],
    ['LUZTERNA', 'Arena subiendo. Tiempo al revés. Si se rebobina hasta antes de que me muriera, yo no me quejo.'],
    ['CRONOS', 'Ya sé cómo termina esto, grumete. Lo vi ayer. O mañana. Me confundo.'],
    ['LUZTERNA', 'Toca la misión fijada. Y date prisa. …Bueno, con este da igual. Pero date prisa.'],
  ],
  light: [
    ['SISTEMA', '(En el Atolón Estelar, el Faro del Primer Mar se vuelve a encender solo. Su haz no apunta al mar: apunta a una grieta en el cielo.)'],
    ['LUZTERNA', 'Ese faro estaba apagado desde que yo era chiquita. Y yo ya me morí. Así que imagínate.'],
    ['ÁUREA', 'Seguí la luz y llegué a un mar lleno de gatos sin halo. Qué tristeza. Vengo a arreglarlo.'],
    ['LUZTERNA', 'Toca la misión fijada. Y ponte lentes oscuros. Te lo digo en serio.'],
  ],
  void: [
    ['SISTEMA', '(El cielo se abre como la tapa de una caja. Estática. Un solo ojo blanco.)'],
    ['LUZTERNA', 'Es él. El del final del capítulo, el que preguntó por su almirante. Le limpiaste el Abismo… o le juntaste los fragmentos. Vino a ver quién fue.'],
    ['NADIE', 'Nadie tocó mis cosas. …Eso dicen siempre. Y siempre es mentira.'],
    ['LUZTERNA', 'Toca la misión fijada. Y no le digas que nadie te importa. Se lo toma personal.'],
  ],
};
export const MULTI_OUTRO: Record<string, Line[]> = {
  ice: [
    ['BÓREAS', 'Ganaste. Qué calor. Me quedo, pero mi hábitat lo quiero helado.'],
    ['LUZTERNA', 'HIELO: lo que congelas no dispara su próximo turno. Y si después le pegas fuego, CHOQUE TÉRMICO: revienta. Con tierra o cañón, ESTALLIDO.'],
    ['LUZTERNA', 'Le gana al Agua y al Tiempo. Le pierde contra el Fuego, que lo derrite, y contra el Sonido, que lo revienta con una nota aguda.'],
    ['LUZTERNA', 'Constrúyele un hábitat de Hielo en la TIENDA, que si no se derrite de coraje. ¿Más gatos de Hielo? Resonancia con Bóreas y cualquier gato.'],
  ],
  sound: [
    ['HEADLINER', 'Buen show. Me quedo, pero quiero camerino. Y croquetas sin las cafés.'],
    ['LUZTERNA', 'SONIDO: su onda atraviesa paredes, pega poquito a cada celda y ATURDE a cada gato cuyo camarote cruza: pierde su próximo turno. Luego queda SORDO 2 turnos. Y el cristal lo odia.'],
    ['LUZTERNA', 'Le gana a la Tierra y al Hielo. Le pierde contra el Agua, que lo apaga, y contra el Vacío, donde nadie oye nada.'],
    ['LUZTERNA', 'Hábitat de Sonido en la TIENDA, lejos de mi lado de la isla. ¿Más gatos de Sonido? Resonancia con Headliner y cualquier gato.'],
  ],
  shadow: [
    ['MEDIANOCHE', 'Me ganaste mirándome de frente. Pocos se atreven. Me quedo a ver qué más haces.'],
    ['LUZTERNA', 'SOMBRA: su tiro no se ve volar, solo cuando cae. Y al caer, una PUÑALADA le pega POR LA ESPALDA al gato enemigo más cercano, aunque tenga escudo.'],
    ['LUZTERNA', 'Se odia con la Luz y con la Tormenta: un relámpago la expone, pero entre relámpago y relámpago la sombra ya te apuñaló. Se pegan ×1.5 de ida y de vuelta.'],
    ['LUZTERNA', 'Hábitat de Sombra en la TIENDA, en el rincón más oscuro. ¿Más gatos de Sombra? Resonancia con Medianoche y cualquier gato.'],
  ],
  time: [
    ['CRONOS', 'Así terminaba. Lo sabía. Me quedo: ya vi que me quedaba.'],
    ['LUZTERNA', 'TIEMPO: REBOBINA. Cuando pega, repara las celdas más dañadas de TU barco y le atrasa un turno la recarga al gato enemigo que golpea. Su ultimate es TIME STOP: los gatos rivales pierden su próximo turno (sus cañones no).'],
    ['LUZTERNA', 'Le gana al Fuego, porque con tiempo todo fuego se apaga, y al Vacío. Le pierde contra lo Cósmico, que es más viejo que el tiempo, y contra el Hielo, que lo congela.'],
    ['LUZTERNA', 'Hábitat de Tiempo en la TIENDA. ¿Más gatos de Tiempo? Resonancia con Cronos y cualquier gato.'],
  ],
  light: [
    ['ÁUREA', 'Me ganaste con los ojos cerrados. Respeto. Me quedo a iluminarte la isla.'],
    ['LUZTERNA', 'LUZ: su rayo va casi recto, no le importa el viento y ATRAVIESA varias celdas en línea. Y deja CEGADO al barco rival: su próximo turno apunta con la vista previa al 30%.'],
    ['LUZTERNA', 'Le gana a la Magia, porque le revela el truco, y a la Sombra. Le pierde contra la Tierra, porque una pared tapa la luz, y contra la Sombra también: se odian parejo.'],
    ['LUZTERNA', 'Hábitat de Luz en la TIENDA. ¿Más gatos de Luz? Resonancia con Áurea y cualquier gato.'],
  ],
  void: [
    ['NADIE', '…Era cierto. A Nadie le gustan los gatos.'],
    ['LUZTERNA', 'Ay. Me va a dar algo. Ya me dio, estoy muerta, pero casi me da otra vez. Quédate, Nadie. Hay camarote.'],
    ['LUZTERNA', 'VACÍO: lo que toca queda BORRADO para siempre en esa batalla: no se repara, ni se rebobina, ni se regenera. Y se come escudos, burbujas, estados y hasta segundas vidas.'],
    ['LUZTERNA', 'Le gana a lo Cósmico y al Sonido; le pierde contra la Magia y el Tiempo. Hábitat de Vacío en la TIENDA, y para más gatos: Resonancia con Nadie y cualquier gato.'],
  ],
};
/** one line under the element-discovery sequence */
export const GRIETA_CAPTION: Record<string, string> = {
  ice: 'El cielo se rajó como hielo de charco. Del otro lado alguien tenía frío. Ahora lo tienes tú.',
  sound: 'El público rugió y el cielo se rompió. Ahora el eco vive en tu isla.',
  shadow: 'Los faroles se prendieron y las sombras se fueron caminando. Una se quedó contigo.',
  time: 'La arena subió, el reloj dio una vuelta al revés y alguien muy viejo bajó a saludarte.',
  light: 'El faro se prendió y apuntó a otro mar. Por ahí bajó la luz. No pidió permiso.',
  void: 'Nadie bajó del cielo. Nadie te miró con su único ojo. Y por primera vez, Nadie se quedó.',
};
