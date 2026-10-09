/**
 * Casino banter. Two voices:
 *  - HOST (Madame Noir, the croupier): pop-culture parodies (paraphrased + twisted, never quoted verbatim),
 *    latino sayings, and honest reminders. Spoken with the Web Speech API when VOZ is on.
 *  - CHAT: a fictional live chat with streamer-style short catchphrases ("CLIP", "F", "bua", "no puede ser").
 *    Fictional usernames only; no real people are named or impersonated (09 §0.1 rule 6).
 * Tokens: {name}, {g:m|f|x} (ui/gender.ts). `sf` = "Sin filtro" variant (settings.sinFiltro).
 * Ethics: loss lines never say "the next one is the one" (gambler's fallacy); streaks remind that spins are independent.
 */
import { gtxt } from '../../ui/gender';
import { settings } from '../../core/settings';
import { folioRevealed } from '../../state/sys/rupturas';
import { REGISTRO_CHAT, REGISTRO_CHAT_CHANCE, REGISTRO_CHAT_COLOR, REGISTRO_CHAT_USER } from '../../ui/story/rupturasScript';

export type Ev =
  | 'enter'
  | 'betBig'
  | 'betSmall'
  | 'betVip'
  | 'betChips'
  | 'spin'
  | 'winSmall'
  | 'winBig'
  | 'jackpot'
  | 'refund'
  | 'lose'
  | 'loseStreak'
  | 'winStreak'
  | 'poor'
  | 'gacha'
  | 'gachaX10'
  | 'gachaEpic'
  | 'gachaLegend'
  | 'gachaHolo'
  | 'gachaMeh'
  | 'caja'
  | 'accessory'
  | 'roulette'
  | 'exit'
  | 'autoStart'
  | 'autoSpeed'
  | 'autoTurbo'
  | 'escape'
  | 'hot'
  | 'candy'
  | 'firstLegend'
  | 'gachaMythic'
  | 'riskHigh'
  | 'riskAll'
  | 'eterno'
  | 'eternoHot'
  | 'eternoWin'
  | 'eternoLoss'
  | 'eternoStop'
  | 'plinko'
  | 'dice'
  | 'diceWin'
  | 'diceLose'
  | 'scratch'
  | 'boxes'
  | 'bingo'
  | 'hilo'
  | 'hiloStreak';

