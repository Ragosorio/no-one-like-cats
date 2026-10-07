/**
 * Story script for Zones 2–3 (Hito 2): zone arrivals, elite warnings, boss presentations & farewells,
 * the Tormenta discovery follow-up and the Diario del Mar cliffhangers. Content beats b12/b15 come from
 * content.story; everything here extends them in Luzterna's "sin filtro" voice (GDD §5.4 · research/09).
 * Text is filtered by the tone setting (ui/story/text.ts › clean) when shown.
 */
import type { Line } from '../dialog';

export interface ZoneCardDef {
  zone: number;
  name: string;
  faction: string;
  elements: string[];
  /** engraved "here be monsters" line */
  motto: string;
  /** what you'll learn here (poster bullets) */
  bullets: string[];
  boss: string;
  /** zone mood colors for the card */
  ink: number;
  accent: number;
}

export const ZONE_CARDS: Record<number, ZoneCardDef> = {
  2: {
    zone: 2,
    name: 'ACANTILADOS DE PIEDRA',
    faction: 'Guardia de Piedra',
    elements: ['earth', 'nature'],
    motto: 'Aquí hay gárgolas (dicen)',
    bullets: ['Fuertes de piedra: las bolas de pelo rebotan', 'Raíces que te ENRAÍZAN el barco', 'Morteros que bombean desde arriba'],
    boss: 'La Gárgola Ronroneante',
    ink: 0x3d3a33,
    accent: 0x4f8f4a,
  },
  3: {
    zone: 3,
    name: 'MAR DE TORMENTAS',
    faction: 'Flota del Kraken',
    elements: ['storm', 'water'],
    motto: 'Aquí llueve para arriba',
    bullets: ['Todo está MOJADO: el rayo hace CONDUCCIÓN', 'Pararrayos que se tragan tus tiros de rayo', 'Algo con tentáculos abraza barcos'],
    boss: 'Kraken Voltaico',
    ink: 0x172b35,
    accent: 0xffd400,
  },
  4: {
    zone: 4,
    name: 'RUINAS SUMERGIDAS',
    faction: 'Biblioteca del Arcanista',
    elements: ['magic', 'earth'],
    motto: 'Aquí arrancan páginas',
    bullets: ['Templos y bibliotecas que flotan (y te disparan)', 'Gatos de {magic} MAGIA: runas que te persiguen', '{nature} Naturaleza le gana a {earth} Tierra'],
    boss: 'El Arcanista',
    ink: 0x231626,
    accent: 0xb89558,
  },
  5: {
    zone: 5,
    name: 'ABISMO ESTELAR',
    faction: 'Flota de la Estrella',
    elements: ['cosmic', 'storm'],
    motto: 'Aquí se cae el cielo',
    bullets: ['Satélites, cometas y observatorios', 'Orbes {cosmic} cósmicos que se curvan hacia tu barco', '{magic} Magia contra lo cósmico, {earth} Tierra contra el rayo'],
    boss: 'Estrella Errante',
    ink: 0x0d110f,
    accent: 0x8a5cff,
  },
  6: {
    zone: 6,
    name: 'LA MAREA SIN NOMBRE',
    faction: 'Escolta del Primer Mar',
    elements: ['cosmic', 'magic', 'fire'],
    motto: 'Aquí se olvida todo',
    bullets: ['Barcos de hueso y galeones de niebla', 'De todo: {cosmic} {magic} {fire} — lleva un barco variado', '{water} Agua apaga el fuego; magia y cósmico se pegan entre sí'],
    boss: 'El Primer Mar',
    ink: 0x171317,
    accent: 0xff2e88,
  },
};

