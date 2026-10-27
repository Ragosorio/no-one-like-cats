/**
 * Parte III · LOS GATOS DE LAS CAJAS como coleccionables (GATOS-DATOS; ⚠️ spoilers) — how each one is earned.
 * Design: docs/part-iii/mecanicas-v2/02-loop.md §4 and §7.4; the table cat → where → how lives in
 * docs/part-iii/mecanicas-v2/05-gatos-coleccionables.md. The data is each species' `p3` (data/gateras/especies.json):
 *
 *   historia   the whole cat, once, when its mission is done (Hipólito H73, Gato Araña H76, Murciégato H77, EMIAU H89)
 *   etapa      the FIRST win of a marked node: an élite's captain (B-5, S-5, A-5, L-5, P-5) or a stage the story marks
 *   rescate    a win of a node while its requirement holds (`after: mission:H77`); the node's card says so
 *   actividad  ORBS of the cat per activity battle won (La Ronda's locales, the H80 / H84 / H90 battles), then the cat
 *              when the activity is complete (its mission done / its flag set)
 *   recordar   after the story (H97): a win of a node, or any win of the Carta (Maneki)
 *   + REPEAT:  a repeat win of a box's node gives orbs of a Multidimensional of that box you already have —
 *              BAL.orbs.victory_drop_chance (35 %) × victory_drop_amount (3), SEEDED by the save and the win count
 *   + MANEKI:  her Tienda de la Caja sells orbs of the box cats you have, at the shop's own orb price (panels/TiendaCaja.ts)
 *   Never the Portal, the Casino, the Resonance, the cat shop nor the Podio (multidim.ts isP3Cat / poolableCat).
 *
 * STATE: one flag per cat, `p3cat_<id>` (G.s.flags): set when it is earned, and the cat is adopted right then (a normal
 * discovery: gems, purr, XP — like the Part II story cats). Nothing else is stored, no new save field, no migration.
 * The REVEAL is presentation only: the director plays it on the Carta when calm (ui/story/p3CatsScript.ts → beat
 * `p3cat_<id>` → app/p3CatsFlow.ts). A save without the Parte III never gets a cat (p3Touched()).
 * CATCH-UP: the sources that are plain facts (a mission done, a flag, a first win already won) are re-checked on load
 * and when a mission is done, so an update reaches a save that already passed them. A rescue needs its win.
 */
import { G } from '../game';
import { CATS, CAT_BY_ID, type CatDef, type P3Source } from '../../data/content';
import { BAL } from '../econ';
import { adopt } from './cats';
import { isMultidim, isP3Cat } from './multidim';
import { gateraBattleId, nodesOf, stageOf, type DimId } from './gateras';

/** every cat of the boxes, in Catdex order */
export const P3_CATS: CatDef[] = CATS.filter((c) => isP3Cat(c));
/** the flag (and the presentation beat's key) of a cat */
export const p3Key = (id: string) => `p3cat_${id}`;
export const p3Earned = (id: string) => G.has(p3Key(id));
export const p3Source = (id: string): P3Source | undefined => CAT_BY_ID.get(id)?.p3;
const owns = (id: string) => G.s.cats.some((c) => c.species === id);
const done = (m: string) => G.s.missions.done.includes(m);

/** the save has started the Parte III (a save without it never gets anything: the old fixtures stay as they are) */
export function p3Touched(): boolean {
  return !!G.s?.ext?.gateras || !!G.s?.missions?.done?.includes('H66');
}

/** a requirement: `mission:H72` (done), `flag:x` (set), `won:<dim>:<node>` (won once); empty = true */
export function reqMet(req: string | undefined): boolean {
  if (!req) return true;
  const i = req.indexOf(':');
  const k = req.slice(0, i);
  const v = req.slice(i + 1);
  if (k === 'mission') return done(v);
  if (k === 'flag') return G.has(v);
  if (k === 'won') {
    const [dim, node] = v.split(':');
    return G.has(`won_${gateraBattleId(dim as DimId, node)}`);
  }
  return false;
}
const wonNode = (s: P3Source) => !!s.dim && !!s.node && G.has(`won_${gateraBattleId(s.dim as DimId, s.node)}`);

