/**
 * El Podio — power "cards". A cat's 4 powers come ONLY from its species (elements, rarity, role,
 * battleForm/shot/ultimate names in content.json): if the rival has the same cat, it has the same
 * powers. What changes between two copies is the level of each power (podio level) and the stats
 * (cat level, stars, accessories, traits, mutations).
 *
 * Slots: 0 BÁSICO (its ship shot) · 1 TÉCNICA (element) · 2 ESTILO (role) · 3 ULTI (battle form, needs meter).
 */
import { CatDef, catDef } from '../data/content';

export type PowerKind = 'strike' | 'beam' | 'orb' | 'slash' | 'multi' | 'dot' | 'heal' | 'shield' | 'stun' | 'summon' | 'crush' | 'snipe' | 'ult';
export type StatusId = 'burn' | 'root' | 'soak' | 'shock' | 'curse' | 'crack' | 'stun' | 'regen' | 'freeze' | 'blind';

export interface PowerDef {
  slot: 0 | 1 | 2 | 3;
  /** shouted name (English / Japanese, anime style) */
  name: string;
  /** what the cat yells when using it */
  cry: string;
  /** short Spanish description (what it does) */
  desc: string;
  kind: PowerKind;
  element: string;
  /** damage multiplier vs ATK (0 for pure support) */
  mult: number;
  /** turns before it can be used again (0 = always) */
  cd: number;
  /** extra hits (multi) */
  hits?: number;
  /** status applied on hit */
  status?: { id: StatusId; turns: number; chance: number };
  /** heal / shield as fraction of max HP */
  amount?: number;
  /** always crits */
  sureCrit?: boolean;
  /** needs a full meter */
  ult?: boolean;
  /** Parte 2 — Sombra/Sonido: can't be dodged and goes through the shield */
  pierce?: boolean;
  /** Parte 2 — Tiempo: heals half the damage dealt; 25% to steal an extra turn */
  rewind?: boolean;
  /** Parte 2 — Vacío: eats the shield and erases 8% of the rival's max HP for good */
  erase?: boolean;
  // ---- signature ULTIs (Heroicos / Divinos): engine.ts reads these
  /** fraction of the rival's ULTI meter it removes (1 = empties it) */
  drain?: number;
  /** shield for itself (fraction of its max HP) after hitting */
  selfShield?: number;
  /** heals itself (fraction of its max HP) after hitting */
  selfHeal?: number;
  /** after the hits, the rival loses HALF of the HP it has left (never a K.O. by itself) */
  halve?: boolean;
  /** damage-over-time multiplier of the status it applies */
  dotMul?: number;
}

export const SLOT_LABEL = ['BÁSICO', 'TÉCNICA', 'ESTILO', 'ULTI'] as const;

export const STATUS_NAME: Record<StatusId, string> = {
  burn: 'ARDIENDO',
  root: 'ENRAIZADO',
  soak: 'EMPAPADO',
  shock: 'CARGADO',
  curse: 'MALDITO',
  crack: 'QUEBRADO',
  stun: 'ATURDIDO',
  regen: 'REGENERA',
  freeze: 'CONGELADO',
  blind: 'CEGADO',
};
export const STATUS_DESC: Record<StatusId, string> = {
  burn: 'pierde vida cada turno',
  root: 'raíces que chupan vida cada turno',
  soak: 'pega 20% menos',
  shock: '30% de quedarse tieso cada turno',
  curse: 'el próximo golpe le entra x1.5',
  crack: 'recibe +30% de daño',
  stun: 'pierde su próximo turno',
  regen: 'recupera vida cada turno',
  freeze: 'pierde su próximo turno; un golpe de fuego lo revienta ×1.5',
  blind: 'sus ataques fallan 35% más',
};

/** ship-shot status → podio status */
const SHOT_STATUS: Record<string, StatusId> = {
  ardiendo: 'burn',
  enraizado: 'root',
  maldito: 'curse',
  aturdido: 'stun',
  cargado: 'shock',
  mojado: 'soak',
  corriente: 'soak',
  vapor: 'soak',
  marcado: 'crack',
  sellado: 'shock',
  ingravido: 'crack',
  // Parte 2
  congelado: 'freeze',
  cegado: 'blind',
  vacio: 'crack',
  // Parte II · Cristal: the prism leaves a crack in the guard
  prisma: 'crack',
};