/** played on the map the first time the zone's fog is gone (after its zone card) */
export const ZONE_INTRO: Record<number, Line[]> = {
  2: [
    ['LUZTERNA', 'Bienvenid{g:o|a|e} a los Acantilados de Piedra, {name}. Aquí todo es de roca: los barcos, los fuertes y el humor de la gente.'],
    ['LUZTERNA', 'Tus bolas de pelo rebotan en la piedra como chisme en grupo de WhatsApp. Usa TIERRA: Gea los parte como galleta María.'],
    ['LUZTERNA', 'Y baja la voz. Dicen que allá arriba duerme algo con alas desde hace trescientos años. Y que se despierta de MUY mal humor.'],
    ['LUZTERNA', 'Como yo antes del café. Bueno, yo ya no tomo café. Estoy muerta. Pero me acuerdo del mal humor.'],
  ],
  3: [
    ['LUZTERNA', 'El Mar de Tormentas, {name}. Llueve de lado, de abajo y a veces de adentro. No preguntes de adentro de qué.'],
    ['LUZTERNA', 'Regla de oro: si algo está MOJADO y le metes rayo… CONDUCCIÓN. Salta de celda en celda. Física de secundaria, pero con gatos.'],
    ['LUZTERNA', 'Ojo con los pararrayos: se tragan tus tiros de rayo como yo me tragaba las telenovelas. Cuando veas uno, cambia de gato.'],
    ['LUZTERNA', '¿Y esos tentáculos en el horizonte? No es tu imaginación. Bueno, a veces sí. Hoy no. Hoy son tentáculos.'],
  ],
  4: [
    ['LUZTERNA', 'Las Ruinas Sumergidas, {name}. Aquí había una biblioteca. Ahora hay una biblioteca… debajo del agua. Y enojada.'],
    ['LUZTERNA', 'Sus gatos usan MAGIA: runas que doblan en el aire y te persiguen como ex con WhatsApp. No te escondas, rómpeles los camarotes.'],
    ['LUZTERNA', 'TIERRA aguanta bien aquí, pero NATURALEZA le rompe la piedra. Planta raíces en esos templos.'],
    ['LUZTERNA', 'Y alguien está arrancando páginas del mar. No sé quién. Bueno, sí sé. Pero si lo digo, aparece.'],
  ],
  5: [
    ['LUZTERNA', 'El Abismo Estelar. Aquí el cielo está tan cerca que se te pega en el pelo.'],
    ['LUZTERNA', 'Lo CÓSMICO no va derecho: sus orbes se curvan hacia la masa. O sea, hacia tu barco. Qué romántico. Qué horrible.'],
    ['LUZTERNA', 'MAGIA le gana a lo cósmico. TIERRA aguanta el rayo. Arma un barco con las dos y deja de llorar.'],
    ['LUZTERNA', 'Si ves una estrella que no titila… no le pidas un deseo. Esa ya cayó una vez y no le gustó.'],
  ],
  6: [
    ['LUZTERNA', 'La Marea Sin Nombre. El último mar del mapa. Aquí el agua se olvida de todo lo que toca.'],
    ['LUZTERNA', 'Barcos de hueso, galeones de niebla y gatos de todo tipo. No hay un elemento ganador: lleva un barco variado.'],
    ['LUZTERNA', 'AGUA para el fuego. Y magia y cósmico se pegan entre sí, así que el primero que pegue, gana.'],
    ['LUZTERNA', '…Al fondo está el Primer Mar. Si algo me pasa, {name}, dile a Canelo que su bufanda siempre me pareció horrible. Con cariño.'],
  ],
};

/** a heads-up when the zone elite becomes the next stage */
export const ELITE_WARN: Record<number, Line[]> = {
  2: [
    ['LUZTERNA', 'Ese de la etapa 5 es el Barón Ladrillo. No dispara a tu cara: dispara a tus SOPORTES.'],
    ['LUZTERNA', 'Mira la vista previa de colapso antes de soltar… o te quedas sin barco y sin piso. Otro ladrillo en la pared, pero el ladrillo eres tú.'],
  ],
  3: [
    ['LUZTERNA', 'La Bruja Nimbus. Primero te moja. Luego te electrocuta. Es su único truco y le funciona de maravilla.'],
    ['LUZTERNA', 'Si te deja MOJADO, no amontones gatos juntos: la Conducción salta. Aprende de ella antes de que ella te enseñe a golpes.'],
  ],
  4: [
    ['LUZTERNA', 'Capitana Mira. Francotiradora. Dice que nunca falla. Una vez falló. No le menciones esa vez.'],
    ['LUZTERNA', 'Caza gatos Expuestos: que tus gatos no se queden sin pared enfrente. Esconde a los débiles y deja que Gea reciba los balazos.'],
  ],
  5: [
    ['LUZTERNA', 'El Almirante Tictoque. Repara su barco mientras viva su sala de máquinas.'],
    ['LUZTERNA', 'Así que primero la sala de máquinas. Luego todo lo demás. Tic, tac, {g:capitán|capitana|capi}.'],
  ],
  6: [
    ['LUZTERNA', 'Lady Garra. Se acuerda de cada rasguño y va por el gato que más le pegó.'],
    ['LUZTERNA', 'Úsalo a tu favor: que el que le pegue sea tu tanque. Y si le tumbas dos gatos, aguas: se pone en modo Berserk.'],
  ],
};

