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
