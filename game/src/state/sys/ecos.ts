/**
 * Parte II · Oleada 4 · H59 «Ecos de Vida» (guion 13 · biblia 05 §7.2 · docs/part-ii/27-oleada-4.md §Sistemas).
 *
 * A cat's ECO is another life the same cat could have had: a lighthouse keeper on an island of salt, a pirate of a
 * very small puddle… Every cat that already slept ECO_NIGHTS nights on your island carries its first Eco. Waking it
 * (the ECOS section of the cat's sheet, panels/catEcos.ts) is a memory and a look, NEVER power:
 *  - the cat gets a Momento («Recordó otra vida: …») and a keepsake it didn't have (a hat, sand from another
 *    beach, a scar it never got here) that shows on its sheet with an ink-and-wet-paper wash (toggle VER ECO);
 *  - the first time each cat wakes its Eco it brings back a small keepsake gift (ECO_GIFT_GEMS), paid ONCE per cat
 *    forever through the Parte II ledger (`eco:<uid>`): a replay of the story or a reset never pays it twice;
 *  - stats, damage, levels, stars and forms are untouched (tests/rupturasO4.test.ts checks the battle cat).
 *
 * Canelo already lived his in H36–H38 (his admiral's page): once that form is unlocked his Eco counts as awake.
 *
 * Save data (optional; absent = no Eco ever woke): `G.s.ext.ecos = { awake: { uid → { eco, at } }, hidden: uid[] }`
 *   awake   which Eco each cat woke (the id is stored: a later catalog never changes a cat's past life)
 *   hidden  cats whose Eco look is switched off on the sheet (VER ECO)
 * Normalized on every load; unknown ids and keys are kept (a newer build's Eco), only malformed values go.
 *
 * H59 (use_feature `eco`) counts `feature_eco` when an Eco wakes. If every Eco of the crew is already awake (a save
 * replaying the story after the narrative reset), RECORDAR an awake Eco counts instead: the mission never deadlocks.
 * The ECOS section appears once H58 is done (H59 on its way) or any Eco is awake: Part I saves never see it.
 */
import { G } from '../game';
import type { GameState, OwnedCat } from '../game';
import { CAT_BY_ID } from '../../data/content';
import { claimReward, rewardClaimed } from './rupturasLedger';

export const ECO_FEATURE = 'eco';
/** nights on your island before a cat remembers its first Eco (guion 13 · H59) */
export const ECO_NIGHTS = 3;
/** the keepsake gift of a cat's first Eco (once per cat, ledger `eco:<uid>`) */
export const ECO_GIFT_GEMS = 1;
const MISSION = 'H59';
const DAY = 86_400_000;

export type Keepsake = 'sombrero' | 'arena' | 'cicatriz' | 'bufanda' | 'llave' | 'pluma' | 'concha' | 'estrella' | 'campana' | 'flor' | 'sobre' | 'nota';

export interface EcoDef {
  id: string;
  /** «En otra vida: …» (short, the sheet's title) */
  title: string;
  /** what it remembers (one or two short sentences; the Momento uses the title) */
  memory: string;
  /** what it brought back */
  keepsake: Keepsake;
  /** a short name for the keepsake («un sombrero de pirata») */
  thing: string;
  /** the wash of that life (ink and wet paper) */
  hue: number;
  /** elements whose cats lean toward this life (empty = anyone) */
  el: string[];
}

/**
 * The lives. ids are forever (a cat that woke `farero` keeps it even if this list changes). New lives go at the END.
 * No power, no spoilers: small stories that are funny and a little sad, like the game.
 */