const SHOT_KIND: Record<string, PowerKind> = {
  rayo: 'beam',
  objetivo: 'beam',
  torpedo: 'beam',
  bola_rebote: 'orb',
  orbe_gravitatorio: 'orb',
  roca: 'orb',
  semilla: 'orb',
  runa: 'slash',
  rafaga: 'slash',
  // Parte 2
  carambano: 'orb',
  haz: 'beam',
  sombra: 'slash',
  onda: 'beam',
  reloj: 'orb',
  borrado: 'crush',
};

interface TechDef {
  name: string;
  cry: string;
  mult: number;
  status?: { id: StatusId; turns: number; chance: number };
  kind: PowerKind;
  desc: string;
  pierce?: boolean;
  rewind?: boolean;
  erase?: boolean;
}
/** slot 1: the element technique (dual cats use their SECOND element: the "other" side of them) */
const TECH: Record<string, TechDef> = {
  fire: { name: 'BLAZE FANG! (炎牙)', cry: '¡QUEMA, QUEMA!', mult: 1.45, kind: 'slash', status: { id: 'burn', turns: 2, chance: 0.75 }, desc: 'Mordida de fuego. Suele dejarlo ARDIENDO.' },
  water: { name: 'TIDAL SNAP! (水撃)', cry: '¡AL AGUA, PATO!', mult: 1.4, kind: 'beam', status: { id: 'soak', turns: 2, chance: 0.8 }, desc: 'Chorro a presión. Lo deja EMPAPADO (pega menos).' },
  nature: { name: 'THORN WHIP! (茨鞭)', cry: '¡ESPINAS, BEBÉ!', mult: 1.35, kind: 'slash', status: { id: 'root', turns: 3, chance: 0.8 }, desc: 'Látigo de espinas. Raíces que chupan vida.' },
  earth: { name: 'STONE CRASH! (岩砕)', cry: '¡PIEDRA Y PUNTO!', mult: 1.5, kind: 'crush', status: { id: 'crack', turns: 2, chance: 0.6 }, desc: 'Roca a la cabeza. Puede QUEBRARLE la guardia.' },
  storm: { name: 'THUNDER CLAW! (雷爪)', cry: '¡ZAP ZAP, MIAU!', mult: 1.4, kind: 'beam', status: { id: 'shock', turns: 2, chance: 0.7 }, desc: 'Garra eléctrica. Lo deja CARGADO (a veces no se mueve).' },
  magic: { name: 'HEX SIGIL! (呪印)', cry: '¡TE ECHO EL OJO!', mult: 1.35, kind: 'orb', status: { id: 'curse', turns: 2, chance: 0.85 }, desc: 'Sello maldito. Su próximo golpe recibido entra x1.5.' },
  cosmic: { name: 'STAR FALL! (星落)', cry: '¡CAE, ESTRELLITA!', mult: 1.65, kind: 'orb', desc: 'Una estrella entera en la nuca. Puro daño.' },
  // Parte 2 (los seis elementos del multiverso)
  ice: { name: 'FROST BITE! (氷牙)', cry: '¡QUIETECITO!', mult: 1.35, kind: 'slash', status: { id: 'freeze', turns: 1, chance: 0.45 }, desc: 'Mordida helada: puede CONGELARLO (pierde su turno). Si luego le pegas fuego, revienta.' },
  light: { name: 'PRISM FLASH! (閃光)', cry: '¡NO ME MIRES… BUENO, SÍ!', mult: 1.35, kind: 'beam', status: { id: 'blind', turns: 2, chance: 0.85 }, desc: 'Destello en la cara: lo deja CEGADO (sus ataques fallan más).' },
  shadow: { name: 'SHADOW STITCH! (影縫い)', cry: 'Detrás de ti.', mult: 1.45, kind: 'snipe', pierce: true, desc: 'Desde la espalda: no se puede esquivar y atraviesa el escudo.' },
  sound: { name: 'SONIC BOOM! (音撃)', cry: '¡SÚBELE!', mult: 1.3, kind: 'beam', pierce: true, status: { id: 'stun', turns: 1, chance: 0.4 }, desc: 'La onda atraviesa el escudo y puede ATURDIRLO.' },
  time: { name: 'REWIND CLAW! (巻戻し)', cry: '¡OTRA VEZ, DESDE EL PRINCIPIO!', mult: 1.25, kind: 'slash', rewind: true, desc: 'Se cura la mitad de lo que pega y a veces se roba un turno extra.' },
  void: { name: 'NULL BITE! (虚無)', cry: '…', mult: 1.4, kind: 'crush', erase: true, desc: 'Se come su escudo y le BORRA 8% de la vida máxima. Para siempre.' },
  // Parte II · Oleada 1
  crystal: { name: 'PRISM SHARD! (分光)', cry: '¡MÍRATE, PERO DE LADO!', mult: 1.4, kind: 'beam', status: { id: 'crack', turns: 2, chance: 0.6 }, desc: 'Una esquirla de nácar refractada: puede dejarlo QUEBRADO (recibe +30%).' },
};

