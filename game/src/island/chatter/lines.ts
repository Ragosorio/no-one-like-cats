/**
 * Extra island chatter (same tone as data/chatter.ts: say it, beat, retract). Rules: irreverent and
 * pop, but never about atrocities or ethnic/religious groups. Tokens: {name} {g:m|f|x} {cat}.
 * `DIM_LINES` only play when the speaking cat stands in that dimension.
 */
import { CHATTER, ChatterLine, pickChatter } from '../../data/chatter';
import type { DimId } from '../dimensions/defs';
import { pickPopRef } from './popRefs';

export const EXTRA: ChatterLine[] = [
  { tag: 'polemica', a: 'Los videojuegos de antes eran mejores.', b: '…menos los controles. Y las pantallas de carga. Y los gráficos. Ok, no.' },
  { tag: 'polemica', a: 'El Mario de Chris Pratt estuvo bien.', b: 'Me pagaron en sardinas. Muchas sardinas.' },
  { tag: 'polemica', a: 'Las secuelas siempre son peores.', b: 'Excepto Shrek 2. Y Toy Story 2. Y… bueno, a veces.' },
  { tag: 'polemica', a: 'El modo claro es mejor que el oscuro.', b: 'Ay, me quemé las retinas. Retiro todo.' },
  { tag: 'polemica', a: 'Spider-Man 3 de Raimi es una obra maestra.', b: '…por el baile emo. SOLO por el baile.' },
  { tag: 'polemica', a: 'Los gatos naranjas comparten una sola neurona.', b: 'Oye, espera. Yo soy naranja. Lo retiro con fuerza.' },
  { tag: 'polemica', a: 'El ketchup va en los tacos.', b: 'Perdón. Me equivoqué de vida. Ya me voy.' },
  { tag: 'polemica', a: 'La leche va antes que el cereal.', b: 'Ya sé, ya sé. Llamen a la policía del desayuno.' },
  { tag: 'polemica', a: 'Gollum solo quería un amigo.', b: 'Y un anillo. Y un pescado crudo. Yo lo entiendo.' },
  { tag: 'polemica', a: 'Darth Vader era buen papá.', b: '…le cortó la mano a su hijo. Ok, papá regular.' },
  { tag: 'polemica', a: 'Pikachu está más bien gordito.', b: 'Lo dice el gato que no se ve las patas desde hace dos años.' },
  { tag: 'polemica', a: 'Me encantan los lunes.', b: 'Mentira. Me poseyó un Garfield al revés.' },
  { tag: 'polemica', a: 'Los bichos de Minecraft son lindos.', b: '…menos el creeper. Ese me debe una casa.' },
  { tag: 'polemica', a: 'Los speedruns son trampa.', b: 'Lo dice el gato que se salta los tutoriales.' },
  { tag: 'polemica', a: 'Dormir 16 horas al día es poco.', b: '…eso no es polémico. Es mi horario laboral.' },
  { tag: 'polemica', a: 'El agua de coco sabe a calcetín.', b: 'A calcetín tropical, pero calcetín. Lo sostengo… a medias.' },
  { tag: 'polemica', a: 'Los finales felices están sobrevalorados.', b: '*ve el final de Coco* …no. No lo están. Pásenme un pañuelo.' },
  { tag: 'polemica', a: 'Yo soy el protagonista de este juego.', b: '…bueno, el coprotagonista. Bueno, un extra con mucha actitud.' },
  { tag: 'pop', a: 'Al infinito y más allá… del plato.', b: 'Buzz no tenía hambre. Yo sí.' },
  { tag: 'pop', a: 'Yo no elegí la vida de gato. La vida de gato me eligió.' },
  { tag: 'pop', a: '¡Es un pájaro! ¡Es un avión!', b: '…es una gaviota. Me la quiero comer.' },
  { tag: 'pop', a: 'Con un gran poder viene una gran siesta.' },
  { tag: 'pop', a: 'I am Groot.', b: 'Perdón, me confundí de franquicia.' },
  { tag: 'pop', a: '¡Pika… pika…!', b: '…no me sale. Yo solo hago miau.' },
  { tag: 'pop', a: 'Esto no es un gato. Es un estilo de vida.' },
  { tag: 'streamer', a: 'GG EZ.', b: '…no, fue difícil. Lloré un poquito.' },
  { tag: 'streamer', a: 'Ratio.', b: 'Perdón, se me salió lo de internet.' },
  { tag: 'streamer', a: 'POV: eres un gato en una isla flotante.', b: '…oh. Sí soy. Qué fuerte.' },
  { tag: 'streamer', a: 'Esto va directo a mis historias.', b: 'No tengo historias. Tengo una caja.' },
  { tag: 'meta', a: '¿Sabías que hay otra versión de mí en otra dimensión?', b: 'Dicen que esa sí paga renta.' },
  { tag: 'meta', a: 'En otra dimensión soy perro.', b: 'No. NO. Borra eso, universo.' },
  { tag: 'meta', a: '{name}, ¿me estás leyendo? Parpadea dos veces.', b: '…ok, eso fue raro. Ya sigo con lo mío.' },
  { tag: 'mood', a: 'Tengo hambre emocional.', b: 'Y física. Sobre todo física.' },
  { tag: 'mood', a: 'Hoy es un buen día para tirar algo de la mesa.', b: '…no hay mesa. Improvisaré.' },
];