export const ECOS: EcoDef[] = [
  { id: 'farero', title: 'Farero de una isla de sal', memory: 'Cuidó un faro donde nunca pasó un barco. Igual prendía la luz cada noche, por si acaso.', keepsake: 'llave', thing: 'la llave de un faro', hue: 0xf2c14e, el: ['light', 'fire'] },
  { id: 'pirata_charco', title: 'Pirata de un charco', memory: 'Fue pirata de un charco muy pequeño. Le robaba a la lluvia sus barquitos de papel.', keepsake: 'sombrero', thing: 'un sombrero de pirata', hue: 0x2f5d8c, el: ['water', 'storm'] },
  { id: 'panadero', title: 'Panadero de madrugada', memory: 'Amasaba pan a las cuatro de la mañana y se dormía sobre la masa tibia. El pan salía con forma de gato.', keepsake: 'bufanda', thing: 'una bufanda con harina', hue: 0xe8b07a, el: ['fire', 'earth'] },
  { id: 'cartero', title: 'Cartero entre islas', memory: 'Llevaba cartas entre islas que no se hablaban. Las leyó todas. No contó ninguna.', keepsake: 'sobre', thing: 'una carta sin remitente', hue: 0xc9a77c, el: ['wind', 'sound'] },
  { id: 'astronauta', title: 'Astronauta de lata', memory: 'Llegó a la luna en una lata de sardinas. La luna olía a queso, como le habían prometido.', keepsake: 'estrella', thing: 'polvo de una estrella', hue: 0x6b5bd6, el: ['cosmic', 'gravity', 'tech'] },
  { id: 'bibliotecario', title: 'Durmió cien años en una biblioteca', memory: 'Se sabe todos los finales de todos los libros. No te va a contar ninguno.', keepsake: 'pluma', thing: 'una pluma de tinta', hue: 0x7a5c3e, el: ['magic', 'time', 'spirit'] },
  { id: 'pianista', title: 'Pianista de un bar del puerto', memory: 'Tocaba el piano con la cola. Una sola nota, toda la noche. La gente lloraba igual.', keepsake: 'nota', thing: 'una nota que nadie toca', hue: 0x3d3a5c, el: ['sound', 'shadow'] },
  { id: 'jardinero', title: 'Jardinero de flores al revés', memory: 'Cuidó un jardín donde las flores crecían hacia abajo. Las regaba desde el suelo, acostado.', keepsake: 'flor', thing: 'una flor que crece al revés', hue: 0x6aa84f, el: ['nature', 'earth'] },
  { id: 'equilibrista', title: 'Equilibrista de un circo cerrado', memory: 'Caminó en la cuerda floja de un circo que nunca abrió. Nunca se cayó. Nadie lo estaba viendo.', keepsake: 'estrella', thing: 'una estrella de lentejuela', hue: 0xd9455f, el: ['magic', 'light', 'wind'] },
  { id: 'pescador_estrellas', title: 'Pescador de estrellas', memory: 'Pescaba las estrellas que se caían al mar y las devolvía al cielo. Algunas, no.', keepsake: 'estrella', thing: 'una estrella que no devolvió', hue: 0x3b6fb6, el: ['water', 'cosmic', 'light'] },
  { id: 'herrero', title: 'Herrero de un volcán dormido', memory: 'Forjaba campanas que solo sonaban de noche. El volcán roncaba de fondo.', keepsake: 'campana', thing: 'una campana que suena de noche', hue: 0xc8551d, el: ['fire', 'earth', 'crystal'] },
  { id: 'iglu', title: 'Vecino de un pingüino', memory: 'Vivió en un iglú con un pingüino que no le caía bien. Se extrañan.', keepsake: 'bufanda', thing: 'una bufanda tejida por un pingüino', hue: 0x8fc3e6, el: ['ice', 'water'] },
  { id: 'veleta', title: 'La veleta de un campanario', memory: 'Pasó cuarenta años mirando hacia donde soplaba el viento. Ahora mira hacia donde vas tú.', keepsake: 'pluma', thing: 'una pluma de veleta', hue: 0x9aa7b0, el: ['wind', 'storm', 'electric'] },
  { id: 'minero', title: 'Minero de cristal', memory: 'Picó piedra en una mina de cristal. Se trajo un pedacito que todavía brilla cuando nadie lo ve.', keepsake: 'estrella', thing: 'un pedacito de cristal', hue: 0x7fd6d0, el: ['crystal', 'earth', 'gravity'] },
  { id: 'detective', title: 'Detective de una ciudad sin sol', memory: 'Resolvió un solo caso: el del pescado desaparecido. Fue él.', keepsake: 'sombrero', thing: 'un sombrero de detective', hue: 0x4a4458, el: ['shadow', 'void'] },
  { id: 'relojero', title: 'Relojero de un pueblo a las tres', memory: 'Arreglaba relojes en un pueblo donde siempre eran las tres. Nunca supo por qué. Fue feliz.', keepsake: 'llave', thing: 'la llave de un reloj', hue: 0xb08d57, el: ['time', 'tech'] },
  { id: 'naufrago', title: 'Náufrago de un solo árbol', memory: 'Vivió en una isla de un solo árbol. Le puso nombre al árbol. El árbol nunca contestó.', keepsake: 'concha', thing: 'una concha de otra playa', hue: 0x5fa8a0, el: ['water', 'nature'] },
  { id: 'arena', title: 'Durmió en una playa sin mapa', memory: 'Durmió una siesta larguísima en una playa que no sale en ningún mapa. Todavía tiene arena en las patas.', keepsake: 'arena', thing: 'arena de una playa que no existe', hue: 0xe2c48a, el: [] },
  { id: 'almohadas', title: 'Veterano de la guerra de almohadas', memory: 'Peleó nueve años en una guerra de almohadas. Ganó. Le quedó una cicatriz que no se hizo aquí.', keepsake: 'cicatriz', thing: 'una cicatriz que no se hizo aquí', hue: 0xb25b7a, el: [] },
  { id: 'reina', title: 'El gato de una reina seria', memory: 'Fue el gato de una reina que no sabía reír. La hizo reír una vez. Con eso alcanzó.', keepsake: 'flor', thing: 'una flor del jardín de una reina', hue: 0xd98fb0, el: ['light', 'magic', 'spirit'] },
  { id: 'fantasma', title: 'Fantasma de un barco educado', memory: 'Asustaba a los marineros de un barco fantasma. Siempre pedía perdón después.', keepsake: 'campana', thing: 'la campana de un barco que ya no está', hue: 0x8c86b8, el: ['spirit', 'void', 'shadow'] },
];
export const ECO_BY_ID = new Map(ECOS.map((e) => [e.id, e]));