interface L {
  t: string;
  sf?: string;
}
const H: Record<Ev, L[]> = {
  enter: [
    { t: '¿Miedo, {name}? Pásale. Aquí el único que le teme a la ruleta es el perro.' },
    { t: 'Bienvenid{g:o|a|e} al Gato Negro. Lo que pasa aquí, se queda aquí. Tus doblones, no siempre.' },
    { t: 'Tomaste la pastilla roja, {name}. Veamos qué tan profundo es el estambre.' },
    { t: 'Ola k ase. ¿Apostando o k ase?' },
    { t: '¿Le jugamos un volado, {g:joven|señorita|joven}? Aquí las probabilidades están en el cartel, no escondidas.' },
    { t: 'Que las probabilidades estén siempre de tu lado. Están escritas en cada mesa, por cierto.' },
    { t: 'La casa es un gato, {name}. Y los gatos siempre caen de pie.', sf: 'La casa es un gato, {name}. Y los gatos siempre caen de pie, cabrón.' },
  ],
  betBig: [
    { t: '¿Miedo, {name}? Porque esa apuesta sí da miedo.' },
    { t: 'Juras solemnemente que tus intenciones no son buenas, ¿verdad?' },
    { t: '¡Al infinito... y más allá del saldo!' },
    { t: 'Houston, tenemos una apuesta grandota.' },
    { t: '¡Esto es Esparta! Digo... esto es la apuesta máxima.' },
    { t: 'Apuesta máxima. El gato contiene la respiración.', sf: '¡Ah, cabrón! ¡Va con todo!' },
  ],
  betSmall: [
    { t: 'Poquito a poquito, como gato subiendo a la repisa.' },
    { t: 'Apuesta de calentamiento. Respeto.' },
    { t: 'Con calma. Los gatos también se estiran antes de saltar.' },
    { t: 'Modo ahorro. Tu abuelita estaría orgullosa.' },
  ],
  betVip: [
    { t: 'Mesa VIP. Aquí hasta el gato trae corbata.' },
    { t: 'Ojos de Gato sobre la mesa. Mi tesssoro...' },
    { t: 'Gemas al centro. Que decida el multiverso.' },
  ],
  betChips: [
    { t: 'Fichas de la casa. Las ganaste peleando: a disfrutarlas.' },
    { t: '¡Jala la cola, {name}! Con cariño, que es de gato.' },
    { t: 'Con fichas salen los premios raros: boletos, accesorios... y a veces un gato.' },
  ],
  spin: [{ t: '¡Ahí va!' }, { t: '¡Gira, gira, gira!' }, { t: 'Evento canónico en tres, dos...' }, { t: 'Que se caiga el vaso...' }],
  winSmall: [
    { t: '¡Tilín! Algo es algo.' },
    { t: '¡GATOOOL! Digo... premio.' },
    { t: 'Diez puntos para tu cartera.' },
    { t: 'Travesura realizada.' },
    { t: '¡Bien jugado, {name}!' },
    { t: '¡Eso, {g:campeón|campeona|campeone}!' },
  ],
  winBig: [
    { t: '¡Vas a necesitar un barco más grande!' },
    { t: '¡Expecto Patrimonium!' },
    { t: '¡Su nivel de suerte es de más de 8,000!' },
    { t: '¡Esto es cine absoluto!' },
    { t: '¡Por los bigotes de Merlín!' },
    { t: '¡Wingardium Monedosa!', sf: '¡No mames, qué suerte tan cabrona!' },
  ],
  jackpot: [
    { t: '¡¿No están entretenidos?! ¡JACKPOT!' },
    { t: 'Yo soy tu... ¡JACKPOT!' },
    { t: '¡HABEMUS JACKPOT! Fumata dorada.' },
    { t: '¡La casa pierde! El gato no lo puede creer.', sf: '¡¿QUÉ PUTAS?! ¡JACKPOOOT!' },
  ],
  refund: [{ t: 'Recuperas una parte. Ni ganas ni pierdes... bueno, pierdes poquito.' }, { t: 'Empate técnico con el universo. Casi.' }],
  lose: [
    { t: 'Fue sin querer queriendo.' },
    { t: 'Hasta la vista, doblones.' },
    { t: 'Era una apuesta insumergible. Como cierto barco.' },
    { t: 'Obliviate. Ya olvidaste esa tirada.' },
    { t: 'Así es el azar, {name}. Cada tirada es independiente.' },
    { t: '¡Declaro bancarrota! No funciona así, pero se siente bien.' },
    { t: 'El vaso no se cayó. El gato lo mira. Lo pensará.', sf: 'Te quedaste sin nada. Ni pa\' los chicles.' },
  ],
  loseStreak: [
    { t: 'Jugamos como nunca, perdimos como siempre.' },
    { t: 'Que no panda el cúnico. Respira.' },
    { t: 'El Capi sugiere un té. Y quizá ir a pelear un rato.' },
    { t: 'Recuerda: la casa tiene ventaja. Está escrito en el cartel.' },
    { t: 'Tómate un descanso, {name}. Las fichas no se van a ningún lado.' },
  ],
  winStreak: [
    { t: '¡Racha! ¿Quién eres y qué le hiciste a la suerte?' },
    { t: '¡Estás que ardes, {name}! Literalmente, hay humo.' },
    { t: 'Tres seguidas. Disfrútalo: cada tirada sigue siendo independiente.' },
  ],
  poor: [{ t: 'No te alcanza, {name}. Las fichas se ganan peleando y subiendo el Reino.' }, { t: 'Sin fondos. Ve a ganar unas batallas y vuelve.' }],
  gacha: [{ t: 'Abriendo el portal... no toques nada.' }, { t: '¡Accio gato!' }, { t: 'Invocación en curso. Se escucha música sospechosa.' }, { t: '¡Alohomiau!' }],
  gachaX10: [{ t: 'Diez de golpe. Qué valiente.' }, { t: '¡Diez cartas! Que el multiverso reparta.' }],
  gachaEpic: [{ t: '¡¿QUÉEE?! *zoom* *zoom* ¡Eso brilla rosa!' }, { t: '¡Épico! El portal está de buenas.' }],
  gachaLegend: [{ t: '¡LEGENDARIO! ¿De qué universo vienes?' }, { t: '¡HABEMUS MICHI! Fumata dorada.', sf: '¡HABEMUS MICHI, A HUEVO!' }],
  gachaHolo: [{ t: '¡HOLO! Este gato está súper roto. Que nadie lo nerfee.' }, { t: 'Brillo holográfico detectado. Esto es un evento canónico.' }],
  gachaMeh: [{ t: 'Bueno... los pescaditos también cuentan.' }, { t: 'Ni modo. El contador de garantía sube, que es lo importante.' }],
  caja: [{ t: 'Excelente elección. La casa agradece.' }, { t: '¡Vendido! Canje directo, cero suspenso.' }],
  accessory: [{ t: '¡Qué elegancia, por favor! Ese gato ya no saluda.' }, { t: 'Bien vestido, bien pagado. Así funciona el multiverso.' }],
  roulette: [{ t: 'Hagan sus apuestas... ¡no va más!' }, { t: 'La bolita decide. La bolita no tiene sentimientos.' }],
  exit: [{ t: 'Vuelve pronto. O no. Somos gatos, nos da igual.' }, { t: '¡Hasta luego, {name}! Saluda al Capi de mi parte.' }],
  autoStart: [
    { t: 'Piloto automático. Tú relájate, yo jalo la cola.' },
    { t: 'Modo automático. Si quieres parar, dale a PARAR. O al Espacio.' },
    { t: 'Que la máquina trabaje. Tú pon cara de interesante.' },
  ],
  autoSpeed: [{ t: 'Más rápido. Como gato con zoomies.' }, { t: 'Acelerando. Agárrate los bigotes.' }],
  autoTurbo: [{ t: 'x10. Rapidísimo, pero los resultados se ven. Yo no hago trampa ni a esta velocidad.' }, { t: 'Diez veces más rápido. El gato ya ni parpadea.', sf: 'x10, cabrón. Ni pestañees.' }],
  escape: [
    { t: '¡Uy! Se nos escapó un legendario. Dejó huellas: el portal ya lo está buscando.' },
    { t: '¡Lo viste? ¡Era LEGENDARIO! Se fue... pero el portal se quedó caliente.' },
    { t: 'Casi, {name}. CASI. El contador saltó y la racha está prendida.', sf: '¡Nooo, se peló el cabrón! Pero dejó el rastro.' },
  ],
  hot: [{ t: 'Racha caliente: los legendarios salen más. Aprovecha ahorita.' }, { t: 'El portal está tibio, tibio... ¡caliente!' }],
  candy: [
    { t: 'La casa te debía una. Toma un boleto, invita la casa.' },
    { t: 'Tanta mala suerte me dio pena. Ahí va un boleto de cortesía.' },
    { t: 'Política de la casa: nadie se va con las manos vacías. Boleto gratis.' },
  ],
  firstLegend: [{ t: '¡Tu PRIMER legendario! La suerte de principiante existe y está escrita en el cartel.' }, { t: 'Primer legendario. Esto se enmarca.' }],
  gachaMythic: [{ t: '¡¿MÍTICO?! Cierren el casino. No, mejor no, pero... ¡MÍTICO!' }, { t: 'Un MÍTICO. El multiverso se acaba de quedar sin aliento.', sf: '¡MÍTICO, A HUEVO! ¡Que alguien grabe!' }],
  riskHigh: [{ t: 'Alto riesgo. Me gusta tu estilo.' }, { t: 'Tres boletos de golpe. Ojalá traigas suerte de gato negro.' }],
  riskAll: [{ t: 'TODO O NADA. El portal te mira con respeto.' }, { t: 'Diez boletos a una sola carta. Qué valor. Qué locura.' }],
  eterno: [{ t: 'Modo ETERNO. Veinte segundos. Después, la moneda al aire más cara del multiverso.' }, { t: 'Ay, {name}. Esto no se apaga solo. Bueno, sí: explotando.', sf: 'ETERNO. Agárrate, que esta madre va a reventar.' }],
  eternoHot: [{ t: '¡Está hirviendo! Todavía puedes enfriarla, ¿eh?' }, { t: 'Huele a cable quemado. Me encanta.' }, { t: 'Si oyes un silbido, es el vapor. Si no oyes nada, ya explotó.' }],
  eternoWin: [{ t: '¡GANASTE EL ETERNO! La máquina explotó y de los escombros salió un gato. Así funciona la física.' }, { t: 'Cara. Te quedas con todo y con un gato nuevo. La casa llora en silencio.' }],
  eternoLoss: [{ t: 'Cruz. Todo a cero. Tus gatos siguen aquí, tu barco también. Tu cartera... ya no.' }, { t: 'Perdiste el ETERNO. Era un 50/50 y salió la otra mitad. Así de simple, así de cruel.', sf: 'A cero. Ni modo. Así es el ETERNO, carnal.' }],
  eternoStop: [{ t: 'La enfriaste a tiempo. Sin premio, sin susto. Muy maduro de tu parte.' }, { t: 'Prudencia felina. Te llevas lo que ganaste tirando y ya.' }],
  plinko: [{ t: 'Suelta la croqueta. Los clavos deciden, yo solo miro.' }, { t: 'Plin, plin, plin... ¿a dónde caerá?' }, { t: 'Doce clavos, doce volados. Física pura, cero magia.' }],
  dice: [{ t: 'Don Cubilete tira con la pata izquierda. Dice que da suerte.' }, { t: 'Duelo de dados. Al mejor de tres. Empate gana la casa, ya sabes.' }],
  diceWin: [{ t: '¡Le ganaste a Don Cubilete! Va a estar de malas toda la semana.' }, { t: 'Duelo ganado. Esos dados te quieren.' }],
  diceLose: [{ t: 'Don Cubilete se lleva el duelo. Ni sonríe, el muy profesional.' }, { t: 'Perdiste el duelo. Los dados no tienen memoria; Don Cubilete sí.' }],
  scratch: [{ t: 'Rasca, rasca. Con la uña, no con los dientes.' }, { t: 'El boleto ya está impreso: lo que hay abajo ya estaba ahí.' }],
  boxes: [{ t: 'Nueve cajas. Ninguna está maldita. Bueno, casi ninguna.' }, { t: 'Elige con el corazón. O con la pata, da igual.' }],
  bingo: [{ t: '¡Bolitas al aire! Treinta números, trece salen.' }, { t: 'Bingo exprés: ni tiempo de pedir un café.' }],
  hilo: [{ t: '¿Mayor o menor? Ojo: empate pierde.' }, { t: 'Las cartas no tienen memoria. Tú tampoco deberías.' }],
  hiloStreak: [{ t: '¡Qué racha! Cobrar también es una jugada, ¿eh?' }, { t: 'El bote crece. Mi comisión también. Así es esto.' }],
};

