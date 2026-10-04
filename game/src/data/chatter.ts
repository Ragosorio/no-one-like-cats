/**
 * Island chatter: cats blurt pop references and "hot takes", then retract (b).
 * Tone: irreverent "sin filtro", but no jokes about atrocities or ethnic/religious groups.
 * Tokens: {name} player, {g:m|f|x} gendered word, {cat} the speaking cat. Render with gtxt() + replace {cat}.
 */
export interface ChatterLine {
  a: string;
  /** retraction / punchline said a beat later (optional) */
  b?: string;
  tag: 'pop' | 'polemica' | 'mood' | 'streamer' | 'meta';
  /** only for these elements (optional) */
  el?: string[];
}

export const CHATTER: ChatterLine[] = [
  // ---- polémicas que se retractan
  { tag: 'polemica', a: 'Shrek 2 es mejor que El Padrino.', b: '…bueno, igual de buena. No me funen.' },
  { tag: 'polemica', a: 'La pizza con piña está buenísima.', b: 'Era broma. …¿O no? Shhh.' },
  { tag: 'polemica', a: 'Anakin no hizo nada malo.', b: 'Bueno… lo de los younglings… mejor ni hablemos.' },
  { tag: 'polemica', a: 'Thanos tenía razón.', b: '…en lo de que sobran peces. SOLO eso.' },
  { tag: 'polemica', a: 'Los perros son mejores que los gatos.', b: '¿Quién dijo eso? Yo no fui. Fue el viento.' },
  { tag: 'polemica', a: 'Snape es el mejor personaje de Harry Potter.', b: 'Okay, también era tantito tóxico.' },
  { tag: 'polemica', a: 'Los Simpson murieron en la temporada 10.', b: '…bueno, la 12. Pero los sigo viendo.' },
  { tag: 'polemica', a: 'El final de Lost tuvo sentido.', b: 'Jajaja. No. Ni yo me la creo.' },
  { tag: 'polemica', a: 'Goku es pésimo padre.', b: '…pero salvó el universo como nueve veces. Empate.' },
  { tag: 'polemica', a: 'Ash tiene diez años desde 1997 y nadie llama a servicios sociales.', b: 'Mejor no les doy ideas.' },
  { tag: 'polemica', a: 'En Tom y Jerry, la víctima era Tom.', b: 'Bueno, también era intensito.' },
  { tag: 'polemica', a: 'Los NFTs van a regresar.', b: 'Perdón. Me dio fiebre.' },
  { tag: 'polemica', a: 'Garfield es un fraude: odia los lunes pero no trabaja.', b: '…yo tampoco trabajo. Retiro lo dicho.' },
  { tag: 'polemica', a: 'Harry debió quedar en Slytherin.', b: 'El Sombrero no se equivoca. Casi nunca.' },
  { tag: 'polemica', a: 'Bella debió quedarse con Jacob.', b: '¿Qué? No estoy llorando, TÚ estás llorando.' },
  { tag: 'polemica', a: 'Los gatos de "Cats" (2019) estaban guapos.', b: 'Me voy a lavar los ojos con cloro.' },
  { tag: 'polemica', a: 'Había espacio para Jack en la puerta.', b: '…o tal vez no. Ya no sé nada. Déjenme.' },
  { tag: 'polemica', a: 'El cilantro sabe a jabón.', b: 'Que no se entere mi abuela.' },
  { tag: 'polemica', a: 'La Tierra es plana.', b: '¿Quién, yo? Nooo. Es un cubo, obvio.' },
  { tag: 'polemica', a: 'Yo hubiera sido mejor Batman que todos.', b: 'Menos que Pattinson. Ese emo me gana.' },
  { tag: 'polemica', a: 'Shingeki no Kyojin está sobrevalorado.', b: '*un titán me mira* …OBRA MAESTRA. Obra maestra total.' },
  { tag: 'polemica', a: 'Ir al gym es puro ego.', b: 'Lo dice el gato con el abdomen "en proceso" desde 2019.' },
  { tag: 'polemica', a: 'Mi ex tenía razón.', b: 'Ah no, eso sí que no. Lo retiro con todo mi ser.' },
  { tag: 'polemica', a: 'El reguetón viejito era poesía.', b: '…poesía con mucho perreo. Me retracto a medias.' },
  { tag: 'polemica', a: 'Fortnite es mejor que Minecraft.', b: 'Perdón, Steve. Perdón, creepers. Perdón, mamá.' },
  { tag: 'polemica', a: 'El live action de One Piece fue mejor que el anime.', b: 'Mentira. Ya me voy. *se aleja nadando*' },
  { tag: 'polemica', a: 'El agua no moja.', b: 'Me voy a quedar pensando en eso toda la noche.' },
  { tag: 'polemica', a: 'Los tacos de canasta son mejores que los de pastor.', b: '…lo dije en voz alta, ¿verdad? Adiós.' },
  { tag: 'polemica', a: 'El Rey León es Hamlet con melena y nadie dice nada.', b: 'Okay, sí lo dicen. Mucho. Es el dato que todos saben.' },
  { tag: 'polemica', a: 'Las mañanitas suenan mejor en reguetón.', b: 'No. No. Olvídenlo. Me equivoqué de vida.' },
  { tag: 'polemica', a: 'Yo le gano a Messi en un uno contra uno.', b: '…en un uno contra uno de siesta.' },
  { tag: 'polemica', a: 'Pokémon debió parar en la primera generación.', b: 'Perdón, Lucario. Te quiero. Vuelve.' },
  { tag: 'polemica', a: 'Los capibaras están sobrevalorados.', b: 'Mentira, son los únicos que me hablan.' },
  { tag: 'polemica', a: 'Mario Kart arruina más amistades que el dinero.', b: '…bueno, eso no es polémico. Es ciencia.' },
  // ---- referencias pop
  { tag: 'pop', a: '{name}, yo soy tu padre.', b: '…no, es broma. A mí me adoptaron.' },
  { tag: 'pop', a: 'Winter is coming.', b: 'O sea, el invierno. Ponte suéter.' },
  { tag: 'pop', a: '¿Miedo, {name}?', b: 'Perdón, me poseyó un Malfoy.' },
  { tag: 'pop', a: 'Ka… me… ha… ¡MIAAAAU!', b: 'Necesito entrenar en la Habitación del Tiempo.' },
  { tag: 'pop', a: 'Hakuna matata.', b: 'Significa "dame atún". Lo juro.' },
  { tag: 'pop', a: 'Al infinito… ¡y al sofá!' },
  { tag: 'pop', a: 'Este es el camino.', b: '…al plato de comida.' },
  { tag: 'pop', a: 'Expecto Patronum.', b: 'Me salió otro gato. Típico.' },
  { tag: 'pop', a: 'Jesse, tenemos que cocinar.', b: 'Sardinas, Jesse. SARDINAS.' },
  { tag: 'pop', a: 'Sigue nadando, sigue nadando…', b: '¿En qué estaba? Ah, sí, comida.' },
  { tag: 'pop', a: '¿Por qué tan serio?', b: 'Ah, soy gato. Siempre estoy así.' },
  { tag: 'pop', a: 'Gomu Gomu no… siesta.' },
  { tag: 'pop', a: 'Plus Ultra… pero con croquetas.' },
  { tag: 'pop', a: 'Wubba lubba dub dub.', b: 'Significa que tengo hambre, Morty.' },
  { tag: 'pop', a: 'Esto es… ¡ESPARTA!', b: 'Digo, la Bahía Sardina. Me emocioné.' },
  { tag: 'pop', a: 'Tengo un plan, Arthur.', b: 'No tengo plan.' },
  { tag: 'pop', a: 'Que la Fuerza te acompañe, {name}.', b: 'Y que la comida también.' },
  { tag: 'pop', a: 'Siuuuuuu.' },
  { tag: 'pop', a: 'Un anillo para gobernarlos a todos.', b: '…lo usé de collar. Se me perdió.' },
  { tag: 'pop', a: 'Dattebayo.', b: 'No sé qué significa, pero se siente poderoso.' },
  { tag: 'pop', a: 'Hola, soy {cat} y esto es Jackass.', b: '*se tira al agua* …estaba fría.' },
  { tag: 'pop', a: 'Houston, tenemos un problema.', b: 'Se acabó el atún.' },
  { tag: 'pop', a: 'You shall not pass!', b: 'Es mi cojín. Nadie pasa.' },
  { tag: 'pop', a: 'Nos vemos en Disney.', b: 'Si sobrevivo a esta isla.' },
  { tag: 'pop', a: 'Siempre hay un pez más grande.', b: 'Y me lo voy a comer.' },
  { tag: 'pop', a: 'Hasta la vista, baby.', b: 'Vuelvo en cinco. Voy por botana.' },
  // ---- streamers / internet (frases cortas, de cariño)
  { tag: 'streamer', a: 'Muy buenas a todos, guapísimos.', b: '…se me pegó. Perdón, Rubius.' },
  { tag: 'streamer', a: '¿Qué pasa, chavales?', b: 'Nada. Nada pasa. Solo tengo hambre.' },
  { tag: 'streamer', a: 'Hoy hacemos speedrun de la isla.', b: '*se duerme a los 3 segundos*' },
  { tag: 'streamer', a: 'Chat, ¿esto es real?', b: 'No hay chat. Estoy hablando solo. Otra vez.' },
  { tag: 'streamer', a: 'Like y suscríbete…', b: '…a mi plato de comida.' },
  { tag: 'streamer', a: 'Clip eso. CLIP ESO.', b: '…no pasó nada. Bórralo.' },
  { tag: 'streamer', a: 'Esto es contenido, señores.', b: 'Bueno, contenido de baja calidad.' },
  // ---- humor / estado
  { tag: 'mood', a: 'Nadie: … Yo a las 3 a.m.: ¡PARKOUR!' },
  { tag: 'mood', a: '{name}, ¿me das de comer o pido Uber Eats?' },
  { tag: 'mood', a: '¿Y si esta isla es una simulación?', b: 'Piénsalo. Yo ya me asusté.' },
  { tag: 'mood', a: 'Me voy a poner serio un momento.', b: '…ya.' },
  { tag: 'mood', a: 'Hoy me siento productivo.', b: '*se acuesta*' },
  { tag: 'mood', a: 'Si me tiras al cañón otra vez, renuncio.', b: '…bueno, una vez más. Fue divertido.' },
  { tag: 'mood', a: 'Dicen que si dices "NADIE" tres veces frente al espejo…', b: '…nada. No pasa nada. Creo.' },
  { tag: 'mood', a: 'Ese pez me miró feo.', b: 'Le voy a hacer una carta. Bien enojado.' },
  { tag: 'mood', a: 'Tengo ansiedad de que no tengo ansiedad.' },
  { tag: 'mood', a: '{g:Capitán|Capitana|Capi}, pido aumento.', b: 'En sardinas. No acepto doblones.' },
  { tag: 'mood', a: 'Mi signo es Acuario.', b: 'Por eso le tengo miedo al agua. Lógico.' },
  { tag: 'meta', a: 'No me toques, estoy en mi era.', b: '…bueno, tócame poquito.' },
  { tag: 'meta', a: '¿Sabías que en este juego no hay anuncios?', b: 'Eso, eso sí es polémico.' },
  { tag: 'meta', a: 'Cada vez que no juegas, un gato aprende a programar.', b: 'Por eso hay bugs.' },
  // ---- por elemento
  { tag: 'mood', el: ['fire'], a: 'Huele a quemado.', b: 'Ah, soy yo. Todo bien.' },
  { tag: 'mood', el: ['fire'], a: 'Estoy que ardo.', b: 'Literal. Llamen a alguien.' },
  { tag: 'mood', el: ['water'], a: 'No soy gordo, soy agua retenida.' },
  { tag: 'mood', el: ['water'], a: 'Mi terapeuta dice que fluya.', b: 'Le hice caso. Inundé la cocina.' },
  { tag: 'mood', el: ['nature'], a: 'Hablo con las plantas.', b: 'Lo raro es que me contestan.' },
  { tag: 'mood', el: ['nature'], a: 'Soy vegano.', b: '…excepto por el atún. Y el salmón. Y…' },
  { tag: 'mood', el: ['earth'], a: 'Soy una roca.', b: 'Emocionalmente también. No pregunten.' },
  { tag: 'mood', el: ['storm'], a: 'Toqué un enchufe y ahora veo los colores.' },
  { tag: 'mood', el: ['storm'], a: 'Tengo la carga cargada.', b: '…eso sonó mejor en mi cabeza.' },
  { tag: 'mood', el: ['magic'], a: 'Wingardium Leviosa.', b: 'Es LeviÓsa, no LeviosÁ. Bueno, ya, no funciona.' },
  { tag: 'mood', el: ['cosmic'], a: 'He visto cosas en el espacio que no creerías.', b: 'Rayos C cerca de la Puerta de Tannhäuser. Bueno, más o menos.' },
];

let last: number[] = [];
/** pick a line for a cat (avoids the last few); el = the cat's elements */
export function pickChatter(els: string[] = [], rnd: () => number = Math.random): ChatterLine {
  const pool = CHATTER.map((l, i) => ({ l, i })).filter(({ l, i }) => (!l.el || l.el.some((e) => els.includes(e))) && !last.includes(i));
  // element lines a bit more likely for matching cats; polémicas are the star
  const w = pool.map(({ l }) => (l.el ? 2.5 : l.tag === 'polemica' ? 1.6 : 1));
  let r = rnd() * w.reduce((a, b) => a + b, 0);
  let k = 0;
  for (; k < pool.length - 1; k++) {
    r -= w[k];
    if (r <= 0) break;
  }
  const pick = pool[k] ?? { l: CHATTER[0], i: 0 };
  last = [...last.slice(-11), pick.i];
  return pick.l;
}
