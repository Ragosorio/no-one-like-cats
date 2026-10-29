/**
 * DESPUÉS DE LA PARTE III · where the post cats come from (docs/post-p3/03-obtencion.md; ⚠️ spoilers of the Parte III).
 * Data, not code: every post cat (data/postp3/especies.json) names its table in `post.source`, with a `weight` inside
 * that table's pool; the tables' rules and the Podio's new champions live here. state/sys/postp3.ts reads both, and
 * nothing here does anything before the Parte III is over (postP3Unlocked) or while a table's pool is empty.
 *
 *   casino:<game>          the cat joins that table's MULTIVERSE pool (every sub-table of it)
 *   casino:<game>:<sub>    …only that sub-table's (the Portal's banners: `michi`, `holo`)
 *   podio:<champion>       a champion of POST_CHAMPIONS fights with it and pays it the first time you beat it
 *
 * A table gives a post cat INSTEAD of one of its legendary or mythic cats: its printed odds (tiers, lines, items) never
 * change, only which legendary / mythic cat comes out. `share` of them come from the pool (each cat by its weight; the
 * ones you don't own ×3, like every casino cat) and `pity` is the guarantee. Every number here is printed in the table's
 * odds panel (panels/casino/postOdds.ts). The tables are the ones that already give cats: the other ones pay coins only.
 *
 * The numbers are DISEÑO's (03-obtencion.md §3.2), provisional until the owner plays the economy: change them here only.
 */
export type PostGame = 'gacha' | 'slot' | 'caja' | 'eterno';

export interface PostCasinoRule {
  /** where it happens, as the odds panel and the Catdex say it («el Portal del Multiverso») */
  place: string;
  /** of the LEGENDARY or MYTHIC cats this table gives, the share that comes from its Multiverse pool (0–1) */
  share: number;
  /** that many legendary / mythic cats of this table in a row without one → the next one is (0 = no guarantee) */
  pity: number;
  /** sub-tables a `casino:<game>:<sub>` source may name (id → name); each one keeps its own guarantee (the Portal's banners) */
  subs?: Readonly<Record<string, string>>;
}

// DISEÑO's numbers (03-obtencion.md §3.2, 04-roster.json → postCasino), approved by the owner 2026-10-28; still his to tune
export const POST_CASINO: Record<PostGame, PostCasinoRule> = {
  gacha: { place: 'el Portal del Multiverso', share: 0.5, pity: 3, subs: { michi: 'PORTAL MICHI', holo: 'MULTIVERSO HOLO' } },
  slot: { place: 'la Tragamichis (con fichas, en las líneas de GATO NEGRO)', share: 0.4, pity: 4 },
  caja: { place: 'La Caja (el Gato Misterioso)', share: 0.6, pity: 2 },
  eterno: { place: 'el MODO ETERNO (el gato del premio)', share: 0.75, pity: 2 },
};

/**
 * LA COPA FUERA DE LA CAJA (03-obtencion.md §5, approved 2026-10-28): eight challenges of the Podio, a row of their own in
 * its lobby — they take no league of the ladder. They go in ORDER (the next one open, the rest sealed), each champion fights
 * with the Heroico it pays (the post cat whose `post.source` is `podio:<id>`) at the power of your frontier league's
 * champion × `mult` (never below league `POST_COPA.minAnchorLeague`), and pays it ONCE (the save's flag `postchamp_<id>`);
 * after that it can be fought again for the league's replay rewards, never the cat. Losing costs nothing.
 */
export interface PostChampion {
  /** forever: `podio:<id>` in its cat's post.source, and the save's flag `postchamp_<id>` once its prize is paid */
  id: string;
  /** its place in the Copa (1 = the first challenge) */
  order: number;
  /** the champion's power: your frontier league champion's × this */
  mult: number;
  /** who brings it (the lobby) */
  trainer?: string;
  /** what it says before the duel (the lobby's rival card) */
  line?: string;
}

/** DISEÑO's 8 champions (03 §5.1; ids, trainers and lines from 04-roster.json → postChampions) */
export const POST_CHAMPIONS: PostChampion[] = [
  { id: 'copa_borracha', order: 1, mult: 1.1, trainer: 'LA INVICTA DE LA BARRA', line: 'Codo en la mesa, gatito. El que suelta primero paga la ronda… de leche.' },
  { id: 'copa_superheroes', order: 2, mult: 1.15, trainer: 'LA LIGA DE LOS AYUDANTES', line: 'Todos fuimos el que esperaba en el coche. Hoy manejamos nosotros.' },
  { id: 'copa_anime', order: 3, mult: 1.2, trainer: 'LA SENSEI DEL TORNEO', line: 'Inclínate. Luego, si puedes, levántate.' },
  { id: 'copa_libros', order: 4, mult: 1.25, trainer: 'LA GUARDIANA DE LA ÚLTIMA PÁGINA', line: 'En mi biblioteca nadie se brinca al final.' },
  { id: 'copa_pop', order: 5, mult: 1.3, trainer: 'LA DJ CAMPEONA', line: 'Si no bailas, pierdes. Si bailas mal, también.' },
  { id: 'copa_pinceles', order: 6, mult: 1.35, trainer: 'EL CURADOR DEL MUSEO', line: 'No toque las obras. Las obras sí lo van a tocar a usted.' },
  { id: 'copa_pantalla', order: 7, mult: 1.4, trainer: 'EL DIRECTOR DE MATINÉ', line: '¡Acción! …y que alguien traiga a la momia.' },
  { id: 'copa_pixel', order: 8, mult: 1.45, trainer: 'EL CAMPEÓN DE LAS FICHAS', line: 'Una ficha, una vida. Yo traigo noventa y nueve.' },
];
/** the Copa's anchor (04-roster.json → postCopa): your frontier league, never below this one; the champion's bout */
export const POST_COPA = { name: 'COPA FUERA DE LA CAJA', minAnchorLeague: 8, bout: 4 } as const;