const CHAT: Partial<Record<Ev, string[]>> = {
  enter: ['holiii', 'llegó {name}!!', 'buenas buenas', '¿hoy sí sale el jackpot?', 'CASINO TIME', 'holi chat'],
  betBig: ['NO PUEDE SER', 'ojo ojo ojo', 'chat, está loc{g:o|a|e}', 'esto va a salir mal', 'confía', 'todo o nada'],
  betSmall: ['modo tacaño jaja', 'con cuidadito', 'respeto', 'la mínima, clásico'],
  betChips: ['fichas gratis = felicidad', 'jala la cola!!', 'vamos por el gato'],
  winSmall: ['ezzz', 'bien ahí', 'algo es algo', '+1', 'vamos'],
  winBig: ['CLIP', 'CLIP ESO', 'QUÉ LOCURA', '¡¿PERO QUÉ?!', 'madre mía, madre mía', 'bua, chaval'],
  jackpot: ['JACKPOOOOT', 'CLIP CLIP CLIP', 'LLAMEN A LA POLICÍA', 'NO PUEDE SER, NO PUEDE SER', 'HISTÓRICO', 'me tiembla todo'],
  lose: ['F', 'F en el chat', 'nooo', 'auch', 'se veía venir', 'ay no, ay no, ay no', 'tranqui, tranqui'],
  refund: ['casi casi', 'al menos algo', 'meh'],
  loseStreak: ['chat, ¿lo dejamos?', 'toca descanso', 'F x3', 'mejor vamos a pelear un rato'],
  winStreak: ['ESTÁ ON FIRE', 'racha!!!', 'no lo paren'],
  gacha: ['suerte!!', 'que salga holo', 'dorado dorado dorado', 'pity check'],
  gachaX10: ['DIEZ!!', 'que salga algo bueno', 'suerte suerte suerte'],
  gachaEpic: ['ROSA ROSA', 'eso brilla', 'buenaaa'],
  gachaLegend: ['QUÉ SUERTE', 'DORADO!!!', 'CLIP'],
  gachaMythic: ['MÍTICOOOO', 'NO PUEDE SER', 'CLIP CLIP CLIP', 'HISTÓRICO'],
  firstLegend: ['EL PRIMERO!!', 'suerte de principiante', 'CLIP'],
  escape: ['NOOO SE ESCAPÓ', 'lo vi lo vi', 'casi!!!', 'está cerca, chat'],
  hot: ['racha caliente!!', 'ahora sí', 'dale dale'],
  candy: ['la casa invita jaja', 'boleto gratis', 'eso sí es servicio'],
  autoStart: ['modo auto', 'a ver cuánto dura', 'piloto automático'],
  autoTurbo: ['TURBO', 'qué velocidad', 'no veo nada jaja'],
  riskAll: ['TODO O NADA', 'está loc{g:o|a|e}', 'confía'],
  riskHigh: ['valiente', 'vamos vamos'],
  gachaHolo: ['ESTÁ ROTÍSIMO', 'nerf ya', 'HOLO HOLO HOLO', 'CLIP'],
  gachaMeh: ['pescaditos otra vez jaja', 'F', 'el pity sube'],
  caja: ['buena compra', 'inteligente'],
  roulette: ['rojo rojo rojo', 'negro!!', 'al cero, confía'],
  eterno: ['ETERNOOO', 'está loc{g:o|a|e}', 'NO LO HAGAS', 'confía', 'clip esto ya'],
  eternoHot: ['SE VA A QUEMAR', 'ENFRÍALA', 'aguanta aguanta', 'huele a quemado'],
  eternoWin: ['NO PUEDE SER', 'CLIP CLIP CLIP', 'HISTÓRICO', 'ganó el eterno!!!'],
  eternoLoss: ['F', 'F F F', 'nooo todo a cero', 'el eterno no perdona', 'F en el chat'],
  eternoStop: ['sabio', 'cobarde jaja', 'buena decisión'],
  plinko: ['plin plin plin', 'a la orilla!!', 'centro no, centro no'],
  dice: ['vamos dados', 'don cubilete es tramposo (no lo es)', 'seis seis seis'],
  diceWin: ['LE GANÓ', 'fuera don cubilete', 'ezzz'],
  diceLose: ['F', 'don cubilete invicto', 'otra'],
  scratch: ['rasca!!', 'gato negro gato negro', 'que salga el x100'],
  boxes: ['la de en medio', 'la dorada!!', 'abre la tres'],
  bingo: ['BINGO', 'línea línea', 'me falta uno'],
  hilo: ['mayor!!', 'menor!!', 'cobra ya'],
  hiloStreak: ['COBRA', 'NO COBRES', 'qué racha', 'está on fire'],
};