/** Canelo's Eco is the admiral's page he already lived (H36–H38): it counts as awake once that form is unlocked */
export const CANELO_ECO: EcoDef = {
  id: 'canelo_almirante',
  title: 'Almirante de una flota de papel',
  memory: 'Ya la vivió: la página dorada del almirante. ¡A BABOR! Se le nota en cómo da órdenes a la hora de comer.',
  keepsake: 'sombrero',
  thing: 'el bicornio del almirante',
  hue: 0x2b3f7a,
  el: [],
};
const CANELO = 'c_canelo';
const CANELO_FORM_FLAG = 'forma:canelo_almirante';

// ------------------------------------------------------------------ save (ext.ecos)
export interface EcoWoke {
  eco: string;
  at: number;
}
export interface EcosSave {
  awake: Record<string, EcoWoke>;
  hidden: string[];
  [k: string]: unknown;
}
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** pure: a well-formed copy (idempotent; unknown Eco ids and extra keys are kept) */
export function normalizeEcos(raw: unknown): EcosSave {
  const r = isObj(raw) ? raw : {};
  const awake: Record<string, EcoWoke> = {};
  if (isObj(r.awake)) {
    for (const [uid, v] of Object.entries(r.awake)) {
      if (!uid || uid.length > 64) continue;
      const e = isObj(v) ? v : typeof v === 'string' ? { eco: v } : null;
      if (!e || typeof e.eco !== 'string' || !e.eco) continue;
      awake[uid] = { eco: e.eco.slice(0, 64), at: typeof e.at === 'number' && Number.isFinite(e.at) && e.at >= 0 ? e.at : 0 };
    }
  }
  const hidden = Array.isArray(r.hidden) ? [...new Set(r.hidden.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 64))] : [];
  return { ...r, awake, hidden };
}
function read(): EcosSave | null {
  const raw = (G.s?.ext as Record<string, unknown> | undefined)?.ecos;
  return raw === undefined ? null : normalizeEcos(raw);
}
function write(e: EcosSave) {
  (G.s.ext ??= {}).ecos = e;
}
G.afterLoad.push(() => {
  const ext = G.s.ext as Record<string, unknown> | undefined;
  if (ext && ext.ecos !== undefined) ext.ecos = normalizeEcos(ext.ecos);
});

// ------------------------------------------------------------------ pure rules
type EcoSaveView = Pick<GameState, 'cats' | 'missions' | 'flags'> & { ext?: Record<string, unknown> };