/**
 * LAS VITRINAS (03-obtencion.md §4, approved 2026-10-28): the seven tables that pay only coins get a showcase of 8 cats
 * each (`post.vitrina: <table>`; the cat ALSO lives in its big table, `post.source`). A bet that counts (≥ 25 fichas, or
 * gold ≥ ¼ of that table's cap) has a fixed chance to open it, rolled apart from the bet (the table's RTP never moves);
 * never in the MODO ETERNO. A throw: consolation or one of its cats you don't have, with three guarantees per showcase
 * (a cat every 5 throws, a Multidimensional every 15, a free pick at 25) and the Sellos of LA CASA TE DEBE (5 = a throw
 * in the showcase you choose). Every number is printed in the table's VITRINA tab (panels/casino/vitrinaOdds.ts).
 */
export type VitrinaTable = 'plinko' | 'dice' | 'hilo' | 'bingo' | 'scratch' | 'boxes' | 'roulette';
export const VITRINA_TABLES: Record<VitrinaTable, { name: string; golden: string }> = {
  plinko: { name: 'PLINKO «LA CASCADA»', golden: 'LA CROQUETA DORADA' },
  dice: { name: 'DUELO DE DADOS', golden: 'EL DADO DORADO DE DON CUBILETE' },
  hilo: { name: 'MAYOR O MENOR', golden: 'LA CARTA DORADA' },
  bingo: { name: 'BINGO EXPRÉS', golden: 'LA BOLITA DORADA' },
  scratch: { name: 'RASCA Y GANA', golden: 'LA CASILLA DORADA' },
  boxes: { name: 'CAJAS MISTERIOSAS', golden: 'LA DÉCIMA CAJA, DORADA' },
  roulette: { name: 'RULETA DEL MULTIVERSO', golden: 'EL BOLSILLO DORADO' },
};
/** DISEÑO's numbers (04-roster.json → postVitrinas) */
export const POST_VITRINA = {
  /** a bet that counts opens the showcase this often */
  chance: 0.006,
  /** what counts: fichas ≥ this, or gold ≥ this fraction of the table's gold cap */
  minChips: 25,
  goldCapFraction: 0.25,
  /** a throw */
  roll: { consolation: 0.6, legendary: 0.14, mythic: 0.11, multidimensional: 0.15 },
  /** a rarity you already completed falls to the next one you lack, in this order */
  fallback: ['multidimensional', 'mythic', 'legendary'],
  /** consolation: orbs of a cat of the showcase you have (by weight), or fichas if you have none; ×3 orbs once it's complete */
  consolation: { orbs: 5, chipsIfNone: 40, completeOrbsMult: 3 },
  /** guarantees (throws): a cat at the latest every `cat`, a Multidimensional every `md`; pick one at `spark` */
  pity: { cat: 5, md: 15, spark: 25 },
  /** LA CASA TE DEBE pays a Sello too; this many Sellos = a throw */
  sellos: { perCandy: 1, perThrow: 5 },
} as const;

export type PostSourceParsed = { kind: 'casino'; game: PostGame; sub?: string } | { kind: 'podio'; champion: string };

const GAMES = Object.keys(POST_CASINO) as PostGame[];
/** `casino:gacha:holo` → { casino, gacha, holo } · `podio:x` → { podio, x } · anything else (or a table that doesn't exist) → null */
export function parsePostSource(src: unknown): PostSourceParsed | null {
  if (typeof src !== 'string') return null;
  const [kind, a, b, ...rest] = src.split(':');
  if (rest.length) return null;
  if (kind === 'casino' && GAMES.includes(a as PostGame)) {
    const subs = POST_CASINO[a as PostGame].subs ?? {};
    if (b !== undefined && !Object.prototype.hasOwnProperty.call(subs, b)) return null;
    return b === undefined ? { kind, game: a as PostGame } : { kind, game: a as PostGame, sub: b };
  }
  if (kind === 'podio' && a && b === undefined && /^[a-z0-9_]+$/.test(a)) return { kind, champion: a };
  return null;
}