interface StyleDef {
  name: string;
  cry: string;
  kind: PowerKind;
  mult: number;
  hits?: number;
  amount?: number;
  sureCrit?: boolean;
  status?: { id: StatusId; turns: number; chance: number };
  desc: string;
}
/** slot 2: the role style (artillero, tanque…) */
const STYLE: Record<string, StyleDef> = {
  artillero: { name: 'TRIPLE HAIRBALL! (三連弾)', cry: '¡RA-TA-TÁ!', kind: 'multi', mult: 0.55, hits: 3, desc: 'Ráfaga de 3 golpes.' },
  demoledor: { name: 'ARMOR CRUSH! (装甲砕き)', cry: '¡A DEMOLER!', kind: 'crush', mult: 1.3, status: { id: 'crack', turns: 2, chance: 1 }, desc: 'Golpe que siempre lo QUIEBRA (+30% daño recibido).' },
  francotirador: { name: 'ONE SHOT, ONE MEOW! (一撃)', cry: 'Quieto… ¡AHÍ!', kind: 'snipe', mult: 1.3, sureCrit: true, desc: 'Tiro limpio: crítico garantizado.' },
  asediador: { name: 'SLOW AGONY! (じわじわ)', cry: 'Sin prisa, mi amor.', kind: 'dot', mult: 0.6, desc: 'Poco daño ahora y su estado de elemento por 3 turnos, garantizado.' },
  soporte: { name: 'NINE LIVES! (九つの命)', cry: 'Me quedan ocho. Creo.', kind: 'heal', mult: 0, amount: 0.28, desc: 'Se cura 28% y se quita los estados malos.' },
  tanque: { name: 'FORTRESS FUR! (毛皮の砦)', cry: '¡Pega más fuerte, a ver!', kind: 'shield', mult: 0, amount: 0.32, desc: 'Escudo de pelo: absorbe 32% de su vida en daño.' },
  controlador: { name: 'HYPNO PURR! (催眠)', cry: 'Mírame a los ojos…', kind: 'stun', mult: 0.7, status: { id: 'stun', turns: 1, chance: 0.55 }, desc: 'Ronroneo hipnótico: 55% de ATURDIRLO un turno.' },
  invocador: { name: 'SPIRIT CALL! (召喚)', cry: '¡Vengan, muchachos!', kind: 'summon', mult: 0.5, desc: 'Invoca un espíritu que lo ataca 3 turnos.' },
};

/** status an element applies when a power needs "its element's status" */
export function elementStatus(el: string): StatusId {
  return ({ fire: 'burn', water: 'soak', nature: 'root', earth: 'crack', storm: 'shock', magic: 'curse', cosmic: 'crack', ice: 'freeze', light: 'blind', shadow: 'curse', sound: 'shock', time: 'crack', void: 'crack', crystal: 'crack' } as Record<string, StatusId>)[el] ?? 'burn';
}