/** boss presentation: when the boss node becomes the frontier (mission H10 / H13 appears) */
export const BOSS_INTRO: Record<number, Line[]> = {
  2: [
    ['GÁRGOLA', 'Rrrrrrr… Llevo trescientos años durmiendo en este acantilado. ¿Y tú vienes a hacer ruido?'],
    ['LUZTERNA', 'La Gárgola Ronroneante. PIEL DE PIEDRA: todo le hace la mitad… menos TIERRA y Estallido. Trae a Gea.'],
    ['LUZTERNA', 'Cada 3 turnos ronronea y se cura. Si le pegas en LA GARGANTA, se le corta el ronroneo y se queda tiesa. Como estatua. Que es.'],
    ['GÁRGOLA', 'El cielo también ronronea cuando se enoja. Ya lo vas a escuchar.'],
  ],
  3: [
    ['KRAKEN', '¡Míralo! ¡Le caíste bien! ¡Te va a abrazar HASTA QUE TRUENES!'],
    ['LUZTERNA', 'Ese capitancito chillón vive en la cabeza de un kraken. El kraken no habla. Abraza. Mucho.'],
    ['LUZTERNA', 'Cada tentáculo agarra un módulo tuyo y lo apaga. Córtalos. Y cuando abra el pico, al OJO, que ahí sí le duele.'],
    ['LUZTERNA', 'Ah, y dicen que a la mitad de la pelea hace un ruido raro. Como… ¡CLANK! No sé. Yo nomás te aviso.'],
  ],
  4: [
    ['ARCANISTA', 'Ya conoces mi magia. Ahora conoce mi PACIENCIA. …Mentira, no tengo.'],
    ['LUZTERNA', 'El Arcanista. El que arranca páginas del Archivo. Su barco es una biblioteca con cañones.'],
    ['LUZTERNA', 'Trae NATURALEZA para romperle la piedra y no dejes que sus runas te encuentren los camarotes. Y si llevas MAGIA… ahora está parejo.'],
    ['ARCANISTA', 'Llévate lo que quieras de mi grimorio. Si puedes.'],
  ],
  5: [
    ['ESTRELLA', 'Caí una vez del cielo. No me gustó. Ahora tú vas a caer.'],
    ['LUZTERNA', 'La Estrella Errante. Brilla tanto que no se le ven las intenciones. Pero las tiene. Muchas.'],
    ['LUZTERNA', 'Sus orbes se curvan hacia tu barco: no te quedes quieto pensando. MAGIA le pega fuerte. TIERRA aguanta su tormenta.'],
  ],
  6: [
    ['LUZTERNA', 'Este es. El Primer Mar. Todo lo que cae aquí se olvida… a menos que alguien lo recuerde muy fuerte.'],
    ['DISTRAXIA', 'Este mar recuerda todo lo que el Archivo olvidó. Y yo me encargo de que lo olvide otra vez.'],
    ['DISTRAXIA', 'Yo no destruyo, grumete. Yo BORRO.'],
    ['NOCTIS', '¿Qué? ¿Creíste que te iba a dejar la gloria a ti solito? Muévete, que les tapo la vista.'],
    ['LUZTERNA', '¿Ves esa cosa enorme? Ya sabes qué hacer. Mantén… y suelta.'],
  ],
};