export const CHAT_USERS: [string, number][] = [
  ['michi_420', 0xff7ab8],
  ['atunlover', 0x00e5ff],
  ['gatita.exe', 0xffc94a],
  ['capi_oficial', 0x8fe388],
  ['ronroneo99', 0xb7a4c7],
  ['bigotes_tv', 0xff6a1a],
  ['pelusa_gamer', 0x7fd8ff],
  ['vaso_caido', 0xffe14a],
  ['siesta_pro', 0xa7e8d7],
  ['doblon_hunter', 0xffd77a],
  ['canelo_fan', 0xff9a3a],
  ['pixel_gato', 0x43e8ff],
];

const recent: string[] = [];
function pickFresh<T extends { t: string } | string>(list: T[]): T {
  const key = (x: T) => (typeof x === 'string' ? x : x.t);
  const fresh = list.filter((x) => !recent.includes(key(x)));
  const pool = fresh.length ? fresh : list;
  const it = pool[Math.floor(Math.random() * pool.length)];
  recent.push(key(it));
  if (recent.length > 18) recent.shift();
  return it;
}

export function hostLine(ev: Ev): string {
  const l = pickFresh(H[ev]);
  return gtxt(settings.sinFiltro && l.sf ? l.sf : l.t);
}
/** Parte II (from H32): `registro_000` writes ONE odd line per session, rarely, and never answers */
let registroSpoke = false;
function registroLine() {
  if (registroSpoke || !folioRevealed() || Math.random() >= REGISTRO_CHAT_CHANCE) return null;
  registroSpoke = true;
  return { user: REGISTRO_CHAT_USER, color: REGISTRO_CHAT_COLOR, msg: REGISTRO_CHAT[Math.floor(Math.random() * REGISTRO_CHAT.length)] };
}

export function chatLines(ev: Ev, n = 2): { user: string; color: number; msg: string }[] {
  const list = CHAT[ev];
  if (!list?.length) return [];
  const out: { user: string; color: number; msg: string }[] = [];
  for (let i = 0; i < n; i++) {
    const [user, color] = CHAT_USERS[Math.floor(Math.random() * CHAT_USERS.length)];
    out.push({ user, color, msg: gtxt(pickFresh(list)) });
  }
  const odd = registroLine();
  if (odd) out[out.length - 1] = odd;
  return out;
}
