/**
 * El Podio — the ladder: leagues of 5 rivals (the 5th is the league champion). Rivals are fixed
 * per (league, bout) for a given island (seeded), so a rematch is the same cat with the same cards.
 * Named leagues 1–8, then "LIGA DEL VACÍO II, III…" forever (the curve keeps climbing).
 */
import { CATS, CatDef } from '../data/content';
import { BAL, RarityId, catPower } from '../state/econ';
import PB from '../data/podio.json';

export interface LeagueDef {
  n: number;
  name: string;
  /** arena tone (accent) */
  color: number;
  rarities: RarityId[];
}

const NAMED: Omit<LeagueDef, 'n'>[] = [
  { name: 'LIGA DE CARTÓN', color: 0xb98348, rarities: ['common'] },
  { name: 'LIGA DE ARENA', color: 0xe0b77a, rarities: ['common', 'rare'] },
  { name: 'LIGA DE COBRE', color: 0xc77b3a, rarities: ['rare'] },
  { name: 'LIGA DE PLATA', color: 0xc9d3dc, rarities: ['rare', 'epic'] },
  { name: 'LIGA DE ORO', color: 0xffc94a, rarities: ['epic'] },
  { name: 'LIGA DE NEÓN', color: 0xff2e88, rarities: ['epic', 'legendary'] },
  { name: 'LIGA ESTELAR', color: 0x00e5ff, rarities: ['legendary'] },
  { name: 'LIGA DEL VACÍO', color: 0x8a5cff, rarities: ['legendary', 'mythic'] },
];
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];

export function league(n: number): LeagueDef {
  const i = Math.min(NAMED.length - 1, n - 1);
  const base = NAMED[i];
  const extra = n - NAMED.length;
  return { n, ...base, name: extra > 0 ? `${base.name} ${ROMAN[extra + 1] ?? extra + 1}` : base.name };
}

/** trainers: who brings each rival (flavour; the champion has a title) */
const TRAINERS = [
  'DOÑA PELUSA',
  'EL TÍO GARRAS',
  'LA NIÑA DEL ESTAMBRE',
  'DON BIGOTE SUCIO',
  'LA SEÑORA DE LOS 40 GATOS',
  'EL PESCADERO RESENTIDO',
  'SOR MAULLIDOS',
  'EL INFLUENCER FELINO',
  'LA ABUELA CROQUETA',
  'EL VETERINARIO MALVADO',
  'LOS GEMELOS ARENERO',
  'MADAME CROQUETTE',
  'EL CARTERO TRAUMADO',
  'LA DJ CATNIP',
  'EL PROFE DE ZUMBA',
];
const CHAMPS = ['BARÓN CARTÓN', 'LA REINA DEL ARENERO', 'EL MARQUÉS DE COBRE', 'LADY PLATA', 'EL REY MIDAS-MIAU', 'NEÓN KID', 'LA EMPERATRIZ ESTELAR', 'NADIE-EN-PARTICULAR'];

/** rival boasts (the line under its card before the duel) */
const TAUNTS = [
  'Mi gato desayuna gatos como el tuyo.',
  'Te voy a dejar más plano que una croqueta.',
  'Ni lo intentes. Bueno, inténtalo. Me aburro.',
  '¿Ese es tu gato? Ay, qué ternura.',
  'Hoy no hay siesta para ti.',
  'Mi gato tiene más seguidores que tu isla.',
  'Prepárate para llorar en tres idiomas.',
  'El último que me ganó todavía se está lamiendo.',
];
const CHAMP_TAUNTS = [
  'Este podio es MÍO. Lo compré. Con croquetas.',
  'Llevo invicto desde que me salió el primer bigote.',
  'Tú y tu gato van a salir en el periódico. En la sección de fallecidos. De orgullo.',
];

function hash(n: number) {
  let s = (n * 2654435761) >>> 0;
  s ^= s >>> 16;
  s = Math.imul(s, 0x45d9f3b) >>> 0;
  s ^= s >>> 16;
  return s >>> 0;
}

export interface RivalDef {
  league: number;
  bout: number;
  champion: boolean;
  species: string;
  def: CatDef;
  trainer: string;
  taunt: string;
  level: number;
  stars: number;
  podioLvl: number;
  /** target combat power */
  power: number;
  seed: number;
}

/** target power of a bout */
export function boutPower(lg: number, bout: number) {
  const L = PB.ladder;
  const champ = bout >= L.bouts_per_league - 1;
  return L.league1_power * Math.pow(L.league_growth, lg - 1) * (1 + L.bout_growth * bout) * (champ ? L.champion_mult : 1);
}

/**
 * The rival of (league, bout) for this island. `owned` = species the player registered (secret cats only
 * show up once you have them); `elements` = unlocked elements (no spoilers from unseen elements).
 */
export function rival(lg: number, bout: number, islandSeed: number, elements: string[], owned: Set<string>): RivalDef {
  const lgd = league(lg);
  const champion = bout >= PB.ladder.bouts_per_league - 1;
  const seed = hash(islandSeed ^ (lg * 97 + bout * 13 + 7));
  const okEl = (c: CatDef) => c.elements.every((e) => elements.includes(e));
  const okSecret = (c: CatDef) => !c.secret || owned.has(c.id);
  // past the VACÍO, the trainers bring Heroicos (from VACÍO II) and Divinos (from VACÍO VI) — only the ones
  // you already have (a cat is a card: their copy plays by your copy's rules)
  const okRarity = (c: CatDef) =>
    lgd.rarities.includes(c.rarity) || (owned.has(c.id) && ((c.rarity === 'heroic' && lg >= 9) || (c.rarity === 'divine' && lg >= 13)));
  let pool = CATS.filter((c) => okRarity(c) && okEl(c) && okSecret(c));
  if (pool.length < 2) pool = CATS.filter((c) => lgd.rarities.includes(c.rarity) && okSecret(c));
  if (!pool.length) pool = CATS.filter((c) => c.rarity === 'common');
  // a prize league's champion fights WITH the cat it pays (beat Zarpa to win Zarpa)
  const prizeId = champion ? (PB.champion_prizes as unknown as Record<string, string>)[String(lg)] : undefined;
  const def = (prizeId && CATS.find((c) => c.id === prizeId)) || pool[seed % pool.length];
  const power = boutPower(lg, bout);
  const stars = Math.min(BAL.cats.stars.max, 1 + Math.floor((lg - 1) / 2) + (champion ? 1 : 0));
  // level that gives that power with those stars (econ.catPower)
  const base = catPower(def.rarity, 1, stars);
  const level = Math.max(1, Math.min(60, Math.round(1 + Math.log(power / base) / Math.log(BAL.cats.power_per_level))));
  const podioLvl = Math.max(1, Math.min(PB.levels.max, 1 + Math.round(lg * 1.6 + bout * 0.4) - 1 + (champion ? 2 : 0)));
  const trainer = champion ? CHAMPS[(lg - 1) % CHAMPS.length] : TRAINERS[(seed >>> 3) % TRAINERS.length];
  const taunt = champion ? CHAMP_TAUNTS[(seed >>> 5) % CHAMP_TAUNTS.length] : TAUNTS[(seed >>> 5) % TAUNTS.length];
  return { league: lg, bout, champion, species: def.id, def, trainer, taunt, level, stars, podioLvl, power, seed };
}
