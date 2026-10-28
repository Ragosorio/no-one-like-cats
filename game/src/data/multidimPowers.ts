/**
 * Parte III · the MULTIDIMENSIONAL powers (2026-10-28, the owner: «que sus poderes también sean únicos, y muy poderosos»).
 * One per Multidimensional cat: what the Catdex shows (panels/collection) and what the battle does (battle/multidim.ts,
 * MD_ULTS; agent PODERES). The battle side keys off the same species id, and the ultimate's name in especies.json is
 * the power's name (tests/multidimPowers.test.ts keeps the three in step). Design and numbers:
 * docs/part-iii/mecanicas-v2/07-poderes-multidimensionales.md. Text: Latin American Spanish, the player's voice («tú»).
 */
export interface MultidimPower {
  /** the power's name, e.g. «DONUT OF DESTINY!» (the ultimate's shout) */
  name: string;
  /** one line for the card / chips (≤ 60 characters) */
  short: string;
  /** what it does, in full (2–3 short sentences) */
  text: string;
}

/** the rule every power shares (one line, for the Catdex under the power) */
export const MULTIDIM_POWER_NOTE = 'Su poder solo despierta en tu tripulación: en un barco rival pelea con su ulti de siempre.';

export const MULTIDIM_POWERS: Record<string, MultidimPower> = {
  x_homiau: {
    name: 'DONUT OF DESTINY!',
    short: 'Dona gigante que rebota 4 veces + suerte de sofá',
    text: 'Una dona gigante cae del cielo donde apuntas y rebota cuatro veces por su barco. Desde ahí, SUERTE DE SOFÁ: uno de cada dos tiros fallados de tu tripulación rebota en el agua y pega igual.',
  },
  x_gatarana: {
    name: 'TELARAÑAZO!',
    short: 'Red total: todo Enraizado y sus gatos pierden un turno',
    text: 'Cuatro bolas de telaraña sobre sus camarotes y cañones, y la red cubre todo su barco: todo queda Enraizado, sus cañones se pegan y cada gato suyo queda ENREDADO (pierde su próximo turno).',
  },
  x_murciegato: {
    name: 'NIGHT SHIFT!',
    short: 'Bumeranes de ida y vuelta + 2 turnos de noche',
    text: 'Apaga la luz: tres espinas-rang a sus mejores blancos que pegan de ida y de vuelta. Y la noche se queda: 2 turnos su tripulación queda ECLIPSADA (sin vista previa ni críticos, apunta mucho peor) y los tiros de tu tripulación vuelan sin verse y apuñalan.',
  },
  x_supersiames: {
    name: 'NINE LIVES WAVE!',
    short: 'Onda que cruza todo su barco; al 50 % se vuelve SÚPER',
    text: 'Una onda gigante en línea recta que atraviesa TODO su barco a la altura del núcleo y deja Ardiendo. TRANSFORMACIÓN: la primera vez que él o tu barco bajan de la mitad, al empezar tu turno se vuelve SÚPER: se cura 35 %, se le llena la barra (la onda vuelve si ya la usó) y pega ×1.5 el resto de la batalla.',
  },
  x_harrygatter: {
    name: 'WHISKER WAND!',
    short: 'Tres hechizos: desarma, desmaya y BOMBARDA al núcleo',
    text: 'Escribe tres hechizos en el aire: ¡EXPELLIARMIAU! (sus cañones quedan desarmados 2 turnos), ¡DESMAYUS! (su gato más fuerte se desmaya y pierde su próximo turno) y ¡BOMBARDA! (un hechizo teledirigido a su núcleo que lo deja Maldito).',
  },
  x_gatomalo: {
    name: 'TOPE SUICIDA!',
    short: 'Tope sobre un camarote + 3 turnos de flow: tiros con eco',
    text: 'Se tira desde las cuerdas sobre el camarote del gato más cercano a donde apuntas: un azotón enorme que aturde. Y luego EL FLOW: tus próximos 3 turnos, cada tiro de un gato tuyo trae su eco (un segundo tiro a la mitad de fuerza).',
  },
  x_tailorswift: {
    name: 'NEW ERA!',
    short: 'Tres ondas y la gira: 5 eras, un poder distinto por turno',
    text: 'Tres ondas en abanico que aturden, y empieza la gira: tus próximos 5 turnos son cinco eras, una por turno. FEARLESS (todos tus tiros ×1.3), RED (dejan Ardiendo), 1989 (+25 % de barra a tu tripulación), REPUTATION (dejan Maldito) y MIDNIGHTS (su tripulación queda Eclipsada).',
  },
  x_billiebigotish: {
    name: 'LULLABY!',
    short: 'Canción de cuna: todos sus gatos se duermen 2 turnos',
    text: 'Un susurro cruza su barco y todos sus gatos se DUERMEN 2 turnos, hasta los Sordos y los de Sonido (un susurro no es ruido). El que recibe un golpe se despierta: tú eliges a quién le pegas.',
  },
  x_vangato: {
    name: 'STARRY SWIRL!',
    short: '11 estrellas en espiral + un remolino que gira sus tiros',
    text: 'Pinta la noche estrellada sobre su barco: once estrellas caen en espiral (luz que perfora) y el REMOLINO se queda encima 2 turnos: cada tiro suyo que lo cruza sale girando.',
  },
  e_comecroquetas: {
    name: 'POWER PELLET!',
    short: 'Se come su barco en laberinto; sus gatos, fantasmas ×2',
    text: 'WAKA: se come su barco como un laberinto (por una cubierta, baja, regresa, baja y sigue: cada celda que cruza). Y sus gatos se vuelven fantasmas azules: hasta tu turno después del próximo, tus golpes contra ellos pegan ×2 y los de ellos ×0.5.',
  },
  l_bigoton: {
    name: 'PRIDE FLASH!',
    short: 'Rayo doble a su gato más fuerte; si lo noquea, repite',
    text: 'Junta las palmas y suelta un rayo doble directo al camarote de su gato más fuerte, su «rival», atravesando todo lo que hay en medio (deja Ardiendo). El rival se come el destello entero, sin escudos. Si cae: «¡te dejé ganar!», y la ulti vuelve con media barra.',
  },
  e_ovillo: {
    name: 'TANGLE TIME!',
    short: 'Cuatro brazos atrapan sus 4 mejores módulos 2 turnos',
    text: 'Cuatro brazos mecánicos agarran sus cuatro módulos más valiosos y aprietan: un cañón no dispara 2 turnos, el gato de un camarote queda atrapado 2 turnos y el núcleo, el escudo o la sala de invocación quedan Malditos (×1.5).',
  },
  e_estambre: {
    name: 'YARNSTORM!',
    short: 'Puño que perfora 8 celdas; se rearma con 2 escudos',
    text: 'El estambre se vuelve un puño gigante que atraviesa 8 celdas y las deja deshilachadas (Malditas, ×1.5). Y se vuelve a enrollar: recupera la mitad de su vida y se envuelve en 2 capas de lana (2 escudos).',
  },
  r_gatarana_noir: {
    name: 'RAINY NIGHT!',
    short: 'Lluvia en blanco y negro: todo les pega súper efectivo',
    text: 'El mundo se vuelve blanco y negro: la lluvia empapa todo su barco, tres telarañas grises caen sin verse (apuñalan) y su barco y sus gatos pierden el color este turno y el siguiente: todo les pega súper efectivo (×1.5).',
  },
  r_gatarana_blanca: {
    name: 'BALLET DROP!',
    short: 'Péndulo por sus camarotes: aturde hasta a los Sordos',
    text: 'Baja colgada de un hilo y se balancea de punta a punta de su barco como un péndulo, pasando por sus camarotes y tocando la batería contra todo lo que toca. Cada camarote que cruza queda ATURDIDO, hasta los Sordos y los de Sonido (la batería no se oye: se siente).',
  },
  r_gatarana_2099: {
    name: 'NEON CLAW!',
    short: '3 zarpazos de neón; tu próximo turno, 2 gatos más disparan',
    text: 'Tres zarpazos de neón cruzan su barco en diagonal, de arriba abajo, y todo lo que tocan queda Cargado. Y desde 2099: en tu próximo turno disparan dos gatos más de tu tripulación.',
  },
  r_gatemson: {
    name: 'FRONT PAGE!',
    short: '¡AMENAZA!: su gato con más barra la pierde y recibe ×1.5',
    text: 'Tres periodicazos y la portada: «¡ESTE GATO ES UNA AMENAZA!». Su gato con más barra la pierde toda y queda como AMENAZA este turno y el siguiente (recibe ×1.5). Con lo que vende el periódico, tu tripulación gana +30 % de barra.',
  },
  l_gatzilla: {
    name: 'KAIJU NAP!',
    short: 'Se acuesta en su cubierta: la aplasta y los hunde',
    text: 'Se acuesta encima de su barco: aplasta la cubierta entera (lo de arriba de cada columna, y lo de abajo a la mitad), apachurra a los gatos de arriba y con su peso los hunde (2 brechas: se inundan). Después se echa una siesta: tarda un turno más en volver a disparar.',
  },
  l_emiau: {
    name: 'MIC DROP!',
    short: 'Ocho barras que aturden + 2 turnos sin ulti para ellos',
    text: 'Ocho barras a toda velocidad: ocho ondas cortas, una a cada uno de sus mejores módulos, que atraviesan paredes y aturden. Y suelta el micrófono: SIN RÉPLICA, sus gatos no pueden usar su ulti en sus próximos 2 turnos.',
  },
  c_gritito: {
    name: 'PANIC WAVE!',
    short: 'Grito que cruza su barco; el pánico aturde al primer golpe',
    text: 'Un grito tan largo que dobla el cielo: una onda enorme cruza su barco por la cubierta donde hay más gatos y aturde. Y el PÁNICO se contagia: este turno y el siguiente, el primer golpe que recibe cada gato suyo lo aturde (¡AAAH!), hasta a los Sordos.',
  },
  e_gatoconda: {
    name: 'SFUMATO!',
    short: 'Te sigue con la mirada: sus tiros van hacia ella, a la mitad',
    text: 'Tres miradas lentas que rebotan, y sus ojos te siguen: sus próximos 2 turnos, cada tiro de ellos se desvía hacia SU camarote, y ella y su camarote reciben la mitad (el sfumato lo difumina todo).',
  },
  e_sonrisa: {
    name: 'VANISHING GRIN!',
    short: 'Tres mordidas que BORRAN y una sonrisa que se traga tiros',
    text: 'Desaparece toda menos la sonrisa: tres mordidas BORRAN sus tres mejores módulos, menos el núcleo (nunca se reparan; lo que sostiene el barco queda en 1). Y la sonrisa se queda flotando frente a tu barco 2 turnos: se traga hasta 3 tiros de ellos.',
  },
  e_sirsimon: {
    name: 'CHAIN RATTLE!',
    short: 'Cadenas: lo que recibe uno, lo sienten todos; núcleo Maldito',
    text: 'Tres cadenazos invisibles (apuñalan) y sus cadenas atan a toda su tripulación este turno y el siguiente: lo que recibe un gato, los demás lo reciben a la mitad. Y LA MANCHA QUE NUNCA SE QUITA: su núcleo queda Maldito (×1.5) el resto de la batalla.',
  },
  r_garbancito: {
    name: 'TINY BUT BRAVE!',
    short: 'Se mete al barco y BORRA el núcleo; nadie le puede pegar',
    text: 'Nadie lo ve llegar (no hay trayectoria): se mete a su barco y rocía su NÚCLEO desde adentro. Cada celda del núcleo pierde el 60 % de lo que le queda y queda BORRADA (nunca se repara). Y sus próximos 2 turnos nadie le puede pegar.',
  },
  e_maneki: {
    name: 'LUCKY SWEEP!',
    short: 'Nada es gratis: lo que te rompan en 2 turnos, lo pagan',
    text: 'Tres monedas koban que rebotan, su pata llama a la suerte (+20 % de barra a tu tripulación) y NADA ES GRATIS: sus próximos 2 turnos, todo lo que rompan de tu lado se anota en su libreta. Después pagan el 80 % en sus mejores módulos (hasta un cuarto de su barco), si ella sigue en pie.',
  },
};

export function multidimPower(species: string): MultidimPower | null {
  return MULTIDIM_POWERS[species] ?? null;
}