/** stable 31-bit hash (FNV-1a) */
function hash(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 1;
}
const dayStart = (ms: number) => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};
/** nights a cat has slept on your island (local midnights since it joined). Cats from before the clock was kept
 *  (bornAtMs 0) have slept there forever. */
export function nightsHome(c: Pick<OwnedCat, 'bornAtMs'>, now = Date.now()): number {
  const b = Number(c.bornAtMs);
  if (!Number.isFinite(b) || b <= 0) return Infinity;
  if (b >= now) return 0;
  return Math.max(0, Math.round((dayStart(now) - dayStart(b)) / DAY));
}

/** the Eco a cat would remember (pure, stable: same cat → same life). An awake cat keeps the one it woke. */
export function ecoFor(c: Pick<OwnedCat, 'uid' | 'species'>, save?: EcoSaveView | null): EcoDef {
  if (c.species === CANELO) return CANELO_ECO;
  const woke = save ? normalizeEcos(save.ext?.ecos).awake[c.uid] : undefined;
  if (woke) return ECO_BY_ID.get(woke.eco) ?? { ...ECOS[hash(woke.eco) % ECOS.length], id: woke.eco };
  const els = CAT_BY_ID.get(c.species)?.elements ?? [];
  const pool = ECOS.filter((e) => !e.el.length || e.el.some((x) => els.includes(x)));
  const list = pool.length ? pool : ECOS;
  return list[hash(`${c.species}|${c.uid}`) % list.length];
}

const missionSeen = (s: EcoSaveView, id: string) => !!s.missions && (s.missions.active.includes(id) || s.missions.done.includes(id));
/** the ECOS section exists for this save (H58 done → H59 appeared, or some Eco already woke) */
export function ecosOpenIn(s: EcoSaveView | null | undefined): boolean {
  if (!s?.missions) return false;
  return !!s.missions.done.includes('H58') || missionSeen(s, MISSION) || Object.keys(normalizeEcos(s.ext?.ecos).awake).length > 0;
}
/** Canelo's page already happened (his admiral form is unlocked) */
const caneloLived = (s: EcoSaveView) => !!s.flags?.[CANELO_FORM_FLAG];

export function ecoAwakeIn(s: EcoSaveView, uid: string): boolean {
  const c = s.cats.find((x) => x.uid === uid);
  if (c?.species === CANELO) return caneloLived(s);
  return !!normalizeEcos(s.ext?.ecos).awake[uid];
}

export type EcoStatus = 'awake' | 'ready' | 'dreaming' | 'none';
/**
 * what the sheet shows for a cat:
 *   awake     its Eco woke (RECORDAR / VER ECO)
 *   ready     slept enough nights: DESPIERTA
 *   dreaming  not yet (n of ECO_NIGHTS nights)
 *   none      the ECOS section doesn't exist yet in this save
 */
export function ecoStatusIn(s: EcoSaveView, uid: string, now = Date.now()): EcoStatus {
  if (!ecosOpenIn(s)) return 'none';
  const c = s.cats.find((x) => x.uid === uid);
  if (!c) return 'none';
  if (ecoAwakeIn(s, uid)) return 'awake';
  if (c.species === CANELO) return 'dreaming';
  if (nightsHome(c, now) >= ECO_NIGHTS) return 'ready';
  // never a deadlock: while H59 waits and nobody else can, the cat that has been home the longest remembers
  if (s.missions.active.includes(MISSION) && fallbackUid(s, now) === uid) return 'ready';
  return 'dreaming';
}
/** while H59 waits and no cat has slept enough nights, the oldest non-Canelo cat without an Eco */
function fallbackUid(s: EcoSaveView, now: number): string | null {
  const free = s.cats.filter((c) => c.species !== CANELO && !normalizeEcos(s.ext?.ecos).awake[c.uid]);
  if (!free.length || free.some((c) => nightsHome(c, now) >= ECO_NIGHTS)) return null;
  return [...free].sort((a, b) => (a.bornAtMs ?? 0) - (b.bornAtMs ?? 0) || (a.uid < b.uid ? -1 : 1))[0].uid;
}
/** cats that can wake their Eco now (stable order: the sleepiest first, then the oldest) */
export function ecosReadyIn(s: EcoSaveView, now = Date.now()): string[] {
  if (!ecosOpenIn(s)) return [];
  const sleepy = (c: OwnedCat) => (c.trait === 'dormilon' || c.trait === 'perezoso' ? 0 : 1);
  return s.cats
    .filter((c) => ecoStatusIn(s, c.uid, now) === 'ready')
    .sort((a, b) => sleepy(a) - sleepy(b) || (a.bornAtMs ?? 0) - (b.bornAtMs ?? 0) || b.level - a.level || (a.uid < b.uid ? -1 : 1))
    .map((c) => c.uid);
}