/** earn a cat (once): the flag, then the adoption — a real discovery. Returns true when it is new */
export function grantP3Cat(id: string): boolean {
  if (!CAT_BY_ID.has(id) || p3Earned(id)) return false;
  G.flag(p3Key(id));
  if (!owns(id)) adopt(id);
  return true;
}

/** does a NODE win (now) earn this source? (etapa: any win until earned; rescate / recordar: while `after` holds) */
function nodeEarns(s: P3Source, dim: string, node: string): boolean {
  if (s.dim !== dim || s.node !== node) return false;
  if (s.kind === 'etapa') return true;
  if (s.kind === 'rescate' || s.kind === 'recordar') return reqMet(s.after);
  return false;
}

/**
 * The sources that are FACTS of the save (catch-up): a mission done, an activity's flag, a first win already won, a
 * rescue whose node was won before its requirement (`catchUp`). Also marks the RUMORS (a rescue that's available, a
 * file the story opens). Returns the cats earned now. Safe to call any time (idempotent, never subtracts).
 */
export function checkP3Cats(): string[] {
  if (!G.s || !p3Touched()) return [];
  const out: string[] = [];
  for (const def of P3_CATS) {
    const s = def.p3;
    if (!s || p3Earned(def.id)) continue;
    // the Catdex hears of it: the story names it, or its rescue is open now
    if (!G.s.catdex[def.id] && ((s.rumor && reqMet(s.rumor)) || ((s.kind === 'rescate' || s.kind === 'recordar') && s.after && reqMet(s.after)))) G.s.catdex[def.id] = 'rumor';
    let ok = false;
    if (s.kind === 'historia') ok = !!s.mission && done(s.mission);
    else if (s.kind === 'actividad') ok = (!!s.mission || !!s.flag) && (!s.mission || done(s.mission)) && (!s.flag || G.has(s.flag));
    else if (s.kind === 'etapa') ok = wonNode(s);
    else if (s.kind === 'rescate' && s.catchUp) ok = reqMet(s.after) && wonNode(s);
    if (ok && grantP3Cat(def.id)) out.push(def.id);
  }
  return out;
}

// ------------------------------------------------------------------ orbs
/** a deterministic hash in [0, 1) of a few integers (murmur3 fmix32 finish) */
function h01(...n: number[]) {
  let h = 0x811c9dc5;
  for (const v of n) {
    h ^= v | 0;
    h = Math.imul(h, 0x01000193) >>> 0;
    h ^= h >>> 13;
  }
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return (h >>> 0) / 0x100000000;
}
const strHash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return h;
};
/** the Multidimensionals of a box (its `origin`) */
export const multidimOf = (dim: string) => P3_CATS.filter((c) => isMultidim(c.rarity) && c.origin === dim).map((c) => c.id);
/** activity orbs per battle won: the shop's «mission orbs» (balance.orbs.mission_orbs = 5) */
export const ACTIVITY_ORBS = () => BAL.orbs.mission_orbs;
/**
 * A repeat win's orbs (02 §4 «Repetir etapas»): a Multidimensional of this box you already have, 35 % of the time,
 * SEEDED by the save (createdAt), the node and how many times it was won — the same win always gives the same.
 */
export function repeatOrbs(dim: string, node: string, wins: number): { species: string; n: number } | null {
  const mine = multidimOf(dim).filter(owns);
  if (!mine.length) return null;
  const seed = Math.floor((G.s.createdAt ?? 0) / 1000) | 0;
  if (h01(seed, strHash(`${dim}:${node}`), wins) >= BAL.orbs.victory_drop_chance) return null;
  const species = mine[Math.floor(h01(seed ^ 0x9e3779b9, strHash(node), wins) * mine.length) % mine.length];
  return { species, n: BAL.orbs.victory_drop_amount };
}

export interface P3WinLoot {
  /** cats earned by this win (in Catdex order) */
  cats: string[];
  /** orbs this win paid (activity or repeat) */
  orbs: { species: string; n: number }[];
}
/**
 * A win of the Carta (gaterasBattles.applyGateraResult calls it after recording the win): the node's cat, the
 * activity's orbs (a locale of La Ronda), a repeat's seeded orbs, Maneki after the story, then the facts (an activity
 * just completed: the round of La Ronda closed). `first` = the first win of that node; `wins` = its win count now.
 */