/** boss farewell: back on the island/map after the victory (the T4 discovery already played in Results) */
export const BOSS_OUTRO: Record<number, Line[]> = {
  2: [
    ['GÁRGOLA', 'Rrr… la tormenta ya no es mía. Llévatela. Hace ruido.'],
    ['LUZTERNA', '¿Oyes eso, {name}? Es el cielo. Y ahora ronronea para TI.'],
    ['LUZTERNA', 'TORMENTA: el RAYO va casi recto y no falla; la RÁFAGA empuja gatos y escombros. Rayo contra hierro = SOBRECARGA. Contra mojado = CONDUCCIÓN.'],
    ['LUZTERNA', 'Tronador truena bajito para advertirte. Luego truena fuerte. Ponlo en el barco y que los Acantilados se acuerden de ti.'],
    ['LUZTERNA', 'Siguiente parada: el Mar de Tormentas. Lleva paraguas. No, es broma. Lleva gatos.'],
  ],
  3: [
    ['SISTEMA', '¡CLANK!'],
    ['LUZTERNA', '¿Una BURBUJA? ¿Desde cuándo los calamares traen escudo? …Ok. Anótalo: NUEVA MECÁNICA: ESCUDOS.'],
    ['KRAKEN', 'Ok, ok… ¡suéltalo! ¡Llévate los planos del escudo pero suéltalo!'],
    ['LUZTERNA', 'Te quedas con los planos del escudo, {g:capitán|capitana|capi}. Y con el Bastión, ese acorazado que flota de milagro. Pásate al Astillero.'],
    ['NOCTIS', 'Tres jefes, {name}. Qué tierno. ¿Sabes qué hay más allá de la tormenta? Una biblioteca. Hundida. Y alguien que arranca páginas.'],
    ['LUZTERNA', '…Odio cuando aparece así. Y odio más cuando tiene razón.'],
  ],
  4: [
    ['LUZTERNA', 'Se fue el Arcanista. Y dejó caer a Merlina, la gata del grimorio. Dice que le corregía la ortografía. Se le nota.'],
    ['LUZTERNA', 'Ahora tienes una gata de MAGIA. Constrúyele un hábitat de Magia en la TIENDA, que si no, duerme en la calle y se queja en verso.'],
    ['NOCTIS', 'Cuatro jefes. Ya me estás cayendo bien. No se lo digas a nadie.'],
  ],
  5: [
    ['ESTRELLA', 'Ahí está… lo que me empujó del cielo. Viene por ti. ¿Lo oyes?'],
    ['LUZTERNA', 'No oigo nada. …Ok, sí oigo. Como estática. Como una tele vieja prendida en otro cuarto.'],
    ['LUZTERNA', 'Astra Prima se queda contigo. Ponla en el barco y que el cielo se acuerde de quién manda.'],
  ],
};

/** short story lines for the Diario del Mar (boss front pages): kicker + "next edition" teaser */
export const BOSS_NEWS: Record<number, { kicker: string; teaserHead: string; teaser: string }> = {
  1: {
    kicker: '¡CAE EL TIBURÓN!',
    teaserHead: '¿QUIÉN ES LA MÁSCARA DEL HORIZONTE?',
    teaser: 'Pescadores de los Acantilados juran haber visto un barco de velas negras… y a alguien saludando con antifaz.',
  },
  2: {
    kicker: '¡SE DESPIERTA EL CIELO!',
    teaserHead: 'TORMENTA PERMANENTE SOBRE EL MAR DEL ESTE',
    teaser: '«Algo con tentáculos nos abrazó y nos soltó», declaran marineros empapados. La Flota del Kraken no quiso comentar.',
  },
  3: {
    kicker: '¡EL PRIMER ESCUDO DEL MAR!',
    teaserHead: 'UNA BIBLIOTECA ENTERA SE HUNDE: FALTAN PÁGINAS',
    teaser: 'Testigos reportan un barco que «brilla de noche». Los barcos no brillan. Las autoridades piden no leer nada raro.',
  },
  4: {
    kicker: '¡CIERRAN LA BIBLIOTECA!',
    teaserHead: 'UNA ESTRELLA SE NIEGA A TITILAR',
    teaser: 'Astrónomos aficionados reportan una estrella «con actitud» bajando hacia el Abismo. Piden no pedirle deseos.',
  },
  5: {
    kicker: '¡CAE UNA ESTRELLA (OTRA VEZ)!',
    teaserHead: 'EL MAR AMANECE SIN NOMBRE',
    teaser: 'Pescadores juran que el agua «se olvidó» de sus redes. Los peces no comentan. No se acuerdan.',
  },
  6: {
    kicker: '¡EL PRIMER MAR SE CALLA!',
    teaserHead: 'UNKNOWN ELEMENT DETECTED',
    teaser: 'Algo sin cara se asomó por la tapa del cielo. Dijo una sola palabra. Nadie la entendió. Nadie… ¿o NADIE?',
  },
};