/** the 4 power cards of a species */
export function powersOf(species: string): PowerDef[] {
  const d = catDef(species);
  return [basic(d), tech(d), style(d), ult(d)];
}

function basic(d: CatDef): PowerDef {
  const s = d.combat.shot;
  const el = s.element || d.elements[0];
  const st = s.status ? SHOT_STATUS[s.status] : undefined;
  return {
    slot: 0,
    name: (s.cry || s.name).replace(/!+$/, '!'),
    cry: s.cry || d.battleForm.cry,
    desc: `Su disparo de barco, a quemarropa.${st ? ` A veces deja ${STATUS_NAME[st]}.` : ''}`,
    kind: SHOT_KIND[s.archetype] ?? 'strike',
    element: el,
    mult: 1,
    cd: 0,
    status: st ? { id: st, turns: st === 'freeze' ? 1 : 2, chance: st === 'stun' || st === 'freeze' ? 0.12 : 0.3 } : undefined,
  };
}

function tech(d: CatDef): PowerDef {
  const el = d.elements[1] ?? d.elements[0];
  const t = TECH[el] ?? TECH.fire;
  return { slot: 1, name: t.name, cry: t.cry, desc: t.desc, kind: t.kind, element: el, mult: t.mult, cd: 2, status: t.status, pierce: t.pierce, rewind: t.rewind, erase: t.erase };
}

function style(d: CatDef): PowerDef {
  const r = STYLE[d.role] ?? STYLE.artillero;
  const el = d.elements[0];
  const status = r.kind === 'dot' ? { id: elementStatus(el), turns: 3, chance: 1 } : r.status;
  return { slot: 2, name: r.name, cry: r.cry, desc: r.desc, kind: r.kind, element: el, mult: r.mult, cd: 3, hits: r.hits, amount: r.amount, sureCrit: r.sureCrit, status };
}

/**
 * Signature ULTIs of the Heroicos (El Podio's own warriors) and the Divinos: the same idea as their ship
 * ultimate, translated to a 1 vs 1 (battle/ults.ts is the ship version). Same rules for a rival's copy.
 */
