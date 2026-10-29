/**
 * After the Parte III · the post MULTIDIMENSIONAL powers (agent PODERES-2, 2026-10-28). One per post Multidimensional
 * (docs/post-p3/04-roster.json → post.power, DISEÑO): what the Catdex shows and what battle/multidimPost does. Keyed by
 * species id, registered ahead of the species (data/postp3/especies.json gets them as their art lands): data/multidimPowers.ts
 * merges them. Numbers and changes: docs/post-p3/agentes/PODERES-2.md. Latin American Spanish, the player's voice («tú»).
 * Tanda 2 (the 25 at the end, agent PODERES-3): written from the roster by scratchpad/poderes3/gen_data_t2.py; changes in
 * docs/post-p3/agentes/PODERES-3.md.
 */
import type { MultidimPower } from './multidimPowers';

export const MULTIDIM_POWERS_POST: Record<string, MultidimPower> = {
  xp_gomitas: {
    name: 'CATLING GUN!',
    short: '12 puñetazos + tu tripulación de hule 2 turnos',
    text: 'Doce puñetazos de chicle en abanico por toda su cubierta. Y tu tripulación se vuelve DE HULE 2 turnos: los rayos de Tormenta y los golpes de Tierra y de Sonido les rebotan sin hacerles nada (ni daño ni estados).',
  },
  xp_kagebunyan: {
    name: 'NYAN CLONE PARADE!',
    short: 'Tres clones-señuelo que se tragan tiros y explotan de vuelta',
    text: 'Tres clones de sombra aparecen en tu cubierta, uno sobre cada camarote tuyo. Cada clon se traga entero el siguiente tiro que caiga en su camarote y explota de regreso contra su barco. Duran 3 turnos o hasta reventar.',
  },
  xp_gatojo: {
    name: 'THE MIAURLD!',
    short: 'El tiempo se para: pierden un turno; tus tiros caen ×1.3',
    text: 'Detiene el tiempo: su barco entero (gatos y cañones) se congela durante su siguiente turno, y tus tiros de este turno y del siguiente se quedan flotando en el aire. Cuando el tiempo vuelve, caen TODOS a la vez con ×1.3.',
  },
  xp_unzarpazo: {
    name: 'SERIOUS PAW!',
    short: 'Borra entero el módulo que apuntes (el núcleo, a la mitad)',
    text: 'Un solo zarpazo en serio: el módulo donde apuntas DESAPARECE entero, sin importar su vida (el núcleo pierde la mitad de lo que le queda). Después se aburre y no actúa su siguiente turno.',
  },
  xp_pegaso: {
    name: 'PEGASUS MEOWTEOR!',
    short: 'Cien meteoros que pegan más mientras más te han pegado',
    text: 'Cien meteoros de pata caen por su barco, y ARDE TU COSMOS: el daño se multiplica por lo que ha sufrido tu tripulación. Con tus gatos a la mitad de vida pega ×1.75; casi muertos, hasta ×2.5.',
  },
  xp_michiatom: {
    name: 'INFINITE PITCH SHOT!',
    short: 'Un balón que tarda 2 turnos y llega ×3 con el doble de radio',
    text: 'Patea y el balón se va… por una cancha que no se acaba: tarda DOS turnos en llegar (lo ves volar en el cielo). Llega con ×3 de daño y el doble de radio al módulo que apuntaste; si ese módulo ya no existe, se clava en el más cercano.',
  },
  xp_mazingato: {
    name: 'ROCKET PAWNCH!',
    short: 'Puños cohete; 3 turnos nadie quita más de 20 % a tus gatos',
    text: 'Dos puños cohete y un rayo de pecho que deja Ardiendo. Y su ARMADURA DE ALEACIÓN se reparte: 3 turnos, ningún golpe le quita a un gato tuyo más del 20 % de su vida máxima.',
  },
  xp_ryumiau: {
    name: 'NOTE OF NINE LIVES!',
    short: 'Anota a su gato con más vida: en 3 turnos cae',
    text: 'Escribe un nombre: el gato rival con más vida queda ANOTADO. En 3 turnos, cae, pase lo que pase. Un capitán jefe no cae: pierde el 40 % de su vida máxima. Si el anotado cae antes por otra cosa, la libreta pasa al siguiente con más vida.',
  },
  xp_miaunya: {
    name: 'TELEPATHY PEANUTS!',
    short: 'Tus gatos esquivan los tiros de gato 2 turnos',
    text: 'Lee la mente de su tripulación: los próximos 2 turnos rivales, tus gatos ven venir cada tiro de gato y lo esquivan (no les quita vida; la estructura sí recibe el golpe). Además, revela la vida y la barra de todos.',
  },
  xp_yugi: {
    name: 'FORBIDDEN FIVE!',
    short: 'Junta 5 piezas con sus tiros; con 5, pega a todo su barco',
    text: 'Juega todas sus PIEZAS (cada tiro normal que conecta le da una, hasta 5): pega ×(1 + 0.4 por pieza). Con las cinco, el gigante prohibido se arma entero y le da un golpe a CADA módulo de su barco.',
  },
  xp_gatote: {
    name: 'CHARGE OF THE WINDMILLS!',
    short: 'Carga que cruza la fila entera; ×2 si vas perdiendo',
    text: 'Carga con la lanza en línea recta por toda la fila donde apuntas y la atraviesa de punta a punta. Si su barco tiene más estructura que el tuyo (en %), la carga pega ×2: entre más imposible la pelea, más fuerte. Si la lanza toca un mástil o un motor, «¡GIGANTE!»: se le queda clavada y él no actúa su próximo turno.',
  },
  xp_sherlock: {
    name: 'THE GAME IS AFOOT!',
    short: 'Marca 3 puntos débiles y tu andanada va directo a ellos',
    text: 'Deduce: revela todo su barco y MARCA sus 3 puntos más débiles (crítico garantizado). Tu siguiente andanada no apunta donde pegó tu gato: cada cañón va directo a uno de esos 3 puntos.',
  },
  xp_frankengato: {
    name: 'SPARK OF NINE LIVES!',
    short: 'Revive a tu mejor gato caído con 50 % y la barra llena',
    text: 'Cae un rayo en tu barco: el gato tuyo caído (KO) con más poder se levanta con 50 % de vida y la barra llena. Si nadie ha caído, el rayo salta en cadena por 5 celdas suyas y las deja Cargadas.',
  },
  xp_gatula: {
    name: 'CHILDREN OF THE NIGHT!',
    short: 'Muerde a todos sus gatos y tu tripulación se cura con eso',
    text: 'Una nube de murciélagos muerde a TODOS sus gatos y todo lo que les quita se reparte como vida entre tu tripulación. Si tu tripulación ya está llena, lo que sobra se vuelve escudos.',
  },
  xp_ahab: {
    name: 'THE WHITE FISH!',
    short: 'Arpón amarrado: su módulo más grande sangra 3 turnos',
    text: 'Arponea su módulo más grande (nunca el núcleo) y lo amarra con la cuerda. Los 3 turnos siguientes jala: el módulo pierde 10 %, 20 % y 30 % de su vida máxima, uno por turno; si se rompe, la cuerda salta al siguiente módulo más grande.',
  },
  xp_pinomichi: {
    name: 'NOSE OF TRUTH!',
    short: 'Narizazo: perfora +1 celda por turno que esperes (hasta 8)',
    text: 'Su nariz crece con cada turno que NO usa la ulti («ahorita no la uso», dice, y miente): +1 celda de perforación por turno, hasta 8. La ulti es un narizazo recto que atraviesa todas esas celdas y las deja Enraizadas.',
  },
  xp_michipulin: {
    name: 'SHRINK PILL!',
    short: 'Encoge a su gato más fuerte 3 turnos: pega ×0.3',
    text: 'Se iba a tomar su pastilla para encoger… y se la avienta a ellos: su gato con más poder queda CHIQUITO 3 turnos (pega ×0.3 y recibe ×1.3). De paso, un mazazo chillón lo deja aturdido 1 turno.',
  },
  xp_barril: {
    name: 'BARREL HIDEOUT!',
    short: 'Sus ultis se estrellan en el barril 2 turnos',
    text: 'Se mete al barril: 2 turnos, cada ulti que usen ellos se estrella contra el barril y no hace nada (la barra se les gasta igual). Al salir, avienta la pelota contra el gato que usó la última ulti: ×1.5.',
  },
  xp_miaufalda: {
    name: 'WORLD BANDAGE!',
    short: 'Repara 25 % todo tu barco y rearma un módulo destruido',
    text: 'Le pone una curita al mundo: TODOS los módulos de tu barco recuperan el 25 % de su vida máxima, y tu módulo destruido de más valor vuelve a funcionar con lo que quede de él, a la mitad de vida. Lo borrado por el Vacío sigue borrado (ni ella puede).',
  },
  xp_condorgato: {
    name: 'BACKFLIP PUNCHLINE!',
    short: '3 turnos: el último cañón de tu andanada pega ×3 y aturde',
    text: 'Cuenta un chiste tan malo que todos se van de espaldas: los próximos 3 turnos, el ÚLTIMO cañón de cada andanada tuya es el REMATE: pega ×3 y deja patas arriba (aturdido) al gato que toque.',
  },
  xp_esponja: {
    name: 'ORDER UP!',
    short: 'Llena la barra de ulti de toda tu tripulación',
    text: 'Grita que está listo… y lo contagia: TODA tu tripulación queda con la barra de ulti LLENA. Y de paso, una lluvia de burbujas deja Mojado su barco.',
  },
  xp_rick: {
    name: 'PORTAL RUN!',
    short: 'Portales: 2 turnos tus tiros no fallan',
    text: 'Abre portales arriba de cada blanco: los próximos 2 turnos, todos los tiros de tu tripulación (gatos y cañones) salen de un portal justo encima de donde apuntaron: sin viento, sin arco y sin fallar.',
  },
  xp_miaang: {
    name: 'FOUR-ELEMENT STATE!',
    short: 'Cuatro elementos en un punto: todas las reacciones a la vez',
    text: 'Se le ilumina la flecha: cuatro golpes en el mismo lugar, uno de cada elemento (Agua, Tierra, Fuego y Tormenta). Se disparan TODAS las reacciones posibles entre ellos y el gato que esté ahí queda aturdido.',
  },
  xp_miauby: {
    name: 'UNMASKED!',
    short: 'Les quita escudos, reglas y pozos; sus barreras, 2 turnos',
    text: '¡Le quita la máscara al villano!: borra de su lado TODO lo que los ayuda: escudos de gatos, refuerzos, reglas de campo, pozos y remolinos; y sus barreras (burbuja, escudo, capas arcanas) quedan apagadas 2 turnos.',
  },
  xp_blumiau: {
    name: 'THREE PAW CLUES!',
    short: 'Tres pistas en sus módulos: encontrarlas paga cada vez más',
    text: 'Esconde 3 PISTAS (huellas azules) en sus 3 mejores módulos. Cada vez que tu tripulación le pega a una, la encuentra: ese golpe hace ×1.5 y revela todo. Al encontrar la tercera, «¡LO RESOLVIMOS!»: un golpe de 2·P en ese módulo que ignora escudos. Las pistas duran hasta que las encuentres.',
  },
  xp_miaubody: {
    name: 'BACK IN TIME!',
    short: 'Trae del pasado una copia de tu mejor gato por 2 turnos',
    text: 'Se sube a su máquina del tiempo y vuelve con alguien del pasado: una COPIA de tu gato con más poder (con la vida llena) pelea en tu tripulación 2 turnos y dispara en tu turno además de tu gato, con sus mismos tiros.',
  },
  xp_gatogro: {
    name: 'SWAMP SWEET SWAMP!',
    short: 'Pantano 3 turnos: mojados, cañones atascados, recargan +1',
    text: 'Convierte su barco en pantano 3 turnos: todo queda Mojado y Enraizado, sus cañones se atascan en el lodo y sus gatos se mueven como en lodo: cada uno tarda un turno más en volver a disparar. Un rugido de ogro les quita además 20 de barra.',
  },
  xp_grru: {
    name: 'FREEZE RAY!',
    short: 'Congela sólido a su gato más fuerte (con Miaunion, a dos)',
    text: 'Congela SÓLIDO a su gato con más poder y a su camarote: 2 turnos no actúa, su camarote no lo protege y el primer golpe de Tierra o de cañón lo ESTALLA (×2). Si Miaunion está en tu tripulación, el rayo rebota y congela también a su segundo gato más fuerte.',
  },
  xp_miaunion: {
    name: 'BANANA ALARM!',
    short: '3 turnos: cada ulti de tu tripulación trae un plátano bomba',
    text: 'Suena la alarma del ayudante: los próximos 3 turnos, cada vez que un gato tuyo usa su ulti, él se cuelga y avienta un PLÁTANO BOMBA extra al mismo lugar. Si Grrrú está en tu tripulación, los plátanos además congelan 1 turno.',
  },
  xp_garritas: {
    name: 'BERSERKER CLAWS!',
    short: 'Seis tajos + se cura 15 % cada turno (4 turnos)',
    text: 'Seis tajos en cruz por su barco y se le activa el FACTOR CURATIVO: los próximos 4 turnos recupera el 15 % de su vida máxima al empezar cada turno, y cada golpe que recibe le da +10 de barra.',
  },
  xp_supermichi: {
    name: 'SKY LIFT!',
    short: 'Alza su barco y lo suelta: la quilla truena, lo suelto cae',
    text: 'Se mete bajo su barco, LO LEVANTA del agua y lo suelta: toda la fila de abajo (la quilla) recibe el golpe de la caída, y todo lo que se quede sin conexión con la quilla se desprende y se hunde.',
  },
  xp_hierromichi: {
    name: 'UPGRADE PROTOCOL!',
    short: 'Seis misiles + la armadura mejora con cada golpe que recibe',
    text: 'Lanza seis minimisiles a sus 6 módulos más valiosos y activa el PROTOCOLO DE MEJORA: los próximos 3 turnos, cada golpe que recibe le añade una pieza a la armadura: +1 escudo y +10 % de daño el resto de la batalla (hasta +50 %).',
  },
  xp_michimerica: {
    name: 'NEVER FALL!',
    short: '3 turnos: ningún gato tuyo cae; él se lleva medio golpe',
    text: 'Levanta el escudo por todos: los próximos 3 turnos, cuando un golpe iba a dejar KO a un gato tuyo, él se mete en medio: ese gato queda con 1 de vida y el golpe lo recibe él, a la mitad. Y un escudazo rebota por 3 de sus camarotes.',
  },
  xp_doomiau: {
    name: 'DOOMIAU COMMANDS!',
    short: 'Ley de hierro: 2 turnos, pegarte les cuesta vida',
    text: 'Dicta una ley para su barco 2 turnos: cada gato rival que haga daño PAGA: pierde de su propia vida el 25 % de lo que hizo, y no se puede curar mientras dure. Y un rayo arcano maldice su núcleo.',
  },
  xp_ssssmichi: {
    name: 'BIG HUG!',
    short: 'Kamikaze: explosión enorme de 2·P y él queda KO',
    text: 'Se va caminando a su barco, abraza el camarote con más gatos y… ¡PUM!: una explosión enorme que deja un cráter. Él queda KO (no cuenta como derrota y vuelve entero al terminar). Si es tu último gato en pie, no explota: se pone triste y solo sisea.',
  },
  xp_michimpostor: {
    name: 'EMERGENCY MEETING!',
    short: 'Expulsa 2 turnos al gato que más daño te ha hecho',
    text: 'Junta de emergencia en su barco: votan, y sale EXPULSADO el gato rival que más daño te ha hecho esta batalla. Se va al espacio 2 turnos: no actúa, no se le puede pegar y su camarote queda vacío; vuelve con la mitad de su vida. Un capitán jefe se va 1 turno.',
  },
  xp_zoomic: {
    name: 'RING RUSH!',
    short: 'Escudo de 30 anillos: los golpes le tumban anillos, no vida',
    text: 'Se avienta en bolita rebotando por su barco y junta 30 ANILLOS. Mientras tenga anillos, los golpes que recibe no le quitan vida: le tumban 10 anillos cada uno, que quedan regados un turno; si su siguiente tiro conecta, corre por ellos y los recupera.',
  },
  xp_hannah: {
    name: 'SECRET IDENTITY!',
    short: 'Se disfraza de su gato más fuerte y usa su ulti',
    text: 'Se pone la peluca: se disfraza de su gato con más poder y usa SU ulti, con su propio ataque (a ellos no les gasta nada). Si ese gato no tiene ulti, da su concierto: tres ondas que aturden.',
  },
  xp_gemichi: {
    name: 'TWIN SWAP!',
    short: 'Cambia la vida de tu gato más herido por la de su más sano',
    text: 'Se cambian de lugar: intercambia la VIDA (en %) de tu gato más herido con la de su gato más sano, y también sus estados. Nadie se da cuenta del cambio hasta que es tarde. Un capitán jefe cambia como máximo 30 puntos de vida.',
  },
  xp_persafalsa: {
    name: 'UNDERCOVER!',
    short: '2 turnos: sus tiros se desvían a tu módulo menos valioso',
    text: 'Se infiltra: 2 turnos, nadie de su lado sabe quién es quién en tu barco. Cada tiro suyo que iba a un camarote, al núcleo o a un cañón se desvía a tu módulo menos valioso (casco o mástil).',
  },
  xp_hermiaune: {
    name: 'TIME TURNER!',
    short: 'Deshace el último turno rival: repara y les quita la barra',
    text: 'Gira el reloj de arena y DESHACE el último turno rival: el daño que te hicieron en su turno pasado se repara (la vida de tus gatos, tus celdas y tus módulos; los gatos que cayeron se levantan) y la barra que ganaron en ese turno se les quita. Lo que se cayó del barco y lo borrado por el Vacío no regresan.',
  },
  xp_lunalovegata: {
    name: 'UPSIDE-DOWN WORLD!',
    short: 'Voltea en contra todo lo que los ayuda (hasta el viento)',
    text: 'Lee su revista al revés y el mundo le hace caso: todo lo que AYUDA a su lado se voltea en contra. Sus escudos de gato se vuelven Expuesto, sus refuerzos se vuelven Maldito, sus pozos jalan sus propios tiros, y si el viento los ayudaba, ahora te ayuda a ti.',
  },
  xp_miaunce: {
    name: 'MIND CATCH!',
    short: 'Atrapa el siguiente tiro (hasta una ulti) y lo regresa ×1.5',
    text: 'Extiende la pata y DETIENE en el aire el siguiente tiro que le hagan a tu barco (de gato o ulti, en los próximos 2 turnos rivales): lo da vuelta y se lo regresa al gato que lo disparó con ×1.5.',
  },
  xp_heisenmiau: {
    name: 'PURE CHEMISTRY!',
    short: 'Matraz de Prisma y detona en cadena los estados de su barco',
    text: 'Detona la química: un matraz deja Prisma donde apuntas y luego cada celda de su barco con algún estado explota por cada estado que tenga (los consume todos), en cadena por las vecinas. Entre más estados le hayan dejado tus gatos, peor.',
  },
  xp_michiercoles: {
    name: 'PIRANHA POOL!',
    short: 'Pirañas 3 turnos: muerden su línea de agua y camarotes bajos',
    text: 'Le echa pirañas a su agua: los próximos 3 turnos, cada celda de su barco a la altura del agua o más abajo recibe daño al empezar su turno y queda Mojada, y los gatos de los camarotes de abajo pierden el 10 % de su vida por turno.',
  },
  xp_michiwan: {
    name: 'HIGH GROUND!',
    short: '3 turnos: tú pegas +20 % desde arriba y ellos −30 %',
    text: 'Se sube a la parte alta: los próximos 3 turnos tu barco tiene la VENTAJA DE LA ALTURA: tus tiros caen desde arriba (atraviesan la primera pared y pegan +20 %), y los suyos tienen que subir: −30 % de daño y no alcanzan tus cubiertas bajo el agua.',
  },
  xp_gatoleone: {
    name: 'THE OFFER!',
    short: 'Su gato más fuerte dispara contra su propio barco',
    text: 'Le hace una oferta a su gato con más poder: ese gato dispara su siguiente tiro CONTRA SU PROPIO BARCO, al módulo más valioso que tenga cerca, y le pasa su barra a tu tripulación («por respeto»). Un capitán jefe no acepta: pierde 50 de barra.',
  },
  xp_gatoneta: {
    name: 'LET THEM EAT CAKE!',
    short: 'Empacha a sus gatos: 3 turnos sin ganar barra',
    text: 'Les manda pastel a todos: sus gatos quedan EMPACHADOS 3 turnos: no ganan barra de ulti por nada (ni por pegar ni por recibir), y el primero que intente usar su ulti se queda dormido de la panza llena.',
  },
  xp_romiau: {
    name: 'BACHATA SERENADE!',
    short: 'Enamora a su mejor gato: 2 turnos quieto y te da su barra',
    text: 'Le canta una bachata a su gato con más poder, que se ENAMORA: 2 turnos no actúa, no se defiende (recibe ×1.25) y cada turno le pasa 25 de su barra a Romiau. Un capitán jefe se enamora 1 turno.',
  },
  xp_miauki: {
    name: 'TEARFUL BALLAD!',
    short: 'Tregua de un turno: todos lloran y tus gatos se curan 30 %',
    text: 'Canta una balada tan triste que TODOS lloran: el siguiente turno nadie dispara (ni sus gatos, ni sus cañones, ni los tuyos). Tu tripulación aprovecha para reponerse: +30 % de vida y +30 de barra a cada gato.',
  },
  xp_postmaulone: {
    name: 'CHILL VIBES!',
    short: '3 turnos: tu tripulación no se aturde, ni duerme, ni nada',
    text: 'Pone el ambiente más relajado del mar: los próximos 3 turnos tu tripulación no puede ser aturdida, dormida, enredada, enamorada ni detenida (y se le quitan esos estados). Y un guitarrazo de hielo congela su cubierta.',
  },
  xp_miautentacion: {
    name: 'PAIN INTO ART!',
    short: 'Limpia los estados de tus gatos y se los regresa en golpes',
    text: 'Junta todo lo que le pesa a tu tripulación: les QUITA a tus gatos todos sus estados malos (Ardiendo, Maldito, Aturdido, Congelado…) y los convierte en golpes contra su barco: cada estado quitado es un golpe con ese mismo estado.',
  },
  xp_sabrina: {
    name: 'SUGAR HEART!',
    short: 'Corazón gigante que absorbe daño y luego estalla de vuelta',
    text: 'Infla un CORAZÓN DE AZÚCAR gigante sobre tu barco: se traga todo el daño (hasta el 25 % de la vida de tu barco) durante 3 turnos. Cuando se rompe o se acaba, estalla en confeti de azúcar contra su barco y les devuelve la mitad de lo que absorbió.',
  },
  xp_daftmiau: {
    name: 'LIGHT PYRAMID!',
    short: 'Pirámide de luces: 3 turnos dispara al final de cada turno',
    text: 'Arma la pirámide de luces sobre tu barco (y sale su compañero del casco dorado): 3 turnos, al final de cada turno tuyo la pirámide dispara un láser al lugar donde pegó tu gato, alternando plata (Cargado) y oro (Cegado).',
  },
  xp_partymichi: {
    name: 'BASS DROP PILE-UP!',
    short: 'Amontona a todos sus gatos en un camarote y suelta el bajo',
    text: 'La fiesta los jala a todos: TODOS sus gatos se amontonan bailando en el camarote con más gatos hasta su siguiente turno, y cae el BASS DROP justo ahí: un golpe que les pega a todos los del montón.',
  },
  xp_miauknd: {
    name: 'ENDLESS NIGHT!',
    short: 'Todos los estados de su barco duran el doble',
    text: 'Se queda la noche: todos los estados que tenga su barco y sus gatos DURAN EL DOBLE (los que ya tienen y los que les pongas los próximos 2 turnos), y sus gatos quedan Revelados. Su golpe deja Ardiendo toda la cubierta de arriba.',
  },
  xp_miaussi: {
    name: 'DRIBBLE OF THE CENTURY!',
    short: 'Se cuela 5 celdas sin tocarlas y te deja una asistencia ×2.5',
    text: 'Arranca desde media cancha: el balón ATRAVIESA hasta 5 celdas sin tocarlas (no activa escudos ni módulos de escudo) y explota en el módulo más profundo que apuntaste. Y la ASISTENCIA: el siguiente gato tuyo que dispare pega ×2.5.',
  },
  xp_gatistiano: {
    name: 'HAT-TRICK!',
    short: 'Tres balones al mismo módulo: ×1, ×1.5 y ×2.5',
    text: 'Tres balonazos al MISMO módulo, uno tras otro: el primero pega ×1, el segundo ×1.5 y el tercero ×2.5 (si el módulo se rompe, los que faltan siguen al más cercano). Después celebra: tu tripulación gana +20 de barra.',
  },
  xp_miaupe: {
    name: 'COUNTER-ATTACK!',
    short: '2 turnos: contesta al instante cada tiro de gato que te dé',
    text: 'Se queda esperando el contragolpe: los próximos 2 turnos rivales, cada vez que un gato suyo le pega a tu barco, él responde AL INSTANTE con un disparo al camarote de ese gato (sin gastar tu turno).',
  },
  xp_lamiau: {
    name: 'BACKDOOR CURL!',
    short: 'Rosca que entra por la popa: críticos que ignoran escudos',
    text: 'Le pega con rosca por fuera: el balón le da la vuelta a su barco y entra POR LA POPA, a sus 2 módulos de atrás: esos golpes ignoran escudos y son críticos (×1.5) y dejan Flotando lo que tocan.',
  },
  // ---- tanda 2 (agent PODERES-3, 2026-10-29: docs/post-p3/05-tanda-2.md; changes: docs/post-p3/agentes/PODERES-3.md)
  xp_sombreronron: {
    name: 'MIDNIGHT BRAID!',
    short: 'Tres listones: lo que quede dentro del triángulo, trenzado',
    text: 'Trenza la medianoche: tus próximos 3 impactos (de cualquier gato tuyo, este turno y los 2 siguientes) clavan un listón en su barco. Con el tercero la trenza se cierra: toda celda suya dentro del triángulo de los tres listones recibe un golpe y queda Enraizada, y los gatos de adentro amanecen con los bigotes trenzados (no ganan barra un turno).',
  },
  xp_gatejo: {
    name: 'TWO CADEJOS!',
    short: 'Cuida a tus gatos solos y muerde a los suyos que estén solos',
    text: 'Se parte en dos: el Gatejo blanco cuida a cada gato tuyo que esté solo (sin otro camarote tuyo pegado) y le da 2 escudos; el Gatejo negro va por cada gato suyo que esté solo, le muerde fuerte y lo deja Maldito. Si de un lado nadie está solo, ese espíritu va con el más débil.',
  },
  xp_maullorona: {
    name: 'WEEPING RIVER!',
    short: 'Siete lagrimones que buscan siempre al gato más herido',
    text: 'Llora un río: siete lagrimones caen uno por uno sobre sus gatos, cada uno sobre el que tenga menos vida en ese momento, y pegan más mientras más herido esté. Si uno cae, el siguiente lagrimón sigue buscando. Todo lo que tocan queda Mojado.',
  },
  xp_quetzalgatl: {
    name: 'FEATHERED WIND!',
    short: 'El viento a tu favor 3 turnos y plumas que sellan cañones',
    text: 'El viento se vuelve suyo: el resto de este turno y tus 3 siguientes sopla con toda su fuerza de tu barco hacia el de ellos, a favor de tus tiros y en contra de los suyos. Y cinco plumas caen en sus cañones: quedan Sellados un turno.',
  },
  xp_bastet: {
    name: 'HOME GUARDIAN!',
    short: 'Tu barco no baja del 30 % y el sol cobra cada golpe',
    text: 'Protege la casa: durante sus 3 turnos siguientes ninguna celda tuya baja del 30 % de su vida (los golpes se quedan en la raya). Cada golpe que choca con la raya alimenta el disco de sol, y al final el sol cae sobre su núcleo con todo lo juntado.',
  },
  xp_cleogatra: {
    name: 'THE PEARL WAGER!',
    short: 'Apuesta 2 turnos de daño: si ganas, golpe enorme y barra',
    text: 'Apuesta su perla más grande: durante 2 turnos se cuenta el daño. Si tu tripulación le hizo más daño a su barco que ellos al tuyo, gana la apuesta: la perla se disuelve sobre sus 3 mejores módulos con un golpe enorme y tu tripulación gana barra. Si pierde, la perla regresa a su pata y les cae en el núcleo de consolación.',
  },
  xp_bonapata: {
    name: 'GRAND CONQUEST!',
    short: 'Cada celda que destruyas en 3 turnos te sube el daño',
    text: 'Clava su bandera: el resto de este turno y tus 2 siguientes, cada celda suya que tu tripulación destruya se vuelve territorio conquistado, y cada territorio sube el daño de toda tu tripulación hasta el final de la batalla. Abre la campaña con un bicornio de fuego donde apuntas.',
  },
  xp_leonardo: {
    name: 'CODEX OF INVENTIONS!',
    short: 'Una máquina para cada gato: su próximo tiro sale mejorado',
    text: 'Abre su cuaderno y le inventa una máquina a cada gato tuyo según lo que hace: el próximo tiro de cada uno sale mejorado (más proyectiles, perforación, radio, rebotes, estados más largos, curas, escudos o un tiro repetido).',
  },
  xp_perla: {
    name: 'SOFT WINDOW LIGHT!',
    short: 'Luz de ventana: cura y repara a todo tu barco 4 turnos',
    text: 'Abre la ventana: durante tus 4 turnos siguientes entra a tu barco una luz suave que, al empezar cada uno, cura a todos tus gatos y repara tus celdas. Y la perla se cuelga de tu gato más herido y le da escudos.',
  },
  xp_miauton: {
    name: 'LAW OF GRAVITY!',
    short: 'Sus tiros pesan el doble y los tuyos la mitad, 2 turnos',
    text: 'Una manzana gigante cae sobre lo más alto de su barco y la gravedad cambia: durante sus 2 turnos siguientes sus tiros pesan el doble y se quedan cortos, y los de tu tripulación pesan la mitad y vuelan rectos y lejos.',
  },
  xp_miauzart: {
    name: 'BRAVO, ENCORE!',
    short: 'La siguiente ulti de tu tripulación se toca dos veces',
    text: 'Un minueto de tres notas en abanico que aturde, y el público se pone de pie: la siguiente ulti de otro gato tuyo (en tus 3 turnos siguientes) se toca dos veces: se repite al instante, un poco más bajito.',
  },
  xp_miausagi: {
    name: 'FULL MOON UNITY!',
    short: 'Rayo de luna: más fuerte por cada elemento de tu tripulación',
    text: 'Levanta su varita y llama a sus amigas: un rayo de luna llena cae sobre su barco, más grande y más fuerte por cada elemento distinto que haya en tu tripulación. Y por la amistad, cada gato tuyo gana barra.',
  },
  xp_tanjimiau: {
    name: 'FLOWING DRAGON!',
    short: 'Dragón de agua por el borde de su barco que pega más y más',
    text: 'Respira hondo y suelta un dragón de agua que le da la vuelta a su barco por el borde, celda por celda, y cada celda que toca le pega más que la anterior. Al final, la caja se abre tantito: su hermanita patea la última celda.',
  },
  xp_tetrimiau: {
    name: 'LINE CLEAR!',
    short: 'Borra la fila más llena; lo de arriba se golpea al caer',
    text: 'Cuatro piezas caen sobre su barco y completan una fila: la fila con más celdas de su barco DESAPARECE (solo aguantan, como pilares, las celdas que sostienen algo), y lo que estaba justo arriba se golpea al caer.',
  },
  xp_laracroqueta: {
    name: 'RELIC RAID!',
    short: 'Saquea: le quita barra a cada gato suyo y te la da a ti',
    text: 'Se cuelga de su barco con el gancho y saquea la alacena: le quita barra a cada gato suyo y la reparte entre tu tripulación. Antes de irse, le apunta con los dos punteros al gato que más barra tenía.',
  },
  xp_pobregatito: {
    name: 'HOME TRAPS!',
    short: 'Cuatro trampas escondidas castigan al que te dispara',
    text: 'Arma la casa: esconde cuatro trampas en celdas de tu barco que el rival no ve. Cuando un tiro suyo toca una celda con trampa, no hace daño y la trampa le pega al que disparó: lata de pintura, perilla caliente, carritos de juguete o la plancha.',
  },
  xp_felinamente: {
    name: 'OBJECTION SUSTAINED!',
    short: 'Objeción: el estado que te pongan se les regresa a todos',
    text: 'Arma una objeción: durante sus 3 turnos siguientes, el primer estado que le pongan a un gato tuyo se anula y se les regresa a TODOS sus gatos. Y abre el caso con un libro de leyes gigante sobre el gato suyo que más estados te haya puesto.',
  },
  xp_gorrimiau: {
    name: 'THE COMPASS SAYS TUNA!',
    short: 'Tus tiros se curvan hacia su gato con más barra 3 turnos',
    text: 'Abre la brújula que no apunta al norte, sino a lo que más quieres: el resto de este turno y tus 2 siguientes, cada tiro de tu tripulación se curva en el aire hacia el gato suyo con más barra. Si ese gato cae, el capitán se queda con su barra.',
  },
  xp_docmiauwn: {
    name: 'FIX THE PAST!',
    short: 'Tus tiros fallados de la batalla regresan y esta vez pegan',
    text: 'Viaja al pasado y arregla tus errores: los tiros de tu tripulación que fallaron en esta batalla regresan del pasado, uno tras otro, y esta vez pegan en su barco, en el punto más cercano a donde iban.',
  },
  xp_pinkmiau: {
    name: 'LAB PARTNER!',
    short: 'Cada golpe deja un estado extra; con Heisenmiau, doble',
    text: 'Se pone los goggles y le pasa los frascos al profe: el resto de este turno y tus 2 siguientes, cada golpe de tu tripulación deja en su barco un estado más (Vapor) además del suyo. Si Heisenmiau está en tu tripulación, su química cuenta cada estado doble.',
  },
  xp_miauty: {
    name: 'BALANCE SHEET!',
    short: 'Cuadra las cuentas: les quita la ventaja y repara tu barco',
    text: 'Cuadra las cuentas: si a su barco le queda más vida que al tuyo (en proporción), le quita la mitad de la diferencia y con eso repara tu barco. Si vas ganando, cobra intereses: un carpetazo a su núcleo.',
  },
  xp_michincipe: {
    name: 'THE SHEEP IN THE BOX!',
    short: 'Una caja que trae justo lo que tu barco necesita',
    text: 'Dibuja una caja con tres agujeritos: adentro está exactamente lo que necesitas. Si tu tripulación está muy herida, la cura; si ellos tienen escudos o barreras, se los quita; si no, el borrego sale a toda velocidad y embiste su núcleo.',
  },
  xp_garjona: {
    name: 'THE STORY GOES ON!',
    short: 'Todo lo bueno de tu lado dura 2 turnos más',
    text: 'Cuenta una historia que no se acaba: todo lo bueno de tu lado (escudos, refuerzos, poderes con turnos y los estados que les pusiste) dura 2 turnos más. Y lo que cuenta se vuelve verdad: el gato suyo que más daño te hizo queda Revelado y Marcado.',
  },
  xp_shakimiau: {
    name: 'SEISMIC DANCE!',
    short: 'Terremoto: derrumba toda celda que quede bajo el 30 %',
    text: 'Baila tan fuerte que tiembla el mar: cada celda de su barco recibe un golpecito y TODA celda que quede por debajo del 30 % de su vida se derrumba (menos las que sostienen algo).',
  },
  xp_miaucol: {
    name: 'DUNK FROM THE LINE!',
    short: 'Clavada al núcleo: pega más por cada gato suyo que noqueaste',
    text: 'Despega desde la línea de tiro libre y clava sobre su núcleo pasando por encima de todo. Pega más por cada gato suyo que tu tripulación ya noqueó en la batalla: un anillo por cada uno, hasta seis. Sin anillos, el clavado además deja Aturdido a su gato con más barra.',
  },
  // ---- end of tanda 2
};