/** pools for the Results headline (MVP = {M}, enemy = {E}) */
export const HEADLINES = {
  elite: ['{M} DOMA A {E}', '{E}, LA ÉLITE, ¡HUMILLADA!', '«ERA ÉLITE», SOLLOZA {E}', '{M} LE QUITA LO ÉLITE A {E}'],
  reaction: {
    steam: ['¡VAPOR! {M} COCINA A {E} AL VAPOR', '{E} TERMINA COMO TAMAL: AL VAPOR'],
    fire: ['¡INCENDIO A BORDO DE {E}!', '{M} PRENDE FUEGO A {E} (Y A SU DIGNIDAD)'],
    conduction: ['¡CONDUCCIÓN! {M} ELECTROCUTA A {E} ENTERO', '{E}: «NO SABÍAMOS QUE EL AGUA CONDUCÍA»'],
    overload: ['¡SOBRECARGA! {M} FRÍE EL HIERRO DE {E}', 'SE FUNDEN LOS FUSIBLES DE {E}'],
    blizzard: ['¡VENTISCA! {E} AMANECE CONGELADO', '{M} CONGELA A {E}: «HACE FRESCO», DICE'],
    burst: ['¡ESTALLIDO! {M} HACE GRAVA A {E}', '{E} AHORA ES PURA GRAVILLA'],
    bloom: ['¡FLORECER! {E} SE LLENA DE FLORES (Y DE AGUJEROS)', '{M} PLANTA UN JARDÍN EN {E}'],
    breach: ['¡BRECHA! {E} HACE AGUA POR TODOS LADOS', '{M} ABRE UNA PISCINA EN {E}'],
    powder: ['¡SANTABÁRBARA! {E} VUELA POR LOS AIRES', '{M} ENCUENTRA LA PÓLVORA DE {E}. BUM.'],
    any: ['¡SINERGIA! {M} MEZCLA ELEMENTOS Y {E} PAGA', 'QUÍMICA GATUNA: {E} NO ENTENDIÓ NADA'],
  } as Record<string, string[]>,
  errand: ['ENCARGO CUMPLIDO: {M} NO PREGUNTA, SOLO HUNDE', '{M} COBRA EL ENCARGO Y SE VA SIN PROPINA', '«LO PEDISTE, LO HUNDÍ»: {M}'],
  rank: ['{R}: {M} SUBE DE RANGO', '{M} ASCIENDE A {R} Y PIDE AUMENTO (DE PESCADO)'],
} as const;

/** reaction display name (as BattleScene flags it) → headline pool key */
export function reactionKey(name: string): string | null {
  const n = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z_]/g, '');
  const map: Record<string, string> = {
    conduccion: 'conduction',
    vapor: 'steam',
    incendio: 'fire',
    ventisca: 'blizzard',
    estallido: 'burst',
    florecer: 'bloom',
    brecha: 'breach',
    sobrecarga: 'overload',
    santabarbara: 'powder',
    avivar: 'fire',
  };
  if (n === 'pararrayos' || n === 'devorar' || !n) return null;
  return map[n] ?? 'any';
}