export const DIM_LINES: Partial<Record<DimId, ChatterLine[]>> = {
  home: [
    { tag: 'mood', a: 'Hogar, dulce hogar.', b: 'Bueno, hogar, dulce caja de cartón.' },
    { tag: 'mood', a: 'Esta isla flota. ¿Nadie va a hablar de que FLOTA?', b: 'Ok, ya me acostumbré. Siguiente tema.' },
  ],
  forest: [
    { tag: 'pop', a: 'Esto parece película de Ghibli.', b: 'Si aparece un espíritu gordo, me lo quedo.' },
    { tag: 'mood', a: 'Vi un arcoíris y pedí un deseo.', b: 'Que se acaben los lunes. No funcionó.' },
    { tag: 'mood', a: 'Las luciérnagas me siguen.', b: '…o yo las sigo. Ya no sé quién acosa a quién.' },
  ],
  cliff: [
    { tag: 'meta', a: '¿Por qué de repente todo es blanco y negro?', b: 'Ah, es la Dimensión Tinta. Pensé que me había quedado ciego.' },
    { tag: 'meta', a: 'Siento que alguien me está dibujando.', b: '…y me dibujó gordo. Exijo otro artista.' },
    { tag: 'meta', a: 'Mi pelaje está en modo boceto.', b: 'Que nadie me borre, por favor.' },
    { tag: 'polemica', a: 'El manga es mejor que el anime.', b: '*el anime me mira* …los dos. Amo a los dos. Paz.' },
  ],
  volcano: [
    { tag: 'mood', a: '¿Alguien más siente que este lugar es el infierno?', b: 'Ah, sí es. Literal. Lo dice el letrero.' },
    { tag: 'mood', a: 'Me quemé la cola. Otra vez.', b: 'Huele a pescado asado. Ah, no, soy yo.' },
    { tag: 'polemica', a: 'El calor está rico.', b: '…mentira, estoy sudando por las almohadillas.' },
    { tag: 'pop', a: 'Esto es fino.', b: '*todo arde* …sí, todo bien. Todo fino.' },
  ],
  ghost: [
    { tag: 'pop', a: 'Me siento protagonista de Blade Runner.', b: '…de Blade Runner, pero con croquetas.' },
    { tag: 'mood', a: 'Esta isla parece video de lo-fi para estudiar.', b: 'Ok, estudio cinco minutos. Ya. Terminé.' },
    { tag: 'mood', a: 'Ese neón parpadea. ¿Es un mensaje?', b: 'Dice "PA-GA LA LUZ". Qué grosero.' },
  ],
  ice: [
    { tag: 'polemica', a: 'Hace un frío que ni el corazón de mi ex.', b: 'Bueno, eso fue cruel. Lo retiro… a medias.' },
    { tag: 'mood', a: 'Quiero un suéter, un chocolate y un abrazo.', b: 'Bueno, el abrazo no. No exageremos.' },
    { tag: 'pop', a: 'Libre soy, libre soooy…', b: '…perdón. Se me congeló la dignidad.' },
  ],
  ruins: [
    { tag: 'meta', a: '¿Alguien más ve el ojo gigante?', b: 'No le hagan contacto visual. Es como con los gatos.' },
    { tag: 'meta', a: 'Me lag… lag… lagueé.', b: 'Ya volví. ¿Qué me perdí?' },
    { tag: 'meta', a: 'Esta dimensión necesita reiniciarse.', b: 'Igual que yo los lunes.' },
    { tag: 'polemica', a: 'Los bugs son features.', b: '…dijo todo programador, siempre, para siempre.' },
  ],
  reef: [
    { tag: 'mood', a: 'Todo aquí brilla como sticker holográfico.', b: 'Quiero uno. Quiero TODOS.' },
    { tag: 'mood', a: 'Me siento sirena.', b: 'Sirena gato. Sirgato. Ok, ya, me callo.' },
  ],
  cosmic: [
    { tag: 'mood', a: 'Estoy viendo el universo y el universo me está viendo a mí.', b: '…y me dejó en visto.' },
    { tag: 'pop', a: 'En el espacio nadie te oye maullar.', b: 'Por eso maúllo más fuerte. MIAU.' },
    { tag: 'meta', a: 'Una estrella fugaz. ¡Pide un deseo, {name}!', b: 'Yo pedí atún infinito. Ya veremos.' },
  ],
};

/** short shout replies from a second cat (during the beat before the retraction) */
export const REACTIONS = ['¡¿QUÉ?!', '¡FUNADO!', 'RATIO', '¡HEREJE!', 'AJÁ…', '¡JAMÁS!', 'X DUDA', '¿PERDÓN?', '¡NI DE CHISTE!', 'LITERAL'];

let merged = false;
function merge() {
  if (merged) return;
  merged = true;
  CHATTER.push(...EXTRA);
}

const lastDim: string[] = [];
/** a line for a cat with these elements standing in this dimension (slug = its painting, for themed refs) */
export function chatterFor(els: string[], dim: DimId | null, slug?: string): ChatterLine {
  merge();
  const pool = dim ? DIM_LINES[dim] : undefined;
  if (pool && pool.length && Math.random() < 0.32) {
    const free = pool.filter((l) => !lastDim.includes(l.a));
    const l = (free.length ? free : pool)[Math.floor(Math.random() * (free.length || pool.length))];
    lastDim.push(l.a);
    if (lastDim.length > 6) lastDim.shift();
    return l;
  }
  // pop references are the main course: ~half of what the island says
  if (Math.random() < 0.55) return pickPopRef(els, slug);
  return pickChatter(els);
}