/** each post universe's color (its cat's aura) and tag, while its Signature (fx/sequences/multiverse) isn't drawn */
export const MDP_UNIVERSE: Record<string, { color: number; tag: string }> = {
  xp_gomitas: { color: 0xd62839, tag: 'UNIVERSO PIRATA' },
  xp_kagebunyan: { color: 0xff7a1a, tag: 'UNIVERSO SHINOBI' },
  xp_gatojo: { color: 0x2b1d4a, tag: 'UNIVERSO BIZARRO' },
  xp_unzarpazo: { color: 0xffd23f, tag: 'UNIVERSO HÉROE DE AFICIÓN' },
  xp_pegaso: { color: 0xc9d3dc, tag: 'UNIVERSO DEL SANTUARIO' },
  xp_michiatom: { color: 0x3a7bd5, tag: 'UNIVERSO DEL CAMPEONATO' },
  xp_mazingato: { color: 0x2b2b33, tag: 'UNIVERSO SUPERROBOT' },
  xp_ryumiau: { color: 0xc8102e, tag: 'UNIVERSO LIBRETA' },
  xp_miaunya: { color: 0xf7a1c4, tag: 'UNIVERSO SECRETO' },
  xp_yugi: { color: 0x7b2cbf, tag: 'UNIVERSO DUELO' },
  xp_gatote: { color: 0x8c6b3e, tag: 'UNIVERSO DE LA MANCHA' },
  xp_sherlock: { color: 0x7a5c3e, tag: 'UNIVERSO DE NIEBLA' },
  xp_frankengato: { color: 0x6b8f71, tag: 'UNIVERSO LABORATORIO' },
  xp_gatula: { color: 0xc8102e, tag: 'UNIVERSO DEL CASTILLO' },
  xp_ahab: { color: 0x2f3e46, tag: 'UNIVERSO BALLENERO' },
  xp_pinomichi: { color: 0xc49a6c, tag: 'UNIVERSO DEL TALLER' },
  xp_michipulin: { color: 0xd62839, tag: 'UNIVERSO DEL HÉROE COLORADO' },
  xp_barril: { color: 0x2e7d5b, tag: 'UNIVERSO DE LA VECINDAD' },
  xp_miaufalda: { color: 0xd62839, tag: 'UNIVERSO DE LA TIRA' },
  xp_condorgato: { color: 0x1b1b2f, tag: 'UNIVERSO DEL REMATE' },
  xp_esponja: { color: 0xffe14d, tag: 'UNIVERSO DEL FONDO' },
  xp_rick: { color: 0x97ce4c, tag: 'UNIVERSO DE LOS PORTALES' },
  xp_miaang: { color: 0xf6a01a, tag: 'UNIVERSO DE LOS CUATRO' },
  xp_miauby: { color: 0x8b5a2b, tag: 'UNIVERSO DEL MISTERIO' },
  xp_blumiau: { color: 0x6ec6f0, tag: 'UNIVERSO DE LAS PISTAS' },
  xp_miaubody: { color: 0xd62839, tag: 'UNIVERSO DE LA MÁQUINA DEL TIEMPO' },
  xp_gatogro: { color: 0x7aa83a, tag: 'UNIVERSO DEL PANTANO' },
  xp_grru: { color: 0x2b2b33, tag: 'UNIVERSO VILLANO' },
  xp_miaunion: { color: 0xffe14d, tag: 'UNIVERSO AYUDANTE' },
  xp_garritas: { color: 0xffd23f, tag: 'UNIVERSO MUTANTE' },
  xp_supermichi: { color: 0x2f4b8a, tag: 'UNIVERSO DEL CIELO' },
  xp_hierromichi: { color: 0xb3001b, tag: 'UNIVERSO DE LA ARMADURA' },
  xp_michimerica: { color: 0x2f4b8a, tag: 'UNIVERSO DEL ESCUDO' },
  xp_doomiau: { color: 0x2e5e3a, tag: 'UNIVERSO DEL TRONO DE HIERRO' },
  xp_ssssmichi: { color: 0x4caf50, tag: 'UNIVERSO DE CUBOS' },
  xp_michimpostor: { color: 0xc51111, tag: 'UNIVERSO DE LA NAVE' },
  xp_zoomic: { color: 0x1e5bd6, tag: 'UNIVERSO SUPERSÓNICO' },
  xp_hannah: { color: 0xffe08a, tag: 'UNIVERSO DOBLE VIDA' },
  xp_gemichi: { color: 0xd9e8f5, tag: 'UNIVERSO GEMELO' },
  xp_persafalsa: { color: 0xf7a1c4, tag: 'UNIVERSO DE LA ALTA SOCIEDAD' },
  xp_hermiaune: { color: 0x7a2e2e, tag: 'UNIVERSO DE LA BIBLIOTECA MÁGICA' },
  xp_lunalovegata: { color: 0xf2e6a6, tag: 'UNIVERSO AL REVÉS' },
  xp_miaunce: { color: 0xf7a1c4, tag: 'UNIVERSO DEL OTRO LADO' },
  xp_heisenmiau: { color: 0x4fc3f7, tag: 'UNIVERSO DEL DESIERTO' },
  xp_michiercoles: { color: 0xffffff, tag: 'UNIVERSO GÓTICO' },
  xp_michiwan: { color: 0x3b5ba5, tag: 'UNIVERSO DE LA GALAXIA LEJANA' },
  xp_gatoleone: { color: 0x1a1a1a, tag: 'UNIVERSO DE LA FAMILIA' },
  xp_gatoneta: { color: 0xf7c6d9, tag: 'UNIVERSO DEL PALACIO' },
  xp_romiau: { color: 0xc8102e, tag: 'UNIVERSO BACHATA' },
  xp_miauki: { color: 0x8b4a2b, tag: 'UNIVERSO DE LA BALADA' },
  xp_postmaulone: { color: 0x7fd1c7, tag: 'UNIVERSO RELAX' },
  xp_miautentacion: { color: 0xf2d24b, tag: 'UNIVERSO DE DOS COLORES' },
  xp_sabrina: { color: 0xffd6e8, tag: 'UNIVERSO DULCE' },
  xp_daftmiau: { color: 0xc0c6cc, tag: 'UNIVERSO PIRÁMIDE' },
  xp_partymichi: { color: 0x39ff14, tag: 'UNIVERSO FIESTA' },
  xp_miauknd: { color: 0xc8102e, tag: 'UNIVERSO NEÓN' },
  xp_miaussi: { color: 0x75aadb, tag: 'UNIVERSO ALBICELESTE' },
  xp_gatistiano: { color: 0xc8102e, tag: 'UNIVERSO DEL SALTO' },
  xp_miaupe: { color: 0x1f2a5a, tag: 'UNIVERSO RELÁMPAGO' },
  xp_lamiau: { color: 0xc8102e, tag: 'UNIVERSO DEL BARRIO' },
  // ---- tanda 2 (agent PODERES-3)
  xp_sombreronron: { color: 0x1b1b2f, tag: 'UNIVERSO DE LA LEYENDA' },
  xp_gatejo: { color: 0x111111, tag: 'UNIVERSO DEL CAMINO DE NOCHE' },
  xp_maullorona: { color: 0x3a5a8c, tag: 'UNIVERSO DEL RÍO' },
  xp_quetzalgatl: { color: 0x1f8a5b, tag: 'UNIVERSO DEL CÓDICE' },
  xp_bastet: { color: 0xe6c34a, tag: 'UNIVERSO DEL TEMPLO' },
  xp_cleogatra: { color: 0xe6c34a, tag: 'UNIVERSO DEL NILO' },
  xp_bonapata: { color: 0x1f3a8a, tag: 'UNIVERSO DEL IMPERIO' },
  xp_leonardo: { color: 0x8b5a2b, tag: 'UNIVERSO DEL GENIO' },
  xp_perla: { color: 0x1b3f8b, tag: 'UNIVERSO DE LA VENTANA' },
  xp_miauton: { color: 0x2b2420, tag: 'UNIVERSO DEL MANZANO' },
  xp_miauzart: { color: 0xc0392b, tag: 'UNIVERSO DEL SALÓN DE CONCIERTOS' },
  xp_miausagi: { color: 0xffd23f, tag: 'UNIVERSO LUNAR' },
  xp_tanjimiau: { color: 0x2e7d5b, tag: 'UNIVERSO DE LA RESPIRACIÓN' },
  xp_tetrimiau: { color: 0xff7f6b, tag: 'UNIVERSO DE LAS PIEZAS' },
  xp_laracroqueta: { color: 0x2bb3a3, tag: 'UNIVERSO DE LA TUMBA' },
  xp_pobregatito: { color: 0xd62839, tag: 'UNIVERSO DE LA CASA SOLA' },
  xp_felinamente: { color: 0xff6fb5, tag: 'UNIVERSO ROSA' },
  xp_gorrimiau: { color: 0x5b3a2a, tag: 'UNIVERSO DEL MAR MALDITO' },
  xp_docmiauwn: { color: 0x3a7bd5, tag: 'UNIVERSO DE LA TORRE DEL RELOJ' },
  xp_pinkmiau: { color: 0x4fc3f7, tag: 'UNIVERSO DE LA CASA RODANTE' },
  xp_miauty: { color: 0x8b5a2b, tag: 'UNIVERSO DE LA OFICINA' },
  xp_michincipe: { color: 0xffd23f, tag: 'UNIVERSO DEL ASTEROIDE' },
  xp_garjona: { color: 0x3b2a1a, tag: 'UNIVERSO DEL TROVADOR' },
  xp_shakimiau: { color: 0xe6c34a, tag: 'UNIVERSO SÍSMICO' },
  xp_miaucol: { color: 0xd62839, tag: 'UNIVERSO DE LA DUELA' },
  // ---- end of tanda 2
};

/** the post Multidimensionals with a power (registered ahead of their species) */
export const MDP_IDS = Object.keys(MULTIDIM_POWERS_POST);