// ------------------------------------------------------------------ the live save
export const ecosOpen = () => ecosOpenIn(G.s);
export const ecoStatus = (uid: string, now = Date.now()) => ecoStatusIn(G.s, uid, now);
export const ecosReady = (now = Date.now()) => ecosReadyIn(G.s, now);
export const ecoAwake = (uid: string) => ecoAwakeIn(G.s, uid);
export const ecoOf = (uid: string): EcoDef | null => {
  const c = G.s.cats.find((x) => x.uid === uid);
  return c ? ecoFor(c, G.s) : null;
};
/** how many of your cats remember another life (Canelo's page included) */
export function ecosAwakeCount(): number {
  return G.s.cats.filter((c) => ecoAwakeIn(G.s, c.uid)).length;
}
/** the Eco look is on for this cat (awake and not switched off) */
export function ecoShown(uid: string): boolean {
  return ecoAwake(uid) && !(read()?.hidden ?? []).includes(uid);
}
export function setEcoShown(uid: string, on: boolean) {
  if (!ecoAwake(uid)) return;
  const e = read() ?? normalizeEcos({});
  e.hidden = on ? e.hidden.filter((u) => u !== uid) : [...new Set([...e.hidden, uid])];
  write(e);
  G.save();
}

export interface EcoWake {
  eco: EcoDef;
  /** gems of the keepsake gift (0 = this cat already brought one back, ledger) */
  gift: number;
  /** H59 was waiting for it */
  mission: boolean;
}
const ledgerKey = (uid: string) => `eco:${uid}`;

/**
 * DESPIERTA: the cat remembers its Eco. null = it can't now (not ready / already awake / no such cat).
 * Never touches power: a Momento, the keepsake look, the one-time gift, and H59's counter.
 */
export function wakeEco(uid: string, now = Date.now()): EcoWake | null {
  const c = G.s.cats.find((x) => x.uid === uid);
  if (!c || ecoStatus(uid, now) !== 'ready') return null;
  const eco = ecoFor(c, G.s);
  const e = read() ?? normalizeEcos({});
  e.awake[uid] = { eco: eco.id, at: now };
  e.hidden = e.hidden.filter((u) => u !== uid);
  write(e);
  c.moments.push(`Recordó otra vida: ${eco.title.toLowerCase()}. Trajo ${eco.thing}.`);
  let gift = 0;
  if (!rewardClaimed(ledgerKey(uid))) {
    claimReward(ledgerKey(uid), now);
    gift = ECO_GIFT_GEMS;
    G.add('gems', gift, 'eco');
  }
  const mission = G.s.missions.active.includes(MISSION);
  G.count(`feature_${ECO_FEATURE}`);
  G.count('ecos_woken');
  G.save();
  return { eco, gift, mission };
}

/** RECORDAR an awake Eco (the sheet replays the memory). While H59 waits and NO cat can wake one anymore (a replay
 *  after the narrative reset: they all remember already), remembering answers the mission. */
export function rememberEco(uid: string): boolean {
  if (!ecoAwake(uid)) return false;
  if (G.s.missions.active.includes(MISSION) && !ecosReady().length) {
    G.count(`feature_${ECO_FEATURE}`);
    G.save();
    return true;
  }
  return false;
}

/** the cat whose sheet H59's IR opens: one that can wake now (else one that remembers, else the first cat) */
export function ecoCandidate(): string | null {
  const ready = ecosReady();
  if (ready.length) return ready[0];
  const awake = G.s.cats.find((c) => c.species !== CANELO && ecoAwake(c.uid)) ?? G.s.cats.find((c) => ecoAwake(c.uid));
  return awake?.uid ?? G.s.cats[0]?.uid ?? null;
}
