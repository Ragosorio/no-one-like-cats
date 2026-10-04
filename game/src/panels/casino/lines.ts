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
  | 'exit';

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
  gachaHolo: ['ESTÁ ROTÍSIMO', 'nerf ya', 'HOLO HOLO HOLO', 'CLIP'],
  gachaMeh: ['pescaditos otra vez jaja', 'F', 'el pity sube'],
  caja: ['buena compra', 'inteligente'],
  roulette: ['rojo rojo rojo', 'negro!!', 'al cero, confía'],
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
export function chatLines(ev: Ev, n = 2): { user: string; color: number; msg: string }[] {
  const list = CHAT[ev];
  if (!list?.length) return [];
  const out: { user: string; color: number; msg: string }[] = [];
  for (let i = 0; i < n; i++) {
    const [user, color] = CHAT_USERS[Math.floor(Math.random() * CHAT_USERS.length)];
    out.push({ user, color, msg: gtxt(pickFresh(list)) });
  }
  return out;
}