const SIGNATURE: Record<string, Partial<PowerDef> & { desc: string }> = {
  h_zarpa: { kind: 'slash', mult: 0.9, hits: 3, pierce: true, status: { id: 'burn', turns: 3, chance: 1 }, desc: 'Tres espadazos en llamas que atraviesan cualquier escudo. Lo deja ARDIENDO 3 turnos.' },
  h_granbigote: { kind: 'crush', mult: 2.4, status: { id: 'crack', turns: 3, chance: 1 }, selfShield: 0.3, desc: 'Lo aplasta (QUEBRADO 3 turnos) y se queda plantado: escudo de 30% de su vida.' },
  h_valquiria: { kind: 'beam', mult: 1.15, hits: 2, status: { id: 'shock', turns: 3, chance: 1 }, desc: 'Dos lanzas de rayo desde el cielo. Lo deja CARGADO 3 turnos.' },
  h_nekomante: { kind: 'orb', mult: 2.2, status: { id: 'curse', turns: 2, chance: 1 }, drain: 0.6, selfHeal: 0.15, desc: 'Lo maldice, le roba el 60% de su barra de ULTI y se cura 15% con lo robado.' },
  d_horizonte: { kind: 'ult', mult: 2.4, drain: 1, status: { id: 'crack', turns: 3, chance: 1 }, desc: 'DIVINO. Agujero negro: le borra TODA la barra de ULTI y lo deja QUEBRADO 3 turnos.' },
  d_solcaido: { kind: 'ult', mult: 3, status: { id: 'burn', turns: 3, chance: 1 }, dotMul: 2, desc: 'DIVINO. Le cae el sol encima: golpe enorme y ARDIENDO 3 turnos al doble.' },
  d_milvidas: { kind: 'slash', mult: 0.3, hits: 10, pierce: true, desc: 'DIVINO. Diez cortes de sombra (cada uno crítico) que atraviesan escudos.' },
  d_bigbang: { kind: 'ult', mult: 1.6, halve: true, status: { id: 'stun', turns: 1, chance: 1 }, desc: 'DIVINO. Un golpe y luego le quita LA MITAD de la vida que le quede. Lo deja ATURDIDO.' },
  // the multiverse legendaries (Parte 2): a plain ULTI hits ×2.6; these trade part of it for their element (a lost
  // turn, blindness, erasing…), ending above a plain ULTI and below the Heroicos
  l_boreas: { kind: 'orb', mult: 2.2, status: { id: 'freeze', turns: 1, chance: 1 }, desc: 'La aurora lo CONGELA (pierde su turno). Si luego le pegas fuego, revienta ×1.5.' },
  l_aurea: { kind: 'beam', mult: 0.8, hits: 3, status: { id: 'blind', turns: 3, chance: 1 }, desc: 'Tres rayos del halo. Lo deja CEGADO 3 turnos (sus ataques fallan más).' },
  l_medianoche: { kind: 'slash', mult: 1.25, hits: 2, pierce: true, status: { id: 'curse', turns: 2, chance: 1 }, desc: 'Dos puñaladas desde la medianoche: no se esquivan, atraviesan el escudo y lo dejan MALDITO.' },
  l_headliner: { kind: 'beam', mult: 2.2, pierce: true, status: { id: 'stun', turns: 1, chance: 1 }, desc: 'Un acorde que atraviesa cualquier escudo y lo ATURDE (si no acaba de estarlo).' },
  l_nadie: { kind: 'crush', mult: 2.2, erase: true, pierce: true, desc: 'Nadie lo ve venir: se come su escudo y le BORRA 8% de la vida máxima para siempre.' },
  l_cronos: { kind: 'ult', mult: 1.9, rewind: true, status: { id: 'stun', turns: 1, chance: 1 }, desc: 'TIME STOP: pierde su próximo turno, y Cronos se cura la mitad de lo que pega.' },
  // Parte II · Oleada 1: the Cristal primordial
  l_madrenacar: { kind: 'orb', mult: 1.9, selfShield: 0.3, status: { id: 'crack', turns: 2, chance: 1 }, desc: 'Lo encierra en nácar (QUEBRADO 2 turnos) y levanta una faceta: escudo de 30% de su vida.' },
};

function ult(d: CatDef): PowerDef {
  const u = d.combat.ultimate;
  const base: PowerDef = {
    slot: 3,
    name: u.name,
    cry: d.battleForm.cry,
    desc: `FORMA DE BATALLA: ${d.battleForm.name.split('—')[1]?.trim() ?? d.battleForm.name}. Daño brutal; necesita la barra llena.`,
    kind: 'ult',
    element: d.elements[0],
    mult: 2.6,
    cd: 0,
    ult: true,
  };
  const sig = SIGNATURE[d.id];
  return sig ? { ...base, ...sig, slot: 3, ult: true, cd: 0 } : base;
}

/**
 * Power levels from the podio level: they grow round-robin (BÁSICO, TÉCNICA, ESTILO, ULTI), 0 = locked.
 * Nv1: [1,1,0,0] · Nv2 unlocks ESTILO · Nv4 unlocks the ULTI · max 5 each (Nv19+).
 */
export function powerLevels(podioLvl: number): [number, number, number, number] {
  const L = Math.max(1, Math.floor(podioLvl));
  const lv: [number, number, number, number] = [1, 1, 0, 0];
  if (L >= 2) lv[2] = 1;
  if (L >= 4) lv[3] = 1;
  // every level after unlocking everything: +1 to the lowest, in slot order
  const extra = Math.max(0, L - 4) + (L >= 3 ? 1 : 0);
  for (let i = 0; i < extra; i++) {
    let k = 0;
    for (let j = 1; j < 4; j++) if (lv[j] < lv[k] && (j !== 3 || L >= 4) && (j !== 2 || L >= 2)) k = j;
    if (lv[k] >= 5) break;
    lv[k]++;
  }
  return lv;
}
/** podio level at which a slot unlocks */
export const SLOT_UNLOCK = [1, 1, 2, 4] as const;