export function p3OnGateraWin(dim: DimId, node: string, o: { first: boolean; wins: number; ronda: boolean }): P3WinLoot {
  const out: P3WinLoot = { cats: [], orbs: [] };
  if (!G.s) return out;
  for (const def of P3_CATS) {
    const s = def.p3;
    if (!s || p3Earned(def.id)) continue;
    if (nodeEarns(s, dim, node) || (s.anyWin && reqMet(s.after))) if (grantP3Cat(def.id)) out.cats.push(def.id);
  }
  // an activity's orbs: each locale of its Ronda (before the cat joins: «orbes primero, luego el gato»)
  if (o.ronda)
    for (const def of P3_CATS)
      if (def.p3?.orbs?.ronda === dim) {
        G.addOrbs(def.id, ACTIVITY_ORBS());
        out.orbs.push({ species: def.id, n: ACTIVITY_ORBS() });
      }
  // a repeat (never the first win, never a locale): the box's Multidimensional, seeded
  if (!o.first && !o.ronda) {
    const r = repeatOrbs(dim, node, o.wins);
    if (r) {
      G.addOrbs(r.species, r.n);
      out.orbs.push(r);
    }
  }
  for (const id of checkP3Cats()) if (!out.cats.includes(id)) out.cats.push(id);
  return out;
}

/** an activity battle of a story flow was won (its step's beat: `b80_arco1`…): that activity's cat gets its orbs */
export function p3ActivityBeat(beat: string): { species: string; n: number } | null {
  if (!G.s || !p3Touched()) return null;
  for (const def of P3_CATS)
    if (def.p3?.orbs?.beats?.includes(beat)) {
      G.addOrbs(def.id, ACTIVITY_ORBS());
      return { species: def.id, n: ACTIVITY_ORBS() };
    }
  return null;
}

// ------------------------------------------------------------------ what a node of the Carta offers (its card)
/**
 * The lines a node's card shows about cats (scenes/GaterasMapScene.ts): a captain who stays, a new cat as loot, a
 * rescue, the activity's orbs, a repeat's orbs. Spoiler-light: a marked stage says «un gato nuevo», not who.
 */
export function p3NodeHints(dim: DimId, node: string, o: { won: boolean; ronda?: boolean } = { won: false }): string[] {
  const out: string[] = [];
  if (!G.s || !p3Touched()) return out;
  const captainOf = () => {
    const st = /^\d+$/.test(node) ? stageOf(dim, Number(node)) : nodesOf(dim).find((x) => x.id === node);
    return st?.captain;
  };
  for (const def of P3_CATS) {
    const s = def.p3;
    if (!s || p3Earned(def.id) || s.dim !== dim || s.node !== node) continue;
    if (s.kind === 'etapa') out.push(captainOf() === def.id ? `SI LE GANAS, ${def.name.toUpperCase()} SE QUEDA CONTIGO` : 'BOTÍN: ¡UN GATO NUEVO!');
    else if ((s.kind === 'rescate' || s.kind === 'recordar') && reqMet(s.after)) out.push(`RESCATE: ${def.name.toUpperCase()}`);
  }
  if (o.ronda) for (const def of P3_CATS) if (def.p3?.orbs?.ronda === dim) out.push(`+${ACTIVITY_ORBS()} ORBES DE ${def.name.toUpperCase()} POR LOCAL`);
  if (o.won && !o.ronda) {
    const mine = multidimOf(dim).filter(owns);
    if (mine.length) out.push(`REPETIR: ${Math.round(BAL.orbs.victory_drop_chance * 100)} % DE ORBES DE ${mine.map((id) => CAT_BY_ID.get(id)!.name.toUpperCase()).join(' O ')}`);
  }
  return out;
}

// ------------------------------------------------------------------ wiring: the facts are checked on load and when a mission is done
G.afterLoad.push(() => {
  try {
    checkP3Cats();
  } catch (e) {
    console.warn('[p3cats] catch-up', e);
  }
});
G.on('mission', ({ kind }) => {
  if (kind === 'done') checkP3Cats();
});
G.on('beat', ({ id }) => {
  p3ActivityBeat(id);
});