// ------------------------------------------------------------------ Capítulo 1: zonas 3–6 (historia)
/** H11 — El Heredero del Trueno (aparece al vencer a la Gárgola) */
export const RAIJIN_INTRO: Line[] = [
  ['LUZTERNA', '¿Ves esa torre en medio del Mar de Tormentas? No es un faro. Es un pararrayos con patas.'],
  ['RAIJIN', '¿Tú eres el que quiere heredar el trueno? Primero sobrevive a él.'],
  ['LUZTERNA', 'Se traga tus rayos mientras su mástil siga en pie. Tumba el mástil o pégale con otra cosa. Toca la misión fijada cuando quieras subir.'],
];
export const RAIJIN_OUTRO: Line[] = [
  ['RAIJIN', 'Ok. Me caes bien. Me voy contigo. Pero yo elijo el camarote.'],
  ['LUZTERNA', 'Un MÍTICO, {name}. Ni yo tengo uno. Bueno, yo tengo uno: yo. Pero estoy muerta, no cuento.'],
];
/** H14 — Algo viene (b16): el Heraldo trae la Magia */
export const HERALDO_INTRO: Line[] = [
  ['LUZTERNA', '…Ese barco brilla. Los barcos no brillan. ¿Por qué brilla?'],
  ['SISTEMA', '¡CLANK! (su gato levanta un escudo que no es de este mar)'],
  ['LUZTERNA', '¡¿QUÉ PUTAS?! ¡Eso no es un escudo normal!'],
  ['HERALDO', 'Ah. Así que tú eres el que anda despertando primordiales. Qué ruidoso.'],
  ['LUZTERNA', 'Toca la misión fijada. Quiero ver qué trae ese barco adentro. …Y quiero que deje de brillar, me da dolor de cabeza.'],
];
export const HERALDO_OUTRO: Line[] = [
  ['HERALDO', 'Interesante. Muy interesante. Nos vemos en las Ruinas, grumete.'],
  ['LUZTERNA', 'MAGIA. Un elemento que no debería existir en este mar. Y ahora está en tu isla. Nada puede salir mal.'],
  ['LUZTERNA', 'La Magia le gana a lo Cósmico y lo Cósmico a la Magia. Se odian. Como mis tías en Navidad.'],
];
/** H18 — La Grieta */
export const GRIETA_INTRO: Line[] = [
  ['SISTEMA', '(Se abre una grieta en el cielo del Abismo. Algo adentro respira despacito.)'],
  ['LUZTERNA', 'No me gusta. Nada. Pero si no entramos nosotros, entra otro. Y el otro es peor.'],
  ['LUZTERNA', 'Toca la misión fijada cuando tengas el barco listo. Y si escuchas a alguien gritar «¡MATEN A ESE YA!»… soy yo.'],
];
export const GRIETA_OUTRO: Line[] = [
  ['SISTEMA', '(La Singularidad se acurruca en tu barco como si siempre hubiera sido suyo.)'],
  ['LUZTERNA', 'Se quedó dormida en el camarote de Canelo. Canelo no va a decir nada. Canelo le tiene miedo.'],
];
/** H19 — Un barco que no debería existir (b20) */
export const VACIO_INTRO: Line[] = [
  ['SISTEMA', 'A VOID SHIP HAS ENTERED YOUR WORLD'],
  ['LUZTERNA', 'No. No, no, no. Eso no es de este mar. Eso no es de NINGÚN mar.'],
  ['LUZTERNA', 'No lo vas a hundir. Se va al turno 8. Solo hazle daño, al menos 15%. Que se acuerde de ti.'],
];
export const VACIO_OUTRO: Line[] = [
  ['SISTEMA', '(La estática forma una palabra que nadie alcanza a leer.)'],
  ['LUZTERNA', 'Esos fragmentos que dejó… están fríos y vacíos. Como los del grimorio. Júntalos. Algo me dice que van a importar.'],
];
/** H20 — Hace mucho tiempo, en una balsa… (b21) */
export const PATITO_INTRO: Line[] = [
  ['LUZTERNA', 'Oye, {name}… ¿te acuerdas de tu primera batalla? En la Bahía Sardina. Contra un pato.'],
  ['PATITO', '¿Te… te acuerdas de mí? ¡Cuac! …no, por favor, no con ESO.'],
  ['LUZTERNA', 'Toca la misión fijada. Es por los viejos tiempos. Y por las risas.'],
];
export const PATITO_OUTRO: Line[] = [
  ['PATITO', '¡CUAAAAAAAAAAAAC!'],
  ['LUZTERNA', 'Tu primer gato lanzaba bolas de pelo. Hoy borras patos con un dedo. Estoy orgullosa y un poquito asustada.'],
];
/** H21 done — Marea Final (b23) */
export const MAREA_FINAL: Line[] = [
  ['SISTEMA', 'MAREA FINAL — TODA TU ISLA x1000 DURANTE 3:00'],
  ['LUZTERNA', 'Mira tu isla. Mírala trabajar. Eso lo hiciste tú. Bueno, ellos. Pero tú les diste de comer.'],
];
/** after the Marea Final — UNKNOWN ELEMENT DETECTED (b24) */
export const UNKNOWN_END: Line[] = [
  ['SISTEMA', '(El mar empieza a subir sin viento. Todos tus gatos miran fijamente el mismo punto del cielo. Por primera vez, no es la pared.)'],
  ['SISTEMA', 'UNKNOWN ELEMENT DETECTED'],
  ['SISTEMA', '(El cielo se abre como la tapa de una caja. Se asoma una silueta sin cara hecha de estática.)'],
  ['???', '¿Quién derrotó a mi almirante?'],
  ['TUS GATOS', '(todos a la vez) …Nadie.'],
  ['???', '(silencio) …Yo soy NADIE.'],
  ['NADIE', 'NO ONE LIKES CATS.'],
  ['CAPTION', 'NO ONE LIKE CATS. (A NADIE le falta una «S». A los gatos no les falta nada.)'],
  ['CAPTION', 'CONTINUARÁ →'],
];
/** H22 done — Velo Noctis joins (the "post" unlocks of Continuará) */
export const NOCTIS_JOINS: Line[] = [
  ['NOCTIS', 'Me debes una. Y un camarote con vista al mar.'],
  ['LUZTERNA', 'Capítulo 1 completo, {name}. Tu isla seguirá produciendo. Nos vemos en el próximo mar.'],
];
